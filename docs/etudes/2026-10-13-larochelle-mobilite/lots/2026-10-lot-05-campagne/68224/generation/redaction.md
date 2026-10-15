## A. Question et format

**Question principale :** à Mulhouse, comment choisir une adresse pour moins utiliser la voiture lorsque proximité des équipements et pratiques domicile-travail ne vont pas toujours ensemble ?

Le contraste entre Centre Historique Ouest et Bourtzwiller Sud-Ouest est utile pour chercher un logement : des équipements proches se rencontrent dans des secteurs aux pratiques très différentes. Le lieu de travail apporte un autre repère, sans permettre de prédire les déplacements du lecteur.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.682240101.panier_500m`, `iris.682241703.panier_500m`, `mobpro.voiture_selon_destination.meme_commune` et `mobpro.voiture_selon_destination.communes_voisines`. L’ouverture s’appuie sur `carburant.*` et `scenario.carburant.*`.

**Format retenu : article court**, avec le tableau du scénario et la carte des pratiques par secteur.

Pistes écartées : possession automobile, stationnement, statut d’occupation et actifs entrants disperseraient la question ; la comparaison nationale apporte peu à ce choix d’adresse ; les données de bus ne sont pas utilisables.

## B. Article

# À Mulhouse, quelle adresse choisir pour moins utiliser la voiture ?

**Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de 0,85 €/L pour le gazole et de 0,59 €/L pour le SP95-E10, dans un rayon de 12 km à vol d’oiseau autour du centre de Mulhouse. Pour qui cherche un logement, cette hausse remet les déplacements quotidiens dans la discussion.**

Le tableau présente un scénario de surcoût annuel, pour le carburant seul : consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et hausses arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Surcoût annuel de carburant — hausses 2025–2026.*

| Distance du trajet aller | Gazole : hausse retenue de 0,85 €/L | SP95-E10 : hausse retenue de 0,60 €/L |
|---|---:|---:|
| 5 km | environ 100 € | environ 70 € |
| 15 km | environ 310 € | environ 220 € |
| 35 km | environ 710 € | environ 500 € |

Ce scénario donne un repère pour le budget. Pour orienter la recherche à Mulhouse, les pratiques locales éclairent une autre question : quelle place la voiture occupe-t-elle selon le secteur de résidence et le lieu de travail ?

## Des pratiques différentes selon le secteur et la destination

Les pratiques domicile-travail du recensement 2022 montrent des contrastes au sein de Mulhouse. Au Centre Historique Ouest, 35 % des actifs occupés résidant dans le secteur déclarent la voiture comme mode principal pour travailler. À Bourtzwiller Sud-Ouest, cette part atteint 81 %.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Actifs occupés résidant dans chaque secteur, quelle que soit leur commune de travail — INSEE, RP 2022.*

Le lieu de travail apporte un autre repère pour préparer sa recherche. Parmi les actifs qui habitent et travaillent à Mulhouse, 50 % utilisent principalement la voiture. Parmi les actifs résidant à Mulhouse qui travaillent à Wittenheim, Illzach, Rixheim, Kingersheim, Riedisheim ou Wittelsheim, cette part est de 77 %. Une annonce se regarde donc aussi avec sa destination professionnelle en tête.

## Des équipements proches, y compris là où la voiture domine

Le trajet professionnel ne couvre pas les courses ni l’accompagnement à l’école. Pour ces déplacements, les mêmes secteurs offrent un éclairage complémentaire.

Au Centre Historique Ouest, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Bourtzwiller Sud-Ouest, cette part est de 93 %. Ce panier d’équipements est donc proche de nombreuses adresses dans le secteur où la part de la voiture pour travailler est la plus élevée.

Pour départager des annonces dans ces secteurs, repérez les équipements qui comptent pour vous et parcourez le chemin depuis le logement. Examinez séparément votre trajet professionnel, avec votre destination et vos horaires : la proximité des courses ou d’une école ne répond pas à cette question.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Explorez avec futur•e l’adresse que vous envisagez à partir de ce projet, pour examiner ce qui pèsera dans votre choix de logement.

## Méthode et sources

Les pratiques proviennent de l’INSEE : fichier MOBPRO et bases infracommunales Activité des résidents et Logement. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage.

Les groupes définis par leur commune de travail réunissent des personnes distinctes : leur comparaison ne mesure pas l’effet d’un déménagement. Les données par secteur et par destination ne sont pas croisées.

La proximité des équipements repose sur la Base adresse nationale et la BPE 2025 de l’INSEE ; chaque adresse du secteur compte également. Les distances sont à vol d’oiseau, jusqu’à l’adresse de l’établissement, et ne décrivent ni le chemin réel ni l’usage des équipements. Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; une hausse passée ne préjuge pas des prix futurs.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,85 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,59 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes, section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes, section 7 | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — hausse retenue, gazole | 0,85 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue, SP95-E10 | 0,60 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première ligne | environ 100 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première ligne | environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième ligne | environ 310 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième ligne | environ 220 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième ligne | environ 710 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième ligne | environ 500 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime du recensement | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — Centre Historique Ouest | 35 % | `iris.voiture.min` | oui |
| Pratiques — Bourtzwiller Sud-Ouest | 81 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Destination — travail à Mulhouse | 50 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Destination — travail dans le groupe nommé | 77 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements — « toutes les adresses » du Centre Historique Ouest | 100 % exprimé en mots | `iris.682240101.panier_500m` | oui |
| Équipements — seuil du panier commun aux deux secteurs | 500 m | `iris.682240101.panier_500m`, `iris.682241703.panier_500m` | oui |
| Équipements — Bourtzwiller Sud-Ouest | 93 % | `iris.682241703.panier_500m` | oui |
| Méthode — millésime BPE | 2025 | `iris.682240101.panier_500m`, `iris.682241703.panier_500m` — source équipements du dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Centre Historique Ouest et Bourtzwiller Sud-Ouest | Aucune pour la production automatique : classes automatiques et repères numérotés des secteurs cités. Libellés posés à la main seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication.
- **`iris.ecart_voiture`** : relire les libellés Centre Historique Ouest et Bourtzwiller Sud-Ouest. Le texte les présente comme des secteurs statistiques.
- **`mobpro.voiture_selon_destination`** : relire l’intérêt du groupe de communes retenu. Sa liste exacte est donnée dans l’article ; cette vérification est non bloquante pour la rédaction.

Aucun autre doute de lecture relevé.