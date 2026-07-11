# Dossier de décision + registre de matérialité (slice 1) — Implementation Plan v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser une page « En une minute » déterministe au-dessus des modules payants du hub `/rapport`, qui hiérarchise les faits Territoire selon cinq rôles décisionnels pour le projet déclaré, en étant honnête sur ce qu'elle a examiné ET sur ce qu'elle n'a pas encore examiné.

**Architecture:** Un registre de règles pures dont chaque `evaluate()` retourne une ÉVALUATION (verdict + faits), pas seulement des faits. Le moteur agrège faits + couverture des contraintes dures + valide chaque fait (invariants). Un assembleur pur calcule un état de conclusion honnête, plafonne l'affichage, et nomme les contraintes non couvertes. La page rend, elle ne calcule rien. Aucun LLM.

**Tech Stack:** TypeScript, Next.js App Router (server components), tests `node --test`.

**Spec:** `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md` (v2).

## Global Constraints

- **Registre, jamais un score.** Chaque remontée est le produit d'une règle explicable.
- **Couverture déclarée, jamais supposée.** « Aucune incompatibilité » ne se dit QUE sur les contraintes réellement examinées ; une contrainte déclarée non couverte est nommée.
- **Absence de donnée jamais un résultat.** `catnat`/`risque` absents → `null` (jamais 0). Aucun `try/catch` autour de `subScore` (une erreur inattendue doit exploser).
- **Conclusion communale explicite.** Toujours « À l'échelle de la commune, … ».
- **Toute phrase porte un `ruleId` et une preuve** (`observedValue` = la valeur mesurée). La conclusion porte un `conclusionBasis`.
- **Doctrine imposée par le type** (union discriminée) + invariants runtime (`assertFactValid`) qui JETTENT en cas de violation.
- **Déterministe seulement**, gabarits posture-aware, hiérarchie plafonnée (2/3/3/4).
- **Conventions projet.** Imports `.ts` explicites en lib, `@/` sans extension en composant/page. FR sans tiret cadratin, sans antithèse « X, pas Y » comme emphase.

**Vérif :** `npx tsc --noEmit` (exit 0) · `node --test src/lib/decision/<fichier>.test.ts`.

---

## File Structure

Neufs sous `src/lib/decision/` : `decision-fact.ts` (contrats), `project-view.ts` (lecteurs projet + couverture), `territory-facts.ts` (adaptateur + orchestrateur), `materiality-rules.ts` (registre + moteur + invariants), `decision-assembler.ts` (assembleur). Tests jumeaux.
Composant : `src/components/report/DossierDecisionSection.tsx`.
Touchés : `src/lib/comparateur-vie.ts` (export `subScore`), `src/app/(account)/rapport/page.tsx`.
Vault : 3 arbitrages.

---

## Task 1: Contrats + lecteurs de projet + couverture + export `subScore`

**Files:**
- Create: `src/lib/decision/decision-fact.ts`
- Create: `src/lib/decision/project-view.ts`
- Create: `src/lib/decision/project-view.test.ts`
- Modify: `src/lib/comparateur-vie.ts` (`function subScore` → `export function subScore`)

**Interfaces produced (consommées partout ensuite) :** tous les types de `decision-fact.ts` ; `project-view.ts` : `preferenceWeight`, `declaredPreferenceKeys`, `nearSeaLimitKm`, `communeSizeBounds`, `isBuyer`, `isStructured`, `hasAnyHardConstraint`, `declaredHardConstraintKeys`, `uncoveredConstraints`, `HARD_CONSTRAINT_LABELS` ; `comparateur-vie.ts` : `subScore` exporté.

- [ ] **Step 1: Créer les contrats**

Create `src/lib/decision/decision-fact.ts` :

```ts
// Contrats du dossier de décision (slice 1, v2). Types PURS.
// DecisionFact = union discriminée : le TYPE impose la doctrine (un unknown a un impact,
// un compromise a deux côtés avec preuve, une verification a une action).
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { ProjectPosture, UserProject } from "../user-project.ts";

export type DecisionModule = "territoire" | "logement";
export type MaterialityTier = "decision_critical" | "structuring" | "secondary";
export type VerificationActionType =
  | "renseigner_adresse" | "verifier_sur_place" | "obtenir_document" | "demander_confirmation";

export type HardConstraintKey =
  | "departements" | "zones" | "excludeZones" | "montagne" | "reliefProche"
  | "nearSea" | "excludeSea" | "nearPlace" | "communeSize" | "excludePlace" | "sizeRelativeTo";

export type EvidenceRef = {
  factId: string;
  module: DecisionModule;
  label: string;
  observedValue?: string; // la valeur mesurée : "42 km", "18 000 hab.", "72/100"
  grain: "commune" | "adresse" | "secteur";
  href?: string; // optionnel slice 1
};

type BaseFact = {
  id: string;
  ruleId: string;
  sourceFactIds: string[];
  module: DecisionModule;
  statement: string;
  materialityTier: MaterialityTier;
};

export type IncompatibilityFact = BaseFact & {
  role: "incompatibility";
  evidenceStrength: "established" | "indicative";
  hardConstraintKey: HardConstraintKey;
  evidence: EvidenceRef[];
  limitation?: string;
};
export type CompromiseSide = { projectKey: PreferenceKey; statement: string; evidence: EvidenceRef[] };
export type CompromiseFact = BaseFact & { role: "compromise"; sides: [CompromiseSide, CompromiseSide] };
export type UnknownFact = BaseFact & {
  role: "unknown";
  impact: "blocking" | "scoped";
  evidence: EvidenceRef[];
  action?: { type: VerificationActionType; label: string };
};
export type VerificationFact = BaseFact & {
  role: "verification";
  evidence: EvidenceRef[];
  action: { type: VerificationActionType; label: string };
  limitation?: string;
};
export type DecisionFact = IncompatibilityFact | CompromiseFact | UnknownFact | VerificationFact;

export type ModuleFacts = {
  insee: string;
  nom: string;
  distanceCoteKm: number;
  population: number | null;
  altitude: number | null;
  catnatInondation: number | null;
  inondationRisque: number | null;
  scores: Partial<Record<PreferenceKey, number | null>>;
  hasAddress: boolean;
};

export type RuleOutcome =
  | "not_applicable" | "satisfied" | "incompatible" | "compromise" | "verification" | "unknown" | "uncertain";
export type RuleEvaluation = {
  ruleId: string;
  projectKeys: string[];
  outcome: RuleOutcome;
  facts: DecisionFact[];
  reason: string;
};

export type DecisionRule = {
  id: string;
  module: DecisionModule;
  hardConstraint?: HardConstraintKey; // si présent : participe à la couverture de cette contrainte
  evaluate: (facts: ModuleFacts, project: UserProject) => RuleEvaluation;
};

export type RunResult = {
  facts: DecisionFact[];
  evaluations: RuleEvaluation[];
  coveredHardConstraints: HardConstraintKey[];
};

export type ConclusionState =
  | "established_incompatibility" | "no_incompatibility_established"
  | "insufficient_evidence" | "no_hard_constraint_declared" | "project_not_structured";
export type UncoveredConstraint = { key: HardConstraintKey; label: string };
export type DossierSection = {
  key: "incompatibilities" | "compromises" | "unknowns" | "verifications";
  title: string;
  facts: DecisionFact[];
};
export type Dossier = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  conclusion: string;
  conclusionBasis: { ruleIds: string[]; factIds: string[]; evidence: EvidenceRef[] };
  sections: DossierSection[];
  uncovered: UncoveredConstraint[];
};
```

