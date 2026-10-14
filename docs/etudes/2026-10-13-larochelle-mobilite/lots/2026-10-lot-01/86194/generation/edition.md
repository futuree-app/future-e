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

**En un an, le prix médian du gazole a augmenté de 0,78 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Poitiers. Avant de signer un bail ou un compromis, une question devient concrète : depuis quel quartier peut-on moins prendre la voiture ? Les trajets domicile-travail des actifs répondent très différemment d'un secteur à l'autre, et d'un lieu de travail à l'autre.**

## Un plein qui pèse plus lourd

Le prix médian du gazole est passé de 1,56 € le litre la semaine du 6 octobre 2025 à 2,34 € la semaine du 5 octobre 2026. Le SP95-E10 a pris 0,53 € sur la même période. Le tableau ci-dessous traduit cette hausse en surcoût annuel pour un trajet domicile-travail fait en voiture, selon sa longueur. Il repose sur trois hypothèses : une consommation de 6 litres aux 100 km, 200 allers-retours par an et une hausse arrondie à 5 centimes. Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour qui cherche un logement, la question est aussi la place que prendra la voiture depuis l'adresse visée. Les trajets domicile-travail des actifs donnent de premiers repères.

## D'un secteur à l'autre, de 33 % à 77 %

Selon le recensement de 2022 (collectes 2020 à 2024), 59 % des actifs qui habitent Poitiers vont travailler principalement en voiture. C'est moins que la médiane de 67 % des villes de taille proche (voir la méthode). Mais cette part communale recouvre des secteurs très différents.

Dans le secteur Hôtel de Ville, 33 % des actifs qui y habitent vont travailler en voiture, et 34 % y vont à pied. Le secteur Cathédrale reste lui aussi sous la moitié, à 41 %. Le secteur Couronneries-Nimègue montre une autre configuration : la voiture y est à 48 %, et 39 % des actifs utilisent principalement les transports en commun. À l'autre bout, à Saint-Éloi-Fraternité, la voiture atteint 77 % : 44 points de plus que dans le secteur Hôtel de Ville. La carte donne la part de chaque secteur.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Selon la commune où l'on travaille

Le quartier n'est qu'un bout du trajet. L'autre bout, le lieu de travail, donne un second repère. Parmi les actifs qui habitent et travaillent à Poitiers, 54 % vont travailler en voiture ; chez ceux qui travaillent à Buxerolles, Jaunay-Marigny, Saint-Benoît, Vouneuil-sous-Biard, Migné-Auxances ou Chasseneuil-du-Poitou, 76 %. Le graphique donne le détail.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Si votre emploi est hors de Poitiers, faites le trajet depuis l'adresse envisagée, à l'heure où vous le ferez chaque jour.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du travail ne résume pas une semaine. Courses, école et pharmacie sont aussi des déplacements, et la proximité de ces équipements fournit un autre repère.

Dans les secteurs Cathédrale, Sainte-Croix et Carnot, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Dans d'autres secteurs, c'est beaucoup plus rare. Aux Facultés, seules 6 % des adresses réunissent ces trois équipements. À Iassi, aucune adresse ne les réunit, ce qui ne veut pas dire qu'il n'y a aucun commerce. Saint-Éloi-Fraternité montre que les deux mesures ne disent pas la même chose : 80 % des adresses y ont les trois à moins de 500 m, et c'est le secteur où la part de la voiture pour aller travailler est la plus élevée.

## Ce qu'il faut regarder pendant les visites

Moins se servir de sa voiture ne veut pas forcément dire s'en séparer. Parmi les actifs dont le ménage a au moins une voiture, 30 % ne la déclarent pas comme mode principal pour aller travailler. Il faut quand même la garer.

À l'échelle de la ville, 57 % des ménages ont un emplacement réservé au stationnement. Dans les secteurs où l'on prend moins la voiture, cette part est souvent bien plus basse : 24 % des ménages aux Trois Quartiers, 17 % à Couronneries-Nimègue. Vérifiez dès l'annonce si une place est comprise, et sinon, où se garer.

Le réseau urbain du Grand Poitiers s'appelle Vitalis. Avant une visite, testez votre trajet entre l'adresse et votre lieu de travail sur la page Itinéraires de son site (vitalis-poitiers.fr).

## Votre projet, votre adresse

Se rapprocher de son travail, s'installer en famille, garder une voiture sans en dépendre : chaque projet pose sa propre question à l'adresse visée. Examinez avec futur•e celle que vous envisagez à partir de votre projet, en regardant l'ensemble : la mobilité, ce qui se trouve à proximité, la chaleur de l'été et les risques à l'adresse.

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

**Villes de taille proche.** 61 communes de France métropolitaine, Poitiers exclue, chacune la plus grande de son unité urbaine par le nombre d'actifs occupés résidents. Ce rôle est une approximation, pas le statut INSEE de ville-centre.
- Elles comptent de la moitié au double des actifs occupés résidents de Poitiers, avec au moins 150 lignes d'échantillon.
- La médiane est celle des parts communales, chaque commune comptant une fois.

