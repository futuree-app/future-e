#!/usr/bin/env python3
"""
populate-bpe.py — accès écoles (collèges+lycées) et culture (offre large) par rayon.

Calque populate-nature.py : pour chaque centroïde de commune (lu dans l'index), compte
les équipements BPE pertinents dans un rayon RAYON_KM, normalise en percentile national.
Accès / présence, JAMAIS la qualité ni la vitalité.

Codes TYPEQU confirmés empiriquement sur la donnée (NOMRS) en Task 1 du plan.

UNE SEULE SOURCE POUR LES DEUX SORTIES (arbitrage porteur, 19/08/2026) : data/bpe25.parquet
alimente les SCORES du comparateur (écoles, culture, études supérieures) ET les SHARDS « autour de
l'adresse » (--face3-shards). Recalculer les scores déplace des rangs sur ~35 000 communes ; c'est
le prix assumé pour que le produit n'ait qu'un millésime à annoncer. Séquence complète après un
changement de millésime (l'ordre compte, chaque étape lit la précédente) :

    npm run index:unpack
    .venv-bpe/bin/python scripts/populate-bpe.py --write-index   # scores + cache producteur
    node scripts/populate-absence-attestations.mts               # attestations d'absence + sha
    .venv-bpe/bin/python scripts/populate-bpe.py --face3-shards  # lieux du module Autour
    npm run index:pack && npm run index:verify

Le script d'attestations REFUSE si la prévalence d'absence d'études supérieures s'écarte de plus de
0,5 point de `ABSENCE_NATIONAL_CONTEXT` (src/lib/decision/absence-facts.ts) : ce chiffre est écrit
dans des phrases lues par l'utilisateur, il se met à jour à la main, avec sa version.

Le parquet est hors dépôt (cf. .gitignore). Pour le régénérer :
    1. télécharger la BPE géolocalisée du millésime voulu sur insee.fr
       (BPE 2025 : https://www.insee.fr/fr/statistiques/8217525, fichier « BPE 2025 géolocalisée »)
    2. l'enregistrer en data/bpe25.parquet
    3. dérouler la séquence ci-dessus
       (--parquet <chemin> et --millesime <AAAA> pour travailler sur un autre fichier)

Usage (depuis un venv avec pyarrow + numpy, cf. .venv-bpe) :
    python scripts/populate-bpe.py                 # scores : calcule + écrit le cache producteur
    python scripts/populate-bpe.py --write-index   # en plus, patche comparateur-index.json
    python scripts/populate-bpe.py --face3-shards  # shards de lieux du module Autour
    python scripts/populate-bpe.py --selftest      # règles de rayon, d'adresse et de doublons
"""
import json, os, sys, argparse, bisect
import numpy as np
import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
# UNE SEULE SOURCE POUR LES DEUX SORTIES (arbitrage porteur, 19/08/2026). Les scores du comparateur
# et les lieux « autour de l'adresse » décrivent les mêmes équipements : les tenir sur deux
# millésimes revenait à comparer deux photographies différentes du même pays, et à ne pas pouvoir
# répondre « de quand datent vos équipements ? » par une seule phrase.
PARQUET = os.path.join(ROOT, "data", "bpe25.parquet")
PARQUET_FACE3 = PARQUET
CACHE = os.path.join(ROOT, "data", ".cache")
OUT = os.path.join(CACHE, "communes-bpe.json")

# Rayon d'accès ADAPTATIF au type de territoire (cf. spec 2026-06-04-rayon-bpe-adaptatif).
# Le rayon suit la mobilité acceptée par les habitants, PAS la taxonomie des cartes.
# tailleVille (pop d'UU, sinon pop communale)  ->  rayon
#   >= 500 000 (vraie métropole)        5 km
#   100 000 - 500 000 (grande ville)   10 km
#   30 000 - 100 000 (ville moyenne)   15 km
#   < 30 000 ou null (rural / isolé)   25 km
# 25 km en rural assume la doctrine « ne jamais pénaliser le rural par défaut » : même
# à 25 km, une métropole reste devant en nombre d'équipements (comparabilité conservée).
RADIUS_TABLE = ((500_000, 5.0), (100_000, 10.0), (30_000, 15.0))
RADIUS_RURAL = 25.0
CELL = 0.18  # grille spatiale, comme populate-nature.py

