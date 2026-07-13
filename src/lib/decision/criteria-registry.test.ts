import test from "node:test";
import assert from "node:assert/strict";
import { buildCriteriaRegistry, uncoveredPreferences, uncoveredConstraints } from "./criteria-registry.ts";
import type { RunResult, RuleEvaluation, DecisionFact, MaterialityTier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(hard: Record<string, unknown>, prefs: { key: string; weight: number }[]): UserProject {
  return {
    posture: "recherche", intent: null, rawText: "x", updatedAt: null, schemaVersion: 1,
    parsed: { reformulation: "x", hardConstraints: hard, preferences: prefs } as UserProject["parsed"],
  };
}
function ev(ruleId: string, keys: string[], outcome: RuleEvaluation["outcome"], facts: DecisionFact[] = []): RuleEvaluation {
  return { ruleId, projectKeys: keys, outcome, facts, reason: "test" };
}
function reserve(id: string, tier: MaterialityTier): DecisionFact {
  return {
    id, ruleId: `r-${id}`, sourceFactIds: [], module: "territoire", statement: `constat ${id}`,
    materialityTier: tier, role: "verification", evidence: [],
    action: { type: "verifier_sur_place", label: "Vérifier" },
  };
}
function run(evaluations: RuleEvaluation[]): RunResult {
  return { evaluations, facts: evaluations.flatMap((e) => e.facts), coveredHardConstraints: [] };
}

test("un critère satisfied SILENCIEUSEMENT est examiné, et favorable", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_risque_inondation", weight: 3 }]),
    run([ev("r1", ["faible_risque_inondation"], "satisfied")]),
  );
  const c = s.registry.find((x) => x.criterionKey === "faible_risque_inondation")!;
  assert.equal(c.coverage, "examined");
  assert.equal(c.outcome, "favorable");
  assert.equal(s.hasFavorable, true);
});

test("une préférence examinée par PLUSIEURS règles compte pour UNE", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied"), ev("r2", ["faible_chaleur"], "verification", [reserve("f1", "secondary")])]),
  );
  assert.equal(s.registry.length, 1);
  assert.equal(s.registry[0]!.outcome, "reserve"); // le PIRE gagne
  assert.equal(s.registry[0]!.ruleIds.length, 2);
});

test("un critère satisfied par une règle et unknown par une autre reste EXAMINÉ", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied"), ev("r2", ["faible_chaleur"], "unknown", [reserve("f2", "secondary")])]),
  );
  assert.equal(s.registry[0]!.coverage, "examined");
});

test("un critère que SEUL un unknown touche reste NON examiné", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "unknown", [reserve("f3", "secondary")])]),
  );
  assert.equal(s.registry[0]!.coverage, "unexamined");
  assert.equal(s.coverage, "none");
  assert.equal(s.orientation, "indeterminate");
});

test("le COUPERET : une contrainte dure non examinée interdit `high`, même à 100 % de préférences", () => {
  const s = buildCriteriaRegistry(
    project({ nearPlace: { label: "Gare", maxKm: null } }, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied")]),
  );
  assert.equal(s.coverage, "partial");
});

test("`high` exige toutes les contraintes dures ET 70 % des critères", () => {
  const s = buildCriteriaRegistry(
    project({ departements: ["31"] }, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["departements"], "satisfied"), ev("r2", ["faible_chaleur"], "satisfied")]),
  );
  assert.equal(s.coverage, "high");
  assert.equal(s.orientation, "favorable");
});

test("orientation : une réserve STRUCTURANTE l'emporte sur des favorables", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }, { key: "faible_risque_inondation", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied"), ev("r2", ["faible_risque_inondation"], "verification", [reserve("f4", "structuring")])]),
  );
  assert.equal(s.orientation, "major_reserves");
  assert.equal(s.hasFavorable, true);
  assert.equal(s.favorableCount, 1); // UN seul : la phrase ne dira PAS « plusieurs dimensions »
});

test("favorableCount : « plusieurs dimensions » exige deux critères favorables, pas un booléen", () => {
  const s = buildCriteriaRegistry(
    project({}, [
      { key: "faible_chaleur", weight: 3 },
      { key: "faible_risque_inondation", weight: 3 },
      { key: "acces_transports", weight: 3 },
    ]),
    run([
      ev("r1", ["faible_chaleur"], "satisfied"),
      ev("r2", ["faible_risque_inondation"], "satisfied"),
      ev("r3", ["acces_transports"], "verification", [reserve("f6", "structuring")]),
    ]),
  );
  assert.equal(s.favorableCount, 2);
});

test("orientation : des réserves SECONDAIRES sans aucun favorable ne sont PAS `major_reserves`", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["faible_chaleur"], "verification", [reserve("f5", "secondary")])]),
  );
  assert.equal(s.orientation, "minor_reserves");
  assert.equal(s.hasFavorable, false); // rien de positif : la phrase ne promettra rien
});

test("une incompatibilité écrase tout", () => {
  const s = buildCriteriaRegistry(
    project({ departements: ["33"] }, [{ key: "faible_chaleur", weight: 3 }]),
    run([ev("r1", ["departements"], "incompatible"), ev("r2", ["faible_chaleur"], "satisfied")]),
  );
  assert.equal(s.orientation, "incompatible");
});

test("INVARIANT : `indeterminate` implique couverture `none`, et réciproquement", () => {
  const s = buildCriteriaRegistry(project({}, []), run([]));
  assert.equal(s.coverage, "none");
  assert.equal(s.orientation, "indeterminate");
});

test("les priorités non couvertes se DÉRIVENT du registre, plus d'une liste écrite à la main", () => {
  const s = buildCriteriaRegistry(
    project({}, [{ key: "faible_chaleur", weight: 3 }, { key: "vie_locale", weight: 2 }]),
    run([ev("r1", ["faible_chaleur"], "satisfied")]),
  );
  const un = uncoveredPreferences(s);
  assert.equal(un.length, 1);
  assert.equal(un[0]!.key, "vie_locale");
  assert.equal(un[0]!.label, "une vie locale animée");
});

test("les contraintes dures non examinées se dérivent du registre, avec leur libellé", () => {
  const s = buildCriteriaRegistry(
    project({ departements: ["31"], nearPlace: { label: "Gare", maxKm: null } }, []),
    run([ev("r1", ["departements"], "satisfied")]),
  );
  const un = uncoveredConstraints(s);
  assert.equal(un.length, 1);
  assert.equal(un[0]!.key, "nearPlace");
  assert.equal(un[0]!.label, "la proximité d'un lieu");
});
