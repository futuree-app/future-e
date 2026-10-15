#!/usr/bin/env python3
"""01_mobpro.py — Réagrégation indépendante du fichier détail INSEE RP 2022 « Mobilités professionnelles ».

Source : INSEE, RP2022_mobpro.parquet (https://www.insee.fr/fr/statistiques/8589904), 7 388 023 lignes,
dictionnaire varmod_mobpro_2022.csv (même page). Champ : ACTIFS OCCUPÉS de 15 ans ou plus, recensés
dans leur résidence principale. Tous les calculs sont pondérés par IPONDI (consigne INSEE).

Ce que ce n'est PAS : tous les déplacements (achats, école, loisirs), ni la possession automobile des
ménages (VOIT est porté par chaque actif : « part des actifs vivant dans un ménage sans voiture »,
pas « part des ménages sans voiture »).

Usage : .venv-bpe/bin/python 01_mobpro.py <chemin du parquet> <dossier de sortie>
"""
import sys, json, os
import pyarrow.parquet as pq
import pyarrow as pa
import pandas as pd

PARQUET, OUT = sys.argv[1], sys.argv[2]

# Communes étudiées. Raison du choix : La Rochelle ; première couronne de l'unité urbaine (UU 17601)
# au nord, à l'est et au sud ; Châtelaillon-Plage (même UU, gare TER, 13 km) ; Rochefort et Surgères
# (hors UU, villes moyennes avec gare) comme contrepoints.
COMMUNES = {
    "17300": "La Rochelle", "17200": "Lagord", "17291": "Puilboreau", "17028": "Aytré",
    "17274": "Périgny", "17142": "Dompierre-sur-Mer", "17264": "Nieul-sur-Mer",
    "17190": "L'Houmeau", "17010": "Angoulins", "17094": "Châtelaillon-Plage",
    "17420": "Salles-sur-Mer", "17299": "Rochefort", "17434": "Surgères",
}
UU_LR = ["17300", "17200", "17291", "17028", "17274", "17142", "17264", "17190", "17010", "17094", "17420"]
TRANS = {1: "pas_de_transport", 2: "marche", 3: "velo", 4: "deux_roues_mot", 5: "voiture", 6: "tc"}

cols = ["COMMUNE", "ARM", "DCLT", "ILT", "TRANS", "VOIT", "STOCD", "TYPL", "TYPMR", "TP", "IPONDI", "AGEREVQ"]
t = pq.read_table(PARQUET, columns=cols)
df = t.to_pandas()
for c in ["COMMUNE", "ARM", "DCLT", "VOIT", "STOCD", "TYPL", "TYPMR", "AGEREVQ"]:
    df[c] = df[c].astype(str)
df["mode"] = df["TRANS"].map(lambda x: TRANS.get(int(x)) if pd.notna(x) else None)

def shares(g, col, cats=None):
    w = g.groupby(col, observed=True)["IPONDI"].sum()
    tot = w.sum()
    s = (w / tot).round(4).to_dict()
    if cats:
        s = {k: s.get(k, 0.0) for k in cats}
    return s, round(tot)