# Confirmés sur la donnée (échantillon NOMRS, métropole + DOM concordants).
# Écoles = secondaire : collège + lycées (gén/techno, pro, agricole). Le critère répond à
# « puis-je scolariser mes enfants ici ? » (projet familial).
# CHOIX PRODUIT, pas une absence d'intérêt :
#   - C5xx (enseignement supérieur) volontairement EXCLUS : ils répondent à une autre question
#     (études, dynamisme étudiant, attractivité urbaine), qui pourra alimenter un signal distinct.
#   - C304/C305 (sections internes) exclus pour ne pas double-compter un même site.
#   - primaire/maternelle exclus (quasi universels, peu discriminants).
ECOLES_TYPEQU = {"C201", "C301", "C302", "C303"}
# Culture au sens large : cinéma, conservatoire (pratique), bibliothèque/médiathèque, musée,
# théâtre/salle de spectacle/scène. Exclus : F313 (monuments/jardins = tourisme), F314 (archives).
CULTURE_TYPEQU = {"F303", "F305", "F307", "F312", "F315"}
# Enseignement supérieur : universités, écoles, STS/CPGE, santé, autres (cf. spec vie étudiante).
SUP_TYPEQU = {"C501", "C502", "C503", "C504", "C505", "C509"}

# Colonnes confirmées dans le schéma du parquet BPE24.
COL_TYPE = "TYPEQU"
COL_LAT = "LATITUDE"
COL_LON = "LONGITUDE"


