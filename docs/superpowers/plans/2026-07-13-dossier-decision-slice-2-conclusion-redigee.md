# Slice 2 — La conclusion rédigée : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire rédiger par un LLM les seuls registres de nuance de la conclusion du dossier de décision, bloc par bloc, sans qu'il puisse jamais sélectionner, hiérarchiser, omettre ni inventer quoi que ce soit, avec la sortie déterministe en fallback permanent.

**Architecture:** Le déterministe produit un `ConclusionNarrativePlan` (présence, ordre, sources, `requiredPhrases` et `fallbackText` de chaque bloc) porté par le `Dossier` lui-même. **Le verdict n'est jamais généré.** Un Server Component sous `<Suspense>` (fallback = les mêmes blocs en déterministe) appelle `generateObject` sur les seuls blocs générables, si un gate de complexité narrative l'autorise, valide la sortie élément par élément par une fonction pure, persiste un artefact identifié par un SHA-256 du plan, et substitue le résultat de façon atomique. Aucune route API.

**Tech Stack:** Next 16.2.4 (App Router, RSC), AI SDK 6.0.193 (`generateObject`, vérifié présent dans les types installés), `@ai-sdk/anthropic` 3.0.81 (Sonnet 4.6, `effort: "medium"`, `thinking: { type: "disabled" }`, tous deux vérifiés valides), zod 4, Supabase (RLS own), `node --test` pour les libs pures.

Spec : `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-conclusion-redigee-design.md`.

## Global Constraints

- **L'IA formule, elle ne décide jamais.** Présence, ordre, sources et sélection des faits sont calculés avant l'appel. La sortie du modèle est réduite à `{ key, text }` : il ne produit **aucun `sourceId`**, aucune provenance.
- **Le bloc `verdict` n'est JAMAIS généré.** C'est la phrase qui peut renverser une décision perçue (« ce lieu vous correspond » là où rien de tel n'a été établi). Il reste déterministe, mot pour mot. L'IA le reçoit en **lecture seule**, pour que les registres suivants s'y articulent.
- **La matière ne peut pas disparaître à l'intérieur d'un bloc.** Chaque bloc générable porte des `requiredPhrases` (les libellés des contraintes, des priorités, le nombre de réserves, le constat du `lead` quand il est `single`) qui doivent se retrouver **textuellement** dans le texte généré, sinon le bloc retombe sur son repli.
- **Hiérarchie éditoriale des réserves, jamais aplatie**, dans cet ordre : `verdict` → `unexamined_hard_constraints` → `reserves_found` → `uncovered_priorities`. Une contrainte dure non examinée et une préférence non couverte ne partagent jamais un bloc.
- **Le gate passe avant le hash et avant la base.** Un plan qui ne justifie aucune rédaction ne requête pas Supabase et ne peut pas ressusciter une narration mise en cache.
- **Aucune génération au prefetch** : garde serveur sur la **présence** des headers `next-router-prefetch` / `next-router-segment-prefetch` (pas sur une valeur), plus `prefetch={false}` en défense de surface.
- **Aucune génération quand `logementStatus === "pending"`** : le dossier n'est pas final, générer là coûterait un second appel Sonnet jeté.
- **L'infrastructure narrative n'est jamais nécessaire pour lire le dossier.** Lecture du cache, génération et écriture sont toutes rattrapées et retombent sur le déterministe en journalisant. Le reste du code n'a aucun `try/catch` masquant : un bug remonte.
- **Piège maison** : `comparateur-vie.ts` fait `import "server-only"`. Toute lib testée en `node --test` n'en prend que des **types** (les imports type-only sont effacés).
- **Doctrine éditoriale FR** : pas de tiret cadratin (virgule ou deux points), pas d'antithèse (« c'est X, pas Y »), l'offre n'est jamais sujet de phrase.
- **Commandes de vérification** : `node --test src/lib/decision/*.test.ts src/lib/*.test.ts`, `npx tsc --noEmit`, et `npm run build` en fin de parcours.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/stable-stringify.ts` (neuf) | `stableStringify` : sérialisation canonique, **universel** (client + serveur) |
| `src/lib/server/sha256.ts` (neuf) | `sha256Hex` : `server-only` + `node:crypto`, jamais dans un bundle client |
| `src/lib/decision/conclusion-plan.ts` (neuf) | Types du plan, `buildConclusionPlan`, `selectLead`, `shouldGenerateNarrative` |
| `src/lib/decision/conclusion-validate.ts` (neuf) | `validateGeneratedBlocks` : le vrai contrat de sortie, pur |
| `src/lib/decision/conclusion-hash.ts` (neuf) | `buildConclusionHash` : identité de l'artefact |
| `src/lib/server/decision-narrative-store.ts` (neuf) | Lecture validée / upsert convergent / pruning |
| `src/components/report/ConclusionBlock.tsx` (neuf) | Rendu présentationnel des blocs (déterministes ou générés) |
| `src/components/report/ConclusionRedigee.tsx` (neuf) | RSC async : garde prefetch, gate, cache, génération, validation, écriture |
| `supabase/23_decision_narrative.sql` (neuf) | Table + index + RLS |
| `src/lib/decision/decision-fact.ts` | `Dossier` gagne `narrativePlan` |
| `src/lib/decision/decision-assembler.ts` | Produit le plan ; `conclusion` en dérive ; réserves = faits **affichés** |
| `src/components/report/DossierDecisionSection.tsx` | Le verdict devient `ConclusionBlock` sous `<Suspense>` |
| `src/components/report/DossierAvecLogement.tsx` | Passe `insee` et `scopeKey` |
| `src/app/(account)/rapport/page.tsx` | Passe `insee` et `scopeKey` |
| `src/lib/logement-synthesis-cache.ts` | Importe `stableStringify` du module partagé |

---

## Task 1 : Le socle de hash (universel / serveur, séparés dès le départ)

**Files:**
- Create: `src/lib/stable-stringify.ts`
- Create: `src/lib/stable-stringify.test.ts`
- Create: `src/lib/server/sha256.ts`
- Modify: `src/lib/logement-synthesis-cache.ts` (retire sa copie de `stableStringify`, l'importe)

**Interfaces:**
- Produces: `stableStringify(value: unknown): string` (universel), `sha256Hex(input: string): string` (`server-only`)

**Pourquoi deux fichiers :** `logement-synthesis-cache.ts` est importé **côté client** (le gate en session de `LogementSynthesis.tsx`). Mettre `node:crypto` dans le même module que `stableStringify` reviendrait à parier sur le tree-shaking pour qu'il ne parte pas dans le bundle client. On ne parie pas : la frontière est explicite, et `sha256Hex` porte `server-only`.

`fnv1a` reste dans `logement-synthesis-cache.ts` : il convient à un cache léger. Le nouvel artefact exige SHA-256, parce qu'une collision servirait au lecteur le texte d'un **autre plan**.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/stable-stringify.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { stableStringify } from "./stable-stringify.ts";

test("l'ordre d'insertion des clés ne change pas la sortie", () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }),
    stableStringify({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 }),
  );
});

test("l'ordre d'un tableau est signifiant (il est conservé)", () => {
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});

test("null est sérialisé, undefined est REFUSÉ (deux valeurs distinctes ne peuvent pas partager une identité)", () => {
  assert.equal(stableStringify({ a: null }), '{"a":null}');
  assert.throws(() => stableStringify(undefined), TypeError);
  assert.throws(() => stableStringify({ a: undefined }), TypeError);
});

test("une fonction ou un symbole est refusé (non sérialisable, donc non identifiable)", () => {
  assert.throws(() => stableStringify({ a: () => 1 }), TypeError);
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Run: `node --test src/lib/stable-stringify.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` sur `./stable-stringify.ts`.

- [ ] **Step 3 : Écrire l'implémentation**

Créer `src/lib/stable-stringify.ts` :

```ts
// Sérialisation canonique : clés triées récursivement. Deux valeurs égales -> même chaîne, quel que
// soit l'ordre d'insertion. L'ordre d'un TABLEAU est signifiant et donc conservé.
//
// UNIVERSEL (client + serveur) : logement-synthesis-cache l'importe et son buildFactHash tourne dans
// le navigateur. Aucun import Node ici, jamais. Le SHA-256 vit dans src/lib/server/sha256.ts.
//
// `undefined` JETTE : JSON.stringify(undefined) vaut undefined, et un `?? "null"` ferait silencieusement
// partager une identité à { a: undefined } et { a: null }. Pour une fonction d'IDENTITÉ, révéler une
// entrée mal formée vaut mieux que fabriquer une collision.
export function stableStringify(value: unknown): string {
  if (value === undefined) throw new TypeError("stableStringify : undefined n'a pas d'identité");
  if (value === null) return "null";
  if (typeof value === "function" || typeof value === "symbol") {
    throw new TypeError(`stableStringify : valeur non sérialisable (${typeof value})`);
  }
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}
```

Créer `src/lib/server/sha256.ts` :

```ts
import "server-only";
import { createHash } from "node:crypto";

// L'IDENTITÉ d'un artefact narratif. SHA-256 et pas le fnv1a du cache logement : une collision
// servirait au lecteur le texte d'un AUTRE plan.
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
```

- [ ] **Step 4 : Lancer le test, vérifier qu'il passe**

Run: `node --test src/lib/stable-stringify.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Dédupliquer `logement-synthesis-cache.ts`**

Dans `src/lib/logement-synthesis-cache.ts` : supprimer la fonction locale `stableStringify` (et son commentaire de 3 lignes) et ajouter, sous les imports existants :

```ts
import { stableStringify } from "./stable-stringify.ts";
```

`fnv1a` et `buildFactHash` restent inchangés.

Attention : l'ancien `stableStringify` acceptait `undefined` (il le rendait `"null"`), le nouveau **jette**. Si `buildSynthesisPayload` peut produire une clé à `undefined`, le hash lèverait désormais en session, côté client. Le Step 6 le vérifie.

- [ ] **Step 6 : Vérifier que le client n'est pas cassé**

Run: `node --test src/lib/logement-synthesis-cache.test.ts && npx tsc --noEmit`
Expected: PASS, tsc silencieux.

