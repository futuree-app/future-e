# Lot D — Trajectoires climatiques (chaleur) : l'écart au projet vs la vérification du logement

> **Pour l'exécutant :** implémenter tâche par tâche en TDD. Spec source : la roadmap du lot C
> (`docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md`, §D) + la direction du porteur
> (2026-07-24) tranchée dans ce plan.

**Objectif :** quand le lecteur a déclaré `faible_chaleur` et que la chaleur future de la commune est
matériellement défavorable, le dossier doit le lire comme un **écart au projet** (`mismatch`, section
« Ce qui correspond moins bien », orientation `arbitration`), **pas** comme un constat territorial
« au-delà de vos priorités » (`verification`). Le lot D distingue proprement **la contradiction avec une
priorité** (mismatch) du **phénomène important non relié à une priorité** (verification), et du **contrôle
du logement** (action au grain adresse, jamais un second fait qui doublerait la carte).

**Le bug observé (2026-07-24).** Projet « grande ville animée en Occitanie, bon bassin d'emploi, éviter les
fortes chaleurs ». Toulouse (9 j > 35 °C, 44 nuits tropicales en 2050) : la chaleur tombait en « À contrôler
avant de vous engager » (verification), et le verdict lisait « Correspondance favorable ». Faux : la priorité
clé du lecteur n'est pas satisfaite.

## Contraintes globales (les 8 invariants du porteur + 3 précisions vérifiées — valent pour TOUTES les tâches)

1. `faible_chaleur` déclarée (poids ≥ 2) + niveau futur **défavorable** (`projete >= seuil`, `notable`) → **mismatch**.
2. Le mismatch est le **seul signal autonome** sur cette dimension (une dimension, un signal — jamais un
   mismatch ET une verification chaleur en même temps).
3. Le contrôle du logement est conservé comme **action/renvoi** (grain adresse), porté par une composition,
   jamais comme un second fait visible qui doublerait la dimension.
4. **Seule la partie mismatch influence l'orientation** (criteria-registry : outcome `mismatch`, pas `verification`).
5. `faible_chaleur` **non déclarée** + niveau défavorable → **verification** territoriale (voir DÉCISION D-2 :
   aujourd'hui il n'y a AUCUN fait chaleur dans ce cas ; c'est une addition).
6. `alignment` (chaleur favorable) **uniquement** avec **double gate** niveau futur × trajectoire.
7. Une **métrique thermique défavorable oppose un VETO ABSOLU** à l'alignment (jours OU nuits défavorable suffit).
8. Corriger l'**intro de section** indépendamment du lot D (« Au-delà de vos priorités… » est faux dès qu'une
   verification touche une priorité).

**Précisions vérifiées dans le code (2026-07-24) :**
- **P-1.** Il n'existe **aucun `VerificationFact` chaleur au grain logement** à absorber. Le confort d'été
  (orientation, étage, inertie, ventilation) est le **module Logement**, atteint par une action/lien
  (« Regardez comment le logement tient l'été »). La composition porte donc **le mismatch commune + une
  action**, pas deux faits.
- **P-2.** `faible_chaleur` n'a **aucun rang national** (absent de `MISMATCH_RANK_KEYS`, comparateur-scores.ts).
  `ClimatAxe` porte `projete` (niveau 2050), `anomalie` (trajectoire) et `notable` (`projete >= threshold`),
  mais **pas de percentile opposable**. Donc : le **mismatch** (niveau défavorable) ne demande AUCUNE donnée
  nouvelle ; l'**alignment favorable** (double gate, « trajectoire favorable selon un rang ») exige un rang
  chaleur à **peupler** — c'est l'increment 2, différé, comme le lot C+.
- **P-3.** Un `MismatchFact` **n'a pas de champ `action`** (doctrine « le constat est établi, rien à
  vérifier »). La chaleur est l'exception (niveau établi + atténuation à contrôler au logement) → l'action
  est portée par une **composition** (DÉCISION D-1, reco).

