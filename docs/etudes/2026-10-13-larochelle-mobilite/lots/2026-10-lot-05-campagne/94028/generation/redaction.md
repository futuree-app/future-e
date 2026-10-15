## A. Question et format

**Question principale : à Créteil, un secteur bien équipé suffit-il pour envisager d’utiliser moins la voiture ?** À Lévrière-Haye aux Moines comme à L’Ormetteau, toutes les adresses réunissent le panier d’équipements étudié à proximité, mais les pratiques domicile-travail diffèrent. Pour choisir un logement, cela invite à examiner séparément les équipements autour de l’adresse et le déplacement vers son emploi.

Appuis : `iris.940280209.voiture`, `iris.940280205.voiture`, `iris.940280209.panier_500m`, `iris.940280205.panier_500m`, éclairés par `mobpro.modes.tc` et `mobpro.voiture_selon_destination.meme_commune`.

**Format retenu : article court.** La découverte est utile, sans permettre de conclure sur les déplacements du lecteur.

Pistes écartées : comparaison intercommunale peu distinctive ; autres groupes de destinations, possession automobile et stationnement sans apport nécessaire à cette question ; bus inutilisables en l’état.

## B. Article

# À Créteil, les équipements proches ne disent pas tout de la place de la voiture

**Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du carburant augmente de 0,66 €/L pour le gazole et de 0,38 €/L pour le SP95-E10, dans un rayon de 12 km à vol d’oiseau autour du centre de Créteil. Pour une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements que l’adresse envisagée laisserait à faire en voiture.**

Le tableau présente un scénario de **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses retenues sont arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Gazole : hausse retenue de 0,65 €/L | SP95-E10 : hausse retenue de 0,40 €/L |
|---|---:|---:|
| 5 km | environ 80 €/an | environ 50 €/an |
| 15 km | environ 230 €/an | environ 140 €/an |
| 35 km | environ 550 €/an | environ 340 €/an |

Ces distances sont des hypothèses, sans attribution à un secteur. À Créteil, la question est de savoir ce que les pratiques locales et les équipements proches peuvent apprendre à quelqu’un qui cherche une adresse.

## Pour le travail, des pratiques différentes selon le secteur

Au recensement de 2022, les transports en commun sont le mode principal pour aller travailler de **53 % des actifs occupés résidant à Créteil**. Parmi les actifs qui habitent et travaillent dans la commune, **33 %** déclarent la voiture comme mode principal : chercher un logement dans sa commune de travail laisse donc encore le trajet précis à examiner.

À l’intérieur de Créteil, la part de la voiture est de **24 % à Lévrière-Haye aux Moines**, contre **41 % à L’Ormetteau**. Ces parts concernent les actifs qui résident dans chaque secteur, quel que soit leur lieu de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Pour départager des annonces, ces observations donnent des repères. Elles invitent aussi à regarder ce que l’adresse permet d’envisager pour les déplacements en dehors du travail.

## Pour les courses et l’école, une proximité à examiner sur place

À Lévrière-Haye aux Moines comme à L’Ormetteau, **toutes les adresses étudiées** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Ce même panier de proximité accompagne donc des pratiques domicile-travail différentes.

Lors d’une visite dans ces secteurs, repérez les accès réels aux équipements et parcourez les cheminements depuis le logement. Pour l’école, vérifiez aussi l’établissement dont dépend l’adresse : la proximité mesurée ne vaut pas affectation scolaire. Le trajet vers votre emploi mérite un examen distinct, avec vos horaires de travail.

## Votre projet, votre adresse

Si vous déménagez pour utiliser moins la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, en gardant une vue d’ensemble de ce qui compte pour votre installation.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les IRIS sont des secteurs statistiques dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** de l’INSEE. Elle décrit des adresses, sans mesurer l’usage des équipements ; les distances à vol d’oiseau ne sont pas des parcours piétons. Les prix proviennent de prix-carburants.gouv.fr : chaque médiane porte sur le dernier prix déclaré par chaque station dans la semaine considérée.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,66 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,38 €/L | `carburant.e10.ecart` | oui |
| Chapeau, rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses, distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses, déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Tableau, en-tête gazole | 0,65 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau, en-tête SP95-E10 | 0,40 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole, première ligne | environ 80 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10, première ligne | environ 50 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole, deuxième ligne | environ 230 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10, deuxième ligne | environ 140 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole, troisième ligne | environ 550 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10, troisième ligne | environ 340 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques, millésime | 2022 | `mobpro.modes.tc`, `mobpro.voiture_selon_destination.meme_commune`, `iris.940280209.voiture`, `iris.940280205.voiture` | oui |
| Pratiques, transports en commun | 53 % | `mobpro.modes.tc` | oui |
| Pratiques, voiture parmi les actifs habitant et travaillant à Créteil | 33 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques, voiture à Lévrière-Haye aux Moines | 24 % | `iris.940280209.voiture` | oui |
| Pratiques, voiture à L’Ormetteau | 41 % | `iris.940280205.voiture` | oui |
| Équipements, totalité des adresses à Lévrière-Haye aux Moines | toutes — 100 % exacts | `iris.940280209.panier_500m` | oui |
| Équipements, totalité des adresses à L’Ormetteau | toutes — 100 % exacts | `iris.940280205.panier_500m` | oui |
| Équipements, seuil de proximité | 500 m | `iris.940280209.panier_500m`, `iris.940280205.panier_500m` | oui |
| Méthode, millésime des équipements | 2025 | `iris.940280209.panier_500m`, `iris.940280205.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début de l’article, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Lévrière-Haye aux Moines et L’Ormetteau | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Faire figurer le millésime 2022 et repérer les secteurs cités. |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne l’ouverture et le scénario.
- **`iris.ecart_voiture`** : relire les libellés de Lévrière-Haye aux Moines et de L’Ormetteau. Le texte les présente comme des secteurs statistiques.

Aucun autre doute de lecture relevé.