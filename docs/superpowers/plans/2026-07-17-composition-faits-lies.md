# Composition narrative de faits liés : plan d'implémentation (v2, post-revue)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Couche de composition post-évaluation du dossier de décision : deux patrons (`seasonal_climate_tradeoff`, `territory-size-multiple-consequences`) qui composent des évaluations liées en cartes plus intelligibles, sans toucher couverture/outcome/orientation.

**Architecture:** `composeFacts(run, facts, project)` (pur) produit des `FactComposition` (vue, hors `DecisionFact`), validées par `assertCompositionsValid` ; `assembleDossier` fusionne faits non absorbés et compositions en une liste unique de `DossierCard` triée par matérialité puis cappée ; `buildConclusionPlan` gagne un registre `compositions_found` et des candidats de lead tradeoff ; `FactCompositionCard` rend les deux variantes avec dépliable d'audit, sur des briques partagées extraites dans `DecisionFactRenderParts.tsx`.

**Tech Stack:** TypeScript pur (`node --test`), Next.js App Router (Server Components), aucun LLM dans la composition.

**Spec:** `docs/superpowers/specs/2026-07-17-composition-faits-lies-design.md` (10 invariants §9).

**Révisions v2 (revue croisée porteur/ChatGPT, vérifiée contre le code)** : liste unique de cartes triée puis cappée (une composition secondary ne passe jamais devant un fait structurant, le cap s'applique aussi aux compositions) ; extraction `DecisionFactRenderParts.tsx` (boucle d'import) ; `assertCompositionsValid` ; patron taille borné au basis `categorical_state` + même `observedCategory` (et `eviter_grandes_villes` retiré : `satisfied` sur village, jamais composable) ; tri totalement déterministe (tie-break `projectKey` puis `id`) ; ruleIds exportés par leurs modules au lieu de littéraux recopiés ; gardes complètes de bande (export `bandValide`). Non retenus, preuve au code : `allowedNumbers` (le validateur autorise déjà les nombres du fallback, `conclusion-validate.ts:100`) ; interactivité des actions (l'existant rend l'action en `<span>` non cliquable, parité exacte) ; lead pour `shared_evidence` (les mismatchs sont exclus du lead par doctrine ; un mismatch composé n'obtient pas un accès que les simples n'ont pas) ; température DJF dans la preuve (absente de `ModuleFacts`, pas de nouveau câblage pour une carte).

## Global Constraints

- Aucun em-dash (—) dans les textes ; virgule ou deux points. Jamais d'antithèse « c'est X, pas Y ».
- Fichiers de `src/lib/decision/` : PURS, testables par `node --test` (jamais de value-import de `comparateur-vie.ts`, qui importe `server-only`).
- `FactComposition` n'entre JAMAIS dans l'union `DecisionFact`.
- Gate global : jamais narrer un élément de poids < 2, ni un outcome autre que celui de l'évaluation existante.
- Le côté favorable n'est jamais re-dérivé : preuve via helper canonique sur `rankBands` + `WINTER_MILDNESS_CONVENTION`, aucun seuil recalculé ; preuve non fabricable = patron non déclenché. La preuve favorable porte UNIQUEMENT la position nationale et la période 1976-2005 (pas de température : elle n'est pas dans `ModuleFacts`).
- Textes de cartes 100 % déterministes.
- Tests : `node --test src/lib/decision/*.test.ts src/lib/*.test.ts src/lib/climate/*.test.ts` doit rester vert (591 existants + nouveaux) ; `npx tsc --noEmit` = 0.
- Commits fréquents, messages `feat(dossier): …` / `test(dossier): …`, suffixe Co-Authored-By habituel de la session.

---

### Task 1 : Contrats + patron 1 (`seasonal_climate_tradeoff`)

**Files:**
- Create: `src/lib/decision/fact-composition.ts` (types purs)
- Create: `src/lib/decision/fact-compositions.ts` (constructeur + validateur)
- Modify: `src/lib/decision/materiality-rules.ts` (exporter `RULE_CHALEUR`)
- Modify: `src/lib/decision/mismatch-rules.ts` (exporter `mismatchRuleId`)
- Modify: `src/lib/decision/mismatch-facts.ts` (exporter `bandValide`)
- Test: `src/lib/decision/fact-compositions.test.ts`

**Interfaces:**
- Consomme : `RunResult`, `ModuleFacts`, `EvidenceRef`, `MaterialityTier`, `VerificationActionType`, `VerificationFact` (`decision-fact.ts`) ; `preferenceWeight(p, key)` (`project-view.ts`) ; `rankPhrase`, `bandValide`, `type RankBand` (`mismatch-facts.ts`) ; `WINTER_MILDNESS_CONVENTION` (`../climate/winter-mildness.ts`) ; `PreferenceKey` (type-only, `../comparateur-vie.ts`).
- Produit : `FactComposition`, `TradeoffComposition`, `SharedEvidenceComposition`, `CompositionSide`, `SharedEvidenceConsequence` (fact-composition.ts) ; `composeFacts(run, facts, project): FactComposition[]`, `buildWinterMildnessEvidence(facts): EvidenceRef | null`, `assertCompositionsValid(run, compositions): void` (fact-compositions.ts) ; `RULE_CHALEUR` (materiality-rules.ts) ; `mismatchRuleId(key: PreferenceKey): string` (mismatch-rules.ts).

- [ ] **Step 1 : exporter les identifiants canoniques**

Quand un autre module doit connaître l'identifiant d'une règle, il l'importe, il ne le recopie pas.

