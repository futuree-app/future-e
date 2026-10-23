// FUT-109 · Les artefacts versionnés portent la population au grain du référentiel : l'index du comparateur,
// et les données légères de l'accueil qui en dérivent. La règle elle-même est testée dans
// scripts/lib/population-grain.test.mjs ; ici, ce que lisent réellement le comparateur et l'accueil.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";

const referentiel = JSON.parse(readFileSync("data/population-referentiel-cog2025.json", "utf8"));
const index = JSON.parse(zlib.gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
const parCode = new Map(index.communes.map((c) => [c.insee, c]));
const accueil = JSON.parse(readFileSync("src/data/accueil-communes.json", "utf8"));
const col = Object.fromEntries(accueil.champs.map((c, i) => [c, i]));

test("index : les trois communes rétablies le 01/01/2024 ont leur population Insee, plus 0", () => {
  assert.deepEqual(
    ["85165", "85212", "60694"].map((k) => [k, parCode.get(k).population]),
    [["85165", 1250], ["85212", 1359], ["60694", 542]],
  );
});

test("index : chaque commune hors grain porte exactement la valeur du référentiel", () => {
  const ecarts = Object.entries(referentiel.communes)
    .filter(([k, r]) => parCode.get(k)?.population !== r.population)
    .map(([k, r]) => `${k} ${r.nom} : index ${parCode.get(k)?.population}, référentiel ${r.population}`);
  assert.deepEqual(ecarts, []);
});

test("index : aucun 0 qui ne soit un zéro officiel, et les absences restent null", () => {
  const zerosOfficiels = new Set(Object.entries(referentiel.communes).filter(([, r]) => r.population === 0).map(([k]) => k));
  assert.deepEqual(index.communes.filter((c) => c.population === 0 && !zerosOfficiels.has(c.insee)).map((c) => c.insee), []);
  // Les villages détruits de la Meuse : absents de la source sans mouvement du COG, laissés « non lus ».
  for (const { insee } of referentiel.absentesSansMouvement) assert.equal(parCode.get(insee).population, null, insee);
  assert.equal(index.meta.countWithPopulation, index.communes.filter((c) => c.population != null).length);
});

test("index : la taille hors unité urbaine suit la population corrigée", () => {
  for (const k of Object.keys(referentiel.communes)) {
    const c = parCode.get(k);
    if (c.hors_uu) assert.equal(c.uu_pop, c.population, k);
  }
});

test("accueil : les données légères recopient la population corrigée", () => {
  for (const k of ["85165", "85212", "60694", "85084", "60054"]) {
    const l = accueil.communes[k];
    assert.equal(l[col.population], parCode.get(k).population, k);
  }
  assert.equal(accueil.communes["85165"][col.tailleVille], 1250);
  assert.equal(accueil.communes["85165"][col.tailleVilleSource], "commune");
});
