# Mismatch lot 3b — la taille d'agglomération (categorical_state) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la quatrième forme de fondement du rôle `mismatch` (`categorical_state`) sur trois critères de taille (`eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`), avec provenance de la taille transportée, sans enrichissement d'index.

**Architecture:** Une lib pure `agglomeration-facts.ts` (convention versionnée + classifieur null→uncertain + libellés dépendants de la source) alimente une fabrique de 3 règles `agglomeration-rules.ts` encodant trois contrats distincts (2 symétriques, 1 asymétrique). La provenance UU/commune est portée par un nouveau champ `ModuleFacts.tailleVilleSource`, dérivé au mapping via une fonction DRY `resolveTailleVille`. Le `basis` de `MismatchFact` gagne la variante `categorical_state`.

**Tech Stack:** TypeScript (ESM, imports `.ts`), `node --test`, Next.js.

## Global Constraints

- **Voix (mémoire, verbatim)** : pas de tiret cadratin `—` ; pas d'antithèse « c'est X, pas Y » ; catégorie factuelle autorisée, jugement qualitatif absolu interdit (« trop petit », « trop grand », « insuffisant »).
- **Provenance** : le mot **« agglomération » n'est employé QUE si `tailleVilleSource === "urban_unit"`**. Source `commune` → « selon sa population communale ; l'unité urbaine n'a pas été utilisée pour cette classification », libellés sans « agglomération ».
- **Convention gravée** : `agglomeration-size-v1`, bornes `village <2k, petite <25k, moyenne <100k, grande <500k, métropole ≥500k`, bornes fermées (500 000 → métropole).
- **Contrats** (table de vérité §4 de la spec) : eviter_grandes {village,petite}=satisfied, {moyenne}=neutral, {grande,métropole}=mismatch ; prefere_grande = miroir ; eviter_isolement {village}=mismatch, sinon neutral, **jamais satisfied**.
- **Doctrine de résultat** : satisfied/neutral/mismatch-poids-1 = silencieux (faits vides). mismatch poids 2 → secondary, poids 3 → structuring. Jamais `decision_critical`.
- **Gardes** : `tailleVille` null/NaN/négatif → `uncertain`, jamais une catégorie inventée. **Ne pas réutiliser `tailleLabel`** (null→"petite", server-only).
- **Aucun système de faits favorables** ; dette poids-1 baseline notée, non corrigée ici.
- Imports ESM en `.ts` ; tests `node --test`.

---

### Task 1 : `agglomeration-facts.ts` — convention, classifieur, libellés (lib pure)

**Files:**
- Create: `src/lib/decision/agglomeration-facts.ts`
- Test: `src/lib/decision/agglomeration-facts.test.ts`

**Interfaces:**
- Produces:
  - `AGGLOMERATION_SIZE_CONVENTION: { readonly id: "agglomeration-size-v1"; readonly thresholds: {...} }`
  - `type AgglomerationCategory = "village" | "petite" | "moyenne" | "grande" | "metropole"`
  - `classifyAgglomerationSize(population: number | null): AgglomerationCategory | "uncertain"`
  - `labelForCategory(cat: AgglomerationCategory, source: "urban_unit" | "commune"): string`
  - `provenanceClause(source: "urban_unit" | "commune"): string`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/agglomeration-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAgglomerationSize, labelForCategory, provenanceClause, AGGLOMERATION_SIZE_CONVENTION,
} from "./agglomeration-facts.ts";

test("convention agglomeration-size-v1 gravée", () => {
  assert.equal(AGGLOMERATION_SIZE_CONVENTION.id, "agglomeration-size-v1");
});

test("classifie aux bornes exactes (fermées ; 500000 -> métropole)", () => {
  assert.equal(classifyAgglomerationSize(1_999), "village");
  assert.equal(classifyAgglomerationSize(2_000), "petite");
  assert.equal(classifyAgglomerationSize(24_999), "petite");
  assert.equal(classifyAgglomerationSize(25_000), "moyenne");
  assert.equal(classifyAgglomerationSize(99_999), "moyenne");
  assert.equal(classifyAgglomerationSize(100_000), "grande");
  assert.equal(classifyAgglomerationSize(499_999), "grande");
  assert.equal(classifyAgglomerationSize(500_000), "metropole");
  assert.equal(classifyAgglomerationSize(1_050_000), "metropole");
});

test("donnée absente ou corrompue -> uncertain, jamais une catégorie", () => {
  assert.equal(classifyAgglomerationSize(null), "uncertain");
  assert.equal(classifyAgglomerationSize(Number.NaN), "uncertain");
  assert.equal(classifyAgglomerationSize(-5), "uncertain");
});

test("libellés : 'agglomération' seulement en source urban_unit", () => {
  assert.equal(labelForCategory("grande", "urban_unit"), "une grande agglomération");
  assert.equal(labelForCategory("grande", "commune"), "une grande ville");
  assert.equal(labelForCategory("petite", "urban_unit"), "une petite agglomération");
  assert.equal(labelForCategory("petite", "commune"), "une petite commune");
  assert.equal(labelForCategory("village", "commune"), "un village");
  assert.equal(labelForCategory("metropole", "commune"), "une métropole");
  assert.equal(labelForCategory("moyenne", "urban_unit"), "une ville moyenne");
});

