## A. Question et format

**Question principale :** à Clermont-Ferrand, comment choisir un secteur pour utiliser moins la voiture, en tenant compte du travail et des déplacements du quotidien ?

Le contraste entre Dolet et La Boucle donne une raison concrète d’examiner le secteur d’une annonce (`iris.voiture.min`, `iris.voiture.max`). La Plaine apporte un éclairage complémentaire : proximité des équipements et usage de la voiture pour travailler peuvent coexister (`iris.631132101.panier_500m`, `iris.631132101.voiture`). Le lieu de travail complète cette lecture, sans croiser artificiellement les populations (`mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`).

**Format retenu : article court**, avec une carte pour porter le détail des secteurs et le tableau carburant en ouverture.

**Pistes écartées :** comparaison nationale peu décisive pour choisir une adresse ; stationnement, possession automobile et actifs venant travailler dans la commune écartés pour garder une question ciblée ; gratuité du réseau laissée de côté, car elle alourdirait le passage consacré aux vérifications.

## B. Article

# Clermont-Ferrand : choisir son adresse pour utiliser moins la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, les prix médians du carburant ont augmenté de **0,71 €/L pour le gazole** et de **0,48 €/L pour le SP95-E10**, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Clermont-Ferrand. Pour qui cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements qu’une adresse permettrait d’organiser autrement.

## Le surcoût selon la distance au travail

Le scénario ci-dessous retient une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**. Les hausses retenues sont arrondies à 5 centimes : **+0,70 €/L pour le gazole** et **+0,50 €/L pour le SP95-E10**.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel de gazole | Surcoût annuel de SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 60 € |
| 15 km | environ 250 € | environ 180 € |
| 35 km | environ 590 € | environ 420 € |

Ces montants concernent le carburant seul. Pour examiner une annonce à Clermont-Ferrand, reste à regarder les pratiques locales et les destinations qui rythmeraient vos journées.

## Du lieu de travail au secteur de résidence

D’après le recensement de **2022**, **72 % des actifs résidant à Clermont-Ferrand travaillent dans la commune même**. Parmi ces actifs qui y habitent et y travaillent, **46 % déclarent la voiture comme mode principal** pour aller travailler. Une recherche de logement gagne donc à partir du lieu de travail précis, même lorsque celui-ci se trouve dans la commune.

Le secteur de résidence apporte un autre éclairage. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la part de la voiture comme mode principal va de **25 % à Dolet** à **80 % à La Boucle**.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer une annonce dans ces profils de déplacements. Lors de la visite, l’enjeu sera d’examiner les possibilités correspondant à votre propre destination et à vos horaires.

## Les courses et l’école méritent une lecture distincte

Le trajet professionnel ne résume pas les déplacements d’un ménage. Pour une recherche en famille, notamment, la proximité des équipements apporte une autre information sur l’adresse.

Le « panier quotidien » réunit un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Dolet, toutes les adresses disposent de ce panier ; à La Boucle, cette part est de **7 %**.

La Plaine présente un autre profil : **90 % des adresses** disposent du panier quotidien, et **78 % des actifs qui habitent le secteur** vont travailler principalement en voiture. Des équipements proches et un usage fréquent de la voiture pour travailler peuvent ainsi coexister.

Pour une adresse envisagée, repérez les équipements qui vous serviraient réellement, puis examinez les chemins à pied pendant la visite. Si vous comptez utiliser les transports en commun, le [site T2C](https://www.t2c.fr/se-deplacer/itineraires) propose une recherche d’itinéraire avec départ, arrivée, date et heure : renseignez les conditions de vos déplacements habituels.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail, vous installer en famille ou réorganiser votre quotidien ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de la place que vous souhaitez donner à la mobilité dans votre choix.

### Méthode et sources

Les pratiques professionnelles proviennent de l’INSEE : fichier Mobilités professionnelles et bases infracommunales du recensement. Les comparaisons portent sur des groupes distincts ; elles ne mesurent pas l’effet d’un déménagement. Les parts par secteur concernent les actifs résidents, tous lieux de travail confondus. Ce sont des estimations par sondage, dont les petits écarts ne doivent pas être surinterprétés. Les secteurs sont les IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements. Elle décrit des adresses et des distances à vol d’oiseau, sans établir l’usage des équipements ni la longueur des chemins à pied. Les prix proviennent du flux officiel prix-carburants.gouv.fr ; les médianes hebdomadaires portent sur les stations ayant déclaré un prix, sans suivi d’un ensemble constant de stations.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,71 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km`, `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` — hypothèse commune de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours par an | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km`, `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` — hypothèse commune de la section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km`, `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` — hypothèse commune de la section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,70 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole, trajet aller de 5 km | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût SP95-E10, trajet aller de 5 km | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole, trajet aller de 15 km | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût SP95-E10, trajet aller de 15 km | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole, trajet aller de 35 km | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût SP95-E10, trajet aller de 35 km | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — actifs travaillant dans leur commune de résidence | 72 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Clermont-Ferrand | 46 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Secteurs — voiture à Dolet | 25 % | `iris.voiture.min` | oui |
| Secteurs — voiture à La Boucle | 80 % | `iris.voiture.max` | oui |
| Équipements — définition du panier quotidien | moins de 500 m à vol d’oiseau | `iris.631131401.panier_500m`, `iris.631132001.panier_500m`, `iris.631132101.panier_500m` | oui |
| Équipements — panier quotidien à Dolet | toutes les adresses, soit 100 % | `iris.631131401.panier_500m` | oui |
| Équipements — panier quotidien à La Boucle | 7 % | `iris.631132001.panier_500m` | oui |
| Équipements — panier quotidien à La Plaine | 90 % | `iris.631132101.panier_500m` | oui |
| Équipements — voiture parmi les actifs résidant à La Plaine | 78 % | `iris.631132101.voiture` | oui |

Le renvoi vers la recherche d’itinéraire repose sur `doc.reseau.site` et `doc.verification.itineraires`, tous deux d’usage `oui`. « T2C » est le nom du réseau, sans valeur quantitative.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | En ouverture, après les hypothèses ; contenu reproduit dans B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Dolet et La Boucle | Aucune pour la production automatique : classes automatiques et repères numérotés avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Le tableau conserve les hypothèses et la période de comparaison de l’ouverture. La carte doit porter le millésime des pratiques et repérer Dolet, La Boucle et La Plaine.

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication ; elle concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Dolet, La Boucle et La Plaine. L’article les présente comme des secteurs statistiques.

**Doute de lecture à signaler :** le contrôle du choix des communes de travail est rattaché dans le dossier à toute la famille `mobpro.voiture_selon_destination.*`. Seule la modalité « même commune » est utilisée ici ; son périmètre ne dépend pas du groupe de communes sélectionné.