## A. Question et format

**Question principale :** que regarder dans une adresse à Quimper pour envisager de moins utiliser la voiture, même lorsque l’on travaille dans la commune ?

Le dossier montre que travailler à Quimper s’accompagne encore majoritairement d’un usage de la voiture. Les écarts entre secteurs et la proximité des équipements offrent des repères complémentaires pour orienter les recherches et préparer les visites, sans prédire les déplacements du lecteur.

Appuis : `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min`, `iris.voiture.max`, `iris.292320101.panier_500m`, `iris.292320120.panier_500m`, `iris.292320120.voiture`, `doc.tarification.gratuite_qub_city`, `doc.reseau.site`.

**Format retenu : article court.** Carburant, comparaison nationale, stationnement et statut d’occupation sont écartés pour concentrer le texte sur le choix de l’adresse.

## B. Article

# À Quimper, quelle adresse chercher pour moins prendre la voiture ?

Travailler à Quimper et y chercher un logement laisse encore une question ouverte : depuis quelle adresse organiser son quotidien ? Les écarts entre secteurs donnent des pistes, à confronter aux déplacements que vous souhaitez changer.

## Travailler dans la commune laisse la question ouverte

Dans le recensement de 2022, 69 % des actifs qui habitent Quimper y travaillent également. Parmi les actifs qui résident et travaillent dans la commune, 71 % déclarent la voiture comme mode principal pour aller travailler. Si vous cherchez à rapprocher votre logement de votre emploi, le nom de la commune ne suffit donc pas à choisir une adresse.

Les pratiques diffèrent fortement selon le secteur de résidence. Parmi les actifs qui habitent chaque secteur, quelle que soit leur commune de travail, la voiture est le mode principal pour 55 % à Quimper Centre et 93 % à Nord Kerfeunteun-Penhars.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte permet de situer les pratiques autour des annonces qui vous intéressent. Lors d’une visite, confrontez ce repère au déplacement que vous aurez personnellement à faire entre le logement et votre travail.

## Courses et école : regarder aussi les équipements

Le trajet professionnel ne couvre qu’une partie du quotidien. Pour choisir une adresse, il faut aussi examiner la proximité des lieux utiles à votre foyer.

À Quimper Centre, 90 % des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Kermoisan, toutes les adresses remplissent ce critère, tandis que 82 % des actifs du secteur vont principalement travailler en voiture. La présence de ces équipements et les pratiques domicile-travail éclairent donc des questions différentes.

Pour préparer une visite, repérez les équipements qui correspondent à vos besoins, puis parcourez les cheminements depuis le logement. La distance à vol d’oiseau ne décrit pas le parcours à pied ; la proximité d’une école ne dit pas non plus si vos enfants la fréquenteront.

## Dans le centre-ville, une option à examiner

Si votre recherche porte sur le centre-ville, QUB city, la navette électrique, figure parmi les services gratuits de Qub. Avant de l’intégrer à votre organisation, vérifiez votre trajet et vos horaires sur [le site officiel du réseau](https://www.qub.bzh).

## Votre projet, votre adresse

Se rapprocher du travail ou s’installer en famille ne conduit pas à examiner une adresse de la même façon. Avec futur•e, explorez l’adresse envisagée à partir de votre projet, pour replacer la mobilité dans l’ensemble de votre choix.

### Méthode et sources

Pratiques domicile-travail : INSEE, fichier MOBPRO et base infracommunale Activité des résidents. Ces résultats sont des estimations par sondage ; les données par secteur et par commune de travail ne sont pas croisées. Les secteurs sont les IRIS de l’INSEE, dont les libellés peuvent différer des noms de quartiers d’usage.

Équipements : Base adresse nationale et INSEE, BPE 2025. Les parts retenues portent sur les adresses de chaque secteur, chaque adresse comptant pareil. Informations Qub : page officielle des tarifs et site du réseau.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Pratiques — millésime | 2022 | `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques — actifs résidents travaillant à Quimper | 69 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques — voiture parmi les actifs résidant et travaillant à Quimper | 71 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Secteurs — voiture à Quimper Centre | 55 % | `iris.voiture.min` | oui |
| Secteurs — voiture à Nord Kerfeunteun-Penhars | 93 % | `iris.voiture.max` | oui |
| Équipements — adresses de Quimper Centre réunissant le panier | 90 % | `iris.292320101.panier_500m` | oui |
| Équipements — seuil de proximité du panier, repris par « ce critère » pour Kermoisan | 500 m | `iris.292320101.panier_500m`, `iris.292320120.panier_500m` | oui |
| Équipements — adresses de Kermoisan réunissant le panier | « toutes les adresses » : 100 % exact | `iris.292320120.panier_500m` | oui |
| Équipements — voiture parmi les actifs de Kermoisan | 82 % | `iris.292320120.voiture` | oui |
| Méthode — millésime des équipements | 2025 | `iris.292320101.panier_500m`, `iris.292320120.panier_500m` — source BPE indiquée dans le dossier | oui |

## D. Visuels et vérifications restantes

**Visuel retenu : Carte de la part de la voiture par secteur (IRIS).**

- **Emplacement :** après la comparaison entre Quimper Centre et Nord Kerfeunteun-Penhars.
- **Étape manuelle :** aucune pour la production ; classes automatiques et secteurs cités repérés par des numéros avec leur liste. Les libellés ne sont à poser manuellement que pour une version soignée.
- **Millésime à faire figurer :** 2022.

**Vérifications concernant les faits utilisés :**

- `mobpro.voiture_selon_destination` : relire l’intérêt du choix du groupe Ergué-Gabéric et Pluguffan, conformément à la vérification attachée à cette famille. L’article ne retient toutefois que les actifs résidant et travaillant à Quimper.
- `iris.ecart_voiture` : relire les libellés Quimper Centre, Nord Kerfeunteun-Penhars et Kermoisan. Ils sont employés comme noms de secteurs statistiques, sans les assimiler à des quartiers d’usage.

Aucun autre doute de lecture relevé.