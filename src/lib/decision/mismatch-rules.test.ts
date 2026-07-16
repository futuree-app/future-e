import test from "node:test";
import assert from "node:assert/strict";
import { MISMATCH_RULES } from "./mismatch-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { RankBand } from "./mismatch-facts.ts";

function facts(bands: Record<string, RankBand> | null): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 90, population: 98_000, altitude: 30,
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
const rule = (key: string) => MISMATCH_RULES.find((r) => r.id === `territoire.mismatch-${key}`)!;
const evalRule = (key: string, f: ModuleFacts, p: UserProject) => rule(key).evaluate(f, p, undefined as never);

test("la fabrique produit 11 règles", () => {
  assert.equal(MISMATCH_RULES.length, 11);
});
test("extrême défavorable + poids 3 -> mismatch STRUCTURANT, phrase comparative, jamais un jugement absolu", () => {
  const e = evalRule("nature", facts({ nature: { low: 0.08, high: 0.14 } }), project([{ key: "nature", weight: 3 }]));
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.role, "mismatch");
  assert.match(f.statement, /les 20 % de communes/);
  assert.match(f.statement, /de France/);
  assert.doesNotMatch(f.statement, /insuffisant|manque|mauvais|médiocre/i);
  assert.equal(f.materialityTier, "structuring");
  assert.equal(f.evidence[0]!.factId, "relativePosition.nature");
  assertFactValid(f, project([{ key: "nature", weight: 3 }]));
});
test("LE POIDS 1 : examiné, mais SILENCIEUX (mismatch sans carte, pas d'arbitrage)", () => {
  const e = evalRule("nature", facts({ nature: { low: 0.02, high: 0.06 } }), project([{ key: "nature", weight: 1 }]));
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});
test("extrême favorable -> satisfied silencieux ; centre -> neutral silencieux", () => {
  assert.equal(evalRule("nature", facts({ nature: { low: 0.9, high: 0.95 } }), project([{ key: "nature", weight: 3 }])).outcome, "satisfied");
  assert.equal(evalRule("nature", facts({ nature: { low: 0.45, high: 0.55 } }), project([{ key: "nature", weight: 3 }])).outcome, "neutral");
});
test("critère absent de rankBands -> uncertain (jamais un rang inventé)", () => {
  assert.equal(evalRule("nature", facts({}), project([{ key: "nature", weight: 3 }])).outcome, "uncertain");
});
test("priorité absente (poids 0) -> not_applicable", () => {
  assert.equal(evalRule("nature", facts({ nature: { low: 0.05, high: 0.09 } }), project([])).outcome, "not_applicable");
});
test("poids 2 -> secondary ; poids 3 -> structuring", () => {
  const f = facts({ vie_locale: { low: 0.03, high: 0.07 } });
  assert.equal(evalRule("vie_locale", f, project([{ key: "vie_locale", weight: 2 }])).facts[0]!.materialityTier, "secondary");
  assert.equal(evalRule("vie_locale", f, project([{ key: "vie_locale", weight: 3 }])).facts[0]!.materialityTier, "structuring");
});
test("lot 2b : acces_services en queue basse (poids 3) -> mismatch structurant, comparatif", () => {
  const e = evalRule("acces_services", facts({ acces_services: { low: 0.01, high: 0.04 } }), project([{ key: "acces_services", weight: 3 }]));
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /les 5 % de communes|de France/);
  assert.doesNotMatch(f.statement, /insuffisant|manque/i);
  assert.equal(f.evidence[0]!.factId, "relativePosition.acces_services");
});
