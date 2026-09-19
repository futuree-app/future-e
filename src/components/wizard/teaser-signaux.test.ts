import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WIZARD_SKIP_DEFAULTS, hasWizardContent } from "./types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ACCUEIL N'A PLUS LE DROIT D'AFFIRMER (19/09/2026).
//
// Le questionnaire d'accueil produisait trois affirmations qu'aucune donnée n'établissait, sur la
// première page que verra un inconnu le jour de l'ouverture :
//
//   1. « DPE estimé A–B » (ou E–G) à partir du seul ÂGE DÉCLARÉ du logement, sous une source
//      « Estimation issue du parc français (ADEME) ». Le module Logement, lui, refuse de qualifier
//      la performance énergétique sans diagnostic ATTRIBUÉ — c'est même la raison d'être de
//      `deriveThermalEvidence`. L'accueil offrait gratuitement ce que le produit payé s'interdit.
//      Pire : sans âge renseigné, il affichait quand même « DPE estimé D–E », « sur la moyenne du
//      parc français ».
//
//   2. « Votre dépendance à la voiture pèsera de plus en plus dans votre budget », sous
//      « Méthode futur•e · données ADEME ». Une prédiction sur le budget d'une personne, à partir
//      d'une case cochée.
//
//   3. « Achat à risque climatique », affiché comme un résultat chiffré, à partir de la seule
//      mention d'un projet d'achat.
//
// Une personne réelle a reçu les deux premières (maison récente + voiture, relevé en base le
// 19/09/2026).
//
// CE TEST LIT LA SOURCE. Le teaser est un composant React à l'état interne et aux appels réseau ;
// éprouver son rendu demanderait une machinerie que ce dépôt n'a pas. Ce qu'on protège ici est
// exactement ce qui a été retiré : des formulations. Une garde textuelle est faible en général,
// et suffisante pour empêcher un retour en arrière par copier-coller.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Le CODE du teaser, commentaires retirés. Les commentaires citent volontairement les anciennes
 * formulations pour expliquer ce qui a été retiré et pourquoi : les interdire effacerait la
 * mémoire du défaut, qui est précisément ce qui empêche de le refaire.
 */
const TEASER = readFileSync("src/components/wizard/WizardTeaser.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "") // blocs, y compris leurs lignes de continuation
  .split("\n")
  .filter((l) => !l.trim().startsWith("//"))
  .join("\n");

const INTERDITS: { motif: RegExp; pourquoi: string }[] = [
  { motif: /DPE estimé/i, pourquoi: "une classe énergétique déduite de l'âge n'est pas un diagnostic" },
  { motif: /dpeFromAge/, pourquoi: "la table âge → classe énergétique n'a plus de raison d'exister" },
  { motif: /probablement énergivore/i, pourquoi: "affirmation sur un logement jamais examiné" },
  { motif: /probablement bien isolé/i, pourquoi: "affirmation sur un logement jamais examiné" },
  { motif: /pèsera de plus en plus dans votre budget/i, pourquoi: "prédiction budgétaire sans donnée" },
  { motif: /Achat à risque climatique/i, pourquoi: "verdict sur un achat que rien n'a examiné" },
];

test("l'accueil n'affirme plus rien qu'aucune donnée n'établit", () => {
  const restants = INTERDITS.filter(({ motif }) => motif.test(TEASER))
    .map(({ motif, pourquoi }) => `${motif} → ${pourquoi}`);
  assert.deepEqual(restants, [], `Formulations réapparues dans le teaser :\n${restants.join("\n")}`);
});

test("aucune source publique n'est invoquée pour une déduction maison", () => {
  // « Estimation issue du parc français (ADEME) » habillait une règle écrite à la main d'une
  // caution officielle. Citer l'ADEME sous une extrapolation est plus grave que l'extrapolation.
  assert.ok(
    !/Estimation issue du parc français/i.test(TEASER),
    "une déduction interne ne se présente pas sous une source publique",
  );
});

test("passer une question ne remplit plus la réponse à la place du lecteur", () => {
  // `WIZARD_SKIP_DEFAULTS` transformait « je ne sais pas » en « appartement d'âge moyen »,
  // « Services / Numérique », « mixte ». Ces valeurs inventées alimentaient ensuite les signaux,
  // et la trace de ce qui avait été sauté (`unknownAnswers`) n'était jamais persistée avec elles :
  // une fois en base, rien ne distinguait une réponse d'une invention.
  assert.deepEqual(
    WIZARD_SKIP_DEFAULTS,
    {},
    "une absence de réponse doit rester une absence de réponse",
  );
});

test("un questionnaire entièrement passé ne compte pas comme un projet renseigné", () => {
  // Conséquence directe : sans valeurs par défaut, `hasWizardContent` rend false, donc aucune
  // « première lecture » n'est proposée sur la foi de réponses que personne n'a données.
  assert.equal(
    hasWizardContent({ quartier: null, logement: null, metier: null, sante: [], mobilite: null, projets: null }),
    false,
  );
  assert.equal(
    hasWizardContent({ quartier: "Carpentras", logement: null, metier: null, sante: [], mobilite: null, projets: null }),
    true,
  );
});
