import test from "node:test";
import assert from "node:assert/strict";
import { assembleSnapshot } from "./logement-autour.ts";

const center = { lat: 48.85, lon: 2.35 };
const bpe = [{ category: "sante" as const, nearest: { distanceMeters: 420 }, searchCapMeters: 3000 }];

test("osm pending -> statuts osm pending, bpe complete, osm vide", () => {
  const s = assembleSnapshot(center, bpe, null, "pending");
  assert.equal(s.sourceStatus.bpe, "complete");
  assert.equal(s.sourceStatus.osmInfrastructure, "pending");
  assert.equal(s.sourceStatus.osmGreenSpaces, "pending");
  assert.equal(s.osm.potentiallyNoisyInfrastructure.length, 0);
  assert.equal(s.sources.osmFetchedAt, null);
});

test("osm complete -> osm porté + osmFetchedAt renseigné", () => {
  const osm = { potentiallyNoisyInfrastructure: [{ type: "railway" as const, distanceMeters: 180 }], nearestMappedGreenSpace: { distanceMeters: 320 }, bboxRadiusMeters: 1500 };
  const s = assembleSnapshot(center, bpe, osm, "complete");
  assert.equal(s.sourceStatus.osmInfrastructure, "complete");
  assert.equal(s.osm.potentiallyNoisyInfrastructure[0].distanceMeters, 180);
  assert.ok(s.sources.osmFetchedAt);
});
