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

test("lead single : le repli NOMME le sujet, jamais le constat de la carte", () => {
  // Le décompte est parti dans l'intertitre des cartes ; le constat, lui, vit dans la carte située
  // juste dessous. Le recopier ici disait deux fois la même phrase à trois centimètres d'écart.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "decision_critical", "Le logement porte une étiquette énergétique F", "l'étiquette énergétique du logement"),
      verification("f2", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(bloc.fallbackText, "À regarder d'abord : l'étiquette énergétique du logement.");
  assert.equal(bloc.fallbackText.includes("Le logement porte"), false);
  // La matière obligatoire vaut AUSSI pour un sujet seul : elle n'était impossible que tant que le
  // bloc portait un constat entier, dont l'exiger mot pour mot réclamait une copie.
  assert.deepEqual(bloc.requiredPhrases, ["étiquette énergétique du logement"]);
  assert.deepEqual(bloc.allowedNumbers, []);
  assert.equal(bloc.maxChars, 220);
});

test("allowedNumbers : le compte VRAI du registre, en chiffres ET en lettres", () => {
  // L'invariant est « aucun nombre faux », pas « aucun nombre absent du repli » : « deux priorités »
  // est exact quand il y en a deux, et le rejeter censurerait une tournure française naturelle.
  const plan = buildConclusionPlan(baseInput({
    uncoveredPriorities: [AIR, { key: "agriculture", label: "l'agriculture" }],
  }));
  assert.deepEqual(plan.blocks.find((b) => b.key === "uncovered_priorities")!.allowedNumbers, ["2", "deux"]);
});

test("lead tied : la strate LISTE, elle ne compte pas (aucun nombre autorisé)", () => {
  // « Parmi ces quatre points, deux pèsent le plus » demandait au lecteur de tenir deux comptes en
  // tête pour lui dire quoi regarder d'abord, et le nombre est déjà dit par le détail du verdict et
  // par l'intertitre des cartes. La strate navigue ; le compte vit ailleurs.
  const plan = buildConclusionPlan(baseInput({
    reservesShown: 4,
    shownFacts: [
      verification("f1", "decision_critical"), verification("f2", "decision_critical"),
      verification("f3", "secondary"), verification("f4", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(plan.reservesCount, 4); // le compte existe toujours, il ne s'écrit plus ici
  assert.equal(bloc.fallbackText, "À regarder d'abord : sujet f1 et sujet f2.");
  assert.deepEqual(bloc.allowedNumbers, []);
  assert.doesNotMatch(bloc.fallbackText, /\b(un|deux|trois|quatre|points?)\b/i);
});

test("lead tied : aucun moule ne porte de nombre, quels que soient les comptes", () => {
  // La phrase portait la relation « trois parmi quatre » pour éviter une contradiction avec le
  // verdict. Le moule de navigation la rend sans objet : ne comptant plus, il ne peut plus diverger.
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
  assert.equal(
    bloc.fallbackText,
    "À regarder d'abord : l'exposition de Toulouse à l'inondation, le retrait-gonflement des argiles et un plan de prévention des risques.",
  );
  assert.deepEqual(bloc.allowedNumbers, []);
  // À comptes égaux (tous au rang max), le même moule, sans exception à retenir.
  const egal = buildConclusionPlan(baseInput({
    reservesShown: 2,
    shownFacts: [verification("f1", "structuring", "s1", "sujet un"), verification("f2", "structuring", "s2", "sujet deux")],
  }));
  assert.equal(egal.blocks.find((b) => b.key === "reserves_found")!.fallbackText, "À regarder d'abord : sujet un et sujet deux.");
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
    kind: "single", factId: "f1", topic: "sujet f1", subject: "sujet f1", statement: "constat f1",
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
    facts: [
      { factId: "f1", topic: "sujet f1", subject: "sujet f1" },
      { factId: "f2", topic: "sujet f2", subject: "sujet f2" },
    ],
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
    establishedIncompatibility: { factId: "i1", statement: "504 078 habitants, au-delà de 20 000.", constraintLabel: "une commune de moins de 20 000 habitants" },
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
  assert.match(p.blocks[0]!.fallbackText, /^Toulouse répond bien à plusieurs de vos priorités\./);
  // « des points qui pèsent » dit le tier sans le nommer, et le détail ne recopie plus le héros.
  assert.match(p.blocks[0]!.fallbackText, /Ils peuvent encore peser dans votre décision\./);
  assert.equal(p.blocks[0]!.fallbackText.includes("structurant"), false);
  assert.match(p.verdict.headline.text, /^Deux points restent à contrôler avant de conclure sur Toulouse\.$/);
});

test("high + major_reserves avec UN SEUL favorable : « plusieurs dimensions » serait faux", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: true, favorableCount: 1, majorReserveCount: 1,
  }));
  assert.equal(p.blocks[0]!.fallbackText.includes("plusieurs"), false);
  assert.match(p.blocks[0]!.fallbackText, /présente un élément favorable pour votre projet/);
  assert.equal(p.verdict.headline.text, "Un point reste à contrôler avant de conclure sur Toulouse."); // accord au SINGULIER
});

test("high + major_reserves SANS favorable : aucun positif n'est promis", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 1,
  }));
  assert.equal(p.blocks[0]!.fallbackText.includes("répond bien"), false);
  assert.equal(p.blocks[0]!.fallbackText.includes("favorable"), false);
  // Un seul point : l'accord suit, jusque dans la subordonnée.
  assert.match(p.blocks[0]!.fallbackText, /^Tant que ce point n'est pas levé, rien ne permet de dire que Toulouse correspond à votre projet\.$/);
});

