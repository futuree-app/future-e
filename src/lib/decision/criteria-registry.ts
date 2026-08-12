// LE REGISTRE DES CRITÈRES DÉCLARÉS. Lib PURE, aucun LLM.
//
// La couverture et l'orientation ne se calculent NI sur le nombre de règles, NI sur le nombre de faits
// émis, NI sur le nombre de cartes affichées : elles se calculent sur ce que le LECTEUR a déclaré. Une
// préférence peut être touchée par trois règles, produire deux faits et une évaluation silencieuse :
// elle reste UNE priorité, et elle pèse UNE fois.
//
// Cette couche remplace COVERED_PREFERENCE_KEYS, une liste qu'il fallait tenir à la main : le jour où
// l'on ajoutait une règle sans y penser, le dossier annonçait au lecteur que sa priorité n'était pas
// couverte alors qu'elle venait d'être examinée. La couverture est désormais une CONSÉQUENCE OBSERVÉE
// des règles, plus une déclaration parallèle qui dérive en silence.
import type { MaterialityTier, RunResult, RuleEvaluation, HardConstraintKey } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, hardConstraintLabel } from "./project-view.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";

export type CriterionCoverage = "examined" | "unexamined";

/**
 * POURQUOI UN CRITÈRE N'A PAS ÉTÉ EXAMINÉ, ET LA DISTINCTION N'EST PAS COSMÉTIQUE (13/08/2026).
 *
 * Deux situations très différentes se disaient d'une seule phrase (« pas encore couvertes dans cette
 * synthèse ») :
 *
 * — `no_rule` : AUCUNE règle ne sait examiner ce critère. C'est un état du PRODUIT, valable partout
 *   et pour tout le monde. `faible_pression_agricole` en est le cas type : aucun seuil défendable au
 *   grain commune, décision documentée dans `sante-facts.ts`.
 *
 * — `inconclusive` : une règle s'est bien appliquée, et n'a pas pu conclure ICI (`unknown` ou
 *   `uncertain`) : la donnée manque sur cette commune, ou elle a été lue à une échelle qui ne
 *   conclut pas au grain demandé. C'est un état de CE LIEU, ou de ce dossier.
 *
 * Le lecteur qui lit la même phrase dans les deux cas ne peut pas savoir s'il attend une évolution
 * du produit ou s'il vient de rencontrer une limite de la donnée sur sa commune. Le cas qui a rendu
 * la confusion visible : le calme sonore à Nantes, où la règle tourne, ne trouve aucune
 * infrastructure nommable près du point de référence, et refuse de conclure dès qu'une adresse est
 * en jeu.
 *
 * CE QUE CETTE DISTINCTION NE DIT PAS ENCORE : au sein de `inconclusive`, « la donnée manque » et
 * « la donnée a été lue mais ne conclut pas à ce grain » restent confondues. `unknown` et
 * `uncertain` les sépareraient, mais les règles ne les emploient pas encore de façon cohérente
 * (`ruleBruit` rend `uncertain` dans les deux cas). À reprendre le jour où les règles trancheront.
 */
export type UnexaminedReason = "no_rule" | "inconclusive";
export type CriterionOutcome = "favorable" | "reserve" | "mismatch" | "incompatible" | "indeterminate";

export type ProjectCriterionAssessment = {
  criterionKey: string;
  kind: "hard_constraint" | "preference";
  label: string;
  coverage: CriterionCoverage;
  /** `null` quand le critère est examiné. Voir `UnexaminedReason`. */
  unexaminedReason: UnexaminedReason | null;
  outcome: CriterionOutcome;
  maxReserveTier: MaterialityTier | null; // matérialité maximale des RÉSERVES de ce critère
  ruleIds: string[];
};

export type CoverageLevel = "none" | "partial" | "high";
export type Orientation =
  | "favorable" | "neutral" | "minor_reserves" | "major_reserves" | "arbitration" | "incompatible" | "indeterminate";

