import test from "node:test";
import assert from "node:assert/strict";
import { classifyNetworkAbsence, classifyHigherEdAbsence, ABSENCE_NATIONAL_CONTEXT } from "./absence-facts.ts";

test("réseau : mesuré sous plancher -> mismatch ; présent -> neutral ; non mesuré -> uncertain", () => {
  assert.equal(classifyNetworkAbsence({ measured: true, access: null }), "mismatch");
  assert.equal(classifyNetworkAbsence({ measured: true, access: 42 }), "neutral");
  assert.equal(classifyNetworkAbsence({ measured: false, access: null }), "uncertain");
});
test("réseau : access corrompu -> uncertain (jamais neutral)", () => {
  assert.equal(classifyNetworkAbsence({ measured: true, access: Number.NaN }), "uncertain");
  assert.equal(classifyNetworkAbsence({ measured: true, access: -1 }), "uncertain");
  assert.equal(classifyNetworkAbsence({ measured: true, access: 101 }), "uncertain");
});
test("études : establishmentCount PRÉFÉRÉ quand présent (airtight)", () => {
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: 0, radiusKm: 25, establishmentCount: 1 }), "neutral"); // count>0 gagne sur wa==0
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: 3.4, radiusKm: 10, establishmentCount: 0 }), "mismatch"); // count==0 gagne
});
test("études : repli sur weightedAccess quand establishmentCount absent", () => {
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: 0, radiusKm: 25, establishmentCount: null }), "mismatch");
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: 2.7, radiusKm: 15, establishmentCount: null }), "neutral");
});
test("études : non mesuré / valeurs corrompues -> uncertain", () => {
  assert.equal(classifyHigherEdAbsence({ measured: false }), "uncertain");
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: Number.NaN, radiusKm: 25, establishmentCount: null }), "uncertain");
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: 0, radiusKm: 0, establishmentCount: null }), "uncertain"); // rayon nul
  assert.equal(classifyHigherEdAbsence({ measured: true, weightedAccess: 1, radiusKm: 25, establishmentCount: -1 }), "uncertain");
});
test("le contexte national est daté et dissocié des conventions", () => {
  assert.equal(ABSENCE_NATIONAL_CONTEXT.network!.distributionVersion, "absence-dist-2026-07-15");
  assert.ok(ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence > 0.3 && ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence < 0.5);
});

test("DÉFENSIF : attestation undefined -> uncertain (jamais un crash ni une absence inventée)", () => {
  assert.equal(classifyNetworkAbsence(undefined as never), "uncertain");
  assert.equal(classifyHigherEdAbsence(undefined as never), "uncertain");
});
