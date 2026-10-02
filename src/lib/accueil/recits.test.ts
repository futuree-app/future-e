// FUT-37 : ce que les cartes de l'accueil RACONTENT, pas seulement qu'elles apparaissent.
//
// Les communes du panel sont réelles (__fixtures__/panel.json : valeurs DRIAS de public/data_climat.json,
// drapeaux GASPAR et catégories relevés le 02/10/2026). Avant FUT-37, la carte d'accroche disait à
// Chamonix (0 jour au-dessus de 35 °C) que les chaleurs extrêmes « pourraient durer plusieurs semaines
// par an » ; à Briançon (0 jour d'indice forêt-météo ≥ 40) que le risque d'incendie « pourrait
// fortement progresser » ; à Rodez que « l'accès à l'eau pourrait devenir plus tendu ».
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  apercuCommune,
  cartesClimat,
  carteMachineASous,
  carteRisqueRecense,
  getDriaSub,
  getEmptyStateCopy,
  getHeroCopy,
  getPreviewCards,
  getQuestionIntro,
  gwlDeHorizon,
  HORIZONS_ACCUEIL,
  MACHINE_A_SOUS_DRIAS,
  type CarteApercu,
  type HorizonAccueil,
  type Indicators,
} from "./recits.ts";
import { checkRecitPublic } from "../garde-fous/assertions.ts";
import { HORIZON } from "../horizons.ts";

type Commune = { nom: string; categories: string[]; flags: Record<string, boolean>; drias: Record<string, Record<string, number>> };
const PANEL = JSON.parse(readFileSync(new URL("./__fixtures__/panel.json", import.meta.url), "utf8")).communes as Record<string, Commune>;
const H: HorizonAccueil[] = ["reference", "2030", "2050", "2100"];

const ind = (drias: Record<string, Record<string, number>>): Indicators =>
  Object.fromEntries(Object.entries(drias).map(([g, v]) => [g, Object.fromEntries(Object.entries(v).map(([k, n]) => [k, { value_numeric: n }]))]));

const climat = (insee: string, h: HorizonAccueil, geo: unknown = { flags: PANEL[insee].flags }) => {
  const c = PANEL[insee];
  return cartesClimat(c.nom, c.categories, ind(c.drias), geo as never, h);
};
const carte = (insee: string, h: HorizonAccueil, cle: string) => climat(insee, h).find((x) => x.cle === cle);
const texte = (c: CarteApercu | undefined) => (c ? [c.titre, c.fait, c.lecture, c.limite].filter(Boolean).join(" ") : "");

/** Une grille synthétique : toutes les valeurs d'un indicateur, y compris nulles, à tous les horizons. */
function grille(valeurs: Record<string, number>): Indicators {
  return ind({ gwl15: valeurs, gwl20: valeurs, gwl30: valeurs });
}
const TOUTES_CATEGORIES = ["mediterranee", "rural_forestier", "rural_agricole", "montagne", "littoral", "littoral_atlantique", "rural_viticole", "tension_hydrique_connue", "vallee_industrielle"];
const DRAPEAUX_VRAIS = { flags: { marineSubmersion: true, flood: true, clay: true, landslide: true, wildfire: true } };

/** Toutes les sorties possibles des cartes sur une grille de valeurs et de drapeaux. */
function toutesLesSorties(): CarteApercu[] {
  const out: CarteApercu[] = [];
  for (const n of [0, 0.04, 0.4, 0.96, 1, 1.4, 3, 8, 14, 31, 66, 144]) {
    const v = { NORTX35D_yr: n, ATX35D_yr: n / 2, NORTR_yr: n, ATR_yr: n / 2, NORIFM40_yr: n, AIFM40_yr: n / 2, NORSWI04_yr: n, ASWI04_yr: n / 3, NORTMm_seas_DJF: n / 10 - 3, ATMm_seas_DJF: 1.2 };
    for (const h of H) for (const geo of [null, { flags: {} }, DRAPEAUX_VRAIS]) {
      out.push(...cartesClimat("Saint-Exemple", TOUTES_CATEGORIES, grille(v), geo, h));
      out.push(...getPreviewCards("Saint-Exemple", TOUTES_CATEGORIES, grille(v), geo, h));
    }
  }
  for (const c of Object.values(PANEL)) for (const h of H) out.push(...getPreviewCards(c.nom, c.categories, ind(c.drias), { flags: c.flags }, h));
  return out;
}

