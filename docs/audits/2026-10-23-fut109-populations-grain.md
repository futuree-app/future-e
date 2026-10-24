# FUT-109 · Trois populations à 0 : un défaut de grain, pas trois communes vides

Audit et correctif préparés les 23 et 24/10/2026. Branche `bonjourfuturee/fut-109-populations-communes-deleguees` (worktree `.claude/worktrees/fut109`), partie de `main` @ `3af53c3c`. Rien n'est poussé : voir §9.

**Révision du 24/10.** La première version (commit `11f60680`) corrigeait 71 communes en supposant la source dans la géographie du 01/01/2023. Vérification faite sur les fichiers Insee, la source est dans la **géographie du 01/01/2024**. Les 11 communes nouvelles du 01/01/2024 y sont déjà au bon grain (somme exacte de leurs communes fondatrices). Le correctif porte donc sur **60 communes**. La révision traite aussi les scores dont le dénominateur restait calculé sur l'ancien territoire (§5), et les libellés de millésime (§6).

## 1. En une phrase

Les trois codes ne sont **pas des communes déléguées** : ce sont des **communes de plein exercice rétablies le 01/01/2024**. La source de l'index n'a pas de population 2021 à leur grain, et elle écrit `0`. Le même défaut fausse en silence **57 autres communes** : la commune d'origine de ces rétablissements, les rétablissements et fusions du 01/01/2025, et les changements de code depuis le 01/01/2024. Exemple : Saint-Denis compte 113 942 habitants au lieu de 149 077. Le défaut touche aussi les **scores** qui divisent par cette population ou qui lisent la même géographie.

## 2. Les faits, dans les sources primaires

**Référentiel de l'index** : la liste des 34 788 communes vient de DRIAS (`data/data_climat.json`). Elle correspond exactement au **COG au 01/01/2025**, hors les trois villes PLM, remplacées par leurs 45 arrondissements. Le COG au 01/01/2026 est identique pour la métropole.

**Source de la population** : ADEME `data_communes` (data-fair `8ggfo546-mtjxy4lbqxcl462`), champ `population_totale_2021`. C'est la **population municipale (PMUN) Insee 2021**, portée dans la **géographie au 01/01/2024**. Les contrôles suivants sont reproduits à chaque construction du référentiel (§7) :
- **34 722 valeurs gardées sur 34 722** égalent la population légale 2021 de leur territoire.
- Une commune au territoire inchangé porte le PMUN 2021 de la commune.
- Une **commune nouvelle du 01/01/2024** porte la **somme exacte** des PMUN 2021 de ses fondatrices : Bazeilles 2 502 = 2 365 + 137, Oullins-Pierre-Bénite 37 628 = 27 113 + 10 515. Elle est au bon grain.
- Une **commune rétablie le 01/01/2024** vaut `0` : le recensement 2021 ne la sépare pas de sa commune d'origine, qui garde son ancien périmètre (Essarts-en-Bocage 9 399 au lieu de 6 851).
- Après le 01/01/2024, la source garde la valeur d'avant le mouvement, ou n'a pas le code (transfert de chef-lieu).

La base Insee « Évolution et structure de la population 2021 » (`populate-demographie.py`) suit la même géographie, avec les mêmes trous. Les rétablies y figurent sans valeur, et les communes absorbées en 2024 n'y figurent plus.

| Code | Statut au COG 2025 | Histoire (`v_mvt_commune_2025.csv`) | ADEME 2021 | Insee 2022 (géo 2024) | **Insee 2023 (géo 2025)** |
|---|---|---|---|---|---|
| 60694 Les Hauts-Talican | commune | Villotran ; 01/01/2019 fusion dans Les Hauts-Talican (60054) ; **01/01/2024 rétablissement** : Beaumont-les-Nonains reprend 60054, le reste garde le nom sous 60694 | **0** | 547 | **542** |
| 85165 L'Oie | commune | déléguée d'Essarts-en-Bocage de 2016 à 2023 ; **rétablie le 01/01/2024** | **0** | 1 264 | **1 250** |
| 85212 Sainte-Florence | commune | idem | **0** | 1 338 | **1 359** |
| 85084 Essarts-en-Bocage | commune nouvelle | perd L'Oie et Sainte-Florence le 01/01/2024 | 9 399 (avant séparation) | 6 835 | **6 851** |
| 60054 Beaumont-les-Nonains | commune | rétablie le 01/01/2024 | 878 (ex-Hauts-Talican) | 337 | **339** |

