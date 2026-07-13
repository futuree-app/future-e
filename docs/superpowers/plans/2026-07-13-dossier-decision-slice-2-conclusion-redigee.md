# Slice 2 — La conclusion rédigée : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire rédiger par un LLM la seule conclusion du dossier de décision, bloc par bloc, sans qu'il puisse jamais sélectionner, hiérarchiser, omettre ni inventer quoi que ce soit, avec la sortie déterministe en fallback permanent.

**Architecture:** Le déterministe produit un `ConclusionNarrativePlan` (présence, ordre, sources et `fallbackText` de chaque bloc) porté par le `Dossier` lui-même. Un Server Component sous `<Suspense>` (fallback = les mêmes blocs en déterministe) appelle `generateObject` seulement si un gate de complexité narrative l'autorise, valide la sortie bloc par bloc par une fonction pure, persiste un artefact identifié par un SHA-256 du plan, et substitue le résultat de façon atomique. Aucune route API.

**Tech Stack:** Next 16.2.4 (App Router, RSC, `after()`), AI SDK 6 (`generateObject`), `@ai-sdk/anthropic` (Sonnet 4.6, effort medium, thinking off), zod 4, Supabase (RLS own), `node --test` pour les libs pures.

Spec : `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-conclusion-redigee-design.md`.

## Global Constraints

- **L'IA formule, elle ne décide jamais.** Présence, ordre, sources et sélection des faits sont calculés avant l'appel. La sortie du modèle est réduite à `{ key, text }` : il ne produit **aucun `sourceId`**, aucune provenance.
- **Hiérarchie éditoriale des réserves, jamais aplatie**, dans cet ordre : `verdict` → `unexamined_hard_constraints` → `reserves_found` → `uncovered_priorities`. Une contrainte dure non examinée et une préférence non couverte ne partagent jamais un bloc.
- **Le gate passe avant le hash et avant la base.** Un plan qui ne justifie aucune rédaction ne requête pas Supabase et ne peut pas ressusciter une narration mise en cache.
- **Aucune génération au prefetch** : garde serveur sur le header `next-router-prefetch` (Next 16.2.4), plus `prefetch={false}` en défense de surface.
- **Aucune génération quand `logementStatus === "pending"`** : le dossier n'est pas final, générer là coûterait un second appel Sonnet jeté.
- **Absence de donnée = `null`, jamais 0. Aucun `try/catch` masquant** : un bug remonte. Seuls l'appel LLM et l'écriture de l'artefact sont rattrapés, et ils retombent sur le déterministe en le journalisant.
- **Piège maison** : `comparateur-vie.ts` fait `import "server-only"`. Toute lib testée en `node --test` n'en prend que des **types** (les imports type-only sont effacés).
- **Doctrine éditoriale FR** : pas de tiret cadratin (virgule ou deux points), pas d'antithèse (« c'est X, pas Y »), l'offre n'est jamais sujet de phrase.
- **Commandes de vérification** : `node --test src/lib/decision/*.test.ts src/lib/*.test.ts` et `npx tsc --noEmit`.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/stable-hash.ts` (neuf) | `stableStringify` (partagé) + `sha256Hex` (serveur) |
| `src/lib/decision/conclusion-plan.ts` (neuf) | Types du plan, `buildConclusionPlan`, `selectLead`, `shouldGenerateNarrative` |
| `src/lib/decision/conclusion-validate.ts` (neuf) | `validateGeneratedBlocks` : le vrai contrat de sortie, pur |
| `src/lib/decision/conclusion-hash.ts` (neuf) | `buildConclusionHash` : identité de l'artefact |
| `src/lib/server/decision-narrative-store.ts` (neuf) | Lecture / upsert / pruning de l'artefact |
| `src/components/report/ConclusionBlock.tsx` (neuf) | Rendu présentationnel des blocs (déterministes ou générés) |
| `src/components/report/ConclusionRedigee.tsx` (neuf) | RSC async : garde prefetch, gate, cache, génération, validation, upsert |
| `supabase/23_decision_narrative.sql` (neuf) | Table + index + RLS |
| `src/lib/decision/decision-fact.ts` | `Dossier` gagne `narrativePlan` |
| `src/lib/decision/decision-assembler.ts` | Produit le plan ; `conclusion` en dérive ; réserves = faits **affichés** |
| `src/components/report/DossierDecisionSection.tsx` | Le verdict devient `ConclusionBlock` sous `<Suspense>` |
| `src/components/report/DossierAvecLogement.tsx` | Passe `scopeKey` du logement |
| `src/app/(account)/rapport/page.tsx` | Passe `insee` et `scopeKey` |
| `src/lib/logement-synthesis-cache.ts` | Importe `stableStringify` du module partagé |

---

## Task 1 : Le socle de hash partagé

**Files:**
- Create: `src/lib/stable-hash.ts`
- Create: `src/lib/stable-hash.test.ts`
- Modify: `src/lib/logement-synthesis-cache.ts` (retire sa copie de `stableStringify`, l'importe)

**Interfaces:**
- Produces: `stableStringify(value: unknown): string`, `sha256Hex(input: string): string`
- `fnv1a` reste dans `logement-synthesis-cache.ts` : il convient à un cache léger. Le nouvel artefact exige SHA-256, parce qu'une collision servirait au lecteur le texte d'un **autre plan**.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/stable-hash.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { stableStringify, sha256Hex } from "./stable-hash.ts";

test("stableStringify : l'ordre d'insertion des clés ne change pas la sortie", () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }),
    stableStringify({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 }),
  );
});

test("stableStringify : l'ordre d'un tableau est signifiant (il est conservé)", () => {
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});

test("stableStringify : null et undefined ne se confondent pas", () => {
  assert.equal(stableStringify(null), "null");
  assert.equal(stableStringify({ a: null }), '{"a":null}');
});

test("sha256Hex : déterministe, 64 caractères hexadécimaux", () => {
  const h = sha256Hex("futur·e");
  assert.equal(h, sha256Hex("futur·e"));
  assert.match(h, /^[0-9a-f]{64}$/);
});

test("sha256Hex : deux entrées différentes donnent deux empreintes différentes", () => {
  assert.notEqual(sha256Hex("a"), sha256Hex("b"));
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Run: `node --test src/lib/stable-hash.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND` sur `./stable-hash.ts`.

- [ ] **Step 3 : Écrire l'implémentation minimale**

Créer `src/lib/stable-hash.ts` :

```ts
// Empreintes de contenu partagées. `stableStringify` était dupliqué dans logement-synthesis-cache ;
// il est extrait ici parce que le dossier de décision en a besoin aussi. `sha256Hex` est la seule
// empreinte admise pour l'IDENTITÉ d'un artefact narratif : une collision servirait au lecteur le
// texte d'un AUTRE plan. Le fnv1a de logement-synthesis-cache reste où il est (cache léger, gate
// client synchrone), il n'a pas cet enjeu.
import { createHash } from "node:crypto";

