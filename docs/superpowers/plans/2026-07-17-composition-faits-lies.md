# Composition narrative de faits liés : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Couche de composition post-évaluation du dossier de décision : deux patrons (`seasonal_climate_tradeoff`, `territory-size-multiple-consequences`) qui composent des évaluations liées en cartes plus intelligibles, sans toucher couverture/outcome/orientation.

**Architecture:** `composeFacts(run, facts, project)` (pur, appelé par les deux appelants de `runRules`) produit des `FactComposition` (vue, hors `DecisionFact`) ; `assembleDossier` retire les faits absorbés des sections avant les caps et compte les cartes visibles ; `buildConclusionPlan` gagne un registre `compositions_found` et des candidats de lead composés ; `FactCompositionCard` rend les deux variantes avec dépliable d'audit.

**Tech Stack:** TypeScript pur (`node --test`), Next.js App Router (Server Components), aucun LLM dans la composition.

**Spec:** `docs/superpowers/specs/2026-07-17-composition-faits-lies-design.md` (10 invariants §9, tables de comportement §4-5).

## Global Constraints

- Aucun em-dash (—) dans les textes ; virgule ou deux points. Jamais d'antithèse « c'est X, pas Y ».
- Fichiers de `src/lib/decision/` : PURS, testables par `node --test` (jamais de value-import de `comparateur-vie.ts`, qui importe `server-only`).
- `FactComposition` n'entre JAMAIS dans l'union `DecisionFact`.
- Gate global : jamais narrer un élément de poids < 2, ni un outcome autre que celui de l'évaluation existante.
- Le côté favorable n'est jamais re-dérivé : preuve via helper canonique sur `rankBands` + `WINTER_MILDNESS_CONVENTION`, aucun seuil recalculé ; preuve non fabricable = patron non déclenché.
- Textes de cartes 100 % déterministes.
- Tests : `node --test src/lib/decision/*.test.ts src/lib/*.test.ts src/lib/climate/*.test.ts` doit rester vert (591 tests existants + les nouveaux) ; `npx tsc --noEmit` = 0.
- Commits fréquents, messages `feat(dossier): …` / `test(dossier): …`, suffixe Co-Authored-By habituel de la session.

---

### Task 1 : Contrats + patron 1 (`seasonal_climate_tradeoff`)

**Files:**
- Create: `src/lib/decision/fact-composition.ts` (types purs)
- Create: `src/lib/decision/fact-compositions.ts` (constructeur)
- Test: `src/lib/decision/fact-compositions.test.ts`

**Interfaces:**
- Consomme : `RunResult`, `ModuleFacts`, `EvidenceRef`, `MaterialityTier`, `VerificationActionType` (`decision-fact.ts`) ; `preferenceWeight(p, key)` (`project-view.ts`) ; `rankPhrase(share)` , `type RankBand` (`mismatch-facts.ts`) ; `WINTER_MILDNESS_CONVENTION` (`../climate/winter-mildness.ts`) ; `PreferenceKey` (type-only, `../comparateur-vie.ts`).
- Produit : `export type FactComposition`, `TradeoffComposition`, `SharedEvidenceComposition`, `CompositionSide`, `SharedEvidenceConsequence` (fact-composition.ts) ; `export function composeFacts(run: RunResult, facts: ModuleFacts, project: UserProject): FactComposition[]` et `export function buildWinterMildnessEvidence(facts: ModuleFacts): EvidenceRef | null` (fact-compositions.ts). Les tâches 2-6 en dépendent.

- [ ] **Step 1 : écrire les types**

`src/lib/decision/fact-composition.ts` :

```ts
// LA COMPOSITION : un PLAN DE PRÉSENTATION, jamais un fait. Hors de l'union DecisionFact (invariant 1).
// Elle référence les objets canoniques (factIds, ruleIds, evidence) et ne recopie jamais leur vérité
// sous une seconde forme indépendante (invariant 2). Types PURS.
import type { EvidenceRef, MaterialityTier, VerificationActionType } from "./decision-fact.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";

export type CompositionSide = {
  label: string; // « Ce qui correspond » / « Ce qui appelle un arbitrage »
  statement: string;
  evidence: EvidenceRef[];
  ruleIds: string[];  // les évaluations référencées (RuleEvaluation n'a pas d'id propre)
  factIds: string[];  // [] pour un côté satisfait (aucun fait émis)
  action?: { type: VerificationActionType; label: string }; // invariant 8 : l'action survit
  limitation?: string; // la limitation du fait absorbé reste sur SON côté
};

export type TradeoffComposition = {
  id: string;
  kind: "tradeoff";
  patternId: "seasonal_climate_tradeoff";
  title: string;
  summary: string;
  favorableSide: CompositionSide;
  unfavorableSide: CompositionSide;
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // hérité du côté défavorable, jamais aggravé par le favorable
  displaySection: "compromises";
};

export type SharedEvidenceConsequence = {
  projectKey: PreferenceKey;
  statement: string;
  materialityTier: MaterialityTier; // le tier PROPRE de chaque conséquence est conservé (invariant 8)
  factId: string;
  limitation?: string;
};

export type SharedEvidenceComposition = {
  id: string;
  kind: "shared_evidence";
  patternId: "territory-size-multiple-consequences";
  title: string;
  summary: string;
  sharedEvidence: EvidenceRef[]; // l'état commun (classification, provenance)
  consequences: SharedEvidenceConsequence[];
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // max des tiers absorbés
  displaySection: "mismatches";
};

export type FactComposition = TradeoffComposition | SharedEvidenceComposition;
```

- [ ] **Step 2 : écrire les tests du patron 1 (échouent)**

`src/lib/decision/fact-compositions.test.ts`. Fabriquer des entrées minimales : un `RunResult` avec les deux évaluations et un `ModuleFacts` partiel casté. Les ruleIds réels sont `territoire.mismatch-douceur_climat` et `territoire.climat-chaleur`.

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { composeFacts, buildWinterMildnessEvidence } from "./fact-compositions.ts";
import type { RunResult, RuleEvaluation, ModuleFacts, VerificationFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

const RULE_DOUCEUR = "territoire.mismatch-douceur_climat";
const RULE_CHALEUR = "territoire.climat-chaleur";

function project(prefs: Record<string, number>): UserProject {
  return {
    posture: "recherche",
    preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })),
    hardConstraints: {},
  } as unknown as UserProject;
}

