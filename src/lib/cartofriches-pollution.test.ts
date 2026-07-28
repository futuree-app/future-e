import test from "node:test";
import assert from "node:assert/strict";
import { readSolPollution, SOL_POLLUTION_LABEL } from "./cartofriches-pollution.ts";
import { CARTOFRICHES_SOL_POLLUTION, CARTOFRICHES_POLLUTION_ETABLIE } from "./fixtures-sources-externes.ts";

test("LE CORPUS RÉEL est couvert : les sept libellés ADEME sont tous reconnus", () => {
  // Contre la source, pas contre nos propres chaînes : c'est ce qui manquait aux ~800 tests quand
  // « feux de foret » cherchait un pluriel que GASPAR n'écrit pas.
  for (const v of CARTOFRICHES_SOL_POLLUTION) {
    const { etat, brut } = readSolPollution(v);
    assert.equal(brut, v, "le libellé brut doit être conservé tel quel");
    if (v === "inconnu") assert.equal(etat, "inconnue", v);
    else assert.notEqual(etat, "inconnue", `« ${v} » n'est pas reconnu`);
  }
});

test("SIX SENS DISTINCTS : aucun libellé de la source n'en écrase un autre", () => {
  // Correction de ma propre première version, qui rangeait « traitée » avec « avérée » et
  // « peu probable » avec « inexistante » — l'erreur du booléen, en plus petit.
  assert.equal(readSolPollution("pollution avérée").etat, "etablie");
  assert.equal(readSolPollution("pollution traitée").etat, "traitee");
  assert.equal(readSolPollution("pollution peu probable").etat, "peu_probable");
  assert.equal(readSolPollution("pollution inexistante").etat, "ecartee");
  const etats = CARTOFRICHES_SOL_POLLUTION.map((v) => readSolPollution(v).etat);
  assert.equal(new Set(etats).size, 6, "sept libellés doivent produire six états distincts");
});

test("UN SITE DÉPOLLUÉ N'EST NI POLLUÉ NI SAIN", () => {
  const { etat } = readSolPollution("pollution traitée");
  assert.notEqual(etat, "etablie");
  assert.notEqual(etat, "ecartee");
  assert.match(SOL_POLLUTION_LABEL[etat], /dépollué/);
});

test("« PEU PROBABLE » NE VAUT PAS « INEXISTANTE » : vraisemblance contre affirmation", () => {
  assert.notEqual(readSolPollution("pollution peu probable").etat, readSolPollution("pollution inexistante").etat);
  assert.doesNotMatch(SOL_POLLUTION_LABEL.peu_probable, /écartée|non retenue|inexistante/);
});

test("LE BRUT DISTINGUE UNE MODALITÉ NOUVELLE D'UN VRAI « inconnu »", () => {
  const nouveau = readSolPollution("pollution en cours de traitement");
  const vrai = readSolPollution("inconnu");
  assert.equal(nouveau.etat, "inconnue");
  assert.equal(vrai.etat, "inconnue");
  assert.notEqual(nouveau.brut, vrai.brut); // c'est le brut qui trahit l'évolution du contrat
});

test("LES LIBELLÉS NOMMENT LE SITE, jamais le sol du logement analysé", () => {
  // Cartofriches décrit une friche recensée. Tant qu'aucune intersection avec la parcelle n'est
  // établie, « pollution du sol » tout court se lirait « votre sol ».
  for (const [etat, label] of Object.entries(SOL_POLLUTION_LABEL)) {
    assert.match(label, /site/i, `« ${label} » (${etat}) ne dit pas de quel lieu il parle`);
  }
});

test("LE BUG : aucun de ces libellés n'aurait été vu par l'ancien booléen", () => {
  // L'ancienne logique testait `=== true || === "true" || === "1"`. Aucun des sept ne vaut ça,
  // donc `sol_pollue` était faux pour les 28 373 friches de France — 485 pollutions avérées incluses.
  for (const v of CARTOFRICHES_SOL_POLLUTION) {
    assert.ok(v !== "true" && v !== "1", `le corpus contiendrait « ${v} », à revérifier`);
  }
  assert.equal(readSolPollution("pollution avérée").etat, "etablie");
});

test("POLLUTION ÉTABLIE : la forme avérée, et elle seule", () => {
  for (const v of CARTOFRICHES_POLLUTION_ETABLIE) {
    assert.equal(readSolPollution(v).etat, "etablie", v);
  }
});

test("SUPPOSÉE N'EST PAS ÉTABLIE : un indice ne vaut pas un diagnostic", () => {
  assert.equal(readSolPollution("pollution supposée").etat, "supposee");
  assert.equal(readSolPollution("pollution probable").etat, "supposee");
});

test("INCONNU N'EST PAS INEXISTANT — la distinction que le booléen détruisait", () => {
  // 86,6 % des friches sont « inconnu », 1,9 % « pollution inexistante ». Les confondre, c'est dire
  // « sol sain » là où personne n'a regardé.
  assert.equal(readSolPollution("inconnu").etat, "inconnue");
  assert.equal(readSolPollution("pollution inexistante").etat, "ecartee");
  assert.notEqual(readSolPollution("inconnu").etat, readSolPollution("pollution inexistante").etat);
});

test("UN LIBELLÉ NON RECONNU RETOMBE SUR `inconnue`, jamais sur `ecartee`", () => {
  // Si l'ADEME ajoute une modalité, on ne conclura pas à un sol sain par défaut.
  for (const v of ["pollution hypothétique", "", "  ", "N/A", "oui", "true", "1"]) {
    assert.equal(readSolPollution(v).etat, "inconnue", `« ${v} »`);
  }
});

test("Une valeur non textuelle ne fait pas conclure", () => {
  for (const v of [null, undefined, 0, 1, true, false, {}, []]) {
    assert.equal(readSolPollution(v).etat, "inconnue");
  }
});

test("La casse et les espaces de la source ne changent pas la lecture", () => {
  assert.equal(readSolPollution("  Pollution Avérée  ").etat, "etablie");
  assert.equal(readSolPollution("POLLUTION INEXISTANTE").etat, "ecartee");
});

test("Chaque état a un libellé lisible, distinct des autres", () => {
  const labels = Object.values(SOL_POLLUTION_LABEL);
  assert.equal(new Set(labels).size, labels.length);
  // Aucun ne dit « sol sain » : la source n'établit jamais ça.
  for (const l of labels) assert.doesNotMatch(l, /sain|propre/i);
});