**Absence, inconnue, zéro** : ce sont trois choses distinctes. Le `0` d'ADEME n'est **pas** une population nulle, c'est une absence au grain. À l'inverse, six villages détruits de la Meuse (Fleury-devant-Douaumont…) ont réellement **0 habitant** selon l'Insee. ADEME ne les porte pas, et l'index les laisse `null` (§8).

## 3. La règle

**Règle** (`scripts/lib/population-grain.mjs`) : la valeur 2021 est gardée si le territoire **et** le code sont inchangés depuis le 01/01/2024, rétablissements de cette date compris. Sinon, l'index reçoit la **population de référence Insee 2023** (PMUN, limites au 01/01/2025), publiée dans la géographie même du référentiel.
- Mouvements du COG pris en compte : 21, 31, 32 et 33 pour le territoire, 41 et 50 pour le code.
- Aucune somme reconstituée, aucun report d'une commune nouvelle sur une déléguée.
- Sans valeur officielle, la population est `null`, jamais `0`.
- **Preuve intégrée** : `construire-referentiel.mjs` refuse si une valeur gardée n'égale pas la population légale 2021 de son territoire. Contrôle : avec la géographie de 2023, il refuse bien (8 écarts).

| Groupe (60 communes) | Nombre | Exemple |
|---|---|---|
| Rétablissements du 01/01/2024 (rétablies et communes d'origine) | 5 | L'Oie 0 → 1 250 ; Essarts-en-Bocage 9 399 → 6 851 |
| Rétablissements du 01/01/2025 (Cantal) | 5 | Neussargues-Moissac 1 653 → 824 ; Celles, absente → 217 |
| Communes nouvelles du 01/01/2025 | 46 | Saint-Denis 113 942 → 149 077 |
| Changements de code (transferts de chef-lieu) depuis le 01/01/2024 | 4 | Orée d'Anjou, absente → 17 162 |
| *Retirées par rapport au 23/10 : fusions du 01/01/2024, déjà au grain* | *11* | *Bazeilles garde 2 502* |

## 4. Consommateurs de la population elle-même

Les mesures comparent l'index de `main` à l'index régénéré dans un espace isolé (§7).
- **Accueil, pastille « taille »** : `Environ 0 habitants à L'Oie.` devient `Environ 1 250 habitants à L'Oie.` Même effet sur Sainte-Florence et Les Hauts-Talican. Les dossiers Territoire et Adresse affichent le même texte.
- **Comparateur, éligibilité** (plancher de 1 500 habitants) : 10 changements.
  - 9 communes entrent : Orée d'Anjou (17 162), Porte des Pierres Dorées, Aurseulles, Conques-en-Rouergue, Pays-de-Montbenoît, Plumieux, Verdun-Ciel, Val-de-la-Hune, Sauzé-entre-Bois.
  - 1 sort : Neussargues-Moissac (824).
- **Taille** : 12 catégories changent (6 « incertain » → village, 2 → petite, 4 village → petite) et 8 paliers passent de « Plutôt rural » à « Petite ville ».
- **Homonymes** : « Sainte-Florence » désignait celle de Gironde (147 habitants), elle désigne désormais celle de Vendée (1 359).
- **`uu_pop`** : 512 communes changent. L'unité urbaine de Paris passe de 10 858 372 à 10 893 507 habitants.
- **Lectures ADEME à l'exécution** (`src/lib/commune-data.ts`) : AskFuture, synthèse logement et repli du dossier Territoire lisaient la valeur brute, soit **0 pour L'Oie**. Elles reçoivent désormais la même population que l'index (§6).

## 5. Scores et indicateurs à dénominateur démographique

Chaque score a été **rejoué localement, sans réseau**, sur les caches du checkout principal. **Reproduction exacte** de l'index de `main` (0 écart) pour la vie locale, la démographie et la part étudiante (rentrée 2024), et pour les rayons BPE. Les effets sont mesurés sur ce que lit le lecteur : verdicts de rang des règles d'accord et de désaccord (seuil des 20 % extrêmes), paliers ambiants et seuils de catégorie.

**Différence de millésime ou de territoire** :
- **Différence de millésime** : la valeur décrit le bon territoire à une autre date (2021, 2022 ou 2023). Elle est **acceptée et datée** (§6).
- **Incompatibilité de territoire** : le numérateur, le dénominateur ou la valeur décrivent un autre territoire que la commune actuelle. Elle est **corrigée** quand les sources le permettent exactement, sinon **abstention**.

### 5.1 Vie locale (`vieLocale`) : incompatibilité de territoire, corrigée

Le score est une densité : compte / (population + 1 000).
- **Dénominateur** : la population de l'index. Elle est désormais au grain.
- **Lieux** (OSM) : rattachés au centroïde le plus proche parmi les communes du COG 2025. Ils sont déjà au bon territoire.
- **Associations** (RNA) : rangées sous le **code de la commune de l'adresse**, souvent un code disparu. Orée d'Anjou compte 15 associations sous 49126 et 511 sous son ancien code 49069. Saint-Denis compte 3 283 associations, et 538 de plus sous Pierrefitte. Corriger le seul dénominateur aurait aggravé l'écart : Orée d'Anjou passait de 88 à 2.

**Correctif** :
1. **Codes repris** : une association rangée sous une commune absorbée, ou sous l'ancien code d'un transfert de chef-lieu, est comptée dans la commune qui a repris ce code. Le rattachement est exact, puisque c'est le territoire actuel de cette commune : 1 812 associations sont concernées.
2. **Abstention pour les 10 communes touchées par un rétablissement** : le RNA ne répartit pas leurs associations, qui restent rangées sous la commune d'origine (27 associations de L'Oie sont rangées sous Essarts-en-Bocage). Les répartir par le nom de commune saisi dans l'adresse serait une reconstitution sur texte libre : refusée.

