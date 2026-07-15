import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConclusionPlan, shouldGenerateNarrative, type ConclusionPlanInput } from "./conclusion-plan.ts";
import type { DecisionFact, MaterialityTier } from "./decision-fact.ts";

function verification(id: string, tier: MaterialityTier, statement = `constat ${id}`, topic = `sujet ${id}`): DecisionFact {
  return {
    id, ruleId: `rule-${id}`, sourceFactIds: [], module: "logement", statement, topic,
    materialityTier: tier, role: "verification",
    evidence: [{ factId: id, module: "logement", label: "DPE", observedValue: "F", grain: "adresse" }],
    action: { type: "verifier_sur_place", label: "Vérifier sur place" },
  };
}

function baseInput(over: Partial<ConclusionPlanInput> = {}): ConclusionPlanInput {
  return {
    scope: "commune",
    communeNom: "Toulouse",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    shownFacts: [],
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

test("lead tied : la phrase compte les faits de TÊTE, jamais toutes les réserves", () => {
  // `tied` dit que plusieurs faits partagent le rang MAXIMAL, pas que toutes les réserves pèsent
  // pareil : ici deux dominent et deux sont secondaires. Annoncer « 4 points » serait faux.
  const plan = buildConclusionPlan(baseInput({
    shownFacts: [
      verification("f1", "decision_critical"), verification("f2", "decision_critical"),
      verification("f3", "secondary"), verification("f4", "secondary"),
    ],
  }));
  const bloc = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(plan.reservesCount, 4);
  assert.deepEqual(bloc.allowedNumbers, ["2", "deux"]);
  assert.equal(bloc.fallbackText.includes("4"), false);
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
  assert.match(p.blocks[0]!.fallbackText, /^Toulouse semble bien correspondre à votre projet/);
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
  assert.equal(p.blocks[0]!.fallbackText.includes("bien correspondre"), false);
  assert.match(p.blocks[0]!.fallbackText, /reste à confirmer/);
  assert.match(p.blocks[0]!.fallbackText, /2 points restent à examiner/);
});

test("partial + minor_reserves SANS favorable : rien ne « va dans le sens » de rien", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "partial", orientation: "minor_reserves", hasFavorable: false, favorableCount: 0, reservesShown: 1,
  }));
  assert.equal(p.blocks[0]!.fallbackText.includes("va plutôt dans le sens"), false);
  assert.match(p.blocks[0]!.fallbackText, /1 point reste à examiner/); // accord au SINGULIER
});

test("partial + major_reserves : l'écran actuel, et il est honnête", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "partial", orientation: "major_reserves", hasFavorable: false, favorableCount: 0, majorReserveCount: 2,
  }));
  assert.equal(p.verdictLabel, "Lecture encore partielle");
  assert.equal(p.verdictTone, "caution");
  assert.match(p.blocks[0]!.fallbackText, /encore trop tôt pour dire que Toulouse correspond/);
  assert.match(p.blocks[0]!.fallbackText, /2 points structurants demandent attention/);
});

test("couverture none : le GARDE-FOU, aucun positif ne s'échappe", () => {
  const p = buildConclusionPlan(baseInput({
    coverage: "none", orientation: "indeterminate", hasFavorable: false, favorableCount: 0,
  }));
  assert.equal(p.verdictLabel, "Lecture non disponible");
  assert.match(p.blocks[0]!.fallbackText, /^Toulouse ne peut pas encore être évalué au regard de vos critères/);
  assert.equal(p.blocks[0]!.fallbackText.includes("va dans le sens"), false);
});

test("incompatibilité : la condition non respectée EST la réponse", () => {
  const p = buildConclusionPlan(baseInput({
    conclusionState: "established_incompatibility", orientation: "incompatible",
    establishedIncompatibility: { factId: "f1", statement: "Cette commune est à 180 km du littoral." },
  }));
  assert.equal(p.verdictLabel, "Condition non respectée");
  assert.equal(p.verdictTone, "critical");
  assert.match(p.blocks[0]!.fallbackText, /conditions non négociables n'est pas respectée ici/);
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
  assert.match(mixte.blocks.find((b) => b.key === "verdict")!.fallbackText, /vérifier/i);
});

test("verdict neutral : ni « bien correspondre » ni « impossible de conclure »", () => {
  const v = buildConclusionPlan(baseInput({ orientation: "neutral", mismatchTotal: 0, mismatchShown: 0 })).blocks.find((b) => b.key === "verdict")!;
  assert.doesNotMatch(v.fallbackText, /bien correspond|impossible/i);
  assert.match(v.fallbackText, /ni favorablement ni défavorablement|aucun écart notable/i);
});
