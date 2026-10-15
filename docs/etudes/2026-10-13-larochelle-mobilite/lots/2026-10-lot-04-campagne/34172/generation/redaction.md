## A. Question et format

**Question principale :** comment choisir un secteur à Montpellier pour utiliser moins la voiture, sans confondre les pratiques domicile-travail et la proximité des courses ou de l’école ?

Le contraste entre Saint-Roch et Salaison éclaire cette recherche : des pratiques professionnelles très différentes coexistent avec une proximité élevée des équipements dans les deux secteurs. Le lecteur peut ainsi examiner séparément son trajet professionnel et ses déplacements de proximité.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.341722504.panier_500m`, `iris.341722101.panier_500m`, `mobpro.travaille_dans_commune`, `destination.34172.voiture`.

**Format :** article court, centré sur ce contraste, avec l’ouverture carburant obligatoire.

**Pistes écartées :** stationnement, possession automobile et flux entrants disperseraient la question ; la comparaison nationale apporte peu à ce choix d’adresse ; les fréquences de bus sont inutilisables.

## B. Article

# À Montpellier, quel secteur choisir pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de **0,77 €/L pour le gazole** et de **0,51 €/L pour l’essence SP95-E10** autour de Montpellier. Pour une recherche de logement, cette hausse invite à regarder les déplacements que l’adresse envisagée permettrait de revoir.

### Ce que la distance change au surcoût de carburant

Ces prix concernent les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Montpellier.

Le scénario suivant retient une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**. Les hausses sont arrondies à **5 centimes**, soit **+0,75 €/L** pour le gazole et **+0,50 €/L** pour l’essence. Il chiffre uniquement le surcoût de carburant.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel lié à la hausse entre 2025 et 2026.*

| Distance du trajet aller | Gazole | Essence |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

Pour choisir un logement, reste à examiner quels trajets on souhaite faire autrement. À Montpellier, les pratiques varient fortement selon le secteur de résidence.

### De Saint-Roch à Salaison, des pratiques très différentes

Les pratiques domicile-travail du recensement de **2022** montrent ce contraste : dans le secteur statistique Saint-Roch, **15 % des actifs** déclarent la voiture comme mode principal pour aller travailler, contre **72 % à Salaison**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail, 2022.*

La carte donne une raison de situer précisément les annonces retenues : la seule mention « Montpellier » laisse de côté ces différences.

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui résident à Montpellier, **75 % travaillent dans la commune**. Parmi ceux qui y habitent et y travaillent, **40 % utilisent principalement la voiture**. Même pour une recherche centrée sur Montpellier, le trajet entre le logement et le lieu de travail mérite donc un examen précis.

### Des équipements proches, y compris là où la voiture domine

Le trajet professionnel ne couvre pas les besoins de courses, d’école ou de pharmacie. Pour ces déplacements, regardons ce qui se trouve autour des adresses.

À Saint-Roch, **100 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Cette part atteint **90 % à Salaison**, où la voiture est pourtant le mode principal le plus déclaré pour travailler.

Pour une visite à Salaison, ce résultat invite à examiner les possibilités de déplacements de proximité séparément du trajet professionnel. Repérez les équipements utiles à votre foyer, puis regardez les chemins qui les relient au logement. Pour les transports en commun, vérifiez votre trajet et vos horaires auprès du réseau [TaM](https://www.tam-voyages.com).

### Votre projet, votre adresse

Si votre déménagement vise à moins conduire, précisez les déplacements que vous souhaitez changer et ceux que vous comptez conserver. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour la replacer dans l’ensemble de vos critères de vie.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE et de ses bases infracommunales. Les résultats sont des estimations par sondage ; les observations par secteur et par destination ne constituent pas un croisement de ces données. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE de **2025**. Elle décrit leur présence autour des adresses, sans établir leur usage. Les prix proviennent du flux officiel prix-carburants.gouv.fr ; les stations déclarantes peuvent varier d’une semaine à l’autre.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,77 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse de l’essence | 0,51 €/L | `carburant.e10.ecart` | oui |
| Chapeau — désignation du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Périmètre des prix | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèse de consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèse de déplacements | 200 allers-retours par an | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Règle d’arrondi du scénario | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hausse retenue — gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hausse retenue — essence | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — essence | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — essence | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — essence | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques professionnelles — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Saint-Roch — voiture | 15 % | `iris.voiture.min` | oui |
| Salaison — voiture | 72 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Actifs résidents travaillant à Montpellier | 75 % | `mobpro.travaille_dans_commune` | oui |
| Voiture parmi les actifs habitant et travaillant à Montpellier | 40 % | `destination.34172.voiture` | oui |
| Saint-Roch — adresses avec le panier complet | 100 % | `iris.341722504.panier_500m` | oui |
| Définition du panier — distance | 500 m | `iris.341722504.panier_500m`, `iris.341722101.panier_500m` | oui |
| Salaison — adresses avec le panier complet | 90 % | `iris.341722101.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.341722504.panier_500m`, `iris.341722101.panier_500m` — source commune des équipements | oui |

Le nom du réseau et le lien officiel reposent sur `doc.reseau.identite` et `doc.reseau.site`, d’usage `oui`.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Saint-Roch et Salaison | Aucune pour la production automatique : classes automatiques et secteurs cités repérés par numéros avec leur liste. Libellés manuels seulement pour une version soignée. |

**Vérifications avant publication :**

- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations ; cette vérification concerne également le scénario.
- `iris.ecart_voiture` : relire les libellés Saint-Roch et Salaison. Le texte les présente comme des secteurs statistiques ; conserver cette désignation dans la carte.