// Assembleur PUR : états de conclusion HONNÊTES (périmètre communal, deux vides distincts,
// project_not_structured), couverture nommée, hiérarchie plafonnée. Aucun LLM.
import type {
  DecisionFact, Dossier, DossierSection, DossierCard, ConclusionState, RunResult, EvidenceRef, MaterialityTier,
  IncompatibilityFact,
} from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";
import { assertCompositionsValid } from "./fact-compositions.ts";
import type { UserProject } from "../user-project.ts";
import { hasAnyHardConstraint, isStructured, hardConstraintLabel } from "./project-view.ts";
import { buildCriteriaRegistry, uncoveredConstraints, uncoveredPreferences } from "./criteria-registry.ts";
import { buildConclusionPlan } from "./conclusion-plan.ts";

function labels(project: UserProject): { engage: string; verifTitle: string } {
  if (project.posture === "habitant") {
    return { engage: "comprendre et surveiller", verifTitle: "Ce que ces données invitent à comprendre ou surveiller" };
  }
  // Le statut (établi) AVANT l'action (à contrôler) : « À examiner » appliquait le doute à des constats
  // prouvés. « Vérifier » reste réservé au non-examiné (condition de la conclusion) ; « contrôler » dit
  // la conséquence d'un fait établi, au grain du bien.
  return { engage: "vous engager", verifTitle: "Ce qui est établi, à contrôler avant de vous engager" };
}

const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
const RESERVE_ROLES = new Set<DecisionFact["role"]>(["verification", "compromise", "unknown"]);
function tierRank(f: DecisionFact): number {
  const base = TIER_RANK[f.materialityTier] * 2;
  return f.role === "incompatibility" && f.evidenceStrength === "indicative" ? base + 1 : base;
}
// UNE LISTE UNIQUE DE CARTES, un seul tri, un seul cap : une composition compte pour une carte et ne
// passe jamais devant une carte plus matérielle du seul fait d'être composée. À TIER ÉGAL elle passe
// d'abord (elle porte plus d'information par carte), d'où le -1 sur l'échelle x2 de tierRank.
function cardTier(c: DossierCard): number {
  return c.kind === "fact" ? tierRank(c.fact) : TIER_RANK[c.composition.materialityTier] * 2 - 1;
}
function sectionCards(
  facts: DecisionFact[], comps: FactComposition[],
  role: DecisionFact["role"], sectionKey: DossierSection["key"], cap: number,
): DossierCard[] {
  const cards: DossierCard[] = [
    ...facts.filter((f) => f.role === role).map((f) => ({ kind: "fact" as const, fact: f })),
    ...comps.filter((c) => c.displaySection === sectionKey).map((c) => ({ kind: "composition" as const, composition: c })),
  ];
  return cards.sort((a, b) => cardTier(a) - cardTier(b)).slice(0, cap);
}

function conclusionState(facts: DecisionFact[], project: UserProject): ConclusionState {
  if (!isStructured(project)) return "project_not_structured";
  if (facts.some((f) => f.role === "incompatibility" && f.evidenceStrength === "established")) return "established_incompatibility";
  if (facts.some((f) => f.role === "unknown" && f.impact === "blocking")) return "insufficient_evidence";
  if (!hasAnyHardConstraint(project)) return "no_hard_constraint_declared";
  return "no_incompatibility_established";
}

// Les textes déterministes de chaque registre vivent désormais dans conclusion-plan.ts (le PLAN est
// la source de vérité, `conclusion` en est la concaténation). Ils y sont découpés par registre, parce
// qu'un LLM ne peut reformuler que ce qui lui est confié bloc par bloc, et parce que la hiérarchie
// éditoriale des réserves doit rester lisible dans la structure, pas seulement dans une phrase.

function factEvidence(f: DecisionFact): EvidenceRef[] {
  return f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence;
}

