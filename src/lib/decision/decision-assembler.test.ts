import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import type { DecisionFact, RunResult, IncompatibilityFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
function run(facts: DecisionFact[], covered: RunResult["coveredHardConstraints"] = []): RunResult {
  return { facts, evaluations: [], coveredHardConstraints: covered };
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

test("incompatibilité établie -> established_incompatibility, conclusion communale", () => {
  const d = assembleDossier(run([incompat()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.conclusionState, "established_incompatibility");
  assert.match(d.conclusion, /à l'échelle de la commune/i);
});

test("no_hard_constraint_declared distinct de no_incompatibility_established", () => {
  const sansHC = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.equal(sansHC.conclusionState, "no_hard_constraint_declared");
  const avecHC = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(avecHC.conclusionState, "no_incompatibility_established");
});

test("contrainte déclarée non couverte -> nommée dans uncovered + conclusion", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [] });
  const d = assembleDossier(run([], ["nearSea"]), p, "commune");
  assert.deepEqual(d.uncovered.map((u) => u.key), ["communeSize"]);
  assert.match(d.conclusion, /pas encore examiné/i);
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

test("no_hard_constraint_declared : nomme priorités non couvertes + réserves dans la conclusion", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "air_sain", weight: 3 }] });
  const d = assembleDossier(run([verif()]), p, "commune");
  assert.equal(d.conclusionState, "no_hard_constraint_declared");
  assert.match(d.conclusion, /aucune condition/i);
  assert.match(d.conclusion, /pas encore couvertes/i);
  assert.match(d.conclusion, /1 point/);
});

test("scope commune+adresse : conclusion préfixée « commune et de l'adresse »", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune+adresse");
  assert.match(d.conclusion, /commune et de l'adresse/i);
});

test("titre vérifications non-habitant : « À examiner avant de vous engager »", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /à examiner/i);
});

test("les réserves annoncées sont les faits AFFICHÉS, jamais les faits émis (caps)", () => {
  // 5 vérifications émises, section plafonnée à 4 : la conclusion doit annoncer 4, pas 5.
  const facts = Array.from({ length: 5 }, (_, i) => verif(`v${i}`));
  const d = assembleDossier(run(facts, ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.sections.find((s) => s.key === "verifications")!.facts.length, 4);
  assert.equal(d.narrativePlan.reservesCount, 4);
  assert.match(d.conclusion, /4 points/);
});

test("le dossier porte le plan narratif, et sa conclusion en est la concaténation", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune");
  assert.equal(d.conclusion, d.narrativePlan.blocks.map((b) => b.fallbackText).join(" "));
  assert.equal(d.narrativePlan.blocks[0]!.key, "verdict");
  assert.equal(d.narrativePlan.blocks[0]!.generable, false); // le verdict n'est jamais généré
});
