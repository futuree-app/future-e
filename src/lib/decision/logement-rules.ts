// Règles Logement (slice 1.5). Statut-aware : present -> verification, unavailable -> unknown scopée,
// none -> rien. Les fabriques ne produisent QUE verification/unknown (jamais incompatibility).
// Posture-aware. Chaque fait porte le constat établi (statement) + l'action propre.
import type { DecisionRule, VerificationFact, UnknownFact, EvidenceRef, RuleEvaluation, MaterialityTier, LogementFacts, SourceCoverage, VerificationActionType } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

type Bucket = "neutre" | "achat" | "reside" | "location";
function bucket(p: UserProject): Bucket {
  if (p.intent === "achat") return "achat";
  if (p.intent === "location") return "location";
  if (p.posture === "habitant") return "reside";
  return "neutre";
}
function ev(l: LogementFacts, factId: string, mode: "persisted_snapshot" | "live_fetch", grain: "adresse" | "commune" = "adresse", observedValue?: string): EvidenceRef {
  return { factId, module: "logement", label: l.addressLabel, observedValue, grain, href: "/rapport/logement", sourceMode: mode };
}
function logementVerification(id: string, evidence: EvidenceRef, tier: MaterialityTier, topic: string, statement: string, actionType: VerificationActionType, actionLabel: string, limitation?: string): VerificationFact {
  return { id: `logement:${id}`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement", role: "verification", materialityTier: tier, topic, statement, evidence: [evidence], action: { type: actionType, label: actionLabel }, ...(limitation ? { limitation } : {}) };
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
  statement: (l: LogementFacts) => string; limitation?: string; actionType: VerificationActionType; action: Record<Bucket, string>;
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
      if (cov === "unavailable") return out(cfg.id, logementScopedUnknown(cfg.id, ev(l, `logement.${cfg.id}`, "live_fetch", grain), cfg.topic(f.nom), cfg.unavailableStatement));
      if (cov === "present" && cfg.flag(l)) {
        return out(cfg.id, logementVerification(cfg.id, ev(l, `logement.${cfg.id}`, "live_fetch", grain, cfg.observedValue?.(l)), cfg.tier, cfg.topic(f.nom), cfg.statement(l), cfg.actionType, cfg.action[b], cfg.limitation));
      }
      return na(cfg.id);
    },
  };
}

const batiAction: Record<Bucket, string> = { achat: "Demandez l'historique des fissures et sinistres, faites vérifier les fondations.", location: "Signalez au bailleur toute fissure apparente.", reside: "Surveillez et photographiez d'éventuelles fissures dans le temps.", neutre: "Regardez les signes visibles sur le bâti." };
const pprnAction: Record<Bucket, string> = { achat: "Consultez le règlement de la zone en mairie avant tout projet de travaux ou d'extension.", location: "Demandez au bailleur si le logement est concerné par des prescriptions particulières.", reside: "Vérifiez le règlement de la zone avant une extension ou une rénovation lourde.", neutre: "Lisez le règlement de la zone en mairie." };
const caviteAction: Record<Bucket, string> = { achat: "Faites vérifier l'état du sol et des fondations avant de vous engager.", location: "Signalez au bailleur tout affaissement ou fissure.", reside: "Surveillez tout signe d'affaissement ou de fissure.", neutre: "Renseignez-vous sur les cavités recensées et leur suivi." };
const patrimoineAction: Record<Bucket, string> = { achat: "Avant des travaux extérieurs, vérifiez en mairie ce que le périmètre autorise (avis de l'ABF possible).", location: "", reside: "Avant des travaux extérieurs, vérifiez en mairie ce que le périmètre autorise.", neutre: "Renseignez-vous en mairie sur ce que le périmètre patrimonial autorise." };
const siniAction: Record<Bucket, string> = { achat: "Demandez l'état des risques et l'historique des sinistres du bien.", location: "Demandez au bailleur l'état des risques et signalez tout sinistre survenu.", reside: "Renseignez-vous sur l'historique des sinistres et des indemnisations du logement.", neutre: "Consultez l'état des risques de la commune." };

