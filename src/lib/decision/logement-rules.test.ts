import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts, LogementFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { EvaluationContext } from "../hard-constraints.ts";

function lf(over: Partial<LogementFacts> = {}): LogementFacts {
  return { dpe: "correct", dpeLabel: null, rga: "none", expositionBati: false, pprn: "none", zoneReglementee: false, pprnLabel: null, cavites: "none", caviteProche: false, patrimoine: "none", perimetrePatrimonial: false, sinistralite: "none", sinistraliteActive: false, addressLabel: "7 Rue du Taur", ...over };
}
function facts(logement?: LogementFacts): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6, lon: 1.44, uu: "31701",
    tailleVille: 1_060_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 150, population: 500000, altitude: 146,
    catnatInondation: 0, inondationRisque: 10, climat: null, scores: {}, hasAddress: true, logement,
  };
}
// Aucune contrainte dure déclarée : les 11 évaluations rendent not_declared, et les règles Logement
// (qui n'en déclarent que deux paramètres) l'ignorent.
const HARD: EvaluationContext = {
  constraints: {
    departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
    nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [], sizeRelativeTo: null,
  },
  point: { lat: 43.6, lon: 1.44, grain: "commune_reference", source: "commune_centroid", label: "Toulouse" },
  conventionsVersion: "hc-conv-1",
};
function project(over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as UserProject["parsed"], updatedAt: null, ...over };
}

test("bloc logement absent -> aucune règle Logement", () => {
  assert.equal(runRules(facts(undefined), project(), HARD).facts.some((f) => f.ruleId.startsWith("logement.")), false);
});

test("DPE passoire -> verification, preuve persisted_snapshot, classe exacte", () => {
  const f = runRules(facts(lf({ dpe: "passoire", dpeLabel: "G" })), project({ intent: "achat" }), HARD).facts.find((x) => x.ruleId === "logement.dpe-faible");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].sourceMode, "persisted_snapshot");
  assert.match(f.statement, /G/);
  assert.match(f.statement, /passoire/i);
});

test("cavités unavailable -> unknown scopée, pas verification", () => {
  const f = runRules(facts(lf({ cavites: "unavailable" })), project(), HARD).facts.find((x) => x.ruleId === "logement.cavite");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
});

test("cavités none -> aucun fait", () => {
  assert.equal(runRules(facts(lf({ cavites: "none" })), project(), HARD).facts.some((x) => x.ruleId === "logement.cavite"), false);
});

test("PPRN present -> verification, preuve live_fetch", () => {
  const f = runRules(facts(lf({ pprn: "present", zoneReglementee: true })), project({ intent: "achat" }), HARD).facts.find((x) => x.ruleId === "logement.zone-reglementee");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].sourceMode, "live_fetch");
});

test("patrimoine present : pas de fait en location", () => {
  assert.equal(runRules(facts(lf({ patrimoine: "present", perimetrePatrimonial: true })), project({ intent: "location" }), HARD).facts.some((x) => x.ruleId === "logement.patrimoine"), false);
});

test("aucune règle Logement n'émet incompatibility", () => {
  const r = runRules(facts(lf({ dpe: "passoire", rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true, sinistralite: "present", sinistraliteActive: true })), project({ intent: "achat" }), HARD);
  assert.equal(r.facts.some((f) => f.ruleId.startsWith("logement.") && f.role === "incompatibility"), false);
});

test("texte posture-aware : achat parle de fondations, location de bailleur (RGA)", () => {
  const achat = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "achat" }), HARD).facts.find((x) => x.ruleId === "logement.exposition-bati");
  const loc = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "location" }), HARD).facts.find((x) => x.ruleId === "logement.exposition-bati");
  assert.ok(achat && achat.role === "verification" && loc && loc.role === "verification");
  assert.match(achat.action.label, /fondation|sinistre|antécédent/i);
  assert.match(loc.action.label, /bailleur/i);
});