// Sérialisation canonique : clés triées récursivement. Deux valeurs égales -> même chaîne, quel que
// soit l'ordre d'insertion. L'ordre d'un TABLEAU est signifiant et donc conservé.
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
```

- [ ] **Step 4 : Lancer le test, vérifier qu'il passe**

Run: `node --test src/lib/stable-hash.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Dédupliquer `logement-synthesis-cache.ts`**

Dans `src/lib/logement-synthesis-cache.ts` : supprimer la fonction locale `stableStringify` (et son commentaire de 3 lignes) et ajouter en tête, sous les imports existants :

```ts
import { stableStringify } from "./stable-hash.ts";
```

`fnv1a` et `buildFactHash` restent inchangés.

Attention : ce fichier n'a pas `server-only` et son `buildFactHash` est utilisé **côté client** (gate en session dans `LogementSynthesis.tsx`). `stable-hash.ts` importe `node:crypto`, ce qui casserait le bundle client si `sha256Hex` y était appelé. `stableStringify` est un import nommé et `node:crypto` n'est utilisé que par `sha256Hex` : le tree-shaking l'écarte du bundle client. Le Step 6 le prouve par un build réel.

- [ ] **Step 6 : Vérifier que le client n'est pas cassé**

Run: `node --test src/lib/logement-synthesis-cache.test.ts && npx tsc --noEmit && npx next build`
Expected: tests PASS, tsc silencieux, build qui réussit (si le build échoue sur `node:crypto` dans un bundle client, déplacer `sha256Hex` dans un `src/lib/server/sha256.ts` et n'y toucher que depuis le serveur).

- [ ] **Step 7 : Commit**

```bash
git add src/lib/stable-hash.ts src/lib/stable-hash.test.ts src/lib/logement-synthesis-cache.ts
git commit -m "feat(decision): socle de hash partagé (stableStringify + sha256Hex)"
```

---

## Task 2 : Le plan narratif, produit par le déterministe

**Files:**
- Create: `src/lib/decision/conclusion-plan.ts`
- Create: `src/lib/decision/conclusion-plan.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (le `Dossier` gagne `narrativePlan`)
- Modify: `src/lib/decision/decision-assembler.ts` (produit le plan ; `conclusion` en dérive ; réserves = faits **affichés**)
- Modify: `src/lib/decision/decision-assembler.test.ts` (le test existant du comptage change de vérité)

**Interfaces:**
- Consumes: `DecisionFact`, `ConclusionState`, `MaterialityTier`, `UncoveredConstraint` (`decision-fact.ts`) ; `ProjectPosture` (`user-project.ts`).
- Produces:
  - `type BlockKey = "verdict" | "unexamined_hard_constraints" | "reserves_found" | "uncovered_priorities"`
  - `type NarrativeBlock = { key: BlockKey; fallbackText: string; sourceIds: string[]; maxChars: number }`
  - `type LeadSelection` (union `single` / `tied` / `none`)
  - `type ConclusionNarrativePlan`
  - `buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan`
  - `shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean` (Task 3)
- Le plan est **porté par le `Dossier`** (`dossier.narrativePlan`) : une seule source de vérité pour les textes déterministes. `dossier.conclusion` devient la concaténation des `fallbackText`, gardée pour les consommateurs existants.

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

test("le verdict existe toujours et vient en premier", () => {
  const plan = buildConclusionPlan(baseInput());
  assert.equal(plan.blocks[0]?.key, "verdict");
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
});

test("un registre vide ne produit aucun bloc", () => {
  const plan = buildConclusionPlan(baseInput());
  assert.deepEqual(plan.blocks.map((b) => b.key), ["verdict"]);
});

test("reservesCount compte les faits AFFICHÉS qu'on lui donne", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring"), verification("f2", "secondary")],
  }));
  assert.equal(plan.reservesCount, 2);
  assert.match(plan.blocks.find((b) => b.key === "reserves_found")!.fallbackText, /2 points/);
});

test("les sourceIds d'un bloc viennent du déterministe", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring")],
    uncovered: [{ key: "nearSea", label: "la proximité de la mer" }],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.sourceIds, ["f1"]);
  assert.deepEqual(
    plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.sourceIds, ["nearSea"],
  );
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
  const plan = buildConclusionPlan(baseInput({ shownFacts: [fact] }));
  const serialized = JSON.stringify(plan);
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

test("incompatibilité établie : le verdict porte le constat", () => {
  const plan = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility",
    establishedIncompatibility: { factId: "i1", statement: "504 078 habitants, au-delà de 20 000." },
  }));
  assert.match(plan.blocks[0]!.fallbackText, /504 078 habitants/);
  assert.deepEqual(plan.blocks[0]!.sourceIds, ["i1"]);
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
Expected: FAIL, `ERR_MODULE_NOT_FOUND` sur `./conclusion-plan.ts`.

- [ ] **Step 3 : Écrire l'implémentation**

Créer `src/lib/decision/conclusion-plan.ts` :

```ts
// Le PLAN NARRATIF : ce que le déterministe a décidé, avant qu'un LLM n'ouvre la bouche (slice 2).
// Il porte la présence, l'ORDRE, les sources et le texte de repli de chaque registre. L'IA reçoit
// ce plan et ne renvoie que { key, text } : elle ne peut ni choisir ce qui apparaît, ni fusionner
// deux registres, ni élire un fait saillant. Fonctions PURES, aucun LLM, aucun accès données.
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
  fallbackText: string; // le texte déterministe de CE registre, affichable seul
  sourceIds: string[];  // factIds / HardConstraintKey / PreferenceKey. JAMAIS produits par l'IA.
  maxChars: number;     // borne de longueur du texte généré (validée en dur, cf. conclusion-validate)
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

function scopeClause(scope: ConclusionPlanInput["scope"]): string {
  return scope === "commune+adresse"
    ? "À l'échelle de la commune et de l'adresse,"
    : "À l'échelle de la commune,";
}

function verdictText(input: ConclusionPlanInput): string {
  const scope = scopeClause(input.scope);
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
  const blocks: NarrativeBlock[] = [{
    key: "verdict",
    fallbackText: verdictText(input),
    sourceIds: input.establishedIncompatibility ? [input.establishedIncompatibility.factId] : [],
    maxChars: 320,
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
      maxChars: 260,
    });
  }

  const rs = reserves(input.shownFacts);
  if (rs.length > 0) {
    const n = rs.length;
    blocks.push({
      key: "reserves_found",
      fallbackText: `${n} point${n > 1 ? "s" : ""} mérite${n > 1 ? "nt" : ""} d'être examiné${n > 1 ? "s" : ""} de près.`,
      sourceIds: rs.map((f) => f.id),
      maxChars: 300,
    });
  }

  if (input.uncoveredPriorities.length > 0) {
    const list = input.uncoveredPriorities.slice(0, 3).map((p) => p.label).join(", ");
    blocks.push({
      key: "uncovered_priorities",
      fallbackText: `Vos priorités concernant ${list} ne sont pas encore couvertes dans cette synthèse.`,
      sourceIds: input.uncoveredPriorities.slice(0, 3).map((p) => p.key),
      maxChars: 260,
    });
  }

  return {
    scope: input.scope,
    conclusionState: input.conclusionState,
    posture: input.posture,
    blocks,
    reservesCount: rs.length,
    lead: selectLead(input.shownFacts),
  };
}
```

- [ ] **Step 4 : Lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5 : Le `Dossier` porte le plan**

Dans `src/lib/decision/decision-fact.ts`, ajouter l'import de type et le champ :

```ts
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
```

et dans `export type Dossier`, après `conclusion: string;` :

```ts
  // Le plan narratif (slice 2) : présence, ordre, sources et repli de chaque registre. `conclusion`
  // en est la simple concaténation, gardée pour les consommateurs qui veulent une seule phrase.
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

Le fichier `src/lib/decision/decision-assembler.test.ts` a déjà les fabriques `project(parsed)`, `run(facts, covered)` et `verif()`. `verif()` retourne toujours `id: "v"` : le test des caps a besoin d'identifiants distincts, donc on lui ajoute un paramètre. Remplacer la fabrique (ligne 16-18) par :

```ts
function verif(id = "v"): DecisionFact {
  return { id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
}
```

(les appels existants `verif()` restent valides). Puis ajouter le test du comportement corrigé :

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
git commit -m "feat(decision): plan narratif déterministe (blocs, ordre, lead) + réserves = faits affichés"
```

---

## Task 3 : Le gate de complexité narrative

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts` (ajouter `shouldGenerateNarrative`)
- Modify: `src/lib/decision/conclusion-plan.test.ts` (ajouter la table de vérité)

**Interfaces:**
- Produces: `shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean`

La règle, en une phrase : **on appelle l'IA seulement quand plusieurs éléments déjà hiérarchisés doivent être articulés, jamais pour rendre élégant un dossier pauvre.** Le nombre brut de blocs n'est pas l'indicateur : « verdict + priorités non couvertes » est précisément le cas où une belle phrase maquillerait une absence de couverture.

- [ ] **Step 1 : Écrire les tests qui échouent (la table de vérité de la spec §5)**

Ajouter à `src/lib/decision/conclusion-plan.test.ts` :

```ts
import { buildConclusionPlan, shouldGenerateNarrative, type ConclusionPlanInput } from "./conclusion-plan.ts";

const AIR = { key: "qualite_air", label: "la qualité de l'air" };
const MER = { key: "nearSea" as const, label: "la proximité de la mer" };

test("gate : projet non structuré -> jamais", () => {
  const plan = buildConclusionPlan(baseInput({ conclusionState: "project_not_structured" }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict seul -> non", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput())), false);
});

test("gate : verdict + priorités non couvertes seules -> non (rien à articuler, matière faible)", () => {
  const plan = buildConclusionPlan(baseInput({ uncoveredPriorities: [AIR] }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict + une contrainte dure non examinée -> non (deux phrases déjà honnêtes)", () => {
  const plan = buildConclusionPlan(baseInput({ uncovered: [MER] }));
  assert.equal(shouldGenerateNarrative(plan), false);
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

  const nonVerdict = plan.blocks.filter((b) => b.key !== "verdict").length;
  if (nonVerdict >= 2) return true;                                    // deux registres à articuler
  if (plan.reservesCount >= 3) return true;                            // beaucoup de réserves à ordonner
  if (plan.reservesCount >= 2 && plan.lead.kind === "single") return true; // une réserve domine : à dire
  return false;
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: PASS (23 tests).

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
- Consumes: `ConclusionNarrativePlan`, `NarrativeBlock`, `BlockKey` (Task 2).
- Produces:
  - `type GeneratedBlock = { key: string; text: string }` (ce que le modèle renvoie, et rien de plus)
  - `type RenderedBlock = { key: BlockKey; text: string; sourceIds: string[]; generated: boolean }`
  - `type ValidationResult = { blocks: RenderedBlock[]; rejected: { key: string; reason: string }[] }`
  - `validateGeneratedBlocks(plan, generated: GeneratedBlock[]): ValidationResult`

**Pourquoi le schéma zod passé à `generateObject` est permissif :** s'il exigeait strictement les quatre blocs, un seul bloc fautif ferait échouer **l'objet entier** et détruirait la récupération bloc par bloc. Le vrai contrat est ici, dans une fonction pure et testable sans LLM.

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
      { key: "verdict", fallbackText: "Aucune contrainte n'est contredite.", sourceIds: [], maxChars: 320 },
      { key: "reserves_found", fallbackText: "3 points méritent d'être examinés de près.", sourceIds: ["f1", "f2", "f3"], maxChars: 300 },
    ],
  };
}

test("sortie conforme : les textes générés sont retenus, la provenance vient du PLAN", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "Rien de ce que nous savons lire ne contredit ce que vous avez posé." },
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.rejected.length, 0);
  assert.equal(r.blocks[0]!.text, "Rien de ce que nous savons lire ne contredit ce que vous avez posé.");
  assert.deepEqual(r.blocks[1]!.sourceIds, ["f1", "f2", "f3"]); // reconstituée, jamais reçue du modèle
  assert.equal(r.blocks[1]!.generated, true);
});

test("l'ordre du modèle est ignoré : le rendu suit l'ordre du plan", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "3 points demandent un regard." },
    { key: "verdict", text: "Rien ne contredit ce que vous avez posé." },
  ]);
  assert.deepEqual(r.blocks.map((b) => b.key), ["verdict", "reserves_found"]);
});

test("bloc manquant : son fallback déterministe, les autres survivent", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "verdict", text: "Rien ne contredit ce que vous avez posé." }]);
  assert.equal(r.blocks[1]!.text, "3 points méritent d'être examinés de près.");
  assert.equal(r.blocks[1]!.generated, false);
  assert.equal(r.blocks[0]!.generated, true);
  assert.equal(r.rejected[0]!.reason, "missing");
});

test("clé inconnue : ignorée et journalisée", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "Rien ne contredit ce que vous avez posé." },
    { key: "recommandation", text: "Faites réaliser une étude de sol." },
  ]);
  assert.equal(r.blocks.length, 2);
  assert.equal(r.blocks.some((b) => b.text.includes("étude de sol")), false);
  assert.ok(r.rejected.some((x) => x.key === "recommandation" && x.reason === "unknown_key"));
});

test("clé en double : le second est rejeté", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "Rien ne contredit ce que vous avez posé." },
    { key: "verdict", text: "Ce lieu vous correspond." },
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.blocks[0]!.text, "Rien ne contredit ce que vous avez posé.");
  assert.ok(r.rejected.some((x) => x.reason === "duplicate_key"));
});

test("texte vide ou blanc : fallback", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "   " },
    { key: "reserves_found", text: "" },
  ]);
  assert.equal(r.blocks[0]!.text, "Aucune contrainte n'est contredite.");
  assert.equal(r.blocks[1]!.text, "3 points méritent d'être examinés de près.");
  assert.equal(r.rejected.length, 2);
});

test("dépassement de maxChars : fallback de CE bloc seulement", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "a".repeat(321) },
    { key: "reserves_found", text: "3 points demandent un regard." },
  ]);
  assert.equal(r.blocks[0]!.generated, false);
  assert.equal(r.blocks[1]!.generated, true);
  assert.equal(r.rejected[0]!.reason, "too_long");
});

test("nombre absent du fallback : hallucination factuelle rejetée", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "4 points demandent un regard." }, // le plan en annonce 3
  ]);
  assert.equal(r.blocks[1]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("année ou horizon inventé : rejeté", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "D'ici 2050, rien ne contredit ce que vous avez posé." },
  ]);
  assert.equal(r.blocks[0]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("un nombre DÉJÀ dans le fallback est autorisé", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "reserves_found", text: "Trois points, dont 3 au logement, demandent un regard." },
  ]);
  assert.equal(r.blocks[1]!.generated, true);
});

test("sortie totalement vide : tout retombe en déterministe", () => {
  const r = validateGeneratedBlocks(plan(), []);
  assert.deepEqual(r.blocks.map((b) => b.text), [
    "Aucune contrainte n'est contredite.", "3 points méritent d'être examinés de près.",
  ]);
  assert.equal(r.blocks.every((b) => !b.generated), true);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/conclusion-validate.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3 : Implémenter**

Créer `src/lib/decision/conclusion-validate.ts` :

```ts
// Le VRAI contrat de la sortie du modèle (le schéma zod passé à generateObject est volontairement
// permissif : s'il exigeait les 4 blocs, UN bloc fautif ferait échouer l'objet ENTIER et tuerait la
// récupération bloc par bloc). Fonction PURE, testée sans LLM.
//
// Le modèle ne renvoie que { key, text }. La provenance (sourceIds) est RECONSTITUÉE depuis le plan :
// on ne « vérifie pas qu'un sourceId n'est pas inventé », on rend sa fabrication impossible.
import type { ConclusionNarrativePlan, BlockKey } from "./conclusion-plan.ts";

