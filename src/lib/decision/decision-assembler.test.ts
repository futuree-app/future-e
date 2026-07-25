import test from "node:test";
import assert from "node:assert/strict";
import { assembleDossier } from "./decision-assembler.ts";
import type { DecisionFact, RunResult, RuleEvaluation, IncompatibilityFact, AlignmentFact, MismatchFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}
// Les ÉVALUATIONS sont désormais la matière première de la couverture (criteria-registry) : un
// `run` sans évaluation décrit un moteur qui n'a rien regardé, et le dossier le dit honnêtement.
function ev(ruleId: string, keys: string[], outcome: RuleEvaluation["outcome"], facts: DecisionFact[] = []): RuleEvaluation {
  return { ruleId, projectKeys: keys, outcome, facts, reason: "test" };
}
// `covered` n'existe plus dans RunResult (il déclarait « couverte » toute contrainte dont l'outcome
// n'était pas not_applicable, donc un `uncertain` aussi). On garde le paramètre pour ne pas réécrire les
// appels, mais il est IGNORÉ : la couverture se déduit des évaluations.
function run(facts: DecisionFact[], _covered: unknown = [], evaluations: RuleEvaluation[] = []): RunResult {
  return { facts, evaluations };
}
function incompat(over: Partial<IncompatibilityFact> = {}): DecisionFact {
  return { id: "i", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "nearSea", materialityTier: "decision_critical", topic: "la distance au littoral", statement: "trop loin", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], ...over };
}
function verif(id = "v"): DecisionFact {
  return { id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring", topic: "un point à vérifier", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], action: { type: "obtenir_document", label: "doc" } };
}
const WITH_HC = { reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };
const NO_HC = { reformulation: "x", hardConstraints: {}, preferences: [] };

test("parsed null -> project_not_structured", () => {
  const d = assembleDossier(run([]), project(null), "commune", "Toulouse");
  assert.equal(d.conclusionState, "project_not_structured");
  assert.equal(d.sections.length, 0);
});

test("incompatibilité établie -> established_incompatibility, et le verdict le dit", () => {
  const d = assembleDossier(
    run([incompat()], ["nearSea"], [ev("r", ["nearSea"], "incompatible", [incompat()])]),
    project(WITH_HC), "commune", "Toulouse",
  );
  assert.equal(d.conclusionState, "established_incompatibility");
  assert.equal(d.criteria.orientation, "incompatible");
  // Le héros NOMME la CONDITION telle que le lecteur l'a posée (hardConstraintLabel, résolu depuis le
  // projet), et non le `topic` du fait : celui-ci porte le nom de la commune, que le héros nomme déjà.
  assert.match(d.narrativePlan.verdict.headline.text, /Une condition de votre projet n'est pas remplie à Toulouse : la proximité de la mer \(moins de 5 km\)\./);
  assert.equal(d.narrativePlan.verdict.headline.text.includes(incompat().topic), false);
  assert.match(d.conclusion, /trop loin/);
});

test("no_hard_constraint_declared distinct de no_incompatibility_established", () => {
  const sansHC = assembleDossier(run([verif()]), project(NO_HC), "commune", "Toulouse");
  assert.equal(sansHC.conclusionState, "no_hard_constraint_declared");
  const avecHC = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.equal(avecHC.conclusionState, "no_incompatibility_established");
});

test("contrainte déclarée non couverte -> nommée dans uncovered + conclusion", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 }, communeSize: { min: null, max: 20000 } }, preferences: [] });
  // nearSea EXAMINÉE (satisfaite, silencieuse) ; communeSize touchée par personne.
  const d = assembleDossier(run([], ["nearSea"], [ev("r", ["nearSea"], "satisfied")]), p, "commune", "Toulouse");
  assert.deepEqual(d.uncovered.map((u) => u.key), ["communeSize"]);
  // La contrainte est le SUJET de la phrase, nommée comme le lecteur l'a posée.
  assert.match(d.conclusion, /Une commune de moins de 20 000 habitants reste à vérifier/);
});

