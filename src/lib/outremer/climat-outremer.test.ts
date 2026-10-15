import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  creerLecteurOutremer, estCodeOutremer, indicateurOutremer, territoireDuCode, TERRITOIRES_OUTREMER,
  type IndicateurOutremer, type LectureClimatOutremer,
} from "./climat-outremer.ts";

// CONTRAT DE DONNÉES — CLIMAT ULTRAMARIN (SocleOM-Climat-2025, Météo-France), FUT-104.
//
// Ces tests lisent les fichiers réels de `src/data/outremer/` (produits par scripts/outremer/). Ils vérifient
// l'identité géographique, le bon jeu par territoire, les unités, la référence, les niveaux de réchauffement, les
// définitions, des ordres de grandeur confrontés aux chiffres publiés par Météo-France, et l'absence de toute valeur
// métropolitaine. « Une lecture existe » et « une lecture dit vrai » sont deux assertions distinctes (AGENTS.md).

const climat = JSON.parse(readFileSync("src/data/outremer/climat-outremer.json", "utf8"));
const communes = JSON.parse(readFileSync("src/data/outremer/communes-outremer.json", "utf8"));
const { getEntiteOutremer, listerEntitesOutremer, lireClimatOutremer, couvertureOutremer } = creerLecteurOutremer(climat, communes);

function integree(code: string): Extract<LectureClimatOutremer, { statut: "integree" }> {
  const l = lireClimatOutremer(code);
  assert.ok(l, `${code} : lecture absente`);
  assert.equal(l.statut, "integree", `${code} : statut ${l.statut}`);
  return l as Extract<LectureClimatOutremer, { statut: "integree" }>;
}
function ind(code: string, indicateur: string): IndicateurOutremer {
  const i = indicateurOutremer(integree(code), indicateur);
  assert.ok(i, `${code} : ${indicateur} absent`);
  return i;
}
const med = (i: IndicateurOutremer, h?: "2030" | "2050" | "2100") => (h ? i.horizons[h].valeur?.mediane : i.reference.mediane);

// ── Identité ─────────────────────────────────────────────────────────────────────────────────────────────────
test("Référentiel : les 223 entités ultramarines du COG, comptées par territoire", () => {
  const parPrefixe: Record<string, number> = {};
  for (const e of listerEntitesOutremer()) parPrefixe[e.code.slice(0, 3)] = (parPrefixe[e.code.slice(0, 3)] ?? 0) + 1;
  assert.deepEqual(parPrefixe, {
    "971": 32, "972": 34, "973": 22, "974": 24, "975": 2, "976": 17, "977": 1, "978": 1,
    "984": 5, "986": 3, "987": 48, "988": 33, "989": 1,
  });
  for (const e of listerEntitesOutremer()) {
    assert.ok(estCodeOutremer(e.code), e.code);
    assert.equal(territoireDuCode(e.code)?.id, e.territoire, e.code);
  }
});

test("Identité : le nom vient du COG et se désambiguïse par le territoire", () => {
  const cas: [string, string, string][] = [
    ["97411", "Saint-Denis", "Saint-Denis (La Réunion)"],
    ["97611", "Mamoudzou", "Mamoudzou (Mayotte)"],
    ["97302", "Cayenne", "Cayenne (Guyane)"],
    ["97120", "Pointe-à-Pitre", "Pointe-à-Pitre (Guadeloupe)"],
    ["97209", "Fort-de-France", "Fort-de-France (Martinique)"],
    ["98818", "Nouméa", "Nouméa (Nouvelle-Calédonie)"],
    ["98735", "Papeete", "Papeete (Polynésie française)"],
    ["97801", "Saint-Martin", "Saint-Martin"],
    ["97701", "Saint-Barthélemy", "Saint-Barthélemy"],
  ];
  for (const [code, nom, complet] of cas) {
    const e = getEntiteOutremer(code)!;
    assert.equal(e.nom, nom);
    assert.equal(e.nomComplet, complet);
  }
  // Homonyme métropolitain : 93066 n'est pas ultramarin et n'a pas d'entité ici.
  assert.equal(getEntiteOutremer("93066"), null);
  assert.equal(lireClimatOutremer("93066"), null);
  assert.equal(lireClimatOutremer("17300"), null);
  assert.equal(lireClimatOutremer("97999"), null, "code au format ultramarin mais absent du COG");
  assert.equal(territoireDuCode("97999")?.id, undefined, "préfixe 979 inconnu");
  assert.equal(estCodeOutremer("2A004"), false);
});