test("clause de provenance : UU vs commune", () => {
  assert.match(provenanceClause("urban_unit"), /convention de taille utilisée/);
  assert.match(provenanceClause("commune"), /population communale/);
  assert.doesNotMatch(provenanceClause("commune"), /agglomération/);
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run : `node --test src/lib/decision/agglomeration-facts.test.ts`
Expected : FAIL avec `Cannot find module './agglomeration-facts.ts'`.

- [ ] **Step 3 : Écrire l'implémentation**

Créer `src/lib/decision/agglomeration-facts.ts` :

```ts
// LA CONVENTION DE TAILLE D'AGGLOMÉRATION, versionnée, son classifieur et ses libellés. PURS.
//
// On NE réutilise PAS `tailleLabel` de comparateur-vie.ts : elle mappe null -> "petite" (un repli métier que
// le chantier A a tué) et vit dans un module server-only. Le dossier exige null -> uncertain et une lib pure.
// Mêmes bornes, versionnées ; parité prouvée par les tests de bornes (duplication délibérée, cf. lot 2a).
export const AGGLOMERATION_SIZE_CONVENTION = {
  id: "agglomeration-size-v1",
  // tailleVille = population de l'unité urbaine si disponible, sinon population communale (cf. tailleVilleSource).
  thresholds: { village: 2_000, petite: 25_000, moyenne: 100_000, grande: 500_000 },
} as const;

export type AgglomerationCategory = "village" | "petite" | "moyenne" | "grande" | "metropole";

export function classifyAgglomerationSize(
  population: number | null,
): AgglomerationCategory | "uncertain" {
  if (population == null || !Number.isFinite(population) || population < 0) return "uncertain";
  if (population < 2_000) return "village";
  if (population < 25_000) return "petite";
  if (population < 100_000) return "moyenne";
  if (population < 500_000) return "grande";
  return "metropole";
}

// Le mot « agglomération » n'est légitime que lorsque la classification repose sur l'unité urbaine. En repli
// « population communale », on emploie un libellé neutre (« grande ville », « petite commune »).
export function labelForCategory(cat: AgglomerationCategory, source: "urban_unit" | "commune"): string {
  const uu = source === "urban_unit";
  switch (cat) {
    case "village": return "un village";
    case "petite": return uu ? "une petite agglomération" : "une petite commune";
    case "moyenne": return "une ville moyenne";
    case "grande": return uu ? "une grande agglomération" : "une grande ville";
    case "metropole": return "une métropole";
  }
}

export function provenanceClause(source: "urban_unit" | "commune"): string {
  return source === "urban_unit"
    ? "selon la convention de taille utilisée par futur•e"
    : "selon sa population communale ; l'unité urbaine n'a pas été utilisée pour cette classification";
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run : `node --test src/lib/decision/agglomeration-facts.test.ts`
Expected : PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/agglomeration-facts.ts src/lib/decision/agglomeration-facts.test.ts
git commit -m "feat(mismatch): agglomeration-facts (convention + classifieur + libellés)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2 : provenance de la taille — `resolveTailleVille` + `tailleVilleSource`

**Files:**
- Modify: `src/lib/commune-attributes.ts` (ajouter `resolveTailleVille`, faire déléguer `tailleVilleFrom`)
- Test: `src/lib/commune-attributes.test.ts` (ajouter les cas `resolveTailleVille`)
- Modify: `src/lib/comparateur-vie.ts` (ajouter `tailleVilleSourceOf`, ~ligne 581 près de `tailleVilleOf`)
- Modify: `src/lib/decision/decision-fact.ts` (ajouter `tailleVilleSource` à `ModuleFacts`)
- Modify: `src/lib/decision/module-facts-map.ts` (opts + return)
- Modify: `src/lib/decision/territory-facts.ts` (passer `tailleVilleSource`)
- Modify (ripple non-optionnel) : les 6 helpers de test qui construisent un `ModuleFacts` littéral : `absence-rules.test.ts`, `coast-rules.test.ts`, `materiality-rules.test.ts`, `logement-rules.test.ts`, `hard-constraint-rules.test.ts`, `mismatch-rules.test.ts`.

**Interfaces:**
- Produces :
  - `resolveTailleVille(uu, population, uuPop): { value: number | null; source: "urban_unit" | "commune" | null }`
  - `tailleVilleSourceOf(entry: IndexCommune): "urban_unit" | "commune" | null`
  - `ModuleFacts.tailleVilleSource: "urban_unit" | "commune" | null` (NON optionnel, nullable)

- [ ] **Step 1 : Écrire le test `resolveTailleVille` (échoue)**

Dans `src/lib/commune-attributes.test.ts`, ajouter (adapter l'import existant si `resolveTailleVille` n'y est pas encore) :

```ts
import { resolveTailleVille, tailleVilleFrom } from "./commune-attributes.ts";

test("resolveTailleVille : UU trouvée -> value UU, source urban_unit", () => {
  const uuPop = new Map([["59702", 1_050_000]]);
  assert.deepEqual(resolveTailleVille("59702", 98_000, uuPop), { value: 1_050_000, source: "urban_unit" });
});

test("resolveTailleVille : pas d'UU (ou UU absente du cache) -> value commune, source commune", () => {
  assert.deepEqual(resolveTailleVille(null, 42_000, new Map()), { value: 42_000, source: "commune" });
  assert.deepEqual(resolveTailleVille("ZZZ", 42_000, new Map()), { value: 42_000, source: "commune" });
});

test("resolveTailleVille : aucune population -> value null, source null", () => {
  assert.deepEqual(resolveTailleVille(null, null, new Map()), { value: null, source: null });
});

test("tailleVilleFrom délègue à resolveTailleVille (accord de la value)", () => {
  const uuPop = new Map([["59702", 1_050_000]]);
  assert.equal(tailleVilleFrom("59702", 98_000, uuPop), 1_050_000);
  assert.equal(tailleVilleFrom(null, 42_000, new Map()), 42_000);
  assert.equal(tailleVilleFrom(null, null, new Map()), null);
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run : `node --test src/lib/commune-attributes.test.ts`
Expected : FAIL (`resolveTailleVille` non exporté).

- [ ] **Step 3 : Ajouter `resolveTailleVille` et faire déléguer `tailleVilleFrom`**

Dans `src/lib/commune-attributes.ts`, remplacer la fonction `tailleVilleFrom` par :

```ts
// UNE SEULE vérité pour la taille ET sa provenance (la source doit toujours s'accorder avec la valeur).
export function resolveTailleVille(
  uu: string | null | undefined,
  population: number | null | undefined,
  uuPop: Map<string, number>,
): { value: number | null; source: "urban_unit" | "commune" | null } {
  if (uu) {
    const p = uuPop.get(uu);
    if (p != null) return { value: p, source: "urban_unit" };
  }
  return population != null ? { value: population, source: "commune" } : { value: null, source: null };
}

export function tailleVilleFrom(
  uu: string | null | undefined,
  population: number | null | undefined,
  uuPop: Map<string, number>,
): number | null {
  return resolveTailleVille(uu, population, uuPop).value;
}
```

- [ ] **Step 4 : Lancer le test (passe)**

Run : `node --test src/lib/commune-attributes.test.ts`
Expected : PASS.

- [ ] **Step 5 : Ajouter `tailleVilleSourceOf` dans `comparateur-vie.ts`**

Dans `src/lib/comparateur-vie.ts`, juste après `export function tailleVilleOf(...)` (~ligne 583), ajouter (l'import de `resolveTailleVille` : l'ajouter à l'import existant `{ tailleVilleFrom, communeAttributesFrom }` de `@/lib/commune-attributes`) :

```ts
// La PROVENANCE de la taille (unité urbaine vs population communale), EXPOSÉE : le dossier en a besoin pour
// n'employer « agglomération » que lorsque la classification repose sur l'UU.
export function tailleVilleSourceOf(c: IndexCommune): "urban_unit" | "commune" | null {
  return resolveTailleVille(c.uu, c.population, uuPopCache ?? new Map()).source;
}
```

- [ ] **Step 6 : Ajouter le champ à `ModuleFacts`**

Dans `src/lib/decision/decision-fact.ts`, dans le bloc `ModuleFacts` (juste après la ligne `climat: ClimatFacts | null;` du type `ModuleFacts`, à côté des autres champs chargés par l'appelant), ajouter :

```ts
  // La PROVENANCE de tailleVille, chargée par l'appelant (comme tailleVille). NON optionnelle, nullable : le
  // mot « agglomération » n'est légitime que pour "urban_unit" ; "commune" impose le repli « population
  // communale » ; null quand tailleVille est null (donnée absente -> uncertain, aucun mismatch).
  tailleVilleSource: "urban_unit" | "commune" | null;
```

- [ ] **Step 7 : Câbler le mapping**

Dans `src/lib/decision/module-facts-map.ts` :

1. Étendre `opts` (~ligne 19) :

```ts
  opts: { hasAddress: boolean; tailleVille: number | null; tailleVilleSource?: "urban_unit" | "commune" | null; climat?: ClimatFacts | null },
```

2. Dans le return, juste après `tailleVille: opts.tailleVille,` :

```ts
    tailleVilleSource: opts.tailleVilleSource ?? null,
```

- [ ] **Step 8 : Passer la source depuis la production**

Dans `src/lib/decision/territory-facts.ts` :

1. Ajouter `tailleVilleSourceOf` à l'import depuis comparateur-vie (ligne 6, à côté de `tailleVilleOf`).
2. Dans l'appel à `mapCommuneToModuleFacts` (~ligne 34), après `tailleVille: tailleVilleOf(entry),` ajouter :

```ts
    tailleVilleSource: tailleVilleSourceOf(entry),
```

- [ ] **Step 9 : Réparer les 6 helpers de test (champ non-optionnel)**

`tsc` va signaler chaque `ModuleFacts` littéral incomplet. Dans CHACUN des 6 fichiers, ajouter `tailleVilleSource: null,` au littéral du helper `facts()` (sur la ligne qui porte déjà `climat: null` / `catnatInondation`). Fichiers et ancre :

- `src/lib/decision/absence-rules.test.ts` (ligne `catnatInondation: 0, inondationRisque: 10, climat: null, sante: null, rankBands: null,`)
- `src/lib/decision/coast-rules.test.ts` (même ligne)
- `src/lib/decision/materiality-rules.test.ts` (ligne `catnatInondation: 0, inondationRisque: 10, climat: null, sante: null, scores: {}, ...`)
- `src/lib/decision/logement-rules.test.ts` (ligne `catnatInondation: 0, inondationRisque: 10, climat: null, scores: {}, hasAddress: true, logement,`)
- `src/lib/decision/hard-constraint-rules.test.ts` (ligne `catnatInondation: 0, inondationRisque: 10, climat: null, scores: {}, hasAddress: false, ...over,`)
- `src/lib/decision/mismatch-rules.test.ts` (ligne `catnatInondation: 0, inondationRisque: 10, climat: null, sante: null,`)

Ajout uniforme dans chaque littéral : `tailleVilleSource: null,` (à placer avant `...over` quand il y en a un, pour rester surchargeable).

- [ ] **Step 10 : Vérifier le typage et les tests décision**

Run : `npx tsc --noEmit`
Expected : 0 erreur. (S'il reste un `ModuleFacts` littéral non couvert, l'erreur nomme le fichier/ligne : y ajouter `tailleVilleSource: null,`.)

Run : `node --test src/lib/decision/*.test.ts src/lib/commune-attributes.test.ts`
Expected : tout vert.

- [ ] **Step 11 : Commit**

```bash
git add src/lib/commune-attributes.ts src/lib/commune-attributes.test.ts src/lib/comparateur-vie.ts src/lib/decision/decision-fact.ts src/lib/decision/module-facts-map.ts src/lib/decision/territory-facts.ts src/lib/decision/*.test.ts
git commit -m "feat(mismatch): provenance de la taille (resolveTailleVille + ModuleFacts.tailleVilleSource)

DRY : resolveTailleVille rend { value, source }, tailleVilleFrom délègue. Le mot
'agglomération' n'est légitime que source urban_unit. Champ non-optionnel nullable,
dérivé au mapping (aucun index touché). 6 helpers de test complétés.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 : `agglomeration-rules.ts` — 3 contrats, type, REGISTRY, validateur

**Files:**
- Create: `src/lib/decision/agglomeration-rules.ts`
- Create: `src/lib/decision/agglomeration-rules.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (`CategoricalStateBasis` dans `MismatchBasis`)
- Modify: `src/lib/decision/materiality-rules.ts` (import + REGISTRY + `assertFactValid`)

**Interfaces:**
- Consumes (Task 1) : `AGGLOMERATION_SIZE_CONVENTION`, `classifyAgglomerationSize`, `labelForCategory`, `provenanceClause`, `AgglomerationCategory`.
- Consumes (existant) : `preferenceWeight`, `assertFactValid`, types `DecisionRule`, `RuleEvaluation`, `MismatchFact`, `EvidenceRef`, `ModuleFacts`.
- Produces :
  - `CategoricalStateBasis = { kind: "categorical_state"; observedCategory: AgglomerationCategory; conventionId: string }`
  - `AGGLOMERATION_RULES: DecisionRule[]` (3 règles : `territoire.taille-eviter_grandes_villes`, `-prefere_grande_ville`, `-eviter_isolement`)
  - `AGGLOMERATION_KEYS: PreferenceKey[]`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/agglomeration-rules.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { AGGLOMERATION_RULES } from "./agglomeration-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts>): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 90,
    population: 98_000, altitude: 30, catnatInondation: 0, inondationRisque: 10, climat: null, sante: null,
    rankBands: null, localNetwork: { measured: false, access: null }, higherEd: { measured: false },
    scores: {}, hasAddress: false, ...over,
  };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return { posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z" };
}
const rule = (key: string) => AGGLOMERATION_RULES.find((r) => r.id === `territoire.taille-${key}`)!;

test("la fabrique produit 3 règles", () => { assert.equal(AGGLOMERATION_RULES.length, 3); });

test("eviter_grandes_villes : métropole + poids 3 -> mismatch STRUCTURANT, categorical_state, catégorie nommée", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const e = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000, tailleVilleSource: "urban_unit" }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  const basis = (f as { basis: { kind: string; observedCategory: string; conventionId: string } }).basis;
  assert.equal(basis.kind, "categorical_state");
  assert.equal(basis.observedCategory, "metropole");
  assert.equal(basis.conventionId, "agglomeration-size-v1");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /une métropole/);
  assert.doesNotMatch(f.statement, /trop grand|trop petit|insuffisant/i);
  assertFactValid(f, p);
});

test("eviter_grandes_villes : village/petite -> satisfied silencieux ; moyenne -> neutral", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_500 }), p, undefined as never).outcome, "satisfied");
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 10_000 }), p, undefined as never).outcome, "satisfied");
  const mid = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 50_000 }), p, undefined as never);
  assert.equal(mid.outcome, "neutral"); assert.equal(mid.facts.length, 0);
});

