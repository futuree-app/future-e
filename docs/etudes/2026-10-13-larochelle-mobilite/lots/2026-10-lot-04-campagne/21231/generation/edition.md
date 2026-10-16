## A. Question et format

**Question principale :** à Dijon, que regarder au-delà de la proximité des équipements pour choisir un logement en utilisant moins la voiture ?

Le dossier permet de distinguer le lieu de travail, les pratiques des actifs par secteur et la proximité des courses ou de l’école. Le secteur François Pompon apporte un éclairage utile : le panier quotidien est proche de toutes les adresses, tandis que la voiture reste le mode principal de nombreux actifs pour travailler.

**Appuis :** `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`, `iris.voiture.min`, `iris.voiture.max`, `iris.212310201.panier_500m`, `iris.212311101.panier_500m`, `iris.212311501.panier_500m`, `iris.212311501.voiture`.

**Format :** article complet resserré, avec deux visuels. L’ouverture utilise les faits carburant et le scénario autorisés.

**Pistes écartées :** stationnement, statut d’occupation, possession automobile et actifs venant travailler à Dijon disperseraient la question ; la comparaison avec les villes de taille proche apporte peu à ce choix d’adresse.

## B. Article

# À Dijon, les courses à proximité ne disent pas tout de la place de la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,75 €/L et celui du SP95-E10 de 0,52 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Dijon. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

Le scénario suivant chiffre le surcoût annuel de carburant selon la distance du trajet de travail. Il repose sur une consommation de 6 L/100 km et sur 200 allers-retours par an, avec les hausses retenues arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

À Dijon, la question se précise lorsqu’on regarde où travaillent les actifs et dans quel secteur ils habitent. Les annonces donnent une adresse ; pour envisager de moins prendre la voiture, il faut aussi la mettre en regard de ses destinations habituelles.

## Le lieu de travail fait partie du choix du logement

D’après le recensement de 2022, 71 % des actifs qui habitent Dijon travaillent dans la commune même. Parmi ces actifs qui habitent et travaillent à Dijon, 44 % déclarent la voiture comme mode principal pour aller travailler.

Cette part est de 72 % parmi les actifs dijonnais qui travaillent à Chenôve, Talant, Chevigny-Saint-Sauveur, Quetigny, Fontaine-lès-Dijon ou Longvic. Pour une personne qui cherche un logement à Dijon et travaille dans l’une de ces communes, le trajet précis reste à examiner.

À l’intérieur de Dijon, les pratiques varient aussi selon le secteur de résidence. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la voiture est le mode principal pour travailler de 25 % à Grangier et de 75 % à La Montagne.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer une annonce dans ces pratiques locales. Lors d’une visite, elle invite à poser une question concrète : comment relier cette adresse à son propre lieu de travail ?

## Des courses proches, mais un trajet de travail à examiner séparément

Le trajet professionnel ne couvre pas toute la semaine. Pour un logement où l’on souhaite utiliser moins la voiture, les courses et les déplacements liés à l’école méritent aussi leur place dans la recherche.

À Grangier, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À La Montagne, 18 % des adresses réunissent ce panier de proximité.

Le secteur François Pompon apporte un autre cas de figure : toutes ses adresses réunissent également ce panier, tandis que 65 % des actifs qui y habitent vont travailler principalement en voiture. La présence d’équipements proches et les pratiques domicile-travail se regardent donc séparément.

Dans ce secteur, la proximité de ce panier constitue un élément concret. Reste à repérer les établissements qui correspondent à vos besoins et à parcourir les chemins depuis l’adresse envisagée : la distance à vol d’oiseau ne décrit pas le chemin à suivre.

## Partir de vos destinations pendant les visites

Si votre recherche porte sur Grangier ou La Montagne, utilisez les différences observées pour préparer la visite : situez le logement, vos destinations de travail et les équipements qui vous seraient utiles. Pour François Pompon, le panier de proximité est largement présent ; l’examen du déplacement professionnel garde tout son intérêt.

