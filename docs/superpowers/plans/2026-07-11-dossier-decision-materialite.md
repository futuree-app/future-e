# Dossier de décision + registre de matérialité (slice 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser une page « En une minute » déterministe au-dessus des modules payants du hub `/rapport`, qui hiérarchise les faits Territoire selon cinq rôles décisionnels pour le projet déclaré de l'utilisateur.

**Architecture:** Un registre de règles pures (`materiality-rules.ts`) lit `(ModuleFacts × UserProject)` et émet des `DecisionFact` déjà résolus ; un assembleur pur (`decision-assembler.ts`) les range en cinq sections avec un état de conclusion à périmètre communal ; un adaptateur (`territory-facts.ts`) projette l'index commune en `ModuleFacts`. La page rend le résultat, elle ne calcule rien. Aucun appel LLM dans ce slice.

**Tech Stack:** TypeScript, Next.js App Router (server components), tests `node --test` (runner natif, comme `src/lib/logement-checklist.test.ts`).

## Global Constraints

Copiées verbatim de la spec `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`. Chaque tâche les respecte implicitement.

- **Registre, jamais un score.** On ne calcule JAMAIS `importance × gravité × confiance`. Chaque remontée est le produit d'une règle explicable.
- **Toute phrase de la page porte un `ruleId` et au moins une preuve** (`evidence[]` non vide). Invariant de test.
- **La conclusion du slice 1 est explicitement communale.** Jamais « ce lieu convient à votre projet ». Toujours « à l'échelle de la commune, … ».
- **Déterministe seulement.** Aucun LLM dans ce slice. Gabarits, pas de prose libre.
- **Deux vides distincts.** `no_hard_constraint_declared` (projet sans contrainte dure) n'est jamais confondu avec `insufficient_evidence` (données muettes bloquantes).
- **Discipline compromis.** Aucun `compromise` émis sans tension explicite entre deux dimensions déclarées, preuve de chaque côté. Une section peut rester vide.
- **Fait non matériel : aucun `DecisionFact`.** Il produit seulement une `DiagnosticEntry` interne (non rendue). Le fait reste visible dans le module Territoire.
- **Inconnues : `impact: 'blocking' | 'scoped'`.** L'absence d'adresse est toujours `scoped` (ne bloque jamais seule la conclusion).
- **Conventions projet.** Imports avec extension `.ts` explicite. Copie FR sans tiret cadratin (« , » ou « : » à la place), sans antithèse « X, pas Y » comme emphase. `PreferenceKey`, `UserProject`, `IndexCommune` sont les types existants.

**Commandes de vérification :**
- Typecheck : `npx tsc --noEmit`
- Un fichier de test : `node --test src/lib/decision/<fichier>.test.ts`

---

## File Structure

