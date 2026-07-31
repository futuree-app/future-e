import test from "node:test";
import assert from "node:assert/strict";
import { validateCoverageClosure, correctionPourClosure } from "./coverage-closure.ts";

const ENERGIE = "la performance énergétique de ce logement";
const CONFORT = "son comportement en été";
const EXPO = "ce à quoi son adresse est exposée";
const SINISTRES = "les sinistres indemnisés dans la commune";

// Le texte RÉEL produit en production le 30/07/2026, celui qui a motivé tout ce module.
const FAUTIF = `Le sol autour de cette adresse présente une faible exposition aux mouvements liés
à l'humidité. Aucun diagnostic énergétique n'est rattaché à ce logement, et aucun zonage
réglementaire ne s'applique à l'adresse.

L'adresse ne porte pas d'enjeu structurant identifié.`;

// Le texte RÉEL produit après correction, le 31/07/2026.
const CORRIGE = `Le sol autour de cette adresse, en secteur d'exposition faible au gonflement
argileux, ne pose pas de question particulière sur le bâti.

Ce qui reste ouvert, c'est ce qu'on n'a pas pu lire : la performance énergétique de ce logement et
son comportement en été n'ont pas pu être qualifiés, faute de diagnostic attribuable.`;

// ── Rien à garder quand tout a été lu ──────────────────────────────────────────────────────

test("couverture complète : aucune contrainte, le texte peut conclure sur l'ensemble", () => {
  assert.deepEqual(validateCoverageClosure("L'adresse ne porte pas d'enjeu structurant identifié.", []), { ok: true });
});

// ── Le cas qui a motivé le verrou ──────────────────────────────────────────────────────────

test("le texte fautif du 30/07 est REFUSÉ", () => {
  const v = validateCoverageClosure(FAUTIF, [ENERGIE, CONFORT]);
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.raison, "calme_global");
});

test("le texte corrigé du 31/07 est ACCEPTÉ", () => {
  assert.deepEqual(validateCoverageClosure(CORRIGE, [ENERGIE, CONFORT]), { ok: true });
});

// ── La règle positive ──────────────────────────────────────────────────────────────────────

test("un texte muet sur ses inconnues est refusé, même sans formule interdite", () => {
  // C'est le vrai garde-fou : la langue invente toujours une tournure de plus, donc on n'essaie
  // pas de les lister. On exige que l'inconnue soit nommée.
  const muet = "Le sol de cette parcelle est stable et la commune n'est pas en zone réglementée.";
  const v = validateCoverageClosure(muet, [ENERGIE, CONFORT]);
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.raison, "dimension_non_nommee");
});

test("nommer UNE seule dimension non lue suffit", () => {
  // Le prompt demande une phrase, pas quatre : exiger toutes les mentions rejetterait un texte
  // correct. Ce qu'on empêche, c'est le silence complet.
  const t = "La performance énergétique de ce logement n'a pas pu être établie.";
  assert.deepEqual(validateCoverageClosure(t, [ENERGIE, CONFORT, EXPO, SINISTRES]), { ok: true });
});

test("PIÈGE DES ACCENTS : « a été lu » ne compte pas comme nommer le confort d'été", () => {
  // Première version de la table écrite avec « ete » comme mot-clé : après normalisation, il
  // matchait « a été », donc n'importe quel texte français passait et le verrou ne verrouillait
  // plus rien.
  const t = "Tout ce qui a été lu ici est favorable, et le reste a été écarté.";
  const v = validateCoverageClosure(t, [CONFORT]);
  assert.equal(v.ok, false, "un participe passé ne nomme pas une dimension");
});

test("le confort d'été se reconnaît par ses vraies formulations", () => {
  for (const t of [
    "Son comportement en été reste inconnu.",
    "Le confort d'été n'a pas pu être qualifié.",
    "Sa réaction aux fortes chaleurs n'est pas documentée.",
    "Rien ne dit comment il se comporte en période de canicule.",
  ]) {
    assert.deepEqual(validateCoverageClosure(t, [CONFORT]), { ok: true }, t);
  }
});

test("les accents et apostrophes typographiques ne font pas échouer la reconnaissance", () => {
  const t = "Le confort d’été de ce logement n’a pas pu être qualifié.";
  assert.deepEqual(validateCoverageClosure(t, [CONFORT]), { ok: true });
});

// ── La liste noire ─────────────────────────────────────────────────────────────────────────

test("la liste noire attrape le calme global même si une dimension est nommée par ailleurs", () => {
  // Un texte peut nommer l'inconnue PUIS conclure au calme de l'ensemble : c'est le pire cas,
  // parce qu'il a l'air scrupuleux.
  const t = "La performance énergétique reste inconnue. Au total, l'adresse ne porte aucun enjeu.";
  const v = validateCoverageClosure(t, [ENERGIE]);
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.raison, "calme_global");
});

test("une phrase BORNÉE contenant « rien de structurant » reste acceptée", () => {
  // La raison pour laquelle la liste noire est minuscule : un filtre sur « rien de structurant »
  // rejetterait la bonne formulation, celle qui borne explicitement son périmètre.
  const t = "Rien de structurant ne ressort de ce qui a pu être lu. La performance énergétique de ce logement reste non qualifiée.";
  assert.deepEqual(validateCoverageClosure(t, [ENERGIE]), { ok: true });
});

// ── La consigne de reprise ─────────────────────────────────────────────────────────────────

test("la correction nomme le défaut constaté ET les dimensions à reprendre", () => {
  const v = validateCoverageClosure(FAUTIF, [ENERGIE, CONFORT]);
  assert.equal(v.ok, false);
  const c = correctionPourClosure(v as Extract<typeof v, { ok: false }>, [ENERGIE, CONFORT]);
  assert.ok(c.includes("refusé"));
  assert.ok(c.includes(ENERGIE), "les libellés exacts sont rappelés");
  assert.ok(c.includes(CONFORT));
  // Elle ne doit pas prescrire de geste : c'est la règle du prompt, et la reprise ne la casse pas.
  assert.equal(/demandez|faites v/i.test(c), false);
});
