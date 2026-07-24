import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import { conditionPorteeParLeBloc, sectionsAffichees, factsNonNarresParLaFace } from "./dossier-view.ts";
import type { DecisionFact, RunResult, RuleEvaluation, Dossier } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z" };
}
function ev(ruleId: string, keys: string[], outcome: RuleEvaluation["outcome"], facts: DecisionFact[] = []): RuleEvaluation {
  return { ruleId, projectKeys: keys, outcome, facts, reason: "test" };
}
function incompat(over: Partial<DecisionFact> = {}): DecisionFact {
  return {
    id: "i", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "incompatibility",
    evidenceStrength: "established", hardConstraintKey: "nearSea", materialityTier: "decision_critical",
    topic: "la distance au littoral", statement: "La mer est à 240 km, au-delà de la limite de 5 km que vous avez posée.",
    evidence: [{ factId: "s", module: "territoire", label: "Territoire", grain: "commune", observedValue: "240 km" }],
    ...over,
  } as DecisionFact;
}
function verif(id = "v"): DecisionFact {
  return {
    id, ruleId: "rv", sourceFactIds: ["s"], module: "territoire", role: "verification",
    materialityTier: "structuring", topic: "un point à vérifier", statement: "à vérifier",
    evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
    action: { type: "obtenir_document", label: "doc" },
  } as DecisionFact;
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };

function dossierAvec(facts: DecisionFact[]) {
  const run: RunResult = { facts, evaluations: [ev("r", ["nearSea"], "incompatible", facts)] };
  return assembleDossier(run, project(WITH_HC), "commune", "Toulouse");
}

test("une seule condition établie : le bloc la porte, sa section ne s'affiche pas", () => {
  const d = dossierAvec([incompat()]);
  // Le détail du verdict EST le constat du fait : c'est ce qui rendait la section redondante.
  assert.equal(d.narrativePlan.verdict.detail, incompat().statement);
  assert.equal(conditionPorteeParLeBloc(d)?.id, "i");
  assert.equal(sectionsAffichees(d).some((s) => s.key === "incompatibilities"), false);
});

test("le fait RESTE dans le dossier : on masque une carte, on ne retire pas un fait", () => {
  const d = dossierAvec([incompat()]);
  // La règle est de présentation. La preuve, la base de conclusion et l'état ne bougent pas.
  assert.equal(d.sections.some((s) => s.key === "incompatibilities"), true);
  assert.equal(d.conclusionBasis.factIds.includes("i"), true);
  assert.equal(d.conclusionState, "established_incompatibility");
});

test("deux conditions : la section reprend son rôle, le bloc n'en nomme qu'une", () => {
  const d = dossierAvec([incompat(), incompat({ id: "i2", statement: "Autre condition non remplie." })]);
  assert.equal(conditionPorteeParLeBloc(d), null);
  assert.equal(sectionsAffichees(d).some((s) => s.key === "incompatibilities"), true);
});

test("une condition INDICATIVE n'est pas celle que le héros nomme : sa section reste", () => {
  // `establishedIncompatibility` filtre sur evidenceStrength : le bloc ne porte pas ce constat, donc
  // la carte ne répète rien.
  const d = dossierAvec([incompat({ evidenceStrength: "indicative" })]);
  assert.equal(conditionPorteeParLeBloc(d), null);
  assert.equal(sectionsAffichees(d).some((s) => s.key === "incompatibilities"), true);
});

test("sans condition : toutes les sections s'affichent, rien n'est masqué", () => {
  const run: RunResult = { facts: [verif()], evaluations: [ev("rv", ["nearSea"], "verification", [verif()])] };
  const d = assembleDossier(run, project(WITH_HC), "commune", "Toulouse");
  assert.equal(conditionPorteeParLeBloc(d), null);
  assert.deepEqual(sectionsAffichees(d).map((s) => s.key), d.sections.map((s) => s.key));
});

