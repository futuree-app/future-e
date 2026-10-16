## A. Question et format

**Question principale :** à Mérignac, quels repères regarder pour choisir un secteur lorsqu’on cherche à moins utiliser la voiture ?

Les contrastes entre La Glacière et Beutre éclairent la recherche : les pratiques domicile-travail et la proximité des équipements diffèrent selon les secteurs. Le lieu de travail mérite aussi un examen précis, y compris lorsqu’il se trouve à Mérignac.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `iris.332811101.panier_500m`, `iris.332811401.panier_500m`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les faits `scenario.carburant.*` ; le renvoi pratique sur `doc.reseau.site`.

**Format retenu :** article court. Motorisation, stationnement, flux entrants et comparaison nationale sont écartés pour concentrer le texte sur le choix du secteur et de l’adresse.

## B. Article

# Mérignac : quel secteur regarder pour moins prendre la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de **0,74 €/L**, et celui du SP95-E10 de **0,47 €/L**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Mérignac. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

Le scénario suivant retient une consommation de **6 L/100 km**, **200 allers-retours domicile-travail par an** et des hausses arrondies à **5 centimes** : **+0,75 €/L** pour le gazole et **+0,45 €/L** pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel de gazole | Surcoût annuel de SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 50 € |
| 15 km | environ 270 € | environ 160 € |
| 35 km | environ 630 € | environ 380 € |

Ces distances ne correspondent à aucun secteur en particulier. Pour orienter les recherches à Mérignac, les pratiques locales donnent un autre repère : quelle place la voiture occupe-t-elle selon le secteur où l’on habite ?

## De La Glacière à Beutre, des pratiques différentes

Dans les données du recensement de **2022**, la voiture est le mode principal pour aller travailler de **49 % des actifs résidant à La Glacière**, contre **81 % à Beutre**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail. La carte permet de situer les annonces dans cet ensemble de pratiques.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le trajet vers l’emploi mérite ensuite son propre examen. Parmi les actifs qui habitent et travaillent à Mérignac, **61 %** déclarent la voiture comme mode principal. Si votre projet consiste à vous rapprocher d’un emploi situé dans la commune, repérez précisément le logement et le lieu de travail dès la lecture de l’annonce.

## Et pour les courses et l’école ?

Le trajet vers l’emploi n’est qu’une partie des déplacements à envisager. Pour un projet familial, la proximité des courses et d’une école apporte un autre critère de choix.

À La Glacière, **97 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Beutre, cette part est de **25 %**.

Pour préparer une visite, repérez les équipements qui comptent pour vous, puis examinez les accès depuis le logement. Pour les transports en commun, vérifiez votre trajet et les horaires sur le [site officiel du réseau TBM](https://www.infotbm.com/fr).

## Votre projet, votre adresse

Votre déménagement peut être l’occasion de donner moins de place à la voiture dans votre quotidien. Explorez avec futur•e l’adresse que vous envisagez à partir de votre projet, qu’il s’agisse de vous rapprocher du travail ou de vous installer en famille.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE : fichier MOBPRO et bases infracommunales. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les comparaisons décrivent des groupes distincts, sans mesurer l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** de l’INSEE. Elle ne décrit ni les parcours réels ni l’usage des établissements.

Les prix proviennent de prix-carburants.gouv.fr : pour chaque semaine, la médiane est établie à partir du dernier prix déclaré par chaque station participante.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.ecart`, `carburant.e10.ecart` — période documentée par `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.ecart`, `carburant.e10.ecart` — période documentée par `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,47 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — hausse retenue pour le gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue pour le SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques locales — La Glacière | 49 % | `iris.voiture.min` | oui |
| Pratiques locales — Beutre | 81 % | `iris.voiture.max` | oui |
| Pratiques locales — actifs habitant et travaillant à Mérignac | 61 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Équipements — adresses de La Glacière | 97 % | `iris.332811101.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m | `iris.332811101.panier_500m`, `iris.332811401.panier_500m` | oui |
| Équipements — adresses de Beutre | 25 % | `iris.332811401.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.332811101.panier_500m`, `iris.332811401.panier_500m` — source BPE documentée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune. Conserver les hypothèses et la période de comparaison avec le tableau. |
| Carte de la part de la voiture par secteur (IRIS) | Après le passage sur La Glacière et Beutre | Aucune pour la production : classes automatiques et repères numérotés pour les secteurs cités. Libellés posés à la main seulement pour une version soignée. Faire figurer le millésime 2022. |

**Vérifications concernant les faits utilisés :**

- **`iris.ecart_voiture`** : relire les libellés de La Glacière et Beutre. Le texte les désigne comme secteurs statistiques.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication et concerne aussi le scénario de surcoût.

Aucun autre doute de lecture relevé.