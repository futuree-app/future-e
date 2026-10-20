# FUT-116 : récits climatiques du module Territoire (20/10/2026)

Branche `fix/fut-116-recits-climatiques-territoire`, partie de `main` bdf3fd4a (FUT-17 fusionné, `engine-6`).
Surface : le récit « Ce que cela raconte » des volets **Chaleurs estivales**, **Nuits tropicales** et
**Températures moyennes** (`buildClimatWhy`, `src/components/report/QuartierClimatData.tsx`), page
`/rapport/quartier`. C'est la destination des liens « Preuve » `climate.extreme_heat`,
`climate.tropical_nights` et `climate.mean_temperature` du dossier payant.

Chiffres : recensement des 34 788 communes de `data/data_climat.json` (index DRIAS courant), archétype dérivé
comme le snapshot Territoire (`deriveTerritoryType` + `deriveCategoriesFromEntry`). Lecture seule, aucun réseau.

## 0. Chemin de la donnée (audit préalable)

| Étape | Ce qui se passe |
|---|---|
| Source | `data_climat.json` : médianes DRIAS-TRACC (17 modèles) par commune et par **palier de réchauffement** `gwl15` / `gwl20` / `gwl30` (+2 / +2,7 / +4 °C en France, affichés 2030 / 2050 / 2100). Pour chaque palier : un niveau projeté (`NORTX30D_yr`, `NORTR_yr`, `NORTMm_seas_*`) et son **écart à la référence 1976-2005** (`ATX30D_yr`, `ATR_yr`, `ATMm_seas_*`). |
| Snapshot | `loadTerritoireSnapshot` fige `climate.scenarios` (= `getClimatDataCommune().commune.s`) et `place.typology` (archétype). |
| Composant | `buildFactors` lit le palier choisi (`useHorizon`, 2050 par défaut). Face : `movementOrLevel` (rare si niveau < 1,5 ; hausse si écart arrondi ≥ 2 ; sinon niveau). Volet : référence reconstruite (niveau moins écart, médiane des trois paliers), trajectoire, puis le récit. |
| Récit (avant) | `buildClimatWhy(thème, commune, archétype)` : **une phrase fixe par archétype**, sans aucune donnée pour Chaleur et Nuits. |
| Archétype | `montagne` > `mediterraneen` > `littoral_atlantique` (toute commune loi Littoral « Mer » hors Méditerranée, Manche et mer du Nord comprises) > `plaine`. Classement **administratif**, pas climatique. |
| Persistance | Le récit est calculé **au rendu, côté client**. Il n'entre ni dans le snapshot, ni dans son empreinte, ni dans l'artefact de décision, ni dans un prompt Anthropic (grep : les phrases n'existent que dans ce fichier). |

Ce qui est disponible : **trois paliers** et une référence. Ce qui ne l'est pas : une série temporelle, une
date d'apparition, une durée d'épisode, une observation locale (hors ERA5, uniquement dans le volet Températures).
« Restent rares » = niveau projeté < 1,5 jour/an au palier choisi ; « Quasi inexistantes » = idem pour les nuits.

## A. Défauts confirmés

Pour chaque phrase : ce qu'elle affirme, la donnée qui le démontrerait, et ce qui est disponible.

### A.1 Accélération (Chaleur, les 4 archétypes)
« La progression s'accélère, elle ne fait pas que monter. »
- Affirme : une dérivée seconde positive **dans le temps**, localement.
- Il faudrait : des rythmes d'évolution comparés sur plusieurs périodes datées, selon une convention.
- Disponible : trois paliers de **réchauffement global**, inégalement espacés (+0,7 puis +1,3 °C en France), sans date propre. Une hausse plus forte entre deux paliers plus écartés ne dit rien d'une accélération temporelle. Aucun calcul n'existait.
- Conditions : **toujours**, sur les 34 788 communes, aux trois horizons. Dont, en 2050, **373 communes sous « Restent rares »** (chiffre de l'audit FUT-17 retrouvé à l'unité) et 82 à écart faible ; 663 et 604 en 2030. Jausiers : 0 jour au-dessus de 30 °C à tous les horizons.

### A.2 Progression continue des nuits (Nuits, Littoral)
« les nuits d'été gardent de plus en plus la chaleur du jour »
- Affirme : une tendance continue, au présent.
- Disponible : l'écart projeté au palier choisi.
- Conditions : volet ouvert dès qu'un palier atteint 3 nuits, donc aussi sur les paliers où la face dit « Quasi inexistantes ». En 2030 : **226 communes littorales sous « Quasi inexistantes »**, dont **167 à écart < 1 nuit/an** (Cherbourg-en-Cotentin : 0,9 nuit, +0,8), et 74 à écart faible. **Le chiffre 102 de la sonde FUT-17 n'est pas retrouvé** avec l'index et la typologie courants ; aucune commune n'est concernée en 2050 et 2100.

### A.3 Autres variantes de la même fonction (relecture sémantique)

| Thème · archétype | Proposition | Pourquoi non démontrée | Contre-exemple réel |
|---|---|---|---|
| Chaleur · Littoral | « deviennent peu à peu une part ordinaire de l'été » | tendance + caractérisation sans seuil | Cherbourg : 1,3 jour en 2050 |
| Chaleur · Méditerranéen | « ce qui change, c'est leur nombre et la longueur des épisodes » | aucune donnée de durée d'épisode | toutes |
| Chaleur · Montagne | « l'altitude a longtemps tenu les fortes chaleurs à distance ; elles gagnent désormais les étés » | cause tirée de l'archétype ; « désormais » sur une projection | Latour-de-France : ≈ 25 jours de référence ; 524 communes « montagne » ≥ 10 jours ; Jausiers : 0 jour à tous les horizons |
| Chaleur · Intérieur | « s'installent plus tôt et durent plus longtemps » | aucune donnée de date ni de durée | toutes |
| Nuits · Méditerranéen | « font déjà partie de l'été ; […] la saison s'étire » | « déjà » non lu ; aucune donnée de saison | Sault : 0 nuit de référence ; 60 communes < 3 |
| Nuits · Montagne | « l'altitude a longtemps garanti des nuits fraîches ; elles commencent à céder lors des étés les plus chauds » | cause par l'archétype ; aucune variabilité interannuelle | Latour-de-France : ≈ 25 nuits de référence |
| Nuits · Intérieur | « elles cessent plus souvent de rafraîchir » | tendance affirmée quel que soit l'écart | 1 859 communes « Quasi inexistantes » en 2030 avec volet ouvert |
| Températures · Littoral | « l'une après l'autre, et les extrêmes gagnent du terrain » | chronologie inventée ; aucun extrême dans ce volet | |
| Températures · Méditerranéen | « son intensité et sa durée au fil de l'année » | aucune donnée de durée | |
| Températures · Montagne | « le froid d'altitude a longtemps marqué le climat » | cause par l'archétype | 548 communes « montagne » avec un hiver de référence ≥ 5 °C |

Restaient exactes : le réchauffement des deux saisons (écarts positifs sur 34 788/34 788 communes, aux trois
paliers) et la nuance « l'été (ou l'hiver) se réchauffe plus vite » (écarts comparés au même palier, seuil 0,3 °C existant).

