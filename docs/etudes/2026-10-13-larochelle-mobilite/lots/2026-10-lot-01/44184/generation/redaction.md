## A. Question et format

**Question principale :** depuis quels secteurs de Saint-Nazaire, et pour quels lieux de travail, les actifs prennent-ils moins la voiture ? Et que faut-il vérifier quand on vise un de ces secteurs ?

**Ce que le lecteur apprend :** la part des actifs qui vont travailler en voiture varie de 30 points d'un secteur à l'autre. Elle varie aussi de 25 points selon que l'on travaille à Saint-Nazaire ou dans les six communes nommées. Nantes fait exception, avec une part élevée de transports en commun. Pour une recherche de logement, cela indique où les trajets sans voiture sont courants. Cela rappelle aussi que la commune de travail compte autant que l'adresse. Il reste deux points à vérifier pendant les visites : les équipements proches et la place de stationnement.

**Faits qui la soutiennent :**
- `iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`
- `mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`
- `destination.44109.*`
- `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture`
- `iris.<code>.panier_500m`, `iris.<code>.stationnement_reserve`, `iris.menages_commune.menages_stationnement_reserve`
- ouverture : `carburant.*` et `scenario.carburant.*`

**Format :** article complet.

**Pistes écartées :**
- Repère de comparaison (+4 points) : la commune est proche de la médiane, cela n'apporte rien à la question.
- `qui_vient_travailler` et section 5 : ces faits servent surtout un lecteur qui habiterait hors de la commune et alourdiraient l'article.
- Statut d'occupation : sans lien avec le choix d'un secteur.
- Indicateurs d'accès communaux pondérés et gare à 2 km : leur pondération est difficile à expliquer et ils n'apportent rien de plus que les parts par secteur.
- Ménages sans voiture : redondant avec le stationnement.
- Bus : faits en attente de validation.

---

## B. Article

# Saint-Nazaire : où, et pour quel trajet, vivre avec moins de voiture

**En un an, le litre de gazole a pris 0,73 € autour de Saint-Nazaire. Pour qui cherche un logement, la place de la voiture se pose donc avant même la première visite. Or les trajets des actifs de Saint-Nazaire varient fortement d'un secteur à l'autre, et selon la commune où ils travaillent.**

## Le prix du plein, rapporté au trajet

Dans les stations situées dans un rayon de 12 km autour du centre de Saint-Nazaire, le prix médian du gazole était de 1,56 € le litre la semaine du 6 octobre 2025. Il était de 2,30 € la semaine du 5 octobre 2026, soit 0,73 € de plus. Sur la même période, le SP95-E10 est passé de 1,64 € à 2,14 €, soit 0,51 € de plus.

Le tableau suivant traduit cette hausse en coût annuel pour trois distances de trajet aller. Hypothèses : une consommation de 6 litres aux 100 km, 200 allers-retours domicile-travail par an et la hausse médiane arrondie à 5 centimes. Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Cette dépense dépend de l'adresse choisie, mais aussi de la façon d'aller travailler. D'où la question de la suite : depuis quels secteurs de Saint-Nazaire, et vers quels lieux de travail, les actifs prennent-ils moins la voiture ?

## Trente points d'écart entre Ville Port et Immaculée Campagne

Au recensement de 2022 (collectes 2020 à 2024), 71 % des actifs qui habitent Saint-Nazaire vont travailler principalement en voiture. Les secteurs cités ici sont des découpages statistiques de l'INSEE. Leurs noms ne correspondent pas toujours aux quartiers d'usage.

Parmi les actifs qui habitent Ville Port, 56 % ont la voiture pour mode principal ; à Hôtel de ville, ils sont 59 %. À l'autre extrémité, la part atteint 82 % à Saint-Marc Est et 86 % à Immaculée Campagne, soit 30 points de plus qu'à Ville Port. Dans plusieurs secteurs où la voiture est moins présente, d'autres modes ressortent. À Bouletterie, 24 % des actifs vont travailler en transports en commun ; au Jardin des Plantes, 14 % y vont à vélo.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte montre comment vont travailler les actifs qui habitent chaque secteur. C'est un renseignement sur le voisinage, pas une promesse pour votre propre trajet.

## Selon le lieu de travail, 25 points d'écart

L'autre bout du trajet, le lieu de travail, est souvent connu avant l'adresse. 65 % des actifs qui habitent Saint-Nazaire y travaillent aussi ; parmi eux, 64 % s'y rendent principalement en voiture.

