# FUT-149, 31/10/2026 · § 1 : des points d'épreuve pour chaque limite effacée (`limites_effondrees.py`), avec leur
# vérité sur les géométries d'ORIGINE (Lambert-93) : dans une zone (covers) ou non, et distance au bord de la réunion.
# Trou fermé : son point intérieur (strictement hors zone). Fragment ouvert : son milieu, et 4 points à ±0,5 mm et
# ±2 mm de part et d'autre (normale au fragment).
#   python -I effondrees_points.py <full.gpkg> <effondrees.json> <points.json>
import json, sqlite3, sys
import shapely, shapely.ops
from shapely import wkb
from shapely.geometry import Point, box
from shapely.strtree import STRtree
from pyproj import Transformer

gpkg, entree, sortie = sys.argv[1:4]
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
def geom(b):
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(b[3] >> 1) & 7]
    return wkb.loads(bytes(b[8 + env:]))
zones = [geom(r[0]) for r in con.execute(f"select geom from {t} where ZONAGE = 2")]
arbre = STRtree(zones)
l93 = Transformer.from_crs(4326, 2154, always_xy=True)
wgs = Transformer.from_crs(2154, 4326, always_xy=True)
E = json.load(open(entree))["effondrees"]
pts = []
for k, o in enumerate(E):
    X, Y = l93.transform(o["lon"], o["lat"])
    ici = Point(X, Y)
    loc = [zones[i] for i in arbre.query(ici.buffer(200))]
    reunion = shapely.unary_union([shapely.clip_by_rect(z, X - 200, Y - 200, X + 200, Y + 200) for z in loc], grid_size=1e-6)
    candidats = []
    if o["nature"] == "trou":
        # Le vide de la réunion le plus proche du centroïde (le trou lui-même) : son point intérieur.
        vides = [shapely.Polygon(r) for p in getattr(reunion, "geoms", [reunion]) for r in p.interiors]
        vides = sorted(vides, key=lambda v: v.distance(ici))
        candidats.append(("interieur", vides[0].representative_point()))
    else:
        candidats.append(("milieu", ici))
        # La normale au bord de la réunion le plus proche.
        b = reunion.boundary
        q = shapely.ops.nearest_points(b, ici)[0] if not b.is_empty else ici
        import math
        for d in (0.0005, 0.002):
            for s in (1, -1):
                for ang in (0, math.pi / 2):
                    candidats.append((f"{'+' if s > 0 else '-'}{d * 1000} mm {'x' if ang == 0 else 'y'}", Point(q.x + s * d * math.cos(ang), q.y + s * d * math.sin(ang))))
    for nom, p in candidats:
        dedans = any(z.covers(p) for z in loc)
        d = reunion.boundary.distance(p)
        lon, lat = wgs.transform(p.x, p.y)
        pts.append({"k": k, "cellule": o["cellule"], "nature": o["nature"], "essai": nom, "lon": lon, "lat": lat,
                    "veriteDedans": dedans, "distanceBordMm": round(d * 1000, 3), "etendueMm": o["etendueMm"]})
json.dump(pts, open(sortie, "w"))
print(len(pts), "points")
