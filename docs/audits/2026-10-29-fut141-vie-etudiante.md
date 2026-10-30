# FUT-141 · Vie étudiante : une agglomération étudiante ne fait pas une vie étudiante locale

29/10/2026 · branche `bonjourfuturee/fut-141-vie-etudiante`, partie de `main` @ `76095598` · hors réseau (BPE et index en local), sans appel Anthropic, sans écriture utilisateur, sans migration. Arbitrages du porteur : 29/10/2026 (trois décisions, §3).

Preuves : `docs/audits/2026-10-29-fut141-vie-etudiante/` · scripts : `scripts/fut141/`.

## 1. Diagnostic

On repart de FUT-135 (part étudiante, 25-26/10) et de FUT-136 (rangs services, écoles, culture). FUT-135 avait laissé un point ouvert (§7.1 de son rapport) : **487 communes** notées « vie étudiante » ≥ 55 sans aucun établissement du supérieur recensé dans leur rayon, dont 255 au palier « forte ».

### 1.1 Les 487, recalculées sur l'index publié

Même règle que FUT-135 (`vie_etudiante ≥ 55` et `etudesSup.weightedAccess === 0`), sur l'index de `main` (`4f33d782…`) : **487** communes, dont **255** au palier fort. Elles sont concentrées autour de Toulouse, Lyon, Bordeaux, Marseille, Nantes, Strasbourg et Lille. Les rayons d'étude sont de 5 km (379 communes), 10 km (107) et 25 km (1). Liste figée : `les-487-avant.json`.

### 1.2 Thurins, rejoué

| | `main` |
|---|---|
| Accès aux études (`etudes_acces`) | 40, alors que **aucun** établissement n'est recensé à moins de 5 km |
| Part étudiante de l'agglomération de Lyon (`etudes_dyn`) | 92 |
| Score `vie_etudiante` (40 % accès + 60 % part) | **71**, palier « forte » |
| Raison de la carte | « forte présence étudiante dans l'agglomération de Lyon, aucun établissement supérieur recensé à moins de 5 km » |
| Comparaison complète avec Poitiers | **égalité** au palier fort |
| Découverte (> 65) | oui |

### 1.3 Deux effets, séparés

**Effet des percentiles (confirmé : c'est un défaut).** `populate-bpe.py` range l'accès par `bisect_right` : un groupe d'ex æquo reçoit le rang du **haut** du groupe. Rejoué depuis la source BPE 2025, à l'identique sur les 34 788 communes, le plateau des communes sans aucun établissement compte **14 029** communes (40 % du pays) et vaut donc **40**. Par le milieu, il vaudrait **20**. C'est la convention retenue pour la part étudiante (FUT-135) et pour les rangs (`rang-national.ts`). Ces 20 points d'accès fictif pèsent 8 points de score : à eux seuls, ils mettent **244 des 255** communes au palier fort.

**Effet de la combinaison (constaté, non corrigé, conformément à la consigne).** Même avec l'accès au plancher, 60 % du score vient de la part étudiante de l'agglomération. **360** des 487 restent ≥ 55, et **11** au palier fort (part ≥ 96 : agglomérations de Grenoble, Rennes, Nancy, Caen, Montpellier). Avec un accès à 0, il en resterait 170 ≥ 55 et aucune au palier fort. Corriger cet effet supposerait de changer les pondérations ou d'introduire un seuil : ce n'est pas fait.

### 1.4 Un défaut de grain dans les phrases (découvert pendant l'audit)

FUT-135 avait mis l'échelle dans les phrases (« … dans l'agglomération de Lyon »), mais leur **niveau** venait toujours du score combiné. L'accès local de la commune était donc prêté à sa présence étudiante, et pour une commune hors pôle, à son agglomération. Sur `main` :

- **1 457** phrases disaient un niveau au-dessus de la part étudiante mesurée du bassin : 948 en nommant une agglomération, 509 pour des pôles. Exemple : Balan, « présence étudiante intermédiaire dans l'agglomération de Béligneux », alors qu'aucun étudiant n'est inscrit dans cette agglomération (rang 12, le vrai zéro de FUT-135).
- **1 280** communes dont le bassin ne compte aucun étudiant inscrit recevaient une « présence étudiante » (limitée ou intermédiaire). Exemple : Vidauban, « présence étudiante intermédiaire ».

