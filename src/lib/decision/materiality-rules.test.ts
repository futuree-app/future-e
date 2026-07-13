import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return { insee: "00000", nom: "Test", distanceCoteKm: 1, population: 5000, altitude: 100, catnatInondation: 0, inondationRisque: 10, scores: {}, hasAddress: false, ...over };
}
function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}

test("règle 1 mer : incompatibilité établie + couverture nearSea", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.mer-hors-seuil");
  assert.ok(f && f.role === "incompatibility");
  assert.equal(f.evidenceStrength, "established");
  assert.equal(f.hardConstraintKey, "nearSea");
  assert.equal(f.evidence[0].observedValue, "42 km");
  assert.ok(r.coveredHardConstraints.includes("nearSea"));
});

test("règle 1 mer : satisfaite -> aucun fait mais couverture nearSea", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 50 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 2 }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.mer-hors-seuil"), false);
  assert.ok(r.coveredHardConstraints.includes("nearSea"));
});

test("règle 1 mer : non déclarée -> pas de couverture", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  assert.equal(r.coveredHardConstraints.includes("nearSea"), false);
});

test("règle 2 taille : incompatibilité établie au-dessus du max", () => {
  const p = project({ reformulation: "x", hardConstraints: { communeSize: { min: null, max: 20000 } }, preferences: [] });
  const r = runRules(facts({ population: 45000 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.taille-hors-seuil");
  assert.ok(f && f.role === "incompatibility");
  assert.equal(f.hardConstraintKey, "communeSize");
  assert.match(f.statement, /45 000/);
});

test("règle 2 taille : population absente -> inconnue scopée", () => {
  const p = project({ reformulation: "x", hardConstraints: { communeSize: { min: null, max: 20000 } }, preferences: [] });
  const r = runRules(facts({ population: null }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.taille-hors-seuil");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
});

test("invariant : chaque fait porte ruleId + preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = runRules(facts({ distanceCoteKm: 42 }), p);
  for (const f of r.facts) {
    assert.ok(f.ruleId.length > 0);
    if (f.role !== "compromise") assert.ok(f.evidence.length >= 1);
  }
});

test("règle 3 compromis : deux côtés, chacun sa preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }, { key: "faible_chaleur", weight: 2 }] });
  const r = runRules(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.compromis-transport-chaleur");
  assert.ok(f && f.role === "compromise");
  assert.equal(f.sides.length, 2);
  assert.ok(f.sides[0].evidence.length >= 1 && f.sides[1].evidence.length >= 1);
  assert.equal(f.sides[0].evidence[0].observedValue, "80/100");
  assert.doesNotMatch(f.sides[0].statement + f.sides[1].statement, /meilleure|train/i);
});

test("règle 3 compromis : rien si une seule dimension déclarée", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }] });
  const r = runRules(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.compromis-transport-chaleur"), false);
});

test("règle 4 confort : inconnue scopée sans adresse, quelle que soit l'intention", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const r = runRules(facts({ hasAddress: false }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.confort-ete-sans-adresse");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
  assert.equal(f.action?.type, "renseigner_adresse");
});

test("règle 4 confort : rien si adresse présente", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const r = runRules(facts({ hasAddress: true }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.confort-ete-sans-adresse"), false);
});

test("règle 5 inondation : vérification si exposition notable, texte acheteur", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.ok(f.action.label.length > 0);
  assert.match(f.statement, /avant de vous engager/);
  assert.match(f.statement, /1982/);
});

test("règle 5 inondation : posture habitant -> comprendre/surveiller, pas s'engager", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] }, { posture: "habitant" });
  const r = runRules(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.doesNotMatch(f.statement, /avant de vous engager/);
  assert.match(f.statement, /surveiller/i);
});

test("règle 5 inondation : exposition inconnue -> aucun fait", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ inondationRisque: null }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.inondation-exposition"), false);
});

// ── Le contrat des outcomes (slice 2.1) ────────────────────────────────────────
// not_applicable = HORS SUJET. satisfied = déclaré, examiné, RIEN À REDIRE.
// Les confondre faisait compter une bonne nouvelle comme un trou de couverture.

test("règle 5 inondation : exposition FAIBLE + priorité déclarée -> satisfied (examiné, rien à redire)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = runRules(facts({ inondationRisque: 20 }), p);
  const ev = r.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "satisfied");
  assert.deepEqual(ev?.facts, []); // silencieux : aucune carte, mais un point FAVORABLE
});

test("règle 5 inondation : priorité NON déclarée -> not_applicable (hors sujet)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] });
  const r = runRules(facts({ inondationRisque: 20 }), p);
  const ev = r.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "not_applicable");
});
