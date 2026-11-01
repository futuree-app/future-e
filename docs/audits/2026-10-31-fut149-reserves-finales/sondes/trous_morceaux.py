# FUT-149, 31/10/2026 · § 1 : LES TROUS DES MORCEAUX, AVANT ET APRÈS PUBLICATION. Pour chaque zone découpée à
# chaque cellule (exactement comme `construire.py`), compte les anneaux intérieurs de la géométrie officielle
# (WGS84, non arrondie) et ceux qui survivent à l'arrondi au 1e-7 degré (`set_precision` puis `anneau_code`), par
# classe de largeur (aire / demi-périmètre, en Lambert-93). Un trou qui disparaît du morceau n'est lu correctement
# que si sa limite reste dans `limites` (`limites_effondrees.py`).
#   python -I trous_morceaux.py <construire.py> <full.gpkg> <sortie.json>
import importlib.util, json, math, sys
import shapely
from shapely.geometry import box
from shapely.strtree import STRtree
from pyproj import Transformer

chemin, gpkg, sortie = sys.argv[1:4]
spec = importlib.util.spec_from_file_location("construire", chemin)
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
zones, _ = c.lire_zones(gpkg)
vers_wgs84 = Transformer.from_crs(2154, 4326, always_xy=True)
vers_l93 = Transformer.from_crs(4326, 2154, always_xy=True)
for z in zones:
    z["wgs"] = shapely.transform(z["geom"], lambda co: c._transformer(vers_wgs84, co))
arbre = STRtree([z["wgs"] for z in zones])
x0, y0, x1, y1 = shapely.total_bounds([z["wgs"] for z in zones])
CLASSES = [(0.001, "< 1 mm"), (0.01, "1 mm - 1 cm"), (0.1, "1 - 10 cm"), (1, "10 cm - 1 m"), (math.inf, ">= 1 m")]
classe = lambda w: next(n for s, n in CLASSES if w < s)
bilan = {n: {"officiels": 0, "publies": 0} for _, n in CLASSES}
for ix in range(math.floor(x0 * 10), math.floor(x1 * 10) + 1):
    for iy in range(math.floor(y0 * 10), math.floor(y1 * 10) + 1):
        cellule = (ix / 10, iy / 10, (ix + 1) / 10, (iy + 1) / 10)
        for k in arbre.query(box(*cellule), predicate="intersects"):
            brut = shapely.clip_by_rect(zones[k]["wgs"], *cellule)
            for p in c.polygones(brut):
                for t in p.interiors:
                    g = shapely.transform(shapely.Polygon(t), lambda co: c._transformer(vers_l93, co))
                    bilan[classe(2 * g.area / g.length if g.length else 0)]["officiels"] += 1
            for p in c.polygones(shapely.set_precision(brut, 1 / c.ECHELLE)):
                if p.area <= 0:
                    continue
                for t in p.interiors:
                    code, _ = c.anneau_code(list(t.coords))
                    if code is None:
                        continue
                    g = shapely.transform(shapely.Polygon(t), lambda co: c._transformer(vers_l93, co))
                    bilan[classe(2 * g.area / g.length if g.length else 0)]["publies"] += 1
json.dump(bilan, open(sortie, "w"), ensure_ascii=False)
print(json.dumps(bilan, ensure_ascii=False))
