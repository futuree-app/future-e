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
  CompromiseFact, VerificationFact, MismatchFact, EvidenceRef,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { EvidenceTargetKey } from "./evidence-targets.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, preferenceWeight } from "./project-view.ts";
import { LOGEMENT_RULES } from "./logement-rules.ts";
import { HARD_CONSTRAINT_RULES } from "./hard-constraint-rules.ts";
import { MISMATCH_RULES } from "./mismatch-rules.ts";
import { ALIGNMENT_RULES } from "./alignment-rules.ts";
import { ABSENCE_RULES } from "./absence-rules.ts";
import { COAST_RULES } from "./coast-rules.ts";
import { AGGLOMERATION_RULES } from "./agglomeration-rules.ts";
import { AGGLOMERATION_CATEGORIES } from "./agglomeration-facts.ts";
import { toCommuneAttributes } from "./module-facts-map.ts";
import {
  trajectoirePhrase, fmtClimatCount, classifyClimateComfort, summerComfortAction, CLIMAT_HORIZON_LABEL, type ClimatAxe,
} from "./climat-facts.ts";
import {
  bruitEnPhrase, industrieEnPhrase, industrieGlose, distanceEnPhrase,
  AIR_NO2_OMS, AIR_PM25_UE_2030, BRUIT_MAX_KM, type BruitSource,
} from "./sante-facts.ts";

