#!/usr/bin/env python3
"""10_incertitude.py — Intervalles approximatifs (95 %) des proportions MOBPRO citables.
Méthode : n effectif = (Σw)²/Σw² (effet des poids, Kish), divisé par 1,5 pour l'effet de grappe (actifs d'un
même ménage ; non identifiables dans le fichier). Intervalle de Wilson. C'est un ordre de grandeur de la
précision, pas une variance officielle INSEE. Contrôle aussi l'égalité avec data/comparateur-index.json.gz.
Usage : python 10_incertitude.py <parquet> <index.json.gz> <resultats>"""
import sys, os, json, gzip, math
import pyarrow.parquet as pq
import pandas as pd
P, IDX, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
C = ["17300", "17200", "17291", "17028", "17274", "17094"]
t = pq.read_table(P, columns=["COMMUNE", "DCLT", "TRANS", "VOIT", "STOCD", "IPONDI"], filters=[("COMMUNE", "in", C)]).to_pandas()
for c in ["COMMUNE", "DCLT", "VOIT", "STOCD"]:
    t[c] = t[c].astype(str)
def est(sub, cond, label):
    w = sub["IPONDI"]; p = float((w * cond).sum() / w.sum())
    neff = (w.sum() ** 2) / (w ** 2).sum() / 1.5; z = 1.96
    d = 1 + z * z / neff; c = (p + z * z / (2 * neff)) / d; h = z * math.sqrt(p * (1 - p) / neff + z * z / (4 * neff * neff)) / d
    return {"indicateur": label, "p": round(p, 3), "bas": round(c - h, 3), "haut": round(c + h, 3), "lignes": len(sub), "n_eff": round(neff)}
R = []
lr = t[t.COMMUNE == "17300"]
R.append(est(lr, lr.TRANS == 5, "La Rochelle : actifs allant travailler en voiture"))
R.append(est(lr, lr.TRANS == 3, "La Rochelle : à vélo"))
R.append(est(lr, lr.VOIT == "0", "La Rochelle : actifs d'un ménage sans voiture"))
m = lr[lr.VOIT.isin(["1", "2", "3"])]
R.append(est(m, m.TRANS != 5, "La Rochelle : ménage motorisé mais pas en voiture au travail"))
s = lr[lr.DCLT == "17300"]; R.append(est(s, s.TRANS == 5, "Rochelais travaillant à La Rochelle : voiture"))
s = lr[lr.DCLT.isin(["17274", "17028", "17200", "17291"])]; R.append(est(s, s.TRANS == 5, "Rochelais travaillant à Périgny/Aytré/Lagord/Puilboreau : voiture"))
for k, lab in [("10", "propriétaires"), ("21", "locataires privé vide")]:
    s = lr[lr.STOCD == k]
    R.append(est(s, s.TRANS == 5, f"La Rochelle, {lab} : voiture"))
    R.append(est(s, s.TRANS == 3, f"La Rochelle, {lab} : vélo"))
    R.append(est(s, s.VOIT == "0", f"La Rochelle, {lab} : ménage sans voiture"))
s = lr[lr.STOCD == "22"]; R.append(est(s, s.TRANS == 5, "La Rochelle, locataires HLM : voiture"))
for c, nom in [("17200", "Lagord"), ("17291", "Puilboreau"), ("17274", "Périgny"), ("17028", "Aytré")]:
    s = t[(t.COMMUNE == c) & (t.DCLT == "17300")]
    R.append(est(s, s.TRANS == 3, f"{nom} → La Rochelle : vélo"))
    R.append(est(s, s.TRANS == 5, f"{nom} → La Rochelle : voiture"))
df = pd.DataFrame(R); df.to_csv(os.path.join(OUT, "incertitudes_mobpro.csv"), index=False)
pd.set_option("display.width", 200); print(df.to_string(index=False))
idx = {c["insee"]: c.get("mobilite") for c in json.load(gzip.open(IDX))["communes"] if c["insee"] in C}
chk = {c: (idx[c]["part_voiture"], round(float((t[t.COMMUNE == c].IPONDI * (t[t.COMMUNE == c].TRANS == 5)).sum() / t[t.COMMUNE == c].IPONDI.sum()), 4)) for c in C}
print("index vs recalcul :", chk)