Si un test échoue avec `undefined n'a pas d'identité`, c'est que le payload de synthèse porte une clé optionnelle à `undefined` : la corriger en `null` dans `buildSynthesisPayload` (une absence est un `null`, doctrine maison), et non assouplir `stableStringify`.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/stable-stringify.ts src/lib/stable-stringify.test.ts src/lib/server/sha256.ts src/lib/logement-synthesis-cache.ts
git commit -m "feat(decision): socle de hash (stableStringify universel + sha256Hex server-only)"
```

---

## Task 2 : Le plan narratif, produit par le déterministe

**Files:**
- Create: `src/lib/decision/conclusion-plan.ts`
- Create: `src/lib/decision/conclusion-plan.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (le `Dossier` gagne `narrativePlan`)
- Modify: `src/lib/decision/decision-assembler.ts` (produit le plan ; `conclusion` en dérive ; réserves = faits **affichés**)
- Modify: `src/lib/decision/decision-assembler.test.ts`

**Interfaces:**
- Consumes: `DecisionFact`, `ConclusionState`, `MaterialityTier`, `UncoveredConstraint` (`decision-fact.ts`) ; `ProjectPosture` (`user-project.ts`).
- Produces:
  - `type BlockKey = "verdict" | "unexamined_hard_constraints" | "reserves_found" | "uncovered_priorities"`
  - `type NarrativeBlock = { key: BlockKey; fallbackText: string; sourceIds: string[]; requiredPhrases: string[]; maxChars: number; generable: boolean }`
  - `type LeadSelection` (union `single` / `tied` / `none`)
  - `type ConclusionNarrativePlan`
  - `buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan`
  - `shouldGenerateNarrative(plan)` (Task 3)

**Deux garde-fous portés par le plan lui-même :**

- `generable: false` sur le **verdict**. C'est la phrase qui peut renverser une décision perçue. Elle reste déterministe, mot pour mot. Le modèle la reçoit en lecture seule, pour que les registres suivants s'y articulent.
- `requiredPhrases` sur les blocs générables. La structure empêche la suppression d'un **bloc** ; elle n'empêche pas la disparition d'une **matière dans** le bloc : deux contraintes non examinées peuvent devenir « une condition importante reste à examiner », et la gare s'évapore. Les libellés doivent donc se retrouver **textuellement**.

**Pourquoi `buildConclusionPlan` prend un `input` et non un `Dossier` :** le `Dossier` contiendra le plan. Lui passer le `Dossier` créerait un cycle. L'assembleur, qui a déjà tout sous la main, compose l'`input`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/lib/decision/conclusion-plan.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionPlan, type ConclusionPlanInput } from "./conclusion-plan.ts";
import type { DecisionFact, MaterialityTier } from "./decision-fact.ts";

function verification(id: string, tier: MaterialityTier, statement = `constat ${id}`): DecisionFact {
  return {
    id, ruleId: `rule-${id}`, sourceFactIds: [], module: "logement", statement,
    materialityTier: tier, role: "verification",
    evidence: [{ factId: id, module: "logement", label: "DPE", observedValue: "F", grain: "adresse" }],
    action: { type: "verifier_sur_place", label: "Vérifier sur place" },
  };
}

function baseInput(over: Partial<ConclusionPlanInput> = {}): ConclusionPlanInput {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    shownFacts: [],
    uncovered: [],
    uncoveredPriorities: [],
    establishedIncompatibility: null,
    ...over,
  };
}

test("le verdict existe toujours, vient en premier, et n'est JAMAIS générable", () => {
  const plan = buildConclusionPlan(baseInput());
  assert.equal(plan.blocks[0]?.key, "verdict");
  assert.equal(plan.blocks[0]!.generable, false);
  assert.ok(plan.blocks[0]!.fallbackText.length > 0);
});

test("l'ordre des blocs suit la hiérarchie éditoriale des réserves", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical")],
    uncovered: [{ key: "nearSea", label: "la proximité de la mer" }],
    uncoveredPriorities: [{ key: "qualite_air", label: "la qualité de l'air" }],
  }));
  assert.deepEqual(plan.blocks.map((b) => b.key), [
    "verdict", "unexamined_hard_constraints", "reserves_found", "uncovered_priorities",
  ]);
  assert.deepEqual(plan.blocks.filter((b) => b.generable).map((b) => b.key), [
    "unexamined_hard_constraints", "reserves_found", "uncovered_priorities",
  ]);
});

test("un registre vide ne produit aucun bloc", () => {
  assert.deepEqual(buildConclusionPlan(baseInput()).blocks.map((b) => b.key), ["verdict"]);
});

test("reservesCount compte les faits AFFICHÉS qu'on lui donne", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring"), verification("f2", "secondary")],
  }));
  assert.equal(plan.reservesCount, 2);
  assert.match(plan.blocks.find((b) => b.key === "reserves_found")!.fallbackText, /2 points/);
});

test("requiredPhrases : les libellés des contraintes non examinées doivent survivre à la rédaction", () => {
  const plan = buildConclusionPlan(baseInput({
    uncovered: [
      { key: "nearSea", label: "la proximité de la mer" },
      { key: "nearPlace", label: "la proximité d'un lieu" },
    ],
  }));
  assert.deepEqual(
    plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.requiredPhrases,
    ["la proximité de la mer", "la proximité d'un lieu"],
  );
});

test("requiredPhrases : les libellés des priorités non couvertes doivent survivre", () => {
  const plan = buildConclusionPlan(baseInput({
    uncoveredPriorities: [{ key: "qualite_air", label: "la qualité de l'air" }],
  }));
  assert.deepEqual(
    plan.blocks.find((b) => b.key === "uncovered_priorities")!.requiredPhrases,
    ["la qualité de l'air"],
  );
});

test("requiredPhrases : le nombre de réserves, et le constat du lead quand il est single", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical", "L'étiquette F du logement"), verification("f2", "secondary")],
  }));
  assert.deepEqual(
    plan.blocks.find((b) => b.key === "reserves_found")!.requiredPhrases,
    ["2", "L'étiquette F du logement"],
  );
});

test("requiredPhrases : lead tied -> le nombre seul (aucun fait n'est couronné)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "decision_critical")],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.requiredPhrases, ["2"]);
});

test("les sourceIds d'un bloc viennent du déterministe", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring")],
    uncovered: [{ key: "nearSea", label: "la proximité de la mer" }],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.sourceIds, ["f1"]);
  assert.deepEqual(plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.sourceIds, ["nearSea"]);
});

test("lead single : un fait domine STRICTEMENT tous les autres", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "structuring")],
  }));
  assert.deepEqual(plan.lead, {
    kind: "single", factId: "f1", statement: "constat f1", materialityTier: "decision_critical",
  });
});

test("lead tied : deux faits partagent le rang maximal (un ordre de registre n'est pas une priorité)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "decision_critical"),
      verification("f2", "decision_critical"),
      verification("f3", "secondary"),
    ],
  }));
  assert.deepEqual(plan.lead, { kind: "tied", factIds: ["f1", "f2"], materialityTier: "decision_critical" });
});

test("lead none : rien d'assez matériel (rang maximal = secondary)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "secondary"), verification("f2", "secondary")],
  }));
  assert.deepEqual(plan.lead, { kind: "none" });
});

test("lead none : aucune réserve", () => {
  assert.deepEqual(buildConclusionPlan(baseInput()).lead, { kind: "none" });
});

test("le plan ne contient AUCUN champ volatil (observedAt, sourceMode)", () => {
  const fact = verification("f1", "structuring");
  (fact as { evidence: { observedAt?: string; sourceMode?: string }[] }).evidence[0]!.observedAt =
    "2026-07-13T10:00:00Z";
  const serialized = JSON.stringify(buildConclusionPlan(baseInput({ shownFacts: [fact] })));
  assert.equal(serialized.includes("observedAt"), false);
  assert.equal(serialized.includes("2026-07-13"), false);
  assert.equal(serialized.includes("sourceMode"), false);
});

test("projet non structuré : verdict d'invite, aucun autre bloc", () => {
  const plan = buildConclusionPlan(baseInput({
    conclusionState: "project_not_structured",
    uncoveredPriorities: [{ key: "qualite_air", label: "la qualité de l'air" }],
  }));
  assert.deepEqual(plan.blocks.map((b) => b.key), ["verdict"]);
});

test("incompatibilité établie : le verdict porte le constat, et reste déterministe", () => {
  const plan = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility",
    establishedIncompatibility: { factId: "i1", statement: "504 078 habitants, au-delà de 20 000." },
  }));
  assert.match(plan.blocks[0]!.fallbackText, /504 078 habitants/);
  assert.deepEqual(plan.blocks[0]!.sourceIds, ["i1"]);
  assert.equal(plan.blocks[0]!.generable, false);
});

test("le grain est explicite dans le verdict", () => {
  assert.match(buildConclusionPlan(baseInput({ scope: "commune+adresse" })).blocks[0]!.fallbackText,
    /commune et de l'adresse/);
  assert.match(buildConclusionPlan(baseInput({ scope: "commune" })).blocks[0]!.fallbackText,
    /À l'échelle de la commune,/);
});
```

- [ ] **Step 2 : Lancer les tests, vérifier qu'ils échouent**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3 : Écrire l'implémentation**

Créer `src/lib/decision/conclusion-plan.ts` :

```ts
// Le PLAN NARRATIF : ce que le déterministe a décidé, avant qu'un LLM n'ouvre la bouche (slice 2).
// Il porte la présence, l'ORDRE, les sources, la matière obligatoire et le texte de repli de chaque
// registre. L'IA reçoit ce plan et ne renvoie que { key, text }. Fonctions PURES.
//
// La hiérarchie éditoriale des réserves (du plus grave au moins grave) :
//   1. verdict                     l'état de conclusion, borné au périmètre réellement examiné
//   2. unexamined_hard_constraints une condition ABSOLUE n'a pas pu être testée : elle diminue la
//                                  valeur du verdict, donc elle le suit immédiatement
//   3. reserves_found              ce qu'on a examiné et qui appelle un regard
//   4. uncovered_priorities        réduit la personnalisation, n'invalide pas le verdict
// Une contrainte dure non examinée et une préférence non couverte sont deux absences de couverture.
// Elles ne partagent JAMAIS le même bloc.
import type { DecisionFact, ConclusionState, MaterialityTier, UncoveredConstraint } from "./decision-fact.ts";
import type { ProjectPosture } from "../user-project.ts";

export type BlockKey = "verdict" | "unexamined_hard_constraints" | "reserves_found" | "uncovered_priorities";

export type NarrativeBlock = {
  key: BlockKey;
  fallbackText: string;      // le texte déterministe de CE registre, affichable seul
  sourceIds: string[];       // factIds / HardConstraintKey / PreferenceKey. JAMAIS produits par l'IA.
  requiredPhrases: string[]; // matière qui doit SURVIVRE à la rédaction, textuellement
  maxChars: number;
  generable: boolean;        // false = déterministe, hors de portée du modèle
};

// Le fait saillant est DÉSIGNÉ par le déterministe, jamais élu par l'IA. `tied` existe parce que
// prendre le premier d'un tri à égalité transformerait un ordre de DÉCLARATION dans le registre en
// PRIORITÉ MÉTIER : si deux faits sont decision_critical, écrire « à commencer par le PPRN » ment.
export type LeadSelection =
  | { kind: "single"; factId: string; statement: string; materialityTier: MaterialityTier }
  | { kind: "tied"; factIds: string[]; materialityTier: MaterialityTier }
  | { kind: "none" };

export type ConclusionNarrativePlan = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  blocks: NarrativeBlock[];
  reservesCount: number; // faits AFFICHÉS (post-caps), jamais faits émis
  lead: LeadSelection;
};

// Ce que l'assembleur fournit. Un `Dossier` ne peut pas être l'entrée : il PORTERA ce plan (cycle).
export type ConclusionPlanInput = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  shownFacts: DecisionFact[]; // les faits réellement affichés, après plafonnement des sections
  uncovered: UncoveredConstraint[];
  uncoveredPriorities: { key: string; label: string }[];
  establishedIncompatibility: { factId: string; statement: string } | null;
};

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
const RESERVE_ROLES = new Set<DecisionFact["role"]>(["verification", "compromise", "unknown"]);

