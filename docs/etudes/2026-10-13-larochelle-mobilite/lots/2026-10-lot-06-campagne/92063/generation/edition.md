## A. Question et format

**Question principale :** à Rueil-Malmaison, comment orienter sa recherche de logement pour utiliser moins la voiture, en examinant les trajets professionnels et la proximité des besoins quotidiens ?

Le contraste entre secteurs invite à regarder où se situe chaque annonce (`iris.voiture.min`, `iris.voiture.max`). Le cas de Fouilleuse 3 apporte une seconde lecture : la proximité des équipements et les pratiques domicile-travail doivent être examinées séparément (`iris.920630603.panier_500m`, `iris.920630603.voiture`). Les pratiques des actifs qui habitent et travaillent dans la commune complètent cette question (`destination.92063.voiture`, `destination.92063.marche`).

**Format retenu : article court**, avec l’ouverture carburant imposée et deux visuels.

Pistes écartées : stationnement, statut d’occupation et actifs venant travailler dans la commune, qui disperseraient le propos ; comparaison intercommunale, moins utile ici que les contrastes locaux.

## B. Article

# À Rueil-Malmaison, quelle adresse choisir pour moins prendre la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole a augmenté de 0,66 €/L et celui du SP95-E10 de 0,23 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Rueil-Malmaison. Cette hausse donne une raison concrète d’examiner les déplacements associés à un futur logement.

Le scénario ci-dessous illustre le surcoût annuel de carburant selon la distance domicile-travail. Il retient une consommation de 6 L/100 km, 200 allers-retours par an et des hausses médianes arrondies à 5 centimes : +0,65 €/L pour le gazole et +0,25 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour savoir quels déplacements pourraient prendre moins de place en voiture dans votre projet, il faut ensuite regarder les pratiques locales et la situation du logement.

## Des pratiques différentes selon le secteur

Les pratiques domicile-travail décrites ici sont celles du recensement de 2022. À Plaine-Gare 1, la voiture est le mode principal pour aller travailler de 25 % des actifs qui habitent le secteur ; à Buzenval 4, cette part atteint 64 %.

Ces contrastes donnent une raison de situer précisément les annonces qui vous intéressent. La carte permet de regarder les pratiques du secteur autour d’un logement envisagé, plutôt que de s’en tenir à une appréciation de toute la commune.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui habitent et travaillent à Rueil-Malmaison, 32 % utilisent principalement la voiture et 26 % la marche. Si votre déménagement vise à vous rapprocher de votre emploi, examinez le trajet entre les adresses du logement et du travail, même lorsqu’elles appartiennent à la même commune.

## Courses et école : revenir à l’adresse

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour chercher un logement où moins prendre la voiture, les courses, la pharmacie ou l’école méritent aussi leur place dans l’examen.

À Fouilleuse 3, la quasi-totalité des adresses dispose à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. Dans ce secteur, la voiture est le mode principal pour aller travailler de 50 % des actifs résidents.

Ces observations conduisent à regarder séparément les services proches du logement et le trajet professionnel. Pendant une visite, repérez les chemins vers les équipements qui vous intéressent et leur entrée : la proximité mesurée à vol d’oiseau constitue un premier repère pour cet examen.

## Partir de votre projet

Vous rapprocher du travail ou vous installer en famille peut être l’occasion de donner moins de place à la voiture dans votre quotidien. Avec futur•e, explorez l’adresse que vous envisagez à partir de ce projet et de ce qui compte dans votre choix de logement.

## Méthode et sources

Les pratiques proviennent de l’INSEE, fichier Mobilités professionnelles et bases infracommunales Activité des résidents et Logement. Elles portent sur les actifs occupés ; les parts sectorielles concernent ceux qui habitent le secteur, quelle que soit leur commune de travail. Les résultats sont des estimations par sondage : les groupes observés sont distincts et leurs écarts ne mesurent pas l’effet d’un déménagement. Les libellés des secteurs statistiques IRIS peuvent différer des noms de quartiers usuels.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de 2025. Elle concerne les adresses, et les points représentent les adresses des établissements. Les prix proviennent de prix-carburants.gouv.fr : médianes des derniers prix déclarés par station pendant chaque semaine retenue.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,66 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,23 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,25 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 30 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 90 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 210 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.92063.voiture` | oui |
| Pratiques — libellé de secteur | Plaine-Gare 1 | `iris.voiture.min` | oui |
| Pratiques — voiture à Plaine-Gare | 25 % | `iris.voiture.min` | oui |
| Pratiques — libellé de secteur | Buzenval 4 | `iris.voiture.max` | oui |
| Pratiques — voiture à Buzenval | 64 % | `iris.voiture.max` | oui |
| Travail dans la commune — voiture | 32 % | `destination.92063.voiture` | oui |
| Travail dans la commune — marche | 26 % | `destination.92063.marche` | oui |
| Équipements — libellé de secteur | Fouilleuse 3 | `iris.920630603.panier_500m`, `iris.920630603.voiture` | oui |
| Équipements — couverture du panier | « la quasi-totalité » — valeur source : 99,7 % | `iris.920630603.panier_500m` | oui |
| Équipements — distance du panier | moins de 500 m à vol d’oiseau | `iris.920630603.panier_500m` | oui |
| Équipements — voiture dans ce secteur | 50 % | `iris.920630603.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920630603.panier_500m` — source BPE définie dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | En ouverture, après les hypothèses ; tableau fourni dans l’article | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Plaine-Gare 1 et Buzenval 4 | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Placement manuel des libellés seulement pour une version soignée |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Plaine-Gare 1, Buzenval 4 et Fouilleuse 3. Ils sont présentés comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication ; elle concerne aussi le scénario de surcoût.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