Pour ceux qui travaillent à La Baule-Escoublac, Guérande, Saint-Brevin-les-Pins, Pornichet, Donges ou Trignac, la part est de 89 %, soit 25 points de plus. Pour les autres destinations, hors de Saint-Nazaire et de ces six communes, elle est de 85 %.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Ce dernier groupe réunit des destinations très différentes. Montoir-de-Bretagne accueille 7 % des actifs de Saint-Nazaire, et 86 % d'entre eux y vont en voiture. Nantes tranche : parmi les actifs de Saint-Nazaire qui y travaillent, 42 % s'y rendent principalement en transports en commun et 55 % en voiture.

Par ailleurs, avoir une voiture ne veut pas dire s'en servir pour aller travailler. Parmi les actifs dont le ménage en possède au moins une, 24 % ne la déclarent pas comme mode principal pour ce trajet, ou ne se déplacent pas pour travailler.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet domicile-travail ne dit rien des autres déplacements du ménage. Pour les courses, une ordonnance ou l'école des enfants, la question devient : qu'y a-t-il près du logement ?

À Centre Halles, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. À Gambetta, c'est le cas de la quasi-totalité des adresses. À Saint-Marc Ouest, seulement 1 % des adresses réunissent les trois, et 2 % à Immaculée Campagne. Cela ne veut pas dire qu'aucun de ces équipements n'est proche, seulement qu'ils sont rarement tous les trois à cette distance.

Les équipements proches et le trajet vers le travail ne vont pas toujours ensemble. À Kerlédé, la quasi-totalité des adresses ont les trois à moins de 500 m, et 77 % des actifs qui y habitent vont travailler en voiture. À Herbins Gare, 57 % des adresses les réunissent, et 62 % des actifs vont travailler en voiture. Pour chaque adresse, ce sont donc deux questions à poser séparément : qu'y a-t-il à proximité, et comment ira-t-on travailler ?

## À vérifier pendant les visites

Si vous gardez une voiture tout en visant un secteur où on l'utilise moins, reste à savoir où la garer. Dans l'ensemble de la commune, 62 % des ménages disposent d'un emplacement réservé au stationnement. Ils ne sont que 32 % à Centre Halles et 34 % à Bouletterie, contre 92 % à Saint-Marc Ouest. Vérifiez dès l'annonce si une place est comprise ; sinon, demandez pendant la visite où se garent les occupants.

Pour le bus, le réseau urbain publié pour l'intercommunalité, la CARENE, s'appelle STRAN. Avant de vous décider, consultez ses horaires : quelles lignes passent près de l'adresse, à quelles heures, et l'une d'elles mène-t-elle à votre lieu de travail ?

## Votre projet, votre adresse

Vous voulez peut-être vous rapprocher de votre travail, vous installer en famille près d'une école ou simplement moins prendre la voiture : chaque projet donne du poids à des critères différents. Sur futur•e, examinez l'adresse envisagée à partir du vôtre, avec ce qui peut peser dans le choix : la mobilité, les services à proximité, la chaleur de l'été ou les risques à l'adresse.

---

### Méthode et sources

- **Pratiques domicile-travail.** Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024).
  - Le fichier détail Mobilités professionnelles fournit les chiffres pour l'ensemble de la commune et selon la commune de travail.
  - Les bases infracommunales Activité des résidents et Logement fournissent les chiffres par secteur.
  - Population : actifs occupés de 15 ans ou plus, selon le mode principal déclaré. Les personnes qui travaillent à domicile sont comprises dans le total.
- **Lecture des chiffres.**
  - Ce sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.
  - Les parts par secteur portent sur tous les actifs qui habitent le secteur, quelle que soit leur commune de travail. Elles ne sont pas croisées avec le lieu de travail.
  - Les groupes définis par le lieu de travail sont des groupes distincts de personnes : leurs écarts décrivent des pratiques, pas l'effet d'un changement d'emploi.
  - Les six communes nommées ont été retenues automatiquement parmi les plus peuplées de la même unité urbaine INSEE.
