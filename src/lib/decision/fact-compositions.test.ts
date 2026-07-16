// Tests du registre de patrons de composition (tables de comportement de la spec §4-5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { composeFacts, buildWinterMildnessEvidence, assertCompositionsValid } from "./fact-compositions.ts";
import { RULE_CHALEUR } from "./materiality-rules.ts";
import { mismatchRuleId } from "./mismatch-rules.ts";
import type { RunResult, RuleEvaluation, ModuleFacts, VerificationFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

const RULE_DOUCEUR = mismatchRuleId("douceur_climat");

function project(prefs: Record<string, number>): UserProject {
  return {
    posture: "recherche",
    parsed: {
      preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })),
      hardConstraints: {},
    },
  } as unknown as UserProject;
}

function chaleurFact(tier: "secondary" | "structuring" = "structuring"): VerificationFact {
  return {
    id: "06004:climat-chaleur", ruleId: RULE_CHALEUR,
    sourceFactIds: ["climat.joursTresChauds", "climat.nuitsTropicales"], module: "territoire",
    role: "verification", materialityTier: tier,
    topic: "les fortes chaleurs à Antibes",
    statement: "Les jours au-dessus de 35 °C augmentent nettement.",
    limitation: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    evidence: [{ factId: "climat.joursTresChauds", module: "territoire", label: "Territoire · Antibes", grain: "commune" }],
    action: { type: "renseigner_adresse", label: "Renseignez une adresse pour évaluer le confort d'été du logement" },
  };
}

function run(evals: RuleEvaluation[]): RunResult {
  return { facts: evals.flatMap((e) => e.facts), evaluations: evals };
}

const douceurSatisfied: RuleEvaluation = {
  ruleId: RULE_DOUCEUR, projectKeys: ["douceur_climat"], outcome: "satisfied", facts: [], reason: "position satisfied",
};
const chaleurEval = (f: VerificationFact): RuleEvaluation => ({
  ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "verification", facts: [f], reason: "exposition notable",
});

const moduleFacts = {
  insee: "06004", nom: "Antibes",
  rankBands: { douceur_climat: { low: 0.9, high: 1 } },
} as unknown as ModuleFacts;

test("tradeoff saisonnier : poids >= 2 des deux côtés, satisfied + fait chaleur émis -> composé", () => {
  const f = chaleurFact();
  const out = composeFacts(run([douceurSatisfied, chaleurEval(f)]), moduleFacts, project({ douceur_climat: 2, faible_chaleur: 3 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "tradeoff");
  if (c.kind !== "tradeoff") return;
  assert.equal(c.materialityTier, "structuring"); // hérité du côté défavorable
  assert.deepEqual(c.absorbedFactIds, [f.id]);
  assert.equal(c.unfavorableSide.action?.label, f.action.label); // invariant 8 : l'action survit
  assert.equal(c.unfavorableSide.limitation, f.limitation); // la limitation reste sur SON côté
  assert.equal(c.favorableSide.factIds.length, 0); // aucun fait fabriqué côté satisfait
  assert.ok(c.favorableSide.evidence.length > 0);
  assert.equal(c.displaySection, "compromises");
});

test("tradeoff : douceur poids 1 ne compose jamais (le silencieux n'est pas repêché)", () => {
  const out = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 1, faible_chaleur: 3 }));
  assert.equal(out.length, 0);
});

test("tradeoff : douceur neutral ne compose pas", () => {
  const neutral: RuleEvaluation = { ...douceurSatisfied, outcome: "neutral" };
  const out = composeFacts(run([neutral, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(out.length, 0);
});

test("tradeoff : aucun fait chaleur émis -> rien (on ne compose que l'affichable seul)", () => {
  const naChaleur: RuleEvaluation = { ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "not_applicable", facts: [], reason: "priorité non déclarée" };
  const out = composeFacts(run([douceurSatisfied, naChaleur]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 1 }));
  assert.equal(out.length, 0);
});

test("tradeoff : bande douceur absente ou corrompue -> pas de composition (invariant 9)", () => {
  const sansBande = { ...moduleFacts, rankBands: null } as unknown as ModuleFacts;
  assert.equal(composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), sansBande, project({ douceur_climat: 3, faible_chaleur: 3 })).length, 0);
  const corrompue = { ...moduleFacts, rankBands: { douceur_climat: { low: 1.4, high: 0.2 } } } as unknown as ModuleFacts;
  assert.equal(composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), corrompue, project({ douceur_climat: 3, faible_chaleur: 3 })).length, 0);
});

test("buildWinterMildnessEvidence : bande -> preuve avec part supérieure et période de référence", () => {
  const e = buildWinterMildnessEvidence(moduleFacts);
  assert.ok(e);
  assert.match(e!.observedValue!, /les 10 % de communes/); // 1 - 0.9 = 0.10
  assert.match(e!.observedValue!, /1976-2005/);
  assert.equal(buildWinterMildnessEvidence({ ...moduleFacts, rankBands: {} } as unknown as ModuleFacts), null);
});

test("assertCompositionsValid : id dupliqué, absorbé inexistant, mauvaise section -> jette", () => {
  const f = chaleurFact();
  const r = run([douceurSatisfied, chaleurEval(f)]);
  const [c] = composeFacts(r, moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.ok(c);
  assert.doesNotThrow(() => assertCompositionsValid(r, [c!]));
  assert.throws(() => assertCompositionsValid(r, [c!, c!])); // id dupliqué + double absorption
  assert.throws(() => assertCompositionsValid(r, [{ ...c!, absorbedFactIds: ["inexistant"] } as never]));
  assert.throws(() => assertCompositionsValid(r, [{ ...c!, displaySection: "mismatches" } as never]));
});
