## A. Question et format

**Question principale : un secteur bien équipé suffit-il à orienter une recherche de logement pour moins utiliser la voiture à Toulon ?**

Saint-Louis et Barbes ont tous deux le panier d’équipements à proximité de toutes leurs adresses, mais leurs pratiques domicile-travail diffèrent nettement. Ce rapprochement aide le lecteur à distinguer proximité des services, pratiques du secteur et trajet vers son propre travail.

Appuis : `iris.831370502.voiture`, `iris.831370302.voiture`, `iris.831370502.panier_500m`, `iris.831370302.panier_500m`, `destination.83137.voiture`, `destination.83126.voiture`. Ouverture : `carburant.gazole.ecart`, `carburant.e10.ecart` et `scenario.carburant.*`.

**Format retenu : article court.** Stationnement, statut d’occupation et comparaison nationale sont écartés : ils disperseraient cette question sans mieux éclairer le choix d’une adresse.

## B. Article

# À Toulon, chercher un logement pour moins prendre la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du carburant augmente de 0,71 €/L pour le gazole et de 0,50 €/L pour le SP95-E10, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Toulon. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

Le tableau retient une consommation de **6 L/100 km**, **200 allers-retours domicile-travail par an** et des hausses arrondies à **5 centimes** : **+0,70 €/L** pour le gazole et **+0,50 €/L** pour le SP95-E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces scénarios donnent un repère pour le carburant. Pour choisir où chercher à Toulon, il faut ensuite examiner les pratiques locales et les déplacements que l’on souhaite changer.

## Des pratiques différentes selon le secteur et le lieu de travail

Dans les pratiques du recensement **2022**, la voiture est le mode principal pour aller travailler de **25 % des actifs résidant dans le secteur Saint-Louis**, contre **70 % dans celui de Barbes**, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Ce contraste invite à regarder le secteur des annonces que vous sélectionnez. Mais votre lieu de travail mérite un examen distinct : parmi les actifs qui habitent et travaillent à Toulon, **54 %** utilisent principalement la voiture pour ce trajet. Parmi ceux qui habitent Toulon et travaillent à La Seyne-sur-Mer, cette part atteint **82 %**.

Pour préparer une visite, gardez donc votre destination professionnelle en regard de l’adresse : les pratiques observées autour du logement ne répondent pas à elles seules à la question de votre trajet.

## Et pour les courses, l’école ou la pharmacie ?

Le trajet professionnel ne couvre qu’une partie des déplacements à envisager avant de déménager. Pour les autres, Saint-Louis et Barbes présentent un point commun : **toutes les adresses de chacun de ces secteurs** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**.

Cette proximité commune accompagne pourtant des pratiques domicile-travail différentes. Un secteur bien équipé mérite donc votre attention, sans suffire à décrire la place que prendra la voiture dans votre quotidien.

Lors d’une visite, parcourez les chemins vers les équipements qui vous serviraient. Si vous envisagez les transports en commun pour travailler, consultez la page [« Lignes et horaires » du RESEAU MISTRAL](https://www.reseaumistral.com/se-deplacer/lignes), puis vérifiez les horaires en vigueur pour vos jours de déplacement et vos retours.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou pour organiser autrement la vie de famille ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner ce qui peut peser dans votre choix.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE et des bases infracommunales. Les secteurs sont des IRIS statistiques, dont les libellés peuvent différer des noms de quartiers usuels. Les résultats sont des estimations par sondage ; les comparaisons décrivent des groupes distincts, sans mesurer l’effet d’un déménagement. Les données ne croisent pas secteur de résidence et commune de travail.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements **2025** de l’INSEE. Chaque adresse compte pareil au sein du secteur ; la proximité ne renseigne ni l’usage de l’établissement ni le chemin pour y accéder.

Les prix proviennent de prix-carburants.gouv.fr : médiane, entre stations, du dernier prix déclaré dans chaque semaine. La comparaison n’est pas contrôlée sur un ensemble identique de stations. Le scénario chiffre uniquement un surcoût de carburant.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, semaine initiale | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, semaine finale | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,71 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,50 €/L | `carburant.e10.ecart` | oui |
| Chapeau, rayon autour du centre | 12 km, à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèse de consommation | 6 L | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèse de consommation, distance de référence | 100 km | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hypothèse de déplacements annuels | 200 allers-retours | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Arrondi des hausses retenues | 5 centimes | `scenario.carburant.*` — hypothèses communes, section 7 | oui |
| Hausse retenue, gazole | +0,70 €/L | `scenario.carburant.gazole.5km`, `scenario.carburant.gazole.15km`, `scenario.carburant.gazole.35km` | oui |
| Hausse retenue, SP95-E10 | +0,50 €/L | `scenario.carburant.e10.5km`, `scenario.carburant.e10.15km`, `scenario.carburant.e10.35km` | oui |
| Tableau, distance de la première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, première ligne, gazole | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, première ligne, SP95-E10 | environ 60 € | `scenario.carburant.e10.5km` | oui |
| Tableau, distance de la deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, deuxième ligne, gazole | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, deuxième ligne, SP95-E10 | environ 180 € | `scenario.carburant.e10.15km` | oui |
| Tableau, distance de la troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, troisième ligne, gazole | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, troisième ligne, SP95-E10 | environ 420 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime | 2022 | `iris.831370502.voiture`, `iris.831370302.voiture`, `destination.83137.voiture`, `destination.83126.voiture` | oui |
| Pratiques locales, voiture à Saint-Louis | 25 % | `iris.831370502.voiture` | oui |
| Pratiques locales, voiture à Barbes | 70 % | `iris.831370302.voiture` | oui |
| Actifs habitant et travaillant à Toulon, voiture | 54 % | `destination.83137.voiture` | oui |
| Actifs habitant Toulon et travaillant à La Seyne-sur-Mer, voiture | 82 % | `destination.83126.voiture` | oui |
| Équipements, totalité des adresses dans chacun des secteurs cités | 100 %, écrit « toutes les adresses » | `iris.831370502.panier_500m`, `iris.831370302.panier_500m` | oui |
| Équipements, seuil de proximité | 500 m, à vol d’oiseau | `iris.831370502.panier_500m`, `iris.831370302.panier_500m` | oui |
| Méthode, millésime des équipements | 2025 | `iris.831370502.panier_500m`, `iris.831370302.panier_500m` — source BPE précisée dans le dossier | oui |

Les hypothèses communes du scénario sont explicitement fournies en section 7, mais ne disposent pas d’identifiants individuels : la notation `scenario.carburant.*` renvoie ici aux six faits existants du scénario.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune. Conserver les semaines de comparaison avec le tableau. |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Saint-Louis et Barbes | Aucune pour la production : classes automatiques et repères numérotés avec leur liste. Libellés manuels seulement pour une version soignée. Afficher le millésime 2022 et repérer les secteurs cités. |

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Saint-Louis et Barbes. Le texte les présente comme des secteurs statistiques ; confirmer notamment la graphie « Barbes ».
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification concerne aussi le scénario de surcoût.

**Doute de traçabilité :** les hypothèses communes du scénario sont utilisables et explicites, mais sans identifiant individuel. Leur attribuer des identifiants stables permettrait une correspondance strictement individuelle pour chaque chiffre.

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
