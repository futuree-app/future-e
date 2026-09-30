// FUT-6 : ce que le lecteur voit, et quand. La lecture enrichie est proposée, jamais substituée.
import test from "node:test";
import assert from "node:assert/strict";
import { displayReducer, initialDisplay, offersEnriched } from "./synthesis-display.ts";

test("sans cache : la lecture immédiate est affichée tout de suite, une lecture enrichie se prépare", () => {
  const s = initialDisplay(null);
  assert.equal(s.shown, "deterministic");
  assert.equal(s.status, "preparing");
});

test("cache disponible : la lecture enrichie s'affiche d'emblée", () => {
  const s = initialDisplay("texte validé");
  assert.equal(s.shown, "enriched");
});

test("arrivée tardive : jamais de remplacement sous les yeux, la version enrichie est proposée", () => {
  const s = displayReducer(initialDisplay(null), { type: "enrichedArrived", text: "enrichi" });
  assert.equal(s.shown, "deterministic");
  assert.equal(offersEnriched(s), true);
  const shown = displayReducer(s, { type: "showEnriched" });
  assert.equal(shown.shown, "enriched");
  assert.equal(offersEnriched(shown), false);
});

test("lecture enrichie indisponible : la lecture immédiate reste, sans signal d'attente", () => {
  const s = displayReducer(initialDisplay(null), { type: "enrichedUnavailable" });
  assert.equal(s.shown, "deterministic");
  assert.equal(s.status, "unavailable");
  assert.equal(offersEnriched(s), false);
});

test("« afficher » sans version prête ne fait rien", () => {
  const s0 = initialDisplay(null);
  assert.equal(displayReducer(s0, { type: "showEnriched" }), s0);
});
