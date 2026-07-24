import { test } from "node:test";
import assert from "node:assert/strict";
import { dossierAnchorId } from "./dossier-anchors.ts";

test("un identifiant de fait devient une ancre préfixée", () => {
  assert.equal(dossierAnchorId("exposition-bati"), "fait-exposition-bati");
});

test("le « : » d'un identifiant de composition est neutralisé", () => {
  // HTML5 accepte le « : » dans un id, mais `querySelector("#31555:composition-…")` le lit comme un
  // pseudo-sélecteur et LÈVE. C'est la raison d'être de cette fonction : sans elle, le clic échouerait
  // sur exactement les cartes qui portent le plus d'actions (les compositions).
  assert.equal(
    dossierAnchorId("31555:composition-argiles-ppr"),
    "fait-31555-composition-argiles-ppr",
  );
});

test("le préfixe garantit un sélecteur valide même quand l'identifiant commence par un chiffre", () => {
  // « #31555… » est un sélecteur CSS invalide (un identifiant ne peut pas commencer par un chiffre).
  const ancre = dossierAnchorId("31555:composition-climat-saisons");
  assert.match(ancre, /^[a-zA-Z]/);
});

test("les points et les espaces passent aussi (les factId de règles en portent)", () => {
  assert.equal(dossierAnchorId("viv.pm25"), "fait-viv-pm25");
  assert.equal(dossierAnchorId("scores.qualite air"), "fait-scores-qualite-air");
});

test("aucun tiret orphelin en fin d'ancre", () => {
  assert.equal(dossierAnchorId("inondation.risque."), "fait-inondation-risque");
});

test("deux identifiants distincts ne collident pas sur la même ancre", () => {
  // La normalisation écrase des caractères : deux cartes qui partageraient une ancre se voleraient
  // leur cible en silence. Les identifiants réels ne diffèrent jamais QUE par un séparateur.
  assert.notEqual(dossierAnchorId("logement.dpe"), dossierAnchorId("logement.rga"));
});
