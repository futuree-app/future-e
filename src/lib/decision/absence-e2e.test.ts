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


// BOUT EN BOUT : IndexCommune -> mapCommuneToModuleFacts -> runRules -> assembleDossier. On prouve que
// l'attestation d'absence traverse toute la chaîne câblée et ressort en carte dans la section « mismatches ».
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
function dossierFor(e: IndexCommune, p: UserProject) {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: e.population ?? null, tailleVilleSource: "commune" });
  return assembleDossier(runRules(mf, p, context(mf)), p, "commune", e.nom);
}

test("E2E absence structurante : réseau mesuré sous plancher (poids 3) -> carte dans « mismatches », arbitrage", () => {
  const e = entry({ reseauLocal: null, reseauLocalMeasured: true,
    etudesSup: { measured: true, weightedAccess: 0, radiusKm: 25, establishmentCount: 0 } });
  const d = dossierFor(e, project([{ key: "mobilite_quotidienne", weight: 3 }, { key: "vie_etudiante", weight: 2 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.ok(sec, "la section « mismatches » doit exister");
  const mobil = sectionFacts(sec).find((f) => f.role === "mismatch" && (f as { basis: { kind: string } }).basis.kind === "named_absence");
  assert.ok(mobil, "une carte d'absence attestée doit être présente");
  assert.match(mobil!.statement, /point de référence retenu/);
  assert.doesNotMatch(mobil!.statement, /insuffisant|aucune vie étudiante/i);
  assert.equal(d.criteria.orientation, "arbitration");
});

test("E2E symétrique : réseau desservi + établissement présent -> neutral, aucune carte d'absence", () => {
  const e = entry({ reseauLocal: { acces: 80, tram: true, metro: false, arret_km: 0.3 }, reseauLocalMeasured: true,
    etudesSup: { measured: true, weightedAccess: 5, radiusKm: 10, establishmentCount: 3 } });
  const d = dossierFor(e, project([{ key: "mobilite_quotidienne", weight: 3 }, { key: "vie_etudiante", weight: 2 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const absences = sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "named_absence");
  assert.equal(absences.length, 0, "aucune carte d'absence quand l'élément est présent");
  assert.notEqual(d.criteria.orientation, "arbitration");
});

test("E2E non mesuré : marqueur absent -> uncertain, aucune carte, couverture non acquise", () => {
  const e = entry(); // pas de reseauLocalMeasured ni etudesSup
  const d = dossierFor(e, project([{ key: "mobilite_quotidienne", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const absences = sectionFacts(sec).filter((f) => (f as { basis?: { kind: string } }).basis?.kind === "named_absence");
  assert.equal(absences.length, 0);
  const crit = d.criteria.registry.find((c) => c.criterionKey === "mobilite_quotidienne");
  assert.notEqual(crit?.coverage, "examined"); // non examiné : une absence n'est jamais inventée
});
