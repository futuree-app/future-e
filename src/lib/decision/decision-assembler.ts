// Assembleur PUR : états de conclusion HONNÊTES (périmètre communal, deux vides distincts,
// project_not_structured), couverture nommée, hiérarchie plafonnée. Aucun LLM.
import type {
  DecisionFact, Dossier, DossierSection, ConclusionState, RunResult, EvidenceRef, MaterialityTier,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { hasAnyHardConstraint, isStructured } from "./project-view.ts";
import { buildCriteriaRegistry, uncoveredConstraints, uncoveredPreferences } from "./criteria-registry.ts";
import { buildConclusionPlan } from "./conclusion-plan.ts";

function labels(project: UserProject): { engage: string; verifTitle: string } {
  if (project.posture === "habitant") {
    return { engage: "comprendre et surveiller", verifTitle: "Ce que ces données invitent à comprendre ou surveiller" };
  }
  return { engage: "vous engager", verifTitle: "À examiner avant de vous engager" };
}

const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
const RESERVE_ROLES = new Set<DecisionFact["role"]>(["verification", "compromise", "unknown"]);
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
): Dossier {
  const { facts } = run;

  // La couverture est une CONSÉQUENCE OBSERVÉE des règles (criteria-registry), plus une liste tenue à
  // la main. `run.coveredHardConstraints` n'est plus consulté ici : il marque une contrainte « couverte »
  // dès que l'outcome n'est pas not_applicable, donc un `unknown` (population absente) la déclarait
  // examinée alors que rien ne l'avait été.
  const criteria = buildCriteriaRegistry(project, run);
  const uncovered = uncoveredConstraints(criteria);
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

  // Les réserves annoncées sont celles qu'on MONTRE. Compter `facts` (les faits ÉMIS) alors que les
  // sections sont plafonnées (caps 2/3/3/4) annonçait « 5 points » et n'en affichait que 4. Le verdict
  // compte donc lui aussi sur `shown` : le lecteur doit pouvoir compter les cartes et retomber dessus.
  const established = facts.find((f) => f.role === "incompatibility" && f.evidenceStrength === "established");
  const reservesShownFacts = shown.filter((f) => RESERVE_ROLES.has(f.role));
  const narrativePlan = buildConclusionPlan({
    scope,
    communeNom,
    conclusionState: state,
    posture: project.posture,
    shownFacts: shown,
    uncovered,
    uncoveredPriorities: uncoveredPreferences(criteria),
    establishedIncompatibility: established ? { factId: established.id, statement: established.statement } : null,
    coverage: criteria.coverage,
    orientation: criteria.orientation,
    hasFavorable: criteria.hasFavorable,
    favorableCount: criteria.favorableCount,
    majorReserveCount: reservesShownFacts.filter((f) => f.materialityTier !== "secondary").length,
    reservesShown: reservesShownFacts.length,
  });

  return {
    scope,
    conclusionState: state,
    conclusion: narrativePlan.blocks.map((b) => b.fallbackText).join(" "),
    narrativePlan,
    criteria,
    conclusionBasis: {
      ruleIds: [...new Set(shown.map((f) => f.ruleId))],
      factIds: shown.map((f) => f.id),
      evidence: shown.flatMap(factEvidence),
    },
    sections,
    uncovered,
  };
}
