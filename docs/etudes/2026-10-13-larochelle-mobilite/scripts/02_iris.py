#!/usr/bin/env python3
"""02_iris.py — Différences internes à La Rochelle (et communes voisines) à l'IRIS, INSEE RP 2022.

Sources (téléchargées le 13/10/2026 10:17 UTC) :
  - Activité des résidents 2022, base infracommunale : https://www.insee.fr/fr/statistiques/8647006
    C22_ACTOCC15P_* = exploitation COMPLÉMENTAIRE (mode de transport) ; P22_ACTOCC15P_ILT1 = principale.
  - Logement 2022, base infracommunale : https://www.insee.fr/fr/statistiques/8647012
    P22_RP, P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement de stationnement réservé).
Géographie au 1er janvier 2024. Estimations par sondage (communes >= 10 000 hab. : ~8 %/an cumulés sur
5 ans) : à l'IRIS, effectifs de quelques centaines, précision limitée — arrondir, ne pas classer finement.

Usage : python 02_iris.py <dossier insee> <dossier sortie>
"""
import sys, os, csv
import pandas as pd

D, OUT = sys.argv[1], sys.argv[2]
COMS = ["17300", "17200", "17291", "17028", "17274", "17094"]

act = pd.read_csv(os.path.join(D, "base-ic-activite-residents-2022_csv/base-ic-activite-residents-2022.CSV"), sep=";", dtype=str)
log = pd.read_csv(os.path.join(D, "base-ic-logement-2022_csv/base-ic-logement-2022.CSV"), sep=";", dtype=str)
names = {}
with open(os.path.join(D, "base-ic-activite-residents-2022_csv/meta_base-ic-activite-residents-2022.CSV"), encoding="utf-8") as f:
    for row in csv.reader(f, delimiter=";"):
        if len(row) > 4 and row[0] == "IRIS":
            names[row[3]] = row[4]

def num(df, cols):
    for c in cols:
        df[c] = pd.to_numeric(df[c].str.replace(",", "."), errors="coerce")
    return df

mcols = ["C22_ACTOCC15P", "C22_ACTOCC15P_PAS", "C22_ACTOCC15P_MAR", "C22_ACTOCC15P_VELO", "C22_ACTOCC15P_2ROUESMOT",
         "C22_ACTOCC15P_VOIT", "C22_ACTOCC15P_TCOM", "P22_ACTOCC15P", "P22_ACTOCC15P_ILT1"]
mcols = [c for c in mcols if c in act.columns]
lcols = ["P22_RP", "P22_RP_VOIT1P", "P22_RP_VOIT1", "P22_RP_VOIT2P", "P22_RP_GARL"]
act = num(act[act["COM"].isin(COMS)].copy(), mcols)
log = num(log[log["COM"].isin(COMS)].copy(), lcols)
df = act[["IRIS", "COM", "TYP_IRIS"] + mcols].merge(log[["IRIS"] + lcols], on="IRIS", how="outer")
df["nom"] = df["IRIS"].map(names)

def ratios(d):
    o = pd.DataFrame(index=d.index)
    o["actifs_occ"] = d["C22_ACTOCC15P"].round(0)
    for k, c in [("voiture", "C22_ACTOCC15P_VOIT"), ("velo", "C22_ACTOCC15P_VELO"), ("marche", "C22_ACTOCC15P_MAR"),
                 ("tc", "C22_ACTOCC15P_TCOM"), ("aucun", "C22_ACTOCC15P_PAS")]:
        o[k] = (d[c] / d["C22_ACTOCC15P"]).round(3)
    o["travaille_commune"] = (d["P22_ACTOCC15P_ILT1"] / d["P22_ACTOCC15P"]).round(3)
    o["menages"] = d["P22_RP"].round(0)
    o["menages_sans_voiture"] = (1 - d["P22_RP_VOIT1P"] / d["P22_RP"]).round(3)
    o["menages_2voit_plus"] = (d["P22_RP_VOIT2P"] / d["P22_RP"]).round(3)
    o["menages_avec_parking"] = (d["P22_RP_GARL"] / d["P22_RP"]).round(3)
    return o

out = pd.concat([df[["IRIS", "COM", "TYP_IRIS", "nom"]], ratios(df)], axis=1).sort_values(["COM", "voiture"])
out.to_csv(os.path.join(OUT, "iris_mobilite_2022.csv"), index=False)

# Agrégats communaux recalculés depuis l'IRIS (somme des effectifs)
g = df.groupby("COM")[mcols + lcols].sum()
gc = ratios(g)
gc.to_csv(os.path.join(OUT, "communes_depuis_iris_2022.csv"))
print(gc.to_string())
print()
lr = out[out["COM"] == "17300"]
print(lr.to_string(index=False))
