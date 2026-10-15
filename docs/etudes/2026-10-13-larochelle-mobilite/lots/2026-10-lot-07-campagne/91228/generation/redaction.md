## A. Question et format

**Question principale :** que regarder dans le choix d’un secteur à Évry-Courcouronnes lorsqu’on souhaite utiliser moins la voiture ?

Le contraste entre Centre Urbain Nord et Courcouronnes Centre Nord donne des repères pour orienter une recherche : les pratiques domicile-travail diffèrent fortement, tout comme la proximité du panier quotidien. Ces observations invitent à examiner séparément le trajet professionnel et les équipements autour du logement, sans attribuer les pratiques aux seuls secteurs.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.912280105.panier_500m`, `iris.912280204.panier_500m`, `mobpro.qui_vient_travailler.habitent_la_commune.voiture`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les scénarios `scenario.carburant.*`.

**Format retenu :** article court, centré sur ce contraste. Comparaison nationale, statuts d’occupation, stationnement et flux de travailleurs extérieurs sont écartés : ils apporteraient peu à cette question.

## B. Article

# Évry-Courcouronnes : quel secteur regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,69 €/L, et celui du SP95-E10 de 0,43 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Évry-Courcouronnes. Pour un ménage qui cherche un logement, cette hausse remet les déplacements réguliers dans la balance.

## Le surcoût selon la distance au travail

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses utilisées, arrondies à 5 centimes, sont de 0,70 €/L pour le gazole et de 0,45 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel de gazole | Surcoût annuel de SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 250 € | environ 160 € |
| 35 km | environ 590 € | environ 380 € |

Ces distances ne correspondent à aucun secteur particulier. Pour chercher où utiliser moins la voiture, il faut ensuite regarder les pratiques locales et ce qui se trouve autour des logements envisagés.

## Des pratiques très différentes selon le secteur

Les pratiques décrites sont celles du recensement de 2022. Parmi les actifs qui résident à Centre Urbain Nord, 33 % déclarent la voiture comme mode principal pour aller travailler, contre 72 % à Courcouronnes Centre Nord. Ces parts concernent les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail, recensement 2022.*

Ce contraste mérite d’entrer dans votre sélection d’annonces : il donne une raison d’examiner ces secteurs de près, puis de confronter chaque adresse à vos déplacements.

Le lieu de travail apporte un autre repère. Parmi les actifs qui habitent et travaillent à Évry-Courcouronnes, 39 % utilisent principalement la voiture. Même lorsque l’emploi se trouve dans la commune, le trajet professionnel reste donc un point à examiner avec le logement.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet du matin ne couvre pas tous les déplacements d’un foyer. Pour examiner les autres besoins, on peut regarder la proximité simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire : le « panier quotidien », situé à moins de 500 m à vol d’oiseau.

À Centre Urbain Nord, 96 % des adresses réunissent ce panier à cette distance. À Courcouronnes Centre Nord, cette part est de 13 %. Ce contraste précise ce qu’il faut regarder lors d’une visite : où se trouvent les équipements dont votre foyer aura besoin, et par quels chemins les rejoindre ?

Si vous comparez des annonces dans ces secteurs, parcourez ces chemins depuis les logements retenus. Examinez séparément le trajet vers votre lieu de travail, aux horaires qui seront les vôtres.

## Votre projet, votre adresse

Si votre déménagement vise à alléger vos déplacements ou à vous installer en famille, partez de ce que vous souhaitez changer au quotidien. Explorez avec futur•e l’adresse envisagée à partir de ce projet, avant de vous décider.

### Méthode et sources

Pratiques : INSEE, fichier Mobilités professionnelles et bases infracommunales. Ces estimations par sondage décrivent des groupes distincts et ne mesurent pas l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers d’usage.

Proximité : Base adresse nationale et Base permanente des équipements 2025. Les parts présentées portent sur les adresses de chaque secteur ; elles ne décrivent ni les cheminements réels ni l’usage des équipements.

Carburant : flux officiel de prix-carburants.gouv.fr ; médiane entre stations du dernier prix déclaré dans chaque semaine.

## C. Correspondance interne — non publiée

Les hypothèses sont celles de la section 7 du dossier, communes aux scénarios cités.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,69 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,43 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — arrondi | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — hausse retenue, gazole | 0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | 0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — Centre Urbain Nord | 33 % | `iris.voiture.min` | oui |
| Pratiques — Courcouronnes Centre Nord | 72 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Actifs habitant et travaillant dans la commune | 39 % | `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | oui |
| Définition du panier quotidien | 500 m | `iris.912280105.panier_500m`, `iris.912280204.panier_500m` | oui |
| Panier quotidien — Centre Urbain Nord | 96 % | `iris.912280105.panier_500m` | oui |
| Panier quotidien — Courcouronnes Centre Nord | 13 % | `iris.912280204.panier_500m` | oui |
| Méthode — millésime de la BPE | 2025 | `iris.912280105.panier_500m`, `iris.912280204.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Centre Urbain Nord et Courcouronnes Centre Nord | Aucune nécessaire : classes automatiques et repères numérotés avec leur liste. Pose manuelle des libellés seulement pour une version soignée. |

**Vérifications avant publication :**

- **`iris.ecart_voiture` :** relire les libellés Centre Urbain Nord et Courcouronnes Centre Nord. Le texte les présente comme des secteurs statistiques.
- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication pour les hausses et les scénarios utilisés.

Aucun autre doute de lecture relevé.