function chaleurFact(tier: "secondary" | "structuring" = "structuring"): VerificationFact {
  return {
    id: "31555:climat-chaleur", ruleId: RULE_CHALEUR,
    sourceFactIds: ["climat.joursTresChauds", "climat.nuitsTropicales"], module: "territoire",
    role: "verification", materialityTier: tier,
    topic: "les fortes chaleurs à Antibes",
    statement: "Les jours au-dessus de 35 °C augmentent nettement.",
    limitation: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    evidence: [{ factId: "climat.joursTresChauds", module: "territoire", label: "Territoire · Antibes", grain: "commune" }],
    action: { type: "renseigner_adresse", label: "Renseignez une adresse pour évaluer le confort d'été du logement" },
  };
}

function run(evals: RuleEvaluation[]): RunResult {
  return { facts: evals.flatMap((e) => e.facts), evaluations: evals };
}

const douceurSatisfied: RuleEvaluation = {
  ruleId: RULE_DOUCEUR, projectKeys: ["douceur_climat"], outcome: "satisfied", facts: [], reason: "position satisfied",
};
const chaleurEval = (f: VerificationFact): RuleEvaluation => ({
  ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "verification", facts: [f], reason: "exposition notable",
});

const moduleFacts = {
  insee: "06004", nom: "Antibes",
  rankBands: { douceur_climat: { low: 0.9, high: 1 } },
} as unknown as ModuleFacts;

test("tradeoff saisonnier : poids >= 2 des deux côtés, satisfied + fait chaleur émis -> composé", () => {
  const f = chaleurFact();
  const out = composeFacts(run([douceurSatisfied, chaleurEval(f)]), moduleFacts, project({ douceur_climat: 2, faible_chaleur: 3 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "tradeoff");
  if (c.kind !== "tradeoff") return;
  assert.equal(c.materialityTier, "structuring"); // hérité du côté défavorable
  assert.deepEqual(c.absorbedFactIds, [f.id]);
  assert.equal(c.unfavorableSide.action?.label, f.action.label); // invariant 8 : l'action survit
  assert.equal(c.unfavorableSide.limitation, f.limitation);      // la limitation reste sur SON côté
  assert.equal(c.favorableSide.factIds.length, 0);               // aucun fait fabriqué côté satisfait
  assert.ok(c.favorableSide.evidence.length > 0);
});

test("tradeoff : douceur poids 1 ne compose jamais (le silencieux n'est pas repêché)", () => {
  const out = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 1, faible_chaleur: 3 }));
  assert.equal(out.length, 0);
});

