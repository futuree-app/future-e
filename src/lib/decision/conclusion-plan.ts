// Le PLAN NARRATIF : ce que le déterministe a décidé, avant qu'un LLM n'ouvre la bouche (slice 2).
// Il porte la présence, l'ORDRE, les sources, la matière obligatoire et le texte de repli de chaque
// registre. L'IA reçoit ce plan et ne renvoie que { key, text }. Fonctions PURES, aucun LLM.
//
// La hiérarchie éditoriale des réserves (du plus grave au moins grave) :
//   1. verdict                     l'état de conclusion, borné au périmètre réellement examiné
//   2. unexamined_hard_constraints une condition ABSOLUE n'a pas pu être testée : elle diminue la
//                                  valeur du verdict, donc elle le suit immédiatement
//   3. reserves_found              ce qu'on a examiné et qui appelle un regard
//   4. uncovered_priorities        réduit la personnalisation, n'invalide pas le verdict
// Une contrainte dure non examinée et une préférence non couverte sont deux absences de couverture.
// Elles ne partagent JAMAIS le même bloc.
import type { DecisionFact, ConclusionState, MaterialityTier, UncoveredConstraint } from "./decision-fact.ts";
import type { ProjectPosture } from "../user-project.ts";

export type BlockKey = "verdict" | "unexamined_hard_constraints" | "reserves_found" | "uncovered_priorities";

export type NarrativeBlock = {
  key: BlockKey;
  fallbackText: string;      // le texte déterministe de CE registre, affichable seul
  sourceIds: string[];       // factIds / HardConstraintKey / PreferenceKey. JAMAIS produits par l'IA.
  requiredPhrases: string[]; // matière qui doit SURVIVRE à la rédaction, textuellement
  maxChars: number;
  generable: boolean;        // false = déterministe, hors de portée du modèle
};

// Le fait saillant est DÉSIGNÉ par le déterministe, jamais élu par l'IA. `tied` existe parce que
// prendre le premier d'un tri à égalité transformerait un ordre de DÉCLARATION dans le registre en
// PRIORITÉ MÉTIER : si deux faits sont decision_critical, écrire « à commencer par le PPRN » ment.
export type LeadSelection =
  | { kind: "single"; factId: string; statement: string; materialityTier: MaterialityTier }
  | { kind: "tied"; factIds: string[]; materialityTier: MaterialityTier }
  | { kind: "none" };

export type ConclusionNarrativePlan = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  blocks: NarrativeBlock[];
  reservesCount: number; // faits AFFICHÉS (post-caps), jamais faits émis
  lead: LeadSelection;
};

// Ce que l'assembleur fournit. Un `Dossier` ne peut pas être l'entrée : il PORTERA ce plan (cycle).
export type ConclusionPlanInput = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  shownFacts: DecisionFact[]; // les faits réellement affichés, après plafonnement des sections
  uncovered: UncoveredConstraint[];
  uncoveredPriorities: { key: string; label: string }[];
  establishedIncompatibility: { factId: string; statement: string } | null;
};

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
const RESERVE_ROLES = new Set<DecisionFact["role"]>(["verification", "compromise", "unknown"]);

function reserves(facts: DecisionFact[]): DecisionFact[] {
  return facts.filter((f) => RESERVE_ROLES.has(f.role));
}

export function selectLead(shownFacts: DecisionFact[]): LeadSelection {
  const rs = reserves(shownFacts);
  if (rs.length === 0) return { kind: "none" };
  const best = Math.min(...rs.map((f) => TIER_ORDER[f.materialityTier]));
  // secondary ne couronne rien : il n'y a alors rien d'assez matériel pour être cité.
  if (best === TIER_ORDER.secondary) return { kind: "none" };
  const top = rs.filter((f) => TIER_ORDER[f.materialityTier] === best);
  if (top.length === 1) {
    const f = top[0]!;
    return { kind: "single", factId: f.id, statement: f.statement, materialityTier: f.materialityTier };
  }
  return { kind: "tied", factIds: top.map((f) => f.id), materialityTier: top[0]!.materialityTier };
}

