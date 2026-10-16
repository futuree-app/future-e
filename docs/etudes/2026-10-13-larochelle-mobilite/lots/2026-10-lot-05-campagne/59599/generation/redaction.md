## A. Question et format

**Question principale :** à Tourcoing, comment choisir un secteur pour moins utiliser la voiture, sans confondre équipements proches et trajets de travail ?

Le dossier montre des pratiques très différentes selon les secteurs, mais aussi un secteur entièrement couvert par le panier quotidien où la voiture reste largement utilisée pour travailler. Pour une recherche de logement, cela invite à examiner séparément les déplacements de proximité et la liaison avec son emploi.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.595990902.panier_500m`, `iris.595990302.panier_500m`, `iris.595990302.voiture`, `destination.59599.voiture`, `destination.59009.voiture`.

**Format retenu : article court**, avec l’ouverture carburant obligatoire. Pistes écartées : comparaison nationale, stationnement, statut d’occupation et flux entrants, qui disperseraient la question ; bus, dont les faits sont inutilisables.

## B. Article

# À Tourcoing, choisir son adresse pour moins prendre la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,74 €/L, celui du SP95-E10 de 0,47 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Tourcoing. Pour qui cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements associés à chaque adresse.

## Le surcoût selon la distance au travail

Le scénario suivant retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,45 €/L pour le SP95-E10. Il porte sur le carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 50 € |
| 15 km | environ 270 € | environ 160 € |
| 35 km | environ 630 € | environ 380 € |

Ce scénario ne correspond à aucun secteur particulier. À Tourcoing, quels repères les pratiques locales donnent-elles pour chercher une adresse où moins utiliser la voiture ?

## Le secteur et le lieu de travail à examiner ensemble

Les pratiques domicile-travail du recensement 2022 montrent des différences marquées. Parmi les actifs occupés qui habitent le secteur Hôtel de Ville, 51 % déclarent la voiture comme mode principal pour travailler ; cette part atteint 86 % au Bois d’Achelles. Ces proportions concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte aide à repérer les secteurs à examiner lors des recherches. Pour apprécier une annonce, il faut aussi garder sa destination professionnelle en tête : parmi les actifs qui habitent et travaillent à Tourcoing, 57 % vont principalement travailler en voiture. Parmi ceux qui habitent Tourcoing et travaillent à Villeneuve-d’Ascq, cette part est de 78 %.

## Des équipements proches, des pratiques différentes

Le trajet professionnel ne couvre pas toutes les sorties à envisager depuis un logement. Pour les courses et l’école, la proximité des équipements apporte un autre repère.

Dans le secteur Hôtel de Ville, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Toutes les adresses du secteur Brun Pain réunissent également ces proximités ; la voiture y est le mode principal de 77 % des actifs pour aller travailler.

Un logement proche de ces équipements mérite donc un examen distinct de la liaison avec le travail. Lors d’une visite à Brun Pain ou à Hôtel de Ville, regardez le chemin réel depuis l’adresse jusqu’aux équipements qui vous intéressent, notamment les traversées et les accès. Examinez aussi le déplacement vers votre lieu de travail aux horaires qui vous concernent.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou vous installer en famille en utilisant moins la voiture, partez de ce que vous souhaitez changer dans votre quotidien. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, en la regardant dans son ensemble.

## Méthode et sources

Les pratiques proviennent du recensement de l’INSEE : fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les comparaisons décrivent des groupes distincts, sans mesurer l’effet d’un déménagement. Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers employés localement.

Les proximités reposent sur la Base adresse nationale et la Base permanente des équipements 2025 de l’INSEE ; elles ne renseignent pas l’usage des établissements. Les prix viennent du flux officiel prix-carburants.gouv.fr : chaque médiane utilise le dernier prix déclaré par chaque station pendant la semaine considérée.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,47 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Scénario — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Scénario — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Scénario — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Scénario — hausse retenue, gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Scénario — hausse retenue, SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10 | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10 | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10 | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.59599.voiture`, `destination.59009.voiture` | oui |
| Pratiques — Hôtel de Ville | 51 % | `iris.voiture.min` | oui |
| Pratiques — Bois d’Achelles | 86 % | `iris.voiture.max` | oui |
| Pratiques — résidence et travail à Tourcoing | 57 % | `destination.59599.voiture` | oui |
| Pratiques — travail à Villeneuve-d’Ascq | 78 % | `destination.59009.voiture` | oui |
| Équipements — Hôtel de Ville | « toutes les adresses » : 100 % | `iris.595990902.panier_500m` | oui |
| Équipements — seuil de proximité | moins de 500 m à vol d’oiseau | `iris.595990902.panier_500m`, `iris.595990302.panier_500m` | oui |
| Équipements — Brun Pain | « toutes les adresses » : 100 % | `iris.595990302.panier_500m` | oui |
| Équipements — voiture à Brun Pain | 77 % | `iris.595990302.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.595990902.panier_500m`, `iris.595990302.panier_500m` — source BPE indiquée au dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste Hôtel de Ville / Bois d’Achelles | Aucune pour la production : classes automatiques et secteurs cités repérés avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Hôtel de Ville, Bois d’Achelles et Brun Pain. Le texte les désigne comme des secteurs statistiques.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations ; vérification obligatoire avant publication pour les hausses et le scénario.

Aucun autre doute de lecture identifié.