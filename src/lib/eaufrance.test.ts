import { test } from "node:test";
import assert from "node:assert/strict";
import { estACec } from "./eaufrance-ecoulement.ts";
import { ONDE_ECOULEMENTS, ONDE_FORMES_SECHES } from "./fixtures-sources-externes.ts";

// CONTRAT DE DONNÉES — EAUFRANCE / ONDE.
//
// La logique vivait dans une fonction d'I/O, donc intestable, et elle lisait un champ INEXISTANT
// (`libelle_observation` au lieu de `libelle_ecoulement`) : `isDry` valait toujours false. Même
// signature que le bug « feux de forêt » de Géorisques — une chaîne d'API jamais confrontée à la source.

test("CONTRAT — les deux formes SÈCHES réelles sont reconnues", () => {
  for (const l of ONDE_FORMES_SECHES) {
    assert.equal(estACec(l), true, `« ${l} » signale un cours d'eau à sec`);
  }
});

test("CONTRAT — les formes AVEC écoulement ne le sont pas", () => {
  const humides = ONDE_ECOULEMENTS.filter((l) => !(ONDE_FORMES_SECHES as readonly string[]).includes(l));
  for (const l of humides) {
    assert.equal(estACec(l), false, `« ${l} » ne signale pas un assec`);
  }
});

test("CONTRAT — « Observation impossible » n'est NI sec NI humide : c'est une absence de mesure", () => {
  // La traiter comme une bonne ou une mauvaise nouvelle inventerait un état que la source ne donne pas.
  assert.equal(estACec("Observation impossible"), false);
});

test("CONTRAT — l'accent ne change rien (la source écrit sans, le code doit tolérer les deux)", () => {
  assert.equal(estACec("Écoulement non visible"), true);
  assert.equal(estACec("Ecoulement non visible"), true);
});

test("CONTRAT — une valeur absente ne signale JAMAIS un assec", () => {
  // C'est précisément le bug : un champ mal nommé rendait `undefined`, et le silence devenait un « non ».
  // Le comportement reste sûr, mais il ne doit plus pouvoir passer inaperçu.
  assert.equal(estACec(null), false);
  assert.equal(estACec(undefined), false);
  assert.equal(estACec(""), false);
});

test("CONTRAT — le corpus couvre toutes les valeurs observées", () => {
  assert.equal(ONDE_ECOULEMENTS.length, 6);
  assert.ok(ONDE_FORMES_SECHES.every((f) => (ONDE_ECOULEMENTS as readonly string[]).includes(f)));
});
