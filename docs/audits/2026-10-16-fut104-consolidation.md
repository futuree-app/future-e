# FUT-104 · Consolidation des données climatiques

16 octobre 2026 · branche `feat/fut-104-consolidation`. Aucune PR, fusion ni déploiement. FUT-50 n'est pas touché. Aucune écriture en base de production.

> **Un territoire → le bon référentiel → la bonne source → les bons indicateurs → les bonnes limites.**
> - Hexagone et Corse : DRIAS-TRACC, 34 788 communes.
> - Outre-mer couvert : SocleOM-Climat-2025, 187 entités.
> - Sans données validées : indisponibilité explicite, 36 entités.

## 1. Consolidation des deux branches

| Étape | Commit | Contenu |
|---|---|---|
| Base | `80865e36` | `feat/fut-104-climat-outremer` (SocleOM, contrat, audit) |
| Cherry-pick `-x` de `6e2cc13d` | `25fc2754` | Garde-fous du hotfix |
| Cherry-pick `-x` de `c3d2766b` | `b3e4342a` | `data_climat.json` hors de `public/` |
| Consolidation | voir `git log` | Purge, rangs, libellés, règles géographiques, tests, purge SQL préparée |

Chaque conflit a été tranché à la main, sur son contenu :

| Fichier | Conflit | Résolution |
|---|---|---|
| `src/lib/outremer/code-outremer.ts` | Même fonction, commentaires différents | Fonction inchangée, commentaire à jour (renvoi aux trois rapports) |
| `src/lib/drias-json.ts` | Même garde-fou (avant `getIndex`), commentaires différents | Garde-fou conservé. Le commentaire ne dit plus que les lignes « restent à dessein » : elles sont purgées |
| `src/app/api/climat/[insee_code]/route.ts` | Même 404 | Version du hotfix (refus avant lecture du fichier, message explicite) |
| `src/lib/apercu-territoire.ts` et son test | Même refus ; test du hotfix plus complet | Version du hotfix (`hors_couverture`), test réécrit pour l'état purgé |
| `scripts/build-drias-median.js` | FUT-104 : seuil en ligne à 0,5° ; hotfix : module `drias-jointure.mjs`, 0,25° mesuré | Module du hotfix. **Correction d'un piège de la fusion automatique** : l'appel référençait encore `EST_OUTREMER`, supprimé |

## 2. Fichiers repris ou modifiés

**Données :**
- `data/data_climat.json` : régénéré ;
- `data/drias_median_metadata.json` ;
- `src/data/apercu-climat-communes.json` : régénéré ;
- `src/data/outremer/climat-outremer.json` : régénéré ;
- `src/data/outremer/controles-points.json` : nouveau.

**Scripts :**
- `scripts/build-drias-median.js` et `scripts/lib/drias-jointure.mjs` ;
- `scripts/outremer/extraire_climat_outremer.py` : règles de distance, de corroboration, d'étendue et de lacunes ;
- `scripts/outremer/controler_points.py` : nouveau ;
- `scripts/outremer/test_extraire_climat_outremer.py` : nouveau ;
- `scripts/verifier-hotfix-outremer.mjs` ;
- `scripts/populate-communes-tension.js` ;
- `scripts/build-comparateur-index.mjs` et `scripts/build-apercu-climat.mjs` : chemins.

**Code :**
- `src/lib/drias-json.ts`, `src/lib/rang-national.ts`, `src/lib/apercu-territoire.ts` ;
- `src/lib/outremer/climat-outremer.ts` : statut `point_de_reference_non_verifie`, `pointControle`, `etendueCommunale2050`, limites ;
- pages `/chaleur`, `/inondation` et `/territoire/[insee]/debloquer` ;
- `src/config/navigation.ts`, `src/app/sitemap.ts`, `src/app/api/wizard-preview/route.ts`, `src/app/api/climat/[insee_code]/route.ts`.

