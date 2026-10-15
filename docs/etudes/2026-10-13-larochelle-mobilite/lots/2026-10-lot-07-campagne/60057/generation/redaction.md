## A. Question et format

**Question principale :** que regarder dans le choix d’un secteur et d’une adresse pour utiliser moins la voiture, même quand on travaille à Beauvais ?

Le travail dans la commune s’accompagne encore d’un usage majoritaire de la voiture. Les différences entre secteurs, rapprochées de la proximité des équipements quotidiens, donnent des points d’attention pour sélectionner des annonces et préparer les visites.

Appuis : `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min`, `iris.voiture.max`, `iris.600570403.panier_500m`, `iris.600570202.panier_500m`.

**Format retenu : article court**, avec l’ouverture carburant imposée par la série.

Pistes écartées : comparaison nationale peu distinctive ; stationnement, motorisation et flux entrants secondaires pour cette question ; bus inutilisables en l’état.

## B. Article

# À Beauvais, choisir son adresse pour moins prendre la voiture

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,74 €/L et celui du SP95-E10 de 0,49 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Beauvais. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

Le scénario suivant donne un repère de **surcoût annuel de carburant selon la distance**. Il repose sur une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an, avec des hausses arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance à l’aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

À Beauvais, quels repères peuvent alors aider à chercher un logement pour moins prendre la voiture ?

## Travailler dans la commune, puis regarder le secteur

Dans les pratiques du recensement 2022, **69 % des actifs qui résident à Beauvais travaillent dans la commune**. Parmi ces actifs qui habitent et travaillent à Beauvais, 64 % déclarent la voiture comme mode principal pour aller travailler. Pour sélectionner une annonce, connaître la commune de son emploi ne suffit donc pas à trancher la question du déplacement.

Les pratiques diffèrent aussi selon le secteur de résidence : la voiture est le mode principal de 52 % des actifs d’Argentine Est, contre 88 % à Saint-Just des Marais. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte aide à repérer ces différences avant d’examiner les annonces. Elle donne une raison d’explorer un secteur, puis de regarder la liaison entre le logement envisagé et son propre lieu de travail.

## Les courses et l’école se regardent depuis le logement

Réduire les déplacements en voiture concerne aussi les courses ou l’accompagnement des enfants. Pour cette partie du quotidien, les équipements proches apportent un autre éclairage.

À Argentine Est, **85 % des adresses** réunissent un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Saint-Just des Marais, aucune adresse ne réunit ce panier complet dans ce même périmètre.

Pour une annonce à Argentine Est, situez précisément le logement par rapport aux équipements que vous utiliseriez. À Saint-Just des Marais, repérez séparément ceux qui comptent pour vous. Pendant la visite, parcourez les chemins depuis l’entrée du logement : accès aux établissements et traversées font partie de l’examen concret de l’adresse.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à organiser une installation en famille avec moins de déplacements en voiture ? Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour examiner ce qui peut peser dans votre choix de logement.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE ; leur dénominateur inclut les actifs sans déplacement professionnel. Les résultats sont des estimations par sondage. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers d’usage ; leurs parts ne sont pas croisées avec la commune de travail.

La proximité des équipements repose sur la Base adresse nationale et la BPE 2025 de l’INSEE : chaque adresse du secteur compte également. Les distances à vol d’oiseau ne décrivent pas les chemins réels. Les prix médians proviennent de prix-carburants.gouv.fr, selon les déclarations disponibles dans chaque semaine.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Ouverture — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Ouverture — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Ouverture — hausse du SP95-E10 | 0,49 €/L | `carburant.e10.ecart` | oui |
| Ouverture — périmètre des stations | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — distance, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — distance, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — travail dans la commune | 69 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Beauvais | 64 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Secteurs — voiture à Argentine Est | 52 % | `iris.voiture.min` | oui |
| Secteurs — voiture à Saint-Just des Marais | 88 % | `iris.voiture.max` | oui |
| Équipements — adresses à Argentine Est | 85 % | `iris.600570403.panier_500m` | oui |
| Équipements — distance du panier | 500 m à vol d’oiseau | `iris.600570403.panier_500m`, `iris.600570202.panier_500m` | oui |
| Équipements — adresses à Saint-Just des Marais | aucune adresse, soit 0 % | `iris.600570202.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.600570403.panier_500m`, `iris.600570202.panier_500m` — source BPE, sections 2 et 3 | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses ; contenu reproduit dans l’article | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Argentine Est et Saint-Just des Marais | Aucune pour la production automatique ; libellés posés à la main seulement pour une version soignée. Faire figurer le millésime et repérer les secteurs cités. |

Vérifications concernant les faits utilisés :

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.
- **Secteurs :** relire les libellés INSEE d’Argentine Est et de Saint-Just des Marais. Le texte les présente comme des secteurs statistiques.
- **Commune de travail :** la vérification relative à `mobpro.voiture_selon_destination.*` porte sur le choix du groupe de communes. Seul le fait concernant le travail à Beauvais est utilisé ici ; aucun groupe extérieur n’est présenté.

Aucun autre doute de lecture relevé.