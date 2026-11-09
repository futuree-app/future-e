"""Rapport §6 : communes URBAINES pour l'Insee (classes 1 à 4) sous 1 500 hab/km², et ce que l'accueil leur affiche.

Deux nombres distincts :
  - le PÉRIMÈTRE : communes urbaines Insee que `comparateur-vie.ts` (l. 817-818) range en `peuDense`, d'où
    `rural_peri_urbain` ;
  - les TEXTES : ce que produisent réellement les fonctions de l'accueil pour ces communes (07_accueil_textes.mts,
    vrai code). Une phrase est IMPUTABLE à la règle de densité si elle disparaît quand on retire les catégories
    que seul `peuDense` émet.
Ce sont des communes pour lesquelles le texte serait produit si un lecteur les saisit, pas des affichages mesurés.
"""
import sys, json, pandas as pd
W = sys.argv[1]
pd.set_option("display.width", 250)
B = pd.read_parquet(f"{W}/work/both.parquet")
A = pd.DataFrame([json.loads(l) for l in open(f"{W}/work/accueil.jsonl", encoding="utf-8")])
sans = pd.json_normalize(A.pop("sans_peu_dense")).add_prefix("sans_")
A = pd.concat([A, sans], axis=1)
M = B.merge(A, on="insee", how="left")
assert M.cats.notna().all(), "une commune appariée n'a pas été évaluée par 07"

U = M[(M.D7 <= 4) & (M.densite < 1500)]
print(f"PÉRIMÈTRE : urbaines Insee (1-4) sous 1 500 hab/km² : {len(U)} communes, {int(U.PMUN23.sum()):,} hab.".replace(",", " "))
print("  dont classes 1-2 (ancien décompte) :", int((U.D7 <= 2).sum()), "communes,", f"{int(U[U.D7 <= 2].PMUN23.sum()):,}".replace(",", " "), "hab.")
print("  par classe :", U.g7.value_counts().sort_index().to_dict())
print("  portent rural_peri_urbain :", int(U.rural_peri_urbain.sum()))

TEXTES = [("hero_voiture", "accroche (hero) : « dépendance à la voiture »"),
          ("intro_voiture", "intro des questions : « dépendance à la voiture »"),
          ("vide_deplacements", "état vide : « déplacements »"),
          ("carte_voiture", "carte Mobilité : « le quotidien dépend largement de la voiture »")]
lignes = []
for col, lib in TEXTES:
    affiche = U[col]; imputable = U[col] & ~U[f"sans_{col}"]
    lignes.append({"texte": lib, "communes": int(affiche.sum()), "habitants": int(U[affiche].PMUN23.sum()),
                   "imputables à la densité": int(imputable.sum()), "habitants imputables": int(U[imputable].PMUN23.sum())})
print(pd.DataFrame(lignes).to_string(index=False))
au_moins_un = U[[c for c, _ in TEXTES if c != "vide_deplacements"]].any(axis=1)
au_moins_un_imp = pd.concat([U[c] & ~U[f"sans_{c}"] for c, _ in TEXTES if c != "vide_deplacements"], axis=1).any(axis=1)
print(f"au moins une phrase « voiture » : {int(au_moins_un.sum())} communes ; imputable à la densité : {int(au_moins_un_imp.sum())}")
print("carte Mobilité présente dans l'aperçu :", int(U.carte_mobilite_affichee.sum()), "/", len(U))

print("\nPourquoi l'accroche ne parle pas toujours de voiture (premier cas qui passe avant, recits.ts getHeroCopy) :")
def premier(c):
    for k in ["littoral", "montagne", "urbain_dense_sud", "mediterranee"]:
        if k in c: return k
    return "aucun (rural_peri_urbain atteint)"
print(U.cats.map(premier).value_counts().to_string())

print("\nExemples (plus peuplées) :")
cols = ["nom", "PMUN23", "densite", "g7", "hero_voiture", "intro_voiture", "carte_voiture", "sans_carte_voiture"]
print(U.sort_values("PMUN23", ascending=False).head(15)[cols].round(0).to_string(index=False))
