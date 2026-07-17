// LA COMPOSITION : un PLAN DE PRÉSENTATION, jamais un fait. Hors de l'union DecisionFact (invariant 1).
// Elle référence les objets canoniques (factIds, ruleIds, evidence) et ne recopie jamais leur vérité
// sous une seconde forme indépendante (invariant 2). Types PURS.
import type { EvidenceRef, MaterialityTier, VerificationActionType } from "./decision-fact.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";

export type CompositionSide = {
  label: string; // « Ce qui correspond » / « Ce qui appelle un arbitrage »
  statement: string;
  evidence: EvidenceRef[];
  ruleIds: string[]; // les évaluations référencées (RuleEvaluation n'a pas d'id propre)
  factIds: string[]; // [] pour un côté satisfait (aucun fait émis)
  action?: { type: VerificationActionType; label: string }; // invariant 8 : l'action survit
  limitation?: string; // la limitation du fait absorbé reste sur SON côté
};

export type TradeoffComposition = {
  id: string;
  kind: "tradeoff";
  patternId: "seasonal_climate_tradeoff";
  title: string;
  summary: string;
  favorableSide: CompositionSide;
  unfavorableSide: CompositionSide;
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // hérité du côté défavorable, jamais aggravé par le favorable
  displaySection: "compromises";
};

export type SharedEvidenceConsequence = {
  projectKey: PreferenceKey;
  statement: string;
  materialityTier: MaterialityTier; // le tier PROPRE de chaque conséquence est conservé (invariant 8)
  factId: string;
  limitation?: string;
};

export type SharedEvidenceComposition = {
  id: string;
  kind: "shared_evidence";
  patternId: "territory-size-multiple-consequences";
  title: string;
  summary: string;
  sharedEvidence: EvidenceRef[]; // l'état commun (classification, provenance)
  consequences: SharedEvidenceConsequence[];
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // max des tiers absorbés
  displaySection: "mismatches";
};

// DEUX VÉRIFICATIONS, UN MÊME SUJET DÉCISIONNEL. Le patron regroupe des faits établis dont les actions
// se mènent ensemble (v1 : la vulnérabilité du bâti aux mouvements de sol, argiles + PPR sécheresse).
// Chaque item réutilise la brique CompositionSide : constat, preuves, action et limitation restent
// portés par LEUR item (invariant 8), rien n'est fusionné en un paragraphe.
export type GroupedVerificationComposition = {
  id: string;
  kind: "grouped_verification";
  patternId: "clay_regulation_grouped";
  title: string;
  summary: string;
  items: CompositionSide[];
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // max des tiers absorbés
  displaySection: "verifications";
};

export type FactComposition = TradeoffComposition | SharedEvidenceComposition | GroupedVerificationComposition;
