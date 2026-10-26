#!/usr/bin/env node
// FUT-80 · Capture les réponses RÉELLES du RNB et de l'ADEME pour les tests (`src/lib/__fixtures__/fut80/`).
// Les empreintes (`shape`) sont retirées : le code de production ne les lit pas, et elles pèsent.
// Lecture seule, sources publiques, sans jeton.
// Usage : node scripts/fut80/capturer-fixtures.mjs [cas…]   (sans argument : tous ; avec : seulement ceux-là,
// pour ajouter un cas sans recapturer, donc sans faire bouger, les fixtures déjà relues)

import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "src/lib/__fixtures__/fut80";
mkdirSync(OUT, { recursive: true });
const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets";
// Le SELECT de `dpe.ts` (SELECT_LOGEMENT), recopié : la fixture doit avoir la forme que la production lit.
const SELECT = "numero_dpe,identifiant_ban,etiquette_dpe,etiquette_ges,adresse_ban,annee_construction,surface_habitable_logement,type_batiment,numero_etage_appartement,complement_adresse_logement,date_etablissement_dpe,conso_5_usages_par_m2_ep,emission_ges_5_usages_par_m2,indicateur_confort_ete,logement_traversant,protection_solaire_exterieure,type_ventilation,classe_inertie_batiment,isolation_toiture,presence_brasseur_air,qualite_isolation_murs,qualite_isolation_menuiseries,methode_application_dpe,appartement_non_visite,surface_habitable_immeuble,nombre_appartement,id_rnb,provenance_id_rnb,_geopoint";

async function j(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
const sansForme = (corps) => ({ ...corps, results: corps.results.map((b) => { const c = { ...b }; delete c.shape; return c; }) });
const rnb = async (ban) => sansForme(await j(`https://rnb-api.beta.gouv.fr/api/alpha/buildings/?cle_interop_ban=${ban}`));
const lignes = async (qs) => {
  const out = [];
  for (const ds of ["dpe03existant", "dpe02neuf"]) {
    const r = await j(`${ADEME}/${ds}/lines?qs=${encodeURIComponent(qs)}&size=50&sort=-date_etablissement_dpe&select=${SELECT}`);
    out.push(...r.results.map((x) => { const c = { ...x }; delete c._score; return c; }));
  }
  return out;
};

const cas = {
  // Immeuble d'angle : aucun DPE au 2 rue des Alliés, 18 de logement et celui de l'immeuble au 122 rue du 1er Mars.
  villeurbanne_angle: { ban: "69266_0110_00002", label: "2 Rue des Alliés 69100 Villeurbanne", insee: "69266" },
  // Maison : un DPE enregistré au 58, même bâtiment que le 55.
  la_couarde_maison: { ban: "17121_0249_00055", label: "55 Grande Rue 17670 La Couarde-sur-Mer", insee: "17121" },
  // DPE saisis par le diagnostiqueur sur un bâtiment à 182 m de l'adresse où ils sont enregistrés.
  thenac_contradiction: { ban: "17444_0140_00043", label: "43 Rue de la République 17460 Thénac", insee: "17444" },
  // Maison à candidat unique, ID-RNB d'un bâtiment à 78 m (référentiel changé depuis la reprise).
  monchaux_auto: { ban: "59407_0051_00055", label: "55 Rue du Chaufour 59224 Monchaux-sur-Écaillon", insee: "59407" },
  // Sept bâtiments à une adresse.
  puyravault_ambigu: { ban: "17293_0061_00003", label: "3 Rue du Stade 17700 Puyravault", insee: "17293" },
  // Aucun bâtiment au référentiel.
  bordeaux_aucun: { ban: "33063_8927_00009", label: "9 Sente des Thoniers 33100 Bordeaux", insee: "33063" },
  // Revue indépendante du 26/10/2026 : trois bâtiments à l'adresse, un seul DPE de maison, sans id_rnb.
  la_rochelle_trois_batiments: { ban: "17300_1150_00027", label: "27 Rue des Brandes 17000 La Rochelle", insee: "17300" },
};

const demandes = process.argv.slice(2);
for (const [nom, c] of Object.entries(cas).filter(([n]) => demandes.length === 0 || demandes.includes(n))) {
  const r = await rnb(c.ban);
  const ids = r.results.map((b) => b.rnb_id);
  const parAdresse = await lignes(`identifiant_ban:"${c.ban}"`);
  const parBatiment = ids.length === 1 ? await lignes(`id_rnb:"${ids[0]}"`) : [];
  writeFileSync(`${OUT}/${nom}.json`, JSON.stringify({ capture: new Date().toISOString(), ...c, rnb: r, ademe_adresse: parAdresse, ademe_batiment: parBatiment }, null, 1));
  console.error(`${nom} : ${ids.length} bâtiment(s), ${parAdresse.length} DPE à l'adresse, ${parBatiment.length} par le bâtiment`);
}