test("prefere_grande_ville : miroir (village -> mismatch, grande -> satisfied)", () => {
  const p = project([{ key: "prefere_grande_ville", weight: 2 }]);
  const vil = rule("prefere_grande_ville").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never);
  assert.equal(vil.outcome, "mismatch");
  assert.equal(vil.facts[0]!.materialityTier, "secondary");
  assert.equal(rule("prefere_grande_ville").evaluate(facts({ tailleVille: 200_000 }), p, undefined as never).outcome, "satisfied");
});

test("eviter_isolement : village -> mismatch avec limitation campus/pôles ; petite -> neutral ; JAMAIS satisfied", () => {
  const p = project([{ key: "eviter_isolement", weight: 3 }]);
  const vil = rule("eviter_isolement").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never);
  assert.equal(vil.outcome, "mismatch");
  assert.match(vil.facts[0]!.statement, /sans permettre de conclure à son isolement/);
  assert.match(vil.facts[0]!.limitation!, /bien connecté à une ville proche/);
  assert.match(vil.facts[0]!.topic, /isolement/);
  // aucune catégorie ne rend satisfied
  for (const pop of [1_500, 10_000, 50_000, 200_000, 1_050_000]) {
    assert.notEqual(rule("eviter_isolement").evaluate(facts({ tailleVille: pop }), p, undefined as never).outcome, "satisfied");
  }
});

