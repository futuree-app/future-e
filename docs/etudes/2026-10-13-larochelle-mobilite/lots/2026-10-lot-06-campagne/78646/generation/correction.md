## A. Question et format

**Question principale :** à Versailles, comment choisir un secteur pour utiliser moins la voiture, sans confondre les pratiques domicile-travail avec la proximité des courses et de l’école ?

Les secteurs où les actifs déclarent peu la voiture ne présentent pas nécessairement la même proximité des équipements. Pour une recherche de logement, cela invite à examiner ces deux dimensions séparément. Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.786460302.panier_500m`, `iris.786460605.voiture`, `iris.786460605.panier_500m`.

**Format retenu : article court**, avec l’ouverture carburant obligatoire.

Les destinations de travail, la possession automobile et le stationnement sont écartés pour concentrer le texte sur ce choix de secteur ; la comparaison entre villes n’apporte pas de réponse à cette échelle.

## B. Article

# À Versailles, quel secteur regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,68 €/L autour de Versailles, celui du SP95-E10 de 0,25 €/L. Lorsqu’on cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite faire autrement.

Les prix concernent les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Versailles. Le scénario suivant illustre le surcoût annuel selon la distance domicile-travail, sans l’attribuer à un secteur.

Hypothèses : consommation de 6 L/100 km, 200 allers-retours par an, hausse médiane arrondie à 5 centimes. Carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la comparaison des prix de 2025 et 2026.*

| Trajet aller | Surcoût annuel gazole | Surcoût annuel SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 30 € |
| 15 km | environ 250 € | environ 90 € |
| 35 km | environ 590 € | environ 210 € |

À Versailles, quels repères peuvent alors guider le choix d’un secteur pour moins prendre la voiture ?

## Des pratiques différentes selon le secteur

D’après le recensement de 2022, la voiture est le mode principal pour aller travailler de 22 % des actifs occupés résidant dans le secteur Chantiers 2, contre 51 % dans celui de Clagny 5. Ces parts concernent les actifs qui habitent chaque secteur, quel que soit leur lieu de travail.

La carte permet de situer ces pratiques autour des logements repérés dans les annonces.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Part des actifs déclarant la voiture comme mode principal domicile-travail — INSEE, recensement 2022.*

## Les courses et l’école demandent une autre lecture

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour chercher un logement, il faut aussi regarder où se trouvent les équipements que l’on souhaite rejoindre sans voiture.

On considère ici un panier réunissant un commerce alimentaire, une pharmacie et une école élémentaire, chacun à moins de 500 m à vol d’oiseau. À Chantiers 2, ce panier se trouve à cette distance pour 94 % des adresses. À Saint-Louis 3, cette part est de 27 %, alors que la voiture est le mode principal domicile-travail de 24 % des actifs du secteur.

Une faible part de voiture pour le travail ne suffit donc pas à renseigner la proximité de ce panier. L’absence de ce panier à cette distance ne signifie pas non plus que tous les équipements manquent.

Pour une annonce dans ces secteurs, repérez les équipements utiles autour de l’adresse, puis parcourez les chemins qui les relient au logement pendant la visite. Cela permet de donner un sens concret à la proximité indiquée.

## Votre projet, votre adresse

Si vous déménagez pour utiliser moins la voiture, précisez les déplacements que vous souhaitez changer dans votre quotidien. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix de logement.

### Méthode et sources

Les pratiques domicile-travail proviennent des bases infracommunales de l’INSEE ; les secteurs sont des IRIS statistiques, dont les libellés ne correspondent pas toujours aux quartiers d’usage. Ce sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés, et les comparaisons ne mesurent pas l’effet d’un déménagement.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte autant au sein du secteur. Les distances sont à vol d’oiseau, jusqu’à l’adresse de l’établissement, sans décrire le chemin réel ni l’usage des équipements.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : médiane du dernier prix déclaré par chaque station pendant la semaine considérée. Les stations déclarantes peuvent différer entre les semaines. Le tableau présente un scénario de surcoût ; une hausse passée ne préjuge pas de l’évolution future.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario, données en section 7 du dossier, sont rattachées ci-dessous à un identifiant de scénario existant. Les chiffres contenus dans les noms de secteurs sont également recensés.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse gazole | 0,68 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse SP95-E10 | 0,25 €/L | `carburant.e10.ecart` | oui |
| Périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements | 200 allers-retours par an | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Légende du scénario — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du scénario — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10 | environ 30 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10 | environ 90 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10 | environ 210 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — libellé | 2 dans « Chantiers 2 » | `iris.voiture.min` | oui |
| Pratiques — part de la voiture | 22 % | `iris.voiture.min` | oui |
| Pratiques — libellé | 5 dans « Clagny 5 » | `iris.voiture.max` | oui |
| Pratiques — part de la voiture | 51 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Équipements — distance du panier | 500 m | `iris.786460302.panier_500m`, `iris.786460605.panier_500m` | oui |
| Équipements — libellé | 2 dans « Chantiers 2 » | `iris.786460302.panier_500m` | oui |
| Équipements — part des adresses | 94 % | `iris.786460302.panier_500m` | oui |
| Équipements — libellé | 3 dans « Saint-Louis 3 » | `iris.786460605.panier_500m` | oui |
| Équipements — part des adresses | 27 % | `iris.786460605.panier_500m` | oui |
| Équipements — part de la voiture | 24 % | `iris.786460605.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.786460302.panier_500m`, `iris.786460605.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | En ouverture, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après le passage comparant Chantiers 2 et Clagny 5 | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Chantiers 2, Clagny 5 et Saint-Louis 3. Le texte les désigne comme des secteurs statistiques ; leur correspondance avec les quartiers d’usage reste à relire.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, concernant les hausses et le scénario utilisés.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante | Elle donne un point de départ pour examiner les déplacements professionnels depuis l’adresse envisagée. | Supprimé : les pratiques du secteur ne renseignent pas le trajet personnel depuis une adresse. |
| Consigne interne — à revoir | Le dossier mesure un panier réunissant | On considère ici un panier réunissant |
| Lisibilité — à revoir | Son absence complète à cette distance ne signifie pas non plus que tous les équipements manquent. | L’absence de ce panier à cette distance ne signifie pas non plus que tous les équipements manquent. |