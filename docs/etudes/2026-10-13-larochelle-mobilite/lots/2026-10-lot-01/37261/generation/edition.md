# Tours (37261) : rendu de rédaction

## A. Question et format

**Question principale.** À Tours, qu'est-ce qui distingue ceux qui vont travailler en voiture de ceux qui s'en passent : le secteur où ils habitent, et la commune où ils travaillent ?

**Ce que la réponse apprend au lecteur.** Le dossier compare deux observations, sans les croiser :
- **Par secteur.** La part de la voiture va de 26 % à 69 % selon le secteur, soit 43 points d'écart (`iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`).
- **Par lieu de travail.** La voiture concerne 40 % des actifs qui habitent et travaillent à Tours. Elle concerne 70 % de ceux qui travaillent dans les six communes nommées, soit 30 points de plus (`mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`).
- **Dans l'autre sens.** Parmi ceux qui viennent travailler à Tours, 76 % viennent en voiture s'ils habitent le reste de l'unité urbaine, 86 % s'ils habitent au-delà (`mobpro.qui_vient_travailler.*.voiture`).

**Lien avec la recherche de logement.** Le lecteur hésite entre plusieurs secteurs de Tours, ou entre Tours et une commune autour. Le dossier lui donne deux choses à regarder l'une après l'autre : le secteur, puis le trajet vers son emploi. La proximité des commerces sert ensuite de contrepoint (`iris.<code>.panier_500m`), et le stationnement de vérification concrète (`iris.menages_commune.menages_stationnement_reserve`, `iris.<code>.stationnement_reserve`).

**Ouverture.** La hausse du carburant est utilisable (`carburant.*`, `scenario.carburant.*`). Elle amène la question des kilomètres faits en voiture.

**Format.** Article complet, environ 950 mots hors méthode.

**Pistes écartées.**
- Indicateur communal du panier (79 %) : il est pondéré par ménages, alourdirait le texte et ne se compare pas aux secteurs.
- Mode par commune de travail détaillée (section 4) : le graphique porte le détail.
- Section 5 (résidents des six communes) : elle fait doublon avec les faits « qui vient travailler ».
- Statut d'occupation : pas d'apport pour la question.
- Gratuité des moins de 5 ans : marginale pour la question.
- Gare à 2 km : pas d'apport pour la question.
- Bus : en attente de validation, ne s'écrit pas.

---

## B. Article

# Moins de voiture à Tours : regarder le secteur, puis le trajet vers le travail

**En un an, le prix médian du gazole autour de Tours est passé de 1,58 € à 2,31 € le litre. Avant de signer un bail ou un compromis, la question devient concrète : quelle place la voiture prendra-t-elle dans la semaine ? Les trajets des actifs qui habitent Tours donnent deux indications : selon le secteur où ils vivent, et selon la commune où ils travaillent.**

## Le prix du plein suit les kilomètres

Ces prix médians sont ceux des stations situées dans un rayon de 12 km autour du centre de Tours, pour la semaine du 6 octobre 2025 puis celle du 5 octobre 2026. Sur la même période, le litre de SP95-E10 est passé de 1,67 € à 2,11 €.

Le tableau ci-dessous chiffre le surcoût de carburant de cette hausse, arrondie à 5 centimes, selon la longueur du trajet domicile-travail. Il suppose une voiture qui consomme 6 litres aux 100 km et fait 200 allers-retours par an.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ce surcoût ne vise aucun quartier : il suit les kilomètres faits en voiture. Il faut donc savoir qui, à Tours, prend la voiture pour aller travailler.

## La voiture pour la moitié des actifs

Au recensement de 2022, 50 % des actifs qui habitent Tours vont travailler principalement en voiture. Pour 24 %, ce sont les transports en commun. Dans les villes de taille proche (voir la méthode), la médiane est de 59 %.

Avoir une voiture et la prendre pour aller travailler ne vont pas toujours ensemble. Parmi les actifs dont le ménage en possède au moins une, 42 % n'en font pas leur mode principal pour aller travailler.