// Majuscule en tête de phrase (les libellés de sante-facts sont des fragments réutilisables).
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// La forme COURTE, pour la preuve (l'observedValue n'est pas une phrase).
const BRUIT_LABEL_COURT: Record<BruitSource, string> = {
  auto: "autoroute", rail: "voie ferrée", aero: "aéroport",
};
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
    // LA PREUVE EST OPPOSABLE, jamais un score interne : « 100/100 » se lisait comme une probabilité ou
    // une certitude. On affiche la matière vérifiable (arrêtés CatNat) ; le score reste au moteur.
    const observed = f.catnatInondation != null
      ? `exposition élevée · ${f.catnatInondation} arrêtés CatNat depuis 1982`
      : "exposition élevée";
    const ev: EvidenceRef = { factId: "inondation.risque", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: observed, grain: "commune", href: territoireHref, targetKey: "risk.flooding" };
    const fact: VerificationFact = {
      id: `${f.insee}:inondation-exposition`, ruleId: RULE_INOND, sourceFactIds: ["inondation.risque", "inondation.catnat"], module: "territoire",
      role: "verification", materialityTier: "structuring", topic: "l'exposition à l'inondation",
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


// ── LES RÈGLES CLIMAT ────────────────────────────────────────────────────────
//
// UN RISQUE N'EST PAS UNE INCERTITUDE. Le constat est ÉTABLI (la trajectoire est mesurée) ; c'est sa
// PORTÉE DÉCISIONNELLE qui s'instruit à une échelle plus fine. On n'écrit donc jamais « le risque de
// fortes chaleurs est à vérifier » (il est mesuré), mais : voici ce que le climat fait ici, et voici ce
// qu'il faut aller regarder pour savoir ce que cela change pour vous.
//
// LA TABLE DE VÉRITÉ vaut pour LE FEU ET LES PLUIES :
//   critère non déclaré (poids < 2)              -> not_applicable  (non examiné)
//   aucune valeur projetée lisible               -> uncertain       (non examiné : une donnée absente
//                                                                    n'est JAMAIS une exposition faible)
//   au moins un axe NOTABLE                      -> verification    (carte + chiffre + action)
//   tous les axes lus, aucun notable             -> satisfied       (silencieux, la COUVERTURE MONTE)
//   aucun notable MAIS un axe manquant           -> uncertain       (l'axe manquant pouvait être notable)
//
// LA CHALEUR A DIVERGÉ (lot D). Une priorité de faible chaleur CONTREDITE n'est pas un constat territorial à
// « vérifier » : c'est un ÉCART AU PROJET. `ruleChaleur` produit donc un MISMATCH (poids >= 2, orientation
// arbitration) ou un mismatch SILENCIEUX (poids 1), jamais une verification ; le renvoi au confort du
// logement, qu'un mismatch ne peut pas porter, est restauré par une composition. La chaleur NON déclarée
// (poids 0) reviendra en verification AMBIANTE, dans une règle séparée (Task 4).
//
// LA CONVENTION DE SIGNALEMENT EST DITE SUR LA CARTE, dans son propre champ (`signalConvention`, ligne
// discrète sous le constat), jamais appliquée en silence, et jamais noyée au milieu du constat où elle
// alourdissait la trajectoire : c'est un seuil de SIGNALEMENT futur•e, pas une limite officielle de danger
// sanitaire. Elle écrit l'opérateur qu'elle applique (le code teste `>=`, le texte dit « à partir de »).
// Elle ne remonte PAS à la conclusion rédigée (card-only) : une conclusion n'a pas à réciter une convention.
//
// LA MATÉRIALITÉ SUIT LE POIDS DÉCLARÉ, jamais l'intensité seule : `structuring` si le lecteur a pesé le
// critère à 3, `secondary` s'il l'a posé à 2. JAMAIS `decision_critical` : une préférence n'est pas une
// condition non négociable, et le verdict ne doit pas basculer sur un souhait.

// LE PHÉNOMÈNE VISÉ, par axe climatique : la preuve renvoie à la carte du module Territoire qui le
// DÉMONTRE, pas au haut du module. Un axe sans carte n'entre pas ici — un lien qui promet une
// démonstration inexistante est pire que le lien de repli vers le module (cf. evidence-targets.ts).
const CLIMAT_TARGET: Record<string, EvidenceTargetKey | undefined> = {
  joursTresChauds: "climate.extreme_heat",
  nuitsTropicales: "climate.tropical_nights",
  temperatureMoyenne: "climate.mean_temperature",
  pluieIntense: "climate.heavy_rain",
};

const climatEvidence = (nom: string, key: string, axe: ClimatAxe): EvidenceRef => ({
  factId: `climat.${key}`,
  module: "territoire",
  label: `Climat · ${nom}`,
  // fmtClimatCount porte le NOM du compte (« 44 nuits », pas « 44 jours ») : hors phrase, la chip doit dire
  // son unité, et « unit » (« jours ») ne distingue pas jour et nuit.
  observedValue:
    axe.projete != null ? `${fmtClimatCount(axe.projete, axe)} à l'horizon ${CLIMAT_HORIZON_LABEL}` : undefined,
  grain: "commune",
  href: territoireHref,
  ...(CLIMAT_TARGET[key] ? { targetKey: CLIMAT_TARGET[key] } : {}),
});

const tierFor = (p: UserProject, key: PreferenceKey): "structuring" | "secondary" =>
  preferenceWeight(p, key) >= 3 ? "structuring" : "secondary";

// La limitation est la MÊME pour les trois : le climat se lit au grain de la commune, et ce que le lecteur
// vivra dépend de son logement et de son adresse. Le dire, c'est ce qui rend la vérification utile.
const LIMITATION_CLIMAT = "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.";

// LA NARRATION CHALEUR, PARTAGÉE par le mismatch (priorité déclarée, ruleChaleur) et la verification
// AMBIANTE (non déclarée, ruleChaleurAmbiante) : mêmes trajectoires jours/nuits, même preuve suivant le
// texte (le bug d'Antibes), même convention de seuil. Ce qui DIFFÈRE entre les deux, c'est le RÔLE du fait
// (un écart au projet vs un constat du territoire), pas ce qu'il raconte du climat.
function chaleurNarration(nom: string, jours: ClimatAxe, nuits: ClimatAxe): { statement: string; evidence: EvidenceRef[]; seuils: string } {
  const phrases: string[] = [];
  if (jours.notable) phrases.push(trajectoirePhrase(jours, "Les jours au-dessus de 35 °C"));
  // « Nuit tropicale » est un terme technique (Météo-France) : on le donne, puis on le TRADUIT dans le corps
  // du lecteur, après deux points, SANS absolu (« peine à récupérer », pas « ne récupère plus »). Quand les
  // jours sont aussi notables, la 2e trajectoire hérite du cadre (« de 33 à 69 par an »).
  if (nuits.notable) {
    const sujetNuits = jours.notable ? "Les nuits tropicales, elles," : "Les nuits tropicales";
    phrases.push(
      `${trajectoirePhrase(nuits, sujetNuits, { heriteCadre: jours.notable })} : des nuits où la température ne redescend pas sous 20 °C, et où le corps peine à récupérer`,
    );
  }
  const seuils = [
    jours.notable ? `${jours.threshold} jours par an au-dessus de 35 °C` : null,
    nuits.notable ? `${nuits.threshold} nuits tropicales par an` : null,
  ].filter(Boolean).join(", ou de ");
  // LA PREUVE SUIT LE TEXTE : seul l'axe dont le constat parle entre en preuve (le bug d'Antibes).
  const evidence = [
    ...(jours.notable ? [climatEvidence(nom, "joursTresChauds", jours)] : []),
    ...(nuits.notable ? [climatEvidence(nom, "nuitsTropicales", nuits)] : []),
  ];
  return { statement: `${phrases.join(". ")}.`, evidence, seuils };
}

// Exporté : la couche de composition (fact-compositions.ts) référence cette règle ; l'importer
// garantit qu'un renommage casse le typecheck, jamais silencieusement une composition.
export const RULE_CHALEUR = "territoire.climat-chaleur";
const ruleChaleur: DecisionRule = {
  id: RULE_CHALEUR,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "faible_chaleur";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_CHALEUR, projectKeys: [key], outcome, facts, reason });

    // POIDS 0 = NON DÉCLARÉE : hors sujet ici. Le constat de chaleur NON demandé sera porté par une règle
    // AMBIANTE séparée (Task 4), pour ne jamais mêler « contredit une priorité » et « phénomène du lieu ».
    const weight = preferenceWeight(p, key);
    if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");
    const c = f.climat;
    if (!c) return ret("uncertain", [], "trajectoire climatique indisponible");

    // LE VERDICT ET SON FONDEMENT viennent du classifieur PUR (Task 0), qui garde le même piège : une donnée
    // absente n'est jamais une bonne nouvelle (uncertain), sous le seuil est silencieux (satisfied), et un
    // seul axe défavorable suffit à déclencher (unfavorable).
    const { verdict, basis } = classifyClimateComfort(c);
    if (verdict === "uncertain") return ret("uncertain", [], "un axe de chaleur n'a pas pu être lu");
    if (verdict === "under_threshold") return ret("satisfied", [], "exposition sous le seuil de signalement");

    // verdict === "unfavorable" : la priorité déclarée est CONTREDITE. C'est un ÉCART AU PROJET (mismatch),
    // orientation « arbitration », jamais un constat territorial « au-delà de vos priorités » (verification).
    // Poids 1 : examiné, l'écart est réel, mais il ne mérite pas une carte (silencieux, aucun fait).
    if (weight < 2) return ret("mismatch", [], "exposition défavorable, silencieuse (poids 1)");
    // basis est non-null par construction (unfavorable => basis renseigné) ; la garde protège tout appelant.
    if (!basis) throw new Error(`[decision] ${RULE_CHALEUR}: invariant interne, fondement climatique attendu`);

    const { statement, evidence } = chaleurNarration(f.nom, c.joursTresChauds, c.nuitsTropicales);
    const fact: MismatchFact = {
      id: `${f.insee}:climat-chaleur`, ruleId: RULE_CHALEUR,
      sourceFactIds: ["climat.joursTresChauds", "climat.nuitsTropicales"], module: "territoire",
      role: "mismatch", projectKey: key, materialityTier: tierFor(p, key),
      topic: "les fortes chaleurs",
      // LE SUJET DU HÉROS nomme l'OBJET DU PROJET (« des étés supportables »), pas l'instruction du lecteur
      // (« éviter les fortes chaleurs ») ni l'indicateur défavorable. À faire relire à l'Editorial Writer.
      headlineSubject: "des étés supportables",
      statement,
      basis,
      limitation: LIMITATION_CLIMAT,
      evidence,
      // NI action NI signalConvention : un mismatch a le constat établi (rien à vérifier), et le renvoi au
      // confort du logement est restauré par une composition (Task 2), via summerComfortAction.
    };
    return ret("mismatch", [fact], "exposition à la chaleur défavorable, priorité déclarée");
  },
};

