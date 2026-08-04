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
| **Sauf pour 45 communes : le `null` de PLM n'est pas un non-pôle** | Les 45 arrondissements de Paris, Lyon et Marseille portent `equip: null`, et leurs communes-mères sont **absentes de l'index**. Le `null` y signifie « hors référentiel », jamais « offre insuffisante ». **Établi le 04/08/2026, voir la section 7.** |

**Conséquence pour la décision** : elle ne dépend plus de l'issue de la recherche. Voir la dernière
section. Le remplacement par `agri.equip` reste le bon geste, à condition de traiter les 45
arrondissements avant de le brancher.

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

## 7. Instruction d'`agri.equip` avant exposition (04/08/2026)

Les trois points laissés ouverts en section 5 sont instruits. Deux se referment, le troisième ouvre
un défaut qui n'avait pas été vu.

**Le millésime : 2021, et il est écrit dans le nom du champ.** `scripts/fetch-communes-vivabilite.mjs:32`
demande `niveau_de_centres_dequipements_et_de_services_des_communes_2021`. Le 2025 annoncé par
l'ANCT est la date de mise à jour de sa fiche, pas celle du socle. L'index sert donc bien le socle
INRAE-CESAER 2021, cohérent avec les décomptes appariés de la section 5.

**Ce que classent les niveaux 1 à 4** : la table de la section 5 les donne, et la distribution
mesurée dans l'index les confirme classe par classe.

| Niveau | Sens ANCT | Communes | Part |
|---|---|---:|---:|
| `null` | non-pôle | 24 027 | 69,07 % |
| 1 | centres locaux | 7 001 | 20,12 % |
| 2 | centres intermédiaires | 2 879 | 8,28 % |
| 3 | centres structurants | 742 | 2,13 % |
| 4 | centres majeurs | 139 | 0,40 % |

**Le pouvoir d'arbitrage progresse, sans devenir bon.** Deux communes tirées au hasard tombent dans
la même classe **52,5 %** du temps, contre **64,3 %** pour le champ des 20 minutes qu'il remplace.
C'est un gain réel, et il faut le dire tel qu'il est : une commune sur deux reste indistinguable
d'une autre sur ce critère, parce que 69 % du territoire est non-pôle. `agri.equip` mesure une
**centralité**, pas une proximité vécue. Le libellé devra dire centralité.

**Le défaut qui n'avait pas été vu : les 62 communes ne sont pas là où on les cherchait.** Elles
n'ont pas de `viv` manquant ; elles ont `viv.eloignement = null`, et `agri` est présent sur les
34 788 communes sans exception. Le remplacement **comble donc le trou** au lieu de le déplacer.

Mais en les listant, elles se nomment : **Marseille 1er, 2e, 3e… arrondissement**. Sur les 62, 60
sont des arrondissements. Et en élargissant, **les 45 arrondissements de Paris, Lyon et Marseille
portent tous `equip: null`**, pendant que les communes-mères `75056`, `69123` et `13055` sont
absentes de l'index. Or les 48 autres villes de plus de 100 000 habitants sont toutes classées au
niveau 4.

**Ce `null` ne veut donc pas dire la même chose selon la commune.** Pour 24 027 d'entre elles, il
dit « non-pôle, offre insuffisante » ; pour 45, il dit « cette commune n'existe pas dans le
référentiel ANCT, qui classe la ville entière et non ses arrondissements ». Branché tel quel,
`agri.equip` afficherait **Paris 15e (233 000 habitants) comme une commune à l'offre insuffisante**,
au même rang qu'un village de 200 habitants. C'est le patron d'`AGENTS.md` : un champ pré-calculé
qui continue de répondre à une question qu'on ne pose plus.

**Ce qu'il faut faire avant de brancher** : donner aux 45 arrondissements le niveau de leur
commune-mère, qui est le niveau 4. Ce n'est pas une commodité : un arrondissement appartient au pôle
majeur que forme sa ville, et l'échelle mesure la centralité dans le bassin, pas le nombre de
commerces au coin de la rue. À défaut, les traiter en absence attestée, jamais en non-pôle.

## 8. Ce qui a été livré (04/08/2026)

Le porteur a tranché : **remplacement par `agri.equip`**, et non retrait sec de la ligne.

**Le rang.** `src/lib/centralite-services.ts`, lib pure appelée par `subScore` ET par
`mismatchRawScore` : les deux lisent désormais la même fonction, donc la copie fidèle que le test de
parité surveillait ne peut plus diverger. Cinq niveaux, rangs **20 / 50 / 70 / 87 / 100**. Les écarts
décroissent volontairement : passer d'une commune sans offre suffisante à un centre de proximité,
c'est faire ses courses sur place ; passer d'un centre structurant à un centre majeur ajoute des
services rares qu'on utilise quelques fois par an. Un espacement régulier aurait affirmé que les cinq
classes sont à distance égale, ce qu'une échelle ordinale ne dit jamais.

