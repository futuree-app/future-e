## A. Question et format

**Question principale :** à Calais, comment orienter sa recherche de logement pour utiliser moins la voiture, en distinguant le trajet de travail de la proximité des équipements quotidiens ?

Les pratiques varient fortement selon le secteur, mais des équipements proches peuvent aussi coexister avec un usage élevé de la voiture pour travailler. Pour le lecteur, cela invite à examiner séparément son lieu de travail et les alentours de l’adresse envisagée.

**Appuis :** `destination.62193.part_des_actifs`, `destination.62193.voiture`, `iris.voiture.min`, `iris.voiture.max`, `iris.621930601.voiture`, `iris.621930601.panier_500m`, `iris.621931301.panier_500m`.

**Format retenu :** article court, avec l’ouverture carburant obligatoire et deux visuels.

**Pistes écartées :** stationnement, statut d’occupation et actifs venant travailler à Calais, qui disperseraient la question ; comparaison nationale, peu utile ici ; offre de bus, dont les données calculées ne sont pas utilisables.

## B. Article

# Moins de voiture à Calais : que regarder autour du futur logement ?

**Dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Calais, le prix médian du gazole augmente de 0,73 €/L entre les semaines du 6 octobre 2025 et du 5 octobre 2026. Pour le SP95-E10, la hausse atteint 0,44 €/L. De quoi intégrer les déplacements à sa recherche de logement.**

Le tableau donne un scénario de surcoût annuel de carburant selon la distance. Hypothèses : consommation de **6 L/100 km**, **200 allers-retours domicile-travail par an**, hausses arrondies à **5 centimes**. Il ne correspond à aucun secteur ni lieu de travail particulier.

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour chercher un logement à Calais, reste à distinguer les déplacements que l’on envisage de faire autrement : rejoindre son travail ou accéder aux équipements du quotidien ne pose pas la même question.

## Travailler à Calais ne suffit pas à décrire son trajet

Les pratiques du recensement **2022** montrent que **67 % des actifs résidant à Calais travaillent dans la commune**. Parmi eux, **71 % utilisent principalement la voiture** pour aller travailler. Une adresse et un emploi dans la même commune laissent donc encore beaucoup à examiner entre les deux.

Les pratiques diffèrent aussi selon le secteur de résidence : la voiture est le mode principal de **53 % des actifs à Mouchotte**, contre **91 % à Virval**. Ces parts concernent tous les actifs qui habitent chaque secteur, où qu’ils travaillent.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte donne des repères pour situer une annonce. Pour le logement retenu, il faut ensuite examiner la liaison avec son propre lieu de travail.

## Des équipements proches, pour quels déplacements ?

Les courses et l’école ajoutent d’autres destinations à regarder autour du logement. Le dossier mesure un panier réunissant un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**.

À **Greuze**, la quasi-totalité des adresses dispose de ce panier à proximité, tandis que **86 % des actifs du secteur** vont travailler principalement en voiture. Ce secteur illustre l’intérêt de regarder les équipements quotidiens et le trajet professionnel séparément.

À **Virval**, aucune adresse ne réunit le panier complet dans ce rayon. Cela ne signifie pas que tout équipement est absent : lors d’une visite, repérez séparément ceux qui vous servent. À Greuze, vérifiez les accès réels depuis le logement aux équipements proches ; la distance à vol d’oiseau ne décrit pas le chemin à parcourir.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix de logement.

## Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE : fichier Mobilités professionnelles et bases infracommunales Activité des résidents. Elles concernent les actifs occupés de **15 ans ou plus**, y compris ceux qui travaillent à domicile, et leur mode principal déclaré. Ce sont des estimations par sondage. Les résultats par secteur ne sont pas croisés avec la commune de travail et ne mesurent pas l’effet d’un déménagement.

Les secteurs sont les IRIS statistiques de l’INSEE ; leurs libellés ne correspondent pas toujours aux quartiers d’usage. La proximité des équipements est mesurée depuis les adresses de la Base adresse nationale vers les établissements de la Base permanente des équipements de l’INSEE, millésime **2025**. Chaque adresse compte pareil au sein du secteur ; la proximité ne renseigne pas sur l’usage des équipements.

Les prix viennent du flux officiel de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré dans chaque semaine. Une station sans déclaration sur la semaine n’entre pas dans cette médiane. Le scénario porte uniquement sur le surcoût de carburant ; une hausse passée ne préjuge pas de la suite.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Chapeau — début de comparaison | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — fin de comparaison | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,73 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,44 €/L | `carburant.e10.ecart` | oui |
| Scénario — consommation | 6 L/100 km | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Scénario — déplacements annuels | 200 allers-retours | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Scénario — arrondi des hausses | 5 centimes | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Tableau — hausse retenue, gazole | +0,75 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue, SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole | environ 90 € par an | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût SP95-E10 | environ 50 € par an | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole | environ 270 € par an | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût SP95-E10 | environ 160 € par an | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole | environ 630 € par an | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût SP95-E10 | environ 380 € par an | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `destination.62193.part_des_actifs`, `destination.62193.voiture`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — travaillent dans la commune | 67 % | `destination.62193.part_des_actifs` | oui |
| Pratiques — voiture parmi ceux qui habitent et travaillent à Calais | 71 % | `destination.62193.voiture` | oui |
| Pratiques — voiture à Mouchotte | 53 % | `iris.voiture.min` | oui |
| Pratiques — voiture à Virval | 91 % | `iris.voiture.max` | oui |
| Équipements — définition du panier | moins de 500 m à vol d’oiseau | `iris.621930601.panier_500m`, `iris.621931301.panier_500m` | oui |
| Équipements — panier à Greuze | « la quasi-totalité » — valeur fournie : 99,5 % | `iris.621930601.panier_500m` | oui |
| Équipements — voiture à Greuze | 86 % | `iris.621930601.voiture` | oui |
| Équipements — panier à Virval | « aucune adresse » — valeur exacte : 0 % | `iris.621931301.panier_500m` | oui |
| Méthode — âge des actifs | 15 ans ou plus | `mobpro.travaille_dans_commune`, `iris.voiture.min`, `iris.voiture.max` — populations définies | oui |
| Méthode — millésime des équipements | 2025 | `iris.621930601.panier_500m`, `iris.621931301.panier_500m` — source BPE précisée dans le dossier | oui |

Les identifiants `scenario.carburant.*` désignent ici les six faits nommés individuellement dans les lignes suivantes ; leurs hypothèses communes figurent en tête de la section 7 du dossier.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses ; contenu reproduit dans B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Mouchotte et Virval | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée |

La carte doit porter le millésime des pratiques et repérer les secteurs cités dans l’article : Mouchotte, Virval et Greuze.

Vérifications du dossier concernant les faits utilisés :

- **`iris.ecart_voiture` :** relire les libellés des secteurs cités. Le texte les présente comme des secteurs statistiques, sans les assimiler à des quartiers d’usage.
- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, non bloquante pour cette rédaction.

Aucun autre doute de lecture identifié.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