**Effets** (verdict au seuil de 20 %) :
- **Dans les 60 communes**, 50 scores changent.
  - Abstentions : 10, rendues « incertain ». L'Oie (54) et Sainte-Florence (83) n'affichent plus de rang favorable fondé sur une population nulle.
  - Le verdict change pour 9 communes. Passent de « favorable » à « neutre » : Saint-Denis (63 → 49), Orée d'Anjou (88 → 31), Pays-de-Montbenoît (64 → 40), Laigné-Saint-Gervais, Sauzé-entre-Bois, Cugand-la-Bernardière. Passent de « en retrait » à « neutre » : La Neuville-au-Temple et Morville-le-Héron. Tannay-le-Mont-Dieu passe de « neutre » à « en retrait ».
- **Hors des 60**, le percentile bouge d'un point pour 497 communes. Cela fait changer 11 verdicts, 19 paliers ambiants et 17 seuils de catégorie (12 au seuil « faible » de 30, 5 au seuil « forte » de 60), tous en limite de seuil.

### 5.2 Démographie (`demographie`) : incompatibilité de territoire, abstention

Le taux annuel 2015-2021, la part d'arrivants et le récit sont calculés par l'Insee sur le territoire de 2024 : pour les 56 communes au territoire modifié depuis, c'est l'**ancien périmètre**. La population de l'index n'y sert que de poids de lissage. Recalculer ce score avec la population corrigée ne change donc pas le récit, mais garde un récit faux.

**Preuve que le récit change**. Diagnostic non publié : pour 45 fusions, les comptages P15 et P21 des communes fondatrices permettent de reconstituer **exactement** le taux du nouveau territoire. Dans **17 cas sur 45, le récit change de catégorie**. Exemples : Pern-Lhospitalet passe de « gagne des habitants et attire » à stable, Les Trois-Saints et Plumieux de « gagne » à « perd », Hesdin-la-Forêt de stable à « perd ».

**Pourquoi ne pas publier cette reconstitution** :
- La part d'arrivants n'est pas additive : un déménagement entre deux communes fondatrices compte comme une arrivée.
- Le récit en dépend.
- Les rétablissements ne sont pas reconstituables avec cette base.

**Correctif** : **abstention**, la démographie est `null` pour les 56 communes au territoire modifié.
- Le comparateur traite déjà `null` comme « non noté », sans pénalité.
- Le dossier n'affiche ni carte ni phrase.
- Le rang passe à « incertain ».

