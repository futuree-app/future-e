# Lorient (56121) : quartier, lieu de travail et place de la voiture

## A. Question et format

**Question principale.** Pour quelqu'un qui cherche un logement à Lorient : selon le quartier où il habite et la commune où il travaille, quelle place la voiture prend-elle dans le trajet domicile-travail ? Et que faut-il vérifier pendant les visites ?

**Ce que la réponse apprend au lecteur.** Les deux points de départ d'une recherche sont l'adresse envisagée et le lieu de travail, déjà connu. À Lorient, chacun correspond à un écart net :
- **Entre quartiers**, la part de la voiture va de 54 % à 78 %, soit 24 points d'écart (`iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`).
- **Selon le lieu de travail**, elle est de 56 % chez les actifs qui travaillent à Lorient même. Elle monte à 80 % chez ceux qui travaillent dans les cinq communes nommées, soit 24 points de plus (`mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`).

Trois faits complètent la réponse :
- Une part d'actifs motorisés ne prend pas la voiture pour aller travailler (`mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture`).
- Certains secteurs ont toutes leurs adresses équipées alors que la voiture y reste élevée (`iris.561210501.*`).
- Les places de stationnement réservées sont rares dans certains secteurs (`iris.*.stationnement_reserve`, `iris.menages_commune.menages_stationnement_reserve`).

L'ouverture repose sur la hausse du carburant (`carburant.*`, `scenario.carburant.*`).

**Format.** Article complet.

**Pistes écartées.**
- Le repère de comparaison (67 % contre une médiane de 69 %) montre seulement que Lorient est proche de la médiane : il n'apporte rien à la question.
- Les actifs qui viennent travailler à Lorient : ils ne concernent pas le choix d'un logement dans la ville.
- Les statuts d'occupation et les parts d'accès à l'échelle de la commune : ils alourdiraient le texte sans servir la question.
- Les tarifs du réseau, qui ne s'écrivent qu'avec toutes leurs conditions, et les faits bus, qui sont en attente de validation.

---

## B. Article

# Lorient : selon le quartier et le lieu de travail, la voiture ne prend pas la même place

**Autour de Lorient, le prix médian du gazole atteint 2,29 € le litre en octobre 2026. Pour qui cherche un logement dans la ville, une question devient concrète : depuis quel quartier, et pour quel trajet, peut-on moins dépendre de la voiture ? Les trajets domicile-travail des actifs donnent des repères.**

## Un plein qui a changé de prix

La semaine du 5 octobre 2026, le prix médian du gazole est de 2,29 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Lorient. Il était de 1,56 € la même semaine de 2025. Le SP95-E10 est passé de 1,64 € à 2,12 €.

Le tableau ci-dessous traduit cette hausse en surcoût annuel selon la distance du trajet domicile-travail. Il suppose une voiture qui consomme 6 litres aux 100 km, 200 allers-retours par an et la hausse arrondie à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

Pour un ménage qui choisit un logement, deux choses jouent : la distance au travail, et la façon de faire ce trajet. Sur ce second point, les pratiques des actifs de Lorient diffèrent d'un quartier à l'autre.

## D'un quartier à l'autre, 24 points d'écart

Au recensement de 2022, 67 % des actifs qui habitent Lorient vont travailler principalement en voiture. Cette part va de 54 % dans le secteur Arsenal Maritime à 78 % dans celui de Lanveur Kerfichant, soit 24 points d'écart. Ces noms sont ceux des secteurs statistiques de l'INSEE, pas toujours ceux des quartiers d'usage.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Là où la voiture pèse le moins, la marche prend plus de place : 25 % des actifs d'Arsenal Maritime et 24 % de ceux d'Aristide Briand vont travailler principalement à pied.

Le vélo dessine une autre carte. Ses parts les plus élevées, 16 % à Kreisker et 15 % à Chant des Oiseaux, se trouvent dans des secteurs où la voiture reste majoritaire. Dans le secteur Parc du Scorff, 26 % des actifs vont travailler principalement en transports en commun.

Ces parts concernent tous les actifs de chaque secteur, où qu'ils travaillent. Le quartier ne dit pas tout du trajet : celui-ci dépend aussi de la commune où l'on travaille.

