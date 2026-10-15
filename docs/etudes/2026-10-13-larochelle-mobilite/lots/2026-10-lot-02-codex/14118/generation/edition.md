## A. Question et format

**Question principale :** à Caen, que regarder dans une recherche de logement pour moins conduire, selon que l’on vise les déplacements professionnels ou les courses et l’école ?

Le Bas Vaucelles et Les Coutures présentent des profils contrastés : la moindre utilisation de la voiture pour travailler ne va pas ici avec la plus forte proximité du panier d’équipements. Cette observation aide le lecteur à examiner séparément les trajets qu’il souhaite changer.

Appuis : `iris.141180301.voiture`, `iris.141180802.voiture`, `iris.141180301.panier_500m`, `iris.141180802.panier_500m`.

**Format : article court**, avec une carte.

Pistes écartées : carburant, destinations professionnelles, possession automobile et comparaison nationale, qui disperseraient cet angle centré sur le choix d’une adresse.

## B. Article

# À Caen, choisir son adresse selon les trajets que l’on veut changer

**En un an, entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,76 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Caen. Pour qui cherche un logement, la question devient concrète : quelle place la voiture prendra-t-elle dans ses déplacements depuis l’adresse visée ?**

### Ce que la hausse coûte selon la distance

Le SP95-E10 a pris 0,50 € le litre sur la même période. Le tableau traduit ces hausses en surcoût annuel pour un trajet domicile-travail fait en voiture, selon sa longueur. Il repose sur trois hypothèses : une consommation de 6 litres aux 100 km, 200 allers-retours par an et une hausse arrondie à 5 centimes. Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ce surcoût dépend de la seule longueur du trajet, quelle que soit l’adresse. Ce qui change d’un logement à l’autre, c’est la place que la voiture prend dans les déplacements : les trajets domicile-travail recensés en 2022, avant cette hausse, la montrent très variable selon le secteur.

Chercher à moins conduire pour aller travailler et vouloir des courses proches du logement demandent des vérifications différentes. Les secteurs du Bas Vaucelles et des Coutures montrent pourquoi ces questions méritent d’accompagner la recherche.

### Pour le travail, des pratiques différentes selon les secteurs

Au recensement de 2022, la voiture est le mode principal pour aller travailler de **42 % des actifs occupés qui habitent le secteur du Bas Vaucelles**, contre **72 % dans celui des Coutures**. Ces parts concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

Ce contraste décrit les pratiques des actifs qui habitent chaque secteur. Sur chaque annonce retenue, examinez le lien entre le logement et votre propre lieu de travail : destination, horaires à respecter et mode de déplacement envisagé.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

### Pour les courses et l’école, regarder autour du logement

Si votre projet consiste aussi à laisser la voiture au garage pour les courses ou l’accompagnement à l’école, la proximité des équipements apporte un autre éclairage.

Dans le secteur du Bas Vaucelles, **35 % des adresses** ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. Dans le secteur des Coutures, cette part atteint **95 %**.

Les Coutures associent ainsi une forte proximité de ces équipements à une utilisation plus fréquente de la voiture pour travailler. Le Bas Vaucelles présente le profil inverse sur ces indicateurs. Le trajet professionnel et les équipements de proximité se regardent donc séparément.

### En visite, partir des trajets qui vous concernent

Pour chaque logement envisagé, examinez séparément le trajet jusqu’à votre travail et les équipements autour de l’adresse.

Pendant la visite, examinez les cheminements vers les lieux que vous utiliseriez : passages piétons, traversées et accès aux établissements. Pour un projet familial, vérifiez également l’école dont dépend l’adresse auprès de la collectivité.

### Votre projet, votre adresse

Se rapprocher du travail ou s’installer en famille conduit à regarder des trajets différents. Avec futur•e, explorez l’adresse que vous envisagez à partir de votre projet, pour la considérer dans son ensemble.

### Méthode et sources