**Tests :**
- `src/lib/outremer/climat-outremer.test.ts` ;
- `src/lib/outremer/garde-fous-outremer.test.ts` ;
- `src/lib/apercu-territoire.test.ts` ;
- `scripts/lib/drias-jointure.test.mjs`.

**Base :** `supabase/maintenance/2026-10-16-fut104-purge-secheresse-outremer.sql` et son script de retour arrière (`_retour.sql`), **non exécutés**.

## 3. Les 218 fausses entrées sont supprimées

`data/data_climat.json` est régénéré depuis les 51 fichiers sources de `data/source/` par le constructeur corrigé : outre-mer exclu, distance maximale 0,25°.

| | Avant | Après |
|---|---|---|
| Lignes | 105 018 | **104 364** (34 788 × 3 horizons) |
| Lignes ultramarines | 654 | **0** |
| Communes | 35 006 | **34 788**, Hexagone et Corse |
| SHA-256 | `ed1c381c…` | `e69994a1…` |
| `commune_count` (métadonnées) | 35 006 | 34 788. Seul champ modifié, hors date de génération |

Le nouveau fichier est **exactement l'ancien privé de ses 654 lignes ultramarines, octet pour octet** (`JSON.stringify(ancien.filter(non ultramarin)) === nouveau`). Les 104 364 lignes métropolitaines sont identiques.

**Artefacts dérivés :**

| Artefact | Statut |
|---|---|
| `src/data/apercu-climat-communes.json` | Régénéré : 34 788 communes, 0 ultramarine, valeurs métropolitaines identiques |
| `data/comparateur-index.json.gz` | Déjà métropolitain (34 788, percentiles propres). Ni touché ni à reconstruire |
| `communes_tension` (base) | 3 lignes contaminées, voir § 15 |

## 4. Emplacement et taille des jeux

| Jeu | Emplacement | Taille | Exposé publiquement ? |
|---|---|---|---|
| DRIAS-TRACC médian | `data/data_climat.json` | 63,0 Mo | Non. Lu par 24 fonctions serveur, présent dans leur trace (`.nft.json`, vérifié sur le build) |
| Extrait de l'aperçu | `src/data/apercu-climat-communes.json` | 2,7 Mo | Non (côté serveur) |
| SocleOM, valeurs | `src/data/outremer/climat-outremer.json` | 1,5 Mo | Non. Aucun consommateur encore |
| Référentiel ultramarin | `src/data/outremer/communes-outremer.json` | 30 Ko | Non |
| Contrôle des points | `src/data/outremer/controles-points.json` | 9 Ko | Non |

`public/` ne contient plus aucun JSON climatique ; un test balaie le répertoire. `https://…/data_climat.json` répond 404 sur le build de production.

## 5. Reproductibilité du constructeur DRIAS

```
node scripts/build-drias-median.js        # 51 sources → data/data_climat.json, 104 364 lignes
node scripts/build-apercu-climat.mjs      # → src/data/apercu-climat-communes.json
```

- **Règle :** l'outre-mer est exclu avant la jointure, et une distance au point de grille supérieure à 0,25° fait échouer la construction.
- **Distances mesurées :** médiane 0,035°, maximum 0,155° (île de Sein). Ouessant 0,147°, Granville 0,100°.
- **Tests sur la grille réelle** (`drias-jointure.test.mjs`) : îles, littoral, Corse, côte basque.
- **Sorties surchargeables :** `DRIAS_OUTPUT_JSON` et `DRIAS_OUTPUT_META` permettent de vérifier une reconstruction sans écraser le fichier livré.

## 6. Classements métropolitains

**Les valeurs ne changent pas :** 3 757 104 cellules métropolitaines comparées, **0 changée**. Les rangs, eux, changent tous, puisque l'effectif passe de 35 006 à 34 788 : 1 565 460 rangs comparés (15 indicateurs × 3 horizons × 34 788 communes).

| | Écart de percentile médian | Maximum |
|---|---|---|
| Indicateurs **affichés** (horizon 2050) | 0,06 à 0,13 point | 0,331 point (jours > 30 °C) |
| Tous les indicateurs | 0,111 point (p99 : 0,519) | 0,606 point (température hivernale, horizons 2030 et 2100, non affichée) |

