#!/usr/bin/env python3
"""05_destinations.py — Pour les actifs résidant à La Rochelle et dans 5 voisines : mode selon la commune
de travail (MOBPRO 2022, pondéré IPONDI). Effectif non pondéré (lignes) publié : sous ~100 lignes, ne pas
interpréter. Usage : python 05_destinations.py <parquet> <resultats>"""
import sys, os, json
import pyarrow.parquet as pq
import pandas as pd
P, OUT = sys.argv[1], sys.argv[2]
NOMS = {"17300": "La Rochelle", "17200": "Lagord", "17291": "Puilboreau", "17028": "Aytré", "17274": "Périgny",
        "17094": "Châtelaillon-Plage", "17142": "Dompierre-sur-Mer", "17264": "Nieul-sur-Mer", "17299": "Rochefort",
        "79191": "Niort", "17010": "Angoulins", "17190": "L'Houmeau", "33063": "Bordeaux", "86194": "Poitiers"}
t = pq.read_table(P, columns=["COMMUNE", "DCLT", "TRANS", "IPONDI"],
                  filters=[("COMMUNE", "in", ["17300", "17200", "17291", "17028", "17274", "17094"])]).to_pandas()
t["COMMUNE"] = t["COMMUNE"].astype(str); t["DCLT"] = t["DCLT"].astype(str)
M = {1: "aucun", 2: "marche", 3: "velo", 4: "2rm", 5: "voiture", 6: "tc"}
t["mode"] = t["TRANS"].map(lambda x: M[int(x)])
rows = []
for (o, d), g in t.groupby(["COMMUNE", "DCLT"]):
    W = g["IPONDI"].sum()
    if len(g) < 40:
        continue
    s = g.groupby("mode")["IPONDI"].sum() / W
    rows.append({"residence": NOMS.get(o, o), "travail": NOMS.get(d, d), "lignes": len(g), "actifs": round(W),
                 "part_des_actifs_de_la_commune": round(W / t[t.COMMUNE == o]["IPONDI"].sum(), 3),
                 **{k: round(float(s.get(k, 0)), 3) for k in M.values()}})
df = pd.DataFrame(rows).sort_values(["residence", "actifs"], ascending=[True, False])
df.to_csv(os.path.join(OUT, "modes_par_destination.csv"), index=False)
pd.set_option("display.width", 250)
print(df.to_string(index=False))
