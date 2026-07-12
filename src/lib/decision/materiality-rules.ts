// Registre de matérialité (v2). Chaque règle expose evaluate() : elle décrit toujours son verdict
// (satisfied / incompatible / not_applicable / unknown…), même sans produire de fait. C'est ce qui
// rend la COUVERTURE observable. Le moteur valide chaque fait (assertFactValid JETTE en cas de
// violation de doctrine). Généralise src/lib/logement-checklist.ts.
import type {
  DecisionRule, DecisionFact, ModuleFacts, RunResult, RuleEvaluation,
  IncompatibilityFact, UnknownFact, CompromiseFact, VerificationFact, EvidenceRef, HardConstraintKey,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { nearSeaLimitKm, communeSizeBounds, declaredHardConstraintKeys, declaredPreferenceKeys, preferenceWeight } from "./project-view.ts";
import { LOGEMENT_RULES } from "./logement-rules.ts";

// Formatage déterministe des milliers (espace ASCII, jamais toLocaleString qui varie).
function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
const territoireHref = "/rapport/quartier";

// Règle 1 : mer hors seuil.
const RULE_MER = "territoire.mer-hors-seuil";
const ruleMer: DecisionRule = {
  id: RULE_MER,
  module: "territoire",
  hardConstraint: "nearSea",
  evaluate: (f, p): RuleEvaluation => {
    const max = nearSeaLimitKm(p);
    if (max == null) return { ruleId: RULE_MER, projectKeys: ["nearSea"], outcome: "not_applicable", facts: [], reason: "nearSea non déclaré" };
    if (f.distanceCoteKm > max) {
      const ev: EvidenceRef = { factId: "distance_cote_km", module: "territoire", label: `Littoral · ${f.nom}`, observedValue: `${Math.round(f.distanceCoteKm)} km`, grain: "commune", href: territoireHref };
      const fact: IncompatibilityFact = {
        id: `${f.insee}:mer`, ruleId: RULE_MER, sourceFactIds: ["distance_cote_km"], module: "territoire",
        role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "nearSea",
        materialityTier: "decision_critical",
        statement: `Cette commune est à ${Math.round(f.distanceCoteKm)} km du littoral, au-delà de la limite de ${max} km que vous avez posée.`,
        evidence: [ev],
      };
      return { ruleId: RULE_MER, projectKeys: ["nearSea"], outcome: "incompatible", facts: [fact], reason: "distance > seuil" };
    }
    return { ruleId: RULE_MER, projectKeys: ["nearSea"], outcome: "satisfied", facts: [], reason: "distance <= seuil" };
  },
};

// Règle 2 : taille de commune hors seuil.
const RULE_TAILLE = "territoire.taille-hors-seuil";
const ruleTaille: DecisionRule = {
  id: RULE_TAILLE,
  module: "territoire",
  hardConstraint: "communeSize",
  evaluate: (f, p): RuleEvaluation => {
    const bounds = communeSizeBounds(p);
    if (!bounds) return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "not_applicable", facts: [], reason: "communeSize non déclaré" };
    if (f.population == null) {
      const ev: EvidenceRef = { factId: "population", module: "territoire", label: `Territoire · ${f.nom}`, grain: "commune", href: territoireHref };
      const fact: UnknownFact = {
        id: `${f.insee}:taille`, ruleId: RULE_TAILLE, sourceFactIds: ["population"], module: "territoire",
        role: "unknown", impact: "scoped", materialityTier: "secondary",
        statement: "La population de cette commune n'est pas disponible dans nos données ; la taille ne peut pas être vérifiée.",
        evidence: [ev],
      };
      return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "unknown", facts: [fact], reason: "population absente" };
    }
    const over = bounds.max != null && f.population > bounds.max;
    const under = bounds.min != null && f.population < bounds.min;
    if (over || under) {
      const seuil = over ? `au-dessus de ${fmt(bounds.max!)}` : `en dessous de ${fmt(bounds.min!)}`;
      const ev: EvidenceRef = { factId: "population", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: `${fmt(f.population)} hab.`, grain: "commune", href: territoireHref };
      const fact: IncompatibilityFact = {
        id: `${f.insee}:taille`, ruleId: RULE_TAILLE, sourceFactIds: ["population"], module: "territoire",
        role: "incompatibility", evidenceStrength: "established", hardConstraintKey: "communeSize",
        materialityTier: "decision_critical",
        statement: `Cette commune compte ${fmt(f.population)} habitants, ${seuil} de la taille que vous avez posée.`,
        evidence: [ev],
      };
      return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "incompatible", facts: [fact], reason: "population hors bornes" };
    }
    return { ruleId: RULE_TAILLE, projectKeys: ["communeSize"], outcome: "satisfied", facts: [], reason: "population dans les bornes" };
  },
};

