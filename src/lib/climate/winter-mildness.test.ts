import test from "node:test";
import assert from "node:assert/strict";
import { winterMildnessScore, WINTER_MILDNESS_CONVENTION } from "./winter-mildness.ts";

test("convention winter-mildness-v1 gravée (référence 1976-2005)", () => {
  assert.equal(WINTER_MILDNESS_CONVENTION.id, "winter-mildness-v1");
  assert.equal(WINTER_MILDNESS_CONVENTION.indicator, "NORTMm_seas_DJF");
  assert.equal(WINTER_MILDNESS_CONVENTION.referencePeriod, "1976-2005");
});

test("winterMildnessScore : monotone (retourne le percentile), gardes strictes, aucun repli", () => {
  assert.equal(winterMildnessScore(0), 0);
  assert.equal(winterMildnessScore(50), 50);
  assert.equal(winterMildnessScore(100), 100);
  assert.equal(winterMildnessScore(null), null);
  assert.equal(winterMildnessScore(undefined), null);
  assert.equal(winterMildnessScore(Number.NaN), null);
  assert.equal(winterMildnessScore(-1), null);
  assert.equal(winterMildnessScore(101), null);
});
