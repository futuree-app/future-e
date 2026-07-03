import test from "node:test";
import assert from "node:assert/strict";
import { needsRecompute, SOURCES_VERSION } from "./logement-store.ts";
import type { Face3Snapshot } from "./logement-autour-types.ts";

const center = { lat: 48.85, lon: 2.35 };
const okSnap = {
  center,
  bpe: { categories: [] },
  osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
  sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
  sources: { bpeVersion: "x", osmFetchedAt: null, osmQueryVersion: "y" },
  sourcesVersion: SOURCES_VERSION,
  computedAt: "2026-07-03T00:00:00.000Z",
} satisfies Face3Snapshot;

test("pas de snapshot -> recompute", () => {
  assert.equal(needsRecompute(null, center, SOURCES_VERSION), true);
});
test("snapshot d'une autre position -> recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, { lat: 43.6, lon: 1.44 }, SOURCES_VERSION), true);
});
test("version antérieure -> recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, center, "v999"), true);
});
test("même position + même version -> pas de recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, center, SOURCES_VERSION), false);
});
