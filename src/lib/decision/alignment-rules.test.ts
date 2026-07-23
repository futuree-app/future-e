import test from "node:test";
import assert from "node:assert/strict";
import { ALIGNMENT_RULES, alignmentRuleId } from "./alignment-rules.ts";
import { MISMATCH_KEYS } from "./mismatch-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts, AlignmentFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { RankBand } from "./mismatch-facts.ts";

function facts(bands: Record<string, RankBand> | null): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6, lon: 1.44, uu: "31701",
    tailleVille: 1_050_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 90, population: 500_000, altitude: 30,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null,
    rankBands: bands, scores: {}, hasAddress: false,
  };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
const rule = (key: string) => ALIGNMENT_RULES.find((r) => r.id === alignmentRuleId(key))!;
const evalRule = (key: string, f: ModuleFacts, p: UserProject) => rule(key).evaluate(f, p, undefined as never);
// satisfied = classifyPosition rend "satisfied" quand band.low >= 0.8. low 0.92 -> 1-low = 0.08 -> « 10 % ».
const TOP = { low: 0.92, high: 0.99 };

test("la fabrique produit une règle d'alignment par critère classable", () => {
  assert.equal(ALIGNMENT_RULES.length, MISMATCH_KEYS.length);
});

test("satisfied + poids 3 -> un fait alignment, fondement relative_position, tier structuring", () => {
  const p = project([{ key: "acces_soins", weight: 3 }]);
  const ev = evalRule("acces_soins", facts({ acces_soins: TOP }), p);
  assert.equal(ev.outcome, "satisfied");
  const f = ev.facts[0] as AlignmentFact;
  assert.equal(f.role, "alignment");
  assert.equal(f.projectKey, "acces_soins");
  assert.equal(f.basis.kind, "relative_position");
  assert.equal(f.materialityTier, "structuring");
  assert.ok(f.headlineSubject.length > 0);
  assert.ok(f.evidence.length > 0);
  // La phrase de rang porte TOUJOURS « de communes » et le percentile injecté.
  assert.match(f.statement, /de communes/);
  assert.match(f.statement, /les 10 % de communes/);
  assertFactValid(f, p);
});

test("le percentile est paramétrique : band.low 0.95 -> « 5 % », 0.85 -> « 20 % »", () => {
  const p = project([{ key: "vie_locale", weight: 3 }]);
  const cinq = evalRule("vie_locale", facts({ vie_locale: { low: 0.96, high: 0.99 } }), p).facts[0] as AlignmentFact;
  assert.match(cinq.statement, /les 5 % de communes/);
  const vingt = evalRule("vie_locale", facts({ vie_locale: { low: 0.82, high: 0.9 } }), p).facts[0] as AlignmentFact;
  assert.match(vingt.statement, /les 20 % de communes/);
  // La copie propre au critère (vie_locale = « les plus animées »).
  assert.match(vingt.statement, /les plus animées/);
});

test("satisfied + poids 2 -> secondary", () => {
  const p = project([{ key: "acces_soins", weight: 2 }]);
  const f = evalRule("acces_soins", facts({ acces_soins: TOP }), p).facts[0] as AlignmentFact;
  assert.equal(f.materialityTier, "secondary");
});

test("satisfied + poids 1 -> examiné mais SILENCIEUX (aucun fait), comme le mismatch mineur", () => {
  const p = project([{ key: "acces_soins", weight: 1 }]);
  const ev = evalRule("acces_soins", facts({ acces_soins: TOP }), p);
  assert.equal(ev.outcome, "satisfied");
  assert.equal(ev.facts.length, 0);
});

test("neutral / mismatch -> aucun alignment", () => {
  const p = project([{ key: "acces_soins", weight: 3 }]);
  assert.equal(evalRule("acces_soins", facts({ acces_soins: { low: 0.4, high: 0.6 } }), p).facts.length, 0); // neutral
  assert.equal(evalRule("acces_soins", facts({ acces_soins: { low: 0.02, high: 0.1 } }), p).facts.length, 0); // mismatch, laissé à mismatch-rules
});

test("priorité non déclarée -> not_applicable, rang absent -> uncertain", () => {
  assert.equal(evalRule("acces_soins", facts({ acces_soins: TOP }), project([])).outcome, "not_applicable");
  assert.equal(evalRule("acces_soins", facts(null), project([{ key: "acces_soins", weight: 3 }])).outcome, "uncertain");
});
