// FUT-34 : le trait distinctif national ne transforme plus « peu de nature dans 15 km » (des cultures, le plus
// souvent) en « commune urbanisée ». Tests sur l'index RÉEL.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { getCommuneDistinctive, TRAITS_NATIONAUX, type CommunePourTrait } from "./trait-distinctif.ts";

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as (CommunePourTrait & { insee: string; nom: string })[];
const par = new Map(communes.map((c) => [c.insee, c]));
const trait = (insee: string) => { const c = par.get(insee); assert.ok(c, insee); return getCommuneDistinctive(c!); };

test("Châtelaillon-Plage et des communes agricoles ne sont plus « parmi les plus urbanisées de France »", () => {
  for (const [insee, nom] of [["17094", "Châtelaillon-Plage"], ["02100", "Bony"], ["28199", "Janville-en-Beauce"], ["28085", "Chartres"]]) {
    assert.doesNotMatch(trait(insee) ?? "", /urbanis/, nom);
  }
});

test("aucune commune de l'index ne reçoit un libellé d'urbanisation, et aucun libellé n'en porte", () => {
  for (const c of communes) assert.doesNotMatch(getCommuneDistinctive(c) ?? "", /urbanis|bâti|béton|artificialis/, c.nom);
  for (const t of TRAITS_NATIONAUX) assert.doesNotMatch(t.label, /urbanis|bâti|béton|artificialis/);
  // Le bas du couvert naturel n'a plus de libellé : seul son haut (« entourées d'espaces naturels ») en a un.
  const natureBas = TRAITS_NATIONAUX.filter((t) => t.dir === "low" && t.pct({ pct: {}, nature: { score: 5 } }) === 5);
  assert.equal(natureBas.length, 0);
});

test("le repli de Châtelaillon est un trait fidèle à sa mesure (croissance démographique, percentile national)", () => {
  const c = par.get("17094")!;
  assert.equal(trait("17094"), "compte parmi les communes dont la population augmente le plus");
  assert.ok((c.demographie?.croissance ?? 0) >= 88, "le trait n'est retenu qu'au-delà du 88e percentile national");
});

test("une commune sans trait marqué reçoit null, jamais un trait de repli inventé", () => {
  assert.equal(getCommuneDistinctive({ pct: {}, nature: { score: 50 }, demographie: { croissance: 50 }, relief_proximite: 10 }), null);
  // Bony : 89 % de cultures autour, seul le bas du couvert naturel était extrême ; il n'a plus de trait.
  assert.equal(trait("02100"), null);
});

test("les traits fidèles restent : commune très naturelle, montagne", () => {
  assert.equal(trait("2B096"), "compte parmi les communes les plus entourées d'espaces naturels"); // Corte
  assert.equal(trait("05023"), "compte parmi les communes les plus proches du relief"); // Briançon
});

test("les traits démographiques disent une évolution relative de la population, rien de plus", () => {
  const demo = TRAITS_NATIONAUX.filter((t) => t.pct({ pct: {}, demographie: { croissance: 50 } }) === 50);
  assert.deepEqual(demo.map((t) => t.label), [
    "compte parmi les communes dont la population augmente le plus",
    "compte parmi les communes dont la population diminue le plus",
  ]);
  for (const t of TRAITS_NATIONAUX) assert.doesNotMatch(t.label, /dynamique|perdent le plus d'habitants/);
  // Le bas du classement : toutes ces communes perdent réellement des habitants (taux négatif).
  for (const c of communes) {
    const d = (c as { demographie?: { croissance?: number; taux_total?: number } }).demographie;
    if (d?.croissance != null && d.croissance <= 12) assert.ok((d.taux_total ?? 0) < 0, c.nom);
  }
  assert.equal(trait("51454"), "compte parmi les communes dont la population diminue le plus"); // Reims
});