res = {}
nat = df
res["france"] = {"modes": shares(nat, "mode", list(TRANS.values()))[0]}
for insee, nom in COMMUNES.items():
    g = df[df["COMMUNE"] == insee]
    modes, n = shares(g, "mode", list(TRANS.values()))
    r = {"nom": nom, "actifs_occupes_ponderes": n, "lignes": int(len(g)), "modes": modes}
    # Part voiture SANS « pas de transport » au dénominateur (télétravail/travail à domicile exclus)
    gx = g[g["mode"] != "pas_de_transport"]
    r["part_voiture_parmi_ceux_qui_se_deplacent"] = round(gx.loc[gx["mode"] == "voiture", "IPONDI"].sum() / gx["IPONDI"].sum(), 4)
    # Lieu de travail
    r["travaille_dans_sa_commune"] = round(g.loc[g["ILT"] == 1, "IPONDI"].sum() / g["IPONDI"].sum(), 4)
    # Mode selon que l'on travaille dans sa commune ou non
    for lab, sub in [("dans_commune", g[g["ILT"] == 1]), ("hors_commune", g[g["ILT"] != 1])]:
        r[f"modes_{lab}"] = shares(sub, "mode", list(TRANS.values()))[0]
        r[f"effectif_{lab}"] = round(sub["IPONDI"].sum())
    # Voitures du ménage (porté par l'actif)
    r["voit_du_menage"] = shares(g, "VOIT", ["0", "1", "2", "3", "Z"])[0]
    # Croisement possession × usage : parmi les actifs dont le ménage a >=1 voiture, part qui n'y va PAS en voiture
    mot = g[g["VOIT"].isin(["1", "2", "3"])]
    r["menage_motorise_mais_pas_en_voiture"] = round(mot.loc[mot["mode"] != "voiture", "IPONDI"].sum() / mot["IPONDI"].sum(), 4)
    nomot = g[g["VOIT"] == "0"]
    r["sans_voiture_au_menage_modes"] = shares(nomot, "mode", list(TRANS.values()))[0]
    # Top destinations de travail
    dest = g.groupby("DCLT")["IPONDI"].sum().sort_values(ascending=False)
    r["top_destinations"] = [(k, round(v / g["IPONDI"].sum(), 4)) for k, v in dest.head(6).items()]
    # Statut d'occupation : propriétaires vs locataires (mode voiture et voiture au ménage)
    occ = {}
    for lab, codes in [("proprietaires", ["10"]), ("locataires_prive", ["21", "23"]), ("locataires_hlm", ["22"])]:
        s = g[g["STOCD"].isin(codes)]
        if s["IPONDI"].sum() > 0:
            occ[lab] = {
                "effectif": round(s["IPONDI"].sum()), "lignes": int(len(s)),
                "part_voiture": round(s.loc[s["mode"] == "voiture", "IPONDI"].sum() / s["IPONDI"].sum(), 4),
                "part_velo": round(s.loc[s["mode"] == "velo", "IPONDI"].sum() / s["IPONDI"].sum(), 4),
                "part_menage_sans_voiture": round(s.loc[s["VOIT"] == "0", "IPONDI"].sum() / s["IPONDI"].sum(), 4),
                "part_menage_2voit_plus": round(s.loc[s["VOIT"].isin(["2", "3"]), "IPONDI"].sum() / s["IPONDI"].sum(), 4),
                "travaille_dans_commune": round(s.loc[s["ILT"] == 1, "IPONDI"].sum() / s["IPONDI"].sum(), 4),
            }
    r["par_statut_occupation"] = occ
    # Maison / appartement
    tl = {}
    for lab, code in [("maison", "1"), ("appartement", "2")]:
        s = g[g["TYPL"] == code]
        if s["IPONDI"].sum() > 0:
            tl[lab] = {"effectif": round(s["IPONDI"].sum()),
                       "part_voiture": round(s.loc[s["mode"] == "voiture", "IPONDI"].sum() / s["IPONDI"].sum(), 4),
                       "part_menage_sans_voiture": round(s.loc[s["VOIT"] == "0", "IPONDI"].sum() / s["IPONDI"].sum(), 4)}
    r["par_type_logement"] = tl
    # Couples biactifs (TYPMR 41) : situation des ménages « deux trajets »
    s = g[g["TYPMR"] == "41"]
    r["couples_biactifs"] = {"effectif": round(s["IPONDI"].sum()),
                             "part_voiture": round(s.loc[s["mode"] == "voiture", "IPONDI"].sum() / s["IPONDI"].sum(), 4),
                             "part_menage_2voit_plus": round(s.loc[s["VOIT"].isin(["2", "3"]), "IPONDI"].sum() / s["IPONDI"].sum(), 4)}
    res[insee] = r

