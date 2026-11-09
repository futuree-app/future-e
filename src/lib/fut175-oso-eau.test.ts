// FUT-175 : l'eau n'est ni une terre ni un espace naturel. Les parts OSO se lisent sur les TERRES de la
// commune, l'eau est un fait à part. Tests sur l'index RÉEL (34 788 entrées, 34 743 avec OSO).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { buildTerritoireSnapshot, landCategory, landShares, LAND_KEYS, LAND_LABEL, type LandCategory, type TerritoireInputs } from "./territoire/facts.ts";
import { derivedOf, factOf } from "./facts/contract.ts";
import { buildTerritoryCards, buildTerritoryIdentity } from "./territory-identity.ts";
import { projectForSynthesis } from "./territoire/synthesis-contract.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";

type Nature = { brut_pct: number; radius_pct: number | null; composition: Record<string, number> };
type Entree = { insee: string; nom: string; nature?: Nature | null };

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Entree[];
const par = new Map(communes.map((c) => [c.insee, c]));
const avecOso = communes.filter((c) => c.nature?.composition && c.nature.brut_pct != null);

const T0 = "2026-11-09T00:00:00.000Z";
function snapDe(insee: string) {
  const c = par.get(insee);
  assert.ok(c?.nature, insee);
  const i: TerritoireInputs = chatelaillonInputs();
  i.insee = insee;
  i.communeName = c!.nom;
  i.entry = { ...i.entry!, nature: { brut_pct: c!.nature!.brut_pct, radius_pct: c!.nature!.radius_pct, composition: c!.nature!.composition } };
  return buildTerritoireSnapshot(i, T0);
}
/** La lecture d'avant FUT-175 : la même grille, sur des parts dont le dénominateur comptait l'eau. */
const avant = (n: Nature): LandCategory => landCategory(n.brut_pct, n.composition);
const apres = (n: Nature): LandCategory | null => {
  const s = landShares(n.brut_pct, n.composition);
  return s ? landCategory(s.naturalLandPct, s.composition) : null;
};

// ── La source ────────────────────────────────────────────────────────────────────────────────

test("l'index porte les 7 postes OSO, sommés à 100 % du contour, l'eau comprise", () => {
  assert.equal(avecOso.length, 34743);
  for (const c of avecOso) {
    const comp = c.nature!.composition;
    assert.deepEqual(Object.keys(comp).sort(), [...LAND_KEYS, "eau"].sort(), c.nom);
    const somme = Object.values(comp).reduce((a, b) => a + b, 0);
    assert.ok(somme > 99.7 && somme < 100.3, `${c.nom} : ${somme}`);
  }
});

// ── Le panel du ticket ─────────────────────────────────────────────────────────────────────────

const PANEL: [string, string, LandCategory, LandCategory][] = [
  // insee, nom, avant, après
  ["34301", "Sète", "high_natural", "mostly_built"],
  ["34198", "Pérols", "high_natural", "mostly_built"],
  ["13054", "Marignane", "high_natural", "mostly_built"],
  ["44010", "Batz-sur-Mer", "high_natural", "mostly_built"],
  ["34192", "Palavas-les-Flots", "high_natural", "high_natural"], // 48,9 % de terres naturelles, 49,2 % urbanisées
  ["13096", "Saintes-Maries-de-la-Mer", "high_natural", "high_natural"],
  ["17094", "Châtelaillon-Plage", "mixed", "mixed"],
  ["02100", "Bony", "agricultural", "agricultural"],
  ["28199", "Janville-en-Beauce", "agricultural", "agricultural"],
  ["28085", "Chartres", "mostly_built", "mostly_built"],
  ["92044", "Levallois-Perret", "mostly_built", "mostly_built"],
  ["2B096", "Corte", "high_natural", "high_natural"],
  ["74010", "Annecy", "high_natural", "high_natural"],
];

test("panel littoral, lacustre, agricole, urbain : catégorie avant et après", () => {
  for (const [insee, nom, a, b] of PANEL) {
    const c = par.get(insee)!;
    assert.equal(c.nom, nom);
    assert.equal(avant(c.nature!), a, `${nom} avant`);
    assert.equal(apres(c.nature!), b, `${nom} après`);
    assert.equal(derivedOf(snapDe(insee), "land.category")?.value, b, `${nom} snapshot`);
  }
});

