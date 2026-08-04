// LES RÈGLES DES AUTORISATIONS D'URBANISME. PURES.
//
// POURQUOI ELLES EXISTENT. Le registre SDES est appelé, gelé dans le snapshot, rendu à l'écran et
// doté d'une doctrine complète depuis le 01/08/2026, et il n'existait pas pour le moteur. Ni
// `DecisionFact`, ni règle, ni grain déclaré, donc absent du verdict, de la minute et de la liste
// des contrôles, dont le groupe « Autour de l'adresse » ne portait qu'un seul item.
//
// ── CE QUE CETTE RÈGLE NE FAIT PAS, ET POURQUOI ───────────────────────────────────────────────
//
//  1. ELLE NE DÉPEND D'AUCUNE PRÉFÉRENCE (`projectKeys: []`). Personne ne déclare « je veux savoir
//     ce qui va se construire à côté » : c'est l'inconnu décisif type, celui que le lecteur ne sait
//     pas demander. L'accrocher à `cadre_calme` a été écarté, cette préférence étant définie comme
//     « environnement peu dense » au grain COMMUNE, quand un permis ne mesure ni le bruit ni la
//     densité.
//
//  2. ELLE NE MONTE JAMAIS AU-DESSUS DE `secondary`. Le registre ne dit ni le volume, ni l'emprise,
//     ni la nature, ni les effets : un chantier peut être une maison individuelle comme un immeuble
//     de trente logements, et rien dans le snapshot ne les distingue. L'ouverture du chantier
//     augmente la CERTITUDE TEMPORELLE du constat, jamais sa MATÉRIALITÉ DÉCISIONNELLE.
//
//  3. ELLE N'ÉMET QU'UN SEUL FAIT, quel que soit le nombre de dossiers. Un fait par permis
//     produirait plusieurs cartes portant le même geste.
//
// Pure, testée sous `node --test`.

import type {
  DecisionRule, RuleEvaluation, VerificationFact,
} from "./decision-fact.ts";
import type { PermisSnapshot } from "../logement-autour-types.ts";

const RULE_PERMIS = "autour.permis";

const permisRule: DecisionRule = {
  id: RULE_PERMIS,
  // Le module dit d'où VIENT la donnée ; l'échelle se dérive de la preuve (cf. `echelles.ts`).
  module: "logement",
  evaluate: (f): RuleEvaluation => {
    const ret = (
      outcome: RuleEvaluation["outcome"], facts: VerificationFact[], reason: string,
    ): RuleEvaluation => ({ ruleId: RULE_PERMIS, projectKeys: [], outcome, facts, reason });

    const p: PermisSnapshot | undefined = f.permis;

    // LE REGISTRE N'A PAS ÉTÉ CONSULTÉ, ce qui n'est pas la même chose que « il n'y a rien ».
    // `not_applicable` dirait que la question ne se pose pas pour cette adresse ; `uncertain` dit
    // que la règle s'applique et que la donnée manque, sans même un fait à montrer.
    if (!p) return ret("uncertain", [], "registre des autorisations non consulté");

    // DEUX SILENCES DISTINCTS SOUS LE MÊME OUTCOME. Le contrat n'offre que `not_applicable` pour
    // les deux, donc la RAISON porte la différence : un audit qui lirait « aucune autorisation non
    // achevée » ne saurait pas si le quartier est calme ou si tout y est déjà construit.
    if (p.permis.length === 0) {
      return ret("not_applicable", [], "registre consulté, aucune autorisation recensée");
    }
    const retenus = p.permis.filter((x) => x.etat !== "acheve");
    if (retenus.length === 0) {
      return ret("not_applicable", [], "autorisations recensées, toutes achevées");
    }

    return ret("verification", [], "au moins une autorisation non achevée");
  },
};

export const PERMIS_RULES: DecisionRule[] = [permisRule];