Neufs (tous sous `src/lib/decision/`, une responsabilité chacun) :
- `decision-fact.ts` : les types/contrats (`DecisionFact`, `DecisionRule`, `ModuleFacts`, `Dossier`, …). Aucune logique.
- `project-view.ts` : lecteurs purs au-dessus de `UserProject` (poids d'une préférence, limite mer, montagne dure, intention d'achat, présence d'une contrainte dure).
- `territory-facts.ts` : adaptateur INSEE → `ModuleFacts` (pur + async) et orchestrateur `buildCommuneDossier`.
- `materiality-rules.ts` : le registre (6 règles d'amorçage) + moteur `runRules`.
- `decision-assembler.ts` : `assembleDossier` (sections + état de conclusion, pur).
- `materiality-rules.test.ts`, `decision-assembler.test.ts`, `project-view.test.ts`, `territory-facts.test.ts`.

Composant :
- `src/components/report/DossierDecisionSection.tsx` : rendu déterministe, présentationnel.

Touchés :
- `src/lib/comparateur-vie.ts` : exporter `subScore` (accesseur lecture seule).
- `src/app/(account)/rapport/page.tsx` : insertion payant après `ProjectSummaryCard`.

Vault :
- `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md`
- `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md`
- `docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md`

---

## Task 1: Contrats + lecteurs de projet + export `subScore`

**Files:**
- Create: `src/lib/decision/decision-fact.ts`
- Create: `src/lib/decision/project-view.ts`
- Create: `src/lib/decision/project-view.test.ts`
- Modify: `src/lib/comparateur-vie.ts` (une ligne : `function subScore` → `export function subScore`)

**Interfaces:**
- Produces (types consommés par toutes les tâches suivantes) :
  - `DecisionModule`, `DecisionRole`, `EvidenceStrength`, `VerificationActionType`, `EvidenceRef`
  - `DecisionFact`, `ModuleFacts`, `DecisionRule`, `DiagnosticEntry`, `RunResult`
  - `ConclusionState`, `DossierSection`, `Dossier`
  - `project-view.ts` : `preferenceWeight(project, key): number`, `nearSeaLimitKm(project): number | null`, `wantsMountainHard(project): boolean`, `isPurchaseIntent(project): boolean`, `hasAnyHardConstraint(project): boolean`
  - `comparateur-vie.ts` : `subScore(key: PreferenceKey, c: IndexCommune): number | null` (désormais exporté)

- [ ] **Step 1: Créer le fichier de contrats**

Create `src/lib/decision/decision-fact.ts` :

```ts
// Contrats du dossier de décision (slice 1). Types PURS, aucune logique.
// Un DecisionFact est le RÉSULTAT d'une règle, jamais la doctrine : il est bête.
// cf. docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { ProjectPosture, UserProject } from "../user-project.ts";

export type DecisionModule = "territoire" | "logement";

export type DecisionRole =
  | "incompatibility" // contredit une contrainte non négociable déclarée
  | "compromise" // tension explicite entre deux dimensions du projet
  | "unknown" // une donnée déterminante manque
  | "verification" // à vérifier / surveiller avant de s'engager
  | "supporting_context"; // RÉSERVÉ : aucune règle du slice 1 ne l'émet, aucune section ne l'accueille

export type EvidenceStrength = "established" | "indicative" | "incomplete";

export type VerificationActionType =
  | "renseigner_adresse"
  | "verifier_sur_place"
  | "obtenir_document"
  | "demander_confirmation";

export type EvidenceRef = { module: DecisionModule; label: string; href?: string };

export type DecisionFact = {
  id: string;
  ruleId: string;
  sourceFactId: string;
  module: DecisionModule;
  role: DecisionRole;
  statement: string;
  evidence: EvidenceRef[];
  limitation?: string;
  evidenceStrength: EvidenceStrength;
  action?: { type: VerificationActionType; label: string };
  relatedProjectKeys: string[];
  // Rôle "unknown" seulement : la donnée manquante BLOQUE la conclusion, ou LIMITE
  // seulement une dimension / un grain. Propriété RÉSOLUE lue par l'assembleur.
  impact?: "blocking" | "scoped";
};

// Sac de faits normalisés, volontairement plat : les règles lisent des CHAMPS.
// Slice 1 = grain commune seulement. Slice 1.5 ajoutera un bloc `logement?`.
export type ModuleFacts = {
  insee: string;
  nom: string;
  distanceCoteKm: number;
  altitude: number | null;
  catnatInondation: number;
  scores: Partial<Record<PreferenceKey, number | null>>; // subScore par clé, 0-100, haut = satisfait
  hasAddress: boolean; // slice 1 : toujours false (le profil ne stocke pas d'adresse)
};

export type DecisionRule = {
  id: string;
  module: DecisionModule;
  sourceFacts: string[]; // documente la donnée lue (audit)
  appliesToPostures: ProjectPosture[]; // pré-filtre grossier ; active() est le vrai gate
  active: (facts: ModuleFacts, project: UserProject) => boolean;
  resolve: (facts: ModuleFacts, project: UserProject) => DecisionFact | DecisionFact[];
};

export type DiagnosticEntry = {
  ruleId: string;
  sourceFactId: string;
  decision: "emitted" | "skipped";
  reason: string;
};

export type RunResult = { facts: DecisionFact[]; diagnostics: DiagnosticEntry[] };

export type ConclusionState =
  | "established_incompatibility"
  | "compatible_with_reserves"
  | "no_incompatibility_with_compromise"
  | "no_hard_constraint_declared"
  | "insufficient_evidence";

export type DossierSection = {
  key: "incompatibilities" | "compromises" | "unknowns" | "verifications";
  title: string;
  facts: DecisionFact[];
};

export type Dossier = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  conclusion: string;
  sections: DossierSection[];
};
```

- [ ] **Step 2: Exporter `subScore`**

Modify `src/lib/comparateur-vie.ts` : trouver `function subScore(key: PreferenceKey, c: IndexCommune): number | null {` et ajouter `export ` devant.

```ts
export function subScore(key: PreferenceKey, c: IndexCommune): number | null {
```

- [ ] **Step 3: Écrire le test des lecteurs de projet (échoue)**

Create `src/lib/decision/project-view.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  preferenceWeight, nearSeaLimitKm, wantsMountainHard, isPurchaseIntent, hasAnyHardConstraint,
} from "./project-view.ts";
import type { UserProject } from "../user-project.ts";

function project(over: Partial<UserProject> & { parsed?: unknown } = {}): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: null, updatedAt: "1970-01-01T00:00:00.000Z",
    ...(over as UserProject),
  };
}

test("preferenceWeight : 0 si absent, poids sinon", () => {
  assert.equal(preferenceWeight(project(), "faible_chaleur"), 0);
  const p = project({ parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] } });
  assert.equal(preferenceWeight(p, "faible_chaleur"), 3);
});

test("nearSeaLimitKm : lit hardConstraints.nearSea", () => {
  assert.equal(nearSeaLimitKm(project()), null);
  const p = project({ parsed: { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] } });
  assert.equal(nearSeaLimitKm(p), 5);
});

test("wantsMountainHard : vrai si montagne strength hard", () => {
  const p = project({ parsed: { reformulation: "x", hardConstraints: { montagne: { strength: "hard" } }, preferences: [] } });
  assert.equal(wantsMountainHard(p), true);
  assert.equal(wantsMountainHard(project()), false);
});

test("isPurchaseIntent : posture adresse OU intent achat", () => {
  assert.equal(isPurchaseIntent(project({ intent: "achat" })), true);
  assert.equal(isPurchaseIntent(project({ posture: "adresse" })), true);
  assert.equal(isPurchaseIntent(project()), false);
});

test("hasAnyHardConstraint : vrai dès une contrainte dure", () => {
  assert.equal(hasAnyHardConstraint(project()), false);
  const p = project({ parsed: { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] } });
  assert.equal(hasAnyHardConstraint(p), true);
});
```

- [ ] **Step 4: Lancer le test, vérifier l'échec**

Run: `node --test src/lib/decision/project-view.test.ts`
Expected: FAIL (`Cannot find module './project-view.ts'`).

- [ ] **Step 5: Écrire les lecteurs**

Create `src/lib/decision/project-view.ts` :

```ts
// Lecteurs PURS au-dessus de UserProject. Les règles ne fouillent jamais parsed
// à la main : elles passent par ici. `parsed` peut être null (rawText seul).
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";

export function preferenceWeight(project: UserProject, key: PreferenceKey): number {
  const p = project.parsed?.preferences?.find((x) => x.key === key);
  return p ? p.weight : 0;
}

export function nearSeaLimitKm(project: UserProject): number | null {
  const ns = project.parsed?.hardConstraints?.nearSea;
  if (ns?.active && typeof ns.maxKm === "number") return ns.maxKm;
  return null;
}

export function wantsMountainHard(project: UserProject): boolean {
  return project.parsed?.hardConstraints?.montagne?.strength === "hard";
}

export function isPurchaseIntent(project: UserProject): boolean {
  return project.posture === "adresse" || project.intent === "achat";
}

export function hasAnyHardConstraint(project: UserProject): boolean {
  const hc = project.parsed?.hardConstraints;
  if (!hc) return false;
  return Boolean(
    hc.departements?.length ||
      hc.zones?.some((z) => z.strength === "hard") ||
      hc.excludeZones?.length ||
      hc.montagne?.strength === "hard" ||
      hc.reliefProche?.strength === "hard" ||
      hc.nearSea?.active ||
      hc.excludeSea ||
      hc.nearPlace ||
      hc.communeSize ||
      hc.excludePlace?.length ||
      hc.sizeRelativeTo,
  );
}
```

- [ ] **Step 6: Lancer le test, vérifier le succès**

Run: `node --test src/lib/decision/project-view.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (aucune erreur).

- [ ] **Step 8: Commit**

```bash
git add src/lib/decision/decision-fact.ts src/lib/decision/project-view.ts src/lib/decision/project-view.test.ts src/lib/comparateur-vie.ts
git commit -m "feat(decision): contrats du dossier + lecteurs de projet + export subScore

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Adaptateur `ModuleFacts` (INSEE → faits normalisés)

**Files:**
- Create: `src/lib/decision/territory-facts.ts`
- Create: `src/lib/decision/territory-facts.test.ts`

**Interfaces:**
- Consumes: `ModuleFacts` (Task 1) ; `getCommuneEntry`, `subScore`, `PREFERENCE_KEYS`, `IndexCommune` (de `comparateur-vie.ts`).
- Produces:
  - `buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts` (pur)
  - `loadModuleFacts(insee: string, opts: { hasAddress: boolean }): Promise<ModuleFacts | null>` (async)
  - `buildCommuneDossier` sera ajouté en Task 7 dans ce même fichier.

- [ ] **Step 1: Écrire le test de l'adaptateur pur (échoue)**

Create `src/lib/decision/territory-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildModuleFacts } from "./territory-facts.ts";
import type { IndexCommune } from "../comparateur-vie.ts";

// Entrée minimale : subScore retombe sur null pour les champs absents (il garde).
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return {
    insee: "17300", nom: "Fouras", dept: "17", region: "NA", lat: 46, lon: -1,
    population: 4000, densite: 500, distance_cote_km: 0.5, altitude: 8,
    clim: {}, pct: {}, ...(over as IndexCommune),
  };
}

test("buildModuleFacts : passe-plats + hasAddress + scores en Record", () => {
  const f = buildModuleFacts(entry({ distance_cote_km: 42, altitude: 120, inondation: { catnat: 5, tri: false, risque: 30 } }), { hasAddress: false });
  assert.equal(f.insee, "17300");
  assert.equal(f.distanceCoteKm, 42);
  assert.equal(f.altitude, 120);
  assert.equal(f.catnatInondation, 5);
  assert.equal(f.hasAddress, false);
  assert.equal(typeof f.scores, "object");
});

test("buildModuleFacts : catnat par défaut 0 si inondation absente", () => {
  const f = buildModuleFacts(entry(), { hasAddress: true });
  assert.equal(f.catnatInondation, 0);
  assert.equal(f.hasAddress, true);
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `node --test src/lib/decision/territory-facts.test.ts`
Expected: FAIL (`Cannot find module './territory-facts.ts'`).

- [ ] **Step 3: Écrire l'adaptateur**

Create `src/lib/decision/territory-facts.ts` :

```ts
// Adaptateur : projette une commune de l'index (grain commune) en ModuleFacts.
// SEUL point qui touche la donnée Territoire. Les règles ne connaissent que
// ModuleFacts. subScore(key, entry) donne la satisfaction 0-100 par préférence.
import { getCommuneEntry, subScore, PREFERENCE_KEYS, type IndexCommune } from "../comparateur-vie.ts";
import type { ModuleFacts } from "./decision-fact.ts";

export function buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) {
    // Défensif : subScore garde déjà les sous-objets optionnels, mais une donnée
    // creuse ne doit jamais casser le hub. Score indisponible = null (honnête).
    try {
      scores[key] = subScore(key, entry);
    } catch {
      scores[key] = null;
    }
  }
  return {
    insee: entry.insee,
    nom: entry.nom,
    distanceCoteKm: entry.distance_cote_km,
    altitude: entry.altitude ?? null,
    catnatInondation: entry.inondation?.catnat ?? 0,
    scores,
    hasAddress: opts.hasAddress,
  };
}

