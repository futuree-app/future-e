## A. Question et format

**Question principale :** à Valence, comment choisir un secteur pour utiliser moins la voiture, sans confondre proximité des services et pratiques domicile-travail ?

L’écart entre Gare et La Bayot donne un premier repère pour orienter les recherches (`iris.voiture.min`, `iris.voiture.max`). Le cas de Mozart apporte une distinction utile : des équipements proches peuvent coexister avec un usage majoritaire de la voiture pour travailler (`iris.263620802.voiture`, `iris.263620802.panier_500m`). Le lieu de travail reste une question distincte (`mobpro.voiture_selon_destination.meme_commune`).

**Format retenu : article court.** Les contrastes entre secteurs suffisent à une découverte utile, sans multiplier les comparaisons.

**Pistes écartées :** carburant, stationnement, possession automobile et comparaison nationale, qui disperseraient l’angle ; détail des destinations, laissé de côté pour privilégier la recherche dans Valence ; fréquences de bus, non utilisables.

## B. Article

# À Valence, quel secteur regarder pour utiliser moins la voiture ?

**En un an, entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole a augmenté de 0,72 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Valence. Pour qui cherche un logement, la question devient concrète : quelle place la voiture prendra-t-elle dans ses déplacements depuis l’adresse visée ?**

## Ce que la hausse coûte selon la distance

Le SP95-E10 a pris 0,51 € le litre sur la même période. Le tableau traduit ces hausses en surcoût annuel pour un trajet domicile-travail fait en voiture, selon sa longueur. Il repose sur trois hypothèses : une consommation de 6 litres aux 100 km, 200 allers-retours par an et une hausse arrondie à 5 centimes. Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ce surcoût dépend de la seule longueur du trajet, quelle que soit l’adresse. Ce qui change d’un logement à l’autre, c’est la place que la voiture prend dans les déplacements : les trajets domicile-travail recensés en 2022, avant cette hausse, la montrent très variable selon le secteur.

Un logement proche des commerces et de l’école répond à une partie du quotidien. Pour chercher à moins conduire à Valence, il faut aussi examiner les déplacements professionnels : leur place varie fortement selon le secteur de résidence.

## De Gare à La Bayot, des pratiques différentes

Les données du recensement de **2022** montrent un contraste net : la voiture est le mode principal pour aller travailler de **43 % des actifs résidant dans le secteur Gare**, contre **80 % à La Bayot**, quelle que soit leur commune de travail.

La carte permet de situer ce résultat parmi les autres secteurs de Valence.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Votre lieu de travail doit aussi entrer dans l’examen du logement. Parmi les actifs qui habitent et travaillent à Valence, **53 %** vont principalement travailler en voiture. Un emploi dans la commune laisse donc entière la question du trajet depuis l’adresse envisagée : pendant vos recherches, gardez votre destination professionnelle à côté des annonces que vous retenez.

## Courses et école : regarder ce qui est proche

Le trajet professionnel ne couvre pas tous les déplacements que vous cherchez peut-être à éviter. Pour les courses, la pharmacie ou l’école, les équipements proches du logement apportent un autre éclairage.

Le secteur Mozart illustre cette distinction. La voiture y est le mode principal de déplacement domicile-travail de **76 % des actifs résidents**. Pourtant, **toutes les adresses** du secteur ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de **500 m à vol d’oiseau**. À La Bayot, cette part est de **11 %**.

Pour une annonce à Mozart, la présence de ces équipements constitue donc une piste concrète à examiner, même si les pratiques professionnelles restent largement automobiles. Lors d’une visite, repérez ceux qui correspondent à vos besoins et parcourez les chemins qui les relient au logement. Une distance à vol d’oiseau ne décrit pas le parcours à pied.

À La Bayot, regardez séparément la localisation du commerce, de la pharmacie et de l’école utiles à votre ménage. La faible présence du panier complet ne signifie pas que chaque équipement est éloigné. Ce détail peut changer l’intérêt d’une adresse pour votre quotidien.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en laissant davantage la voiture au repos ? Avec futur•e, examinez l’adresse envisagée à partir de ce projet, pour voir ce qui peut peser dans votre choix de logement.

