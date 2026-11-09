# FUT-185 · Où vivre et accueil : une densité moyenne ne dit ni ruralité ni dépendance à la voiture

10/11/2026 · branche `bonjourfuturee/fut-185-ou-vivre-supprimer-les-faux-libelles`, basée sur `main` `1ab56bfb`
Correctif : `2b6c4872`. Scripts et sorties : [`2026-11-10-fut185-libelles-densite/`](2026-11-10-fut185-libelles-densite/).

## En une minute

Une commune dont la densité **moyenne** passe sous 1 500 hab/km² recevait la catégorie `rural_peri_urbain`. Ce n'était pas 738 communes, ni même 3 612 : c'étaient **34 134 communes sur 34 788** (98 %), dont les 3 612 communes urbaines Insee (classes 1 à 4) relevées par FUT-180. L'accueil en tirait trois choses fausses pour presque toute la France :

1. une accroche et une introduction qui parlaient de « dépendance à la voiture » (28 330 et 12 227 communes) ;
2. une carte « Mobilité » qui disait « le quotidien dépend largement de la voiture » (34 152 communes) ou « transports et courtes distances » (636), **sous la source « INSEE MOBPRO », sans jamais lire MOBPRO**. La catégorie montagne suffisait à produire la première : Grenoble (32 % de trajets domicile-travail en voiture) la recevait ;
3. des questions bâties sur une ruralité supposée : « Quitter la ville pour Nîmes ? », « S'installer à Avignon ? », « Mon mode de vie à Quimper repose-t-il trop sur la voiture ? ».

Après correctif : **0** accroche, **0** introduction et **0** carte ne déduisent la voiture d'une catégorie. La carte Mobilité porte la part réelle des actifs qui vont travailler en voiture (Insee, RP 2022, MOBPRO) pour les 30 048 communes mesurées, et n'existe pas pour les 4 740 autres. Aucun score, rang ni seuil de classement ne bouge : le seuil n'a jamais servi au classement. Les snapshots Territoire et les dossiers figés ne bougent pas.

Une décision reste au porteur (§ 7) : sans source fiable de ruralité, les communes réellement rurales perdent aussi « S'installer à X ? » et « Quitter la ville pour X ? ». Une option chiffrée permet de les leur rendre par le statut d'unité urbaine, sans la confondre avec la périurbanité.

## 1. Diagnostic : où vit le seuil, qui le lit

### 1.1 Les usages de 1 500 hab/km²

| Fichier | Rôle | Nature | Touché |
|---|---|---|---|
| `src/lib/comparateur-vie.ts` `deriveCategoriesFromEntry` (l. 820 avant) | `dense` / `peuDense`, d'où `rural_peri_urbain` et la garde de 4 autres catégories | narratif (choix d'angle de l'accueil) | **oui** |
| `src/lib/territoire/facts.ts` `densityCategory` | « Commune dense / Densité intermédiaire / Commune peu dense » de la carte d'identité Territoire | narratif Territoire | non : FUT-184 (grille DENS7) |
| `src/lib/territory-mood.ts` `pickDensity` | champ `mood.density` | aucun lecteur dans `src/` | non |
| `src/lib/comparateur-vie.ts` / `comparateur-scores.ts` `CALME` | un point d'ancrage (1 500 → 80) de la courbe continue du critère calme | **score** | non : ce n'est pas un seuil de catégorie |

`deriveCategoriesFromEntry` n'a que deux appelants : `/api/landing-signals` (l'accueil) et `src/lib/server/territoire-snapshot.ts`, qui n'en lit que le type d'ambiance (montagne, méditerranée, littoral). **Aucun chemin de score ou de classement du comparateur ne l'appelle** (`grep` des appelants, et `subScore` ne lit `densite` que pour le calme). Le correctif ne peut donc changer ni note, ni rang, ni ordre du comparateur.

### 1.2 Les cinq catégories gardées par `peuDense`

