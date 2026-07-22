import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionPlan, shouldGenerateNarrative, rankLeadCandidates, HEADLINE_MAX_CHARS, type ConclusionPlanInput } from "./conclusion-plan.ts";
import type { DecisionFact, MaterialityTier } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";

function verification(id: string, tier: MaterialityTier, statement = `constat ${id}`, topic = `sujet ${id}`): DecisionFact {
  return {
    id, ruleId: `rule-${id}`, sourceFactIds: [], module: "logement", statement, topic,
    materialityTier: tier, role: "verification",
    evidence: [{ factId: id, module: "logement", label: "DPE", observedValue: "F", grain: "adresse" }],
    action: { type: "verifier_sur_place", label: "Vérifier sur place" },
  };
}

function mismatchFact(id: string, tier: MaterialityTier, key: string, subject: string, topic = `sujet ${id}`): DecisionFact {
  return {
    id, ruleId: `territoire.mismatch-${key}`, sourceFactIds: [], module: "territoire",
    statement: `constat ${id}`, topic, headlineSubject: subject, materialityTier: tier, role: "mismatch",
    projectKey: key as never,
    basis: { kind: "relative_position", rankLow: 0.02, rankHigh: 0.08, universe: "communes_france", distributionVersion: "test" },
    evidence: [{ factId: id, module: "territoire", label: "Territoire", grain: "commune" }],
  };
}

