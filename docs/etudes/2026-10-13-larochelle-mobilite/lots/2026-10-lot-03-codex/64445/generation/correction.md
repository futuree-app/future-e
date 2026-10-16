## A. Question et format

**Question principale :** à Pau, comment choisir un logement pour utiliser moins la voiture quand la proximité des équipements ne va pas toujours avec un moindre usage automobile pour travailler ?

Pau Centre 2 et Pau Est 2 associent une forte proximité des équipements à des pratiques domicile-travail différentes. Pour le lecteur, cela invite à examiner séparément les déplacements du quotidien et le trajet professionnel. L’angle s’appuie sur `iris.644450102.voiture`, `iris.644450302.voiture`, `iris.644450102.panier_500m`, `iris.644450302.panier_500m` et `mobpro.voiture_selon_destination.*`.

**Format retenu :** article court, avec une carte.

**Pistes écartées :** carburant, stationnement et statut d’occupation, qui disperseraient l’angle ; comparaison nationale, sans contraste utile ici.

## B. Article

# À Pau, chercher un logement en regardant aussi le trajet vers le travail

**Pour utiliser moins la voiture, la proximité des commerces et de l’école mérite attention. À Pau, les pratiques locales invitent aussi à examiner le trajet professionnel de chaque adresse envisagée.**

Selon le recensement de 2022, la voiture est le mode principal pour aller travailler de 48 % des actifs qui habitent Pau Centre 2, contre 81 % dans Pau Est 2, toutes communes de travail confondues. Ces contrastes donnent une raison de regarder précisément où se trouve chaque annonce.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Où travaillerez-vous depuis ce logement ?

Le lieu de travail complète cette lecture par secteur. Parmi les actifs qui habitent et travaillent à Pau, 59 % vont travailler principalement en voiture. Cette part atteint 82 % parmi les actifs résidant à Pau qui travaillent à Lons, Billère, Lescar, Jurançon, Gan ou Idron.

Pour chaque logement retenu, examinez donc la liaison avec votre lieu de travail et les horaires auxquels vous devrez l’emprunter. Une recherche centrée sur les équipements proches du logement laisse cette question ouverte.

## Courses et école : une proximité à examiner pour elle-même

Le travail n’est qu’une partie des déplacements à envisager avant de déménager. Pour les courses, la pharmacie ou l’école, les mêmes secteurs apportent un éclairage différent.

À Pau Centre 2, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau. À Pau Est 2, cette part atteint 92 % des adresses. La proximité de cet ensemble d’équipements se rencontre donc aussi dans un secteur où la voiture est largement utilisée pour travailler.

Pendant une visite, repérez les équipements que vous comptez fréquenter et examinez les cheminements pour les rejoindre. Cela permet de donner un sens concret à leur proximité pour votre propre quotidien.

## Vérifier le bus pour le trajet envisagé

