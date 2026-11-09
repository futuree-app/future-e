"""Rapport §2 (répartition de nos catégories), §3 (panel) et §6 (rural_peri_urbain de comparateur-vie.ts)."""
import sys, pandas as pd
W = sys.argv[1]; B = pd.read_parquet(f"{W}/work/both.parquet")
pd.set_option("display.width", 300); pd.set_option("display.max_columns", 30)
print("« intermédiaire » chez nous :\n", B[B["cat"] == "intermediaire"].g7.value_counts().sort_index())
print("« peu dense » chez nous :", (B["cat"] == "peu_dense").sum(), "communes\n", B[B["cat"] == "peu_dense"].g7.value_counts().sort_index())
# Panel par CODE (deux Brassy existent : on ne cherche pas par nom).
panel = ["2B096", "28199", "68078", "02100", "17094", "28085", "92044", "59090", "34301", "05082", "44212", "84007", "13004", "29232"]
print("\nPanel\n", B[B.insee.isin(panel)][["insee", "nom", "PMUN23", "densite", "cat", "g7", "P1", "P2", "P3", "LIBDENS", "hors_uu", "uu"]].round(1).to_string())
print("\nPLM dans la grille :\n", pd.read_parquet(f"{W}/work/grille2026.parquet").query("CODGEO in ['75056','69123','13055']")[["CODGEO", "LIBGEO", "LIBDENS7"]])
# comparateur-vie.ts l. 817 : densite >= 1500 sinon peuDense -> catégorie rural_peri_urbain.
t = B[(B.D7 <= 2) & (B.densite < 1500)]
print("\nUrbaines Insee (classes 1-2) sous 1 500 hab/km², donc rural_peri_urbain :", len(t), "communes,", int(t.PMUN23.sum()), "hab.")
