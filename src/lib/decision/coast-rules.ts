// LA FABRIQUE DE LA RÈGLE DE PROXIMITÉ MER (absolute_measure). PURE.
//
// Doctrine SYMÉTRIQUE : la distance à la côte mesure DIRECTEMENT la qualité recherchée. Proche -> satisfied ;
// loin -> mismatch ; entre-deux -> neutral ; donnée absente/corrompue -> uncertain. satisfied/neutral sont
// SILENCIEUX (aucun fait) ; le POIDS gouverne la seule face mismatch (1 = silencieux, 2 = secondary, 3 =
// structuring). Jamais satisfied matériel : l'architecture n'a pas de fait favorable (cf. spec §7).
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { COAST_PROXIMITY_CONVENTION, classifyCoastDistance } from "./coast-facts.ts";

const territoireHref = "/rapport/quartier";
const RULE_ID = "territoire.mer-proximite_mer";

export const COAST_KEYS: PreferenceKey[] = ["proximite_mer"];

function makeCoastRule(): DecisionRule {
  const id = RULE_ID;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: ["proximite_mer"], outcome, facts, reason });

      const weight = preferenceWeight(p, "proximite_mer");
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const distanceKm = f.distanceCoteKm;
      const verdict = classifyCoastDistance(distanceKm);
      if (verdict === "uncertain") return ret("uncertain", [], "distance à la côte indisponible");

      // neutral (intermédiaire) et satisfied (proche) toujours silencieux ; mismatch de poids 1 examiné
      // mais silencieux (non matériel).
      if (verdict !== "mismatch" || weight < 2) {
        const reason = verdict === "mismatch" ? "éloignement mineur, silencieux (poids 1)"
          : verdict === "satisfied" ? "proche du littoral" : "distance intermédiaire";
        return ret(verdict, [], reason);
      }

      // verdict "mismatch" && weight >= 2 : distanceKm est fini >= 100 par construction de classifyCoastDistance.
      // Une garde d'invariant NARROW distanceKm de `number | null` à `number`, sans cast qui masquerait la relation.
      if (distanceKm == null || !Number.isFinite(distanceKm)) {
        throw new Error(`[decision] ${id}: invariant interne, distance valide attendue`);
      }
      const km = Math.round(distanceKm);
      const tier = weight >= 3 ? "structuring" : "secondary";
      const ev: EvidenceRef = {
        factId: "coastDistance.proximite_mer", module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `distance au littoral estimée à environ ${km} km`, grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-proximite_mer`, ruleId: id, sourceFactIds: ["coastDistance.proximite_mer"],
        module: "territoire", role: "mismatch", projectKey: "proximite_mer", materialityTier: tier,
        topic: "la distance à la mer",
        statement: `Vous avez placé la proximité de la mer parmi vos priorités. La distance au littoral est estimée à environ ${km} km depuis le point de référence retenu pour ${f.nom}. Cet écart appelle un arbitrage. Il ne rend pas ${f.nom} incompatible avec votre projet.`,
        basis: { kind: "absolute_measure", value: distanceKm, unit: "km", conventionId: COAST_PROXIMITY_CONVENTION.id },
        evidence: [ev],
        limitation:
          "Cette estimation est calculée à vol d'oiseau depuis un ensemble de localités côtières de référence. Elle ne correspond ni à la distance minimale au trait de côte, ni à la distance routière, ni au temps de trajet. Une version ultérieure pourra utiliser directement le trait de côte IGN.",
      };
      return ret("mismatch", [fact], "éloignement attesté de la côte");
    },
  };
}

export const COAST_RULES: DecisionRule[] = [makeCoastRule()];