**Équipements.** Base adresse nationale et INSEE BPE 2025, distances à vol d'oiseau. Il s'agit de parts d'adresses : elles décrivent une proximité, pas un usage.

**Carburant.** Source : prix-carburants.gouv.fr. Médiane entre les stations situées dans un rayon de 12 km autour du centre de Poitiers.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | 0,78 € le litre | `carburant.gazole.ecart` | oui |
| Chapeau | rayon de 12 km | `carburant.gazole.ecart` (périmètre) | oui |
| Plein | 1,56 € | `carburant.gazole.prix_un_an_avant` | oui |
| Plein | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` (libellé du fait : « semaine du 2025-10-06 », pas la colonne Valeur) | oui |
| Plein | 2,34 € | `carburant.gazole.prix` | oui |
| Plein | semaine du 5 octobre 2026 | `carburant.gazole.prix` (libellé du fait : « semaine du 2026-10-05 », pas la colonne Valeur) | oui |
| Plein | 0,53 € | `carburant.e10.ecart` | oui |
| Plein | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Plein | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Plein | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Secteurs (intertitre) | 33 % | `iris.voiture.min` | oui |
| Secteurs (intertitre) | 77 % | `iris.voiture.max` | oui |
| Secteurs | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Secteurs | 2020 à 2024 | `mobpro.modes.*` (limites : collectes) | oui |
| Secteurs | 59 % | `comparaison.voiture.commune` / `mobpro.modes.voiture` | oui |
| Secteurs | 67 % | `comparaison.voiture.mediane_groupe` | oui |
| Secteurs | 33 % (Hôtel de Ville) | `iris.voiture.min` / `iris.861940104.voiture` | oui |
| Secteurs | 34 % à pied | `iris.861940104.marche` | oui |
| Secteurs | 41 % (Cathédrale) | `iris.861940103.voiture` | oui |
| Secteurs | 48 % (Couronneries-Nimègue) | `iris.861940803.voiture` | oui |
| Secteurs | 39 % transports en commun | `iris.861940803.tc` | oui |
| Secteurs | 77 % (Saint-Éloi-Fraternité) | `iris.voiture.max` | oui |
| Secteurs | 44 points | `ecart.iris.voiture.max_moins_min` | oui |
| Travail | 54 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Travail | 76 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Travail | six communes | liste du groupe nommé (section 1) | oui |
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
| Méthode | de la moitié au double des actifs | section 4 bis (règle de sélection, sans identifiant dans le dossier) | oui |
| Méthode | 150 lignes | section 4 bis (règle de sélection, sans identifiant dans le dossier) | oui |
| Méthode | BPE 2025 | `acces.*` (source) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Un plein qui pèse plus lourd », après les hypothèses.
   - Étape manuelle : aucune.
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « D'un secteur à l'autre, de 33 % à 77 % ».
   - Étape manuelle : aucune pour la production. Classes automatiques (`--classes auto`).
   - Secteurs cités à repérer par des numéros (`--reperes`) : Hôtel de Ville, Cathédrale, Couronneries-Nimègue, Saint-Éloi-Fraternité.
   - Le tableau accessible des secteurs est produit avec la carte.
3. **Barres : part de la voiture selon la commune de travail**
   - Emplacement : section « Selon la commune où l'on travaille ».
   - Étape manuelle : aucune. La liste exacte des six communes figure dans l'intitulé de la barre.

**Vérifications en attente qui concernent des faits utilisés**

- `mobpro.voiture_selon_destination` : le choix des six communes détermine le chiffre de 76 % et l'écart de 22 points. Il faut relire l'intérêt de ce choix. Non bloquante.
- `iris.ecart_voiture` : il faut relire les libellés d'IRIS cités avant publication. Non bloquante. Libellés concernés : Hôtel de Ville, Cathédrale, Sainte-Croix, Carnot, Couronneries-Nimègue, Saint-Éloi-Fraternité, Les Facultés, Iassi, Trois Quartiers.
- `carburant.evolution` : il faut réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Les semaines citées dans le récit (6 octobre 2025, 5 octobre 2026) sont à mettre à jour en même temps. Obligatoire avant publication.

**Doutes de lecture**

- Les noms d'usage de « Hôtel de Ville », « Trois Quartiers » et « Iassi » sont à confirmer avant de les présenter comme des quartiers.
- Le secteur « Gare » est exclu (secteur d'activité) : il n'est pas cité.
- La part des transports en commun vers Chasseneuil-du-Poitou (24 %) vient de la section 4. La ligne est utilisable, avec 626 lignes d'échantillon. Il faut la relire avec la vérification `mobpro.voiture_selon_destination`.

---

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur, bloquante : « semaine du 6 octobre 2025 » (`carburant.gazole.prix_un_an_avant`) | « la semaine du 6 octobre 2025 » | **Écartée, texte inchangé.** La date figure dans le dossier, dans le libellé du fait (« Prix médian du gazole, semaine du 2025-10-06 »), et non dans la colonne Valeur, que le contrôle compare. La ligne de C précise désormais cette origine. |
| Valeur, bloquante : « semaine du 5 octobre 2026 » (`carburant.gazole.prix`) | « la semaine du 5 octobre 2026 » | **Écartée, texte inchangé.** Même raison : le libellé du fait porte « semaine du 2026-10-05 ». La ligne de C est précisée. |
| Identifiant absent, bloquante : « 16 976 à 67 903 » (Méthode) | « Elles comptent de 16 976 à 67 903 actifs occupés résidents, avec au moins 150 lignes d'échantillon. » | « Elles comptent de la moitié au double des actifs occupés résidents de Poitiers, avec au moins 150 lignes d'échantillon. » La règle de la section 4 bis est donnée en mots et le chiffre sans identifiant disparaît. |
| Identifiant absent, bloquante : « 150 lignes » (Méthode) | « avec au moins 150 lignes d'échantillon » | **Écartée, texte inchangé.** Ce seuil fait partie de la règle de sélection que le dossier (section 4 bis) demande de donner en entier dans la méthode. Il n'existe aucun identifiant pour ce seuil. Le supprimer rendrait la règle incomplète. C le rattache à la section 4 bis. |
| Raisonnement, bloquante : « Ailleurs, c'est beaucoup plus rare. » | « Ailleurs, c'est beaucoup plus rare. » | « Dans d'autres secteurs, c'est beaucoup plus rare. » |
| Conclusion, bloquante : « la place de la voiture dans le secteur » | « la place de la voiture dans le secteur » | « l'équipement automobile du secteur ». J'ai repris l'intitulé exact de la capacité autorisée plutôt que « des ménages du secteur », pour ne rien ajouter à la capacité. |
| Raisonnement, a_revoir : hiérarchie « compte moins que » | « Pour qui cherche un logement, le prix du litre compte moins que la place que prendra la voiture depuis l'adresse visée. » | « Pour qui cherche un logement, la question est aussi la place que prendra la voiture depuis l'adresse visée. » |
| Condition documentaire, a_revoir : page Itinéraires | « sur la page Itinéraires de son site (vitalis-poitiers.fr), aux jours et aux heures où vous le ferez. » | « sur la page Itinéraires de son site (vitalis-poitiers.fr). » |
| Population, a_revoir : « trajets des habitants » (chapeau) | « Les trajets des habitants répondent très différemment » | « Les trajets domicile-travail des actifs répondent très différemment » |
| Population, a_revoir : même glissement | « Les pratiques des habitants donnent de premiers repères. » | « Les trajets domicile-travail des actifs donnent de premiers repères. » |
| Raisonnement, a_revoir : intertitre « centre ancien » | « ## Du centre ancien aux secteurs où la voiture domine » | « ## D'un secteur à l'autre, de 33 % à 77 % ». C ajoute les deux chiffres de l'intertitre. L'emplacement de la carte est mis à jour en D, et le libellé de passage « Centre » devient « Secteurs » dans C. |
| Lisibilité, a_revoir : consigne interne de réextraction | « Les prix seront réextraits avant publication. » | Phrase supprimée. Les semaines des prix sont déjà données dans le récit, et je ne les ai pas répétées en méthode. La réextraction reste une vérification en D, qui signale de mettre à jour ces semaines. |
| Raisonnement, a_revoir : règle de sélection incomplète | « 61 communes de France métropolitaine, principales communes de leur unité urbaine (la plus grande par le nombre d'actifs occupés résidents). » | « 61 communes de France métropolitaine, Poitiers exclue, chacune la plus grande de son unité urbaine par le nombre d'actifs occupés résidents. Ce rôle est une approximation, pas le statut INSEE de ville-centre. » La partie « moitié au double » est traitée avec l'anomalie bloquante ci-dessus. Le millésime 2020 de l'unité urbaine n'a pas été ajouté, pour ne pas créer un nouveau chiffre sans identifiant. |

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Avant | Après | Raison |
|---|---|---|---|
| Selon la commune où l'on travaille | 73 % travaillent à Poitiers ; 22 points ; 74 % ailleurs ; 24 % en TC vers Chasseneuil-du-Poitou | 54 % (travail à Poitiers) et 76 % (six communes nommées) ; « Le graphique donne le détail » | Chiffres secondaires laissés au graphique |
| Votre projet, votre adresse | « …ce qui se trouve à proximité, l'équipement automobile du secteur et ce qui peut encore peser dans votre choix » | « …en regardant l'ensemble : la mobilité, ce qui se trouve à proximité, la chaleur de l'été et les risques à l'adresse » | Partir du projet et de l'adresse dans son ensemble (capacité « Examen d'une adresse à partir du projet ») plutôt que d'un inventaire |
