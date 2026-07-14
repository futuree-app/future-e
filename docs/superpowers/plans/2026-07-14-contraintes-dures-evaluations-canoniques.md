# Contraintes dures : évaluations canoniques — Plan d'implémentation (chantier A, lot 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax
> for tracking.

**Goal:** Les 11 contraintes dures du lecteur deviennent des **évaluations canoniques** calculées une
seule fois, consommées par le comparateur (qui filtre) et par le dossier (qui explique), pour qu'aucune
condition non négociable ne soit plus jamais ignorée en silence, inventée par le produit, ou jugée
différemment selon l'écran.

**Architecture:** Une lib **pure** (`src/lib/hard-constraints.ts`) porte le contrat et les 11 évaluateurs.
Elle ne connaît ni les cartes du dossier, ni le filtre du comparateur : elle rend un
`HardConstraintAssessment` (`not_declared` / `satisfied` / `incompatible` / `unexamined`). Une couche
d'**hydratation serveur** résout les lieux nommés **au-dessus** des deux moteurs et leur passe le même
objet résolu. Deux **adaptateurs** en tirent deux conduites assumées : le filtre exclut sur donnée
manquante, le dossier ne le peut jamais.

**Tech Stack:** TypeScript, Next.js (App Router), `node --test` (type-stripping natif, aucun runner),
Supabase (non touché par ce lot).

---

## Découpage en deux lots (lire avant de commencer)

Le spec couvre deux sous-systèmes. **Ce plan ne livre que le premier.**

**Lot 1 (ce plan)** : le contrat canonique, les 11 évaluateurs, la résolution des lieux nommés **contre
l'index des communes** (ce que le moteur sait déjà faire), les deux adaptateurs, la parité. À la fin du
lot 1, le produit est **complet et honnête** : « la gare Matabiau » reste non résolue, mais elle est
désormais **déclarée non examinée** au lieu d'être **silencieusement abandonnée**, et le comparateur le
dit au lecteur.

**Lot 2 (plan séparé, à écrire ensuite)** : le géocodage BAN des lieux non communaux, l'isochrone IGN et
la table `reachability_artifact`, la persistance de la référence (`inputHash`, `resolverVersion`), le
read repair, l'ambiguïté posée au lecteur au parse. C'est le lot qui **débloque** « à 30 minutes de la
gare Matabiau ».

Le lot 1 est autonome, testable et déployable seul. Il ne dégrade rien : tout ce que le moteur résout
aujourd'hui (les labels qui **sont** des noms de communes, « près de Brest ») continue d'être résolu.

## Global Constraints

- **Aucun `?? 0`, aucun test de vérité implicite** sur une donnée nullable dans un évaluateur. Une
  altitude de 0, un relief de 0, une distance à la côte de 0 sont des **observations valides**.
- **Un temps de trajet n'est jamais évalué par un haversine.** En lot 1, un seuil `travel_time` rend
  toujours `unexamined`.
- **Un seuil que le produit s'est inventé (50 km, 30 km) ne produit jamais `satisfied` ni
  `incompatible`, et ne filtre jamais.** Il ne peut qu'explorer (`SearchExplorationHint`).
- **`server-only` n'est pas résolvable par `node --test`.** `comparateur-vie.ts` le porte : tout module
  qui l'importe en **valeur** devient non testable. Les libs pures ne l'importent qu'en **type**
  (`import type`).
- **Le noyau partagé ne connaît pas la présentation** : pas d'`EvidenceRef`, pas de `materialityTier`,
  pas de `factId`. Il expose des `evidenceKeys` (`"commune.tailleVille"`).
- **Pas de tiret cadratin** dans la prose et les textes produits (virgule ou deux-points).
- Après chaque tâche : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert et
  `npx tsc --noEmit` rend 0.
- Aucun identifiant, aucun mot de passe, dans le dépôt.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/hard-constraints.ts` **(créé)** | **Le noyau.** PUR. Types du contrat, `PRODUCT_CONVENTIONS`, `NormalizedHardConstraints`, les 11 évaluateurs, le registre exhaustif, `assessHardConstraints`. |
| `src/lib/hard-constraints-resolve.ts` **(créé)** | PUR. Résolution d'un label en référence structurée, **au-dessus d'un `PlaceDirectory`** (interface). Aucun index chargé ici. |
| `src/lib/hard-constraints-hydrate.ts` **(créé)** | PUR. `hydrateHardConstraints(hc, directory)` : l'état hydraté des contraintes. **Reçoit** l'annuaire, ne va jamais le chercher (sinon `comparateur-vie` → hydrate → `comparateur-vie` : un cycle). |
| `src/lib/hard-constraints-filter.ts` **(créé)** | PUR. **L'adaptateur comparateur** : `HardFilterResult` (`eligible` / `complete`). |
| `src/lib/decision/hard-constraint-rules.ts` **(créé)** | PUR. **L'adaptateur dossier** : la fabrique qui transforme un assessment en `RuleEvaluation` + `IncompatibilityFact`. |
| `src/lib/comparateur-vie.ts` **(modifié)** | `passesHard` remplacé par l'adaptateur ; `placeDirectory()` exporté ; `MatchOutcome` gagne `unappliedConstraints`. |
| `src/lib/decision/decision-fact.ts` **(modifié)** | `ModuleFacts` gagne les attributs ; `HardConstraintKey` réexporté depuis le noyau ; `DecisionRule.evaluate` gagne un 3e paramètre. |
| `src/lib/decision/materiality-rules.ts` **(modifié)** | Les 3 règles à contrainte dure (`ruleMer`, `ruleTaille`, `ruleDepartement`) **retirées**, remplacées par `HARD_CONSTRAINT_RULES`. |
| `src/lib/decision/territory-facts.ts` **(modifié)** | Construit le `EvaluationContext` et le passe à `runRules`. |
| `src/lib/parity.test.ts` **(créé)** | Les tests de parité, dans les deux directions. |

---

## Task 1 : Le contrat canonique, et le premier évaluateur (`departements`)

Cette tâche fonde tout : les types, les conventions du produit, le contexte d'évaluation, et le premier
évaluateur qui les exerce.

**Files:**
- Create: `src/lib/hard-constraints.ts`
- Create: `src/lib/hard-constraints.test.ts`

**Interfaces:**
- Consumes: `HardConstraintKey` (aujourd'hui dans `src/lib/decision/decision-fact.ts:14`, **déplacé
  ici**), `HardConstraints` (`src/lib/comparateur-vie.ts:106`, importé **en type seulement**).
- Produces: `CommuneAttributes`, `ConstraintValue`, `UnexaminedReason`, `HardConstraintAssessment<K>`,
  `EvaluationPoint`, `EvaluationContext`, `NormalizedHardConstraints`, `PRODUCT_CONVENTIONS`,
  `PRODUCT_CONVENTIONS_VERSION`, `evaluateDepartements`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `src/lib/hard-constraints.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDepartements,
  type CommuneAttributes,
  type EvaluationContext,
  type NormalizedHardConstraints,
} from "./hard-constraints.ts";

export function commune(over: Partial<CommuneAttributes> = {}): CommuneAttributes {
  return {
    insee: "31555", nom: "Toulouse", dept: "31",
    lat: 43.6045, lon: 1.4442,
    population: 493_465, tailleVille: 1_060_000, uu: "31701",
    altitude: 146, reliefProximite: 0, distanceCoteKm: 150,
    ...over,
  };
}

export function normalized(over: Partial<NormalizedHardConstraints> = {}): NormalizedHardConstraints {
  return {
    departements: null, zones: null, excludeZones: null,
    montagne: false, reliefProche: false,
    nearSea: null, excludeSea: false, communeSize: null,
    nearPlace: null, excludePlace: [], sizeRelativeTo: null,
    ...over,
  };
}

export function ctx(over: Partial<NormalizedHardConstraints> = {}, c = commune()): EvaluationContext {
  return {
    constraints: normalized(over),
    point: { lat: c.lat!, lon: c.lon!, grain: "commune_reference", source: "commune_centroid",
             label: `le point de référence de ${c.nom}` },
    conventionsVersion: "hc-conv-1",
  };
}

test("departements : non déclaré -> not_declared (jamais unexamined)", () => {
  const a = evaluateDepartements(ctx(), commune());
  assert.equal(a.status, "not_declared");
  assert.equal(a.key, "departements");
});

test("departements : dans la liste -> satisfied, avec la valeur observée structurée", () => {
  const a = evaluateDepartements(ctx({ departements: ["31", "81"] }), commune());
  assert.equal(a.status, "satisfied");
  assert.ok(a.status === "satisfied");
  assert.deepEqual(a.observedValue, { kind: "department", value: "31" });
  assert.deepEqual(a.expectedValue, { kind: "departments", value: ["31", "81"] });
  assert.ok(a.evidenceKeys.includes("commune.dept"));
});

