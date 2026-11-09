// FUT-183 : un chiffre affiché ne suggère jamais une autre catégorie que celle affichée. `land.category` se lit sur
// des parts au dixième (règle, dans l'ordre : urbanisé ≥ 50 ; naturel ≥ 45 ; agricole ≥ 50 ; naturel < 20 ; sinon
// mixte). Arrondies à l'entier, ces parts faisaient lire « 45 % de ses terres en espaces naturels » sous
// « Occupation mixte » à Rochefort (44,9 %). Les parts OSO s'affichent désormais au dixième (`pctOso`).
//
// Deux assertions distinctes (AGENTS.md) : la carte APPARAÎT avec la bonne catégorie, et ce qu'elle RACONTE, relu
// par un lecteur qui applique la règle aux seuls chiffres affichés, donne la même catégorie.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { buildTerritoireSnapshot, landCategory, landShares, LAND_LABEL, type LandCategory, type TerritoireInputs } from "./territoire/facts.ts";
import { derivedOf, factOf, type FactsSnapshot } from "./facts/contract.ts";
import { buildTerritoryCards, COMPOSITION_LABELS } from "./territory-identity.ts";
import { projectForSynthesis, SYNTHESIS_CONTRACT_VERSION } from "./territoire/synthesis-contract.ts";
import { deterministicSynthesis } from "./territoire/synthesis-deterministe.ts";
import { pctOso } from "./territoire/oso-format.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";

type Nature = { brut_pct: number; radius_pct: number | null; composition: Record<string, number> };
type Entree = { insee: string; nom: string; nature?: Nature | null };

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Entree[];
const par = new Map(communes.map((c) => [c.insee, c]));

const T0 = "2026-11-09T00:00:00.000Z";
function snapAvec(nature: Nature, insee = "17094", nom = "Commune test"): FactsSnapshot {
  const i: TerritoireInputs = chatelaillonInputs();
  i.insee = insee;
  i.communeName = nom;
  i.entry = { ...i.entry!, nature };
  return buildTerritoireSnapshot(i, T0);
}
const snapDe = (insee: string) => {
  const c = par.get(insee);
  assert.ok(c?.nature, insee);
  return snapAvec({ brut_pct: c!.nature!.brut_pct, radius_pct: c!.nature!.radius_pct, composition: c!.nature!.composition }, insee, c!.nom);
};

/** Une commune sans eau : les parts des terres sont celles données, au dixième près. */
function nature(p: { urb: number; agri: number; foret: number }): Nature {
  return {
    brut_pct: p.foret,
    radius_pct: 30,
    composition: { artificialise: p.urb, agricole: p.agri, foret: p.foret, prairies: 0, landes_pelouses: 0, mineral_dunes: 0, eau: 0 },
  };
}

// ── Le lecteur : il ne connaît que les chiffres affichés, et la règle ─────────────────────────

const lire = (s: string) => Number(s.replace(",", "."));
const CLE: Record<string, string> = Object.fromEntries(Object.entries(COMPOSITION_LABELS).map(([k, l]) => [l, k]));

