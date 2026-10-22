# FUT-127 · Les risques naturels du dossier : ce que futur•e sait, ce qu'il dit, ce qui reste à vérifier

Audit du 22 octobre 2026. Base : `main` à `3af53c3c` (worktree `docs/fut-127-audit-risques-naturels`).
Aucune modification métier ni UI, aucune donnée utilisateur lue ou modifiée, aucun appel Anthropic.

Pièces jointes, dans `docs/audits/2026-10-22-fut127-risques-naturels/` :

| Pièce | Ce qu'elle contient |
|---|---|
| `releves-georisques/*.json` | Réponses brutes de Géorisques (v1, v2), de la BAN et d'API Carto, relevées le 22/10/2026 sur 6 adresses publiques (La Rochelle, Charron, Châtelaillon-Plage), aux paramètres exacts de `src/lib/georisques.ts`. Aucun jeton n'y figure. |
| `diagnostic-moteur.mts` et `.sortie.txt` / `.sortie.json` | Le moteur de production (règles, compositions, assemblage, Relevé, composants de rendu) rejoué sur l'index réel et sur ces relevés. Commande : `node docs/audits/2026-10-22-fut127-risques-naturels/diagnostic-moteur.mts`. |
| `mesure-nationale.py` et `.sortie.txt` | Mesures nationales : index du comparateur croisé avec l'export public GASPAR du 05/10/2026. |

Ce qui est **réellement testé** : les fonctions de production, sur les vraies données de l'index et sur de vraies réponses Géorisques. Ce qui est **simulé** : le projet du lecteur (priorités, intention) et l'assemblage des faits logement à partir des relevés (par les fonctions de production `buildRegulatoryPlans`, `deriveLogementCoverage`, `buildLogementFacts`). Ce qui **n'a pas été fait** : aucune lecture des 58 dossiers historiques en base, aucun rendu dans un navigateur, aucun appel à la synthèse rédigée.

Suite de tests sur `main` avant audit : 2 956 tests, 0 échec (`npm test`).

---

## 1. Résumé exécutif

**La question posée.** Le dossier de La Rochelle dit « l'exposition de la commune à l'inondation ressort élevée » puis « Consultez l'état des risques (Géorisques) ». Est-ce une redélégation de l'analyse, alors que futur•e lit déjà Géorisques ?

**Réponse courte : oui, et le problème est plus profond que la phrase.** Trois défauts se cumulent, dont deux sont des erreurs de fond, pas de ton.

1. **Le constat communal « exposition élevée » ne mesure pas une exposition.** C'est le rang d'un compte de reconnaissances CatNat. Il bascule en « élevée » dès **4 reconnaissances depuis 1982**, ce qui concerne **48,3 % des communes et 80,6 % de la population**, et **99 % des villes de plus de 50 000 habitants**. Le compte suit surtout la taille de la commune (corrélation de rang 0,41). Il ne dit ni la probabilité d'une inondation, ni la part du territoire exposée, ni où.

2. **Dans le Dossier Adresse, futur•e sait déjà ce que le lecteur irait chercher sur Géorisques, et ne s'en sert pas pour l'inondation.** À l'adresse du Quai Duperré, futur•e a lu la zone orange Os1 du plan de prévention des risques littoraux (PPRL) de La Rochelle, régime « interdiction ». Le dossier affiche pourtant en premier contrôle « Consultez l'état des risques (Géorisques) », et la carte « plan applicable » ne nomme ni la zone, ni le régime, ni le phénomène.

3. **Erreur avérée, la plus grave : une fausse réassurance.** Le module Logement ne reconnaît pas les plans littoraux (`PPRN-L`) ni une partie des plans multirisques comme des plans « inondation ». À Charron, en **zone rouge Rs2, « zones submersibles en aléa très fort »**, futur•e écrit « Aucun plan de prévention des inondations ne réglemente ce point », et le dossier d'un acheteur qui demande un faible risque d'inondation conclut **« Bonne correspondance »**. Géorisques, lui, affiche « Inondation : risque existant » à cette adresse. Le défaut touche, au niveau national, **1 212 plans opposables dans 1 370 communes**.

**Ce qu'il faut retenir pour la valeur du dossier à 39 €.** futur•e lit déjà, à l'adresse, l'essentiel de ce qu'un état des risques dit sur les plans de prévention : le plan, la zone, le régime, la date. La valeur n'est pas de renvoyer vers Géorisques ; elle est de **dire ce que cette zone change pour ce projet**, de **réconcilier** zonage, historique communal et sinistralité, et de **désigner précisément ce qu'aucune donnée publique ne contient** : les sinistres subis par ce logement, les travaux que le règlement lui impose, et la confirmation de la zone par l'état des risques du vendeur, qui reste le seul document réglementaire.

**Décision recommandée avant le lancement V1 (détail au §12).**

- **P0, à corriger avant toute ouverture publique** : la classification des plans littoraux et multirisques (fausse absence), la règle inondation qui ignore le zonage lu à l'adresse (fausse réassurance et renvoi générique), et la formulation « exposition élevée » ainsi que la source « submersion marine exclue », qui est fausse.
- **Décision porteur nécessaire avant de coder** : le déclencheur de la carte communale (le seuil de 4 reconnaissances). Options chiffrées au §6.4.
- **P1 et P2** : peuvent suivre le lancement, sauf la mention « lecture informative, pas l'état des risques », peu coûteuse, que je recommande d'intégrer au P0.

---

## 2. La question fondamentale : ce que futur•e sait déjà, face à ce que Géorisques donne gratuitement

Tableau établi sur deux adresses réelles, à partir des relevés du 22/10/2026.

| Information | Ce que le lecteur trouve gratuitement sur Géorisques | Ce que futur•e a lu | Ce que futur•e affiche aujourd'hui |
|---|---|---|---|
| Plan de prévention au point (Quai Duperré, La Rochelle) | Rapport « Mes risques » : inondation, risque côtier « existant » à l'adresse ; ERRIAL : extrait de zonage du PPR | `PPR La Rochelle`, modèle `PPRN-L`, zone **Os1** « zones fortement urbanisées en aléa faible à modéré », régime **03 Interdiction** | Dossier : « un plan de prévention des risques s'applique : PPR La Rochelle » sans zone ni phénomène, et en premier contrôle « Consultez l'état des risques (Géorisques) ». Module Logement : le bloc réglementaire nomme bien la zone, mais la lecture inondation dit « **Aucun plan de prévention des inondations ne réglemente ce point** ». |
| Plan de prévention au point (Charron) | « Inondation : risque existant » à l'adresse | `PPR Charron`, `PPRN-L`, zone **rouge Rs2** « zones submersibles en aléa très fort à court terme », régime 03 | Verdict « **Bonne correspondance** » ; lecture inondation : « Aucun plan de prévention des inondations ne réglemente ce point ». |
| Aléas couverts par le plan | Fiche du PPR | Non lus (la réponse v2 au point ne les porte pas) ; disponibles par `/api/v2/gaspar/pprn/{idGaspar}` : « Inondation · Par submersion marine », « Recul du trait de côte » | Rien |
| Date d'approbation du plan | Fiche du PPR | Non lue : le code affiche `dateModification` (mise à jour de la fiche, 19/02/2025) ; l'approbation (26/02/2019 à La Rochelle, 10/08/2021 à Charron) est disponible par le même point d'accès de détail | « date de référence Géorisques : 19/02/2025 » dans un dépliable |
| Règlement et plan de zonage officiels | Téléchargeables | Disponibles en ZIP par `/api/v2/gaspar/pprn/{id}/documents` (règlement, plan de zonage, arrêtés, vérifié sur Charron) ; non utilisés | Un lien « Consulter la fiche officielle du plan » dans le module (bien) ; rien dans le dossier |
| Historique CatNat de la commune | Liste des arrêtés | Compte inondation dans l'index (7 à La Rochelle, 3 à Charron) ; liste complète en direct dans Territoire | « 7 reconnaissances… (comptage administratif, pas une probabilité) » : correct ; mais qualifié « exposition élevée » |
| Remontée de nappe à l'adresse | « Risque existant » (Quai Duperré et rue du Palais) | Non lue | Rien |
| Sinistralité indemnisée (ONRN/CCR) | Indicateurs communaux | Lue, commune, 1995-2021, bornée par sa représentativité | Correctement bornée (bon travail de FUT-69) |
| Sinistres subis par CE logement | **Personne** ne les publie : c'est le vendeur ou le bailleur qui les déclare dans l'état des risques | Impossible | Bon geste : « demandez au vendeur quels sinistres indemnisés… » |

