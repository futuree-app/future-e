## A. Question et format

**Question principale :** à Nancy, quels repères regarder dans le secteur de résidence et le lieu de travail lorsqu’on cherche un logement pour utiliser moins la voiture ?

Les pratiques diffèrent nettement entre secteurs et entre groupes de destinations professionnelles. La proximité des équipements apporte ensuite un autre éclairage sur les adresses envisagées. Ces observations aident à orienter les recherches, sans prédire les déplacements du lecteur.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`, `iris.543950902.panier_500m`, `iris.543950203.panier_500m`.

**Format retenu : article court**, avec l’ouverture carburant et son scénario.

**Pistes écartées :** propriété automobile, stationnement et flux entrants disperseraient la question ; la comparaison entre villes n’aide pas ici à examiner les différences internes à Nancy.

## B. Article

# À Nancy, quels repères pour chercher un logement et moins prendre la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de **0,80 €/L pour le gazole** et de **0,52 €/L pour le SP95-E10**, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Nancy. Cette hausse donne une raison concrète d’examiner la place des déplacements dans un projet de déménagement.

Le scénario suivant chiffre le surcoût annuel de carburant seul, avec une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**. Il retient une hausse arrondie à 5 centimes : +0,80 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 100 € | environ 60 € |
| 15 km | environ 290 € | environ 180 € |
| 35 km | environ 670 € | environ 420 € |

Pour chercher à moins conduire à Nancy, deux éléments méritent ensuite d’être examinés : le secteur de l’adresse et le lieu de travail.

## Des pratiques différentes selon le secteur et la destination

Dans les données du recensement de **2022**, la voiture est le mode principal pour aller travailler de **29 %** des actifs occupés résidant dans le secteur Gambetta Carmes Faïencerie, contre **77 %** à Buthégnemont. Ces parts concernent les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer ces différences lorsqu’une annonce retient votre attention. Elle décrit des pratiques : pour examiner votre propre trajet, il faut aussi regarder sa destination.

Parmi les actifs qui habitent et travaillent à Nancy, **33 %** vont principalement travailler en voiture. Cette part atteint **63 %** parmi les actifs résidant à Nancy qui travaillent à Vandœuvre-lès-Nancy, Villers-lès-Nancy, Laxou, Saint-Max, Maxéville ou Jarville-la-Malgrange. Le nom du secteur ne suffit donc pas à examiner un logement : gardez votre lieu de travail comme point de repère pendant vos recherches.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel n’épuise pas la question des déplacements quotidiens. Autour des logements retenus, la présence des équipements mérite un examen distinct.

À Gambetta Carmes Faïencerie, **97 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau** ; à Buthégnemont, cette part est de **64 %**. Il s’agit de la présence de cet ensemble d’équipements, sans indication sur les établissements fréquentés.

Pendant une visite, suivez les chemins vers les commerces et l’école qui vous seraient utiles. Vous pourrez ainsi examiner ce que cette proximité représente depuis l’adresse précise.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour examiner ce qui pèsera dans votre choix.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE et portent sur le mode principal déclaré ; le dénominateur comprend les actifs qui travaillent à domicile. Les groupes de destinations sont distincts : leur comparaison ne mesure pas l’effet d’un déménagement ou d’un changement d’emploi. Les résultats sont des estimations par sondage ; les secteurs sont les IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur les adresses de la BAN et la Base permanente des équipements **2025** de l’INSEE. Elle ne décrit pas les chemins réels. Les prix proviennent de prix-carburants.gouv.fr : chaque médiane utilise le dernier prix déclaré par station dans la semaine considérée.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,80 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,52 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — distance de référence de la consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,80 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première distance | environ 100 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première distance | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième distance | environ 290 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième distance | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième distance | environ 670 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième distance | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime du recensement | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — Gambetta Carmes Faïencerie | 29 % | `iris.voiture.min` | oui |
| Pratiques — Buthégnemont | 77 % | `iris.voiture.max` | oui |
| Pratiques — résider et travailler à Nancy | 33 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — travailler dans le groupe nommé | 63 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements — Gambetta Carmes Faïencerie | 97 % des adresses | `iris.543950902.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m à vol d’oiseau | `iris.543950902.panier_500m`, `iris.543950203.panier_500m` | oui |
| Équipements — Buthégnemont | 64 % | `iris.543950203.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.543950902.panier_500m`, `iris.543950203.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses ; tableau reproduit dans B | Aucune. Faire figurer les semaines de comparaison dans sa légende. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison de Gambetta Carmes Faïencerie et Buthégnemont | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros accompagnés de leur liste. Libellés manuels seulement pour une version soignée. Faire figurer le millésime 2022. |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du groupe de communes retenu. Sa liste exacte figure dans l’article ; vérification non bloquante pour la rédaction.
- **`iris.ecart_voiture`** : relire les libellés Gambetta Carmes Faïencerie et Buthégnemont. Ils sont présentés comme des secteurs statistiques, sans assimilation à des quartiers d’usage.

Aucun autre doute de lecture relevé.