## A. Question et format

**Question principale :** à Colmar, comment articuler proximité des services et trajet au travail lorsqu’on cherche un logement pour moins utiliser la voiture ?

Centre Centre et Europe Centre présentent des pratiques domicile-travail très différentes, alors que le panier d’équipements est proche de presque toutes leurs adresses. Pour une recherche de logement, ce rapprochement invite à examiner séparément les déplacements quotidiens et la destination de travail.

Appuis : `iris.680660104.voiture`, `iris.680660804.voiture`, `iris.680660104.panier_500m`, `iris.680660804.panier_500m`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`.

**Format : article court.** L’ouverture conserve la hausse datée du carburant et son scénario. Motorisation, stationnement, flux entrants et comparaison nationale sont écartés : ils disperseraient cette question.

## B. Article

# Colmar : services proches, trajets au travail contrastés

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,80 €/L, celui du SP95-E10 de 0,55 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Colmar. Pour qui cherche un logement, cette hausse remet les déplacements réguliers dans la discussion.

Le tableau donne un **surcoût de carburant annuel**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses retenues sont arrondies à 5 centimes.

**Surcoût annuel de carburant — hausse entre octobre 2025 et octobre 2026**

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Gazole | SP95-E10 |
|---|---:|---:|
| 5 km | environ 100 € | environ 70 € |
| 15 km | environ 290 € | environ 200 € |
| 35 km | environ 670 € | environ 460 € |

À Colmar, la recherche peut alors se préciser : que regarder dans une annonce pour envisager de moins prendre la voiture ?

## Le secteur et la destination de travail à examiner ensemble

Les pratiques domicile-travail décrites ici sont celles du recensement de 2022. Dans le secteur statistique Centre Centre, 45 % des actifs occupés déclarent la voiture comme mode principal pour aller travailler, contre 81 % dans Europe Centre. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte aide à situer les logements repérés dans ces pratiques locales. Pour apprécier votre propre trajet, il faut aussi regarder où vous travaillez.

Parmi les actifs qui habitent et travaillent à Colmar, 53 % utilisent principalement la voiture. Cette part atteint 83 % parmi les actifs résidant à Colmar qui travaillent à Wintzenheim, Horbourg-Wihr, Ingersheim, Turckheim, Houssen ou Wettolsheim. Si votre emploi se trouve dans l’une de ces communes, examinez les possibilités de déplacement jusqu’à cette destination dès la sélection des annonces.

## Courses et école : regarder aussi autour du logement

Le trajet au travail laisse entière la question des courses, de la pharmacie ou de l’école. Le dossier mesure leur proximité par un panier réunissant un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

À Centre Centre, la quasi-totalité des adresses dispose de ce panier à proximité ; dans Europe Centre, c’est le cas de 98 % des adresses. La présence de ces équipements s’observe donc dans les deux secteurs, malgré leurs pratiques domicile-travail très différentes.

Pendant une visite, repérez les équipements qui vous concernent et parcourez les cheminements depuis le logement. Pour le travail, confrontez les options envisagées à votre destination et à vos horaires. Si vous envisagez le bus, consultez le [site du réseau TRACE](https://www.trace-colmar.fr) pour vérifier votre trajet et ses horaires.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille. Avec futur•e, examinez l’adresse envisagée à partir de ce projet et de vos priorités.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE. Ce sont des estimations par sondage ; les groupes de destination rassemblent des personnes différentes et leur comparaison ne mesure pas l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartier usuels.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE. Elle décrit des adresses, sans renseigner l’usage des équipements ni les cheminements réels. Les prix proviennent du flux officiel prix-carburants.gouv.fr : chaque médiane retient le dernier prix déclaré par chaque station dans la semaine considérée. Le renvoi vers TRACE repose sur le site officiel du réseau.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,80 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,55 €/L | `carburant.e10.ecart` | oui |
| Chapeau, périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses du scénario, consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses du scénario, déplacements | 200 allers-retours par an | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses du scénario, arrondi | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Intitulé du tableau, début de période | octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Intitulé du tableau, fin de période | octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole | environ 100 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10 | environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole | environ 290 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10 | environ 200 € | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole | environ 670 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10 | environ 460 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime | 2022 | `iris.680660104.voiture`, `iris.680660804.voiture`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Centre Centre, voiture comme mode principal | 45 % | `iris.680660104.voiture` | oui |
| Europe Centre, voiture comme mode principal | 81 % | `iris.680660804.voiture` | oui |
| Actifs habitant et travaillant à Colmar | 53 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Actifs colmariens travaillant dans le groupe nommé | 83 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Définition du panier d’équipements | moins de 500 m à vol d’oiseau | `iris.680660104.panier_500m`, `iris.680660804.panier_500m` | oui |
| Centre Centre, proximité du panier | « la quasi-totalité » — valeur fournie : 99,8 % | `iris.680660104.panier_500m` | oui |
| Europe Centre, proximité du panier | 98 % | `iris.680660804.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Ouverture, après les hypothèses | Aucune. Conserver la période affichée et les mentions « environ ». |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de Centre Centre et Europe Centre | Aucune pour la production : classes automatiques et repères des secteurs cités. Libellés posés à la main seulement pour une version soignée. Faire figurer le millésime 2022. |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du groupe constitué de Wintzenheim, Horbourg-Wihr, Ingersheim, Turckheim, Houssen et Wettolsheim. La liste est explicitement donnée dans l’article.
- **`iris.ecart_voiture`** : relire les libellés Centre Centre et Europe Centre. Le texte les présente comme des secteurs statistiques.