function scoreEvidence(nom: string, key: string, score: number): EvidenceRef {
  return { factId: `scores.${key}`, module: "territoire", label: `Territoire · ${nom}`, observedValue: `${Math.round(score)}/100`, grain: "commune", href: territoireHref };
}

// Règle 3 : compromis transport × chaleur. Deux priorités déclarées qui tirent en sens opposés sur
// cette commune. Texte honnête (pas de « meilleure », pas de « train »), preuve de chaque côté.
const RULE_COMPROMIS = "territoire.compromis-transport-chaleur";
const ruleCompromis: DecisionRule = {
  id: RULE_COMPROMIS,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const t = f.scores.acces_transports;
    const c = f.scores.faible_chaleur;
    if (preferenceWeight(p, "acces_transports") < 2 || preferenceWeight(p, "faible_chaleur") < 2 || t == null || c == null || !(t >= 60 && c <= 40)) {
      return { ruleId: RULE_COMPROMIS, projectKeys: ["acces_transports", "faible_chaleur"], outcome: "not_applicable", facts: [], reason: "pas de tension déclarée" };
    }
    const fact: CompromiseFact = {
      id: `${f.insee}:compromis-transport-chaleur`, ruleId: RULE_COMPROMIS,
      sourceFactIds: ["scores.acces_transports", "scores.faible_chaleur"], module: "territoire",
      role: "compromise", materialityTier: "structuring",
      statement: "Deux de vos priorités tirent en sens opposés sur cette commune.",
      sides: [
        { projectKey: "acces_transports", statement: "L'accès aux transports ressort favorablement à l'échelle de la commune.", evidence: [scoreEvidence(f.nom, "acces_transports", t)] },
        { projectKey: "faible_chaleur", statement: "Votre priorité de faible exposition à la chaleur est moins bien satisfaite ici.", evidence: [scoreEvidence(f.nom, "faible_chaleur", c)] },
      ],
    };
    return { ruleId: RULE_COMPROMIS, projectKeys: ["acces_transports", "faible_chaleur"], outcome: "compromise", facts: [fact], reason: "tension transport/chaleur" };
  },
};

// Règle 4 : confort d'été non évaluable au grain bâtiment sans adresse. Inconnue SCOPÉE (ne bloque
// jamais la conclusion). Gate sur le GRAIN (priorité chaleur déclarée + pas d'adresse), pas sur l'achat.
const RULE_CONFORT = "territoire.confort-ete-sans-adresse";
const ruleConfort: DecisionRule = {
  id: RULE_CONFORT,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    if (preferenceWeight(p, "faible_chaleur") < 2 || f.hasAddress) {
      return { ruleId: RULE_CONFORT, projectKeys: ["faible_chaleur"], outcome: "not_applicable", facts: [], reason: "non applicable" };
    }
    const ev: EvidenceRef = { factId: "commune", module: "territoire", label: `Territoire · ${f.nom}`, grain: "commune", href: territoireHref };
    const fact: UnknownFact = {
      id: `${f.insee}:confort-sans-adresse`, ruleId: RULE_CONFORT, sourceFactIds: ["hasAddress"], module: "territoire",
      role: "unknown", impact: "scoped", materialityTier: "secondary",
      statement: "Votre priorité de confort d'été ne peut pas être évaluée au grain du bâtiment tant qu'aucune adresse n'est renseignée.",
      evidence: [ev], action: { type: "renseigner_adresse", label: "Affiner avec une adresse" },
    };
    return { ruleId: RULE_CONFORT, projectKeys: ["faible_chaleur"], outcome: "unknown", facts: [fact], reason: "confort d'été gated sur l'adresse" };
  },
};

