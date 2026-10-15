import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { estCodeOutremer } from "./code-outremer.ts";

// HOTFIX FUT-104 · AUCUNE VALEUR DRIAS MÉTROPOLITAINE NE SORT POUR UN CODE ULTRAMARIN.
//
// 218 entités 97xxx/98xxx de data/data_climat.json portent des points de grille métropolitains (Fort-de-France :
// Le Conquet ; Saint-Denis de La Réunion : sud de la Corse). Chaque test ci-dessous ferme UNE surface de diffusion
// recensée dans docs/audits/2026-10-16-hotfix-fut104-donnees-outremer.md. Les vérifications HTTP sur un build de
// production sont dans scripts/verifier-hotfix-outremer.mjs.

const src = (f: string) => readFileSync(f, "utf8").replace(/^\s*\/\/.*$/gm, "");

test("estCodeOutremer : tous les préfixes 97 et 98 du COG, rien d'autre", () => {
  for (const c of ["97101", "97209", "97302", "97411", "97502", "97611", "97701", "97801", "98411", "98613", "98735", "98818", "98901"]) {
    assert.ok(estCodeOutremer(c), c);
  }
  for (const c of ["01001", "29040", "17300", "44109", "30189", "2A004", "2B033", "75056", "69123", "13055", "75101", "96123", "9741", "974110", "", "abcde"]) {
    assert.ok(!estCodeOutremer(c), c);
  }
});

test("Fichier statique : data_climat.json n'est plus sous public/, donc plus distribué tel quel", () => {
  assert.equal(existsSync("public/data_climat.json"), false);
  assert.ok(existsSync("data/data_climat.json"));
  for (const f of ["src/lib/drias-json.ts", "src/app/api/climat/[insee_code]/route.ts", "scripts/build-drias-median.js",
    "scripts/build-apercu-climat.mjs", "scripts/build-comparateur-index.mjs", "scripts/populate-communes-tension.js"]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /["']public["'],\s*["']data_climat\.json["']|public\/data_climat\.json/, f);
  }
});

test("Index DRIAS : aucune ligne ultramarine, 34 788 communes × 3 horizons, et l'échelle nationale n'en compte pas d'autre", () => {
  const lignes = JSON.parse(readFileSync("data/data_climat.json", "utf8")) as { insee_code: string | number; scenario: string; column09: number | null }[];
  assert.equal(lignes.length, 104364);
  assert.equal(lignes.filter((r) => estCodeOutremer(String(r.insee_code).padStart(5, "0"))).length, 0);
  for (const sc of ["gwl15", "gwl20", "gwl30"]) {
    // L'échelle d'un indicateur (getEchelle) se construit sur toutes les lignes de son horizon : sans ligne
    // ultramarine, elle compte exactement les 34 788 communes que DRIAS couvre.
    assert.equal(lignes.filter((r) => r.scenario === sc && r.column09 != null).length, 34788, sc);
  }
  const meta = JSON.parse(readFileSync("data/drias_median_metadata.json", "utf8"));
  assert.equal(meta.commune_count, 34788);
  // L'extrait de l'aperçu suit le fichier.
  const extrait = JSON.parse(readFileSync("src/data/apercu-climat-communes.json", "utf8"));
  assert.equal(Object.keys(extrait.communes).filter(estCodeOutremer).length, 0);
  assert.equal(extrait.source.fichier, "data/data_climat.json");
});

test("Fichiers publics : aucun ne contient de ligne climatique ultramarine", () => {
  const fichiers = (d: string): string[] => readdirSync(d, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? fichiers(`${d}/${e.name}`) : e.name.endsWith(".json") ? [`${d}/${e.name}`] : []));
  for (const f of fichiers("public")) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /"insee_code":\s*"?9[78]\d{3}"?\s*,\s*"commune_name"/, f);
  }
});

