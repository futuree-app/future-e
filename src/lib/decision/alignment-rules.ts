// LA FABRIQUE DES RÈGLES D'ALIGNMENT (position relative). PURE. MIROIR de mismatch-rules.ts : elle lit
// le MÊME rang précalculé (rankBands), et émet sur `satisfied` ce que le mismatch émet sur `mismatch`.
// Les deux moteurs ne re-dérivent aucune formule — ils ne peuvent pas diverger.
//
// LE POIDS GOUVERNE LA MATÉRIALITÉ, JAMAIS L'EXAMINABILITÉ. Priorité absente -> not_applicable. Poids 1 ->
// examinée (la couverture monte) mais SILENCIEUSE (aucune carte). Poids 2 -> secondary. Poids 3 -> structuring.
import type { DecisionRule, RuleEvaluation, AlignmentFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { MISMATCH_KEYS } from "./mismatch-rules.ts"; // la MÊME liste de critères classables
import {
  classifyPosition, rankFractionFavorable, MISMATCH_LABELS, ALIGNMENT_LABELS, MISMATCH_DISTRIBUTION_VERSION,
  type RelativeCriterionFact,
} from "./mismatch-facts.ts";

const territoireHref = "/rapport/quartier";

// L'IDENTIFIANT CANONIQUE d'une règle d'alignment. Exporté : l'absorption par composition et l'assembleur
// le référencent, et l'importer garantit qu'un renommage casse le typecheck, jamais silencieusement l'UI.
export const alignmentRuleId = (key: PreferenceKey): string => `territoire.alignment-${key}`;

// La minuscule initiale : le heading est un titre (« L'accès aux soins ») ; la priorité que le héros
// nomme après un deux-points se lit en bas de casse (« … répond à votre priorité : l'accès aux soins »).
const bdc = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function relativeFact(f: ModuleFacts, key: PreferenceKey): RelativeCriterionFact {
  const band = f.rankBands?.[key] ?? null;
  return { key, rawValue: band ? band.low : null, band, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION };
}

function makeAlignmentRule(key: PreferenceKey): DecisionRule {
  const id = alignmentRuleId(key);
  const copy = ALIGNMENT_LABELS[key]!;
  const lab = MISMATCH_LABELS[key]!;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: AlignmentFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [key], outcome, facts, reason });

      const weight = preferenceWeight(p, key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const verdict = classifyPosition(relativeFact(f, key));
      if (verdict === "uncertain") return ret("uncertain", [], "rang non calculable");

      // Seul `satisfied` matériel (poids >= 2) produit. `satisfied` poids 1 -> examiné, silencieux.
      // `mismatch` et `neutral` sont laissés à mismatch-rules / au silence : une dimension ne porte
      // jamais à la fois un alignment et un signal défavorable (l'outcome de classifyPosition est exclusif).
      if (verdict !== "satisfied" || weight < 2) {
        return ret(
          verdict, [],
          verdict === "satisfied" ? "alignment mineur, silencieux (poids 1)" : `position ${verdict}`,
        );
      }

      const band = f.rankBands![key]!;
      const tier = weight >= 3 ? "structuring" : "secondary";
      // Preuve SANS valeur mesurée : le percentile vit déjà, scannable, dans la phrase de rang. Le
      // recopier en pastille le dirait deux fois (le défaut « aléa moyen ou fort » corrigé ailleurs).
      const ev: EvidenceRef = {
        factId: `relativePosition.${key}`, module: "territoire", label: `Territoire · ${f.nom}`,
        grain: "commune", href: territoireHref,
      };
      const priorite = bdc(copy.heading);
      const fact: AlignmentFact = {
        id: `${f.insee}:alignment-${key}`, ruleId: id, sourceFactIds: [`relativePosition.${key}`], module: "territoire",
        role: "alignment", projectKey: key, materialityTier: tier,
        topic: priorite,
        headlineSubject: priorite,
        // La phrase de RANG (2e ligne de la carte, sous le heading). « de communes » toujours présent,
        // percentile injecté. Le heading (1re ligne) est lu par la carte depuis ALIGNMENT_LABELS[projectKey].
        statement: copy.rankingTemplate.replace("{rank}", rankFractionFavorable(band.low)),
        basis: { kind: "relative_position", rankLow: band.low, rankHigh: band.high, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION },
        evidence: [ev],
        // Nuance MÉTHODOLOGIQUE card-only héritée du critère (ERA5-Land, 1976-2005) : elle vaut pour la
        // position favorable comme pour la défavorable. Jamais une limite de portée.
        ...(lab.limitation ? { limitation: lab.limitation } : {}),
      };
      return ret("satisfied", [fact], "position relative favorable, matérialisée");
    },
  };
}

export const ALIGNMENT_RULES: DecisionRule[] = MISMATCH_KEYS.map(makeAlignmentRule);