def haversine_np(lat0, lon0, lats, lons):
    R = 6371.0
    p0 = np.radians(lat0); lp = np.radians(lats)
    dphi = lp - p0
    dlmb = np.radians(lons - lon0)
    a = np.sin(dphi / 2) ** 2 + np.cos(p0) * np.cos(lp) * np.sin(dlmb / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def radius_for(taille):
    """Rayon d'accès en km selon tailleVille. None -> rural (25 km)."""
    if taille is None:
        return RADIUS_RURAL
    for seuil, r in RADIUS_TABLE:
        if taille >= seuil:
            return r
    return RADIUS_RURAL


def build_uupop(idx_communes):
    """Somme des populations communales par code UU (réplique uuPopCache côté TS).
    Itère sur TOUTES les communes de l'index (y compris non géolocalisées) : une UU
    pèse par sa population totale, pas seulement ses communes géolocalisées."""
    uupop = {}
    for c in idx_communes:
        uu = c.get("uu")
        pop = c.get("population")
        if uu and pop is not None:
            uupop[uu] = uupop.get(uu, 0) + pop
    return uupop


def taille_ville(c, uupop):
    """Pop d'UU si la commune appartient à une UU connue, sinon sa pop communale
    (une commune hors UU est son propre bassin). Réplique tailleVille() côté TS."""
    uu = c.get("uu")
    if uu and uu in uupop:
        return uupop[uu]
    return c.get("population")


def millesime_du_parquet(parquet_path, force=None):
    """Le millésime, LU DANS LA DONNÉE (colonne AN). Refuse plutôt que de supposer une année."""
    if force:
        return force
    t = pq.read_table(parquet_path, columns=["AN"])
    ans = sorted({(a or "").strip() for a in t.column("AN").to_pylist() if a})
    if len(ans) != 1:
        sys.exit(f"millésime indéterminé (colonne AN : {ans}) — passer --millesime")
    return ans[0]


def load_equip_points(typequ_set):
    """Retourne (lats, lons) des équipements dont TYPEQU est dans typequ_set, géoloc valide."""
    t = pq.read_table(PARQUET, columns=[COL_TYPE, COL_LAT, COL_LON])
    types = np.array(t.column(COL_TYPE).to_pylist(), dtype=object)
    lats = np.array(t.column(COL_LAT).to_pylist(), dtype="float64")
    lons = np.array(t.column(COL_LON).to_pylist(), dtype="float64")
    keep = np.isin(types, list(typequ_set)) & np.isfinite(lats) & np.isfinite(lons)
    return lats[keep], lons[keep]


# Voisinage grille : ±2 cellules (±0.36° avec CELL=0.18) couvre 25 km partout, y compris
# en longitude vers Dunkerque (~51°N, 25 km ≈ 0.357°) et dans les DOM. cf. spec.
NEI = 2

# Échelle FIXE de décroissance de l'accès (= rayon max). La pente ne dépend PAS du type de
# territoire : un équipement à 20 km vaut moins qu'à 2 km, universellement. Le rayon
# adaptatif ne sert que de COUPURE (au-delà du rayon accepté = 0). Découpler décroissance
# et coupure répare l'inversion centre/périphérie (un villageois ne doit pas dépasser le
# habitant de la ville pour l'accès aux équipements de cette ville). cf. spec.
DMAX = 25.0


def count_within_radius(clat, clon, elat, elon, radius):
    """Pour chaque commune i : (accès pondéré, compte d'équipements). L'accès PONDÉRÉ compte chaque
    équipement à distance d <= radius[i] pour (1 - d/DMAX) ; le COMPTE est le simple nombre d'équipements
    dans le rayon (int((d <= radius[i]).sum())), distinct de la somme pondérée : il vaut 0 ssi aucun
    équipement, sans le cas-frontière du poids nul à d == DMAX. Grille spatiale pour éviter le O(n*m)."""
    grid = {}
    for j in range(len(elat)):
        grid.setdefault((int(elat[j] // CELL), int(elon[j] // CELL)), []).append(j)
    out = np.zeros(len(clat), dtype=np.float64)
    counts = np.zeros(len(clat), dtype=np.int64)
    for i in range(len(clat)):
        ci, cj = int(clat[i] // CELL), int(clon[i] // CELL)
        idxs = []
        for di in range(-NEI, NEI + 1):
            for dj in range(-NEI, NEI + 1):
                idxs += grid.get((ci + di, cj + dj), [])
        if not idxs:
            continue
        idxs = np.array(idxs)
        d = haversine_np(clat[i], clon[i], elat[idxs], elon[idxs])
        win = d <= radius[i]
        out[i] = float((1.0 - d[win] / DMAX).sum())
        counts[i] = int(win.sum())
    return out, counts


def percentile_scores(counts):
    """Percentile national de l'accès pondéré (bisect ; floats, ne PAS caster en int)."""
    srt = sorted(float(c) for c in counts)
    n = len(srt)
    return [round(100 * bisect.bisect_right(srt, float(c)) / n) if n else None for c in counts]


def selftest():
    # Bornes exactes de la table de rayons.
    assert radius_for(None) == 25.0
    assert radius_for(0) == 25.0
    assert radius_for(29_999) == 25.0
    assert radius_for(30_000) == 15.0
    assert radius_for(99_999) == 15.0
    assert radius_for(100_000) == 10.0
    assert radius_for(499_999) == 10.0
    assert radius_for(500_000) == 5.0
    assert radius_for(12_000_000) == 5.0
    # Reconstruction pop d'UU : somme par code, ignore pop null, ignore uu null.
    up = build_uupop([
        {"uu": "00851", "population": 100},
        {"uu": "00851", "population": 50},
        {"uu": None, "population": 800},
        {"uu": "00851", "population": None},
    ])
    assert up == {"00851": 150}, up
    # tailleVille : UU connue -> pop d'UU ; hors UU -> pop communale ; UU inconnue -> pop communale.
    assert taille_ville({"uu": "00851", "population": 100}, up) == 150
    assert taille_ville({"uu": None, "population": 800}, up) == 800
    assert taille_ville({"uu": "99999", "population": 700}, up) == 700
    # ÉQUIVALENCE absence (lot 2a) : establishmentCount == 0 <=> weightedAccess == 0, hors le cas-frontière
    # rural (poids nul à d == DMAX). Communes à (0,0) et (0,1) ; un équipement à ~5 km de la première.
    clat = np.array([0.0, 0.0]); clon = np.array([0.0, 1.0])
    elat = np.array([0.0]); elon = np.array([5.0 / 111.195])  # ~5 km à l'est de la 1re commune
    rad = np.array([25.0, 25.0])
    wa, cnt = count_within_radius(clat, clon, elat, elon, rad)
    assert cnt[0] == 1 and wa[0] > 0, (cnt.tolist(), wa.tolist())  # présent -> compte 1, poids > 0
    assert cnt[1] == 0 and wa[1] == 0, (cnt.tolist(), wa.tolist())  # absent -> compte 0, poids 0
    for i in range(2):
        assert (cnt[i] == 0) == (wa[i] == 0)  # l'équivalence tient hors cas-frontière

    # ── ADRESSE LISIBLE : le type de voie n'est jamais doublé, l'inconnu n'est jamais imprimé ──
    assert adresse_lisible("6", "", "GR", "GRANDE RUE", "17290", "CIRÉ-D'AUNIS") == \
        "6 GRANDE RUE, 17290 CIRÉ-D'AUNIS"
    assert adresse_lisible("1", "", "RUE", "DE LA MAIRIE", "17290", "CIRÉ-D'AUNIS") == \
        "1 RUE DE LA MAIRIE, 17290 CIRÉ-D'AUNIS"
    assert adresse_lisible("4", "BIS", "AV", "DES TILLEULS", "17000", "LA ROCHELLE") == \
        "4BIS AVENUE DES TILLEULS, 17000 LA ROCHELLE"
    assert adresse_lisible("", "", "ZZZ", "LE BOURG", "17290", "BALLON") == "LE BOURG, 17290 BALLON"
    assert adresse_lisible("", "", "", "", "17290", "BALLON") == "17290 BALLON"
    assert adresse_lisible("", "", "", "", "", "") == ""

    # ── DOUBLONS PHYSIQUES : le cas réel des deux boulangeries du 6 Grande Rue ─────────────────
    boulangeries = [
        {"t": "B207", "lat": 46.05462, "lon": -0.93143, "adresse": "6 GRANDE RUE, 17290 CIRÉ-D'AUNIS",
         "nom": "LE LION GOURMAND", "siret": "97849145400010"},
        {"t": "B207", "lat": 46.05462, "lon": -0.93143, "adresse": "6 GRANDE RUE, 17290 CIRÉ-D'AUNIS",
         "nom": "BOULANGERIE DE CIRE D'AUNIS", "siret": "50989862300020"},
    ]
    lieux = grouper_lieux(boulangeries)
    assert len(lieux) == 1, lieux            # un seul lieu, pas deux boulangeries
    assert len(lieux[0]) == 2                # les deux exploitants sont conservés
    # L'ordre ne dépend pas de celui du parquet : il est trié par SIRET.
    assert [m["siret"] for m in lieux[0]] == ["50989862300020", "97849145400010"]
    assert grouper_lieux(list(reversed(boulangeries)))[0] == lieux[0]

    # Deux types différents au même point restent deux lieux (la poste et la banque d'un même hall).
    assert len(grouper_lieux([
        {"t": "A203", "lat": 46.0, "lon": -1.0, "adresse": "1 RUE X", "nom": "BANQUE", "siret": "1"},
        {"t": "A206", "lat": 46.0, "lon": -1.0, "adresse": "1 RUE X", "nom": "POSTE", "siret": "2"},
    ])) == 2

    # Même libellé d'adresse (un lieu-dit), mais 1,5 km d'écart : deux lieux distincts.
    assert len(grouper_lieux([
        {"t": "B202", "lat": 46.0000, "lon": -1.0000, "adresse": "LE BOURG, 17290 X", "nom": "A", "siret": "1"},
        {"t": "B202", "lat": 46.0135, "lon": -1.0000, "adresse": "LE BOURG, 17290 X", "nom": "B", "siret": "2"},
    ])) == 2
    # La même adresse à 40 m (deux entrées géocodées du même commerce) : un seul lieu.
    assert len(grouper_lieux([
        {"t": "B202", "lat": 46.00000, "lon": -1.00000, "adresse": "LE BOURG, 17290 X", "nom": "A", "siret": "1"},
        {"t": "B202", "lat": 46.00036, "lon": -1.00000, "adresse": "LE BOURG, 17290 X", "nom": "B", "siret": "2"},
    ])) == 1
    # Sans adresse renseignée, seul le point identique regroupe.
    assert len(grouper_lieux([
        {"t": "B202", "lat": 46.00000, "lon": -1.00000, "adresse": "", "nom": "A", "siret": "1"},
        {"t": "B202", "lat": 46.00036, "lon": -1.00000, "adresse": "", "nom": "B", "siret": "2"},
    ])) == 2

    print("✓ selftest OK", file=sys.stderr)


# ── Face 3 « autour de cette adresse » : shards de POINTS par cellule de grille ──
# Le comparateur agrège BPE à la commune ; la Face 3 garde les points pour un calcul
# « plus proche par catégorie » au point géocodé (runtime TS). Codes TYPEQU confirmés
# empiriquement sur NOMRS (métropole + DOM), 2026-07-03. FACE3_CELL DOIT égaler
# GRID_CELL_DEG de src/lib/geo-grid.ts.
FACE3_CELL = 0.18
FACE3_DIR = os.path.join(ROOT, "data", "bpe-points")
FACE3_CATS = {
    "sante":        {"D265", "D307"},                          # médecin généraliste, pharmacie
    "alimentation": {"B105", "B201", "B202", "B204", "B207", "B208"},  # supermarché/supérette/épicerie, boucherie, boulangerie, primeur
    "education":    {"C107", "C108", "C109"},                  # maternelle, primaire, élémentaire
    "transports":   {"E107", "E108", "E109"},                  # gares & haltes voyageurs
    "services":     {"A203", "A206"},                          # banque, bureau de poste
}


# ── L'ADRESSE LISIBLE D'UN ÉQUIPEMENT ────────────────────────────────────────────────────────
# La BPE donne la voie en abrégé (TYPVOIE) et son libellé (LIBVOIE), qui se recouvrent souvent
# (« GR » + « GRANDE RUE »). On développe les abréviations courantes, on ne répète pas ce que le
# libellé porte déjà, et on ÉCARTE l'abréviation inconnue plutôt que d'écrire du jargon.
# La casse d'origine (tout en capitales, accents partiels) est CONSERVÉE ici : c'est la donnée
# source. La mise en forme lisible se fait au rendu (`nomEquipementLisible`, testé côté TS).
TYPVOIE_LONG = {
    "RUE": "RUE", "AV": "AVENUE", "PL": "PLACE", "RTE": "ROUTE", "BD": "BOULEVARD",
    "CHE": "CHEMIN", "ALL": "ALLEE", "GR": "GRANDE RUE", "BRG": "BOURG", "CRS": "COURS",
    "IMP": "IMPASSE", "LD": "LIEU-DIT", "QUAI": "QUAI", "QUA": "QUAI", "CTRE": "CENTRE",
    "SQ": "SQUARE", "RES": "RESIDENCE", "LOT": "LOTISSEMENT", "FG": "FAUBOURG",
    "ESP": "ESPLANADE", "PAS": "PASSAGE", "HAM": "HAMEAU", "MTE": "MONTEE", "VLA": "VILLA",
    "CITE": "CITE", "PARC": "PARC", "PONT": "PONT", "PORT": "PORT", "QU": "QUAI",
}


def _sans_accents(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def adresse_lisible(numvoie, indrep, typvoie, libvoie, codpos, libcom):
    """« 6 GRANDE RUE, 17290 CIRÉ-D'AUNIS ». Chaîne vide si rien d'exploitable."""
    libvoie = (libvoie or "").strip()
    voie = ""
    if libvoie:
        long = TYPVOIE_LONG.get((typvoie or "").strip().upper())
        # Le libellé porte déjà le type de voie (« GRANDE RUE ») : ne pas le doubler.
        prefixe = long if long and not _sans_accents(libvoie).upper().startswith(long) else ""
        voie = f"{prefixe} {libvoie}".strip()
    numero = f"{(numvoie or '').strip()}{(indrep or '').strip()}".strip()
    rue = f"{numero} {voie}".strip()
    ville = f"{(codpos or '').strip()} {(libcom or '').strip()}".strip()
    return ", ".join(p for p in (rue, ville) if p)


# ── LA POLITIQUE DE DOUBLONS PHYSIQUES ───────────────────────────────────────────────────────
#
# POURQUOI ELLE EXISTE (premier test réel, 16/08/2026). La BPE recense des ÉTABLISSEMENTS, pas des
# lieux. Au 6 Grande Rue à Ciré-d'Aunis, elle porte DEUX boulangeries : « BOULANGERIE DE CIRE
# D'AUNIS » (SIRET 509 898 623) et « LE LION GOURMAND » (SIRET 978 491 454), au même point, dans le
# millésime 2024 COMME dans le millésime 2025. Deux conséquences, toutes deux fausses à l'écran :
#   • l'ordre des lignes du parquet décidait laquelle nommer, donc potentiellement l'ancienne ;
#   • le comptage « à portée de pas » en voyait deux, et annonçait un choix qui n'existe pas.
# Même motif pour les cabinets partagés : quatre médecins au 4 rue du Four, un seul lieu où aller.
#
# LA RÈGLE. Deux enregistrements du MÊME type sont le même LIEU s'ils partagent le même point
# (coordonnées identiques à 5 décimales, soit ~1 m) ou la même adresse à moins de 100 m. Un lieu
# n'est nommé que si UN SEUL établissement y est recensé dans ce millésime. Sinon, le lieu porte son
# adresse, le nombre d'enregistrements, et la liste des exploitants POUR L'AUDIT : le produit n'a
# pas de quoi dire lequel est en activité, et il ne le devine pas.
DOUBLON_ADRESSE_MAX_M = 100.0


def _hav_m(lat1, lon1, lat2, lon2):
    import math
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def grouper_lieux(records):
    """records : liste de dicts {t, lat, lon, adresse, nom, siret} de la MÊME cellule.
    Rend une liste de lieux, chacun = liste d'enregistrements. Déterministe."""
    parent = list(range(len(records)))

    def trouve(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def unir(i, j):
        ri, rj = trouve(i), trouve(j)
        if ri != rj:
            parent[max(ri, rj)] = min(ri, rj)

    par_point, par_adresse = {}, {}
    for i, r in enumerate(records):
        cle_point = (r["t"], round(r["lat"], 5), round(r["lon"], 5))
        par_point.setdefault(cle_point, []).append(i)
        if r["adresse"]:
            par_adresse.setdefault((r["t"], r["adresse"]), []).append(i)
    for idxs in par_point.values():
        for i in idxs[1:]:
            unir(idxs[0], i)
    for idxs in par_adresse.values():
        # Même libellé d'adresse ne suffit pas : un lieu-dit peut couvrir plusieurs centaines de
        # mètres. La distance tranche.
        for a in range(len(idxs)):
            for b in range(a + 1, len(idxs)):
                ra, rb = records[idxs[a]], records[idxs[b]]
                if _hav_m(ra["lat"], ra["lon"], rb["lat"], rb["lon"]) <= DOUBLON_ADRESSE_MAX_M:
                    unir(idxs[a], idxs[b])

    lieux = {}
    for i in range(len(records)):
        lieux.setdefault(trouve(i), []).append(records[i])
    # Ordre stable des lieux ET de leurs membres : deux exécutions doivent écrire le même fichier.
    return [sorted(m, key=lambda r: (r["siret"], r["nom"])) for _, m in sorted(lieux.items())]


def write_face3_shards(parquet_path=None, millesime=None):
    import math
    parquet_path = parquet_path or PARQUET_FACE3
    code_to_cat = {code: cat for cat, codes in FACE3_CATS.items() for code in codes}
    all_types = list(code_to_cat)
    cols = [COL_TYPE, COL_LAT, COL_LON, "NOMRS", "SIRET", "STATUT_DIFFUSION",
            "NUMVOIE", "INDREP", "TYPVOIE", "LIBVOIE", "CODPOS", "LIBCOM", "AN"]
    t = pq.read_table(parquet_path, columns=cols)
    col = {c: t.column(c).to_pylist() for c in cols}
    millesime = millesime_du_parquet(parquet_path, millesime)

    cells = {}
    gardes = 0
    for i, ty in enumerate(col[COL_TYPE]):
        la, lo = col[COL_LAT][i], col[COL_LON][i]
        if ty not in all_types or la is None or lo is None:
            continue
        if not (math.isfinite(la) and math.isfinite(lo)):
            continue
        # STATUT_DIFFUSION = "P" : établissement partiellement diffusible (SIRENE). Son nom et son
        # adresse ne sont pas publiables ; dans les faits ces lignes n'ont pas de géolocalisation
        # non plus, donc elles n'arrivent pas ici. On l'écrit quand même : la protection ne doit pas
        # dépendre d'un effet de bord de la donnée.
        protege = (col["STATUT_DIFFUSION"][i] or "").strip().upper() == "P"
        gardes += 1
        key = f"g_{math.floor(la / FACE3_CELL)}_{math.floor(lo / FACE3_CELL)}"
        cells.setdefault(key, []).append({
            "t": ty, "lat": round(float(la), 6), "lon": round(float(lo), 6),
            "nom": "" if protege else (col["NOMRS"][i] or "").strip(),
            "siret": "" if protege else (col["SIRET"][i] or "").strip(),
            "adresse": "" if protege else adresse_lisible(
                col["NUMVOIE"][i], col["INDREP"][i], col["TYPVOIE"][i],
                col["LIBVOIE"][i], col["CODPOS"][i], col["LIBCOM"][i],
            ),
        })

    os.makedirs(FACE3_DIR, exist_ok=True)
    total_lieux, total_ambigus = 0, 0
    for key, records in cells.items():
        points = []
        for membres in grouper_lieux(records):
            tete = membres[0]
            p = {"c": code_to_cat[tete["t"]], "t": tete["t"], "lat": tete["lat"], "lon": tete["lon"]}
            if tete["adresse"]:
                p["a"] = tete["adresse"]
            if len(membres) == 1:
                if tete["nom"]:
                    p["n"] = tete["nom"]
                if tete["siret"]:
                    p["i"] = tete["siret"]
            else:
                # AUCUN NOM CHOISI. Le produit ne sait pas lequel est en activité, et l'ordre du
                # parquet n'est pas une réponse. `x` dit combien d'enregistrements, `s` les
                # conserve pour l'audit (c'est ce qui permettra, un jour, de trancher avec une
                # source datée d'activité).
                p["x"] = len(membres)
                p["s"] = [
                    {k: v for k, v in (("n", m["nom"]), ("i", m["siret"])) if v}
                    for m in membres
                ]
                total_ambigus += 1
            points.append(p)
        total_lieux += len(points)
        # Ordre stable dans le fichier : catégorie, type, position.
        points.sort(key=lambda p: (p["c"], p["t"], p["lat"], p["lon"]))
        with open(os.path.join(FACE3_DIR, f"{key}.json"), "w") as f:
            json.dump(
                {"cell": key, "millesime": millesime, "points": points},
                f, ensure_ascii=False, separators=(",", ":"),
            )
    print(
        f"✓ Face 3 (BPE {millesime}) : {len(cells)} cellules, {gardes} enregistrements "
        f"-> {total_lieux} lieux, dont {total_ambigus} à plusieurs exploitants -> {FACE3_DIR}",
        file=sys.stderr,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--face3-shards", action="store_true")
    # Le millésime BPE n'est PAS figé dans le script : le fichier source change chaque année, et
    # le millésime lu dans la colonne AN est écrit dans chaque shard, puis affiché au lecteur.
    ap.add_argument("--parquet", default=None, help="parquet BPE source des shards (défaut : data/bpe25.parquet)")
    ap.add_argument("--millesime", default=None, help="forcer le millésime (défaut : colonne AN)")
    args = ap.parse_args()

    if args.face3_shards:
        write_face3_shards(args.parquet, args.millesime)
        return

    if args.selftest:
        selftest()
        return

    global PARQUET
    PARQUET = args.parquet or PARQUET
    # Le millésime est lu AVANT tout calcul : un index doit pouvoir dire de quelle photographie du
    # pays ses scores sont tirés, et il ne le disait pas jusqu'au 19/08/2026.
    millesime = millesime_du_parquet(PARQUET, args.millesime)
    print(f"source : {os.path.basename(PARQUET)} (BPE {millesime})", file=sys.stderr)
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    codes = [c["insee"] for c in communes]
    clat = np.array([c["lat"] for c in communes], dtype="float64")
    clon = np.array([c["lon"] for c in communes], dtype="float64")
    print(f"communes géolocalisées : {len(communes)}", file=sys.stderr)

    uupop = build_uupop(idx["communes"])
    radius = np.array([radius_for(taille_ville(c, uupop)) for c in communes], dtype="float64")
    # Distribution des classes de rayon, pour contrôle visuel.
    import collections as _c
    dist = _c.Counter(radius.tolist())
    print("rayons (km -> communes) : "
          + ", ".join(f"{int(k)}:{v}" for k, v in sorted(dist.items())), file=sys.stderr)

    rec = {code: {} for code in codes}
    est_counts = None  # vrai compte d'établissements du supérieur par commune (aligné sur codes), lot 2a
    for field, typeset in (("ecoles", ECOLES_TYPEQU), ("culture", CULTURE_TYPEQU), ("etudes_acces", SUP_TYPEQU)):
        elat, elon = load_equip_points(typeset)
        print(f"{field} : {len(elat)} équipements géolocalisés", file=sys.stderr)
        counts, ecount = count_within_radius(clat, clon, elat, elon, radius)  # (accès pondéré, compte)
        scores = percentile_scores(counts)
        if field == "etudes_acces":
            est_counts = ecount
        for i, code in enumerate(codes):
            # count = accès pondéré (somme des 1 - d/DMAX), debug only, plus un entier.
            rec[code][field] = {"score": scores[i], "count": round(float(counts[i]), 2)}

    os.makedirs(CACHE, exist_ok=True)
    # Forme { meta, communes } : le meta de complétude sert au patch d'attestations (lot 2a).
    json.dump({"meta": {"complete": True, "communeCount": len(idx["communes"])}, "communes": rec}, open(OUT, "w"))
    print(f"✓ cache écrit : {OUT} ({len(rec)} communes)", file=sys.stderr)

    if args.write_index:
        rfor = {code: int(radius[i]) for i, code in enumerate(codes)}        # rayon effectif (5/10/15/25) par commune
        ecnt = {code: int(est_counts[i]) for i, code in enumerate(codes)}    # vrai compte d'établissements sup
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
            # etudes_acces : on n'expose que le percentile (number), pas le count.
            c["etudes_acces"] = r["etudes_acces"]["score"] if r else None
            if r is not None:
                # Attestation champ FRÈRE (lot 2a). weightedAccess = accès pondéré brut ; establishmentCount =
                # vrai compte (airtight). Pas de conventionVersion par commune (elle vit dans index.meta).
                c["etudesSup"] = {
                    "measured": True,
                    "weightedAccess": r["etudes_acces"]["count"],
                    "establishmentCount": ecnt.get(c["insee"], 0),
                    "radiusKm": rfor.get(c["insee"], 25),
                }
            else:
                c["etudesSup"] = None
        # LE MILLÉSIME EST ÉCRIT DANS LE META, à côté des scores qu'il a produits. Sans lui, deux
        # index aux rangs différents sont indiscernables, et personne ne peut dire de quand datent
        # les équipements comptés. Même exigence que le champ `millesime` des shards.
        idx["meta"] = {**idx.get("meta", {}), "bpeMillesime": millesime,
                       "bpeSource": os.path.basename(PARQUET)}
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché (ecoles + culture + etudes_acces + etudesSup, BPE {millesime})", file=sys.stderr)


if __name__ == "__main__":
    main()
