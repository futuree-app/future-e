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
import { projectForSynthesis, SYNTHESIS_CONTRACT_VERSION } from "./synthesis-contract.ts";
import { checkSynthesis } from "./synthesis-checks.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";
import { withHash } from "../facts/hash.ts";
import { arrondissementsDe } from "../plm.ts";
import { ARRONDISSEMENTS_PLM } from "../plm-population.ts";
import { buildTerritoryIdentity } from "../territory-identity.ts";

type Entree = ArrondissementIndex & { nom: string; densite?: number | null; nature?: unknown; altitude?: number | null; mer_centre_km?: number | null; relief_proximite?: number | null };
const INDEX = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
const COMMUNES = INDEX.communes as Entree[];
// FUT-182 : l'occupation des sols de la ville entière, comptée sur ses propres pixels (index, meta.nature.communes_plm).
type NatureLue = NonNullable<NonNullable<TerritoireInputs["entry"]>["nature"]>;
const natureLue = (n: any): NatureLue | null =>
  n ? { terres: n.terres, eau_pct: n.eau_pct, couverture_pct: n.couverture_pct, secteur: n.secteur } : null;
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
    entry: { population: l.population, densite: null, mer_centre_km: null, relief_proximite: null, altitude: null, nature: natureLue(INDEX.meta.nature.communes_plm[insee]), demographie: l.demographie },
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
      relief_proximite: a.relief_proximite ?? null, altitude: a.altitude ?? null, nature: natureLue(a.nature),
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
    assert.equal(d.scale, "commune", "la ville entière, pas un arrondissement");
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
    assert.equal(d.scale, "arrondissement", "le périmètre réel, porté par le fait lui-même");
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

// FUT-182 : Paris, Lyon, Marseille et leurs 45 arrondissements ont désormais leur occupation des sols, mesurée chacun sur
// SES pixels (partition exacte au pixel : B1 § 35). Rien n'est copié d'un grain à l'autre, et aucun n'est classé.
test("D7. FUT-182 : la ville et chaque arrondissement ont leur propre occupation des sols, jamais celle d'un autre grain", () => {
  const paris = buildTerritoireSnapshot(inputsVille("75056", "Paris"), T0);
  const onzieme = buildTerritoireSnapshot(inputsArrondissement("75111"), T0);
  assert.equal((fait(paris, "land.natural_share").value as number).toFixed(2), "17.25");
  assert.notEqual(fait(onzieme, "land.natural_share").value, fait(paris, "land.natural_share").value);
  for (const s of [...VILLES.map(([i, n]) => buildTerritoireSnapshot(inputsVille(i, n), T0)), ...["75111", "69381", "13209"].map((i) => buildTerritoireSnapshot(inputsArrondissement(i), T0))]) {
    for (const k of ["land.composition", "land.natural_share", "land.water_share", "land.natural_share_sector"]) assert.notEqual(fait(s, k).value, null, k);
    assert.ok(derive(s, "land.category"), "une catégorie, sur ses propres parts");
    assert.equal(s.facts.some((f) => f.key === "land.natural_share_15km"), false);
  }
  for (const a of TOUS_ARRONDISSEMENTS) assert.equal((parInsee.get(a)!.nature as { score: number | null }).score, null, `${a} : hors univers des rangs`);
});

test("D8. non-régression FUT-43 : population, agglomération et démographie de la ville inchangées", () => {
  const s = buildTerritoireSnapshot(inputsVille("75056", "Paris"), T0);
  assert.equal(fait(s, "place.population").value, 2133111, "population 2021, somme des arrondissements (FUT-43)");
  assert.deepEqual((fait(s, "demography.trend").value as { annualPct: number }).annualPct, -0.56);
  assert.equal((fait(s, "place.urban_role").value as { uuLabel: string }).uuLabel, "Paris");
  assert.equal(fait(s, "place.position").value, null, "une position ne s'agrège pas (FUT-43)");
  assert.equal(fait(s, "place.distinctive_trait").value, null);
});

// ── Contre-revue : ce que reçoit le modèle, et ce que les garde-fous refusent ──────────────────

