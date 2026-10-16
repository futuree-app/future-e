## A. Question et format

**Question principale :** à Pantin, que regarder dans le secteur et autour d’une adresse pour utiliser moins la voiture, même en la conservant ?

Une voiture disponible dans le ménage n’est pas nécessairement le mode principal pour travailler (`mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture`). Les pratiques diffèrent entre Petit Pantin et Courtillières Sud (`iris.voiture.min`, `iris.voiture.max`), alors que toutes leurs adresses disposent du panier d’équipements à proximité (`iris.930550402.panier_500m`, `iris.930550102.panier_500m`). Pour choisir un logement, cela invite à examiner séparément les trajets professionnels et les besoins du quotidien, notamment dans un secteur où ce panier est moins largement présent (`iris.930550202.panier_500m`).

**Format retenu : article court.** Les destinations de travail sont laissées de côté faute de croisement avec les secteurs ; le stationnement, les statuts d’occupation et le repère intercommunal n’apportent pas d’éclairage indispensable à cette question.

## B. Article

# À Pantin, choisir une adresse pour moins prendre la voiture

**Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,61 €/L et celui du SP95-E10 de 0,34 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Pantin. Pour un projet de déménagement, cette hausse invite à examiner la place des déplacements en voiture.**

Le scénario suivant porte sur le carburant seul. Il repose sur une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**, avec des hausses arrondies à **5 centimes** : **+0,60 €/L** pour le gazole et **+0,35 €/L** pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 70 € | environ 40 € |
| 15 km | environ 220 € | environ 130 € |
| 35 km | environ 500 € | environ 290 € |

À Pantin, que regarder dans une annonce et pendant une visite pour utiliser moins la voiture, même si l’on souhaite la garder ?

## Garder une voiture sans la prendre pour travailler

Dans les pratiques du recensement de **2022**, **17 % des actifs résidant à Pantin** déclarent la voiture comme mode principal pour travailler, contre **59 % les transports en commun**.

Même parmi les actifs dont le ménage possède au moins une voiture, **73 % ne la déclarent pas comme mode principal pour travailler**, travail à domicile compris. Si vous envisagez de conserver votre véhicule, ses usages méritent donc d’être examinés séparément : le travail, les courses ou les autres déplacements de la semaine.

Les pratiques varient aussi selon le secteur de résidence. La voiture est le mode principal pour travailler de **11 % des actifs qui habitent Petit Pantin**, contre **29 % de ceux qui habitent Courtillières Sud**, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Les courses et l’école, à regarder autour du logement

Pour choisir une adresse, les trajets professionnels ne couvrent qu’une partie des déplacements à examiner. La proximité des équipements apporte un autre éclairage.

À Petit Pantin comme à Courtillières Sud, **toutes les adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Cette proximité se retrouve donc dans des secteurs aux pratiques domicile-travail différentes.

Dans le secteur Quatre Chemin-SNCF, **47 % des adresses** disposent de ce panier complet. Pour une annonce dans ce secteur, repérez séparément les équipements qui vous intéressent autour du logement : l’absence du panier complet ne signifie pas l’absence de tout équipement.

Pendant la visite, examinez les cheminements vers ces lieux. Pour le travail, vérifiez séparément le trajet depuis l’adresse envisagée, aux horaires qui sont les vôtres.

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou vous installer en famille, précisez la place que vous souhaitez laisser à la voiture. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de ce qui compte pour votre choix.

## Méthode et sources

Les pratiques professionnelles et l’équipement automobile proviennent du recensement de l’INSEE. Les parts domicile-travail portent sur les actifs occupés et leur mode principal ; leur dénominateur inclut ceux qui travaillent à domicile. Ces données sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels. Les équipements proviennent de la BPE **2025** de l’INSEE et les adresses de la Base adresse nationale. Les parts citées par secteur comptent chaque adresse de la même façon. Les distances à vol d’oiseau vont au point de l’établissement, pas nécessairement à son entrée, et ne décrivent pas le cheminement réel.

Les prix viennent du flux officiel de prix-carburants.gouv.fr : pour chaque semaine, la médiane porte sur le dernier prix déclaré par chaque station. Les stations déclarantes peuvent varier d’une semaine à l’autre.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | Semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | Semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,61 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,34 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | Rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,35 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 40 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 130 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 290 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.voiture`, `mobpro.modes.tc`, `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Pratiques — voiture | 17 % | `mobpro.modes.voiture` | oui |
| Pratiques — transports en commun | 59 % | `mobpro.modes.tc` | oui |
| Pratiques — actifs d’un ménage motorisé | 73 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Secteurs — Petit Pantin | 11 % | `iris.voiture.min` | oui |
| Secteurs — Courtillières Sud | 29 % | `iris.voiture.max` | oui |
| Équipements — toutes les adresses de Petit Pantin | toutes — valeur exacte : 100 % | `iris.930550402.panier_500m` | oui |
| Équipements — toutes les adresses de Courtillières Sud | toutes — valeur exacte : 100 % | `iris.930550102.panier_500m` | oui |
| Équipements — seuil de proximité | moins de 500 m à vol d’oiseau | `iris.930550402.panier_500m`, `iris.930550102.panier_500m` | oui |
| Équipements — Quatre Chemin-SNCF | 47 % | `iris.930550202.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.930550402.panier_500m`, `iris.930550102.panier_500m`, `iris.930550202.panier_500m` — source des équipements indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Petit Pantin et Courtillières Sud | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée |

Le millésime des pratiques devra figurer sur la carte ; les périodes de prix et les hypothèses devront accompagner le tableau.

Vérifications de la section 10 concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne également le scénario.
- **`iris.ecart_voiture`** : relire les libellés des secteurs cités, notamment « Quatre Chemin-SNCF ». Ils sont présentés dans le texte comme des secteurs statistiques. Contrôler aussi les libellés portés sur la carte.