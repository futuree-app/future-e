// Élision devant nom de commune : « de Antibes » est une faute (« d'Antibes »).
// Doctrine (cf. fact-compositions) : seul le cas voyelle est tranché sans ambiguïté ;
// les h (Honfleur) et les articles (Le Havre) restent en « de ».
import { test } from "node:test";
import assert from "node:assert/strict";
import { deCommune, aCommune } from "./typography.ts";

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

test("aCommune : contraction avec l'article défini masculin", () => {
  assert.equal(aCommune("Le Havre"), "au Havre");
  assert.equal(aCommune("Le Mans"), "au Mans");
  assert.equal(aCommune("Le Touquet-Paris-Plage"), "au Touquet-Paris-Plage");
});

test("aCommune : contraction avec l'article défini pluriel", () => {
  assert.equal(aCommune("Les Sables-d'Olonne"), "aux Sables-d'Olonne");
  assert.equal(aCommune("Les Herbiers"), "aux Herbiers");
});

test("aCommune : l'article féminin et l'article élidé ne se contractent pas", () => {
  assert.equal(aCommune("La Rochelle"), "à La Rochelle");
  assert.equal(aCommune("La Baule-Escoublac"), "à La Baule-Escoublac");
  assert.equal(aCommune("L'Haÿ-les-Roses"), "à L'Haÿ-les-Roses");
  assert.equal(aCommune("L'Île-Rousse"), "à L'Île-Rousse");
});

test("aCommune : « à » ne s'élide pas devant une voyelle", () => {
  assert.equal(aCommune("Antibes"), "à Antibes");
  assert.equal(aCommune("Orléans"), "à Orléans");
  assert.equal(aCommune("Toulouse"), "à Toulouse");
});

test("aCommune : un nom qui commence par les mêmes lettres reste intact", () => {
  assert.equal(aCommune("Lespinasse"), "à Lespinasse");
  assert.equal(aCommune("Lehaucourt"), "à Lehaucourt");
});