`materiality-rules.ts` : préfixer `export` sur `const RULE_CHALEUR = "territoire.climat-chaleur"` (ligne 152, aucun autre changement).

`mismatch-rules.ts` : extraire la construction de l'id de `makeMismatchRule` :

```ts
// L'IDENTIFIANT CANONIQUE d'une règle de mismatch relative. Exporté : la couche de composition le
// référence, et l'importer garantit qu'un renommage casse le typecheck, jamais silencieusement l'UI.
export const mismatchRuleId = (key: PreferenceKey): string => `territoire.mismatch-${key}`;
```

et utiliser `const id = mismatchRuleId(key);` dans `makeMismatchRule` (`mismatch-rules.ts:42`).

`mismatch-facts.ts` : préfixer `export` sur `function bandValide` (ligne 27, aucun autre changement).

- [ ] **Step 2 : écrire les types**

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

- [ ] **Step 3 : écrire les tests du patron 1 (échouent)**

`src/lib/decision/fact-compositions.test.ts` :

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { composeFacts, buildWinterMildnessEvidence, assertCompositionsValid } from "./fact-compositions.ts";
import { RULE_CHALEUR } from "./materiality-rules.ts";
import { mismatchRuleId } from "./mismatch-rules.ts";
import type { RunResult, RuleEvaluation, ModuleFacts, VerificationFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

const RULE_DOUCEUR = mismatchRuleId("douceur_climat");

function project(prefs: Record<string, number>): UserProject {
  return {
    posture: "recherche",
    preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })),
    hardConstraints: {},
  } as unknown as UserProject;
}

function chaleurFact(tier: "secondary" | "structuring" = "structuring"): VerificationFact {
  return {
    id: "06004:climat-chaleur", ruleId: RULE_CHALEUR,
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

test("tradeoff : bande douceur absente ou corrompue -> pas de composition (invariant 9)", () => {
  const sansBande = { ...moduleFacts, rankBands: null } as unknown as ModuleFacts;
  assert.equal(composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), sansBande, project({ douceur_climat: 3, faible_chaleur: 3 })).length, 0);
  const corrompue = { ...moduleFacts, rankBands: { douceur_climat: { low: 1.4, high: 0.2 } } } as unknown as ModuleFacts;
  assert.equal(composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), corrompue, project({ douceur_climat: 3, faible_chaleur: 3 })).length, 0);
});

test("buildWinterMildnessEvidence : bande -> preuve avec part supérieure et période de référence", () => {
  const e = buildWinterMildnessEvidence(moduleFacts);
  assert.ok(e);
  assert.match(e!.observedValue!, /les 10 % de communes/); // 1 - 0.9 = 0.10
  assert.match(e!.observedValue!, /1976-2005/);
  assert.equal(buildWinterMildnessEvidence({ ...moduleFacts, rankBands: {} } as unknown as ModuleFacts), null);
});