// ── Temps ────────────────────────────────────────────────────────────────────────────────────

test("T5 temps : l'onglet de gauche est la référence 1976-2005, plus aucun « Aujourd'hui »", () => {
  assert.deepEqual(HORIZONS_ACCUEIL.map((h) => h.label), ["1976-2005", "2030", "2050", "2100"]);
  assert.ok(!HORIZONS_ACCUEIL.some((h) => /aujourd|actuel/i.test(h.label + h.mention)));
  assert.equal(gwlDeHorizon("reference"), null);
});

test("T5 temps : sous la référence, aucune carte DRIAS ne cite une valeur projetée", () => {
  // Nîmes : gwl15 = 8,7 jours au-dessus de 35 °C, référence reconstruite = 2,6. L'ancien « Aujourd'hui »
  // était construit sur gwl15.
  const c = carte("30189", "reference", "chaleur")!;
  assert.equal(c.fait, "3 jours par an sur la période de référence 1976-2005.");
  for (const x of climat("30189", "reference")) assert.doesNotMatch(x.fait, /horizon|2030|2050|2100/);
});

test("T6 temps : chaque onglet lit SON scénario, et gwl30 n'est jamais 2050", () => {
  assert.equal(gwlDeHorizon("2030"), "gwl15");
  assert.equal(gwlDeHorizon("2050"), "gwl20");
  assert.equal(gwlDeHorizon("2100"), "gwl30");
  for (const h of HORIZONS_ACCUEIL.filter((x) => x.key !== "reference")) {
    const k = gwlDeHorizon(h.key)!;
    assert.match(h.mention, new RegExp(HORIZON[k].france.replace("+", "\\+")));
  }
  // La mention de 2050 porte +2,7 °C, jamais +4 °C.
  assert.match(HORIZONS_ACCUEIL.find((h) => h.key === "2050")!.mention, /\+2,7 °C/);
  assert.doesNotMatch(HORIZONS_ACCUEIL.find((h) => h.key === "2050")!.mention, /\+4/);
});