function baseInput(over: Partial<ConclusionPlanInput> = {}): ConclusionPlanInput {
  return {
    scope: "commune",
    communeNom: "Toulouse",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    shownFacts: [],
    shownCompositions: [],
    uncovered: [],
    uncoveredPriorities: [],
    establishedIncompatibility: null,
    coverage: "partial",
    orientation: "minor_reserves",
    hasFavorable: true,
    favorableCount: 1,
    majorReserveCount: 0,
    reservesShown: 0,
    mismatchTotal: 0,
    mismatchShown: 0,
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
  assert.equal(plan.reservesCount, 2); // le DÉCOMPTE vit désormais dans l'intertitre des cartes
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

test("lead single : le repli NOMME le fait qui domine, sans exiger de nombre", () => {
  // Le décompte est parti dans l'intertitre des cartes. Ce bloc ne garde que le POIDS.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "decision_critical", "Le logement porte une étiquette énergétique F"),
      verification("f2", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(bloc.fallbackText, /étiquette énergétique F/);
  assert.deepEqual(bloc.requiredPhrases, []);
  assert.deepEqual(bloc.allowedNumbers, []);
});

test("allowedNumbers : le compte VRAI du registre, en chiffres ET en lettres", () => {
  // L'invariant est « aucun nombre faux », pas « aucun nombre absent du repli » : « deux priorités »
  // est exact quand il y en a deux, et le rejeter censurerait une tournure française naturelle.
  const plan = buildConclusionPlan(baseInput({
    uncoveredPriorities: [AIR, { key: "agriculture", label: "l'agriculture" }],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "uncovered_priorities")!.allowedNumbers, ["2", "deux"]);
});

test("lead tied : la TÊTE reste comptée à part, et le total n'apparaît que porté par la relation", () => {
  // `tied` dit que plusieurs faits partagent le rang MAXIMAL, pas que toutes les réserves pèsent
  // pareil : ici deux dominent et deux sont secondaires. « 4 points d'un poids comparable » serait
  // faux ; « Parmi ces quatre points, deux pèsent le plus » est vrai, et c'est la seule forme sous
  // laquelle le total a le droit d'apparaître ici.
  const plan = buildConclusionPlan(baseInput({
    reservesShown: 4,
    shownFacts: [
      verification("f1", "decision_critical"), verification("f2", "decision_critical"),
      verification("f3", "secondary"), verification("f4", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(plan.reservesCount, 4);
  assert.match(bloc.fallbackText, /^Parmi ces quatre points, deux pèsent le plus : /);
  assert.deepEqual(bloc.allowedNumbers, ["2", "deux", "4", "quatre"]);
});

test("lead tied : quand le verdict annonce plus de points, la phrase porte la relation « N parmi M »", () => {
  // Le verdict dit « 4 points restent à vérifier », la strate en nommait 3 : le lecteur lisait une
  // contradiction (les 3 sont un sous-ensemble, rien ne le disait). La phrase porte la relation.
  const plan = buildConclusionPlan(baseInput({
    reservesShown: 4,
    shownFacts: [
      verification("f1", "structuring", "s1", "l'exposition de Toulouse à l'inondation"),
      verification("f2", "structuring", "s2", "le retrait-gonflement des argiles"),
      verification("f3", "structuring", "s3", "un plan de prévention des risques"),
      verification("f4", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(bloc.fallbackText, /^Parmi ces quatre points, trois pèsent le plus : /);
  assert.deepEqual(bloc.allowedNumbers, ["3", "trois", "4", "quatre"]);
  // À égalité de comptes (tous au rang max), la phrase actuelle reste : il n'y a pas de relation à porter.
  const egal = buildConclusionPlan(baseInput({
    reservesShown: 2,
    shownFacts: [verification("f1", "structuring", "s1", "sujet un"), verification("f2", "structuring", "s2", "sujet deux")],
  }));
  assert.match(egal.blocks.find((b) => b.key === "reserves_found")!.fallbackText, /^Deux points demandent votre attention : /);
});

test("lead tied : les faits de tête sont NOMMÉS par leur SUJET, et leur constat n'est PAS recopié", () => {
  // Deux défauts corrigés d'un coup : la carte annonçait « 3 points à égalité » sans en citer un seul
  // (elle parlait d'elle-même) ; puis, en citant les constats entiers, elle redisait mot pour mot les
  // cartes du dessous. Elle NOMME, les cartes DÉMONTRENT.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "structuring", "L'exposition de la commune à l'inondation ressort élevée. 19 arrêtés depuis 1982.", "l'exposition de Toulouse à l'inondation"),
      verification("f2", "structuring", "À cette adresse, le sol est exposé au retrait-gonflement des argiles (aléa moyen ou fort).", "le retrait-gonflement des argiles"),
      verification("f3", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(bloc.fallbackText, /l'exposition de Toulouse à l'inondation/);
  assert.match(bloc.fallbackText, /le retrait-gonflement des argiles/);
  assert.equal(bloc.fallbackText.includes("19 arrêtés"), false);   // le détail reste à la carte
  assert.equal(bloc.fallbackText.includes("aléa moyen"), false);
  assert.deepEqual(bloc.sourceIds, ["f1", "f2"]); // les faits de tête, pas la réserve secondaire
  // Chaque sujet doit SURVIVRE à la rédaction : « des risques naturels » les avalerait tous les deux.
  assert.deepEqual(bloc.requiredPhrases, [
    "exposition de Toulouse à l'inondation",
    "retrait-gonflement des argiles",
  ]);
});

test("lead none : le bloc des réserves N'EXISTE PAS (il n'aurait plus rien à dire)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "secondary"), verification("f2", "secondary")],
  }));
  assert.equal(plan.lead.kind, "none");
  assert.equal(plan.blocks.some((b) => b.key === "reserves_found"), false);
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
    kind: "single", factId: "f1", topic: "sujet f1", statement: "constat f1",
    materialityTier: "decision_critical",
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
  assert.deepEqual(plan.lead, {
    kind: "tied",
    facts: [{ factId: "f1", topic: "sujet f1" }, { factId: "f2", topic: "sujet f2" }],
    materialityTier: "decision_critical",
  });
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
    orientation: "incompatible",
    establishedIncompatibility: { factId: "i1", statement: "504 078 habitants, au-delà de 20 000." },
  }));
  assert.match(plan.blocks[0]!.fallbackText, /504 078 habitants/);
  assert.deepEqual(plan.blocks[0]!.sourceIds, ["i1"]);
  assert.equal(plan.blocks[0]!.generable, false);
});

// ── La table de vérité du verdict (slice 2.1) ──────────────────────────────────
// Le déterministe gagne le droit de dire qu'un lieu correspond, à condition de pouvoir le prouver.

test("high + favorable : le lieu correspond, et on ose le dire", () => {
  const p = buildConclusionPlan(baseInput({ coverage: "high", orientation: "favorable", hasFavorable: true, favorableCount: 3 }));
  assert.equal(p.verdictLabel, "Bonne correspondance");
  assert.equal(p.verdictTone, "positive");
  assert.match(p.verdict.headline.text, /^Toulouse semble bien correspondre à votre projet/);
});

test("high + major_reserves AVEC 2 favorables : « plusieurs dimensions » est prouvé", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: true, favorableCount: 2, majorReserveCount: 2,
  }));
  assert.match(p.blocks[0]!.fallbackText, /^Toulouse répond à plusieurs dimensions de votre projet/);
  assert.match(p.blocks[0]!.fallbackText, /2 points structurants empêchent/);
});

test("high + major_reserves avec UN SEUL favorable : « plusieurs dimensions » serait faux", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: true, favorableCount: 1, majorReserveCount: 1,
  }));
  assert.equal(p.blocks[0]!.fallbackText.includes("plusieurs dimensions"), false);
  assert.match(p.blocks[0]!.fallbackText, /présente des éléments favorables/);
  assert.match(p.blocks[0]!.fallbackText, /1 point structurant empêche/); // accord au SINGULIER
});

