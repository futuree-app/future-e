// Contrats du dossier de décision (slice 1, v2). Types PURS.
// DecisionFact = union discriminée : le TYPE impose la doctrine (un unknown a un impact,
// un compromise a deux côtés avec preuve, une verification a une action).
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import type { ClimatFacts } from "./climat-facts.ts";
import type { SanteFacts } from "./sante-facts.ts";
import type { RankBand } from "./mismatch-facts.ts";
import type { NamedAbsenceBasis, LocalNetworkAttestation, HigherEdAttestation } from "./absence-facts.ts";
import type { FactComposition } from "./fact-composition.ts";
import type { AgglomerationCategory } from "./agglomeration-facts.ts";
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
  grain: "commune" | "adresse" | "secteur" | "unite_urbaine";
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
  //
  // Et JAMAIS LE NOM DE LA COMMUNE. Le topic n'est lu qu'à un seul endroit, la conclusion, qui nomme
  // déjà le lieu dans la même phrase : « Le principal point à contrôler à Toulouse : les fortes
  // chaleurs à Toulouse. » Huit règles portaient ce doublon. Le grain non plus n'y entre pas (deux
  // faits d'adresse cités côte à côte répétaient « sur cette adresse »).
  topic: string;
  materialityTier: MaterialityTier;
};