// LA VERIFICATION AMBIANTE (lot D, D-2) : la chaleur future NON demandée. Règle SÉPARÉE de ruleChaleur, par
// clarté — « contredit une priorité » (mismatch) et « phénomène important du lieu » (verification) sont deux
// natures, et les mêler sous une seule règle rendrait le code illisible. Elle ne s'applique QUE si
// faible_chaleur n'est pas déclarée (poids 0) : sinon ruleChaleur porte déjà le signal, et « une dimension,
// un signal » interdit d'en ajouter un second. Ses `projectKeys` sont VIDES : le constat n'est rattaché à
// aucune priorité du lecteur, donc criteria-registry (qui n'agrège que les clés déclarées) ne le consulte
// jamais — aucun effet sur la couverture, l'orientation ou le compte favorable.
export const RULE_CHALEUR_AMBIANTE = "territoire.verification-chaleur-future";
const ruleChaleurAmbiante: DecisionRule = {
  id: RULE_CHALEUR_AMBIANTE,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_CHALEUR_AMBIANTE, projectKeys: [], outcome, facts, reason });

    // Déclarée (poids >= 1, y compris le poids 1 silencieux) : ruleChaleur porte le signal, pas ici.
    if (preferenceWeight(p, "faible_chaleur") > 0) return ret("not_applicable", [], "chaleur déclarée : ruleChaleur porte le signal");
    const c = f.climat;
    if (!c) return ret("uncertain", [], "trajectoire climatique indisponible");

    const { verdict } = classifyClimateComfort(c);
    if (verdict === "uncertain") return ret("uncertain", [], "un axe de chaleur n'a pas pu être lu");
    if (verdict === "under_threshold") return ret("satisfied", [], "exposition sous le seuil de signalement");

    // verdict "unfavorable" : un constat AMBIANT du territoire, au grain commune. Il est SECONDARY : le
    // lecteur ne l'a pas priorisé, il ne couronne donc jamais un héros ni ne pèse comme une priorité.
    const { statement, evidence, seuils } = chaleurNarration(f.nom, c.joursTresChauds, c.nuitsTropicales);
    const fact: VerificationFact = {
      id: `${f.insee}:verification-chaleur-future`, ruleId: RULE_CHALEUR_AMBIANTE,
      sourceFactIds: ["climat.joursTresChauds", "climat.nuitsTropicales"], module: "territoire",
      role: "verification", materialityTier: "secondary",
      topic: "les fortes chaleurs",
      statement,
      signalConvention: `futur•e signale cette exposition à partir de ${seuils}.`,
      limitation: LIMITATION_CLIMAT,
      evidence,
      // Le renvoi au confort du logement : même geste que partout (source de vérité partagée).
      action: summerComfortAction(f.hasAddress),
    };
    return ret("verification", [fact], "exposition à la chaleur notable, non déclarée");
  },
};

