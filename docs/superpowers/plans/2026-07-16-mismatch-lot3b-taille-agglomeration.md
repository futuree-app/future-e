# Mismatch lot 3b — la taille d'agglomération (categorical_state) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la quatrième forme de fondement du rôle `mismatch` (`categorical_state`) sur trois critères de taille (`eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`), avec provenance de la taille transportée et exigée, sans enrichissement d'index.

**Architecture:** Une lib pure `agglomeration-facts.ts` (convention versionnée pilotant le classifieur null→uncertain, libellés + fragments de phrase dépendants de la source) alimente une fabrique de 3 règles `agglomeration-rules.ts` encodant trois contrats distincts (2 symétriques, 1 asymétrique). La provenance UU/commune est résolue en UNE fois (`resolveTailleVille` → `{ value, source }`, invariant `value != null ⟺ source != null`) et transportée par `ModuleFacts.tailleVilleSource` (obligatoire côté mapping). Une source absente rend `uncertain`, jamais un repli communal.

**Tech Stack:** TypeScript (ESM, imports `.ts`), `node --test`, Next.js.

## Global Constraints

- **Voix (mémoire, verbatim)** : pas de tiret cadratin `—` ; pas d'antithèse « c'est X, pas Y » ; catégorie factuelle autorisée, jugement absolu interdit (« trop petit », « trop grand », « insuffisant »).
- **Provenance exigée** : `tailleVilleSource` est OBLIGATOIRE au mapping. `tailleVille` présent + `source` absente → `uncertain`, JAMAIS un repli « commune ». Le mot « agglomération » et « appartient à » n'apparaissent que pour `source === "urban_unit"` ; `commune` → « est classée comme … selon sa population communale », libellés sans « agglomération », métropole → « une très grande ville ».
- **Invariant de résolution** : `resolveTailleVille` rend `value != null ⟺ source != null`. Un code UU présent mais absent (ou invalide) du cache → `{ value: null, source: null }`, jamais un repli communal silencieux.
- **Convention gravée, PILOTANT le classifieur** : `agglomeration-size-v1`, seuils `villageMaxExclusive:2000, petiteMaxExclusive:25000, moyenneMaxExclusive:100000, grandeMaxExclusive:500000` (bornes fermées, 500000 → métropole). Le classifieur LIT ces seuils, ne les répète pas.
- **Contrats** : eviter_grandes {village,petite}=satisfied, {moyenne}=neutral, {grande,métropole}=mismatch ; prefere_grande = miroir ; eviter_isolement {village}=mismatch, sinon neutral, **jamais satisfied**.
- **Doctrine de résultat** : satisfied/neutral/mismatch-poids-1 = silencieux (faits vides). mismatch poids 2 → secondary, poids 3 → structuring. Jamais `decision_critical`.
- **Fait source canonique** : les 3 règles partagent `sourceFactIds: ["territorySize.classification"]` (même état territorial), seuls `fact.id`/`ruleId`/`projectKey` diffèrent (prépare la fusion narrative).
- **Ne pas réutiliser `tailleLabel`** (null→"petite", server-only). Aucun système de faits favorables ; dette poids-1 baseline notée, non corrigée.

---

### Task 1 : `agglomeration-facts.ts` — convention, classifieur, libellés, fragment (lib pure)

**Files:**
- Create: `src/lib/decision/agglomeration-facts.ts`
- Test: `src/lib/decision/agglomeration-facts.test.ts`

**Interfaces:**
- Produces:
  - `AGGLOMERATION_CATEGORIES: readonly ["village","petite","moyenne","grande","metropole"]`
  - `type AgglomerationCategory = typeof AGGLOMERATION_CATEGORIES[number]`
  - `AGGLOMERATION_SIZE_CONVENTION` (id + thresholds `*MaxExclusive`)
  - `classifyAgglomerationSize(population: number | null): AgglomerationCategory | "uncertain"`
  - `labelForCategory(cat: AgglomerationCategory, source: "urban_unit" | "commune"): string`
  - `categoryStatementFragment(nom: string, cat: AgglomerationCategory, source: "urban_unit" | "commune"): string`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/decision/agglomeration-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAgglomerationSize, labelForCategory, categoryStatementFragment,
  AGGLOMERATION_SIZE_CONVENTION, AGGLOMERATION_CATEGORIES,
} from "./agglomeration-facts.ts";

