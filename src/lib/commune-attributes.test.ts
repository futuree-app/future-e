import test from "node:test";
import assert from "node:assert/strict";
import { tailleVilleFrom, resolveTailleVille, communeAttributesFrom } from "./commune-attributes.ts";

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

test("tailleVille : UU DÉCLARÉE mais absente du cache -> ANOMALIE, null (plus de repli commune silencieux)", () => {
  assert.equal(tailleVilleFrom("99999", 4_200, UU_POP), null);
});

test("resolveTailleVille : UU trouvée -> value UU, source urban_unit", () => {
  assert.deepEqual(resolveTailleVille("00760", 8_000, UU_POP), { value: 1_600_000, source: "urban_unit" });
});

test("resolveTailleVille : pas d'UU -> value commune, source commune", () => {
  assert.deepEqual(resolveTailleVille(null, 42_000, UU_POP), { value: 42_000, source: "commune" });
});

test("resolveTailleVille : UU déclarée absente du cache -> null/null (invariant value<->source)", () => {
  assert.deepEqual(resolveTailleVille("99999", 42_000, UU_POP), { value: null, source: null });
});

test("resolveTailleVille : population UU invalide (NaN) -> null/null", () => {
  assert.deepEqual(resolveTailleVille("BAD", 42_000, new Map([["BAD", Number.NaN]])), { value: null, source: null });
});

test("resolveTailleVille : aucune population -> null/null", () => {
  assert.deepEqual(resolveTailleVille(null, null, UU_POP), { value: null, source: null });
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
