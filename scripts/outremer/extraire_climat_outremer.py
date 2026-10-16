"""FUT-104 · Extraction communale des indicateurs SocleOM-Climat-2025 (Météo-France) pour l'outre-mer.

Entrées :
  - le cache produit par `telecharger_socleom.py` (archives + manifeste sha256) ;
  - le Code officiel géographique via geo.api.gouv.fr (identité, mairie, contour), mis en cache à la 1re exécution.
Sorties (versionnées dans le dépôt) :
  - src/data/outremer/communes-outremer.json : les 223 entités ultramarines du COG, avec leur territoire ;
  - src/data/outremer/climat-outremer.json   : pour chaque entité couverte, les indicateurs de SON territoire.

RÈGLES (cf. docs/audits/2026-10-15-fut104-climat-outremer.md) :
  1. UN PIXEL, JAMAIS UNE MOYENNE. Météo-France déconseille d'agréger des pixels corrigés (« à éviter, surtout pour
     les précipitations », pages DRIAS Antilles, Polynésie, Nouvelle-Calédonie). La valeur d'une commune est celle
     du pixel de son point de référence (la mairie, sinon le centroïde publié par le COG). L'étendue min–max des
     pixels de la commune est donnée À CÔTÉ, pour dire la variabilité, jamais fondue dans la valeur.
  2. LE NIVEAU DE RÉCHAUFFEMENT SE LIT DANS LES FICHIERS, pas dans le nom de l'archive : à Mayotte, l'archive
     « RWL20 » contient les fichiers RWL-15. Les niveaux trouvés doivent être exactement ceux que DRIAS publie
     pour le territoire (table TRACC outre-mer), sinon l'extraction échoue.
  3. LES ÉCARTS SONT PRIS TELS QUE PUBLIÉS (ANOMd, ANOMrd), jamais recalculés : la médiane des écarts n'est pas
     l'écart des médianes (Saint-Denis, TX31D 2050 : 47,0 − 5,4 = 41,6, écart publié 41,1).
  4. INDISPONIBLE N'EST PAS ZÉRO : une valeur absente s'écrit null, avec sa raison au niveau de la commune ou de
     l'indicateur. Zéro jour chaud est une mesure.
  5. LES INDICATEURS SONT CEUX DU TERRITOIRE : la sélection « Découverte » que Météo-France a retenue pour chaque
     territoire (SocleOM-DRIAS_Liste-indicateurs-Saisons_2026-06-10_publi.xlsx), 24 par territoire.

Usage :
    python3 -P scripts/outremer/extraire_climat_outremer.py --cache DIR [--geo-cache DIR]
"""
import argparse
import datetime as dt
import json
import math
import os
import re
import sys
import tarfile
import urllib.request

import netCDF4
import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SORTIE = os.path.join(RACINE, "src", "data", "outremer")

# ─── Territoires (COG) et zones SocleOM ───────────────────────────────────────────────────────────────────────
# Clé = préfixe du code INSEE/COG. `zones` : domaines SocleOM qui peuvent couvrir le territoire (la Polynésie en a
# trois, disjoints). `famille` : la colonne de la nomenclature Météo-France (R, M, G, NCL, Ant, Pol).
TERRITOIRES = {
    "971": {"id": "guadeloupe", "zones": ["Guadeloupe"], "famille": "Ant"},
    "972": {"id": "martinique", "zones": ["Martinique"], "famille": "Ant"},
    "973": {"id": "guyane", "zones": ["Guyane"], "famille": "G"},
    "974": {"id": "reunion", "zones": ["Reunion"], "famille": "R"},
    "975": {"id": "saint-pierre-et-miquelon", "zones": [], "famille": None},
    "976": {"id": "mayotte", "zones": ["Mayotte"], "famille": "M"},
    "977": {"id": "saint-barthelemy", "zones": ["SaintMartinBarthelemy"], "famille": "Ant"},
    "978": {"id": "saint-martin", "zones": ["SaintMartinBarthelemy"], "famille": "Ant"},
    "984": {"id": "taaf", "zones": [], "famille": None},
    # Wallis-et-Futuna : Météo-France publie les données de base quotidiennes (DBA), pas d'indicateurs.
    "986": {"id": "wallis-et-futuna", "zones": [], "famille": None, "donnees_de_base_seulement": True},
    "987": {"id": "polynesie-francaise", "zones": ["PF-Societe", "PF-Tuamotu", "PF-Australe"], "famille": "Pol"},
    "988": {"id": "nouvelle-caledonie", "zones": ["NouvelleCaledonie"], "famille": "NCL"},
    "989": {"id": "clipperton", "zones": [], "famille": None},
}