test("high + major_reserves SANS favorable : aucun positif n'est promis", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 1,
  }));
  assert.equal(p.blocks[0]!.fallbackText.includes("répond à plusieurs dimensions"), false);
  assert.equal(p.blocks[0]!.fallbackText.includes("éléments favorables"), false);
  assert.match(p.blocks[0]!.fallbackText, /1 point structurant empêche encore de considérer/);
});

test("high + minor_reserves SANS favorable : aucun « bien correspondre » ne s'échappe", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0, reservesShown: 2,
  }));
  const tout = `${p.verdict.headline.text} ${p.blocks[0]!.fallbackText}`;
  assert.equal(tout.includes("bien correspondre"), false);
  assert.match(p.verdict.headline.text, /reste à confirmer/);
  assert.match(p.blocks[0]!.fallbackText, /2 constats restent à contrôler/);
});

test("partial + minor_reserves SANS favorable : rien ne « va dans le sens » de rien", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "partial", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0, reservesShown: 1,
  }));
  assert.equal(p.blocks[0]!.fallbackText.includes("va plutôt dans le sens"), false);
  assert.match(p.blocks[0]!.fallbackText, /Un constat reste à contrôler/); // accord au SINGULIER
});

test("partial + major_reserves : l'écran actuel, et il est honnête", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "partial", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 2,
  }));
  assert.equal(p.verdictLabel, "Lecture encore partielle");
  assert.equal(p.verdictTone, "caution");
  assert.match(p.verdict.headline.text, /encore trop tôt pour dire que Toulouse correspond/);
  assert.match(p.blocks[0]!.fallbackText, /2 points structurants demandent attention/);
});

test("couverture none : le GARDE-FOU, aucun positif ne s'échappe", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "none", orientation: "indeterminate", hasFavorable: false, favorableCount: 0,
  }));
  assert.equal(p.verdictLabel, "Lecture non disponible");
  assert.match(p.verdict.headline.text, /^Toulouse ne peut pas encore être évalué au regard de vos critères/);
  assert.equal(`${p.verdict.headline.text} ${p.blocks[0]!.fallbackText}`.includes("va dans le sens"), false);
});

test("incompatibilité : la condition non respectée EST la réponse", () => {
  const p = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility", orientation: "incompatible",
    establishedIncompatibility: { factId: "f1", statement: "Cette commune est à 180 km du littoral.", topic: "la proximité de la mer" },
  }));
  assert.equal(p.verdictLabel, "Condition non respectée");
  assert.equal(p.verdictTone, "critical");
  assert.match(p.verdict.headline.text, /Une contrainte de votre projet n'est pas satisfaite à Toulouse : la proximité de la mer/);
  assert.match(p.blocks[0]!.fallbackText, /180 km du littoral/);
});

test("le verdict reste NON générable, quelle que soit la case", () => {
  const p = buildConclusionPlan(baseInput({ coverage: "high", orientation: "favorable" }));
  assert.equal(p.blocks[0]!.generable, false);
});

