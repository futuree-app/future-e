# Lot C — « Ce qui correspond à votre projet » (AlignmentFact) — Plan d'exécution

> **Pour l'exécutant :** implémenter tâche par tâche en TDD. Chaque tâche finit par un livrable
> testable seul. Spec source : `docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md`.

**Objectif :** matérialiser le côté FAVORABLE déjà calculé par le moteur (les `satisfied` aujourd'hui
jetés) en un nouveau rôle `AlignmentFact`, miroir exact du `MismatchFact` : une carte « Ce qui
correspond à votre projet », et un verdict qui peut nommer un positif quand rien de négatif ne prime.

**Architecture :** un rôle de plus dans l'union `DecisionFact`, une liste blanche de fondements probants
dans `assertFactValid`, trois familles de règles qui émettent au lieu de jeter le `satisfied`, une
section de plus dans l'assembleur avec sa règle de placement, une branche de plus dans la cascade du
verdict, et une règle d'absorption par composition. Aucun LLM, tout déterministe et pur.

**Stack :** TypeScript strict, `node --test --experimental-strip-types`, pas de nouvelle dépendance.

## Contraintes globales (copiées de la spec, valent pour TOUTES les tâches)

- **Liste blanche des fondements** : un `satisfied` ne devient un fait QUE si son fondement est
  `relative_position` (`band.low >= 0.8`), `absolute_measure` (distance mer), ou `categorical_state`
  (catégorie de taille préférée). **Jamais** une absence de signal, **jamais** une attestation d'absence
  (`classifyNetworkAbsence`/`classifyHigherEdAbsence` ne rendent jamais `satisfied`).
- **Gardes symétriques du mismatch** : émis seulement si `preferenceWeight >= 2` ; `materialityTier` =
  `structuring` si poids >= 3, `secondary` sinon ; `assertFactValid` exige `headlineSubject` (≤ 45 car.,
  sans ponctuation finale) et au moins une preuve.
- **Aucune `action`, aucune `limitation` de portée, aucun `signalConvention`** sur un alignment (rien à
  border). Exception : la `limitation` méthodologique card-only héritée du critère (ensoleillement,
  douceur) reste autorisée — c'est une nuance de mesure, pas une limite de portée.
- **Nommage** : `role: "alignment"` (jamais `match` — collision de relecture avec `mismatch` ; jamais
  `positive` — c'est une correspondance à une priorité DÉCLARÉE, pas une qualité absolue).
- **Doctrine de séquencement (lot B)** : on ne nomme au verdict QUE les sujets des faits AFFICHÉS (après
  compositions et caps), jamais depuis `favorableCount`. `favorableCount` garde son rôle métier.
- **Invariant transversal** : une même dimension ne produit jamais à la fois un alignment et un signal
  défavorable. Pour le lot de base c'est structurel (un critère = une règle = un outcome exclusif via
  `classifyPosition`) ; à re-garantir explicitement pour les extensions (hors périmètre ici).
- **Ce qu'on ne casse pas** : verdict jamais généré ; DOM commune déterministe/génératif ; ordre
  épistémique ; aucun compteur/badge/score affiché ; teinte violet du non-savoir ; comptes métier
  (`reservesShown`, `mismatchTotal`, `favorableCount`, couverture, orientation) inchangés.
- **Vérifs de fin de chaque tâche** : `npx tsc --noEmit` = 0 ; `npx eslint <fichiers touchés>` = 0 ;
  `node --test --experimental-strip-types "src/**/*.test.ts"` tout vert.

## DÉCISION À TRANCHER AVANT LA TÂCHE 1 — la voix du constat favorable (D1)

Le constat d'un alignment est COURT (spec §La carte). Deux directions, à choisir par le porteur :

- **A — Miroir générique.** `« {Sujet} : {nom} figure parmi les {X %} de communes les plus favorables
  de France. »` Symétrie exacte du mismatch (« les moins favorables de France »), zéro vocabulaire
  nouveau, une seule formule. Robuste, un peu plate.
- **B — Superlatif par critère (comme la maquette de la spec).** `« L'accès aux soins, parmi les 10 %
  les mieux dotées de France. »` / `« La vie locale, parmi les 20 % les plus animées. »` Nécessite
  d'écrire 13 superlatifs favorables (un par critère) — de la vraie copie, à valider.