- [ ] **Step 2: Exporter `subScore`**

Modify `src/lib/comparateur-vie.ts` : ajouter `export ` devant `function subScore(key: PreferenceKey, c: IndexCommune): number | null {`.

- [ ] **Step 3: Écrire le test des lecteurs (échoue)**

Create `src/lib/decision/project-view.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  preferenceWeight, declaredPreferenceKeys, nearSeaLimitKm, communeSizeBounds,
  isBuyer, isStructured, hasAnyHardConstraint, declaredHardConstraintKeys, uncoveredConstraints,
} from "./project-view.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
const HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [{ key: "faible_chaleur", weight: 3 }] };

test("isStructured : faux si parsed null", () => {
  assert.equal(isStructured(project(null)), false);
  assert.equal(isStructured(project(HC)), true);
});

test("isBuyer : seul intent achat, pas la posture adresse", () => {
  assert.equal(isBuyer(project(HC, { posture: "adresse" })), false);
  assert.equal(isBuyer(project(HC, { intent: "achat" })), true);
});

test("declaredHardConstraintKeys : énumère les contraintes présentes", () => {
  assert.deepEqual([...declaredHardConstraintKeys(project(HC))].sort(), ["communeSize", "nearSea"]);
  assert.deepEqual(declaredHardConstraintKeys(project(null)), []);
});

test("communeSizeBounds : lit min/max", () => {
  assert.deepEqual(communeSizeBounds(project(HC)), { min: null, max: 20000 });
  assert.equal(communeSizeBounds(project({ reformulation: "x", hardConstraints: {}, preferences: [] })), null);
});

test("uncoveredConstraints : déclarées moins couvertes, avec label", () => {
  const u = uncoveredConstraints(project(HC), ["nearSea"]);
  assert.deepEqual(u.map((x) => x.key), ["communeSize"]);
  assert.ok(u[0].label.length > 0);
});

test("declaredPreferenceKeys + preferenceWeight", () => {
  assert.deepEqual(declaredPreferenceKeys(project(HC)), ["faible_chaleur"]);
  assert.equal(preferenceWeight(project(HC), "faible_chaleur"), 3);
  assert.equal(preferenceWeight(project(HC), "nature"), 0);
});

test("nearSeaLimitKm + hasAnyHardConstraint", () => {
  assert.equal(nearSeaLimitKm(project(HC)), 5);
  assert.equal(hasAnyHardConstraint(project(HC)), true);
  assert.equal(hasAnyHardConstraint(project({ reformulation: "x", hardConstraints: {}, preferences: [] })), false);
});
```

- [ ] **Step 4: Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/project-view.test.ts`
Expected: FAIL (`Cannot find module './project-view.ts'`).

- [ ] **Step 5: Écrire les lecteurs**

Create `src/lib/decision/project-view.ts` :

```ts
// Lecteurs PURS au-dessus de UserProject + calcul de couverture des contraintes dures.
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { HardConstraintKey, UncoveredConstraint } from "./decision-fact.ts";

export function isStructured(project: UserProject): boolean {
  return project.parsed != null;
}
export function isBuyer(project: UserProject): boolean {
  return project.intent === "achat"; // analyser une adresse n'est PAS acheter
}
export function preferenceWeight(project: UserProject, key: PreferenceKey): number {
  const p = project.parsed?.preferences?.find((x) => x.key === key);
  return p ? p.weight : 0;
}
export function declaredPreferenceKeys(project: UserProject): PreferenceKey[] {
  return project.parsed?.preferences?.map((p) => p.key) ?? [];
}
export function nearSeaLimitKm(project: UserProject): number | null {
  const ns = project.parsed?.hardConstraints?.nearSea;
  if (ns?.active && typeof ns.maxKm === "number") return ns.maxKm;
  return null;
}
export function communeSizeBounds(project: UserProject): { min: number | null; max: number | null } | null {
  const cs = project.parsed?.hardConstraints?.communeSize;
  if (!cs) return null;
  return { min: cs.min ?? null, max: cs.max ?? null };
}

export const HARD_CONSTRAINT_LABELS: Record<HardConstraintKey, string> = {
  departements: "les départements visés",
  zones: "les zones géographiques visées",
  excludeZones: "les zones à éviter",
  montagne: "l'exigence de montagne",
  reliefProche: "la proximité du relief",
  nearSea: "la proximité de la mer",
  excludeSea: "l'éloignement de la mer",
  nearPlace: "la proximité d'un lieu",
  communeSize: "la taille de la commune",
  excludePlace: "les villes à quitter",
  sizeRelativeTo: "la taille relative à une ville",
};

export function declaredHardConstraintKeys(project: UserProject): HardConstraintKey[] {
  const hc = project.parsed?.hardConstraints;
  if (!hc) return [];
  const out: HardConstraintKey[] = [];
  if (hc.departements?.length) out.push("departements");
  if (hc.zones?.some((z) => z.strength === "hard")) out.push("zones");
  if (hc.excludeZones?.length) out.push("excludeZones");
  if (hc.montagne?.strength === "hard") out.push("montagne");
  if (hc.reliefProche?.strength === "hard") out.push("reliefProche");
  if (hc.nearSea?.active) out.push("nearSea");
  if (hc.excludeSea) out.push("excludeSea");
  if (hc.nearPlace) out.push("nearPlace");
  if (hc.communeSize) out.push("communeSize");
  if (hc.excludePlace?.length) out.push("excludePlace");
  if (hc.sizeRelativeTo) out.push("sizeRelativeTo");
  return out;
}
export function hasAnyHardConstraint(project: UserProject): boolean {
  return declaredHardConstraintKeys(project).length > 0;
}
export function uncoveredConstraints(project: UserProject, covered: HardConstraintKey[]): UncoveredConstraint[] {
  const cov = new Set(covered);
  return declaredHardConstraintKeys(project)
    .filter((k) => !cov.has(k))
    .map((k) => ({ key: k, label: HARD_CONSTRAINT_LABELS[k] }));
}
```

- [ ] **Step 6: Lancer, vérifier le succès + typecheck + commit**

Run: `node --test src/lib/decision/project-view.test.ts` → PASS (7 tests).
Run: `npx tsc --noEmit` → exit 0.

```bash
git add src/lib/decision/decision-fact.ts src/lib/decision/project-view.ts src/lib/decision/project-view.test.ts src/lib/comparateur-vie.ts
git commit -m "feat(decision): contrats v2 (union discriminée) + lecteurs projet + couverture

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Adaptateur `ModuleFacts` (absence honnête, sans catch)