test("assertCompositionsValid : id dupliqué, absorbé inexistant, double absorption, mauvaise section -> jette", () => {
  const f = chaleurFact();
  const r = run([douceurSatisfied, chaleurEval(f)]);
  const [c] = composeFacts(r, moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.doesNotThrow(() => assertCompositionsValid(r, [c!]));
  assert.throws(() => assertCompositionsValid(r, [c!, c!])); // id dupliqué + double absorption
  assert.throws(() => assertCompositionsValid(r, [{ ...c!, absorbedFactIds: ["inexistant"] } as never]));
  assert.throws(() => assertCompositionsValid(r, [{ ...c!, displaySection: "mismatches" } as never]));
});
```

- [ ] **Step 4 : vérifier l'échec**

Run : `node --test src/lib/decision/fact-compositions.test.ts`
Attendu : FAIL (module inexistant).

- [ ] **Step 5 : implémenter**

`src/lib/decision/fact-compositions.ts` :

```ts
// LE REGISTRE DES PATRONS DE COMPOSITION (v1 : deux, codés en dur). PUR.
//
// Une relation se DÉCLARE, elle ne se découvre pas : aucun regroupement automatique par sourceFactId
// (invariant 5). Une composition réorganise ce qui aurait été visible séparément ; elle ne rend jamais
// visible ce qui était silencieux (invariant 7). Le côté favorable n'est jamais re-dérivé : outcome
// depuis l'évaluation existante, preuve par helper canonique, aucun seuil recalculé (invariant 9).
import type { RunResult, RuleEvaluation, ModuleFacts, EvidenceRef, VerificationFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { FactComposition, TradeoffComposition } from "./fact-composition.ts";
import { preferenceWeight } from "./project-view.ts";
import { rankPhrase, bandValide } from "./mismatch-facts.ts";
import { mismatchRuleId } from "./mismatch-rules.ts";
import { RULE_CHALEUR } from "./materiality-rules.ts";
import { WINTER_MILDNESS_CONVENTION } from "../climate/winter-mildness.ts";

const RULE_DOUCEUR = mismatchRuleId("douceur_climat");

function evaluation(run: RunResult, ruleId: string): RuleEvaluation | null {
  return run.evaluations.find((e) => e.ruleId === ruleId) ?? null;
}

// LA PREUVE DU CÔTÉ SATISFAIT. Un satisfied n'émet aucun fait : sa preuve est construite ici, depuis la
// bande canonique (jamais recalculée, gardes complètes via bandValide). Bande absente ou corrompue ->
// null, jamais une preuve inventée pour satisfaire une carte.
export function buildWinterMildnessEvidence(facts: ModuleFacts): EvidenceRef | null {
  const band = facts.rankBands?.["douceur_climat"] ?? null;
  if (!bandValide(band)) return null;
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
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
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

// LE VALIDATEUR : l'assembleur ne fait pas confiance au constructeur (même doctrine qu'assertFactValid).
// Jette : un patron futur qui absorberait deux fois une carte ou masquerait un fait inexistant doit
// exploser en développement, jamais rendre une UI silencieusement incohérente.
export function assertCompositionsValid(run: RunResult, compositions: FactComposition[]): void {
  const factIds = new Set(run.facts.map((f) => f.id));
  const ruleIds = new Set(run.evaluations.map((e) => e.ruleId));
  const seenCompIds = new Set<string>();
  const seenAbsorbed = new Set<string>();
  for (const c of compositions) {
    if (seenCompIds.has(c.id)) throw new Error(`composition dupliquée : ${c.id}`);
    seenCompIds.add(c.id);
    if (c.kind === "tradeoff" && c.displaySection !== "compromises") throw new Error(`tradeoff hors compromises : ${c.id}`);
    if (c.kind === "shared_evidence" && c.displaySection !== "mismatches") throw new Error(`shared_evidence hors mismatches : ${c.id}`);
    if (c.absorbedFactIds.length === 0) throw new Error(`composition sans absorbé : ${c.id}`);
    for (const id of c.absorbedFactIds) {
      if (!factIds.has(id)) throw new Error(`fait absorbé inexistant : ${id} (${c.id})`);
      if (seenAbsorbed.has(id)) throw new Error(`fait absorbé deux fois : ${id}`);
      seenAbsorbed.add(id);
    }
    for (const rid of c.referencedRuleIds) {
      if (!ruleIds.has(rid)) throw new Error(`ruleId référencé inexistant : ${rid} (${c.id})`);
    }
  }
}

export function composeFacts(run: RunResult, facts: ModuleFacts, project: UserProject): FactComposition[] {
  const out: FactComposition[] = [];
  const seasonal = composeSeasonalClimateTradeoff(run, facts, project);
  if (seasonal) out.push(seasonal);
  assertCompositionsValid(run, out); // toujours : le jeu est minuscule, l'incohérence silencieuse coûte plus
  return out;
}
```

- [ ] **Step 6 : vérifier le vert + typecheck**

Run : `node --test src/lib/decision/fact-compositions.test.ts src/lib/decision/mismatch-rules.test.ts src/lib/decision/materiality-rules.test.ts && npx tsc --noEmit`
Attendu : tous PASS (les exports n'ont rien changé au comportement), tsc = 0.

- [ ] **Step 7 : commit**

```bash
git add src/lib/decision/fact-composition.ts src/lib/decision/fact-compositions.ts src/lib/decision/fact-compositions.test.ts src/lib/decision/materiality-rules.ts src/lib/decision/mismatch-rules.ts src/lib/decision/mismatch-facts.ts
git commit -m "feat(dossier): FactComposition + patron seasonal_climate_tradeoff + validateur (gates poids>=2, preuve canonique)"
```

---

### Task 2 : Patron 2 (`territory-size-multiple-consequences`)

**Files:**
- Modify: `src/lib/decision/fact-compositions.ts`
- Test: `src/lib/decision/fact-compositions.test.ts` (ajouts)

**Interfaces:**
- Consomme : `TERRITORY_SIZE_FACT_ID` (`agglomeration-rules.ts`, exporté) ; `AGGLOMERATION_SIZE_CONVENTION` (vérifier son export réel dans `agglomeration-facts.ts` ; s'il s'appelle autrement, utiliser le nom réel).
- Produit : `composeFacts` renvoie aussi des `SharedEvidenceComposition`.

- [ ] **Step 1 : tests (échouent)**

Ajouts dans `fact-compositions.test.ts` :

```ts
import type { MismatchFact } from "./decision-fact.ts";
import { TERRITORY_SIZE_FACT_ID } from "./agglomeration-rules.ts";

function tailleMismatch(key: string, tier: "secondary" | "structuring", over: Partial<MismatchFact> = {}): MismatchFact {
  return {
    id: `01001:mismatch-${key}`, ruleId: `territoire.taille-${key}`,
    sourceFactIds: [TERRITORY_SIZE_FACT_ID], module: "territoire",
    role: "mismatch", materialityTier: tier,
    topic: key === "eviter_isolement" ? "l'isolement du territoire" : "la taille du territoire",
    statement: `Constat taille pour ${key}.`, projectKey: key as never,
    basis: { kind: "categorical_state", observedCategory: "village", conventionId: "agglomeration-size-v1" },
    evidence: [{ factId: TERRITORY_SIZE_FACT_ID, module: "territoire", label: "Territoire · Ceyzériat", grain: "unite_urbaine" }],
    ...over,
  } as MismatchFact;
}
const tailleEval = (f: MismatchFact): RuleEvaluation =>
  ({ ruleId: f.ruleId, projectKeys: [f.projectKey], outcome: "mismatch", facts: [f], reason: "catégorie en écart" });

test("shared_evidence : 2 mismatchs taille matériels village -> composition, tier max, tiers propres conservés", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const b = tailleMismatch("eviter_isolement", "secondary", { limitation: "La catégorie de taille utilisée ne décrit pas à elle seule l'accès aux services." });
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

test("shared_evidence : ordre d'entrée inversé -> composition strictement identique (déterminisme total)", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const b = tailleMismatch("eviter_isolement", "structuring"); // même tier : le tie-break doit trancher
  const p = project({ prefere_grande_ville: 3, eviter_isolement: 3 });
  const out1 = composeFacts(run([tailleEval(a), tailleEval(b)]), moduleFacts, p);
  const out2 = composeFacts(run([tailleEval(b), tailleEval(a)]), moduleFacts, p);
  assert.deepEqual(out1, out2);
});

test("shared_evidence : 1 seul fait matériel -> pas de composition (rien à dédupliquer)", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const out = composeFacts(run([tailleEval(a)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 1 }));
  assert.equal(out.length, 0);
});

test("shared_evidence : sources différentes, basis non catégoriel, ou catégories divergentes -> pas de composition", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const autreSource = tailleMismatch("eviter_isolement", "secondary", { sourceFactIds: ["autre.source"] });
  assert.equal(composeFacts(run([tailleEval(a), tailleEval(autreSource)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 })).length, 0);
  const mauvaisBasis = tailleMismatch("eviter_isolement", "secondary", { basis: { kind: "relative_position", rankLow: 0.1, rankHigh: 0.2, universe: "communes_france", distributionVersion: "x" } as never });
  assert.equal(composeFacts(run([tailleEval(a), tailleEval(mauvaisBasis)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 })).length, 0);
  const autreCategorie = tailleMismatch("eviter_isolement", "secondary", { basis: { kind: "categorical_state", observedCategory: "petite", conventionId: "agglomeration-size-v1" } as never });
  assert.equal(composeFacts(run([tailleEval(a), tailleEval(autreCategorie)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 })).length, 0);
});
```

NOTE exécutant : le `conventionId` "agglomeration-size-v1" des fabriques de test doit être remplacé par
la valeur RÉELLE de la convention (lire `agglomeration-facts.ts`, importer la constante plutôt que
recopier la chaîne).

- [ ] **Step 2 : vérifier l'échec**

Run : `node --test src/lib/decision/fact-compositions.test.ts`
Attendu : FAIL sur les nouveaux tests.

- [ ] **Step 3 : implémenter le patron 2**

Ajouts dans `fact-compositions.ts` :

```ts
import { TERRITORY_SIZE_FACT_ID } from "./agglomeration-rules.ts";
import type { SharedEvidenceComposition } from "./fact-composition.ts";
import type { MaterialityTier, MismatchFact } from "./decision-fact.ts";
// + importer la constante de convention d'agglo (nom réel dans agglomeration-facts.ts)

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };

