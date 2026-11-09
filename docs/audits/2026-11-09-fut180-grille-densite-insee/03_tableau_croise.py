"""Rapport §2 : distribution nationale, tableau croisé avec nos catégories, densité absente chez nous."""
import sys, pandas as pd
W = sys.argv[1]; B = pd.read_parquet(f"{W}/work/both.parquet")
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 20)
p = B.groupby("g7").PMUN23.sum()
print(pd.DataFrame({"communes": B.g7.value_counts().sort_index(), "pop_%": (p / p.sum() * 100).round(1)}))
ct = pd.crosstab(B.g7, B["cat"])[["dense", "intermediaire", "peu_dense", "absente"]]; ct["Total"] = ct.sum(axis=1)
print("\nTableau croisé (communes)\n", ct)
print("\nTableau croisé (millions d'habitants)\n", (pd.crosstab(B.g7, B["cat"], values=B.PMUN23, aggfunc="sum") / 1e6).round(2))
print("\nGrille 3 postes × nos catégories (base du chiffre 3 026)\n", pd.crosstab(B.LIBDENS, B["cat"]))
print("\nDensité absente chez nous, classée par la grille\n", B[B["cat"] == "absente"][["insee", "nom", "PMUN23", "g7"]].to_string())
print("\nDensité hab/km² par classe\n", B.groupby("g7").densite.describe(percentiles=[.1, .5, .9]).round(0))
