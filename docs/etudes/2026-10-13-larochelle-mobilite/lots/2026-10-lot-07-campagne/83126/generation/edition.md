## A. Question et format

**Question principale :** à La Seyne-sur-Mer, comment chercher un logement proche des services sans présumer de la place que prendra la voiture pour travailler ?

Centre Ville-Peyron associe proximité des équipements et part de la voiture moins élevée que dans les autres secteurs étudiés. Mais à Daniel, une forte proximité des services coexiste avec un usage majoritaire de la voiture pour travailler. Pour une recherche de logement, ces observations invitent à examiner séparément les déplacements du quotidien et le trajet professionnel.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.831260101.panier_500m`, `iris.831260505.panier_500m`, `iris.831260505.voiture`, `mobpro.voiture_selon_destination.meme_commune`.

**Format retenu :** article court, avec l’ouverture carburant et son scénario.

**Pistes écartées :** comparaison nationale, flux entrants, statut d’occupation et motorisation des ménages, pour concentrer le récit sur le lien entre secteur, services proches et travail.

## B. Article

# La Seyne-sur-Mer : quelle place prend la voiture selon les secteurs ?

Dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de La Seyne-sur-Mer, le prix médian du gazole augmente de 0,67 €/L entre les semaines du 6 octobre 2025 et du 5 octobre 2026. Pour le SP95-E10, la hausse atteint 0,50 €/L. Au moment de choisir un logement, le trajet à répéter pour aller travailler mérite donc sa place dans la recherche.

Le scénario suivant porte sur le **surcoût annuel de carburant**, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Il retient les hausses arrondies à 5 centimes : +0,65 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre les semaines indiquées ci-dessus, sans attribution à un secteur ou à une destination.*

Ces distances sont des hypothèses. Pour orienter une recherche à La Seyne-sur-Mer, les pratiques locales apportent un autre éclairage : quelle place la voiture occupe-t-elle selon le secteur de résidence et le lieu de travail ?

## Des pratiques différentes selon les secteurs

Les pratiques domicile-travail du recensement de 2022 montrent des contrastes : à Centre Ville-Peyron, 57 % des actifs résidents déclarent la voiture comme mode principal pour travailler, contre 83 % à Vignelongue. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Source : INSEE, recensement 2022. Les secteurs sont les IRIS statistiques.*

À Centre Ville-Peyron, la voiture reste toutefois le mode principal de la majorité des actifs.

Le lieu de travail appelle ensuite un examen distinct. Parmi les actifs qui habitent **et travaillent à La Seyne-sur-Mer**, 68 % utilisent principalement la voiture pour ce déplacement.

## Courses et école : regarder ce qui entoure le logement

Le travail n’épuise pas la question des déplacements. Pour choisir une adresse, la proximité des commerces, de la pharmacie ou de l’école apporte un repère supplémentaire.

À Centre Ville-Peyron, toutes les adresses disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. À Daniel, cette proximité concerne 91 % des adresses, tandis que 75 % des actifs du secteur vont principalement travailler en voiture. Les services proches et le trajet professionnel demandent bien deux lectures distinctes.

Lors d’une visite, parcourez les chemins entre le logement et les équipements qui vous intéressent. Pour examiner une option en transports en commun, la page [« Lignes et horaires » du RESEAU MISTRAL](https://www.reseaumistral.com/se-deplacer/lignes) permet de rechercher les horaires ; les détails figurent sur la page de chaque ligne.

## Votre projet, votre adresse

Si vous déménagez pour rapprocher le travail ou simplifier la vie en famille, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour la replacer dans l’ensemble de votre choix de logement.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE et des bases infracommunales. Elles portent sur les actifs occupés ; les données de mode principal incluent ceux qui travaillent à domicile. Les résultats sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

Les données par secteur et par commune de travail ne sont pas croisées. Elles décrivent des groupes distincts, sans mesurer l’effet d’un déménagement. Les noms cités sont des libellés d’IRIS, qui peuvent différer des noms de quartiers usuels.

La proximité des équipements est mesurée depuis les adresses de la Base adresse nationale vers les établissements de la Base permanente des équipements 2025 de l’INSEE. Elle ne décrit ni leur fréquentation ni le chemin réel à parcourir.

Les prix proviennent du flux officiel prix-carburants.gouv.fr : médiane des derniers prix déclarés dans la semaine par les stations du périmètre. Les stations présentes peuvent différer entre les semaines. Le scénario porte sur le carburant seul. Le renvoi vers les horaires repose sur la documentation officielle du réseau.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Ouverture — hausse du gazole | 0,67 €/L | `carburant.gazole.ecart` | oui |
| Ouverture — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture — hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue pour le gazole | +0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue pour le SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques — Centre Ville-Peyron | 57 % | `iris.voiture.min` | oui |
| Pratiques — Vignelongue | 83 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Travail dans la commune | 68 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Équipements — Centre Ville-Peyron | toutes les adresses, soit 100 % | `iris.831260101.panier_500m` | oui |
| Équipements — distance du panier commun aux secteurs cités | 500 m | `iris.831260101.panier_500m`, `iris.831260505.panier_500m` | oui |
| Équipements — Daniel | 91 % | `iris.831260505.panier_500m` | oui |
| Pratiques — Daniel | 75 % | `iris.831260505.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.831260101.panier_500m`, `iris.831260505.panier_500m` — BPE 2025 | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Centre Ville-Peyron et Vignelongue | Aucune pour la production ; classes et repères automatiques. Libellés posés à la main seulement pour une version soignée |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Centre Ville-Peyron, Vignelongue et Daniel. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : la relecture prévue porte sur le choix du groupe de communes de travail. Ce groupe n’est pas utilisé ici ; seul le fait concernant les actifs qui habitent et travaillent à La Seyne-sur-Mer est retenu.

Aucun autre doute de lecture relevé.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : recommandation de secteur et titre | « La Seyne-sur-Mer : où chercher pour utiliser moins la voiture ? » ; « Centre Ville-Peyron mérite ainsi d’être examiné si vous souhaitez moins conduire. La voiture y reste toutefois le mode principal de la majorité des actifs. » | « La Seyne-sur-Mer : quelle place prend la voiture selon les secteurs ? » ; « À Centre Ville-Peyron, la voiture reste toutefois le mode principal de la majorité des actifs. » |
| Raisonnement — a_revoir : conclusion sur le trajet du lecteur | « Chercher un emploi et un logement dans la même commune ne suffit donc pas à renseigner le trajet entre les deux. » | Phrase supprimée. |
| Méthode — a_revoir : millésime des équipements | « vers les établissements de la Base permanente des équipements de l’INSEE » | « vers les établissements de la Base permanente des équipements 2025 de l’INSEE ». Millésime ajouté à la correspondance C. |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
