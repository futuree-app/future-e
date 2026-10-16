## A. Question et format

**Question principale :** à Nanterre, comment choisir un secteur pour utiliser moins la voiture, en tenant compte du travail mais aussi des courses et de l’école ?

Le contraste entre Université Groues, Cathédrale et Garches montre l’intérêt de regarder séparément les pratiques domicile-travail et la proximité des équipements. Il aide le lecteur à sélectionner des adresses sans faire du faible recours à la voiture dans un secteur une garantie pour son propre quotidien.

Faits principaux : `iris.920500607.voiture`, `iris.920500406.voiture`, `iris.920500204.voiture` et les cellules `panier_500m` de ces mêmes secteurs. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les six faits `scenario.carburant.*`.

**Format retenu : article court.** Les comparaisons entre destinations professionnelles, le stationnement et la possession automobile sont écartés pour concentrer le texte sur le choix du secteur et de l’adresse.

## B. Article

# Nanterre : choisir son adresse pour utiliser moins la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant a augmenté de 0,65 €/L pour le gazole et de 0,21 €/L pour le SP95-E10 dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Nanterre. Pour une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite changer.

Le scénario suivant porte sur le carburant seul, avec une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. La hausse retenue est arrondie à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances sont des hypothèses, sans attribution à un secteur. Pour choisir où chercher à Nanterre, les pratiques locales apportent un autre éclairage : où la voiture est-elle utilisée pour travailler, et quels équipements trouve-t-on autour des logements ?

## Des pratiques différentes selon le secteur

Au recensement de 2022, la voiture est le mode principal pour aller travailler de 1 % des actifs habitant le secteur statistique Université Groues, contre 51 % dans celui nommé Garches. À Cathédrale, cette part est de 16 %. Ces résultats concernent les actifs qui résident dans chaque secteur, quel que soit leur lieu de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte aide à situer une annonce parmi ces pratiques différentes. Pour votre propre trajet professionnel, gardez aussi votre destination en regard de l’adresse retenue.

## Les courses et l’école dessinent un autre quotidien

Le trajet professionnel ne couvre qu’une partie des déplacements à envisager en déménageant. Pour les autres, on peut regarder la présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau : c’est le « panier quotidien » étudié ici.

À Université Groues, aucune adresse ne dispose de ce panier complet dans ce périmètre. À Cathédrale, toutes les adresses le réunissent. Dans le secteur Garches, c’est le cas de 18 % des adresses.

Le faible recours à la voiture pour travailler à Université Groues invite donc à examiner séparément les autres déplacements. Pour une annonce dans ce secteur, repérez où se trouvent les équipements qui vous seraient utiles, même lorsque le panier complet n’est pas réuni autour du logement.

À Cathédrale aussi, la visite reste l’occasion de parcourir les chemins vers les commerces et, si elle vous concerne, l’école. La distance à vol d’oiseau sert à repérer une proximité ; le chemin réel permet d’en apprécier l’accès.

## Votre projet, votre adresse

Si vous cherchez à vous rapprocher du travail ou à vous installer en famille, précisez la place que vous souhaitez laisser à la voiture. Avec futur•e, examinez l’adresse envisagée à partir de ce projet et de ce qui compte pour vous dans le choix d’un logement.

## Méthode et sources

Les pratiques domicile-travail proviennent des bases infracommunales de l’INSEE. Ce sont des estimations par sondage : les écarts entre secteurs décrivent des populations distinctes et ne mesurent pas l’effet d’un déménagement. Les noms cités sont des libellés de secteurs statistiques IRIS.

La proximité des équipements est établie à partir de la Base adresse nationale et de la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse du secteur compte pareil. Les distances sont à vol d’oiseau, jusqu’à l’adresse de l’établissement.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; les stations déclarantes peuvent varier entre les semaines comparées.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,65 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,21 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèse commune de la section 7 | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèse commune de la section 7 | oui |
| Tableau — hausse retenue, gazole | 0,65 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue, essence | 0,20 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — essence, première ligne | environ 20 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — essence, deuxième ligne | environ 70 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — essence, troisième ligne | environ 170 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.920500607.voiture`, `iris.920500204.voiture`, `iris.920500406.voiture` | oui |
| Pratiques — Université Groues | 1 % | `iris.920500607.voiture` | oui |
| Pratiques — secteur Garches | 51 % | `iris.920500204.voiture` | oui |
| Pratiques — Cathédrale | 16 % | `iris.920500406.voiture` | oui |
| Équipements — distance du panier quotidien | 500 m | `iris.920500607.panier_500m`, `iris.920500406.panier_500m`, `iris.920500204.panier_500m` | oui |
| Équipements — Université Groues | « aucune adresse » : 0 % | `iris.920500607.panier_500m` | oui |
| Équipements — Cathédrale | « toutes les adresses » : 100 % | `iris.920500406.panier_500m` | oui |
| Équipements — secteur Garches | 18 % | `iris.920500204.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.920500607.panier_500m`, `iris.920500406.panier_500m`, `iris.920500204.panier_500m` — source BPE précisée par le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après le chapeau ; tableau reproduit dans B | Aucune. Faire figurer la période de comparaison avec le visuel. |
| Carte de la part de la voiture par secteur (IRIS) | Après les pratiques sectorielles | Aucune pour la production : classes automatiques et repères numérotés pour les secteurs cités. Libellés posés à la main seulement pour une version soignée. Faire figurer le millésime 2022. |

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Université Groues, Cathédrale et Garches. Le texte les présente comme des secteurs statistiques, sans les assimiler aux quartiers d’usage ni, pour Garches, à une commune.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, concernant aussi le scénario de surcoût.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
