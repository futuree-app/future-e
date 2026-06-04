#!/usr/bin/env python3
"""populate-vie-locale.py — intensité de vie sociale (lieux de sociabilité OSM + tissu associatif).

Pour chaque commune : densité = compte/(pop+K) pour les lieux (OSM) et les associations
(RNA waldec + AMALIA), percentile parmi les communes non nulles (zéro épinglé), score
= 0.7·P_lieux + 0.3·P_assos. cf. spec 2026-06-04-vie-locale.

Venv .venv-bpe (numpy). Modes : --selftest --summary --probe --matrix --write-index.
"""
import json, os, sys, csv, io, math, argparse, bisect, zipfile, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
OSM_TILE_DIR = os.path.join(CACHE, "osm-social-tiles")
OUT_CACHE = os.path.join(CACHE, "communes-vie-locale.json")
RNA_WALDEC_ZIP = os.path.join(CACHE, "rna_waldec.zip")
RNA_WALDEC_URL = "https://media.interieur.gouv.fr/rna/rna_waldec_20260601.zip"
AMALIA = {  # dept -> URL data.gouv (CSV ; ETAT_ASSOCIATION, COMMUNE, CODE_POSTAL)
    "67": "https://static.data.gouv.fr/resources/associations-de-droit-local-alsace-moselle-pour-le-departement-du-bas-rhin-67/20260602-153021/67-opendatas.csv",
}
AMALIA_CACHE = os.path.join(CACHE, "amalia")

OVERPASS_MIRRORS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
# Plafond de rattachement : un POI dont le centroïde communal le plus proche est au-delà est
# considéré hors France (POI étranger capté par la tuile bbox près d'une frontière). Évite le
# bug « commune-frontière qui absorbe une région étrangère » (La Brigue). 8 km > distance d'un
# POI français à son centroïde même en zone de montagne peu dense.
MAX_ASSIGN_KM = 8.0
METRO_BBOX = (41.0, -5.6, 51.6, 9.8)
DOM_BBOXES = [(15.7, -61.9, 16.6, -60.9), (14.3, -61.3, 14.9, -60.7),
              (2.0, -54.8, 6.0, -51.5), (-21.5, 55.1, -20.8, 56.0), (-13.1, 44.9, -12.5, 45.4)]
TILE_DEG = 2.0
ASSIGN_CELL = 0.1   # grille de rattachement POI -> commune (centroïde le plus proche)
R_EARTH = 6371.0

# K (masse critique) : population virtuelle au dénominateur. FIGÉ PAR SONDE (Task 4).
K = 3000


def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))


def cell_key(lat, lon, size):
    return (int(math.floor(lat / size)), int(math.floor(lon / size)))


def density(count, pop, k=K):
    """Intensité par habitant lissée par la masse critique k."""
    return count / ((pop or 0) + k)


def component_pct(densities):
    """Zéro épinglé -> 0 ; percentile 1-100 parmi les communes à densité > 0."""
    pos = sorted(d for d in densities if d > 0)
    m = len(pos)
    return [0 if (d <= 0 or m == 0) else max(1, round(100 * bisect.bisect_right(pos, d) / m)) for d in densities]


def combine(p_lieux, p_assos):
    """Score vie_locale = 0.7 lieux + 0.3 assos (composantes déjà 0-100)."""
    return round(0.7 * p_lieux + 0.3 * p_assos)


def overpass_query(s, w, n, e):
    # Requête bbox simple (fiable sur tous les miroirs). Les POI étrangers captés par le
    # débordement frontalier sont écartés au rattachement (MAX_ASSIGN_KM), pas ici : le filtre
    # `area` Overpass s'est révélé fragile selon le miroir (vides silencieux).
    bb = f"({s},{w},{n},{e})"
    body = (f'node["amenity"~"^(cafe|bar|pub|restaurant|marketplace|community_centre)$"]{bb};'
            f'node["leisure"~"^(sports_centre|pitch|stadium|sports_hall)$"]{bb};')
    return f'[out:json][timeout:180];({body});out body;'


