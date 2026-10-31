# Contre-revue FUT-149 : l'effet d'une FERMETURE des vides étroits (dilatation puis érosion, angles vifs) sur la
# vérité, point par point (échantillons de `oracle_r3.py`). Géométrie IGN d'origine, Lambert-93.
#   python -I fermeture.py <full.gpkg> <points_r3.json> <sortie.json>
# Pour chaque point et chaque largeur f : la classe vérité (en_zone, en_limite·dedans, en_limite·dehors, dehors)
# calculée sur la réunion refermée de f.
import sqlite3, json, sys, collections
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
F = [0.0, 0.001, 0.01, 0.1, 1.0]
def classe(U, P, cadre):
    bord = shapely.difference(U.boundary, cadre.boundary.buffer(0.01))
    d = float(bord.distance(P)) if not bord.is_empty else 1e9
    dedans = U.covers(P)
    return ("en_limite·dedans" if dedans else "en_limite·dehors") if d <= 50 else ("en_zone" if dedans else "dehors")
pts = json.load(open(entree))
res = []
bilan = collections.defaultdict(collections.Counter)
for p in pts:
    if p.get("amb"):
        continue
    x, y = w2l.transform(p["lon"], p["lat"])
    P = Point(x, y)
    cadre = shapely.box(x - R, y - R, x + R, y + R)
    idx = arbre.query(P.buffer(300), predicate="intersects")
    U0 = shapely.unary_union([shapely.intersection(G[i], cadre) for i in idx], grid_size=1e-6) if len(idx) else shapely.Polygon()
    cl = {}
    for f in F:
        U = U0 if f == 0 or U0.is_empty else U0.buffer(f / 2, join_style="mitre", mitre_limit=10).buffer(-f / 2, join_style="mitre", mitre_limit=10)
        cl[f] = classe(U, P, cadre) if not U.is_empty else "dehors"
    cat = p["cat"] + (("·" + ("dissoute" if p["dissoute"] else "NON dissoute")) if p["cat"] == "jonction" else "")
    for f in F[1:]:
        bilan[f"{cat} f={f}"][f"{cl[0.0]} → {cl[f]}" if cl[f] != cl[0.0] else "inchangé"] += 1
    res.append({**p, "classes": {str(f): c for f, c in cl.items()}})
json.dump(res, open(sortie, "w"))
for k in sorted(bilan):
    print(k.ljust(34), dict(bilan[k]))