export async function loadModuleFacts(
  insee: string,
  opts: { hasAddress: boolean },
): Promise<ModuleFacts | null> {
  const entry = await getCommuneEntry(insee);
  if (!entry) return null; // PLM et communes hors index : repli null assumé
  return buildModuleFacts(entry, opts);
}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `node --test src/lib/decision/territory-facts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (exit 0), puis :

```bash
git add src/lib/decision/territory-facts.ts src/lib/decision/territory-facts.test.ts
git commit -m "feat(decision): adaptateur index commune -> ModuleFacts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Moteur `runRules` + règles 1 & 2 (incompatibilités)

**Files:**
- Create: `src/lib/decision/materiality-rules.ts`
- Create: `src/lib/decision/materiality-rules.test.ts`

**Interfaces:**
- Consumes: `DecisionRule`, `DecisionFact`, `ModuleFacts`, `RunResult`, `DiagnosticEntry` (Task 1) ; `project-view.ts` (Task 1).
- Produces:
  - `REGISTRY: DecisionRule[]`
  - `runRules(facts: ModuleFacts, project: UserProject): RunResult`
  - Règles `territoire.mer-hors-seuil`, `territoire.altitude-limite`.

- [ ] **Step 1: Écrire les tests des règles 1 & 2 (échoue)**

Create `src/lib/decision/materiality-rules.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return { insee: "00000", nom: "Test", distanceCoteKm: 1, altitude: 100, catnatInondation: 0, scores: {}, hasAddress: false, ...over };
}
function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}

test("règle 1 mer : incompatibilité établie au-delà du seuil", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.mer-hors-seuil");
  assert.ok(f, "un fait mer attendu");
  assert.equal(f!.role, "incompatibility");
  assert.equal(f!.evidenceStrength, "established");
  assert.ok(f!.evidence.length >= 1);
  assert.match(f!.statement, /42 km/);
});

test("règle 1 mer : rien si sous le seuil", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 2 }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.mer-hors-seuil"), false);
});

test("règle 2 altitude : incompatibilité indicative en bande grise", () => {
  const p = project({ reformulation: "x", hardConstraints: { montagne: { strength: "hard" } }, preferences: [] });
  const r = runRules(facts({ altitude: 500 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.altitude-limite");
  assert.ok(f, "un fait altitude attendu");
  assert.equal(f!.evidenceStrength, "indicative");
  assert.ok(f!.limitation);
});

test("règle 2 altitude : rien au-dessus du seuil (600 m)", () => {
  const p = project({ reformulation: "x", hardConstraints: { montagne: { strength: "hard" } }, preferences: [] });
  const r = runRules(facts({ altitude: 800 }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.altitude-limite"), false);
});

test("chaque fait émis porte un ruleId et une preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  for (const f of r.facts) {
    assert.ok(f.ruleId.length > 0);
    assert.ok(f.evidence.length >= 1);
  }
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: FAIL (`Cannot find module './materiality-rules.ts'`).

- [ ] **Step 3: Écrire le moteur + règles 1 & 2**

Create `src/lib/decision/materiality-rules.ts` :

```ts
// Registre de matérialité. Chaque règle porte la DOCTRINE projet-relative et émet
// un DecisionFact déjà résolu. Généralise src/lib/logement-checklist.ts (active()
// = éligibilité, resolve() émet désormais cinq rôles). PAS de score caché.
import type { DecisionRule, DecisionFact, ModuleFacts, RunResult, DiagnosticEntry } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { nearSeaLimitKm, wantsMountainHard } from "./project-view.ts";

const territoire = (nom: string) => ({ module: "territoire" as const, label: `Territoire · ${nom}`, href: "/rapport/quartier" });

