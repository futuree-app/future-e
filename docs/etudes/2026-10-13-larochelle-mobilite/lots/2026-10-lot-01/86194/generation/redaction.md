## A. Question et format

**Question principale.** À Poitiers, depuis quel secteur, et pour quel lieu de travail, les actifs prennent-ils le moins la voiture ? Et que faut-il vérifier pendant une visite quand on veut moins s'en servir ?

**Ce que la réponse apprend au lecteur.** La part communale de la voiture cache de grands écarts. Selon le secteur, elle va de 33 % à 77 %, soit 44 points d'écart. Selon la commune de travail, elle va de 54 % à 76 %. Le choix du quartier et celui de l'emploi sont donc deux repères distincts. Dans les secteurs où la voiture compte le moins, peu de ménages ont une place réservée. Le lecteur sait ainsi où regarder et ce qu'il doit vérifier dans l'annonce.

**Faits qui la soutiennent.**
- Écart entre secteurs : `iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min` et quelques cellules `iris.*`.
- Lieu de travail : `mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`, `mobpro.travaille_dans_commune`, `destination.86062.tc`.
- Repère commun : `comparaison.voiture.*`.
- Proximité des équipements : `iris.*.panier_500m`.
- Stationnement : `iris.menages_commune.menages_stationnement_reserve` et quelques `iris.*.stationnement_reserve`.
- Voiture possédée mais non utilisée pour le travail : `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture`.
- Ouverture sur le carburant : `carburant.*`, `scenario.carburant.*`.

**Format.** Article complet.

**Pistes écartées.**
- « Ceux qui viennent travailler à Poitiers » : la piste est utile pour la ville, pas pour quelqu'un qui cherche à s'y loger.
- Statut d'occupation : il ajouterait une série de pourcentages sans servir la question.
- Accès des six communes (section 6) et repères « tous résidents » des communes (section 5) : ils sortent de la question, qui porte sur un logement à Poitiers.
- Bus : tous les faits calculés sont en attente de validation. Seules les informations documentaires d'usage `oui` sont reprises.
- Carte de situation : elle ferait un quatrième visuel. La liste des communes est déjà dans l'intitulé des barres.

---

## B. Article

# Poitiers : selon le quartier, la voiture ne prend pas la même place

**En un an, le prix médian du gazole a augmenté de 0,78 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Poitiers. Avant de signer un bail ou un compromis, une question devient concrète : depuis quel quartier peut-on moins prendre la voiture ? Les trajets des habitants répondent très différemment d'un secteur à l'autre, et d'un lieu de travail à l'autre.**

## Un plein qui pèse plus lourd

Le prix médian du gazole est passé de 1,56 € le litre la semaine du 6 octobre 2025 à 2,34 € la semaine du 5 octobre 2026. Le SP95-E10 a pris 0,53 € sur la même période. Le tableau ci-dessous traduit cette hausse en surcoût annuel pour un trajet domicile-travail fait en voiture, selon sa longueur. Il repose sur trois hypothèses : une consommation de 6 litres aux 100 km, 200 allers-retours par an et une hausse arrondie à 5 centimes. Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour qui cherche un logement, le prix du litre compte moins que la place que prendra la voiture depuis l'adresse visée. Les pratiques des habitants donnent de premiers repères.

## Du centre ancien aux secteurs où la voiture domine

Selon le recensement de 2022 (collectes 2020 à 2024), 59 % des actifs qui habitent Poitiers vont travailler principalement en voiture. C'est moins que la médiane de 67 % des villes de taille proche (voir la méthode). Mais cette part communale recouvre des secteurs très différents.

Dans le secteur Hôtel de Ville, 33 % des actifs qui y habitent vont travailler en voiture, et 34 % y vont à pied. Le secteur Cathédrale reste lui aussi sous la moitié, à 41 %. Le secteur Couronneries-Nimègue montre une autre configuration : la voiture y est à 48 %, et 39 % des actifs utilisent principalement les transports en commun. À l'autre bout, à Saint-Éloi-Fraternité, la voiture atteint 77 % : 44 points de plus que dans le secteur Hôtel de Ville. La carte donne la part de chaque secteur.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Selon la commune où l'on travaille

Le quartier n'est qu'un bout du trajet. L'autre bout, le lieu de travail, donne un second repère. 73 % des actifs qui habitent Poitiers y travaillent aussi, et 54 % d'entre eux y vont en voiture.