def fetch_tile(query, dest):
    payload = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for url in OVERPASS_MIRRORS:
        for attempt in (1, 2):
            try:
                req = urllib.request.Request(url, data=payload, headers={"User-Agent": "futur-e/populate-vie-locale"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    body = r.read()
                doc = json.loads(body)
                if "elements" in doc:
                    with open(dest, "wb") as f:
                        f.write(body)
                    return doc["elements"]
                last = f"{url}: pas d'elements"
            except Exception as e:  # noqa: BLE001
                last = f"{url} (essai {attempt}) : {e}"
    raise RuntimeError(f"tuile Overpass échouée. Dernier : {last}")


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


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes


def load_social_pois():
    """Récupère les POI de sociabilité OSM (tuilé, caché). Retourne (lats, lons) numpy."""
    os.makedirs(OSM_TILE_DIR, exist_ok=True)
    lats, lons = [], []
    tl = tiles()
    for i, (s, w, n, e) in enumerate(tl):
        dest = os.path.join(OSM_TILE_DIR, f"t_{s}_{w}.json")
        if os.path.exists(dest):
            elements = json.load(open(dest)).get("elements", [])
        else:
            elements = fetch_tile(overpass_query(s, w, n, e), dest)
            print(f"  tuile {i+1}/{len(tl)} ({s},{w}) : {len(elements)} POI", file=sys.stderr)
        for el in elements:
            if el.get("lat") is not None and el.get("lon") is not None:
                lats.append(el["lat"]); lons.append(el["lon"])
    print(f"POI sociabilité OSM : {len(lats)}", file=sys.stderr)
    return np.array(lats, "float64"), np.array(lons, "float64")


def assign_to_communes(communes, plat, plon):
    """Rattache chaque POI à la commune au centroïde le plus proche (grille, recherche en
    anneaux croissants). Retourne dict insee -> nb POI."""
    grid = {}
    for i, c in enumerate(communes):
        grid.setdefault(cell_key(c["lat"], c["lon"], ASSIGN_CELL), []).append(i)
    clat = np.array([c["lat"] for c in communes]); clon = np.array([c["lon"] for c in communes])
    counts = {c["insee"]: 0 for c in communes}
    dropped = 0
    for j in range(len(plat)):
        ci, cj = cell_key(plat[j], plon[j], ASSIGN_CELL)
        best = None; bestd = 1e18
        ring = 0
        while best is None and ring <= 20:
            cand = []
            for di in range(-ring, ring + 1):
                for dj in range(-ring, ring + 1):
                    if ring and max(abs(di), abs(dj)) != ring:
                        continue  # seulement l'anneau extérieur
                    cand += grid.get((ci + di, cj + dj), [])
            if cand:
                cand = np.array(cand)
                d = hav_km(plat[j], plon[j], clat[cand], clon[cand])
                k = int(d.argmin())
                if d[k] < bestd:
                    bestd = float(d[k]); best = int(cand[k])
            ring += 1
        if best is not None and bestd <= MAX_ASSIGN_KM:
            counts[communes[best]["insee"]] += 1
        else:
            dropped += 1
    print(f"POI rattachés ; écartés (>{MAX_ASSIGN_KM:.0f} km, hors France) : {dropped}", file=sys.stderr)
    return counts


def selftest():
    assert abs(density(10, 7000) - 10 / 10000) < 1e-12
    assert abs(density(1, 30) - 1 / 3030) < 1e-12   # hameau écrasé par K
    assert density(0, 5000) == 0.0
    # composante : zéros -> 0, positifs -> percentile parmi >0 (3 positifs : 0.001,0.002,0.004)
    assert component_pct([0, 0, 0.001, 0.002, 0.004]) == [0, 0, 33, 67, 100]
    assert component_pct([0, 0]) == [0, 0]
    assert combine(100, 0) == 70
    assert combine(0, 100) == 30
    assert combine(90, 50) == 78
    assert cell_key(0.00051, 0.0, 0.0005) == (1, 0)
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    for f in ("selftest", "summary", "probe", "matrix", "write-index", "refresh-osm"):
        ap.add_argument(f"--{f}", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return

    if args.summary:
        idx, communes = load_communes()
        print(f"communes : {len(communes)}", file=sys.stderr)
        plat, plon = load_social_pois()
        lieux = assign_to_communes(communes, plat, plon)
        nz = sum(1 for v in lieux.values() if v > 0)
        top = sorted(lieux.items(), key=lambda kv: -kv[1])[:5]
        print(f"communes avec ≥1 POI : {nz} | top : {[(k, v) for k, v in top]}", file=sys.stderr)
        return


if __name__ == "__main__":
    main()
