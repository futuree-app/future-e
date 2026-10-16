"""FUT-104 · CONTRÔLE DES POINTS DE RÉFÉRENCE ULTRAMARINS : altitude et corroboration de la localisation.

Le point de référence d'une commune (sa mairie, cf. extraire_climat_outremer.py) vient du COG ou, en Polynésie et en
Nouvelle-Calédonie, de l'Annuaire de l'administration. Le géocodage de ce dernier y est parfois approximatif : la
« mairie » de Pirae (Tahiti) tombe à 778 m d'altitude, dans la vallée, à 5,3 km de l'hôtel de ville littoral. Une
valeur juste pour un pixel de montagne ne doit pas être présentée comme celle du bourg.

Deux contrôles indépendants, versionnés dans src/data/outremer/controles-points.json, que l'extraction relit :
  - ALTITUDE du point : SRTM 30 m (NASA, domaine public), via api.opentopodata.org ;
  - CORROBORATION de la localisation (Polynésie, Nouvelle-Calédonie) : distance à la mairie principale cartographiée
    dans OpenStreetMap (amenity=townhall, hors mairies annexes ou déléguées) située dans la commune. OSM sert de témoin,
    pas de source : aucune de ses coordonnées n'est conservée, seulement une distance (pas d'extraction de base ODbL).

Usage (réseau requis, une fois) :
    python3 -P scripts/outremer/controler_points.py --geo-cache DIR
puis relancer extraire_climat_outremer.py.
"""
import argparse
import datetime as dt
import json
import math
import os
import time
import urllib.error
import urllib.parse
import urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COMMUNES = os.path.join(RACINE, "src", "data", "outremer", "communes-outremer.json")
SORTIE = os.path.join(RACINE, "src", "data", "outremer", "controles-points.json")
UA = {"User-Agent": "futuree-fut104-controle/1.0"}


def lire(req, timeout):
    """Trois tentatives espacées : les services publics (Overpass) renvoient parfois un 502 passager."""
    for essai in range(3):
        try:
            return json.load(urllib.request.urlopen(req, timeout=timeout))
        except urllib.error.HTTPError as e:
            if e.code < 500 or essai == 2:
                raise
            time.sleep(20 * (essai + 1))


def km(a, b, c, d):
    r = math.radians
    x = math.sin(r(c - a) / 2) ** 2 + math.cos(r(a)) * math.cos(r(c)) * math.sin(r(d - b) / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


def dedans(lon, lat, geom):
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    inside = False
    for poly in polys:
        for ring in poly:
            for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
                if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / ((y2 - y1) or 1e-12) + x1:
                    inside = not inside
    return inside


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--geo-cache", required=True, help="répertoire contenant cog-outremer.geojson (cf. extraction)")
    a = p.parse_args()
    entites = [e for e in json.load(open(COMMUNES))["entites"] if e["point"]]

    altitudes = {}
    for k in range(0, len(entites), 90):
        lot = entites[k:k + 90]
        q = "|".join(f"{e['point'][1]},{e['point'][0]}" for e in lot)
        req = urllib.request.Request(f"https://api.opentopodata.org/v1/srtm30m?locations={q}", headers=UA)
        for e, r in zip(lot, lire(req, 60)["results"]):
            altitudes[e["code"]] = r["elevation"]
        time.sleep(1.2)

    requete = """[out:json][timeout:120];
(nwr["amenity"="townhall"](-28.5,-155,-7.5,-134);nwr["amenity"="townhall"](-23.5,163,-19,169););out center tags;"""
    req = urllib.request.Request("https://overpass-api.de/api/interpreter",
                                 data=urllib.parse.urlencode({"data": requete}).encode(), headers=UA)
    mairies = []
    for el in lire(req, 180)["elements"]:
        t = el.get("tags", {})
        etiquette = (t.get("name", "") + " " + t.get("townhall:type", "")).lower()
        if "annexe" in etiquette or "déléguée" in etiquette or "deleguee" in etiquette:
            continue
        lat, lon = el.get("lat", el.get("center", {}).get("lat")), el.get("lon", el.get("center", {}).get("lon"))
        if lat is not None:
            mairies.append((lat, lon))

    contours = {f["properties"]["code"]: f["geometry"] for f in json.load(open(os.path.join(a.geo_cache, "cog-outremer.geojson")))["features"]}
    controles = {}
    for e in entites:
        c = {"altitude_srtm_m": altitudes.get(e["code"])}
        if e["code"][:3] in ("987", "988"):
            dans = [m for m in mairies if dedans(m[1], m[0], contours[e["code"]])]
            c["mairie_osm_km"] = round(min(km(e["point"][1], e["point"][0], m[0], m[1]) for m in dans), 2) if dans else None
        controles[e["code"]] = c

    with open(SORTIE, "w") as f:
        json.dump({
            "schema": 1,
            "releve": dt.date.today().isoformat(),
            "sources": {
                "altitude": "SRTM 30 m (NASA, domaine public), api.opentopodata.org/v1/srtm30m",
                "corroboration": "OpenStreetMap, amenity=townhall hors annexes, via overpass-api.de (distance seule, aucune coordonnée conservée)",
            },
            "points": controles,
        }, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(controles)} points contrôlés → {SORTIE}")


if __name__ == "__main__":
    main()
