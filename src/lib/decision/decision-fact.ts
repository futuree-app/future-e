// Contrats du dossier de décision (slice 1, v2). Types PURS.
// DecisionFact = union discriminée : le TYPE impose la doctrine (un unknown a un impact,
// un compromise a deux côtés avec preuve, une verification a une action).
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import type { ClimatFacts } from "./climat-facts.ts";
import type { SanteFacts } from "./sante-facts.ts";
import type { RankBand } from "./mismatch-facts.ts";
import type { NamedAbsenceBasis, LocalNetworkAttestation, HigherEdAttestation } from "./absence-facts.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";
import type { CriteriaSummary } from "./criteria-registry.ts";
import type {
  CommuneAttributes, EvaluationContext, HardConstraintAssessment, HardConstraintKey,
} from "../hard-constraints.ts";

export type DecisionModule = "territoire" | "logement";
export type MaterialityTier = "decision_critical" | "structuring" | "secondary";
export type VerificationActionType =
  | "renseigner_adresse" | "verifier_sur_place" | "obtenir_document" | "demander_confirmation";

// La clé vit désormais dans le NOYAU PARTAGÉ (src/lib/hard-constraints.ts) : le dossier et le
// comparateur doivent parler des mêmes contraintes, sous les mêmes noms, ou ils recommenceront à
// diverger.
export type { HardConstraintKey } from "../hard-constraints.ts";

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
// LE FONDEMENT d'un mismatch : union discriminée. On ne porte QUE les fondements productibles aujourd'hui.
// La mesure physique (mer) et la catégorie d'agglo (taille) viendront au lot 3, avec leur propre kind.
export type RelativePositionBasis = {
  kind: "relative_position";
  rankLow: number; rankHigh: number;
  universe: "communes_france";
  distributionVersion: string;
};
// MESURE PHYSIQUE ABSOLUE (lot 3a, mer) : la grandeur brute EST le fait, auto-suffisante (pas de
// nationalContext, contrairement à named_absence). `unit` = "km" SEUL : doctrine « seulement le productible »
// appliquée À L'INTÉRIEUR du fondement (autoriser "min" créerait un état que le moteur ne sait ni produire ni
// expliquer, et qu'assertFactValid rejette). `value` = la distance BRUTE, auditable indépendamment de la
// convention.
export type AbsoluteMeasureBasis = {
  kind: "absolute_measure";
  value: number;
  unit: "km";
  conventionId: string;
};
export type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis;

// MISMATCH : le lieu répond MOINS BIEN à une priorité déclarée, sans que ce soit éliminatoire. Pas
// d'action (rien à vérifier, le constat est établi) ; sa seule limitation possible est le grain.
export type MismatchFact = BaseFact & {
  role: "mismatch";
  projectKey: PreferenceKey;
  basis: MismatchBasis;
  evidence: EvidenceRef[];
  limitation?: string;
};

export type DecisionFact =
  IncompatibilityFact | CompromiseFact | UnknownFact | VerificationFact | MismatchFact;

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

// ModuleFacts est un SUR-ENSEMBLE de CommuneAttributes : le dossier et le comparateur lisent les mêmes
// champs, sous les mêmes noms, et `toCommuneAttributes` ne fait que SÉLECTIONNER (si elle devait
// convertir, c'est que les deux moteurs auraient recommencé à diverger).
//
// `distanceCoteKm` est NULLABLE, comme dans CommuneAttributes : le forcer à `number` obligerait ses
// appelants à inventer une valeur, et une distance inconnue deviendrait une commune littorale.
export type ModuleFacts = CommuneAttributes & {
  catnatInondation: number | null;
  inondationRisque: number | null;
  // La trajectoire climatique (DRIAS), chargée par l'APPELANT comme `tailleVille` : le mapping reste pur.
  // NULLABLE mais NON OPTIONNEL : `undefined` créerait un troisième état entre « la donnée est là » et
  // « on l'a cherchée sans la trouver », et une règle finirait par confondre les deux.
  climat: ClimatFacts | null;
  // Le rang national à deux bornes, chargé par l'appelant (comme tailleVille, climat). NULLABLE mais NON
  // optionnel : `undefined` créerait un troisième état entre « lu » et « non lu ».
  rankBands: Record<string, RankBand> | null;
  // Attestations d'absence (lot 2a), chargées par le mapping depuis l'index. NON optionnelles : la branche
  // `measured: false` porte explicitement « non mesurée », il n'y a pas de troisième état implicite.
  localNetwork: LocalNetworkAttestation;
  higherEd: HigherEdAttestation;
  // La santé environnementale au grain COMMUNE (air, bruit des infrastructures, exposition industrielle).
  // Elle n'est pas un module (ADR-0010) : c'est une lecture, et ses autres faits (radon, argiles, bruit de
  // façade) sont vrais au grain ADRESSE, dans Logement.
  sante: SanteFacts | null;
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
  | "not_applicable" | "satisfied" | "incompatible" | "compromise" | "verification" | "unknown" | "uncertain"
  // MISMATCH : critère examiné, donnée robuste, résultat nettement DÉFAVORABLE, non éliminatoire. Peut être
  // MATÉRIEL (produit une carte) ou SILENCIEUX (poids 1 : facts vides). NEUTRAL : examiné, aucun signal
  // marqué (fait monter la couverture, aucune carte, aucun effet sur l'orientation).
  | "mismatch" | "neutral";

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

// Les 11 évaluations de contraintes dures, calculées UNE fois par runRules, plus le contexte (dont le
// point réellement testé, donc le GRAIN). Si chaque règle allait les chercher elle-même, onze règles
// feraient 121 évaluations par dossier, pour n'en garder que onze.
export type HardEvaluation = {
  context: EvaluationContext;
  byKey: Record<HardConstraintKey, HardConstraintAssessment>;
};

export type DecisionRule = {
  id: string;
  module: DecisionModule;
  hardConstraint?: HardConstraintKey; // si présent : la règle PORTE cette contrainte
  // Les règles de PRÉFÉRENCE ignorent le 3e paramètre : elles n'en déclarent que deux, et restent
  // assignables (TypeScript accepte une fonction qui déclare moins de paramètres).
  evaluate: (facts: ModuleFacts, project: UserProject, hard: HardEvaluation) => RuleEvaluation;
};

export type RunResult = {
  facts: DecisionFact[];
  evaluations: RuleEvaluation[];
  // `coveredHardConstraints` a été SUPPRIMÉ. Il marquait une contrainte « couverte » dès que l'outcome
  // n'était pas not_applicable : un `uncertain` (donnée absente, référence non résolue) y était donc
  // compté comme EXAMINÉ, l'exact contraire de la doctrine. Il n'était consommé nulle part (l'assembleur
  // passe par criteria-registry, qui déduit la couverture des évaluations exploitables). On ne rafistole
  // pas un champ faux que personne ne lit : on le retire.
};

export type ConclusionState =
  | "established_incompatibility" | "no_incompatibility_established"
  | "insufficient_evidence" | "no_hard_constraint_declared" | "project_not_structured";
export type UncoveredConstraint = { key: HardConstraintKey; label: string };
export type DossierSection = {
  key: "incompatibilities" | "mismatches" | "compromises" | "unknowns" | "verifications";
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
