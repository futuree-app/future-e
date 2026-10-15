## A. Question et format

**Question principale :** à Fréjus, comment choisir un secteur quand on veut moins utiliser la voiture pour travailler et avoir les équipements du quotidien à proximité ?

Le contraste entre Fréjus Plage 1 et Madeleine Thoron montre que les secteurs où la voiture est moins utilisée pour travailler ne sont pas nécessairement ceux où les équipements sont les plus proches. Pour chercher un logement, ces deux observations méritent donc d’être examinées séparément.

**Appuis :** `iris.830610108.voiture`, `iris.830610106.voiture`, `iris.830610108.panier_500m`, `iris.830610106.panier_500m`, `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`.

**Format retenu :** article court, avec l’ouverture carburant et son scénario.

**Pistes écartées :** stationnement, motorisation des ménages et comparaison nationale, qui disperseraient la question ; autres destinations de travail, qui n’apportent pas d’éclairage indispensable au contraste retenu.

## B. Article

# À Fréjus, où chercher pour moins prendre la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole a augmenté de **0,69 €/L**, celui du SP95-E10 de **0,47 €/L**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Fréjus. Pour une recherche de logement, cette hausse invite à regarder les déplacements que l’on souhaite changer.

Le scénario suivant chiffre le surcoût de carburant selon la distance. Il retient **6 L/100 km**, **200 allers-retours domicile-travail par an**, et des hausses arrondies à **5 centimes** : **+0,70 €/L** pour le gazole et **+0,45 €/L** pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre 2025 et 2026 ; carburant seul.*

| Trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 80 € | environ 50 € |
| 15 km | environ 250 € | environ 160 € |
| 35 km | environ 590 € | environ 380 € |

Ces distances ne correspondent à aucun secteur particulier. À Fréjus, le choix d’une adresse demande de regarder le trajet professionnel, puis ce qui se trouve autour du logement.

## Travailler dans la commune, depuis quelle adresse ?

Selon le recensement **2022**, **58 %** des actifs occupés résidant à Fréjus travaillent dans la commune. Parmi ces actifs qui habitent et travaillent à Fréjus, **75 %** utilisent principalement la voiture. Une annonce située dans la même commune que votre emploi ne suffit donc pas à apprécier les possibilités de déplacement.

Les pratiques varient aussi selon le secteur de résidence. À **Fréjus Plage 1**, la voiture est le mode principal pour aller travailler de **65 %** des actifs du secteur, contre **85 %** à **Madeleine Thoron**. Ces parts concernent les actifs qui y résident, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail, recensement 2022.*

La carte donne un repère pour examiner les annonces. Pour départager des logements, reste à regarder le trajet entre chaque adresse et votre lieu de travail.

## Les courses et l’école dessinent un autre contraste

Le trajet professionnel ne couvre qu’une partie des déplacements à envisager. Pour une installation en famille, la proximité des équipements apporte un autre éclairage sur ces mêmes secteurs.

À Fréjus Plage 1, **31 %** des adresses réunissent un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À Madeleine Thoron, cette part atteint **97 %**.

Madeleine Thoron mérite ainsi d’être examiné pour cette proximité, même si la voiture y reste largement utilisée pour travailler. Pendant une visite, repérez les accès aux équipements qui vous intéressent, les traversées et le chemin réellement praticable depuis le logement. Si vous envisagez le bus pour certains déplacements, vérifiez vos jours et horaires sur le site du réseau [Le Bus](https://www.esterelcotedazur-lebus.fr/).

## Votre projet, votre adresse

Si vous déménagez pour rapprocher le travail et la vie de famille, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour apprécier sa place dans votre quotidien.

### Méthode et sources

Les pratiques professionnelles proviennent du fichier MOBPRO et des bases infracommunales de l’INSEE ; elles décrivent le mode principal déclaré. Ce sont des estimations par sondage : les groupes selon le lieu de travail sont distincts et ne sont pas croisés avec les secteurs de résidence. Les secteurs cités sont des IRIS statistiques, dont les libellés peuvent différer des noms usuels des quartiers.

Les proximités utilisent la Base adresse nationale et la BPE **2025** de l’INSEE. Chaque adresse compte pareil au sein d’un secteur ; la proximité ne renseigne pas sur l’usage des équipements. Les prix médians proviennent de prix-carburants.gouv.fr ; une station sans déclaration pendant une semaine n’entre pas dans sa médiane.

## C. Correspondance interne — non publiée

Les identifiants du scénario couvrent également les hypothèses communes indiquées en section 7 du dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,69 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse de l’essence | 0,47 €/L | `carburant.e10.ecart` | oui |
| Chapeau — désignation du carburant | SP95-E10 | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes | oui |
| Hypothèses — hausse retenue gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue essence | +0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Hypothèses — désignation du carburant | SP95-E10 | `scenario.carburant.e10.5km` | oui |
| Légende du scénario — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du scénario — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — désignation du carburant | SP95-E10 | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — essence, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — essence, deuxième ligne | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — essence, troisième ligne | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune` | oui |
| Pratiques — travaillent à Fréjus | 58 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Fréjus | 75 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — libellé du secteur | Fréjus Plage 1 | `iris.830610108.voiture` | oui |
| Pratiques — voiture à Fréjus Plage 1 | 65 % | `iris.830610108.voiture` | oui |
| Pratiques — voiture à Madeleine Thoron | 85 % | `iris.830610106.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.830610108.voiture`, `iris.830610106.voiture` | oui |
| Équipements — libellé du secteur | Fréjus Plage 1 | `iris.830610108.panier_500m` | oui |
| Équipements — adresses à Fréjus Plage 1 | 31 % | `iris.830610108.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m à vol d’oiseau | `iris.830610108.panier_500m`, `iris.830610106.panier_500m` | oui |
| Équipements — adresses à Madeleine Thoron | 97 % | `iris.830610106.panier_500m` | oui |
| Méthode — millésime BPE | 2025 | `iris.830610108.panier_500m`, `iris.830610106.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Fréjus Plage 1 et Madeleine Thoron | Aucune pour la production automatique ; repérer les secteurs cités. Libellés manuels seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **Carburant et scénario — `carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Secteurs — `iris.ecart_voiture` :** relire les libellés « Fréjus Plage 1 » et « Madeleine Thoron ». Ils sont présentés ici comme des secteurs statistiques.
- **Destination de travail — `mobpro.voiture_selon_destination` :** la vérification signalée porte sur l’intérêt du choix des communes du groupe. Ce groupe n’est pas utilisé ; seule la catégorie des actifs habitant et travaillant à Fréjus est retenue.