test("high + minor_reserves SANS favorable : aucun « bien correspondre » ne s'échappe", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0, reservesShown: 2,
  }));
  const tout = `${p.verdict.headline.text} ${p.blocks[0]!.fallbackText}`;
  assert.equal(tout.includes("bien correspondre"), false);
  assert.match(p.verdict.headline.text, /reste à confirmer/);
  assert.match(p.blocks[0]!.fallbackText, /^Deux constats restent à contrôler avant de conclure\.$/);
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
  assert.match(p.blocks[0]!.fallbackText, /La lecture reste incomplète, et deux points demandent votre attention\./);
});

test("couverture none : le GARDE-FOU, aucun positif ne s'échappe", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "none", orientation: "indeterminate", hasFavorable: false, favorableCount: 0,
  }));
  assert.equal(p.verdictLabel, "Lecture non disponible");
  // Le sujet est le critère du lecteur : aucun accord de genre à dériver sur le nom de commune.
  assert.equal(p.verdict.headline.text, "Vos critères n'ont pas encore pu être lus à Toulouse.");
  assert.equal(`${p.verdict.headline.text} ${p.blocks[0]!.fallbackText}`.includes("va dans le sens"), false);
});

test("incompatibilité : la condition non respectée EST la réponse", () => {
  const p = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility", orientation: "incompatible",
    establishedIncompatibility: { factId: "f1", statement: "Cette commune est à 180 km du littoral.", constraintLabel: "la proximité de la mer" },
  }));
  assert.equal(p.verdictLabel, "Condition non respectée");
  assert.equal(p.verdictTone, "critical");
  assert.match(p.verdict.headline.text, /Une condition de votre projet n'est pas remplie à Toulouse : la proximité de la mer/);
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
  // Le compte vit dans le HÉROS, y compris en posture : la gate ne portait que sur les NOMS, et
  // renoncer à nommer n'oblige pas à renoncer à un nombre qu'on connaît.
  assert.equal(seul.verdict.headline.text, "Toulouse répond moins bien à cinq de vos priorités.");
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
  assert.match(vp.fallbackText, /^Toulouse répond bien à plusieurs de vos autres priorités\./);
  // Les deux côtés de l'arbitrage sont nommés : l'écart ET ce qu'on gagne en échange.
  assert.match(vp.fallbackText, /Ces écarts sont à peser contre ce que vous y gagnez\./);
  const un = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 2, mismatchShown: 2, hasFavorable: true, favorableCount: 1 }));
  assert.match(un.blocks.find((b) => b.key === "verdict")!.fallbackText, /^Toulouse répond bien à une autre de vos priorités\./);
  // Sans favorable prouvé, aucune promesse : le texte reste celui de l'absence d'incompatibilité.
  const aucun = buildConclusionPlan(baseInput({ orientation: "arbitration", mismatchTotal: 2, mismatchShown: 2, hasFavorable: false, favorableCount: 0 }));
  const va = aucun.blocks.find((b) => b.key === "verdict")!;
  assert.match(va.fallbackText, /^Aucune de vos conditions n'est contredite ici\./);
  assert.doesNotMatch(`${aucun.verdict.headline.text} ${va.fallbackText}`, /favorable|répond bien/);
});

