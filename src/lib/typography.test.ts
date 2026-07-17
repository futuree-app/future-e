// Élision devant nom de commune : « de Antibes » est une faute (« d'Antibes »).
// Doctrine (cf. fact-compositions) : seul le cas voyelle est tranché sans ambiguïté ;
// les h (Honfleur) et les articles (Le Havre) restent en « de ».
import { test } from "node:test";
import assert from "node:assert/strict";
import { deCommune } from "./typography.ts";

test("deCommune : élision devant voyelle simple", () => {
  assert.equal(deCommune("Antibes"), "d'Antibes");
  assert.equal(deCommune("Orléans"), "d'Orléans");
  assert.equal(deCommune("Ustaritz"), "d'Ustaritz");
  assert.equal(deCommune("Yzeure"), "d'Yzeure");
});

test("deCommune : élision devant voyelle accentuée majuscule", () => {
  assert.equal(deCommune("Étampes"), "d'Étampes");
  assert.equal(deCommune("Èvres"), "d'Èvres");
  assert.equal(deCommune("Île-de-Bréhat"), "d'Île-de-Bréhat");
  assert.equal(deCommune("Œting"), "d'Œting");
});

test("deCommune : consonne, h et article restent en « de »", () => {
  assert.equal(deCommune("Gouesnou"), "de Gouesnou");
  assert.equal(deCommune("Honfleur"), "de Honfleur");
  assert.equal(deCommune("Le Havre"), "de Le Havre");
  assert.equal(deCommune("Saint-Cirq-Lapopie"), "de Saint-Cirq-Lapopie");
});
