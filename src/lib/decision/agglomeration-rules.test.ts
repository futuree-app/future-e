import test from "node:test";
import assert from "node:assert/strict";
import { AGGLOMERATION_RULES } from "./agglomeration-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts>): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 90,
    population: 98_000, altitude: 30, catnatInondation: 0, inondationRisque: 10, climat: null, sante: null,
    rankBands: null, localNetwork: { measured: false, access: null }, higherEd: { measured: false },
    scores: {}, hasAddress: false, ...over,
  };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return { posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z" };
}
const rule = (key: string) => AGGLOMERATION_RULES.find((r) => r.id === `territoire.taille-${key}`)!;

test("la fabrique produit 3 règles", () => { assert.equal(AGGLOMERATION_RULES.length, 3); });

test("eviter_grandes_villes : métropole UU + poids 3 -> mismatch STRUCTURANT, categorical_state, grain unite_urbaine", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const f = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000, tailleVilleSource: "urban_unit" }), p, undefined as never).facts[0]!;
  const basis = (f as { basis: { kind: string; observedCategory: string; conventionId: string } }).basis;
  assert.equal(basis.kind, "categorical_state");
  assert.equal(basis.observedCategory, "metropole");
  assert.equal(basis.conventionId, "agglomeration-size-v1");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /appartient à une métropole/);
  assert.doesNotMatch(f.statement, /trop grand|trop petit|insuffisant/i);
  assert.equal(f.evidence[0]!.factId, "territorySize.classification");
  assert.equal(f.evidence[0]!.grain, "unite_urbaine");
  assertFactValid(f, p);
});

test("eviter_grandes_villes : village/petite -> satisfied silencieux ; moyenne -> neutral", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never).outcome, "satisfied");
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 10_000, tailleVilleSource: "urban_unit" }), p, undefined as never).outcome, "satisfied");
  const mid = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 50_000, tailleVilleSource: "urban_unit" }), p, undefined as never);
  assert.equal(mid.outcome, "neutral"); assert.equal(mid.facts.length, 0);
});

test("prefere_grande_ville : miroir (village -> mismatch, grande -> satisfied)", () => {
  const p = project([{ key: "prefere_grande_ville", weight: 2 }]);
  const vil = rule("prefere_grande_ville").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never);
  assert.equal(vil.outcome, "mismatch");
  assert.equal(vil.facts[0]!.materialityTier, "secondary");
  assert.equal(rule("prefere_grande_ville").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: "urban_unit" }), p, undefined as never).outcome, "satisfied");
});

test("eviter_isolement : village -> mismatch + limitation + topic isolement ; JAMAIS satisfied", () => {
  const p = project([{ key: "eviter_isolement", weight: 3 }]);
  const vil = rule("eviter_isolement").evaluate(facts({ tailleVille: 1_500, tailleVilleSource: "commune" }), p, undefined as never);
  assert.equal(vil.outcome, "mismatch");
  // La limite épistémique n'a pas disparu avec la conclusion : elle a rejoint la LIMITATION, où elle
  // se lit une fois, en ghost, au lieu de clore le constat.
  assert.doesNotMatch(vil.facts[0]!.statement, /appelle un arbitrage|répond moins bien|conclure/);
  assert.match(vil.facts[0]!.limitation!, /ne permet pas de conclure à un isolement effectif/);
  assert.match(vil.facts[0]!.limitation!, /bien connecté à une ville proche/);
  assert.match(vil.facts[0]!.topic, /isolement/);
  for (const [pop, src] of [[1_500, "commune"], [10_000, "urban_unit"], [50_000, "urban_unit"], [200_000, "urban_unit"], [1_050_000, "urban_unit"]] as const) {
    assert.notEqual(rule("eviter_isolement").evaluate(facts({ tailleVille: pop, tailleVilleSource: src }), p, undefined as never).outcome, "satisfied");
  }
});

test("provenance : source commune -> 'est classée comme' + 'population communale', jamais 'agglomération' ; grain commune", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const co = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.match(co.statement, /est classée comme une grande ville/);
  assert.match(co.statement, /population communale/);
  assert.doesNotMatch(co.statement, /agglomération/);
  assert.equal(co.evidence[0]!.grain, "commune");
});

test("métropole en source commune -> 'une très grande ville' (jamais 'métropole')", () => {
  const p = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  const co = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 700_000, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.match(co.statement, /une très grande ville/);
  assert.doesNotMatch(co.statement, /métropole/);
});

test("tailleVille null OU source null (anomalie) -> uncertain ; poids 1 -> silencieux ; poids 0 -> not_applicable", () => {
  const p3 = project([{ key: "eviter_grandes_villes", weight: 3 }]);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: null, tailleVilleSource: null }), p3, undefined as never).outcome, "uncertain");
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 200_000, tailleVilleSource: null }), p3, undefined as never).outcome, "uncertain");
  const p1 = project([{ key: "eviter_grandes_villes", weight: 1 }]);
  const e1 = rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000 }), p1, undefined as never);
  assert.equal(e1.outcome, "mismatch"); assert.equal(e1.facts.length, 0);
  assert.equal(rule("eviter_grandes_villes").evaluate(facts({ tailleVille: 1_050_000 }), project([]), undefined as never).outcome, "not_applicable");
});

test("deux mismatchs (village : prefere_grande + eviter_isolement) partagent le sourceFactId canonique", () => {
  const p = project([{ key: "prefere_grande_ville", weight: 3 }, { key: "eviter_isolement", weight: 2 }]);
  const a = rule("prefere_grande_ville").evaluate(facts({ tailleVille: 900, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  const b = rule("eviter_isolement").evaluate(facts({ tailleVille: 900, tailleVilleSource: "commune" }), p, undefined as never).facts[0]!;
  assert.deepEqual(a.sourceFactIds, ["territorySize.classification"]);
  assert.deepEqual(b.sourceFactIds, ["territorySize.classification"]);
});