Ceux qui travaillent à Buxerolles, Jaunay-Marigny, Saint-Benoît, Vouneuil-sous-Biard, Migné-Auxances ou Chasseneuil-du-Poitou sont 76 % à prendre la voiture, soit 22 points de plus. Pour ceux qui travaillent hors de Poitiers et de ces six communes, la part est de 74 %. À Chasseneuil-du-Poitou, 24 % des actifs de Poitiers qui y travaillent s'y rendent principalement en transports en commun.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Si votre emploi est hors de Poitiers, faites le trajet depuis l'adresse envisagée, à l'heure où vous le ferez chaque jour.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du travail ne résume pas une semaine. Courses, école et pharmacie sont aussi des déplacements, et la proximité de ces équipements fournit un autre repère.

Dans les secteurs Cathédrale, Sainte-Croix et Carnot, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Ailleurs, c'est beaucoup plus rare. Aux Facultés, seules 6 % des adresses réunissent ces trois équipements. À Iassi, aucune adresse ne les réunit, ce qui ne veut pas dire qu'il n'y a aucun commerce. Saint-Éloi-Fraternité montre que les deux mesures ne disent pas la même chose : 80 % des adresses y ont les trois à moins de 500 m, et c'est le secteur où la part de la voiture pour aller travailler est la plus élevée.

## Ce qu'il faut regarder pendant les visites

Moins se servir de sa voiture ne veut pas forcément dire s'en séparer. Parmi les actifs dont le ménage a au moins une voiture, 30 % ne la déclarent pas comme mode principal pour aller travailler. Il faut quand même la garer.

À l'échelle de la ville, 57 % des ménages ont un emplacement réservé au stationnement. Dans les secteurs où l'on prend moins la voiture, cette part est souvent bien plus basse : 24 % des ménages aux Trois Quartiers, 17 % à Couronneries-Nimègue. Vérifiez dès l'annonce si une place est comprise, et sinon, où se garer.

Le réseau urbain du Grand Poitiers s'appelle Vitalis. Avant une visite, testez votre trajet entre l'adresse et votre lieu de travail sur la page Itinéraires de son site (vitalis-poitiers.fr), aux jours et aux heures où vous le ferez.

## Votre projet, votre adresse

Se rapprocher de son travail, s'installer en famille, garder une voiture sans en dépendre : chaque projet pose sa propre question à l'adresse visée. Sur futur•e, examinez celle que vous envisagez à partir de ce que vous cherchez : ce qui se trouve à proximité, la place de la voiture dans le secteur et ce qui peut encore peser dans votre choix.

## Méthode et sources

**Pratiques domicile-travail.** Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024), fichier détail Mobilités professionnelles (MOBPRO).
- Population : actifs occupés de 15 ans ou plus résidant à Poitiers, mode principal déclaré. Ceux qui travaillent à domicile sont inclus.
- Chaque groupe de commune de travail est un groupe distinct de personnes : un écart entre deux groupes décrit des pratiques, pas l'effet d'un changement d'emploi.
- La liste des six communes de travail est automatique : ce sont les six communes les plus peuplées de la même unité urbaine.
- Il s'agit d'estimations par sondage.

**Secteurs.** Source : INSEE, bases infracommunales Activité des résidents et Logement 2022.
- Les secteurs sont des IRIS de l'INSEE dont le libellé n'est pas toujours le nom d'usage du quartier.
- Seuls les secteurs d'habitat comptant au moins 300 actifs sont retenus.
- Les parts portent sur tous les actifs du secteur, quelle que soit leur commune de travail.
- Le stationnement porte sur les ménages, c'est-à-dire les résidences principales.
- Les petits écarts entre secteurs ne doivent pas être surinterprétés.

