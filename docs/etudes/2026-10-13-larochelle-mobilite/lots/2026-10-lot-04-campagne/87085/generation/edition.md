## A. Question et format

**Question principale :** que regarder dans le choix d’un secteur à Limoges pour utiliser moins la voiture, même lorsqu’on travaille dans la commune ?

Travailler à Limoges ne décrit pas à lui seul les pratiques domicile-travail. Les contrastes entre secteurs, puis la proximité des équipements, donnent des points précis à examiner lors d’une recherche de logement, sans prédire les déplacements du lecteur.

**Appuis :** `mobpro.travaille_dans_commune`, `destination.87085.voiture`, `iris.870850204.voiture`, `iris.870851601.voiture`, `iris.870850204.panier_500m`, `iris.870851601.panier_500m`.

**Format retenu :** article court, avec l’ouverture carburant obligatoire, son tableau et une carte des pratiques par secteur.

**Pistes écartées :** comparaison nationale, statut d’occupation, stationnement et flux entrants, qui disperseraient la question ; fréquences de bus, inutilisables.

## B. Article

# Habiter Limoges : regarder le secteur de près

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de **0,74 €/L pour le gazole** et de **0,52 €/L pour le SP95-E10**, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Limoges. Pour qui cherche un logement, cette hausse remet les déplacements réguliers dans la discussion.

Le scénario suivant chiffre le surcoût annuel de carburant pour une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**. Il retient une hausse arrondie à **5 centimes**, soit **0,75 €/L pour le gazole** et **0,50 €/L pour le SP95-E10**.

*Scénario fondé sur la hausse entre les semaines du 6 octobre 2025 et du 5 octobre 2026.*

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances ne désignent aucun secteur en particulier. Pour orienter une recherche à Limoges, regardons plutôt où travaillent les actifs et comment ils s’y rendent.

## Des pratiques contrastées selon le secteur

Les pratiques décrites sont celles du **recensement de 2022**. Parmi les actifs occupés qui habitent Limoges, **82 % travaillent dans la commune**. Chez ceux qui y habitent et y travaillent, **66 % utilisent principalement la voiture** pour aller travailler.

L’échelle du secteur apporte une autre information. Parmi les actifs qui résident dans chaque secteur, tous lieux de travail confondus, la voiture est le mode principal de **48 % aux Halles**, contre **94 % à Beaune les Mines**.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur, 2022.*

Pour départager des annonces, ces pratiques invitent à examiner chaque emplacement et sa relation avec votre lieu de travail.

## Les courses et l’école entrent aussi dans le choix

Le trajet professionnel n’épuise pas les déplacements à envisager avant de déménager. La proximité des équipements apporte ici un autre éclairage sur les mêmes secteurs.

Aux Halles, **toutes les adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Beaune les Mines, cette part est de **22 %**.

Lors d’une visite aux Halles, parcourez les cheminements vers les équipements qui vous intéressent. À Beaune les Mines, repérez séparément ceux qui entourent l’adresse envisagée : l’absence du panier complet ne signifie pas l’absence de tout équipement. Pour le travail, examinez le déplacement depuis le logement en tenant compte de vos horaires.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille en utilisant moins la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour apprécier ce qui pèsera dans votre choix.

## Méthode et sources

Les pratiques proviennent de l’INSEE : fichier Mobilités professionnelles et bases infracommunales Activité des résidents et Logement. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les observations par secteur et par lieu de travail ne sont pas croisées. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** de l’INSEE. Chaque adresse du secteur compte pareil. Les distances à vol d’oiseau ne décrivent pas les cheminements réels ; la proximité ne renseigne pas sur l’usage des établissements.

Les prix viennent du flux officiel de prix-carburants.gouv.fr : médiane des derniers prix déclarés par station dans chaque semaine étudiée. Une hausse passée ne préjuge pas des prix futurs.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse SP95-E10 | 0,52 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse gazole retenue | 0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse SP95-E10 retenue | 0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du scénario — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du scénario — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune`, `destination.87085.voiture`, `iris.870850204.voiture`, `iris.870851601.voiture` | oui |
| Pratiques — travail dans la commune | 82 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture des actifs habitant et travaillant à Limoges | 66 % | `destination.87085.voiture` | oui |
| Pratiques — voiture aux Halles | 48 % | `iris.870850204.voiture` | oui |
| Pratiques — voiture à Beaune les Mines | 94 % | `iris.870851601.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.870850204.voiture`, `iris.870851601.voiture` | oui |
| Équipements — adresses des Halles | « toutes les adresses » : 100 % | `iris.870850204.panier_500m` | oui |
| Équipements — distance du panier complet | moins de 500 m à vol d’oiseau | `iris.870850204.panier_500m`, `iris.870851601.panier_500m` | oui |
| Équipements — adresses de Beaune les Mines | 22 % | `iris.870851601.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.870850204.panier_500m`, `iris.870851601.panier_500m` — sources des indicateurs d’accès | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Les Halles et Beaune les Mines | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Repérer les secteurs cités et conserver le millésime dans la légende. |

Vérifications avant publication concernant les faits retenus :

- **Carburant et scénario — `carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.
- **Secteurs — `iris.ecart_voiture` :** relire les libellés « Les Halles » et « Beaune les Mines ». Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture identifié.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Croisement — bloquante : les titres suggèrent un contraste par secteur limité aux actifs travaillant à Limoges. | Titre : « Vivre et travailler à Limoges : regarder le secteur de près » ; intertitre : « Un emploi dans la commune, des pratiques contrastées » | Titre : « Habiter Limoges : regarder le secteur de près » ; intertitre : « Des pratiques contrastées selon le secteur ». Ces formulations respectent le périmètre des parts par secteur : tous lieux de travail confondus. |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
