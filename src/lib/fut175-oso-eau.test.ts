// FUT-175 : l'eau n'est ni une terre ni un espace naturel. Les parts OSO se lisent sur les TERRES de la
// commune, l'eau est un fait à part. Tests sur l'index RÉEL.
//
// FUT-182 (10/11/2026) : l'index porte désormais les parts exactes des terres, calculées sur des comptes de pixels
// (serres comprises, poste distinct), non arrondies, et l'eau en % de la surface cartographiée. Les principes de FUT-175
// restent testés ici sur ce format ; les chiffres « avant FUT-175 » (342 et 332 changements) appartiennent à l'ancien
// index et à l'audit FUT-53, ils ne se recalculent plus.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { buildTerritoireSnapshot, landCategory, landShares, readLandShares, LAND_KEYS, LAND_LABEL, OSO_COUVERTURE, OSO_SUM_TOLERANCE, OSO_BRUT_TOLERANCE, type LandCategory, type TerritoireInputs } from "./territoire/facts.ts";
import { derivedOf, factOf } from "./facts/contract.ts";
import { buildTerritoryCards, buildTerritoryIdentity } from "./territory-identity.ts";
import { projectForSynthesis } from "./territoire/synthesis-contract.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";
import { natureTest } from "./territoire/__fixtures__/nature-oso.ts";

type Nature = NonNullable<NonNullable<TerritoireInputs["entry"]>["nature"]>;
type Entree = { insee: string; nom: string; nature?: (Nature & { score: number | null }) | null };

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Entree[];
const par = new Map(communes.map((c) => [c.insee, c]));
const avecOso = communes.filter((c) => c.nature?.terres);
const lue = (n: Entree["nature"]): Nature => ({ terres: n!.terres, eau_pct: n!.eau_pct, couverture_pct: n!.couverture_pct, secteur: n!.secteur });

const T0 = "2026-11-09T00:00:00.000Z";
function snapDe(insee: string) {
  const c = par.get(insee);
  assert.ok(c?.nature, insee);
  const i: TerritoireInputs = chatelaillonInputs();
  i.insee = insee;
  i.communeName = c!.nom;
  i.entry = { ...i.entry!, nature: lue(c!.nature) };
  return buildTerritoireSnapshot(i, T0);
}
const categorie = (n: Nature): LandCategory | null => {
  const s = landShares(n);
  return s ? landCategory(s.naturalLandPct, s.composition) : null;
};

// ── La source ────────────────────────────────────────────────────────────────────────────────

test("l'index porte les parts des terres (sept postes, serres comprises, somme 100) et l'eau à part", () => {
  assert.equal(avecOso.length, 34788); // 34 743 communes et 45 arrondissements (FUT-182)
  for (const c of avecOso) {
    const t = c.nature!.terres!;
    const somme = t.urbanise + t.cultures + t.serres + t.foret + t.prairies + t.landes_pelouses + t.mineral_dunes;
    assert.ok(Math.abs(somme - 100) <= OSO_SUM_TOLERANCE, `${c.nom} : ${somme}`);
    assert.ok(c.nature!.eau_pct! >= 0 && c.nature!.eau_pct! < 90, c.nom);
  }
});

// ── Le panel du ticket ─────────────────────────────────────────────────────────────────────────

const PANEL: [string, string, LandCategory][] = [
  ["34301", "Sète", "mostly_built"],
  ["34198", "Pérols", "mostly_built"],
  ["13054", "Marignane", "mostly_built"],
  ["44010", "Batz-sur-Mer", "mostly_built"],
  ["34192", "Palavas-les-Flots", "high_natural"], // 48,6 % de terres naturelles, 48,6 % urbanisées
  ["13096", "Saintes-Maries-de-la-Mer", "high_natural"],
  ["17094", "Châtelaillon-Plage", "mixed"],
  ["02100", "Bony", "agricultural"],
  ["28199", "Janville-en-Beauce", "agricultural"],
  ["28085", "Chartres", "mostly_built"],
  ["92044", "Levallois-Perret", "mostly_built"],
  ["2B096", "Corte", "high_natural"],
  ["74010", "Annecy", "high_natural"],
];

test("panel littoral, lacustre, agricole, urbain : la catégorie se lit sur les terres", () => {
  for (const [insee, nom, b] of PANEL) {
    const c = par.get(insee)!;
    assert.equal(c.nom, nom);
    assert.equal(categorie(lue(c.nature)), b, nom);
    assert.equal(derivedOf(snapDe(insee), "land.category")?.value, b, `${nom} snapshot`);
  }
});