# Niveaux de réchauffement régionaux (°C vs 1850-1900) et horizons TRACC, par zone : table DRIAS « Définition des
# indicateurs Outre-Mer » (accompagnement/section/431) et page Météo-France « Quel climat futur pour les
# outre-mer ». L'extraction ÉCHOUE si les fichiers ne portent pas exactement ces niveaux.
NIVEAUX = {
    "Reunion": {1.5: "2030", 2.0: "2050", 2.9: "2100"},
    "Mayotte": {1.5: "2030", 2.0: "2050", 3.0: "2100"},
    "Guyane": {1.7: "2030", 2.3: "2050", 3.5: "2100"},
    "NouvelleCaledonie": {1.5: "2030", 2.0: "2050", 3.0: "2100"},
    "Guadeloupe": {1.4: "2030", 1.9: "2050", 2.7: "2100"},
    "Martinique": {1.4: "2030", 1.9: "2050", 2.7: "2100"},
    "SaintMartinBarthelemy": {1.4: "2030", 1.9: "2050", 2.7: "2100"},
    "PF-Societe": {1.2: "2030", 1.6: "2050", 2.3: "2100"},
    "PF-Tuamotu": {1.2: "2030", 1.6: "2050", 2.3: "2100"},
    "PF-Australe": {1.2: "2030", 1.6: "2050", 2.3: "2100"},
}

# ─── Indicateurs : la sélection « Découverte » de Météo-France, par famille de territoire ──────────────────────
# Source : SocleOM-DRIAS_Liste-indicateurs-Saisons_2026-06-10_publi.xlsx (onglet 1, colonnes R M G NCL Ant Pol).
# Libellés recopiés du tableau officiel. `unite` : celle des fichiers NetCDF. `ecart_relatif` : Météo-France publie
# aussi un écart en % (fichiers ANOMrd).
TOUS = {"R", "M", "G", "NCL", "Ant", "Pol"}
INDICATEURS = {
    "TMm": {"libelle": "Température moyenne quotidienne", "unite": "°C", "familles": TOUS},
    "CDDcold25": {"libelle": "Degrés-jours de refroidissement (somme des degrés-jours avec température moyenne > 25 °C)", "unite": "°C·jours", "familles": {"R", "M"}},
    "CDDcold26": {"libelle": "Degrés-jours de refroidissement (somme des degrés-jours avec température moyenne > 26 °C)", "unite": "°C·jours", "familles": {"G", "NCL", "Ant", "Pol"}},
    "ETR": {"libelle": "Plage de températures extrêmes (température maximale la plus élevée moins température minimale la plus basse)", "unite": "°C", "familles": TOUS},
    "DTRm": {"libelle": "Amplitude thermique quotidienne (température maximale moins température minimale)", "unite": "°C", "familles": TOUS},
    "SU": {"libelle": "Nombre de jours avec température maximale quotidienne > 25 °C", "unite": "jours", "familles": {"R", "M"}},
    # TN24D est ajouté à la Nouvelle-Calédonie, hors sélection « Découverte » (qui y retient TN25D) : c'est le seuil
    # des « nuits chaudes » que Météo-France communique pour ce territoire (« multipliées par 4 ou 5 » à +3 °C ;
    # vérifié : Nouméa 37,7 → 130,9 nuits).
    "TN24D": {"libelle": "Nombre de jours avec température minimale quotidienne ≥ 24 °C", "unite": "jours", "familles": {"G", "NCL"}},
    "TN25D": {"libelle": "Nombre de jours avec température minimale quotidienne ≥ 25 °C", "unite": "jours", "familles": {"R", "M", "NCL", "Ant"}},
    "TN26D": {"libelle": "Nombre de jours avec température minimale quotidienne ≥ 26 °C", "unite": "jours", "familles": {"Pol"}},
    "TNn": {"libelle": "Minimum des températures minimales quotidiennes", "unite": "°C", "familles": TOUS},
    "TNx": {"libelle": "Maximum des températures minimales quotidiennes", "unite": "°C", "familles": TOUS},
    "TR": {"libelle": "Nombre de nuits tropicales (température minimale quotidienne > 20 °C)", "unite": "jours", "familles": {"R", "M"}},
    "TR25D": {"libelle": "Nombre de nuits tropicales (température minimale quotidienne > 25 °C)", "unite": "jours", "familles": TOUS},
    "TX31D": {"libelle": "Nombre de jours avec température maximale quotidienne ≥ 31 °C", "unite": "jours", "familles": {"R"}},
    "TX32D": {"libelle": "Nombre de jours avec température maximale quotidienne ≥ 32 °C", "unite": "jours", "familles": {"M", "NCL", "Pol"}},
    "TX33D": {"libelle": "Nombre de jours avec température maximale quotidienne ≥ 33 °C", "unite": "jours", "familles": {"G", "Ant"}},
    "TX35D": {"libelle": "Nombre de jours avec température maximale quotidienne ≥ 35 °C", "unite": "jours", "familles": TOUS},
    "TX40D": {"libelle": "Nombre de jours avec température maximale quotidienne ≥ 40 °C", "unite": "jours", "familles": {"G", "NCL", "Ant", "Pol"}},
    "TXn": {"libelle": "Minimum des températures maximales quotidiennes", "unite": "°C", "familles": TOUS},
    "TXx": {"libelle": "Maximum des températures maximales quotidiennes", "unite": "°C", "familles": TOUS},
    "PXCDD": {"libelle": "Période de sécheresse (nombre maximal de jours consécutifs avec moins de 1 mm de pluie)", "unite": "jours", "familles": TOUS},
    "PXCWD": {"libelle": "Nombre maximum de jours de pluie consécutifs", "unite": "jours", "familles": TOUS},
    "PRCPTOT": {"libelle": "Cumul des précipitations quotidiennes ≥ 1 mm", "unite": "mm", "familles": TOUS, "ecart_relatif": True},
    "RR10D": {"libelle": "Nombre de jours avec cumul de précipitations quotidiennes ≥ 10 mm", "unite": "jours", "familles": TOUS},
    "RR20D": {"libelle": "Nombre de jours avec cumul de précipitations quotidiennes ≥ 20 mm", "unite": "jours", "familles": TOUS},
    "RR50D": {"libelle": "Nombre de jours avec cumul de précipitations quotidiennes ≥ 50 mm", "unite": "jours", "familles": {"G", "NCL", "Ant", "Pol"}},
    "RR100D": {"libelle": "Nombre de jours avec cumul de précipitations quotidiennes ≥ 100 mm", "unite": "jours", "familles": TOUS},
    "RRq99refTOT": {"libelle": "Fraction des précipitations dues aux jours extrêmement pluvieux (au-delà du 99e centile de la référence)", "unite": "%", "familles": TOUS},
    "Rx1D": {"libelle": "Maximum de cumul de précipitations quotidiennes", "unite": "mm", "familles": TOUS, "ecart_relatif": True},
    "Rx5D": {"libelle": "Maximum de cumul de précipitations sur 5 jours", "unite": "mm", "familles": TOUS, "ecart_relatif": True},
    "SDII": {"libelle": "Indice d'intensité quotidienne simple (pluie moyenne d'un jour de pluie)", "unite": "mm", "familles": TOUS, "ecart_relatif": True},
}
CENTILES = ["ENSq17", "ENSq50", "ENSq83"]  # fourchette « probable » (66 %) et médiane de l'ensemble
NOM = re.compile(
    r"^(?P<ind>[A-Za-z0-9]+)_yr_(?P<periode>\d{4}-\d{4}|RWL-\d+)_TIMEavg_(?:(?P<anom>ANOMr?d)-1991-2020_)?GEOxy_"
    r"FR-(?P<domaine>[A-Za-z]+)_(?P<version>SocleOM-Climat-\d{4})_MF-(?P<bc>[A-Za-z]+)_(?P<scen>[a-z0-9-]+)_(?P<stat>ENS[a-z0-9]+)\.nc$"
)
# RÈGLE DE DISTANCE, UNIQUE ET SANS EXCEPTION : le pixel retenu est à moins de RAYON_MAX_KM du point de référence,
# quelle que soit la méthode qui l'a trouvé. Avant la consolidation, la méthode « pixel le plus proche dans la commune »
# n'avait pas de limite : Arutua recevait un pixel situé à 12,8 km, sur un autre atoll de la commune (Apataki).
RAYON_MAX_KM = 5.0
ECART_CENTROIDE_MAX_C = 1.0  # cf. la règle du centroïde, dans main()
# RÈGLE DE REPRÉSENTATIVITÉ DU POINT (Polynésie, Nouvelle-Calédonie, où la mairie vient de l'Annuaire ou d'un
# géocodage du COG parfois approximatif) : un point à plus de ALTITUDE_CONTROLE_M d'altitude (SRTM), dans une commune
# dont le pixel le plus chaud est d'au moins ECART_RELIEF_C plus chaud que celui du point, doit être corroboré par une
# seconde localisation indépendante de la mairie à moins de CORROBORATION_MAX_KM (controles-points.json). Sinon, la
# valeur décrirait un relief, pas le bourg : statut « point_de_reference_non_verifie », aucune valeur.
# (Pirae : point à 778 m, 4,3 °C sous le pixel côtier, mairie OSM à 5,3 km.)
ALTITUDE_CONTROLE_M = 100
ECART_RELIEF_C = 1.5
CORROBORATION_MAX_KM = 1.5
TERRITOIRES_A_CORROBORER = ("987", "988")


