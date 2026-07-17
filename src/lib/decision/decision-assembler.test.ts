import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import type { DecisionFact, RunResult, RuleEvaluation, IncompatibilityFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
// Les ÉVALUATIONS sont désormais la matière première de la couverture (criteria-registry) : un
// `run` sans évaluation décrit un moteur qui n'a rien regardé, et le dossier le dit honnêtement.
function ev(ruleId: string, keys: string[], outcome: RuleEvaluation["outcome"], facts: DecisionFact[] = []): RuleEvaluation {
  return { ruleId, projectKeys: keys, outcome, facts, reason: "test" };
}
// `covered` n'existe plus dans RunResult (il déclarait « couverte » toute contrainte dont l'outcome
// n'était pas not_applicable, donc un `uncertain` aussi). On garde le paramètre pour ne pas réécrire les
// appels, mais il est IGNORÉ : la couverture se déduit des évaluations.
function run(facts: DecisionFact[], _covered: unknown = [], evaluations: RuleEvaluation[] = []): RunResult {
  return { facts, evaluations };
}
function incompat(over: Partial<IncompatibilityFact> = {}): DecisionFact {
  return { id: "i", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "nearSea", materialityTier: "decision_critical", topic: "la distance au littoral", statement: "trop loin", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], ...over };
}
function verif(id = "v"): DecisionFact {
  return { id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", topic: "un point à vérifier", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };
const NO_HC = { reformulation: "x", hardConstraints: {}, preferences: [] };

test("parsed null -> project_not_structured", () => {
  const d = assembleDossier(run([]), project(null), "commune", "Toulouse");
  assert.equal(d.conclusionState, "project_not_structured");
  assert.equal(d.sections.length, 0);
});

test("incompatibilité établie -> established_incompatibility, et le verdict le dit", () => {
  const d = assembleDossier(
    run([incompat()], ["nearSea"], [ev("r", ["nearSea"], "incompatible", [incompat()])]),
    project(WITH_HC), "commune",
  );
  assert.equal(d.conclusionState, "established_incompatibility");
  assert.equal(d.criteria.orientation, "incompatible");
  assert.match(d.conclusion, /conditions non négociables n'est pas respectée ici/i);
  assert.match(d.conclusion, /trop loin/);
});

test("no_hard_constraint_declared distinct de no_incompatibility_established", () => {
  const sansHC = assembleDossier(run([verif()]), project(NO_HC), "commune", "Toulouse");
  assert.equal(sansHC.conclusionState, "no_hard_constraint_declared");
  const avecHC = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.equal(avecHC.conclusionState, "no_incompatibility_established");
});

test("contrainte déclarée non couverte -> nommée dans uncovered + conclusion", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [] });
  // nearSea EXAMINÉE (satisfaite, silencieuse) ; communeSize touchée par personne.
  const d = assembleDossier(run([], ["nearSea"], [ev("r", ["nearSea"], "satisfied")]), p, "commune", "Toulouse");
  assert.deepEqual(d.uncovered.map((u) => u.key), ["communeSize"]);
  // La contrainte est le SUJET de la phrase, nommée comme le lecteur l'a posée.
  assert.match(d.conclusion, /Une commune de moins de 20 000 habitants reste à vérifier/);
});

test("la couverture ne se décrète pas : un `unknown` ne rend PAS une contrainte examinée", () => {
  // run.coveredHardConstraints la disait « couverte » (outcome !== not_applicable). Le registre voit
  // qu'aucune donnée n'a été lue, et la garde dans les non examinées.
  const unknownFact: DecisionFact = { id: "u", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "scoped", materialityTier: "secondary", topic: "une donnée manquante", statement: "?", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] };
  const d = assembleDossier(
    run([unknownFact], ["nearSea"], [ev("r", ["nearSea"], "unknown", [unknownFact])]),
    project(WITH_HC), "commune",
  );
  assert.deepEqual(d.uncovered.map((u) => u.key), ["nearSea"]);
  assert.equal(d.criteria.coverage, "none");
});

