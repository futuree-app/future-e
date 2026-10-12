// FUT-90 : UNE CONDITION CONFIRMÉE SUR LA CHALEUR (OU LE FEU) NE DOIT PLUS FAIRE ÉCHOUER L'ASSEMBLAGE.
//
// Vu à Nîmes (30189) le 11/10/2026 : « fait absorbé inexistant : 30189:climat-chaleur
// (30189:composition-confort-ete) ». La carte « À confirmer » de FUT-7 RÉUNIT le mismatch chaleur et le
// retire de `run.facts` ; la composition « confort d'été » allait pourtant le chercher dans la TRACE de la
// règle (`run.evaluations[].facts`, qui le garde) et l'absorbait une seconde fois. Le validateur, à juste
// titre, refusait d'absorber un fait que le dossier n'émet plus.
//
// Ces tests suivent la vraie chaîne (projet relu par la base, règles, conditions, compositions,
// assemblage, artefact) et vérifient ce que le dossier DIT, pas seulement qu'il ne jette plus.
import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { composeFacts, assertCompositionsValid } from "./fact-compositions.ts";
import { buildDecisionArtifact } from "./decision-artifact.ts";
import { buildClimatFacts, type ClimatFacts, type GwlScenarios } from "./climat-facts.ts";
import { buildConfirmation } from "./conditions.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { normalizeUserProject, type UserProject } from "../user-project.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { ConditionCheckFact, DecisionFact, Dossier, ModuleFacts } from "./decision-fact.ts";

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };

// Des chiffres du type de Nîmes (repris de materiality-rules.test.ts) et une commune épargnée.
const SC_EXPOSEE: GwlScenarios = {
  gwl15: { h: "2030", v: { NORTX35D_yr: 8, ATX35D_yr: 5, NORTR_yr: 48, ATR_yr: 15, NORIFM40_yr: 40, AIFM40_yr: 6, NORRx1d_yr: 70, ARRx1d_yr: 0.08 } },
  gwl20: { h: "2050", v: { NORTX35D_yr: 14, ATX35D_yr: 11, NORTR_yr: 69, ATR_yr: 36, NORIFM40_yr: 50, AIFM40_yr: 16, NORRx1d_yr: 74, ARRx1d_yr: 0.14 } },
  gwl30: { h: "2100", v: { NORTX35D_yr: 26, ATX35D_yr: 23, NORTR_yr: 95, ATR_yr: 62, NORIFM40_yr: 70, AIFM40_yr: 36, NORRx1d_yr: 84, ARRx1d_yr: 0.29 } },
};
const SC_EPARGNEE: GwlScenarios = {
  gwl20: { h: "2050", v: { NORTX35D_yr: 0, ATX35D_yr: 0, NORTR_yr: 3, ATR_yr: 3, NORIFM40_yr: 1, AIFM40_yr: 0, NORRx1d_yr: 43, ARRx1d_yr: 0.13 } },
};
const EXPOSEE = buildClimatFacts(SC_EXPOSEE)!;
const EPARGNEE = buildClimatFacts(SC_EPARGNEE)!;

const NIMES: IndexCommune = {
  insee: "30189", nom: "Nîmes", dept: "30", region: "Occitanie", lat: 43.84, lon: 4.36,
  population: 148_000, densite: 920, mer_centre_km: 40, altitude: 60, clim: {}, pct: {},
} as IndexCommune;
// Des hivers parmi les plus doux : déclenche le tradeoff saisonnier quand douceur_climat est déclarée.
const NIMES_HIVER_DOUX = { ...NIMES, rankBands: { douceur_climat: [8800, 9700] } } as unknown as IndexCommune;

function projet(prefs: Partial<Record<PreferenceKey, number>>): UserProject {
  return normalizeUserProject({
    posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })) },
  })!;
}
function confirme(p: UserProject, ...keys: PreferenceKey[]): UserProject {
  const conditions = keys.map((key) => buildConfirmation(p, { kind: "preference", key }, "2026-10-01T00:00:00.000Z")!);
  return normalizeUserProject({ ...p, conditions })!;
}

type Opts = { climat?: ClimatFacts | null; adresse?: boolean; feuRecense?: boolean };
// LE MÊME ENCHAÎNEMENT que buildCommuneDossier / assembleAddressDossier, sans I/O.
function dossier(e: IndexCommune, p: UserProject, o: Opts = {}) {
  const base = mapCommuneToModuleFacts(e, {}, {
    hasAddress: o.adresse ?? false, tailleVille: e.population ?? null, tailleVilleSource: "commune",
    climat: o.climat === undefined ? EXPOSEE : o.climat,
    risquesDeclares: { wildfire: o.feuRecense ?? false },
  });
  const mf: ModuleFacts = { ...base, hasAddress: o.adresse ?? false };
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, DIR),
    point: o.adresse
      ? { lat: e.lat!, lon: e.lon!, grain: "address", source: "address_geocoder", label: "1 rue de test, Nîmes" }
      : { lat: e.lat!, lon: e.lon!, grain: "commune_reference", source: "commune_centroid", label: e.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  const comps = composeFacts(run, mf, p);
  const d = assembleDossier(run, p, o.adresse ? "commune+adresse" : "commune", mf.nom, comps, null);
  return { run, comps, d };
}