## De Centre 1 à Sainte-Radegonde 1, de 26 % à 69 %

Pour choisir un secteur, la moyenne de la ville aide peu. Prenons la part des actifs qui vont travailler en voiture parmi ceux qui habitent chaque secteur statistique de l'INSEE, où qu'ils travaillent. Elle va de 26 % dans le secteur « Centre 1 » à 69 % dans « Sainte-Radegonde 1 », soit 43 points d'écart.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Les parts les plus basses se trouvent dans des secteurs nommés Centre et Grammont, où la marche tient une place importante : 31 % des actifs de Centre 1 vont travailler à pied. La carte situe les autres secteurs.

## Le lieu de travail, l'autre indication

Un secteur se choisit, mais l'emploi reste là où il est. Parmi les actifs qui habitent et travaillent à Tours, 40 % vont travailler en voiture ; parmi ceux qui travaillent à Joué-lès-Tours, Saint-Cyr-sur-Loire, Saint-Pierre-des-Corps, Saint-Avertin, Amboise ou Chambray-lès-Tours, 70 %. Le graphique donne le détail.

[VISUEL : Barres : part de la voiture selon la commune de travail]

## Et pour les courses, l'école ou la pharmacie ?

Le trajet vers le travail ne remplit pas la semaine. Pour les autres déplacements, les données ne décrivent pas les pratiques, mais ce qui se trouve près de chez soi. On regarde la part des adresses qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 mètres à vol d'oiseau.

Dans les secteurs Centre 3 ou Grammont 2, toutes les adresses réunissent les trois. Dans Sainte-Radegonde 1, presque aucune. Cela ne veut pas dire qu'elles n'ont ni commerce ni service : il leur manque au moins un des trois à moins de 500 mètres.

Cette proximité ne dit pas comment on va travailler. À Saint-Symphorien 3, 96 % des adresses ont les trois à moins de 500 mètres, et 63 % des actifs qui y habitent vont travailler en voiture. En visite, faites le chemin à pied jusqu'à l'épicerie et jusqu'à l'école : la distance à vol d'oiseau peut être bien plus courte que le trajet réel.

## Ce qu'il faut vérifier sur place

Les chiffres situent un secteur. La visite dit ce qu'il en sera pour votre logement.

**Le stationnement.** Si vous gardez une voiture, la place compte. À Tours, 46 % des ménages disposent d'un emplacement réservé. Ils sont 13 % dans le secteur Centre 3 et 89 % dans Sainte-Radegonde 1. Vérifiez dès l'annonce si une place est comprise.

**Les transports en commun.** Repérez l'arrêt le plus proche de l'adresse visitée. Consultez ses horaires de passage sur la page « Horaires par arrêt » du site du réseau Fil Bleu, www.filbleu.fr, aux heures de vos trajets.

**Le trajet vers votre travail.** Faites-le au moins une fois, au moment de la journée où vous le ferez.

## Votre projet, votre adresse

Se rapprocher de son travail, s'installer en famille, préparer sa retraite : on ne cherche pas le même logement selon ce que l'on veut changer. Sur futur•e, examinez l'adresse envisagée à partir de votre projet. Vous pourrez y regarder ce qui compte pour votre projet, de la mobilité à la chaleur de l'été.

## Méthode et sources

**Pratiques domicile-travail.**
- Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024), fichier détail Mobilités professionnelles et bases infracommunales Activité des résidents et Logement.
- Population : actifs occupés de 15 ans ou plus, selon leur mode principal de transport.
- Les parts du mode de transport et la part de 42 % comptent aussi ceux qui travaillent à domicile.
- Ce sont des estimations par sondage : les petits écarts ne doivent pas être surinterprétés.

**Secteurs.**
- Ce sont les IRIS de l'INSEE d'au moins 300 actifs. Leurs noms ne sont pas toujours ceux des quartiers d'usage.
- Les parts par secteur portent sur tous les actifs qui habitent le secteur, quelle que soit leur commune de travail. Elles ne sont pas croisées avec le lieu de travail.

