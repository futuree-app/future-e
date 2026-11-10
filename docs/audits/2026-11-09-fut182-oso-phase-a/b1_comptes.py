"""FUT-182 · B1 · comptes de pixels OSO 2023 par commune et par arrondissement PLM. Hors ligne, hors application.

Lecture seule du raster et des contours ; n'écrit que dans le dossier de sortie passé en argument (jamais dans le dépôt,
jamais dans data/, jamais à distance). Dépendances : numpy, rasterio, shapely.

Usage :
    python -I b1_comptes.py OCS_2023.tif CACHE_DIR ARRONDISSEMENTS_JSON SORTIE_DIR [--processus 10]

  OCS_2023.tif           classification OSO 2023 (Recherche Data Gouv, archive vérifiée par MD5, cf. rapport § 18).
  CACHE_DIR              data/cache-nature/ du dépôt principal : contours/<dep>.json (geo.api.gouv.fr, 02/06/2026),
                         les MÊMES contours que ceux qui ont produit l'index ; communes-nature.json n'est pas lu ici.
  ARRONDISSEMENTS_JSON   geo.api.gouv.fr, type=arrondissement-municipal, champs code, nom, codeParent, contour (45).
  SORTIE_DIR             reçoit comptes-pixels.csv.gz et comptes-pixels.meta.json.

RÈGLE D'APPARTENANCE, IDENTIQUE À scripts/populate-nature.py : un pixel appartient à un contour si son CENTRE y tombe
(`rasterio.mask.mask`, all_touched=False), après reprojection du contour EPSG:4326 → CRS du raster par GDAL
(`transform_geom`). Chaque contour est masqué seul : un pixel sur une frontière commune à deux contours qui se
chevauchent d'un trait est compté pour chacun, exactement comme dans le précalcul d'origine.

Ce qui est compté pour chaque contour : TOUTES les valeurs du raster dont le centre tombe dans le contour (0 compris,
c'est-à-dire « non classé » ; 1-23 ; 24 serres ; 255 ; toute autre valeur), ainsi que l'aire du contour reprojeté.
La part du contour hors de l'emprise du raster (mer au-delà de l'emprise, étranger) n'a pas de pixel : elle se lit
comme aire − pixels × 100 m², à l'effet de bord près.
"""
import csv
import gzip
import hashlib
import json
import os
import platform
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
import rasterio
import shapely
from rasterio.mask import mask
from rasterio.warp import transform_geom

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 4:
    sys.exit(__doc__)
TIF, CACHE_DIR, ARR, SORTIE = Path(args[0]), Path(args[1]), Path(args[2]), Path(args[3])
NPROC = int(sys.argv[sys.argv.index("--processus") + 1]) if "--processus" in sys.argv else 10
VALEURS = list(range(0, 25)) + [255]

_ds = None


def _init(tif):
    global _ds
    _ds = rasterio.open(tif)


def compter(item):
    code, typ, parent, nom, g = item
    g2 = transform_geom("EPSG:4326", _ds.crs, g)
    aire = float(shapely.area(shapely.geometry.shape(g2)))
    try:
        inside, _ = mask(_ds, [g2], crop=True, filled=False)
        cnt = np.bincount(inside[0].compressed(), minlength=256)
    except ValueError:  # contour entièrement hors de l'emprise du raster
        cnt = np.zeros(256, dtype=np.int64)
    autres = int(cnt.sum() - sum(int(cnt[v]) for v in VALEURS))
    return [code, typ, parent, nom, round(aire, 1), int(cnt.sum())] + [int(cnt[v]) for v in VALEURS] + [autres]


def sha256(path, bloc=1 << 22):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(bloc), b""):
            h.update(b)
    return h.hexdigest()


def main():
    t0 = time.time()
    SORTIE.mkdir(parents=True, exist_ok=True)
    items, h_contours = [], hashlib.sha256()
    fichiers = sorted((CACHE_DIR / "contours").glob("*.json"))
    for f in fichiers:
        h_contours.update(f.name.encode() + b"\0" + f.read_bytes())
        for c in json.load(open(f, encoding="utf8")):
            if c.get("contour"):
                items.append((c["code"], "commune", "", c.get("nom", ""), c["contour"]))
    sans_contour = sum(1 for f in fichiers for c in json.load(open(f, encoding="utf8")) if not c.get("contour"))
    arr = json.load(open(ARR, encoding="utf8"))
    for a in arr:
        items.append((a["code"], "arrondissement", a.get("codeParent", ""), a.get("nom", ""), a["contour"]))
    print(f"contours : {len(items)} ({len(arr)} arrondissements, {sans_contour} communes sans contour)", flush=True)

    lignes = []
    with Pool(NPROC, initializer=_init, initargs=(str(TIF),)) as p:
        for n, l in enumerate(p.imap_unordered(compter, items, chunksize=40)):
            lignes.append(l)
            if n % 2000 == 0:
                print(f"  {n}/{len(items)} ({time.time() - t0:.0f}s)", flush=True)
    lignes.sort(key=lambda l: (l[1] != "commune", l[0]))
    entete = ["code", "type", "parent", "nom", "aire_contour_m2", "px_contour"] + [f"v{v}" for v in VALEURS] + ["v_autres"]
    out = SORTIE / "comptes-pixels.csv.gz"
    with gzip.open(out, "wt", encoding="utf8", newline="") as f:
        w = csv.writer(f)
        w.writerow(entete)
        w.writerows(lignes)
    duree = time.time() - t0
    print(f"écrit : {out} ({len(lignes)} lignes, {duree:.0f}s)", flush=True)

    ds = rasterio.open(TIF)
    meta = {
        "objet": "FUT-182 B1 : comptes de pixels OSO 2023 par contour (communes geo.api.gouv.fr du cache de l'index, "
                 "et 45 arrondissements municipaux PLM). Hors application.",
        "regle_appartenance": "centre du pixel dans le contour (rasterio.mask, all_touched=False), comme populate-nature.py ; "
                              "chaque contour masqué seul",
        "colonnes": entete,
        "lignes": len(lignes),
        "communes": sum(1 for l in lignes if l[1] == "commune"),
        "arrondissements": sum(1 for l in lignes if l[1] == "arrondissement"),
        "communes_sans_contour_dans_le_cache": sans_contour,
        "sources": {
            "raster": {"fichier": TIF.name, "taille_octets": TIF.stat().st_size, "sha256": sha256(TIF),
                       "crs": str(ds.crs), "pas_m": list(ds.res), "largeur": ds.width, "hauteur": ds.height,
                       "nodata_declare": ds.nodata},
            "contours_communes": {"dossier": "data/cache-nature/contours (geo.api.gouv.fr, 02/06/2026)", "fichiers": len(fichiers),
                                  "sha256_concatene_nom_contenu": h_contours.hexdigest()},
            "arrondissements": {"fichier": ARR.name, "sha256": sha256(ARR)},
        },
        "sortie": {"fichier": out.name, "sha256": sha256(out)},
        "script": {"fichier": Path(__file__).name, "sha256": sha256(Path(__file__))},
        "environnement": {"python": platform.python_version(), "numpy": np.__version__, "rasterio": rasterio.__version__,
                          "gdal": rasterio.__gdal_version__, "shapely": shapely.__version__, "processus": NPROC},
        "duree_s": round(duree),
        "date": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    (SORTIE / "comptes-pixels.meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    print(json.dumps(meta["sources"], ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
