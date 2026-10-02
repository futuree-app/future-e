#!/usr/bin/env python3
"""FUT-33, phase 2A : publier la vérité littorale dans le dépôt (data/mer/), à partir des sorties de build_mer.py.

  data/mer/mer-communes.json   par commune : [mer_centre_km, mer_territoire_km, loi_littoral, loi_effective,
                               loi_source_commune] ; arrondi à 10 m ;
  data/mer/rivage-5m.f32.gz    rivage marin simplifié à 5 m (D9), segments Float32 x1 y1 x2 y2 en Lambert 93 ;
  data/mer/provenance.json     sources, millésimes, méthode, attribution, compteurs de construction.

Ces fichiers sont l'ENTRÉE de l'index (scripts/lib/mer-index.mjs) ; ils ne changent aucun comportement.
"""
import argparse
import gzip
import json
from pathlib import Path

import numpy as np
import shapely

import adresse_proto as AP

TOLERANCE_ADRESSE_M = 5  # D9, décidé le 02/10/2026


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True, help="sorties de build_mer.py")
    ap.add_argument("--dest", type=Path, required=True, help="data/mer du dépôt")
    a = ap.parse_args()
    a.dest.mkdir(parents=True, exist_ok=True)
    com = json.loads((a.out / "mer-communes.json").read_text())
    r2 = lambda x: None if x is None else round(float(x), 2)
    table = {c["insee"]: [r2(c["centre_km"]), r2(c["territoire_km"]), c["loi"], c.get("loi_effective"), c.get("loi_source_commune")]
             for c in com}
    (a.dest / "mer-communes.json").write_text(json.dumps(
        {"colonnes": ["mer_centre_km", "mer_territoire_km", "loi_littoral", "loi_effective", "loi_source_commune"], "communes": table},
        ensure_ascii=False, separators=(",", ":")))
    rivage = AP.lire_rivage(a.out / "rivage-marin.wkb")
    g = shapely.simplify(rivage, TOLERANCE_ADRESSE_M, preserve_topology=True)
    segs = []
    for ligne in g:
        for part in shapely.get_parts(ligne):
            cs = shapely.get_coordinates(part)
            if len(cs) >= 2:
                segs.append(np.hstack([cs[:-1], cs[1:]]))
    arr = np.vstack(segs).astype("<f4")
    (a.dest / "rivage-5m.f32.gz").write_bytes(gzip.compress(arr.tobytes(), 9, mtime=0))
    meta = json.loads((a.out / "build-meta.json").read_text())
    provenance = {
        "version": "mer-v2",
        "definition": "Distance au rivage marin : Limite terre-mer Shom-IGN coupée aux limites transversales de la mer "
                      "(règles A à E, complément Seine), lagunes et bassins compris (D2). Centre = point de référence de "
                      "l'index ; territoire = contour communal (0 si contact).",
        "sources": meta["sources"],
        "loi_littoral": {"typologie": "DGALN-SIDAUH, COG 2022 (Mer / Estuaire / Lac)",
                         "controle": "Observatoire des territoires, COG 2025 (classée / non classée) : liste identique",
                         "plm": "classement communal hérité par les arrondissements (loi_source_commune)"},
        "attribution": "Limite terre-mer © Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM",
        "limites": "Donnée non destinée à la navigation. Une distance au rivage marin n'est ni une distance à une plage, ni à l'océan.",
        "rivage_adresse": {"fichier": "rivage-5m.f32.gz", "tolerance_m": TOLERANCE_ADRESSE_M, "segments": int(len(arr)),
                           "format": "Float32 little-endian, x1 y1 x2 y2, Lambert 93 (EPSG:2154), mètres"},
        "construction": {"compteurs": {k: v for k, v in meta["compteurs"].items() if k != "complements"},
                         "complements": meta["compteurs"].get("complements")},
    }
    (a.dest / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=1, default=str))
    print(len(table), "communes ;", len(arr), "segments ;", round((a.dest / "rivage-5m.f32.gz").stat().st_size / 1e6, 2), "Mo")


if __name__ == "__main__":
    principal()