**Lieu de travail.**
- Chaque lieu de travail correspond à un groupe distinct de personnes. Les écarts décrivent des pratiques, pas l'effet d'un changement d'emploi.
- Les six communes nommées sont les plus peuplées de la même unité urbaine que Tours, retenues automatiquement.
- L'unité urbaine est celle de l'INSEE. Sa composition n'est pas détaillée ici.

**Villes de taille proche.**
- Règle de sélection : communes de France métropolitaine les plus grandes de leur unité urbaine (approximation, pas le statut INSEE de ville-centre), mesurées par leurs actifs occupés résidents.
- Elles comptent de la moitié au double des actifs occupés résidant à Tours, avec au moins 150 lignes d'échantillon (critère d'inclusion). Tours est exclue.
- Le groupe compte 34 communes. La médiane est celle des parts communales d'actifs allant travailler principalement en voiture (travail à domicile compris), chaque commune comptant une fois.

**Proximité des équipements.**
- Sources : Base adresse nationale ; INSEE, Base permanente des équipements 2025.
- Distances à vol d'oiseau. Dans chaque secteur, chaque adresse compte pareil.
- Une proximité ne dit rien de l'usage des équipements.

**Stationnement.** Il s'agit des ménages (résidences principales), retraités et étudiants compris.

**Carburant.**
- Source : prix-carburants.gouv.fr.
- Médiane entre stations du dernier prix déclaré dans la semaine, pour les stations situées dans un rayon de 12 km à vol d'oiseau autour du centre de Tours.
- Le scénario ne compte que le carburant. Une hausse passée ne dit rien de l'avenir.

**Réseau Fil Bleu.** Site consulté les 14 et 15 octobre 2026.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | 1,58 € le litre (gazole, un an avant) | `carburant.gazole.prix_un_an_avant` | oui |
| Chapeau | 2,31 € le litre (gazole) | `carburant.gazole.prix` | oui |
| Le prix du plein | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Le prix du plein | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | oui |
| Le prix du plein | semaine du 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Le prix du plein | 1,67 € (SP95-E10) | `carburant.e10.prix_un_an_avant` | oui |
| Le prix du plein | 2,11 € (SP95-E10) | `carburant.e10.prix` | oui |
| Le prix du plein | arrondie à 5 centimes | `scenario.carburant.*` (hypothèses) | oui |
| Le prix du plein | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses) | oui |
| Le prix du plein | 200 allers-retours | `scenario.carburant.*` (hypothèses) | oui |
| La voiture pour la moitié | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| La voiture pour la moitié | 50 % | `mobpro.modes.voiture` / `comparaison.voiture.commune` | oui |
| La voiture pour la moitié | 24 % | `mobpro.modes.tc` | oui |
| La voiture pour la moitié | 59 % | `comparaison.voiture.mediane_groupe` | oui |
| La voiture pour la moitié | 42 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Intertitre secteurs | 26 % (Centre 1) | `iris.voiture.min` (= `iris.372610101.voiture`) | oui |
| Intertitre secteurs | 69 % (Sainte-Radegonde 1) | `iris.voiture.max` (= `iris.372611503.voiture`) | oui |
| Secteurs, corps | 26 % (Centre 1) | `iris.voiture.min` | oui |
| Secteurs, corps | 69 % (Sainte-Radegonde 1) | `iris.voiture.max` | oui |
| Secteurs, corps | 43 points | `ecart.iris.voiture.max_moins_min` | oui |
| Secteurs, corps | 31 % à pied (Centre 1) | `iris.372610101.marche` | oui |
| Lieu de travail | 40 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail | 70 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Lieu de travail | six communes | liste du périmètre de `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Courses, école | 500 mètres | `iris.<code>.panier_500m` (définition) | oui |
| Courses, école | toutes les adresses (Centre 3, Grammont 2 : 100 %) | `iris.372610103.panier_500m`, `iris.372610202.panier_500m` | oui |
| Courses, école | presque aucune (Sainte-Radegonde 1 : 0,2 %) | `iris.372611503.panier_500m` | oui |
| Courses, école | 96 % (Saint-Symphorien 3) | `iris.372611403.panier_500m` | oui |
| Courses, école | 63 % (Saint-Symphorien 3) | `iris.372611403.voiture` | oui |
| Vérifier | 46 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Vérifier | 13 % (Centre 3) | `iris.372610103.stationnement_reserve` | oui |
| Vérifier | 89 % (Sainte-Radegonde 1) | `iris.372611503.stationnement_reserve` | oui |
| Vérifier | réseau Fil Bleu, page « Horaires par arrêt », www.filbleu.fr | `doc.reseau.identite`, `doc.reseau.site`, `doc.verifier.horaires_par_arret` | oui |
| Méthode | 2022 ; collectes 2020 à 2024 | `mobpro.modes.*` (source et limites) | oui |
| Méthode | 15 ans ou plus | `mobpro.modes.*` (population) | oui |
| Méthode | 42 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Méthode | au moins 300 actifs | `iris.voiture.min` (périmètre) | oui |
| Méthode | six communes | liste du périmètre de `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Méthode | au moins 150 lignes d'échantillon | règle de sélection de la section 4 bis (`comparaison.voiture.*`) | oui |
| Méthode | 34 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | BPE 2025 | `acces.37261.panier_quotidien_500m` (source) | oui |
| Méthode | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Méthode | 14 et 15 octobre 2026 | `doc.verifier.horaires_par_arret` (consulté le 2026-10-14), `doc.reseau.identite` (2026-10-15) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus (trois)**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Le prix du plein suit les kilomètres », après l'énoncé des hypothèses.
   - Étape manuelle : aucune.
   - Les cellules (5, 15 et 35 km ; gazole et SP95-E10) restent dans le tableau et ne sont pas redites dans le texte.
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « De Centre 1 à Sainte-Radegonde 1 », après la phrase sur les 43 points.
   - Étape manuelle : aucune pour la production. Classes automatiques (`--classes auto`).
   - Les secteurs cités sont à repérer par des numéros avec leur liste (`--reperes`) : Centre 1, Centre 3, Grammont 2, Sanitas-Rotonde 3 et 5, Cathédrale, Rabelais-Tonnellé 2, Europe 5, Saint-Symphorien 3 et 4, Sainte-Radegonde 1 et 2, Rives du Cher 2, Paul Bert, Douets Milletière 2.
   - Libellés à la main seulement pour une version soignée. Le millésime 2022 figure sur la carte. Le tableau accessible des secteurs est produit avec la carte.
