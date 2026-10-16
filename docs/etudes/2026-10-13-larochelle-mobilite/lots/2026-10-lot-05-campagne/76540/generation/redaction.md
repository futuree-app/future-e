## A. Question et format

**Question principale :** comment choisir une adresse à Rouen pour moins utiliser la voiture, en regardant à la fois le lieu de travail et la proximité des équipements du quotidien ?

Les pratiques domicile-travail diffèrent fortement entre secteurs (`iris.voiture.min`, `iris.voiture.max`). Mais la proximité des équipements ne suffit pas à les décrire : à Saint-Clément Pépinières, toutes les adresses réunissent le panier quotidien à proximité, tandis que la voiture demeure le mode principal de nombreux actifs (`iris.765401004.panier_500m`, `iris.765401004.voiture`). Les pratiques selon la commune de travail apportent un repère complémentaire (`mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`).

**Format retenu :** article complet resserré, avec le tableau carburant et une carte des secteurs.

**Pistes écartées :** comparaison nationale, stationnement, possession automobile et actifs venant travailler à Rouen : elles disperseraient la question retenue.

## B. Article

# Moins prendre la voiture à Rouen : regarder le secteur et le lieu de travail

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,74 €/L autour de Rouen, et celui du SP95-E10 de 0,50 €/L. La mesure porte sur les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Rouen. Pour qui cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements à faire en voiture.

Le scénario ci-dessous retient une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et des hausses arrondies à 5 centimes. Il chiffre le surcoût annuel de carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole, hausse retenue de 0,75 €/L | SP95-E10, hausse retenue de 0,50 €/L |
|---|---:|---:|
| 5 km | environ 90 € par an | environ 60 € par an |
| 15 km | environ 270 € par an | environ 180 € par an |
| 35 km | environ 630 € par an | environ 420 € par an |

Pour passer de ce scénario à une recherche de logement à Rouen, il faut regarder les pratiques locales. Dans quels secteurs la voiture est-elle moins utilisée pour travailler ? Et comment ces observations s’articulent-elles avec votre propre destination ?

## Des pratiques très différentes selon le secteur

Dans les données du recensement de 2022, la voiture est le mode principal pour aller travailler de 20 % des actifs du secteur Vieux Marché Palais de Justice, contre 67 % dans Grieu Vallon Suisse. Ces parts portent sur les actifs qui habitent chacun de ces secteurs, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Lors du tri des annonces, cet écart justifie de préciser la localisation au-delà de la seule mention « Rouen ». La carte permet de situer les pratiques observées autour des logements que vous repérez ; votre trajet vers le travail demande ensuite son propre examen.

Parmi les actifs qui habitent et travaillent à Rouen, 27 % utilisent principalement la voiture pour travailler. Parmi ceux qui habitent Rouen et travaillent à Sotteville-lès-Rouen, Saint-Étienne-du-Rouvray, Le Grand-Quevilly, Le Petit-Quevilly, Mont-Saint-Aignan et Elbeuf, cette part est de 59 %.

Ce contraste invite à examiner le trajet depuis chaque logement envisagé jusqu’à votre lieu de travail, même lorsque les annonces se trouvent dans un secteur où la voiture est peu utilisée.

## Des équipements proches, y compris là où la voiture est fréquente

Le trajet du travail ne couvre pas les courses, la pharmacie ou l’école. Pour ces déplacements, la proximité des équipements apporte un autre repère à examiner pendant les recherches et les visites.

Dans les secteurs Vieux Marché Palais de Justice et Saint-Clément Pépinières, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Saint-Clément Pépinières, la voiture est pourtant le mode principal pour aller travailler de 62 % des actifs qui y habitent.

Proximité des équipements et usage fréquent de la voiture pour travailler coexistent donc dans ce secteur. Pour une recherche de logement, cela conduit à examiner séparément les déplacements du quotidien et celui vers l’emploi.

## Passer des repères à la visite

