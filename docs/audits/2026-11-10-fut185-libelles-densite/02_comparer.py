"""FUT-185 · Effets nationaux avant/après, à partir des sorties de 01_rejouer.mts.

Usage : python3 -I 02_comparer.py <avant.jsonl> <apres.jsonl> <both.parquet>

<both.parquet> : jointure index × grille communale de densité Insee 2025 produite par l'audit FUT-180
(branche docs/fut-180-grille-densite-insee, d9f83ad7 : 00_preparer.sh puis 02_jointure.py, fichier
<dossier>/work/both.parquet). La grille sert UNIQUEMENT à découper les résultats (urbain 1-4 / rural 5-7) :
aucun code de FUT-185 ne la lit.

Tout nombre compte des communes pour lesquelles un texte SERAIT produit si un lecteur les saisit, pas des
affichages mesurés.
"""
import sys, json
import pandas as pd

pd.set_option("display.width", 250)
pd.set_option("display.max_colwidth", 140)
avant_p, apres_p, both_p = sys.argv[1:4]


def lire(p):
    return pd.DataFrame([json.loads(l) for l in open(p, encoding="utf-8")]).set_index("insee")


AV, AP = lire(avant_p), lire(apres_p)
assert AV.index.equals(AP.index), "les deux sorties ne portent pas les mêmes communes"
B = pd.read_parquet(both_p).set_index("insee")[["D7", "g7", "PMUN23", "densite"]]
G = AV[["nom"]].join(B, how="left")
peu_dense = G.densite.notna() & (G.densite < 1500)
PERIMETRES = {
    "France (index)": pd.Series(True, index=G.index),
    "urbaines Insee 1-4, < 1 500 hab/km²": G.D7.le(4) & peu_dense,
    "rurales Insee 5-7": G.D7.ge(5),
}
print(f"communes de l'index : {len(G)} ; appariées à la grille : {int(G.D7.notna().sum())}")
for k, m in PERIMETRES.items():
    print(f"  {k} : {int(m.sum())} communes, {int(G.loc[m, 'PMUN23'].fillna(0).sum()):,} hab.".replace(",", " "))

MESURES = [
    ("catégorie rural_peri_urbain (index)", lambda D: D.cats_index.map(lambda c: "rural_peri_urbain" in c)),
    ("catégorie rural_peri_urbain (vue par l'accueil, table manuelle comprise)", lambda D: D.cats.map(lambda c: "rural_peri_urbain" in c)),
    ("catégorie periurbain_dependance_auto (index)", lambda D: D.cats_index.map(lambda c: "periurbain_dependance_auto" in c)),
    ("accroche : « dépendance à la voiture »", lambda D: D.hero.str.contains("voiture")),
    ("intro des questions : « dépendance à la voiture »", lambda D: D.intro.str.contains("voiture")),
    ("état vide : « déplacements »", lambda D: D.vide.str.contains("déplacements")),
    ("carte Mobilité : « dépend largement de la voiture »", lambda D: D.mob_fait.fillna("").str.contains("dépend largement")),
    ("carte Mobilité : « transports et courtes distances »", lambda D: D.mob_fait.fillna("").str.contains("courtes distances")),
    ("carte Mobilité sourcée MOBPRO sans lire la mesure", lambda D: D.mob_source.fillna("").str.contains("MOBPRO") & ~D.mob_valeur.notna()),
    ("carte Mobilité portant la part voiture mesurée", lambda D: D.mob_valeur.notna()),
    ("aucune carte Mobilité", lambda D: D.mob_fait.isna()),
    ("question quitter_ville (« Quitter la ville pour X ? »)", lambda D: D.questions.map(lambda q: "quitter_ville" in q)),
    ("question acheter_rural (« S'installer à X ? »)", lambda D: D.questions.map(lambda q: "acheter_rural" in q)),
    ("question mobilite_fragile (« … repose-t-il trop sur la voiture ? »)", lambda D: D.questions.map(lambda q: "mobilite_fragile" in q)),
    ("question voiture_electrique", lambda D: D.questions.map(lambda q: "voiture_electrique" in q)),
    ("intro : « vie agricole » (rural_agricole, hors périmètre)", lambda D: D.intro.str.contains("vie agricole")),
    ("carte Nature : « espaces agricoles et nature rythment » (hors périmètre)", lambda D: D.nature_fait.fillna("").str.contains("espaces agricoles")),
]
for nom_p, m in PERIMETRES.items():
    print(f"\n### {nom_p} ({int(m.sum())} communes)")
    rows = []
    for lib, f in MESURES:
        a, b = f(AV)[m], f(AP)[m]
        rows.append({"mesure": lib, "avant": int(a.sum()), "après": int(b.sum()),
                     "hab. avant": int(G.loc[m & f(AV), "PMUN23"].fillna(0).sum()),
                     "hab. après": int(G.loc[m & f(AP), "PMUN23"].fillna(0).sum())})
    print(pd.DataFrame(rows).to_string(index=False))

