#!/usr/bin/env python3
"""populate-reseau-local.py — mobilité du quotidien : accès à un réseau TC à portée de marche.

Couverture = somme pondérée (1 - d/R) des arrêts GTFS dédoublonnés dans un petit rayon R
autour du centroïde communal ; × facteur mode (tram/métro détectés via nœuds OSM). Normalisé
en percentile PARMI LES COMMUNES DESSERVIES (zéro épinglé -> null). cf. spec 2026-06-04.

Venv .venv-bpe (numpy). Modes :
    .venv-bpe/bin/python scripts/populate-reseau-local.py --selftest
    .venv-bpe/bin/python scripts/populate-reseau-local.py --summary
    .venv-bpe/bin/python scripts/populate-reseau-local.py --probe
    .venv-bpe/bin/python scripts/populate-reseau-local.py --write-index
"""
import json, os, sys, csv, math, argparse, bisect, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
STOPS_CACHE = os.path.join(CACHE, "gtfs-stops-france.csv")
OSM_CACHE = os.path.join(CACHE, "osm-tram-metro.json")

STOPS_URL = "https://transport.data.gouv.fr/resources/81333/download"
# Plusieurs miroirs Overpass : le principal renvoie souvent 504 sur une requête à l'échelle
# pays. On essaie chacun, avec retry, jusqu'à succès (cf. garde-fou Overpass, spec).
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]

# Rayon d'accès « pas de porte » (marche), en mètres. FIXÉ PAR LA SONDE (Task 3).
RADIUS_M = 1000
DEDUP_DEG = 0.0005   # ~55 m : un arrêt unique par cellule (anti double-comptage multi-GTFS)
CELL = 0.02          # grille de recherche couverture (~2,2 km lat)
NEI = 2              # ±2 cellules couvrent 1,5 km partout (lon ~0.0215° à 51°N)
R_EARTH = 6371.0


def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))


def weight(d_km, r_km):
    """Poids de proximité linéaire, fort (appelé uniquement pour d <= r)."""
    return 1.0 - d_km / r_km


def mode_factor(tram, metro):
    """Facteur de rehaussement par mode structurant. Métro > tram > bus."""
    return 2.0 if metro else (1.5 if tram else 1.0)


def normalize_access(raws):
    """Zéro épinglé -> None ; percentile 1-100 PARMI les communes desservies (raw > 0)."""
    pos = sorted(r for r in raws if r > 0)
    m = len(pos)
    out = []
    for r in raws:
        if r <= 0 or m == 0:
            out.append(None)
        else:
            out.append(max(1, round(100 * bisect.bisect_right(pos, r) / m)))
    return out


def cell_key(lat, lon, size):
    return (int(math.floor(lat / size)), int(math.floor(lon / size)))


def download(url, dest, data=None):
    """Télécharge url -> dest si absent. data (bytes) => POST. Retourne dest."""
    if os.path.exists(dest):
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "futur-e/populate-reseau-local"})
    with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def load_stops():
    """Arrêts GTFS nationaux : vrais arrêts (location_type 0/vide), dédoublonnés ~55 m.
    Retourne (lats, lons) numpy."""
    path = download(STOPS_URL, STOPS_CACHE)
    seen = set()
    lats, lons = [], []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lt = (row.get("location_type") or "").strip()
            if lt not in ("", "0"):
                continue
            try:
                la = float(row["stop_lat"]); lo = float(row["stop_lon"])
            except (TypeError, ValueError):
                continue
            if not (math.isfinite(la) and math.isfinite(lo)):
                continue
            k = cell_key(la, lo, DEDUP_DEG)
            if k in seen:
                continue
            seen.add(k)
            lats.append(la); lons.append(lo)
    print(f"arrêts GTFS dédoublonnés : {len(lats)}", file=sys.stderr)
    return np.array(lats, dtype="float64"), np.array(lons, dtype="float64")


OVERPASS_QUERY = """
[out:json][timeout:180];
area["ISO3166-1"="FR"][admin_level=2]->.fr;
(
  node["railway"="tram_stop"](area.fr);
  node["railway"="station"]["station"="subway"](area.fr);
  node["railway"="station"]["subway"="yes"](area.fr);
  node["station"="subway"](area.fr);
);
out body;
""".strip()


def fetch_overpass(dest):
    """Interroge les miroirs Overpass dans l'ordre (2 tentatives chacun) jusqu'à une réponse
    JSON valide non vide, écrite dans dest."""
    payload = urllib.parse.urlencode({"data": OVERPASS_QUERY}).encode()
    last = None
    for url in OVERPASS_MIRRORS:
        for attempt in (1, 2):
            try:
                req = urllib.request.Request(url, data=payload,
                                             headers={"User-Agent": "futur-e/populate-reseau-local"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    body = r.read()
                doc = json.loads(body)
                if doc.get("elements"):
                    with open(dest, "wb") as f:
                        f.write(body)
                    print(f"OSM via {url.split('/')[2]}", file=sys.stderr)
                    return dest
                last = f"{url}: réponse sans 'elements'"
            except Exception as e:  # noqa: BLE001 (résilience réseau volontaire)
                last = f"{url} (essai {attempt}) : {e}"
                print(f"  Overpass KO {last}", file=sys.stderr)
    raise RuntimeError(f"tous les miroirs Overpass ont échoué. Dernier : {last}")


def load_osm_modes(refresh=False):
    """Nœuds OSM tram (railway=tram_stop) et métro (station subway). Caché en JSON brut.
    Retourne (tram_lat, tram_lon, metro_lat, metro_lon) numpy."""
    if refresh and os.path.exists(OSM_CACHE):
        os.remove(OSM_CACHE)
    if not os.path.exists(OSM_CACHE):
        os.makedirs(os.path.dirname(OSM_CACHE), exist_ok=True)
        fetch_overpass(OSM_CACHE)
    elements = json.load(open(OSM_CACHE)).get("elements", [])
    tl, to, ml, mo = [], [], [], []
    for e in elements:
        if e.get("lat") is None or e.get("lon") is None:
            continue
        if (e.get("tags") or {}).get("railway") == "tram_stop":
            tl.append(e["lat"]); to.append(e["lon"])
        else:
            ml.append(e["lat"]); mo.append(e["lon"])
    print(f"OSM tram : {len(tl)} | OSM métro : {len(ml)}", file=sys.stderr)
    return (np.array(tl, "float64"), np.array(to, "float64"),
            np.array(ml, "float64"), np.array(mo, "float64"))


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes


def selftest():
    assert weight(0.0, 1.0) == 1.0
    assert weight(0.5, 1.0) == 0.5
    assert abs(weight(1.0, 1.0)) < 1e-9
    assert mode_factor(False, False) == 1.0
    assert mode_factor(True, False) == 1.5
    assert mode_factor(False, True) == 2.0
    assert mode_factor(True, True) == 2.0
    # normalisation : zéros -> None ; positifs -> percentile parmi desservies (3 positifs).
    assert normalize_access([0, 0, 5, 10, 20]) == [None, None, 33, 67, 100]
    assert normalize_access([0, 0, 0]) == [None, None, None]
    assert cell_key(0.0, 0.0, 0.0005) == (0, 0)
    assert cell_key(0.00051, 0.0, 0.0005) == (1, 0)
    assert cell_key(-0.00001, 0.0, 0.0005) == (-1, 0)
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh-osm", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return

    if args.summary:
        idx, communes = load_communes()
        print(f"communes géolocalisées : {len(communes)}", file=sys.stderr)
        load_stops()
        load_osm_modes(refresh=args.refresh_osm)
        return


if __name__ == "__main__":
    main()