test("tradeoff : douceur neutral ne compose pas", () => {
  const neutral: RuleEvaluation = { ...douceurSatisfied, outcome: "neutral" };
  const out = composeFacts(run([neutral, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(out.length, 0);
});

test("tradeoff : aucun fait chaleur émis -> rien (on ne compose que l'affichable seul)", () => {
  const naChaleur: RuleEvaluation = { ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "not_applicable", facts: [], reason: "priorité non déclarée" };
  const out = composeFacts(run([douceurSatisfied, naChaleur]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 1 }));
  assert.equal(out.length, 0);
});

test("tradeoff : bande douceur absente -> preuve non fabricable -> pas de composition (invariant 9)", () => {
  const sansBande = { ...moduleFacts, rankBands: null } as unknown as ModuleFacts;
  const out = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), sansBande, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(out.length, 0);
});

test("buildWinterMildnessEvidence : bande -> preuve avec part supérieure et période de référence", () => {
  const e = buildWinterMildnessEvidence(moduleFacts);
  assert.ok(e);
  assert.match(e!.observedValue!, /les 10 % de communes/); // 1 - 0.9 = 0.10
  assert.match(e!.observedValue!, /1976-2005/);
  assert.equal(buildWinterMildnessEvidence({ ...moduleFacts, rankBands: {} } as unknown as ModuleFacts), null);
});
```

- [ ] **Step 3 : vérifier l'échec**

Run : `node --test src/lib/decision/fact-compositions.test.ts`
Attendu : FAIL (module `fact-compositions.ts` inexistant).

- [ ] **Step 4 : implémenter**

`src/lib/decision/fact-compositions.ts` :

```ts
// LE REGISTRE DES PATRONS DE COMPOSITION (v1 : deux, codés en dur). PUR.
//
// Une relation se DÉCLARE, elle ne se découvre pas : aucun regroupement automatique par sourceFactId
// (invariant 5). Une composition réorganise ce qui aurait été visible séparément ; elle ne rend jamais
// visible ce qui était silencieux (invariant 7). Le côté favorable n'est jamais re-dérivé : outcome
// depuis l'évaluation existante, preuve par helper canonique, aucun seuil recalculé (invariant 9).
import type { RunResult, RuleEvaluation, ModuleFacts, EvidenceRef, VerificationFact, MismatchFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { FactComposition, TradeoffComposition } from "./fact-composition.ts";
import { preferenceWeight } from "./project-view.ts";
import { rankPhrase } from "./mismatch-facts.ts";
import { WINTER_MILDNESS_CONVENTION } from "../climate/winter-mildness.ts";

// Les ruleIds sont des littéraux construits par leurs fabriques ; un test de garde (Step 2, dernier
// test de la tâche 2) casse si l'un d'eux change.
const RULE_DOUCEUR = "territoire.mismatch-douceur_climat";
const RULE_CHALEUR = "territoire.climat-chaleur";

function evaluation(run: RunResult, ruleId: string): RuleEvaluation | null {
  return run.evaluations.find((e) => e.ruleId === ruleId) ?? null;
}

// LA PREUVE DU CÔTÉ SATISFAIT. Un satisfied n'émet aucun fait : sa preuve est construite ici, depuis la
// bande canonique (jamais recalculée). Bande absente ou incohérente avec l'outcome -> null, jamais une
// preuve inventée pour satisfaire une carte.
export function buildWinterMildnessEvidence(facts: ModuleFacts): EvidenceRef | null {
  const band = facts.rankBands?.["douceur_climat"] ?? null;
  if (!band || !Number.isFinite(band.low)) return null;
  const topShare = 1 - band.low; // part supérieure : borne basse 0,90 -> parmi les 10 %
  return {
    factId: "relativePosition.douceur_climat",
    module: "territoire",
    label: `Territoire · ${facts.nom}`,
    observedValue: `parmi ${rankPhrase(topShare)} aux hivers les plus doux (référence ${WINTER_MILDNESS_CONVENTION.referencePeriod})`,
    grain: "commune",
    href: "/rapport/quartier",
  };
}

function composeSeasonalClimateTradeoff(
  run: RunResult, facts: ModuleFacts, project: UserProject,
): TradeoffComposition | null {
  // GATE (spec §4) : tous les éléments narrés à poids >= 2 ; outcome depuis l'évaluation existante ;
  // un fait défavorable RÉELLEMENT produit (on ne compose que l'affichable seul).
  if (preferenceWeight(project, "douceur_climat") < 2) return null;
  if (preferenceWeight(project, "faible_chaleur") < 2) return null;
  const douceur = evaluation(run, RULE_DOUCEUR);
  if (!douceur || douceur.outcome !== "satisfied") return null;
  const chaleur = evaluation(run, RULE_CHALEUR);
  const chaleurFact = (chaleur?.facts ?? []).find((f) => f.role === "verification") as VerificationFact | undefined;
  if (!chaleurFact) return null;
  const favorableEvidence = buildWinterMildnessEvidence(facts);
  if (!favorableEvidence) return null; // invariant 9 : preuve non fabricable = patron non déclenché

  return {
    id: `${facts.insee}:composition-climat-saisons`,
    kind: "tradeoff",
    patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une contrepartie estivale",
    summary: `Les hivers de ${facts.nom} comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.`,
    favorableSide: {
      label: "Ce qui correspond",
      statement: "Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale.",
      evidence: [favorableEvidence],
      ruleIds: [RULE_DOUCEUR],
      factIds: [],
    },
    unfavorableSide: {
      label: "Ce qui appelle un arbitrage",
      statement: chaleurFact.statement,
      evidence: chaleurFact.evidence,
      ruleIds: [RULE_CHALEUR],
      factIds: [chaleurFact.id],
      action: chaleurFact.action,
      limitation: chaleurFact.limitation,
    },
    absorbedFactIds: [chaleurFact.id],
    referencedRuleIds: [RULE_DOUCEUR, RULE_CHALEUR],
    materialityTier: chaleurFact.materialityTier, // la douceur n'aggrave jamais la réserve
    displaySection: "compromises",
  };
}

export function composeFacts(run: RunResult, facts: ModuleFacts, project: UserProject): FactComposition[] {
  const out: FactComposition[] = [];
  const seasonal = composeSeasonalClimateTradeoff(run, facts, project);
  if (seasonal) out.push(seasonal);
  return out;
}
```

- [ ] **Step 5 : vérifier le vert + typecheck**

Run : `node --test src/lib/decision/fact-compositions.test.ts && npx tsc --noEmit`
Attendu : tous PASS, tsc = 0.

- [ ] **Step 6 : commit**

```bash
git add src/lib/decision/fact-composition.ts src/lib/decision/fact-compositions.ts src/lib/decision/fact-compositions.test.ts
git commit -m "feat(dossier): FactComposition + patron seasonal_climate_tradeoff (vue, gates poids>=2, preuve canonique)"
```

---

### Task 2 : Patron 2 (`territory-size-multiple-consequences`) + tests de garde

**Files:**
- Modify: `src/lib/decision/fact-compositions.ts`
- Test: `src/lib/decision/fact-compositions.test.ts` (ajouts)

**Interfaces:**
- Consomme : `TERRITORY_SIZE_FACT_ID` et `AGGLOMERATION_KEYS` (`agglomeration-rules.ts`, exportés), `runRules` (test de garde uniquement, `materiality-rules.ts`).
- Produit : `composeFacts` renvoie aussi des `SharedEvidenceComposition` (le patron 2 est interne au module).

- [ ] **Step 1 : tests (échouent)**

Ajouts dans `fact-compositions.test.ts` :

```ts
import type { MismatchFact } from "./decision-fact.ts";
import { TERRITORY_SIZE_FACT_ID } from "./agglomeration-rules.ts";
import { runRules } from "./materiality-rules.ts";

function tailleMismatch(key: string, tier: "secondary" | "structuring", limitation?: string): MismatchFact {
  return {
    id: `01001:mismatch-${key}`, ruleId: `territoire.taille-${key}`,
    sourceFactIds: [TERRITORY_SIZE_FACT_ID], module: "territoire",
    role: "mismatch", materialityTier: tier,
    topic: key === "eviter_isolement" ? "l'isolement du territoire" : "la taille du territoire",
    statement: `Constat taille pour ${key}.`, projectKey: key as never,
    basis: { kind: "categorical_state", observedCategory: "village", conventionId: "agglomeration-size-v1" },
    evidence: [{ factId: TERRITORY_SIZE_FACT_ID, module: "territoire", label: "Territoire · Ceyzériat", grain: "unite_urbaine" }],
    ...(limitation ? { limitation } : {}),
  } as MismatchFact;
}
const tailleEval = (f: MismatchFact): RuleEvaluation =>
  ({ ruleId: f.ruleId, projectKeys: [f.projectKey], outcome: "mismatch", facts: [f], reason: "catégorie en écart" });

test("shared_evidence : 2 mismatchs taille matériels -> composition, tier max, tiers propres conservés", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const b = tailleMismatch("eviter_isolement", "secondary", "La catégorie de taille utilisée ne décrit pas à elle seule l'accès aux services.");
  const out = composeFacts(run([tailleEval(a), tailleEval(b)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "shared_evidence");
  if (c.kind !== "shared_evidence") return;
  assert.equal(c.materialityTier, "structuring");
  assert.equal(c.consequences.length, 2);
  assert.equal(c.consequences[0]!.materialityTier, "structuring"); // hiérarchie interne : structurant d'abord
  assert.equal(c.consequences[1]!.limitation, b.limitation);       // la limitation reste sur SA conséquence
  assert.deepEqual(new Set(c.absorbedFactIds), new Set([a.id, b.id]));
});

test("shared_evidence : 1 seul fait matériel -> pas de composition (rien à dédupliquer)", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const out = composeFacts(run([tailleEval(a)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 1 }));
  assert.equal(out.length, 0);
});

test("shared_evidence : 2 faits mais sources différentes -> pas de composition", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const b = { ...tailleMismatch("eviter_isolement", "secondary"), sourceFactIds: ["autre.source"] } as MismatchFact;
  const out = composeFacts(run([tailleEval(a), tailleEval(b)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 }));
  assert.equal(out.length, 0);
});

// TEST DE GARDE des littéraux ruleId : le vrai moteur, sur un vrai profil, doit produire les
// évaluations que le module référence par littéral. S'il est renommé côté fabrique, ce test casse.
test("garde : les ruleIds littéraux du module existent dans un vrai run", () => {
  const p = project({ douceur_climat: 2, faible_chaleur: 2, prefere_grande_ville: 2, eviter_isolement: 2 });
  const facts = {
    insee: "06004", nom: "Antibes", hasAddress: false, rankBands: { douceur_climat: { low: 0.9, high: 1 } },
    climat: null, tailleVille: null, tailleVilleSource: null, sante: null, scores: {},
    localNetwork: { measured: false }, higherEd: { measured: false },
    catnatInondation: null, inondationRisque: null,
  } as unknown as ModuleFacts;
  const result = runRules(facts, p, { evaluations: [], unappliedConstraints: [] } as never);
  const ids = new Set(result.evaluations.map((e) => e.ruleId));
  assert.ok(ids.has("territoire.mismatch-douceur_climat"));
  assert.ok(ids.has("territoire.climat-chaleur"));
  assert.ok(ids.has("territoire.taille-prefere_grande_ville"));
});
```

NOTE exécutant : le test de garde appelle `runRules` avec un `EvaluationContext` minimal ; lire la
signature réelle de `runRules` (`materiality-rules.ts:487`) et de `EvaluationContext`
(`hard-constraints.ts`) et construire le contexte comme le fait `territory-facts.ts:158` (ou réutiliser
un helper existant des tests `materiality-rules.test.ts` s'il y en a un). Si la construction du contexte
exige du réseau ou des données, remplacer ce test de garde par une assertion sur les fabriques :
`makeMismatchRule` et les SPECS produisent des ids `territoire.mismatch-<key>` / `territoire.taille-<key>`
(importer les règles et lire `rule.id`).

- [ ] **Step 2 : vérifier l'échec**

Run : `node --test src/lib/decision/fact-compositions.test.ts`
Attendu : FAIL sur les nouveaux tests (patron 2 absent).

- [ ] **Step 3 : implémenter le patron 2**

Ajouts dans `fact-compositions.ts` :

```ts
import { TERRITORY_SIZE_FACT_ID } from "./agglomeration-rules.ts";
import type { SharedEvidenceComposition } from "./fact-composition.ts";
import type { MaterialityTier } from "./decision-fact.ts";

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };

// LE PATRON EST STRICT : source canonique déclarée + clés autorisées. Deux faits partageant une source
// technique hors patron ne se composent pas (invariant 5).
const TERRITORY_SIZE_PATTERN = {
  sourceFactId: TERRITORY_SIZE_FACT_ID,
  allowedProjectKeys: new Set(["prefere_grande_ville", "eviter_isolement", "eviter_grandes_villes"]),
};

function composeTerritorySizeSharedEvidence(run: RunResult, facts: ModuleFacts): SharedEvidenceComposition | null {
  // Seuls les faits MATÉRIELS ÉMIS comptent (poids >= 2 par construction des règles de taille) :
  // une évaluation silencieuse de poids 1 n'est jamais repêchée (invariant 7).
  const eligible = run.facts.filter((f): f is MismatchFact =>
    f.role === "mismatch" &&
    f.sourceFactIds.includes(TERRITORY_SIZE_PATTERN.sourceFactId) &&
    TERRITORY_SIZE_PATTERN.allowedProjectKeys.has(f.projectKey),
  );
  if (eligible.length < 2) return null;

  const ordered = [...eligible].sort((a, b) => TIER_ORDER[a.materialityTier] - TIER_ORDER[b.materialityTier]);
  const top = ordered[0]!;
  return {
    id: `${facts.insee}:composition-taille-consequences`,
    kind: "shared_evidence",
    patternId: "territory-size-multiple-consequences",
    title: "Une même petite taille touche plusieurs dimensions de votre projet",
    summary: `La catégorie de taille de ${facts.nom} répond moins bien à ${ordered.length === 2 ? "deux" : String(ordered.length)} de vos priorités, pour la même raison.`,
    sharedEvidence: top.evidence,
    consequences: ordered.map((f) => ({
      projectKey: f.projectKey,
      statement: f.statement,
      materialityTier: f.materialityTier,
      factId: f.id,
      ...(f.limitation ? { limitation: f.limitation } : {}),
    })),
    absorbedFactIds: ordered.map((f) => f.id),
    referencedRuleIds: [...new Set(ordered.map((f) => f.ruleId))],
    materialityTier: top.materialityTier,
    displaySection: "mismatches",
  };
}
```

Et dans `composeFacts` :

```ts
export function composeFacts(run: RunResult, facts: ModuleFacts, project: UserProject): FactComposition[] {
  const out: FactComposition[] = [];
  const seasonal = composeSeasonalClimateTradeoff(run, facts, project);
  if (seasonal) out.push(seasonal);
  const size = composeTerritorySizeSharedEvidence(run, facts);
  if (size) out.push(size);
  return out;
}
```

- [ ] **Step 4 : vérifier le vert**

Run : `node --test src/lib/decision/fact-compositions.test.ts && npx tsc --noEmit`
Attendu : PASS, tsc = 0.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/fact-compositions.ts src/lib/decision/fact-compositions.test.ts
git commit -m "feat(dossier): patron territory-size-multiple-consequences (shared_evidence, registre strict)"
```

---

### Task 3 : Assembleur (absorbés, caps, comptes de présentation)

**Files:**
- Modify: `src/lib/decision/decision-assembler.ts`
- Modify: `src/lib/decision/decision-fact.ts` (type `Dossier` et `DossierSection`)
- Test: `src/lib/decision/decision-assembler.test.ts` (ajouts)

