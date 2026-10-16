## A. Question et format

**Question principale :** à Ivry-sur-Seine, que faut-il regarder au-delà de la proximité des équipements pour chercher un logement permettant d’utiliser moins la voiture ?

Le dossier distingue des pratiques domicile-travail différentes selon les secteurs et les destinations, alors que certains secteurs ont la même proximité du panier quotidien. Pour le lecteur, cela invite à examiner séparément son trajet professionnel et les déplacements autour du logement.

**Appuis :** `mobpro.modes.tc`, `mobpro.modes.voiture`, `iris.voiture.min`, `iris.voiture.max`, `iris.940410202.panier_500m`, `iris.940410204.panier_500m`, `destination.75113.voiture`, `destination.94081.voiture`. L’ouverture repose sur `carburant.gazole.ecart`, `carburant.e10.ecart` et les six faits `scenario.carburant.*`.

**Format :** article court, avec le tableau carburant et la carte des pratiques par secteur.

**Pistes écartées :** motorisation, stationnement et comparaison nationale, qui disperseraient la question ; actifs venant travailler à Ivry, moins directement utiles au choix d’un logement dans la commune.

## B. Article

# À Ivry-sur-Seine, que vérifier pour moins prendre la voiture ?

**Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,59 €/L et celui du SP95-E10 de 0,19 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Ivry-sur-Seine. Pour une recherche de logement, cette hausse pose une question concrète : quels déplacements souhaite-t-on pouvoir faire autrement ?**

Le scénario suivant illustre le surcoût annuel de carburant selon la distance du trajet professionnel. Il retient une consommation de **6 L/100 km**, **200 allers-retours par an** et des hausses arrondies au pas de **5 centimes** : **0,60 €/L pour le gazole**, **0,20 €/L pour le SP95-E10**.

*Scénario fondé sur la hausse de 2025 à 2026 ; carburant seul.*

[VISUEL : Tableau du scénario de surcoût de carburant]

À Ivry-sur-Seine, les pratiques professionnelles et la proximité des équipements apportent des éclairages différents pour choisir une adresse.

## Pour le travail, regarder le secteur et la destination

Dans les données du recensement de **2022**, **57 % des actifs occupés résidant à Ivry-sur-Seine** déclarent les transports en commun comme mode principal pour aller travailler, contre **20 % pour la voiture**.

Cette part de la voiture varie selon le secteur de résidence : **14 % à Petit Ivry Nord**, **31 % à Cité Pierre et Marie Curie**. Ces proportions concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail. La carte permet de situer les logements repérés dans cette diversité de pratiques.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur, recensement 2022.*

Le lieu de travail mérite ensuite son propre examen. Parmi les actifs qui habitent Ivry et travaillent à **Paris 13e Arrondissement**, **13 %** déclarent principalement la voiture ; parmi ceux qui travaillent à **Vitry-sur-Seine**, cette part est de **39 %**. Dès la sélection des annonces, gardez donc votre destination professionnelle dans la recherche, puis vérifiez les possibilités de déplacement correspondant à vos horaires.

## Les courses et l’école se regardent à l’adresse

Le trajet professionnel laisse ouverte la question des déplacements autour du logement. À Petit Ivry Nord comme à Cité Pierre et Marie Curie, **100 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**.

Cette proximité commune accompagne pourtant des pratiques domicile-travail différentes. Pour choisir entre des annonces, regardez où se trouvent les équipements que vous utiliseriez, puis parcourez leurs accès lors de la visite. Pour l’école, vérifiez également l’affectation correspondant au logement envisagé : la proximité mesurée porte sur la présence d’un établissement.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner la place qu’elle pourrait prendre dans votre quotidien.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE : fichier MOBPRO pour la commune et les destinations, base infracommunale Activité pour les secteurs. Elles concernent les actifs occupés de **15 ans ou plus** ; le dénominateur communal inclut ceux qui travaillent à domicile. Les groupes de destination sont distincts : leur comparaison ne mesure pas l’effet d’un déménagement. Les résultats sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les noms employés sont les libellés statistiques des IRIS.

La proximité des équipements repose sur la Base adresse nationale et la BPE **2025** de l’INSEE. Chaque adresse du secteur compte pareil ; les distances à vol d’oiseau ne décrivent pas le parcours réel ni l’usage des équipements. Les prix du carburant proviennent du flux officiel prix-carburants.gouv.fr : médiane du dernier prix déclaré dans la semaine par chaque station du périmètre.

## C. Correspondance interne — non publiée

Les identifiants de scénario renvoient également aux hypothèses communes explicitement données en section 7 du dossier.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse gazole | 0,59 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse SP95-E10 | 0,19 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon, à vol d’oiseau | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.gazole.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — allers-retours annuels | 200 | `scenario.carburant.gazole.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — pas d’arrondi | 5 centimes | `scenario.carburant.gazole.5km`, hypothèses communes de la section 7 | oui |
| Hypothèses — hausse gazole retenue | 0,60 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse SP95-E10 retenue | 0,20 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 20 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 70 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 170 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.tc`, `mobpro.modes.voiture` | oui |
| Pratiques — transports en commun | 57 % | `mobpro.modes.tc` | oui |
| Pratiques — voiture | 20 % | `mobpro.modes.voiture` | oui |
| Secteur Petit Ivry Nord — voiture | 14 % | `iris.voiture.min` | oui |
| Secteur Cité Pierre et Marie Curie — voiture | 31 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Destination — nom de l’arrondissement | Paris 13e Arrondissement | `destination.75113.voiture` | oui |
| Destination Paris 13e Arrondissement — voiture | 13 % | `destination.75113.voiture` | oui |
| Destination Vitry-sur-Seine — voiture | 39 % | `destination.94081.voiture` | oui |
| Équipements — part des adresses dans chacun des secteurs cités | 100 % | `iris.940410202.panier_500m`, `iris.940410204.panier_500m` | oui |
| Équipements — seuil à vol d’oiseau | 500 m | `iris.940410202.panier_500m`, `iris.940410204.panier_500m` | oui |
| Méthode — âge minimal des actifs | 15 ans | `mobpro.modes.tc`, `mobpro.modes.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.940410202.panier_500m`, `iris.940410204.panier_500m` — définition et sources du panier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de Petit Ivry Nord et de Cité Pierre et Marie Curie | Aucune pour la production : classes et repères automatiques. Pose manuelle des libellés seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario.
- **`iris.ecart_voiture`** : relire les libellés Petit Ivry Nord et Cité Pierre et Marie Curie. Le texte les présente comme des secteurs statistiques.

Aucun autre doute de lecture relevé.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
