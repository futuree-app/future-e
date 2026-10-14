# La Roche-sur-Yon (85191) : article sur la place de la voiture

## A. Question et format

**Question principale.** À La Roche-sur-Yon, la voiture domine les trajets domicile-travail. Où et pour quel emploi pèse-t-elle moins ? Et que faut-il vérifier quand on vise ces secteurs ?

**Ce que la réponse apprend au lecteur.** Le choix de l'adresse ne joue pas seulement sur la distance au travail :

- **Écart entre secteurs.** La part de la voiture va de 57 % à 89 % selon le secteur. Dans les secteurs où elle est la plus basse, la marche atteint environ un actif sur cinq (`iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`, `iris.851910103.*`, `iris.851910102.*`).
- **Lieu de travail.** La voiture est à 67 % chez les actifs qui travaillent dans la commune et à 91 % chez ceux qui travaillent ailleurs (`mobpro.voiture_selon_destination.*`).
- **Équipements proches.** Les secteurs où le panier quotidien (commerce alimentaire, pharmacie et école élémentaire) est le plus proche ne sont pas forcément ceux où la voiture recule pour aller travailler. Garenne en est l'exemple (`iris.851910303.*`).
- **Stationnement.** Dans plusieurs de ces secteurs, moins de la moitié des ménages a une place réservée, contre 71 % sur la commune (`iris.menages_commune.menages_stationnement_reserve`, colonnes `stationnement_reserve`).

**Ouverture.** La hausse du carburant (`carburant.*`, `scenario.carburant.*`) amène la question : la distance du trajet entre dans le budget.

**Format.** Article complet, environ 900 mots hors méthode.

**Pistes écartées.**
- Statut d'occupation : il n'apporte rien à la question du quartier.
- Parts par commune de travail autres que La Roche-sur-Yon : elles sont fragiles, ou Le Poiré-sur-Vie seul n'éclaire pas grand-chose.
- Indicateurs d'accès pondérés à l'échelle de la commune : ils alourdiraient le texte, les parts par secteur suffisent.
- Gare à 2 km : sans lien direct avec la question.
- Faits bus : en attente de validation.

---

## B. Article

# La Roche-sur-Yon : où la voiture pèse moins sur le trajet du travail

**Autour de La Roche-sur-Yon, le litre de gazole coûte 0,74 € de plus qu'il y a un an. Quand on cherche un logement, la question devient concrète : depuis quel secteur, et pour quel emploi, peut-on moins dépendre de la voiture ? Les trajets des habitants donnent une réponse nette. Elle s'accompagne d'un point à vérifier dès l'annonce : la place de stationnement.**

## Un plein qui a changé de prix

Dans les stations situées dans un rayon de 12 km autour du centre de La Roche-sur-Yon, le prix médian du gazole est de 2,29 € le litre la semaine du 5 octobre 2026. Il était de 1,54 € un an plus tôt. Le SP95-E10 est passé de 1,61 € à 2,13 €. Pour qui choisit une adresse, la longueur du trajet quotidien entre désormais dans le budget.

Le tableau ci-dessous chiffre le surcoût annuel selon la distance. Il suppose un aller-retour domicile-travail 200 fois par an, avec une voiture qui consomme 6 litres aux 100 km. La hausse est arrondie à 0,75 € le litre pour le gazole et à 0,50 € pour l'E10.

[VISUEL : Tableau du scénario de surcoût de carburant]

## Des secteurs où l'on marche pour aller travailler

Au recensement de 2022, 74 % des actifs qui habitent La Roche-sur-Yon vont travailler principalement en voiture. La médiane des villes de taille proche est de 68 % (voir la méthode). Ce chiffre d'ensemble recouvre des écarts nets entre les secteurs statistiques de l'INSEE, dont les noms ne sont pas toujours ceux des quartiers.

**Les secteurs où la voiture pèse le moins**
- **Pentagone Sud-Ouest** : 57 % des actifs qui y habitent vont travailler principalement en voiture, et 22 % à pied.
- **Les Halles** : 61 % en voiture, 23 % à pied. Sur toute la commune, la marche n'est le mode principal que de 9 % des actifs.

