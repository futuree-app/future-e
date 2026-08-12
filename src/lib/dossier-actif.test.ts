import test from "node:test";
import assert from "node:assert/strict";
import { choisirDossierActif } from "./dossier-actif.ts";

// Les dossiers arrivent tels que `listDossiers` les rend : création décroissante, le plus récent
// d'abord. Ce module ne retrie pas.
const EVESCOT = { id: "evescot", insee: "17300", created_at: "2026-08-03T10:00:00.000Z" };
const SAINT_DOMINIQUE = { id: "saint-dominique", insee: "17300", created_at: "2026-07-29T10:00:00.000Z" };
const CREBILLON = { id: "crebillon", insee: "44109", created_at: "2026-08-01T10:00:00.000Z" };
const PARIS_7 = { id: "paris7", insee: "75107", created_at: "2026-07-30T10:00:00.000Z" };

test("le bien ouvert en dernier gagne, même s'il n'est pas le plus récemment créé", () => {
  // LE DÉFAUT D'ORIGINE. Ouvrir le 1 rue Saint-Dominique puis revenir au hub réaffichait le 29 rue
  // de l'Evescot, créé après, sans un mot.
  const c = choisirDossierActif([EVESCOT, SAINT_DOMINIQUE, CREBILLON], "17300", "saint-dominique");
  assert.equal(c.dossier?.id, "saint-dominique");
  assert.equal(c.raison, "actif");
  assert.deepEqual(c.autres.map((d) => d.id), ["evescot"]);
});

test("un bien actif d'une AUTRE commune ne suit pas le lecteur", () => {
  // Basculer de Nantes à La Rochelle ne doit pas servir l'appartement nantais : le bien actif est
  // une préférence de lecture, jamais une autorisation ni un contexte global.
  // Deux biens à La Rochelle, pour que le repli soit distinguable du cas « un seul candidat » : ce
  // qu'on veut prouver, c'est que l'actif nantais n'influence RIEN, pas qu'il n'y a qu'un choix.
  const c = choisirDossierActif([EVESCOT, SAINT_DOMINIQUE, CREBILLON], "17300", "crebillon");
  assert.equal(c.dossier?.id, "evescot");
  assert.equal(c.raison, "repli_plus_recent");
  assert.deepEqual(c.autres.map((d) => d.id), ["saint-dominique"]);
});

test("sans bien actif, le plus récemment créé, et la raison le DIT", () => {
  // Le repli reste le comportement d'avant. Ce qui change, c'est qu'il s'annonce : l'écran peut
  // nommer le bien lu et proposer les autres, au lieu de choisir en silence.
  const c = choisirDossierActif([EVESCOT, SAINT_DOMINIQUE], "17300", null);
  assert.equal(c.dossier?.id, "evescot");
  assert.equal(c.raison, "repli_plus_recent");
  assert.deepEqual(c.autres.map((d) => d.id), ["saint-dominique"]);
});

test("un seul bien dans la commune : « unique », et aucun autre à proposer", () => {
  // La distinction compte pour l'écran : « unique » n'appelle aucun sélecteur, quand
  // « repli_plus_recent » en appelle un.
  const c = choisirDossierActif([EVESCOT, CREBILLON], "17300", null);
  assert.equal(c.dossier?.id, "evescot");
  assert.equal(c.raison, "unique");
  assert.deepEqual(c.autres, []);
});

test("un identifiant actif qui ne désigne plus rien retombe proprement", () => {
  // Dossier supprimé, accès révoqué, identifiant d'un autre compte : la colonne peut pointer dans
  // le vide, et le hub ne doit ni se vider ni lever.
  const c = choisirDossierActif([EVESCOT, SAINT_DOMINIQUE], "17300", "dossier-disparu");
  assert.equal(c.dossier?.id, "evescot");
  assert.equal(c.raison, "repli_plus_recent");
});

test("aucune commune lue, ou aucun bien : rien, sans lever", () => {
  assert.equal(choisirDossierActif([EVESCOT], null, "evescot").dossier, null);
  assert.equal(choisirDossierActif([EVESCOT], undefined, null).raison, "aucun");
  assert.equal(choisirDossierActif([], "17300", null).raison, "aucun");
  assert.equal(choisirDossierActif([CREBILLON], "17300", null).dossier, null);
});

test("les arrondissements suivent leur commune", () => {
  // Un dossier au 7e arrondissement de Paris s'ouvre quand le hub lit Paris, et réciproquement :
  // c'est déjà la règle du droit territorial, elle vaut aussi pour le choix du bien.
  assert.equal(choisirDossierActif([PARIS_7], "75056", null).dossier?.id, "paris7");
  assert.equal(choisirDossierActif([PARIS_7], "75107", null).dossier?.id, "paris7");
  assert.equal(choisirDossierActif([PARIS_7], "75112", null).dossier?.id, "paris7");
});

test("le repli ne dépend plus de l'ordre reçu : la règle trie ce dont elle dépend", () => {
  // Elle prenait le premier élément de la liste, en supposant le tri de `listDossiers`. Un
  // changement d'`order` dans le store aurait renversé le choix en silence.
  const desordre = [SAINT_DOMINIQUE, EVESCOT]; // le plus ancien d'abord
  assert.equal(choisirDossierActif(desordre, "17300", null).dossier?.id, "evescot");
});

test("à dates égales, l'identifiant départage : le hub ne change pas d'avis au rechargement", () => {
  // Deux dossiers créés dans la même seconde, ou deux `created_at` identiques après une reprise de
  // données. Sans second critère, l'ordre dépendrait de la base et le bien lu pourrait varier d'un
  // rechargement à l'autre, sans que rien n'ait changé.
  const a = { id: "aaa", insee: "17300", created_at: "2026-08-03T10:00:00.000Z" };
  const b = { id: "bbb", insee: "17300", created_at: "2026-08-03T10:00:00.000Z" };
  assert.equal(choisirDossierActif([a, b], "17300", null).dossier?.id, "aaa");
  assert.equal(choisirDossierActif([b, a], "17300", null).dossier?.id, "aaa");
});
