## A. Question et format

**Question principale :** à Annecy, comment choisir un secteur pour utiliser moins la voiture, sans s’en tenir à la proximité des commerces et des écoles ?

Les pratiques domicile-travail diffèrent fortement entre secteurs, mais la présence d’équipements proches ne coïncide pas toujours avec une faible place de la voiture. Pour une recherche de logement, cela invite à examiner ensemble le secteur, le trajet professionnel et les déplacements du quotidien.

Appuis : `iris.740100101.voiture`, `iris.740101503.voiture`, `destination.74010.voiture`, `iris.740100101.panier_500m`, `iris.740101503.panier_500m`, `iris.740101102.panier_500m`, `iris.740101102.voiture`.

**Format retenu : article court**, centré sur ce contraste, avec l’ouverture carburant obligatoire.

**Pistes écartées :** stationnement, statut d’occupation et comparaison entre villes, qui disperseraient le propos ; fréquences de bus, inutilisables.

## B. Article

# À Annecy, quel secteur regarder pour utiliser moins la voiture ?

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,76 €/L et celui du SP95-E10 de 0,48 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Annecy. Pour une recherche de logement, cette hausse remet les déplacements dans la discussion : que regarder au-delà de l’annonce ?

Le tableau donne un repère selon la distance domicile-travail. Ses hypothèses : une consommation de 6 L/100 km, 200 allers-retours par an et des hausses arrondies à 5 centimes. Il chiffre uniquement le surcoût annuel de carburant.

[VISUEL : Tableau du scénario de surcoût de carburant]

*Scénario fondé sur la hausse entre 2025 et 2026.*

| Trajet aller | Gazole : hausse retenue de +0,75 €/L | SP95-E10 : hausse retenue de +0,50 €/L |
|---|---:|---:|
| 5 km | environ 90 € par an | environ 60 € par an |
| 15 km | environ 270 € par an | environ 180 € par an |
| 35 km | environ 630 € par an | environ 420 € par an |

Ces distances ne correspondent à aucun secteur particulier. À Annecy, les pratiques locales donnent un autre repère pour orienter les recherches.

## Des pratiques différentes selon le secteur

Au recensement de 2022, la voiture est le mode principal pour aller travailler de 43 % des actifs qui habitent le secteur Courier, contre 85 % dans celui de Vieugy-Balmont. Ces parts portent sur les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Mode principal domicile-travail des actifs résidant dans chaque secteur — recensement 2022.*

Le lieu de travail reste une question à examiner séparément : parmi les actifs qui habitent **et** travaillent à Annecy, 52 % utilisent principalement la voiture. Une annonce située dans la même commune que votre emploi ne suffit donc pas à décrire votre futur trajet. Repérez les départs et arrivées précis, puis examinez les possibilités adaptées à vos horaires.

## Des équipements proches, pour quels déplacements ?

Le trajet professionnel ne couvre qu’une partie de la semaine. Pour les courses, la pharmacie ou l’école, on peut regarder un panier commun : la présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau d’une adresse.

À Courier, toutes les adresses disposent de ce panier à proximité. À Vieugy-Balmont, cette part est de 11 %. Ce contraste donne une raison concrète de regarder l’environnement de chaque annonce, surtout pour une installation en famille.

Mais proximité des équipements et pratiques professionnelles ne se confondent pas. Dans le secteur Le Jourdil-Beauregard, 98 % des adresses disposent du panier proche, tandis que 72 % des actifs résidents vont principalement travailler en voiture. Les équipements alentour et le trajet vers l’emploi éclairent des besoins différents.

## Avant de retenir une adresse