test("le scope SORT des phrases : il vit en tête de carte, plus en préambule du verdict", () => {
  const p = buildConclusionPlan(baseInput({ scope: "commune+adresse" }));
  assert.equal(p.scope, "commune+adresse");
  assert.equal(p.blocks[0]!.fallbackText.includes("À l'échelle de la commune"), false);
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

test("gate : verdict + deux réserves dont une domine -> non (UN registre, rien à articuler)", () => {
  // La règle est « plusieurs éléments DÉJÀ HIÉRARCHISÉS à articuler », jamais « du texte à embellir ».
  // Un seul registre rédigeable n'articule rien : le déterministe le dit très bien tout seul.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "secondary")],
  }));
  assert.equal(plan.blocks.filter((b) => b.generable).length, 1);
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : verdict + trois réserves secondaires -> non (aucun registre : le lead est none)", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "secondary"), verification("f2", "secondary"), verification("f3", "secondary"),
    ],
  }));
  assert.equal(shouldGenerateNarrative(plan), false);
});

test("gate : une réserve qui domine + une contrainte non examinée -> oui (DEUX registres)", () => {
  const plan = buildConclusionPlan(baseInput({
    uncovered: [MER], shownFacts: [verification("f1", "decision_critical"), verification("f2", "secondary")],
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

test("verdict arbitration : compte le TOTAL, pas l'affiché, et porte le double registre", () => {
  const seul = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 5, mismatchShown: 3, reservesShown: 0 }));
  const v = seul.blocks.find((b) => b.key === "verdict")!;
  assert.match(v.fallbackText, /arbitr/i);
  assert.match(v.fallbackText, /5 de vos priorités/);
  const mixte = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 2, mismatchShown: 2, reservesShown: 2 }));
  // Les réserves sont à CONTRÔLER (constats établis), la contrainte non examinée est à vérifier.
  assert.match(mixte.blocks.find((b) => b.key === "verdict")!.fallbackText, /à contrôler/i);
});

test("verdict arbitration : nomme le côté favorable PROUVÉ (un demi-arbitrage ne suffit pas)", () => {
  // Aucun mismatch AFFICHÉ ici (shownFacts vide) : le héros reste en posture, et le détail porte le
  // total émis, avec le côté favorable quand il est PROUVÉ.
  const plusieurs = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 2, mismatchShown: 2, hasFavorable: true, favorableCount: 3 }));
  const vp = plusieurs.blocks.find((b) => b.key === "verdict")!;
  assert.equal(plusieurs.verdict.headline.kind, "posture");
  assert.match(vp.fallbackText, /répond à plusieurs dimensions de votre projet/);
  assert.match(vp.fallbackText, /nettement moins bien servies/);
  const un = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 2, mismatchShown: 2, hasFavorable: true, favorableCount: 1 }));
  assert.match(un.blocks.find((b) => b.key === "verdict")!.fallbackText, /présente un élément favorable pour votre projet/);
  // Sans favorable prouvé, aucune promesse : le texte reste celui de l'absence d'incompatibilité.
  const aucun = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 2, mismatchShown: 2, hasFavorable: false, favorableCount: 0 }));
  const va = aucun.blocks.find((b) => b.key === "verdict")!;
  assert.match(va.fallbackText, /^Aucune incompatibilité n'a été établie à Toulouse/);
  assert.doesNotMatch(`${aucun.verdict.headline.text} ${va.fallbackText}`, /favorable|répond à/);
});

test("verdict neutral : ni « bien correspondre » ni « impossible de conclure »", () => {
  const v = buildConclusionPlan(baseInput({ orientation: "neutral", mismatchTotal: 0, mismatchShown: 0 })).blocks.find((b) => b.key === "verdict")!;
  assert.doesNotMatch(v.fallbackText, /bien correspond|impossible/i);
  assert.match(v.fallbackText, /ni favorablement ni défavorablement|aucun écart notable/i);
});

// ── Compositions dans le plan (registre compositions_found + lead tradeoff) ──────────────────────

import { buildConclusionHash } from "./conclusion-hash.ts";
import type { FactComposition } from "./fact-composition.ts";

