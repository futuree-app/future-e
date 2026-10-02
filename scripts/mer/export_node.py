#!/usr/bin/env python3
"""FUT-33, phase 1.5 : prépare le prototype Node (scripts/mer/adresse-node.mjs).

Écrit, pour chaque tolérance (5, 10, 20 m), le rivage marin simplifié sous forme de segments binaires
(Float32, x1 y1 x2 y2 en Lambert 93, mètres), et un panel de points (lon/lat WGS84) avec leur distance EXACTE
au rivage source, pour mesurer l'erreur du prototype (projection comprise).
"""
import argparse
import json
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer

import adresse_proto as AP


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rivage", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    rivage = AP.lire_rivage(a.rivage)
    for tol in (5, 10, 20):
        g = shapely.simplify(rivage, tol, preserve_topology=True)
        segs = []
        for ligne in g:
            for part in shapely.get_parts(ligne):
                cs = shapely.get_coordinates(part)
                if len(cs) >= 2:
                    segs.append(np.hstack([cs[:-1], cs[1:]]))
        arr = np.vstack(segs).astype("<f4")
        (a.out / f"rivage-{tol}m.f32").write_bytes(arr.tobytes())
        print(tol, "m :", len(arr), "segments")
    pts = AP.panel(rivage, n_proches=4000, n_loin=1000, graine=15)
    d, _ = AP.distances(pts, rivage)
    vers84 = Transformer.from_crs(2154, 4326, always_xy=True)
    xy = shapely.get_coordinates(pts)
    lon, lat = vers84.transform(xy[:, 0], xy[:, 1])
    (a.out / "panel.json").write_text(json.dumps({"points": [[round(float(x), 7), round(float(y), 7), round(float(m), 2)] for x, y, m in zip(lon, lat, d)]}))


if __name__ == "__main__":
    principal()
