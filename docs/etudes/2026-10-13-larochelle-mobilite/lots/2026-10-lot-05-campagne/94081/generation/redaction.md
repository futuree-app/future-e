## A. Question et format

**Question principale :** comment départager des secteurs bien équipés lorsque l’on cherche un logement pour utiliser moins la voiture ?

Robespierre et Porte du Midi présentent des pratiques domicile-travail nettement différentes, alors que toutes leurs adresses disposent du panier d’équipements à proximité. Ce rapprochement aide le lecteur à examiner ensemble les déplacements vers le travail et les destinations du quotidien, sans attribuer les pratiques aux seuls équipements.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.940810308.panier_500m`, `iris.940810104.panier_500m` et `mobpro.voiture_selon_destination.meme_commune`. L’ouverture s’appuie sur les faits `carburant.*` et le scénario fourni.

**Format retenu : article court.** Le stationnement, la motorisation des ménages et les flux entrants sont écartés pour garder ce fil ; la comparaison nationale, proche de la médiane, ne l’éclaire pas davantage.

## B. Article

# Utiliser moins la voiture à Vitry-sur-Seine : regarder les trajets et les équipements

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,64 €/L et celui du SP95-E10 de 0,37 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Vitry-sur-Seine. Pour une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite faire autrement.

Le scénario ci-dessous chiffre le **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Il retient les hausses observées arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre les semaines du 6 octobre 2025 et du 5 octobre 2026.*

| Trajet aller | Gazole : hausse retenue de +0,65 €/L | SP95-E10 : hausse retenue de +0,35 €/L |
|---|---:|---:|
| 5 km | environ 80 €/an | environ 40 €/an |
| 15 km | environ 230 €/an | environ 130 €/an |
| 35 km | environ 550 €/an | environ 290 €/an |

Ces distances ne correspondent à aucun secteur particulier. Pour choisir où habiter à Vitry-sur-Seine, il faut ensuite regarder les déplacements locaux : que montrent les pratiques, et que trouve-t-on autour du logement ?

## Robespierre et Porte du Midi, des pratiques différentes

Au recensement de 2022, la voiture est le mode principal pour aller travailler de **19 % des actifs résidant à Robespierre**, contre **50 % à Porte du Midi**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer ces observations lorsque vous repérez des annonces. Elles invitent aussi à préciser votre destination professionnelle : parmi les actifs qui habitent et travaillent à Vitry-sur-Seine, **34 %** déclarent la voiture comme mode principal. Chercher un logement dans la commune où l’on travaille laisse donc encore à examiner le parcours entre les deux adresses.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet vers le travail ne couvre qu’une partie du quotidien. Pour une installation en famille, notamment, la proximité des équipements apporte un autre éclairage sur les logements envisagés.

À Robespierre comme à Porte du Midi, **100 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Le panier est donc présent autour de toutes les adresses dans ces deux secteurs, malgré leurs pratiques domicile-travail différentes.

Pour départager des annonces dans ces secteurs, prolongez le repérage sur la carte par une visite des accès aux équipements qui vous seraient utiles. Examinez aussi le parcours vers votre travail aux horaires qui vous concernent : ce sont des déplacements différents à confronter à votre organisation.

## Votre projet, votre adresse

Si votre déménagement vise à alléger les déplacements du quotidien, partez des habitudes que vous souhaitez changer. Avec futur•e, examinez l’adresse envisagée à partir de ce projet, pour replacer la mobilité dans l’ensemble de votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE et reposent sur des estimations par sondage. Les secteurs sont des IRIS statistiques, dont les libellés ne correspondent pas toujours aux quartiers d’usage ; leurs écarts décrivent des groupes distincts, sans mesurer l’effet d’un déménagement.

La proximité croise la Base adresse nationale et la Base permanente des équipements de l’INSEE. Elle porte ici sur les adresses de chaque secteur et ne décrit pas l’usage des établissements ni le chemin à parcourir. Les prix proviennent de prix-carburants.gouv.fr : pour chaque semaine, la médiane entre stations utilise le dernier prix déclaré par chacune.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,64 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,37 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — fréquence annuelle | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Légende du tableau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — hausse retenue du gazole | +0,65 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue du SP95-E10 | +0,35 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole | environ 80 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût SP95-E10 | environ 40 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole | environ 230 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût SP95-E10 | environ 130 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole | environ 550 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût SP95-E10 | environ 290 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — Robespierre | 19 % | `iris.voiture.min` | oui |
| Pratiques — Porte du Midi | 50 % | `iris.voiture.max` | oui |
| Pratiques — actifs habitant et travaillant dans la commune | 34 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Équipements — adresses disposant du panier, dans chacun des secteurs | 100 % ; toutes les adresses | `iris.940810308.panier_500m`, `iris.940810104.panier_500m` | oui |
| Équipements — distance du panier | 500 m à vol d’oiseau | `iris.940810308.panier_500m`, `iris.940810104.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. La période de référence figure dans la légende. |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts observées à Robespierre et Porte du Midi | Aucune pour la production automatique ; libellés manuels seulement pour une version soignée. Repérer les secteurs cités et faire figurer le millésime 2022 sur la carte. |

Vérifications concernant les faits utilisés :

- **Carburant :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication.
- **Libellés des secteurs :** relire Robespierre et Porte du Midi. Le texte les présente comme des secteurs statistiques.
- **Destination professionnelle :** la section de vérification demande de relire l’intérêt du groupe de communes sélectionné. Seul le groupe des actifs habitant et travaillant à Vitry-sur-Seine est utilisé ici ; la sélection des autres communes n’intervient pas dans l’article.