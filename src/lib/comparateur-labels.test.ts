import test from "node:test";
import assert from "node:assert/strict";
import { PREFERENCE_LABELS, horsMesureToLignes } from "./comparateur-labels.ts";

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

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE TIROIR FOURRE-TOUT (19/09/2026).
//
// L'énumération des familles hors-mesure valait `ecoles | culture | affectif`. Tout sujet
// réellement exprimé qui n'était ni une école ni de la culture tombait donc en « affectif », et
// recevait la phrase sur le caractère du lieu. Mesuré sur le parse réel :
//
//   « je me demande si l'eau du robinet est potable là-bas »   → affectif, 3 essais sur 3
//   « j'ai peur des moustiques tigres et des tiques »          → affectif, 5 essais sur 5
//
// Le lecteur lisait alors « le caractère d'un lieu (authentique, chaleureux, vivant) relève d'une
// expérience personnelle », en réponse à une question sur la potabilité de l'eau.
// ════════════════════════════════════════════════════════════════════════════════════════════

test("un sujet sans famille est nommé, et sa phrase dit qu'il n'a pas pesé", () => {
  const lignes = horsMesureToLignes([{ term: "eau du robinet potable", kind: "autre" }]);
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0]!.terme, "Eau du robinet potable");
  assert.match(lignes[0]!.phrase, /ne mesure pas/);
  // La phrase du caractère du lieu n'a rien à faire ici.
  assert.doesNotMatch(lignes[0]!.phrase, /authentique|chaleureux/);
});

test("deux sujets sans famille restent deux lignes distinctes", () => {
  // La déduplication par phrase, correcte pour les familles connues, fusionnerait ici deux
  // questions qui n'ont rien à voir.
  const lignes = horsMesureToLignes([
    { term: "moustiques tigres et tiques", kind: "autre" },
    { term: "eau du robinet", kind: "autre" },
  ]);
  assert.equal(lignes.length, 2);
  assert.deepEqual(lignes.map((l) => l.terme), ["Moustiques tigres et tiques", "Eau du robinet"]);
});

test("les familles connues gardent leur phrase et ne nomment pas le terme", () => {
  // Leur phrase dit déjà de quoi elle parle, et interpoler le mot brut produit des accords bancals.
  const lignes = horsMesureToLignes([
    { term: "bonnes écoles", kind: "ecoles" },
    { term: "réputation du collège", kind: "ecoles" },
    { term: "authentique", kind: "affectif" },
  ]);
  assert.equal(lignes.length, 2, "deux termes d'une même famille se replient sur une phrase");
  assert.equal(lignes[0]!.terme, null);
  assert.match(lignes[0]!.phrase, /qualité, la réputation/);
  assert.match(lignes[1]!.phrase, /expérience personnelle/);
});

test("un terme vide ou une famille inconnue ne produit pas de ligne", () => {
  assert.equal(horsMesureToLignes([{ term: "  ", kind: "autre" }]).length, 0);
  assert.equal(horsMesureToLignes([{ term: "x", kind: "inventé" }]).length, 0);
  assert.equal(horsMesureToLignes(null).length, 0);
});

test("un terme trop long est coupé plutôt que de casser la ligne", () => {
  const long = "la question de savoir si les nappes phréatiques du secteur sont durablement polluées";
  const [ligne] = horsMesureToLignes([{ term: long, kind: "autre" }]);
  assert.ok(ligne!.terme!.length <= 61, `terme non borné : ${ligne!.terme!.length}`);
  assert.match(ligne!.terme!, /…$/);
});