3. **Barres : part de la voiture selon la commune de travail**
   - Emplacement : section « Le lieu de travail, l'autre indication », après les trois parts.
   - Étape manuelle : aucune. La liste exacte des six communes figure dans l'intitulé de la seconde barre.
   - La carte de situation n'est pas retenue, pour rester à trois visuels.

**Vérifications de la section 10 qui concernent des faits utilisés**
- **`mobpro.voiture_selon_destination`.** Relire l'intérêt du choix des six communes : le chiffre de 70 % et l'écart de 30 points en dépendent. Amboise figure dans la liste alors que la ligne Amboise de la section 4 est fragile. Le groupe agrégé reste utilisable, mais le choix mérite d'être relu.
- **`iris.ecart_voiture`.** Relire les libellés d'IRIS cités avant publication. L'intertitre « De Centre 1 à Sainte-Radegonde 1 » emploie des libellés INSEE.
- **`carburant.evolution`.** Réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cela concerne les prix du chapeau et de la première section, et le tableau du scénario.

**Doutes de lecture**
- **Libellé « Paul Bert ».** C'est un IRIS unique sans numéro. Vérifier qu'il correspond bien au quartier d'usage avant de le présenter comme tel.
- **Expression « unité urbaine de Tours, au sens de l'INSEE ».** Elle s'appuie sur le code 37701 sans en donner la composition ni le nombre de communes. Confirmer que cette désignation suffit au lecteur.
- **Informations Fil Bleu.** Elles sont citées sans rien affirmer sur la desserte d'une adresse. Les dates de consultation (14 et 15 octobre 2026) sont reprises en méthode.

