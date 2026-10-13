#!/usr/bin/env python3
"""06_velo_premiere_couronne.py — Distance et détour À VÉLO depuis des adresses tirées au hasard dans 4 communes
de première couronne vers deux destinations de La Rochelle (place de Verdun ; zone hospitalière/centre).

Moteur : OSRM profil vélo du serveur FOSSGIS (routing.openstreetmap.de, données OSM), appel limité (1 req/s).
Ce n'est pas un moteur produit de futur•e : il sert à CONTRÔLER une hypothèse (coupure / détour), pas à publier
des temps. Tirage : 25 adresses BAN par commune, graine fixe 42, pondérées comme dans 03 (ménages IRIS).
Usage : python 06_velo_premiere_couronne.py <resultats>"""
import sys, os, json, time, math, urllib.request
import pandas as pd
OUT = sys.argv[1]
a = pd.read_csv(os.path.join(OUT, "adresses_acces.csv.gz"), dtype={"code_insee": str})
DEST = {"verdun": (46.162954, -1.153589)}
COMS = {"17200": "Lagord", "17291": "Puilboreau", "17274": "Périgny", "17028": "Aytré"}
def hv(la1, lo1, la2, lo2):
    p = math.radians; R = 6371000
    x = math.sin(p(la2 - la1) / 2) ** 2 + math.cos(p(la1)) * math.cos(p(la2)) * math.sin(p(lo2 - lo1) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))
rows = []
for c, nom in COMS.items():
    sub = a[(a.code_insee == c) & a.poids.notna()].sample(25, weights="poids", random_state=42)
    for _, r in sub.iterrows():
        for dn, (dla, dlo) in DEST.items():
            url = f"https://routing.openstreetmap.de/routed-bike/route/v1/bike/{r.lon},{r.lat};{dlo},{dla}?overview=false"
            req = urllib.request.Request(url, headers={"User-Agent": "futur-e-etude-mobilite/1.0 (contact via futur-e.fr)"})
            try:
                j = json.load(urllib.request.urlopen(req, timeout=20)); rt = j["routes"][0]
                rows.append({"commune": nom, "id": r.id, "dest": dn, "vol_oiseau_m": round(hv(r.lat, r.lon, dla, dlo)),
                             "velo_m": round(rt["distance"]), "velo_min": round(rt["duration"] / 60, 1)})
            except Exception as e:
                rows.append({"commune": nom, "id": r.id, "dest": dn, "erreur": str(e)[:80]})
            time.sleep(1.1)
df = pd.DataFrame(rows)
df["detour"] = (df["velo_m"] / df["vol_oiseau_m"]).round(2)
df.to_csv(os.path.join(OUT, "velo_premiere_couronne.csv"), index=False)
print(df.groupby("commune")[["vol_oiseau_m", "velo_m", "velo_min", "detour"]].median().round(2).to_string())
print(df.groupby("commune")[["velo_min"]].describe().round(1).to_string())
