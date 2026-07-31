import test from "node:test";
import assert from "node:assert/strict";
import { etatAutorisation, etatMontrable, LIBELLE_ETAT } from "./sitadel-etat.ts";

test("l'achèvement PRIME : un dossier achevé porte aussi ses dates antérieures", () => {
  // C'est le piège du classement. Un achevé a une date d'autorisation ET une d'ouverture ; tester
  // l'autorisation en premier le classerait « autorisé, non commencé », soit l'inverse du vrai.
  assert.equal(etatAutorisation({
    autorisation: "2024-05-06", ouvertureChantier: "2024-05-07", achevement: "2024-11-22",
  }), "acheve");
});

test("chantier ouvert : ouverture déclarée, achèvement non", () => {
  assert.equal(etatAutorisation({ autorisation: "2024-05-06", ouvertureChantier: "2024-05-07" }), "chantier_ouvert");
});

test("autorisé sans ouverture de chantier", () => {
  assert.equal(etatAutorisation({ autorisation: "2024-05-06" }), "autorise_non_commence");
});

test("aucune date : aucun état constatable", () => {
  assert.equal(etatAutorisation({}), "sans_date");
  assert.equal(etatAutorisation({ autorisation: null, ouvertureChantier: "", achevement: "   " }), "sans_date");
});

test("une date faite d'espaces ne compte pas pour une date", () => {
  // Le CSV rend des chaînes vides ou des blancs plutôt que des nuls, selon les colonnes.
  assert.equal(etatAutorisation({ autorisation: "2024-05-06", ouvertureChantier: "   " }), "autorise_non_commence");
});

test("un dossier sans date n'est jamais montré", () => {
  assert.equal(etatMontrable("sans_date"), false);
  for (const e of ["acheve", "chantier_ouvert", "autorise_non_commence"] as const) {
    assert.equal(etatMontrable(e), true, e);
  }
});

test("les libellés décrivent un ACTE CONSTATÉ, jamais un projet", () => {
  // « sera livré », « va transformer le quartier » : un permis autorisé peut n'être jamais
  // construit, être annulé, ou périmer faute de travaux commencés.
  const interdits = /sera |va être|prévu|livraison|futur|d'ici \d{4}|en construction/i;
  for (const [etat, texte] of Object.entries(LIBELLE_ETAT)) {
    assert.equal(interdits.test(texte), false, `${etat} : ${texte}`);
  }
});

test("le libellé « autorisé » porte sa réserve temporelle", () => {
  // Sans « à cette date », le lecteur comprend « toujours pas commencé aujourd'hui », ce que le
  // millésime mensuel du jeu ne garantit pas.
  assert.ok(LIBELLE_ETAT.autorise_non_commence.includes("à cette date"));
});
