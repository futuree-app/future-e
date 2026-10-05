// FUT-43 : Paris, Lyon, Marseille lus à la commune. Tests sur le VRAI index (arrondissements réels).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { lectureCommunalePLM, libellesAgglomeration, villePLM, type ArrondissementIndex } from "./plm-communal.ts";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./facts.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";
import { withHash } from "../facts/hash.ts";
import { arrondissementsDe, codePourSourceParArrondissement } from "../plm.ts";
import { codeGaspar } from "../georisques-flags.ts";
import { catnatInondationDepuisIndex } from "../decision/catnat-evidence.ts";

type Entree = ArrondissementIndex & { nom: string; inondation?: { catnat: number } | null; mer_centre_km?: number | null; altitude?: number | null };
const COMMUNES = (JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes) as Entree[];
const parInsee = new Map(COMMUNES.map((c) => [c.insee, c]));
const LABELS = libellesAgglomeration(COMMUNES);
const T0 = "2026-10-06T00:00:00.000Z";

/** Les entrées du snapshot telles que `loadTerritoireSnapshot` les construit pour une ville PLM. */
function inputsPLM(insee: string, nom: string): TerritoireInputs {
  const l = lectureCommunalePLM(insee, COMMUNES)!;
  const uuLabel = l.uu ? LABELS.get(l.uu) ?? null : null;
  return {
    ...chatelaillonInputs(), insee, communeName: nom, ademe: null, distinctiveTrait: null, catnat: null, littoral: null,
    entry: { population: l.population, densite: null, mer_centre_km: null, relief_proximite: null, altitude: null, nature: null, demographie: l.demographie },
    urbanRole: l.uu ? { role: uuLabel === nom ? "pole" : "agglo", uuLabel, uuPop: l.uuPop } : null,
    catnatInondationIndex: catnatInondationDepuisIndex({ insee, inondation: parInsee.get(arrondissementsDe(insee)[0]!)!.inondation ?? null }),
  };
}
const valeur = (s: ReturnType<typeof buildTerritoireSnapshot>, key: string) => s.facts.find((f) => f.key === key)?.value ?? null;
const somme = (insee: string) => arrondissementsDe(insee).reduce((t, a) => t + (parInsee.get(a)!.population ?? 0), 0);

for (const [n, insee, nom] of [["P1", "75056", "Paris"], ["P2", "69123", "Lyon"], ["P3", "13055", "Marseille"]] as const) {
  test(`${n}. ${nom} (${insee}) : un snapshot communal exploitable, agrégé sur TOUS ses arrondissements`, () => {
    const s = buildTerritoireSnapshot(inputsPLM(insee, nom), T0);
    assert.equal(valeur(s, "place.population"), somme(insee), "population = somme des arrondissements");
    const role = valeur(s, "place.urban_role") as { role: string; uuLabel: string };
    assert.deepEqual([role.role, role.uuLabel], ["pole", nom], "pôle de l'agglomération qui porte son nom");
    const trend = valeur(s, "demography.trend") as { annualPct: number; newcomersPct: number | null };
    assert.equal(typeof trend.annualPct, "number");
    assert.equal(trend.newcomersPct, null, "les arrivants ne s'additionnent pas entre arrondissements");
  });
}

test("P4. aucun arrondissement ne représente la ville : ni le premier, ni le plus peuplé", () => {
  for (const insee of ["75056", "69123", "13055"]) {
    const premier = parInsee.get(arrondissementsDe(insee)[0]!)!;
    const l = lectureCommunalePLM(insee, COMMUNES)!;
    assert.notEqual(l.population, premier.population);
    assert.notEqual(l.demographie?.taux_total, premier.demographie?.taux_total);
  }
  // Taux recalculé sur les sommes, jamais une moyenne de taux (Paris : −0,56 %/an).
  assert.equal(lectureCommunalePLM("75056", COMMUNES)!.demographie!.taux_total, -0.56);
  // L'agglomération porte le nom de la ville, plus celui d'un arrondissement ou d'une voisine.
  assert.equal(LABELS.get(parInsee.get("75101")!.uu!), "Paris");
  assert.equal(LABELS.get(parInsee.get("69381")!.uu!), "Lyon");
  assert.equal(LABELS.get(parInsee.get("13201")!.uu!), "Marseille");
  // Un seul arrondissement manquant rend la lecture inconnue : jamais un total partiel.
  assert.equal(lectureCommunalePLM("75056", COMMUNES.filter((c) => c.insee !== "75120")), null);
});