### 1.5 Ce que le ticket demandait de vérifier, point par point

| Point | Constat sur `main` |
|---|---|
| 1. Communes concernées | 487, dont 255 au palier fort (§1.1) |
| 2. Thurins | accès 40 sans établissement, part 92, score 71, palier fort, égalité avec Poitiers (§1.2) |
| 3. Percentiles et combinaison | 244 paliers forts dus au plateau ; 360 communes ≥ 55 dues à la combinaison (§1.3) |
| 4. Comparateur, raisons, identités, synthèses | identité « ville étudiante » : 0 des 487 (FUT-135 la réserve au pôle avec établissement attesté) ; raisons, découvertes, cellules et signaux : niveau gonflé (§1.4) ; 96 des 487 transmettaient le trait « vie étudiante » quand on cherche « une ville comme » elles ; synthèses : aucune des 487 ne « se distingue par sa vie étudiante » |
| 5. « Ville étudiante » ou « bien desservie » par la seule agglomération | aucune identité ni formulation « desservie ». En revanche, des niveaux de présence venaient de l'accès (§1.4) |

## 2. Défaut confirmé

Deux défauts sont confirmés : un rang d'ex æquo qui invente de l'accès, et des phrases qui prêtent à la présence étudiante un niveau venu de l'accès.

## 3. Arbitrages (porteur, 29/10/2026) et correction

1. **Corriger seulement le plateau** de `etudes_acces` (40 → 20), sans recalcul BPE général. Écoles, culture, `etudesSup`, les autres rangs d'accès et toutes les bandes de rang restent identiques.
2. **Le niveau de présence ne dépasse jamais la part étudiante du bassin**, pour les communes hors pôle comme pour les pôles. Le niveau ne peut pas venir *directement* de la part étudiante : la cellule de comparaison, son avantage et la règle FUT-135 (« jamais au-dessus du palier du score ») suivent le score. Une commune à 63 serait dite « forte » face à une commune à 99 qui mène seule. On retient donc le **plus bas des deux paliers**, sans nouveau seuil : les bornes 66/34 sont celles des paliers existants.
3. **Distinguer la présence de l'accès.** Quand la présence ne porte pas le niveau du score, la phrase dit à part l'établissement positivement attesté, avec son rayon : « au moins un établissement supérieur recensé à moins de N km ». Un bassin sans aucun étudiant inscrit dit « aucun étudiant inscrit dans la commune », « … dans son agglomération » ou « … dans l'agglomération de X », jamais une « présence ».

Aucun changement de score, de pondération, de seuil ou de classement en dehors du plateau.

### Changements

| Fichier | Changement |
|---|---|
| `data/comparateur-index.json.gz` | `etudes_acces` : 40 → 20 sur 14 029 communes ; bloc de provenance `meta.etudesAcces`. Aucun autre champ, aucune autre clé (vérifié champ par champ) |
| `scripts/fut141/plateau-etudes-acces.py` | le correctif, reproductible : relit la source avec les fonctions de `populate-bpe.py`, **refuse** si la convention publiée ne se rejoue pas à l'identique, et lit le plateau dans la source plutôt que dans l'accès arrondi (§5.2) |
| `scripts/populate-bpe.py` | même règle (`plateau_zero_au_milieu`), seulement pour `etudes_acces`, avec un autotest, pour qu'un futur recalcul ne remette pas 40. **Non lancé** |
| `src/lib/comparateur-vie.ts` | `presenceEtudianteParties` : niveau plafonné par la part du bassin, vrai zéro, mention de l'établissement attesté ; synthèse de thème (« l'enseignement supérieur à sa portée ») ; rang du vrai zéro lu dans `meta.etudesDyn.vraiZero` |
| `src/lib/compressed-index-loader.ts`, `comparateur-index-payload.ts` | le meta de l'index est transmis au moteur (une seule lecture) |
| `src/data/accueil-communes.json` | seule l'empreinte de l'index change ; `verifier-equivalence` 104 373/104 373 |

