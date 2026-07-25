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

// ── CONTRAT DE DONNÉES : les libellés RÉELS de GASPAR ───────────────────────────
//
// Ces tests n'éprouvent pas notre logique contre nos propres chaînes : ils l'éprouvent contre celles de
// la source, recopiées telles qu'elle les renvoie. C'est ce qui manquait quand `wildfire` cherchait un
// pluriel que GASPAR n'écrit jamais.

import { simplifyCatnatRisk } from "./georisques-flags.ts";
import { GASPAR_RISQUES_LABELS, GASPAR_CATNAT_LABELS, CATNAT_FAMILLES_ATTENDUES } from "./fixtures-sources-externes.ts";

test("CONTRAT — les libellés de risques réels ne produisent aucun faux positif croisé", () => {
  // Chaque libellé ne doit lever que le drapeau qui le concerne. « Transport de marchandises
  // dangereuses » ne doit pas lever `flood` parce qu'il contiendrait un mot voisin, par exemple.
  const attendus: Record<string, keyof ReturnType<typeof riskFlagsFromLabels>> = {
    "Inondation": "flood",
    "Par submersion marine": "marineSubmersion",
    "Mouvement de terrain": "landslide",
    "Feu de forêt": "wildfire",
  };
  for (const [label, drapeau] of Object.entries(attendus)) {
    const f = riskFlagsFromLabels([label]);
    assert.equal(f[drapeau], true, `« ${label} » devrait lever ${drapeau}`);
    const autres = Object.entries(f).filter(([k, v]) => k !== drapeau && v === true);
    assert.deepEqual(autres, [], `« ${label} » lève aussi : ${autres.map(([k]) => k).join(", ")}`);
  }
});

test("CONTRAT — aucun libellé de risque réel n'est muet pour tous les drapeaux qu'on suit", () => {
  // Les libellés qu'on ne suit PAS (transport de marchandises, industriel…) sont légitimes ici : le test
  // vérifie seulement que ceux qu'on prétend suivre sont bien reconnus dans leur forme réelle.
  const suivis = ["Inondation", "Par submersion marine", "Mouvement de terrain", "Feu de forêt", "Séisme Zone 3"];
  for (const label of suivis) {
    const f = riskFlagsFromLabels([label]);
    assert.ok(Object.values(f).some(Boolean), `aucun drapeau levé par « ${label} »`);
  }
  // Et l'inverse : le corpus complet ne doit pas allumer un drapeau par accident.
  assert.equal(riskFlagsFromLabels(["Transport de marchandises dangereuses", "Industriel"]).wildfire, false);
});

test("CONTRAT — TOUS les libellés CatNat réels sont traduits, aucun jargon ne fuit à l'écran", () => {
  // Le repli de `simplifyCatnatRisk` rend le libellé BRUT au lecteur (« Chocs Mécaniques liés à l'action
  // des Vagues »). Acceptable pour une forme rare et inconnue, jamais pour une forme couramment
  // observée. Ce test tombera si GASPAR introduit un libellé que la traduction ne connaît pas.
  const nonTraduits = GASPAR_CATNAT_LABELS.filter(
    (l) => !(CATNAT_FAMILLES_ATTENDUES as readonly string[]).includes(simplifyCatnatRisk(l)),
  );
  assert.deepEqual(
    nonTraduits, [],
    `Libellés CatNat rendus en jargon : ${nonTraduits.join(" | ")}. Ajouter leur famille dans simplifyCatnatRisk.`,
  );
});

test("CONTRAT — les libellés CatNat voisins ne se confondent pas", () => {
  // « Inondations Remontée Nappe » et « Inondations et/ou Coulées de Boue » sont la même famille ;
  // « Glissement de Terrain » et « Eboulement et/ou Chute de Blocs » aussi. Mais la sécheresse et les
  // mouvements de terrain doivent rester distincts, alors que le retrait-gonflement les rapproche.
  assert.equal(simplifyCatnatRisk("Inondations Remontée Nappe"), "Inondations");
  assert.equal(simplifyCatnatRisk("Inondations et/ou Coulées de Boue"), "Inondations");
  assert.equal(simplifyCatnatRisk("Glissement de Terrain"), "Mouvements de terrain");
  assert.equal(simplifyCatnatRisk("Eboulement et/ou Chute de Blocs"), "Mouvements de terrain");
  assert.equal(simplifyCatnatRisk("Sécheresse"), "Sécheresse des sols");
  assert.equal(simplifyCatnatRisk("Chocs Mécaniques liés à l'action des Vagues"), "Érosion et impact des vagues");
});

test("CONTRAT — un libellé INCONNU est rendu tel quel, sans planter ni inventer de famille", () => {
  // Le repli doit rester sûr : mieux vaut du jargon visible qu'une famille fausse ou une exception.
  assert.equal(simplifyCatnatRisk("Phénomène non répertorié 2031"), "Phénomène non répertorié 2031");
  assert.equal(simplifyCatnatRisk("  "), "");
});

test("CONTRAT — le corpus lui-même n'est pas vide (garde-fou du garde-fou)", () => {
  // Un corpus vidé par mégarde ferait passer tous les tests ci-dessus sans rien vérifier.
  assert.ok(GASPAR_RISQUES_LABELS.length >= 10);
  assert.ok(GASPAR_CATNAT_LABELS.length >= 10);
});