test("departements : hors liste -> incompatible, statement qui NOMME la commune et le topic", () => {
  const a = evaluateDepartements(ctx({ departements: ["33"] }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /département 31/);
  assert.match(a.statement, /33/);
  assert.equal(a.topic, "le département de Toulouse");
});

test("departements : dept absent -> unexamined(missing_data), JAMAIS incompatible", () => {
  const a = evaluateDepartements(ctx({ departements: ["31"] }), commune({ dept: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL, `Cannot find module './hard-constraints.ts'`.

- [ ] **Step 3 : Écrire le noyau**

Créer `src/lib/hard-constraints.ts` :

```ts
// LE NOYAU DES CONTRAINTES DURES. Lib PURE : ni server-only, ni réseau, ni index chargé.
//
// Une contrainte dure est évaluée UNE fois, ici, et le résultat est consommé par DEUX moteurs qui en
// tirent deux conduites différentes :
//   - le comparateur FILTRE : dans le doute (donnée absente), il n'a pas le droit de proposer ;
//   - le dossier EXPLIQUE   : dans le doute, il n'a pas le droit de conclure à une incompatibilité.
// C'est la même observation, et deux politiques. Un booléen ne savait pas porter cette différence :
// passesHard rendait `false` aussi bien pour « la commune est à 200 km de la mer que vous exigez » que
// pour « nous ne connaissons pas son altitude ». Le dossier ne pouvait donc rien en faire.
//
// Ce noyau ne connaît PAS la présentation : ni EvidenceRef, ni materialityTier, ni factId. Il expose des
// clés de provenance (evidenceKeys), que chaque moteur habille à sa façon.
import type { HardConstraints } from "./comparateur-vie.ts"; // TYPE SEULEMENT (server-only)

export type HardConstraintKey =
  | "departements" | "zones" | "excludeZones" | "montagne" | "reliefProche"
  | "nearSea" | "excludeSea" | "nearPlace" | "communeSize" | "excludePlace" | "sizeRelativeTo";

export const HARD_CONSTRAINT_KEYS: HardConstraintKey[] = [
  "departements", "zones", "excludeZones", "montagne", "reliefProche",
  "nearSea", "excludeSea", "nearPlace", "communeSize", "excludePlace", "sizeRelativeTo",
];

// ── Les conventions du PRODUIT ───────────────────────────────────────────────
// Elles ne mesurent pas une exigence du lecteur : elles définissent le SENS D'UN MOT (« la montagne »,
// « pas au bord de la mer »). Elles sont donc légitimes, à trois conditions : centralisées, versionnées,
// et NOMMÉES dans le texte qui les applique. Un seuil qu'on n'ose pas dire est un seuil qu'on invente.
export const PRODUCT_CONVENTIONS_VERSION = "hc-conv-1";
export const PRODUCT_CONVENTIONS = {
  excludeSeaMinKm: 15,      // « pas le littoral » = au moins 15 km de la côte
  montagneMinScore: 50,     // « à la montagne » = montagnosité >= 50, soit environ 600 m
  reliefProcheMinScore: 50, // « proche d'une montagne » = un massif à portée
} as const;

// ── Les attributs de la commune ──────────────────────────────────────────────
// TOUT est nullable, et aucun évaluateur n'emploie de test de vérité implicite : une altitude de 0, un
// relief de 0, une distance à la côte de 0 sont des OBSERVATIONS. Le `(c.relief_proximite ?? 0)` de
// passesHard traitait une donnée absente comme un relief nul, donc comme une exclusion.
export type CommuneAttributes = {
  insee: string;
  nom: string;
  dept: string | null;
  lat: number | null;
  lon: number | null;
  population: number | null;   // population COMMUNALE
  tailleVille: number | null;  // taille d'AGGLOMÉRATION (UU si la commune en a une, sinon sa population)
  uu: string | null;
  altitude: number | null;
  reliefProximite: number | null;
  distanceCoteKm: number | null;
};

// ── Les valeurs, structurées ─────────────────────────────────────────────────
// Le noyau porte la DONNÉE, pas seulement une phrase prérédigée : c'est ce qui rend le constat
// testable, comparable, et exportable demain.
export type ConstraintValue =
  | { kind: "distance_km"; value: number }
  | { kind: "travel_time_min"; value: number; mode: "car" | "walk" | "bike" }
  | { kind: "population"; value: number; unit: "urban_unit" | "commune" }
  | { kind: "population_range"; min: number | null; max: number | null; unit: "urban_unit" | "commune" }
  | { kind: "department"; value: string }
  | { kind: "departments"; value: string[] }
  | { kind: "altitude_m"; value: number }
  | { kind: "score"; value: number }
  | { kind: "boolean"; value: boolean };

// ── L'évaluation ─────────────────────────────────────────────────────────────
export type UnexaminedReason =
  | "missing_data"           // la donnée de CETTE commune manque
  | "unresolved_reference"   // le lieu nommé n'a pas pu être identifié
  | "ambiguous_reference"    // plusieurs lieux correspondent au nom
  | "missing_parameter"      // le lieu est identifié, un PARAMÈTRE manque (le mode, la distance)
  | "unsupported_metric"     // la métrique n'est pas calculable honnêtement aujourd'hui
  | "insufficient_precision" // le point tombe dans la bande de tolérance d'une géométrie simplifiée
  | "routing_unavailable";   // échec TECHNIQUE, temporaire. Jamais persisté comme un refus.

export type HardConstraintAssessment<K extends HardConstraintKey = HardConstraintKey> =
  // HORS SUJET : le lecteur ne l'a pas posée. À ne JAMAIS confondre avec unexamined (« nous n'avons
  // pas su l'examiner ») : l'un est un silence légitime, l'autre est un trou de couverture.
  | { key: K; status: "not_declared" }
  | { key: K; status: "satisfied";
      observedValue: ConstraintValue; expectedValue: ConstraintValue;
      observedLabel: string; expectedLabel: string; evidenceKeys: string[] }
  | { key: K; status: "incompatible";
      observedValue: ConstraintValue; expectedValue: ConstraintValue;
      observedLabel: string; expectedLabel: string; evidenceKeys: string[];
      statement: string; // LA DOCTRINE de la contrainte, identique dans les deux moteurs
      topic: string }    // le SUJET, 3 à 6 mots (cf. assertFactValid)
  | { key: K; status: "unexamined"; reason: UnexaminedReason; detail?: string };

// ── Le seuil, et sa provenance ───────────────────────────────────────────────
// Un seuil OPPOSABLE vient du lecteur, et de lui seul. Il n'existe pas de `legacy_default` ici : les
// rayons que le produit s'est inventés (50 km autour d'un lieu, 30 km de la mer) vivent dans
// SearchExplorationHint, hors du contrat dur, et ne peuvent qu'explorer.
export type PlaceThreshold =
  | { metric: "distance"; maxKm: number; source: "user" }
  | { metric: "travel_time"; maxMinutes: number; mode: "car" | "walk" | "bike" | null;
      direction: "to_reference"; source: "user" };

export type SearchExplorationHint = {
  kind: "near_place_radius" | "near_sea_radius";
  valueKm: number;
  source: "legacy_default";
  confirmedByUser: false;
};

// ── Le point réellement testé ────────────────────────────────────────────────
// Il entre dans le CONTEXTE, pour qu'aucun évaluateur ne puisse l'oublier et aller chercher lat/lon en
// douce. « Le point de référence de la commune est à moins de 30 km » ne dit PAS « toute la commune ».
export type EvaluationPoint = {
  lat: number; lon: number;
  grain: "commune_reference" | "address";
  source: "commune_centroid" | "address_geocoder";
  label: string;
};

// Les références résolues sont définies dans hard-constraints-resolve.ts (Task 6) ; le noyau les reçoit
// déjà résolues et ne sait pas les fabriquer.
import type {
  ResolvedPlaceReference, ResolvedUrbanAreaReference, ResolvedSizeReference,
} from "./hard-constraints-resolve.ts";

// L'état HYDRATÉ des contraintes : ce que le lecteur a déclaré, plus ce que la résolution a trouvé.
// `null` (ou `false`, ou `[]`) = NON DÉCLARÉE.
export type NormalizedHardConstraints = {
  departements: string[] | null;
  zones: { hardDepartements: Set<string>; labels: string[] } | null;
  excludeZones: { departements: Set<string>; labels: string[] } | null;
  montagne: boolean;      // seulement strength === "hard"
  reliefProche: boolean;  // seulement strength === "hard"
  nearSea: { threshold: PlaceThreshold | null } | null;
  excludeSea: boolean;
  communeSize: { min: number | null; max: number | null } | null;
  nearPlace: { label: string; threshold: PlaceThreshold | null; reference: ResolvedPlaceReference } | null;
  excludePlace: { label: string; reference: ResolvedUrbanAreaReference }[];
  sizeRelativeTo: { label: string; direction: "smaller" | "larger"; reference: ResolvedSizeReference } | null;
};

export type EvaluationContext = {
  constraints: NormalizedHardConstraints;
  point: EvaluationPoint;
  conventionsVersion: string;
};

// ── Les évaluateurs ──────────────────────────────────────────────────────────

export function evaluateDepartements(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"departements"> {
  const wanted = ctx.constraints.departements;
  if (wanted == null || wanted.length === 0) return { key: "departements", status: "not_declared" };
  if (c.dept == null) return { key: "departements", status: "unexamined", reason: "missing_data" };

  const observedValue: ConstraintValue = { kind: "department", value: c.dept };
  const expectedValue: ConstraintValue = { kind: "departments", value: wanted };
  const observedLabel = `département ${c.dept}`;
  const expectedLabel = wanted.length === 1 ? `le département ${wanted[0]}` : `les départements ${wanted.join(", ")}`;
  const evidenceKeys = ["commune.dept", "project.hardConstraints.departements"];

  if (wanted.includes(c.dept)) {
    return { key: "departements", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "departements", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `le département de ${c.nom}`,
    statement: `Cette commune est dans le département ${c.dept}, hors de ceux que vous avez posés comme condition (${wanted.join(", ")}).`,
  };
}
```

- [ ] **Step 4 : Lancer le test, vérifier qu'il passe**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: PASS, 4 tests.

Note : `hard-constraints-resolve.ts` n'existe pas encore, donc `npx tsc --noEmit` échouera sur son
import. Créer immédiatement le fichier avec les trois types (le corps arrive en Task 6) :

```ts
// src/lib/hard-constraints-resolve.ts
// La RÉSOLUTION d'un lieu nommé en référence structurée. PURE : elle travaille au-dessus d'un
// PlaceDirectory (interface), et ne charge aucun index.
export type ResolutionMetadata = {
  // L'empreinte de l'ENTRÉE : label brut + contexte + type attendu + version du résolveur. Sans elle,
  // remplacer « gare Matabiau » par « gare Saint-Jean » garderait en silence les coordonnées de Toulouse.
  inputHash: string;
  resolverVersion: string;
};

export type ResolvedPlaceReference =
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      kind: "commune" | "station" | "address" | "poi";
      lat: number; lon: number;
      source: "commune_index" | "ban"; sourceId: string | null;
      confidence: "exact" | "high"; meta: ResolutionMetadata }
  | { status: "ambiguous"; originalLabel: string;
      candidates: { canonicalLabel: string; lat: number; lon: number; kind: string }[];
      meta: ResolutionMetadata }
  | { status: "unresolved"; originalLabel: string;
      reason: "no_result" | "low_confidence" | "unsupported_type"; meta: ResolutionMetadata };

export type ResolvedUrbanAreaReference =
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      referenceCommuneInsee: string; urbanUnitCode: string | null; normalizedTerritoryCode: string;
      source: "commune_index" | "plm_table"; meta: ResolutionMetadata }
  | { status: "unresolved"; originalLabel: string; reason: "no_result"; meta: ResolutionMetadata };

export type ResolvedSizeReference =
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      urbanUnitCode: string | null; comparisonPopulation: number; populationYear: number;
      populationKind: "urban_unit" | "isolated_commune";
      source: "commune_index" | "plm_table"; meta: ResolutionMetadata }
  | { status: "unresolved"; originalLabel: string; reason: "no_result"; meta: ResolutionMetadata };
```

Run: `npx tsc --noEmit`
Expected: 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts src/lib/hard-constraints-resolve.ts
git commit -m "feat(hard-constraints): le contrat canonique, et l'évaluateur département

Une contrainte dure est désormais évaluée UNE fois, dans une lib pure, et le
résultat porte ce qu'un booléen ne savait pas dire : not_declared (hors sujet),
satisfied, incompatible, unexamined (et POURQUOI). C'est ce qui permettra au
filtre d'exclure sur donnée manquante pendant que le dossier refuse d'en tirer
une incompatibilité.

Les conventions du produit (15 km du littoral, 600 m de montagne) sont
centralisées et versionnées : un seuil qu'on n'ose pas dire est un seuil qu'on
invente."
```

---

## Task 2 : Les évaluateurs de zone (`zones`, `excludeZones`)

**Files:**
- Modify: `src/lib/hard-constraints.ts`
- Modify: `src/lib/hard-constraints.test.ts`

**Interfaces:**
- Consumes: `EvaluationContext`, `CommuneAttributes` (Task 1). La résolution jeton → départements est
  **déjà pure** : `resolveZoneAnchors` / `resolveExclusions` (`src/lib/geo-zones.ts:257` et `:294`). Elle
  est appelée par l'hydratation (Task 7), pas par l'évaluateur : le noyau reçoit des `Set<string>`.
- Produces: `evaluateZones`, `evaluateExcludeZones`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à `src/lib/hard-constraints.test.ts` :

```ts
import { evaluateZones, evaluateExcludeZones } from "./hard-constraints.ts";

test("zones : non déclarée -> not_declared", () => {
  assert.equal(evaluateZones(ctx(), commune()).status, "not_declared");
});

test("zones : le département est dans le périmètre dur -> satisfied", () => {
  const a = evaluateZones(ctx({ zones: { hardDepartements: new Set(["31", "81"]), labels: ["le Sud-Ouest"] } }), commune());
  assert.equal(a.status, "satisfied");
});

test("zones : hors du périmètre dur -> incompatible, et le périmètre est NOMMÉ", () => {
  const a = evaluateZones(ctx({ zones: { hardDepartements: new Set(["29", "22"]), labels: ["la Bretagne"] } }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Bretagne/);
  assert.equal(a.topic, "la situation de Toulouse dans le périmètre visé");
});

test("zones : dept absent -> unexamined(missing_data)", () => {
  const a = evaluateZones(ctx({ zones: { hardDepartements: new Set(["31"]), labels: ["le Sud-Ouest"] } }), commune({ dept: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("excludeZones : le département est exclu -> incompatible", () => {
  const a = evaluateExcludeZones(ctx({ excludeZones: { departements: new Set(["31"]), labels: ["l'Occitanie"] } }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Occitanie/);
});

test("excludeZones : hors des zones exclues -> satisfied", () => {
  const a = evaluateExcludeZones(ctx({ excludeZones: { departements: new Set(["75"]), labels: ["Paris"] } }), commune());
  assert.equal(a.status, "satisfied");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL, `evaluateZones is not a function`.

- [ ] **Step 3 : Implémenter**

Ajouter à `src/lib/hard-constraints.ts` :

```ts
// « a, b et c » : une énumération française, pas une liste de virgules jusqu'au bout.
function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

export function evaluateZones(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"zones"> {
  const z = ctx.constraints.zones;
  if (z == null || z.hardDepartements.size === 0) return { key: "zones", status: "not_declared" };
  if (c.dept == null) return { key: "zones", status: "unexamined", reason: "missing_data" };

  const perimetre = joinFr(z.labels);
  const observedValue: ConstraintValue = { kind: "department", value: c.dept };
  const expectedValue: ConstraintValue = { kind: "departments", value: [...z.hardDepartements] };
  const observedLabel = `département ${c.dept}`;
  const expectedLabel = perimetre;
  const evidenceKeys = ["commune.dept", "project.hardConstraints.zones"];

  if (z.hardDepartements.has(c.dept)) {
    return { key: "zones", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "zones", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la situation de ${c.nom} dans le périmètre visé`,
    statement: `Cette commune est hors de ${perimetre}, le périmètre que vous avez posé comme condition.`,
  };
}

export function evaluateExcludeZones(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"excludeZones"> {
  const z = ctx.constraints.excludeZones;
  if (z == null || z.departements.size === 0) return { key: "excludeZones", status: "not_declared" };
  if (c.dept == null) return { key: "excludeZones", status: "unexamined", reason: "missing_data" };

  const zonesLabel = joinFr(z.labels);
  const observedValue: ConstraintValue = { kind: "department", value: c.dept };
  const expectedValue: ConstraintValue = { kind: "departments", value: [...z.departements] };
  const evidenceKeys = ["commune.dept", "project.hardConstraints.excludeZones"];
  const observedLabel = `département ${c.dept}`;
  const expectedLabel = zonesLabel;

  if (!z.departements.has(c.dept)) {
    return { key: "excludeZones", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "excludeZones", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la situation de ${c.nom} dans une zone que vous écartez`,
    statement: `Cette commune se trouve dans ${zonesLabel}, que vous avez écarté de votre recherche.`,
  };
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints.test.ts` → PASS (10 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts
git commit -m "feat(hard-constraints): les évaluateurs de zone, qui NOMMENT le périmètre

« Cette commune est hors de la Bretagne » : le périmètre est dit avec le mot du
lecteur, pas avec une liste de codes de départements."
```

---

## Task 3 : Les évaluateurs de relief (`montagne`, `reliefProche`)

C'est ici que le `?? 0` de `passesHard` est corrigé.

**Files:**
- Modify: `src/lib/hard-constraints.ts`
- Modify: `src/lib/hard-constraints.test.ts`

**Interfaces:**
- Consumes: `PRODUCT_CONVENTIONS` (Task 1).
- Produces: `evaluateMontagne`, `evaluateReliefProche`, `montagnosite` (exportée : la courbe est la même
  que celle du comparateur, et le comparateur la réimportera).

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { evaluateMontagne, evaluateReliefProche, montagnosite } from "./hard-constraints.ts";

test("montagnosite : la courbe du comparateur, à l'identique", () => {
  assert.equal(montagnosite(300), 0);
  assert.equal(montagnosite(600), 50);
  assert.equal(montagnosite(1000), 85);
  assert.equal(montagnosite(1400), 100);
  assert.equal(montagnosite(null), null);
});

test("montagne : altitude suffisante -> satisfied", () => {
  const a = evaluateMontagne(ctx({ montagne: true }), commune({ altitude: 900 }));
  assert.equal(a.status, "satisfied");
});

test("montagne : altitude insuffisante -> incompatible, la CONVENTION est nommée", () => {
  const a = evaluateMontagne(ctx({ montagne: true }), commune({ altitude: 146 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /146 m/);
  assert.match(a.statement, /600 m/); // la convention est DITE, jamais appliquée en silence
});

test("montagne : altitude ABSENTE -> unexamined(missing_data), jamais incompatible", () => {
  const a = evaluateMontagne(ctx({ montagne: true }), commune({ altitude: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("reliefProche : relief à ZÉRO est une OBSERVATION -> incompatible (pas une absence)", () => {
  const a = evaluateReliefProche(ctx({ reliefProche: true }), commune({ reliefProximite: 0 }));
  assert.ok(a.status === "incompatible");
});

test("reliefProche : relief ABSENT -> unexamined(missing_data). C'est le bug du `?? 0`.", () => {
  const a = evaluateReliefProche(ctx({ reliefProche: true }), commune({ reliefProximite: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("reliefProche : massif à portée -> satisfied", () => {
  assert.equal(evaluateReliefProche(ctx({ reliefProche: true }), commune({ reliefProximite: 69 })).status, "satisfied");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL, `evaluateMontagne is not a function`.

- [ ] **Step 3 : Implémenter**

Ajouter à `src/lib/hard-constraints.ts` :

```ts
// La courbe de montagnosité, IDENTIQUE à celle du comparateur (comparateur-vie.ts:378). Elle vient ici
// parce que c'est la DOCTRINE du mot « montagne » ; le comparateur la réimporte, il ne la redéfinit pas.
const MONTAGNE_ANCHORS: [number, number][] = [[300, 0], [600, 50], [1000, 85], [1400, 100]];
export function montagnosite(alt: number | null | undefined): number | null {
  if (alt == null) return null;
  const a = MONTAGNE_ANCHORS;
  if (alt <= a[0]![0]) return a[0]![1];
  if (alt >= a[a.length - 1]![0]) return a[a.length - 1]![1];
  for (let i = 0; i < a.length - 1; i++) {
    const [x0, y0] = a[i]!;
    const [x1, y1] = a[i + 1]!;
    if (alt <= x1) return y0 + ((alt - x0) / (x1 - x0)) * (y1 - y0);
  }
  return a[a.length - 1]![1];
}

// Le seuil de la convention, exprimé en MÈTRES pour le lecteur (la montagnosité est un score interne :
// « votre exigence de montagne n'est pas respectée, montagnosité 12/100 » ne veut rien dire pour lui).
const MONTAGNE_MIN_M = 600;

export function evaluateMontagne(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"montagne"> {
  if (!ctx.constraints.montagne) return { key: "montagne", status: "not_declared" };
  if (c.altitude == null) return { key: "montagne", status: "unexamined", reason: "missing_data" };

  const m = montagnosite(c.altitude);
  const observedValue: ConstraintValue = { kind: "altitude_m", value: c.altitude };
  const expectedValue: ConstraintValue = { kind: "altitude_m", value: MONTAGNE_MIN_M };
  const observedLabel = `${Math.round(c.altitude)} m`;
  const expectedLabel = `au moins ${MONTAGNE_MIN_M} m`;
  const evidenceKeys = ["commune.altitude", "project.hardConstraints.montagne"];

  if (m != null && m >= PRODUCT_CONVENTIONS.montagneMinScore) {
    return { key: "montagne", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "montagne", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `l'altitude de ${c.nom}`,
    statement: `Cette commune se situe à ${Math.round(c.altitude)} m d'altitude. Votre exigence de montagne est ici entendue comme une altitude d'au moins ${MONTAGNE_MIN_M} m.`,
  };
}

export function evaluateReliefProche(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"reliefProche"> {
  if (!ctx.constraints.reliefProche) return { key: "reliefProche", status: "not_declared" };
  // LE BUG CORRIGÉ : passesHard écrit `(c.relief_proximite ?? 0) < 50`, donc une donnée ABSENTE devient
  // un relief NUL, donc une exclusion. Pour un filtre, c'est une prudence. Pour un dossier, ce serait
  // affirmer au lecteur que sa montagne n'est pas là alors qu'on ne l'a pas regardée.
  if (c.reliefProximite == null) return { key: "reliefProche", status: "unexamined", reason: "missing_data" };

  const observedValue: ConstraintValue = { kind: "score", value: c.reliefProximite };
  const expectedValue: ConstraintValue = { kind: "score", value: PRODUCT_CONVENTIONS.reliefProcheMinScore };
  const observedLabel = `${Math.round(c.reliefProximite)}/100`;
  const expectedLabel = `au moins ${PRODUCT_CONVENTIONS.reliefProcheMinScore}/100`;
  const evidenceKeys = ["commune.reliefProximite", "project.hardConstraints.reliefProche"];

  if (c.reliefProximite >= PRODUCT_CONVENTIONS.reliefProcheMinScore) {
    return { key: "reliefProche", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "reliefProche", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la proximité du relief autour de ${c.nom}`,
    statement: "Aucun massif n'est à portée de cette commune, alors que vous avez posé la proximité du relief comme condition.",
  };
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints.test.ts` → PASS (17 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts
git commit -m "feat(hard-constraints): relief et montagne, sans le ?? 0

passesHard écrit (relief ?? 0) < 50 : une donnée ABSENTE y devient un relief NUL,
donc une exclusion. Pour un filtre, c'est une prudence acceptable. Pour un
dossier, ce serait affirmer au lecteur que sa montagne n'est pas là alors qu'on
ne l'a jamais regardée. Le noyau rend unexamined(missing_data) ; c'est
l'adaptateur comparateur qui, LUI, choisira d'exclure.

La convention (600 m) est DITE dans la phrase, jamais appliquée en silence."
```

---

## Task 4 : Les évaluateurs de mer (`nearSea`, `excludeSea`)

C'est ici que le seuil inventé de 30 km sort du contrat dur.

**Files:**
- Modify: `src/lib/hard-constraints.ts`
- Modify: `src/lib/hard-constraints.test.ts`

**Interfaces:**
- Consumes: `PlaceThreshold`, `PRODUCT_CONVENTIONS`.
- Produces: `evaluateNearSea`, `evaluateExcludeSea`.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { evaluateNearSea, evaluateExcludeSea } from "./hard-constraints.ts";

test("nearSea : non déclarée -> not_declared", () => {
  assert.equal(evaluateNearSea(ctx(), commune()).status, "not_declared");
});

test("nearSea : DÉCLARÉE SANS DISTANCE -> unexamined(missing_parameter), JAMAIS les 30 km inventés", () => {
  const a = evaluateNearSea(ctx({ nearSea: { threshold: null } }), commune({ distanceCoteKm: 200 }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_parameter");
});

test("nearSea : sous le seuil déclaré -> satisfied", () => {
  const a = evaluateNearSea(ctx({ nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }), commune({ distanceCoteKm: 12 }));
  assert.equal(a.status, "satisfied");
});

test("nearSea : au-delà du seuil déclaré -> incompatible", () => {
  const a = evaluateNearSea(ctx({ nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }), commune({ distanceCoteKm: 150 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /150 km/);
  assert.match(a.statement, /30 km/);
  assert.equal(a.topic, "la distance de Toulouse au littoral");
});

test("nearSea : un seuil en TEMPS DE TRAJET n'est jamais évalué par un haversine", () => {
  const a = evaluateNearSea(
    ctx({ nearSea: { threshold: { metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user" } } }),
    commune({ distanceCoteKm: 150 }),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unsupported_metric");
});

test("nearSea : distance à la côte absente -> unexamined(missing_data)", () => {
  const a = evaluateNearSea(ctx({ nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }), commune({ distanceCoteKm: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("excludeSea : trop près de la côte -> incompatible, la convention (15 km) est DITE", () => {
  const a = evaluateExcludeSea(ctx({ excludeSea: true }), commune({ distanceCoteKm: 4 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /15 km/);
});

test("excludeSea : assez loin -> satisfied", () => {
  assert.equal(evaluateExcludeSea(ctx({ excludeSea: true }), commune({ distanceCoteKm: 80 })).status, "satisfied");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL, `evaluateNearSea is not a function`.

- [ ] **Step 3 : Implémenter**

```ts
export function evaluateNearSea(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"nearSea"> {
  const ns = ctx.constraints.nearSea;
  if (ns == null) return { key: "nearSea", status: "not_declared" };

  // LE SEUIL INVENTÉ, RETIRÉ. passesHard écrivait `?? 30` : un lecteur qui disait « il nous faut la mer »
  // sans préciser voyait le moteur filtrer à 30 km, un chiffre que le produit avait choisi pour lui, et
  // que rien n'affichait nulle part. On ne le remplace pas, on le DEMANDE (cf. le lot 2 : une ambiguïté
  // posée au parse).
  if (ns.threshold == null) return { key: "nearSea", status: "unexamined", reason: "missing_parameter" };
  if (ns.threshold.metric !== "distance") return { key: "nearSea", status: "unexamined", reason: "unsupported_metric" };
  if (c.distanceCoteKm == null) return { key: "nearSea", status: "unexamined", reason: "missing_data" };

  const max = ns.threshold.maxKm;
  const km = Math.round(c.distanceCoteKm);
  const observedValue: ConstraintValue = { kind: "distance_km", value: c.distanceCoteKm };
  const expectedValue: ConstraintValue = { kind: "distance_km", value: max };
  const observedLabel = `${km} km`;
  const expectedLabel = `moins de ${max} km`;
  const evidenceKeys = ["commune.distanceCoteKm", "project.hardConstraints.nearSea"];

  if (c.distanceCoteKm <= max) {
    return { key: "nearSea", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "nearSea", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la distance de ${c.nom} au littoral`,
    statement: `Cette commune est à ${km} km du littoral, au-delà de la limite de ${max} km que vous avez posée.`,
  };
}

export function evaluateExcludeSea(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"excludeSea"> {
  if (!ctx.constraints.excludeSea) return { key: "excludeSea", status: "not_declared" };
  if (c.distanceCoteKm == null) return { key: "excludeSea", status: "unexamined", reason: "missing_data" };

  const min = PRODUCT_CONVENTIONS.excludeSeaMinKm;
  const km = Math.round(c.distanceCoteKm);
  const observedValue: ConstraintValue = { kind: "distance_km", value: c.distanceCoteKm };
  const expectedValue: ConstraintValue = { kind: "distance_km", value: min };
  const observedLabel = `${km} km`;
  const expectedLabel = `au moins ${min} km`;
  const evidenceKeys = ["commune.distanceCoteKm", "project.hardConstraints.excludeSea"];

  if (c.distanceCoteKm >= min) {
    return { key: "excludeSea", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "excludeSea", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la proximité de ${c.nom} au littoral`,
    statement: `Cette commune est à ${km} km de la côte. Votre souhait de ne pas habiter près du littoral est ici entendu comme une distance d'au moins ${min} km.`,
  };
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints.test.ts` → PASS (25 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts
git commit -m "feat(hard-constraints): la mer, sans les 30 km que personne n'avait demandés

« Il nous faut la mer », sans préciser : le moteur filtrait à 30 km (?? 30), un
chiffre choisi par le produit, affiché nulle part, et opposé au lecteur comme
s'il venait de lui. Il ne peut plus produire ni satisfied ni incompatible :
unexamined(missing_parameter). On demandera la distance, on ne la devinera pas.

excludeSea garde ses 15 km, mais les DIT : c'est une convention de sens, pas un
seuil personnel."
```

---

## Task 5 : L'évaluateur `communeSize` (la divergence doctrinale, corrigée)

**Files:**
- Modify: `src/lib/hard-constraints.ts`
- Modify: `src/lib/hard-constraints.test.ts`

**Interfaces:**
- Produces: `evaluateCommuneSize`.

**Le point délicat** : `passesHard` évalue la taille sur `tailleVille` (la population de l'**unité
urbaine**, doctrine du chantier C) ; `ruleTaille` du dossier l'évalue sur la population **communale**.
Les deux moteurs se contredisent déjà. Le noyau tranche pour l'agglomération, et **le texte le dit**.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { evaluateCommuneSize } from "./hard-constraints.ts";

test("communeSize : dans les bornes -> satisfied", () => {
  const a = evaluateCommuneSize(ctx({ communeSize: { min: null, max: 2_000_000 } }), commune());
  assert.equal(a.status, "satisfied");
});

test("communeSize : LA DIVERGENCE — évaluée sur l'AGGLOMÉRATION, pas sur la population communale", () => {
  // 8 000 habitants dans l'unité urbaine de Lyon : le comparateur l'excluait, le dossier la déclarait
  // satisfaite. Le comparateur avait raison.
  const petite = commune({ nom: "Saint-Truc", population: 8_000, tailleVille: 1_600_000, uu: "00760" });
  const a = evaluateCommuneSize(ctx({ communeSize: { min: null, max: 25_000 } }), petite);
  assert.ok(a.status === "incompatible");
  assert.deepEqual(a.observedValue, { kind: "population", value: 1_600_000, unit: "urban_unit" });
  // Le TEXTE parle d'agglomération : la promesse doit correspondre à la donnée réellement évaluée.
  assert.match(a.statement, /agglomération/);
  assert.doesNotMatch(a.statement, /Cette commune compte 8 000 habitants/);
});

test("communeSize : sous la borne min -> incompatible", () => {
  const a = evaluateCommuneSize(ctx({ communeSize: { min: 100_000, max: null } }), commune({ tailleVille: 4_000 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /100 000/);
});

test("communeSize : tailleVille absente -> unexamined(missing_data)", () => {
  const a = evaluateCommuneSize(ctx({ communeSize: { min: null, max: 25_000 } }), commune({ tailleVille: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL, `evaluateCommuneSize is not a function`.

- [ ] **Step 3 : Implémenter**

```ts
// Formatage déterministe des milliers (espace ASCII, jamais toLocaleString qui varie selon l'hôte).
function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function evaluateCommuneSize(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"communeSize"> {
  const cs = ctx.constraints.communeSize;
  if (cs == null || (cs.min == null && cs.max == null)) return { key: "communeSize", status: "not_declared" };
  // LA TAILLE SE LIT SUR L'AGGLOMÉRATION (doctrine du chantier C), et le comparateur le faisait déjà.
  // Le dossier lisait la population COMMUNALE : une commune de 8 000 habitants dans l'unité urbaine de
  // Lyon était exclue par l'un et déclarée conforme par l'autre.
  if (c.tailleVille == null) return { key: "communeSize", status: "unexamined", reason: "missing_data" };

  const t = c.tailleVille;
  const unit = c.uu ? "urban_unit" : "commune";
  const observedValue: ConstraintValue = { kind: "population", value: t, unit };
  const expectedValue: ConstraintValue = { kind: "population_range", min: cs.min, max: cs.max, unit: "urban_unit" };
  const observedLabel = `${fmt(t)} hab.`;
  const expectedLabel =
    cs.min != null && cs.max != null ? `entre ${fmt(cs.min)} et ${fmt(cs.max)} habitants`
    : cs.max != null ? `moins de ${fmt(cs.max)} habitants`
    : `plus de ${fmt(cs.min!)} habitants`;
  const evidenceKeys = ["commune.tailleVille", "project.hardConstraints.communeSize"];

  const over = cs.max != null && t > cs.max;
  const under = cs.min != null && t < cs.min;
  if (!over && !under) {
    return { key: "communeSize", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }

  // Le SUJET de la phrase suit la donnée réellement lue : l'agglomération quand la commune en a une,
  // la commune quand elle est son propre bassin. Dire « cette commune compte 1 600 000 habitants »
  // serait faux ; dire « cette commune compte 8 000 habitants » alors qu'on a jugé sur 1 600 000 serait
  // pire : ce serait juger sur une donnée et en montrer une autre.
  const sujet = c.uu ? `L'agglomération à laquelle appartient ${c.nom} compte` : "Cette commune compte";
  const seuil = over ? `au-dessus de ${fmt(cs.max!)}` : `en dessous de ${fmt(cs.min!)}`;
  return {
    key: "communeSize", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: c.uu ? `la taille de l'agglomération de ${c.nom}` : `la taille de ${c.nom}`,
    statement: `${sujet} ${fmt(t)} habitants, ${seuil} de la taille que vous avez posée.`,
  };
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints.test.ts` → PASS (29 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts
git commit -m "feat(hard-constraints): la taille se lit sur l'agglomération, dans les DEUX moteurs

Le comparateur jugeait la taille sur l'unité urbaine, le dossier sur la
population communale. Une commune de 8 000 habitants dans l'agglomération de
Lyon était EXCLUE par l'un et déclarée CONFORME par l'autre, pour le même
projet. Le comparateur avait raison (doctrine du chantier C).

Et le texte suit la donnée : « l'agglomération à laquelle appartient X compte
1 600 000 habitants ». Juger sur une donnée et en montrer une autre serait pire
que la divergence elle-même."
```

---

## Task 6 : La résolution des lieux nommés (pure, au-dessus d'un annuaire)

**Files:**
- Modify: `src/lib/hard-constraints-resolve.ts` (les types existent depuis Task 1 ; on ajoute le corps)
- Create: `src/lib/hard-constraints-resolve.test.ts`

**Interfaces:**
- Consumes: rien (aucun index chargé, aucun réseau).
- Produces: `PlaceDirectory`, `DirectoryEntry`, `RESOLVER_VERSION`, `resolutionInputHash`,
  `resolveNearPlace`, `resolveUrbanArea`, `resolveSizeReference`, `normalizeName`.

**Note d'implémentation** : `normalizeName` est copiée de `comparateur-vie.ts:1049` **à l'identique**
(elle est déjà pure). Le comparateur la réimportera d'ici (Task 8) pour qu'il n'en existe qu'une.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveNearPlace, resolveUrbanArea, resolveSizeReference, resolutionInputHash,
  type PlaceDirectory, type DirectoryEntry,
} from "./hard-constraints-resolve.ts";

const BREST: DirectoryEntry = { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 210_000 };
const LYON: DirectoryEntry = { insee: "69123", nom: "Lyon", lat: 45.75, lon: 4.85, uu: "00760", tailleVille: 1_600_000 };

const dir: PlaceDirectory = {
  byName: (label) => {
    const k = label.trim().toLowerCase();
    if (k === "brest") return BREST;
    if (k === "lyon") return LYON;
    return null;
  },
  plmByName: (label) => (label.trim().toLowerCase() === "lyon" ? { uu: "00760", pop: 522_250 } : null),
};

test("nearPlace : un nom de commune se résout, avec sa provenance", () => {
  const r = resolveNearPlace("Brest", dir, { context: "" });
  assert.equal(r.status, "resolved");
  assert.ok(r.status === "resolved");
  assert.equal(r.kind, "commune");
  assert.equal(r.source, "commune_index");
  assert.equal(r.lat, 48.39);
  assert.equal(r.confidence, "exact");
});

test("nearPlace : « Gare Matabiau » N'EST PAS une commune -> unresolved (lot 1 : jamais deviné)", () => {
  const r = resolveNearPlace("Gare Matabiau", dir, { context: "" });
  assert.ok(r.status === "unresolved");
  assert.equal(r.reason, "no_result");
});

test("excludePlace : PLM -> le territoire normalisé est l'unité urbaine parente", () => {
  const r = resolveUrbanArea("Lyon", dir, { context: "" });
  assert.ok(r.status === "resolved");
  assert.equal(r.urbanUnitCode, "00760");
  assert.equal(r.source, "plm_table");
});

test("sizeRelativeTo : la population de référence est celle de l'AGGLOMÉRATION, avec son année", () => {
  const r = resolveSizeReference("Brest", dir, { context: "" });
  assert.ok(r.status === "resolved");
  assert.equal(r.comparisonPopulation, 210_000);
  assert.equal(r.populationKind, "urban_unit");
  assert.equal(r.populationYear, 2021);
});

test("inputHash : change quand le LABEL change (« Matabiau » ne peut pas garder les coords de « Saint-Jean »)", () => {
  const a = resolutionInputHash("Gare Matabiau", "31", "place");
  const b = resolutionInputHash("Gare Saint-Jean", "31", "place");
  assert.notEqual(a, b);
});

test("inputHash : change quand le CONTEXTE territorial change", () => {
  assert.notEqual(resolutionInputHash("Saint-Jean", "31", "place"), resolutionInputHash("Saint-Jean", "33", "place"));
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints-resolve.test.ts`
Expected: FAIL, `resolveNearPlace is not a function`.

- [ ] **Step 3 : Implémenter (ajouter sous les types déjà présents)**

```ts
import { createHash } from "node:crypto";

// L'ANNUAIRE : une interface, pas un index. Le noyau de résolution ne charge rien, ne lit aucun fichier,
// ne fait aucun réseau. `comparateur-vie.placeDirectory()` l'implémente sur l'index (Task 8).
export type DirectoryEntry = {
  insee: string; nom: string; lat: number; lon: number;
  uu: string | null;
  tailleVille: number | null; // population d'agglomération (UU), ou communale si hors UU
};
export type PlaceDirectory = {
  byName(label: string): DirectoryEntry | null;
  plmByName(label: string): { uu: string; pop: number } | null; // Paris / Lyon / Marseille
};

export const RESOLVER_VERSION = "resolve-1"; // lot 1 : index des communes seulement, aucun géocodage
// L'année de la population de l'index (INSEE, millésime 2021 : cf. scripts/populate-*, croissance 2015-2021).
export const INDEX_POPULATION_YEAR = 2021;

export function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// L'EMPREINTE DE L'ENTRÉE. Sans elle, `resolved` présent voudrait dire « ne rien refaire », et remplacer
// « gare Matabiau » par « gare Saint-Jean » garderait en silence les coordonnées de Toulouse.
export function resolutionInputHash(label: string, context: string, kind: string): string {
  return createHash("sha256")
    .update([normalizeName(label), context, kind, RESOLVER_VERSION].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export type ResolutionInput = { context: string }; // départements déclarés, commune du rapport…

function meta(label: string, input: ResolutionInput, kind: string): ResolutionMetadata {
  return { inputHash: resolutionInputHash(label, input.context, kind), resolverVersion: RESOLVER_VERSION };
}

export function resolveNearPlace(
  label: string, dir: PlaceDirectory, input: ResolutionInput,
): ResolvedPlaceReference {
  const m = meta(label, input, "place");
  const hit = dir.byName(normalizeName(label));
  if (!hit) {
    // LOT 1 : on ne devine pas. « Gare Matabiau » n'est pas une commune, donc la référence n'est pas
    // résolue, et elle est DÉCLARÉE telle. Le comparateur la sautait en silence ; il ne le pourra plus.
    return { status: "unresolved", originalLabel: label, reason: "no_result", meta: m };
  }
  return {
    status: "resolved", originalLabel: label, canonicalLabel: hit.nom, kind: "commune",
    lat: hit.lat, lon: hit.lon, source: "commune_index", sourceId: hit.insee, confidence: "exact", meta: m,
  };
}

export function resolveUrbanArea(
  label: string, dir: PlaceDirectory, input: ResolutionInput,
): ResolvedUrbanAreaReference {
  const m = meta(label, input, "urban_area");
  const key = normalizeName(label);
  const plm = dir.plmByName(key);
  if (plm) {
    return {
      status: "resolved", originalLabel: label, canonicalLabel: label,
      referenceCommuneInsee: "", urbanUnitCode: plm.uu, normalizedTerritoryCode: `uu:${plm.uu}`,
      source: "plm_table", meta: m,
    };
  }
  const hit = dir.byName(key);
  if (!hit) return { status: "unresolved", originalLabel: label, reason: "no_result", meta: m };
  return {
    status: "resolved", originalLabel: label, canonicalLabel: hit.nom,
    referenceCommuneInsee: hit.insee,
    urbanUnitCode: hit.uu,
    // Une ville hors unité urbaine est son propre périmètre : on exclut la commune, pas une agglo.
    normalizedTerritoryCode: hit.uu ? `uu:${hit.uu}` : `insee:${hit.insee}`,
    source: "commune_index", meta: m,
  };
}

export function resolveSizeReference(
  label: string, dir: PlaceDirectory, input: ResolutionInput,
): ResolvedSizeReference {
  const m = meta(label, input, "size");
  const key = normalizeName(label);
  const hit = dir.byName(key);
  if (!hit || hit.tailleVille == null) {
    return { status: "unresolved", originalLabel: label, reason: "no_result", meta: m };
  }
  return {
    status: "resolved", originalLabel: label, canonicalLabel: hit.nom,
    urbanUnitCode: hit.uu,
    comparisonPopulation: hit.tailleVille,
    populationYear: INDEX_POPULATION_YEAR,
    populationKind: hit.uu ? "urban_unit" : "isolated_commune",
    source: "commune_index", meta: m,
  };
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints-resolve.test.ts` → PASS (6 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Vérifier l'année de population de l'index**

Ouvrir `data/comparateur-index.json` (champ de version / métadonnées) ou le script qui le construit,
et **confirmer que la population est bien le millésime 2021**. Si elle diffère, corriger
`INDEX_POPULATION_YEAR` et le test. **Ne pas inventer une année.**

```bash
node -e "const f=require('./data/comparateur-index.json'); console.log(Object.keys(f).filter(k=>k!=='communes'), JSON.stringify(f.meta ?? f.version ?? null))"
```

- [ ] **Step 6 : Commit**

```bash
git add src/lib/hard-constraints-resolve.ts src/lib/hard-constraints-resolve.test.ts
git commit -m "feat(hard-constraints): la résolution d'un lieu nommé, pure, au-dessus d'un annuaire

Trois références DISTINCTES, parce qu'un point ne suffit pas : nearPlace veut des
coordonnées, excludePlace une unité urbaine, sizeRelativeTo une population de
référence (avec son année et sa nature). Leur donner le même type obligerait
leur évaluateur à rouvrir un index au runtime, et les deux moteurs cesseraient
de lire la même chose.

resolutionInputHash porte l'ENTRÉE (label + contexte + type + version) : sans
lui, remplacer « gare Matabiau » par « gare Saint-Jean » garderait en silence
les coordonnées de Toulouse."
```

---

## Task 7 : Les 3 évaluateurs à référence nommée, et le registre exhaustif

**Files:**
- Modify: `src/lib/hard-constraints.ts`
- Modify: `src/lib/hard-constraints.test.ts`

**Interfaces:**
- Consumes: `ResolvedPlaceReference`, `ResolvedUrbanAreaReference`, `ResolvedSizeReference` (Task 6).
- Produces: `evaluateNearPlace`, `evaluateExcludePlace`, `evaluateSizeRelativeTo`, `haversineKm`,
  `HARD_CONSTRAINT_EVALUATORS`, `assessHardConstraints`.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import {
  evaluateNearPlace, evaluateExcludePlace, evaluateSizeRelativeTo,
  assessHardConstraints, HARD_CONSTRAINT_KEYS, HARD_CONSTRAINT_EVALUATORS,
} from "./hard-constraints.ts";
import type { ResolvedPlaceReference, ResolvedUrbanAreaReference, ResolvedSizeReference } from "./hard-constraints-resolve.ts";

const META = { inputHash: "h", resolverVersion: "resolve-1" };
const BREST_REF: ResolvedPlaceReference = {
  status: "resolved", originalLabel: "Brest", canonicalLabel: "Brest", kind: "commune",
  lat: 48.39, lon: -4.48, source: "commune_index", sourceId: "29019", confidence: "exact", meta: META,
};
const MATABIAU_REF: ResolvedPlaceReference = {
  status: "unresolved", originalLabel: "Gare Matabiau", reason: "no_result", meta: META,
};

test("nearPlace : dans le rayon déclaré -> satisfied", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 600, source: "user" }, reference: BREST_REF } }),
    commune(),
  );
  assert.equal(a.status, "satisfied");
});

test("nearPlace : hors du rayon -> incompatible, et le lieu est NOMMÉ", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 50, source: "user" }, reference: BREST_REF } }),
    commune(),
  );
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Brest/);
  assert.match(a.statement, /50 km/);
  // Le GRAIN est dit : c'est le point de référence de la commune, pas « toute la commune ».
  assert.match(a.statement, /point de référence/);
});

test("nearPlace : référence NON RÉSOLUE -> unexamined(unresolved_reference). Jamais sautée en silence.", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Gare Matabiau", threshold: { metric: "distance", maxKm: 30, source: "user" }, reference: MATABIAU_REF } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
});

test("nearPlace : SANS seuil -> unexamined(missing_parameter). Jamais les 50 km inventés.", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: null, reference: BREST_REF } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_parameter");
});

test("nearPlace : un TEMPS DE TRAJET n'est jamais évalué par un haversine (lot 1)", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user" }, reference: BREST_REF } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unsupported_metric");
});

test("nearPlace : mode absent -> missing_parameter (le lieu est identifié, c'est le MODE qui manque)", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "travel_time", maxMinutes: 30, mode: null, direction: "to_reference", source: "user" }, reference: BREST_REF } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_parameter");
});

test("excludePlace : la commune est dans l'agglomération à quitter -> incompatible", () => {
  const ref: ResolvedUrbanAreaReference = {
    status: "resolved", originalLabel: "Lyon", canonicalLabel: "Lyon", referenceCommuneInsee: "69123",
    urbanUnitCode: "00760", normalizedTerritoryCode: "uu:00760", source: "plm_table", meta: META,
  };
  const dansLyon = commune({ nom: "Villeurbanne", insee: "69266", uu: "00760" });
  const a = evaluateExcludePlace(ctx({ excludePlace: [{ label: "Lyon", reference: ref }] }, dansLyon), dansLyon);
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Lyon/);
});

test("excludePlace : hors de l'agglomération -> satisfied", () => {
  const ref: ResolvedUrbanAreaReference = {
    status: "resolved", originalLabel: "Lyon", canonicalLabel: "Lyon", referenceCommuneInsee: "69123",
    urbanUnitCode: "00760", normalizedTerritoryCode: "uu:00760", source: "plm_table", meta: META,
  };
  const a = evaluateExcludePlace(ctx({ excludePlace: [{ label: "Lyon", reference: ref }] }), commune());
  assert.equal(a.status, "satisfied");
});

test("sizeRelativeTo : plus petit que la référence -> satisfied, et la comparaison est d'AGGLO à AGGLO", () => {
  const ref: ResolvedSizeReference = {
    status: "resolved", originalLabel: "Bordeaux", canonicalLabel: "Bordeaux", urbanUnitCode: "33701",
    comparisonPopulation: 1_000_000, populationYear: 2021, populationKind: "urban_unit",
    source: "commune_index", meta: META,
  };
  const petite = commune({ nom: "Auch", tailleVille: 25_000 });
  const a = evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Bordeaux", direction: "smaller", reference: ref } }, petite), petite);
  assert.equal(a.status, "satisfied");
});

test("sizeRelativeTo : plus grand que la référence alors qu'on voulait plus petit -> incompatible", () => {
  const ref: ResolvedSizeReference = {
    status: "resolved", originalLabel: "Auch", canonicalLabel: "Auch", urbanUnitCode: "32701",
    comparisonPopulation: 25_000, populationYear: 2021, populationKind: "urban_unit",
    source: "commune_index", meta: META,
  };
  const a = evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Auch", direction: "smaller", reference: ref } }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Auch/);
});

test("le registre est EXHAUSTIF : les 11 clés ont un évaluateur", () => {
  assert.equal(Object.keys(HARD_CONSTRAINT_EVALUATORS).length, 11);
  for (const k of HARD_CONSTRAINT_KEYS) assert.ok(typeof HARD_CONSTRAINT_EVALUATORS[k] === "function", k);
});

test("assessHardConstraints : rend une évaluation par clé, et chacune porte SA clé", () => {
  const all = assessHardConstraints(ctx({ departements: ["31"] }), commune());
  assert.equal(all.length, 11);
  for (const a of all) assert.ok(HARD_CONSTRAINT_KEYS.includes(a.key));
  assert.equal(all.filter((a) => a.status === "not_declared").length, 10);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL, `evaluateNearPlace is not a function`.

- [ ] **Step 3 : Implémenter**

```ts
// Haversine, identique à celui du comparateur (comparateur-vie.ts). Il vit ici parce que c'est la
// mesure de la contrainte, et le comparateur le réimportera.
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function evaluateNearPlace(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"nearPlace"> {
  const np = ctx.constraints.nearPlace;
  if (np == null) return { key: "nearPlace", status: "not_declared" };

  // LE DÉFAUT D'ORIGINE. matchProjects résolvait le label contre l'index des NOMS DE COMMUNES : « la
  // gare Matabiau » ne résolvait pas, placePoint restait null, et passesHard SAUTAIT le test. La
  // condition non négociable du lecteur n'était appliquée nulle part, et rien ne le lui disait.
  if (np.reference.status !== "resolved") {
    return {
      key: "nearPlace", status: "unexamined",
      reason: np.reference.status === "ambiguous" ? "ambiguous_reference" : "unresolved_reference",
      detail: np.label,
    };
  }
  if (np.threshold == null) return { key: "nearPlace", status: "unexamined", reason: "missing_parameter", detail: np.label };
  if (np.threshold.metric === "travel_time") {
    // Une distance à vol d'oiseau n'établit PAS un temps de trajet. Le mode manquant est un paramètre,
    // pas une ambiguïté du lieu : la gare est parfaitement identifiée.
    return {
      key: "nearPlace", status: "unexamined",
      reason: np.threshold.mode == null ? "missing_parameter" : "unsupported_metric",
      detail: np.label,
    };
  }
  const ref = np.reference;
  const km = haversineKm(ctx.point.lat, ctx.point.lon, ref.lat, ref.lon);
  const max = np.threshold.maxKm;
  const observedValue: ConstraintValue = { kind: "distance_km", value: km };
  const expectedValue: ConstraintValue = { kind: "distance_km", value: max };
  const observedLabel = `${Math.round(km)} km`;
  const expectedLabel = `moins de ${max} km`;
  const evidenceKeys = ["commune.lat", "commune.lon", "project.hardConstraints.nearPlace"];

  if (km <= max) {
    return { key: "nearPlace", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  // LE GRAIN EST DIT. « à moins de 30 km » mesuré depuis le centre de la commune ne veut pas dire que
  // TOUTE la commune y est : la phrase le porte, elle ne le cache pas.
  return {
    key: "nearPlace", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la distance de ${c.nom} à ${ref.canonicalLabel}`,
    statement: `${ctx.point.grain === "address" ? "Cette adresse" : `Le point de référence de ${c.nom}`} est à ${Math.round(km)} km de ${ref.canonicalLabel}, au-delà de la limite de ${max} km que vous avez posée.`,
  };
}

export function evaluateExcludePlace(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"excludePlace"> {
  const list = ctx.constraints.excludePlace;
  if (list.length === 0) return { key: "excludePlace", status: "not_declared" };

  const resolved = list.filter((e) => e.reference.status === "resolved");
  if (resolved.length === 0) {
    return { key: "excludePlace", status: "unexamined", reason: "unresolved_reference", detail: list.map((e) => e.label).join(", ") };
  }

  const territoire = c.uu ? `uu:${c.uu}` : `insee:${c.insee}`;
  const evidenceKeys = ["commune.uu", "commune.insee", "project.hardConstraints.excludePlace"];
  const villes = resolved.map((e) => e.label);
  const expectedValue: ConstraintValue = { kind: "boolean", value: false };
  const expectedLabel = `hors de ${joinFr(villes)}`;

  const hit = resolved.find((e) =>
    e.reference.status === "resolved" && e.reference.normalizedTerritoryCode === territoire);

  if (!hit) {
    return {
      key: "excludePlace", status: "satisfied",
      observedValue: { kind: "boolean", value: false }, expectedValue,
      observedLabel: `hors de ${joinFr(villes)}`, expectedLabel, evidenceKeys,
    };
  }
  return {
    key: "excludePlace", status: "incompatible",
    observedValue: { kind: "boolean", value: true }, expectedValue,
    observedLabel: `dans l'agglomération de ${hit.label}`, expectedLabel, evidenceKeys,
    topic: `l'appartenance de ${c.nom} à l'agglomération de ${hit.label}`,
    statement: `Cette commune fait partie de l'agglomération de ${hit.label}, que vous avez posé comme condition de quitter.`,
  };
}

export function evaluateSizeRelativeTo(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment<"sizeRelativeTo"> {
  const s = ctx.constraints.sizeRelativeTo;
  if (s == null) return { key: "sizeRelativeTo", status: "not_declared" };
  if (s.reference.status !== "resolved") {
    return { key: "sizeRelativeTo", status: "unexamined", reason: "unresolved_reference", detail: s.label };
  }
  if (c.tailleVille == null) return { key: "sizeRelativeTo", status: "unexamined", reason: "missing_data" };

  const ref = s.reference;
  const t = c.tailleVille;
  // Bornes STRICTEMENT exclusives, comme dans le comparateur : « plus petit que Lyon » exclut
  // l'agglomération lyonnaise elle-même, pas seulement ce qui la dépasse.
  const ok = s.direction === "smaller" ? t < ref.comparisonPopulation : t > ref.comparisonPopulation;
  const observedValue: ConstraintValue = { kind: "population", value: t, unit: c.uu ? "urban_unit" : "commune" };
  const expectedValue: ConstraintValue = { kind: "population", value: ref.comparisonPopulation, unit: ref.populationKind === "urban_unit" ? "urban_unit" : "commune" };
  const observedLabel = `${fmt(t)} hab.`;
  const expectedLabel = `${s.direction === "smaller" ? "moins" : "plus"} que ${ref.canonicalLabel} (${fmt(ref.comparisonPopulation)} hab.)`;
  const evidenceKeys = ["commune.tailleVille", "project.hardConstraints.sizeRelativeTo"];

  if (ok) {
    return { key: "sizeRelativeTo", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "sizeRelativeTo", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: `la taille de ${c.nom} au regard de ${ref.canonicalLabel}`,
    statement: `Cette agglomération compte ${fmt(t)} habitants, ${s.direction === "smaller" ? "plus" : "moins"} que ${ref.canonicalLabel} (${fmt(ref.comparisonPopulation)} habitants en ${ref.populationYear}), alors que vous cherchez ${s.direction === "smaller" ? "plus petit" : "plus grand"}.`,
  };
}

// ── Le registre EXHAUSTIF ────────────────────────────────────────────────────
// Ajouter une HardConstraintKey sans écrire son évaluateur CASSE LE TYPECHECK. Et un évaluateur
// enregistré sous `nearSea` ne peut pas rendre `key: "excludeSea"` : le générique le lui interdit.
// C'est le trou de couverture silencieux, rendu impossible par le type plutôt que par un test.
export const HARD_CONSTRAINT_EVALUATORS: {
  [K in HardConstraintKey]: (ctx: EvaluationContext, c: CommuneAttributes) => HardConstraintAssessment<K>;
} = {
  departements: evaluateDepartements,
  zones: evaluateZones,
  excludeZones: evaluateExcludeZones,
  montagne: evaluateMontagne,
  reliefProche: evaluateReliefProche,
  nearSea: evaluateNearSea,
  excludeSea: evaluateExcludeSea,
  nearPlace: evaluateNearPlace,
  communeSize: evaluateCommuneSize,
  excludePlace: evaluateExcludePlace,
  sizeRelativeTo: evaluateSizeRelativeTo,
};

export function assessHardConstraints(
  ctx: EvaluationContext, c: CommuneAttributes,
): HardConstraintAssessment[] {
  return HARD_CONSTRAINT_KEYS.map((k) => HARD_CONSTRAINT_EVALUATORS[k](ctx, c) as HardConstraintAssessment);
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints.test.ts` → PASS (41 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts
git commit -m "feat(hard-constraints): les lieux nommés, et le registre exhaustif des 11 clés

Une référence non résolue ne se saute plus : elle se DÉCLARE
(unexamined(unresolved_reference)). C'était le défaut d'origine : « la gare
Matabiau » ne résolvait pas contre l'index des communes, placePoint restait
null, et passesHard sautait le test sans un mot.

Le registre est un Record exhaustif typé par la clé : ajouter une contrainte
sans évaluateur casse le typecheck, et un évaluateur ne peut pas rendre la clé
d'un autre. Le trou de couverture silencieux devient impossible."
```

---

## Task 8 : L'hydratation (pure), et l'annuaire exposé par le comparateur

**Files:**
- Create: `src/lib/hard-constraints-hydrate.ts`
- Create: `src/lib/hard-constraints-hydrate.test.ts`
- Modify: `src/lib/comparateur-vie.ts` (exporter `placeDirectory()`)

**Interfaces:**
- Consumes: `PlaceDirectory`, `resolveNearPlace` / `resolveUrbanArea` / `resolveSizeReference` (Task 6),
  `NormalizedHardConstraints`, `SearchExplorationHint` (Task 1), `resolveZoneAnchors` /
  `resolveExclusions` (`geo-zones.ts:257` et `:294`, déjà purs).
- Produces: `hydrateHardConstraints(hc, directory): NormalizedHardConstraints`,
  `explorationHints(hc): SearchExplorationHint[]`.

**L'hydratation REÇOIT l'annuaire, elle ne va jamais le chercher.** Si elle importait `comparateur-vie`
pour l'obtenir, et que `comparateur-vie` importait l'hydratation pour filtrer, on aurait un **cycle
d'imports**. En la gardant pure, elle reste testable sous `node --test`, et chaque moteur lui passe le
même annuaire.

- [ ] **Step 1 : Exporter l'annuaire depuis le comparateur**

Dans `src/lib/comparateur-vie.ts`, après `nameIndex()` (ligne ~1058), ajouter :

```ts
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";

// L'ANNUAIRE, exposé au noyau des contraintes dures. Le noyau ne charge aucun index : il reçoit cette
// interface. C'est ce qui le garde pur, donc testable, et c'est ce qui garantit que le comparateur et
// le dossier résolvent « Brest » exactement de la même façon (ils appellent le MÊME annuaire).
export async function placeDirectory(): Promise<PlaceDirectory> {
  const names = await nameIndex(); // nameIndex() appelle loadIndex(), qui construit uuPopCache
  return {
    byName: (label) => {
      const hit = names.get(normalizeName(label));
      if (!hit) return null;
      return { insee: hit.insee, nom: hit.nom, lat: hit.lat, lon: hit.lon, uu: hit.uu ?? null, tailleVille: tailleVille(hit) };
    },
    plmByName: (label) => PLM_VILLES[normalizeName(label)] ?? null,
  };
}

// La taille d'agglomération, exposée : le dossier en a besoin pour bâtir ses ModuleFacts, et il n'a pas
// le droit de la recalculer autrement (ce serait rouvrir la divergence qu'on vient de fermer).
export function tailleVilleOf(c: IndexCommune): number | null {
  return tailleVille(c);
}
```

- [ ] **Step 2 : Écrire le test qui échoue**

Créer `src/lib/hard-constraints-hydrate.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { hydrateHardConstraints, explorationHints } from "./hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";

const dir: PlaceDirectory = {
  byName: (label) =>
    label === "brest"
      ? { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 210_000 }
      : null,
  plmByName: () => null,
};

test("un maxKm PRÉSENT vient du lecteur (les défauts ?? 50 / ?? 30 n'ont jamais été persistés)", () => {
  const n = hydrateHardConstraints({ nearSea: { active: true, maxKm: 20 } }, dir);
  assert.deepEqual(n.nearSea, { threshold: { metric: "distance", maxKm: 20, source: "user" } });
});

test("un maxKm ABSENT ne devient JAMAIS un seuil : la contrainte reste sans paramètre", () => {
  const n = hydrateHardConstraints({ nearSea: { active: true } }, dir);
  assert.deepEqual(n.nearSea, { threshold: null });
});

test("les rayons inventés deviennent des indices d'exploration, hors du contrat dur", () => {
  const hints = explorationHints({ nearSea: { active: true }, nearPlace: { label: "Brest" } });
  assert.deepEqual(hints.map((h) => [h.kind, h.valueKm]), [["near_place_radius", 50], ["near_sea_radius", 30]]);
  assert.ok(hints.every((h) => h.source === "legacy_default" && h.confirmedByUser === false));
});

test("montagne : seule la force `hard` est une contrainte dure", () => {
  assert.equal(hydrateHardConstraints({ montagne: { strength: "preferred" } }, dir).montagne, false);
  assert.equal(hydrateHardConstraints({ montagne: { strength: "hard" } }, dir).montagne, true);
});

test("sizeRelativeTo ne mute PLUS communeSize : les deux contraintes coexistent, nommées séparément", () => {
  const n = hydrateHardConstraints(
    { communeSize: { max: 100_000 }, sizeRelativeTo: { label: "Brest", direction: "smaller" } },
    dir,
  );
  assert.deepEqual(n.communeSize, { min: null, max: 100_000 }); // INTACTE
  assert.equal(n.sizeRelativeTo?.reference.status, "resolved");
});

test("un lieu nommé non résolu reste dans l'état hydraté, pour être DÉCLARÉ non examiné", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Gare Matabiau", maxKm: 30 } }, dir);
  assert.equal(n.nearPlace?.reference.status, "unresolved");
});
```

- [ ] **Step 3 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints-hydrate.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 4 : Écrire l'hydratation**

Créer `src/lib/hard-constraints-hydrate.ts` :

```ts
// L'HYDRATATION : ce que le lecteur a déclaré, plus ce que la résolution a trouvé. PURE : elle REÇOIT
// l'annuaire, elle ne va jamais le chercher (sinon comparateur-vie -> hydrate -> comparateur-vie).
//
// ELLE VIT AU-DESSUS DES DEUX MOTEURS. Ni le comparateur ni le dossier ne résolvent un label : ils
// reçoivent le même objet résolu. Deux résolutions indépendantes peuvent diverger (un succès ici, un
// échec là) ; une seule ne le peut pas.
import { resolveZoneAnchors, resolveExclusions } from "./geo-zones.ts";
import { resolveNearPlace, resolveUrbanArea, resolveSizeReference, type PlaceDirectory } from "./hard-constraints-resolve.ts";
import type { NormalizedHardConstraints, PlaceThreshold, SearchExplorationHint } from "./hard-constraints.ts";
import type { HardConstraints } from "./comparateur-vie.ts"; // TYPE SEULEMENT (server-only)

// LES RAYONS QUE LE PRODUIT S'EST INVENTÉS. Ils sortent du contrat dur : ils peuvent CADRER une
// recherche, jamais ÉLIMINER une commune ni produire un verdict opposable au lecteur.
const LEGACY_NEAR_PLACE_KM = 50;
const LEGACY_NEAR_SEA_KM = 30;

export function explorationHints(hc: HardConstraints | undefined | null): SearchExplorationHint[] {
  const c = hc ?? {};
  const out: SearchExplorationHint[] = [];
  if (c.nearPlace?.label && c.nearPlace.maxKm == null) {
    out.push({ kind: "near_place_radius", valueKm: LEGACY_NEAR_PLACE_KM, source: "legacy_default", confirmedByUser: false });
  }
  if (c.nearSea?.active && c.nearSea.maxKm == null) {
    out.push({ kind: "near_sea_radius", valueKm: LEGACY_NEAR_SEA_KM, source: "legacy_default", confirmedByUser: false });
  }
  return out;
}

// Un maxKm PRÉSENT dans le projet vient toujours du parse, donc du texte du lecteur : les défauts
// (?? 50, ?? 30) étaient appliqués au RUNTIME et n'ont jamais été écrits dans hardConstraints. Il n'y a
// donc aucun « faux user » à démêler.
function thresholdFrom(maxKm: number | null | undefined): PlaceThreshold | null {
  return typeof maxKm === "number" ? { metric: "distance", maxKm, source: "user" } : null;
}

export function hydrateHardConstraints(
  hc: HardConstraints | undefined | null,
  dir: PlaceDirectory | null,
): NormalizedHardConstraints {
  const c = hc ?? {};
  const zone = resolveZoneAnchors(c.zones);
  const excl = resolveExclusions(c.excludeZones);
  // Le contexte de résolution entre dans l'inputHash : deux « Saint-Jean » dans deux départements
  // différents ne sont pas le même lieu.
  const input = { context: (c.departements ?? []).join(",") };

  return {
    departements: c.departements?.length ? c.departements : null,
    zones: zone.hardDepartements && zone.hardDepartements.size > 0
      ? { hardDepartements: zone.hardDepartements, labels: zone.applied.filter((a) => a.strength === "hard").map((a) => a.label) }
      : null,
    excludeZones: excl.departements.size > 0
      ? { departements: excl.departements, labels: excl.applied.map((a) => a.label) }
      : null,
    montagne: c.montagne?.strength === "hard",
    reliefProche: c.reliefProche?.strength === "hard",
    nearSea: c.nearSea?.active ? { threshold: thresholdFrom(c.nearSea.maxKm) } : null,
    excludeSea: c.excludeSea === true,
    communeSize: c.communeSize ? { min: c.communeSize.min ?? null, max: c.communeSize.max ?? null } : null,
    nearPlace: c.nearPlace?.label && dir
      ? { label: c.nearPlace.label, threshold: thresholdFrom(c.nearPlace.maxKm), reference: resolveNearPlace(c.nearPlace.label, dir, input) }
      : null,
    excludePlace: dir
      ? (c.excludePlace ?? []).filter((e) => e?.label).map((e) => ({ label: e.label, reference: resolveUrbanArea(e.label, dir, input) }))
      : [],
    sizeRelativeTo: c.sizeRelativeTo?.label && dir
      ? { label: c.sizeRelativeTo.label, direction: c.sizeRelativeTo.direction, reference: resolveSizeReference(c.sizeRelativeTo.label, dir, input) }
      : null,
  };
}
```

- [ ] **Step 5 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints-hydrate.test.ts` → PASS (6 tests).
Run: `npx tsc --noEmit` → 0.
Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` → PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/hard-constraints-hydrate.ts src/lib/hard-constraints-hydrate.test.ts src/lib/comparateur-vie.ts
git commit -m "feat(hard-constraints): l'hydratation, AU-DESSUS des deux moteurs, et pure

Ni le comparateur ni le dossier ne résolvent plus un label : ils reçoivent le
même objet résolu, produit une fois, au-dessus d'eux. C'est la seule façon
d'être sûr qu'ils lisent la même chose (deux résolutions indépendantes peuvent
diverger : un succès ici, un échec là).

Elle REÇOIT l'annuaire au lieu d'aller le chercher : si elle importait
comparateur-vie, et que comparateur-vie l'importait pour filtrer, on aurait un
cycle. En restant pure, elle est aussi testable.

sizeRelativeTo ne mute PLUS communeSize (matchProjects réécrivait hc.communeSize
en douce) : les deux contraintes coexistent et sont nommées séparément.

Les rayons inventés (50 km, 30 km) deviennent des SearchExplorationHint : ils
peuvent cadrer une recherche, jamais éliminer une commune."
```

---

## Task 9 : L'adaptateur comparateur (`eligible` et `complete`)

**Files:**
- Create: `src/lib/hard-constraints-filter.ts`
- Create: `src/lib/hard-constraints-filter.test.ts`

**Interfaces:**
- Consumes: `HardConstraintAssessment` (Task 1).
- Produces: `HardFilterResult`, `hardFilter(assessments): HardFilterResult`, `unappliedLabels(result)`.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { hardFilter, unappliedLabels } from "./hard-constraints-filter.ts";
import type { HardConstraintAssessment } from "./hard-constraints.ts";

const sat = (key: HardConstraintAssessment["key"]): HardConstraintAssessment =>
  ({ key, status: "satisfied", observedValue: { kind: "boolean", value: true }, expectedValue: { kind: "boolean", value: true },
     observedLabel: "", expectedLabel: "", evidenceKeys: [] });
const inc = (key: HardConstraintAssessment["key"]): HardConstraintAssessment =>
  ({ key, status: "incompatible", observedValue: { kind: "boolean", value: false }, expectedValue: { kind: "boolean", value: true },
     observedLabel: "", expectedLabel: "", evidenceKeys: [], statement: "…", topic: "…" });

test("tout satisfait -> eligible ET complete", () => {
  const r = hardFilter([sat("departements"), { key: "zones", status: "not_declared" }]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, true);
});

test("une incompatibilité -> non eligible", () => {
  const r = hardFilter([inc("nearSea"), sat("departements")]);
  assert.equal(r.eligible, false);
  assert.equal(r.incompatible.length, 1);
});

test("donnée COMMUNALE manquante -> exclue (la doctrine prudente du filtre, préservée)", () => {
  const r = hardFilter([{ key: "reliefProche", status: "unexamined", reason: "missing_data" }]);
  assert.equal(r.eligible, false);
});

test("référence NON RÉSOLUE -> la commune reste ELIGIBLE, mais complete est FAUX", () => {
  // Exclure sur cette base exclurait TOUTES les communes : la référence est globale, pas communale.
  // Le lecteur recevrait zéro résultat sans comprendre pourquoi.
  const r = hardFilter([{ key: "nearPlace", status: "unexamined", reason: "unresolved_reference", detail: "Gare Matabiau" }]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, false);
  assert.equal(r.unapplied.length, 1);
});

test("un seuil non déclaré (missing_parameter) ne filtre pas non plus", () => {
  const r = hardFilter([{ key: "nearSea", status: "unexamined", reason: "missing_parameter" }]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, false);
});

test("unappliedLabels : nomme la contrainte non appliquée, pour le dire au lecteur", () => {
  const r = hardFilter([{ key: "nearPlace", status: "unexamined", reason: "unresolved_reference", detail: "Gare Matabiau" }]);
  assert.deepEqual(unappliedLabels(r), ["la proximité de Gare Matabiau"]);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints-filter.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3 : Implémenter**

Créer `src/lib/hard-constraints-filter.ts` :

```ts
// L'ADAPTATEUR COMPARATEUR. Il traduit l'évaluation canonique en politique de RECHERCHE : dans le doute
// (donnée communale absente), ne pas proposer. Il rend deux choses, là où passesHard n'en rendait qu'une :
//
//   eligible : cette commune peut être proposée
//   complete : TOUTES les contraintes déclarées ont pu être APPLIQUÉES
//
// Le second existe parce que le premier ne suffisait pas à dire la vérité. Une référence non résolue
// (« la gare Matabiau ») laissait la commune éligible, et le comparateur affichait ses résultats comme
// s'ils respectaient toutes les conditions du lecteur. `complete: false` lui interdit cette phrase.
import type { HardConstraintAssessment, HardConstraintKey, UnexaminedReason } from "./hard-constraints.ts";

export type HardFilterResult = {
  eligible: boolean;
  complete: boolean;
  satisfied: HardConstraintAssessment[];
  incompatible: HardConstraintAssessment[];
  unapplied: HardConstraintAssessment[];
};

// Une donnée manquante sur CETTE commune est communale : l'exclure n'exclut qu'elle. Une référence non
// résolue est GLOBALE : l'exclure exclurait tout le monde, et rendrait zéro résultat.
const COMMUNE_LEVEL: UnexaminedReason[] = ["missing_data"];

export function hardFilter(assessments: HardConstraintAssessment[]): HardFilterResult {
  const satisfied = assessments.filter((a) => a.status === "satisfied");
  const incompatible = assessments.filter((a) => a.status === "incompatible");
  const unexamined = assessments.filter((a) => a.status === "unexamined");
  const excludedByData = unexamined.filter((a) => a.status === "unexamined" && COMMUNE_LEVEL.includes(a.reason));
  const unapplied = unexamined.filter((a) => a.status === "unexamined" && !COMMUNE_LEVEL.includes(a.reason));

  return {
    eligible: incompatible.length === 0 && excludedByData.length === 0,
    complete: unexamined.length === 0,
    satisfied, incompatible, unapplied,
  };
}

// Le libellé de ce qui n'a PAS pu être appliqué, pour le dire au lecteur. Le `detail` porte le mot du
// lecteur (« Gare Matabiau ») ; sans lui, on retombe sur la catégorie.
const UNAPPLIED_LABELS: Record<HardConstraintKey, (detail?: string) => string> = {
  departements: () => "les départements visés",
  zones: () => "les zones géographiques visées",
  excludeZones: () => "les zones à éviter",
  montagne: () => "l'exigence de montagne",
  reliefProche: () => "la proximité du relief",
  nearSea: () => "la proximité de la mer",
  excludeSea: () => "l'éloignement de la mer",
  nearPlace: (d) => (d ? `la proximité de ${d}` : "la proximité d'un lieu"),
  communeSize: () => "la taille de la commune",
  excludePlace: (d) => (d ? `le fait de quitter ${d}` : "les villes à quitter"),
  sizeRelativeTo: (d) => (d ? `la taille relative à ${d}` : "la taille relative à une ville"),
};

export function unappliedLabels(r: HardFilterResult): string[] {
  return r.unapplied.map((a) => UNAPPLIED_LABELS[a.key](a.status === "unexamined" ? a.detail : undefined));
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/hard-constraints-filter.test.ts` → PASS (6 tests).
Run: `npx tsc --noEmit` → 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hard-constraints-filter.ts src/lib/hard-constraints-filter.test.ts
git commit -m "feat(hard-constraints): l'adaptateur comparateur sait dire ce qu'il n'a PAS appliqué

passesHard rendait un booléen, donc « je n'ai pas pu appliquer votre condition »
et « votre condition est respectée » sortaient par le même trou. eligible dit si
la commune peut être proposée ; complete dit si toutes ses conditions ont pu
être APPLIQUÉES. Sans le second, le comparateur affichait ses résultats comme
s'ils respectaient tout."
```

---

## Task 10 : Brancher le comparateur sur l'adaptateur

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (`passesHard` → `hardFilter`, `MatchOutcome`, `matchProjects`)
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (afficher la condition non appliquée)
- Create: `src/lib/comparateur-hard-nonregression.test.ts`

**Interfaces:**
- Consumes: `hydrateHardConstraints` (Task 8), `assessHardConstraints` (Task 7), `hardFilter` /
  `unappliedLabels` (Task 9).
- Produces: `MatchOutcome.unappliedConstraints: string[] | undefined`.

**Attention** : `matchProjects(parsed)` reçoit un `ParsedProject` **venu du client** (le comparateur est
**anonyme** : `/api/comparateur-vie/match/route.ts:30`, aucun compte, aucun projet persisté).
L'hydratation se fait donc **dans `matchProjects` lui-même**, en tête, une seule fois pour toutes les
communes. C'est le seul point au-dessus du filtre que traversent tous les appelants (`/match`,
`/apercu`, `pack-decision`).

- [ ] **Step 1 : Écrire le test de non-régression du filtre**

Créer `src/lib/comparateur-hard-nonregression.test.ts` :

```ts
// NON-RÉGRESSION DU FILTRE. Le nouvel adaptateur doit rendre le MÊME verdict d'éligibilité que l'ancien
// passesHard, SAUF sur les cas où l'ancien comportement était précisément le défaut corrigé. Ces écarts
// sont ÉNUMÉRÉS ici : un écart non listé est une régression.
import test from "node:test";
import assert from "node:assert/strict";
import { assessHardConstraints, type CommuneAttributes, type NormalizedHardConstraints, type EvaluationContext } from "./hard-constraints.ts";
import { hardFilter } from "./hard-constraints-filter.ts";

function ctxOf(c: CommuneAttributes, over: Partial<NormalizedHardConstraints>): EvaluationContext {
  return {
    constraints: {
      departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
      nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [], sizeRelativeTo: null,
      ...over,
    },
    point: { lat: c.lat!, lon: c.lon!, grain: "commune_reference", source: "commune_centroid", label: c.nom },
    conventionsVersion: "hc-conv-1",
  };
}
const TLS: CommuneAttributes = {
  insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6045, lon: 1.4442,
  population: 493_465, tailleVille: 1_060_000, uu: "31701", altitude: 146, reliefProximite: 0, distanceCoteKm: 150,
};

test("non-régression : département hors liste -> exclue, comme avant", () => {
  assert.equal(hardFilter(assessHardConstraints(ctxOf(TLS, { departements: ["33"] }), TLS)).eligible, false);
});

test("non-régression : relief absent -> exclue, comme avant (la prudence du filtre est préservée)", () => {
  const sansRelief = { ...TLS, reliefProximite: null };
  assert.equal(hardFilter(assessHardConstraints(ctxOf(sansRelief, { reliefProche: true }), sansRelief)).eligible, false);
});

test("non-régression : taille d'agglomération hors bornes -> exclue, comme avant", () => {
  assert.equal(hardFilter(assessHardConstraints(ctxOf(TLS, { communeSize: { min: null, max: 25_000 } }), TLS)).eligible, false);
});

test("ÉCART ASSUMÉ 1 : nearSea sans distance ne filtre plus à 30 km. La commune reste éligible, complete=false.", () => {
  const r = hardFilter(assessHardConstraints(ctxOf(TLS, { nearSea: { threshold: null } }), TLS));
  assert.equal(r.eligible, true);   // avant : exclue (150 km > 30 km inventés)
  assert.equal(r.complete, false);  // et le lecteur l'apprend
});
```

- [ ] **Step 2 : Lancer, vérifier qu'il passe déjà** (il n'exerce que du code écrit)

Run: `node --test src/lib/comparateur-hard-nonregression.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 3 : Remplacer `passesHard` dans `comparateur-vie.ts`**

Supprimer la fonction `passesHard` (lignes 2135-2180) et la remplacer par :

```ts
import {
  assessHardConstraints, PRODUCT_CONVENTIONS_VERSION,
  type CommuneAttributes, type NormalizedHardConstraints, type EvaluationContext,
} from "./hard-constraints.ts";
import { hardFilter, unappliedLabels } from "./hard-constraints-filter.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";

function communeAttributes(c: IndexCommune): CommuneAttributes {
  return {
    insee: c.insee, nom: c.nom, dept: c.dept, lat: c.lat, lon: c.lon,
    population: c.population ?? null,
    tailleVille: tailleVille(c),
    uu: c.uu ?? null,
    altitude: c.altitude ?? null,
    reliefProximite: c.relief_proximite ?? null,
    distanceCoteKm: c.distance_cote_km,
  };
}

// Le filtre dur, désormais adossé à l'évaluation canonique. POP_FLOOR reste ici : c'est la doctrine de
// RECHERCHE du comparateur (on ne propose pas un hameau), pas une contrainte du lecteur.
function passesHardCanonical(c: IndexCommune, normalized: NormalizedHardConstraints): boolean {
  if (c.population == null || c.population < POP_FLOOR) return false;
  const attrs = communeAttributes(c);
  const ctx: EvaluationContext = {
    constraints: normalized,
    point: { lat: c.lat, lon: c.lon, grain: "commune_reference", source: "commune_centroid", label: c.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  return hardFilter(assessHardConstraints(ctx, attrs)).eligible;
}
```

Dans `matchProjects`, remplacer tout le bloc de résolution (lignes ~2584-2645 : `needNames`, `placePoint`,
`excludeUU`, `excludeInsee`, la mutation de `hc.communeSize` par `sizeRelativeTo`) par :

```ts
  // L'ANNUAIRE est passé à l'hydratation, qui reste pure. matchProjects est le point au-dessus du filtre
  // que TOUS les appelants du comparateur traversent (il est anonyme : aucun projet persisté à hydrater
  // en amont).
  const normalized = hydrateHardConstraints(hc, await placeDirectory());
  // Les contraintes qui n'ont PAS pu être appliquées : on les calcule une fois (elles sont globales,
  // pas communales) pour les dire au lecteur.
  const probe = communes[0];
  const unapplied = probe
    ? unappliedLabels(hardFilter(assessHardConstraints(
        { constraints: normalized,
          point: { lat: probe.lat, lon: probe.lon, grain: "commune_reference", source: "commune_centroid", label: probe.nom },
          conventionsVersion: PRODUCT_CONVENTIONS_VERSION },
        communeAttributes(probe),
      )))
    : [];
```

et le `candidates` :

```ts
  const candidates = communes.filter((c) => passesHardCanonical(c, normalized));
```

**Garder** `appliedPlaces` (le périmètre appliqué), qui se reconstruit depuis `normalized` :

```ts
  const appliedPlaces: string[] = [];
  for (const e of normalized.excludePlace) {
    if (e.reference.status === "resolved") appliedPlaces.push(`exclusion de l'agglomération de ${e.label}`);
  }
  if (normalized.sizeRelativeTo?.reference.status === "resolved") {
    const s = normalized.sizeRelativeTo;
    appliedPlaces.push(`communes plus ${s.direction === "smaller" ? "petites" : "grandes"} que ${s.label}`);
  }
```

Enfin, `MatchOutcome` gagne le champ, et `matchProjects` le renseigne :

```ts
  // Ce que le moteur n'a PAS pu appliquer. Il affichait ses résultats comme s'ils respectaient toutes
  // les conditions du lecteur, alors qu'il en sautait parfois une en silence.
  unappliedConstraints?: string[];
```

```ts
    unappliedConstraints: unapplied.length ? unapplied : undefined,
```

- [ ] **Step 4 : Vérifier**

Run: `npx tsc --noEmit` → 0.
Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` → PASS.
Run: `npm run build` → succès.

- [ ] **Step 5 : Afficher l'avertissement au lecteur**

Dans le composant qui rend le périmètre du comparateur (chercher `appliedZones` / `appliedPlaces` dans
`src/app/(public)/ou-vivre/OuVivreClient.tsx`), afficher, quand `unappliedConstraints` est présent :

> Une condition que vous avez posée n'a pas pu être appliquée à ces résultats : {liste}.

Au pluriel : « Des conditions que vous avez posées n'ont pas pu être appliquées à ces résultats : … ».
Placer la phrase **avec** le périmètre appliqué (même bloc), jamais en bandeau d'erreur : ce n'est pas une
panne, c'est une limite.

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "feat(comparateur): le filtre dur passe par l'évaluation canonique, et dit ce qu'il n'a pas appliqué

matchProjects résolvait « nearPlace » contre l'index des NOMS DE COMMUNES : « la
gare Matabiau » ne résolvait pas, placePoint restait null, et passesHard sautait
le test. Le comparateur affichait donc des communes en laissant croire qu'elles
respectaient toutes les conditions non négociables du lecteur, alors que l'une
d'elles n'avait jamais été appliquée.

Le filtre est maintenant un adaptateur au-dessus de l'évaluation canonique, et
MatchOutcome porte unappliedConstraints. La mutation silencieuse de communeSize
par sizeRelativeTo disparaît : les deux contraintes sont évaluées, et nommées,
séparément."
```

---

## Task 11 : L'adaptateur dossier (la fabrique de règles)

**Files:**
- Create: `src/lib/decision/hard-constraint-rules.ts`
- Create: `src/lib/decision/hard-constraint-rules.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (`ModuleFacts`, `DecisionRule.evaluate`, `HardConstraintKey`)
- Modify: `src/lib/decision/materiality-rules.ts` (retirer `ruleMer`, `ruleTaille`, `ruleDepartement`)
- Modify: `src/lib/decision/module-facts-map.ts`, `src/lib/decision/territory-facts.ts`
- Modify: `src/lib/decision/materiality-rules.test.ts` (les 3 règles retirées y sont testées)
- Modify: `src/components/report/DossierAvecLogement.tsx`, `src/app/(account)/rapport/page.tsx`
  (le **second** appelant de `runRules`, et le point d'évaluation à l'adresse)

**Interfaces:**
- Consumes: `assessHardConstraints`, `EvaluationContext` (Task 7).
- Produces: `HARD_CONSTRAINT_RULES: DecisionRule[]`, `runRules(facts, project, hardCtx)`.

- [ ] **Step 1 : Étendre les contrats du dossier**

Dans `src/lib/decision/decision-fact.ts` :

```ts
// La clé vit désormais dans le NOYAU partagé (src/lib/hard-constraints.ts) : le dossier et le
// comparateur doivent parler des mêmes contraintes, sous les mêmes noms.
export type { HardConstraintKey } from "../hard-constraints.ts";
import type { HardConstraintKey } from "../hard-constraints.ts";
```

(et supprimer l'ancienne déclaration locale, lignes 14-16.)

`ModuleFacts` devient un sur-ensemble de `CommuneAttributes` :

```ts
export type ModuleFacts = {
  insee: string;
  nom: string;
  // Les attributs nécessaires aux contraintes dures. ModuleFacts est un SUR-ENSEMBLE de
  // CommuneAttributes : les deux moteurs lisent les mêmes champs, sous les mêmes noms.
  dept: string | null;
  lat: number | null;
  lon: number | null;
  uu: string | null;
  tailleVille: number | null;    // taille d'AGGLOMÉRATION (la taille se juge sur l'UU, cf. chantier C)
  reliefProximite: number | null;
  distanceCoteKm: number;
  population: number | null;
  altitude: number | null;
  catnatInondation: number | null;
  inondationRisque: number | null;
  scores: Partial<Record<PreferenceKey, number | null>>;
  hasAddress: boolean;
  logement?: LogementFacts;
};
```

`DecisionRule` gagne un 3e paramètre. **Les règles existantes ne changent pas** : en TypeScript, une
fonction qui déclare moins de paramètres reste assignable.

```ts
import type { EvaluationContext } from "../hard-constraints.ts";

export type DecisionRule = {
  id: string;
  module: DecisionModule;
  hardConstraint?: HardConstraintKey;
  // `hard` porte les contraintes HYDRATÉES (références résolues au-dessus des deux moteurs) et le point
  // réellement testé. Les règles de préférence l'ignorent : elles déclarent deux paramètres.
  evaluate: (facts: ModuleFacts, project: UserProject, hard: EvaluationContext) => RuleEvaluation;
};
```

- [ ] **Step 2 : Écrire le test de la fabrique**

Créer `src/lib/decision/hard-constraint-rules.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { HARD_CONSTRAINT_RULES } from "./hard-constraint-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { EvaluationContext, NormalizedHardConstraints } from "../hard-constraints.ts";

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6, lon: 1.44, uu: "31701",
    tailleVille: 1_060_000, reliefProximite: 0, distanceCoteKm: 150,
    population: 493_465, altitude: 146, catnatInondation: 0, inondationRisque: 10,
    scores: {}, hasAddress: false, ...over,
  };
}
function project(hardConstraints: unknown): UserProject {
  return { posture: "recherche", intent: null, rawText: null,
           parsed: { reformulation: "x", hardConstraints, preferences: [] } as UserProject["parsed"],
           updatedAt: "1970-01-01T00:00:00.000Z" };
}
function hard(over: Partial<NormalizedHardConstraints> = {}): EvaluationContext {
  return {
    constraints: { departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
                   nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [],
                   sizeRelativeTo: null, ...over },
    point: { lat: 43.6, lon: 1.44, grain: "commune_reference", source: "commune_centroid", label: "Toulouse" },
    conventionsVersion: "hc-conv-1",
  };
}
const rule = (key: string) => HARD_CONSTRAINT_RULES.find((r) => r.hardConstraint === key)!;

test("une règle par contrainte dure : 11", () => {
  assert.equal(HARD_CONSTRAINT_RULES.length, 11);
});

test("not_declared -> not_applicable (le critère n'est pas déclaré, ce n'est pas un trou)", () => {
  const e = rule("departements").evaluate(facts(), project({}), hard());
  assert.equal(e.outcome, "not_applicable");
  assert.deepEqual(e.projectKeys, ["departements"]);
  assert.equal(e.facts.length, 0);
});

test("satisfied -> satisfied, SILENCIEUX (aucun fait), et la couverture monte", () => {
  const e = rule("departements").evaluate(facts(), project({ departements: ["31"] }), hard({ departements: ["31"] }));
  assert.equal(e.outcome, "satisfied");
  assert.equal(e.facts.length, 0);
});

test("incompatible -> incompatible + un IncompatibilityFact complet", () => {
  const e = rule("departements").evaluate(facts(), project({ departements: ["33"] }), hard({ departements: ["33"] }));
  assert.equal(e.outcome, "incompatible");
  const f = e.facts[0]!;
  assert.equal(f.role, "incompatibility");
  assert.ok(f.role === "incompatibility");
  assert.equal(f.hardConstraintKey, "departements");
  assert.equal(f.evidenceStrength, "established");
  assert.equal(f.materialityTier, "decision_critical");
  assert.equal(f.topic, "le département de Toulouse");
  assert.equal(f.evidence[0]!.observedValue, "département 31");
});

test("unexamined -> uncertain : le critère reste NON EXAMINÉ, et le couperet mord", () => {
  const e = rule("nearSea").evaluate(facts(), project({ nearSea: { active: true } }), hard({ nearSea: { threshold: null } }));
  assert.equal(e.outcome, "uncertain");
  assert.equal(e.facts.length, 0);
});
```

- [ ] **Step 3 : Lancer, vérifier l'échec**

Run: `node --test src/lib/decision/hard-constraint-rules.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 4 : Implémenter la fabrique**

Créer `src/lib/decision/hard-constraint-rules.ts` :

```ts
// L'ADAPTATEUR DOSSIER. Il traduit l'évaluation canonique en politique de RAPPORT : une donnée absente
// n'est JAMAIS une incompatibilité. Le comparateur, lui, exclut dans le doute. Même observation, deux
// conduites, et c'est assumé : le filtre protège le lecteur d'une mauvaise proposition, le dossier le
// protège d'une fausse affirmation.
//
// Une règle par clé, fabriquée au-dessus du MÊME évaluateur que le filtre : c'est ce qui empêche les
// deux moteurs de conclure différemment sur la même commune.
import { HARD_CONSTRAINT_KEYS, assessHardConstraints } from "../hard-constraints.ts";
import type { HardConstraintKey, HardConstraintAssessment } from "../hard-constraints.ts";
import type { DecisionRule, RuleEvaluation, IncompatibilityFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";

const territoireHref = "/rapport/quartier";

function toEvidence(a: Extract<HardConstraintAssessment, { status: "incompatible" }>, f: ModuleFacts): EvidenceRef[] {
  return [{
    factId: a.evidenceKeys[0] ?? "commune",
    module: "territoire",
    label: `Territoire · ${f.nom}`,
    observedValue: a.observedLabel,
    grain: "commune",
    href: territoireHref,
  }];
}

function makeRule(key: HardConstraintKey): DecisionRule {
  const id = `territoire.hard.${key}`;
  return {
    id,
    module: "territoire",
    hardConstraint: key,
    evaluate: (f, _p, hard): RuleEvaluation => {
      const a = assessHardConstraints(hard, f).find((x) => x.key === key)!;

      if (a.status === "not_declared") {
        return { ruleId: id, projectKeys: [key], outcome: "not_applicable", facts: [], reason: "non déclarée" };
      }
      if (a.status === "unexamined") {
        // NON EXAMINÉE. Le critère ne monte pas la couverture, et le couperet interdit une couverture
        // « élevée ». C'est exactement ce qu'on veut : une condition absolue qu'on n'a pas su tester
        // diminue la valeur du verdict, elle ne se laisse pas oublier.
        return { ruleId: id, projectKeys: [key], outcome: "uncertain", facts: [], reason: a.reason };
      }
      if (a.status === "satisfied") {
        // Examinée, rien à redire : SILENCIEUSE (aucune carte), mais c'est un point favorable et la
        // couverture monte. Rendre not_applicable ici serait le bug de la slice 2.1.
        return { ruleId: id, projectKeys: [key], outcome: "satisfied", facts: [], reason: "respectée" };
      }

      const fact: IncompatibilityFact = {
        id: `${f.insee}:hard:${key}`,
        ruleId: id,
        sourceFactIds: a.evidenceKeys,
        module: "territoire",
        role: "incompatibility",
        evidenceStrength: "established",
        hardConstraintKey: key,
        materialityTier: "decision_critical",
        topic: a.topic,
        statement: a.statement,
        evidence: toEvidence(a, f),
      };
      return { ruleId: id, projectKeys: [key], outcome: "incompatible", facts: [fact], reason: "contrainte non respectée" };
    },
  };
}

export const HARD_CONSTRAINT_RULES: DecisionRule[] = HARD_CONSTRAINT_KEYS.map(makeRule);
```

- [ ] **Step 5 : Retirer les 3 anciennes règles et brancher le registre**

Dans `src/lib/decision/materiality-rules.ts` : supprimer `ruleMer` (lignes 20-42), `ruleTaille`
(44-80), `ruleDepartement` (86-117) et l'import de `nearSeaLimitKm` / `communeSizeBounds` /
`departementFromInsee` s'ils deviennent inutilisés. Puis :

```ts
import { HARD_CONSTRAINT_RULES } from "./hard-constraint-rules.ts";
import type { EvaluationContext } from "../hard-constraints.ts";

export const REGISTRY: DecisionRule[] = [
  ...HARD_CONSTRAINT_RULES,   // les 11 contraintes dures, une par clé, au-dessus de l'évaluateur partagé
  ruleCompromis, ruleConfort, ruleInondation,
  ...LOGEMENT_RULES,
];

export function runRules(facts: ModuleFacts, project: UserProject, hard: EvaluationContext): RunResult {
  const outFacts: DecisionFact[] = [];
  const evaluations: RuleEvaluation[] = [];
  const covered = new Set<HardConstraintKey>();
  for (const rule of REGISTRY) {
    const ev = rule.evaluate(facts, project, hard);
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

Dans `src/lib/decision/materiality-rules.test.ts` : **supprimer** les tests des 3 règles retirées (ils
sont remplacés, en mieux, par `hard-constraint-rules.test.ts`), et passer le 3e argument à `runRules`
dans les tests restants (un `EvaluationContext` neutre, tout `not_declared`).

- [ ] **Step 6 : Brancher `territory-facts.ts` et `module-facts-map.ts`**

`module-facts-map.ts` mappe les nouveaux champs :

```ts
export function mapCommuneToModuleFacts(
  entry: IndexCommune,
  scores: Partial<Record<PreferenceKey, number | null>>,
  opts: { hasAddress: boolean; tailleVille: number | null },
): ModuleFacts {
  return {
    insee: entry.insee,
    nom: entry.nom,
    dept: entry.dept,
    lat: entry.lat,
    lon: entry.lon,
    uu: entry.uu ?? null,
    tailleVille: opts.tailleVille,     // résolue par l'appelant : l'index des UU vit dans comparateur-vie
    reliefProximite: entry.relief_proximite ?? null,
    distanceCoteKm: entry.distance_cote_km,
    population: entry.population ?? null,
    altitude: entry.altitude ?? null,
    catnatInondation: entry.inondation ? entry.inondation.catnat : null,
    inondationRisque: entry.inondation ? entry.inondation.risque : null,
    scores,
    hasAddress: opts.hasAddress,
  };
}
```

`territory-facts.ts` renseigne `tailleVille`, construit le contexte, et le passe :

```ts
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext, type EvaluationPoint } from "../hard-constraints.ts";
import { getCommuneEntry, subScore, PREFERENCE_KEYS, placeDirectory, tailleVilleOf, type IndexCommune } from "../comparateur-vie.ts";

// La taille d'agglomération vient de comparateur-vie (tailleVilleOf), jamais d'un calcul refait ici :
// c'est exactement la divergence qu'on vient de fermer.
export function buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) scores[key] = subScore(key, entry);
  return mapCommuneToModuleFacts(entry, scores, { hasAddress: opts.hasAddress, tailleVille: tailleVilleOf(entry) });
}

export async function buildCommuneDossier(
  insee: string,
  project: UserProject,
  opts?: { hasAddress?: boolean; point?: EvaluationPoint },
): Promise<{ moduleFacts: ModuleFacts; dossier: Dossier } | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: opts?.hasAddress ?? false });
  if (!facts) return null;

  // LE POINT RÉELLEMENT TESTÉ. Sans adresse, c'est le point de référence de la commune, et la phrase le
  // dira. Avec une adresse, c'est l'adresse : une commune peut passer sur son centroïde et échouer à son
  // extrémité. C'est un changement de GRAIN, pas une divergence de moteur.
  const point: EvaluationPoint = opts?.point ?? {
    lat: facts.lat ?? 0, lon: facts.lon ?? 0,
    grain: "commune_reference", source: "commune_centroid",
    label: `le point de référence de ${facts.nom}`,
  };
  const hard: EvaluationContext = {
    // Le MÊME annuaire, la MÊME hydratation que le comparateur. C'est ce qui interdit aux deux moteurs
    // de résoudre « Brest » différemment.
    constraints: hydrateHardConstraints(project.parsed?.hardConstraints, await placeDirectory()),
    point,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  return { moduleFacts: facts, dossier: assembleDossier(runRules(facts, project, hard), project, "commune", facts.nom) };
}
```

`tailleVilleOf` a été exporté de `comparateur-vie.ts` en Task 8 (Step 1).

`buildCommuneDossier` **rend aussi le contexte** (le second appelant de `runRules` en a besoin, cf. Step
7) :

```ts
): Promise<{ moduleFacts: ModuleFacts; dossier: Dossier; hard: EvaluationContext } | null> {
  …
  return { moduleFacts: facts, dossier: assembleDossier(runRules(facts, project, hard), project, "commune", facts.nom), hard };
}
```

- [ ] **Step 7 : Le SECOND appelant de `runRules`, et le point à l'adresse**

`src/components/report/DossierAvecLogement.tsx:30` appelle `runRules(facts, project)` pour bâtir le
dossier **commune + adresse**. Il porte l'adresse résolue (`address.latitude` / `address.longitude`) :
c'est exactement là que le **point d'évaluation change de grain**.

Dans `src/app/(account)/rapport/page.tsx`, passer le contexte à la section :

```tsx
<DossierAvecLogement … hard={communeResult!.hard} />
```

Dans `DossierAvecLogement.tsx` :

```tsx
import type { EvaluationContext } from "@/lib/hard-constraints";

export async function DossierAvecLogement({
  project, address, savedDpe, communeFacts, communeDossier, logementLink, insee, scopeKey, hard,
}: { /* … */ hard: EvaluationContext }) {
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    const facts: ModuleFacts = { ...communeFacts, hasAddress: true, logement };
    // LE GRAIN CHANGE. Une commune peut passer sur son point de référence et échouer pour une adresse
    // située à son extrémité : ce n'est pas une divergence de moteur, c'est une lecture plus fine, et la
    // phrase le dit (« Cette adresse est à 42 km de… »).
    const hardAtAddress: EvaluationContext = {
      ...hard,
      point: {
        lat: address.latitude, lon: address.longitude,
        grain: "address", source: "address_geocoder", label: address.label,
      },
    };
    const dossier = assembleDossier(runRules(facts, project, hardAtAddress), project, "commune+adresse", facts.nom);
```

Le `catch` (`LogementDataUnavailableError`) est **inchangé** : il retombe sur `communeDossier`, déjà
bâti au grain de la commune.

- [ ] **Step 8 : Vérifier**

Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` → PASS.
Run: `npx tsc --noEmit` → 0.
Run: `npm run build` → succès.

- [ ] **Step 9 : Commit**

```bash
git add -A
git commit -m "feat(dossier): les 11 contraintes dures passent par l'évaluateur partagé

Le dossier n'examinait que 3 contraintes sur 11, et jugeait la taille sur la
population COMMUNALE quand le comparateur la jugeait sur l'agglomération. Les
deux moteurs lisent désormais la même évaluation, et en tirent deux conduites
assumées : le filtre exclut dans le doute, le dossier refuse d'en tirer une
incompatibilité (unexamined -> uncertain, le critère reste non examiné et le
couperet mord).

runRules reçoit le contexte hydraté en 3e paramètre. Les règles de préférence
n'en déclarent que deux : TypeScript les laisse passer, elles ne changent pas."
```

---

## Task 12 : Les tests de parité (dans les deux directions)

**Files:**
- Create: `src/lib/parity.test.ts`

**Interfaces:**
- Consumes: `assessHardConstraints`, `hardFilter`, `HARD_CONSTRAINT_RULES`.

**L'invariant** : à projet, attributs, références et **point d'évaluation** identiques, le comparateur et
le dossier produisent le même statut canonique.

- [ ] **Step 1 : Écrire les tests**

```ts
// LA PARITÉ. Le comparateur et le dossier peuvent avoir des politiques différentes face à une donnée
// manquante. Ils n'ont pas le droit d'être en désaccord sur un CONSTAT.
//
// Le point d'évaluation est dans l'énoncé : une commune peut passer au comparateur sur son centroïde et
// échouer pour une adresse à son extrémité. C'est un changement de GRAIN, pas une divergence de moteur.
import test from "node:test";
import assert from "node:assert/strict";
import { assessHardConstraints, HARD_CONSTRAINT_KEYS, type CommuneAttributes, type EvaluationContext, type NormalizedHardConstraints } from "./hard-constraints.ts";
import { hardFilter } from "./hard-constraints-filter.ts";
import { HARD_CONSTRAINT_RULES } from "./decision/hard-constraint-rules.ts";
import type { ModuleFacts } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

// Le corpus : un cas par situation qui a déjà fait diverger les deux moteurs.
const CORPUS: CommuneAttributes[] = [
  { insee: "31555", nom: "Toulouse", dept: "31", lat: 43.60, lon: 1.44, population: 493_465, tailleVille: 1_060_000, uu: "31701", altitude: 146, reliefProximite: 0, distanceCoteKm: 150 },
  { insee: "29019", nom: "Brest", dept: "29", lat: 48.39, lon: -4.48, population: 139_000, tailleVille: 210_000, uu: "29701", altitude: 35, reliefProximite: 5, distanceCoteKm: 1 },
  { insee: "05061", nom: "Briançon", dept: "05", lat: 44.90, lon: 6.64, population: 11_000, tailleVille: 11_000, uu: null, altitude: 1326, reliefProximite: 100, distanceCoteKm: 130 },
  { insee: "69266", nom: "Villeurbanne", dept: "69", lat: 45.77, lon: 4.88, population: 155_000, tailleVille: 1_600_000, uu: "00760", altitude: 168, reliefProximite: 30, distanceCoteKm: 250 },
  { insee: "99999", nom: "Sans-Donnée", dept: "31", lat: 43.0, lon: 1.0, population: 3_000, tailleVille: 3_000, uu: null, altitude: null, reliefProximite: null, distanceCoteKm: 90 },
];

const PROJETS: { nom: string; constraints: Partial<NormalizedHardConstraints>; hc: unknown }[] = [
  { nom: "département", constraints: { departements: ["31"] }, hc: { departements: ["31"] } },
  { nom: "mer 30 km", constraints: { nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }, hc: { nearSea: { active: true, maxKm: 30 } } },
  { nom: "pas la mer", constraints: { excludeSea: true }, hc: { excludeSea: true } },
  { nom: "montagne", constraints: { montagne: true }, hc: { montagne: { strength: "hard" } } },
  { nom: "relief proche", constraints: { reliefProche: true }, hc: { reliefProche: { strength: "hard" } } },
  { nom: "petite agglo", constraints: { communeSize: { min: null, max: 25_000 } }, hc: { communeSize: { max: 25_000 } } },
];

function ctxOf(c: CommuneAttributes, over: Partial<NormalizedHardConstraints>): EvaluationContext {
  return {
    constraints: { departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
                   nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [],
                   sizeRelativeTo: null, ...over },
    point: { lat: c.lat!, lon: c.lon!, grain: "commune_reference", source: "commune_centroid", label: c.nom },
    conventionsVersion: "hc-conv-1",
  };
}
function factsOf(c: CommuneAttributes): ModuleFacts {
  return { ...c, distanceCoteKm: c.distanceCoteKm ?? 0, catnatInondation: null, inondationRisque: null, scores: {}, hasAddress: false };
}
function projectOf(hc: unknown): UserProject {
  return { posture: "recherche", intent: null, rawText: null,
           parsed: { reformulation: "x", hardConstraints: hc, preferences: [] } as UserProject["parsed"],
           updatedAt: "1970-01-01T00:00:00.000Z" };
}

test("PARITÉ : une commune EXCLUE par le filtre n'est jamais `satisfied` dans le dossier", () => {
  for (const c of CORPUS) {
    for (const p of PROJETS) {
      const ctx = ctxOf(c, p.constraints);
      const assessments = assessHardConstraints(ctx, c);
      const filtre = hardFilter(assessments);
      if (filtre.eligible) continue;
      for (const a of filtre.incompatible) {
        const rule = HARD_CONSTRAINT_RULES.find((r) => r.hardConstraint === a.key)!;
        const e = rule.evaluate(factsOf(c), projectOf(p.hc), ctx);
        assert.equal(e.outcome, "incompatible", `${c.nom} / ${p.nom} / ${a.key}`);
      }
    }
  }
});

test("PARITÉ : une commune RETENUE par le filtre n'est jamais `incompatible` dans le dossier", () => {
  for (const c of CORPUS) {
    for (const p of PROJETS) {
      const ctx = ctxOf(c, p.constraints);
      const filtre = hardFilter(assessHardConstraints(ctx, c));
      if (!filtre.eligible) continue;
      for (const key of HARD_CONSTRAINT_KEYS) {
        const rule = HARD_CONSTRAINT_RULES.find((r) => r.hardConstraint === key)!;
        const e = rule.evaluate(factsOf(c), projectOf(p.hc), ctx);
        assert.notEqual(e.outcome, "incompatible", `${c.nom} / ${p.nom} / ${key}`);
      }
    }
  }
});

test("PARITÉ : une donnée manquante EXCLUT au comparateur et reste `uncertain` au dossier", () => {
  const sansRelief = CORPUS.find((c) => c.nom === "Sans-Donnée")!;
  const ctx = ctxOf(sansRelief, { reliefProche: true });
  assert.equal(hardFilter(assessHardConstraints(ctx, sansRelief)).eligible, false);
  const rule = HARD_CONSTRAINT_RULES.find((r) => r.hardConstraint === "reliefProche")!;
  const e = rule.evaluate(factsOf(sansRelief), projectOf({ reliefProche: { strength: "hard" } }), ctx);
  assert.equal(e.outcome, "uncertain"); // JAMAIS incompatible : la divergence est assumée, et documentée
});
```

- [ ] **Step 2 : Lancer**

Run: `node --test src/lib/parity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 3 : Suite complète**

Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts`
Expected: PASS. Le total doit être **supérieur à 262** (les tests des 3 règles retirées sont remplacés).

- [ ] **Step 4 : Commit**

```bash
git add src/lib/parity.test.ts
git commit -m "test(parité): les deux moteurs ne peuvent plus se contredire

Dans les DEUX directions : une commune exclue par le filtre ne peut pas être
satisfied dans le dossier, et une commune retenue ne peut pas y être
incompatible. La seule divergence autorisée est la donnée manquante (le filtre
exclut, le dossier reste uncertain), et elle est nommée dans le test."
```

---

## Task 13 : La vérification à l'écran

Les branches positives du verdict (« Bonne correspondance », « Correspondance favorable ») n'ont
**jamais** été vues ailleurs que dans une table de vérité. Elles deviennent atteignables ici.

**Files:** aucun (vérification).

- [ ] **Step 1 : Vérifier l'invalidation des artefacts de conclusion**

Ouvrir `src/lib/decision/conclusion-hash.ts` et **confirmer** que le hash d'entrée dépend du **plan
narratif** (donc des faits et de la couverture). Si le hash ne dépendait que du prompt et de la commune,
une conclusion déjà persistée serait resservie sur un dossier qui ne dit plus la même chose.

```bash
node --test src/lib/decision/conclusion-hash.test.ts
```

- [ ] **Step 2 : Lancer l'application et regarder**

```bash
npm run dev
```

Avec le compte de test et le projet Toulouse (« rester impérativement en Haute-Garonne, à moins de 30
minutes de la gare Matabiau, étés supportables, faible risque d'inondation, cadre calme, collèges et
lycées, vie locale, espaces naturels »), ouvrir `/rapport` et vérifier, **à l'écran** :

1. « le département 31 » **n'apparaît plus** dans les contraintes non examinées (il est satisfait).
2. « la proximité de la gare Matabiau » **apparaît toujours** comme non examinée. **C'est correct** :
   elle n'est pas résolue, et le lot 1 refuse de deviner. Elle sera débloquée par le lot 2.
3. Le verdict **ne dit pas** « Bonne correspondance » (la couverture reste `partial` : les préférences
   `cadre_calme`, `acces_ecoles`, `vie_locale`, `nature` restent non couvertes, et `nearPlace` est non
   examinée, donc le couperet mord).

Puis, avec un projet **sans lieu nommé** (« en Bretagne, une commune de moins de 25 000 habitants, pas
au bord de la mer, faible risque d'inondation »), sur une commune bretonne :

4. Le verdict atteint une branche **positive**. Lire la phrase entière, à voix haute. Vérifier qu'aucun
   accord n'est bancal, et que le nom de la commune est bien là.

- [ ] **Step 3 : Vérifier le comparateur**

Sur `/ou-vivre`, saisir « je veux vivre à moins de 30 minutes de la gare Matabiau, en Haute-Garonne » et
vérifier que la phrase **« Une condition que vous avez posée n'a pas pu être appliquée à ces résultats :
la proximité de Gare Matabiau »** s'affiche. Avant ce chantier, le moteur filtrait **sans le dire**.

- [ ] **Step 4 : Build et commit final**

```bash
npm run build
git add -A
git commit -m "chore: vérification à l'écran du lot 1 (contraintes dures canoniques)"
```

---

## Ce que le lot 1 ne fait PAS (et qui part au lot 2)

- Le géocodage BAN des lieux non communaux (« la gare Matabiau », « l'hôpital de Purpan »).
- L'isochrone IGN, la table `reachability_artifact`, le prédicat point-dans-polygone et sa bande de
  tolérance (`insufficient_precision`).
- La **persistance** de la référence résolue dans le projet, l'`inputHash` en base, le read repair.
- L'**ambiguïté posée au lecteur** au parse (« vos 30 minutes de la gare : à pied, en voiture ? »,
  « près de Brest : à quelle distance ? »).

Ces quatre points sont les **critères d'entrée** du plan du lot 2.

## Auto-relecture du plan (faite)

- **Import circulaire évité** : l'hydratation reçoit l'annuaire au lieu d'aller le chercher. Un module
  `hard-constraints-server.ts` aurait importé `comparateur-vie`, qui l'aurait importé en retour.
- **Le second appelant de `runRules`** (`DossierAvecLogement.tsx:30`, le dossier commune + adresse) est
  traité en Task 11 Step 7, et c'est lui qui porte le point à l'adresse.
- **Le comparateur est anonyme** : il n'a pas de projet persisté à hydrater en amont, donc l'hydratation
  vit dans `matchProjects`.
- **`INDEX_POPULATION_YEAR` est à VÉRIFIER** contre l'index (Task 6, Step 5), jamais à supposer.
