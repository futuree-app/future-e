## A. Question et format

**Question principale :** à Pessac, quels repères croiser pour chercher un logement en utilisant moins la voiture ?

Le secteur où la voiture est la moins utilisée pour travailler ne réunit pas nécessairement les équipements du quotidien à proximité. Pour examiner une annonce, le lecteur gagne donc à distinguer les pratiques du secteur, sa propre destination de travail et les équipements autour de l’adresse.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `destination.33063.voiture`, `destination.33281.voiture`, `iris.333180118.panier_500m`, `iris.333180122.panier_500m` et `iris.333180122.voiture`.

**Format retenu :** article court, centré sur ce croisement. L’ouverture conserve la hausse datée du carburant et le scénario fourni.

**Pistes écartées :** stationnement, statut d’occupation, actifs venant travailler à Pessac et comparaison nationale : elles élargiraient le propos sans mieux éclairer le choix d’une adresse.

## B. Article

# À Pessac, où chercher un logement pour moins prendre la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,74 €/L et celui du SP95-E10 de 0,48 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Pessac. Cette hausse donne une raison concrète d’examiner les déplacements associés à un futur logement.

Le scénario ci-dessous porte sur le **surcoût annuel de carburant seul**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes. Ces distances sont des hypothèses, sans attribution à un secteur ou à une destination de travail.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre 2025 et 2026.*

À Pessac, les pratiques diffèrent fortement selon le secteur de résidence. Mais, pour chercher une adresse, il faut aussi regarder où l’on travaille et ce qui se trouve près du logement.

## Des pratiques très différentes selon le secteur

Au recensement de 2022, 66 % des actifs qui habitent Pessac déclarent la voiture comme mode principal pour aller travailler.

Cette part va de 19 % dans le secteur statistique Fac Lettres à 88 % à Toctoucau. La carte permet de situer ces contrastes parmi les secteurs où vous consultez des annonces.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Part des actifs résidant dans chaque secteur qui utilisent principalement la voiture pour travailler — INSEE, recensement 2022.*

## Votre destination de travail mérite un examen à part

Les pratiques du secteur ne suffisent pas à décrire votre déplacement professionnel. Parmi les actifs qui habitent Pessac et travaillent à Bordeaux, 51 % utilisent principalement la voiture ; parmi ceux qui travaillent à Mérignac, cette part atteint 83 %.

Pour départager des logements, examinez donc leur relation avec votre lieu de travail précis, en tenant compte de vos jours et horaires de déplacement.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel ne couvre pas tous les déplacements du quotidien. Pour une recherche de logement, la proximité des équipements apporte un autre éclairage.

Le dossier mesure la présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau de chaque adresse. À Fac Lettres, aucune adresse ne réunit ce panier complet. À Saige Nord, 97 % des adresses le réunissent, tandis que 45 % des actifs résidant dans ce secteur utilisent principalement la voiture pour travailler.

Ces observations invitent à regarder séparément les trajets professionnels et les équipements utiles à votre ménage. Avant une visite, repérez ceux qui vous intéressent et examinez leur accès réel sur place. Pour vos déplacements en transports en commun, consultez le [site du réseau TBM](https://www.infotbm.com/fr) afin de vérifier votre trajet et vos horaires.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en faisant davantage de place aux déplacements sans voiture ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour examiner ce qui peut peser dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE : fichier Mobilités professionnelles et bases infracommunales. Elles concernent les actifs occupés, y compris ceux qui travaillent à domicile. Les parts par secteur portent sur tous les actifs qui y résident, quelle que soit leur commune de travail ; elles ne sont pas croisées avec les destinations professionnelles présentées séparément. Ces estimations par sondage appellent à ne pas surinterpréter les petits écarts.

Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Les distances à vol d’oiseau ne décrivent pas le chemin réel ni l’usage des équipements. Les prix médians proviennent de prix-carburants.gouv.fr ; les stations déclarantes peuvent différer entre les semaines comparées.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario sont rattachées aux identifiants des lignes auxquelles elles s’appliquent ; elles figurent explicitement en section 7 du dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture — début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture — fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Ouverture — hausse du SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Ouverture — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses du scénario — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Tableau — hausse retenue, gazole | 0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Tableau — hausse retenue, SP95-E10 | 0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 90 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 60 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 270 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 180 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 630 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 420 €/an | `scenario.carburant.e10.35km` | oui |
| Légende du scénario — année de départ | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du scénario — année d’arrivée | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Pratiques locales — millésime | 2022 | `mobpro.modes.voiture` | oui |
| Pratiques locales — ensemble des actifs résidents | 66 % | `mobpro.modes.voiture` | oui |
| Pratiques locales — Fac Lettres | 19 % | `iris.voiture.min` | oui |
| Pratiques locales — Toctoucau | 88 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Destination de travail — Bordeaux | 51 % | `destination.33063.voiture` | oui |
| Destination de travail — Mérignac | 83 % | `destination.33281.voiture` | oui |
| Équipements — rayon du panier complet | moins de 500 m à vol d’oiseau | `iris.333180118.panier_500m`, `iris.333180122.panier_500m` | oui |
| Équipements — Fac Lettres | aucune adresse, soit 0 % | `iris.333180118.panier_500m` | oui |
| Équipements — Saige Nord | 97 % | `iris.333180122.panier_500m` | oui |
| Pratiques domicile-travail — Saige Nord | 45 % | `iris.333180122.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.333180118.panier_500m`, `iris.333180122.panier_500m` — source BPE indiquée par le dossier | oui |

Le renvoi au site officiel du réseau repose sur `doc.reseau.site` et son nom sur `doc.reseau.identite`, tous deux d’usage `oui`. Aucune desserte ni fréquence n’est affirmée.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après ses hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Fac Lettres et Toctoucau | Aucune pour la production avec classes automatiques et repères numérotés ; libellés à poser manuellement seulement pour une version soignée |

Vérifications avant publication concernant les faits utilisés :

- **`iris.ecart_voiture` :** relire les libellés Fac Lettres, Toctoucau et Saige Nord. L’article les présente comme des secteurs statistiques, sans les assimiler aux quartiers d’usage.
- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne l’ouverture et le scénario de surcoût.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
