## A. Question et format

**Question principale :** quand on travaille à Amiens, que regarder dans le choix d’un logement pour utiliser moins la voiture ?

Le dossier montre que travailler dans la commune ne suffit pas à caractériser les déplacements : les pratiques diffèrent fortement entre secteurs, tandis que la proximité des équipements renseigne une autre partie du quotidien. Pour chercher un logement, ces observations invitent à examiner séparément le trajet professionnel et les destinations autour de l’adresse.

**Appuis :** `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.800212203.voiture`, `iris.800210401.voiture`, `iris.800212203.tc`, `iris.800211301.panier_500m`, `iris.800210401.panier_500m`.

**Format :** article court, avec une carte.

**Pistes écartées :** carburant, comparaison nationale, stationnement et communes de travail extérieures, qui disperseraient cet angle centré sur l’adresse.

## B. Article

# À Amiens, quelle adresse choisir pour utiliser moins la voiture ?

Au recensement de 2022, 75 % des actifs occupés résidant à Amiens travaillent dans la commune. Si vous y cherchez un logement pour moins prendre la voiture, examinez le trajet vers votre travail, puis les destinations de votre quotidien autour de l’adresse.

### Des pratiques différentes selon le travail et le secteur de résidence

Parmi les actifs qui habitent et travaillent à Amiens, 52 % déclarent la voiture comme mode principal pour aller travailler. Avoir son logement et son emploi dans la même commune laisse donc entière la question du déplacement entre les deux.

Les pratiques varient selon le secteur de résidence. La voiture est le mode principal de 32 % des actifs qui habitent Amiens Nord 3, contre 72 % à Renancourt. Ces parts concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte apporte un repère pour situer les annonces. Pour examiner un logement, partez ensuite de votre destination professionnelle précise : le nom du secteur et les pratiques de ses actifs ne décrivent pas votre propre parcours.

### Les courses et l’école demandent une autre lecture

Le trajet professionnel ne couvre qu’une partie des déplacements à envisager avant de déménager. Pour les courses, la pharmacie ou l’école, on peut regarder la présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau.

Dans le secteur Centre Ville 1, toutes les adresses réunissent cette proximité. À Renancourt, c’est le cas de 8 % des adresses.

Pour une annonce à Renancourt, repérez séparément les équipements qui vous concernent : le commerce, la pharmacie et, si votre projet le demande, l’école. Dans le secteur central cité, examinez les parcours réels depuis le logement jusqu’aux destinations envisagées. La proximité mesurée donne un point de départ à cette lecture de l’adresse.

### Quelles possibilités examiner pour votre trajet professionnel ?

À Amiens Nord 3, les transports en commun sont le mode principal de 43 % des actifs résidents pour aller travailler. Si vous envisagez ce secteur, leur usage mérite une vérification concrète pour votre destination et vos horaires : cherchez les lignes et les horaires correspondant au déplacement que vous auriez à faire.

Lors de vos recherches, gardez ainsi le trajet professionnel et les déplacements autour du logement comme deux questions à examiner pour chaque annonce.

### Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille, avec l’envie de moins prendre la voiture. Avec futur•e, explorez l’adresse envisagée à partir de ce projet et de ce qui compte pour votre vie sur place.

### Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE, fichier MOBPRO et bases infracommunales du recensement. Ce sont des estimations par sondage ; les comparaisons décrivent des groupes distincts et ne mesurent pas l’effet d’un déménagement. Les secteurs sont des IRIS statistiques, dont les libellés ne correspondent pas toujours aux noms de quartiers d’usage.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Les parts citées concernent les adresses de chaque secteur, chacune comptant de la même manière. Les distances à vol d’oiseau ne décrivent pas les parcours réels ni l’usage des équipements.

## C. Correspondance interne — non publiée

Les numéros inclus dans les libellés de secteurs sont également recensés ci-dessous.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — millésime des pratiques | 2022 | `mobpro.travaille_dans_commune` — millésime | oui |
| Chapeau — actifs résidents travaillant à Amiens | 75 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs habitant et travaillant à Amiens | 52 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — voiture à Amiens Nord | 32 % | `iris.800212203.voiture` | oui |
| Pratiques — libellé Amiens Nord 3 | 3, dans le libellé | `iris.800212203.voiture` | oui |
| Pratiques — voiture à Renancourt | 72 % | `iris.800210401.voiture` | oui |
| Équipements — rayon du panier de proximité | 500 m | `iris.800211301.panier_500m`, `iris.800210401.panier_500m` | oui |
| Équipements — libellé Centre Ville 1 | 1, dans le libellé | `iris.800211301.panier_500m` | oui |
| Équipements — adresses réunissant le panier dans Centre Ville 1 | « toutes les adresses » : 100 % exact | `iris.800211301.panier_500m` | oui |
| Équipements — adresses réunissant le panier à Renancourt | 8 % | `iris.800210401.panier_500m` | oui |
| Vérifications du lecteur — libellé Amiens Nord 3 | 3, dans le libellé | `iris.800212203.tc` | oui |
| Vérifications du lecteur — transports en commun des actifs résidents | 43 % | `iris.800212203.tc` | oui |
| Méthode — millésime de la BPE | 2025 | `iris.800211301.panier_500m`, `iris.800210401.panier_500m` — source des équipements précisée dans le dossier | oui |

## D. Visuels et vérifications restantes

**Visuel retenu : Carte de la part de la voiture par secteur (IRIS).**

- **Emplacement :** après la comparaison des pratiques entre Amiens Nord 3 et Renancourt.
- **Étape manuelle indiquée :** aucune pour la production ; classes automatiques et secteurs cités repérés par des numéros accompagnés de leur liste. Libellés à poser à la main uniquement pour une version soignée.
- **Présentation :** faire figurer le millésime des pratiques sur la carte.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés Amiens Nord 3, Renancourt et Centre Ville 1 avant publication. Le texte les désigne comme secteurs statistiques, sans les assimiler à des quartiers d’usage.
- `mobpro.voiture_selon_destination` : relire l’intérêt du choix des communes du groupe extérieur, conformément à la vérification familiale signalée dans le dossier. Le texte n’utilise toutefois que le groupe des actifs habitant et travaillant à Amiens ; aucune valeur du groupe extérieur n’est reprise.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur — Pratiques, libellé Amiens Nord 3 — écartée | « 3, dans le libellé » | Inchangé : le 3 appartient au libellé « Amiens Nord 3 », présent dans le dossier, et ne désigne pas la part de voiture. Celle-ci est correctement écrite à 32 %. |
| Valeur — Équipements, libellé Centre Ville 1 — écartée | « 1, dans le libellé » | Inchangé : le 1 appartient au libellé « Centre Ville 1 », présent dans le dossier. La part d’adresses est correctement rendue par « toutes les adresses ». |
| Valeur — Vérifications du lecteur, libellé Amiens Nord 3 — écartée | « 3, dans le libellé » | Inchangé : le 3 appartient au libellé « Amiens Nord 3 », présent dans le dossier, et ne désigne pas la part des transports en commun. Celle-ci est correctement écrite à 43 %. |
| Croisement — à revoir | « Travailler à Amiens, avec des pratiques différentes selon les secteurs » ; « Les pratiques varient aussi selon le secteur de résidence. » | « Des pratiques différentes selon le travail et le secteur de résidence » ; « Les pratiques varient selon le secteur de résidence. » |
| Consigne interne — à revoir | « le dossier permet de regarder la présence simultanée » | « on peut regarder la présence simultanée » |