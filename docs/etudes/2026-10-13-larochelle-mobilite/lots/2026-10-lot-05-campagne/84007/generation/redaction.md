## A. Question et format

**Question principale :** que regarder au-delà du lieu de travail pour chercher un logement à Avignon en espérant moins utiliser la voiture ?

Les pratiques domicile-travail diffèrent fortement entre La Balance-Palais des Papes et Monclar Sud, alors que la proximité du panier d’équipements retenu concerne la même proportion d’adresses. Ce rapprochement aide à sélectionner des secteurs à examiner, puis à vérifier les déplacements propres au logement envisagé.

**Appuis :** `mobpro.travaille_dans_commune`, `destination.84007.voiture`, `iris.840070110.voiture`, `iris.840070130.voiture`, `iris.840070110.panier_500m`, `iris.840070130.panier_500m`.

**Format :** article court, centré sur ce contraste. Le scénario carburant ouvre l’article conformément au format de la série.

**Pistes écartées :** comparaison nationale peu distinctive ; stationnement, motorisation et flux entrants non nécessaires à la question ; offre de bus non utilisable.

## B. Article

# À Avignon, quelle adresse chercher pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,77 €/L et celui du SP95-E10 de 0,51 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Avignon. Pour un projet de déménagement, cette hausse donne une raison concrète d’examiner les déplacements associés au futur logement.

Le scénario suivant porte sur le **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses retenues, arrondies à 5 centimes, sont de +0,75 €/L pour le gazole et de +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

Ces distances sont des hypothèses, sans attribution à un secteur d’Avignon. Pour orienter une recherche de logement, regardons maintenant les pratiques locales.

## Travailler à Avignon ne désigne pas une adresse

Les pratiques domicile-travail décrites ici sont celles du recensement de **2022**. Parmi les actifs occupés résidant à Avignon, 69 % travaillent dans la commune. Parmi ceux qui y habitent et y travaillent, 57 % déclarent la voiture comme mode principal.

La commune de travail donne donc un repère, à compléter par l’examen du secteur de résidence. Parmi les actifs occupés qui habitent La Balance-Palais des Papes, 30 % vont travailler principalement en voiture, contre 82 % à Monclar Sud, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Au moment de trier les annonces, situez les logements sur cette carte : elle permet de repérer des pratiques différentes au sein d’Avignon. Le trajet jusqu’à votre lieu de travail précis reste ensuite à examiner.

## Et pour les courses, l’école ou la pharmacie ?

Réduire la voiture dans son quotidien concerne aussi les déplacements en dehors du travail. Sur ce point, les secteurs précédents apportent un éclairage différent : dans chacun, **91 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**.

Une même proportion d’adresses proches de ce panier d’équipements accompagne ainsi des pratiques domicile-travail très différentes. Pour votre recherche, gardez les deux questions : comment rejoindre le travail depuis ce logement, et quels équipements proches répondent à vos besoins ?

Lors d’une visite, repérez ceux que vous utiliseriez et examinez le chemin réel pour les rejoindre. Pour une école, vérifiez aussi l’affectation de l’adresse envisagée.

## Votre projet, votre adresse

Si vous déménagez pour donner moins de place à la voiture dans votre quotidien, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et examinez ce qui peut peser dans votre choix.

## Méthode et sources

Les pratiques proviennent du recensement de l’INSEE : fichier Mobilités professionnelles et bases infracommunales. Les résultats par secteur concernent les actifs occupés qui y résident, toutes communes de travail confondues ; ils ne sont pas croisés avec leur destination. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels. Ces résultats sont des estimations par sondage.

La proximité des équipements associe la Base adresse nationale à la Base permanente des équipements **2025** de l’INSEE. Chaque adresse compte pareil au sein du secteur ; la proximité ne décrit ni le parcours réel ni l’usage des équipements.

Les prix viennent de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré dans chaque semaine. Le scénario porte uniquement sur le carburant.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | Semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | Semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,77 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,51 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune`, `destination.84007.voiture`, `iris.840070110.voiture`, `iris.840070130.voiture` | oui |
| Pratiques — travail dans la commune | 69 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Avignon | 57 % | `destination.84007.voiture` | oui |
| Pratiques — La Balance-Palais des Papes | 30 % | `iris.840070110.voiture` | oui |
| Pratiques — Monclar Sud | 82 % | `iris.840070130.voiture` | oui |
| Équipements — proportion dans chacun des secteurs | 91 % | `iris.840070110.panier_500m`, `iris.840070130.panier_500m` | oui |
| Équipements — seuil à vol d’oiseau | 500 m | `iris.840070110.panier_500m`, `iris.840070130.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.840070110.panier_500m`, `iris.840070130.panier_500m` — source BPE, sections 2 et 3 | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Après les hypothèses, au début de l’article | Aucune. Conserver les hypothèses et la période de comparaison à proximité du tableau. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre La Balance-Palais des Papes et Monclar Sud | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés manuels seulement pour une version soignée. Faire figurer le millésime 2022 sur la carte. |

**Vérifications avant publication :**

- **Carburant :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne l’ouverture et le scénario.
- **Secteurs :** relire les libellés La Balance-Palais des Papes et Monclar Sud. Le texte les présente comme des secteurs statistiques.

Aucun autre doute de lecture relevé.