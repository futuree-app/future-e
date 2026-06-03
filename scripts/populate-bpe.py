#!/usr/bin/env python3
"""
populate-bpe.py — accès écoles (collèges+lycées) et culture (offre large) par rayon.

Calque populate-nature.py : pour chaque centroïde de commune (lu dans l'index), compte
les équipements BPE pertinents dans un rayon RAYON_KM, normalise en percentile national.
Accès / présence, JAMAIS la qualité ni la vitalité.

Source : data/bpe24.parquet (BPE24 INSEE géolocalisée, téléchargée hors runtime).
Codes TYPEQU confirmés empiriquement sur la donnée (NOMRS) en Task 1 du plan.
Usage (depuis un venv avec pyarrow + numpy, cf. .venv-bpe) :
    python scripts/populate-bpe.py                # calcule + écrit le cache
    python scripts/populate-bpe.py --write-index  # en plus, patche comparateur-index.json
"""
import json, os, sys, argparse, bisect
import numpy as np
import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
PARQUET = os.path.join(ROOT, "data", "bpe24.parquet")
CACHE = os.path.join(ROOT, "data", ".cache")
OUT = os.path.join(CACHE, "communes-bpe.json")

RAYON_KM = 15
CELL = 0.18  # grille spatiale, comme populate-nature.py

# Confirmés sur la donnée (échantillon NOMRS, métropole + DOM concordants).
# Écoles = secondaire : collège + lycées (gén/techno, pro, agricole). Primaire et supérieur
# exclus ; C304/C305 (sections internes) exclus pour ne pas double-compter un même site.
ECOLES_TYPEQU = {"C201", "C301", "C302", "C303"}
# Culture au sens large : cinéma, conservatoire (pratique), bibliothèque/médiathèque, musée,
# théâtre/salle de spectacle/scène. Exclus : F313 (monuments/jardins = tourisme), F314 (archives).
CULTURE_TYPEQU = {"F303", "F305", "F307", "F312", "F315"}

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


def load_equip_points(typequ_set):
    """Retourne (lats, lons) des équipements dont TYPEQU est dans typequ_set, géoloc valide."""
    t = pq.read_table(PARQUET, columns=[COL_TYPE, COL_LAT, COL_LON])
    types = np.array(t.column(COL_TYPE).to_pylist(), dtype=object)
    lats = np.array(t.column(COL_LAT).to_pylist(), dtype="float64")
    lons = np.array(t.column(COL_LON).to_pylist(), dtype="float64")
    keep = np.isin(types, list(typequ_set)) & np.isfinite(lats) & np.isfinite(lons)
    return lats[keep], lons[keep]


def count_within_radius(clat, clon, elat, elon):
    """Pour chaque commune (clat/clon), compte les équipements (elat/elon) dans RAYON_KM.
    Grille spatiale sur les équipements pour éviter le O(n*m)."""
    grid = {}
    for j in range(len(elat)):
        grid.setdefault((int(elat[j] // CELL), int(elon[j] // CELL)), []).append(j)
    out = np.zeros(len(clat), dtype=np.int64)
    for i in range(len(clat)):
        ci, cj = int(clat[i] // CELL), int(clon[i] // CELL)
        idxs = []
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                idxs += grid.get((ci + di, cj + dj), [])
        if not idxs:
            continue
        idxs = np.array(idxs)
        d = haversine_np(clat[i], clon[i], elat[idxs], elon[idxs])
        out[i] = int((d <= RAYON_KM).sum())
    return out


def percentile_scores(counts):
    """Percentile national du comptage (bisect, comme finalize() de populate-nature.py)."""
    srt = sorted(int(c) for c in counts)
    n = len(srt)
    return [round(100 * bisect.bisect_right(srt, int(c)) / n) if n else None for c in counts]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    codes = [c["insee"] for c in communes]
    clat = np.array([c["lat"] for c in communes], dtype="float64")
    clon = np.array([c["lon"] for c in communes], dtype="float64")
    print(f"communes géolocalisées : {len(communes)}", file=sys.stderr)

    rec = {code: {} for code in codes}
    for field, typeset in (("ecoles", ECOLES_TYPEQU), ("culture", CULTURE_TYPEQU)):
        elat, elon = load_equip_points(typeset)
        print(f"{field} : {len(elat)} équipements géolocalisés", file=sys.stderr)
        counts = count_within_radius(clat, clon, elat, elon)
        scores = percentile_scores(counts)
        for i, code in enumerate(codes):
            rec[code][field] = {"score": scores[i], "count": int(counts[i])}

    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(OUT, "w"))
    print(f"✓ cache écrit : {OUT} ({len(rec)} communes)", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champs ecoles + culture : score + count)", file=sys.stderr)


if __name__ == "__main__":
    main()
