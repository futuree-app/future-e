# FUT-54 : un écart retenu n'est jamais passé sous silence par le verdict

**Date** : 11/10/2026 · **Branche** : `fix/fut-54-arbitrage-verdict` · **Base** : `origin/main` à `3b7b0056` (FUT-26 et FUT-67 fusionnés)

## 1. Le défaut, reproduit sur le moteur réel

Banc `/dev/dossier` (dossier de décision réel, sans appel au modèle), Paris 7e (`75107`), priorités : accès aux soins (3), vie locale (3), éviter les grandes villes (2).

| | Libellé | Héros |
|---|---|---|
| **Avant** (`main`) | Correspondance favorable | « Paris 7e Arrondissement répond à deux de vos priorités : l'accès aux soins et la vie locale. » |
| **Après** | Correspondance avec un écart | « Paris 7e Arrondissement répond à deux de vos priorités, et moins bien à une autre : une ville à taille humaine. » ; détail : « L'accès aux soins et la vie locale répondent à ce que vous avez demandé. Cet écart reste à peser… » |
| **Après**, Nantes (le héros à deux côtés tient) | Correspondance avec un écart | « Nantes répond à vos attentes pour l'accès aux soins et la vie locale, mais moins bien pour une ville à taille humaine. » |

Juste dessous, dans les deux cas : « Ce qui correspond moins bien : une métropole ». FUT-67 avait vu la variante « Signaux favorables » de la même branche (couverture partielle).

## 2. Où naît la contradiction

Chemin : Projet → Critères → Évaluations → Orientation → Verdict → Cartes.

1. **Évaluation des critères** : correcte. « Éviter les grandes villes » au poids 2 produit un fait `mismatch` de matérialité **secondaire** (`tier = weight >= 3 ? "structuring" : "secondary"`, même patron dans toutes les règles). Le critère a l'issue `mismatch`.
2. **Orientation** (`criteria-registry.ts`) : correcte au regard de son contrat. L'arbitrage exige un écart structurant ou deux secondaires ; un seul écart secondaire ne l'atteint pas, et un critère d'issue `mismatch` n'entre dans aucune branche de réserve. Avec au moins un critère favorable : `favorable`.
3. **Construction du verdict** (`conclusion-plan.ts`) : **c'est ici.** Les branches `favorable`, `minor_reserves` et `major_reserves` ne lisaient jamais `mismatchTotal` ni `mismatchShown`. Leur titre (« Correspondance favorable », « Bonne correspondance », « Signaux favorables », « semble bien correspondre ») promettait une correspondance que la carte suivante nuançait. La branche `neutral` avait été corrigée pour ce même cas (« on ne nie plus ce qu'on montre ») ; les trois autres non.
4. **Présentation** : le composant rend fidèlement le plan. Pas en cause.
5. **Compositions et plafonds** : pas en cause. `mismatchTotal` compte les faits émis (absorbés compris), `mismatchShown` les cartes (compositions comprises).
6. **Artefacts et caches** : ils figent le verdict du jour de leur génération (§ 6), mais le défaut est bien présent dans le moteur courant.

## 3. Le contrat retenu

**Quatre dimensions, et ce qui les porte déjà dans le modèle :**

- *Importance pour le lecteur* : le poids déclaré (1, 2, 3) et, pour une condition sans compromis, la confirmation (FUT-7) ;
- *Matérialité* : dérivée du poids (3 → structurant, 2 → secondaire, 1 → aucun fait) ;
- *Capacité* : trancher, apprécier, ne pas mesurer (FUT-45, FUT-7), inchangée ;
- *Orientation* : `criteria-registry`, inchangée.

**Pourquoi le seuil d'arbitrage ne change pas.** Un arbitrage dit une tension entre plusieurs attentes, à trancher par le lecteur. Un écart secondaire face à plusieurs correspondances n'en est pas une : c'est une correspondance avec une réserve reconnue. Transformer tout écart en arbitrage dramatiserait une préférence ordinaire ; le taire trompe. Le défaut n'était pas la règle de décision, c'était le verdict qui ne disait pas ce que la décision avait retenu.

