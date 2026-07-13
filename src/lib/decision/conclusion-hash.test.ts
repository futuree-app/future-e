import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionHash, hashPayload } from "./conclusion-hash.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
import { stableStringify } from "../stable-stringify.ts";
import { sha256Hex } from "../server/sha256.ts";

function plan(over: Partial<ConclusionNarrativePlan> = {}): ConclusionNarrativePlan {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    reservesCount: 2,
    lead: { kind: "none" },
    blocks: [{
      key: "verdict",
      fallbackText: "Aucune contrainte n'est contredite.",
      sourceIds: [], requiredPhrases: [], maxChars: 320, generable: false,
    }],
    ...over,
  };
}

test("le hash est déterministe et hexadécimal", () => {
  assert.equal(buildConclusionHash(plan()), buildConclusionHash(plan()));
  assert.match(buildConclusionHash(plan()), /^[0-9a-f]{64}$/);
});

test("un plan différent donne un hash différent", () => {
  assert.notEqual(buildConclusionHash(plan()), buildConclusionHash(plan({ reservesCount: 3 })));
});

test("modèle changé -> hash différent", () => {
  const a = sha256Hex(stableStringify(hashPayload(plan(), { model: "claude-sonnet-4-6" })));
  const b = sha256Hex(stableStringify(hashPayload(plan(), { model: "autre-modele" })));
  assert.notEqual(a, b);
});

test("prompt changé -> hash différent", () => {
  const a = sha256Hex(stableStringify(hashPayload(plan(), { promptVersion: "v1" })));
  const b = sha256Hex(stableStringify(hashPayload(plan(), { promptVersion: "v2" })));
  assert.notEqual(a, b);
});

test("contrat changé -> hash différent (le schéma de sortie a bougé, le prompt non)", () => {
  const a = sha256Hex(stableStringify(hashPayload(plan(), { contractVersion: "c1" })));
  const b = sha256Hex(stableStringify(hashPayload(plan(), { contractVersion: "c2" })));
  assert.notEqual(a, b);
});

test("les versions sont DANS la matière hachée, pas concaténées après", () => {
  const payload = hashPayload(plan(), {});
  assert.ok("promptVersion" in payload && "model" in payload && "contractVersion" in payload && "plan" in payload);
});
