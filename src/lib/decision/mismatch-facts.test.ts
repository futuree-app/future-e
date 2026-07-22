import test from "node:test";
import assert from "node:assert/strict";
import { classifyPosition, rankPhrase, MISMATCH_LABELS, type RelativeCriterionFact } from "./mismatch-facts.ts";

const fact = (over: Partial<RelativeCriterionFact>): RelativeCriterionFact => ({
  key: "nature", rawValue: 42, band: { low: 0.1, high: 0.12 },
  universe: "communes_france", distributionVersion: "d1", ...over,
});

test("extrême défavorable non ambigu -> mismatch", () => {
  assert.equal(classifyPosition(fact({ band: { low: 0.08, high: 0.15 } })), "mismatch");
  assert.equal(classifyPosition(fact({ band: { low: 0.2, high: 0.2 } })), "mismatch");
});
test("extrême favorable non ambigu -> satisfied", () => {
  assert.equal(classifyPosition(fact({ band: { low: 0.85, high: 0.9 } })), "satisfied");
  assert.equal(classifyPosition(fact({ band: { low: 0.8, high: 0.8 } })), "satisfied");
});
test("le centre -> neutral", () => {
  assert.equal(classifyPosition(fact({ band: { low: 0.45, high: 0.55 } })), "neutral");
});
test("un intervalle d'ex æquo À CHEVAL sur un seuil -> neutral, jamais mismatch", () => {
  assert.equal(classifyPosition(fact({ band: { low: 0.0, high: 0.83 } })), "neutral");
  assert.equal(classifyPosition(fact({ band: { low: 0.18, high: 0.25 } })), "neutral");
});
test("rawValue ou band null -> uncertain, jamais un rang inventé", () => {
  assert.equal(classifyPosition(fact({ rawValue: null, band: null })), "uncertain");
  assert.equal(classifyPosition(fact({ rawValue: 42, band: null })), "uncertain");
});
test("une bande INVALIDE ne devient jamais un verdict", () => {
  assert.equal(classifyPosition(fact({ band: { low: -0.1, high: 0.1 } })), "uncertain");
  assert.equal(classifyPosition(fact({ band: { low: 0.2, high: 1.5 } })), "uncertain");
  assert.equal(classifyPosition(fact({ band: { low: 0.5, high: 0.3 } })), "uncertain");
  assert.equal(classifyPosition(fact({ band: { low: Number.NaN, high: 0.1 } })), "uncertain");
});
test("rankPhrase dit la fraction la plus LARGE que la borne garantit", () => {
  assert.equal(rankPhrase(0.04), "les 5 % de communes");
  assert.equal(rankPhrase(0.09), "les 10 % de communes");
  assert.equal(rankPhrase(0.18), "les 20 % de communes");
  assert.equal(rankPhrase(0.24), "le quart des communes");
});
test("chaque critère de la v1 a un libellé grammatical", () => {
  for (const k of ["nature", "acces_ecoles", "vie_locale", "cadre_calme", "viabilite_emploi"]) {
    assert.ok(MISMATCH_LABELS[k], `libellé manquant pour ${k}`);
    assert.ok(MISMATCH_LABELS[k]!.topic.length <= 70);
  }
});

test("chaque libellé de mismatch porte un subject qui se lit APRÈS un deux-points", () => {
  for (const [key, lab] of Object.entries(MISMATCH_LABELS)) {
    assert.ok(lab.subject && lab.subject.trim().length > 0, `subject manquant pour ${key}`);
    assert.ok(lab.subject.length <= 45, `subject trop long pour ${key} : « ${lab.subject} »`);
    assert.equal(/[.!?]/.test(lab.subject), false, `subject phrasé pour ${key}`);
    assert.equal(lab.subject[0], lab.subject[0]!.toLowerCase(), `subject capitalisé pour ${key}`);
  }
});

test("le subject nomme la PRIORITÉ du lecteur, jamais l'indicateur défavorable", () => {
  // Le lecteur a déclaré vouloir moins dépendre de la voiture. Nommer « la dépendance à la voiture »
  // comme sa priorité inverserait ce qu'il a demandé. Et « la FAIBLE dépendance à la voiture »
  // l'obligeait à inverser deux fois sous un « répond moins bien » : le sujet se dit en positif.
  assert.equal(MISMATCH_LABELS.faible_dependance_auto!.subject, "la possibilité de se passer de la voiture");
  assert.equal(MISMATCH_LABELS.faible_dependance_auto!.subject.includes("faible"), false);
});

test("aucun subject ne dépasse la garde de 45 caractères ni ne se termine en phrase", () => {
  // La garde vit dans assertFactValid ; ce test la joue sur la TABLE, pour qu'un libellé trop long
  // échoue à l'écriture et non à l'exécution d'une règle sur une commune particulière.
  for (const [key, lab] of Object.entries(MISMATCH_LABELS)) {
    assert.ok(lab.subject.length <= 45, `${key} : subject de ${lab.subject.length} caractères`);
    assert.doesNotMatch(lab.subject, /[.!?]/, `${key} : le subject se lit après un deux-points`);
  }
});
