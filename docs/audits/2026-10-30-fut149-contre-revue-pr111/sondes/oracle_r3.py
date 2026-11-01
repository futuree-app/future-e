# Contre-revue FUT-149, option A de R3 : oracle INDÉPENDANT des tuiles. Géométries IGN d'origine (Lambert-93,
# GeoPackage), Shapely ; aucune tuile n'est lue. Vérité au point : réunion des zones découpées à un carré de 1 km
# autour du point (le bord du carré, artificiel, est retiré), comme `oracle_clip.py`.
#
#   python -I oracle_r3.py <full.gpkg> <sortie.json>
#
# Échantillons (graines fixes) :
#   bord        : 4 000 points de part et d'autre du VRAI bord du zonage (bord de la réunion), à 1-120 m
#   trou        : 600 points dans les trous de la réunion (anneaux intérieurs), à 1-120 m de leur bord ou au centre
#   interstice  : 600 points entre deux zones distinctes qui ne se touchent pas, à moins de 20 m l'une de l'autre
#   multi       : 600 points dans ou près des parties secondaires des zones multipolygones
#   jonction    : 3 000 points tirés sur les arêtes partagées entre deux zones (une autre zone à moins de 0,5 m),
#                 à 5-40 m de part et d'autre ; pour chacun, la vérité dit si la jonction est DISSOUTE par la
#                 réunion exacte (aucun bord de la réunion à moins de 1 m du point de l'arête) ou non.
import sqlite3, json, sys, random, math, time
import numpy, shapely
from shapely import wkb
from shapely.geometry import Point
from pyproj import Transformer

gpkg, sortie = sys.argv[1], sys.argv[2]
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]


def geom(b):
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(b[3] >> 1) & 7]
    return wkb.loads(bytes(b[8 + env:]))


Z = []
for g, ident, dept, diff in con.execute(f"select geom, ID, DEPT, DIFFUSION from {t} where ZONAGE = 2"):
    d = dept.strip()
    d = d[1:] if len(d) == 3 and d[0] == "0" else d
    Z.append((geom(g), ident, d, diff != "Oui"))
G = [z[0] for z in Z]
arbre = shapely.STRtree(G)
w2l = Transformer.from_crs(4326, 2154, always_xy=True)
l2w = Transformer.from_crs(2154, 4326, always_xy=True)
R = 500.0
t0 = time.time()


def verite(x, y):
    P = Point(x, y)
    idx = arbre.query(P.buffer(300), predicate="intersects")
    if len(idx) == 0:
        return {"dedans": False, "dist": 1e9, "amb": False, "deps": [], "dep": None}
    morceaux = [shapely.intersection(G[i], shapely.box(x - R, y - R, x + R, y + R)) for i in idx]
    U = shapely.unary_union(morceaux, grid_size=1e-6)  # précision fixe : cf. construire.py, GRILLE_CALCUL_M
    cadre = shapely.box(x - R, y - R, x + R, y + R).boundary
    bordU = shapely.difference(U.boundary, cadre.buffer(0.01))
    dist = float(bordU.distance(P)) if not bordU.is_empty else 1e9
    sous = [i for i, m in zip(idx, morceaux) if m.covers(P)]
    proches = [i for i, m in zip(idx, morceaux) if m.distance(P) <= 60]
    return {"dedans": bool(U.covers(P)), "dist": round(dist, 3), "amb": any(Z[i][3] for i in proches),
            "deps": sorted({Z[i][2] for i in idx}), "dep": Z[(sous or proches or list(idx))[0]][2]}


def point(x, y, cat, extra=None):
    v = verite(x, y)
    lon, lat = l2w.transform(x, y)
    return {"cat": cat, "lon": lon, "lat": lat, **v, **(extra or {})}


def sur(ligne, rnd):
    return ligne.interpolate(rnd.uniform(0, ligne.length))


def decale(q, ligne, d):
    """Le point à `d` m de q, perpendiculairement à la ligne (d signé)."""
    a = ligne.project(q)
    p1, p2 = ligne.interpolate(max(0, a - 0.5)), ligne.interpolate(min(ligne.length, a + 0.5))
    dx, dy = p2.x - p1.x, p2.y - p1.y
    n = math.hypot(dx, dy) or 1
    return q.x - dy / n * d, q.y + dx / n * d


out = []
DIST = [1, 5, 10, 20, 30, 40, 45, 55, 60, 80, 120]