| Catégorie | Règle (inchangée sauf la 1re) | Ce qu'elle déclenchait | Fondement |
|---|---|---|---|
| `rural_peri_urbain` | densité < 1 500 | accroche et intro « dépendance à la voiture », état vide « déplacements », carte « dépend largement de la voiture », questions `acheter_rural`, `quitter_ville`, `mobilite_fragile` ; transmise au modèle de `/qna` | **aucun** : une moyenne sur une surface communale |
| `periurbain_dependance_auto` | densité < 1 500 et part voiture MOBPRO au 60e percentile ou plus (soit ≥ 89,1 %) | les mêmes textes ; questions `mobilite_fragile`, `voiture_electrique` | une mesure MOBPRO, mais le nom dit « périurbain » |
| `rural_agricole` | densité < 1 500 et couvert OSO agricole ≥ 30 % | carte sols secs (DRIAS), intro « vie agricole », carte Nature « espaces agricoles », **carte voiture**, questions `metier_agricole`, `eau_potable` | couvert OSO (seuils : FUT-182) |
| `rural_forestier` | densité < 1 500 et forêt OSO ≥ 35 % | carte feux (DRIAS), carte Nature, **carte voiture**, questions `feux`, `randonner_ici` | couvert OSO (seuils : FUT-182) |
| `faible_vie_locale` | densité < 1 500 et vie locale ≤ 30 | question `vielocale_reelle` | indice vie locale (FUT-137) |

À cela s'ajoutent `montagne` et `rural_viticole`, qui entraient aussi dans la « dépendance à la voiture » de la carte (`carDependent`, `recits.ts`).

### 1.3 Les chemins jusqu'au lecteur

- **Accueil** (`FutureELanding.tsx`) : catégories de la table manuelle Supabase `communes_categorization` (44 lignes) si la commune y figure, sinon `/api/landing-signals`. Elles pilotent `getHeroCopy`, `getQuestionIntro`, `getEmptyStateCopy`, `getPreviewCards` et le choix des 4 questions (`buildTensions`, catalogue Supabase `tensions_catalog`).
- **`/qna`** : les catégories reçues du navigateur partaient au modèle (`user_profile.commune_categories`), clés brutes comprises (`rural_peri_urbain`, `periurbain_dependance_auto`).
- **Snapshots Territoire** : type d'ambiance seulement.
- **`/api/ask`** : lit la table manuelle ou le repli par département (`commune-categories.ts`), jamais la règle des 1 500.
- **Comparateur, dossiers, synthèses** : n'appellent pas ces catégories.

## 2. Reproduction des chiffres de FUT-180

Chaîne FUT-180 (branche `docs/fut-180-grille-densite-insee`, `d9f83ad7`), rejouée telle quelle sur trois révisions, sources Insee vérifiées par empreinte :

| Mesure (communes urbaines Insee 1-4 sous 1 500 hab/km²) | FUT-180 annoncé | `51a493d0` | `main` `1ab56bfb` | correctif `2b6c4872` |
|---|---|---|---|---|
| communes / habitants | 3 612 / 20 332 264 | 3 612 / 20 332 264 | 3 612 / 20 332 264 | 3 612 / 20 332 264 |
| portent `rural_peri_urbain` | 3 612 | 3 612 | 3 612 | **0** |
| accroche « dépendance à la voiture » | 2 792 | 2 792 | 2 792 | **0** |
| intro « dépendance à la voiture » | 1 523 | 1 523 | 1 523 | **0** |
| carte « dépend largement de la voiture » | 3 612 | 3 612 | 3 612 | **0** |
| dont imputables au proxy de densité | 3 322 | 3 322 | 3 322 | 0 |
| dont restant par la catégorie montagne | 290 | 290 | 290 | **0** |

Les cinq chiffres sont reproduits exactement, sur l'ancienne révision comme sur `main`. Les sections 01 à 06 de FUT-180 sont identiques sur `main` et sur le correctif (aucune donnée de l'index ne change).