// ── Le bon jeu, la bonne référence, les bons niveaux ─────────────────────────────────────────────────────────
const ATTENDU: Record<string, { zone: string; n2050: number; n2030: number; n2100: number }> = {
  "97411": { zone: "Reunion", n2030: 1.5, n2050: 2.0, n2100: 2.9 },
  "97611": { zone: "Mayotte", n2030: 1.5, n2050: 2.0, n2100: 3.0 },
  "97302": { zone: "Guyane", n2030: 1.7, n2050: 2.3, n2100: 3.5 },
  "97120": { zone: "Guadeloupe", n2030: 1.4, n2050: 1.9, n2100: 2.7 },
  "97209": { zone: "Martinique", n2030: 1.4, n2050: 1.9, n2100: 2.7 },
  "98818": { zone: "NouvelleCaledonie", n2030: 1.5, n2050: 2.0, n2100: 3.0 },
  "98735": { zone: "PF-Societe", n2030: 1.2, n2050: 1.6, n2100: 2.3 },
  "97801": { zone: "SaintMartinBarthelemy", n2030: 1.4, n2050: 1.9, n2100: 2.7 },
  "97701": { zone: "SaintMartinBarthelemy", n2030: 1.4, n2050: 1.9, n2100: 2.7 },
};

test("Jeu : chaque cas lit la zone SocleOM de son territoire, référence 1991-2020, niveaux régionaux propres", () => {
  for (const [code, a] of Object.entries(ATTENDU)) {
    const l = integree(code);
    assert.equal(l.provenance.zone, a.zone, code);
    assert.equal(l.provenance.producteur, "Météo-France");
    assert.match(l.provenance.licence, /Licence Ouverte/);
    assert.equal(l.referencePeriode, "1991-2020");
    assert.deepEqual(l.niveaux, { "2030": a.n2030, "2050": a.n2050, "2100": a.n2100 }, code);
    assert.equal(l.fenetreHorizonAns, 20);
    assert.equal(l.capaciteDecision, "faits_seulement");
    assert.ok(l.provenance.archives.length >= 3 && l.provenance.archives.every((x) => /^[0-9a-f]{64}$/.test(x.sha256)));
    assert.ok(l.pixel.distanceKm < 2.5, `${code} : pixel à ${l.pixel.distanceKm} km`);
    // Aucun horizon ne parle de « +2,7 °C en France » ni de 1976-2005.
    assert.doesNotMatch(l.limites.join(" "), /France|1976/);
  }
});

test("Jeu : le niveau de réchauffement se lit dans les fichiers, pas dans le nom de l'archive (Mayotte)", () => {
  // L'archive « RWL27 » de Mayotte contient les fichiers RWL-20 : une lecture du nom aurait attribué +2,7 °C à 2050.
  const l = integree("97611");
  assert.ok(l.provenance.archives.some((a) => /RWL27_Netcdf/.test(a.cle)));
  assert.equal(l.niveaux["2050"], 2.0);
});

test("Jeu : 2050 n'est pas le même réchauffement partout ; on ne compare pas des horizons de territoires", () => {
  const n = Object.keys(ATTENDU).map((c) => integree(c).niveaux["2050"]);
  assert.deepEqual([...new Set(n)].sort(), [1.6, 1.9, 2.0, 2.3]);
});

