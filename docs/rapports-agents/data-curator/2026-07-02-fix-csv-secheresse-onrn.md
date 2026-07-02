# Correction du CSV sécheresse ONRN (coût moyen) : de 93 % à 100 %

> 2026-07-02, fin de journée. Suite opérationnelle du rapport d'évaluation
> `2026-07-02-sinistralite-onrn-ccr.md` (verdict DIFFÉRER, périmètre admis = coût moyen +
> fréquence sécheresse). Le porteur a décidé d'avancer l'intégration au module Logement. Un
> agent précédent avait entrepris de corriger le fichier coût moyen sécheresse mais s'est fait
> couper (limite de tokens sur un autre compte) à ~93 % de couverture, sans persister son
> travail. Cette note reprend, atteint 100 %, et documente la méthode pour audit.

## Le problème (un seul fichier, une seule feuille)

Source : page ONRN de Géorisques (Observatoire National des Risques Naturels), fichiers
sécheresse par commune, millésime 2025, période 1995-2021.

- **`ONRN_CoutMoyen_SECH_9521.xlsx`, feuille « Coût moy. sinistres »** est **corrompue** :
  les colonnes B (Commune) + C (Coût moyen) ont été triées **ensemble par INSEE décroissant**,
  tandis que la colonne A (Code INSEE) est restée en **INSEE croissant**. Résultat : le code
  INSEE de chaque ligne ne pointe plus vers le bon (nom, coût). Exemple : ligne 2 = `01001`
  accolé à « Wy-dit-Joli-Village » (qui est en réalité `95690`).
- **Les autres feuilles / fichiers sont sains** : « Représentativité » (dans le même fichier),
  `ONRN_Frequence_SECH_9521.xlsx`, `onrn_sp_sech.xlsx` ont l'appariement INSEE↔nom correct
  (vérifié : 0 mismatch sur 34 839 lignes chacun). C'est cohérent avec ce qu'avait constaté le
  porteur (« un seul fichier a ça, les autres étaient bons »).

Pourquoi 93 % / 7 % : une jointure naïve par **nom** répare 89 % des communes (noms uniques),
mais échoue sur les **homonymes** (1457 noms partagés → 3721 communes, 10,6 %) : « Saint-Just »,
« Sainte-Croix », « Villeneuve »… existent dans plusieurs départements avec des coûts
différents, et le nom seul ne dit pas quel coût va à quel INSEE.

## Le diagnostic, en trois certitudes

1. **La corruption est totale sur la colonne A** : 34 836/34 839 lignes ont colonne A ≠ vrai nom.
2. **La valeur « coût » suit le NOM, pas le code INSEE** : sous « la valeur suit le nom », le
   couplage logique `coût = "Pas de sinistre" ⟺ représentativité = "Pas de sinistre"` est
   vérifié à 100,00 % ; sous « la valeur suit la colonne A », il tombe à 52 % (aléatoire).
   Donc le couple **(nom, coût) est resté intact** ; seul l'appariement à l'INSEE est cassé.
3. **Le bloc (nom, coût) est ordonné par INSEE DÉCROISSANT** : départements 95→01, et à
   l'intérieur d'un département INSEE décroissant. Découvert en reconstruisant la permutation
   via les noms uniques (dont l'INSEE vrai est certain).

## La correction (déterministe, sans ambiguïté)

L'INSEE est un **ordre total sans ex æquo**. En triant la référence de confiance (INSEE→nom,
issue de la feuille « Représentativité ») par **INSEE décroissant** et en l'alignant ligne à
ligne avec le bloc corrompu, chaque coût retombe sur son INSEE **sans aucun tie-break
hasardeux** — les homonymes sont résolus parce qu'on ne s'appuie plus sur le nom mais sur la
position dans un ordre total.

## Vérification (4 contrôles indépendants, tous au vert)

1. **Alignement des noms** : trié par INSEE décroissant, `0 mismatch / 34 839 lignes`.
2. **Couplage coût ⟺ représentativité** : `34 839 / 34 839 = 100,000 %`.
3. **Cross-validation** contre la référence officielle du repo
   (`data/communes-france-coords.csv`) : 34 732 INSEE présents, dont 34 500 noms identiques
   (99,33 %). Les 232 écarts sont des ligatures (Cœuvres, Œuilly) ou des fusions post-2021
   (Culoz → Culoz-Béon, Noyant-et-Aconin → Bernoy-le-Château) : dérive de référentiel
   INSEE 2021 → courant, **pas** des erreurs de reconstruction. 107 INSEE ONRN absents du
   référentiel courant (mêmes fusions) : à mapper au moment de l'intégration.
4. **Plausibilité de la distribution** : 23 468 « pas de sinistre » (67 %, attendu pour la
   sécheresse/RGA concentrée sur les sols argileux), puis 3169 « 10-20 k€ », 2946 « >20 k€ »,
   2154 « 5-10 k€ », 1745 « 0-2,5 k€ », 1357 « 2,5-5 k€ ».

Réserve honnête : 9 communes (0,026 %) ont un statut « no sinistre » divergent entre
fréquence et coût/représentativité. C'est une **micro-incohérence du producteur ONRN**
(présente aussi dans les fichiers sains, fréq⟺représ = 99,974 %), pas un artefact de la
correction (coût⟺représ reste à 100 %).

## Livrables (persistés dans `data/source/onrn/`)

- `ONRN_CoutMoyen_SECH_corrige.csv` — la feuille coût réparée, 34 839 lignes, INSEE croissant,
  colonnes `code_insee, commune, cout_moyen_secheresse`. **C'est le fichier qui était bloqué à 93 %.**
- `onrn_secheresse_consolide.json` — dataset par INSEE : `{nom, cout_moyen, frequence, representativite}`
  (coût réparé + fréquence saine + représentativité pour le gating).
- `reconstruire-cout-secheresse.py` — script re-exécutable (audit / reproductibilité).
- Sources brutes `ONRN_*_SECH_9521.xlsx` + `onrn_sp_sech.xlsx` (préservées durablement ;
  elles ne vivaient que dans un scratchpad éphémère).

## Reste à faire (intégration, hors périmètre de cette correction)

- **Mapping INSEE 2021 → référentiel courant** pour les 107 communes fusionnées, au moment du câblage.
- **Doctrine d'usage déjà écrite** dans le rapport d'évaluation : récit qualitatif gaté par la
  représentativité (≥ « Entre 30 et 50% »), classes verbatim, jamais de scoring `/ou-vivre`,
  jamais de tendance inter-millésimes, attribution ONRN, période 1995-2021 nommée.
- **Licence ONRN** : décision porteur du 2026-07-02, **on n'attend PAS de confirmation écrite**.
  Le porteur assume la présomption favorable (diffusion volontaire sur le portail open data de
  l'État, dispositif public officiel ONRN/État/CCR) et considère l'usage gratuit et commercial
  OK. À accompagner d'une attribution visible « ONRN (État / CCR / Mission Risques Naturels),
  via Géorisques ». Le verrou licence du rapport d'évaluation est donc **levé**.
