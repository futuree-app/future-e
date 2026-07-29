// LA RÈGLE RADON. PURE.
//
// Table de vérité : `docs/cadrage-radon.md`. Ce fichier n'en est que l'exécution.
//
//   classe 3       -> verification (la carte)
//   classe 2       -> rien
//   classe 1       -> rien
//   source muette  -> rien
//
// AUCUN `satisfied`, JAMAIS. Les classes basses ne prouvent rien sur un logement : un potentiel
// faible n'interdit pas une concentration élevée dans un bâtiment mal ventilé. Un `satisfied` sans
// fait ne porterait aucune carte donc aucune limitation, et `criteria-registry` en tirerait
// « favorable » plus une montée de couverture — le mensonge silencieux fermé sur le bruit le matin
// même. Le silence est ici la seule position tenable.
//
// AUCUN RATTACHEMENT À UNE PRIORITÉ EXISTANTE. `air_sain` porte l'air EXTÉRIEUR,
// `faible_exposition_industrielle` les sites classés, `cadre_calme` le bruit : y accrocher le radon
// serait une fausse correspondance sémantique. Il entre donc comme CONSTAT ÉTABLI NON DEMANDÉ —
// le régime que le climat applique déjà, avec un seuil plus exigeant qu'une priorité déclarée. Ici
// ce seuil est la classe 3 : 19,5 % des communes, mesuré.
//
// L'ÉCHELLE DU CONSTAT N'EST PAS CELLE DE L'ACTION. Preuve au grain commune, restitution dans
// Territoire, geste à faire DANS le logement. C'est exactement ce que le modèle ancre/support du
// 28/07 permet d'exprimer sans règle spéciale.

import type { DecisionRule, RuleEvaluation, VerificationFact, EvidenceRef } from "./decision-fact.ts";
import { GESTES, bucketDuProjet } from "./logement-gestes.ts";
import {
  radonSignale, radonStatement, radonLimitation, RADON_TOPIC, RADON_STATUS,
} from "./radon-facts.ts";

const RULE_RADON = "territoire.radon";
const territoireHref = "/rapport/quartier";

const radonRule: DecisionRule = {
  id: RULE_RADON,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const na: RuleEvaluation = { ruleId: RULE_RADON, projectKeys: [], outcome: "not_applicable", facts: [], reason: "" };

    // Une classe 1 ou 2 n'est PAS une bonne nouvelle qu'on aurait le droit de taire : c'est une
    // information qui ne dit rien du logement. Elle ne produit donc ni carte, ni couverture.
    if (!radonSignale(f.radon)) {
      return { ...na, reason: f.radon ? `classe ${f.radon.classe} : rien à signaler` : "potentiel radon indisponible" };
    }
    const r = f.radon!;

    const evidence: EvidenceRef = {
      factId: "radon.classePotentiel",
      module: "territoire",
      label: r.parArrondissement ? `Radon · arrondissement ${r.codeInterroge}` : `Radon · ${f.nom}`,
      observedValue: "potentiel de catégorie 3 sur 3",
      // Grain COMMUNE : la classification décrit un sous-sol, pas un point. `attribut`, pas
      // `proximite` — on ne mesure aucune distance. L'échelle « territoire » s'en déduit.
      grain: "commune",
      relation: "attribut",
      href: territoireHref,
    };

    const fact: VerificationFact = {
      id: `${f.insee}:radon`,
      ruleId: RULE_RADON,
      sourceFactIds: ["radon.classePotentiel"],
      module: "territoire",
      role: "verification",
      // `secondary` : le fait est établi, mais il n'établit rien sur ce logement — il appelle une
      // mesure. Un constat qui ne conclut pas ne doit pas peser comme s'il concluait.
      materialityTier: "secondary",
      topic: RADON_TOPIC,
      statement: radonStatement(r, f.nom),
      status: RADON_STATUS,
      limitation: radonLimitation(),
      evidence: [evidence],
      action: {
        type: "verifier_sur_place",
        ...GESTES.radon[bucketDuProjet(p)],
      },
    };
    return { ruleId: RULE_RADON, projectKeys: [], outcome: "verification", facts: [fact], reason: "potentiel de catégorie 3" };
  },
};

export const RADON_RULES: DecisionRule[] = [radonRule];