export function assembleDossier(
  run: RunResult,
  project: UserProject,
  scope: "commune" | "commune+adresse",
  // Le NOM de la commune : le dossier parle de Toulouse, pas de « ce lieu ».
  communeNom: string,
  compositions: FactComposition[] = [],
): Dossier {
  assertCompositionsValid(run, compositions);
  // AVANT LES CAPS (spec §6) : un fait absorbé quitte sa section ; il reste dans le dossier interne
  // (couverture, orientation, preuves) et au dépliable de sa composition.
  const absorbed = new Set(compositions.flatMap((c) => c.absorbedFactIds));
  const facts = run.facts.filter((f) => !absorbed.has(f.id));

  // La couverture est une CONSÉQUENCE OBSERVÉE des règles (criteria-registry), plus une liste tenue à
  // la main. `run.coveredHardConstraints` n'est plus consulté ici : il marque une contrainte « couverte »
  // dès que l'outcome n'est pas not_applicable, donc un `unknown` (population absente) la déclarait
  // examinée alors que rien ne l'avait été.
  const criteria = buildCriteriaRegistry(project, run);
  const uncovered = uncoveredConstraints(criteria);
  // L'état de conclusion se juge sur les faits ÉMIS : une absorption est de la présentation, jamais un
  // adoucissement de l'état.
  const state = conclusionState(run.facts, project);
  const l = labels(project);
  const candidates: DossierSection[] = [
    // « CONDITION », pas « contrainte » : c'est le mot du lexique tranché, celui que l'étiquette du
    // verdict (« Condition non respectée ») et le bloc des non examinées (« Condition à vérifier »)
    // emploient déjà. Ce titre était le dernier endroit de l'écran à dire « contrainte », et il se
    // lisait à trois centimètres d'un héros qui dit « condition ».
    { key: "incompatibilities", title: "Vos conditions non négociables", cards: sectionCards(facts, compositions, "incompatibility", "incompatibilities", 2) },
    // MISMATCH : établi, non éliminatoire, à ARBITRER (jamais à vérifier). Sa propre section, entre les
    // incompatibilités et les compromis. Un mismatch n'est pas un compromis (pas de contrepartie).
    { key: "mismatches", title: "Ce qui correspond moins bien", cards: sectionCards(facts, compositions, "mismatch", "mismatches", 3) },
    { key: "compromises", title: "Ce qui départage vraiment", cards: sectionCards(facts, compositions, "compromise", "compromises", 3) },
    { key: "unknowns", title: "Ce que nous ne savons pas encore", cards: sectionCards(facts, compositions, "unknown", "unknowns", 3) },
    { key: "verifications", title: l.verifTitle, cards: sectionCards(facts, compositions, "verification", "verifications", 4) },
  ];
  const sections = candidates.filter((s) => s.cards.length > 0);
  const allCards = sections.flatMap((s) => s.cards);
  const shown = allCards.filter((c): c is DossierCard & { kind: "fact" } => c.kind === "fact").map((c) => c.fact);
  const shownComps = allCards.filter((c): c is DossierCard & { kind: "composition" } => c.kind === "composition").map((c) => c.composition);

  // Les réserves annoncées sont celles qu'on MONTRE. Compter `facts` (les faits ÉMIS) alors que les
  // sections sont plafonnées (caps 2/3/3/4) annonçait « 5 points » et n'en affichait que 4. Le verdict
  // compte donc lui aussi sur l'affiché : le lecteur doit pouvoir compter les cartes et retomber dessus.
  const established = run.facts.find((f): f is IncompatibilityFact =>
    f.role === "incompatibility" && f.evidenceStrength === "established");
  // Les compositions porteuses de réserves : un tradeoff (son côté défavorable est une verification) et
  // une grouped_verification (deux verifications sous une carte) comptent chacun pour UNE carte-réserve.
  const reserveComps = shownComps.filter((c) => c.kind === "tradeoff" || c.kind === "grouped_verification");
  const sharedShown = shownComps.filter((c) => c.kind === "shared_evidence");
  const reservesShownFacts = shown.filter((f) => RESERVE_ROLES.has(f.role));
  // Le TOTAL des mismatchs ÉMIS (le verdict compte dessus, « N de vos priorités » reste vrai même
  // absorbé), et les CARTES mismatch visibles (faits simples + compositions shared_evidence).
  const mismatchTotal = run.facts.filter((f) => f.role === "mismatch").length;
  const mismatchShown = shown.filter((f) => f.role === "mismatch").length + sharedShown.length;
  const narrativePlan = buildConclusionPlan({
    scope,
    communeNom,
    conclusionState: state,
    posture: project.posture,
    shownFacts: shown,
    shownCompositions: shownComps,
    uncovered,
    uncoveredPriorities: uncoveredPreferences(criteria),
    // Le libellé est résolu ICI, depuis le projet : le `topic` du fait nomme la commune (« la distance
    // de Toulouse au littoral »), et le héros la nomme déjà. `hardConstraintLabel` rend la condition
    // telle que le lecteur l'a posée, exactement comme pour les contraintes non examinées.
    establishedIncompatibility: established
      ? {
          factId: established.id,
          statement: established.statement,
          constraintLabel: hardConstraintLabel(project, established.hardConstraintKey),
        }
      : null,
    coverage: criteria.coverage,
    orientation: criteria.orientation,
    hasFavorable: criteria.hasFavorable,
    favorableCount: criteria.favorableCount,
    mismatchTotal,
    mismatchShown,
    majorReserveCount:
      reservesShownFacts.filter((f) => f.materialityTier !== "secondary").length +
      reserveComps.filter((c) => c.materialityTier !== "secondary").length,
    reservesShown: reservesShownFacts.length + reserveComps.length,
  });

  return {
    scope,
    conclusionState: state,
    conclusion: narrativePlan.blocks.map((b) => b.fallbackText).join(" "),
    narrativePlan,
    criteria,
    conclusionBasis: {
      // Les absorbés fondent toujours la conclusion : leurs ids restent dans factIds, et les preuves
      // des compositions affichées (les deux côtés, ou l'état commun) entrent dans evidence.
      ruleIds: [...new Set([...shown.map((f) => f.ruleId), ...shownComps.flatMap((c) => c.referencedRuleIds)])],
      factIds: [...shown.map((f) => f.id), ...shownComps.flatMap((c) => c.absorbedFactIds)],
      evidence: [
        ...shown.flatMap(factEvidence),
        ...shownComps.flatMap((c) => {
          if (c.kind === "tradeoff") return [...c.favorableSide.evidence, ...c.unfavorableSide.evidence];
          if (c.kind === "grouped_verification") return c.items.flatMap((i) => i.evidence);
          return c.sharedEvidence;
        }),
      ],
    },
    sections,
    compositions: shownComps,
    absorbedFacts: run.facts.filter((f) => absorbed.has(f.id)),
    presentation: { elementaryFactShown: shown.length, compositionShown: shownComps.length, absorbedFactTotal: absorbed.size },
    uncovered,
  };
}
