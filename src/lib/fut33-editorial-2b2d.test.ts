// FUT-33, phase 2B.2 D : ce que futur•e RACONTE de la mer.
//   « commune littorale » = classée « Mer » au titre de la loi Littoral (un angle de texte, jamais une preuve de risque) ;
//   la façade = la valeur officielle de la planification maritime, traduite par une convention versionnée ;
//   la position = la distance au rivage marin, jamais « En bord de mer » ;
//   aucun texte climat ne tire une cause de la mer ; aucun département ne fait plus un littoral.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { communeLittoraleMer, categorieDeFacade, presDuRivage, FACADE_EDITORIALE, REPERE_PRES_DU_RIVAGE_KM } from "./mer-recherche.ts";
import { deriveCategories } from "./commune-categories.ts";
import { deriveTerritoryType, deriveTerritoryMood, territoryTypeFromLabel } from "./territory-mood.ts";

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Record<string, any>[];
const par = new Map(communes.map((c) => [c.insee as string, c]));
const c = (insee: string) => { const x = par.get(insee); assert.ok(x, insee); return x!; };
const lire = (f: string) => readFileSync(new URL(f, racine), "utf8");

test("commune littorale = loi Littoral « Mer » ; l'orientation vient de la façade officielle", () => {
  const cas: [string, string, boolean, string | null][] = [
    ["22113", "Lannion", true, "littoral_atlantique"],   // NAMO
    ["17300", "La Rochelle", true, "littoral_atlantique"], // SA
    ["13004", "Arles", true, "littoral_mediterranee"],   // MED, centre pourtant à 13 km
    ["59183", "Dunkerque", true, null],                  // MEMN : littorale, sans orientation
    ["14118", "Caen", false, null],                      // non classée, à 9 km du rivage
    ["74010", "Annecy", false, null],                    // Lac
    ["17299", "Rochefort", false, null],                 // Estuaire
  ];
  for (const [insee, nom, littorale, orientation] of cas) {
    assert.equal(communeLittoraleMer(c(insee)), littorale, nom);
    assert.equal(categorieDeFacade(c(insee)), orientation, nom);
  }
  assert.equal(FACADE_EDITORIALE.version, "facade-editoriale-v1");
  const vie = lire("src/lib/comparateur-vie.ts");
  const bloc = vie.slice(vie.indexOf("export function deriveCategoriesFromEntry"), vie.indexOf("// ── Montagne", vie.indexOf("export function deriveCategoriesFromEntry")));
  assert.match(bloc, /communeLittoraleMer\(c\)/);
  assert.match(bloc, /categorieDeFacade\(c\)/);
  assert.doesNotMatch(bloc, /DEPT_|dept\)/);
});

test("le repli par département ne déclare plus aucun littoral, dans aucun département", () => {
  for (const insee of ["29019", "17300", "13055", "06088", "2A004", "59183", "33063", "64122"]) {
    assert.equal(deriveCategories(insee).some((x) => x.startsWith("littoral")), false, insee);
  }
});

test("typologie Territoire : « Littoral » vient de la commune ; un ancien libellé reste lisible", () => {
  assert.equal(deriveTerritoryType("59183", ["all", "littoral"]), "littoral_atlantique");
  assert.equal(deriveTerritoryType("59183"), "plaine", "sans catégories communales, aucun littoral deviné");
  const mood = deriveTerritoryMood({ communeName: "Dunkerque", inseeCode: "59183", categories: ["all", "littoral"] });
  assert.equal(mood.typeLabel, "Littoral");
  assert.doesNotMatch(JSON.stringify(mood), /océan/i);
  assert.equal(territoryTypeFromLabel("Littoral atlantique"), "littoral_atlantique");
  assert.equal(deriveTerritoryMood({ communeName: "X", inseeCode: "59183", typeLabel: "Littoral" }).type, "littoral_atlantique");
});

test("une promesse « au bord de l'eau » exige une commune littorale ET un centre près du rivage (repère 8 km)", () => {
  assert.equal(REPERE_PRES_DU_RIVAGE_KM, 8);
  assert.equal(communeLittoraleMer(c("13004")) && presDuRivage(c("13004")), false, "Arles : littorale, centre à 13 km");
  assert.equal(communeLittoraleMer(c("22113")) && presDuRivage(c("22113")), true, "Lannion");
  assert.equal(communeLittoraleMer(c("14118")) && presDuRivage(c("14118")), false, "Caen : non classée");
  const vie = lire("src/lib/comparateur-vie.ts");
  assert.match(vie, /const coastal = communeLittoraleMer\(c\) && presDuRivage\(c\);/);
});

