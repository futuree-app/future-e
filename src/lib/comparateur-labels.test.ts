import test from "node:test";
import assert from "node:assert/strict";
import { PREFERENCE_LABELS } from "./comparateur-labels.ts";

// UN LIBELLÉ DE PRIORITÉ ENTRE EN MILIEU DE PHRASE. Il est énuméré entre parenthèses sur la page
// « débloquer » (« Vu vos priorités (des étés plus frais, un cadre calme…) »), listé en puces sur
// /ou-vivre, et repris par le registre des critères. Une capitale initiale y met une majuscule au
// milieu d'une phrase :
//
//   Vu vos priorités (des étés plus frais, Un territoire qui gagne des habitants), le rapport…
//
// Un seul libellé sur vingt-huit portait cette capitale, et rien ne la voyait. C'est le même défaut
// que le `title` de composition servi après un deux-points, sur une autre surface : la règle est que
// tout texte destiné à être ENCHÂSSÉ commence en bas de casse.
test("aucun libellé de priorité ne commence par une capitale", () => {
  for (const [key, label] of Object.entries(PREFERENCE_LABELS)) {
    assert.equal(
      label[0],
      label[0]!.toLowerCase(),
      `${key} : « ${label} » s'énumère en milieu de phrase, il commence en bas de casse`,
    );
  }
});

// Et il n'est pas une phrase : ni point final, ni deux-points.
test("aucun libellé de priorité n'est ponctué comme une phrase", () => {
  for (const [key, label] of Object.entries(PREFERENCE_LABELS)) {
    assert.doesNotMatch(label, /[.!?:]$/, `${key} : « ${label} » se lit dans une énumération`);
  }
});
