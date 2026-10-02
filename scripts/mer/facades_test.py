#!/usr/bin/env python3
"""FUT-33, phase 1 : peut-on rattacher un point de rivage à une façade maritime officielle ?

Source : « Planification maritime » DGAMPA-Shom (couche MSP_Spatial_Plan, une emprise par façade : MEMN, NAMO,
SA, MED). Pour chaque commune à moins de 2 km (territoire) du rivage marin, on prend le point de rivage le plus
proche et on cherche la façade dont l'emprise est la plus proche de ce point. On mesure la distance du point à
l'emprise : si l'emprise borde réellement le rivage, elle est faible ; sinon le rattachement est fragile.
Aucune notion utilisateur (« Atlantique », « Manche »…) n'est produite ici.
"""
import argparse
import collections
import json
from pathlib import Path

import numpy as np
import pyogrio
import shapely
import shapely.ops
from pyproj import Transformer

FACADES = {"MEMN": "Manche Est-mer du Nord", "NAMO": "Nord Atlantique-Manche Ouest", "SA": "Sud-Atlantique", "MED": "Méditerranée"}


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--planif", type=Path, required=True, help="dossier PLANIFICATION_MARITIME_PACK")
    ap.add_argument("--out", type=Path, required=True, help="dossier des sorties de build_mer.py")
    a = ap.parse_args()
    vers93 = Transformer.from_crs(4326, 2154, always_xy=True)
    emprises = {}
    for code in FACADES:
        _, _, g, _ = pyogrio.raw.read(a.planif / f"MD_EMODNet_{code}.gpkg", layer="MSP_Spatial_Plan")
        geom = shapely.union_all(shapely.from_wkb(g))
        emprises[code] = shapely.transform(geom, lambda xy: np.column_stack(vers93.transform(xy[:, 0], xy[:, 1])))
    brut = (a.out / "rivage-marin.wkb").read_bytes()
    rivage, k = [], 0
    while k < len(brut):
        n = int.from_bytes(brut[k:k + 4], "little")
        rivage.append(shapely.from_wkb(brut[k + 4:k + 4 + n]))
        k += 4 + n
    arbre = shapely.STRtree(rivage)
    contours_centres = json.loads((a.out / "mer-communes.json").read_text())
    import gzip
    index = {c["insee"]: c for c in json.loads(gzip.open("/Users/quentinbrache/Desktop/Futur·e/data/comparateur-index.json.gz").read())["communes"]}
    lignes = []
    for c in contours_centres:
        if c["territoire_km"] is None or c["territoire_km"] > 2:
            continue
        e = index[c["insee"]]
        p = shapely.Point(*vers93.transform(e["lon"], e["lat"]))
        r = rivage[int(arbre.query_nearest(p)[0])]
        q = shapely.ops.nearest_points(r, p)[0]
        d = {code: shapely.distance(q, g) for code, g in emprises.items()}
        best = min(d, key=d.get)
        second = sorted(d.values())[1]
        lignes.append({"insee": c["insee"], "nom": c["nom"], "dept": c["dept"], "facade": best,
                       "dist_emprise_m": round(d[best]), "marge_seconde_m": round(second - d[best])})
    dist = [l["dist_emprise_m"] for l in lignes]
    marges = [l["marge_seconde_m"] for l in lignes]
    res = {
        "communes_testees": len(lignes),
        "par_facade": dict(collections.Counter(l["facade"] for l in lignes)),
        "distance_point_rivage_a_emprise_m": {"mediane": float(np.median(dist)), "p95": float(np.percentile(dist, 95)), "max": max(dist)},
        "ambigues_marge_lt_2km": [l for l in lignes if l["marge_seconde_m"] < 2000],
        "loin_emprise_gt_2km": [l for l in lignes if l["dist_emprise_m"] > 2000][:30],
        "cas": [l for l in lignes if l["insee"] in ("29019", "33009", "44184", "62193", "64122", "17094", "13201", "76217", "50129", "34301", "85194")],
    }
    (a.out / "facades-test.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print(json.dumps({k: v for k, v in res.items() if k != "loin_emprise_gt_2km"}, ensure_ascii=False, indent=1)[:4000])


if __name__ == "__main__":
    principal()