// LE PATRON EST STRICT (invariant 5) : source canonique + clés autorisées + basis catégoriel de la même
// convention et de la MÊME catégorie observée. Le titre affirme « une même petite taille » : le patron
// n'a le droit de se déclencher que si c'est vrai. eviter_grandes_villes est ABSENT : sur un village il
// est satisfied, il ne produit jamais un mismatch à regrouper ici.
const TERRITORY_SIZE_PATTERN = {
  sourceFactId: TERRITORY_SIZE_FACT_ID,
  allowedProjectKeys: new Set(["prefere_grande_ville", "eviter_isolement"]),
  requiredBasisKind: "categorical_state" as const,
  composableCategories: new Set(["village"]), // v1 : le seul cas réellement produit par les règles
};

function composeTerritorySizeSharedEvidence(run: RunResult, facts: ModuleFacts): SharedEvidenceComposition | null {
  // Seuls les faits MATÉRIELS ÉMIS comptent (poids >= 2 par construction des règles de taille) :
  // une évaluation silencieuse de poids 1 n'est jamais repêchée (invariant 7).
  const eligible = run.facts.filter((f): f is MismatchFact =>
    f.role === "mismatch" &&
    f.sourceFactIds.includes(TERRITORY_SIZE_PATTERN.sourceFactId) &&
    TERRITORY_SIZE_PATTERN.allowedProjectKeys.has(f.projectKey) &&
    f.basis.kind === TERRITORY_SIZE_PATTERN.requiredBasisKind &&
    TERRITORY_SIZE_PATTERN.composableCategories.has(f.basis.observedCategory),
  );
  if (eligible.length < 2) return null;
  // L'ÉTAT COMMUN doit être commun : même catégorie observée sur tous les faits regroupés.
  const categories = new Set(eligible.map((f) => (f.basis as { observedCategory: string }).observedCategory));
  if (categories.size !== 1) return null;

  // TRI TOTALEMENT DÉTERMINISTE : cette couche entre dans le hash narratif ; l'ordre d'enregistrement
  // des règles ne doit jamais changer une composition.
  const ordered = [...eligible].sort((a, b) =>
    TIER_ORDER[a.materialityTier] - TIER_ORDER[b.materialityTier] ||
    a.projectKey.localeCompare(b.projectKey) ||
    a.id.localeCompare(b.id),
  );
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

Et dans `composeFacts`, avant le `assertCompositionsValid` :

```ts
const size = composeTerritorySizeSharedEvidence(run, facts);
if (size) out.push(size);
```

- [ ] **Step 4 : vérifier le vert**

Run : `node --test src/lib/decision/fact-compositions.test.ts && npx tsc --noEmit`
Attendu : PASS, tsc = 0.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/fact-compositions.ts src/lib/decision/fact-compositions.test.ts
git commit -m "feat(dossier): patron territory-size-multiple-consequences (basis catégoriel requis, tri déterministe)"
```

---

### Task 3 : Assembleur (liste unique de cartes, absorbés, caps, comptes)

**Files:**
- Modify: `src/lib/decision/decision-assembler.ts`
- Modify: `src/lib/decision/decision-fact.ts` (types `Dossier`, `DossierSection`, `DossierCard`)
- Test: `src/lib/decision/decision-assembler.test.ts` (ajouts)

**Interfaces:**
- Consomme : `FactComposition`, `assertCompositionsValid` (Task 1).
- Produit : `assembleDossier(run, project, scope, communeNom, compositions: FactComposition[] = [])` ; `DossierCard = { kind: "fact"; fact: DecisionFact } | { kind: "composition"; composition: FactComposition }` ; `DossierSection.cards: DossierCard[]` (remplace `facts`) ; `Dossier` gagne `compositions`, `absorbedFacts: DecisionFact[]`, `presentation: { elementaryFactShown: number; compositionShown: number; absorbedFactTotal: number }`. Tasks 4-5 en dépendent.

- [ ] **Step 1 : tests (échouent)**

Lire d'abord `decision-assembler.test.ts` et réutiliser ses fabriques. Cas à couvrir :

```ts
// 1. Les faits absorbés ne sont dans AUCUNE section.cards ; ils sont dans dossier.absorbedFacts.
// 2. UNE LISTE UNIQUE TRIÉE PUIS CAPPÉE : dans la section mismatches (cap 3), avec
//    1 composition shared_evidence SECONDARY + 3 faits mismatch STRUCTURING non absorbés,
//    les 3 cartes affichées sont les 3 faits structurants : la composition secondary ne passe
//    jamais devant un fait plus matériel. À tier égal, la composition passe d'abord.
// 3. 4 compositions dans une section cap 3 -> 3 cartes seulement (le cap s'applique aussi à elles).
// 4. dossier.presentation = { elementaryFactShown, compositionShown, absorbedFactTotal } exacts,
//    comptés sur les cartes AFFICHÉES.
// 5. INVARIANT 3 : même run, avec et sans compositions -> criteria.coverage et criteria.orientation
//    strictement identiques.
// 6. conclusionBasis : absorbedFactIds présents dans factIds ; evidence inclut les preuves des
//    compositions affichées (sides / sharedEvidence) ; ruleIds inclut referencedRuleIds.
// 7. compositions = [] (défaut) -> sections identiques à l'existant (non-régression, cartes kind "fact").
```

- [ ] **Step 2 : vérifier l'échec**

Run : `node --test src/lib/decision/decision-assembler.test.ts`
Attendu : FAIL.

- [ ] **Step 3 : implémenter**

`decision-fact.ts` :

```ts
import type { FactComposition } from "./fact-composition.ts";

// LA CARTE DE PRÉSENTATION : fait simple ou composition, dans UNE liste commune. Une composition
// compte pour une carte, donc elle vit dans la même liste, sous le même tri et le même cap : elle ne
// passe jamais devant une carte plus matérielle du seul fait d'être composée.
export type DossierCard =
  | { kind: "fact"; fact: DecisionFact }
  | { kind: "composition"; composition: FactComposition };

export type DossierSection = { key: string; title: string; cards: DossierCard[] };

// Dans Dossier, ajouter :
//   compositions: FactComposition[];            // les compositions AFFICHÉES
//   absorbedFacts: DecisionFact[];              // pour le dépliable d'audit (invariant 4)
//   presentation: { elementaryFactShown: number; compositionShown: number; absorbedFactTotal: number };
```

`decision-assembler.ts` :

```ts
import type { FactComposition } from "./fact-composition.ts";
import { assertCompositionsValid } from "./fact-compositions.ts";

function cardTier(c: DossierCard): number {
  // Même échelle que tierRank ; à TIER ÉGAL la composition passe d'abord (elle porte plus
  // d'information par carte), d'où le -1 sur une échelle x2.
  return c.kind === "fact" ? tierRank(c.fact) : TIER_RANK[c.composition.materialityTier] * 2 - 1;
}

function sectionCards(
  facts: DecisionFact[], comps: FactComposition[],
  role: DecisionFact["role"], sectionKey: string, cap: number,
): DossierCard[] {
  const cards: DossierCard[] = [
    ...facts.filter((f) => f.role === role).map((f) => ({ kind: "fact" as const, fact: f })),
    ...comps.filter((c) => c.displaySection === sectionKey).map((c) => ({ kind: "composition" as const, composition: c })),
  ];
  return cards.sort((a, b) => cardTier(a) - cardTier(b)).slice(0, cap);
}

export function assembleDossier(
  run: RunResult, project: UserProject,
  scope: "commune" | "commune+adresse", communeNom: string,
  compositions: FactComposition[] = [],
): Dossier {
  assertCompositionsValid(run, compositions);
  // AVANT LES CAPS (spec §6) : un fait absorbé quitte sa section ; il reste dans le dossier interne
  // (couverture, orientation, preuves) et au dépliable de sa composition.
  const absorbed = new Set(compositions.flatMap((c) => c.absorbedFactIds));
  const facts = run.facts.filter((f) => !absorbed.has(f.id));

  const candidates: DossierSection[] = [
    { key: "incompatibilities", title: "Vos contraintes non négociables", cards: sectionCards(facts, compositions, "incompatibility", "incompatibilities", 2) },
    { key: "mismatches", title: "Ce qui correspond moins bien", cards: sectionCards(facts, compositions, "mismatch", "mismatches", 3) },
    { key: "compromises", title: "Ce qui départage vraiment", cards: sectionCards(facts, compositions, "compromise", "compromises", 3) },
    { key: "unknowns", title: "Ce que nous ne savons pas encore", cards: sectionCards(facts, compositions, "unknown", "unknowns", 3) },
    { key: "verifications", title: l.verifTitle, cards: sectionCards(facts, compositions, "verification", "verifications", 4) },
  ];
  const sections = candidates.filter((s) => s.cards.length > 0);
  const shown = sections.flatMap((s) => s.cards).filter((c) => c.kind === "fact").map((c) => c.fact);
  const shownComps = sections.flatMap((s) => s.cards).filter((c) => c.kind === "composition").map((c) => c.composition);
  // … suite : comptes, plan, retour (ci-dessous)
}
```

Comptes transmis à `buildConclusionPlan` (les cartes VISIBLES, spec §7). NB : `mismatchShown` n'est
consommé par AUCUN texte aujourd'hui (vérifié) ; sa sémantique devient « cartes mismatch visibles »,
documentée sur le champ :

```ts
const tradeoffShown = shownComps.filter((c) => c.kind === "tradeoff");
const sharedShown = shownComps.filter((c) => c.kind === "shared_evidence");
// mismatchTotal reste sur les faits ÉMIS (run.facts, AVANT absorption) : « N de vos priorités » reste vrai.
const mismatchTotal = run.facts.filter((f) => f.role === "mismatch").length;
// CARTES mismatch visibles (faits simples + compositions shared_evidence).
const mismatchShown = shown.filter((f) => f.role === "mismatch").length + sharedShown.length;
const reservesShownFacts = shown.filter((f) => RESERVE_ROLES.has(f.role));
// Un tradeoff porte une réserve (son côté défavorable est une verification) : il compte pour UNE
// carte-réserve, comme un compromise aujourd'hui.
const reservesShown = reservesShownFacts.length + tradeoffShown.length;
const majorReserveCount =
  reservesShownFacts.filter((f) => f.materialityTier !== "secondary").length +
  tradeoffShown.filter((c) => c.materialityTier !== "secondary").length;
```

`conclusionBasis` et retour :

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
compositions: shownComps,
absorbedFacts: run.facts.filter((f) => absorbed.has(f.id)),
presentation: { elementaryFactShown: shown.length, compositionShown: shownComps.length, absorbedFactTotal: absorbed.size },
```

L'appel `buildConclusionPlan` ne change PAS dans cette tâche (le champ `shownCompositions` arrive en
Task 4 ; garder la suite verte tâche par tâche).

