// L'ADAPTATEUR DOSSIER. Il traduit l'évaluation canonique en politique de RAPPORT : une donnée absente
// n'est JAMAIS une incompatibilité. Le comparateur, lui, exclut dans le doute. Même observation, deux
// conduites, et c'est assumé : le filtre protège le lecteur d'une mauvaise proposition, le dossier le
// protège d'une fausse affirmation.
//
// Une règle par clé, fabriquée au-dessus du MÊME évaluateur que le filtre : c'est ce qui empêche les
// deux moteurs de conclure différemment sur la même commune. La même ÉVALUATION, pas le même VERDICT.
//
// ── LA PORTE DU VERDICT (FUT-7, 01/10/2026) ──────────────────────────────────────────────────
// « Condition non respectée » exige trois choses à la fois :
//
//   1. le lecteur a CONFIRMÉ ce critère comme condition sans compromis (conditions.ts) ;
//   2. futur•e sait le TRANCHER au grain évalué (capability.ts) ;
//   3. l'évaluation canonique conclut à l'incompatibilité.
//
// Avant FUT-7, la simple présence d'une famille dans le projet suffisait : un « en Bretagne » lu par le
// parseur, ou une exclusion fabriquée par la dérivation d'une ancre, devenait une condition éliminatoire
// que personne n'avait posée. Désormais :
//
//   confirmé, trancher,   incompatible  -> incompatibilité (« Condition non respectée »)
//   confirmé, trancher,   satisfait     -> « Condition remplie »
//   confirmé, apprécier,  évalué        -> condition À CONFIRMER, avec son signal (jamais un verdict)
//   confirmé,             non examiné   -> condition ouverte, sans fait (le registre la porte)
//   non confirmé,         incompatible  -> ÉCART au projet, visible, jamais éliminatoire
//   non confirmé,         satisfait     -> silencieux, point favorable (comme avant)
import { HARD_CONSTRAINT_KEYS, haversineKm } from "../hard-constraints.ts";
import type { HardConstraintKey, HardConstraintAssessment } from "../hard-constraints.ts";
import type {
  DecisionRule, RuleEvaluation, IncompatibilityFact, EvidenceRef, ModuleFacts, HardEvaluation,
  MismatchFact, ConditionCheckFact, ConditionMetFact, ConditionSignal, DecisionAction,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { isConfirmed } from "./conditions.ts";
import { evaluateExcludePlace, evaluateExcludeZones } from "../hard-constraints.ts";
import { exclusionsAvecPerimetres } from "../hard-constraints-hydrate.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";
import { FAMILLES_MULTIPLES, hcRestreint, instancesDe, instanceDeVille } from "./effective-value.ts";
import { toCommuneAttributes } from "./module-facts-map.ts";
import { criterionCapability, type CapabilityAssessment, type EvaluationGrain } from "./capability.ts";
import { hardConstraintLabel, HARD_CONSTRAINT_LABELS } from "./project-view.ts";
import { classifyCoastDistance } from "./coast-facts.ts";
import { deCommune } from "../typography.ts";

const territoireHref = "/rapport/quartier";

// LA PROVENANCE N'EST PAS AMPUTÉE. `sourceFactIds` reçoit TOUTES les clés (c'est sa fonction : dire d'où
// vient le constat) ; `evidence` habille celles qui sont des OBSERVATIONS (les `commune.*`). Les clés
// `project.*` ne sont pas des observations : ce sont les déclarations du lecteur, elles n'ont pas de
// carte. Ne garder que `evidenceKeys[0]` laissait des sourceFactIds sans preuve correspondante.
// CE QUE CHAQUE OBSERVATION MESURE. L'altitude ou la population sont des ATTRIBUTS du lieu ; le relief
// à portée, la distance au littoral et la position (qui sert l'itinéraire) sont des PROXIMITÉS — elles
// décrivent l'environnement. Mesurées depuis une adresse, ces dernières relèvent du quartier, pas du
// logement : c'est `echelles.ts` qui en tire la conséquence, pas cette table.
const OBSERVATIONS_DE_PROXIMITE = new Set([
  "commune.reliefProximite",
  "commune.distanceCoteKm",
  "commune.lat",
  "commune.lon",
]);

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

type Evaluee = Extract<HardConstraintAssessment, { status: "incompatible" | "satisfied" }>;

const grainDe = (hard: HardEvaluation): EvaluationGrain =>
  hard.context.point?.grain === "address" ? "adresse" : "commune";

function toEvidence(a: Evaluee, f: ModuleFacts, hard: HardEvaluation): EvidenceRef[] {
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
      relation: OBSERVATIONS_DE_PROXIMITE.has(k) ? "proximite" : "attribut",
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

const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// LE CRITÈRE, NOMMÉ COMME LE LECTEUR LE RECONNAÎT. Le libellé instancié (« la Bretagne », « la proximité
// de la gare Matabiau ») quand il tient dans un sujet de héros ; le libellé de la famille sinon.
function sujetDuCritere(project: UserProject, key: HardConstraintKey): string {
  const l = hardConstraintLabel(project, key);
  return l.length <= 45 && !/[.!?]/.test(l) ? l : HARD_CONSTRAINT_LABELS[key];
}

// L'ÉTAT SCANNABLE d'un écart : la valeur observée, quand elle tient en une étiquette.
function etatObserve(observedLabel: string): string | undefined {
  const s = cap(observedLabel.trim());
  return s.length > 0 && s.length <= 32 && !/[.!?]$/.test(s) ? s : undefined;
}

// ── LES PHRASES DES CONDITIONS ───────────────────────────────────────────────────────────────

// CE QUE L'ON SAIT, QUAND LE LIEU REMPLIT LE CRITÈRE. L'évaluation canonique ne rédige que
// l'incompatibilité ; la condition remplie et le signal favorable ont besoin de leur propre constat.
function constatSatisfait(key: HardConstraintKey, a: Evaluee, f: ModuleFacts, hard: HardEvaluation): string {
  const ici = hard.context.point?.grain === "address" ? "Cette adresse" : `Le point de référence ${deCommune(f.nom)}`;
  switch (key) {
    case "departements":
      return `${f.nom} est dans le ${a.observedLabel}.`;
    case "zones":
      return `${f.nom} se situe ${enLieu(a.expectedLabel)}.`;
    case "excludeZones":
      return `${f.nom} est ${a.expectedLabel}.`;
    case "montagne":
      return `${f.nom} se situe à ${a.observedLabel} d'altitude au point de référence de la commune.`;
    case "reliefProche":
      return f.reliefAltitudeMaxM != null
        ? `Dans un rayon de 35 km autour ${deCommune(f.nom)}, une commune atteint ${a.observedLabel} d'altitude de référence.`
        : `Un relief montagneux est à portée ${deCommune(f.nom)}.`;
    case "nearSea":
    case "excludeSea":
      return `Le point de référence ${deCommune(f.nom)} se situe à ${a.observedLabel} du littoral.`;
    case "nearPlace":
      return `${ici} est ${a.observedLabel.startsWith("dans ") ? "" : "à "}${a.observedLabel}, pour ${a.expectedLabel} attendu.`;
    case "communeSize":
    case "sizeRelativeTo":
      return `${f.uu ? `L'agglomération ${deCommune(f.nom)}` : f.nom} compte ${a.observedLabel.replace(/ hab\.$/, " habitants")}.`;
    case "excludePlace":
      return `${f.nom} ne fait pas partie de l'agglomération ${a.expectedLabel.replace(/^hors /, "")}.`;
  }
}

// LE FAIT, QUAND LE LIEU NE REMPLIT PAS LE CRITÈRE ET QUE futur•e NE SAIT QUE L'APPRÉCIER. Une phrase,
// factuelle : la convention et la limite de la mesure vont dans « Données et limites » (`whyNotDecided`),
// le sens est porté par l'étiquette. L'évaluation canonique, elle, rédige pour un écart et répète la
// convention dans la phrase : sous une carte « Condition ouverte », ce serait la troisième fois.
function constatDefavorable(key: HardConstraintKey, a: Evaluee, f: ModuleFacts): string {
  switch (key) {
    case "montagne":
      return `${f.nom} se situe à ${a.observedLabel} d'altitude au point de référence de la commune.`;
    case "reliefProche": {
      const premiere = "statement" in a ? a.statement.split(". ")[0] : "";
      return premiere ? `${premiere.replace(/\.$/, "")}.` : `Aucun relief montagneux n'est à portée ${deCommune(f.nom)}.`;
    }
    case "nearSea":
    case "excludeSea":
      return `Le point de référence ${deCommune(f.nom)} se situe à ${a.observedLabel} du littoral.`;
    case "communeSize":
    case "sizeRelativeTo":
      return `${f.uu ? `L'agglomération ${deCommune(f.nom)}` : f.nom} compte ${a.observedLabel.replace(/ hab\.$/, " habitants")}.`;
    case "excludePlace":
      return `${f.nom} fait partie de l'${a.observedLabel.replace(/^dans l'/, "")}.`;
    default:
      return "statement" in a ? a.statement : constatSatisfait(key, a, f, { context: { point: null } } as never);
  }
}

// « la Bretagne » -> « en Bretagne », « le Grand Est » -> « dans le Grand Est ». Un périmètre composé
// (« la Bretagne ou la Normandie ») garde « dans », qui se lit toujours.
function enLieu(label: string): string {
  if (/ (ou|et) /.test(label)) return `dans ${label}`;
  if (label.startsWith("la ")) return `en ${label.slice(3)}`;
  if (label.startsWith("l'")) return `en ${label.slice(2)}`;
  return `dans ${label}`;
}

// POURQUOI futur•e NE TRANCHE PAS. Une phrase par cause, au plus près du critère : c'est ce qui
// distingue « à confirmer » de « nous ne savons pas ». Elle dit la limite de LA MESURE, jamais celle
// du lieu.
function pourquoiNonTranche(key: HardConstraintKey, c: CapabilityAssessment): string {
  switch (c.reason) {
    case "convention_produit":
      // La carte ne montre que le fait : la définition retenue, et ce qu'elle ne dit pas, vivent ici, dans
      // « Données et limites ». Elles restent accessibles ; elles ne chargent plus la face.
      if (key === "montagne") return "futur•e utilise actuellement 600 m comme définition opérationnelle de « vivre à la montagne ». Ce seuil est une convention, et l'altitude peut varier au sein d'une commune. Vérifier l'adresse précise le constat sans déterminer à lui seul ce que vous entendez par « montagne ».";
      if (key === "reliefProche") return "futur•e considère actuellement un relief montagneux à portée à partir d'environ 1 250 m d'altitude de référence dans un rayon de 35 km. Ce seuil est une convention, pas une limite que vous avez fixée.";
      if (key === "excludeSea") return "futur•e considère actuellement « loin du littoral » comme au moins 15 km de la côte. Cette distance est une convention, pas une limite que vous avez fixée.";
      return "Ce périmètre est lu comme une liste de départements choisie par futur•e. Cette convention éclaire votre condition sans pouvoir la trancher.";
    case "point_de_reference":
      return key === "nearSea"
        ? "La distance au littoral est mesurée depuis le point de référence de la commune, même quand une adresse est connue. Elle ne dit pas non plus quelle mesure vous visez : à vol d'oiseau, par la route ou en temps de trajet."
        : "Le temps de trajet est estimé depuis le point de référence de la commune. Il ne vaut pas pour toutes ses adresses.";
    case "metrique_non_enregistree":
      return "Votre limite est en kilomètres, sans préciser à vol d'oiseau ou par la route. La distance mesurée ici est à vol d'oiseau, ce qui ne suffit pas à trancher.";
    case "unite_non_enregistree":
      return key === "sizeRelativeTo"
        ? "La comparaison porte sur les agglomérations, alors que votre projet nomme une ville. Elle éclaire sans trancher."
        : "Votre projet ne précise pas si cette taille vise la commune ou son agglomération, ni d'où vient la limite. L'agglomération est lue ici, ce qui ne suffit pas à trancher.";
    case "agglomeration_implicite":
      return "Quitter une ville est lu ici comme quitter toute son agglomération. Votre projet ne le précise pas : cette lecture ne suffit pas à trancher.";
    case "sans_seuil":
      return key === "nearSea"
        ? "Votre projet ne fixe pas de distance à la mer. La mesure situe la commune, elle ne dit pas si votre condition est respectée."
        : "Votre projet ne fixe ni distance ni temps de trajet. La mesure situe le lieu, elle ne dit pas si votre condition est respectée.";
    default:
      return "La donnée disponible éclaire cette condition sans pouvoir la trancher.";
  }
}

// CE QUE CELA CHANGE POUR LA DÉCISION. Le signal dit vers quoi penche ce que l'on sait ; la condition,
// elle, reste ouverte dans tous les cas.
export function consequenceDuSignal(signal: ConditionSignal): string {
  if (signal === "defavorable") return "Ce que l'on sait penche contre cette condition. Elle reste ouverte : à vérifier avant de décider.";
  if (signal === "favorable") return "Ce que l'on sait va dans le sens de cette condition. Elle reste ouverte : à confirmer avant de décider.";
  // Le constat porte déjà la mesure neutre : la conséquence ne la redit pas.
  return "Elle reste ouverte : à vérifier avant de décider.";
}

export function etatDuSignal(signal: ConditionSignal): string {
  // « OUVERTE », PAS « À CONFIRMER » : le lecteur a déjà confirmé que c'est une condition. Ce qui reste
  // ouvert, c'est son RESPECT par ce lieu.
  if (signal === "defavorable") return "Ouverte · plutôt défavorable";
  if (signal === "favorable") return "Ouverte · plutôt favorable";
  return "Condition ouverte";
}

// LE GESTE, SEULEMENT QUAND IL EST CONNU. Une condition sur une convention de périmètre ou sur une unité
// non précisée n'appelle aucune vérification sur place : on n'en invente pas.
//
// ET LE GESTE NE PRÉTEND PAS LEVER CE QU'IL NE LÈVE PAS. Il peut affiner la MESURE (l'altitude exacte d'un
// logement, un itinéraire réel) ; il ne dit pas si la convention de futur•e, ou la métrique mesurée, est
// celle que le lecteur avait en tête. Cette ambiguïté appartient au projet, et elle reste ouverte.
function gesteConnu(key: HardConstraintKey, c: CapabilityAssessment): DecisionAction | undefined {
  if (key === "montagne") {
    return {
      type: "verifier_sur_place", label: "Vérifiez l'altitude exacte de l'adresse",
      detail: "Elle se lit sur la carte de l'IGN (Géoportail), et peut s'écarter fortement de celle du point de référence de la commune.",
    };
  }
  if (key === "nearSea" && c.reason === "point_de_reference") {
    return {
      type: "verifier_sur_place", label: "Mesurez la distance depuis l'adresse visée",
      detail: "Depuis l'adresse plutôt que depuis le point de référence de la commune, avec la mesure qui correspond à votre condition.",
    };
  }
  if (key === "nearPlace" && c.reason === "metrique_non_enregistree") {
    return {
      type: "verifier_sur_place", label: "Mesurez le trajet depuis l'adresse visée",
      detail: "La distance affichée est à vol d'oiseau. Un itinéraire depuis l'adresse précise ce constat si votre condition vise la route ou un temps de trajet.",
    };
  }
  if (key === "nearPlace" && c.reason === "point_de_reference") {
    return { type: "renseigner_adresse", label: "Renseignez l'adresse pour estimer le trajet depuis le logement" };
  }
  return undefined;
}

function conditionCheck(
  key: HardConstraintKey, project: UserProject, f: ModuleFacts, c: CapabilityAssessment,
  signal: ConditionSignal, statement: string, evidence: EvidenceRef[], sourceFactIds: string[], topic: string,
): ConditionCheckFact {
  const action = gesteConnu(key, c);
  return {
    id: `${f.insee}:condition:${key}`,
    ruleId: `territoire.hard.${key}`,
    sourceFactIds,
    module: "territoire",
    role: "condition_check",
    criterion: { kind: "hard", key },
    headlineSubject: sujetDuCritere(project, key),
    signal,
    status: etatDuSignal(signal),
    materialityTier: "structuring",
    topic,
    statement,
    evidence,
    whyNotDecided: pourquoiNonTranche(key, c),
    capabilityReason: c.reason,
    consequence: consequenceDuSignal(signal),
    ...(action ? { action } : {}),
  };
}

// « IL NOUS FAUT LA MER », « PRÈS DE BREST » : AUCUN SEUIL, MAIS UNE MESURE. L'évaluation canonique ne
// peut rien conclure sans limite (`missing_parameter`) ; la mesure existe pourtant, et la taire ferait
// d'« à confirmer » un « nous ne savons pas ». Elle se montre donc, avec ce qu'elle permet d'en dire.
//
// La mer s'apprécie avec la convention que la préférence `proximite_mer` emploie déjà (`coast-facts.ts`) :
// proche, intermédiaire, éloignée. Un lieu nommé sans seuil n'a aucune convention : la distance est
// dite, sans pencher.
function mesureSansSeuil(
  key: HardConstraintKey, project: UserProject, f: ModuleFacts, hard: HardEvaluation, c: CapabilityAssessment,
): ConditionCheckFact | null {
  const grain = hard.context.point?.grain === "address" ? "adresse" : "commune";
  if (key === "nearSea" && f.distanceCoteKm != null) {
    const km = Math.round(f.distanceCoteKm);
    const v = classifyCoastDistance(f.distanceCoteKm);
    const signal: ConditionSignal = v === "satisfied" ? "favorable" : v === "mismatch" ? "defavorable" : "neutre";
    return conditionCheck(key, project, f, c, signal,
      `Le point de référence ${deCommune(f.nom)} se situe à environ ${km} km du littoral.`,
      [{
        factId: "commune.distanceCoteKm", module: "territoire", label: `Distance au littoral · ${f.nom}`,
        observedValue: `${km} km`, grain, relation: "proximite", href: territoireHref,
      }],
      ["commune.distanceCoteKm", "project.hardConstraints.nearSea"], "la distance au littoral");
  }
  const np = hard.context.constraints.nearPlace;
  const point = hard.context.point;
  if (key === "nearPlace" && np && np.reference.status === "resolved" && point) {
    const km = Math.round(haversineKm(point.lat, point.lon, np.reference.lat, np.reference.lon));
    const sujet = point.grain === "address" ? "Cette adresse" : `Le point de référence ${deCommune(f.nom)}`;
    return conditionCheck(key, project, f, c, "neutre",
      `${sujet} est à environ ${km} km à vol d'oiseau ${deCommune(np.reference.canonicalLabel)}.`,
      [{
        factId: "commune.lat", module: "territoire", label: `Position · ${f.nom}`,
        observedValue: `${km} km`, grain, relation: "proximite", href: territoireHref,
      }],
      ["commune.lat", "commune.lon", "project.hardConstraints.nearPlace"], `la distance à ${np.reference.canonicalLabel}`);
  }
  return null;
}

// UNE VUE : la famille entière (cas général), ou quelques éléments d'une famille multiple (FUT-8).
type Vue = { hard: HardEvaluation; hc: HardConstraints; confirme: boolean; instance: string | null };

// FUT-8 : « JE DOIS QUITTER LYON, ET J'AIMERAIS ÉVITER BORDEAUX ». Quand une ville (ou une zone exclue) est
// confirmée seule, chaque ville confirmée est évaluée seule, et les autres ensemble, comme avant. Sans
// confirmation par élément, rien ne change : une seule vue, la famille entière. La Recherche n'est pas
// concernée (elle évalue toujours la famille entière).
function vuesParElement(key: HardConstraintKey, f: ModuleFacts, project: UserProject, hard: HardEvaluation): Vue[] | null {
  if (!FAMILLES_MULTIPLES.has(key)) return null;
  const hc = project.parsed?.hardConstraints ?? {};
  const instances = instancesDe(hc, key);
  const confirmees = instances.filter((i) => isConfirmed(project, { kind: "hard", key, instance: i }));
  if (confirmees.length === 0) return null;
  const attrs = toCommuneAttributes(f);
  const vue = (garde: string[], confirme: boolean, instance: string | null): Vue => {
    const sous = hcRestreint(hc, key, garde);
    const constraints = key === "excludePlace"
      ? { ...hard.context.constraints, excludePlace: hard.context.constraints.excludePlace.filter((e) => garde.includes(instanceDeVille(e.label))) }
      : { ...hard.context.constraints, excludeZones: exclusionsAvecPerimetres(sous) };
    const context = { ...hard.context, constraints };
    const a = key === "excludePlace" ? evaluateExcludePlace(context, attrs) : evaluateExcludeZones(context, attrs);
    return { hard: { context, byKey: { ...hard.byKey, [key]: a } }, hc: sous, confirme, instance };
  };
  const autres = instances.filter((i) => !confirmees.includes(i));
  return [...confirmees.map((i) => vue([i], true, i)), ...(autres.length > 0 ? [vue(autres, false, null)] : [])];
}

// L'issue la plus grave l'emporte quand plusieurs vues sont fusionnées.
const GRAVITE: RuleEvaluation["outcome"][] = ["incompatible", "condition_check", "mismatch", "uncertain", "satisfied", "not_applicable"];
const gravite = (o: RuleEvaluation["outcome"]) => { const i = GRAVITE.indexOf(o); return i < 0 ? GRAVITE.length : i; };

// Un fait évalué sur UN élément porte cet élément : identifiant distinct, critère précis.
function marquerElement(fact: RuleEvaluation["facts"][number], instance: string): RuleEvaluation["facts"][number] {
  const id = `${fact.id}:${instance}`;
  if (fact.role === "condition_check" || fact.role === "condition_met") {
    return { ...fact, id, criterion: { ...fact.criterion, instance } } as typeof fact;
  }
  if (fact.role === "incompatibility" || fact.role === "mismatch") return { ...fact, id, criterionInstance: instance };
  return { ...fact, id };
}

function makeRule(key: HardConstraintKey): DecisionRule {
  const id = `territoire.hard.${key}`;
  return {
    id,
    module: "territoire",
    hardConstraint: key,
    evaluate: (f, project, hard): RuleEvaluation => {
      const vues = vuesParElement(key, f, project, hard);
      if (!vues) {
        return evaluerVue(f, project, {
          hard, hc: project.parsed?.hardConstraints ?? {}, confirme: isConfirmed(project, { kind: "hard", key }), instance: null,
        });
      }
      const evs = vues.map((v) => {
        const ev = evaluerVue(f, project, v);
        return v.instance ? { ...ev, facts: ev.facts.map((x) => marquerElement(x, v.instance!)) } : ev;
      });
      const pire = evs.reduce((p, e) => (gravite(e.outcome) < gravite(p.outcome) ? e : p));
      return { ...pire, facts: evs.flatMap((e) => e.facts), reason: evs.map((e) => e.reason).join(" ; ") };
    },
  };

  function evaluerVue(f: ModuleFacts, project: UserProject, vue: Vue): RuleEvaluation {
    {
      const hard = vue.hard;
      // Les 11 évaluations ont été calculées UNE fois, par runRules. Les rappeler ici en ferait 121.
      const a = hard.byKey[key];
      const ret = (outcome: RuleEvaluation["outcome"], facts: RuleEvaluation["facts"], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [key], outcome, facts, reason });

      if (a.status === "not_declared") return ret("not_applicable", [], "non déclarée");

      const confirme = vue.confirme;
      const capacite = criterionCapability({ kind: "hard", key, hc: vue.hc }, grainDe(hard));

      if (a.status === "unexamined") {
        // Une condition confirmée qu'on ne sait qu'apprécier, sans seuil mais avec une mesure : la mesure
        // se montre. Tout le reste reste NON EXAMINÉ : le critère ne fait pas monter la couverture, et une
        // condition confirmée laissée ouverte empêche une couverture « élevée » (couperet du registre).
        if (confirme && capacite.capability === "apprecier") {
          const mesure = mesureSansSeuil(key, project, f, hard, capacite);
          if (mesure) return ret("condition_check", [mesure], "condition confirmée, mesurée sans seuil");
        }
        return ret("uncertain", [], a.reason);
      }

      if (a.status === "satisfied") {
        // Non confirmé : examiné, rien à redire. SILENCIEUX (aucune carte), mais c'est un point favorable et
        // la couverture monte. Rendre not_applicable ici serait le bug corrigé par la slice 2.1.
        if (!confirme) return ret("satisfied", [], "respectée");
        const evidence = toEvidence(a, f, hard);
        const constat = constatSatisfait(key, a, f, hard);
        const topic = sujetDuCritere(project, key);
        if (capacite.capability === "trancher") {
          const remplie: ConditionMetFact = {
            id: `${f.insee}:condition:${key}`, ruleId: id, sourceFactIds: a.evidenceKeys, module: "territoire",
            role: "condition_met", criterion: { kind: "hard", key },
            headlineSubject: topic, status: "Condition respectée",
            materialityTier: "structuring", topic, statement: constat, evidence,
          };
          return ret("satisfied", [remplie], "condition confirmée, remplie");
        }
        // Appréciable seulement : un signal favorable n'est JAMAIS une condition remplie.
        return ret("condition_check",
          [conditionCheck(key, project, f, capacite, "favorable", constat, evidence, a.evidenceKeys, topic)],
          "condition confirmée, signal favorable");
      }

      // INCOMPATIBLE selon l'évaluation canonique.
      if (confirme && capacite.capability === "trancher") {
        const fact: IncompatibilityFact = {
          id: `${f.insee}:hard:${key}`,
          ruleId: id,
          sourceFactIds: a.evidenceKeys,
          module: "territoire",
          role: "incompatibility",
          evidenceStrength: "established",
          hardConstraintKey: key,
          evaluatedGrain: grainDe(hard),
          materialityTier: "decision_critical",
          topic: a.topic,
          statement: a.statement,
          evidence: toEvidence(a, f, hard),
        };
        return ret("incompatible", [fact], "condition confirmée non respectée");
      }
      if (confirme) {
        return ret("condition_check",
          [conditionCheck(key, project, f, capacite, "defavorable", constatDefavorable(key, a, f), toEvidence(a, f, hard), a.evidenceKeys, a.topic)],
          "condition confirmée, signal défavorable");
      }
      // NON CONFIRMÉ : un critère du projet que le lieu ne remplit pas. Un écart STRUCTURANT, visible, à
      // arbitrer : jamais une incompatibilité. Le tier est une règle de matérialité transitoire (FUT-7) :
      // un critère géographique n'a pas encore d'importance déclarée, et il ne doit ni disparaître ni se
      // faire passer pour un « poids 3 » que le lecteur aurait choisi.
      const status = etatObserve(a.observedLabel);
      const ecart: MismatchFact = {
        id: `${f.insee}:ecart:${key}`,
        ruleId: id,
        sourceFactIds: a.evidenceKeys,
        module: "territoire",
        role: "mismatch",
        projectKey: key,
        materialityTier: "structuring",
        topic: a.topic,
        headlineSubject: sujetDuCritere(project, key),
        statement: a.statement,
        basis: { kind: "declared_criterion", observedLabel: a.observedLabel, expectedLabel: a.expectedLabel },
        evidence: toEvidence(a, f, hard),
        ...(status ? { status } : {}),
      };
      return ret("mismatch", [ecart], "critère du projet non rempli, non confirmé");
    }
  }
}

export const HARD_CONSTRAINT_RULES: DecisionRule[] = HARD_CONSTRAINT_KEYS.map(makeRule);