**Plus grands écarts affichés.** Plusieurs communes partagent la même valeur (Plédran, Plestin-les-Grèves, Houtkerque, Besse-et-Saint-Anastaise…) : jours > 30 °C, percentile 3,14 → 2,81, rang 33 906/35 006 → 33 810/34 788. Elles sont les plus touchées parce que leur valeur était partagée avec les points bretons recopiés aux Antilles et en Polynésie : les copies du Conquet se classaient avec elles.

**Phrases affichées.** Les phrases de position (« Parmi les X % … ») changent lorsque le pourcentage arrondi franchit un entier.

**Moteur inchangé**, sur 34 791 codes, Paris, Lyon et Marseille compris : 0 écart sur les données, la carte de l'accueil, la projection Logement, les faits climatiques et les quatre classifications (`classifyClimateComfort` et `classifyWildfireDanger`, en exigence déclarée et ambiante). Aperçu : 0 écart sur 34 788 communes. Les classifications reposent sur des seuils absolus, pas sur des rangs.

**Libellés :**
- « communes françaises » devient **« communes de l'Hexagone et de Corse »** dans `phraseDePosition`, dans les introductions de `/chaleur` et `/inondation`, dans la navigation et sur la page `debloquer` ;
- l'effectif affiché vient de `rang.total`, et donc des données réellement comparées : « 34 788 communes de l'Hexagone et de Corse comparées ».

*Défaut corrigé au passage :* l'entité `&apos;` faisait perdre l'espace qui suit l'effectif (« 34 788communes »). L'espace est désormais explicite, et un test le vérifie.

**Note.** Les calibrations historiques « mesurées sur 35 006 communes » (seuils de `climat-facts.ts`, 25/07) incluaient les 218 lignes fausses, soit 0,6 % de l'échantillon. Les seuils sont absolus et n'ont pas été modifiés ; une nouvelle mesure reste possible.

## 7. Points géographiques atypiques de SocleOM

**A. Saint-Martin et Saint-Barthélemy : valeurs cohérentes, mais instables d'un pixel à l'autre.**
- **Les deux points :**
  - Marigot (−63,0847 ; 18,067 ; 7 m) → pixel (−63,075 ; 18,075) à 1,36 km : TXx 34,0 °C, 35,2 jours ≥ 33 °C ;
  - Gustavia (6 m) → pixel à 0,33 km : TXx 31,9 °C, 0,1 jour.
- **Voisinages :**
  - à Saint-Martin, TXx varie de 32,6 à 34,5 °C, et les jours ≥ 33 °C de 1 à 65 d'un pixel à son voisin ;
  - à Saint-Barthélemy, TXx reste entre 31,5 et 32,3 °C, et les jours ≥ 33 °C entre 0,0 et 0,5.
- **Référence de correction :** ERAROBS, qui combine AROME à 2,5 km, ERA5 et des stations, sur 1990-2024 par CDF-t.
- **Lecture :** Saint-Barthélemy est petite et ventilée, Saint-Martin a un intérieur abrité. Un comptage au-dessus d'un seuil proche des maximales locales est très sensible.
- **Conséquence :** la valeur est conservée, avec son **étendue communale** (Saint-Martin, 2050 : 14,7 à 158,6 jours). Un test fige ce comportement.

**B. Tahiti : le point « mairie » de l'Annuaire n'est pas toujours la mairie.**
- **Pirae :** point de l'Annuaire (−17,5776 ; −149,5239) à **778 m** d'altitude (SRTM), presque confondu avec le centroïde. Il est à **5,3 km** de la mairie littorale (OSM). Pixel à 0,31 km : 20,75 °C, contre 25,07 °C pour le pixel le plus chaud de la commune. **Valeur retenue : statut `point_de_reference_non_verifie`.**
- **Papara :** mairie de l'Annuaire à 12 m, corroborée par OSM. Pixel à 1,27 km : 25,61 °C. Le centroïde COG (19,3 °C) n'est pas utilisé. **Valeur conservée.**
- **Papeete :** point de l'Annuaire à 128 m, à 2,56 km de l'hôtel de ville, non corroboré. Mais son pixel est le plus chaud de la commune (écart 0 °C). **Valeur conservée**, avec une limite « localisation non confirmée ».