test("la couverture ne se décrète pas : un `unknown` ne rend PAS une contrainte examinée", () => {
  // run.coveredHardConstraints la disait « couverte » (outcome !== not_applicable). Le registre voit
  // qu'aucune donnée n'a été lue, et la garde dans les non examinées.
  const unknownFact: DecisionFact = { id: "u", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "scoped", materialityTier: "secondary", topic: "une donnée manquante", statement: "?", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] };
  const d = assembleDossier(
    run([unknownFact], ["nearSea"], [ev("r", ["nearSea"], "unknown", [unknownFact])]),
    project(WITH_HC), "commune",
  );
  assert.deepEqual(d.uncovered.map((u) => u.key), ["nearSea"]);
  assert.equal(d.criteria.coverage, "none");
});

test("inconnue bloquante -> insufficient_evidence ; scopée -> non", () => {
  const blocking: DecisionFact = { id: "u", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "blocking", materialityTier: "secondary", topic: "une donnée manquante", statement: "?", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] };
  assert.equal(assembleDossier(run([blocking], ["nearSea"]), project(WITH_HC), "commune", "Toulouse").conclusionState, "insufficient_evidence");
  const scoped = { ...blocking, impact: "scoped" as const };
  assert.equal(assembleDossier(run([scoped], ["nearSea"]), project(WITH_HC), "commune", "Toulouse").conclusionState, "no_incompatibility_established");
});

test("caps : au plus 2 incompatibilités affichées", () => {
  const many = [incompat({ id: "a" }), incompat({ id: "b" }), incompat({ id: "c" })];
  const d = assembleDossier(run(many, ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  const sec = d.sections.find((s) => s.key === "incompatibilities");
  assert.equal(sec!.cards.length, 2);
});

test("titre vérifications adapté à la posture habitant", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC, { posture: "habitant" }), "commune", "Toulouse");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /surveiller/i);
});

test("conclusionBasis porte ruleIds et preuves", () => {
  const d = assembleDossier(run([incompat()], ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.ok(d.conclusionBasis.ruleIds.length >= 1);
  assert.ok(d.conclusionBasis.evidence.length >= 1);
});

test("sans contrainte dure : la conclusion nomme les priorités non couvertes et le fait qui domine", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "air_sain", weight: 3 }] });
  const d = assembleDossier(run([verif()]), p, "commune", "Toulouse");
  assert.equal(d.conclusionState, "no_hard_constraint_declared");
  // Le verdict ne parle plus de « condition absolue » : ne pas en avoir déclaré n'est ni un trou de
  // donnée ni un défaut. La correspondance graduée fonctionne sur les seules préférences.
  assert.equal(d.conclusion.includes("aucune condition"), false);
  assert.match(d.conclusion, /pas encore couvertes/i);
  // Couverture nulle : le héros reste en POSTURE et ne consomme rien de ce registre. Le fait qui domine
  // n'entre plus dans la narration : `conclusion` est le join des blocs RÉDIGÉS, et la démarche à mener
  // est déterministe, hors de ce texte. Elle vit sur le plan, avec l'action verbatim de la carte.
  assert.equal(d.conclusion.includes("Un point à vérifier."), false);
  assert.deepEqual(d.narrativePlan.priorityControl, {
    sourceIds: ["v"], actions: [{ label: "doc", anchorId: "v" }],
  });
  assert.match(d.narrativePlan.verdict.headline.text, /Toulouse/); // la commune est NOMMÉE, jamais « ce lieu »
});

test("le scope SORT des phrases : il vit dans le plan, affiché en tête de carte", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune+adresse", "Toulouse");
  assert.equal(d.narrativePlan.scope, "commune+adresse");
  assert.equal(d.conclusion.includes("À l'échelle de la commune"), false);
});

test("un titre de section porte UNE idée, et dit ce que le lecteur en fait", () => {
  // « Ce qui est établi, à contrôler avant de vous engager » en portait deux, collées par une virgule,
  // et c'était le seul des cinq dans ce cas. Le statut est passé sous le titre, en toutes lettres
  // (SECTION_INTRO) ; le titre garde l'action. « Contrôler » reste le verbe des constats établis,
  // « vérifier » celui du non-examiné.
  const d = assembleDossier(run([verif()]), project(NO_HC), "commune", "Toulouse");
  assert.equal(d.sections.find((s) => s.key === "verifications")!.title, "À contrôler avant de vous engager");
  // Aucun titre ne doit empiler deux propositions : la virgule est le signe qui le trahit.
  for (const s of d.sections) {
    assert.doesNotMatch(s.title, /,/, `le titre « ${s.title} » porte deux idées`);
    assert.ok(s.title.length <= 40, `« ${s.title} » : ${s.title.length} caractères`);
  }
});

