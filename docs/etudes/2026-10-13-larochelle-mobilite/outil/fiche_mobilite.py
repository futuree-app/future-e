#!/usr/bin/env python3
"""fiche_mobilite.py — Fiche factuelle « se déplacer depuis cette commune », réexécutable par code INSEE.

Ce script est la partie RÉUTILISABLE de l'étude La Rochelle du 13/10/2026. Il ne rédige rien : il extrait,
calcule, contrôle, et écrit une fiche structurée (fiche.json) et sa lecture humaine (fiche.md). Chaque fait
porte sa valeur, sa définition, sa source, son millésime, sa maille, sa date de récupération, ses limites,
ses contrôles et, quand il le faut, une demande de vérification humaine.

    python fiche_mobilite.py --insee 17300 --out fiches/17300 --cache cache \
        --mobpro /chemin/rp-mobpro-2022.parquet --bpe /chemin/bpe25.parquet \
        --index data/comparateur-index.json.gz [--voisines 17200,17291] [--jour 2026-10-13] \
        [--gtfs URL|auto|aucun] [--rayon-carburant 12] [--etapes mobpro,iris,acces,carburant]

Dépendances : Python 3.11+, pandas, pyarrow, numpy, shapely, pyproj (pas le venv du projet).
Réseau : INSEE, IGN Géoplateforme, BAN, geo.api.gouv.fr, transport.data.gouv.fr, prix-carburants.
Tout téléchargement passe par `fetch()` : mis en cache, horodaté, empreinte SHA-256 dans cache/journal.json.
"""
import argparse, datetime as dt, gzip, hashlib, json, math, os, re, sys, urllib.parse, urllib.request, zipfile
import xml.etree.ElementTree as ET
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
from pyproj import Transformer

UA = {"User-Agent": "futur-e-fiche-mobilite/1.0"}
TRANS = {1: "pas_de_transport", 2: "marche", 3: "velo", 4: "deux_roues_mot", 5: "voiture", 6: "tc"}
URL = {
    "mobpro_page": "https://www.insee.fr/fr/statistiques/8589904",
    "mobpro_parquet": "https://www.insee.fr/fr/statistiques/fichier/8589904/RP2022_mobpro.parquet",
    "iris_activite": "https://www.insee.fr/fr/statistiques/fichier/8647006/base-ic-activite-residents-2022_csv.zip",
    "iris_logement": "https://www.insee.fr/fr/statistiques/fichier/8647012/base-ic-logement-2022_csv.zip",
    "iris_wfs": "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='{insee}'",
    "ban": "https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-{dep}.csv.gz",
    "geo": "https://geo.api.gouv.fr/communes/{insee}?fields=nom,codeEpci,epci,codeDepartement,centre,population",
    "tdg": "https://transport.data.gouv.fr/api/datasets?format=GTFS",
    "carbu_annee": "https://donnees.roulez-eco.fr/opendata/annee/{y}",
    "carbu_instantane": "https://donnees.roulez-eco.fr/opendata/instantane",
}
MOBPRO_ROWS = 7_388_023
L93 = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)
NOW = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Sources : cache + journal ────────────────────────────────────────────────────────────────
class Sources:
    def __init__(self, cache):
        self.cache = cache; os.makedirs(cache, exist_ok=True)
        self.path = os.path.join(cache, "journal.json")
        self.j = json.load(open(self.path)) if os.path.exists(self.path) else {}

    def fetch(self, url, name, max_age_h=None):
        """Télécharge une fois ; `max_age_h` force le rafraîchissement des flux « latest »."""
        p = os.path.join(self.cache, name)
        e = self.j.get(name)
        stale = e and max_age_h is not None and (
            dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(e["recupere_le"].replace("Z", "+00:00"))).total_seconds() > max_age_h * 3600
        if not os.path.exists(p) or stale:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=600) as r, open(p, "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b:
                        break
                    f.write(b)
            h = hashlib.sha256(open(p, "rb").read()).hexdigest()
            self.j[name] = {"url": url, "recupere_le": NOW, "octets": os.path.getsize(p), "sha256": h}
            json.dump(self.j, open(self.path, "w"), indent=1, ensure_ascii=False)
        return p

    def ref(self, name):
        e = self.j.get(name, {})
        return {"url": e.get("url"), "recupere_le": e.get("recupere_le"), "sha256": (e.get("sha256") or "")[:16]}


def get_json(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120))


def fait(id, libelle, valeur, definition, source, millesime, maille, statut="calculé", dans_moteur="non",
         limites=(), controles=(), verif=None, **extra):
    return {"id": id, "libelle": libelle, "valeur": valeur, "definition": definition, "source": source,
            "millesime": millesime, "maille": maille, "statut": statut, "dans_moteur": dans_moteur,
            "limites": list(limites), "controles": list(controles), "verification_humaine": verif, **extra}


