## A. Question et format

**Question principale :** comment examiner ensemble le secteur de résidence, le lieu de travail et les proximités quotidiennes pour chercher un logement à Issy-les-Moulineaux en utilisant moins la voiture ?

Les pratiques diffèrent entre secteurs, mais aussi selon la commune de travail. Les proximités des commerces et de l’école apportent un autre critère pour examiner une adresse, sans expliquer les pratiques observées.

**Appuis :** `mobpro.modes.voiture`, `mobpro.modes.tc`, `iris.voiture.min`, `iris.voiture.max`, `destination.92040.voiture`, `destination.78640.voiture`, `iris.920400203.panier_500m`, `iris.920400701.panier_500m`.

**Format :** article court, avec l’ouverture carburant et deux visuels. Les pistes sur la possession automobile, le stationnement, les entrants et la comparaison nationale sont écartées pour concentrer le texte sur le choix d’une adresse.

## B. Article

# À Issy-les-Moulineaux, quelle adresse choisir pour moins conduire ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,62 €/L, et celui du SP95-E10 de 0,19 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Issy-les-Moulineaux.

Pour une recherche de logement, cette hausse pose une question concrète : quels déplacements souhaite-t-on moins faire en voiture ? Le scénario suivant illustre le surcoût annuel de carburant selon la distance. Il suppose une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an, avec des hausses arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

## Le secteur et le travail, deux repères à examiner

Dans les pratiques du recensement de 2022, 22 % des actifs résidant à Issy-les-Moulineaux déclarent la voiture comme mode principal pour aller travailler, contre 52 % les transports en commun.

La part de la voiture varie selon le secteur : elle est de 15 % à Palais des Congrès Mail Menand et de 33 % au Petit Pont Amphibie. Ces parts concernent les actifs qui habitent chaque secteur, quel que soit leur lieu de travail. La carte permet de situer les logements repérés dans cette diversité de pratiques.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Votre lieu de travail mérite aussi d’entrer dans la recherche. Parmi les actifs qui habitent et travaillent à Issy-les-Moulineaux, 15 % déclarent la voiture comme mode principal ; parmi ceux qui résident dans la commune et travaillent à Vélizy-Villacoublay, cette part est de 57 %. Avant de retenir une annonce, examinez donc le trajet vers votre propre lieu de travail, depuis l’adresse proposée.

## Les courses et l’école se regardent à l’adresse

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour examiner les autres déplacements, le panier retenu réunit un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

À Palais des Congrès Mail Menand, 98 % des adresses réunissent ces proximités, contre 70 % au Petit Pont Amphibie. Ces résultats donnent une raison de regarder précisément les alentours d’un logement, plutôt que de s’en tenir au nom du secteur.

Lors d’une visite, repérez les équipements que vous utiliseriez et parcourez les chemins qui y mènent : les distances à vol d’oiseau ne décrivent pas le cheminement réel. Pour l’école, vérifiez aussi l’affectation correspondant à l’adresse envisagée.

## Votre projet, votre adresse

Si votre déménagement doit vous permettre de moins conduire, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de ce qui compte aussi dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, fichier Mobilités professionnelles et bases infracommunales Activité des résidents et Logement. Les parts communales incluent les actifs qui ne se déplacent pas pour travailler. Ces estimations reposent sur un sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels. Les groupes de destination sont distincts et ne sont pas croisés avec le secteur de résidence.

Les proximités portent sur les adresses de la Base adresse nationale, chaque adresse comptant pareil dans son secteur, et les équipements de la BPE 2025 de l’INSEE. Elles décrivent une proximité, pas un usage. Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; le scénario porte sur le carburant seul.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture — hausse du gazole | 0,62 €/L | `carburant.gazole.ecart` | oui |
| Ouverture — hausse du SP95-E10 | 0,19 €/L | `carburant.e10.ecart` | oui |
| Ouverture — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses communes du scénario, section 7 | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses communes du scénario, section 7 | 200 allers-retours par an | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses communes du scénario, section 7 | arrondi à 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — hausse retenue du gazole | 0,60 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue du SP95-E10 | 0,20 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première distance | environ 70 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première distance | environ 20 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau — deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième distance | environ 220 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième distance | environ 70 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau — troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième distance | environ 500 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième distance | environ 170 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.voiture`, `mobpro.modes.tc` | oui |
| Pratiques — voiture, commune | 22 % | `mobpro.modes.voiture` | oui |
| Pratiques — transports en commun, commune | 52 % | `mobpro.modes.tc` | oui |
| Secteurs — Palais des Congrès Mail Menand | 15 % | `iris.voiture.min` | oui |
| Secteurs — Le Petit Pont Amphibie | 33 % | `iris.voiture.max` | oui |
| Destination — travail à Issy-les-Moulineaux | 15 % | `destination.92040.voiture` | oui |
| Destination — travail à Vélizy-Villacoublay | 57 % | `destination.78640.voiture` | oui |
| Proximités — définition du panier | moins de 500 m à vol d’oiseau | `iris.920400203.panier_500m`, `iris.920400701.panier_500m` | oui |
| Proximités — Palais des Congrès Mail Menand | 98 % | `iris.920400203.panier_500m` | oui |
| Proximités — Le Petit Pont Amphibie | 70 % | `iris.920400701.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920400203.panier_500m`, `iris.920400701.panier_500m` — source BPE définie dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses ; contenu reproduit en B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison des secteurs | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés manuels seulement pour une version soignée. |

La carte portera le millésime des pratiques ; le tableau conservera les périodes de référence de la hausse dans son accompagnement.

**Vérifications avant publication concernant les faits utilisés :**

- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario.
- `iris.ecart_voiture` : relire les libellés des secteurs cités. Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
