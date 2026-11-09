# FUT-180 · Reproduire l'étude de la grille de densité Insee

Rapport : [`../2026-11-09-fut180-grille-densite-insee.md`](../2026-11-09-fut180-grille-densite-insee.md).

## Rejouer

```bash
python3 -m venv /tmp/fut180-venv && source /tmp/fut180-venv/bin/activate
pip install -r requirements.txt
./lancer_tout.sh /tmp/fut180-travail                 # révision étudiée (51a493d0)
./lancer_tout.sh /tmp/fut180-travail-2 <révision>    # tout autre état de l'index et du code
```

Prérequis : Python 3 (environnement ci-dessus), Node 22 ou plus, et un `node_modules` installé dans le dépôt (`npm ci`). Depuis un worktree sans `node_modules`, le script prend celui de la copie principale du dépôt, ou celui indiqué par `NODE_MODULES=<chemin>`.

Le dossier de travail est hors dépôt. Rien n'est écrit dans le dépôt, l'index ou une base.
- `00_preparer.sh` télécharge sources et documents de méthode, et **refuse de continuer** si une empreinte diffère de `SHA256-source.txt`.
- L'index **et** le code (`src/`) sont extraits de la **même révision** par `git show` / `git archive`, jamais lus dans la copie de travail : un décompte de textes ne vaut que pour le code qui les produit.

Comparer sa sortie à `sortie-attendue.txt` (même ordre, chemins remplacés par `<dossier_de_travail>`).

## Fichiers

| Script | Ce qu'il prouve | Section du rapport |
|---|---|---|
| `00_preparer.sh` | sources, empreintes, index et code d'une même révision | §1 |
| `01_charger_grille.py` | lecture de la feuille « Maille communale » (en-têtes en ligne 5) | §1 |
| `02_jointure.py` | couverture, 45 arrondissements et 3 communes PLM non appariés ; reproduit `densityCategory` ; porte `uu_statut` s'il existe | §2 |
| `03_tableau_croise.py` | distribution nationale, tableau croisé, 3 postes × nos catégories (3 026), densités absentes | §2 |
| `04_ecarts_et_libelles.py` | groupes A à F (convention du rapport, 18,5 %), portée des seuils de population, unités urbaines et règle « ville » de FUT-176 | §1, §2, §6.1 |
| `05_coherence_et_millesimes.py` | règle officielle contre `idxmax`, 80 discordances par nature, cas Isle / Quimper / Aubagne / Saint-Brieuc / Porto-Vecchio ; 2025 = 2026 | §1, §3.2 |
| `06_panel_et_voisins.py` | répartition de nos catégories, panel par code Insee, PLM | §2, §3.1 |
| `07_accueil_textes.mts` | exécute le **vrai** `deriveCategoriesFromEntry` et `recits.ts` sur chaque commune, avec et sans les catégories émises par `peuDense` | §6.2 |
| `08_accueil_croisement.py` | 3 612 communes urbaines Insee sous 1 500 hab/km², textes produits et imputables à la densité | §6.2 |
| `sortie-attendue.txt` | sortie de référence à la révision 51a493d0 | tout |
| `sortie-fut176-ee1d809a-provisoire.txt` | même chaîne sur la branche FUT-176 non fusionnée | §6.1 |

## Recalcul après fusion de FUT-176

`./lancer_tout.sh <dossier> <révision de main après fusion>`. Les scripts lisent `uu_statut` dès qu'il existe (sinon `hors_uu`, et ils l'écrivent). Seules la section « Unités urbaines » de `04`, la colonne `uu_statut` du panel et, si `comparateur-vie.ts` a changé, la section `08` peuvent bouger. Un autre écart avec `sortie-attendue.txt` signale un changement d'index ailleurs.

## Points à contre-vérifier en priorité

1. `cat()` dans `02_jointure.py` reproduit-il fidèlement `densityCategory` (`src/lib/territoire/facts.ts`) ?
2. `07_accueil_textes.mts` appelle les fonctions avec `usedFallback = false` dès qu'une catégorie autre que `all` existe, comme `FutureELanding.tsx` ; l'aperçu est évalué sans indicateurs climat (la carte Mobilité ne lit que les catégories).
3. La règle de `05` (dense si P1 ≥ 50 ; intermédiaire si P1 + P2 > 50) vient de la méthode Insee et du manuel Eurostat ; le fichier ne documente pas lui-même le calcul de P1/P2/P3.
4. Les nombres de §6.2 comptent les communes pour lesquelles un texte serait produit, pas des affichages mesurés.
