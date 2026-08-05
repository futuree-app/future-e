import test from "node:test";
import assert from "node:assert/strict";
import {
  construireEchelle,
  rangDe,
  partSuperieure,
  phraseDePosition,
} from "./rang-national.ts";

test("l'échelle est triée et ignore les valeurs non finies", () => {
  const e = construireEchelle([3, 1, Number.NaN, 2, Number.POSITIVE_INFINITY]);
  assert.equal(e.length, 3);
  assert.deepEqual([...e], [1, 2, 3]);
});

test("la valeur la plus haute est au rang 1, la plus basse au rang total", () => {
  const e = construireEchelle([1, 2, 3, 4]);
  assert.equal(rangDe(e, 4)!.rang, 1);
  assert.equal(rangDe(e, 1)!.rang, 4);
});

test("le percentile est ascendant : haut = valeur élevée", () => {
  const e = construireEchelle([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  assert.ok(rangDe(e, 90)!.percentile > rangDe(e, 0)!.percentile);
  assert.equal(rangDe(e, 90)!.percentile, 95); // midrank du dernier : (9 + 10) / 2 / 10
});

// LE CAS QUI MOTIVE LE MIDRANK. Les indicateurs DRIAS sont des entiers avec de larges plateaux :
// des milliers de communes partagent « 3 nuits chaudes ». Compter les strictement inférieures les
// placerait toutes au bas de leur plateau (percentile 10 ici), compter les inférieures ou égales
// les placerait toutes en haut (percentile 90). Les deux mentent, et d'autant plus que le plateau
// est peuplé — c'est-à-dire là où il y a le plus de lecteurs.
test("un plateau d'ex æquo lit la position du plateau, pas un de ses bords", () => {
  const e = construireEchelle([1, ...Array(8).fill(3), 5]);
  const r = rangDe(e, 3)!;
  assert.equal(r.percentile, 50);
  assert.ok(r.percentile > 10 && r.percentile < 90);
});

test("toutes les communes d'un plateau partagent le même rang", () => {
  const e = construireEchelle([1, 3, 3, 3, 5]);
  assert.equal(rangDe(e, 3)!.rang, rangDe(e, 3)!.rang);
  assert.equal(rangDe(e, 3)!.rang, 3);
});

test("échelle vide ou valeur non finie : null, jamais un zéro", () => {
  assert.equal(rangDe(construireEchelle([]), 5), null);
  assert.equal(rangDe(construireEchelle([1, 2]), Number.NaN), null);
});

test("le total est le nombre de communes réellement comparées", () => {
  const e = construireEchelle([1, 2, Number.NaN, 3]);
  assert.equal(rangDe(e, 2)!.total, 3);
});

// Un arrondi à 0 % dirait « aucune commune au-dessus », faux dès qu'il en existe une.
test("partSuperieure ne descend jamais à 0 %", () => {
  const e = construireEchelle(Array.from({ length: 10000 }, (_, i) => i));
  assert.equal(partSuperieure(rangDe(e, 9999)!), 1);
});

test("partSuperieure vaut 100 % au bas de l'échelle", () => {
  const e = construireEchelle(Array.from({ length: 100 }, (_, i) => i));
  assert.equal(partSuperieure(rangDe(e, 0)!), 100);
});

test("le haut de distribution produit la phrase « les plus exposées »", () => {
  const e = construireEchelle(Array.from({ length: 1000 }, (_, i) => i));
  const p = phraseDePosition(rangDe(e, 990));
  assert.match(p!, /les plus exposées/);
  assert.match(p!, /^Parmi les \d+ %/);
});

test("le bas de distribution produit la phrase « les moins exposées »", () => {
  const e = construireEchelle(Array.from({ length: 1000 }, (_, i) => i));
  assert.match(phraseDePosition(rangDe(e, 5))!, /les moins exposées/);
});

// Le silence est une information : une commune médiane n'apprend rien au lecteur, et l'écrire
// diluerait les mentions qui comptent.
test("le milieu de distribution ne produit AUCUNE phrase", () => {
  const e = construireEchelle(Array.from({ length: 1000 }, (_, i) => i));
  assert.equal(phraseDePosition(rangDe(e, 500)), null);
  assert.equal(phraseDePosition(rangDe(e, 400)), null);
  assert.equal(phraseDePosition(rangDe(e, 600)), null);
});

test("aucune phrase sans rang", () => {
  assert.equal(phraseDePosition(null), null);
});
