import test from "node:test";
import assert from "node:assert/strict";
import { buildLogementFacts } from "./logement-facts.ts";
import type { LogementDecisionData } from "../server/logement-decision-data.ts";
import type { DpeRecord } from "../dpe.ts";

function data(over: Partial<LogementDecisionData> = {}): LogementDecisionData {
  return {
    rga: { coverage: "none", label: null }, pprn: { coverage: "none", count: 0 },
    cavites: { coverage: "none", count: 0 }, patrimoine: { coverage: "none", count: 0 },
    sinistralite: { coverage: "none", active: false }, fetchedAt: "2026-07-12T00:00:00.000Z", ...over,
  };
}

test("DPE depuis l'artefact sauvegardé + label", () => {
  const f = buildLogementFacts(data(), { etiquette_dpe: "G" } as DpeRecord);
  assert.equal(f.dpe, "passoire");
  assert.equal(f.dpeLabel, "G");
});

test("RGA present + label notable -> expositionBati vrai ; coverage transmis", () => {
  const f = buildLogementFacts(data({ rga: { coverage: "present", label: "Aléa moyen" } }), null);
  assert.equal(f.rga, "present");
  assert.equal(f.expositionBati, true);
});

test("RGA present mais label faible -> expositionBati faux", () => {
  const f = buildLogementFacts(data({ rga: { coverage: "present", label: "Aléa faible" } }), null);
  assert.equal(f.expositionBati, false);
});

test("cavités unavailable -> coverage unavailable, booléen faux", () => {
  const f = buildLogementFacts(data({ cavites: { coverage: "unavailable", count: 0 } }), null);
  assert.equal(f.cavites, "unavailable");
  assert.equal(f.caviteProche, false);
});

test("patrimoine present -> perimetrePatrimonial vrai", () => {
  const f = buildLogementFacts(data({ patrimoine: { coverage: "present", count: 2 } }), null);
  assert.equal(f.perimetrePatrimonial, true);
});
