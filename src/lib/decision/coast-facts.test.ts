import test from "node:test";
import assert from "node:assert/strict";
import { classifyCoastDistance, COAST_PROXIMITY_CONVENTION } from "./coast-facts.ts";

test("convention coast-proximity-v1 : seuils gravés", () => {
  assert.equal(COAST_PROXIMITY_CONVENTION.id, "coast-proximity-v1");
  assert.equal(COAST_PROXIMITY_CONVENTION.satisfiedMaxKm, 15);
  assert.equal(COAST_PROXIMITY_CONVENTION.mismatchMinKm, 100);
});

test("proche (<= 15) -> satisfied ; borne fermée à 15", () => {
  assert.equal(classifyCoastDistance(3), "satisfied");
  assert.equal(classifyCoastDistance(15), "satisfied");
});

test("intermédiaire (15 < d < 100) -> neutral", () => {
  assert.equal(classifyCoastDistance(16), "neutral");
  assert.equal(classifyCoastDistance(99), "neutral");
});

test("loin (>= 100) -> mismatch ; borne fermée à 100", () => {
  assert.equal(classifyCoastDistance(100), "mismatch");
  assert.equal(classifyCoastDistance(240), "mismatch");
});

test("donnée absente ou corrompue -> uncertain, jamais un verdict", () => {
  assert.equal(classifyCoastDistance(null), "uncertain");
  assert.equal(classifyCoastDistance(Number.NaN), "uncertain");
  assert.equal(classifyCoastDistance(Number.POSITIVE_INFINITY), "uncertain");
  assert.equal(classifyCoastDistance(-5), "uncertain");
});

test("la classification se fait sur la valeur EXACTE, avant tout arrondi (bornes décimales)", () => {
  assert.equal(classifyCoastDistance(15.001), "neutral");   // > 15, pas satisfied
  assert.equal(classifyCoastDistance(99.999), "neutral");   // < 100, pas mismatch
  assert.equal(classifyCoastDistance(100), "mismatch");
});
