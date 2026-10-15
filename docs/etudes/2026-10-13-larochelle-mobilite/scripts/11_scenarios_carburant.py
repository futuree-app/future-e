#!/usr/bin/env python3
"""11_scenarios_carburant.py — Scénarios de surcoût de CARBURANT pour un véhicule qui fait un trajet domicile-travail,
à 5, 15 et 35 km aller. Les distances ne sont attribuées à aucune commune (kilométrages routiers non vérifiés, cf. 2.8).

Formule : km aller × 2 × jours de trajet par an × (L/100 km ÷ 100) × variation du prix au litre.
Hypothèses (affichées, modifiables) : 200 jours de trajet par an ; 6 L/100 km (sensibilité 5 et 7,5) ;
variation : +0,75 €/L gazole et +0,50 €/L SP95-E10, arrondis des deux contrôles de 07 et 13
(différence des médianes : +0,734 et +0,498 ; médiane des écarts sur les mêmes stations : +0,747 et +0,520).
Prix d'octobre 2026 pour le budget : médianes locales de la semaine du 5/10/2026 (2,288 et 2,129 €/L).
Carburant seulement : ni achat, ni assurance, ni entretien, ni stationnement. Aucune mesure de la réaction
des habitants : les pratiques (recensement 2022) et les prix (2025-2026) portent sur des périodes différentes.
Usage : python 11_scenarios_carburant.py <resultats>"""
import sys, os, json
import pandas as pd
OUT = sys.argv[1]
DAYS, CONS, CONS_LO, CONS_HI = 200, 6.0, 5.0, 7.5
HAUSSE = {"Gazole": 0.75, "E10": 0.50}
PRIX_OCT26 = {"Gazole": 2.288, "E10": 2.129}
rows = []
for km in (5, 15, 35):
    for c in ("Gazole", "E10"):
        L = 2 * km * DAYS * CONS / 100
        rows.append({"km_aller": km, "carburant": c, "km_an": 2 * km * DAYS, "litres_an": round(L),
                     "surcout_an_eur": round(L * HAUSSE[c], -1),
                     "surcout_conso_5_a_7_5_eur": f"{round(2*km*DAYS*CONS_LO/100*HAUSSE[c], -1):.0f} à {round(2*km*DAYS*CONS_HI/100*HAUSSE[c], -1):.0f}",
                     "budget_carburant_prix_oct2026_eur": round(L * PRIX_OCT26[c], -1)})
df = pd.DataFrame(rows)
df.to_csv(os.path.join(OUT, "scenarios_carburant.csv"), index=False)
json.dump({"hypotheses": {"jours": DAYS, "l_100km": CONS, "hausse_eur_l": HAUSSE, "prix_oct2026": PRIX_OCT26}},
          open(os.path.join(OUT, "prix_reference.json"), "w"), indent=1)
print(df.to_string(index=False))
