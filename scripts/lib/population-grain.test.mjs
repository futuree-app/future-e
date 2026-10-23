// FUT-109 · La population au grain du référentiel : règle pure. Les valeurs sont celles des fichiers Insee
// (populations légales 2021, populations de référence 2023, COG 2025) et d'ADEME `population_totale_2021`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  communesHorsGrain, construireCorrections, appliquerCorrections, effectifOfficiel, lireCsv, SOURCE_GRAIN,
} from "./population-grain.mjs";

// Extraits réels de v_mvt_commune_2025.csv (Insee, COG au 01/01/2025).
const MVT = [
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "85084", TYPECOM_AP: "COM", COM_AP: "85165" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COMD", COM_AV: "85165", TYPECOM_AP: "COM", COM_AP: "85165" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "85084", TYPECOM_AP: "COM", COM_AP: "85212" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "85084", TYPECOM_AP: "COM", COM_AP: "85084" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "60054", TYPECOM_AP: "COM", COM_AP: "60694" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "60054", TYPECOM_AP: "COM", COM_AP: "60054" },
  // Fusion du 01/01/2025 : Pierrefitte-sur-Seine rejoint Saint-Denis.
  { MOD: "32", DATE_EFF: "2025-01-01", TYPECOM_AV: "COM", COM_AV: "93059", TYPECOM_AP: "COM", COM_AP: "93066" },
  // Transfert de chef-lieu du 01/01/2025 : Orée d'Anjou change de code (49069 → 49126), pas de territoire.
  { MOD: "50", DATE_EFF: "2025-01-01", TYPECOM_AV: "COM", COM_AV: "49069", TYPECOM_AP: "COM", COM_AP: "49126" },
  // Création de 2016 : avant la géographie de la source, déjà prise en compte par la valeur 2021.
  { MOD: "32", DATE_EFF: "2016-01-01", TYPECOM_AV: "COM", COM_AV: "85165", TYPECOM_AP: "COM", COM_AP: "85084" },
  // Mouvements sans effet sur le territoire.
  { MOD: "10", DATE_EFF: "2024-06-01", TYPECOM_AV: "COM", COM_AV: "01001", TYPECOM_AP: "COM", COM_AP: "01001" },
  { MOD: "34", DATE_EFF: "2023-12-31", TYPECOM_AV: "COM", COM_AV: "14735", TYPECOM_AP: "COM", COM_AP: "14735" },
  { MOD: "35", DATE_EFF: "2024-01-01", TYPECOM_AV: "COMD", COM_AV: "01002", TYPECOM_AP: "COM", COM_AP: "01002" },
];
const INTERVALLE = { apres: "2023-01-01", jusqua: "2025-01-01" };

const COMMUNES = [
  { insee: "85165", nom: "L'Oie" },
  { insee: "85212", nom: "Sainte-Florence" },
  { insee: "60694", nom: "Les Hauts-Talican" },
  { insee: "85084", nom: "Essarts-en-Bocage" },
  { insee: "60054", nom: "Beaumont-les-Nonains" },
  { insee: "93066", nom: "Saint-Denis" },
  { insee: "01001", nom: "L'Abergement-Clémenciat" },
  { insee: "14735", nom: "Vendeuvre" },
  { insee: "55189", nom: "Fleury-devant-Douaumont" },
  { insee: "49126", nom: "Orée d'Anjou" },
  { insee: "99999", nom: "Commune fictive sans aucune valeur" },
];
// ADEME `population_totale_2021` tel que publié (0 pour les communes rétablies, valeur d'avant séparation pour
// la commune d'origine, valeur d'avant fusion pour Saint-Denis ; Fleury et Orée d'Anjou absentes).
const ADEME = new Map([
  ["85165", 0], ["85212", 0], ["60694", 0], ["85084", 9399], ["60054", 878], ["93066", 113942],
  ["01001", 832], ["14735", 805],
]);
// Populations de référence Insee 2023 (PMUN, limites au 01/01/2025).
const PL2023 = new Map([
  ["85165", 1250], ["85212", 1359], ["60694", 542], ["85084", 6851], ["60054", 339], ["93066", 149077],
  ["01001", 846], ["14735", 800], ["55189", 0], ["49126", 17162],
]);

const corrections = () =>
  construireCorrections({
    communes: COMMUNES, source2021: ADEME, horsGrain: communesHorsGrain(MVT, INTERVALLE), populationsGrain: PL2023,
  });

test("seuls les mouvements de territoire ou de code de l'intervalle comptent", () => {
  const m = communesHorsGrain(MVT, INTERVALLE);
  assert.deepEqual([...m.keys()].sort(), ["49126", "60054", "60694", "85084", "85165", "85212", "93059", "93066"]);
  assert.equal(m.has("49069"), false); // l'ancien code d'un transfert de chef-lieu n'est plus dans le référentiel
  assert.deepEqual(m.get("85165"), [{ mod: "21", date: "2024-01-01" }]); // le mouvement de 2016 est hors intervalle
  assert.equal(m.has("01001"), false); // changement de nom
  assert.equal(m.has("14735"), false); // fusion-association devenue fusion simple : territoire inchangé
});