print("\n### Changements de texte et de questions (France)")
for col in ["hero", "intro", "vide", "mob_fait", "nature_fait"]:
    print(f"  {col} modifié : {int((AV[col].fillna('∅') != AP[col].fillna('∅')).sum())} communes")
qa, qb = AV.questions.map(tuple), AP.questions.map(tuple)
print(f"  liste des 4 questions modifiée : {int((qa != qb).sum())} communes ; ensemble modifié : {int((qa.map(set) != qb.map(set)).sum())}")
print(f"  type d'ambiance Territoire (snapshot) modifié : {int((AV.mood != AP.mood).sum())} communes")
print(f"  catégories index modifiées autrement que par le retrait de rural_peri_urbain : "
      f"{int((AV.cats_index.map(lambda c: sorted(set(c) - {'rural_peri_urbain'})) != AP.cats_index.map(sorted)).sum())}")

def flux(a, b):
    ent = pd.Series([x for A_, B_ in zip(a, b) for x in set(B_) - set(A_)]).value_counts()
    sor = pd.Series([x for A_, B_ in zip(a, b) for x in set(A_) - set(B_)]).value_counts()
    return pd.DataFrame({"sorties": sor, "entrées": ent}).fillna(0).astype(int).sort_values("sorties", ascending=False)
print("\nQuestions sorties / entrées dans les 4 affichées (France) :")
print(flux(AV.questions, AP.questions).to_string())
m = PERIMETRES["rurales Insee 5-7"]
print("\nQuestions sorties / entrées (rurales Insee 5-7) :")
print(flux(AV.questions[m], AP.questions[m]).to_string())

print("\n### 290 cartes « voiture » restantes au contrefactuel FUT-180 : la catégorie montagne")
U = PERIMETRES["urbaines Insee 1-4, < 1 500 hab/km²"]
mont = U & AV.cats_index.map(lambda c: "montagne" in c) & AV.mob_fait.fillna("").str.contains("dépend largement")
print(f"  urbaines 1-4 peu denses, montagne, carte « dépend largement » avant : {int(mont.sum())} ; après : "
      f"{int((mont & AP.mob_fait.fillna('').str.contains('dépend largement')).sum())}")
monts = AV.cats_index.map(lambda c: "montagne" in c)
print(f"  toutes communes montagne : {int(monts.sum())} ; carte « dépend largement » avant {int((monts & AV.mob_fait.fillna('').str.contains('dépend largement')).sum())}, après {int((monts & AP.mob_fait.fillna('').str.contains('dépend largement')).sum())}")

print("\n### Part voiture et percentile (mesure MOBPRO de l'index)")
pv = AV.part_voiture.dropna()
print(f"  communes mesurées : {len(pv)} ; médiane {pv.median():.3f} ; "
      f"part minimale au 60e percentile (dependance >= 60) : {AV.loc[AV.dependance >= 60, 'part_voiture'].min():.4f}")
dense_gate = (~peu_dense) & G.densite.notna() & (AV.dependance >= 60)
print(f"  communes denses (>= 1 500) au 60e percentile ou plus, que la garde peuDense exclut : {int(dense_gate.sum())}")

print("\n### Panel")
PANEL = ["30189", "13001", "84007", "68066", "29232", "18033", "79191", "85191", "49301", "17094",
         "2B096", "68078", "74056", "05023", "38185", "73065", "02104", "28199", "05082", "12202", "31555"]
for i in PANEL:
    if i not in AV.index:
        print(f"{i} absent de l'index"); continue
    a, b = AV.loc[i], AP.loc[i]
    print(f"\n{a.nom} ({i}) · grille {G.loc[i, 'g7']} · {G.loc[i, 'densite']} hab/km² · part voiture {a.part_voiture} (pct {a.dependance}){' · TABLE MANUELLE' if a.manuelle else ''}")
    print(f"  catégories : {sorted(a.cats)} -> {sorted(b.cats)}")
    for col in ["hero", "intro", "vide", "mob_fait"]:
        if a[col] != b[col]:
            print(f"  {col} AVANT : {a[col]}\n  {col} APRÈS : {b[col]}")
        else:
            print(f"  {col} (inchangé) : {a[col]}")
    print(f"  questions : {a.questions} -> {b.questions}")
