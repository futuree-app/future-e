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
//
// FUT-110 (16/10/2026) : « IL Y A QUELQUE CHOSE À VÉRIFIER » N'EST PAS « CELA PENCHE CONTRE ». Le rôle
// `verification` porte deux choses que ce module confondait : une EXPOSITION établie (une inondation
// notable, un seuil sanitaire dépassé), qui oriente bien le critère, et un CONSTAT À CONFIRMER (un médecin
// à 550 m, une gare, un secteur moins motorisé), qui n'oriente pas. Lu comme défavorable, ce second
// constat retournait la carte d'une commune parmi les 20 % les plus favorables en « plutôt défavorable ».
// Désormais, seules les règles d'exposition orientent le signal ; les constats à confirmer restent dans la
// carte, nommés à leur échelle, avec leur geste et leur limite, sans peser dans un sens ni dans l'autre.
import type {
  DecisionFact, ModuleFacts, RuleEvaluation, ConditionCheckFact, ConditionSignal, EvidenceRef, DecisionAction,
  VerificationFact,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { confirmedCriteria } from "./conditions.ts";
import { preferenceWeight } from "./project-view.ts";
import { criterionCapability } from "./capability.ts";
import { consequenceDuSignal, etatDuSignal } from "./hard-constraint-rules.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";
import { deCommune } from "../typography.ts";
import { kmLisible, aEnviron } from "../hard-constraints.ts";

const territoireHref = "/rapport/quartier";

// POURQUOI futur•e NE TRANCHE PAS une préférence : aucune ne porte de seuil du lecteur, et la donnée
// est lue à l'échelle du lieu. Une seule phrase pour toutes, parce que c'est une seule raison.
const POURQUOI_PREFERENCE =
  "Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous. Elle éclaire votre condition sans pouvoir la trancher.";

const POURQUOI_MER =
  "Cette distance est mesurée à vol d'oiseau depuis le point de référence de la commune jusqu'au rivage marin. Elle ne correspond pas nécessairement à la mesure que vous visez pour cette condition.";

// LES VÉRIFICATIONS QUI ORIENTENT LE CRITÈRE (FUT-110). Une `verification` de ces règles constate une
// EXPOSITION que la règle a jugée notable (seuil franchi, source opposable) : elle penche bien contre la
// priorité du lecteur. Toute autre `verification` est un constat À CONFIRMER, et n'oriente pas :
//   - `autour.acces-soins`, `autour.gare` : une présence (ou une absence dans un périmètre borné) ne dit
//     ni qu'un médecin prendra le lecteur, ni que les trains servent ses trajets ;
//   - `secteur.equipement-auto` : une nuance de secteur, qui se déclare elle-même sans verdict ;
//   - `territoire.climat-feu` (branche boisement) : la règle écrit qu'un couvert forestier « n'établit
//     AUCUN risque » ; elle n'existe que pour interdire de conclure à une bonne nouvelle.
// Le défaut est donc « n'oriente pas » : une règle nouvelle qui oublierait de se déclarer ici rendrait une
// condition « ouverte », jamais un sens que ses faits ne portent pas. Littéraux plutôt qu'imports : les
// règles importent ce module (cycle), et le test FUT-110 vérifie que ces identifiants existent.
export const VERIFICATIONS_ORIENTEES: ReadonlySet<string> = new Set([
  "territoire.inondation-exposition",
  "territoire.climat-pluies",
  "territoire.sante-air",
  "territoire.sante-bruit",
  "territoire.sante-industrie",
]);

const evaluationOriente = (e: RuleEvaluation): boolean =>
  e.outcome !== "verification" || VERIFICATIONS_ORIENTEES.has(e.ruleId);
const faitOriente = (f: DecisionFact): boolean =>
  f.role !== "verification" || VERIFICATIONS_ORIENTEES.has(f.ruleId);

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

// CE QUE L'ON SAIT DU CRITÈRE, EN DEUX PARTS. Les faits qui l'ORIENTENT (rang, exposition établie) fondent
// le signal ; les constats À CONFIRMER l'accompagnent sans peser. `lue` : une règle orientante a conclu
// quelque chose d'exploitable ici (sans elle, la carte ne parle que des constats à confirmer).
type Lecture = {
  signal: ConditionSignal;
  lue: boolean;
  orientants: DecisionFact[];
  aConfirmer: VerificationFact[];
};

function lectureDe(key: PreferenceKey, evaluations: RuleEvaluation[], reunis: DecisionFact[]): Lecture | null {
  const miennes = evaluations.filter((e) => e.projectKeys.length === 1 && e.projectKeys[0] === key && evaluationOriente(e));
  const orientants = reunis.filter(faitOriente);
  const aConfirmer = reunis.filter((f): f is VerificationFact => f.role === "verification" && !faitOriente(f));
  const lue = miennes.some((e) => ["mismatch", "verification", "satisfied", "neutral", "not_surfaced"].includes(e.outcome));
  const signal: ConditionSignal | null =
    miennes.some((e) => e.outcome === "mismatch" || e.outcome === "verification") ? "defavorable"
      : miennes.some((e) => e.outcome === "satisfied") || orientants.some((f) => f.role === "alignment") ? "favorable"
        // Un constat à confirmer, seul, ne penche pas : la carte existe pour le porter, sans sens.
        : lue || aConfirmer.length > 0 ? "neutre"
          : null; // rien d'exploitable ici : la condition reste ouverte, faute de donnée
  return signal == null ? null : { signal, lue, orientants, aConfirmer };
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

// LE FAIT, EN UNE PHRASE. La carte « Condition ouverte » porte déjà le sens dans son étiquette ; la phrase
// dit seulement ce que l'on observe. On reprend donc le constat des règles, débarrassé de ce qui
// n'appartient pas à une condition : le préambule d'un écart (« Vous avez placé … parmi vos
// priorités. ») et la conclusion d'une correspondance (« … dans ce que vous recherchez »).
function sansPreambule(statement: string): string {
  return statement.replace(/^Vous avez placé [^.]*\. /, "");
}
function sansConclusion(statement: string): string {
  return statement.replace(/,\s*(dans )?ce que vous recherchez/, "");
}

function constatOriente(reunis: DecisionFact[], signal: ConditionSignal, label: string): string {
  if (signal === "favorable") {
    const align = reunis.find((r) => r.role === "alignment");
    if (align) return sansConclusion(align.statement);
  }
  const premier = signal === "favorable" ? undefined : reunis.find((r) => r.role !== "alignment");
  if (premier && premier.role !== "compromise") return sansPreambule(premier.statement);
  return signal === "favorable"
    ? `À l'échelle de la commune, rien de défavorable n'apparaît pour ${label}.`
    : `À l'échelle de la commune, ${label} ne se distingue ni parmi les communes les plus favorables, ni parmi les moins favorables.`;
}

// LA LECTURE QUI ORIENTE D'ABORD, PUIS LES CONSTATS À CONFIRMER, chacun dans ses mots. Chaque phrase de
// règle nomme déjà son échelle (« Châtelaillon-Plage se situe… », « … de cette adresse », « Dans ce
// secteur… ») : on les juxtapose sans les fondre, pour qu'aucune ne disparaisse derrière l'autre.
function constatDe(l: Lecture, label: string): string {
  const tete = l.lue ? [constatOriente(l.orientants, l.signal, label)] : [];
  return [...tete, ...l.aConfirmer.map((v) => v.statement)].join(" ");
}

// L'ÉCHELLE D'UN FAIT, DITE AU LECTEUR. Elle se lit sur la première preuve, comme partout (`echelles.ts`).
const ECHELLE_DU_CONSTAT: Record<EvidenceRef["grain"], string> = {
  adresse: "autour de l'adresse",
  secteur: "sur le secteur de l'adresse",
  commune: "sur la commune",
  unite_urbaine: "sur l'agglomération",
};
const ECHELLE_DE_LA_LECTURE: Record<EvidenceRef["grain"], string> = {
  adresse: "de l'adresse",
  secteur: "du secteur",
  commune: "de la commune",
  unite_urbaine: "de l'agglomération",
};
// Une lecture favorable peut être silencieuse (aucun fait) : elle vient alors du rang de la commune.
const grainDe = (faits: DecisionFact[]): EvidenceRef["grain"] =>
  faits.flatMap((f) => (f.role === "compromise" ? [] : f.evidence))[0]?.grain ?? "commune";

// POURQUOI futur•e NE TRANCHE PAS, au grain réel des faits réunis. Sans constat à confirmer, la phrase de
// toujours. Avec, elle dit d'où vient le sens, que le constat n'en donne pas, et ce que ce constat ne
// permet pas de conclure (sa limite, écrite par sa règle : « Cette présence ne dit ni la disponibilité du
// praticien… »).
function pourquoiDe(key: PreferenceKey, l: Lecture): string {
  if (key === "proximite_mer") return POURQUOI_MER;
  if (l.aConfirmer.length === 0) return POURQUOI_PREFERENCE;
  const echelles = [...new Set(l.aConfirmer.map((v) => ECHELLE_DU_CONSTAT[grainDe([v])]))];
  const tete = l.aConfirmer.length === 1
    ? { sujet: `Le constat ${echelles[0]}`, oriente: "ne l'oriente pas : il reste", seul: "à lui seul, il ne dit pas" }
    : { sujet: `Les constats ${echelles.join(" et ")}`, oriente: "ne l'orientent pas : ils restent", seul: "à eux seuls, ils ne disent pas" };
  const phrase = l.lue
    ? `Le sens de cette lecture vient ${ECHELLE_DE_LA_LECTURE[grainDe(l.orientants)]}, sans seuil fixé par vous. ${tete.sujet} ${tete.oriente} à vérifier. Elle éclaire votre condition sans pouvoir la trancher.`
    : `${tete.sujet} ${l.aConfirmer.length === 1 ? "reste" : "restent"} à vérifier : ${tete.seul} si votre condition est respectée.`;
  const limites = [...new Set(l.aConfirmer.flatMap((v) => (v.limitation ? [v.limitation] : [])))];
  return [phrase, ...limites].join(" ");
}

// CE QUE CELA CHANGE, ATTRIBUÉ. Quand un constat d'une autre nature accompagne la lecture, « ce que l'on
// sait » engloberait ce constat, qui ne penche pas : la conséquence nomme alors ce qui penche.
function consequenceDe(l: Lecture): string {
  if (l.aConfirmer.length === 0 || l.signal === "neutre") return consequenceDuSignal(l.signal);
  return consequenceDuSignal(l.signal, `Ce que l'on sait ${ECHELLE_DE_LA_LECTURE[grainDe(l.orientants)]}`);
}

// LA MER A UNE MESURE, ET ELLE SE DIT TOUJOURS DE LA MÊME FAÇON : la distance du point de référence de la
// commune au rivage marin (FUT-33). Sans seuil déclaré, sa règle ne juge pas ; la distance existe pourtant, et
// c'est elle que le lecteur veut lire.
function mesureMer(f: ModuleFacts): { statement: string; evidence: EvidenceRef } | null {
  if (f.merCentreKm == null) return null;
  const km = kmLisible(f.merCentreKm);
  return {
    statement: `Le point de référence ${deCommune(f.nom)} est ${aEnviron(km)} du rivage marin.`,
    evidence: {
      factId: "commune.merCentreKm", module: "territoire", label: `Distance au rivage marin · ${f.nom}`,
      observedValue: `point de référence ${aEnviron(km)} du rivage marin`, grain: "commune", relation: "proximite", href: territoireHref,
    },
  };
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
    const lecture = lectureDe(key, evaluations, reunis);
    if (lecture == null) continue;
    const { signal } = lecture;
    // La lecture qui oriente passe devant : elle donne le sujet, la première preuve et, s'il y en a un,
    // le geste de l'exposition ; les constats à confirmer suivent avec le leur.
    const ordonnes = [...lecture.orientants, ...lecture.aConfirmer];
    const action = actionDe(ordonnes);
    const mer = key === "proximite_mer" ? mesureMer(f) : null;
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
      topic: ordonnes[0]?.topic ?? label,
      statement: mer?.statement ?? constatDe(lecture, label),
      evidence: mer ? [mer.evidence] : preuvesDe(ordonnes, f, key, label),
      whyNotDecided: pourquoiDe(key, lecture),
      capabilityReason: capacite.reason,
      consequence: consequenceDe(lecture),
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
