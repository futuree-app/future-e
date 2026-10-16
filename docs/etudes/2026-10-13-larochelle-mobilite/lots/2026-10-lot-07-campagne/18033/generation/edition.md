## A. Question et format

**Question principale :** à Bourges, quels repères par secteur peuvent orienter une recherche de logement pour utiliser moins la voiture ?

Les pratiques domicile-travail diffèrent nettement selon le secteur de résidence. Les rapprocher de la proximité des équipements permet de choisir des adresses à examiner, sans promettre ce que le lecteur pourra faire lui-même. L’angle repose sur `iris.voiture.min`, `iris.voiture.max`, `iris.180330202.panier_500m` et `iris.180330102.panier_500m`, éclairés par `mobpro.travaille_dans_commune` et `mobpro.voiture_selon_destination.meme_commune`.

**Format retenu :** article court, avec l’ouverture carburant imposée et deux visuels.

**Pistes écartées :** comparaison nationale, stationnement, possession automobile et actifs venant travailler à Bourges : elles disperseraient la question du choix d’une adresse.

## B. Article

# Bourges : où chercher un logement pour moins prendre la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,79 €/L et celui du SP95-E10 de 0,54 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Bourges. Pour une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite réduire.

## Le surcoût selon la distance au travail

Le scénario suivant porte sur le carburant seul, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses retenues sont arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour examiner les annonces à Bourges, deux repères locaux complètent ce scénario : le lieu de travail et les pratiques observées dans le secteur du logement.

## Travailler à Bourges, puis regarder le secteur

Les pratiques décrites ici sont celles du recensement de 2022. Parmi les actifs occupés résidant à Bourges, 73 % travaillent dans la commune même. Dans ce groupe, 68 % déclarent la voiture comme mode principal pour aller travailler.

À l’échelle des secteurs statistiques, les pratiques diffèrent : la voiture est le mode principal de 55 % des actifs occupés résidant dans Couronne Centrale 2, contre 89 % dans Aéroport. Ces parts concernent les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte situe ces pratiques secteur par secteur. Pendant vos recherches, partez de votre propre destination professionnelle : travailler à Bourges ne décrit pas à lui seul le trajet depuis une adresse.

## Les courses et l’école peuvent orienter la recherche autrement

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour choisir un logement, il faut aussi regarder la proximité des équipements dont vous aurez besoin.

Dans Couronne Centrale 2, 76 % des adresses réunissent un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Dans Centre Ville 2, cette part atteint 98 %. Ces proximités donnent des pistes pour sélectionner des annonces ; lors d’une visite, examinez les chemins et les accès aux établissements qui vous intéressent.

Si vous envisagez certains déplacements en bus, le site [AggloBus](https://www.agglobus.com:443/), consulté le 15 octobre 2026, indique que les services du réseau sont gratuits pour tout public, sauf la location de vélos Cycloplus. Utilisez son calculateur d’itinéraire et vérifiez les horaires correspondant à vos jours de déplacement.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou simplifier les déplacements en famille, partez des trajets que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet pour apprécier sa place dans votre vie quotidienne.

### Méthode et sources

Les pratiques proviennent du recensement INSEE, fichier MOBPRO et bases infracommunales. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont des IRIS statistiques, dont les libellés ne correspondent pas toujours aux noms de quartiers d’usage. Les données ne croisent pas secteur de résidence et commune de travail.

Les proximités utilisent la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil au sein du secteur ; les distances à vol d’oiseau ne décrivent pas les parcours réels. Les prix viennent du flux officiel prix-carburants.gouv.fr : la médiane porte sur le dernier prix déclaré par station dans chaque semaine.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,79 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — nom du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Chapeau — hausse de l’essence | 0,54 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Tableau — hausse retenue, gazole | 0,80 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — nom du carburant | SP95-E10 | `scenario.carburant.e10.5km` | oui |
| Tableau — hausse retenue, essence | 0,55 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole, première ligne | environ 100 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût essence, première ligne | environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole, deuxième ligne | environ 290 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût essence, deuxième ligne | environ 200 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole, troisième ligne | environ 670 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût essence, troisième ligne | environ 460 € | `scenario.carburant.e10.35km` | oui |
| Transition après le tableau | deux repères | `mobpro.travaille_dans_commune`, `iris.voiture.min`, `iris.voiture.max` | oui — annonce des deux dimensions présentées |
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — actifs travaillant à Bourges | 73 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Bourges | 68 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — voiture dans Couronne Centrale | 55 % | `iris.voiture.min` | oui |
| Pratiques — libellé du secteur | Couronne Centrale 2 | `iris.voiture.min` | oui |
| Pratiques — voiture dans Aéroport | 89 % | `iris.voiture.max` | oui |
| Équipements — libellé du secteur | Couronne Centrale 2 | `iris.180330202.panier_500m` | oui |
| Équipements — adresses ayant le panier complet | 76 % | `iris.180330202.panier_500m` | oui |
| Équipements — distance du panier complet | 500 m | `iris.180330202.panier_500m`, `iris.180330102.panier_500m` | oui |
| Équipements — libellé du secteur | Centre Ville 2 | `iris.180330102.panier_500m` | oui |
| Équipements — adresses ayant le panier complet | 98 % | `iris.180330102.panier_500m` | oui |
| AggloBus — date de consultation | 15 octobre 2026 | `doc.tarification.reseau`, `doc.reseau.site`, `doc.verification.itineraire` | avec ses conditions pour la tarification ; oui pour le site et le calculateur |
| Méthode — millésime des équipements | 2025 | `iris.180330202.panier_500m`, `iris.180330102.panier_500m` — source commune des équipements précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Couronne Centrale 2 et Aéroport | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros accompagnés de leur liste. Libellés à poser à la main seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne l’ouverture et le scénario.
- **`iris.ecart_voiture`** : relire les libellés des secteurs cités. Le texte les présente comme des secteurs statistiques.

Aucun doute supplémentaire de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : les pratiques par secteur deviennent un critère de sélection des annonces. | La carte permet de situer ces pratiques par rapport aux logements proposés. Pendant vos recherches, confrontez ce premier repère à votre propre destination professionnelle : travailler à Bourges ne décrit pas à lui seul le trajet depuis une adresse. | La carte situe ces pratiques secteur par secteur. Pendant vos recherches, partez de votre propre destination professionnelle : travailler à Bourges ne décrit pas à lui seul le trajet depuis une adresse. |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
