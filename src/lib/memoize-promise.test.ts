import { test } from "node:test";
import assert from "node:assert/strict";
import { memoizePromise } from "./memoize-promise.ts";

test("n'appelle fn qu'une fois sous appels concurrents", async () => {
  let calls = 0;
  const load = memoizePromise(async () => { calls++; await Promise.resolve(); return 42; });
  const [a, b, c] = await Promise.all([load(), load(), load()]);
  assert.equal(calls, 1);
  assert.deepEqual([a, b, c], [42, 42, 42]);
});

test("mémoïse le rejet : pas de retry après un premier échec", async () => {
  let calls = 0;
  const load = memoizePromise(async () => { calls++; throw new Error("boom"); });
  await assert.rejects(load(), /boom/);
  await assert.rejects(load(), /boom/);
  assert.equal(calls, 1);
});
