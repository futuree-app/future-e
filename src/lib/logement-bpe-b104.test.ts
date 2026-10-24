import test from "node:test";
import assert from "node:assert/strict";
import { loadBpePointsAround, nearestByCategory } from "./logement-bpe.ts";

test("FUT-99 : cas réel Sautel, plus proche et comptage des lieux intégrés", async () => {
  // Point BPE au 163 boulevard André-Sautel, pas une entrée vérifiée.
  const center = { lat: 46.17078, lon: -1.12522 };
  const { points, millesime } = await loadBpePointsAround(center);
  assert.equal(millesime, "2025");
  const before = nearestByCategory(center, points.filter(p => p.t !== "B104"))
    .find(p => p.category === "alimentation")!;
  const after = nearestByCategory(center, points).find(p => p.category === "alimentation")!;
  assert.equal(before.nearest?.distanceMeters, 264);
  assert.equal(before.withinWalkCount, 2);
  assert.equal(after.nearest?.typeLabel, "Hypermarché (magasin ou drive)");
  assert.equal(after.nearest?.distanceMeters, 210);
  assert.equal(after.nearest?.identifiant, "31623898900016");
  assert.equal(after.withinWalkCount, 3);
  assert.deepEqual(after.nearestByType?.B105, before.nearestByType?.B105);
  assert.equal(after.nearestByType?.B105?.distanceMeters, 709);
});

test("FUT-99 : plusieurs exploitants B104 ne comptent qu'un lieu", () => {
  const [result] = nearestByCategory({lat:46, lon:0}, [
    {c:"alimentation", t:"B104", lat:46.001, lon:0, x:2, s:[{n:"A"},{n:"B"}]},
    {c:"alimentation", t:"B105", lat:46.002, lon:0},
  ]).filter(p => p.category === "alimentation");
  assert.equal(result!.withinWalkCount, 2);
  assert.equal(result!.nearest?.exploitants, 2);
  assert.equal(result!.nearest?.nom, undefined);
});
