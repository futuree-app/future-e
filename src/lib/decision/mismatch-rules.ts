// LA FABRIQUE DES RÈGLES DE MISMATCH (position relative). PURE.
//
// Elle lit le rang précalculé (rankBands), bâti sur mismatchRawScore : l'ORDRE CANONIQUE du comparateur,
// déjà nullable. Le dossier ne re-dérive AUCUNE formule, donc les deux moteurs ne peuvent pas diverger.
//
// LE POIDS GOUVERNE LA MATÉRIALITÉ, JAMAIS L'EXAMINABILITÉ. Priorité absente -> not_applicable. Poids 1 ->
// examinée (la couverture monte) mais SILENCIEUSE (aucune carte, pas d'arbitrage). Poids 2 -> secondary.
// Poids 3 -> structuring.
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  classifyPosition, rankPhrase, MISMATCH_LABELS, MISMATCH_DISTRIBUTION_VERSION,
  type RelativeCriterionFact,
} from "./mismatch-facts.ts";

const territoireHref = "/rapport/quartier";

export const MISMATCH_KEYS: PreferenceKey[] = [
  "nature", "acces_ecoles", "acces_soins", "acces_culture", "acces_transports",
  "faible_dependance_auto", "croissance_demographique", "vie_locale", "cadre_calme", "viabilite_emploi",
];

function relativeFact(f: ModuleFacts, key: PreferenceKey): RelativeCriterionFact {
  const band = f.rankBands?.[key] ?? null;
  // La VRAIE valeur (le bas de la bande suffit à classifyPosition ; on ne fabrique jamais un nombre pour
  // « satisfaire un type »). null quand il n'y a pas de bande -> uncertain.
  return {
    key,
    rawValue: band ? band.low : null,
    band,
    universe: "communes_france",
    distributionVersion: MISMATCH_DISTRIBUTION_VERSION,
  };
}

function makeMismatchRule(key: PreferenceKey): DecisionRule {
  const id = `territoire.mismatch-${key}`;
  const lab = MISMATCH_LABELS[key]!;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [key], outcome, facts, reason });

      const weight = preferenceWeight(p, key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const verdict = classifyPosition(relativeFact(f, key));
      if (verdict === "uncertain") return ret("uncertain", [], "rang non calculable");

      // satisfied et neutral sont TOUJOURS silencieux. Un mismatch de poids 1 est examiné (l'outcome
      // remonte, la couverture monte) mais ne produit AUCUNE carte : non matériel, pas d'arbitrage.
      if (verdict !== "mismatch" || weight < 2) {
        return ret(
          verdict, [],
          verdict === "mismatch" ? "mismatch mineur, silencieux (poids 1)" : `position ${verdict}`,
        );
      }

      const band = f.rankBands![key]!;
      const tier = weight >= 3 ? "structuring" : "secondary";
      const ev: EvidenceRef = {
        factId: `relativePosition.${key}`, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `parmi ${rankPhrase(band.high)} les moins favorables`, grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${key}`, ruleId: id, sourceFactIds: [`relativePosition.${key}`], module: "territoire",
        role: "mismatch", projectKey: key, materialityTier: tier,
        topic: lab.topic,
        // COMPARATIF, jamais un jugement absolu. L'univers est nommé (« de France »), le lien au projet
        // explicite. « moins bien » ne dit pas « mauvais » : il dit « moins qu'ailleurs ».
        statement: `Vous avez placé ${lab.projectPhrase} parmi vos priorités. Sur ${lab.indicator}, ${f.nom} se situe parmi ${rankPhrase(band.high)} les moins favorables de France. Cela répond moins bien à cette dimension de votre projet, sans rendre ${f.nom} incompatible avec lui.`,
        basis: { kind: "relative_position", rankLow: band.low, rankHigh: band.high, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION },
        evidence: [ev],
      };
      return ret("mismatch", [fact], "position relative défavorable");
    },
  };
}

export const MISMATCH_RULES: DecisionRule[] = MISMATCH_KEYS.map(makeMismatchRule);
