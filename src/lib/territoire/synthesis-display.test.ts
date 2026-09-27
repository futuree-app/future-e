// FUT-6 : ce que le lecteur voit, et quand. Jamais de remplacement sous les yeux d'un lecteur engagé.
import test from "node:test";
import assert from "node:assert/strict";
import { displayReducer, initialDisplay, offersEnriched } from "./synthesis-display.ts";

test("sans cache : la déterministe est affichée tout de suite, une lecture enrichie se prépare", () => {
  const s = initialDisplay(null);
  assert.equal(s.shown, "deterministic");
  assert.equal(s.status, "preparing");
});

test("cache disponible : la lecture enrichie s'affiche d'emblée", () => {
  const s = initialDisplay("texte validé");
  assert.equal(s.shown, "enriched");
  assert.equal(s.enrichedText, "texte validé");
});

test("arrivée tardive, lecteur pas encore engagé : transition vers la version enrichie", () => {
  const s = displayReducer(initialDisplay(null), { type: "enrichedArrived", text: "enrichi" });
  assert.equal(s.shown, "enriched");
});

test("arrivée tardive, lecteur engagé : le texte lu ne change pas, un signal propose la version enrichie", () => {
  let s = displayReducer(initialDisplay(null), { type: "engaged" });
  s = displayReducer(s, { type: "enrichedArrived", text: "enrichi" });
  assert.equal(s.shown, "deterministic");
  assert.equal(offersEnriched(s), true);
  s = displayReducer(s, { type: "showEnriched" });
  assert.equal(s.shown, "enriched");
  assert.equal(offersEnriched(s), false);
});

test("lecture enrichie indisponible : la déterministe reste, sans signal d'attente", () => {
  const s = displayReducer(initialDisplay(null), { type: "enrichedUnavailable" });
  assert.equal(s.shown, "deterministic");
  assert.equal(s.status, "unavailable");
  assert.equal(offersEnriched(s), false);
});

test("« afficher » sans version prête ne fait rien", () => {
  const s0 = initialDisplay(null);
  assert.equal(displayReducer(s0, { type: "showEnriched" }), s0);
});
