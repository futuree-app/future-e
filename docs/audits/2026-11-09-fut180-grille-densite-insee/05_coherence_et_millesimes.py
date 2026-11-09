"""Rapport §1 et §3 : parts P1/P2/P3 contradictoires avec la classe ; fichiers 2025 et 2026 comparés."""
import sys, pandas as pd
W = sys.argv[1]; B = pd.read_parquet(f"{W}/work/both.parquet")
pd.set_option("display.width", 250)
B["dom"] = B[["P1", "P2", "P3"]].idxmax(axis=1)
B["coh"] = B.apply(lambda r: r["dom"] == {1: "P1", 2: "P2", 3: "P3"}[int(r["DENS"])], axis=1)
print(pd.crosstab(B.LIBDENS, B.dom))
inc = B[~B.coh]; print("classe contredite par la part dominante :", len(inc), "communes,", int(inc.PMUN23.sum()), "hab.")
print(inc.sort_values("PMUN23", ascending=False).head(25)[["nom", "PMUN23", "LIBDENS", "g7", "P1", "P2", "P3"]].round(1).to_string())
G5 = pd.read_excel(f"{W}/insee/fichier_diffusion_2025.xlsx", sheet_name=0, header=4, dtype={"CODGEO": str})
G6 = pd.read_parquet(f"{W}/work/grille2026.parquet")
m = G5.merge(G6, on="CODGEO", how="outer", indicator=True, suffixes=("_25", "_26"))
print("\n2025 vs 2026 :", m._merge.value_counts().to_dict(), "| classe 7 postes modifiée :", int((m[m._merge == "both"].DENS7_25 != m[m._merge == "both"].DENS7_26).sum()))