export type CriteriaSummary = {
  registry: ProjectCriterionAssessment[];
  coverage: CoverageLevel;
  orientation: Orientation;
  hasFavorable: boolean;
  mismatchStructuring: number;
  mismatchSecondary: number;
  // COMBIEN de critères sont favorables, pas seulement « au moins un » : la phrase « ce lieu répond à
  // plusieurs dimensions de votre projet » exige >= 2 pour être vraie. Un booléen l'aurait laissée
  // s'écrire sur un unique critère satisfait.
  favorableCount: number;
};

// Une DÉCISION, pas une intuition. Elle vit ici, nommée, couverte par une table de vérité : sinon
// « couverture élevée » redevient une décision éditoriale dispersée dans le code.
export const COVERAGE_HIGH_THRESHOLD = 0.7;

// Un outcome EXPLOITABLE prouve que le critère a été regardé. `unknown` / `uncertain` disent que la
// donnée manque, `not_applicable` que la règle est hors sujet : aucun des deux n'est un examen.
// mismatch et neutral prouvent l'examen (la couverture monte). RESERVE_OUTCOMES inchangé : un mismatch
// n'est PAS une réserve (il ne s'arbitre, il ne se vérifie pas).
const EXPLOITABLE = new Set<RuleEvaluation["outcome"]>([
  "satisfied", "incompatible", "compromise", "verification", "mismatch", "neutral",
]);
const RESERVE_OUTCOMES = new Set<RuleEvaluation["outcome"]>(["compromise", "verification"]);
const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
// mismatch se range entre incompatible et reserve : plus grave qu'une réserve pour l'ADÉQUATION, mais
// jamais éliminatoire.
const OUTCOME_RANK: Record<CriterionOutcome, number> =
  { incompatible: 0, mismatch: 1, reserve: 2, favorable: 3, indeterminate: 4 };

function worse(a: CriterionOutcome, b: CriterionOutcome): CriterionOutcome {
  return OUTCOME_RANK[a] <= OUTCOME_RANK[b] ? a : b;
}

function assess(
  criterionKey: string,
  kind: "hard_constraint" | "preference",
  label: string,
  evaluations: RuleEvaluation[],
): ProjectCriterionAssessment {
  const mine = evaluations.filter((e) => e.projectKeys.includes(criterionKey));
  const exploitable = mine.filter((e) => EXPLOITABLE.has(e.outcome));

  let outcome: CriterionOutcome = "indeterminate";
  let maxReserveTier: MaterialityTier | null = null;

  for (const e of exploitable) {
    if (e.outcome === "incompatible") {
      outcome = worse(outcome, "incompatible");
    } else if (RESERVE_OUTCOMES.has(e.outcome)) {
      outcome = worse(outcome, "reserve");
      for (const f of e.facts) {
        if (maxReserveTier == null || TIER_RANK[f.materialityTier] < TIER_RANK[maxReserveTier]) {
          maxReserveTier = f.materialityTier;
        }
      }
    } else if (e.outcome === "mismatch") {
      outcome = worse(outcome, "mismatch");
    } else if (e.outcome === "satisfied") {
      outcome = worse(outcome, "favorable");
    }
    // neutral : ni favorable, ni réserve, ni mismatch. Il ne change pas l'outcome, mais il a rendu le
    // critère EXPLOITABLE, donc examiné (la couverture monte).
  }

  // `unknown` / `uncertain` disent qu'une règle S'EST APPLIQUÉE sans conclure ; `not_applicable` dit
  // qu'elle est hors sujet (cf. la table des outcomes, `decision-fact.ts`). C'est là toute la
  // distinction, et elle est déjà structurée : rien à ajouter aux règles.
  const tentee = mine.some((e) => e.outcome === "unknown" || e.outcome === "uncertain");
  const examine = exploitable.length > 0;

  return {
    criterionKey, kind, label,
    coverage: examine ? "examined" : "unexamined",
    unexaminedReason: examine ? null : tentee ? "inconclusive" : "no_rule",
    outcome,
    maxReserveTier,
    ruleIds: mine.map((e) => e.ruleId),
  };
}

