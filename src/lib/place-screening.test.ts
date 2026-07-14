import test from "node:test";
import assert from "node:assert/strict";
import { screenCandidates, expectedKindOf, type GeocodeCandidate } from "./place-screening.ts";

const META = { inputHash: "h", resolverVersion: "resolve-2" };
const CTX = { departements: [] as string[], degraded: false };

const GARE: GeocodeCandidate = {
  label: "Gare Matabiau", kind: "station", lat: 43.611448, lon: 1.453496,
  citycode: "31555", dept: "31", score: 0.85, sourceId: "EQ_RESEA0000000073015866",
  source: "geoplateforme_poi", categories: ["gare voyageurs uniquement", "transport"],
};
const RUE: GeocodeCandidate = {
  label: "Rue Matabiau 31000 Toulouse", kind: "street", lat: 43.611679, lon: 1.448097,
  citycode: "31555", dept: "31", score: 0.71, sourceId: "31555_5776", source: "ban", categories: [],
};

// LES DEUX CANDIDATS RÉELS de « hôpital de Purpan », avec leurs scores RÉELS (relevés le 2026-07-14).
// L'école est MIEUX CLASSÉE que l'hôpital, et porte les deux mots du lecteur.
const ECOLE: GeocodeCandidate = {
  label: "Centre de Formation Métiers de la Santé Chu Hôpital de Purpan", kind: "poi",
  lat: 43.608, lon: 1.398, citycode: "31555", dept: "31", score: 0.65, sourceId: "EQ_ECOLE",
  source: "geoplateforme_poi", categories: ["enseignement supérieur", "zone d'activité ou d'intérêt"],
};
const HOPITAL: GeocodeCandidate = {
  label: "Hôpital Purpan", kind: "poi", lat: 43.6, lon: 1.398, citycode: "31555", dept: "31",
  score: 0.42, sourceId: "EQ_HOPITAL", source: "geoplateforme_poi",
  categories: ["hôpital", "zone d'activité ou d'intérêt"],
};

test("le type attendu se lit dans le libellé du lecteur", () => {
  assert.equal(expectedKindOf("la gare Matabiau"), "equipment");
  assert.equal(expectedKindOf("7 rue du Taur Toulouse"), "address");
  assert.equal(expectedKindOf("Brest"), "unspecified");
});

test("LE FAUX POSITIF DE LA BAN : « la gare Matabiau » ne devient JAMAIS « Rue Matabiau »", () => {
  const r = screenCandidates("la gare Matabiau", [RUE], CTX, META);
  assert.equal(r.status, "unresolved");
  if (r.status !== "unresolved") return;
  assert.equal(r.reason, "unsupported_type");
});

test("la gare est résolue, avec sa provenance IGN et son identifiant stable", () => {
  const r = screenCandidates("la gare Matabiau", [GARE, RUE], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.canonicalLabel, "Gare Matabiau");
  assert.equal(r.kind, "station");
  assert.equal(r.source, "geoplateforme_poi"); // la provenance n'est PAS maquillée en « ban »
  assert.equal(r.sourceId, "EQ_RESEA0000000073015866");
});

test("LE SCORE NE DÉCIDE PAS, LA CATÉGORIE DÉCIDE : « l'hôpital de Purpan » n'est pas l'école qui le nomme", () => {
  // L'école est mieux classée (0,65 contre 0,42) et porte « hôpital » ET « purpan » dans son libellé.
  // Seule sa CATÉGORIE la trahit. Un tri par score, ou un plancher à 0,6, se tromperait.
  const r = screenCandidates("l'hôpital de Purpan", [ECOLE, HOPITAL], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.canonicalLabel, "Hôpital Purpan");
});

test("un candidat dont le libellé ne porte pas tous les mots du lecteur est rejeté", () => {
  const autre: GeocodeCandidate = { ...GARE, label: "Gare de Blagnac", sourceId: "X", lat: 43.63, lon: 1.39 };
  const r = screenCandidates("la gare Matabiau", [autre], CTX, META);
  assert.equal(r.status === "unresolved" && r.reason, "no_result");
});

test("le territoire déclaré ÉCARTE un candidat lointain, il ne le corrige pas", () => {
  const ailleurs: GeocodeCandidate = { ...GARE, citycode: "35238", dept: "35" };
  const r = screenCandidates("la gare Matabiau", [ailleurs], { departements: ["31"], degraded: false }, META);
  assert.equal(r.status, "unresolved");
});

test("CINQ GARES DE LYON, TOUTES AU MÊME SCORE : ambiguous, le produit ne tranche pas", () => {
  const g = (nom: string, lat: number, lon: number, id: string): GeocodeCandidate => ({
    ...GARE, label: nom, lat, lon, sourceId: id, score: 0.85, citycode: null, dept: null,
  });
  const r = screenCandidates("la gare de Lyon", [
    g("Gare de Lyon", 48.846, 2.373, "A"),
    g("Gare de Lyon-Perrache", 45.748, 4.826, "B"),
    g("Gare de Lyon-Guillotière", 45.74, 4.843, "C"), // à 2,5 km de Perrache : DEUX gares, pas une
  ], CTX, META);
  assert.equal(r.status, "ambiguous");
  if (r.status !== "ambiguous") return;
  assert.equal(r.candidates.length, 3);
});

test("le même objet vu deux fois (même sourceId) n'est pas une ambiguïté", () => {
  const a = { ...GARE, score: 0.85 };
  const b = { ...GARE, lat: 43.6118, lon: 1.4538, score: 0.7 }; // même sourceId, coordonnées voisines
  const r = screenCandidates("la gare Matabiau", [a, b], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.lat, 43.611448); // le mieux classé
});

test("deux référentiels décrivent la MÊME adresse avec deux libellés : pas d'ambiguïté fabriquée", () => {
  const ban: GeocodeCandidate = {
    label: "7 Rue du Taur 31000 Toulouse", kind: "address", lat: 43.6062, lon: 1.4432,
    citycode: "31555", dept: "31", score: 0.95, sourceId: "31555_0001", source: "ban", categories: [],
  };
  const ign: GeocodeCandidate = {
    label: "7 rue du Taur, Toulouse", kind: "address", lat: 43.6063, lon: 1.4433, // à ~15 m
    citycode: "31555", dept: "31", score: 0.9, sourceId: "IGN_1", source: "geoplateforme_poi", categories: [],
  };
  const r = screenCandidates("7 rue du Taur Toulouse", [ban, ign], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.kind, "address");
});

test("UNE PANNE DES GÉOCODEURS N'EST PAS UN LIEU INTROUVABLE", () => {
  const r = screenCandidates("la gare Matabiau", [], { departements: [], degraded: true }, META);
  assert.equal(r.status === "unresolved" && r.reason, "geocoding_unavailable");
});

test("services debout, aucun candidat : no_result (une information, pas une panne)", () => {
  const r = screenCandidates("la gare de nulle part", [], CTX, META);
  assert.equal(r.status === "unresolved" && r.reason, "no_result");
});

test("un score sous le plancher anti-bruit est écarté", () => {
  const r = screenCandidates("la gare Matabiau", [{ ...GARE, score: 0.1 }], CTX, META);
  assert.equal(r.status === "unresolved" && r.reason, "low_confidence");
});

test("un service debout qui trouve la gare pendant que l'autre tombe reste une résolution VALIDE", () => {
  const r = screenCandidates("la gare Matabiau", [GARE], { departements: [], degraded: true }, META);
  assert.equal(r.status, "resolved"); // on ne jette pas ce qu'on a
});
