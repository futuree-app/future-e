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
  CompromiseFact, VerificationFact, EvidenceRef,
} from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, preferenceWeight } from "./project-view.ts";
import { LOGEMENT_RULES } from "./logement-rules.ts";
import { HARD_CONSTRAINT_RULES } from "./hard-constraint-rules.ts";
import { MISMATCH_RULES } from "./mismatch-rules.ts";
import { ABSENCE_RULES } from "./absence-rules.ts";
import { COAST_RULES } from "./coast-rules.ts";
import { AGGLOMERATION_RULES } from "./agglomeration-rules.ts";
import { AGGLOMERATION_CATEGORIES } from "./agglomeration-facts.ts";
import { toCommuneAttributes } from "./module-facts-map.ts";
import {
  trajectoirePhrase, fmtClimat, CLIMAT_HORIZON_LABEL, type ClimatAxe,
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


// ── LES RÈGLES CLIMAT ────────────────────────────────────────────────────────
//
// UN RISQUE N'EST PAS UNE INCERTITUDE. Le constat est ÉTABLI (la trajectoire est mesurée) ; c'est sa
// PORTÉE DÉCISIONNELLE qui s'instruit à une échelle plus fine. On n'écrit donc jamais « le risque de
// fortes chaleurs est à vérifier » (il est mesuré), mais : voici ce que le climat fait ici, et voici ce
// qu'il faut aller regarder pour savoir ce que cela change pour vous.
//
// LA TABLE DE VÉRITÉ, et elle vaut pour les trois :
//   critère non déclaré (poids < 2)              -> not_applicable  (non examiné)
//   aucune valeur projetée lisible               -> uncertain       (non examiné : une donnée absente
//                                                                    n'est JAMAIS une exposition faible)
//   au moins un axe NOTABLE                      -> verification    (carte + chiffre + action)
//   tous les axes lus, aucun notable             -> satisfied       (silencieux, la COUVERTURE MONTE)
//   aucun notable MAIS un axe manquant           -> uncertain       (l'axe manquant pouvait être notable)
//
// LA CONVENTION DE SIGNALEMENT EST DITE DANS LE TEXTE (« à partir de 8 jours par an »), jamais appliquée
// en silence : c'est un seuil de SIGNALEMENT futur•e, pas une limite officielle de danger sanitaire. Et
// la phrase écrit l'opérateur qu'elle applique (le code teste `>=`, le texte dit « à partir de »).
//
// LA MATÉRIALITÉ SUIT LE POIDS DÉCLARÉ, jamais l'intensité seule : `structuring` si le lecteur a pesé le
// critère à 3, `secondary` s'il l'a posé à 2. JAMAIS `decision_critical` : une préférence n'est pas une
// condition non négociable, et le verdict ne doit pas basculer sur un souhait.

const climatEvidence = (nom: string, key: string, axe: ClimatAxe): EvidenceRef => ({
  factId: `climat.${key}`,
  module: "territoire",
  label: `Climat · ${nom}`,
  observedValue:
    axe.projete != null ? `${fmtClimat(axe.projete, axe.unit)} à l'horizon ${CLIMAT_HORIZON_LABEL}` : undefined,
  grain: "commune",
  href: territoireHref,
});

const tierFor = (p: UserProject, key: PreferenceKey): "structuring" | "secondary" =>
  preferenceWeight(p, key) >= 3 ? "structuring" : "secondary";

// La limitation est la MÊME pour les trois : le climat se lit au grain de la commune, et ce que le lecteur
// vivra dépend de son logement et de son adresse. Le dire, c'est ce qui rend la vérification utile.
const LIMITATION_CLIMAT = "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.";

const RULE_CHALEUR = "territoire.climat-chaleur";
const ruleChaleur: DecisionRule = {
  id: RULE_CHALEUR,
  module: "territoire",
  evaluate: (f, p): RuleEvaluation => {
    const key: PreferenceKey = "faible_chaleur";
    const ret = (outcome: RuleEvaluation["outcome"], facts: DecisionFact[], reason: string): RuleEvaluation =>
      ({ ruleId: RULE_CHALEUR, projectKeys: [key], outcome, facts, reason });

    if (preferenceWeight(p, key) < 2) return ret("not_applicable", [], "priorité non déclarée");
    const c = f.climat;
    if (!c) return ret("uncertain", [], "trajectoire climatique indisponible");

    const jours = c.joursTresChauds;
    const nuits = c.nuitsTropicales;

    // UNE DONNÉE MANQUANTE N'EST PAS UNE BONNE NOUVELLE. Si l'un des deux axes n'a pas été lu, on ne peut
    // pas conclure « rien à signaler » : l'axe manquant pouvait être celui qui déclenchait la réserve.
    if (!jours.notable && !nuits.notable) {
      const complet = jours.projete != null && nuits.projete != null;
      return complet
        ? ret("satisfied", [], "exposition sous le seuil de signalement")
        : ret("uncertain", [], "un axe de chaleur n'a pas pu être lu");
    }

    // LE CONSTAT SUIT CE QUI DÉCLENCHE. Nommer systématiquement les deux métriques alourdirait la phrase
    // quand une seule explique la réserve ; l'autre reste dans la preuve.
    const phrases: string[] = [];
    if (jours.notable) phrases.push(trajectoirePhrase(jours, "Les jours au-dessus de 35 °C"));
    // « Nuit tropicale » est un terme technique (Météo-France) : on le donne, puis on le traduit, sans
    // laisser une incise ouverte au milieu de la trajectoire.
    if (nuits.notable) {
      phrases.push(
        `${trajectoirePhrase(nuits, "Les nuits tropicales", { referenceCourte: jours.notable })}, ces nuits où la température ne descend pas sous 20 °C et où le corps ne récupère plus`,
      );
    }
    const seuils = [
      jours.notable ? `${jours.threshold} jours par an au-dessus de 35 °C` : null,
      nuits.notable ? `${nuits.threshold} nuits tropicales par an` : null,
    ].filter(Boolean).join(", ou de ");

    const fact: VerificationFact = {
      id: `${f.insee}:climat-chaleur`, ruleId: RULE_CHALEUR,
      sourceFactIds: ["climat.joursTresChauds", "climat.nuitsTropicales"], module: "territoire",
      role: "verification", materialityTier: tierFor(p, key),
      topic: `les fortes chaleurs à ${f.nom}`,
      statement: `${phrases.join(". ")}. futur•e signale cette exposition à partir de ${seuils}.`,
      limitation: LIMITATION_CLIMAT,
      evidence: [climatEvidence(f.nom, "joursTresChauds", jours), climatEvidence(f.nom, "nuitsTropicales", nuits)],
      // L'ACTION EST SPÉCIFIQUE, et c'est ce qui rend la vérification légitime : à l'échelle de la commune
      // le constat est établi, mais l'inconfort réellement vécu se joue sur le bâtiment.
      action: f.hasAddress
        ? { type: "verifier_sur_place", label: "Vérifiez le confort d'été : orientation, dernier étage, inertie des murs, protections solaires, possibilité de rafraîchir la nuit" }
        : { type: "renseigner_adresse", label: "Renseignez une adresse pour évaluer le confort d'été du logement" },
    };
    return ret("verification", [fact], "exposition à la chaleur notable");
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
      topic: `le danger d'incendie à ${f.nom}`,
      // L'INDICE MESURE UN DANGER MÉTÉOROLOGIQUE, pas la probabilité qu'un incendie survienne. La phrase ne
      // promet donc pas plus que la donnée ne sait dire.
      statement: `${trajectoirePhrase(axe, "Les jours où l'indice forêt-météo dépasse 40, seuil de danger météorologique très sévère,")}. futur•e signale cette exposition à partir de ${axe.threshold} jours par an.`,
      limitation: LIMITATION_CLIMAT,
      evidence: [climatEvidence(f.nom, "joursFeu", axe)],
      action: { type: "verifier_sur_place", label: "Vérifiez la végétation autour du terrain, l'éventuelle obligation légale de débroussaillement, l'accès des secours et les matériaux de la toiture" },
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
      topic: `les pluies intenses à ${f.nom}`,
      // DISTINCT DE L'INONDATION, et les deux peuvent coexister sans se répéter : ici l'INTENSITÉ
      // climatique des précipitations (ce que le ciel déverse), là l'exposition du TERRITOIRE (ce que le
      // sol et les cours d'eau en font). Les actions le disent : le ruissellement d'un côté, l'état des
      // risques de l'autre.
      statement: `${trajectoirePhrase(axe, "Les épisodes de pluie les plus intenses, mesurés sur 24 heures,")}. futur•e signale cette intensité à partir de ${axe.threshold} mm.`,
      limitation: LIMITATION_CLIMAT,
      evidence: [climatEvidence(f.nom, "pluieMax24h", axe)],
      action: { type: "verifier_sur_place", label: "Vérifiez le ruissellement autour de l'adresse : pente du terrain, sous-sol, réseaux d'évacuation, historique des dégâts des eaux" },
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
      topic: `la qualité de l'air à ${f.nom}`,
      statement: `Sur cette commune, ${bouts.join(", et ")}.`,
      // LE GRAIN EST LA VRAIE LIMITE ICI, et il faut le dire : le dioxyde d'azote est le marqueur du
      // trafic, et il s'effondre à quelques dizaines de mètres d'un axe. Une moyenne communale ne dit rien
      // de la rue.
      limitation: "Cette moyenne est communale. Le dioxyde d'azote, marqueur du trafic, varie fortement d'une rue à l'autre : il chute de moitié à quelques dizaines de mètres d'un axe passant.",
      evidence: [{ factId: "viv.pm25", module: "territoire", label: `Air · ${f.nom}`, observedValue: air.pm25 != null ? `PM2,5 ${air.pm25.toFixed(1).replace(".", ",")} µg/m³` : undefined, grain: "commune", href: territoireHref }],
      action: { type: "verifier_sur_place", label: "Regardez la position exacte du logement par rapport aux axes routiers, et la façade sur laquelle donnent les chambres" },
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
      topic: `le bruit des infrastructures à ${f.nom}`,
      // LE FAIT EST ABSOLU (une infrastructure, une distance) ; le SEUIL est une convention de produit, et
      // elle est dite. Le score maison, lui, n'est jamais affiché : il n'est qu'un déclencheur.
      statement: `${cap(bruitEnPhrase(b.source, b.distanceKm))}. futur•e signale ce type de source à partir de ${distanceEnPhrase(seuil)}.`,
      // Ce qui rend cette vérification LÉGITIME : la donnée qui trancherait vraiment (les décibels à la
      // façade) existe, elle est publique, et nous ne pouvons pas la lire à la place du lecteur.
      limitation: "Cette distance est mesurée depuis le point de référence de la commune, pas depuis une adresse. Le bruit réellement perçu dépend de la façade, de l'étage, du relief et de l'isolation.",
      evidence: [{ factId: "calmeSonore", module: "territoire", label: `Bruit · ${f.nom}`, observedValue: `${BRUIT_LABEL_COURT[b.source]} à ${distanceEnPhrase(b.distanceKm)}`, grain: "commune", href: territoireHref }],
      action: { type: "verifier_sur_place", label: "Consultez la carte de bruit stratégique de la commune, et allez écouter sur place à plusieurs heures, fenêtres ouvertes" },
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
      topic: `l'exposition industrielle à ${f.nom}`,
      // LA CATÉGORIE EST LÉGALE, donc opposable, et le lecteur peut la retrouver sur Géorisques. Le score
      // maison (exposition hybride, rayon de 8 km) n'est qu'un déclencheur : il n'est jamais affiché.
      statement: `${cap(industrieEnPhrase(i.classe))} est recensé à proximité de cette commune. ${industrieGlose(i.classe)}`.trim(),
      limitation: "Cette exposition est lue dans un rayon autour du point de référence de la commune. La distance réelle depuis un logement, et le plan de prévention qui s'y applique, se vérifient à l'adresse.",
      evidence: [{ factId: "expoIndustrielle", module: "territoire", label: `Industrie · ${f.nom}`, grain: "commune", href: territoireHref }],
      action: { type: "obtenir_document", label: "Consultez l'état des risques et le plan de prévention des risques technologiques applicables à l'adresse (Géorisques)" },
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
  ruleFeu,
  rulePluies,
  ruleAir,
  ruleBruit,
  ruleIndustrie,
  ...MISMATCH_RULES,
  ...ABSENCE_RULES,
  ...COAST_RULES,
  ...AGGLOMERATION_RULES,
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
    case "mismatch": {
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
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
      } else if (basis.kind !== "relative_position" && basis.kind !== "named_absence") {
        throw new Error(`[decision] ${fact.ruleId}: basis de mismatch inconnu (${(basis as { kind: string }).kind})`);
      }
      if (!declaredPreferenceKeys(project).includes(fact.projectKey)) {
        throw new Error(`[decision] ${fact.ruleId}: mismatch sur une préférence non déclarée (${fact.projectKey})`);
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
