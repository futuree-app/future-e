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

test("une lecture strictement descriptive passe", () => {
  // TEXTE DESCRIPTIF, PAS « HONNÊTE » (revue du 11/08/2026). La version précédente de ce test
  // utilisait le paragraphe réel de Crébillon, qui contient « il explique en partie la classe D » :
  // une causalité que le payload n'établit pas. Le filet ne la détecte pas, et c'est assumé, mais
  // un test ne doit pas la CONSACRER comme exemple de ce qui est correct.
  //
  // Ce texte-ci ne fait que rapporter ce que le diagnostic renseigne, et nommer ce qu'il ne
  // renseigne pas.
  const bon = `Le diagnostic de cet appartement de 20,5 m² renseigne une ventilation mécanique, qui renouvelle l'air en continu.

Il indique que l'air peut traverser le logement d'une façade à l'autre, et décrit des murs de résistance thermique intermédiaire. Les protections solaires aux fenêtres ne sont pas renseignées.`;
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

// ── Ce que la revue du 11/08/2026 a trouvé, et qui doit rester mort ────────────────────────────

test("une phrase honnête ne couvre pas une phrase fautive qui la suit", () => {
  // Le désamorçage travaillait sur une fenêtre de caractères après la PREMIÈRE occurrence : la
  // phrase honnête absorbait la fautive, et l'affirmation passait.
  const v = validateAssertions(
    "Aucune exposition n'a pu être établie faute de données. Pourtant, l'adresse ne porte aucune exposition aux inondations.",
  );
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.famille, "absence_conclue");
  // Le refus cite la phrase FAUTIVE, pas la première du texte.
  assert.match(v.ok === false ? v.extrait : "", /Pourtant/);
});

test("une incertitude sur un AUTRE sujet ne désamorce rien", () => {
  // « Son confort d'été n'a pas pu être établi » parle du confort, pas de l'exposition : hors de la
  // phrase, un marqueur d'incertitude ne qualifie pas l'affirmation qui précède.
  const v = validateAssertions(
    "L'adresse ne porte aucune exposition aux inondations. Son confort d'été n'a pas pu être établi.",
  );
  assert.equal(v.ok, false);
  assert.equal(v.ok === false && v.famille, "absence_conclue");
});

test("un nom de rue n'est pas une protection", () => {
  // « 2 rue de la Digue » était refusé : un odonyme n'affirme rien, et un faux positif coûte toute
  // la prose du module.
  assert.equal(validateAssertions("Le logement est situé 2 rue de la Digue, dans un immeuble de 1930.").ok, true);
  // L'ouvrage compte quand il PROTÈGE.
  assert.equal(validateAssertions("Une digue protège ce quartier des crues du fleuve.").ok, false);
});

test("plusieurs phrases honnêtes d'affilée passent, quel que soit leur ordre", () => {
  assert.equal(
    validateAssertions(
      "Le confort d'été n'a pas pu être établi, faute de diagnostic attribuable. Aucune exposition n'a pu être établie à la parcelle.",
    ).ok,
    true,
  );
});
