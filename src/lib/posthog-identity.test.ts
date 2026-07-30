import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeDistinctId } from "./posthog-identity.ts";

test("garde un identifiant PostHog plausible", () => {
  assert.equal(
    sanitizeDistinctId("0197f3a2-1b2c-7000-8000-abcdef012345", "repli"),
    "0197f3a2-1b2c-7000-8000-abcdef012345",
  );
});

test("retombe sur le repli quand la valeur est absente ou vide", () => {
  assert.equal(sanitizeDistinctId(undefined, "repli"), "repli");
  assert.equal(sanitizeDistinctId("", "repli"), "repli");
  assert.equal(sanitizeDistinctId("   ", "repli"), "repli");
  assert.equal(sanitizeDistinctId(42, "repli"), "repli");
});

test("refuse une valeur trop longue plutôt que de la tronquer", () => {
  // Tronquer fabriquerait un identifiant qui ressemble à un vrai et agrège deux personnes.
  assert.equal(sanitizeDistinctId("x".repeat(201), "repli"), "repli");
});

test("refuse les caractères de contrôle et les espaces internes", () => {
  assert.equal(sanitizeDistinctId("abc\ndef", "repli"), "repli");
  // Espace INTERNE : « abc » suivi d'un espace serait accepté, le trim l'ayant retiré.
  assert.equal(sanitizeDistinctId("abc def", "repli"), "repli");
});

test("accepte une valeur entourée d'espaces, en la nettoyant", () => {
  assert.equal(sanitizeDistinctId("  abc  ", "repli"), "abc");
});
