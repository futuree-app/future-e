import { test } from "node:test";
import assert from "node:assert/strict";
import { assertIndexWorktree } from "./require-index-worktree.mjs";

test("throw le message métier si le JSON de travail manque", () => {
  assert.throws(() => assertIndexWorktree("/chemin/inexistant/idx.json"), /index:unpack/);
});