- [ ] **Step 4 : vérifier le vert (suite complète)**

Run : `node --test src/lib/decision/*.test.ts && npx tsc --noEmit`
Attendu : PASS ; adapter les tests existants de l'assembleur qui lisent `section.facts` (devenu
`section.cards`), tsc = 0. NOTE : `DossierDecisionSection.tsx` casse au typecheck à cette étape si on
lance `tsc` sur tout le repo ; adapter son rendu MINIMALEMENT ici (mapper `s.cards` et rendre les
`kind === "fact"` comme avant, ignorer temporairement les compositions), le rendu complet arrive en Task 5.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/decision-assembler.ts src/lib/decision/decision-fact.ts src/lib/decision/decision-assembler.test.ts src/components/report/DossierDecisionSection.tsx
git commit -m "feat(dossier): assembleur compose (DossierCard, liste unique triée puis cappée, comptes de présentation)"
```

---

### Task 4 : Plan narratif (registre `compositions_found`, lead composable, prompt v11)

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts`
- Modify: `src/lib/decision/conclusion-prompt.ts`
- Modify: `src/lib/decision/conclusion-hash.ts` (bump version)
- Modify: `src/lib/decision/decision-assembler.ts` (passer `shownCompositions`)
- Modify: `scripts/probe-conclusion.ts` (champ requis + cas composés)
- Test: `src/lib/decision/conclusion-plan.test.ts` (ajouts)

