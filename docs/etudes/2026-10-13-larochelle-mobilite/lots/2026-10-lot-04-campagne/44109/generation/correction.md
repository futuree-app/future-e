## A. Question et format

**Question principale :** à Nantes, comment choisir un secteur pour utiliser moins la voiture, en tenant compte du lieu de travail et des équipements proches ?

Les pratiques diffèrent fortement entre secteurs, mais la proximité des équipements ne décrit pas à elle seule les déplacements domicile-travail. Pour chercher un logement, ces observations invitent à examiner ensemble le secteur, la destination professionnelle et l’adresse précise.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`, `iris.441090802.voiture` et `iris.441090802.panier_500m`.

**Format retenu : article court**, avec l’ouverture carburant prévue par la série.

Pistes écartées : possession automobile, stationnement et actifs venant travailler à Nantes, qui disperseraient la question sans être nécessaires à sa réponse.

## B. Article

# À Nantes, où chercher un logement pour moins prendre la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de 0,72 €/L pour le gazole et de 0,48 €/L pour le SP95-E10, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Nantes.

Pour relier cette hausse à une recherche de logement, le scénario suivant montre le **surcoût annuel de carburant selon la distance domicile-travail**. Il retient une consommation de 6 L/100 km et 200 allers-retours par an, avec des hausses arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

Ces montants donnent une raison concrète d’examiner les déplacements avant de retenir une annonce. À Nantes, que montrent les pratiques selon le secteur de résidence et le lieu de travail ?

## Le secteur et la destination du trajet du matin

Les pratiques du recensement de 2022 concernent ici les actifs occupés qui habitent chaque secteur, quelle que soit leur commune de travail. La voiture est le mode principal pour aller travailler de **18 % des actifs de Decré-Cathédrale**, contre **67 % de ceux de Bout des Landes**.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La destination professionnelle distingue aussi les pratiques. Parmi les actifs qui habitent Nantes et y travaillent, 31 % vont principalement travailler en voiture. Cette part est de 62 % parmi les actifs nantais qui travaillent à Saint-Herblain, Rezé, Saint-Sébastien-sur-Loire, Orvault, Vertou ou Couëron.

Pour sélectionner les annonces à approfondir, regardez donc le secteur de résidence en gardant votre lieu de travail en tête. La carte décrit les pratiques des actifs du secteur ; votre recherche porte sur un trajet précis.

## Des équipements proches, même là où la voiture est fréquente

Le trajet professionnel laisse ouverte une autre question : où se trouvent les courses et l’école par rapport au logement envisagé ?

À la Chauvinière, toutes les adresses disposent à la fois d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. La voiture est le mode principal de 61 % des actifs du secteur pour aller travailler.

Pour tout logement envisagé, regardez ces deux aspects : les équipements autour du logement et le déplacement professionnel. Lors d’une visite, examinez le chemin réel vers les commerces et, si cela vous concerne, vers l’école envisagée. Pour vérifier votre trajet et vos horaires en transports collectifs, consultez le [site du réseau Naolib](https://naolib.fr/).

## Votre projet, votre adresse

Si vous déménagez pour vous rapprocher du travail ou simplifier la vie en famille, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix.

## Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, recensement de 2022, fichier MOBPRO et bases infracommunales. Ce sont des estimations par sondage ; les groupes de destination sont distincts et leurs écarts ne mesurent pas l’effet d’un déménagement. Les six communes sont retenues automatiquement : les plus peuplées de l’unité urbaine, hors Nantes. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

Les équipements proviennent de la BPE 2025, rapprochée des adresses de la Base adresse nationale. Leur proximité ne décrit pas leur utilisation. Les prix viennent du flux officiel prix-carburants.gouv.fr : les médianes portent sur le dernier prix déclaré par chaque station pendant la semaine considérée.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse gazole | 0,72 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse gazole retenue | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse SP95-E10 retenue | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — Decré-Cathédrale | 18 % | `iris.voiture.min` | oui |
| Pratiques — Bout des Landes | 67 % | `iris.voiture.max` | oui |
| Destination — travail à Nantes | 31 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination — travail dans le groupe nommé | 62 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements — Chauvinière | « toutes les adresses » : 100 % | `iris.441090802.panier_500m` | oui |
| Équipements — distance | moins de 500 m | `iris.441090802.panier_500m` | oui |
| Pratiques — Chauvinière | 61 % | `iris.441090802.voiture` | oui |
| Méthode — recensement | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Méthode — sélection des communes | six communes | `mobpro.voiture_selon_destination.communes_voisines` — règle de sélection, section 1 | oui |
| Méthode — équipements | 2025 | `iris.441090802.panier_500m` — source des équipements explicitée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses du scénario | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Decré-Cathédrale et Bout des Landes | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés à poser à la main seulement pour une version soignée. |

Le millésime des pratiques doit figurer sur la carte.

Vérifications avant publication concernant les faits utilisés :

- **Carburant et scénario** — Réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Communes de travail** — Relire l’intérêt du groupe constitué de Saint-Herblain, Rezé, Saint-Sébastien-sur-Loire, Orvault, Vertou et Couëron. Sa composition est explicitement donnée dans l’article.
- **Secteurs** — Relire les libellés Decré-Cathédrale, Bout des Landes et Chauvinière. L’article les présente comme des secteurs statistiques.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur — consommation : écartée | « 6 L/100 km » | Inchangé : la section 7 donne explicitement cette consommation parmi les hypothèses communes du scénario. La correspondance C le précise déjà. |
| Valeur — déplacements annuels : écartée | « 200 allers-retours par an » | Inchangé : la section 7 donne explicitement ce nombre parmi les hypothèses communes du scénario. La correspondance C le précise déjà. |
| Raisonnement — opposition et évolution non mesurées | « Pourtant, la voiture reste le mode principal de 61 % des actifs du secteur pour aller travailler. » | « La voiture est le mode principal de 61 % des actifs du secteur pour aller travailler. » |
| Raisonnement — recommandation du secteur | « Ce secteur mérite donc d’être regardé sous ces deux aspects » | « Pour tout logement envisagé, regardez ces deux aspects » |
| Méthode — sélection des six communes | « les groupes de destination sont distincts et leurs écarts ne mesurent pas l’effet d’un déménagement. » | Phrase conservée, suivie de : « Les six communes sont retenues automatiquement : les plus peuplées de l’unité urbaine, hors Nantes. » Correspondance C complétée. |