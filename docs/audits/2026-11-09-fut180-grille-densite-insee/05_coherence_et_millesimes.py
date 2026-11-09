"""Rapport §1 et §3 : la classe publiée est-elle retrouvée par la RÈGLE OFFICIELLE appliquée aux parts publiées ?

Règle communale du niveau 1 (Insee, méthode de constitution et DT 2022-18 §1.3 ; Eurostat 2021, étape 2) :
  dense si au moins 50 % de la population vit dans un centre urbain (P1) ;
  sinon intermédiaire si plus de 50 % vit dans un centre ou un cluster urbain (P1 + P2) ;
  sinon rural.
C'est la même règle que l'agrégation supracommunale de la note complémentaire, appliquée ici à la commune.
L'ancienne version de ce script prenait la plus grande des trois parts (idxmax) : ce n'est pas la règle.
"""
import sys, pandas as pd
W = sys.argv[1]
pd.set_option("display.width", 250)
G = pd.read_parquet(f"{W}/work/grille2026.parquet"); G = G[~G.CODGEO.str.startswith("97")].copy()

def regle(p1, p2, ge=True):
    if (p1 >= 50) if ge else (p1 > 50): return 1
    return 2 if p1 + p2 > 50 else 3

for ge in (True, False):
    n = sum(regle(a, b, ge) != d for a, b, d in zip(G.P1, G.P2, G.DENS))
    print(f"discordances avec la règle officielle (seuil dense {'>=' if ge else '>'} 50 %) : {n}")
G["regle"] = [regle(a, b) for a, b in zip(G.P1, G.P2)]
G["par_idxmax"] = G[["P1", "P2", "P3"]].idxmax(axis=1).str[1].astype(int)
G["disc_regle"] = G.regle != G.DENS; G["disc_idxmax"] = G.par_idxmax != G.DENS
print("\nidxmax (ancienne analyse) × règle officielle :\n", pd.crosstab(G.disc_idxmax, G.disc_regle))
print("\nFaux positifs d'idxmax (la règle retrouve la classe) :")
print(G[G.disc_idxmax & ~G.disc_regle][["CODGEO", "LIBGEO", "LIBDENS", "P1", "P2", "P3"]].round(1).to_string())
print("\nDiscordances que seule la règle fait apparaître :")
print(G[~G.disc_idxmax & G.disc_regle][["CODGEO", "LIBGEO", "LIBDENS", "P1", "P2", "P3"]].round(1).to_string())

X = G[G.disc_regle].copy()
def nature(r):
    if r.DENS == 1 and r.P1 < 50: return "a. classée dense, moins de 50 % dans un centre urbain"
    if r.DENS == 2 and r.P1 >= 50: return "b. 50 % ou plus dans un centre urbain, classée intermédiaire"
    marge = abs(r.P1 + r.P2 - 50)
    return "c. bascule urbain/rural à moins de 2 points de 50 %" if marge < 2 else "d. bascule urbain/rural nette (2 points ou plus)"
X["nature"] = X.apply(nature, axis=1)
print("\nDiscordances selon la règle officielle, par nature :\n", X.groupby("nature").agg(communes=("CODGEO", "size"), population=("PMUN23", "sum")))
print(X.sort_values(["nature", "PMUN23"], ascending=[True, False])[["nature", "CODGEO", "LIBGEO", "PMUN23", "LIBDENS7", "P1", "P2", "P3", "regle"]].round(1).to_string())

print("\nCas demandés par la contre-revue :")
for c in ["87075", "29232", "13005", "22278", "2A247"]:
    r = G[G.CODGEO == c].iloc[0]
    print(f"  {r.LIBGEO:15} classe {r.DENS} ({r.LIBDENS7}) | P = {r.P1:.1f} / {r.P2:.1f} / {r.P3:.1f} | règle -> {r.regle} | idxmax -> {r.par_idxmax}")

# Ajustement français documenté (DT 2022-18 §1.4) : 19 communes reclassées de ceinture urbaine à petite ville.
ajust = ["04070", "07010", "22113", "29039", "41194", "45155", "48095", "49328", "56083", "57631", "72154", "77407", "83116", "84019", "85194", "07041", "07078", "07197", "07337"]
print("\n19 communes ajustées (DT 2022-18 §1.4), classe 2026 :", G[G.CODGEO.isin(ajust)].LIBDENS7.value_counts().to_dict(),
      "| parmi les discordances de niveau 1 :", int(X.CODGEO.isin(ajust).sum()))

G5 = pd.read_excel(f"{W}/insee/fichier_diffusion_2025.xlsx", sheet_name=0, header=4, dtype={"CODGEO": str})
G6 = pd.read_parquet(f"{W}/work/grille2026.parquet")
m = G5.merge(G6, on="CODGEO", how="outer", indicator=True, suffixes=("_25", "_26"))
print("\n2025 vs 2026 :", m._merge.value_counts().to_dict(), "| classe 7 postes modifiée :", int((m[m._merge == "both"].DENS7_25 != m[m._merge == "both"].DENS7_26).sum()))
