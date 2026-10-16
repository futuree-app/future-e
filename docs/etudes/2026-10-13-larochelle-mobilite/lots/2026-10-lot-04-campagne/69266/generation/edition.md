## A. Question et format

**Question principale :** à Villeurbanne, comment choisir une adresse en regardant à la fois les pratiques domicile-travail et la proximité des équipements du quotidien ?

Les contrastes entre secteurs donnent des repères pour explorer les annonces. Les différences selon la commune de travail invitent à examiner aussi sa destination professionnelle ; la proximité des équipements apporte un éclairage distinct pour les courses et l’école.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `destination.69266.voiture`, `destination.69290.voiture`, `iris.692660102.panier_500m`, `iris.692660801.panier_500m`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les scénarios associés.

**Format retenu : article court.** Motorisation, stationnement, flux entrants et comparaison nationale sont écartés pour garder le fil du choix d’adresse et des trajets à examiner.

## B. Article

# Villeurbanne : quelle adresse pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de 0,74 €/L pour le gazole et de 0,50 €/L pour le SP95-E10, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Villeurbanne. Pour une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements associés à chaque adresse.

Le scénario suivant porte sur le carburant seul, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses médianes sont arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances ne correspondent pas à des quartiers précis. Pour examiner une annonce à Villeurbanne, les pratiques locales apportent d’autres repères.

## Le secteur de résidence et la destination du travail

Les données du recensement de 2022 montrent des contrastes marqués : la voiture est le mode principal pour aller travailler de 20 % des actifs qui habitent le secteur Charles Hernu, contre 57 % à Saint-Jean. Ces parts concernent les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail, millésime 2022.*

La destination professionnelle mérite aussi sa place dans la recherche. Parmi les actifs qui habitent Villeurbanne et y travaillent, 22 % utilisent principalement la voiture pour aller travailler. Parmi ceux qui habitent Villeurbanne et travaillent à Saint-Priest, cette part est de 67 %. Pour chaque logement envisagé, examinez donc le trajet vers votre propre lieu de travail.

## Les courses et l’école autour de l’annonce

Si votre projet comprend aussi moins de déplacements en voiture pour les courses ou l’accompagnement à l’école, regardez les équipements autour du logement.

À Charles Hernu, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Saint-Jean, 38 % des adresses réunissent ce panier complet.

Lors d’une visite, parcourez les cheminements vers les établissements qui vous seraient utiles et repérez leurs entrées : la proximité à vol d’oiseau ne décrit pas le parcours à pied.

## Vérifier les trajets que vous feriez

Pour examiner une option en transports en commun, le site [TCL](https://www.tcl.fr/) propose un [calcul d’itinéraire](https://www.tcl.fr/se-deplacer/calcul-ditineraire) et une page d’[info trafic](https://www.tcl.fr/se-deplacer/info-trafic). Vérifiez votre trajet aux jours et horaires qui vous concernent, ainsi que le titre adapté : la tarification dépend des zones traversées.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille ? Sur futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, fichier MOBPRO et bases infracommunales. Elles décrivent le mode principal des actifs occupés ; les groupes selon la destination professionnelle sont distincts et leurs écarts ne mesurent pas l’effet d’un déménagement. Les résultats sont des estimations par sondage.

Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers usuels. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE : elle porte sur les adresses, sans mesurer l’usage des établissements.

Les prix viennent de prix-carburants.gouv.fr, à partir du dernier prix déclaré par chaque station dans la semaine. Les stations présentes peuvent varier entre les périodes ; une hausse passée ne préjuge pas de l’avenir. Les informations pratiques renvoient au site officiel TCL.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, période initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, période finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse essence | 0,50 €/L | `carburant.e10.ecart` | oui |
| Chapeau, périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèse de consommation, volume | 6 L | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèse de consommation, distance | 100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèse de déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèse d’arrondi | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hausse retenue, gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hausse retenue, essence | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau, distance | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, essence | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau, distance | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, essence | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau, distance | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, essence | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Charles Hernu, voiture | 20 % | `iris.voiture.min` | oui |
| Saint-Jean, voiture | 57 % | `iris.voiture.max` | oui |
| Légende de la carte, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Actifs résidant et travaillant à Villeurbanne, voiture | 22 % | `destination.69266.voiture` | oui |
| Actifs résidant à Villeurbanne et travaillant à Saint-Priest, voiture | 67 % | `destination.69290.voiture` | oui |
| Charles Hernu, couverture du panier complet | toutes les adresses — 100 % | `iris.692660102.panier_500m` | oui |
| Définition du panier, distance à vol d’oiseau | 500 m | `iris.692660102.panier_500m`, `iris.692660801.panier_500m` | oui |
| Saint-Jean, couverture du panier complet | 38 % | `iris.692660801.panier_500m` | oui |

« SP95-E10 » est le nom du carburant fourni par les faits `carburant.e10.*` et `scenario.carburant.e10.*`, utilisé dans le chapeau, les hypothèses et l’en-tête du tableau.

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses ; contenu reproduit en B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Charles Hernu et Saint-Jean | Aucune pour la production : classes automatiques et repères pour les secteurs cités. Libellés à poser à la main seulement pour une version soignée. Afficher le millésime des pratiques. |

Vérifications concernant les faits utilisés :

- **Libellés IRIS** : relire « Charles Hernu » et « Saint-Jean ». L’article les présente comme des secteurs statistiques.
- **Carburant** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication et concerne aussi le scénario.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
