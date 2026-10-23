#!/usr/bin/env python3
"""09_partage.py — Part des adresses (pondérées comme 03) à moins de 500 m d'une station d'autopartage Citiz ou
d'une station de vélos Yélo en libre-service. Sources : GBFS Citiz La Rochelle (backend.citiz.fr, provider 18,
lu le 13/10/2026 10:29 UTC) ; GBFS VLS Yélo (data.gouv, ressource mise à jour le 17/06/2026 : liste de stations
possiblement datée). Vol d'oiseau. Usage : python 09_partage.py <dl/gbfs> <resultats>"""
import sys, os, json
import numpy as np, pandas as pd
from pyproj import Transformer
G, OUT = sys.argv[1], sys.argv[2]
tr = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)
a = pd.read_csv(os.path.join(OUT, "adresses_acces.csv.gz"), dtype={"code_insee": str})
ax, ay = tr.transform(a.lon.to_numpy(), a.lat.to_numpy()); A = np.c_[ax, ay]
def near(lst):
    x, y = tr.transform(np.array([s[1] for s in lst]), np.array([s[0] for s in lst])); P = np.c_[x, y]
    return np.sqrt(((A[:, None, :] - P[None]) ** 2).sum(-1)).min(1)
cz = json.load(open(os.path.join(G, "citiz_stations.json")))["data"]["stations"]
yl = json.load(open(os.path.join(G, "yelo_gbfs.json")))["data"]["stations"]
a["d_citiz"] = near([(s["lat"], s["lon"]) for s in cz]); a["d_vls"] = near([(s["lat"], s["lon"]) for s in yl])
out = {"stations_citiz": len(cz), "stations_vls": len(yl), "communes": {}}
for c, g in a.groupby("code_insee"):
    w = g.poids.fillna(0); W = w.sum()
    out["communes"][c] = {"citiz_500m": round(float((w * (g.d_citiz <= 500)).sum() / W), 3),
                          "vls_500m": round(float((w * (g.d_vls <= 500)).sum() / W), 3)}
json.dump(out, open(os.path.join(OUT, "partage_resultats.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