test("D9. projection : le modèle reçoit la catégorie au périmètre lu, et le contrat (donc le cache national) ne bouge pas", () => {
  const cat = (s: ReturnType<typeof buildTerritoireSnapshot>) =>
    (projectForSynthesis(withHash(s), "gwl20") as { commune: { densite: { categorie: string } | null } }).commune.densite?.categorie;
  assert.equal(cat(buildTerritoireSnapshot(inputsArrondissement("75111"), T0)), "Arrondissement dense");
  assert.equal(cat(buildTerritoireSnapshot(inputsArrondissement("69381"), T0)), "Arrondissement dense");
  assert.equal(cat(buildTerritoireSnapshot(inputsArrondissement("13209"), T0)), "Densité intermédiaire");
  assert.equal(cat(buildTerritoireSnapshot(inputsVille("75056", "Paris"), T0)), "Commune dense");
  for (const [insee, nom] of VILLES) assert.equal(cat(buildTerritoireSnapshot(inputsVille(insee, nom), T0)), "Commune dense");
  // Aucun libellé « Commune … » ne part pour un arrondissement, sur les 45.
  for (const a of TOUS_ARRONDISSEMENTS) assert.doesNotMatch(String(cat(buildTerritoireSnapshot(inputsArrondissement(a), T0))), /^Commune/, a);
  // Une commune ordinaire garde son échelle et son libellé (Châtelaillon, ADEME).
  const ordinaire = buildTerritoireSnapshot(chatelaillonInputs(), T0);
  assert.equal(fait(ordinaire, "place.density").scale, "commune");
  assert.match(String(derive(ordinaire, "density.category")?.label), /^(Commune|Densité)/);
  // FUT-179 ne touche pas au contrat. FUT-177 (fusionné après) l'a porté à @7 pour ses propres consignes, FUT-182 à @8
  // (secteur habité, parts au dixième) : ce sont les seules montées admises depuis @6.
  assert.equal(SYNTHESIS_CONTRACT_VERSION.split(":")[0], "territoire-synthese@8", "contrat : FUT-179 n'y touche pas ; FUT-177 l'a porté à @7, FUT-182 à @8");
});

const violations = (s: ReturnType<typeof buildTerritoireSnapshot>, texte: string) =>
  checkSynthesis(texte, projectForSynthesis(withHash(s), "gwl20")).map((v) => v.rule).filter((r) => !r.startsWith("format:"));

test("D10. garde-fous, Paris 11e : la densité de l'arrondissement n'est prêtée ni à une commune, ni à la ville", () => {
  const s = buildTerritoireSnapshot(inputsArrondissement("75111"), T0);
  assert.deepEqual(violations(s, "Paris 11e Arrondissement est un arrondissement dense (38 143 habitants au km²)."), []);
  for (const fautif of [
    "Paris 11e Arrondissement est une commune dense (38 143 habitants au km²).",
    "Le 11e est une ville très dense.",
    "La densité de la commune atteint 38 143 habitants au km².",
    "La densité de Paris atteint 38 143 habitants au km².",
  ]) assert.ok(violations(s, fautif).includes("interdit:densite-arrondissement-pretee-a-la-commune"), fautif);
  // La synthèse déterministe passe tous les contrôles.
  assert.deepEqual(violations(s, synthese(s)), []);
});

test("D11. garde-fous, Marseille 9e : « densité intermédiaire » ne devient pas « arrondissement dense »", () => {
  const s = buildTerritoireSnapshot(inputsArrondissement("13209"), T0);
  assert.deepEqual(violations(s, "Marseille 9e Arrondissement a une densité intermédiaire (1 207 habitants au km²)."), []);
  assert.ok(violations(s, "Marseille 9e Arrondissement est un arrondissement dense.").includes("densite:requalifiee-dense"));
  assert.ok(violations(s, "Marseille 9e Arrondissement est une commune peu dense.").includes("interdit:densite-arrondissement-pretee-a-la-commune"));
  assert.deepEqual(violations(s, synthese(s)), []);
});

test("D12. garde-fous, Paris entière : sa densité n'est attribuée à aucun arrondissement", () => {
  const s = buildTerritoireSnapshot(inputsVille("75056", "Paris"), T0);
  assert.deepEqual(violations(s, "Paris est une commune dense (20 054 habitants au km²)."), []);
  for (const fautif of ["Le 11e arrondissement est très dense.", "Chaque arrondissement compte 20 054 habitants au km², en densité."])
    assert.ok(violations(s, fautif).includes("interdit:densite-ville-pretee-a-un-arrondissement"), fautif);
  assert.deepEqual(violations(s, synthese(s)), []);
  // Une commune ordinaire n'est pas concernée par la règle (elle n'a pas d'arrondissements).
  assert.deepEqual(violations(buildTerritoireSnapshot(chatelaillonInputs(), T0), "Le centre est dense, loin des arrondissements de Paris.").filter((r) => r.includes("arrondissement")), []);
});
