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


if __name__ == "__main__":
    main()
