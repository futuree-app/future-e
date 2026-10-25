// FUT-109 · Le périmètre des indicateurs ADEME : règle pure. Les valeurs sont celles d'ADEME `data_communes`
// (Saint-Denis, Pierrefitte-sur-Seine, Orée d'Anjou), relevées le 24/10/2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  appliquerPerimetre, classerChamps, fusionsPosterieures, traitements, valeur, GEOGRAPHIE_LIGNES, GEOGRAPHIE_RECENTE,
} from "./perimetre-ademe.mjs";
import { pressionAgricole } from "./pression-agricole.mjs";

const REFERENTIEL = {
  "93066": { motif: "territoire_modifie", retablissement: false, codesRepris: ["93059"], mouvements: [{ mod: "32", date: "2025-01-01" }] },
  "15141": { motif: "territoire_modifie", retablissement: true, codesRepris: [], mouvements: [{ mod: "21", date: "2025-01-01" }] },
  "15031": { motif: "territoire_modifie", retablissement: true, codesRepris: [], mouvements: [{ mod: "21", date: "2025-01-01" }] },
  "49126": { motif: "code_modifie", retablissement: false, codesRepris: ["49069"], mouvements: [{ mod: "50", date: "2025-01-01" }] },
  // Rétablie le 01/01/2024 : la géographie des lignes la connaît déjà.
  "85165": { motif: "territoire_modifie", retablissement: true, codesRepris: [], mouvements: [{ mod: "21", date: "2024-01-01" }] },
};
const CHAMPS = [{ source: "apl_aux_medecins_generalistes" }, { source: "densite_de_population_2022" }, { source: "nombre_dincendies" }];
const ligne = (code, apl, densite, incendies) => ({ code_commune_insee: code, apl_aux_medecins_generalistes: apl, densite_de_population_2022: densite, nombre_dincendies: incendies });
// L'APL est publiée pour la commune absorbée (géographie des lignes) ; la densité ne l'est plus (COG 2025).
const LIGNES = [
  ligne("93066", 3.75, 9424.49, undefined),
  ligne("93059", 3.1, undefined, undefined),
  ligne("49069", 2.784, undefined, undefined),
  ligne("15141", 4.067, 61.32, undefined),
  ...Array.from({ length: 40 }, (_, i) => ligne(String(10000 + i), 3, 100, i < 2 ? 1 : undefined)),
];

test("valeur : une cellule vide est une absence, jamais 0 ; un niveau se lit par son rang", () => {
  assert.equal(valeur(""), null);
  assert.equal(valeur(undefined), null);
  assert.equal(valeur("0"), 0);
  assert.equal(valeur("71.9"), 71.9);
  assert.equal(valeur("3 - Centre structurant d'équipements et de services", true), 3);
});

test("fusions postérieures : seules les communes nouvelles d'après le 01/01/2024", () => {
  assert.deepEqual(fusionsPosterieures(REFERENTIEL), { "93066": ["93059"] });
});

test("géographie d'un champ : publiée pour l'absorbée = 2024 ; vide pour elle et dense ailleurs = 2025 ; sinon indécidable", () => {
  // Une seule commune absorbée : le seuil « au moins cinq attendues » ne peut pas être atteint ici.
  const g = classerChamps(LIGNES, REFERENTIEL, CHAMPS);
  assert.equal(g.apl_aux_medecins_generalistes.geographie, GEOGRAPHIE_LIGNES);
  assert.equal(g.densite_de_population_2022.geographie, null);
  // Avec assez de communes absorbées, un champ dense et vide pour toutes est au COG 2025.
  const ref = { ...REFERENTIEL };
  const lignes = [...LIGNES];
  for (let i = 0; i < 6; i++) {
    ref[`2000${i}`] = { motif: "territoire_modifie", retablissement: false, codesRepris: [`3000${i}`], mouvements: [{ mod: "32", date: "2025-01-01" }] };
    lignes.push(ligne(`2000${i}`, 2, 50, undefined), ligne(`3000${i}`, 2, undefined, undefined));
  }
  const g2 = classerChamps(lignes, ref, CHAMPS);
  assert.equal(g2.densite_de_population_2022.geographie, GEOGRAPHIE_RECENTE);
  assert.equal(g2.apl_aux_medecins_generalistes.geographie, GEOGRAPHIE_LIGNES);
  // Champ clairsemé (incendies) : aucune absorbée renseignée ne prouve rien.
  assert.equal(g2.nombre_dincendies.geographie, null);
});

