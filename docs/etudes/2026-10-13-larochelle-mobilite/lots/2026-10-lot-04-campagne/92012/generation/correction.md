## A. Question et format

**Question principale :** à Boulogne-Billancourt, que regarder dans le secteur d’un logement, son lien avec le travail et ses équipements proches pour envisager d’utiliser moins la voiture ?

Les pratiques domicile-travail diffèrent nettement entre secteurs. La proximité des équipements apporte un autre éclairage, à examiner séparément : elle ne suffit pas à décrire les déplacements. Pour une recherche de logement, ces observations invitent à regarder l’adresse et les destinations du quotidien.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `mobpro.modes.voiture`, `destination.92012.marche`, `iris.920120506.panier_500m`, `iris.920120703.panier_500m`.

**Format retenu : article court**, avec l’ouverture carburant et le scénario imposés par la série.

**Pistes écartées :** stationnement, possession automobile, actifs venant travailler dans la commune et comparaison nationale, qui disperseraient cette question centrée sur le choix d’une adresse.

## B. Article

# Boulogne-Billancourt : quelle adresse regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,62 €/L, celui du SP95-E10 de 0,19 €/L. Ces relevés concernent les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Boulogne-Billancourt. Pour un ménage qui cherche un logement, cette hausse remet les déplacements réguliers dans la réflexion.

## Le surcoût selon la distance au travail

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses médianes sont arrondies à 5 centimes : +0,60 €/L pour le gazole et +0,20 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel de carburant lié à la hausse entre les semaines du 6 octobre 2025 et du 5 octobre 2026.*

| Distance du trajet aller | Gazole | SP95-E10 |
|---|---:|---:|
| 5 km | environ 70 € | environ 20 € |
| 15 km | environ 220 € | environ 70 € |
| 35 km | environ 500 € | environ 170 € |

Ce scénario donne un repère pour les déplacements en voiture. Pour orienter une recherche à Boulogne-Billancourt, regardons maintenant les pratiques selon le secteur de résidence et le lieu de travail.

## Des pratiques différentes selon le secteur

Au recensement de 2022, 25 % des actifs occupés résidant à Boulogne-Billancourt déclarent la voiture comme mode principal pour aller travailler.

Cette part atteint 17 % à Trapèze 1 et 46 % aux Princes Marmottan 2. Elle porte, dans chaque secteur, sur les actifs qui y habitent, quelle que soit leur commune de travail. Lorsqu’une annonce vous intéresse, situer le logement sur la carte permet de replacer la moyenne communale dans son contexte local.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur — recensement 2022.*

Le lieu de travail apporte un autre éclairage : parmi les actifs qui habitent **et travaillent** à Boulogne-Billancourt, 42 % déclarent la marche comme mode principal. Si votre projet consiste à vous rapprocher de votre emploi, examinez donc le trajet depuis chaque logement retenu.

## Les courses et l’école demandent un autre regard

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour les courses, la pharmacie ou l’école, les données décrivent la proximité des équipements depuis les adresses.

À Trapèze 1, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Aux Princes Marmottan 2, cette part est de 78 %. Les adresses restantes peuvent avoir certains de ces équipements proches, sans réunir l’ensemble.

Pour une annonce retenue dans ces secteurs, repérez les établissements qui vous intéressent, puis parcourez les chemins depuis le logement. La distance à vol d’oiseau ne décrit ni les traversées ni l’accès à leurs entrées : ce sont des points concrets à examiner pendant une visite.

## Votre projet, votre adresse

Se rapprocher du travail ou s’installer en famille donne des priorités différentes à une recherche de logement. Avec futur•e, explorez l’adresse envisagée à partir de votre projet pour examiner ce qui peut peser dans votre choix.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’Insee : fichier Mobilités professionnelles et bases infracommunales. Le mode déclaré est le mode principal ; le dénominateur communal inclut les actifs sans déplacement professionnel. Les résultats sont des estimations par sondage. Les secteurs sont les IRIS statistiques de l’Insee, dont les libellés peuvent différer des noms de quartiers usuels ; leur comparaison ne décrit pas l’effet d’un déménagement.