function tradeoff(tier: MaterialityTier = "structuring"): FactComposition {
  return {
    id: "06004:composition-climat-saisons", kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
    summary: "Les hivers d'Antibes comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.",
    favorableSide: { label: "Ce qui correspond", statement: "doux", evidence: [], ruleIds: ["r1"], factIds: [] },
    unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "chaud", evidence: [], ruleIds: ["r2"], factIds: ["f-ch"] },
    absorbedFactIds: ["f-ch"], referencedRuleIds: ["r1", "r2"], materialityTier: tier, displaySection: "compromises",
  };
}
function shared(tier: MaterialityTier = "structuring"): FactComposition {
  return {
    id: "01001:composition-taille-consequences", kind: "shared_evidence", patternId: "territory-size-multiple-consequences",
    title: "Une même petite taille touche plusieurs dimensions de votre projet",
    summary: "La catégorie de taille de Ceyzériat répond moins bien à deux de vos priorités, pour la même raison.",
    sharedEvidence: [], consequences: [
      { projectKey: "prefere_grande_ville" as never, statement: "a", materialityTier: "structuring", factId: "f-a" },
      { projectKey: "eviter_isolement" as never, statement: "b", materialityTier: "secondary", factId: "f-b" },
    ],
    absorbedFactIds: ["f-a", "f-b"], referencedRuleIds: ["r3"], materialityTier: tier, displaySection: "mismatches",
  };
}

test("lead : un tradeoff structurant seul devient le fait de tête, sans bloc compositions_found", () => {
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [verification("f9", "secondary")],
    shownCompositions: [tradeoff("structuring")],
  }));
  assert.equal(plan.lead.kind, "single");
  if (plan.lead.kind !== "single") return;
  assert.equal(plan.lead.factId, "06004:composition-climat-saisons");
  assert.equal(plan.lead.topic, "Des hivers doux, avec une exposition estivale à arbitrer");
  assert.equal(plan.blocks.some((b) => b.key === "compositions_found"), false); // déjà narré par le lead
});

test("lead : un shared_evidence structurant ne mène JAMAIS la conclusion, il a son registre", () => {
  const plan = buildConclusionPlan(baseInput({
    shownCompositions: [shared("structuring")],
  }));
  assert.equal(plan.lead.kind, "none");
  const bloc = plan.blocks.find((b) => b.key === "compositions_found");
  assert.ok(bloc);
  assert.match(bloc!.fallbackText, /deux de vos priorités/);
  assert.deepEqual(bloc!.sourceIds, ["01001:composition-taille-consequences", "f-a", "f-b"]);
  // Placement : après unexamined_hard_constraints, avant reserves_found.
  const plan2 = buildConclusionPlan(baseInput({
    shownFacts: [verification("f1", "structuring")],
    shownCompositions: [shared("structuring")],
    uncovered: [MER],
  }));
  assert.deepEqual(plan2.blocks.map((b) => b.key), [
    "verdict", "unexamined_hard_constraints", "compositions_found", "reserves_found",
  ]);
});

test("hash : deux plans identiques sauf shownCompositions -> hashes différents", () => {
  const sans = buildConclusionPlan(baseInput({ shownFacts: [verification("f1", "structuring")] }));
  const avec = buildConclusionPlan(baseInput({ shownFacts: [verification("f1", "structuring")], shownCompositions: [shared()] }));
  assert.notEqual(buildConclusionHash(sans), buildConclusionHash(avec));
});

test("shownCompositions vide -> plan strictement identique à l'existant (non-régression)", () => {
  const plan = buildConclusionPlan(baseInput({ shownFacts: [verification("f1", "structuring")], uncovered: [MER], uncoveredPriorities: [AIR] }));
  assert.deepEqual(plan.blocks.map((b) => b.key), [
    "verdict", "unexamined_hard_constraints", "reserves_found", "uncovered_priorities",
  ]);
});

// ── La primitive de tri des candidats ──────────────────────────────────────────

