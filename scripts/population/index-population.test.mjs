// FUT-109 · Les artefacts versionnés portent la population au grain du référentiel : l'index du comparateur,
// et les données légères de l'accueil qui en dérivent. La règle elle-même est testée dans
// scripts/lib/population-grain.test.mjs ; ici, ce que lisent réellement le comparateur et l'accueil.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";

const referentiel = JSON.parse(readFileSync("data/population-referentiel-cog2025.json", "utf8"));
const perimetre = JSON.parse(readFileSync("data/perimetre-ademe-cog2025.json", "utf8"));
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

test("index : changement de code seul, la démographie de l'ancien code est rattachée (même territoire)", () => {
  const codes = Object.entries(referentiel.communes).filter(([, r]) => r.motif === "code_modifie").map(([k]) => k);
  assert.deepEqual(codes.sort(), ["12218", "14581", "49126", "69114"]);
  for (const k of codes) assert.equal(typeof parCode.get(k).demographie?.croissance, "number", k);
});

test("index : indicateurs ADEME de 2024, non lus sur un territoire modifié depuis, rattachés pour un code modifié", () => {
  const ecarts = [];
  for (const [k, t] of Object.entries(perimetre.communes)) {
    const c = parCode.get(k);
    const lus = [c.viv.apl, c.vivpct.apl, c.viv.pm25, c.vivpct.pm25, c.viv.no2, c.vivpct.no2, c.agri.ift_t, c.agri.ift_h, c.agri.p_sau, c.agri.p_bio, c.pression_agricole, c.hlm_pct];
    if (t.traitement === "abstention" && lus.some((v) => v != null)) ecarts.push(`${k} : ${JSON.stringify(lus)}`);
    if (t.traitement === "rattachement") {
      const v = t.valeurs;
      const attendu = [v.apl_aux_medecins_generalistes, v.moyenne_annuelle_de_concentration_de_pm25_ugm3, v.moyenne_annuelle_de_concentration_de_no2_ugm3, v.ift_t, v.p_sau, v.taux_de_logements_sociaux_percent];
      const lu = [c.viv.apl, c.viv.pm25, c.viv.no2, c.agri.ift_t, c.agri.p_sau, c.hlm_pct];
      if (JSON.stringify(lu) !== JSON.stringify(attendu)) ecarts.push(`${k} : ${JSON.stringify(lu)} au lieu de ${JSON.stringify(attendu)}`);
      if (c.vivpct.apl == null) ecarts.push(`${k} : APL sans percentile`);
    }
    // Sans ligne ADEME, aucun niveau de centralité présumé (null vaudrait « aucun centre »).
    if (!t.ligne && "equip" in c.agri) ecarts.push(`${k} : agri.equip ${c.agri.equip}`);
  }
  assert.deepEqual(ecarts, []);
  // La densité 2022 des communes nouvelles est au périmètre fusionné : gardée.
  assert.equal(parCode.get("93066").densite, 9424.49);
});

test("index : mobilité, rétablissements du 01/01/2025 non notés, changements de code rattachés", () => {
  for (const k of ["15141", "15031", "15035", "15047", "15171"]) assert.equal(parCode.get(k).mobilite, null, k);
  for (const k of ["12218", "14581", "49126", "69114"]) assert.equal(typeof parCode.get(k).mobilite?.part_voiture, "number", k);
});

test("index : pas de rang sans score, pour les critères touchés par FUT-109", () => {
  const orphelines = [];
  for (const c of index.communes) {
    if (c.rankBands?.acces_soins && c.vivpct?.apl == null) orphelines.push(`${c.insee} acces_soins`);
    if (c.rankBands?.faible_dependance_auto && c.mobilite == null) orphelines.push(`${c.insee} faible_dependance_auto`);
    if (c.rankBands?.acces_services && c.agri?.equip === undefined && !/^(751\d\d|6938\d|132\d\d)$/.test(c.insee)) orphelines.push(`${c.insee} acces_services`);
  }
  assert.deepEqual(orphelines, []);
});

test("index : un arrondissement a l'emploi de la zone d'emploi de sa ville (Insee ZE2020)", () => {
  const emploi = JSON.parse(readFileSync("data/communes-emploi.json", "utf8")).data;
  const parZe = (ze) => Object.values(emploi).find((e) => e.ze === ze);
  for (const c of index.communes.filter((x) => /^(751\d\d|6938\d|132\d\d)$/.test(x.insee))) {
    const ze = c.insee.startsWith("751") ? "1109" : c.insee.startsWith("6938") ? "8421" : "9312";
    assert.deepEqual(c.emploi, { ze, taille: parZe(ze).taille, diversite: parZe(ze).diversite }, c.insee);
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
