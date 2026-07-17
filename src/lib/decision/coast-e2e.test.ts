import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";

// Les sections portent désormais des CARTES (faits simples ou compositions) : les e2e lisent les faits.
function sectionFacts(s?: { cards?: import("./decision-fact.ts").DossierCard[] }) {
  return (s?.cards ?? []).flatMap((c) => (c.kind === "fact" ? [c.fact] : []));
}


// BOUT EN BOUT : IndexCommune -> mapCommuneToModuleFacts -> runRules -> assembleDossier. On prouve que la
// mesure de distance à la mer traverse toute la chaîne et ressort en carte dans la section « mismatches ».
const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return { insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
    population: 98000, densite: 6800, distance_cote_km: 240, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune) };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return { posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z" };
}
function context(f: { lat: number; lon: number; nom: string }): EvaluationContext {
  return { constraints: hydrateHardConstraints({}, DIR),
    point: { lat: f.lat, lon: f.lon, grain: "commune_reference", source: "commune_centroid", label: f.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION };
}
function dossierFor(e: IndexCommune, p: UserProject) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: e.population ?? null, tailleVilleSource: "commune" });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E mer loin (>=100, poids 3) -> carte absolute_measure dans « mismatches », arbitrage", () => {
  const d = dossierFor(entry({ distance_cote_km: 240 }), project([{ key: "proximite_mer", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.ok(sec, "la section « mismatches » doit exister");
  const mer = sectionFacts(sec).find((f) => f.role === "mismatch" && (f as { basis: { kind: string } }).basis.kind === "absolute_measure");
  assert.ok(mer, "une carte de distance à la mer doit être présente");
  assert.match(mer!.statement, /distance au littoral est estimée à environ 240 km/);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E mer proche (<=15) -> satisfied : couverture examinée, outcome favorable, orientation favorable, aucune carte", () => {
  const d = dossierFor(entry({ distance_cote_km: 4 }), project([{ key: "proximite_mer", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const mer = sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "absolute_measure");
  assert.equal(mer.length, 0, "aucune carte quand la commune est proche du littoral");
  const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
  assert.equal(crit?.coverage, "examined");
  assert.equal(crit?.outcome, "favorable"); // satisfied (RuleOutcome) -> favorable (CriterionOutcome)
  assert.equal(d.criteria.orientation, "favorable");
});

test("E2E mer intermédiaire (15 < d < 100) -> neutral : couverture examinée, orientation neutral, aucune carte", () => {
  const d = dossierFor(entry({ distance_cote_km: 50 }), project([{ key: "proximite_mer", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const mer = sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "absolute_measure");
  assert.equal(mer.length, 0, "aucune carte en zone intermédiaire");
  const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
  assert.equal(crit?.coverage, "examined");
  assert.equal(d.criteria.orientation, "neutral"); // examiné, aucun signal favorable matériel
});

test("E2E poids 1 : loin -> couverture acquise, aucune carte, pas d'arbitrage", () => {
  const d = dossierFor(entry({ distance_cote_km: 240 }), project([{ key: "proximite_mer", weight: 1 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const mer = sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "absolute_measure");
  assert.equal(mer.length, 0, "poids 1 : silencieux");
  assert.notEqual(d.criteria.orientation, "arbitration");
  const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
  assert.equal(crit?.coverage, "examined"); // examiné : le mismatch poids-1 monte la couverture
});