test("provenance : source commune -> 'population communale', jamais 'agglomération' ; source UU -> 'agglomération' permis", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const communeSrc = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.match(communeSrc.statement, /population communale/);
  assert.doesNotMatch(communeSrc.statement, /agglomération/);
  const uuSrc = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: "urban_unit" }), p, undefined as never).facts[0]!;
  assert.match(uuSrc.statement, /agglomération/);
});

test("tailleVille null -> uncertain ; poids 1 -> mismatch silencieux ; poids 0 -> not_applicable", () => {
  const p3 = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: null, tailleVilleSource: null }), p3, undefined as never).outcome, "uncertain");
  const p1 = project([{ key: "eviter_grandes_villes", weight: 1 }]);
  const e1 = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000 }), p1, undefined as never);
  assert.equal(e1.outcome, "mismatch"); assert.equal(e1.facts.length, 0);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000 }), project([]), undefined as never).outcome, "not_applicable");
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run : `node --test src/lib/decision/agglomeration-rules.test.ts`
Expected : FAIL (`Cannot find module './agglomeration-rules.ts'`).

- [ ] **Step 3 : Ajouter le type `CategoricalStateBasis`**

Dans `src/lib/decision/decision-fact.ts`, remplacer :

```ts
export type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis;
```

par (en insérant le type juste avant) :

