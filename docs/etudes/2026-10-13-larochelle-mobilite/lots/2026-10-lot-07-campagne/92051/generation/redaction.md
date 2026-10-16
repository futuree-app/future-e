## A. Question et format

**Question principale :** à Neuilly-sur-Seine, que regarder pour utiliser moins la voiture lorsque les équipements du quotidien sont proches ?

Les secteurs Plaine des Sablons 6 et Saint-James Madrid 1 présentent des pratiques domicile-travail très différentes, alors que toutes leurs adresses disposent du panier d’équipements étudié à proximité. Pour une recherche de logement, ce rapprochement invite à examiner séparément les déplacements professionnels et les besoins du quotidien.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.920510306.panier_500m`, `iris.920510102.panier_500m`, `mobpro.voiture_selon_destination.meme_commune`, `destination.92012.voiture`.

**Format retenu : article court**, avec l’ouverture carburant imposée et deux visuels.

Pistes écartées : stationnement, statut d’occupation, actifs venant travailler dans la commune et comparaison nationale, qui disperseraient cette question ; possession automobile, moins directement utile ici que le rapprochement entre pratiques et proximité.

## B. Article

# Neuilly-sur-Seine : choisir une adresse pour utiliser moins la voiture

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,61 €/L et celui du SP95-E10 de 0,19 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Neuilly-sur-Seine. Pour une recherche de logement, cette hausse remet les déplacements réguliers parmi les dépenses à examiner.

Le scénario suivant chiffre uniquement le surcoût annuel de carburant. Il retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. La hausse est arrondie à 5 centimes : +0,60 €/L pour le gazole et +0,20 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 70 € | environ 20 € |
| 15 km | environ 220 € | environ 70 € |
| 35 km | environ 500 € | environ 170 € |

Ces distances sont des hypothèses de scénario. Pour choisir une adresse à Neuilly-sur-Seine, la question devient celle des trajets pour lesquels on souhaite moins prendre la voiture.

## Des pratiques différentes selon le secteur et le lieu de travail

Les pratiques du recensement de 2022 donnent un premier repère. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la voiture est le mode principal pour aller travailler de 13 % à Plaine des Sablons 6 et de 50 % à Saint-James Madrid 1. Ces noms désignent des secteurs statistiques de l’INSEE.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer une annonce dans cette diversité de pratiques. Le lieu de travail apporte un autre éclairage : parmi les actifs qui habitent Neuilly-sur-Seine et y travaillent, 16 % vont travailler principalement en voiture ; parmi ceux qui habitent Neuilly-sur-Seine et travaillent à Boulogne-Billancourt, cette part atteint 60 %.

Pour préparer vos visites, partez donc aussi des lieux de travail à rejoindre depuis le logement envisagé.

## Courses, pharmacie et école : examiner les cheminements

Les trajets professionnels ne couvrent qu’une partie du quotidien. Pour un logement où l’on souhaite moins utiliser la voiture, les déplacements vers les équipements méritent leur propre examen.

Dans chacun des secteurs cités, toutes les adresses disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. Cette proximité se retrouve donc dans des secteurs aux pratiques domicile-travail différentes.

Lors d’une visite, parcourez les cheminements vers les équipements qui vous intéressent et repérez leurs entrées. Pour l’école, vérifiez aussi l’établissement dont dépendrait le logement : la proximité mesurée ne désigne pas une affectation.

## Votre projet, votre adresse

Si votre déménagement doit vous permettre d’utiliser moins la voiture, faites de cet objectif un fil conducteur de votre recherche. Avec futur•e, explorez l’adresse envisagée à partir de votre projet de vie, pour l’examiner dans son ensemble.

### Méthode et sources

Sources : INSEE, fichier Mobilités professionnelles et bases infracommunales ; Base adresse nationale et Base permanente des équipements 2025 ; flux officiel prix-carburants.gouv.fr.

Les pratiques sont des estimations par sondage. Les comparaisons portent sur des groupes distincts et ne mesurent pas l’effet d’un déménagement ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les parts par secteur concernent les actifs qui y résident, tous lieux de travail confondus. La proximité des équipements porte sur les adresses, chaque adresse comptant également dans son secteur ; les distances sont mesurées à vol d’oiseau jusqu’à l’adresse des établissements.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,61 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,19 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,20 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 20 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 70 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 170 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `destination.92012.voiture` | oui |
| Pratiques — voiture à Plaine des Sablons | 13 % | `iris.voiture.min` | oui |
| Pratiques — numéro dans le nom du secteur | Plaine des Sablons 6 | `iris.voiture.min` | oui |
| Pratiques — voiture à Saint-James Madrid | 50 % | `iris.voiture.max` | oui |
| Pratiques — numéro dans le nom du secteur | Saint-James Madrid 1 | `iris.voiture.max` | oui |
| Pratiques — actifs résidant et travaillant à Neuilly-sur-Seine | 16 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — actifs résidant à Neuilly-sur-Seine et travaillant à Boulogne-Billancourt | 60 % | `destination.92012.voiture` | oui |
| Équipements — couverture à Plaine des Sablons 6 | toutes les adresses — 100 % | `iris.920510306.panier_500m` | oui |
| Équipements — couverture à Saint-James Madrid 1 | toutes les adresses — 100 % | `iris.920510102.panier_500m` | oui |
| Équipements — seuil de proximité | moins de 500 m à vol d’oiseau | `iris.920510306.panier_500m`, `iris.920510102.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920510306.panier_500m`, `iris.920510102.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. Afficher la période de hausse indiquée dans l’ouverture. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison des secteurs | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. Afficher le millésime 2022. |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Plaine des Sablons 6 et Saint-James Madrid 1. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : le fait concernant les actifs résidant et travaillant à Neuilly-sur-Seine est utilisé. La relecture demandée sur le choix du groupe de communes ne s’applique pas à cette comparaison, qui n’utilise pas ce groupe.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations ; vérification obligatoire avant publication, concernant aussi le scénario.

Aucun autre doute de lecture relevé.