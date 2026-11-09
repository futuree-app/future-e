"""Rapport §2 (groupes A-F), §3 (risques de libellé) et §6 (croisement unités urbaines, FUT-176)."""
import sys, pandas as pd
W = sys.argv[1]; B = pd.read_parquet(f"{W}/work/both.parquet")
pd.set_option("display.width", 300); pd.set_option("display.max_columns", 30)

def grp(r):
    c, d = r["cat"], r["D7"]
    if c == "absente": return "Z absente chez nous"
    if c == "peu_dense" and d <= 4: return "A peu dense -> urbain Insee"
    if c == "peu_dense" and d == 5: return "B peu dense -> bourg rural"
    if c == "intermediaire" and d >= 6: return "C intermédiaire -> rural dispersé"
    if c == "intermediaire" and d == 1: return "D intermédiaire -> grand centre urbain"
    if c == "dense" and d >= 2: return "E dense -> pas grand centre"
    if c == "intermediaire" and d == 5: return "F intermédiaire -> bourg rural"
    return "Y cohérent"

B["grp"] = B.apply(grp, axis=1)
t = B.groupby("grp").agg(n=("insee", "size"), pop=("PMUN23", "sum"))
t["pct_n"] = (t.n / t.n.sum() * 100).round(1); t["pct_pop"] = (t["pop"] / t["pop"].sum() * 100).round(1); print(t)
for g, sub in B.groupby("grp"):
    if g.startswith("Y"): continue
    print("\n##", g); print(sub.sort_values("PMUN23", ascending=False).head(12)[["insee", "nom", "PMUN23", "densite", "g7", "P1", "P2", "P3", "hors_uu"]].round(1).to_string())
print("\n## Seuils de population Insee confrontés à la population COMMUNALE")
for code, lab, seuil in [(4, "ceintures < 5000", 5000), (3, "petites villes < 5000", 5000), (2, "centres interm. < 5000", 5000), (1, "grands centres < 50000", 50000), (5, "bourgs < 500", 500)]:
    print(lab, ((B.D7 == code) & (B.PMUN23 < seuil)).sum(), "/", (B.D7 == code).sum())
print("dispersé >= 500 hab :", ((B.D7 == 6) & (B.PMUN23 >= 500)).sum(), "| >= 2000 :", ((B.D7 == 6) & (B.PMUN23 >= 2000)).sum())
print("\n## Unités urbaines (FUT-176)")
print("en UU, < 1000 hab :", ((B.hors_uu == False) & (B["pop"] < 1000)).sum(), "| dont rural Insee :", ((B.hors_uu == False) & (B["pop"] < 1000) & (B.D7 >= 5)).sum())
print("hors UU mais urbain Insee :", ((B.hors_uu == True) & (B.D7 <= 4)).sum())
print("villes isolées UU par classe :\n", B[(B.hors_uu == False) & (B.uu_count == 1)].g7.value_counts())