test("Libellés : un rang DRIAS se dit parmi les communes de l'Hexagone et de Corse, jamais « françaises »", () => {
  const r = src("src/lib/rang-national.ts");
  assert.match(r, /communes de l'Hexagone et de Corse les plus exposées/);
  assert.doesNotMatch(r, /communes françaises/);
  for (const seg of ["chaleur", "inondation"]) {
    const p = readFileSync(`src/app/(public)/${seg}/[insee_code]/page.tsx`, "utf8");
    assert.match(p, /\{" "\}communes de l&apos;Hexagone et de Corse comparées · DRIAS-TRACC/, "espace explicite : l'entité &apos; faisait perdre l'espace");
    assert.match(p, /item\.rang!\.total\.toLocaleString\('fr-FR'\)/, "l'effectif vient des données comparées");
    assert.doesNotMatch(p, /ensemble des communes françaises/);
  }
});

test("drias-json : getClimatDataCommune et getRangNational refusent le code avant de charger l'index", () => {
  const d = src("src/lib/drias-json.ts");
  for (const fn of ["getClimatDataCommune", "getRangNational"]) {
    const corps = d.slice(d.indexOf(`export async function ${fn}`));
    const garde = corps.indexOf("if (estCodeOutremer(safeInsee)) return null;");
    assert.ok(garde > 0 && garde < corps.indexOf("getIndex()"), fn);
  }
});

test("API : /api/climat refuse avant de lire le fichier ; /api/wizard-preview ne renvoie aucun score DRIAS ultramarin", () => {
  const climat = src("src/app/api/climat/[insee_code]/route.ts");
  assert.ok(climat.indexOf("estCodeOutremer(insee_code)") < climat.indexOf("readFileSync"));
  assert.match(climat, /status: 404/);
  const wizard = src("src/app/api/wizard-preview/route.ts");
  assert.match(wizard, /new Set\(\["canicule", "submersion", "feux", "secheresse"\]\)/);
  assert.match(wizard, /estCodeOutremer\(safeInsee\) \? tensionsBrutes\.filter\(\(t\) => !THEMES_DRIAS\.has\(t\.slug\)\)/);
  // /drias et /qna passent par getClimatDataCommune.
  assert.match(src("src/app/drias/route.ts"), /getClimatDataCommune\(inseeCode/);
});

test("Pages /chaleur et /inondation : 404 pour l'outre-mer, avant les métadonnées et avant toute donnée", () => {
  for (const seg of ["chaleur", "inondation"]) {
    const p = src(`src/app/(public)/${seg}/[insee_code]/page.tsx`);
    const meta = p.slice(p.indexOf("export async function generateMetadata"));
    const gardeMeta = meta.indexOf("if (estCodeOutremer(insee_code)) {");
    assert.ok(gardeMeta > 0 && gardeMeta < meta.indexOf("getClimatDataCommune"), `${seg} métadonnées`);
    assert.match(meta, /title: "Projections climatiques indisponibles · futur•e", robots: \{ index: false, follow: false \}/);
    const page = p.slice(p.indexOf("export default async function"));
    assert.ok(page.indexOf("if (estCodeOutremer(insee_code)) notFound();") < page.indexOf("getClimatDataCommune"), `${seg} page`);
    assert.match(p, /communesAPregenerer\(\)\.filter\(\(code\) => !estCodeOutremer\(code\)\)/, `${seg} prégénération`);
    const nf = readFileSync(`src/app/(public)/${seg}/[insee_code]/not-found.tsx`, "utf8");
    assert.match(nf, /ProjectionsIndisponibles/);
  }
  // La page d'explication ne porte ni chiffre, ni rang, ni appel au dossier.
  const pi = src("src/components/ProjectionsIndisponibles.tsx");
  assert.doesNotMatch(pi, /debloquer|checkout|dossier|\d+\s*(jours|nuits|°C)/i);
});

test("Sitemap : aucune page climatique ultramarine", () => {
  assert.match(src("src/app/sitemap.ts"), /!isArrondissement\(c\.code\) && !estCodeOutremer\(c\.code\)/);
});

test("Prégénération : les communes ultramarines du top 100 ne sont plus fabriquées au build", () => {
  const top = JSON.parse(readFileSync("src/data/top1000-communes.json", "utf8")) as string[];
  const om = top.slice(0, 100).filter(estCodeOutremer);
  // Saint-Denis, Saint-Paul, Nouméa, Saint-Pierre, Le Tampon, Fort-de-France, Mamoudzou, Cayenne.
  assert.deepEqual(om, ["97411", "97415", "98818", "97416", "97422", "97209", "97611", "97302"]);
});

test("Constructeurs : ni DRIAS ni communes_tension ne peuvent plus produire de ligne ultramarine", () => {
  assert.match(src("scripts/build-drias-median.js"), /joindreAuPointLePlusProche\(communes, points\)/);
  assert.match(src("scripts/populate-communes-tension.js"), /if \(\/\^9\[78\]\/\.test\(insee\)\) continue;/);
});
