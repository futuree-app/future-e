import test from "node:test";
import assert from "node:assert/strict";
import { DELAIS_REPRISE_OSM_MS, prochaineRepriseOsm, snapshotAffiche } from "./autour-osm-reprise.ts";
import type { Face3Snapshot } from "./logement-autour-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA PAGE AUTOUR NE RESTE JAMAIS « EN COURS DE RÉCUPÉRATION » (04/11/2026).
//
// Le client redemandait UNE fois après 4,5 s, puis plus jamais : si la cartographie n'était pas
// arrivée, l'écran annonçait une récupération que plus rien ne poursuivait.
// ════════════════════════════════════════════════════════════════════════════════════════════

const snap = (statut: "complete" | "pending" | "failed") =>
  ({
    center: { lat: 46.16, lon: -1.15 },
    bpe: { categories: [] },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    icu: null,
    sourceStatus: { bpe: "complete", osmInfrastructure: statut, osmGreenSpaces: statut },
    sources: { bpeVersion: "x", osmFetchedAt: null, osmQueryVersion: "x" },
    sourcesVersion: "x",
    computedAt: "2026-11-04T00:00:00.000Z",
  }) satisfies Face3Snapshot;

test("deux reprises, à 4,5 s puis 10 s, et pas davantage", () => {
  assert.deepEqual([...DELAIS_REPRISE_OSM_MS], [4_500, 10_000]);
  for (let i = 1; i < DELAIS_REPRISE_OSM_MS.length; i++) {
    assert.ok(DELAIS_REPRISE_OSM_MS[i] >= DELAIS_REPRISE_OSM_MS[i - 1], "les délais s'allongent");
  }
});

test("en attente : une reprise par délai, puis plus aucune", () => {
  DELAIS_REPRISE_OSM_MS.forEach((d, i) => assert.equal(prochaineRepriseOsm(snap("pending"), i), d));
  assert.equal(prochaineRepriseOsm(snap("pending"), DELAIS_REPRISE_OSM_MS.length), null);
  assert.equal(prochaineRepriseOsm(snap("pending"), 99), null);
});

test("complet ou en échec : aucune reprise automatique", () => {
  assert.equal(prochaineRepriseOsm(snap("complete"), 0), null);
  assert.equal(prochaineRepriseOsm(snap("failed"), 0), null);
  assert.equal(prochaineRepriseOsm(null, 0), null);
});

test("reprises épuisées : l'écran affiche une INDISPONIBILITÉ, jamais une absence", () => {
  const affiche = snapshotAffiche(snap("pending"), DELAIS_REPRISE_OSM_MS.length);
  assert.equal(affiche?.sourceStatus.osmInfrastructure, "failed");
  assert.equal(affiche?.sourceStatus.osmGreenSpaces, "failed");
  // Le reste du snapshot est intact : seul le statut affiché change, rien n'est inventé.
  assert.deepEqual(affiche?.osm, snap("pending").osm);
  assert.equal(affiche?.sourceStatus.bpe, "complete");
});

test("reprises en cours, ou cartographie obtenue : le snapshot est affiché tel quel", () => {
  const enCours = snap("pending");
  assert.equal(snapshotAffiche(enCours, 0), enCours);
  const complet = snap("complete");
  assert.equal(snapshotAffiche(complet, 99), complet);
  assert.equal(snapshotAffiche(null, 99), null);
});

test("un seul volet en attente : seul ce volet bascule, l’autre reste tel qu’il est", () => {
  const moitie = { ...snap("complete"), sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "pending" } } satisfies Face3Snapshot;
  assert.equal(prochaineRepriseOsm(moitie, 0), DELAIS_REPRISE_OSM_MS[0]);
  const affiche = snapshotAffiche(moitie, DELAIS_REPRISE_OSM_MS.length);
  assert.equal(affiche?.sourceStatus.osmInfrastructure, "complete");
  assert.equal(affiche?.sourceStatus.osmGreenSpaces, "failed");
});
