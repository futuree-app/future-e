## A. Question et format

**Question principale :** à Courbevoie, que regarder au-delà de la proximité des commerces et de l’école pour chercher un logement permettant d’utiliser moins la voiture ?

Les secteurs Dominos et Sainte-Marie présentent des pratiques domicile-travail très différentes, alors que toutes leurs adresses ont le panier d’équipements étudié à proximité. Le lecteur apprend ainsi à distinguer proximité des équipements, pratiques du secteur et liaison vers son propre travail.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.920260506.panier_500m`, `iris.920260705.panier_500m`, `destination.92062.voiture`, `destination.92050.voiture`. L’ouverture mobilise `carburant.gazole.ecart`, `carburant.e10.ecart` et les six faits `scenario.carburant.*`.

**Format retenu :** article court. Le stationnement, les différences selon le statut d’occupation, le repère intercommunal et les flux entrants sont écartés pour garder le fil entre adresse, équipements et travail.

## B. Article

# Moins utiliser la voiture à Courbevoie : que regarder au-delà des commerces proches ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,63 €/L et celui du SP95-E10 de 0,20 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Courbevoie. Cette hausse remet les déplacements dans les critères d’une recherche de logement.

Le tableau suivant illustre le surcoût annuel selon la distance domicile-travail. Hypothèses : une consommation de 6 L/100 km, 200 allers-retours par an et des hausses arrondies à 5 centimes. Le scénario porte sur le carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Gazole : hausse retenue de 0,65 €/L | SP95-E10 : hausse retenue de 0,20 €/L |
|---|---:|---:|
| 5 km | environ 80 €/an | environ 20 €/an |
| 15 km | environ 230 €/an | environ 70 €/an |
| 35 km | environ 550 €/an | environ 170 €/an |

À Courbevoie, chercher où moins prendre la voiture invite à regarder au-delà de la proximité des commerces : des secteurs équipés présentent des pratiques très différentes.

## Dominos et Sainte-Marie : des pratiques contrastées

Au recensement de 2022, la voiture est le mode principal pour aller travailler de 9 % des actifs occupés habitant le secteur Dominos, contre 35 % à Sainte-Marie. Ces parts concernent les actifs qui résident dans chaque secteur, quelle que soit leur commune de travail. Ce sont les valeurs la plus basse et la plus élevée parmi les secteurs d’habitat retenus.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail au recensement de 2022.*

La carte permet de situer les annonces qui vous intéressent parmi ces pratiques locales. Le lieu de travail apporte un autre repère : parmi les actifs résidant à Courbevoie qui travaillent à Puteaux, 11 % déclarent la voiture comme mode principal ; cette part est de 28 % parmi ceux qui travaillent à Nanterre.

Pour examiner un logement, regardez donc aussi la liaison vers votre propre lieu de travail, avec vos horaires.

## Pour les courses et l’école, regarder le chemin depuis le logement

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour une recherche en famille, notamment, la proximité des courses et de l’école mérite un examen à part.

À Dominos comme à Sainte-Marie, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Ce critère de proximité ne départage donc pas ces secteurs, malgré leurs pratiques différentes pour aller travailler.

Lors de la visite, suivez le chemin vers les commerces que vous comptez utiliser et, si vous cherchez en famille, vers l’école envisagée. Regardez les traversées et l’entrée réelle de l’établissement : c’est le parcours depuis le logement qui vous intéresse.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou vous installer en famille, partez de ce que vous voulez changer au quotidien. Sur futur•e, explorez l’adresse envisagée à partir de votre projet, pour la considérer dans son ensemble avant de vous décider.

## Méthode et sources

Les pratiques domicile-travail concernent les actifs occupés de 15 ans ou plus ; le dénominateur inclut ceux qui travaillent à domicile. Sources : INSEE, fichier MOBPRO et bases infracommunales. Les résultats sont des estimations par sondage. Les groupes selon la commune de travail sont distincts ; les données ne croisent pas secteur de résidence et commune de travail.

Les secteurs sont les IRIS de l’INSEE, dont les noms peuvent différer des quartiers d’usage. La proximité des équipements repose sur la BAN et la BPE 2025 : elle mesure une distance à vol d’oiseau jusqu’à l’adresse de l’établissement, sans établir son usage. Les prix du carburant proviennent de prix-carburants.gouv.fr.

## C. Correspondance interne — non publiée

Les identifiants de scénario renvoient également aux hypothèses communes explicitées en section 7 du dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,63 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, désignation du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,20 €/L | `carburant.e10.ecart` | oui |
| Chapeau, rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Hypothèses, distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Hypothèses, allers-retours annuels | 200 | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Hypothèses, arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Tableau, hausse retenue du gazole | 0,65 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau, désignation du carburant | SP95-E10 | `scenario.carburant.e10.5km` | oui |
| Tableau, hausse retenue du SP95-E10 | 0,20 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole, première distance | environ 80 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10, première distance | environ 20 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau, deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole, deuxième distance | environ 230 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10, deuxième distance | environ 70 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau, troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole, troisième distance | environ 550 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10, troisième distance | environ 170 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques, millésime du recensement | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.92062.voiture`, `destination.92050.voiture` | oui |
| Pratiques, voiture à Dominos | 9 % | `iris.voiture.min` | oui |
| Pratiques, voiture à Sainte-Marie | 35 % | `iris.voiture.max` | oui |
| Légende de la carte, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques, travail à Puteaux | 11 % | `destination.92062.voiture` | oui |
| Pratiques, travail à Nanterre | 28 % | `destination.92050.voiture` | oui |
| Équipements, couverture des adresses des deux secteurs | toutes les adresses — 100 % dans chaque secteur | `iris.920260506.panier_500m`, `iris.920260705.panier_500m` | oui |
| Équipements, seuil de proximité | moins de 500 m | `iris.920260506.panier_500m`, `iris.920260705.panier_500m` | oui |
| Méthode, âge des actifs | 15 ans ou plus | `iris.voiture.min`, `iris.voiture.max`, `destination.92062.voiture`, `destination.92050.voiture` | oui |
| Méthode, millésime des équipements | 2025 | `iris.920260506.panier_500m`, `iris.920260705.panier_500m` — source des équipements | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Dominos et Sainte-Marie | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

**Vérifications avant publication :**

- `iris.ecart_voiture` : relire les libellés Dominos et Sainte-Marie. Ils sont employés dans l’article comme noms de secteurs statistiques.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario de surcoût.