**Interfaces:**
- Consomme : `FactComposition` (Task 1), comptes (Task 3).
- Produit : `ConclusionPlanInput.shownCompositions: FactComposition[]` (requis) ; `BlockKey` += `"compositions_found"` ; `selectLead(shownFacts, shownCompositions)`.

- [ ] **Step 1 : tests (échouent)**

Ajouts dans `conclusion-plan.test.ts` (réutiliser les fabriques existantes ; construire une
`TradeoffComposition` et une `SharedEvidenceComposition` minimales comme dans les tests des tâches 1-2) :

```ts
// 1. shownCompositions: [tradeoff structuring] + aucune autre réserve structurante ->
//    lead.kind === "single", lead.factId === composition.id, lead.topic === composition.title ;
//    et AUCUN bloc compositions_found (le lead la narre déjà : pas de double narration).
// 2. shownCompositions: [shared_evidence structuring] seul -> lead.kind === "none" (les mismatchs,
//    composés ou simples, ne mènent jamais la conclusion) ; bloc compositions_found présent,
//    APRÈS unexamined_hard_constraints et AVANT reserves_found ; fallbackText contient le summary ;
//    sourceIds = [composition.id, ...absorbedFactIds].
// 3. INVARIANT hash : deux plans identiques sauf shownCompositions -> buildConclusionHash différent.
// 4. shownCompositions: [] -> plan strictement identique à l'existant (non-régression).
```

- [ ] **Step 2 : vérifier l'échec**

Run : `node --test src/lib/decision/conclusion-plan.test.ts`
Attendu : FAIL.

- [ ] **Step 3 : implémenter**

`conclusion-plan.ts` :

