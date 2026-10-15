## A. Question et format

**Question principale :** à Bordeaux, comment chercher un logement pour utiliser moins la voiture quand la proximité des équipements et les pratiques domicile-travail ne vont pas toujours ensemble ?

Le contraste entre les secteurs montre pourquoi il faut examiner séparément les déplacements professionnels et les besoins du quotidien. Il aide le lecteur à sélectionner des adresses sans transformer une pratique statistique en verdict sur un logement.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.330630504.panier_500m`, `iris.330630802.panier_500m`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`.

**Format retenu :** article court, centré sur ce contraste, avec l’ouverture carburant obligatoire.

**Pistes écartées :** stationnement, statut d’occupation, possession automobile et comparaison nationale : elles disperseraient la question sans préciser le choix d’une adresse.

## B. Article

# À Bordeaux, des équipements proches ne disent pas tout de la place de la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole autour de Bordeaux augmente de 0,72 €/L, celui du SP95-E10 de 0,48 €/L. Pour qui cherche un logement en souhaitant moins conduire, cette hausse donne une raison concrète d’examiner les déplacements associés à chaque adresse.

Le scénario suivant illustre le **surcoût annuel de carburant** selon la distance domicile-travail. Il retient une consommation de 6 L/100 km, 200 allers-retours par an et des hausses arrondies à 5 centimes : +0,70 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole : surcoût annuel | SP95-E10 : surcoût annuel |
|---|---:|---:|
| 5 km | environ 80 € | environ 60 € |
| 15 km | environ 250 € | environ 180 € |
| 35 km | environ 590 € | environ 420 € |

Ces distances ne désignent aucun quartier. Pour orienter une recherche à Bordeaux, les pratiques locales apportent un autre éclairage.

## Des écarts marqués entre secteurs

Dans les données du recensement de 2022, la voiture est le mode principal pour aller travailler de **14 % des actifs du secteur Hôtel de Ville-Quinconces 4**, contre **66 % à Lestonnat-Monséjour 2**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer une annonce parmi ces pratiques. Pour comprendre ce qu’elles peuvent apporter à votre recherche, il faut aussi regarder où vous travaillez.

## Examiner la destination du trajet professionnel

Parmi les actifs qui habitent et travaillent à Bordeaux, 22 % utilisent principalement la voiture pour aller travailler. Cette part est de 54 % parmi les actifs bordelais qui travaillent à Mérignac, Pessac, Talence, Villenave-d’Ornon, Saint-Médard-en-Jalles ou Bègles.

Lorsqu’une annonce vous intéresse, examinez donc le trajet vers votre lieu de travail, avec vos horaires d’aller et de retour. Pour les transports en commun, le [site officiel du réseau TBM](https://www.infotbm.com/fr) est le point de départ pour vérifier votre trajet et ses horaires.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel ne couvre qu’une partie du quotidien. Un logement peut aussi vous intéresser par les équipements proches, y compris dans un secteur où la voiture est très utilisée pour travailler.

Dans le secteur Hôtel de Ville-Quinconces 4, toutes les adresses disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. Dans le secteur Lestonnat-Monséjour 2, cette proximité concerne 97 % des adresses.

La forte place de la voiture dans les déplacements professionnels de ce dernier secteur coexiste donc avec des équipements proches pour la quasi-totalité des adresses. Pendant une visite, repérez ceux que vous utiliseriez et examinez les cheminements pour les rejoindre. Pour l’école, vérifiez aussi l’établissement que vous envisagez réellement : la proximité mesurée ne décrit pas la scolarisation des enfants.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à organiser votre vie de famille avec moins de déplacements en voiture ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix de logement.

## Méthode et sources

Les pratiques professionnelles proviennent de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Ce sont des estimations par sondage ; les groupes de destination sont distincts et leur comparaison ne mesure pas l’effet d’un changement de lieu de travail. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms usuels des quartiers.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements 2025 de l’INSEE. Les parts citées portent sur les adresses de chaque secteur, sans pondération ; les distances à vol d’oiseau ne décrivent pas les cheminements réels.

Les prix proviennent de prix-carburants.gouv.fr : médiane du dernier prix déclaré par chaque station dans chaque semaine, dans un rayon de 12 km à vol d’oiseau autour du centre de Bordeaux.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau : début de la comparaison | Semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau : fin de la comparaison | Semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau : hausse du gazole | 0,72 €/L | `carburant.gazole.ecart` | oui |
| Chapeau : hausse du SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Hypothèses : consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses : déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses : arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses : hausse retenue, gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses : hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau : gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau : SP95-E10, première ligne | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau : trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau : gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau : SP95-E10, deuxième ligne | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau : trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau : gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau : SP95-E10, troisième ligne | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques : millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques : libellé du secteur | Hôtel de Ville-Quinconces 4 | `iris.voiture.min` | oui |
| Pratiques : part de la voiture | 14 % | `iris.voiture.min` | oui |
| Pratiques : libellé du secteur | Lestonnat-Monséjour 2 | `iris.voiture.max` | oui |
| Pratiques : part de la voiture | 66 % | `iris.voiture.max` | oui |
| Destination : travail à Bordeaux | 22 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination : travail dans le groupe explicitement nommé | 54 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements : toutes les adresses du premier secteur | toutes — valeur exacte de 100 % | `iris.330630504.panier_500m` | oui |
| Équipements : seuil de proximité | moins de 500 m à vol d’oiseau | `iris.330630504.panier_500m`, `iris.330630802.panier_500m` | oui |
| Équipements : adresses du second secteur | 97 % | `iris.330630802.panier_500m` | oui |
| Méthode : millésime des équipements | 2025 | `iris.330630504.panier_500m`, `iris.330630802.panier_500m` — source BPE, sections 2 et 3 | oui |
| Méthode : périmètre des prix | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |

Le renvoi vers le site officiel de TBM repose sur `doc.reseau.site` ; le nom du réseau est également documenté par `doc.reseau.identite`.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre les secteurs | Aucune pour la production : classes automatiques et repères numérotés accompagnés de leur liste. Libellés posés à la main seulement pour une version soignée. L’état du visuel signale des classes à revoir. |

Vérifications concernant les faits utilisés :

- **Carburant — obligatoire avant publication :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Concerne aussi le scénario.
- **Secteurs — non bloquante :** relire les libellés d’IRIS. Le texte les présente comme des secteurs statistiques et conserve leur désignation complète à la première occurrence.
- **Groupe de destinations — non bloquante :** relire l’intérêt du choix des communes. La liste exacte figure dans l’article.

Aucun autre doute de lecture identifié.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Population — bloquante | À Lestonnat-Monséjour, dans le secteur cité, cette proximité concerne 97 % des adresses. | Dans le secteur Lestonnat-Monséjour 2, cette proximité concerne 97 % des adresses. |
| Lisibilité — a_revoir | Dans le secteur Hôtel de Ville-Quinconces cité plus haut, toutes les adresses | Dans le secteur Hôtel de Ville-Quinconces 4, toutes les adresses |
| Méthode — a_revoir, traitée partiellement | les groupes de destination sont distincts et leur comparaison ne mesure pas l’effet d’un déménagement | les groupes de destination sont distincts et leur comparaison ne mesure pas l’effet d’un changement de lieu de travail. L’ajout sur la sélection des six communes n’est pas retenu : il dépasserait la correction en quelques mots autorisée pour une anomalie `a_revoir`. |