test("la position se dit par la distance : carte d'identité, raison de carte, Dossier comparatif", () => {
  const identite = lire("src/lib/territory-identity.ts");
  assert.match(identite, /`Rivage marin à \$\{kmLisible\(p\.merCentreKm\)\}`/);
  const vie = lire("src/lib/comparateur-vie.ts");
  assert.match(vie, /proximite_mer: \(c\) => \(c\.mer_centre_km != null \? `rivage marin à \$\{kmLisible\(c\.mer_centre_km\)\}`/);
  assert.match(vie, /if \(dim\.id === "mer" && c\.mer_centre_km != null\) return `Rivage marin · \$\{kmLisible\(c\.mer_centre_km\)\}`;/);
  const faits = lire("src/lib/territoire/facts.ts");
  assert.match(faits, /merCentreKm: num\(e\.mer_centre_km\)/);
});

test("textes climat : aucune cause maritime affirmée sans donnée", () => {
  const climat = lire("src/components/report/QuartierClimatData.tsx");
  const bloc = climat.slice(climat.indexOf("function buildClimatWhy"), climat.indexOf("return core[type] + seasonClause;"));
  assert.ok(bloc.length > 500);
  // Les TEXTES (gabarits entre accents graves), pas les clés de type (`littoral_atlantique` reste un identifiant).
  const textes = (bloc.match(/`[^`]*`/g) ?? []).join("\n");
  assert.ok(textes.length > 300);
  assert.doesNotMatch(textes, /atlantique|océan|amortisseur|façade maritime|loin de la mer/i);
});

// ── Plus aucun reliquat ─────────────────────────────────────────────────────────────────────────────

const fichiersProduit = () => {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) out.push(p);
    }
  };
  walk(fileURLToPath(new URL("src", racine)));
  return out;
};

test("plus aucun reliquat : ancien proxy, tables départementales de façade, libellés de palier", () => {
  for (const f of fichiersProduit()) {
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /distance_cote_km|distanceCoteKm|DEPT_LITTORAL_ATLANTIQUE|FACADE_BY_DEPT|ANCRE_COAST_KM|excludeSeaMinKm|COAST_ANCHORS|COASTAL_DEPTS|DEPTS?_COTIERS?/, f);
    // Un littoral ne se déduit jamais d'un département. Seule exception assumée : les ZONES de recherche
    // « côte atlantique / Manche / Méditerranée » (geo-zones.ts), conventions de périmètre DITES au lecteur
    // (« les départements côtiers de l'Atlantique… »), qui délimitent un territoire et ne qualifient aucune commune.
    if (!f.endsWith("/geo-zones.ts")) assert.doesNotMatch(s, /départements? côtiers?/i, f);
    // Le prompt du parseur cite les MOTS DU LECTEUR (« loin de la mer ») : ce ne sont pas des libellés affichés.
    if (!f.endsWith("/parse/route.ts")) {
      assert.doesNotMatch(s, /["'`](En bord de mer|Proche du littoral|Loin de la mer|Climat maritime)["'`]/, f);
    }
  }
  assert.ok(communes.every((x) => !("distance_cote_km" in x)));
  assert.doesNotMatch(lire("scripts/build-comparateur-index.mjs"), /distance_cote_km|COAST_ANCHORS/);
});

test("submersion marine (/inondation) : le bloc côtier lit la loi Littoral ; le pipeline départemental est verrouillé", () => {
  const page = lire("src/app/(public)/inondation/[insee_code]/page.tsx");
  assert.match(page, /COMMUNES_MER\.has\(insee_code\)/);
  assert.doesNotMatch(page, /COASTAL_DEPTS/);
  const liste = JSON.parse(lire("src/data/communes-loi-littoral-mer.json")).communes as string[];
  const attendu = new Set<string>();
  for (const x of communes) {
    if ((x.loi_effective ?? []).includes("Mer")) { attendu.add(x.insee); if (x.loi_source_commune) attendu.add(x.loi_source_commune); }
  }
  assert.deepEqual([...liste].sort(), [...attendu].sort(), "la liste suit data/mer (régénérer : node scripts/mer/liste-communes-mer.mjs)");
  for (const insee of ["29019", "22113", "13055", "13207", "13004"]) assert.ok(liste.includes(insee), insee);
  for (const insee of ["14118", "33063", "17299", "74010"]) assert.ok(!liste.includes(insee), insee);
  const script = lire("scripts/populate-coastal-submersion.js");
  assert.match(script, /LEGACY \(FUT-33/);
  assert.match(script, /--legacy-confirme/);
});