---

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| 1. Raisonnement, bloquante : présence de commerces affirmée sans mesure | « Ces adresses ne sont pas pour autant dépourvues de commerces ou de services : il leur manque au moins un des trois à moins de 500 mètres. » | « Cela ne veut pas dire qu'elles n'ont ni commerce ni service : il leur manque au moins un des trois à moins de 500 mètres. » |
| 2. Population, a_revoir : intertitre étendu à tout le Centre et tout Sainte-Radegonde (correction de quelques mots) | « Du Centre à Sainte-Radegonde, de 26 % à 69 % » | « De Centre 1 à Sainte-Radegonde 1, de 26 % à 69 % ». Les deux renvois de la section D sont mis à jour. |
| 3. Raisonnement, a_revoir : « hors du centre-ville » non établi, substitution de mode non mesurée (correction de quelques mots) | « Ailleurs, d'autres modes prennent le relais du centre-ville : » | « Dans d'autres secteurs, ce sont d'autres modes qui se distinguent : » |
| 4. Raisonnement, a_revoir : la question invite à lire l'écart entre groupes distincts comme l'effet d'un déménagement (correction de quelques mots) | « Vous travaillez à Tours et hésitez à habiter autour ? Regardez ceux qui viennent travailler à Tours : » | « Dans l'autre sens, chez ceux qui viennent travailler à Tours : ». La formule proposée (« parmi ceux qui… ») a été légèrement adaptée pour éviter la répétition de « parmi » avec la liste qui suit. |
| 5. Lisibilité, a_revoir : maxime de fin de section | « Les deux questions se posent l'une après l'autre : quel secteur, puis quel trajet jusqu'à votre emploi. » | Phrase supprimée. |
| 6. Raisonnement, a_revoir : règle de comparaison incomplète en méthode (ajouts de quelques mots chacun) | « …les plus grandes de leur unité urbaine, mesurées par… » ; « avec un nombre minimal de lignes d'échantillon » ; « La médiane est celle des parts communales, chaque commune comptant une fois. » | « …les plus grandes de leur unité urbaine (approximation, pas le statut INSEE de ville-centre), mesurées par… » ; « avec au moins 150 lignes d'échantillon (critère d'inclusion) » ; « La médiane est celle des parts communales d'actifs allant travailler principalement en voiture (travail à domicile compris), chaque commune comptant une fois. » Une ligne est ajoutée en C pour le seuil de 150 lignes. |
| 7. Conclusion, a_revoir : « Vous y verrez » promet un résultat et l'énumération recopie la capacité (correction de quelques mots) | « Vous y verrez ce qui peut peser dans votre choix : la mobilité et les services, mais aussi la chaleur de l'été ou les risques à l'adresse. » | « Vous pourrez y regarder ce qui compte pour votre projet, de la mobilité à la chaleur de l'été. » |

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Changement | Raison |
|---|---|---|
| Ensemble de la ville | marche 12 % et vélo 10 % retirés | Succession de pourcentages |
| Secteurs | Sanitas-Rotonde, vélo à Cathédrale et Rabelais-Tonnellé, Europe 5 et Saint-Symphorien 4, 43 points (hors intertitre) et précaution « ne disent pas ce que fera un nouvel arrivant » retirés ; « La carte situe les autres secteurs » | Exemples secondaires laissés à la carte |
| Lieu de travail | 64 %, 30 points, 68 % et flux entrants (76 %, 86 %) retirés ; « Le graphique donne le détail » | Les flux entrants ne servent pas la question du logement |
| Courses | Paul Bert, Douets Milletière 2, Sainte-Radegonde 2 et Rives du Cher 2 retirés | Allègement |

Lignes de C retirées (chiffres disparus de l'article) : 18 % (Cathédrale, vélo); 19 % (Rabelais-Tonnellé 2, vélo); 64 %; 30 points; 68 %; 76 %; 86 %; aucune (Paul Bert, Douets Milletière 2, Sainte-Radegonde 2 : 0 %); 99 % (Rives du Cher 2); 60 % (Rives du Cher 2)