test("T1 valeur : le chiffre affiché est celui du scénario de l'horizon, pas d'un autre", () => {
  // Nîmes, jours au-dessus de 35 °C : 8,7 (2030), 14,4 (2050), 31,3 (2100).
  assert.match(carte("30189", "2030", "chaleur")!.fait, /^9 jours par an à l'horizon 2030/);
  assert.match(carte("30189", "2050", "chaleur")!.fait, /^14 jours par an à l'horizon 2050/);
  assert.match(carte("30189", "2100", "chaleur")!.fait, /^31 jours par an à l'horizon 2100/);
});

// ── Valeur ───────────────────────────────────────────────────────────────────────────────────

test("T2 valeur : Brest n'a pas un récit de chaleur extrême courante", () => {
  // TX35 Brest : 0,2 / 0,4 / 0,9 ; référence 0,1.
  assert.equal(carte("29019", "2050", "chaleur")!.fait, "Moins d'une journée par an à l'horizon 2050, comme sur 1976-2005.");
  assert.equal(carte("29019", "2100", "chaleur")!.fait, "Moins d'une journée par an à l'horizon 2100, comme sur 1976-2005.");
});

test("T2 valeur : Chamonix n'a pas « plusieurs semaines » au-dessus de 35 °C", () => {
  for (const h of H) {
    const c = carte("74056", h, "chaleur")!;
    assert.match(c.fait, /^Aucune journée par an/);
    assert.deepEqual(checkRecitPublic(texte(c)), []);
  }
});

test("T2 valeur : Briançon (0 à 1 jour d'IFM ≥ 40) n'a pas de récit de forte progression", () => {
  assert.equal(
    carte("05023", "2050", "feux")!.fait,
    "Aucune journée par an de danger météorologique élevé pour les feux (indice forêt-météo ≥ 40), à l'horizon 2050, comme sur 1976-2005.",
  );
  assert.match(carte("05023", "2100", "feux")!.fait, /^1 jour par an/);
  for (const h of H) assert.doesNotMatch(texte(carte("05023", h, "feux")), /progress|augment|fortement|plus fréquent/);
});

test("T2 valeur : une valeur nulle ou faible ne porte jamais de hausse, de « courant » ni de durée", () => {
  for (const n of [0, 0.04, 0.4, 0.96]) {
    const v = { NORTX35D_yr: n, ATX35D_yr: n, NORTR_yr: n, ATR_yr: n, NORIFM40_yr: n, AIFM40_yr: n, NORSWI04_yr: n, ASWI04_yr: n };
    for (const h of H) for (const c of cartesClimat("X", TOUTES_CATEGORIES, grille(v), null, h)) {
      assert.doesNotMatch(texte(c), /plus fréquent|courant|davantage|s'intensifi|progress|semaines|durer/, `${n} ${h} ${c.cle}`);
      assert.equal(c.lecture, undefined, `aucune lecture sur une valeur < 1 (${c.cle}, ${n})`);
    }
  }
});

test("T3 valeur : la comparaison suit le signe réel de l'écart (aucune hausse plaquée)", () => {
  // Projeté 10, écart 0 : la référence vaut 10, la carte dit « comme sur 1976-2005 ».
  const egal = cartesClimat("X", [], grille({ NORTX35D_yr: 10, ATX35D_yr: 0 }), null, "2050").find((c) => c.cle === "chaleur")!;
  assert.equal(egal.fait, "10 jours par an à l'horizon 2050, comme sur 1976-2005.");
  // Écart négatif (référence plus haute) : la carte dit la référence plus haute, sans « hausse ».
  const baisse = cartesClimat("X", [], grille({ NORTX35D_yr: 10, ATX35D_yr: -5 }), null, "2050").find((c) => c.cle === "chaleur")!;
  assert.equal(baisse.fait, "10 jours par an à l'horizon 2050, contre 15 sur 1976-2005.");
  // Hiver plus froid que la référence : aucune lecture « plus doux ».
  const froid = cartesClimat("X", ["montagne"], grille({ NORTMm_seas_DJF: -2, ATMm_seas_DJF: -0.5 }), null, "2050").find((c) => c.cle === "hivers")!;
  assert.equal(froid.lecture, undefined);
});

// ── Grandeur ─────────────────────────────────────────────────────────────────────────────────

test("T4 + T7 + T8 + T9 grandeur : aucune sortie possible n'affirme durée, eau, neige, occurrence de feu, crue", () => {
  const sorties = toutesLesSorties();
  assert.ok(sorties.length > 1000);
  for (const c of sorties) assert.deepEqual(checkRecitPublic(texte(c)), [], texte(c));
});

test("T7 grandeur : Rodez lit des sols secs, plus « l'accès à l'eau »", () => {
  const c = carte("12202", "2050", "sols-secs")!;
  assert.equal(c.titre, "Sols secs à Rodez");
  assert.equal(c.fait, "Environ 119 jours par an de sol sec, à l'horizon 2050, contre 94 sur 1976-2005.");
  assert.match(c.limite!, /ne mesure ni les nappes, ni les rivières, ni l'eau du robinet/);
});

test("T8 grandeur : Chamonix lit une température d'hiver, rien sur la neige", () => {
  const c = carte("74056", "2100", "hivers")!;
  assert.equal(c.fait, "Température moyenne de l'hiver : −1,8 °C à l'horizon 2100, contre −5,1 °C sur 1976-2005.");
  assert.equal(c.lecture, "Des hivers plus doux de 3,3 °C.");
  assert.doesNotMatch(texte(c), /neige|ski|station|économie|touris/i);
});

test("T9 grandeur : la carte feux nomme la météo et sa limite, et juxtapose GASPAR sans raccord", () => {
  const c = carte("30189", "2050", "feux")!;
  assert.equal(c.titre, "Météo propice aux feux à Nîmes");
  assert.equal(c.fait, "50 jours par an de danger météorologique élevé pour les feux (indice forêt-météo ≥ 40), à l'horizon 2050, contre 34 sur 1976-2005.");
  assert.equal(c.limite, "Cet indice décrit des conditions météorologiques favorables aux feux ; il ne mesure ni la végétation ni la probabilité qu'un incendie se déclare.");
  assert.equal(c.lecture, "Par ailleurs, l'État recense un risque de feu de forêt sur la commune (Géorisques).");
  // Sans drapeau GASPAR, pas de second fait.
  assert.equal(climat("30189", "2050", { flags: {} }).find((x) => x.cle === "feux")!.lecture, undefined);
});

test("T13 grain : aucune sortie ne parle d'un logement, d'une adresse ni de quartiers", () => {
  for (const c of toutesLesSorties()) {
    assert.doesNotMatch(texte(c), /votre logement|ce logement|votre adresse|des quartiers|autour de ce/i, texte(c));
  }
});

// ── Géorisques ───────────────────────────────────────────────────────────────────────────────

test("T10 Géorisques : un risque recensé est identique sur les quatre horizons", () => {
  for (const insee of ["17300", "29019", "12202", "30189", "56260", "40184"]) {
    const parHorizon = H.map((h) => climat(insee, h).find((c) => /submersion|inondation|argiles|terrain/.test(c.cle)));
    assert.ok(parHorizon[0], insee);
    for (const c of parHorizon) assert.deepEqual(c, parHorizon[0]);
  }
  // Le texte de La Rochelle, en clair.
  const lr = carte("17300", "2100", "submersion")!;
  assert.equal(lr.titre, "Submersion marine à La Rochelle");
  assert.equal(lr.fait, "L'État recense un risque de submersion marine sur la commune.");
  assert.equal(lr.limite, "Ce recensement ne dit pas quelle partie de la commune est concernée ni comment elle évoluera. L'exposition d'une adresse se vérifie dans le dossier Logement.");
  assert.match(lr.source, /fait actuel, sans projection/);
});

test("T11 Géorisques : aucune submersion sans drapeau GASPAR, même `littoral` (Vannes)", () => {
  const vannes = PANEL["56260"];
  assert.ok(vannes.categories.includes("littoral"));
  assert.equal(vannes.flags.marineSubmersion, undefined);
  for (const h of H) {
    for (const geo of [{ flags: vannes.flags }, null, undefined, { flags: {} }]) {
      const cles = getPreviewCards(vannes.nom, vannes.categories, ind(vannes.drias), geo as never, h).map((c) => c.cle);
      assert.ok(!cles.includes("submersion"), `${h} ${JSON.stringify(geo)}`);
    }
    // Sans aucune donnée (l'ancien état de chargement), plus aucune carte climat ni risque.
    const vide = getPreviewCards(vannes.nom, vannes.categories, {}, null, h).map((c) => c.cle);
    assert.deepEqual(vide.filter((k) => !["mobilite", "nature", "vie-locale"].includes(k)), []);
  }
  assert.equal(carteRisqueRecense("Vannes", null), null);
});

test("T10 Géorisques : le grain communal est dit, et l'adresse renvoyée au dossier Logement", () => {
  for (const flags of [{ marineSubmersion: true }, { flood: true }, { clay: true }, { landslide: true }]) {
    const c = carteRisqueRecense("X", { flags })!;
    assert.match(c.fait, /^L'État recense un risque .* sur la commune\.$/);
    assert.match(c.limite!, /dossier Logement/);
  }
});

// ── Récits supprimés ────────────────────────────────────────────────────────────────────────

test("T12 immobilier, vigne, air, pluies, sols GisSol : plus aucune carte, quelles que soient les catégories", () => {
  const cles = new Set(toutesLesSorties().map((c) => c.cle));
  for (const morte of ["immobilier", "vigne", "air", "pluies", "sols", "valeur"]) assert.ok(!cles.has(morte), morte);
  for (const c of toutesLesSorties()) assert.doesNotMatch(texte(c), /prix|valeur immobili|assur|vigne|cépage|raisin|ozone|crue/i);
});

test("D9 : `rural_viticole` et `tension_hydrique_connue` ne déclenchent plus aucun récit", () => {
  const base = PANEL["17300"]; // La Rochelle porte `tension_hydrique_connue` dans la table manuelle
  const avec = cartesClimat(base.nom, ["tension_hydrique_connue", "rural_viticole"], ind(base.drias), null, "2050").map((c) => c.cle);
  const sans = cartesClimat(base.nom, [], ind(base.drias), null, "2050").map((c) => c.cle);
  assert.deepEqual(avec, sans);
  assert.doesNotMatch(getQuestionIntro("X", ["rural_viticole"], false), /viticult/);
  assert.doesNotMatch(getQuestionIntro("X", ["tension_hydrique_connue"], false), /ressource|stress|tension/);
});

// ── Cadrage et sous-titres ──────────────────────────────────────────────────────────────────

test("cadrage : plus de promesse d'enneigement, d'assurance, d'accès à l'eau ni de tension sur l'eau", () => {
  const cats = [["littoral"], ["montagne"], ["urbain_dense_sud"], ["mediterranee"], ["rural_peri_urbain"], ["rural_agricole"], ["littoral_mediterranee"], ["urbain_dense_nord"], ["all"]];
  for (const c of cats) for (const fb of [true, false]) {
    const t = [getHeroCopy("X", c, fb), getQuestionIntro("X", c, fb), getEmptyStateCopy(c)].join(" ");
    assert.doesNotMatch(t, /enneigement|assurance|accès à l'eau|tension sur l'eau|stress hydrique|ressource en eau|saisons touristiques/i, `${c} ${fb}`);
    assert.deepEqual(checkRecitPublic(t), [], t);
  }
});

test("D2 : la question sur l'eau du robinet n'est plus illustrée par des jours de sol sec", () => {
  const rodez = ind(PANEL["12202"].drias);
  for (const h of H) assert.equal(getDriaSub("eau_potable", h, rodez, "Rodez", "Ressource, qualité, restrictions"), "Ressource, qualité, restrictions");
  // Les autres sous-titres restent chiffrés aux horizons projetés, et nomment la météo pour les feux.
  assert.match(getDriaSub("feux", "2050", ind(PANEL["30189"].drias), "Nîmes", "s"), /^50 jours par an de météo très propice aux feux$/);
  assert.equal(getDriaSub("feux", "reference", ind(PANEL["30189"].drias), "Nîmes", "s"), "s");
});

// ── Machine à sous ─────────────────────────────────────────────────────────────────────────

test("machine à sous : Vannes n'a plus de submersion, et aucune carte n'emploie +4 °C, « seront » ni un classement", () => {
  assert.equal(carteMachineASous("Vannes", "risque"), null);
  for (const v of ["Lyon", "Marseille", "Vannes", "La Rochelle"] as const) {
    for (const f of ["chaleur", "nuits", "risque"] as const) {
      const c = carteMachineASous(v, f);
      if (!c) continue;
      assert.doesNotMatch(texte(c) + c.source, /\+4|seront|parmi les|les plus exposées/);
      assert.deepEqual(checkRecitPublic(texte(c)), []);
      if (f !== "risque") assert.match(c.fait, /à l'horizon 2050/);
    }
  }
  assert.equal(carteMachineASous("Lyon", "chaleur")!.fait, "8 jours par an à l'horizon 2050, contre 2 sur 1976-2005.");
  assert.equal(carteMachineASous("Marseille", "risque")!.fait, "L'État recense un risque de submersion marine sur la commune.");
});

test("machine à sous : les valeurs figées n'ont pas dérivé de public/data_climat.json", () => {
  const COL: Record<string, string> = { NORTX35D_yr: "column08", ATX35D_yr: "column23", NORTR_yr: "column10", ATR_yr: "column25" };
  const lignes = JSON.parse(readFileSync("public/data_climat.json", "utf8")) as Record<string, string | number>[];
  for (const [insee, parGwl] of Object.entries(MACHINE_A_SOUS_DRIAS)) {
    for (const [gwl, valeurs] of Object.entries(parGwl)) {
      const ligne = lignes.find((r) => String(r.insee_code).padStart(5, "0") === insee && r.scenario === gwl)!;
      for (const [k, v] of Object.entries(valeurs)) assert.equal(Number(ligne[COL[k]]), v, `${insee} ${gwl} ${k}`);
    }
  }
});

// ── Panel réel : ce que chaque commune lit à l'horizon 2050 ─────────────────────────────────

test("T16 panel réel (2050) : les faits écrits en clair", () => {
  const attendu: Record<string, Record<string, string>> = {
    "29019": { chaleur: "Moins d'une journée par an à l'horizon 2050, comme sur 1976-2005.", submersion: "L'État recense un risque de submersion marine sur la commune." },
    "74056": { chaleur: "Aucune journée par an à l'horizon 2050, comme sur 1976-2005.", hivers: "Température moyenne de l'hiver : −3,1 °C à l'horizon 2050, contre −5,1 °C sur 1976-2005." },
    "05023": { chaleur: "Aucune journée par an à l'horizon 2050, comme sur 1976-2005." },
    "30189": { chaleur: "14 jours par an à l'horizon 2050, contre 3 sur 1976-2005.", nuits: "69 nuits par an où la température ne descend pas sous 20 °C, à l'horizon 2050, contre 33 sur 1976-2005." },
    "12202": { chaleur: "7 jours par an à l'horizon 2050, contre moins d'une sur 1976-2005.", inondation: "L'État recense un risque d'inondation sur la commune." },
    "56260": { chaleur: "2 jours par an à l'horizon 2050, contre moins d'une sur 1976-2005." },
    "17300": { chaleur: "3 jours par an à l'horizon 2050, contre moins d'une sur 1976-2005.", submersion: "L'État recense un risque de submersion marine sur la commune." },
    "13207": { nuits: "90 nuits par an où la température ne descend pas sous 20 °C, à l'horizon 2050, contre 51 sur 1976-2005." },
    "44109": { chaleur: "4 jours par an à l'horizon 2050, contre moins d'une sur 1976-2005.", inondation: "L'État recense un risque d'inondation sur la commune." },
    "40184": { feux: "2 jours par an de danger météorologique élevé pour les feux (indice forêt-météo ≥ 40), à l'horizon 2050, contre moins d'une sur 1976-2005.", submersion: "L'État recense un risque de submersion marine sur la commune." },
  };
  for (const [insee, cartes] of Object.entries(attendu)) {
    for (const [cle, fait] of Object.entries(cartes)) assert.equal(carte(insee, "2050", cle)?.fait, fait, `${PANEL[insee].nom} ${cle}`);
  }
});

test("T16 panel réel : la carte d'accroche (position 1) est toujours un fait chiffré et sourcé", () => {
  for (const c of Object.values(PANEL)) for (const h of H) {
    const cartes = getPreviewCards(c.nom, c.categories, ind(c.drias), { flags: c.flags }, h);
    assert.ok(cartes.length >= 3 && cartes.length <= 4);
    assert.equal(cartes[0].cle, "chaleur", `${c.nom} ${h}`);
    assert.match(cartes[0].fait, /par an/);
    assert.match(cartes[0].source, /DRIAS/);
    for (const x of cartes) assert.ok(x.fait && x.source, `${c.nom} ${x.cle}`);
  }
});

// ── Chargement ───────────────────────────────────────────────────────────────────────────────

test("D10 chargement : tant que les données ne sont pas arrivées, aucune phrase, quelles que soient les catégories", () => {
  const vannes = PANEL["56260"];
  for (const h of H) {
    for (const geo of [null, { flags: vannes.flags }, DRAPEAUX_VRAIS]) {
      const a = apercuCommune({ commune: vannes.nom, chargement: true, categories: [...vannes.categories, ...TOUTES_CATEGORIES], indicators: {}, georisques: geo, horizon: h });
      assert.deepEqual(a, { etat: "squelette" });
    }
  }
  // Une fois chargé, les cartes reviennent, construites sur les vraies données.
  const pret = apercuCommune({ commune: vannes.nom, chargement: false, categories: vannes.categories, indicators: ind(vannes.drias), georisques: { flags: vannes.flags }, horizon: "2050" });
  assert.equal(pret.etat, "cartes");
  assert.ok(pret.etat === "cartes" && pret.cartes[0].fait.startsWith("2 jours par an"));
});
