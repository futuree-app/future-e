## A. Question et format

**Question principale :** à Vénissieux, comment choisir un logement pour utiliser moins la voiture sans confondre proximité des services et trajets de travail ?

Les pratiques diffèrent selon le secteur de résidence et la commune de travail. Surtout, Saint-Exupéry montre qu’un secteur où toutes les adresses disposent du panier d’équipements à proximité peut aussi présenter une pratique majoritaire de la voiture pour travailler. Pour chercher un logement, cela invite à examiner ensemble l’environnement de l’adresse et les destinations quotidiennes.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `destination.69290.voiture`, `iris.692590401.panier_500m`, `iris.692590401.voiture`.

**Format retenu :** article complet resserré, avec le tableau carburant et une carte des pratiques par secteur.

**Pistes écartées :** stationnement, statut d’occupation, actifs venant travailler dans la commune et comparaison nationale, qui disperseraient la question ; possession d’une voiture, qui ouvrirait un autre angle.

## B. Article

# Vénissieux : des services proches, un trajet au travail à examiner

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,72 €/L et celui du SP95-E10 de 0,48 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Vénissieux. Pour un projet de déménagement, cette hausse donne une raison concrète de regarder les déplacements associés au logement.

Le scénario suivant chiffre le **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. La hausse est arrondie à 5 centimes : +0,70 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances sont des hypothèses, sans attribution à un secteur ou à une commune de travail. Pour examiner un logement à Vénissieux, les pratiques locales apportent un autre éclairage : où la voiture est-elle utilisée pour travailler, et vers quelles destinations ?

## Du secteur de résidence au lieu de travail

Les pratiques domicile-travail décrites ici sont celles du recensement de **2022**. Dans le secteur statistique de Parilly, **39 % des actifs qui y résident** déclarent la voiture comme mode principal pour aller travailler, contre **71 % à Gabriel Péri**.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte situe ces parts secteur par secteur. Pendant les visites, une question précise reste à poser : quel parcours relie ce logement à votre travail ?

La destination mérite en effet son propre examen. Parmi les actifs qui habitent et travaillent à Vénissieux, **52 %** vont travailler principalement en voiture. Parmi ceux qui habitent Vénissieux et travaillent à Saint-Priest, cette part est de **72 %**. Pendant vos recherches, conservez donc le lieu précis de travail comme point de comparaison entre les adresses envisagées, y compris lorsque l’emploi se trouve dans la commune.

## Des services proches pour quels déplacements ?

Le trajet au travail laisse ouverte la question des courses, de l’école ou de la pharmacie. Ces déplacements peuvent peser dans le choix d’une adresse, même lorsque le parcours professionnel reste inchangé.

À Saint-Exupéry, **toutes les adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Dans ce même secteur, **66 % des actifs qui y résident** utilisent principalement la voiture pour aller travailler.

Pour une recherche de logement, ces observations répondent à des questions différentes : quels équipements sont proches de l’adresse, et comment les actifs du secteur rejoignent-ils leur travail ? Lors d’une visite, repérez les accès et les cheminements vers les équipements que vous comptez fréquenter. La proximité à vol d’oiseau ne décrit pas le parcours à pied.

## Vérifier le parcours depuis l’annonce retenue

Pour examiner une option en transports en commun, utilisez le [calcul d’itinéraire TCL](https://www.tcl.fr/se-deplacer/calcul-ditineraire) avec vos lieux de départ et d’arrivée, puis consultez les horaires correspondant à vos jours de déplacement sur le [site du réseau](https://www.tcl.fr/). La page [info trafic](https://www.tcl.fr/se-deplacer/info-trafic) peut compléter cette préparation avant un essai du parcours.

Si votre déménagement doit vous rapprocher du travail ou faciliter la vie en famille, partez de ce que vous souhaitez changer au quotidien. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour l’examiner dans son ensemble avant de vous décider.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE et de la base infracommunale Activité des résidents. Elles décrivent le mode principal ; les parts par secteur portent sur les actifs qui y résident, quelle que soit leur commune de travail. Les résultats sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés, et les comparaisons par destination portent sur des groupes distincts.

Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers d’usage. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** : elle décrit leur localisation, sans renseigner leur fréquentation. Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; une station sans déclaration pendant une semaine ne participe pas à sa médiane. Le scénario porte sur le carburant seul. Les liens pratiques renvoient au site officiel TCL.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,72 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des prix | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.*` — hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.*` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.*` — hypothèses communes de la section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,70 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `destination.69290.voiture` | oui |
| Pratiques — Parilly | 39 % des actifs résidents | `iris.voiture.min` | oui |
| Pratiques — Gabriel Péri | 71 % des actifs résidents | `iris.voiture.max` | oui |
| Destination — travail à Vénissieux | 52 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination — travail à Saint-Priest | 72 % | `destination.69290.voiture` | oui |
| Équipements — Saint-Exupéry | toutes les adresses — valeur exacte de 100 % | `iris.692590401.panier_500m` | oui |
| Équipements — distance du panier | moins de 500 m à vol d’oiseau | `iris.692590401.panier_500m` | oui |
| Pratiques — Saint-Exupéry | 66 % des actifs résidents | `iris.692590401.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `acces.69259.panier_quotidien_500m` — source BPE commune aux indicateurs d’équipements | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| **Tableau du scénario de surcoût de carburant** | Au début, après les hypothèses du scénario | Aucune. Conserver les dates de comparaison des prix dans son accompagnement. |
| **Carte de la part de la voiture par secteur (IRIS)** | Après la comparaison entre Parilly et Gabriel Péri | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. Faire figurer le millésime 2022. |

Vérifications concernant les faits utilisés :

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, non bloquante pour la rédaction.
- **Secteurs :** relire les libellés Parilly, Gabriel Péri et Saint-Exupéry. Le texte les désigne comme secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture identifié.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : recommandation de secteur déduite des pratiques des actifs résidents | La carte permet de situer les annonces dans ces contrastes. Elle donne un repère pour orienter les visites, auxquelles il faut apporter une question précise : quel parcours relie ce logement à votre travail ? | La carte situe ces parts secteur par secteur. Pendant les visites, une question précise reste à poser : quel parcours relie ce logement à votre travail ? |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