test("les réserves annoncées sont les faits AFFICHÉS, jamais les faits émis (caps)", () => {
  // 5 vérifications émises, section plafonnée à 4 : le dossier compte 4, pas 5. Le lecteur doit
  // pouvoir compter les cartes et retomber sur le chiffre, y compris dans le verdict.
  const facts = Array.from({ length: 5 }, (_, i) => verif(`v${i}`));
  const d = assembleDossier(run(facts, ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.equal(d.sections.find((s) => s.key === "verifications")!.cards.length, 4);
  assert.equal(d.narrativePlan.reservesCount, 4);
});

test("le dossier porte le plan narratif, et sa conclusion en est la concaténation", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune", "Toulouse");
  assert.equal(d.conclusion, d.narrativePlan.blocks.map((b) => b.fallbackText).join(" "));
  assert.equal(d.narrativePlan.blocks[0]!.key, "verdict");
  assert.equal(d.narrativePlan.blocks[0]!.generable, false); // le verdict n'est jamais généré
});

// ── Compositions (couche de présentation) ─────────────────────────────────────────────────────────

import type { FactComposition } from "./fact-composition.ts";

function mism(id: string, tier: "secondary" | "structuring" = "structuring"): DecisionFact {
  return {
    id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "mismatch",
    materialityTier: tier, topic: "les espaces naturels", statement: "moins bien servi",
    projectKey: "nature" as never,
    basis: { kind: "relative_position", rankLow: 0.05, rankHigh: 0.1, universe: "communes_france", distributionVersion: "d" },
    evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
  } as DecisionFact;
}
function sharedComp(id: string, absorbed: string[], tier: "secondary" | "structuring"): FactComposition {
  return {
    id, kind: "shared_evidence", patternId: "territory-size-multiple-consequences",
    title: "Une même petite taille", headlineCause: "sa petite taille",
    summary: "Deux priorités touchées pour la même raison.",
    sharedEvidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune", observedValue: "village" }],
    consequences: absorbed.map((fid) => ({ projectKey: "nature" as never, statement: "conséquence", materialityTier: tier, factId: fid })),
    absorbedFactIds: absorbed, referencedRuleIds: ["r"], materialityTier: tier, displaySection: "mismatches",
  };
}
function tradeoffComp(id: string, absorbed: string[], tier: "secondary" | "structuring"): FactComposition {
  return {
    id, kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
    headlineSubject: "l'exposition aux fortes chaleurs",
    summary: "Hivers doux, exposition estivale à arbitrer.",
    favorableSide: { label: "Ce qui correspond", statement: "doux", evidence: [{ factId: "b", module: "territoire", label: "T", grain: "commune", observedValue: "parmi les 10 %" }], ruleIds: ["r"], factIds: [] },
    unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "chaud", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }], ruleIds: ["r"], factIds: absorbed },
    absorbedFactIds: absorbed, referencedRuleIds: ["r"], materialityTier: tier, displaySection: "compromises",
  };
}
// Un run où le ruleId "r" existe (le validateur vérifie les referencedRuleIds).
function runR(facts: DecisionFact[]): RunResult {
  return { facts, evaluations: [ev("r", ["nature"], "mismatch", facts)] };
}
function climateComfortComp(id: string, absorbed: string[], tier: "secondary" | "structuring"): FactComposition {
  return {
    id, kind: "mismatch_with_action", patternId: "climate_comfort",
    title: "Des étés plus difficiles à concilier avec votre projet",
    headlineSubject: "des étés supportables",
    summary: "À Toulouse : jours au-dessus de 35 °C et nuits tropicales en hausse.",
    evidence: [{ factId: "s", module: "territoire", label: "Climat · Toulouse", grain: "commune", observedValue: "9 jours à l'horizon 2050" }],
    action: { type: "renseigner_adresse", label: "Renseignez votre adresse pour descendre au niveau du logement" },
    absorbedFactIds: absorbed, referencedRuleIds: ["r"], materialityTier: tier, displaySection: "mismatches",
  };
}

