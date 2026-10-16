## A. Question et format

**Question principale :** pour utiliser moins la voiture à Metz, que regarder au-delà des services proches du logement ?

Le contraste entre Metz Centre Esplanade et Val de la Grange-aux-Bois est utile pour une recherche immobilière : la proximité des équipements peut être largement répandue dans un secteur où la voiture domine les déplacements professionnels. L’article distingue donc les trajets de travail des autres déplacements, sans déduire des pratiques observées ce que le lecteur pourra faire.

**Appuis :** `iris.574630401.voiture`, `iris.574631202.voiture`, `iris.574630401.panier_500m`, `iris.574631202.panier_500m`, `destination.57463.part_des_actifs`, `destination.57463.voiture`. Ouverture : `carburant.gazole.ecart`, `carburant.e10.ecart` et `scenario.carburant.*`.

**Format retenu :** article court, centré sur ce contraste.

**Pistes écartées :** stationnement, statut d’occupation et flux entrants éloigneraient de la question ; la comparaison nationale et le détail des destinations n’apportent pas assez ici.

## B. Article

# À Metz, des services proches ne disent pas tout de la place de la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de **0,79 €/L pour le gazole** et de **0,51 €/L pour le SP95-E10**, dans les stations situées dans un rayon de **12 km à vol d’oiseau** autour du centre de Metz. Lorsqu’on cherche un logement, cette hausse donne une raison concrète d’examiner les déplacements que l’on souhaite conserver, raccourcir ou faire autrement.

Le scénario suivant chiffre le **surcoût annuel de carburant**, avec une consommation de **6 L/100 km** et **200 allers-retours domicile-travail par an**. Les hausses sont arrondies à **5 centimes**, soit **+0,80 €/L pour le gazole** et **+0,50 €/L pour le SP95-E10**.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances ne correspondent à aucun quartier particulier. Pour choisir une adresse à Metz, il faut maintenant regarder les déplacements professionnels, puis les services que l’on souhaite trouver près de chez soi.

## Le travail : regarder la destination et le secteur

Les pratiques du **recensement de 2022** montrent que **60 % des actifs résidant à Metz travaillent dans la commune**. Parmi ces actifs qui habitent et travaillent à Metz, **46 % utilisent la voiture comme mode principal pour aller travailler**. Chercher dans la commune où l’on travaille laisse donc entière la question du trajet entre le logement et l’emploi.

Les pratiques diffèrent aussi selon le secteur de résidence. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la part de la voiture est de **28 % à Metz Centre Esplanade**, contre **83 % au Val de la Grange-aux-Bois**.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Pour une recherche de logement, ces observations invitent à regarder les annonces à une échelle plus précise que celle de la commune, tout en gardant son propre lieu de travail comme point de repère.

## Courses et école : une autre lecture de l’adresse

Le trajet professionnel ne couvre pas les déplacements pour les courses ou l’école. Pour ceux-ci, le dossier décrit la proximité d’un ensemble d’équipements : un commerce alimentaire, une pharmacie et une école élémentaire, tous à moins de **500 m à vol d’oiseau**.

Cet ensemble est présent autour de **98 % des adresses de Metz Centre Esplanade**, mais aussi de **91 % des adresses du Val de la Grange-aux-Bois**. Dans ce dernier secteur, une large proximité des services coexiste donc avec un usage dominant de la voiture pour travailler.

Si vous retenez une annonce au Val de la Grange-aux-Bois, examinez séparément la liaison vers votre emploi et les chemins vers les équipements qui vous intéressent. Lors de la visite, parcourez ces chemins : la distance à vol d’oiseau ne décrit pas les accès réels. Si vous envisagez les transports en commun pour travailler, vérifiez auprès du réseau **Le Met’** la liaison correspondant à vos lieux et à vos horaires.

## Votre projet, votre adresse

Vous cherchez à rapprocher votre logement du travail ou à organiser une vie de famille avec moins de déplacements en voiture. Explorez avec futur•e l’adresse envisagée à partir de ce projet, pour apprécier ce qui peut peser dans votre choix.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE et de ses bases infracommunales. Les parts par secteur concernent les actifs qui y résident, tous lieux de travail confondus ; elles ne sont pas croisées avec la commune de travail. Ces estimations par sondage décrivent des groupes distincts, sans mesurer l’effet d’un déménagement.

Les secteurs sont les IRIS statistiques de l’INSEE, dont les libellés peuvent différer des noms de quartiers usuels. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE : elle porte sur les adresses, sans mesurer l’usage des établissements. Les prix du carburant proviennent de prix-carburants.gouv.fr ; leur évolution compare les médianes des stations déclarantes de chaque semaine, sans contrôle à stations identiques.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui — date |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui — date |
| Chapeau — hausse du gazole | 0,79 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,51 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon des stations | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui — périmètre |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — règle du scénario |
| Hypothèses — hausse retenue, gazole | +0,80 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 100 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 290 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 670 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Travail — millésime des pratiques | 2022 | `destination.57463.part_des_actifs`, `destination.57463.voiture`, `iris.574630401.voiture`, `iris.574631202.voiture` | oui — millésime |
| Travail — actifs résidant et travaillant à Metz | 60 % | `destination.57463.part_des_actifs` | oui |
| Travail — voiture parmi ces actifs | 46 % | `destination.57463.voiture` | oui |
| Secteurs — voiture, Metz Centre Esplanade | 28 % | `iris.574630401.voiture` | oui |
| Secteurs — voiture, Val de la Grange-aux-Bois | 83 % | `iris.574631202.voiture` | oui |
| Équipements — seuil de proximité | 500 m | `iris.574630401.panier_500m`, `iris.574631202.panier_500m` | oui — définition |
| Équipements — adresses de Metz Centre Esplanade | 98 % | `iris.574630401.panier_500m` | oui |
| Équipements — adresses du Val de la Grange-aux-Bois | 91 % | `iris.574631202.panier_500m` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses | Aucune. Données disponibles et reprises dans l’article. |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture des secteurs cités | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros accompagnés de leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés Metz Centre Esplanade et Val de la Grange-aux-Bois. Le texte les présente comme des secteurs statistiques.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication pour les faits carburant et le scénario retenus.

Aucun autre doute de lecture identifié.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