def wilson(w, cond):
    """Intervalle 95 % approximatif : n effectif de Kish / 1,5 (effet ménage). Ordre de grandeur."""
    W = w.sum()
    if W == 0:
        return None
    p = float((w * cond).sum() / W); n = W * W / (w * w).sum() / 1.5; z = 1.96
    d = 1 + z * z / n; c = (p + z * z / (2 * n)) / d; h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return {"p": round(p, 3), "bas": round(c - h, 3), "haut": round(c + h, 3), "lignes": int(len(w)), "n_eff": round(n)}


def fragilite(lignes):
    return "masqué" if lignes < 40 else "fragile" if lignes < 150 else "ok"


# ── Contexte : commune, voisines ─────────────────────────────────────────────────────────────
def contexte(a, src):
    geo = get_json(URL["geo"].format(insee=a.insee))
    idx = {c["insee"]: c for c in json.load(gzip.open(a.index))["communes"]}
    me = idx.get(a.insee)
    if a.voisines:
        vois = [v for v in a.voisines.split(",") if v]
    elif me and me.get("uu") and not me.get("hors_uu"):
        same = sorted([c for c in idx.values() if c.get("uu") == me["uu"] and c["insee"] != a.insee],
                      key=lambda c: -(c.get("population") or 0))
        vois = [c["insee"] for c in same[:6]]
    else:
        vois = []
    return {"insee": a.insee, "nom": geo["nom"], "dep": geo["codeDepartement"], "epci": geo.get("epci"),
            "centre": geo["centre"]["coordinates"], "uu": me.get("uu") if me else None,
            "voisines": {v: idx[v]["nom"] for v in vois if v in idx}, "index": idx}