```ts
// ÉTAT CATÉGORIEL (lot 3b, taille) : l'appartenance à une catégorie de taille EST le fait (pas un
// percentile). Le nombre brut et sa provenance vivent dans l'EvidenceRef, pas dans le basis.
import type { AgglomerationCategory } from "./agglomeration-facts.ts";
export type CategoricalStateBasis = {
  kind: "categorical_state";
  observedCategory: AgglomerationCategory;
  conventionId: string;
};
export type MismatchBasis =
  NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis | CategoricalStateBasis;
```

(Placer la ligne `import type { AgglomerationCategory } ...` en haut du fichier avec les autres imports de type, pas au milieu ; le bloc `CategoricalStateBasis` + `MismatchBasis` reste où était `MismatchBasis`.)

- [ ] **Step 4 : Créer la fabrique de règles**

Créer `src/lib/decision/agglomeration-rules.ts` :

```ts
// LA FABRIQUE DES 3 RÈGLES DE TAILLE D'AGGLOMÉRATION (categorical_state). PURE.
//
// Trois contrats DISTINCTS : eviter_grandes_villes et prefere_grande_ville sont SYMÉTRIQUES (la catégorie
// mesure directement la préférence) ; eviter_isolement est ASYMÉTRIQUE (proxy faible : village -> mismatch,
// jamais satisfied). Le POIDS gouverne la matérialité (1 = silencieux, 2 = secondary, 3 = structuring).
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  AGGLOMERATION_SIZE_CONVENTION, classifyAgglomerationSize, labelForCategory, provenanceClause,
  type AgglomerationCategory,
} from "./agglomeration-facts.ts";

const territoireHref = "/rapport/quartier";
type Outcome = "satisfied" | "neutral" | "mismatch";

type SizeSpec = {
  key: PreferenceKey;
  topic: string;
  outcomes: Record<AgglomerationCategory, Outcome>;
  buildStatement: (nom: string, label: string, clause: string) => string;
  limitation?: string;
};

const SPECS: SizeSpec[] = [
  {
    key: "eviter_grandes_villes",
    topic: "la taille de l'agglomération",
    outcomes: { village: "satisfied", petite: "satisfied", moyenne: "neutral", grande: "mismatch", metropole: "mismatch" },
    buildStatement: (nom, label, clause) =>
      `Vous avez placé le fait d'éviter les grandes villes parmi vos priorités. ${nom} relève de ${label} ${clause}. Cela répond moins bien à cette dimension de votre projet, sans rendre ${nom} incompatible avec lui.`,
  },
  {
    key: "prefere_grande_ville",
    topic: "la taille de l'agglomération",
    outcomes: { village: "mismatch", petite: "mismatch", moyenne: "neutral", grande: "satisfied", metropole: "satisfied" },
    buildStatement: (nom, label, clause) =>
      `Vous avez placé le fait de vivre dans une grande ville parmi vos priorités. ${nom} relève de ${label} ${clause}. Cela répond moins bien à cette dimension de votre projet, sans rendre ${nom} incompatible avec lui.`,
  },
  {
    key: "eviter_isolement",
    topic: "l'isolement du territoire",
    outcomes: { village: "mismatch", petite: "neutral", moyenne: "neutral", grande: "neutral", metropole: "neutral" },
    buildStatement: (nom, label, clause) =>
      `Vous avez placé le fait d'éviter un environnement isolé parmi vos priorités. ${nom} relève de ${label} ${clause}. Cette petite taille répond moins bien à cette dimension de votre projet, sans permettre de conclure à son isolement effectif.`,
    limitation:
      "La taille de l'agglomération ne décrit pas à elle seule l'accès aux services, aux transports ou aux pôles voisins. Un village peut être bien connecté à une ville proche.",
  },
];