const RULE_FEU = "territoire.climat-feu";
const ruleFeu: DecisionRule = {
  id: RULE_FEU,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "faible_risque_feu";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_FEU, projectKeys: [key], outcome, facts, reason });

    if (preferenceWeight(p, key) < 2) return ret("not_applicable", [], "priorité non déclarée");
    const axe = f.climat?.joursFeu;
    if (!axe || axe.projete == null) return ret("uncertain", [], "indice forêt-météo indisponible");
    if (!axe.notable) return ret("satisfied", [], "danger météorologique sous le seuil de signalement");

    const fact: VerificationFact = {
      id: `${f.insee}:climat-feu`, ruleId: RULE_FEU, sourceFactIds: ["climat.joursFeu"], module: "territoire",
      role: "verification", materialityTier: tierFor(p, key),
      topic: "le danger d'incendie",
      // L'INDICE MESURE UN DANGER MÉTÉOROLOGIQUE, pas la probabilité qu'un incendie survienne. La phrase ne
      // promet donc pas plus que la donnée ne sait dire.
      statement: `${trajectoirePhrase(axe, "Les jours où l'indice forêt-météo dépasse 40, seuil de danger météorologique très sévère,")}.`,
      signalConvention: `futur•e signale cette exposition à partir de ${axe.threshold} jours par an.`,
      limitation: LIMITATION_CLIMAT,
      evidence: [climatEvidence(f.nom, "joursFeu", axe)],
      action: {
        type: "verifier_sur_place",
        label: "Regardez la végétation autour du terrain",
        detail: "Renseignez-vous sur l'obligation de débroussaillement, l'accès des secours et les matériaux de la toiture.",
      },
    };
    return ret("verification", [fact], "danger météorologique de feu notable");
  },
};

const RULE_PLUIES = "territoire.climat-pluies";
const rulePluies: DecisionRule = {
  id: RULE_PLUIES,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "faible_precip_extremes";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_PLUIES, projectKeys: [key], outcome, facts, reason });

    if (preferenceWeight(p, key) < 2) return ret("not_applicable", [], "priorité non déclarée");
    const axe = f.climat?.pluieMax24h;
    if (!axe || axe.projete == null) return ret("uncertain", [], "cumul de pluie indisponible");
    if (!axe.notable) return ret("satisfied", [], "intensité sous le seuil de signalement");

    const fact: VerificationFact = {
      id: `${f.insee}:climat-pluies`, ruleId: RULE_PLUIES, sourceFactIds: ["climat.pluieMax24h"], module: "territoire",
      role: "verification", materialityTier: tierFor(p, key),
      topic: "les pluies intenses",
      // DISTINCT DE L'INONDATION, et les deux peuvent coexister sans se répéter : ici l'INTENSITÉ
      // climatique des précipitations (ce que le ciel déverse), là l'exposition du TERRITOIRE (ce que le
      // sol et les cours d'eau en font). Les actions le disent : le ruissellement d'un côté, l'état des
      // risques de l'autre.
      statement: `${trajectoirePhrase(axe, "Les épisodes de pluie les plus intenses, mesurés sur 24 heures,")}.`,
      signalConvention: `futur•e signale cette intensité à partir de ${axe.threshold} mm.`,
      limitation: LIMITATION_CLIMAT,
      evidence: [climatEvidence(f.nom, "pluieMax24h", axe)],
      action: {
        type: "verifier_sur_place",
        label: "Regardez où va l'eau autour de l'adresse",
        detail: "Pente du terrain, présence d'un sous-sol, réseaux d'évacuation, historique des dégâts des eaux.",
      },
    };
    return ret("verification", [fact], "pluies extrêmes notables");
  },
};