test("convention agglomeration-size-v1 gravée + catégories", () => {
  assert.equal(AGGLOMERATION_SIZE_CONVENTION.id, "agglomeration-size-v1");
  assert.deepEqual([...AGGLOMERATION_CATEGORIES], ["village", "petite", "moyenne", "grande", "metropole"]);
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

test("donnée absente ou corrompue -> uncertain", () => {
  assert.equal(classifyAgglomerationSize(null), "uncertain");
  assert.equal(classifyAgglomerationSize(Number.NaN), "uncertain");
  assert.equal(classifyAgglomerationSize(-5), "uncertain");
});

test("libellés dépendants de la source ('agglomération' + 'métropole' seulement en UU)", () => {
  assert.equal(labelForCategory("grande", "urban_unit"), "une grande agglomération");
  assert.equal(labelForCategory("grande", "commune"), "une grande ville");
  assert.equal(labelForCategory("petite", "urban_unit"), "une petite agglomération");
  assert.equal(labelForCategory("petite", "commune"), "une petite commune");
  assert.equal(labelForCategory("metropole", "urban_unit"), "une métropole");
  assert.equal(labelForCategory("metropole", "commune"), "une très grande ville");
  assert.equal(labelForCategory("village", "commune"), "un village");
  assert.equal(labelForCategory("moyenne", "urban_unit"), "une ville moyenne");
});

test("fragment de phrase : 'appartient à' (UU) vs 'est classée comme' (commune)", () => {
  const uu = categoryStatementFragment("Lyon", "metropole", "urban_unit");
  assert.match(uu, /Lyon appartient à une métropole/);
  assert.match(uu, /unité urbaine/);
  const co = categoryStatementFragment("Petiville", "village", "commune");
  assert.match(co, /Petiville est classée comme un village/);
  assert.match(co, /population communale/);
  assert.doesNotMatch(co, /agglomération/);
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run : `node --test src/lib/decision/agglomeration-facts.test.ts`
Expected : FAIL (`Cannot find module './agglomeration-facts.ts'`).

- [ ] **Step 3 : Écrire l'implémentation**

Créer `src/lib/decision/agglomeration-facts.ts` :

```ts
// LA CONVENTION DE TAILLE D'AGGLOMÉRATION, versionnée, son classifieur et ses libellés. PURS.
//
// On NE réutilise PAS `tailleLabel` de comparateur-vie.ts (null -> "petite", repli métier que le chantier A
// a tué ; module server-only). Le dossier exige null -> uncertain et une lib pure. La convention PILOTE le
// classifieur (les seuils ne sont pas répétés), et les catégories sont une constante unique (validateur + type).
export const AGGLOMERATION_CATEGORIES = ["village", "petite", "moyenne", "grande", "metropole"] as const;
export type AgglomerationCategory = (typeof AGGLOMERATION_CATEGORIES)[number];

export const AGGLOMERATION_SIZE_CONVENTION = {
  id: "agglomeration-size-v1",
  // tailleVille = population de l'unité urbaine si disponible, sinon population communale (cf. tailleVilleSource).
  thresholds: {
    villageMaxExclusive: 2_000,
    petiteMaxExclusive: 25_000,
    moyenneMaxExclusive: 100_000,
    grandeMaxExclusive: 500_000,
  },
} as const;

export function classifyAgglomerationSize(
  population: number | null,
): AgglomerationCategory | "uncertain" {
  if (population == null || !Number.isFinite(population) || population < 0) return "uncertain";
  const t = AGGLOMERATION_SIZE_CONVENTION.thresholds;
  if (population < t.villageMaxExclusive) return "village";
  if (population < t.petiteMaxExclusive) return "petite";
  if (population < t.moyenneMaxExclusive) return "moyenne";
  if (population < t.grandeMaxExclusive) return "grande";
  return "metropole";
}

// « agglomération » et « métropole » ne sont légitimes que si la classification repose sur l'unité urbaine.
// En repli « population communale », libellé neutre (« grande ville », « très grande ville », « petite commune »).
export function labelForCategory(cat: AgglomerationCategory, source: "urban_unit" | "commune"): string {
  const uu = source === "urban_unit";
  switch (cat) {
    case "village": return "un village";
    case "petite": return uu ? "une petite agglomération" : "une petite commune";
    case "moyenne": return "une ville moyenne";
    case "grande": return uu ? "une grande agglomération" : "une grande ville";
    case "metropole": return uu ? "une métropole" : "une très grande ville";
  }
}

// Une phrase COMPLÈTE dépendante de la source. Une commune n'« appartient » pas à une catégorie de taille
// (source UU, périmètre agglo) ; elle « est classée comme » (source commune, périmètre communal).
export function categoryStatementFragment(
  nom: string, cat: AgglomerationCategory, source: "urban_unit" | "commune",
): string {
  return source === "urban_unit"
    ? `${nom} appartient à ${labelForCategory(cat, "urban_unit")} selon la population de son unité urbaine et la convention de taille utilisée par futur•e`
    : `${nom} est classée comme ${labelForCategory(cat, "commune")} selon sa population communale`;
}
```

- [ ] **Step 4 : Lancer le test (passe)**

Run : `node --test src/lib/decision/agglomeration-facts.test.ts`
Expected : PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/agglomeration-facts.ts src/lib/decision/agglomeration-facts.test.ts
git commit -m "feat(mismatch): agglomeration-facts (convention pilotant le classifieur + fragments)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2 : provenance de la taille — `resolveTailleVille` + `tailleVilleSource` (obligatoire)

**Files:**
- Modify: `src/lib/commune-attributes.ts` (`resolveTailleVille` avec invariant + validation ; `tailleVilleFrom` délègue)
- Test: `src/lib/commune-attributes.test.ts`
- Modify: `src/lib/comparateur-vie.ts` (`tailleVilleResolvedOf` ; `tailleVilleOf`/`tailleVilleSourceOf` délèguent)
- Modify: `src/lib/decision/decision-fact.ts` (`tailleVilleSource` sur `ModuleFacts`)
- Modify: `src/lib/decision/module-facts-map.ts` (opts OBLIGATOIRE + return)
- Modify: `src/lib/decision/territory-facts.ts` (résolution unique + passage)
- Modify (ripple) : 6 helpers de test (`tailleVilleSource: null`) + 2 e2e (`tailleVilleSource: "commune"`).

**Interfaces:**
- Produces :
  - `resolveTailleVille(uu, population, uuPop): { value: number | null; source: "urban_unit" | "commune" | null }` (invariant `value != null ⟺ source != null`)
  - `tailleVilleResolvedOf(entry): { value; source }`
  - `ModuleFacts.tailleVilleSource: "urban_unit" | "commune" | null` (NON optionnel)

- [ ] **Step 1 : Écrire le test `resolveTailleVille` (échoue)**

Dans `src/lib/commune-attributes.test.ts`, ajouter :

```ts
import { resolveTailleVille, tailleVilleFrom } from "./commune-attributes.ts";

test("resolveTailleVille : UU trouvée -> value UU, source urban_unit", () => {
  assert.deepEqual(resolveTailleVille("59702", 98_000, new Map([["59702", 1_050_000]])),
    { value: 1_050_000, source: "urban_unit" });
});

test("resolveTailleVille : pas d'UU -> value commune, source commune", () => {
  assert.deepEqual(resolveTailleVille(null, 42_000, new Map()), { value: 42_000, source: "commune" });
});

test("resolveTailleVille : UU DÉCLARÉE mais absente du cache -> ANOMALIE, value null source null (pas de repli commune)", () => {
  assert.deepEqual(resolveTailleVille("59702", 42_000, new Map()), { value: null, source: null });
});

test("resolveTailleVille : population UU invalide -> null/null", () => {
  assert.deepEqual(resolveTailleVille("59702", 42_000, new Map([["59702", Number.NaN]])), { value: null, source: null });
});

test("resolveTailleVille : aucune population -> null/null (invariant value<->source)", () => {
  assert.deepEqual(resolveTailleVille(null, null, new Map()), { value: null, source: null });
});

test("tailleVilleFrom délègue à resolveTailleVille (value)", () => {
  assert.equal(tailleVilleFrom("59702", 98_000, new Map([["59702", 1_050_000]])), 1_050_000);
  assert.equal(tailleVilleFrom(null, 42_000, new Map()), 42_000);
  assert.equal(tailleVilleFrom("59702", 42_000, new Map()), null); // anomalie -> null (plus de repli commune)
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run : `node --test src/lib/commune-attributes.test.ts`
Expected : FAIL (`resolveTailleVille` non exporté). Attention : un test EXISTANT pourrait figer l'ancien comportement d'anomalie de `tailleVilleFrom` (UU non trouvée → population). Le mettre à jour (→ null) : c'est le changement voulu (une défaillance du cache ne devient pas une classification communale silencieuse).

- [ ] **Step 3 : `resolveTailleVille` + délégation**

Dans `src/lib/commune-attributes.ts`, remplacer `tailleVilleFrom` par :

```ts
// UNE SEULE vérité pour la taille ET sa provenance. INVARIANT : value != null <=> source != null.
// Une UU déclarée mais absente/invalide du cache est une ANOMALIE (value/source null), jamais un repli
// communal silencieux : sinon une défaillance du cache deviendrait une classification communale fausse.
export function resolveTailleVille(
  uu: string | null | undefined,
  population: number | null | undefined,
  uuPop: Map<string, number>,
): { value: number | null; source: "urban_unit" | "commune" | null } {
  if (uu) {
    const p = uuPop.get(uu);
    if (p == null || !Number.isFinite(p) || p < 0) return { value: null, source: null };
    return { value: p, source: "urban_unit" };
  }
  if (population == null || !Number.isFinite(population) || population < 0) return { value: null, source: null };
  return { value: population, source: "commune" };
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

- [ ] **Step 5 : `tailleVilleResolvedOf` + délégation dans `comparateur-vie.ts`**

Dans `src/lib/comparateur-vie.ts` : ajouter `resolveTailleVille` à l'import `@/lib/commune-attributes`. Remplacer l'INTERNE `function tailleVille(c)` (~ligne 575) et `tailleVilleOf` (~581), et ajouter `tailleVilleSourceOf` :

```ts
// Résolution UNIQUE de la taille ET de sa provenance (jamais deux résolutions qui pourraient diverger).
export function tailleVilleResolvedOf(
  c: IndexCommune,
): { value: number | null; source: "urban_unit" | "commune" | null } {
  return resolveTailleVille(c.uu, c.population, uuPopCache ?? new Map());
}
function tailleVille(c: IndexCommune): number | null {
  return tailleVilleResolvedOf(c).value;
}
export function tailleVilleOf(c: IndexCommune): number | null {
  return tailleVilleResolvedOf(c).value;
}
export function tailleVilleSourceOf(c: IndexCommune): "urban_unit" | "commune" | null {
  return tailleVilleResolvedOf(c).source;
}
```

(On garde `uuPopCache ?? new Map()` : `tailleVille` interne est sur le chemin chaud du scoring, et `tailleVilleOf` ne doit jamais jeter. En pratique le cache est toujours chargé avec l'index.)

- [ ] **Step 6 : Champ `tailleVilleSource` sur `ModuleFacts`**

Dans `src/lib/decision/decision-fact.ts`, dans `ModuleFacts`, après `climat: ClimatFacts | null;` ajouter :

```ts
  // PROVENANCE de tailleVille, chargée par l'appelant (comme tailleVille). NON optionnelle, nullable :
  // "urban_unit" autorise « agglomération » ; "commune" impose « population communale » ; null (taille
  // absente OU anomalie de cache) -> uncertain, jamais une catégorie ni un repli communal.
  tailleVilleSource: "urban_unit" | "commune" | null;
```

- [ ] **Step 7 : Mapping — opts OBLIGATOIRE**

Dans `src/lib/decision/module-facts-map.ts` :

1. `opts` (~ligne 19), source OBLIGATOIRE (pas de `?`) :

```ts
  opts: { hasAddress: boolean; tailleVille: number | null; tailleVilleSource: "urban_unit" | "commune" | null; climat?: ClimatFacts | null },
```

2. Dans le return, après `tailleVille: opts.tailleVille,` (pas de `?? null` : le champ est obligatoire) :

```ts
    tailleVilleSource: opts.tailleVilleSource,
```

- [ ] **Step 8 : Production — résolution unique dans `territory-facts.ts`**

Dans `src/lib/decision/territory-facts.ts` : ajouter `tailleVilleResolvedOf` à l'import comparateur-vie (retirer `tailleVilleOf` s'il n'est plus utilisé ailleurs dans le fichier ; sinon le garder). Remplacer l'appel `mapCommuneToModuleFacts(...)` (~ligne 34) :

```ts
  const resolvedSize = tailleVilleResolvedOf(entry);
  return mapCommuneToModuleFacts(entry, scores, {
    hasAddress: opts.hasAddress,
    tailleVille: resolvedSize.value,
    tailleVilleSource: resolvedSize.source,
    climat: opts.climat ?? null,
  });
```

- [ ] **Step 9 : Réparer les appelants (champ obligatoire)**

`tsc` va signaler chaque construction. Correctifs :

- **6 helpers `ModuleFacts` littéraux** — ajouter `tailleVilleSource: null,` (avant `...over` s'il existe) : `absence-rules.test.ts`, `coast-rules.test.ts`, `materiality-rules.test.ts`, `logement-rules.test.ts`, `hard-constraint-rules.test.ts`, `mismatch-rules.test.ts`.
- **2 e2e appelant le mapper** — ajouter `tailleVilleSource: "commune"` à l'objet opts : `absence-e2e.test.ts:29` et `coast-e2e.test.ts:29` (ils passent `tailleVille: e.population`, donc source commune ; la taille n'y est pas déclarée, aucun effet sur les assertions).

- [ ] **Step 10 : Typage + tests décision**

Run : `npx tsc --noEmit` → 0 erreur (tout littéral/opts restant est signalé nommément).
Run : `node --test src/lib/decision/*.test.ts src/lib/commune-attributes.test.ts` → tout vert.

- [ ] **Step 11 : Commit**

```bash
git add src/lib/commune-attributes.ts src/lib/commune-attributes.test.ts src/lib/comparateur-vie.ts src/lib/decision/decision-fact.ts src/lib/decision/module-facts-map.ts src/lib/decision/territory-facts.ts src/lib/decision/*.test.ts
git commit -m "feat(mismatch): provenance de la taille (resolveTailleVille + tailleVilleSource obligatoire)

Résolution unique { value, source }, invariant value<->source. UU déclarée absente
du cache -> null/null (pas de repli commune silencieux). source obligatoire au mapping ;
absente -> uncertain. Aucun index touché.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 : `agglomeration-rules.ts` — 3 contrats, type, REGISTRY, validateur

**Files:**
- Create: `src/lib/decision/agglomeration-rules.ts`
- Create: `src/lib/decision/agglomeration-rules.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (`CategoricalStateBasis` ; ajouter `"unite_urbaine"` à `EvidenceRef.grain`)
- Modify: `src/lib/decision/materiality-rules.ts` (import + REGISTRY + `assertFactValid`)

**Interfaces:**
- Consumes (Task 1) : `AGGLOMERATION_SIZE_CONVENTION`, `AGGLOMERATION_CATEGORIES`, `classifyAgglomerationSize`, `labelForCategory`, `categoryStatementFragment`, `AgglomerationCategory`.
- Produces : `CategoricalStateBasis`, `AGGLOMERATION_RULES`, `AGGLOMERATION_KEYS`, `TERRITORY_SIZE_FACT_ID = "territorySize.classification"`.

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

test("eviter_grandes_villes : métropole UU + poids 3 -> mismatch STRUCTURANT, categorical_state, grain unite_urbaine", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const f = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000, tailleVilleSource: "urban_unit" }), p, undefined as never).facts[0]!;
  const basis = (f as { basis: { kind: string; observedCategory: string; conventionId: string } }).basis;
  assert.equal(basis.kind, "categorical_state");
  assert.equal(basis.observedCategory, "metropole");
  assert.equal(basis.conventionId, "agglomeration-size-v1");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /appartient à une métropole/);
  assert.doesNotMatch(f.statement, /trop grand|trop petit|insuffisant/i);
  assert.equal(f.evidence[0]!.factId, "territorySize.classification");
  assert.equal(f.evidence[0]!.grain, "unite_urbaine");
  assertFactValid(f, p);
});

test("eviter_grandes_villes : village/petite -> satisfied silencieux ; moyenne -> neutral", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never).outcome, "satisfied");
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 10_000, tailleVilleSource: "urban_unit" }), p, undefined as never).outcome, "satisfied");
  const mid = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 50_000, tailleVilleSource: "urban_unit" }), p, undefined as never);
  assert.equal(mid.outcome, "neutral"); assert.equal(mid.facts.length, 0);
});

