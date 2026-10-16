## A. Question et format

**Question principale :** au Havre, comment choisir les secteurs à examiner pour utiliser moins la voiture, tout en distinguant le trajet vers le travail des courses et de l’école ?

Les pratiques domicile-travail diffèrent fortement entre secteurs. La proximité des équipements apporte un autre éclairage : elle peut être élevée là où la voiture reste très utilisée pour travailler. Pour une recherche de logement, cela invite à examiner séparément les déplacements que l’on souhaite changer.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.763511703.voiture` et `iris.763511703.panier_500m`.

**Format retenu :** article court, avec l’ouverture carburant obligatoire et deux visuels.

**Pistes écartées :** comparaison nationale, stationnement et équipement automobile des ménages, qui disperseraient la question ; comparaison avec les communes du groupe, moins directement utile à cet angle.

## B. Article

# Au Havre, où chercher un logement pour moins prendre la voiture ?

Entre la semaine du **6 octobre 2025** et celle du **5 octobre 2026**, le prix médian du carburant augmente de **0,71 €/L pour le gazole** et de **0,47 €/L pour le SP95-E10**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre du Havre. Pour qui cherche à déménager, cette hausse donne une raison concrète d’examiner les déplacements associés au futur logement.

Le scénario suivant chiffre le surcoût annuel de carburant selon la distance domicile-travail. Il retient une consommation de **6 L/100 km**, **200 allers-retours par an** et des hausses arrondies à **5 centimes**, soit **+0,70 €/L pour le gazole** et **+0,45 €/L pour le SP95-E10**.

[VISUEL : Tableau du scénario de surcoût de carburant]

Au Havre, quelle place la voiture prend-elle dans les trajets des habitants, selon le secteur et le lieu de travail ?

## Des pratiques très différentes selon le secteur

Les pratiques observées au recensement de **2022** donnent un premier repère. La voiture est le mode principal pour aller travailler de **39 % des actifs occupés** du secteur Anatole France Danton-Douanes, contre **84 %** à Dollemard Stendhal. Ces parts portent sur les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte montre cette diversité de pratiques. Pour préparer une visite, repérez ensuite le trajet entre l’adresse envisagée et votre lieu de travail.

La commune de travail apporte un autre éclairage : **74 % des actifs occupés résidant au Havre travaillent au Havre même**. Parmi ceux qui habitent et travaillent dans la commune, **57 %** utilisent principalement la voiture. Un emploi au Havre laisse donc entière la question du trajet depuis le logement envisagé.

## Et pour les courses et l’école ?

Le trajet vers le travail ne couvre qu’une partie des déplacements à examiner avant de choisir un logement. Pour les courses, la pharmacie ou l’école, la proximité des équipements apporte un repère différent.

À Aplemont La Pommeraie, **98 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Dans ce même secteur, **81 % des actifs occupés** vont travailler principalement en voiture.

Cet exemple invite à regarder les déplacements séparément. Pendant une visite, parcourez les chemins vers les équipements qui comptent pour vous : leur proximité à vol d’oiseau est un point de départ pour examiner l’adresse.

Si vous envisagez les transports en commun pour le travail, consultez le [site du réseau LiA](https://www.transports-lia.fr) pour vérifier votre trajet et les horaires correspondant à vos besoins.

## Votre projet, votre adresse

Si votre déménagement doit vous permettre de moins prendre la voiture, partez des trajets que vous voulez changer. Explorez avec futur•e l’adresse envisagée à partir de votre projet, pour l’examiner dans son ensemble.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE et sont des estimations par sondage. Les résultats par secteur et selon la commune de travail ne sont pas croisés. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

La proximité des équipements utilise la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime **2025**. Chaque adresse du secteur compte également ; la mesure porte sur l’adresse de l’établissement.

Les prix proviennent de prix-carburants.gouv.fr : pour chaque semaine, la médiane retient le dernier prix déclaré par chaque station. Le scénario porte uniquement sur le surcoût de carburant.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,71 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,47 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours par an | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — hausse retenue du gazole | +0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.763511703.voiture` | oui |
| Pratiques locales — Anatole France Danton-Douanes | 39 % | `iris.voiture.min` | oui |
| Pratiques locales — Dollemard Stendhal | 84 % | `iris.voiture.max` | oui |
| Commune de travail — actifs travaillant au Havre | 74 % | `mobpro.travaille_dans_commune` | oui |
| Commune de travail — voiture parmi les actifs habitant et travaillant au Havre | 57 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Équipements — adresses à Aplemont La Pommeraie | 98 % | `iris.763511703.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m à vol d’oiseau | `iris.763511703.panier_500m` | oui |
| Pratiques — voiture à Aplemont La Pommeraie | 81 % | `iris.763511703.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.763511703.panier_500m` — source BPE précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses ; tableau reproduit dans B | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Anatole France Danton-Douanes et Dollemard Stendhal | Aucune pour la production : classes automatiques et repères numérotés des secteurs cités. Placement manuel des libellés seulement pour une version soignée. Faire figurer le millésime 2022. |

Vérifications avant publication :

- **Carburant :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne l’ouverture et le scénario.
- **Libellés des secteurs :** relire Anatole France Danton-Douanes, Dollemard Stendhal et Aplemont La Pommeraie. L’article les désigne comme secteurs statistiques.

Aucun doute de lecture supplémentaire identifié.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : la transition suggère un effet du secteur sur la possibilité de moins conduire. | Au Havre, quels secteurs regarder pour réduire la place de la voiture, et pour quels déplacements ? | Au Havre, quelle place la voiture prend-elle dans les trajets des habitants, selon le secteur et le lieu de travail ? |
| Raisonnement — a_revoir : ne pas appliquer les pratiques des habitants à une annonce. | La carte permet de situer les annonces dans cette diversité de pratiques. | La carte montre cette diversité de pratiques. |
| Lisibilité — a_revoir : la carte ne représente pas les équipements. | leur proximité sur la carte est un point de départ | leur proximité à vol d’oiseau est un point de départ |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
