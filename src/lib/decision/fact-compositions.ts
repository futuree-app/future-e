// LE REGISTRE DES PATRONS DE COMPOSITION (v1 : deux, codés en dur). PUR.
//
// Une relation se DÉCLARE, elle ne se découvre pas : aucun regroupement automatique par sourceFactId
// (invariant 5). Une composition réorganise ce qui aurait été visible séparément ; elle ne rend jamais
// visible ce qui était silencieux (invariant 7). Le côté favorable n'est jamais re-dérivé : outcome
// depuis l'évaluation existante, preuve par helper canonique, aucun seuil recalculé (invariant 9).
import type { RunResult, RuleEvaluation, ModuleFacts, EvidenceRef, VerificationFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { FactComposition, TradeoffComposition } from "./fact-composition.ts";
import { preferenceWeight } from "./project-view.ts";
import { rankPhrase, bandValide } from "./mismatch-facts.ts";
import { mismatchRuleId } from "./mismatch-rules.ts";
import { RULE_CHALEUR } from "./materiality-rules.ts";
import { WINTER_MILDNESS_CONVENTION } from "../climate/winter-mildness.ts";

const RULE_DOUCEUR = mismatchRuleId("douceur_climat");

function evaluation(run: RunResult, ruleId: string): RuleEvaluation | null {
  return run.evaluations.find((e) => e.ruleId === ruleId) ?? null;
}

// LA PREUVE DU CÔTÉ SATISFAIT. Un satisfied n'émet aucun fait : sa preuve est construite ici, depuis la
// bande canonique (jamais recalculée, gardes complètes via bandValide). Bande absente ou corrompue ->
// null, jamais une preuve inventée pour satisfaire une carte.
export function buildWinterMildnessEvidence(facts: ModuleFacts): EvidenceRef | null {
  const band = facts.rankBands?.["douceur_climat"] ?? null;
  if (!bandValide(band)) return null;
  const topShare = 1 - band.low; // part supérieure : borne basse 0,90 -> parmi les 10 %
  return {
    factId: "relativePosition.douceur_climat",
    module: "territoire",
    label: `Territoire · ${facts.nom}`,
    observedValue: `parmi ${rankPhrase(topShare)} aux hivers les plus doux (référence ${WINTER_MILDNESS_CONVENTION.referencePeriod})`,
    grain: "commune",
    href: "/rapport/quartier",
  };
}

function composeSeasonalClimateTradeoff(
  run: RunResult, facts: ModuleFacts, project: UserProject,
): TradeoffComposition | null {
  // GATE (spec §4) : tous les éléments narrés à poids >= 2 ; outcome depuis l'évaluation existante ;
  // un fait défavorable RÉELLEMENT produit (on ne compose que l'affichable seul).
  if (preferenceWeight(project, "douceur_climat") < 2) return null;
  if (preferenceWeight(project, "faible_chaleur") < 2) return null;
  const douceur = evaluation(run, RULE_DOUCEUR);
  if (!douceur || douceur.outcome !== "satisfied") return null;
  const chaleur = evaluation(run, RULE_CHALEUR);
  const chaleurFact = (chaleur?.facts ?? []).find((f) => f.role === "verification") as VerificationFact | undefined;
  if (!chaleurFact) return null;
  const favorableEvidence = buildWinterMildnessEvidence(facts);
  if (!favorableEvidence) return null; // invariant 9 : preuve non fabricable = patron non déclenché

  return {
    id: `${facts.insee}:composition-climat-saisons`,
    kind: "tradeoff",
    patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
    summary: `Les hivers de ${facts.nom} comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.`,
    favorableSide: {
      label: "Ce qui correspond",
      statement: "Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale.",
      evidence: [favorableEvidence],
      ruleIds: [RULE_DOUCEUR],
      factIds: [],
    },
    unfavorableSide: {
      label: "Ce qui appelle un arbitrage",
      statement: chaleurFact.statement,
      evidence: chaleurFact.evidence,
      ruleIds: [RULE_CHALEUR],
      factIds: [chaleurFact.id],
      action: chaleurFact.action,
      ...(chaleurFact.limitation ? { limitation: chaleurFact.limitation } : {}),
    },
    absorbedFactIds: [chaleurFact.id],
    referencedRuleIds: [RULE_DOUCEUR, RULE_CHALEUR],
    materialityTier: chaleurFact.materialityTier, // la douceur n'aggrave jamais la réserve
    displaySection: "compromises",
  };
}

// LE VALIDATEUR : l'assembleur ne fait pas confiance au constructeur (même doctrine qu'assertFactValid).
// Jette : un patron futur qui absorberait deux fois une carte ou masquerait un fait inexistant doit
// exploser en développement, jamais rendre une UI silencieusement incohérente.
export function assertCompositionsValid(run: RunResult, compositions: FactComposition[]): void {
  const factIds = new Set(run.facts.map((f) => f.id));
  const ruleIds = new Set(run.evaluations.map((e) => e.ruleId));
  const seenCompIds = new Set<string>();
  const seenAbsorbed = new Set<string>();
  for (const c of compositions) {
    if (seenCompIds.has(c.id)) throw new Error(`composition dupliquée : ${c.id}`);
    seenCompIds.add(c.id);
    // Ces deux gardes sont statiquement impossibles (types littéraux) : elles protègent contre des
    // données runtime forgées ou un futur patron mal câblé, d'où la vue élargie.
    const section = (c as { displaySection: string }).displaySection;
    if (c.kind === "tradeoff" && section !== "compromises") throw new Error(`tradeoff hors compromises : ${c.id}`);
    if (c.kind === "shared_evidence" && section !== "mismatches") throw new Error(`shared_evidence hors mismatches : ${c.id}`);
    if (c.absorbedFactIds.length === 0) throw new Error(`composition sans absorbé : ${c.id}`);
    for (const id of c.absorbedFactIds) {
      if (!factIds.has(id)) throw new Error(`fait absorbé inexistant : ${id} (${c.id})`);
      if (seenAbsorbed.has(id)) throw new Error(`fait absorbé deux fois : ${id}`);
      seenAbsorbed.add(id);
    }
    for (const rid of c.referencedRuleIds) {
      if (!ruleIds.has(rid)) throw new Error(`ruleId référencé inexistant : ${rid} (${c.id})`);
    }
  }
}

export function composeFacts(run: RunResult, facts: ModuleFacts, project: UserProject): FactComposition[] {
  const out: FactComposition[] = [];
  const seasonal = composeSeasonalClimateTradeoff(run, facts, project);
  if (seasonal) out.push(seasonal);
  assertCompositionsValid(run, out); // toujours : le jeu est minuscule, l'incohérence silencieuse coûte plus
  return out;
}