# ─── Géographie (COG via geo.api.gouv.fr) ──────────────────────────────────────────────────────────────────────
def charger_cog(geo_cache):
    os.makedirs(geo_cache, exist_ok=True)
    chemin = os.path.join(geo_cache, "cog-outremer.geojson")
    if not os.path.exists(chemin):
        feats = []
        for prefixe in TERRITOIRES:
            base = f"https://geo.api.gouv.fr/communes?codeDepartement={prefixe}&fields=code,nom,population,mairie,centre,codeRegion"
            # Le format GeoJSON ne garde qu'une géométrie (le contour) et perd `mairie` et `centre` : on les
            # reprend du format JSON, par code.
            points = {c["code"]: c for c in json.load(urllib.request.urlopen(base, timeout=120))}
            for ft in json.load(urllib.request.urlopen(base + "&format=geojson&geometry=contour", timeout=120))["features"]:
                pc = points[ft["properties"]["code"]]
                ft["properties"]["mairie"] = pc.get("mairie")
                ft["properties"]["centre"] = pc.get("centre")
                feats.append(ft)
        with open(chemin, "w") as f:
            json.dump({"releve": dt.date.today().isoformat(), "features": feats}, f)
    with open(chemin) as f:
        return json.load(f)


ANNUAIRE = ("https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records"
            "?where=code_insee_commune%3D%22{code}%22&limit=50&select=nom,pivot,adresse")


