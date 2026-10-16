## A. Question et format

**Question principale :** quels repères regarder selon le secteur pour chercher un logement à Noisy-le-Grand en utilisant moins la voiture ?

Le contraste entre Pavé Neuf 2 et Richardets 2 concerne aussi bien les pratiques domicile-travail que la proximité des équipements. Il invite le lecteur à examiner ensemble le secteur, sa destination de travail et l’adresse envisagée, sans déduire ses possibilités personnelles des pratiques observées.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.930510302.panier_500m`, `iris.930510202.panier_500m`, `destination.93051.voiture`, `destination.92026.voiture`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les scénarios `scenario.carburant.*`.

**Format retenu :** article court, avec le tableau du surcoût et la carte des pratiques par secteur.

**Pistes écartées :** stationnement, statut d’occupation et actifs venant travailler dans la commune disperseraient l’angle ; la comparaison nationale apporte moins à l’examen d’une adresse ; les données de bus sont inutilisables.

## B. Article

# Noisy-le-Grand : quels repères pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,69 €/L, celui du SP95-E10 de 0,44 €/L. Ces médianes portent sur les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Noisy-le-Grand.

## Ce que la hausse représente selon la distance

Le scénario ci-dessous retient une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**. Les hausses sont arrondies à **5 centimes**, aux valeurs indiquées dans le tableau. Il s’agit du surcoût de carburant seul, sans attribution à un secteur ou à une destination de travail.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre les semaines citées en ouverture.*

Pour une recherche de logement à Noisy-le-Grand, les pratiques par secteur et par lieu de travail donnent des repères pour examiner les déplacements qui pèseront dans votre choix.

## Des pratiques différentes selon le secteur

Les données du recensement de **2022** montrent un contraste : la voiture est le mode principal pour aller travailler de **20 % des actifs qui habitent Pavé Neuf 2**, contre **47 % de ceux qui habitent Richardets 2**, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal des trajets domicile-travail des actifs résidant dans chaque secteur — recensement 2022.*

La destination professionnelle apporte un autre éclairage. Parmi les actifs qui habitent Noisy-le-Grand et travaillent dans la commune, **37 %** utilisent principalement la voiture. Parmi ceux qui habitent Noisy-le-Grand et travaillent à Courbevoie, cette part est de **9 %**. Pour chaque annonce retenue, examinez donc le trajet jusqu’à votre lieu de travail précis.

## Les courses et l’école se regardent aussi à l’adresse

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour chercher un logement où moins prendre la voiture, il faut aussi regarder la proximité des équipements dont vous avez besoin.

À Pavé Neuf 2, **98 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Richardets 2, cette part est de **34 %**.

Ce panier réunit les équipements : une adresse qui ne dispose pas de l’ensemble peut rester proche de l’un d’eux. Lors d’une visite, repérez séparément le commerce, la pharmacie et, si elle vous concerne, l’école, puis parcourez les chemins pour les rejoindre.

## Votre projet, votre adresse

Se rapprocher du travail ou s’installer en famille donne des priorités différentes à une recherche de logement. Avec futur•e, examinez l’adresse que vous envisagez dans son ensemble, à partir de votre projet.

### Méthode et sources

Les pratiques proviennent du fichier Mobilités professionnelles et des bases infracommunales de l’INSEE. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les groupes par destination de travail sont distincts et ne sont pas croisés avec les secteurs de résidence. Courbevoie est choisie pour sa part de voiture parmi les plus basses. Les noms de secteurs sont les libellés statistiques IRIS, qui peuvent différer des noms de quartiers d’usage.

La proximité des équipements est établie à partir de la Base adresse nationale et de la Base permanente des équipements de l’INSEE, millésime **2025**. Chaque adresse compte pareil dans son secteur. La proximité ne décrit pas l’usage des équipements.

Les prix proviennent du flux officiel prix-carburants.gouv.fr : chaque médiane porte sur le dernier prix déclaré par chaque station pendant la semaine considérée.

## C. Correspondance interne — non publiée

Les identifiants `scenario.carburant.*` renvoient également aux hypothèses communes qui les accompagnent en section 7 du dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture, début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture, fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture, hausse du gazole | 0,69 €/L | `carburant.gazole.ecart` | oui |
| Ouverture, hausse du SP95-E10 | 0,44 €/L | `carburant.e10.ecart` | oui |
| Ouverture, rayon autour du centre communal | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèse commune | oui |
| Hypothèses, distance de référence de la consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèse commune | oui |
| Hypothèses, allers-retours annuels | 200 | `scenario.carburant.gazole.5km` — hypothèse commune | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune | oui |
| Tableau, hausse retenue pour le gazole | +0,70 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau, hausse retenue pour le SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, surcoût annuel gazole | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, surcoût annuel SP95-E10 | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, surcoût annuel gazole | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, surcoût annuel SP95-E10 | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, surcoût annuel gazole | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, surcoût annuel SP95-E10 | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques par secteur, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques par secteur, voiture à Pavé Neuf 2 | 20 % | `iris.voiture.min` | oui |
| Pratiques par secteur, voiture à Richardets 2 | 47 % | `iris.voiture.max` | oui |
| Libellé du secteur, dans les passages sur le travail et les équipements | Pavé Neuf 2 | `iris.voiture.min`, `iris.930510302.panier_500m` | oui |
| Libellé du secteur, dans les passages sur le travail et les équipements | Richardets 2 | `iris.voiture.max`, `iris.930510202.panier_500m` | oui |
| Légende de la carte, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Destination de travail Noisy-le-Grand, voiture | 37 % | `destination.93051.voiture` | oui |
| Destination de travail Courbevoie, voiture | 9 % | `destination.92026.voiture` | oui |
| Équipements, panier à Pavé Neuf 2 | 98 % | `iris.930510302.panier_500m` | oui |
| Équipements, rayon du panier | 500 m à vol d’oiseau | `iris.930510302.panier_500m`, `iris.930510202.panier_500m` | oui |
| Équipements, panier à Richardets 2 | 34 % | `iris.930510202.panier_500m` | oui |
| Méthode, millésime des équipements | 2025 | `iris.930510302.panier_500m`, `iris.930510202.panier_500m` — source du panier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Pavé Neuf 2 et Richardets 2 | Aucune nécessaire pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Placement manuel des libellés seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification non bloquante pour la rédaction, obligatoire avant publication.
- **Libellés IRIS :** relire « Pavé Neuf 2 » et « Richardets 2 ». Le texte les présente comme des secteurs statistiques ; leur correspondance avec les quartiers d’usage reste à vérifier avant toute reformulation en noms de quartiers.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : recommandation de quartier implicite dans le titre | Noisy-le-Grand : où chercher pour utiliser moins la voiture ? | Noisy-le-Grand : quels repères pour utiliser moins la voiture ? |
| Méthode — à revoir : choix de Courbevoie non expliqué | Aucun motif de sélection dans la méthode. | Ajout bref : « Courbevoie est choisie pour sa part de voiture parmi les plus basses. » |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