// ── Unités et définitions ────────────────────────────────────────────────────────────────────────────────────
test("Unités et définitions : celles de Météo-France, vérifiées contre les fichiers NetCDF", () => {
  const defs = climat.indicateurs as Record<string, { unite: string; unite_fichier: string; definition_fichier: string }>;
  const fichier: Record<string, string> = { "°C": "C", "°C·jours": "C", jours: "day", mm: "mm", "%": "%" };
  for (const [code, d] of Object.entries(defs)) assert.equal(d.unite_fichier, fichier[d.unite], code);
  assert.match(defs.TX31D.definition_fichier, />= 31°C/);
  assert.match(defs.TN24D.definition_fichier, />= 24°C/);
  assert.match(defs.TR.definition_fichier, /> 20 °C/);
  assert.equal(ind("97411", "TMm").unite, "°C");
  assert.equal(ind("97411", "TX31D").unite, "jours");
  assert.equal(ind("97411", "PRCPTOT").unite, "mm");
});

test("Indicateurs : la sélection de chaque territoire, pas celle de la métropole", () => {
  // Jours chauds : 31 °C à La Réunion, 32 °C à Mayotte, en Nouvelle-Calédonie et en Polynésie, 33 °C en Guyane et aux Antilles.
  assert.ok(indicateurOutremer(integree("97411"), "TX31D"));
  assert.equal(indicateurOutremer(integree("97611"), "TX31D"), null);
  assert.ok(indicateurOutremer(integree("97611"), "TX32D"));
  assert.ok(indicateurOutremer(integree("97302"), "TX33D"));
  assert.ok(indicateurOutremer(integree("98818"), "TX32D"));
  assert.ok(indicateurOutremer(integree("98735"), "TX32D"));
  // Nuits : 24 °C en Guyane et en Nouvelle-Calédonie, 26 °C en Polynésie ; la nuit tropicale à 20 °C n'existe
  // qu'à La Réunion et à Mayotte (relief, altitude).
  assert.ok(indicateurOutremer(integree("97302"), "TN24D"));
  assert.equal(indicateurOutremer(integree("97411"), "TN24D"), null);
  assert.ok(indicateurOutremer(integree("98735"), "TN26D"));
  assert.ok(indicateurOutremer(integree("97411"), "TR"));
  assert.equal(indicateurOutremer(integree("97209"), "TR"), null);
  // Aucune clé métropolitaine (NORTX35D_yr, ATR_yr…) dans une lecture ultramarine.
  for (const code of Object.keys(ATTENDU)) {
    for (const i of integree(code).indicateurs) assert.doesNotMatch(i.code, /^(NOR|A[A-Z])|_yr$/, `${code} ${i.code}`);
  }
  // Chaque entité intégrée porte exactement la sélection de son territoire (24 ; 25 en Nouvelle-Calédonie, TN24D).
  for (const e of listerEntitesOutremer()) {
    const l = lireClimatOutremer(e.code)!;
    if (l.statut !== "integree") continue;
    assert.equal(l.indicateurs.length, e.territoire === "nouvelle-caledonie" ? 25 : 24, e.code);
  }
});

// ── Valeurs : ordres de grandeur et concordance avec Météo-France ────────────────────────────────────────────
test("Valeurs : températures moyennes tropicales, pas celles de la Bretagne", () => {
  for (const e of listerEntitesOutremer()) {
    const l = lireClimatOutremer(e.code)!;
    if (l.statut !== "integree") continue;
    const t = med(indicateurOutremer(l, "TMm")!)!;
    // La plus fraîche : La Plaine-des-Palmistes (~1 000 m, La Réunion), 16,5 °C. Le Conquet : 13,6 °C.
    assert.ok(t >= 16 && t <= 28.5, `${e.code} ${e.nom} : ${t} °C`);
  }
  assert.equal(med(ind("97411", "TMm")), 24.18);
  assert.equal(med(ind("97209", "TMm")), 27.58);
  assert.equal(med(ind("97302", "TMm")), 27.23);
});