Effet : 49 communes perdent un récit qui décrivait un autre territoire. Hors des 60, 191 percentiles bougent d'un point, et 4 verdicts changent en limite de seuil. Les 4 changements de code restent `null`, comme aujourd'hui. Les ré-étiqueter avec l'ancien code serait exact (même territoire), mais c'est une option à décider.

### 5.3 Part étudiante (`etudes_dyn`) : pas d'incompatibilité, non relancée

Le score est l'effectif du MESR divisé par la population de l'unité urbaine, ou de la commune hors unité urbaine.
- **Avec la population corrigée** : les 11 communes aujourd'hui `null` recevraient 88, la valeur conventionnelle de tous les bassins de moins de 5 000 habitants (voir §8). Aucun autre écart notable : l'unité urbaine de Tréguier gagne un point par simple effet de percentile.
- **Pourquoi elle n'est pas relancée** : la source MESR est passée à la rentrée 2025. Relancer ce score changerait 425 communes, hors du périmètre de FUT-109.
- **Conséquence** : les 11 communes restent non notées, une abstention de fait. C'est honnête, et c'est documenté dans `meta.population.conventions`.

### 5.4 Équipements (BPE : écoles, culture, accès au supérieur, attestations d'absence) : aucun effet

Le rayon de recherche dépend de la taille de ville (seuils de 30 000, 100 000 et 500 000 habitants). Recalculé avant et après sur les 34 788 communes, **aucun rayon ne change**, et les rayons publiés sont retrouvés exactement. Les comptages se font autour du centroïde et ne dépendent pas du territoire.

### 5.5 Indicateurs ADEME de la géographie 2024 : incompatibilité de territoire, **blocage documenté**

Les indicateurs concernés sont :
- dans l'index : densité 2022 (critère « calme » et indicateur « dense »), APL (accès aux soins), éloignement des services, part de logements sociaux, air ;
- dans le dossier, à l'exécution : densité, logements vacants, revenu médian, vieillissement.

Ces indicateurs sont dans la géographie du 01/01/2024.
- **Rétablies de 2024** : leurs valeurs 2022 sont au bon grain. La densité de L'Oie (89,65 hab./km²) et d'Essarts-en-Bocage (99,78) correspond aux nouveaux territoires (14,1 et 68,5 km² implicites).
- **Fusions et rétablissements de 2025 (47 communes)** : ADEME décrit la commune d'avant, sous son ancien nom (« May-sur-Orne » pour 14408, « Vars » pour La Boixe, « Hesdin » pour Hesdin-la-Forêt). La densité y vaut population 2022 / surface de l'ancienne commune.

**Pourquoi c'est un blocage** : il n'y a pas, en local, de source pour les recalculer exactement.
- ADEME ne publie pas encore la géographie 2025.
- Les lignes ADEME des codes absorbés sont incomplètes : Pierrefitte n'a pas de densité.
- La surface officielle n'était pas joignable (geo.api.gouv.fr refuse la connexion).

Ce défaut existe sur `main` avant FUT-109, et FUT-109 ne l'aggrave pas. **Atténuation livrée** : AskFuture reçoit pour ces communes la mention « Hors population, les indicateurs ADEME de ce bloc décrivent le territoire d'avant ».

**Décision demandée** (une des trois) :
- (a) abstention de ces indicateurs pour les 47 communes, dans l'index et dans le dossier ;
- (b) densité recalculée à partir de la population 2023 et de la surface IGN du COG 2025, quand la surface est disponible ;
- (c) attendre la mise à jour ADEME (FUT-78).

La part de déplacements en voiture (MOBPRO 2022, géographie 2024) relève du même cas.

### 5.6 Hors index

`populate-dependance-auto.js` écrit une table Supabase (200 premières communes, densité ADEME). C'est la production : non touchée.

## 6. Provenance : millésimes et conventions

**Ce qui était faux** : plusieurs formulations datent toute la France de 2021.
- La population du dossier Territoire (`vintage: "2021"`).
- La phrase des contraintes de taille (« N habitants en 2021 »).
- Le prompt d'AskFuture (« Population (2021) », sur la valeur ADEME brute).