test("prefere_grande_ville : miroir (village -> mismatch, grande -> satisfied)", () => {
  const p = project([{ key: "prefere_grande_ville", weight: 2 }]);
  const vil = rule("prefere_grande_ville").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never);
  assert.equal(vil.outcome, "mismatch");
  assert.equal(vil.facts[0]!.materialityTier, "secondary");
  assert.equal(rule("prefere_grande_ville").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: "urban_unit" }), p, undefined as never).outcome, "satisfied");
});

test("eviter_isolement : village -> mismatch + limitation + topic isolement ; JAMAIS satisfied", () => {
  const p = project([{ key: "eviter_isolement", weight: 3 }]);
  const vil = rule("eviter_isolement").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never);
  assert.equal(vil.outcome, "mismatch");
  assert.match(vil.facts[0]!.statement, /sans permettre de conclure à son isolement/);
  assert.match(vil.facts[0]!.limitation!, /bien connecté à une ville proche/);
  assert.match(vil.facts[0]!.topic, /isolement/);
  for (const [pop, src] of [[1_500, "commune"], [10_000, "urban_unit"], [50_000, "urban_unit"], [200_000, "urban_unit"], [1_050_000, "urban_unit"]] as const) {
    assert.notEqual(rule("eviter_isolement").evaluate(facts({ tailleVille: pop, tailleVilleSource: src }), p, undefined as never).outcome, "satisfied");
  }
});

