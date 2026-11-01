# Contre-revue FUT-149 : construit des mondes SYNTHÉTIQUES avec le VRAI `construire.py` (seule la lecture du
# GeoPackage est remplacée : les zones viennent d'un JSON en longitude, latitude, projetées en Lambert-93).
#   python -I construire_monde.py <construire.py> <mondes.json> <sortie>
# mondes.json : { "<nom>": [ { "o": "A", "p": 0, "anneaux": [[[lon, lat], …], …], "ambigu": false }, … ], … }
# Sortie : <sortie>/<nom>/2026-03-01/{manifest.json, t/*.json.gz}
import importlib.util, json, os, sys, contextlib, io
import shapely
from pyproj import Transformer

chemin, mondes, sortie = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3]
spec = importlib.util.spec_from_file_location("construire", chemin)
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
vers_l93 = Transformer.from_crs(4326, 2154, always_xy=True)
PROFILS = [("83", "Zonage IGN", "", "2020", None, None, None), ("13", "Zonage local", "", "2008", None, None, None)]

def noeuds(zones):
    """
    Insère dans chaque arête les sommets des AUTRES zones posés exactement dessus (jonctions en T), avant projection.
    Sans cela, une jonction en T décrite en degrés n'est plus exacte en Lambert-93 (la projection courbe), et la
    réunion exacte laisse un liseré qui n'existe pas dans la géométrie voulue. Les données IGN, elles, sont
    nativement en Lambert-93 : ce qui y reste de jonctions non dissoutes est mesuré par `oracle_r3.py`.
    """
    sommets = [(x, y) for z in zones for a in z["anneaux"] for x, y in a]
    for z in zones:
        for a in z["anneaux"]:
            out = []
            for (ax, ay), (bx, by) in zip(a, a[1:]):
                out.append([ax, ay])
                sur = [(x, y) for x, y in set(sommets) if (x, y) not in ((ax, ay), (bx, by))
                       and (bx - ax) * (y - ay) == (by - ay) * (x - ax) and min(ax, bx) <= x <= max(ax, bx) and min(ay, by) <= y <= max(ay, by)]
                out += [list(p) for p in sorted(sur, key=lambda p: (p[0] - ax) ** 2 + (p[1] - ay) ** 2)]
            out.append(a[-1])
            a[:] = out


for nom, zones in mondes.items():
    noeuds(zones)
    zs = []
    for z in zones:
        anneaux = [[vers_l93.transform(x, y) for x, y in a] for a in z["anneaux"]]
        g = shapely.Polygon(anneaux[0], anneaux[1:])
        assert g.is_valid, (nom, z["o"], shapely.is_valid_reason(g))
        zs.append({"id": z["o"], "geom": g, "ambigu": z.get("ambigu", False), "profil": PROFILS[z["p"]]})
    c.lire_zones = lambda _g, zs=zs: (zs, {"table": "synthetique", "objets": len(zs), "zones": len(zs), "diffusion": {}})
    c.sha256_fichier = lambda _p: "0" * 64
    c.verifier_departements = lambda _z, _a: (["13", "83"], {"absentsDeLaBase": [], "absentsDesArretes": []})
    d = os.path.join(sortie, nom)
    os.makedirs(d, exist_ok=True)
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        c.construire(sys.argv[2], "2026-03-01", d, False, {"communes": {}, "texte": ""})
    print(nom, len(json.load(open(os.path.join(d, "2026-03-01", "manifest.json")))["tuiles"]), "cellules")