# ── 1. MOBPRO ────────────────────────────────────────────────────────────────────────────────
def etape_mobpro(a, ctx, src, F, T):
    pf = pq.ParquetFile(a.mobpro)
    meta_ok = pf.metadata.num_rows == MOBPRO_ROWS
    C = [ctx["insee"]] + list(ctx["voisines"])
    cols = ["COMMUNE", "DCLT", "ILT", "TRANS", "VOIT", "STOCD", "IPONDI"]
    res = pq.read_table(a.mobpro, columns=cols, filters=[("COMMUNE", "in", C)]).to_pandas()
    inb = pq.read_table(a.mobpro, columns=cols, filters=[("DCLT", "=", ctx["insee"])]).to_pandas()
    for d in (res, inb):
        for c in ["COMMUNE", "DCLT", "VOIT", "STOCD"]:
            d[c] = d[c].astype(str)
        d["mode"] = d["TRANS"].map(lambda x: TRANS[int(x)])
    S = "INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)"
    DEF = "Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI"
    LIM = ["Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.",
           "Pratiques du recensement 2022 (collectes 2020 à 2024).",
           "Mode et lieu de travail issus d'un échantillon : intervalles indicatifs."]
    ctl = [f"Nombre de lignes du fichier = {MOBPRO_ROWS} : {'oui' if meta_ok else 'NON'}"]
    me = res[res.COMMUNE == ctx["insee"]]
    w = me["IPONDI"]
    modes = {m: wilson(w, me["mode"] == m) for m in TRANS.values()}
    ip = (ctx["index"].get(ctx["insee"]) or {}).get("mobilite") or {}
    egal = ip.get("part_voiture") is not None and abs(ip["part_voiture"] - modes["voiture"]["p"]) < 0.001
    F.append(fait("mobpro.modes", "Mode principal pour aller travailler", modes, DEF, S, "2022", "commune de résidence",
                  dans_moteur="part voiture seulement (index mobilite.part_voiture, affichée en rang)",
                  limites=LIM + ["Le dénominateur inclut « pas de transport » (travail à domicile)."],
                  controles=ctl + [f"Égal à l'index (part voiture {ip.get('part_voiture')}) : {'oui' if egal else 'NON'}"]))
    F.append(fait("mobpro.travaille_dans_commune", "Actifs travaillant dans leur commune de résidence",
                  wilson(w, me["ILT"] == 1), "Part des actifs occupés dont la commune de travail est la commune de résidence",
                  S, "2022", "commune de résidence", limites=LIM[:2]))
    # Mode selon la destination (pièce maîtresse de l'étude La Rochelle)
    rows = []
    for d, g in me.groupby("DCLT"):
        if len(g) >= 40:
            s = g.groupby("mode")["IPONDI"].sum() / g["IPONDI"].sum()
            rows.append({"travail": d, "nom": (ctx["index"].get(d) or {}).get("nom", d), "lignes": len(g),
                         "fragilite": fragilite(len(g)), "part_des_actifs": round(g["IPONDI"].sum() / w.sum(), 3),
                         **{k: round(float(s.get(k, 0)), 3) for k in TRANS.values()}})
    rows.sort(key=lambda r: -r["part_des_actifs"])
    T["modes_par_destination"] = rows
    dans = me[me.DCLT == ctx["insee"]]; hors = me[me.DCLT != ctx["insee"]]
    vois = me[me.DCLT.isin(list(ctx["voisines"]))]
    F.append(fait("mobpro.voiture_selon_destination", "Part de la voiture selon le lieu de travail",
                  {"meme_commune": wilson(dans.IPONDI, dans["mode"] == "voiture"),
                   "communes_voisines": wilson(vois.IPONDI, vois["mode"] == "voiture"),
                   "ailleurs": wilson(hors.IPONDI, hors["mode"] == "voiture")},
                  "Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre", S, "2022",
                  "commune de résidence × commune de travail", limites=LIM,
                  controles=[f"Voisines retenues : {', '.join(ctx['voisines'].values()) or 'aucune'}"],
                  verif="Le choix des voisines change le chiffre « communes voisines » : le relire."))
    # Posséder / utiliser
    mot = me[me.VOIT.isin(["1", "2", "3"])]
    F.append(fait("mobpro.posseder_utiliser", "Possession au ménage et usage pour travailler", {
        "actifs_menage_sans_voiture": wilson(w, me.VOIT == "0"),
        "actifs_menage_2_voitures_plus": wilson(w, me.VOIT.isin(["2", "3"])),
        "menage_motorise_mais_pas_en_voiture": wilson(mot.IPONDI, mot["mode"] != "voiture")},
        "VOIT = voitures du ménage de l'actif. Parts d'ACTIFS, pas de ménages", S, "2022", "commune de résidence",
        limites=LIM + ["Ne pas lire « ménages sans voiture » : voir la base IRIS Logement pour les ménages."]))
    occ = {}
    for lab, codes in [("proprietaires", ["10"]), ("locataires_prive", ["21", "23"]), ("locataires_hlm", ["22"])]:
        s = me[me.STOCD.isin(codes)]
        if len(s) >= 40:
            occ[lab] = {"voiture": wilson(s.IPONDI, s["mode"] == "voiture"), "velo": wilson(s.IPONDI, s["mode"] == "velo"),
                        "menage_sans_voiture": wilson(s.IPONDI, s.VOIT == "0"),
                        "menage_2_voitures_plus": wilson(s.IPONDI, s.VOIT.isin(["2", "3"]))}
    F.append(fait("mobpro.statut_occupation", "Selon le statut d'occupation du logement", occ,
                  "STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM", S, "2022", "commune de résidence", limites=LIM))
    # Vue inverse : qui vient travailler ici
    W = inb.IPONDI.sum()
    uu = [c for c, e in ctx["index"].items() if ctx["uu"] and e.get("uu") == ctx["uu"]]
    vue = {}
    for lab, m in [("habitent_la_commune", inb.COMMUNE == ctx["insee"]),
                   ("reste_unite_urbaine", inb.COMMUNE.isin(uu) & (inb.COMMUNE != ctx["insee"])),
                   ("hors_unite_urbaine", ~inb.COMMUNE.isin(uu + [ctx["insee"]]))]:
        s = inb[m]
        vue[lab] = {"part_des_emplois": round(float(s.IPONDI.sum() / W), 3) if W else None,
                    "voiture": wilson(s.IPONDI, s["mode"] == "voiture"), "tc": wilson(s.IPONDI, s["mode"] == "tc")}
    F.append(fait("mobpro.qui_vient_travailler", "Actifs qui travaillent dans la commune, selon leur lieu de résidence",
                  {"actifs_travaillant_ici": round(float(W)), **vue},
                  "Actifs occupés dont la commune de travail est la commune étudiée", S, "2022", "commune de travail",
                  limites=LIM + ["« Unité urbaine » = INSEE 2020, via l'index."]))
    # Voisines : modes comparés + flux vers la commune
    comp = []
    for v, nom in ctx["voisines"].items():
        g = res[res.COMMUNE == v]
        if len(g) == 0:
            continue
        f = g[g.DCLT == ctx["insee"]]
        comp.append({"insee": v, "nom": nom, "voiture": wilson(g.IPONDI, g["mode"] == "voiture")["p"],
                     "velo": wilson(g.IPONDI, g["mode"] == "velo")["p"], "tc": wilson(g.IPONDI, g["mode"] == "tc")["p"],
                     "vers_commune_etudiee": {"lignes": len(f), "fragilite": fragilite(len(f)),
                                              "voiture": wilson(f.IPONDI, f["mode"] == "voiture"), "velo": wilson(f.IPONDI, f["mode"] == "velo")} if len(f) else None})
    T["voisines"] = comp


