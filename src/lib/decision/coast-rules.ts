// LA FABRIQUE DE LA RÈGLE DE PROXIMITÉ MER (absolute_measure). PURE.
//
// Doctrine SYMÉTRIQUE : la distance à la côte mesure DIRECTEMENT la qualité recherchée. Proche -> satisfied ;
// loin -> mismatch ; entre-deux -> neutral ; donnée absente/corrompue -> uncertain. satisfied/neutral sont
// SILENCIEUX (aucun fait) ; le POIDS gouverne la seule face mismatch (1 = silencieux, 2 = secondary, 3 =
// structuring). Jamais satisfied matériel : l'architecture n'a pas de fait favorable (cf. spec §7).
import type { DecisionRule, RuleEvaluation, MismatchFact, AlignmentFact, DecisionFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import { preferenceSurfaced } from "./conditions.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { COAST_PROXIMITY_CONVENTION, classifyCoastDistance } from "./coast-facts.ts";
import { deCommune } from "../typography.ts";

const territoireHref = "/rapport/quartier";
// FUT-33 : ce que la mesure dit, et ce qu'elle ne dit pas. Le rivage marin comprend lagunes et bassins.
const LIMITE_MESURE =
  "Distance à vol d'oiseau du point de référence de la commune au rivage marin (limite terre-mer Shom-IGN, lagunes comprises). Elle ne dit ni la distance de votre logement, ni la distance par la route, ni l'accès à une plage.";
const RULE_ID = "territoire.mer-proximite_mer";

// (Il exista ici un `COAST_KEYS` listant les clés couvertes. Rien ne le lisait : la couverture des critères se
// dérive des `projectKeys` que chaque ÉVALUATION rend (cf. criteria-registry.ts), c'est-à-dire de ce que
// les règles ont réellement examiné sur ce dossier — pas d'une liste tenue en parallèle, qui aurait pu
// diverger sans que rien ne le dise.)

function makeCoastRule(): DecisionRule {
  const id = RULE_ID;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: ["proximite_mer"], outcome, facts, reason });

      const weight = preferenceWeight(p, "proximite_mer");
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");
      // LA VISIBILITÉ N'EST PAS L'IMPORTANCE (FUT-7). Le poids règle le tier ; une condition confirmée se
      // montre quel que soit son poids (conditions.ts).
      const visible = preferenceSurfaced(p, "proximite_mer");

      // FUT-33 : le point de référence de la commune → rivage marin (préférence de COMMUNE, grain commune).
      const distanceKm = f.merCentreKm;
      const verdict = classifyCoastDistance(distanceKm);
      if (verdict === "uncertain") return ret("uncertain", [], "distance à la côte indisponible");

      // ALIGNMENT (lot C) : proche du littoral + poids >= 2 -> fait favorable (absolute_measure). Miroir du
      // mismatch d'éloignement, avec la MÊME limitation méthodologique (distance à vol d'oiseau).
      if (verdict === "satisfied" && visible && distanceKm != null && Number.isFinite(distanceKm)) {
        const km = Math.round(distanceKm);
        const tier = weight >= 3 ? "structuring" : "secondary";
        const face = `Le rivage marin est à environ ${km} km du point de référence de la commune, dans ce que vous recherchez.`;
        const ev: EvidenceRef = {
          factId: "coastDistance.proximite_mer", module: "territoire", label: `Territoire · ${f.nom}`,
          observedValue: `point de référence à environ ${km} km du rivage marin`, grain: "commune",
          relation: "proximite", href: territoireHref,
        };
        const alignment: AlignmentFact = {
          id: `${f.insee}:alignment-proximite_mer`, ruleId: id, sourceFactIds: ["coastDistance.proximite_mer"],
          module: "territoire", role: "alignment", projectKey: "proximite_mer", materialityTier: tier,
          topic: "la proximité de la mer", headlineSubject: "la proximité de la mer",
          statement: `Pour la proximité de la mer, le point de référence ${deCommune(f.nom)} est à environ ${km} km du rivage marin, dans ce que vous recherchez.`,
          faceStatement: face,
          basis: { kind: "absolute_measure", value: distanceKm, unit: "km", conventionId: COAST_PROXIMITY_CONVENTION.id },
          evidence: [ev],
          limitation: LIMITE_MESURE,
        };
        return ret("satisfied", [alignment], "proche du littoral, matérialisé");
      }

      // neutral (intermédiaire) et satisfied (proche, poids 1) silencieux ; mismatch de poids 1 examiné
      // mais silencieux (non matériel).
      if (verdict !== "mismatch" || !visible) {
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
        observedValue: `point de référence à environ ${km} km du rivage marin`, grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-proximite_mer`, ruleId: id, sourceFactIds: ["coastDistance.proximite_mer"],
        module: "territoire", role: "mismatch", projectKey: "proximite_mer", materialityTier: tier,
        topic: "la distance à la mer",
        // Le lecteur a déclaré vouloir la PROXIMITÉ de la mer ; « la distance » nommerait l'écart.
        headlineSubject: "la proximité de la mer",
        status: `À ${km} km du rivage marin`,
        statement: `Vous avez placé la proximité de la mer parmi vos priorités. Le point de référence ${deCommune(f.nom)} se situe à environ ${km} km du rivage marin.`,
        basis: { kind: "absolute_measure", value: distanceKm, unit: "km", conventionId: COAST_PROXIMITY_CONVENTION.id },
        evidence: [ev],
        limitation: LIMITE_MESURE,
      };
      return ret("mismatch", [fact], "éloignement attesté de la côte");
    },
  };
}

export const COAST_RULES: DecisionRule[] = [makeCoastRule()];