test("lot D : chaleur mismatch absorbé dans un climate_comfort -> arbitrage, le héros NOMME « des étés supportables », la carte reste dans les mismatches", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const chaleur = { ...mism("ch1"), projectKey: "faible_chaleur" } as DecisionFact;
  const d = assembleDossier(
    run([chaleur], [], [ev("r", ["faible_chaleur"], "mismatch", [chaleur])]),
    p, "commune", "Toulouse",
    [climateComfortComp("31555:composition-confort-ete", ["ch1"], "structuring")],
  );
  assert.equal(d.criteria.orientation, "arbitration");
  assert.equal(d.narrativePlan.verdict.headline.text, "Toulouse répond moins bien à une de vos priorités : des étés supportables.");
  // La carte composée est retrouvable dans la section mismatches, et le fait absorbé a quitté les sections.
  const mismatches = d.sections.find((s) => s.key === "mismatches");
  assert.ok(mismatches!.cards.some((c) => c.kind === "composition" && c.composition.id === "31555:composition-confort-ete"));
  assert.equal(d.sections.flatMap((s) => s.cards).some((c) => c.kind === "fact" && c.fact.id === "ch1"), false);
  assert.deepEqual(d.absorbedFacts.map((f) => f.id), ["ch1"]);
  // Le mismatch nommé n'est pas AUSSI recompté comme une réserve « par ailleurs à contrôler ».
  assert.doesNotMatch(d.narrativePlan.verdict.detail, /par ailleurs à contrôler/);
});

test("lot FEU : le danger d'incendie déclaré -> arbitrage, le héros NOMME l'objet du projet", () => {
  // Le pendant du lot D pour l'incendie, bout en bout : la bascule en mismatch change l'ORIENTATION du
  // dossier (arbitrage, plus « correspondance favorable ») et rend l'enjeu nommable par le héros.
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_feu", weight: 3 }] });
  const feu = { ...mism("feu1"), projectKey: "faible_risque_feu" } as DecisionFact;
  const comp: FactComposition = {
    id: "31555:composition-danger-incendie", kind: "mismatch_with_action", patternId: "wildfire_exposure",
    title: "Un danger d'incendie difficile à concilier avec votre projet",
    headlineSubject: "un environnement peu exposé aux incendies",
    summary: "Les jours où l'indice forêt-météo dépasse 40 augmentent nettement.",
    evidence: [{ factId: "s", module: "territoire", label: "Climat · Toulouse", grain: "commune", observedValue: "50 jours à l'horizon 2050" }],
    action: { type: "verifier_sur_place", label: "Regardez la végétation autour du terrain" },
    absorbedFactIds: ["feu1"], referencedRuleIds: ["r"], materialityTier: "structuring", displaySection: "mismatches",
  };
  const d = assembleDossier(
    run([feu], [], [ev("r", ["faible_risque_feu"], "mismatch", [feu])]),
    p, "commune", "Toulouse", [comp],
  );
  assert.equal(d.criteria.orientation, "arbitration");
  assert.equal(
    d.narrativePlan.verdict.headline.text,
    "Toulouse répond moins bien à une de vos priorités : un environnement peu exposé aux incendies.",
  );
  // Le geste que le mismatch ne peut pas porter est bien à l'écran, sur la carte composée.
  const mismatches = d.sections.find((s) => s.key === "mismatches");
  assert.ok(mismatches!.cards.some((c) => c.kind === "composition" && c.composition.id === comp.id));
  assert.deepEqual(d.absorbedFacts.map((f) => f.id), ["feu1"]);
});

