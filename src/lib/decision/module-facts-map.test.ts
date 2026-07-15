import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import type { IndexCommune } from "../comparateur-vie.ts";

function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return {
    insee: "17300", nom: "Fouras", dept: "17", region: "NA", lat: 46, lon: -1,
    population: 4000, densite: 500, distance_cote_km: 0.5, altitude: 8,
    clim: {}, pct: {}, ...(over as IndexCommune),
  };
}

test("mapping : passe-plats honnêtes", () => {
  const f = mapCommuneToModuleFacts(entry({ population: 18000, distance_cote_km: 42, inondation: { catnat: 5, tri: false, risque: 72 } }), { faible_chaleur: 40 }, { hasAddress: false, tailleVille: 18000 });
  assert.equal(f.population, 18000);
  assert.equal(f.distanceCoteKm, 42);
  assert.equal(f.catnatInondation, 5);
  assert.equal(f.inondationRisque, 72);
  assert.equal(f.scores.faible_chaleur, 40);
  assert.equal(f.hasAddress, false);
});

test("mapping : absence d'inondation -> null (jamais 0)", () => {
  const f = mapCommuneToModuleFacts(entry(), {}, { hasAddress: true, tailleVille: 4000 });
  assert.equal(f.catnatInondation, null);
  assert.equal(f.inondationRisque, null);
  assert.equal(f.hasAddress, true);
});

test("le mapping reconstitue rankBands depuis la forme COMPACTE (points de base)", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0,
    rankBands: { nature: [1234, 1258] } } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.deepEqual(mf.rankBands, { nature: { low: 0.1234, high: 0.1258 } });
});
test("une commune SANS rankBands rend null (jamais un objet vide)", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0 } as never;
  assert.equal(mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null }).rankBands, null);
});

// ── Attestations d'absence (lot 2a) : champs frères + provenance ──────────────
test("réseau MESURÉ sous plancher (marqueur true, reseauLocal null) -> absence attestable", () => {
  const f = mapCommuneToModuleFacts(entry({ reseauLocal: null, reseauLocalMeasured: true }), {}, { hasAddress: false, tailleVille: 1000 });
  assert.deepEqual(f.localNetwork, { measured: true, access: null });
});
test("réseau MESURÉ avec desserte -> présence attestée", () => {
  const f = mapCommuneToModuleFacts(entry({ reseauLocal: { acces: 72, tram: true, metro: false, arret_km: 0.4 }, reseauLocalMeasured: true }), {}, { hasAddress: false, tailleVille: 1000 });
  assert.deepEqual(f.localNetwork, { measured: true, access: 72 });
});
test("DÉFENSIF : résultat présent mais marqueur ABSENT -> non mesuré", () => {
  const f = mapCommuneToModuleFacts(entry({ reseauLocal: { acces: 72, tram: false, metro: false, arret_km: 0.9 } }), {}, { hasAddress: false, tailleVille: 1000 });
  assert.equal(f.localNetwork.measured, false);
});
test("études : weightedAccess + establishmentCount (null si absent du champ)", () => {
  const f = mapCommuneToModuleFacts(entry({ etudesSup: { measured: true, weightedAccess: 0, radiusKm: 25 } }), {}, { hasAddress: false, tailleVille: 1000 });
  assert.deepEqual(f.higherEd, { measured: true, weightedAccess: 0, radiusKm: 25, establishmentCount: null });
});
test("index PRÉ-PATCH (aucune attestation) -> measured:false (jamais une absence inventée)", () => {
  const f = mapCommuneToModuleFacts(entry(), {}, { hasAddress: false, tailleVille: 1000 });
  assert.equal(f.localNetwork.measured, false);
  assert.equal(f.higherEd.measured, false);
});