test("Concordance Météo-France : les chiffres publiés pour la fin du siècle (« Quel climat futur pour les outre-mer »)", () => {
  // La Réunion, +2,9 °C : « 90 jours chauds par an [≥ 31 °C] sur le littoral », « contre une dizaine ».
  const sd = ind("97411", "TX31D");
  assert.ok(med(sd)! < 15 && med(sd, "2100")! > 80 && med(sd, "2100")! < 110, `Saint-Denis ${med(sd)} → ${med(sd, "2100")}`);
  // Mayotte, +3 °C : « environ 205 jours chauds par an (≥ 32 °C) », « contre une trentaine ».
  const mz = ind("97611", "TX32D");
  assert.ok(med(mz)! > 15 && med(mz)! < 40 && med(mz, "2100")! > 180 && med(mz, "2100")! < 230, `Mamoudzou ${med(mz)} → ${med(mz, "2100")}`);
  // Guyane, +3,5 °C : « environ 170 jours chauds (≥ 35 °C) », surtout l'intérieur ; le littoral en reste loin.
  assert.ok(med(ind("97353", "TX35D"), "2100")! > 140, "Maripasoula");
  assert.ok(med(ind("97302", "TX35D"), "2100")! < 60, "Cayenne, littoral");
  // Guyane : nuits ≥ 24 °C « environ 230 » sur la quasi-totalité du territoire, contre moins d'une dizaine hors littoral.
  const ma = ind("97353", "TN24D");
  assert.ok(med(ma)! < 10 && med(ma, "2100")! > 200, `Maripasoula ${med(ma)} → ${med(ma, "2100")}`);
  // Nouvelle-Calédonie, +3 °C : nuits ≥ 24 °C « multipliées par 4 ou 5 ».
  const nm = ind("98818", "TN24D");
  const ratio = med(nm, "2100")! / med(nm)!;
  assert.ok(ratio > 3 && ratio < 6, `Nouméa × ${ratio.toFixed(1)}`);
});

test("Écarts : tels que publiés, jamais recalculés en soustrayant deux médianes", () => {
  const sd = ind("97411", "TX31D");
  assert.equal(med(sd, "2050"), 47);
  assert.equal(sd.reference.mediane, 5.4);
  assert.equal(sd.horizons["2050"].ecart?.mediane, 41.1); // et non 47 − 5,4 = 41,6
});

test("Fourchettes : q17 ≤ médiane ≤ q83 partout où les trois sont publiés", () => {
  let vus = 0;
  const verifier = (f: { q17: number | null; mediane: number | null; q83: number | null } | null | undefined, ou: string) => {
    if (!f || f.q17 == null || f.mediane == null || f.q83 == null) return;
    assert.ok(f.q17 <= f.mediane + 1e-9 && f.mediane <= f.q83 + 1e-9, `${ou} : ${f.q17} / ${f.mediane} / ${f.q83}`);
    vus++;
  };
  for (const e of listerEntitesOutremer()) {
    const l = lireClimatOutremer(e.code)!;
    if (l.statut !== "integree") continue;
    for (const i of l.indicateurs) {
      verifier(i.reference, `${e.code} ${i.code} ref`);
      for (const h of ["2030", "2050", "2100"] as const) {
        verifier(i.horizons[h].valeur, `${e.code} ${i.code} ${h}`);
        verifier(i.horizons[h].ecart, `${e.code} ${i.code} ${h} écart`);
      }
    }
  }
  assert.ok(vus > 30000, `${vus} fourchettes vérifiées`);
});

test("Comptes de jours : entre 0 et 366, et plus de chaleur à chaque palier de réchauffement", () => {
  for (const e of listerEntitesOutremer()) {
    const l = lireClimatOutremer(e.code)!;
    if (l.statut !== "integree") continue;
    for (const i of l.indicateurs) {
      if (i.unite !== "jours") continue;
      for (const v of [i.reference.mediane, ...(["2030", "2050", "2100"] as const).map((h) => i.horizons[h].valeur?.mediane)]) {
        if (v != null) assert.ok(v >= 0 && v <= 366, `${e.code} ${i.code} : ${v}`);
      }
    }
    const t = indicateurOutremer(l, "TMm")!;
    assert.ok(med(t)! < med(t, "2030")! && med(t, "2030")! < med(t, "2050")! && med(t, "2050")! < med(t, "2100")!, e.code);
  }
});

