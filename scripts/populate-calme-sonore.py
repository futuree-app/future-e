#!/usr/bin/env python3
"""Critère calme_sonore : éloignement aux grandes sources de bruit.

Sources V1 (noyau dur incontestable) :
  - autoroutes / voies rapides : OSM highway=motorway|trunk (+ _link)
  - rail principal             : OSM railway=rail filtré (cf. classify_rail)
  - aéroports commerciaux      : OSM aeroway=aerodrome dont iata in WHITELIST_IATA

Modèle : distance du CHEF-LIEU (lat/lon de l'index) à la source la plus proche de
chaque classe ; décroissance linéaire ABSOLUE par classe (rayons distincts) ;
combinaison MAX (source dominante) ; score = 100*(1-expo). Loin de tout = 100, JAMAIS null.
Descriptif (proximité), pas acoustique (dB). cf. docs/superpowers/specs/2026-06-04-calme-sonore-design.md

Usage :
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --selftest
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --summary
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --probe
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --matrix
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --write-index
"""
import json, os, sys, math, argparse, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
OSM_TILE_DIR = os.path.join(CACHE, "osm-calme-tiles")
OUT_CACHE = os.path.join(CACHE, "communes-calme-sonore.json")

R_EARTH = 6371.0

# ── MODÈLE DE SCORE : exposition CUMULÉE (cf. RÉVISION 2026-06-05 du design) ────
# Le score n'est PAS la distance à la source la plus proche (bruit d'échantillonnage en
# grande ville), mais l'intégrale de proximité (1 - d/R_EXPO) le long de TOUTES les sources
# dans R_EXPO, pondérée par classe, + une contribution ponctuelle aéroport. Puis fonction
# saturante -> 0-100. Loin de tout = 100. Boutons PROVISOIRES, à figer par sonde (gate porteur).
R_EXPO = 5.0     # rayon d'exposition cumulée (km)
H_HALF = 150.0   # demi-vie : score = 100 * 0.5^(E/H_HALF). Plus H grand, plus c'est clément.
W_AUTO = 1.0     # poids autoroute/voie rapide (par km de proximité intégrée)
W_MAIN = 1.0     # poids rail usage=main
W_LGV = 1.5      # poids rail LGV (porte plus, plus bruyant)
W_BRANCH = 0.3   # poids rail secondaire (faible : ne doit pas éroder le rural)
W_AERO = 100.0   # poids contribution aéroport (terme ponctuel = W_AERO * (1 - d/R_AERO))

# ── Rayons caractéristiques par classe (km) — UNIQUEMENT pour le RÉCIT (source dominante
# la plus proche : « autoroute à ~900 m »). N'entrent PAS dans le score cumulé.
R_AUTO = 2.0
# Rail à 3 tiers : proxy du NIVEAU D'INFRASTRUCTURE OSM (highspeed/usage), PAS l'intensité
# réelle (trains/jour). Une LGV porte loin, une ligne secondaire ne pénalise qu'au pied.
R_LGV = 2.5      # highspeed=yes
R_MAIN = 1.5     # usage=main
R_BRANCH = 0.6   # usage=branch
R_AERO = 8.0

# ── Whitelist aéroports COMMERCIAUX (codes IATA) ───────────────────────────────
# Liste de référence stable et vérifiable (trafic passagers commercial significatif FR).
# Les coordonnées NE sont PAS codées en dur : récupérées depuis OSM (aeroway=aerodrome[iata])
# en n'acceptant QUE les iata de cette liste. On ne note JAMAIS aéroclubs/ULM.
WHITELIST_IATA = {
    "CDG", "ORY", "BVA",                       # Paris
    "NCE", "MRS", "LYS", "TLS", "BOD", "NTE",  # grandes métropoles
    "MLH", "LIL", "MPL", "BIQ", "AJA", "BIA",  # Bâle-Mulhouse, Lille, Montpellier, Biarritz, Corse
    "FSC", "CLY", "PGF", "RNS", "BES", "SXB",  # Figari, Calvi, Perpignan, Rennes, Brest, Strasbourg
    "CFE", "LRH", "TLN", "EGC", "PUF", "LDE",  # Clermont, La Rochelle, Toulon, Bergerac, Pau, Tarbes
    "GNB", "CMF", "BZR", "RDZ", "DCM", "CCF",  # Grenoble, Chambéry, Béziers, Rodez, Castres, Carcassonne
    "ETZ", "EPL", "DIJ", "QXB", "AUF", "BVE",  # Metz, Épinal, Dijon, Aix, Auxerre, Brive
    "LIG", "URO", "DOL", "ANG", "CET", "LBI",  # Limoges, Rouen, Dole, Angoulême, Cholet, Albi
    "NCY", "AVN", "VAF", "TUF", "PIS", "LRT",  # Annecy, Avignon, Valence, Tours, Poitiers, Lorient
    "QUI", "DNR", "LAI", "UIP", "CER", "BOL",  # Quimper, Dinard, Lannion, Quimper, Cherbourg, Bastia
}