test("provenance : source commune -> 'est classée comme' + 'population communale', jamais 'agglomération' ; grain commune", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const co = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.match(co.statement, /est classée comme une grande ville/);
  assert.match(co.statement, /population communale/);
  assert.doesNotMatch(co.statement, /agglomération/);
  assert.equal(co.evidence[0]!.grain, "commune");
});

test("métropole en source commune -> 'une très grande ville' (jamais 'métropole')", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const co = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 700_000, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.match(co.statement, /une très grande ville/);
  assert.doesNotMatch(co.statement, /métropole/);
});

test("tailleVille null OU source null -> uncertain ; poids 1 -> silencieux ; poids 0 -> not_applicable", () => {
  const p3 = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: null, tailleVilleSource: null }), p3, undefined as never).outcome, "uncertain");
  // taille présente MAIS source absente (anomalie) -> uncertain, jamais un repli commune
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: null }), p3, undefined as never).outcome, "uncertain");
  const p1 = project([{ key: "eviter_grandes_villes", weight: 1 }]);
  const e1 = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000 }), p1, undefined as never);
  assert.equal(e1.outcome, "mismatch"); assert.equal(e1.facts.length, 0);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000 }), project([]), undefined as never).outcome, "not_applicable");
});

test("deux mismatchs (village : prefere_grande + eviter_isolement) partagent le sourceFactId canonique", () => {
  const p = project([{ key: "prefere_grande_ville", weight: 3 }, { key: "eviter_isolement", weight: 2 }]);
  const a = rule("prefere_grande_ville").evaluate(facts({ tailleVille: 900, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  const b = rule("eviter_isolement").evaluate(facts({ tailleVille: 900, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.deepEqual(a.sourceFactIds, ["territorySize.classification"]);
  assert.deepEqual(b.sourceFactIds, ["territorySize.classification"]);
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run : `node --test src/lib/decision/agglomeration-rules.test.ts`
Expected : FAIL (`Cannot find module './agglomeration-rules.ts'`).

- [ ] **Step 3 : Type `CategoricalStateBasis` + grain `unite_urbaine`**

Dans `src/lib/decision/decision-fact.ts` :

1. Élargir le grain de `EvidenceRef` (~ligne 33) :

```ts
  grain: "commune" | "adresse" | "secteur" | "unite_urbaine";
```

2. Ajouter en haut (avec les imports de type) : `import type { AgglomerationCategory } from "./agglomeration-facts.ts";`

3. Remplacer la ligne `MismatchBasis` par (en insérant le type juste avant) :

```ts
// ÉTAT CATÉGORIEL (lot 3b, taille) : l'appartenance à une catégorie de taille EST le fait. Le nombre brut et
// sa provenance vivent dans l'EvidenceRef, pas dans le basis.
export type CategoricalStateBasis = {
  kind: "categorical_state";
  observedCategory: AgglomerationCategory;
  conventionId: string;
};
export type MismatchBasis =
  NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis | CategoricalStateBasis;
```

- [ ] **Step 4 : Créer la fabrique**

Créer `src/lib/decision/agglomeration-rules.ts` :

```ts
// LA FABRIQUE DES 3 RÈGLES DE TAILLE D'AGGLOMÉRATION (categorical_state). PURE.
//
// Trois contrats DISTINCTS : eviter_grandes_villes et prefere_grande_ville SYMÉTRIQUES (la catégorie mesure
// directement la préférence) ; eviter_isolement ASYMÉTRIQUE (proxy faible : village -> mismatch, jamais
// satisfied). Le POIDS gouverne la matérialité. Provenance EXIGÉE : source absente -> uncertain.
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  AGGLOMERATION_SIZE_CONVENTION, classifyAgglomerationSize, labelForCategory, categoryStatementFragment,
  type AgglomerationCategory,
} from "./agglomeration-facts.ts";

const territoireHref = "/rapport/quartier";
// Les 3 règles interprètent LE MÊME état territorial (tailleVille + source -> catégorie). Un fait source
// canonique unique permet à la future fusion de voir que deux mismatchs viennent du même état.
export const TERRITORY_SIZE_FACT_ID = "territorySize.classification";
type Outcome = "satisfied" | "neutral" | "mismatch";

type SizeSpec = {
  key: PreferenceKey;
  topic: string;
  outcomes: Record<AgglomerationCategory, Outcome>;
  buildStatement: (nom: string, fragment: string) => string;
  limitation?: string;
};

const SPECS: SizeSpec[] = [
  {
    key: "eviter_grandes_villes",
    topic: "la taille du territoire",
    outcomes: { village: "satisfied", petite: "satisfied", moyenne: "neutral", grande: "mismatch", metropole: "mismatch" },
    buildStatement: (nom, fragment) =>
      `Vous avez placé le fait d'éviter les grandes villes parmi vos priorités. ${fragment}. Cela répond moins bien à cette dimension de votre projet, sans rendre ${nom} incompatible avec lui.`,
  },
  {
    key: "prefere_grande_ville",
    topic: "la taille du territoire",
    outcomes: { village: "mismatch", petite: "mismatch", moyenne: "neutral", grande: "satisfied", metropole: "satisfied" },
    buildStatement: (nom, fragment) =>
      `Vous avez placé le fait de vivre dans une grande ville parmi vos priorités. ${fragment}. Cela répond moins bien à cette dimension de votre projet, sans rendre ${nom} incompatible avec lui.`,
  },
  {
    key: "eviter_isolement",
    topic: "l'isolement du territoire",
    outcomes: { village: "mismatch", petite: "neutral", moyenne: "neutral", grande: "neutral", metropole: "neutral" },
    buildStatement: (_nom, fragment) =>
      `Vous avez placé le fait d'éviter un environnement isolé parmi vos priorités. ${fragment}. Cette petite taille répond moins bien à cette dimension de votre projet, sans permettre de conclure à son isolement effectif.`,
    limitation:
      "La catégorie de taille utilisée ne décrit pas à elle seule l'accès aux services, aux transports ou aux pôles voisins. Un village peut être bien connecté à une ville proche.",
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
      // Provenance EXIGÉE : une catégorie sans source prouvée n'est pas opposable (jamais un repli commune).
      if (cat === "uncertain" || f.tailleVilleSource == null) {
        return ret("uncertain", [], "taille ou provenance du territoire indisponible");
      }
      const source = f.tailleVilleSource;

      const outcome = spec.outcomes[cat];
      if (outcome !== "mismatch" || weight < 2) {
        const reason = outcome === "mismatch" ? "écart mineur, silencieux (poids 1)"
          : outcome === "satisfied" ? "catégorie recherchée" : "catégorie intermédiaire";
        return ret(outcome, [], reason);
      }

      const tier = weight >= 3 ? "structuring" : "secondary";
      const popText = source === "urban_unit"
        ? `population de l'unité urbaine : environ ${f.tailleVille!.toLocaleString("fr-FR")} habitants`
        : `population communale : environ ${f.tailleVille!.toLocaleString("fr-FR")} habitants`;
      const ev: EvidenceRef = {
        factId: TERRITORY_SIZE_FACT_ID, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `${labelForCategory(cat, source)}, ${popText}`,
        grain: source === "urban_unit" ? "unite_urbaine" : "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${spec.key}`, ruleId: id, sourceFactIds: [TERRITORY_SIZE_FACT_ID],
        module: "territoire", role: "mismatch", projectKey: spec.key, materialityTier: tier,
        topic: spec.topic,
        statement: spec.buildStatement(f.nom, categoryStatementFragment(f.nom, cat, source)),
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

1. Après `import { COAST_RULES } from "./coast-rules.ts";` :

```ts
import { AGGLOMERATION_RULES } from "./agglomeration-rules.ts";
import { AGGLOMERATION_CATEGORIES } from "./agglomeration-facts.ts";
```

2. Dans `REGISTRY`, après `...COAST_RULES,` : `  ...AGGLOMERATION_RULES,`

3. Dans `assertFactValid` case `"mismatch"`, remplacer la branche finale `} else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {` par :

```ts
      } else if (basis.kind === "categorical_state") {
        if (!(AGGLOMERATION_CATEGORIES as readonly string[]).includes(basis.observedCategory)) {
          throw new Error(`[decision] ${fact.ruleId}: catégorie de taille inconnue (${basis.observedCategory})`);
        }
        if (!basis.conventionId) throw new Error(`[decision] ${fact.ruleId}: convention de catégorie absente`);
      } else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {
```

- [ ] **Step 6 : Tests + typage**

Run : `node --test src/lib/decision/agglomeration-rules.test.ts` → PASS (9 tests).
Run : `npx tsc --noEmit` → 0 erreur.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/agglomeration-rules.ts src/lib/decision/agglomeration-rules.test.ts src/lib/decision/decision-fact.ts src/lib/decision/materiality-rules.ts
git commit -m "feat(mismatch): 3 règles de taille (categorical_state), câblées au REGISTRY

CategoricalStateBasis + grain unite_urbaine. eviter/prefere symétriques, eviter_isolement
asymétrique. Provenance exigée (source absente -> uncertain). Fragment 'appartient à'
(UU) vs 'est classée comme' (commune) ; métropole commune -> 'très grande ville'.
Fait source canonique unique (territorySize.classification) pour la future fusion.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4 : `agglomeration-e2e.test.ts` — chaîne bout-en-bout et orientation

**Files:**
- Create: `src/lib/decision/agglomeration-e2e.test.ts`

- [ ] **Step 1 : Écrire le test**

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
function dossierFor(e: IndexCommune, p: UserProject, tailleVille: number | null, source: "urban_unit" | "commune" | null) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille, tailleVilleSource: source });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E eviter_grandes_villes, métropole UU, poids 3 -> carte categorical_state, arbitrage", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, "urban_unit");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = (sec?.facts ?? []).find((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.ok(taille, "une carte de taille doit être présente");
  assert.match(taille!.statement, /appartient à une métropole/);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E eviter_grandes_villes, village -> satisfied favorable, aucune carte", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_200, "commune");
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal((sec?.facts ?? []).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state").length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  assert.equal(crit?.coverage, "examined");
  assert.equal(crit?.outcome, "favorable");
  assert.equal(d.criteria.orientation, "favorable");
});

test("E2E eviter_isolement, village source commune -> carte SANS 'agglomération', jamais 'isolée'", () => {
  const d = dossierFor(entry({ nom: "Petiville" }), project([{ key: "eviter_isolement", weight: 2 }]), 900, "commune");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = (sec?.facts ?? []).find((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.ok(taille, "village -> carte isolement");
  assert.doesNotMatch(taille!.statement, /agglomération/);
  assert.match(taille!.statement, /population communale/);
  assert.match(taille!.statement, /sans permettre de conclure/);
});

test("E2E anomalie : taille présente, source null -> uncertain (aucune carte, non examiné)", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, null);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal((sec?.facts ?? []).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state").length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  assert.notEqual(crit?.coverage, "examined");
});
```

- [ ] **Step 2 : Lancer le test**

Run : `node --test src/lib/decision/agglomeration-e2e.test.ts` → PASS (4 tests).

- [ ] **Step 3 : Commit**

```bash
git add src/lib/decision/agglomeration-e2e.test.ts
git commit -m "test(mismatch): E2E taille (arbitrage, satisfied/favorable, anomalie source null)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5 : consigne taille dans le prompt, bump (v9 → v10), sonde (dont isolement)

**Files:**
- Modify: `src/lib/decision/conclusion-prompt.ts`, `src/lib/decision/conclusion-hash.ts`, `scripts/probe-conclusion.ts`

- [ ] **Step 1 : Consigne taille au prompt**

Dans `conclusion-prompt.ts`, après le bullet mer, insérer :

```ts
- juger en ABSOLU une CATÉGORIE DE TAILLE. Certains mismatchs constatent qu'une commune relève d'une catégorie
  de taille (un village, une ville moyenne, une grande agglomération, une très grande ville) en écart avec une
  préférence déclarée. Nommez la catégorie et l'écart avec la préférence, jamais « trop petit » ni « trop grand »
  en jugement. Ne confondez JAMAIS la taille et l'isolement : une petite taille n'établit pas l'isolement. Pour
  eviter_isolement, n'écrivez jamais « la commune est isolée », gardez « sans permettre de conclure à son
  isolement effectif ». Comme tout mismatch, cela s'ARBITRE, jamais « à vérifier » ;
```

- [ ] **Step 2 : Bump v9 -> v10** dans `conclusion-hash.ts`.

- [ ] **Step 3 : Test de hash**

Run : `node --test src/lib/decision/conclusion-hash.test.ts` → PASS (mettre `"v9"` → `"v10"` si une assertion le fige).

- [ ] **Step 4 : Deux cas de sonde (taille + isolement, le plus risqué)**

Dans `scripts/probe-conclusion.ts`, après `planCoast` :

```ts
function size(id: string, tier: MaterialityTier, topic: string, statement: string, cat: "metropole" | "village"): DecisionFact {
  return {
    id, ruleId: `territoire.taille-${id}`, sourceFactIds: ["territorySize.classification"], module: "territoire",
    topic, statement,
    materialityTier: tier, role: "mismatch", projectKey: id as never,
    basis: { kind: "categorical_state", observedCategory: cat, conventionId: "agglomeration-size-v1" },
    evidence: [{ factId: "territorySize.classification", module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

const planSize = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    size("eviter_grandes_villes", "structuring", "la taille du territoire",
      "Roubaix appartient à une métropole selon la population de son unité urbaine et la convention de taille utilisée par futur•e.", "metropole"),
  ],
  uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null, coverage: "high",
  orientation: "arbitration", hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});

// LE CAS RISQUÉ : le modèle ne doit PAS conclure « la commune est isolée » (généralisation interdite).
const planSizeIsolation = buildConclusionPlan({
  scope: "commune", communeNom: "Petiville", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    size("eviter_isolement", "structuring", "l'isolement du territoire",
      "Petiville est classée comme un village selon sa population communale. Cette petite taille répond moins bien à la priorité d'éviter l'isolement, sans permettre de conclure à son isolement effectif.", "village"),
  ],
  uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null, coverage: "high",
  orientation: "arbitration", hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});
```

Puis, dans la synthèse finale :

```ts
const eSize = await probe(planSize, "taille / catégorie");
const fIso = await probe(planSizeIsolation, "taille / isolement (risqué)");
const R = a.retenus + b.retenus + c.retenus + dCoast.retenus + eSize.retenus + fIso.retenus,
      T = a.total + b.total + c.total + dCoast.total + eSize.total + fIso.total;
```

- [ ] **Step 5 : Typage** — `npx tsc --noEmit` → 0.

- [ ] **Step 6 : Sonde (contrôle éditorial manuel, ANTHROPIC_API_KEY)**

Run : `node --env-file=.env.local scripts/probe-conclusion.ts`
Expected : cas « taille / catégorie » propre (catégorie nommée, jamais « trop grand »). **Cas « taille / isolement » (LECTURE VISUELLE CRITIQUE)** : jamais « la commune est isolée », jamais « à vérifier », le caveat « sans permettre de conclure » survit, aucune généralisation aux services/transports. Si dérapage, ajuster la consigne, pas les seuils.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/conclusion-prompt.ts src/lib/decision/conclusion-hash.ts scripts/probe-conclusion.ts
git commit -m "feat(mismatch): consigne taille dans le prompt + v9 -> v10 + 2 cas de sonde

Consigne: nommer la catégorie, jamais 'trop grand/petit', ne pas confondre taille et
isolement ('la commune est isolée' interdit). Sonde: cas catégorie + cas isolement (risqué).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6 : Vérification finale et passation

**Files:** Modify: `docs/handoff/CURRENT.md`

- [ ] **Step 1 : Suites** — `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert (baseline + agglomeration-facts 5 + agglomeration-rules 9 + agglomeration-e2e 4 + commune-attributes) ; `node --test scripts/lib/*.test.mjs scripts/*.test.mjs` = 22/22.
- [ ] **Step 2 : Typage + build** — `npx tsc --noEmit` = 0 ; `npm run build` exit 0 (aucun `index:verify`).
- [ ] **Step 3 : Handoff** — réécrire `docs/handoff/CURRENT.md` : lot 3b livré sur `feat/mismatch-lot3b-taille`, couverture 23 → 26, `agglomeration-size-v1`, `tailleVilleSource` obligatoire + anomalie→uncertain, fait source canonique, prompt v10, sonde taille+isolement passée. Reste : 2 critères pour 28, fusion de deux mismatchs (la cloche « petit mais pas isolé »), dette poids-1/satisfied implicite, `ProjectFit × DecisionConfidence`.
- [ ] **Step 4 : Commit** handoff.

---

## Notes de couverture (auto-revue plan vs spec + revue porteur)

- **Provenance jamais → commune (repli)** : Task 2 (invariant resolveTailleVille + source obligatoire) + Task 3 (guard `source == null → uncertain`) + tests anomalie.
- **UU absente du cache → null/null** : Task 2 Step 3 + test dédié.
- **Résolution unique** `tailleVilleResolvedOf` : Task 2 Step 5, Step 8.
- **topic/limitation/grain/label dépendants de la source** : Task 1 (labels, fragment) + Task 3 (grain, topic neutre) + tests provenance/métropole-commune.
- **sourceFactId canonique** : Task 3 (`TERRITORY_SIZE_FACT_ID`) + test deux-mismatchs.
- **Convention pilote le classifieur + AGGLOMERATION_CATEGORIES** : Task 1 + validateur Task 3.
- **Sonde isolement** : Task 5 (`planSizeIsolation`).
- **§4 contrats, §6 basis, §8 poids, §9 prompt v10, périmètre 23→26** : Tasks 3, 5.
