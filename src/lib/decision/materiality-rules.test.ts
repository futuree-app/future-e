import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";

// Les règles des CONTRAINTES DURES sont testées dans hard-constraint-rules.test.ts (la fabrique) et dans
// hard-constraints.test.ts (les évaluateurs). Ici, on teste les règles de PRÉFÉRENCE, et le fait que le
// registre les fasse tourner ensemble.

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6045, lon: 1.4442, uu: "31701",
    tailleVille: 1_060_000, reliefProximite: 0, distanceCoteKm: 1, population: 5000, altitude: 100,
    catnatInondation: 0, inondationRisque: 10, scores: {}, hasAddress: false, ...over,
  };
}
function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };

// Le contexte est HYDRATÉ à partir du projet, comme en production : les règles de contrainte dure y
// répondent réellement, et les règles de préférence l'ignorent (elles ne déclarent que deux paramètres).
function hard(p: UserProject, f: ModuleFacts): EvaluationContext {
  return {
    constraints: hydrateHardConstraints(p.parsed?.hardConstraints, DIR),
    point: f.lat != null && f.lon != null
      ? { lat: f.lat, lon: f.lon, grain: "commune_reference", source: "commune_centroid", label: f.nom }
      : null,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}
function run(f: ModuleFacts, p: UserProject) {
  return runRules(f, p, hard(p, f));
}

test("invariant : chaque fait porte ruleId + preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = run(facts({ distanceCoteKm: 42 }), p);
  assert.ok(r.facts.length > 0);
  for (const f of r.facts) {
    assert.ok(f.ruleId.length > 0);
    if (f.role !== "compromise") assert.ok(f.evidence.length >= 1);
  }
});

test("règle compromis : deux côtés, chacun sa preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }, { key: "faible_chaleur", weight: 2 }] });
  const r = run(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.compromis-transport-chaleur");
  assert.ok(f && f.role === "compromise");
  assert.equal(f.sides.length, 2);
  assert.ok(f.sides[0].evidence.length >= 1 && f.sides[1].evidence.length >= 1);
  assert.equal(f.sides[0].evidence[0].observedValue, "80/100");
  assert.doesNotMatch(f.sides[0].statement + f.sides[1].statement, /meilleure|train/i);
});

test("règle compromis : rien si une seule dimension déclarée", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }] });
  const r = run(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.compromis-transport-chaleur"), false);
});

test("règle confort : inconnue scopée sans adresse, quelle que soit l'intention", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const r = run(facts({ hasAddress: false }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.confort-ete-sans-adresse");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
  assert.equal(f.action?.type, "renseigner_adresse");
});

test("règle confort : rien si adresse présente", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const r = run(facts({ hasAddress: true }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.confort-ete-sans-adresse"), false);
});

test("règle inondation : vérification si exposition notable, texte acheteur", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.ok(f.action.label.length > 0);
  assert.match(f.statement, /avant de vous engager/);
  assert.match(f.statement, /1982/);
});

test("règle inondation : posture habitant -> comprendre/surveiller, pas s'engager", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] }, { posture: "habitant" });
  const r = run(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.doesNotMatch(f.statement, /avant de vous engager/);
  assert.match(f.statement, /surveiller/i);
});

test("règle inondation : exposition inconnue -> aucun fait", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ inondationRisque: null }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.inondation-exposition"), false);
});

// ── Le contrat des outcomes (slice 2.1) ────────────────────────────────────────
// not_applicable = HORS SUJET. satisfied = déclaré, examiné, RIEN À REDIRE.
// Les confondre faisait compter une bonne nouvelle comme un trou de couverture.

test("règle inondation : exposition FAIBLE + priorité déclarée -> satisfied (examiné, rien à redire)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ inondationRisque: 20 }), p);
  const ev = r.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "satisfied");
  assert.deepEqual(ev?.facts, []); // silencieux : aucune carte, mais un point FAVORABLE
});

test("règle inondation : priorité NON déclarée -> not_applicable (hors sujet)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] });
  const r = run(facts({ inondationRisque: 20 }), p);
  const ev = r.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "not_applicable");
});

// ── Le registre fait tourner les 11 contraintes dures, au-dessus de l'évaluateur partagé ──

test("le registre porte les 11 contraintes dures, et le dossier les examine", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = run(facts({ distanceCoteKm: 42 }), p);
  const hardEvals = r.evaluations.filter((e) => e.ruleId.startsWith("territoire.hard."));
  assert.equal(hardEvals.length, 11);
  assert.equal(r.evaluations.find((e) => e.ruleId === "territoire.hard.nearSea")?.outcome, "incompatible");
  // Les dix autres ne sont pas déclarées : HORS SUJET, pas un trou de couverture.
  assert.equal(hardEvals.filter((e) => e.outcome === "not_applicable").length, 10);
});