## B. Corrections

**Principe** : le récit ne dit plus que ce que le volet mesure, au palier choisi, par rapport à la référence
(« fin du XXe siècle », le libellé de la trajectoire). Il suit **la convention de la face**, extraite dans
`lireCompte` et partagée par `movementOrLevel` et le récit : aucun seuil nouveau, aucune donnée nouvelle,
aucun calcul climatique nouveau. La face et le volet disent le même mouvement. L'archétype n'entre plus dans le
récit (prop `climatType` retirée du composant et de la page) ; il continue de colorer le passeport.

| Lecture (règle de la face) | Récit Chaleur (Nuits : « nuits au-dessus de 20 °C ») |
|---|---|
| rare (niveau < 1,5) | « À {c}, les jours au-dessus de 30 °C restent rares dans les projections à l'horizon {année} : moins de deux par an en moyenne. » (Nuits : « restent quasi inexistantes ») |
| écart faible (\|écart\| < 1,5) | « À {c}, le nombre de jours au-dessus de 30 °C projeté à l'horizon {année} reste proche de celui de la fin du XXe siècle : l'écart est inférieur à deux par an. » |
| hausse nette (écart arrondi ≥ 2) | « À {c}, les projections comptent {écart} jours au-dessus de 30 °C de plus par an à l'horizon {année} qu'à la fin du XXe siècle. Ce compte annuel ne dit ni à quel moment de l'été ces journées surviennent, ni combien de temps durent les épisodes. » (Nuits : « …ne dit pas comment ces nuits se répartissent dans l'été. ») |
| écart non publié | « À {c}, environ {n} jours au-dessus de 30 °C par an sont projetés à l'horizon {année}. L'écart avec la fin du XXe siècle n'est pas disponible ici : l'évolution ne peut pas être qualifiée. » |
| baisse nette | symétrique de la hausse (« de moins ») ; aucune commune aujourd'hui, prévu pour ne jamais dire « proche » à tort |

