// L'ADAPTATEUR DOSSIER. Il traduit l'évaluation canonique en politique de RAPPORT : une donnée absente
// n'est JAMAIS une incompatibilité. Le comparateur, lui, exclut dans le doute. Même observation, deux
// conduites, et c'est assumé : le filtre protège le lecteur d'une mauvaise proposition, le dossier le
// protège d'une fausse affirmation.
//
// Une règle par clé, fabriquée au-dessus du MÊME évaluateur que le filtre : c'est ce qui empêche les
// deux moteurs de conclure différemment sur la même commune.
import { HARD_CONSTRAINT_KEYS } from "../hard-constraints.ts";
import type { HardConstraintKey, HardConstraintAssessment } from "../hard-constraints.ts";
import type {
  DecisionRule, RuleEvaluation, IncompatibilityFact, EvidenceRef, ModuleFacts, HardEvaluation,
} from "./decision-fact.ts";

const territoireHref = "/rapport/quartier";

// LA PROVENANCE N'EST PAS AMPUTÉE. `sourceFactIds` reçoit TOUTES les clés (c'est sa fonction : dire d'où
// vient le constat) ; `evidence` habille celles qui sont des OBSERVATIONS (les `commune.*`). Les clés
// `project.*` ne sont pas des observations : ce sont les déclarations du lecteur, elles n'ont pas de
// carte. Ne garder que `evidenceKeys[0]` laissait des sourceFactIds sans preuve correspondante.
const OBSERVATION_LABELS: Record<string, string> = {
  "commune.dept": "Département",
  "commune.altitude": "Altitude",
  "commune.reliefProximite": "Relief à portée",
  "commune.distanceCoteKm": "Distance au littoral",
  "commune.tailleVille": "Taille de l'agglomération",
  "commune.population": "Population",
  "commune.uu": "Unité urbaine",
  "commune.insee": "Commune",
  "commune.lat": "Position",
  "commune.lon": "Position",
};

function toEvidence(
  a: Extract<HardConstraintAssessment, { status: "incompatible" }>,
  f: ModuleFacts,
  hard: HardEvaluation,
): EvidenceRef[] {
  // LE GRAIN SUIT LE POINT RÉELLEMENT TESTÉ. Marquer « commune » une distance mesurée depuis une adresse
  // mentirait sur la finesse de la lecture.
  const grain = hard.context.point?.grain === "address" ? "adresse" : "commune";
  const seen = new Set<string>();
  const refs: EvidenceRef[] = [];
  for (const k of a.evidenceKeys) {
    if (!k.startsWith("commune.")) continue;
    const label = OBSERVATION_LABELS[k] ?? "Territoire";
    if (seen.has(label)) continue; // commune.lat + commune.lon = UNE position, pas deux preuves
    seen.add(label);
    refs.push({
      factId: k,
      module: "territoire",
      label: `${label} · ${f.nom}`,
      observedValue: a.observedLabel,
      grain,
      href: territoireHref,
    });
  }
  // assertFactValid exige au moins une preuve. Une contrainte dure sans observation communale n'existe
  // pas ; si le cas apparaissait, mieux vaut une preuve générique qu'un crash en production.
  if (refs.length === 0) {
    refs.push({
      factId: "commune", module: "territoire", label: `Territoire · ${f.nom}`,
      observedValue: a.observedLabel, grain, href: territoireHref,
    });
  }
  return refs;
}

function makeRule(key: HardConstraintKey): DecisionRule {
  const id = `territoire.hard.${key}`;
  return {
    id,
    module: "territoire",
    hardConstraint: key,
    evaluate: (f, _p, hard): RuleEvaluation => {
      // Les 11 évaluations ont été calculées UNE fois, par runRules. Les rappeler ici en ferait 121.
      const a = hard.byKey[key];

      if (a.status === "not_declared") {
        return { ruleId: id, projectKeys: [key], outcome: "not_applicable", facts: [], reason: "non déclarée" };
      }
      if (a.status === "unexamined") {
        // NON EXAMINÉE. Le critère ne fait pas monter la couverture, et le couperet interdit une
        // couverture « élevée ». C'est exactement ce qu'on veut : une condition absolue qu'on n'a pas su
        // tester diminue la valeur du verdict, elle ne se laisse pas oublier.
        return { ruleId: id, projectKeys: [key], outcome: "uncertain", facts: [], reason: a.reason };
      }
      if (a.status === "satisfied") {
        // Examinée, rien à redire : SILENCIEUSE (aucune carte), mais c'est un point favorable et la
        // couverture monte. Rendre not_applicable ici serait le bug corrigé par la slice 2.1.
        return { ruleId: id, projectKeys: [key], outcome: "satisfied", facts: [], reason: "respectée" };
      }

      const fact: IncompatibilityFact = {
        id: `${f.insee}:hard:${key}`,
        ruleId: id,
        sourceFactIds: a.evidenceKeys,
        module: "territoire",
        role: "incompatibility",
        evidenceStrength: "established",
        hardConstraintKey: key,
        materialityTier: "decision_critical",
        topic: a.topic,
        statement: a.statement,
        evidence: toEvidence(a, f, hard),
      };
      return { ruleId: id, projectKeys: [key], outcome: "incompatible", facts: [fact], reason: "contrainte non respectée" };
    },
  };
}

export const HARD_CONSTRAINT_RULES: DecisionRule[] = HARD_CONSTRAINT_KEYS.map(makeRule);
