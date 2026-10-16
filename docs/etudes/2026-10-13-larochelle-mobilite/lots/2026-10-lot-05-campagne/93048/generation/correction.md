## A. Question et format

**Question principale :** à Montreuil, comment choisir une adresse pour moins utiliser la voiture, quand les pratiques domicile-travail diffèrent fortement entre secteurs pourtant bien pourvus en équipements proches ?

La réponse invite à examiner séparément le trajet de travail et les déplacements du quotidien. Elle s’appuie sur les contrastes entre secteurs (`iris.voiture.min`, `iris.voiture.max`), leur proximité des équipements (`iris.930480102.panier_500m`, `iris.930481105.panier_500m`) et les pratiques des actifs qui habitent et travaillent à Montreuil (`destination.93048.marche`).

**Format retenu : article court.** L’ouverture carburant est conservée. Le stationnement, la possession automobile, les actifs venant travailler à Montreuil et la comparaison intercommunale sont écartés pour garder le fil de la recherche d’adresse ; les données de bus ne sont pas utilisables.

## B. Article

# À Montreuil, quelle adresse choisir pour moins prendre la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de **0,62 €/L** dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Montreuil. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

Le scénario suivant chiffre le **surcoût annuel de carburant**, avec une consommation de **6 L/100 km**, **200 allers-retours domicile-travail par an** et une hausse retenue arrondie à **5 centimes**. Il ne correspond à aucun quartier ni à aucune destination de travail.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole : hausse retenue de +0,60 €/L | SP95-E10 : hausse retenue de +0,35 €/L |
|---|---:|---:|
| 5 km | environ 70 € par an | environ 40 € par an |
| 15 km | environ 220 € par an | environ 130 € par an |
| 35 km | environ 500 € par an | environ 290 € par an |

Reste à examiner les déplacements depuis le logement envisagé. À Montreuil, les pratiques de travail donnent des repères très différents selon le secteur.

## Le trajet de travail se regarde depuis l’adresse

Selon le recensement de **2022**, **19 % des actifs résidant à Montreuil** déclarent la voiture comme mode principal pour aller travailler ; **57 %** déclarent les transports en commun.

Cette vue communale recouvre des contrastes : la part de la voiture est de **6 %** parmi les actifs qui habitent le secteur statistique **Bas Montreuil Ouest 2**, contre **41 %** dans **Montreau Ruffins Clos Arachis 5**, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Ces observations donnent une raison d’affiner la recherche au-delà du nom de la commune. Pour chaque annonce retenue, examinez le trajet entre l’adresse exacte et votre lieu de travail, avec vos horaires.

La destination apporte un autre éclairage : parmi les actifs qui habitent **et** travaillent à Montreuil, **23 %** vont principalement à pied. Si votre emploi se trouve dans la commune, le parcours entre le logement et le travail mérite donc d’être regardé concrètement, plutôt que de s’en tenir à la mention « travailler à Montreuil ».

## Des équipements proches, des déplacements à examiner

Le trajet du matin ne règle pas la question des courses ou de l’école. Pour ces déplacements, les équipements proches de l’adresse apportent un repère complémentaire.

Dans le premier secteur cité, **toutes les adresses** disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de **500 m à vol d’oiseau**. Dans le second, c’est le cas de **97 % des adresses**. Ce panier d’équipements est proche dans les deux secteurs.

Pendant une visite, repérez les établissements qui vous seraient utiles et parcourez les chemins pour les rejoindre. La proximité mesurée prend alors un sens concret pour votre recherche, selon les déplacements que vous souhaitez effectuer à pied.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou organiser autrement la vie de famille ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner la place de la mobilité dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Elles concernent les actifs occupés ; le dénominateur communal inclut ceux qui travaillent à domicile. Les résultats sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés. Les groupes observés sont distincts ; leurs différences ne mesurent pas l’effet d’un déménagement.

Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** ; elle décrit des adresses et des distances à vol d’oiseau, sans mesurer les parcours réels ni l’usage des établissements.

