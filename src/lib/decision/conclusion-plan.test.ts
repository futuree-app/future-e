import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionPlan, shouldGenerateNarrative, type ConclusionPlanInput } from "./conclusion-plan.ts";
import type { DecisionFact, MaterialityTier } from "./decision-fact.ts";

function verification(id: string, tier: MaterialityTier, statement = `constat ${id}`): DecisionFact {
  return {
    id, ruleId: `rule-${id}`, sourceFactIds: [], module: "logement", statement,
    materialityTier: tier, role: "verification",
    evidence: [{ factId: id, module: "logement", label: "DPE", observedValue: "F", grain: "adresse" }],
    action: { type: "verifier_sur_place", label: "Vérifier sur place" },
  };
}

function baseInput(over: Partial<ConclusionPlanInput> = {}): ConclusionPlanInput {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    shownFacts: [],
    uncovered: [],
    uncoveredPriorities: [],
    establishedIncompatibility: null,
    ...over,
  };
}

const AIR = { key: "qualite_air", label: "la qualité de l'air" };
const MER = { key: "nearSea" as const, label: "la proximité de la mer" };

// ── Le plan ────────────────────────────────────────────────────────────────────

test("le verdict existe toujours, vient en premier, et n'est JAMAIS générable", () => {
  const plan = buildConclusionPlan(baseInput());
  assert.equal(plan.blocks[0]?.key, "verdict");
  assert.equal(plan.blocks[0]!.generable, false);
  assert.ok(plan.blocks[0]!.fallbackText.length > 0);
});

test("l'ordre des blocs suit la hiérarchie éditoriale des réserves", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical")],
    uncovered: [MER],
    uncoveredPriorities: [AIR],
  }));
  assert.deepEqual(plan.blocks.map((b) => b.key), [
    "verdict", "unexamined_hard_constraints", "reserves_found", "uncovered_priorities",
  ]);
  assert.deepEqual(plan.blocks.filter((b) => b.generable).map((b) => b.key), [
    "unexamined_hard_constraints", "reserves_found", "uncovered_priorities",
  ]);
});

test("un registre vide ne produit aucun bloc", () => {
  assert.deepEqual(buildConclusionPlan(baseInput()).blocks.map((b) => b.key), ["verdict"]);
});

test("reservesCount compte les faits AFFICHÉS qu'on lui donne", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring"), verification("f2", "secondary")],
  }));
  assert.equal(plan.reservesCount, 2);
  assert.match(plan.blocks.find((b) => b.key === "reserves_found")!.fallbackText, /2 points/);
});

test("requiredPhrases : le NOYAU des libellés, sans l'article (une phrase décline, une liste pas)", () => {
  // « votre exigence DE proximité de la mer » est fidèle : exiger « LA proximité de la mer » la
  // rejetterait sur un article. On exige le noyau, qu'aucune tournure honnête ne peut perdre.
  const plan = buildConclusionPlan(baseInput({
    uncovered: [MER, { key: "nearPlace", label: "la proximité d'un lieu" }],
  }));
  assert.deepEqual(
    plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.requiredPhrases,
    ["proximité de la mer", "proximité d'un lieu"],
  );
});

test("requiredPhrases : le noyau des priorités non couvertes doit survivre", () => {
  const plan = buildConclusionPlan(baseInput({ uncoveredPriorities: [AIR] }));
  assert.deepEqual(
    plan.blocks.find((b) => b.key === "uncovered_priorities")!.requiredPhrases,
    ["qualité de l'air"],
  );
});

test("requiredPhrases des réserves : le NOMBRE seul, jamais la copie du constat du lead", () => {
  // Exiger le statement mot pour mot exigerait une COPIE, et annulerait la reformulation. Inutile :
  // le modèle ne reçoit que le lead, jamais les autres faits, donc il ne peut en couronner un autre.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "decision_critical", "Le logement porte une étiquette énergétique F"),
      verification("f2", "secondary"),
    ],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.requiredPhrases, ["2"]);
});

test("allowedNumbers : le compte VRAI du registre, en chiffres ET en lettres", () => {
  // L'invariant est « aucun nombre faux », pas « aucun nombre absent du repli » : « deux priorités »
  // est exact quand il y en a deux, et le rejeter censurerait une tournure française naturelle.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring"), verification("f2", "secondary"), verification("f3", "secondary")],
    uncoveredPriorities: [AIR, { key: "agriculture", label: "l'agriculture" }],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.allowedNumbers, ["3", "trois"]);
  assert.deepEqual(plan.blocks.find((b) => b.key === "uncovered_priorities")!.allowedNumbers, ["2", "deux"]);
});

test("requiredPhrases : lead tied -> le nombre aussi (aucun fait n'est couronné)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "decision_critical")],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.requiredPhrases, ["2"]);
});