Le reste du plan est écrit pour **A** (le miroir), et isole la formulation dans une seule fonction
(`alignmentStatement`) + un champ optionnel `favorablePhrase` sur `MismatchLabel`, de sorte que passer à
**B** ne touche qu'un fichier. **Ne pas démarrer la tâche 1 avant que D1 soit tranchée.**

## DÉCISION À TRANCHER AVANT LA TÂCHE 5 — la voix du héros positif (D2)

Cascade cas 4, formulation proposée par la spec :
`« Toulouse répond à deux de vos priorités : l'accès aux soins et la vie locale. »` (singulier :
`« … répond à votre priorité : l'accès aux soins. »`). À confirmer au moment de la tâche 5.

---

## Carte des fichiers

- `src/lib/decision/decision-fact.ts` — **modifier** : ajouter `AlignmentFact`, l'ajouter à l'union
  `DecisionFact`, et `"alignments"` aux clés de `DossierSection`.
- `src/lib/decision/mismatch-facts.ts` — **modifier** : `rankPhraseFavorable`, `rankStatusFavorable`,
  et champ optionnel `favorablePhrase` sur `MismatchLabel` (inutilisé en option A, réservé pour B).
- `src/lib/decision/alignment-rules.ts` — **créer** : la fabrique des règles d'alignment relative_position.
- `src/lib/decision/alignment-rules.test.ts` — **créer**.
- `src/lib/decision/agglomeration-rules.ts` — **modifier** : émettre un alignment sur `satisfied` symétrique.
- `src/lib/decision/coast-rules.ts` — **modifier** : émettre un alignment sur `satisfied` (distance mer).
- `src/lib/decision/materiality-rules.ts` — **modifier** : brancher `alignment` dans `assertFactValid`
  (liste blanche des fondements) et enregistrer `ALIGNMENT_RULES` dans le pipeline `runRules`.
- `src/lib/decision/decision-assembler.ts` — **modifier** : section « Ce qui correspond », placement, cap 3.
- `src/lib/decision/dossier-view.ts` — **modifier si besoin** : le placement peut se faire dans l'ordre
  des `candidates` de l'assembleur (préféré) ; à défaut, un lecteur pur ici.
- `src/lib/decision/fact-compositions.ts` — **modifier** : absorber l'alignment porté par un `favorableSide`.
- `src/lib/decision/conclusion-plan.ts` — **modifier** : cascade cas 4, détail nomme les sujets affichés.
- Composants : `src/components/report/DossierDecisionSection.tsx` (rendu de la section) — **modifier**.

---

## Task 1 : le rôle `AlignmentFact`, la liste blanche, la famille relative_position

**Files:**
- Modify: `src/lib/decision/decision-fact.ts` (après `MismatchFact`, ~ligne 162 ; union ~164 ; clés de
  section ~276)
- Modify: `src/lib/decision/mismatch-facts.ts` (helpers favorables)
- Create: `src/lib/decision/alignment-rules.ts`
- Modify: `src/lib/decision/materiality-rules.ts` (`assertFactValid` + enregistrement `ALIGNMENT_RULES`)
- Test: `src/lib/decision/alignment-rules.test.ts`, et `src/lib/decision/materiality-rules.test.ts`

**Interfaces:**
- Produces : `AlignmentFact` (role `"alignment"`, `projectKey`, `basis: MismatchBasis`, `evidence`,
  `headlineSubject`, `status?`) ; `ALIGNMENT_RULES: DecisionRule[]` ; `alignmentRuleId(key) => string`.
- Consumes : `classifyPosition`, `MISMATCH_LABELS`, `preferenceWeight`, `rankPhraseFavorable`,
  `rankStatusFavorable`.

- [ ] **Step 1 — Type.** Dans `decision-fact.ts`, ajouter après `MismatchFact` :

```ts
// ALIGNMENT : le lieu répond à une priorité déclarée, et c'est ÉTABLI. Miroir exact du mismatch. Pas
// d'action (rien à mener), pas de limitation de portée : un fait établi qui n'appelle aucune vérif n'a
// rien à border. `alignment` et non `match` (collision de relecture avec mismatch) ni `positive` (dit
// une correspondance à une priorité DÉCLARÉE, jamais une qualité absolue du territoire).
export type AlignmentFact = BaseFact & {
  role: "alignment";
  projectKey: PreferenceKey;
  basis: MismatchBasis;
  evidence: EvidenceRef[];
  headlineSubject: string;
  status?: string; // l'état scannable favorable (« 10 % les plus favorables »)
  limitation?: string; // UNIQUEMENT la nuance méthodologique card-only héritée du critère (ERA5, 1976-2005)
};
```