Tous les consommateurs passent par la même fonction : raisons, découverte, signaux, traits d'une ville de référence, compromis, cellule et qualificatif de la comparaison, ligne de fracture, synthèse de thème. Le recensement a été fait par `grep` sur les libellés et les paliers. Le compromis comparatif n'a pas d'entrée « vie étudiante ».

## 4. Avant / après

### 4.1 Les 487 cas initiaux

`node scripts/fut141/audit-fut141.mjs --photo` sur `main` puis sur la branche, puis `--comparer` (sortie : `comparaison-487.json`).

| Ce que lit le lecteur | `main` | branche |
|---|---|---|
| raison favorable (≥ 55) | 487 | **360** |
| palier « forte » | 255 | **11** |
| découverte (> 65) | 255 | **11** |
| phrase « forte… » | 255 | **11** (part du bassin ≥ 96) |
| égalité avec Poitiers dans la comparaison complète | 255 | **11** (Poitiers mène seule sinon) |
| trait « vie étudiante » d'une ville de référence | 96 | **0** |
| identité « ville étudiante » | 0 | 0 |
| mène face à Poitiers, ou « se distingue par » la vie étudiante | 0 | 0 |

Transitions de palier : forte → intermédiaire 244, intermédiaire → intermédiaire 232, forte → forte 11. Pour toutes, seul l'accès change (40 → 20), la part de l'agglomération est intacte, et le score vaut exactement `round(0,4 × 20 + 0,6 × part)`.

Thurins sur la branche : accès 20, score **63**, palier intermédiaire. Phrase : « présence étudiante intermédiaire dans l'agglomération de Lyon, aucun établissement supérieur recensé à moins de 5 km ». Poitiers mène seule, et la synthèse dit « Poitiers se distingue par sa vie étudiante. ». Sur l'API de recherche réellement servie (`/api/comparateur-vie/match`, recherche « vie étudiante » dans le Rhône à sa population), sa compatibilité passe de 78 à 72.

### 4.2 Communes réellement universitaires

17 témoins : Poitiers, Rennes, Angers, Corte, Talence, Villeurbanne, Saint-Martin-d'Hères, Orsay, Villeneuve-d'Ascq, Pessac, Aubière, Montpellier, Lyon 1er, Strasbourg, Toulouse, Le Puy-en-Velay, Aurillac. Accès, part, score, palier, raison, identité et phrase sont **identiques**.

En revanche, **24 pôles de plus de 30 000 habitants** changent de phrase, sans changer de score. Leur part étudiante est intermédiaire (54 à 65) alors que leur score est fort : Toulon, Avignon, Dunkerque, Béziers, Cherbourg-en-Cotentin, Saint-Nazaire, Colmar, Montauban, Saint-Quentin, Bayonne, Arles, Saint-Malo, Brive-la-Gaillarde, Charleville-Mézières, Carcassonne, Chalon-sur-Saône, Châteauroux, Castres, Gap, Chartres, Roanne, Montluçon, Agen, Mont-de-Marsan. Exemple : Montluçon passe de « forte présence étudiante » à « présence étudiante intermédiaire, au moins un établissement supérieur recensé à moins de 15 km ». C'est l'effet voulu par l'arbitrage 2 ; il est signalé à la revue parce que ce sont des villes universitaires ou des antennes.

### 4.3 Grain, sur toutes les communes mesurées (5 555)

| | `main` | branche |
|---|---|---|
| niveau dit au-dessus de la part du bassin | 1 457 (dont 509 pôles) | **0** |
| « présence » dite d'un bassin sans aucun étudiant inscrit | 1 280 | **0** |
| niveau plafonné par la part du bassin | | 649 (dont 135 pôles) |
| établissement attesté dit à part, avec son rayon | | 1 635 |

### 4.4 L'index entier et les 18 recherches de l'audit FUT-135