**Écarts avec mon propre rejeu** (§ 3), tous expliqués :
- mon rejeu applique la **table manuelle**, comme l'accueil réel ; FUT-180 ne lit que l'index. D'où 3 603 cartes « dépend largement » au lieu de 3 612 (9 communes urbaines de la table manuelle, dont Aix-en-Provence, recevaient l'autre phrase, « transports et courtes distances ») et 3 093 états vides au lieu de 3 094 ;
- après correctif, la chaîne FUT-180 compte « 0 carte Mobilité présente » : son script appelle `getPreviewCards` sans la mesure, la nouvelle carte n'y peut donc pas naître. Mon rejeu passe la mesure de l'index, comme `/api/landing-signals`.
- FUT-180 ne mesurait que le périmètre urbain. Le défaut touchait en réalité **98 % des communes** (34 134), rurales comprises.

## 3. Effets nationaux avant/après

Rejeu du **vrai code** de chaque révision sur chaque commune de l'index (`01_rejouer.mts`), table manuelle et catalogue de questions de production relevés le 10/11/2026 en lecture seule. Les nombres comptent les communes pour lesquelles un texte **serait** produit si un lecteur les saisit, pas des vues mesurées.

### 3.1 France (34 788 communes, 62,7 millions d'habitants)

| Sortie | Avant | Après |
|---|---|---|
| catégorie `rural_peri_urbain` (index) | 34 134 | **0** |
| idem, vue par l'accueil (table manuelle comprise) | 34 115 | 10 |
| catégorie `periurbain_dependance_auto` (index) | 12 203 | 12 203 |
| accroche « dépendance à la voiture » | 28 330 | **0** |
| intro des questions « dépendance à la voiture » | 12 227 | **0** |
| état vide « déplacements » | 29 848 | 11 213 |
| carte « dépend largement de la voiture » | 34 152 | **0** |
| carte « transports et courtes distances » | 636 | **0** |
| carte sourcée MOBPRO sans lire la mesure | 34 788 | **0** |
| carte portant la part voiture mesurée | 0 | 30 048 |
| aucune carte Mobilité (pas de mesure MOBPRO) | 0 | 4 740 (399 331 hab.) |
| question « Quitter la ville pour X ? » | 13 371 | 10 |
| question « S'installer à X ? » (`acheter_rural`) | 34 115 | 10 |
| question « … repose-t-il trop sur la voiture ? » | 34 122 | 12 216 |
| question « Passer à l'électrique… ? » | 0 | 386 |
| type d'ambiance Territoire modifié | | **0** |
| catégories de l'index modifiées hors `rural_peri_urbain` | | **0** |

### 3.2 Communes urbaines Insee 1-4 sous 1 500 hab/km² (3 612, 20,3 M hab.)

| Sortie | Avant | Après |
|---|---|---|
| accroche « voiture » | 2 792 | 0 |
| intro « voiture » | 1 523 | 0 |
| carte « dépend largement » | 3 603 | 0 |
| carte mesurée | 0 | 3 612 |
| « Quitter la ville pour X ? » | 2 266 (14,6 M hab.) | 2 (table manuelle) |
| « S'installer à X ? » | 3 596 | 2 (table manuelle) |
| « … repose-t-il trop sur la voiture ? » | 3 600 | 803 |

### 3.3 Communes rurales Insee 5-7 (30 540, 21,7 M hab.)

| Sortie | Avant | Après |
|---|---|---|
| accroche « voiture » | 25 537 | 0 |
| intro « voiture » | 10 702 | 0 |
| carte « dépend largement » | 30 524 | 0 |
| carte mesurée / sans carte | 0 / 0 | 25 800 / 4 740 |
| « Quitter la ville pour X ? » | 11 104 | 7 |
| « S'installer à X ? » | 30 518 | 7 |
| « … repose-t-il trop sur la voiture ? » | 30 519 | 11 410 |

