import test from "node:test";
import assert from "node:assert/strict";
import { validateAssertions, correctionPourAssertions } from "./synthesis-guardrails.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES TROIS SORTIES RÉELLES, MOT POUR MOT.
//
// Capturées le 11/08/2026 depuis `address_dossiers.synthesis_text` en production. Elles sont la
// raison d'être de ce module : chacune a été servie à l'écran, dans un dossier payé. Analyse :
// `docs/audits/2026-08-11-syntheses-logement-fautives.md`.
//
// Ne pas les « nettoyer » : leur valeur de test vient de leur exactitude.
// ════════════════════════════════════════════════════════════════════════════════════════════

const EVESCOT = `Le secteur où se trouve ce logement est classé en exposition forte au sol argileux qui gonfle avec l'humidité et se rétracte en période sèche. Ce phénomène concerne le terrain à cette adresse, pas seulement la commune, et il est d'autant plus à considérer que le bâti est bas : à 7,5 mètres d'altitude, les fondations sont proches d'un sol qui, selon les saisons, travaille.`;

const SAINT_DOMINIQUE = `L'exposition au sol argileux concentre l'enjeu à la parcelle, d'autant que l'altitude de 8 mètres environ n'éloigne pas le bien des contraintes de sol propres à ce secteur. La performance énergétique de ce logement et son comportement en été restent non qualifiés, faute de diagnostic attribuable.`;

const CREBILLON = `L'adresse ne porte aucune exposition aux inondations ni aux mouvements de sol. La sinistralité communale liée aux inondations repose sur un échantillon trop restreint pour être significatif à l'échelle de Nantes.`;

test("la sortie du 29 Evescot est refusée (altitude devenue signal)", () => {
  const v = validateAssertions(EVESCOT);
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.famille, "altitude");
});

test("la sortie du 1 Saint-Dominique est refusée (même faute, tournure négative)", () => {
  // Celle-ci n'avait été relevée par aucun audit : la faute se cachait sous « n'éloigne pas ».
  const v = validateAssertions(SAINT_DOMINIQUE);
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.famille, "altitude");
});

test("la sortie du 2 Crébillon est refusée (absence d'exposition conclue)", () => {
  const v = validateAssertions(CREBILLON);
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.famille, "absence_conclue");
});

// ── Ce qui doit PASSER : le coût d'un faux positif est la prose entière ────────────────────────

test("une lecture honnête du même dossier passe", () => {
  // Les deux premiers paragraphes réels de Crébillon, qui ne portent aucune faute : ils décrivent
  // le diagnostic fourni et nomment ce qu'il ne renseigne pas.
  const bon = `Le diagnostic de ce petit appartement de 20,5 m² renseigne une ventilation mécanique qui régule l'humidité en continu : c'est le trait le plus concret que le diagnostic donne sur son fonctionnement quotidien, et il explique en partie la classe D malgré une surface aussi réduite.

Pour les beaux jours, le diagnostic indique que l'air peut traverser l'appartement d'une façade à l'autre, et que ses murs offrent une résistance thermique intermédiaire à la chaleur. Les protections solaires aux fenêtres ne sont pas renseignées dans le diagnostic : c'est le point qui reste ouvert sur ce chapitre.`;
  assert.equal(validateAssertions(bon).ok, true);
});

test("nommer une lacune reste permis, conclure une absence ne l'est pas", () => {
  // La frontière tient à un seul mouvement : décrire ce qu'on ne sait pas, ou affirmer qu'il n'y a
  // rien. Sans ce désamorçage, la formulation honnête serait refusée avec la fautive.
  assert.equal(
    validateAssertions("Aucune exposition n'a pu être établie à cette parcelle, faute de zonage consultable.").ok,
    true,
  );
  assert.equal(
    validateAssertions("L'adresse ne porte aucune exposition aux mouvements de sol.").ok,
    false,
  );
});

test("un zonage qui EXISTE se nomme sans être refusé", () => {
  const v = validateAssertions(
    "Un plan de prévention du risque inondation couvre le périmètre de cette adresse, et le secteur y est classé en aléa moyen.",
  );
  assert.equal(v.ok, true);
});

test("une protection supposée est refusée", () => {
  const v = validateAssertions("Le bien se trouve à l'abri des crues du fleuve voisin.");
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.famille, "protection_supposee");
});

// ── La relance dit au modèle CE QU'IL a écrit, pas seulement une règle ─────────────────────────

test("la correction cite le passage en cause et vise la bonne famille", () => {
  const v = validateAssertions(EVESCOT);
  assert.equal(v.ok, false);
  if (v.ok) return;
  const c = correctionPourAssertions(v);
  assert.match(c, /altitude/);
  assert.match(c, /7,5 mètres/);
  // Une consigne qui ne dirait que « respectez vos règles » relancerait le même texte : le modèle
  // vient précisément de croire qu'il les respectait.
  assert.ok(c.length > 200, "la correction doit porter la consigne ET le passage");
});

test("accents et apostrophes typographiques ne contournent pas le filet", () => {
  // Les motifs sont écrits sans diacritiques ; sans la normalisation, « prévention » et « l'abri »
  // avec une apostrophe courbe passeraient au travers, et le filet ne tiendrait que sur le clavier
  // d'un développeur.
  assert.equal(validateAssertions("Il n'y a pas de plan de prévention sur cette parcelle.").ok, false);
  assert.equal(validateAssertions("Le bien est à l’abri des crues.").ok, false);
});