const CHAMPS_GEO = {
  apl_aux_medecins_generalistes: { geographie: GEOGRAPHIE_LIGNES },
  moyenne_annuelle_de_concentration_de_pm25_ugm3: { geographie: GEOGRAPHIE_LIGNES },
  moyenne_annuelle_de_concentration_de_no2_ugm3: { geographie: GEOGRAPHIE_LIGNES },
  ift_t: { geographie: GEOGRAPHIE_LIGNES },
  p_sau: { geographie: GEOGRAPHIE_LIGNES },
  taux_de_logements_sociaux_percent: { geographie: GEOGRAPHIE_LIGNES },
  densite_de_population_2022: { geographie: GEOGRAPHIE_RECENTE },
  niveau_de_centres_dequipements_et_de_services_des_communes_2021: { geographie: GEOGRAPHIE_RECENTE },
};

test("traitements : abstention pour un territoire modifié, rattachement de l'ancien code pour un code modifié", () => {
  const t = traitements(REFERENTIEL, [...LIGNES, { code_commune_insee: "49069", apl_aux_medecins_generalistes: 2.784, ift_t: 2.17, p_sau: 67.89 }], CHAMPS_GEO);
  assert.deepEqual(Object.keys(t).sort(), ["15031", "15141", "49126", "93066"]); // L'Oie (2024) : au grain
  assert.deepEqual(t["93066"], { traitement: "abstention", ligne: true });
  assert.deepEqual(t["15031"], { traitement: "abstention", ligne: false });
  assert.equal(t["49126"].traitement, "rattachement");
  assert.equal(t["49126"].depuis, "49069");
  assert.equal(t["49126"].ligne, false);
  assert.equal(t["49126"].valeurs.apl_aux_medecins_generalistes, 2.784);
  // Champs « 2025 » : jamais rattachés (absents sous les deux codes).
  assert.equal("densite_de_population_2022" in t["49126"].valeurs, false);
});

const commune = (insee, apl, extra = {}) => ({
  insee, densite: 100, viv: { apl, pm25: 8, no2: 10, eloignement: 0 }, vivpct: { apl: 50, pm25: 50, no2: 50, eloignement: 0 },
  agri: { ift_t: 2, ift_h: 1, p_sau: 40, p_bio: 5, equip: 1 }, pression_agricole: 30, hlm_pct: 10, hlm_nb: 100, ...extra,
});
const PERIMETRE = {
  champs: CHAMPS_GEO,
  communes: {
    "93066": { traitement: "abstention", ligne: true },
    "15031": { traitement: "abstention", ligne: false },
    "49126": { traitement: "rattachement", depuis: "49069", ligne: false, valeurs: { apl_aux_medecins_generalistes: 2.5, moyenne_annuelle_de_concentration_de_pm25_ugm3: 8.6, moyenne_annuelle_de_concentration_de_no2_ugm3: 5.2, ift_t: 2.17, p_sau: 67.89, taux_de_logements_sociaux_percent: 7 } },
  },
};

