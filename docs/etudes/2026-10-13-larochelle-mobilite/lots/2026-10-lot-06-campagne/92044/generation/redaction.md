## A. Question et format

**Question principale :** à Levallois-Perret, que regarder dans le choix d’une adresse quand les pratiques de la voiture diffèrent fortement entre secteurs pourtant équipés à proximité ?

Le contraste entre Eiffel 3 et Villiers-Cerdan donne un repère pour situer une annonce, puis examiner ses propres destinations. Il repose sur `iris.voiture.min`, `iris.voiture.max`, `iris.920440120.panier_500m` et `iris.920440124.panier_500m`. La marche parmi les actifs qui habitent et travaillent dans la commune apporte un éclairage complémentaire (`destination.92044.marche`), sans croiser lieu de travail et secteur de résidence.

**Format retenu : article court.** L’ouverture conserve les hausses du carburant et le scénario fourni.

**Pistes écartées :** possession automobile, stationnement, actifs entrants et comparaison nationale, qui disperseraient la question ; données de bus inutilisables.

## B. Article

# À Levallois-Perret, des équipements proches et des pratiques de la voiture contrastées

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,61 €/L, celui du SP95-E10 de 0,19 €/L. Ces hausses concernent les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Levallois-Perret. Pour un ménage qui cherche un logement, elles donnent une raison concrète d’examiner la place des déplacements en voiture.

Le scénario ci-dessous chiffre le **surcoût annuel de carburant** selon la distance du trajet aller. Il retient une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et les hausses médianes arrondies à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Trajet aller | Gazole : hausse de 0,60 €/L | SP95-E10 : hausse de 0,20 €/L |
|---|---:|---:|
| 5 km | environ 70 €/an | environ 20 €/an |
| 15 km | environ 220 €/an | environ 70 €/an |
| 35 km | environ 500 €/an | environ 170 €/an |

Ces distances ne décrivent aucun secteur de Levallois-Perret. Pour choisir une adresse, il faut ensuite regarder les pratiques locales et les destinations qui feront partie de votre quotidien.

## Situer l’annonce, puis regarder le trajet du matin

Les pratiques domicile-travail du recensement de 2022 font apparaître un contraste marqué : la voiture est le mode principal de 14 % des actifs résidant dans le secteur Eiffel 3, contre 42 % dans celui de Villiers-Cerdan. Ces parts concernent les actifs qui habitent chaque secteur, quelle que soit leur commune de travail.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

La carte donne ainsi un premier repère pour situer une annonce. Le lieu de travail apporte un autre éclairage : parmi les actifs qui habitent et travaillent à Levallois-Perret, 49 % vont principalement à pied au travail. Dans votre recherche, repérez donc aussi où le logement envisagé vous place par rapport à votre destination professionnelle.

## Courses et école : une proximité commune aux secteurs cités

Le trajet du matin ne couvre qu’une partie des déplacements à examiner avant de déménager. Pour les courses, la pharmacie ou l’école, les secteurs cités présentent le même résultat : toutes leurs adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d’oiseau.

Ce panier d’équipements proches coexiste donc avec des pratiques très différentes de la voiture pour le travail. Lors d’une visite, repérez les établissements que vous utiliseriez et parcourez les chemins qui les relient au logement. Ce passage du point sur la carte au parcours réel aide à préciser ce que l’adresse apporterait à votre quotidien.

## Votre projet, votre adresse

Si vous déménagez pour rapprocher le travail et la vie de famille, partez des déplacements que vous souhaitez simplifier. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour l’examiner dans son ensemble avant de choisir.

### Méthode et sources

Les pratiques professionnelles proviennent du recensement de l’INSEE, fichier Mobilités professionnelles et bases infracommunales. Ce sont des estimations par sondage ; les secteurs sont des IRIS statistiques, dont les noms peuvent différer des quartiers d’usage. Les données par secteur et par commune de travail décrivent des groupes distincts et ne sont pas croisées.

La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l’INSEE, millésime 2025. Chaque adresse compte également dans les résultats par secteur. Les distances à vol d’oiseau ne décrivent pas les parcours à pied ni l’usage des établissements.

