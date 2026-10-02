// LA PRÉFÉRENCE « PROXIMITÉ DE LA MER » AU DOSSIER (FUT-33, phase 2B.2 D). PURE.
//
// LE DOSSIER MESURE, IL NE JUGE PAS UN MOT SANS SEUIL. Le lecteur a dit que la mer comptait ; il n'a pas dit à
// quelle distance. La convention d'hier (« proche » jusqu'à 15 km, « éloigné » à partir de 100 km, calibrée sur
// un proxy) fabriquait le seuil qu'il n'avait pas donné. Elle est retirée : la règle EXAMINE le critère (la
// distance du point de référence au rivage marin existe), sans correspondance ni écart. Le critère reste une
// appréciation (outcome du registre : indéterminé), jamais une réponse oui / non.
//
// Où le lecteur lit la distance : dans la fiche Territoire, et sur la carte « à confirmer » s'il fait de la mer
// une condition (condition-rules.ts, `mesureMer`). Un seuil DIT (« à moins de 10 km ») passe par `nearSea`.
// La courbe de classement de la recherche (mer-recherche.ts) n'entre jamais ici.
import type { DecisionRule, RuleEvaluation, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";

const RULE_ID = "territoire.mer-proximite_mer";

function makeCoastRule(): DecisionRule {
  return {
    id: RULE_ID,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], reason: string): RuleEvaluation =>
        ({ ruleId: RULE_ID, projectKeys: ["proximite_mer"], outcome, facts: [], reason });
      if (preferenceWeight(p, "proximite_mer") === 0) return ret("not_applicable", "priorité non déclarée");
      const km = f.merCentreKm;
      if (km == null || !Number.isFinite(km) || km < 0) return ret("uncertain", "distance au rivage marin indisponible");
      return ret("neutral", "distance au rivage marin mesurée ; aucun seuil déclaré, aucun verdict");
    },
  };
}

export const COAST_RULES: DecisionRule[] = [makeCoastRule()];
