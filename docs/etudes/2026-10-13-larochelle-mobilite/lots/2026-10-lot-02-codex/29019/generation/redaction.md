## A. Question et format

**Question principale :** quels secteurs examiner à Brest pour utiliser moins la voiture, et comment confronter cette première sélection au lieu de travail et aux besoins quotidiens ?

Les pratiques domicile-travail diffèrent fortement entre secteurs (`iris.voiture.min`, `iris.voiture.max`). Mais la proximité des équipements mérite une lecture séparée : à Lambezellec, un panier quotidien proche coexiste avec une forte part de la voiture (`iris.290190160.panier_500m`, `iris.290190160.voiture`). Pour une recherche de logement, cela invite à examiner ensemble le secteur, la destination de travail et l’adresse précise.

**Format retenu : article court.** Appuis complémentaires : `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`, `iris.290190140.panier_500m`, `doc.itineraire.calculateur`, `doc.temps_reel.prochains_passages`.

Pistes écartées : carburant, comparaison nationale, stationnement et statut d’occupation, qui disperseraient cette lecture centrée sur le choix de l’adresse.

## B. Article

# À Brest, où chercher un logement pour utiliser moins la voiture ?

Dans les pratiques domicile-travail du recensement 2022, la voiture est le mode principal de 42 % des actifs qui habitent le secteur Saint-Martin, contre 87 % à Kervao-Rural Nord, quelle que soit leur commune de travail. Pour chercher un logement en espérant moins conduire, ces différences donnent des pistes à confronter à votre destination de travail et aux équipements autour de l’adresse.

## Situer le secteur et le lieu de travail

Saint-Martin constitue une piste à examiner si vous souhaitez réduire la place de la voiture dans vos déplacements. La carte permet de situer les pratiques des autres secteurs : pendant vos recherches, repérez où se trouve chaque logement envisagé.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage à cette sélection. Parmi les actifs qui habitent et travaillent à Brest, 56 % déclarent la voiture comme mode principal. Cette part est de 80 % parmi les actifs résidant à Brest qui travaillent à Guipavas, Plouzané, Plougastel-Daoulas, Le Relecq-Kerhuon, Gouesnou ou Bohars.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Si votre emploi se situe dans l’une de ces communes, examinez la liaison entre le logement et votre lieu de travail précis dès la sélection des annonces. Les pratiques du secteur de résidence éclairent une partie du choix ; votre destination donne un trajet concret à étudier.

## Regarder aussi les courses et l’école

Le trajet de travail ne couvre pas les déplacements pour les courses, la pharmacie ou l’école. Pour ces besoins, le dossier repère les adresses qui réunissent un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

À Saint-Martin, toutes les adresses disposent de cette proximité. À Lambezellec, c’est le cas de 98 % des adresses, tandis que 79 % des actifs résidant dans ce secteur vont travailler principalement en voiture.

[VISUEL : Tableau accessible des secteurs (HTML et Markdown)]

Lambezellec offre ainsi une piste à examiner pour rapprocher ces équipements du logement, même lorsque les pratiques domicile-travail restent largement tournées vers la voiture. Pendant une visite, regardez les cheminements jusqu’aux équipements qui vous intéressent et l’emplacement de leurs entrées.

## Examiner les alternatives pour le trajet envisagé

Pour confronter une annonce à votre trajet de travail, le [calculateur d’itinéraire Bibus](https://www.bibus.fr/se-deplacer/calcul-ditineraire) propose plusieurs modes de déplacement. Si vous envisagez les transports en commun, la page [Prochains passages](https://www.bibus.fr/se-deplacer/prochains-passages) permet de consulter les passages en temps réel en choisissant un arrêt et une ligne. Utilisez ces outils pour examiner le trajet correspondant à vos horaires.

## Votre projet, votre adresse

Si votre déménagement vise à moins prendre la voiture, partez des déplacements que vous souhaitez changer. Explorez avec futur•e l’adresse envisagée à partir de ce projet, pour examiner sa place dans votre vie quotidienne.

### Méthode et sources

Les pratiques domicile-travail concernent les actifs occupés et proviennent du recensement de l’INSEE. Les résultats par secteur sont des estimations par sondage ; les libellés sont ceux des secteurs statistiques IRIS. Les groupes selon la destination de travail réunissent des personnes distinctes : leur comparaison ne mesure pas l’effet d’un changement d’emploi.

Les proximités reposent sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil dans son secteur ; le point recensé correspond à l’adresse de l’établissement, pas nécessairement à son entrée. Les outils Bibus cités proviennent des informations officielles du réseau.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — millésime des pratiques | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Chapeau — voiture à Saint-Martin | 42 % | `iris.voiture.min` | oui |
| Chapeau — voiture à Kervao-Rural Nord | 87 % | `iris.voiture.max` | oui |
| Secteur et lieu de travail — actifs habitant et travaillant à Brest | 56 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Secteur et lieu de travail — actifs travaillant dans le groupe exactement nommé | 80 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Courses et école — distance du panier quotidien | 500 m | `iris.290190140.panier_500m`, `iris.290190160.panier_500m` | oui |
| Courses et école — adresses de Saint-Martin | Toutes les adresses, soit 100 % | `iris.290190140.panier_500m` | oui |
| Courses et école — adresses de Lambezellec | 98 % | `iris.290190160.panier_500m` | oui |
| Courses et école — voiture à Lambezellec | 79 % | `iris.290190160.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.290190140.panier_500m`, `iris.290190160.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Nom exact du visuel | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Carte de la part de la voiture par secteur (IRIS) | Après le passage invitant à situer les logements envisagés | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Repérer les secteurs cités. |
| Barres : part de la voiture selon la commune de travail | Après la comparaison entre travail à Brest et travail dans le groupe nommé | Aucune ; conserver la liste exacte des communes dans l’intitulé de la barre. |
| Tableau accessible des secteurs (HTML et Markdown) | Après les observations sur Saint-Martin et Lambezellec | Aucune ; produit avec la carte. |

Vérifications concernant les faits utilisés :

- **`mobpro.voiture_selon_destination` :** relire l’intérêt du choix de Guipavas, Plouzané, Plougastel-Daoulas, Le Relecq-Kerhuon, Gouesnou et Bohars pour cette comparaison. Vérification non bloquante : le groupe est exactement nommé.
- **`iris.ecart_voiture` :** relire les libellés Saint-Martin, Kervao-Rural Nord et Lambezellec. Le texte les désigne comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.
- Faire figurer les millésimes sur les visuels : pratiques du recensement pour la carte et les barres ; sources des pratiques et des équipements pour le tableau.