test("Sète : la moitié de ses terres est urbanisée, l'eau (étang de Thau) est dite à part", () => {
  const s = landShares(lue(par.get("34301")!.nature))!;
  assert.equal(s.waterPct, 50.459);
  assert.equal(s.composition.artificialise, 50.073);
  assert.equal(s.naturalLandPct, 33.702);
  assert.equal(s.composition.eau, undefined);

  const snap = snapDe("34301");
  assert.equal(factOf(snap, "land.water_share")?.value, 50.459);
  assert.equal(factOf(snap, "land.natural_share")?.value, 33.702);
  assert.equal(buildTerritoryIdentity(snap).solDominant, "Majoritairement urbanisé");

  const carte = buildTerritoryCards(snap).couvertNaturel!;
  assert.equal(carte.headlineLabel, "Majoritairement urbanisé");
  // FUT-183 / FUT-182 : la carte montre le dixième, tronqué (50,073 → 50 reste au-dessus du seuil de 50).
  assert.equal(carte.naturelTerresPct, 33.7);
  assert.equal(carte.eauPct, 50.4);
  assert.ok(!carte.composition.some((x) => /eau/i.test(x.label)), "l'eau ne figure pas parmi les postes des terres");
  const somme = carte.composition.reduce((a, x) => a + x.pct, 0);
  assert.ok(somme >= 98 && somme <= 100, `postes des terres : ${somme}`);

  const p = projectForSynthesis(snap, "gwl20") as Record<string, any>;
  assert.equal(p.occupation_des_sols.categorie, "Majoritairement urbanisé");
  assert.equal(p.occupation_des_sols.part_eau_de_la_commune_pct, 50.4);
  assert.equal(p.occupation_des_sols.composition_des_terres_pct.espaces_urbanises, 50);
  assert.doesNotMatch(p.occupation_des_sols.definition, /dunes, eau/);
  assert.match(p.occupation_des_sols.definition, /ni les cultures ni l'eau/);
});

// ── National ───────────────────────────────────────────────────────────────────────────────────

test("national : sans eau, la part naturelle est la somme de ses quatre postes, eau et terres ne se confondent jamais", () => {
  for (const c of avecOso) {
    const s = landShares(lue(c.nature))!;
    assert.ok(s, c.nom);
    assert.equal("eau" in s.composition, false);
    const naturel = s.composition.foret + s.composition.prairies + s.composition.landes_pelouses + s.composition.mineral_dunes;
    assert.ok(Math.abs(naturel - s.naturalLandPct) <= OSO_BRUT_TOLERANCE, `${c.nom} : naturel ${naturel} vs ${s.naturalLandPct}`);
  }
});

// ── Données absentes ───────────────────────────────────────────────────────────────────────────

test("absent ≠ zéro : sans OSO ou avec un poste manquant, ni part ni catégorie inventées", () => {
  const sete = lue(par.get("34301")!.nature);
  assert.equal(landShares(null), null);
  assert.equal(landShares({ ...sete, terres: null }), null, "terres absentes");
  assert.equal(landShares({ ...sete, eau_pct: null }), null, "eau absente : on ne la suppose pas nulle");
  const { foret: _f, ...sansForet } = sete.terres!;
  assert.equal(landShares({ ...sete, terres: sansForet as never }), null);
  assert.equal(landShares({ ...sete, terres: { ...sete.terres!, cultures: Number.NaN } }), null);
  assert.equal(landShares({ ...sete, eau_pct: 95 }), null, "moins de 10 % de terres : aucune part lisible");

  for (const nature of [null, { ...sete, eau_pct: null }]) {
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

// ── Cohérence numérique ───────────────────────────────────────────────────────────────────────

test("cohérence : les 34 788 compositions OSO de l'index passent les contrôles, aucune n'est écartée", () => {
  const refus = avecOso.map((c) => [c.nom, readLandShares(lue(c.nature))] as const).filter(([, r]) => r.status !== "ok");
  assert.deepEqual(refus, []);
  // Les tolérances sont des bornes d'arrondi au millième (7 et 4 valeurs), pas des réglages sur les données.
  assert.ok(Math.abs(OSO_SUM_TOLERANCE - 0.0035) < 1e-4 && Math.abs(OSO_BRUT_TOLERANCE - 0.002) < 1e-4);
});

test("cohérence : une composition contradictoire est refusée avec sa raison, jamais complétée", () => {
  const sete = lue(par.get("34301")!.nature);
  const t = sete.terres!;
  assert.equal(readLandShares(sete).status, "ok");
  const cas: [string, Nature, RegExp][] = [
    ["somme excessive", { ...sete, terres: { ...t, cultures: t.cultures + 5 } }, /somment à 105/],
    ["somme insuffisante", { ...sete, terres: { ...t, urbanise: t.urbanise - 3 } }, /somment à 97/],
    ["naturel incompatible", { ...sete, terres: { ...t, naturel: t.naturel - 5 } }, /part naturelle .* contredit/],
    ["valeur négative", { ...sete, terres: { ...t, foret: -1, prairies: t.prairies + 1 + t.foret } }, /foret hors de \[0, 100\]/],
    ["eau au-delà de 100", { ...sete, eau_pct: 101 }, /eau_pct hors de \[0, 100\]/],
    ["terres quasi nulles", { ...natureTest({ urb: 50, agri: 50, foret: 0, eau: 96 }) }, /terres trop réduites/],
  ];
  for (const [nom, n, raison] of cas) {
    const r = readLandShares(n);
    assert.equal(r.status, "inconsistent", nom);
    assert.match(r.status === "inconsistent" ? r.reason : "", raison, nom);
    assert.equal(landShares(n), null, nom);
  }
  // Juste sous les bornes d'arrondi : accepté ; juste au-delà : refusé.
  assert.equal(readLandShares({ ...sete, terres: { ...t, cultures: t.cultures + 0.003 } }).status, "ok");
  assert.equal(readLandShares({ ...sete, terres: { ...t, cultures: t.cultures + 0.01 } }).status, "inconsistent");
});

test("cohérence : le snapshot d'une commune incohérente le dit, sans part ni catégorie", () => {
  const i = chatelaillonInputs();
  const sete = lue(par.get("34301")!.nature);
  i.entry = { ...i.entry!, nature: { ...sete, terres: { ...sete.terres!, cultures: sete.terres!.cultures + 5 } } };
  const s = buildTerritoireSnapshot(i, T0);
  assert.equal(derivedOf(s, "land.category"), null);
  for (const key of ["land.composition", "land.natural_share", "land.water_share"]) {
    const f = factOf(s, key)!;
    assert.equal(f.value, null, key);
    assert.equal(f.status, "missing", key);
    assert.match(f.limits!, /incohérentes pour cette commune \(les sept postes des terres somment à 105/, key);
  }
  assert.equal(buildTerritoryCards(s).couvertNaturel, null);
});

// ── Couverture des pourcentages ────────────────────────────────────────────────────────────────

test("couverture : les parts portent sur les pixels que la carte classe dans le contour, serres comprises", () => {
  const s = snapDe("34301");
  for (const key of ["land.composition", "land.natural_share", "land.water_share"]) {
    assert.ok(factOf(s, key)!.limits!.includes(OSO_COUVERTURE), key);
  }
  assert.equal(factOf(s, "land.water_share")!.unit, "% de la surface cartographiée");
  assert.match(OSO_COUVERTURE, /contour de la commune/);
  assert.match(OSO_COUVERTURE, /serres comprises/);
  const carte = readFileSync(new URL("src/components/report/QuartierClimatData.tsx", racine), "utf8");
  assert.match(carte, /surface cartographiée de la commune/);
  // FUT-182 : la couverture est connue (1,9 km² de pixels non classés pour toute la France) : plus de « part non mesurée ».
  assert.doesNotMatch(carte, /pixels non classés, de part non mesurée/);
  for (const f of ["src/components/report/QuartierClimatData.tsx", "src/lib/territoire/synthesis-contract.ts", "src/lib/territoire/synthesis-deterministe.ts", "src/lib/territoire/facts.ts"]) {
    assert.doesNotMatch(readFileSync(new URL(f, racine), "utf8"), /surface communale|toute sa surface|% de la commune\b/, f);
  }
});

// ── Non-régression des autres faits ──────────────────────────────────────────────────────────

test("seuls les faits land.* dépendent de la composition OSO", () => {
  const a = chatelaillonInputs();
  const b = chatelaillonInputs();
  b.entry = { ...b.entry!, nature: lue(par.get("34301")!.nature) };
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

test("libellés : la définition affichée ne compte pas l'eau parmi les espaces naturels", () => {
  const s = snapDe("34192"); // Palavas, 67,5 % d'eau
  assert.match(factOf(s, "land.natural_share")!.limits!, /Ni les cultures ni l'eau/);
  assert.match(factOf(s, "land.composition")!.limits!, /terres/);
  assert.match(factOf(s, "land.composition")!.limits!, /OCS GE/);
  assert.match(factOf(s, "land.natural_share_sector")!.limits!, /occupation des sols autour des zones bâties/);
  assert.equal(derivedOf(s, "land.category")?.rule, "land-category@2");
  assert.equal(LAND_LABEL[derivedOf(s, "land.category")!.value as LandCategory], derivedOf(s, "land.category")!.label);
  const src = readFileSync(new URL("src/components/report/QuartierClimatData.tsx", racine), "utf8");
  assert.doesNotMatch(src, /roche et dunes, eau/);
  assert.ok(LAND_KEYS.includes("serres"));
});
