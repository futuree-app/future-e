import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProjectInput, normalizeUserProject, stampUserProject } from "./user-project.ts";

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

test("input : posture absente -> null (jamais de défaut)", () => {
  assert.equal(normalizeUserProjectInput({ rawText: "x", parsed: null }), null);
});

test("input : intent invalide -> rejet (jamais coercition)", () => {
  assert.equal(normalizeUserProjectInput({ posture: "recherche", intent: "peut-etre", rawText: "x", parsed: null }), null);
});

test("input : intent absent/null accepté", () => {
  assert.equal(normalizeUserProjectInput({ posture: "recherche", rawText: "x", parsed: null })?.intent, null);
});

test("input : rawText seul persistable, parsed null", () => {
  const out = normalizeUserProjectInput({ posture: "recherche", rawText: "au calme", parsed: null });
  assert.equal(out?.rawText, "au calme");
  assert.equal(out?.parsed, null);
});

test("stamp : le serveur pose schemaVersion et updatedAt", () => {
  const out = stampUserProject({ posture: "recherche", intent: null, rawText: "x", parsed: null }, "2026-07-11T10:00:00.000Z");
  assert.equal(out.schemaVersion, 1);
  assert.equal(out.updatedAt, "2026-07-11T10:00:00.000Z");
});

test("read : updatedAt absent -> null (jamais 1970)", () => {
  const out = normalizeUserProject({ posture: "recherche", rawText: "x", parsed: null });
  assert.equal(out?.updatedAt, null);
});
