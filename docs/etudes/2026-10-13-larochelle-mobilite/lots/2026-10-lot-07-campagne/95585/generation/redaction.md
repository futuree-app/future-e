## A. Question et format

**Question principale :** à Sarcelles, quels secteurs examiner lorsqu’on cherche un logement pour utiliser moins la voiture, au travail comme dans les déplacements du quotidien ?

L’écart entre Gare-Romain Rolland et Chardonnerettes Nord donne un repère pour orienter les recherches, puis examiner chaque adresse. La proximité du commerce, de la pharmacie et de l’école précise cette lecture sans expliquer les pratiques domicile-travail. Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.955850104.panier_500m`, `iris.955850112.panier_500m`. Le lieu de travail apporte un éclairage complémentaire : `mobpro.voiture_selon_destination.meme_commune`, `destination.95527.voiture`.

**Format retenu :** article court, avec l’ouverture carburant et deux visuels.

**Pistes écartées :** stationnement, statut d’occupation, actifs venant travailler dans la commune et comparaison nationale, qui disperseraient cette lecture centrée sur le choix d’un secteur et d’une adresse.

## B. Article

# Sarcelles : quel secteur regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,69 €/L et celui du SP95-E10 de 0,42 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Sarcelles. Pour qui cherche un logement, cette hausse remet les déplacements dans les critères de choix.

### Le surcoût selon la distance au travail

Le scénario suivant porte sur le carburant seul : consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et hausses arrondies à 5 centimes, soit +0,70 €/L pour le gazole et +0,40 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 250 € | environ 140 € |
| 35 km | environ 590 € | environ 340 € |

Pour choisir où chercher à Sarcelles, les pratiques locales donnent un autre repère : quelle place la voiture occupe-t-elle selon le secteur de résidence et le lieu de travail ?

### Des pratiques différentes selon le secteur

D’après le recensement de 2022, les transports en commun sont le mode principal pour aller travailler de 49 % des actifs résidant à Sarcelles, contre 40 % pour la voiture.

La moyenne communale masque des différences marquées. À Gare-Romain Rolland, la voiture est le mode principal de 20 % des actifs qui habitent le secteur ; à Chardonnerettes Nord, cette part atteint 56 %. Ces parts concernent les actifs du secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte aide à situer les annonces dans ces secteurs. Pour une recherche visant à moins conduire, Gare-Romain Rolland mérite ainsi d’être examiné, en confrontant chaque logement au déplacement professionnel envisagé.

Le lieu de travail apporte un éclairage distinct : parmi les actifs qui habitent et travaillent à Sarcelles, 39 % vont travailler principalement en voiture. Parmi ceux qui habitent Sarcelles et travaillent à Roissy-en-France, cette part est de 60 %. Dès la sélection d’une annonce, examinez la liaison avec votre lieu de travail et vos horaires habituels.

### Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel ne couvre qu’une partie des déplacements. Pour examiner le quotidien autour d’un logement, le dossier repère un panier réunissant un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

À Gare-Romain Rolland, toutes les adresses disposent de ce panier à proximité. À Chardonnerettes Nord, c’est le cas de 39 % des adresses. Dans ce dernier secteur, repérez donc séparément les équipements qui vous seraient utiles : l’absence du panier complet ne signifie pas l’absence de tout équipement.

Lors d’une visite, parcourez les chemins entre le logement et ces destinations. La proximité à vol d’oiseau sert à repérer ; le chemin réellement emprunté mérite d’être regardé sur place.

### Votre projet, votre adresse

Si votre déménagement doit vous permettre de moins conduire, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner la place qu’elle pourrait prendre dans votre quotidien.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les comparaisons portent sur des groupes distincts et ne mesurent pas l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil dans son secteur. Les distances sont à vol d’oiseau ; les points d’équipement correspondent aux adresses des établissements, pas nécessairement à leurs entrées.

Les prix médians proviennent du flux officiel prix-carburants.gouv.fr. Une station sans déclaration pendant la semaine n’entre pas dans la médiane. Le scénario illustre un surcoût annuel selon des hypothèses communes, sans l’attribuer à un secteur ou à une destination de travail.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario figurent en section 7 du dossier ; elles sont rattachées ci-dessous aux identifiants des scénarios concernés.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,69 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,42 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,40 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller court | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller intermédiaire | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 140 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller long | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 340 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime du recensement | 2022 | `mobpro.modes.tc`, `mobpro.modes.voiture`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — transports en commun | 49 % | `mobpro.modes.tc` | oui |
| Pratiques — voiture dans la commune | 40 % | `mobpro.modes.voiture` | oui |
| Pratiques — Gare-Romain Rolland | 20 % | `iris.voiture.min` | oui |
| Pratiques — Chardonnerettes Nord | 56 % | `iris.voiture.max` | oui |
| Destination — actifs habitant et travaillant à Sarcelles | 39 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination — actifs habitant Sarcelles et travaillant à Roissy-en-France | 60 % | `destination.95527.voiture` | oui |
| Équipements — seuil de proximité du panier | moins de 500 m à vol d’oiseau | `iris.955850104.panier_500m`, `iris.955850112.panier_500m` | oui |
| Équipements — Gare-Romain Rolland | toutes les adresses, soit 100 % | `iris.955850104.panier_500m` | oui |
| Équipements — Chardonnerettes Nord | 39 % des adresses | `iris.955850112.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.955850104.panier_500m`, `iris.955850112.panier_500m` — sources des équipements précisées dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Gare-Romain Rolland et Chardonnerettes Nord | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Le millésime des pratiques doit figurer sur la carte ; les semaines comparées doivent accompagner le tableau du scénario.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Gare-Romain Rolland et Chardonnerettes Nord. Ils sont présentés ici comme des secteurs statistiques.
- `mobpro.voiture_selon_destination` : relire le périmètre du groupe « habitent et travaillent à Sarcelles ». Le groupe automatique d’arrondissements parisiens n’est pas utilisé.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication ; elle concerne aussi le scénario.

Aucun autre doute de lecture relevé.