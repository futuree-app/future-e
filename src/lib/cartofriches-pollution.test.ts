import test from "node:test";
import assert from "node:assert/strict";
import { readSolPollution, SOL_POLLUTION_LABEL } from "./cartofriches-pollution.ts";
import { CARTOFRICHES_SOL_POLLUTION, CARTOFRICHES_POLLUTION_ETABLIE } from "./fixtures-sources-externes.ts";

test("LE CORPUS RÉEL est couvert : les sept libellés ADEME sont tous reconnus", () => {
  // Contre la source, pas contre nos propres chaînes : c'est ce qui manquait aux ~800 tests quand
  // « feux de foret » cherchait un pluriel que GASPAR n'écrit pas.
  for (const v of CARTOFRICHES_SOL_POLLUTION) {
    const etat = readSolPollution(v);
    if (v === "inconnu") assert.equal(etat, "inconnue", v);
    else assert.notEqual(etat, "inconnue", `« ${v} » n'est pas reconnu`);
  }
});

test("LE BUG : aucun de ces libellés n'aurait été vu par l'ancien booléen", () => {
  // L'ancienne logique testait `=== true || === "true" || === "1"`. Aucun des sept ne vaut ça,
  // donc `sol_pollue` était faux pour les 28 373 friches de France — 485 pollutions avérées incluses.
  for (const v of CARTOFRICHES_SOL_POLLUTION) {
    assert.ok(v !== "true" && v !== "1", `le corpus contiendrait « ${v} », à revérifier`);
  }
  assert.equal(readSolPollution("pollution avérée"), "etablie");
});

test("POLLUTION ÉTABLIE : avérée ET traitée — un sol traité a bien été pollué", () => {
  for (const v of CARTOFRICHES_POLLUTION_ETABLIE) {
    assert.equal(readSolPollution(v), "etablie", v);
  }
});

test("SUPPOSÉE N'EST PAS ÉTABLIE : un indice ne vaut pas un diagnostic", () => {
  assert.equal(readSolPollution("pollution supposée"), "probable");
  assert.equal(readSolPollution("pollution probable"), "probable");
});

test("INCONNU N'EST PAS INEXISTANT — la distinction que le booléen détruisait", () => {
  // 86,6 % des friches sont « inconnu », 1,9 % « pollution inexistante ». Les confondre, c'est dire
  // « sol sain » là où personne n'a regardé.
  assert.equal(readSolPollution("inconnu"), "inconnue");
  assert.equal(readSolPollution("pollution inexistante"), "ecartee");
  assert.notEqual(readSolPollution("inconnu"), readSolPollution("pollution inexistante"));
});

test("UN LIBELLÉ NON RECONNU RETOMBE SUR `inconnue`, jamais sur `ecartee`", () => {
  // Si l'ADEME ajoute une modalité, on ne conclura pas à un sol sain par défaut.
  for (const v of ["pollution hypothétique", "", "  ", "N/A", "oui", "true", "1"]) {
    assert.equal(readSolPollution(v), "inconnue", `« ${v} »`);
  }
});

test("Une valeur non textuelle ne fait pas conclure", () => {
  for (const v of [null, undefined, 0, 1, true, false, {}, []]) {
    assert.equal(readSolPollution(v), "inconnue");
  }
});

test("La casse et les espaces de la source ne changent pas la lecture", () => {
  assert.equal(readSolPollution("  Pollution Avérée  "), "etablie");
  assert.equal(readSolPollution("POLLUTION INEXISTANTE"), "ecartee");
});

test("Chaque état a un libellé lisible, distinct des autres", () => {
  const labels = Object.values(SOL_POLLUTION_LABEL);
  assert.equal(new Set(labels).size, labels.length);
  // Aucun ne dit « sol sain » : la source n'établit jamais ça.
  for (const l of labels) assert.doesNotMatch(l, /sain|propre/i);
});