Ajouter à l'union : `... | MismatchFact | AlignmentFact;`. Et dans `DossierSection.key`, ajouter
`"alignments"` : `"incompatibilities" | "mismatches" | "alignments" | "compromises" | "unknowns" | "verifications"`.

- [ ] **Step 2 — Helpers favorables** dans `mismatch-facts.ts` :

```ts
// Miroir de rankPhrase, tourné pour le HAUT de la distribution. On passe (1 - band.low) : une commune
// à band.low = 0.92 est dans les 8 % du haut -> « les 10 % de communes ».
export function rankPhraseFavorable(low: number): string {
  return rankPhrase(1 - low); // réutilise FRACTIONS : 5 % / 10 % / 20 % / le quart
}
// Miroir de rankStatus, côté favorable.
const RANK_STATUS_FAVORABLE: { max: number; label: string }[] = [
  { max: 0.05, label: "5 % les plus favorables" },
  { max: 0.1, label: "10 % les plus favorables" },
  { max: 0.2, label: "20 % les plus favorables" },
];
export function rankStatusFavorable(low: number): string {
  return RANK_STATUS_FAVORABLE.find((x) => (1 - low) <= x.max)?.label ?? "Quart le plus favorable";
}
```

Et champ optionnel réservé à D1/option B : sur `MismatchLabel`, `favorablePhrase?: string;` (inutilisé
en option A).

- [ ] **Step 3 — Test RED** `alignment-rules.test.ts` (mirroir de `mismatch-rules.test.ts`) :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
// helpers facts()/lf()/project()/HARD copiés du pattern de logement-rules.test.ts, avec rankBands.

test("satisfied de poids >= 2 -> un fait alignment (fondement relative_position, tier selon le poids)", () => {
  // rankBands: { acces_soins: { low: 0.95, high: 0.99 } } -> satisfied
  const f = /* runRules avec préférence acces_soins poids 3 */ ...;
  const a = f.facts.find((x) => x.ruleId === "territoire.alignment-acces_soins");
  assert.ok(a && a.role === "alignment");
  assert.equal(a.projectKey, "acces_soins");
  assert.equal(a.basis.kind, "relative_position");
  assert.equal(a.materialityTier, "structuring"); // poids 3
  assert.ok(a.headlineSubject.length > 0);
  assert.ok(a.evidence.length > 0);
});

test("satisfied de poids 1 -> rien (silencieux comme le mismatch mineur)", () => { /* poids 1 -> facts vide */ });
test("neutral / mismatch -> aucun alignment", () => { /* band centrale, band basse -> pas de fait alignment */ });
test("poids 2 -> secondary", () => { /* tier secondary */ });
```

- [ ] **Step 4 — Vérifier RED** : `node --test --experimental-strip-types src/lib/decision/alignment-rules.test.ts` → échoue (module absent).

- [ ] **Step 5 — GREEN `alignment-rules.ts`** (miroir de `mismatch-rules.ts`) :

```ts
// LA FABRIQUE DES RÈGLES D'ALIGNMENT (position relative). PURE. Miroir de mismatch-rules.ts : lit le
// MÊME rang précalculé, émet sur `satisfied` ce que le mismatch émet sur `mismatch`. Poids gouverne la
// matérialité, jamais l'examinabilité (poids 1 -> examiné, silencieux).
import type { DecisionRule, RuleEvaluation, AlignmentFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  classifyPosition, rankPhraseFavorable, rankStatusFavorable, MISMATCH_LABELS, MISMATCH_DISTRIBUTION_VERSION,
  type RelativeCriterionFact,
} from "./mismatch-facts.ts";
import { MISMATCH_KEYS } from "./mismatch-rules.ts"; // MÊME liste de critères classables

const territoireHref = "/rapport/quartier";
export const alignmentRuleId = (key: PreferenceKey): string => `territoire.alignment-${key}`;

function relativeFact(f: ModuleFacts, key: PreferenceKey): RelativeCriterionFact {
  const band = f.rankBands?.[key] ?? null;
  return { key, rawValue: band ? band.low : null, band, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION };
}