## Travailler à Lorient ou en dehors

59 % des actifs qui habitent Lorient y travaillent aussi. Parmi eux, 56 % vont travailler principalement en voiture, 18 % à pied et 12 % à vélo.

Chez ceux qui travaillent à Lanester, Ploemeur, Quéven, Larmor-Plage ou Caudan, la voiture atteint 80 %, soit 24 points de plus. Pour ceux qui travaillent hors de Lorient et de ces cinq communes, elle est à 82 %.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Avoir une voiture ne fixe pas le mode du trajet du matin. Parmi les actifs dont le ménage a au moins une voiture, 28 % ne la déclarent pas comme mode principal pour aller travailler, travail à domicile compris.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du travail n'est qu'un des déplacements de la semaine. Pour les autres, on peut regarder ce qui se trouve près de chaque adresse.

Dans les secteurs Quai de Rohan et Saint-Armel, notamment, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 mètres à vol d'oiseau. Ce n'est le cas que de 25 % des adresses à Bourgneuf et de 34 % à Hôpital Kerforn.

À Saint-Armel, où toutes les adresses ont ce panier, 74 % des actifs vont travailler principalement en voiture. Les deux mesures portent sur des déplacements différents : un commerce proche ne dit rien du trajet vers le travail.

## Ce qu'il faut vérifier pendant les visites

Si vous gardez une voiture, même pour un usage occasionnel, la question du stationnement se pose. À l'échelle de la ville, 48 % des ménages disposent d'un emplacement réservé. Ce n'est le cas que de 21 % des ménages dans les secteurs Quai de Rohan et Saint-Armel, contre 78 % dans celui du Ter. Vérifiez dès l'annonce si une place est comprise.

Pour un trajet en bus, le réseau IZILO Mobilités publie sur izilo.bzh une page « Lignes et horaires ». Elle propose une fiche horaires personnalisée et renvoie vers le plan du réseau et les infos trafic. Consultez-la en repérant les arrêts proches de l'adresse envisagée et de votre travail.

## Votre projet, votre adresse

Se rapprocher de son travail, installer une famille, changer de rythme : c'est votre projet qui dit quels trajets compteront chaque semaine. Avant de vous décider, examinez sur futur•e l'adresse que vous envisagez à partir de ce projet. La mobilité y compte, comme les services proches, la chaleur de l'été ou les risques à l'adresse.

## Méthode et sources

**Pratiques domicile-travail.** Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024).
- Fichier détail Mobilités professionnelles pour la commune et les lieux de travail ; bases infracommunales Activité des résidents et Logement pour les secteurs.
- Population : actifs occupés de 15 ans ou plus, selon leur mode de transport principal.
- Les secteurs sont les IRIS d'habitat d'au moins 300 actifs. Deux secteurs d'activité sont exclus.
- Les parts par secteur et les parts par commune de travail ne se croisent pas : chaque groupe est un ensemble distinct de personnes. L'écart entre deux groupes décrit des pratiques, pas l'effet d'un changement d'emploi.
- Ce sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

**Stationnement.** La part de ménages avec un emplacement réservé porte sur l'ensemble des résidences principales.

**Équipements.** Base adresse nationale et base permanente des équipements (INSEE, 2025). Distances à vol d'oiseau ; la proximité d'un équipement ne dit rien de son usage.

**Carburant.** prix-carburants.gouv.fr. Prix médian entre stations du dernier prix déclaré dans la semaine, dans un rayon de 12 km autour du centre de Lorient. Le scénario porte sur le carburant seul et ne s'attribue à aucun quartier.

**Réseau de bus.** Informations publiées par IZILO Mobilités, consultées le 14 octobre 2026.

---

## C. Correspondance interne (non publiée)