def mairies_annuaire(codes, geo_cache):
    """La mairie d'une commune selon l'Annuaire de l'administration (DILA, Licence Ouverte), pour les communes dont le
    COG ne publie que le centroïde (Polynésie, Nouvelle-Calédonie, Wallis-et-Futuna). Le centroïde d'une commune
    montagneuse ou faite d'atolls tombe souvent loin du lieu habité : à Papara (Tahiti), il est dans l'intérieur à
    19 °C de moyenne annuelle, quand le bourg, sur la côte, est à 26 °C.
    Seule une fiche de type `mairie` exactement (pas une mairie annexe ni déléguée), unique et géolocalisée, est
    retenue ; sinon la commune garde son centroïde, signalé comme tel."""
    chemin = os.path.join(geo_cache, "annuaire-mairies.json")
    cache = json.load(open(chemin)) if os.path.exists(chemin) else {}
    for code in codes:
        if code in cache:
            continue
        res = json.load(urllib.request.urlopen(ANNUAIRE.format(code=code), timeout=60))["results"]
        retenues = []
        for rec in res:
            types = [p["type_service_local"] for p in json.loads(rec.get("pivot") or "[]")]
            if types != ["mairie"] or not rec["nom"].startswith("Mairie - "):
                continue
            for adr in json.loads(rec.get("adresse") or "[]"):
                if adr.get("type_adresse") == "Adresse" and adr.get("latitude") and adr.get("longitude"):
                    retenues.append({"nom": rec["nom"], "lon": float(adr["longitude"]), "lat": float(adr["latitude"])})
        cache[code] = retenues
    with open(chemin, "w") as f:
        json.dump(cache, f, ensure_ascii=False, indent=0)
    return {c: v[0] for c, v in cache.items() if len(v) == 1}


def polygones(geom):
    if geom is None:
        return []
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def dans_contour(lons, lats, geom):
    """Pair-impair sur chaque anneau (trous compris) : masque des centres de pixels situés dans la commune."""
    dedans = np.zeros(lons.shape, dtype=bool)
    for poly in polygones(geom):
        for anneau in poly:
            a = np.asarray(anneau)
            x1, y1 = a[:-1, 0], a[:-1, 1]
            x2, y2 = a[1:, 0], a[1:, 1]
            for i in range(len(x1)):
                croise = ((y1[i] > lats) != (y2[i] > lats)) & (
                    lons < (x2[i] - x1[i]) * (lats - y1[i]) / ((y2[i] - y1[i]) or 1e-12) + x1[i])
                dedans ^= croise
    return dedans


def km(lat1, lon1, lat2, lon2):
    r = math.radians
    a = math.sin(r(lat2 - lat1) / 2) ** 2 + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(r(lon2 - lon1) / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(a))


# ─── Lecture des archives ──────────────────────────────────────────────────────────────────────────────────────
class Zone:
    """Toutes les grilles d'une zone SocleOM, indexées par (indicateur, période, nature, centile)."""

    def __init__(self, nom):
        self.nom = nom
        self.grilles = {}
        self.meta = {"archives": [], "versions": set(), "scenarios": set(), "corrections": {}}
        self.lat = self.lon = None
        self.reference_bornes = None

    def ajouter(self, chemin, archive):
        self.meta["archives"].append({k: archive[k] for k in ("cle", "taille", "etag", "sha256", "mis_en_ligne")})
        with tarfile.open(chemin) as t:
            for m in t.getmembers():
                n = NOM.match(os.path.basename(m.name))
                if not n or n["ind"] not in INDICATEURS or n["stat"] not in CENTILES:
                    continue
                periode = "reference" if n["periode"] == "1991-2020" else float(n["periode"][4:]) / 10
                nature = {"ANOMd": "ecart", "ANOMrd": "ecart_relatif", None: "valeur"}[n["anom"]]
                if nature == "ecart_relatif" and not INDICATEURS[n["ind"]].get("ecart_relatif"):
                    continue  # écart relatif non retenu (un fichier RRq99refTOT de Guyane n'a même pas d'unité)
                cle = (n["ind"], periode, nature, n["stat"])
                d = netCDF4.Dataset("m", memory=t.extractfile(m).read())
                lat, lon = np.array(d["lat"][:], dtype=float), np.array(d["lon"][:], dtype=float)
                if self.lat is None:
                    self.lat, self.lon = lat, lon
                elif not (np.allclose(lat, self.lat) and np.allclose(lon, self.lon)):
                    sys.exit(f"{self.nom} : grille différente dans {m.name}")
                # La variable ne porte pas toujours le code de l'indicateur (PXCDD s'appelle autrement dans son
                # fichier) : on prend l'unique variable de données, et on refuse un fichier qui en aurait deux.
                donnees = [k for k, x in d.variables.items() if x.dimensions[-2:] == ("lat", "lon")]
                if len(donnees) != 1:
                    sys.exit(f"{m.name} : {len(donnees)} variables de données")
                v = d[donnees[0]]
                grille = np.array(np.ma.filled(v[0], np.nan), dtype=float)
                if periode == "reference" and nature == "valeur":
                    unite = base = None
                    tb = d["time_bounds"][0]
                    base = dt.datetime.strptime(d["time_bounds"].units.split("since ")[1][:10], "%Y-%m-%d")
                    bornes = ((base + dt.timedelta(days=float(tb[0]))).date().isoformat(),
                              (base + dt.timedelta(days=float(tb[1]))).date().isoformat())
                    if bornes != ("1991-01-01", "2020-12-31"):
                        sys.exit(f"{self.nom} : référence {bornes} dans {m.name}, 1991-2020 attendu")
                    self.reference_bornes = bornes
                ancien = self.grilles.get(cle)
                if ancien is not None and not np.allclose(ancien, grille, equal_nan=True):
                    # La même grille présente dans deux archives (La Réunion range ses écarts dans les deux) doit
                    # être identique ; sinon, on ne sait pas laquelle croire.
                    sys.exit(f"{self.nom} : deux versions différentes de {cle}")
                self.grilles[cle] = grille
                self.meta["versions"].add(n["version"])
                self.meta["scenarios"].add(n["scen"])
                self.meta["corrections"].setdefault(n["ind"], set()).add(n["bc"])
                unite = getattr(v, "units", "")
                if nature == "ecart_relatif":
                    if unite != "%":
                        sys.exit(f"{m.name} : écart relatif en « {unite} », % attendu")
                elif "unite_nc:" + n["ind"] not in self.meta:
                    # Valeur et écart absolu partagent l'unité (un écart de jours est en jours) ; la première vue
                    # est comparée à l'unité déclarée dans main().
                    self.meta["unite_nc:" + n["ind"]] = unite
                    self.meta["defn_nc:" + n["ind"]] = getattr(v, "long_name", "")
                elif self.meta["unite_nc:" + n["ind"]] != unite:
                    sys.exit(f"{m.name} : unité « {unite} », « {self.meta['unite_nc:' + n['ind']]} » ailleurs")
                d.close()

    def niveaux(self):
        return sorted({k[1] for k in self.grilles if k[1] != "reference"})

    def masque(self):
        return np.isfinite(self.grilles[("TMm", "reference", "valeur", "ENSq50")])


