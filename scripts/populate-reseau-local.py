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
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

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


if __name__ == "__main__":
    main()
