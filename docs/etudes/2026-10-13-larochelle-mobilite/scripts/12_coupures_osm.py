#!/usr/bin/env python3
"""12_coupures_osm.py — Combien d'adresses sont séparées du centre de La Rochelle par une voie rapide ou une voie
ferrée ? Mêmes balises OSM que le produit (src/lib/logement-osm.ts, FUT-15 : highway motorway|trunk|*_link,
railway=rail), récupérées par Overpass (overpass.openstreetmap.fr, premier miroir du produit) le 13/10/2026.

Indicateur : le SEGMENT à vol d'oiseau entre l'adresse et la place de Verdun croise-t-il une de ces lignes ?
C'est un indicateur de coupure grossier : il ignore les ponts, passerelles et passages souterrains (qui sont
précisément ce qui rend une coupure franchissable). Il dit « il y a une infrastructure à franchir », jamais
« elle est infranchissable ». Usage : python 12_coupures_osm.py <resultats>"""
import sys, os, json, urllib.request, urllib.parse
import pandas as pd
from shapely.geometry import LineString
from shapely.strtree import STRtree
OUT = sys.argv[1]
bb = "(46.10,-1.25,46.23,-1.05)"
q = ("[out:json][timeout:90];(" f'way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]{bb};'
     f'way["railway"="rail"]{bb};);out geom;')
req = urllib.request.Request("https://overpass.openstreetmap.fr/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode(),
                             headers={"User-Agent": "futur-e-etude"})
el = json.load(urllib.request.urlopen(req, timeout=120))["elements"]
lines = {"route": [], "rail": []}
for e in el:
    g = LineString([(p["lon"], p["lat"]) for p in e["geometry"]])
    lines["rail" if e["tags"].get("railway") else "route"].append(g)
trees = {k: STRtree(v) for k, v in lines.items()}
a = pd.read_csv(os.path.join(OUT, "adresses_acces.csv.gz"), dtype={"code_insee": str})
V = (-1.153589, 46.162954)
def croise(k, lo, la):
    s = LineString([(lo, la), V])
    return any(lines[k][i].intersects(s) for i in trees[k].query(s))
a["coupe_route"] = [croise("route", x, y) for x, y in zip(a.lon, a.lat)]
a["coupe_rail"] = [croise("rail", x, y) for x, y in zip(a.lon, a.lat)]
res = {}
for c, g in a.groupby("code_insee"):
    w = g.poids.fillna(0); W = w.sum()
    res[c] = {"voie_rapide": round(float((w * g.coupe_route).sum() / W), 3), "voie_ferree": round(float((w * g.coupe_rail).sum() / W), 3)}
res["_osm"] = {"ways_route": len(lines["route"]), "ways_rail": len(lines["rail"])}
json.dump(res, open(os.path.join(OUT, "coupures_osm.json"), "w"), indent=1)
print(json.dumps(res, indent=1))
