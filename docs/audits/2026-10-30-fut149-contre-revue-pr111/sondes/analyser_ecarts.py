# Contre-revue FUT-149 : pour chaque désaccord lib / oracle (lignes JSON de `evaluer_r3.mts`), la nature du bord le
# plus proche dans la géométrie d'origine : un vide (trou de la réunion) et sa largeur moyenne (2 × aire / périmètre),
# ou un bord extérieur. Largeur < 1 mm : liseré de numérisation entre deux zones.
#   python -I analyser_ecarts.py <full.gpkg> <ecarts.jsonl>
import sqlite3, json, sys, collections
import shapely
from shapely import wkb
from shapely.geometry import Point
from pyproj import Transformer
gpkg, entree = sys.argv[1:3]
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
def geom(b):
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(b[3] >> 1) & 7]
    return wkb.loads(bytes(b[8 + env:]))
Z = [(geom(g), d.strip()) for g, d in con.execute(f"select geom, DEPT from {t} where ZONAGE = 2")]
G = [z[0] for z in Z]
arbre = shapely.STRtree(G)
w2l = Transformer.from_crs(4326, 2154, always_xy=True)
R = 500.0
classes = collections.Counter()
for ligne in open(entree):
    e = json.loads(ligne)
    x, y = w2l.transform(e["lon"], e["lat"])
    P = Point(x, y)
    cadre = shapely.box(x - R, y - R, x + R, y + R)
    idx = arbre.query(P.buffer(300), predicate="intersects")
    U = shapely.unary_union([shapely.intersection(G[i], cadre) for i in idx], grid_size=1e-6)
    proche, dmin = None, 1e9
    for p in (U.geoms if U.geom_type == "MultiPolygon" else [U]):
        for a in p.interiors:
            d = shapely.LinearRing(a).distance(P)
            if d < dmin: dmin, proche = d, ("vide", shapely.Polygon(a))
        d = shapely.difference(p.exterior, cadre.boundary.buffer(0.01)).distance(P)
        if d < dmin: dmin, proche = d, ("bord extérieur", None)
    if proche and proche[0] == "vide":
        h = proche[1]
        larg = 2 * h.area / h.length
        c = "< 1 mm" if larg < 0.001 else "1 mm – 1 cm" if larg < 0.01 else "1 – 10 cm" if larg < 0.1 else "10 cm – 1 m" if larg < 1 else "≥ 1 m"
        desc = f"vide de {larg * 1000:.3f} mm de large ({h.length:.1f} m de périmètre) à {dmin:.2f} m"
    else:
        c, desc = "bord extérieur", f"bord extérieur à {dmin:.2f} m"
    classes[(e["cat"], e["lib"], c)] += 1
    print(json.dumps({**e, "bordLePlusProche": desc}, ensure_ascii=False))
for k, v in sorted(classes.items()):
    print("BILAN", k, v)