test("verdict neutral : ni « bien correspondre » ni « impossible de conclure »", () => {
  const v = buildConclusionPlan(baseInput({ orientation: "neutral", mismatchTotal: 0, mismatchShown: 0 })).blocks.find((b) => b.key === "verdict")!;
  assert.doesNotMatch(v.fallbackText, /bien correspond|impossible/i);
  assert.match(v.fallbackText, /Aucun écart marqué n'apparaît, aucun avantage net non plus\./);
  assert.equal(v.fallbackText.includes("dimensions"), false); // le mot de la matrice interne
});

// ── Compositions dans le plan (registre compositions_found + lead tradeoff) ──────────────────────

import { buildConclusionHash } from "./conclusion-hash.ts";
import type { FactComposition } from "./fact-composition.ts";

function tradeoff(tier: MaterialityTier = "structuring"): FactComposition {
  return {
    id: "06004:composition-climat-saisons", kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
    headlineSubject: "l'exposition aux fortes chaleurs",
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
    headlineCause: "sa petite taille",
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

// Le héros prenait le `title` de la composition comme sujet : « … : Des hivers doux, avec une
// exposition estivale à arbitrer. » Une majuscule au milieu de la phrase, et un compromis présenté
// comme un problème. Le sujet vient désormais du `headlineSubject`, bas de casse et sans le côté
// favorable.
test("héros : une composition en tête nomme son headlineSubject, jamais son titre", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f9", "secondary")],
    shownCompositions: [tradeoff("decision_critical")],
    reservesShown: 2, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Le principal point à contrôler à Toulouse : l'exposition aux fortes chaleurs.",
  );
  assert.equal(plan.verdict.headline.text.includes("Des hivers doux"), false);
  // La composition consommée emporte ses faits absorbés, jamais son propre id dans les faits.
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["f-ch"]);
  assert.deepEqual(plan.verdict.headline.consumedCompositionIds, ["06004:composition-climat-saisons"]);
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
    "Toulouse répond moins bien à deux de vos priorités : le calme et l'accès aux espaces naturels.",
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
  assert.equal(plan.verdict.headline.text, "Toulouse répond moins bien à une de vos priorités : le calme.");
  // Le détail ne compte plus les écarts : il porte les DEUX côtés de l'arbitrage, sans accord à
  // dériver (« ce que vous y gagnez » évite le nom de commune une seconde fois).
  assert.equal(plan.verdict.detail, "Toulouse répond bien à une autre de vos priorités. Cet écart est à peser contre ce que vous y gagnez.");
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
  assert.match(plan.verdict.detail, /Ces écarts sont à peser contre ce que vous y gagnez\.$/);
});

