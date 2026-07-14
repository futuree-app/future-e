// Registre de matérialité (v2). Chaque règle expose evaluate() : elle décrit toujours son verdict
// (satisfied / incompatible / not_applicable / unknown…), même sans produire de fait. C'est ce qui
// rend la COUVERTURE observable. Le moteur valide chaque fait (assertFactValid JETTE en cas de
// violation de doctrine). Généralise src/lib/logement-checklist.ts.
//
// LES CONTRAINTES DURES N'ONT PLUS DE RÈGLES ÉCRITES À LA MAIN ICI. Elles sont fabriquées au-dessus de
// l'ÉVALUATEUR PARTAGÉ (src/lib/hard-constraints.ts), celui-là même dont le comparateur dérive son
// filtre. Trois règles vivaient ici (mer, taille, département), et l'une d'elles jugeait la taille sur
// la population COMMUNALE quand le comparateur la jugeait sur l'AGGLOMÉRATION : deux moteurs, deux
// verdicts, un seul lecteur. cf. hard-constraint-rules.ts.
import type {
  DecisionRule, DecisionFact, ModuleFacts, RunResult, RuleEvaluation, HardEvaluation,
  UnknownFact, CompromiseFact, VerificationFact, EvidenceRef,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, preferenceWeight } from "./project-view.ts";
import { LOGEMENT_RULES } from "./logement-rules.ts";
import { HARD_CONSTRAINT_RULES } from "./hard-constraint-rules.ts";
import { toCommuneAttributes } from "./module-facts-map.ts";
import {
  assessHardConstraints,
  type EvaluationContext, type HardConstraintAssessment, type HardConstraintKey,
} from "../hard-constraints.ts";

const territoireHref = "/rapport/quartier";

function scoreEvidence(nom: string, key: string, score: number): EvidenceRef {
  return { factId: `scores.${key}`, module: "territoire", label: `Territoire · ${nom}`, observedValue: `${Math.round(score)}/100`, grain: "commune", href: territoireHref };
}

// Règle 4 : compromis transport × chaleur. Deux priorités déclarées qui tirent en sens opposés sur
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
      role: "compromise", materialityTier: "structuring", topic: "la tension entre transports et chaleur",
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
      role: "unknown", impact: "scoped", materialityTier: "secondary", topic: "le confort d'été du bâtiment",
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
    // Examiné, rien à redire : un point FAVORABLE, silencieux (aucune carte). `not_applicable` disait
    // ici « hors sujet » d'une bonne nouvelle : le registre des critères l'aurait comptée comme un trou
    // de couverture, et n'aurait jamais vu un seul point positif. Cf. spec 2.1 §3.1.
    if (f.inondationRisque < 66) return { ruleId: RULE_INOND, projectKeys: ["faible_risque_inondation"], outcome: "satisfied", facts: [], reason: "exposition non notable" };
    const habitant = p.posture === "habitant";
    const catnatCtx = f.catnatInondation != null ? ` La commune a connu ${f.catnatInondation} arrêtés de catastrophe naturelle inondation depuis 1982 (comptage administratif, pas une probabilité).` : "";
    const ev: EvidenceRef = { factId: "inondation.risque", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: `${Math.round(f.inondationRisque)}/100`, grain: "commune", href: territoireHref };
    const fact: VerificationFact = {
      id: `${f.insee}:inondation-exposition`, ruleId: RULE_INOND, sourceFactIds: ["inondation.risque", "inondation.catnat"], module: "territoire",
      role: "verification", materialityTier: "structuring", topic: `l'exposition de ${f.nom} à l'inondation`,
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

export const REGISTRY: DecisionRule[] = [
  // Les 11 contraintes dures, une règle par clé, toutes au-dessus de l'évaluateur PARTAGÉ avec le
  // comparateur. Le dossier n'en examinait que 3 (mer, taille, département).
  ...HARD_CONSTRAINT_RULES,
  ruleCompromis,
  ruleConfort,
  ruleInondation,
  ...LOGEMENT_RULES,
];

// Invariants : protègent toutes les futures règles. JETTE (fail-fast) en cas de violation.
export function assertFactValid(fact: DecisionFact, project: UserProject): void {
  // Arbitrage slice 1.5 : une règle Logement ne peut pas émettre incompatibility.
  if (fact.ruleId.startsWith("logement.") && fact.role === "incompatibility") {
    throw new Error(`[decision] ${fact.ruleId}: une règle Logement ne peut pas émettre incompatibility (arbitrage slice 1.5)`);
  }

  // Slice 2.1 : tout fait porte son SUJET, court, distinct de son constat. Sans lui, la conclusion ne
  // peut nommer un fait qu'en recopiant sa carte. Un topic vide, ou aussi long qu'une phrase, trahirait
  // sa raison d'être : on le refuse ici plutôt que de le découvrir à l'écran.
  if (!fact.topic || fact.topic.trim().length === 0) {
    throw new Error(`[decision] ${fact.ruleId}: fait sans topic (le SUJET, 3-6 mots, distinct du constat)`);
  }
  if (fact.topic.length > 70 || /[.!?]/.test(fact.topic)) {
    throw new Error(`[decision] ${fact.ruleId}: topic trop long ou phrasé (« ${fact.topic} ») — on NOMME, on ne raconte pas`);
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

export function runRules(facts: ModuleFacts, project: UserProject, context: EvaluationContext): RunResult {
  // LES 11 ÉVALUATIONS DE CONTRAINTES DURES, UNE SEULE FOIS. Si chaque règle allait chercher la sienne
  // en rappelant assessHardConstraints, onze règles en feraient 121 par dossier.
  const list = assessHardConstraints(context, toCommuneAttributes(facts));
  const byKey = Object.fromEntries(list.map((a) => [a.key, a])) as Record<HardConstraintKey, HardConstraintAssessment>;
  const hard: HardEvaluation = { context, byKey };

  const outFacts: DecisionFact[] = [];
  const evaluations: RuleEvaluation[] = [];
  for (const rule of REGISTRY) {
    const ev = rule.evaluate(facts, project, hard);
    evaluations.push(ev);
    for (const fact of ev.facts) {
      assertFactValid(fact, project);
      outFacts.push(fact);
    }
  }
  // `coveredHardConstraints` a disparu : il déclarait « couverte » toute contrainte dont l'outcome
  // n'était pas not_applicable, donc un `uncertain` aussi. La couverture se lit dans criteria-registry,
  // qui la DÉDUIT des évaluations exploitables.
  return { facts: outFacts, evaluations };
}
