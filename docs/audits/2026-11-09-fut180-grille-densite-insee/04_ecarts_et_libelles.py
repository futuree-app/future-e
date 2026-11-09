"""Rapport §2 (groupes éditoriaux A-F), §3 (portée des seuils de population) et §6 (unités urbaines, FUT-176).

Les groupes A à F sont une CONVENTION DE CE RAPPORT : six croisements « catégorie futur•e × classe Insee » où la
classe Insee dit quelque chose que notre libellé ne dit pas. Leur total n'est pas un taux officiel de reclassement.
"""
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
af = B.grp.str[0].isin(list("ABCDEF")); sans_e = B.grp.str[0].isin(list("ABCDF"))
tot_n, tot_p = len(B), B.PMUN23.sum()
print(f"\nTotal A-F (convention du rapport) : {af.sum()} communes = {af.sum()/tot_n*100:.1f} % ; population {B[af].PMUN23.sum()/tot_p*100:.1f} %")
print(f"Variante sans E (désaccord de vocabulaire seulement) : {sans_e.sum()} communes = {sans_e.sum()/tot_n*100:.1f} % ; population {B[sans_e].PMUN23.sum()/tot_p*100:.1f} %")
for g, sub in B.groupby("grp"):
    if g.startswith("Y"): continue
    print("\n##", g); print(sub.sort_values("PMUN23", ascending=False).head(12)[["insee", "nom", "PMUN23", "densite", "g7", "P1", "P2", "P3", "hors_uu"]].round(1).to_string())

print("\n## Portée des seuils de population : ils portent sur les TACHES de carreaux, pas sur la commune")
print("(DT Insee 2022-18 §1.2 ; Eurostat 2021 §7.1.3). Population COMMUNALE par classe :")
print(B.groupby("g7").PMUN23.describe(percentiles=[.1, .5, .9]).round(0)[["count", "min", "10%", "50%", "90%", "max"]])
for code, lab, bas, haut in [(1, "grands centres urbains (centre >= 50 000)", 50000, None), (2, "centres urbains intermédiaires (tache dense 5 000-49 999)", 5000, 50000),
                             (3, "petites villes (tache semi-dense >= 5 000)", 5000, 50000), (4, "ceintures urbaines (cellules d'une tache >= 5 000)", 5000, 50000),
                             (5, "bourgs ruraux (tache rurale 500-4 999)", 500, 5000)]:
    s = B[B.D7 == code]
    sous = (s.PMUN23 < bas).sum(); dessus = (s.PMUN23 >= haut).sum() if haut else 0
    print(f"{lab} : {len(s)} communes ; sous {bas} hab. : {sous} ; à {haut or '-'} hab. ou plus : {dessus}")
print("rural à habitat dispersé >= 500 hab :", ((B.D7 == 6) & (B.PMUN23 >= 500)).sum(), "| >= 2000 :", ((B.D7 == 6) & (B.PMUN23 >= 2000)).sum())

print("\n## Unités urbaines (FUT-176)")
if B.uu_statut.notna().any():
    src = "uu_statut (statut officiel Insee)"
    en_uu = B.uu_statut.isin(["C", "B", "I"]); hors = B.uu_statut == "H"; inconnu = B.uu_statut.isna(); isolee = B.uu_statut == "I"
else:
    src = "hors_uu (index d'avant FUT-176 : absent du référentiel = hors UU, statut perdu)"
    en_uu = B.hors_uu == False; hors = B.hors_uu == True; inconnu = B.hors_uu.isna(); isolee = en_uu & (B.uu_count == 1)
print("source du statut :", src)
print("en UU :", en_uu.sum(), "| hors UU :", hors.sum(), "| statut inconnu :", inconnu.sum())
print("en UU, < 1000 hab (pop. index) :", (en_uu & (B["pop"] < 1000)).sum(), "| dont rural Insee :", (en_uu & (B["pop"] < 1000) & (B.D7 >= 5)).sum())
print("en UU mais rural Insee (5-7) :", (en_uu & (B.D7 >= 5)).sum())
print("hors UU mais urbain Insee (1-4) :", (hors & (B.D7 <= 4)).sum())
print("villes isolées par classe :\n", B[isolee].g7.value_counts())
if B.uu_statut.notna().any():
    # Règle « ville » de FUT-176 (statut-urbain.ts, peutDireVille) : ville-centre ou ville isolée ET >= 2 000 hab.
    # La population est celle de l'index (`pop`), comme dans le produit ; peut différer de PMUN23.
    ville = B.uu_statut.isin(["C", "I"]) & (B["pop"] >= 2000)
    print("\n« ville » selon la règle FUT-176 :", int(ville.sum()), "communes ; classe Insee :\n", B[ville].g7.value_counts().sort_index())
    print("dont rurales pour l'Insee (5-7) :", int((ville & (B.D7 >= 5)).sum()))
    print(B[ville & (B.D7 >= 5)].sort_values("PMUN23", ascending=False).head(8)[["nom", "PMUN23", "uu_statut", "g7"]].to_string(index=False))
else:
    print("\n(règle « ville » de FUT-176 non évaluable : index sans uu_statut)")