Les pratiques proviennent des bases infracommunales de l’INSEE, Activité des résidents. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les IRIS sont des secteurs statistiques dont les noms peuvent différer des quartiers d’usage.

La proximité repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime **2025**. Chaque adresse compte de la même façon dans son secteur. Les distances à vol d’oiseau décrivent une proximité, sans établir le cheminement réel ni l’usage des équipements.

Carburant : prix-carburants.gouv.fr, flux officiel. Prix médian entre les stations du dernier prix déclaré dans la semaine, dans un rayon de 12 km à vol d’oiseau autour du centre de Caen. Le tableau compte le seul carburant, sans achat, assurance, entretien ni stationnement.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Pratiques — millésime du recensement | 2022 | `iris.141180301.voiture`, `iris.141180802.voiture` | oui |
| Pratiques — voiture au Bas Vaucelles | 42 % | `iris.141180301.voiture` | oui |
| Pratiques — voiture aux Coutures | 72 % | `iris.141180802.voiture` | oui |
| Équipements — adresses du Bas Vaucelles | 35 % | `iris.141180301.panier_500m` | oui |
| Équipements — seuil à vol d’oiseau | 500 m | `iris.141180301.panier_500m`, `iris.141180802.panier_500m` | oui |
| Équipements — adresses des Coutures | 95 % | `iris.141180802.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.141180301.panier_500m`, `iris.141180802.panier_500m` | oui |
| Chapeau | 0,76 € le litre | `carburant.gazole.ecart` | oui |
| Chapeau | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` (libellé du fait) | oui |
| Chapeau | semaine du 5 octobre 2026 | `carburant.gazole.prix` (libellé du fait) | oui |
| Chapeau | rayon de 12 km | `carburant.gazole.ecart` (périmètre) | oui |
| Hausse selon la distance | 0,50 € le litre | `carburant.e10.ecart` | oui |
| Hausse selon la distance | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Hausse selon la distance | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Hausse selon la distance | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |

## D. Visuels et vérifications restantes

**Visuel retenu :** « Carte de la part de la voiture par secteur (IRIS) ».

- **Emplacement :** après le passage sur les pratiques domicile-travail.
- **Production :** classes automatiques et repérage des secteurs cités par des numéros accompagnés de leur liste ; aucune étape manuelle nécessaire à la production selon le dossier. Les libellés posés à la main sont réservés à une version soignée. Faire figurer le millésime des pratiques sur la carte.

**Vérification concernant les faits utilisés :** relire les libellés « Le Bas Vaucelles » et « Les Coutures » (`iris.ecart_voiture`). Le texte les désigne comme des secteurs statistiques. Vérification non bloquante pour la rédaction ; aucun autre doute de lecture relevé.

- **Tableau du scénario de surcoût de carburant** : après le passage sur la hausse, au début de l’article ; aucune étape manuelle (tableau construit à partir du scénario du dossier).
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations ; mettre à jour les deux semaines citées. Obligatoire avant publication.

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Pour le travail | « Pour orienter une recherche, ce contraste donne un repère… » → « Ce contraste décrit les pratiques des actifs qui habitent chaque secteur. » | Les pratiques des habitants ne servent pas à orienter le choix d’un secteur |
| Pour les courses | « Votre recherche peut donc s’orienter différemment… » → « Le trajet professionnel et les équipements de proximité se regardent donc séparément. » | Idem ; le contraste local est conservé |
| En visite | Conseils par secteur (Bas Vaucelles, Coutures) → « Pour chaque logement envisagé, examinez séparément le trajet jusqu’à votre travail et les équipements autour de l’adresse. » | Idem |
| Ouverture | Chapeau sur la hausse datée du gazole, passage « Ce que la hausse coûte selon la distance » (SP95-E10, hypothèses, tableau, transition vers les pratiques locales) ; l’ancien chapeau devient un paragraphe ; source carburant en méthode | Entrée de la série mobilité (porteur, 15/10/2026) |
