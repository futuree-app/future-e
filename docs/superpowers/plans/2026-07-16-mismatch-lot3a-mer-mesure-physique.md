# Mismatch lot 3a — la mer (absolute_measure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la troisième forme de fondement du rôle `mismatch` (`absolute_measure`) sur le seul critère `proximite_mer`, avec une règle symétrique (proche → satisfied, loin → mismatch), sans aucun enrichissement d'index.

**Architecture:** Une lib pure `coast-facts.ts` (convention versionnée + classifieur à quatre sorties) alimente une règle `coast-rules.ts` bâtie sur le patron exact d'`absence-rules.ts`. La règle est ajoutée au `REGISTRY` de `materiality-rules.ts`, et le `basis` de `MismatchFact` (union discriminée) gagne la variante `absolute_measure`. La donnée (`distanceCoteKm`) est déjà dans `ModuleFacts` : rien à câbler côté index.

**Tech Stack:** TypeScript (ESM, imports en `.ts`), `node --test` (runner natif, pas de framework), Next.js.

## Global Constraints

- **Voix (mémoire projet, verbatim)** : jamais de tiret cadratin `—` (virgule ou deux points) ; jamais d'antithèse « c'est X, pas Y » ; absence/écart factuel autorisé dans le périmètre mesuré, jugement qualitatif absolu interdit (« insuffisant », « manque » proscrits).
- **Formulation mer** : la distance est **arrondie au km** (`Math.round`) et **toujours** préfixée « estimée à environ » ; jamais « la mer est à X km » (la mesure V1 ne mesure pas le trait de côte).
- **Convention gravée** : `coast-proximity-v1`, `satisfiedMaxKm: 15`, `mismatchMinKm: 100`. Bornes fermées (`≤ 15` satisfied, `≥ 100` mismatch).
- **Doctrine de résultat** : `satisfied`/`neutral`/`mismatch` poids-1 = silencieux (tableau de faits **vide**). Seul un mismatch de poids ≥ 2 produit un `MismatchFact` (poids 2 → `secondary`, poids 3 → `structuring`). Jamais `decision_critical`.
- **Gardes de données** : `distanceCoteKm` null / non finie / négative → `uncertain`, jamais un verdict. Aucun repli `?? 0`.
- **Zéro nouveau système de faits favorables** : la face `satisfied` reste un outcome silencieux, comme tous les `satisfied` existants.
- **Imports ESM** : toujours suffixer `.ts` (le codebase l'exige). Tests en `node --test`, `import test from "node:test"` + `import assert from "node:assert/strict"`.

---

### Task 1 : `coast-facts.ts` — la convention et le classifieur (lib pure)

**Files:**
- Create: `src/lib/decision/coast-facts.ts`
- Test: `src/lib/decision/coast-facts.test.ts`

**Interfaces:**
- Produces:
  - `COAST_PROXIMITY_CONVENTION: { readonly id: "coast-proximity-v1"; readonly satisfiedMaxKm: 15; readonly mismatchMinKm: 100; readonly measure: string }`
  - `classifyCoastDistance(distanceKm: number | null): "satisfied" | "neutral" | "mismatch" | "uncertain"`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/coast-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { classifyCoastDistance, COAST_PROXIMITY_CONVENTION } from "./coast-facts.ts";

test("convention coast-proximity-v1 : seuils gravés", () => {
  assert.equal(COAST_PROXIMITY_CONVENTION.id, "coast-proximity-v1");
  assert.equal(COAST_PROXIMITY_CONVENTION.satisfiedMaxKm, 15);
  assert.equal(COAST_PROXIMITY_CONVENTION.mismatchMinKm, 100);
});

test("proche (<= 15) -> satisfied ; borne fermée à 15", () => {
  assert.equal(classifyCoastDistance(3), "satisfied");
  assert.equal(classifyCoastDistance(15), "satisfied");
});

test("intermédiaire (15 < d < 100) -> neutral", () => {
  assert.equal(classifyCoastDistance(16), "neutral");
  assert.equal(classifyCoastDistance(99), "neutral");
});

test("loin (>= 100) -> mismatch ; borne fermée à 100", () => {
  assert.equal(classifyCoastDistance(100), "mismatch");
  assert.equal(classifyCoastDistance(240), "mismatch");
});

test("donnée absente ou corrompue -> uncertain, jamais un verdict", () => {
  assert.equal(classifyCoastDistance(null), "uncertain");
  assert.equal(classifyCoastDistance(Number.NaN), "uncertain");
  assert.equal(classifyCoastDistance(Number.POSITIVE_INFINITY), "uncertain");
  assert.equal(classifyCoastDistance(-5), "uncertain");
});

test("la classification se fait sur la valeur EXACTE, avant tout arrondi (bornes décimales)", () => {
  assert.equal(classifyCoastDistance(15.001), "neutral");   // > 15, pas satisfied
  assert.equal(classifyCoastDistance(99.999), "neutral");   // < 100, pas mismatch
  assert.equal(classifyCoastDistance(100), "mismatch");
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run : `node --test src/lib/decision/coast-facts.test.ts`
Expected : FAIL avec `Cannot find module './coast-facts.ts'`.

- [ ] **Step 3 : Écrire l'implémentation minimale**

Créer `src/lib/decision/coast-facts.ts` :

```ts
// LA CONVENTION DE PROXIMITÉ MER, versionnée, et son classifieur. PURS.
//
// La distance à la côte mesure DIRECTEMENT la qualité recherchée (contrairement à une ligne de bus, cf.
// lot 2a) : la règle est donc SYMÉTRIQUE. Proche -> satisfied, loin -> mismatch, entre-deux -> neutral,
// donnée absente/corrompue -> uncertain. Les seuils NE réutilisent PAS la formule de tri du comparateur
// (100 - distance / 1.5) : celle-ci sert au classement, pas au dossier.
//
// Seuils calibrés sur l'imprécision de la mesure V1 (distance à une LISTE DE VILLES CÔTIÈRES, pas au trait
// de côte) : 15 km (pas 10) pour ne pas perdre une commune littorale éloignée d'une ville listée ; 100 km
// (pas 80) pour un éloignement robuste malgré le proxy. Une v2 au trait de côte IGN pourra rapprocher le
// seuil de mismatch de 80 km.
export const COAST_PROXIMITY_CONVENTION = {
  id: "coast-proximity-v1",
  satisfiedMaxKm: 15,
  mismatchMinKm: 100,
  measure: "distance_haversine_to_reference_coastal_places",
} as const;

export function classifyCoastDistance(
  distanceKm: number | null,
): "satisfied" | "neutral" | "mismatch" | "uncertain" {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return "uncertain";
  if (distanceKm <= COAST_PROXIMITY_CONVENTION.satisfiedMaxKm) return "satisfied";
  if (distanceKm >= COAST_PROXIMITY_CONVENTION.mismatchMinKm) return "mismatch";
  return "neutral";
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run : `node --test src/lib/decision/coast-facts.test.ts`
Expected : PASS (6 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/coast-facts.ts src/lib/decision/coast-facts.test.ts
git commit -m "feat(mismatch): coast-facts (convention coast-proximity-v1 + classifieur)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2 : `coast-rules.ts` — la règle, le type de fondement, le câblage REGISTRY

**Files:**
- Create: `src/lib/decision/coast-rules.ts`
- Create: `src/lib/decision/coast-rules.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (ajouter `AbsoluteMeasureBasis` à `MismatchBasis`, autour de la ligne 88)
- Modify: `src/lib/decision/materiality-rules.ts` (import + `...COAST_RULES` au REGISTRY ~ligne 407 ; whitelist `assertFactValid` ~ligne 453)

**Interfaces:**
- Consumes (Task 1) : `COAST_PROXIMITY_CONVENTION`, `classifyCoastDistance` de `./coast-facts.ts`.
- Consumes (existant) : `preferenceWeight(p, key)` de `./project-view.ts` ; `assertFactValid(fact, project)` de `./materiality-rules.ts` ; types `DecisionRule`, `RuleEvaluation`, `MismatchFact`, `EvidenceRef`, `ModuleFacts` de `./decision-fact.ts`.
- Produces :
  - `AbsoluteMeasureBasis = { kind: "absolute_measure"; value: number; unit: "km" | "min"; conventionId: string }`
  - `MismatchBasis = NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis`
  - `COAST_RULES: DecisionRule[]` (une règle, id `territoire.mer-proximite_mer`)
  - `COAST_KEYS: PreferenceKey[]` (`["proximite_mer"]`)

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/coast-rules.test.ts` (helpers calqués sur `absence-rules.test.ts`) :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { COAST_RULES } from "./coast-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts>): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, reliefProximite: 0, distanceCoteKm: 240, population: 98_000, altitude: 30,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null, rankBands: null,
    localNetwork: { measured: false, access: null }, higherEd: { measured: false },
    scores: {}, hasAddress: false, ...over,
  };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
const rule = COAST_RULES[0]!;

test("la fabrique produit 1 règle", () => { assert.equal(COAST_RULES.length, 1); });

test("loin (>=100) + poids 3 -> mismatch STRUCTURANT, absolute_measure, distance estimée, jamais 'la mer est à'", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 146 }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.role, "mismatch");
  const basis = (f as { basis: { kind: string; value: number; unit: string; conventionId: string } }).basis;
  assert.equal(basis.kind, "absolute_measure");
  assert.equal(basis.value, 146);
  assert.equal(basis.unit, "km");
  assert.equal(basis.conventionId, "coast-proximity-v1");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /distance au littoral est estimée à environ 146 km/);
  assert.match(f.statement, /point de référence retenu/);
  assert.doesNotMatch(f.statement, /la mer est à/i);
  assert.doesNotMatch(f.statement, /insuffisant|manque|médiocre/i);
  assert.equal(f.evidence[0]!.factId, "coastDistance.proximite_mer");
  assert.match(f.evidence[0]!.observedValue!, /distance au littoral estimée à environ 146 km/);
  assertFactValid(f, p);
});

test("la valeur du basis est BRUTE (non arrondie) ; seul le texte arrondit", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 146.4 }), p, undefined as never);
  const f = e.facts[0]!;
  const basis = (f as { basis: { value: number } }).basis;
  assert.equal(basis.value, 146.4);                        // fait auditable : valeur brute
  assert.match(f.statement, /environ 146 km/);             // restitution humaine : arrondie
});

test("loin + poids 2 -> mismatch SECONDARY", () => {
  const p = project([{ key: "proximite_mer", weight: 2 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 240 }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts[0]!.materialityTier, "secondary");
});

test("proche (<=15) -> satisfied silencieux ; intermédiaire -> neutral silencieux ; aucun fait", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  const near = rule.evaluate(facts({ distanceCoteKm: 4 }), p, undefined as never);
  assert.equal(near.outcome, "satisfied");
  assert.equal(near.facts.length, 0);
  const mid = rule.evaluate(facts({ distanceCoteKm: 50 }), p, undefined as never);
  assert.equal(mid.outcome, "neutral");
  assert.equal(mid.facts.length, 0);
});

test("distance nulle/corrompue -> uncertain, aucune valeur inventée", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  assert.equal(rule.evaluate(facts({ distanceCoteKm: null }), p, undefined as never).outcome, "uncertain");
  assert.equal(rule.evaluate(facts({ distanceCoteKm: Number.NaN }), p, undefined as never).outcome, "uncertain");
});

test("LE POIDS 1 : loin -> mismatch calculé mais SILENCIEUX (facts vides)", () => {
  const p = project([{ key: "proximite_mer", weight: 1 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 240 }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("priorité absente (poids 0) -> not_applicable", () => {
  const e = rule.evaluate(facts({ distanceCoteKm: 240 }), project([]), undefined as never);
  assert.equal(e.outcome, "not_applicable");
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run : `node --test src/lib/decision/coast-rules.test.ts`
Expected : FAIL avec `Cannot find module './coast-rules.ts'`.

- [ ] **Step 3 : Ajouter le type de fondement `absolute_measure`**

Dans `src/lib/decision/decision-fact.ts`, remplacer le bloc (autour des lignes 82-88) :

```ts
export type RelativePositionBasis = {
  kind: "relative_position";
  rankLow: number; rankHigh: number;
  universe: "communes_france";
  distributionVersion: string;
};
export type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis;
```

par :

```ts
export type RelativePositionBasis = {
  kind: "relative_position";
  rankLow: number; rankHigh: number;
  universe: "communes_france";
  distributionVersion: string;
};
// MESURE PHYSIQUE ABSOLUE (lot 3a, mer) : la grandeur brute EST le fait, auto-suffisante (pas de
// nationalContext, contrairement à named_absence). `unit` = "km" SEUL : doctrine « seulement le productible »
// appliquée À L'INTÉRIEUR du fondement (autoriser "min" créerait un état que le moteur ne sait ni produire ni
// expliquer, et qu'assertFactValid rejette). `value` = la distance BRUTE, auditable indépendamment de la
// convention.
export type AbsoluteMeasureBasis = {
  kind: "absolute_measure";
  value: number;
  unit: "km";
  conventionId: string;
};
export type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis;
```

- [ ] **Step 4 : Créer la règle**

Créer `src/lib/decision/coast-rules.ts` :

```ts
// LA FABRIQUE DE LA RÈGLE DE PROXIMITÉ MER (absolute_measure). PURE.
//
// Doctrine SYMÉTRIQUE : la distance à la côte mesure DIRECTEMENT la qualité recherchée. Proche -> satisfied ;
// loin -> mismatch ; entre-deux -> neutral ; donnée absente/corrompue -> uncertain. satisfied/neutral sont
// SILENCIEUX (aucun fait) ; le POIDS gouverne la seule face mismatch (1 = silencieux, 2 = secondary, 3 =
// structuring). Jamais satisfied matériel : l'architecture n'a pas de fait favorable (cf. spec §7).
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { COAST_PROXIMITY_CONVENTION, classifyCoastDistance } from "./coast-facts.ts";

const territoireHref = "/rapport/quartier";
const RULE_ID = "territoire.mer-proximite_mer";

export const COAST_KEYS: PreferenceKey[] = ["proximite_mer"];

function makeCoastRule(): DecisionRule {
  const id = RULE_ID;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: ["proximite_mer"], outcome, facts, reason });

      const weight = preferenceWeight(p, "proximite_mer");
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const distanceKm = f.distanceCoteKm;
      const verdict = classifyCoastDistance(distanceKm);
      if (verdict === "uncertain") return ret("uncertain", [], "distance à la côte indisponible");

      // neutral (intermédiaire) et satisfied (proche) toujours silencieux ; mismatch de poids 1 examiné
      // mais silencieux (non matériel).
      if (verdict !== "mismatch" || weight < 2) {
        const reason = verdict === "mismatch" ? "éloignement mineur, silencieux (poids 1)"
          : verdict === "satisfied" ? "proche du littoral" : "distance intermédiaire";
        return ret(verdict, [], reason);
      }

      // verdict "mismatch" && weight >= 2 : distanceKm est fini >= 100 par construction de classifyCoastDistance.
      // Une garde d'invariant NARROW distanceKm de `number | null` à `number`, sans cast qui masquerait la relation.
      if (distanceKm == null || !Number.isFinite(distanceKm)) {
        throw new Error(`[decision] ${id}: invariant interne, distance valide attendue`);
      }
      const km = Math.round(distanceKm);
      const tier = weight >= 3 ? "structuring" : "secondary";
      const ev: EvidenceRef = {
        factId: "coastDistance.proximite_mer", module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `distance au littoral estimée à environ ${km} km`, grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-proximite_mer`, ruleId: id, sourceFactIds: ["coastDistance.proximite_mer"],
        module: "territoire", role: "mismatch", projectKey: "proximite_mer", materialityTier: tier,
        topic: "la distance à la mer",
        statement: `Vous avez placé la proximité de la mer parmi vos priorités. La distance au littoral est estimée à environ ${km} km depuis le point de référence retenu pour ${f.nom}. Cette distance répond moins bien à cette dimension de votre projet, sans rendre ${f.nom} incompatible avec lui.`,
        basis: { kind: "absolute_measure", value: distanceKm, unit: "km", conventionId: COAST_PROXIMITY_CONVENTION.id },
        evidence: [ev],
        limitation:
          "Cette estimation est calculée à vol d'oiseau depuis un ensemble de localités côtières de référence. Elle ne correspond ni à la distance minimale au trait de côte, ni à la distance routière, ni au temps de trajet. Une version ultérieure pourra utiliser directement le trait de côte IGN.",
      };
      return ret("mismatch", [fact], "éloignement attesté de la côte");
    },
  };
}

export const COAST_RULES: DecisionRule[] = [makeCoastRule()];
```

- [ ] **Step 5 : Câbler le REGISTRY et le validateur**

Dans `src/lib/decision/materiality-rules.ts` :

1. Après la ligne `import { ABSENCE_RULES } from "./absence-rules.ts";` (~ligne 21), ajouter :

```ts
import { COAST_RULES } from "./coast-rules.ts";
```

2. Dans le tableau `REGISTRY` (~ligne 407-408), après `...ABSENCE_RULES,` ajouter la ligne `...COAST_RULES,` :

```ts
  ...MISMATCH_RULES,
  ...ABSENCE_RULES,
  ...COAST_RULES,
  ruleInondation,
```

3. Dans `assertFactValid`, `case "mismatch"` (~ligne 453), remplacer le bloc de garde (le `if (fact.basis.kind !== "relative_position" && fact.basis.kind !== "named_absence") { throw … }`) par une **validation réelle** de la mesure absolue (pas une simple whitelist de noms : elle protège tous les futurs producteurs de `MismatchFact`) :

```ts
      const basis = fact.basis;
      if (basis.kind === "absolute_measure") {
        if (!Number.isFinite(basis.value) || basis.value < 0) {
          throw new Error(`[decision] ${fact.ruleId}: mesure absolue invalide`);
        }
        if (basis.unit !== "km") {
          throw new Error(`[decision] ${fact.ruleId}: unité de mesure absolue inconnue (${basis.unit})`);
        }
        if (!basis.conventionId) {
          throw new Error(`[decision] ${fact.ruleId}: convention de mesure absente`);
        }
      } else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {
        throw new Error(`[decision] ${fact.ruleId}: basis de mismatch inconnu (${(basis as { kind: string }).kind})`);
      }
```

Le `basis.unit !== "km"` est une garde de runtime (le type interdit déjà « min » à la compilation) qui défend contre une construction non typée (JSON, cast).

- [ ] **Step 6 : Lancer les tests pour vérifier le succès**

Run : `node --test src/lib/decision/coast-rules.test.ts`
Expected : PASS (8 tests).

- [ ] **Step 7 : Vérifier le typage global**

Run : `npx tsc --noEmit`
Expected : 0 erreur.

- [ ] **Step 8 : Commit**

```bash
git add src/lib/decision/coast-rules.ts src/lib/decision/coast-rules.test.ts src/lib/decision/decision-fact.ts src/lib/decision/materiality-rules.ts
git commit -m "feat(mismatch): règle mer (absolute_measure), câblée au REGISTRY

AbsoluteMeasureBasis ajouté à MismatchBasis ; assertFactValid l'accepte.
Règle symétrique : proche -> satisfied silencieux, loin (>=100 km) -> mismatch
selon le poids. Distance arrondie, préfixée 'estimée à environ'.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 : `coast-e2e.test.ts` — la chaîne bout-en-bout et l'orientation

**Files:**
- Create: `src/lib/decision/coast-e2e.test.ts`

**Interfaces:**
- Consumes (existant) : `mapCommuneToModuleFacts`, `runRules`, `assembleDossier`, `hydrateHardConstraints`, `PRODUCT_CONVENTIONS_VERSION`, types `IndexCommune`, `UserProject`, `EvaluationContext`, `PlaceDirectory`. Signatures calquées verbatim sur `absence-e2e.test.ts`.
- Produces : rien (test terminal).

Ce test prouve l'acceptation §11.6 (poids 1 monte la couverture sans déclencher `arbitration`) et §11.2/§11.3 (carte visible en `mismatches`, satisfied silencieux) de bout en bout.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/coast-e2e.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";

// BOUT EN BOUT : IndexCommune -> mapCommuneToModuleFacts -> runRules -> assembleDossier. On prouve que la
// mesure de distance à la mer traverse toute la chaîne et ressort en carte dans la section « mismatches ».
const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return { insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
    population: 98000, densite: 6800, distance_cote_km: 240, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune) };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return { posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z" };
}
function context(f: { lat: number; lon: number; nom: string }): EvaluationContext {
  return { constraints: hydrateHardConstraints({}, DIR),
    point: { lat: f.lat, lon: f.lon, grain: "commune_reference", source: "commune_centroid", label: f.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION };
}
function dossierFor(e: IndexCommune, p: UserProject) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: e.population ?? null });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E mer loin (>=100, poids 3) -> carte absolute_measure dans « mismatches », arbitrage", () => {
  const d = dossierFor(entry({ distance_cote_km: 240 }), project([{ key: "proximite_mer", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.ok(sec, "la section « mismatches » doit exister");
  const mer = sec!.facts.find((f) => f.role === "mismatch" && (f as { basis: { kind: string } }).basis.kind === "absolute_measure");
  assert.ok(mer, "une carte de distance à la mer doit être présente");
  assert.match(mer!.statement, /distance au littoral est estimée à environ 240 km/);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E mer proche (<=15) -> satisfied : couverture examinée, outcome favorable, orientation favorable, aucune carte", () => {
  const d = dossierFor(entry({ distance_cote_km: 4 }), project([{ key: "proximite_mer", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const mer = (sec?.facts ?? []).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "absolute_measure");
  assert.equal(mer.length, 0, "aucune carte quand la commune est proche du littoral");
  const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
  assert.equal(crit?.coverage, "examined");
  assert.equal(crit?.outcome, "favorable"); // satisfied (RuleOutcome) -> favorable (CriterionOutcome)
  assert.equal(d.criteria.orientation, "favorable");
});

test("E2E mer intermédiaire (15 < d < 100) -> neutral : couverture examinée, orientation neutral, aucune carte", () => {
  const d = dossierFor(entry({ distance_cote_km: 50 }), project([{ key: "proximite_mer", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const mer = (sec?.facts ?? []).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "absolute_measure");
  assert.equal(mer.length, 0, "aucune carte en zone intermédiaire");
  const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
  assert.equal(crit?.coverage, "examined");
  assert.equal(d.criteria.orientation, "neutral"); // examiné, aucun signal favorable matériel
});

test("E2E poids 1 : loin -> couverture acquise, aucune carte, pas d'arbitrage", () => {
  const d = dossierFor(entry({ distance_cote_km: 240 }), project([{ key: "proximite_mer", weight: 1 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const mer = (sec?.facts ?? []).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "absolute_measure");
  assert.equal(mer.length, 0, "poids 1 : silencieux");
  assert.notEqual(d.criteria.orientation, "arbitration");
  const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
  assert.equal(crit?.coverage, "examined"); // examiné : le mismatch poids-1 monte la couverture
});
```

- [ ] **Step 2 : Lancer le test**

Run : `node --test src/lib/decision/coast-e2e.test.ts`
Expected : PASS (4 tests).

> Si le 1er test échoue sur `orientation !== "arbitration"`, vérifier que `...COAST_RULES` est bien dans le REGISTRY (Task 2 Step 5) : un mismatch structurant seul suffit à `arbitration` (`mismatchStructuring > 0`). Si un test échoue sur `coverage`, confirmer que `mismatch`/`neutral`/`satisfied` sont dans `EXPLOITABLE` de `criteria-registry.ts` (ils le sont depuis la v1, ne rien changer).

- [ ] **Step 3 : Commit**

```bash
git add src/lib/decision/coast-e2e.test.ts
git commit -m "test(mismatch): E2E mer (index -> mapping -> runRules -> dossier)

loin poids 3 -> carte + arbitrage ; proche -> satisfied silencieux ;
poids 1 -> couverture acquise sans arbitrage.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4 : consigne mer dans le prompt, bump (v8 → v9), sonde de conclusion

**Files:**
- Modify: `src/lib/decision/conclusion-prompt.ts` (ajouter une consigne mer dans la liste des interdits mismatch)
- Modify: `src/lib/decision/conclusion-hash.ts:28` (bump de version)
- Modify: `scripts/probe-conclusion.ts` (ajouter le cas mer)

**Interfaces:**
- Consumes : `buildConclusionPlan`, `MaterialityTier`, `DecisionFact`, `probe(...)` (déjà dans le fichier).
- Produces : rien.

**Le prompt est VRAIMENT modifié, puis bumpé.** Bumper la version sans toucher au prompt invaliderait tous les artefacts persistés sans donner aucune nouvelle instruction au modèle. On grave d'abord la prudence éditoriale propre à cette mesure imparfaite (mer), puis on bump. La sonde est une vérification **manuelle** (appels API), pas un `node --test`.

- [ ] **Step 1 : Ajouter la consigne mer au prompt**

Dans `src/lib/decision/conclusion-prompt.ts`, repérer le bullet qui traite l'ABSENCE ATTESTÉE (il commence par « - généraliser une ABSENCE ATTESTÉE au-delà de ce qui est mesuré. » et se termine par « Comme tout mismatch, cela s'ARBITRE, jamais « à vérifier » ; »). **Juste après ce bullet**, insérer :

```ts
- transformer une MESURE PHYSIQUE en autre chose que ce qu'elle mesure. Certains mismatchs reposent sur une
  grandeur mesurée (la distance à la mer). Nommez la grandeur et son estimation, gardez la prudence « estimée
  à environ », ne transformez jamais une distance en temps de trajet, n'écrivez jamais « la mer est à X km »,
  et comme tout mismatch, cela s'ARBITRE, jamais « à vérifier » ;
```

(Insérer la ligne comme partie intégrante de la chaîne de texte du prompt, au même niveau d'indentation et dans les mêmes délimiteurs que les bullets voisins.)

- [ ] **Step 2 : Bumper la version du prompt**

Dans `src/lib/decision/conclusion-hash.ts`, ligne 28, remplacer :

```ts
export const DECISION_NARRATIVE_PROMPT_VERSION = "v8";
```

par :

```ts
export const DECISION_NARRATIVE_PROMPT_VERSION = "v9";
```

- [ ] **Step 3 : Vérifier que le test de hash suit**

Run : `node --test src/lib/decision/conclusion-hash.test.ts`
Expected : PASS. (Si un test fige la valeur `"v8"`, le mettre à jour à `"v9"` — c'est le comportement attendu, le bump invalide bien les hash.)

- [ ] **Step 4 : Ajouter le cas mer à la sonde**

Dans `scripts/probe-conclusion.ts`, après la définition de `planAbsence` (juste avant la ligne `console.log("gate :", ...)`), ajouter le helper et le plan :

```ts
// Un fait de MESURE PHYSIQUE (absolute_measure) : la mer est loin. Le modèle doit nommer l'éloignement au
// périmètre mesuré, en comparatif, sans le confondre avec « à vérifier ».
function coast(id: string, tier: MaterialityTier, topic: string, statement: string): DecisionFact {
  return {
    id, ruleId: `territoire.mer-${id}`, sourceFactIds: [`coastDistance.${id}`], module: "territoire",
    topic, statement,
    materialityTier: tier, role: "mismatch", projectKey: id as never,
    basis: { kind: "absolute_measure", value: 240, unit: "km", conventionId: "coast-proximity-v1" },
    evidence: [{ factId: `coastDistance.${id}`, module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

const planCoast = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    coast("proximite_mer", "structuring", "la distance à la mer",
      "La côte est estimée à environ 240 km du point de référence retenu pour Roubaix."),
  ],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "arbitration",
  hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});
```

Puis, à la fin du fichier, remplacer le bloc de synthèse :

```ts
const a = await probe(plan, "réserves majeures");
const b = await probe(planMismatch, "mismatch / arbitrage");
const c = await probe(planAbsence, "absence attestée / arbitrage");
const R = a.retenus + b.retenus + c.retenus, T = a.total + b.total + c.total;
console.log(`\n════ TAUX DE SURVIE : ${R}/${T} blocs ════`);
```

par :

```ts
const a = await probe(plan, "réserves majeures");
const b = await probe(planMismatch, "mismatch / arbitrage");
const c = await probe(planAbsence, "absence attestée / arbitrage");
const d = await probe(planCoast, "mer / éloignement");
const R = a.retenus + b.retenus + c.retenus + d.retenus, T = a.total + b.total + c.total + d.total;
console.log(`\n════ TAUX DE SURVIE : ${R}/${T} blocs ════`);
```

- [ ] **Step 5 : Vérifier le typage**

Run : `npx tsc --noEmit`
Expected : 0 erreur.

- [ ] **Step 6 : Lancer la sonde (vérification manuelle, nécessite ANTHROPIC_API_KEY)**

Run : `npx tsx scripts/probe-conclusion.ts` (ou la commande de sonde du projet, cf. `package.json`).
Expected : le cas « mer / éloignement » produit des blocs retenus (le modèle nomme la distance en comparatif, sans dire « à vérifier »), et le taux de survie global reste au niveau des lots précédents (≈ 25/25). Contrôle visuel des tirages : jamais « la mer est à X km », toujours « estimée à environ ».

> Cette étape est un contrôle éditorial manuel. Si un bloc mer est rejeté par `validateGeneratedBlocks`, lire le motif affiché et ajuster la consigne de prompt (nommer un mismatch de distance sans recopier la carte), pas les seuils.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/conclusion-prompt.ts src/lib/decision/conclusion-hash.ts scripts/probe-conclusion.ts
git commit -m "feat(mismatch): consigne mer dans le prompt + v8 -> v9 + cas de sonde

Prompt: consigne dédiée (nommer la grandeur, 'estimée à environ', jamais de
temps de trajet ni 'la mer est à X km'). Bump invalide les artefacts persistés.
Sonde: cas 'mer / éloignement' ajouté.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5 : Vérification finale et mise à jour de la passation

**Files:**
- Modify: `docs/handoff/CURRENT.md` (état lot 3a livré)

- [ ] **Step 1 : Suite de tests décision complète**

Run : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts`
Expected : tout vert (les 536 tests de la baseline + les nouveaux coast-facts (5) / coast-rules (7) / coast-e2e (3)).

- [ ] **Step 2 : Typage strict**

Run : `npx tsc --noEmit`
Expected : 0 erreur.

- [ ] **Step 3 : Build de production**

Run : `npm run build`
Expected : exit 0. (Aucun `index:verify` requis : l'index n'est pas modifié.)

- [ ] **Step 4 : Mettre à jour la passation**

Réécrire `docs/handoff/CURRENT.md` : lot 3a (mer, `absolute_measure`) livré sur la branche `feat/mismatch-lot3a-mer`, couverture 22 → 23, convention `coast-proximity-v1` (≤15 satisfied / ≥100 mismatch), aucun enrichissement d'index, prompt v9. Prochaine pièce : lot 3b (taille, `categorical_state`, 3 contrats éditoriaux, brainstorm séparé). Rappeler les fils ouverts (dette `satisfied` poids-1 pré-existante ; 2 critères restants pour 28 ; fusion de deux mismatchs ; séparation `ProjectFit` × `DecisionConfidence`).

- [ ] **Step 5 : Commit**

```bash
git add docs/handoff/CURRENT.md
git commit -m "docs(handoff): lot 3a (mer, absolute_measure) livré sur branche (couverture 23/28)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes de couverture (auto-revue plan vs spec)

- **§3 convention `coast-proximity-v1`** → Task 1 (`COAST_PROXIMITY_CONVENTION`).
- **§4 `classifyCoastDistance` + gardes** → Task 1 (test des 4 sorties + bornes + corrompu).
- **§5 `AbsoluteMeasureBasis` sans nationalContext** → Task 2 Step 3.
- **§6 doctrine de résultat + poids** → Task 2 (règle) + tests poids 1/2/3, satisfied/neutral/uncertain/not_applicable.
- **§7 satisfied silencieux, aucun fait favorable** → Task 2 (aucune branche ne produit de fait hors mismatch ≥ 2) + test « satisfied … aucun fait ».
- **§8 formulation (statement, limitation, topic, observedValue, « estimée à environ », `Math.round`)** → Task 2 Step 4 + assertions du test.
- **§10 câblage REGISTRY + assertFactValid (validation RÉELLE value/unit/conventionId) + prompt réellement modifié puis v9 + sonde** → Task 2 Step 5, Task 4 (Steps 1-2).
- **§11 critères d'acceptation 1-8** → Tasks 1-4 (unitaires + e2e) ; §11.6 orientation poids-1 → Task 3 test 3.
- **Hors périmètre (lot 3b taille)** : aucune tâche, `CategoricalStateBasis` NON déclaré (Task 2 n'ajoute que `absolute_measure`).