**Files:**
- Create: `src/lib/decision/territory-facts.ts`
- Create: `src/lib/decision/territory-facts.test.ts`

**Interfaces produced:** `buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts` ; `loadModuleFacts(insee, opts): Promise<ModuleFacts | null>`. (`buildCommuneDossier` viendra en Task 6.)

- [ ] **Step 1: Test (échoue)**

Create `src/lib/decision/territory-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildModuleFacts } from "./territory-facts.ts";
import type { IndexCommune } from "../comparateur-vie.ts";

function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return {
    insee: "17300", nom: "Fouras", dept: "17", region: "NA", lat: 46, lon: -1,
    population: 4000, densite: 500, distance_cote_km: 0.5, altitude: 8,
    clim: {}, pct: {}, ...(over as IndexCommune),
  };
}

test("buildModuleFacts : passe-plats honnêtes", () => {
  const f = buildModuleFacts(entry({ population: 18000, distance_cote_km: 42, inondation: { catnat: 5, tri: false, risque: 72 } }), { hasAddress: false });
  assert.equal(f.population, 18000);
  assert.equal(f.distanceCoteKm, 42);
  assert.equal(f.catnatInondation, 5);
  assert.equal(f.inondationRisque, 72);
  assert.equal(f.hasAddress, false);
});

test("buildModuleFacts : absence d'inondation -> null (jamais 0)", () => {
  const f = buildModuleFacts(entry(), { hasAddress: true });
  assert.equal(f.catnatInondation, null);
  assert.equal(f.inondationRisque, null);
  assert.equal(f.hasAddress, true);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — `node --test src/lib/decision/territory-facts.test.ts` → FAIL.

- [ ] **Step 3: Écrire l'adaptateur**

Create `src/lib/decision/territory-facts.ts` :

```ts
// Adaptateur : commune de l'index (grain commune) -> ModuleFacts. Aucune valeur de repli :
// une absence connue devient null. Pas de try/catch autour de subScore (une erreur inattendue
// doit exploser, ce n'est pas une « donnée indisponible »).
import { getCommuneEntry, subScore, PREFERENCE_KEYS, type IndexCommune } from "../comparateur-vie.ts";
import type { ModuleFacts } from "./decision-fact.ts";

export function buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) scores[key] = subScore(key, entry);
  return {
    insee: entry.insee,
    nom: entry.nom,
    distanceCoteKm: entry.distance_cote_km,
    population: entry.population ?? null,
    altitude: entry.altitude ?? null,
    catnatInondation: entry.inondation ? entry.inondation.catnat : null,
    inondationRisque: entry.inondation ? entry.inondation.risque : null,
    scores,
    hasAddress: opts.hasAddress,
  };
}

export async function loadModuleFacts(insee: string, opts: { hasAddress: boolean }): Promise<ModuleFacts | null> {
  const entry = await getCommuneEntry(insee);
  return entry ? buildModuleFacts(entry, opts) : null;
}
```

- [ ] **Step 4: Lancer, vérifier le succès + typecheck + commit**

`node --test src/lib/decision/territory-facts.test.ts` → PASS (2). `npx tsc --noEmit` → exit 0.

```bash
git add src/lib/decision/territory-facts.ts src/lib/decision/territory-facts.test.ts
git commit -m "feat(decision): adaptateur index -> ModuleFacts (absence en null)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Moteur `runRules` + invariants + règles 1 & 2 (incompatibilités + couverture)

**Files:**
- Create: `src/lib/decision/materiality-rules.ts`
- Create: `src/lib/decision/materiality-rules.test.ts`

**Interfaces produced:** `REGISTRY: DecisionRule[]` ; `runRules(facts, project): RunResult` ; `assertFactValid(fact, project): void` ; règles `territoire.mer-hors-seuil`, `territoire.taille-hors-seuil`.

- [ ] **Step 1: Tests (échoue)**