# ── 2. IRIS ──────────────────────────────────────────────────────────────────────────────────
def etape_iris(a, ctx, src, F, T):
    pa = src.fetch(URL["iris_activite"], "iris_activite_2022.zip"); pl = src.fetch(URL["iris_logement"], "iris_logement_2022.zip")
    C = [ctx["insee"]] + list(ctx["voisines"])
    def lire(p, nom):
        with zipfile.ZipFile(p) as z:
            df = pd.read_csv(z.open(nom), sep=";", dtype=str)
            names = {}
            meta = [n for n in z.namelist() if n.lower().startswith("meta")][0]
            for line in z.open(meta).read().decode("utf-8").splitlines():
                r = line.split(";")
                if len(r) > 4 and r[0] == "IRIS":
                    names[r[3]] = r[4]
        return df[df["COM"].isin(C)].copy(), names
    act, names = lire(pa, "base-ic-activite-residents-2022.CSV"); log, _ = lire(pl, "base-ic-logement-2022.CSV")
    mc = ["C22_ACTOCC15P", "C22_ACTOCC15P_PAS", "C22_ACTOCC15P_MAR", "C22_ACTOCC15P_VELO", "C22_ACTOCC15P_VOIT",
          "C22_ACTOCC15P_TCOM", "P22_ACTOCC15P", "P22_ACTOCC15P_ILT1"]
    lc = ["P22_RP", "P22_RP_VOIT1P", "P22_RP_VOIT2P", "P22_RP_GARL"]
    for d, cs in ((act, mc), (log, lc)):
        for c in cs:
            d[c] = pd.to_numeric(d[c].str.replace(",", "."), errors="coerce")
    df = act[["IRIS", "COM", "TYP_IRIS"] + mc].merge(log[["IRIS"] + lc], on="IRIS", how="outer")
    df["nom"] = df["IRIS"].map(names)
    def ratios(d):
        o = pd.DataFrame(index=d.index)
        o["actifs"] = d["C22_ACTOCC15P"].round(0)
        for k, c in [("voiture", "VOIT"), ("velo", "VELO"), ("marche", "MAR"), ("tc", "TCOM"), ("aucun", "PAS")]:
            o[k] = (d[f"C22_ACTOCC15P_{c}"] / d["C22_ACTOCC15P"]).round(3)
        o["menages"] = d["P22_RP"].round(0)
        o["menages_sans_voiture"] = (1 - d["P22_RP_VOIT1P"] / d["P22_RP"]).round(3)
        o["menages_2_voitures_plus"] = (d["P22_RP_VOIT2P"] / d["P22_RP"]).round(3)
        o["menages_stationnement_reserve"] = (d["P22_RP_GARL"] / d["P22_RP"]).round(3)
        return o
    out = pd.concat([df[["IRIS", "COM", "TYP_IRIS", "nom"]], ratios(df)], axis=1)
    T["iris"] = out[out.COM == ctx["insee"]].sort_values("voiture").to_dict("records")
    T["_iris_df"] = out
    com = ratios(df.groupby("COM")[mc + lc].sum())
    T["communes_iris"] = com.reset_index().to_dict("records")
    h = out[(out.COM == ctx["insee"]) & (out.TYP_IRIS == "H")]
    S = "INSEE, RP 2022, bases infracommunales Activité des résidents et Logement"
    ref = [src.ref("iris_activite_2022.zip"), src.ref("iris_logement_2022.zip")]
    if len(h) >= 2:
        F.append(fait("iris.ecart_voiture", "Part de la voiture pour aller travailler, du quartier le moins au plus motorisé",
                      {"min": float(h.voiture.min()), "iris_min": h.loc[h.voiture.idxmin(), "nom"],
                       "max": float(h.voiture.max()), "iris_max": h.loc[h.voiture.idxmax(), "nom"], "iris_habitat": int(len(h))},
                      "C22_ACTOCC15P_VOIT / C22_ACTOCC15P, IRIS d'habitat (TYP_IRIS = H)", S, "2022", "IRIS",
                      limites=["Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points.",
                               "Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers."],
                      controles=[f"IRIS de moins de 300 actifs : {int((h.actifs < 300).sum())}"],
                      verif="Relire les libellés d'IRIS avant de les citer comme noms de quartiers.", sources=ref))
    else:
        F.append(fait("iris.ecart_voiture", "Écart entre quartiers", None, "Commune non découpée en IRIS d'habitat", S, "2022", "commune",
                      statut="non applicable", limites=["Pas de différence interne mesurable avec cette source."], sources=ref))
    # Contrôle de cohérence IRIS / MOBPRO : la somme des IRIS doit retrouver la commune
    c0 = com.loc[ctx["insee"]] if ctx["insee"] in com.index else None
    mob = next((f for f in F if f["id"] == "mobpro.modes"), None)
    if c0 is not None and mob:
        ok = abs(float(c0["voiture"]) - mob["valeur"]["voiture"]["p"]) < 0.005
        F.append(fait("iris.coherence_mobpro", "Contrôle : IRIS agrégés = fichier détail", {"iris": float(c0["voiture"]), "mobpro": mob["valeur"]["voiture"]["p"]},
                      "Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail", S, "2022", "commune",
                      statut="contrôle", controles=[f"Écart < 0,5 point : {'oui' if ok else 'NON'}"]))
    F.append(fait("iris.menages_commune", "Ménages de la commune et voiture", {k: float(c0[k]) for k in ["menages_sans_voiture", "menages_2_voitures_plus", "menages_stationnement_reserve"]} if c0 is not None else None,
                  "Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)", S, "2022", "commune",
                  dans_moteur="part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse",
                  limites=["Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO."], sources=ref))


