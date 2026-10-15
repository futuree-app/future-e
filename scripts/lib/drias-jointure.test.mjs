import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { DISTANCE_MAX_DEG, DISTANCE_MAX_MESUREE_DEG, EST_OUTREMER, joindreAuPointLePlusProche } from "./drias-jointure.mjs";
import { loadCommunes, parseDriasFile } from "../build-drias-median.js";

// RÈGLE (hotfix FUT-104) : AUCUNE COMMUNE NE REÇOIT UNE VALEUR D'UNE GRILLE QUI NE COUVRE PAS SON TERRITOIRE.
// Avant : Fort-de-France recevait les valeurs du Conquet, Saint-Denis de La Réunion celles du sud de la Corse.

const grille = [
  { pointId: "A", latitude: 48.36, longitude: -4.77 }, // pointe du Finistère
  { pointId: "B", latitude: 41.4, longitude: 9.2 }, // sud de la Corse
];
const commune = (insee_code, latitude, longitude) => ({ insee_code, commune_name: insee_code, latitude, longitude });

test("Outre-mer : exclu avant la jointure, quelle que soit la distance", () => {
  const { associees, exclues } = joindreAuPointLePlusProche(
    [commune("97209", 14.65, -61.07), commune("97411", -20.94, 55.44), commune("98735", -17.56, -149.56), commune("29040", 48.36, -4.76)],
    grille,
  );
  assert.deepEqual(exclues, ["97209", "97411", "98735"]);
  assert.deepEqual(associees.map((c) => c.insee_code), ["29040"]);
  // Même posé sur un point de la grille, un code ultramarin n'est pas associé : c'est son territoire qui compte.
  assert.deepEqual(joindreAuPointLePlusProche([commune("97209", 48.36, -4.77)], grille).associees, []);
  for (const c of ["97101", "97502", "97611", "97701", "97801", "98411", "98613", "98818", "98901"]) assert.ok(EST_OUTREMER(c), c);
  for (const c of ["01001", "29040", "2A004", "2B033", "75056", "96000"]) assert.ok(!EST_OUTREMER(c), c);
});

test("Distance : une commune non couverte fait échouer la construction au lieu de recevoir un point lointain", () => {
  // Un code métropolitain aux coordonnées de la Guadeloupe (coordonnée corrompue) : refus, pas les valeurs du Conquet.
  assert.throws(() => joindreAuPointLePlusProche([commune("01001", 16.27, -61.5)], grille), /au-delà de 0.25°/);
  // Juste au-delà du seuil, à l'ouest de la pointe bretonne : refus.
  assert.throws(() => joindreAuPointLePlusProche([commune("29155", 48.36, -4.77 - 0.26)], grille), /29155/);
  // Juste en deçà : associée.
  const { associees } = joindreAuPointLePlusProche([commune("29155", 48.36, -4.77 - 0.24)], grille);
  assert.equal(associees[0].nearestPointId, "A");
  assert.ok(DISTANCE_MAX_DEG > DISTANCE_MAX_MESUREE_DEG);
});

test("Grille réelle : les 34 788 communes métropolitaines gardent un point, les îles et littoraux compris", async () => {
  const sources = readdirSync("data/source").filter((f) => f.endsWith(".txt")).sort();
  const parsed = await parseDriasFile(path.join("data/source", sources[0]));
  const points = [...parsed.records.values()].map((r) => ({ pointId: r.Point, latitude: r.Latitude, longitude: r.Longitude }));
  const communes = await loadCommunes();
  const { associees, exclues } = joindreAuPointLePlusProche(communes, points);
  assert.equal(exclues.length, 218);
  assert.equal(associees.length, 34788);
  const par = Object.fromEntries(associees.map((c) => [c.insee_code, c]));
  // Les cas limites mesurés : îles bretonnes, littoral de la Manche, Corse, Côte basque.
  for (const [code, borne] of [["29083", 0.16], ["29155", 0.15], ["50218", 0.11], ["29040", 0.09], ["2A041", 0.06], ["2B009", 0.06], ["64130", 0.06]]) {
    assert.ok(par[code], `${code} associée`);
    assert.ok(par[code].nearestDistanceDeg < borne, `${code} à ${par[code].nearestDistanceDeg.toFixed(3)}°`);
  }
  const max = Math.max(...associees.map((c) => c.nearestDistanceDeg));
  assert.ok(Math.abs(max - DISTANCE_MAX_MESUREE_DEG) < 1e-3, `maximum mesuré ${max}`);
});