def hav_km(lat0, lon0, lats, lons):
    """Distances haversine d'un point (lat0,lon0) à des arrays (lats,lons), en km."""
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))

def expo_class(d_km, r_km):
    """Exposition d'une classe : 1 au contact, décroît linéairement, 0 au-delà du rayon."""
    if d_km is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - d_km / r_km))

def recit_dominant(d_auto, d_lgv, d_main, d_branch, d_aero):
    """Source la plus proche pour le RÉCIT (pas le score) -> (src, distance) ou (None, None).

    Les 3 tiers de rail s'affichent tous comme « rail » (l'utilisateur ne voit pas le tier).
    None = aucune source dans son rayon de récit (silence : rien à nommer).
    """
    cands = [
        ("auto", d_auto, expo_class(d_auto, R_AUTO)),
        ("rail", d_lgv, expo_class(d_lgv, R_LGV)),
        ("rail", d_main, expo_class(d_main, R_MAIN)),
        ("rail", d_branch, expo_class(d_branch, R_BRANCH)),
        ("aero", d_aero, expo_class(d_aero, R_AERO)),
    ]
    src, dist, e = max(cands, key=lambda x: x[2])
    if e <= 0.0:
        return None, None
    return src, round(dist, 1)

def score_from_exposure(E):
    """Exposition cumulée -> score 0-100, saturant. E=0 -> 100 (loin de tout, jamais null)."""
    return round(100 * 0.5 ** (E / H_HALF))

# ── Plomberie Overpass (copiée de populate-reseau-local.py, générique) ─────────
OVERPASS_MIRRORS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
METRO_BBOX = (41.0, -5.6, 51.6, 9.8)   # (S, W, N, E)
DOM_BBOXES = [
    (15.7, -61.9, 16.6, -60.9),   # Guadeloupe
    (14.3, -61.3, 14.9, -60.7),   # Martinique
    (2.0, -54.8, 6.0, -51.5),     # Guyane
    (-21.5, 55.1, -20.8, 56.0),   # Réunion
    (-13.1, 44.9, -12.5, 45.4),   # Mayotte
]
TILE_DEG = 2.0

def tiles():
    out = []
    s0, w0, n0, e0 = METRO_BBOX
    s = s0
    while s < n0:
        w = w0
        while w < e0:
            out.append((round(s, 3), round(w, 3), round(min(s + TILE_DEG, n0), 3), round(min(w + TILE_DEG, e0), 3)))
            w += TILE_DEG
        s += TILE_DEG
    return out + DOM_BBOXES

