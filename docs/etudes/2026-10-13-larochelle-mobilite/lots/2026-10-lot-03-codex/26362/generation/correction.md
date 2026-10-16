## A. Question et format

**Question principale :** à Valence, comment choisir un secteur pour utiliser moins la voiture, sans confondre proximité des services et pratiques domicile-travail ?

L’écart entre Gare et La Bayot donne un premier repère pour orienter les recherches (`iris.voiture.min`, `iris.voiture.max`). Le cas de Mozart apporte une distinction utile : des équipements proches peuvent coexister avec un usage majoritaire de la voiture pour travailler (`iris.263620802.voiture`, `iris.263620802.panier_500m`). Le lieu de travail reste une question distincte (`mobpro.voiture_selon_destination.meme_commune`).

**Format retenu : article court.** Les contrastes entre secteurs suffisent à une découverte utile, sans multiplier les comparaisons.

**Pistes écartées :** carburant, stationnement, possession automobile et comparaison nationale, qui disperseraient l’angle ; détail des destinations, laissé de côté pour privilégier la recherche dans Valence ; fréquences de bus, non utilisables.

## B. Article

# À Valence, quel secteur regarder pour utiliser moins la voiture ?

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

## D. Visuels et vérifications restantes

**Visuel retenu :** « Carte de la part de la voiture par secteur (IRIS) ».

- **Emplacement :** après le contraste entre Gare et La Bayot.
- **État :** réalisable ; afficher le millésime 2022.
- **Étape manuelle indiquée :** aucune pour la production avec classes automatiques et repères numérotés ; pose manuelle des libellés seulement pour une version soignée.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Gare, La Bayot et Mozart. Le texte les désigne comme secteurs statistiques.
- `mobpro.voiture_selon_destination` : la section de vérification vise toute cette famille, mais son point de vigilance porte sur le choix du groupe de communes. Ce groupe n’est pas utilisé ici.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : recommandation de secteur tirée des pratiques des actifs résidents. | « Ce contraste donne une raison concrète de regarder le secteur lorsqu’on sélectionne des annonces. Si votre projet consiste à moins conduire, Gare mérite ainsi votre attention : la voiture y occupe une place moins importante dans les déplacements professionnels observés. » | Passage supprimé : ces données ne mesurent pas l’effet d’un déménagement. La description de l’écart et le renvoi à la carte sont conservés. |