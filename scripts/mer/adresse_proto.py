#!/usr/bin/env python3
"""FUT-33, phase 1 : prototype « distance adresse → rivage marin » et coût de la géométrie embarquée.

Pour plusieurs tolérances de simplification (Douglas-Peucker, topologie conservée), mesure :
  - le poids de la géométrie (WKB brut, et compressé gzip) ;
  - l'erreur de distance par rapport à la géométrie source, sur un panel de points ;
  - le temps de calcul par point (index spatial STRtree).
Le panel mélange des points proches du rivage (le cas qui compte : 0 à 30 km) et des points intérieurs.
Rien n'est choisi ici : les chiffres servent à décider la tolérance.
"""
import argparse
import gzip
import json
import time
from pathlib import Path

import numpy as np
import shapely

TOLERANCES_M = [0, 2, 5, 10, 20, 50, 100]


def lire_rivage(chemin: Path):
    brut = chemin.read_bytes()
    out, k = [], 0
    while k < len(brut):
        n = int.from_bytes(brut[k:k + 4], "little")
        out.append(shapely.from_wkb(brut[k + 4:k + 4 + n]))
        k += 4 + n
    return np.array(out, dtype=object)


def panel(rivage, n_proches=4000, n_loin=1000, graine=33):
    """Points tirés à 0-30 km d'un point du rivage, plus des points plus lointains (30-120 km)."""
    rng = np.random.default_rng(graine)
    longueurs = shapely.length(rivage)
    choix = rng.choice(len(rivage), size=n_proches + n_loin, p=longueurs / longueurs.sum())
    pts = []
    for n, i in enumerate(choix):
        base = rivage[i].interpolate(rng.random(), normalized=True)
        rayon = rng.uniform(0, 30000) if n < n_proches else rng.uniform(30000, 120000)
        angle = rng.uniform(0, 2 * np.pi)
        pts.append(shapely.Point(base.x + rayon * np.cos(angle), base.y + rayon * np.sin(angle)))
    return np.array(pts, dtype=object)


def distances(points, geoms):
    arbre = shapely.STRtree(geoms)
    t = time.perf_counter()
    idx = arbre.query_nearest(points, all_matches=False)[1]
    d = shapely.distance(points, geoms[idx])
    return d, (time.perf_counter() - t) / len(points)


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rivage", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    rivage = lire_rivage(a.rivage)
    pts = panel(rivage)
    d0, t0 = distances(pts, rivage)
    proches = d0 <= 30000
    res = []
    for tol in TOLERANCES_M:
        g = rivage if tol == 0 else shapely.simplify(rivage, tol, preserve_topology=True)
        wkb = b"".join(shapely.to_wkb(g))
        d, tq = distances(pts, g)
        err = np.abs(d - d0)
        res.append({
            "tolerance_m": tol,
            "sommets": int(shapely.get_num_coordinates(g).sum()),
            "wkb_mo": round(len(wkb) / 1e6, 1),
            "wkb_gzip_mo": round(len(gzip.compress(wkb, 6)) / 1e6, 1),
            "erreur_max_m": round(float(err.max()), 1),
            "erreur_moyenne_m": round(float(err.mean()), 2),
            "erreur_p99_m": round(float(np.percentile(err, 99)), 1),
            "erreur_max_proches_m": round(float(err[proches].max()), 1),
            "temps_par_point_ms": round(tq * 1000, 3),
        })
        print(json.dumps(res[-1]))
    a.out.write_text(json.dumps({"panel": {"points": len(pts), "proches_0_30km": int(proches.sum())},
                                 "temps_reference_ms": round(t0 * 1000, 3), "niveaux": res}, indent=1))


if __name__ == "__main__":
    principal()
