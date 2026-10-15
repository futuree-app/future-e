## A. Question et format

**Question principale :** que regarder au-delà de la proximité des équipements pour chercher un logement à Saint-Denis en utilisant moins la voiture ?

Les secteurs aux parts de voiture les plus éloignées ont tous leurs adresses proches du panier quotidien : les équipements seuls ne permettent donc pas de départager leurs pratiques domicile-travail. Les différences selon la destination professionnelle invitent aussi le lecteur à examiner son propre trajet avant de choisir une adresse.

Appuis : `iris.voiture.min`, `iris.voiture.max`, `iris.930660906.panier_500m`, `iris.930660705.panier_500m`, `destination.75108.voiture`, `destination.95527.voiture`, avec `mobpro.modes.tc` comme repère communal.

**Format retenu : article court.** L’ouverture conserve la hausse du gazole et son scénario pré-calculé. Pistes écartées : stationnement, possession automobile, actifs venant travailler dans la commune et comparaison nationale, qui disperseraient cette question.

## B. Article

# Saint-Denis : des services proches, des usages de la voiture différents

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,64 €/L dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Saint-Denis. Pour une recherche de logement, cette hausse remet les déplacements réguliers dans la discussion.

Le scénario ci-dessous porte sur le carburant seul. Il retient une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et une hausse arrondie à 5 centimes, soit +0,65 €/L.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Surcoût annuel de gazole |
|---|---:|
| 5 km | environ 80 € |
| 15 km | environ 230 € |
| 35 km | environ 550 € |

Ces distances ne correspondent pas à des quartiers particuliers. Pour choisir où habiter à Saint-Denis, il faut maintenant regarder les pratiques locales et les déplacements que l’on souhaite changer.

## Le secteur de résidence et la destination professionnelle

Au recensement de 2022, 62 % des actifs occupés résidant à Saint-Denis déclarent les transports en commun comme mode principal pour aller travailler.

À l’échelle des secteurs, la part de la voiture va de 11 % à République Gare Porte de Paris 06 à 35 % à Franc-Moisin Bel-Air 05. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage à la recherche. Parmi les actifs résidant à Saint-Denis qui travaillent dans Paris 8e Arrondissement, 8 % déclarent la voiture comme mode principal ; parmi ceux qui travaillent à Roissy-en-France, cette part est de 68 %. Pour examiner une annonce, gardez donc votre destination professionnelle précise en regard de l’adresse envisagée.

## Les courses et l’école demandent un autre regard

Le trajet professionnel n’est pas le seul déplacement qu’un déménagement peut modifier. Pour les courses, l’école ou la pharmacie, la proximité autour du logement mérite son propre examen.

Les secteurs aux extrêmes de la part de la voiture ont ici un point commun : toutes leurs adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. Cette proximité commune accompagne des pratiques domicile-travail différentes.

Pendant une visite, partez du logement pour examiner les cheminements vers les établissements qui vous seraient utiles et repérer leurs entrées. Pour un projet familial, confirmez aussi quelle école correspond à l’adresse : la présence d’un établissement proche ne règle pas cette question.

## Votre projet, votre adresse

Si votre déménagement vise à donner moins de place à la voiture, partez des déplacements que vous souhaitez changer. Avec futur•e, explorez l’adresse envisagée à partir de votre projet pour l’examiner dans son ensemble avant de choisir.

## Méthode et sources

Pratiques : INSEE, fichier Mobilités professionnelles et bases infracommunales Activité et Logement. Les résultats sont des estimations par sondage ; les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. Les groupes de destination sont distincts et ne sont pas croisés avec les secteurs de résidence.

Équipements : Base adresse nationale et BPE 2025 de l’INSEE. Chaque adresse compte pareil dans les parts par secteur. La distance à vol d’oiseau rejoint l’adresse de l’établissement ; elle ne décrit ni le cheminement ni l’usage.