**Ce qui est livré** :
- `src/lib/population-millesimes.generated.ts`, généré par `construire-referentiel.mjs` et contrôlé par un test contre le JSON : les 60 communes, leur millésime, leur dernier mouvement et leur unité urbaine, plus les **12 unités urbaines qui comptent une commune reprise**. 7 mêlent 2021 et 2023, et 5 sont entièrement en 2023.
- `src/lib/population-millesime.ts` : `millesimePopulation`, `millesimesAgglomeration`, `perimetreAnterieur`, `enMillesimes`.
- Dossier Territoire : le millésime de la population suit la commune (« 2023 » pour L'Oie).
- Contraintes de taille : « (149 077 habitants en 2023) » pour la commune de Saint-Denis, « (10 893 507 habitants selon les chiffres Insee 2021 et 2023) » pour l'agglomération de Paris. La phrase est inchangée ailleurs, et une référence enregistrée avant le correctif garde sa phrase.
- `commune-data.ts` : la population ADEME brute est remplacée par celle du référentiel, avec son millésime. AskFuture affiche le bon millésime et la mention de périmètre (§5.5).
- Métadonnées de l'index : `meta.population` (source, grain, règle, **conventions**), `meta.uuPop.millesimes` et l'approximation « population/densité ».
- L'accueil n'écrit pas d'année (« INSEE · population communale ») : rien à changer.

**Conventions** (inscrites dans `meta.population.conventions`) :
- **Population communale** : 2021 pour toutes les communes, sauf les 60 du référentiel (2023). Le millésime affiché suit la commune, jamais « 2021 » pour toute la France.
- **Unités urbaines** : `uu_pop` est la somme des populations communales de l'index. Une unité urbaine qui compte une commune du référentiel mêle 2021 et 2023, et se dit « selon les chiffres Insee 2021 et 2023 ». Cinq unités urbaines, entièrement composées de communes reprises, sont en 2023.
- **Scores dépendants** : voir §5 (codes RNA repris, abstentions, rangs recalculés pour ces deux critères).
- **Absences** : les six villages de la Meuse sont `null` (« non lue »), pas `0`.
- La migration générale vers 2023 reste hors périmètre (FUT-78).

## 7. Validation, en espace isolé

Les artefacts régénérés n'ont été produits que dans une **copie du dépôt dans le scratchpad**. Les artefacts du worktree sont ceux de `main`, intacts.

| Contrôle | Artefacts de `main` | Artefacts régénérés |
|---|---|---|
| `npm test` | 2 986 tests, 5 échecs : les tests de garde sur les artefacts détectent le défaut | **2 986/2 986** |
| `tsc --noEmit` | 0 erreur | 0 erreur |
| `eslint` (fichiers modifiés) | 0 erreur | 0 erreur |
| selftests Python (vie locale, démographie) | OK | OK |
| `verifier-equivalence.mjs` (34 791 codes) | — | 104 373/104 373 lectures identiques |
| `construire-referentiel.mjs` | — | identique octet pour octet sur deux exécutions ; refuse une règle fausse |
| Rangs (`populate-mismatch-rank.mts --recalculer …`) | — | 0 bande modifiée hors des deux clés déclarées |

**Diff de l'index** : 6 champs seulement, plus `meta`.
- `population` : 60 communes, toutes dans le référentiel.
- `uu_pop` : 512 ; `uu_count` : 8.
- `vieLocale` : 1 074 ; `demographie` : 241.
- `rankBands` : 29 642, surtout des décalages d'un point de base dus à l'effectif de la distribution.

## 8. Constats hors périmètre (antérieurs à FUT-109, non corrigés)

1. **Rangs désynchronisés sur `main`.** Les bandes de rang `acces_ecoles` (11 676 communes), `acces_culture` (25 792) et `acces_services` (34 726, plus 62 sans bande) ne correspondent plus aux scores actuels : BPE 2025, puis centralité ANCT. Le garde-fou du script de rang refuse toute régénération, si bien que les règles d'accord et de désaccord du dossier lisent des rangs périmés. Le correctif FUT-109 ne recalcule que ses deux clés. **Ticket recommandé.**
2. **Associations sous des codes disparus avant 2024.** 10 031 associations actives, sur 570 communes nouvelles plus anciennes, ne sont comptées nulle part dans la vie locale. Le mécanisme `codesRepris`, alimenté par tout l'historique du COG, les corrigerait. **Ticket recommandé.**
3. **Part étudiante d'un petit bassin à 88.** Les 30 507 communes dont le bassin compte moins de 5 000 habitants reçoivent le percentile du haut de leur ex æquo (88) au lieu d'une valeur basse ou d'une abstention. Le critère « vie étudiante » en hérite. **À examiner.**
4. **Villages détruits de la Meuse** (population officielle 0) : affichage à décider.
5. **`?? 0` de `comparateur-vie.ts`** (palier de taille, signature, homonymes) : une population `null` y est lue comme 0. Risque potentiel, à traiter après #84.

## 9. Séquence GitHub et procédure après #84

**Branche locale, rien de poussé** :
- `11f60680` est conservé ;
- la révision du 24/10 forme un second commit.

`data/comparateur-index.json.gz` et `src/data/accueil-communes.json`, que #84 modifie, ne sont **ni régénérés ni commités** sur la branche. Les tests de garde y échouent donc jusqu'à l'intégration : la branche **n'est pas prête pour une PR**.

Après la fusion de #84 :

```bash
git fetch origin && git rebase origin/main                 # branche FUT-109
npm run index:unpack
node scripts/populate-population-grain.mjs                 # 60 communes reprises
node scripts/populate-uu-pop.mjs
.venv-bpe/bin/python scripts/populate-vie-locale.py --write-index     # caches data/.cache requis (OSM, RNA, AMALIA)
.venv-bpe/bin/python scripts/populate-demographie.py --write-index    # cache insee-evol-pop.zip
node scripts/populate-mismatch-rank.mts --recalculer vie_locale,croissance_demographique
npm run index:pack
node scripts/accueil/donnees-accueil.mjs --ecrire
```

Une modification de `src/lib/comparateur-vie.ts` est nécessaire **après #84 et avant la PR**. Sans elle, le comparateur lit une vie locale `null` comme `0`. Essarts-en-Bocage, seule commune éligible parmi les abstentions, serait alors classée dernière en vie locale au lieu d'être « non notée » :

```ts
case "vie_locale":
  // FUT-109 : un rétablissement n'est pas noté (associations non réparties) ; ailleurs, null = rien de mesurable.
  return c.vieLocale?.score ?? (populationHorsGrain(c.insee)?.retablissement ? null : 0);
```

Puis :

```bash
npm test && npx tsc --noEmit && node scripts/accueil/verifier-equivalence.mjs
git add data/comparateur-index.json.gz src/data/accueil-communes.json src/lib/comparateur-vie.ts && git commit
```

Les caches `data/.cache` (OSM, RNA, AMALIA, insee-evol-pop) sont ceux du checkout principal. Le rejeu les a lus sans réseau ni écriture. Les comparer à des téléchargements frais changerait d'autres communes.

**Reconstruire le référentiel** (inutile tant que les sources ne changent pas) :
1. Télécharger `v_mvt_commune_2025.csv` (Insee 8377162), puis `donnees_communes.csv` des deux archives : 8680726 (populations de référence 2023) et 7739582 (populations légales 2021).
2. Lancer `node scripts/fetch-communes-population.mjs`.
3. Lancer `node scripts/population/construire-referentiel.mjs --mvt … --pl2023 … --pl2021 …`.

Le script réécrit le JSON et le module TypeScript généré.

## Sources

- Insee, COG au 01/01/2025 (mouvements, communes) : https://www.insee.fr/fr/information/8377162
- Insee, populations légales 2021 (limites au 01/01/2023) : https://www.insee.fr/fr/statistiques/7739582
- Insee, populations légales 2022 (limites au 01/01/2024) : https://www.insee.fr/fr/statistiques/8290591
- Insee, populations de référence 2023 (limites au 01/01/2025) : https://www.insee.fr/fr/statistiques/8680726
- Insee, évolution et structure de la population 2021 : https://www.insee.fr/fr/statistiques/8201904
- ADEME, `data_communes` : https://data.ademe.fr/datasets/8ggfo546-mtjxy4lbqxcl462
- Ministère de l'Intérieur, RNA (waldec, juin 2026) : https://www.data.gouv.fr/datasets/repertoire-national-des-associations
- MESR, effectifs d'étudiants inscrits (atlas régional) : https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables
