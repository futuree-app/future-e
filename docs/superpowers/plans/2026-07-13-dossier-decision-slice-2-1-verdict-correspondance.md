# Slice 2.1 — Verdict de correspondance + rendu hiérarchisé : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le dossier de décision répond enfin à « ce lieu me correspond-il ? », par un verdict déterministe gradué sur deux mesures prouvables (couverture × orientation), rendu dans une carte qui hiérarchise ce qu'elle sait hiérarchiser.

**Architecture:** Une couche pure nouvelle (`criteria-registry.ts`) agrège les `RuleEvaluation` par **critère déclaré** du projet ; elle produit la couverture, l'orientation et `hasFavorable`. `conclusion-plan.ts` consomme ces mesures dans une table de vérité (label + phrase, toujours déterministes, jamais générés). `ConclusionBlock.tsx` cesse de rendre les registres à plat et les rend en cinq strates étiquetées. Aucun changement du contrat IA : mêmes clés de blocs, même validation.

**Tech Stack:** TypeScript strict, Next.js 16 (App Router, RSC), `node --test` avec `node:assert/strict`, Tailwind, AI SDK (`generateObject`, Anthropic).

**Spec:** `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-1-verdict-correspondance-design.md`

## Global Constraints

- **Le verdict n'est JAMAIS généré par un LLM.** `generable: false`. Il est déterministe, mot pour mot.
- **Le sujet d'une phrase de verdict est le lieu ou le lecteur, jamais le moteur.** Exception unique : quand l'objet de la phrase est notre incapacité (« une donnée déterminante manque »).
- **Jamais de tiret cadratin** (—) : virgule ou deux points. **Jamais d'antithèse** (« c'est X, pas Y »).
- **Aucun nombre faux.** Les accords en nombre sont calculés, jamais laissés à une formule générique.
- `not_applicable` = **hors sujet**. `satisfied` = **déclaré, examiné, rien à redire**. Contrat opposable à toute règle future.
- `projectKeys` d'une `RuleEvaluation` liste les critères que la règle **évalue**, pas ceux auxquels elle est reliée.
- Tests : `node --test src/lib/decision/*.test.ts` (les fichiers `.ts` sont exécutés directement, imports en `./x.ts`).
- `npx tsc --noEmit` doit rendre 0 à chaque commit.
- Toute retouche du prompt impose de bumper `DECISION_NARRATIVE_PROMPT_VERSION` **et** de relancer la sonde.

---

## File Structure

| Fichier | Responsabilité | Statut |
|---|---|---|
| `src/lib/insee-departement.ts` | INSEE → code département (Corse, DOM). Extrait des deux copies existantes. | **créé** |
| `src/lib/decision/criteria-registry.ts` | Le registre des critères déclarés : couverture, orientation, `hasFavorable`. Pur. | **créé** |
| `src/lib/decision/materiality-rules.ts` | Règles. Corrige le contrat `not_applicable`, ajoute `ruleDepartements`. | modifié |
| `src/lib/decision/decision-fact.ts` | Types. Documente `projectKeys`, porte les mesures dans le `Dossier`. | modifié |
| `src/lib/decision/project-view.ts` | Lecteurs projet. **Perd `COVERED_PREFERENCE_KEYS`.** | modifié |
| `src/lib/decision/conclusion-plan.ts` | La table de vérité du verdict (label + phrase), le plan narratif. | modifié |
| `src/lib/decision/decision-assembler.ts` | Construit le registre, le passe au plan. | modifié |
| `src/lib/decision/conclusion-prompt.ts` | Prompt : le lead se compte sur `lead.factIds`. | modifié |
| `src/lib/decision/conclusion-hash.ts` | Bump `DECISION_NARRATIVE_PROMPT_VERSION`. | modifié |
| `src/components/report/ConclusionBlock.tsx` | Les cinq strates étiquetées. | modifié |
| `src/components/report/ConclusionRedigee.tsx` | Passe le plan (plus l'état) à `ConclusionBlock`. | modifié |
| `src/components/report/DossierDecisionSection.tsx` | Supprime la note redondante, ajoute l'intertitre des cartes. | modifié |

---

## Task 1 : Le contrat `not_applicable` / `satisfied`

**Le bug** : `materiality-rules.ts:140` rend `not_applicable` quand l'exposition inondation est **faible** alors que la priorité est déclarée et la donnée présente. Le registre (Task 3) compterait cette bonne nouvelle comme un trou de couverture, et ne verrait jamais un point favorable.

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts:140`
- Modify: `src/lib/decision/decision-fact.ts:86-94` (documenter le contrat)
- Test: `src/lib/decision/materiality-rules.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: le contrat sur `RuleOutcome` dont dépend `buildCriteriaRegistry` (Task 3).

- [ ] **Step 1 : Écrire le test qui échoue**

Dans `src/lib/decision/materiality-rules.test.ts`, à la suite des tests d'inondation existants :

```ts
test("exposition inondation FAIBLE + priorité déclarée = satisfied (examiné, rien à redire)", () => {
  const project = projectWith({ preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const facts = moduleFacts({ inondationRisque: 20 });
  const run = runRules(facts, project);
  const ev = run.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "satisfied");
  assert.deepEqual(ev?.facts, []); // satisfied est SILENCIEUX : aucune carte, mais un point favorable
});

test("priorité inondation NON déclarée = not_applicable (hors sujet, pas « rien à redire »)", () => {
  const project = projectWith({ preferences: [] });
  const run = runRules(moduleFacts({ inondationRisque: 20 }), project);
  const ev = run.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "not_applicable");
});
```

Réutilise les helpers déjà présents en tête du fichier (`projectWith`, `moduleFacts`, `runRules`) ; s'ils portent d'autres noms, garde ceux du fichier.

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

```bash
node --test src/lib/decision/materiality-rules.test.ts
```

Attendu : ÉCHEC sur le premier test (`not_applicable` reçu au lieu de `satisfied`). Le second passe déjà.

- [ ] **Step 3 : Corriger la règle**

`materiality-rules.ts`, ligne 140, remplacer :

```ts
    if (f.inondationRisque < 66) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "not_applicable", facts: [], reason: "exposition non notable" };
```

par :

```ts
    // Examiné, rien à redire : c'est un point FAVORABLE, silencieux (aucune carte). `not_applicable`
    // ici disait « hors sujet » d'une bonne nouvelle : le registre des critères l'aurait comptée comme
    // un trou de couverture, et n'aurait jamais vu un seul point positif. Cf. spec 2.1 §3.1.
    if (f.inondationRisque < 66) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "satisfied", facts: [], reason: "exposition non notable" };
```

- [ ] **Step 4 : Poser le contrat sur le type**

`decision-fact.ts`, remplacer les lignes 86-94 par :

```ts
// LE CONTRAT DES OUTCOMES. Le registre des critères (criteria-registry.ts) en dépend entièrement :
//   not_applicable : HORS SUJET. Le critère n'est pas déclaré, ou la règle ne s'applique pas ici.
//                    Le critère reste NON EXAMINÉ.
//   satisfied      : déclaré, examiné, RIEN À REDIRE. Silencieux (aucun fait), mais c'est un point
//                    FAVORABLE, et il fait monter la couverture. Ne jamais rendre not_applicable
//                    pour dire « tout va bien » : c'est le bug que la slice 2.1 a corrigé.
//   unknown        : la règle s'applique, la donnée manque. Le critère reste NON EXAMINÉ.
//   uncertain      : idem, sans même un fait à montrer.
export type RuleOutcome =
  | "not_applicable" | "satisfied" | "incompatible" | "compromise" | "verification" | "unknown" | "uncertain";

export type RuleEvaluation = {
  ruleId: string;
  // Les critères que cette règle ÉVALUE, jamais ceux auxquels elle est seulement « reliée ».
  // Le registre marque ces critères EXAMINÉS dès que l'outcome est exploitable : une règle qui
  // listerait ici un critère qu'elle ne regarde pas gonflerait la couverture d'un mensonge.
  projectKeys: string[];
  outcome: RuleOutcome;
  facts: DecisionFact[];
  reason: string;
};
```

- [ ] **Step 5 : Lancer les tests, vérifier qu'ils passent**

```bash
node --test src/lib/decision/*.test.ts && npx tsc --noEmit
```

Attendu : tous verts, 0 erreur TS. Si un test existant assertait `not_applicable` sur exposition faible, **c'est lui qui avait tort** : mets-le à jour vers `satisfied`.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/decision-fact.ts src/lib/decision/materiality-rules.test.ts
git commit -m "fix(decision): not_applicable ne peut plus dire « tout va bien »

L'exposition inondation FAIBLE, priorité déclarée et donnée présente, rendait
not_applicable : le registre de la slice 2.1 aurait compté cette bonne nouvelle
comme un trou de couverture, et n'aurait jamais vu un point favorable.

not_applicable = hors sujet. satisfied = examiné, rien à redire. Contrat posé sur
le type, opposable aux règles futures."
```

---

## Task 2 : Le helper département, et la règle `departements`

**Files:**
- Create: `src/lib/insee-departement.ts`
- Create: `src/lib/insee-departement.test.ts`
- Modify: `src/lib/decision/materiality-rules.ts` (nouvelle règle + `REGISTRY`)
- Test: `src/lib/decision/materiality-rules.test.ts`

**Interfaces:**
- Consumes: le contrat d'outcomes (Task 1).
- Produces: `departementFromInsee(insee: string): string | null` ; la règle `territoire.departement-hors-liste` avec `hardConstraint: "departements"`.

- [ ] **Step 1 : Écrire le test du helper**

Créer `src/lib/insee-departement.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { departementFromInsee } from "./insee-departement.ts";

test("métropole : les deux premiers caractères", () => {
  assert.equal(departementFromInsee("31555"), "31"); // Toulouse
  assert.equal(departementFromInsee("75056"), "75");
});

test("Corse : 2A et 2B, jamais « 20 »", () => {
  assert.equal(departementFromInsee("2A004"), "2A");
  assert.equal(departementFromInsee("2B033"), "2B");
});

test("DOM : trois chiffres", () => {
  assert.equal(departementFromInsee("97411"), "974"); // La Réunion
  assert.equal(departementFromInsee("97105"), "971"); // Guadeloupe
});

test("code invalide : null, jamais une supposition", () => {
  assert.equal(departementFromInsee(""), null);
  assert.equal(departementFromInsee("31"), null); // trop court pour être un code commune
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

```bash
node --test src/lib/insee-departement.test.ts
```

Attendu : ÉCHEC, module introuvable.

- [ ] **Step 3 : Écrire le helper**

Créer `src/lib/insee-departement.ts` :

```ts
// INSEE commune -> code département. Lib PURE.
// Extraite de deux copies qui vivaient chacune leur vie (commune-categories.ts, gissol.ts) : la
// troisième aurait fini par diverger. Corse (2A/2B) et DOM (3 chiffres) traités explicitement, parce
// qu'un `slice(0, 2)` naïf rend « 20 » pour la Corse (département qui n'existe plus) et « 97 » pour
// les DOM (qui n'est pas un département).
export function departementFromInsee(insee: string): string | null {
  if (!/^(2[AB]|\d{2})\d{3}$/.test(insee)) return null;
  if (insee.startsWith("2A") || insee.startsWith("2B")) return insee.slice(0, 2);
  if (insee.startsWith("97") || insee.startsWith("98")) return insee.slice(0, 3);
  return insee.slice(0, 2);
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

```bash
node --test src/lib/insee-departement.test.ts
```

Attendu : 4 tests verts.

- [ ] **Step 5 : Écrire le test de la règle**

Dans `src/lib/decision/materiality-rules.test.ts` :

```ts
test("département déclaré et respecté : satisfied (couverture, pas silence)", () => {
  const project = projectWith({ hardConstraints: { departements: ["31"] } });
  const run = runRules(moduleFacts({ insee: "31555" }), project);
  const ev = run.evaluations.find((e) => e.ruleId === "territoire.departement-hors-liste");
  assert.equal(ev?.outcome, "satisfied");
  assert.ok(run.coveredHardConstraints.includes("departements"));
});

test("département déclaré et NON respecté : incompatibilité établie", () => {
  const project = projectWith({ hardConstraints: { departements: ["33"] } });
  const run = runRules(moduleFacts({ insee: "31555", nom: "Toulouse" }), project);
  const fact = run.facts.find((f) => f.role === "incompatibility" && f.ruleId === "territoire.departement-hors-liste");
  assert.ok(fact);
  assert.equal(fact!.materialityTier, "decision_critical");
});

test("aucun département déclaré : not_applicable, et la contrainte n'est pas couverte", () => {
  const run = runRules(moduleFacts({ insee: "31555" }), projectWith({ hardConstraints: {} }));
  const ev = run.evaluations.find((e) => e.ruleId === "territoire.departement-hors-liste");
  assert.equal(ev?.outcome, "not_applicable");
  assert.ok(!run.coveredHardConstraints.includes("departements"));
});
```

- [ ] **Step 6 : Lancer, vérifier l'échec**

```bash
node --test src/lib/decision/materiality-rules.test.ts
```

Attendu : ÉCHEC (aucune évaluation `territoire.departement-hors-liste`).

- [ ] **Step 7 : Écrire la règle**

Dans `materiality-rules.ts`, après `ruleTaille` (et importer le helper en tête : `import { departementFromInsee } from "../insee-departement.ts";`) :

```ts
// Règle 3 : département hors de la liste déclarée. La donnée est DANS le code INSEE : ne pas
// l'examiner obligeait le dossier à écrire « nous n'avons pas examiné les départements visés » sur un
// rapport qui porte le nom de la commune. Le lecteur voyait la contradiction ; elle coûtait plus de
// confiance que n'importe quel défaut de mise en page.
const RULE_DEPT = "territoire.departement-hors-liste";
const ruleDepartement: DecisionRule = {
  id: RULE_DEPT,
  module: "territoire",
  hardConstraint: "departements",
  evaluate: (f, p): RuleEvaluation => {
    const wanted = p.parsed?.hardConstraints?.departements ?? [];
    if (wanted.length === 0) {
      return { ruleId: RULE_DEPT, projectKeys: ["departements"], outcome: "not_applicable", facts: [], reason: "aucun département déclaré" };
    }
    const dept = departementFromInsee(f.insee);
    if (dept == null) {
      return { ruleId: RULE_DEPT, projectKeys: ["departements"], outcome: "uncertain", facts: [], reason: "code INSEE illisible" };
    }
    if (wanted.includes(dept)) {
      return { ruleId: RULE_DEPT, projectKeys: ["departements"], outcome: "satisfied", facts: [], reason: "département dans la liste" };
    }
    const ev: EvidenceRef = { factId: "insee", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: `Département ${dept}`, grain: "commune", href: territoireHref };
    const fact: IncompatibilityFact = {
      id: `${f.insee}:departement`, ruleId: RULE_DEPT, sourceFactIds: ["insee"], module: "territoire",
      role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "departements",
      materialityTier: "decision_critical",
      statement: `Cette commune est dans le département ${dept}, hors de ceux que vous avez posés comme condition (${wanted.join(", ")}).`,
      evidence: [ev],
    };
    return { ruleId: RULE_DEPT, projectKeys: ["departements"], outcome: "incompatible", facts: [fact], reason: "département hors liste" };
  },
};
```

Puis ajouter la règle au registre (ligne ~160) :

```ts
export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille, ruleDepartement, ruleCompromis, ruleConfort, ruleInondation, ...LOGEMENT_RULES];
```

- [ ] **Step 8 : Lancer les tests, vérifier le vert**

```bash
node --test src/lib/decision/*.test.ts src/lib/insee-departement.test.ts && npx tsc --noEmit
```

Attendu : tous verts, 0 erreur TS.

- [ ] **Step 9 : Commit**

```bash
git add src/lib/insee-departement.ts src/lib/insee-departement.test.ts src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(decision): la règle departements, et un seul helper INSEE -> département

Le dossier annonçait « nous n'avons pas examiné les départements visés » sur un
rapport qui porte le nom de la commune : la donnée est dans le code INSEE. Le
lecteur voyait la contradiction.

Helper extrait des deux copies (commune-categories, gissol) : Corse 2A/2B et DOM
à trois chiffres, jamais un slice(0,2) naïf."
```

---

## Task 3 : Le registre des critères déclarés

**Files:**
- Create: `src/lib/decision/criteria-registry.ts`
- Create: `src/lib/decision/criteria-registry.test.ts`
- Modify: `src/lib/decision/project-view.ts` (supprime `COVERED_PREFERENCE_KEYS` et `uncoveredPreferences`)

**Interfaces:**
- Consumes: `RunResult` (Task 1/2), `UserProject`, `HARD_CONSTRAINT_LABELS` (`project-view.ts`), `PREFERENCE_LABELS` (`comparateur-labels.ts`).
- Produces:
  ```ts
  export type CriterionCoverage = "examined" | "unexamined";
  export type CriterionOutcome = "favorable" | "reserve" | "incompatible" | "indeterminate";
  export type ProjectCriterionAssessment = {
    criterionKey: string; kind: "hard_constraint" | "preference"; label: string;
    coverage: CriterionCoverage; outcome: CriterionOutcome;
    maxReserveTier: MaterialityTier | null; ruleIds: string[];
  };
  export type CoverageLevel = "none" | "partial" | "high";
  export type Orientation = "favorable" | "minor_reserves" | "major_reserves" | "incompatible" | "indeterminate";
  export type CriteriaSummary = {
    registry: ProjectCriterionAssessment[];
    coverage: CoverageLevel; orientation: Orientation; hasFavorable: boolean;
    majorReserveCount: number; // faits de réserve structurants/critiques, pour les accords
  };
  export const COVERAGE_HIGH_THRESHOLD = 0.7;
  export function buildCriteriaRegistry(project: UserProject, run: RunResult): CriteriaSummary;
  export function uncoveredPreferences(summary: CriteriaSummary): { key: string; label: string }[];
  export function uncoveredConstraints(summary: CriteriaSummary): { key: HardConstraintKey; label: string }[];
  ```

- [ ] **Step 1 : Écrire les tests**

Créer `src/lib/decision/criteria-registry.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCriteriaRegistry, uncoveredPreferences } from "./criteria-registry.ts";
import type { RunResult, RuleEvaluation, DecisionFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(hard: Record<string, unknown>, prefs: { key: string; weight: number }[]): UserProject {
  return {
    posture: "recherche", intent: null, rawText: "x", updatedAt: null, schemaVersion: 1,
    parsed: { reformulation: "x", hardConstraints: hard, preferences: prefs } as UserProject["parsed"],
  };
}
function ev(ruleId: string, keys: string[], outcome: RuleEvaluation["outcome"], facts: DecisionFact[] = []): RuleEvaluation {
  return { ruleId, projectKeys: keys, outcome, facts, reason: "test" };
}
function reserve(id: string, tier: DecisionFact["materialityTier"]): DecisionFact {
  return {
    id, ruleId: `r-${id}`, sourceFactIds: [], module: "territoire", statement: `constat ${id}`,
    materialityTier: tier, role: "verification", evidence: [],
    action: { type: "verifier_sur_place", label: "Vérifier" },
  };
}
function run(evaluations: RuleEvaluation[]): RunResult {
  return { evaluations, facts: evaluations.flatMap((e) => e.facts), coveredHardConstraints: [] };
}

test("un critère satisfied SILENCIEUSEMENT est examiné, et favorable", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_risque_inondation", weight: 3 }]),
    run([ev("r1", ["faible_risque_inondation"], "satisfied")]),
  );
  const c = s.registry.find((x) => x.criterionKey === "faible_risque_inondation")!;
  assert.equal(c.coverage, "examined");
  assert.equal(c.outcome, "favorable");
  assert.equal(s.hasFavorable, true);
});

test("une préférence examinée par PLUSIEURS règles compte pour UNE", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied"), ev("r2", ["faible_chaleur"], "verification", [reserve("f1", "secondary")])]),
  );
  assert.equal(s.registry.length, 1);
  assert.equal(s.registry[0]!.outcome, "reserve"); // le PIRE gagne
  assert.equal(s.registry[0]!.ruleIds.length, 2);
});

test("un critère satisfied par une règle et unknown par une autre reste EXAMINÉ", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied"), ev("r2", ["faible_chaleur"], "unknown", [reserve("f2", "secondary")])]),
  );
  assert.equal(s.registry[0]!.coverage, "examined");
});

test("un critère que SEUL un unknown touche reste NON examiné", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "unknown", [reserve("f3", "secondary")])]),
  );
  assert.equal(s.registry[0]!.coverage, "unexamined");
  assert.equal(s.coverage, "none");
  assert.equal(s.orientation, "indeterminate");
});

test("le COUPERET : une contrainte dure non examinée interdit `high`, même à 100 % de préférences", () => {
  const s = buildCriteriaRegistry(
    project({ nearPlace: { label: "Gare", maxKm: null } }, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied")]),
  );
  assert.equal(s.coverage, "partial"); // 1/2 examiné ET une contrainte dure muette
});

test("`high` exige toutes les contraintes dures ET 70 % des critères", () => {
  const s = buildCriteriaRegistry(
    project({ departements: ["31"] }, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["departements"], "satisfied"), ev("r2", ["faible_chaleur"], "satisfied")]),
  );
  assert.equal(s.coverage, "high");
  assert.equal(s.orientation, "favorable");
});

test("orientation : une réserve STRUCTURANTE l'emporte sur des favorables", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }, { key: "faible_risque_inondation", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied"), ev("r2", ["faible_risque_inondation"], "verification", [reserve("f4", "structuring")])]),
  );
  assert.equal(s.orientation, "major_reserves");
  assert.equal(s.hasFavorable, true);   // le lieu répond à quelque chose : la phrase le dira
  assert.equal(s.majorReserveCount, 1);
});

test("orientation : des réserves SECONDAIRES sans aucun favorable ne sont PAS `major_reserves`", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "verification", [reserve("f5", "secondary")])]),
  );
  assert.equal(s.orientation, "minor_reserves");
  assert.equal(s.hasFavorable, false);  // rien de positif : la phrase ne promettra rien
});

test("une incompatibilité écrase tout", () => {
  const s = buildCriteriaRegistry(
    project({ departements: ["33"] }, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["departements"], "incompatible"), ev("r2", ["faible_chaleur"], "satisfied")]),
  );
  assert.equal(s.orientation, "incompatible");
});

test("INVARIANT : `indeterminate` implique couverture `none`, et réciproquement", () => {
  const s = buildCriteriaRegistry(project({}, []), run([]));
  assert.equal(s.coverage, "none");
  assert.equal(s.orientation, "indeterminate");
});

test("les priorités non couvertes se DÉRIVENT du registre, plus d'une liste écrite à la main", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }, { key: "vie_locale", weight: 2 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied")]),
  );
  const un = uncoveredPreferences(s);
  assert.equal(un.length, 1);
  assert.equal(un[0]!.key, "vie_locale");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

```bash
node --test src/lib/decision/criteria-registry.test.ts
```

Attendu : ÉCHEC, module introuvable.

- [ ] **Step 3 : Écrire le registre**

Créer `src/lib/decision/criteria-registry.ts` :

```ts
// LE REGISTRE DES CRITÈRES DÉCLARÉS. Lib PURE, aucun LLM.
//
// La couverture et l'orientation ne se calculent NI sur le nombre de règles, NI sur le nombre de faits
// émis, NI sur le nombre de cartes affichées : elles se calculent sur ce que le LECTEUR a déclaré. Une
// préférence peut être touchée par trois règles, produire deux faits et une évaluation silencieuse :
// elle reste UNE priorité, et elle pèse UNE fois.
//
// Cette couche remplace COVERED_PREFERENCE_KEYS, une liste qu'il fallait tenir à la main : le jour où
// l'on ajoutait une règle sans y penser, le dossier annonçait au lecteur que sa priorité n'était pas
// couverte alors qu'elle venait d'être examinée. La couverture est désormais une CONSÉQUENCE OBSERVÉE
// des règles.
import type { MaterialityTier, RunResult, RuleEvaluation, HardConstraintKey } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, HARD_CONSTRAINT_LABELS } from "./project-view.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";

export type CriterionCoverage = "examined" | "unexamined";
export type CriterionOutcome = "favorable" | "reserve" | "incompatible" | "indeterminate";

export type ProjectCriterionAssessment = {
  criterionKey: string;
  kind: "hard_constraint" | "preference";
  label: string;
  coverage: CriterionCoverage;
  outcome: CriterionOutcome;
  maxReserveTier: MaterialityTier | null;
  ruleIds: string[];
};

export type CoverageLevel = "none" | "partial" | "high";
export type Orientation = "favorable" | "minor_reserves" | "major_reserves" | "incompatible" | "indeterminate";

export type CriteriaSummary = {
  registry: ProjectCriterionAssessment[];
  coverage: CoverageLevel;
  orientation: Orientation;
  hasFavorable: boolean;
  majorReserveCount: number;
};

// Une DÉCISION, pas une intuition. Elle vit ici, nommée, couverte par une table de vérité : sinon
// « couverture élevée » redevient une décision éditoriale dispersée dans le code.
export const COVERAGE_HIGH_THRESHOLD = 0.7;

// Un outcome EXPLOITABLE prouve que le critère a été regardé. `unknown` / `uncertain` disent que la
// donnée manque, `not_applicable` que la règle est hors sujet : aucun des deux n'est un examen.
const EXPLOITABLE = new Set<RuleEvaluation["outcome"]>(["satisfied", "incompatible", "compromise", "verification"]);
const RESERVE_OUTCOMES = new Set<RuleEvaluation["outcome"]>(["compromise", "verification"]);
const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };

function worseOutcome(a: CriterionOutcome, b: CriterionOutcome): CriterionOutcome {
  const rank: Record<CriterionOutcome, number> = { incompatible: 0, reserve: 1, favorable: 2, indeterminate: 3 };
  return rank[a] <= rank[b] ? a : b;
}

function assess(
  criterionKey: string,
  kind: "hard_constraint" | "preference",
  label: string,
  evaluations: RuleEvaluation[],
): ProjectCriterionAssessment {
  const mine = evaluations.filter((e) => e.projectKeys.includes(criterionKey));
  const exploitable = mine.filter((e) => EXPLOITABLE.has(e.outcome));

  let outcome: CriterionOutcome = "indeterminate";
  let maxReserveTier: MaterialityTier | null = null;

  for (const e of exploitable) {
    if (e.outcome === "incompatible") outcome = worseOutcome(outcome, "incompatible");
    else if (RESERVE_OUTCOMES.has(e.outcome)) {
      outcome = worseOutcome(outcome, "reserve");
      for (const f of e.facts) {
        if (maxReserveTier == null || TIER_RANK[f.materialityTier] < TIER_RANK[maxReserveTier]) {
          maxReserveTier = f.materialityTier;
        }
      }
    } else if (e.outcome === "satisfied") outcome = worseOutcome(outcome, "favorable");
  }

  return {
    criterionKey, kind, label,
    coverage: exploitable.length > 0 ? "examined" : "unexamined",
    outcome,
    maxReserveTier,
    ruleIds: mine.map((e) => e.ruleId),
  };
}

export function buildCriteriaRegistry(project: UserProject, run: RunResult): CriteriaSummary {
  const registry: ProjectCriterionAssessment[] = [
    ...declaredHardConstraintKeys(project).map((k) =>
      assess(k, "hard_constraint", HARD_CONSTRAINT_LABELS[k], run.evaluations)),
    ...declaredPreferenceKeys(project).map((k) =>
      assess(k, "preference", PREFERENCE_LABELS[k] ?? String(k), run.evaluations)),
  ];

  const examined = registry.filter((c) => c.coverage === "examined");
  const hardUnexamined = registry.some((c) => c.kind === "hard_constraint" && c.coverage === "unexamined");
  const ratio = registry.length === 0 ? 0 : examined.length / registry.length;

  // LE COUPERET. Tant qu'une condition ABSOLUE n'a jamais été testée, la couverture ne peut pas être
  // dite élevée, quel que soit le ratio : un « 8 préférences sur 10 » ne rachète pas la seule condition
  // non négociable du lecteur, restée muette.
  const coverage: CoverageLevel =
    examined.length === 0 ? "none"
    : !hardUnexamined && ratio >= COVERAGE_HIGH_THRESHOLD ? "high"
    : "partial";

  const hasFavorable = examined.some((c) => c.outcome === "favorable");
  const majorReserveCount = run.evaluations
    .filter((e) => RESERVE_OUTCOMES.has(e.outcome))
    .flatMap((e) => e.facts)
    .filter((f) => f.materialityTier !== "secondary").length;

  // L'ordre est NORMATIF : le premier qui matche gagne. Ce n'est PAS un solde : rien ne compense, un
  // critère satisfait ne rachète jamais une réserve critique.
  const orientation: Orientation =
    examined.some((c) => c.outcome === "incompatible") ? "incompatible"
    : examined.length === 0 ? "indeterminate"
    : examined.some((c) => c.maxReserveTier != null && c.maxReserveTier !== "secondary") ? "major_reserves"
    : examined.some((c) => c.outcome === "reserve") ? "minor_reserves"
    : "favorable";

  return { registry, coverage, orientation, hasFavorable, majorReserveCount };
}

export function uncoveredPreferences(summary: CriteriaSummary): { key: string; label: string }[] {
  return summary.registry
    .filter((c) => c.kind === "preference" && c.coverage === "unexamined")
    .map((c) => ({ key: c.criterionKey, label: c.label }));
}

export function uncoveredConstraints(summary: CriteriaSummary): { key: HardConstraintKey; label: string }[] {
  return summary.registry
    .filter((c) => c.kind === "hard_constraint" && c.coverage === "unexamined")
    .map((c) => ({ key: c.criterionKey as HardConstraintKey, label: c.label }));
}
```

- [ ] **Step 4 : Lancer, vérifier le vert**

```bash
node --test src/lib/decision/criteria-registry.test.ts
```

Attendu : les 11 tests verts.

- [ ] **Step 5 : Supprimer la liste tenue à la main**

Dans `project-view.ts`, supprimer `COVERED_PREFERENCE_KEYS` (ligne 9), la fonction `uncoveredPreferences` (lignes 78-83) et l'ancienne `uncoveredConstraints` (lignes 69-74), ainsi que l'import de `PREFERENCE_LABELS` s'il devient inutilisé. Garder `declaredHardConstraintKeys`, `declaredPreferenceKeys`, `HARD_CONSTRAINT_LABELS`, `hasAnyHardConstraint`, `isStructured`, `preferenceWeight`, `nearSeaLimitKm`, `communeSizeBounds`, `isBuyer`.

Supprimer aussi, dans `project-view.test.ts`, les tests portant sur `uncoveredPreferences` / `uncoveredConstraints` : ils sont remplacés par ceux de `criteria-registry.test.ts`.

`decision-assembler.ts` casse à la compilation : c'est attendu, la Task 4 le répare.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/decision/criteria-registry.ts src/lib/decision/criteria-registry.test.ts src/lib/decision/project-view.ts src/lib/decision/project-view.test.ts
git commit -m "feat(decision): le registre des critères DÉCLARÉS (couverture observée, orientation)

Couverture et orientation se calculent sur ce que le LECTEUR a déclaré, jamais
sur le nombre de règles, de faits émis ou de cartes affichées : une préférence
touchée par trois règles reste UNE priorité.

COVERED_PREFERENCE_KEYS, la liste tenue à la main, disparaît : la couverture est
désormais une conséquence observée des règles, plus une déclaration parallèle qui
dérive en silence.

L'orientation n'est PAS un solde : rien ne compense, un critère satisfait ne
rachète jamais une réserve critique. hasFavorable est porté à part, pour qu'une
phrase ne promette jamais un positif inexistant."
```

*(Ce commit laisse volontairement `tsc` rouge sur `decision-assembler.ts` : la Task 4 le répare. Si tu préfères un arbre toujours vert, fusionne les Tasks 3 et 4 en un seul commit.)*

---

## Task 4 : La table de vérité du verdict

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts` (`verdictText` → table label + phrase)
- Modify: `src/lib/decision/decision-assembler.ts` (construit le registre, le passe au plan)
- Modify: `src/lib/decision/decision-fact.ts` (le `Dossier` porte le résumé)
- Test: `src/lib/decision/conclusion-plan.test.ts`, `src/lib/decision/decision-assembler.test.ts`

**Interfaces:**
- Consumes: `CriteriaSummary` (Task 3).
- Produces:
  ```ts
  // conclusion-plan.ts
  export type VerdictTone = "critical" | "caution" | "neutral" | "positive";
  export type ConclusionNarrativePlan = { /* … existant … */
    verdictLabel: string; verdictTone: VerdictTone;
  };
  export type ConclusionPlanInput = { /* … existant … */
    coverage: CoverageLevel; orientation: Orientation; hasFavorable: boolean;
    majorReserveCount: number;  // réserves structurantes/critiques : les accords en nombre du verdict
    reservesShown: number;      // réserves affichées : « N points restent à examiner » (high + minor)
  };
  ```

- [ ] **Step 1 : Écrire les tests de la table de vérité**

Dans `conclusion-plan.test.ts`, adapter `baseInput()` (ajouter `coverage: "partial"`, `orientation: "minor_reserves"`, `hasFavorable: false`, `majorReserveCount: 0`) puis ajouter :

```ts
test("high + favorable : le lieu correspond, et on ose le dire", () => {
  const p = buildConclusionPlan(baseInput({ coverage: "high", orientation: "favorable", hasFavorable: true }));
  assert.equal(p.verdictLabel, "Bonne correspondance");
  assert.match(p.blocks[0]!.fallbackText, /semble bien correspondre à votre projet/);
  assert.equal(p.verdictTone, "positive");
});

test("high + major_reserves AVEC favorable : le positif est dit, la réserve aussi", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: true, majorReserveCount: 2,
  }));
  assert.match(p.blocks[0]!.fallbackText, /répond à plusieurs dimensions de votre projet/);
  assert.match(p.blocks[0]!.fallbackText, /2 points structurants empêchent/);
});

test("high + major_reserves SANS favorable : aucun positif n'est promis", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: false, majorReserveCount: 1,
  }));
  assert.ok(!p.blocks[0]!.fallbackText.includes("répond à plusieurs dimensions"));
  assert.match(p.blocks[0]!.fallbackText, /1 point structurant empêche/); // accord au SINGULIER
});

test("partial + major_reserves : l'écran actuel, et il est honnête", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "partial", orientation: "major_reserves", hasFavorable: false, majorReserveCount: 2,
  }));
  assert.equal(p.verdictLabel, "Lecture encore partielle");
  assert.match(p.blocks[0]!.fallbackText, /encore trop tôt pour dire que ce lieu correspond/);
  assert.equal(p.verdictTone, "caution");
});

test("couverture none : le GARDE-FOU, aucun positif ne s'échappe", () => {
  const p = buildConclusionPlan(baseInput({ coverage: "none", orientation: "indeterminate" }));
  assert.match(p.blocks[0]!.fallbackText, /n'a pas encore pu être évalué au regard de vos critères/);
  assert.ok(!p.blocks[0]!.fallbackText.includes("va dans le sens"));
});

test("incompatibilité : la condition non respectée EST la réponse", () => {
  const p = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility", orientation: "incompatible",
    establishedIncompatibility: { factId: "f1", statement: "Cette commune est à 180 km du littoral" },
  }));
  assert.equal(p.verdictLabel, "Condition non respectée");
  assert.equal(p.verdictTone, "critical");
  assert.match(p.blocks[0]!.fallbackText, /conditions non négociables n'est pas respectée ici/);
});

test("le verdict reste NON générable, quelle que soit la case", () => {
  const p = buildConclusionPlan(baseInput({ coverage: "high", orientation: "favorable" }));
  assert.equal(p.blocks[0]!.generable, false);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

```bash
node --test src/lib/decision/conclusion-plan.test.ts
```

Attendu : ÉCHEC (`verdictLabel` inexistant).

- [ ] **Step 3 : Écrire la table de vérité**

Dans `conclusion-plan.ts` : importer les types (`import type { CoverageLevel, Orientation } from "./criteria-registry.ts";`), étendre `ConclusionPlanInput` et `ConclusionNarrativePlan`, puis remplacer `verdictText` par :

```ts
export type VerdictTone = "critical" | "caution" | "neutral" | "positive";
type Verdict = { label: string; text: string; tone: VerdictTone };

// L'ACCORD EN NOMBRE est calculé, jamais laissé à une formule générique : « 1 points structurants »
// détruit en un caractère la confiance que tout le reste essaie de construire.
function points(n: number, adj: string, verb: string): string {
  return n > 1 ? `${n} points ${adj}s ${verb}nt` : `${n} point ${adj} ${verb}`;
}

// LA TABLE DE VÉRITÉ DU VERDICT (spec 2.1 §5). Déterministe, mot pour mot, jamais générée.
// Le sujet de la phrase est le LIEU ou le LECTEUR, jamais le moteur : « les éléments examinés
// indiquent que… » ferait entendre futur•e commenter son propre travail au lieu de répondre.
// Seule exception, celle où l'objet de la phrase EST notre incapacité (une donnée manque) : là,
// s'effacer serait de la lâcheté, pas de l'élégance.
function verdict(input: ConclusionPlanInput): Verdict {
  if (input.conclusionState === "project_not_structured") {
    return {
      label: "À préciser", tone: "neutral",
      text: "Décrivez votre projet pour mettre ce lieu en regard de ce qui compte pour vous.",
    };
  }
  if (input.conclusionState === "insufficient_evidence") {
    return {
      label: "Impossible de conclure", tone: "neutral",
      text: "Une donnée déterminante manque encore pour conclure sur ce lieu.",
    };
  }
  if (input.orientation === "incompatible") {
    const s = input.establishedIncompatibility?.statement ?? "";
    return {
      label: "Condition non respectée", tone: "critical",
      text: `Une de vos conditions non négociables n'est pas respectée ici : ${s}`,
    };
  }
  if (input.coverage === "none") {
    return {
      label: "Rien encore examiné", tone: "neutral",
      text: "Ce lieu n'a pas encore pu être évalué au regard de vos critères.",
    };
  }

  const n = input.majorReserveCount;
  if (input.coverage === "high") {
    if (input.orientation === "favorable") {
      return { label: "Bonne correspondance", tone: "positive", text: "Ce lieu semble bien correspondre à votre projet." };
    }
    if (input.orientation === "minor_reserves") {
      const r = input.reservesShown;
      return {
        label: "Correspondance favorable", tone: "positive",
        text: `Ce lieu semble bien correspondre à votre projet. ${r > 1 ? `${r} points restent` : `${r} point reste`} à examiner.`,
      };
    }
    return input.hasFavorable
      ? {
          label: "Correspondance à nuancer", tone: "caution",
          text: `Ce lieu répond à plusieurs dimensions de votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`,
        }
      : {
          label: "Correspondance à nuancer", tone: "caution",
          text: `${points(n, "structurant", "empêche")} encore de considérer ce lieu comme une bonne correspondance avec votre projet.`,
        };
  }

  // coverage === "partial"
  if (input.orientation === "favorable") {
    return {
      label: "Signaux favorables", tone: "neutral",
      text: "Ce lieu va dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète.",
    };
  }
  if (input.orientation === "minor_reserves") {
    return {
      label: "Correspondance à confirmer", tone: "neutral",
      text: "Ce lieu va plutôt dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète.",
    };
  }
  return {
    label: "Lecture encore partielle", tone: "caution",
    text: `Il est encore trop tôt pour dire que ce lieu correspond à votre projet : la lecture reste incomplète et ${points(n, "structurant", "demande")} attention.`,
  };
}
```

`buildConclusionPlan` construit alors le bloc verdict à partir de `verdict(input)` (`fallbackText: v.text`) et renvoie `verdictLabel: v.label`, `verdictTone: v.tone` dans le plan. `input.reservesShown` est le nombre de réserves affichées : ajoute-le à `ConclusionPlanInput` (l'assembleur le connaît, c'est `reserves(shown).length`).

Le champ `scope` reste dans le plan (le rendu l'affiche en tête de carte), mais **il sort des phrases** : « À l'échelle de la commune et de l'adresse, » n'ouvre plus le verdict.

- [ ] **Step 4 : Réparer l'assembleur**

`decision-assembler.ts` : construire le registre et le passer au plan.

```ts
import { buildCriteriaRegistry, uncoveredConstraints, uncoveredPreferences } from "./criteria-registry.ts";