`scripts/fut135/audit-vie-etudiante.mjs` (sortie : `recherches-18.json`).

- **Scores** : 1 666 `vie_etudiante` changent. Paliers : forte → intermédiaire 244, intermédiaire → limitée 308, et rien d'autre. Raisons favorables : 127 perdues, 0 gagnée. Découvertes : 244 perdues. Traits d'une ville de référence : 96 perdus. Identités : 0 changement. Aucune commune ne monte.
- **Recherches** : 17 trios sur 18 identiques. « Vie étudiante + nature, Auvergne » : Pont-Salomon (aucun établissement à moins de 10 km) cède la 3ᵉ place au **Puy-en-Velay**, qui a des établissements. Pistes identiques. Textes changés : découverte de Thurins (« une ville comme Leménil-Mitry ») et de La Chapelle-d'Armentières, cellules de Saint-Martin-de-Ré et La Flotte (« Aucun étudiant inscrit… »).
- **Référence figée de FUT-147** : 12 valeurs changent, toutes de la vie étudiante. `maj-reference-fut147.mjs` l'a mise à jour et refuse tout autre écart ; liste dans `reference-fut147-ecarts.json`. Exemples : Toulon, Bidart (agglomération de Bayonne), Vidauban, Gonfaron, La Broque.

### 4.5 Ce qui est réellement servi

Les deux serveurs (`main` et branche) ont été lancés en local, avec l'index versionné. Les réponses de l'API de recherche réelle sont identiques aux sorties du moteur ci-dessus : Auvergne, Thurins, Montluçon. L'aperçu gratuit de `/comparateur` ne montre pas la ligne « Vie étudiante » (matrice tronquée) ; il ne montre que l'identité, inchangée. La matrice complète (Pack) est vérifiée par le moteur et par les tests (`seedComparaison`).

## 5. Conséquences sur les résultats existants

1. **Dossiers déjà vendus** : aucun n'est modifié. Un dossier est figé dans son artefact. Les règles « vie étudiante » du dossier lisent l'attestation `etudesSup` (inchangée), et le score `vie_etudiante` n'y apparaît que comme référence de source, sans valeur. `engine-7` est inchangé, et aucune bande de rang ni identité de distribution ne bouge : `etudes_acces` et `vie_etudiante` ne sont pas des clés de rang (FUT-136 §7).
2. **Plateau lu dans la source.** 94 communes ont un accès arrondi à 0,00 dans l'index, mais un établissement à la limite des 25 km. Elles gardent leur rang (40 ou 41). Le plateau est identifié dans la BPE (accès exactement 0, compte 0), pas dans l'index.
3. **Écart résiduel.** Un rang par le milieu sur toutes les valeurs, et pas seulement sur le plateau, déplacerait encore 28 communes de 1 point (arrondi). Ce n'est pas appliqué (arbitrage 1) ; c'est déclaré dans `meta.etudesAcces`.
4. **Nouveaux résultats** : seules les nouvelles recherches, comparaisons et évaluations lisent l'index corrigé.

## 6. Limites et points ouverts pour la revue

