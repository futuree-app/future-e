## A. Question et format

**Question principale :** à Aubervilliers, la proximité des équipements suffit-elle à choisir un secteur où utiliser moins la voiture ?

Maladrerie et Péri présentent des pratiques domicile-travail très différentes, alors que toutes leurs adresses disposent du panier d’équipements à proximité. Pour une recherche de logement, ce contraste invite à examiner les déplacements associés à l’adresse, sans déduire les pratiques de la seule présence de services.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.930010304.panier_500m`, `iris.930010201.panier_500m`, `mobpro.modes.tc`, `mobpro.modes.voiture`. L’ouverture s’appuie sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les scénarios `scenario.carburant.*`.

**Format retenu :** article court, avec le tableau du scénario carburant et la carte des pratiques par secteur.

**Pistes écartées :** les destinations professionnelles, la possession automobile, le stationnement et la comparaison entre communes apporteraient des développements secondaires à cette question.

## B. Article

# Aubervilliers : des services proches, des usages de la voiture différents

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,62 €/L autour d’Aubervilliers, et celui du SP95-E10 de 0,35 €/L. Pour qui cherche un logement en souhaitant moins conduire, quels repères regarder au-delà de la présence de services ?

## Le surcoût selon la distance

Ces prix concernent les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Aubervilliers. Le scénario ci-dessous porte sur le carburant seul : consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et hausse médiane arrondie à 5 centimes, soit +0,60 €/L pour le gazole et +0,35 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel, gazole | Surcoût annuel, SP95-E10 |
|---|---:|---:|
| 5 km | environ 70 € | environ 40 € |
| 15 km | environ 220 € | environ 130 € |
| 35 km | environ 500 € | environ 290 € |

Ce scénario donne une raison d’intégrer les déplacements à sa recherche de logement. À Aubervilliers, les pratiques observées invitent aussi à regarder le secteur de résidence.

## Maladrerie et Péri, des pratiques différentes

Dans les données du recensement de 2022, 61 % des actifs résidant à Aubervilliers déclarent les transports en commun comme mode principal pour aller travailler, contre 22 % pour la voiture.

La part de la voiture varie selon les secteurs : elle atteint 10 % parmi les actifs résidant à Maladrerie et 42 % parmi ceux de Péri. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Pour une annonce dans l’un de ces secteurs, le chiffre communal ne suffit donc pas à situer les pratiques locales. Le trajet vers votre propre lieu de travail, avec vos horaires, reste à examiner depuis le logement envisagé.

## Et pour les courses, l’école ou la pharmacie ?

Le travail ne couvre qu’une partie des déplacements associés au logement. Pour les autres besoins, Maladrerie et Péri présentent un point commun : dans chacun de ces secteurs, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

Ce panier de proximité accompagne donc des pratiques domicile-travail très différentes. Sa présence ne suffit pas à départager les logements pour votre projet de moins conduire. Lors d’une visite, parcourez depuis l’entrée du logement les chemins vers les équipements dont vous auriez besoin : vous pourrez examiner les passages et les traversées que la distance à vol d’oiseau ne décrit pas.

## Votre projet, votre adresse

Si votre déménagement vise à réduire la place de la voiture, partez des trajets que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, en la regardant dans son ensemble.

### Méthode et sources

Les pratiques proviennent du recensement de l’INSEE. Les parts domicile-travail portent sur les actifs occupés de 15 ans ou plus, y compris ceux qui travaillent à domicile. Les résultats par secteur sont des estimations par sondage ; les secteurs comparés regroupent des personnes distinctes et leurs écarts ne mesurent pas l’effet d’un déménagement. Les noms cités sont ceux des secteurs statistiques IRIS.

Les proximités sont établies à partir de la Base adresse nationale et de la Base permanente des équipements de l’INSEE, millésime 2025. Elles portent sur les adresses de chaque secteur et ne décrivent ni les parcours réels ni les équipements fréquentés. Les prix du carburant proviennent des déclarations de stations publiées par prix-carburants.gouv.fr.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario figurent en section 7 du dossier, sans identifiant propre ; elles sont rattachées ci-dessous aux scénarios auxquels elles s’appliquent.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,62 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,35 €/L | `carburant.e10.ecart` | oui |
| Périmètre des prix | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes | oui |
| Hypothèses — hausse retenue, gazole | +0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,35 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 40 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 130 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 290 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.tc`, `mobpro.modes.voiture` | oui |
| Pratiques — transports en commun | 61 % | `mobpro.modes.tc` | oui |
| Pratiques — voiture, commune | 22 % | `mobpro.modes.voiture` | oui |
| Pratiques — voiture, Maladrerie | 10 % | `iris.voiture.min` | oui |
| Pratiques — voiture, Péri | 42 % | `iris.voiture.max` | oui |
| Équipements — Maladrerie | toutes les adresses, soit 100 % | `iris.930010304.panier_500m` | oui |
| Équipements — Péri | toutes les adresses, soit 100 % | `iris.930010201.panier_500m` | oui |
| Équipements — seuil de proximité commun | moins de 500 m à vol d’oiseau | `iris.930010304.panier_500m`, `iris.930010201.panier_500m` | oui |
| Méthode — population des actifs | 15 ans ou plus | `mobpro.modes.tc`, `mobpro.modes.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `acces.93001.panier_quotidien_500m` — source BPE | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison Maladrerie–Péri | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture` :** relire les libellés Maladrerie et Péri. Le texte les désigne comme des secteurs statistiques, sans les assimiler aux quartiers d’usage.
- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne également le scénario de surcoût ; elle est obligatoire avant publication.

Aucun autre doute de lecture relevé.