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
function verif(): DecisionFact {
  return { id: "v", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
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