test("compositions : les faits absorbés quittent les sections et vivent dans absorbedFacts", () => {
  const v = verif("v1");
  const d = assembleDossier(runR([v]), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  const allCards = d.sections.flatMap((s) => s.cards);
  assert.equal(allCards.some((c) => c.kind === "fact" && c.fact.id === "v1"), false);
  assert.deepEqual(d.absorbedFacts.map((f) => f.id), ["v1"]);
  const compromises = d.sections.find((s) => s.key === "compromises");
  assert.equal(compromises!.cards[0]!.kind, "composition");
});

test("liste unique triée puis cappée : une composition secondary ne passe jamais devant un fait structurant", () => {
  const facts = [mism("m1"), mism("m2"), mism("m3"), mism("abs", "secondary")];
  const d = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", [sharedComp("c1", ["abs"], "secondary")]);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sec!.cards.length, 3); // cap 3
  assert.ok(sec!.cards.every((c) => c.kind === "fact")); // les 3 structurants passent, la composition secondary non
});

test("à tier égal, la composition passe d'abord", () => {
  const facts = [mism("m1"), mism("abs")];
  const d = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", [sharedComp("c1", ["abs"], "structuring")]);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sec!.cards.length, 2);
  assert.equal(sec!.cards[0]!.kind, "composition");
});

test("le cap s'applique aussi aux compositions", () => {
  const facts = [mism("a1"), mism("a2"), mism("a3"), mism("a4")];
  const comps = ["a1", "a2", "a3", "a4"].map((fid, i) => sharedComp(`c${i}`, [fid], "structuring"));
  const d = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", comps);
  const sec = d.sections.find((s) => s.key === "mismatches");
  assert.equal(sec!.cards.length, 3);
  assert.equal(d.presentation.compositionShown, 3);
});

test("presentation : comptes exacts sur l'affiché", () => {
  const v = verif("v1");
  const d = assembleDossier(runR([v, mism("m1")]), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  assert.equal(d.presentation.compositionShown, 1);
  assert.equal(d.presentation.elementaryFactShown, 1); // m1
  assert.equal(d.presentation.absorbedFactTotal, 1);
});

test("invariant 3 : couverture et orientation identiques avec et sans compositions", () => {
  const v = verif("v1");
  const facts = [v, mism("m1")];
  const sans = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse");
  const avec = assembleDossier(runR(facts), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  assert.equal(avec.criteria.coverage, sans.criteria.coverage);
  assert.equal(avec.criteria.orientation, sans.criteria.orientation);
});

test("conclusionBasis : absorbés dans factIds, preuves et ruleIds des compositions inclus", () => {
  const v = verif("v1");
  const d = assembleDossier(runR([v]), project(WITH_HC), "commune", "Toulouse", [tradeoffComp("c1", ["v1"], "structuring")]);
  assert.ok(d.conclusionBasis.factIds.includes("v1"));
  assert.ok(d.conclusionBasis.ruleIds.includes("r"));
  assert.ok(d.conclusionBasis.evidence.some((e) => e.observedValue === "parmi les 10 %"));
});

// ── Composition grouped_verification (argiles + PPR) dans l'assembleur ──────────────────────────

function groupedComp(id: string, absorbed: string[], tier: "secondary" | "structuring"): FactComposition {
  return {
    id, kind: "grouped_verification", patternId: "clay_regulation_grouped",
    title: "Un sol argileux, et la règle qui l'encadre",
    headlineSubject: "ce qu'impose le sol argileux",
    summary: "Le sol argileux expose le bâti, un plan de prévention encadre les travaux.",
    items: absorbed.map((fid) => ({
      label: "item", statement: "constat", ruleIds: ["r"], factIds: [fid],
      evidence: [{ factId: "s", module: "logement" as const, label: "A", grain: "adresse" as const }],
      action: { type: "verifier_sur_place" as const, label: "Regardez le bâti." },
    })),
    absorbedFactIds: absorbed, referencedRuleIds: ["r"], materialityTier: tier, displaySection: "verifications",
  };
}

test("grouped_verification : une carte en section verifications, comptée comme UNE réserve", () => {
  const facts = [verif("v1"), verif("v2"), verif("v3")];
  // La contrainte déclarée est EXAMINÉE (couverture réelle) : le verdict a le droit de compter.
  const r: RunResult = { facts, evaluations: [ev("r", ["nearSea"], "verification", facts)] };
  const d = assembleDossier(r, project(WITH_HC), "commune+adresse", "Toulouse", [groupedComp("g1", ["v1", "v2"], "structuring")]);
  const sec = d.sections.find((s) => s.key === "verifications")!;
  assert.equal(sec.cards.length, 2); // la carte composée + v3
  assert.equal(sec.cards.some((c) => c.kind === "composition" && c.composition.id === "g1"), true);
  // Le verdict compte l'AFFICHÉ : 1 carte composée + 1 fait = 2 réserves matérielles, jamais 3. Le
  // compte vit dans le héros ; le détail dit ce qu'il implique, sans nommer le tier interne.
  assert.equal(d.narrativePlan.verdict.headline.text, "Deux points restent à contrôler avant de conclure sur Toulouse.");
  // Les preuves des items fondent la conclusion.
  assert.equal(d.conclusionBasis.evidence.some((e) => e.label === "A"), true);
});

test("grouped_verification : candidate au lead comme le tradeoff (elle porte des réserves)", () => {
  const d = assembleDossier(runR([verif("v1"), verif("v2")]), project(WITH_HC), "commune+adresse", "Toulouse", [groupedComp("g1", ["v1", "v2"], "structuring")]);
  const lead = d.narrativePlan.lead;
  assert.equal(lead.kind, "single");
  if (lead.kind !== "single") return;
  assert.equal(lead.factId, "g1");
  assert.equal(lead.topic, "Un sol argileux, et la règle qui l'encadre");
});

// UN SEUL MOT POUR UNE SEULE CHOSE. « Condition » est le mot du lexique tranché : le verdict dit
// « Condition non respectée », le bloc des non examinées « Condition à vérifier », le héros « une
// condition de votre projet n'est pas remplie ». Le titre de section disait encore « contrainte », à
// trois centimètres du héros. Aucun test ne le tenait, et le passage de contrainte -> condition dans
// le verdict avait laissé cet écart derrière lui.
test("le vocabulaire de l'écran ne mélange pas « condition » et « contrainte »", () => {
  const d = assembleDossier(
    run([incompat()], ["nearSea"], [ev("r", ["nearSea"], "incompatible", [incompat()])]),
    project(WITH_HC), "commune", "Toulouse",
  );
  assert.equal(d.sections.find((s) => s.key === "incompatibilities")!.title, "Vos conditions non négociables");
  for (const s of d.sections) {
    assert.doesNotMatch(s.title, /contrainte/i, `le titre « ${s.title} » emploie « contrainte »`);
  }
  assert.doesNotMatch(d.narrativePlan.verdictLabel, /contrainte/i);
  assert.doesNotMatch(d.narrativePlan.verdict.headline.text, /contrainte/i);
});

// ── Lot C : la carte « Ce qui correspond » (alignments) ─────────────────────────

function align(over: Partial<AlignmentFact> = {}): DecisionFact {
  return {
    id: "a", ruleId: "territoire.alignment-acces_soins", sourceFactIds: ["relativePosition.acces_soins"],
    module: "territoire", role: "alignment", projectKey: "acces_soins", materialityTier: "structuring",
    topic: "l'accès aux soins", headlineSubject: "l'accès aux soins",
    statement: "Parmi les 10 % de communes où il est le plus favorable en France",
    basis: { kind: "relative_position", rankLow: 0.9, rankHigh: 0.99, universe: "communes_france", distributionVersion: "v" },
    evidence: [{ factId: "relativePosition.acces_soins", module: "territoire", label: "Territoire", grain: "commune", href: "/rapport/quartier" }],
    ...over,
  } as DecisionFact;
}
function mismatch(over: Partial<MismatchFact> = {}): DecisionFact {
  return {
    id: "m", ruleId: "territoire.mismatch-cadre_calme", sourceFactIds: ["relativePosition.cadre_calme"],
    module: "territoire", role: "mismatch", projectKey: "cadre_calme", materialityTier: "structuring",
    topic: "le cadre calme", headlineSubject: "le calme", statement: "moins bien",
    basis: { kind: "relative_position", rankLow: 0.02, rankHigh: 0.1, universe: "communes_france", distributionVersion: "v" },
    evidence: [{ factId: "relativePosition.cadre_calme", module: "territoire", label: "Territoire", grain: "commune", observedValue: "20 %" }],
    ...over,
  } as DecisionFact;
}
const PREFS = { reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_soins", weight: 3 }, { key: "cadre_calme", weight: 3 }] };

test("alignment + mismatch : la carte « Ce qui correspond » s'affiche AVANT « Ce qui correspond moins bien »", () => {
  const d = assembleDossier(
    run([align(), mismatch()], [], [ev("territoire.alignment-acces_soins", ["acces_soins"], "satisfied", [align()]), ev("territoire.mismatch-cadre_calme", ["cadre_calme"], "mismatch", [mismatch()])]),
    project(PREFS), "commune", "Toulouse",
  );
  const keys = d.sections.map((s) => s.key);
  assert.ok(keys.includes("alignments"), "la section alignments existe");
  assert.ok(keys.indexOf("alignments") < keys.indexOf("mismatches"), "alignments avant mismatches");
  assert.equal(d.sections.find((s) => s.key === "alignments")!.title, "Ce qui correspond à votre projet");
});

test("incompatibilité + alignment : les incompatibilités priment, l'alignment vient juste après", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [{ key: "acces_soins", weight: 3 }] });
  const d = assembleDossier(
    run([incompat(), align()], ["nearSea"], [ev("r", ["nearSea"], "incompatible", [incompat()]), ev("territoire.alignment-acces_soins", ["acces_soins"], "satisfied", [align()])]),
    p, "commune", "Toulouse",
  );
  const keys = d.sections.map((s) => s.key);
  assert.ok(keys.indexOf("incompatibilities") < keys.indexOf("alignments"), "incompatibilités avant alignment");
});

test("cap à 3 : quatre alignments -> trois cartes", () => {
  const quatre = ["acces_soins", "vie_locale", "cadre_calme", "nature"].map((k, i) =>
    align({ id: `a${i}`, ruleId: `territoire.alignment-${k}`, projectKey: k as AlignmentFact["projectKey"] }));
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: quatre.map((_, i) => ({ key: ["acces_soins", "vie_locale", "cadre_calme", "nature"][i], weight: 3 })) });
  const d = assembleDossier(run(quatre, [], quatre.map((f) => ev(f.ruleId, [(f as AlignmentFact).projectKey], "satisfied", [f]))), p, "commune", "Toulouse");
  assert.equal(d.sections.find((s) => s.key === "alignments")!.cards.length, 3);
});

