// FUT-179 : la densité de Paris, Lyon, Marseille et de leurs arrondissements, chacune sur SON périmètre.
// Tests sur le vrai index (arrondissements réels) et la table Insee générée (plm-densite.generated.ts).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { DENSITE_PLM, DENSITE_PLM_META } from "./plm-densite.generated.ts";
import { densiteInseePLM, densiteInseeRetenue } from "./plm-densite.ts";
import { lectureCommunalePLM, libellesAgglomeration, villeDeArrondissement, type ArrondissementIndex } from "./plm-communal.ts";
import { roleUrbain } from "./statut-urbain.ts";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./facts.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";
import { withHash } from "../facts/hash.ts";
import { arrondissementsDe } from "../plm.ts";
import { ARRONDISSEMENTS_PLM } from "../plm-population.ts";
import { buildTerritoryIdentity } from "../territory-identity.ts";

type Entree = ArrondissementIndex & { nom: string; densite?: number | null; nature?: unknown; altitude?: number | null; mer_centre_km?: number | null; relief_proximite?: number | null };
const COMMUNES = (JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes) as Entree[];
const parInsee = new Map(COMMUNES.map((c) => [c.insee, c]));
const LABELS = libellesAgglomeration(COMMUNES);
const T0 = "2026-11-09T00:00:00.000Z";
const VILLES = [["75056", "Paris"], ["69123", "Lyon"], ["13055", "Marseille"]] as const;
const TOUS_ARRONDISSEMENTS = Object.values(ARRONDISSEMENTS_PLM).flat();

/** Les entrées du snapshot telles que `loadTerritoireSnapshot` les construit pour la COMMUNE (branche FUT-43). */
function inputsVille(insee: string, nom: string): TerritoireInputs {
  const l = lectureCommunalePLM(insee, COMMUNES)!;
  return {
    ...chatelaillonInputs(), insee, communeName: nom, ademe: null, distinctiveTrait: null, catnat: null, littoral: null,
    entry: { population: l.population, densite: null, mer_centre_km: null, relief_proximite: null, altitude: null, nature: null, demographie: l.demographie },
    urbanRole: { role: roleUrbain(l.uu, l.uuStatut), uuLabel: l.uu ? LABELS.get(l.uu) ?? null : null, uuPop: l.uuPop },
    densiteInsee: densiteInseePLM(insee),
  };
}

/** Les entrées pour un ARRONDISSEMENT, lu à son propre code (BAN rend 75111 pour une adresse du 11e). */
function inputsArrondissement(insee: string): TerritoireInputs {
  const a = parInsee.get(insee)!;
  return {
    ...chatelaillonInputs(), insee, communeName: a.nom, ademe: null, distinctiveTrait: null, catnat: null, littoral: null,
    entry: {
      population: a.population ?? null, densite: a.densite ?? null, mer_centre_km: a.mer_centre_km ?? null,
      relief_proximite: a.relief_proximite ?? null, altitude: a.altitude ?? null, nature: null,
      demographie: a.demographie ? { taux_total: a.demographie.taux_total ?? null, part_nouveaux: null, recit: null } : null,
    },
    urbanRole: { role: roleUrbain(a.uu ?? null, a.uu_statut ?? null), uuLabel: a.uu ? LABELS.get(a.uu) ?? null : null, uuPop: a.uu_pop ?? null, arrondissementDe: villeDeArrondissement(insee)!.nom },
    densiteInsee: densiteInseePLM(insee),
  };
}

const fait = (s: ReturnType<typeof buildTerritoireSnapshot>, key: string) => s.facts.find((f) => f.key === key)!;
const derive = (s: ReturnType<typeof buildTerritoireSnapshot>, key: string) => s.derived.find((d) => d.key === key) ?? null;
const synthese = (s: ReturnType<typeof buildTerritoireSnapshot>) => deterministicSynthesis(projectForSynthesis(withHash(s), "gwl20"), "gwl20");
/** Le nombre tel que la synthèse l'écrit, quel que soit le séparateur de milliers (espace fine, insécable…). */
const frInt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "[\\s\\u00a0\\u202f]");