export type GeneratedBlock = { key: string; text: string };
export type RenderedBlock = { key: BlockKey; text: string; sourceIds: string[]; generated: boolean };
export type ValidationResult = {
  blocks: RenderedBlock[];
  rejected: { key: string; reason: "missing" | "unknown_key" | "duplicate_key" | "empty" | "too_long" | "unauthorized_number" }[];
};

// Tout nombre, pourcentage, année ou horizon présent dans un texte généré doit déjà figurer dans le
// fallbackText de SON bloc. Contrôle grossier, qui attrape une grande part des hallucinations
// factuelles sans prétendre valider le sens (ce qui serait hors de portée).
function numbersIn(text: string): string[] {
  return text.match(/\d+([.,]\d+)?/g) ?? [];
}
function hasUnauthorizedNumber(generated: string, fallback: string): boolean {
  const allowed = new Set(numbersIn(fallback));
  return numbersIn(generated).some((n) => !allowed.has(n));
}

export function validateGeneratedBlocks(
  plan: ConclusionNarrativePlan,
  generated: GeneratedBlock[],
): ValidationResult {
  const rejected: ValidationResult["rejected"] = [];
  const expected = new Set<string>(plan.blocks.map((b) => b.key));

  // Première occurrence gagnante : un doublon de clé est un rejet, pas un écrasement.
  const byKey = new Map<string, string>();
  for (const g of generated) {
    if (!expected.has(g.key)) { rejected.push({ key: g.key, reason: "unknown_key" }); continue; }
    if (byKey.has(g.key)) { rejected.push({ key: g.key, reason: "duplicate_key" }); continue; }
    byKey.set(g.key, g.text);
  }

  // L'ORDRE DU RENDU EST CELUI DU PLAN. L'ordre de réponse du modèle est ignoré.
  const blocks = plan.blocks.map((b): RenderedBlock => {
    const fallback = { key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false };
    const text = byKey.get(b.key);
    if (text === undefined) { rejected.push({ key: b.key, reason: "missing" }); return fallback; }

    const trimmed = text.trim();
    if (trimmed.length === 0) { rejected.push({ key: b.key, reason: "empty" }); return fallback; }
    if (trimmed.length > b.maxChars) { rejected.push({ key: b.key, reason: "too_long" }); return fallback; }
    if (hasUnauthorizedNumber(trimmed, b.fallbackText)) {
      rejected.push({ key: b.key, reason: "unauthorized_number" });
      return fallback;
    }
    return { key: b.key, text: trimmed, sourceIds: b.sourceIds, generated: true };
  });

  return { blocks, rejected };
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

Run: `node --test src/lib/decision/conclusion-validate.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/conclusion-validate.ts src/lib/decision/conclusion-validate.test.ts
git commit -m "feat(decision): validation pure de la sortie IA (récupération bloc par bloc)"
```

---

## Task 5 : L'identité de l'artefact

**Files:**
- Create: `src/lib/decision/conclusion-hash.ts`
- Create: `src/lib/decision/conclusion-hash.test.ts`

**Interfaces:**
- Consumes: `stableStringify`, `sha256Hex` (Task 1) ; `ConclusionNarrativePlan` (Task 2).
- Produces: `DECISION_NARRATIVE_CONTRACT_VERSION`, `DECISION_NARRATIVE_PROMPT_VERSION`, `DECISION_NARRATIVE_MODEL`, `buildConclusionHash(plan): string`

Les versions sont **dans la matière hachée**, pas concaténées après un hash du plan. `contractVersion` est distincte de `promptVersion` : le schéma de sortie et les règles de validation peuvent bouger sans que le prompt change, et il faut alors invalider les artefacts.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/lib/decision/conclusion-hash.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionHash, hashPayload } from "./conclusion-hash.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
import { sha256Hex, stableStringify } from "../stable-hash.ts";

