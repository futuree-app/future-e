## A. Question et format

**Question principale :** à Villejuif, comment choisir une adresse pour utiliser moins la voiture, en distinguant les trajets de travail de la proximité des services du quotidien ?

Le contraste utile est celui de Mermoz : la part de la voiture pour aller travailler y est la plus élevée des secteurs étudiés, alors que toutes ses adresses disposent du panier de services à proximité. Pour une recherche de logement, cela invite à examiner séparément le trajet professionnel et les déplacements autour du domicile.

**Appuis :** `mobpro.modes.tc`, `mobpro.modes.voiture`, `iris.voiture.min`, `iris.voiture.max`, `iris.940760116.panier_500m`, `iris.940760103.panier_500m`.

**Format :** article court, avec le tableau carburant et la carte des pratiques par secteur.

**Pistes écartées :** destinations de travail, comparaison entre communes, possession automobile et stationnement, pour concentrer le texte sur les repères utiles au choix d’une adresse.

## B. Article

# Villejuif : quels repères pour chercher un logement et moins utiliser la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,61 €/L et celui du SP95-E10 de 0,34 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Villejuif. Cette hausse donne une raison concrète de regarder les déplacements associés à un futur logement.

Le scénario suivant retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses retenues, arrondies à 5 centimes, sont de +0,60 €/L pour le gazole et de +0,35 €/L pour le SP95-E10.

*Scénario carburant — octobre 2026.*

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour orienter une recherche à Villejuif, regardons ensuite les pratiques liées au travail, puis la proximité des courses et de l’école.

## Des pratiques différentes selon le secteur

D’après le recensement 2022, les transports en commun sont le mode principal pour aller travailler de 57 % des actifs qui résident à Villejuif ; la voiture, de 24 %.

À l’intérieur de la commune, la part de la voiture va de 16 % parmi les actifs qui habitent le secteur Zola à 37 % parmi ceux qui habitent Mermoz, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Part de la voiture comme mode principal domicile-travail des actifs résidant dans chaque secteur — recensement 2022.*

Situer une annonce sur cette carte donne un repère pour préparer ses questions. Pour le logement envisagé, examinez ensuite les possibilités de déplacement vers votre propre lieu de travail, avec vos horaires de départ et de retour.

## À Mermoz, les services proches accompagnent des usages variés

Le trajet professionnel ne couvre qu’une partie des déplacements à examiner avant de déménager. Pour les courses, la pharmacie ou l’école, les données de proximité apportent un autre éclairage.

À Mermoz, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Ce panier est donc présent autour des adresses du secteur où la part de la voiture pour travailler est la plus élevée. Aux Esselières, 46 % des adresses disposent de ce panier complet.

Lors d’une visite aux Esselières, repérez séparément le commerce, la pharmacie et l’école autour du logement visé. À Mermoz comme aux Esselières, parcourir les accès à pied permet d’examiner les chemins réels derrière cette proximité à vol d’oiseau.

## Votre projet, votre adresse

Si votre déménagement vise à réduire la place de la voiture, partez de l’organisation quotidienne que vous souhaitez. Avec futur•e, explorez l’adresse envisagée à partir de ce projet pour l’examiner dans son ensemble.

### Méthode et sources

Pratiques domicile-travail : INSEE, recensement, estimations par sondage. Les secteurs sont les IRIS statistiques ; leurs libellés peuvent différer des noms de quartiers d’usage. Les écarts décrivent des pratiques, sans mesurer l’effet du lieu de résidence.

Équipements : Base adresse nationale et Base permanente des équipements 2025 de l’INSEE. Les distances portent sur l’adresse de l’établissement ; la proximité ne renseigne pas sur son usage.

Carburant : flux officiel de prix-carburants.gouv.fr, médiane entre stations du dernier prix déclaré dans chacune des semaines considérées.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,61 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,34 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — arrondi | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèse commune, section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,35 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — période | octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 40 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 130 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 290 € | `scenario.carburant.e10.35km` | oui |
| Pratiques communales — millésime | 2022 | `mobpro.modes.tc`, `mobpro.modes.voiture` | oui |
| Pratiques communales — transports en commun | 57 % | `mobpro.modes.tc` | oui |
| Pratiques communales — voiture | 24 % | `mobpro.modes.voiture` | oui |
| Secteur Zola — voiture | 16 % | `iris.voiture.min` | oui |
| Secteur Mermoz — voiture | 37 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Mermoz — couverture du panier | toutes les adresses, soit 100 % | `iris.940760116.panier_500m` | oui |
| Mermoz — distance du panier | moins de 500 m à vol d’oiseau | `iris.940760116.panier_500m` | oui |
| Esselières — couverture du panier | 46 % | `iris.940760103.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.940760116.panier_500m`, `iris.940760103.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture à Zola et Mermoz | Aucune pour la production automatique ; repérer les secteurs cités. Libellés à poser à la main seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **Libellés des secteurs :** relire Zola, Mermoz et Esselières. Le texte les désigne comme secteurs statistiques.
- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
