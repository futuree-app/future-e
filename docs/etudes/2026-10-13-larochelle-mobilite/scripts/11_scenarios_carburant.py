#!/usr/bin/env python3
"""11_scenarios_carburant.py — Ce que la hausse OBSERVÉE du carburant (octobre 2025 → octobre 2026, stations à
moins de 12 km de La Rochelle, cf. 07) coûte de plus par an pour UN trajet domicile-travail en voiture.

Formule : 2 × km aller × jours travaillés × (L/100 km ÷ 100) × écart de prix au litre.
Hypothèses (modifiables, NON mesurées) : 200 jours de trajet/an (congés, télétravail partiel), consommation 6 L/100 km
(fourchette 5 à 7,5). Kilomètres aller : fourchettes issues de 08 (trois calculs de route ; aucun n'est vérifié).
Ce n'est PAS le coût de la voiture (achat, assurance, entretien, stationnement exclus), ni celui du ménage.
Usage : python 11_scenarios_carburant.py <resultats>"""
import sys, os, json
import pandas as pd
OUT = sys.argv[1]
loc = pd.read_csv(os.path.join(OUT, "carburants_hebdo_la_rochelle_12km.csv"), parse_dates=["semaine"])
def med(c, wk):
    return float(loc[(loc.carburant == c) & (loc.semaine == wk)]["median"].iloc[0])
P = {c: {"oct_2025": med(c, "2025-10-06"), "oct_2026": med(c, "2026-10-05")} for c in ["Gazole", "E10"]}
for c in P:
    P[c]["ecart"] = round(P[c]["oct_2026"] - P[c]["oct_2025"], 3)
TRAJETS = [("Première couronne (Lagord, Puilboreau)", 4, 6), ("Aytré, Périgny", 6, 11.5), ("Châtelaillon-Plage", 16, 23),
           ("Marans", 23.5, 26), ("Rochefort", 33, 38), ("Surgères", 35.5, 45)]
DAYS, CONS, CONS_LO, CONS_HI = 200, 6.0, 5.0, 7.5
rows = []
for lab, lo, hi in TRAJETS:
    for c in ["Gazole", "E10"]:
        L_lo = 2 * lo * DAYS * CONS / 100; L_hi = 2 * hi * DAYS * CONS / 100
        rows.append({"trajet": lab, "km_aller": f"{lo}–{hi}", "carburant": c,
                     "litres_an": f"{round(L_lo, -1):.0f}–{round(L_hi, -1):.0f}",
                     "surcout_an_eur": f"{round(L_lo * P[c]['ecart'], -1):.0f}–{round(L_hi * P[c]['ecart'], -1):.0f}",
                     "budget_carburant_oct2026_eur": f"{round(L_lo * P[c]['oct_2026'], -1):.0f}–{round(L_hi * P[c]['oct_2026'], -1):.0f}",
                     "surcout_conso_5_a_7_5": f"{round(2*lo*DAYS*CONS_LO/100*P[c]['ecart'], -1):.0f}–{round(2*hi*DAYS*CONS_HI/100*P[c]['ecart'], -1):.0f}"})
df = pd.DataFrame(rows)
df.to_csv(os.path.join(OUT, "scenarios_carburant.csv"), index=False)
json.dump(P, open(os.path.join(OUT, "prix_reference.json"), "w"), indent=1)
print(P); pd.set_option("display.width", 220); print(df.to_string(index=False))
