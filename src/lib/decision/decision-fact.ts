// Contrats du dossier de décision (slice 1, v2). Types PURS.
// DecisionFact = union discriminée : le TYPE impose la doctrine (un unknown a un impact,
// un compromise a deux côtés avec preuve, une verification a une action).
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";

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
  statement: string;
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
  pprn: SourceCoverage; zoneReglementee: boolean;
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

export type RuleOutcome =
  | "not_applicable" | "satisfied" | "incompatible" | "compromise" | "verification" | "unknown" | "uncertain";
export type RuleEvaluation = {
  ruleId: string;
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
  conclusionBasis: { ruleIds: string[]; factIds: string[]; evidence: EvidenceRef[] };
  sections: DossierSection[];
  uncovered: UncoveredConstraint[];
};