// ── LES RÈGLES DE SANTÉ ENVIRONNEMENTALE ─────────────────────────────────────
//
// Même grammaire que le climat : un risque n'est pas une incertitude. Le constat est ÉTABLI ; c'est sa
// portée décisionnelle qui s'instruit plus finement. Et même table de vérité, avec le même piège : une
// donnée absente n'est JAMAIS une bonne nouvelle.
//
// `faible_pression_agricole` N'EST PAS ICI, et c'est délibéré : aucun seuil défendable au grain commune,
// et le risque réel (la dérive de pulvérisation) dépend des PARCELLES voisines du logement. Il est vrai à
// une autre maille. cf. sante-facts.ts et ADR-0010.

const RULE_AIR = "territoire.sante-air";
const ruleAir: DecisionRule = {
  id: RULE_AIR,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "air_sain";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_AIR, projectKeys: [key], outcome, facts, reason });

    if (preferenceWeight(p, key) < 2) return ret("not_applicable", [], "priorité non déclarée");
    const air = f.sante?.air;
    if (!air) return ret("uncertain", [], "qualité de l'air indisponible");

    if (!air.notable) {
      // ATTENTION AU SENS DE CE `satisfied`. Il ne dit PAS « l'air est pur ici » : AUCUNE commune française
      // ne descend sous la recommandation OMS pour les particules fines (5 µg/m³ ; minimum national :
      // 5,6). Il dit « l'air ne dépasse aucun seuil sanitaire officiel ». La nuance entre les deux est
      // exactement ce que le cinquième rôle de fait (`mismatch`) devra savoir dire.
      return air.complet
        ? ret("satisfied", [], "aucun seuil sanitaire officiel dépassé")
        : ret("uncertain", [], "un polluant n'a pas pu être lu");
    }

    const bouts: string[] = [];
    if (air.no2 != null && air.no2 >= AIR_NO2_OMS) {
      bouts.push(`le dioxyde d'azote atteint ${air.no2.toFixed(1).replace(".", ",")} µg/m³ en moyenne annuelle, au-delà de la recommandation de l'Organisation mondiale de la santé (${AIR_NO2_OMS} µg/m³)`);
    }
    if (air.pm25 != null && air.pm25 >= AIR_PM25_UE_2030) {
      bouts.push(`les particules fines atteignent ${air.pm25.toFixed(1).replace(".", ",")} µg/m³, au-delà de la valeur limite européenne applicable en 2030 (${AIR_PM25_UE_2030} µg/m³)`);
    }

    const fact: VerificationFact = {
      id: `${f.insee}:sante-air`, ruleId: RULE_AIR, sourceFactIds: ["viv.pm25", "viv.no2"], module: "territoire",
      role: "verification", materialityTier: tierFor(p, key),
      topic: "la qualité de l'air",
      statement: `Sur cette commune, ${bouts.join(", et ")}.`,
      // LE GRAIN EST LA VRAIE LIMITE ICI, et il faut le dire : le dioxyde d'azote est le marqueur du
      // trafic, et il s'effondre à quelques dizaines de mètres d'un axe. Une moyenne communale ne dit rien
      // de la rue.
      limitation: "Cette moyenne est communale. Le dioxyde d'azote, marqueur du trafic, varie fortement d'une rue à l'autre : il chute de moitié à quelques dizaines de mètres d'un axe passant.",
      evidence: [{ factId: "viv.pm25", module: "territoire", label: `Air · ${f.nom}`, observedValue: air.pm25 != null ? `PM2,5 ${air.pm25.toFixed(1).replace(".", ",")} µg/m³` : undefined, grain: "commune", href: territoireHref }],
      // CE FAIT EST L'AIR, PAS LE BRUIT. Le spec du lot A2 lui attribuait « Vérifiez l'exposition du
      // logement au bruit routier » : sur une carte qui affiche « PM2,5 12,4 µg/m³ », l'étiquette se
      // décrocherait de la mesure qu'elle coiffe. Le geste, lui, reste le bon (se situer par rapport
      // aux axes), parce que le NO2 chute de moitié à quelques dizaines de mètres d'une voie passante.
      action: {
        type: "verifier_sur_place",
        label: "Situez le logement par rapport aux axes passants",
        detail: "Repérez la distance aux voies passantes et la façade sur laquelle donnent les chambres.",
      },
    };
    return ret("verification", [fact], "seuil sanitaire officiel dépassé");
  },
};

