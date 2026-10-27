# FUT-82 · 9. Addendum : les candidates relues aux trois échelles

> Complément demandé le 27/10/2026 avant arbitrage. L'audit initial (fichiers 01 à 08) reste inchangé.
> Cet addendum réutilise ses mesures et n'ajoute que deux sondes courtes, en lecture seule :
> `scripts/research/fut82/addendum-voisinage.mjs` (protections à 1 et 3 km de 100 communes) et
> `scripts/research/fut82/addendum-territoire.mjs` (feux observés face aux paliers du comparateur,
> fibre par commune). Résultats : `mesures/addendum-voisinage.json`, `mesures/addendum-territoire.json`.
> Les divergences entre deux logements d'une même commune sont recalculées sans appel réseau depuis
> `mesures/discrimination-logements.json`.

## En bref

1. **Le biais existe, et il est mesurable.** Les critères de la vague A (fait à l'adresse, effet légal,
   réponse en direct en moins de 100 ms), l'échantillon (200 logements au point exact) et six scénarios
   sur huit partent d'un bien déjà choisi. Trois candidates en sortent sous-évaluées : la **mémoire des
   feux (BDIFF)** pour Territoire, la **fibre par commune (ARCEP)** pour Territoire, les **espaces
   protégés au voisinage** pour Autour.
2. **La recommandation ne change pas, sa justification change.** PEB/PGS et débroussaillement (OLD)
   tiennent quand on retire l'avantage du légal et de la parcelle : ce sont aussi les deux seules
   candidates mesurées qui **distinguent deux quartiers d'une même commune**, et aucune donnée du
   produit ne porte cette information.
3. **BDIFF est la candidate la plus sous-évaluée**, et la mieux placée pour la suite : au comparateur,
   **316 communes** affichées « Risque de feu faible » ont connu un feu de plus de 10 ha depuis 2006,
   dont Brasparts (1 917 ha en 2022). Elle reste derrière OLD pour deux raisons sans lien avec
   l'échelle : la licence, et le rattachement de chaque feu à une seule commune.

## 1. Ce qui, dans l'audit initial, favorisait le Logement

| Élément de méthode | Ce qu'il favorisait | Preuve | Effet sur les verdicts |
|---|---|---|---|
| Critère « fait au grain de l'adresse » pour entrer en vague A | Les zonages lus au point | `07-feuille-de-route.md`, « Pourquoi ces deux-là » | Une donnée communale ne pouvait pas entrer en vague A, quelle que soit sa valeur |
| Critère « effet légal ou financier démontré » | Les obligations liées à une transaction (PEB, OLD) | idem | Les données de cadre de vie (protections, mémoire des feux) partaient avec un handicap |
| Latence mesurée comme critère de coût | Les appels en direct pendant la génération d'un dossier | colonne « Performance » de la matrice | Sans objet pour Territoire, où les données sont précalculées une fois par an |
| Part de logements touchés **au point** | Les candidates rares mais nettes à l'adresse | « Natura 2000 : 0 % » (0/200) | Au voisinage, la mesure donne **19 % à 1 km et 39 % à 3 km** (§3) |
| Échantillon : 200 logements et 45 adresses | Une lecture par bien | `mesures/README.md` | Aucune paire de communes comparées, aucune paire de quartiers |
| Colonne « Question acheteur » | La question d'une transaction | `02-matrice-candidates.md` §2.3 | La question de la personne qui choisit un lieu n'était pas posée |
| Coût de la fibre jugé sur le fichier par immeuble (835 Mo) | Le grain du Logement | `05-scenarios-decision.md` S5 | Le fichier par commune existe : 33 Mo, trimestriel, licence ouverte (§3) |
| Huit scénarios | Six partent d'un bien (acheter, maison, sous-sol, immeuble, terrain, rénovation) | `05-scenarios-decision.md` | Un seul (S8) porte sur le cadre de vie, aucun sur la comparaison de communes |

**Ce qui n'était pas biaisé.** Les écarts justifiés par la doctrine (indice social des collèges,
délinquance), par la qualité de la donnée (piézométrie, rapport Géorisques instable, couverture des
cartes de bruit) ou par l'absence de source nationale (pollution lumineuse) tiennent à toutes les
échelles. Les relire n'a rien changé.

## 2. Matrice de synthèse par échelle