Les prix proviennent de prix-carburants.gouv.fr : médiane du dernier prix déclaré par chaque station pendant la semaine. Les stations déclarantes peuvent varier entre les périodes.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture, période initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | oui |
| Ouverture, période finale | 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Ouverture, hausse du gazole | 0,62 €/L | `carburant.gazole.ecart` | oui |
| Ouverture, rayon autour du centre | 12 km à vol d’oiseau | `carburant.gazole.ecart` | oui |
| Hypothèses du scénario, consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses du scénario, déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses du scénario, arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèse commune de la section 7 | oui |
| Tableau, en-tête gazole | +0,60 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau, en-tête SP95-E10 | +0,35 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, premier surcoût gazole | environ 70 € par an | `scenario.carburant.gazole.5km` | oui |
| Tableau, premier surcoût SP95-E10 | environ 40 € par an | `scenario.carburant.e10.5km` | oui |
| Tableau, deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, deuxième surcoût gazole | environ 220 € par an | `scenario.carburant.gazole.15km` | oui |
| Tableau, deuxième surcoût SP95-E10 | environ 130 € par an | `scenario.carburant.e10.15km` | oui |
| Tableau, troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, troisième surcoût gazole | environ 500 € par an | `scenario.carburant.gazole.35km` | oui |
| Tableau, troisième surcoût SP95-E10 | environ 290 € par an | `scenario.carburant.e10.35km` | oui |
| Pratiques, millésime | 2022 | `mobpro.modes.voiture`, `mobpro.modes.tc` | oui |
| Pratiques, voiture dans la commune | 19 % | `mobpro.modes.voiture` | oui |
| Pratiques, transports en commun dans la commune | 57 % | `mobpro.modes.tc` | oui |
| Contraste entre secteurs, valeur basse | 6 % | `iris.voiture.min` | oui |
| Contraste entre secteurs, libellé | 2 dans « Bas Montreuil Ouest 2 » | `iris.voiture.min` | oui |
| Contraste entre secteurs, valeur haute | 41 % | `iris.voiture.max` | oui |
| Contraste entre secteurs, libellé | 5 dans « Montreau Ruffins Clos Arachis 5 » | `iris.voiture.max` | oui |
| Actifs habitant et travaillant à Montreuil, marche | 23 % | `destination.93048.marche` | oui |
| Équipements du premier secteur | toutes les adresses — valeur exacte : 100 % | `iris.930480102.panier_500m` | oui |
| Définition du panier d’équipements | moins de 500 m à vol d’oiseau | `iris.930480102.panier_500m`, `iris.930481105.panier_500m` | oui |
| Équipements du second secteur | 97 % | `iris.930481105.panier_500m` | oui |
| Méthode, millésime des équipements | 2025 | `iris.930480102.panier_500m`, `iris.930481105.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre les secteurs | Aucune pour la production : classes automatiques et repères numérotés accompagnés de leur liste. Libellés à poser à la main uniquement pour une version soignée. Faire figurer le millésime 2022 sur la carte. |

Vérifications concernant les faits utilisés :

- **Carburant :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, concernant également le scénario.
- **Secteurs :** relire les libellés « Bas Montreuil Ouest 2 » et « Montreau Ruffins Clos Arachis 5 ». Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur — bloquante : « 2 » associé à `iris.voiture.min`. Écartée : ce chiffre appartient au libellé « Bas Montreuil Ouest 2 », explicitement donné par ce fait et par la section 3 du dossier ; la valeur mesurée reste 6 %. | 2 dans « Bas Montreuil Ouest 2 » | Inchangé. |
| Valeur — bloquante : « 5 » associé à `iris.voiture.max`. Écartée : ce chiffre appartient au libellé « Montreau Ruffins Clos Arachis 5 », explicitement donné par ce fait et par la section 3 du dossier ; la valeur mesurée reste 41 %. | 5 dans « Montreau Ruffins Clos Arachis 5 » | Inchangé. |
| Raisonnement — à revoir : suppression en quelques mots de l’opposition suggérant un lien entre proximité des équipements et pratiques domicile-travail. | Ce panier d’équipements est donc proche dans les deux secteurs, malgré leurs pratiques domicile-travail différentes. | Ce panier d’équipements est proche dans les deux secteurs. |