const RULE_BRUIT = "territoire.sante-bruit";
const ruleBruit: DecisionRule = {
  id: RULE_BRUIT,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "calme_sonore";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_BRUIT, projectKeys: [key], outcome, facts, reason });

    if (preferenceWeight(p, key) < 2) return ret("not_applicable", [], "priorité non déclarée");
    const b = f.sante?.bruit;
    if (!b?.lu) return ret("uncertain", [], "exposition sonore indisponible");
    // Une commune SANS source dominante n'est pas une commune non lue : elle est loin de toute
    // infrastructure bruyante, et c'est une bonne nouvelle qu'on a le droit de dire.
    if (!b.notable || b.source == null || b.distanceKm == null) {
      return ret("satisfied", [], "aucune infrastructure bruyante à portée");
    }

    const seuil = BRUIT_MAX_KM[b.source];
    const fact: VerificationFact = {
      id: `${f.insee}:sante-bruit`, ruleId: RULE_BRUIT, sourceFactIds: ["calmeSonore.sourceDominante", "calmeSonore.distanceKm"], module: "territoire",
      role: "verification", materialityTier: tierFor(p, key),
      topic: "le bruit des infrastructures",
      // LE FAIT EST ABSOLU (une infrastructure, une distance) ; le SEUIL est une convention de produit, et
      // elle est dite. Le score maison, lui, n'est jamais affiché : il n'est qu'un déclencheur.
      statement: `${cap(bruitEnPhrase(b.source, b.distanceKm))}. futur•e signale ce type de source à partir de ${distanceEnPhrase(seuil)}.`,
      // Ce qui rend cette vérification LÉGITIME : la donnée qui trancherait vraiment (les décibels à la
      // façade) existe, elle est publique, et nous ne pouvons pas la lire à la place du lecteur.
      limitation: "Cette distance est mesurée depuis le point de référence de la commune, pas depuis une adresse. Le bruit réellement perçu dépend de la façade, de l'étage, du relief et de l'isolation.",
      evidence: [{ factId: "calmeSonore", module: "territoire", label: `Bruit · ${f.nom}`, observedValue: `${BRUIT_LABEL_COURT[b.source]} à ${distanceEnPhrase(b.distanceKm)}`, grain: "commune", href: territoireHref }],
      action: {
        type: "verifier_sur_place",
        label: "Écoutez sur place, à plusieurs heures",
        detail: "La carte de bruit de la commune donne le fond ; le reste s'entend depuis le logement, fenêtres ouvertes.",
      },
    };
    return ret("verification", [fact], "infrastructure bruyante à portée");
  },
};

const RULE_INDUSTRIE = "territoire.sante-industrie";
const ruleIndustrie: DecisionRule = {
  id: RULE_INDUSTRIE,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "faible_exposition_industrielle";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_INDUSTRIE, projectKeys: [key], outcome, facts, reason });

    if (preferenceWeight(p, key) < 2) return ret("not_applicable", [], "priorité non déclarée");
    const i = f.sante?.industrie;
    if (!i?.lu) return ret("uncertain", [], "exposition industrielle indisponible");
    if (!i.notable || i.classe == null) return ret("satisfied", [], "aucun site industriel à risque à portée");

    const fact: VerificationFact = {
      id: `${f.insee}:sante-industrie`, ruleId: RULE_INDUSTRIE, sourceFactIds: ["expoIndustrielle.sourceDominante"], module: "territoire",
      role: "verification", materialityTier: tierFor(p, key),
      topic: "l'exposition industrielle",
      // LA CATÉGORIE EST LÉGALE, donc opposable, et le lecteur peut la retrouver sur Géorisques. Le score
      // maison (exposition hybride, rayon de 8 km) n'est qu'un déclencheur : il n'est jamais affiché.
      statement: `${cap(industrieEnPhrase(i.classe))} est recensé à proximité de cette commune. ${industrieGlose(i.classe)}`.trim(),
      limitation: "Cette exposition est lue dans un rayon autour du point de référence de la commune. La distance réelle depuis un logement, et le plan de prévention qui s'y applique, se vérifient à l'adresse.",
      evidence: [{ factId: "expoIndustrielle", module: "territoire", label: `Industrie · ${f.nom}`, grain: "commune", href: territoireHref }],
      action: {
        type: "obtenir_document",
        label: "Consultez l'état des risques applicable à l'adresse",
        detail: "Le plan de prévention des risques technologiques, s'il existe, précise ce qui s'applique autour du site (Géorisques).",
      },
    };
    return ret("verification", [fact], "site industriel à risque à portée");
  },
};

