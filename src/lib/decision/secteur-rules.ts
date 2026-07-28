// LES RÈGLES DU GRAIN SECTEUR. PURES.
//
// Une seule pour l'instant : l'équipement automobile du quartier, comme NUANCE de la lecture
// communale. C'est le premier fait du produit à émettre `grain: "secteur"` — jusqu'ici l'échelle
// intermédiaire existait dans le modèle sans avoir rien à porter.
//
// CE QUE CETTE RÈGLE NE FAIT PAS, ET POURQUOI :
//
//  1. ELLE NE TRANCHE PAS LE PROJET. Elle rend `verification`, jamais `mismatch` ni `satisfied` :
//     l'écart est un CONSTAT ÉTABLI, pas un verdict. La position relative de la commune pour
//     `faible_dependance_auto` est déjà portée par `mismatch-rules` ; cette règle la nuance à
//     l'échelle du quartier, elle ne la remplace pas — sinon le dossier dirait deux fois la même
//     chose à deux échelles sans les relier, et le lecteur y verrait une contradiction.
//
//  2. ELLE NE MONTE JAMAIS AU-DESSUS DE `secondary`. Même à poids 3, la possession automobile ne
//     structure pas une décision à elle seule : elle invite à croiser avec l'accessibilité réelle
//     (transports, services, distances). Un fait qui ne peut pas conclure ne doit pas peser comme
//     s'il le pouvait.
//
//  3. ELLE NE DIT NI « DÉPENDANCE » NI « ON PEUT Y VIVRE SANS VOITURE ». Cf. `secteur-facts.ts`.

import type { DecisionRule, RuleEvaluation, VerificationFact, EvidenceRef } from "./decision-fact.ts";
import { preferenceWeight } from "./project-view.ts";
import {
  ecartNotable, equipementAutoStatement, equipementAutoLimitation, pctFr,
} from "./secteur-facts.ts";

const RULE_EQUIPEMENT_AUTO = "secteur.equipement-auto";
const logementHref = "/rapport/logement";

const equipementAutoRule: DecisionRule = {
  id: RULE_EQUIPEMENT_AUTO,
  // Le module dit d'où VIENT la donnée ; l'échelle se dérive de la preuve (cf. `echelles.ts`).
  module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const ret = (outcome: RuleEvaluation["outcome"], facts: VerificationFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_EQUIPEMENT_AUTO, projectKeys: ["faible_dependance_auto"], outcome, facts, reason });

    // La priorité gouverne l'EXAMINABILITÉ : sans elle, ce constat n'aide personne à décider.
    if (preferenceWeight(p, "faible_dependance_auto") < 2) {
      return ret("not_applicable", [], "priorité non déclarée");
    }
    const e = f.secteur?.equipementAuto;
    // Pas de secteur exploitable (pas d'adresse, IRIS non résolu, secteur non résidentiel, artefact
    // absent) : la règle se tait. Ce n'est pas une inconnue à signaler — la lecture communale, elle,
    // a bien eu lieu.
    if (!e) return ret("not_applicable", [], "aucun secteur résidentiel exploitable");
    if (!ecartNotable(e.ecart)) return ret("not_applicable", [], "écart au niveau de la commune");

    const evidence: EvidenceRef = {
      factId: "secteur.equipementAuto",
      module: "logement",
      label: "Ménages et voiture · secteur de l'adresse",
      observedValue: `${pctFr(e.share)} contre ${pctFr(e.communeShare)} dans la commune`,
      // ANCRE `secteur` : la donnée décrit la SURFACE de l'IRIS, pas une distance depuis l'adresse.
      // Ancre et support coïncident, donc `attribut` — l'échelle « quartier » s'en déduit.
      grain: "secteur",
      relation: "attribut",
      href: logementHref,
    };

    const fact: VerificationFact = {
      id: `${f.insee}:secteur-equipement-auto`,
      ruleId: RULE_EQUIPEMENT_AUTO,
      sourceFactIds: ["secteur.equipementAuto"],
      module: "logement",
      role: "verification",
      // JAMAIS `structuring`, même à poids 3 : ce signal ne conclut pas seul (cf. en-tête).
      materialityTier: "secondary",
      topic: "l'équipement automobile du secteur",
      statement: equipementAutoStatement(e),
      status: e.ecart < 0 ? "Moins équipé que la commune" : "Plus équipé que la commune",
      limitation: equipementAutoLimitation(),
      evidence: [evidence],
      action: {
        type: "verifier_sur_place",
        label: "Testez vos trajets réels depuis cette adresse",
        detail:
          "Aux heures où vous les feriez : ce que possèdent les ménages voisins ne dit pas ce dont vous aurez besoin.",
      },
    };
    return ret("verification", [fact], "écart notable à la commune");
  },
};

export const SECTEUR_RULES: DecisionRule[] = [equipementAutoRule];
