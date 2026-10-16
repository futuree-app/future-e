## A. Question et format

**Question principale :** à Grenoble, que regarder au-delà de la proximité des commerces pour chercher un logement où utiliser moins la voiture ?

Le contraste entre Gabriel Péri et Poterne est utile : les pratiques domicile-travail diffèrent fortement, alors que le panier d’équipements est proche de presque toutes les adresses dans les deux secteurs. Pour une recherche de logement, cela invite à examiner ensemble le secteur, le lieu de travail et les parcours quotidiens, sans déduire les possibilités personnelles du lecteur des pratiques recensées.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.381850107.panier_500m`, `iris.381850505.panier_500m`, `mobpro.voiture_selon_destination.meme_commune` et `mobpro.voiture_selon_destination.communes_voisines`.

**Format retenu :** article court, centré sur ce contraste, avec l’ouverture carburant obligatoire.

**Pistes écartées :** possession automobile, stationnement, actifs venant travailler à Grenoble et comparaison nationale : elles disperseraient cette question. Les données de desserte des bus sont inutilisables.

## B. Article

# À Grenoble, des commerces proches ne répondent pas à toute la question de la voiture

Dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Grenoble, le prix médian du gazole a augmenté de 0,74 €/L entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026. Pour le SP95-E10, la hausse atteint 0,50 €/L. Quand on cherche un logement, ce surcoût donne une raison concrète d’examiner les déplacements que l’on souhaite réduire.

## Ce que la distance change au surcoût de carburant

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses utilisées, arrondies à 5 centimes, sont de 0,75 €/L pour le gazole et de 0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ce repère porte sur le carburant seul. Il amène une question pour les annonces que vous consultez : que regarder dans leur localisation pour envisager de moins conduire ?

## Des pratiques très différentes selon le secteur

Les pratiques domicile-travail du recensement de 2022 montrent un contraste marqué. Dans le secteur Gabriel Péri, 14 % des actifs vont travailler principalement en voiture ; à Poterne, cette part atteint 56 %. Il s’agit, dans chaque cas, des actifs qui habitent le secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer le secteur d’une annonce parmi ces pratiques. Elle donne un point de départ pour préparer la visite et les questions sur vos déplacements.

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui habitent et travaillent à Grenoble, 22 % déclarent la voiture comme mode principal. Cette part est de 40 % parmi les actifs résidant à Grenoble qui travaillent à Saint-Martin-d’Hères, Échirolles, Fontaine, Meylan, Saint-Égrève ou Seyssinet-Pariset. Pour chaque logement retenu, examiner la liaison avec votre lieu de travail reste donc une étape de la recherche.

## Des équipements proches, y compris à Poterne

Le trajet du matin ne couvre pas toute la vie quotidienne : les courses et l’école méritent aussi leur place dans l’examen d’une adresse.

À Gabriel Péri, 100 % des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Poterne, cette part est de 95 %. Ce dernier secteur associe donc une proximité étendue de ces équipements et une part élevée de la voiture pour aller travailler.

Pour vos visites, gardez ces questions concrètes : comment rejoindriez-vous votre travail ? Quels parcours emprunteriez-vous pour les courses et l’école ? Faites sur place les chemins vers les équipements qui vous serviraient : leur proximité sur la carte est une première information sur l’adresse.

## Votre projet, votre adresse

Vous cherchez peut-être à vous rapprocher du travail ou à simplifier les déplacements de la famille. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, fichier MOBPRO et base infracommunale Activité des résidents. Elles portent sur le mode principal des actifs occupés, y compris ceux qui travaillent à domicile dans les dénominateurs. Les comparaisons décrivent des groupes distincts et des estimations par sondage ; elles ne mesurent pas l’effet d’un déménagement.

Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil au sein du secteur ; les distances à vol d’oiseau ne décrivent pas les parcours réels ni l’usage des équipements.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : pour chaque semaine, la médiane porte sur le dernier prix déclaré par chaque station du périmètre.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Chapeau — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — fréquence annuelle | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue, gazole | 0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | 0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Pratiques — Gabriel Péri | 14 % | `iris.voiture.min` | oui |
| Pratiques — Poterne | 56 % | `iris.voiture.max` | oui |
| Destination — travail à Grenoble | 22 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination — travail dans le groupe nommé | 40 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements — adresses de Gabriel Péri | 100 % | `iris.381850107.panier_500m` | oui |
| Équipements — distance du panier | 500 m à vol d’oiseau | `iris.381850107.panier_500m`, `iris.381850505.panier_500m` | oui |
| Équipements — adresses de Poterne | 95 % | `iris.381850505.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.381850107.panier_500m`, `iris.381850505.panier_500m` — source BPE du dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Gabriel Péri et Poterne | Aucune pour la production automatique ; repérer les secteurs cités avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Le millésime des pratiques devra figurer sur la carte ; les périodes de prix et les hypothèses devront accompagner le tableau.

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Gabriel Péri et Poterne. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du choix des communes du groupe. Leur liste exacte figure dès sa première mention.

Aucun autre doute de lecture identifié.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
