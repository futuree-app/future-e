import test from "node:test";
import assert from "node:assert/strict";
import { pointsAVerifier, introPointsAVerifier } from "./logement-verifications.ts";
import { GESTES } from "./logement-gestes.ts";
import { LOGEMENT_RULES } from "./logement-rules.ts";
import { energyState } from "./logement-coverage.ts";
import type { LogementFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

// LE MODULE LIT LE PROJET DU COMPTE, PLUS UNE RÉPONSE DE SONDE (12/08/2026). La sonde locale
// demandait « Que comptez-vous faire de ce logement ? » à chaque visite sans rien persister, alors
// que le compte connaît déjà la réponse. La dérivation reste celle de `bucketDuProjet`, seule.
// Des projets VALIDES, pas des objets maquillés : `UserProject` exige une `posture`. Les fixtures
// décrivent donc trois lecteurs réels, et le cast ne sert qu'à omettre les champs d'affichage.
const projet = (over: Partial<UserProject>): UserProject => ({
  posture: "adresse", intent: null, rawText: null, parsed: null, updatedAt: null, ...over,
} as UserProject);
const ACHAT = projet({ intent: "achat" });
const LOCATION = projet({ intent: "location" });
const RESIDE = projet({ posture: "habitant" });

// Tous les tests de comportement de l'ancienne `logement-checklist.test.ts` sont repris ici : la
// liste change de moteur, elle ne doit pas changer de contenu.
const RIEN: LogementFacts = {
  dpe: "correct", dpeLabel: "C", confortEteInsuffisant: false,
  rga: "none", expositionBati: false,
  pprn: "none", zoneReglementee: false, pprnLabel: null,
  cavites: "none", caviteProche: false,
  patrimoine: "none", perimetrePatrimonial: false,
  sinistralite: "none", sinistraliteActive: false,
  addressLabel: "12 rue des Tests",
};
const TOUT: LogementFacts = {
  ...RIEN,
  dpe: "passoire", dpeLabel: "G", confortEteInsuffisant: true,
  rga: "present", expositionBati: true,
  pprn: "present", zoneReglementee: true, pprnLabel: "PPRI de la Charente",
  cavites: "present", caviteProche: true,
  patrimoine: "present", perimetrePatrimonial: true,
  sinistralite: "present", sinistraliteActive: true,
};

// ── Le socle : rien à signaler, tout à signaler ────────────────────────────────────────────

test("aucun fait saillant : aucune ligne", () => {
  assert.deepEqual(pointsAVerifier(RIEN, ACHAT), []);
});

test("un point par famille déclenchée, dans l'ordre des preuves", () => {
  assert.deepEqual(pointsAVerifier(TOUT, ACHAT).map((p) => p.id), [
    "logement.dpe-faible",
    "logement.confort-ete",
    "logement.exposition-bati",
    "logement.zone-reglementee",
    "logement.sinistralite",
    "logement.cavite",
    "logement.patrimoine",
  ]);
});

test("dpe correct ou absent : aucun point énergie", () => {
  assert.deepEqual(pointsAVerifier({ ...RIEN, dpe: "correct" }, ACHAT), []);
  assert.deepEqual(pointsAVerifier({ ...RIEN, dpe: "absent" }, ACHAT), []);
});

// ── L'ordre ne suit pas le tableau des règles ──────────────────────────────────────────────

test("l'ordre affiché est déclaré, pas hérité de l'ordre d'enregistrement des règles", () => {
  // Dans `LOGEMENT_RULES`, le confort d'été est enregistré AVANT le DPE. La liste, elle, ouvre sur
  // l'énergie : un ajout de règle ne doit pas déplacer la lecture sans que personne le décide.
  const registre = LOGEMENT_RULES.map((r) => r.id);
  assert.ok(registre.indexOf("logement.confort-ete") < registre.indexOf("logement.dpe-faible"));
  const affiche = pointsAVerifier(TOUT, ACHAT).map((p) => p.id);
  assert.ok(affiche.indexOf("logement.dpe-faible") < affiche.indexOf("logement.confort-ete"));
});

// ── Les postures ───────────────────────────────────────────────────────────────────────────

test("le texte change avec le projet ; un projet inconnu vaut neutre", () => {
  const f = { ...RIEN, pprn: "present" as const, zoneReglementee: true };
  const achat = pointsAVerifier(f, ACHAT)[0].text;
  const reside = pointsAVerifier(f, RESIDE)[0].text;
  const neutre = pointsAVerifier(f, null)[0].text;
  const autre = pointsAVerifier(f, "autre")[0].text;
  assert.notEqual(achat, reside);
  assert.notEqual(achat, neutre);
  assert.equal(autre, neutre);
});

test("patrimoine : un point en achat, en résidence et en neutre, aucun en location", () => {
  const f = { ...RIEN, patrimoine: "present" as const, perimetrePatrimonial: true };
  for (const projet of [ACHAT, RESIDE, null]) {
    assert.deepEqual(pointsAVerifier(f, projet).map((p) => p.id), ["logement.patrimoine"], `projet=${JSON.stringify(projet)}`);
  }
  // Un locataire ne fait pas ces travaux : la règle l'écarte, et aucune ligne vide ne subsiste.
  assert.deepEqual(pointsAVerifier(f, LOCATION), []);
});

test("cavité : un point dans les quatre postures, avec un texte adapté", () => {
  const f = { ...RIEN, cavites: "present" as const, caviteProche: true };
  for (const projet of [null, ACHAT, RESIDE, LOCATION]) {
    const points = pointsAVerifier(f, projet);
    assert.deepEqual(points.map((p) => p.id), ["logement.cavite"], `projet=${JSON.stringify(projet)}`);
    assert.ok(points[0].text.length > 0);
  }
  assert.match(pointsAVerifier(f, ACHAT)[0].text, /fondation|sol/i);
  assert.match(pointsAVerifier(f, LOCATION)[0].text, /bailleur/i);
});

test("le confort d'été est un geste à part entière, dans les quatre postures", () => {
  const f = { ...RIEN, confortEteInsuffisant: true };
  for (const projet of [ACHAT, LOCATION, RESIDE, null]) {
    const points = pointsAVerifier(f, projet);
    assert.equal(points.length, 1, `projet=${JSON.stringify(projet)}`);
    assert.equal(points[0].id, "logement.confort-ete");
    assert.ok(points[0].text.length > 40);
  }
});

// ── Le diagnostic non attribué : le geste que le dossier ne proposait pas ───────────────────

test("diagnostic non attribué : le geste existe, et il ouvre la liste", () => {
  const f = { ...RIEN, dpe: "absent" as const, dpeLabel: null, diagnosticNonAttribue: true };
  const points = pointsAVerifier(f, ACHAT);
  assert.deepEqual(points.map((p) => p.id), ["logement.diagnostic-non-attribue"]);
  assert.ok(points[0].text.startsWith(GESTES.diagnostic_adresse.achat.label));
});

test("diagnostic non établi : aucune ligne, et surtout aucune affirmation", () => {
  // `undefined` veut dire que la liste des diagnostics de l'adresse n'a pas été demandée. Se taire
  // est correct ; écrire « aucun document à réclamer » serait une affirmation sans fondement.
  assert.deepEqual(pointsAVerifier({ ...RIEN, dpe: "absent" }, ACHAT), []);
  assert.deepEqual(pointsAVerifier({ ...RIEN, dpe: "absent", diagnosticNonAttribue: false }, ACHAT), []);
});

// ── Une source muette ne produit aucun geste ───────────────────────────────────────────────

test("source en panne : aucun geste, jamais un geste inventé", () => {
  // La règle émet alors une INCONNUE, que le dossier montre dans sa propre section. Le module, lui,
  // liste des gestes : une donnée illisible n'en fournit aucun.
  const f: LogementFacts = { ...RIEN, rga: "unavailable", pprn: "unavailable", cavites: "unavailable", patrimoine: "unavailable", sinistralite: "unavailable" };
  assert.deepEqual(pointsAVerifier(f, ACHAT), []);
});

// ── Le texte est celui du dossier, mot pour mot ────────────────────────────────────────────

test("UN SEUL TEXTE PAR GESTE : la liste dit exactement ce que dit le dossier", () => {
  const f = { ...RIEN, dpe: "passoire" as const, dpeLabel: "G" };
  for (const [projet, bucket] of [[ACHAT, "achat"], [LOCATION, "location"], [null, "neutre"]] as const) {
    const texte = pointsAVerifier(f, projet)[0].text;
    assert.ok(texte.startsWith(GESTES.energie[bucket].label), `posture ${bucket} : le label ouvre la phrase`);
    assert.ok(texte.includes(GESTES.energie[bucket].detail), `posture ${bucket} : le détail suit`);
  }
});

test("LE VERBE « VÉRIFIER » N'OUVRE AUCUN GESTE", () => {
  for (const projet of [ACHAT, LOCATION, RESIDE, null]) {
    for (const p of pointsAVerifier({ ...TOUT, diagnosticNonAttribue: true }, projet)) {
      assert.doesNotMatch(p.text, /^Vérifi/, `« ${p.text.slice(0, 40)}… »`);
    }
  }
});

// ── Les faits minimaux suffisent aux règles ────────────────────────────────────────────────

test("les règles Logement ne lisent que le logement : aucun fait communal n'est requis", () => {
  // Le module n'a pas les faits de la commune. Si une règle Logement venait à en lire un, elle
  // lèverait ici, plutôt que de rendre une liste incomplète en silence chez le lecteur.
  assert.doesNotThrow(() => pointsAVerifier(TOUT, ACHAT));
  assert.doesNotThrow(() => pointsAVerifier(RIEN, null));
});

// ── L'intro ────────────────────────────────────────────────────────────────────────────────

test("l'intro distingue le neutre d'un projet déclaré", () => {
  assert.notEqual(introPointsAVerifier(null), introPointsAVerifier(ACHAT));
  assert.equal(introPointsAVerifier("autre"), introPointsAVerifier(null));
});

// ── L'étiquette ────────────────────────────────────────────────────────────────────────────

test("energyState mappe les étiquettes", () => {
  assert.equal(energyState("G"), "passoire");
  assert.equal(energyState("f"), "passoire");
  assert.equal(energyState("E"), "energivore");
  assert.equal(energyState("C"), "correct");
  assert.equal(energyState(null), "absent");
});

// ── Le projet vient du COMPTE, plus d'une sonde locale ─────────────────────────────────────

test("un projet d'achat déclaré au COMPTE oriente la liste, sans sonde locale", () => {
  // Le compte connaît l'intention : la redemander à chaque ouverture du module était une question
  // dont on avait la réponse, et elle repartait à chaque visite sans être persistée.
  assert.notDeepEqual(pointsAVerifier(TOUT, ACHAT), pointsAVerifier(TOUT, RESIDE));
  // Sans projet, aucune posture n'est devinée : `bucketDuProjet` rend `neutre` et l'intro le dit.
  assert.match(introPointsAVerifier(null), /Votre projet permettra/);
});

test("HABITANT QUI ACHÈTE : l'intention gagne, et c'est la règle de bucketDuProjet", () => {
  // Le locataire qui achète le logement où il vit est un cas réel. L'écran permet de poser les deux,
  // et une seule fonction arbitre : `bucketDuProjet` teste l'intention avant la posture. Ce test
  // existe pour que personne ne « corrige » cet ordre en croyant réparer une incohérence.
  const habitantQuiAchete = projet({ posture: "habitant", intent: "achat" });
  assert.deepEqual(pointsAVerifier(TOUT, habitantQuiAchete), pointsAVerifier(TOUT, ACHAT));
  assert.notDeepEqual(pointsAVerifier(TOUT, habitantQuiAchete), pointsAVerifier(TOUT, RESIDE));
});
