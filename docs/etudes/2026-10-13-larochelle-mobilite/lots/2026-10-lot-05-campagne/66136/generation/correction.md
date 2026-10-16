## A. Question et format

**Question principale :** que regarder au-delà de la commune de travail pour chercher un logement à Perpignan où utiliser moins la voiture ?

Habiter et travailler à Perpignan s’accompagne encore d’un usage majoritaire de la voiture (`mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`). Les contrastes entre secteurs orientent la recherche (`iris.voiture.min`, `iris.voiture.max`), tandis que Las Cobas 1 montre l’intérêt d’examiner séparément proximité des équipements et trajet professionnel (`iris.661360901.panier_500m`, `iris.661360901.voiture`).

**Format retenu : article complet**, resserré autour de cette découverte. L’ouverture carburant et son scénario sont utilisables.

**Pistes écartées :** stationnement, équipement automobile, flux entrants et comparaison entre villes n’aident pas ici à préciser davantage le choix d’une adresse ; les destinations extérieures ajouteraient un détour au raisonnement.

## B. Article

# À Perpignan, la place de la voiture varie selon les secteurs

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,78 €/L, et celui du SP95-E10 de 0,53 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Perpignan. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

### Le surcoût selon la distance du travail

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses utilisées sont arrondies aux 5 centimes : +0,80 €/L pour le gazole et +0,55 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel de carburant — hausse 2025–2026.*

| Trajet aller | Gazole | SP95-E10 |
|---|---:|---:|
| 5 km | environ 100 € | environ 70 € |
| 15 km | environ 290 € | environ 200 € |
| 35 km | environ 670 € | environ 460 € |

Ces distances sont des hypothèses, sans attribution à un secteur ou à une commune de travail. Pour orienter une recherche à Perpignan, il faut ensuite regarder les pratiques locales : que nous apprennent-elles sur la place de la voiture selon les secteurs et sur les trajets à vérifier ?

### Travailler dans la commune laisse ouverte la question de l’adresse

Le recensement de 2022 donne un premier repère : 75 % des actifs occupés qui résident à Perpignan travaillent dans la commune. Parmi ces actifs qui habitent et travaillent à Perpignan, 69 % déclarent la voiture comme mode principal pour rejoindre leur travail.

Une annonce située dans la même commune que votre emploi laisse donc ouverte la question du déplacement concret. Le secteur de résidence apporte un autre éclairage : parmi les actifs occupés qui habitent chaque secteur, quelle que soit leur commune de travail, la part de la voiture comme mode principal est de 34 % à Saint-Jean et de 89 % à Porte d’Espagne.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail, recensement 2022.*

La carte permet de situer ces contrastes. Dans les deux cas, partez de l’adresse du logement et de votre destination professionnelle pour examiner le trajet envisagé.

### Des équipements proches, un trajet de travail à examiner séparément

Le travail n’épuise pas la question des déplacements. Les courses, la pharmacie ou l’accompagnement à l’école peuvent aussi peser dans le choix d’un logement, notamment pour une installation en famille.

À Saint-Jean, 95 % des adresses disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. Ce panier d’équipements fournit une piste concrète à examiner autour d’une annonce.

Las Cobas 1 apporte un autre éclairage : toutes les adresses du secteur disposent de ce même panier à cette distance, tandis que 82 % des actifs occupés qui y résident utilisent principalement la voiture pour travailler. La proximité des équipements et les pratiques professionnelles décrivent donc des dimensions différentes du quotidien.

Pour une annonce dans ce secteur, examinez les services proches en fonction des déplacements que vous souhaitez changer : faire certaines courses près du logement, par exemple, ne pose pas la même question que rejoindre votre emploi.

### Pendant la visite, suivre les déplacements qui vous concernent

À partir du logement, repérez les équipements utiles à votre projet et suivez le chemin pour les rejoindre. Cette visite donne un sens concret à la proximité indiquée : le point d’arrivée et le parcours comptent dans votre choix.

Si vous envisagez un trajet en bus, le site de [Sankéo](https://www.sankeo.com/) renvoie vers « Mon itinéraire », « Lignes, horaires, plans » et « Infos Trafic ». Examinez le trajet envisagé et les horaires correspondant aux jours où vous en auriez besoin, en tenant compte aussi du retour.

### Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail, vous installer en famille ou préparer une retraite avec moins de déplacements en voiture ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour apprécier sa place dans le quotidien que vous souhaitez construire.

### Méthode et sources

Les pratiques proviennent du recensement de l’INSEE : fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les comparaisons portent sur des groupes distincts et ne mesurent pas l’effet d’un déménagement. Les secteurs sont les IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

Les équipements proviennent de la Base permanente des équipements de l’INSEE, millésime 2025, et les adresses de la Base adresse nationale. Leur proximité ne renseigne pas sur leur utilisation.

Les prix proviennent de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré dans chaque semaine. Les informations documentaires sur Sankéo proviennent des sources officielles du réseau citées ci-dessus.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,78 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,53 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue, gazole | +0,80 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,55 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 100 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 290 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 200 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 670 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 460 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime du recensement | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — actifs résidents travaillant dans la commune | 75 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Perpignan | 69 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — voiture à Saint-Jean | 34 % | `iris.voiture.min` | oui |
| Pratiques — voiture à Porte d’Espagne | 89 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Équipements — adresses de Saint-Jean | 95 % | `iris.661360103.panier_500m` | oui |
| Équipements — distance du panier | 500 m | `iris.661360103.panier_500m` | oui |
| Équipements — nom du secteur | Las Cobas 1 | `iris.661360901.panier_500m`, `iris.661360901.voiture` | oui |
| Équipements — totalité des adresses de Las Cobas 1 | toutes les adresses — 100 % | `iris.661360901.panier_500m` | oui |
| Équipements — voiture à Las Cobas 1 | 82 % | `iris.661360901.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.661360103.panier_500m`, `iris.661360901.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture à Saint-Jean et Porte d’Espagne | Aucune pour la production avec classes automatiques et repères numérotés accompagnés de leur liste ; libellés à poser à la main seulement pour une version soignée |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Saint-Jean, Porte d’Espagne et Las Cobas 1. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : le fait relatif aux actifs habitant et travaillant à Perpignan est utilisé. La vérification indiquée porte sur le choix du groupe de communes extérieures ; ce groupe n’est pas utilisé ici.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| 1 — Recommandation de secteurs déduite des pratiques domicile-travail | « La carte permet de situer ces contrastes et d’élargir la recherche au-delà des premières annonces repérées. Saint-Jean constitue une piste à examiner si vous souhaitez moins conduire ; pour un logement à Porte d’Espagne, l’usage très majoritaire de la voiture invite à regarder précisément les alternatives adaptées à vos déplacements. » | « La carte permet de situer ces contrastes. » La phrase suivante, « Dans les deux cas, partez de l’adresse du logement et de votre destination professionnelle pour examiner le trajet envisagé. », est conservée. |
| 2 — Titre et transition présentant les secteurs comme des cibles pour moins conduire | Titre : « Utiliser moins la voiture à Perpignan : quels secteurs regarder ? » Transition : « sur les secteurs à examiner » | Titre : « À Perpignan, la place de la voiture varie selon les secteurs ». Transition : « sur la place de la voiture selon les secteurs ». |