Carburant : prix-carburants.gouv.fr, médiane entre stations du dernier prix déclaré dans chaque semaine retenue.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | oui |
| Chapeau — fin de période | 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Chapeau — hausse | 0,64 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — rayon autour du centre | 12 km | `carburant.gazole.ecart` | oui |
| Hypothèses — consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses communes du scénario | oui |
| Hypothèses — distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses communes du scénario | oui |
| Hypothèses — déplacements annuels | 200 allers-retours | `scenario.carburant.gazole.5km` — hypothèses communes du scénario | oui |
| Hypothèses — arrondi de la hausse | 5 centimes | `scenario.carburant.gazole.5km` — hypothèses communes du scénario | oui |
| Hypothèses — hausse retenue | +0,65 €/L | `scenario.carburant.gazole.5km` | oui |
| Tableau — trajet aller | 5 km | `scenario.carburant.gazole.5km` | oui |
| Tableau — surcoût annuel | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — trajet aller | 15 km | `scenario.carburant.gazole.15km` | oui |
| Tableau — surcoût annuel | environ 230 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — trajet aller | 35 km | `scenario.carburant.gazole.35km` | oui |
| Tableau — surcoût annuel | environ 550 € | `scenario.carburant.gazole.35km` | oui |
| Pratiques — millésime | 2022 | `mobpro.modes.tc` | oui |
| Pratiques — transports en commun | 62 % | `mobpro.modes.tc` | oui |
| Secteurs — part de la voiture minimale | 11 % | `iris.voiture.min` | oui |
| Secteurs — suffixe du libellé République Gare Porte de Paris | 06 | `iris.voiture.min` | oui |
| Secteurs — part de la voiture maximale | 35 % | `iris.voiture.max` | oui |
| Secteurs — suffixe du libellé Franc-Moisin Bel-Air | 05 | `iris.voiture.max` | oui |
| Destination — libellé Paris 8e Arrondissement | 8e | `destination.75108.voiture` | oui |
| Destination — voiture vers Paris 8e Arrondissement | 8 % | `destination.75108.voiture` | oui |
| Destination — voiture vers Roissy-en-France | 68 % | `destination.95527.voiture` | oui |
| Équipements — « toutes leurs adresses », secteur au minimum de voiture | toutes, soit 100 % | `iris.930660906.panier_500m` | oui |
| Équipements — « toutes leurs adresses », secteur au maximum de voiture | toutes, soit 100 % | `iris.930660705.panier_500m` | oui |
| Équipements — seuil de proximité | 500 m | `iris.930660906.panier_500m`, `iris.930660705.panier_500m` | oui |
| Méthode — millésime BPE | 2025 | `iris.930660906.panier_500m`, `iris.930660705.panier_500m` — source des équipements précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

| Visuel retenu | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début, après les hypothèses ; lignes gazole retenues | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après les parts des secteurs extrêmes | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Placement manuel des libellés seulement pour une version soignée. |

Vérifications avant publication concernant les faits utilisés :

- **`iris.ecart_voiture`** : relire les libellés des secteurs cités. Le texte les présente comme des secteurs statistiques ; il ne les assimile pas à des quartiers d’usage.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication, concernant aussi le scénario.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur — suffixe « 06 » — écartée | Secteurs — suffixe du libellé République Gare Porte de Paris : « 06 » | Inchangé : « 06 » appartient au libellé exact donné par `iris.voiture.min` et confirmé en section 3 pour l’IRIS 930660906. Ce n’est pas une part de voiture. |
| Valeur — suffixe « 05 » — écartée | Secteurs — suffixe du libellé Franc-Moisin Bel-Air : « 05 » | Inchangé : « 05 » appartient au libellé exact donné par `iris.voiture.max` et confirmé en section 3 pour l’IRIS 930660705. Ce n’est pas une part de voiture. |
| Raisonnement — « pourtant » — traitée | Cette proximité commune accompagne pourtant des pratiques domicile-travail différentes. | Cette proximité commune accompagne des pratiques domicile-travail différentes. Suppression de l’opposition suggérée par « pourtant » ; la phrase ne réserve pas cette proximité aux deux secteurs cités. |
| Lisibilité — déplacements modifiés par un déménagement — traitée | Le trajet professionnel ne couvre pas les déplacements qu’un déménagement peut modifier. | Le trajet professionnel n’est pas le seul déplacement qu’un déménagement peut modifier. |