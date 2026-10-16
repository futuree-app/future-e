## A. Question et format

**Question principale :** à Nîmes, un secteur réunissant les équipements du quotidien est-il aussi un secteur où les actifs utilisent peu la voiture ?

Arènes et Super Nîmes présentent des pratiques domicile-travail très différentes, alors que toutes leurs adresses réunissent le panier de proximité mesuré. Pour une recherche de logement, ce contraste invite à examiner séparément le trajet de travail et les déplacements du quotidien.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.301890101.panier_500m`, `iris.301890901.panier_500m`, `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`. Les informations `doc.reseau.site` et `doc.verification.guides_horaires` soutiennent la vérification proposée au lecteur.

**Format :** article court, centré sur ce contraste.

**Pistes écartées :** carburant, comparaison nationale, stationnement et communes extérieures : ils élargiraient le propos sans éclairer davantage la distinction retenue.

## B. Article

# À Nîmes, des équipements proches ne disent pas tout de la place de la voiture

**En un an, entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,76 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Nîmes. Pour qui cherche un logement, la question devient concrète : quelle place la voiture prendra-t-elle dans ses déplacements depuis l’adresse visée ?**

## Ce que la hausse coûte selon la distance

Le SP95-E10 a pris 0,54 € le litre sur la même période. Le tableau traduit ces hausses en surcoût annuel pour un trajet domicile-travail fait en voiture, selon sa longueur. Il repose sur trois hypothèses : une consommation de 6 litres aux 100 km, 200 allers-retours par an et une hausse arrondie à 5 centimes. Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Avec ces hypothèses, le surcoût augmente avec la distance parcourue. Ce qui change d’un logement à l’autre, c’est la place que la voiture prend dans les déplacements : les trajets domicile-travail recensés en 2022, avant cette hausse, la montrent très variable selon le secteur.

Pour chercher un logement en espérant moins conduire, la proximité des commerces et de l’école mérite attention. À Nîmes, elle se rencontre pourtant dans des secteurs où les pratiques de déplacement vers le travail sont très différentes.

## Des pratiques contrastées selon le secteur

Au recensement de 2022, la voiture est le mode principal pour aller travailler de 32 % des actifs occupés qui habitent le secteur Arènes, contre 95 % dans le secteur Super Nîmes. Ces parts concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

Pour lire une annonce, ces contrastes donnent une raison de regarder précisément où se trouve le logement. Ils invitent aussi à examiner le trajet professionnel que vous auriez depuis cette adresse, plutôt qu’à vous fier au seul nom de la commune.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail apporte un autre éclairage : 77 % des actifs occupés résidant à Nîmes travaillent dans la commune même. Parmi les actifs qui habitent et travaillent à Nîmes, 60 % utilisent principalement la voiture pour ce déplacement. Une recherche limitée à la commune où l’on travaille laisse donc encore ouverte la question du trajet entre le logement et l’emploi.

## Courses et école : une proximité à examiner pour elle-même

Le trajet professionnel ne couvre pas les autres déplacements à prévoir depuis un logement. Pour les courses ou l’école, les secteurs Arènes et Super Nîmes présentent une proximité commune : dans chacun, 100 % des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

Ce résultat donne une piste concrète pour examiner des annonces dans ces secteurs. Il ne départage pourtant pas leurs pratiques domicile-travail, très contrastées. Réunir ces équipements près d’un logement et utiliser peu la voiture pour travailler sont des observations différentes.

Lors d’une visite, repérez les accès réels aux équipements qui vous intéressent et le chemin que vous emprunteriez. La distance mesurée à vol d’oiseau ne décrit pas ce parcours, et l’école repérée n’est pas nécessairement celle que fréquenterait votre enfant.

## Confronter l’adresse à votre organisation

Si vous envisagez le bus pour rejoindre votre travail, consultez les guides par ligne depuis le [site du réseau Tango](https://www.tangobus.fr). Vérifiez les horaires dans votre sens de déplacement et pour les jours où vous travaillez : c’est ce trajet précis qu’il faut examiner avant de retenir une annonce.

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou pour organiser autrement la vie de famille ? Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour examiner la place qu’elle pourrait prendre dans votre quotidien.

### Méthode et sources

Les pratiques domicile-travail proviennent du recensement de l’INSEE, millésime 2022, fichier Mobilités professionnelles et bases infracommunales. Elles portent sur les actifs occupés ; les dénominateurs incluent ceux qui travaillent à domicile. Les résultats par secteur sont des estimations par sondage : les petits écarts ne doivent pas être surinterprétés.

Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers usuels. Les données présentées ne croisent pas secteur de résidence et commune de travail.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Dans les résultats par secteur cités ici, chaque adresse compte autant ; ces parts ne représentent ni des ménages ni des habitants.

Carburant : prix-carburants.gouv.fr, flux officiel. Prix médian entre les stations du dernier prix déclaré dans la semaine, dans un rayon de 12 km à vol d’oiseau autour du centre de Nîmes. Le tableau compte le seul carburant, sans achat, assurance, entretien ni stationnement.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Pratiques — millésime du recensement | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui — millésime |
| Pratiques — voiture, secteur Arènes | 32 % | `iris.voiture.min` | oui |
| Pratiques — voiture, secteur Super Nîmes | 95 % | `iris.voiture.max` | oui |
| Pratiques — actifs résidents travaillant à Nîmes | 77 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Nîmes | 60 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Courses et école — adresses réunissant le panier dans chacun des secteurs cités | 100 % | `iris.301890101.panier_500m`, `iris.301890901.panier_500m` | oui |
| Courses et école — distance de chaque équipement du panier | 500 m | `iris.301890101.panier_500m`, `iris.301890901.panier_500m` | oui — seuil à vol d’oiseau |
| Méthode — millésime des pratiques | 2022 | `iris.voiture.min`, `iris.voiture.max`, `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui — millésime |
| Méthode — millésime des équipements | 2025 | `acces.30189.panier_quotidien_500m` | oui — millésime de la source BPE |
| Chapeau | 0,76 € le litre | `carburant.gazole.ecart` | oui |
| Chapeau | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` (libellé du fait) | oui |
| Chapeau | semaine du 5 octobre 2026 | `carburant.gazole.prix` (libellé du fait) | oui |
| Chapeau | rayon de 12 km | `carburant.gazole.ecart` (périmètre) | oui |
| Hausse selon la distance | 0,54 € le litre | `carburant.e10.ecart` | oui |
| Hausse selon la distance | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Hausse selon la distance | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Hausse selon la distance | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |

## D. Visuels et vérifications restantes

**Visuel retenu : Carte de la part de la voiture par secteur (IRIS)**

- **Emplacement :** après le passage comparant les pratiques des actifs résidant dans Arènes et Super Nîmes.
- **État :** à produire.
- **Étape manuelle indiquée par le dossier :** aucune nécessaire à la production avec les classes automatiques et les repères numérotés accompagnés de leur liste ; pose manuelle des libellés seulement pour une version soignée.
- **Millésime à afficher :** 2022.

**Vérification concernant les faits utilisés :** relire les libellés d’IRIS Arènes et Super Nîmes. Le texte les désigne comme des secteurs statistiques, sans les assimiler à des quartiers d’usage. Cette relecture est non bloquante pour la rédaction.

Aucun autre doute de lecture identifié.

- **Tableau du scénario de surcoût de carburant** : après le passage sur la hausse, au début de l’article ; aucune étape manuelle (tableau construit à partir du scénario du dossier).
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations ; mettre à jour les deux semaines citées. Obligatoire avant publication.

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Méthode | « Le dossier ne croise pas… » → « Les données présentées ne croisent pas… » | Vocabulaire de production |
| Ouverture | Chapeau sur la hausse datée du gazole, passage « Ce que la hausse coûte selon la distance » (SP95-E10, hypothèses, tableau, transition vers les pratiques locales) ; l’ancien chapeau devient un paragraphe ; source carburant en méthode | Entrée de la série mobilité (porteur, 15/10/2026) |
