import test from "node:test";
import assert from "node:assert/strict";
import { doitReparser, parsedASauvegarder } from "./projet-edition.ts";
import type { UserProject } from "../user-project.ts";

const PARSED = { reformulation: "Un lieu calme.", hardConstraints: {}, preferences: [{ key: "cadre_calme", weight: 3 }] };
const projet = {
  posture: "recherche", intent: "achat", rawText: "au calme, près de la mer",
  parsed: PARSED, updatedAt: "2026-08-05T09:00:00.000Z",
} as unknown as UserProject;

test("changer la SEULE intention ne reparse rien et ne perd rien", () => {
  // Le cas qui motive tout : sans cette règle, un aller-retour achat / location un jour de panne du
  // parseur effacerait les priorités du lecteur, sans qu'il ait touché à son texte.
  assert.equal(doitReparser("au calme, près de la mer", projet), false);
  assert.deepEqual(
    parsedASauvegarder({ reparse: false, parsedRecu: null, projet }),
    { parsed: PARSED, avertir: false },
  );
});

test("une espace de plus n'est pas une modification", () => {
  assert.equal(doitReparser("  au calme, près de la mer  ", projet), false);
});

test("texte modifié et parseur disponible : le nouveau parsed gagne", () => {
  const neuf = { reformulation: "Autre chose.", hardConstraints: {}, preferences: [] } as unknown as UserProject["parsed"];
  assert.equal(doitReparser("je veux la montagne", projet), true);
  assert.deepEqual(
    parsedASauvegarder({ reparse: true, parsedRecu: neuf, projet }),
    { parsed: neuf, avertir: false },
  );
});

test("texte modifié et parseur indisponible : on n'attache PAS les anciennes priorités au nouveau texte", () => {
  // Les garder ferait répondre l'analyse à des priorités que le lecteur vient de retirer. On écrit
  // null, et l'écran le dit.
  assert.deepEqual(
    parsedASauvegarder({ reparse: true, parsedRecu: null, projet }),
    { parsed: null, avertir: true },
  );
});

test("premier projet, aucun texte antérieur : on reparse", () => {
  assert.equal(doitReparser("au calme", null), true);
});

// ── LE TEXTE EST FACULTATIF, ET LE RETIRER EST UN CHOIX ──────────────────────────────────────
// Depuis le 20/08/2026, quelqu'un peut déclarer son objectif et son intention sans écrire de
// priorités. Deux façons de se tromper étaient ouvertes : présenter ce retrait comme un échec du
// parseur, ou garder les anciennes priorités sur un projet qui vient de les abandonner.
test("texte vide : aucune priorité gardée, et aucun avertissement", () => {
  const projet = {
    posture: "recherche", intent: "achat", rawText: "au calme",
    parsed: { reformulation: "Un lieu calme.", hardConstraints: {}, preferences: [] },
  } as unknown as UserProject;

  const out = parsedASauvegarder({ reparse: true, parsedRecu: null, projet, texteVide: true });
  assert.equal(out.parsed, null, "les priorités de l'ancien texte ne survivent pas à son effacement");
  assert.equal(out.avertir, false, "un retrait volontaire n'est pas un échec d'analyse");
});