Create `src/lib/decision/materiality-rules.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return { insee: "00000", nom: "Test", distanceCoteKm: 1, population: 5000, altitude: 100, catnatInondation: 0, inondationRisque: 10, scores: {}, hasAddress: false, ...over };
}
function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}

test("règle 1 mer : incompatibilité établie + couverture nearSea", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.mer-hors-seuil");
  assert.ok(f && f.role === "incompatibility");
  assert.equal(f.evidenceStrength, "established");
  assert.equal(f.hardConstraintKey, "nearSea");
  assert.equal(f.evidence[0].observedValue, "42 km");
  assert.ok(r.coveredHardConstraints.includes("nearSea"));
});

test("règle 1 mer : satisfaite -> aucun fait mais couverture nearSea", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 50 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 2 }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.mer-hors-seuil"), false);
  assert.ok(r.coveredHardConstraints.includes("nearSea"));
});

test("règle 1 mer : non déclarée -> pas de couverture", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  assert.equal(r.coveredHardConstraints.includes("nearSea"), false);
});

test("règle 2 taille : incompatibilité établie au-dessus du max", () => {
  const p = project({ reformulation: "x", hardConstraints: { communeSize: { min: null, max: 20000 } }, preferences: [] });
  const r = runRules(facts({ population: 45000 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.taille-hors-seuil");
  assert.ok(f && f.role === "incompatibility");
  assert.equal(f.hardConstraintKey, "communeSize");
  assert.match(f.statement, /45 000/);
});

test("règle 2 taille : population absente -> inconnue scopée", () => {
  const p = project({ reformulation: "x", hardConstraints: { communeSize: { min: null, max: 20000 } }, preferences: [] });
  const r = runRules(facts({ population: null }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.taille-hors-seuil");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
});

test("invariant : chaque fait porte ruleId + preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  for (const f of r.facts) {
    assert.ok(f.ruleId.length > 0);
    if (f.role !== "compromise") assert.ok(f.evidence.length >= 1);
  }
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL (`Cannot find module`).

- [ ] **Step 3: Écrire le moteur + invariants + règles 1 & 2**

Create `src/lib/decision/materiality-rules.ts` :

```ts
// Registre de matérialité (v2). Chaque règle expose evaluate() : elle décrit toujours son verdict
// (satisfied / incompatible / not_applicable / unknown…), même sans produire de fait. C'est ce qui
// rend la COUVERTURE observable. Le moteur valide chaque fait (assertFactValid JETTE en cas de
// violation de doctrine). Généralise src/lib/logement-checklist.ts.
import type {
  DecisionRule, DecisionFact, ModuleFacts, RunResult, RuleEvaluation,
  IncompatibilityFact, UnknownFact, EvidenceRef, HardConstraintKey,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { nearSeaLimitKm, communeSizeBounds, declaredHardConstraintKeys, declaredPreferenceKeys } from "./project-view.ts";

// Formatage déterministe des milliers (espace ASCII, jamais toLocaleString qui varie).
function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
const territoireHref = "/rapport/quartier";

// Règle 1 : mer hors seuil.
const RULE_MER = "territoire.mer-hors-seuil";
const ruleMer: DecisionRule = {
  id: RULE_MER,
  module: "territoire",
  hardConstraint: "nearSea",
  evaluate: (f, p): RuleEvaluation => {
    const max = nearSeaLimitKm(p);
    if (max == null) return { ruleId: RULE_MER, projectKeys: ["nearSea"], outcome: "not_applicable", facts: [], reason: "nearSea non déclaré" };
    if (f.distanceCoteKm > max) {
      const ev: EvidenceRef = { factId: "distance_cote_km", module: "territoire", label: `Littoral · ${f.nom}`, observedValue: `${Math.round(f.distanceCoteKm)} km`, grain: "commune", href: territoireHref };
      const fact: IncompatibilityFact = {
        id: `${f.insee}:mer`, ruleId: RULE_MER, sourceFactIds: ["distance_cote_km"], module: "territoire",
        role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "nearSea",
        materialityTier: "decision_critical",
        statement: `Cette commune est à ${Math.round(f.distanceCoteKm)} km du littoral, au-delà de la limite de ${max} km que vous avez posée.`,
        evidence: [ev],
      };
      return { ruleId: RULE_MER, projectKeys: ["nearSea"], outcome: "incompatible", facts: [fact], reason: "distance > seuil" };
    }
    return { ruleId: RULE_MER, projectKeys: ["nearSea"], outcome: "satisfied", facts: [], reason: "distance <= seuil" };
  },
};

// Règle 2 : taille de commune hors seuil.
const RULE_TAILLE = "territoire.taille-hors-seuil";
const ruleTaille: DecisionRule = {
  id: RULE_TAILLE,
  module: "territoire",
  hardConstraint: "communeSize",
  evaluate: (f, p): RuleEvaluation => {
    const bounds = communeSizeBounds(p);
    if (!bounds) return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "not_applicable", facts: [], reason: "communeSize non déclaré" };
    if (f.population == null) {
      const ev: EvidenceRef = { factId: "population", module: "territoire", label: `Territoire · ${f.nom}`, grain: "commune", href: territoireHref };
      const fact: UnknownFact = {
        id: `${f.insee}:taille`, ruleId: RULE_TAILLE, sourceFactIds: ["population"], module: "territoire",
        role: "unknown", impact: "scoped", materialityTier: "secondary",
        statement: "La population de cette commune n'est pas disponible dans nos données ; la taille ne peut pas être vérifiée.",
        evidence: [ev],
      };
      return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "unknown", facts: [fact], reason: "population absente" };
    }
    const over = bounds.max != null && f.population > bounds.max;
    const under = bounds.min != null && f.population < bounds.min;
    if (over || under) {
      const seuil = over ? `au-dessus de ${fmt(bounds.max!)}` : `en dessous de ${fmt(bounds.min!)}`;
      const ev: EvidenceRef = { factId: "population", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: `${fmt(f.population)} hab.`, grain: "commune", href: territoireHref };
      const fact: IncompatibilityFact = {
        id: `${f.insee}:taille`, ruleId: RULE_TAILLE, sourceFactIds: ["population"], module: "territoire",
        role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "communeSize",
        materialityTier: "decision_critical",
        statement: `Cette commune compte ${fmt(f.population)} habitants, ${seuil} de la taille que vous avez posée.`,
        evidence: [ev],
      };
      return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "incompatible", facts: [fact], reason: "population hors bornes" };
    }
    return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "satisfied", facts: [], reason: "population dans les bornes" };
  },
};

export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille];

// Invariants : protègent toutes les futures règles. JETTE (fail-fast) en cas de violation.
export function assertFactValid(fact: DecisionFact, project: UserProject): void {
  switch (fact.role) {
    case "incompatibility":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (!declaredHardConstraintKeys(project).includes(fact.hardConstraintKey)) {
        throw new Error(`[decision] ${fact.ruleId}: incompatibilité sur une contrainte non déclarée (${fact.hardConstraintKey})`);
      }
      break;
    case "compromise":
      if (fact.sides.length !== 2) throw new Error(`[decision] ${fact.ruleId}: un compromis a exactement deux côtés`);
      for (const s of fact.sides) {
        if (!declaredPreferenceKeys(project).includes(s.projectKey)) throw new Error(`[decision] ${fact.ruleId}: côté sur une préférence non déclarée (${s.projectKey})`);
        if (s.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: côté sans preuve`);
      }
      break;
    case "unknown":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (fact.impact !== "blocking" && fact.impact !== "scoped") throw new Error(`[decision] ${fact.ruleId}: inconnue sans impact`);
      break;
    case "verification":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (!fact.action) throw new Error(`[decision] ${fact.ruleId}: vérification sans action`);
      break;
  }
}

export function runRules(facts: ModuleFacts, project: UserProject): RunResult {
  const outFacts: DecisionFact[] = [];
  const evaluations: RuleEvaluation[] = [];
  const covered = new Set<HardConstraintKey>();
  for (const rule of REGISTRY) {
    const ev = rule.evaluate(facts, project);
    evaluations.push(ev);
    for (const fact of ev.facts) {
      assertFactValid(fact, project);
      outFacts.push(fact);
    }
    if (rule.hardConstraint && ev.outcome !== "not_applicable") covered.add(rule.hardConstraint);
  }
  return { facts: outFacts, evaluations, coveredHardConstraints: [...covered] };
}
```

- [ ] **Step 4: Lancer, vérifier le succès + typecheck + commit**

`node --test src/lib/decision/materiality-rules.test.ts` → PASS (6). `npx tsc --noEmit` → exit 0.

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(decision): moteur runRules + invariants + règles mer et taille (couverture)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Règles 3, 4, 5 (compromis à deux côtés, inconnue scopée, vérification posture-aware)

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts` (ajouter 3 règles au `REGISTRY`)
- Modify: `src/lib/decision/materiality-rules.test.ts`

**Interfaces produced:** règles `territoire.compromis-transport-chaleur`, `territoire.confort-ete-sans-adresse`, `territoire.inondation-exposition`.

- [ ] **Step 1: Tests (échoue)** — append à `materiality-rules.test.ts` :

```ts
test("règle 3 compromis : deux côtés, chacun sa preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }, { key: "faible_chaleur", weight: 2 }] });
  const r = runRules(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.compromis-transport-chaleur");
  assert.ok(f && f.role === "compromise");
  assert.equal(f.sides.length, 2);
  assert.ok(f.sides[0].evidence.length >= 1 && f.sides[1].evidence.length >= 1);
  assert.equal(f.sides[0].evidence[0].observedValue, "80/100");
  assert.doesNotMatch(f.sides[0].statement + f.sides[1].statement, /meilleure|train/i);
});

test("règle 3 compromis : rien si une seule dimension déclarée", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }] });
  const r = runRules(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.compromis-transport-chaleur"), false);
});

