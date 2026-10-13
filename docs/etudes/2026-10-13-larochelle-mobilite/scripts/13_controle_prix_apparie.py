#!/usr/bin/env python3
"""13_controle_prix_apparie.py — Contrôle de la hausse : mêmes stations aux deux dates.

Prix « en vigueur » au dimanche 12/10/2025 et au dimanche 11/10/2026 = dernier prix déclaré par la station
avant cette date ; on écarte les prix déclarés plus de 7 jours avant (prix anciens) ; on ne garde que les
stations présentes aux deux dates ; on prend la médiane des écarts station par station.
Entrée : base construite par outil/fiche_mobilite.py (carburants_2025_2026.parquet, flux officiel
prix-carburants, archives annuelles téléchargées le 13/10/2026). Stations à 12 km de (46.1590, -1.1520).
Usage : python 13_controle_prix_apparie.py <carburants_2025_2026.parquet> <resultats>"""
import sys, os, json
import numpy as np, pandas as pd
P, OUT = sys.argv[1], sys.argv[2]
df = pd.read_parquet(P)
la0, lo0 = 46.1590, -1.1520
d = 6371 * 2 * np.arcsin(np.sqrt(np.sin(np.radians(df.lat - la0) / 2) ** 2 + np.cos(np.radians(la0)) * np.cos(np.radians(df.lat)) * np.sin(np.radians(df.lon - lo0) / 2) ** 2))
loc = df[d <= 12]
def en_vigueur(c, date):
    s = loc[(loc.carburant == c) & (loc.maj <= date)].sort_values("maj").groupby("pdv").tail(1).set_index("pdv")
    s["age_j"] = (pd.Timestamp(date) - s.maj).dt.days
    return s
res = {}
for c in ("Gazole", "E10"):
    a, b = en_vigueur(c, "2025-10-12 23:59"), en_vigueur(c, "2026-10-11 23:59")
    vieux = {"oct2025": int((a.age_j > 7).sum()), "oct2026": int((b.age_j > 7).sum()), "age_max_j_oct2026": int(b.age_j.max())}
    a, b = a[a.age_j <= 7], b[b.age_j <= 7]
    p = a[["prix"]].join(b[["prix"]], rsuffix="_2026", how="inner"); e = p.prix_2026 - p.prix
    res[c] = {"stations_appariees": len(p), "prix_anciens_ecartes": vieux, "ecart_median": round(float(e.median()), 3),
              "ecart_min": round(float(e.min()), 3), "ecart_max": round(float(e.max()), 3)}
json.dump(res, open(os.path.join(OUT, "controle_prix_apparie.json"), "w"), indent=1)
print(json.dumps(res, indent=1))