// ── Le mismatch de taille que le verdict porte déjà ──────────────────────────────
//
// Le lecteur peut poser DEUX critères sur la même dimension : une contrainte dure communeSize (une
// fourchette) ET une priorité souple symétrique (eviter_grandes_villes / prefere_grande_ville). Quand
// la contrainte dure est établie incompatible, elle porte le verdict avec le même chiffre et la même
// conclusion. La carte mismatch de taille redit alors mot pour mot ce que le héros vient de dire.

const WITH_SIZE = {
  reformulation: "x",
  hardConstraints: { communeSize: { min: 25_000, max: 100_000 } },
  preferences: [{ key: "eviter_grandes_villes", weight: 2 }, { key: "eviter_isolement", weight: 2 }],
};

function sizeIncompat(over: Partial<DecisionFact> = {}): DecisionFact {
  return incompat({
    hardConstraintKey: "communeSize",
    topic: "la taille de l'agglomération de Toulouse",
    statement: "L'agglomération à laquelle appartient Toulouse compte 1 063 235 habitants, au-dessus des 100 000 que vous avez posés comme limite.",
    ...over,
  });
}
function sizeMismatch(over: Partial<DecisionFact> = {}): DecisionFact {
  return {
    id: "m", ruleId: "rm", sourceFactIds: ["territorySize.classification"], module: "territoire",
    role: "mismatch", projectKey: "eviter_grandes_villes", materialityTier: "structuring",
    topic: "la taille du territoire", headlineSubject: "une ville à taille humaine", status: "Une métropole",
    statement: "Vous avez placé le fait d'éviter les grandes villes parmi vos priorités. Toulouse appartient à une métropole.",
    basis: { kind: "categorical_state", observedCategory: "metropole", conventionId: "agglomeration-size-v1" },
    evidence: [{ factId: "territorySize.classification", module: "territoire", label: "Territoire · Toulouse", grain: "unite_urbaine", observedValue: "une métropole" }],
    ...over,
  } as DecisionFact;
}
function dossierTaille(facts: DecisionFact[]) {
  const run: RunResult = {
    facts,
    evaluations: [
      ev("rhc", ["communeSize"], "incompatible", facts.filter((f) => f.role === "incompatibility")),
      ev("rm", ["eviter_grandes_villes"], "mismatch", facts.filter((f) => f.role === "mismatch")),
    ],
  };
  return assembleDossier(run, project(WITH_SIZE), "commune", "Toulouse");
}

test("taille : la fourchette établie porte le verdict, le mismatch symétrique ne se réaffiche pas", () => {
  const d = dossierTaille([sizeIncompat(), sizeMismatch()]);
  // La seule carte mismatch était celle de taille : la section disparaît une fois masquée.
  assert.equal(sectionsAffichees(d).some((s) => s.key === "mismatches"), false);
  // Mais le fait RESTE dans le dossier : on masque une carte, on ne retire pas un fait.
  assert.equal(d.sections.some((s) => s.key === "mismatches"), true);
  assert.equal(d.conclusionBasis.factIds.includes("m"), true);
});

test("taille : le mismatch ASYMÉTRIQUE (eviter_isolement) n'est jamais masqué — il porte sa propre limite", () => {
  const isolement = sizeMismatch({
    id: "m2", projectKey: "eviter_isolement", headlineSubject: "le fait de ne pas être isolé",
    limitation: "Cela ne permet pas de conclure à un isolement effectif.",
  });
  const d = dossierTaille([sizeIncompat(), isolement]);
  const mismatches = sectionsAffichees(d).find((s) => s.key === "mismatches");
  assert.equal(mismatches?.cards.length, 1);
});

test("taille : sans incompatibilité de taille établie, le mismatch symétrique s'affiche normalement", () => {
  const run: RunResult = {
    facts: [sizeMismatch()],
    evaluations: [ev("rm", ["eviter_grandes_villes"], "mismatch", [sizeMismatch()])],
  };
  const d = assembleDossier(run, project(WITH_SIZE), "commune", "Toulouse");
  assert.equal(sectionsAffichees(d).some((s) => s.key === "mismatches"), true);
});