test("appliquer : abstention sur les champs 2024 seulement, densité et centralité gardées", () => {
  const cs = [commune("93066", 3.75, { densite: 9424.49, agri: { ift_t: 0, ift_h: 0, p_sau: 0.13, p_bio: null, equip: 4 } }), commune("10000", 1), commune("10001", 2), commune("10002", 3)];
  const r = appliquerPerimetre(cs, PERIMETRE, pressionAgricole);
  const sd = cs[0];
  assert.deepEqual([sd.viv.apl, sd.vivpct.apl, sd.viv.pm25, sd.vivpct.pm25, sd.viv.no2, sd.agri.ift_t, sd.agri.p_sau, sd.pression_agricole, sd.hlm_pct], [null, null, null, null, null, null, null, null, null]);
  assert.deepEqual([sd.densite, sd.agri.equip, sd.viv.eloignement, sd.hlm_nb], [9424.49, 4, 0, 100]);
  assert.deepEqual(r, { abstentions: 1, rattachements: 0 });
  // Les autres communes ne bougent pas.
  assert.deepEqual(cs.slice(1).map((c) => [c.viv.apl, c.vivpct.apl]), [[1, 50], [2, 50], [3, 50]]);
});

test("appliquer : rattachement exact, percentile lu dans la distribution des autres, centralité retirée sans ligne", () => {
  const cs = [commune("49126", null, { densite: null, agri: { ift_t: null, ift_h: null, p_sau: null, p_bio: null, equip: null }, pression_agricole: null, hlm_pct: null }), commune("10000", 1), commune("10001", 2), commune("10002", 3)];
  appliquerPerimetre(cs, PERIMETRE, pressionAgricole);
  const oa = cs[0];
  assert.equal(oa.viv.apl, 2.5);
  assert.equal(oa.vivpct.apl, 100); // au-dessus de 1, 2 : rang 2 sur 0..2
  assert.equal(oa.agri.ift_t, 2.17);
  assert.equal(oa.pression_agricole, pressionAgricole(2.17, 67.89));
  assert.equal(oa.hlm_pct, 7);
  assert.equal("equip" in oa.agri, false); // non noté, pas « aucun centre »
  assert.equal(oa.densite, null);
  // Idempotent.
  const avant = JSON.stringify(cs);
  appliquerPerimetre(cs, PERIMETRE, pressionAgricole);
  assert.equal(JSON.stringify(cs), avant);
});

test("appliquer : une commune rétablie sans ligne ADEME perd sa centralité présumée", () => {
  const cs = [commune("15031", null, { agri: { ift_t: null, ift_h: null, p_sau: null, p_bio: null, equip: null } })];
  appliquerPerimetre(cs, PERIMETRE, pressionAgricole);
  assert.equal("equip" in cs[0].agri, false);
});

test("l'extrait généré pour l'application recopie l'artefact", async () => {
  const p = JSON.parse(readFileSync("data/perimetre-ademe-cog2025.json", "utf8"));
  const { PERIMETRE_ADEME, CHAMPS_ADEME_ANCIENNE_GEOGRAPHIE } = await import("../../src/lib/perimetre-ademe.generated.ts");
  assert.deepEqual(Object.keys(PERIMETRE_ADEME).sort(), Object.keys(p.communes).sort());
  for (const [k, t] of Object.entries(p.communes)) {
    assert.equal(PERIMETRE_ADEME[k].traitement, t.traitement, k);
    if (t.traitement === "rattachement") assert.equal(PERIMETRE_ADEME[k].depuis, t.depuis, k);
  }
  for (const [champ, g] of Object.entries(p.champs)) {
    if (["population_totale_2021", "surfcom2024", "population_au_dernier_recensement_2022"].includes(champ)) continue;
    assert.equal(CHAMPS_ADEME_ANCIENNE_GEOGRAPHIE.includes(champ), g.geographie !== GEOGRAPHIE_RECENTE, champ);
  }
  // Les preuves de l'artefact : population et densité 2022 au périmètre fusionné.
  assert.match(p.preuves.population2022, /^46\/46 /);
  assert.match(p.preuves.densite2022.constat, /^46\/46 /);
});
