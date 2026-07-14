import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveNearPlace, resolveUrbanArea, resolveSizeReference, resolutionInputHash,
  type PlaceDirectory, type DirectoryEntry,
} from "./hard-constraints-resolve.ts";

const BREST: DirectoryEntry = { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 210_000 };
const LYON: DirectoryEntry = { insee: "69123", nom: "Lyon", lat: 45.75, lon: 4.85, uu: "00760", tailleVille: 1_600_000 };

const dir: PlaceDirectory = {
  byName: (label) => {
    const k = label.trim().toLowerCase();
    if (k === "brest") return BREST;
    if (k === "lyon") return LYON;
    return null;
  },
  plmByName: (label) => (label.trim().toLowerCase() === "lyon" ? { uu: "00760", pop: 522_250 } : null),
};

test("nearPlace : un nom de commune se résout, avec sa provenance", () => {
  const r = resolveNearPlace("Brest", dir, { context: "" });
  assert.equal(r.status, "resolved");
  assert.ok(r.status === "resolved");
  assert.equal(r.kind, "commune");
  assert.equal(r.source, "commune_index");
  assert.equal(r.lat, 48.39);
  assert.equal(r.confidence, "exact");
});

test("nearPlace : « Gare Matabiau » N'EST PAS une commune -> unresolved (lot 1 : jamais deviné)", () => {
  const r = resolveNearPlace("Gare Matabiau", dir, { context: "" });
  assert.ok(r.status === "unresolved");
  assert.equal(r.reason, "no_result");
});

test("excludePlace : PLM -> le territoire normalisé est l'unité urbaine parente, et l'INSEE n'est pas vide", () => {
  const r = resolveUrbanArea("Lyon", dir, { context: "" });
  assert.ok(r.status === "resolved");
  assert.equal(r.urbanUnitCode, "00760");
  assert.equal(r.normalizedTerritoryCode, "uu:00760");
  assert.equal(r.source, "plm_table");
  assert.equal(r.referenceCommuneInsee, "69123"); // jamais une chaîne vide dans un champ requis
});

test("excludePlace : une ville inconnue reste unresolved (elle bloquera l'évaluation, elle ne disparaîtra pas)", () => {
  const r = resolveUrbanArea("Saint-Jean-de-Machin", dir, { context: "" });
  assert.ok(r.status === "unresolved");
});

test("sizeRelativeTo : la population de référence est celle de l'AGGLOMÉRATION, avec son année", () => {
  const r = resolveSizeReference("Brest", dir, { context: "" });
  assert.ok(r.status === "resolved");
  assert.equal(r.comparisonPopulation, 210_000);
  assert.equal(r.populationKind, "urban_unit");
  assert.equal(r.populationYear, 2021);
});

test("inputHash : change quand le LABEL change (« Matabiau » ne peut pas garder les coords de « Saint-Jean »)", () => {
  const a = resolutionInputHash("Gare Matabiau", "31", "place");
  const b = resolutionInputHash("Gare Saint-Jean", "31", "place");
  assert.notEqual(a, b);
});

test("inputHash : change quand le CONTEXTE territorial change", () => {
  assert.notEqual(resolutionInputHash("Saint-Jean", "31", "place"), resolutionInputHash("Saint-Jean", "33", "place"));
});