const faitsAffiches = (d: Dossier): DecisionFact[] =>
  d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [c.fact] : [])));
const idsComposes = (d: Dossier): string[] =>
  d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "composition" ? [c.composition.id] : [])));
const carteCondition = (d: Dossier, key: PreferenceKey): ConditionCheckFact | undefined =>
  faitsAffiches(d).find((f): f is ConditionCheckFact =>
    f.role === "condition_check" && f.criterion.kind === "preference" && f.criterion.key === key);

// ── LE CAS DU TICKET ──────────────────────────────────────────────────────────────────────────

for (const poids of [2, 3]) {
  test(`Nîmes, faible_chaleur poids ${poids} CONFIRMÉE, exposition défavorable : le dossier s'assemble et dit la condition ouverte`, () => {
    const p = confirme(projet({ faible_chaleur: poids }), "faible_chaleur");
    const { d, run, comps } = dossier(NIMES, p);
    // La carte condition RÉUNIT le mismatch : il a quitté run.facts, la trace de la règle le garde.
    assert.equal(run.facts.some((f) => f.id === "30189:climat-chaleur"), false);
    assert.ok(run.evaluations.find((e) => e.ruleId === "territoire.climat-chaleur")!.facts.some((f) => f.id === "30189:climat-chaleur"));
    // Aucune composition ne repêche un fait que le dossier n'émet plus.
    assert.equal(comps.some((c) => c.absorbedFactIds.includes("30189:climat-chaleur")), false);
    assert.doesNotThrow(() => assertCompositionsValid(run, comps));
    // CE QUE LE DOSSIER DIT.
    const c = carteCondition(d, "faible_chaleur");
    assert.ok(c && c.role === "condition_check");
    assert.equal(c.signal, "defavorable");
    assert.equal(c.status, "Ouverte · plutôt défavorable");
    assert.match(c.statement, /passeraient de 3 par an/); // le constat chiffré de la règle, pas une phrase vide
    assert.ok(c.evidence.some((e) => e.factId === "climat.joursTresChauds"));
    assert.ok(c.evidence.some((e) => e.factId === "climat.nuitsTropicales"));
    assert.equal(d.criteria.orientation, "condition_to_confirm");
    assert.equal(d.narrativePlan.verdictLabel, "Condition ouverte");
    // Pas lu deux fois : ni la carte « confort d'été », ni le mismatch seul.
    assert.equal(idsComposes(d).includes("30189:composition-confort-ete"), false);
    assert.equal(faitsAffiches(d).some((f) => f.id === "30189:climat-chaleur"), false);
    // La couverture reste vraie : examiné, à confirmer, jamais « favorable ».
    const crit = d.criteria.registry.find((x) => x.criterionKey === "faible_chaleur")!;
    assert.equal(crit.coverage, "examined");
    assert.equal(crit.outcome, "to_confirm");
  });
}

test("Nîmes, faible_chaleur poids 1 CONFIRMÉE : aucun fait émis, la carte condition reste défavorable", () => {
  const { d, comps } = dossier(NIMES, confirme(projet({ faible_chaleur: 1 }), "faible_chaleur"));
  assert.equal(comps.length, 0);
  assert.equal(carteCondition(d, "faible_chaleur")?.signal, "defavorable");
});

// ── LES TROIS ISSUES D'UNE CONDITION ─────────────────────────────────────────────────────────────

test("condition SATISFAITE (commune épargnée) : ouverte, plutôt favorable, aucune composition climatique", () => {
  const { d, comps } = dossier(NIMES, confirme(projet({ faible_chaleur: 3 }), "faible_chaleur"), { climat: EPARGNEE });
  const c = carteCondition(d, "faible_chaleur");
  assert.ok(c && c.role === "condition_check");
  assert.equal(c.signal, "favorable");
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition respectée"); // une préférence ne se tranche jamais
  assert.equal(comps.length, 0);
});

test("condition NON TRANCHABLE (trajectoire indisponible) : aucune carte inventée, critère non examiné, jamais favorable", () => {
  const { d, comps } = dossier(NIMES, confirme(projet({ faible_chaleur: 3 }), "faible_chaleur"), { climat: null });
  assert.equal(carteCondition(d, "faible_chaleur"), undefined);
  assert.equal(comps.length, 0);
  const crit = d.criteria.registry.find((x) => x.criterionKey === "faible_chaleur")!;
  assert.notEqual(crit.coverage, "examined");
  assert.notEqual(crit.outcome, "favorable");
});

