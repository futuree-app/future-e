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

test("sizeRelativeTo (FUT-109) : le millésime suit la référence, jamais 2021 présumé pour toute la France", () => {
  const saintDenis: DirectoryEntry = { insee: "93066", nom: "Saint-Denis", lat: 48.94, lon: 2.36, uu: "00851", tailleVille: 10_893_507, population: 149_077 };
  const lOie: DirectoryEntry = { insee: "85165", nom: "L'Oie", lat: 46.78, lon: -1.12, uu: null, tailleVille: 1_250, population: 1_250 };
  const d: PlaceDirectory = { byName: (l) => ({ "saint denis": saintDenis, "l oie": lOie })[l] ?? null, plmByName: () => null };
  const sd = resolveSizeReference("Saint-Denis", d, { context: "" });
  assert.ok(sd.status === "resolved");
  // Saint-Denis, fusionnée le 01/01/2025 : population de référence 2023 ; son agglomération (Paris) mêle 2021 et 2023.
  assert.deepEqual([sd.communePopulationYear, sd.populationYears, sd.populationYear], [2023, [2021, 2023], 2023]);
  const o = resolveSizeReference("L'Oie", d, { context: "" });
  assert.ok(o.status === "resolved");
  assert.deepEqual([o.communePopulationYear, o.populationYears], [2023, [2023]]);
  const b = resolveSizeReference("Brest", dir, { context: "" });
  assert.ok(b.status === "resolved");
  assert.deepEqual([b.communePopulationYear, b.populationYears], [2021, [2021]]);
});

test("inputHash : change quand le LABEL change (« Matabiau » ne peut pas garder les coords de « Saint-Jean »)", () => {
  const a = resolutionInputHash("Gare Matabiau", "31", "place");
  const b = resolutionInputHash("Gare Saint-Jean", "31", "place");
  assert.notEqual(a, b);
});

test("inputHash : change quand le CONTEXTE territorial change", () => {
  assert.notEqual(resolutionInputHash("Saint-Jean", "31", "place"), resolutionInputHash("Saint-Jean", "33", "place"));
});