test("D1. couverture : les 3 communes et les 45 arrondissements, et rien d'autre ; aucun zéro", () => {
  assert.deepEqual(Object.keys(DENSITE_PLM).sort(), ["13055", "69123", "75056", ...TOUS_ARRONDISSEMENTS].sort());
  assert.equal(TOUS_ARRONDISSEMENTS.length, 45);
  for (const [code, d] of Object.entries(DENSITE_PLM)) {
    assert.ok(d.population2022 > 0 && d.superficieKm2 > 0 && d.habitantsParKm2 > 0, code);
    assert.equal(d.perimetre, TOUS_ARRONDISSEMENTS.includes(code) ? "arrondissement" : "commune", code);
    // La valeur est bien le rapport de SES deux grandeurs.
    assert.ok(Math.abs(d.habitantsParKm2 - d.population2022 / d.superficieKm2) < 0.01, code);
  }
  // Hors des trois villes : rien (Toulouse lit ADEME, comme toutes les autres communes).
  for (const autre of ["31555", "33063", "06088", "75000", ""]) assert.equal(densiteInseePLM(autre), null, autre);
});

test("D2. grain : la commune est la RÉUNION de ses arrondissements, et ne vaut pour aucun d'eux", () => {
  for (const [insee] of VILLES) {
    const ville = DENSITE_PLM[insee]!;
    const arr = arrondissementsDe(insee).map((a) => DENSITE_PLM[a]!);
    assert.equal(ville.population2022, arr.reduce((t, a) => t + a.population2022, 0), "population = somme des arrondissements");
    assert.ok(Math.abs(ville.superficieKm2 - arr.reduce((t, a) => t + a.superficieKm2, 0)) < 0.05, "superficie = somme des arrondissements");
    // Une densité de ville est un rapport de sommes, jamais une moyenne de densités.
    const moyenne = arr.reduce((t, a) => t + a.habitantsParKm2, 0) / arr.length;
    assert.ok(Math.abs(ville.habitantsParKm2 - moyenne) > 100, `${insee} : pas une moyenne de densités`);
    for (const a of arr) assert.notEqual(a.habitantsParKm2, ville.habitantsParKm2);
  }
  assert.equal(DENSITE_PLM["75056"]!.habitantsParKm2, 20054.13);
  assert.equal(DENSITE_PLM["75111"]!.habitantsParKm2, 38142.51);
});

test("D3. provenance : la méthode a été vérifiée sur l'index avant d'être appliquée", () => {
  assert.ok(DENSITE_PLM_META.validation.communes > 34000);
  assert.ok(DENSITE_PLM_META.validation.ecartMedianPct <= 0.5);
  assert.match(DENSITE_PLM_META.population.sha256, /^[0-9a-f]{64}$/);
  assert.match(DENSITE_PLM_META.superficie.sha256, /^[0-9a-f]{64}$/);
});

for (const [insee, nom] of VILLES) {
  test(`D4. ${nom} (${insee}) : la densité de la commune entière, dite comme telle, et la carte dit vrai`, () => {
    const s = buildTerritoireSnapshot(inputsVille(insee, nom), T0);
    const d = fait(s, "place.density");
    const attendu = DENSITE_PLM[insee]!;
    assert.equal(d.value, attendu.habitantsParKm2);
    assert.equal(d.status, "ok");
    assert.deepEqual(d.source, { producer: "INSEE", dataset: "Populations légales 2022 ; superficie, base du comparateur de territoires", field: "PMUN / SUP" });
    assert.match(d.limits!, new RegExp(`toute la commune de ${nom} .* aucun arrondissement en particulier`));
    assert.equal(d.provenance?.producer, "Insee");
    assert.equal(d.provenance?.distributor, undefined, "ADEME n'en est pas le diffuseur");
    assert.match(d.provenance!.limits!, /aucun arrondissement/);
    assert.equal(derive(s, "density.category")?.label, "Commune dense");
    // La phrase reprend le chiffre et le mot « commune », juste ici.
    assert.match(synthese(s), new RegExp(`est une commune dense \\(${frInt(attendu.habitantsParKm2)} habitants au km²\\)`));
    assert.equal(buildTerritoryIdentity(withHash(s)).densite?.label, "Commune dense");
  });
}