Si vous envisagez les transports en commun, vérifiez le trajet et les horaires nécessaires auprès de DiviaMobilités, le réseau urbain de Dijon Métropole. Faites cette vérification pour vos déplacements habituels, en tenant compte de l’heure à laquelle vous devez arriver et repartir.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui pèsera dans votre quotidien et dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, fichier MOBPRO et bases infracommunales. Ce sont des estimations par sondage ; les groupes selon le lieu de travail sont distincts et les résultats ne mesurent pas l’effet d’un déménagement. Les six communes sont les plus peuplées de la même unité urbaine, hors Dijon. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels.

La proximité des équipements repose sur les adresses de la BAN et la BPE 2025 de l’INSEE. Elle décrit une présence à proximité, sans mesurer l’usage. Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; une station sans déclaration dans la semaine n’entre pas dans la médiane. Le nom du réseau est documenté par transport.data.gouv.fr.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | Semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | Semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,75 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,52 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | Rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses du scénario — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Tableau — hausse retenue, gazole | 0,75 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue, SP95-E10 | 0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première distance | Environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première distance | Environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième distance | Environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième distance | Environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième distance | Environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième distance | Environ 420 € | `scenario.carburant.e10.35km` | oui |
| Lieu de travail — millésime des pratiques | 2022 | `mobpro.travaille_dans_commune` | oui |
| Lieu de travail — actifs travaillant à Dijon | 71 % | `mobpro.travaille_dans_commune` | oui |
| Lieu de travail — voiture parmi les actifs habitant et travaillant à Dijon | 44 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail — voiture parmi les actifs travaillant dans le groupe nommé | 72 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Secteurs — voiture à Grangier | 25 % | `iris.voiture.min` | oui |
| Secteurs — voiture à La Montagne | 75 % | `iris.voiture.max` | oui |
| Équipements — panier à Grangier | Toutes les adresses, soit 100 % | `iris.212310201.panier_500m` | oui |
| Équipements — définition du panier | Moins de 500 m à vol d’oiseau | `iris.212310201.panier_500m`, `iris.212311101.panier_500m`, `iris.212311501.panier_500m` | oui |
| Équipements — panier à La Montagne | 18 % | `iris.212311101.panier_500m` | oui |
| Équipements — panier à François Pompon | Toutes les adresses, soit 100 % | `iris.212311501.panier_500m` | oui |
| Équipements — voiture à François Pompon | 65 % | `iris.212311501.voiture` | oui |
| Méthode — sélection du groupe de communes | Les six communes les plus peuplées de la même unité urbaine, hors Dijon | `mobpro.voiture_selon_destination.communes_voisines` — périmètre et origine de la liste, section 1 | oui |
| Méthode — millésime des équipements | BPE 2025 | `acces.21231.panier_quotidien_500m` — source commune aux mesures de proximité | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de la voiture à Grangier et à La Montagne | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Le tableau conserve les périodes et hypothèses du scénario ; la carte doit porter le millésime des pratiques.

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du choix de Chenôve, Talant, Chevigny-Saint-Sauveur, Quetigny, Fontaine-lès-Dijon et Longvic. La liste est reprise intégralement dans l’article.
- **`iris.ecart_voiture`** : relire les libellés Grangier, La Montagne et François Pompon. Le texte les présente comme des secteurs statistiques.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : déduction non étayée sur la localisation du logement | Pour une personne qui cherche un logement à Dijon et travaille dans l’une de ces communes, la seule localisation du logement dans Dijon renseigne donc peu sur les possibilités de laisser la voiture au repos : le trajet précis reste à examiner. | Pour une personne qui cherche un logement à Dijon et travaille dans l’une de ces communes, le trajet précis reste à examiner. |
| Méthode — à revoir : règle de sélection du groupe absente | Aucune précision sur la sélection dans « Méthode et sources ». | Les six communes sont les plus peuplées de la même unité urbaine, hors Dijon. |
| Raisonnement — à revoir : critère présenté comme permettant de comparer les logements du secteur | Pour comparer des logements dans ce secteur, la proximité de ce panier constitue un élément concret. | Dans ce secteur, la proximité de ce panier constitue un élément concret. |
| Lisibilité — à revoir : précaution de méthode dans le récit | Il n’est attribué à aucun secteur ni à aucune destination de travail. | Phrase supprimée. |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
