# FUT-109 · Trois populations à 0 : un défaut de grain, pas trois communes vides

Audit et correctif préparé du 23/10/2026. Branche `bonjourfuturee/fut-109-populations-communes-deleguees` (worktree `.claude/worktrees/fut109`), partie de `main` @ `3af53c3c`.

## 1. En une phrase

Les trois codes ne sont **pas des communes déléguées** : ce sont des **communes de plein exercice rétablies le 01/01/2024**. La source de l'index publie pour elles une population **2021** qui n'existe pas à leur grain, et elle l'écrit `0`. Le même défaut fausse en silence **68 autres communes**, des fusions et défusions de 2024 et 2025 : Saint-Denis compte 113 942 habitants au lieu de 149 077, Essarts-en-Bocage 9 399 au lieu de 6 851.

## 2. Les faits, dans les sources primaires

**Référentiel de l'index** : la liste des 34 788 communes vient de DRIAS (`data/data_climat.json`). Comparée aux listes Insee (API Métadonnées, `/geo/communes?date=`), elle correspond exactement au **COG au 01/01/2025** : 0 code en trop, 0 code manquant, hors les trois villes PLM, remplacées par leurs 45 arrondissements. Le COG au 01/01/2026 est identique pour la métropole.

**Source de la population** : ADEME `data_communes` (data-fair `8ggfo546-mtjxy4lbqxcl462`, données du 09/12/2025), champ `population_totale_2021`. Malgré son nom, ce champ est la **population municipale (PMUN) des populations légales Insee 2021**, publiées dans les **limites au 01/01/2023**. Vérification : pour les 34 704 communes de l'index au territoire inchangé, la valeur ADEME égale le PMUN Insee 2021, sans un seul écart.

| Code | Statut au COG 2025 | Histoire (COG, `v_mvt_commune_2025.csv`) | ADEME 2021 | Insee PL 2021 (grain) | Insee 2022 | **Insee 2023** |
|---|---|---|---|---|---|---|
| 60694 Les Hauts-Talican | **commune** (communes déléguées : Villotran 60694, La Neuville-Garnier 60455) | Villotran jusqu'en 2018 ; 01/01/2019 fusion dans Les Hauts-Talican (code 60054) ; **01/01/2024 rétablissement** (mod. 21) : Beaumont-les-Nonains reprend 60054, le reste garde le nom sous 60694 | **0** | pas de commune à ce grain ; communes déléguées Villotran 289 + La Neuville-Garnier 254 | 547 | **542** |
| 85165 L'Oie | **commune** simple | 01/01/2016 déléguée d'Essarts-en-Bocage ; **01/01/2024 rétablie** (mod. 21) | **0** | déléguée : 1 259 | 1 264 | **1 250** |
| 85212 Sainte-Florence | **commune** simple | idem | **0** | déléguée : 1 333 | 1 338 | **1 359** |
| 85084 Essarts-en-Bocage | commune nouvelle (Les Essarts, Boulogne) | perd L'Oie et Sainte-Florence le 01/01/2024 | 9 399 (avant séparation) | 9 399 | 6 835 | **6 851** |
| 60054 Beaumont-les-Nonains | commune | rétablie le 01/01/2024 | 878 (ex-Hauts-Talican) | 878 | 337 | **339** |

`dateCreation` de 60694, 85165 et 85212 dans l'API Métadonnées Insee : `2024-01-01`. Populations légales 2022 : limites au 01/01/2024, décret n° 2024-1276. Populations de référence 2023 : limites au 01/01/2025, publiées le 18/12/2025, en vigueur au 01/01/2026.

**Pourquoi `0`** : ADEME a rattaché la population 2021, calculée sur la géographie 2023, aux codes de son propre référentiel, plus récent, **sans la recalculer**. Une commune rétablie, absente de la géographie 2023, reçoit `0` au lieu d'une absence. La commune d'origine garde la population d'avant la séparation. Une commune nouvelle ne garde que la population de la commune qui conserve le code. La densité 2022 du même jeu, elle, est au bon grain : 42,08 hab./km² pour 60694, soit 547 / 13,19 km². C'est cet écart qui avait fait suspecter le problème.

**Absence, inconnue, zéro** : ce sont trois choses distinctes. Le `0` d'ADEME n'est **pas** une population nulle : c'est une absence au grain. À l'inverse, six villages détruits de la Meuse (Fleury-devant-Douaumont…) ont réellement **0 habitant** selon l'Insee. ADEME ne les porte pas, et l'index les laisse `null`.

## 3. La chaîne technique

