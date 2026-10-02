#!/usr/bin/env python3
"""FUT-33, phase 1.5 : communes sans classement loi Littoral dont le territoire touche le rivage marin.

Pour chacune : longueur de contact avec le rivage, nature des tronçons touchés (codage `limarc` de la LimTM,
fermeture LTM ajoutée), distance du centre, et classement des communes voisines. Sert à dire si la géométrie
est fausse ou si la loi répond à une autre question. Aucune correction n'est appliquée.
"""
import argparse
import collections
import gzip
import json
import pickle
from pathlib import Path

import numpy as np
import pyogrio
import shapely
from pyproj import Transformer


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--etat", type=Path, required=True)
    ap.add_argument("--contours", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True, help="dossier des sorties (mer-communes.json)")
    a = ap.parse_args()
    e = pickle.loads(a.etat.read_bytes())
    morceaux, codes, retire, ltm = e["morceaux"], e["codes"], e["retire"], e["ltm"]
    garde = [i for i in range(len(morceaux)) if not retire[i]]
    geoms = [morceaux[i] for i in garde] + [f["geom"] for f in ltm]
    nature = [codes[i] or "vide" for i in garde] + ["fermeture LTM"] * len(ltm)
    arbre = shapely.STRtree(geoms)
    com = json.loads((a.out / "mer-communes.json").read_text())
    cibles = [c for c in com if not c["loi"] and c["territoire_km"] == 0]
    vers93 = Transformer.from_crs(4326, 2154, always_xy=True)
    src = f"/vsigzip/{a.contours}"
    _, _, gc, fc = pyogrio.raw.read(src, columns=["code"])
    contours = {code: g for code, g in zip(fc[0], shapely.from_wkb(gc))}
    proj = lambda g: shapely.transform(g, lambda xy: np.column_stack(vers93.transform(xy[:, 0], xy[:, 1])))
    loi = {c["insee"]: c["loi"] for c in com}
    polys = {c["insee"]: proj(contours[c["insee"]]) for c in com if c["insee"] in contours}
    arbre_com = shapely.STRtree(list(polys.values()))
    codes_com = list(polys.keys())
    res = []
    for c in cibles:
        poly = polys.get(c["insee"])
        if poly is None:
            continue
        zone = shapely.buffer(poly, 5)
        idx = arbre.query(zone, predicate="intersects")
        contact = collections.Counter()
        for i in idx:
            contact[nature[i]] += shapely.length(shapely.intersection(geoms[i], zone))
        voisins = [codes_com[j] for j in arbre_com.query(shapely.buffer(poly, 10), predicate="intersects") if codes_com[j] != c["insee"]]
        res.append({"insee": c["insee"], "nom": c["nom"], "dept": c["dept"], "centre_km": c["centre_km"],
                    "contact_m": round(sum(contact.values())), "contact_par_nature_m": {k: round(v) for k, v in contact.most_common()},
                    "voisins_classes": sorted({f"{v}:{'/'.join(loi.get(v) or [])}" for v in voisins if loi.get(v)})})
        print(json.dumps(res[-1], ensure_ascii=False))
    (a.out / "divergences.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    principal()
