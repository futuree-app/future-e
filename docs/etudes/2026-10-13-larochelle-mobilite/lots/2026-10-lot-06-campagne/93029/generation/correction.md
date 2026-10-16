## A. Question et format

**Question principale :** quels secteurs examiner pour chercher un logement à Drancy en utilisant moins la voiture, tout en tenant compte du lieu de travail et des équipements proches ?

Les écarts de pratiques entre secteurs donnent des points de départ pour la recherche. La proximité des équipements apporte ensuite une vérification distincte, à mener autour du logement envisagé. Appuis : `iris.voiture.min`, `iris.voiture.max`, `destination.93029.voiture`, `destination.95527.voiture`, `iris.930290902.panier_500m` et `iris.930290401.panier_500m`.

**Format retenu : article court**, avec l’ouverture carburant obligatoire et deux visuels.

**Pistes écartées :** stationnement, statut d’occupation et possession d’une voiture ajouteraient des profils sans préciser la recherche retenue ; le repère intercommunal apporte peu à cette question.

## B. Article

# Chercher un logement à Drancy pour moins prendre la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,64 €/L, celui du SP95-E10 de 0,36 €/L. Ces relevés concernent les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Drancy. Pour un projet de déménagement, cette hausse invite à regarder les déplacements associés au futur logement.

### Ce que la hausse représente selon la distance

Le scénario retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses sont arrondies à 5 centimes : +0,65 €/L pour le gazole et +0,35 €/L pour l’essence.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 40 € |
| 15 km | environ 230 € | environ 130 € |
| 35 km | environ 550 € | environ 290 € |

À Drancy, quelle place la voiture prend-elle dans les trajets domicile-travail, selon le secteur et le lieu de travail ?

### Regarder le secteur et le lieu de travail

Au recensement 2022, la voiture est le mode principal pour aller travailler de 24 % des actifs qui habitent le secteur Paris Campagne 2, contre 55 % dans le secteur Village Parisien 1. Ces parts concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Source : INSEE, recensement 2022.*

Le lieu de travail apporte un autre éclairage. Parmi les actifs qui résident à Drancy, la voiture est le mode principal de 38 % de ceux qui travaillent aussi dans la commune, contre, par exemple, 72 % de ceux qui travaillent à Roissy-en-France. Lors d’une recherche de logement, examinez donc la liaison depuis l’adresse précise vers votre propre lieu de travail, aux horaires où vous vous déplacez.

### Les courses et l’école demandent un autre regard

Le trajet professionnel ne résume pas les déplacements du ménage. Pour choisir une adresse, il faut aussi regarder où se trouvent les équipements dont vous avez besoin.

À Paris Campagne 2, 95 % des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Village Parisien 1, cette part est de 36 %. Pour les annonces que vous retenez, repérez ces équipements, puis profitez de la visite pour parcourir les chemins qui les relient au logement.

### Votre projet, votre adresse

Si votre déménagement vise à moins prendre la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, examinez l’adresse envisagée à partir de ce projet et de l’ensemble de vos critères de vie.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE. Les secteurs cités sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. Les résultats sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés. Les groupes de destination sont distincts et ne sont pas croisés avec les secteurs de résidence.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements 2025 de l’INSEE. Chaque adresse compte de la même façon dans son secteur. Les distances à vol d’oiseau vont jusqu’à l’adresse de l’établissement, pas à son entrée ; elles ne décrivent pas le chemin réel ni l’usage de l’équipement.

Les prix proviennent de prix-carburants.gouv.fr : pour chaque station, le dernier prix déclaré pendant la semaine est retenu, puis la médiane est établie entre stations.

## C. Correspondance interne — non publiée

Les dénominations contenant des chiffres sont également recensées ci-dessous.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,64 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — dénomination du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Chapeau — hausse de l’essence | 0,36 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,65 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Hypothèses — hausse retenue, essence | +0,35 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — dénomination du carburant | SP95-E10 | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole, première distance | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût essence, première distance | environ 40 € | `scenario.carburant.e10.5km` | oui |
| Tableau — deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole, deuxième distance | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût essence, deuxième distance | environ 130 € | `scenario.carburant.e10.15km` | oui |
| Tableau — troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole, troisième distance | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût essence, troisième distance | environ 290 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `destination.93029.voiture`, `destination.95527.voiture` | oui |
| Pratiques — part de la voiture, secteur minimum | 24 % | `iris.voiture.min` | oui |
| Pratiques — libellé du secteur minimum | Paris Campagne 2 | `iris.voiture.min` | oui |
| Pratiques — part de la voiture, secteur maximum | 55 % | `iris.voiture.max` | oui |
| Pratiques — libellé du secteur maximum | Village Parisien 1 | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Lieu de travail — actifs habitant et travaillant à Drancy | 38 % | `destination.93029.voiture` | oui |
| Lieu de travail — actifs habitant Drancy et travaillant à Roissy-en-France | 72 % | `destination.95527.voiture` | oui |
| Équipements — premier libellé de secteur | Paris Campagne 2 | `iris.930290902.panier_500m` | oui |
| Équipements — adresses avec le panier complet, premier secteur | 95 % | `iris.930290902.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m | `iris.930290902.panier_500m`, `iris.930290401.panier_500m` | oui |
| Équipements — second libellé de secteur | Village Parisien 1 | `iris.930290401.panier_500m` | oui |
| Équipements — adresses avec le panier complet, second secteur | 36 % | `iris.930290401.panier_500m` | oui |
| Méthode — millésime de la BPE | 2025 | `acces.93029.panier_quotidien_500m` — métadonnées de la source équipements | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison des pratiques entre secteurs | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Repérer les deux secteurs cités. |

Vérifications avant publication :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne les hausses et le scénario retenus ; elle est obligatoire avant publication.
- **`iris.ecart_voiture`** : relire les libellés Paris Campagne 2 et Village Parisien 1. L’article les présente comme des secteurs statistiques, sans les assimiler aux quartiers d’usage.

Aucun autre doute de lecture relevé sur les faits retenus.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : recommandation fondée sur les pratiques sectorielles | « À Drancy, quels secteurs regarder pour chercher à réduire ces déplacements en voiture ? Les pratiques locales donnent des repères, à rapprocher de votre destination professionnelle. » | « À Drancy, quelle place la voiture prend-elle dans les trajets domicile-travail, selon le secteur et le lieu de travail ? » Question rendue descriptive. |
| Raisonnement — à revoir : rapprochement entre équipements et pratiques | « À Paris Campagne 2, 95 % des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Village Parisien 1, cette part est de 36 %. » | Inchangé. Anomalie écartée : le dossier autorise la description distincte des pratiques et de la proximité. Le passage ne leur attribue aucun lien causal, et la transition distingue déjà les déplacements professionnels des autres besoins. |
| Méthode — à revoir : choix de Roissy-en-France | « contre 72 % de ceux qui travaillent à Roissy-en-France » | « contre, par exemple, 72 % de ceux qui travaillent à Roissy-en-France ». L’ajout présente explicitement cette destination comme un exemple, sans généraliser aux actifs travaillant hors de Drancy. |