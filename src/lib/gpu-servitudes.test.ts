import test from "node:test";
import assert from "node:assert/strict";
import { buildHeritageProtections, type RawSupFeature } from "./gpu-servitudes.ts";

const feat = (idass: string): RawSupFeature => ({ properties: { idass } });

// Place Stanislas : 134 assiettes, presque toutes AC1. Le lecteur a besoin de savoir
// qu'il est dedans, jamais combien.
test("dédoublonne une famille répétée", () => {
  const features = Array.from({ length: 134 }, (_, i) => feat(`AC1-54395000${i}-1-1`));
  const out = buildHeritageProtections(features);
  assert.equal(out.length, 1);
  assert.equal(out[0].family, "AC1");
  assert.equal(out[0].label, "Abords d'un monument historique");
});

test("écarte les familles non patrimoniales", () => {
  const out = buildHeritageProtections([feat("AC1-a-1-1"), feat("PM1-b-1-1"), feat("AS1-c-1-1")]);
  assert.deepEqual(
    out.map((p) => p.family),
    ["AC1"],
  );
});

test("ordre stable AC1, AC4, AC2", () => {
  const out = buildHeritageProtections([feat("AC2-a-1-1"), feat("AC4-b-1-1"), feat("AC1-c-1-1")]);
  assert.deepEqual(
    out.map((p) => p.family),
    ["AC1", "AC4", "AC2"],
  );
});

test("entrées vides ou absentes", () => {
  assert.deepEqual(buildHeritageProtections([]), []);
  assert.deepEqual(buildHeritageProtections(null), []);
  assert.deepEqual(buildHeritageProtections(undefined), []);
});

test("idass absent, vide ou inconnu : ignoré, jamais deviné", () => {
  const out = buildHeritageProtections([
    { properties: null },
    { properties: { idass: null } },
    { properties: { idass: "" } },
    feat("XX9-a-1-1"),
    feat("ac1-minuscule-1-1"),
  ]);
  assert.deepEqual(out, []);
});

test("libellés officiels des trois familles", () => {
  const out = buildHeritageProtections([feat("AC1-a"), feat("AC2-b"), feat("AC4-c")]);
  assert.deepEqual(
    out.map((p) => p.label),
    ["Abords d'un monument historique", "Site patrimonial remarquable", "Site classé ou inscrit"],
  );
});
