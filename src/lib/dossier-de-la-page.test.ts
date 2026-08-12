import test from "node:test";
import assert from "node:assert/strict";
import { dossierIdDeLaPage } from "./dossier-de-la-page.ts";

// LE CAS QUI A MOTIVÉ CE MODULE, mesuré au navigateur le 11/08/2026 : contexte sur La Rochelle,
// ouverture directe du logement nantais, page correcte, et « Une question sur La Rochelle ? » en
// bas d'écran. La question partait vers le mauvais territoire, `communeInsee` étant transmis tel
// quel à l'API.

test("une page d'adresse avec identifiant donne le bien lu", () => {
  assert.equal(dossierIdDeLaPage("/rapport/logement?dossierId=abc-123"), "abc-123");
  assert.equal(dossierIdDeLaPage("/rapport/autour?dossierId=abc-123"), "abc-123");
  // D'autres paramètres peuvent coexister (traçage, ancre de retour).
  assert.equal(dossierIdDeLaPage("/rapport/logement?src=mail&dossierId=abc-123#dpe"), "abc-123");
});

test("les autres pages gardent le territoire du profil", () => {
  // Sur le hub, le Territoire ou le compte, il n'y a pas de bien en cours de lecture : le dernier
  // connu est la bonne réponse, et forcer un contexte ici serait faux.
  for (const url of ["/rapport", "/rapport/quartier?dossierId=abc-123", "/compte", "/"]) {
    assert.equal(dossierIdDeLaPage(url), null, url);
  }
});

test("une page d'adresse SANS identifiant ne déduit rien", () => {
  // Elle se redirige d'elle-même vers le bien actif : deviner ici doublerait cette décision, et les
  // deux pourraient diverger.
  assert.equal(dossierIdDeLaPage("/rapport/logement"), null);
  assert.equal(dossierIdDeLaPage("/rapport/autour?dossierId="), null);
  assert.equal(dossierIdDeLaPage("/rapport/autour?dossierId=%20"), null);
});

test("une URL absente ou illisible ne fait pas tomber le rendu", () => {
  // L'en-tête peut manquer (rendu hors requête, test, appel interne) : le contexte retombe alors sur
  // le profil, jamais sur une erreur.
  assert.equal(dossierIdDeLaPage(null), null);
  assert.equal(dossierIdDeLaPage(undefined), null);
  assert.equal(dossierIdDeLaPage(""), null);
  assert.equal(dossierIdDeLaPage("://pas une url"), null);
});

test("un chemin voisin ne se fait pas passer pour une page d'adresse", () => {
  // `/rapport/logements` ou `/rapport/logement-old` ne sont pas la page Logement : sans cette
  // exigence, une route future hériterait d'un contexte qu'elle n'a pas demandé.
  assert.equal(dossierIdDeLaPage("/rapport/logements?dossierId=abc"), null);
  assert.equal(dossierIdDeLaPage("/rapport/logement-archive?dossierId=abc"), null);
  // Un sous-chemin, en revanche, appartient bien à la page.
  assert.equal(dossierIdDeLaPage("/rapport/logement/dpe?dossierId=abc"), "abc");
});
