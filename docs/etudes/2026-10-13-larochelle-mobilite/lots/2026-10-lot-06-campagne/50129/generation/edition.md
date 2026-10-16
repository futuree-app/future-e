## A. Question et format

**Question principale :** que regarder au-delà du fait d’habiter dans sa commune de travail pour utiliser moins la voiture à Cherbourg-en-Cotentin ?

Les données distinguent deux examens utiles pour une recherche de logement : le trajet professionnel et les proximités autour de l’adresse. Travailler dans la commune est fréquent, mais la voiture demeure majoritaire parmi les actifs concernés ; les pratiques varient aussi fortement entre secteurs. Un secteur équipé pour les besoins quotidiens ne décrit pas, à lui seul, les déplacements professionnels.

**Appuis :** `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min`, `iris.voiture.max`, `iris.501290102.panier_500m`, `iris.501290501.panier_500m`, `iris.501290501.voiture`.

**Format retenu :** article court, avec le tableau carburant et une carte des pratiques par secteur.

**Pistes écartées :** stationnement, statut d’occupation et actifs venant travailler dans la commune élargiraient la question ; la comparaison nationale apporte peu au choix d’une adresse ; les fréquences de bus ne sont pas utilisables.

## B. Article

# Cherbourg-en-Cotentin : où chercher pour moins prendre la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole a augmenté de 0,74 €/L, celui du SP95-E10 de 0,51 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Cherbourg-en-Cotentin. Pour qui cherche un logement, cette hausse remet les déplacements quotidiens dans les critères de choix.

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,50 €/L pour le SP95-E10. Il chiffre uniquement le surcoût annuel de carburant.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances ne correspondent à aucun secteur particulier. Pour chercher à Cherbourg-en-Cotentin, il faut ensuite examiner les trajets que l’on souhaite moins faire en voiture.

## Habiter et travailler dans la commune : un premier repère

Dans les pratiques du recensement de 2022, 76 % des actifs résidant à Cherbourg-en-Cotentin travaillent dans la commune. Parmi ces actifs qui y habitent et y travaillent, 65 % utilisent principalement la voiture pour aller travailler.

Les pratiques varient aussi d’un secteur à l’autre. Parmi les actifs qui habitent Divette, quelle que soit leur commune de travail, la voiture est le mode principal de 49 % d’entre eux, contre 87 % parmi ceux qui habitent Le Bois.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte montre ces écarts entre secteurs. Pour chaque logement retenu, reste à examiner le trajet vers votre lieu de travail précis, même lorsque celui-ci se trouve dans la commune.

## Courses et école : une autre proximité à examiner

Le trajet professionnel ne couvre pas tous les déplacements à envisager avant de déménager. Pour les courses, la pharmacie et, si vous avez des enfants, l’école, les équipements autour du logement apportent un autre éclairage.

À Divette, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. C’est également le cas dans le secteur Provinces Ouest, où la voiture est le mode principal de 68 % des actifs résidents pour aller travailler.

Ces proximités servent à examiner les déplacements autour du logement ; elles ne décrivent pas la manière de rejoindre son emploi.

## Avant de retenir une adresse

Lors d’une visite, repérez le chemin jusqu’au commerce ou à l’école qui vous intéresse, ainsi que l’accès à l’établissement. Une proximité à vol d’oiseau ne décrit pas le parcours à pied.

Si vous comptez utiliser les transports en commun pour travailler, consultez le site de [Cap Cotentin](https://www.capcotentin.fr/) pour vérifier votre trajet et les horaires correspondant à vos besoins. Cette vérification porte sur votre destination et vos horaires de travail.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou vous installer en famille, partez de ce que vous voulez changer dans votre quotidien. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, en gardant l’ensemble de vos critères en vue.

## Méthode et sources

Les pratiques domicile-travail proviennent du fichier Mobilités professionnelles et des bases infracommunales de l’INSEE. Ce sont des estimations par sondage. Les parts par secteur concernent tous les actifs qui y résident ; elles ne sont pas croisées ici avec leur commune de travail.

Les secteurs sont les IRIS statistiques de l’INSEE, dont les noms peuvent différer des noms de quartiers usuels. Les proximités utilisent la Base adresse nationale et la Base permanente des équipements 2025 de l’INSEE ; elles sont mesurées jusqu’à l’adresse de l’établissement, pas jusqu’à son entrée.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : médianes des derniers prix déclarés par station pendant chaque semaine. Les stations déclarantes peuvent différer entre les périodes.

## C. Correspondance interne — non publiée

Les hypothèses communes de la section 7 sont rattachées ci-dessous aux identifiants des scénarios qu’elles définissent ; elles n’ont pas d’identifiants distincts dans le dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau : début de période | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau : fin de période | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau : hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau : hausse du SP95-E10 | 0,51 €/L | `carburant.e10.ecart` | oui |
| Chapeau : périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses : consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses : déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses : arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses : hausse retenue du gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses : hausse retenue du SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau : gazole, trajet court | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau : SP95-E10, trajet court | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau : gazole, trajet intermédiaire | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau : SP95-E10, trajet intermédiaire | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau : trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau : gazole, trajet long | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau : SP95-E10, trajet long | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques : millésime | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques : travail dans la commune | 76 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques : voiture parmi les actifs habitant et travaillant dans la commune | 65 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques : voiture à Divette | 49 % | `iris.501290102.voiture`, `iris.voiture.min` | oui |
| Pratiques : voiture au Bois | 87 % | `iris.501291202.voiture`, `iris.voiture.max` | oui |
| Équipements : « toutes les adresses » à Divette | 100 %, exprimé en mots | `iris.501290102.panier_500m` | oui |
| Équipements : distance du panier complet | moins de 500 m à vol d’oiseau | `iris.501290102.panier_500m`, `iris.501290501.panier_500m` | oui |
| Équipements : « également le cas » à Provinces Ouest, reprenant « toutes les adresses » | 100 %, exprimé en mots | `iris.501290501.panier_500m` | oui |
| Équipements : voiture à Provinces Ouest | 68 % | `iris.501290501.voiture` | oui |
| Méthode : millésime des équipements | 2025 | `iris.501290102.panier_500m`, `iris.501290501.panier_500m` — source BPE 2025 | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune. Tableau reproduit dans B. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Divette et Le Bois | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Libellés posés à la main seulement pour une version soignée. Faire figurer le millésime 2022 sur la carte. |

Vérifications concernant les faits utilisés :

- **Carburant — obligatoire avant publication :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Concerne les hausses citées et le scénario.
- **Secteurs — non bloquante pour la rédaction :** relire les libellés Divette, Le Bois et Provinces Ouest. L’article les désigne comme des secteurs statistiques.
- **Destination de travail — non bloquante :** la vérification du dossier porte sur l’intérêt du groupe Tollevast–Martinvast. L’article utilise seulement le groupe des actifs habitant et travaillant à Cherbourg-en-Cotentin ; il ne mobilise pas ce regroupement.

Aucun autre doute de lecture relevé pour les faits retenus.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : déduction sur le choix du secteur | Le choix du secteur mérite donc d’être regardé aussi. | Les pratiques varient aussi d’un secteur à l’autre. |
| Raisonnement — bloquante : carte présentée comme un guide de recherche | La carte donne des repères pour orienter les recherches. | La carte montre ces écarts entre secteurs. |
| Méthode — à revoir : millésime des équipements absent | la Base permanente des équipements de l’INSEE | la Base permanente des équipements 2025 de l’INSEE |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
