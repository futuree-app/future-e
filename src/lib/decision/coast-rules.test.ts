// FUT-33 (2B.2 D) : la règle de la préférence « proximité de la mer » au dossier. Sans distance dite, elle ne juge
// pas : ni correspondance (« dans ce que vous recherchez »), ni écart, quelle que soit la distance.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COAST_RULES } from "./coast-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

const rule = COAST_RULES[0]!;
function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: null,
    tailleVille: 1_050_000, tailleVilleSource: "urban_unit", reliefProximite: 0, merCentreKm: 240, communeLittoraleMer: false,
    population: 98_000, altitude: 30, catnatInondation: 0, inondationRisque: 10, climat: null, scores: {}, hasAddress: false, ...over,
  } as ModuleFacts;
}
const project = (prefs: { key: string; weight: number }[]): UserProject => ({
  posture: "recherche", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
  parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
});

test("préférence non déclarée -> not_applicable", () => {
  assert.equal(rule.evaluate(facts(), project([]), undefined as never).outcome, "not_applicable");
});

test("à toute distance, à tout poids : neutral, aucun fait (aucun seuil fabriqué)", () => {
  for (const km of [0, 0.7, 8, 15, 16, 99, 100, 240]) {
    for (const weight of [1, 2, 3]) {
      const e = rule.evaluate(facts({ merCentreKm: km }), project([{ key: "proximite_mer", weight }]), undefined as never);
      assert.equal(e.outcome, "neutral", `${km} km, poids ${weight}`);
      assert.deepEqual(e.facts, []);
      assert.deepEqual(e.projectKeys, ["proximite_mer"]);
    }
  }
});

test("distance absente ou corrompue -> uncertain", () => {
  const p = project([{ key: "proximite_mer", weight: 3 }]);
  for (const km of [null, Number.NaN, -1]) {
    assert.equal(rule.evaluate(facts({ merCentreKm: km as number | null }), p, undefined as never).outcome, "uncertain");
  }
});

test("la convention 15 / 100 km a disparu du dossier", () => {
  const src = readFileSync(new URL("./coast-rules.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /classifyCoastDistance|COAST_PROXIMITY|satisfiedMaxKm|mismatchMinKm/);
});