test("arbitrage : une composition shared_evidence est candidate au headline", () => {
  // Les mismatchs élémentaires sont ABSORBÉS : shownFacts n'en contient aucun, et sans cette branche
  // le héros retomberait en posture alors qu'une carte visible nomme l'enjeu.
  const comp = {
    id: "comp-taille", kind: "shared_evidence", title: "Une même petite taille touche plusieurs dimensions de votre projet",
    summary: "résumé", headlineCause: "sa petite taille", materialityTier: "structuring",
    absorbedFactIds: ["m1", "m2"], displaySection: "mismatches",
  } as unknown as FactComposition;
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration", shownFacts: [], shownCompositions: [comp],
    mismatchTotal: 2, mismatchShown: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  // DEUX mismatchs sont émis, réunis sous UNE carte : le compte dit deux, et « pour la même raison »
  // dit ce que la composition affirme. « dont la taille du territoire » faisait passer la CAUSE pour
  // une troisième priorité, que le lecteur n'avait jamais écrite. Compter les cartes aurait par
  // ailleurs écrit « une priorité ».
  assert.equal(plan.verdict.headline.text, "Toulouse répond moins bien à deux de vos priorités, pour la même raison : sa petite taille.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["m1", "m2"]);
  assert.deepEqual(plan.verdict.headline.consumedCompositionIds, ["comp-taille"]);
});

// La cause a son gabarit, et elle s'y lit SEULE. Mélangée à un mismatch simple dans un « dont », elle
// redeviendrait une priorité parmi d'autres : on nomme alors les priorités, et la cause reste à sa carte.
test("arbitrage : une cause commune ne s'énumère jamais avec des priorités", () => {
  const comp = {
    id: "comp-taille", kind: "shared_evidence", title: "Une même petite taille joue sur plusieurs de vos priorités",
    summary: "résumé", headlineCause: "sa petite taille", materialityTier: "structuring",
    absorbedFactIds: ["m2", "m3"], displaySection: "mismatches",
  } as unknown as FactComposition;
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    shownCompositions: [comp],
    mismatchTotal: 3, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.text, "Toulouse répond moins bien à trois de vos priorités, dont le calme.");
  assert.equal(plan.verdict.headline.text.includes("petite taille"), false);
  // La cause n'étant pas nommée, elle n'est pas consommée : sa carte garde tout son rôle.
  assert.deepEqual(plan.verdict.headline.consumedCompositionIds, []);
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
  // La posture RENONCE À NOMMER, jamais à compter : la gate ne portait que sur les noms.
  assert.equal(plan.verdict.headline.text, "Toulouse répond moins bien à trois de vos priorités.");
  // Et le détail reprend le nommage que le héros a lâché : l'information ne disparaît pas du dossier.
  assert.match(plan.verdict.detail, /^Ces priorités sont moins bien servies ici qu'ailleurs : le calme, l'accès aux espaces naturels et l'accès aux soins\./);
  assert.deepEqual(plan.verdict.headline.consumedFactIds, []);
  assert.equal(plan.verdict.headline.consumedFrom, null);
});

test("gate de longueur : deux sujets longs et un nom long basculent en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    communeNom: "Saint-Rémy-de-Provence",
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "acces_ecoles", "l'accès aux collèges et lycées"),
      mismatchFact("m2", "structuring", "faible_dependance_auto", "la possibilité de se passer de la voiture"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture"); // la phrase nommée ferait 143 caractères
  assert.ok(plan.verdict.headline.text.length <= HEADLINE_MAX_CHARS);
});

// LA FRONTIÈRE, des deux côtés. Le test précédent montre qu'une phrase trop longue bascule ; celui-ci
// montre qu'une phrase qui TIENT reste nommée, sur le même gabarit et le même nom de commune. Sans
// les deux, une gate abaissée par erreur passerait inaperçue : tout basculerait, et « posture » est
// un état valide que rien ne signale.
test("gate de longueur : la même commune garde son héros nommé quand la phrase tient", () => {
  const plan = buildConclusionPlan(baseInput({
    communeNom: "Saint-Rémy-de-Provence",
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "acces_soins", "l'accès aux soins"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Saint-Rémy-de-Provence répond moins bien à deux de vos priorités : le calme et l'accès aux soins.",
  );
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
    establishedIncompatibility: { factId: "i1", statement: "La mer est à 240 km.", constraintLabel: "la proximité de la mer" },
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Une condition de votre projet n'est pas remplie à Toulouse : la proximité de la mer.",
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
  assert.match(plan.verdict.detail, /Ces écarts sont à peser/);
});

test("les réserves sont à CONTRÔLER, la contrainte non examinée est à VÉRIFIER", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 4,
    uncovered: [MER],
  }));
  assert.match(plan.verdict.detail, /Quatre constats restent par ailleurs à contrôler/);
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
  assert.match(strate.fallbackText, /^À regarder d'abord : /);
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
    establishedIncompatibility: { factId: "i1", statement: "La gare la plus proche est à 42 km.", constraintLabel: "la proximité d'une gare" },
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
  assert.match(plan.verdict.detail, /Deux constats restent à contrôler avant de conclure/);
});