Pour départager des adresses dans ces secteurs, parcourez les chemins vers les équipements qui vous seraient utiles. Regardez les traversées, les accès et l’entrée de l’établissement : c’est ce parcours que vous auriez à emprunter.

Pour une option en transports en commun vers votre travail, renseignez-vous auprès du réseau [Astuce](https://www.myastuce.fr), en précisant votre destination, vos jours et vos horaires, à l’aller comme au retour. Cette vérification porte sur votre organisation concrète, depuis le logement que vous envisagez.

## Votre projet, votre adresse

Si votre déménagement vise à laisser plus souvent la voiture garée, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour l’examiner dans son ensemble avant de vous décider.

## Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Les comparaisons selon la destination portent sur des groupes distincts de personnes ; elles ne mesurent pas l’effet d’un déménagement. Les données sont des estimations par sondage. Les IRIS sont des secteurs statistiques dont les libellés peuvent différer des noms de quartiers d’usage.

Les proximités reposent sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Les points d’équipement correspondent aux adresses des établissements.

Les prix proviennent de prix-carburants.gouv.fr : médiane des derniers prix déclarés par les stations dans chaque semaine. Une station sans déclaration dans la semaine n’entre pas dans la mesure. Le lien vers Astuce est celui du site officiel indiqué dans les données du réseau publiées sur transport.data.gouv.fr.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Chapeau, rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, distance de référence de la consommation | 100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, allers-retours annuels | 200 | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Tableau, hausse retenue du gazole | 0,75 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau, hausse retenue du SP95-E10 | 0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, surcoût gazole | environ 90 € par an | `scenario.carburant.gazole.5km` | oui |
| Tableau, surcoût SP95-E10 | environ 60 € par an | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, surcoût gazole | environ 270 € par an | `scenario.carburant.gazole.15km` | oui |
| Tableau, surcoût SP95-E10 | environ 180 € par an | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, surcoût gazole | environ 630 € par an | `scenario.carburant.gazole.35km` | oui |
| Tableau, surcoût SP95-E10 | environ 420 € par an | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime du recensement | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Vieux Marché Palais de Justice, voiture | 20 % | `iris.voiture.min` | oui |
| Grieu Vallon Suisse, voiture | 67 % | `iris.voiture.max` | oui |
| Actifs habitant et travaillant à Rouen, voiture | 27 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Actifs rouennais travaillant dans le groupe nommé, voiture | 59 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements, « toutes les adresses » à Vieux Marché Palais de Justice | 100 % exprimé en mots | `iris.765400102.panier_500m` | oui |
| Équipements, « toutes les adresses » à Saint-Clément Pépinières | 100 % exprimé en mots | `iris.765401004.panier_500m` | oui |
| Équipements, seuil de proximité | 500 m | `iris.765400102.panier_500m`, `iris.765401004.panier_500m` | oui |
| Saint-Clément Pépinières, voiture | 62 % | `iris.765401004.voiture` | oui |
| Méthode, millésime des équipements | 2025 | `acces.76540.panier_quotidien_500m` — source BPE commune aux indicateurs de proximité | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Vieux Marché Palais de Justice et Grieu Vallon Suisse | Aucune pour la production automatique. Repérer les secteurs cités, dont Saint-Clément Pépinières, avec leur liste ; libellés manuels seulement pour une version soignée. Faire figurer le millésime des pratiques. |

Vérifications avant publication concernant les faits utilisés :

- **Carburant et scénario** — `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Secteurs cités** — `iris.ecart_voiture` : relire les libellés Vieux Marché Palais de Justice, Grieu Vallon Suisse et Saint-Clément Pépinières. Le texte les présente comme des secteurs statistiques.
- **Groupe de communes de travail** — `mobpro.voiture_selon_destination` : relire l’intérêt du choix de Sotteville-lès-Rouen, Saint-Étienne-du-Rouvray, Le Grand-Quevilly, Le Petit-Quevilly, Mont-Saint-Aignan et Elbeuf. La composition exacte est donnée dans l’article ; cette relecture est non bloquante pour la rédaction.