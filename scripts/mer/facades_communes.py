#!/usr/bin/env python3
"""FUT-33 (2B.2 D) : la FAÇADE MARITIME OFFICIELLE de chaque commune littorale (classée « Mer »), valeur source.

Source : « Planification maritime », DGAMPA-Shom 2026 (couche MSP_Spatial_Plan, une emprise en mer par façade :
MEMN, NAMO, SA, MED). Pour chaque commune dont le classement effectif (loi Littoral, héritage PLM) contient « Mer » :
point de référence → point de rivage marin le plus proche → emprise de façade la plus proche de ce point.
Les autres communes reçoivent null. AUCUNE traduction en « Atlantique », « Manche » : la valeur stockée est le
code source ; la traduction éditoriale est une convention versionnée côté produit (src/lib/mer-recherche.ts).

Ajoute la colonne `mer_facade` à data/mer/mer-communes.json et le bloc `facade` à data/mer/provenance.json.
Usage : python facades_communes.py --planif <PLANIFICATION_MARITIME_PACK> --rivage <rivage-marin.wkb> --dest ../../data/mer
"""
import argparse
import collections
import gzip
import json
from pathlib import Path

import numpy as np
import pyogrio
import shapely
import shapely.ops
from pyproj import Transformer

import adresse_proto as AP

CODES = ["MEMN", "NAMO", "SA", "MED"]


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--planif", type=Path, required=True)
    ap.add_argument("--rivage", type=Path, required=True)
    ap.add_argument("--dest", type=Path, required=True)
    ap.add_argument("--index", type=Path, default=Path(__file__).resolve().parents[2] / "data" / "comparateur-index.json.gz")
    a = ap.parse_args()
    vers93 = Transformer.from_crs(4326, 2154, always_xy=True)
    emprises = {}
    for code in CODES:
        _, _, g, _ = pyogrio.raw.read(a.planif / f"MD_EMODNet_{code}.gpkg", layer="MSP_Spatial_Plan")
        geom = shapely.union_all(shapely.from_wkb(g))
        emprises[code] = shapely.transform(geom, lambda xy: np.column_stack(vers93.transform(xy[:, 0], xy[:, 1])))
    rivage = AP.lire_rivage(a.rivage)
    arbre = shapely.STRtree(rivage)
    index = {c["insee"]: c for c in json.loads(gzip.open(a.index).read())["communes"]}
    table = json.loads((a.dest / "mer-communes.json").read_text())
    colonnes = table["colonnes"]
    if colonnes[-1] == "mer_facade":
        colonnes = colonnes[:-1]
        table["communes"] = {k: v[:-1] for k, v in table["communes"].items()}
    i_loi = colonnes.index("loi_effective")
    compte, ambigus = collections.Counter(), []
    for insee, v in table["communes"].items():
        facade = None
        if "Mer" in (v[i_loi] or []):
            e = index[insee]
            p = shapely.Point(*vers93.transform(e["lon"], e["lat"]))
            r = rivage[int(arbre.query_nearest(p, all_matches=False)[0])]
            q = shapely.ops.nearest_points(r, p)[0]
            d = {code: shapely.distance(q, g) for code, g in emprises.items()}
            facade = min(d, key=d.get)
            marge = sorted(d.values())[1] - d[facade]
            if marge < 2000:
                ambigus.append({"insee": insee, "nom": e["nom"], "facade": facade, "marge_m": round(marge)})
        compte[facade] += 1
        v.append(facade)
    table["colonnes"] = colonnes + ["mer_facade"]
    (a.dest / "mer-communes.json").write_text(json.dumps(table, ensure_ascii=False, separators=(",", ":")))
    prov = json.loads((a.dest / "provenance.json").read_text())
    prov["facade"] = {
        "source": "Planification maritime, DGAMPA-Shom, 2026 (couche MSP_Spatial_Plan)",
        "citation": "DGAMPA-Shom, 2026. Planification maritime. https://dx.doi.org/10.17183/MSP",
        "licence": "Licence Ouverte 2.0",
        "valeurs": {"MEMN": "Manche Est-mer du Nord", "NAMO": "Nord Atlantique-Manche Ouest", "SA": "Sud-Atlantique", "MED": "Méditerranée"},
        "methode": "communes classées « Mer » seulement : point de référence → point de rivage marin le plus proche → emprise de façade la plus proche",
        "ambigus_marge_moins_2km": ambigus,
    }
    (a.dest / "provenance.json").write_text(json.dumps(prov, ensure_ascii=False, indent=1, default=str))
    print(dict(compte))
    print("ambigus :", ambigus)


if __name__ == "__main__":
    principal()