**À l'autre bout**
- **Zone Rurale-L'Annexe** : 89 % des actifs vont travailler en voiture. Trente-deux points séparent ce secteur de Pentagone Sud-Ouest.

**Ailleurs, d'autres modes**
- **Gare SNCF** (à ne pas confondre avec Gare SNCF-Sacré-Cœur) : le vélo est le mode principal de 11 % des actifs.
- **Pyramides-Jean Yole** : les transports en commun sont le mode principal de 14 % des actifs.

La carte permet de situer chaque secteur.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## L'autre ligne de partage : la commune où l'on travaille

À côté du secteur, une deuxième observation sépare les pratiques : la commune de travail. 69 % des actifs qui habitent La Roche-sur-Yon y travaillent aussi.

- Parmi les actifs qui habitent et travaillent à La Roche-sur-Yon, 67 % vont travailler principalement en voiture.
- Parmi ceux qui travaillent dans une autre commune, la part monte à 91 %.

Avoir une voiture ne dit pas non plus comment on va travailler. 22 % des actifs dont le ménage a au moins une voiture ne la déclarent pas comme mode principal pour aller travailler (ceux qui travaillent chez eux sont inclus).

Environ 45 300 actifs travaillent à La Roche-sur-Yon. Parmi eux, 66 % habitent hors de l'unité urbaine de La Roche-sur-Yon au sens de l'INSEE, et 96 % de ces derniers viennent travailler principalement en voiture.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du travail n'est qu'un des déplacements de la semaine. Pour les autres, les équipements proches donnent une autre lecture des secteurs. On retient ici un panier quotidien : un commerce alimentaire, une pharmacie et une école élémentaire, tous trois à moins de 500 m à vol d'oiseau.

**Les secteurs où le panier est le plus souvent à portée**
- Pentagone Nord : toutes les adresses l'ont.
- Les Halles : la quasi-totalité des adresses.
- Garenne : 97 % des adresses.
- Liberté et La Vigne aux Roses : 94 %.

**Les secteurs où il l'est rarement**
- La Courtaisière : 13 % des adresses.
- Mon Repos-Terres Noires-Forges-Branly : 15 %.
- La Généraudière-L'Angelmière : 16 %.
- Zone Rurale-L'Annexe : presque aucune adresse.

Garenne montre que les deux mesures ne disent pas la même chose. La quasi-totalité des adresses y a le panier quotidien à proximité. Pourtant, 80 % des actifs qui y habitent vont travailler principalement en voiture, l'une des parts les plus élevées de la ville. La proximité indique ce qui est à portée pour les courses ou l'école, pas le trajet du matin.

## Ce qu'il faut vérifier à la visite

Dans plusieurs secteurs, la place de stationnement est loin d'être la règle. Sur l'ensemble de la commune, 71 % des ménages disposent d'un emplacement réservé. Cette part tombe à :

- 44 % des ménages à Les Halles ;
- 42 % à Garenne ;
- 41 % à Pyramides-Jean Yole ;
- 36 % à La Vigne aux Roses.

Dans ces mêmes secteurs, les ménages sans voiture sont plus fréquents. Ils représentent 31 % des ménages à Pyramides-Jean Yole et 28 % à Les Halles, contre 16 % sur la commune.

Si vous gardez une voiture, vérifiez dès l'annonce si une place est comprise, et sinon où se garer près de l'immeuble. Si vous comptez sur le bus, le réseau de l'intercommunalité La Roche-sur-Yon - Agglomération s'appelle Impulsyon. Regardez quelles lignes passent près de l'adresse visée et à quelles heures, avant de signer.

## Votre projet, votre adresse

Se rapprocher de son emploi, s'installer en famille, préparer sa retraite : ce que l'on attend d'un déménagement change d'une rue à l'autre. Sur futur•e, examinez l'adresse que vous envisagez à partir de ce projet. Les services à proximité, l'équipement automobile des ménages du secteur, la chaleur de l'été ou les risques à l'adresse peuvent peser dans votre choix.

### Méthode et sources

