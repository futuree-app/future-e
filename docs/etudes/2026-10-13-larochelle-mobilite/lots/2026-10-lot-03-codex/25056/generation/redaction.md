## A. Question et format

**Question principale :** comment articuler proximité des équipements et trajet au travail pour chercher un logement à Besançon où utiliser moins la voiture ?

Marulaz et Montrapon associent une proximité presque généralisée du panier quotidien à des pratiques domicile-travail très différentes. Ce rapprochement aide le lecteur à examiner les équipements et son trajet professionnel sans prendre l’un pour un indicateur de l’autre. Appuis : `iris.250560401.voiture`, `iris.250560802.voiture`, `iris.250560401.panier_500m`, `iris.250560802.panier_500m`, puis `mobpro.voiture_selon_destination.meme_commune` et `mobpro.voiture_selon_destination.communes_voisines`.

**Format : article court**, avec une carte et un graphique.

Pistes écartées : carburant, possession automobile, stationnement et comparaison nationale, qui disperseraient cette question sans mieux l’éclairer.

## B. Article

# À Besançon, des équipements proches même là où la voiture domine

Pour chercher un logement à Besançon et utiliser moins la voiture, la proximité des courses et de l’école mérite d’être regardée avec le trajet au travail. Les secteurs de Marulaz et de Montrapon montrent pourquoi ces questions doivent être examinées ensemble.

D’après le recensement de **2022**, la voiture est le mode principal pour aller travailler de **30 % des actifs résidant dans le secteur statistique de Marulaz**, contre **70 % dans celui de Montrapon**. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

Pour votre recherche, la carte permet de situer ces pratiques autour des logements repérés. Elle donne un contexte au trajet que vous aurez à examiner depuis chaque adresse.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Où travaillerez-vous depuis ce logement ?

Le secteur de résidence donne un premier repère ; la destination professionnelle apporte un autre éclairage. Parmi les actifs qui habitent et travaillent à Besançon, **49 % vont principalement travailler en voiture**. Cette part atteint **83 %** parmi les actifs résidant à Besançon qui travaillent à **Thise, École-Valentin, Miserey-Salines, Avanne-Aveney, Pirey et Châtillon-le-Duc**.

Si votre emploi se trouve dans l’une de ces six communes, gardez cette destination précise dans votre recherche. Pour chaque logement retenu, examinez la liaison jusqu’au lieu de travail, aux horaires qui seront les vôtres, y compris pour le retour.

[VISUEL : Barres : part de la voiture selon la commune de travail]

## Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour un déménagement en famille notamment, la proximité des équipements mérite son propre examen.

Le panier observé réunit un commerce alimentaire, une pharmacie et une école élémentaire, chacun à **moins de 500 m à vol d’oiseau** de l’adresse. À Marulaz, toutes les adresses disposent de ce panier à proximité. À Montrapon, c’est aussi le cas de **la quasi-totalité des adresses (99 %)**, alors que la voiture y domine les déplacements domicile-travail.

Montrapon invite donc à regarder séparément les possibilités autour du logement pour les courses et l’école, et les conditions du trajet professionnel. Lors d’une visite, parcourez les chemins vers les équipements qui vous seraient utiles : la distance à vol d’oiseau ne décrit pas le chemin à pied.

## Préparer la visite avec ses horaires

Pour examiner une option en transports en commun, consultez le site du réseau [Ginko](https://www.ginko.voyage). Sa page [Horaires & affluences](https://www.ginko.voyage/se-deplacer/horaires-affluences) propose les horaires et l’affluence en temps réel à l’arrêt. Confrontez ces informations aux déplacements que vous souhaitez effectuer depuis le logement.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour apprécier la place que la mobilité prendra dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement INSEE 2022, fichier Mobilités professionnelles et base infracommunale Activité des résidents. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

Les comparaisons selon la commune de travail portent sur des groupes distincts de personnes : elles ne mesurent pas l’effet d’un déménagement. Elles ne sont pas croisées avec le secteur de résidence.

La proximité des équipements utilise la Base adresse nationale et la Base permanente des équipements INSEE 2025. Les parts citées portent sur les adresses de chaque secteur, sans pondération entre elles. Elles décrivent une proximité, pas l’usage des équipements. Les informations pratiques sur Ginko proviennent des pages officielles référencées.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture, millésime des pratiques | 2022 | `iris.250560401.voiture`, `iris.250560802.voiture` | oui |
| Ouverture, voiture à Marulaz | 30 % | `iris.250560401.voiture` | oui |
| Ouverture, voiture à Montrapon | 70 % | `iris.250560802.voiture` | oui |
| Commune de travail, actifs habitant et travaillant à Besançon | 49 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Commune de travail, actifs travaillant dans le groupe nommé | 83 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Reprise du groupe nommé | « six communes » | `mobpro.voiture_selon_destination.communes_voisines` — liste exacte du périmètre | oui |
| Définition du panier de proximité | moins de 500 m à vol d’oiseau | `iris.250560401.panier_500m`, `iris.250560802.panier_500m` | oui |
| Panier à Marulaz | « toutes les adresses » — 100 % exact | `iris.250560401.panier_500m` | oui |
| Panier à Montrapon | 99 % | `iris.250560802.panier_500m` | oui |
| Méthode, recensement | 2022 | `iris.250560401.voiture`, `iris.250560802.voiture`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Méthode, équipements | 2025 | `iris.250560401.panier_500m`, `iris.250560802.panier_500m` — millésime BPE indiqué dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Carte de la part de la voiture par secteur (IRIS) | Après les pratiques de Marulaz et de Montrapon | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Repérer les secteurs cités et afficher le millésime 2022. |
| Barres : part de la voiture selon la commune de travail | Après la comparaison des destinations professionnelles | Aucune ; conserver la liste exacte des communes dans l’intitulé de la barre et afficher le millésime 2022. |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Marulaz et Montrapon. Le texte les désigne comme secteurs statistiques, sans les assimiler à des quartiers d’usage.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du choix du groupe de communes de travail. Sa composition exacte figure dès sa première apparition.

Aucun autre doute de lecture relevé.