```
ADEME data_communes (population_totale_2021 = PMUN 2021, géo 2023, re-codée sans recalcul)
  → scripts/fetch-communes-vivabilite.mjs (ou fetch-communes-population.mjs) → data/communes-vivabilite.json   [non versionné]
  → scripts/build-comparateur-index.mjs : population = pop.population ?? null      ← le 0 passe tel quel
  → scripts/populate-uu-pop.mjs : uu_pop = population (hors UU), somme par UU sinon
  → data/comparateur-index.json.gz
  → scripts/accueil/donnees-accueil.mjs (prebuild) → src/data/accueil-communes.json (copie fidèle, FUT-50)
  → comparateur-vie.ts (tailleVilleResolvedOf, POP_FLOOR, paliers, homonymes), dossier Territoire et Adresse
    (territory-facts.ts → moduleFacts.tailleVille), pastille « taille » de l'accueil
```

**Conversion silencieuse en 0 dans futur•e** : aucune n'explique ces trois zéros, qui sont publiés tels quels par la source. Deux chemins latents ont été trouvés et fermés dans les scripts de collecte : `Number("")` vaut 0, si bien qu'une cellule vide deviendrait « 0 habitant ». Après correction, le cache régénéré est identique octet pour octet. Restent des `?? 0` côté produit (`tailleVillePalier`, signature, homonymes de `comparateur-vie.ts`), qui lisent une population `null` comme 0 : c'est un risque potentiel, sans effet aujourd'hui. Le fichier est modifié par #84 : il n'est pas touché ici.

## 4. Consommateurs : touchés réellement ou seulement exposés

Les mesures portent sur l'index régénéré localement, comparé à celui de `main`.

**Réellement touchés aujourd'hui** :
- **Accueil, pastille « taille »** : `Environ 0 habitants à L'Oie.`, de même pour Sainte-Florence et Les Hauts-Talican. Le verdict « petite ville ou village » est juste par hasard. Après correction : `Environ 1 250 habitants à L'Oie.`
- **Dossier Territoire et Dossier Adresse** : même `moduleFacts.tailleVille` (`territory-facts.ts`), même texte. La lecture complète (`buildCommuneDossier`) a été vérifiée identique à la lecture légère.
- **Comparateur « Où vivre »**, éligibilité (plancher de 1 500 habitants) changée pour 10 communes :
  - 9 deviennent éligibles : Orée d'Anjou (17 162), Porte des Pierres Dorées, Aurseulles, Conques-en-Rouergue, Pays-de-Montbenoît, Plumieux, Verdun-Ciel, Val-de-la-Hune, Sauzé-entre-Bois ;
  - 1 sort : Neussargues-Moissac (824, et non 1 653).
- **Classification de taille** (`agglomeration-size-v1`) : 18 communes changent de catégorie.
  - 14 n'avaient pas de taille et en reçoivent une.
  - 4 passent de « village » à « petite ville » : Verdun-Ciel et son unité urbaine, Sauzé-entre-Bois.
- **Paliers du comparateur** : 8 communes passent de « Plutôt rural » à « Petite ville » : Hesdin-la-Forêt et son unité urbaine, Saint-Martin-de-May, Orée d'Anjou.
- **Homonymes par nom** : « Sainte-Florence » désignait celle de Gironde (147 habitants), seule dotée d'une population. Elle désigne désormais celle de Vendée (1 359), conformément à la règle « la plus peuplée ».
- **`uu_pop`** : 658 communes, les unités urbaines qui contiennent une commune corrigée. L'agglomération de Paris passe de 10 858 372 à 10 893 507 habitants (Saint-Denis).

**Exposés, sans recalcul ici** : les scores calculés en Python avec la population comme dénominateur ou comme poids. Il s'agit de `vie-locale`, `demographie`, `etudiants` et `bpe`. Ils ont été calculés avec les valeurs hors grain de ces 71 communes. Les recalculer demande des sources lourdes non versionnées (BPE, etc.) ; c'est un suivi à décider. Les dossiers et analyses figés (instantanés Supabase) ne sont pas réécrits.

## 5. Le correctif

**Règle** (`scripts/lib/population-grain.mjs`) : la valeur ADEME 2021 est gardée si le territoire **et** le code de la commune sont inchangés entre le 01/01/2023 et le 01/01/2025. Sinon, l'index reçoit la **population de référence Insee 2023**, publiée dans la géographie même du référentiel, et donc au bon grain.
- Mouvements du COG pris en compte : 21, 31, 32 et 33 pour le territoire ; 41 et 50 pour le code.
- Sans effet : changement de nom, suppression de déléguée, passage d'une fusion-association en fusion simple.
- Aucune somme reconstituée, aucun report d'une commune nouvelle sur une déléguée.
- Sans valeur officielle, la population est `null`, jamais `0`.
- Hors périmètre, assumé : les 6 villages détruits de la Meuse restent `null`. Leur valeur officielle (0) est inscrite dans le référentiel (`absentesSansMouvement`). Afficher « 0 habitant… c'est un village » demande une décision éditoriale.