function makeAlignmentRule(key: PreferenceKey): DecisionRule {
  const id = alignmentRuleId(key);
  const lab = MISMATCH_LABELS[key]!;
  return {
    id, module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: AlignmentFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [key], outcome, facts, reason });
      const weight = preferenceWeight(p, key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");
      const verdict = classifyPosition(relativeFact(f, key));
      if (verdict === "uncertain") return ret("uncertain", [], "rang non calculable");
      // Seul `satisfied` matériel (poids >= 2) produit. satisfied poids 1 -> examiné, silencieux.
      // mismatch/neutral -> laissés à mismatch-rules / au silence.
      if (verdict !== "satisfied" || weight < 2) {
        return ret(verdict, [], verdict === "satisfied" ? "alignment mineur, silencieux (poids 1)" : `position ${verdict}`);
      }
      const band = f.rankBands![key]!;
      const tier = weight >= 3 ? "structuring" : "secondary";
      const ev: EvidenceRef = {
        factId: `relativePosition.${key}`, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `parmi ${rankPhraseFavorable(band.low)} les plus favorables`, grain: "commune", href: territoireHref,
      };
      const fact: AlignmentFact = {
        id: `${f.insee}:alignment-${key}`, ruleId: id, sourceFactIds: [`relativePosition.${key}`], module: "territoire",
        role: "alignment", projectKey: key, materialityTier: tier,
        topic: lab.topic, headlineSubject: lab.subject, status: rankStatusFavorable(band.low),
        // D1 option A (miroir générique). Passer à B = remplacer cette ligne par lab.favorablePhrase.
        statement: `${capitalizeFirst(lab.subject)} : ${f.nom} figure parmi ${rankPhraseFavorable(band.low)} les plus favorables de France.`,
        basis: { kind: "relative_position", rankLow: band.low, rankHigh: band.high, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION },
        evidence: [ev],
        ...(lab.limitation ? { limitation: lab.limitation } : {}),
      };
      return ret("satisfied", [fact], "position relative favorable, matérialisée");
    },
  };
}
export const ALIGNMENT_RULES: DecisionRule[] = MISMATCH_KEYS.map(makeAlignmentRule);
```

(`capitalizeFirst` : petit util local ou importé si déjà présent — vérifier `conclusion-plan.ts:capitalize`.)

- [ ] **Step 6 — `assertFactValid`** (`materiality-rules.ts`, dans le `switch (fact.role)`) : ajouter un
  `case "alignment"` qui exige preuve + `headlineSubject` (mêmes bornes que mismatch) + fondement DANS LA
  LISTE BLANCHE (`relative_position` | `absolute_measure` | `categorical_state` — **PAS** `named_absence`,
  contrairement au mismatch : une attestation d'absence ne prouve jamais une correspondance) + `projectKey`
  déclarée. Réutiliser la logique de validation du basis du mismatch, en excluant `named_absence`.

- [ ] **Step 7 — Enregistrer** `ALIGNMENT_RULES` dans le tableau de règles de `runRules`
  (`materiality-rules.ts`, là où `MISMATCH_RULES`/`AGGLOMERATION_RULES` sont concaténées).

- [ ] **Step 8 — Test RED assertFactValid** (`materiality-rules.test.ts`) : un alignment sans
  `headlineSubject` → jette ; sans preuve → jette ; avec `basis.kind === "named_absence"` → jette
  (« fondement hors liste blanche »). Puis GREEN.

- [ ] **Step 9 — Vérifs** : `tsc` 0, `eslint` 0, suite complète verte.

- [ ] **Step 10 — Commit** : `feat(alignment): rôle AlignmentFact + famille relative_position (satisfied matérialisé)`.

---

## Task 2 : alignment sur la taille (categorical_state) et la mer (absolute_measure)

**Files:**
- Modify: `src/lib/decision/agglomeration-rules.ts` (branche `satisfied` de `makeSizeRule`)
- Modify: `src/lib/decision/coast-rules.ts` (branche `satisfied`)
- Test: `src/lib/decision/agglomeration-rules.test.ts`, `src/lib/decision/coast-rules.test.ts`

**Interfaces:** produit des `AlignmentFact` de fondement `categorical_state` / `absolute_measure`,
mêmes gardes (poids >= 2, tier selon poids, headlineSubject = `spec.subject` côté taille).

- [ ] **Step 1 — RED taille** : un projet `prefere_grande_ville` poids 3 sur une métropole (catégorie
  = préférence) → `runRules` produit `territoire.alignment-prefere_grande_ville`, role `alignment`,
  `basis.kind === "categorical_state"`, tier `structuring`. (Aujourd'hui : `outcome satisfied`, facts vide.)
- [ ] **Step 2 — GREEN** : dans `makeSizeRule`, quand `outcome === "satisfied"` ET `weight >= 2`, émettre
  un `AlignmentFact` symétrique du mismatch de la même fabrique (réutiliser `labelForCategory`,
  `categoryStatementFragment`, `SIZE_SUBJECTS[key]` en `headlineSubject`, status = catégorie capitalisée,
  preuve = même EvidenceRef que le mismatch). `satisfied` poids 1 reste silencieux.
- [ ] **Step 3 — RED/GREEN mer** : lire `coast-rules.ts` d'abord (fondement `absolute_measure`, distance).
  Sur `satisfied` (mer à la distance déclarée, poids >= 2), émettre l'alignment (headlineSubject = la
  priorité littoral du lecteur, preuve = distance mesurée). Vérifier le `topic`/`subject` disponibles.
- [ ] **Step 4 — Vérifs + Commit** : `feat(alignment): fondements taille et mer`.

> NOTE exécutant : lire `coast-rules.ts` en entier avant d'écrire — le fondement mer et ses libellés
> n'ont pas été audités dans ce plan. Si aucun `subject`/`headlineSubject` favorable n'existe côté mer,
> l'ajouter au registre du critère, pas l'inventer dans la règle.

---

## Task 3 : la section « Ce qui correspond » dans l'assembleur, placement, cap 3

**Files:**
- Modify: `src/lib/decision/decision-assembler.ts` (tableau `candidates`, ~ligne 97 ; `conclusionBasis`)
- Modify: `src/components/report/DossierDecisionSection.tsx` (rendu de la section, intertitre de grain,
  filet d'accent distinct)
- Test: `src/lib/decision/decision-assembler.test.ts`

**Interfaces:** une `DossierSection` de clé `"alignments"`, titre « Ce qui correspond à votre projet »,
cap 3, cartes-faits `role === "alignment"` triées par tier. `conclusionBasis.factIds` inclut les
alignments affichés.

- [ ] **Step 1 — RED placement** (`decision-assembler.test.ts`) :
  - cas `arbitration` (mismatch présent) : l'ordre des sections rendues place `alignments` **avant**
    `mismatches`.
  - cas `incompatible` : `incompatibilities` reste **avant** `alignments`.
  - cap : 4 alignments affichés → 3 cartes.
  - `conclusionBasis.factIds` contient les ids des alignments affichés.
- [ ] **Step 2 — GREEN** : ajouter la ligne section dans `candidates`, à la bonne position. Le placement
  « ouvre sauf derrière incompatibilités » se règle par l'ORDRE des `candidates` : placer `alignments`
  juste après `incompatibilities` et avant `mismatches`. `sectionCards(facts, comps, "alignment",
  "alignments", 3)`. Ajouter les alignments affichés à `conclusionBasis.factIds`/`evidence`.
- [ ] **Step 3 — Grain intertitre** : l'intertitre n'affiche le grain QUE si toutes les lignes partagent
  le même libellé de grain non nul (sinon omis, aucune ligne ne le porte). Rendu dans le composant.
- [ ] **Step 4 — Rendu** : `DossierDecisionSection.tsx` — la section alignments rend une carte GROUPÉE
  (une ligne courte par fait : statement + pastille preuve), pas une carte pleine par force. Filet
  d'accent distinct des sections de problème.
- [ ] **Step 5 — Vérifs + Commit** : `feat(alignment): section « Ce qui correspond », placement et cap`.

---

## Task 4 : absorption par le côté favorable d'une composition

**Files:**
- Modify: `src/lib/decision/fact-compositions.ts` (l'étape qui calcule `absorbedFactIds`)
- Test: `src/lib/decision/fact-compositions.test.ts`

**Interfaces:** un `AlignmentFact` dont la `projectKey` est portée par le `favorableSide` d'une
composition AFFICHÉE entre dans `absorbedFactIds` et disparaît de la carte « Ce qui correspond ».

- [ ] **Step 1 — RED** : projet avec `douceur_climat` + `faible_chaleur` (déclenche
  `seasonal_climate_tradeoff`, dont le `favorableSide` porte `douceur_climat`) ET un alignment
  `douceur_climat` émis. Après assemblage : l'alignment `douceur_climat` est absorbé (son id dans
  `absorbedFactIds`), pas rendu deux fois.
- [ ] **Step 2 — GREEN** : à la construction des compositions, pour chaque tradeoff affiché, collecter la
  `projectKey` de son `favorableSide` ; tout `AlignmentFact` de même `projectKey` rejoint
  `absorbedFactIds`. (Le `favorableSide` porte des `ruleIds`/`factIds` — vérifier le champ qui expose sa
  `projectKey` ; sinon dériver depuis la règle de douceur.)
- [ ] **Step 3 — Vérifs + Commit** : `feat(alignment): absorption par le côté favorable d'un tradeoff`.