**Trajets domicile-travail**
- Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024), fichier détail Mobilités professionnelles et bases infracommunales Activité des résidents et Logement.
- Champ : actifs occupés de 15 ans ou plus, selon leur mode principal pour aller travailler. Achats, école et loisirs n'y figurent pas.
- Ces données sont des estimations par sondage, et les petits écarts entre secteurs ne doivent pas être surinterprétés.

**Groupes comparés**
- Les parts par secteur concernent tous les actifs qui habitent le secteur, quelle que soit leur commune de travail.
- Les parts selon la commune de travail portent sur des groupes distincts de personnes. Leur écart décrit des pratiques, pas l'effet d'un changement d'emploi.
- Les secteurs sont des IRIS de l'INSEE. Les secteurs d'activité sont exclus.

**Ménages et stationnement**
- Champ : toutes les résidences principales (retraités et étudiants compris). Ces parts ne se comparent pas aux parts d'actifs.

**Villes de taille proche**
- Elles sont choisies selon une règle fixée avant de regarder les résultats. Ce sont les communes de France métropolitaine qui sont la plus grande de leur unité urbaine par le nombre d'actifs occupés résidents. Elles comptent de la moitié au double des actifs de La Roche-sur-Yon, avec au moins 150 lignes d'échantillon, La Roche-sur-Yon exclue : 85 communes au total.
- La médiane est celle des parts communales, chaque commune comptant une fois.

**Équipements**
- Sources : Base adresse nationale et base permanente des équipements (BPE) 2025 de l'INSEE.
- Il s'agit de parts d'adresses, pas d'habitants. Les distances sont mesurées à vol d'oiseau, et le chemin réel est plus long.

