#!/usr/bin/env python3
"""08_km_routiers.py — Kilomètres routiers de quelques flux domicile-travail vers La Rochelle, par trois calculs :
IGN bdtopo-valhalla fastest (paramètres du produit, route-time.ts), IGN bdtopo-valhalla shortest, IGN bdtopo-osrm.
Départ : mairie de la commune (géocodage IGN « mairie <commune> » non utilisé : coordonnées BAN de l'hôtel de
ville saisies ci-dessous, à vérifier). Arrivée : place de Verdun (46.162954, -1.153589).
But : ENCADRER une distance pour un scénario carburant, pas publier un temps.
Usage : python 08_km_routiers.py <resultats>"""
import sys, os, json, time, urllib.request, urllib.parse
OUT = sys.argv[1]
ORIG = {  # hôtel de ville (BAN, adresse de la mairie)
    "Lagord": "Mairie Lagord 17140", "Puilboreau": "Mairie Puilboreau 17138", "Périgny": "Mairie Périgny 17180",
    "Aytré": "Mairie Aytré 17440", "Châtelaillon-Plage": "Mairie Châtelaillon-Plage 17340",
    "Rochefort": "Hôtel de ville Rochefort 17300", "Surgères": "Mairie Surgères 17700", "Marans": "Mairie Marans 17230",
}
DEST = (-1.153589, 46.162954)
def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "futur-e-etude"}), timeout=30))
rows = []
for nom, q in ORIG.items():
    g = get("https://data.geopf.fr/geocodage/search?" + urllib.parse.urlencode({"q": q, "limit": 1, "index": "poi"}))
    if not g["features"]:
        g = get("https://data.geopf.fr/geocodage/search?" + urllib.parse.urlencode({"q": q, "limit": 1}))
    f = g["features"][0]; lon, lat = f["geometry"]["coordinates"]
    r = {"origine": nom, "geocode": f["properties"].get("name") or f["properties"].get("label"), "lon": lon, "lat": lat}
    for lab, res, opt in [("valhalla_fastest", "bdtopo-valhalla", "fastest"), ("valhalla_shortest", "bdtopo-valhalla", "shortest"),
                          ("osrm_fastest", "bdtopo-osrm", "fastest")]:
        u = "https://data.geopf.fr/navigation/itineraire?" + urllib.parse.urlencode({
            "resource": res, "start": f"{lon},{lat}", "end": f"{DEST[0]},{DEST[1]}", "profile": "car",
            "optimization": opt, "timeUnit": "minute", "distanceUnit": "kilometer"})
        try:
            j = get(u); r[f"{lab}_km"] = round(j["distance"], 1); r[f"{lab}_min"] = round(j["duration"], 1)
        except Exception as e:
            r[f"{lab}_km"] = None
        time.sleep(0.3)
    rows.append(r); print(r)
json.dump(rows, open(os.path.join(OUT, "km_routiers.json"), "w"), ensure_ascii=False, indent=1)