**La priorité forte est déjà représentée.** Une priorité de poids 3 moins bien satisfaite produit un écart structurant, donc un arbitrage (vérifié sur le moteur réel). Aucune catégorie n'est ajoutée : le projet n'enregistre pas d'autre degré.

**Les sept situations :**

| Situation | Ce que produit le moteur | Verdict |
|---|---|---|
| 1. Favorable, sans écart | `favorable` | inchangé : « Correspondance favorable » / « Bonne correspondance » |
| 2. Favorable avec un écart secondaire | `favorable` (ou `minor_reserves` positif) | **« Correspondance avec un écart »** (couverture complète) ou **« Lecture partielle, avec un écart »** (partielle), héros qui dit les deux côtés, ton neutre |
| 3. Arbitrage réel (deux écarts secondaires, ou un structurant) | `arbitration` | inchangé : l'écart nommé, puis les correspondances |
| 4. Priorité forte (poids 3) moins bien satisfaite | écart structurant → `arbitration` | inchangé, l'écart nommé en tête |
| 5. Condition sans compromis contredite | `incompatible` | inchangé, prioritaire |
| 6. Condition sans compromis non examinée | `condition_to_confirm` | inchangé (l'écart y était déjà dit) |
| 7. Lecture insuffisante | `indeterminate` / couverture partielle | inchangé ; avec écart, le détail garde « La lecture reste incomplète » |

**Règle implémentée** (`avecEcartReconnu`, appliquée à la sortie de `verdictPresentation`), pour les orientations `favorable`, `minor_reserves` et `major_reserves`, dès que `mismatchTotal > 0` :

- si le verdict **présente une correspondance** (ton positif, ou libellé « Bonne correspondance », « Correspondance favorable », « Signaux favorables ») :
  - **libellé qui garde la couverture** (revue du 11/10) : « Correspondance avec un écart » si la lecture est complète, « Lecture partielle, avec un écart » sinon (FUT-45) ; ton neutre ;
  - **héros à deux côtés quand il tient** : « {lieu} répond à vos attentes pour {A} et {B}, mais moins bien pour {écart}. », si les correspondances nommées (alignements structurants affichés, deux au plus) couvrent **tout** le compte favorable et si la phrase tient en 130 caractères ;
  - **sinon** : « {lieu} répond à N de vos priorités, et moins bien à une autre : {écart}. », et les correspondances sont nommées **au détail** quand elles couvrent tout le compte (« L'accès aux soins et la vie locale répondent à ce que vous avez demandé. ») ;
  - **aucune correspondance fabriquée** : sans critère favorable (entrée incohérente), le héros dit l'écart seul (« {lieu} répond moins bien à une de vos priorités : {écart}. ») ; plus de `Math.max(favorableCount, 1)` ;
  - le détail de repli (« Une partie de vos priorités va dans ce sens ») devient « Cet écart reste à peser face à ce qui correspond : futur•e ne le compense pas. » ; un détail porteur (lecture incomplète, constats à contrôler) reste ;
- si le verdict est **déjà centré sur une réserve** (« à nuancer », « à confirmer », « partielle ») : le héros reste, le détail ajoute l'écart (« En revanche, … » après un « Par ailleurs » existant).

Le sujet vient des cartes affichées (`mismatchCandidates`, compositions comprises) sous la double gate de `nameIssues` (deux sujets, 130 caractères). Une cause commune (`shared_evidence`) ne se nomme pas comme « une autre » priorité : la phrase reste vraie sans sujet. L'orientation n'est pas modifiée.

## 4. Cas vérifiés sur le moteur réel (banc `/dev/dossier`)

| Commune · priorités | Orientation | Verdict après |
|---|---|---|
| Paris 7e · soins 3, vie locale 3 | favorable | Correspondance favorable (inchangé) |
| Paris 7e · soins 3, vie locale 3, éviter grandes villes 2 | favorable | Correspondance avec un écart (correspondances au détail : 135 caractères à deux côtés) |
| Paris 7e · … + calme 2 | favorable | Correspondance avec un écart (trois priorités) |
| Paris 7e · éviter grandes villes **3** | arbitration | Arbitrage (inchangé) |
| Nantes · soins 3, vie locale 3, éviter grandes villes 2 | favorable | Correspondance avec un écart, héros à deux côtés |
| La Rochelle · mer 3, vie locale 2, éviter grandes villes 2 | favorable | Correspondance avec un écart |
| Nantes · soins 3, inondation 3, éviter grandes villes 2 | major_reserves | À nuancer ; le détail dit l'écart |
| Nantes / La Rochelle · mer confirmée sans compromis | condition_to_confirm | Condition ouverte (inchangé) |
| Lège-Cap-Ferret · feu 3, vie locale 2 | arbitration | Arbitrage (inchangé) |

Dossier d'adresse : même enrobage (scope `commune+adresse`), couvert par les tests d'assembleur ; non rejoué sur le banc, qui n'assemble que le grain commune.

## 5. Tests

`src/lib/decision/fut54-verdict-ecart.test.ts` (17 tests, dont 5 issus de la revue : héros à deux côtés, correspondances jamais nommées à moitié, libellé de couverture, aucune correspondance fabriquée, longueur de l'ajout aux réserves) : orientation, cohérence titre / libellé / ton / détail, invariant sur cinq configurations, priorité forte, incompatibilité, critère non examiné, compositions absorbées et cause commune, stabilité sans écart, réserve centrale, relation au lieu (FUT-26).

Régressions volontairement réintroduites : le `conclusion-plan.ts` de `main` fait échouer 7 tests ; nommer une cause commune, 1 ; « Par ailleurs » répété, 1 ; retour du `Math.max`, 1 ; correspondances nommées à moitié, 1 ; libellé de couverture effacé, 2.

## 6. Artefacts de décision et synthèses

Un artefact fige le `Dossier` entier, verdict compris (`decision-artifact.ts`), et la page sert la version figée dès qu'elle existe. `PRODUCT_CONVENTIONS_VERSION` est enregistrée mais ne déclenche aucune péremption : elle n'est pas montée.

| Dossier | Comportement |
|---|---|
| Nouveau, acheté après déploiement | L'artefact du webhook porte le verdict corrigé |
| Ancien, sans artefact | Le rattrapage de `/rapport` le fige à l'ouverture, avec le moteur du jour et la date du jour |
| Ancien, artefact prêt | **Inchangé**, daté du jour de sa génération. Aucune régénération silencieuse |
| Projet modifié matériellement | Nouvelle version sur « Mettre à jour l'analyse », avec le verdict corrigé ; la précédente reste lisible |

La conclusion rédigée (`ConclusionRedigee`) a pour empreinte le plan : un dossier assemblé en direct dont le verdict change la régénère une fois ; un artefact figé garde la sienne.

## 7. Limites et décisions ouvertes

- **Les artefacts déjà prêts gardent l'ancien verdict.** Les corriger exigerait une nouvelle version que le lecteur n'a pas demandée. À trancher : signaler sur ces dossiers qu'une lecture plus récente existe, sans les réécrire ?
- **Le héros à deux côtés dépend de la longueur** : un nom de commune long (« Paris 7e Arrondissement ») le fait passer à la variante « N de vos priorités », correspondances au détail. Le contrat ne fixe aucune longueur au détail ; l'ajout aux réserves est une phrase courte, testée sous 130 caractères.
- **« Une version plus récente peut être réalisée »** : l'idée d'une indication discrète sur les artefacts prêts relève du versionnement des rapports, pas de FUT-54.
- **Un écart de poids 1** ne produit aucun fait : il n'entre ni dans les cartes ni dans le verdict, par construction des règles. Inchangé.
- **Les libellés « Correspondance avec un écart » / « Lecture partielle, avec un écart »** sont des conventions éditoriales, à relire avec FUT-87 pour la hiérarchie visuelle.