export function buildCriteriaRegistry(project: UserProject, run: RunResult): CriteriaSummary {
  const registry: ProjectCriterionAssessment[] = [
    // Le libellé INSTANCIÉ : « la proximité de la gare Matabiau », pas « la proximité d'un lieu ».
    ...declaredHardConstraintKeys(project).map((k) =>
      assess(k, "hard_constraint", hardConstraintLabel(project, k), run.evaluations)),
    ...declaredPreferenceKeys(project).map((k) =>
      assess(k, "preference", PREFERENCE_LABELS[k] ?? String(k), run.evaluations)),
  ];

  const examined = registry.filter((c) => c.coverage === "examined");
  const hardUnexamined = registry.some((c) => c.kind === "hard_constraint" && c.coverage === "unexamined");
  const ratio = registry.length === 0 ? 0 : examined.length / registry.length;

  // LE COUPERET. Tant qu'une condition ABSOLUE n'a jamais été testée, la couverture ne peut pas être
  // dite élevée, quel que soit le ratio : un « 8 préférences sur 10 » ne rachète pas la seule condition
  // non négociable du lecteur, restée muette.
  const coverage: CoverageLevel =
    examined.length === 0 ? "none"
    : !hardUnexamined && ratio >= COVERAGE_HIGH_THRESHOLD ? "high"
    : "partial";

  const favorableCount = examined.filter((c) => c.outcome === "favorable").length;

  // L'ARBITRAGE dérive d'un ENSEMBLE MATÉRIEL de mismatchs, comptés sur les FAITS (run.facts), jamais sur
  // les évaluations : un mismatch de poids 1 est un outcome mais ne produit aucun fait, il ne compte donc
  // pas. Un mismatch structurant, ou deux secondaires, suffisent.
  const mismatchFacts = run.facts.filter((f) => f.role === "mismatch");
  const mismatchStructuring = mismatchFacts.filter((f) => f.materialityTier === "structuring").length;
  const mismatchSecondary = mismatchFacts.filter((f) => f.materialityTier === "secondary").length;
  const requiresArbitration = mismatchStructuring > 0 || mismatchSecondary >= 2;

  // L'ordre est NORMATIF : le premier qui matche gagne. Ce n'est PAS un solde : rien ne compense.
  // `favorable` exige un signal favorable MATÉRIEL ; sinon, examiné mais sans signal -> `neutral` (jamais
  // `favorable`, qui promettrait une correspondance, ni `indeterminate`, qui dirait « pas su examiner »).
  const orientation: Orientation =
    examined.some((c) => c.outcome === "incompatible") ? "incompatible"
    : examined.length === 0 ? "indeterminate"
    : requiresArbitration ? "arbitration"
    : examined.some((c) => c.maxReserveTier != null && c.maxReserveTier !== "secondary") ? "major_reserves"
    : examined.some((c) => c.outcome === "reserve") ? "minor_reserves"
    : favorableCount > 0 ? "favorable"
    : "neutral";

  return {
    registry, coverage, orientation, hasFavorable: favorableCount > 0, favorableCount,
    mismatchStructuring, mismatchSecondary,
  };
}

/** Les priorités qu'AUCUNE règle ne sait examiner : une limite du produit, la même partout. */
export function uncoveredPreferences(summary: CriteriaSummary): { key: string; label: string }[] {
  return summary.registry
    .filter((c) => c.kind === "preference" && c.unexaminedReason === "no_rule")
    .map((c) => ({ key: c.criterionKey, label: c.label }));
}

/** Les priorités qu'une règle a bien évaluées, sans pouvoir conclure ICI : une limite de ce lieu. */
export function inconclusivePreferences(summary: CriteriaSummary): { key: string; label: string }[] {
  return summary.registry
    .filter((c) => c.kind === "preference" && c.unexaminedReason === "inconclusive")
    .map((c) => ({ key: c.criterionKey, label: c.label }));
}

// LES CONTRAINTES DURES NE SE SÉPARENT PAS, et c'est délibéré : une condition non négociable jamais
// testée réduit la portée du verdict, que la règle soit absente ou muette. Le lecteur doit la
// vérifier lui-même dans les deux cas, donc la phrase est la même.
export function uncoveredConstraints(summary: CriteriaSummary): { key: HardConstraintKey; label: string }[] {
  return summary.registry
    .filter((c) => c.kind === "hard_constraint" && c.coverage === "unexamined")
    .map((c) => ({ key: c.criterionKey as HardConstraintKey, label: c.label }));
}
