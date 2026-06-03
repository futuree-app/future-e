#!/usr/bin/env python3
"""populate-transports.py — accès ferroviaire pondéré par la desserte (SNCF Open Data).

Pour chaque commune (lat/lon de l'index), accès = max sur gares à <100 km de
  voyageurs_g / (1 + (d/20)^2)
voyageurs_g = total_voyageurs_2024 (jointure UIC) ou proxy de segment DRG (fallback).
Percentile national -> c.transport. Venv .venv-bpe (numpy).

Usage :
    .venv-bpe/bin/python scripts/populate-transports.py                # résumé
    .venv-bpe/bin/python scripts/populate-transports.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
GARES_URL = "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/gares-de-voyageurs/exports/json"
FREQ_URL = "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/frequentation-gares/exports/json"
SEG_PROXY = {"A": 5_000_000.0, "B": 500_000.0, "C": 50_000.0}
CUTOFF_KM = 100.0
TAU_KM = 20.0
R_KM = 6371.0


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-transports"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode("utf-8"))


def load_gares():
    gares = fetch_json(GARES_URL)
    freq = fetch_json(FREQ_URL)
    freq_by_uic = {}
    for f in freq:
        uic = str(f.get("code_uic_complet") or "").strip()
        v = f.get("total_voyageurs_2024")
        if uic and v is not None:
            freq_by_uic[uic] = float(v)
    lats, lons, voys, noms = [], [], [], []
    joined = 0
    for g in gares:
        pos = g.get("position_geographique")
        if not pos or pos.get("lat") is None or pos.get("lon") is None:
            continue
        uic = str(g.get("codes_uic") or "").split(";")[0].strip()
        seg = (g.get("segment_drg") or "C").strip().upper()
        v = freq_by_uic.get(uic)
        if v is not None:
            joined += 1
        else:
            v = SEG_PROXY.get(seg, SEG_PROXY["C"])  # fallback segment
        lats.append(float(pos["lat"])); lons.append(float(pos["lon"])); voys.append(v); noms.append(g.get("nom"))
    print(f"gares chargées : {len(lats)} | fréquentations jointes : {joined}", file=sys.stderr)
    return (np.radians(np.array(lats)), np.radians(np.array(lons)), np.array(voys), noms)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    glat, glon, gvoy, gnoms = load_gares()
    idx = json.load(open(INDEX))
    communes = idx["communes"]

    raws = []      # acces_raw aligné sur communes (None si lat/lon absents)
    best = []      # (nom, km) de la meilleure gare, ou (None, None)
    for c in communes:
        lat, lon = c.get("lat"), c.get("lon")
        if lat is None or lon is None:
            raws.append(None); best.append((None, None)); continue
        rlat = np.radians(lat); rlon = np.radians(lon)
        dlat = glat - rlat; dlon = glon - rlon
        a = np.sin(dlat / 2) ** 2 + np.cos(rlat) * np.cos(glat) * np.sin(dlon / 2) ** 2
        d = 2 * R_KM * np.arcsin(np.sqrt(a))  # km
        mask = d <= CUTOFF_KM
        if not mask.any():
            raws.append(0.0); best.append((None, None)); continue
        atten = gvoy[mask] / (1 + (d[mask] / TAU_KM) ** 2)
        j = int(np.argmax(atten))
        idx_global = int(np.nonzero(mask)[0][j])
        raws.append(float(atten[j]))
        best.append((gnoms[idx_global], round(float(d[idx_global]), 1)))

    finite = sorted(r for r in raws if r is not None)
    n = len(finite)

    def pct(x):
        return round(100 * bisect.bisect_right(finite, x) / n) if n else 0

    order = sorted((i for i, r in enumerate(raws) if r is not None), key=lambda i: raws[i], reverse=True)[:5]
    print("mieux desservies :", file=sys.stderr)
    for i in order:
        print(f"  {communes[i]['nom']} -> gare {best[i][0]} ({best[i][1]} km), desserte {pct(raws[i])}", file=sys.stderr)

    if args.write_index:
        hit = 0
        for c, r, (gn, gk) in zip(communes, raws, best):
            if r is None:
                c["transport"] = None
            else:
                c["transport"] = {"desserte": pct(r), "gare_nom": gn, "gare_km": gk}
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(communes)} communes avec transport", file=sys.stderr)


if __name__ == "__main__":
    main()
