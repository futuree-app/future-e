#!/usr/bin/env python3
"""FUT-33 (2B.2 C) : distances de RÉFÉRENCE de points d'adresse au rivage marin COMPLET (non simplifié).

Fige scripts/mer/fixtures/adresses-test-2b2c.json, que src/lib/fut33-dossier-2b2c.test.ts compare au calcul de
production (rivage simplifié à 5 m, data/mer/rivage-5m.f32.gz).
Usage : python reference_adresses.py --rivage ~/futuree-fut33/out/rivage-marin.wkb --out fixtures/adresses-test-2b2c.json
"""
import argparse
import json
from pathlib import Path

import shapely
from pyproj import Transformer

import adresse_proto as AP

POINTS = [
    ("Châtelaillon-Plage, front de mer", "17094", 46.0745, -1.0915),
    ("Châtelaillon-Plage, est de la commune", "17094", 46.0790, -1.0640),
    ("Lannion, centre", "22113", 48.7326, -3.4566),
    ("Lannion, est de la commune", "22113", 48.7480, -3.4180),
    ("Arles, centre", "13004", 43.6766, 4.6278),
    ("Arles, Salin-de-Giraud", "13004", 43.4110, 4.7320),
    ("Narbonne, centre", "11262", 43.1840, 3.0042),
    ("Vannes, centre", "56260", 47.6582, -2.7608),
    ("Rochefort, centre", "17299", 45.9420, -0.9640),
    ("Marseille, Vieux-Port", "13201", 43.2951, 5.3740),
    ("Caen, centre", "14118", 49.1829, -0.3707),
    ("Bordeaux, centre", "33063", 44.8378, -0.5792),
    ("Rouen, centre", "76540", 49.4431, 1.0993),
    ("Annecy, centre", "74010", 45.8992, 6.1294),
]


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rivage", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    rivage = AP.lire_rivage(a.rivage)
    arbre = shapely.STRtree(rivage)
    vers93 = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)
    sortie = []
    for nom, insee, lat, lon in POINTS:
        x, y = vers93.transform(lon, lat)
        p = shapely.Point(x, y)
        i = arbre.query_nearest(p, all_matches=False)
        d = float(shapely.distance(p, rivage[int(i[0])]))
        sortie.append({"nom": nom, "insee": insee, "lat": lat, "lon": lon, "km_reference": round(d / 1000, 4)})
        print(f"{nom:40} {d / 1000:8.3f} km")
    a.out.write_text(json.dumps({"source": "rivage marin complet (non simplifié), LimTM Shom-IGN 2021 coupée aux LTM",
                                 "points": sortie}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    principal()
