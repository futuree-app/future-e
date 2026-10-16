## A. Question et format

**Question principale :** comment choisir une adresse à Cergy pour utiliser moins la voiture, en distinguant les trajets de travail de la proximité des équipements du quotidien ?

Le Bontemps donne un repère utile : la quasi-totalité des adresses dispose du panier quotidien à proximité, tandis que la voiture reste le mode principal de la majorité des actifs pour travailler. Pour une recherche de logement, cela invite à examiner séparément les équipements proches et le trajet vers son emploi.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `destination.95572.voiture`, `destination.92026.voiture`, `iris.951270127.voiture`, `iris.951270127.panier_500m`, `iris.951270112.panier_500m`.

**Format retenu :** article court, avec l’ouverture carburant obligatoire.

**Pistes écartées :** motorisation, stationnement et actifs venant travailler à Cergy, qui disperseraient la question ; comparaison nationale, peu éclairante ici ; regroupement automatique des destinations, remplacé par des communes de travail précises.

## B. Article

# À Cergy, quels repères pour choisir un logement et moins conduire ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant a augmenté de **0,72 €/L pour le gazole** et de **0,46 €/L pour le SP95-E10**. Ces observations portent sur les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Cergy.

## Ce que la hausse ajoute aux trajets de travail

Le scénario suivant retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,70 €/L pour le gazole et +0,45 €/L pour le SP95-E10. Il chiffre uniquement le surcoût annuel de carburant.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces montants donnent une raison de regarder les déplacements dès le choix du logement. À Cergy, quels repères permettent de chercher une adresse pour utiliser moins la voiture ?

## Situer le logement, puis regarder sa destination de travail

Les pratiques décrites ici sont celles du recensement de **2022**. À Préfecture, **28 %** des actifs qui habitent le secteur vont travailler principalement en voiture ; à Justice-Heuruelles, cette part atteint **56 %**. Pour examiner une annonce, situez donc le logement dans son secteur plutôt que de vous arrêter au nom de la commune.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Les pratiques diffèrent aussi selon le lieu de travail. Parmi les actifs qui résident à Cergy et travaillent à Saint-Ouen-l’Aumône, **69 %** utilisent principalement la voiture. Parmi les actifs qui résident à Cergy et travaillent à Courbevoie, cette part est de **9 %**.

Pour les adresses que vous retenez, examinez le trajet vers votre lieu de travail précis, avec vos horaires : les pratiques observées pour une destination ne décrivent pas toutes les autres.

## Les courses et l’école posent une autre question

Le trajet de travail ne règle pas la question des déplacements autour du logement. Pour les éclairer, le panier quotidien réunit un commerce alimentaire, une pharmacie et une école élémentaire, chacun à moins de **500 m à vol d’oiseau** de l’adresse.

Au Bontemps, **la quasi-totalité des adresses** réunit ce panier. Dans ce même secteur, **52 % des actifs résidents** vont travailler principalement en voiture : la proximité de ces équipements et les déplacements vers l’emploi sont bien des questions à examiner séparément.

À Justice-Heuruelles, **aucune adresse ne réunit le panier complet** dans le rayon retenu. Pour une annonce dans ce secteur, repérez donc chaque équipement utile individuellement. Pendant la visite, regardez aussi les cheminements : une proximité à vol d’oiseau ne décrit pas le parcours réel.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en faisant moins de place à la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour l’examiner dans l’ensemble de ce qui compte pour vous.

## Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Elles portent sur le mode principal des actifs occupés et sont estimées par sondage. Les destinations comparent des groupes distincts de personnes ; les parts par secteur concernent tous les actifs qui y résident, quel que soit leur lieu de travail.

Les secteurs sont les IRIS statistiques de l’INSEE ; leurs libellés peuvent différer des noms de quartier. La proximité des équipements est établie à partir de la Base adresse nationale et de la Base permanente des équipements **2025** de l’INSEE. Chaque adresse compte de la même façon au sein du secteur ; la présence d’une école ne renseigne pas sur son affectation.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré pendant chaque semaine considérée. Le scénario de surcoût n’est attribué à aucun secteur ni à aucune destination de travail.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, début de période | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, fin de période | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,72 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,46 €/L | `carburant.e10.ecart` | oui |
| Chapeau, périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, hausse retenue du gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses, hausse retenue du SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau, première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole, première distance | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10, première distance | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau, deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole, deuxième distance | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10, deuxième distance | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau, troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole, troisième distance | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10, troisième distance | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.95572.voiture`, `destination.92026.voiture` | oui |
| Pratiques, Préfecture | 28 % | `iris.voiture.min` | oui |
| Pratiques, Justice-Heuruelles | 56 % | `iris.voiture.max` | oui |
| Destination de travail, Saint-Ouen-l’Aumône | 69 % | `destination.95572.voiture` | oui |
| Destination de travail, Courbevoie | 9 % | `destination.92026.voiture` | oui |
| Définition du panier quotidien | moins de 500 m à vol d’oiseau | `iris.951270127.panier_500m`, `iris.951270112.panier_500m` | oui |
| Panier quotidien, Le Bontemps | la quasi-totalité des adresses — valeur source : 99,6 % | `iris.951270127.panier_500m` | oui |
| Voiture domicile-travail, Le Bontemps | 52 % | `iris.951270127.voiture` | oui |
| Panier quotidien, Justice-Heuruelles | aucune adresse — valeur exacte : 0 % | `iris.951270112.panier_500m` | oui |
| Méthode, millésime des équipements | 2025 | `iris.951270127.panier_500m`, `iris.951270112.panier_500m` — provenance BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Ouverture, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison Préfecture / Justice-Heuruelles | Aucune pour la production automatique avec classes et repères ; libellés posés à la main seulement pour une version soignée. |

Faire figurer le millésime des pratiques sur la carte et les périodes de référence des prix avec le tableau du scénario.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Préfecture, Justice-Heuruelles et Le Bontemps. Le texte les désigne comme des secteurs statistiques.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication et concerne aussi le scénario.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
