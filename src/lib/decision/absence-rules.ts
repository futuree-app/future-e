// LA FABRIQUE DES RÈGLES D'ABSENCE ATTESTÉE (named_absence). PURE.
//
// Doctrine ASYMÉTRIQUE : absence attestée -> mismatch ; élément présent -> neutral (silencieux) ; non mesuré
// -> uncertain. JAMAIS satisfied. Le POIDS gouverne la matérialité (poids 1 = silencieux), jamais l'examen.
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  classifyNetworkAbsence, classifyHigherEdAbsence, NETWORK_CONVENTION_ID, HIGHER_ED_CONVENTION_ID,
  ABSENCE_NATIONAL_CONTEXT, type AbsenceVerdict, type NamedAbsenceBasis,
} from "./absence-facts.ts";

const territoireHref = "/rapport/quartier";

type AbsenceSpec = {
  key: PreferenceKey;
  topic: string;
  observedStateId: NamedAbsenceBasis["observedStateId"];
  conventionId: string;
  nationalContext: NamedAbsenceBasis["nationalContext"];
  classify: (f: ModuleFacts) => AbsenceVerdict;
  observedValue: (f: ModuleFacts) => string;
  statement: (nom: string, f: ModuleFacts) => string;
  limitation: string;
};

// Rayon effectif de la commune (pour la phrase études) : narrowing sûr, car statement/observedValue ne sont
// appelés qu'après un verdict "mismatch" (donc measured: true).
const radiusKmOf = (f: ModuleFacts): number => (f.higherEd.measured ? f.higherEd.radiusKm : 0);

const SPECS: AbsenceSpec[] = [
  {
    key: "mobilite_quotidienne",
    topic: "les transports en commun du quotidien",
    observedStateId: "network_below_daily_credibility_floor",
    conventionId: NETWORK_CONVENTION_ID,
    nationalContext: ABSENCE_NATIONAL_CONTEXT.network,
    classify: (f) => classifyNetworkAbsence(f.localNetwork),
    observedValue: () => "aucune desserte crédible à portée de marche",
    statement: (nom) =>
      `Vous avez placé les déplacements du quotidien sans voiture parmi vos priorités. Aucune desserte de transports en commun considérée comme praticable au quotidien n'est identifiée à distance de marche du point de référence retenu pour ${nom}. Cela répond moins bien à cette dimension de votre projet, sans rendre ${nom} incompatible avec lui.`,
    limitation:
      "Une desserte trop faible pour constituer une solution régulière au quotidien n'est pas comptée comme accessible. Cette situation concerne environ 83 % des communes françaises.",
  },
  {
    key: "vie_etudiante",
    topic: "les établissements du supérieur",
    observedStateId: "no_higher_education_establishment_in_radius",
    conventionId: HIGHER_ED_CONVENTION_ID,
    nationalContext: ABSENCE_NATIONAL_CONTEXT.higherEd,
    classify: (f) => classifyHigherEdAbsence(f.higherEd),
    observedValue: (f) => `aucun établissement du supérieur dans un rayon de ${radiusKmOf(f)} km`,
    statement: (nom, f) =>
      `Vous avez placé la présence d'un environnement étudiant parmi vos priorités. Aucun établissement d'enseignement supérieur n'est identifié dans un rayon de ${radiusKmOf(f)} km autour du point de référence retenu pour ${nom}. Cet indicateur répond moins bien à cette dimension de votre projet, sans permettre de conclure à l'absence de vie étudiante.`,
    limitation:
      "Une commune peut accueillir des étudiants ou bénéficier de l'influence d'un campus voisin sans accueillir elle-même d'établissement dans le périmètre mesuré.",
  },
];

export const ABSENCE_KEYS: PreferenceKey[] = SPECS.map((s) => s.key);

function makeAbsenceRule(spec: AbsenceSpec): DecisionRule {
  const id = `territoire.absence-${spec.key}`;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [spec.key], outcome, facts, reason });

      const weight = preferenceWeight(p, spec.key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const verdict = spec.classify(f);
      if (verdict === "uncertain") return ret("uncertain", [], "absence non attestée (donnée indisponible)");

      // neutral (présent) toujours silencieux ; mismatch de poids 1 examiné mais silencieux (non matériel).
      if (verdict !== "mismatch" || weight < 2) {
        return ret(verdict, [], verdict === "mismatch" ? "absence mineure, silencieuse (poids 1)" : "élément présent");
      }

      const tier = weight >= 3 ? "structuring" : "secondary";
      const ev: EvidenceRef = {
        factId: `absenceAttestation.${spec.key}`, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: spec.observedValue(f), grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${spec.key}`, ruleId: id, sourceFactIds: [`absenceAttestation.${spec.key}`],
        module: "territoire", role: "mismatch", projectKey: spec.key, materialityTier: tier,
        topic: spec.topic,
        statement: spec.statement(f.nom, f),
        basis: { kind: "named_absence", observedStateId: spec.observedStateId, conventionId: spec.conventionId, nationalContext: spec.nationalContext },
        evidence: [ev],
        limitation: spec.limitation,
      };
      return ret("mismatch", [fact], "absence attestée");
    },
  };
}

export const ABSENCE_RULES: DecisionRule[] = SPECS.map(makeAbsenceRule);
