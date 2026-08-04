# Recherche de la source primaire du critère « accès aux services »

**Horodatage** : 2026-08-04 · **Branche** `main` = `edda76c` · **Lecture seule** : aucun fichier du
produit n'a été modifié par cette recherche.

**Commande** : établir la source primaire du champ
`part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services`, qui alimente le
critère `acces_services`, afin de décider si ce critère peut être sauvé comme signal négatif
unilatéral, remplacé, ou retiré. Suite de l'observation consignée dans `docs/handoff/CURRENT.md`.

---

## Ce qu'il faut retenir en une minute

| | |
|---|---|
| **La source utilisée ne documente pas le champ** | Le dataset ADEME `data_communes` déclare 7 sources ; aucune ne couvre cet indicateur. Le champ n'a ni titre ni description dans le schéma. **Établi.** |
| **Un indicateur homonyme existe à l'ANCT, et il porte sur la SANTÉ** | « Part de la population éloignée de plus de 20 minutes d'au moins un des services **de santé de proximité** », Observatoire des Territoires. Le catalogue n'a pas de variante « tous services ». **Établi.** |
| **Les ordres de grandeur concordent avec cet indicateur** | 0,83 % de la population nationale (repère publié : 0,5 %) ; 11,8 % dans les communes de moins de 25 hab/km² (repère : ~8 %). **Faisceau fort, pas une preuve.** |
| **L'identité formelle n'est PAS établie** | Deux tests discriminants ont échoué (voir plus bas). Il manque la comparaison des valeurs commune par commune. |
| **`agri.equip` est identifié, et il est complet** | « Niveau de centres d'équipements et de services des communes » (INRAE-CESAER / ANCT). Décomptes appariés à l'unité près. `null` = **non-pôle**, catégorie explicite : la couverture est de 100 %, pas de 30,9 %. **Établi.** |

**Conséquence pour la décision** : elle ne dépend plus de l'issue de la recherche. Voir la dernière
section.

## 1. La source utilisée ne documente pas le champ

Le dataset interrogé est `https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462`
(ADEME, `data_communes`, mis à jour le 2025-12-10). Sa note de méthode déclare sept sources :
Observatoire des forêts (IGN), DREES (APL), FiLoSoFi (INSEE), Recensement de la population (INSEE,
« extraites par observatoire-des-territoires.gouv.fr »), Adonis (Solagro), Caisse des dépôts,
INERIS. **Aucune ne correspond à l'éloignement à 20 minutes**, ni au niveau de centres d'équipements.
Dans le schéma, le champ est de type `string`, sans `title` ni `description`.

Autrement dit : deux champs du produit viennent d'une source qui ne dit pas d'où ils viennent.

## 2. L'indicateur homonyme de l'ANCT porte sur la santé

L'Observatoire des Territoires (ANCT) publie
« **Part de la population éloignée de plus de 20 minutes d'au moins un des services de santé de
proximité** », rangé sous la thématique Santé. Le nom du champ ADEME est le même titre **sans**
« de santé de proximité ». Les recherches n'ont pas fait apparaître, dans ce catalogue, de variante
de cette formulation portant sur un panier plus large ; les autres indicateurs d'accès y ont une
forme différente (« Temps moyen d'accès aux services d'usage courant », exprimé en minutes, pas en
part de population).

## 3. Les ordres de grandeur concordent

Calcul sur l'index (`data/comparateur-index.json`, moyenne pondérée par la population) :

| | Mesuré dans l'index | Repère publié (INSEE / ANCT, millésime 2014, services de santé de proximité) |
|---|---|---|
| Part de la population nationale | **0,83 %** | 0,5 % |
| Communes de moins de 25 hab/km² | **11,81 %** | ~8 % |
| Rapport entre les deux | 14,2 | 16 |

La population couverte est de 61,9 millions d'habitants ; 3,5 millions sont sans donnée. Le profil
par densité est monotone et net : 11,81 % (moins de 25 hab/km²), 1,25 % (25 à 100), 0,15 % (100 à
1 000), 0,01 % (plus de 1 000).

L'écart avec les repères va dans le sens attendu d'un millésime plus récent. **C'est un faisceau, pas
une identification.**

## 4. Deux tests discriminants ont échoué, et il faut le dire

- **Troncature du nom : infirmée.** L'hypothèse était que « de santé de proximité » avait sauté sur
  une limite de longueur. Le champ fait 78 caractères, mais un autre champ du même dataset en fait
  **88** (`taux_dinferiorite_de_la_mediane_de_la_commune_par_rapport_a_la_mediane_nationale_percent`).
  Aucune limite à 80 n'a coupé quoi que ce soit. Le raccourcissement, s'il a eu lieu, est éditorial.