test("Sète : la moitié de ses terres est urbanisée, l'eau (étang de Thau) est dite à part", () => {
  const s = landShares(par.get("34301")!.nature!.brut_pct, par.get("34301")!.nature!.composition)!;
  assert.equal(s.waterPct, 50.6);
  assert.equal(s.composition.artificialise, 50.4);
  assert.equal(s.naturalLandPct, 33.8);
  assert.equal(s.composition.eau, undefined);

  const snap = snapDe("34301");
  assert.equal(factOf(snap, "land.water_share")?.value, 50.6);
  assert.equal(factOf(snap, "land.natural_share")?.value, 33.8);
  assert.equal(buildTerritoryIdentity(snap).solDominant, "Majoritairement urbanisé");

  const carte = buildTerritoryCards(snap).couvertNaturel!;
  assert.equal(carte.headlineLabel, "Majoritairement urbanisé");
  assert.equal(carte.naturelTerresPct, 34);
  assert.equal(carte.eauPct, 51);
  assert.ok(!carte.composition.some((x) => /eau/i.test(x.label)), "l'eau ne figure plus parmi les postes des terres");
  const somme = carte.composition.reduce((a, x) => a + x.pct, 0);
  assert.ok(somme >= 98 && somme <= 102, `postes des terres : ${somme}`);

  const p = projectForSynthesis(snap, "gwl20") as Record<string, any>;
  assert.equal(p.occupation_des_sols.categorie, "Majoritairement urbanisé");
  assert.equal(p.occupation_des_sols.part_eau_de_la_commune_pct, 50.6);
  assert.equal(p.occupation_des_sols.composition_des_terres_pct.espaces_urbanises, 50.4);
  assert.doesNotMatch(p.occupation_des_sols.definition, /dunes, eau/);
  assert.match(p.occupation_des_sols.definition, /ni les cultures ni l'eau/);
});

// ── National ───────────────────────────────────────────────────────────────────────────────────

// L'audit FUT-53 annonçait 342 changements : reproduit à l'identique sur des parts NON arrondies. La règle
// livrée classe sur les parts AFFICHÉES (au dixième, comme avant) pour que le chiffre et la catégorie ne se
// contredisent jamais (« 45,0 % » reste « Forte présence naturelle ») : 10 communes à 44,95-44,99 % ou
// 19,96 % restent alors dans leur catégorie, soit 332 changements, dont les mêmes 17 vers l'urbanisé.
test("national : 342 changements sur parts brutes (audit FUT-53), 332 sur les parts affichées", () => {
  let bruts = 0;
  for (const c of avecOso) {
    const n = c.nature!;
    const terres = 100 - n.composition.eau;
    const brute = landCategory(((n.brut_pct - n.composition.eau) * 100) / terres,
      Object.fromEntries(LAND_KEYS.map((k) => [k, (n.composition[k] * 100) / terres])));
    if (brute !== avant(n)) bruts++;
  }
  assert.equal(bruts, 342);

  const trans = new Map<string, number>();
  let n = 0;
  for (const c of avecOso) {
    const a = avant(c.nature!);
    const b = apres(c.nature!);
    assert.ok(b != null, `${c.nom} : aucune commune n'a moins de 10 % de terres`);
    if (a === b) continue;
    n++;
    assert.ok(c.nature!.composition.eau > 0, `${c.nom} change sans eau`);
    trans.set(`${a}>${b}`, (trans.get(`${a}>${b}`) ?? 0) + 1);
  }
  assert.equal(n, 332);
  assert.deepEqual(Object.fromEntries([...trans].sort()), {
    "high_natural>agricultural": 62,
    "high_natural>mixed": 154,
    "high_natural>mostly_built": 17,
    "low_natural>agricultural": 1,
    "low_natural>mostly_built": 1,
    "mixed>agricultural": 75,
    "mixed>low_natural": 10,
    "mixed>mostly_built": 12,
  });
});

test("national : sans eau, parts et catégorie restent identiques au dixième près", () => {
  for (const c of avecOso) {
    if (c.nature!.composition.eau !== 0) continue;
    const s = landShares(c.nature!.brut_pct, c.nature!.composition)!;
    assert.equal(s.naturalLandPct, c.nature!.brut_pct, c.nom);
    for (const k of LAND_KEYS) assert.equal(s.composition[k], c.nature!.composition[k], `${c.nom} ${k}`);
    assert.equal(avant(c.nature!), apres(c.nature!), c.nom);
  }
});

test("national : eau, nature terrestre, cultures et urbanisé ne se confondent jamais", () => {
  for (const c of avecOso) {
    const s = landShares(c.nature!.brut_pct, c.nature!.composition)!;
    assert.equal("eau" in s.composition, false);
    const terres = LAND_KEYS.reduce((a, k) => a + s.composition[k], 0);
    // L'index arrondit chaque poste au dixième du contour ; rapporté aux terres, l'écart s'amplifie d'autant.
    const tolerance = (0.35 * 100) / (100 - s.waterPct) + 0.1;
    assert.ok(Math.abs(terres - 100) <= tolerance, `${c.nom} : terres ${terres}`);
    // Le naturel est exactement ce qui n'est ni urbanisé ni cultivé, sur les terres.
    const naturel = s.composition.foret + s.composition.prairies + s.composition.landes_pelouses + s.composition.mineral_dunes;
    assert.ok(Math.abs(naturel - s.naturalLandPct) <= tolerance, `${c.nom} : naturel ${naturel} vs ${s.naturalLandPct}`);
    assert.ok(s.waterPct >= 0 && s.waterPct < 90, c.nom);
  }
});

// ── Données absentes ───────────────────────────────────────────────────────────────────────────

test("absent ≠ zéro : sans OSO ou avec un poste manquant, ni part ni catégorie inventées", () => {
  assert.equal(landShares(40, null), null);
  const sete = par.get("34301")!.nature!.composition;
  assert.equal(landShares(null, sete), null, "brut_pct absent");
  const { eau: _eau, ...sansEau } = sete;
  assert.equal(landShares(67.3, sansEau), null, "eau absente : on ne la suppose pas nulle");
  const { foret: _f, ...sansForet } = sete;
  assert.equal(landShares(67.3, sansForet), null);
  assert.equal(landShares(67.3, { ...sete, agricole: Number.NaN }), null);
  assert.equal(landShares(95, { ...sete, eau: 95 }), null, "moins de 10 % de terres : aucune part lisible");

  for (const nature of [null, { brut_pct: 40, radius_pct: 30, composition: sansEau }]) {
    const i = chatelaillonInputs();
    i.entry = { ...i.entry!, nature };
    const s = buildTerritoireSnapshot(i, T0);
    assert.equal(derivedOf(s, "land.category"), null);
    for (const key of ["land.composition", "land.natural_share", "land.water_share"]) {
      assert.equal(factOf(s, key)?.value, null, key);
      assert.notEqual(factOf(s, key)?.status, "ok", key);
    }
    assert.equal(buildTerritoryCards(s).couvertNaturel, null);
  }
});

// ── Non-régression des autres faits ──────────────────────────────────────────────────────────

test("seuls les faits land.* dépendent de la composition OSO", () => {
  const a = chatelaillonInputs();
  const b = chatelaillonInputs();
  b.entry = { ...b.entry!, nature: { ...par.get("34301")!.nature! } };
  const sa = buildTerritoireSnapshot(a, T0);
  const sb = buildTerritoireSnapshot(b, T0);
  for (const f of sa.facts) {
    if (f.key.startsWith("land.")) continue;
    assert.deepEqual(factOf(sb, f.key), f, f.key);
  }
  for (const d of sa.derived) {
    if (d.key.startsWith("land.")) continue;
    assert.deepEqual(derivedOf(sb, d.key), d, d.key);
  }
});

test("libellés : la définition affichée ne compte plus l'eau parmi les espaces naturels", () => {
  const s = snapDe("34192"); // Palavas, 67,7 % d'eau
  assert.match(factOf(s, "land.natural_share")!.limits!, /Ni les cultures ni l'eau/);
  assert.match(factOf(s, "land.composition")!.limits!, /terres/);
  assert.match(factOf(s, "land.composition")!.limits!, /OCS GE/);
  assert.match(factOf(s, "land.natural_share_15km")!.limits!, /eau confondus/);
  assert.equal(derivedOf(s, "land.category")?.rule, "land-category@2");
  assert.equal(LAND_LABEL[derivedOf(s, "land.category")!.value as LandCategory], derivedOf(s, "land.category")!.label);
  const src = readFileSync(new URL("src/components/report/QuartierClimatData.tsx", racine), "utf8");
  assert.doesNotMatch(src, /roche et dunes, eau/);
});