Aucun chiffre n'a changé. Seuls les libellés de deux passages sont précisés (chapeau, TC Parc du Scorff).

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | 2,29 € le litre (prix médian), octobre 2026 | `carburant.gazole.prix` | oui |
| Un plein… | semaine du 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Un plein… | 2,29 € | `carburant.gazole.prix` | oui |
| Un plein… | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Un plein… | 1,56 € (même semaine de 2025) | `carburant.gazole.prix_un_an_avant` | oui |
| Un plein… | 1,64 € | `carburant.e10.prix_un_an_avant` | oui |
| Un plein… | 2,12 € | `carburant.e10.prix` | oui |
| Un plein… | 6 litres aux 100 km, 200 allers-retours, 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Quartiers | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Quartiers | 67 % | `mobpro.modes.voiture` | oui |
| Quartiers | 54 % (Arsenal Maritime) | `iris.voiture.min` | oui |
| Quartiers | 78 % (Lanveur Kerfichant) | `iris.voiture.max` | oui |
| Quartiers | 24 points | `ecart.iris.voiture.max_moins_min` | oui |
| Quartiers | 25 % (marche, Arsenal Maritime) | `iris.561210101.marche` | oui |
| Quartiers | 24 % (marche, Aristide Briand) | `iris.561210102.marche` | oui |
| Quartiers | 16 % (vélo, Kreisker) | `iris.561210703.velo` | oui |
| Quartiers | 15 % (vélo, Chant des Oiseaux) | `iris.561210904.velo` | oui |
| Quartiers | « voiture majoritaire » (70 %, 67 %) | `iris.561210703.voiture`, `iris.561210904.voiture` | oui |
| Quartiers | 26 % (TC pour aller travailler, Parc du Scorff) | `iris.561210502.tc` | oui |
| Travail | 59 % | `mobpro.travaille_dans_commune` | oui |
| Travail | 56 % (voiture) | `mobpro.voiture_selon_destination.meme_commune` / `destination.56121.voiture` | oui |
| Travail | 18 % (à pied) | `destination.56121.marche` | oui |
| Travail | 12 % (vélo) | `destination.56121.velo` | oui |
| Travail | 80 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Travail | 24 points de plus | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Travail | « ces cinq communes » | liste du groupe nommé (section 1) | oui |
| Travail | 82 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Travail | 28 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Courses | « toutes les adresses » (Quai de Rohan, Saint-Armel) = 100 % | `iris.561210906.panier_500m`, `iris.561210501.panier_500m` | oui |
| Courses | 500 mètres | `iris.*.panier_500m` (définition) | oui |
| Courses | 25 % (Bourgneuf) | `iris.561210602.panier_500m` | oui |
| Courses | 34 % (Hôpital Kerforn) | `iris.561210302.panier_500m` | oui |
| Courses | 74 % (Saint-Armel) | `iris.561210501.voiture` | oui |
| Vérifications | 48 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Vérifications | 21 % (Quai de Rohan, Saint-Armel) | `iris.561210906.stationnement_reserve`, `iris.561210501.stationnement_reserve` | oui |
| Vérifications | 78 % (Le Ter) | `iris.561210704.stationnement_reserve` | oui |
| Vérifications | izilo.bzh, page Lignes et horaires | `doc.reseau.site`, `doc.reseau.identite`, `doc.verification.fiche_horaires` | oui |
| Méthode | 2022, collectes 2020 à 2024 | limites `mobpro.*` | oui |
| Méthode | 15 ans ou plus | populations `mobpro.*` | oui |
| Méthode | au moins 300 actifs | `iris.voiture.min` (périmètre) | oui |
| Méthode | deux secteurs d'activité exclus | section 3 (561210901, 561210603, absents) | oui |
| Méthode | 2025 (BPE) | `acces.56121.*` (source) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |
| Méthode | 14 octobre 2026 | `doc.*` (consultation) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Un plein qui a changé de prix », après les hypothèses.
   - Étape manuelle : aucune. Les valeurs sont à réextraire avant publication.
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « D'un quartier à l'autre ».
   - Étape manuelle : aucune pour la production (`--classes auto`). Repérer par numéros (`--reperes`) les secteurs cités dans le texte : Arsenal Maritime, Lanveur Kerfichant, Aristide Briand, Kreisker, Chant des Oiseaux, Parc du Scorff, Quai de Rohan, Saint-Armel, Bourgneuf, Hôpital Kerforn, Le Ter.
   - Le tableau accessible des secteurs est produit avec elle.
   - Millésime 2022 à porter sur le visuel.
