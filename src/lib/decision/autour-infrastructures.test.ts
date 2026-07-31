import test from "node:test";
import assert from "node:assert/strict";
import { buildInfraLecture } from "./autour-infrastructures.ts";
import type { Face3Snapshot } from "../logement-autour-types.ts";

type Infra = { type: "motorway" | "trunk" | "railway"; distanceMeters: number };

function snap(
  infra: Infra[],
  osmInfrastructure: "complete" | "pending" | "failed" = "complete",
  bboxRadiusMeters = 1500,
): Face3Snapshot {
  return {
    center: { lng: 0, lat: 0 },
    bpe: { categories: [] },
    osm: { potentiallyNoisyInfrastructure: infra, nearestMappedGreenSpace: null, bboxRadiusMeters },
    sourceStatus: { bpe: "complete", osmInfrastructure, osmGreenSpaces: "complete" },
    sources: { bpeVersion: "BPE24", osmFetchedAt: null, osmQueryVersion: "v1" },
    sourcesVersion: "v1",
    computedAt: "2026-08-01T00:00:00.000Z",
  } as Face3Snapshot;
}

// ── Le silence plutôt qu'un satisfecit ─────────────────────────────────────────────────────

test("rien trouvé : AUCUN bloc, jamais « aucune infrastructure à proximité »", () => {
  // Ce serait une promesse de calme, alors qu'on n'a cherché que trois types d'objets dans un
  // rayon donné. Le silence est plus honnête.
  assert.equal(buildInfraLecture(snap([])), null);
});

// ── Une source muette n'est pas une absence ────────────────────────────────────────────────

test("source en cours : on le dit, on ne conclut pas", () => {
  const r = buildInfraLecture(snap([], "pending"))!;
  assert.equal(r.lignes.length, 0);
  assert.ok(r.indisponible?.includes("en cours"), r.indisponible ?? "");
});

test("source en échec : on nomme l'échec, jamais une absence", () => {
  const r = buildInfraLecture(snap([], "failed"))!;
  assert.ok(r.indisponible?.includes("n'a pas répondu"), r.indisponible ?? "");
  assert.equal(/aucune infrastructure|rien à proximité/i.test(r.indisponible ?? ""), false);
});

test("un échec PRIME sur des données présentes : on ne rend pas un état partiel pour complet", () => {
  const r = buildInfraLecture(snap([{ type: "motorway", distanceMeters: 180 }], "failed"))!;
  assert.equal(r.lignes.length, 0);
  assert.ok(r.indisponible);
});

// ── L'ordre et les libellés ────────────────────────────────────────────────────────────────

test("de la plus proche à la plus lointaine", () => {
  const r = buildInfraLecture(snap([
    { type: "railway", distanceMeters: 870 },
    { type: "motorway", distanceMeters: 180 },
    { type: "trunk", distanceMeters: 430 },
  ]))!;
  assert.deepEqual(r.lignes.map((l) => l.distanceMeters), [180, 430, 870]);
  assert.equal(r.lignes[0].label, "Une autoroute");
  assert.equal(r.lignes[0].distance, "180 m");
});

test("« trunk » se dit « route à grande circulation », jamais « voie rapide »", () => {
  // Dans OSM, `trunk` couvre aussi bien une deux-fois-deux-voies qu'une nationale ordinaire :
  // « voie rapide » promettrait un gabarit qu'on ne connaît pas.
  const r = buildInfraLecture(snap([{ type: "trunk", distanceMeters: 300 }]))!;
  assert.equal(r.lignes[0].label, "Une route à grande circulation");
  assert.equal(/voie rapide|rocade|quatre voies/i.test(r.lignes[0].label), false);
});

test("les distances passent au kilomètre au-delà de 1000 m", () => {
  const r = buildInfraLecture(snap([{ type: "railway", distanceMeters: 1200 }]))!;
  assert.equal(r.lignes[0].distance, "1,2 km");
});

// ── Aucun seuil, aucun jugement ────────────────────────────────────────────────────────────

test("une infrastructure LOINTAINE est montrée quand même : pas de seuil caché", () => {
  // Choisir un seuil d'affichage reviendrait à décider à la place du lecteur ce qui compte, et à
  // masquer un fait sans le dire.
  const r = buildInfraLecture(snap([{ type: "railway", distanceMeters: 1450 }]))!;
  assert.equal(r.lignes.length, 1);
});

test("AUCUN mot de jugement sur le bruit", () => {
  const interdits = /bruyant|nuisance|calme|paisible|gênant|silencieux|exposé au bruit/i;
  const r = buildInfraLecture(snap([
    { type: "motorway", distanceMeters: 90 }, { type: "railway", distanceMeters: 1400 },
  ]))!;
  const tout = [...r.lignes.map((l) => `${l.label} ${l.distance}`), r.limite].join(" ");
  assert.equal(interdits.test(tout), false, tout);
});

// ── La limite, qui est la raison pour laquelle ce bloc peut exister ────────────────────────

test("la limite dit que la distance n'établit PAS le niveau sonore", () => {
  const r = buildInfraLecture(snap([{ type: "motorway", distanceMeters: 180 }]))!;
  assert.ok(r.limite.includes("n'établissent pas le niveau sonore"), r.limite);
  assert.ok(r.limite.includes("visite"), "la seule mesure qui vaille est nommée");
});

test("la limite dit le RAYON cherché : ce qui est au-delà n'a pas été regardé", () => {
  const r = buildInfraLecture(snap([{ type: "motorway", distanceMeters: 180 }], "complete", 1500))!;
  assert.ok(r.limite.includes("1,5 km"), r.limite);
});
