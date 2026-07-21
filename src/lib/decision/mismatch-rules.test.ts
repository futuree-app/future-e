import test from "node:test";
import assert from "node:assert/strict";
import { MISMATCH_RULES, MISMATCH_KEYS } from "./mismatch-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { MISMATCH_LABELS, type RankBand } from "./mismatch-facts.ts";
import { MISMATCH_RANK_KEYS } from "../comparateur-scores.ts";

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

test("la fabrique produit 13 règles", () => {
  assert.equal(MISMATCH_RULES.length, 13);
});

test("douceur_climat : hiver froid + poids 3 -> mismatch relative_position, limitation hivernale 1976-2005", () => {
  const p = project([{ key: "douceur_climat", weight: 3 }]);
  const f = evalRule("douceur_climat", facts({ douceur_climat: { low: 0.03, high: 0.12 } }), p).facts[0]!;
  assert.equal((f as { basis: { kind: string } }).basis.kind, "relative_position");
  assert.match(f.limitation!, /1976-2005/);
  assert.match(f.limitation!, /décembre à février|hivernale/);
  assert.doesNotMatch(f.limitation!, /agréable/);
  assert.match(f.topic, /hivers/);
});

test("ensoleillement : extrême défavorable + poids 3 -> mismatch structurant PORTANT la limitation ERA5-Land", () => {
  const p = project([{ key: "ensoleillement_recherche", weight: 3 }]);
  const f = evalRule("ensoleillement_recherche", facts({ ensoleillement_recherche: { low: 0.03, high: 0.12 } }), p).facts[0]!;
  assert.equal(f.role, "mismatch");
  assert.equal((f as { basis: { kind: string } }).basis.kind, "relative_position");
  assert.match(f.limitation!, /réanalyse ERA5-Land, normale 1991-2020/);
  assert.match(f.limitation!, /ne constitue pas une projection/);
  assertFactValid(f, p);
});

test("garde : MISMATCH_KEYS et MISMATCH_RANK_KEYS coïncident", () => {
  assert.deepEqual([...MISMATCH_KEYS].sort(), [...MISMATCH_RANK_KEYS].sort());
});

test("garde : chaque MISMATCH_KEY a une entrée MISMATCH_LABELS", () => {
  for (const k of MISMATCH_KEYS) assert.ok(MISMATCH_LABELS[k], `label manquant pour ${k}`);
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
test("la CLÔTURE appelle un arbitrage, sans réciter « cette dimension de votre projet »", () => {
  // La phrase de trop (« Cela répond moins bien à cette dimension de votre projet ») répétait le titre de
  // section et parlait d'abstraction administrative. La clôture nomme l'arbitrage et garde la seule
  // doctrine indispensable (mismatch != incompatibilité), dite en deux phrases.
  const f = evalRule("nature", facts({ nature: { low: 0.08, high: 0.14 } }), project([{ key: "nature", weight: 3 }])).facts[0]!;
  assert.match(f.statement, /Cet écart appelle un arbitrage\. Il ne rend pas Roubaix incompatible avec votre projet\.$/);
  assert.doesNotMatch(f.statement, /répond moins bien à cette dimension/);
  assert.doesNotMatch(f.statement, /incompatible avec lui/); // l'ancienne tournure a disparu
});

test("G3 : quand la priorité et l'indicateur coïncident (acces_ecoles), « Sur ce point » évite la répétition", () => {
  // Pour acces_ecoles, projectPhrase === indicator (« l'accès aux collèges et lycées ») : le gabarit
  // générique redisait le libellé deux fois de suite. « Sur ce point » le remplace côté constat.
  const f = evalRule("acces_ecoles", facts({ acces_ecoles: { low: 0.02, high: 0.06 } }), project([{ key: "acces_ecoles", weight: 3 }])).facts[0]!;
  assert.match(f.statement, /Vous avez placé l'accès aux collèges et lycées parmi vos priorités\. Sur ce point, Roubaix se situe/);
  assert.doesNotMatch(f.statement, /Sur l'accès aux collèges et lycées/); // plus de duplication
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