# Vue inverse : qui TRAVAILLE à La Rochelle, d'où vient-il, comment ?
w = df[df["DCLT"] == "17300"]
tot = w["IPONDI"].sum()
orig = w.groupby("COMMUNE")["IPONDI"].sum().sort_values(ascending=False)
res["emplois_la_rochelle"] = {
    "actifs_travaillant_a_LR": round(tot),
    "residant_a_LR": round(orig.get("17300", 0) / tot, 4),
    "residant_ailleurs_dans_UU": round(sum(orig.get(c, 0) for c in UU_LR if c != "17300") / tot, 4),
    "residant_hors_UU": round(1 - sum(orig.get(c, 0) for c in UU_LR) / tot, 4),
    "modes_des_entrants": shares(w[w["COMMUNE"] != "17300"], "mode", list(TRANS.values()))[0],
    "top_origines": [(k, round(v / tot, 4)) for k, v in orig.head(12).items()],
}
# Mode des résidents de l'UU hors LR qui vont travailler À La Rochelle, par commune
fl = {}
for c in UU_LR + ["17299", "17434"]:
    if c == "17300":
        continue
    s = df[(df["COMMUNE"] == c) & (df["DCLT"] == "17300")]
    if s["IPONDI"].sum() > 0:
        fl[COMMUNES[c]] = {"effectif": round(s["IPONDI"].sum()), "lignes": int(len(s)),
                           "modes": shares(s, "mode", list(TRANS.values()))[0]}
res["flux_vers_LR_par_origine"] = fl
# Mode des Rochelais selon la destination (dans LR / ailleurs dans UU / hors UU)
g = df[df["COMMUNE"] == "17300"]
dd = {}
for lab, mask in [("LR", g["DCLT"] == "17300"),
                  ("autre_commune_UU", g["DCLT"].isin([c for c in UU_LR if c != "17300"])),
                  ("hors_UU", ~g["DCLT"].isin(UU_LR))]:
    s = g[mask]
    dd[lab] = {"part": round(s["IPONDI"].sum() / g["IPONDI"].sum(), 4), "modes": shares(s, "mode", list(TRANS.values()))[0]}
res["rochelais_par_destination"] = dd

# Comparateur national : où se place La Rochelle parmi les communes de 50 000 à 150 000 hab. (proxy : effectif actifs)
agg = df.groupby("COMMUNE").apply(lambda s: pd.Series({
    "n": s["IPONDI"].sum(),
    "voiture": s.loc[s["mode"] == "voiture", "IPONDI"].sum() / s["IPONDI"].sum(),
    "velo": s.loc[s["mode"] == "velo", "IPONDI"].sum() / s["IPONDI"].sum(),
    "marche": s.loc[s["mode"] == "marche", "IPONDI"].sum() / s["IPONDI"].sum(),
    "tc": s.loc[s["mode"] == "tc", "IPONDI"].sum() / s["IPONDI"].sum(),
    "sans_voit": s.loc[s["VOIT"] == "0", "IPONDI"].sum() / s["IPONDI"].sum(),
}), include_groups=False)
big = agg[(agg["n"] >= 25000) & (agg["n"] <= 80000)].copy()
big.to_csv(os.path.join(OUT, "communes_25k_80k_actifs.csv"))
res["rang_velo_parmi_communes_25k_80k_actifs"] = {
    "n_communes": int(len(big)),
    "rang_LR_velo": int((big["velo"] > big.loc["17300", "velo"]).sum() + 1),
    "rang_LR_voiture_plus_basse": int((big["voiture"] < big.loc["17300", "voiture"]).sum() + 1),
    "top_velo": big.sort_values("velo", ascending=False).head(8)[["velo", "voiture", "tc", "marche"]].round(3).reset_index().values.tolist(),
}

json.dump(res, open(os.path.join(OUT, "mobpro_resultats.json"), "w"), ensure_ascii=False, indent=1)
print("ok")