// ── Le dépliable d'une composition ──────────────────────────────────────────────

function absorbe(id: string): DecisionFact {
  return {
    id, ruleId: "r", sourceFactIds: [], module: "territoire", role: "verification",
    materialityTier: "structuring", topic: "un sujet", statement: "un constat",
    evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
    action: { type: "obtenir_document", label: "doc" },
  } as DecisionFact;
}

test("les trois patrons narrent leurs absorbés : le dépliable n'a plus rien à montrer", () => {
  const tradeoff = {
    kind: "tradeoff",
    favorableSide: { factIds: [] }, unfavorableSide: { factIds: ["a"] },
  } as unknown as FactComposition;
  assert.deepEqual(factsNonNarresParLaFace(tradeoff, [absorbe("a")]), []);

  const grouped = {
    kind: "grouped_verification",
    items: [{ factIds: ["a"] }, { factIds: ["b"] }],
  } as unknown as FactComposition;
  assert.deepEqual(factsNonNarresParLaFace(grouped, [absorbe("a"), absorbe("b")]), []);

  const shared = {
    kind: "shared_evidence",
    consequences: [{ factId: "a" }, { factId: "b" }],
  } as unknown as FactComposition;
  assert.deepEqual(factsNonNarresParLaFace(shared, [absorbe("a"), absorbe("b")]), []);
});

test("un fait absorbé SANS être narré revient au dépliable", () => {
  // Le jour où un patron absorbe un fait sans le montrer sur sa face, le dépliable le reprend seul :
  // c'est ce qui garde l'invariant d'audit vrai sans le payer en redites.
  const shared = { kind: "shared_evidence", consequences: [{ factId: "a" }] } as unknown as FactComposition;
  assert.deepEqual(factsNonNarresParLaFace(shared, [absorbe("a"), absorbe("muet")]).map((f) => f.id), ["muet"]);
});

// ── Lot C : absorption d'affichage d'un alignment par un tradeoff affiché ────────

function dossierAlignmentTradeoff(compositions: FactComposition[]): Dossier {
  const carte = { kind: "fact" as const, fact: { id: "al", role: "alignment", projectKey: "douceur_climat" } as unknown as DecisionFact };
  return {
    sections: [{ key: "alignments", title: "Ce qui correspond à votre projet", cards: [carte] }],
    compositions,
  } as unknown as Dossier;
}

test("alignment absorbé par le côté favorable d'un tradeoff AFFICHÉ : la carte est masquée, le fait reste", () => {
  const tradeoff = { kind: "tradeoff", favorableProjectKey: "douceur_climat" } as unknown as FactComposition;
  const d = dossierAlignmentTradeoff([tradeoff]);
  // La seule carte alignment est absorbée : la section disparaît.
  assert.equal(sectionsAffichees(d).some((s) => s.key === "alignments"), false);
  // Mais le fait RESTE dans le dossier canonique (shown, conclusionBasis, verdict).
  assert.equal(d.sections.some((s) => s.key === "alignments"), true);
});

test("alignment NON absorbé si aucune composition affichée ne porte sa clé (ex. tradeoff plafonné)", () => {
  const d = dossierAlignmentTradeoff([]); // dossier.compositions = les cartes retenues ; vide = rien n'absorbe
  assert.equal(sectionsAffichees(d).some((s) => s.key === "alignments"), true);
});

test("alignment NON absorbé si le tradeoff affiché porte une AUTRE clé favorable", () => {
  const autre = { kind: "tradeoff", favorableProjectKey: "ensoleillement_recherche" } as unknown as FactComposition;
  const d = dossierAlignmentTradeoff([autre]);
  assert.equal(sectionsAffichees(d).some((s) => s.key === "alignments"), true);
});
