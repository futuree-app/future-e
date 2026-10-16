## A. Question et format

**Question principale :** à Cannes, comment choisir un secteur pour utiliser moins la voiture sans confondre proximité des services et pratiques domicile-travail ?

Le dossier montre que des services proches peuvent coexister avec un usage majoritaire de la voiture pour travailler. Pour une recherche de logement, cela invite à examiner ensemble le secteur, les destinations habituelles et l’adresse précise. Appuis : `iris.voiture.min`, `iris.voiture.max`, `destination.06029.voiture`, `destination.06030.voiture`, `iris.060290117.panier_500m`, `iris.060290127.panier_500m` et `iris.060290127.voiture`.

**Format retenu :** article court, avec le tableau du scénario carburant et la carte des pratiques par secteur.

**Pistes écartées :** stationnement, statut d’occupation, actifs venant travailler à Cannes et comparaison nationale : ils disperseraient cette question sans préciser suffisamment le choix d’une adresse.

## B. Article

# Moins utiliser la voiture à Cannes : regarder le secteur et le trajet de travail

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,73 €/L et celui du SP95-E10 de 0,53 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Cannes. Cette hausse donne une raison concrète d’examiner la place des déplacements dans le choix d’un logement.

## Ce que la hausse représente selon la distance

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,55 €/L pour le SP95-E10. Il s’agit du surcoût de carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Hausse de référence : semaines du 6 octobre 2025 et du 5 octobre 2026.*

Pour passer du plein au choix d’un logement, les pratiques locales apportent un autre éclairage : quelle place la voiture occupe-t-elle selon le secteur de résidence et le lieu de travail ?

## Des pratiques différentes selon le secteur et la destination

Les pratiques décrites ici sont celles du recensement de 2022. Dans le secteur statistique Le Vieux Port-Les îles, 29 % des actifs qui y habitent utilisent la voiture comme mode principal pour aller travailler. À Pont d’Avril-L’Abadie, cette part atteint 75 %.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*INSEE, RP 2022. Actifs résidant dans chaque secteur, quelle que soit leur commune de travail.*

La destination apporte une autre distinction. Parmi les actifs habitant Cannes, la voiture est le mode principal de 46 % de ceux qui travaillent à Cannes, contre 72 % de ceux qui travaillent au Cannet. Pour examiner une annonce, regardez aussi le trajet vers votre emploi.

## Des services proches, même là où la voiture reste majoritaire

Le trajet de travail ne couvre pas les courses ou l’accompagnement des enfants. Leur place dans votre quotidien justifie de regarder aussi les équipements autour du logement.

Dans le secteur Le Vieux Port-Les îles, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Dans le secteur Le Plan, 98 % des adresses disposent de ce même panier de proximité, tandis que 63 % des actifs résidents déclarent la voiture comme mode principal pour travailler. La proximité des services et les pratiques domicile-travail apportent ainsi des informations différentes pour choisir une adresse.

Lors d’une visite, parcourez les chemins entre le logement et les services qui comptent pour vous. Pour vos déplacements en transport collectif, consultez le [site du réseau Palmbus](https://palmdeplacements.fr/) afin de vérifier votre trajet et les horaires correspondant à vos départs et retours.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour apprécier sa place dans la vie que vous souhaitez organiser.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE et des bases infracommunales. Les parts par secteur concernent les actifs occupés qui y résident, tous lieux de travail confondus ; elles ne sont pas croisées avec les destinations. Les groupes de destination sont distincts : leurs différences ne mesurent pas l’effet d’un déménagement. Ces résultats sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les noms cités sont des libellés statistiques IRIS.

La proximité repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil dans son secteur ; la distance à vol d’oiseau ne décrit pas le chemin à parcourir. Les prix proviennent du flux officiel de prix-carburants.gouv.fr, à partir du dernier prix déclaré par chaque station dans la semaine.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,73 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,53 €/L | `carburant.e10.ecart` | oui |
| Chapeau, rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses de la section 7 | oui |
| Hypothèses, base de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses de la section 7 | oui |
| Hypothèses, allers-retours annuels | 200 | `scenario.carburant.gazole.5km` — hypothèses de la section 7 | oui |
| Hypothèses, arrondi | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses de la section 7 | oui |
| Hypothèses, hausse du gazole retenue | +0,75 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Hypothèses, hausse du SP95-E10 retenue | +0,55 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, surcoût gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, surcoût SP95-E10 | environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, surcoût gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, surcoût SP95-E10 | environ 200 € | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, surcoût gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, surcoût SP95-E10 | environ 460 € | `scenario.carburant.e10.35km` | oui |
| Légende du tableau, début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau, fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Pratiques, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.06029.voiture`, `destination.06030.voiture` | oui |
| Pratiques, Le Vieux Port-Les îles | 29 % | `iris.voiture.min` | oui |
| Pratiques, Pont d’Avril-L’Abadie | 75 % | `iris.voiture.max` | oui |
| Légende de la carte, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques, travail à Cannes | 46 % | `destination.06029.voiture` | oui |
| Pratiques, travail au Cannet | 72 % | `destination.06030.voiture` | oui |
| Proximité, Le Vieux Port-Les îles | « toutes les adresses » : 100 % | `iris.060290117.panier_500m` | oui |
| Proximité, distance définissant le panier | 500 m | `iris.060290117.panier_500m`, `iris.060290127.panier_500m` | oui |
| Proximité, panier dans Le Plan | 98 % | `iris.060290127.panier_500m` | oui |
| Proximité, voiture dans Le Plan | 63 % | `iris.060290127.voiture` | oui |
| Méthode, millésime des équipements | 2025 | `iris.060290117.panier_500m`, `iris.060290127.panier_500m` — source BPE du dossier | oui |

Le renvoi vers le site Palmbus s’appuie sur `doc.reseau.site`, usage `oui`. Il ne comporte aucune affirmation de desserte.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début d’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Le Vieux Port-Les îles et Pont d’Avril-L’Abadie | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **Carburant :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire pour `carburant.*` et `scenario.carburant.*`.
- **Secteurs :** relire les libellés Le Vieux Port-Les îles, Pont d’Avril-L’Abadie et Le Plan. Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture identifié.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — `bloquante` : portée des pratiques par secteur | « Ces observations donnent des repères pour orienter une recherche à l’intérieur de Cannes. » | Phrase supprimée pour éviter de suggérer un effet du secteur sur la pratique du lecteur. |
| Raisonnement — `a_revoir` : déduction à partir des groupes de destination | « Pour examiner une annonce, le secteur de résidence et le trajet vers votre emploi méritent donc chacun leur attention. » | « Pour examiner une annonce, regardez aussi le trajet vers votre emploi. » |
| Population — `a_revoir` : résidence des actifs | « Dans le secteur statistique Le Vieux Port-Les îles, 29 % des actifs utilisent la voiture » | « Dans le secteur statistique Le Vieux Port-Les îles, 29 % des actifs qui y habitent utilisent la voiture » |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