export const REGISTRY: DecisionRule[] = [
  // Les 11 contraintes dures, une règle par clé, toutes au-dessus de l'évaluateur PARTAGÉ avec le
  // comparateur. Le dossier n'en examinait que 3 (mer, taille, département).
  ...HARD_CONSTRAINT_RULES,
  ruleCompromis,
  // ruleConfort A DISPARU. Elle DÉSACTIVAIT `faible_chaleur` dès qu'une adresse était renseignée
  // (`f.hasAddress` -> not_applicable) : le critère cessait d'être examiné au moment précis où le dossier
  // devenait le plus riche, et le lecteur lisait « priorité non couverte » sur un rapport complet. Son
  // seul apport (inviter à renseigner une adresse) vit désormais dans l'ACTION de ruleChaleur, et
  // seulement quand il y a réellement quelque chose à affiner.
  ruleChaleur,
  ruleChaleurAmbiante,
  ruleFeu,
  rulePluies,
  ruleAir,
  ruleBruit,
  ruleIndustrie,
  ...MISMATCH_RULES,
  ...ALIGNMENT_RULES,
  ...ABSENCE_RULES,
  ...COAST_RULES,
  ...AGGLOMERATION_RULES,
  ruleInondation,
  ...LOGEMENT_RULES,
];

// L'ÉTAT SCANNABLE est une ÉTIQUETTE, pas une phrase : court (le lecteur le lit d'un coup d'œil, avant
// le constat) et sans point final. Optionnel : un fait sans état franc n'en porte pas.
function assertStatus(fact: { ruleId: string; status?: string }): void {
  if (fact.status === undefined) return;
  if (fact.status.length === 0 || fact.status.length > 32 || /[.!?]$/.test(fact.status)) {
    throw new Error(`[decision] ${fact.ruleId}: status trop long, vide ou ponctué (« ${fact.status} »)`);
  }
}