**C. Arutua : exception supprimée.**
- **Ce qui se passait :** la méthode « pixel le plus proche dans la commune » n'avait **aucune limite de distance**. La mairie est sur l'atoll d'Arutua ; le pixel retenu était sur un autre atoll de la commune, à 12,8 km.
- **Règle désormais unique et testée :** quel que soit le mode de sélection, le pixel est à moins de 5 km du point. Arutua passe **hors grille**.

**D. Fort relief.**

| Commune | Altitude du point | TMm 1991-2020 | Étendue communale 1991-2020 | Étendue 2050 |
|---|---|---|---|---|
| Saint-Paul | 13 m | 23,16 °C | 12,53 – 24,74 | 13,76 – 25,94 |
| Le Tampon | 552 m | 21,24 | 14,30 – 21,24 | 15,53 – 22,45 |
| Cilaos | 1 214 m | 17,10 | 14,02 – 19,22 | 15,25 – 20,45 |
| Bourail | 6 m | 23,81 | 17,91 – 23,83 | 19,02 – 24,93 |
| Païta | 35 m | 23,05 | 17,28 – 23,42 | 18,39 – 24,53 |
| Thio | 51 m | 23,23 | 15,52 – 23,43 | 16,62 – 24,52 |


- **Pas de moyenne spatiale**, conformément à Météo-France. Chaque indicateur porte son minimum et son maximum communaux en 1991-2020 et en 2050, pixel retenu compris.
- *Correction apportée :* à Saint-Denis, les 47 jours ≥ 31 °C du pixel côtier étaient hors d'une étendue « 0 à 27 » limitée aux pixels des hauts. Les étendues encadrent désormais toujours la valeur ; un invariant est testé.
- **Limite « relief contrasté »** dès que la température moyenne varie de 3 °C ou plus dans la commune.

**Règle de représentativité** (`controles-points.json`, `controler_points.py`) :
- **Champ :** Polynésie et Nouvelle-Calédonie, où la mairie vient de l'Annuaire ou d'un géocodage approximatif.
- **Condition :** un point à plus de **100 m** d'altitude (SRTM), dont le pixel est au moins **1,5 °C** plus frais que le pixel le plus chaud de la commune, doit être confirmé par une seconde localisation indépendante (mairie principale OSM) à moins de **1,5 km**. Sinon, aucune valeur.
- **Usage d'OSM :** témoin seulement. Aucune coordonnée OSM n'est conservée, seulement une distance.
- **Résultat :** 2 entités retenues, Pirae et Tumaraa (252 m, à 11,8 km de la mairie OSM, 1,6 °C sous le pixel le plus chaud). 16 points restent non corroborés, mais thermiquement équivalents (moins de 1,5 °C) ; chacun porte la limite « localisation non confirmée ».

## 8. Matrice de couverture définitive

