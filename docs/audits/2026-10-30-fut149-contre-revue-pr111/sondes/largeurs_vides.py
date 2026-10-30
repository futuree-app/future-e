# Contre-revue FUT-149 : la distribution des LARGEURS des vides du zonage (géométrie IGN d'origine, Lambert-93).
#   python -I largeurs_vides.py <full.gpkg> <sortie.json>
# Un « vide » est un trou de la RÉUNION de toutes les zones (anneau intérieur), qu'il soit un trou d'une zone ou un
# espace laissé entre plusieurs zones. Largeur moyenne = 2 × aire / périmètre (exacte pour une bande étroite).
# Les vides entre zones distinctes qui débouchent sur l'extérieur (encoches) ne sont pas des trous : ils sont
# mesurés à part, par la distance entre zones voisines qui ne se touchent pas.
import sqlite3, json, sys, time, collections
import shapely
from shapely import wkb
gpkg, sortie = sys.argv[1:3]
con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
t = con.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
def geom(b):
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(b[3] >> 1) & 7]
    return wkb.loads(bytes(b[8 + env:]))
Z = [(geom(g), d.strip()) for g, d in con.execute(f"select geom, DEPT from {t} where ZONAGE = 2")]
t0 = time.time()
U = shapely.unary_union([z[0] for z in Z], grid_size=1e-6)  # précision fixe : cf. construire.py, GRILLE_CALCUL_M
print("réunion", round(time.time() - t0), "s", file=sys.stderr, flush=True)
arbre = shapely.STRtree([z[0] for z in Z])
classes = [(0.001, "< 1 mm"), (0.01, "1 mm – 1 cm"), (0.1, "1 – 10 cm"), (1, "10 cm – 1 m"), (10, "1 – 10 m"), (float("inf"), "≥ 10 m")]
hist = collections.OrderedDict((c, {"nombre": 0, "perimetreKm": 0.0, "entreZones": 0}) for _, c in classes)
vides = []
for p in (U.geoms if U.geom_type == "MultiPolygon" else [U]):
    for a in p.interiors:
        h = shapely.Polygon(a)
        L = h.length
        larg = 2 * h.area / L if L else 0
        c = next(c for s, c in classes if larg < s)
        # Entre zones : le vide touche plusieurs zones distinctes.
        n = len([i for i in arbre.query(h, predicate="intersects") if Z[i][0].distance(h) < 1e-6])
        hist[c]["nombre"] += 1
        hist[c]["perimetreKm"] += L / 1000
        hist[c]["entreZones"] += n > 1
        vides.append({"largeur": round(larg, 6), "perimetre": round(L, 2), "aire": round(h.area, 6), "zones": n})
for v in hist.values():
    v["perimetreKm"] = round(v["perimetreKm"], 2)
json.dump({"histogramme": hist, "vides": vides}, open(sortie, "w"))
print(json.dumps(hist, ensure_ascii=False, indent=1))
