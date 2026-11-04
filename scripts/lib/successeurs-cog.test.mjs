// FUT-137 · La table des successeurs du COG, sur un COG fictif : chaque cas de la règle, isolé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { construireSuccesseurs } from "./successeurs-cog.mjs";

const mvt = (MOD, DATE_EFF, COM_AV, COM_AP, TYPECOM_AV = "COM", TYPECOM_AP = "COM") => ({ MOD, DATE_EFF, TYPECOM_AV, COM_AV, TYPECOM_AP, COM_AP });

// Communes en vigueur : C1, C2, C3, R, S, R2, P (P est hors de l'index, comme une commune d'outre-mer).
const COMMUNES = new Set(["C1", "C2", "C3", "R", "S", "R2", "P"]);
const REFERENTIEL = new Set(["C1", "C2", "C3", "R", "S", "R2"]);
const MOUVEMENTS = [
  mvt("32", "2016-01-01", "A1", "C1"), mvt("32", "2016-01-01", "A1", "A1", "COM", "COMD"), // fusion simple
  mvt("33", "1973-01-01", "A2", "B2"), mvt("50", "1990-02-01", "B2", "B3"), mvt("32", "2017-01-01", "B3", "C2"), // trois mouvements
  mvt("50", "2024-03-04", "A3", "C3"), // changement de code seul (transfert de chef-lieu)
  mvt("32", "2019-01-01", "A4", "R"), mvt("21", "2024-01-01", "R", "R"), mvt("21", "2024-01-01", "R", "S"), // découpée après
  mvt("32", "2019-01-01", "A5", "R2"), mvt("21", "1988-01-01", "R2", "R2"), mvt("21", "1988-01-01", "R2", "Q"), // découpée avant
  mvt("31", "2000-01-01", "X", "Y"), mvt("31", "2001-01-01", "Y", "X"), // chaîne circulaire
  mvt("32", "2016-01-01", "A6", "P"), // vers une commune hors de l'index
  mvt("10", "2025-01-11", "C1", "C1"), // changement de nom : ne déplace rien
];
const table = (parents = new Map(), mouvements = MOUVEMENTS) => construireSuccesseurs({ communes: COMMUNES, parents, mouvements, referentiel: REFERENTIEL });

test("une commune fusionnée va à sa destination unique", () => {
  assert.equal(table().rattaches.A1, "C1");
});

test("une chaîne de plusieurs mouvements est suivie jusqu'à la commune actuelle", () => {
  const t = table();
  assert.equal(t.rattaches.A2, "C2");
  assert.equal(t.rattaches.B2, "C2"); // les codes intermédiaires aussi, chacun une seule fois
  assert.equal(t.rattaches.B3, "C2");
});

test("un simple changement de code rattache l'ancien code au nouveau", () => {
  assert.equal(table().rattaches.A3, "C3");
});

test("commune d'arrivée découpée après l'arrivée : abstention, rien n'est réparti ni donné à celle qui garde le code", () => {
  const t = table();
  assert.equal(t.rattaches.A4, undefined);
  assert.deepEqual(t.abstentions.A4, { motif: "retablissement_posterieur", commune: "R", arrivee: "2019-01-01", decoupage: ["2024-01-01"] });
});

test("la commune de rattachement officielle (déléguée au COG en vigueur) lève l'ambiguïté", () => {
  const t = table(new Map([["A4", "S"]]));
  assert.equal(t.rattaches.A4, "S");
  assert.deepEqual(t.parRattachementOfficiel, ["A4"]);
  assert.equal(t.abstentions.A4, undefined);
});

test("un découpage antérieur à l'arrivée du code ne crée pas d'ambiguïté", () => {
  assert.equal(table().rattaches.A5, "R2");
});

test("une commune en vigueur n'est jamais un code disparu (déjà rattachée à elle-même)", () => {
  const t = table();
  for (const c of COMMUNES) {
    assert.equal(t.rattaches[c], undefined, c);
    assert.equal(t.abstentions[c], undefined, c);
  }
});

test("chaîne circulaire ou sans issue : abstention, jamais une commune au hasard", () => {
  const t = table();
  assert.deepEqual([t.abstentions.X, t.abstentions.Y], [{ motif: "sans_successeur" }, { motif: "sans_successeur" }]);
});

test("une commune actuelle hors de l'index : abstention motivée", () => {
  const t = table();
  assert.deepEqual(t.abstentions.A6, { motif: "hors_index", commune: "P" });
  assert.deepEqual(t.communesHorsIndex, ["P"]);
});

test("chaîne univoque et commune de rattachement divergentes : refus, pas de choix silencieux", () => {
  assert.throws(() => table(new Map([["A1", "C2"]])), /A1 : la chaîne du COG mène à C1, le COG en vigueur le rattache à C2/);
  assert.equal(table(new Map([["A1", "C1"]])).rattaches.A1, "C1"); // accord : rattaché, sans voie particulière
  assert.deepEqual(table(new Map([["A1", "C1"]])).parRattachementOfficiel, []);
});

test("chaque code disparu a exactement une issue : un rattachement OU une abstention", () => {
  const t = table();
  const disparus = new Set(MOUVEMENTS.filter((m) => m.TYPECOM_AV === "COM" && !COMMUNES.has(m.COM_AV)).map((m) => m.COM_AV));
  for (const c of disparus) assert.equal((c in t.rattaches) + (c in t.abstentions), 1, c);
  assert.equal(Object.keys(t.rattaches).length + Object.keys(t.abstentions).length, disparus.size);
});

test("la table ne dépend pas de l'ordre des mouvements (reproductible)", () => {
  const a = JSON.stringify(table());
  const b = JSON.stringify(table(new Map(), [...MOUVEMENTS].reverse()));
  assert.equal(a, b);
});

test("deux successeurs différents d'un même code à la même date : refus (l'ordre du fichier déciderait)", () => {
  assert.throws(() => table(new Map(), [...MOUVEMENTS, mvt("32", "2016-01-01", "A1", "C2")]), /A1 : deux successeurs le 2016-01-01/);
});
