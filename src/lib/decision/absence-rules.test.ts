import test from "node:test";
import assert from "node:assert/strict";
import { ABSENCE_RULES } from "./absence-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts>): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 90, population: 98_000, altitude: 30,
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
const rule = (key: string) => ABSENCE_RULES.find((r) => r.id === `territoire.absence-${key}`)!;

test("la fabrique produit 2 règles", () => { assert.equal(ABSENCE_RULES.length, 2); });

test("mobilité sous plancher + poids 3 -> mismatch STRUCTURANT, named_absence, jamais un jugement absolu", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 3 }]);
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: null } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.role, "mismatch");
  assert.equal((f as { basis: { kind: string } }).basis.kind, "named_absence");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /point de référence retenu/);
  assert.doesNotMatch(f.statement, /insuffisant|manque|mauvais|médiocre/i);
  assert.equal(f.evidence[0]!.factId, "absenceAttestation.mobilite_quotidienne");
  assertFactValid(f, p);
});

test("mobilité PRÉSENTE -> neutral ; NON MESURÉE -> uncertain", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 3 }]);
  assert.equal(rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: 55 } }), p, undefined as never).outcome, "neutral");
  assert.equal(rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: false, access: null } }), p, undefined as never).outcome, "uncertain");
});

test("LE POIDS 1 : mismatch calculé mais SILENCIEUX", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 1 }]);
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: null } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("priorité absente (poids 0) -> not_applicable", () => {
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: null } }), project([]), undefined as never);
  assert.equal(e.outcome, "not_applicable");
});

test("études : establishmentCount 0 + poids 2 -> mismatch SECONDARY citant le rayon exact", () => {
  const p = project([{ key: "vie_etudiante", weight: 2 }]);
  const e = rule("vie_etudiante").evaluate(facts({ higherEd: { measured: true, weightedAccess: 0, radiusKm: 25, establishmentCount: 0 } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.materialityTier, "secondary");
  assert.match(f.statement, /rayon de 25 km/);
  assert.match(f.limitation!, /ne permet pas de conclure à l'absence de vie étudiante/);
  assert.doesNotMatch(f.statement, /aucune vie étudiante/i);
  assertFactValid(f, p);
});