Les prix proviennent de prix-carburants.gouv.fr, à partir du dernier prix déclaré par chaque station dans la semaine. Les stations déclarantes peuvent varier entre les périodes. Le scénario porte uniquement sur le surcoût de carburant.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau, période initiale | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` ; `carburant.e10.prix_un_an_avant` | oui |
| Chapeau, période finale | semaine du 5 octobre 2026 | `carburant.gazole.prix` ; `carburant.e10.prix` | oui |
| Chapeau, hausse du gazole | 0,61 €/L | `carburant.gazole.ecart` | oui |
| Chapeau, hausse du SP95-E10 | 0,19 €/L | `carburant.e10.ecart` | oui |
| Chapeau, périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart` ; `carburant.e10.ecart` | oui |
| Hypothèses du scénario | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses du scénario | 200 allers-retours par an | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses du scénario | arrondies à 5 centimes | `scenario.carburant.gazole.5km` ; `scenario.carburant.e10.5km` — hypothèse commune, section 7 | oui |
| Tableau, en-tête gazole | 0,60 €/L | `scenario.carburant.gazole.5km` ; `scenario.carburant.gazole.15km` ; `scenario.carburant.gazole.35km` | oui |
| Tableau, en-tête SP95-E10 | 0,20 €/L | `scenario.carburant.e10.5km` ; `scenario.carburant.e10.15km` ; `scenario.carburant.e10.35km` | oui |
| Tableau, trajet aller | 5 km | `scenario.carburant.gazole.5km` ; `scenario.carburant.e10.5km` | oui |
| Tableau, surcoût gazole | environ 70 €/an | `scenario.carburant.gazole.5km` | oui |
| Tableau, surcoût SP95-E10 | environ 20 €/an | `scenario.carburant.e10.5km` | oui |
| Tableau, trajet aller | 15 km | `scenario.carburant.gazole.15km` ; `scenario.carburant.e10.15km` | oui |
| Tableau, surcoût gazole | environ 220 €/an | `scenario.carburant.gazole.15km` | oui |
| Tableau, surcoût SP95-E10 | environ 70 €/an | `scenario.carburant.e10.15km` | oui |
| Tableau, trajet aller | 35 km | `scenario.carburant.gazole.35km` ; `scenario.carburant.e10.35km` | oui |
| Tableau, surcoût gazole | environ 500 €/an | `scenario.carburant.gazole.35km` | oui |
| Tableau, surcoût SP95-E10 | environ 170 €/an | `scenario.carburant.e10.35km` | oui |
| Pratiques, millésime | 2022 | `iris.voiture.min` ; `iris.voiture.max` ; `destination.92044.marche` | oui |
| Pratiques, part de la voiture | 14 % | `iris.voiture.min` | oui |
| Pratiques, nom du secteur | Eiffel 3 — « 3 » appartient au libellé | `iris.voiture.min` | oui |
| Pratiques, part de la voiture | 42 % | `iris.voiture.max` | oui |
| Pratiques, marche des actifs habitant et travaillant dans la commune | 49 % | `destination.92044.marche` | oui |
| Courses et école, totalité des adresses des secteurs cités | « toutes » — valeur exacte de 100 % dans chaque secteur | `iris.920440120.panier_500m` ; `iris.920440124.panier_500m` | oui |
| Courses et école, seuil de proximité | moins de 500 m à vol d’oiseau | `iris.920440120.panier_500m` ; `iris.920440124.panier_500m` | oui |
| Méthode, millésime des équipements | 2025 | `acces.92044.panier_quotidien_500m` — millésime de la source BPE, également applicable au panier par secteur | oui |

## D. Visuels et vérifications restantes

| Visuel retenu — nom exact | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Début de l’article, après les hypothèses ; tableau intégré au brouillon | Aucune |
| Carte de la part de la voiture par secteur (IRIS) | Après le contraste entre Eiffel 3 et Villiers-Cerdan | Aucune pour la production automatique ; repérer les secteurs cités avec leur liste. Libellés posés à la main seulement pour une version soignée |

Le millésime des pratiques devra figurer sur la carte ; le tableau de surcoût conservera la période des prix et ses hypothèses.

**Vérifications concernant les faits utilisés :**

- **Carburant et scénario :** réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Vérification obligatoire avant publication.
- **Secteurs :** relire les libellés Eiffel 3 et Villiers-Cerdan. Ils sont présentés ici comme des secteurs statistiques, sans assimilation à des quartiers d’usage.

Aucun autre doute de lecture relevé.