| Territoire | Entités | Intégrées | Autres statuts | Population couverte | 2030 / 2050 / 2100 (°C vs 1850-1900) |
|---|---|---|---|---|---|
| Guadeloupe | 32 | 32 | — | 384 160 | 1,4 / 1,9 / 2,7 |
| Martinique | 34 | 34 | — | 360 630 | 1,4 / 1,9 / 2,7 |
| Guyane | 22 | 22 | — | 293 996 | 1,7 / 2,3 / 3,5 |
| La Réunion | 24 | 24 | — | 889 679 | 1,5 / 2,0 / 2,9 |
| Mayotte | 17 | 17 | — | 256 518 | 1,5 / 2,0 / 3,0 |
| Saint-Martin | 1 | 1 | — | 31 160 | 1,4 / 1,9 / 2,7 |
| Saint-Barthélemy | 1 | 1 | — | 10 660 | 1,4 / 1,9 / 2,7 |
| Nouvelle-Calédonie | 33 | 33 | — | 264 596 | 1,5 / 2,0 / 3,0 |
| Polynésie française | 48 | **23** | 21 hors grille, 2 sans point (Taiarapu), 2 points non vérifiés (Pirae, Tumaraa) | 218 779 sur 278 786 | 1,2 / 1,6 / 2,3 |
| Wallis-et-Futuna | 3 | 0 | Données de base seulement | 0 | — |
| Saint-Pierre-et-Miquelon | 2 | 0 | Aucune source | 0 | — |
| TAAF | 5 | 0 | Aucune source | — | — |
| Clipperton | 1 | 0 | Aucune source | — | — |
| **Total** | **223** | **187** | **36** | **2 710 178** | |

**Écart avec l'état du 15/10** (190 intégrées) : les 3 entités sorties sont **Arutua** (règle de distance), **Pirae** et **Tumaraa** (règle de représentativité). Les valeurs et pixels des 187 autres sont identiques.

## 9. Exemples vérifiés, horizon 2050

Médiane avec fourchette q17–q83 entre crochets ; étendue communale des jours chauds en 2050.

| Commune | Point | 2050 = | Jours chauds | Nuits chaudes | Étendue jours chauds 2050 |
|---|---|---|---|---|---|
| Fort-de-France | mairie, 15 m | +1,9 °C | ≥ 33 °C : 26,6 → 101,4 [89,2–115,3] | ≥ 25 °C : 85,4 → 210,4 | 2,5 – 101,4 |
| Pointe-à-Pitre | mairie, 11 m | +1,9 °C | ≥ 33 °C : 63,4 → 140,4 | ≥ 25 °C : 21,1 → 93,4 | (un seul pixel) |
| Cayenne | mairie, 14 m | +2,3 °C | ≥ 33 °C : 6,8 → 94,6 | ≥ 24 °C : 150 → 293 | 69,5 – 110,6 |
| Saint-Denis | mairie, 42 m | +2,0 °C | ≥ 31 °C : 5,4 → 47 [43,3–51,9] | ≥ 25 °C : 16,1 → 68,8 | 0 – 47 |
| Mamoudzou | mairie, 18 m | +2,0 °C | ≥ 32 °C : 24,2 → 115,7 | ≥ 25 °C : 53,1 → 136 | 3,4 – 154,4 |
| Saint-Martin | mairie, 7 m | +1,9 °C | ≥ 33 °C : 35,2 → 118,2 | ≥ 25 °C : 112 → 194,2 | 14,7 – 158,6 |
| Saint-Barthélemy | mairie, 6 m | +1,9 °C | ≥ 33 °C : 0,1 → 6,1 | ≥ 25 °C : 193,6 → 278 | 1,4 – 16,3 |
| Nouméa | Annuaire, 7 m, corroborée | +2,0 °C | ≥ 32 °C : 36,2 → 69,1 | ≥ 24 °C : 37,7 → 87,3 | 28,9 – 88,7 |
| Papeete | Annuaire, 128 m, non corroborée | +1,6 °C | ≥ 32 °C : 8,3 → 28,8 | ≥ 26 °C : 0,2 → 2,4 | 0,8 – 28,8 |
| Papara | Annuaire, 12 m, corroborée | +1,6 °C | ≥ 32 °C : 24,3 → 64,4 | ≥ 26 °C : 0,1 → 2,4 | 0 – 94,4 |

**Sans valeur :**

| Entité | Statut |
|---|---|
| Pirae | `point_de_reference_non_verifie` |
| Arutua | `hors_grille` |
| Nuku-Hiva (Marquises) | `hors_grille` |
| Gambier | `hors_grille` |
| Uvea (Wallis) | `source_non_integree` |
| Saint-Pierre | `source_indisponible` |

**Concordance avec Météo-France (fin de siècle) :**

