import test from "node:test";
import assert from "node:assert/strict";
import {
  preferenceWeight, declaredPreferenceKeys, nearSeaLimitKm, communeSizeBounds,
  isBuyer, isStructured, hasAnyHardConstraint, declaredHardConstraintKeys,
} from "./project-view.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
const HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [{ key: "faible_chaleur", weight: 3 }] };

test("isStructured : faux si parsed null", () => {
  assert.equal(isStructured(project(null)), false);
  assert.equal(isStructured(project(HC)), true);
});

test("isBuyer : seul intent achat, pas la posture adresse", () => {
  assert.equal(isBuyer(project(HC, { posture: "adresse" })), false);
  assert.equal(isBuyer(project(HC, { intent: "achat" })), true);
});

test("declaredHardConstraintKeys : énumère les contraintes présentes", () => {
  assert.deepEqual([...declaredHardConstraintKeys(project(HC))].sort(), ["communeSize", "nearSea"]);
  assert.deepEqual(declaredHardConstraintKeys(project(null)), []);
});

test("communeSizeBounds : lit min/max", () => {
  assert.deepEqual(communeSizeBounds(project(HC)), { min: null, max: 20000 });
  assert.equal(communeSizeBounds(project({ reformulation: "x", hardConstraints: {}, preferences: [] })), null);
});

// `uncoveredConstraints` et `uncoveredPreferences` ont migré dans criteria-registry.ts : elles se
// dérivent désormais de la couverture OBSERVÉE (évaluations des règles), plus d'une liste parallèle.
// Leurs tests vivent dans criteria-registry.test.ts.

test("declaredPreferenceKeys + preferenceWeight", () => {
  assert.deepEqual(declaredPreferenceKeys(project(HC)), ["faible_chaleur"]);
  assert.equal(preferenceWeight(project(HC), "faible_chaleur"), 3);
  assert.equal(preferenceWeight(project(HC), "nature"), 0);
});

test("nearSeaLimitKm + hasAnyHardConstraint", () => {
  assert.equal(nearSeaLimitKm(project(HC)), 5);
  assert.equal(hasAnyHardConstraint(project(HC)), true);
  assert.equal(hasAnyHardConstraint(project({ reformulation: "x", hardConstraints: {}, preferences: [] })), false);
});
