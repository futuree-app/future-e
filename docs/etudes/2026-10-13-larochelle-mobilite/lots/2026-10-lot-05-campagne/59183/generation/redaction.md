## A. Question et format

**Question principale :** à Dunkerque, un secteur où la voiture est moins utilisée pour travailler offre-t-il aussi la proximité recherchée pour les courses et l’école ?

La réponse invite à distinguer les pratiques domicile-travail de la proximité des équipements. Sud-Gare, Centre et Bazennes montrent pourquoi ces observations doivent se lire séparément pour choisir une adresse.

**Appuis :** `destination.59183.voiture` ; `iris.591830203.voiture`, `iris.591830202.voiture`, `iris.591831602.voiture` ; `iris.591830203.panier_500m`, `iris.591830202.panier_500m`, `iris.591831602.panier_500m`.

**Format retenu :** article court, avec l’ouverture carburant imposée par la série.

**Pistes écartées :** comparaison nationale peu éclairante pour cette question ; motorisation, stationnement et flux entrants qui disperseraient le propos ; fréquences de bus inutilisables en l’état.

## B. Article

# À Dunkerque, choisir son adresse pour utiliser moins la voiture

**Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du carburant augmente de 0,76 €/L pour le gazole et de 0,51 €/L pour le SP95-E10, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Dunkerque. Lors d’une recherche de logement, cette hausse donne une raison concrète d’examiner les déplacements associés à chaque adresse.**

Le scénario suivant illustre le surcoût annuel de carburant selon la distance du trajet aller. Il retient une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et des hausses arrondies à 5 centimes : +0,75 €/L pour le gazole et +0,50 €/L pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 90 € | environ 60 € |
| 15 km | environ 270 € | environ 180 € |
| 35 km | environ 630 € | environ 420 € |

*Scénario fondé sur la hausse entre les semaines du 6 octobre 2025 et du 5 octobre 2026 ; carburant seul.*

À Dunkerque, les pratiques de déplacement varient selon le secteur de résidence. Mais cette géographie suffit-elle pour repérer une adresse où l’on pourrait moins prendre la voiture ?

## Pour le travail, regarder le secteur et sa destination

Au recensement de 2022, parmi les actifs qui habitent et travaillent à Dunkerque, 63 % déclarent la voiture comme mode principal pour aller travailler. Avoir son emploi dans la commune laisse donc entière la question du déplacement depuis le logement envisagé.

Selon le secteur de résidence, les pratiques présentent aussi des contrastes : la voiture est le mode principal de 50 % des actifs de Sud-Gare, de 54 % de ceux du secteur Centre et de 85 % de ceux de Bazennes. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Source : INSEE, recensement 2022. Les noms désignent des secteurs statistiques.*

La carte permet de situer le secteur d’une annonce. Pour votre recherche, rapprochez cette observation de votre propre destination de travail, sans attribuer à une adresse les pratiques de tout son secteur.

## Courses et école : une autre géographie à examiner

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour un logement envisagé, il faut aussi regarder où se trouvent les équipements utiles au ménage.

Le dossier mesure la présence conjointe d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. Cette proximité concerne 43 % des adresses de Sud-Gare, 95 % de celles du secteur Centre et 99 % de celles de Bazennes.

Ces observations éclairent différemment les secteurs : à Sud-Gare, une moindre utilisation de la voiture pour travailler ne s’accompagne pas d’une proximité aussi étendue de cet ensemble d’équipements. À Bazennes, leur présence près de la quasi-totalité des adresses coexiste avec une forte utilisation de la voiture pour le travail.

Lors d’une visite à Sud-Gare, repérez donc les équipements utiles autour de l’adresse précise. À Bazennes, examinez séparément votre déplacement professionnel. Dans chaque cas, parcourez les chemins réels vers les lieux que vous comptez fréquenter : la proximité mesurée ne décrit pas le parcours.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour la replacer dans l’ensemble de ce qui compte dans votre choix de logement.

### Méthode et sources

Les pratiques proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Ce sont des estimations par sondage ; les groupes observés sont distincts et les secteurs statistiques ne correspondent pas toujours aux quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil dans les parts par secteur. Les distances sont mesurées à vol d’oiseau jusqu’à l’adresse des établissements, sans mesurer leur fréquentation.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : médiane, entre stations, du dernier prix déclaré dans chaque semaine.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | 6 octobre 2025 | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Chapeau — fin de période | 5 octobre 2026 | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Chapeau — hausse gazole | 0,76 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse SP95-E10 | 0,51 €/L | `carburant.e10.ecart` | oui |
| Chapeau — périmètre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Hypothèses — hausse gazole retenue | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse SP95-E10 retenue | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Légende du tableau — début de période | 6 octobre 2025 | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Légende du tableau — fin de période | 5 octobre 2026 | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Pratiques — millésime | 2022 | `destination.59183.voiture` | oui |
| Pratiques — actifs habitant et travaillant à Dunkerque | 63 % | `destination.59183.voiture` | oui |
| Pratiques — Sud-Gare | 50 % | `iris.591830203.voiture` | oui |
| Pratiques — Centre | 54 % | `iris.591830202.voiture` | oui |
| Pratiques — Bazennes | 85 % | `iris.591831602.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.591830203.voiture`, `iris.591830202.voiture`, `iris.591831602.voiture` | oui |
| Équipements — distance | 500 m | `iris.591830203.panier_500m`, `iris.591830202.panier_500m`, `iris.591831602.panier_500m` | oui |
| Équipements — adresses de Sud-Gare | 43 % | `iris.591830203.panier_500m` | oui |
| Équipements — adresses du Centre | 95 % | `iris.591830202.panier_500m` | oui |
| Équipements — adresses de Bazennes | 99 % | `iris.591831602.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.591830203.panier_500m`, `iris.591830202.panier_500m`, `iris.591831602.panier_500m` | oui |

Les désignations « SP95-E10 » sont celles du carburant identifié par les faits `carburant.e10.*` et `scenario.carburant.e10.*`.

## D. Visuels et vérifications restantes

| Nom exact du visuel | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Ouverture, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture de Sud-Gare, Centre et Bazennes | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Libellés à poser à la main seulement pour une version soignée. |

Vérifications avant publication :

- **`iris.ecart_voiture` :** relire les libellés Sud-Gare, Centre et Bazennes. Le texte les présente comme des secteurs statistiques.
- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne l’ouverture et le scénario.

Aucun autre doute de lecture retenu.