Pendant une visite, partez du logement pour examiner les cheminements vers les équipements qui vous intéressent : leurs accès et les traversées font partie du trajet réel. Pour une option en transports en commun, consultez le [site de Sibra](https://www.sibra.fr/) avec vos lieux de départ et d’arrivée, vos jours de déplacement et vos horaires habituels.

Si votre déménagement vise à vous rapprocher du travail ou à installer votre famille, partez de ce projet pour examiner l’adresse envisagée. Avec futur•e, explorez-la dans son ensemble pour préciser ce qui pèsera dans votre choix.

### Méthode et sources

Les pratiques domicile-travail viennent du recensement de l’INSEE et de ses bases infracommunales. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont des IRIS statistiques, dont les libellés ne correspondent pas toujours aux quartiers d’usage. Les groupes selon le lieu de travail sont distincts et ne sont pas croisés avec les secteurs de résidence.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte pareil au sein d’un secteur. Les distances à vol d’oiseau ne décrivent pas les cheminements ni l’usage des équipements.

Les prix proviennent du flux officiel de prix-carburants.gouv.fr : médiane entre stations du dernier prix déclaré dans chaque semaine. Les stations déclarantes peuvent différer entre les semaines. Le scénario est illustratif et n’est attribué à aucun secteur.

## C. Correspondance interne — non publiée

Les mentions « toutes », les dates et les nombres des hypothèses sont inclus dans la correspondance.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,76 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,48 €/L | `carburant.e10.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses — consommation | 6 L/100 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses — arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Légende du tableau — année initiale | 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — année finale | 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Tableau — hausse retenue, gazole | +0,75 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Tableau — hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau — trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — surcoût gazole, première ligne | environ 90 € par an | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût SP95-E10, première ligne | environ 60 € par an | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — surcoût gazole, deuxième ligne | environ 270 € par an | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût SP95-E10, deuxième ligne | environ 180 € par an | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — surcoût gazole, troisième ligne | environ 630 € par an | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût SP95-E10, troisième ligne | environ 420 € par an | `scenario.carburant.e10.35km` | oui |
| Pratiques — millésime | 2022 | `iris.740100101.voiture`, `iris.740101503.voiture` | oui |
| Pratiques — Courier | 43 % | `iris.740100101.voiture` | oui |
| Pratiques — Vieugy-Balmont | 85 % | `iris.740101503.voiture` | oui |
| Légende de la carte — millésime | 2022 | `iris.740100101.voiture`, `iris.740101503.voiture` | oui |
| Pratiques — actifs habitant et travaillant à Annecy | 52 % | `destination.74010.voiture` | oui |
| Équipements — définition du panier | 500 m | `iris.740100101.panier_500m`, `iris.740101503.panier_500m`, `iris.740101102.panier_500m` | oui |
| Équipements — Courier | toutes les adresses, soit la valeur exacte de 100 % | `iris.740100101.panier_500m` | oui |
| Équipements — Vieugy-Balmont | 11 % | `iris.740101503.panier_500m` | oui |
| Équipements — Le Jourdil-Beauregard | 98 % | `iris.740101102.panier_500m` | oui |
| Pratiques — Le Jourdil-Beauregard | 72 % | `iris.740101102.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.740100101.panier_500m`, `iris.740101503.panier_500m`, `iris.740101102.panier_500m` | oui |
| Chapeau et tableau — désignation du carburant | SP95-E10, dénomination et non quantité | `carburant.e10.ecart`, `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |

Le renvoi vers le site officiel repose sur `doc.reseau.site` ; le nom Sibra est également établi par `doc.reseau.identite`. Aucun chiffre de desserte n’est utilisé.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste Courier / Vieugy-Balmont | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Vérifications concernant les faits utilisés :

- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication pour les hausses et le scénario.
- **`iris.ecart_voiture`** : relire les libellés Courier, Vieugy-Balmont et Le Jourdil-Beauregard. Le texte les présente comme des secteurs statistiques ; conserver cette distinction lors de la mise en page.

Aucun autre doute de lecture relevé.

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : lien suggéré entre pratiques du secteur et pratique future du lecteur | « Pour sélectionner des annonces, ce contraste mérite de regarder où se situe le logement dans la commune. » | Phrase supprimée. Le paragraphe commence directement par « Le lieu de travail reste une question à examiner séparément ». |
| Consigne interne — a_revoir : terme de production | « le dossier mesure un panier commun » | « on peut regarder un panier commun » |