**Interfaces:**
- Consomme : `FactComposition` (Task 1).
- Produit : `assembleDossier(run, project, scope, communeNom, compositions: FactComposition[] = [])` ; `Dossier` gagne `compositions: FactComposition[]` et `presentation: { elementaryFactShown: number; compositionShown: number; absorbedFactTotal: number }` ; `DossierSection` gagne `compositions: FactComposition[]`. Task 4 consomme les comptes ; Task 5 rend `section.compositions`.

- [ ] **Step 1 : tests (échouent)**

Ajouts dans `decision-assembler.test.ts` (réutiliser les fabriques de faits du fichier existant ; le lire d'abord). Cas à couvrir, avec un run contenant un `VerificationFact` chaleur + deux mismatchs taille + un mismatch quelconque non absorbé :

```ts
// 1. Les faits absorbés quittent les sections (aucun f.id absorbé dans sections[].facts).
// 2. La composition apparaît dans la section déclarée par displaySection (compromises / mismatches)
//    via section.compositions, et compte pour UNE carte : cap mismatches = 3 cartes TOTAL
//    (compositions + faits). Construire 4 mismatchs non absorbés + 1 composition mismatches et
//    vérifier que sections.mismatches contient 1 composition + 2 faits.
// 3. dossier.presentation = { elementaryFactShown, compositionShown, absorbedFactTotal } exacts.
// 4. INVARIANT 3 : même run, avec et sans compositions -> dossier.criteria.coverage et
//    dossier.criteria.orientation strictement identiques.
// 5. conclusionBasis : les absorbedFactIds restent dans conclusionBasis.factIds, et l'evidence des
//    compositions (sides / sharedEvidence) est incluse dans conclusionBasis.evidence.
```

Écrire ces cinq tests avec de vraies assertions (mêmes conventions que le fichier existant).

- [ ] **Step 2 : vérifier l'échec**

Run : `node --test src/lib/decision/decision-assembler.test.ts`
Attendu : FAIL (signature et champs absents).

- [ ] **Step 3 : implémenter**

Dans `decision-fact.ts`, étendre les types (import type-only depuis `fact-composition.ts`) :

```ts
import type { FactComposition } from "./fact-composition.ts";

export type DossierSection = {
  key: string; title: string;
  facts: DecisionFact[];
  compositions: FactComposition[]; // les cartes composées de CETTE section, rendues avant les faits
};

// Dans Dossier, ajouter :
//   compositions: FactComposition[];
//   presentation: { elementaryFactShown: number; compositionShown: number; absorbedFactTotal: number };
```

Dans `decision-assembler.ts` :

```ts
import type { FactComposition } from "./fact-composition.ts";

export function assembleDossier(
  run: RunResult,
  project: UserProject,
  scope: "commune" | "commune+adresse",
  communeNom: string,
  compositions: FactComposition[] = [],
): Dossier {
  // AVANT LES CAPS (spec §6) : un fait absorbé quitte sa section ; il reste dans le dossier interne
  // (couverture, orientation, preuves) et au dépliable de sa composition.
  const absorbed = new Set(compositions.flatMap((c) => c.absorbedFactIds));
  const facts = run.facts.filter((f) => !absorbed.has(f.id));

  const compsBySection = (key: string) =>
    compositions
      .filter((c) => c.displaySection === key)
      .sort((a, b) => TIER_RANK[a.materialityTier] - TIER_RANK[b.materialityTier]);

  // Une composition COMPTE POUR UNE CARTE dans le cap de sa section.
  const section = (key: string, title: string, role: DecisionFact["role"], cap: number): DossierSection => {
    const comps = compsBySection(key);
    return { key, title, compositions: comps, facts: byRole(facts, role, Math.max(0, cap - comps.length)) };
  };

  const candidates: DossierSection[] = [
    section("incompatibilities", "Vos contraintes non négociables", "incompatibility", 2),
    section("mismatches", "Ce qui correspond moins bien", "mismatch", 3),
    section("compromises", "Ce qui départage vraiment", "compromise", 3),
    section("unknowns", "Ce que nous ne savons pas encore", "unknown", 3),
    section("verifications", l.verifTitle, "verification", 4),
  ];
  const sections = candidates.filter((s) => s.facts.length > 0 || s.compositions.length > 0);
  const shown = sections.flatMap((s) => s.facts);
  const shownComps = sections.flatMap((s) => s.compositions);
  // … (le reste de la fonction, adapté comme ci-dessous)
}
```

Comptes transmis à `buildConclusionPlan` (les cartes VISIBLES, spec §7) :

```ts
const tradeoffShown = shownComps.filter((c) => c.kind === "tradeoff");
const sharedShown = shownComps.filter((c) => c.kind === "shared_evidence");
// mismatchTotal reste sur les faits ÉMIS (run.facts, AVANT absorption) : « N de vos priorités » reste vrai.
const mismatchTotal = run.facts.filter((f) => f.role === "mismatch").length;
const mismatchShown = shown.filter((f) => f.role === "mismatch").length + sharedShown.length;
const reservesShownFacts = shown.filter((f) => RESERVE_ROLES.has(f.role));
const reservesShown = reservesShownFacts.length + tradeoffShown.length;
const majorReserveCount =
  reservesShownFacts.filter((f) => f.materialityTier !== "secondary").length +
  tradeoffShown.filter((c) => c.materialityTier !== "secondary").length;
```

`conclusionBasis` (les absorbés fondent toujours la conclusion) :

```ts
conclusionBasis: {
  ruleIds: [...new Set([...shown.map((f) => f.ruleId), ...shownComps.flatMap((c) => c.referencedRuleIds)])],
  factIds: [...shown.map((f) => f.id), ...shownComps.flatMap((c) => c.absorbedFactIds)],
  evidence: [
    ...shown.flatMap(factEvidence),
    ...shownComps.flatMap((c) => c.kind === "tradeoff"
      ? [...c.favorableSide.evidence, ...c.unfavorableSide.evidence]
      : c.sharedEvidence),
  ],
},
```

Et dans l'objet retourné : `compositions: shownComps`, `presentation: { elementaryFactShown: shown.length, compositionShown: shownComps.length, absorbedFactTotal: absorbed.size }`. Passer aussi `shownCompositions: shownComps` à `buildConclusionPlan` (le champ est ajouté en Task 4 ; pour garder cette tâche verte isolément, ne l'ajouter à l'appel qu'en Task 4).