# Unité attendue dans les fichiers, pour chaque unité déclarée : l'extraction échoue sur toute autre (un « K » à la
# place d'un « C » décalerait toutes les températures de 273 degrés). Les degrés-jours sont notés « C » par les
# fichiers : leur unité réelle est le °C·jour.
UNITES_FICHIER = {"°C": "C", "°C·jours": "C", "jours": "day", "mm": "mm", "%": "%"}


# LACUNES DE PUBLICATION CONNUES, relevées le 16/10/2026 dans les archives SocleOM. Ce sont les seules absences
# admises : la donnée reste `null` (jamais zéro) et la commune garde ses autres indicateurs. Toute autre absence fait
# échouer l'extraction ; une lacune listée qui serait publiée la fait échouer aussi, pour que la liste reste exacte.
LACUNES_CONNUES = {
    # Guyane : les archives RWL ne portent que 34 indicateurs sur 42 ; quatre de la sélection n'ont aucun horizon futur.
    ("Guyane", "CDDcold26", "horizons"), ("Guyane", "ETR", "horizons"), ("Guyane", "DTRm", "horizons"),
    ("Guyane", "PRCPTOT", "horizons"),
    # Mayotte : aucune des deux archives historiques (« 20ans », « 30ans ») ne contient les séquences sèches et humides.
    ("Mayotte", "PXCDD", "reference"), ("Mayotte", "PXCWD", "reference"),
}


def valider_zone(z):
    """COHÉRENCE D'UNE ZONE, ou l'extraction échoue (aucun fichier « apparemment exploitable » n'est écrit) :
    niveaux de réchauffement exactement ceux de la table TRACC du territoire ; référence 1991-2020 présente ; unité de
    chaque indicateur conforme ; pour chaque indicateur retenu par la famille du territoire, une référence, et à
    chaque niveau une valeur ET un écart, ou aucun des deux (donnée non publiée, comme le cumul de pluie futur en
    Guyane) — jamais l'un sans l'autre."""
    attendus = sorted(NIVEAUX[z.nom])
    if z.niveaux() != attendus:
        sys.exit(f"{z.nom} : niveaux {z.niveaux()} dans les fichiers, {attendus} attendus (table TRACC DRIAS)")
    if z.reference_bornes is None:
        sys.exit(f"{z.nom} : pas de période de référence")
    familles = {t["famille"] for t in TERRITOIRES.values() if z.nom in t["zones"]}
    if len(familles) != 1:
        sys.exit(f"{z.nom} : rattachée à {len(familles)} familles de territoire")
    famille = familles.pop()
    for ind, d in INDICATEURS.items():
        u = z.meta.get("unite_nc:" + ind)
        if u is not None and u != UNITES_FICHIER[d["unite"]]:
            sys.exit(f"{z.nom} / {ind} : unité « {u} » dans les fichiers, « {UNITES_FICHIER[d['unite']]} » attendue")
        if famille not in d["familles"]:
            continue
        a_ref = (ind, "reference", "valeur", "ENSq50") in z.grilles
        if a_ref == ((z.nom, ind, "reference") in LACUNES_CONNUES):
            sys.exit(f"{z.nom} / {ind} : référence 1991-2020 {'publiée alors que listée en lacune' if a_ref else 'absente, et non listée en lacune'}")
        presences = set()
        for niveau in attendus:
            v, e = (ind, niveau, "valeur", "ENSq50") in z.grilles, (ind, niveau, "ecart", "ENSq50") in z.grilles
            if v != e:
                sys.exit(f"{z.nom} / {ind} / +{niveau} °C : {'valeur sans écart' if v else 'écart sans valeur'}")
            presences.add(v)
        if len(presences) != 1:
            sys.exit(f"{z.nom} / {ind} : publié pour une partie des niveaux seulement")
        a_horizons = presences.pop()
        if a_horizons == ((z.nom, ind, "horizons") in LACUNES_CONNUES):
            sys.exit(f"{z.nom} / {ind} : horizons {'publiés alors que listés en lacune' if a_horizons else 'absents, et non listés en lacune'}")