// ── Absence, zéro, couverture partielle ──────────────────────────────────────────────────────────────────────
test("Absence : null quand Météo-France ne publie pas, 0 quand la mesure est nulle", () => {
  // Guyane : le cumul annuel de pluie n'est publié que pour la référence, pas pour les horizons.
  const p = ind("97302", "PRCPTOT");
  assert.ok(p.reference.mediane! > 2000);
  assert.equal(p.horizons["2050"].valeur, null);
  assert.equal(p.horizons["2050"].ecart, null);
  // Saint-Denis : aucun jour ≥ 35 °C, aujourd'hui comme en 2050. C'est une mesure, pas une absence.
  const tx35 = ind("97411", "TX35D");
  assert.equal(tx35.reference.mediane, 0);
  assert.equal(tx35.horizons["2050"].valeur?.mediane, 0);
});

test("Statuts : couverture partielle, point manquant, source non intégrée, source indisponible", () => {
  const statut = (c: string) => lireClimatOutremer(c)!.statut;
  assert.equal(statut("98735"), "integree"); // Papeete (Société)
  assert.equal(statut("98740"), "integree"); // Rangiroa (Tuamotu)
  assert.equal(statut("98744"), "integree"); // Rurutu (Australes)
  for (const c of ["98731", "98723", "98719", "98741"]) assert.equal(statut(c), "hors_grille", c); // Nuku-Hiva, Hiva-Oa, Gambier, Rapa
  assert.equal(statut("98748"), "point_de_reference_manquant"); // Taiarapu-Ouest : 20,6 °C au centre, 25,2 °C sur la côte
  for (const c of ["98611", "98612", "98613"]) assert.equal(statut(c), "source_non_integree", c); // Wallis-et-Futuna
  for (const c of ["97501", "97502", "98411", "98901"]) assert.equal(statut(c), "source_indisponible", c);
  const nh = lireClimatOutremer("98731")!;
  assert.equal(nh.capaciteDecision, "aucune");
  assert.ok(nh.statut !== "integree" && /une partie de Polynésie française/.test(nh.raison));
  assert.equal("indicateurs" in nh, false, "une entité non couverte ne porte aucune valeur");
});

test("Point de référence : la mairie, jamais un centroïde de relief contrasté", () => {
  // Papara (Tahiti) : la mairie de l'Annuaire de l'administration, sur la côte ; le centroïde est dans l'intérieur.
  const pa = integree("98734");
  assert.equal(pa.entite.point?.type, "mairie_annuaire");
  assert.ok(med(indicateurOutremer(pa, "TMm")!)! > 25);
  for (const e of listerEntitesOutremer()) {
    const l = lireClimatOutremer(e.code)!;
    if (l.statut !== "integree" || e.point?.type !== "centroide") continue;
    const et = indicateurOutremer(l, "TMm")!.etendueCommunaleReference;
    assert.ok(et && et[1] - et[0] <= 1, `${e.code} ${e.nom} : centroïde gardé sur un relief contrasté ${et}`);
  }
});