- [ ] **Step 4 : vérifier le vert (suite complète)**

Run : `node --test src/lib/decision/*.test.ts && npx tsc --noEmit`
Attendu : PASS (les tests existants de l'assembleur restent verts : `compositions = []` par défaut reproduit l'ancien comportement à l'identique), tsc = 0.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/decision-assembler.ts src/lib/decision/decision-fact.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(dossier): assembleur compose (absorbés retirés avant caps, 1 composition = 1 carte, comptes de présentation)"
```

---

### Task 4 : Plan narratif (registre `compositions_found`, lead composable, prompt v11)

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts`
- Modify: `src/lib/decision/conclusion-prompt.ts`
- Modify: `src/lib/decision/conclusion-hash.ts` (bump version)
- Modify: `src/lib/decision/decision-assembler.ts` (passer `shownCompositions`)
- Modify: `scripts/probe-conclusion.ts` (champ requis + cas composé)
- Test: `src/lib/decision/conclusion-plan.test.ts` (ajouts)

**Interfaces:**
- Consomme : `FactComposition` (Task 1), comptes (Task 3).
- Produit : `ConclusionPlanInput.shownCompositions: FactComposition[]` (requis) ; `BlockKey` += `"compositions_found"` ; `selectLead(shownFacts, shownCompositions)`.

- [ ] **Step 1 : tests (échouent)**

Ajouts dans `conclusion-plan.test.ts` (réutiliser les fabriques existantes du fichier ; construire une `TradeoffComposition` et une `SharedEvidenceComposition` minimales comme dans les tests des tâches 1-2) :

```ts
// 1. shownCompositions: [tradeoff structuring] + aucune autre réserve structurante ->
//    lead.kind === "single", lead.factId === composition.id, lead.topic === composition.title ;
//    et AUCUN bloc compositions_found (le lead la narre déjà : pas de double narration).
// 2. shownCompositions: [shared_evidence] + une réserve structurante en fait simple ->
//    bloc "compositions_found" présent, APRÈS unexamined_hard_constraints et AVANT reserves_found ;
//    fallbackText contient le summary ; sourceIds = [composition.id, ...absorbedFactIds] ;
//    allowedNumbers inclut le compte des compositions.
// 3. INVARIANT hash : deux plans identiques sauf shownCompositions -> buildConclusionHash différent.
// 4. shownCompositions: [] -> plan strictement identique à l'existant (aucun bloc ajouté,
//    lead inchangé) : non-régression.
```

Écrire ces quatre tests avec de vraies assertions.

- [ ] **Step 2 : vérifier l'échec**

Run : `node --test src/lib/decision/conclusion-plan.test.ts`
Attendu : FAIL.

- [ ] **Step 3 : implémenter**

`conclusion-plan.ts` :

```ts
import type { FactComposition } from "./fact-composition.ts";

export type BlockKey = "verdict" | "unexamined_hard_constraints" | "compositions_found" | "mismatches_found" | "reserves_found" | "uncovered_priorities";

// ConclusionPlanInput gagne (requis, jamais optionnel : un champ optionnel créerait un troisième état) :
//   shownCompositions: FactComposition[];

// LE LEAD PEUT ÊTRE UNE COMPOSITION (spec §7). Les candidats sont les réserves AFFICHÉES plus les
// compositions tradeoff (un shared_evidence est un mismatch : il a son propre registre, comme les
// mismatchs simples). Le candidat composé porte son TITRE en topic et son SUMMARY en statement.
type LeadCandidate = { factId: string; topic: string; statement: string; materialityTier: MaterialityTier };

export function selectLead(shownFacts: DecisionFact[], shownCompositions: FactComposition[] = []): LeadSelection {
  const candidates: LeadCandidate[] = [
    ...reserves(shownFacts).map((f) => ({ factId: f.id, topic: f.topic, statement: f.statement, materialityTier: f.materialityTier })),
    ...shownCompositions.filter((c) => c.kind === "tradeoff")
      .map((c) => ({ factId: c.id, topic: c.title, statement: c.summary, materialityTier: c.materialityTier })),
  ];
  // (même logique qu'aujourd'hui, sur candidates au lieu de rs)
}
```

Dans `buildConclusionPlan`, après le bloc `unexamined_hard_constraints` et avant `reserves_found` :

```ts
// LES COMPOSITIONS NOMMÉES. Une composition désignée lead single est déjà narrée : la re-narrer ici
// la dirait deux fois (le défaut exact que la composition existe pour éviter).
const leadCompId = lead.kind === "single" ? lead.factId : null;
const narratedComps = input.shownCompositions.filter((c) => c.id !== leadCompId);
if (narratedComps.length > 0) {
  blocks.push({
    key: "compositions_found",
    fallbackText: narratedComps.map((c) => endWithPeriod(c.summary)).join(" "),
    sourceIds: narratedComps.flatMap((c) => [c.id, ...c.absorbedFactIds]),
    requiredPhrases: [],
    allowedNumbers: numberForms(narratedComps.length),
    maxChars: 340,
    generable: true,
  });
}
```

Adapter l'appel `selectLead(input.shownFacts, input.shownCompositions)` et, côté `decision-assembler.ts`, passer `shownCompositions: shownComps` dans l'input. Le bloc `mismatches_found` continue de compter les faits mismatch AFFICHÉS (les absorbés n'y sont plus, le registre compositions porte les leurs).

`conclusion-prompt.ts` : ajouter après le paragraphe « LES FAITS DE TÊTE » :

```
LE REGISTRE compositions_found : DES CONSTATS DÉJÀ RELIÉS.
On vous y confie des arbitrages COMPOSÉS par le déterministe : deux dimensions établies qui tirent la
décision dans des directions différentes, ou plusieurs conséquences d'un même état du territoire. Vous ne
reliez jamais deux constats vous-même : la relation vous est donnée. Vous nommez les DEUX côtés (ce qui
correspond ET ce qui appelle un arbitrage), sans les solder en un jugement global (« climat favorable »),
sans moyenne, sans verdict. Ce qui est établi s'ARBITRE, jamais « à vérifier ».
```

`conclusion-hash.ts` : `DECISION_NARRATIVE_PROMPT_VERSION = "v11"` (commentaire : v11 = registre
compositions_found + lead composable).

`scripts/probe-conclusion.ts` : ajouter `shownCompositions: []` aux cas existants, plus un cas composé :

```ts
const planComposition = buildConclusionPlan({
  scope: "commune", communeNom: "Antibes", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [verif("f9", "secondary", "le retrait-gonflement des argiles", "À cette adresse, le sol est exposé au retrait-gonflement des argiles.")],
  shownCompositions: [{
    id: "06004:composition-climat-saisons", kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une contrepartie estivale",
    summary: "Les hivers d'Antibes comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.",
    favorableSide: { label: "Ce qui correspond", statement: "Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale.", evidence: [], ruleIds: ["territoire.mismatch-douceur_climat"], factIds: [] },
    unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "Les jours au-dessus de 35 °C augmentent nettement.", evidence: [], ruleIds: ["territoire.climat-chaleur"], factIds: ["06004:climat-chaleur"] },
    absorbedFactIds: ["06004:climat-chaleur"], referencedRuleIds: ["territoire.mismatch-douceur_climat", "territoire.climat-chaleur"],
    materialityTier: "structuring", displaySection: "compromises",
  }],
  uncovered: [], uncoveredPriorities: [{ key: "qualite_air", label: "la qualité de l'air" }],
  establishedIncompatibility: null, coverage: "high", orientation: "minor_reserves",
  hasFavorable: true, favorableCount: 1, majorReserveCount: 1, reservesShown: 2,
  mismatchTotal: 0, mismatchShown: 0,
});
```

NOTE : avec ce cas, la composition est l'unique réserve structurante -> lead single composé -> PAS de
bloc compositions_found ; le prompt est éprouvé sur « le modèle nomme la composition en lead ». Ajouter
une variante avec une réserve structurante simple en plus pour éprouver AUSSI le bloc compositions_found
(lead tied ou single sur l'autre fait). Câbler les deux cas dans la boucle de tirages du script comme les
cas existants.

- [ ] **Step 4 : vérifier le vert**

Run : `node --test src/lib/decision/*.test.ts && npx tsc --noEmit`
Attendu : PASS (adapter tout appelant de `buildConclusionPlan`/`selectLead` dans les tests existants : champ `shownCompositions: []`), tsc = 0.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-prompt.ts src/lib/decision/conclusion-hash.ts src/lib/decision/decision-assembler.ts src/lib/decision/conclusion-plan.test.ts scripts/probe-conclusion.ts
git commit -m "feat(dossier): registre compositions_found + lead composable, prompt v11, sonde étendue"
```

---

### Task 5 : Rendu (`FactCompositionCard` + intégration section)

**Files:**
- Create: `src/components/report/FactCompositionCard.tsx`
- Modify: `src/components/report/DossierDecisionSection.tsx`

**Interfaces:**
- Consomme : `FactComposition` (Task 1), `DossierSection.compositions` (Task 3), `FactBody`/`EvidenceRow`/`Chip` (à EXPORTER depuis `DossierDecisionSection.tsx`).
- Produit : `<FactCompositionCard composition={c} color={col} absorbedFacts={facts} />`.

- [ ] **Step 1 : exporter les briques de rendu**

Dans `DossierDecisionSection.tsx`, préfixer `export` sur `Chip`, `EvidenceRow`, `FactBody` (aucun autre changement de ces fonctions).

- [ ] **Step 2 : écrire `FactCompositionCard.tsx`**

Server Component présentationnel, deux variantes par `kind`, dépliable `<details>` natif (pas de client component). Idiome existant : eyebrows mono uppercase, texte `text-label 14px`, preuves en chips, pas de code couleur bon/mauvais tranché.

```tsx
// Carte COMPOSÉE : une vue qui relie des constats établis (tradeoff / shared_evidence). Présentationnelle.
// Les faits absorbés restent lisibles au dépliable, dans leur forme d'origine (audit, invariant 4).
import type { FactComposition } from "@/lib/decision/fact-composition";
import type { DecisionFact } from "@/lib/decision/decision-fact";
import { Chip, EvidenceRow, FactBody } from "@/components/report/DossierDecisionSection";

function SideBlock({ side, color }: { side: FactComposition & { kind: "tradeoff" } extends never ? never : import("@/lib/decision/fact-composition").CompositionSide; color: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost mb-1">{side.label}</p>
      <p className="text-label text-[14px] leading-[1.6]">{side.statement}</p>
      {side.limitation ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{side.limitation}</p> : null}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {side.evidence.map((e, i) => (
          <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
        ))}
        {side.action ? (
          <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{side.action.label} →</span>
        ) : null}
      </div>
    </div>
  );
}

export function FactCompositionCard({
  composition, color, absorbedFacts,
}: {
  composition: FactComposition;
  color: string;
  absorbedFacts: DecisionFact[]; // les faits absorbés de CETTE composition, pour le dépliable
}) {
  return (
    <li>
      <p className="text-label text-[15px] font-semibold leading-[1.4]">{composition.title}</p>
      {composition.kind === "tradeoff" ? (
        <div className="mt-2.5 flex flex-col gap-3.5">
          <SideBlock side={composition.favorableSide} color={color} />
          <SideBlock side={composition.unfavorableSide} color={color} />
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost">État observé</p>
            {composition.sharedEvidence.map((e, i) => (
              <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
            ))}
          </div>
          <ul className="flex flex-col gap-2.5">
            {composition.consequences.map((c) => (
              <li key={c.factId} className="pl-3 border-l border-white/[0.12]">
                <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost mb-0.5">
                  {c.materialityTier === "secondary" ? "Point secondaire" : "Priorité structurante"}
                </p>
                <p className="text-muted text-[13px] leading-[1.55]">{c.statement}</p>
                {c.limitation ? <p className="text-ghost text-[12px] leading-[1.5] mt-0.5">{c.limitation}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {absorbedFacts.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[10px] tracking-[0.06em] uppercase text-muted hover:text-label transition-colors">
            Voir {absorbedFacts.length > 1 ? `les ${absorbedFacts.length} constats détaillés` : "le constat détaillé"}
          </summary>
          <ul className="mt-3 flex flex-col gap-4 pl-3 border-l border-white/[0.08]">
            {absorbedFacts.map((f) => (
              <li key={f.id}>
                <FactBody fact={f} />
                <EvidenceRow fact={f} color={color} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}
```

NOTE exécutant : le type de `SideBlock` ci-dessus doit simplement être
`{ side: CompositionSide; color: string }` avec `import type { CompositionSide } from "@/lib/decision/fact-composition"` ;
ne pas reproduire le type conditionnel de l'esquisse.

- [ ] **Step 3 : intégrer dans `DossierDecisionSection.tsx`**

La liste des sections rend les compositions AVANT les faits. Il faut retrouver les faits absorbés pour le
dépliable : ils ne sont plus dans les sections. Ajouter une prop au composant existant, ou (plus simple,
zéro changement d'appelants) porter les faits absorbés DANS le Dossier : dans `decision-assembler.ts`
(Task 3), ajouter au Dossier `absorbedFacts: DecisionFact[]` (`run.facts.filter((f) => absorbed.has(f.id))`).
Faire ce petit ajout ici si non fait en Task 3, avec son assertion dans le test assembleur. Puis :

```tsx
<ul className="flex flex-col gap-5">
  {s.compositions.map((c) => (
    <FactCompositionCard
      key={c.id}
      composition={c}
      color={col}
      absorbedFacts={dossier.absorbedFacts.filter((f) => c.absorbedFactIds.includes(f.id))}
    />
  ))}
  {s.facts.map((f) => { /* rendu existant inchangé */ })}
</ul>
```

Ajouter aussi `mismatches: "var(--orange)"` est INUTILE : `SECTION_ACCENT` n'a pas la clé `mismatches`
aujourd'hui (repli améthyste) ; ne pas y toucher.

- [ ] **Step 4 : vérifier build**

Run : `npx tsc --noEmit && npm run build`
Attendu : 0 erreur, build exit 0.

- [ ] **Step 5 : commit**

```bash
git add src/components/report/FactCompositionCard.tsx src/components/report/DossierDecisionSection.tsx src/lib/decision/decision-assembler.ts src/lib/decision/decision-fact.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(dossier): FactCompositionCard (2 variantes + dépliable d'audit) branchée aux sections"
```

---

### Task 6 : Appelants + vérification de bout en bout

**Files:**
- Modify: `src/lib/decision/territory-facts.ts:158`
- Modify: `src/components/report/DossierAvecLogement.tsx:46`
- Test: vérification manuelle guidée (dev server) + suites complètes

**Interfaces:**
- Consomme : `composeFacts` (Task 1), `assembleDossier` 5e paramètre (Task 3).

- [ ] **Step 1 : brancher les deux appelants**

`territory-facts.ts` (l'appel commune) :

```ts
import { composeFacts } from "./fact-compositions.ts";
// …
const run = runRules(facts, project, hard);
return {
  // …
  dossier: assembleDossier(run, project, "commune", facts.nom, composeFacts(run, facts, project)),
};
```

`DossierAvecLogement.tsx` (l'appel commune+adresse) :

```ts
import { composeFacts } from "@/lib/decision/fact-compositions";
// …
const run = runRules(facts, project, hardAtAddress);
const dossier = assembleDossier(run, project, "commune+adresse", facts.nom, composeFacts(run, facts, project));
```

- [ ] **Step 2 : suites complètes**

Run : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts src/lib/climate/*.test.ts && npx tsc --noEmit && npm run build`
Attendu : tout vert (>= 591 + nouveaux), tsc 0, build exit 0.

- [ ] **Step 3 : vérification vivante (invoquer le skill verify si disponible)**

Dev server (`npm run dev`), puis exercer les deux patrons sur le VRAI parcours :
1. Un compte avec projet `douceur_climat` poids 3 + `faible_chaleur` poids 3, commune active Antibes
   (06004) : la page `/rapport` doit montrer la carte « Des hivers doux, avec une contrepartie estivale »
   dans « Ce qui départage vraiment », SANS carte chaleur dans « À examiner… », avec action et dépliable.
2. Même projet, commune Gouesnou (29061) : AUCUNE composition (pas de fait chaleur), douceur silencieuse.
3. Projet `prefere_grande_ville` poids 3 + `eviter_isolement` poids 2, un village : carte
   « Une même petite taille… » dans « Ce qui correspond moins bien », conséquences hiérarchisées,
   limitation sous la conséquence isolement.
Si l'accès au parcours authentifié est trop coûteux en local, au minimum : appeler la fonction
d'assemblage via un petit script jetable dans le scratchpad qui charge les ModuleFacts réels d'Antibes
(même chemin que `territory-facts.ts`) et imprime les sections. Rapporter honnêtement ce qui a été vérifié.

- [ ] **Step 4 : sonde (nécessite `.env.local`)**

Run : `node --env-file=.env.local scripts/probe-conclusion.ts`
Attendu : les cas composés survivent à la validation sur la majorité des tirages (5) ; sinon itérer le
paragraphe prompt (et garder v11 tant que la session n'est pas livrée).

- [ ] **Step 5 : commit final**

```bash
git add src/lib/decision/territory-facts.ts src/components/report/DossierAvecLogement.tsx
git commit -m "feat(dossier): composition branchée aux deux parcours (commune, commune+adresse)"
```

---

## Auto-revue du plan (faite à l'écriture)

- Couverture spec : §1-2 -> Task 1 ; §3-4 -> Task 1 ; §5 -> Task 2 ; §6 -> Task 3 ; §7 -> Task 4 ; §8 -> Task 5 ; §10 -> chaque tâche + Task 6 ; invariants §9 : 1-2 (types, Task 1), 3 (test assembleur, Task 3), 4 (dépliable, Task 5 + test Task 3), 5 (registre strict, Task 2), 6-7 (gates, Tasks 1-2), 8 (action/limitation, tests Tasks 1-2), 9 (helper canonique + test bande absente, Task 1), 10 (textes déterministes sans verdict global, Tasks 1-2 + prompt Task 4).
- Cohérence de types : `compositions` param 5 de `assembleDossier` (Tasks 3, 6) ; `DossierSection.compositions` (Tasks 3, 5) ; `absorbedFacts` sur Dossier (Tasks 3/5, noté explicitement) ; `shownCompositions` requis (Task 4, avec adaptation des call sites existants).
