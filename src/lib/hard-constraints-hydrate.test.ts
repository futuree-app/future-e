import test from "node:test";
import assert from "node:assert/strict";
import { hydrateHardConstraints, explorationHints } from "./hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";

const dir: PlaceDirectory = {
  byName: (label) =>
    label === "brest"
      ? { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 210_000 }
      : null,
  plmByName: () => null,
};

test("un maxKm PRÉSENT vient du lecteur (les défauts ?? 50 / ?? 30 n'ont jamais été persistés)", () => {
  const n = hydrateHardConstraints({ nearSea: { active: true, maxKm: 20 } }, dir);
  assert.deepEqual(n.nearSea, { threshold: { metric: "distance", maxKm: 20, source: "user" } });
});

test("un maxKm ABSENT ne devient JAMAIS un seuil : la contrainte reste sans paramètre", () => {
  const n = hydrateHardConstraints({ nearSea: { active: true } }, dir);
  assert.deepEqual(n.nearSea, { threshold: null });
});

test("les rayons inventés deviennent des indices d'exploration, hors du contrat dur", () => {
  const hints = explorationHints({ nearSea: { active: true }, nearPlace: { label: "Brest" } });
  assert.deepEqual(
    hints.map((h) => [h.kind, h.valueKm]),
    [["near_place_radius", 50], ["near_sea_radius", 30]],
  );
  assert.ok(hints.every((h) => h.source === "legacy_default" && h.confirmedByUser === false));
});

test("aucun indice d'exploration quand le lecteur a donné sa distance", () => {
  assert.deepEqual(explorationHints({ nearSea: { active: true, maxKm: 20 }, nearPlace: { label: "Brest", maxKm: 40 } }), []);
});

test("montagne : seule la force `hard` est une contrainte dure", () => {
  assert.equal(hydrateHardConstraints({ montagne: { strength: "preferred" } }, dir).montagne, false);
  assert.equal(hydrateHardConstraints({ montagne: { strength: "hard" } }, dir).montagne, true);
});

test("sizeRelativeTo ne mute PLUS communeSize : les deux contraintes coexistent, nommées séparément", () => {
  const n = hydrateHardConstraints(
    { communeSize: { max: 100_000 }, sizeRelativeTo: { label: "Brest", direction: "smaller" } },
    dir,
  );
  assert.deepEqual(n.communeSize, { min: null, max: 100_000 }); // INTACTE
  assert.equal(n.sizeRelativeTo?.reference.status, "resolved");
});

test("un lieu nommé non résolu reste dans l'état hydraté, pour être DÉCLARÉ non examiné", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Gare Matabiau", maxKm: 30 } }, dir);
  assert.equal(n.nearPlace?.reference.status, "unresolved");
});

test("une ancre DURE que la table ne connaît pas ne DISPARAÎT pas : elle est conservée comme non résolue", () => {
  const n = hydrateHardConstraints(
    { zones: [{ zone: "sud_ouest", strength: "hard" }, { zone: "zone_inventee", strength: "hard" }] },
    dir,
  );
  assert.ok(n.zones);
  assert.deepEqual(n.zones.unresolvedLabels, ["zone_inventee"]);
  assert.ok(n.zones.hardDepartements.size > 0); // le Sud-Ouest, lui, a bien été résolu
});

test("une ancre SOUPLE inconnue ne rend PAS la contrainte dure non examinée (elle ne filtre pas)", () => {
  const n = hydrateHardConstraints(
    { zones: [{ zone: "sud_ouest", strength: "hard" }, { zone: "zone_inventee", strength: "preferred" }] },
    dir,
  );
  assert.deepEqual(n.zones?.unresolvedLabels, []);
});

test("une exclusion inconnue est conservée : sinon « pas dans cette zone » deviendrait satisfied à tort", () => {
  const n = hydrateHardConstraints({ excludeZones: ["idf", "zone_inventee"] }, dir);
  assert.deepEqual(n.excludeZones?.unresolvedLabels, ["zone_inventee"]);
});

test("aucune zone dure déclarée -> la contrainte est NON DÉCLARÉE (pas non examinée)", () => {
  assert.equal(hydrateHardConstraints({ zones: [{ zone: "sud_ouest", strength: "preferred" }] }, dir).zones, null);
});

// ── LOT 2 : le temps de trajet entre dans le contrat ──────────────────────────

test("un temps de trajet déclaré produit un seuil travel_time, jamais une distance", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Gare Matabiau", maxMinutes: 30, mode: "car" } }, dir);
  assert.deepEqual(n.nearPlace?.threshold, {
    metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user",
  });
});

test("le TEMPS PRIME sur la distance quand les deux sont déclarés", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxKm: 20, maxMinutes: 30, mode: "car" } }, dir);
  assert.equal(n.nearPlace?.threshold?.metric, "travel_time");
});

test("un temps sans mode reste travel_time, mode null (le PARAMÈTRE manque, pas le lieu)", () => {
  const t = hydrateHardConstraints({ nearPlace: { label: "Brest", maxMinutes: 30 } }, dir).nearPlace?.threshold;
  assert.equal(t?.metric === "travel_time" ? t.mode : "absent", null);
});

test("un mode que le parse a inventé est traité comme ABSENT, jamais gardé", () => {
  const t = hydrateHardConstraints(
    { nearPlace: { label: "Brest", maxMinutes: 30, mode: "voiture" as never } }, dir,
  ).nearPlace?.threshold;
  assert.equal(t?.metric === "travel_time" ? t.mode : "absent", null);
});

test("un temps nul ou absurde n'est pas une contrainte", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxMinutes: 0, mode: "car" } }, dir);
  assert.equal(n.nearPlace?.threshold, null);
});

test("une distance seule reste une distance (le lot 1 ne bouge pas)", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxKm: 20 } }, dir);
  assert.deepEqual(n.nearPlace?.threshold, { metric: "distance", maxKm: 20, source: "user" });
});

test("un TEMPS déclaré supprime le rayon d'exploration : le lecteur a posé sa limite", () => {
  // Sans ce garde-fou, le comparateur affichait « aucune distance précisée, aucune commune n'est écartée »
  // pendant que l'isochrone, elle, filtrait bel et bien.
  assert.deepEqual(explorationHints({ nearPlace: { label: "la gare Matabiau", maxMinutes: 30, mode: "car" } }), []);
});