/** Ce que montre la carte « Espaces naturels » (face, volet, ventilation), formaté comme l'écran (`pctOso`). */
function carteAffichee(snap: FactsSnapshot) {
  const c = buildTerritoryCards(snap).couvertNaturel!;
  return {
    label: c.headlineLabel,
    headline: `${pctOso(c.naturelTerresPct)} % de ses terres en espaces naturels`,
    ventilation: c.composition.slice(0, 5).map((x) => ({ label: x.label, value: `${pctOso(x.pct)} %` })),
  };
}
function categorieLueSurLaCarte(snap: FactsSnapshot): LandCategory {
  const a = carteAffichee(snap);
  const nat = lire(a.headline.match(/^([\d,]+) %/)![1]);
  const comp: Record<string, number> = {};
  for (const v of a.ventilation) comp[CLE[v.label]] = lire(v.value.replace(" %", ""));
  return landCategory(nat, comp);
}
const ligneSols = (t: string) => t.split(/(?<=\.)\s+/).find((x) => /terres\.$/.test(x)) ?? "";
function categorieLueDansLeTexte(snap: FactsSnapshot): LandCategory {
  const l = ligneSols(deterministicSynthesis(projectForSynthesis(snap, "gwl20") as never, "gwl20"));
  const pris = (re: RegExp) => { const m = l.match(re); return m ? lire(m[1]) : 0; };
  return landCategory(pris(/([\d,]+) % d'espaces naturels/), {
    artificialise: pris(/([\d,]+) % d'espaces urbanisés/),
    agricole: pris(/([\d,]+) % de cultures/),
  });
}

// ── Le format ────────────────────────────────────────────────────────────────────────────────

test("pctOso : au dixième, virgule décimale, décimale nulle omise", () => {
  assert.equal(pctOso(44.9), "44,9");
  assert.equal(pctOso(45), "45");
  assert.equal(pctOso(45.0), "45");
  assert.equal(pctOso(19.9), "19,9");
  assert.equal(pctOso(49.9), "49,9");
  assert.equal(pctOso(7.7), "7,7");
  assert.equal(pctOso(0), "0");
  assert.equal(pctOso(100), "100");
  assert.equal(pctOso(36.4 * 1), "36,4");
  assert.equal(pctOso(0.1 + 0.2), "0,3", "le bruit flottant ne sort pas");
});

// ── Les frontières, dans l'ordre réel des règles ───────────────────────────────────────────────

type Cas = { nom: string; p: { urb: number; agri: number; foret: number }; cat: LandCategory; nat: string };
const FRONTIERES: Cas[] = [
  { nom: "naturel 44,9 : sous le seuil de 45", p: { urb: 30, agri: 25.1, foret: 44.9 }, cat: "mixed", nat: "44,9" },
  { nom: "naturel 45,0 : seuil atteint", p: { urb: 30, agri: 25, foret: 45 }, cat: "high_natural", nat: "45" },
  { nom: "naturel 19,9 : sous le seuil de 20", p: { urb: 35.1, agri: 45, foret: 19.9 }, cat: "low_natural", nat: "19,9" },
  { nom: "naturel 20,0 : seuil atteint", p: { urb: 35, agri: 45, foret: 20 }, cat: "mixed", nat: "20" },
  { nom: "urbanisé 49,9 : sous le seuil de 50", p: { urb: 49.9, agri: 20.1, foret: 30 }, cat: "mixed", nat: "30" },
  { nom: "urbanisé 50,0 : seuil atteint", p: { urb: 50, agri: 20, foret: 30 }, cat: "mostly_built", nat: "30" },
  { nom: "agricole 49,9 : sous le seuil de 50", p: { urb: 20.1, agri: 49.9, foret: 30 }, cat: "mixed", nat: "30" },
  { nom: "agricole 50,0 : seuil atteint", p: { urb: 20, agri: 50, foret: 30 }, cat: "agricultural", nat: "30" },
  // L'ordre des règles : l'urbanisé passe avant le naturel, le naturel avant l'agricole, l'agricole avant « faible ».
  { nom: "urbanisé 50,0 et naturel 50,0 : l'urbanisé l'emporte", p: { urb: 50, agri: 0, foret: 50 }, cat: "mostly_built", nat: "50" },
  { nom: "urbanisé 49,9 et naturel 45,0 : le naturel l'emporte", p: { urb: 49.9, agri: 5.1, foret: 45 }, cat: "high_natural", nat: "45" },
  { nom: "naturel 44,9 et agricole 50,0 : l'agricole l'emporte", p: { urb: 5.1, agri: 50, foret: 44.9 }, cat: "agricultural", nat: "44,9" },
  { nom: "naturel 19,9 et agricole 49,9 : faible présence", p: { urb: 30.2, agri: 49.9, foret: 19.9 }, cat: "low_natural", nat: "19,9" },
  { nom: "naturel 19,9 et agricole 50,0 : l'agricole l'emporte", p: { urb: 30.1, agri: 50, foret: 19.9 }, cat: "agricultural", nat: "19,9" },
];

for (const c of FRONTIERES) {
  test(`frontière · ${c.nom}`, () => {
    const snap = snapAvec(nature(c.p));
    // La carte apparaît avec la catégorie du registre…
    assert.equal(derivedOf(snap, "land.category")!.value, c.cat);
    const a = carteAffichee(snap);
    assert.equal(a.label, LAND_LABEL[c.cat]);
    // … et ce qu'elle raconte dit la même chose.
    assert.equal(a.headline, `${c.nat} % de ses terres en espaces naturels`);
    assert.equal(categorieLueSurLaCarte(snap), c.cat, "la carte, relue");
    assert.equal(categorieLueDansLeTexte(snap), c.cat, "le texte déterministe, relu");
    assert.match(ligneSols(deterministicSynthesis(projectForSynthesis(snap, "gwl20") as never, "gwl20")), new RegExp(`${c.nat} % d'espaces naturels sur ses terres\\.$`));
  });
}

// ── Rochefort, le cas du ticket ────────────────────────────────────────────────────────────────

test("Rochefort : 44,9 % de terres naturelles sous « Occupation mixte », sur la carte comme dans le texte", () => {
  const snap = snapDe("17299");
  assert.equal(factOf(snap, "land.natural_share")!.value, 44.9);
  assert.equal(factOf(snap, "land.water_share")!.value, 7.7);
  assert.equal(derivedOf(snap, "land.category")!.label, "Occupation mixte");
  const a = carteAffichee(snap);
  assert.equal(a.headline, "44,9 % de ses terres en espaces naturels");
  assert.deepEqual(a.ventilation.map((v) => `${v.label} ${v.value}`), [
    "Espaces urbanisés 47,7 %", "Prairies 33,6 %", "Terres agricoles 7,6 %", "Forêts 5,5 %", "Landes et pelouses 5,1 %",
  ]);
  const p = projectForSynthesis(snap, "gwl20") as Record<string, any>;
  assert.equal(p.occupation_des_sols.part_espaces_naturels_des_terres_pct, 44.9);
  const t = deterministicSynthesis(p as never, "gwl20");
  assert.equal(
    ligneSols(t),
    "Ses sols mêlent espaces urbanisés, espaces naturels et cultures : 47,7 % d'espaces urbanisés, 7,6 % de cultures et 44,9 % d'espaces naturels sur ses terres.",
  );
  assert.doesNotMatch(t, /\b45 %/);
});

// ── National, sur l'index réel ─────────────────────────────────────────────────────────────────

test("diagnostic : à l'entier, 318 communes montraient les chiffres d'une autre catégorie ; au dixième, aucune", () => {
  let oso = 0, entier = 0, dixieme = 0;
  for (const c of communes) {
    const s = landShares(c.nature?.brut_pct, c.nature?.composition);
    if (!s) continue;
    oso++;
    const cat = landCategory(s.naturalLandPct, s.composition);
    const affiche = (f: (n: number) => number) =>
      landCategory(f(s.naturalLandPct), Object.fromEntries(Object.entries(s.composition).map(([k, v]) => [k, f(v)])));
    if (affiche(Math.round) !== cat) entier++;
    if (affiche((n) => lire(pctOso(n))) !== cat) dixieme++;
  }
  assert.equal(oso, 34743);
  assert.equal(entier, 318, "l'ancien affichage, mesuré le 09/11/2026");
  assert.equal(dixieme, 0);
});

test("national : pour chaque commune OSO, la carte et le texte déterministe, relus, donnent la catégorie affichée", () => {
  let vus = 0;
  const ecarts: string[] = [];
  for (const c of communes) {
    if (!c.nature || !landShares(c.nature.brut_pct, c.nature.composition)) continue;
    const snap = snapDe(c.insee);
    const cat = derivedOf(snap, "land.category")!.value as LandCategory;
    if (categorieLueSurLaCarte(snap) !== cat) ecarts.push(`carte ${c.nom} (${c.insee})`);
    if (categorieLueDansLeTexte(snap) !== cat) ecarts.push(`texte ${c.nom} (${c.insee})`);
    vus++;
  }
  assert.equal(vus, 34743);
  assert.deepEqual(ecarts.slice(0, 10), []);
});

// ── Ce que FUT-183 ne touche pas ───────────────────────────────────────────────────────────────

test("la carte formate chaque part OSO avec pctOso, aucune n'est interpolée brute", () => {
  const src = readFileSync(new URL("src/components/report/QuartierClimatData.tsx", racine), "utf8");
  for (const champ of ["naturelTerresPct", "eauPct", "radiusPct"]) {
    assert.doesNotMatch(src, new RegExp(`\\$\\{couvertNaturel\\.${champ}\\}`), champ);
  }
  assert.match(src, /value: `\$\{pctOso\(c\.pct\)\} %`/);
  assert.doesNotMatch(src, /Math\.round\(couvertNaturel/);
});

test("aucune invalidation : le contrat de synthèse reste @7, les valeurs du registre sont inchangées", () => {
  assert.match(SYNTHESIS_CONTRACT_VERSION, /^territoire-synthese@7:/);
  // Les faits gardent leur dixième d'avant FUT-183 : l'empreinte des snapshots ne bouge pas.
  const snap = snapDe("17299");
  assert.deepEqual(factOf(snap, "land.composition")!.value, {
    artificialise: 47.7, agricole: 7.6, foret: 5.5, prairies: 33.6, landes_pelouses: 5.1, mineral_dunes: 0.8,
  });
});
