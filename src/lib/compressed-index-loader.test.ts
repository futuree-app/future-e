import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createCompressedIndexLoader } from "./compressed-index-loader.ts";

function writeGz(obj: unknown): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "cil-"));
  const p = path.join(d, "idx.json.gz");
  fs.writeFileSync(p, zlib.gzipSync(Buffer.from(JSON.stringify(obj))));
  return p;
}

test("charge et décompresse une seule fois sous appels concurrents ; afterLoad 1x", async () => {
  const gz = writeGz({ meta: {}, communes: [{ insee: "01001" }, { insee: "01002" }] });
  let afterCalls = 0;
  const load = createCompressedIndexLoader(gz, () => { afterCalls++; });
  const [a, b, c] = await Promise.all([load(), load(), load()]);
  assert.equal(afterCalls, 1);
  assert.equal(a.length, 2);
  assert.equal(b, a);
  assert.equal(c, a);
});

test("rejette une racine invalide", async () => {
  const gz = writeGz({ meta: {} });
  const load = createCompressedIndexLoader(gz);
  await assert.rejects(load(), /communes/);
});

test("mémoïse le rejet (fichier absent) : afterLoad jamais atteint, pas de retry", async () => {
  let afterCalls = 0;
  const load = createCompressedIndexLoader("/inexistant/idx.json.gz", () => { afterCalls++; });
  await assert.rejects(load());
  await assert.rejects(load());
  assert.equal(afterCalls, 0);
});