export function assembleDossier(run: RunResult, project: UserProject, scope: "commune" | "commune+adresse"): Dossier {
  const summary = buildCriteriaRegistry(project, run);
  const uncovered = uncoveredConstraints(summary);
  // … sections, shown … (inchangé)
  const narrativePlan = buildConclusionPlan({
    scope,
    conclusionState: state,
    posture: project.posture,
    shownFacts: shown,
    uncovered,
    uncoveredPriorities: uncoveredPreferences(summary),
    establishedIncompatibility: established ? { factId: established.id, statement: established.statement } : null,
    coverage: summary.coverage,
    orientation: summary.orientation,
    hasFavorable: summary.hasFavorable,
    majorReserveCount: summary.majorReserveCount,
    reservesShown: shown.filter((f) => f.role !== "incompatibility").length,
  });
  return { /* … */ criteria: summary, /* … */ };
}
```

Ajouter `criteria: CriteriaSummary` au type `Dossier` (`decision-fact.ts`) : la couverture devient une information de premier ordre du dossier, réutilisable ailleurs (comparateur, PDF).

`conclusionState` garde ses cinq valeurs (l'état `no_hard_constraint_declared` existe toujours dans le moteur), mais **il ne pilote plus la phrase du verdict** : seuls `project_not_structured` et `insufficient_evidence` y court-circuitent la table. C'est voulu : la correspondance graduée fonctionne sans contrainte dure.

- [ ] **Step 5 : Lancer les tests, vérifier le vert**

```bash
node --test src/lib/decision/*.test.ts && npx tsc --noEmit
```

Attendu : tous verts, 0 erreur TS. Les tests d'assembleur qui assertaient l'ancienne phrase (« aucune n'est contredite ») doivent être mis à jour vers la nouvelle table : **c'est le changement, pas une régression**.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/decision-assembler.ts src/lib/decision/decision-fact.ts src/lib/decision/*.test.ts
git commit -m "feat(decision): le verdict répond enfin « ce lieu correspond-il ? »

Le déterministe gagne le droit de dire qu'un lieu correspond, à condition de
pouvoir le prouver : la phrase est graduée sur couverture × orientation, jamais
sur une intuition, et jamais générée par un LLM.

« Aucune contrainte n'est contredite » décrivait l'absence d'un problème. Le
lecteur demandait si ce lieu lui convenait.

Le cas « rien d'examiné » est le garde-fou : sans lui, un dossier vide aurait
affiché « plusieurs éléments vont dans le sens de votre projet »."
```

---

## Task 5 : Le bloc des réserves porte le POIDS, plus le décompte

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts` (`reserves_found`)
- Modify: `src/lib/decision/conclusion-prompt.ts`
- Modify: `src/lib/decision/conclusion-hash.ts` (bump)
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: `plan.lead` (existant).
- Produces: un bloc `reserves_found` qui n'existe **que** si `lead.kind !== "none"`.

- [ ] **Step 1 : Écrire les tests**

```ts
test("lead.none : le bloc des réserves n'existe plus (le décompte vit dans l'intertitre des cartes)", () => {
  const p = buildConclusionPlan(baseInput({ shownFacts: [verification("a", "secondary"), verification("b", "secondary")] }));
  assert.equal(p.lead.kind, "none");
  assert.ok(!p.blocks.some((b) => b.key === "reserves_found"));
});

test("lead.tied : la phrase compte les faits de TÊTE, jamais toutes les réserves", () => {
  const p = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("a", "structuring"), verification("b", "structuring"),
      verification("c", "secondary"), verification("d", "secondary"),
    ],
  }));
  assert.equal(p.lead.kind, "tied");
  const bloc = p.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(bloc.fallbackText, /Deux points|2 points/);
  assert.ok(!bloc.fallbackText.includes("4 points")); // les 4 réserves ne pèsent PAS pareil
  assert.deepEqual(bloc.allowedNumbers, ["2", "deux"]);
});

test("lead.single : le fait qui domine est nommé dans le repli", () => {
  const p = buildConclusionPlan(baseInput({
    shownFacts: [verification("a", "structuring", "Le logement porte une étiquette F"), verification("b", "secondary")],
  }));
  const bloc = p.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(bloc.fallbackText, /étiquette F/);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

```bash
node --test src/lib/decision/conclusion-plan.test.ts
```

Attendu : ÉCHEC (le bloc existe en `lead.none`, la phrase compte 4).

- [ ] **Step 3 : Réécrire le bloc**

Dans `buildConclusionPlan`, remplacer le bloc `reserves_found` par :

```ts
  // Le DÉCOMPTE des réserves a changé de fonction : il est devenu l'intertitre des cartes qui suivent
  // (« Les 4 points à examiner avant de décider »). Ce bloc ne garde donc que ce que le décompte ne dit
  // pas : le POIDS RELATIF. En `lead.none`, il n'aurait plus rien à dire : il n'existe pas.
  //
  // `tied` ne veut PAS dire « toutes les réserves pèsent pareil » : il dit que plusieurs faits
  // partagent le rang MAXIMAL. Écrire « quatre points d'un poids comparable » quand deux faits sont à
  // égalité en tête et deux autres secondaires serait faux. On compte lead.factIds, jamais rs.length.
  const rs = reserves(input.shownFacts);
  const lead = selectLead(input.shownFacts);
  if (lead.kind === "single") {
    blocks.push({
      key: "reserves_found",
      fallbackText: `Un point pèse plus que les autres : ${lead.statement}`,
      sourceIds: [lead.factId],
      requiredPhrases: [],
      allowedNumbers: [],
      maxChars: 300,
      generable: true,
    });
  } else if (lead.kind === "tied") {
    const n = lead.factIds.length;
    blocks.push({
      key: "reserves_found",
      fallbackText: `${n} points de même importance arrivent en tête : aucun ne domine à lui seul.`,
      sourceIds: lead.factIds,
      requiredPhrases: [String(n)],
      allowedNumbers: numberForms(n),
      maxChars: 300,
      generable: true,
    });
  }
```

`selectLead` est inchangé. `reservesCount` reste `rs.length` dans le plan (le rendu en a besoin pour l'intertitre).

**Conséquence sur le gate** : `shouldGenerateNarrative` compte les blocs générables ; en `lead.none`, il y en a désormais un de moins. La règle `reservesCount >= 3` reste : un dossier à trois réserves secondaires n'a plus de bloc `reserves_found` à rédiger, donc le gate doit s'appuyer sur les blocs restants. **Simplifier `shouldGenerateNarrative` à `generable >= 2`** et supprimer les deux règles de repêchage (`reservesCount >= 3`, `reservesCount >= 2 && lead.single`), qui référençaient un bloc qui n'existe plus dans ces cas. Mettre à jour les tests du gate en conséquence.

- [ ] **Step 4 : Mettre à jour le prompt et bumper la version**

`conclusion-prompt.ts`, remplacer la section « LE FAIT SAILLANT (champ lead) » par :

```
LE FAIT SAILLANT (champ lead) :
- lead.kind = "single" : un point pèse plus que les autres, et le déterministe l'a désigné. VOUS LE
  NOMMEZ, sans exception, en reprenant les termes de son constat ;
- lead.kind = "tied" : plusieurs points partagent le rang le plus élevé. Vous dites leur NOMBRE (celui
  du registre, pas le nombre total de réserves) et vous n'en couronnez aucun ;
- vous ne recevez jamais de registre « réserves » quand aucun point ne se détache : dans ce cas, il n'y
  a rien à écrire à ce sujet.
```

`conclusion-hash.ts` :

```ts
export const DECISION_NARRATIVE_PROMPT_VERSION = "v2";
```

- [ ] **Step 5 : Lancer les tests, vérifier le vert**

```bash
node --test src/lib/decision/*.test.ts && npx tsc --noEmit
```

Attendu : tous verts, 0 erreur TS.

- [ ] **Step 6 : LANCER LA SONDE (non négociable)**

```bash
node --env-file=.env.local scripts/probe-conclusion.ts
```

Attendu : **≥ 90 % des blocs retenus** (la référence du slice 2 est 15/15 sur 5 tirages). Si le taux s'effondre, **le prompt ou une contrainte est en cause, pas le modèle** : c'est exactement ce que la sonde a rattrapé la dernière fois, alors que 100 tests étaient verts. Corrige, re-bump si le prompt change encore, relance.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-prompt.ts src/lib/decision/conclusion-hash.ts src/lib/decision/conclusion-plan.test.ts
git commit -m "feat(decision): le registre des réserves porte le POIDS, plus le décompte

Le décompte devient l'intertitre des cartes. Ce bloc ne garde que ce que le
décompte ne dit pas : le poids relatif. En lead.none il n'a plus rien à dire, il
n'existe plus.

`tied` = les faits de TÊTE à égalité, pas toutes les réserves : annoncer « quatre
points d'un poids comparable » quand deux dominent et deux sont secondaires était
faux. On compte lead.factIds.

PROMPT_VERSION v1 -> v2, sonde relancée."
```

---

## Task 6 : Le rendu, en cinq strates

**Files:**
- Modify: `src/components/report/ConclusionBlock.tsx` (réécriture complète)
- Modify: `src/components/report/ConclusionRedigee.tsx` (passe le plan, plus l'état)
- Modify: `src/components/report/DossierDecisionSection.tsx` (note du bas supprimée, intertitre ajouté)

**Interfaces:**
- Consumes: `ConclusionNarrativePlan` (`verdictLabel`, `verdictTone`, `lead`, `scope`, `reservesCount`), `RenderedBlock[]`.
- Produces: `<ConclusionBlock plan={plan} blocks={blocks} />` (la prop `state` **disparaît**).

- [ ] **Step 1 : Réécrire `ConclusionBlock.tsx`**

```tsx
// Rendu du verdict, en STRATES. La hiérarchie que le moteur calcule (gravité décroissante, fait
// saillant désigné) était jusqu'ici jetée au rendu : quatre <p> identiques, donc quatre phrases de
// même poids, donc aucune. Chaque strate porte désormais une ÉTIQUETTE qui dit sa nature : un fait
// saillant qui surgit sans être nommé « arrive de nulle part » ; nommé, il devient une information.
//
// Structure DOM IDENTIQUE que les blocs soient déterministes ou générés : la substitution sous
// Suspense ne doit pas faire sauter la page. Aucun LLM ici.
import type { ConclusionNarrativePlan, VerdictTone } from "@/lib/decision/conclusion-plan";
import type { RenderedBlock } from "@/lib/decision/conclusion-validate";

const TONE_COLOR: Record<VerdictTone, string> = {
  critical: "var(--red)",
  caution: "var(--orange)",
  neutral: "var(--ghost)",
  positive: "var(--accent)",
};

const SCOPE_LABEL: Record<ConclusionNarrativePlan["scope"], string> = {
  commune: "commune",
  "commune+adresse": "commune + adresse",
};

export function planToBlocks(plan: ConclusionNarrativePlan): RenderedBlock[] {
  return plan.blocks.map((b) => ({ key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false }));
}

function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color }}>{children}</p>
  );
}

export function ConclusionBlock({ plan, blocks }: { plan: ConclusionNarrativePlan; blocks: RenderedBlock[] }) {
  const color = TONE_COLOR[plan.verdictTone];
  const byKey = new Map(blocks.map((b) => [b.key, b.text]));
  const verdict = byKey.get("verdict") ?? "";
  const poids = byKey.get("reserves_found");
  const limite = byKey.get("unexamined_hard_constraints");
  const nonCouvert = byKey.get("uncovered_priorities");

  // Le fait saillant n'est PAS affiché en cas d'incompatibilité : le blocage EST la réponse, en haut.
  const poidsLabel = plan.lead.kind === "single" ? "Ce qui pèse le plus"
    : plan.lead.kind === "tied" ? "Des poids comparables"
    : null;
  const showPoids = poids != null && poidsLabel != null && plan.verdictTone !== "critical";

  return (
    <div className="glass rounded-2xl p-7 mb-3.5" style={{ borderLeft: `2px solid ${color}`, minHeight: "132px" }}>
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <Eyebrow color={color}>{plan.verdictLabel}</Eyebrow>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ghost shrink-0">
          {SCOPE_LABEL[plan.scope]}
        </span>
      </div>

      <p className="text-[21px] leading-[1.45] text-label">{verdict}</p>

      {showPoids ? (
        <div className="mt-5">
          <Eyebrow color="var(--accent)">{poidsLabel}</Eyebrow>
          <p className="text-[17px] leading-[1.55] text-label">{poids}</p>
        </div>
      ) : null}

      {limite ? (
        <div className="mt-5 rounded-xl px-4 py-3 border" style={{ borderColor: "color-mix(in srgb, var(--orange) 30%, transparent)", background: "color-mix(in srgb, var(--orange) 6%, transparent)" }}>
          <Eyebrow color="var(--orange)">Limite de ce constat</Eyebrow>
          <p className="text-[15px] leading-[1.55] text-muted">{limite}</p>
        </div>
      ) : null}

      {nonCouvert ? (
        <p className="mt-4 text-[12.5px] leading-[1.5] text-ghost">{nonCouvert}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2 : Adapter les deux appelants**

`ConclusionRedigee.tsx` : remplacer les quatre usages `<ConclusionBlock state={state} blocks={…} />` par `<ConclusionBlock plan={plan} blocks={…} />`, et supprimer la prop `state` de la signature du composant (ainsi que l'import `ConclusionState`).

`DossierDecisionSection.tsx` :
- lignes 119-134 : `<ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} />` (deux occurrences), et `<ConclusionRedigee plan={…} insee={…} scopeKey={…} />` sans `state`.
- **supprimer** le bloc `dossier.uncovered.length > 0` (lignes 163-168) : l'information vit désormais dans l'encart « Limite de ce constat », plus haut, où elle est mieux placée. La garder ici ferait croire à deux niveaux de réserve distincts.
- **ajouter** l'intertitre au-dessus de la grille des cartes (avant `<div className="grid gap-3.5">`) :

```tsx
{dossier.narrativePlan.reservesCount > 0 ? (
  <p className="mt-8 mb-4 font-mono text-[11px] tracking-[0.12em] uppercase text-ghost">
    {`Les ${dossier.narrativePlan.reservesCount} points ${
      // La posture commande, comme dans l'assembleur : « avant de décider » n'a aucun sens pour
      // quelqu'un qui habite déjà là.
      dossier.narrativePlan.posture === "habitant" ? "à comprendre ou surveiller" : "à examiner avant de décider"
    }`}
  </p>
) : null}
```

- [ ] **Step 3 : Compiler et builder**

```bash
npx tsc --noEmit && npm run build
```

Attendu : 0 erreur TS, build qui compile (les « Retrying » sur `/inondation/[insee]` sont du SSG lent, préexistant).

- [ ] **Step 4 : Vérifier à l'écran, flag allumé**

Le serveur de dev doit tourner avec `DOSSIER_NARRATIVE=true` dans `.env.local`.

Se connecter avec le **compte de test configuré localement** (aucun identifiant n'est écrit dans ce dépôt), sur Toulouse, adresse 7 rue du Taur déjà analysée. Le projet de test (déjà enregistré) :

> Nous étudions un appartement à Toulouse pour l'acheter. Nous devons impérativement rester en Haute-Garonne et habiter à moins de 30 minutes de la gare Matabiau, c'est non négociable. Nous tenons à des étés supportables et à un faible risque d'inondation. Comptent aussi beaucoup pour nous : un cadre calme, l'accès aux collèges et lycées, une vie locale animée et des espaces naturels à proximité.

Ouvrir `/rapport` et vérifier, un par un :
1. **La contradiction Haute-Garonne a disparu** : « les départements visés » n'apparaît plus dans « Limite de ce constat » (seule y reste la proximité de la gare Matabiau).
2. Le label du haut n'est plus « Aucun blocage établi ».
3. Le verdict est en 21 px et répond à la correspondance ; les strates suivantes sont visiblement subordonnées.
4. La note « Non encore examiné » **n'apparaît plus** en bas de section.
5. L'intertitre « Les N points à examiner avant de décider » coiffe les cartes.
6. Le déterministe s'affiche, puis est remplacé **d'un bloc** (pas de saut de page).
7. **Recharger ne relance aucun appel LLM** et rend un texte identique.

- [ ] **Step 5 : Commit**

```bash
git add src/components/report/ConclusionBlock.tsx src/components/report/ConclusionRedigee.tsx src/components/report/DossierDecisionSection.tsx
git commit -m "feat(report): la conclusion cesse d'aplatir ce que le moteur hiérarchise

Quatre <p> identiques rendaient quatre phrases de même poids, donc aucune : le
lead que le déterministe désigne n'était même pas affiché. Cinq strates
étiquetées désormais, chacune nommant sa nature.

La note « Non encore examiné » du bas disparaît : l'information remonte sous le
verdict, où une contrainte dure non testée dit ce qu'elle est, une limite de
portée. Le décompte des réserves devient l'intertitre des cartes."
```

---

## Task 7 : Mémoire, nettoyage, PR

- [ ] **Step 1 : Supprimer le script de vérif traînant**

```bash
git status --short   # verif-slice2.mjs à la racine, non commité
rm verif-slice2.mjs
```

- [ ] **Step 2 : Mettre à jour la mémoire**

Dans `/Users/quentinbrache/.claude/projects/-Users-quentinbrache-Desktop-Futur-e/memory/project_dossier_decision.md`, ajouter la slice 2.1 : le verdict de correspondance (couverture × orientation, couperet des contraintes dures, `hasFavorable`), le registre des critères déclarés qui remplace `COVERED_PREFERENCE_KEYS`, le contrat `not_applicable` / `satisfied`, et le fait que **« couverture élevée » est inatteignable tant que la couverture n'a pas été élargie** (c'est le chantier suivant).

- [ ] **Step 3 : Vérification finale**

```bash
node --test src/lib/decision/*.test.ts src/lib/*.test.ts && npx tsc --noEmit && npm run build
```

Attendu : tous verts, 0 erreur TS, build OK.

- [ ] **Step 4 : Pousser et ouvrir la PR**

```bash
git push -u origin feat/dossier-slice-2-conclusion-redigee
gh pr create --title "Dossier de décision : conclusion rédigée (slice 2) + verdict de correspondance (slice 2.1)" --body "…"
```

Ne pas oublier **`DOSSIER_NARRATIVE` côté Vercel** si la conclusion rédigée doit vivre en production.

---

## Ce que ce plan ne fait PAS

**La couverture.** Deux contraintes dures sur onze, trois préférences sur vingt-huit, module Santé absent. La case « couverture élevée » de la table de vérité restera **inatteignable** et son code **jamais affiché** tant que la matière n'aura pas grandi : c'est assumé, et c'est pourquoi elle est couverte par des tests unitaires, jamais par une vérification à l'écran.

Ce plan construit la mécanique qui saura dire « ce lieu correspond ». **Le chantier suivant lui donne le droit de le dire.**