test("conclusionBasis porte les alignments affichés", () => {
  const d = assembleDossier(run([align()], [], [ev("territoire.alignment-acces_soins", ["acces_soins"], "satisfied", [align()])]), project(PREFS), "commune", "Toulouse");
  assert.ok(d.conclusionBasis.factIds.includes("a"));
});

// ── Le compte annoncé par le verdict vise la SECTION « À contrôler » ─────────────

test("un COMPROMIS n'est pas un « constat à contrôler » : il a sa propre section", () => {
  // Vu à l'écran sur Aix-en-Provence : « Un constat reste par ailleurs à contrôler » sous un dossier
  // qui n'affichait aucune section « À contrôler ». Le compromis vit dans « Ce qui départage vraiment ».
  const c = {
    id: "c1", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "compromise",
    materialityTier: "structuring", topic: "une tension", statement: "Deux priorités s'opposent.",
    sides: [
      { projectKey: "acces_transports", statement: "a", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] },
      { projectKey: "faible_chaleur", statement: "b", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }] },
    ],
  } as unknown as DecisionFact;
  const d = assembleDossier(run([c], [], [ev("r", ["acces_transports"], "compromise", [c])]), project(NO_HC), "commune", "Toulouse");
  assert.ok(d.sections.some((s) => s.key === "compromises"));
  assert.equal(d.sections.some((s) => s.key === "verifications"), false);
  assert.doesNotMatch(d.narrativePlan.verdict.detail, /à contrôler/);
});

test("une INCONNUE n'est pas un « constat à contrôler » non plus", () => {
  const u = {
    id: "u1", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "unknown", impact: "scoped",
    materialityTier: "secondary", topic: "une donnée", statement: "La donnée n'est pas disponible.",
    evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
  } as unknown as DecisionFact;
  const d = assembleDossier(run([u], [], [ev("r", ["nature"], "unknown", [u])]), project(NO_HC), "commune", "Toulouse");
  assert.ok(d.sections.some((s) => s.key === "unknowns"));
  assert.doesNotMatch(d.narrativePlan.verdict.detail, /à contrôler/);
});

test("une VERIFICATION, elle, est bien annoncée (le compte reste juste)", () => {
  const d = assembleDossier(run([verif("v1")], [], [ev("r", ["nature"], "verification", [verif("v1")])]), project(NO_HC), "commune", "Toulouse");
  assert.ok(d.sections.some((s) => s.key === "verifications"));
  assert.equal(d.narrativePlan.reservesCount, 1);
});
