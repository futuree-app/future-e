import test from "node:test";
import assert from "node:assert/strict";
import { runValidatedSynthesis, verifierTexte, type GenerateFn } from "./synthesis-run.ts";

// Les garanties de ce chantier vivaient dans le corps d'une route Next, donc nulle part : la revue
// du 11/08/2026 a demandé qu'elles deviennent des assertions. Ce sont elles, et pas la liste de
// motifs, qui décident si un texte fautif peut atteindre un lecteur.

const FAUTIF = "L'adresse ne porte aucune exposition aux inondations ni aux mouvements de sol.";
const CONFORME = "Le diagnostic renseigne une ventilation mécanique, et décrit des murs de résistance thermique intermédiaire.";

/** Un générateur scripté : une réponse par essai, et la trace des corrections reçues. */
function scripte(reponses: (string | null)[]) {
  const corrections: (string | null)[] = [];
  const fn: GenerateFn = async (correction) => {
    corrections.push(correction);
    return reponses[corrections.length - 1] ?? null;
  };
  return { fn, corrections };
}

test("un texte conforme du premier coup est rendu, sans relance", async () => {
  const g = scripte([CONFORME]);
  const r = await runValidatedSynthesis(g.fn, []);
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" && r.texte, CONFORME);
  assert.equal(r.status === "ok" && r.essais, 1);
  assert.deepEqual(g.corrections, [null], "aucune correction ne doit être envoyée au premier essai");
});

test("un texte fautif est relancé AVEC la correction, et le second conforme est rendu", async () => {
  const g = scripte([FAUTIF, CONFORME]);
  const r = await runValidatedSynthesis(g.fn, []);
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" && r.texte, CONFORME, "le texte fautif ne doit jamais être celui qu'on rend");
  assert.equal(r.status === "ok" && r.essais, 2);
  assert.equal(g.corrections.length, 2);
  assert.ok(g.corrections[1], "la relance doit porter une correction");
  assert.match(g.corrections[1]!, /aucune exposition/i, "la correction doit citer le passage en cause");
});

test("deux textes fautifs REFUSENT, et rien ne remonte à l'appelant", async () => {
  // La garantie centrale du chantier : l'ancien code laissait passer le second texte.
  const g = scripte([FAUTIF, "Le bien se trouve à l'abri des crues."]);
  const r = await runValidatedSynthesis(g.fn, []);
  assert.equal(r.status, "refused");
  assert.equal(r.status === "refused" && r.essais, 2);
  // Aucun champ ne porte de texte : la route ne PEUT pas persister ce qu'elle n'a pas.
  assert.equal("texte" in r, false);
  // Le refus retenu est le DERNIER motif, celui de la seconde tentative.
  assert.equal(r.status === "refused" && r.refus.raison, "assertion_protection_supposee");
});

test("un fournisseur muet au premier essai est une PANNE, pas un refus", async () => {
  const g = scripte([null]);
  const r = await runValidatedSynthesis(g.fn, []);
  assert.equal(r.status, "unavailable");
});

test("un fournisseur muet APRÈS un refus reste un refus", async () => {
  // Le texte fautif a existé. L'annoncer comme une panne dirait au lecteur « réessayez dans un
  // instant » alors que c'est le contenu qui posait problème.
  const g = scripte([FAUTIF, null]);
  const r = await runValidatedSynthesis(g.fn, []);
  assert.equal(r.status, "refused");
  assert.equal(r.status === "refused" && r.refus.raison, "assertion_absence_conclue");
});

test("la clôture de couverture est vérifiée en plus des assertions", async () => {
  // Texte sans assertion interdite, mais qui conclut le calme alors qu'une dimension manque.
  const calmeGlobal = "Cette adresse ne porte aucun enjeu structurant identifié.";
  const g = scripte([calmeGlobal, calmeGlobal]);
  const r = await runValidatedSynthesis(g.fn, ["le confort d'été"]);
  assert.equal(r.status, "refused");
  assert.equal(r.status === "refused" && r.refus.raison, "calme_global");
});

test("verifierTexte donne la priorité aux assertions sur la couverture", () => {
  // Un texte qui enfreint les deux doit être renvoyé au modèle sur l'affirmation, qui est la faute
  // la plus grave : la couverture parle de ce qu'on a lu, l'assertion de ce qu'on invente.
  const v = verifierTexte(
    "L'adresse ne porte aucune exposition. Cette adresse ne porte aucun enjeu structurant identifié.",
    ["le confort d'été"],
  );
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.refus.raison, "assertion_absence_conclue");
});
