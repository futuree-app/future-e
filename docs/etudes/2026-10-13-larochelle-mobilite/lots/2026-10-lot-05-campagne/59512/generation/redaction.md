## A. Question et format

**Question principale :** comment choisir un secteur à Roubaix pour utiliser moins la voiture, lorsque la proximité des équipements quotidiens s’accompagne de pratiques domicile-travail très différentes ?

Épeule Sud et Linné-Chemin Neuf offrent un rapprochement utile : toutes leurs adresses disposent du panier d’équipements à proximité, mais les parts de la voiture diffèrent nettement. Pour une recherche de logement, cela invite à examiner ensemble l’environnement de l’adresse et le trajet professionnel.

Faits principaux : `iris.595120503.voiture`, `iris.595120503.panier_500m`, `iris.595121201.voiture`, `iris.595121201.panier_500m`, `destination.59350.voiture`, `destination.59009.voiture`. Le contexte communal repose sur `mobpro.modes.voiture`.

**Format retenu : article court.** Stationnement, motorisation, flux entrants et comparaison nationale sont écartés pour concentrer le texte sur le choix d’un secteur et les déplacements à examiner.

## B. Article

# À Roubaix, choisir son secteur en regardant aussi le trajet au travail

**Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,74 €/L et celui du SP95-E10 de 0,47 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Roubaix. Une hausse qui donne une raison concrète d’examiner ses déplacements lorsqu’on cherche un logement.**

Le tableau chiffre le surcoût annuel de carburant selon la distance domicile-travail. Ses hypothèses : une consommation de 6 L/100 km, 200 allers-retours par an et des hausses arrondies à 5 centimes, soit +0,75 €/L pour le gazole et +0,45 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel, gazole | Surcoût annuel, SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 50 € |
| 15 km | environ 270 € | environ 160 € |
| 35 km | environ 630 € | environ 380 € |

Ce scénario invite à regarder les trajets que votre future adresse entraînerait. À Roubaix, les pratiques observées donnent des repères pour orienter cet examen.

## Des pratiques différentes selon le secteur et la destination

Au recensement de 2022, 62 % des actifs occupés résidant à Roubaix déclarent la voiture comme mode principal pour aller travailler.

Cette part varie selon le secteur de résidence : elle atteint 44 % à Épeule Sud, contre 78 % à Linné-Chemin Neuf. Ces proportions concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail. Pour départager des annonces dans ces secteurs, le trajet professionnel mérite donc un examen précis.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur — INSEE, recensement 2022.*

La destination apporte un autre repère : parmi les actifs résidant à Roubaix qui travaillent à Lille, 53 % utilisent principalement la voiture ; parmi ceux qui travaillent à Villeneuve-d’Ascq, cette part atteint 74 %. Si votre emploi se situe dans l’une de ces communes, examinez le déplacement depuis le logement envisagé avec vos propres horaires.

## Des équipements proches, y compris là où la voiture domine

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour choisir une adresse, il faut aussi regarder les courses et, selon votre situation, l’école.

À Épeule Sud comme à Linné-Chemin Neuf, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Cette proximité existe donc aussi dans un secteur où la voiture domine les déplacements professionnels.

Si vous visitez un logement dans ces secteurs, parcourez les chemins vers les équipements qui vous seraient utiles. L’accès à l’établissement et les traversées à effectuer permettent de confronter cette proximité à votre quotidien.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou pour organiser autrement la vie de famille ? Avec futur•e, examinez l’adresse envisagée à partir de ce projet, pour apprécier ce qui pèsera dans votre choix.

## Méthode et sources

Les pratiques domicile-travail proviennent du recensement INSEE 2022 : fichier Mobilités professionnelles et bases infracommunales. Elles portent sur les actifs occupés ; le dénominateur communal inclut ceux qui travaillent à domicile. Les résultats sont des estimations par sondage. Les groupes de destination sont distincts : leur comparaison ne mesure pas l’effet d’un déménagement.

Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers d’usage. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements 2025 ; elle porte sur les adresses, sans pondération à l’intérieur de chaque secteur. Les distances à vol d’oiseau ne décrivent pas les parcours à pied.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr. La médiane est établie à partir du dernier prix déclaré par chaque station pendant la semaine considérée. Le scénario porte sur le carburant seul et n’est attribué à aucun secteur ni à aucune destination.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,47 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Chapeau, hypothèses et tableau — dénomination du carburant | SP95-E10 | `carburant.e10.ecart`, `scenario.carburant.e10.5km` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses — allers-retours annuels | 200 | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses — hausse retenue pour le gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue pour le SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût SP95-E10 | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût SP95-E10 | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût SP95-E10 | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.voiture` | oui |
| Pratiques — voiture dans la commune | 62 % | `mobpro.modes.voiture` | oui |
| Pratiques — voiture à Épeule Sud | 44 % | `iris.595120503.voiture` | oui |
| Pratiques — voiture à Linné-Chemin Neuf | 78 % | `iris.595121201.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.595120503.voiture`, `iris.595121201.voiture` | oui |
| Destination — voiture vers Lille | 53 % | `destination.59350.voiture` | oui |
| Destination — voiture vers Villeneuve-d’Ascq | 74 % | `destination.59009.voiture` | oui |
| Équipements — « toutes les adresses » à Épeule Sud | 100 %, écrit « toutes » | `iris.595120503.panier_500m` | oui |
| Équipements — « toutes les adresses » à Linné-Chemin Neuf | 100 %, écrit « toutes » | `iris.595121201.panier_500m` | oui |
| Équipements — distance du panier complet | 500 m | `iris.595120503.panier_500m`, `iris.595121201.panier_500m` | oui |
| Méthode — recensement | 2022 | `mobpro.modes.voiture`, `destination.59350.voiture`, `destination.59009.voiture` | oui |
| Méthode — Base permanente des équipements | 2025 | `iris.595120503.panier_500m`, `iris.595121201.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. Données disponibles, reprises dans le tableau de l’article. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Épeule Sud et Linné-Chemin Neuf | Aucune pour la production automatique ; repérer les secteurs cités par des numéros et leur liste. Placement manuel des libellés seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Épeule Sud et Linné-Chemin Neuf. Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.