export const AGGLOMERATION_KEYS: PreferenceKey[] = SPECS.map((s) => s.key);

function makeSizeRule(spec: SizeSpec): DecisionRule {
  const id = `territoire.taille-${spec.key}`;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [spec.key], outcome, facts, reason });

      const weight = preferenceWeight(p, spec.key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const cat = classifyAgglomerationSize(f.tailleVille);
      if (cat === "uncertain") return ret("uncertain", [], "taille d'agglomération indisponible");

      const outcome = spec.outcomes[cat];
      if (outcome !== "mismatch" || weight < 2) {
        const reason = outcome === "mismatch" ? "écart mineur, silencieux (poids 1)"
          : outcome === "satisfied" ? "catégorie recherchée" : "catégorie intermédiaire";
        return ret(outcome, [], reason);
      }

      // mismatch matériel : tailleVille est non-null (cat != uncertain), donc la source est urban_unit ou
      // commune (jamais null ici). Repli sûr sur "commune" (aucun « agglomération » abusif) si jamais absente.
      const source: "urban_unit" | "commune" = f.tailleVilleSource === "urban_unit" ? "urban_unit" : "commune";
      const label = labelForCategory(cat, source);
      const clause = provenanceClause(source);
      const tier = weight >= 3 ? "structuring" : "secondary";
      const popText = source === "urban_unit"
        ? `population de l'unité urbaine : environ ${f.tailleVille!.toLocaleString("fr-FR")} habitants`
        : `population communale : environ ${f.tailleVille!.toLocaleString("fr-FR")} habitants`;
      const ev: EvidenceRef = {
        factId: `territorySize.${spec.key}`, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `${label}, ${popText}`, grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${spec.key}`, ruleId: id, sourceFactIds: [`territorySize.${spec.key}`],
        module: "territoire", role: "mismatch", projectKey: spec.key, materialityTier: tier,
        topic: spec.topic,
        statement: spec.buildStatement(f.nom, label, clause),
        basis: { kind: "categorical_state", observedCategory: cat, conventionId: AGGLOMERATION_SIZE_CONVENTION.id },
        evidence: [ev],
        ...(spec.limitation ? { limitation: spec.limitation } : {}),
      };
      return ret("mismatch", [fact], "catégorie de taille opposée à la préférence");
    },
  };
}

export const AGGLOMERATION_RULES: DecisionRule[] = SPECS.map(makeSizeRule);
```

- [ ] **Step 5 : Câbler REGISTRY et validateur**

Dans `src/lib/decision/materiality-rules.ts` :

1. Après `import { COAST_RULES } from "./coast-rules.ts";`, ajouter :

```ts
import { AGGLOMERATION_RULES } from "./agglomeration-rules.ts";
```

2. Dans `REGISTRY`, après `...COAST_RULES,` :

```ts
  ...AGGLOMERATION_RULES,
```

3. Dans `assertFactValid`, `case "mismatch"`, DANS le bloc, ajouter la validation `categorical_state`. Remplacer la branche finale :

```ts
      } else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {
        throw new Error(`[decision] ${fact.ruleId}: basis de mismatch inconnu (${(basis as { kind: string }).kind})`);
      }
```

par :

```ts
      } else if (basis.kind === "categorical_state") {
        const cats = ["village", "petite", "moyenne", "grande", "metropole"];
        if (!cats.includes(basis.observedCategory)) {
          throw new Error(`[decision] ${fact.ruleId}: catégorie de taille inconnue (${basis.observedCategory})`);
        }
        if (!basis.conventionId) throw new Error(`[decision] ${fact.ruleId}: convention de catégorie absente`);
      } else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {
        throw new Error(`[decision] ${fact.ruleId}: basis de mismatch inconnu (${(basis as { kind: string }).kind})`);
      }
```

- [ ] **Step 6 : Lancer les tests + typage**

Run : `node --test src/lib/decision/agglomeration-rules.test.ts`
Expected : PASS (7 tests).

Run : `npx tsc --noEmit`
Expected : 0 erreur.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/agglomeration-rules.ts src/lib/decision/agglomeration-rules.test.ts src/lib/decision/decision-fact.ts src/lib/decision/materiality-rules.ts
git commit -m "feat(mismatch): 3 règles de taille (categorical_state), câblées au REGISTRY

CategoricalStateBasis ajouté à MismatchBasis ; assertFactValid valide la catégorie.
eviter/prefere symétriques, eviter_isolement asymétrique (village seul, jamais
satisfied). Libellé/clause dépendants de tailleVilleSource.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4 : `agglomeration-e2e.test.ts` — chaîne bout-en-bout et orientation

**Files:**
- Create: `src/lib/decision/agglomeration-e2e.test.ts`

**Interfaces:**
- Consumes : `mapCommuneToModuleFacts`, `runRules`, `assembleDossier`, `hydrateHardConstraints`, `PRODUCT_CONVENTIONS_VERSION`, `IndexCommune`, `UserProject`, `EvaluationContext`, `PlaceDirectory` (patron `coast-e2e.test.ts`).

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/agglomeration-e2e.test.ts` :

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

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return { insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
    population: 98000, densite: 6800, distance_cote_km: 90, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune) };
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
// tailleVille + source injectés explicitement (en production ils viennent de tailleVilleSourceOf).
function dossierFor(e: IndexCommune, p: UserProject, tailleVille: number | null, source: "urban_unit" | "commune" | null) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille, tailleVilleSource: source });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E eviter_grandes_villes, métropole UU, poids 3 -> carte categorical_state, arbitrage", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, "urban_unit");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = (sec?.facts ?? []).find((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.ok(taille, "une carte de taille doit être présente");
  assert.match(taille!.statement, /une métropole/);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E eviter_grandes_villes, village -> satisfied favorable, aucune carte", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_200, "commune");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = (sec?.facts ?? []).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.equal(taille.length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  assert.equal(crit?.coverage, "examined");
  assert.equal(crit?.outcome, "favorable");
  assert.equal(d.criteria.orientation, "favorable");
});

test("E2E eviter_isolement, village source commune -> carte SANS 'agglomération', jamais satisfied", () => {
  const d = dossierFor(entry({ nom: "Petiville" }), project([{ key: "eviter_isolement", weight: 2 }]), 900, "commune");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = (sec?.facts ?? []).find((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.ok(taille, "village -> carte isolement");
  assert.doesNotMatch(taille!.statement, /agglomération/);
  assert.match(taille!.statement, /population communale/);
});
```

- [ ] **Step 2 : Lancer le test**

Run : `node --test src/lib/decision/agglomeration-e2e.test.ts`
Expected : PASS (3 tests).

> Si le 1er test échoue sur `orientation`, vérifier `...AGGLOMERATION_RULES` au REGISTRY (Task 3 Step 5). Le 2e prouve que `satisfied` (village pour eviter_grandes_villes) porte l'orientation `favorable`.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/decision/agglomeration-e2e.test.ts
git commit -m "test(mismatch): E2E taille (index -> mapping -> runRules -> dossier)

métropole -> carte + arbitrage ; village (eviter_grandes) -> satisfied/favorable ;
village source commune (eviter_isolement) -> carte sans 'agglomération'.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5 : consigne taille dans le prompt, bump (v9 → v10), sonde

**Files:**
- Modify: `src/lib/decision/conclusion-prompt.ts`
- Modify: `src/lib/decision/conclusion-hash.ts` (bump)
- Modify: `scripts/probe-conclusion.ts`

- [ ] **Step 1 : Ajouter la consigne taille au prompt**

Dans `src/lib/decision/conclusion-prompt.ts`, juste après le bullet mer (« - inventer une valeur pour une MESURE PHYSIQUE… jamais « à vérifier » ; »), insérer :

```ts
- juger en ABSOLU une CATÉGORIE DE TAILLE. Certains mismatchs constatent qu'une commune relève d'une catégorie
  de taille (un village, une ville moyenne, une grande agglomération, une métropole) en écart avec une
  préférence déclarée. Nommez la catégorie et l'écart avec la préférence, jamais « trop petit » ni « trop grand »
  en jugement. Ne confondez pas la taille et l'isolement : une petite taille n'établit pas l'isolement (« sans
  permettre de conclure à son isolement effectif »). Comme tout mismatch, cela s'ARBITRE, jamais « à vérifier » ;
```

- [ ] **Step 2 : Bump v9 -> v10**

Dans `src/lib/decision/conclusion-hash.ts`, remplacer `"v9"` par `"v10"`.

- [ ] **Step 3 : Vérifier le test de hash**

Run : `node --test src/lib/decision/conclusion-hash.test.ts`
Expected : PASS (mettre à jour toute assertion figeant `"v9"` en `"v10"` si présente).

- [ ] **Step 4 : Ajouter le cas taille à la sonde**

Dans `scripts/probe-conclusion.ts`, après `planCoast`, ajouter :

```ts
function size(id: string, tier: MaterialityTier, topic: string, statement: string): DecisionFact {
  return {
    id, ruleId: `territoire.taille-${id}`, sourceFactIds: [`territorySize.${id}`], module: "territoire",
    topic, statement,
    materialityTier: tier, role: "mismatch", projectKey: id as never,
    basis: { kind: "categorical_state", observedCategory: "metropole", conventionId: "agglomeration-size-v1" },
    evidence: [{ factId: `territorySize.${id}`, module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

const planSize = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    size("eviter_grandes_villes", "structuring", "la taille de l'agglomération",
      "Roubaix relève d'une métropole selon la convention de taille utilisée par futur•e."),
  ],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "arbitration",
  hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});
```

Puis, dans le bloc de synthèse final, ajouter la ligne et intégrer le total :

```ts
const eSize = await probe(planSize, "taille / catégorie");
const R = a.retenus + b.retenus + c.retenus + dCoast.retenus + eSize.retenus,
      T = a.total + b.total + c.total + dCoast.total + eSize.total;
```

- [ ] **Step 5 : Typage**

Run : `npx tsc --noEmit`
Expected : 0 erreur.

- [ ] **Step 6 : Lancer la sonde (contrôle éditorial manuel, ANTHROPIC_API_KEY)**

Run : `node --env-file=.env.local scripts/probe-conclusion.ts`
Expected : le cas « taille / catégorie » produit des blocs retenus ; le modèle nomme la catégorie en écart avec la préférence, jamais « trop grand », jamais « à vérifier ». **Lecture VISUELLE obligatoire** (la validation automatique ne voit pas l'absurdité sémantique : cf. le défaut « estimée à environ une valeur » trouvé au 3a). Si un bloc dérape, ajuster la consigne de prompt, pas les seuils.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/conclusion-prompt.ts src/lib/decision/conclusion-hash.ts scripts/probe-conclusion.ts
git commit -m "feat(mismatch): consigne taille dans le prompt + v9 -> v10 + cas de sonde

Consigne: nommer la catégorie, jamais 'trop grand/petit', ne pas confondre taille
et isolement. Bump invalide les artefacts. Sonde: cas 'taille / catégorie'.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6 : Vérification finale et passation

**Files:**
- Modify: `docs/handoff/CURRENT.md`

- [ ] **Step 1 : Suite complète**

Run : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts`
Expected : tout vert (baseline + agglomeration-facts (5) + agglomeration-rules (7) + agglomeration-e2e (3) + commune-attributes).

Run : `node --test scripts/lib/*.test.mjs scripts/*.test.mjs`
Expected : 22/22.

- [ ] **Step 2 : Typage + build**

Run : `npx tsc --noEmit` → 0 erreur.
Run : `npm run build` → exit 0 (aucun `index:verify` requis, l'index n'est pas modifié).

- [ ] **Step 3 : Mettre à jour le handoff**

Réécrire `docs/handoff/CURRENT.md` : lot 3b (taille, `categorical_state`, 3 critères) livré sur `feat/mismatch-lot3b-taille`, couverture 23 → 26, convention `agglomeration-size-v1`, `tailleVilleSource` transporté, prompt v10, sonde taille passée. Prochaine étape : 2 critères restants pour 28, fusion de deux mismatchs en compromis narratif, dette poids-1/satisfied implicite, séparation `ProjectFit × DecisionConfidence`.

- [ ] **Step 4 : Commit**

```bash
git add docs/handoff/CURRENT.md
git commit -m "docs(handoff): lot 3b (taille, categorical_state) livré sur branche (couverture 26/28)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes de couverture (auto-revue plan vs spec)

- **§3 convention + classifieur pur (pas tailleLabel)** → Task 1.
- **§4 trois contrats (table)** → Task 3 (SPECS.outcomes) + tests par préférence.
- **§5 tailleVilleSource DRY (resolveTailleVille), aucun index** → Task 2.
- **§6 CategoricalStateBasis + assertFactValid** → Task 3 Steps 3, 5.
- **§7 formulations, libellés/clause dépendants de la source, topics distincts** → Task 1 (labels) + Task 3 (statements) + tests provenance.
- **§8 poids + dette baseline notée** → Task 3 (poids) + Global Constraints ; dette non codée (volontaire).
- **§9 prompt v10 réellement modifié + sonde** → Task 5.
- **§11 acceptation 1-11** → Tasks 1-5 (unitaires + e2e + provenance + orientation).
- **Hors périmètre** : aucune tâche (2 critères restants, fusion, ProjectFit×Confidence, dette générale).
