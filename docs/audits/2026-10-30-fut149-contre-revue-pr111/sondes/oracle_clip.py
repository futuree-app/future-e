import sqlite3, json, sys, random, math, time, numpy, shapely
from shapely import wkb
from shapely.geometry import Point
from pyproj import Transformer
gpkg, out_grille, out_partage, NG, NP = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
def geom(b):
    env = {0:0,1:32,2:48,3:48,4:64}[(b[3]>>1)&7]; return wkb.loads(bytes(b[8+env:]))
Z = []
for g, ident, dept, diff in con.execute(f"select geom, ID, DEPT, DIFFUSION from {t} where ZONAGE = 2"):
    d = dept.strip(); d = d[1:] if len(d)==3 and d[0]=='0' else d
    Z.append((geom(g), ident, d, diff != "Oui"))
G = [z[0] for z in Z]; arbre = shapely.STRtree(G)
w2l = Transformer.from_crs(4326, 2154, always_xy=True); l2w = Transformer.from_crs(2154, 4326, always_xy=True)
R = 500.0
def verite(x, y):
    """Vérité au point (Lambert-93), sur les zones découpées à un carré de 1 km : la frontière du carré est à 500 m."""
    P = Point(x, y); idx = arbre.query(P.buffer(300), predicate="intersects")
    if len(idx) == 0: return None
    morceaux = [shapely.clip_by_rect(G[i], x-R, y-R, x+R, y+R) for i in idx]
    U = shapely.unary_union(morceaux)
    cadre = shapely.box(x-R, y-R, x+R, y+R).boundary
    bordU = shapely.difference(U.boundary, cadre.buffer(0.01))
    dist = float(bordU.distance(P)) if not bordU.is_empty else 1e9
    dind = min((float(shapely.difference(m.boundary, cadre.buffer(0.01)).distance(P)) for m in morceaux if not m.is_empty), default=1e9)
    sous = [i for i, m in zip(idx, morceaux) if m.contains(P)]
    return bool(U.contains(P)), dist, dind, Z[(sous or list(idx))[0]][2], any(Z[i][3] for i in idx), sorted({Z[i][2] for i in idx})
t0 = time.time()
random.seed(149); pts = []; essais = 0
while len(pts) < NG and essais < 3_000_000:
    essais += 1
    if random.random() < .5: lon, lat, axe = random.randint(-52, 96)/10, random.uniform(41.3, 51.1), "lon"
    else: lon, lat, axe = random.uniform(-5.2, 9.6), random.randint(413, 511)/10, "lat"
    if not len(arbre.query(Point(*w2l.transform(lon, lat)).buffer(150), predicate="intersects")): continue
    d = random.choice([1, 5, 10, 20, 30, 40, 60, 80, 120]); s = random.choice([-1, 1])
    plon, plat = (lon + s*d/(111320*math.cos(math.radians(lat))), lat) if axe == "lon" else (lon, lat + s*d/111132)
    v = verite(*w2l.transform(plon, plat))
    if v is None: continue
    dedans, dist, dind, dep, amb, deps = v
    pts.append({"lon": plon, "lat": plat, "axe": axe, "d": d, "dedans": dedans, "dist": round(dist,2), "distIndiv": round(dind,2), "dep": dep, "ambigu": amb, "deps": deps})
    if len(pts) % 1000 == 0: print("grille", len(pts), round(time.time()-t0), file=sys.stderr, flush=True)
json.dump(pts, open(out_grille, "w")); print("FIN grille", len(pts), file=sys.stderr, flush=True)
# Arêtes partagées : un sommet du bord d'une zone qui n'est PAS sur la frontière de l'union (il touche une autre zone).
longs = numpy.array([g.boundary.length for g in G]); cum = numpy.cumsum(longs)
random.seed(7); pp = []; essais = 0
while len(pp) < NP and essais < 400_000:
    essais += 1
    i = int(numpy.searchsorted(cum, random.uniform(0, cum[-1]))); B = G[i].boundary
    q = B.interpolate(random.uniform(0, B.length))
    autres = [j for j in arbre.query(q.buffer(0.5), predicate="intersects") if j != i]
    if not autres: continue
    off = random.uniform(5, 40) * random.choice([-1, 1]); ang = random.uniform(0, 2*math.pi)
    x, y = q.x + off*math.cos(ang), q.y + off*math.sin(ang)
    v = verite(x, y)
    if v is None or not v[0] or v[1] < 65 or v[4]: continue
    lon, lat = l2w.transform(x, y)
    pp.append({"lon": lon, "lat": lat, "dep": v[3], "deps": v[5], "distPartage": round(v[2],1), "distFrontiere": round(v[1],1)})
    if len(pp) % 500 == 0: print("partage", len(pp), round(time.time()-t0), file=sys.stderr, flush=True)
json.dump(pp, open(out_partage, "w")); print("FIN partage", len(pp), essais, file=sys.stderr, flush=True)