```ts
import type { FactComposition } from "./fact-composition.ts";

export type BlockKey = "verdict" | "unexamined_hard_constraints" | "compositions_found" | "mismatches_found" | "reserves_found" | "uncovered_priorities";

// ConclusionPlanInput gagne (REQUIS, jamais optionnel : un optionnel créerait un troisième état) :
//   shownCompositions: FactComposition[];

// LE LEAD PEUT ÊTRE UN TRADEOFF (spec §7), JAMAIS un shared_evidence : les mismatchs sont exclus du
// lead par doctrine (RESERVE_ROLES), et un mismatch COMPOSÉ n'obtient pas un accès que les mismatchs
// simples n'ont pas. Si un jour les mismatchs doivent pouvoir mener la conclusion, la décision se
// prend ICI, pour tous, jamais par effet de bord d'un patron.
type LeadCandidate = { factId: string; topic: string; statement: string; materialityTier: MaterialityTier };

export function selectLead(shownFacts: DecisionFact[], shownCompositions: FactComposition[] = []): LeadSelection {
  const candidates: LeadCandidate[] = [
    ...reserves(shownFacts).map((f) => ({ factId: f.id, topic: f.topic, statement: f.statement, materialityTier: f.materialityTier })),
    ...shownCompositions.filter((c) => c.kind === "tradeoff")
      .map((c) => ({ factId: c.id, topic: c.title, statement: c.summary, materialityTier: c.materialityTier })),
  ];
  // (même logique de sélection qu'aujourd'hui, sur candidates au lieu de rs)
}
```

Dans `buildConclusionPlan`, après le bloc `unexamined_hard_constraints`, avant `reserves_found` :

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
    // Les nombres du fallback sont autorisés par construction (conclusion-validate.ts:100) ; on
    // n'autorise en plus que le compte des compositions.
    allowedNumbers: numberForms(narratedComps.length),
    maxChars: 340,
    generable: true,
  });
}
```

Adapter l'appel `selectLead(input.shownFacts, input.shownCompositions)` et, côté
`decision-assembler.ts`, passer `shownCompositions: shownComps` dans l'input. Le bloc
`mismatches_found` continue de compter les faits mismatch AFFICHÉS (les absorbés n'y sont plus, le
registre compositions porte les leurs).

`conclusion-prompt.ts`, après le paragraphe « LES FAITS DE TÊTE » :

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

`scripts/probe-conclusion.ts` : ajouter `shownCompositions: []` à tous les cas existants, plus DEUX cas
composés câblés dans la boucle de tirages comme les cas existants :

```ts
const tradeoffAntibes = {
  id: "06004:composition-climat-saisons", kind: "tradeoff" as const, patternId: "seasonal_climate_tradeoff" as const,
  title: "Des hivers doux, avec une exposition estivale à arbitrer",
  summary: "Les hivers d'Antibes comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.",
  favorableSide: { label: "Ce qui correspond", statement: "Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale.", evidence: [], ruleIds: ["territoire.mismatch-douceur_climat"], factIds: [] },
  unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "Les jours au-dessus de 35 °C augmentent nettement.", evidence: [], ruleIds: ["territoire.climat-chaleur"], factIds: ["06004:climat-chaleur"] },
  absorbedFactIds: ["06004:climat-chaleur"], referencedRuleIds: ["territoire.mismatch-douceur_climat", "territoire.climat-chaleur"],
  materialityTier: "structuring" as const, displaySection: "compromises" as const,
};

// Cas A : la composition est l'unique réserve structurante -> lead single composé, PAS de bloc
// compositions_found. Éprouve : le modèle nomme la composition en lead.
const planCompositionLead = buildConclusionPlan({
  scope: "commune", communeNom: "Antibes", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [verif("f9", "secondary", "le retrait-gonflement des argiles", "À cette adresse, le sol est exposé au retrait-gonflement des argiles.")],
  shownCompositions: [tradeoffAntibes],
  uncovered: [], uncoveredPriorities: [{ key: "qualite_air", label: "la qualité de l'air" }],
  establishedIncompatibility: null, coverage: "high", orientation: "minor_reserves",
  hasFavorable: true, favorableCount: 1, majorReserveCount: 1, reservesShown: 2,
  mismatchTotal: 0, mismatchShown: 0,
});

