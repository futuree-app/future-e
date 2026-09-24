import test from "node:test";
import assert from "node:assert/strict";
import { fusionnerRafraichissement } from "./logement-autour.ts";
import type { Face3Snapshot } from "./logement-autour-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// UN RAFRAÎCHISSEMENT NE PEUT QU'AMÉLIORER UN VOISINAGE (24/09/2026).
//
// Écrit le jour où Géorisques est resté en panne des heures : un recalcul peut être moins complet
// que l'original, et remplacer un voisinage complet par un voisinage troué serait le défaut exact
// que le générateur d'artefact refuse pour les dossiers.
// ════════════════════════════════════════════════════════════════════════════════════════════

function snap(over: Partial<Face3Snapshot> & { osmOk?: boolean; bpeOk?: boolean } = {}): Face3Snapshot {
  const { osmOk = true, bpeOk = true, ...reste } = over;
  const osm = osmOk ? "complete" : "pending";
  return {
    center: { lat: 46.07, lon: -1.08 },
    bpe: { categories: [] },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    icu: null,
    sourceStatus: { bpe: bpeOk ? "complete" : "failed", osmInfrastructure: osm, osmGreenSpaces: osm },
    sources: { bpeVersion: "v", osmFetchedAt: osmOk ? "2026-09-01T00:00:00Z" : null, osmQueryVersion: "q" },
    sourcesVersion: "v",
    computedAt: "2026-09-24T00:00:00Z",
    ...reste,
  } as Face3Snapshot;
}

const PERMIS = { consulteLe: "2026-09-01" } as never;
const ICU = { classe: "fort" } as never;

test("un recalcul complet remplace l'ancien", () => {
  const nouveau = snap({ computedAt: "2026-09-24T10:00:00Z", permis: PERMIS });
  assert.deepEqual(fusionnerRafraichissement(snap(), nouveau), nouveau);
});

test("une cartographie en attente garde l'ancienne cartographie, et sa date", () => {
  const ancien = snap({ osm: { potentiallyNoisyInfrastructure: [{ kind: "rail" }], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 } as never });
  const f = fusionnerRafraichissement(ancien, snap({ osmOk: false }))!;
  assert.equal(f.sourceStatus.osmInfrastructure, "complete");
  assert.deepEqual(f.osm, ancien.osm);
  assert.equal(f.sources.osmFetchedAt, "2026-09-01T00:00:00Z", "la cartographie gardée garde sa date");
});

test("un registre des permis muet garde les permis déjà consultés", () => {
  const f = fusionnerRafraichissement(snap({ permis: PERMIS }), snap())!;
  assert.equal(f.permis, PERMIS);
});

test("un îlot de chaleur muet garde l'ancien", () => {
  const f = fusionnerRafraichissement(snap({ icu: ICU }), snap({ icu: null }))!;
  assert.equal(f.icu, ICU);
});

test("une BPE en échec n'écrit rien", () => {
  assert.equal(fusionnerRafraichissement(snap(), snap({ bpeOk: false })), null);
});

test("ce qui est nouveau l'emporte : la BPE ventilée par type n'est jamais écrasée par l'ancienne", () => {
  const ventilee = [{ category: "sante", nearest: null, searchCapMeters: 3000, nearestByType: { D265: { distanceMeters: 553 } } }] as never;
  const f = fusionnerRafraichissement(snap(), snap({ bpe: { categories: ventilee }, osmOk: false }))!;
  assert.equal(f.bpe.categories, ventilee);
});