# ── 3. Accès depuis les adresses ─────────────────────────────────────────────────────────────
BPE_CATS = {"commerce_alim": ["B104", "B105", "B201", "B202", "B207"], "grande_surface": ["B104", "B105"],
            "pharmacie": ["D307"], "medecin_generaliste": ["D265"], "ecole_elementaire": ["C108", "C109"],
            "college": ["C201"], "gare": ["E107", "E108", "E109"]}
SCOLAIRE = re.compile(r"coll[eè]ge|lyc[ée]e|scolaire|[ée]cole|\bLP\b|\bLEP\b", re.I)


def choisir_gtfs(a, ctx, src):
    if a.gtfs == "aucun":
        return None, "désactivé"
    if a.gtfs != "auto":
        return a.gtfs, "fourni"
    epci = (ctx["epci"] or {}).get("code")
    d = json.load(open(src.fetch(URL["tdg"], "tdg_gtfs.json", max_age_h=24)))
    cand = [x for x in d if any(c.get("type") == "epci" and c.get("insee") == epci for c in x.get("covered_area", []))
            and "urban" in (x.get("sub_types") or [])]
    if not cand:
        return None, f"aucun jeu GTFS urbain dont la couverture est l'EPCI {epci} : vérification humaine"
    x = cand[0]
    r = [r for r in x["resources"] if r.get("format") == "GTFS"]
    return (r[0]["url"] if r else None), f"auto : « {x['title']} » ({x['page_url']}), {len(cand)} candidat(s)"


