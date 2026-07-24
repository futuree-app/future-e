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
import type { EvidenceTargetKey } from "./evidence-targets.ts";
import {
  classifyPosition, rankPhrase, rankStatus, MISMATCH_LABELS, MISMATCH_DISTRIBUTION_VERSION,
  type RelativeCriterionFact,
} from "./mismatch-facts.ts";

const territoireHref = "/rapport/quartier";

// LA CARTE QUI DÉMONTRE CHAQUE ÉCART. Un mismatch dit « vous êtes parmi les 10 % les moins favorables » ;
// la preuve renvoie à la carte du module Territoire qui montre la mesure. Seules les priorités dont une
// carte présente RÉELLEMENT le phénomène entrent ici — les autres gardent le repli vers le module, et le
// test de couverture (evidence-targets.test.ts) empêche d'en déclarer une qui n'existerait pas.
const MISMATCH_TARGET: Partial<Record<PreferenceKey, EvidenceTargetKey>> = {
  faible_chaleur: "climate.extreme_heat",
  faible_risque_inondation: "risk.flooding",
  nature: "nature.green_spaces",
};

export const MISMATCH_KEYS: PreferenceKey[] = [
  "nature", "acces_ecoles", "acces_soins", "acces_culture", "acces_transports",
  "faible_dependance_auto", "croissance_demographique", "vie_locale", "cadre_calme", "viabilite_emploi",
  "acces_services", // lot 2b : plafond dégénéré (services complets = table-stakes -> neutral), queue basse propre
  "ensoleillement_recherche", // lot 4a : relative_position + limitation ERA5-Land (card-only)
  "douceur_climat", // lot 4b : douceur hivernale (relative_position + limitation 1976-2005)
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

// L'IDENTIFIANT CANONIQUE d'une règle de mismatch relative. Exporté : la couche de composition le
// référence, et l'importer garantit qu'un renommage casse le typecheck, jamais silencieusement l'UI.
export const mismatchRuleId = (key: PreferenceKey): string => `territoire.mismatch-${key}`;

function makeMismatchRule(key: PreferenceKey): DecisionRule {
  const id = mismatchRuleId(key);
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
        ...(MISMATCH_TARGET[key] ? { targetKey: MISMATCH_TARGET[key] } : {}),
      };
      // G3 : quand la priorité et l'indicateur portent le MÊME libellé (acces_ecoles), le gabarit générique
      // redirait « … parmi vos priorités. Sur l'accès aux collèges et lycées, … » : « Sur ce point » évite
      // la répétition, sans rien perdre du constat.
      const surIndicateur = lab.projectPhrase === lab.indicator ? "Sur ce point" : `Sur ${lab.indicator}`;
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${key}`, ruleId: id, sourceFactIds: [`relativePosition.${key}`], module: "territoire",
        role: "mismatch", projectKey: key, materialityTier: tier,
        topic: lab.topic,
        headlineSubject: lab.subject,
        status: rankStatus(band.high),
        // COMPARATIF, jamais un jugement absolu. L'univers est nommé (« de France »), le lien au projet
        // explicite. « moins bien » ne dit pas « mauvais » : il dit « moins qu'ailleurs ». La clôture nomme
        // l'ARBITRAGE (le vocabulaire du verdict) et garde la seule doctrine indispensable, en deux phrases :
        // un mismatch n'est pas une incompatibilité. Fini « répond moins bien à cette dimension de votre
        // projet » (qui répétait le titre de section et parlait d'abstraction administrative).
        statement: `Vous avez placé ${lab.projectPhrase} parmi vos priorités. ${surIndicateur}, ${f.nom} se situe parmi ${rankPhrase(band.high)} les moins favorables de France.`,
        basis: { kind: "relative_position", rankLow: band.low, rankHigh: band.high, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION },
        evidence: [ev],
        // Certains critères (ensoleillement) portent une nuance méthodologique card-only.
        ...(lab.limitation ? { limitation: lab.limitation } : {}),
      };
      return ret("mismatch", [fact], "position relative défavorable");
    },
  };
}

export const MISMATCH_RULES: DecisionRule[] = MISMATCH_KEYS.map(makeMismatchRule);