test("règle 4 confort : inconnue scopée sans adresse, quelle que soit l'intention", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const r = runRules(facts({ hasAddress: false }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.confort-ete-sans-adresse");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
  assert.equal(f.action?.type, "renseigner_adresse");
});

test("règle 4 confort : rien si adresse présente", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const r = runRules(facts({ hasAddress: true }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.confort-ete-sans-adresse"), false);
});

test("règle 5 inondation : vérification si exposition notable, texte acheteur", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.ok(f.action.label.length > 0);
  assert.match(f.statement, /avant de vous engager/);
  assert.match(f.statement, /1982/);
});

test("règle 5 inondation : posture habitant -> comprendre/surveiller, pas s'engager", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] }, { posture: "habitant" });
  const r = runRules(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.doesNotMatch(f.statement, /avant de vous engager/);
  assert.match(f.statement, /surveiller/i);
});

test("règle 5 inondation : exposition inconnue -> aucun fait", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ inondationRisque: null }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.inondation-exposition"), false);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL (nouveaux tests).

- [ ] **Step 3: Ajouter les 3 règles**

Dans `src/lib/decision/materiality-rules.ts`, étendre l'import `project-view` :

```ts
import { nearSeaLimitKm, communeSizeBounds, declaredHardConstraintKeys, declaredPreferenceKeys, preferenceWeight } from "./project-view.ts";
```

et l'import de types (ajouter `CompromiseFact`, `VerificationFact`) :

```ts
import type {
  DecisionRule, DecisionFact, ModuleFacts, RunResult, RuleEvaluation,
  IncompatibilityFact, UnknownFact, CompromiseFact, VerificationFact, EvidenceRef, HardConstraintKey,
} from "./decision-fact.ts";
```

Ajouter avant `export const REGISTRY` :

```ts
function scoreEvidence(nom: string, key: string, score: number): EvidenceRef {
  return { factId: `scores.${key}`, module: "territoire", label: `Territoire · ${nom}`, observedValue: `${Math.round(score)}/100`, grain: "commune", href: territoireHref };
}

// Règle 3 : compromis transport × chaleur. Deux priorités déclarées qui tirent en sens opposés sur
// cette commune. Texte honnête (pas de « meilleure », pas de « train »), preuve de chaque côté.
const RULE_COMPROMIS = "territoire.compromis-transport-chaleur";
const ruleCompromis: DecisionRule = {
  id: RULE_COMPROMIS,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const t = f.scores.acces_transports;
    const c = f.scores.faible_chaleur;
    if (preferenceWeight(p, "acces_transports") < 2 || preferenceWeight(p, "faible_chaleur") < 2 || t == null || c == null || !(t >= 60 && c <= 40)) {
      return { ruleId: RULE_COMPROMIS, projectKeys: ["acces_transports", "faible_chaleur"], outcome: "not_applicable", facts: [], reason: "pas de tension déclarée" };
    }
    const fact: CompromiseFact = {
      id: `${f.insee}:compromis-transport-chaleur`, ruleId: RULE_COMPROMIS,
      sourceFactIds: ["scores.acces_transports", "scores.faible_chaleur"], module: "territoire",
      role: "compromise", materialityTier: "structuring",
      statement: "Deux de vos priorités tirent en sens opposés sur cette commune.",
      sides: [
        { projectKey: "acces_transports", statement: "L'accès aux transports ressort favorablement à l'échelle de la commune.", evidence: [scoreEvidence(f.nom, "acces_transports", t)] },
        { projectKey: "faible_chaleur", statement: "Votre priorité de faible exposition à la chaleur est moins bien satisfaite ici.", evidence: [scoreEvidence(f.nom, "faible_chaleur", c)] },
      ],
    };
    return { ruleId: RULE_COMPROMIS, projectKeys: ["acces_transports", "faible_chaleur"], outcome: "compromise", facts: [fact], reason: "tension transport/chaleur" };
  },
};

// Règle 4 : confort d'été non évaluable au grain bâtiment sans adresse. Inconnue SCOPÉE (ne bloque
// jamais la conclusion). Gate sur le GRAIN (priorité chaleur déclarée + pas d'adresse), pas sur l'achat.
const RULE_CONFORT = "territoire.confort-ete-sans-adresse";
const ruleConfort: DecisionRule = {
  id: RULE_CONFORT,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    if (preferenceWeight(p, "faible_chaleur") < 2 || f.hasAddress) {
      return { ruleId: RULE_CONFORT, projectKeys: ["faible_chaleur"], outcome: "not_applicable", facts: [], reason: "non applicable" };
    }
    const ev: EvidenceRef = { factId: "commune", module: "territoire", label: `Territoire · ${f.nom}`, grain: "commune", href: territoireHref };
    const fact: UnknownFact = {
      id: `${f.insee}:confort-sans-adresse`, ruleId: RULE_CONFORT, sourceFactIds: ["hasAddress"], module: "territoire",
      role: "unknown", impact: "scoped", materialityTier: "secondary",
      statement: "Votre priorité de confort d'été ne peut pas être évaluée au grain du bâtiment tant qu'aucune adresse n'est renseignée.",
      evidence: [ev], action: { type: "renseigner_adresse", label: "Affiner avec une adresse" },
    };
    return { ruleId: RULE_CONFORT, projectKeys: ["faible_chaleur"], outcome: "unknown", facts: [fact], reason: "confort d'été gated sur l'adresse" };
  },
};

// Règle 5 : exposition inondation notable + priorité risque déclarée -> vérification. Croise le score
// d'exposition actuel (pas un comptage brut), nomme la période et la limite. Posture-aware.
const RULE_INOND = "territoire.inondation-exposition";
const ruleInondation: DecisionRule = {
  id: RULE_INOND,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    if (preferenceWeight(p, "faible_risque_inondation") < 2) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "not_applicable", facts: [], reason: "priorité non déclarée" };
    if (f.inondationRisque == null) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "uncertain", facts: [], reason: "exposition inconnue" };
    if (f.inondationRisque < 66) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "not_applicable", facts: [], reason: "exposition non notable" };
    const habitant = p.posture === "habitant";
    const catnatCtx = f.catnatInondation != null ? ` La commune a connu ${f.catnatInondation} arrêtés de catastrophe naturelle inondation depuis 1982 (comptage administratif, pas une probabilité).` : "";
    const ev: EvidenceRef = { factId: "inondation.risque", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: `${Math.round(f.inondationRisque)}/100`, grain: "commune", href: territoireHref };
    const fact: VerificationFact = {
      id: `${f.insee}:inondation-exposition`, ruleId: RULE_INOND, sourceFactIds: ["inondation.risque", "inondation.catnat"], module: "territoire",
      role: "verification", materialityTier: "structuring",
      statement: (habitant
        ? "L'exposition de la commune à l'inondation ressort élevée, à comprendre et surveiller au fil des épisodes."
        : "L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques avant de vous engager.") + catnatCtx,
      limitation: "Cette exposition est lue à l'échelle de la commune, pas de l'adresse.",
      evidence: [ev],
      action: habitant
        ? { type: "demander_confirmation", label: "Consultez l'état des risques applicable à votre adresse" }
        : { type: "obtenir_document", label: "Consultez l'état des risques (Géorisques)" },
    };
    return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "verification", facts: [fact], reason: "exposition inondation notable" };
  },
};
```

