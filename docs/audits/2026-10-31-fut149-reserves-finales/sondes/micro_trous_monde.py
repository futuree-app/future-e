# FUT-149, 31/10/2026 · § 1 : micro-trous. Construit, avec le VRAI `construire.py` (seule la lecture du GeoPackage
# est remplacée), une zone de 6 km × 6 km en Lambert-93 percée de trous de 0,5 mm à 50 mm, espacés de 150 m (bien
# au-delà de la limite proche de 50 m : chaque trou est seul dans sa fenêtre de lecture). Position et orientation
# tirées au hasard (graine fixe) : l'arrondi au 1e-7 degré tombe différemment sur chacun.
#   python -I micro_trous_monde.py <construire.py> <sortie> [côté en m (6000)] [--ancien]
# `--ancien` rejoue l'encodage des limites d'avant le 31/10/2026 (une limite réduite à un point était jetée).
# Sortie : <sortie>/2026-03-01/{manifest.json,t/} et <sortie>/trous.json (centre lon/lat, largeur, forme).
import importlib.util, json, math, os, random, sys, contextlib, io
import shapely
from pyproj import Transformer

chemin, sortie = sys.argv[1], sys.argv[2]
cote = float(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else 6000.0
spec = importlib.util.spec_from_file_location("construire", chemin)
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
if "--ancien" in sys.argv:
    # Avant le 31/10/2026, `ligne_code` rendait None pour une limite réduite à un point, et la ligne était jetée :
    # on retire ces lignes à la sortie de `limites_cellule`, ce qui reproduit exactement l'ancien encodage.
    vraies = c.limites_cellule
    def anciennes(*a, **k):
        ls, longueur = vraies(*a, **k)
        return [l for l in ls if len(c.ligne_code(list(l.coords))) > 4 or c.ligne_code(list(l.coords))[2:] != [0, 0]], longueur
    c.limites_cellule = anciennes
vers_wgs = Transformer.from_crs(2154, 4326, always_xy=True)
rng = random.Random(149)
X0, Y0, L = 950_000.0, 6_250_000.0, cote  # Var
LARGEURS_MM = [0.5, 1, 2, 3, 5, 8, 12, 20, 50]
trous, anneaux = [], []
pas = 150.0
k = 0
for i in range(1, int(L / pas)):
    for j in range(1, int(L / pas)):
        w = LARGEURS_MM[k % len(LARGEURS_MM)] / 1000
        forme = ["carre", "triangle", "fente"][(k // len(LARGEURS_MM)) % 3]
        k += 1
        cx = X0 + i * pas + rng.uniform(-20, 20)
        cy = Y0 + j * pas + rng.uniform(-20, 20)
        a = rng.uniform(0, math.pi)
        if forme == "carre":
            pts = [(-w / 2, -w / 2), (w / 2, -w / 2), (w / 2, w / 2), (-w / 2, w / 2)]
        elif forme == "triangle":  # largeur = hauteur
            pts = [(-w, -w / 3), (w, -w / 3), (0, 2 * w / 3)]
        else:  # fente : largeur w, longueur 30 cm
            pts = [(-0.15, -w / 2), (0.15, -w / 2), (0.15, w / 2), (-0.15, w / 2)]
        rot = [(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)) for x, y in pts]
        anneau = rot + [rot[0]]
        anneaux.append(anneau)
        # Le point lu : le centre (strictement dans le trou, à w/2 au plus du bord ; w/3 pour le triangle).
        lon, lat = vers_wgs.transform(cx, cy)
        trous.append({"lon": lon, "lat": lat, "largeurMm": w * 1000, "forme": forme})
zone = shapely.Polygon([(X0, Y0), (X0 + L, Y0), (X0 + L, Y0 + L), (X0, Y0 + L)], [list(reversed(a)) for a in anneaux])
assert zone.is_valid, shapely.is_valid_reason(zone)
zs = [{"id": "Z", "geom": zone, "ambigu": False, "profil": ("83", "Zonage IGN", "", "2020", None, None, None)}]
c.lire_zones = lambda _g: (zs, {"table": "synthetique", "objets": 1, "zones": 1, "diffusion": {}})
c.sha256_fichier = lambda _p: "0" * 64
c.verifier_departements = lambda _z, _a: (["83"], {"absentsDeLaBase": [], "absentsDesArretes": []})
os.makedirs(sortie, exist_ok=True)
with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    c.construire(chemin, "2026-03-01", sortie, False, {"communes": {}, "texte": ""})
json.dump(trous, open(os.path.join(sortie, "trous.json"), "w"))
print(len(trous), "trous construits")
