// Règles Logement (slice 1.5). Statut-aware : present -> verification, unavailable -> unknown scopée,
// none -> rien. Les fabriques ne produisent QUE verification/unknown (jamais incompatibility).
// Posture-aware. Chaque fait porte le constat établi (statement) + l'action propre.
import type { DecisionRule, VerificationFact, UnknownFact, EvidenceRef, RuleEvaluation, MaterialityTier, LogementFacts, SourceCoverage, VerificationActionType } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { EvidenceTargetKey } from "./evidence-targets.ts";

import { GESTES, type Bucket, type ActionCopy } from "./logement-gestes.ts";

function bucket(p: UserProject): Bucket {
  if (p.intent === "achat") return "achat";
  if (p.intent === "location") return "location";
  if (p.posture === "habitant") return "reside";
  return "neutre";
}

function ev(l: LogementFacts, factId: string, mode: "persisted_snapshot" | "live_fetch", grain: "adresse" | "commune" = "adresse", observedValue?: string, targetKey?: EvidenceTargetKey): EvidenceRef {
  return { factId, module: "logement", label: l.addressLabel, observedValue, grain, href: "/rapport/logement", sourceMode: mode, ...(targetKey ? { targetKey } : {}) };
}
function logementVerification(id: string, evidence: EvidenceRef, tier: MaterialityTier, topic: string, statement: string, actionType: VerificationActionType, action: ActionCopy, status?: string, limitation?: string): VerificationFact {
  return { id: `logement:${id}`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement", role: "verification", materialityTier: tier, topic, statement, evidence: [evidence], action: { type: actionType, label: action.label, ...(action.detail ? { detail: action.detail } : {}) }, ...(status ? { status } : {}), ...(limitation ? { limitation } : {}) };
}
function logementScopedUnknown(id: string, evidence: EvidenceRef, topic: string, statement: string): UnknownFact {
  return { id: `logement:${id}:unknown`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement", role: "unknown", impact: "scoped", materialityTier: "secondary", topic, statement, evidence: [evidence] };
}
const out = (id: string, fact: VerificationFact | UnknownFact): RuleEvaluation => ({ ruleId: `logement.${id}`, projectKeys: [], outcome: fact.role === "unknown" ? "unknown" : "verification", facts: [fact], reason: fact.role });
const na = (id: string): RuleEvaluation => ({ ruleId: `logement.${id}`, projectKeys: [], outcome: "not_applicable", facts: [], reason: "rien à signaler" });

// Règle statut-aware générique pour les cinq familles réglementaires.
function coverageRule(cfg: {
  id: string; tier: MaterialityTier; buckets?: Bucket[]; grain?: "adresse" | "commune";
  coverage: (l: LogementFacts) => SourceCoverage; flag: (l: LogementFacts) => boolean;
  // Le SUJET du fait, 3-6 mots : ce que la conclusion NOMME quand elle cite ce point, sans recopier le
  // constat que la carte affiche. Il vaut aussi pour l'inconnue (la source n'a pas répondu SUR ce sujet).
  //
  // Il ne porte JAMAIS le grain (« sous cette adresse ») : le grain est une propriété de la PREUVE, que
  // les cartes affichent déjà. Deux sujets d'adresse cités côte à côte produisaient « … les argiles sous
  // cette adresse et un plan de prévention des risques sur cette adresse ». Le sujet est nu ; il reçoit
  // le nom de la commune quand c'est ELLE qu'il décrit.
  topic: (nom: string) => string;
  statement: (l: LogementFacts) => string; limitation?: string; actionType: VerificationActionType; action: Record<Bucket, ActionCopy>;
  // L'ÉTAT ÉTABLI, scannable (« Aléa moyen ou fort »). Une chaîne, pas une fonction : ces cinq faits
  // n'émettent QUE quand leur flag est vrai, donc l'état est toujours le même quand la carte existe.
  status?: string;
  // LE PHÉNOMÈNE que la preuve établit, pour renvoyer vers la carte du module Logement qui le DÉMONTRE.
  // Absent quand aucune carte ne le présente encore : le lien retombe alors sur le module (cf.
  // evidence-targets.ts), il ne promet pas une démonstration qui n'existe pas.
  targetKey?: EvidenceTargetKey;
  observedValue?: (l: LogementFacts) => string | undefined; unavailableStatement: string;
}): DecisionRule {
  const grain = cfg.grain ?? "adresse";
  return {
    id: `logement.${cfg.id}`, module: "logement",
    evaluate: (f, p): RuleEvaluation => {
      const l = f.logement;
      if (!l) return na(cfg.id);
      const b = bucket(p);
      if (cfg.buckets && !cfg.buckets.includes(b)) return na(cfg.id);
      const cov = cfg.coverage(l);
      if (cov === "unavailable") return out(cfg.id, logementScopedUnknown(cfg.id, ev(l, `logement.${cfg.id}`, "live_fetch", grain, undefined, cfg.targetKey), cfg.topic(f.nom), cfg.unavailableStatement));
      if (cov === "present" && cfg.flag(l)) {
        return out(cfg.id, logementVerification(cfg.id, ev(l, `logement.${cfg.id}`, "live_fetch", grain, cfg.observedValue?.(l), cfg.targetKey), cfg.tier, cfg.topic(f.nom), cfg.statement(l), cfg.actionType, cfg.action[b], cfg.status, cfg.limitation));
      }
      return na(cfg.id);
    },
  };
}

// LES 23 VARIANTES POSTURE-AWARE (6 tables x 4 postures, moins patrimoine/location que la règle
// DPE : fait PERSISTÉ (pas de coverage), jamais unavailable. Formulé depuis la classe exacte.
const ruleDpe: DecisionRule = {
  id: "logement.dpe-faible", module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const l = f.logement;
    if (!l || (l.dpe !== "passoire" && l.dpe !== "energivore")) return na("dpe-faible");
    const desc = l.dpe === "passoire" ? "une passoire énergétique" : "un logement énergivore";
    const cls = l.dpeLabel ? `${l.dpeLabel}, ${desc}` : desc;
    const evidence = ev(l, "logement.dpe", "persisted_snapshot", "adresse", l.dpeLabel ? `DPE ${l.dpeLabel}` : undefined, "housing.energy_label");
    const dpeStatus = l.dpeLabel ? `DPE ${l.dpeLabel}` : (l.dpe === "passoire" ? "Passoire énergétique" : "Logement énergivore");
    return out("dpe-faible", logementVerification("dpe-faible", evidence, "structuring", "l'étiquette énergétique du logement", `À cette adresse, le diagnostic choisi classe ce logement ${cls}.`, "demander_confirmation", GESTES.energie[bucket(p)], dpeStatus));
  },
};

// Les deux règles que le patron de composition argiles+PPR référence (fact-compositions.ts) : la
// constante est la source unique du ruleId, jamais une chaîne recopiée là-bas.
export const RULE_EXPOSITION_BATI = "logement.exposition-bati";
export const RULE_ZONE_REGLEMENTEE = "logement.zone-reglementee";

// CONFORT D'ÉTÉ. Fait PERSISTÉ comme le DPE (dérivé du même diagnostic), donc sans coverage : il n'y
// a pas de source à interroger qui pourrait être en panne. Il n'émet QUE quand l'indicateur
// réglementaire vaut « insuffisant » sur un DPE décrivant ce logement — cf. `logement-facts.ts`.
//
// `secondary`, jamais `structuring` : un confort d'été insuffisant est un constat sur le bâti, pas
// une condition de vie invivable. Ce qu'il change dépend de l'exposition du territoire à la chaleur,
// que le module Territoire porte déjà — les deux se lisent ensemble, aucun ne tranche pour l'autre.
const ruleConfortEte: DecisionRule = {
  id: "logement.confort-ete", module: "logement",
  evaluate: (l, p): RuleEvaluation => {
    const f = l.logement;
    if (!f?.confortEteInsuffisant) return na("confort-ete");
    const b = bucket(p);
    const copy = GESTES.confort[b];
    return out("confort-ete", logementVerification(
      "confort-ete",
      ev(f, "logement.confort-ete", "persisted_snapshot"),
      "secondary",
      "le confort d'été de ce logement",
      "Le diagnostic classe l'indicateur réglementaire de confort d'été de ce logement comme insuffisant.",
      "verifier_sur_place",
      copy,
      "Confort d'été insuffisant",
      "Cet indicateur décrit le bâti, pas les conditions vécues : l'exposition réelle dépend aussi de l'étage, de l'orientation et des usages.",
    ));
  },
};

export const LOGEMENT_RULES: DecisionRule[] = [
  ruleConfortEte,
  ruleDpe,
  coverageRule({ id: "exposition-bati", tier: "structuring", targetKey: "housing.clay_shrink_swell", topic: () => "le retrait-gonflement des argiles", status: "Aléa moyen ou fort", coverage: (l) => l.rga, flag: (l) => l.expositionBati,
    // La sévérité (« aléa moyen ou fort ») est portée par le StatusTag rendu au-dessus du constat : la
    // recopier ici en parenthèse la disait deux fois à un centimètre d'écart.
    statement: () => "À cette adresse, le sol est exposé au retrait-gonflement des argiles.",
    limitation: "L'exposition de la zone ne prouve pas un dommage sur ce bien.", actionType: "verifier_sur_place", action: GESTES.bati,
    unavailableStatement: "L'exposition du bâti (retrait-gonflement des argiles) n'a pas pu être vérifiée à cette adresse." }),
  coverageRule({ id: "zone-reglementee", tier: "structuring", targetKey: "housing.regulated_zone", topic: () => "un plan de prévention des risques", status: "Plan applicable", coverage: (l) => l.pprn, flag: (l) => l.zoneReglementee,
    statement: (l) => l.pprnLabel ? `À cette adresse, un plan de prévention des risques s'applique : ${l.pprnLabel}.` : "À cette adresse, au moins un plan de prévention des risques s'applique.",
    actionType: "obtenir_document", action: GESTES.reglementaire,
    unavailableStatement: "Le zonage réglementaire (plans de prévention) n'a pas pu être vérifié à cette adresse." }),
  coverageRule({ id: "cavite", tier: "structuring", topic: () => "les cavités souterraines proches", status: "Recensée à moins de 500 m", coverage: (l) => l.cavites, flag: (l) => l.caviteProche,
    statement: () => "À cette adresse, une ou plusieurs cavités souterraines sont recensées à moins de 500 m.",
    limitation: "Recensement d'ouvrages/événements proches, pas une preuve sous ce logement.", actionType: "verifier_sur_place", action: GESTES.cavite,
    unavailableStatement: "Les cavités souterraines n'ont pas pu être vérifiées à cette adresse." }),
  coverageRule({ id: "patrimoine", tier: "secondary", buckets: ["neutre", "achat", "reside"], topic: () => "le périmètre patrimonial protégé", status: "Périmètre protégé", coverage: (l) => l.patrimoine, flag: (l) => l.perimetrePatrimonial,
    statement: () => "À cette adresse, le bien est dans un périmètre patrimonial protégé.", actionType: "obtenir_document", action: GESTES.patrimoine,
    unavailableStatement: "Les protections patrimoniales n'ont pas pu être vérifiées à cette adresse." }),
  coverageRule({ id: "sinistralite", tier: "secondary", grain: "commune", topic: () => "les indemnisations recensées", status: "Indemnisations recensées", coverage: (l) => l.sinistralite, flag: (l) => l.sinistraliteActive,
    statement: () => "À l'échelle de la commune, des indemnisations liées à la sécheresse ou aux inondations sont recensées.",
    limitation: "Ces données ne permettent pas d'établir l'historique de ce logement.", actionType: "obtenir_document", action: GESTES.sinistralite,
    unavailableStatement: "La sinistralité de la commune n'a pas pu être établie." }),
];
