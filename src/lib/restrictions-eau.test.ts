import test from "node:test";
import assert from "node:assert/strict";
import { libelleRestrictions } from "./restrictions-eau.ts";
import type { VigieauSummary } from "./vigieau.ts";

const summary = (over: Partial<VigieauSummary> = {}): VigieauSummary => ({
  inseeCode: "17300", maxLevel: null, topZone: null, zones: [],
  status: "ok", consultedAt: "2026-08-05T09:30:00.000Z", ...over,
});

test("UNE PANNE N'EST PAS UNE ABSENCE DE RESTRICTION", () => {
  // Le défaut corrigé le 05/08/2026, et le seul qui compte vraiment ici. Avant `status`, une API
  // muette rendait un objet identique à « consulté, rien en vigueur », et l'écran rassurait à tort
  // sur la donnée qui dit ce qui est INTERDIT en ce moment.
  for (const v of [null, undefined, summary({ status: "unavailable" })]) {
    const r = libelleRestrictions(v);
    assert.equal(r.etat, "indisponible", JSON.stringify(v));
    assert.match(r.texte, /non disponible/);
    assert.equal(/aucune restriction/i.test(r.texte), false, "une panne annonce encore une absence");
  }
});

test("CONSULTÉ SANS RESTRICTION : on le dit, et ce n'est pas la même phrase", () => {
  const r = libelleRestrictions(summary({ maxLevel: null }));
  assert.equal(r.etat, "aucune");
  assert.equal(r.texte, "Aucune restriction en cours");
});

test("la vigilance n'est PAS une restriction", () => {
  // Le niveau le plus bas de VigiEau est de la sensibilisation. L'appeler « restriction »
  // contredirait le reste de la carte, et alarmerait sur un usage qui reste permis.
  const r = libelleRestrictions(summary({ maxLevel: "vigilance" }));
  assert.equal(r.etat, "en_vigueur");
  assert.equal(/restriction «/.test(r.texte), false, r.texte);
  assert.match(r.texte, /sans restriction/);
});

test("les trois niveaux restrictifs se nomment", () => {
  for (const [niveau, attendu] of [
    ["alerte", /« alerte » en cours/],
    ["alerte_renforcee", /« alerte renforcée » en cours/],
    ["crise", /« crise » en cours/],
  ] as const) {
    const r = libelleRestrictions(summary({ maxLevel: niveau }));
    assert.equal(r.etat, "en_vigueur", niveau);
    assert.match(r.texte, attendu);
  }
});

test("L'ÉTAT SE LIT SANS PASSER PAR LE TEXTE", () => {
  // Une décision qui dépendrait du libellé casserait au premier ajustement éditorial. `etat` existe
  // pour que l'appelant n'ait jamais à faire de test sur une chaîne rendue à l'écran.
  const etats = [
    libelleRestrictions(null).etat,
    libelleRestrictions(summary()).etat,
    libelleRestrictions(summary({ maxLevel: "crise" })).etat,
  ];
  assert.deepEqual(etats, ["indisponible", "aucune", "en_vigueur"]);
});
