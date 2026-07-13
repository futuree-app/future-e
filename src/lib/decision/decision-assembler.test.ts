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
function run(facts: DecisionFact[], covered: RunResult["coveredHardConstraints"] = [], evaluations: RuleEvaluation[] = []): RunResult {
  return { facts, evaluations, coveredHardConstraints: covered };
}
function incompat(over: Partial<IncompatibilityFact> = {}): DecisionFact {
  return { id: "i", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "nearSea", materialityTier: "decision_critical", statement: "trop loin", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], ...over };
}
function verif(id = "v"): DecisionFact {
  return { id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };
const NO_HC = { reformulation: "x", hardConstraints: {}, preferences: [] };

test("parsed null -> project_not_structured", () => {
  const d = assembleDossier(run([]), project(null), "commune");
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
  const sansHC = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.equal(sansHC.conclusionState, "no_hard_constraint_declared");
  const avecHC = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(avecHC.conclusionState, "no_incompatibility_established");
});

test("contrainte déclarée non couverte -> nommée dans uncovered + conclusion", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [] });
  // nearSea EXAMINÉE (satisfaite, silencieuse) ; communeSize touchée par personne.
  const d = assembleDossier(run([], ["nearSea"], [ev("r", ["nearSea"], "satisfied")]), p, "commune");
  assert.deepEqual(d.uncovered.map((u) => u.key), ["communeSize"]);
  assert.match(d.conclusion, /pas encore examiné/i);
});

test("la couverture ne se décrète pas : un `unknown` ne rend PAS une contrainte examinée", () => {
  // run.coveredHardConstraints la disait « couverte » (outcome !== not_applicable). Le registre voit
  // qu'aucune donnée n'a été lue, et la garde dans les non examinées.
  const unknownFact: DecisionFact = { id: "u", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "scoped", materialityTier: "secondary", statement: "?", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] };
  const d = assembleDossier(
    run([unknownFact], ["nearSea"], [ev("r", ["nearSea"], "unknown", [unknownFact])]),
    project(WITH_HC), "commune",
  );
  assert.deepEqual(d.uncovered.map((u) => u.key), ["nearSea"]);
  assert.equal(d.criteria.coverage, "none");
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

test("sans contrainte dure : la conclusion nomme les priorités non couvertes et le fait qui domine", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "air_sain", weight: 3 }] });
  const d = assembleDossier(run([verif()]), p, "commune");
  assert.equal(d.conclusionState, "no_hard_constraint_declared");
  // Le verdict ne parle plus de « condition absolue » : ne pas en avoir déclaré n'est ni un trou de
  // donnée ni un défaut. La correspondance graduée fonctionne sur les seules préférences.
  assert.equal(d.conclusion.includes("aucune condition"), false);
  assert.match(d.conclusion, /pas encore couvertes/i);
  assert.match(d.conclusion, /Un point pèse plus que les autres/);
});

test("le scope SORT des phrases : il vit dans le plan, affiché en tête de carte", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune+adresse");
  assert.equal(d.narrativePlan.scope, "commune+adresse");
  assert.equal(d.conclusion.includes("À l'échelle de la commune"), false);
});

test("titre vérifications non-habitant : « À examiner avant de vous engager »", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /à examiner/i);
});

test("les réserves annoncées sont les faits AFFICHÉS, jamais les faits émis (caps)", () => {
  // 5 vérifications émises, section plafonnée à 4 : le dossier compte 4, pas 5. Le lecteur doit
  // pouvoir compter les cartes et retomber sur le chiffre, y compris dans le verdict.
  const facts = Array.from({ length: 5 }, (_, i) => verif(`v${i}`));
  const d = assembleDossier(run(facts, ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.sections.find((s) => s.key === "verifications")!.facts.length, 4);
  assert.equal(d.narrativePlan.reservesCount, 4);
});

test("le dossier porte le plan narratif, et sa conclusion en est la concaténation", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.conclusion, d.narrativePlan.blocks.map((b) => b.fallbackText).join(" "));
  assert.equal(d.narrativePlan.blocks[0]!.key, "verdict");
  assert.equal(d.narrativePlan.blocks[0]!.generable, false); // le verdict n'est jamais généré
});
