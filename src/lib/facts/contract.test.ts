// FUT-6 : le contrat générique Fact → DerivedFact → FactsSnapshot.
import test from "node:test";
import assert from "node:assert/strict";
import { registryGaps, synthesisFacts, type FactsSnapshot } from "./contract.ts";
import { snapshotHash } from "./hash.ts";

const base = (): FactsSnapshot => ({
  scope: { kind: "commune", id: "00000" },
  registryVersion: "test@1",
  builtAt: "2026-09-28T00:00:00.000Z",
  facts: [
    {
      key: "a", value: 1, unit: null, scale: "commune", vintage: null, observedAt: "2026-09-28T01:00:00.000Z", status: "ok",
      source: { producer: "p", dataset: "d", field: "f" }, card: { card: "c" }, synthesis: { include: true },
    },
    {
      key: "b", value: 2, unit: null, scale: "commune", vintage: null, observedAt: null, status: "ok",
      source: { producer: "p", dataset: "d", field: "f" },
      card: { noCard: { reason: "context_only", note: "situe" } }, synthesis: { include: false, reason: "hors sujet" },
    },
  ],
  derived: [],
});

test("empreinte : ni builtAt ni observedAt n'y entrent", () => {
  const a = base();
  const b = base();
  b.builtAt = "2030-01-01T00:00:00.000Z";
  b.facts[0].observedAt = "2030-01-01T00:00:00.000Z";
  assert.equal(snapshotHash(a), snapshotHash(b));
});

test("empreinte : un champ `undefined` venu d'une source ne casse rien et n'en change pas la valeur", () => {
  const a = base();
  const b = base();
  b.facts[0].value = { x: 1, y: undefined } as unknown as number;
  a.facts[0].value = { x: 1 } as unknown as number;
  assert.equal(snapshotHash(a), snapshotHash(b));
});

test("projection : seuls les faits `include` et `ok` passent", () => {
  assert.deepEqual(synthesisFacts(base()).facts.map((f) => f.key), ["a"]);
});

test("registre : un fait sans carte ou exclu SANS raison est signalé", () => {
  const s = base();
  s.facts[1].card = { noCard: { reason: "other", note: " " } };
  s.facts[1].synthesis = { include: false, reason: "" };
  assert.equal(registryGaps(s).length, 2);
});
