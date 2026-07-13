// Contrats du dossier de décision (slice 1, v2). Types PURS.
// DecisionFact = union discriminée : le TYPE impose la doctrine (un unknown a un impact,
// un compromise a deux côtés avec preuve, une verification a une action).
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
import type { CriteriaSummary } from "./criteria-registry.ts";

export type DecisionModule = "territoire" | "logement";
export type MaterialityTier = "decision_critical" | "structuring" | "secondary";
export type VerificationActionType =
  | "renseigner_adresse" | "verifier_sur_place" | "obtenir_document" | "demander_confirmation";

export type HardConstraintKey =
  | "departements" | "zones" | "excludeZones" | "montagne" | "reliefProche"
  | "nearSea" | "excludeSea" | "nearPlace" | "communeSize" | "excludePlace" | "sizeRelativeTo";

export type SourceCoverage = "present" | "none" | "unavailable"; // none = source a répondu, rien trouvé

export type EvidenceRef = {
  factId: string;
  module: DecisionModule;
  label: string;
  observedValue?: string; // la valeur mesurée : "42 km", "18 000 hab.", "72/100"
  grain: "commune" | "adresse" | "secteur";
  href?: string; // optionnel slice 1
  sourceMode?: "persisted_snapshot" | "live_fetch"; // Logement : DPE persisté vs réglementaire frais
  observedAt?: string; // pour live_fetch
};

type BaseFact = {
  id: string;
  ruleId: string;
  sourceFactIds: string[];
  module: DecisionModule;
  // LE CONSTAT : ce que le fait établit, avec son contexte et parfois sa limite. C'est ce que la carte
  // affiche, et il peut être long.
  statement: string;
  // LE SUJET : de quoi ce fait parle, en 3 à 6 mots, tel qu'on le NOMME dans une phrase (« l'exposition
  // de la commune à l'inondation », « le retrait-gonflement des argiles sous cette adresse »).
  //
  // Il existe parce que la conclusion doit pouvoir NOMMER un fait sans le RECOPIER. Sans lui, elle
  // n'avait que le constat à citer, et redisait mot pour mot la carte située trois centimètres plus bas.
  // La conclusion nomme, les cartes démontrent.
  //
  // Jamais une catégorie (« des risques naturels »), jamais une phrase, jamais une action.
  topic: string;
  materialityTier: MaterialityTier;
};

export type IncompatibilityFact = BaseFact & {
  role: "incompatibility";
  evidenceStrength: "established" | "indicative";
  hardConstraintKey: HardConstraintKey;
  evidence: EvidenceRef[];
  limitation?: string;
};
export type CompromiseSide = { projectKey: PreferenceKey; statement: string; evidence: EvidenceRef[] };
export type CompromiseFact = BaseFact & { role: "compromise"; sides: [CompromiseSide, CompromiseSide] };
export type UnknownFact = BaseFact & {
  role: "unknown";
  impact: "blocking" | "scoped";
  evidence: EvidenceRef[];
  action?: { type: VerificationActionType; label: string };
};
export type VerificationFact = BaseFact & {
  role: "verification";
  evidence: EvidenceRef[];
  action: { type: VerificationActionType; label: string };
  limitation?: string;
};
export type DecisionFact = IncompatibilityFact | CompromiseFact | UnknownFact | VerificationFact;

export type LogementFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent"; // DPE SAUVEGARDÉ (persisté)
  dpeLabel: string | null; // classe exacte (F/G/E…)
  rga: SourceCoverage; expositionBati: boolean;
  pprn: SourceCoverage; zoneReglementee: boolean; pprnLabel: string | null;
  cavites: SourceCoverage; caviteProche: boolean;
  patrimoine: SourceCoverage; perimetrePatrimonial: boolean;
  sinistralite: SourceCoverage; sinistraliteActive: boolean;
  addressLabel: string;
};

export type ModuleFacts = {
  insee: string;
  nom: string;
  distanceCoteKm: number;
  population: number | null;
  altitude: number | null;
  catnatInondation: number | null;
  inondationRisque: number | null;
  scores: Partial<Record<PreferenceKey, number | null>>;
  hasAddress: boolean;
  logement?: LogementFacts; // slice 1.5 : présent seulement quand une analyse adresse est là
};

// LE CONTRAT DES OUTCOMES. Le registre des critères (criteria-registry.ts) en dépend entièrement :
//   not_applicable : HORS SUJET. Le critère n'est pas déclaré, ou la règle ne s'applique pas ici.
//                    Le critère reste NON EXAMINÉ.
//   satisfied      : déclaré, examiné, RIEN À REDIRE. Silencieux (aucun fait), mais c'est un point
//                    FAVORABLE, et il fait monter la couverture. Ne JAMAIS rendre not_applicable pour
//                    dire « tout va bien » : c'est le bug que la slice 2.1 a corrigé (une exposition
//                    inondation faible était comptée comme un trou de couverture).
//   unknown        : la règle s'applique, la donnée manque. Le critère reste NON EXAMINÉ.
//   uncertain      : idem, sans même un fait à montrer.
export type RuleOutcome =
  | "not_applicable" | "satisfied" | "incompatible" | "compromise" | "verification" | "unknown" | "uncertain";

export type RuleEvaluation = {
  ruleId: string;
  // Les critères que cette règle ÉVALUE, jamais ceux auxquels elle est seulement « reliée ». Le
  // registre marque ces critères EXAMINÉS dès que l'outcome est exploitable : une règle qui listerait
  // ici un critère qu'elle ne regarde pas gonflerait la couverture d'un mensonge.
  projectKeys: string[];
  outcome: RuleOutcome;
  facts: DecisionFact[];
  reason: string;
};

export type DecisionRule = {
  id: string;
  module: DecisionModule;
  hardConstraint?: HardConstraintKey; // si présent : participe à la couverture de cette contrainte
  evaluate: (facts: ModuleFacts, project: UserProject) => RuleEvaluation;
};

export type RunResult = {
  facts: DecisionFact[];
  evaluations: RuleEvaluation[];
  coveredHardConstraints: HardConstraintKey[];
};

export type ConclusionState =
  | "established_incompatibility" | "no_incompatibility_established"
  | "insufficient_evidence" | "no_hard_constraint_declared" | "project_not_structured";
export type UncoveredConstraint = { key: HardConstraintKey; label: string };
export type DossierSection = {
  key: "incompatibilities" | "compromises" | "unknowns" | "verifications";
  title: string;
  facts: DecisionFact[];
};
export type Dossier = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  conclusion: string;
  // Le plan narratif (slice 2) : présence, ordre, sources, matière obligatoire et repli de chaque
  // registre. `conclusion` en est la concaténation, gardée pour qui veut une seule phrase.
  narrativePlan: ConclusionNarrativePlan;
  // Le registre des critères déclarés (slice 2.1) : couverture et orientation, mesurées sur ce que le
  // LECTEUR a déclaré. Information de premier ordre du dossier, pas un détail interne de la conclusion :
  // le comparateur et le PDF en auront besoin.
  criteria: CriteriaSummary;
  conclusionBasis: { ruleIds: string[]; factIds: string[]; evidence: EvidenceRef[] };
  sections: DossierSection[];
  uncovered: UncoveredConstraint[];
};
