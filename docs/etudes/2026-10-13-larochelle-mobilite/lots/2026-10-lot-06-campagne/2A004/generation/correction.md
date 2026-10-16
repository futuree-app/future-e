## A. Question et format

**Question principale :** à Ajaccio, comment choisir un secteur pour utiliser moins la voiture, quand travailler dans la commune et disposer d’équipements proches ne suffisent pas à décrire les pratiques ?

Le dossier montre une forte présence de la voiture parmi les actifs qui travaillent à Ajaccio même, des différences marquées entre secteurs et, à Candia, la coexistence d’équipements proches et d’un usage élevé de la voiture pour travailler. Pour une recherche de logement, cela invite à examiner séparément le déplacement professionnel et les sorties du quotidien.

Appuis : `mobpro.travaille_dans_commune`, `destination.2A004.voiture`, `iris.voiture.min`, `iris.voiture.max`, `iris.2A0040201.panier_500m`, `iris.2A0040701.panier_500m`, `iris.2A0040701.voiture`.

**Format retenu : article court**, ouvert par le carburant et son scénario pré-calculé.

Pistes écartées : motorisation, stationnement et actifs venant travailler à Ajaccio disperseraient la question ; la comparaison nationale apporterait un contexte sans préciser le choix d’une adresse.

## B. Article

# À Ajaccio, quels secteurs regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, la hausse du prix médian du gazole est de l’ordre de 0,56 €/L dans un rayon de 12 km à vol d’oiseau autour du centre d’Ajaccio. Ce repère donne une raison concrète d’examiner les déplacements associés à un futur logement.

## Le surcoût selon la distance au travail

Le scénario ci-dessous porte sur le carburant seul, avec une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et une hausse retenue arrondie à 0,55 €/L. Il ne correspond à aucun secteur ni lieu de travail particulier.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel de gazole |
|---|---:|
| 5 km | environ 70 € |
| 15 km | environ 200 € |
| 35 km | environ 460 € |

Pour choisir un logement, reste à regarder la place de la voiture dans les déplacements locaux, puis les possibilités de proximité autour de l’adresse.

## La voiture pour aller travailler

Les pratiques domicile-travail du recensement de 2022 montrent que 88 % des actifs occupés résidant à Ajaccio travaillent dans la commune. Parmi ces actifs qui habitent et travaillent à Ajaccio, 74 % déclarent la voiture comme mode principal pour aller travailler. Avoir son emploi dans la commune laisse donc entière la question du trajet depuis le logement envisagé.

À l’échelle des secteurs statistiques, tous lieux de travail confondus, la part de la voiture va de 51 % des actifs occupés dans le secteur Centre Ville à 87 % dans celui de La Confina.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Les courses et l’école posent une autre question

Le trajet professionnel ne couvre pas toutes les sorties à envisager lors d’un déménagement. Pour les courses, la pharmacie ou l’école, le dossier permet de regarder la proximité des équipements.

Dans les secteurs Centre Ville et Candia, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Candia, 81 % des actifs occupés utilisent principalement la voiture pour travailler, quelle que soit leur commune de travail.

Une annonce à Candia mérite ainsi une lecture distincte du déplacement professionnel et des sorties du quotidien. Lors de la visite, examinez les cheminements réels vers les équipements repérés : leur proximité sur la carte ne décrit pas le parcours à pied.

## Votre projet, votre adresse

Si vous déménagez pour moins conduire, partez des déplacements que vous souhaitez changer dans votre quotidien. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de ce qui compte pour votre installation.

### Méthode et sources

Les pratiques professionnelles proviennent de l’INSEE : fichier Mobilités professionnelles et bases infracommunales. Ce sont des estimations par sondage ; les comparaisons décrivent des groupes distincts, sans mesurer l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Elle décrit des adresses, sans établir l’usage des équipements.

Les prix proviennent du flux officiel prix-carburants.gouv.fr. Le repère carburant est fragile : les stations prises en compte peuvent différer entre les semaines et la comparaison à stations constantes n’a pas été contrôlée. Le tableau présente un scénario de surcoût, sans prévision de prix.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | ordre de grandeur |
| Chapeau | semaine du 5 octobre 2026 | `carburant.gazole.prix` | ordre de grandeur |
| Chapeau | de l’ordre de 0,56 €/L | `carburant.gazole.ecart` | ordre de grandeur |
| Chapeau | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart` | ordre de grandeur |
| Hypothèses du scénario | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario | 200 allers-retours par an | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` — hypothèses communes, section 7 | oui |
| Hypothèses du scénario | 0,55 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau du scénario | 5 km | `scenario.carburant.gazole.5km` | oui |
| Tableau du scénario | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau du scénario | 15 km | `scenario.carburant.gazole.15km` | oui |
| Tableau du scénario | environ 200 € | `scenario.carburant.gazole.15km` | oui |
| Tableau du scénario | 35 km | `scenario.carburant.gazole.35km` | oui |
| Tableau du scénario | environ 460 € | `scenario.carburant.gazole.35km` | oui |
| Pratiques locales | recensement de 2022 | `mobpro.travaille_dans_commune`, `destination.2A004.voiture`, `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques locales | 88 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques locales | 74 % | `destination.2A004.voiture` | oui |
| Comparaison des secteurs | 51 % | `iris.voiture.min` | oui |
| Comparaison des secteurs | 87 % | `iris.voiture.max` | oui |
| Équipements proches | toutes les adresses — Centre Ville, valeur exacte de 100 % | `iris.2A0040201.panier_500m` | oui |
| Équipements proches | toutes les adresses — Candia, valeur exacte de 100 % | `iris.2A0040701.panier_500m` | oui |
| Équipements proches | moins de 500 m à vol d’oiseau | `iris.2A0040201.panier_500m`, `iris.2A0040701.panier_500m` | oui |
| Pratiques à Candia | 81 % | `iris.2A0040701.voiture` | oui |
| Méthode, équipements | millésime 2025 | `iris.2A0040201.panier_500m`, `iris.2A0040701.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses ; contenu fourni en B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Centre Ville et La Confina | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Libellés posés à la main seulement pour une version soignée |

Le millésime des pratiques doit figurer sur la carte.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Centre Ville, La Confina et Candia. L’article les désigne comme des secteurs statistiques.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario ; elle est obligatoire avant publication.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : orientation résidentielle déduite des pratiques par secteur | Ces pratiques donnent des repères pour orienter les recherches, puis examiner le lien entre chaque adresse et son propre lieu de travail. | Phrase supprimée : le dossier ne mesure pas l’effet du choix d’un secteur sur les pratiques du lecteur. |
| Raisonnement — a_revoir : opposition suggérant un lien causal entre équipements et trajet professionnel | À Candia, pourtant, 81 % des actifs occupés utilisent principalement la voiture pour travailler, quelle que soit leur commune de travail. | À Candia, 81 % des actifs occupés utilisent principalement la voiture pour travailler, quelle que soit leur commune de travail. |
| Croisement — a_revoir : titre associant secteur de résidence et travail à Ajaccio | Travailler à Ajaccio, depuis quel secteur ? | La voiture pour aller travailler |