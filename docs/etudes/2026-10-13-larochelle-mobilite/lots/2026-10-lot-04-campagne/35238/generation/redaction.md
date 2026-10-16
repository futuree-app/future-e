## A. Question et format

**Question principale :** que regarder dans une recherche de logement à Rennes pour utiliser moins la voiture, entre secteur de résidence, lieu de travail et proximité des équipements ?

Les pratiques diffèrent fortement entre Hoche et Morbihan Ouest, mais le lieu de travail apporte un autre éclairage. La proximité des courses et de l’école permet ensuite d’examiner le quotidien au-delà du travail. Ces observations donnent des repères pour sélectionner des annonces, sans prédire les déplacements du lecteur.

**Appuis :** `iris.352380102.voiture`, `iris.352380506.voiture`, `destination.35238.voiture`, `destination.35051.voiture`, `iris.352380102.panier_500m`, `iris.352380506.panier_500m`. Ouverture : `carburant.gazole.ecart`, `carburant.e10.ecart` et scénarios associés.

**Format :** article court. Comparaison nationale, stationnement, possession automobile et flux entrants écartés : ils ouvriraient d’autres questions sans faire avancer celle retenue.

## B. Article

# À Rennes, où chercher pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant a augmenté de **0,73 €/L pour le gazole** et de **0,49 €/L pour le SP95-E10**, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Rennes. Pour qui cherche un logement, cette hausse invite à examiner les déplacements qui accompagneraient l’adresse choisie.

Le scénario suivant chiffre le surcoût annuel de carburant selon la distance au travail. Il retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

*Carburant seul ; scénario fondé sur la hausse entre les semaines indiquées ci-dessus.*

Pour choisir où chercher à Rennes, le secteur de résidence et la destination du trajet apportent ensuite des repères distincts.

## Des pratiques différentes selon le secteur et le lieu de travail

Au recensement de **2022**, la voiture est le mode principal pour aller travailler de **18 % des actifs résidant dans le secteur Hoche**, contre **61 % à Morbihan Ouest**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur — INSEE, recensement 2022.*

La destination du trajet mérite aussi d’être examinée lorsque vous retenez une annonce. Parmi les actifs qui habitent Rennes et y travaillent, **29 %** vont principalement travailler en voiture. Parmi ceux qui habitent Rennes et travaillent à Cesson-Sévigné, cette part est de **50 %**.

Ces observations orientent la recherche vers une question concrète : depuis le logement envisagé, comment rejoindriez-vous votre propre lieu de travail ?

## Et pour les courses et l’école ?

Réduire l’usage de la voiture concerne aussi les déplacements en dehors du travail. Les mêmes secteurs peuvent être examinés sous l’angle des équipements proches.

À Hoche, **toutes les adresses** ont un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Morbihan Ouest, **57 % des adresses** réunissent cette même proximité.

Pour une adresse qui vous intéresse, repérez les équipements dont vous auriez l’usage, puis examinez les cheminements depuis le logement. Si vous envisagez les transports en commun, vérifiez le trajet et ses horaires sur le [site du réseau STAR](https://www.star.fr/), pour l’aller comme pour le retour.

## Votre projet, votre adresse

Vous rapprocher du travail ou vous installer en famille en utilisant moins la voiture donne un cap à votre recherche. Avec futur•e, examinez l’adresse envisagée à partir de ce projet et de ce qui pèsera dans votre vie quotidienne.

## Méthode et sources

Les pratiques domicile-travail proviennent du fichier MOBPRO et des bases infracommunales de l’INSEE ; elles concernent les actifs occupés de 15 ans ou plus. Ce sont des estimations par sondage. Les comparaisons portent sur des groupes distincts et ne mesurent pas l’effet d’un déménagement. Les secteurs sont les IRIS de l’INSEE, dont les noms peuvent différer des quartiers d’usage.

La proximité est mesurée depuis les adresses de la Base adresse nationale, avec les équipements de la BPE 2025 ; elle ne décrit pas leur usage. Pour les carburants, les médianes portent sur le dernier prix déclaré par chaque station pendant chaque semaine retenue ; les stations déclarantes peuvent différer entre les périodes.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture : début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture : fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture : hausse du gazole | 0,73 €/L | `carburant.gazole.ecart` | oui |
| Ouverture : hausse du SP95-E10 | 0,49 €/L | `carburant.e10.ecart` | oui |
| Ouverture : rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Ouverture, hypothèses et tableau : désignation du carburant | SP95-E10 | `carburant.e10.ecart`, `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Hypothèses : consommation | 6 L | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : allers-retours annuels | 200 | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : hausse retenue, gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses : hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau : surcoût gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau : surcoût SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau : surcoût gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau : surcoût SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau : trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau : surcoût gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau : surcoût SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques : millésime du recensement | 2022 | `iris.352380102.voiture`, `iris.352380506.voiture` | oui |
| Pratiques : voiture à Hoche | 18 % | `iris.352380102.voiture` | oui |
| Pratiques : voiture à Morbihan Ouest | 61 % | `iris.352380506.voiture` | oui |
| Légende de la carte : millésime | 2022 | `iris.352380102.voiture`, `iris.352380506.voiture` | oui |
| Destination : résider et travailler à Rennes | 29 % | `destination.35238.voiture` | oui |
| Destination : résider à Rennes et travailler à Cesson-Sévigné | 50 % | `destination.35051.voiture` | oui |
| Équipements : « toutes les adresses » à Hoche | 100 %, exprimé en mots | `iris.352380102.panier_500m` | oui |
| Équipements : seuil de proximité | 500 m | `iris.352380102.panier_500m`, `iris.352380506.panier_500m` | oui |
| Équipements : panier complet à Morbihan Ouest | 57 % | `iris.352380506.panier_500m` | oui |
| Méthode : âge minimal des actifs | 15 ans | `destination.35238.voiture`, `destination.35051.voiture` | oui |
| Méthode : millésime des équipements | 2025 | `acces.35238.panier_quotidien_500m` — source BPE | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture de Hoche et Morbihan Ouest | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée |

Vérifications concernant les faits utilisés :

- **Carburant et scénario — `carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Secteurs — `iris.ecart_voiture` :** relire les libellés Hoche et Morbihan Ouest. Le texte les présente comme des secteurs statistiques, sans les assimiler aux quartiers d’usage.

Aucun autre doute de lecture relevé.