3. **Barres : part de la voiture selon la commune de travail**
   - Emplacement : section « Travailler à Lorient ou en dehors ».
   - Étape manuelle : aucune. La liste exacte des cinq communes figure dans l'intitulé de la barre.
   - La carte de situation n'est pas retenue.

**Vérifications en attente qui concernent des faits utilisés**

- `mobpro.voiture_selon_destination` : relire l'intérêt du choix des cinq communes (Lanester, Ploemeur, Quéven, Larmor-Plage, Caudan). Non bloquante.
- `iris.ecart_voiture` : relire les libellés IRIS cités avant de les présenter comme des noms de lieux. Non bloquante.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; cela concerne aussi le tableau du scénario.

**Doutes de lecture**

- Le libellé « Le Ter » est écrit « celui du Ter » dans le texte : à vérifier.
- La formule « Avoir une voiture ne fixe pas le mode du trajet du matin » est à relire : elle ne doit pas se lire comme une antithèse d'emphase.

---

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| 1. Raisonnement (bloquante) : une pratique présentée comme une possibilité, et « habitants » au lieu d'« actifs ». Corrigée. | « deux choses jouent : la distance au travail, et la possibilité de faire ce trajet sans voiture. Sur ce second point, les habitants de Lorient ne se ressemblent pas d'un quartier à l'autre. » | « deux choses jouent : la distance au travail, et la façon de faire ce trajet. Sur ce second point, les pratiques des actifs de Lorient diffèrent d'un quartier à l'autre. » |
| 2. Conclusion (bloquante) : la phrase promettait les parts de la voiture par secteur, ce qui est interdit, et prenait la forme d'un inventaire. Corrigée. | « Vous y verrez la place de la voiture dans le secteur et ce qui se trouve à proximité, mais aussi la chaleur de l'été ou les risques à l'adresse. » | « La mobilité y compte, comme les services proches, la chaleur de l'été ou les risques à l'adresse. » |
| 3. Raisonnement (à revoir) : « malgré » suggérait un lien causal. Corrigée, car la correction tient en quelques mots. | « À Saint-Armel, malgré ce panier complet à toutes les adresses, 74 % … » | « À Saint-Armel, où toutes les adresses ont ce panier, 74 % … » |
| 4. Population (à revoir) : la phrase pouvait se lire comme un usage général des transports en commun. Corrigée, en quelques mots. | « 26 % des actifs utilisent principalement les transports en commun. » | « 26 % des actifs vont travailler principalement en transports en commun. » |
| 5. Condition documentaire (à revoir) : la phrase laissait attendre une recherche d'adresse à adresse que la source n'établit pas. Corrigée, en quelques mots. | « Consultez-la avec l'adresse envisagée et celle de votre travail en main. » | « Consultez-la en repérant les arrêts proches de l'adresse envisagée et de votre travail. » |
| 6. Lisibilité (à revoir) : « s'affiche » laissait croire à un prix unique à la pompe, alors qu'il s'agit d'une médiane. Corrigée, en quelques mots. | « le gazole s'affiche à 2,29 € le litre en octobre 2026 » | « le prix médian du gazole atteint 2,29 € le litre en octobre 2026 » |
| 7. Lisibilité (à revoir) : précaution superflue, la définition du panier étant déjà exacte. Corrigée par suppression d'une phrase. | « Cela ne veut pas dire que les autres adresses n'ont aucun de ces équipements à proximité. » | *(phrase supprimée)* |

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Avant | Après | Raison |
|---|---|---|---|
| Transition secteurs → lieu de travail | « Or le lieu de travail, celui qui cherche un logement le connaît déjà : il se lit à l'échelle de toute la ville. » | « Le quartier ne dit pas tout du trajet : celui-ci dépend aussi de la commune où l'on travaille. » | Transition obscure ; affirmation générale non fondée (tout lecteur ne connaît pas son lieu de travail) |
| Méthode, carburant | « Les prix seront réextraits avant publication. » | retiré | Consigne de production, gardée dans le suivi |
| Chapeau | « trajets domicile-travail des habitants » | « … des actifs » | Population exacte |
