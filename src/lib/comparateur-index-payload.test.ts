import { test } from "node:test";
import assert from "node:assert/strict";
import { communesFromPayload } from "./comparateur-index-payload.ts";

test("renvoie le tableau communes d'un payload valide", () => {
  const communes = communesFromPayload(JSON.stringify({ meta: {}, communes: [{ insee: "01001" }] }));
  assert.equal(communes.length, 1);
  assert.equal(communes[0].insee, "01001");
});

test("throw si la racine n'a pas de tableau communes", () => {
  assert.throws(() => communesFromPayload(JSON.stringify({ meta: {} })), /communes/);
});

test("throw sur JSON invalide", () => {
  assert.throws(() => communesFromPayload("{pas du json"));
});
