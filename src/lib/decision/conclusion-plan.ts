// Le PLAN NARRATIF : ce que le déterministe a décidé, avant qu'un LLM n'ouvre la bouche (slice 2).
// Il porte la présence, l'ORDRE, les sources, la matière obligatoire et le texte de repli de chaque
// registre. L'IA reçoit ce plan et ne renvoie que { key, text }. Fonctions PURES, aucun LLM.
//
// La hiérarchie éditoriale des réserves (du plus grave au moins grave) :
//   1. verdict                     l'état de conclusion, borné au périmètre réellement examiné
//   2. unexamined_hard_constraints une condition ABSOLUE n'a pas pu être testée : elle diminue la
//                                  valeur du verdict, donc elle le suit immédiatement
//   3. reserves_found              ce qu'on a examiné et qui appelle un regard
//   4. uncovered_priorities        réduit la personnalisation, n'invalide pas le verdict
// Une contrainte dure non examinée et une préférence non couverte sont deux absences de couverture.
// Elles ne partagent JAMAIS le même bloc.
import type { DecisionFact, ConclusionState, MaterialityTier, UncoveredConstraint } from "./decision-fact.ts";
import type { ProjectPosture } from "../user-project.ts";
import type { CoverageLevel, Orientation } from "./criteria-registry.ts";

export type BlockKey = "verdict" | "unexamined_hard_constraints" | "reserves_found" | "uncovered_priorities";

export type NarrativeBlock = {
  key: BlockKey;
  fallbackText: string;       // le texte déterministe de CE registre, affichable seul
  sourceIds: string[];        // factIds / HardConstraintKey / PreferenceKey. JAMAIS produits par l'IA.
  requiredPhrases: string[];  // matière qui doit SURVIVRE à la rédaction, textuellement
  allowedNumbers: string[];   // les nombres VRAIS de ce registre, en chiffres ET en lettres
  maxChars: number;
  generable: boolean;         // false = déterministe, hors de portée du modèle
};

// Le fait saillant est DÉSIGNÉ par le déterministe, jamais élu par l'IA. `tied` existe parce que
// prendre le premier d'un tri à égalité transformerait un ordre de DÉCLARATION dans le registre en
// PRIORITÉ MÉTIER : si deux faits sont decision_critical, écrire « à commencer par le PPRN » ment.
export type LeadSelection =
  | { kind: "single"; factId: string; statement: string; materialityTier: MaterialityTier }
  | { kind: "tied"; factIds: string[]; materialityTier: MaterialityTier }
  | { kind: "none" };

export type VerdictTone = "critical" | "caution" | "neutral" | "positive";

export type ConclusionNarrativePlan = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  blocks: NarrativeBlock[];
  reservesCount: number; // faits AFFICHÉS (post-caps), jamais faits émis
  lead: LeadSelection;
  verdictLabel: string;   // le statut qui coiffe la carte, dérivé de la MÊME table que la phrase
  verdictTone: VerdictTone;
};

// Ce que l'assembleur fournit. Un `Dossier` ne peut pas être l'entrée : il PORTERA ce plan (cycle).
export type ConclusionPlanInput = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  shownFacts: DecisionFact[]; // les faits réellement affichés, après plafonnement des sections
  uncovered: UncoveredConstraint[];
  uncoveredPriorities: { key: string; label: string }[];
  establishedIncompatibility: { factId: string; statement: string } | null;
  // Les deux mesures du verdict (criteria-registry.ts), plus les comptes qui accordent ses phrases.
  coverage: CoverageLevel;
  orientation: Orientation;
  hasFavorable: boolean;     // au moins un critère examiné rend `favorable`
  favorableCount: number;    // combien : « plusieurs dimensions » exige >= 2, jamais un booléen
  majorReserveCount: number; // réserves AFFICHÉES structurantes/critiques
  reservesShown: number;     // réserves AFFICHÉES, tous tiers confondus
};

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
const RESERVE_ROLES = new Set<DecisionFact["role"]>(["verification", "compromise", "unknown"]);

