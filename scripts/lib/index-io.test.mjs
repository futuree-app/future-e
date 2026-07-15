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