- **Corrélation avec l'accessibilité aux médecins : non concluante.** Si le champ mesurait la santé,
  il devrait suivre l'APL médecins (DREES, présent dans le même index). Mesuré sur 34 726 communes :
  `r = −0,254` avec l'APL, contre **`r = −0,338` avec le logarithme de la densité**. L'éloignement
  s'explique donc mieux par la ruralité que par l'offre de soins. L'APL moyen tombe bien de 3,11 à
  2,34 entre les communes à éloignement nul et les autres, mais cet écart est compatible avec
  n'importe quel panier de services, tous étant plus rares en zone peu dense.

**Ce qui manque pour conclure** : l'export commune par commune de l'indicateur de l'ANCT, à comparer
aux valeurs de l'index. L'Observatoire n'expose pas d'API publique (`api.observatoire-des-territoires.gouv.fr`
ne répond pas, `/api/indicateurs` renvoie 404) ; le téléchargement passe par le bouton « Télécharger »
de la fiche, donc par l'interface web. Une fois le fichier obtenu, la comparaison prend dix minutes
et tranche définitivement.

## 5. Prise ferme : `agri.equip` est identifié et complet

C'est le résultat le plus exploitable de cette recherche, et il était non demandé.

Le champ `agri.equip`, récupéré par `scripts/fetch-communes-vivabilite.mjs` et **jamais lu par une
seule ligne de code**, est l'indicateur « Niveau de centres d'équipements et de services des
communes » de l'Observatoire des Territoires (source : **INRAE-CESAER, ANCT**), une classification
automatique fondée sur la diversité des commerces et services.

| Classe | Définition ANCT | Communes (ANCT) | Communes (index) |
|---|---|---|---|
| Non-pôle | « équipements et services présents mais offre insuffisante » | 24 064 | **24 027** (`null`) |
| Centres locaux | offre de proximité quotidienne | 7 011 | **7 001** (niveau 1) |
| Centres intermédiaires | « une trentaine de commerces et services » | 2 880 | **2 879** (niveau 2) |
| Centres structurants | « une quarantaine d'équipements supplémentaires » | 742 | **742** (niveau 3) |
| Centres majeurs | « les services les plus rares » (spécialités médicales, tribunaux, universités) | 142 | **139** (niveau 4) |

L'appariement est à l'unité près sur trois classes ; les écarts résiduels s'expliquent par le
périmètre de l'index (34 788 communes, France métropolitaine, DROM exclus) contre celui de l'ANCT
(métropole et DOM).

**La réponse à la question qui décidait de tout** : le `null` des 69 % **signifie « non-pôle », une
catégorie explicite**, pas une donnée manquante. La couverture n'est donc pas de 30,9 % mais de
**100 %**, sur une échelle ordonnée à cinq états, documentée, publique, au grain commune, et déjà en
base. Il reste à vérifier que les 62 communes sans `viv` ne sont pas des trous réels de ce champ-là
aussi.

## 6. Ce que la recherche change pour la décision sur la ligne « Services »

**La décision n'a plus besoin d'attendre.** Les deux branches encore ouvertes mènent au même endroit :

- **Si le champ est l'indicateur de santé de proximité** : le critère « Services » est un doublon
  dégradé d'`acces_soins`, qui repose déjà sur l'APL de la DREES, un indicateur bien meilleur. Le
  libellé (« des services du quotidien accessibles », « La proximité des commerces et services du
  quotidien ») est alors franchement faux, et la ligne doit disparaître.
- **Si le champ est un panier plus large** : il reste un indicateur de queue de distribution, arrondi
  à une décimale, dont 80,1 % des communes marquent le plafond et dont le palier intermédiaire est
  vide. Le libellé de proximité reste faux, et la ligne reste incapable d'arbitrer.

La crainte du porteur, laisser « Services » dans la matrice en attendant une recherche indéfinie, est
donc levée : **rien n'oblige à attendre**. Ordre proposé, non tranché :

1. Retirer la ligne « Services » de la matrice payante et le critère du score, ou le remplacer
   immédiatement par `agri.equip`, qui mesure au grain commune ce que le libellé promettait.
2. Instruire `agri.equip` avant de l'exposer : ce que classent exactement les niveaux, le millésime
   servi par l'ADEME, et le traitement des 62 communes sans donnée.
3. Ne conserver le champ des 20 minutes que s'il est réidentifié, et alors seulement comme signal
   négatif unilatéral, jamais comme bonification.

## Annexe : ce qui a été vérifié, et comment

| Affirmation | Moyen | Statut |
|---|---|---|
| L'ADEME ne documente pas le champ | lecture du schéma et de la note de méthode du dataset | établi |
| L'indicateur ANCT porte sur la santé | fiche publique de l'Observatoire des Territoires | établi |
| Concordance des ordres de grandeur | calcul pondéré sur l'index contre repères publiés | faisceau |
| Troncature du nom de champ | longueur comparée des champs du dataset | **infirmé** |
| Signature sanitaire par corrélation | corrélation avec l'APL contre corrélation avec la densité | **non concluant** |
| `agri.equip` = niveau de centres ANCT | appariement des décomptes par classe | établi |
| `null` de `agri.equip` = non-pôle | définition ANCT + appariement des décomptes | établi |