**Vérifs de fin de chaque tâche :** `npx tsc --noEmit` = 0 ; `eslint` = 0 sur le périmètre ;
`node --test --experimental-strip-types "src/**/*.test.ts"` tout vert ; sonde `probe-conclusion.ts` si le
verdict change (déterministe).

## DÉCISIONS à trancher au fil de l'exécution

- **D-1 (porteur du contrôle logement).** Reco : **composition « confort thermique futur »** (garde la
  doctrine « mismatch sans action » intacte, extensible quand le grain logement deviendra un vrai fait).
  Alternative écartée sauf blocage : champ `action` optionnel sur le MismatchFact chaleur. À reconfirmer en Task 2.
- **D-2 (chaleur non déclarée).** Faut-il AJOUTER une verification chaleur territoriale pour les lecteurs qui
  n'ont pas déclaré `faible_chaleur` (aujourd'hui : aucun fait) ? Cohérent avec la section « constats établis
  pour ce lieu » (comme argiles/PPR), mais montre la chaleur à qui ne l'a pas demandée. À trancher en Task 3.

## La table de vérité (priorité `faible_chaleur` déclarée)

| Niveau futur (`projete`) | Trajectoire (`anomalie`, rang) | Résultat |
|---|---|---|
| Défavorable (`notable`) | quelle qu'elle soit | **`mismatch`** (increment 1) |
| Sous le seuil | hausse parmi les plus contenues (rang favorable) | `alignment` possible (increment 2) |
| Sous le seuil | hausse ordinaire | `neutral` |
| Sous le seuil | forte hausse | `neutral` (jamais alignment) |
| Donnée insuffisante | — | `uncertain` |

**Veto absolu :** un niveau futur défavorable interdit tout alignment, même si la hausse relative est modérée.
Jours diurnes ET nuits tropicales évalués ensemble : l'une défavorable suffit au veto ; toutes doivent être
favorables pour un alignment.

---

## Carte des fichiers

- `src/lib/decision/materiality-rules.ts` — **modifier** : `ruleChaleur` (émet un mismatch quand déclarée +
  défavorable ; verification sinon selon D-2).
- `src/lib/decision/decision-fact.ts` — **modifier si D-1 = action-sur-mismatch** (sinon inchangé).
- `src/lib/decision/fact-composition.ts` + `fact-compositions.ts` — **modifier** : nouveau patron
  « confort thermique futur » (mismatch chaleur + action logement absorbée/portée).
- `src/components/report/DossierDecisionSection.tsx` — **modifier** : intro de section (Task 3).
- `src/lib/comparateur-scores.ts` + `scripts/populate-mismatch-rank.mts` — **modifier (increment 2)** :
  peupler un rang chaleur.
- Tests : `materiality-rules.test.ts`, `fact-compositions.test.ts`, `conclusion-plan.test.ts`,
  `decision-assembler.test.ts`.

---

## Task 1 : la chaleur défavorable sur priorité déclarée devient un MISMATCH

**Files :** `src/lib/decision/materiality-rules.ts` (`ruleChaleur`, ~ligne 165) ; test `materiality-rules.test.ts`.

**Interfaces :** `ruleChaleur.evaluate` rend `outcome: "mismatch"` + un `MismatchFact` (basis
`absolute_measure`, `projectKey: "faible_chaleur"`, `headlineSubject: "éviter les fortes chaleurs"`) quand
`faible_chaleur` déclarée (poids ≥ 2) et au moins un axe `notable`. Le `topic` reste « les fortes chaleurs ».

