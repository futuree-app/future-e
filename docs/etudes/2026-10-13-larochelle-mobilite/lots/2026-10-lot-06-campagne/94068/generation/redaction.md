## A. Question et format

**Question principale :** à Saint-Maur-des-Fossés, comment choisir une adresse pour moins utiliser la voiture, en distinguant déplacements professionnels et proximité des équipements ?

L’écart entre secteurs est marqué, mais le secteur où la voiture est la plus utilisée pour travailler présente aussi une forte proximité des équipements quotidiens. Pour chercher un logement, cela invite à examiner séparément le déplacement professionnel et les besoins autour de l’adresse. Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.940680801.panier_500m`, `iris.940680703.panier_500m`, `destination.94028.voiture`, `destination.75108.voiture`.

**Format retenu : article court.** L’ouverture utilise les hausses de carburant et le scénario fourni. Stationnement, équipement automobile et actifs venant travailler dans la commune sont écartés pour garder ce fil ; le repère de comparaison entre villes apporte peu à cette question.

## B. Article

# À Saint-Maur-des-Fossés, quelle adresse pour moins prendre la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,68 €/L, celui du SP95-E10 de 0,41 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Saint-Maur-des-Fossés. Lorsqu’on cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite faire autrement.

Le scénario suivant porte sur le **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,70 €/L pour le gazole et +0,40 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole : surcoût annuel | SP95-E10 : surcoût annuel |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 250 € | environ 140 € |
| 35 km | environ 590 € | environ 340 € |

Ces distances sont des hypothèses, sans attribution à un secteur ou à une destination de travail. À Saint-Maur-des-Fossés, les données locales invitent justement à distinguer le quartier où l’on habite, le lieu où l’on travaille et les équipements proches du logement.

## Pour le travail, des pratiques différentes selon le secteur et la destination

Dans les pratiques du recensement de 2022, la voiture est le mode principal pour aller travailler de **21 % des actifs qui habitent Saint-Maur Créteil 1**, contre **50 % à La Pie 3**, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer une annonce dans ces contrastes. Mais la recherche doit aussi tenir compte de votre lieu de travail : parmi les actifs résidant à Saint-Maur-des-Fossés, la part de la voiture atteint 58 % chez ceux qui travaillent à Créteil, contre 13 % chez ceux qui travaillent à Paris 8e Arrondissement. Pour examiner un logement, associez donc le repérage du secteur à l’examen de votre propre destination professionnelle.

## Courses et école : une autre lecture de l’adresse

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour les courses ou l’école, la proximité des équipements apporte un éclairage différent.

À Saint-Maur Créteil 1, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À La Pie 3, cette proportion atteint 90 %, alors même que la part de la voiture pour travailler y est la plus élevée de la commune.

Ce rapprochement donne une piste concrète pour les visites : dans ce dernier secteur aussi, regardez où se trouvent ces équipements par rapport au logement. Parcourez les chemins qui vous intéressent : la proximité mesurée à vol d’oiseau ne décrit pas le chemin réel.

## Votre projet, votre adresse

Vous cherchez à vous installer en famille ou à vous rapprocher du travail ? Avec futur•e, examinez l’adresse envisagée à partir de votre projet, pour éclairer votre choix de logement dans son ensemble.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE et portent sur les actifs occupés, y compris ceux qui travaillent à domicile. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels ; leurs résultats sont des estimations par sondage, sans marge d’erreur fournie par secteur. Les comparaisons selon le lieu de travail concernent des groupes distincts et ne sont pas croisées avec le secteur de résidence.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil au sein d’un secteur ; la proximité ne mesure pas l’usage des équipements. Les prix proviennent de prix-carburants.gouv.fr : pour chaque semaine, la médiane porte sur le dernier prix déclaré par chaque station participante.

## C. Correspondance interne — non publiée

Les désignations de carburant sont conservées telles qu’elles figurent dans le dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,68 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,41 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,40 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 140 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 340 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.94028.voiture`, `destination.75108.voiture` | oui |
| Pratiques — part de la voiture | 21 % | `iris.voiture.min` | oui |
| Pratiques — libellé du secteur | Saint-Maur Créteil 1 | `iris.voiture.min` | oui |
| Pratiques — part de la voiture | 50 % | `iris.voiture.max` | oui |
| Pratiques — libellé du secteur | La Pie 3 | `iris.voiture.max` | oui |
| Destination — travail à Créteil | 58 % | `destination.94028.voiture` | oui |
| Destination — travail à Paris | 13 % | `destination.75108.voiture` | oui |
| Destination — arrondissement nommé | Paris 8e Arrondissement | `destination.75108.voiture` | oui |
| Équipements — libellé du secteur | Saint-Maur Créteil 1 | `iris.940680801.panier_500m` | oui |
| Équipements — « toutes les adresses » | 100 %, exprimé en mots | `iris.940680801.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m | `iris.940680801.panier_500m`, `iris.940680703.panier_500m` | oui |
| Équipements — libellé du secteur | La Pie 3 | `iris.940680703.panier_500m` | oui |
| Équipements — proximité du panier complet | 90 % | `iris.940680703.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.940680801.panier_500m`, `iris.940680703.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Saint-Maur Créteil 1 et La Pie 3 | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

La carte doit porter le millésime des pratiques ; le tableau doit conserver les périodes de référence des hausses dans son contexte de lecture.

Vérifications concernant les faits utilisés :

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Secteurs :** relire les libellés « Saint-Maur Créteil 1 » et « La Pie 3 ». Le texte les emploie comme secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture relevé sur les faits retenus.