// Cas B : une réserve structurante SIMPLE en plus -> lead tied (ou single sur l'autre fait) ET bloc
// compositions_found. Éprouve : le modèle articule le registre composé sans le solder.
const planCompositionBloc = buildConclusionPlan({
  scope: "commune", communeNom: "Antibes", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [verif("f8", "structuring", "l'exposition d'Antibes à l'inondation", "L'exposition de la commune à l'inondation ressort élevée.")],
  shownCompositions: [tradeoffAntibes],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "major_reserves",
  hasFavorable: true, favorableCount: 1, majorReserveCount: 2, reservesShown: 2,
  mismatchTotal: 0, mismatchShown: 0,
});
```

- [ ] **Step 4 : vérifier le vert**

Run : `node --test src/lib/decision/*.test.ts && npx tsc --noEmit`
Attendu : PASS (adapter tout appelant de `buildConclusionPlan`/`selectLead` dans les tests existants :
champ `shownCompositions: []`), tsc = 0.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-prompt.ts src/lib/decision/conclusion-hash.ts src/lib/decision/decision-assembler.ts src/lib/decision/conclusion-plan.test.ts scripts/probe-conclusion.ts
git commit -m "feat(dossier): registre compositions_found + lead tradeoff, prompt v11, sonde étendue"
```

---

### Task 5 : Rendu (briques partagées + `FactCompositionCard` + sections)

**Files:**
- Create: `src/components/report/DecisionFactRenderParts.tsx`
- Create: `src/components/report/FactCompositionCard.tsx`
- Modify: `src/components/report/DossierDecisionSection.tsx`

**Interfaces:**
- Consomme : `FactComposition`, `CompositionSide` (Task 1), `DossierSection.cards` + `dossier.absorbedFacts` (Task 3).
- Produit : `Chip`, `EvidenceRow`, `FactBody` (DecisionFactRenderParts.tsx) ; `<FactCompositionCard composition color absorbedFacts />`.

- [ ] **Step 1 : extraire les briques partagées**

DÉPLACER (pas copier) `Chip`, `EvidenceRow`, `FactBody` de `DossierDecisionSection.tsx` vers
`src/components/report/DecisionFactRenderParts.tsx`, avec `export` sur chacun, imports ajustés.
`DossierDecisionSection.tsx` les importe désormais. Aucune boucle : les deux composants de cartes
dépendent des briques, jamais l'inverse.

- [ ] **Step 2 : écrire `FactCompositionCard.tsx`**

Server Component présentationnel, deux variantes par `kind`, dépliable `<details>` natif. Idiome
existant : eyebrows mono uppercase, texte `text-label 14px`, preuves en chips, pas de code couleur
bon/mauvais tranché.

```tsx
// Carte COMPOSÉE : une vue qui relie des constats établis (tradeoff / shared_evidence). Présentationnelle.
// Les faits absorbés restent lisibles au dépliable, dans leur forme d'origine (audit, invariant 4).
import type { FactComposition, CompositionSide } from "@/lib/decision/fact-composition";
import type { DecisionFact } from "@/lib/decision/decision-fact";
import { Chip, EvidenceRow, FactBody } from "@/components/report/DecisionFactRenderParts";

function SideBlock({ side, color }: { side: CompositionSide; color: string }) {
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

- [ ] **Step 3 : rendre les cartes dans `DossierDecisionSection.tsx`**

La boucle de section rend `s.cards` dans l'ordre de la liste (déjà triée par l'assembleur) :

```tsx
<ul className="flex flex-col gap-5">
  {s.cards.map((card) =>
    card.kind === "composition" ? (
      <FactCompositionCard
        key={card.composition.id}
        composition={card.composition}
        color={col}
        absorbedFacts={dossier.absorbedFacts.filter((f) => card.composition.absorbedFactIds.includes(f.id))}
      />
    ) : (
      <li key={card.fact.id}>
        {/* rendu existant du fait (grain + FactBody + EvidenceRow), inchangé */}
      </li>
    ),
  )}
</ul>
```

Ne PAS toucher `SECTION_ACCENT` (la clé `mismatches` absente tombe déjà sur le repli améthyste).

- [ ] **Step 4 : vérifier build**

Run : `npx tsc --noEmit && npm run build`
Attendu : 0 erreur, build exit 0.

- [ ] **Step 5 : commit**

```bash
git add src/components/report/DecisionFactRenderParts.tsx src/components/report/FactCompositionCard.tsx src/components/report/DossierDecisionSection.tsx
git commit -m "feat(dossier): FactCompositionCard (2 variantes + dépliable d'audit) sur briques partagées"
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
1. Projet `douceur_climat` poids 3 + `faible_chaleur` poids 3, commune active Antibes (06004) : la page
   `/rapport` doit montrer « Des hivers doux, avec une exposition estivale à arbitrer » dans « Ce qui
   départage vraiment », SANS carte chaleur dans « À examiner… », avec action et dépliable.
2. Même projet, commune Gouesnou (29061) : AUCUNE composition (pas de fait chaleur), douceur silencieuse.
3. Projet `prefere_grande_ville` poids 3 + `eviter_isolement` poids 2, un village : carte « Une même
   petite taille… » dans « Ce qui correspond moins bien », conséquences hiérarchisées, limitation sous
   la conséquence isolement.
Si l'accès au parcours authentifié est trop coûteux en local, au minimum : un petit script jetable dans
le scratchpad qui charge les ModuleFacts réels d'Antibes (même chemin que `territory-facts.ts`) et
imprime les sections. Rapporter honnêtement ce qui a été vérifié.

- [ ] **Step 4 : sonde (nécessite `.env.local`)**

Run : `node --env-file=.env.local scripts/probe-conclusion.ts`
Attendu : les cas composés survivent à la validation sur la majorité des 5 tirages ; sinon itérer le
paragraphe prompt (rester en v11 tant que la session n'est pas livrée).

- [ ] **Step 5 : commit final**

```bash
git add src/lib/decision/territory-facts.ts src/components/report/DossierAvecLogement.tsx
git commit -m "feat(dossier): composition branchée aux deux parcours (commune, commune+adresse)"
```

---

## Auto-revue du plan (v2)

- Couverture spec : §1-2 -> Task 1 ; §3-4 -> Task 1 ; §5 -> Task 2 ; §6 -> Task 3 ; §7 -> Task 4 ; §8 -> Task 5 ; §10 -> chaque tâche + Task 6 ; invariants §9 : 1-2 (types, Task 1), 3 (test assembleur, Task 3), 4 (dépliable + absorbedFacts, Tasks 3/5), 5 (registre strict + basis requis, Task 2), 6-7 (gates, Tasks 1-2), 8 (action/limitation, tests Tasks 1-2), 9 (helper canonique + bandes corrompues, Task 1), 10 (textes déterministes, prompt Task 4).
- Écart spec assumé (revue v2) : `DossierSection.cards` remplace `facts` + `compositions` séparés ; la spec §6 disait « insérée dans sa displaySection où elle compte pour une carte », la liste unique triée est la manière correcte de le faire (une composition secondary ne déplace pas un fait structurant). À reporter dans la spec au moment du merge.
- Cohérence de types : `DossierCard` (Tasks 3, 5) ; `absorbedFacts` sur Dossier (Tasks 3, 5) ; `shownCompositions` requis (Task 4) ; `mismatchRuleId`/`RULE_CHALEUR`/`bandValide` exportés (Task 1) et consommés (Tasks 1-2).