// L'ACTION : le geste que le lecteur va faire, et rien d'autre.
//
// `label` est la LIGNE DE FACE, une par carte : c'est là que la voix se joue, et elle est bornée
// (70 caractères, pas de point final, cf. assertFactValid). Le verbe nomme le geste RÉEL — regardez,
// demandez, consultez, écoutez, situez, faites chiffrer — jamais un « vérifiez » générique répété de
// carte en carte, qui transforme une colonne de constats en formulaire et contredit le lexique du
// dossier (un constat établi se CONTRÔLE, une condition non testée se VÉRIFIE).
//
// `detail` porte ce qu'il faut regarder concrètement. Il ne tient pas sur la face : il vit dans le
// dépliable, sous « À vérifier », séparé de la méthode du signal. Il ne promet aucun résultat et
// n'affirme ni droit ni délai (invariants 3 et 5) : il décrit la pratique, jamais la règle de droit.
export type DecisionAction = { type: VerificationActionType; label: string; detail?: string };

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
  action?: DecisionAction;
  status?: string; // « Donnée non disponible » et consorts : même rôle que sur VerificationFact
};
export type VerificationFact = BaseFact & {
  role: "verification";
  evidence: EvidenceRef[];
  action: DecisionAction;
  limitation?: string;
  // L'ÉTAT ÉTABLI, EN DEUX À QUATRE MOTS. « Aléa moyen ou fort », « Périmètre protégé » : ce que le
  // fait constate, rendu SCANNABLE avant le constat. Ce n'est ni un score ni une preuve (pas de
  // valeur mesurée, pas de source, non cliquable) : c'est l'observation nue, pour que le lecteur voie
  // l'information avant de lire la phrase qui la développe. Produit par la règle, jamais découpé dans
  // le statement par l'UI (ce serait raconter ce qu'on ne mesure pas). Optionnel : un fait sans état
  // franc (une trajectoire, une exposition graduée) n'en porte pas plutôt qu'un état fabriqué.
  status?: string;
  // POURQUOI futur•e SIGNALE ce fait : la convention de seuil (« signale cette exposition à partir de
  // 8 jours par an… »). DISTINCTE de `limitation` (ce que le constat ne permet pas de conclure) : la
  // mélanger au constat noyait la trajectoire, la mélanger à la limite réunissait deux natures. Champ
  // propre, rendu en ligne discrète sur la carte. La conclusion rédigée ne la reçoit pas (card-only) :
  // une conclusion n'a pas à réciter une convention de produit.
  signalConvention?: string;
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
// ÉTAT CATÉGORIEL (lot 3b, taille) : l'appartenance à une catégorie de taille EST le fait (pas un
// percentile). Le nombre brut et sa provenance vivent dans l'EvidenceRef, pas dans le basis.
export type CategoricalStateBasis = {
  kind: "categorical_state";
  observedCategory: AgglomerationCategory;
  conventionId: string;
};
// SEUIL CLIMATIQUE MULTIVARIÉ (lot D, chaleur). La chaleur est jugée sur DEUX mesures (jours au-dessus de
// 35 °C, nuits tropicales), chacune avec son seuil de signalement et sa valeur projetée à un horizon. Une
// SEULE mesure défavorable suffit à déclencher (`trigger: "any"`), et le fondement le rend LISIBLE : quel axe
// a déclenché, quels seuils, quel horizon. On n'aplatit pas cette décision dans `absolute_measure` (une
// distance unique) — doctrine « on n'ajoute à l'union que le productible » : une règle sait désormais produire
// et expliquer cet état. `measures` non vide, chaque mesure auditable indépendamment de la convention.
export type ClimateThresholdBasis = {
  kind: "climate_threshold";
  horizon: number;         // 2050
  referencePeriod: string; // "1976-2005"
  conventionId: string;
  trigger: "any";          // une seule mesure défavorable suffit
  measures: Array<{
    key: "days_over_35" | "tropical_nights";
    projectedValue: number;
    threshold: number;
    unit: "days" | "nights";
    isUnfavorable: boolean;
  }>;
};
export type MismatchBasis =
  NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis | CategoricalStateBasis | ClimateThresholdBasis;

// LE FONDEMENT D'UN ALIGNMENT : la LISTE BLANCHE, portée par le TYPE. `named_absence` en est EXCLU — une
// absence de signal ne prouve jamais un positif —, et TypeScript l'interdit désormais à la CONSTRUCTION,
// pas seulement assertFactValid à l'exécution. Même doctrine que pour AbsoluteMeasureBasis : « ne pas
// autoriser dans l'union un état que le moteur ne sait ni produire ni expliquer ».
export type AlignmentBasis =
  RelativePositionBasis | AbsoluteMeasureBasis | CategoricalStateBasis;

// MISMATCH : le lieu répond MOINS BIEN à une priorité déclarée, sans que ce soit éliminatoire. Pas
// d'action (rien à vérifier, le constat est établi) ; sa seule limitation possible est le grain.
export type MismatchFact = BaseFact & {
  role: "mismatch";
  projectKey: PreferenceKey;
  basis: MismatchBasis;
  evidence: EvidenceRef[];
  limitation?: string;
  // LE SUJET DU HEADLINE : la PRIORITÉ du lecteur, telle qu'elle se lit après un deux-points
  // (« Toulouse répond moins bien à une de vos priorités : la proximité de la mer. »). Distinct de
  // `topic`, qui nomme parfois l'indicateur défavorable (« la distance à la mer ») et inverserait
  // le sens à cette place. Obligatoire : une règle qui l'oublierait ferait retomber le héros sur
  // une formulation inversée, sans qu'aucune validation ne s'en aperçoive.
  headlineSubject: string;
  // L'ÉTAT MESURÉ, SCANNABLE (« Parmi les 20 % les moins favorables », « Un village »). Même rôle que
  // sur VerificationFact : le lecteur voit la position avant de lire la phrase. Un mismatch EST une
  // position établie, donc il en porte une, comme les cartes « à contrôler » — cohérence entre les
  // deux sections. Produit par la règle depuis le `basis`, jamais découpé dans le statement.
  status?: string;
};

// ALIGNMENT : le lieu répond à une priorité déclarée, et c'est ÉTABLI. MIROIR EXACT du mismatch (même
// fondement, mêmes gardes), là où le mismatch dit « moins bien », l'alignment dit « parmi les mieux ».
// `alignment` et non `match` : `role === "match"` / `role === "mismatch"` se confondent à la relecture,
// et la collision se paierait en bug. `alignment` et non `positive` : il dit une correspondance avec une
// priorité DÉCLARÉE, jamais une qualité absolue du territoire (ça, c'est la pente du dépliant touristique).
//
// Aucune `action` (rien à mener), aucune `limitation` DE PORTÉE, aucun `signalConvention` : un fait établi
// qui n'appelle aucune vérification n'a rien à border. Seule exception, `limitation` : la nuance
// MÉTHODOLOGIQUE card-only héritée du critère (ERA5-Land pour l'ensoleillement, 1976-2005 pour la douceur).
export type AlignmentFact = BaseFact & {
  role: "alignment";
  projectKey: PreferenceKey;
  basis: AlignmentBasis; // liste blanche portée par le TYPE : jamais named_absence (voir AlignmentBasis)
  evidence: EvidenceRef[];
  headlineSubject: string; // la priorité du lecteur, à lire après un deux-points, comme sur le mismatch
  // LA 2e LIGNE DE LA CARTE « Ce qui correspond ». Le fait porte deux surfaces (décision D1 du porteur) :
  // `statement` est la phrase AUTONOME (conclusion / export / audit) ; `faceStatement` est le fragment
  // scannable rendu sous le titre sur la carte (« Parmi les 10 % de communes… », « Le littoral est à
  // environ 8 km… »). La règle les produit toutes deux ; le composant n'a rien à recalculer.
  faceStatement: string;
  limitation?: string; // UNIQUEMENT la nuance méthodologique card-only du critère, jamais une limite de portée
};

export type DecisionFact =
  IncompatibilityFact | CompromiseFact | UnknownFact | VerificationFact | MismatchFact | AlignmentFact;

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
  // PROVENANCE de tailleVille, chargée par l'appelant (comme tailleVille). NON optionnelle, nullable :
  // "urban_unit" autorise « agglomération » ; "commune" impose « population communale » ; null (taille
  // absente OU anomalie de cache) -> uncertain, jamais une catégorie ni un repli communal.
  tailleVilleSource: "urban_unit" | "commune" | null;
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
// LA CARTE DE PRÉSENTATION : fait simple ou composition, dans UNE liste commune. Une composition
// compte pour une carte, donc elle vit dans la même liste, sous le même tri et le même cap : elle ne
// passe jamais devant une carte plus matérielle du seul fait d'être composée.
export type DossierCard =
  | { kind: "fact"; fact: DecisionFact }
  | { kind: "composition"; composition: FactComposition };
export type DossierSection = {
  key: "incompatibilities" | "alignments" | "mismatches" | "compromises" | "unknowns" | "verifications";
  title: string;
  cards: DossierCard[];
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
  // Les compositions AFFICHÉES (post-cap) et les faits qu'elles ont absorbés : ceux-ci quittent les
  // sections mais restent lisibles au dépliable d'audit de leur composition (invariant 4).
  compositions: FactComposition[];
  absorbedFacts: DecisionFact[];
  // Comptes de PRÉSENTATION (cartes affichées), distincts des faits émis : le lecteur doit pouvoir
  // compter les cartes et retomber dessus.
  presentation: { elementaryFactShown: number; compositionShown: number; absorbedFactTotal: number };
  uncovered: UncoveredConstraint[];
};
