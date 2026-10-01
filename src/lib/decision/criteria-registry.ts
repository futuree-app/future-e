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
import type { MaterialityTier, RunResult, RuleEvaluation, UncoveredConstraint } from "./decision-fact.ts";
import type { UserProject, CriterionRef } from "../user-project.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, hardConstraintLabel } from "./project-view.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";
import { isConfirmed } from "./conditions.ts";
import { criterionCapability, type Capability, type CapabilityReason, type EvaluationGrain } from "./capability.ts";

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
// `to_confirm` (FUT-7) : une condition CONFIRMÉE que futur•e ne sait qu'apprécier. Examinée, elle reste
// ouverte : ni un blocage, ni un écart ordinaire.
export type CriterionOutcome = "favorable" | "reserve" | "mismatch" | "incompatible" | "to_confirm" | "indeterminate";

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
  // TROIS AXES INDÉPENDANTS (FUT-7). L'importance (le poids) vit dans le projet et règle la matérialité
  // des faits ; la CONFIRMATION est l'acte du lecteur ; la CAPACITÉ est ce que futur•e sait établir.
  // Aucun ne se déduit des deux autres, et aucun ne passe par `materialityTier`.
  confirmed: boolean;
  capability: Capability;
  capabilityReason: CapabilityReason;
};

// UNE CONDITION SANS COMPROMIS RESTÉE OUVERTE. Trois causes, qui ne se disent pas de la même phrase :
//   a_confirmer     futur•e l'a appréciée, sans pouvoir trancher (une carte « À confirmer » la porte) ;
//   ne_pas_mesurer  futur•e ne sait pas encore l'évaluer, ici comme ailleurs ;
//   donnee_absente  futur•e sait l'évaluer, mais la donnée manque ici.
export type OpenCondition = {
  key: string; label: string; kind: "hard_constraint" | "preference";
  cause: "a_confirmer" | "ne_pas_mesurer" | "donnee_absente";
};

export type CoverageLevel = "none" | "partial" | "high";
export type Orientation =
  | "favorable" | "neutral" | "minor_reserves" | "major_reserves" | "arbitration" | "incompatible" | "indeterminate"
  // FUT-7 : une condition sans compromis reste ouverte. Plus lourd qu'un arbitrage, jamais un blocage.
  | "condition_to_confirm";

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
  // Les conditions confirmées encore ouvertes, et celles qui sont remplies (confirmées, tranchées,
  // satisfaites). Le verdict s'en sert pour ne jamais écrire « vos conditions sont remplies » au-dessus
  // d'une condition qui ne l'est pas.
  openConditions: OpenCondition[];
  metConditions: { key: string; label: string }[];
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
  // FUT-7 : une condition appréciée a été examinée ; un signal non matérialisé à ce poids aussi.
  "condition_check", "not_surfaced",
]);
const RESERVE_OUTCOMES = new Set<RuleEvaluation["outcome"]>(["compromise", "verification"]);
const TIER_RANK: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
// mismatch se range entre incompatible et reserve : plus grave qu'une réserve pour l'ADÉQUATION, mais
// jamais éliminatoire.
// `to_confirm` passe devant l'écart : le lecteur a dit que ce critère n'admettait pas de compromis.
const OUTCOME_RANK: Record<CriterionOutcome, number> =
  { incompatible: 0, to_confirm: 1, mismatch: 2, reserve: 3, favorable: 4, indeterminate: 5 };

function worse(a: CriterionOutcome, b: CriterionOutcome): CriterionOutcome {
  return OUTCOME_RANK[a] <= OUTCOME_RANK[b] ? a : b;
}

