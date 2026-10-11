// FUT-54 — un écart retenu par le moteur n'est jamais passé sous silence par le verdict, sans devenir
// pour autant un arbitrage. Fonctions déterministes réelles : l'assembleur (orientation ET verdict) et le
// plan de conclusion. Aucun réseau.
import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import { buildConclusionPlan, type ConclusionPlanInput } from "./conclusion-plan.ts";
import { voixDuLecteur } from "../relation-au-lieu.ts";
import { bucketDuProjet } from "./logement-gestes.ts";
import type { DecisionFact, MaterialityTier, RuleEvaluation, RunResult } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";
import type { UserProject } from "../user-project.ts";

// ── Fixtures : des critères déclarés, des faits, et les évaluations qui les relient ─────────────────

function projet(prefs: [string, number][], over: Partial<UserProject> = {}): UserProject {
  return {
    posture: "recherche", intent: null, rawText: "x", updatedAt: "2026-10-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs.map(([key, weight]) => ({ key, weight })) } as unknown as UserProject["parsed"],
    ...over,
  };
}
const preuve = (id: string) => [{ factId: id, module: "territoire" as const, label: "T", grain: "commune" as const }];
function aligne(key: string, subject: string, tier: MaterialityTier = "structuring"): DecisionFact {
  return {
    id: `a-${key}`, ruleId: `territoire.alignment-${key}`, sourceFactIds: [], module: "territoire", role: "alignment",
    materialityTier: tier, topic: subject, headlineSubject: subject, statement: `${subject} : favorable.`, projectKey: key as never,
    basis: { kind: "relative_position", rankLow: 0.92, rankHigh: 0.99, universe: "communes_france", distributionVersion: "t" },
    evidence: preuve(`a-${key}`),
  } as DecisionFact;
}
function ecart(key: string, subject: string, tier: MaterialityTier = "secondary"): DecisionFact {
  return {
    id: `m-${key}`, ruleId: `territoire.mismatch-${key}`, sourceFactIds: [], module: "territoire", role: "mismatch",
    materialityTier: tier, topic: subject, headlineSubject: subject, statement: `${subject} : moins bien.`, projectKey: key as never,
    basis: { kind: "categorical_state", state: "metropole" },
    evidence: preuve(`m-${key}`),
  } as DecisionFact;
}
function verif(key: string, tier: MaterialityTier = "secondary"): DecisionFact {
  return {
    id: `v-${key}`, ruleId: `territoire.verif-${key}`, sourceFactIds: [], module: "territoire", role: "verification",
    materialityTier: tier, topic: `le point ${key}`, statement: "à vérifier", evidence: preuve(`v-${key}`),
    action: { type: "obtenir_document", label: "Consultez le document" },
  } as DecisionFact;
}
const ev = (f: DecisionFact, outcome: RuleEvaluation["outcome"]): RuleEvaluation =>
  ({ ruleId: f.ruleId, projectKeys: [(f as { projectKey?: string }).projectKey ?? ""], outcome, facts: [f], reason: "test" });

/** Un dossier réel de l'assembleur : chaque fait porte l'évaluation qui l'a émis. */
function dossier(p: UserProject, faits: { f: DecisionFact; outcome: RuleEvaluation["outcome"] }[], comps: FactComposition[] = []) {
  const run: RunResult = { facts: faits.map((x) => x.f), evaluations: faits.map((x) => ev(x.f, x.outcome)) };
  return assembleDossier(run, p, "commune", "Paris 7e Arrondissement", comps);
}

// Le cas Paris 7e (moteur réel, 11/10/2026) : soins et vie locale favorables, « éviter les grandes villes »
// déclaré au poids 2, donc un écart SECONDAIRE.
const PARIS = projet([["acces_soins", 3], ["vie_locale", 3], ["eviter_grandes_villes", 2]]);
const SOINS = aligne("acces_soins", "l'accès aux soins");
const VIE = aligne("vie_locale", "la vie locale");
const TAILLE = ecart("eviter_grandes_villes", "une ville à taille humaine");

// ── A. Orientation : quand un écart secondaire change, ou non, l'orientation ───────────────────────