test("rankLeadCandidates ne rend que les candidats du meilleur tier, dans l'ordre d'entrée", () => {
  const out = rankLeadCandidates(
    [verification("a", "structuring"), verification("b", "decision_critical"), verification("c", "decision_critical")],
    [],
  );
  assert.deepEqual(out.map((c) => c.factId), ["b", "c"]);
});

test("rankLeadCandidates rend un tableau vide quand rien ne dépasse secondary", () => {
  assert.deepEqual(rankLeadCandidates([verification("a", "secondary")], []), []);
  assert.deepEqual(rankLeadCandidates([], []), []);
});

test("un candidat de réserve porte son topic comme sujet", () => {
  const out = rankLeadCandidates([verification("f1", "structuring", "constat", "la chaleur estivale")], []);
  assert.equal(out[0]!.subject, "la chaleur estivale");
});

// ── Le headline ────────────────────────────────────────────────────────────────

test("arbitrage : deux mismatchs affichés sont NOMMÉS après un deux-points", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Deux priorités correspondent moins bien à Toulouse : le calme et l'accès aux espaces naturels.",
  );
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["m1", "m2"]);
  assert.equal(plan.verdict.headline.consumedFrom, "mismatches");
});

test("arbitrage : un seul mismatch, le singulier est accordé partout", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.equal(plan.verdict.headline.text, "Une priorité correspond moins bien à Toulouse : le calme.");
  assert.match(plan.verdict.detail, /Cet écart appelle/);
});

test("arbitrage : deux mismatchs, le détail accorde le pluriel", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.match(plan.verdict.detail, /Ces écarts appellent/);
});

test("arbitrage : une composition shared_evidence est candidate au headline", () => {
  // Les mismatchs élémentaires sont ABSORBÉS : shownFacts n'en contient aucun, et sans cette branche
  // le héros retomberait en posture alors qu'une carte visible nomme l'enjeu.
  const comp = {
    id: "comp-taille", kind: "shared_evidence", title: "Une même petite taille touche plusieurs dimensions de votre projet",
    summary: "résumé", headlineSubject: "la taille du territoire", materialityTier: "structuring",
    absorbedFactIds: ["m1", "m2"], displaySection: "mismatches",
  } as unknown as FactComposition;
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration", shownFacts: [], shownCompositions: [comp],
    mismatchTotal: 2, mismatchShown: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  // DEUX mismatchs sont émis, réunis sous UNE carte : le compte dit deux, et « dont » signale que le
  // héros ne nomme que la cause commune. Compter les cartes aurait écrit « Une priorité ».
  assert.equal(plan.verdict.headline.text, "Deux priorités correspondent moins bien à Toulouse, dont la taille du territoire.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["m1", "m2"]);
  assert.deepEqual(plan.verdict.headline.consumedCompositionIds, ["comp-taille"]);
});

test("gate 2 enjeux : trois mismatchs affichés basculent en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
      mismatchFact("m3", "structuring", "acces_soins", "l'accès aux soins"),
    ],
    mismatchTotal: 3, mismatchShown: 3,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.headline.text, "Un arbitrage réel à Toulouse, sans incompatibilité établie.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, []);
  assert.equal(plan.verdict.headline.consumedFrom, null);
});

test("gate de longueur : deux sujets longs et un nom long basculent en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    communeNom: "Saint-Rémy-de-Provence",
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "acces_ecoles", "l'accès aux collèges et lycées"),
      mismatchFact("m2", "structuring", "faible_dependance_auto", "la faible dépendance à la voiture"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.ok(plan.verdict.headline.text.length <= HEADLINE_MAX_CHARS);
});

test("réserve dominante unique : le sujet est nommé, le fait consommé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical", "constat f1", "la chaleur estivale"), verification("f2", "secondary")],
    reservesShown: 2, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.verdict.headline.text, "Le principal point à contrôler à Toulouse : la chaleur estivale.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["f1"]);
  assert.equal(plan.verdict.headline.consumedFrom, "reserves");
});

test("réserves à égalité : aucune ne domine, le headline reste en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "decision_critical")],
    reservesShown: 2, majorReserveCount: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, []);
});

test("cas favorable : posture, jamais un positif nommé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "favorable", hasFavorable: true, favorableCount: 3,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.headline.text, "Toulouse semble bien correspondre à votre projet.");
});