**Les 45 arrondissements, et une erreur de comptage qui valait diagnostic.** La première mesure en
annonçait 36 : l'expression `^(751|6938|132)\d\d$` ratait **les neuf arrondissements de Lyon**, dont
le code fait cinq caractères avec quatre de préfixe (`69381`) là où Paris et Marseille en ont trois
(`75115`, `13201`). Le bug de comptage était le bug du correctif. Le total réel est **45** : Paris 20,
Lyon 9, Marseille 16, et les 45 portent « Arrondissement » dans leur nom, donc aucune commune
ordinaire n'est capturée.

**Deux absences, pas une.** `equip: null` est une catégorie (non-pôle, rang 20) ; la clé **absente**
veut dire que la donnée n'a pas été chargée et rend `null`. Les confondre aurait classé une commune
non lue au rang d'un non-pôle établi, ce que `comparateur-scores.test.ts` interdit pour tous les
critères. Sur l'index réel le second cas n'arrive jamais.

**Mesuré après branchement, sur les 34 788 communes :**

| | avant | après |
|---|---:|---:|
| Communes à égalité, deux tirées au hasard | 64,3 % | **52,3 %** |
| Palier intermédiaire | **vide** (0 commune) | 2 879 communes |
| Couverture | 34 726 (62 trous) | **34 788** |
| Paris 15e, Lyon 3e, Marseille 1er | non classés | rang 100, comme Bordeaux |

**Le libellé cesse de promettre une proximité.** « Services » devient « Niveau de services », et les
paliers passent de « Services proches / Accès intermédiaire / Services éloignés » à « Pôle de
services / Centre de proximité / Hors pôle de services ». La donnée dit ce que la commune
**concentre** pour son bassin, jamais la distance qu'un habitant parcourt : un village à cinq minutes
d'un centre structurant reste un non-pôle, et il a raison de l'être.

**Les points de citation hors comparateur, traités par la même règle.** Le champ des 20 minutes
alimentait encore deux surfaces qui affirmaient « X % des habitants vivent à plus de 20 min des
**services essentiels** » : la carte « Accès aux services » du rapport Territoire
(`QuartierClimatData.tsx`) et le contexte donné au modèle dans `/api/ask`. Les deux sont retirées.
Dire « services essentiels » d'une donnée qui compte peut-être des médecins, c'est affirmer au-delà
de la preuve, et un contexte qu'on ne sait pas nommer ne se donne pas à un modèle : il ne se tait
pas, il extrapole. La carte reviendra quand le niveau de centralité sera câblé jusqu'à cette page ;
il vit dans l'index du comparateur, pas dans le jeu ADEME que le rapport lit.

**Ce qui reste vrai et inchangé** : `agri.equip` mesure une centralité, pas une proximité vécue, et
une commune sur deux reste indistinguable d'une autre sur ce critère, parce que 69 % du territoire
est non-pôle. C'est un gain réel sur les 64,3 % d'avant, et ce n'est pas un bon pouvoir d'arbitrage.

## Annexe : ce qui a été vérifié, et comment

| Affirmation | Moyen | Statut |
|---|---|---|
| L'ADEME ne documente pas le champ | lecture du schéma et de la note de méthode du dataset | établi |
| L'indicateur ANCT porte sur la santé | fiche publique de l'Observatoire des Territoires | établi |
| Concordance des ordres de grandeur | calcul pondéré sur l'index contre repères publiés | faisceau |
| Troncature du nom de champ | longueur comparée des champs du dataset | **infirmé** |
| Signature sanitaire par corrélation | corrélation avec l'APL contre corrélation avec la densité | **non concluant** |
| `agri.equip` = niveau de centres ANCT | appariement des décomptes par classe | établi |
| `null` de `agri.equip` = non-pôle | définition ANCT + appariement des décomptes | établi, **sauf PLM** |
| Millésime `agri.equip` = 2021 | nom du champ demandé à l'ADEME (`…_des_communes_2021`) | établi |
| Les 62 communes sont des `viv.eloignement` nuls, pas des `viv` absents | comptage sur l'index | établi |
| `agri` présent sur 34 788 / 34 788 communes | comptage sur l'index | établi |
| Les 45 arrondissements PLM ont `equip: null`, mères absentes de l'index | comptage sur l'index | établi |
| Égalité de deux communes : 52,5 % (`equip`) contre 64,3 % (`eloignement`) | somme des carrés des fréquences de classe | établi |