> NOTE exécutant : le `favorableSide` (fact-composition.ts) n'expose peut-être pas de `projectKey`
> directement — lire le type `CompositionSide` avant d'écrire, et si besoin ajouter la clé au patron
> `seasonal_climate_tradeoff` plutôt que de deviner par le texte.

---

## Task 5 : le verdict — cascade cas 4 (héros positif) + détail qui nomme les sujets affichés

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts` (cascade du héros ; le détail d'arbitrage)
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:** `buildConclusionPlan` reçoit déjà `shownFacts`/`shownCompositions`. Les sujets favorables
se lisent depuis les `shownFacts` de `role === "alignment"` (leur `headlineSubject`), **jamais** depuis
`favorableCount`. Gate : au plus 2 sujets, ≤ 110 car., mêmes bornes que le lot B.

- [ ] **Step 1 — RED détail** : orientation `arbitration` avec des alignments affichés → le détail nomme
  les sujets favorables affichés (« L'accès aux soins et la vie locale répondent en revanche à votre
  projet. »), au plus 2, et **pas** depuis `favorableCount` (test : 3 satisfactions métier mais 1 seul
  alignment affiché → un seul sujet nommé).
- [ ] **Step 2 — RED héros cas 4** : aucun négatif éligible (ni incompatibilité, ni mismatch affiché, ni
  réserve `decision_critical`/`structuring` dominante) + alignments `structuring` affichés → héros nomme
  le positif (D2 : « {nom} répond à deux de vos priorités : {sujet1} et {sujet2}. » / singulier).
- [ ] **Step 3 — RED garde tier** : tous les alignments affichés sont `secondary` (poids 2) → la carte
  les affiche mais le héros **ne les nomme pas** (cas 4 exige un `structuring` au moins ; retombe en posture).
- [ ] **Step 4 — GREEN** : ajouter la branche cas 4 en avant-dernière position de la cascade (avant la
  posture), lisant `shownFacts` alignment `structuring`. Réécrire le détail d'arbitrage pour nommer les
  sujets affichés. Le héros ne mêle jamais les deux côtés dans une même phrase.
- [ ] **Step 5 — Comptes métier inchangés** : test de non-régression `favorableCount`, `reservesShown`,
  `mismatchTotal`, couverture, orientation.
- [ ] **Step 6 — Vérifs (dont sonde `probe-conclusion.ts` — héros positif déterministe) + Commit** :
  `feat(alignment): verdict nomme le côté favorable (cascade cas 4)`.

---

## Task 6 : revue à l'écran + handoff

- [ ] **Step 1** : lancer le rapport sur un cas favorable réel (projet avec 2+ priorités en top 20 %,
  peu de réserves) et REGARDER l'écran — la doctrine du projet : les défauts de composition sont
  invisibles aux tests. Faire valider la carte + le héros positif par le porteur.
- [ ] **Step 2** : mettre `docs/handoff/CURRENT.md` à jour (lot C livré), commit + push sur `main`.

---

## Auto-revue (couverture de la spec)

- Rôle `alignment`, gardes symétriques, aucune action/limitation de portée → Task 1 ✅
- Liste blanche (3 familles), exclusion des absences → Task 1 (assertFactValid) + Task 2 ✅
- Carte groupée, cap 3, grain conditionnel, filet distinct → Task 3 ✅
- Placement (ouvre sauf derrière incompatibilités) → Task 3 ✅
- Absorption par `favorableSide` → Task 4 ✅
- Détail nomme les sujets affichés (pas `favorableCount`), gate 2 → Task 5 ✅
- Héros cas 4, garde tier `structuring`, singulier/pluriel → Task 5 ✅
- `conclusionBasis` porte les alignments affichés → Task 3 ✅
- Invariant transversal (structurel pour le lot de base) → Contraintes globales ✅
- Hors périmètre (forces absolues, positifs de risque, Logement, C+/D/E) → non traités, conformes ✅

**Décisions ouvertes bloquantes** : D1 (voix du constat, avant Task 1), D2 (voix du héros, avant Task 5).
