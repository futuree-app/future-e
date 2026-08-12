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

// ── L'UNICITÉ DES CLÉS DE PRÉFÉRENCE (revue du 12/08/2026) ────────────────────────────────────
//
// Le moteur lit un poids par `find` (`preferenceWeight`) : sur deux entrées de même clé, il applique
// la PREMIÈRE et ignore la seconde. Rien n'imposait pourtant l'unicité, si bien qu'un projet
// enregistré pouvait porter un poids que le moteur n'appliquerait jamais, et que deux projets de
// décisions différentes signaient pareil (`signatureDecisionnelle` trie les couples clé:poids).

test("une clé de préférence en double est ramenée à la PREMIÈRE occurrence", () => {
  const avecDoublon = {
    posture: "recherche", intent: null, rawText: "x",
    parsed: {
      reformulation: "Vous cherchez la fraîcheur.",
      preferences: [{ key: "faible_chaleur", weight: 1 }, { key: "faible_chaleur", weight: 3 }],
    },
  };
  const out = normalizeUserProjectInput(avecDoublon);
  assert.deepEqual(out?.parsed?.preferences, [{ key: "faible_chaleur", weight: 1 }],
    "la persistance doit enregistrer ce que le moteur applique, pas davantage");

  // L'ORDRE INVERSE DONNE UN AUTRE PROJET, et c'est le point : le moteur passe de 1 à 3.
  const inverse = normalizeUserProjectInput({
    ...avecDoublon,
    parsed: {
      reformulation: "Vous cherchez la fraîcheur.",
      preferences: [{ key: "faible_chaleur", weight: 3 }, { key: "faible_chaleur", weight: 1 }],
    },
  });
  assert.deepEqual(inverse?.parsed?.preferences, [{ key: "faible_chaleur", weight: 3 }]);

  // La lecture d'un projet DÉJÀ en base, écrit avant cette règle, est canonisée pareil.
  const relu = normalizeUserProject({ ...avecDoublon, updatedAt: "2026-08-01T00:00:00.000Z" });
  assert.deepEqual(relu?.parsed?.preferences, [{ key: "faible_chaleur", weight: 1 }]);
});
