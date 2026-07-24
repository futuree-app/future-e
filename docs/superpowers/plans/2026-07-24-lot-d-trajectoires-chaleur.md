# Lot D — Trajectoires climatiques (chaleur) : l'écart au projet vs la vérification du logement (v2)

> **Pour l'exécutant :** implémenter tâche par tâche en TDD. Spec source : roadmap du lot C §D
> (`docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md`) + direction du porteur
> (2026-07-24) + revue (ChatGPT + Claude) intégrée dans cette v2.

**Objectif :** quand le lecteur a déclaré `faible_chaleur` et que la chaleur future de la commune est
matériellement défavorable, le dossier le lit comme un **écart au projet** (`mismatch`, « Ce qui correspond
moins bien », orientation `arbitration`), **pas** comme un constat territorial « au-delà de vos priorités »
(`verification`). Le lot D distingue proprement : **contradiction avec une priorité** (mismatch), **phénomène
important non demandé** (verification ambiante), **capacité du logement à atténuer** (action au grain adresse,
jamais un second fait qui doublerait la dimension).

**Le bug (2026-07-24).** Projet « grande ville animée en Occitanie, bon bassin d'emploi, éviter les fortes
chaleurs ». Toulouse (9 j > 35 °C, 44 nuits tropicales en 2050) : chaleur en « À contrôler avant de vous
engager » (verification), verdict « Correspondance favorable ». Faux : la priorité clé n'est pas satisfaite.

## Ce qui change entre v1 et v2 (revue intégrée)