// La matière obligatoire porte sur le NOYAU du libellé, pas sur sa grammaire. Les libellés sont
// écrits pour une liste (« la proximité de la mer »), mais une phrase les décline (« votre exigence
// DE proximité de la mer »). Exiger l'article rejetterait une reformulation parfaitement fidèle :
// c'est ce que la sonde a montré, 3 fois sur 3. On exige donc « proximité de la mer », ce qu'aucune
// tournure honnête ne peut perdre, et ce qu'une déformation (« la proximité du littoral ») perd.
function coreLabel(label: string): string {
  return label.replace(/^(les |le |la |l'|un |une |des |du |de la |d')/i, "").trim();
}

// Les nombres VRAIS d'un registre, sous les deux formes qu'une phrase française peut prendre.
// L'invariant que le slice 2 doit tenir n'est pas « aucun nombre absent du repli », c'est « aucun
// nombre FAUX » : « Deux de vos priorités » est exact et bien écrit quand il y en a deux, et le
// rejeter censurerait une tournure naturelle (la sonde l'a produite 2 fois sur 3). Un « Trois
// priorités » inventé, lui, reste rejeté : seul le compte réel est déclaré ici.
const NUMBER_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
function numberForms(n: number): string[] {
  const word = NUMBER_WORDS[n];
  return word ? [String(n), word] : [String(n)];
}

function reserves(facts: DecisionFact[]): DecisionFact[] {
  return facts.filter((f) => RESERVE_ROLES.has(f.role));
}

