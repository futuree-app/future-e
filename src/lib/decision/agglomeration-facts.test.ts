import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAgglomerationSize, labelForCategory, categoryStatementFragment,
  AGGLOMERATION_SIZE_CONVENTION, AGGLOMERATION_CATEGORIES,
} from "./agglomeration-facts.ts";

test("convention agglomeration-size-v1 gravée + catégories", () => {
  assert.equal(AGGLOMERATION_SIZE_CONVENTION.id, "agglomeration-size-v1");
  assert.deepEqual([...AGGLOMERATION_CATEGORIES], ["village", "petite", "moyenne", "grande", "metropole"]);
});

test("classifie aux bornes exactes (fermées ; 500000 -> métropole)", () => {
  assert.equal(classifyAgglomerationSize(1_999), "village");
  assert.equal(classifyAgglomerationSize(2_000), "petite");
  assert.equal(classifyAgglomerationSize(24_999), "petite");
  assert.equal(classifyAgglomerationSize(25_000), "moyenne");
  assert.equal(classifyAgglomerationSize(99_999), "moyenne");
  assert.equal(classifyAgglomerationSize(100_000), "grande");
  assert.equal(classifyAgglomerationSize(499_999), "grande");
  assert.equal(classifyAgglomerationSize(500_000), "metropole");
  assert.equal(classifyAgglomerationSize(1_050_000), "metropole");
});

test("donnée absente ou corrompue -> uncertain", () => {
  assert.equal(classifyAgglomerationSize(null), "uncertain");
  assert.equal(classifyAgglomerationSize(Number.NaN), "uncertain");
  assert.equal(classifyAgglomerationSize(-5), "uncertain");
});

test("libellés dépendants de la source ('agglomération' + 'métropole' seulement en UU)", () => {
  assert.equal(labelForCategory("grande", "urban_unit"), "une grande agglomération");
  assert.equal(labelForCategory("grande", "commune"), "une grande ville");
  assert.equal(labelForCategory("petite", "urban_unit"), "une petite agglomération");
  assert.equal(labelForCategory("petite", "commune"), "une petite commune");
  assert.equal(labelForCategory("metropole", "urban_unit"), "une métropole");
  assert.equal(labelForCategory("metropole", "commune"), "une très grande ville");
  assert.equal(labelForCategory("village", "commune"), "un village");
  assert.equal(labelForCategory("moyenne", "urban_unit"), "une ville moyenne");
});

test("fragment de phrase : 'appartient à' (UU) vs 'est classée comme' (commune)", () => {
  const uu = categoryStatementFragment("Lyon", "metropole", "urban_unit");
  assert.match(uu, /Lyon appartient à une métropole/);
  // Un seul mot pour le périmètre UU face au lecteur : « agglomération », comme le héros et labelForCategory.
  // « unité urbaine » reste le terme de provenance (commentaires, source), jamais deux noms pour une mesure.
  assert.match(uu, /agglomération/);
  assert.doesNotMatch(uu, /unité urbaine/);
  const co = categoryStatementFragment("Petiville", "village", "commune");
  assert.match(co, /Petiville est classée comme un village/);
  assert.match(co, /population communale/);
  assert.doesNotMatch(co, /agglomération/);
});
