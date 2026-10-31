# FUT-149, 31/10/2026 · § 1 : dans l'édition NATIONALE, les vraies limites que l'encodage au 1e-7 degré efface.
# Rejoue la boucle de `construire.py` (mêmes fonctions, importées) et, pour chaque cellule, garde les lignes de
# `limites_cellule` dont `ligne_code` rend None (tous les sommets sur un même point de la grille). Pour chacune :
# fermée ou non, étendue, et ce qu'elle entoure (vrai trou de la réunion : point hors de toute zone d'origine ;
# îlot : point dans une zone). Ne lit pas les tuiles : la géométrie d'origine fait foi.
#   python -I limites_effondrees.py <construire.py> <full.gpkg> <sortie.json>
import importlib.util, json, math, sys
import shapely
from shapely.geometry import box, Point
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
zones_l93 = [z["geom"] for z in zones]
arbre_l93 = STRtree(zones_l93)
x0, y0, x1, y1 = shapely.total_bounds([z["wgs"] for z in zones])
out, nlignes, ncell = [], 0, 0
for ix in range(math.floor(x0 * 10), math.floor(x1 * 10) + 1):
    for iy in range(math.floor(y0 * 10), math.floor(y1 * 10) + 1):
        cellule = (ix / 10, iy / 10, (ix + 1) / 10, (iy + 1) / 10)
        if len(arbre.query(box(*cellule), predicate="intersects")) == 0:
            continue
        ncell += 1
        ls, _ = c.limites_cellule(zones_l93, arbre_l93, cellule, vers_l93, vers_wgs84, 0.0)
        nlignes += len(ls)
        for l in ls:
            if c.ligne_code(list(l.coords)) is not None:
                continue
            l93 = shapely.transform(l, lambda co: c._transformer(vers_l93, co))
            ferme = l.is_closed
            nature, couvert = "ligne", None
            if ferme and len(l.coords) >= 4:
                poly = shapely.Polygon(l93.coords)
                if poly.is_valid and poly.area > 0:
                    p = poly.representative_point()
                    couvert = any(zones_l93[i].covers(p) for i in arbre_l93.query(p))
                    nature = "ilot" if couvert else "trou"
            lon, lat = l.centroid.x, l.centroid.y
            out.append({"cellule": f"{ix}_{iy}", "lon": lon, "lat": lat, "nature": nature, "ferme": ferme,
                        "sommets": len(l.coords), "longueurMm": round(l93.length * 1000, 3),
                        "etendueMm": round(max(l93.bounds[2] - l93.bounds[0], l93.bounds[3] - l93.bounds[1]) * 1000, 3),
                        "aireMm2": round(shapely.Polygon(l93.coords).area * 1e6, 4) if ferme and len(l.coords) >= 4 else None})
json.dump({"cellules": ncell, "lignes": nlignes, "effondrees": out}, open(sortie, "w"))
from collections import Counter
print(json.dumps({"cellules": ncell, "lignes": nlignes, "effondrees": len(out), "par_nature": Counter(o["nature"] for o in out)}))
