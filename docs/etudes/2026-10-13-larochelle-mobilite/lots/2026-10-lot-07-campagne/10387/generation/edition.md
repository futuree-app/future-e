## A. Question et format

**Question principale :** à Troyes, quels secteurs examiner pour utiliser moins la voiture, en tenant compte du travail comme des besoins quotidiens ?

Les pratiques domicile-travail diffèrent fortement entre secteurs. Leur rapprochement avec la proximité des équipements aide à lire les annonces : un secteur où les services sont proches peut aussi compter une forte part d’actifs allant travailler en voiture. Le lieu de travail apporte un autre repère, distinct du secteur de résidence.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.103871102.panier_500m`, `iris.103870501.panier_500m`, `iris.103870204.voiture`, `iris.103870204.panier_500m`, `mobpro.voiture_selon_destination.meme_commune` et `mobpro.voiture_selon_destination.communes_voisines`.

**Format :** article complet, resserré autour du choix d’une adresse. Ouverture carburant conservée.

**Pistes écartées :** stationnement, possession automobile, actifs venant travailler à Troyes et comparaison nationale, pour concentrer le récit sur les secteurs, les destinations de travail et les services proches.

## B. Article

# Vivre à Troyes en utilisant moins la voiture : quels secteurs regarder ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole a augmenté de 0,78 €/L et celui du SP95-E10 de 0,50 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Troyes. Pour qui cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements que la nouvelle adresse pourrait changer.

Le scénario suivant chiffre le surcoût annuel de carburant selon la distance du trajet aller. Il repose sur une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et des hausses médianes arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

À Troyes, les pratiques observées donnent des repères pour commencer une recherche. Elles invitent à examiner ensemble le secteur où se trouve le logement et les lieux que l’on devra rejoindre.

## Des pratiques très différentes selon le secteur

Les pratiques domicile-travail présentées ici sont celles du recensement de 2022. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la part déclarant la voiture comme mode principal pour aller travailler est de 37 % à Quatorze Juillet et de 83 % à Écrevolles.

La carte permet de situer ces pratiques autour des annonces que vous consultez. Elle donne une première lecture des secteurs où la voiture occupe une place différente dans les déplacements vers le travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui habitent et travaillent à Troyes, 55 % vont travailler principalement en voiture. Cette part est de 73 % parmi les actifs résidant à Troyes qui travaillent à Saint-André-les-Vergers, La Chapelle-Saint-Luc, Sainte-Savine, Saint-Julien-les-Villas, Pont-Sainte-Marie et Rosières-près-Troyes.

Pour examiner une annonce, gardez donc le lieu de travail à rejoindre à côté de l’adresse du logement. Une recherche limitée au nom du secteur laisserait cette partie du quotidien de côté.

## Courses et école : regarder aussi les services proches

Le trajet du travail ne résume pas les déplacements d’un ménage. Une adresse peut aussi intéresser une famille pour les courses ou l’école, ce qui conduit à regarder les équipements autour du logement.

Le repère retenu ici réunit un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Toutes les adresses du secteur Quatorze Juillet disposent de cet ensemble à proximité ; à Écrevolles, c’est le cas de 18 % des adresses.

Le secteur Pasteur apporte un autre éclairage : 93 % de ses adresses réunissent cet ensemble à proximité, tandis que 73 % des actifs qui y habitent déclarent la voiture comme mode principal pour aller travailler. La proximité des services et les pratiques vers l’emploi répondent ainsi à des questions différentes dans une recherche de logement.

## À vérifier depuis le logement envisagé

Lors d’une visite, partez de l’entrée du logement pour examiner les cheminements vers le commerce ou l’école repérés : accès, traversées, continuité du parcours. Ce sont ces passages concrets que vous retrouverez dans vos déplacements, au-delà de la proximité mesurée sur une carte.

Pour un trajet professionnel envisagé en transports en commun, le [site TCAT](https://tcat.fr/) renvoie vers la préparation d’itinéraire et les fiches horaires. Consultez celles qui correspondent aux jours et aux heures dont vous avez besoin, puis confrontez-les à votre organisation avant de retenir une adresse.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail tout en préservant votre vie de famille, partez de ce que vous souhaitez changer dans votre quotidien. Sur futur•e, explorez l’adresse envisagée à partir de ce projet pour éclairer votre choix de logement.

## Méthode et sources

Pratiques domicile-travail : INSEE, fichier Mobilités professionnelles et bases infracommunales. Les parts sont des estimations par sondage ; les comparaisons portent sur des groupes distincts et ne mesurent pas l’effet d’un déménagement. Les données par secteur et par commune de travail ne sont pas croisées.

Les secteurs sont les IRIS statistiques de l’INSEE, dont les libellés peuvent différer des noms de quartiers d’usage. Équipements : Base adresse nationale et Base permanente des équipements 2025 ; leur proximité ne renseigne pas leur usage.

Carburant : prix-carburants.gouv.fr, médiane entre stations du dernier prix déclaré dans chaque semaine. Informations pratiques : site officiel TCAT, consulté le 15 octobre 2026.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,78 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses du scénario — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario — arrondi | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Tableau — hausse retenue, gazole | +0,80 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 100 € par an | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 60 € par an | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 290 € par an | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 180 € par an | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 670 € par an | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 420 € par an | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — voiture à Quatorze Juillet | 37 % | `iris.voiture.min` | oui |
| Pratiques — voiture à Écrevolles | 83 % | `iris.voiture.max` | oui |
| Pratiques — actifs habitant et travaillant à Troyes | 55 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — actifs travaillant dans le groupe nommé | 73 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements — distance du panier | moins de 500 m à vol d’oiseau | `iris.103871102.panier_500m`, `iris.103870501.panier_500m`, `iris.103870204.panier_500m` | oui |
| Équipements — Quatorze Juillet | « Toutes les adresses » — 100 % | `iris.103871102.panier_500m` | oui |
| Équipements — Écrevolles | 18 % | `iris.103870501.panier_500m` | oui |
| Équipements — Pasteur | 93 % | `iris.103870204.panier_500m` | oui |
| Équipements — voiture des actifs résidant à Pasteur | 73 % | `iris.103870204.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.103871102.panier_500m`, `iris.103870501.panier_500m`, `iris.103870204.panier_500m` — source BPE indiquée dans le dossier | oui |
| Méthode — consultation du site TCAT | 15 octobre 2026 | `doc.reseau.site`, `doc.itineraire.calcul` | oui |

Les mentions « SP95-E10 » désignent le carburant, sans ajouter de donnée numérique.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début de l’article, après les hypothèses ; tableau reproduit en B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | À côté du passage sur Quatorze Juillet et Écrevolles | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée |

La carte reste à produire. Elle devra porter le millésime des pratiques et repérer les secteurs cités.

Vérifications humaines concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.
- **`iris.ecart_voiture`** : relire les libellés Quatorze Juillet, Écrevolles et Pasteur. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du choix des communes regroupées. Leur liste exacte figure dans l’article ; cette vérification est non bloquante pour la rédaction.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
