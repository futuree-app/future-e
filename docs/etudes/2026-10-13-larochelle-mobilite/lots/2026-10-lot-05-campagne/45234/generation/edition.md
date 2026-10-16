## A. Question et format

**Question principale :** à Orléans, quels secteurs examiner pour utiliser moins la voiture, et que faut-il encore vérifier selon son lieu de travail et ses déplacements quotidiens ?

L’écart entre Bourgogne-Châtelet et Sud-Ouest-Chabassières donne un repère pour orienter une recherche de logement. La proximité des équipements affine cette lecture, mais le cas de Beauchamps montre qu’elle ne suffit pas à décrire les pratiques domicile-travail. Le lieu de travail apporte un autre éclairage, distinct des observations par secteur.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `iris.452340103.panier_500m`, `iris.452341702.panier_500m`, `iris.452341901.voiture`, `iris.452341901.panier_500m`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`.

**Format retenu :** article complet resserré, avec deux visuels.

**Pistes écartées :** stationnement, statut d’occupation, possession automobile, actifs venant travailler à Orléans et comparaison nationale : elles disperseraient cette lecture centrée sur le choix d’une adresse.

## B. Article

# À Orléans, où chercher un logement pour utiliser moins la voiture ?

Entre les semaines du 6 octobre 2025 et du 5 octobre 2026, le prix médian du gazole augmente de 0,72 €/L, et celui du SP95-E10 de 0,47 €/L, dans les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre d’Orléans. Pour une recherche de logement, cette hausse invite à regarder les déplacements que chaque adresse laisserait à organiser.

## Le surcoût du carburant selon la distance

Le scénario ci-dessous retient une consommation de 6 L/100 km et 200 allers-retours domicile-travail par an. Les hausses utilisées, arrondies à 5 centimes, sont de 0,70 €/L pour le gazole et de 0,45 €/L pour le SP95-E10. Il s’agit du surcoût annuel de carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ces distances ne correspondent à aucun secteur en particulier. Pour orienter la recherche dans Orléans, les pratiques locales donnent un autre repère : quelle place la voiture occupe-t-elle selon le secteur de résidence et le lieu de travail ?

## Des pratiques très différentes selon le secteur

Au recensement de 2022, la voiture est le mode principal pour aller travailler de 28 % des actifs résidant à Bourgogne-Châtelet, contre 80 % à Sud-Ouest-Chabassières. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Pour choisir les annonces à examiner, ces résultats donnent une raison de regarder les secteurs séparément.

Mais une annonce dans un secteur où la voiture est moins utilisée ne répond pas, à elle seule, à la question du trajet professionnel. Il faut aussi regarder où l’on travaille.

Parmi les actifs qui habitent et travaillent à Orléans, 42 % utilisent principalement la voiture pour aller travailler. Cette part est de 68 % parmi les actifs résidant à Orléans qui travaillent à Olivet, Saint-Jean-de-Braye, Fleury-les-Aubrais, Saran, Saint-Jean-de-la-Ruelle ou La Chapelle-Saint-Mesmin.

Lors d’une recherche, gardez donc votre destination professionnelle à côté des annonces retenues. Pour examiner une possibilité en transports collectifs, consultez le réseau TAO, organisé par Orléans Métropole, et vérifiez la desserte correspondant à vos jours et horaires de travail.

## Les courses et l’école appellent une autre lecture

Le trajet professionnel ne couvre qu’une partie des déplacements à organiser depuis le futur logement. Pour les courses, la pharmacie ou l’école, la proximité des équipements apporte un repère complémentaire.

Le « panier quotidien » désigne ici la présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau d’une adresse.

À Bourgogne-Châtelet, toutes les adresses disposent de ce panier. À Sud-Ouest-Chabassières, aucune ne réunit cette combinaison : cela ne signifie pas que tout équipement y est absent. Pour une annonce dans ce secteur, repérez séparément les établissements qui vous seraient utiles.

Beauchamps apporte un éclairage différent : toutes ses adresses ont le panier à proximité, tandis que 69 % des actifs du secteur vont principalement travailler en voiture. Une adresse proche des équipements laisse donc entière la question du déplacement professionnel.

Pendant une visite à Bourgogne-Châtelet ou à Beauchamps, parcourez les chemins vers les équipements repérés. La distance à vol d’oiseau sert à les situer ; le parcours sur place permet d’examiner les traversées et les accès que vous emprunteriez.

## Votre projet, votre adresse

Vous cherchez à vous rapprocher du travail ou à vous installer en famille en utilisant moins la voiture ? Avec futur•e, examinez l’adresse envisagée à partir de ce projet, pour voir comment elle s’inscrit dans la vie que vous souhaitez organiser.

## Méthode et sources

Les pratiques professionnelles proviennent de l’INSEE : fichier Mobilités professionnelles et bases infracommunales Activité des résidents et Logement. Elles concernent les actifs occupés de 15 ans ou plus ; le mode principal ne décrit pas l’ensemble de leurs déplacements. Les résultats sont des estimations par sondage.

Les groupes définis par leur commune de travail sont distincts : leur comparaison ne mesure pas l’effet d’un déménagement. Le groupe des six communes résulte d’une sélection automatique : même unité urbaine, au plus les six plus peuplées. Les données ne croisent pas secteur de résidence et commune de travail. Les secteurs sont les IRIS statistiques de l’INSEE, dont les libellés peuvent différer des noms de quartiers usuels.

La proximité repose sur les adresses de la Base adresse nationale et les équipements de la BPE 2025. Chaque adresse compte pareil dans les résultats par secteur. La présence d’un équipement ne renseigne ni sur son usage ni sur l’affectation scolaire.

Les prix viennent du flux officiel de prix-carburants.gouv.fr : pour chaque semaine, la médiane porte sur le dernier prix déclaré par chaque station participante. Le scénario illustre un surcoût selon les hypothèses indiquées ; il ne prévoit pas les prix futurs. L’identité du réseau TAO est documentée par le Point d’accès national aux données de transport.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, début de période | 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, fin de période | 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,72 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,47 €/L | `carburant.e10.ecart` | oui |
| Chapeau, rayon autour du centre | 12 km | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses, consommation | 6 L | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, distance de référence de consommation | 100 km | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, allers-retours annuels | 200 | `scenario.carburant.gazole.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, arrondi des hausses | 5 centimes | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` — hypothèses communes de la section 7 | oui |
| Hypothèses, hausse retenue pour le gazole | 0,70 €/L | `scenario.carburant.gazole.5km` | oui |
| Hypothèses, hausse retenue pour le SP95-E10 | 0,45 €/L | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller, première ligne | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau, gazole, première ligne | environ 80 € | `scenario.carburant.gazole.5km` | oui |
| Tableau, SP95-E10, première ligne | environ 50 € | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller, deuxième ligne | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau, gazole, deuxième ligne | environ 250 € | `scenario.carburant.gazole.15km` | oui |
| Tableau, SP95-E10, deuxième ligne | environ 160 € | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller, troisième ligne | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau, gazole, troisième ligne | environ 590 € | `scenario.carburant.gazole.35km` | oui |
| Tableau, SP95-E10, troisième ligne | environ 380 € | `scenario.carburant.e10.35km` | oui |
| Pratiques locales, millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques locales, Bourgogne-Châtelet | 28 % | `iris.voiture.min` | oui |
| Pratiques locales, Sud-Ouest-Chabassières | 80 % | `iris.voiture.max` | oui |
| Lieu de travail, actifs habitant et travaillant à Orléans | 42 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail, actifs résidant à Orléans et travaillant dans le groupe nommé | 68 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Définition du panier quotidien | 500 m | `iris.452340103.panier_500m`, `iris.452341702.panier_500m`, `iris.452341901.panier_500m` | oui |
| Panier quotidien, Bourgogne-Châtelet | toutes les adresses — 100 % | `iris.452340103.panier_500m` | oui |
| Panier quotidien, Sud-Ouest-Chabassières | aucune adresse — 0 % | `iris.452341702.panier_500m` | oui |
| Panier quotidien, Beauchamps | toutes les adresses — 100 % | `iris.452341901.panier_500m` | oui |
| Pratiques professionnelles, Beauchamps | 69 % | `iris.452341901.voiture` | oui |
| Méthode, sélection du groupe de communes | six communes ; au plus les six plus peuplées | `mobpro.voiture_selon_destination.communes_voisines` — règle de sélection de la section 1 | oui |
| Méthode, âge des actifs | 15 ans ou plus | `mobpro.voiture_selon_destination.meme_commune`, `iris.voiture.min` | oui |
| Méthode, millésime des équipements | 2025 | `iris.452340103.panier_500m`, `iris.452341702.panier_500m`, `iris.452341901.panier_500m` — source BPE précisée dans le dossier | oui |

Les caractères numériques de « SP95-E10 » appartiennent à la désignation du carburant.

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Au début de l’article, après les hypothèses | Aucune. Les cellules sont reprises dans le tableau de B. |
| Carte de la part de la voiture par secteur (IRIS) | Après la comparaison entre Bourgogne-Châtelet et Sud-Ouest-Chabassières | Aucune pour la production : classes automatiques et secteurs cités repérés par des numéros avec leur liste. Libellés posés à la main seulement pour une version soignée. |

Le millésime des pratiques doit figurer sur la carte ; le tableau doit conserver la période de hausse et les hypothèses exposées à proximité.

Vérifications avant publication concernant les faits utilisés :

- **`mobpro.voiture_selon_destination` :** relire l’intérêt du groupe de communes retenu. Sa composition exacte est donnée dans l’article ; cette vérification est non bloquante pour la rédaction.
- **`iris.ecart_voiture` :** relire les libellés Bourgogne-Châtelet, Sud-Ouest-Chabassières et Beauchamps. Ils sont présentés comme des secteurs statistiques.
- **`carburant.evolution` :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cette vérification est obligatoire avant publication et concerne aussi le scénario.

Aucun autre doute de lecture relevé.

## E. Corrections.

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement — bloquante : pratiques transformées en recommandation de secteur et en contrainte | « Bourgogne-Châtelet mérite ainsi l’attention d’une personne qui souhaite explorer une vie quotidienne moins tournée vers la voiture. À Sud-Ouest-Chabassières, où son usage professionnel est beaucoup plus répandu, la recherche demande d’identifier précisément les déplacements que l’on envisage de faire autrement. » | Deux phrases supprimées. |
| Méthode — a_revoir : sélection des six communes non expliquée | « Les groupes définis par leur commune de travail sont distincts : leur comparaison ne mesure pas l’effet d’un déménagement. » | Phrase conservée, suivie de : « Le groupe des six communes résulte d’une sélection automatique : même unité urbaine, au plus les six plus peuplées. » Règle du dossier reprise brièvement ; correspondance C complétée. |

## F. Retouches éditoriales (2026-10-16, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Tableau du surcoût | tableau Markdown recopié remplacé par le marqueur du tableau construit depuis le dossier | doublon d'affichage relevé à la relecture du 16/10/2026 (retrait par script, outil/lot.py) |