- **La chaleur ne rentre PAS dans `absolute_measure`.** C'est bi-métrique (jours + nuits, deux seuils, un
  horizon). On crée une **base dédiée `climate_threshold`** (Task 0). [revue #1]
- **Conflit avec `seasonal_climate_tradeoff`** (qui associe déjà douceur favorable + chaleur + action) : à
  résoudre par une **priorité de patrons**, pas deux builders indépendants. Invariant : **une seule composition
  climatique visible par dossier pour cette dimension**. [revue #2]
- La composition doit garder le **mismatch nommable par le héros** (sinon absorbé de `shownFacts`) — exactement
  l'Issue 2 du lot C. [revue #3]
- Le **poids 1** est explicite dans la table de vérité (déclaré + défavorable + poids 1 → outcome mismatch,
  **aucun fait**, silencieux). [revue #5]
- L'**intro de section n'est PLUS à réécrire** : « au-delà de vos priorités » redevient VRAIE une fois la
  chaleur reclassée (aucune autre verification n'est une priorité déclarée). Le fix devient une **vérification**,
  pas une réécriture. [correction Claude #6]
- La verification **ambiante** (non déclarée) va dans une **règle séparée** — par clarté, **pas** pour un bug de
  comptes : `criteria-registry` n'agrège que les clés DÉCLARÉES, une évaluation non déclarée n'est jamais
  consultée. [correction Claude #4]

## Contraintes globales (invariants du porteur + précisions — valent pour TOUTES les tâches)

1. `faible_chaleur` déclarée (poids ≥ 2) + niveau futur **défavorable** (au moins un axe `notable`) → **mismatch**.
2. Le mismatch est le **seul signal autonome** sur cette dimension (jamais mismatch ET verification chaleur ensemble).
3. Le contrôle du logement est conservé comme **action/renvoi** (grain adresse), porté par une **composition**
   (D-1), jamais comme un second fait visible.
4. **Seule la partie mismatch influence l'orientation** (outcome `mismatch`, pas `verification`).
5. `faible_chaleur` **non déclarée** + défavorable → **verification ambiante** (règle séparée, D-2).
6. `alignment` (chaleur favorable) **uniquement** avec **double gate** niveau × trajectoire, **deux rangs
   distincts** jours/nuits (jamais un composite opaque). → increment 2, différé.
7. **Veto absolu** : une seule métrique thermique défavorable interdit l'alignment (jours OU nuits).
8. **Une seule composition climatique visible par dossier** pour la dimension chaleur/confort.

**Précisions vérifiées dans le code :**
- **P-1.** Aucun `VerificationFact` chaleur « au grain logement » à absorber : le confort d'été est le module
  Logement, atteint par une action/lien. La composition porte le mismatch commune + une action, pas deux faits.
- **P-2.** `faible_chaleur` n'a aucun rang national (absent de `MISMATCH_RANK_KEYS`) ; `ClimatAxe` porte
  `projete`, `anomalie`, `notable` (`projete >= threshold`), sans percentile. Le **mismatch** ne demande aucune
  donnée nouvelle ; l'**alignment favorable** exige des rangs à peupler → increment 2.
- **P-3.** Un `MismatchFact` n'a pas de champ `action`. L'action est portée par la composition (D-1).

**Vérifs de fin de tâche :** `tsc` 0 ; `eslint` 0 sur le périmètre ; `node --test --experimental-strip-types
"src/**/*.test.ts"` vert ; sonde `probe-conclusion.ts` si le verdict change.

## Table de vérité (priorité `faible_chaleur`)

| Poids | Niveau futur | Trajectoire (rang) | Outcome | Fait / carte |
|---|---|---|---|---|
| 0 (non déclarée) | défavorable | — | `verification` (règle ambiante, D-2) | verification, **aucun effet projet** |
| 1 | défavorable | — | `mismatch` | **aucun fait** (examiné, silencieux) |
| ≥ 2 | défavorable (≥1 axe `notable`) | — | `mismatch` | MismatchFact (`climate_threshold`), visible |
| ≥ 2 | sous le seuil (0 axe notable) | favorable sur les axes requis | `satisfied` | alignment (**increment 2**, rang requis) |
| ≥ 2 | sous le seuil | hausse ordinaire/forte | `neutral` | silencieux |
| ≥ 2 | donnée insuffisante | — | `uncertain` | silencieux |

**Veto absolu** : un niveau futur défavorable (≥1 axe notable) interdit tout alignment, quelle que soit la trajectoire.

## DÉCISIONS

- **D-1** — porteur du contrôle logement : **composition** (garde « mismatch sans action » intacte). Validée.
- **D-2** — verification ambiante non déclarée : **oui**, dans une **règle séparée** (`territoire.verification-chaleur-future`),
  qui ne s'applique QUE si `faible_chaleur` n'est pas matérielle. Confirmée.
- **Copie** — headlineSubject : « des étés supportables » (objet de projet) plutôt que « éviter les fortes
  chaleurs » (instruction). À faire passer par l'Editorial Writer au moment du rendu.

---

## Carte des fichiers

- `src/lib/decision/climat-facts.ts` — **modifier** : la fonction pure de classification confort (Task 0).
- `src/lib/decision/decision-fact.ts` — **modifier** : `ClimateThresholdBasis`, ajout à `MismatchBasis` (Task 0).
- `src/lib/decision/materiality-rules.ts` — **modifier** : `ruleChaleur` (mismatch déclaré, Task 1) ; `assertFactValid`
  (climate_threshold, Task 0) ; nouvelle règle ambiante (Task 4).
- `src/lib/decision/fact-composition.ts` + `fact-compositions.ts` — **modifier** : évolution de
  `seasonal_climate_tradeoff`, nouveau `climate_comfort`, priorité des patrons (Task 2).
- `src/lib/decision/conclusion-plan.ts` — **modifier** : les compositions climatiques nommables au héros (Task 3).
- `src/components/report/DossierDecisionSection.tsx` — **vérifier** l'intro (Task 5, sans doute no-op).
- `src/lib/comparateur-scores.ts` + `scripts/populate-mismatch-rank.mts` — **increment 2** : rangs jours/nuits.

---

## Task 0 : la base `climate_threshold` + le classifieur pur

**Files :** `decision-fact.ts` (type + union), `climat-facts.ts` (classifieur), `materiality-rules.ts`
(`assertFactValid`) ; tests `climat-facts.test.ts`, `materiality-rules.test.ts`.

**Interfaces produites :**
```ts
export type ClimateThresholdBasis = {
  kind: "climate_threshold";
  horizon: number;           // 2050
  referencePeriod: string;   // "1976-2005"
  conventionId: string;      // millésime de la convention climat
  trigger: "any";            // un axe défavorable suffit
  measures: Array<{ key: "days_over_35" | "tropical_nights"; projectedValue: number; threshold: number; unit: "days" | "nights"; isUnfavorable: boolean }>;
};
// classifyClimateComfort(climat) -> { verdict: "unfavorable" | "under_threshold" | "uncertain"; basis: ClimateThresholdBasis | null }
```

- [ ] **Step 1 — Type.** Ajouter `ClimateThresholdBasis` à `decision-fact.ts` et à `MismatchBasis` (PAS encore
  à `AlignmentBasis` : l'alignment favorable est l'increment 2). Commentaire de doctrine : « on n'ajoute à
  l'union que le productible — une règle sait désormais produire et expliquer cet état multivarié ».
- [ ] **Step 2 — RED classifieur** (`climat-facts.test.ts`) : `classifyClimateComfort` — les deux axes notables
  → `unfavorable`, basis avec 2 mesures dont `isUnfavorable` ; un seul axe notable → `unfavorable`, `trigger:"any"` ;
  aucun axe notable + les deux `projete` présents → `under_threshold` ; un `projete` absent → `uncertain`.
- [ ] **Step 3 — GREEN classifieur** dans `climat-facts.ts`, à partir de `joursTresChauds`/`nuitsTropicales`
  (`projete`, `threshold`, `notable`). `conventionId`/`referencePeriod` depuis la convention climat existante.
- [ ] **Step 4 — assertFactValid** : `case "climate_threshold"` — `measures` non vide, chaque mesure a un
  `threshold` fini et un `projectedValue` fini, au moins une `isUnfavorable` pour un MISMATCH. Test de garde.
- [ ] **Step 5 — Vérifs + Commit** : `feat(chaleur): base climate_threshold + classifieur pur`.

---

## Task 1 : la chaleur défavorable sur priorité déclarée devient un MISMATCH (avec le poids 1)

**Files :** `materiality-rules.ts` (`ruleChaleur`) ; test `materiality-rules.test.ts`.

**Interface :** `ruleChaleur.evaluate` — déclarée (poids ≥ 2) + `classifyClimateComfort` `unfavorable` →
`outcome: "mismatch"` + `MismatchFact` (basis `climate_threshold`, `projectKey: "faible_chaleur"`,
`headlineSubject: "des étés supportables"`, `topic: "les fortes chaleurs"`). Poids 1 + unfavorable →
`outcome: "mismatch"`, `facts: []`. `under_threshold` → satisfied/neutral silencieux (comme aujourd'hui).

- [ ] **Step 1 — RED** : projet `faible_chaleur` poids 3, `climat` avec un axe `notable`. Attendre `role
  "mismatch"`, `basis.kind "climate_threshold"`, `projectKey "faible_chaleur"`, `headlineSubject` non vide,
  `assertFactValid` OK. (Aujourd'hui : `role "verification"`.)
- [ ] **Step 2 — RED poids 1** : poids 1 + un axe notable → `outcome "mismatch"`, `facts.length === 0`.
- [ ] **Step 3 — Vérifier RED**.
- [ ] **Step 4 — GREEN** : dans `ruleChaleur`, remplacer la branche verification par le mismatch (poids ≥ 2)
  / mismatch silencieux (poids 1), via `classifyClimateComfort`. Le `statement` garde les phrases jours/nuits
  existantes ; l'`action`/renvoi logement N'EST PLUS ici (un mismatch n'a pas d'action) — restauré en Task 2.
- [ ] **Step 5 — Orientation** (`decision-assembler.test.ts` ou `conclusion-plan.test.ts`) : avec ce mismatch,
  l'orientation devient `arbitration`, `criteria-registry` compte `faible_chaleur` en mismatch (pas reserve),
  le verdict n'est plus « Correspondance favorable ».
- [ ] **Step 6 — Vérifs + Commit** : `feat(chaleur): priorité déclarée + chaleur défavorable -> mismatch`.

---

## Task 2 : les compositions climatiques (évolution du tradeoff, PUIS climate_comfort) — invariant « une seule »

**Files :** `fact-composition.ts`, `fact-compositions.ts` ; test `fact-compositions.test.ts`.

**Invariant :** une seule composition climatique visible par dossier pour cette dimension. Priorité des patrons :
douceur favorable → **`seasonal_climate_tradeoff`** (évolué) ; sinon → **`climate_comfort`**.

- [ ] **Step 1 — Évoluer `seasonal_climate_tradeoff`** : aujourd'hui son côté défavorable absorbe un
  `VerificationFact` chaleur. Il doit désormais absorber le **MismatchFact** chaleur (Task 1). Vérifier
  `favorableSide` (douceur alignment, cf. lot C `favorableProjectKey`) / `unfavorableSide` (mismatch chaleur) /
  l'action logement conservée. Le mismatch absorbé reste le signal d'orientation.
  - RED/GREEN : douceur alignment + chaleur mismatch → UN `seasonal_climate_tradeoff`, `absorbedFactIds` inclut
    le mismatch chaleur, l'action logement est portée.
- [ ] **Step 2 — Nouveau `climate_comfort`** (fallback, sans douceur favorable) : `kind: "climate_comfort"`,
  `displaySection: "mismatches"`, absorbe le mismatch chaleur, porte l'action logement + la limitation.
  Structure de rendu :
  ```
  Des étés plus difficiles à concilier avec votre projet
  À l'échelle de {commune} : jours > 35 °C de X à Y, nuits tropicales de A à B.
  Pour ce logement : le confort dépend de l'orientation, l'étage, l'inertie, les protections solaires.
  → Regardez comment le logement tient l'été   (sans adresse : « Renseignez une adresse pour évaluer… »)
  ```
  - RED/GREEN : chaleur mismatch SANS douceur favorable → `climate_comfort` ; `absorbedFactIds` inclut le mismatch ;
    action selon `hasAddress`.
- [ ] **Step 3 — Priorité des patrons** : RED — un dossier avec douceur favorable + chaleur mismatch produit
  **exactement une** composition climatique (`seasonal_climate_tradeoff`), **jamais** aussi `climate_comfort`.
  GREEN : le builder de `climate_comfort` ne se déclenche que si `seasonal_climate_tradeoff` n'est pas produit.
- [ ] **Step 4 — Vérifs + Commit** : `feat(chaleur): compositions climatiques (tradeoff évolué + climate_comfort), une seule par dossier`.

> NOTE exécutant : lire comment l'action/renvoi logement est construit aujourd'hui dans le VerificationFact de
> `ruleChaleur` (champ `action` + `href`) et comment `hasAddress` (ModuleFacts) est disponible côté composition.

---

## Task 3 : les compositions climatiques nommables au héros (le mismatch absorbé n'est pas perdu)

**Files :** `conclusion-plan.ts` (`mismatchCandidates`) ; test `conclusion-plan.test.ts`.

**Interface :** `mismatchCandidates(shownFacts, shownCompositions)` lit AUSSI les compositions climatiques
(`seasonal_climate_tradeoff`, `climate_comfort`) qui ont absorbé un mismatch chaleur, et expose leur
`headlineSubject` (« des étés supportables ») + `absorbedFactIds`. Sans ça, le mismatch absorbé quitte
`shownFacts` et le héros ne peut plus nommer la chaleur (Issue 2 du lot C).

- [ ] **Step 1 — RED** : dossier avec chaleur mismatch absorbé dans une composition climatique affichée →
  orientation `arbitration`, `p.verdict.headline.text` NOMME « des étés supportables », la carte composée est
  retrouvable plus bas.
- [ ] **Step 2 — GREEN** : étendre `mismatchCandidates` (comme il lit déjà `shared_evidence`) pour les
  compositions climatiques. `causeCommune` = false (c'est une priorité, pas une cause commune).
- [ ] **Step 3 — Vérifs + Commit** : `feat(chaleur): le héros nomme le mismatch chaleur absorbé dans une composition`.

---

## Task 4 : la verification AMBIANTE (chaleur non déclarée) — règle séparée

**Files :** `materiality-rules.ts` (nouvelle règle `territoire.verification-chaleur-future`) ; test.

- [ ] **Step 1 — RED** : `faible_chaleur` NON déclarée + un axe notable → une règle ambiante produit un
  `VerificationFact` (grain commune) ; `faible_chaleur` DÉCLARÉE → la règle ambiante rend `not_applicable`
  (l'invariant « une dimension, un signal » : la préférence a déjà produit le mismatch).
- [ ] **Step 2 — GREEN** : règle `verification-chaleur-future`, applicable SEULEMENT si
  `preferenceWeight(faible_chaleur) < 2`. Réutilise le statement/limitation climat existants.
- [ ] **Step 3 — Non-régression comptes** : test — la verification ambiante (clé non déclarée) ne change NI
  couverture, NI orientation, NI favorableCount (criteria-registry n'agrège que les clés déclarées).
- [ ] **Step 4 — Vérifs + Commit** : `feat(chaleur): verification ambiante quand la chaleur n'est pas une priorité`.

---

## Task 5 : vérifier l'intro de section (probablement no-op)

**Files :** `DossierDecisionSection.tsx` (SECTION_INTRO).

- [ ] **Step 1** : après les Tasks 1-4, la section « À contrôler » ne contient plus que des faits **ambiants**
  (argiles, PPR, sinistralité, verification chaleur non déclarée). L'intro « Au-delà de vos priorités, ces
  constats sont établis pour ce lieu » redevient VRAIE. **Vérifier à l'écran** qu'aucune verification sur une
  priorité déclarée n'y subsiste. Si c'est le cas → **aucune modification** (l'intro est correcte). Ne réécrire
  QUE si un contre-exemple apparaît.

---

## Increment 2 (DIFFÉRÉ) — l'alignment favorable de chaleur (double gate, deux rangs)

**Bloqué par la donnée** : exige des **rangs de trajectoire** jours ET nuits (P-2). À peupler comme le lot C+ :
étendre `MISMATCH_RANK_KEYS`/`mismatchRawScore` pour deux métriques chaleur, relancer `populate-mismatch-rank.mts`.
**Deux rangs distincts, jamais un composite opaque** [revue #7].

Contrat de la gate favorable :
```
niveau futur NON défavorable sur les DEUX axes (0 axe notable)
+ trajectoire favorable sur les axes requis (rang opposable)
+ AUCUNE métrique thermique n'oppose un veto
→ alignment (idéalement côté favorable d'une composition « confort thermique futur »)
```
Gate prudente : « juste sous le seuil » (ex. 7 j, 24 nuits) n'est PAS une force. Formulations bornées à la
mesure (jamais « il ne fera pas chaud ici »). Ajouter `ClimateThresholdBasis` à `AlignmentBasis` à ce moment-là.

---

## Tests à graver (revue #8)

1. Un seul axe défavorable suffit (jours sous seuil, nuits au-dessus → mismatch).
2. Égalité au seuil (`projete === threshold` → mismatch, convention `>=`).
3. Composition saisonnière prioritaire (douceur alignment + chaleur mismatch → un seul `seasonal_climate_tradeoff`).
4. Composition simple sans douceur (chaleur mismatch seule → `climate_comfort`).
5. Le héros voit la composition (mismatch absorbé toujours nommable).
6. Aucun double signal (jamais mismatch chaleur + verification chaleur visibles ensemble).
7. Règle ambiante sans effet métier (verification non déclarée : ni couverture, ni orientation, ni favorableCount).
8. Action selon le grain (adresse → confort du logement ; pas d'adresse → renseigner une adresse).
9. Poids 1 (déclaré + défavorable → outcome mismatch, aucun fait, aucune carte).

## Auto-revue (couverture)

- Bug Toulouse (déclarée + défavorable → mismatch) → Task 0/1 ✅
- Base probante dédiée (bi-métrique) → Task 0 ✅
- Conflit tradeoff / une seule composition → Task 2 ✅
- Héros voit le mismatch absorbé → Task 3 ✅
- Verification ambiante séparée, sans effet comptes → Task 4 ✅
- Poids 1 explicite → Task 1 + test 9 ✅
- Intro : caduque après reclassification → Task 5 (vérif) ✅
- Alignment favorable + double gate + deux rangs → Increment 2 (différé) ✅

**Décisions tranchées :** D-1 (composition), D-2 (règle ambiante séparée), copie « des étés supportables »
(Editorial Writer). **Bloqueur de données :** rangs chaleur (increment 2).
