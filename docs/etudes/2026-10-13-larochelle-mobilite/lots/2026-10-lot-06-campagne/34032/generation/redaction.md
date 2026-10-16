## A. Question et format

**Question principale :** quels repères regarder par secteur lorsqu’on cherche un logement à Béziers pour utiliser moins la voiture ?

Les pratiques automobiles varient fortement entre secteurs. La proximité des équipements apporte un autre éclairage : elle peut coexister avec des pratiques automobiles très différentes. Pour le lecteur, cela invite à examiner séparément le trajet professionnel et les destinations du quotidien à partir du logement envisagé.

**Appuis :** `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min`, `iris.voiture.max`, `iris.340320101.panier_500m`, `iris.340320601.panier_500m`, `iris.340320601.voiture`. L’ouverture s’appuie sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les six faits `scenario.carburant.*`.

**Format :** article court, centré sur les contrastes entre secteurs et l’examen de l’adresse.

**Pistes écartées :** les comparaisons entre communes, la possession automobile et le stationnement disperseraient la question ; l’identité du réseau n’apporte pas de renseignement utile sur un trajet, et les indicateurs de bus sont inutilisables.

## B. Article

# À Béziers, où chercher un logement pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,76 €/L, et celui du SP95-E10 de 0,55 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Béziers. Une hausse qui remet les déplacements réguliers dans les critères de recherche d’un logement.

Le tableau donne un scénario de surcoût annuel selon la distance domicile-travail. Ses hypothèses : une consommation de 6 L/100 km, 200 allers-retours par an et des hausses de prix arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole, hausse retenue de +0,75 €/L | Surcoût annuel — SP95-E10, hausse retenue de +0,55 €/L |
|---|---:|---:|
| 5 km | environ 90 € | environ 70 € |
| 15 km | environ 270 € | environ 200 € |
| 35 km | environ 630 € | environ 460 € |

*Scénario fondé sur la hausse entre 2025 et 2026. Carburant seul.*

Pour une recherche à Béziers, ces montants amènent une question concrète : quels secteurs examiner si l’on souhaite moins prendre la voiture ?

## Travailler à Béziers ne décrit pas tout le trajet

Au recensement de 2022, 74 % des actifs qui résident à Béziers travaillent dans la commune. Parmi ceux qui y habitent et y travaillent, 73 % déclarent la voiture comme mode principal pour aller travailler. Avoir son logement et son emploi dans la même commune laisse donc entière la question de leur emplacement précis.

Les pratiques diffèrent aussi selon le secteur de résidence. Parmi les actifs qui habitent Jean Jaurès, 36 % utilisent principalement la voiture pour travailler, contre 91 % à Route de Bédarieux, tous lieux de travail confondus.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail, recensement 2022.*

La carte aide à situer ces contrastes pendant la recherche. Pour une annonce qui vous intéresse, le secteur fournit un repère à rapprocher de votre propre destination professionnelle.

## Les courses et l’école posent une autre question

Le trajet professionnel ne couvre pas les autres sorties régulières. Pour les examiner, le dossier retient un même ensemble d’équipements : un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

À Jean Jaurès comme à Iranget, toutes les adresses réunissent cette proximité. À Iranget, elle coexiste avec une part de voiture de 84 % parmi les actifs qui y résident pour leurs déplacements professionnels.

Lors d’une visite dans ces secteurs, repérez les établissements qui correspondent à vos besoins, puis parcourez les rues qui les relient au logement. Regardez les traversées et les accès aux établissements : la proximité à vol d’oiseau ne décrit pas le chemin que vous emprunterez.

## Votre projet, votre adresse

Si votre déménagement à Béziers doit vous permettre d’utiliser moins la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet pour l’examiner dans son ensemble avant de choisir.

## Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE et de ses bases infracommunales. Ce sont des estimations par sondage ; les données par secteur portent sur les actifs qui y résident, quelle que soit leur commune de travail. Elles ne sont pas croisées ici avec leur destination professionnelle.

Les secteurs sont les IRIS statistiques de l’INSEE, dont les libellés peuvent différer des noms de quartiers d’usage. Les proximités reposent sur la Base adresse nationale et la BPE 2025 ; elles ne mesurent pas l’utilisation des équipements.

Les prix proviennent de prix-carburants.gouv.fr. Les stations prises en compte peuvent varier entre les semaines comparées.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | Semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | Semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,76 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,55 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | Rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Tableau — hausse retenue du gazole | +0,75 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue du SP95-E10 | +0,55 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — distance, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | Environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | Environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | Environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | Environ 200 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | Environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | Environ 460 € | `scenario.carburant.e10.35km` | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Pratiques locales — millésime | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques locales — travail dans la commune | 74 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques locales — voiture parmi les actifs habitant et travaillant à Béziers | 73 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Secteur Jean Jaurès — voiture | 36 % | `iris.voiture.min` | oui |
| Secteur Route de Bédarieux — voiture | 91 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Équipements — seuil de proximité | Moins de 500 m à vol d’oiseau | `iris.340320101.panier_500m`, `iris.340320601.panier_500m` | oui |
| Équipements — Jean Jaurès | Toutes les adresses : 100 % | `iris.340320101.panier_500m` | oui |
| Équipements — Iranget | Toutes les adresses : 100 % | `iris.340320601.panier_500m` | oui |
| Iranget — voiture | 84 % | `iris.340320601.voiture` | oui |
| Méthode — millésime des équipements | BPE 2025 | `iris.340320101.panier_500m`, `iris.340320601.panier_500m` — source des équipements précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Jean Jaurès et Route de Bédarieux | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication pour les hausses et le scénario.
- **`iris.ecart_voiture`** : relire les libellés Jean Jaurès, Route de Bédarieux et Iranget. L’article les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : la vérification du choix des communes regroupées est sans objet ici ; seule la destination Béziers est utilisée.

Aucun autre doute de lecture relevé.