{écart} est le même entier que la face (« +11 jours chauds d'ici 2050 » → « 11 … de plus »). La seconde phrase
de la hausse nomme exactement ce que les propositions retirées prétendaient savoir.

**Températures** : « À {c}, les projections donnent, à l'horizon {année}, un été et un hiver plus chauds qu'à la
fin du XXe siècle. » seulement si les deux écarts sont positifs (variante été seul si l'hiver manque), sinon
« la trajectoire ci-dessus donne l'été moyen projeté à chaque horizon. » La nuance saisonnière est inchangée.

Répartition nationale des nouveaux récits (communes dont le volet s'ouvre) :

| Palier | Chaleur : hausse / faible / rare | Nuits : hausse / faible / rare |
|---|---|---|
| 2030 | 33 521 / 604 / 663 | 29 873 / 1 917 / 2 858 |
| 2050 | 34 333 / 82 / 373 | 34 305 / 47 / 296 |
| 2100 | 34 640 / 0 / 148 | 34 648 / 0 / 0 |

Les signaux défavorables restent : chiffrés, datés, et identiques à la face sur 34 333 communes en 2050.

## C. Reproductibilité

Test permanent : `src/lib/fut116-recits-climat-territoire.test.ts` (13 tests). Il rend le **vrai volet**
(`MetricDrawer` via react-dom/server) sur le détail produit par `buildFactors` à partir des **vraies données
DRIAS**, et la **vraie grille** (`QuartierAside`) pour les faces.

Cas : La Rochelle (Littoral, hausse nette), Jausiers (Montagne, « Restent rares » à tous les horizons, pas de
volet nuits), Cherbourg-en-Cotentin (Littoral, « Restent rares » 2050, nuits « Quasi inexistantes » 2030 volet
ouvert), Géfosse-Fontenay et Binic-Étables-sur-Mer (écart faible), Nîmes (Méditerranéen, hausse forte),
Latour-de-France et Sault (archétype contredit par la donnée), absence totale de données, écart non publié.

**Contre-épreuve** (worktree jetable sur `main` bdf3fd4a, seul ajout : `export` sur `buildFactors`, archétype réel passé) :

```
AVANT (main)  ℹ tests 13  ℹ pass 3  ℹ fail 10
  ✖ Aucun volet climat n'affirme une accélération, une tendance, une durée ou une cause non calculées
  ✖ Jausiers : « Restent rares » à tous les horizons …
      actual: "À Jausiers, l'altitude a longtemps tenu les fortes chaleurs à distance ; elles gagnent désormais
               les étés. La progression s'accélère, elle ne fait pas que monter."
  ✖ Cherbourg-en-Cotentin 2030 (Littoral) …
      actual: "À Cherbourg-en-Cotentin, les nuits d'été gardent de plus en plus la chaleur du jour."
  … (10 échecs)
  ✔ situations de référence · ✔ sans données · ✔ grille (faces inchangées)
APRÈS (branche) ℹ tests 13  ℹ pass 13  ℹ fail 0
```

Les trois tests qui passent avant comme après sont voulus : ils épinglent les données, l'absence et les faces,
que le correctif ne doit pas changer.

## D. Non-régression

| Vérification | Résultat |
|---|---|
| Nouveaux tests + FUT-33 (ancre de découpe adaptée, assertion inchangée) | 23/23 |
| Suite complète `node --test` | 2 845 lancés, 2 841 réussis. Les 4 « échecs » ne sont pas des tests : `scripts/integration/{appliquer-schema-test,fut10-stripe-test}.mjs` **refusent de s'exécuter** (« Environnement NON isolé : tests refusés », rien écrit) et `src/app/dev/fut87/{dossier,projet}-de-test.ts` sont des fixtures ramassées par leur nom. Fichiers non touchés. |
| `tsc --noEmit` | 0 erreur |
| ESLint, fichiers touchés | 0 erreur |
| ESLint complet | 22 erreurs, 19 avertissements, toutes dans des fichiers non touchés (préexistantes) |
| `next build` | réussi (avec le `.env.local` local, comme les autres worktrees) |

- **Moteur** : aucun fichier de `src/lib/decision/`, ni `materiality-rules.ts`, ni `decision-artifact.ts`. `engine-6`, seuils, verdicts et priorités inchangés.
- **Données** : DRIAS/TRACC lues, jamais écrites. Faces des cartes identiques (même règle, extraite dans `lireCompte`, testée sur la grille).
- **Historique** : le récit n'est stocké nulle part (snapshot, empreinte, artefact, synthèse) ; aucun dossier, aucune synthèse Anthropic à régénérer, aucune migration. Les acheteurs verront le nouveau récit en rouvrant la page, ce qui est l'objet du correctif.
- **Commercial** : aucun prix, droit, Stripe ni garde touchés.

## E. Passe 2 : le panneau entier (revue PR #70, 20/10/2026)

La revue a relevé que le récit était juste, mais que **les textes au-dessus de lui** dans les mêmes volets
affirmaient encore une tendance, quel que soit le signal. Corrigés dans la même PR, sans nouvelle donnée :

| Emplacement | Avant | Après |
|---|---|---|
| Chaleur · surtitre | « Des étés qui s'intensifient » | « Jours de forte chaleur » |
| Chaleur · sous-titre | « Le nombre de jours de forte chaleur suit l'intensification des étés, indépendamment d'une canicule isolée. » | « Le nombre moyen de jours par an où la température maximale dépasse 30 °C, selon les projections. » |
| Nuits · surtitre | « Des nuits qui ne retombent plus » (aussi sous « Quasi inexistantes ») | « Nuits chaudes » |
| Nuits · sous-titre | « […] même après le coucher du soleil, l'air ne se rafraîchit plus. » (faux : une nuit à Tmin > 20 °C peut se rafraîchir) | « Le nombre moyen de nuits par an où la température minimale reste au-dessus de 20 °C, selon les projections. » |
| Nuits · infobulle (carte sans volet, ex. Jausiers) | « […] l'air ne rafraîchit plus le territoire. C'est l'un des signes les plus parlants d'un climat qui change près de chez soi. » | « Une nuit tropicale est une nuit où la température ne descend pas sous 20 °C. La carte en donne le nombre moyen par an, selon les projections. » |
| Températures · sous-titre | « […] la moyenne des saisons, qui transforme le paysage bien au-delà des pics ponctuels. » | « La température moyenne de l'été et de l'hiver, selon les projections. » |
| Températures · note ERA5 | « Déjà observé : {±x} °C depuis 1961-1990 […]. Le réchauffement projeté a déjà commencé. » (sans examen du signe ; une observation ne valide pas une projection) | « Observé : Température moyenne annuelle {N−9}-{N} : {±x} °C par rapport à 1961-1990 (réanalyse Copernicus / ERA5-Land). » Signe restitué tel quel. Source : « écart observé » au lieu de « tendance observée ». |

**Tests du panneau entier** (4 ajoutés) : texte intégral du volet épinglé pour Cherbourg 2030 (nuits « Quasi
inexistantes »), Jausiers 2050 (chaleur « Restent rares », plus l'infobulle des nuits), Nîmes 2100 (hausse forte,
trajectoire intacte) et la note ERA5 sur trois **fixtures synthétiques déclarées** (+1,42 / −0,3 / 0 °C : ERA5 vit en
base, hors d'un test sans réseau). Le contrôle global couvre désormais aussi les infobulles.

**Contre-épreuve** : ces tests sur le commit précédent de la PR (8c55e60e) : **5 échecs sur 17** (les 4 panneaux et
le contrôle global), sur les phrases « Des étés qui s'intensifient », « Des nuits qui ne retombent plus », « l'air ne
se rafraîchit plus », « suit l'intensification des étés », « Le réchauffement projeté a déjà commencé ». Après : 17/17.

**Commande de test reproductible** : `npm test`, ajouté à `package.json` :
`node --test "src/**/*.test.ts" "scripts/**/*.test.mjs"`. Elle ne sélectionne que les vrais fichiers de test et
n'exécute donc jamais les scripts d'intégration protégés ni les fixtures `*-de-test.ts`.

| Vérification (passe 2) | Résultat |
|---|---|
| `npm test` | **2 843 / 2 843**, 0 échec (les 2 841 de la passe 1 comptaient 2 fichiers sans test, `projet-de-test.ts` et `schema-de-test.mjs` ; + 4 tests de panneau) |
| `tsc --noEmit` | 0 erreur |
| ESLint, fichiers touchés | 0 erreur |
| `next build` | réussi ; la copie locale de `.env.local` a ensuite été supprimée du worktree (jamais suivie par git) |

## F. Passe 3 : ton du Relevé et volet Sécheresse (revue PR #70, 20/10/2026)

**Règle éditoriale retenue** : le chiffre apporte la précision, le texte apporte le sens, la preuve apporte la
confiance. La passe 2 avait rendu les textes exacts mais trop proches d'une fiche de données ; la passe 3 garde
exactement les mêmes conditions (`lireCompte`, mêmes seuils, mêmes chiffres) et change le ton : conditionnel pour
la projection, période de référence nommée une fois, limite dite comme une question ouverte.

| Emplacement | Passe 2 | Passe 3 |
|---|---|---|
| Chaleur · surtitre / sous-titre | « Jours de forte chaleur » / « Le nombre moyen de jours par an où la température maximale dépasse 30 °C, selon les projections. » | « Le seuil des 30 °C » / « Combien de jours par an dépasseraient 30 °C ? » |
| Nuits · surtitre / sous-titre | « Nuits chaudes » / « Le nombre moyen de nuits par an où la température minimale reste au-dessus de 20 °C, selon les projections. » | « Le seuil des 20 °C » / « Une nuit tropicale est une nuit où la température ne descend pas sous 20 °C. » |
| Températures · sous-titre | « La température moyenne de l'été et de l'hiver, selon les projections. » | « Comment les températures d'été et d'hiver pourraient évoluer. » |
| Récit · hausse (La Rochelle 2050) | « …les projections comptent 11 jours au-dessus de 30 °C de plus par an à l'horizon 2050 qu'à la fin du XXe siècle. Ce compte annuel ne dit ni à quel moment de l'été… » | « …les projections indiquent environ 11 jours de plus par an au-dessus de 30 °C à l'horizon 2050, par rapport à la période 1976-2005. On ne sait toutefois pas si ces journées seraient isolées ou concentrées dans plusieurs épisodes. » |
| Récit · rare (Cherbourg 2030) | « …les nuits au-dessus de 20 °C restent quasi inexistantes dans les projections… » | « …les nuits tropicales resteraient très rares à l'horizon 2030 : moins de deux par an en moyenne dans les projections. » |
| Récit · écart faible | « …reste proche de celui de la fin du XXe siècle : l'écart est inférieur à deux par an. » | « …bougerait peu à l'horizon {année} : l'écart avec la période 1976-2005 resterait inférieur à deux par an dans les projections. » |
| Récit · écart non publié | « …L'écart avec la fin du XXe siècle n'est pas disponible ici : l'évolution ne peut pas être qualifiée. » | « …Faute d'écart publié avec la période 1976-2005, on ne peut pas dire s'il y en aurait plus ou moins qu'avant. » |
| Récit · températures | « …les projections donnent, à l'horizon 2050, un été et un hiver plus chauds qu'à la fin du XXe siècle. » | « …les projections indiquent un été et un hiver plus chauds à l'horizon 2050 que sur la période 1976-2005. Ici, l'été se réchaufferait plus vite que l'hiver. » |

**Sécheresse des sols** (même écran, même intention ; correction courte, sans toucher au modèle) :

| Emplacement | Avant | Après |
|---|---|---|
| Surtitre | « Un territoire qui s'assèche » | « L'eau et les sols » |
| Titre | « Environ N jours secs par an d'ici {année} » ; sinon la restriction ; **sinon, par défaut, « Cours d'eau à sec observé »** | « Environ N jours de sols secs par an à l'horizon {année} » ; sinon la restriction ; « Cours d'eau à sec observé » **seulement si ONDE l'a relevé** ; sinon le libellé VigiEau (ex. « État des restrictions non disponible ») |
| Sous-titre | « Le manque durable d'eau dans les sols, même en dehors des périodes de restriction. » | « Restrictions d'eau, cours d'eau et sols : trois lectures à ne pas confondre. » |
| Ligne ONDE | « Sur le terrain » (sans date) | « Relevé de terrain du {date} » quand la date existe |
| Récit | « …les cours d'eau qui faiblissent, la terre qui se rétracte : […] C'est un changement de fond qui s'inscrit dans la durée. » (même sous « Pas de cours d'eau à sec » ; aucune donnée de retrait des argiles ici ; aucun écart de sécheresse lu) | « Une restriction est une décision préfectorale prise pour la période en cours. L'état d'un cours d'eau est un relevé ponctuel sur le terrain. Les jours de sols secs sont une moyenne annuelle projetée. L'une de ces lectures ne permet pas de déduire les autres. » |

**Vérification du cas signalé par la revue** : avec VigiEau en « vigilance » seule, le titre était déjà « Vigilance
sécheresse, sans restriction » (`libelleRestrictions` rend `en_vigueur`), pas « Cours d'eau à sec observé ». La
phrase était en revanche la **branche par défaut** du titre : un registre VigiEau en panne portant un niveau (objet
que `getVigieauSummary` ne produit pas aujourd'hui) l'affichait sans aucun relevé ONDE. Elle est désormais verrouillée
sur `drought.isDry`.

**Tests** (4 ajoutés, VigiEau et ONDE en fixtures synthétiques déclarées, DRIAS réelle) : VigiEau seule ; registre
en panne portant un niveau ; ONDE seule réellement à sec (et ONDE non sèche seule : pas de volet) ; DRIAS seule
(La Rochelle 2050). Contre-épreuve sur 4dfeb4c1 : **5 sur 5 en échec** (les 4 + le contrôle global, qui couvre
désormais « s'assèche », « changement de fond », « dans la durée », « faiblissent », « se rétracte »). Après : 31/31
(fichier FUT-116 + FUT-33).

| Vérification (passe 3) | Résultat |
|---|---|
| `npm test` | **2 847 / 2 847** |
| `tsc --noEmit` | 0 erreur |
| ESLint, fichier touché | 0 erreur |
| `next build` | réussi ; `.env.local` copié pour le build puis supprimé aussitôt |

## G. Verdict

**GO** pour la fiabilité de tous les textes des volets Chaleurs estivales, Nuits tropicales, Températures moyennes
et Sécheresse des sols du module Territoire : surtitre, titre, sous-titre, lignes, récit, note, infobulle.

Limites restantes, **non corrigées** :
1. **Écart avec l'audit FUT-17 sur les nuits** : 102 communes non reproduites (167 à écart < 1 en 2030 avec le volet ouvert). Probablement une autre typologie ou un autre index au moment de la sonde.
2. **Volet Jours de pluie intense** : relu, aucune tendance affirmée (surtitre « Quand la pluie se concentre », récit explicatif). Non modifié.
