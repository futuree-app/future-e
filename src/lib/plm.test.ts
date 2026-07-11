import test from "node:test";
import assert from "node:assert/strict";
import { communeParent } from "./plm.ts";

test("Paris : arrondissements 751xx -> 75056", () => {
  assert.equal(communeParent("75101"), "75056");
  assert.equal(communeParent("75120"), "75056");
  assert.equal(communeParent("75056"), "75056"); // déjà la commune
});

test("Lyon : 693xx -> 69123", () => {
  assert.equal(communeParent("69381"), "69123");
  assert.equal(communeParent("69389"), "69123");
});

test("Marseille : 132xx -> 13055", () => {
  assert.equal(communeParent("13201"), "13055");
  assert.equal(communeParent("13216"), "13055");
});

test("commune ordinaire inchangée", () => {
  assert.equal(communeParent("31555"), "31555"); // Toulouse
  assert.equal(communeParent("17300"), "17300"); // La Rochelle
});

test("hors plage PLM inchangé", () => {
  assert.equal(communeParent("75012"), "75012"); // pas un arrondissement (751xx only)
  assert.equal(communeParent("13100"), "13100");
  assert.equal(communeParent(null), null);
  assert.equal(communeParent(""), "");
});
