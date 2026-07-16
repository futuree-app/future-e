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

// BOUT EN BOUT : index (rankBand) -> mapping -> runRules -> dossier. On prouve que la douceur hivernale
// (relative_position, lot 4b) traverse la chaîne et ressort en carte / satisfied / uncertain.
const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
function entry(over: Partial<IndexCommune> = {}): IndexCommune {
  return { insee: "59512", nom: "Roubaix", dept: "59", region: "Hauts-de-France", lat: 50.69, lon: 3.18,
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
function dossierFor(e: IndexCommune, p: UserProject) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: e.population ?? null, tailleVilleSource: "commune" });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E hiver parmi les moins doux (rang bas), poids 3 -> carte relative_position, arbitrage, limitation 1976-2005", () => {
  const d = dossierFor(entry({ rankBands: { douceur_climat: [300, 1200] } } as Partial<IndexCommune>), project([{ key: "douceur_climat", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const f = (sec?.facts ?? []).find((x) => (x as { basis?: { kind: string } }).basis?.kind === "relative_position" && x.projectKey === "douceur_climat");
  assert.ok(f, "carte douceur attendue");
  assert.match(f!.limitation!, /1976-2005/);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E hiver parmi les plus doux (rang haut), poids 3 -> satisfied favorable, aucune carte", () => {
  const d = dossierFor(entry({ rankBands: { douceur_climat: [8800, 9700] } } as Partial<IndexCommune>), project([{ key: "douceur_climat", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal((sec?.facts ?? []).filter((x) => (x as { basis?: { kind: string } }).basis?.kind === "relative_position" && x.projectKey === "douceur_climat").length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "douceur_climat");
  assert.equal(crit?.outcome, "favorable");
  assert.equal(d.criteria.orientation, "favorable");
});

test("E2E rang absent -> uncertain, aucune carte", () => {
  const d = dossierFor(entry({ rankBands: {} } as Partial<IndexCommune>), project([{ key: "douceur_climat", weight: 3 }]));
  const crit = d.criteria.registry.find((c) => c.criterionKey === "douceur_climat");
  assert.notEqual(crit?.coverage, "examined");
});
