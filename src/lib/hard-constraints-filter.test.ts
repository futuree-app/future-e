import test from "node:test";
import assert from "node:assert/strict";
import { hardFilter, unappliedLabels } from "./hard-constraints-filter.ts";
import type { HardConstraintAssessment, HardConstraintKey } from "./hard-constraints.ts";

const sat = (key: HardConstraintKey): HardConstraintAssessment => ({
  key, status: "satisfied",
  observedValue: { kind: "boolean", value: true }, expectedValue: { kind: "boolean", value: true },
  observedLabel: "", expectedLabel: "", evidenceKeys: [],
});
const inc = (key: HardConstraintKey): HardConstraintAssessment => ({
  key, status: "incompatible",
  observedValue: { kind: "boolean", value: false }, expectedValue: { kind: "boolean", value: true },
  observedLabel: "", expectedLabel: "", evidenceKeys: [], statement: "…", topic: "…",
});

test("tout satisfait -> eligible ET complete", () => {
  const r = hardFilter([sat("departements"), { key: "zones", status: "not_declared" }]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, true);
});

test("une incompatibilité -> non eligible", () => {
  const r = hardFilter([inc("nearSea"), sat("departements")]);
  assert.equal(r.eligible, false);
  assert.equal(r.incompatible.length, 1);
});

test("donnée COMMUNALE manquante -> exclue (la doctrine prudente du filtre, préservée)", () => {
  const r = hardFilter([{ key: "reliefProche", status: "unexamined", reason: "missing_data" }]);
  assert.equal(r.eligible, false);
});

test("référence NON RÉSOLUE -> la commune reste ELIGIBLE, mais complete est FAUX", () => {
  // Exclure sur cette base exclurait TOUTES les communes : la référence est globale, pas communale.
  // Le lecteur recevrait zéro résultat sans comprendre pourquoi.
  const r = hardFilter([{ key: "nearPlace", status: "unexamined", reason: "unresolved_reference", detail: "Gare Matabiau" }]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, false);
  assert.equal(r.unapplied.length, 1);
});

test("un seuil non déclaré (missing_parameter) ne filtre pas non plus", () => {
  const r = hardFilter([{ key: "nearSea", status: "unexamined", reason: "missing_parameter" }]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, false);
});

test("unappliedLabels : nomme la contrainte non appliquée AVEC LE MOT DU LECTEUR, en français", () => {
  // Le parse rend le lieu dans une forme d'index (« Gare Matabiau, Toulouse »). Écrit tel quel, ça
  // donnerait « la proximité de Gare Matabiau, Toulouse ». Le noyau le met en phrase, et les DEUX
  // moteurs le nomment pareil.
  const r = hardFilter([{ key: "nearPlace", status: "unexamined", reason: "unresolved_reference", detail: "Gare Matabiau, Toulouse" }]);
  assert.deepEqual(unappliedLabels(r), ["la proximité de la gare Matabiau"]);
});

test("UNE COMMUNE EN BORDURE EST RETENUE, PAS CONFIRMÉE", () => {
  // Le point de CETTE commune tombe dans la bande de tolérance de la géométrie : le moteur n'a pas pu
  // trancher pour elle. L'exclure supprimerait une possibilité à cause d'une limite de MESURE (la frontière
  // des 30 minutes traverse la couronne où le lecteur cherche : 24 des 31 communes de l'aire toulousaine y
  // tombent). La laisser passer sans rien dire la ferait passer pour conforme. Donc : retenue, et marquée.
  const r = hardFilter([
    { key: "nearPlace", status: "unexamined", reason: "insufficient_precision", detail: "la gare Matabiau" },
  ]);
  assert.equal(r.eligible, true); // elle est PROPOSÉE
  assert.equal(r.complete, false); // mais la condition n'a PAS été appliquée pour elle
  assert.equal(r.boundary.length, 1); // et c'est dit
  assert.equal(r.unapplied.length, 0); // ce n'est pas une contrainte non appliquée GLOBALEMENT
});

test("une PANNE de géocodage, elle, est GLOBALE : elle ne filtre pas, et elle est annoncée", () => {
  // Exclure sur une panne exclurait les 35 000 communes, et le lecteur recevrait zéro résultat sans
  // comprendre pourquoi.
  const r = hardFilter([
    { key: "nearPlace", status: "unexamined", reason: "geocoding_unavailable", detail: "la gare Matabiau" },
  ]);
  assert.equal(r.eligible, true);
  assert.equal(r.complete, false);
  assert.deepEqual(unappliedLabels(r), ["la proximité de la gare Matabiau"]);
});
