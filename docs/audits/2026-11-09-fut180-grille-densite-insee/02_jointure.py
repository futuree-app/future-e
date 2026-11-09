"""Jointure par code Insee : index futur•e × grille (métropole). Rapport §2, couverture et non-appariés."""
import sys, gzip, json, pandas as pd
W = sys.argv[1]
d = json.load(gzip.open(f"{W}/idx/index.json.gz"))
rows = []
for c in d["communes"]:
    comp = ((c.get("nature") or {}).get("composition") or {})
    rows.append(dict(insee=c["insee"], nom=c["nom"], dept=c["dept"], pop=c.get("population"), densite=c.get("densite"),
                     uu=c.get("uu"), hors_uu=c.get("hors_uu"), uu_pop=c.get("uu_pop"), uu_count=c.get("uu_count"),
                     artif=comp.get("artificialise"), agri=comp.get("agricole")))
I = pd.DataFrame(rows)
G = pd.read_parquet(f"{W}/work/grille2026.parquet")
print("DROM écartés :", G.CODGEO.str.startswith("97").sum())
G = G[~G.CODGEO.str.startswith("97")]
print("index", len(I), "| grille métropole", len(G))

def cat(x):
    # Reproduit densityCategory (src/lib/territoire/facts.ts) : 1 500 / 150 hab/km².
    if x is None or pd.isna(x): return "absente"
    return "dense" if x >= 1500 else "intermediaire" if x >= 150 else "peu_dense"

I["cat"] = I.densite.map(cat)
M = I.merge(G, left_on="insee", right_on="CODGEO", how="outer", indicator=True)
print(M._merge.value_counts().to_dict())
print("\nINDEX sans grille :"); print(M[M._merge == "left_only"][["insee", "nom", "pop"]].to_string())
print("\nGRILLE sans index :"); print(M[M._merge == "right_only"][["CODGEO", "LIBGEO", "PMUN23", "LIBDENS7"]].to_string())
B = M[M._merge == "both"].copy()
B["D7"] = B.DENS7.astype(int)
B["g7"] = B.D7.astype(str) + " " + B.LIBDENS7
B.to_parquet(f"{W}/work/both.parquet")