// ── AVEC ET SANS COMPOSITIONS CLIMATIQUES ─────────────────────────────────────────────────────────

test("sans condition : la composition « confort d'été » est toujours là (non-régression)", () => {
  const { d, comps, run } = dossier(NIMES, projet({ faible_chaleur: 3 }));
  assert.ok(comps.some((c) => c.id === "30189:composition-confort-ete"));
  assert.ok(run.facts.some((f) => f.id === "30189:climat-chaleur"));
  assert.equal(d.narrativePlan.verdictLabel, "Arbitrage");
});

test("hivers doux + chaleur CONFIRMÉE : le tradeoff saisonnier ne repêche pas la chaleur réunie", () => {
  const p = confirme(projet({ faible_chaleur: 3, douceur_climat: 3 }), "faible_chaleur");
  const { d, comps, run } = dossier(NIMES_HIVER_DOUX, p);
  assert.doesNotThrow(() => assertCompositionsValid(run, comps));
  assert.equal(comps.some((c) => c.id === "30189:composition-climat-saisons"), false);
  assert.equal(carteCondition(d, "faible_chaleur")?.signal, "defavorable");
});

test("hivers doux + chaleur NON confirmée : le tradeoff saisonnier reste produit (non-régression)", () => {
  const { comps } = dossier(NIMES_HIVER_DOUX, projet({ faible_chaleur: 3, douceur_climat: 3 }));
  assert.ok(comps.some((c) => c.id === "30189:composition-climat-saisons"));
});

test("feu CONFIRMÉ (même défaut, même cause) : le dossier s'assemble, la chaleur non confirmée garde sa composition", () => {
  const p = confirme(projet({ faible_chaleur: 3, faible_risque_feu: 2 }), "faible_risque_feu");
  const { d, comps, run } = dossier(NIMES, p);
  assert.doesNotThrow(() => assertCompositionsValid(run, comps));
  assert.equal(comps.some((c) => c.id === "30189:composition-danger-incendie"), false);
  assert.ok(comps.some((c) => c.id === "30189:composition-confort-ete"));
  assert.equal(carteCondition(d, "faible_risque_feu")?.signal, "defavorable");
});

test("feu RECENSÉ et confirmé, poids 1 : la composition feu (sans seuil de poids) ne repêche pas non plus", () => {
  const { d, comps, run } = dossier(NIMES, confirme(projet({ faible_risque_feu: 1 }), "faible_risque_feu"), { feuRecense: true });
  assert.doesNotThrow(() => assertCompositionsValid(run, comps));
  assert.ok(carteCondition(d, "faible_risque_feu"));
});

test("chaleur ET feu confirmés : deux cartes condition, aucune composition climatique", () => {
  const p = confirme(projet({ faible_chaleur: 3, faible_risque_feu: 3 }), "faible_chaleur", "faible_risque_feu");
  const { d, comps } = dossier(NIMES, p);
  assert.equal(comps.length, 0);
  assert.ok(carteCondition(d, "faible_chaleur"));
  assert.ok(carteCondition(d, "faible_risque_feu"));
});

// ── LE GRAIN ADRESSE ET L'ARTEFACT VENDU ────────────────────────────────────────────────────────

test("dossier ADRESSE, chaleur confirmée : s'assemble au grain adresse ; sans condition, l'action suit le grain", () => {
  const avec = dossier(NIMES, confirme(projet({ faible_chaleur: 3 }), "faible_chaleur"), { adresse: true });
  assert.equal(avec.d.scope, "commune+adresse");
  assert.equal(carteCondition(avec.d, "faible_chaleur")?.signal, "defavorable");
  const sans = dossier(NIMES, projet({ faible_chaleur: 3 }), { adresse: true });
  const comfort = sans.comps.find((c) => c.id === "30189:composition-confort-ete");
  assert.ok(comfort && comfort.kind === "mismatch_with_action");
});

test("ARTEFACT : la version vendue se construit, et porte la carte condition avec ses preuves", () => {
  for (const adresse of [false, true]) {
    const p = confirme(projet({ faible_chaleur: 3, faible_risque_feu: 2 }), "faible_chaleur");
    const { d } = dossier(NIMES, p, { adresse });
    const a = buildDecisionArtifact(d, p, "2026-10-12T00:00:00.000Z", PRODUCT_CONVENTIONS_VERSION);
    const relu = JSON.parse(JSON.stringify(a)) as typeof a;
    const c = carteCondition(relu.dossier, "faible_chaleur");
    assert.ok(c && c.role === "condition_check");
    assert.ok(c.evidence.length > 0);
  }
});
