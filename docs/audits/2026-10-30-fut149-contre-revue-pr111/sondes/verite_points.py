# Contre-revue FUT-149 : la vérité (géométrie IGN d'origine, Lambert-93, Shapely) pour une liste de points WGS84.
#   python -I verite_points.py <full.gpkg> <points.json> <sortie.json>
# Même vérité que `oracle_r3.py` : réunion des zones découpées à 1 km autour du point (précision fixe de 1 µm),
# distance à son bord. Les autres champs du point sont gardés ; `dedans` et `dist` sont remplacés.
import sqlite3, json, sys
import shapely
from shapely import wkb
from shapely.geometry import Point
from pyproj import Transformer
gpkg, entree, sortie = sys.argv[1:4]
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
def geom(b):
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(b[3] >> 1) & 7]
    return wkb.loads(bytes(b[8 + env:]))
G = [geom(g) for (g,) in con.execute(f"select geom from {t} where ZONAGE = 2")]
arbre = shapely.STRtree(G)
w2l = Transformer.from_crs(4326, 2154, always_xy=True)
R = 500.0
out = []
for p in json.load(open(entree)):
    x, y = w2l.transform(p["lon"], p["lat"])
    P = Point(x, y)
    idx = arbre.query(P.buffer(300), predicate="intersects")
    if len(idx) == 0:
        out.append({**p, "dedans": False, "dist": 1e9}); continue
    # Précision de calcul fixe (1 µm) : en virgule flottante, la réunion peut rester non fusionnée (cf. construire.py).
    U = shapely.unary_union([shapely.intersection(G[i], shapely.box(x - R, y - R, x + R, y + R)) for i in idx], grid_size=1e-6)
    bord = shapely.difference(U.boundary, shapely.box(x - R, y - R, x + R, y + R).boundary.buffer(0.01))
    out.append({**p, "dedans": bool(U.covers(P)), "dist": round(float(bord.distance(P)), 3) if not bord.is_empty else 1e9})
json.dump(out, open(sortie, "w"))