- **Secteurs.** Ce sont les IRIS d'habitat d'au moins 300 actifs. Trois secteurs d'activité sont exclus : Le Port, Brais et Gavy Océanis.
- **Stationnement.** Tous les ménages (résidences principales), retraités et étudiants compris.
- **Équipements.** Sources : Base adresse nationale et Base permanente des équipements 2025 de l'INSEE. Les distances sont mesurées à vol d'oiseau ; à pied, le trajet réel peut être nettement plus long. Dans chaque secteur, toutes les adresses comptent autant. La proximité d'un équipement ne dit rien de son usage.
- **Carburant.** Source : prix-carburants.gouv.fr, flux officiel. On retient le dernier prix déclaré par chaque station dans la semaine, puis la médiane entre stations. Semaines du 6 octobre 2025 et du 5 octobre 2026, stations situées dans un rayon de 12 km à vol d'oiseau autour du centre de la commune. Les prix sont réextraits la veille de la publication. Une hausse passée ne dit rien de l'avenir.
- **Réseau de bus.** Le nom du réseau vient de transport.data.gouv.fr (consulté le 14 octobre 2026).

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | 0,73 € | `carburant.gazole.ecart` | oui |
| Prix du plein | 12 km | périmètre de `carburant.gazole.prix` / `carburant.e10.prix` | oui |
| Prix du plein | 1,56 € | `carburant.gazole.prix_un_an_avant` | oui |
| Prix du plein | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | oui |
| Prix du plein | 2,30 € | `carburant.gazole.prix` | oui |
| Prix du plein | semaine du 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Prix du plein | 0,73 € | `carburant.gazole.ecart` | oui |
| Prix du plein | 1,64 € | `carburant.e10.prix_un_an_avant` | oui |
| Prix du plein | 2,14 € | `carburant.e10.prix` | oui |
| Prix du plein | 0,51 € | `carburant.e10.ecart` | oui |
| Prix du plein | trois distances | `scenario.carburant.*` (5, 15, 35 km) | oui |
| Prix du plein | 6 litres aux 100 km | hypothèses `scenario.carburant.*` (section 7) | oui |
| Prix du plein | 200 allers-retours | hypothèses `scenario.carburant.*` (section 7) | oui |
| Prix du plein | 5 centimes | hypothèses `scenario.carburant.*` (section 7) | oui |
| Intertitre | Trente points | `ecart.iris.voiture.max_moins_min` | oui |
| Écart entre secteurs | 2022 (collectes 2020 à 2024) | millésime de `mobpro.modes.*` (limites) | oui |
| Écart entre secteurs | 71 % | `mobpro.modes.voiture` | oui |
| Écart entre secteurs | 56 % (Ville Port) | `iris.voiture.min` / `iris.441840107.voiture` | oui |
| Écart entre secteurs | 59 % (Hôtel de ville) | `iris.441840106.voiture` | oui |
| Écart entre secteurs | 82 % (Saint-Marc Est) | `iris.441840131.voiture` | oui |
| Écart entre secteurs | 86 % (Immaculée Campagne) | `iris.voiture.max` / `iris.441840133.voiture` | oui |
| Écart entre secteurs | 30 points | `ecart.iris.voiture.max_moins_min` | oui |
| Écart entre secteurs | 24 % TC (Bouletterie) | `iris.441840122.tc` | oui |
| Écart entre secteurs | 14 % vélo (Jardin des Plantes) | `iris.441840108.velo` | oui |
| Intertitre | 25 points | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Lieu de travail | 65 % | `mobpro.travaille_dans_commune` | oui |
| Lieu de travail | 64 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail | 89 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Lieu de travail | 25 points | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Lieu de travail | six communes | liste de la section 1 (groupe nommé) | oui |
| Lieu de travail | 85 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Lieu de travail | 7 % (Montoir-de-Bretagne) | `destination.44103.part_des_actifs` | oui |
| Lieu de travail | 86 % (Montoir-de-Bretagne) | `destination.44103.voiture` | oui |
| Lieu de travail | 42 % TC (Nantes) | `destination.44109.tc` | oui |
| Lieu de travail | 55 % voiture (Nantes) | `destination.44109.voiture` | oui |
| Lieu de travail | 24 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Courses, école | 500 m | définition de `iris.<code>.panier_500m` | oui |
| Courses, école | toutes les adresses (Centre Halles, 100 %) | `iris.441840104.panier_500m` | oui |
| Courses, école | la quasi-totalité (Gambetta, 99,6 %) | `iris.441840111.panier_500m` | oui |
| Courses, école | 1 % (Saint-Marc Ouest) | `iris.441840130.panier_500m` | oui |
| Courses, école | 2 % (Immaculée Campagne) | `iris.441840133.panier_500m` | oui |
| Courses, école | la quasi-totalité (Kerlédé, 99,5 %) | `iris.441840126.panier_500m` | oui |
| Courses, école | 77 % (Kerlédé) | `iris.441840126.voiture` | oui |
| Courses, école | 57 % (Herbins Gare) | `iris.441840103.panier_500m` | oui |
| Courses, école | 62 % (Herbins Gare) | `iris.441840103.voiture` | oui |
| Vérifications | 62 % des ménages | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Vérifications | 32 % (Centre Halles) | `iris.441840104.stationnement_reserve` | oui |
| Vérifications | 34 % (Bouletterie) | `iris.441840122.stationnement_reserve` | oui |
| Vérifications | 92 % (Saint-Marc Ouest) | `iris.441840130.stationnement_reserve` | oui |
| Vérifications | STRAN, CARENE (sans chiffre) | `doc.reseau.identite` | oui |
| Méthode | 2022, collectes 2020 à 2024 | limites `mobpro.*` | oui |
| Méthode | 15 ans ou plus | population de `mobpro.modes.*` | oui |
| Méthode | six communes | section 1 (origine de la liste) | oui |
| Méthode | au moins 300 actifs | périmètre de `iris.voiture.min` / `iris.voiture.max` | oui |
| Méthode | trois secteurs exclus (Le Port, Brais, Gavy Océanis) | section 3, lignes `absent` 441840102, 441840129, 441840121 | oui (mention de l'exclusion seulement) |
| Méthode | BPE 2025 | source de `acces.*` | oui |
| Méthode | 6 octobre 2025, 5 octobre 2026 | `carburant.*.prix_un_an_avant`, `carburant.*.prix` | oui |
| Méthode | 12 km | périmètre de `carburant.*` | oui |
| Méthode | 14 octobre 2026 | `doc.reseau.identite` (consulté le) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Le prix du plein, rapporté au trajet », après les hypothèses.
   - Étape manuelle : aucune pour le visuel, mais les prix doivent être réextraits avant publication (voir plus bas).
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « Trente points d'écart… ».
   - Étape manuelle : aucune pour la production (classes automatiques `--classes auto`). Les secteurs cités sont repérés par des numéros avec leur liste (`--reperes`) : Ville Port, Hôtel de ville, Saint-Marc Est, Immaculée Campagne, Bouletterie, Jardin des Plantes, Centre Halles, Gambetta, Saint-Marc Ouest, Kerlédé, Herbins Gare. Les libellés ne se posent à la main que pour une version soignée.
   - Le tableau accessible des secteurs est produit avec la carte et l'accompagne, sans annonce séparée dans le texte.
   - Millésime RP 2022 à porter sur le visuel.
3. **Barres : part de la voiture selon la commune de travail**
   - Emplacement : section « Selon le lieu de travail… ».
   - Étape manuelle : aucune. La liste exacte des six communes figure dans l'intitulé de la seconde barre.
   - Millésime RP 2022 à porter sur le visuel.
   - La carte de situation n'est pas retenue, pour rester à trois visuels.

**Vérifications en attente qui concernent des faits utilisés**

- `mobpro.voiture_selon_destination` : relire l'intérêt du choix des six communes, qui détermine le 89 % et l'écart de 25 points. Non bloquante.
- `iris.ecart_voiture` : relire les libellés d'IRIS cités avant publication. Non bloquante.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Concerne les prix du chapeau, de l'ouverture et le tableau du scénario. Obligatoire avant publication.

**Doutes de lecture**

- **« Ville Port » et « Le Port ».** « Ville Port » (habitat, cité) et « Le Port » (secteur d'activité, exclu) peuvent se confondre : il faut vérifier que les lecteurs ne liront pas l'un pour l'autre.
- **Libellés à relire comme noms de quartiers.** « Hôtel de ville », « Immaculée Campagne » et « Herbins Gare » sont à relire. L'article ne dit pas lesquels de ces secteurs sont centraux : cette information n'est pas dans le dossier.
- **Nom du réseau.** Le jeu de données s'intitule « Réseau urbain et scolaire Ycéo », alors que `doc.reseau.identite` nomme le réseau « STRAN ». Ses agences renvoient à stran.fr et à yceo-mobilite.fr, et le site officiel est « non vérifié ». Il faut confirmer le nom que les habitants trouveront sur les fiches horaires avant de publier « STRAN ».
- **Nantes et Montoir-de-Bretagne.** Ces deux communes font partie du groupe « autres destinations » (85 %). Leurs valeurs viennent de la section 4 (statut utilisable) et ne sont pas croisées avec les secteurs.