| Publié | Données |
|---|---|
| La Réunion, « 90 jours ≥ 31 °C » | Saint-Denis : 92,8 |
| Mayotte, « environ 205 jours ≥ 32 °C » | Mamoudzou : 199,8 |
| Guyane intérieure, « environ 170 jours ≥ 35 °C » | 150 à 218 |
| Nouvelle-Calédonie, nuits ≥ 24 °C « × 4 ou 5 » | Nouméa : × 3,5 |

## 10. Garanties de provenance

- **Source :** SocleOM-Climat-2025, Licence Ouverte 2.0. 71 archives (1,74 Go sur 272), **réutilisées et revérifiées** : 71 empreintes SHA-256 sur 71 conformes, aucun retéléchargement.
- **Référence et horizons :** 1991-2020. Niveaux régionaux 2030/2050/2100 **lus dans les fichiers** et comparés à la table TRACC. Le piège de Mayotte reste couvert : l'archive « RWL20 » contient les fichiers RWL-15.
- **Fourchettes et écarts :** q17, médiane et q83, qui expriment la **dispersion de l'ensemble à un même niveau de réchauffement**, jamais des scénarios « optimiste » ou « pessimiste » (testé). Les écarts sont ceux que publie Météo-France.
- **`null` ≠ `0`.** Lacunes de publication **déclarées** :
  - Guyane : CDDcold26, ETR, DTRm et PRCPTOT n'ont aucun horizon futur ;
  - Mayotte : PXCDD et PXCWD n'ont pas de référence.

  Toute autre absence fait échouer l'extraction. Une lacune déclarée mais publiée aussi.
- **Validation par zone** (`valider_zone`) : niveaux, référence, unités, famille de territoire, présence de la référence, et valeur toujours accompagnée de son écart, à chaque niveau. 13 tests Python couvrent chaque défaut avec des archives NetCDF synthétiques.
- **Nouvelle-Calédonie :** TN24D (seuil de la communication Météo-France) et TN25D (sélection « Découverte ») sont tous deux présents, distincts.

## 11. Tests

| Vérification | Résultat |
|---|---|
| Suite complète, lancée seule | **2 614 / 2 614** (2 575 sur `main` + 39) |
| Tests Python du pipeline | **13 / 13** (`python3 -P scripts/outremer/test_extraire_climat_outremer.py`) |
| TypeScript, ESLint (fichiers modifiés) | OK |
| Build de production (`next build --webpack`) | OK. 24 consommateurs tracent `data/data_climat.json` |
| Banc HTTP, build de production local | **124 / 124**, dont l'égalité octet pour octet des API métropolitaines avec la production |
| Comparaison exhaustive avec `origin/main` | 0 écart sur les valeurs, les faits, les classifications et l'aperçu ; rangs mesurés (§ 6) |

**Tests de sécurité des données** (chacun échoue si le défaut réapparaît) :

| Défaut | Fichier de test |
|---|---|
| Ligne ultramarine dans l'index DRIAS | `garde-fous-outremer.test.ts`, `climat-outremer.test.ts` |
| Commune hors grille | `drias-jointure.test.mjs` |
| Code ultramarin dans l'échelle nationale (effectif 34 788 par horizon) | `garde-fous-outremer.test.ts` |
| Absence devenue zéro | Lacunes, aperçu |
| Zone d'un autre territoire | « Sources » |
| Niveau ne correspondant pas à son horizon | Toutes les zones |
| Valeur ultramarine dans une classification métropolitaine | Garde-fous avant `getIndex`, aucune clé `NOR*` |
| Fichier public exposant les anciennes données | Balayage de `public/` |

## 12. Surfaces qui consomment SocleOM

**Aucune pour l'instant.** `@/lib/outremer` (contrat, `lireClimatOutremer`, `couvertureOutremer`) est prêt, testé et sans réseau, mais aucune page ni route ne l'importe. C'est voulu : la restitution relève de l'étape produit.

## 13. Surfaces à raccorder ou à garder indisponibles avant un achat ultramarin