function reserves(facts: DecisionFact[]): DecisionFact[] {
  return facts.filter((f) => RESERVE_ROLES.has(f.role));
}

export function selectLead(shownFacts: DecisionFact[]): LeadSelection {
  const rs = reserves(shownFacts);
  if (rs.length === 0) return { kind: "none" };
  const best = Math.min(...rs.map((f) => TIER_ORDER[f.materialityTier]));
  // secondary ne couronne rien : il n'y a alors rien d'assez matériel pour être cité.
  if (best === TIER_ORDER.secondary) return { kind: "none" };
  const top = rs.filter((f) => TIER_ORDER[f.materialityTier] === best);
  if (top.length === 1) {
    const f = top[0]!;
    return { kind: "single", factId: f.id, statement: f.statement, materialityTier: f.materialityTier };
  }
  return { kind: "tied", factIds: top.map((f) => f.id), materialityTier: top[0]!.materialityTier };
}

function verdictText(input: ConclusionPlanInput): string {
  const scope = input.scope === "commune+adresse"
    ? "À l'échelle de la commune et de l'adresse,"
    : "À l'échelle de la commune,";
  switch (input.conclusionState) {
    case "project_not_structured":
      return "Décrivez votre projet pour une lecture qui met en regard ce lieu et ce qui compte pour vous.";
    case "established_incompatibility":
      return `${scope} une contrainte que vous avez déclarée n'est pas respectée ici : ${input.establishedIncompatibility?.statement ?? ""}`;
    case "insufficient_evidence":
      return `${scope} nous ne pouvons pas conclure honnêtement : une donnée déterminante pour votre projet manque.`;
    case "no_hard_constraint_declared":
      return `Vous n'avez déclaré aucune condition comme absolument non négociable. ${scope} rien ne permet donc d'écarter ce lieu sur cette seule base.`;
    case "no_incompatibility_established":
      return `${scope} sur les contraintes que nous savons examiner, aucune n'est contredite.`;
  }
}

export function buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan {
  // LE VERDICT N'EST JAMAIS GÉNÉRÉ. C'est la phrase qui peut renverser une décision perçue : un
  // modèle qui reformule « aucune contrainte n'est contredite » en « ce lieu vous correspond » aurait
  // menti sur ce qui a été établi. Il le reçoit en lecture seule, pour que la suite s'y articule.
  const blocks: NarrativeBlock[] = [{
    key: "verdict",
    fallbackText: verdictText(input),
    sourceIds: input.establishedIncompatibility ? [input.establishedIncompatibility.factId] : [],
    requiredPhrases: [],
    maxChars: 320,
    generable: false,
  }];

  // Un projet non structuré n'est pas une analyse, c'est une invite. Aucun autre registre.
  if (input.conclusionState === "project_not_structured") {
    return { scope: input.scope, conclusionState: input.conclusionState, posture: input.posture, blocks, reservesCount: 0, lead: { kind: "none" } };
  }

  if (input.uncovered.length > 0) {
    blocks.push({
      key: "unexamined_hard_constraints",
      fallbackText: `Nous n'avons pas encore examiné, à ce grain : ${input.uncovered.map((u) => u.label).join(", ")}.`,
      sourceIds: input.uncovered.map((u) => u.key),
      // Chaque contrainte doit SURVIVRE à la rédaction : « une condition importante reste à examiner »
      // ferait disparaître la gare, sans qu'aucune autre validation ne s'en aperçoive.
      requiredPhrases: input.uncovered.map((u) => u.label),
      maxChars: 260,
      generable: true,
    });
  }

  const rs = reserves(input.shownFacts);
  const lead = selectLead(input.shownFacts);
  if (rs.length > 0) {
    const n = rs.length;
    blocks.push({
      key: "reserves_found",
      fallbackText: `${n} point${n > 1 ? "s" : ""} mérite${n > 1 ? "nt" : ""} d'être examiné${n > 1 ? "s" : ""} de près.`,
      sourceIds: rs.map((f) => f.id),
      // Le nombre exact, et le constat du fait saillant quand il y en a un. `tied` n'en couronne aucun.
      requiredPhrases: lead.kind === "single" ? [String(n), lead.statement] : [String(n)],
      maxChars: 300,
      generable: true,
    });
  }

  if (input.uncoveredPriorities.length > 0) {
    const top = input.uncoveredPriorities.slice(0, 3);
    blocks.push({
      key: "uncovered_priorities",
      fallbackText: `Vos priorités concernant ${top.map((p) => p.label).join(", ")} ne sont pas encore couvertes dans cette synthèse.`,
      sourceIds: top.map((p) => p.key),
      requiredPhrases: top.map((p) => p.label),
      maxChars: 260,
      generable: true,
    });
  }

  return {
    scope: input.scope,
    conclusionState: input.conclusionState,
    posture: input.posture,
    blocks,
    reservesCount: rs.length,
    lead,
  };
}
```

- [ ] **Step 4 : Lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: PASS (17 tests).

- [ ] **Step 5 : Le `Dossier` porte le plan**

Dans `src/lib/decision/decision-fact.ts`, ajouter l'import de type :

```ts
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
```

et dans `export type Dossier`, après `conclusion: string;` :

```ts
  // Le plan narratif (slice 2) : présence, ordre, sources, matière obligatoire et repli de chaque
  // registre. `conclusion` en est la concaténation, gardée pour qui veut une seule phrase.
  narrativePlan: ConclusionNarrativePlan;
