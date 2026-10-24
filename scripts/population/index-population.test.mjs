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

test("index : une commune nouvelle du 01/01/2024, déjà regroupée par la source, garde sa population 2021", () => {
  // Bazeilles 2 502 = 2 365 + 137 (La Moncelle) : au grain, aucune raison de changer de millésime.
  assert.equal(referentiel.communes["08053"], undefined);
  assert.equal(parCode.get("08053").population, 2502);
});

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

test("index : aucun score de vie locale ni de démographie calculé sur un autre territoire", () => {
  const ecarts = [];
  for (const [k, r] of Object.entries(referentiel.communes)) {
    const c = parCode.get(k);
    // Un rétablissement partage un territoire que le code RNA ne répartit pas : pas de vie locale notée.
    if (r.retablissement && c.vieLocale != null) ecarts.push(`${k} ${r.nom} : vieLocale ${JSON.stringify(c.vieLocale)}`);
    // La base RP 2021 décrit le territoire d'avant : pas de démographie notée.
    if (r.motif === "territoire_modifie" && c.demographie != null) ecarts.push(`${k} ${r.nom} : demographie ${JSON.stringify(c.demographie)}`);
  }
  assert.deepEqual(ecarts, []);
});

test("index : pas de rang sans score (une bande d'avant affirmerait une position)", () => {
  const orphelines = [];
  for (const c of index.communes) {
    if (c.rankBands?.vie_locale && c.vieLocale == null) orphelines.push(`${c.insee} vie_locale`);
    if (c.rankBands?.croissance_demographique && c.demographie?.croissance == null) orphelines.push(`${c.insee} croissance`);
  }
  assert.deepEqual(orphelines, []);
});

test("accueil : les données légères recopient la population corrigée", () => {
  for (const k of ["85165", "85212", "60694", "85084", "60054"]) {
    const l = accueil.communes[k];
    assert.equal(l[col.population], parCode.get(k).population, k);
  }
  assert.equal(accueil.communes["85165"][col.tailleVille], 1250);
  assert.equal(accueil.communes["85165"][col.tailleVilleSource], "commune");
});