// Règle 5 : exposition inondation notable + priorité risque déclarée -> vérification. Croise le score
// d'exposition actuel (pas un comptage brut), nomme la période et la limite. Posture-aware.
const RULE_INOND = "territoire.inondation-exposition";
const ruleInondation: DecisionRule = {
  id: RULE_INOND,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    if (preferenceWeight(p, "faible_risque_inondation") < 2) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "not_applicable", facts: [], reason: "priorité non déclarée" };
    if (f.inondationRisque == null) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "uncertain", facts: [], reason: "exposition inconnue" };
    if (f.inondationRisque < 66) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "not_applicable", facts: [], reason: "exposition non notable" };
    const habitant = p.posture === "habitant";
    const catnatCtx = f.catnatInondation != null ? ` La commune a connu ${f.catnatInondation} arrêtés de catastrophe naturelle inondation depuis 1982 (comptage administratif, pas une probabilité).` : "";
    const ev: EvidenceRef = { factId: "inondation.risque", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: `${Math.round(f.inondationRisque)}/100`, grain: "commune", href: territoireHref };
    const fact: VerificationFact = {
      id: `${f.insee}:inondation-exposition`, ruleId: RULE_INOND, sourceFactIds: ["inondation.risque", "inondation.catnat"], module: "territoire",
      role: "verification", materialityTier: "structuring",
      statement: (habitant
        ? "L'exposition de la commune à l'inondation ressort élevée, à comprendre et surveiller au fil des épisodes."
        : "L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques avant de vous engager.") + catnatCtx,
      limitation: "Cette exposition est lue à l'échelle de la commune, pas de l'adresse.",
      evidence: [ev],
      action: habitant
        ? { type: "demander_confirmation", label: "Consultez l'état des risques applicable à votre adresse" }
        : { type: "obtenir_document", label: "Consultez l'état des risques (Géorisques)" },
    };
    return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "verification", facts: [fact], reason: "exposition inondation notable" };
  },
};

export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille, ruleCompromis, ruleConfort, ruleInondation, ...LOGEMENT_RULES];

// Invariants : protègent toutes les futures règles. JETTE (fail-fast) en cas de violation.
export function assertFactValid(fact: DecisionFact, project: UserProject): void {
  // Arbitrage slice 1.5 : une règle Logement ne peut pas émettre incompatibility.
  if (fact.ruleId.startsWith("logement.") && fact.role === "incompatibility") {
    throw new Error(`[decision] ${fact.ruleId}: une règle Logement ne peut pas émettre incompatibility (arbitrage slice 1.5)`);
  }
  switch (fact.role) {
    case "incompatibility":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (!declaredHardConstraintKeys(project).includes(fact.hardConstraintKey)) {
        throw new Error(`[decision] ${fact.ruleId}: incompatibilité sur une contrainte non déclarée (${fact.hardConstraintKey})`);
      }
      break;
    case "compromise":
      if (fact.sides.length !== 2) throw new Error(`[decision] ${fact.ruleId}: un compromis a exactement deux côtés`);
      for (const s of fact.sides) {
        if (!declaredPreferenceKeys(project).includes(s.projectKey)) throw new Error(`[decision] ${fact.ruleId}: côté sur une préférence non déclarée (${s.projectKey})`);
        if (s.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: côté sans preuve`);
      }
      break;
    case "unknown":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (fact.impact !== "blocking" && fact.impact !== "scoped") throw new Error(`[decision] ${fact.ruleId}: inconnue sans impact`);
      break;
    case "verification":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (!fact.action) throw new Error(`[decision] ${fact.ruleId}: vérification sans action`);
      break;
  }
}

export function runRules(facts: ModuleFacts, project: UserProject): RunResult {
  const outFacts: DecisionFact[] = [];
  const evaluations: RuleEvaluation[] = [];
  const covered = new Set<HardConstraintKey>();
  for (const rule of REGISTRY) {
    const ev = rule.evaluate(facts, project);
    evaluations.push(ev);
    for (const fact of ev.facts) {
      assertFactValid(fact, project);
      outFacts.push(fact);
    }
    if (rule.hardConstraint && ev.outcome !== "not_applicable") covered.add(rule.hardConstraint);
  }
  return { facts: outFacts, evaluations, coveredHardConstraints: [...covered] };
}