**Carburant**
- Source : prix-carburants.gouv.fr. Le prix retenu est la médiane, entre stations, du dernier prix déclaré dans la semaine.
- Le scénario ne compte que le carburant. Il ne s'attribue à aucun quartier.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | 0,74 € | `carburant.gazole.ecart` | oui |
| Un plein… | 12 km | périmètre de `carburant.gazole.prix` | oui |
| Un plein… | 2,29 € | `carburant.gazole.prix` | oui |
| Un plein… | 5 octobre 2026 | `carburant.gazole.prix` (semaine du 2026-10-05) | oui |
| Un plein… | 1,54 € | `carburant.gazole.prix_un_an_avant` | oui |
| Un plein… | 1,61 € | `carburant.e10.prix_un_an_avant` | oui |
| Un plein… | 2,13 € | `carburant.e10.prix` | oui |
| Un plein… | 200 fois par an | hypothèses de `scenario.carburant.*` | oui |
| Un plein… | 6 litres aux 100 km | hypothèses de `scenario.carburant.*` | oui |
| Un plein… | 0,75 € | `scenario.carburant.gazole.*` (hausse retenue) | oui |
| Un plein… | 0,50 € | `scenario.carburant.e10.*` (hausse retenue) | oui |
| Des secteurs… | 2022 | millésime `mobpro.*` / `iris.*` | oui |
| Des secteurs… | 74 % | `mobpro.modes.voiture` / `comparaison.voiture.commune` | oui |
| Des secteurs… | 68 % | `comparaison.voiture.mediane_groupe` | oui |
| Des secteurs… | 57 % | `iris.voiture.min` / `iris.851910103.voiture` | oui |
| Des secteurs… | 22 % (à pied) | `iris.851910103.marche` | oui |
| Des secteurs… | 61 % | `iris.851910102.voiture` | oui |
| Des secteurs… | 23 % | `iris.851910102.marche` | oui |
| Des secteurs… | 9 % | `mobpro.modes.marche` | oui |
| Des secteurs… | 89 % | `iris.voiture.max` / `iris.851911003.voiture` | oui |
| Des secteurs… | Trente-deux points | `ecart.iris.voiture.max_moins_min` | oui |
| Des secteurs… | 11 % | `iris.851910802.velo` | oui |
| Des secteurs… | 14 % | `iris.851910304.tc` | oui |
| L'autre ligne… | 69 % | `mobpro.travaille_dans_commune` | oui |
| L'autre ligne… | 67 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| L'autre ligne… | 91 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| L'autre ligne… | 22 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| L'autre ligne… | environ 45 300 | `mobpro.qui_vient_travailler.total` | oui |
| L'autre ligne… | 66 % | `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | oui |
| L'autre ligne… | 96 % | `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | oui |
| Courses, école… | 500 m | définition de `iris.<code>.panier_500m` | oui |
| Courses, école… | toutes les adresses (Pentagone Nord) | `iris.851910101.panier_500m` (100 %) | oui |
| Courses, école… | quasi-totalité (Les Halles) | `iris.851910102.panier_500m` (99 %) | oui |
| Courses, école… | 97 % | `iris.851910303.panier_500m` | oui |
| Courses, école… | 94 % | `iris.851910501.panier_500m`, `iris.851910502.panier_500m` | oui |
| Courses, école… | 13 % | `iris.851911004.panier_500m` | oui |
| Courses, école… | 15 % | `iris.851910901.panier_500m` | oui |
| Courses, école… | 16 % | `iris.851910701.panier_500m` | oui |
| Courses, école… | presque aucune adresse | `iris.851911003.panier_500m` (0,2 %) | oui |
| Courses, école… | 80 % | `iris.851910303.voiture` | oui |
| Vérifier à la visite | 71 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Vérifier à la visite | 44 % | `iris.851910102.stationnement_reserve` | oui |
| Vérifier à la visite | 42 % | `iris.851910303.stationnement_reserve` | oui |
| Vérifier à la visite | 41 % | `iris.851910304.stationnement_reserve` | oui |
| Vérifier à la visite | 36 % | `iris.851910502.stationnement_reserve` | oui |
| Vérifier à la visite | 31 % | `iris.851910304.menages_sans_voiture` | oui |
| Vérifier à la visite | 28 % | `iris.851910102.menages_sans_voiture` | oui |
| Vérifier à la visite | 16 % | `iris.menages_commune.menages_sans_voiture` | oui |
| Vérifier à la visite | Impulsyon (sans chiffre) | `doc.reseau.identite` | oui |
| Méthode | 2022, 2020 à 2024 | millésime `mobpro.*` / `iris.*` | oui |
| Méthode | 15 ans ou plus | population de `mobpro.modes.*` | oui |
| Méthode | 150 lignes d'échantillon | règle de sélection du repère (section 4 bis) | oui |
| Méthode | 85 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | 2025 (BPE) | source de `acces.*` / `iris.<code>.panier_500m` | oui |

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant.**
   - Emplacement : section « Un plein qui a changé de prix », après les hypothèses.
   - Étape manuelle : aucune.
   - À faire : afficher les hypothèses et la date des prix dans la légende.
2. **Carte de la part de la voiture par secteur (IRIS).**
   - Emplacement : section « Des secteurs où l'on marche pour aller travailler ».
   - Étape manuelle : aucune pour la production. Utiliser les classes automatiques (`--classes auto`) et repérer par numéros, avec leur liste (`--reperes`), les secteurs cités : Pentagone Sud-Ouest, Les Halles, Zone Rurale-L'Annexe, Gare SNCF, Pyramides-Jean Yole, Garenne. Les libellés ne se posent à la main que pour une version soignée.
   - Le tableau accessible des secteurs est produit avec la carte. Le millésime 2022 doit figurer sur la carte.

**Vérifications en attente qui concernent des faits utilisés**

- **`iris.ecart_voiture`** : relire les libellés d'IRIS cités avant publication. Il s'agit de Pentagone Sud-Ouest, Les Halles, Pentagone Nord, Garenne, Liberté, La Vigne aux Roses, Pyramides-Jean Yole, Gare SNCF, La Courtaisière, Mon Repos-Terres Noires-Forges-Branly, La Généraudière-L'Angelmière et Zone Rurale-L'Annexe.
- **`mobpro.voiture_selon_destination`** : relire l'intérêt du découpage « travaille dans la commune / ailleurs ». Non bloquante.
- **`carburant.evolution`** : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication. Si les prix changent, mettre à jour le chapeau, la première section et le tableau.

**Doutes de lecture**