1. **Cellule et avantage.** L'avantage suit toujours le score : rien n'est changé dans le classement. Une commune plafonnée peut donc mener, ou être à égalité, avec une cellule qui dit un niveau plus bas. Par exemple, Montluçon et Poitiers sont à égalité, avec « Présence étudiante intermédiaire / au moins un établissement… » face à « Forte présence étudiante ». C'est une sous-estimation, jamais une conclusion favorable. La lecture en deux lignes (présence du bassin, accès local) relève de **FUT-118**.
2. **Sous-estimation de l'agglomération.** 704 phrases disent un niveau **plus bas** que la part de leur bassin, parce qu'elles suivent le palier du score (règle FUT-135), par exemple Thurins « intermédiaire dans l'agglomération de Lyon ». Il y en avait 237 sur `main`. C'est prudent, mais inexact sur Lyon. Ce point aussi relève de FUT-118.
3. **Identité « Pour une ville étudiante à taille humaine. »** ~~Règle FUT-135 inchangée~~ **Levé par la contre-revue (§9.1)** : l'identité exige désormais la part étudiante du bassin au palier fort. Au premier passage, 125 communes la portaient avec une part sous ce palier (6 au palier limité), dont Montluçon, Gap, Vichy et Toulon.
4. **Combinaison 40/60.** 360 des 487 gardent une raison favorable par la seule part de leur agglomération. La phrase le dit (« … dans l'agglomération de X, aucun établissement supérieur recensé à moins de N km »). Aller plus loin demande une décision sur les pondérations.
5. **Rentrée 2025** (FUT-135 §3) : toujours non appliquée.
6. **Compte d'établissements.** L'index ne porte pas `establishmentCount` : la phrase dit « au moins un ».

## 7. Vérifications

- Tests : suite complète lancée seule, avec `--test-concurrency=1`. `main` donne 3 826/3 826, la branche **3 833/3 833**, soit les 7 tests ajoutés. Une première exécution de `main` avait rapporté 3 823 en omettant 3 tests de `fut142-ask-lecture.test.ts`, qui passent quand on le lance seul.
- `src/lib/fut141-vie-etudiante.test.ts` (7 tests, index réel et vrai moteur) :
  - le plateau (14 029 à 20, 94 arrondis non touchés) ;
  - Thurins ;
  - les 487 d'origine ;
  - les villes universitaires ;
  - le grain sur les 5 555 communes mesurées ;
  - Montluçon, Gap, Vichy, Vidauban ;
  - Balan et Belleu.
- Fichiers de test existants mis à jour : `fut135-vie-etudiante.test.ts` (5 attentes qui figeaient l'ancien plateau, annotées FUT-141) et la référence FUT-147 (§4.4).
- Contrôles FUT-135 rejoués sans modification : `controle-487.mjs` 0 faute ; preuve positive (revue 2) 0 violation ; bornes compte/accès (revue 3) 0 violation.
- `tsc --noEmit` : 0 erreur. `eslint` sur les fichiers touchés : 0 erreur, 1 avertissement antérieur (`tailleVilleFrom`). `index:verify` OK. Build OK (`prebuild` : index vérifié, accueil identique). `populate-bpe.py --selftest` OK.

## 8. Régénérer

```bash
npm run index:unpack
.venv-bpe/bin/python scripts/populate-bpe.py --selftest
.venv-bpe/bin/python scripts/fut141/plateau-etudes-acces.py --parquet data/bpe25.parquet               # rapport seul
.venv-bpe/bin/python scripts/fut141/plateau-etudes-acces.py --parquet data/bpe25.parquet --write-index # idempotent
npm run index:pack && npm run index:verify
node scripts/accueil/donnees-accueil.mjs --ecrire && node scripts/accueil/verifier-equivalence.mjs
node scripts/fut141/audit-fut141.mjs --photo <avant.json>                              # sur main
FUT141_LISTE=<avant.json> node scripts/fut141/audit-fut141.mjs --photo <apres.json>   # sur la branche, mêmes 487
node scripts/fut141/audit-fut141.mjs --comparer <avant.json> <apres.json>
node scripts/fut141/maj-reference-fut147.mjs                           # 0 écart attendu sur la branche
```

Ne pas relancer `populate-bpe.py --write-index` ni `populate-mismatch-rank.mts` pour ce ticket.

## 9. Contre-revue du 29/10/2026 : les deux réserves

La contre-revue indépendante a refusé `01a781cd` sur deux réserves. Les corrections, scores et classements du premier passage sont inchangés.

### 9.1 Identité « Pour une ville étudiante à taille humaine. »

**Arbitrage porteur : palier existant 66.** L'identité exige désormais, en plus des conditions FUT-135 (score `vie_etudiante` ≥ 55, pôle de son bassin, établissement du supérieur positivement attesté dans son rayon), une part étudiante du bassin au palier fort : `etudes_dyn` ≥ 66, la borne de `bandIndex`. Un score combiné favorable ne suffit plus. Le code ne change qu'à un endroit : `buildIdentiteCandidates` (`src/lib/comparateur-vie.ts`). `villeEtudianteLocale` (grain, synthèses) reste tel quel.

Photographie de toutes les communes avant et après (`scripts/fut141/identite-etudiante.mjs`, preuve : `identite-etudiante.json`) :

| | avant | après |
|---|---|---|
| communes candidates à l'identité | 259 | **134** |
| retirées | | 125 (119 au palier intermédiaire de part étudiante, 6 au palier limité) |
| ajoutées | | 0 |
| premiers libellés changés | | **53** |
| autres candidats d'identité modifiés | | 0 |
| candidates hors de la règle / règle satisfaite sans l'identité | | 0 / 0 |

Les chiffres concordent exactement avec la simulation indépendante (259 → 134, 53 libellés). Les 53 nouveaux premiers libellés : « Pour s'installer dans une commune qui gagne des habitants. » 24, « Pour une petite ville qui reste vraiment vivante. » 19, « Pour un cadre rural préservé, loin de l'agitation. » 6, « Pour un quotidien au calme, loin de l'agitation. » 4.

| Commune | part du bassin | score | identité candidate | premier libellé après |
|---|---|---|---|---|
| Montluçon | 63 | 70 | oui → **non** | « Pour un quotidien au calme, loin de l'agitation. » (était l'identité étudiante) |
| Vichy | 62 | 72 | oui → **non** | « Pour s'installer dans une commune qui gagne des habitants. » (était l'identité étudiante) |
| Gap | 60 | 68 | oui → **non** | inchangé : « Pour vivre en montagne dans une commune qui reste animée. » |
| Toulon | 62 | 75 | oui → **non** | inchangé : « Pour un quotidien méditerranéen, les pieds près de l'eau. » |
| Le Puy-en-Velay, Aurillac | 66 (à la borne) | 70, 72 | oui → oui | inchangé |

