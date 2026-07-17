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
// catégorie de taille traverse la chaîne et ressort en carte dans « mismatches ».
const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return { insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
    population: 98000, densite: 6800, distance_cote_km: 90, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune) };
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
function dossierFor(e: IndexCommune, p: UserProject, tailleVille: number | null, source: "urban_unit" | "commune" | null) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille, tailleVilleSource: source });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E eviter_grandes_villes, métropole UU, poids 3 -> carte categorical_state, arbitrage", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, "urban_unit");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = sectionFacts(sec).find((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.ok(taille, "une carte de taille doit être présente");
  assert.match(taille!.statement, /appartient à une métropole/);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E eviter_grandes_villes, village -> satisfied favorable, aucune carte", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_200, "commune");
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state").length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  assert.equal(crit?.coverage, "examined");
  assert.equal(crit?.outcome, "favorable");
  assert.equal(d.criteria.orientation, "favorable");
});

test("E2E eviter_isolement, village source commune -> carte SANS 'agglomération', jamais 'isolée'", () => {
  const d = dossierFor(entry({ nom: "Petiville" }), project([{ key: "eviter_isolement", weight: 2 }]), 900, "commune");
  const sec = d.sections.find((s) => s.key === "mismatches");
  const taille = sectionFacts(sec).find((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state");
  assert.ok(taille, "village -> carte isolement");
  assert.doesNotMatch(taille!.statement, /agglomération/);
  assert.match(taille!.statement, /population communale/);
  assert.match(taille!.statement, /sans permettre de conclure/);
});

test("E2E anomalie : taille présente, source null -> uncertain (aucune carte, non examiné)", () => {
  const d = dossierFor(entry(), project([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, null);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "categorical_state").length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  assert.notEqual(crit?.coverage, "examined");
});