**Villes de taille proche.** 61 communes de France métropolitaine, principales communes de leur unité urbaine (la plus grande par le nombre d'actifs occupés résidents).
- Elles comptent de 16 976 à 67 903 actifs occupés résidents, avec au moins 150 lignes d'échantillon.
- La médiane est celle des parts communales, chaque commune comptant une fois.

**Équipements.** Base adresse nationale et INSEE BPE 2025, distances à vol d'oiseau. Il s'agit de parts d'adresses : elles décrivent une proximité, pas un usage.

**Carburant.** Source : prix-carburants.gouv.fr. Médiane entre les stations situées dans un rayon de 12 km autour du centre de Poitiers. Les prix seront réextraits avant publication.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | 0,78 € le litre | `carburant.gazole.ecart` | oui |
| Chapeau | rayon de 12 km | `carburant.gazole.ecart` (périmètre) | oui |
| Plein | 1,56 € | `carburant.gazole.prix_un_an_avant` | oui |
| Plein | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | oui |
| Plein | 2,34 € | `carburant.gazole.prix` | oui |
| Plein | semaine du 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Plein | 0,53 € | `carburant.e10.ecart` | oui |
| Plein | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Plein | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Plein | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Centre | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Centre | 2020 à 2024 | `mobpro.modes.*` (limites : collectes) | oui |
| Centre | 59 % | `comparaison.voiture.commune` / `mobpro.modes.voiture` | oui |
| Centre | 67 % | `comparaison.voiture.mediane_groupe` | oui |
| Centre | 33 % (Hôtel de Ville) | `iris.voiture.min` / `iris.861940104.voiture` | oui |
| Centre | 34 % à pied | `iris.861940104.marche` | oui |
| Centre | 41 % (Cathédrale) | `iris.861940103.voiture` | oui |
| Centre | 48 % (Couronneries-Nimègue) | `iris.861940803.voiture` | oui |
| Centre | 39 % transports en commun | `iris.861940803.tc` | oui |
| Centre | 77 % (Saint-Éloi-Fraternité) | `iris.voiture.max` | oui |
| Centre | 44 points | `ecart.iris.voiture.max_moins_min` | oui |
| Travail | 73 % | `mobpro.travaille_dans_commune` | oui |
| Travail | 54 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Travail | 76 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Travail | 22 points | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Travail | six communes | liste du groupe nommé (section 1) | oui |
| Travail | 74 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Travail | 24 % (Chasseneuil-du-Poitou, TC) | `destination.86062.tc` | oui |
| Courses | toutes les adresses (100 %) | `iris.861940103.panier_500m`, `iris.861940105.panier_500m`, `iris.861940106.panier_500m` | oui |
| Courses | 500 m | `iris.*.panier_500m` (définition) | oui |
| Courses | 6 % (Les Facultés) | `iris.861940404.panier_500m` | oui |
| Courses | aucune adresse (0 %, Iassi) | `iris.861940503.panier_500m` | oui |
| Courses | 80 % (Saint-Éloi-Fraternité) | `iris.861940605.panier_500m` | oui |
| Visites | 30 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Visites | 57 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Visites | 24 % (Trois Quartiers) | `iris.861940101.stationnement_reserve` | oui |
| Visites | 17 % (Couronneries-Nimègue) | `iris.861940803.stationnement_reserve` | oui |
| Visites | Vitalis, vitalis-poitiers.fr, page Itinéraires | `doc.reseau.identite`, `doc.reseau.site`, `doc.verifier.itineraire` | oui |
| Méthode | 2022, 2020 à 2024 | `mobpro.*` (source, limites) | oui |
| Méthode | six communes | groupe nommé (section 1) | oui |
| Méthode | 2022 (bases infracommunales) | `iris.*` (source) | oui |
| Méthode | 300 actifs | `iris.voiture.min` (périmètre) | oui |
| Méthode | 61 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | 16 976 à 67 903 | section 4 bis (règle de sélection) | oui |
| Méthode | 150 lignes | section 4 bis (règle de sélection) | oui |
| Méthode | BPE 2025 | `acces.*` (source) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Un plein qui pèse plus lourd », après les hypothèses.
   - Étape manuelle : aucune.
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « Du centre ancien aux secteurs où la voiture domine ».
   - Étape manuelle : aucune pour la production. Classes automatiques (`--classes auto`).
   - Secteurs cités à repérer par des numéros (`--reperes`) : Hôtel de Ville, Cathédrale, Couronneries-Nimègue, Saint-Éloi-Fraternité.
   - Le tableau accessible des secteurs est produit avec la carte.
3. **Barres : part de la voiture selon la commune de travail**
   - Emplacement : section « Selon la commune où l'on travaille ».
   - Étape manuelle : aucune. La liste exacte des six communes figure dans l'intitulé de la barre.

**Vérifications en attente qui concernent des faits utilisés**

- `mobpro.voiture_selon_destination` : le choix des six communes détermine le chiffre de 76 % et l'écart de 22 points. Il faut relire l'intérêt de ce choix. Non bloquante.
- `iris.ecart_voiture` : il faut relire les libellés d'IRIS cités avant publication. Non bloquante. Libellés concernés : Hôtel de Ville, Cathédrale, Sainte-Croix, Carnot, Couronneries-Nimègue, Saint-Éloi-Fraternité, Les Facultés, Iassi, Trois Quartiers.
- `carburant.evolution` : il faut réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.

**Doutes de lecture**

- Les noms d'usage de « Hôtel de Ville », « Trois Quartiers » et « Iassi » sont à confirmer avant de les présenter comme des quartiers.
- Le secteur « Gare » est exclu (secteur d'activité) : il n'est pas cité.
- La part des transports en commun vers Chasseneuil-du-Poitou (24 %) vient de la section 4. La ligne est utilisable, avec 626 lignes d'échantillon. Il faut la relire avec la vérification `mobpro.voiture_selon_destination`.