// ── Le compte des priorités, et la sélection quand il y en a plus de deux ───────

test("le compte vient des mismatchs ÉMIS, jamais du nombre de cartes", () => {
  // Une composition shared_evidence absorbe plusieurs mismatchs en UNE carte : compter les candidats
  // ferait dire « Deux priorités » là où le lecteur en a trois. Un nombre faux, dans le plus grand
  // texte de l'écran.
  const comp = {
    id: "comp-taille", kind: "shared_evidence", title: "titre long du patron",
    summary: "résumé", headlineCause: "sa petite taille", materialityTier: "structuring",
    absorbedFactIds: ["m2", "m3"], displaySection: "mismatches",
  } as unknown as FactComposition;
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    shownCompositions: [comp],
    mismatchTotal: 3, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.match(plan.verdict.headline.text, /^Toulouse répond moins bien à trois de vos priorités, dont /);
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
    "Toulouse répond moins bien à trois de vos priorités, dont le calme et l'accès aux espaces naturels.",
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
    "Toulouse répond moins bien à deux de vos priorités : le calme et l'accès aux espaces naturels.",
  );
});

test("arbitrage : le côté favorable PROUVÉ est nommé, un arbitrage a deux côtés", () => {
  const plusieurs = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: true, favorableCount: 3,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(plusieurs.verdict.detail, /^Toulouse répond bien à plusieurs de vos autres priorités\./);
  const un = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: true, favorableCount: 1,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(un.verdict.detail, /^Toulouse répond bien à une autre de vos priorités\./);
  // Sans favorable PROUVÉ, aucune promesse : l'ouverture se limite à l'absence d'incompatibilité.
  const aucun = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: false, favorableCount: 0,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(aucun.verdict.detail, /^Aucune de vos conditions n'est contredite ici\./);
  assert.doesNotMatch(aucun.verdict.detail, /favorable|répond à/);
});

// LES ACCORDS DU BLOC, sur les branches où un seul élément est compté. Ce sont les fautes que le
// rendu réel a montrées et qu'aucune assertion ne voyait : « Cet écart » quand il n'y en a qu'un,
// « ce point n'est pas levé » au singulier. Une faute d'accord dans le plus grand texte de l'écran
// coûte plus cher que ce qu'elle occupe.
test("le singulier est accordé partout : un écart, un point, un constat", () => {
  const unEcart = buildConclusionPlan(baseInput({
    orientation: "arbitration", hasFavorable: false, favorableCount: 0,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 1,
  }));
  assert.match(unEcart.verdict.detail, /Cet écart est à peser avant de vous décider\. Un constat reste par ailleurs à contrôler\.$/);

  const unPoint = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 1,
  }));
  assert.match(unPoint.verdict.headline.text, /^Un point reste à contrôler avant de conclure sur Toulouse\.$/);
  assert.match(unPoint.verdict.detail, /^Tant que ce point n'est pas levé,/);

  const unConstat = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0, reservesShown: 1,
  }));
  assert.equal(unConstat.verdict.detail, "Un constat reste à contrôler avant de conclure.");
});

// ── La strate de poids : un moule, deux variantes d'ordre (lot D) ────────────────

test("strate : « ensuite » quand le héros a déjà nommé un point de CE registre", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0,
    shownFacts: [
      verification("f1", "decision_critical", "c1", "l'exposition à l'inondation"),
      verification("f2", "structuring", "c2", "le retrait-gonflement des argiles"),
    ],
    reservesShown: 2, majorReserveCount: 2,
  }));
  assert.equal(plan.verdict.headline.consumedFrom, "reserves");
  assert.equal(
    plan.blocks.find((b) => b.key === "reserves_found")!.fallbackText,
    "À regarder ensuite : le retrait-gonflement des argiles.",
  );
});