Remplacer `REGISTRY` par :

```ts
export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille, ruleCompromis, ruleConfort, ruleInondation];
```

- [ ] **Step 4: Lancer, vérifier le succès + typecheck + commit**

`node --test src/lib/decision/materiality-rules.test.ts` → PASS (13). `npx tsc --noEmit` → exit 0.

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(decision): règles compromis (2 côtés), confort scopé, inondation posture-aware

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Assembleur (états honnêtes + couverture + hiérarchie plafonnée)

**Files:**
- Create: `src/lib/decision/decision-assembler.ts`
- Create: `src/lib/decision/decision-assembler.test.ts`

**Interfaces produced:** `assembleDossier(run: RunResult, project: UserProject, scope: "commune" | "commune+adresse"): Dossier`.

- [ ] **Step 1: Tests (échoue)**

Create `src/lib/decision/decision-assembler.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import type { DecisionFact, RunResult } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
function run(facts: DecisionFact[], covered: RunResult["coveredHardConstraints"] = []): RunResult {
  return { facts, evaluations: [], coveredHardConstraints: covered };
}
function incompat(over: Partial<import("./decision-fact.ts").IncompatibilityFact> = {}): DecisionFact {
  return { id: "i", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "nearSea", materialityTier: "decision_critical", statement: "trop loin", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], ...over };
}
function verif(): DecisionFact {
  return { id: "v", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };
const NO_HC = { reformulation: "x", hardConstraints: {}, preferences: [] };

test("parsed null -> project_not_structured", () => {
  const d = assembleDossier(run([]), project(null), "commune");
  assert.equal(d.conclusionState, "project_not_structured");
  assert.equal(d.sections.length, 0);
});

test("incompatibilité établie -> established_incompatibility, conclusion communale", () => {
  const d = assembleDossier(run([incompat()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.conclusionState, "established_incompatibility");
  assert.match(d.conclusion, /à l'échelle de la commune/i);
});

test("no_hard_constraint_declared distinct de no_incompatibility_established", () => {
  const sansHC = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.equal(sansHC.conclusionState, "no_hard_constraint_declared");
  const avecHC = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(avecHC.conclusionState, "no_incompatibility_established");
});

test("contrainte déclarée non couverte -> nommée dans uncovered + conclusion", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [] });
  const d = assembleDossier(run([], ["nearSea"]), p, "commune");
  assert.deepEqual(d.uncovered.map((u) => u.key), ["communeSize"]);
  assert.match(d.conclusion, /pas encore examiné/i);
});

test("inconnue bloquante -> insufficient_evidence ; scopée -> non", () => {
  const blocking: DecisionFact = { id: "u", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "blocking", materialityTier: "secondary", statement: "?", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] };
  assert.equal(assembleDossier(run([blocking], ["nearSea"]), project(WITH_HC), "commune").conclusionState, "insufficient_evidence");
  const scoped = { ...blocking, impact: "scoped" as const };
  assert.equal(assembleDossier(run([scoped], ["nearSea"]), project(WITH_HC), "commune").conclusionState, "no_incompatibility_established");
});

test("caps : au plus 2 incompatibilités affichées", () => {
  const many = [incompat({ id: "a" }), incompat({ id: "b" }), incompat({ id: "c" })];
  const d = assembleDossier(run(many, ["nearSea"]), project(WITH_HC), "commune");
  const sec = d.sections.find((s) => s.key === "incompatibilities");
  assert.equal(sec!.facts.length, 2);
});

test("titre vérifications adapté à la posture habitant", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC, { posture: "habitant" }), "commune");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /surveiller/i);
});

test("conclusionBasis porte ruleIds et preuves", () => {
  const d = assembleDossier(run([incompat()], ["nearSea"]), project(WITH_HC), "commune");
  assert.ok(d.conclusionBasis.ruleIds.length >= 1);
  assert.ok(d.conclusionBasis.evidence.length >= 1);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL.

- [ ] **Step 3: Écrire l'assembleur**

Create `src/lib/decision/decision-assembler.ts` :

```ts
// Assembleur PUR : états de conclusion HONNÊTES (périmètre communal, deux vides distincts,
// project_not_structured), couverture nommée, hiérarchie plafonnée. Aucun LLM.
import type {
  DecisionFact, Dossier, DossierSection, ConclusionState, RunResult, EvidenceRef, MaterialityTier,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { hasAnyHardConstraint, isStructured, uncoveredConstraints } from "./project-view.ts";

function labels(project: UserProject): { engage: string; verifTitle: string } {
  if (project.posture === "habitant") {
    return { engage: "comprendre et surveiller", verifTitle: "Ce que ces données invitent à comprendre ou surveiller" };
  }
  return { engage: "vous engager", verifTitle: "À vérifier avant de vous engager" };
}

const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
function tierRank(f: DecisionFact): number {
  const base = TIER_RANK[f.materialityTier] * 2;
  return f.role === "incompatibility" && f.evidenceStrength === "indicative" ? base + 1 : base;
}
function byRole(facts: DecisionFact[], role: DecisionFact["role"], cap: number): DecisionFact[] {
  return facts.filter((f) => f.role === role).sort((a, b) => tierRank(a) - tierRank(b)).slice(0, cap);
}

function conclusionState(facts: DecisionFact[], project: UserProject): ConclusionState {
  if (!isStructured(project)) return "project_not_structured";
  if (facts.some((f) => f.role === "incompatibility" && f.evidenceStrength === "established")) return "established_incompatibility";
  if (facts.some((f) => f.role === "unknown" && f.impact === "blocking")) return "insufficient_evidence";
  if (!hasAnyHardConstraint(project)) return "no_hard_constraint_declared";
  return "no_incompatibility_established";
}

function examinedClause(uncovered: { label: string }[]): string {
  return uncovered.length === 0 ? "" : ` Nous n'avons pas encore examiné, à ce grain : ${uncovered.map((u) => u.label).join(", ")}.`;
}

function conclusionText(state: ConclusionState, facts: DecisionFact[], project: UserProject, uncovered: { label: string }[]): string {
  const scope = "À l'échelle de la commune,";
  const l = labels(project);
  switch (state) {
    case "project_not_structured":
      return "Décrivez votre projet pour une lecture qui met en regard ce lieu et ce qui compte pour vous.";
    case "established_incompatibility": {
      const f = facts.find((x) => x.role === "incompatibility" && x.evidenceStrength === "established");
      return `${scope} une contrainte que vous avez déclarée n'est pas respectée ici : ${f ? f.statement : ""}`;
    }
    case "insufficient_evidence":
      return `${scope} nous ne pouvons pas conclure honnêtement : une donnée déterminante pour votre projet manque.`;
    case "no_hard_constraint_declared":
      return `Vous n'avez déclaré aucune contrainte non négociable. ${scope} les données examinées ne font ressortir aucun point éliminatoire pour votre projet.${examinedClause(uncovered)}`;
    case "no_incompatibility_established": {
      const nReserves = facts.filter((x) => x.role === "verification" || x.role === "compromise" || x.role === "unknown").length;
      const base = `${scope} sur les contraintes que nous savons examiner, aucune n'est contredite.`;
      const tail = nReserves > 0 ? ` ${nReserves} point${nReserves > 1 ? "s" : ""} restent à examiner avant de ${l.engage}.` : "";
      return base + tail + examinedClause(uncovered);
    }
  }
}

function factEvidence(f: DecisionFact): EvidenceRef[] {
  return f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence;
}

export function assembleDossier(run: RunResult, project: UserProject, scope: "commune" | "commune+adresse"): Dossier {
  const { facts, coveredHardConstraints } = run;
  const uncovered = uncoveredConstraints(project, coveredHardConstraints);
  const state = conclusionState(facts, project);
  const l = labels(project);
  const sections: DossierSection[] = [
    { key: "incompatibilities", title: "Vos contraintes non négociables", facts: byRole(facts, "incompatibility", 2) },
    { key: "compromises", title: "Ce qui départage vraiment", facts: byRole(facts, "compromise", 3) },
    { key: "unknowns", title: "Ce que nous ne savons pas encore", facts: byRole(facts, "unknown", 3) },
    { key: "verifications", title: l.verifTitle, facts: byRole(facts, "verification", 4) },
  ].filter((s) => s.facts.length > 0);
  const shown = sections.flatMap((s) => s.facts);
  return {
    scope,
    conclusionState: state,
    conclusion: conclusionText(state, facts, project, uncovered),
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

- [ ] **Step 4: Lancer, vérifier le succès + typecheck + commit**

`node --test src/lib/decision/decision-assembler.test.ts` → PASS (8). `npx tsc --noEmit` → exit 0.

```bash
git add src/lib/decision/decision-assembler.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(decision): assembleur (états honnêtes, couverture nommée, caps)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Orchestrateur + composant + insertion sur le hub (ouvert aux payants)

**Files:**
- Modify: `src/lib/decision/territory-facts.ts` (ajouter `buildCommuneDossier`)
- Create: `src/components/report/DossierDecisionSection.tsx`
- Modify: `src/app/(account)/rapport/page.tsx`

**Interfaces produced:** `buildCommuneDossier(insee: string, project: UserProject): Promise<Dossier | null>` ; `<DossierDecisionSection dossier={Dossier} />`.

**Note Next.js :** `/rapport/page.tsx` est déjà un `async` server component ; le composant est présentationnel (aucun `"use client"`). En cas de doute sur une API App Router, vérifier `node_modules/next/dist/docs/` (AGENTS.md).

- [ ] **Step 1: Ajouter l'orchestrateur**

Dans `src/lib/decision/territory-facts.ts`, ajouter les imports :

```ts
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import type { Dossier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
```

et en fin de fichier :

```ts
// Orchestrateur du hub : commune -> ModuleFacts -> règles -> assemblage. Slice 1 : hasAddress false,
// scope "commune". parsed null est géré par l'assembleur (état project_not_structured).
export async function buildCommuneDossier(insee: string, project: UserProject): Promise<Dossier | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: false });
  if (!facts) return null;
  return assembleDossier(runRules(facts, project), project, "commune");
}
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Écrire le composant**

Create `src/components/report/DossierDecisionSection.tsx` :

```tsx
// Rendu déterministe du dossier de décision (« En une minute »). Présentationnel : reçoit un Dossier
// déjà assemblé. Pas de LLM. Ouvert à tous les payants : le cas creux reste digne (conclusion honnête
// + contraintes non couvertes nommées + CTA adresse).
import Link from "next/link";
import type { Dossier, DecisionFact } from "@/lib/decision/decision-fact";

const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--red)",
  compromises: "var(--orange)",
  unknowns: "var(--violet)",
  verifications: "var(--blue)",
};

function EvidenceLine({ fact, color }: { fact: DecisionFact; color: string }) {
  const refs = fact.role === "compromise" ? fact.sides.flatMap((s) => s.evidence) : fact.evidence;
  return (
    <div className="flex items-center gap-3 mt-2 flex-wrap">
      {refs.map((e, i) => {
        const text = e.observedValue ? `${e.label} · ${e.observedValue}` : e.label;
        return e.href ? (
          <Link key={i} href={e.href} className="font-mono text-[10px] tracking-[0.06em] uppercase no-underline" style={{ color }}>
            Voir la preuve · {text}
          </Link>
        ) : (
          <span key={i} className="font-mono text-[10px] tracking-[0.06em] uppercase text-ghost">{text}</span>
        );
      })}
      {fact.role === "verification" || fact.role === "unknown"
        ? fact.action && <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{fact.action.label}</span>
        : null}
    </div>
  );
}

function FactBody({ fact }: { fact: DecisionFact }) {
  if (fact.role === "compromise") {
    return (
      <>
        <p className="text-label">{fact.statement}</p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {fact.sides.map((s, i) => (
            <li key={i} className="text-muted text-[13px]">{s.statement}</li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="text-label">{fact.statement}</p>
      {"limitation" in fact && fact.limitation ? <p className="text-muted text-[13px] mt-1">{fact.limitation}</p> : null}
    </>
  );
}

export function DossierDecisionSection({ dossier }: { dossier: Dossier }) {
  const structured = dossier.conclusionState !== "project_not_structured";
  return (
    <section className="mt-12" id="dossier-decision">
      <div className="mb-6 max-w-[640px]">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">En une minute</p>
        <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Ce lieu, au regard de votre projet.
        </h2>
      </div>

      <div className="glass rounded-2xl p-7 mb-4">
        <p className="text-[17px] leading-[1.7] text-label">{dossier.conclusion}</p>
      </div>

      <div className="flex flex-col gap-3.5">
        {dossier.sections.map((s) => {
          const col = SECTION_ACCENT[s.key] ?? "var(--violet)";
          return (
            <div key={s.key} className="glass rounded-xl p-6" style={{ borderLeft: `2px solid ${col}` }}>
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase mb-3.5" style={{ color: col }}>{s.title}</p>
              <ul className="flex flex-col gap-4">
                {s.facts.map((f) => (
                  <li key={f.id} className="text-[14px] leading-[1.65]">
                    <FactBody fact={f} />
                    <EvidenceLine fact={f} color={col} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {dossier.uncovered.length > 0 ? (
        <p className="text-[13px] text-muted mt-4">
          Non encore examiné à ce grain : {dossier.uncovered.map((u) => u.label).join(", ")}.
        </p>
      ) : null}

      {structured ? (
        <div className="mt-5">
          <Link href="/rapport/logement" className="inline-flex flex-col gap-1 px-6 py-4 rounded-xl no-underline border border-white/[0.1] bg-white/[0.03]">
            <span className="text-[14px] font-semibold text-label">Affiner avec une adresse</span>
            <span className="text-[13px] text-muted">Vérifiez le bâtiment, les risques localisés, les contraintes réglementaires et l&apos;environnement immédiat.</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Insérer sur le hub**

Dans `src/app/(account)/rapport/page.tsx`, ajouter aux imports (après `import { normalizeUserProject } from "@/lib/user-project";`) :

```ts
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
```

Après `const userProject = normalizeUserProject(...)`, calculer le dossier (payant + commune connue + projet présent ; ouvert à tous les payants, pas de flag) :

```ts
  const dossier =
    fullReport && inseeCode && userProject
      ? await buildCommuneDossier(inseeCode, userProject)
      : null;
```

Puis, juste APRÈS le bloc `<div className="mt-12"><ProjectSummaryCard .../></div>` (lignes ~215-217) et AVANT `<div className="border-t border-white/[0.08] mt-14" />` :

```tsx
        {/* ── En une minute : le dossier de décision (payant, grain commune) ── */}
        {dossier ? <DossierDecisionSection dossier={dossier} /> : null}
```

- [ ] **Step 5: Typecheck + build**

`npx tsc --noEmit` → exit 0. `npm run build` → réussi.

- [ ] **Step 6: Vérification comportementale (skill verify)**

Piloter le hub avec un compte payant : la section « En une minute » apparaît entre la carte Projet et la grille ; la conclusion commence par « À l'échelle de la commune » (ou invite à décrire le projet si non structuré) ; les contraintes non couvertes sont nommées ; chaque fait porte une preuve avec sa valeur mesurée ; le CTA « Affiner avec une adresse » pointe vers `/rapport/logement`. Noter le résultat observé.

- [ ] **Step 7: Commit**

```bash
git add src/lib/decision/territory-facts.ts src/components/report/DossierDecisionSection.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "feat(decision): page « En une minute » sur le hub payant (grain commune)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Graver les arbitrages au vault

**Files:**
- Create: `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md`
- Create: `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md`
- Create: `docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md`

- [ ] **Step 1: Arbitrage n°1 (éliminatoire + couverture déclarée)**

Create `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md` :

```markdown
# « Éliminatoire » = incompatibilité avec une contrainte déclarée ; la couverture est déclarée

**Date** : 2026-07-11 · **Statut** : arbitré (porteur), branché slice 1.

Un point n'est « éliminatoire » que lorsqu'il contredit une contrainte non négociable que le lecteur
a lui-même déclarée. Le critère vient du lecteur ; futur•e constate la contradiction. Trois états,
jamais un verdict : incompatibilité établie / possible à vérifier / aucune incompatibilité établie
dans les données examinées.

Corollaire de couverture (v2) : « aucune incompatibilité » ne se dit QUE sur les contraintes
réellement examinées. Une contrainte déclarée qu'aucune règle ne sait encore évaluer est NOMMÉE comme
non couverte, jamais avalée en silence. Le moteur retourne des évaluations (satisfied / incompatible /
not_applicable / unknown…), pas seulement des faits, pour rendre la couverture observable.

Deux vides distincts : projet sans contrainte dure (`no_hard_constraint_declared`) n'est jamais
confondu avec données insuffisantes (`insufficient_evidence`) ni avec projet non structuré
(`project_not_structured`).

Implémentation : `src/lib/decision/materiality-rules.ts`, `src/lib/decision/decision-assembler.ts`,
`src/lib/decision/project-view.ts` (couverture). Spec :
`docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
```

- [ ] **Step 2: Arbitrage n°2 (déterministe / IA)**

Create `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md` :

```markdown
# Le déterministe sélectionne, l'IA formule (dossier de décision)

**Date** : 2026-07-11 · **Statut** : arbitré (porteur). Slice 1 = déterministe seul.

Le déterministe (registre de règles) décide : pertinence, section, condition de matérialité, preuve,
limite, action, état de conclusion. Le type impose la doctrine (union discriminée) et des invariants
runtime jettent en cas de violation.

L'IA (slice 2) formule seulement : elle reçoit des sections déjà résolues, peut fusionner, reformuler,
adapter à la posture, fluidifier. Elle ne peut jamais changer un rôle, inventer une incompatibilité,
masquer une inconnue, modifier un niveau de preuve, introduire une priorité absente, ni supprimer un
lien de preuve. La sortie déterministe reste le fallback permanent.

Registre, jamais un score : on ne calcule jamais importance × gravité × confiance. L'absence de donnée
reste `null` (jamais une valeur inventée), une erreur inattendue explose (jamais maquillée en « donnée
indisponible »). Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
```

- [ ] **Step 3: Arbitrage n°3 (un produit, sémantique par posture)**

Create `docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md` :

```markdown
# Un seul produit structurel, sémantique par posture

**Date** : 2026-07-11 · **Statut** : arbitré (porteur), branché slice 1.

Le dossier garde UNE structure canonique en cinq sections pour toutes les postures. Seuls les titres,
le verbe d'engagement et certaines phrases changent. `intent === "achat"` seul déclenche la logique
acquéreur : analyser une adresse n'est pas acheter.

- `recherche` / `adresse` / intent `achat` : « avant de vous engager ».
- `habitant` : « ce que ces données invitent à comprendre ou surveiller », jamais « avant de vous
  engager » ni « décider de rester » (le cas habitant peut seulement chercher à comprendre).
- `recherche_quartier` : réservée, retombe sur `recherche`.

Le moteur est identique ; la posture ne change que la couche de libellés et la formulation des faits.
Séparation éventuelle en deux produits : attend le test miroir du lancement (cf.
`docs/vault/arbitrages/moat-assemblage-largeur-en-tunnel.md`).
Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
```

- [ ] **Step 4: Commit**

```bash
git add docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md docs/vault/arbitrages/deterministe-selectionne-ia-formule.md docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md
git commit -m "vault(arbitrage): dossier de décision (éliminatoire+couverture, déterministe/IA, posture)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Vérification finale

- [ ] `npx tsc --noEmit` → exit 0.
- [ ] `node --test src/lib/decision/*.test.ts` → tout PASS.
- [ ] `npm run build` → réussi.
- [ ] Critère de réussite (spec §15) : sur trois `UserProject` réels contrastés (un `recherche` sans contrainte dure, un `achat` avec `nearSea`, un `habitant`) et trois communes réelles : dossiers visiblement différents ; aucun fait dans le mauvais rôle ; conclusion à périmètre communal ; contraintes non couvertes nommées ; sections plafonnées ; chaque phrase traçable à un `ruleId` et une preuve avec `observedValue` ; `assertFactValid` ne jette pas ; le cas creux reste digne.
