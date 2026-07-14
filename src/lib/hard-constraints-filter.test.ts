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

test("unappliedLabels : nomme la contrainte non appliquée, avec le mot du lecteur", () => {
  const r = hardFilter([{ key: "nearPlace", status: "unexamined", reason: "unresolved_reference", detail: "Gare Matabiau" }]);
  assert.deepEqual(unappliedLabels(r), ["la proximité de Gare Matabiau"]);
});