Les grandes villes universitaires gardent toutes l'identité (Poitiers, Rennes, Angers, Corte, Montpellier, Strasbourg, Toulouse, Lyon 1er, Nantes, Bordeaux, Lille, Dijon, Besançon, Limoges, Amiens, Reims, Nancy, Metz, Clermont-Ferrand, Pau, Tours, Orléans, Caen, Rouen, Brest, Le Mans, Saint-Étienne, Grenoble, Nice). Les communes de campus hors pôle (Talence, Villeurbanne, Pessac…) ne l'avaient pas et ne l'ont toujours pas (règle FUT-135). Exemples de retraits parmi les grandes villes : Avignon, Dunkerque, Béziers, Cherbourg-en-Cotentin, Saint-Nazaire, Colmar, Montauban, Meaux, Saint-Quentin, Bayonne, Arles, Bastia, Saint-Malo, Brive, Charleville-Mézières, Carcassonne, Chalon-sur-Saône.

L'identité affichée sur une carte vient d'une passe de groupe (`assignIdentite`) parmi ces candidats : les 18 recherches de contrôle et la référence FUT-147 n'en affichent aucune différence (§9.3).

### 9.2 Les vrais zéros, prouvés dans la BPE brute

**Source.** Base permanente des équipements (BPE) 2025 de l'INSEE, fichier « BPE25.parquet », page https://www.insee.fr/fr/statistiques/8217525 (mention « Paru le 05/10/2026 » à la date de la vérification). Millésime lu dans la donnée : colonne `AN` = 2025 sur les 2 921 770 lignes.