// Invariants : protègent toutes les futures règles. JETTE (fail-fast) en cas de violation.
// Les seuls critères dont un alignment peut porter une limitation (nuance MÉTHODOLOGIQUE de la mesure :
// climatologie ERA5-Land 1991-2020, douceur 1976-2005, distance mer à vol d'oiseau). Tout autre critère
// avec une limitation est un abus de portée.
const ALIGNMENT_LIMITATION_KEYS = new Set<string>(["ensoleillement_recherche", "douceur_climat", "proximite_mer"]);

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
      assertStatus(fact);
      // LA LIGNE D'ACTION EST UNE LIGNE. Elle tient sur la face de la carte, seule, et un libellé de
      // 117 caractères (l'exposition industrielle en portait un) y devenait un second paragraphe qui
      // rivalisait avec le constat. Le point final la ferait lire comme une phrase de plus : c'est un
      // repère, pas une phrase. Ce qu'il faut regarder concrètement vit dans `detail`, au dépliable.
      if (fact.action.label.length > 70 || /[.!?]$/.test(fact.action.label)) {
        throw new Error(`[decision] ${fact.ruleId}: action.label trop long ou ponctué (« ${fact.action.label} »)`);
      }
      break;
    case "mismatch": {
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      assertStatus(fact);
      // Le SUJET DU HEADLINE, la priorité du lecteur telle qu'elle se lit après un deux-points. Une
      // règle qui l'oublie ferait nommer au héros l'indicateur défavorable (« la distance à la mer »
      // là où le lecteur a demandé la proximité) : on le refuse ici plutôt qu'à l'écran.
      if (!fact.headlineSubject || fact.headlineSubject.trim().length === 0) {
        throw new Error(`[decision] ${fact.ruleId}: mismatch sans headlineSubject (la PRIORITÉ du lecteur, à lire après un deux-points)`);
      }
      if (fact.headlineSubject.length > 45 || /[.!?]/.test(fact.headlineSubject)) {
        throw new Error(`[decision] ${fact.ruleId}: headlineSubject trop long ou phrasé (« ${fact.headlineSubject} »)`);
      }
      const basis = fact.basis;
      if (basis.kind === "absolute_measure") {
        // On VALIDE la mesure, pas seulement son nom : cette garde protège tous les futurs producteurs de
        // MismatchFact, pas uniquement la règle mer (dont le classifieur garantit déjà la validité).
        if (!Number.isFinite(basis.value) || basis.value < 0) {
          throw new Error(`[decision] ${fact.ruleId}: mesure absolue invalide`);
        }
        if (basis.unit !== "km") {
          throw new Error(`[decision] ${fact.ruleId}: unité de mesure absolue inconnue (${basis.unit})`);
        }
        if (!basis.conventionId) {
          throw new Error(`[decision] ${fact.ruleId}: convention de mesure absente`);
        }
      } else if (basis.kind === "categorical_state") {
        if (!(AGGLOMERATION_CATEGORIES as readonly string[]).includes(basis.observedCategory)) {
          throw new Error(`[decision] ${fact.ruleId}: catégorie de taille inconnue (${basis.observedCategory})`);
        }
        if (!basis.conventionId) throw new Error(`[decision] ${fact.ruleId}: convention de catégorie absente`);
      } else if (basis.kind === "climate_threshold") {
        // Multivarié : au moins une mesure, chacune auditable (seuil + valeur projetée finis), et AU MOINS UNE
        // défavorable — un mismatch climatique sans axe défavorable serait un état que le moteur ne sait pas expliquer.
        if (basis.measures.length === 0) throw new Error(`[decision] ${fact.ruleId}: fondement climatique sans mesure`);
        if (!basis.conventionId) throw new Error(`[decision] ${fact.ruleId}: convention climatique absente`);
        for (const m of basis.measures) {
          if (!Number.isFinite(m.projectedValue) || !Number.isFinite(m.threshold)) {
            throw new Error(`[decision] ${fact.ruleId}: mesure climatique invalide (${m.key})`);
          }
        }
        if (!basis.measures.some((m) => m.isUnfavorable)) {
          throw new Error(`[decision] ${fact.ruleId}: mismatch climatique sans axe défavorable`);
        }
      } else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {
        throw new Error(`[decision] ${fact.ruleId}: basis de mismatch inconnu (${(basis as { kind: string }).kind})`);
      }
      if (!declaredPreferenceKeys(project).includes(fact.projectKey)) {
        throw new Error(`[decision] ${fact.ruleId}: mismatch sur une préférence non déclarée (${fact.projectKey})`);
      }
      break;
    }
    case "alignment": {
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (!fact.headlineSubject || fact.headlineSubject.trim().length === 0) {
        throw new Error(`[decision] ${fact.ruleId}: alignment sans headlineSubject (la PRIORITÉ du lecteur, à lire après un deux-points)`);
      }
      if (fact.headlineSubject.length > 45 || /[.!?]/.test(fact.headlineSubject)) {
        throw new Error(`[decision] ${fact.ruleId}: headlineSubject trop long ou phrasé (« ${fact.headlineSubject} »)`);
      }
      // LA LISTE BLANCHE des fondements probants : un positif ne s'affiche que si son fondement PROUVE la
      // correspondance. `named_absence` est EXCLU (contrairement au mismatch) — une absence de signal ne
      // prouve JAMAIS un positif. C'est le cœur de la doctrine du lot C : on matérialise une connaissance
      // établie, on ne fabrique pas de rassurance à partir d'un silence de source.
      const b = fact.basis;
      if (b.kind === "absolute_measure") {
        if (!Number.isFinite(b.value) || b.value < 0) throw new Error(`[decision] ${fact.ruleId}: mesure absolue invalide`);
        if (b.unit !== "km") throw new Error(`[decision] ${fact.ruleId}: unité de mesure absolue inconnue (${b.unit})`);
        if (!b.conventionId) throw new Error(`[decision] ${fact.ruleId}: convention de mesure absente`);
      } else if (b.kind === "categorical_state") {
        if (!(AGGLOMERATION_CATEGORIES as readonly string[]).includes(b.observedCategory)) {
          throw new Error(`[decision] ${fact.ruleId}: catégorie de taille inconnue (${b.observedCategory})`);
        }
        if (!b.conventionId) throw new Error(`[decision] ${fact.ruleId}: convention de catégorie absente`);
      } else if (b.kind !== "relative_position") {
        throw new Error(`[decision] ${fact.ruleId}: fondement d'alignment hors liste blanche (${(b as { kind: string }).kind})`);
      }
      // La `limitation` d'un alignment est UNIQUEMENT la nuance MÉTHODOLOGIQUE card-only héritée du critère
      // (période de référence). Jamais une limite de portée. On la borne aux deux seuls critères qui en
      // portent une, sinon une future règle glisserait une limite de résultat sous ce champ sans débat.
      if (fact.limitation && !ALIGNMENT_LIMITATION_KEYS.has(fact.projectKey)) {
        throw new Error(`[decision] ${fact.ruleId}: un alignment ne porte de limitation que pour une nuance méthodologique (${fact.projectKey})`);
      }
      if (!declaredPreferenceKeys(project).includes(fact.projectKey)) {
        throw new Error(`[decision] ${fact.ruleId}: alignment sur une préférence non déclarée (${fact.projectKey})`);
      }
      break;
    }
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
