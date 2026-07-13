import { test } from "node:test";
import assert from "node:assert/strict";
import { stableStringify } from "./stable-stringify.ts";

test("l'ordre d'insertion des clés ne change pas la sortie", () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }),
    stableStringify({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 }),
  );
});

test("l'ordre d'un tableau est signifiant (il est conservé)", () => {
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});

test("null est sérialisé, undefined est REFUSÉ (deux valeurs distinctes ne peuvent pas partager une identité)", () => {
  assert.equal(stableStringify({ a: null }), '{"a":null}');
  assert.throws(() => stableStringify(undefined), TypeError);
  assert.throws(() => stableStringify({ a: undefined }), TypeError);
});

test("une fonction ou un symbole est refusé (non sérialisable, donc non identifiable)", () => {
  assert.throws(() => stableStringify({ a: () => 1 }), TypeError);
});
