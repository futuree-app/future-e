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

test("le libellé « autorisé » borne ce qu'il affirme À LA SOURCE, et ne parle pas de travaux", () => {
  // DEUX EXIGENCES, ET ELLES SONT DISTINCTES.
  //
  // 1. La réserve temporelle est obligatoire : sans elle, le lecteur comprend « toujours rien
  //    aujourd'hui », ce que le millésime MENSUEL du jeu ne garantit pas. « À cette date »
  //    l'assurait déjà, mais obligeait à deviner laquelle des deux dates affichées était visée.
  //
  // 2. Ce que la source établit est une ABSENCE DE DÉCLARATION, jamais une absence de travaux :
  //    l'état se déduit de trois dates déclarées, et un chantier peut avoir commencé sans que sa
  //    déclaration d'ouverture soit parvenue au registre. « Travaux non commencés » faisait de
  //    l'absence d'une déclaration un constat matériel.
  const texte = LIBELLE_ETAT.autorise_non_commence;
  assert.ok(/registre consulté/.test(texte), `la réserve doit borner à la source : ${texte}`);
  assert.equal(/travaux non commencés/.test(texte), false, `constat matériel non établi : ${texte}`);
  assert.equal(/à cette date/.test(texte), false, "le démonstratif seul n'est plus accepté");
});
