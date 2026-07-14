import test from "node:test";
import assert from "node:assert/strict";
import { tailleVilleFrom, communeAttributesFrom } from "./commune-attributes.ts";

const UU_POP = new Map([["00760", 1_600_000]]);

test("tailleVille : une commune DANS une unité urbaine porte la population de l'agglomération", () => {
  assert.equal(tailleVilleFrom("00760", 8_000, UU_POP), 1_600_000);
});

test("tailleVille : une commune HORS unité urbaine est son propre bassin", () => {
  assert.equal(tailleVilleFrom(null, 11_000, UU_POP), 11_000);
});

test("tailleVille : population absente -> null, JAMAIS zéro", () => {
  assert.equal(tailleVilleFrom(null, null, UU_POP), null);
});

test("tailleVille : UU inconnue du cache -> repli sur la population communale", () => {
  assert.equal(tailleVilleFrom("99999", 4_200, UU_POP), 4_200);
});

test("communeAttributesFrom : les absences restent des absences (aucun repli sur zéro)", () => {
  const a = communeAttributesFrom(
    {
      insee: "99999", nom: "Sans-Donnée", dept: "31", lat: 43, lon: 1,
      population: 3_000, uu: null, altitude: null, relief_proximite: null, distance_cote_km: 90,
    },
    3_000,
  );
  assert.equal(a.altitude, null);
  assert.equal(a.reliefProximite, null);
  assert.equal(a.tailleVille, 3_000);
});