test("incompatibilité : la contrainte est nommée, le fait consommé", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "incompatible",
    establishedIncompatibility: { factId: "i1", statement: "La mer est à 240 km.", topic: "la proximité de la mer" },
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Une contrainte de votre projet n'est pas satisfaite à Toulouse : la proximité de la mer.",
  );
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["i1"]);
  assert.equal(plan.verdict.headline.consumedFrom, "constraint");
  assert.match(plan.verdict.detail, /240 km/);
});

test("couverture insuffisante : posture", () => {
  const plan = buildConclusionPlan(baseInput({ conclusionState: "insufficient_evidence" }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.headline.text, "Des éléments essentiels manquent encore pour trancher à Toulouse.");
});

test("le détail ne redit aucun sujet nommé par le headline", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2, reservesShown: 4,
  }));
  assert.equal(plan.verdict.detail.includes("le calme"), false);
  assert.equal(plan.verdict.detail.includes("espaces naturels"), false);
  assert.match(plan.verdict.detail, /arbitrage/i);
});

test("les réserves sont à CONTRÔLER, la contrainte non examinée est à VÉRIFIER", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 4,
    uncovered: [MER],
  }));
  assert.match(plan.verdict.detail, /4 constats restent par ailleurs à contrôler/);
  assert.match(plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.fallbackText, /à vérifier/);
});

test("le bloc verdict porte le DÉTAIL, et reste non générable", () => {
  const plan = buildConclusionPlan(baseInput());
  assert.equal(plan.blocks[0]?.key, "verdict");
  assert.equal(plan.blocks[0]!.generable, false);
  assert.equal(plan.blocks[0]!.fallbackText, plan.verdict.detail);
});

test("consommation NARRATIVE seulement : les comptes ne bougent pas", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme"), verification("f1", "decision_critical")],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 1, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.reservesCount, 1);
});

// ── La strate résiduelle ───────────────────────────────────────────────────────

test("la strate se reconstruit sur ce que le headline n'a pas consommé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [
      verification("f1", "decision_critical", "constat f1", "la chaleur estivale"),
      verification("f2", "structuring", "constat f2", "le retrait-gonflement des argiles"),
      verification("f3", "structuring", "constat f3", "l'exposition au bruit"),
    ],
    reservesShown: 3, majorReserveCount: 3,
  }));
  assert.equal(plan.verdict.headline.consumedFactIds.includes("f1"), true);
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(strate.fallbackText.includes("la chaleur estivale"), false);
  assert.match(strate.fallbackText, /argiles/);
  assert.match(strate.fallbackText, /bruit/);
});

test("même pool : la strate est la SUITE, jamais une seconde hiérarchie", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [
      verification("f1", "decision_critical", "constat f1", "la chaleur estivale"),
      verification("f2", "structuring", "constat f2", "le retrait-gonflement des argiles"),
      verification("f3", "structuring", "constat f3", "l'exposition au bruit"),
    ],
    reservesShown: 3, majorReserveCount: 3,
  }));
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  // Le héros vient de désigner LE principal point : annoncer que deux autres « pèsent le plus »
  // ouvrirait une hiérarchie concurrente.
  assert.equal(strate.fallbackText.includes("pèsent le plus"), false);
  assert.match(strate.fallbackText, /^À regarder ensuite/);
  assert.deepEqual(strate.allowedNumbers, []);
});

test("pool différent : la strate garde son moule de poids", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      verification("f1", "decision_critical", "constat f1", "la chaleur estivale"),
      verification("f2", "decision_critical", "constat f2", "l'exposition au bruit"),
    ],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 2, majorReserveCount: 2,
  }));
  assert.equal(plan.verdict.headline.consumedFrom, "mismatches");
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(strate.fallbackText, /demandent votre attention|pèsent le plus/);
});

test("pas de résiduel, pas de strate", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical", "constat f1", "la chaleur estivale")],
    reservesShown: 1, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.lead.kind, "none");
  assert.equal(plan.blocks.some((b) => b.key === "reserves_found"), false);
});