```

- [ ] **Step 6 : L'assembleur produit le plan, et compte les faits AFFICHÉS**

Dans `src/lib/decision/decision-assembler.ts` : supprimer `examinedClause`, `reservesClause`, `prioritiesClause` et `conclusionText` (leur contenu vit désormais dans `conclusion-plan.ts`), ajouter l'import, et réécrire `assembleDossier` :

```ts
import { buildConclusionPlan } from "./conclusion-plan.ts";
```

```ts
export function assembleDossier(run: RunResult, project: UserProject, scope: "commune" | "commune+adresse"): Dossier {
  const { facts, coveredHardConstraints } = run;
  const uncovered = uncoveredConstraints(project, coveredHardConstraints);
  const state = conclusionState(facts, project);
  const l = labels(project);
  const candidates: DossierSection[] = [
    { key: "incompatibilities", title: "Vos contraintes non négociables", facts: byRole(facts, "incompatibility", 2) },
    { key: "compromises", title: "Ce qui départage vraiment", facts: byRole(facts, "compromise", 3) },
    { key: "unknowns", title: "Ce que nous ne savons pas encore", facts: byRole(facts, "unknown", 3) },
    { key: "verifications", title: l.verifTitle, facts: byRole(facts, "verification", 4) },
  ];
  const sections = candidates.filter((s) => s.facts.length > 0);
  const shown = sections.flatMap((s) => s.facts);

  // Les réserves annoncées sont celles qu'on MONTRE. Compter `facts` (les faits émis) alors que les
  // sections sont plafonnées annonçait « 5 points » et n'en affichait que 4.
  const established = facts.find((f) => f.role === "incompatibility" && f.evidenceStrength === "established");
  const narrativePlan = buildConclusionPlan({
    scope,
    conclusionState: state,
    posture: project.posture,
    shownFacts: shown,
    uncovered,
    uncoveredPriorities: uncoveredPreferences(project),
    establishedIncompatibility: established ? { factId: established.id, statement: established.statement } : null,
  });

  return {
    scope,
    conclusionState: state,
    conclusion: narrativePlan.blocks.map((b) => b.fallbackText).join(" "),
    narrativePlan,
    conclusionBasis: {
      ruleIds: [...new Set(shown.map((f) => f.ruleId))],
      factIds: shown.map((f) => f.id),
      evidence: shown.flatMap(factEvidence),
    },
    sections,
    uncovered,
  };
}
```

- [ ] **Step 7 : Le test du comptage change de vérité**

`src/lib/decision/decision-assembler.test.ts` a déjà les fabriques `project(parsed)`, `run(facts, covered)` et `verif()`. `verif()` retourne toujours `id: "v"` : le test des caps a besoin d'identifiants distincts. Remplacer la fabrique (lignes 16-18) par :

```ts
function verif(id = "v"): DecisionFact {
  return { id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
}
```

(les appels existants `verif()` restent valides). Puis ajouter :

```ts
test("les réserves annoncées sont les faits AFFICHÉS, jamais les faits émis (caps)", () => {
  // 5 vérifications émises, section plafonnée à 4 : la conclusion doit annoncer 4, pas 5.
  const facts = Array.from({ length: 5 }, (_, i) => verif(`v${i}`));
  const d = assembleDossier(run(facts, ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.sections.find((s) => s.key === "verifications")!.facts.length, 4);
  assert.equal(d.narrativePlan.reservesCount, 4);
  assert.match(d.conclusion, /4 points/);
});
```

- [ ] **Step 8 : Lancer toute la suite decision**

Run: `node --test src/lib/decision/*.test.ts && npx tsc --noEmit`
Expected: PASS. Les tests existants de conclusion continuent de passer : `conclusion` reste la même phrase, sauf le comptage des réserves plafonnées, qui est le bug corrigé.

- [ ] **Step 9 : Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-plan.test.ts src/lib/decision/decision-fact.ts src/lib/decision/decision-assembler.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(decision): plan narratif déterministe (verdict non générable, requiredPhrases, lead)"
```

---

## Task 3 : Le gate de complexité narrative

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts` (ajouter `shouldGenerateNarrative`)
- Modify: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Produces: `shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean`

La règle : **on appelle l'IA seulement quand plusieurs éléments déjà hiérarchisés doivent être articulés, jamais pour rendre élégant un dossier pauvre.** Le nombre brut de blocs n'est pas l'indicateur : « verdict + priorités non couvertes » est précisément le cas où une belle phrase maquillerait une absence de couverture.

- [ ] **Step 1 : Écrire les tests qui échouent (la table de vérité de la spec §5)**

Ajouter à `src/lib/decision/conclusion-plan.test.ts` (et étendre l'import existant avec `shouldGenerateNarrative`) :

```ts
const AIR = { key: "qualite_air", label: "la qualité de l'air" };
const MER = { key: "nearSea" as const, label: "la proximité de la mer" };

test("gate : projet non structuré -> jamais", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput({ conclusionState: "project_not_structured" }))), false);
});

test("gate : verdict seul -> non", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput())), false);
});

test("gate : verdict + priorités non couvertes seules -> non (rien à articuler, matière faible)", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput({ uncoveredPriorities: [AIR] }))), false);
});

test("gate : verdict + une contrainte dure non examinée -> non (deux phrases déjà honnêtes)", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput({ uncovered: [MER] }))), false);
});

test("gate : verdict + une seule réserve -> non", () => {
  const plan = buildConclusionPlan(baseInput({ shownFacts: [verification("f1", "decision_critical")] }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict + deux réserves secondaires (lead none) -> non", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "secondary"), verification("f2", "secondary")],
  }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict + deux réserves dont une domine -> oui", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "secondary")],
  }));
  assert.equal(shouldGenerateNarrative(plan), true);
});

test("gate : verdict + trois réserves ou plus -> oui", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "secondary"), verification("f2", "secondary"), verification("f3", "secondary")],
  }));
  assert.equal(shouldGenerateNarrative(plan), true);
});

test("gate : verdict + deux registres non-verdict -> oui", () => {
  const plan = buildConclusionPlan(baseInput({ uncovered: [MER], uncoveredPriorities: [AIR] }));
  assert.equal(shouldGenerateNarrative(plan), true);
});

test("gate : verdict + contrainte dure non examinée + réserves -> oui", () => {
  const plan = buildConclusionPlan(baseInput({
    uncovered: [MER], shownFacts: [verification("f1", "structuring")],
  }));
  assert.equal(shouldGenerateNarrative(plan), true);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: FAIL, `shouldGenerateNarrative is not a function`.

- [ ] **Step 3 : Implémenter le gate**

Ajouter à la fin de `src/lib/decision/conclusion-plan.ts` :

```ts
// LA RÈGLE : on appelle l'IA seulement quand plusieurs éléments DÉJÀ HIÉRARCHISÉS doivent être
// articulés. Jamais pour maquiller un dossier pauvre : reformuler brillamment « verdict + vos
// priorités ne sont pas couvertes » ne ferait que rendre élégante une absence de couverture.
// Le nombre brut de blocs n'est donc pas l'indicateur.
export function shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean {
  if (plan.conclusionState === "project_not_structured") return false;

  const generable = plan.blocks.filter((b) => b.generable).length;
  if (generable >= 2) return true;                                         // deux registres à articuler
  if (plan.reservesCount >= 3) return true;                               // beaucoup de réserves à ordonner
  if (plan.reservesCount >= 2 && plan.lead.kind === "single") return true; // une réserve domine : à dire
  return false;
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: PASS (27 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-plan.test.ts
git commit -m "feat(decision): gate de complexité narrative (jamais pour maquiller un dossier pauvre)"
```

---

## Task 4 : La validation, vrai contrat de la sortie

**Files:**
- Create: `src/lib/decision/conclusion-validate.ts`
- Create: `src/lib/decision/conclusion-validate.test.ts`

**Interfaces:**
- Consumes: `ConclusionNarrativePlan` (Task 2), `zod`.
- Produces:
  - `type GeneratedBlock = { key: string; text: string }`
  - `type RenderedBlock = { key: BlockKey; text: string; sourceIds: string[]; generated: boolean }`
  - `type RejectionReason = "missing" | "unknown_key" | "not_generable" | "duplicate_key" | "invalid_shape" | "empty" | "too_long" | "unauthorized_number" | "missing_required_phrase"`
  - `type ValidationResult = { blocks: RenderedBlock[]; rejected: { key: string; reason: RejectionReason }[] }`
  - `validateGeneratedBlocks(plan, raw: unknown[]): ValidationResult`

**La validation prend `unknown[]`, pas `GeneratedBlock[]` :** le schéma zod passé à `generateObject` est `{ blocks: z.array(z.unknown()) }`. Un schéma qui exigerait `{ key: string, text: string }` sur chaque élément ferait échouer **l'objet entier** dès qu'un seul élément est malformé (`{ key: "verdict", text: null }`), ce qui détruirait la récupération bloc par bloc que la spec promet. C'est donc ici, élément par élément, que la forme est vérifiée (`invalid_shape`).

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/lib/decision/conclusion-validate.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGeneratedBlocks } from "./conclusion-validate.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";

function plan(): ConclusionNarrativePlan {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    reservesCount: 3,
    lead: { kind: "none" },
    blocks: [
      { key: "verdict", fallbackText: "Aucune contrainte n'est contredite.", sourceIds: [], requiredPhrases: [], maxChars: 320, generable: false },
      { key: "unexamined_hard_constraints", fallbackText: "Nous n'avons pas encore examiné, à ce grain : la proximité de la mer, la présence d'une gare.", sourceIds: ["nearSea", "nearPlace"], requiredPhrases: ["la proximité de la mer", "la présence d'une gare"], maxChars: 260, generable: true },
      { key: "reserves_found", fallbackText: "3 points méritent d'être examinés de près.", sourceIds: ["f1", "f2", "f3"], requiredPhrases: ["3"], maxChars: 300, generable: true },
    ],
  };
}

test("sortie conforme : les textes générés sont retenus, la provenance vient du PLAN", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "unexamined_hard_constraints", text: "Cette conclusion reste incomplète : la proximité de la mer et la présence d'une gare n'ont pas pu être vérifiées." },
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.rejected.length, 0);
  assert.deepEqual(r.blocks[2]!.sourceIds, ["f1", "f2", "f3"]); // reconstituée, jamais reçue du modèle
  assert.equal(r.blocks[2]!.generated, true);
});

test("LE VERDICT N'EST JAMAIS GÉNÉRÉ : une reformulation du verdict est rejetée", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "Ce lieu vous correspond." },
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.blocks[0]!.text, "Aucune contrainte n'est contredite.");
  assert.equal(r.blocks[0]!.generated, false);
  assert.ok(r.rejected.some((x) => x.key === "verdict" && x.reason === "not_generable"));
});

test("un bloc non générable n'est jamais compté comme manquant", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "reserves_found", text: "3 points demandent un regard." }]);
  assert.equal(r.rejected.some((x) => x.key === "verdict" && x.reason === "missing"), false);
});

test("la matière ne peut pas disparaître DANS un bloc (requiredPhrases)", () => {
  const r = validateGeneratedBlocks(plan(), [
    // La gare s'évapore : la clé est bonne, le texte est court, aucun nombre inventé. Rejeté quand même.
    { key: "unexamined_hard_constraints", text: "Une condition importante de votre projet reste à examiner." },
  ]);
  assert.equal(r.blocks[1]!.generated, false);
  assert.equal(r.blocks[1]!.text, plan().blocks[1]!.fallbackText);
  assert.ok(r.rejected.some((x) => x.reason === "missing_required_phrase"));
});

test("l'ordre du modèle est ignoré : le rendu suit l'ordre du plan", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "3 points demandent un regard." },
    { key: "unexamined_hard_constraints", text: "Restent la proximité de la mer et la présence d'une gare." },
  ]);
  assert.deepEqual(r.blocks.map((b) => b.key), ["verdict", "unexamined_hard_constraints", "reserves_found"]);
});

test("bloc générable manquant : son fallback, les autres survivent", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "reserves_found", text: "3 points demandent un regard." }]);
  assert.equal(r.blocks[1]!.generated, false);
  assert.equal(r.blocks[2]!.generated, true);
  assert.ok(r.rejected.some((x) => x.key === "unexamined_hard_constraints" && x.reason === "missing"));
});

test("élément malformé : rejeté SEUL, les autres survivent (invalid_shape)", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "unexamined_hard_constraints", text: null },
    "n'importe quoi",
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.blocks[2]!.generated, true); // le bloc valide passe
  assert.equal(r.blocks[1]!.generated, false); // le malformé retombe en repli
  assert.equal(r.rejected.filter((x) => x.reason === "invalid_shape").length, 2);
});

test("clé inconnue : ignorée et journalisée", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "recommandation", text: "Faites réaliser une étude de sol." },
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.blocks.some((b) => b.text.includes("étude de sol")), false);
  assert.ok(r.rejected.some((x) => x.key === "recommandation" && x.reason === "unknown_key"));
});

test("clé en double : le second est rejeté", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "3 points demandent un regard." },
    { key: "reserves_found", text: "Tout va bien." },
  ]);
  assert.equal(r.blocks[2]!.text, "3 points demandent un regard.");
  assert.ok(r.rejected.some((x) => x.reason === "duplicate_key"));
});

test("texte vide ou blanc : fallback", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "reserves_found", text: "   " }]);
  assert.equal(r.blocks[2]!.text, "3 points méritent d'être examinés de près.");
  assert.ok(r.rejected.some((x) => x.reason === "empty"));
});

test("dépassement de maxChars : fallback de CE bloc seulement", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "3 " + "a".repeat(300) },
    { key: "unexamined_hard_constraints", text: "Restent la proximité de la mer et la présence d'une gare." },
  ]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.equal(r.blocks[1]!.generated, true);
  assert.ok(r.rejected.some((x) => x.reason === "too_long"));
});

test("nombre absent du fallback : hallucination factuelle rejetée", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "reserves_found", text: "4 points demandent un regard." }]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("année ou horizon inventé : rejeté", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "D'ici 2050, 3 points demandent un regard." },
  ]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("sortie totalement vide : tout retombe en déterministe", () => {
  const r = validateGeneratedBlocks(plan(), []);
  assert.equal(r.blocks.every((b) => !b.generated), true);
  assert.deepEqual(r.blocks.map((b) => b.text), plan().blocks.map((b) => b.fallbackText));
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/conclusion-validate.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3 : Implémenter**

Créer `src/lib/decision/conclusion-validate.ts` :

```ts
// Le VRAI contrat de la sortie du modèle. Fonction PURE, testée sans LLM.
//
// Elle prend des `unknown[]` : le schéma zod passé à generateObject est { blocks: z.array(z.unknown()) },
// volontairement permissif. Un schéma qui exigerait { key, text } sur chaque élément ferait échouer
// l'objet ENTIER dès qu'UN élément est malformé, ce qui tuerait la récupération bloc par bloc.
//
// Ce que le modèle ne peut pas faire, et que ce code vérifie plutôt que d'espérer :
//   - toucher au VERDICT (generable: false) : la phrase qui peut renverser une décision perçue ;
//   - faire disparaître une matière DANS un bloc (requiredPhrases) : deux contraintes non examinées
//     ne deviennent pas « une condition importante » ;
//   - introduire un chiffre, une année, un horizon absent du texte de repli du bloc ;
//   - fabriquer une provenance : il ne renvoie que { key, text }, les sourceIds viennent du plan.
import { z } from "zod";
import type { ConclusionNarrativePlan, BlockKey } from "./conclusion-plan.ts";

export type GeneratedBlock = { key: string; text: string };
export type RenderedBlock = { key: BlockKey; text: string; sourceIds: string[]; generated: boolean };
export type RejectionReason =
  | "missing" | "unknown_key" | "not_generable" | "duplicate_key" | "invalid_shape"
  | "empty" | "too_long" | "unauthorized_number" | "missing_required_phrase";
export type ValidationResult = {
  blocks: RenderedBlock[];
  rejected: { key: string; reason: RejectionReason }[];
};

const generatedBlockSchema = z.object({ key: z.string(), text: z.string() });

// Tout nombre, pourcentage, année ou horizon d'un texte généré doit déjà figurer dans le fallbackText
// de SON bloc. Contrôle grossier, qui attrape une grande part des hallucinations factuelles sans
// prétendre valider le sens (ce qui serait hors de portée).
function numbersIn(text: string): string[] {
  return text.match(/\d+([.,]\d+)?/g) ?? [];
}

export function validateGeneratedBlocks(
  plan: ConclusionNarrativePlan,
  raw: unknown[],
): ValidationResult {
  const rejected: ValidationResult["rejected"] = [];
  const generableKeys = new Set<string>(plan.blocks.filter((b) => b.generable).map((b) => b.key));
  const knownKeys = new Set<string>(plan.blocks.map((b) => b.key));

  // Première occurrence gagnante : un doublon de clé est un rejet, pas un écrasement.
  const byKey = new Map<string, string>();
  for (const item of raw) {
    const parsed = generatedBlockSchema.safeParse(item);
    if (!parsed.success) {
      const key = typeof (item as { key?: unknown })?.key === "string" ? (item as { key: string }).key : "?";
      rejected.push({ key, reason: "invalid_shape" });
      continue;
    }
    const { key, text } = parsed.data;
    if (!knownKeys.has(key)) { rejected.push({ key, reason: "unknown_key" }); continue; }
    if (!generableKeys.has(key)) { rejected.push({ key, reason: "not_generable" }); continue; }
    if (byKey.has(key)) { rejected.push({ key, reason: "duplicate_key" }); continue; }
    byKey.set(key, text);
  }

  // L'ORDRE DU RENDU EST CELUI DU PLAN. L'ordre de réponse du modèle est ignoré.
  const blocks = plan.blocks.map((b): RenderedBlock => {
    const fallback = { key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false };
    if (!b.generable) return fallback; // le verdict : jamais généré, jamais « manquant »

    const text = byKey.get(b.key);
    if (text === undefined) { rejected.push({ key: b.key, reason: "missing" }); return fallback; }

    const trimmed = text.trim();
    if (trimmed.length === 0) { rejected.push({ key: b.key, reason: "empty" }); return fallback; }
    if (trimmed.length > b.maxChars) { rejected.push({ key: b.key, reason: "too_long" }); return fallback; }

    const allowed = new Set(numbersIn(b.fallbackText));
    if (numbersIn(trimmed).some((n) => !allowed.has(n))) {
      rejected.push({ key: b.key, reason: "unauthorized_number" });
      return fallback;
    }
    if (b.requiredPhrases.some((p) => !trimmed.includes(p))) {
      rejected.push({ key: b.key, reason: "missing_required_phrase" });
      return fallback;
    }
    return { key: b.key, text: trimmed, sourceIds: b.sourceIds, generated: true };
  });

  return { blocks, rejected };
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

Run: `node --test src/lib/decision/conclusion-validate.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/conclusion-validate.ts src/lib/decision/conclusion-validate.test.ts
git commit -m "feat(decision): validation pure de la sortie IA (verdict intouchable, matière obligatoire, récupération par bloc)"
```

---

## Task 5 : L'identité de l'artefact

**Files:**
- Create: `src/lib/decision/conclusion-hash.ts`
- Create: `src/lib/decision/conclusion-hash.test.ts`

**Interfaces:**
- Consumes: `stableStringify` (Task 1, universel), `sha256Hex` (Task 1, server-only), `ConclusionNarrativePlan` (Task 2).
- Produces: `DECISION_NARRATIVE_CONTRACT_VERSION`, `DECISION_NARRATIVE_PROMPT_VERSION`, `DECISION_NARRATIVE_MODEL`, `hashPayload(plan, over?)`, `buildConclusionHash(plan): string`

`conclusion-hash.ts` importe `sha256Hex`, donc il est **serveur**. Il n'est jamais importé par un composant client.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/lib/decision/conclusion-hash.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionHash, hashPayload } from "./conclusion-hash.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
import { stableStringify } from "../stable-stringify.ts";
import { sha256Hex } from "../server/sha256.ts";

function plan(over: Partial<ConclusionNarrativePlan> = {}): ConclusionNarrativePlan {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    reservesCount: 2,
    lead: { kind: "none" },
    blocks: [{ key: "verdict", fallbackText: "Aucune contrainte n'est contredite.", sourceIds: [], requiredPhrases: [], maxChars: 320, generable: false }],
    ...over,
  };
}

test("le hash est déterministe et hexadécimal", () => {
  assert.equal(buildConclusionHash(plan()), buildConclusionHash(plan()));
  assert.match(buildConclusionHash(plan()), /^[0-9a-f]{64}$/);
});

test("un plan différent donne un hash différent", () => {
  assert.notEqual(buildConclusionHash(plan()), buildConclusionHash(plan({ reservesCount: 3 })));
});

test("modèle changé -> hash différent", () => {
  const a = sha256Hex(stableStringify(hashPayload(plan(), { model: "claude-sonnet-4-6" })));
  const b = sha256Hex(stableStringify(hashPayload(plan(), { model: "autre-modele" })));
  assert.notEqual(a, b);
});

test("prompt changé -> hash différent", () => {
  const a = sha256Hex(stableStringify(hashPayload(plan(), { promptVersion: "v1" })));
  const b = sha256Hex(stableStringify(hashPayload(plan(), { promptVersion: "v2" })));
  assert.notEqual(a, b);
});

test("contrat changé -> hash différent (le schéma de sortie a bougé, le prompt non)", () => {
  const a = sha256Hex(stableStringify(hashPayload(plan(), { contractVersion: "c1" })));
  const b = sha256Hex(stableStringify(hashPayload(plan(), { contractVersion: "c2" })));
  assert.notEqual(a, b);
});

test("les versions sont DANS la matière hachée, pas concaténées après", () => {
  const payload = hashPayload(plan(), {});
  assert.ok("promptVersion" in payload && "model" in payload && "contractVersion" in payload && "plan" in payload);
});
```

Note : `sha256.ts` porte `import "server-only"`. Sous `node --test`, ce module n'existe pas et l'import casserait, exactement comme le piège `comparateur-vie.ts`. Le test ci-dessus **value-importe** `sha256Hex`. Si `node --test` échoue sur `ERR_MODULE_NOT_FOUND: server-only`, retirer le `import "server-only"` de `src/lib/server/sha256.ts` : le module vit sous `src/lib/server/`, n'est importé que par du code serveur, et la garantie est alors conventionnelle plutôt que mécanique. Vérifier d'abord si le repo a un stub `server-only` (`ls node_modules/server-only`) : c'est le cas dans la plupart des installations Next, et l'import passe alors sans problème.

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/conclusion-hash.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` sur `./conclusion-hash.ts`.

- [ ] **Step 3 : Implémenter**

Créer `src/lib/decision/conclusion-hash.ts` :

```ts
// IDENTITÉ de l'artefact narratif. Les versions sont DANS la matière hachée, jamais concaténées
// après un hash du plan.
//
// Ce hash remplace toute pile de compteurs manuels (rulesRegistryVersion, dossierSchemaVersion,
// projectVersion) : le plan contient DÉJÀ le produit de tout cela (les fallbackText, les libellés,
// les identifiants, l'état), et un compteur qu'on oublie d'incrémenter affiche un texte périmé comme
// s'il était courant. Le plan est purgé de tout champ volatil (observedAt, sourceMode) par
// construction, cf. conclusion-plan.ts : sinon l'artefact s'invaliderait à chaque chargement.
import { stableStringify } from "../stable-stringify.ts";
import { sha256Hex } from "../server/sha256.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";

// Le schéma de sortie + les règles de validation. À bumper quand conclusion-validate change de contrat.
export const DECISION_NARRATIVE_CONTRACT_VERSION = "c1";
// Le prompt système. À bumper à chaque retouche du texte du prompt.
export const DECISION_NARRATIVE_PROMPT_VERSION = "v1";
export const DECISION_NARRATIVE_MODEL = "claude-sonnet-4-6";

export function hashPayload(
  plan: ConclusionNarrativePlan,
  over: { contractVersion?: string; promptVersion?: string; model?: string } = {},
) {
  return {
    contractVersion: over.contractVersion ?? DECISION_NARRATIVE_CONTRACT_VERSION,
    promptVersion: over.promptVersion ?? DECISION_NARRATIVE_PROMPT_VERSION,
    model: over.model ?? DECISION_NARRATIVE_MODEL,
    locale: "fr-FR",
    plan,
  };
}

export function buildConclusionHash(plan: ConclusionNarrativePlan): string {
  return sha256Hex(stableStringify(hashPayload(plan)));
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

Run: `node --test src/lib/decision/conclusion-hash.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/conclusion-hash.ts src/lib/decision/conclusion-hash.test.ts
git commit -m "feat(decision): identité SHA-256 de l'artefact narratif (versions dans la matière hachée)"
```

---

## Task 6 : La table et le store

**Files:**
- Create: `supabase/23_decision_narrative.sql`
- Create: `src/lib/server/decision-narrative-store.ts`

**Interfaces:**
- Consumes: `SupabaseClient`, `zod`.
- Produces:
  - `type StoredBlocks = { key: string; text: string }[]`
  - `readNarrative(sb, userId, insee, scopeKey, inputHash): Promise<StoredBlocks | null>` — **valide le JSON lu**, renvoie `null` s'il ne passe plus le contrat courant
  - `saveNarrative(sb, …, blocks, promptVersion, model): Promise<StoredBlocks>` — upsert idempotent **puis relecture de la ligne canonique**, dont le contenu est retourné
  - `pruneNarratives(sb, userId, insee, scopeKey, keep): Promise<void>`

**Trois exigences, chacune corrige un mensonge possible :**

1. **Le JSON lu est validé.** Un cast `as StoredBlocks` contredirait la promesse « l'artefact est relu avec le schéma courant » et ferait tomber le Server Component sur un JSON malformé.
2. **On stocke tous les blocs rendus** (générés *et* replis des blocs rejetés, hormis le verdict qui n'est jamais généré), pour que la base contienne exactement ce qui a été affiché, et qu'une relecture ne transforme pas un bloc absent en nouveau rejet.
3. **Les générations concurrentes convergent.** Deux requêtes peuvent constater le même cache miss : A insère, B tombe sur le conflit. Si B affichait quand même **son** texte, le lecteur retrouverait celui de A au rechargement, ce qui contredit « le texte affiché est celui qu'on retrouvera ». Donc après l'upsert, on **relit la ligne canonique** et c'est elle qu'on rend.

- [ ] **Step 1 : Écrire la migration**

Créer `supabase/23_decision_narrative.sql` :

```sql
-- Conclusion RÉDIGÉE du dossier de décision, traitée en ARTEFACT (slice 2). Le texte est figé : il ne
-- bouge que si le plan narratif change. Sans cela, la conclusion se reformulerait à chaque
-- rechargement de la même page, et le lecteur verrait son rapport changer de phrase sous ses yeux.
--
-- L'identité de l'artefact est l'input_hash (SHA-256 du plan + prompt + modèle + contrat), pas la
-- commune : le projet évolue, la lecture passe de la commune à l'adresse, une commune peut porter
-- plusieurs adresses. scope_key sépare la commune de chaque logement.
create table if not exists public.decision_narrative (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  insee_code     text not null,
  scope_key      text not null,   -- "commune" | "logement:<logement_id>"
  input_hash     text not null,
  blocks         jsonb not null,  -- [{ key, text }] — la provenance est reconstituée depuis le plan
  prompt_version text not null,
  model          text not null,
  created_at     timestamptz not null default now(),
  unique (user_id, insee_code, scope_key, input_hash)
);

-- Lecture par identité exacte + pruning (les 3 derniers par scope).
create index if not exists decision_narrative_retention_idx
  on public.decision_narrative (user_id, insee_code, scope_key, created_at desc, id desc);

alter table public.decision_narrative enable row level security;

create policy "own_select" on public.decision_narrative
  for select using (auth.uid() = user_id);
create policy "own_insert" on public.decision_narrative
  for insert with check (auth.uid() = user_id);
create policy "own_delete" on public.decision_narrative
  for delete using (auth.uid() = user_id);
```

- [ ] **Step 2 : Appliquer la migration**

Appliquer `supabase/23_decision_narrative.sql` sur le projet Supabase (même geste que les migrations 20/21/22).
Expected: table `decision_narrative` visible, RLS activée, trois policies.

- [ ] **Step 3 : Écrire le store**

Créer `src/lib/server/decision-narrative-store.ts` :

```ts
import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoredBlocks = { key: string; text: string }[];

// Le JSON de la base est VALIDÉ, jamais casté : un artefact écrit par un contrat antérieur ne doit
// pas faire tomber le Server Component, il doit être ignoré (et regénéré).
const storedBlocksSchema = z.array(z.object({ key: z.string(), text: z.string() }));

function parseBlocks(value: unknown): StoredBlocks | null {
  const parsed = storedBlocksSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// Lecture par IDENTITÉ EXACTE. Un hash différent n'est pas un cache miss « proche » : c'est un autre
// texte, qui ne doit jamais être affiché à la place du courant.
export async function readNarrative(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, inputHash: string,
): Promise<StoredBlocks | null> {
  const { data, error } = await sb
    .from("decision_narrative")
    .select("blocks")
    .eq("user_id", userId).eq("insee_code", insee)
    .eq("scope_key", scopeKey).eq("input_hash", inputHash)
    .maybeSingle();
  if (error) throw error;
  return data ? parseBlocks(data.blocks) : null;
}

// Upsert IDEMPOTENT, puis RELECTURE DE LA LIGNE CANONIQUE. Deux rendus concurrents peuvent constater
// le même cache miss et générer deux textes : celui qui perd la course doit afficher le texte du
// gagnant, sinon le lecteur retrouverait au rechargement un texte différent de celui qu'il a lu.
export async function saveNarrative(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, inputHash: string,
  blocks: StoredBlocks, promptVersion: string, model: string,
): Promise<StoredBlocks> {
  const { error } = await sb
    .from("decision_narrative")
    .upsert(
      { user_id: userId, insee_code: insee, scope_key: scopeKey, input_hash: inputHash,
        blocks, prompt_version: promptVersion, model },
      { onConflict: "user_id,insee_code,scope_key,input_hash", ignoreDuplicates: true },
    );
  if (error) throw error;

  const canonical = await readNarrative(sb, userId, insee, scopeKey, inputHash);
  return canonical ?? blocks; // la ligne existe forcément ; ce repli couvre une lecture RLS surprenante
}

// Garde-fou de croissance. Sans lui, chaque édition du projet laisse un artefact de plus derrière elle.
export async function pruneNarratives(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, keep = 3,
): Promise<void> {
  const { data, error } = await sb
    .from("decision_narrative")
    .select("id")
    .eq("user_id", userId).eq("insee_code", insee).eq("scope_key", scopeKey)
    .order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;
  const stale = (data ?? []).slice(keep).map((r) => r.id as string);
  if (stale.length === 0) return;
  const { error: delError } = await sb.from("decision_narrative").delete().in("id", stale);
  if (delError) throw delError;
}
```

- [ ] **Step 4 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: silencieux.

- [ ] **Step 5 : Commit**

```bash
git add supabase/23_decision_narrative.sql src/lib/server/decision-narrative-store.ts
git commit -m "feat(decision): artefact narratif persisté (lecture validée, upsert convergent, pruning)"
```

---

## Task 7 : Le rendu des blocs (déterministe seul, sans IA)

**Files:**
- Create: `src/components/report/ConclusionBlock.tsx`
- Modify: `src/components/report/DossierDecisionSection.tsx:15-22` (retirer `STATE_META`) et `:119-125` (le verdict devient `ConclusionBlock`)

**Interfaces:**
- Consumes: `RenderedBlock` (Task 4), `ConclusionNarrativePlan` (Task 2), `ConclusionState`.
- Produces: `<ConclusionBlock state blocks />`, `planToBlocks(plan): RenderedBlock[]`

À la fin de cette tâche, **la même prose s'affiche**, rendue depuis les blocs au lieu d'une chaîne concaténée. C'est le point de bascule qui rend la substitution IA possible sans changement de structure. La hauteur de la carte, elle, bougera quand un texte généré sera plus long : une `min-height` stabilise le cadre, elle ne fige pas la hauteur.

- [ ] **Step 1 : Écrire le composant**

Créer `src/components/report/ConclusionBlock.tsx` :

```tsx
// Rendu du verdict, en BLOCS. Structure DOM IDENTIQUE que les blocs soient déterministes ou générés :
// la substitution sous Suspense ne change pas la mise en page (un texte plus long reste plus haut,
// d'où la min-height, qui stabilise le cadre sans prétendre figer la hauteur). Aucun LLM ici.
import type { ConclusionState } from "@/lib/decision/decision-fact";
import type { ConclusionNarrativePlan } from "@/lib/decision/conclusion-plan";
import type { RenderedBlock } from "@/lib/decision/conclusion-validate";

const STATE_META: Record<ConclusionState, { color: string; label: string }> = {
  established_incompatibility: { color: "var(--red)", label: "Un point de blocage" },
  no_incompatibility_established: { color: "var(--accent)", label: "Aucun blocage établi" },
  no_hard_constraint_declared: { color: "var(--accent)", label: "Aucune condition absolue déclarée" },
  insufficient_evidence: { color: "var(--ghost)", label: "Lecture incomplète" },
  project_not_structured: { color: "var(--ghost)", label: "À préciser" },
};

// Les blocs déterministes, dans la forme EXACTE que produira la validation de la sortie IA.
export function planToBlocks(plan: ConclusionNarrativePlan): RenderedBlock[] {
  return plan.blocks.map((b) => ({ key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false }));
}

export function ConclusionBlock({ state, blocks }: { state: ConclusionState; blocks: RenderedBlock[] }) {
  const meta = STATE_META[state];
  return (
    <div className="glass rounded-2xl p-7 mb-3.5" style={{ borderLeft: `2px solid ${meta.color}`, minHeight: "132px" }}>
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2.5" style={{ color: meta.color }}>
        {meta.label}
      </p>
      <div className="flex flex-col gap-2">
        {blocks.map((b) => (
          <p key={b.key} className="text-[18px] leading-[1.6] text-label">{b.text}</p>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Brancher le composant dans la section**

Dans `src/components/report/DossierDecisionSection.tsx` : retirer la constante locale `STATE_META` (lignes 15-22) et la ligne `const state = STATE_META[dossier.conclusionState];`, ajouter l'import :

```tsx
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
```

Remplacer le bloc du verdict (le `<div className="glass rounded-2xl p-7 mb-3.5" …>` et son contenu, lignes 119-125) par :

```tsx
      <ConclusionBlock state={dossier.conclusionState} blocks={planToBlocks(dossier.narrativePlan)} />
```

`const structured = dossier.conclusionState !== "project_not_structured";` reste (il pilote les liens de bas de section).

- [ ] **Step 3 : Vérifier types et tests**

Run: `npx tsc --noEmit && node --test src/lib/decision/*.test.ts`
Expected: silencieux, tests verts.

- [ ] **Step 4 : Vérifier à l'écran**

Lancer `npm run dev`, se connecter (`bonjourfuturee@gmail.com`), ouvrir `/rapport`.
Expected: la conclusion affiche exactement les mêmes phrases qu'avant, désormais en paragraphes distincts (un par registre). Libellé d'état et filet coloré inchangés.

- [ ] **Step 5 : Commit**

```bash
git add src/components/report/ConclusionBlock.tsx src/components/report/DossierDecisionSection.tsx
git commit -m "refactor(decision): le verdict se rend en blocs (même prose, structure prête pour l'IA)"
```

---

## Task 8 : La conclusion rédigée (le Server Component)

**Files:**
- Create: `src/components/report/ConclusionRedigee.tsx`
- Modify: `src/components/report/DossierDecisionSection.tsx` (le `<Suspense>` autour du verdict)

**Interfaces:**
- Consumes: `shouldGenerateNarrative`, `ConclusionNarrativePlan` (Tasks 2/3) ; `validateGeneratedBlocks` (Task 4) ; `buildConclusionHash` + les constantes de version (Task 5) ; `readNarrative`, `saveNarrative`, `pruneNarratives` (Task 6) ; `ConclusionBlock`, `planToBlocks` (Task 7).
- Produces: `<ConclusionRedigee plan insee scopeKey state />` (async RSC).
- `DossierDecisionSection` gagne deux props : `insee: string`, `scopeKey: string`.

**Pourquoi pas `after()` pour le pruning :** `after()` s'exécute une fois la réponse envoyée, et les API de requête (`cookies()`, `headers()`) n'y sont pas disponibles depuis un Server Component. Le client Supabase créé à partir des cookies pourrait les relire paresseusement au moment de la requête différée, et échouer de façon opaque. Deux requêtes supplémentaires attendues, sur un chemin qui vient de dépenser plusieurs secondes de LLM, coûtent moins cher qu'un comportement dépendant du cycle de vie du client d'authentification.

- [ ] **Step 1 : Écrire le Server Component**

Créer `src/components/report/ConclusionRedigee.tsx` :

```tsx
// La conclusion RÉDIGÉE (slice 2). Server Component async sous <Suspense> : le fallback EST la
// conclusion déterministe, et la substitution est ATOMIQUE (tous les blocs d'un coup, validés).
// Aucun streaming de tokens : un rapport de décision n'a pas à ressembler à un chatbot, et une phrase
// provisoire à l'écran serait une phrase non validée.
//
// Le VERDICT n'est jamais envoyé au modèle comme bloc à écrire : il part en lecture seule, pour que
// les registres suivants s'y articulent. Le modèle ne peut ni choisir ce qui apparaît (présence et
// ordre viennent du plan), ni élire un fait saillant (le lead est désigné par le déterministe), ni
// fabriquer une provenance (il ne renvoie que { key, text }), ni faire disparaître une matière
// (requiredPhrases), ni inventer un chiffre.
//
// L'infrastructure narrative n'est JAMAIS nécessaire pour lire le dossier : lecture du cache,
// génération et écriture sont toutes rattrapées et retombent sur le déterministe, en journalisant.
import { headers } from "next/headers";
import { generateObject } from "ai";
import { anthropic, type AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ConclusionState } from "@/lib/decision/decision-fact";
import { shouldGenerateNarrative, type ConclusionNarrativePlan } from "@/lib/decision/conclusion-plan";
import { validateGeneratedBlocks } from "@/lib/decision/conclusion-validate";
import {
  buildConclusionHash, DECISION_NARRATIVE_MODEL, DECISION_NARRATIVE_PROMPT_VERSION,
} from "@/lib/decision/conclusion-hash";
import { readNarrative, saveNarrative, pruneNarratives } from "@/lib/server/decision-narrative-store";
import { requireCurrentUser } from "@/lib/user-account";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";

// Défaut sûr : « ne dépense pas ». On livre, on observe les artefacts, on allume ensuite.
const NARRATIVE_ENABLED = process.env.DOSSIER_NARRATIVE === "true";

// Schéma de TRANSPORT, volontairement permissif : un schéma strict ferait échouer l'objet ENTIER sur
// un seul élément malformé et tuerait la récupération bloc par bloc. Le vrai contrat est dans
// validateGeneratedBlocks (pur, testé), qui valide chaque élément séparément.
const transportSchema = z.object({ blocks: z.array(z.unknown()) });

const SYSTEM_PROMPT = `Vous êtes l'analyste éditorial de futur•e. On vous remet une conclusion DÉJÀ DÉCIDÉE,
découpée en registres. Votre seul travail est de reformuler le texte des registres qu'on vous confie, pour
qu'ils se lisent d'un trait, dans une voix humaine et sobre.

LE VERDICT NE VOUS APPARTIENT PAS. On vous le donne pour que vos phrases s'y articulent. Vous ne le
reformulez pas, vous ne le renvoyez pas, vous ne le contredisez pas.

CE QUE VOUS NE POUVEZ PAS FAIRE, JAMAIS :
- ajouter, retirer ou fusionner un registre. Vous renvoyez exactement les clés qu'on vous confie ;
- faire disparaître une matière à l'intérieur d'un registre. Chaque élément listé dans « matière
  obligatoire » doit se retrouver TEL QUEL dans votre phrase, au mot près. Deux contraintes non examinées
  ne deviennent pas « une condition importante » ;
- mélanger deux registres. Une condition absolue qui n'a pas pu être vérifiée n'est pas une préférence non
  couverte : la première diminue la valeur du verdict, la seconde réduit seulement la personnalisation ;
- introduire un chiffre, un pourcentage, une année ou un horizon qui ne figure pas déjà dans le texte de
  repli du registre que vous reformulez ;
- recommander quoi que ce soit. Les actions vivent ailleurs dans le rapport. Vous pouvez écrire que des
  points méritent d'être examinés. Vous n'écrivez jamais ce qu'il faut faire ;
- désigner un fait comme le plus important si le plan ne l'a pas désigné.

LE FAIT SAILLANT :
- lead.kind = "single" : vous pouvez le nommer (« à commencer par… », « notamment… ») en reprenant son constat ;
- lead.kind = "tied" : plusieurs points partagent le même poids. Vous écrivez « plusieurs points structurants »,
  et vous n'en couronnez aucun ;
- lead.kind = "none" : vous ne nommez aucun fait, vous vous en tenez au nombre.

LA VOIX :
- vous parlez au lecteur de SON projet. futur•e n'est jamais le sujet d'une phrase, sauf pour dire ce qu'elle
  ne sait pas encore lire ;
- une phrase par registre, deux au plus. Pas de tiret cadratin : une virgule ou deux points ;
- jamais d'antithèse en figure de style (« c'est X, pas Y ») ;
- vous n'annoncez pas ce que vous allez dire, vous le dites.

Vous renvoyez { blocks: [{ key, text }] }, une entrée par registre confié.`;

export async function ConclusionRedigee({
  plan, insee, scopeKey, state,
}: {
  plan: ConclusionNarrativePlan;
  insee: string;
  scopeKey: string;
  state: ConclusionState;
}) {
  const deterministe = <ConclusionBlock state={state} blocks={planToBlocks(plan)} />;

  // 1. Le PREFETCH ne doit jamais déclencher une génération. Next 16 précharge les routes liées par
  //    <Link> avant tout clic : sans cette garde, un survol coûterait un appel Sonnet. On teste la
  //    PRÉSENCE du header, pas une valeur (le contrat porte sur sa présence).
  const h = await headers();
  const isPrefetch = h.has("next-router-prefetch") || h.has("next-router-segment-prefetch");
  if (!NARRATIVE_ENABLED || isPrefetch) return deterministe;

  // 2. Le GATE passe AVANT le hash et AVANT la base : un plan qui ne justifie aucune rédaction ne
  //    requête pas Supabase, et ne peut pas ressusciter une narration mise en cache quand le gate
  //    était positif.
  if (!shouldGenerateNarrative(plan)) return deterministe;

  const { supabase, user } = await requireCurrentUser();
  const inputHash = buildConclusionHash(plan);

  // 3. Artefact existant pour cette identité EXACTE ? Le JSON est validé contre le contrat COURANT
  //    (dans le store) : un artefact périmé est ignoré, jamais affiché. Une base indisponible ne doit
  //    pas coûter la conclusion : on log et on continue.
  let cached = null;
  try {
    cached = await readNarrative(supabase, user.id, insee, scopeKey, inputHash);
  } catch (error) {
    console.error("[dossier-narrative] lecture artefact échouée", { insee, scopeKey, error });
  }
  if (cached) {
    const { blocks } = validateGeneratedBlocks(plan, cached);
    return <ConclusionBlock state={state} blocks={blocks} />;
  }

  // 4. Génération. Le verdict n'est PAS dans les registres confiés : il part en contexte seul.
  const generables = plan.blocks.filter((b) => b.generable);
  let raw: unknown[];
  try {
    const { object } = await generateObject({
      model: anthropic(DECISION_NARRATIVE_MODEL),
      providerOptions: {
        anthropic: { effort: "medium", thinking: { type: "disabled" } } satisfies AnthropicProviderOptions,
      },
      temperature: 0.3,
      schema: transportSchema,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({
        verdictEnLectureSeule: plan.blocks.find((b) => b.key === "verdict")?.fallbackText ?? "",
        scope: plan.scope,
        conclusionState: plan.conclusionState,
        posture: plan.posture,
        reservesCount: plan.reservesCount,
        lead: plan.lead,
        registresAConfier: generables.map((b) => ({
          key: b.key,
          texteDeRepli: b.fallbackText,
          matiereObligatoire: b.requiredPhrases,
          maxChars: b.maxChars,
        })),
      }),
    });
    raw = object.blocks;
  } catch (error) {
    console.error("[dossier-narrative] génération échouée", { insee, scopeKey, error });
    return deterministe;
  }

  const { blocks, rejected } = validateGeneratedBlocks(plan, raw);
  if (rejected.length > 0) console.warn("[dossier-narrative] blocs rejetés", { insee, scopeKey, rejected });

  // Aucun bloc généré : rien à figer. On rend le déterministe sans polluer la base d'un échec.
  if (!blocks.some((b) => b.generated)) return deterministe;

  // 5. ARTEFACT DURABLE. On stocke TOUS les blocs générables rendus (y compris ceux retombés en repli) :
  //    la base contient alors exactement ce qui a été affiché. On rend la ligne CANONIQUE retournée par
  //    le store : si une requête concurrente a gagné la course, c'est SON texte que le lecteur voit, et
  //    donc celui qu'il retrouvera. L'échec d'écriture ne coûte jamais la conclusion.
  const generableKeys = new Set(generables.map((b) => b.key));
  const toStore = blocks.filter((b) => generableKeys.has(b.key)).map((b) => ({ key: b.key, text: b.text }));
  try {
    const canonical = await saveNarrative(
      supabase, user.id, insee, scopeKey, inputHash, toStore,
      DECISION_NARRATIVE_PROMPT_VERSION, DECISION_NARRATIVE_MODEL,
    );
    await pruneNarratives(supabase, user.id, insee, scopeKey, 3);
    const { blocks: canonicalBlocks } = validateGeneratedBlocks(plan, canonical);
    return <ConclusionBlock state={state} blocks={canonicalBlocks} />;
  } catch (error) {
    console.error("[dossier-narrative] persistance échouée", { insee, scopeKey, error });
    return <ConclusionBlock state={state} blocks={blocks} />;
  }
}
```

Note : si `requireCurrentUser()` ne retourne pas `{ supabase, user }` sous ce nom, aligner sur l'usage de `src/app/api/synthesize-logement/route.ts` et adapter ces deux lignes, sans changer la logique.

- [ ] **Step 2 : Envelopper le verdict dans un Suspense**

Dans `src/components/report/DossierDecisionSection.tsx` : ajouter les imports

```tsx
import { Suspense } from "react";
import { ConclusionRedigee } from "@/components/report/ConclusionRedigee";
```

étendre la signature avec `insee` et `scopeKey` :

```tsx
export function DossierDecisionSection({
  dossier, logement, logementStatus = "none", insee, scopeKey,
}: {
  dossier: Dossier;
  logement?: { href: string; label: string } | null;
  logementStatus?: "none" | "pending" | "done" | "unavailable";
  insee: string;
  scopeKey: string;
}) {
```

et remplacer l'appel direct à `<ConclusionBlock …>` (Task 7) par :

```tsx
      {/* Le verdict. En « pending », le dossier n'est PAS final (l'augmentation adresse arrive) :
          générer ici coûterait un second appel Sonnet, jeté trois secondes plus tard. */}
      {logementStatus === "pending" ? (
        <ConclusionBlock state={dossier.conclusionState} blocks={planToBlocks(dossier.narrativePlan)} />
      ) : (
        <Suspense fallback={<ConclusionBlock state={dossier.conclusionState} blocks={planToBlocks(dossier.narrativePlan)} />}>
          <ConclusionRedigee
            plan={dossier.narrativePlan}
            insee={insee}
            scopeKey={scopeKey}
            state={dossier.conclusionState}
          />
        </Suspense>
      )}
```

- [ ] **Step 3 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: deux erreurs attendues, sur les appelants de `DossierDecisionSection` qui ne passent pas encore `insee` et `scopeKey`. Elles sont corrigées en Task 9.

- [ ] **Step 4 : Commit**

```bash
git add src/components/report/ConclusionRedigee.tsx src/components/report/DossierDecisionSection.tsx
git commit -m "feat(decision): conclusion rédigée sous Suspense (garde prefetch, gate, artefact convergent)"
```

---

## Task 9 : Le branchement, et la vérification en vrai

**Files:**
- Modify: `src/app/(account)/rapport/page.tsx:244-258`
- Modify: `src/components/report/DossierAvecLogement.tsx`
- Modify: `.env.local` (flag, en local seulement)

**Interfaces:**
- `scopeKey` vaut `"commune"` en lecture communale, `logement:<logement_id>` quand l'adresse est branchée.

- [ ] **Step 1 : Passer `insee` et `scopeKey` depuis la page**

Dans `src/app/(account)/rapport/page.tsx`, remplacer le bloc du dossier par :

```tsx
        {/* ── En une minute : le dossier de décision (payant) ── */}
        {dossier && communeResult ? (
          dossierAddress && logementForCommune ? (
            <Suspense fallback={
              <DossierDecisionSection
                dossier={dossier} logement={dossierLogementLink} logementStatus="pending"
                insee={inseeCode!} scopeKey="commune"
              />
            }>
              <DossierAvecLogement
                project={userProject!}
                address={dossierAddress}
                savedDpe={logementForCommune.selected_dpe_snapshot}
                communeFacts={communeResult.moduleFacts}
                communeDossier={dossier}
                logementLink={dossierLogementLink}
                insee={inseeCode!}
                scopeKey={`logement:${logementForCommune.logement_id}`}
              />
            </Suspense>
          ) : (
            <DossierDecisionSection
              dossier={dossier} logement={dossierLogementLink} logementStatus="none"
              insee={inseeCode!} scopeKey="commune"
            />
          )
        ) : null}
```

(Le fallback « pending » ne génère rien, cf. Task 8 : son `scopeKey` est sans effet, il est passé pour satisfaire le type.)

- [ ] **Step 2 : Faire suivre dans `DossierAvecLogement`**

Dans `src/components/report/DossierAvecLogement.tsx`, étendre la signature avec `insee: string; scopeKey: string;` et passer les deux props aux **deux** rendus de `DossierDecisionSection` :

```tsx
export async function DossierAvecLogement({
  project, address, savedDpe, communeFacts, communeDossier, logementLink, insee, scopeKey,
}: {
  project: UserProject;
  address: ResolvedAddress;
  savedDpe: DpeRecord | null;
  communeFacts: ModuleFacts;
  communeDossier: Dossier;
  logementLink: { href: string; label: string } | null;
  insee: string;
  scopeKey: string;
}) {
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    const facts: ModuleFacts = { ...communeFacts, hasAddress: true, logement };
    const dossier = assembleDossier(runRules(facts, project), project, "commune+adresse");
    return (
      <DossierDecisionSection
        dossier={dossier} logement={logementLink} logementStatus="done"
        insee={insee} scopeKey={scopeKey}
      />
    );
  } catch (error) {
    if (error instanceof LogementDataUnavailableError) {
      // Le dossier COMMUNE est alors le dossier final : sa conclusion peut être rédigée, au scope commune.
      return (
        <DossierDecisionSection
          dossier={communeDossier} logement={logementLink} logementStatus="unavailable"
          insee={insee} scopeKey="commune"
        />
      );
    }
    throw error; // bug de code : reste visible (frontière d'erreur / observabilité)
  }
}
```

- [ ] **Step 3 : Ne pas précharger le hub**

Run: `grep -rn 'href="/rapport"' src/`
Sur chaque `<Link>` trouvé, ajouter `prefetch={false}`. C'est la défense de surface ; la garde serveur du header reste la vraie protection.

- [ ] **Step 4 : Tests, types, build**

Run: `node --test src/lib/decision/*.test.ts src/lib/stable-stringify.test.ts src/lib/logement-synthesis-cache.test.ts && npx tsc --noEmit && npm run build`
Expected: tout vert, tsc silencieux, **build qui réussit**. C'est le premier build qui valide réellement les Server Components, l'appel AI SDK, les imports `server-only` et les props ajoutées dans les huit tâches précédentes.

- [ ] **Step 5 : Vérifier flag OFF (le déterministe reste le produit)**

Sans `DOSSIER_NARRATIVE` dans `.env.local`, lancer `npm run dev`, ouvrir `/rapport`.
Expected: la conclusion s'affiche en blocs déterministes, immédiatement. **Aucun appel Anthropic**, table `decision_narrative` vide.

- [ ] **Step 6 : Vérifier flag ON, dossier riche**

Poser `DOSSIER_NARRATIVE=true` dans `.env.local`, redémarrer. Se connecter (`bonjourfuturee@gmail.com`, Toulouse), éditer le projet pour produire un dossier riche : contrainte dure non couverte (« bord de mer »), préférences non couvertes (qualité de l'air), et une adresse analysée (7 rue du Taur) pour les réserves Logement.
Expected :
- la conclusion déterministe s'affiche d'abord, puis est **remplacée d'un bloc** par la version rédigée (aucun texte mot à mot, aucun changement de structure) ;
- **le verdict est mot pour mot celui du déterministe** ;
- les registres restent distincts et dans l'ordre : verdict, contrainte absolue non vérifiée, réserves, priorités non couvertes ;
- chaque libellé de contrainte et de priorité est encore là, au mot près ;
- aucun chiffre absent du plan, aucune recommandation inventée, aucun « ce lieu vous correspond » ;
- une ligne apparaît dans `decision_narrative` (`scope_key = logement:…`) ;
- recharger : **aucun nouvel appel LLM**, texte identique au caractère près.

- [ ] **Step 7 : Vérifier le gate sur un dossier pauvre**

Éditer le projet pour retirer les contraintes (verdict seul, ou verdict + priorités non couvertes).
Expected: le déterministe reste affiché, aucun appel LLM, aucune ligne écrite. C'est le comportement voulu : on ne maquille pas un dossier pauvre.

- [ ] **Step 8 : Vérifier la garde prefetch**

Survoler un lien vers le hub sans cliquer, ou rejouer la route avec l'en-tête `next-router-prefetch: 1` et un cookie de session.
Expected: aucun appel Anthropic, aucune écriture, déterministe servi.

- [ ] **Step 9 : Commit**

```bash
git add "src/app/(account)/rapport/page.tsx" src/components/report/DossierAvecLogement.tsx src/components/report/DossierDecisionSection.tsx
git commit -m "feat(decision): branche la conclusion rédigée sur le hub (scope commune / logement)"
```

- [ ] **Step 10 : Mémoire et passation**

Mettre à jour `/memory/project_dossier_decision.md` (slice 2 livré : ce qu'il fait, le verdict non générable, le gate, le flag) et `docs/handoff/CURRENT.md`. Ne pas oublier : `DOSSIER_NARRATIVE` doit être posé côté Vercel pour que la fonctionnalité vive en production.

---

## Critère de réussite

Sur un dossier riche réel, la conclusion générée dit exactement ce que disait le déterministe, dans l'ordre de gravité, en se lisant d'un trait. Le verdict est intact. Aucune matière déclarée n'a disparu. Aucun nombre absent du plan. Aucune recommandation inventée. Couper le flag ou l'API rend le déterministe sans que le lecteur perde une seule information. Sur les dossiers pauvres, le gate laisse le déterministe en place, et on l'assume.