Aucune commune rurale n'est décrite comme urbaine après correctif : le cadrage retombe sur la phrase générale, et la seule phrase « transports et courtes distances », qui était une description urbaine, a disparu (16 rurales la recevaient).

### 3.4 Les questions : ce qui sort, ce qui entre

Les 4 questions changent dans 34 105 communes. Sortent : `acheter_rural` (34 105), `mobilite_fragile` (21 906), `quitter_ville` (13 361). Entrent, par les règles de priorité et de dédoublonnage existantes : `metier_exterieur` (24 242), `eau_potable` (16 699), `feux` (5 972), `risque_vectoriel_emergent` (4 588), `acheter_montagne` (3 483), `croissance_transformation` (2 943), `valeur_immo` (2 607), `ski_ici` (2 465), `canicule_vivable` (1 575), `acheter_canicule` (1 502), `tc_sansvoiture` (1 316), `acheter_littoral` (791), `baignade_ici` (423), `voiture_electrique` (386), `retraite_ici` (264), `surfer_ici` (75), `calme_infra` (40), `air_urbain` (1). Ces questions existaient déjà ; elles étaient masquées par `acheter_rural` (priorité 1, préfixe `acheter`) et `quitter_ville` (place réservée « territoire »).

La question voiture suit désormais la seule mesure : elle reste pour Bony (93 % de trajets en voiture), sort pour Nîmes (66 %). Elle sort aussi pour Sèvremoine (88 %, 53e percentile) : le seuil de la catégorie (60e percentile, 89,1 %) est inchangé, il se discute s'il paraît trop haut (§ 8).

## 4. Le correctif

| Fichier | Changement | Pourquoi |
|---|---|---|
| `src/lib/comparateur-vie.ts` | `rural_peri_urbain` n'est plus émise. `peuDense` ne sert plus qu'à garder les 4 catégories mesurées, inchangées | aucune source n'atteste la ruralité ; la grille Insee (FUT-184) n'est ni intégrée ni validée |
| `src/lib/accueil/recits.ts` `getHeroCopy`, `getQuestionIntro` | branche « dépendance à la voiture » retirée | elle venait d'une catégorie, y compris de la table manuelle (Toulouse : 46 % de trajets en voiture) |
| `recits.ts` `getEmptyStateCopy` | l'annonce « déplacements » ne suit plus que `periurbain_dependance_auto` | c'est la catégorie qui ouvre les questions voiture |
| `recits.ts` `carteMobilite`, `cartesProfondeur`, `getPreviewCards`, `apercuCommune` | carte construite sur `partVoitureDomicileTravail`, avec valeur, limite et source ; sans mesure, pas de carte | supprimer l'attribution MOBPRO sans lecture, et l'inférence par montagne ou couvert |
| `recits.ts` `MACHINE_A_SOUS_MOBPRO`, `carteMobiliteMachineASous` ; `FutureELanding.tsx` | les 4 cartes Mobilité de la machine à sous (rédigées à la main sous « INSEE MOBPRO ») portent la mesure de la ville entière | même défaut, sur le premier écran de tout visiteur |
| `src/app/api/landing-signals/route.ts` | la réponse porte `mobilite: { partVoitureDomicileTravail } \| null` | seule base de la carte |
| `FutureELanding.tsx` | `/api/landing-signals` est lu pour toute commune connue, table manuelle comprise | les 44 communes manuelles ont aussi droit à la mesure |
| `src/lib/accueil/qna.ts`, `src/app/qna/route.ts` | le modèle ne reçoit plus `commune_categories` | des clés d'angle n'étaient pas des faits ; le modèle pouvait en tirer « commune rurale » |

**La carte Mobilité**, telle que rendue :
- titre « Aller travailler en voiture », valeur « 66 % » ;
- fait : « À Nîmes, 66 % des actifs en emploi qui y habitent vont travailler en voiture. » ;
- limite : « Ce chiffre ne couvre que les trajets domicile-travail des actifs en emploi, voiture, camion et fourgonnette compris, à l'échelle de la commune. Il ne dit rien des autres déplacements, ni de ce qu'une adresse permet de faire sans voiture. » ;
- source : « Insee · recensement 2022 (MOBPRO) ».

