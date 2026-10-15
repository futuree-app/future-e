## A. Question et format

**Question principale :** que regarder au-delà de la proximité des commerces et de l’école pour chercher un logement à Aulnay-sous-Bois en utilisant moins la voiture ?

Parc 1 et Bourg 1 associent une forte proximité des équipements à des pratiques domicile-travail différentes. Le contraste entre les destinations de travail invite aussi à examiner la liaison avec son emploi précis. Ces observations donnent au lecteur des critères pour préparer ses visites.

Appuis : `iris.930050401.voiture`, `iris.930050601.voiture`, `iris.930050401.panier_500m`, `iris.930050601.panier_500m`, `destination.95527.voiture`, `destination.75108.voiture`.

**Format retenu : article court**, centré sur ces observations. Le repère national, le stationnement, la motorisation et les flux entrants sont écartés : ils disperseraient la question.

## B. Article

# À Aulnay-sous-Bois, les services proches ne disent pas tout de la place de la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,68 €/L et celui du SP95-E10 de 0,40 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Aulnay-sous-Bois. Pour chercher un logement en utilisant moins la voiture, les trajets du travail et la proximité des services méritent chacun leur examen.

## Ce que la hausse représente selon la distance

Le scénario retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,70 €/L pour le gazole et +0,40 €/L pour le SP95-E10. Il chiffre uniquement le surcoût annuel de carburant.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel selon le trajet aller — évolution des prix entre les semaines du 6 octobre 2025 et du 5 octobre 2026.*

| Trajet aller | Gazole | SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 250 € | environ 140 € |
| 35 km | environ 590 € | environ 340 € |

Ce surcoût donne une raison de regarder les déplacements avant de retenir une annonce. À Aulnay-sous-Bois, que faut-il examiner au-delà de la proximité des commerces et de l’école ?

## Le secteur et le lieu de travail se regardent séparément

Les pratiques décrites sont celles du recensement de 2022. Dans le secteur Parc 1, la voiture est le mode principal pour aller travailler de 33 % des actifs occupés ; dans le secteur Bourg 1, cette part atteint 58 %. Ces chiffres concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui résident à Aulnay-sous-Bois et travaillent à Roissy-en-France, 69 % utilisent principalement la voiture. Parmi ceux qui travaillent à Paris 8e Arrondissement, cette part est de 22 %. Une recherche de logement gagne donc à examiner la liaison avec le lieu de travail précis.

## Pour les courses et l’école, revenir à l’adresse

Le trajet professionnel ne couvre pas les déplacements d’une famille. Pour les courses ou l’accompagnement des enfants, regardons ce qui se trouve autour du logement.

À Parc 1, 93 % des adresses disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. À Bourg 1, cette part atteint 98 %. Dans ce dernier secteur, la proximité de ces équipements coexiste donc avec un usage majoritaire de la voiture pour aller travailler.

Lors d’une visite, repérez le chemin réel vers ces équipements. Préparez séparément le déplacement jusqu’à votre lieu de travail, en tenant compte de vos horaires : la présence des services autour du logement ne répond pas à cette question.

## Votre projet, votre adresse

S’installer en famille ou se rapprocher du travail donne des priorités différentes à une recherche de logement. Avec futur•e, explorez l’adresse envisagée à partir de votre projet et de la place que vous souhaitez laisser à la voiture.

## Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, du fichier Mobilités professionnelles et des bases infracommunales Activité des résidents. Elles portent sur les actifs occupés de 15 ans ou plus, y compris ceux qui travaillent à domicile. Les secteurs sont les IRIS statistiques, dont les libellés peuvent différer des quartiers d’usage. Ces estimations sont issues de sondages ; les groupes de destination sont distincts et ne sont pas croisés avec les secteurs de résidence.

La proximité est établie à partir de la Base adresse nationale et de la BPE 2025 de l’INSEE. Chaque adresse compte autant au sein du secteur. Les distances ne décrivent ni le chemin réel ni l’usage des équipements.

Les prix proviennent de prix-carburants.gouv.fr : il s’agit de médianes entre stations, calculées sur leur dernier prix déclaré dans chaque semaine.

## C. Correspondance interne — non publiée

Les désignations contenant des chiffres sont également répertoriées.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,68 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,40 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Désignation du carburant, dans le chapeau, les hypothèses et le tableau | SP95-E10 | `carburant.e10.ecart`, `scenario.carburant.e10.5km` | oui |
| Scénario — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Scénario — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Scénario — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Scénario — hausse retenue, gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Scénario — hausse retenue, SP95-E10 | +0,40 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 140 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 340 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.930050401.voiture`, `iris.930050601.voiture`, `destination.95527.voiture`, `destination.75108.voiture` | oui |
| Libellé de secteur, dans les pratiques et la proximité | Parc 1 | `iris.930050401.voiture`, `iris.930050401.panier_500m` | oui |
| Pratiques — voiture à Parc 1 | 33 % | `iris.930050401.voiture` | oui |
| Libellé de secteur, dans les pratiques et la proximité | Bourg 1 | `iris.930050601.voiture`, `iris.930050601.panier_500m` | oui |
| Pratiques — voiture à Bourg 1 | 58 % | `iris.930050601.voiture` | oui |
| Destination — voiture vers Roissy-en-France | 69 % | `destination.95527.voiture` | oui |
| Libellé de destination | Paris 8e Arrondissement | `destination.75108.voiture` | oui |
| Destination — voiture vers Paris 8e Arrondissement | 22 % | `destination.75108.voiture` | oui |
| Proximité — adresses de Parc 1 | 93 % | `iris.930050401.panier_500m` | oui |
| Proximité — seuil commun aux équipements | 500 m | `iris.930050401.panier_500m`, `iris.930050601.panier_500m` | oui |
| Proximité — adresses de Bourg 1 | 98 % | `iris.930050601.panier_500m` | oui |
| Méthode — âge des actifs | 15 ans ou plus | `iris.930050401.voiture`, `destination.95527.voiture` — populations définies dans le dossier | oui |
| Méthode — millésime des équipements | 2025 | `iris.930050401.panier_500m`, `iris.930050601.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses ; contenu reproduit dans B | Aucune. Conserver la période de comparaison dans la légende. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Parc 1 et Bourg 1 | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés manuels uniquement pour une version soignée. Faire figurer le millésime 2022. |

Vérifications concernant les faits utilisés :

- **Libellés d’IRIS :** relire « Parc 1 » et « Bourg 1 ». Le texte les présente comme des secteurs statistiques.
- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication ; répercuter toute modification dans le texte et le tableau.

Aucun autre doute de lecture relevé.