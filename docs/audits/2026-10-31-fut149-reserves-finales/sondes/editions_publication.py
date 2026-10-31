# FUT-149, 31/10/2026 · § 2 : construit, avec le VRAI `construire.py` (seule la lecture du GeoPackage est
# remplacée), les éditions synthétiques que `publication2.mjs` publie et lit. 6 × 3 cellules (lon 5,0-5,6 ;
# lat 43,4-43,7), une zone par cellule, plus une zone sur le coin (5,2 ; 43,5). D'une édition à l'autre, CHAQUE
# tuile change : la zone de chaque cellule s'élargit ou se rétrécit, et la zone du coin n'existe que dans E1 et E3.
#   python -I editions_publication.py <construire.py> <sortie>
# Sortie : <sortie>/<édition>/{manifest.json, t/*.json.gz} pour 2026-03-01, 2026-03-01.2, 2026-03-01.3.
import importlib.util, os, sys, contextlib, io
import shapely
from pyproj import Transformer

chemin, sortie = sys.argv[1], sys.argv[2]
spec = importlib.util.spec_from_file_location("construire", chemin)
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
vers_l93 = Transformer.from_crs(4326, 2154, always_xy=True)


def rect(o, x0, y0, x1, y1):
    # Côtés densifiés avant projection (la projection courbe les droites).
    n = 20
    pts = [(x0 + (x1 - x0) * i / n, y0) for i in range(n)] + [(x1, y0 + (y1 - y0) * i / n) for i in range(n)] \
        + [(x1 - (x1 - x0) * i / n, y1) for i in range(n)] + [(x0, y1 - (y1 - y0) * i / n) for i in range(n)]
    return {"id": o, "geom": shapely.Polygon([vers_l93.transform(x, y) for x, y in pts]), "ambigu": False,
            "profil": ("13", "Zonage local", "", "2008", None, None, None)}


# Marge de la zone de chaque cellule (degrés) et demi-côté de la zone du coin (None : absente), par édition.
EDITIONS = {"2026-03-01": (0.02, 0.015), "2026-03-01.2": (0.03, None), "2026-03-01.3": (0.025, 0.012)}
for edition, (marge, coin) in EDITIONS.items():
    zs = []
    for ix in range(50, 56):
        for iy in range(434, 437):
            x, y = ix / 10, iy / 10
            zs.append(rect(f"C{ix}_{iy}", x + marge, y + marge, x + 0.1 - marge, y + 0.1 - marge))
    if coin:
        zs.append(rect("COIN", 5.2 - coin, 43.5 - coin, 5.2 + coin, 43.5 + coin))
    c.lire_zones = lambda _g, zs=zs: (zs, {"table": "synthetique", "objets": len(zs), "zones": len(zs), "diffusion": {}})
    c.sha256_fichier = lambda _p: "0" * 64
    c.verifier_departements = lambda _z, _a: (["13"], {"absentsDeLaBase": [], "absentsDesArretes": []})
    base, _, rev = edition.partition(".")
    os.makedirs(sortie, exist_ok=True)
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        c.construire(chemin, edition, sortie, False, {"communes": {}, "texte": ""})
    print(edition, len(os.listdir(os.path.join(sortie, edition, "t"))), "tuiles")