Valeur pour la décision à chaque échelle, au **grain réel** de la source (aucun grain n'a été changé).
**Fort** : peut changer un choix · **Moyen** : éclaire un choix pour certains projets · **Faible** :
utile sans changer le choix · **Nul** : sans objet à cette échelle. Colonne « Biais » : oui quand la
raison du verdict initial ne valait que pour le Logement.

| Candidate | Grain réel | Territoire | Autour | Logement | Biais | Verdict initial → révisé |
|---|---|---|---|---|---|---|
| PEB (bruit aérien) | Zone | Faible : le calme sonore communal intègre les aéroports, avec une source dominante parfois fausse | **Fort** : 2 communes sur 4 concernées ont un logement dedans et un dehors (Marignane, Albi) ; Autour ignore l'aérien | **Fort** | Non | A → **A** (justification élargie à Autour) |
| PGS | Zone | Nul | Moyen | Moyen (aide) | Non | A, avec le PEB → inchangé |
| Cartes de bruit stratégiques | Zone isophone | Nul | Fort en principe (bruit routier par quartier) | Fort en principe | Non : pas d'agrégat national | Veille → inchangé |
| OLD (débroussaillement) | Zone | Faible : redouble le danger de feu | **Moyen à fort** : 8 communes sur 14 concernées ont un logement dedans et un dehors (Fréjus, Nîmes, Digne) ; seul indicateur de lisière forêt-habitat | **Fort** (maison) | Non | A → **A** (justification élargie à Autour) |
| BDIFF (feux observés) | Commune | **Moyen à fort** : 316 communes « Risque de feu faible » ont connu un feu de plus de 10 ha | Nul | Faible | **Oui** : « jamais à l'adresse » jugé contre le Logement | B → **B, en tête, au Territoire** |
| Remontées de nappe | Polygone ~250 m | Nul (CatNat le porte) | Faible : 60 % des logements « sujets », trop fréquent pour départager | Conditionnel (sous-sol) | Non | B conditionnelle → inchangé |
| Piézométrie | Station | Nul | Nul | Nul | Non | Écartée → inchangé |
| Rapport Géorisques au point | Adresse | Nul | Nul | Référence | Non | Écarté comme source → inchangé |
| IREP 2024 détaillé | Établissement | Faible : l'exposition industrielle est déjà au comparateur | Faible | Faible | Non : rejets déclarés ≠ air respiré, à toute échelle | Veille → inchangé |
| Extrait IREP ADEME 2019 | Établissement | Dette | Dette | Dette | Non | Dette → inchangé |
| Protections fortes (Natura 2000, parcs nationaux, réserves) | Périmètre | Faible (non mesuré à la commune) | **Moyen, valeur hypothétique** : 19 % des communes tirées ont un site à 1 km, peu lié au score « nature » | Faible (0/200 au point) | **Oui** : mesuré au point seulement | B → **B, recadrée sur Autour** |
| PNR | Commune | Moyen (identité, 8 %) | Nul | Nul | Non | B (signature) → inchangé |
| ZNIEFF | Zone | Faible | Faible : fréquente (19/45 points à ~700 m) et confondue avec une protection | Nul | En partie : « sans effet juridique » est un motif de Logement | Écartée → **Veille** |
| Réseaux de chaleur (FCU) | Point | Faible | Faible : un réseau ne fait pas choisir un quartier | Moyen (rénovation) | Non | B → inchangé |
| Lignes HTB | Ligne | Nul | Faible : fait de paysage, 4 communes sur 5 concernées divergent entre deux logements | Faible | Non | Veille → inchangé |
| Servitude I4 | Emprise | Nul | Nul | Terrain | Non | Veille → inchangé |
| Antennes, mesures d'ondes (ANFR) | Point | Nul | Nul | Nul | Non | Écartées → inchangé |
| PVGIS | Point | Faible (le rayonnement communal suffit) | Nul | Projet solaire | Non | C → inchangé |
| Potentiel solaire du bâti | Bâtiment | Nul | Nul | Projet solaire | Non | C → inchangé |
| Fibre (ARCEP) | Immeuble **et commune** | **Moyen pour un projet télétravail** : 1 883 communes sous 80 % de locaux raccordables, concentrées dans le Massif central et les DROM | Faible | Moyen (coûteux à l'immeuble) | **Oui** : coût jugé sur le fichier par immeuble | C → **B conditionnelle, au Territoire** |
| Couverture mobile | Maille | Faible à moyen, non mesuré | Faible | Faible | Possible | Veille → inchangé (à mesurer si la fibre avance) |
| Bornes de recharge (IRVE) | Point | Faible | Faible | Nul | Non | Écartée → inchangé |
| Prix de l'eau (SISPEA) | Service | Faible (budget) | Nul | Nul | Non | Veille → inchangé |
| AZI / EAIP | Enveloppe | Redondant | Redondant | Redondant | Non | Écartées → inchangé |
| Annuaire de l'éducation | Établissement | Faible (la BPE suffit) | Faible | Nul | Non | Veille → inchangé |
| IPS, IVAL, IVAC | Établissement | Doctrine | Doctrine | Nul | Non | Écartés → inchangé |
| Délinquance (SSMSI) | Commune | Doctrine ; 48 % de valeurs non diffusées | Nul | Nul | Non | Écartée → inchangé |
| Fiscalité locale (taux) | Commune | Moyen en principe : le taux se compare d'une commune à l'autre ; le montant dépend de la base du bien | Nul | Faible | **Oui** : « non attribuable au bien » est un motif de Logement | Écartée → **Veille**, non mesurée |
| LCZ | Îlot | Nul | Moyen là où l'îlot de chaleur manque, couverture proche | Faible | Non | Veille → inchangé |
| Pollution lumineuse | Raster | Nul | Nul | Nul | Non | Écartée → inchangé |
| ARIA | Établissement | Faible | Faible | Faible | Non | Veille → inchangé |

## 3. Les candidates sous-évaluées, mesure à l'appui

### BDIFF : le comparateur affiche « Risque de feu faible » là où des feux ont eu lieu

Le palier « feu » du comparateur repose sur un seul indicateur : le nombre de jours de danger
météorologique projeté en 2050 (DRIAS, +2 °C). Il ne connaît ni la végétation, ni les feux passés.
Croisé avec les feux de forêt recensés de 2006 à 2025 :

| Palier affiché | Communes | Avec un feu > 1 ha | Avec un feu > 10 ha | Habitants de ces dernières | Avec un feu ≥ 100 ha |
|---|---|---|---|---|---|
| Risque de feu faible | 13 132 | 1 198 | **316** | 597 076 | 48 |
| Risque modéré | 11 268 | 1 371 | 279 | 445 910 | 33 |
| Risque élevé | 10 388 | 2 658 | 817 | 3 516 655 | 165 |

Les cinq plus grands feux en palier « faible » : Brasparts (Finistère, 1 917 ha, 2022), Vescles (Jura,
700 ha), L'Hospitalet-près-l'Andorre (Ariège, 520 ha), Urrugne (Pyrénées-Atlantiques, 450 ha),
Albertacce (Haute-Corse, 428 ha). Les 48 se concentrent dans les Pyrénées (22), les Alpes-Maritimes
(6) et les Landes (5).

**Ce que la donnée ajoute.** Une mémoire observée, au même grain que le comparateur, qui nuance un
palier déjà affiché au public. Aucune autre source du produit ne la porte, et le seul champ voisin
(`nombre_dincendies` dans AskFuture) n'a pas de provenance.

**Ses limites, vérifiées dans les exports.**
- **Un feu, une commune.** Chaque ligne porte un seul code INSEE. Le feu de 2021 (6 832 ha) est
  entièrement compté à Gonfaron ; La Garde-Freinet, voisine, n'a pour plus grand feu recensé que 3 ha.
  Que ce feu ait traversé La Garde-Freinet est une information de presse, non vérifiée ici. Conséquence :
  la base permet de dire « un feu de X ha a été recensé dans la commune », jamais « aucun grand feu ici ».
- **Feux de montagne.** Les grands feux des Pyrénées en palier « faible » peuvent être des écobuages
  échappés, sur des estives loin des maisons. La cause n'est renseignée que pour 51 % des feux. À
  contrôler avant d'écrire une phrase.
- **Licence** : contradiction non levée (décision D5).

### Fibre par commune : le fichier existe, et il distingue les communes rurales

L'ARCEP publie chaque trimestre un fichier par commune (T2 2026, 33 Mo, Licence Ouverte) : locaux
raccordables à la fibre sur locaux totaux.

| Part des locaux raccordables | Communes | Part de la population |
|---|---|---|
| 95 % et plus | 27 907 | 78,0 % |
| 80 à 95 % | 5 128 | 19,2 % |
| 50 à 80 % | 1 054 | 1,7 % |
| Moins de 50 % | 829 | 1,2 % |

Rare à l'échelle nationale (2,9 % des habitants sous 80 %), concentré là où un projet de télétravail à
la campagne va chercher : 59 % des communes du Cantal et du Puy-de-Dôme, 56 % de l'Allier et de la
Haute-Loire. Exemple : Chabreloche, Gelles (0 %) et Job (3 %), dans le Puy-de-Dôme, ont un score
« nature » de 92 à 95 et des prix bas ; un comparateur qui cherche « nature, petits prix, télétravail »
les remonte sans savoir que la fibre n'y est pas encore déployée.

**Limites.** Un taux communal ne dit rien d'une maison (les hameaux sont raccordés en dernier) ; 0 % de
fibre ne veut pas dire sans internet (cuivre, 4G fixe, satellite).

### Espaces protégés : rares au logement, fréquents au voisinage

Sur les 100 communes déjà tirées, depuis leur point de référence dans l'index du comparateur :

| Rayon | Natura 2000 | Protection forte (Natura 2000, parc national, réserve nationale) |
|---|---|---|
| Au point | 0 % | 1 % |
| 1 km | 19 % | 20 % |
| 3 km | 39 % | 41 % |

La présence d'un site à 1 km est peu liée au score « nature » déjà calculé (5 communes sur 45 au tiers
bas, 9 sur 31 au tiers moyen, 4 sur 16 au tiers haut). L'information est donc nouvelle. Sa valeur pour
la décision reste **hypothétique** : un site Natura 2000 peut être un marais privé, un camp militaire ou
une zone agricole. La règle adoptée pour les espaces verts (FUT-73 : on retient l'usage, pas la
présence) s'applique ici aussi.

## 4. Deux parcours mal représentés, testés

### Parcours 1 : comparer des communes avant de chercher un bien

| Question de la personne | Ce que futur•e sait déjà | Manque | Source qui peut changer la décision |
|---|---|---|---|
| Le climat sera-t-il vivable ? | Chaleur, sécheresse, pluies extrêmes, danger de feu projeté (2050) | Rien d'important | — |
| Quels risques pour un bien ici ? | Inondation (CatNat, rang national), danger de feu projeté, industrie, radon | Les feux réellement survenus | **BDIFF** |
| Puis-je y travailler à distance ? | Bassin d'emploi, transports, gares | La fibre | **ARCEP par commune**, pour ce profil |
| Pourrai-je me l'offrir ? | Niveau de prix relatif à l'achat et à la location | Taxe foncière | Fiscalité : faible tant que la base du bien manque |
| Y a-t-il de la nature, du calme ? | Score nature (OSO), calme sonore, densité | Identité du lieu (parc) | PNR : identité, rarement un critère de choix |
| Écoles, soins, services, vie locale ? | Accès BPE, médecins, centralité, vie associative | Rien d'important | — |

**Cas éprouvé (Finistère intérieur).** Projet : nature, petits prix, peu de risque de feu, télétravail.
Brasparts, Pleyben et Landerneau sont toutes trois en « Risque de feu faible ». Brasparts a le meilleur
score nature (58) et les prix les plus bas : elle sort en tête. BDIFF y recense **1 917 ha brûlés en
2022** (feu des monts d'Arrée), Pleyben et Landerneau aucun feu de plus d'1 ha. La fibre (97, 95 et
92 %) ne départage pas ; le PNR d'Armorique (Brasparts, Pleyben) ajoute une identité sans changer
l'ordre. **Une seule source change la lecture : BDIFF.**

**Cas éprouvé (Puy-de-Dôme).** Même projet. Chabreloche (nature 92, prix bas) contre Murat (Cantal,
nature 98, prix bas, fibre 96 %) : la fibre change la lecture pour un télétravailleur, BDIFF non (il ne recense
aucun feu dans l'une ni dans l'autre).

### Parcours 2 : hésiter entre plusieurs quartiers, sans bien choisi

| Question de la personne | Ce que futur•e sait déjà (Autour) | Manque | Source qui peut changer la décision |
|---|---|---|---|
| Sera-t-il bruyant ? | Autoroutes, grandes routes, voies ferrées à distance | **Le bruit aérien** | **PEB/PGS** |
| Y a-t-il de la nature à pied ? | Espaces verts utilisables (OSM) | Les sites naturels majeurs | Protections au voisinage, valeur hypothétique |
| Commerces, écoles, médecins ? | BPE à pied, avec noms et distances | Rien d'important | — |
| Fera-t-il trop chaud l'été ? | Îlot de chaleur (596 communes) | Ailleurs | LCZ : couverture proche de l'îlot de chaleur |
| Ce quartier est-il exposé au feu ? | Danger projeté **de la commune** | **La lisière forêt-habitat** | **OLD** |
| Inondation ? | Lecture à l'adresse (PPRN, ONRN) | Rien d'important | — |

**Cas éprouvés, sur les mesures existantes** (deux logements tirés par commune) :
- **Bruit aérien** : à Marignane, un logement est hors PEB et l'autre en zone C de
  l'aéroport Marseille-Provence ; à Albi, l'un hors zone, l'autre en zone D. Dans les deux communes, le
  calme sonore est le même pour les deux adresses.
- **Lisière** : à Fréjus, Digne-les-Bains, Nîmes, Les Pennes-Mirabeau, Villenave-d'Ornon et
  Saint-Denis-d'Oléron, un logement est en zone de débroussaillement et l'autre non. Le danger de feu
  projeté est le même pour les deux adresses. À Gonfaron, la commune a brûlé, le bourg est hors zone.
- **Nappes, réseau de chaleur** : divergent souvent (39 et 13 communes sur 100) sans faire choisir un
  quartier.

## 5. PEB et OLD face aux candidates sous-évaluées, sans avantage automatique

Grille demandée, sans compter l'effet légal, la précision parcellaire ni la simplicité technique.

| Critère | PEB/PGS | OLD | BDIFF | Fibre par commune | Protections au voisinage |
|---|---|---|---|---|---|
| Valeur pour la décision | Forte à deux échelles (Autour, Logement) | Forte au Logement (maison), moyenne à forte à Autour | Moyenne à forte au Territoire, sur des communes ciblées | Moyenne, pour un seul profil (télétravail rural) | Hypothétique |
| Complémentarité avec l'existant | **Totale** : aucune donnée sur l'aérien à l'adresse ; le calme communal se trompe de source à Villeneuve-le-Roi et Goussainville | **Forte** : seul indicateur de lisière ; le danger projeté est communal et météorologique | **Forte** : corrige un palier affiché ; remplace un champ sans provenance | Totale (absente) | Moyenne : recoupe en partie nature et espaces verts |
| Fiabilité | Bonne (zonage net) ; bords proches, d'où l'état « en limite » | Moyenne : zonage informatif, données sources parfois de 2008 | Moyenne : un feu rattaché à une seule commune, causes à 51 %, définitions changées en 2023 | Bonne au grain communal ; rien sur une maison | Bonne sur le statut ; nulle sur l'usage |
| Maintenance | Faible (couche nationale DGAC) | Faible (base IGN), 45 départements | Moyenne : import annuel, table Paris-Lyon-Marseille, certificat TLS | Faible : un fichier par trimestre | Faible |
| Intérêt pour le projet | Calme, sommeil, télétravail, extension | Maison avec jardin, vie en lisière | Priorité « peu de risque de feu », déjà proposée au comparateur | Télétravail | Vie au contact de la nature |
| Blocage | Licence DGAC à confirmer | Fusion de FUT-81 (parcelle) | **Licence contradictoire** (usage commercial exclu à l'export) | Aucun | Doctrine d'usage à écrire |

**Lecture.**
- **PEB/PGS reste premier.** Sans l'effet légal, il garde la meilleure complémentarité de toutes les
  candidates, une valeur aux deux échelles proches et un coût de maintenance faible.
- **OLD contre BDIFF.** Sans le légal, OLD reste le seul indicateur de lisière forêt-habitat au grain du
  quartier, et il distingue des quartiers dans 8 des 14 communes concernées. BDIFF apporte une valeur
  comparable, mais au Territoire ; il ne peut pas entrer aujourd'hui (licence) et ne peut rien dire
  d'une absence (un feu, une commune). À valeur proche, le blocage tranche.
- **Un argument en faveur d'OLD perd du poids** : depuis 2025, le vendeur doit annoncer l'obligation
  dès l'annonce. Pour un bien précis, l'information arrivera donc souvent sans futur•e. Sa valeur propre
  se déplace vers Autour, avant toute annonce.
- **Fibre et protections** restent derrière : la fibre sert un profil étroit, et la valeur des
  protections n'est pas démontrée.

## 6. Recommandation finale : deux intégrations

1. **Bruit aérien réglementaire (PEB et PGS)**, lu à l'adresse et restitué **dans Logement et dans
   Autour**. C'est une révision de D4 : l'audit initial proposait le Logement avec un simple renvoi.
2. **Obligation de débroussaillement (OLD)**, lue à l'adresse et restituée **dans Logement et dans
   Autour**, sous le nom de ce qu'elle montre au quartier : la lisière forêt-habitat.

Les deux après la fusion de FUT-81, comme prévu (3 à 4 jours ensemble, inchangé).

**En tête de la vague suivante : BDIFF au Territoire**, sous deux conditions :
- une licence écrite du producteur (D5) ;
- une restitution en positif seulement. Par exemple : « 1 917 ha brûlés en 2022 dans la commune », à
  côté du palier projeté, sans le modifier.

**Si vous ne voulez qu'une seule intégration**, PEB/PGS.

**Si la licence BDIFF est levée avant le début du chantier OLD**, l'échange OLD contre BDIFF se discute.
BDIFF sert davantage de personnes, plus tôt dans leur parcours. OLD reste plus sûr.

## 7. Démontré ou hypothétique

| Affirmation | Statut | Fondement |
|---|---|---|
| L'audit initial mesurait les protections au point seulement | Démontré | Script et mesure (0/200 au point) |
| Natura 2000 à 1 km de 19 % des communes tirées, 39 % à 3 km | Démontré | `addendum-voisinage.json`, 100 communes, point de référence communal |
| PEB et OLD distinguent deux logements d'une même commune | Démontré | 2 communes sur 4 (PEB), 8 sur 14 (OLD), deux logements par commune |
| 316 communes en « Risque de feu faible » ont connu un feu de plus de 10 ha | Démontré | BDIFF 2006-2025 croisé avec l'index du comparateur |
| BDIFF rattache chaque feu à une seule commune | Démontré | Lignes de l'export 2021 (Gonfaron) |
| Le feu de 2021 a traversé La Garde-Freinet | Hypothèse | Presse, non vérifié |
| Les grands feux pyrénéens en palier « faible » sont des écobuages | Hypothèse | Cause renseignée à 51 % |
| 1 883 communes sous 80 % de locaux raccordables à la fibre | Démontré | Fichier communal ARCEP T2 2026 |
| La fibre communale change un choix de télétravailleur | Hypothèse | Cas Chabreloche plausible, aucun usage observé |
| Un site protégé proche compte pour le choix d'un quartier | Hypothèse | Statut ≠ usage |
| La taxe foncière départage des communes | Hypothèse | Non mesuré |
| Le vendeur annonce l'OLD dans l'annonce | Hypothèse | Obligation légale depuis 2025, respect non mesuré |
| La valeur au Territoire de BDIFF dépasse celle d'OLD au Logement | Hypothèse | Ordres de grandeur comparables, aucun test auprès de lecteurs |

## 8. Ajouts au journal d'arbitrage

| # | Décision | Recommandation |
|---|---|---|
| D4 (révisée) | Place du PEB | Logement **et** Autour ; idem pour OLD |
| D11 | Rôle de BDIFF | Territoire, en tête de la vague suivante, en positif seulement ; conditionné à D5 |
| D12 | Fibre par commune | Vague suivante, conditionnelle à un projet télétravail ; pas d'import par immeuble |
| D13 | Libellé du palier « feu » du comparateur | Son aide dit « l'exposition du secteur au risque d'incendie » pour un indicateur météorologique projeté. Observation seulement, sans correction proposée ici : à relire si BDIFF entre |

## Rejouer

```bash
# Protections au voisinage (≈ 3 min, 1 500 appels WFS bornés)
node scripts/research/fut82/addendum-voisinage.mjs

# Feux face aux paliers du comparateur, fibre par commune (sans appel BDIFF ; fichier ARCEP 33 Mo hors dépôt)
node scripts/research/fut82/addendum-territoire.mjs --bdiff <tmp>/bdiff-communes-complet.json [--tmp <dossier>]
```
