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