test("un headline de posture ne consomme rien : la strate est complète", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "decision_critical")],
    reservesShown: 2, majorReserveCount: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.lead.kind, "tied");
});

test("le registre mismatches_found n'existe plus : sa matière est dans le héros", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.blocks.some((b) => b.key === "mismatches_found"), false);
  assert.match(plan.verdict.headline.text, /le calme/);
});

test("gate calée sur le réel : une incompatibilité sur commune à article reste NOMMÉE", () => {
  // À 95 caractères, cette phrase (98) basculait en posture : le cas le plus grave perdait son nom.
  const plan = buildConclusionPlan(baseInput({
    communeNom: "Les Sables-d'Olonne", orientation: "incompatible",
    establishedIncompatibility: { factId: "i1", statement: "La gare la plus proche est à 42 km.", topic: "la proximité d'une gare" },
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.match(plan.verdict.headline.text, /aux Sables-d'Olonne : la proximité d'une gare/);
});

test("le détail ne redit JAMAIS la phrase du héros", () => {
  // Le héros porte « semble bien correspondre » ; le détail le répétait mot pour mot, soit exactement
  // les deux strates de même poids que ce lot supprime.
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: true, favorableCount: 2,
    reservesShown: 2, majorReserveCount: 1,
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "secondary")],
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.detail.includes("semble bien correspondre"), false);
  assert.match(plan.verdict.detail, /2 constats restent à contrôler/);
});

// ── Le compte des priorités, et la sélection quand il y en a plus de deux ───────

test("le compte vient des mismatchs ÉMIS, jamais du nombre de cartes", () => {
  // Une composition shared_evidence absorbe plusieurs mismatchs en UNE carte : compter les candidats
  // ferait dire « Deux priorités » là où le lecteur en a trois. Un nombre faux, dans le plus grand
  // texte de l'écran.
  const comp = {
    id: "comp-taille", kind: "shared_evidence", title: "titre long du patron",
    summary: "résumé", headlineSubject: "la taille du territoire", materialityTier: "structuring",
    absorbedFactIds: ["m2", "m3"], displaySection: "mismatches",
  } as unknown as FactComposition;
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    shownCompositions: [comp],
    mismatchTotal: 3, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.match(plan.verdict.headline.text, /^Trois priorités correspondent moins bien à Toulouse, dont /);
  assert.equal(plan.verdict.headline.text.includes("Deux priorités"), false);
});

test("trois mismatchs dont deux dominent par le tier : les deux sont nommés, le total est dit", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
      mismatchFact("m3", "secondary", "acces_soins", "l'accès aux soins"),
    ],
    mismatchTotal: 3, mismatchShown: 3,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Trois priorités correspondent moins bien à Toulouse, dont le calme et l'accès aux espaces naturels.",
  );
  // Le troisième n'est pas nommé, mais il est CONSOMMÉ : le héros parle bien des trois.
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["m1", "m2"]);
});

test("trois mismatchs à ÉGALITÉ de tier : posture, on ne couronne pas au hasard", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
      mismatchFact("m3", "structuring", "acces_soins", "l'accès aux soins"),
    ],
    mismatchTotal: 3, mismatchShown: 3,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
});

test("deux mismatchs de tiers différents : les deux sont nommés (aucune sélection à faire)", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "secondary", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(
    plan.verdict.headline.text,
    "Deux priorités correspondent moins bien à Toulouse : le calme et l'accès aux espaces naturels.",
  );
});

test("arbitrage : le côté favorable PROUVÉ est nommé, un arbitrage a deux côtés", () => {
  const plusieurs = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: true, favorableCount: 3,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(plusieurs.verdict.detail, /^Toulouse répond à plusieurs dimensions de votre projet/);
  const un = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: true, favorableCount: 1,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(un.verdict.detail, /^Toulouse présente un élément favorable pour votre projet/);
  // Sans favorable PROUVÉ, aucune promesse : l'ouverture se limite à l'absence d'incompatibilité.
  const aucun = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: false, favorableCount: 0,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(aucun.verdict.detail, /^Aucune incompatibilité n'a été établie à Toulouse/);
  assert.doesNotMatch(aucun.verdict.detail, /favorable|répond à/);
});
