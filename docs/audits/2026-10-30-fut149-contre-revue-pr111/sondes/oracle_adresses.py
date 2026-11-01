import sqlite3, json, sys, os, numpy, shapely
from shapely import wkb
from shapely.geometry import Point, shape
from pyproj import Transformer
gpkg, dossier, sortie = sys.argv[1:4]
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
def geom(b):
    env = {0:0,1:32,2:48,3:48,4:64}[(b[3]>>1)&7]; return wkb.loads(bytes(b[8+env:]))
w2l = Transformer.from_crs(4326, 2154, always_xy=True)
res = {}
fx = sorted(f for f in os.listdir(dossier) if f.endswith(".json"))
pts = {}
for f in fx:
    a = json.load(open(os.path.join(dossier, f)))
    pts[f[:-5]] = a
# zones à moins de 2 km des adresses seulement
X = [w2l.transform(a["ban"]["lon"], a["ban"]["lat"]) for a in pts.values()]
zones = []
for g, in con.execute(f"select geom from {t} where ZONAGE = 2"):
    zones.append(geom(g))
arbre = shapely.STRtree(zones)
for (c, a), (x, y) in zip(pts.items(), X):
    P = Point(x, y)
    idx = arbre.query(P.buffer(3000), predicate="intersects")
    U = shapely.unary_union([zones[i] for i in idx]) if len(idx) else shapely.Polygon()
    r = {"dedans": bool(U.contains(P)) if not U.is_empty else False, "dist": round(float(U.boundary.distance(P)), 2) if not U.is_empty else None}
    if a.get("parcelle"):
        g = shapely.transform(shape(a["parcelle"]["geometry"]), lambda c: numpy.column_stack(w2l.transform(c[:,0], c[:,1])))
        r["parcelleValide"] = bool(g.is_valid)
        r["pointDansParcelle"] = bool(g.contains(P)); r["pointBordParcelleM"] = round(float(g.boundary.distance(P)), 4)
        if not U.is_empty:
            r["part"] = round(float(g.intersection(U).area / g.area), 4); r["distParcelle"] = round(float(g.distance(U.boundary)) if r["part"] == 0 else 0.0, 2)
            r["distBordParcelleZone"] = round(float(g.distance(U)), 2)
    res[c] = r
json.dump(res, open(sortie, "w"), indent=0)