test("les trois communes rétablies le 01/01/2024 reçoivent leur population officielle, jamais 0", () => {
  const c = corrections();
  assert.deepEqual(
    ["85165", "85212", "60694"].map((k) => [k, c[k].population, c[k].millesime, c[k].motif, c[k].valeur2021]),
    [
      ["85165", 1250, SOURCE_GRAIN.millesime, "territoire_modifie", 0],
      ["85212", 1359, SOURCE_GRAIN.millesime, "territoire_modifie", 0],
      ["60694", 542, SOURCE_GRAIN.millesime, "territoire_modifie", 0],
    ],
  );
});

test("la commune d'origine d'une défusion perd la population des communes rétablies", () => {
  const c = corrections();
  assert.equal(c["85084"].population, 6851); // et non 9 399 (Essarts-en-Bocage avant séparation)
  assert.equal(c["60054"].population, 339); // et non 878 (Les Hauts-Talican 2019-2023)
});

test("une commune nouvelle reçoit la population de son territoire fusionné", () => {
  assert.equal(corrections()["93066"].population, 149077); // et non 113 942 (Saint-Denis seule)
});

test("une commune au territoire inchangé garde sa valeur 2021, même si un mouvement non territorial la touche", () => {
  const c = corrections();
  assert.equal(c["01001"], undefined);
  assert.equal(c["14735"], undefined);
});

test("nouveau code d'un transfert de chef-lieu : valeur officielle au grain", () => {
  const c = corrections()["49126"];
  assert.deepEqual([c.population, c.millesime, c.motif, c.valeur2021], [17162, SOURCE_GRAIN.millesime, "code_modifie", null]);
});

test("absente de la source sans mouvement : l'absence reste une absence, rien n'est comblé", () => {
  const c = corrections();
  // Village détruit en 1916 : l'Insee publie 0 habitant, mais ce n'est pas un défaut de grain. L'index garde
  // null (« non lue »), et non un 0 qui changerait ce que lit l'accueil sans décision éditoriale.
  assert.equal(c["55189"], undefined);
  assert.equal(c["99999"], undefined);
});

test("un vrai zéro officiel reste un zéro ; aucune valeur officielle donne null, jamais 0", () => {
  const horsGrain = communesHorsGrain(MVT, INTERVALLE);
  const lOie = [{ insee: "85165", nom: "L'Oie" }];
  const zero = construireCorrections({ communes: lOie, source2021: ADEME, horsGrain, populationsGrain: new Map([["85165", 0]]) });
  assert.deepEqual([zero["85165"].population, zero["85165"].millesime], [0, SOURCE_GRAIN.millesime]);
  const aucune = construireCorrections({ communes: lOie, source2021: ADEME, horsGrain, populationsGrain: new Map() });
  assert.deepEqual([aucune["85165"].population, aucune["85165"].millesime], [null, null]);
  const index = [{ insee: "85165", population: 0 }];
  assert.deepEqual(appliquerCorrections(index, aucune), { corrigees: 0, absentes: 1 });
  assert.equal(index[0].population, null);
});

test("une cellule vide ou illisible du fichier officiel est une absence, pas un zéro", () => {
  assert.equal(Number(""), 0); // le piège
  assert.deepEqual(["", " ", "n.d.", "-3", "12.5", undefined, null].map(effectifOfficiel), [null, null, null, null, null, null, null]);
  assert.deepEqual(["0", "1250", " 542 "].map(effectifOfficiel), [0, 1250, 542]);
  for (const v of [null, Number.NaN, -1]) {
    const c = construireCorrections({
      communes: [{ insee: "85165", nom: "L'Oie" }], source2021: ADEME,
      horsGrain: communesHorsGrain(MVT, INTERVALLE), populationsGrain: new Map([["85165", v]]),
    });
    assert.equal(c["85165"].population, null);
  }
});

test("l'application est limitée aux communes corrigées, et idempotente", () => {
  const index = COMMUNES.map(({ insee }) => ({ insee, population: ADEME.get(insee) ?? null }));
  const c = corrections();
  appliquerCorrections(index, c);
  const premier = JSON.stringify(index);
  appliquerCorrections(index, c);
  assert.equal(JSON.stringify(index), premier);
  assert.equal(index.find((x) => x.insee === "01001").population, 832);
  assert.equal(index.find((x) => x.insee === "85165").population, 1250);
  assert.equal(index.filter((x) => x.population === 0).length, 0);
  assert.equal(index.find((x) => x.insee === "55189").population, null); // absente sans mouvement : intacte
});

test("lecture des CSV Insee : guillemets, BOM, fins de ligne CRLF", () => {
  assert.deepEqual(lireCsv('﻿"MOD","COM_AP"\r\n"21","85165"\r\n', ","), [{ MOD: "21", COM_AP: "85165" }]);
  assert.deepEqual(lireCsv("COM;PMUN\n85165;1250\n", ";"), [{ COM: "85165", PMUN: "1250" }]);
});
