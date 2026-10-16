## A. Question et format

**Question principale :** à Maisons-Alfort, des équipements proches suffisent-ils à repérer un secteur où la voiture est peu utilisée pour travailler ?

Les secteurs Centre Vert de Maison 2 et Planètes 3 associent une forte proximité des équipements à des pratiques domicile-travail contrastées. Pour une recherche de logement, cela invite à examiner les déplacements professionnels et les besoins autour de l’adresse, sans déduire les uns des autres. Les pratiques selon la destination de travail complètent cette lecture.

**Appuis :** `iris.940460102.voiture`, `iris.940460403.voiture`, `iris.940460102.panier_500m`, `iris.940460403.panier_500m`, `destination.94028.voiture`, `destination.75112.voiture`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et `scenario.carburant.*`.

**Format retenu :** article court, avec le tableau carburant et une carte.

**Pistes écartées :** stationnement, possession automobile, actifs venant travailler dans la commune et comparaison nationale : elles disperseraient cette question centrée sur le choix d’une adresse.

## B. Article

# Maisons-Alfort : des équipements proches, des usages de la voiture contrastés

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,64 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Maisons-Alfort. Pour le SP95-E10, la hausse atteint 0,37 €/L. Lorsqu’on cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite conserver en voiture.

Le scénario suivant illustre le surcoût annuel de carburant selon la distance. Il repose sur une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an, avec les hausses arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario illustratif de surcoût de carburant, sans attribution à un secteur ni à une destination de travail.*

À Maisons-Alfort, où regarder pour faire moins de place à la voiture ? Les pratiques professionnelles et la proximité des équipements apportent des éclairages différents sur une adresse.

## Pour le travail, regarder le secteur et la destination

D’après le recensement 2022, parmi les actifs qui résident dans le secteur Centre Vert de Maison 2, 16 % déclarent la voiture comme mode principal pour aller travailler. Cette part atteint 45 % parmi les actifs qui résident dans Planètes 3. Ces observations portent sur les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur — recensement 2022.*

La destination professionnelle apporte un autre éclairage pour examiner un logement. Parmi les actifs résidant à Maisons-Alfort qui travaillent à Créteil, 41 % utilisent principalement la voiture ; parmi ceux qui travaillent à Paris 12e Arrondissement, cette part est de 18 %.

Pour votre recherche, partez de votre propre lieu de travail et de vos horaires : examinez le déplacement que vous auriez à faire depuis le logement envisagé.

## Pour les courses et l’école, revenir à l’adresse

Le trajet professionnel ne couvre qu’une partie des déplacements d’une semaine. La présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau apporte un repère pour les besoins autour du logement.

Dans Centre Vert de Maison 2, toutes les adresses réunissent ce panier d’équipements. Dans Planètes 3, c’est le cas de 99 % des adresses. Cette proximité coexiste donc avec des pratiques professionnelles très différentes.

Pendant une visite, repérez les cheminements depuis l’entrée du logement vers les équipements qui vous intéressent. Le rayon à vol d’oiseau aide à sélectionner une adresse ; le parcours sur place permet d’examiner les passages à emprunter.

## Votre projet, votre adresse

Si votre déménagement vise à utiliser moins la voiture, partez des déplacements qui structurent votre semaine. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de ce qui compte pour votre prochain lieu de vie.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement INSEE 2022 : fichier Mobilités professionnelles et bases infracommunales. Ce sont des estimations par sondage. Les parts par secteur concernent les actifs qui y résident ; les parts par destination concernent les actifs de toute la commune. Ces lectures ne sont pas croisées et ne mesurent pas l’effet d’un déménagement. Les noms de secteurs sont les libellés statistiques IRIS de l’INSEE.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements 2025 de l’INSEE. Chaque adresse du secteur compte de la même façon. Les distances sont à vol d’oiseau, à partir de la localisation des établissements ; elles ne décrivent ni les parcours réels ni l’usage des équipements.

Les prix proviennent du flux officiel prix-carburants.gouv.fr : médianes entre stations du dernier prix déclaré dans chaque semaine. Les stations prises en compte peuvent varier entre les semaines.

## C. Correspondance interne — non publiée

Les chiffres intégrés aux noms de secteurs et au nom du carburant sont également recensés.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,64 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Chapeau — nom du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Chapeau — hausse de l’essence | 0,37 €/L | `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèses — base de consommation | 100 km | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Tableau — hausse retenue du gazole | +0,65 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — nom du carburant | SP95-E10 | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — hausse retenue de l’essence | +0,35 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau — essence, première ligne | environ 40 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 230 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau — essence, deuxième ligne | environ 130 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 550 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau — essence, troisième ligne | environ 290 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.940460102.voiture`, `iris.940460403.voiture` | oui |
| Pratiques — nom du secteur | Centre Vert de Maison 2 | `iris.940460102.voiture` | oui |
| Pratiques — part de la voiture | 16 % | `iris.940460102.voiture` | oui |
| Pratiques — part de la voiture | 45 % | `iris.940460403.voiture` | oui |
| Pratiques — nom du secteur | Planètes 3 | `iris.940460403.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` et tableau des secteurs | oui |
| Destination — Créteil | 41 % | `destination.94028.voiture` | oui |
| Destination — nom de la commune de travail | Paris 12e Arrondissement | `destination.75112.voiture` | oui |
| Destination — part de la voiture | 18 % | `destination.75112.voiture` | oui |
| Équipements — rayon du panier | 500 m | `iris.940460102.panier_500m`, `iris.940460403.panier_500m` | oui |
| Équipements — nom du secteur | Centre Vert de Maison 2 | `iris.940460102.panier_500m` | oui |
| Équipements — toutes les adresses | 100 %, écrit « toutes les adresses » | `iris.940460102.panier_500m` | oui |
| Équipements — nom du secteur | Planètes 3 | `iris.940460403.panier_500m` | oui |
| Équipements — part des adresses | 99 % | `iris.940460403.panier_500m` | oui |
| Méthode — millésime des pratiques | 2022 | `iris.940460102.voiture`, `iris.940460403.voiture`, `destination.94028.voiture`, `destination.75112.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.940460102.panier_500m`, `iris.940460403.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture des secteurs cités | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Pose manuelle des libellés seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne aussi le scénario.
- **`iris.ecart_voiture` :** relire les libellés Centre Vert de Maison 2 et Planètes 3. Ils sont présentés ici comme des secteurs statistiques, sans assimilation à des quartiers d’usage.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
