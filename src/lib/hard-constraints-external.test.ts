import test from "node:test";
import assert from "node:assert/strict";
import { resolveExternalReferences, type ExternalDeps } from "./hard-constraints-external.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";
import type { GeocodeCandidate } from "./place-screening.ts";
import type { PolygonGeometry } from "./geo-polygon.ts";

const dir: PlaceDirectory = {
  byName: (label) =>
    label === "brest"
      ? { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 210_000 }
      : null,
  plmByName: () => null,
};

const GARE: GeocodeCandidate = {
  label: "Gare Matabiau", kind: "station", lat: 43.611448, lon: 1.453496,
  citycode: "31555", dept: "31", score: 0.85, sourceId: "EQ_1",
  source: "geoplateforme_poi", categories: ["gare voyageurs uniquement", "transport"],
};

const ISO: PolygonGeometry = {
  type: "Polygon",
  coordinates: [[[1.3, 43.5], [1.6, 43.5], [1.6, 43.7], [1.3, 43.7], [1.3, 43.5]]],
};

// LES INVARIANTS QUI COMPTENT SONT DES INVARIANTS D'APPELS : on compte donc les appels réseau.
function spies(over: Partial<ExternalDeps> = {}) {
  const calls = { geocode: 0, reach: 0 };
  const deps: ExternalDeps = {
    geocodePlace: async () => {
      calls.geocode++;
      return { candidates: [GARE], degraded: false };
    },
    getReachability: async () => {
      calls.reach++;
      return { status: "ready", geometry: ISO, toleranceMeters: 300 };
    },
    ...over,
  };
  return { deps, calls };
}

test("« près de Brest » : l'index suffit, AUCUN appel au géocodeur", async () => {
  const hc = { nearPlace: { label: "Brest", maxKm: 30 } };
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences(hc, dir, deps);
  assert.equal(calls.geocode, 0);
  assert.equal(calls.reach, 0);
  assert.equal(ext.place, null); // rien à injecter : l'index a résolu
  const n = hydrateHardConstraints(hc, dir, ext);
  assert.equal(n.nearPlace?.reference.status, "resolved");
});

test("« la gare Matabiau » : un appel au géocodeur, et la référence entre dans l'état hydraté", async () => {
  const hc = { nearPlace: { label: "la gare Matabiau", maxKm: 20 } };
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences(hc, dir, deps);
  assert.equal(calls.geocode, 1);
  assert.equal(calls.reach, 0); // une DISTANCE ne demande aucune isochrone
  const n = hydrateHardConstraints(hc, dir, ext);
  assert.equal(n.nearPlace?.reference.status, "resolved");
  if (n.nearPlace?.reference.status !== "resolved") return;
  assert.equal(n.nearPlace.reference.canonicalLabel, "Gare Matabiau");
});

test("un temps de trajet en voiture : UNE isochrone, calculée depuis le LIEU", async () => {
  const hc = { nearPlace: { label: "la gare Matabiau", maxMinutes: 30, mode: "car" as const } };
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences(hc, dir, deps);
  assert.equal(calls.reach, 1);
  assert.equal(ext.reachability?.status, "ready");
  const n = hydrateHardConstraints(hc, dir, ext);
  assert.equal(n.nearPlace?.reachability?.status, "ready");
});

test("le VÉLO ne part pas vers un moteur qui ne sait pas le calculer", async () => {
  const { deps, calls } = spies();
  await resolveExternalReferences(
    { nearPlace: { label: "la gare Matabiau", maxMinutes: 30, mode: "bike" } }, dir, deps,
  );
  assert.equal(calls.reach, 0);
});

test("un temps SANS MODE ne part pas non plus : on ne devine pas la voiture", async () => {
  const { deps, calls } = spies();
  await resolveExternalReferences({ nearPlace: { label: "la gare Matabiau", maxMinutes: 30 } }, dir, deps);
  assert.equal(calls.reach, 0);
});

test("UNE PANNE DU GÉOCODEUR N'EST PAS UN LIEU INTROUVABLE", async () => {
  const { deps } = spies({ geocodePlace: async () => ({ candidates: [], degraded: true }) });
  const ext = await resolveExternalReferences({ nearPlace: { label: "la gare Matabiau", maxKm: 20 } }, dir, deps);
  assert.equal(ext.place?.status, "unresolved");
  if (ext.place?.status !== "unresolved") return;
  assert.equal(ext.place.reason, "geocoding_unavailable");
});

test("une référence non résolue ne déclenche AUCUNE isochrone (on ne route pas depuis un point inconnu)", async () => {
  const { deps, calls } = spies({ geocodePlace: async () => ({ candidates: [], degraded: false }) });
  const ext = await resolveExternalReferences(
    { nearPlace: { label: "la gare de nulle part", maxMinutes: 30, mode: "car" } }, dir, deps,
  );
  assert.equal(calls.reach, 0);
  assert.equal(ext.place?.status, "unresolved");
});

test("sans nearPlace, la chaîne externe ne fait rien du tout", async () => {
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences({ departements: ["31"] }, dir, deps);
  assert.deepEqual(ext, { place: null, reachability: null });
  assert.equal(calls.geocode + calls.reach, 0);
});

test("le lieu est géocodé TEL QUE LE LECTEUR L'A NOMMÉ", async () => {
  let vu: string | null = null;
  const { deps } = spies({
    geocodePlace: async (label) => {
      vu = label;
      return { candidates: [GARE], degraded: false };
    },
  });
  await resolveExternalReferences(
    { departements: ["31"], nearPlace: { label: "la gare Matabiau", maxKm: 20 } }, dir, deps,
  );
  assert.equal(vu, "la gare Matabiau");
});

test("un sac vide ne dégrade pas ce que l'index savait résoudre", () => {
  const n = hydrateHardConstraints(
    { nearPlace: { label: "Brest", maxKm: 30 } }, dir, { place: null, reachability: null },
  );
  assert.equal(n.nearPlace?.reference.status, "resolved");
});
