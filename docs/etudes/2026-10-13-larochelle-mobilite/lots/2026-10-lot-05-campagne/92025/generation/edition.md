## A. Question et format

**Question principale :** à Colombes, que regarder dans le secteur et autour de l’adresse pour chercher un logement en visant un moindre usage de la voiture ?

Les pratiques domicile-travail présentent des contrastes marqués entre secteurs. Les rapprocher de la destination professionnelle et de la proximité des équipements aide le lecteur à préparer ses recherches et ses visites. Appuis : `iris.voiture.min`, `iris.voiture.max`, `mobpro.modes.tc`, `destination.92026.voiture`, `destination.92050.voiture`, `iris.920250101.panier_500m`, `iris.920250303.panier_500m`.

**Format retenu : article court.** L’ouverture conserve la hausse datée du carburant et le scénario fourni.

**Pistes écartées :** motorisation, statut d’occupation, stationnement, actifs entrants et comparaison nationale, pour concentrer le texte sur les repères utiles à l’examen d’une annonce.

## B. Article

# À Colombes, quelle adresse choisir pour moins prendre la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du carburant augmente de 0,65 €/L pour le gazole et de 0,21 €/L pour le SP95-E10, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Colombes. Pour qui cherche un logement, cette hausse remet la distance au travail dans la discussion.

Le scénario suivant illustre le surcoût annuel de carburant selon la distance. Ses hypothèses : **6 L/100 km**, **200 allers-retours domicile-travail par an**, et des hausses arrondies à **5 centimes**, soit **+0,65 €/L** pour le gazole et **+0,20 €/L** pour le SP95-E10. Il porte sur le carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

Reste à savoir quoi regarder dans les annonces à Colombes : les pratiques du secteur, votre destination de travail et les équipements autour de l’adresse.

## Des pratiques différentes selon le secteur

D’après le recensement de **2022**, **53 % des actifs occupés résidant à Colombes** utilisent les transports en commun comme mode principal pour aller travailler.

La place de la voiture varie selon le secteur : elle constitue le mode principal de **17 %** des actifs occupés habitant Saint-Denis, contre **42 %** à Salvador Allende-Égalité. Ces parts concernent les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer le secteur d’une annonce et d’en lire les pratiques. Votre destination professionnelle mérite ensuite son propre examen : parmi les actifs qui habitent Colombes et travaillent à Courbevoie, **27 %** déclarent la voiture comme mode principal ; parmi ceux qui travaillent à Nanterre, **42 %**.

Dès qu’une annonce retient votre attention, examinez donc la liaison vers votre lieu de travail précis, aux horaires que vous aurez à tenir.

## Les courses et l’école se regardent aussi à l’adresse

Les trajets professionnels ne couvrent qu’une partie du quotidien. Pour chercher à moins utiliser la voiture, il faut aussi situer les équipements dont votre foyer aura besoin.

Dans le secteur Saint-Denis, **toutes les adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Ce panier est présent dans ce rayon pour **46 % des adresses** du secteur Salvador Allende-Égalité.

Lors d’une visite, repérez les équipements utiles à votre foyer et parcourez leurs accès depuis le logement. Pour l’école, vérifiez également l’affectation correspondant à l’adresse.

## Votre projet, votre adresse

Si vous déménagez pour alléger les déplacements du quotidien ou vous installer en famille, partez de l’organisation que vous souhaitez construire. Avec futur•e, explorez l’adresse envisagée à partir de ce projet pour l’examiner dans son ensemble avant de choisir.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE : fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont les IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. Les groupes par destination professionnelle sont distincts : leurs écarts ne mesurent pas l’effet d’un changement de lieu.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** de l’INSEE. Les parts d’adresses sont non pondérées à l’intérieur de chaque secteur. Les distances sont mesurées à vol d’oiseau jusqu’à l’adresse de l’établissement, sans décrire le parcours réel ni l’usage des équipements.

Les prix viennent de prix-carburants.gouv.fr : médianes entre stations du dernier prix déclaré dans chacune des semaines retenues.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,65 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,21 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,20 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 20 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 70 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 170 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime du recensement | 2022 | `mobpro.modes.tc`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — transports en commun | 53 % | `mobpro.modes.tc` | oui |
| Pratiques — voiture à Saint-Denis | 17 % | `iris.voiture.min` | oui |
| Pratiques — voiture à Salvador Allende-Égalité | 42 % | `iris.voiture.max` | oui |
| Destination — travail à Courbevoie | 27 % | `destination.92026.voiture` | oui |
| Destination — travail à Nanterre | 42 % | `destination.92050.voiture` | oui |
| Équipements — couverture à Saint-Denis | « toutes les adresses » : 100 % | `iris.920250101.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m | `iris.920250101.panier_500m`, `iris.920250303.panier_500m` | oui |
| Équipements — couverture à Salvador Allende-Égalité | 46 % | `iris.920250303.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920250101.panier_500m`, `iris.920250303.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses ; tableau reproduit dans B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture de Saint-Denis et Salvador Allende-Égalité | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. Faire figurer le millésime des pratiques : 2022. |

**Vérifications avant publication concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Saint-Denis et Salvador Allende-Égalité. Le texte les désigne comme secteurs statistiques.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario de surcoût ; elle est obligatoire avant publication.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