test("inconnue bloquante -> insufficient_evidence ; scopée -> non", () => {
  const blocking: DecisionFact = { id: "u", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "blocking", materialityTier: "secondary", topic: "une donnée manquante", statement: "?", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] };
  assert.equal(assembleDossier(run([blocking], ["nearSea"]), project(WITH_HC), "commune", "Toulouse").conclusionState, "insufficient_evidence");
  const scoped = { ...blocking, impact: "scoped" as const };
  assert.equal(assembleDossier(run([scoped], ["nearSea"]), project(WITH_HC), "commune", "Toulouse").conclusionState, "no_incompatibility_established");
});

test("caps : au plus 2 incompatibilités affichées", () => {
  const many = [incompat({ id: "a" }), incompat({ id: "b" }), incompat({ id: "c" })];
  const d = assembleDossier(run(many, ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  const sec = d.sections.find((s) => s.key === "incompatibilities");
  assert.equal(sec!.cards.length, 2);
});

test("titre vérifications adapté à la posture habitant", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC, { posture: "habitant" }), "commune", "Toulouse");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /surveiller/i);
});

test("conclusionBasis porte ruleIds et preuves", () => {
  const d = assembleDossier(run([incompat()], ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.ok(d.conclusionBasis.ruleIds.length >= 1);
  assert.ok(d.conclusionBasis.evidence.length >= 1);
});

test("sans contrainte dure : la conclusion nomme les priorités non couvertes et le fait qui domine", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "air_sain", weight: 3 }] });
  const d = assembleDossier(run([verif()]), p, "commune", "Toulouse");
  assert.equal(d.conclusionState, "no_hard_constraint_declared");
  // Le verdict ne parle plus de « condition absolue » : ne pas en avoir déclaré n'est ni un trou de
  // donnée ni un défaut. La correspondance graduée fonctionne sur les seules préférences.
  assert.equal(d.conclusion.includes("aucune condition"), false);
  assert.match(d.conclusion, /pas encore couvertes/i);
  assert.match(d.conclusion, /Un point pèse plus que les autres/);
  assert.match(d.conclusion, /Toulouse/); // la commune est NOMMÉE, jamais « ce lieu »
});

test("le scope SORT des phrases : il vit dans le plan, affiché en tête de carte", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune+adresse", "Toulouse");
  assert.equal(d.narrativePlan.scope, "commune+adresse");
  assert.equal(d.conclusion.includes("À l'échelle de la commune"), false);
});

test("titre vérifications non-habitant : « À examiner avant de vous engager »", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC), "commune", "Toulouse");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /à examiner/i);
});

test("les réserves annoncées sont les faits AFFICHÉS, jamais les faits émis (caps)", () => {
  // 5 vérifications émises, section plafonnée à 4 : le dossier compte 4, pas 5. Le lecteur doit
  // pouvoir compter les cartes et retomber sur le chiffre, y compris dans le verdict.
  const facts = Array.from({ length: 5 }, (_, i) => verif(`v${i}`));
  const d = assembleDossier(run(facts, ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.equal(d.sections.find((s) => s.key === "verifications")!.cards.length, 4);
  assert.equal(d.narrativePlan.reservesCount, 4);
});

test("le dossier porte le plan narratif, et sa conclusion en est la concaténation", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.equal(d.conclusion, d.narrativePlan.blocks.map((b) => b.fallbackText).join(" "));
  assert.equal(d.narrativePlan.blocks[0]!.key, "verdict");
  assert.equal(d.narrativePlan.blocks[0]!.generable, false); // le verdict n'est jamais généré
});

// ── Compositions (couche de présentation) ─────────────────────────────────────────────────────────

import type { FactComposition } from "./fact-composition.ts";

function mism(id: string, tier: "secondary" | "structuring" = "structuring"): DecisionFact {
  return {
    id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "mismatch",
    materialityTier: tier, topic: "les espaces naturels", statement: "moins bien servi",
    projectKey: "nature" as never,
    basis: { kind: "relative_position", rankLow: 0.05, rankHigh: 0.1, universe: "communes_france", distributionVersion: "d" },
    evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
  } as DecisionFact;
}
function sharedComp(id: string, absorbed: string[], tier: "secondary" | "structuring"): FactComposition {
  return {
    id, kind: "shared_evidence", patternId: "territory-size-multiple-consequences",
    title: "Une même petite taille", summary: "Deux priorités touchées pour la même raison.",
    sharedEvidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune", observedValue: "village" }],
    consequences: absorbed.map((fid) => ({ projectKey: "nature" as never, statement: "conséquence", materialityTier: tier, factId: fid })),
    absorbedFactIds: absorbed, referencedRuleIds: ["r"], materialityTier: tier, displaySection: "mismatches",
  };
}
function tradeoffComp(id: string, absorbed: string[], tier: "secondary" | "structuring"): FactComposition {
  return {
    id, kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
    summary: "Hivers doux, exposition estivale à arbitrer.",
    favorableSide: { label: "Ce qui correspond", statement: "doux", evidence: [{ factId: "b", module: "territoire", label: "T", grain: "commune", observedValue: "parmi les 10 %" }], ruleIds: ["r"], factIds: [] },
    unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "chaud", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], ruleIds: ["r"], factIds: absorbed },
    absorbedFactIds: absorbed, referencedRuleIds: ["r"], materialityTier: tier, displaySection: "compromises",
  };
}
// Un run où le ruleId "r" existe (le validateur vérifie les referencedRuleIds).
function runR(facts: DecisionFact[]): RunResult {
  return { facts, evaluations: [ev("r", ["nature"], "mismatch", facts)] };
}