- [ ] **Step 1 — RED** (`materiality-rules.test.ts`) : projet `faible_chaleur` poids 3, `climat` avec
  `joursTresChauds.notable = true` (projete >= seuil). Attendre : `outcome === "mismatch"`, `facts[0].role
  === "mismatch"`, `basis.kind === "absolute_measure"`, `projectKey === "faible_chaleur"`,
  `headlineSubject` non vide. (Aujourd'hui : `role === "verification"`.)
- [ ] **Step 2 — Vérifier RED** : `node --test … materiality-rules.test.ts` → échoue (rôle verification).
- [ ] **Step 3 — GREEN** : dans `ruleChaleur`, remplacer la construction du `VerificationFact` par un
  `MismatchFact` quand déclarée + notable. Le `statement` garde la trajectoire (les phrases jours/nuits
  existantes) ; `basis: { kind: "absolute_measure", value: <projete pertinent>, unit: ?, conventionId: ? }`.
  ⚠️ `absolute_measure.unit` est aujourd'hui `"km"` SEUL (decision-fact.ts + assertFactValid). La chaleur est
  en JOURS/NUITS → il faut **étendre l'unité autorisée** (`"jours"`) dans le type ET dans `assertFactValid`,
  sinon la garde rejette (doctrine « seulement le productible » : on n'ajoute l'unité que parce qu'une règle
  la produit vraiment). Choisir la `value` (jours projetés, ou un index) et le `conventionId`
  (`climat-facts.ts` porte déjà une convention/millésime).
- [ ] **Step 4 — assertFactValid** : autoriser `unit: "jours"` pour `absolute_measure`. Test de garde.
- [ ] **Step 5 — Vérifier GREEN** + suite complète.
- [ ] **Step 6 — Orientation** : test `conclusion-plan.test.ts` ou `decision-assembler.test.ts` : avec ce
  mismatch, l'orientation devient `arbitration` et le héros nomme l'écart (« … correspond moins bien à …
  éviter les fortes chaleurs »), plus jamais « Correspondance favorable ». (Vérifie que criteria-registry
  compte bien `faible_chaleur` en mismatch et non en reserve.)
- [ ] **Step 7 — Commit** : `feat(chaleur): la chaleur défavorable sur priorité déclarée devient un mismatch`.

> NOTE : à ce stade l'action « Regardez comment le logement tient l'été » DISPARAÎT (un mismatch n'a pas
> d'action). Elle est restaurée en Task 2. Ne pas la bricoler ici.

---

## Task 2 : la composition « confort thermique futur » (porte le mismatch + l'action logement)

**Files :** `src/lib/decision/fact-composition.ts` (nouveau kind), `fact-compositions.ts` (le builder),
`materiality-rules.ts` (l'action à porter), rendu si besoin ; tests `fact-compositions.test.ts`.

**Interfaces :** un nouveau `FactComposition` `kind: "climate_comfort"` (ou réutilisation motivée d'un kind
existant), `displaySection: "mismatches"`, qui **absorbe le mismatch chaleur** (`absorbedFactIds`) et porte
l'**action logement** + la **limitation climat**. Le mismatch reste le signal qui gouverne l'orientation
(criteria-registry lit l'outcome de la règle, pas la composition).

- [ ] **Step 1 — Résoudre D-1** : composition (reco) vs action-sur-mismatch. Si composition : lire les 3
  kinds existants (`tradeoff`, `shared_evidence`, `grouped_verification`) — aucun ne colle (mismatch unique +
  action), donc **nouveau kind**. Structure cible (rendu) :
  ```
  Des étés plus difficiles à concilier avec votre projet
  À l'échelle de {commune} : les jours > 35 °C passeraient de X à Y, les nuits tropicales de A à B.
  Pour ce logement : le confort réel dépend de l'orientation, l'étage, l'inertie, les protections solaires.
  → Regardez comment le logement tient l'été   (ou, sans adresse : « Renseignez une adresse pour évaluer… »)
  ```
- [ ] **Step 2 — RED** (`fact-compositions.test.ts`) : sur un run où le mismatch chaleur est émis, le builder
  produit la composition `climate_comfort`, `displaySection: "mismatches"`, `absorbedFactIds` contient l'id du
  mismatch chaleur, et l'action logement est portée. Sans adresse (`hasAddress: false`), l'action bascule sur
  « Renseignez une adresse… ».
- [ ] **Step 3 — GREEN** : type + builder + `assertCompositionsValid`. L'absorption suit le modèle existant
  (l'assembleur retire les faits absorbés avant les caps).
- [ ] **Step 4 — Non-régression orientation** : la composition n'ajoute pas un second signal ; le mismatch
  absorbé reste dans `conclusionBasis` et compte pour l'orientation (invariant 4).
- [ ] **Step 5 — Vérifs + Commit** : `feat(chaleur): composition « confort thermique futur » (mismatch + action logement)`.

> NOTE exécutant : vérifier comment l'action « regardez le logement » / le renvoi au module Logement est
> construit aujourd'hui (dans le VerificationFact de ruleChaleur, champ `action` + `href`). La composition le
> reprend ; `hasAddress` (ModuleFacts) décide de l'action alternative.

---

## Task 3 : chaleur non déclarée → verification (D-2) + l'intro de section corrigée

**Files :** `materiality-rules.ts` (`ruleChaleur` applicabilité), `DossierDecisionSection.tsx` (SECTION_INTRO).

- [ ] **Step 1 — Intro de section (indépendant, quick win)** : dans `DossierDecisionSection.tsx`, remplacer
  `SECTION_INTRO.verifications` (« Au-delà de vos priorités, ces constats sont établis pour ce lieu. ») par une
  formulation qui ne prétend pas l'indépendance au projet, ex. : « Ces constats sont établis sur ce lieu. Leur
  effet concret reste à contrôler avant de vous engager. » (Pas de test — chaîne de présentation ; vérifier à
  l'écran.) Commit possible seul.
- [ ] **Step 2 — D-2** : trancher si `ruleChaleur` produit une `verification` territoriale quand
  `faible_chaleur` n'est PAS déclarée (aujourd'hui : `not_applicable`, aucun fait). Si OUI : la règle s'évalue
  indépendamment de la déclaration, rend `verification` (non déclarée) / `mismatch` (déclarée + défavorable).
  Tests des deux branches. Si NON : statu quo (aucun fait non déclaré), documenter le choix.
- [ ] **Step 3 — Vérifs + Commit**.

---

## Increment 2 (DIFFÉRÉ) — l'alignment favorable de chaleur (double gate)

**Bloqué par la donnée.** Exige un **rang de trajectoire chaleur opposable** (P-2), qui n'existe pas : il faut
l'ajouter comme le lot C+ (étendre `mismatchRawScore`/`MISMATCH_RANK_KEYS` pour une métrique chaleur, relancer
`populate-mismatch-rank.mts`). C'est un **contrat**, pas une tâche prête :

- Une fois le rang présent : `alignment` chaleur SEULEMENT si (a) niveau futur NON défavorable (`!notable`
  sur les deux axes) ET (b) trajectoire favorable selon le rang ET (c) **aucune** métrique thermique
  défavorable (veto absolu). Idéalement jours + nuits sous une composition unique « confort thermique futur »
  (côté favorable), symétrique de la carte négative.
- **Gate positive prudente** : juste sous le seuil (ex. 7 j > 35 °C, 24 nuits) n'est PAS une force. L'alignment
  exige un niveau bas ET une trajectoire favorable, pas seulement « sous le seuil d'alerte ».
- Formulations bornées à la mesure (jamais « il ne fera pas chaud ici » — toutes les communes chauffent).

---

## Auto-revue (couverture de la direction du porteur)

- Chaleur défavorable + priorité déclarée → mismatch → Task 1 ✅
- Un seul signal autonome sur la dimension (mismatch, pas mismatch+verification) → Task 2 (absorption) ✅
- Contrôle logement conservé comme action, absorbé dans une composition → Task 2 ✅
- Seule la partie mismatch influence l'orientation → Task 1/2 (tests non-régression) ✅
- Chaleur non déclarée → verification → Task 3 (D-2) ✅
- Alignment uniquement double gate + veto absolu → Increment 2 (différé, contrat) ✅
- Intro de section corrigée indépendamment → Task 3 Step 1 ✅
- Précisions P-1/P-2/P-3 → Contraintes globales ✅

**Décisions ouvertes :** D-1 (Task 2), D-2 (Task 3). **Bloqueur de données :** rang chaleur (increment 2).