def etape_acces(a, ctx, src, F, T):
    from shapely.geometry import shape, Point
    from shapely.strtree import STRtree
    C = [ctx["insee"]] + list(ctx["voisines"])
    ban = pd.read_csv(src.fetch(URL["ban"].format(dep=ctx["dep"]), f"ban_{ctx['dep']}.csv.gz", max_age_h=24 * 30), sep=";", dtype=str,
                      usecols=["id", "code_insee", "lon", "lat", "x", "y"])
    ban = ban[ban.code_insee.isin(C)].copy()
    for c in ["lon", "lat", "x", "y"]:
        ban[c] = ban[c].astype(float)
    geoms, codes = [], []
    for c in C:
        for f in json.load(open(src.fetch(URL["iris_wfs"].format(insee=c), f"iris_ign_{c}.json")))["features"]:
            geoms.append(shape(f["geometry"])); codes.append(f["properties"]["code_iris"])
    tree = STRtree(geoms)
    def iris_of(lo, la):
        p = Point(lo, la)
        for i in tree.query(p):
            if geoms[i].contains(p):
                return codes[i]
    ban["IRIS"] = [iris_of(x, y) for x, y in zip(ban.lon, ban.lat)]
    ir = T.get("_iris_df")
    men = ir.set_index("IRIS")["menages"].to_dict() if ir is not None else {}
    cnt = ban.groupby("IRIS")["id"].count().to_dict()
    ban["poids"] = [men.get(i, np.nan) / cnt[i] if i in cnt and men.get(i) else np.nan for i in ban.IRIS]
    non_rattache = float(ban.IRIS.isna().mean())
    A = ban[["x", "y"]].to_numpy()
    def nearest(P):
        best = np.full(len(A), np.inf)
        for i in range(0, len(P), 200):
            best = np.minimum(best, np.sqrt(((A[:, None, :] - P[None, i:i + 200, :]) ** 2).sum(-1)).min(1))
        return best
    bpe = pq.read_table(a.bpe, columns=["TYPEQU", "LAMBERT_X", "LAMBERT_Y", "AN"], filters=[("DEP", "=", ctx["dep"])]).to_pandas().dropna(subset=["LAMBERT_X"])
    bpe_an = sorted(bpe["AN"].astype(str).unique().tolist())
    for k, tq in BPE_CATS.items():
        P = bpe[bpe.TYPEQU.isin(tq)][["LAMBERT_X", "LAMBERT_Y"]].astype(float).drop_duplicates().to_numpy()
        ban[f"d_{k}"] = nearest(P) if len(P) else np.inf
    # GTFS
    url, comment = choisir_gtfs(a, ctx, src)
    gtfs_info = {"choix": comment, "url": url}
    ban["bus_7_9h"] = np.nan; ban["bus_20_22h"] = np.nan
    if url:
        z = zipfile.ZipFile(src.fetch(url, f"gtfs_{ctx['epci']['code'] if ctx['epci'] else ctx['insee']}.zip", max_age_h=24 * 7))
        rd = lambda n, **k: pd.read_csv(z.open(n), dtype=str, **k)
        routes, trips = rd("routes.txt"), rd("trips.txt")
        day = a.jour.replace("-", ""); wd = dt.date.fromisoformat(a.jour).strftime("%A").lower()
        act = set()
        if "calendar.txt" in z.namelist():
            cal = rd("calendar.txt")
            act = set(cal[(cal[wd] == "1") & (cal.start_date <= day) & (cal.end_date >= day)].service_id)
            gtfs_info["validite"] = [cal.start_date.min(), cal.end_date.max()]
        if "calendar_dates.txt" in z.namelist():
            cd = rd("calendar_dates.txt")
            act |= set(cd[(cd.date == day) & (cd.exception_type == "1")].service_id)
            act -= set(cd[(cd.date == day) & (cd.exception_type == "2")].service_id)
        tr = trips[trips.service_id.isin(act)]
        st = rd("stop_times.txt", usecols=["trip_id", "stop_id", "departure_time"])
        st = st[st.trip_id.isin(set(tr.trip_id))].dropna(subset=["departure_time"])
        st["h"] = st.departure_time.str.split(":").str[0].astype(int)
        # LIGNES RÉGULIÈRES : >= 10 courses dans la journée de référence. Le NOM ne décide pas : à La Rochelle,
        # la ligne 6 « Lycée Vieljeux <> Place de Verdun » (58 courses) est une ligne urbaine, alors que les
        # vraies lignes scolaires font 0 à 5 courses. Un nom scolaire au-dessus du seuil est signalé pour relecture.
        n_courses = tr.groupby("route_id").trip_id.nunique()
        lname = (routes.route_short_name.fillna("") + " " + routes.route_long_name.fillna(""))
        reg = routes[routes.route_id.map(lambda r: n_courses.get(r, 0) >= 10)]
        gtfs_info["lignes_retenues"] = sorted((reg.route_short_name.fillna("") + " " + reg.route_long_name.fillna("")).tolist())
        gtfs_info["lignes_ecartees"] = int(len(routes) - len(reg))
        gtfs_info["a_relire_nom_scolaire_mais_frequente"] = sorted(lname[routes.route_id.isin(reg.route_id) & lname.str.contains(SCOLAIRE)].tolist())
        gtfs_info["courses_jour"] = int(tr[tr.route_id.isin(reg.route_id)].trip_id.nunique())
        st = st[st.trip_id.isin(set(tr[tr.route_id.isin(reg.route_id)].trip_id))]
        stops = rd("stops.txt")
        sx, sy = L93.transform(stops.stop_lon.astype(float).to_numpy(), stops.stop_lat.astype(float).to_numpy())
        spos = pd.DataFrame({"X": sx, "Y": sy}, index=stops.stop_id)
        def par_heure(h0, h1, R=400):
            s = st[(st.h >= h0) & (st.h < h1)]
            by = s.groupby("stop_id").trip_id.apply(set); by = by[by.index.isin(spos.index)]
            P = spos.loc[by.index].to_numpy(); sets = list(by.values); out = np.zeros(len(A))
            for i in range(len(A)):
                near = np.nonzero(np.sqrt(((P - A[i]) ** 2).sum(1)) <= R)[0]
                if len(near):
                    out[i] = len(set().union(*[sets[j] for j in near])) / (h1 - h0)
            return out
        ban["bus_7_9h"] = par_heure(7, 9); ban["bus_20_22h"] = par_heure(20, 22)
    T["_adresses"] = ban
    def resume(df):
        w = df.poids.fillna(0); W = w.sum()
        if W == 0:
            return None
        sh = lambda m: round(float((w * m).sum() / W), 3)
        o = {f"{k}_500m": sh(df[f"d_{k}"] <= 500) for k in BPE_CATS if k not in ("college", "gare")}
        o["college_1km"] = sh(df.d_college <= 1000); o["gare_2km"] = sh(df.d_gare <= 2000)
        o["panier_quotidien_500m"] = sh((df.d_commerce_alim <= 500) & (df.d_pharmacie <= 500) & (df.d_ecole_elementaire <= 500))
        if df.bus_7_9h.notna().any():
            o["bus_8h_7_9h"] = sh(df.bus_7_9h >= 8); o["aucun_bus_7_9h"] = sh(df.bus_7_9h == 0); o["bus_4h_20_22h"] = sh(df.bus_20_22h >= 4)
        return o
    T["acces_communes"] = {c: resume(ban[ban.code_insee == c]) for c in C}
    T["acces_iris"] = {i: resume(g) for i, g in ban[ban.code_insee == ctx["insee"]].groupby("IRIS")}
    F.append(fait("acces.adresses", "Part des ménages (estimée) dont l'adresse a chaque service à proximité",
                  T["acces_communes"][ctx["insee"]],
                  "Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. "
                  "Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus",
                  f"BAN ; INSEE BPE {'/'.join(bpe_an)} ; GTFS ({gtfs_info['choix']})", f"BPE {'/'.join(bpe_an)}, GTFS du jour {a.jour}",
                  "adresse, agrégée à la commune et à l'IRIS",
                  dans_moteur="proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus",
                  limites=["Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.",
                           "Point BPE = adresse de l'établissement, pas son entrée.",
                           "Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet."],
                  controles=[f"Adresses non rattachées à un IRIS : {non_rattache:.1%}",
                             f"Jour de référence {a.jour} dans la validité GTFS {gtfs_info.get('validite')}"],
                  verif="Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.",
                  gtfs=gtfs_info))


