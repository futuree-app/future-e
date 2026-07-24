// LA COMPOSITION : un PLAN DE PRÉSENTATION, jamais un fait. Hors de l'union DecisionFact (invariant 1).
// Elle référence les objets canoniques (factIds, ruleIds, evidence) et ne recopie jamais leur vérité
// sous une seconde forme indépendante (invariant 2). Types PURS.
import type { EvidenceRef, MaterialityTier, DecisionAction } from "./decision-fact.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";

export type CompositionSide = {
  label: string; // « Ce qui correspond » / « Ce qui appelle un arbitrage »
  statement: string;
  evidence: EvidenceRef[];
  ruleIds: string[]; // les évaluations référencées (RuleEvaluation n'a pas d'id propre)
  factIds: string[]; // [] pour un côté satisfait (aucun fait émis)
  action?: DecisionAction; // invariant 8 : l'action survit, avec son detail
  limitation?: string; // la limitation du fait absorbé reste sur SON côté
  status?: string; // l'état établi du fait absorbé (« Aléa moyen ou fort »), survit sur SON côté
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
  // LA PRIORITÉ que le côté FAVORABLE présente déjà. Sert à l'absorption d'affichage (lot C) : un
  // AlignmentFact sur cette même clé redirait, dans la carte « Ce qui correspond », ce que ce tradeoff
  // montre déjà favorablement. La carte alignment est alors masquée si CE tradeoff est affiché.
  favorableProjectKey: PreferenceKey;
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
  // LA CAUSE COMMUNE, pas un sujet. Le champ s'appelait `headlineSubject` et le héros le servait comme
  // les autres : « Salers répond moins bien à deux de vos priorités, dont la taille du territoire. »
  // Erreur de catégorie, vue à l'écran : « la taille du territoire » n'est PAS une priorité du lecteur,
  // c'est ce qui en dessert deux. Le gabarit « dont » la faisait passer pour l'une d'elles, et le
  // lecteur qui a coché « une grande ville » et « ne pas être isolé » lisait un troisième mot qu'il
  // n'avait jamais écrit, en perdant les deux siens.
  //
  // Elle se lit après « pour la même raison : », jamais dans une énumération de priorités. Le nom du
  // champ le dit, pour qu'aucun futur appelant ne la remette dans un « dont ».
  headlineCause: string;
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

// LE CONFORT D'ÉTÉ, quand la douceur d'hiver n'est pas un contrepoids (lot D, Task 2). Fallback du
// tradeoff saisonnier : sans côté favorable à opposer, la composition ne montre qu'UN côté — le mismatch
// chaleur absorbé —, mais elle existe pour une raison précise : un MismatchFact ne porte PAS d'action, et
// le renvoi au confort du logement (au grain adresse) doit être restauré quelque part. C'est ici.
//
// Invariant « une seule composition climatique par dossier » : ce patron ne se déclenche QUE si le tradeoff
// saisonnier n'a pas été produit (cf. composeFacts). Le mismatch absorbé reste nommable par le héros
// (Task 3) via `headlineSubject` + `absorbedFactIds`, exactement comme le tradeoff.
export type ClimateComfortComposition = {
  id: string;
  kind: "climate_comfort";
  patternId: "climate_comfort";
  title: string;
  // Court, bas de casse, lu après un deux-points par le héros (« des étés supportables ») — hérité du
  // mismatch absorbé, jamais le titre. Même contrat que les autres patrons qui nomment une réserve.
  headlineSubject: string;
  summary: string; // le constat à l'échelle de la commune (le statement du mismatch absorbé)
  evidence: EvidenceRef[]; // les chips du mismatch (jours / nuits notables)
  // LE RENVOI AU LOGEMENT que le mismatch ne peut pas porter : restauré ici, au grain adresse
  // (summerComfortAction). C'est la raison d'être de ce patron.
  action: DecisionAction;
  limitation?: string;
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier;
  displaySection: "mismatches";
};

export type FactComposition =
  TradeoffComposition | SharedEvidenceComposition | GroupedVerificationComposition | ClimateComfortComposition;