def fetch_tile(query, dest):
    """Interroge les miroirs (2 essais chacun) jusqu'à un JSON Overpass valide (elements peut
    être vide pour une tuile océan = succès). Écrit la réponse brute dans dest, retourne elements."""
    payload = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for url in OVERPASS_MIRRORS:
        for attempt in (1, 2):
            try:
                req = urllib.request.Request(url, data=payload,
                                             headers={"User-Agent": "futur-e/populate-calme-sonore"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    body = r.read()
                doc = json.loads(body)
                if "elements" in doc:
                    with open(dest, "wb") as f:
                        f.write(body)
                    return doc["elements"]
                last = f"{url}: pas d'elements"
            except Exception as e:  # noqa: BLE001 (résilience réseau volontaire)
                last = f"{url} (essai {attempt}) : {e}"
    raise RuntimeError(f"tuile Overpass échouée. Dernier : {last}")

# ── Requêtes Overpass par classe (géométrie incluse : out geom) ────────────────
def query_roads(s, w, n, e):
    bb = f"({s},{w},{n},{e})"
    return ('[out:json][timeout:180];('
            f'way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]{bb};'
            ');out geom;')

def query_rail(s, w, n, e):
    # Rail PRINCIPAL uniquement. On part de railway=rail puis on filtre côté Python
    # (classify_rail) car usage/highspeed sont mal couverts dans certains réseaux :
    # on ramène large ici, on tranche au parsing après inspection (vérif data).
    bb = f"({s},{w},{n},{e})"
    return ('[out:json][timeout:180];('
            f'way["railway"="rail"]{bb};'
            ');out geom;')

def query_airports(s, w, n, e):
    bb = f"({s},{w},{n},{e})"
    return ('[out:json][timeout:180];('
            f'nwr["aeroway"="aerodrome"]["iata"]{bb};'
            ');out center;')

def rail_tier(tags):
    """Niveau d'infrastructure ferroviaire (proxy du niveau OSM, PAS l'intensité réelle).

    -> 'lgv' | 'main' | 'branch' | None. LGV prime (highspeed=yes). Exclut toujours
    service/sidings, usage industrial/tourism/military, disused/abandoned/construction,
    et le rail sans usage connu (prudence V1).
    """
    if tags.get("service"):
        return None
    for k in ("disused", "abandoned", "construction", "razed", "proposed"):
        if tags.get(k) or tags.get("railway") == k:
            return None
    if tags.get("highspeed") == "yes":
        return "lgv"
    u = tags.get("usage")
    if u == "main":
        return "main"
    if u == "branch":
        return "branch"
    return None  # industrial/tourism/military/absent : exclus

# ── Densification des lignes en nuage de points (pour distance par grille) ──────
DENSIFY_KM = 0.2  # pas d'échantillonnage le long des lignes (~200 m)

def densify(geom):
    """geom = liste de {lat,lon} (Overpass out geom) -> liste (lat,lon) densifiée ~200 m."""
    pts = []
    for i in range(len(geom) - 1):
        a, b = geom[i], geom[i + 1]
        pts.append((a["lat"], a["lon"]))
        d = hav_km(a["lat"], a["lon"], np.array([b["lat"]]), np.array([b["lon"]]))[0]
        n = int(d / DENSIFY_KM)
        for k in range(1, n):
            t = k / n
            pts.append((a["lat"] + t * (b["lat"] - a["lat"]), a["lon"] + t * (b["lon"] - a["lon"])))
    if geom:
        pts.append((geom[-1]["lat"], geom[-1]["lon"]))
    return pts

def _tile_elements(dest, qfn, s, w, n, e, refresh):
    if (not refresh) and os.path.exists(dest):
        return json.load(open(dest)).get("elements", [])
    return fetch_tile(qfn(s, w, n, e), dest)

def load_osm(refresh=False):
    """Retourne (auto, lgv, main, branch, aero, aero_iata) : 5 arrays Nx2 (lat,lon) + la liste iata.

    DÉDUP par id de way : un way à cheval sur deux tuiles (Overpass renvoie sa géométrie
    complète dans chaque tuile qu'il touche) ne doit compter qu'UNE fois dans l'intégrale.
    """
    os.makedirs(OSM_TILE_DIR, exist_ok=True)
    auto, lgv, rmain, branch, aero = [], [], [], [], []
    rail_sink = {"lgv": lgv, "main": rmain, "branch": branch}
    seen_auto, seen_rail, seen_aero = set(), set(), set()
    for (s, w, n, e) in tiles():
        dest = os.path.join(OSM_TILE_DIR, f"roads_{s}_{w}.json")
        for el in _tile_elements(dest, query_roads, s, w, n, e, refresh):
            if el.get("type") != "way" or "geometry" not in el:
                continue
            wid = el.get("id")
            if wid in seen_auto:
                continue
            seen_auto.add(wid)
            auto.extend(densify(el["geometry"]))
        dest = os.path.join(OSM_TILE_DIR, f"rail_{s}_{w}.json")
        for el in _tile_elements(dest, query_rail, s, w, n, e, refresh):
            if el.get("type") != "way" or "geometry" not in el:
                continue
            wid = el.get("id")
            if wid in seen_rail:
                continue
            seen_rail.add(wid)
            tier = rail_tier(el.get("tags", {}))
            if tier:
                rail_sink[tier].extend(densify(el["geometry"]))
        dest = os.path.join(OSM_TILE_DIR, f"airports_{s}_{w}.json")
        for el in _tile_elements(dest, query_airports, s, w, n, e, refresh):
            iata = (el.get("tags", {}).get("iata") or "").strip().upper()
            if iata not in WHITELIST_IATA or el.get("id") in seen_aero:
                continue
            seen_aero.add(el.get("id"))
            c = el.get("center") or el
            if c.get("lat") is not None:
                aero.append((c["lat"], c["lon"], iata))
    def arr(p):
        return np.array([(x[0], x[1]) for x in p], dtype=np.float64) if p else np.empty((0, 2))
    aero_iata = sorted({x[2] for x in aero})
    return arr(auto), arr(lgv), arr(rmain), arr(branch), arr(aero), aero_iata

# ── Distance la plus proche par classe (recherche par grille) ──────────────────
GRID = 0.1  # cellule ~11 km lat : ±1 cellule capte toute source dans les rayons max

def _grid(pts):
    g = {}
    for k in range(len(pts)):
        key = (int(math.floor(pts[k, 0] / GRID)), int(math.floor(pts[k, 1] / GRID)))
        g.setdefault(key, []).append(k)
    return g

def nearest_km(lat, lon, pts, grid):
    """Distance (km) au point le plus proche, ou None si aucune source dans ±1 cellule."""
    if len(pts) == 0:
        return None
    ci, cj = int(math.floor(lat / GRID)), int(math.floor(lon / GRID))
    idx = []
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            idx.extend(grid.get((ci + di, cj + dj), []))
    if not idx:
        return None
    sub = pts[idx]
    return float(np.min(hav_km(lat, lon, sub[:, 0], sub[:, 1])))

def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes

# ── Exposition cumulée (modèle de SCORE) ───────────────────────────────────────
def _grid_cells(pts, cell):
    g = {}
    for k in range(len(pts)):
        key = (int(math.floor(pts[k, 0] / cell)), int(math.floor(pts[k, 1] / cell)))
        g.setdefault(key, []).append(k)
    return g

def cum_line(lat, lon, pts, grid, cell, R):
    """Intégrale de proximité le long d'une classe de lignes dans R : sum (1-d/R)*DENSIFY_KM.

    Voisinage ±2 cellules (cell ~= R) : couvre tout point à <= R, partout en France.
    """
    if len(pts) == 0:
        return 0.0
    ci, cj = int(math.floor(lat / cell)), int(math.floor(lon / cell))
    idx = []
    for di in (-2, -1, 0, 1, 2):
        for dj in (-2, -1, 0, 1, 2):
            idx.extend(grid.get((ci + di, cj + dj), []))
    if not idx:
        return 0.0
    sub = pts[idx]
    d = hav_km(lat, lon, sub[:, 0], sub[:, 1])
    return float(np.clip(1 - d / R, 0, None).sum()) * DENSIFY_KM

def aero_term(lat, lon, aero):
    """Contribution ponctuelle de l'aéroport commercial le plus proche : W_AERO*(1-d/R_AERO)."""
    if len(aero) == 0:
        return 0.0
    dm = float(np.min(hav_km(lat, lon, aero[:, 0], aero[:, 1])))
    return W_AERO * max(0.0, 1 - dm / R_AERO)

def compute_all(communes, auto, lgv, rmain, branch, aero):
    """Par commune : {score, src, dist, E}. score = exposition cumulée saturée ; src/dist = récit."""
    cell = R_EXPO / 111.0
    gA, gL, gM, gB = (_grid_cells(auto, cell), _grid_cells(lgv, cell),
                      _grid_cells(rmain, cell), _grid_cells(branch, cell))
    # grilles séparées (maille GRID=0.1) pour le récit « source la plus proche »
    rA, rL, rM, rB, rE = (_grid(auto), _grid(lgv), _grid(rmain), _grid(branch), _grid(aero))
    out = []
    for c in communes:
        la, lo = c["lat"], c["lon"]
        E = (W_AUTO * cum_line(la, lo, auto, gA, cell, R_EXPO)
             + W_MAIN * cum_line(la, lo, rmain, gM, cell, R_EXPO)
             + W_LGV * cum_line(la, lo, lgv, gL, cell, R_EXPO)
             + W_BRANCH * cum_line(la, lo, branch, gB, cell, R_EXPO)
             + aero_term(la, lo, aero))
        src, dist = recit_dominant(nearest_km(la, lo, auto, rA), nearest_km(la, lo, lgv, rL),
                                   nearest_km(la, lo, rmain, rM), nearest_km(la, lo, branch, rB),
                                   nearest_km(la, lo, aero, rE))
        out.append({"score": score_from_exposure(E), "src": src, "dist": dist, "E": round(E, 1)})
    return out

# Témoins : la validation qualitative locale prime sur la distribution nationale.
# La Rochelle + sa couronne = juge principal (territoire connu du porteur). Codes INSEE
# vérifiés par nom dans l'index (piège : 17290=Prignac, pas Puilboreau ; PLM = arrondissements).
TEMOINS = {
    "17300": "La Rochelle",
    "17200": "  Lagord (couronne LR)",
    "17291": "  Puilboreau (couronne LR)",
    "17028": "  Aytré (couronne LR)",
    "17010": "  Angoulins (couronne LR ext.)",
    "75101": "Paris 1er",
    "69381": "Lyon 1er",
    "13201": "Marseille 1er",
    "31555": "Toulouse",
    "33063": "Bordeaux",
    "44109": "Nantes",
    "59350": "Lille",
    "34172": "Montpellier",
    "06088": "Nice",
    "01033": "Valserhône (village/A40)",
    "15014": "Aurillac",
    "15012": "Arpajon-sur-Cère",
    "12202": "Rodez",
    "09122": "Foix",
    "48095": "Mende (isolé)",
    "50129": "bourg Manche (rural)",
}

def _f(x):
    return "n/a" if x is None else f"{x:.1f}"

def _show_temoins(communes, results):
    by = {c["insee"]: i for i, c in enumerate(communes)}
    print(f"\n{'commune':28} {'EXPO':>7} {'score':>6} {'src':>5} {'dkm':>6}", file=sys.stderr)
    for ins, lib in TEMOINS.items():
        if ins not in by:
            print(f"{lib:28} {'ABSENT':>7}", file=sys.stderr); continue
        r = results[by[ins]]
        print(f"{lib:28} {r['E']:>7} {r['score']:>6} {str(r['src']):>5} {_f(r['dist']):>6}", file=sys.stderr)

def selftest():
    assert expo_class(0.0, 1.5) == 1.0
    assert expo_class(1.5, 1.5) == 0.0
    assert abs(expo_class(0.75, 1.5) - 0.5) < 1e-9
    assert expo_class(None, 1.5) == 0.0
    # récit (source la plus proche), jamais le score
    assert recit_dominant(None, None, None, None, None) == (None, None)
    assert recit_dominant(50.0, 50.0, 50.0, 50.0, 50.0) == (None, None)  # loin de tout : silence
    assert recit_dominant(1.0, None, None, None, None) == ("auto", 1.0)  # auto 1 km / R_AUTO 2
    assert recit_dominant(None, None, None, None, 4.0) == ("aero", 4.0)  # aéro 4 km / R_AERO 8
    assert recit_dominant(None, None, None, 0.3, None) == ("rail", 0.3)  # branch s'affiche « rail »
    assert recit_dominant(None, None, 1.2, 0.3, None) == ("rail", 0.3)   # branch proche domine main loin
    # score saturant : E=0 -> 100, demi-vie H_HALF
    assert score_from_exposure(0.0) == 100
    assert score_from_exposure(H_HALF) == 50
    assert score_from_exposure(2 * H_HALF) == 25
    # exposition cumulée : un point au contact -> (1-0)*DENSIFY_KM
    p = np.array([[45.0, 1.0]]); cell = R_EXPO / 111.0
    assert abs(cum_line(45.0, 1.0, p, _grid_cells(p, cell), cell, R_EXPO) - DENSIFY_KM) < 1e-9
    assert cum_line(45.0, 1.0, np.empty((0, 2)), {}, cell, R_EXPO) == 0.0
    # aéroport au contact -> W_AERO ; loin -> 0
    assert aero_term(45.0, 1.0, np.array([[45.0, 1.0]])) == W_AERO
    assert aero_term(45.0, 1.0, np.array([[10.0, 1.0]])) == 0.0
    # rail_tier : hiérarchie OSM (proxy), LGV prime, secondaire inclus, inerte exclu
    assert rail_tier({"highspeed": "yes"}) == "lgv"
    assert rail_tier({"highspeed": "yes", "usage": "branch"}) == "lgv"  # LGV prime
    assert rail_tier({"usage": "main"}) == "main"
    assert rail_tier({"usage": "branch"}) == "branch"
    assert rail_tier({"usage": "industrial"}) is None
    assert rail_tier({"service": "siding"}) is None
    assert rail_tier({"disused": "yes", "usage": "main"}) is None
    assert rail_tier({}) is None  # rail sans usage connu : exclu (prudence V1)
    print("✓ selftest OK", file=sys.stderr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh-osm", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return

    if args.summary:
        auto, lgv, rmain, branch, aero, aero_iata = load_osm(refresh=args.refresh_osm)
        print(f"points autoroute/voie rapide : {len(auto)}", file=sys.stderr)
        print(f"points rail LGV / main / branch : {len(lgv)} / {len(rmain)} / {len(branch)}", file=sys.stderr)
        print(f"aéroports commerciaux retenus : {len(aero_iata)} -> {' '.join(aero_iata)}", file=sys.stderr)
        return

    if args.probe or args.matrix:
        idx, communes = load_communes()
        auto, lgv, rmain, branch, aero, _ = load_osm(refresh=args.refresh_osm)
        print(f"R_EXPO={R_EXPO} H={H_HALF} W(auto/main/lgv/branch/aero)="
              f"{W_AUTO}/{W_MAIN}/{W_LGV}/{W_BRANCH}/{W_AERO}", file=sys.stderr)
        results = compute_all(communes, auto, lgv, rmain, branch, aero)
        _show_temoins(communes, results)
        if args.matrix:
            import collections
            scores = [r["score"] for r in results]
            buckets = collections.Counter(s // 10 * 10 for s in scores)
            n100 = sum(1 for s in scores if s == 100)
            print(f"\ndistribution score : {dict(sorted(buckets.items()))}", file=sys.stderr)
            print(f"score=100 (loin de tout) : {n100}/{len(scores)} ({100*n100//len(scores)} %)", file=sys.stderr)
        return

    # Calcul national complet -> cache (+ index si --write-index)
    idx, communes = load_communes()
    auto, lgv, rmain, branch, aero, _ = load_osm(refresh=args.refresh_osm)
    print(f"communes : {len(communes)} | R_EXPO={R_EXPO} H={H_HALF}", file=sys.stderr)
    results = compute_all(communes, auto, lgv, rmain, branch, aero)
    rec = {}
    for c, r in zip(communes, results):
        rec[c["insee"]] = {"score": r["score"], "sourceDominante": r["src"], "distanceKm": r["dist"]}
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(OUT_CACHE, "w"))
    print(f"✓ cache écrit : {OUT_CACHE}", file=sys.stderr)
    if args.write_index:
        for c in idx["communes"]:
            c["calmeSonore"] = rec.get(c["insee"])  # non géolocalisée -> None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (calmeSonore)", file=sys.stderr)

if __name__ == "__main__":
    main()