- Fichier utilisé pour l'index (`data/bpe25.parquet`, hors dépôt, téléchargé le 16/08/2026) : sha256 `cdf81640…0051388`.
- Fichier officiel téléchargé le 29/10/2026 à 09:50 UTC : sha256 `d3815ac7…69f0e`.
- Les deux fichiers ont le même schéma (95 colonnes) et le même nombre de lignes. Selon la vérification locale, les **2 298 enregistrements du supérieur** (C501, C502, C503, C504, C505, C509) sont **identiques champ pour champ** dans les deux versions (même empreinte canonique du sous-ensemble). Cette comparaison historique n'a pas été vérifiée indépendamment par Work : seul le fichier officiel du 29/10 lui est transmis.
- **6 616 lignes** diffèrent (correction : ce rapport indiquait 6 596, qui est le nombre de lignes dont les coordonnées changent). Toutes sont d'autres types (A303 à A507, E101…) ; aucune ne touche le supérieur. Les écarts tiennent notamment aux changements de statut de diffusion des personnes physiques (`STATUT_DIFFUSION`) : **3 052 enregistrements** sont passés de diffusibles (`O`) à non diffusibles (`P`), 3 557 dans l'autre sens, 7 entre `O` et `_Z`. Les champs touchés peuvent comprendre le nom, l'adresse, les coordonnées, l'IRIS et les zonages.
- Le fichier du 16/08 contient donc des données personnelles que l'INSEE ne diffuse plus. Il reste en local et n'est pas transmis, pour des raisons de protection des données personnelles.
- La preuve a été rejouée sur les deux fichiers : résultats identiques, à l'empreinte près. `preuve-zeros-bpe.json` est la sortie sur le fichier officiel.

**Méthode de reproduction indépendante** (`scripts/fut141/preuve-zeros-bpe.py`) : aucune fonction du producteur n'est importée. Seules ses conventions sont reprises, écrites en clair et vérifiées contre l'index :

1. équipements : C501 à C505 et C509 dont les coordonnées WGS84 sont renseignées (2 295 sur 2 298) ;
2. centre de commune : lat/lon de l'index (le producteur lit les mêmes) ;
3. rayon recalculé depuis la population de l'unité urbaine (somme des populations communales), sinon de la commune : 5, 10, 15 ou 25 km ;
4. distance de grand cercle (R = 6 371 km), calculée par **force brute**, chaque commune contre chaque établissement, sans la grille spatiale du producteur ;
5. accès pondéré = Σ (1 − d/25) sur les établissements à d ≤ rayon ;
6. rang de `main` : `bisect_right`, arrondi ; plateau zéro après correction : par le milieu.

**Résultats (0 faute) :**

| Contrôle | Résultat |
|---|---|
| rayons recalculés = `etudesSup.radiusKm` | 34 788 / 34 788 (5 km : 1 001, 10 km : 1 084, 15 km : 1 008, 25 km : 31 695) |
| accès recalculé, arrondi à 2 décimales = `etudesSup.weightedAccess` | 34 788 / 34 788, écart maximal 0 |
| accès nul ⇔ compte nul ⇔ plus proche établissement au-delà du rayon | vrai pour toutes les communes |
| vrais zéros | **14 029** (rayon 5 km : 435, 10 km : 231, 15 km : 288, 25 km : 13 075) |
| rang de `main` rejoué | 34 788 / 34 788 ; plateau à 40 |
| index de la branche | exactement les 14 029 vrais zéros passent à 20, aucune autre valeur ne bouge |