// Les `statement` des règles ne finissent pas tous par un point. Le repli est du texte AFFICHÉ : il ne
// peut pas se permettre une phrase qui s'arrête net.
function endWithPeriod(s: string): string {
  return /[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`;
}

export function selectLead(shownFacts: DecisionFact[]): LeadSelection {
  const rs = reserves(shownFacts);
  if (rs.length === 0) return { kind: "none" };
  const best = Math.min(...rs.map((f) => TIER_ORDER[f.materialityTier]));
  // secondary ne couronne rien : il n'y a alors rien d'assez matériel pour être cité.
  if (best === TIER_ORDER.secondary) return { kind: "none" };
  const top = rs.filter((f) => TIER_ORDER[f.materialityTier] === best);
  if (top.length === 1) {
    const f = top[0]!;
    return { kind: "single", factId: f.id, statement: f.statement, materialityTier: f.materialityTier };
  }
  return { kind: "tied", factIds: top.map((f) => f.id), materialityTier: top[0]!.materialityTier };
}

type Verdict = { label: string; text: string; tone: VerdictTone };

// L'ACCORD EN NOMBRE est calculé, jamais laissé à une formule générique : « 1 points structurants »
// détruit en un caractère la confiance que tout le reste essaie de construire.
function points(n: number, adj: string, verb: string): string {
  return n > 1 ? `${n} points ${adj}s ${verb}nt` : `${n} point ${adj} ${verb}`;
}

// LA TABLE DE VÉRITÉ DU VERDICT (spec 2.1 §5). Déterministe, mot pour mot, JAMAIS générée.
//
// « Aucune contrainte n'est contredite » décrivait l'absence d'un problème. Le lecteur, lui, demande si
// ce lieu lui convient. Le déterministe gagne donc le droit de répondre « ce lieu correspond », à une
// condition : pouvoir le PROUVER. La preuve tient en deux mesures (couverture × orientation) et un
// couperet (une contrainte dure non examinée interdit la couverture élevée).
//
// LE SUJET DE LA PHRASE EST LE LIEU, OU LE LECTEUR. JAMAIS LE MOTEUR : « les éléments examinés
// indiquent que… » ferait entendre futur•e commenter son propre travail au lieu de répondre. Seule
// exception, celle où l'objet de la phrase EST notre incapacité (une donnée manque) : là, s'effacer
// serait de la lâcheté, pas de l'élégance.
//
// Et AUCUNE PHRASE NE PROMET UN POSITIF QUI N'EXISTE PAS : sans `hasFavorable`, « ce lieu semble bien
// correspondre » s'écrirait sur un dossier dont tous les critères examinés sont des réserves ; sans
// `favorableCount`, « plusieurs dimensions » s'écrirait sur un unique critère satisfait.
function verdict(input: ConclusionPlanInput): Verdict {
  if (input.conclusionState === "project_not_structured") {
    return {
      label: "À préciser", tone: "neutral",
      text: "Décrivez votre projet pour mettre ce lieu en regard de ce qui compte pour vous.",
    };
  }
  if (input.conclusionState === "insufficient_evidence") {
    return {
      label: "Impossible de conclure", tone: "neutral",
      text: "Une donnée déterminante manque encore pour conclure sur ce lieu.",
    };
  }
  if (input.orientation === "incompatible") {
    return {
      label: "Condition non respectée", tone: "critical",
      text: `L'une de vos conditions non négociables n'est pas respectée ici : ${input.establishedIncompatibility?.statement ?? ""}`,
    };
  }
  if (input.coverage === "none") {
    return {
      label: "Lecture non disponible", tone: "neutral",
      // « ne peut pas encore » et non « n'a pas encore pu » : le présent parle de l'état du dossier,
      // le passé composé raconterait un échec du moteur.
      text: "Ce lieu ne peut pas encore être évalué au regard de vos critères.",
    };
  }

  const n = input.majorReserveCount;
  const r = input.reservesShown;
  const reste = r > 1 ? `${r} points restent` : `${r} point reste`;
  const plusieurs = input.favorableCount >= 2;

  if (input.coverage === "high") {
    if (input.orientation === "favorable") {
      return {
        label: "Bonne correspondance", tone: "positive",
        text: "Ce lieu semble bien correspondre à votre projet.",
      };
    }
    if (input.orientation === "minor_reserves") {
      return input.hasFavorable
        ? {
            label: "Correspondance favorable", tone: "positive",
            text: `Ce lieu semble bien correspondre à votre projet. ${reste} à examiner.`,
          }
        : {
            label: "Correspondance à confirmer", tone: "neutral",
            text: `La correspondance avec votre projet reste à confirmer : ${reste} à examiner.`,
          };
    }
    if (!input.hasFavorable) {
      return {
        label: "Correspondance à nuancer", tone: "caution",
        text: `${points(n, "structurant", "empêche")} encore de considérer ce lieu comme une bonne correspondance avec votre projet.`,
      };
    }
    return {
      label: "Correspondance à nuancer", tone: "caution",
      text: plusieurs
        ? `Ce lieu répond à plusieurs dimensions de votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`
        : `Ce lieu présente des éléments favorables pour votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`,
    };
  }

  // coverage === "partial"
  if (input.orientation === "favorable") {
    return {
      label: "Signaux favorables", tone: "neutral",
      text: "Ce lieu va dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète.",
    };
  }
  if (input.orientation === "minor_reserves") {
    return input.hasFavorable
      ? {
          label: "Correspondance à confirmer", tone: "neutral",
          text: "Ce lieu va plutôt dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète.",
        }
      : {
          label: "Correspondance à confirmer", tone: "neutral",
          text: `La lecture reste incomplète, et ${reste} à examiner avant de pouvoir conclure sur ce lieu.`,
        };
  }
  return {
    label: "Lecture encore partielle", tone: "caution",
    text: `Il est encore trop tôt pour dire que ce lieu correspond à votre projet : la lecture reste incomplète et ${points(n, "structurant", "demande")} attention.`,
  };
}

export function buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan {
  const v = verdict(input);

  // LE VERDICT N'EST JAMAIS GÉNÉRÉ. C'est la phrase qui peut renverser une décision perçue : un modèle
  // qui reformulerait « la lecture reste incomplète » en « ce lieu vous correspond » mentirait sur ce
  // qui a été établi, et aucune validation structurelle ne le verrait passer. Il le reçoit en lecture
  // seule, pour que les registres suivants s'y articulent. Le déterministe, lui, a le droit de dire la
  // correspondance : il la PROUVE (couverture × orientation).
  const blocks: NarrativeBlock[] = [{
    key: "verdict",
    fallbackText: v.text,
    sourceIds: input.establishedIncompatibility ? [input.establishedIncompatibility.factId] : [],
    requiredPhrases: [],
    allowedNumbers: [],
    maxChars: 320,
    generable: false,
  }];

  // Un projet non structuré n'est pas une analyse, c'est une invite. Aucun autre registre.
  if (input.conclusionState === "project_not_structured") {
    return {
      scope: input.scope, conclusionState: input.conclusionState, posture: input.posture,
      blocks, reservesCount: 0, lead: { kind: "none" },
      verdictLabel: v.label, verdictTone: v.tone,
    };
  }

  if (input.uncovered.length > 0) {
    blocks.push({
      key: "unexamined_hard_constraints",
      fallbackText: `Nous n'avons pas encore examiné, à ce grain : ${input.uncovered.map((u) => u.label).join(", ")}.`,
      sourceIds: input.uncovered.map((u) => u.key),
      // Chaque contrainte doit SURVIVRE à la rédaction : « une condition importante reste à examiner »
      // ferait disparaître la gare, sans qu'aucune autre validation ne s'en aperçoive.
      requiredPhrases: input.uncovered.map((u) => coreLabel(u.label)),
      allowedNumbers: numberForms(input.uncovered.length),
      maxChars: 260,
      generable: true,
    });
  }

  // LE DÉCOMPTE DES RÉSERVES A CHANGÉ DE FONCTION : il est devenu l'intertitre des cartes qui suivent
  // (« Les 4 points à examiner avant de décider »). Ce registre ne garde donc que ce que le décompte ne
  // dit pas : le POIDS RELATIF. En `lead.none`, il n'aurait plus rien à dire, et il n'existe pas.
  //
  // `tied` ne veut PAS dire « toutes les réserves pèsent pareil » : il dit que plusieurs faits partagent
  // le rang MAXIMAL. Écrire « quatre points d'un poids comparable » quand deux dominent et deux sont
  // secondaires serait faux. On compte lead.factIds, jamais rs.length.
  const rs = reserves(input.shownFacts);
  const lead = selectLead(input.shownFacts);
  if (lead.kind === "single") {
    blocks.push({
      key: "reserves_found",
      // Deux phrases, pas un deux-points : le constat est déjà une phrase, avec sa majuscule. « Un point
      // pèse plus que les autres : Le logement porte… » mettrait une capitale au milieu d'une phrase.
      fallbackText: `Un point pèse plus que les autres. ${endWithPeriod(lead.statement)}`,
      sourceIds: [lead.factId],
      // Aucune matière obligatoire : exiger le `statement` mot pour mot exigerait une COPIE, ce
      // qu'aucun rédacteur n'écrit, et la sonde l'a rejeté 3 fois sur 3. La garantie tient sans :
      // le modèle ne reçoit QUE le lead, il lui est structurellement impossible d'en couronner un autre.
      requiredPhrases: [],
      allowedNumbers: [],
      maxChars: 300,
      generable: true,
    });
  } else if (lead.kind === "tied") {
    const n = lead.factIds.length;
    blocks.push({
      key: "reserves_found",
      fallbackText: `${n} points de même importance arrivent en tête : aucun ne domine à lui seul.`,
      sourceIds: lead.factIds,
      requiredPhrases: [String(n)],
      allowedNumbers: numberForms(n),
      maxChars: 300,
      generable: true,
    });
  }

  if (input.uncoveredPriorities.length > 0) {
    const top = input.uncoveredPriorities.slice(0, 3);
    blocks.push({
      key: "uncovered_priorities",
      fallbackText: `Vos priorités concernant ${top.map((p) => p.label).join(", ")} ne sont pas encore couvertes dans cette synthèse.`,
      sourceIds: top.map((p) => p.key),
      requiredPhrases: top.map((p) => coreLabel(p.label)),
      allowedNumbers: numberForms(top.length),
      maxChars: 260,
      generable: true,
    });
  }

  return {
    scope: input.scope,
    conclusionState: input.conclusionState,
    posture: input.posture,
    blocks,
    reservesCount: rs.length,
    lead,
    verdictLabel: v.label,
    verdictTone: v.tone,
  };
}

// LA RÈGLE : on appelle l'IA seulement quand plusieurs éléments DÉJÀ HIÉRARCHISÉS doivent être
// ARTICULÉS. Jamais pour maquiller un dossier pauvre : reformuler brillamment « verdict + vos priorités
// ne sont pas couvertes » ne ferait que rendre élégante une absence de couverture.
//
// Deux repêchages vivaient ici (reservesCount >= 3, et « une réserve domine ») : ils existaient parce
// que le registre des réserves portait alors le DÉCOMPTE, donc de la matière même sans autre registre.
// Le décompte est parti dans l'intertitre des cartes ; ces repêchages désignaient un bloc qui n'existe
// plus dans ces cas. Un seul registre rédigeable n'articule rien : le déterministe le dit très bien.
export function shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean {
  if (plan.conclusionState === "project_not_structured") return false;
  return plan.blocks.filter((b) => b.generable).length >= 2;
}
