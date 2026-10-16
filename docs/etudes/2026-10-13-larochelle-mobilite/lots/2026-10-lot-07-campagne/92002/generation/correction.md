## A. Question et format

**Question principale :** quels repères utiliser pour examiner un logement à Antony si l’on souhaite moins prendre la voiture ?

Le contraste entre Fontaine Mouton et Bas Graviers donne une entrée concrète : les pratiques domicile-travail et la proximité du panier quotidien diffèrent entre ces secteurs. Le lieu de travail apporte un autre éclairage, sans croiser les populations. Ces observations aident à préparer l’examen d’une adresse, sans prédire les pratiques du futur occupant.

**Appuis :** `iris.920020307.voiture`, `iris.920020406.voiture`, `iris.920020307.panier_500m`, `iris.920020406.panier_500m`, `destination.92002.voiture`, `destination.78640.voiture`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les scénarios associés.

**Format retenu :** article court.

**Pistes écartées :** le repère de comparaison apporte peu à cette question ; la motorisation, le stationnement et les actifs venant travailler à Antony disperseraient le récit.

## B. Article

# À Antony, la place de la voiture selon le secteur et le lieu de travail

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de **0,64 €/L pour le gazole** et de **0,39 €/L pour le SP95-E10**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre d’Antony. Pour une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite changer.

Le scénario suivant montre le surcoût annuel selon la distance domicile-travail. Ses hypothèses : **6 L/100 km**, **200 allers-retours par an**, et des hausses arrondies à **5 centimes**, soit **+0,65 €/L pour le gazole** et **+0,40 €/L pour le SP95-E10**. Il porte sur le carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 230 € | environ 140 € |
| 35 km | environ 550 € | environ 340 € |

À Antony, les pratiques selon le secteur de résidence et le lieu de travail donnent des repères pour examiner cette question à l’échelle d’un logement.

## Situer l’annonce, puis regarder la destination

Les pratiques du recensement de **2022** montrent des situations différentes. À Fontaine Mouton, la voiture est le mode principal des trajets domicile-travail pour **29 % des actifs qui habitent le secteur**, contre **51 % à Bas Graviers**, toutes communes de travail confondues. La carte permet de situer une annonce parmi ces pratiques.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage. Parmi les actifs résidant à Antony qui travaillent à Antony, **32 %** vont travailler principalement en voiture. Parmi les actifs résidant à Antony qui travaillent à Vélizy-Villacoublay, cette part atteint **66 %**.

Si votre emploi est à Vélizy-Villacoublay, l’examen d’une annonce doit donc inclure les possibilités de déplacement vers cette destination, à vos horaires habituels.

## Les courses et l’école se regardent depuis le logement

Le logement sera aussi le point de départ des courses et, pour une famille, des déplacements vers l’école. La proximité des équipements apporte ici un repère complémentaire.

À Fontaine Mouton, **toutes les adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Bas Graviers, **20 % des adresses** réunissent ce panier.

Pour une annonce à Bas Graviers, repérez précisément les équipements qui vous concernent autour du logement. Lors de la visite, examinez aussi les cheminements à pied : cette vérification reste utile à Fontaine Mouton, même lorsque le panier est proche.

## Votre projet, votre adresse

Si votre déménagement doit vous aider à moins prendre la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, en la regardant dans son ensemble.

## Méthode et sources

Les pratiques proviennent de l’INSEE : fichier Mobilités professionnelles et base infracommunale Activité des résidents. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les résultats par secteur et par destination ne sont pas croisés et ne prédisent pas l’effet d’un déménagement.

Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. La proximité des équipements repose sur la Base adresse nationale et la BPE **2025** : le point représente l’adresse de l’établissement, pas son entrée, et la proximité ne décrit pas son usage. Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; les stations prises en compte peuvent différer entre les semaines.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,64 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,39 €/L | `carburant.e10.ecart` | oui |
| Chapeau — désignation du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — gazole | +0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — SP95-E10 | +0,40 €/L | `scenario.carburant.e10.5km` | oui |
| Hypothèses — désignation du carburant | SP95-E10 | `scenario.carburant.e10.5km` | oui |
| Tableau — désignation du carburant | SP95-E10 | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 140 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 340 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.920020307.voiture`, `iris.920020406.voiture`, `destination.92002.voiture`, `destination.78640.voiture` | oui |
| Pratiques — Fontaine Mouton | 29 % | `iris.920020307.voiture` | oui |
| Pratiques — Bas Graviers | 51 % | `iris.920020406.voiture` | oui |
| Pratiques — travail à Antony | 32 % | `destination.92002.voiture` | oui |
| Pratiques — travail à Vélizy-Villacoublay | 66 % | `destination.78640.voiture` | oui |
| Équipements — Fontaine Mouton | toutes les adresses, soit 100 % | `iris.920020307.panier_500m` | oui |
| Équipements — définition du panier | moins de 500 m à vol d’oiseau | `iris.920020307.panier_500m`, `iris.920020406.panier_500m` | oui |
| Équipements — Bas Graviers | 20 % | `iris.920020406.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920020307.panier_500m`, `iris.920020406.panier_500m` — définition et source du panier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Fontaine Mouton et Bas Graviers | Aucune nécessaire : classes automatiques et repères numérotés avec leur liste. Libellés posés à la main seulement pour une version soignée. |

La carte devra porter le millésime **2022** et repérer les deux secteurs cités.

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Fontaine Mouton et Bas Graviers. Le texte les présente comme des secteurs statistiques.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication et concerne aussi le scénario.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : le titre appelle une recommandation de secteur que les données ne permettent pas. | À Antony, quel secteur examiner pour utiliser moins la voiture ? | À Antony, la place de la voiture selon le secteur et le lieu de travail |