## A. Question et format

**Question principale :** au Blanc-Mesnil, la proximité des services suffit-elle à repérer un secteur où l’on utilise moins la voiture ?

Les exemples retenus montrent que proximité des équipements et pratiques domicile-travail doivent être examinées séparément. Pour chercher un logement, cela invite à regarder les services autour de l’adresse et la liaison avec son propre lieu de travail.

Appuis : `iris.930070106.voiture`, `iris.930070109.voiture`, `iris.930070106.panier_500m`, `iris.930070109.panier_500m`, `destination.95527.voiture`, `destination.75108.voiture`.

**Format : article court**, avec l’ouverture carburant imposée par la série.

Pistes écartées : stationnement, possession automobile et actifs venant travailler dans la commune, qui disperseraient la question ; comparaison nationale, dont le résultat n’apporte pas d’éclairage supplémentaire à cet angle.

## B. Article

# Au Blanc-Mesnil, des services proches ne disent pas tout de la place de la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de **0,67 €/L pour le gazole** et de **0,40 €/L pour le SP95-E10**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre du Blanc-Mesnil. Pour un projet de déménagement, cette hausse donne une raison concrète d’examiner les déplacements associés au logement.

## Le surcoût selon la distance

Le scénario ci-dessous porte sur le carburant seul. Il suppose une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**, avec des hausses arrondies à **5 centimes** : **0,65 €/L pour le gazole** et **0,40 €/L pour le SP95-E10**.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel de carburant — scénario 2026*

| Distance du trajet aller | Gazole | SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 230 € | environ 140 € |
| 35 km | environ 550 € | environ 340 € |

Pour choisir une adresse au Blanc-Mesnil, reste à distinguer les déplacements que l’on souhaite changer : le trajet professionnel et les sorties de proximité ne se lisent pas avec les mêmes repères.

## Pour le travail, regarder le secteur et la destination

Les pratiques domicile-travail du recensement de **2022** varient selon le secteur de résidence. Parmi les actifs qui habitent le secteur statistique **« Iris 4 »**, **39 %** déclarent la voiture comme mode principal pour aller travailler, contre **53 %** dans **« Iris 6 »**, toutes destinations de travail confondues.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

À l’échelle de l’ensemble de la commune, la destination apporte un autre éclairage : la voiture est le mode principal de **69 %** des actifs résidents qui travaillent à **Roissy-en-France**, contre **27 %** de ceux qui travaillent à **Paris 8e Arrondissement**. Pour votre recherche, confrontez donc chaque adresse envisagée à votre lieu de travail et à vos horaires.

## Et pour les courses et l’école ?

Le logement sert aussi de point de départ aux déplacements en dehors du travail. Dans **« Iris 6 »**, **toutes les adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Cette proportion est de **95 %** dans **« Iris 4 »**.

Les services sont donc proches des adresses dans ces secteurs, alors que leurs pratiques professionnelles diffèrent. Lors d’une visite, repérez les établissements concernés et examinez les cheminements et les traversées depuis le logement : la proximité mesurée prend ainsi un sens concret pour votre recherche.

## Votre projet, votre adresse

Si vous déménagez pour moins organiser vos journées autour de la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet pour l’examiner dans son ensemble.

### Méthode et sources

Sources : INSEE, recensement et bases infracommunales ; Base adresse nationale et Base permanente des équipements ; prix-carburants.gouv.fr.

Les pratiques concernent les actifs occupés et leur mode principal domicile-travail. Les résultats sont des estimations par sondage ; les libellés des secteurs statistiques ne correspondent pas toujours aux noms usuels des quartiers. Les groupes de destination sont distincts : leurs écarts ne mesurent pas l’effet d’un changement de logement ou d’emploi. La proximité des équipements décrit les adresses, sans indiquer leur usage ni les chemins réellement parcourus. Les prix médians reposent sur le dernier prix déclaré par chaque station pendant la semaine ; les stations sans déclaration n’y entrent pas.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario sont rattachées aux identifiants des lignes de la section 7.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,67 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,40 €/L | `carburant.e10.ecart` | oui |
| Chapeau, périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L/100 km | `scenario.carburant.gazole.5km` | oui |
| Hypothèses, déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses, hausse du gazole | 0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses, hausse du SP95-E10 | 0,40 €/L | `scenario.carburant.e10.5km` | oui |
| Titre du tableau, année du scénario | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, surcoût gazole | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, surcoût SP95-E10 | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, surcoût gazole | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, surcoût SP95-E10 | environ 140 € | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, surcoût gazole | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, surcoût SP95-E10 | environ 340 € | `scenario.carburant.e10.35km` | oui |
| Pratiques, millésime | 2022 | `iris.930070106.voiture`, `iris.930070109.voiture`, `destination.95527.voiture`, `destination.75108.voiture` | oui |
| Pratiques, libellé du secteur | Iris 4 | `iris.930070106.voiture` | oui |
| Pratiques, part de la voiture | 39 % | `iris.930070106.voiture` | oui |
| Pratiques, part de la voiture | 53 % | `iris.930070109.voiture` | oui |
| Pratiques, libellé du secteur | Iris 6 | `iris.930070109.voiture` | oui |
| Destination Roissy-en-France | 69 % | `destination.95527.voiture` | oui |
| Destination Paris | 27 % | `destination.75108.voiture` | oui |
| Destination, libellé de l’arrondissement | Paris 8e Arrondissement | `destination.75108.voiture` | oui |
| Équipements, libellé du secteur | Iris 6 | `iris.930070109.panier_500m` | oui |
| Équipements, proportion d’adresses | toutes les adresses — 100 % | `iris.930070109.panier_500m` | oui |
| Équipements, distance du panier complet | 500 m | `iris.930070109.panier_500m`, `iris.930070106.panier_500m` | oui |
| Équipements, proportion d’adresses | 95 % | `iris.930070106.panier_500m` | oui |
| Équipements, libellé du secteur | Iris 4 | `iris.930070106.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune. Contenu présenté dans B. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison des pratiques par secteur | Aucune pour la production : classes automatiques et repérage des secteurs cités. Libellés manuels seulement pour une version soignée. Faire figurer le millésime 2022. |

Vérifications concernant les faits utilisés :

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, non bloquante pour la rédaction.
- **Libellés des secteurs :** relire « Iris 4 » et « Iris 6 ». Le texte les présente comme des secteurs statistiques, sans leur attribuer de nom de quartier d’usage.