// Règle 1 : mer hors seuil (incompatibilité établie).
const ruleMerHorsSeuil: DecisionRule = {
  id: "territoire.mer-hors-seuil",
  module: "territoire",
  sourceFacts: ["distance_cote_km", "hardConstraints.nearSea"],
  appliesToPostures: ["recherche", "adresse", "habitant", "recherche_quartier"],
  active: (f, p) => {
    const max = nearSeaLimitKm(p);
    return max != null && f.distanceCoteKm > max;
  },
  resolve: (f, p) => ({
    id: `${f.insee}:mer-hors-seuil`,
    ruleId: "territoire.mer-hors-seuil",
    sourceFactId: "distance_cote_km",
    module: "territoire",
    role: "incompatibility",
    evidenceStrength: "established",
    statement: `Cette commune est à ${Math.round(f.distanceCoteKm)} km du littoral, au-delà de la limite de ${nearSeaLimitKm(p)} km que vous avez posée.`,
    evidence: [territoire(f.nom)],
    relatedProjectKeys: ["nearSea"],
  }),
};

// Règle 2 : altitude en bande grise (incompatibilité indicative, à confirmer).
const ruleAltitudeLimite: DecisionRule = {
  id: "territoire.altitude-limite",
  module: "territoire",
  sourceFacts: ["altitude", "hardConstraints.montagne"],
  appliesToPostures: ["recherche", "adresse", "habitant", "recherche_quartier"],
  active: (f, p) => wantsMountainHard(p) && f.altitude != null && f.altitude >= 450 && f.altitude < 600,
  resolve: (f) => ({
    id: `${f.insee}:altitude-limite`,
    ruleId: "territoire.altitude-limite",
    sourceFactId: "altitude",
    module: "territoire",
    role: "incompatibility",
    evidenceStrength: "indicative",
    statement: `L'altitude ici (${Math.round(f.altitude!)} m) approche votre seuil de montagne sans l'atteindre.`,
    limitation: "À confirmer sur le terrain : le relief perçu dépend aussi de l'environnement immédiat.",
    evidence: [territoire(f.nom)],
    relatedProjectKeys: ["montagne"],
  }),
};

export const REGISTRY: DecisionRule[] = [ruleMerHorsSeuil, ruleAltitudeLimite];

export function runRules(facts: ModuleFacts, project: UserProject): RunResult {
  const outFacts: DecisionFact[] = [];
  const diagnostics: DiagnosticEntry[] = [];
  for (const rule of REGISTRY) {
    if (!rule.appliesToPostures.includes(project.posture)) {
      diagnostics.push({ ruleId: rule.id, sourceFactId: rule.sourceFacts[0] ?? "", decision: "skipped", reason: "posture hors périmètre" });
      continue;
    }
    if (!rule.active(facts, project)) {
      diagnostics.push({ ruleId: rule.id, sourceFactId: rule.sourceFacts[0] ?? "", decision: "skipped", reason: "règle inactive" });
      continue;
    }
    const emitted = rule.resolve(facts, project);
    for (const fct of Array.isArray(emitted) ? emitted : [emitted]) {
      outFacts.push(fct);
      diagnostics.push({ ruleId: rule.id, sourceFactId: fct.sourceFactId, decision: "emitted", reason: `rôle ${fct.role}` });
    }
  }
  return { facts: outFacts, diagnostics };
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (exit 0), puis :

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(decision): moteur runRules + règles mer et altitude

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Règles 3, 4, 5 (compromis, inconnue scopée, vérification)

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts` (ajouter 3 règles au `REGISTRY`)
- Modify: `src/lib/decision/materiality-rules.test.ts` (ajouter les tests)

**Interfaces:**
- Consumes: tout de Task 3 ; `preferenceWeight`, `isPurchaseIntent` (Task 1).
- Produces: règles `territoire.compromis-transport-chaleur`, `territoire.logement-sans-adresse`, `territoire.risque-a-verifier` dans `REGISTRY`.

- [ ] **Step 1: Ajouter les tests (échoue)**

Append à `src/lib/decision/materiality-rules.test.ts` :

```ts
test("règle 3 compromis : émis si transports satisfait ET chaleur mal satisfaite, deux prefs déclarées", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }, { key: "faible_chaleur", weight: 2 }] });
  const r = runRules(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.compromis-transport-chaleur");
  assert.ok(f, "un compromis attendu");
  assert.equal(f!.role, "compromise");
  assert.deepEqual([...f!.relatedProjectKeys].sort(), ["acces_transports", "faible_chaleur"]);
});

test("règle 3 compromis : rien si une seule dimension déclarée", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }] });
  const r = runRules(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.compromis-transport-chaleur"), false);
});

test("règle 4 inconnue : scopée si achat sans adresse et confort d'été déclaré", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] }, { intent: "achat" });
  const r = runRules(facts({ hasAddress: false }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.logement-sans-adresse");
  assert.ok(f, "une inconnue attendue");
  assert.equal(f!.role, "unknown");
  assert.equal(f!.impact, "scoped");
  assert.equal(f!.action?.type, "renseigner_adresse");
});

test("règle 4 inconnue : rien si une adresse est présente", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] }, { intent: "achat" });
  const r = runRules(facts({ hasAddress: true }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.logement-sans-adresse"), false);
});

test("règle 5 vérification : émise si inondation déclarée et CatNat notable", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.risque-a-verifier");
  assert.ok(f, "une vérification attendue");
  assert.equal(f!.role, "verification");
  assert.match(f!.statement, /6 arrêtés/);
});

test("règle 5 vérification : rien sous le seuil de notabilité (< 3)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ catnatInondation: 1 }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.risque-a-verifier"), false);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: FAIL (les nouveaux tests échouent, `undefined` retournés).

- [ ] **Step 3: Ajouter les 3 règles**

Dans `src/lib/decision/materiality-rules.ts`, ajouter l'import et les règles, puis les mettre dans `REGISTRY`.

Modifier la ligne d'import de `project-view.ts` :

```ts
import { nearSeaLimitKm, wantsMountainHard, preferenceWeight, isPurchaseIntent } from "./project-view.ts";
```

Ajouter avant `export const REGISTRY` :

