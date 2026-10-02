#!/usr/bin/env python3
"""FUT-33, phase 1 : scénario B des lagunes (mer ouverte, lagunes et bassins distingués).

La LimTM ne qualifie pas les lagunes : leurs rives sont du rivage comme les autres (scénario A). Le scénario B
les distingue GÉOMÉTRIQUEMENT, dans une fenêtre autour de chaque site :
  - eau = fenêtre − polygones « terre » de la LimTM ;
  - ouverture morphologique de rayon r (érosion puis dilatation) : un plan d'eau relié au large par un passage
    plus étroit que 2r s'en détache ;
  - « mer ouverte » = la composante d'eau ouverte qui touche le bord de la fenêtre côté large (la plus grande).
Distance B = distance à cette mer ouverte. Rien n'est décidé ici : on mesure, pour plusieurs rayons r.

Usage : python lagunes_b.py --limtm <dossier> --index <comparateur-index.json.gz> --contours <communes-5m...>
"""
import argparse
import gzip
import json
from pathlib import Path

import numpy as np
import pyogrio
import shapely
from pyproj import Transformer

SITES = {
    "Arcachon": {"lon": -1.15, "lat": 44.68, "communes": ["33009", "33529", "33236", "33063"]},
    "Golfe du Morbihan": {"lon": -2.85, "lat": 47.60, "communes": ["56260", "56240", "56003"]},
    "Thau": {"lon": 3.62, "lat": 43.42, "communes": ["34301", "34157", "34023"]},
    "Étangs palavasiens": {"lon": 3.90, "lat": 43.53, "communes": ["34172", "34154", "34192"]},
    "Mauguio / La Grande-Motte": {"lon": 4.05, "lat": 43.57, "communes": ["34154", "34344"]},
}
RAYONS_M = [250, 500, 1000]
DEMI_FENETRE_M = 20000


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limtm", type=Path, required=True)
    ap.add_argument("--index", type=Path, required=True)
    ap.add_argument("--contours", type=Path, required=True)
    ap.add_argument("--rivage", type=Path, required=True, help="rivage-marin.wkb produit par build_mer.py (scénario A)")
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    vers93 = Transformer.from_crs(4326, 2154, always_xy=True)
    poly_path = next(a.limtm.rglob("*_polygones.shp"))
    _, _, gp, _ = pyogrio.raw.read(poly_path)
    terres = shapely.from_wkb(gp)
    arbre_terre = shapely.STRtree(terres)
    index = {c["insee"]: c for c in json.loads(gzip.open(a.index).read())["communes"]}
    src = f"/vsigzip/{a.contours}" if str(a.contours).endswith(".gz") else str(a.contours)
    _, _, gc, fc = pyogrio.raw.read(src, columns=["code"])
    contours = {}
    for code, g in zip(fc[0], shapely.from_wkb(gc)):
        contours[code] = g
    brut = a.rivage.read_bytes()
    rivage, k = [], 0
    while k < len(brut):
        n = int.from_bytes(brut[k:k + 4], "little")
        rivage.append(shapely.from_wkb(brut[k + 4:k + 4 + n]))
        k += 4 + n
    arbre_rivage = shapely.STRtree(rivage)

    def proj(g):
        return shapely.transform(g, lambda xy: np.column_stack(vers93.transform(xy[:, 0], xy[:, 1])))

    sortie = []
    for site, s in SITES.items():
        cx, cy = vers93.transform(s["lon"], s["lat"])
        fen = shapely.box(cx - DEMI_FENETRE_M, cy - DEMI_FENETRE_M, cx + DEMI_FENETRE_M, cy + DEMI_FENETRE_M)
        terre = shapely.union_all(terres[arbre_terre.query(fen, predicate="intersects")])
        eau = shapely.difference(fen, terre)
        for code in s["communes"]:
            c = index.get(code)
            if c is None:
                continue
            centre = shapely.Point(*vers93.transform(c["lon"], c["lat"]))
            poly = proj(contours[code]) if code in contours else None
            i = int(arbre_rivage.query_nearest(centre)[0])
            ligne = {"site": site, "insee": code, "nom": c["nom"],
                     "A_centre_km": round(shapely.distance(centre, rivage[i]) / 1000, 2)}
            if poly is not None:
                j = int(arbre_rivage.query_nearest(poly)[0])
                ligne["A_territoire_km"] = round(shapely.distance(poly, rivage[j]) / 1000, 2)
            for r in RAYONS_M:
                ouvert = shapely.buffer(shapely.buffer(eau, -r), r)
                parts = list(shapely.get_parts(ouvert))
                if not parts:
                    continue
                mer = max(parts, key=lambda p: p.area)   # la mer ouverte : la plus grande masse d'eau
                ligne[f"B{r}_centre_km"] = round(shapely.distance(centre, mer) / 1000, 2)
                if poly is not None:
                    ligne[f"B{r}_territoire_km"] = round(shapely.distance(poly, mer) / 1000, 2)
            sortie.append(ligne)
            print(json.dumps(ligne, ensure_ascii=False))
    a.out.write_text(json.dumps(sortie, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    principal()
