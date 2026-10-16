## A. Question et format

**Question principale :** que faut-il regarder dans le choix d’un secteur à Antibes pour utiliser moins la voiture, entre trajet professionnel et déplacements du quotidien ?

Les pratiques diffèrent fortement entre secteurs, mais la proximité des courses et de l’école mérite une lecture distincte. Pour une recherche de logement, ces observations invitent à examiner ensemble l’adresse envisagée et les déplacements du ménage, sans attribuer les pratiques au seul secteur.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `mobpro.travaille_dans_commune`, `destination.06004.voiture`, `iris.060040115.panier_500m`, `iris.060040102.panier_500m`.

**Format retenu : article court**, centré sur cette distinction. Le stationnement, la possession automobile, les actifs venant travailler à Antibes et la comparaison nationale sont écartés pour garder une progression resserrée.

## B. Article

# À Antibes, quel secteur examiner pour moins utiliser la voiture ?

**Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole a augmenté de 0,70 €/L et celui du SP95-E10 de 0,50 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Antibes. Pour qui cherche un logement, cette hausse invite à intégrer les déplacements au choix de l’adresse.**

Le scénario suivant retient une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et une hausse du prix du carburant arrondie à 5 centimes. Il chiffre un surcoût annuel de carburant selon la distance du trajet aller.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 60 € |
| 15 km | environ 250 € | environ 180 € |
| 35 km | environ 590 € | environ 420 € |

Ce scénario donne une raison de regarder les trajets avant de choisir un logement. À Antibes, les pratiques professionnelles présentent des écarts marqués selon le secteur de résidence.

## De la Vieille Ville aux Semboules, des pratiques différentes

D’après le recensement de 2022, la voiture est le mode principal pour aller travailler de 29 % des actifs occupés qui habitent le secteur Vieille Ville, contre 82 % dans celui des Semboules. Ces parts concernent les actifs de chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer les annonces dans cet éventail de pratiques. Pour préparer une visite, elle fournit un point de départ : quel déplacement professionnel devrez-vous examiner depuis ce logement ?

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui résident à Antibes, 52 % travaillent dans la commune même. Au sein de ce groupe, 58 % déclarent la voiture comme mode principal pour aller travailler. Si votre emploi est à Antibes, le choix du logement demande donc encore de regarder le trajet précis qui vous y reliera.

## Les courses et l’école appellent une autre lecture

Le trajet professionnel ne couvre qu’une partie des déplacements à envisager avant un déménagement. Pour les courses, la pharmacie ou l’école, le dossier permet de regarder ce qui se trouve près des adresses.

Le repère retenu réunit un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Dans le secteur Vieille Ville, la quasi-totalité des adresses dispose de cet ensemble à proximité. Aux Semboules, c’est le cas de 75 % des adresses, alors que la voiture domine les déplacements professionnels des actifs du secteur.

Pour votre recherche, cela conduit à examiner séparément les trajets vers le travail et ceux vers les équipements utiles au ménage. Aux Semboules notamment, la place de la voiture dans les pratiques professionnelles ne dispense pas de regarder ce qui est proche du logement.

Lors de la visite, vérifiez le chemin réel jusqu’aux équipements repérés : par où passe-t-il et où se trouve leur entrée ? La distance à vol d’oiseau sert à repérer une proximité ; le parcours sur place permet d’apprécier ce qu’elle représente pour votre quotidien.

## Votre projet, votre adresse

Si votre déménagement vise à réduire la place de la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour l’examiner dans son ensemble avant de choisir.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement INSEE, fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers d’usage. Les observations par secteur et par commune de travail ne sont pas croisées.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Dans chaque secteur, chaque adresse compte de la même façon. Les points d’équipements correspondent aux adresses des établissements.

Les prix proviennent des archives officielles de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré dans chaque semaine considérée. Une station sans déclaration durant une semaine n’entre pas dans sa médiane.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,70 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — fréquence annuelle | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` — millésime | oui |
| Pratiques — Vieille Ville | 29 % | `iris.voiture.min` | oui |
| Pratiques — Les Semboules | 82 % | `iris.voiture.max` | oui |
| Lieu de travail — actifs résidents travaillant à Antibes | 52 % | `mobpro.travaille_dans_commune` | oui |
| Lieu de travail — voiture parmi ces actifs | 58 % | `destination.06004.voiture` | oui |
| Équipements — rayon du panier | moins de 500 m à vol d’oiseau | `iris.060040115.panier_500m`, `iris.060040102.panier_500m` — définition de la colonne | oui |
| Équipements — Vieille Ville | « la quasi-totalité » — valeur source : 99,9 % | `iris.060040115.panier_500m` | oui |
| Équipements — Les Semboules | 75 % | `iris.060040102.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.060040115.panier_500m`, `iris.060040102.panier_500m` — source BPE | oui |

## D. Visuels et vérifications restantes

| Nom exact du visuel | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune. Tableau reproduit dans l’article. |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de la voiture en Vieille Ville et aux Semboules | Aucune pour la production : classes automatiques et repères numérotés accompagnés de leur liste. Placement manuel des libellés seulement pour une version soignée. Classes à relire conformément à l’état du visuel. |

Vérifications avant publication concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés INSEE « Vieille Ville » et « Les Semboules », employés ici comme noms de secteurs statistiques.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario de surcoût.

Aucun autre doute de lecture relevé sur les faits retenus.