import test from "node:test";
import assert from "node:assert/strict";
import { departementFromInsee } from "./insee-departement.ts";

test("métropole : les deux premiers caractères", () => {
  assert.equal(departementFromInsee("31555"), "31"); // Toulouse
  assert.equal(departementFromInsee("75056"), "75");
});

test("Corse : 2A et 2B, jamais « 20 »", () => {
  assert.equal(departementFromInsee("2A004"), "2A");
  assert.equal(departementFromInsee("2B033"), "2B");
});

test("DOM : trois chiffres", () => {
  assert.equal(departementFromInsee("97411"), "974"); // La Réunion
  assert.equal(departementFromInsee("97105"), "971"); // Guadeloupe
});

test("code invalide : null, jamais une supposition", () => {
  assert.equal(departementFromInsee(""), null);
  assert.equal(departementFromInsee("31"), null); // trop court pour être un code commune
  assert.equal(departementFromInsee("abcde"), null);
});