```ts
// Règle 3 : compromis transport × chaleur. Discipline : deux dimensions DÉCLARÉES
// (poids >= 2) en tension réelle, preuve de chaque côté. Amorçage : une seule paire.
const ruleCompromisTransportChaleur: DecisionRule = {
  id: "territoire.compromis-transport-chaleur",
  module: "territoire",
  sourceFacts: ["scores.acces_transports", "scores.faible_chaleur"],
  appliesToPostures: ["recherche", "adresse", "habitant", "recherche_quartier"],
  active: (f, p) => {
    if (preferenceWeight(p, "acces_transports") < 2 || preferenceWeight(p, "faible_chaleur") < 2) return false;
    const t = f.scores.acces_transports;
    const c = f.scores.faible_chaleur;
    return t != null && c != null && t >= 60 && c <= 40;
  },
  resolve: (f) => ({
    id: `${f.insee}:compromis-transport-chaleur`,
    ruleId: "territoire.compromis-transport-chaleur",
    sourceFactId: "scores.acces_transports+scores.faible_chaleur",
    module: "territoire",
    role: "compromise",
    evidenceStrength: "established",
    statement: "Meilleure accessibilité quotidienne par le train, mais exposition estivale à la chaleur plus marquée.",
    evidence: [territoire(f.nom)],
    relatedProjectKeys: ["acces_transports", "faible_chaleur"],
  }),
};

// Règle 4 : confort d'été non évaluable sans adresse. Inconnue SCOPÉE (ne bloque
// jamais la conclusion). hasAddress est toujours false en slice 1.
const ruleLogementSansAdresse: DecisionRule = {
  id: "territoire.logement-sans-adresse",
  module: "territoire",
  sourceFacts: ["hasAddress", "scores.faible_chaleur"],
  appliesToPostures: ["recherche", "adresse", "habitant", "recherche_quartier"],
  active: (f, p) => isPurchaseIntent(p) && !f.hasAddress && preferenceWeight(p, "faible_chaleur") >= 2,
  resolve: (f) => ({
    id: `${f.insee}:logement-sans-adresse`,
    ruleId: "territoire.logement-sans-adresse",
    sourceFactId: "hasAddress",
    module: "territoire",
    role: "unknown",
    impact: "scoped",
    evidenceStrength: "incomplete",
    statement: "Votre priorité de confort d'été ne peut pas être évaluée au grain du bâtiment tant qu'aucune adresse n'est renseignée.",
    evidence: [territoire(f.nom)],
    action: { type: "renseigner_adresse", label: "Affiner avec une adresse" },
    relatedProjectKeys: ["faible_chaleur"],
  }),
};

// Règle 5 : historique CatNat inondation notable + priorité risque déclarée -> vérification.
const ruleRisqueAVerifier: DecisionRule = {
  id: "territoire.risque-a-verifier",
  module: "territoire",
  sourceFacts: ["inondation.catnat", "preferences.faible_risque_inondation"],
  appliesToPostures: ["recherche", "adresse", "habitant", "recherche_quartier"],
  active: (f, p) => preferenceWeight(p, "faible_risque_inondation") >= 2 && f.catnatInondation >= 3,
  resolve: (f) => ({
    id: `${f.insee}:risque-a-verifier`,
    ruleId: "territoire.risque-a-verifier",
    sourceFactId: "inondation.catnat",
    module: "territoire",
    role: "verification",
    evidenceStrength: "established",
    statement: `La commune a connu ${f.catnatInondation} arrêtés de catastrophe naturelle inondation. Demandez l'état des risques (ERRIAL) avant de vous engager.`,
    evidence: [territoire(f.nom)],
    action: { type: "obtenir_document", label: "État des risques (ERRIAL)" },
    relatedProjectKeys: ["faible_risque_inondation"],
  }),
};
```

Remplacer la ligne `REGISTRY` par :

```ts
export const REGISTRY: DecisionRule[] = [
  ruleMerHorsSeuil,
  ruleAltitudeLimite,
  ruleCompromisTransportChaleur,
  ruleLogementSansAdresse,
  ruleRisqueAVerifier,
];
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (exit 0), puis :

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(decision): règles compromis, inconnue scopée, vérification

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Règle 6 (fait non matériel) — sonde diagnostique, aucun fait

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts` (ajouter `nonMaterialProbe`, l'appeler dans `runRules`)
- Modify: `src/lib/decision/materiality-rules.test.ts`

**Interfaces:**
- Consumes: tout de Task 4.
- Produces: le comportement « attribut notable non déclaré → `DiagnosticEntry` skipped, AUCUN `DecisionFact` ».

- [ ] **Step 1: Ajouter les tests (échoue)**

Append à `src/lib/decision/materiality-rules.test.ts` :

```ts
test("règle 6 non matériel : nature notable non déclarée -> aucun fait, un diagnostic", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] });
  const r = runRules(facts({ scores: { nature: 85 } }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.non-materiel"), false, "aucun DecisionFact non matériel");
  const d = r.diagnostics.find((x) => x.ruleId === "territoire.non-materiel");
  assert.ok(d, "un diagnostic attendu");
  assert.equal(d!.decision, "skipped");
});