def r(x, nd):
    if x is None or not np.isfinite(x):
        return None
    v = round(float(x), nd)
    return 0.0 if v == 0 else v


def arrondi(unite):
    return 2 if unite == "°C" else 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--cache", required=True)
    p.add_argument("--geo-cache", default=None)
    a = p.parse_args()
    geo_cache = a.geo_cache or os.path.join(a.cache, "geo")

    manifeste = json.load(open(os.path.join(a.cache, "manifeste.json")))
    zones = {}
    # Référence : pour Mayotte deux archives historiques coexistent (« 20ans », 40 indicateurs, et « 30ans »,
    # 42 indicateurs) ; toutes deux portent 1991-2020 dans leurs fichiers. On prend la plus complète, et
    # `Zone.ajouter` vérifie qu'elles concordent là où elles se recouvrent.
    for arch in sorted(manifeste["archives"], key=lambda x: (x["zone"], x["fenetre_ans"])):
        z = zones.setdefault(arch["zone"], Zone(arch["zone"]))
        z.ajouter(os.path.join(a.cache, arch["fichier"]), arch)

    if set(zones) != set(NIVEAUX):
        sys.exit(f"zones {sorted(zones)} dans les archives, {sorted(NIVEAUX)} attendues")
    for z in zones.values():
        valider_zone(z)

    cog = charger_cog(geo_cache)
    chemin_controles = os.path.join(SORTIE, "controles-points.json")
    if not os.path.exists(chemin_controles):
        sys.exit("controles-points.json absent : lancer d'abord scripts/outremer/controler_points.py")
    controles = json.load(open(chemin_controles))["points"]

    def points_cog(pr):
        return (pr.get("mairie") or {}).get("coordinates"), (pr.get("centre") or {}).get("coordinates")

    # Le COG (geo.api) recopie le centroïde dans `mairie` quand il ne connaît pas la mairie : un point « mairie »
    # identique au centroïde n'en est pas un.
    sans_mairie = [f["properties"]["code"] for f in cog["features"]
                   if TERRITOIRES[f["properties"]["code"][:3]]["zones"]
                   and (lambda m, c: not m or m == c)(*points_cog(f["properties"]))]
    annuaire = mairies_annuaire(sans_mairie, geo_cache)

    communes_sortie, climat_communes = [], {}
    for f in sorted(cog["features"], key=lambda f: f["properties"]["code"]):
        pr = f["properties"]
        code = pr["code"]
        terr = TERRITOIRES[code[:3]]
        mairie, centre = points_cog(pr)
        if mairie and centre and mairie != centre:
            point, point_type = mairie, "mairie"
        elif code in annuaire:
            point, point_type = [annuaire[code]["lon"], annuaire[code]["lat"]], "mairie_annuaire"
        else:
            point, point_type = centre, "centroide"
        communes_sortie.append({
            "code": code, "nom": pr["nom"], "territoire": terr["id"],
            "population": pr.get("population"),
            "point": [round(point[0], 5), round(point[1], 5)] if point else None,
            "point_type": point_type if point else None,
        })

        if not terr["zones"]:
            climat_communes[code] = {"statut": "source_non_integree" if terr.get("donnees_de_base_seulement") else "source_indisponible"}
            continue

        # Le pixel du point, sinon le pixel terrestre le plus proche DANS la commune, sinon le plus proche hors de la
        # commune ; dans les deux derniers cas, à moins de RAYON_MAX_KM. Chaque zone candidate est essayée ; la
        # Polynésie en a trois, disjointes.
        choix = None
        for zn in terr["zones"]:
            z = zones[zn]
            lon_g, lat_g = np.meshgrid(z.lon, z.lat)
            terre = z.masque()
            dedans = dans_contour(lon_g, lat_g, f["geometry"])
            plon, plat = point
            pas = abs(z.lat[1] - z.lat[0])
            i, j = int(np.abs(z.lat - plat).argmin()), int(np.abs(z.lon - plon).argmin())
            sur_grille = abs(z.lat[i] - plat) <= pas / 2 + 1e-9 and abs(z.lon[j] - plon) <= pas / 2 + 1e-9
            if sur_grille and terre[i, j]:
                c = (i, j, "pixel_du_point")
            else:
                cand = None
                for masque, methode in ((terre & dedans, "pixel_le_plus_proche_dans_la_commune"), (terre, "pixel_le_plus_proche")):
                    ii, jj = np.nonzero(masque)
                    if len(ii) == 0:
                        continue
                    dist = [km(plat, plon, z.lat[x], z.lon[y]) for x, y in zip(ii, jj)]
                    k = int(np.argmin(dist))
                    if dist[k] > RAYON_MAX_KM:
                        continue
                    cand = (int(ii[k]), int(jj[k]), methode)
                    break
                c = cand
            if c:
                if choix is not None:
                    sys.exit(f"{code} : couvert par deux zones ({choix[0].nom}, {zn})")
                choix = (z, c, terre & dedans)
        if choix is None:
            climat_communes[code] = {"statut": "hors_grille", "zones_examinees": terr["zones"]}
            continue

        z, (i, j, methode), pixels_commune = choix
        # L'ÉTENDUE COMPREND TOUJOURS LE PIXEL RETENU. Les centres de pixels « dans la commune » excluent souvent le
        # pixel côtier de la mairie (Saint-Denis : 47 jours ≥ 31 °C en 2050 au pixel retenu, 0 à 27 sur les pixels
        # des hauts) ; une étendue qui n'encadrerait pas la valeur qu'elle accompagne serait trompeuse.
        pixels_etendue = pixels_commune.copy()
        pixels_etendue[i, j] = True

        # UN CENTROÏDE NE VAUT QUE POUR UNE COMMUNE HOMOGÈNE. Sans mairie connue, la valeur au centre géographique
        # n'est gardée que si la commune ne varie pas de plus de ECART_CENTROIDE_MAX_C en température moyenne
        # (atolls : Fakarava, Rimatara). Sur une île haute (Taiarapu-Ouest : 20,6 °C au centroïde, 25,2 °C sur la
        # côte habitée), elle décrirait la montagne, pas la commune : on la retient.
        tmm = z.grilles[("TMm", "reference", "valeur", "ENSq50")][pixels_commune]
        tmm = tmm[np.isfinite(tmm)]
        if point_type == "centroide" and (len(tmm) == 0 or tmm.max() - tmm.min() > ECART_CENTROIDE_MAX_C):
            climat_communes[code] = {"statut": "point_de_reference_manquant", "zone": z.nom,
                                     "etendue_TMm_reference": [r(tmm.min(), 2), r(tmm.max(), 2)] if len(tmm) else None}
            continue

        controle = controles.get(code, {})
        gtmm = z.grilles[("TMm", "reference", "valeur", "ENSq50")]
        ecart_relief = float(tmm.max() - gtmm[i, j]) if len(tmm) else 0.0
        osm = controle.get("mairie_osm_km")
        corrobore = None if code[:3] not in TERRITOIRES_A_CORROBORER else (osm is not None and osm <= CORROBORATION_MAX_KM)
        point_controle = {"altitude_srtm_m": controle.get("altitude_srtm_m"), "mairie_osm_km": osm, "corrobore": corrobore,
                          "ecart_au_pixel_le_plus_chaud_C": r(ecart_relief, 2)}
        if (corrobore is False and (controle.get("altitude_srtm_m") or 0) > ALTITUDE_CONTROLE_M
                and ecart_relief >= ECART_RELIEF_C):
            climat_communes[code] = {"statut": "point_de_reference_non_verifie", "zone": z.nom, "point_controle": point_controle,
                                     "etendue_TMm_reference": [r(tmm.min(), 2), r(tmm.max(), 2)]}
            continue

        valeurs = {}
        for ind, d in INDICATEURS.items():
            if terr["famille"] not in d["familles"]:
                continue
            nd = arrondi(d["unite"])
            lire = lambda per, nat, st: (z.grilles.get((ind, per, nat, st)), )[0]
            ref = [r(lire("reference", "valeur", s)[i, j], nd) if lire("reference", "valeur", s) is not None else None for s in CENTILES]
            entree = {"reference": ref, "horizons": {}}
            g50 = lire("reference", "valeur", "ENSq50")
            if g50 is not None:
                vals = g50[pixels_etendue]
                vals = vals[np.isfinite(vals)]
                if len(vals):
                    entree["etendue_reference"] = [r(vals.min(), nd), r(vals.max(), nd)]
            # L'étendue communale à l'horizon 2050 aussi : sur un relief (La Réunion, Nouvelle-Calédonie, Tahiti) ou
            # pour un comptage au-dessus d'un seuil (Saint-Martin, jours ≥ 33 °C : de 1 à 65 d'un pixel à l'autre), la
            # valeur du point ne vaut pas pour toute la commune. Jamais de moyenne : le minimum et le maximum.
            n2050 = next(n for n, h in NIVEAUX[z.nom].items() if h == "2050")
            g2050 = lire(n2050, "valeur", "ENSq50")
            if g2050 is not None:
                vals = g2050[pixels_etendue]
                vals = vals[np.isfinite(vals)]
                if len(vals):
                    entree["etendue_2050"] = [r(vals.min(), nd), r(vals.max(), nd)]
            for niveau, horizon in NIVEAUX[z.nom].items():
                h = {}
                for nature in ("valeur", "ecart", "ecart_relatif"):
                    if nature == "ecart_relatif" and not d.get("ecart_relatif"):
                        continue
                    trio = [lire(niveau, nature, s) for s in CENTILES]
                    h[nature] = None if all(t is None for t in trio) else [
                        r(t[i, j], 1 if nature == "ecart_relatif" else nd) if t is not None else None for t in trio]
                entree["horizons"][horizon] = h
            valeurs[ind] = entree
        climat_communes[code] = {
            "statut": "integree",
            "zone": z.nom,
            "pixel": {"lat": round(float(z.lat[i]), 4), "lon": round(float(z.lon[j]), 4), "methode": methode,
                      "distance_km": round(km(point[1], point[0], z.lat[i], z.lon[j]), 2),
                      "pixels_dans_la_commune": int(pixels_commune.sum())},
            "point_controle": point_controle,
            "indicateurs": valeurs,
        }

    zones_sortie = {}
    for nom, z in sorted(zones.items()):
        zones_sortie[nom] = {
            "versions": sorted(z.meta["versions"]),
            "scenarios": sorted(z.meta["scenarios"]),
            "reference": {"periode": "1991-2020", "bornes": list(z.reference_bornes)},
            "niveaux": [{"rechauffement_regional_C": n, "horizon_tracc": h, "reference_niveau": "1850-1900"}
                        for n, h in sorted(NIVEAUX[nom].items())],
            "fenetre_horizon_ans": 20,
            "pas_grille_deg": round(float(abs(z.lat[1] - z.lat[0])), 4),
            "corrections_de_biais": {k: sorted(v) for k, v in sorted(z.meta["corrections"].items())},
            "lacunes_de_publication": sorted(f"{ind} ({quoi})" for zn, ind, quoi in LACUNES_CONNUES if zn == nom),
            "archives": sorted(z.meta["archives"], key=lambda x: x["cle"]),
        }

    indicateurs_sortie = {}
    for ind, d in INDICATEURS.items():
        indicateurs_sortie[ind] = {
            "libelle": d["libelle"], "unite": d["unite"], "familles": sorted(d["familles"]),
            "ecart_relatif": bool(d.get("ecart_relatif")),
            "definition_fichier": next((z.meta.get("defn_nc:" + ind) for z in zones.values() if z.meta.get("defn_nc:" + ind)), None),
            "unite_fichier": next((z.meta.get("unite_nc:" + ind) for z in zones.values() if z.meta.get("unite_nc:" + ind) is not None), None),
        }

    os.makedirs(SORTIE, exist_ok=True)
    meta_commune = {
        "schema": 1,
        "source": "Code officiel géographique, via geo.api.gouv.fr",
        "releve": cog["releve"],
        "note": "Toutes les entités ultramarines du COG, y compris celles sans source climatique : la couverture se lit dans climat-outremer.json.",
    }
    with open(os.path.join(SORTIE, "communes-outremer.json"), "w") as f:
        json.dump({**meta_commune, "entites": communes_sortie}, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(SORTIE, "climat-outremer.json"), "w") as f:
        json.dump({
            "schema": 1,
            "source": {
                "producteur": "Météo-France",
                "jeu": "SocleOM-Climat-2025 (indicateurs annuels, moyennes par niveau de réchauffement TRACC)",
                "licence": "Licence Ouverte 2.0 (Etalab)",
                "fiche": "https://www.data.gouv.fr/datasets/projections-climatiques-pour-le-hackathon-2025-socle-outre-mer",
                "documentation": "https://www.drias-climat.fr/accompagnement/section/431",
                "nomenclature": "https://www.drias-climat.fr/document/SocleOM-DRIAS_Liste-indicateurs-Saisons_2026-06-10_publi.xlsx",
                "bucket": manifeste["bucket"] + manifeste["prefixe"],
            },
            "regles": {
                "valeur_communale": "pixel du point de référence (mairie, sinon centroïde COG) ; jamais de moyenne de pixels",
                "centiles": "[q17, q50, q83] de l'ensemble multi-modèle",
                "ecarts": "tels que publiés par rapport à 1991-2020, jamais recalculés",
                "absence": "null = donnée non publiée ; 0 = mesure nulle",
                "rayon_max_km": RAYON_MAX_KM,
                "corroboration": {"territoires": list(TERRITOIRES_A_CORROBORER), "altitude_m": ALTITUDE_CONTROLE_M,
                                  "ecart_relief_C": ECART_RELIEF_C, "distance_max_km": CORROBORATION_MAX_KM},
            },
            "extrait_le": dt.date.today().isoformat(),
            "zones": zones_sortie,
            "indicateurs": indicateurs_sortie,
            "communes": climat_communes,
        }, f, ensure_ascii=False, separators=(",", ":"))

    stat = {}
    for c in climat_communes.values():
        stat[c["statut"]] = stat.get(c["statut"], 0) + 1
    print(f"{len(communes_sortie)} entités ; {stat}")
    for nom in ("communes-outremer.json", "climat-outremer.json"):
        print(nom, os.path.getsize(os.path.join(SORTIE, nom)) // 1024, "Ko")


if __name__ == "__main__":
    main()
