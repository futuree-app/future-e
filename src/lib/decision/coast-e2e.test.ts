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


// BOUT EN BOUT : IndexCommune -> mapCommuneToModuleFacts -> runRules -> assembleDossier. FUT-33 (2B.2 D) : la
// préférence « la mer compte », sans distance dite, est EXAMINÉE (la distance existe) sans verdict : ni carte
// « favorable », ni écart, quelle que soit la distance. Le critère reste une appréciation (« indéterminé »).
const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return { insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
    population: 98000, densite: 6800, mer_centre_km: 240, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune) };
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

for (const [km, poids] of [[0.7, 3], [8, 3], [50, 3], [240, 3], [240, 1]] as const) {
  test(`E2E mer à ${km} km, poids ${poids} : examinée, sans carte ni verdict (aucun seuil inventé)`, () => {
    const d = dossierFor(entry({ mer_centre_km: km }), project([{ key: "proximite_mer", weight: poids }]));
    const toutes = d.sections.flatMap((s) => sectionFacts(s));
    assert.equal(toutes.some((f) => (f as { projectKey?: string }).projectKey === "proximite_mer"), false);
    const crit = d.criteria.registry.find((c) => c.criterionKey === "proximite_mer");
    assert.equal(crit?.coverage, "examined");
    assert.equal(crit?.outcome, "indeterminate");
    assert.equal(d.criteria.orientation, "neutral");
  });
}

test("E2E mer : distance inconnue -> non examinée (jamais un verdict)", () => {
  const d = dossierFor(entry({ mer_centre_km: undefined }), project([{ key: "proximite_mer", weight: 3 }]));
  assert.equal(d.criteria.registry.find((c) => c.criterionKey === "proximite_mer")?.coverage, "unexamined");
});