test("règle 6 non matériel : rien si la dimension notable est déclarée", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "nature", weight: 3 }] });
  const r = runRules(facts({ scores: { nature: 85 } }), p);
  assert.equal(r.diagnostics.some((x) => x.ruleId === "territoire.non-materiel"), false);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: FAIL (le diagnostic non-materiel n'existe pas encore).

- [ ] **Step 3: Ajouter la sonde**

Dans `src/lib/decision/materiality-rules.ts`, ajouter `preferenceWeight` est déjà importé (Task 4). Ajouter `PreferenceKey` à l'import de types en haut :

```ts
import type { PreferenceKey } from "../comparateur-vie.ts";
```

Ajouter avant `export function runRules` :

```ts
// Sonde du non-matériel : un attribut qui score fort sur une dimension NON déclarée
// ne produit AUCUN DecisionFact (il reste visible dans le module Territoire). On en
// garde seulement une trace de diagnostic, pour prouver par test qu'il a été vu et écarté.
const NOTABLE_UNDECLARED_PROBE: PreferenceKey[] = ["nature"];

function nonMaterialProbe(facts: ModuleFacts, project: UserProject): DiagnosticEntry[] {
  const out: DiagnosticEntry[] = [];
  for (const key of NOTABLE_UNDECLARED_PROBE) {
    const score = facts.scores[key];
    if (score != null && score >= 70 && preferenceWeight(project, key) === 0) {
      out.push({
        ruleId: "territoire.non-materiel",
        sourceFactId: `scores.${key}`,
        decision: "skipped",
        reason: `dimension notable (${score}) non déclarée dans le projet`,
      });
    }
  }
  return out;
}
```

Dans `runRules`, juste avant `return { facts: outFacts, diagnostics };`, ajouter :

```ts
  diagnostics.push(...nonMaterialProbe(facts, project));
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (exit 0), puis :

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(decision): sonde du non-matériel (diagnostic, aucun fait rendu)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Assembleur (états de conclusion + sections)

**Files:**
- Create: `src/lib/decision/decision-assembler.ts`
- Create: `src/lib/decision/decision-assembler.test.ts`

**Interfaces:**
- Consumes: `DecisionFact`, `Dossier`, `DossierSection`, `ConclusionState` (Task 1) ; `hasAnyHardConstraint` (Task 1).
- Produces: `assembleDossier(facts: DecisionFact[], project: UserProject, scope: "commune" | "commune+adresse"): Dossier`.

- [ ] **Step 1: Écrire les tests de l'assembleur (échoue)**

Create `src/lib/decision/decision-assembler.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import type { DecisionFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
function fact(over: Partial<DecisionFact>): DecisionFact {
  return {
    id: "f", ruleId: "r", sourceFactId: "s", module: "territoire", role: "verification",
    statement: "…", evidence: [{ module: "territoire", label: "T" }], evidenceStrength: "established",
    relatedProjectKeys: [], ...over,
  };
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };
const NO_HC = { reformulation: "x", hardConstraints: {}, preferences: [] };

test("incompatibilité établie -> état established_incompatibility, conclusion communale", () => {
  const d = assembleDossier([fact({ role: "incompatibility", evidenceStrength: "established", statement: "trop loin de la mer" })], project(WITH_HC), "commune");
  assert.equal(d.conclusionState, "established_incompatibility");
  assert.match(d.conclusion, /à l'échelle de la commune/i);
});

test("inconnue scopée ne bascule PAS en insufficient_evidence", () => {
  const d = assembleDossier([fact({ role: "unknown", impact: "scoped", evidenceStrength: "incomplete" })], project(WITH_HC), "commune");
  assert.equal(d.conclusionState, "compatible_with_reserves");
});

test("inconnue bloquante -> insufficient_evidence", () => {
  const d = assembleDossier([fact({ role: "unknown", impact: "blocking", evidenceStrength: "incomplete" })], project(WITH_HC), "commune");
  assert.equal(d.conclusionState, "insufficient_evidence");
});

test("les deux vides sont distincts : no_hard_constraint_declared vs clean", () => {
  const sansHC = assembleDossier([fact({ role: "compromise" })], project(NO_HC), "commune");
  assert.equal(sansHC.conclusionState, "no_hard_constraint_declared");
  const avecHCclean = assembleDossier([], project(WITH_HC), "commune");
  assert.equal(avecHCclean.conclusionState, "compatible_with_reserves");
});

test("compromis seul (avec contrainte dure, sans réserve) -> no_incompatibility_with_compromise", () => {
  const d = assembleDossier([fact({ role: "compromise" })], project(WITH_HC), "commune");
  assert.equal(d.conclusionState, "no_incompatibility_with_compromise");
});

test("sections : un fait par rôle range dans la bonne section, vides omises", () => {
  const d = assembleDossier([
    fact({ role: "incompatibility", evidenceStrength: "indicative" }),
    fact({ role: "verification" }),
  ], project(WITH_HC), "commune");
  const keys = d.sections.map((s) => s.key);
  assert.deepEqual(keys, ["incompatibilities", "verifications"]);
});

test("titre section vérifications adapté à la posture habitant", () => {
  const d = assembleDossier([fact({ role: "verification" })], project(NO_HC, { posture: "habitant" }), "commune");
  const s = d.sections.find((x) => x.key === "verifications");
  assert.match(s!.title, /surveiller/i);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/decision-assembler.test.ts`
Expected: FAIL (`Cannot find module './decision-assembler.ts'`).

- [ ] **Step 3: Écrire l'assembleur**

Create `src/lib/decision/decision-assembler.ts` :

```ts
// Assembleur PUR : range les DecisionFact en cinq sections et calcule l'état de
// conclusion à périmètre COMMUNAL. Aucun LLM. Deux vides distincts (§7.3 spec).
import type { DecisionFact, Dossier, DossierSection, ConclusionState } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { hasAnyHardConstraint } from "./project-view.ts";

type PostureLabels = { engage: string; verifTitle: string };

function labels(project: UserProject): PostureLabels {
  if (project.posture === "habitant") {
    return { engage: "décider de rester ou d'adapter", verifTitle: "Ce qu'il reste utile de vérifier ou de surveiller" };
  }
  return { engage: "vous engager", verifTitle: "À vérifier avant de vous engager" };
}

const STRENGTH_RANK: Record<DecisionFact["evidenceStrength"], number> = { established: 0, indicative: 1, incomplete: 2 };

function byRole(facts: DecisionFact[], role: DecisionFact["role"]): DecisionFact[] {
  return facts
    .filter((f) => f.role === role)
    .sort((a, b) => STRENGTH_RANK[a.evidenceStrength] - STRENGTH_RANK[b.evidenceStrength]);
}

function conclusionState(facts: DecisionFact[], project: UserProject): ConclusionState {
  const established = facts.some((f) => f.role === "incompatibility" && f.evidenceStrength === "established");
  const blocking = facts.some((f) => f.role === "unknown" && f.impact === "blocking");
  const reserves = facts.some(
    (f) =>
      (f.role === "incompatibility" && f.evidenceStrength !== "established") ||
      (f.role === "unknown" && f.impact === "scoped") ||
      f.role === "verification",
  );
  const compromise = facts.some((f) => f.role === "compromise");

  if (established) return "established_incompatibility";
  if (blocking) return "insufficient_evidence";
  if (!hasAnyHardConstraint(project)) return "no_hard_constraint_declared";
  if (reserves) return "compatible_with_reserves";
  if (compromise) return "no_incompatibility_with_compromise";
  return "compatible_with_reserves"; // contraintes dures déclarées, rien de contredit ni signalé
}

function conclusionText(state: ConclusionState, facts: DecisionFact[], project: UserProject): string {
  const l = labels(project);
  const scope = "À l'échelle de la commune,";
  switch (state) {
    case "established_incompatibility": {
      const f = facts.find((x) => x.role === "incompatibility" && x.evidenceStrength === "established");
      return `${scope} une contrainte que vous avez déclarée n'est pas respectée ici : ${f?.statement ?? ""}`;
    }
    case "insufficient_evidence":
      return `${scope} nous ne pouvons pas conclure honnêtement : une donnée déterminante pour votre projet manque ou reste insuffisante.`;
    case "no_hard_constraint_declared":
      return `Vous n'avez déclaré aucune contrainte non négociable. ${scope} les données examinées ne permettent donc pas d'identifier de point éliminatoire pour votre projet.`;
    case "no_incompatibility_with_compromise": {
      const f = facts.find((x) => x.role === "compromise");
      return `${scope} aucune incompatibilité avec vos contraintes déclarées n'est établie. Votre décision se joue surtout sur un compromis : ${f?.statement ?? ""}`;
    }
    case "compatible_with_reserves": {
      const reserves = facts.filter(
        (x) =>
          (x.role === "incompatibility" && x.evidenceStrength !== "established") ||
          (x.role === "unknown" && x.impact === "scoped") ||
          x.role === "verification",
      );
      if (reserves.length === 0) {
        return `${scope} aucune incompatibilité avec vos contraintes déclarées n'est établie dans les données examinées.`;
      }
      return `${scope} aucune incompatibilité établie avec vos contraintes déclarées. ${reserves.length} point(s) restent à examiner avant de ${l.engage}.`;
    }
  }
}

export function assembleDossier(
  facts: DecisionFact[],
  project: UserProject,
  scope: "commune" | "commune+adresse",
): Dossier {
  const l = labels(project);
  const state = conclusionState(facts, project);
  const candidates: DossierSection[] = [
    { key: "incompatibilities", title: "Vos contraintes non négociables", facts: byRole(facts, "incompatibility") },
    { key: "compromises", title: "Ce qui départage vraiment", facts: byRole(facts, "compromise") },
    { key: "unknowns", title: "Ce que nous ne savons pas encore", facts: byRole(facts, "unknown") },
    { key: "verifications", title: l.verifTitle, facts: byRole(facts, "verification") },
  ];
  return {
    scope,
    conclusionState: state,
    conclusion: conclusionText(state, facts, project),
    sections: candidates.filter((s) => s.facts.length > 0),
  };
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `node --test src/lib/decision/decision-assembler.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` (exit 0), puis :

```bash
git add src/lib/decision/decision-assembler.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(decision): assembleur (états de conclusion communaux + sections)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Orchestrateur + composant + insertion sur le hub

**Files:**
- Modify: `src/lib/decision/territory-facts.ts` (ajouter `buildCommuneDossier`)
- Create: `src/components/report/DossierDecisionSection.tsx`
- Modify: `src/app/(account)/rapport/page.tsx`

**Interfaces:**
- Consumes: `loadModuleFacts` (Task 2), `runRules` (Task 5), `assembleDossier` (Task 6), `normalizeUserProject`/`UserProject` (existants).
- Produces:
  - `buildCommuneDossier(insee: string, project: UserProject): Promise<Dossier | null>`
  - `<DossierDecisionSection dossier={Dossier} />` (composant serveur présentationnel)

**Note Next.js :** `/rapport/page.tsx` est déjà un `async function` server component ; on suit ce patron. Le composant est présentationnel (aucun `"use client"`, aucun état). Avant d'écrire, si un doute sur une API App Router, vérifier `node_modules/next/dist/docs/` (cf. AGENTS.md).

- [ ] **Step 1: Ajouter l'orchestrateur**

Dans `src/lib/decision/territory-facts.ts`, ajouter les imports et la fonction :

```ts
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import type { Dossier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
```

Ajouter en fin de fichier :

```ts
// Orchestrateur du hub : commune (grain commune) -> ModuleFacts -> règles -> assemblage.
// Slice 1 : hasAddress toujours false (le profil ne stocke pas d'adresse), scope "commune".
export async function buildCommuneDossier(insee: string, project: UserProject): Promise<Dossier | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: false });
  if (!facts) return null;
  const { facts: decisionFacts } = runRules(facts, project);
  return assembleDossier(decisionFacts, project, "commune");
}
```

- [ ] **Step 2: Typecheck l'orchestrateur**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Écrire le composant présentationnel**

Create `src/components/report/DossierDecisionSection.tsx` :

```tsx
// Rendu déterministe du dossier de décision (« En une minute »). Présentationnel :
// reçoit un Dossier déjà assemblé, n'appelle aucun service. Pas de LLM.
import Link from "next/link";
import type { Dossier } from "@/lib/decision/decision-fact";

const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--red)",
  compromises: "var(--orange)",
  unknowns: "var(--violet)",
  verifications: "var(--blue)",
};

export function DossierDecisionSection({ dossier }: { dossier: Dossier }) {
  return (
    <section className="mt-12" id="dossier-decision">
      <div className="mb-6 max-w-[640px]">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">En une minute</p>
        <h2
          className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Ce lieu, au regard de votre projet.
        </h2>
      </div>

      {/* Conclusion conditionnelle, périmètre communal */}
      <div className="glass rounded-2xl p-7 mb-4">
        <p className="text-[17px] leading-[1.7] text-label">{dossier.conclusion}</p>
      </div>

      {/* Les sections non vides */}
      <div className="flex flex-col gap-3.5">
        {dossier.sections.map((s) => {
          const col = SECTION_ACCENT[s.key] ?? "var(--violet)";
          return (
            <div key={s.key} className="glass rounded-xl p-6" style={{ borderLeft: `2px solid ${col}` }}>
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase mb-3.5" style={{ color: col }}>
                {s.title}
              </p>
              <ul className="flex flex-col gap-4">
                {s.facts.map((f) => (
                  <li key={f.id} className="text-[14px] leading-[1.65]">
                    <p className="text-label">{f.statement}</p>
                    {f.limitation ? <p className="text-muted text-[13px] mt-1">{f.limitation}</p> : null}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {f.evidence.map((e, i) =>
                        e.href ? (
                          <Link
                            key={i}
                            href={e.href}
                            className="font-mono text-[10px] tracking-[0.06em] uppercase no-underline"
                            style={{ color: col }}
                          >
                            Voir la preuve · {e.label}
                          </Link>
                        ) : (
                          <span key={i} className="font-mono text-[10px] tracking-[0.06em] uppercase text-ghost">
                            {e.label}
                          </span>
                        ),
                      )}
                      {f.action ? (
                        <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{f.action.label}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* CTA décisionnel vers le grain adresse (amorce du slice 1.5) */}
      <div className="mt-5">
        <Link
          href="/rapport/logement"
          className="inline-flex flex-col gap-1 px-6 py-4 rounded-xl no-underline border border-white/[0.1] bg-white/[0.03]"
        >
          <span className="text-[14px] font-semibold text-label">Affiner avec une adresse</span>
          <span className="text-[13px] text-muted">
            Vérifiez le bâtiment, les risques localisés, les contraintes réglementaires et l&apos;environnement immédiat.
          </span>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Insérer sur le hub**

Dans `src/app/(account)/rapport/page.tsx` :

Ajouter aux imports (après la ligne `import { normalizeUserProject } from "@/lib/user-project";`) :

```ts
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
```

Après la résolution de `userProject` (ligne `const userProject = normalizeUserProject(...)`), ajouter le calcul du dossier (payant + commune connue + projet présent) :

```ts
  const dossier =
    fullReport && inseeCode && userProject
      ? await buildCommuneDossier(inseeCode, userProject)
      : null;
```

Puis, dans le JSX, juste APRÈS le bloc `ProjectSummaryCard` (le `<div className="mt-12"><ProjectSummaryCard .../></div>`, lignes ~215-217) et AVANT la ligne `<div className="border-t border-white/[0.08] mt-14" />`, insérer :

```tsx
        {/* ── En une minute : le dossier de décision (payant, grain commune) ── */}
        {dossier ? <DossierDecisionSection dossier={dossier} /> : null}
```

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm run build`
Expected: build réussi (la page `/rapport` compile ; aucune erreur de type sur `Dossier`).

- [ ] **Step 6: Vérification comportementale (verify skill)**

Utiliser la skill `verify` pour piloter le hub avec un compte payant : la section « En une minute » apparaît entre la carte Projet et la grille des modules, la conclusion commence par « À l'échelle de la commune », chaque fait porte un lien de preuve, le CTA « Affiner avec une adresse » pointe vers `/rapport/logement`. Noter le résultat observé.

- [ ] **Step 7: Commit**

```bash
git add src/lib/decision/territory-facts.ts src/components/report/DossierDecisionSection.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "feat(decision): page « En une minute » sur le hub payant (grain commune)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Graver les trois arbitrages au vault

**Files:**
- Create: `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md`
- Create: `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md`
- Create: `docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md`

**Interfaces:** aucune (documentation).

- [ ] **Step 1: Arbitrage n°1 (éliminatoire = contrainte déclarée)**

Create `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md` :

```markdown
# « Éliminatoire » = incompatibilité avec une contrainte non négociable DÉCLARÉE

**Date** : 2026-07-11 · **Statut** : arbitré (porteur), branché slice 1.

Dans le dossier de décision (« En une minute »), presque rien n'est éliminatoire dans l'absolu.
Un point n'est « éliminatoire » que lorsqu'il **contredit une contrainte non négociable que le
lecteur a lui-même déclarée**. Le critère vient du lecteur ; futur•e ne fait que constater la
contradiction. Cela résout la tension avec l'invariant n°1 (« on ne décide jamais à sa place ») et
avec « on ne juge jamais un territoire dans l'absolu ».

Trois états, jamais un verdict :
- **Incompatibilité établie** : une preuve suffisante contredit directement une contrainte déclarée.
- **Incompatibilité possible à vérifier** : un signal existe, la preuve ne suffit pas encore.
- **Aucune incompatibilité établie dans les données examinées** (jamais « aucun problème »).

Corollaire : un projet **sans contrainte non négociable déclarée** ne peut produire aucun
éliminatoire. Cet état (`no_hard_constraint_declared`) est distinct de « données insuffisantes »
(`insufficient_evidence`). Les deux vides ne se confondent jamais.

Implémentation : `src/lib/decision/materiality-rules.ts` (les règles `incompatibility` lisent
`hardConstraints`), `src/lib/decision/decision-assembler.ts` (les cinq états de conclusion).
Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
```

- [ ] **Step 2: Arbitrage n°2 (déterministe sélectionne, IA formule)**

Create `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md` :

```markdown
# Le déterministe sélectionne, l'IA formule (dossier de décision)

**Date** : 2026-07-11 · **Statut** : arbitré (porteur). Slice 1 = déterministe seul.

Frontière nette pour le dossier de décision :

**Le déterministe (registre de règles) décide** : si un fait est pertinent pour le projet, dans
quelle section il peut apparaître, s'il remplit la condition de matérialité, quelle preuve et quelle
limite l'accompagnent, quelle action est proposée, et l'état de conclusion.

**L'IA (slice 2) formule seulement** : elle reçoit des sections DÉJÀ résolues et peut fusionner deux
formulations redondantes, reformuler la conclusion, adapter la voix à la posture, fluidifier. Elle
ne peut JAMAIS changer le rôle d'un fait, inventer une incompatibilité, masquer une inconnue,
modifier un niveau de preuve, introduire une priorité absente du projet, ni supprimer un lien de
preuve.

La sortie déterministe reste le **fallback permanent** (latence, erreur, artefact non généré). Elle
n'est jamais du travail jeté. On prouve d'abord que futur•e pense juste, on lui apprend ensuite à
mieux le dire.

Registre, jamais un score : on ne calcule jamais `importance × gravité × confiance`, un score même
caché décide mécaniquement et devient infalsifiable. Chaque remontée est une règle explicable.
Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
```

- [ ] **Step 3: Arbitrage n°3 (un produit, sémantique par posture)**

Create `docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md` :

```markdown
# Un seul produit structurel, sémantique par posture

**Date** : 2026-07-11 · **Statut** : arbitré (porteur), branché slice 1.

Le dossier de décision garde UNE structure canonique en cinq sections (conclusion conditionnelle,
contraintes/incompatibilités, compromis, inconnues, vérifications) pour toutes les postures. On ne
fabrique pas deux produits « chercheur » et « habitant » séparés maintenant.

Seuls les **titres et le verbe d'engagement** changent :
- `recherche` / `adresse` / intent `achat` : « À vérifier avant de vous engager ».
- `habitant` : conclusion « ce qu'il faut comprendre et surveiller », section « Ce qu'il reste
  utile de vérifier ou de surveiller ».
- `recherche_quartier` : réservée (payload non conçu), retombe sur les libellés `recherche`.

Le moteur (registre + assembleur) est identique ; la posture ne change que la couche de libellés.
La séparation éventuelle en deux produits attend le test miroir du lancement (cf.
`docs/vault/arbitrages/moat-assemblage-largeur-en-tunnel.md`).
Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
```

- [ ] **Step 4: Commit**

```bash
git add docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md docs/vault/arbitrages/deterministe-selectionne-ia-formule.md docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md
git commit -m "vault(arbitrage): dossier de décision (éliminatoire déclaré, déterministe/IA, un produit par posture)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Vérification finale (après toutes les tâches)

- [ ] Typecheck complet : `npx tsc --noEmit` → exit 0.
- [ ] Tous les tests décision : `node --test src/lib/decision/*.test.ts` → tout PASS.
- [ ] Build : `npm run build` → réussi.
- [ ] Critère de réussite du slice 1 (spec §13) : sur trois `UserProject` réels contrastés (un
  `recherche` sans contrainte dure, un `achat` avec `nearSea`, un `habitant`) et trois communes
  réelles, vérifier que les dossiers diffèrent visiblement, qu'aucun fait n'est dans le mauvais
  rôle, que la conclusion annonce toujours son périmètre communal, que les sections sans matière
  restent vides, et que chaque phrase est traçable à un `ruleId` et à une preuve.
