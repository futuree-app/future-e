## A. Question et format

**Question principale :** que regarder, au-delà de la proximité des équipements, pour choisir un logement à Clichy en utilisant moins la voiture ?

Les secteurs où la part de la voiture est la plus basse et la plus élevée ont tous deux le panier quotidien à proximité de toutes leurs adresses. Ce résultat invite à examiner séparément les équipements autour du logement et la liaison vers son travail. Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.920240402.panier_500m`, `iris.920240303.panier_500m`, `mobpro.voiture_selon_destination.meme_commune`, `destination.92036.voiture`.

**Format retenu : article court.** L’ouverture s’appuie sur les hausses utilisables `carburant.gazole.ecart`, `carburant.e10.ecart` et le scénario fourni.

Pistes écartées : possession automobile, stationnement, actifs venant travailler à Clichy et comparaison nationale, qui disperseraient cette lecture centrée sur le choix d’une adresse.

## B. Article

# À Clichy, choisir son adresse pour utiliser moins la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,62 €/L et celui du SP95-E10 de 0,19 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Clichy.

Le tableau donne le surcoût annuel de carburant selon la distance. Il repose sur une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an, avec des hausses retenues arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole : hausse retenue de 0,65 €/L | SP95-E10 : hausse retenue de 0,20 €/L |
|---|---:|---:|
| 5 km | environ 80 €/an | environ 20 €/an |
| 15 km | environ 230 €/an | environ 70 €/an |
| 35 km | environ 550 €/an | environ 170 €/an |

Pour une recherche de logement à Clichy, cela amène une question concrète : quels repères regarder pour envisager de moins prendre la voiture ?

## Situer le logement, puis examiner son trajet professionnel

Au recensement de 2022, 17 % des actifs occupés résidant à Clichy déclarent la voiture comme mode principal pour aller travailler, contre 56 % les transports en commun.

Les pratiques diffèrent selon les secteurs statistiques. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la part de la voiture est de 8 % à Maison du Peuple et de 24 % aux Bateliers. Repérez sur la carte le secteur des annonces que vous retenez.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La destination professionnelle apporte un autre éclairage. Parmi les actifs qui habitent et travaillent à Clichy, 12 % vont travailler principalement en voiture. Parmi ceux qui habitent Clichy et travaillent à Gennevilliers, cette part est de 31 %. Pour le logement envisagé, examinez la liaison vers votre propre lieu de travail aux horaires qui vous concernent.

## Pour les courses et l’école, passer de la proximité au chemin réel

Le trajet professionnel ne couvre qu’une partie du quotidien : une adresse se choisit aussi pour les courses et, selon le ménage, l’école.

À Maison du Peuple comme aux Bateliers, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Les secteurs aux pratiques domicile-travail les plus opposées partagent donc ce même repère de proximité.

Lors d’une visite, parcourez les chemins depuis l’entrée de l’immeuble vers les équipements dont vous auriez besoin. C’est une façon concrète d’examiner les déplacements que vous souhaiteriez faire sans voiture.

## Votre projet, votre adresse

Si vous déménagez pour alléger la place de la voiture dans vos journées, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de ce qui compte pour vous dans le choix d’un logement.

## Méthode et sources

Les pratiques proviennent du recensement de l’INSEE : MOBPRO et bases infracommunales. Les parts portent sur les actifs occupés, y compris ceux qui ne se déplacent pas pour travailler. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les groupes selon la destination sont distincts : leur comparaison ne mesure pas l’effet d’un déménagement. Les secteurs sont les IRIS de l’INSEE.

La proximité des équipements repose sur la BAN et la Base permanente des équipements de l’INSEE ; elle ne renseigne pas sur leur fréquentation. Source carburant : prix-carburants.gouv.fr, médianes entre stations des derniers prix déclarés dans chaque semaine.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,62 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,19 €/L | `carburant.e10.ecart` | oui |
| Chapeau, périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses, déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Tableau, en-tête gazole | 0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Tableau, en-tête SP95-E10 | 0,20 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller court | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole, trajet court | environ 80 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10, trajet court | environ 20 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller intermédiaire | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole, trajet intermédiaire | environ 230 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10, trajet intermédiaire | environ 70 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller long | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole, trajet long | environ 550 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10, trajet long | environ 170 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime | 2022 | `mobpro.modes.voiture`, `mobpro.modes.tc` | oui |
| Pratiques locales, voiture | 17 % | `mobpro.modes.voiture` | oui |
| Pratiques locales, transports en commun | 56 % | `mobpro.modes.tc` | oui |
| Maison du Peuple, voiture | 8 % | `iris.voiture.min` | oui |
| Bateliers, voiture | 24 % | `iris.voiture.max` | oui |
| Actifs habitant et travaillant à Clichy, voiture | 12 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Actifs habitant Clichy et travaillant à Gennevilliers, voiture | 31 % | `destination.92036.voiture` | oui |
| Équipements, couverture dans les deux secteurs | « toutes les adresses » : 100 % dans chacun | `iris.920240402.panier_500m`, `iris.920240303.panier_500m` | oui |
| Équipements, distance du panier | moins de 500 m à vol d’oiseau | `iris.920240402.panier_500m`, `iris.920240303.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de Maison du Peuple et des Bateliers | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée |

Le millésime des pratiques doit figurer sur la carte ; le tableau doit conserver ses hypothèses et les hausses retenues.

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Maison du Peuple et Bateliers. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du choix des communes de comparaison. Le groupe automatique de six communes n’est pas utilisé ; la comparaison retenue nomme Clichy et Gennevilliers séparément.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication.

Aucun autre doute de lecture relevé.