test("A. un seul écart secondaire face à des correspondances : l'orientation reste favorable (pas d'arbitrage)", () => {
  const d = dossier(PARIS, [{ f: SOINS, outcome: "satisfied" }, { f: VIE, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }]);
  assert.equal(d.criteria.orientation, "favorable");
  assert.equal(d.narrativePlan.verdict.label, "Favorable, avec un écart");
});

test("A. deux écarts secondaires, ou un écart structurant (priorité de poids 3) : arbitrage", () => {
  const deux = dossier(projet([["acces_soins", 3], ["eviter_grandes_villes", 2], ["calme_sonore", 2]]), [
    { f: SOINS, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }, { f: ecart("calme_sonore", "le calme"), outcome: "mismatch" },
  ]);
  assert.equal(deux.criteria.orientation, "arbitration");
  const fort = dossier(projet([["acces_soins", 3], ["eviter_grandes_villes", 3]]), [
    { f: SOINS, outcome: "satisfied" }, { f: ecart("eviter_grandes_villes", "une ville à taille humaine", "structuring"), outcome: "mismatch" },
  ]);
  assert.equal(fort.criteria.orientation, "arbitration");
});

// ── B. Cohérence : titre, libellé, ton et détail ne contredisent pas l'écart affiché ───────────────

test("B. Paris 7e : le héros dit les correspondances ET l'écart, que la carte suivante montre", () => {
  const d = dossier(PARIS, [{ f: SOINS, outcome: "satisfied" }, { f: VIE, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }]);
  const v = d.narrativePlan.verdict;
  assert.equal(v.headline.text, "Paris 7e Arrondissement répond à deux de vos priorités, et moins bien à une autre : une ville à taille humaine.");
  assert.equal(d.narrativePlan.verdictTone, "neutral");
  assert.equal(v.detail, "Cet écart reste à peser face à ce qui correspond : futur•e ne le compense pas.");
  // L'écart nommé est bien celui de la carte « Ce qui correspond moins bien », et il est consommé.
  const carte = d.sections.find((s) => s.key === "mismatches")!.cards.map((c) => (c.kind === "fact" ? c.fact.id : c.composition.id));
  assert.ok(carte.includes(TAILLE.id));
  assert.deepEqual(v.headline.consumedFactIds, [TAILLE.id]);
  // Aucune formule de correspondance pleine ne survit au-dessus d'un écart.
  for (const t of [v.label, v.headline.text, v.detail]) {
    assert.doesNotMatch(t, /Bonne correspondance|va dans le sens|vont dans ce sens|semble bien correspondre/);
  }
});