function assess(
  criterionKey: string,
  kind: "hard_constraint" | "preference",
  label: string,
  evaluations: RuleEvaluation[],
  axes: { confirmed: boolean; capability: Capability; capabilityReason: CapabilityReason },
): ProjectCriterionAssessment {
  const mine = evaluations.filter((e) => e.projectKeys.includes(criterionKey));
  const exploitable = mine.filter((e) => EXPLOITABLE.has(e.outcome));

  let outcome: CriterionOutcome = "indeterminate";
  let maxReserveTier: MaterialityTier | null = null;

  for (const e of exploitable) {
    if (e.outcome === "incompatible") {
      outcome = worse(outcome, "incompatible");
    } else if (e.outcome === "condition_check") {
      outcome = worse(outcome, "to_confirm");
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
    ...axes,
  };
}

// `grain` : le grain évalué (commune, ou commune + adresse). Il entre dans la CAPACITÉ (un temps de trajet
// se tranche à l'adresse, pas au point de référence de la commune), jamais dans l'issue.
export function buildCriteriaRegistry(
  project: UserProject, run: RunResult, grain: EvaluationGrain = "commune",
): CriteriaSummary {
  const hc = project.parsed?.hardConstraints ?? {};
  const axes = (ref: CriterionRef) => {
    const c = criterionCapability(ref.kind === "hard" ? { kind: "hard", key: ref.key, hc } : ref, grain);
    return { confirmed: isConfirmed(project, ref), capability: c.capability, capabilityReason: c.reason };
  };
  const registry: ProjectCriterionAssessment[] = [
    // Le libellé INSTANCIÉ : « la proximité de la gare Matabiau », pas « la proximité d'un lieu ».
    ...declaredHardConstraintKeys(project).map((k) =>
      assess(k, "hard_constraint", hardConstraintLabel(project, k), run.evaluations, axes({ kind: "hard", key: k }))),
    ...declaredPreferenceKeys(project).map((k) =>
      assess(k, "preference", PREFERENCE_LABELS[k] ?? String(k), run.evaluations, axes({ kind: "preference", key: k }))),
  ];

  const examined = registry.filter((c) => c.coverage === "examined");
  const ratio = registry.length === 0 ? 0 : examined.length / registry.length;

  // LES CONDITIONS OUVERTES (FUT-7) : confirmées par le lecteur, et ni tranchées ni remplies.
  const openConditions: OpenCondition[] = registry
    .filter((c) => c.confirmed && (c.outcome === "to_confirm" || c.coverage === "unexamined"))
    .map((c) => ({
      key: c.criterionKey, label: c.label, kind: c.kind,
      cause: c.outcome === "to_confirm" ? "a_confirmer"
        : c.capability === "ne_pas_mesurer" ? "ne_pas_mesurer"
        : "donnee_absente",
    }));
  const metConditions = registry
    .filter((c) => c.confirmed && c.capability === "trancher" && c.coverage === "examined" && c.outcome === "favorable")
    .map((c) => ({ key: c.criterionKey, label: c.label }));

  // LE COUPERET. Tant qu'une condition SANS COMPROMIS n'a pas été examinée, la couverture ne peut pas être
  // dite élevée, quel que soit le ratio : un « 8 préférences sur 10 » ne rachète pas la seule condition
  // du lecteur, restée muette. Depuis FUT-7, ce sont les conditions CONFIRMÉES qui le déclenchent : un
  // critère géographique non confirmé est un critère comme un autre.
  const conditionNonExaminee = registry.some((c) => c.confirmed && c.coverage === "unexamined");
  const coverage: CoverageLevel =
    examined.length === 0 ? "none"
    : !conditionNonExaminee && ratio >= COVERAGE_HIGH_THRESHOLD ? "high"
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
    // Une condition ouverte passe AVANT tout le reste, « indéterminé » compris : le lecteur doit lire en
    // premier que la condition qu'il a posée n'est pas établie, et pourquoi.
    : openConditions.length > 0 ? "condition_to_confirm"
    : examined.length === 0 ? "indeterminate"
    : requiresArbitration ? "arbitration"
    : examined.some((c) => c.maxReserveTier != null && c.maxReserveTier !== "secondary") ? "major_reserves"
    : examined.some((c) => c.outcome === "reserve") ? "minor_reserves"
    : favorableCount > 0 ? "favorable"
    : "neutral";

  return {
    registry, coverage, orientation, hasFavorable: favorableCount > 0, favorableCount,
    mismatchStructuring, mismatchSecondary, openConditions, metConditions,
  };
}

// LES CRITÈRES NON CONFIRMÉS restés non examinés, préférences et critères géographiques confondus :
// depuis FUT-7, un critère géographique non confirmé est un critère du projet comme un autre.

/** Les priorités qu'AUCUNE règle ne sait examiner : une limite du produit, la même partout. */
export function uncoveredPreferences(summary: CriteriaSummary): { key: string; label: string }[] {
  return summary.registry
    .filter((c) => !c.confirmed && c.unexaminedReason === "no_rule")
    .map((c) => ({ key: c.criterionKey, label: c.label }));
}

/** Les priorités qu'une règle a bien évaluées, sans pouvoir conclure ICI : une limite de ce lieu. */
export function inconclusivePreferences(summary: CriteriaSummary): { key: string; label: string }[] {
  return summary.registry
    .filter((c) => !c.confirmed && c.unexaminedReason === "inconclusive")
    .map((c) => ({ key: c.criterionKey, label: c.label }));
}

// LES CONDITIONS CONFIRMÉES QUI N'ONT PAS PU ÊTRE EXAMINÉES. Elles réduisent la portée du verdict, et le
// lecteur doit savoir laquelle des deux limites il rencontre : futur•e ne sait pas encore les évaluer, ou
// la donnée manque ici. Les conditions APPRÉCIÉES n'y sont pas : leur carte « À confirmer » les porte.
export function uncoveredConstraints(summary: CriteriaSummary): UncoveredConstraint[] {
  return summary.openConditions
    .filter((c) => c.cause !== "a_confirmer")
    .map((c) => ({ key: c.key, label: c.label, cause: c.cause as UncoveredConstraint["cause"] }));
}
