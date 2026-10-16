## A. Question et format

**Question principale :** à Meaux, que regarder dans le choix d’un secteur pour utiliser moins la voiture, au travail comme pour les déplacements du quotidien ?

Le contraste entre Centre Hôtel de Ville Nord et Buffon Centre donne une première lecture utile pour chercher un logement : les pratiques domicile-travail et la proximité des équipements diffèrent nettement. La commune de travail apporte un autre éclairage, distinct du secteur de résidence.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.772840902.panier_500m`, `iris.772840202.panier_500m`, `mobpro.voiture_selon_destination.meme_commune` et `mobpro.voiture_selon_destination.communes_voisines`.

**Format retenu : article court.** Le stationnement, la possession automobile, les actifs venant travailler à Meaux et le repère de comparaison sont écartés pour conserver ce fil.

## B. Article

# À Meaux, quel secteur regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant a augmenté de **0,73 €/L pour le gazole** et de **0,48 €/L pour le SP95-E10**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Meaux. Pour une recherche de logement, cette hausse invite à examiner les déplacements que l’adresse envisagée laisserait à faire en voiture.

Le scénario suivant porte sur le carburant seul : consommation de **6 L/100 km**, **200 allers-retours domicile-travail par an**, hausses arrondies à **5 centimes**, soit **+0,75 €/L pour le gazole** et **+0,50 €/L pour le SP95-E10**.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel, gazole | Surcoût annuel, SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

À Meaux, les pratiques varient selon le secteur de résidence et la commune de travail. Ces observations permettent de préciser les questions à poser devant une annonce.

## Du Centre Hôtel de Ville Nord à Buffon Centre, des pratiques différentes

Les pratiques domicile-travail décrites ici sont celles du recensement **2022**. Dans le secteur statistique Centre Hôtel de Ville Nord, **33 % des actifs** déclarent la voiture comme mode principal pour aller travailler, contre **66 % à Buffon Centre**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Ce contraste donne une raison d’examiner le secteur d’une annonce. Pour comprendre ce qu’il signifie pour votre projet, il faut aussi regarder où vous travaillerez.

Parmi les actifs qui habitent et travaillent à Meaux, **43 %** utilisent principalement la voiture. Cette part atteint **66 %** parmi les actifs résidant à Meaux qui travaillent à **Nanteuil-lès-Meaux, Crégy-lès-Meaux, Trilport, Villenoy, Mareuil-lès-Meaux ou Poincy**. Si votre emploi se trouve dans l’une de ces communes, examinez ce déplacement précisément pendant votre recherche.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour choisir une adresse, la proximité des équipements apporte un autre repère.

À Centre Hôtel de Ville Nord, la quasi-totalité des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Buffon Centre, cette part est de **37 %**.

Pour une annonce dans ces secteurs, repérez séparément les équipements dont vous auriez besoin, puis vérifiez les chemins depuis le logement lors de la visite. Le panier complet peut manquer alors qu’un commerce, une pharmacie ou une école se trouve à proximité ; la distance à vol d’oiseau ne décrit pas le parcours à pied.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour voir comment elle s’inscrit dans la vie que vous souhaitez y construire.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, fichier MOBPRO et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les groupes de destination réunissent des personnes distinctes, et les données ne croisent pas secteur de résidence et commune de travail. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la BPE **2025**. Chaque adresse compte pareil dans les parts par secteur ; la proximité ne renseigne pas sur l’usage des équipements ni sur l’affectation scolaire.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré pendant chaque semaine étudiée. Le scénario illustre un surcoût passé, sans prévoir les prix futurs.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau : semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau : semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau : hausse du gazole | 0,73 €/L | `carburant.gazole.ecart` | oui |
| Chapeau : hausse du SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Chapeau : périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses : consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses : hausse retenue du gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses : hausse retenue du SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller court | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau : gazole, trajet court | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau : SP95-E10, trajet court | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller intermédiaire | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau : gazole, trajet intermédiaire | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau : SP95-E10, trajet intermédiaire | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau : trajet aller long | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau : gazole, trajet long | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau : SP95-E10, trajet long | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques : millésime du recensement | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques : Centre Hôtel de Ville Nord | 33 % des actifs | `iris.voiture.min` | oui |
| Pratiques : Buffon Centre | 66 % des actifs | `iris.voiture.max` | oui |
| Destination : actifs habitant et travaillant à Meaux | 43 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination : actifs résidant à Meaux et travaillant dans le groupe nommé | 66 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements : Centre Hôtel de Ville Nord | « la quasi-totalité » — valeur source : 99,6 % | `iris.772840902.panier_500m` | oui |
| Équipements : seuil du panier quotidien, commun aux secteurs cités | 500 m à vol d’oiseau | `iris.772840902.panier_500m`, `iris.772840202.panier_500m` | oui |
| Équipements : Buffon Centre | 37 % des adresses | `iris.772840202.panier_500m` | oui |
| Méthode : millésime de la BPE | 2025 | `iris.772840902.panier_500m`, `iris.772840202.panier_500m` — définition et source de l’accès aux équipements | oui |

Les chiffres inclus dans la dénomination **SP95-E10** désignent le carburant tel qu’il figure dans les faits `carburant.e10.*` et les lignes du scénario ; ils ne constituent pas des valeurs statistiques supplémentaires.

## D. Visuels et vérifications restantes

| Nom exact du visuel | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Après les hypothèses, au début de l’article | Aucune. Données disponibles. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Centre Hôtel de Ville Nord et Buffon Centre | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Repérer les secteurs cités et faire figurer le millésime 2022. |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Centre Hôtel de Ville Nord et Buffon Centre. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du groupe de communes retenu. Sa liste exacte figure dans l’article ; cette vérification est non bloquante pour la rédaction.

Aucun autre doute de lecture relevé.