| Surface | État | À faire avant lancement |
|---|---|---|
| `/chaleur/[insee]`, `/inondation/[insee]` (codes 97/98) | 404 avec page d'explication ; hors sitemap ; métadonnées neutres en `noindex` | Pages de lecture SocleOM (indicateurs du territoire, horizons régionaux, étendue, limites), puis retour au sitemap |
| `/territoire/[insee]/debloquer` (codes 97/98) | L'aperçu dit l'absence de trajectoire (`hors_couverture`) | L'argument « position parmi les 34 000 communes de l'Hexagone et de Corse » ne s'applique pas à l'outre-mer : **bloquer l'achat ou adapter le parcours** |
| Dossier Territoire (`territory-facts`, `commune-enrichment`) | Aucun fait climatique pour un code ultramarin | Brancher `lireClimatOutremer`, faits sans verdict |
| Synthèse Logement (`deriveClimatProjete`) | `null` pour un code ultramarin | Ne rien brancher tant qu'aucune doctrine n'est validée |
| `/qna`, `/drias`, `/api/climat`, `/api/wizard-preview` | Refus ou absence pour l'outre-mer | Décider s'ils doivent lire SocleOM |
| FUT-50 (identité, pastilles) | Contrat documenté dans l'audit du 15/10, § 8 | Raccorder après revue, sans toucher à FUT-50 ici |

## 14. Limitations avant publication

- **Résolution de 2,5 à 3 km.** Sur les reliefs abrupts et pour les comptages au-dessus d'un seuil, la valeur du point n'est pas celle de toute la commune : l'étendue le dit.
- **Localisations non corroborées :** 16 points en Polynésie et en Nouvelle-Calédonie, thermiquement équivalents au secteur le plus chaud de leur commune. Une source officielle et précise de localisation des mairies (ISPF, gouvernement de la Nouvelle-Calédonie) les lèverait.
- **Polynésie :** 21 entités hors grille (Marquises, Gambier, est des Tuamotu, Rapa, Arutua). Les indicateurs n'existent pas pour ces archipels.
- **Wallis-et-Futuna :** séries quotidiennes seulement. Calculer des indicateurs est un chantier à décider.
- **Doctrine :** `capaciteDecision: "faits_seulement"`. Aucune règle ultramarine (doublement, position dans le territoire) n'est activée, aucun verdict n'existe.
- **Contrôles en ligne :** l'altitude SRTM (OpenTopoData) et la corroboration OSM (Overpass) viennent de services publics externes. Leur résultat est versionné (`controles-points.json`) ; les relancer peut le faire évoluer.

## 15. Décisions qui nécessitent ton accord

1. **Exécution en production** de `supabase/maintenance/2026-10-16-fut104-purge-secheresse-outremer.sql`.
   - *Ce qu'elle supprime :* 3 lignes `secheresse` (97401, 97402, 97403, score 74), calculées sur l'ancienne ligne DRIAS de La Réunion, celle d'un point du sud de la Corse.
   - *Garde-fous :* elle est transactionnelle, cible des identifiants **et** un contenu, refuse toute autre situation, et vérifie que les 47 lignes `dependance-auto` restent intactes.
   - *Testée sur le projet de test* (table recréée puis supprimée) : suppression exacte, seconde exécution refusée, retour arrière exact.
   - *Vérifié en lecture seule :* aucune clé étrangère, aucun déclencheur, aucune vue dépendante. Les scores datent du 26/04 et précèdent le fichier médian du 29/05 : ils ne se recalculent pas exactement, mais leur provenance DRIAS ultramarine est établie (trois lignes identiques, indice de sécheresse du sol saturé à 216 jours, comme au point corse voisin).
2. **Parcours d'achat ultramarin :** le bloquer ou l'adapter (§ 13).
3. **Doctrine ultramarine :** pistes A et B de l'audit du 15/10, non activées.
4. **Recalibrer éventuellement les seuils métropolitains** mesurés le 25/07 sur 35 006 communes (§ 6).
