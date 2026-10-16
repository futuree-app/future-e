## A. Question et format

**Question principale :** à Montauban, quels secteurs examiner quand on cherche un logement pour utiliser moins la voiture ?

Travailler dans la commune ne suffit pas à décrire les pratiques : la voiture reste majoritaire parmi les actifs qui habitent et travaillent à Montauban. Les contrastes entre secteurs, rapprochés de la proximité des équipements, donnent des points de départ pour examiner des annonces, sans prédire les déplacements du lecteur.

Appuis : `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.821210101.voiture`, `iris.821211102.voiture`, `iris.821210101.panier_500m`, `iris.821211102.panier_500m`, `iris.821210405.panier_500m`, `iris.821210405.voiture`.

**Format retenu : article court**, avec l’ouverture carburant obligatoire. Les flux entrants, le stationnement et la comparaison entre villes sont écartés pour concentrer le récit sur le choix du secteur et de l’adresse.

## B. Article

# À Montauban, où chercher un logement pour moins utiliser la voiture ?

**Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de 0,74 €/L pour le gazole et de 0,53 €/L pour le SP95-E10, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Montauban. Pour une recherche de logement, cette hausse remet les déplacements quotidiens dans la discussion.**

Le tableau donne un scénario de surcoût annuel, pour le carburant seul. Hypothèses : une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et des hausses médianes arrondies à 5 centimes, soit +0,75 €/L pour le gazole et +0,55 €/L pour le SP95-E10.

*Scénario fondé sur la hausse entre 2025 et 2026.*

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour chercher à réduire ces déplacements en voiture, les pratiques locales permettent de préciser la question : travailler à Montauban et choisir un secteur de résidence sont deux observations à examiner.

## Travailler à Montauban, habiter quel secteur ?

Selon le recensement de 2022, 74 % des actifs occupés résidant à Montauban travaillent dans la commune. Parmi ces actifs qui habitent et travaillent à Montauban, 75 % déclarent la voiture comme mode principal pour aller travailler. Un emploi dans la même commune que le logement laisse donc entière la question du déplacement concret.

Les pratiques diffèrent aussi selon le secteur de résidence. À Consul Dupuy, la voiture est le mode principal de 55 % des actifs résidents pour aller travailler ; au Fau, cette part atteint 92 %. Ces chiffres concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Pratiques domicile-travail — recensement 2022.*

Reste à confronter chaque annonce aux déplacements que vous envisagez, notamment vers votre travail.

## Les courses et l’école demandent une autre lecture

Le trajet professionnel ne couvre pas les autres sorties du quotidien. Pour les examiner, on peut regarder la présence conjointe d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau.

À Consul Dupuy, toutes les adresses réunissent ce panier de proximité. Au Fau, aucune ne le réunit : cela ne signifie pas qu’aucun équipement n’est proche.

La proximité ne suffit toutefois pas à décrire les pratiques professionnelles. À Coulée Verte, 91 % des adresses réunissent ce panier, tandis que 84 % des actifs résidents vont travailler principalement en voiture.

Pour une annonce à Consul Dupuy ou à Coulée Verte, repérez les équipements qui correspondent à vos besoins et parcourez leurs accès lors de la visite. Au Fau, recherchez séparément le commerce, la pharmacie ou l’école qui vous intéresse, plutôt que de conclure à leur absence.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille ? Avec futur•e, examinez l’adresse envisagée à partir de ce projet et de la place que vous souhaitez donner aux déplacements dans votre quotidien.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE et de ses bases infracommunales. Ce sont des estimations par sondage ; les comparaisons portent sur des groupes distincts, sans mesurer l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers d’usage.

La proximité repose sur la Base adresse nationale et la Base permanente des équipements (INSEE, 2025) : elle porte sur les adresses, sans mesurer l’usage des établissements ni les parcours réels. Les prix proviennent du flux officiel de prix-carburants.gouv.fr ; le scénario illustre un surcoût et n’est attribué à aucun secteur.

## C. Correspondance interne — non publiée

Les hypothèses communes du scénario figurent en introduction de la section 7 du dossier ; elles sont rattachées ci-dessous aux identifiants des scénarios concernés.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,74 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,53 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — distance de consommation | 100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — allers-retours annuels | 200 | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui — hypothèse commune |
| Hypothèses — hausse retenue du gazole | +0,75 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses — hausse retenue du SP95-E10 | +0,55 €/L | `scenario.carburant.e10.5km` | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — première distance aller | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, première distance | environ 90 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, première distance | environ 70 € | `scenario.carburant.e10.5km` | oui |
| Tableau — deuxième distance aller | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, deuxième distance | environ 270 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, deuxième distance | environ 200 € | `scenario.carburant.e10.15km` | oui |
| Tableau — troisième distance aller | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, troisième distance | environ 630 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, troisième distance | environ 460 € | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime du recensement | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — actifs travaillant dans la commune | 74 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Montauban | 75 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — voiture à Consul Dupuy | 55 % | `iris.821210101.voiture` | oui |
| Pratiques — voiture au Fau | 92 % | `iris.821211102.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.821210101.voiture`, `iris.821211102.voiture`, `iris.821210405.voiture` | oui |
| Équipements — rayon du panier | 500 m | `iris.821210101.panier_500m`, `iris.821211102.panier_500m`, `iris.821210405.panier_500m` | oui |
| Équipements — panier à Consul Dupuy | 100 % (« toutes les adresses ») | `iris.821210101.panier_500m` | oui |
| Équipements — panier au Fau | 0 % (« aucune ») | `iris.821211102.panier_500m` | oui |
| Équipements — panier à Coulée Verte | 91 % | `iris.821210405.panier_500m` | oui |
| Équipements — voiture à Coulée Verte | 84 % | `iris.821210405.voiture` | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Ouverture, après les hypothèses | Aucune. |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts de voiture à Consul Dupuy et au Fau | Aucune pour la production automatique ; libellés à poser manuellement seulement pour une version soignée. Repérer les secteurs cités : Consul Dupuy, Le Fau et Coulée Verte. |

Vérifications avant publication concernant les faits utilisés :

- **Carburant :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario.
- **Secteurs :** relire les libellés Consul Dupuy, Le Fau et Coulée Verte. Le texte les désigne comme secteurs statistiques.
- **Commune de travail :** relire l’intérêt du découpage signalé par la vérification `mobpro.voiture_selon_destination`. Seul le groupe des actifs habitant et travaillant à Montauban est retenu ; aucun groupe de communes sélectionnées n’est cité.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante | Consul Dupuy constitue ainsi une piste à examiner dans une recherche de logement visant à moins prendre la voiture. | Phrase supprimée. |
| Consigne interne — à revoir | Pour les examiner, le dossier mesure la présence conjointe | Pour les examiner, on peut regarder la présence conjointe |
| Méthode — à revoir | La proximité repose sur la Base adresse nationale et la Base permanente des équipements | La proximité repose sur la Base adresse nationale et la Base permanente des équipements (INSEE, 2025) |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