test("P5. ce qui varie d'un arrondissement à l'autre n'est pas présenté comme la donnée de la ville", () => {
  // La position (distance à la mer, altitude) se mesure en un point : à Marseille elle varie d'un arrondissement à l'autre.
  const mer = new Set(arrondissementsDe("13055").map((a) => parInsee.get(a)!.mer_centre_km));
  assert.ok(mer.size > 1, "la donnée varie bien");
  const s = buildTerritoireSnapshot(inputsPLM("13055", "Marseille"), T0);
  for (const k of ["place.position", "place.density", "land.composition", "land.natural_share", "place.distinctive_trait"]) {
    assert.equal(valeur(s, k), null, `${k} : absent plutôt qu'emprunté`);
  }
  // Lyon : la croissance positive ne donne pas de récit, il exigerait les arrivants (non agrégeables).
  assert.equal(lectureCommunalePLM("69123", COMMUNES)!.demographie!.recit, null);
});

test("P6. sans arrondissement connu, une source par arrondissement ne choisit aucun code", () => {
  for (const ville of ["75056", "69123", "13055"]) assert.equal(codePourSourceParArrondissement(ville, null), null);
  assert.equal(codePourSourceParArrondissement("69123", "69389"), "69389", "avec l'adresse, son arrondissement");
});

test("P7. GASPAR reste interrogé au code de la ville", () => {
  assert.deepEqual(["75111", "69389", "13207", "75056"].map(codeGaspar), ["75056", "69123", "13055", "75056"]);
});

test("P8. les comptes FUT-60 sont intacts dans le snapshot communal", () => {
  const n = (insee: string, nom: string) => (valeur(buildTerritoireSnapshot(inputsPLM(insee, nom), T0), "risk.catnat_flood_index") as { count: number }).count;
  assert.deepEqual([n("75056", "Paris"), n("69123", "Lyon"), n("13055", "Marseille")], [16, 19, 29]);
});

test("P9. Paris : plus de repli générique là où un fait communal fiable existe", () => {
  const texte = deterministicSynthesis(projectForSynthesis(buildTerritoireSnapshot(inputsPLM("75056", "Paris"), T0), "gwl20"), "gwl20");
  assert.doesNotMatch(texte, /ne permettent pas de décrire/);
  assert.match(texte, /Paris compte 2 133 111 habitants, principal pôle de son agglomération\. Sa population a reculé de 0,56 % par an/);
});

test("P10. une commune ordinaire n'est pas touchée", () => {
  assert.equal(villePLM("31555"), null);
  assert.equal(lectureCommunalePLM("31555", COMMUNES), null);
  assert.equal(LABELS.get(parInsee.get("31555")!.uu!), "Toulouse");
  assert.equal(LABELS.get(parInsee.get("33063")!.uu!), "Bordeaux");
});

test("P11. deux lecteurs de Paris partagent le même snapshot : il ne dépend d'aucune adresse", () => {
  const a = withHash(buildTerritoireSnapshot(inputsPLM("75056", "Paris"), T0));
  const b = withHash(buildTerritoireSnapshot(inputsPLM("75056", "Paris"), "2026-10-07T00:00:00.000Z"));
  assert.equal(a.hash, b.hash);
  // Structurel : le snapshot ne reçoit que la commune et son nom, jamais un arrondissement ou une adresse.
  const src = readFileSync("src/lib/server/territoire-snapshot.ts", "utf8");
  assert.match(src, /export async function loadTerritoireSnapshot\(insee: string, communeName: string\)/);
});