# ── 4. Carburants ────────────────────────────────────────────────────────────────────────────
def base_carburants(src, annees):
    """Une seule fois pour toutes les communes : (station, lat, lon, carburant, maj, prix) en parquet."""
    out = os.path.join(src.cache, f"carburants_{'_'.join(map(str, annees))}.parquet")
    if os.path.exists(out):
        return pd.read_parquet(out)
    rows = []
    for y in annees:
        z = zipfile.ZipFile(src.fetch(URL["carbu_annee"].format(y=y), f"carbu_{y}.zip", max_age_h=24 if y == dt.date.today().year else None))
        with z.open(z.namelist()[0]) as fh:
            for _, el in ET.iterparse(fh):
                if el.tag != "pdv":
                    continue
                try:
                    la, lo = float(el.get("latitude")) / 1e5, float(el.get("longitude")) / 1e5
                except (TypeError, ValueError):
                    el.clear(); continue
                for p in el.findall("prix"):
                    if p.get("nom") in ("Gazole", "E10") and p.get("valeur"):
                        v = float(p.get("valeur")); v = v / 1000 if v > 10 else v
                        rows.append((el.get("id"), la, lo, p.get("nom"), p.get("maj")[:19], v))
                el.clear()
    df = pd.DataFrame(rows, columns=["pdv", "lat", "lon", "carburant", "maj", "prix"])
    df["maj"] = pd.to_datetime(df.maj, errors="coerce"); df = df.dropna(subset=["maj"])
    df = df[(df.prix > 0.8) & (df.prix < 4)]
    df.to_parquet(out)
    return df


def etape_carburant(a, ctx, src, F, T):
    y = dt.date.fromisoformat(a.jour).year
    df = base_carburants(src, [y - 1, y])
    lo0, la0 = ctx["centre"]
    d = 6371 * 2 * np.arcsin(np.sqrt(np.sin(np.radians(df.lat - la0) / 2) ** 2 + np.cos(np.radians(la0)) * np.cos(np.radians(df.lat)) * np.sin(np.radians(df.lon - lo0) / 2) ** 2))
    loc = df[d <= a.rayon_carburant].copy()
    loc["semaine"] = loc.maj.dt.to_period("W-SUN").dt.start_time
    last = loc.sort_values("maj").groupby(["pdv", "carburant", "semaine"]).tail(1)
    heb = last.groupby(["carburant", "semaine"]).prix.agg(["median", "count"]).reset_index()
    T["carburants_hebdo"] = heb.assign(semaine=heb.semaine.dt.strftime("%Y-%m-%d")).to_dict("records")
    ref = pd.Timestamp(a.jour) - pd.Timedelta(days=7)
    wk = ref.to_period("W-SUN").start_time; wk0 = wk - pd.Timedelta(weeks=52)  # même semaine, un an plus tôt
    val = {}
    for c in ["Gazole", "E10"]:
        h = heb[heb.carburant == c].set_index("semaine")
        if wk in h.index and wk0 in h.index:
            val[c] = {"semaine_ref": wk.strftime("%Y-%m-%d"), "prix": round(float(h.loc[wk, "median"]), 3),
                      "semaine_un_an_avant": wk0.strftime("%Y-%m-%d"), "prix_un_an_avant": round(float(h.loc[wk0, "median"]), 3),
                      "ecart": round(float(h.loc[wk, "median"] - h.loc[wk0, "median"]), 3), "stations": int(h.loc[wk, "count"])}
    n = int(loc.pdv.nunique())
    F.append(fait("carburant.evolution", f"Prix médian à la pompe, stations à moins de {a.rayon_carburant} km", val,
                  "Dernier prix déclaré par station dans la semaine, médiane entre stations",
                  "prix-carburants.gouv.fr, flux officiel (archives annuelles)", f"{y - 1} à {a.jour}", f"stations à {a.rayon_carburant} km du centre",
                  limites=["Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.",
                           "Une hausse passée ne dit rien de l'avenir."],
                  controles=[f"Stations dans le rayon : {n} ({'suffisant' if n >= 8 else 'FAIBLE : élargir le rayon'})"],
                  sources=[src.ref(f"carbu_{y - 1}.zip"), src.ref(f"carbu_{y}.zip")]))


