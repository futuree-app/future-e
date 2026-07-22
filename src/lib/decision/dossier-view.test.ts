import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import { conditionPorteeParLeBloc, sectionsAffichees } from "./dossier-view.ts";
import type { DecisionFact, RunResult, RuleEvaluation } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z" };
}
function ev(ruleId: string, keys: string[], outcome: RuleEvaluation["outcome"], facts: DecisionFact[] = []): RuleEvaluation {
  return { ruleId, projectKeys: keys, outcome, facts, reason: "test" };
}
function incompat(over: Partial<DecisionFact> = {}): DecisionFact {
  return {
    id: "i", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "incompatibility",
    evidenceStrength: "established", hardConstraintKey: "nearSea", materialityTier: "decision_critical",
    topic: "la distance au littoral", statement: "La mer est à 240 km, au-delà de la limite de 5 km que vous avez posée.",
    evidence: [{ factId: "s", module: "territoire", label: "Territoire", grain: "commune", observedValue: "240 km" }],
    ...over,
  } as DecisionFact;
}
function verif(id = "v"): DecisionFact {
  return {
    id, ruleId: "rv", sourceFactIds: ["s"], module: "territoire", role: "verification",
    materialityTier: "structuring", topic: "un point à vérifier", statement: "à vérifier",
    evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
    action: { type: "obtenir_document", label: "doc" },
  } as DecisionFact;
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };

function dossierAvec(facts: DecisionFact[]) {
  const run: RunResult = { facts, evaluations: [ev("r", ["nearSea"], "incompatible", facts)] };
  return assembleDossier(run, project(WITH_HC), "commune", "Toulouse");
}

test("une seule condition établie : le bloc la porte, sa section ne s'affiche pas", () => {
  const d = dossierAvec([incompat()]);
  // Le détail du verdict EST le constat du fait : c'est ce qui rendait la section redondante.
  assert.equal(d.narrativePlan.verdict.detail, incompat().statement);
  assert.equal(conditionPorteeParLeBloc(d)?.id, "i");
  assert.equal(sectionsAffichees(d).some((s) => s.key === "incompatibilities"), false);
});

test("le fait RESTE dans le dossier : on masque une carte, on ne retire pas un fait", () => {
  const d = dossierAvec([incompat()]);
  // La règle est de présentation. La preuve, la base de conclusion et l'état ne bougent pas.
  assert.equal(d.sections.some((s) => s.key === "incompatibilities"), true);
  assert.equal(d.conclusionBasis.factIds.includes("i"), true);
  assert.equal(d.conclusionState, "established_incompatibility");
});

test("deux conditions : la section reprend son rôle, le bloc n'en nomme qu'une", () => {
  const d = dossierAvec([incompat(), incompat({ id: "i2", statement: "Autre condition non remplie." })]);
  assert.equal(conditionPorteeParLeBloc(d), null);
  assert.equal(sectionsAffichees(d).some((s) => s.key === "incompatibilities"), true);
});

test("une condition INDICATIVE n'est pas celle que le héros nomme : sa section reste", () => {
  // `establishedIncompatibility` filtre sur evidenceStrength : le bloc ne porte pas ce constat, donc
  // la carte ne répète rien.
  const d = dossierAvec([incompat({ evidenceStrength: "indicative" })]);
  assert.equal(conditionPorteeParLeBloc(d), null);
  assert.equal(sectionsAffichees(d).some((s) => s.key === "incompatibilities"), true);
});

test("sans condition : toutes les sections s'affichent, rien n'est masqué", () => {
  const run: RunResult = { facts: [verif()], evaluations: [ev("rv", ["nearSea"], "verification", [verif()])] };
  const d = assembleDossier(run, project(WITH_HC), "commune", "Toulouse");
  assert.equal(conditionPorteeParLeBloc(d), null);
  assert.deepEqual(sectionsAffichees(d).map((s) => s.key), d.sections.map((s) => s.key));
});