function verdictText(input: ConclusionPlanInput): string {
  const scope = input.scope === "commune+adresse"
    ? "À l'échelle de la commune et de l'adresse,"
    : "À l'échelle de la commune,";
  switch (input.conclusionState) {
    case "project_not_structured":
      return "Décrivez votre projet pour une lecture qui met en regard ce lieu et ce qui compte pour vous.";
    case "established_incompatibility":
      return `${scope} une contrainte que vous avez déclarée n'est pas respectée ici : ${input.establishedIncompatibility?.statement ?? ""}`;
    case "insufficient_evidence":
      return `${scope} nous ne pouvons pas conclure honnêtement : une donnée déterminante pour votre projet manque.`;
    case "no_hard_constraint_declared":
      return `Vous n'avez déclaré aucune condition comme absolument non négociable. ${scope} rien ne permet donc d'écarter ce lieu sur cette seule base.`;
    case "no_incompatibility_established":
      return `${scope} sur les contraintes que nous savons examiner, aucune n'est contredite.`;
  }
}

export function buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan {
  // LE VERDICT N'EST JAMAIS GÉNÉRÉ. C'est la phrase qui peut renverser une décision perçue : un
  // modèle qui reformulerait « aucune contrainte n'est contredite » en « ce lieu vous correspond »
  // mentirait sur ce qui a été établi, et aucune validation structurelle ne le verrait passer. Il le
  // reçoit en lecture seule, pour que les registres suivants s'y articulent.
  const blocks: NarrativeBlock[] = [{
    key: "verdict",
    fallbackText: verdictText(input),
    sourceIds: input.establishedIncompatibility ? [input.establishedIncompatibility.factId] : [],
    requiredPhrases: [],
    maxChars: 320,
    generable: false,
  }];

  // Un projet non structuré n'est pas une analyse, c'est une invite. Aucun autre registre.
  if (input.conclusionState === "project_not_structured") {
    return {
      scope: input.scope, conclusionState: input.conclusionState, posture: input.posture,
      blocks, reservesCount: 0, lead: { kind: "none" },
    };
  }

  if (input.uncovered.length > 0) {
    blocks.push({
      key: "unexamined_hard_constraints",
      fallbackText: `Nous n'avons pas encore examiné, à ce grain : ${input.uncovered.map((u) => u.label).join(", ")}.`,
      sourceIds: input.uncovered.map((u) => u.key),
      // Chaque contrainte doit SURVIVRE à la rédaction : « une condition importante reste à examiner »
      // ferait disparaître la gare, sans qu'aucune autre validation ne s'en aperçoive.
      requiredPhrases: input.uncovered.map((u) => u.label),
      maxChars: 260,
      generable: true,
    });
  }

  const rs = reserves(input.shownFacts);
  const lead = selectLead(input.shownFacts);
  if (rs.length > 0) {
    const n = rs.length;
    blocks.push({
      key: "reserves_found",
      fallbackText: `${n} point${n > 1 ? "s" : ""} mérite${n > 1 ? "nt" : ""} d'être examiné${n > 1 ? "s" : ""} de près.`,
      sourceIds: rs.map((f) => f.id),
      // Le nombre exact, et le constat du fait saillant quand il y en a un. `tied` n'en couronne aucun.
      requiredPhrases: lead.kind === "single" ? [String(n), lead.statement] : [String(n)],
      maxChars: 300,
      generable: true,
    });
  }

  if (input.uncoveredPriorities.length > 0) {
    const top = input.uncoveredPriorities.slice(0, 3);
    blocks.push({
      key: "uncovered_priorities",
      fallbackText: `Vos priorités concernant ${top.map((p) => p.label).join(", ")} ne sont pas encore couvertes dans cette synthèse.`,
      sourceIds: top.map((p) => p.key),
      requiredPhrases: top.map((p) => p.label),
      maxChars: 260,
      generable: true,
    });
  }

  return {
    scope: input.scope,
    conclusionState: input.conclusionState,
    posture: input.posture,
    blocks,
    reservesCount: rs.length,
    lead,
  };
}

// LA RÈGLE : on appelle l'IA seulement quand plusieurs éléments DÉJÀ HIÉRARCHISÉS doivent être
// articulés. Jamais pour maquiller un dossier pauvre : reformuler brillamment « verdict + vos
// priorités ne sont pas couvertes » ne ferait que rendre élégante une absence de couverture.
// Le nombre brut de blocs n'est donc pas l'indicateur.
export function shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean {
  if (plan.conclusionState === "project_not_structured") return false;

  const generable = plan.blocks.filter((b) => b.generable).length;
  if (generable >= 2) return true;                                          // deux registres à articuler
  if (plan.reservesCount >= 3) return true;                                 // beaucoup de réserves à ordonner
  if (plan.reservesCount >= 2 && plan.lead.kind === "single") return true;  // une réserve domine : à dire
  return false;
}
