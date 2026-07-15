import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256, packJson, unpackGz, parseCommunes, assertIndexInvariants } from "./index-io.mjs";

const smallFixture = Buffer.from(JSON.stringify({
  meta: {},
  communes: [{ insee: "01001", nom: "A" }, { insee: "01002", nom: "B" }],
}));

test("round-trip pack -> unpack rend les octets d'origine", () => {
  assert.ok(unpackGz(packJson(smallFixture)).equals(smallFixture));
});

test("gzip déterministe : deux packs du même JSON -> même SHA-256", () => {
  assert.equal(sha256(packJson(smallFixture)), sha256(packJson(smallFixture)));
});

test("parseCommunes rejette une racine sans tableau communes", () => {
  assert.throws(() => parseCommunes(Buffer.from(JSON.stringify({ meta: {} }))), /communes/);
});

test("parseCommunes renvoie le tableau communes", () => {
  assert.equal(parseCommunes(smallFixture).length, 2);
});

test("invariants : rejette un code INSEE dupliqué", () => {
  const dup = [{ insee: "01001" }, { insee: "01001" }];
  assert.throws(() => assertIndexInvariants(dup, { minCount: 1, maxCount: 10 }), /dupliqué/);
});

test("invariants : rejette une commune sans code INSEE", () => {
  const bad = [{ insee: "01001" }, { nom: "sans insee" }];
  assert.throws(() => assertIndexInvariants(bad, { minCount: 1, maxCount: 10 }), /INSEE/);
});

test("invariants : rejette un effectif hors bornes (défaut 30000..40000)", () => {
  assert.throws(() => assertIndexInvariants([{ insee: "01001" }]), /effectif|communes/i);
});

test("invariants : accepte un index plausible", () => {
  const ok = [{ insee: "01001" }, { insee: "01002" }];
  assert.doesNotThrow(() => assertIndexInvariants(ok, { minCount: 1, maxCount: 10 }));
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { packFile, unpackFile, verifyIndex } from "./index-io.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "idx-io-"));
}
const bounds = { minCount: 1, maxCount: 10 };
const validIndex = JSON.stringify({ meta: {}, communes: [{ insee: "01001" }, { insee: "01002" }] });

test("packFile puis unpackFile : round-trip fichier identique", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.rmSync(jsonP);
  unpackFile(gzP, jsonP, bounds);
  assert.equal(fs.readFileSync(jsonP, "utf8"), validIndex);
});

test("packFile est déterministe : deuxième pack identique octet pour octet", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  const first = fs.readFileSync(gzP);
  packFile(jsonP, gzP, bounds);
  assert.ok(fs.readFileSync(gzP).equals(first));
});

test("packFile ne laisse aucun .tmp résiduel", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  assert.ok(fs.readdirSync(d).every((f) => !f.endsWith(".tmp")));
});

test("unpackFile refuse un canonique aux invariants violés (avant publication)", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  // gz d'un index à 2 communes, mais on exige minCount 100 -> doit refuser
  fs.writeFileSync(gzP, zlib.gzipSync(Buffer.from(validIndex)));
  assert.throws(() => unpackFile(gzP, jsonP, { minCount: 100, maxCount: 200 }), /effectif|communes/i);
  assert.ok(!fs.existsSync(jsonP)); // rien publié
});

test("verifyIndex : gz valide + JSON absent -> intégrité OK (pas de throw)", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.rmSync(jsonP);
  assert.doesNotThrow(() => verifyIndex(jsonP, gzP, bounds));
});

test("verifyIndex : JSON local divergent -> erreur demandant index:pack", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.writeFileSync(jsonP, validIndex.replace("01002", "09999"));
  assert.throws(() => verifyIndex(jsonP, gzP, bounds), /index:pack/);
});

test("verifyIndex : gz tronqué -> échec clair", () => {
  const d = tmpDir();
  const gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(gzP, Buffer.from([0x1f, 0x8b, 0x00, 0x00]));
  assert.throws(() => verifyIndex(path.join(d, "absent.json"), gzP, bounds));
});
