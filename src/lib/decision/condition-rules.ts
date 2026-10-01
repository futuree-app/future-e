// LES PRÉFÉRENCES DONT LE LECTEUR A FAIT UNE CONDITION SANS COMPROMIS (FUT-7, 01/10/2026). Lib PURE.
//
// Une préférence (`{ key, weight }`) ne porte aucun seuil du lecteur : futur•e la situe parmi les
// communes, elle ne dit pas oui ou non à sa place. Confirmée, elle ne peut donc jamais produire
// « Condition non respectée », ni « Condition remplie ». Elle devient une condition À CONFIRMER.
//
// Ce module ne réévalue rien. Les règles du registre ont déjà examiné le critère (un écart, une
// correspondance, un constat à contrôler) ; on RÉUNIT ce qu'elles ont établi en une seule carte, placée
// en tête, qui dit vers quoi penche ce que l'on sait, pourquoi cela ne suffit pas à trancher, et ce
// qu'il reste à vérifier. Les faits réunis quittent leur section : on ne lit pas deux fois la même
// chose, une fois comme écart et une fois comme condition.
//
// Rien n'est fabriqué : sans aucun examen exploitable (donnée absente ici), il n'y a pas de carte, et
// le registre porte la condition comme ouverte, faute de donnée.
import type {
  DecisionFact, ModuleFacts, RuleEvaluation, ConditionCheckFact, ConditionSignal, EvidenceRef, DecisionAction,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { confirmedCriteria } from "./conditions.ts";
import { preferenceWeight } from "./project-view.ts";
import { criterionCapability } from "./capability.ts";
import { consequenceDuSignal, etatDuSignal } from "./hard-constraint-rules.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";

const territoireHref = "/rapport/quartier";

// POURQUOI futur•e NE TRANCHE PAS une préférence : aucune ne porte de seuil du lecteur, et la donnée
// est lue à l'échelle du lieu. Une seule phrase pour toutes, parce que c'est une seule raison.
const POURQUOI_PREFERENCE =
  "Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous. Elle éclaire votre condition sans pouvoir la trancher.";

const DEFAVORABLES = new Set<RuleEvaluation["outcome"]>(["mismatch", "verification"]);

function faitsDuCritere(key: PreferenceKey, evaluations: RuleEvaluation[], facts: DecisionFact[]): DecisionFact[] {
  // Les règles qui examinent CE critère, et lui seul : un compromis tient deux priorités, il garde sa
  // propre carte.
  const regles = new Set(
    evaluations.filter((e) => e.projectKeys.length === 1 && e.projectKeys[0] === key).map((e) => e.ruleId),
  );
  return facts.filter((f) =>
    ((f.role === "mismatch" || f.role === "alignment") && f.projectKey === key)
    || (f.role === "verification" && regles.has(f.ruleId)));
}

function signalDe(key: PreferenceKey, evaluations: RuleEvaluation[], reunis: DecisionFact[]): ConditionSignal | null {
  const miennes = evaluations.filter((e) => e.projectKeys.length === 1 && e.projectKeys[0] === key);
  if (miennes.some((e) => DEFAVORABLES.has(e.outcome))) return "defavorable";
  if (miennes.some((e) => e.outcome === "satisfied") || reunis.some((f) => f.role === "alignment")) return "favorable";
  if (miennes.some((e) => e.outcome === "neutral" || e.outcome === "not_surfaced")) return "neutre";
  return null; // rien d'exploitable ici : la condition reste ouverte, faute de donnée
}

function preuvesDe(reunis: DecisionFact[], f: ModuleFacts, key: PreferenceKey, label: string): EvidenceRef[] {
  const seen = new Set<string>();
  const out: EvidenceRef[] = [];
  for (const fait of reunis) {
    if (fait.role === "compromise") continue;
    for (const e of fait.evidence) {
      const cle = `${e.factId}|${e.observedValue ?? ""}`;
      if (seen.has(cle)) continue;
      seen.add(cle);
      out.push(e);
    }
  }
  // Une lecture favorable ou neutre peut être SILENCIEUSE (aucun fait) : la source se nomme quand même,
  // sans valeur affichée, l'indice interne ne se montrant jamais.
  if (out.length === 0) {
    out.push({ factId: `scores.${key}`, module: "territoire", label: `${label} · ${f.nom}`, grain: "commune", href: territoireHref });
  }
  return out;
}

function constatDe(reunis: DecisionFact[], signal: ConditionSignal, label: string): string {
  // UN SIGNAL FAVORABLE NE SE DIT PAS AVEC LES MOTS D'UNE CORRESPONDANCE. La phrase d'un alignment
  // conclut (« … dans ce que vous recherchez ») : sous une étiquette « À confirmer », elle affirmerait ce
  // que la carte refuse d'établir. On garde la MESURE, et on dit seulement vers quoi elle penche.
  if (signal === "favorable") {
    const mesure = reunis.find((r) => r.role === "alignment")?.evidence.find((e) => e.observedValue)?.observedValue;
    if (mesure) return `À l'échelle de la commune, la lecture va dans le sens de ${label} : ${mesure}.`;
  }
  const premier = signal === "favorable" ? undefined : reunis.find((r) => r.role !== "alignment");
  if (premier && premier.role !== "compromise") return premier.statement;
  return signal === "favorable"
    ? `À l'échelle de la commune, rien de défavorable n'apparaît pour ${label}.`
    : `À l'échelle de la commune, ${label} ne se distingue ni parmi les communes les plus favorables, ni parmi les moins favorables.`;
}

// UNE LECTURE NEUTRE QUI A UNE MESURE LA DIT. La proximité de la mer, entre 15 et 100 km, n'est ni un écart
// ni une correspondance : sa règle se tait, mais la distance existe, et c'est elle que le lecteur veut lire.
function mesureNeutre(key: PreferenceKey, f: ModuleFacts): { statement: string; evidence: EvidenceRef } | null {
  if (key === "proximite_mer" && f.distanceCoteKm != null) {
    const km = Math.round(f.distanceCoteKm);
    return {
      statement: `La distance au littoral est estimée à environ ${km} km depuis le point de référence de ${f.nom}.`,
      evidence: {
        factId: "coastDistance.proximite_mer", module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `distance au littoral estimée à environ ${km} km`, grain: "commune", relation: "proximite", href: territoireHref,
      },
    };
  }
  return null;
}

function actionDe(reunis: DecisionFact[]): DecisionAction | undefined {
  for (const r of reunis) if (r.role === "verification") return r.action;
  return undefined;
}

/**
 * Applique les conditions de préférence au résultat du registre : ajoute une évaluation et une carte
 * « À confirmer » par préférence confirmée examinée, et retire les faits que cette carte réunit.
 */
export function conditionsDePreference(
  f: ModuleFacts, project: UserProject, evaluations: RuleEvaluation[], facts: DecisionFact[],
): { evaluations: RuleEvaluation[]; facts: DecisionFact[] } {
  const ajoutees: RuleEvaluation[] = [];
  const reunisIds = new Set<string>();
  const cartes: ConditionCheckFact[] = [];

  for (const ref of confirmedCriteria(project)) {
    if (ref.kind !== "preference") continue;
    const capacite = criterionCapability(ref, "commune");
    // Non mesurable : aucune carte, le registre porte la condition comme « non évaluable ».
    if (capacite.capability === "ne_pas_mesurer") continue;
    const key = ref.key;
    const label = PREFERENCE_LABELS[key] ?? String(key);
    const reunis = faitsDuCritere(key, evaluations, facts);
    const signal = signalDe(key, evaluations, reunis);
    if (signal == null) continue;
    const action = actionDe(reunis);
    const neutre = signal === "neutre" ? mesureNeutre(key, f) : null;
    const carte: ConditionCheckFact = {
      id: `${f.insee}:condition:${key}`,
      ruleId: `condition.${key}`,
      sourceFactIds: reunis.length > 0 ? reunis.flatMap((r) => r.sourceFactIds) : [`scores.${key}`],
      module: "territoire",
      role: "condition_check",
      criterion: ref,
      headlineSubject: label,
      signal,
      status: etatDuSignal(signal),
      // LA CONFIRMATION NE CHANGE PAS L'IMPORTANCE. Le poids règle la matérialité, comme pour toute
      // préférence ; c'est le rôle (`condition_check`) et l'orientation (`condition_to_confirm`) qui portent
      // le statut de condition. Une préférence de poids 1 confirmée reste, sur cet axe, de poids 1.
      materialityTier: preferenceWeight(project, key) >= 3 ? "structuring" : "secondary",
      topic: reunis[0]?.topic ?? label,
      statement: neutre?.statement ?? constatDe(reunis, signal, label),
      evidence: neutre ? [neutre.evidence] : preuvesDe(reunis, f, key, label),
      whyNotDecided: POURQUOI_PREFERENCE,
      capabilityReason: capacite.reason,
      consequence: consequenceDuSignal(signal),
      ...(action ? { action } : {}),
    };
    cartes.push(carte);
    for (const r of reunis) reunisIds.add(r.id);
    ajoutees.push({
      ruleId: carte.ruleId, projectKeys: [key], outcome: "condition_check", facts: [carte],
      reason: "condition confirmée, appréciable seulement",
    });
  }

  return {
    evaluations: [...evaluations, ...ajoutees],
    facts: [...facts.filter((x) => !reunisIds.has(x.id)), ...cartes],
  };
}