test("B. INVARIANT : dès qu'un écart est émis, aucune orientation ne garde un verdict qui le tait", () => {
  const configurations: { faits: { f: DecisionFact; outcome: RuleEvaluation["outcome"] }[]; p: UserProject }[] = [
    { p: PARIS, faits: [{ f: SOINS, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }] },
    { p: PARIS, faits: [{ f: SOINS, outcome: "satisfied" }, { f: VIE, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }] },
    { p: projet([["acces_soins", 3], ["eviter_grandes_villes", 2], ["faible_risque_inondation", 2]]), faits: [
      { f: SOINS, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }, { f: { ...verif("faible_risque_inondation"), projectKey: "faible_risque_inondation" } as DecisionFact, outcome: "verification" },
    ] },
    { p: projet([["acces_soins", 3], ["eviter_grandes_villes", 2], ["faible_risque_inondation", 3]]), faits: [
      { f: SOINS, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" }, { f: { ...verif("faible_risque_inondation", "structuring"), projectKey: "faible_risque_inondation" } as DecisionFact, outcome: "verification" },
    ] },
    { p: projet([["eviter_grandes_villes", 2], ["calme_sonore", 2]]), faits: [{ f: TAILLE, outcome: "mismatch" }] },
  ];
  for (const { p, faits } of configurations) {
    const d = dossier(p, faits);
    const v = d.narrativePlan.verdict;
    const tout = `${v.label} ${v.headline.text} ${v.detail}`;
    assert.match(tout, /moins bien|écart/i, `${d.criteria.orientation} : « ${tout} »`);
    assert.doesNotMatch(v.label, /^(Bonne correspondance|Correspondance favorable|Signaux favorables)$/, `${d.criteria.orientation} : libellé « ${v.label} »`);
  }
});

// ── C. Priorité forte : représentée par le poids, qui fixe déjà la matérialité ─────────────────────

test("C. une priorité de poids 3 moins bien satisfaite est STRUCTURANTE : elle impose l'arbitrage, et le héros la nomme", () => {
  const d = dossier(projet([["acces_soins", 3], ["vie_locale", 3], ["eviter_grandes_villes", 3]]), [
    { f: SOINS, outcome: "satisfied" }, { f: VIE, outcome: "satisfied" }, { f: ecart("eviter_grandes_villes", "une ville à taille humaine", "structuring"), outcome: "mismatch" },
  ]);
  assert.equal(d.criteria.orientation, "arbitration");
  assert.match(d.narrativePlan.verdict.headline.text, /répond moins bien à une de vos priorités : une ville à taille humaine/);
});

// ── D. Conditions sans compromis : les deux chemins restent intacts ────────────────────────────────

test("D. incompatibilité établie : elle passe avant tout, même avec des correspondances", () => {
  const incompat: DecisionFact = {
    id: "i-mer", ruleId: "hard.nearSea", sourceFactIds: [], module: "territoire", role: "incompatibility", evidenceStrength: "established",
    hardConstraintKey: "nearSea", materialityTier: "decision_critical", topic: "la proximité de la mer", statement: "trop loin", evidence: preuve("i-mer"),
  } as DecisionFact;
  const p = projet([["acces_soins", 3], ["eviter_grandes_villes", 2]]);
  (p.parsed as { hardConstraints: Record<string, unknown> }).hardConstraints = { nearSea: { active: true, maxKm: 5 } };
  const run: RunResult = {
    facts: [SOINS, TAILLE, incompat],
    evaluations: [ev(SOINS, "satisfied"), ev(TAILLE, "mismatch"), { ruleId: "hard.nearSea", projectKeys: ["nearSea"], outcome: "incompatible", facts: [incompat], reason: "t" }],
  };
  const d = assembleDossier(run, p, "commune", "Paris 7e Arrondissement");
  assert.equal(d.criteria.orientation, "incompatible");
  assert.notEqual(d.narrativePlan.verdict.label, "Favorable, avec un écart");
});

// ── E. Absence de données : un critère non examiné n'est jamais favorable ──────────────────────────

test("E. un critère resté sans lecture ne compte pas comme favorable, et la lecture se dit incomplète", () => {
  const p = projet([["acces_soins", 3], ["vie_locale", 3], ["eviter_grandes_villes", 2]]);
  const run: RunResult = {
    facts: [SOINS, TAILLE],
    evaluations: [ev(SOINS, "satisfied"), ev(TAILLE, "mismatch"), { ruleId: "territoire.alignment-vie_locale", projectKeys: ["vie_locale"], outcome: "uncertain", facts: [], reason: "donnée absente" }],
  };
  const d = assembleDossier(run, p, "commune", "Paris 7e Arrondissement");
  assert.equal(d.criteria.coverage, "partial");
  const v = d.narrativePlan.verdict;
  assert.equal(v.label, "Favorable, avec un écart");
  assert.match(v.headline.text, /répond à l'une de vos priorités, et moins bien à une autre/);
  assert.match(v.detail, /La lecture reste incomplète/);
});

// ── F. Compositions : un écart absorbé reste pris en compte et correctement attribué ───────────────

function base(over: Partial<ConclusionPlanInput>): ConclusionPlanInput {
  return {
    scope: "commune", communeNom: "Antibes", conclusionState: "no_incompatibility_established", posture: "recherche",
    shownFacts: [], shownCompositions: [], uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null,
    coverage: "complete", orientation: "favorable", hasFavorable: true, favorableCount: 2, majorReserveCount: 0,
    reservesShown: 0, mismatchTotal: 1, mismatchShown: 1, ...over,
  };
}
const TRADEOFF: FactComposition = {
  id: "06004:composition-climat-saisons", kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
  title: "Des hivers doux, avec une exposition estivale à arbitrer", headlineSubject: "l'exposition aux fortes chaleurs",
  summary: "s", favorableSide: { label: "Ce qui correspond", statement: "doux", evidence: [], ruleIds: ["r1"], factIds: [] },
  unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "chaud", evidence: [], ruleIds: ["r2"], factIds: ["f-ch"] },
  absorbedFactIds: ["f-ch"], referencedRuleIds: ["r1", "r2"], materialityTier: "secondary", displaySection: "compromises",
} as unknown as FactComposition;

test("F. l'écart absorbé dans une composition est nommé par son sujet, et ses faits sont consommés", () => {
  const p = buildConclusionPlan(base({ shownCompositions: [TRADEOFF] }));
  assert.equal(p.verdict.label, "Favorable, avec un écart");
  assert.match(p.verdict.headline.text, /moins bien à une autre : l'exposition aux fortes chaleurs\.$/);
  assert.deepEqual(p.verdict.headline.consumedFactIds, ["f-ch"]);
  assert.deepEqual(p.verdict.headline.consumedCompositionIds, [TRADEOFF.id]);
});

test("F. une cause commune ne se nomme pas comme « une autre » priorité : la phrase reste vraie sans sujet", () => {
  const shared = { ...TRADEOFF, id: "c-taille", kind: "shared_evidence", headlineCause: "sa petite taille", displaySection: "mismatches" } as unknown as FactComposition;
  const p = buildConclusionPlan(base({ shownCompositions: [shared] }));
  assert.equal(p.verdict.headline.text, "Antibes répond à deux de vos priorités, et moins bien à une autre.");
  assert.doesNotMatch(p.verdict.headline.text, /petite taille/);
});

// ── G. Stabilité : sans écart, la lecture positive est conservée ───────────────────────────────────

test("G. sans écart, le verdict favorable est inchangé", () => {
  const d = dossier(projet([["acces_soins", 3], ["vie_locale", 3]]), [{ f: SOINS, outcome: "satisfied" }, { f: VIE, outcome: "satisfied" }]);
  assert.equal(d.criteria.orientation, "favorable");
  assert.equal(d.narrativePlan.verdict.label, "Correspondance favorable");
  assert.equal(d.narrativePlan.verdictTone, "positive");
  assert.equal(d.narrativePlan.verdict.headline.text, "Paris 7e Arrondissement répond à deux de vos priorités : l'accès aux soins et la vie locale.");
  // Et un mismatch de poids 1, qui ne produit AUCUN fait, ne touche pas le verdict (il n'est pas retenu).
  const p = buildConclusionPlan(base({ mismatchTotal: 0, mismatchShown: 0 }));
  assert.notEqual(p.verdict.label, "Favorable, avec un écart");
});

test("G. un verdict déjà centré sur une réserve garde son héros, et le détail ajoute l'écart sans « Par ailleurs » répété", () => {
  const d = dossier(projet([["acces_soins", 3], ["eviter_grandes_villes", 2], ["faible_risque_inondation", 3]]), [
    { f: SOINS, outcome: "satisfied" }, { f: TAILLE, outcome: "mismatch" },
    { f: { ...verif("faible_risque_inondation", "structuring"), projectKey: "faible_risque_inondation" } as DecisionFact, outcome: "verification" },
  ]);
  assert.equal(d.criteria.orientation, "major_reserves");
  const v = d.narrativePlan.verdict;
  assert.doesNotMatch(v.label, /Favorable, avec un écart/);
  assert.match(v.detail, /répond moins bien à une de vos priorités : une ville à taille humaine\./);
  assert.ok((v.detail.match(/Par ailleurs/g) ?? []).length <= 1, v.detail);
});

// ── H. Relation au lieu : FUT-26 intact ────────────────────────────────────────────────────────────

test("H. FUT-26 intact : commune explorée sans engagement, « j'y habite » à l'adresse avant l'intention", () => {
  assert.equal(voixDuLecteur(null, { echelle: "commune", relation: "considering_living", origine: "inferred" }), "neutre");
  assert.equal(voixDuLecteur("achat", { echelle: "adresse", relation: "lives_here" }), "habitant");
  assert.equal(bucketDuProjet({ intent: "achat" }, { echelle: "adresse", relation: "lives_here" }), "reside");
});