La proximité des équipements croise la Base adresse nationale et la Base permanente des équipements de l’Insee, millésime 2025. Chaque adresse compte de manière égale au sein des secteurs cités. Les distances sont mesurées à vol d’oiseau, jusqu’au point représentant l’établissement.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr. Chaque médiane repose sur le dernier prix déclaré par chaque station dans la semaine considérée.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario figurent en section 7 du dossier ; elles sont rattachées ci-dessous aux identifiants des scénarios concernés.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,62 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,19 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes | oui |
| Hypothèses — hausse retenue, gazole | +0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,20 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 20 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 70 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 170 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.voiture` | oui |
| Pratiques — voiture dans la commune | 25 % | `mobpro.modes.voiture` | oui |
| Pratiques — libellé de secteur | « 1 » dans Trapèze 1 | `iris.voiture.min` | oui |
| Pratiques — voiture à Trapèze | 17 % | `iris.voiture.min` | oui |
| Pratiques — libellé de secteur | « 2 » dans Les Princes Marmottan 2 | `iris.voiture.max` | oui |
| Pratiques — voiture aux Princes Marmottan | 46 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Lieu de travail — marche des actifs habitant et travaillant dans la commune | 42 % | `destination.92012.marche` | oui |
| Équipements — libellé de secteur | « 1 » dans Trapèze 1 | `iris.920120506.panier_500m` | oui |
| Équipements — totalité des adresses de Trapèze | toutes les adresses, soit 100 % | `iris.920120506.panier_500m` | oui |
| Équipements — seuil de proximité | moins de 500 m à vol d’oiseau | `iris.920120506.panier_500m`, `iris.920120703.panier_500m` | oui |
| Équipements — libellé de secteur | « 2 » dans Les Princes Marmottan 2 | `iris.920120703.panier_500m` | oui |
| Équipements — adresses réunissant les équipements aux Princes Marmottan | 78 % | `iris.920120703.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920120506.panier_500m`, `iris.920120703.panier_500m` — source BPE | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison des secteurs | Aucune pour la production automatique ; repérer les secteurs cités par des numéros et leur liste. Placement manuel des libellés seulement pour une version soignée. |

Vérifications avant publication :

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Secteurs :** relire les libellés « Trapèze 1 » et « Les Princes Marmottan 2 ». Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture retenu.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur — Pratiques, libellé Trapèze 1 — écartée | « 1 » dans Trapèze 1 | Inchangé : « 1 » appartient au libellé « Trapèze 1 », explicitement donné par `iris.voiture.min` ; ce n’est pas une part mesurée. |
| Valeur — Pratiques, libellé Les Princes Marmottan 2 — écartée | « 2 » dans Les Princes Marmottan 2 | Inchangé : « 2 » appartient au libellé « Les Princes Marmottan 2 », explicitement donné par `iris.voiture.max` ; ce n’est pas une part mesurée. |
| Valeur — Équipements, libellé Trapèze 1 — écartée | « 1 » dans Trapèze 1 | Inchangé : la section 3 du dossier nomme « Trapèze 1 » le secteur 920120506 auquel se rapporte `iris.920120506.panier_500m`. Le numéro fait partie du libellé. |
| Valeur — Équipements, libellé Les Princes Marmottan 2 — écartée | « 2 » dans Les Princes Marmottan 2 | Inchangé : la section 3 du dossier nomme « Les Princes Marmottan 2 » le secteur 920120703 auquel se rapporte `iris.920120703.panier_500m`. Le numéro fait partie du libellé. |
| Consigne interne — référence au dossier — corrigée | le dossier mesure la proximité des équipements depuis les adresses | les données décrivent la proximité des équipements depuis les adresses |