// DPE : fait PERSISTÉ (pas de coverage), jamais unavailable. Formulé depuis la classe exacte.
const ruleDpe: DecisionRule = {
  id: "logement.dpe-faible", module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const l = f.logement;
    if (!l || (l.dpe !== "passoire" && l.dpe !== "energivore")) return na("dpe-faible");
    const desc = l.dpe === "passoire" ? "une passoire énergétique" : "un logement énergivore";
    const cls = l.dpeLabel ? `${l.dpeLabel}, ${desc}` : desc;
    const action: Record<Bucket, string> = { achat: "Faites chiffrer les travaux d'amélioration avant de vous engager.", location: "Vérifiez la date du diagnostic et les charges auprès du bailleur avant signature.", reside: "Documentez les travaux d'amélioration engagés.", neutre: "Regardez le détail du diagnostic énergétique et sa date." };
    const evidence = ev(l, "logement.dpe", "persisted_snapshot", "adresse", l.dpeLabel ? `DPE ${l.dpeLabel}` : undefined);
    return out("dpe-faible", logementVerification("dpe-faible", evidence, "structuring", "l'étiquette énergétique du logement", `À cette adresse, le diagnostic choisi classe ce logement ${cls}.`, "demander_confirmation", action[bucket(p)]));
  },
};

// Les deux règles que le patron de composition argiles+PPR référence (fact-compositions.ts) : la
// constante est la source unique du ruleId, jamais une chaîne recopiée là-bas.
export const RULE_EXPOSITION_BATI = "logement.exposition-bati";
export const RULE_ZONE_REGLEMENTEE = "logement.zone-reglementee";

export const LOGEMENT_RULES: DecisionRule[] = [
  ruleDpe,
  coverageRule({ id: "exposition-bati", tier: "structuring", topic: () => "le retrait-gonflement des argiles", coverage: (l) => l.rga, flag: (l) => l.expositionBati,
    statement: () => "À cette adresse, le sol est exposé au retrait-gonflement des argiles (aléa moyen ou fort).",
    limitation: "L'exposition de la zone ne prouve pas un dommage sur ce bien.", actionType: "verifier_sur_place", action: batiAction,
    unavailableStatement: "L'exposition du bâti (retrait-gonflement des argiles) n'a pas pu être vérifiée à cette adresse." }),
  coverageRule({ id: "zone-reglementee", tier: "structuring", topic: () => "un plan de prévention des risques", coverage: (l) => l.pprn, flag: (l) => l.zoneReglementee,
    statement: (l) => l.pprnLabel ? `À cette adresse, un plan de prévention des risques s'applique : ${l.pprnLabel}.` : "À cette adresse, au moins un plan de prévention des risques s'applique.",
    actionType: "obtenir_document", action: pprnAction,
    unavailableStatement: "Le zonage réglementaire (plans de prévention) n'a pas pu être vérifié à cette adresse." }),
  coverageRule({ id: "cavite", tier: "structuring", topic: () => "les cavités souterraines proches", coverage: (l) => l.cavites, flag: (l) => l.caviteProche,
    statement: () => "À cette adresse, une ou plusieurs cavités souterraines sont recensées à moins de 500 m.",
    limitation: "Recensement d'ouvrages/événements proches, pas une preuve sous ce logement.", actionType: "verifier_sur_place", action: caviteAction,
    unavailableStatement: "Les cavités souterraines n'ont pas pu être vérifiées à cette adresse." }),
  coverageRule({ id: "patrimoine", tier: "secondary", buckets: ["neutre", "achat", "reside"], topic: () => "le périmètre patrimonial protégé", coverage: (l) => l.patrimoine, flag: (l) => l.perimetrePatrimonial,
    statement: () => "À cette adresse, le bien est dans un périmètre patrimonial protégé.", actionType: "obtenir_document", action: patrimoineAction,
    unavailableStatement: "Les protections patrimoniales n'ont pas pu être vérifiées à cette adresse." }),
  coverageRule({ id: "sinistralite", tier: "secondary", grain: "commune", topic: () => "les indemnisations recensées", coverage: (l) => l.sinistralite, flag: (l) => l.sinistraliteActive,
    statement: () => "À l'échelle de la commune, des indemnisations liées à la sécheresse ou aux inondations sont recensées.",
    limitation: "Ces données ne permettent pas d'établir l'historique de ce logement.", actionType: "obtenir_document", action: siniAction,
    unavailableStatement: "La sinistralité de la commune n'a pas pu être établie." }),
];
