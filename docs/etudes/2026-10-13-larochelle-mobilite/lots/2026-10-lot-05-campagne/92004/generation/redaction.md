## A. Question et format

**Question principale :** à Asnières-sur-Seine, la proximité des équipements du quotidien permet-elle de repérer les secteurs où la voiture est moins utilisée pour travailler ?

Les secteurs Flachat I et Grésillons II présentent des pratiques domicile-travail différentes, alors que leur panier d’équipements est proche de toutes ou presque toutes leurs adresses. Pour une recherche de logement, cela invite à examiner séparément le trajet professionnel et les déplacements du quotidien.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.920040101.panier_500m`, `iris.920040502.panier_500m` ; contexte communal : `mobpro.modes.tc`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les faits `scenario.carburant.*`.

**Format retenu : article court.** Les comparaisons entre villes, la motorisation, le stationnement et les destinations professionnelles détaillées sont écartés pour concentrer le texte sur ce rapprochement entre pratiques par secteur et proximité des équipements.

## B. Article

# À Asnières-sur-Seine, des équipements proches, des pratiques de la voiture différentes

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,62 €/L et celui du SP95-E10 de 0,20 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Asnières-sur-Seine. Cette hausse donne une raison concrète d’examiner la place des déplacements dans le choix d’un logement.

## Ce que la hausse représente selon la distance

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses médianes sont arrondies à 5 centimes : +0,60 €/L pour le gazole et +0,20 €/L pour le SP95-E10. Il s’agit du surcoût de carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre les semaines du 6 octobre 2025 et du 5 octobre 2026.*

| Distance du trajet aller | Gazole : surcoût annuel | SP95-E10 : surcoût annuel |
|---|---:|---:|
| 5 km | environ 70 € | environ 20 € |
| 15 km | environ 220 € | environ 70 € |
| 35 km | environ 500 € | environ 170 € |

Lorsqu’on cherche un logement à Asnières-sur-Seine, les pratiques par secteur apportent un autre repère : quelle place la voiture occupe-t-elle dans les déplacements vers le travail ?

## Des pratiques différentes selon le secteur

Dans les pratiques du recensement 2022, les transports en commun sont le mode principal pour aller travailler de 57 % des actifs résidant à Asnières-sur-Seine.

La voiture occupe une place différente selon le secteur : elle est le mode principal de 13 % des actifs résidant à Flachat I, contre 33 % à Grésillons II, quelle que soit leur commune de travail. Ce sont les parts la plus basse et la plus élevée parmi les secteurs étudiés.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur. Source : INSEE, recensement 2022.*

Pour examiner une annonce, cette carte aide à situer les pratiques du secteur. Le trajet vers votre propre lieu de travail reste à examiner depuis l’adresse envisagée.

## Les courses et l’école posent une autre question

Le trajet professionnel ne couvre pas les autres déplacements du ménage. Pour ceux-ci, la proximité des équipements apporte un éclairage complémentaire.

À Flachat I, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. C’est aussi le cas de 96 % des adresses à Grésillons II. La présence de ce panier à proximité coexiste donc avec des pratiques différentes de la voiture pour travailler.

Lors d’une visite, parcourez les chemins vers les équipements qui vous intéressent : les traversées et l’accès à l’établissement permettent de donner un sens concret à cette proximité.

## Votre projet, votre adresse

Si votre déménagement vise à réduire la place de la voiture, partez des déplacements que vous souhaitez changer et de ceux que vous voulez conserver. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour l’examiner dans l’ensemble de votre choix de vie.

## Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les secteurs comparés regroupent des personnes distinctes. Les secteurs sont des IRIS statistiques, dont les noms ne correspondent pas toujours aux quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements 2025 de l’INSEE. Dans chaque secteur, chaque adresse compte de manière égale. La proximité ne renseigne pas sur l’usage des établissements.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : pour chaque semaine, la médiane porte sur le dernier prix déclaré par chaque station participante.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture — début de période | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture — fin de période | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture — hausse du gazole | 0,62 €/L | `carburant.gazole.ecart` | oui |
| Ouverture — hausse du SP95-E10 | 0,20 €/L | `carburant.e10.ecart` | oui |
| Ouverture — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — gazole | +0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — SP95-E10 | +0,20 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — début de période | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — fin de période | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 20 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 70 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 170 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales — millésime | recensement 2022 | `mobpro.modes.tc`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques locales — transports en commun | 57 % | `mobpro.modes.tc` | oui |
| Pratiques locales — Flachat I | 13 % | `iris.voiture.min` | oui |
| Pratiques locales — Grésillons II | 33 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | recensement 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Équipements — Flachat I | toutes les adresses, soit la valeur exacte de 100 % | `iris.920040101.panier_500m` | oui |
| Équipements — seuil de proximité | moins de 500 m à vol d’oiseau | `iris.920040101.panier_500m`, `iris.920040502.panier_500m` | oui |
| Équipements — Grésillons II | 96 % des adresses | `iris.920040502.panier_500m` | oui |
| Méthode — équipements | Base permanente des équipements 2025 | `iris.920040101.panier_500m`, `iris.920040502.panier_500m` — source des faits d’accès | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Après les hypothèses du scénario, au début de l’article | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Flachat I et Grésillons II | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Flachat I et Grésillons II. Le texte les présente comme des secteurs statistiques.

Aucun autre doute de lecture relevé.