# ── Sorties ──────────────────────────────────────────────────────────────────────────────────
def pct(x):
    return "n.d." if x is None else f"{x * 100:.0f} %"


def ecrire(a, ctx, src, F, T):
    os.makedirs(a.out, exist_ok=True)
    ad = T.pop("_adresses", None); T.pop("_iris_df", None)
    if ad is not None:
        ad.drop(columns=["x", "y"]).to_csv(os.path.join(a.out, "adresses.csv.gz"), index=False, compression="gzip")
    fiche = {"commune": {k: v for k, v in ctx.items() if k != "index"}, "genere_le": NOW, "jour_reference": a.jour,
             "outil": "docs/etudes/2026-10-13-larochelle-mobilite/outil/fiche_mobilite.py", "faits": F, "tableaux": T,
             "sources": src.j}
    json.dump(fiche, open(os.path.join(a.out, "fiche.json"), "w"), ensure_ascii=False, indent=1, default=str)
    L = [f"# Fiche mobilité · {ctx['nom']} ({ctx['insee']})", "",
         f"Générée le {NOW} · jour de référence {a.jour} · voisines : {', '.join(ctx['voisines'].values()) or 'aucune'}", "",
         "Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.", ""]
    for f in F:
        L += [f"## {f['libelle']}", f"`{f['id']}` · statut : {f['statut']} · maille : {f['maille']} · millésime : {f['millesime']}", "",
              f"**Valeur** : `{json.dumps(f['valeur'], ensure_ascii=False, default=str)}`", "",
              f"Définition : {f['definition']}", "", f"Source : {f['source']}", "", f"Présent dans le moteur : {f['dans_moteur']}", ""]
        if f["controles"]:
            L += ["Contrôles :"] + [f"- {c}" for c in f["controles"]] + [""]
        if f["limites"]:
            L += ["Limites :"] + [f"- {c}" for c in f["limites"]] + [""]
        if f["verification_humaine"]:
            L += [f"**À vérifier par un humain** : {f['verification_humaine']}", ""]
    if T.get("modes_par_destination"):
        L += ["## Tableau · mode selon la commune de travail", "", "| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |", "|---|---|---|---|---|---|---|"]
        L += [f"| {r['nom']} | {pct(r['part_des_actifs'])} | {pct(r['voiture'])} | {pct(r['velo'])} | {pct(r['tc'])} | {pct(r['marche'])} | {r['lignes']} ({r['fragilite']}) |" for r in T["modes_par_destination"]]
        L.append("")
    if T.get("iris"):
        L += ["## Tableau · IRIS", "", "| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |", "|---|---|---|---|---|---|---|---|"]
        L += [f"| {r['nom']} | {r['TYP_IRIS']} | {r['actifs']:.0f} | {pct(r['voiture'])} | {pct(r['velo'])} | {pct(r['tc'])} | {pct(r['menages_sans_voiture'])} | {pct(r['menages_stationnement_reserve'])} |"
              for r in T["iris"] if r.get("actifs") == r.get("actifs")]
        L.append("")
    if T.get("acces_communes"):
        keys = list(next(v for v in T["acces_communes"].values() if v).keys())
        L += ["## Tableau · accès depuis les adresses (part des ménages estimée)", "", "| Commune | " + " | ".join(keys) + " |", "|---" * (len(keys) + 1) + "|"]
        for c, v in T["acces_communes"].items():
            if v:
                L.append(f"| {ctx['voisines'].get(c, ctx['nom'] if c == ctx['insee'] else c)} | " + " | ".join(pct(v[k]) for k in keys) + " |")
        L.append("")
    L += ["## Sources récupérées", ""] + [f"- `{k}` : {v['url']} · {v['recupere_le']} · sha256 {v['sha256'][:16]}" for k, v in src.j.items()]
    open(os.path.join(a.out, "fiche.md"), "w").write("\n".join(L) + "\n")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--insee", required=True); p.add_argument("--out", required=True); p.add_argument("--cache", required=True)
    p.add_argument("--mobpro", required=True); p.add_argument("--bpe", required=True); p.add_argument("--index", required=True)
    p.add_argument("--voisines", default=""); p.add_argument("--jour", default=dt.date.today().isoformat())
    p.add_argument("--gtfs", default="auto"); p.add_argument("--rayon-carburant", type=float, default=12)
    p.add_argument("--etapes", default="mobpro,iris,acces,carburant")
    a = p.parse_args()
    src = Sources(a.cache); ctx = contexte(a, src); F, T = [], {}
    for e in a.etapes.split(","):
        print(f"· {e}", file=sys.stderr)
        {"mobpro": etape_mobpro, "iris": etape_iris, "acces": etape_acces, "carburant": etape_carburant}[e](a, ctx, src, F, T)
    ecrire(a, ctx, src, F, T)
    print(f"✓ {a.out}/fiche.json, fiche.md", file=sys.stderr)


if __name__ == "__main__":
    main()
