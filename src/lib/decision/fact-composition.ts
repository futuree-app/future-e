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
  signalConvention?: string; // la convention de seuil du fait absorbé survit sur SON côté (invariant 8)
};

export type TradeoffComposition = {
  id: string;
  kind: "tradeoff";
  patternId: "seasonal_climate_tradeoff";
  title: string;
  // Le sujet à nommer dans le headline du verdict, en BAS DE CASSE (il se lit après un deux-points).
  // Un `title` de tradeoff annonce les DEUX côtés (« Des hivers doux, avec une exposition estivale à
  // arbitrer ») : servi comme « le principal point à contrôler », il ferait des hivers doux un
  // problème. Le sujet ne nomme donc que le côté qui appelle l'arbitrage.
  headlineSubject: string;
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
  // Le sujet à nommer dans le headline du verdict. Le `title` raconte le patron (« Une même petite
  // taille touche plusieurs dimensions de votre projet »), trop long pour une phrase de héros : la
  // composition nomme ici la CAUSE COMMUNE, courte. Elle est une carte de mismatch (displaySection),
  // donc candidate au headline d'arbitrage, alors que ses faits élémentaires sont absorbés.
  headlineSubject: string;
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
  // Même contrat que les autres patrons : court, bas de casse, jamais le titre. Et SANS coordination
  // de haut niveau : ce sujet est énuméré avec d'autres par un « et », et un « et » interne ferait
  // lire trois sujets là où il y en a deux. Un binôme lexical (« collèges et lycées ») reste lisible ;
  // deux concepts distincts, non.
  headlineSubject: string;
  summary: string;
  items: CompositionSide[];
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // max des tiers absorbés
  displaySection: "verifications";
};

export type FactComposition = TradeoffComposition | SharedEvidenceComposition | GroupedVerificationComposition;