test("compositions : les faits absorbés quittent les sections et vivent dans absorbedFacts", () => {
  const v = verif("v1");
  const d = assembleDossier(runR([v]), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  const allCards = d.sections.flatMap((s) => s.cards);
  assert.equal(allCards.some((c) => c.kind === "fact" && c.fact.id === "v1"), false);
  assert.deepEqual(d.absorbedFacts.map((f) => f.id), ["v1"]);
  const compromises = d.sections.find((s) => s.key === "compromises");
  assert.equal(compromises!.cards[0]!.kind, "composition");
});

test("liste unique triée puis cappée : une composition secondary ne passe jamais devant un fait structurant", () => {
  const facts = [mism("m1"), mism("m2"), mism("m3"), mism("abs", "secondary")];
  const d = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", [sharedComp("c1", ["abs"], "secondary")]);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sec!.cards.length, 3); // cap 3
  assert.ok(sec!.cards.every((c) => c.kind === "fact")); // les 3 structurants passent, la composition secondary non
});

test("à tier égal, la composition passe d'abord", () => {
  const facts = [mism("m1"), mism("abs")];
  const d = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", [sharedComp("c1", ["abs"], "structuring")]);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sec!.cards.length, 2);
  assert.equal(sec!.cards[0]!.kind, "composition");
});

test("le cap s'applique aussi aux compositions", () => {
  const facts = [mism("a1"), mism("a2"), mism("a3"), mism("a4")];
  const comps = ["a1", "a2", "a3", "a4"].map((fid, i) => sharedComp(`c${i}`, [fid], "structuring"));
  const d = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", comps);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sec!.cards.length, 3);
  assert.equal(d.presentation.compositionShown, 3);
});

test("presentation : comptes exacts sur l'affiché", () => {
  const v = verif("v1");
  const d = assembleDossier(runR([v, mism("m1")]), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  assert.equal(d.presentation.compositionShown, 1);
  assert.equal(d.presentation.elementaryFactShown, 1); // m1
  assert.equal(d.presentation.absorbedFactTotal, 1);
});

test("invariant 3 : couverture et orientation identiques avec et sans compositions", () => {
  const v = verif("v1");
  const facts = [v, mism("m1")];
  const sans = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse");
  const avec = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  assert.equal(avec.criteria.coverage, sans.criteria.coverage);
  assert.equal(avec.criteria.orientation, sans.criteria.orientation);
});

test("conclusionBasis : absorbés dans factIds, preuves et ruleIds des compositions inclus", () => {
  const v = verif("v1");
  const d = assembleDossier(runR([v]), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  assert.ok(d.conclusionBasis.factIds.includes("v1"));
  assert.ok(d.conclusionBasis.ruleIds.includes("r"));
  assert.ok(d.conclusionBasis.evidence.some((e) => e.observedValue === "parmi les 10 %"));
});
