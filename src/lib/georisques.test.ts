import { test } from "node:test";
import assert from "node:assert/strict";
import { riskFlagsFromLabels } from "./georisques-flags.ts";

// LES LIBELLÉS RÉELS DE L'API GASPAR, relevés le 25/07/2026 sur quatre communes. Ils sont recopiés ici
// tels quels, accents et nombre compris : c'est exactement ce que le détecteur doit savoir lire, et
// c'est ce qu'aucun test ne vérifiait quand `wildfire` cherchait un pluriel que GASPAR n'écrit jamais.
const LEGE_CAP_FERRET = [
  "Inondation",
  "Par une crue à débordement lent de cours d'eau",
  "Par submersion marine",
  "Mouvement de terrain",
  "Avancée dunaire",
  "Feu de forêt",
];
const AIX_EN_PROVENCE = ["Feu de forêt", "Transport de marchandises dangereuses"];

test("« Feu de forêt » (SINGULIER, la forme que GASPAR écrit) est détecté", () => {
  // La régression d'origine : le test cherchait « feux de foret » au pluriel, donc le drapeau valait
  // false pour toutes les communes de France — y compris celles qui brûlaient.
  assert.equal(riskFlagsFromLabels(LEGE_CAP_FERRET).wildfire, true);
  assert.equal(riskFlagsFromLabels(AIX_EN_PROVENCE).wildfire, true);
});

test("le pluriel et « incendie » restent détectés (aucune forme perdue)", () => {
  assert.equal(riskFlagsFromLabels(["Feux de forêt"]).wildfire, true);
  assert.equal(riskFlagsFromLabels(["Incendie de forêt"]).wildfire, true);
  assert.equal(riskFlagsFromLabels(["Feux de forets"]).wildfire, true); // sans accent, au cas où
});

test("aucun libellé de feu -> le drapeau reste faux (pas de faux positif)", () => {
  assert.equal(riskFlagsFromLabels(["Inondation", "Séisme", "Avancée dunaire"]).wildfire, false);
  assert.equal(riskFlagsFromLabels([]).wildfire, false);
});

test("les autres drapeaux lisent bien les libellés réels de Lège-Cap-Ferret", () => {
  const f = riskFlagsFromLabels(LEGE_CAP_FERRET);
  assert.equal(f.flood, true);
  assert.equal(f.marineSubmersion, true);
  assert.equal(f.landslide, true);
  assert.equal(f.clay, false); // aucun libellé argile/tassements sur cette commune
  assert.equal(f.storm, false);
});

test("la zone sismique du zonage réglementaire suffit, même sans libellé GASPAR", () => {
  assert.equal(riskFlagsFromLabels(["Inondation"], true).seismic, true);
  assert.equal(riskFlagsFromLabels(["Inondation"], false).seismic, false);
  assert.equal(riskFlagsFromLabels(["Séisme"], false).seismic, true);
});
