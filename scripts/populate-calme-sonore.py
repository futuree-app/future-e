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

# ── Rayons caractéristiques par classe (km) : décroissance linéaire absolue. ────
# Valeurs INITIALES indicatives, à CONFIRMER/AJUSTER par la sonde (gate porteur)
# avant la matrice témoins. Un aéroport porte plus loin qu'une autoroute (R_AUTO<R_RAIL<R_AERO).
R_AUTO = 1.5
R_RAIL = 3.0
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

def score_from_dists(d_auto, d_rail, d_aero):
    """Combinaison MAX (source dominante) -> (score 0-100, classe dominante, distance dominante).

    Loin de toute source -> expo 0 -> score 100. Ne renvoie JAMAIS None (calme = mesure, pas absence).
    """
    cands = [
        ("auto", d_auto, expo_class(d_auto, R_AUTO)),
        ("rail", d_rail, expo_class(d_rail, R_RAIL)),
        ("aero", d_aero, expo_class(d_aero, R_AERO)),
    ]
    src, dist, e = max(cands, key=lambda x: x[2])
    score = round(100 * (1 - e))
    if e <= 0.0:
        return 100, None, None  # calme : aucune source dominante à nommer
    return score, src, round(dist, 1)

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

def classify_rail(tags):
    """True si voie ferrée de GRANDE CIRCULATION (source de bruit). Filtre le secondaire/inerte.

    Inclut : usage=main, OU highspeed=yes (LGV). Exclut explicitement service, sidings,
    usage industrial/tourism/military/branch, disused/abandoned/construction.
    """
    if tags.get("service"):
        return False
    if tags.get("usage") in ("industrial", "tourism", "military", "branch"):
        return False
    for k in ("disused", "abandoned", "construction", "razed", "proposed"):
        if tags.get(k) or tags.get("railway") == k:
            return False
    return tags.get("usage") == "main" or tags.get("highspeed") == "yes"

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
    """Retourne (auto_pts, rail_pts, aero_pts) : 3 arrays Nx2 (lat,lon) en float64."""
    os.makedirs(OSM_TILE_DIR, exist_ok=True)
    auto, rail, aero = [], [], []
    for (s, w, n, e) in tiles():
        for name, q, sink in (("roads", query_roads, auto), ("rail", query_rail, rail)):
            dest = os.path.join(OSM_TILE_DIR, f"{name}_{s}_{w}.json")
            for el in _tile_elements(dest, q, s, w, n, e, refresh):
                if el.get("type") != "way" or "geometry" not in el:
                    continue
                if name == "rail" and not classify_rail(el.get("tags", {})):
                    continue
                sink.extend(densify(el["geometry"]))
        dest = os.path.join(OSM_TILE_DIR, f"airports_{s}_{w}.json")
        for el in _tile_elements(dest, query_airports, s, w, n, e, refresh):
            iata = (el.get("tags", {}).get("iata") or "").strip().upper()
            if iata not in WHITELIST_IATA:
                continue
            c = el.get("center") or el
            if c.get("lat") is not None:
                aero.append((c["lat"], c["lon"], iata))
    def arr(p):
        return np.array([(x[0], x[1]) for x in p], dtype=np.float64) if p else np.empty((0, 2))
    aero_iata = sorted({x[2] for x in aero})
    return arr(auto), arr(rail), arr(aero), aero_iata

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

def compute_dists(communes, auto, rail, aero):
    ga, gr, ge = _grid(auto), _grid(rail), _grid(aero)
    out = []
    for c in communes:
        la, lo = c["lat"], c["lon"]
        out.append((nearest_km(la, lo, auto, ga),
                    nearest_km(la, lo, rail, gr),
                    nearest_km(la, lo, aero, ge)))
    return out

# Témoins : la validation qualitative locale prime sur la distribution nationale.
# La Rochelle = juge principal (aéroport régional + rocade + voie ferrée).
TEMOINS = {
    "17300": "La Rochelle (aéroport + rocade + rail)",
    "75056": "Paris (axes + aéroports proches)",
    "69123": "Lyon (rocade / A7)",
    "31555": "Toulouse (périph + Blagnac)",
    "13055": "Marseille (rocade + voies)",
    "01033": "Bellegarde-Valserhône (LGV + A40)",
    "15014": "Aurillac secteur (Cantal, attendu calme)",
    "48095": "Mende (Lozère isolé, attendu ~100)",
    "12145": "Rodez secteur (Aveyron)",
    "50129": "un bourg de la Manche (rural)",
}

def _f(x):
    return "n/a" if x is None else f"{x:.1f}"

def _probe_matrix(communes, dists, mode):
    by = {c["insee"]: i for i, c in enumerate(communes)}
    header = f"\n{'commune':42} {'d_auto':>8} {'d_rail':>8} {'d_aero':>8}"
    if mode == "matrix":
        header += f" {'score':>6} {'src':>5} {'d_km':>6}"
    print(header, file=sys.stderr)
    for ins, lib in TEMOINS.items():
        if ins not in by:
            print(f"{lib:42} {'ABSENT':>8}", file=sys.stderr); continue
        da, dr, de = dists[by[ins]]
        cells = f"{_f(da):>8} {_f(dr):>8} {_f(de):>8}"
        if mode == "matrix":
            sc, src, d = score_from_dists(da, dr, de)
            cells += f" {sc:>6} {str(src):>5} {_f(d):>6}"
        print(f"{lib:42} {cells}", file=sys.stderr)

def selftest():
    assert expo_class(0.0, 1.5) == 1.0
    assert expo_class(1.5, 1.5) == 0.0
    assert abs(expo_class(0.75, 1.5) - 0.5) < 1e-9
    assert expo_class(99.0, 8.0) == 0.0
    assert expo_class(None, 1.5) == 0.0
    # loin de tout -> 100, pas de source dominante, jamais None
    assert score_from_dists(50.0, 50.0, 50.0) == (100, None, None)
    # autoroute proche domine une voie ferrée plus lointaine (en expo)
    s, src, d = score_from_dists(0.75, 2.0, None)  # expo_auto .5 vs expo_rail .33
    assert (src, d) == ("auto", 0.8), (src, d)
    assert s == 50
    # aéroport à 4 km : expo .5 sur R_AERO=8
    s, src, d = score_from_dists(None, None, 4.0)
    assert (s, src, d) == (50, "aero", 4.0), (s, src, d)
    # rail : ne garder que la grande circulation (usage=main / LGV), jeter le reste
    assert classify_rail({"usage": "main"}) is True
    assert classify_rail({"highspeed": "yes"}) is True
    assert classify_rail({"usage": "branch"}) is False
    assert classify_rail({"usage": "industrial"}) is False
    assert classify_rail({"service": "siding"}) is False
    assert classify_rail({"disused": "yes", "usage": "main"}) is False
    assert classify_rail({}) is False  # rail sans usage connu : exclu (prudence V1)
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
        auto, rail, aero, aero_iata = load_osm(refresh=args.refresh_osm)
        print(f"points autoroute/voie rapide : {len(auto)}", file=sys.stderr)
        print(f"points rail principal        : {len(rail)}", file=sys.stderr)
        print(f"aéroports commerciaux retenus : {len(aero_iata)} -> {' '.join(aero_iata)}", file=sys.stderr)
        return

    if args.probe:
        idx, communes = load_communes()
        auto, rail, aero, _ = load_osm(refresh=args.refresh_osm)
        dists = compute_dists(communes, auto, rail, aero)
        _probe_matrix(communes, dists, "probe")
        return

    print("calcul national : voir --matrix / --write-index", file=sys.stderr)

if __name__ == "__main__":
    main()