Si vous envisagez de rejoindre votre travail en bus, consultez le [calculateur d’itinéraire d’Idelis](https://www.idelis.fr/se-deplacer-a-pau/itineraire/calculateur-ditineraire) pour vos horaires d’aller et de retour. Le réseau propose aussi une page consacrée aux [prochains passages en temps réel](https://www.idelis.fr/se-deplacer/vos-horaires/consulter-les-prochains-passages-de-votre-bus-en-temps-reel).

## Votre projet, votre adresse

Vous déménagez pour vous rapprocher du travail ou vous installer en famille ? Partez de ce que vous souhaitez changer dans votre quotidien, puis explorez avec futur•e l’adresse envisagée à partir de ce projet.

### Méthode et sources

Pratiques domicile-travail : INSEE, recensement, fichier MOBPRO et bases infracommunales IRIS. Les parts concernent les actifs occupés et leur mode principal. Ce sont des estimations par sondage ; les comparaisons entre groupes distincts ne mesurent pas l’effet d’un déménagement. Les noms cités désignent des secteurs statistiques de l’INSEE.

Proximité des équipements : Base adresse nationale et Base permanente des équipements de l’INSEE (2025). Chaque adresse compte également au sein du secteur ; la proximité ne mesure pas l’usage. Informations sur les outils Idelis : site officiel du réseau.

## C. Correspondance interne — non publiée

Les chiffres des libellés de secteurs sont également recensés ci-dessous.

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Ouverture — millésime des pratiques | 2022 | `iris.644450102.voiture`, `iris.644450302.voiture` | oui |
| Ouverture — premier secteur | Pau Centre 2 | `iris.644450102.voiture` | oui |
| Ouverture — voiture, premier secteur | 48 % | `iris.644450102.voiture` | oui |
| Ouverture — second secteur | Pau Est 2 | `iris.644450302.voiture` | oui |
| Ouverture — voiture, second secteur | 81 % | `iris.644450302.voiture` | oui |
| Lieu de travail — actifs habitant et travaillant à Pau | 59 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail — actifs résidant à Pau et travaillant dans le groupe nommé | 82 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Équipements — premier secteur | Pau Centre 2 | `iris.644450102.panier_500m` | oui |
| Équipements — couverture du premier secteur | « toutes les adresses » : 100 % exact | `iris.644450102.panier_500m` | oui |
| Équipements — distance du panier complet | 500 m | `iris.644450102.panier_500m`, `iris.644450302.panier_500m` | oui |
| Équipements — second secteur | Pau Est 2 | `iris.644450302.panier_500m` | oui |
| Équipements — couverture du second secteur | 92 % | `iris.644450302.panier_500m` | oui |
| Méthode — millésime des équipements | 2025 | `iris.644450102.panier_500m`, `iris.644450302.panier_500m` | oui |
| Vérification du bus — outils et liens | Aucun chiffre | `doc.verification.itineraire`, `doc.verification.temps_reel` | oui |

## D. Visuels et vérifications restantes

**Visuel retenu : Carte de la part de la voiture par secteur (IRIS).**

- **Emplacement :** après le paragraphe d’ouverture.
- **Présentation :** millésime 2022 ; repères sur Pau Centre 2 et Pau Est 2.
- **Étape manuelle indiquée :** aucune pour la production, avec classes automatiques et repères numérotés accompagnés de leur liste. Placement manuel des libellés uniquement pour une version soignée.

**Vérifications concernant les faits utilisés :**

- `iris.ecart_voiture` : relire les libellés des secteurs cités. Le texte les présente comme des secteurs statistiques, sans les assimiler aux quartiers d’usage.
- `mobpro.voiture_selon_destination` : relire l’intérêt du groupe de communes retenu. Sa composition exacte est donnée dans l’article ; cette vérification est non bloquante pour la rédaction.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Valeur — Ouverture, premier secteur — bloquante | « Pau Centre 2 » | Inchangé : anomalie écartée. Le dossier donne bien ce libellé pour l’IRIS 644450102 ; la part automobile est écrite séparément, avec la valeur autorisée de 48 %. |
| Valeur — Ouverture, second secteur — bloquante | « Pau Est 2 » | Inchangé : anomalie écartée. Le dossier donne bien ce libellé pour l’IRIS 644450302 ; la part automobile est écrite séparément, avec la valeur autorisée de 81 %. |
| Valeur — Équipements, premier secteur — bloquante | « Pau Centre 2 » | Inchangé : anomalie écartée. C’est le libellé du secteur, pas une valeur de couverture. « Toutes les adresses » correspond aux 100 % exacts du dossier. |
| Valeur — Équipements, second secteur — bloquante | « Pau Est 2 » | Inchangé : anomalie écartée. C’est le libellé du secteur ; la couverture est écrite séparément, avec la valeur autorisée de 92 %. |
| Raisonnement — a_revoir | « Ces contrastes donnent une raison de regarder précisément où se trouve chaque annonce. » | Inchangé : anomalie écartée. La phrase invite à examiner la localisation d’une annonce ; elle n’attribue pas les pratiques au secteur et ne promet aucun résultat pour une adresse. |
| Méthode — sélection des six communes — a_revoir | « Cette part atteint 82 % parmi les actifs résidant à Pau qui travaillent à Lons, Billère, Lescar, Jurançon, Gan ou Idron. » | Inchangé : la liste exacte exigée par le dossier figure déjà dans l’article. L’explication complète de la sélection dépasserait l’ajout de quelques mots autorisé pour une anomalie `a_revoir`. |
| Méthode — millésime BPE — a_revoir | « Base permanente des équipements de l’INSEE » | « Base permanente des équipements de l’INSEE (2025) ». Millésime ajouté à la correspondance C. |