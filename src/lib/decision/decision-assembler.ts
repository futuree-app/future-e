// Assembleur PUR : états de conclusion HONNÊTES (périmètre communal, deux vides distincts,
// project_not_structured), couverture nommée, hiérarchie plafonnée. Aucun LLM.
import type {
  DecisionFact, Dossier, DossierSection, ConclusionState, RunResult, EvidenceRef, MaterialityTier,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { hasAnyHardConstraint, isStructured, uncoveredConstraints, uncoveredPreferences } from "./project-view.ts";

function labels(project: UserProject): { engage: string; verifTitle: string } {
  if (project.posture === "habitant") {
    return { engage: "comprendre et surveiller", verifTitle: "Ce que ces données invitent à comprendre ou surveiller" };
  }
  return { engage: "vous engager", verifTitle: "À vérifier avant de vous engager" };
}

const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
function tierRank(f: DecisionFact): number {
  const base = TIER_RANK[f.materialityTier] * 2;
  return f.role === "incompatibility" && f.evidenceStrength === "indicative" ? base + 1 : base;
}
function byRole(facts: DecisionFact[], role: DecisionFact["role"], cap: number): DecisionFact[] {
  return facts.filter((f) => f.role === role).sort((a, b) => tierRank(a) - tierRank(b)).slice(0, cap);
}

function conclusionState(facts: DecisionFact[], project: UserProject): ConclusionState {
  if (!isStructured(project)) return "project_not_structured";
  if (facts.some((f) => f.role === "incompatibility" && f.evidenceStrength === "established")) return "established_incompatibility";
  if (facts.some((f) => f.role === "unknown" && f.impact === "blocking")) return "insufficient_evidence";
  if (!hasAnyHardConstraint(project)) return "no_hard_constraint_declared";
  return "no_incompatibility_established";
}

function examinedClause(uncovered: { label: string }[]): string {
  return uncovered.length === 0 ? "" : ` Nous n'avons pas encore examiné, à ce grain : ${uncovered.map((u) => u.label).join(", ")}.`;
}

function conclusionText(state: ConclusionState, facts: DecisionFact[], project: UserProject, uncovered: { label: string }[]): string {
  const scope = "À l'échelle de la commune,";
  const l = labels(project);
  switch (state) {
    case "project_not_structured":
      return "Décrivez votre projet pour une lecture qui met en regard ce lieu et ce qui compte pour vous.";
    case "established_incompatibility": {
      const f = facts.find((x) => x.role === "incompatibility" && x.evidenceStrength === "established");
      return `${scope} une contrainte que vous avez déclarée n'est pas respectée ici : ${f ? f.statement : ""}`;
    }
    case "insufficient_evidence":
      return `${scope} nous ne pouvons pas conclure honnêtement : une donnée déterminante pour votre projet manque.`;
    case "no_hard_constraint_declared":
      return `Vous n'avez posé aucune condition non négociable, donc rien ne disqualifie ce lieu d'emblée. ${scope} les données examinées ne font ressortir aucun point éliminatoire pour votre projet.${examinedClause(uncovered)}`;
    case "no_incompatibility_established": {
      const nReserves = facts.filter((x) => x.role === "verification" || x.role === "compromise" || x.role === "unknown").length;
      const base = `${scope} sur les contraintes que nous savons examiner, aucune n'est contredite.`;
      const tail = nReserves > 0 ? ` ${nReserves} point${nReserves > 1 ? "s" : ""} restent à examiner avant de ${l.engage}.` : "";
      return base + tail + examinedClause(uncovered);
    }
  }
}

function factEvidence(f: DecisionFact): EvidenceRef[] {
  return f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence;
}

export function assembleDossier(run: RunResult, project: UserProject, scope: "commune" | "commune+adresse"): Dossier {
  const { facts, coveredHardConstraints } = run;
  const uncovered = uncoveredConstraints(project, coveredHardConstraints);
  const uncoveredPriorities = uncoveredPreferences(project);
  const state = conclusionState(facts, project);
  const l = labels(project);
  const candidates: DossierSection[] = [
    { key: "incompatibilities", title: "Vos contraintes non négociables", facts: byRole(facts, "incompatibility", 2) },
    { key: "compromises", title: "Ce qui départage vraiment", facts: byRole(facts, "compromise", 3) },
    { key: "unknowns", title: "Ce que nous ne savons pas encore", facts: byRole(facts, "unknown", 3) },
    { key: "verifications", title: l.verifTitle, facts: byRole(facts, "verification", 4) },
  ];
  const sections = candidates.filter((s) => s.facts.length > 0);
  const shown = sections.flatMap((s) => s.facts);
  return {
    scope,
    conclusionState: state,
    conclusion: conclusionText(state, facts, project, uncovered),
    conclusionBasis: {
      ruleIds: [...new Set(shown.map((f) => f.ruleId))],
      factIds: shown.map((f) => f.id),
      evidence: shown.flatMap(factEvidence),
    },
    sections,
    uncovered,
    uncoveredPriorities,
  };
}