test("les sourceIds d'un bloc viennent du déterministe", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring")],
    uncovered: [MER],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "reserves_found")!.sourceIds, ["f1"]);
  assert.deepEqual(plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.sourceIds, ["nearSea"]);
});

// ── Le fait saillant ───────────────────────────────────────────────────────────

test("lead single : un fait domine STRICTEMENT tous les autres", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "structuring")],
  }));
  assert.deepEqual(plan.lead, {
    kind: "single", factId: "f1", statement: "constat f1", materialityTier: "decision_critical",
  });
});

test("lead tied : deux faits partagent le rang maximal (un ordre de registre n'est pas une priorité)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "decision_critical"),
      verification("f2", "decision_critical"),
      verification("f3", "secondary"),
    ],
  }));
  assert.deepEqual(plan.lead, { kind: "tied", factIds: ["f1", "f2"], materialityTier: "decision_critical" });
});

test("lead none : rien d'assez matériel (rang maximal = secondary)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "secondary"), verification("f2", "secondary")],
  }));
  assert.deepEqual(plan.lead, { kind: "none" });
});

test("lead none : aucune réserve", () => {
  assert.deepEqual(buildConclusionPlan(baseInput()).lead, { kind: "none" });
});

// ── Honnêteté du plan ──────────────────────────────────────────────────────────

test("le plan ne contient AUCUN champ volatil (observedAt, sourceMode)", () => {
  const fact = verification("f1", "structuring");
  (fact as { evidence: { observedAt?: string; sourceMode?: string }[] }).evidence[0]!.observedAt =
    "2026-07-13T10:00:00Z";
  const serialized = JSON.stringify(buildConclusionPlan(baseInput({ shownFacts: [fact] })));
  assert.equal(serialized.includes("observedAt"), false);
  assert.equal(serialized.includes("2026-07-13"), false);
  assert.equal(serialized.includes("sourceMode"), false);
});

test("projet non structuré : verdict d'invite, aucun autre bloc", () => {
  const plan = buildConclusionPlan(baseInput({
    conclusionState: "project_not_structured",
    uncoveredPriorities: [AIR],
  }));
  assert.deepEqual(plan.blocks.map((b) => b.key), ["verdict"]);
});

test("incompatibilité établie : le verdict porte le constat, et reste déterministe", () => {
  const plan = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility",
    establishedIncompatibility: { factId: "i1", statement: "504 078 habitants, au-delà de 20 000." },
  }));
  assert.match(plan.blocks[0]!.fallbackText, /504 078 habitants/);
  assert.deepEqual(plan.blocks[0]!.sourceIds, ["i1"]);
  assert.equal(plan.blocks[0]!.generable, false);
});

test("le grain est explicite dans le verdict", () => {
  assert.match(
    buildConclusionPlan(baseInput({ scope: "commune+adresse" })).blocks[0]!.fallbackText,
    /commune et de l'adresse/,
  );
  assert.match(
    buildConclusionPlan(baseInput({ scope: "commune" })).blocks[0]!.fallbackText,
    /À l'échelle de la commune,/,
  );
});

// ── Le gate ────────────────────────────────────────────────────────────────────

test("gate : projet non structuré -> jamais", () => {
  const plan = buildConclusionPlan(baseInput({ conclusionState: "project_not_structured" }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict seul -> non", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput())), false);
});

test("gate : verdict + priorités non couvertes seules -> non (rien à articuler, matière faible)", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput({ uncoveredPriorities: [AIR] }))), false);
});

test("gate : verdict + une contrainte dure non examinée -> non (deux phrases déjà honnêtes)", () => {
  assert.equal(shouldGenerateNarrative(buildConclusionPlan(baseInput({ uncovered: [MER] }))), false);
});

test("gate : verdict + une seule réserve -> non", () => {
  const plan = buildConclusionPlan(baseInput({ shownFacts: [verification("f1", "decision_critical")] }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict + deux réserves secondaires (lead none) -> non", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "secondary"), verification("f2", "secondary")],
  }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict + deux réserves dont une domine -> oui", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "secondary")],
  }));
  assert.equal(shouldGenerateNarrative(plan), true);
});

test("gate : verdict + trois réserves ou plus -> oui", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "secondary"), verification("f2", "secondary"), verification("f3", "secondary"),
    ],
  }));
  assert.equal(shouldGenerateNarrative(plan), true);
});

test("gate : verdict + deux registres non-verdict -> oui", () => {
  const plan = buildConclusionPlan(baseInput({ uncovered: [MER], uncoveredPriorities: [AIR] }));
  assert.equal(shouldGenerateNarrative(plan), true);
});

test("gate : verdict + contrainte dure non examinée + réserves -> oui", () => {
  const plan = buildConclusionPlan(baseInput({
    uncovered: [MER], shownFacts: [verification("f1", "structuring")],
  }));
  assert.equal(shouldGenerateNarrative(plan), true);
});