**Pourquoi pas tout l'index en 2023** : aligner les 34 788 communes sur le millésime 2023, dont la géographie est celle du référentiel, serait l'état cible propre. Mais cela change toutes les populations, donc les classifications proches des seuils, `uu_pop` et les scores dérivés. C'est une décision produit, pas un correctif minimal. La règle actuelle ne mélange les millésimes que pour 71 communes, et elle l'inscrit : `meta.population`, et un motif par commune dans le référentiel.

**Fichiers** :
- `scripts/lib/population-grain.mjs` : règle pure ; `effectifOfficiel` refuse `""` → 0.
- `scripts/population/construire-referentiel.mjs` : produit `data/population-referentiel-cog2025.json` (71 entrées, 15 Ko, sha256 des sources inscrits) à partir des fichiers officiels.
- `scripts/populate-population-grain.mjs` : applique le référentiel à l'index existant (idempotent).
- `scripts/build-comparateur-index.mjs` : applique le même référentiel, si bien qu'une reconstruction complète ne réintroduit pas le défaut. Vérifié : populations identiques à celles du correctif en place.
- `scripts/fetch-communes-*.mjs` : une cellule vide est une absence.
- Tests : `scripts/lib/population-grain.test.mjs` (11, règle) et `scripts/population/index-population.test.mjs` (5, sur les artefacts).

## 6. Validation, faite en local dans le worktree isolé

| Contrôle | Artefacts de `main` | Artefacts régénérés |
|---|---|---|
| `npm test` | 2 972 tests, 4 échecs (les nouveaux tests d'artefacts : le défaut est détecté) | **2 972 tests, 0 échec** |
| `tsc --noEmit` | — | 0 erreur |
| `eslint` (scripts modifiés) | — | 0 erreur |
| `donnees-accueil.mjs` (prebuild) | — | identique octet pour octet après `--ecrire` |
| `verifier-equivalence.mjs` (34 791 codes) | — | 104 373/104 373 lectures identiques |
| Reconstruction complète `build-comparateur-index.mjs` | — | populations identiques au correctif en place |
| Diff de l'index | — | 3 champs seulement : `population` (71, toutes dans le référentiel), `uu_pop` (658), `uu_count` (8) ; `meta.population`, `meta.countWithPopulation` |

## 7. Bloqué par #84, et procédure d'intégration

**Non commités** : `data/comparateur-index.json.gz` et `src/data/accueil-communes.json`, que #84 modifie aussi. Le test `scripts/population/index-population.test.mjs` échoue donc sur la branche tant qu'ils ne sont pas régénérés : la branche **n'est pas prête pour une PR**.

Après la fusion de #84 dans `main` :

```bash
git fetch origin && git rebase origin/main            # sur la branche FUT-109
npm run index:unpack
node scripts/populate-population-grain.mjs            # 71 communes reprises
node scripts/populate-uu-pop.mjs
npm run index:pack
node scripts/accueil/donnees-accueil.mjs --ecrire
node --test scripts/population/index-population.test.mjs && npm test && npx tsc --noEmit
node scripts/accueil/verifier-equivalence.mjs
git add data/comparateur-index.json.gz src/data/accueil-communes.json && git commit
```

Pour reconstruire le référentiel (inutile tant que les sources ne changent pas) :
- télécharger `v_mvt_commune_2025.csv` (Insee 8377162) et `ensemble.zip` (Insee 8680726, `donnees_communes.csv`) ;
- lancer `node scripts/fetch-communes-population.mjs` ;
- puis `node scripts/population/construire-referentiel.mjs --mvt … --pl2023 …`.

Résultat vérifié identique octet pour octet sur deux exécutions.

## Sources

- Insee, COG au 01/01/2025 (mouvements, communes) : https://www.insee.fr/fr/information/8377162
- Insee, API Métadonnées géographiques : `https://api.insee.fr/metadonnees/V1/geo/commune/{code}` et `/precedents`
- Insee, populations légales 2021 (limites au 01/01/2023) : https://www.insee.fr/fr/statistiques/7739582
- Insee, populations légales 2022 (limites au 01/01/2024) : https://www.insee.fr/fr/statistiques/8290591
- Insee, populations de référence 2023 (limites au 01/01/2025) : https://www.insee.fr/fr/statistiques/8680726
- ADEME, `data_communes` : https://data.ademe.fr/datasets/8ggfo546-mtjxy4lbqxcl462
- geo.api.gouv.fr (contrôle croisé, populations 2023) : https://geo.api.gouv.fr/communes/85165
