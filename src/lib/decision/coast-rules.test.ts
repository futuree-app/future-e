import test from "node:test";
import assert from "node:assert/strict";
import { COAST_RULES } from "./coast-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts>): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, reliefProximite: 0, distanceCoteKm: 240, population: 98_000, altitude: 30,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null, rankBands: null,
    localNetwork: { measured: false, access: null }, higherEd: { measured: false },
    scores: {}, hasAddress: false, ...over,
  };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
const rule = COAST_RULES[0]!;

test("la fabrique produit 1 règle", () => { assert.equal(COAST_RULES.length, 1); });

test("loin (>=100) + poids 3 -> mismatch STRUCTURANT, absolute_measure, distance estimée, jamais 'la mer est à'", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 146 }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.role, "mismatch");
  const basis = (f as { basis: { kind: string; value: number; unit: string; conventionId: string } }).basis;
  assert.equal(basis.kind, "absolute_measure");
  assert.equal(basis.value, 146);
  assert.equal(basis.unit, "km");
  assert.equal(basis.conventionId, "coast-proximity-v1");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /distance au littoral est estimée à environ 146 km/);
  assert.match(f.statement, /point de référence retenu/);
  assert.doesNotMatch(f.statement, /la mer est à/i);
  assert.doesNotMatch(f.statement, /insuffisant|manque|médiocre/i);
  assert.equal(f.evidence[0]!.factId, "coastDistance.proximite_mer");
  assert.match(f.evidence[0]!.observedValue!, /distance au littoral estimée à environ 146 km/);
  assertFactValid(f, p);
});

test("la valeur du basis est BRUTE (non arrondie) ; seul le texte arrondit", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 146.4 }), p, undefined as never);
  const f = e.facts[0]!;
  const basis = (f as { basis: { value: number } }).basis;
  assert.equal(basis.value, 146.4);                        // fait auditable : valeur brute
  assert.match(f.statement, /environ 146 km/);             // restitution humaine : arrondie
});

test("loin + poids 2 -> mismatch SECONDARY", () => {
  const p = project([{ key: "proximite_mer", weight: 2 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 240 }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts[0]!.materialityTier, "secondary");
});

test("proche (<=15) -> satisfied silencieux ; intermédiaire -> neutral silencieux ; aucun fait", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  const near = rule.evaluate(facts({ distanceCoteKm: 4 }), p, undefined as never);
  assert.equal(near.outcome, "satisfied");
  assert.equal(near.facts.length, 0);
  const mid = rule.evaluate(facts({ distanceCoteKm: 50 }), p, undefined as never);
  assert.equal(mid.outcome, "neutral");
  assert.equal(mid.facts.length, 0);
});

test("distance nulle/corrompue -> uncertain, aucune valeur inventée", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  assert.equal(rule.evaluate(facts({ distanceCoteKm: null }), p, undefined as never).outcome, "uncertain");
  assert.equal(rule.evaluate(facts({ distanceCoteKm: Number.NaN }), p, undefined as never).outcome, "uncertain");
});

test("LE POIDS 1 : loin -> mismatch calculé mais SILENCIEUX (facts vides)", () => {
  const p = project([{ key: "proximite_mer", weight: 1 }]);
  const e = rule.evaluate(facts({ distanceCoteKm: 240 }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("priorité absente (poids 0) -> not_applicable", () => {
  const e = rule.evaluate(facts({ distanceCoteKm: 240 }), project([]), undefined as never);
  assert.equal(e.outcome, "not_applicable");
});