for (const [insee, label, phrase] of [
  ["75111", "Arrondissement dense", "est un arrondissement dense"],
  ["75116", "Arrondissement dense", "est un arrondissement dense"],
  ["69381", "Arrondissement dense", "est un arrondissement dense"],
  ["13201", "Arrondissement dense", "est un arrondissement dense"],
  ["13209", "Densité intermédiaire", "a une densité intermédiaire"],
  ["13216", "Densité intermédiaire", "a une densité intermédiaire"],
] as const) {
  test(`D5. ${insee} : la densité de l'arrondissement lu, jamais celle de la ville`, () => {
    const s = buildTerritoireSnapshot(inputsArrondissement(insee), T0);
    const d = fait(s, "place.density");
    const ville = DENSITE_PLM[villeDeArrondissement(insee)!.code]!;
    assert.equal(d.value, DENSITE_PLM[insee]!.habitantsParKm2);
    assert.notEqual(d.value, ville.habitantsParKm2);
    assert.match(d.limits!, /^Densité moyenne de l'arrondissement /);
    assert.match(d.limits!, new RegExp(`celle de ${ville.ville} entière est différente`));
    assert.equal(buildTerritoryIdentity(withHash(s)).densite?.label, label, "un arrondissement n'est pas appelé « commune »");
    const texte = synthese(s);
    assert.match(texte, new RegExp(`${phrase} \\(${frInt(DENSITE_PLM[insee]!.habitantsParKm2)} habitants au km²\\)`));
    assert.doesNotMatch(texte, /une commune (peu )?dense/);
  });
}

test("D6. ADEME garde la main : la densité Insee n'est lue qu'à défaut, jamais par-dessus", () => {
  const base = chatelaillonInputs();
  const intrus = { ...DENSITE_PLM["75111"]! };
  const avecIntrus = buildTerritoireSnapshot({ ...base, densiteInsee: intrus }, T0);
  const sans = buildTerritoireSnapshot(base, T0);
  assert.deepEqual(fait(avecIntrus, "place.density"), fait(sans, "place.density"));
  assert.equal(densiteInseeRetenue({ ...base, densiteInsee: intrus }), null);
  // Le champ absent ou nul ne change pas l'empreinte d'une commune ordinaire (Châtelaillon).
  assert.equal(withHash(buildTerritoireSnapshot({ ...base, densiteInsee: null }, T0)).hash, withHash(sans).hash);
});

test("D7. absence ≠ zéro : aucune occupation des sols n'est inventée pour Paris, Lyon, Marseille ni leurs arrondissements", () => {
  for (const s of [...VILLES.map(([i, n]) => buildTerritoireSnapshot(inputsVille(i, n), T0)), ...["75111", "69381", "13209"].map((i) => buildTerritoireSnapshot(inputsArrondissement(i), T0))]) {
    for (const k of ["land.composition", "land.natural_share", "land.water_share", "land.natural_share_15km", "land.forest_ademe"]) {
      assert.equal(fait(s, k).value, null, k);
      assert.equal(fait(s, k).status, "missing", k);
    }
    assert.equal(derive(s, "land.category"), null, "aucune catégorie d'occupation des sols");
    assert.doesNotMatch(synthese(s), /urbanisé|espaces naturels|artificialis/i);
    assert.equal(buildTerritoryIdentity(withHash(s)).solDominant, null);
  }
});

test("D8. non-régression FUT-43 : population, agglomération et démographie de la ville inchangées", () => {
  const s = buildTerritoireSnapshot(inputsVille("75056", "Paris"), T0);
  assert.equal(fait(s, "place.population").value, 2133111, "population 2021, somme des arrondissements (FUT-43)");
  assert.deepEqual((fait(s, "demography.trend").value as { annualPct: number }).annualPct, -0.56);
  assert.equal((fait(s, "place.urban_role").value as { uuLabel: string }).uuLabel, "Paris");
  assert.equal(fait(s, "place.position").value, null, "une position ne s'agrège pas (FUT-43)");
  assert.equal(fait(s, "place.distinctive_trait").value, null);
});