La mesure : `scripts/populate-mobilite.py`, part pondérée IPONDI des actifs en emploi dont le mode principal est la voiture (TRANS = 5), commune de résidence, RP 2022 (géographie 2024 ramenée au COG 2025, FUT-109), seuil de 50 actifs pondérés en deçà duquel la valeur est absente. Aucune comparaison nationale n'est écrite sur la carte : le percentile n'y figure pas.

**Machine à sous** : Lyon 29,16 %, Marseille 51,78 % (villes entières, arrondissements agrégés depuis la base MOBPRO, `mobpro-villes.py`), Vannes 67,54 %, La Rochelle 53,28 % (valeurs de l'index, vérifiées par test). Les anciennes phrases (« le vélo tient une vraie place », « tient encore beaucoup à la voiture ») n'étaient pas fausses sur le fond pour La Rochelle (17,7 % à vélo) ou Marseille, mais aucune ne lisait la source affichée.

**Ce qui ne change pas** : aucun seuil (60e percentile, 30 % agricole, 35 % forêt, vie locale 30, 1 500 pour `urbain_dense`), aucune donnée de l'index, aucun score, aucune autre catégorie, aucun texte Territoire, aucune donnée distante.

## 5. Cas nommés (sorties réelles)

| Commune | Grille Insee | Densité | Accroche avant → après | Carte Mobilité avant → après | Questions retirées → ajoutées |
|---|---|---|---|---|---|
| Nîmes | 1 | 930 | méditerranée (inchangée) | « dépend largement » → 66 % | rural, voiture, quitter la ville → canicule ×2, sans voiture |
| Aix-en-Provence (manuelle) | 1 | 795 | méditerranée | « transports et courtes distances » → 63 % | inchangées |
| Avignon | 1 | 1 414 | méditerranée | « dépend largement » → 65 % | comme Nîmes |
| Colmar | 1 | 1 011 | « dépendance à la voiture » → générale | « dépend largement » → 62 % | rural, voiture → eau, métier extérieur |
| Quimper | 1 | 765 | voiture → générale ; intro voiture → générale | « dépend largement » → 78 % | rural, voiture, quitter la ville → métier, sans voiture, immobilier |
| Bourges | 1 | 935 | idem Quimper | → 73 % | idem |
| Niort | 2 | 881 | voiture → générale | → 70 % | → eau, métier, sans voiture |
| La Roche-sur-Yon | 2 | 625 | voiture → générale ; intro voiture → générale | → 74 % | → métier, sans voiture, croissance |
| Sèvremoine | 5 | 121 | voiture → générale | → 88 % | rural, voiture → eau, métier |
| Châtelaillon-Plage | 4 | 976 | littoral (inchangée) | → 72 % | → littoral, baignade, sans voiture |
| Corte | 3 | 52 | montagne | → 72 % | → montagne, canicule, croissance |
| Eguisheim | 4 | 123 | voiture → générale | → 71 % | → eau, métier |
| Grenoble | 1 | 8 640 | montagne | « dépend largement » (par la montagne) → 32 % | inchangées |
| Chamonix (manuelle) | 3 | 74 | montagne | « dépend largement » → 49 % | inchangées |
| Briançon, Mont-Dauphin | 2, 6 | 382, 282 | montagne | → 61 %, 63 % | rural, voiture, quitter → montagne, ski, métier |
| Bony | 6 | 17 | voiture → générale | → 93 % | rural → eau (la question voiture reste : 80e percentile mesuré) |
| Janville-en-Beauce, Bressuire | 5 | 59, 110 | voiture → générale | → 79 %, 84 % | rural, voiture → … |
| Bouffignereux | 6 | 22 | voiture → générale | « dépend largement » → **pas de carte** (aucune mesure) | rural, voiture → eau, métier |
| Toulouse (manuelle) | 1 | 4 325 | intro voiture → « chaleur urbaine… » | → 46 % | inchangées (voiture : catégorie manuelle) |
| Paris 1er | PLM | | générale | « transports et courtes distances » → 6 % | inchangées |

Tous les textes complets, avant et après, sont dans [`sortie-attendue.txt`](2026-11-10-fut185-libelles-densite/sortie-attendue.txt), section « Panel ».

## 6. Non-régression, caches et dossiers figés

- **FUT-140** : les arrondissements PLM restent `urbain_dense_*`, sans catégorie rurale ni périurbaine, sans voiture déduite (test dédié) ; `fut140-identites-plm.test.ts` passe.
- **FUT-147, FUT-176** : `fut147-*.test.ts` et `fut176-statuts-urbains.test.ts` passent ; ni BDIFF ni les statuts UU ne lisent ces catégories.
- **FUT-137** : les comptes de `faible_vie_locale` sont inchangés (20 749) et ses tests passent.
- **Snapshots Territoire** : le type d'ambiance est inchangé pour les 34 788 communes (rejeu), et un test prouve qu'il ne lit pas `rural_peri_urbain`. Aucune empreinte ne bouge, aucune synthèse n'est invalidée.
- **Dossiers figés, comparateur, synthèses** : ils n'appellent ni ces catégories ni `recits.ts` (seul `apercu-territoire.ts` en importe les cartes climat, inchangées).
- **Cache** : `/api/landing-signals` est mis en cache 24 h par le CDN (`s-maxage=86400`). Pendant au plus 24 h après déploiement, une réponse ancienne, sans `mobilite`, donne un aperçu **sans** carte Mobilité, et des catégories qui portent encore `rural_peri_urbain` : l'accroche et la carte n'en disent plus rien, seules les questions anciennes peuvent subsister jusqu'à expiration. `/qna` n'a pas de cache. Aucune invalidation n'est nécessaire.

## 7. Décision porteur : les questions des communes réellement rurales

Sans `rural_peri_urbain`, « S'installer à X ? » et « Quitter la ville pour X ? » disparaissent partout, y compris pour 30 511 communes rurales Insee qui les recevaient légitimement. Trois options :

| Option | Règle | Rurales 5-7 qui gardent les 2 questions | Urbaines 1-4 qui les recevraient encore | Risque |
|---|---|---|---|---|
| **A (livrée)** | aucune émission tant qu'aucune source ne l'atteste | 0 (sauf 7 de la table manuelle) | 0 (sauf 2 de la table manuelle) | perte de deux questions utiles en milieu rural |
| B | émettre la clé pour les communes **hors unité urbaine** (statut UU2020 officiel, FUT-176) | 26 927 / 30 540 | 352 / 3 612 | mélange unité urbaine et ruralité : une commune hors UU n'est pas « périurbaine », et la clé s'appelle `rural_peri_urbain` |
| C | attendre FUT-184 et émettre la clé pour les classes DENS7 5 à 7 | 30 540 / 30 540 | 0 | dépend d'un lot non intégré |

Recommandation : **A maintenant, C dès que FUT-184 est validé**. B ne serait défendable qu'avec une clé renommée et un catalogue de questions modifié en base, ce qui sort du périmètre et touche des données distantes.

## 8. Dettes relevées, hors périmètre

1. **Table manuelle `communes_categorization`** (données distantes, non modifiées) : 10 communes portent encore `rural_peri_urbain` (Rodez, La Gaude, Saint-Jeannet, Auribeau-sur-Siagne, Trans-en-Provence, Roquebrune-sur-Argens, La Crau, Bauduen, Roquevaire, Gémenos) et 7 `periurbain_dependance_auto` sans mesure (Bordeaux, Toulouse, Vitrolles, Les Pennes-Mirabeau, Salon-de-Provence, Rognac, Aubagne). Elles ne produisent plus aucune phrase, mais ouvrent encore leurs questions, et `/api/ask` les écrit au modèle (« Catégories territoriales : … »). Rodez est un centre urbain intermédiaire à 2 155 hab/km². Décision porteur sur la base.
2. **Cartes Nature et Vie locale** de l'aperçu et de la machine à sous : phrases génériques (« espaces agricoles et nature rythment le quotidien », « commerces, services et vie associative font le quotidien ») sous des sources (« OSM / IGN », « INSEE BPE / RNA ») qu'aucune ne lit. Même défaut que la carte Mobilité. La branche agricole et forestière dépend des catégories OSO de FUT-182 ; l'aperçu relève de FUT-50.
3. **Intro « vie agricole »** (`rural_agricole`) : 16 105 communes, dont 1 269 urbaines Insee (Colmar, Niort). Un couvert de cultures n'est pas une « vie agricole ». À reprendre avec les catégories OSO de FUT-182.
4. **`periurbain_dependance_auto`** : le nom dit « périurbain » pour une mesure de part voiture ; la garde de densité n'exclut que 2 communes denses au 60e percentile ou plus. Le 60e percentile (≥ 89,1 %) laisse Sèvremoine (88 %) sans question voiture. Seuil à discuter, non modifié.
5. **`densityCategory` de Territoire** (1 500 / 150) : relève de FUT-184.

## 9. Vérifications

| Contrôle | Résultat |
|---|---|
| `tsc --noEmit` | 0 erreur |
| `eslint` sur les fichiers modifiés, puis global | 0 erreur |
| `npm test` (node_modules propre, `npm ci`) | 4 663 tests : 4 661 réussis, 0 échec, 2 ignorés |
| `src/lib/fut185-libelles-densite.test.ts` | 16 tests nationaux et nommés |
| `npm run build` (prébuild compris : index vérifié, données de l'accueil identiques) | réussi, 283 pages |
| `/api/landing-signals` sur le build local | Nîmes 0,6586 ; Grenoble 0,3226 ; Bouffignereux `null` ; Paris (75056) `null` |
| rejeu FUT-180 sur `51a493d0`, `1ab56bfb`, `2b6c4872` | chiffres reproduits, puis à zéro |
| rejeu FUT-185 depuis les commits (`lancer.sh`) | identique au rejeu de travail |

Note : avec le `node_modules` incomplet de la copie principale du dépôt, 13 fichiers de test échouent faute de `clipper-lib` et `react-test-renderer`, à l'identique sur `main`. Ce n'est pas un effet du correctif.

## 10. Limites

- Les questions sont rejouées avec une copie de `buildTensions` (fonction non exportée d'un composant client) et le catalogue relevé le 10/11/2026. Entre deux questions de même priorité, l'ordre dépend de la base ; la copie suit l'ordre renvoyé par la requête.
- L'aperçu est rejoué sans DRIAS ni Géorisques. La carte Mobilité y occupe toujours l'une des deux places « profondeur » : sa présence ne dépend pas des cartes climat.
- Aucun rendu navigateur n'a été capturé : le rendu des cartes est générique (titre, valeur, source, « Données et limites ») et déjà employé par les cartes climat.
- Lyon et Marseille de la machine à sous se recalculent depuis la base MOBPRO, non versionnée (empreinte dans `mobpro-villes.py`) ; un test ne peut vérifier que Vannes et La Rochelle.
- La grille Insee 2025 ne sert qu'à découper les résultats de cet audit. Aucun code livré ne la lit.

## Reproduire

```bash
cd docs/audits/2026-11-10-fut185-libelles-densite
./lancer.sh <dossier_de_travail> <dossier_FUT-180>/work/both.parquet 1ab56bfb <révision du correctif>
python3 -I mobpro-villes.py <rp-mobpro-2022.parquet>
```

`both.parquet` vient de la chaîne FUT-180 (`00_preparer.sh` puis `02_jointure.py`, branche `docs/fut-180-grille-densite-insee`). Comparer la sortie à `sortie-attendue.txt`.
