## A. Question et format

**Question principale :** à Champigny-sur-Marne, une faible utilisation de la voiture pour travailler suffit-elle à repérer un secteur où chercher un logement pour un quotidien moins motorisé ?

Les secteurs de Mordacs 1 et de Cœuilly 4 apportent une réponse utile : la faible part de la voiture pour le travail et la proximité des équipements quotidiens ne vont pas systématiquement ensemble. Pour chercher un logement, il faut examiner ces deux dimensions. Appuis : `iris.940171101.voiture`, `iris.940171304.voiture`, `iris.940171101.panier_500m`, `iris.940171304.panier_500m`.

**Format retenu :** article court, avec l’ouverture carburant et son scénario pré-calculé.

**Pistes écartées :** les destinations de travail, la motorisation et le stationnement élargiraient le sujet ; le repère intercommunal, proche de la valeur locale, n’éclaire pas le choix du secteur.

## B. Article

# Champigny-sur-Marne : la place de la voiture selon les secteurs, et ce qu’il y a autour des adresses

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,68 €/L et celui du SP95-E10 de 0,42 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Champigny-sur-Marne. Pour qui cherche un logement, cette hausse donne une raison concrète d’examiner la place des déplacements en voiture.

Le scénario suivant chiffre le **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses retenues, arrondies à 5 centimes, sont de +0,70 €/L pour le gazole et de +0,40 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole : surcoût annuel | SP95-E10 : surcoût annuel |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 250 € | environ 140 € |
| 35 km | environ 590 € | environ 340 € |

À Champigny-sur-Marne, les pratiques domicile-travail et la proximité des besoins quotidiens donnent des repères différents pour choisir où chercher.

## Des pratiques différentes selon le secteur

D’après le recensement de 2022, la voiture est le mode principal pour aller travailler de **15 % des actifs qui habitent Mordacs 1**, contre **53 % de ceux qui habitent Cœuilly 4**. Ces parts concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

Lorsqu’une annonce vous intéresse, situer le logement dans son secteur permet de replacer l’adresse dans ce paysage de pratiques. Votre propre destination de travail reste ensuite à examiner.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Courses et école : une autre lecture de l’adresse

Le trajet professionnel ne couvre pas les courses ou l’accompagnement à l’école. Pour envisager un quotidien moins motorisé, regardez aussi ce qui se trouve autour du logement.

Le « panier quotidien » réunit un commerce alimentaire, une pharmacie et une école élémentaire, chacun à moins de **500 m à vol d’oiseau**. À Mordacs 1, **63 % des adresses** réunissent ce panier. À Cœuilly 4, c’est **la quasi-totalité des adresses**, alors que la voiture y est davantage déclarée pour travailler.

La proximité de ces équipements coexiste donc avec des pratiques domicile-travail différentes. Une annonce située dans un secteur où la voiture est peu utilisée mérite autant cet examen de proximité qu’une autre.

[VISUEL : Tableau accessible des secteurs (HTML et Markdown)]

Pendant une visite, parcourez les accès aux équipements qui vous intéressent : la distance à vol d’oiseau ne décrit pas le chemin à emprunter. À Cœuilly comme aux Mordacs, confrontez aussi le logement au trajet vers votre propre lieu de travail.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Explorez avec futur•e l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix de logement.

## Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE ; les parts par secteur sont des estimations par sondage. Les secteurs cités sont des IRIS statistiques, dont les libellés ne correspondent pas toujours aux quartiers d’usage. Leurs écarts décrivent des pratiques de groupes distincts, sans mesurer l’effet du lieu de résidence.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Les parts présentées portent sur les adresses de chaque secteur, sans renseigner l’usage des équipements.

Les prix proviennent de prix-carburants.gouv.fr, à partir du dernier prix déclaré par chaque station dans la semaine ; les stations déclarantes peuvent varier entre les périodes. Le scénario de surcoût est illustratif et n’est attribué à aucun secteur.

## C. Correspondance interne — non publiée

Les désignations « SP95-E10 » et les numéros des secteurs sont des libellés, également référencés ci-dessous.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau | 0,68 €/L | `carburant.gazole.ecart` | oui |
| Chapeau | 0,42 €/L | `carburant.e10.ecart` | oui |
| Chapeau | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` — périmètre | oui |
| Chapeau, hypothèses et tableau | SP95-E10 — désignation du carburant | `carburant.e10.ecart`, `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Hypothèses | 6 L/100 km | `scenario.carburant.*` — hypothèses de la section 7 | oui |
| Hypothèses | 200 allers-retours par an | `scenario.carburant.*` — hypothèses de la section 7 | oui |
| Hypothèses | arrondies à 5 centimes | `scenario.carburant.*` — hypothèses de la section 7 | oui |
| Hypothèses | +0,70 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Hypothèses | +0,40 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10 | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10 | environ 140 € | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10 | environ 340 € | `scenario.carburant.e10.35km` | oui |
| Pratiques par secteur | recensement de 2022 | `iris.940171101.voiture`, `iris.940171304.voiture` — millésime | oui |
| Pratiques par secteur | 15 % | `iris.940171101.voiture` | oui |
| Pratiques par secteur | Mordacs 1 — libellé | `iris.940171101.voiture` | oui |
| Pratiques par secteur | 53 % | `iris.940171304.voiture` | oui |
| Pratiques par secteur | Cœuilly 4 — libellé | `iris.940171304.voiture` | oui |
| Panier quotidien | moins de 500 m à vol d’oiseau | `iris.940171101.panier_500m`, `iris.940171304.panier_500m` — définition | oui |
| Panier quotidien | Mordacs 1 — libellé | `iris.940171101.panier_500m` | oui |
| Panier quotidien | 63 % | `iris.940171101.panier_500m` | oui |
| Panier quotidien | Cœuilly 4 — libellé | `iris.940171304.panier_500m` | oui |
| Panier quotidien | « la quasi-totalité » — valeur du dossier : 99,5 % | `iris.940171304.panier_500m` | oui |
| Méthode | BPE, millésime 2025 | `iris.940171101.panier_500m`, `iris.940171304.panier_500m` — source des équipements | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le passage sur les pratiques domicile-travail | Aucune pour la production ; repérer les secteurs cités. Libellés à poser manuellement seulement pour une version soignée |
| Tableau accessible des secteurs (HTML et Markdown) | Après le passage sur la proximité des équipements | Aucune ; produit avec la carte |

**Vérifications avant publication :**

- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, concernant les hausses et le scénario utilisés.
- `iris.ecart_voiture` : relire les libellés des secteurs cités. Le texte les présente comme des secteurs statistiques ; vérifier notamment les désignations « Mordacs 1 » et « Cœuilly 4 ».

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : le titre suggère qu’un choix de secteur permettrait de moins utiliser la voiture, effet non mesuré par le dossier. | Champigny-sur-Marne : quels secteurs regarder pour utiliser moins la voiture ? | Champigny-sur-Marne : la place de la voiture selon les secteurs, et ce qu’il y a autour des adresses |