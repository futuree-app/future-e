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
type ActionCopy = { label: string; detail: string };

function ev(l: LogementFacts, factId: string, mode: "persisted_snapshot" | "live_fetch", grain: "adresse" | "commune" = "adresse", observedValue?: string): EvidenceRef {
  return { factId, module: "logement", label: l.addressLabel, observedValue, grain, href: "/rapport/logement", sourceMode: mode };
}
function logementVerification(id: string, evidence: EvidenceRef, tier: MaterialityTier, topic: string, statement: string, actionType: VerificationActionType, action: ActionCopy, limitation?: string): VerificationFact {
  return { id: `logement:${id}`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement", role: "verification", materialityTier: tier, topic, statement, evidence: [evidence], action: { type: actionType, label: action.label, ...(action.detail ? { detail: action.detail } : {}) }, ...(limitation ? { limitation } : {}) };
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

// LES 23 VARIANTES POSTURE-AWARE (6 tables x 4 postures, moins patrimoine/location que la règle
// exclut). Le `label` est la ligne de FACE, bornée à 70 caractères, sans point final ; le `detail`
// descend dans le dépliable, sous « À vérifier ».
//
// LE VERBE NOMME LE GESTE RÉEL. Cinq libellés sur sept commençaient par « Vérifiez » : empilés sur une
// colonne de cartes, ils se lisaient comme un formulaire, et ils contredisaient le lexique que le
// dossier applique dix lignes plus haut (un constat établi se CONTRÔLE, une condition non testée se
// VÉRIFIE). Regardez / Demandez / Consultez / Signalez / Suivez / Faites chiffrer : chaque verbe dit
// ce que la personne va effectivement faire.
//
// TROIS PRÉCAUTIONS TENUES DANS TOUTE LA TABLE :
//   - aucun detail n'affirme un droit ni un délai (« le diagnostic vaut dix ans ») : ce sont des
//     affirmations juridiques non sourcées dans le produit (invariant 3). On décrit la PRATIQUE ;
//   - aucun detail ne promet un résultat (« un diagnostic lève le doute ») : invariant 5 ;
//   - aucune posture n'est culpabilisée. La variante `reside` ne dit jamais « vous auriez dû », elle
//     documente ce qu'il reste à faire.
const batiAction: Record<Bucket, ActionCopy> = {
  achat: { label: "Demandez l'historique des fissures et des sinistres", detail: "Faites contrôler les fondations si un doute subsiste." },
  location: { label: "Signalez les fissures apparentes au bailleur", detail: "Photographiez ce qui est visible et signalez-le par écrit." },
  reside: { label: "Suivez les fissures dans le temps", detail: "Photographiez-les avec une date, et comparez d'une saison à l'autre." },
  neutre: { label: "Regardez les signes visibles sur le bâti", detail: "Fissures en escalier sur les façades, portes ou fenêtres qui coincent, sol qui se déforme." },
};
const pprnAction: Record<Bucket, ActionCopy> = {
  achat: { label: "Consultez le règlement de la zone en mairie", detail: "Il fixe ce qui est autorisé en cas de travaux ou d'extension, et ce qu'il impose au bâti existant." },
  location: { label: "Demandez au bailleur les prescriptions qui s'appliquent", detail: "L'état des risques remis à la signature indique le zonage et ce qu'il impose au logement." },
  reside: { label: "Lisez le règlement avant une extension", detail: "Une rénovation lourde peut être conditionnée par le zonage." },
  neutre: { label: "Lisez le règlement de la zone en mairie", detail: "Il dit ce que le zonage autorise, interdit ou impose à cette adresse." },
};
const caviteAction: Record<Bucket, ActionCopy> = {
  achat: { label: "Faites examiner la stabilité du sol avant de vous engager", detail: "Le recensement porte sur des ouvrages connus alentour, pas sous ce logement : seul un avis technique tranche." },
  location: { label: "Signalez tout affaissement au bailleur", detail: "Un affaissement du terrain ou une fissure nouvelle se signale par écrit." },
  reside: { label: "Surveillez les signes d'affaissement", detail: "Affaissement du terrain, fissures nouvelles, portes qui se bloquent : notez la date." },
  neutre: { label: "Renseignez-vous sur les cavités recensées", detail: "La mairie et Géorisques indiquent les cavités connues et le suivi dont elles font l'objet." },
};
// `location` est exclue par la règle elle-même (buckets) : la chaîne vide n'est jamais lue.
const patrimoineAction: Record<Bucket, ActionCopy> = {
  achat: { label: "Demandez en mairie ce que le périmètre autorise", detail: "Façade, menuiseries, toiture : les travaux visibles peuvent demander un accord, avec l'avis de l'Architecte des Bâtiments de France." },
  location: { label: "", detail: "" },
  reside: { label: "Vérifiez en mairie avant des travaux extérieurs", detail: "Le périmètre encadre ce qui se voit depuis l'espace public." },
  neutre: { label: "Renseignez-vous sur ce que le périmètre autorise", detail: "Il encadre les travaux visibles depuis l'espace public : façade, menuiseries, toiture." },
};
const siniAction: Record<Bucket, ActionCopy> = {
  achat: { label: "Demandez l'état des risques et les sinistres indemnisés", detail: "Le vendeur indique les sinistres indemnisés au titre d'une catastrophe naturelle pendant qu'il occupait le bien." },
  location: { label: "Demandez au bailleur l'état des risques", detail: "Il est remis à la signature. Signalez sans tarder tout sinistre survenu pendant le bail." },
  reside: { label: "Renseignez-vous sur les indemnisations déjà versées", detail: "Les arrêtés de catastrophe naturelle pris sur la commune disent quels épisodes ont donné lieu à indemnisation." },
  neutre: { label: "Consultez l'état des risques de la commune", detail: "Il récapitule les arrêtés de catastrophe naturelle et les zonages qui s'appliquent." },
};
const dpeAction: Record<Bucket, ActionCopy> = {
  achat: { label: "Faites chiffrer les travaux d'amélioration", detail: "Demandez des devis avant de vous engager : isolation, chauffage, ventilation." },
  location: { label: "Demandez la date du diagnostic et les factures réelles", detail: "L'étiquette date d'un diagnostic ; les factures des derniers hivers disent ce que ça coûte vraiment." },
  reside: { label: "Gardez la trace des travaux déjà engagés", detail: "Devis et factures d'isolation ou de chauffage documentent l'écart avec l'étiquette affichée." },
  neutre: { label: "Regardez le détail du diagnostic et sa date", detail: "L'étiquette résume ; le détail dit d'où viennent les pertes." },
};

// DPE : fait PERSISTÉ (pas de coverage), jamais unavailable. Formulé depuis la classe exacte.
const ruleDpe: DecisionRule = {
  id: "logement.dpe-faible", module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const l = f.logement;
    if (!l || (l.dpe !== "passoire" && l.dpe !== "energivore")) return na("dpe-faible");
    const desc = l.dpe === "passoire" ? "une passoire énergétique" : "un logement énergivore";
    const cls = l.dpeLabel ? `${l.dpeLabel}, ${desc}` : desc;
    const evidence = ev(l, "logement.dpe", "persisted_snapshot", "adresse", l.dpeLabel ? `DPE ${l.dpeLabel}` : undefined);
    return out("dpe-faible", logementVerification("dpe-faible", evidence, "structuring", "l'étiquette énergétique du logement", `À cette adresse, le diagnostic choisi classe ce logement ${cls}.`, "demander_confirmation", dpeAction[bucket(p)]));
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