function plan(over: Partial<ConclusionNarrativePlan> = {}): ConclusionNarrativePlan {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    reservesCount: 2,
    lead: { kind: "none" },
    blocks: [{ key: "verdict", fallbackText: "Aucune contrainte n'est contredite.", sourceIds: [], maxChars: 320 }],
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

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/conclusion-hash.test.ts`
Expected: FAIL, `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3 : Implémenter**

Créer `src/lib/decision/conclusion-hash.ts` :

```ts
// IDENTITÉ de l'artefact narratif. SHA-256 (et pas le fnv1a du cache logement) : une collision
// servirait au lecteur le texte d'un AUTRE plan. Les versions sont DANS la matière hachée, jamais
// concaténées après un hash du plan.
//
// Ce hash remplace toute pile de compteurs manuels (rulesRegistryVersion, dossierSchemaVersion,
// projectVersion) : le plan contient DÉJÀ le produit de tout cela (les fallbackText, les libellés,
// les identifiants, l'état), et un compteur qu'on oublie d'incrémenter affiche un texte périmé comme
// s'il était courant. Le plan est purgé de tout champ volatil (observedAt, sourceMode) par
// construction, cf. conclusion-plan.ts : sinon l'artefact s'invaliderait à chaque chargement.
import { sha256Hex, stableStringify } from "../stable-hash.ts";
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
- Consumes: `SupabaseClient` (`@supabase/supabase-js`), `RenderedBlock` (Task 4).
- Produces:
  - `type StoredBlocks = { key: string; text: string }[]`
  - `readNarrative(sb, userId, insee, scopeKey, inputHash): Promise<StoredBlocks | null>`
  - `saveNarrative(sb, userId, insee, scopeKey, inputHash, blocks, promptVersion, model): Promise<void>`
  - `pruneNarratives(sb, userId, insee, scopeKey, keep: number): Promise<void>`

`(user_id, insee)` serait une clé trop grossière : un même lecteur, sur une même commune, a un projet qui évolue, une lecture communale puis une lecture avec adresse, éventuellement plusieurs adresses. L'identité est le **`input_hash`**, et `scope_key` sépare la commune de chaque logement.

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
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoredBlocks = { key: string; text: string }[];

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
  if (error) throw error; // un bug de requête doit remonter, jamais être maquillé en « pas de cache »
  return (data?.blocks as StoredBlocks | undefined) ?? null;
}

// Upsert IDEMPOTENT : deux rendus concurrents peuvent tous deux constater un cache miss et générer.
// Le conflit sur la contrainte unique est un cas NORMAL, pas une erreur applicative.
export async function saveNarrative(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, inputHash: string,
  blocks: StoredBlocks, promptVersion: string, model: string,
): Promise<void> {
  const { error } = await sb
    .from("decision_narrative")
    .upsert(
      { user_id: userId, insee_code: insee, scope_key: scopeKey, input_hash: inputHash,
        blocks, prompt_version: promptVersion, model },
      { onConflict: "user_id,insee_code,scope_key,input_hash", ignoreDuplicates: true },
    );
  if (error) throw error;
}

// Garde-fou de croissance, best effort (appelé dans after()). Sans lui, chaque édition du projet
// laisse un artefact de plus derrière elle.
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
git commit -m "feat(decision): artefact narratif persisté (identité = input_hash, scope commune/logement)"
```

---

## Task 7 : Le rendu des blocs (déterministe seul, sans IA)

**Files:**
- Create: `src/components/report/ConclusionBlock.tsx`
- Modify: `src/components/report/DossierDecisionSection.tsx:119-125` (le verdict devient `ConclusionBlock`)

**Interfaces:**
- Consumes: `RenderedBlock` (Task 4), `ConclusionNarrativePlan` (Task 2), `ConclusionState`.
- Produces: `<ConclusionBlock state={ConclusionState} blocks={RenderedBlock[]} />`
- `planToBlocks(plan): RenderedBlock[]` — les blocs déterministes, exactement la forme que produira la validation.

À la fin de cette tâche, **rien n'a changé à l'écran** : la conclusion est la même prose, rendue depuis les blocs au lieu d'une chaîne concaténée. C'est le point de bascule qui rend la substitution IA possible sans qu'aucun pixel ne bouge.

- [ ] **Step 1 : Écrire le composant**

Créer `src/components/report/ConclusionBlock.tsx` :

```tsx
// Rendu du verdict, en BLOCS. Même structure DOM que les blocs soient déterministes ou générés :
// la substitution sous Suspense ne doit déplacer aucun pixel. Présentationnel, aucun LLM.
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
    <div className="glass rounded-2xl p-7 mb-3.5" style={{ borderLeft: `2px solid ${meta.color}` }}>
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

Dans `src/components/report/DossierDecisionSection.tsx` :

Retirer la constante locale `STATE_META` (lignes 15-22) et la ligne `const state = STATE_META[dossier.conclusionState];`, ajouter l'import :

```tsx
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
```

Remplacer le bloc du verdict (le `<div className="glass rounded-2xl p-7 mb-3.5" …>` et son contenu, lignes 119-125) par :

```tsx
      <ConclusionBlock
        state={dossier.conclusionState}
        blocks={planToBlocks(dossier.narrativePlan)}
      />
```

`const structured = dossier.conclusionState !== "project_not_structured";` reste (il pilote les liens de bas de section).

- [ ] **Step 3 : Vérifier types et build**

Run: `npx tsc --noEmit && node --test src/lib/decision/*.test.ts`
Expected: silencieux, tests verts.

- [ ] **Step 4 : Vérifier à l'écran que rien n'a bougé**

Lancer `npm run dev`, se connecter (`bonjourfuturee@gmail.com`), ouvrir `/rapport`.
Expected: la conclusion affiche exactement les mêmes phrases qu'avant, désormais en paragraphes distincts (un par registre). Le libellé d'état et le filet coloré sont inchangés.

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
- Consumes: `shouldGenerateNarrative`, `ConclusionNarrativePlan` (Task 2/3) ; `validateGeneratedBlocks` (Task 4) ; `buildConclusionHash` + les 3 constantes de version (Task 5) ; `readNarrative`, `saveNarrative`, `pruneNarratives` (Task 6) ; `ConclusionBlock`, `planToBlocks` (Task 7).
- Produces: `<ConclusionRedigee plan insee scopeKey state />` (async RSC).
- `DossierDecisionSection` gagne deux props : `insee: string` et `scopeKey: string`.

- [ ] **Step 1 : Écrire le Server Component**

Créer `src/components/report/ConclusionRedigee.tsx` :

```tsx
// La conclusion RÉDIGÉE (slice 2). Server Component async sous <Suspense> : le fallback EST la
// conclusion déterministe, et la substitution est ATOMIQUE (les 4 blocs d'un coup, validés). Aucun
// streaming de tokens : un rapport de décision n'a pas à ressembler à un chatbot, et une phrase
// provisoire à l'écran serait une phrase non validée.
//
// L'IA ne peut ni choisir ce qui apparaît (présence et ordre viennent du plan), ni élire un fait
// saillant (le lead est désigné par le déterministe), ni fabriquer une provenance (elle ne renvoie
// que { key, text }), ni changer l'état de conclusion, ni inventer une action.
import { after } from "next/server";
import { headers } from "next/headers";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
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
// un seul bloc fautif et tuerait la récupération bloc par bloc. Le vrai contrat est dans
// validateGeneratedBlocks (pur, testé).
const transportSchema = z.object({
  blocks: z.array(z.object({ key: z.string(), text: z.string() })),
});

const SYSTEM_PROMPT = `Vous êtes l'analyste éditorial de futur•e. On vous remet une conclusion DÉJÀ DÉCIDÉE,
découpée en blocs. Votre seul travail est de reformuler le texte de chaque bloc pour qu'il se lise d'un trait,
dans une voix humaine et sobre.

CE QUE VOUS NE POUVEZ PAS FAIRE, JAMAIS :
- ajouter, retirer ou fusionner un bloc. Vous renvoyez exactement les clés reçues ;
- changer le sens du verdict. Vous n'écrivez jamais « ce lieu vous correspond », « cette adresse est adaptée »,
  « le projet est compatible » : rien n'a été établi de tel ;
- mélanger deux registres. Une condition absolue qui n'a pas pu être vérifiée n'est pas une préférence non
  couverte : la première diminue la valeur du verdict, la seconde réduit seulement la personnalisation ;
- introduire un chiffre, un pourcentage, une année ou un horizon qui ne figure pas déjà dans le texte de repli
  du bloc que vous reformulez ;
- recommander quoi que ce soit. Les actions vivent ailleurs dans le rapport. Vous pouvez écrire que des points
  méritent d'être examinés. Vous n'écrivez jamais ce qu'il faut faire ;
- désigner un fait comme le plus important si le plan ne l'a pas désigné.

LE FAIT SAILLANT :
- lead.kind = "single" : vous pouvez le nommer (« à commencer par… », « notamment… ») en reprenant son constat ;
- lead.kind = "tied" : plusieurs points partagent le même poids. Vous écrivez « plusieurs points structurants »,
  et vous n'en couronnez aucun ;
- lead.kind = "none" : vous ne nommez aucun fait, vous vous en tenez au nombre.

LA VOIX :
- vous parlez au lecteur de SON projet, jamais du produit. futur•e n'est jamais le sujet d'une phrase, sauf pour
  dire ce qu'elle ne sait pas encore lire ;
- une phrase par bloc, deux au plus. Pas de tiret cadratin : une virgule ou deux points ;
- jamais d'antithèse en figure de style (« c'est X, pas Y ») ;
- vous n'annoncez pas ce que vous allez dire, vous le dites.

Vous renvoyez { blocks: [{ key, text }] }, une entrée par bloc reçu.`;

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
  //    <Link> avant tout clic : sans cette garde, un survol coûterait un appel Sonnet. C'est la vraie
  //    protection (un <Link prefetch={false}> oublié ne coûte alors rien).
  const isPrefetch = (await headers()).get("next-router-prefetch") === "1";
  if (!NARRATIVE_ENABLED || isPrefetch) return deterministe;

  // 2. Le GATE passe AVANT le hash et AVANT la base : un plan qui ne justifie aucune rédaction ne
  //    requête pas Supabase, et ne peut pas ressusciter une narration mise en cache quand le gate
  //    était positif.
  if (!shouldGenerateNarrative(plan)) return deterministe;

  const { supabase, user } = await requireCurrentUser();
  const inputHash = buildConclusionHash(plan);

  // 3. Artefact existant pour cette identité EXACTE ? Il est validé contre le contrat COURANT : un
  //    artefact structurellement périmé est ignoré, jamais affiché.
  const cached = await readNarrative(supabase, user.id, insee, scopeKey, inputHash);
  if (cached) {
    const { blocks } = validateGeneratedBlocks(plan, cached);
    return <ConclusionBlock state={state} blocks={blocks} />;
  }

  // 4. Génération. Un échec du modèle rend le déterministe, en le journalisant : le lecteur ne perd
  //    aucune information, et le silence n'est jamais une option.
  let generated;
  try {
    const { object } = await generateObject({
      model: anthropic(DECISION_NARRATIVE_MODEL),
      providerOptions: { anthropic: { effort: "medium", thinking: { type: "disabled" } } },
      temperature: 0.3,
      schema: transportSchema,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({
        scope: plan.scope,
        conclusionState: plan.conclusionState,
        posture: plan.posture,
        reservesCount: plan.reservesCount,
        lead: plan.lead,
        blocks: plan.blocks.map((b) => ({ key: b.key, texteDeRepli: b.fallbackText, maxChars: b.maxChars })),
      }),
    });
    generated = object.blocks;
  } catch (error) {
    console.error("[dossier-narrative] génération échouée", { insee, scopeKey, error });
    return deterministe;
  }

  const { blocks, rejected } = validateGeneratedBlocks(plan, generated);
  if (rejected.length > 0) console.warn("[dossier-narrative] blocs rejetés", { insee, scopeKey, rejected });

  // 5. ARTEFACT DURABLE : l'écriture est attendue AVANT le rendu, parce que futur•e vend un document
  //    et que le texte affiché doit être celui qu'on retrouvera. Son échec ne bloque jamais le rendu.
  const toStore = blocks.filter((b) => b.generated).map((b) => ({ key: b.key, text: b.text }));
  if (toStore.length > 0) {
    try {
      await saveNarrative(
        supabase, user.id, insee, scopeKey, inputHash, toStore,
        DECISION_NARRATIVE_PROMPT_VERSION, DECISION_NARRATIVE_MODEL,
      );
      after(async () => {
        await pruneNarratives(supabase, user.id, insee, scopeKey, 3);
      });
    } catch (error) {
      console.error("[dossier-narrative] persistance échouée", { insee, scopeKey, error });
    }
  }

  return <ConclusionBlock state={state} blocks={blocks} />;
}
```

Note : si `requireCurrentUser()` ne retourne pas `{ supabase, user }` sous ce nom, aligner l'appel sur l'usage de `src/app/api/synthesize-logement/route.ts` (qui utilise `getCurrentUserAccount` / `requireCurrentUser`) et adapter les deux lignes concernées, sans changer la logique.

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
          générer ici coûterait un second appel Sonnet jeté aussitôt. */}
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
git commit -m "feat(decision): conclusion rédigée sous Suspense (garde prefetch, gate, artefact, validation)"
```

---

## Task 9 : Le branchement, et la vérification en vrai

**Files:**
- Modify: `src/app/(account)/rapport/page.tsx:246-257`
- Modify: `src/components/report/DossierAvecLogement.tsx`
- Modify: `.env.local` (flag, en local seulement)

**Interfaces:**
- Consumes: tout ce qui précède.
- `scopeKey` vaut `"commune"` en lecture communale, `logement:<logement_id>` quand l'adresse est branchée.

- [ ] **Step 1 : Passer `insee` et `scopeKey` depuis la page**

Dans `src/app/(account)/rapport/page.tsx`, remplacer le bloc du dossier (lignes 244-258) par :

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

Dans `src/components/report/DossierAvecLogement.tsx`, étendre la signature avec `insee: string; scopeKey: string;` et passer les deux props aux **trois** rendus de `DossierDecisionSection` :

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

Chercher les liens vers le hub payant : `grep -rn 'href="/rapport"' src/`. Sur chacun, ajouter `prefetch={false}`. C'est la défense de surface ; la garde serveur du header reste la vraie protection.

- [ ] **Step 4 : Tests et types**

Run: `node --test src/lib/decision/*.test.ts src/lib/stable-hash.test.ts src/lib/logement-synthesis-cache.test.ts && npx tsc --noEmit`
Expected: tout vert, tsc silencieux.

- [ ] **Step 5 : Vérifier flag OFF (le déterministe reste le produit)**

Sans `DOSSIER_NARRATIVE` dans `.env.local`, lancer `npm run dev`, ouvrir `/rapport`.
Expected: la conclusion s'affiche en blocs déterministes, immédiatement. **Aucun appel Anthropic** (vérifier qu'aucune requête ne part, et que la table `decision_narrative` reste vide).

- [ ] **Step 6 : Vérifier flag ON, dossier riche**

Poser `DOSSIER_NARRATIVE=true` dans `.env.local`, redémarrer. Se connecter (`bonjourfuturee@gmail.com`, Toulouse), éditer le projet pour produire un dossier riche : contrainte dure non couverte (« bord de mer »), préférences non couvertes (qualité de l'air), et une adresse analysée (7 rue du Taur) pour les réserves Logement.
Expected:
- la conclusion déterministe s'affiche d'abord, puis est **remplacée d'un bloc** par la version rédigée (aucun texte mot à mot, aucun saut de mise en page) ;
- les quatre registres restent distincts et dans l'ordre : verdict, contrainte absolue non vérifiée, réserves, priorités non couvertes ;
- aucun chiffre absent du plan, aucune recommandation inventée, aucun « ce lieu vous correspond » ;
- une ligne apparaît dans `decision_narrative` (`scope_key = logement:…`) ;
- recharger la page : **aucun nouvel appel LLM**, le texte est identique au caractère près.

- [ ] **Step 7 : Vérifier le gate sur un dossier pauvre**

Éditer le projet pour retirer les contraintes (verdict seul, ou verdict + priorités non couvertes).
Expected: le déterministe reste affiché, aucun appel LLM, aucune ligne écrite. C'est le comportement voulu : on ne maquille pas un dossier pauvre.

- [ ] **Step 8 : Vérifier la garde prefetch**

Depuis une page qui lie le hub, survoler le lien sans cliquer (ou `curl` la route avec l'en-tête `next-router-prefetch: 1` et un cookie de session).
Expected: aucun appel Anthropic, aucune écriture. Le déterministe est servi.

- [ ] **Step 9 : Commit**

```bash
git add "src/app/(account)/rapport/page.tsx" src/components/report/DossierAvecLogement.tsx src/components/report/DossierDecisionSection.tsx
git commit -m "feat(decision): branche la conclusion rédigée sur le hub (scope commune / logement)"
```

- [ ] **Step 10 : Mettre la mémoire à jour**

Mettre à jour `/memory/project_dossier_decision.md` (slice 2 livré, ce qu'il fait, le flag, le gate) et `docs/handoff/CURRENT.md`. Ne pas oublier : le flag `DOSSIER_NARRATIVE` doit être posé côté Vercel pour que la fonctionnalité vive en production.

---

## Critère de réussite

Sur un dossier riche réel, la conclusion générée dit exactement ce que disait le déterministe, dans l'ordre de gravité, en se lisant d'un trait. Aucun nombre absent du plan. Aucune recommandation inventée. Couper le flag ou l'API rend le déterministe sans que le lecteur perde une seule information. Sur les dossiers pauvres, le gate laisse le déterministe en place, et on l'assume.
