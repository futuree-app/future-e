"""Lit la feuille « Maille communale » du fichier Insee 2026 (en-têtes techniques en ligne 5) vers un parquet."""
import sys, pandas as pd
W = sys.argv[1]
g = pd.read_excel(f"{W}/insee/fichier_diffusion_2026.xlsx", sheet_name="Maille communale", header=4, dtype={"CODGEO": str})
g.to_parquet(f"{W}/work/grille2026.parquet")
print("grille :", g.shape, "| classes 7 postes :", g.DENS7.value_counts().sort_index().to_dict())