**Les 94 arrondis, contrôlés à part.** Leur accès publié vaut 0,00 après arrondi, mais la source y atteste bien au moins un établissement : 79 en ont 1, 13 en ont 2, 2 en ont 3. Leur plus proche établissement est entre 24,876 et 24,999 km, toujours dans un rayon de 25 km. Leur accès réel ne dépasse pas 0,00498. Ils gardent leur rang (40 pour 60 d'entre eux, 41 pour 34) et ne sont pas touchés par la correction. Liste nominative dans `preuve-zeros-bpe.json` (`arrondisAZero.liste`).

**Écarts relevés, sans effet sur la correction :**

1. **Trois établissements sans coordonnées** ne peuvent pas être comptés : l'université de Mayotte (Dembeni) et le CNAM de Mayotte (Mamoudzou), dont les communes ne sont pas dans l'index, et une école d'architecture privée à Paris 5ᵉ, qui n'est pas un vrai zéro. Aucun vrai zéro n'est donc dû à une coordonnée manquante.
2. **Sensibilité à la sphère.** La marge entre le plus proche établissement et le rayon est médiane à 7,65 km, mais elle est inférieure à 1 km pour 1 095 vrais zéros, et à 100 m pour 107 d'entre eux (minimum 3 m : Siran, Méricourt, Banios). Recomptées sur l'ellipsoïde WGS84 (Vincenty), les 1 145 communes situées à moins de 500 m du rayon donnent **0 vrai zéro qui deviendrait une présence**. Dans l'autre sens, 43 communes créditées d'un établissement à ~24,97 km sur la sphère seraient à zéro sur l'ellipsoïde (Thionne, Sizun, Cristinacce…). Elles gardent leur rang. La convention sphérique du producteur est donc conservée : elle ne fait entrer aucune commune à tort dans le plateau corrigé, et elle n'en fait sortir que des communes dont l'accès vaut quelques millièmes.
3. Le centre de commune est celui de l'index (une coordonnée par commune), comme chez le producteur. La preuve ne valide pas ces centres ; elle établit que, pour ces centres et pour la BPE 2025, les 14 029 communes n'ont aucun établissement du supérieur dans leur rayon.

### 9.3 Non-régression

| Contrôle | Résultat |
|---|---|
| les 487 de référence (`audit-fut141.mjs`) | identiques au premier passage : forte 255 → 11, raison 487 → 360, trait d'ancre 96 → 0, identité 0 → 0 |
| 1 666 scores corrigés (`audit-vie-etudiante.mjs`, `main` → branche) | inchangés : forte → intermédiaire 244, intermédiaire → limitée 308 ; raisons −127 ; identités −125, 0 gagnée |
| 18 recherches de contrôle | identiques au premier passage, trios, pistes et cartes compris (17/18 trios identiques à `main`, comme avant) |
| 17 villes universitaires témoins | identiques à `main`, identité comprise |
| pôles Montluçon, Gap, Vichy, Toulon, Vidauban | scores et phrases inchangés ; seule l'identité candidate change (Vidauban ne l'avait pas) |
| grain des phrases | identique au premier passage (1 457 → 0 au-dessus du bassin, 704 en dessous, non modifiées : FUT-118) |
| référence figée FUT-147 (`maj-reference-fut147.mjs`) | 0 écart |
| contrôles FUT-135 | `controle-487.mjs` 0 faute ; preuve positive et bornes compte/accès : tests au vert |
| dossiers historiques, `engine-7`, bandes de rang, règles FUT-136 | non touchés (aucun fichier de ces domaines dans le diff) |
| suite complète, `--test-concurrency=1` | **3 834 / 3 834** (+1 test) ; sur l'arbre fusionné avec le `main` actuel (`55c9ade0`, FUT-155 et FUT-162 inclus) : **3 862 / 3 862**, fusion sans conflit |
| `tsc --noEmit` | 0 erreur |
| `eslint` sur les fichiers touchés | 0 erreur, 1 avertissement antérieur (`tailleVilleFrom`) ; les 6 erreurs du dépôt entier sont dans des fichiers que la PR ne touche pas |
| `index:verify` | OK (index inchangé depuis le premier passage, `2cca5831…`) |
| build | OK |

`scripts/fut135/reproductions-revue.mjs` ne se lance plus : il cherche Pont-Salomon dans le trio Auvergne, dont il est sorti dès le premier passage (§4.4). C'est un script de reproduction historique, pas un contrôle ; il n'a pas été modifié.

### 9.4 Rejouer

```bash
node scripts/fut141/identite-etudiante.mjs --photo <avant.json>      # sur 01a781cd
node scripts/fut141/identite-etudiante.mjs --photo <apres.json>      # sur la branche
node scripts/fut141/identite-etudiante.mjs --comparer <avant.json> <apres.json>
curl -L -o <dossier>/BPE25.parquet https://www.insee.fr/fr/statistiques/fichier/8217525/BPE25.parquet
git show 76095598:data/comparateur-index.json.gz > <index-main.json.gz>   # main avant FUT-141
.venv-bpe/bin/python -I scripts/fut141/preuve-zeros-bpe.py --parquet <dossier>/BPE25.parquet \
  --index-main <index-main.json.gz> --index data/comparateur-index.json.gz --sortie <preuve.json>
```
