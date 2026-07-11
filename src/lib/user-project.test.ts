import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProject, mergeProjectEdit, type UserProject } from "./user-project.ts";

const PARSED = { reformulation: "Vous cherchez une ville au calme, proche de la mer." } as never;

test("normalize : objet valide conservé", () => {
  const raw = { posture: "recherche", intent: null, rawText: "au calme près de la mer", parsed: PARSED, updatedAt: "2026-07-11T00:00:00.000Z" };
  const out = normalizeUserProject(raw);
  assert.equal(out?.posture, "recherche");
  assert.equal(out?.rawText, "au calme près de la mer");
  assert.ok(out?.parsed);
});

test("normalize : les quatre postures acceptées", () => {
  for (const posture of ["recherche", "adresse", "habitant", "recherche_quartier"]) {
    const out = normalizeUserProject({ posture, rawText: "x", parsed: null, updatedAt: "2026-07-11T00:00:00.000Z" });
    assert.equal(out?.posture, posture, `posture ${posture}`);
  }
});

test("normalize : posture inconnue -> null", () => {
  assert.equal(normalizeUserProject({ posture: "autre", rawText: "x", parsed: null, updatedAt: "z" }), null);
});

test("normalize : parsed malformé -> parsed null mais rawText gardé", () => {
  const out = normalizeUserProject({ posture: "recherche", rawText: "gardé", parsed: 42, updatedAt: "2026-07-11T00:00:00.000Z" });
  assert.equal(out?.parsed, null);
  assert.equal(out?.rawText, "gardé");
});

test("normalize : null / undefined / non-objet -> null", () => {
  assert.equal(normalizeUserProject(null), null);
  assert.equal(normalizeUserProject(undefined), null);
  assert.equal(normalizeUserProject("x"), null);
});

test("normalize : rawText absent -> null (rawText), reste valide", () => {
  const out = normalizeUserProject({ posture: "recherche", parsed: PARSED, updatedAt: "2026-07-11T00:00:00.000Z" });
  assert.equal(out?.rawText, null);
  assert.ok(out?.parsed);
});

test("merge : conserve posture/intent, réécrit rawText/parsed/updatedAt", () => {
  const prev: UserProject = { posture: "adresse", intent: "achat", rawText: "vieux", parsed: null, updatedAt: "2026-01-01T00:00:00.000Z" };
  const out = mergeProjectEdit(prev, { rawText: "neuf", parsed: PARSED });
  assert.equal(out.posture, "adresse");
  assert.equal(out.intent, "achat");
  assert.equal(out.rawText, "neuf");
  assert.ok(out.parsed);
  assert.notEqual(out.updatedAt, prev.updatedAt);
});

test("merge : prev null -> projet posture recherche par défaut", () => {
  const out = mergeProjectEdit(null, { rawText: "neuf", parsed: PARSED });
  assert.equal(out.posture, "recherche");
  assert.equal(out.rawText, "neuf");
});

test("merge : posture/intent explicites priment sur prev", () => {
  const prev: UserProject = { posture: "recherche", rawText: "x", parsed: null, updatedAt: "z" };
  const out = mergeProjectEdit(prev, { rawText: "y", parsed: null, posture: "adresse", intent: "location" });
  assert.equal(out.posture, "adresse");
  assert.equal(out.intent, "location");
});