// ── Aucune contamination métropolitaine ──────────────────────────────────────────────────────────────────────
test("Contamination : DRIAS ne contient plus aucune ligne ultramarine, et SocleOM n'en reprend aucune signature", () => {
  // Les 218 entités ultramarines de l'ancien fichier DRIAS portaient, à l'horizon 2050, la température moyenne de
  // quatre points métropolitains : Le Conquet 13,57 °C, Bonifacio 18,08, Biriatou 14,38, Aléria 17,9. Elles en sont
  // retirées (constructeur, scripts/lib/drias-jointure.mjs) ; on vérifie qu'aucune n'y revient.
  const drias = JSON.parse(readFileSync("data/data_climat.json", "utf8")) as Record<string, string | number>[];
  assert.equal(drias.filter((r) => estCodeOutremer(String(r.insee_code).padStart(5, "0"))).length, 0);
  const signatures = new Set([13.57, 18.08, 14.38, 17.9]);
  // Une proximité de valeur ne prouve rien (La Plaine-des-Palmistes, à ~1 000 m, a 17,7 °C) : la contamination avait
  // deux signatures, la valeur exacte d'un de ces points et l'uniformité d'un territoire entier.
  const parTerritoire = new Map<string, Set<number>>();
  for (const e of listerEntitesOutremer()) {
    const l = lireClimatOutremer(e.code)!;
    if (l.statut !== "integree") continue;
    const t = med(indicateurOutremer(l, "TMm")!, "2050")!;
    assert.ok(!signatures.has(t), `${e.code} : ${t} °C, la valeur exacte d'un point métropolitain`);
    parTerritoire.set(e.territoire, (parTerritoire.get(e.territoire) ?? new Set<number>()).add(t));
  }
  for (const [id, valeurs] of parTerritoire) {
    const n = listerEntitesOutremer().filter((e) => e.territoire === id && lireClimatOutremer(e.code)!.statut === "integree").length;
    if (n >= 2) assert.ok(valeurs.size >= Math.min(n, 5), `${id} : ${valeurs.size} valeurs distinctes pour ${n} communes`);
  }
});

test("Garde-fous : le climat métropolitain ne sert aucun code ultramarin", () => {
  const src = (f: string) => readFileSync(f, "utf8").replace(/^\s*\/\/.*$/gm, "");
  const drias = src("src/lib/drias-json.ts");
  // getClimatDataCommune et getRangNational refusent le code AVANT de lire l'index.
  for (const fn of ["getClimatDataCommune", "getRangNational"]) {
    const corps = drias.slice(drias.indexOf(`export async function ${fn}`));
    assert.ok(corps.indexOf("estCodeOutremer(safeInsee)") < corps.indexOf("getIndex()"), fn);
  }
  assert.match(src("src/app/api/climat/[insee_code]/route.ts"), /estCodeOutremer\(insee_code\)/);
  assert.match(src("src/lib/apercu-territoire.ts"), /if \(estCodeOutremer\(insee\)\) return null;/);
});

// ── Matrice de couverture ────────────────────────────────────────────────────────────────────────────────────
test("Couverture : la matrice compte chaque entité une fois et dit la couverture de chaque territoire", () => {
  const m = couvertureOutremer();
  assert.equal(m.reduce((s, l) => s + l.entitesAttendues, 0), 223);
  const par = Object.fromEntries(m.map((l) => [l.territoire, l]));
  for (const id of ["guadeloupe", "martinique", "guyane", "reunion", "mayotte", "saint-martin", "saint-barthelemy", "nouvelle-caledonie"]) {
    assert.equal(par[id].parStatut.integree, par[id].entitesAttendues, id);
    assert.equal(par[id].couverture, "complete", id);
  }
  assert.deepEqual(par["polynesie-francaise"].parStatut, { integree: 26, hors_grille: 20, point_de_reference_manquant: 2 });
  assert.equal(par["polynesie-francaise"].couverture, "partielle");
  assert.equal(par["wallis-et-futuna"].couverture, "source_non_integree");
  for (const id of ["saint-pierre-et-miquelon", "taaf", "clipperton"]) assert.equal(par[id].couverture, "source_indisponible", id);
  // La doctrine (TERRITOIRES_OUTREMER) et les données ne se contredisent pas.
  for (const l of m) {
    const t = TERRITOIRES_OUTREMER[l.territoire];
    const n = l.parStatut.integree ?? 0;
    assert.equal(t.couverture === "complete", n === l.entitesAttendues, l.territoire);
    assert.equal(t.couverture === "partielle", n > 0 && n < l.entitesAttendues, l.territoire);
  }
});