- **Deux secteurs « gare ».** « Gare SNCF » (851910802) et « Gare SNCF-Sacré-Cœur » (851910201) sont deux secteurs distincts. L'article les distingue, mais les libellés risquent d'être confondus par le lecteur : à relire.
- **Composition de l'unité urbaine.** Parmi les actifs qui travaillent à La Roche-sur-Yon, 34 % habitent la commune et 66 % habitent hors de l'unité urbaine 85501. Ces deux parts semblent couvrir tout l'ensemble, ce qui laisse penser que l'unité urbaine ne compte que La Roche-sur-Yon. La composition n'est pas dans le dossier et l'article n'en dit rien. À vérifier : si c'est le cas, « hors de l'unité urbaine » pourrait s'écrire plus simplement « hors de la commune ».
- **Phrase sur Impulsyon.** Le conseil de regarder lignes et horaires ne donne aucune desserte ni fréquence. Le site officiel du réseau n'étant pas vérifié, aucun lien n'est donné.

---

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| 1. Raisonnement, bloquante (stationnement attribué aux secteurs où la voiture « recule ») | « Les secteurs où la voiture recule ont souvent une contrepartie : la place de stationnement. » | « Dans plusieurs secteurs, la place de stationnement est loin d'être la règle. » Je n'ai pas repris la correction proposée (« Les secteurs centraux… »), parce que le dossier ne dit pas quels secteurs sont centraux et que « contrepartie » garde l'idée de cause. La nouvelle phrase décrit seulement la mesure. La liste des quatre secteurs reste exacte : tous sont sous la moitié des ménages. |
| 2. Conclusion, bloquante (« la place de la voiture dans le secteur », « Vous y verrez ») | « Vous y verrez ce qui se trouve à proximité et la place de la voiture dans le secteur, mais aussi la chaleur de l'été ou les risques à l'adresse. » | « Les services à proximité, l'équipement automobile des ménages du secteur, la chaleur de l'été ou les risques à l'adresse peuvent peser dans votre choix. » La phrase nomme ce qui peut compter dans le choix, comme le permet la capacité « Examen d'une adresse », sans promettre d'affichage. « Équipement automobile des ménages » écarte toute confusion avec les parts de la voiture par secteur. |
| 3. Raisonnement, a_revoir (lecture de l'écart comme effet d'un déménagement) | « Le chiffre suivant intéresse ceux qui hésitent entre la ville et une adresse plus éloignée. » | Phrase supprimée. La description chiffrée qui suit est conservée. |
| 4. Lisibilité, a_revoir (précaution méthodologique dans le récit) | « Ces deux observations se lisent l'une après l'autre. Rien ne dit quelle part, dans un secteur donné, travaille sur place. » | Phrases supprimées. Les groupes sont nommés exactement et la limite figure dans la méthode (« Groupes comparés »). |
| 5. Lisibilité, a_revoir (La Courtaisière omise) | « - Mon Repos-Terres Noires-Forges-Branly : 15 % des adresses. » | « - La Courtaisière : 13 % des adresses. / - Mon Repos-Terres Noires-Forges-Branly : 15 %. » Ligne ajoutée en C (`iris.851911004.panier_500m`) et libellé ajouté à la vérification `iris.ecart_voiture` en D. |
| 6. Raisonnement, a_revoir (« pas significatifs ») | « les petits écarts entre secteurs ne sont pas significatifs » | « les petits écarts entre secteurs ne doivent pas être surinterprétés » |
| 7. Lisibilité, a_revoir (« les 85 communes » présentées comme toutes les communes principales) | « Ce sont les 85 communes de France métropolitaine qui sont la plus grande de leur unité urbaine […]. Elles comptent de la moitié au double des actifs de La Roche-sur-Yon, avec un échantillon minimal. » | « Ce sont les communes de France métropolitaine qui sont la plus grande de leur unité urbaine […]. Elles comptent de la moitié au double des actifs de La Roche-sur-Yon, avec au moins 150 lignes d'échantillon, La Roche-sur-Yon exclue : 85 communes au total. » Ligne ajoutée en C pour le seuil de 150 lignes. |