**Conclusion du §2.** Sur le zonage réglementaire, futur•e n'est pas en retard sur Géorisques : il a la même donnée. Il la restitue mal pour l'inondation, et il la renvoie vers Géorisques au lieu de la dire. Le seul contrôle extérieur irremplaçable porte sur ce que les bases publiques ne contiennent pas (l'histoire du logement, les travaux prescrits réalisés) et sur la confirmation documentaire de la zone, qui relève de l'état des risques du vendeur.

---

## 3. Cartographie des sources et de leurs consommateurs

### 3.1 Appels Géorisques réellement faits

| Appel (fichier) | Paramètre | Ce que la réponse contient vraiment | Consommateurs effectifs |
|---|---|---|---|
| v1 `/gaspar/risques` (`georisques.ts:212`) | code INSEE (ville pour PLM) | Liste DDRM des risques recensés sur la commune | `riskFlagsFromLabels` → carte Territoire « Inondation fluviale » / « Submersion marine », synthèse déterministe Territoire, `risquesDeclares.wildfire` (règles feu) |
| v1 `/zonage_sismique` (`georisques.ts:216`) | code INSEE | Zone sismique communale | Territoire |
| v1 `/gaspar/risques?latlon` (`georisques.ts:263`) | point | **La même liste DDRM communale** (vérifié : identique à l'appel par code INSEE). Près d'une limite, **plusieurs communes** ; le code prend la première (à Mireuil, la liste de Lagord, sans inondation) | `pointHazards` (résidu communal, signalement mouvement de terrain), payload de synthèse (non : seulement la parcelle, cf. plus bas) |
| v2 `/api/v2/gaspar/pprn` au point et à la parcelle | lat/lon ; `codesParcelle` au format `17300-000-EN-0248` (vérifié valide ; l'IDU sans tirets rend 400) | Plans dont le zonage réglementaire concerne le lieu : `libPpr`, `modeleProcedure`, `zonageReglementaire` (codes COVADIS, zones locales), `dateModification`. **Ni aléas, ni date d'approbation, ni `libelleProcedure`/`libelleAlea`** | `buildRegulatoryPlans` → `deriveLogementCoverage` (moteur et module), `RegulatoryStatusBlock`, `zonageInondationDepuisPlans` |
| v2 `/api/v2/rga` | point, parcelle | Exposition argiles | Couverture `rga` → règle `logement.exposition-bati` |
| v2 `/api/v2/zonage_sismique` | point, parcelle | Zone sismique | Payload de synthèse (parcelle seulement) |
| v2 `/api/v2/gaspar/risques` à la parcelle (`georisques.ts:342`) | parcelle | Une **procédure DDRM** (« Dossier Départemental de Risques Majeurs »), sans `libelleRisqueLong` | `parcel.risks.labels` : **toujours vide** |
| v1 `/cavites`, `/mvt` | point, 500 m | Inventaires géolocalisés BRGM | `pointHazards`, règle `logement.cavite` |
| v1 `/gaspar/catnat` | code INSEE | Arrêtés CatNat de la commune | Carte « Mémoire des catastrophes » (direct) ; collecte de l'index (`scripts/gaspar/collecter-catnat.mts`) |
| ONRN/CCR (JSON embarqués) | code INSEE | Sinistralité indemnisée 1995-2021 | `logement.sinistralite`, `construireLectureInondation` |

### 3.2 Ce que l'API offre et que futur•e n'appelle pas (relevé dans `https://www.georisques.gouv.fr/api/v3/api-docs`, le 22/10/2026)

| Point d'accès | Intérêt pour FUT-127 |
|---|---|
| `/api/v2/gaspar/pprn/{idGaspar}` | **Aléas du plan** (corrige la classification), **date d'approbation**, lien préfecture. Vérifié sur Charron. |
| `/api/v2/gaspar/pprn/{idGaspar}/documents` | Règlement et plan de zonage officiels (ZIP de 5 Mo à Charron). |
| `/api/v1/resultats_rapport_risque?latlon` | Le rapport « Mes risques » : statut à l'adresse et à la commune pour inondation, remontée de nappe, risque côtier, recul du trait de côte. Sémantique des statuts **non documentée** (cf. §14). |
| `/api/v2/gaspar/azi`, `/tri`, `/papi` au point | Atlas de zones inondables (informatif), territoire à risque important d'inondation, programme de prévention. Charron : AZI « canal de Marans à La Rochelle » ; La Rochelle : TRI « La Rochelle Île de Ré ». |
| `/api/v2/gaspar/pprt` au point | Plans technologiques, utiles à la règle industrie. |

### 3.3 Chaîne de décision de l'inondation

```
Index (collecte GASPAR 05/10/2026) ── inondation.catnat (compte) ── rangsNationaux ── inondation.risque (0-100)
        │                                                                                     │
        └── catnatInondation ──┐                                       inondationRisque ──────┤
                               ▼                                                              ▼
              catnat-evidence.ts (phrases)                     materiality-rules.ts · ruleInondation
                                                               ( >= 66 : « exposition élevée » + Géorisques )
Géorisques v2 pprn (point, parcelle) ── buildRegulatoryPlans ── deriveLogementCoverage ── LogementFacts
        │                                                         (pprn: present/none/unavailable, label du plan)
        │                                                                     ▼
        │                                                  logement-rules.ts · logement.zone-reglementee
        │                                                  (« un plan de prévention s'applique : <nom> »)
        └── LogementModule.tsx ── zonageInondationDepuisPlans ── construireLectureInondation (module seulement)
```

Les deux branches ne se parlent pas : la règle inondation du dossier ignore `f.logement` ; la lecture à trois sources n'existe que dans le module Logement.

---

## 4. Tableau des données : disponible, échelle, affichage, limite, amélioration

| Donnée | Échelle | Fraîcheur | Ce que futur•e affiche | Limite (ce qu'elle ne permet pas de conclure) | Amélioration proposée |
|---|---|---|---|---|---|
| Reconnaissances CatNat inondation (compte) | Commune (ville entière pour Paris, Lyon, Marseille) | Index : collecte du 05/10/2026 | « 7 reconnaissances… depuis 1982 » | Acte administratif d'indemnisation, déclenché par une demande communale, sur « l'intensité anormale » de l'agent naturel. Ni probabilité, ni étendue, ni localisation. Dépend de la taille et des demandes de la commune. | Garder le fait, retirer « exposition élevée », dater la collecte, nommer la dernière année reconnue si l'index la porte. |
| Rang national du compte | Commune, univers : 34 788 communes de l'index (métropole, Corse comprise) | Idem | Invisible, mais décide de la carte et du mot « élevée » | Rang « part des communes au compte inférieur ou égal » : 4 reconnaissances = rang 66 ; massivement ex æquo ; proxy de taille. | Ne plus s'en servir comme déclencheur seul (§6.4). |
| Libellés de risques DDRM (`/gaspar/risques`) | Commune | Direct, cache 24 h | Territoire : « Inondation fluviale : une partie du territoire est concernée » ; « Submersion marine : le littoral fait partie des zones surveillées » | Inventaire départemental : la commune est concernée par un type de risque. Pas un périmètre, pas une surveillance. À La Rochelle, « Inondation » est le parent de « Par submersion marine » : rien ne dit qu'il est fluvial. | « Recensée au dossier départemental des risques majeurs » ; sous-aléa nommé ; retirer « fluviale », « périmètre », « surveillées ». |
| Plans de prévention au point | Point géocodé | Direct, cache mémoire | Module : plan, zone, régime (bien) ; dossier : nom du plan seul | Ne dit ni les aléas (non renvoyés), ni la date d'approbation ; une zone au point n'est pas forcément celle de la parcelle | Lire les aléas et l'approbation (détail), faire entrer zone, régime et aléa dans les faits du dossier. |
| Plans de prévention à la parcelle | Parcelle cadastrale, choisie au point ou, à défaut, **la plus petite dans un carré de 3, 8 ou 15 m** | Direct | Remplace le point quand il existe | La parcelle de repli peut être celle d'un voisin ; une zone différente du point n'est jamais signalée (Châtelaillon : Rs3 au point, Os à la parcelle) | Garder les deux lectures, signaler l'écart, dire la méthode de rattachement. |
| Argiles (RGA) | Point ou parcelle | Direct | « Le sol est exposé au retrait-gonflement des argiles » | Aléa du sol, pas un dommage du bâti | Inchangé (FUT-126 traite le vocabulaire). |
| ONRN/CCR | Commune, 1995-2021 | Jeu embarqué, mise à jour 2025 | Bien borné | Échantillon de contrats assurés | Inchangé. |
| Cavités, mouvements de terrain | 500 m autour du point | Direct | Bien borné | Inventaires d'ouvrages et d'événements connus | Inchangé. |
| Rapport « Mes risques » (nappe, côtier) | Adresse et commune | Non lu | Rien | Statuts non documentés | Évaluer avant tout usage (P2, Data Curator). |
| Champ `tri` de l'index | Commune | Jamais rempli | Rien | **Vaut `false` pour les 34 788 communes** : donnée morte | Retirer ou alimenter (P2). |
| `parcel.risks.labels`, `parcel.pprn.labels` | Parcelle | Toujours vides | Envoyés à la synthèse rédigée du module | Les champs lus (`libelleRisqueLong`, `libelleProcedure`, `libelleAlea`) n'existent pas dans les réponses v2 | Alimenter le payload depuis `regulatoryPlans` (P1, versionné). |

---

## 5. Sources publiques et réglementaires : ce qu'elles établissent, ce qu'elles ne permettent pas de conclure

Sources consultées le 22/10/2026. Légifrance n'a pas répondu à la lecture automatique ; le texte du décret a été lu dans sa reproduction officielle sur AIDA (INERIS). Les sites de préfecture étaient en maintenance : quand une information n'a été vue que par un moteur de recherche, c'est dit.

| # | Source | Ce qu'elle permet d'établir | Ce qu'elle ne permet pas de conclure | Référence |
|---|---|---|---|---|
| 1 | **Reconnaissances CatNat** (base GASPAR) | Qu'un épisode d'inondation a été reconnu pour la commune, à une date, ouvrant l'indemnisation des biens assurés | Une probabilité, une étendue, une localisation, une gravité. La reconnaissance suit une **demande du maire** et porte sur « l'intensité anormale de l'agent naturel », non sur l'importance des dégâts ; elle est communale. | Code des assurances, art. L. 125-1 ; procédure décrite par les préfectures (ex. [Oise](https://www.oise.gouv.fr/contenu/telechargement/76170/458790/file/Doc%204%20proc%C3%A9dure%20catatstrophe%20naturelle%20%C3%A0%20destination%20des%20maires.pdf)) ; export [GASPAR](https://files.georisques.fr/GASPAR/gaspar.zip) du 05/10/2026 |
| 2 | **Zonages d'aléa** (AZI, cartes TRI) | Qu'une zone a été cartographiée comme inondable pour un scénario | Aucune règle d'urbanisme ; aucune obligation d'information à elle seule | API Géorisques v2 `/gaspar/azi`, `/gaspar/tri` |
| 3 | **Plans de prévention (PPRN, dont PPRL)** | Approuvés, ce sont des **servitudes d'utilité publique** annexées au document d'urbanisme (C. env. L. 562-4) ; le zonage fixe des régimes (prescriptions, interdiction, interdiction stricte) ; le **règlement** dit ce qui est autorisé et ce qui est prescrit au bâti existant | Que le lieu sera inondé ; qu'un lieu hors zone ne l'est pas ; les travaux autorisés (seul le règlement les dit) | Code de l'environnement L. 562-1 et suivants ; fiche et documents de chaque plan sur Géorisques |
| 4 | **Données au point** (v2 `pprn`, `rga`, sismique ; rapport « Mes risques ») | Ce que les zonages publiés disent du point géocodé | Le point BAN peut tomber sur la voirie ou à côté du bâtiment ; une parcelle peut être traversée par plusieurs zones | Relevés joints |
| 5 | **Données à la parcelle** (ERRIAL, v2 `codesParcelle`) | Le rattachement réglementaire d'une parcelle cadastrale. ERRIAL « localise un bien à la parcelle et consolide automatiquement les risques », puis pré-remplit l'état des risques | Que la version préparée est exacte et complète : le propriétaire la vérifie et la complète | [data.gouv.fr, ERRIAL](https://www.data.gouv.fr/pages/onboarding/errial/) |
| 6 | **État des risques** remis par le vendeur ou le bailleur | Le document réglementaire de la transaction. Il porte la date, la parcelle, les zones ; pour chaque PPR un extrait du zonage et du règlement et les travaux prescrits ; la zone sismique, le radon, le recul du trait de côte ; **la liste des arrêtés CatNat ayant affecté le bien et donné lieu à indemnisation**. Remis **dès la première visite**, établi depuis **moins de six mois**, mis à jour à la promesse, à l'acte ou au bail, auxquels il est annexé. Les annonces doivent porter la mention « Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques ». | Il ne dit rien des biens hors du champ (R. 125-23 : PPR prescrit ou approuvé, sismicité 2 à 5, radon 3, recul du trait de côte) | Décret n° 2022-1289 du 1er octobre 2022 (JO du 5/10/2022, en vigueur au 1/01/2023), art. R. 125-23 à R. 125-27 du code de l'environnement, [reproduction AIDA/INERIS](https://aida.ineris.fr/node/40530) |
| 7 | **Rapport « Mes risques » de Géorisques** | Une synthèse indicative par adresse | Selon la préfecture du Finistère (vu par moteur de recherche, page en maintenance le 22/10), il ne constitue pas un état des risques conforme | Relevés joints |

Le point central du ticket se vérifie donc dans les textes : **un rang élevé de reconnaissances CatNat n'est ni une probabilité d'inondation à une adresse, ni une mesure de la superficie exposée**, et la seule pièce qui fait foi pour un bien est l'état des risques.

---

## 6. Le rang CatNat : ce qu'il classe exactement

### 6.1 Définition dans le code

- **Unité** : ligne GASPAR du groupe « Inondations » (`simplifyCatnatRisk`), soit « Inondations et/ou Coulées de Boue », « Inondations Remontée Nappe », coulées, crues. Un arrêté × un phénomène × un événement (`src/lib/data/gaspar-catnat-collecte.ts:180`).
- **Période** : depuis 1982, toutes communes.
- **Univers** : les 34 788 communes de l'index (France métropolitaine, Corse comprise, DROM exclus).
- **Rang** : part des communes dont le compte est inférieur ou égal, arrondie (`rangsNationaux`). Avec des milliers d'ex æquo, un compte de 4 vaut 66.
- **Seuil** : `inondationRisque >= 66` (`materiality-rules.ts:93`), qualifié « élevée » dans la phrase et jamais affiché.

### 6.2 Distribution mesurée (`mesure-nationale.sortie.txt`)

| Compte depuis 1982 | Communes | Population |
|---|---|---|
| ≥ 4 (seuil actuel, rang 66) | 48,3 % | 80,6 % |
| ≥ 6 | 23,5 % | 62,1 % |
| ≥ 8 | 10,9 % | 45,8 % |
| ≥ 10 | 4,8 % | 32,3 % |

| Taille de commune | Médiane du compte | Part classée « élevée » |
|---|---|---|
| moins de 500 hab. | 3 | 34 % |
| 500 à 2 000 | 4 | 56 % |
| 2 000 à 10 000 | 6 | 76 % |
| 10 000 à 50 000 | 8 | 90 % |
| plus de 50 000 | 12 | 99 % |

Le même dépôt écrit ailleurs que l'inondation « recensée » (51,4 % des communes) est « si universelle qu'elle ne distingue plus rien » (`materiality-rules.ts:554`). Le seuil du rang en fait autant.

### 6.3 Deux faux signaux, chiffrés

- **Fausse alerte** : 8 900 communes classées « élevées » (53 % d'entre elles) n'ont **aucun** plan de prévention des inondations opposable.
- **Fausse réassurance** : 3 291 communes **couvertes** par un plan inondation opposable (29,4 %) sont sous le seuil, donc « satisfied ». Parmi les 468 communes à plan **submersion** opposable, 160 sont sous le seuil, dont Charron, Ars-en-Ré, Barbâtre, Carnac.

Et l'unité affichée est fausse : la source du compte se présente comme « submersion marine exclue » (`catnat-evidence.ts:157`), or **aucune** reconnaissance GASPAR n'est libellée « submersion ». Xynthia (27/02/2010) est reconnue dans 721 communes de Charente-Maritime et de Vendée sous « Inondations et/ou Coulées de Boue » : elle est comptée. L'exclusion ne retire rien. À La Rochelle, les 7 lignes sont : 1982, 1987, septembre 1999, décembre 1999 (tempête), 2001, 2010 (Xynthia), 2023 (remontée de nappe). Charron, endeuillée par Xynthia, en a 3 : ce qui les sépare, ce sont des épisodes intérieurs, pas l'exposition à la mer.

### 6.4 Options de déclenchement (décision porteur, à trancher avant de coder)

Rappel de doctrine : une convention chiffrée se discute avant d'être codée. Les parts sont mesurées sur l'index et l'export GASPAR du 05/10/2026.

| Option | Déclencheur de la carte communale (priorité inondation déclarée) | Communes | Population | Avantage | Risque |
|---|---|---|---|---|---|
| Actuelle | compte ≥ 4 | 48,3 % | 80,6 % | aucun | bruit, proxy de taille, fausse réassurance |
| **A (recommandée)** | commune couverte par un **plan de prévention opposable ou prescrit portant inondation ou submersion** | 34,2 % | 59,7 % | fait réglementaire, vérifiable, et l'inconnu décisif est précis (« dans quelle zone sera votre adresse ? ») | exige une donnée nouvelle dans l'index (export GASPAR pprn, daté) |
| B | A, **ou** compte ≥ 8 | 35,7 % | 71,3 % | couvre les communes très reconnues sans plan | le seuil 8 reste une convention de rareté, à afficher |
| C | compte ≥ 8 seul | 10,9 % | 45,8 % | minimal, sans donnée nouvelle | garde un proxy de taille, ignore les plans |

Dans toutes les options, **avec une adresse, c'est la zone au point qui gouverne** (§8, P0-B), et l'historique communal devient du contexte.

---

## 7. Cas concrets

Sortie complète : `diagnostic-moteur.sortie.txt`. Projet simulé : priorités « faible risque d'inondation » (poids 3) et « accès aux soins » (poids 2).

### Cas A · La Rochelle, dossier communal

- Index : `{ catnat: 7, risque: 89 }`. Règle : `verification`.
- Verdict : « Correspondance à nuancer · Le principal point à contrôler à La Rochelle : l'exposition à l'inondation. »
- Carte (acheteur, A1 ; futur locataire, A4) : « L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques avant de vous engager. La commune a connu 7 reconnaissances… (comptage administratif, pas une probabilité). » Geste : « Consultez l'état des risques (Géorisques) », détail « Le service ERRIAL de Géorisques permet de préparer gratuitement l'état des risques ». **Reproduit exactement la recette.**
- Habitant (A3) : « …ressort élevée, à comprendre et surveiller au fil des épisodes », geste « Consultez l'état des risques applicable à votre adresse ».

**Ce que futur•e peut affirmer** : 7 reconnaissances inondation depuis 1982, dates connues ; la commune figure au dossier départemental pour l'inondation par submersion marine ; elle est couverte par un PPR littoral approuvé le 26/02/2019 (submersion marine, recul du trait de côte) et appartient au TRI « La Rochelle Île de Ré ». Ces deux derniers faits ne sont pas lus aujourd'hui par le dossier.
**Ce que le rang signifie** : 89 % des communes ont 7 reconnaissances ou moins.
**Ce qui ne peut pas être déduit** : une probabilité, une part exposée, une localisation ; ni qu'une adresse donnée est en zone.
**Défauts** : « exposition élevée » (§6) ; le locataire reçoit le service ERRIAL, outil du propriétaire qui prépare le document, alors que c'est au bailleur de le remettre.

### Cas B · La Rochelle, Dossier Adresse

| Cas | Zonage réel | Ce que le dossier dit | Ce que le module Logement dit |
|---|---|---|---|
| B1 · Quai Duperré (achat) | PPRN-L, **Os1**, régime 03 | Contrôles prioritaires : « **Consultez l'état des risques (Géorisques)** », puis fissures. Carte : « un plan de prévention des risques s'applique : PPR La Rochelle », geste « Consultez le règlement de la zone en mairie ». | Bloc réglementaire juste (zone, régime). Lecture inondation : « **Aucun plan de prévention des inondations ne réglemente ce point. D'autres plans s'y appliquent, pour d'autres phénomènes.** » |
| B2 · 12 rue du Palais (achat) | Aucune zone au point ni à la parcelle | Même renvoi Géorisques en premier contrôle | « Aucun plan de prévention des inondations ne réglemente ce point » (vrai pour ce plan), mais Géorisques signale une remontée de nappe « existante » à l'adresse, non lue |
| B3 · zone bleue Bs (location) | PPRN-L, Bs2, régime 02 | Renvoi Géorisques + « Demandez au bailleur les prescriptions qui s'appliquent » | Même fausse absence qu'en B1 |

**Le dossier distingue-t-il risque communal, exposition de l'adresse et statut réglementaire ?** Les cartes portent leur grain (commune, adresse), mais **le statut réglementaire n'est jamais relié à l'inondation**, et la carte communale reste la carte principale alors que l'adresse est lue. Le lecteur reçoit trois messages juxtaposés, dont un faux.

### Cas C · Une adresse contrastée : Charron, zone rouge submersible

**Choix justifié** : Charron (17091) est couverte par un PPR littoral approuvé le 10/08/2021 (export GASPAR, fiche `17DDTM20100006`) ; l'adresse « Rue du 19 Mars 1962 » tombe, au point et à la parcelle `17091-000-AM-0006`, dans la zone rouge **Rs2** « Ensemble des zones submersibles en aléa très fort à court terme », régime 03 ; le rapport Géorisques à cette adresse affiche « Inondation : risque existant ». Ce sont des sources contrôlables, archivées.

| Cas | Règle inondation | Verdict | Ce que lit le lecteur |
|---|---|---|---|
| C1 · dossier communal | `satisfied` (compte 3, rang 52) | « **Bonne correspondance** · Charron semble bien correspondre à votre projet. » | Rien sur l'inondation |
| C2 · Dossier Adresse, achat | `satisfied` | « **Bonne correspondance** » | « un plan de prévention des risques s'applique : PPR Charron » ; module : « **Aucun plan de prévention des inondations ne réglemente ce point** » |
| C3 · inondation confirmée comme condition | `satisfied` | « Condition ouverte » | « **Ouverte · plutôt favorable** · À l'échelle de la commune, rien de défavorable n'apparaît pour un faible risque d'inondation. » |
| C4 · Châtelaillon, 10 bd de la Mer | `verification` (compte 4, rang 66) | « Correspondance à nuancer » | Renvoi Géorisques ; **zone rouge Rs3 au point, orange Os à la parcelle**, seule la parcelle est montrée, sans le dire |

C2 et C3 sont les défauts les plus graves de l'audit : une fausse réassurance sur la priorité que le lecteur a lui-même déclarée, contredite par la source officielle qu'il consultera.

### Cas D · Source indisponible ou incomplète

| Situation | Comportement observé | Jugement |
|---|---|---|
| D1 · Géorisques muet au point et à la parcelle | Inconnue nommée « Le zonage réglementaire (plans de prévention) n'a pas pu être vérifié à cette adresse », plus la carte communale et son renvoi Géorisques ; lecture du module sans ligne « à cette adresse » | **Correct** : l'absence n'est pas transformée en absence de risque. Ici le renvoi vers l'état des risques est légitime, mais il doit dire ce qu'il faut y lire. Le générateur d'artefact refuse déjà de figer une version où une vérification structurante manque (`verificationsMateriellesIndisponibles`). |
| Parcelle introuvable (point sur la voirie) | Repli sur la plus petite parcelle d'un carré de 3, 8 puis 15 m, présentée comme « la parcelle » | **Risque** : rattachement possible à un voisin, sans le dire ; le bloc réglementaire écrit alors « Grain : adresse (la donnée répond au point géocodé, pas à la géométrie de la parcelle) », ce qui est faux quand la parcelle a répondu. |
| Commune lue, lecture locale non concluante (plan multirisque sans aléa connu) | « Aucun plan de prévention des inondations ne réglemente ce point. D'autres plans s'y appliquent » | **Faux** quand le plan multirisque couvre l'inondation (1 212 plans opposables concernés, §6.3 et §9). |
| Point près d'une limite communale | v1 `latlon` rend deux communes, le code prend la première (Mireuil : Lagord) | Résidu communal du module potentiellement celui d'une autre commune. |

---

## 8. Formulations : établi, inconnu, à vérifier

Règles d'écriture tenues : pas d'affirmation plus forte que la preuve ; « contrôle officiel » réservé au document réglementaire, « à vérifier » aux gestes du lecteur ; pas de tiret cadratin ; le lecteur sujet de la phrase ; aucune obligation juridique énoncée comme telle tant que le produit ne sait pas sourcer un fondement (précaution 1 de `logement-gestes.ts`, cf. FUT-12).

### F1 · Carte communale inondation (`materiality-rules.ts:158-170`)

Actuel : « L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques avant de vous engager. » Geste « Consultez l'état des risques (Géorisques) ».

Proposé, commune couverte par un plan (option A), achat :
- **Établi** : « La Rochelle est couverte par un plan de prévention des risques littoraux, approuvé le 26 février 2019, qui réglemente la submersion marine et le recul du trait de côte. Depuis 1982, la commune a été reconnue 7 fois en catastrophe naturelle pour des inondations. »
- **Inconnu** : « Ces deux faits portent sur la commune. Ils ne disent pas si une adresse se trouve dans une zone du plan, ni laquelle. Le nombre de reconnaissances retrace des décisions d'indemnisation : il n'indique ni la probabilité d'une inondation ni la part du territoire exposée. »
- **À vérifier** (geste, type `renseigner_adresse`) : « Ajoutez l'adresse du bien pour lire sa zone dans le plan ». Détail : « Avant une offre, l'état des risques remis par le vendeur indique la zone de la parcelle : c'est le document qui fait foi. »

Commune sans plan, mais au-dessus du seuil retenu (option B) : « Aucun plan de prévention des inondations n'est approuvé ni prescrit dans la commune selon la base GASPAR (5 octobre 2026). Depuis 1982, elle a été reconnue N fois… » avec la limite : « Un plan absent ne protège de rien : ruissellement et remontées de nappe sont rarement couverts par un plan. »

Habitant : « Retrouvez l'état des risques remis à l'achat ou à la signature du bail : il indique la zone de votre logement. »

Locataire : « Demandez au bailleur l'état des risques dès la visite », jamais le service ERRIAL, qui est l'outil de celui qui prépare le document.

### F2 · Dossier Adresse, adresse en zone (nouvelle composition, P0-B)

Quai Duperré, achat :
- **Établi** : « Cette adresse est en zone orange Os1 du plan de prévention des risques littoraux de La Rochelle, approuvé le 26 février 2019. Le plan range cette zone sous un régime d'interdiction : certains projets y sont interdits, et le règlement fixe ce qu'il impose au bâti existant. À l'échelle de la commune, 7 reconnaissances de catastrophe naturelle pour des inondations depuis 1982. »
- **Inconnu** : « Le zonage et les reconnaissances ne disent pas si ce logement a déjà été inondé, ni si les travaux que le règlement prescrit ont été faits. »
- **À vérifier** : 1) « Demandez l'état des risques au vendeur dès la visite et vérifiez qu'il indique la zone Os1. » Détail : « Il doit dater de moins de six mois. Une zone différente de celle lue ici appelle une explication. Demandez aussi quels sinistres indemnisés ont touché ce logement. » 2) « Lisez ce que le règlement impose en zone Os1 au bâti existant » (lien vers le règlement officiel du plan).

Charron, zone rouge Rs2 : même structure, avec le libellé du plan entre guillemets : « zones submersibles en aléa très fort à court terme ». **Le verdict ne peut plus être « Bonne correspondance »** : pour une priorité « faible risque d'inondation », une zone d'interdiction d'un plan inondation ou submersion au point est une exposition établie (rôle `verification` orientant, cf. `VERIFICATIONS_ORIENTEES`). Le palier (`decision_critical` pour les régimes 03 et 04, `structuring` pour 02) est une décision porteur.

### F3 · Dossier Adresse, adresse hors zone (rue du Palais)

- **Établi** : « Le point de cette adresse n'est dans aucune zone du plan de prévention des risques littoraux de La Rochelle. Ce plan réglemente la submersion marine et le recul du trait de côte. »
- **Inconnu** : « Il ne couvre pas les autres formes d'inondation, comme les remontées de nappe. La commune a été reconnue 7 fois en catastrophe naturelle pour des inondations depuis 1982, dont une remontée de nappe en 2023. »
- **À vérifier** : « Demandez au vendeur l'état des risques et si le logement a déjà subi une inondation indemnisée. »

### F4 · Point et parcelle divergents (Châtelaillon)

« Le point géocodé de cette adresse tombe en zone rouge Rs3, la parcelle rattachée en zone orange Os du même plan. Une parcelle peut être traversée par plusieurs zones, et le point peut tomber à côté du bâtiment. » À vérifier : « Demandez l'état des risques du bien : établi à la parcelle, il fixe la zone applicable. Comparez-la aux deux lectures ci-dessus. »

### F5 · Source indisponible (D1)

« Le zonage de cette adresse n'a pas pu être lu : le service de l'État n'a pas répondu lors de la préparation du dossier. » Puis les faits communaux (F1). À vérifier : « Demandez l'état des risques du bien : il indique sa zone. Le rapport “Mes risques” de Géorisques la donne aussi pour une adresse. » Ici, le renvoi externe **est** la réponse principale, et c'est honnête.

### F6 · Lecture inondation du module (`inondation-lecture.ts:136-167`)

Actuel (PPRN-L) : « Aucun plan de prévention des inondations ne réglemente ce point. D'autres plans s'y appliquent, pour d'autres phénomènes. »
Proposé : « Un plan de prévention des risques littoraux réglemente ce point (submersion marine, recul du trait de côte) : zone Os1. » Plan multirisque à aléas inconnus : « Un plan de prévention multirisque réglemente ce point ; la donnée reçue ne précise pas s'il couvre l'inondation. » Jamais « aucun plan des inondations » sans aléas connus.

### F7 · Source du compte CatNat (`catnat-evidence.ts:157`)

Actuel : « Reconnaissances CatNat inondation (GASPAR), submersion marine exclue · catnat-2 ».
Proposé : « Reconnaissances de catastrophe naturelle liées aux inondations, base GASPAR (collecte du 5 octobre 2026) ». La version de convention reste dans la méthode, pas dans la source affichée.

### F8 · Carte Territoire « Inondation fluviale » (`QuartierClimatData.tsx:608-616`) et synthèse déterministe (`synthesis-deterministe.ts:173-176`)

Actuel : « Inondation fluviale · Une partie du territoire est concernée » / « Aucun périmètre recensé » ; « Submersion marine · Le littoral fait partie des zones surveillées » ; « Des périmètres d'inondation et de submersion marine y sont recensés. »
Proposé : libellé « Inondation » ; valeur « Recensée sur la commune » avec, s'il existe, le sous-aléa (« par submersion marine ») ; absence : « Non recensée au dossier départemental » ; synthèse : « La commune figure au dossier départemental des risques majeurs pour l'inondation, par submersion marine. » Ni « fluviale », ni « périmètre », ni « surveillées ».

### F9 · Règle industrie (`materiality-rules.ts:842-847`)

Actuel : « Consultez l'état des risques applicable à l'adresse », détail sur le PPRT « s'il existe (Géorisques) ».
Proposé sans adresse : « Ajoutez l'adresse du bien pour savoir s'il est dans le périmètre d'un plan de prévention des risques technologiques. » Avec adresse : lire `/api/v2/gaspar/pprt` au point (P1) et dire le résultat ; à défaut, « L'état des risques du bien indique s'il est dans le périmètre d'un plan de prévention des risques technologiques. »

### F10 · Geste réglementaire, achat (`logement-gestes.ts:117`)

Actuel : « Consultez le règlement de la zone en mairie ». Proposé quand la zone est connue : « Lisez ce que le règlement impose en zone Os1 au bâti existant », lien vers le document officiel ; la mairie reste citée pour les projets de travaux.

### F11 · Mention de portée, à ajouter au bloc « Statut réglementaire à cette adresse »

« Cette lecture vient des zonages publiés par l'État. Elle prépare la lecture de l'état des risques sans le remplacer : c'est ce document, remis par le vendeur ou le bailleur, qui fait foi pour le bien. »

### Les renvois externes examinés et conservés

| Renvoi | Verdict |
|---|---|
| `GESTES.sinistralite` (« Demandez l'état des risques et les sinistres indemnisés ») | **Utile** : il vise la seule information que nul ne publie. À garder. |
| `GESTES.cavite.neutre` (« La mairie et Géorisques indiquent les cavités connues ») | Acceptable : futur•e a déjà lu le recensement ; à reformuler en P2 pour dire ce qui a été lu. |
| `GESTES.patrimoine` (mairie, ABF) | Utile : la règle locale n'est pas dans la donnée. |
| Radon, feu recensé | Constat établi puis geste concret, sans renvoi générique. Conformes. |

---

## 9. Anomalies avérées et opportunités

### Anomalies avérées (prouvées par relevé ou par le moteur)

| # | Anomalie | Preuve | Gravité |
|---|---|---|---|
| AN-1 | Plans littoraux et multirisques non reconnus comme « inondation » : fausse absence écrite au lecteur | Cas B1, B3, C2, C4 ; 1 212 plans opposables, 1 370 communes | **P0** |
| AN-2 | La règle inondation du dossier ignore le zonage lu à l'adresse : fausse réassurance et verdict « Bonne correspondance » en zone rouge submersible | Cas C2, C3 | **P0** |
| AN-3 | Renvoi générique « Consultez l'état des risques (Géorisques) » en premier contrôle alors que la zone est lue | Cas B1 à B3, C4 | **P0** (objet du ticket) |
| AN-4 | « Exposition élevée » déclenchée à 4 reconnaissances (48 % des communes, 99 % des grandes villes), sans convention affichée | §6 | **P0** (formulation) ; seuil : décision porteur |
| AN-5 | Source affichée « submersion marine exclue » : fausse, aucune reconnaissance n'est ainsi libellée | §6.3 | **P0** (provenance fausse) |
| AN-6 | Payload de la synthèse Logement : `risks` toujours vide (champs inexistants dans les réponses v2) | `logement-synthesis-cache.ts:264`, relevés | P1 |
| AN-7 | Bloc réglementaire : « Grain : adresse… pas à la géométrie de la parcelle » alors que la parcelle est lue en priorité ; écart point/parcelle jamais signalé ; parcelle de repli possiblement voisine | Cas C4, `RegulatorySection.tsx:192`, `cadastre.ts:142` | P1 |
| AN-8 | Carte Territoire « Inondation fluviale », « périmètre », « zones surveillées » : plus fort que l'inventaire DDRM | §8 F8 | P1 |
| AN-9 | v1 `latlon` multi-communes : première commune prise | Relevé Mireuil | P1 |
| AN-10 | Aucune mention, dans le produit, que la lecture d'adresse n'est pas l'état des risques ; le `caveat` de la route qui le dit n'est affiché nulle part | `georisques-logement/route.ts:171`, grep des composants | P1 (recommandé avec le P0) |
| AN-11 | Champ `tri` de l'index faux pour toutes les communes | §4 | P2 |
| AN-12 | Fixture `fut87` : régime `03` libellé « Prescriptions » (03 = Interdiction) | `fixture-logement.ts` | P2 (dev seulement) |
| AN-13 | `HAZARD_LABEL` ignore `PPRN-L` et `PPRN-Multi` : le dépliable ne nomme pas le risque | `RegulatorySection.tsx:35` | P1 (avec AN-1) |

### Opportunités (rien de faux aujourd'hui, valeur à gagner)

| # | Opportunité | Valeur | Coût |
|---|---|---|---|
| OP-1 | Date d'approbation et aléas du plan (`/pprn/{id}`) | Phrase datée, précise | 1 appel par plan, mis en cache |
| OP-2 | Lien vers le règlement et le plan de zonage officiels | Le lecteur lit sa zone dans le texte qui fait foi | faible |
| OP-3 | Plans de prévention de la commune dans l'index (export GASPAR, daté) | Carte communale factuelle (option A) | script de collecte, sur le modèle de `collecter-catnat.mts` |
| OP-4 | Remontée de nappe et risque côtier à l'adresse (rapport « Mes risques ») | Comble le trou de F3 | **conditionné** à une évaluation Data Curator : sémantique non documentée |
| OP-5 | AZI au point | Zone inondable informative hors plan | faible ; doit rester distinguée du réglementaire |
| OP-6 | PPRT au point pour la règle industrie | Supprime F9 | faible |

---

## 10. La valeur du Dossier Adresse face à Géorisques (regard Product Strategist)

**Ce que le lecteur obtient gratuitement ailleurs.** Sur Géorisques : la zone de son adresse, un rapport de statuts par risque, l'état des risques pré-rempli par ERRIAL. Chez le vendeur : l'état des risques, obligatoire, dès la première visite. Cette donnée est une commodité (cadrage Product Strategist du 02/07/2026, `docs/rapports-agents/product-strategist/2026-07-02-cadrage-module-logement.md`), et le Business Strategist l'avait dit au moment de fixer les 39 € : « le réglementaire est le socle de crédibilité, jamais l'argument de vente ».

**Ce que futur•e peut apporter, et qu'un ERP n'apporte pas.**

1. **La mise en relation avec le projet.** L'ERP liste ; il ne dit pas que la zone Os1 contredit la priorité « faible risque d'inondation » d'un acheteur, ni qu'elle compte moins pour quelqu'un dont l'inondation n'est pas une priorité. futur•e le peut, et c'est son moteur.
2. **La hiérarchie des conséquences.** Zone rouge d'interdiction, zone bleue de prescriptions, hors zone : trois décisions différentes. Aujourd'hui, le dossier les rend toutes par « un plan s'applique ».
3. **La réconciliation des échelles.** Zonage au point, historique communal, sinistralité assurantielle : chaque source répond à une autre question. `construireLectureInondation` le fait déjà bien dans le module ; le dossier ne l'a pas.
4. **Le contrôle transactionnel ciblé.** « Vérifiez que l'état des risques indique la zone Os1 » est un geste qu'on peut faire en deux minutes et qui détecte une erreur. « Consultez Géorisques » ne détecte rien.
5. **La compréhension de ce qu'aucune source ne dit.** Les sinistres du logement, les travaux prescrits faits ou non.

**Répétitions entre modules.** Le même sujet apparaît aujourd'hui dans quatre endroits du Dossier Adresse : la carte communale inondation, la carte « plan applicable », la carte sinistralité (« Demandez l'état des risques et les sinistres indemnisés ») et la lecture du module. Deux gestes renvoient à l'état des risques, sous deux formulations. La composition proposée (P0-B) les ramène à une carte et un geste, comme FUT-20 l'a fait pour la chaleur.

**Ce qu'il ne faut pas faire.** Ajouter des couches (AZI, nappe, PAPI, TRI) sans les interpréter. Une donnée de plus n'est une valeur que si elle change une décision ou un geste. OP-4 et OP-5 n'entrent qu'à cette condition.

**Gain attendu pour le lecteur.** Il lit, en une carte : sa zone, ce qu'elle implique, ce qui reste inconnu, et deux vérifications précises à faire auprès du vendeur. Le renvoi vers Géorisques disparaît là où futur•e sait, et reste là où il ne sait pas (D1).

---

## 11. Plan de correction priorisé, fichiers et tests

Toutes les corrections du moteur sont **versionnées** : `ENGINE_VERSION` passe de `engine-6` à `engine-7` (`src/lib/decision/decision-artifact.ts:66`), un artefact `engine-6` se relit tel quel. Aucun des 58 dossiers figés n'est réécrit ; aucune régénération Anthropic.

### P0 · avant l'ouverture publique V1

**P0-A · Reconnaître les plans littoraux et multirisques** (AN-1, AN-13)
- `src/lib/pprn-zonage.ts` : `RegulatoryPlan` reçoit `aleas: string[] | null` (`null` = inconnus) et `approbation: string | null`.
- `src/lib/georisques.ts` : pour chaque plan au point ou à la parcelle, lire `/api/v2/gaspar/pprn/{idGaspar}` (aléas, approbation), avec cache ; panne = `aleas: null`, jamais `[]`.
- `src/lib/decision/inondation-lecture.ts` : `zonageInondationDepuisPlans` classe `PPRN-L` comme littoral (submersion), lit les aléas quand ils existent, et introduit un état « plan à aléas inconnus » qui interdit « aucun plan des inondations ».
- `src/components/report/logement/RegulatorySection.tsx` : `HAZARD_LABEL` complété ; texte du grain corrigé (point ou parcelle, selon la source réelle).
- Tests : `inondation-lecture.test.ts` sur les relevés réels joints (Quai Duperré, Charron, Châtelaillon, rue du Palais) ; un test qui vérifie, pour chaque modèle connu de l'export GASPAR, qu'aucun ne produit une fausse absence.
- **Décision porteur** : ce rendu se calcule à l'affichage depuis les plans stockés ; la correction changera donc le texte des modules Logement déjà consultés. Je recommande de l'appliquer : elle retire une affirmation fausse, sans toucher aux données stockées. À trancher explicitement.

**P0-B · La règle inondation lit l'adresse** (AN-2, AN-3)
- `src/lib/decision/decision-fact.ts` : `LogementFacts.zonageInondation` (état, plan, modèle, aléas, zone, régime, approbation, grain, divergence point/parcelle).
- `src/lib/decision/logement-coverage.ts`, `src/lib/decision/logement-facts.ts`, `src/lib/server/logement-decision-data.ts` : le dériver une fois, comme la couverture.
- `src/lib/decision/materiality-rules.ts` (`ruleInondation`) : avec une adresse lue, la zone gouverne (en zone : `verification` orientante ; hors zone : constat communal en contexte ; indisponible : comportement actuel, renvoi ciblé F5).
- `src/lib/decision/fact-compositions.ts` : patron « inondation à l'adresse » qui absorbe `logement:zone-reglementee` quand le plan porte l'inondation (sur le modèle de `composeAmbientHeatHousing`).
- `src/lib/decision/condition-rules.ts` : une condition « faible risque d'inondation » ne peut plus être « plutôt favorable » quand l'adresse est en zone.
- Tests : nouveau `src/lib/fut127-inondation-adresse.test.ts` sur le modèle de `fut20-chaleur-logement.test.ts` (vraie chaîne, rendu des composants de production), couvrant achat, location, habitant, neutre × commune seule, adresse en zone, hors zone, indisponible, divergence ; parité présentation classique et Relevé (`lireDossier`) ; et l'assertion « la carte dit vrai », pas seulement « la carte apparaît » (AGENTS.md). Mettre à jour `materiality-rules.test.ts`, `fact-compositions.test.ts`, `fut110-conditions-confirmees.test.ts`, `decision-artifact.test.ts`.

**P0-C · La carte communale dit des faits** (AN-4, AN-5)
- `src/lib/decision/materiality-rules.ts` : retirer « ressort élevée », écrire F1 ; `signalConvention` affiche le déclencheur retenu.
- `src/lib/decision/catnat-evidence.ts` : `sourceCatnatInondation` (F7). Le compte ne change pas, la convention `catnat-2` reste ; seul le libellé change.
- Option A ou B retenue : `scripts/gaspar/collecter-pprn.mts` (nouveau, sur le modèle de `collecter-catnat.mts`, depuis l'export daté), champ d'index, `module-facts-map.ts`, `ModuleFacts`.
- Tests : `materiality-rules.test.ts`, `catnat-evidence.test.ts`, `fut60-catnat.test.ts`, `parity.test.ts` ; test de non-régression qui interdit « élevée » sur la carte inondation.
- **Décision porteur** : l'option de déclenchement (§6.4).

**P0-D · Dire la portée** (AN-10) : F11 dans `RegulatorySection.tsx` et dans la limite de la composition P0-B.

### P1 · peut suivre le lancement

| # | Correction | Fichiers | Tests |
|---|---|---|---|
| P1-1 | Payload de synthèse Logement alimenté par les plans et zones (versionné : seules les nouvelles versions régénèrent) | `logement-synthesis-cache.ts`, `georisques.ts` (retirer les champs morts), prompt `api/synthesize-logement/route.ts` | `logement-synthesis-cache.test.ts`, `logement-synthese-empreinte.test.ts` |
| P1-2 | Point et parcelle conservés, écart signalé (F4), méthode de rattachement cadastral exposée | `cadastre.ts`, `api/georisques-logement/route.ts`, `logement-coverage.ts`, `RegulatorySection.tsx` | `logement-coverage.test.ts` |
| P1-3 | Carte et synthèse Territoire (F8) | `QuartierClimatData.tsx`, `territoire/synthesis-deterministe.ts`, `territoire/synthesis-checks.ts` | `synthesis-deterministe.test.ts`, `fut116-recits-climat-territoire.test.ts` |
| P1-4 | v1 `latlon` : retenir la commune du code BAN | `georisques.ts` | `georisques.test.ts` |
| P1-5 | Règle industrie : PPRT au point, ou F9 | `materiality-rules.ts`, `georisques.ts` | `materiality-rules.test.ts` |
| P1-6 | Lien vers le règlement officiel dans le geste réglementaire (F10, OP-2) | `logement-gestes.ts`, `RegulatorySection.tsx` | `logement-gestes.test.ts` |

### P2 · plus tard

OP-4 (nappe, risque côtier, après évaluation Data Curator), OP-5 (AZI), champ `tri` (AN-11), fixture `fut87` (AN-12), geste cavités, mesure en lecture seule du nombre de dossiers historiques portant la carte inondation communale.

### Hors périmètre, à ne pas réimplémenter ici

FUT-126 (PR #82) traite la séparation « limites » / « à vérifier » dans le dépliable, le vocabulaire des argiles, la vie locale, la taille et le bruit. Les textes proposés ici se rangent dans la structure que FUT-126 installera ; aucun fichier de la PR #82 n'est concerné par les corrections P0, sauf `ControlesReleve.tsx`, qui n'a pas à changer : il rend les faits que le moteur produit.

---

## 12. Décision : avant le lancement V1, et ce qui peut attendre

**À corriger avant V1** : P0-A, P0-B, P0-C (formulation et source), P0-D. Raison : le produit affirme aujourd'hui, sur le sujet qu'un acheteur a lui-même déclaré prioritaire, une absence qui est fausse et une bonne correspondance que la source officielle contredit. C'est le défaut le plus coûteux en confiance qu'un dossier payé puisse porter, et il est reproductible sur des centaines de communes littorales.

**Décisions porteur nécessaires avant de coder** :
1. Le déclencheur de la carte communale (option A recommandée, §6.4).
2. Le palier de matérialité d'une zone inondation au point (proposé : `decision_critical` pour les régimes d'interdiction 03 et 04, `structuring` pour les prescriptions 02).
3. L'application de P0-A aux modules Logement déjà consultés (recommandée).

**Peut attendre** : tout le P1 et le P2. Le P1-3 (carte Territoire) est peu coûteux ; je le recommande dans la même PR que P0-C si la charge le permet.

---

## 13. Risques de fausse précision et de confusion informatif / réglementaire

| Risque | Où il existe aujourd'hui | Garde-fou proposé |
|---|---|---|
| Un compte communal lu comme une probabilité ou une étendue | « exposition élevée » | F1, F7, test interdisant le mot |
| Un rang lu comme une mesure | Déclencheur à 66 | Option A, convention affichée |
| Une commune lue comme une adresse | Carte communale gardée en tête d'un Dossier Adresse | P0-B : l'adresse gouverne |
| Une absence de donnée lue comme une absence de risque | Plans à aléas inconnus | État « aléas inconnus », jamais « aucun plan » |
| Un point lu comme une parcelle, une parcelle voisine lue comme la sienne | Repli cadastral, grain mal dit | P1-2 |
| Une lecture informative prise pour l'état des risques | Aucune mention de portée | F11 |
| Un score interne substitué à une preuve | Le rang n'est pas affiché, mais il décide | Déclencheur factuel |
| Un document réglementaire effacé | Non observé : l'état des risques reste cité | Le conserver comme contrôle officiel, ciblé |

---

## 14. Questions réellement non résolues

1. **Sémantique des statuts du rapport « Mes risques »** (« Risque Existant », « Risque Inconnu », « Risque non Connu »). Aucune documentation officielle trouvée ; deux libellés différents pour l'inconnu coexistent. Tant qu'elle n'est pas établie (BRGM, Data Curator), OP-4 reste fermée. Recommandation conditionnelle : ne lire que « Risque Existant » à l'adresse, et seulement après vérification sur un échantillon dont la zone est connue.
2. **Une parcelle traversée par plusieurs zones renvoie-t-elle toutes ses zones ?** À Châtelaillon, la parcelle rend Os et le point Rs3 : la réponse parcellaire ne contient qu'une zone. Il faudrait une parcelle connue pour être à cheval. En attendant, F4 s'applique dès que point et parcelle divergent.
3. **Combien des 58 dossiers historiques portent la carte communale inondation ou une fausse absence ?** Non mesuré (aucune lecture de la base). Mesurable en lecture seule si le porteur l'autorise.

Aucune autre question ne reste ouverte : les autres points sont tranchés par les preuves jointes ou relèvent des décisions du §12.
