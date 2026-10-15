## A. Question et format

**Question principale :** à Reims, comment articuler le choix du secteur, le trajet professionnel et la proximité des services pour chercher un logement en utilisant moins la voiture ?

Le dossier montre que des services proches peuvent coexister avec un usage important de la voiture pour travailler. Pour une recherche de logement, cela invite à examiner séparément les déplacements professionnels et les besoins autour de l’adresse.

Appuis : `mobpro.travaille_dans_commune`, `destination.51454.voiture`, `iris.voiture.min`, `iris.voiture.max`, `iris.514544502.voiture`, `iris.514544502.panier_500m`, `iris.514540302.panier_500m`.

**Format retenu : article court**, ouvert par la hausse datée du carburant et son scénario de surcoût.

**Pistes écartées :** stationnement, statut d’occupation, comparaison nationale et flux entrants, qui disperseraient la question ; desserte locale en bus, dont les indicateurs sont inutilisables.

## B. Article

# À Reims, quelle adresse choisir pour moins prendre la voiture ?

Entre la semaine du **6 octobre 2025** et celle du **5 octobre 2026**, le prix médian du gazole augmente de **0,76 €/L**, et celui du SP95-E10 de **0,50 €/L**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Reims. Pour qui cherche un logement, cette hausse remet les déplacements dans la discussion.

Le scénario suivant retient une consommation de **6 L/100 km**, **200 allers-retours domicile-travail par an** et des hausses arrondies à **5 centimes** : **+0,75 €/L** pour le gazole et **+0,50 €/L** pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel de carburant — hausse entre les semaines du 6 octobre 2025 et du 5 octobre 2026.*

| Distance du trajet aller | Gazole | SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

Qu’aimeriez-vous changer dans vos trajets en déménageant ? À Reims, les pratiques domicile-travail et la proximité des services apportent des éclairages différents sur le choix d’une adresse.

## Travailler à Reims laisse entière la question du trajet

Au recensement de **2022**, **73 %** des actifs occupés résidant à Reims travaillent dans la commune. Parmi les actifs qui habitent et travaillent à Reims, **57 %** déclarent la voiture comme mode principal pour aller travailler.

Le secteur de résidence mérite aussi qu’on s’y arrête. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la part de la voiture comme mode principal va de **40 % à Centre Erlon Est** à **90 % à Murigny Sud-Est**.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur — recensement 2022.*

Pour préparer une visite, ces observations donnent une raison de préciser le trajet entre le logement et votre lieu de travail, même si le logement et votre lieu de travail sont tous deux à Reims.

## Courses et école : une autre lecture de l’adresse

Le travail n’est qu’une partie des déplacements à envisager. Pour les courses, l’école ou la pharmacie, les données font apparaître un contraste utile.

À **Murigny Sud-Centre**, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Dans ce secteur, **81 %** des actifs déclarent la voiture comme mode principal pour aller travailler.

À **Centre Erlon Est**, **61 %** des adresses réunissent ce même ensemble à cette distance. La proximité des services et les pratiques professionnelles se lisent donc séparément dans une recherche de logement.

Pour une annonce à Centre Erlon Est, repérez les équipements utiles autour de l’adresse précise. Quel que soit le secteur, examinez aussi les possibilités pour rejoindre votre travail. Lors de la visite, parcourez les chemins vers les services dont vous aurez besoin.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou vous installer en famille, partez de ce que vous souhaitez changer dans vos journées. Avec futur•e, explorez l’adresse envisagée à partir de ce projet.

### Méthode et sources

Sources : INSEE, fichier MOBPRO et bases infracommunales ; Base adresse nationale et Base permanente des équipements (INSEE, 2025) ; prix-carburants.gouv.fr. Les pratiques professionnelles proviennent du recensement et d’estimations par sondage. Les secteurs sont des IRIS statistiques, dont les noms ne correspondent pas toujours aux quartiers d’usage. Les groupes comparés sont distincts : leurs écarts ne mesurent pas l’effet d’un déménagement. Les proximités ne décrivent ni les chemins réels ni l’usage des équipements. Le scénario porte sur le carburant seul ; la comparaison des prix n’a pas été contrôlée à stations constantes.

## C. Correspondance interne — non publiée

Les identifiants des scénarios renvoient également aux hypothèses communes données en section 7 du dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture, hausse du gazole | 0,76 €/L | `carburant.gazole.ecart` | oui |
| Ouverture, hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Ouverture, périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses, déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses, hausse retenue du gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses, hausse retenue du SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau, distance du trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, surcoût gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, surcoût SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau, distance du trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, surcoût gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, surcoût SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau, distance du trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, surcoût gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, surcoût SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime | 2022 | `mobpro.travaille_dans_commune`, `destination.51454.voiture` | oui |
| Actifs résidents travaillant à Reims | 73 % | `mobpro.travaille_dans_commune` | oui |
| Voiture parmi les actifs habitant et travaillant à Reims | 57 % | `destination.51454.voiture` | oui |
| Voiture à Centre Erlon Est | 40 % | `iris.voiture.min` | oui |
| Voiture à Murigny Sud-Est | 90 % | `iris.voiture.max` | oui |
| Légende de la carte, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Panier à Murigny Sud-Centre | 100 %, écrit « toutes les adresses » | `iris.514544502.panier_500m` | oui |
| Distance du panier d’équipements | 500 m à vol d’oiseau | `iris.514544502.panier_500m`, `iris.514540302.panier_500m` | oui |
| Voiture à Murigny Sud-Centre | 81 % | `iris.514544502.voiture` | oui |
| Panier à Centre Erlon Est | 61 % | `iris.514540302.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Nom exact du visuel | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. Tableau disponible, reproduit dans l’article. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Centre Erlon Est et Murigny Sud-Est | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Pose manuelle des libellés seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés des secteurs cités. Ils sont présentés ici comme secteurs statistiques.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication et concerne également le scénario.

Aucun doute supplémentaire de lecture relevé.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : conseil rattaché au secteur | À Murigny Sud-Centre, examinez aussi les possibilités pour rejoindre votre travail. | Quel que soit le secteur, examinez aussi les possibilités pour rejoindre votre travail. |
| Raisonnement — a_revoir : lien implicite entre services et pratiques professionnelles | Dans ce secteur, **81 %** des actifs déclarent pourtant la voiture | Dans ce secteur, **81 %** des actifs déclarent la voiture |
| Consigne interne — a_revoir : référence au dossier | le dossier fait apparaître un contraste utile | les données font apparaître un contraste utile |
| Méthode — a_revoir : millésime de la BPE absent | Base adresse nationale et Base permanente des équipements | Base adresse nationale et Base permanente des équipements (INSEE, 2025) |
| Lisibilité — a_revoir : référent ambigu et lieu de travail supposé | au-delà de leur présence dans la même commune | même si le logement et votre lieu de travail sont tous deux à Reims |