test("strate : « d'abord » quand le héros a puisé dans un AUTRE pool", () => {
  // Le héros nomme des mismatchs ; les réserves sont un pool distinct, que personne n'a encore ouvert.
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      verification("f1", "decision_critical", "c1", "l'exposition à l'inondation"),
    ],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 1,
  }));
  assert.equal(plan.verdict.headline.consumedFrom, "mismatches");
  assert.equal(
    plan.blocks.find((b) => b.key === "reserves_found")!.fallbackText,
    "À regarder d'abord : l'exposition à l'inondation.",
  );
});

// Le défaut que le lot D ferme : une composition entrait en strate par son `title` (capitalisé, écrit
// pour coiffer une carte) ou par son `summary` (la carte recopiée).
test("strate : une composition est nommée par son sujet, jamais par son titre ni son résumé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: true, favorableCount: 2,
    shownFacts: [verification("f9", "secondary")],
    shownCompositions: [tradeoff("structuring")],
    reservesShown: 2,
  }));
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(strate.fallbackText, "À regarder d'abord : l'exposition aux fortes chaleurs.");
  assert.equal(strate.fallbackText.includes("Des hivers doux"), false); // le title
  assert.equal(strate.fallbackText.includes("comptent parmi les plus doux"), false); // le summary
  assert.deepEqual(strate.requiredPhrases, ["exposition aux fortes chaleurs"]);
});

// « Aucune de vos conditions n'est contredite ici » rassure sur un risque que le lecteur n'a jamais
// soulevé quand il n'a posé AUCUNE condition non négociable. Vu à l'écran sur Salers.
test("arbitrage : aucune condition posée, on ne rassure pas sur un risque inexistant", () => {
  const sans = buildConclusionPlan(baseInput({
    conclusionState: "no_hard_constraint_declared",
    orientation: "arbitration", hasFavorable: false, favorableCount: 0,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.equal(sans.verdict.detail, "Cet écart est à peser avant de vous décider.");

  // Une condition posée et non contredite, elle, mérite d'être dite : c'est une information.
  const avec = buildConclusionPlan(baseInput({
    conclusionState: "no_incompatibility_established",
    orientation: "arbitration", hasFavorable: false, favorableCount: 0,
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.match(avec.verdict.detail, /^Aucune de vos conditions n'est contredite ici\./);
});

// ── La posture « j'y habite déjà » ──────────────────────────────────────────────

// Quelqu'un qui a coché « j'y habite déjà » n'a pas de projet : il a un lieu de vie et des questions
// dessus. La posture vivait sur le plan sans être lue, et il lisait « Il est encore trop tôt pour dire
// que Toulouse correspond à votre projet ».
test("posture habitant : le verdict ne parle plus de « projet »", () => {
  const branches: Partial<ConclusionPlanInput>[] = [
    { conclusionState: "project_not_structured" },
    { orientation: "incompatible", conclusionState: "established_incompatibility", establishedIncompatibility: { factId: "i1", statement: "s.", constraintLabel: "la proximité de la mer" } },
    { coverage: "high", orientation: "favorable", hasFavorable: true, favorableCount: 3 },
    { coverage: "partial", orientation: "favorable" },
    { coverage: "high", orientation: "minor_reserves", hasFavorable: true, favorableCount: 2, reservesShown: 2 },
    { coverage: "high", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 1 },
    { coverage: "partial", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 2 },
    { coverage: "partial", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0, reservesShown: 1 },
  ];
  for (const over of branches) {
    const p = buildConclusionPlan(baseInput({ posture: "habitant", ...over }));
    const tout = `${p.verdict.headline.text} ${p.verdict.detail}`;
    assert.doesNotMatch(tout, /projet/i, `posture habitant : « ${tout} »`);
    // Et la phrase reste une phrase : pas de fragment vide laissé par la substitution.
    assert.ok(p.verdict.headline.text.length > 20, `héros trop court : « ${p.verdict.headline.text} »`);
  }
});

test("posture recherche : « votre projet » reste, c'est le mot juste", () => {
  const p = buildConclusionPlan(baseInput({ coverage: "high", orientation: "favorable", hasFavorable: true, favorableCount: 3 }));
  assert.equal(p.verdict.headline.text, "Toulouse semble bien correspondre à votre projet.");
});