# Le bord de la réunion, zone par zone (pour tirer des points sur le VRAI bord sans calculer la réunion nationale) :
# le bord d'une zone, moins ce qui est couvert par les autres zones voisines.
rnd = random.Random(31)
longs = numpy.array([g.boundary.length for g in G])
cum = numpy.cumsum(longs)
n = 0
while n < 4000:
    i = int(numpy.searchsorted(cum, rnd.uniform(0, cum[-1])))
    B = G[i].boundary
    q = sur(B, rnd)
    voisins = [j for j in arbre.query(q.buffer(1.0), predicate="intersects") if j != i]
    if any(G[j].distance(q) < 1.0 for j in voisins):
        continue  # arête partagée : échantillon « jonction »
    d = rnd.choice(DIST) * rnd.choice([-1, 1])
    out.append(point(*decale(q, B, d), "bord", {"d": d}))
    n += 1
print("bord", round(time.time() - t0), file=sys.stderr, flush=True)

# Les trous : anneaux intérieurs des zones qui ne sont recouverts par aucune autre zone.
trous = []
for i, g in enumerate(G):
    for p in (g.geoms if g.geom_type == "MultiPolygon" else [g]):
        for a in p.interiors:
            poly = shapely.Polygon(a)
            if not any(G[j].covers(poly.representative_point()) for j in arbre.query(poly, predicate="intersects") if j != i):
                trous.append(shapely.LinearRing(a))
rnd = random.Random(32)
n = 0
while n < 600 and trous:
    a = trous[rnd.randrange(len(trous))]
    if rnd.random() < 0.2:
        q = shapely.Polygon(a).representative_point()
        out.append(point(q.x, q.y, "trou", {"d": "centre"}))
    else:
        q = sur(a, rnd)
        d = rnd.choice(DIST) * rnd.choice([-1, 1])
        out.append(point(*decale(q, a, d), "trou", {"d": d}))
    n += 1
print("trou", len(trous), round(time.time() - t0), file=sys.stderr, flush=True)

# Les interstices : deux zones distinctes qui ne se touchent pas, à moins de 20 m l'une de l'autre.
paires = []
for i, g in enumerate(G):
    for j in arbre.query(g, predicate="dwithin", distance=20):
        if j > i and not G[j].intersects(g):
            paires.append((i, int(j)))
rnd = random.Random(33)
n = 0
while n < 600 and paires:
    i, j = paires[rnd.randrange(len(paires))]
    seg = shapely.shortest_line(G[i], G[j])
    q = seg.interpolate(rnd.uniform(0, 1), normalized=True)
    out.append(point(q.x, q.y, "interstice", {"largeur": round(seg.length, 2)}))
    n += 1
print("interstice", len(paires), round(time.time() - t0), file=sys.stderr, flush=True)

# Les parties secondaires des multipolygones.
multi = [(i, p) for i, g in enumerate(G) if g.geom_type == "MultiPolygon" for p in sorted(g.geoms, key=lambda p: p.area)[:-1]]
rnd = random.Random(34)
n = 0
while n < 600 and multi:
    i, p = multi[rnd.randrange(len(multi))]
    if rnd.random() < 0.3:
        q = p.representative_point()
        out.append(point(q.x, q.y, "multi", {"d": "dedans", "aire": round(p.area)}))
    else:
        q = sur(p.exterior, rnd)
        d = rnd.choice(DIST) * rnd.choice([-1, 1])
        out.append(point(*decale(q, p.exterior, d), "multi", {"d": d, "aire": round(p.area)}))
    n += 1
print("multi", len(multi), round(time.time() - t0), file=sys.stderr, flush=True)

# Les jonctions : un point d'une arête partagée, dissoute ou non par la réunion exacte.
rnd = random.Random(7)
n = 0
nondissoutes = 0
while n < 3000:
    i = int(numpy.searchsorted(cum, rnd.uniform(0, cum[-1])))
    B = G[i].boundary
    q = sur(B, rnd)
    autres = [j for j in arbre.query(q.buffer(0.5), predicate="intersects") if j != i and G[j].distance(q) < 0.5]
    if not autres:
        continue
    vq = verite(q.x, q.y)
    dissoute = vq["dist"] > 1.0
    nondissoutes += not dissoute
    d = rnd.uniform(5, 40) * rnd.choice([-1, 1])
    out.append(point(*decale(q, B, d), "jonction", {"d": round(d, 1), "dissoute": dissoute, "zones": sorted({Z[k][2] for k in [i, *autres]})}))
    n += 1
print("jonction", nondissoutes, round(time.time() - t0), file=sys.stderr, flush=True)

json.dump(out, open(sortie, "w"))
print(json.dumps({"points": len(out), "trous": len(trous), "paires": len(paires), "multi": len(multi), "jonctionsNonDissoutes": nondissoutes, "secondes": round(time.time() - t0)}))