## Méthode et sources

Les pratiques proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Les parts par secteur concernent tous les actifs occupés qui y résident ; elles ne sont pas croisées avec leur commune de travail. Ces estimations par sondage décrivent des groupes distincts, sans mesurer l’effet d’un déménagement.

Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers. La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime **2025**. Chaque adresse compte autant dans les résultats par secteur ; la proximité ne renseigne pas sur l’usage des établissements.

Carburant : prix-carburants.gouv.fr, flux officiel. Prix médian entre les stations du dernier prix déclaré dans la semaine, dans un rayon de 12 km à vol d’oiseau autour du centre de Valence. Le tableau compte le seul carburant, sans achat, assurance, entretien ni stationnement.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Pratiques par secteur — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques par secteur — Gare | 43 % | `iris.voiture.min` | oui |
| Pratiques par secteur — La Bayot | 80 % | `iris.voiture.max` | oui |
| Lieu de travail — actifs habitant et travaillant à Valence | 53 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Courses et école — voiture à Mozart | 76 % | `iris.263620802.voiture` | oui |
| Courses et école — adresses équipées à Mozart | « toutes les adresses » : 100 % exact | `iris.263620802.panier_500m` | oui |
| Courses et école — distance du panier d’équipements | 500 m à vol d’oiseau | `iris.263620802.panier_500m`, `iris.263620801.panier_500m` | oui |
| Courses et école — adresses équipées à La Bayot | 11 % | `iris.263620801.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.263620802.panier_500m`, `iris.263620801.panier_500m` ; source explicitée par `acces.26362.panier_quotidien_500m` | oui |
| Chapeau | 0,72 € le litre | `carburant.gazole.ecart` | oui |
| Chapeau | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` (libellé du fait) | oui |
| Chapeau | semaine du 5 octobre 2026 | `carburant.gazole.prix` (libellé du fait) | oui |
| Chapeau | rayon de 12 km | `carburant.gazole.ecart` (périmètre) | oui |
| Hausse selon la distance | 0,51 € le litre | `carburant.e10.ecart` | oui |
| Hausse selon la distance | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Hausse selon la distance | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Hausse selon la distance | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |

## D. Visuels et vérifications restantes

**Visuel retenu :** « Carte de la part de la voiture par secteur (IRIS) ».

- **Emplacement :** après le contraste entre Gare et La Bayot.
- **État :** réalisable ; afficher le millésime 2022.
- **Étape manuelle indiquée :** aucune pour la production avec classes automatiques et repères numérotés ; pose manuelle des libellés seulement pour une version soignée.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Gare, La Bayot et Mozart. Le texte les désigne comme secteurs statistiques.
- `mobpro.voiture_selon_destination` : la section de vérification vise toute cette famille, mais son point de vigilance porte sur le choix du groupe de communes. Ce groupe n’est pas utilisé ici.

Aucun autre doute de lecture relevé.

- **Tableau du scénario de surcoût de carburant** : après le passage sur la hausse, au début de l’article ; aucune étape manuelle (tableau construit à partir du scénario du dossier).
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations ; mettre à jour les deux semaines citées. Obligatoire avant publication.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : recommandation de secteur tirée des pratiques des actifs résidents. | « Ce contraste donne une raison concrète de regarder le secteur lorsqu’on sélectionne des annonces. Si votre projet consiste à moins conduire, Gare mérite ainsi votre attention : la voiture y occupe une place moins importante dans les déplacements professionnels observés. » | Passage supprimé : ces données ne mesurent pas l’effet d’un déménagement. La description de l’écart et le renvoi à la carte sont conservés. |

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Ouverture | Chapeau sur la hausse datée du gazole, passage « Ce que la hausse coûte selon la distance » (SP95-E10, hypothèses, tableau, transition vers les pratiques locales) ; l’ancien chapeau devient un paragraphe ; source carburant en méthode | Entrée de la série mobilité (porteur, 15/10/2026) |
