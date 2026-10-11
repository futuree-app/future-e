// FUT-87 · CE QUE LE PROTOTYPE « MA DÉCISION » AFFICHE, LU DANS LE DOSSIER DU MOTEUR.
//
// Pur et testé (`lecture-dossier.test.ts`). Ce module ne fait que RANGER : il prend les sections de
// la minute (`sectionsDeLaMinute`, la sélection que le verdict annonce) et le plan narratif, et rend
// une structure à plat que la mise en page consomme. Aucun texte n'y est écrit, aucun verdict
// recalculé, aucune priorité inventée. Les contradictions éventuelles du moteur (titre favorable
// au-dessus d'écarts, FUT-54) restent donc visibles telles quelles : leur correction relève du
// moteur, pas de la direction artistique.
import type { Dossier, DossierCard, DossierSection, DecisionFact, EvidenceRef, VerificationActionType } from "../../../lib/decision/decision-fact.ts";
import type { ConclusionNarrativePlan } from "../../../lib/decision/conclusion-plan.ts";
import { sectionsDeLaMinute, sectionHorsPriorites, sectionMixte, carteHorsPriorites, conditionPorteeParLeBloc } from "../../../lib/decision/dossier-view.ts";
import { dossierAnchorId } from "../../../lib/decision/dossier-anchors.ts";

export type GrainLu = EvidenceRef["grain"];
export type PreuveLue = { libelle: string; valeur?: string; grain: GrainLu; href?: string; date?: string };
export type GesteLu = { libelle: string; type?: VerificationActionType; detail?: string };
export type CoteLu = { libelle: string; enonce: string; nuance?: string; statut?: string; preuves: PreuveLue[]; geste?: GesteLu };

/**
 * LE FONDEMENT DESSINABLE d'un fait, quand le moteur en porte un. Ce sont les nombres mêmes qui ont
 * décidé du constat (`basis`), jamais une mesure reconstituée : une position parmi les communes de
 * France, ou des valeurs projetées face à leur seuil de signalement.
 */
export type FondementLu =
  | { type: "rang"; bas: number; haut: number }
  | { type: "seuils"; horizon: number; mesures: { cle: "days_over_35" | "tropical_nights" | "fire_weather_days"; valeur: number; seuil: number; defavorable: boolean }[] };

export type EntreeLue = {
  /** L'ancre de la carte, la même que le dossier de production (les gestes prioritaires y renvoient). */
  ancre: string;
  /** Le rôle du fait, ou la nature de la composition. Gouverne seulement la teinte du trait. */
  nature: string;
  /** Le sujet : la priorité du lecteur, ou le titre de la composition. Absent pour les faits qui n'en ont pas. */
  sujet?: string;
  statut?: string;
  enonce: string;
  nuance?: string;
  grain: GrainLu | null;
  preuves: PreuveLue[];
  /** Les sources nommées sans valeur observée (« Source : … »), rendues en marge. */
  sources: string[];
  geste?: GesteLu;
  cotes: CoteLu[];
  /** Ce que la carte de production plie dans « Données et limites ». */
  limites: string[];
  /** Le fait ne répond à aucune priorité déclarée (constat apporté par futur•e). */
  horsPriorites: boolean;
  fondement?: FondementLu;
};

export type SectionLue = {
  cle: DossierSection["key"];
  titre: string;
  intro?: string;
  entrees: EntreeLue[];
};

export type LectureDecision = {
  commune: string;
  portee: ConclusionNarrativePlan["scope"];
  verdict: {
    etiquette: string;
    ton: ConclusionNarrativePlan["verdictTone"];
    titre: string;
    detail?: string;
  };
  /** Une condition posée par le lecteur et non examinée : elle réduit la portée du verdict. */
  conditionNonExaminee?: string;
  /** Les priorités qu'aucune règle ne couvre (limite du produit). */
  nonCouvert?: string;
  /** Les preuves de la condition portée par le bloc de tête, quand sa section s'efface. */
  preuvesDuVerdict: PreuveLue[];
  /** « À contrôler en priorité » (ou « ensuite ») : les gestes retenus par le plan, dans son ordre. */
  priorites: { titre: string; gestes: { libelle: string; ancre: string }[] } | null;
  sections: SectionLue[];
  conditionsSansCarte: { cle: string; libelle: string; cause: "a_confirmer" | "ne_pas_mesurer" | "donnee_absente" }[];
};

// Les deux seules phrases que la production ajoute elle-même au-dessus d'une section
// (`DossierDecisionSection`, SECTION_INTRO). Reprises mot pour mot.
const SECTION_INTRO: Partial<Record<DossierSection["key"], string>> = {
  verifications: "Au-delà de vos priorités, ces constats sont établis pour ce lieu.",
  unknowns: "Au-delà de vos priorités, ces données n'ont pas encore pu être lues ici.",
};

const preuve = (e: EvidenceRef): PreuveLue => ({
  libelle: e.label,
  ...(e.observedValue ? { valeur: e.observedValue } : {}),
  grain: e.grain,
  ...(e.href ? { href: e.href } : {}),
  ...(e.observedAt ? { date: e.observedAt } : {}),
});

/** Les preuves AVEC valeur observée vont en marge comme preuves ; les autres deviennent des sources nommées. */
function trier(refs: EvidenceRef[]): { preuves: PreuveLue[]; sources: string[] } {
  const vues = new Set<string>();
  const preuves: PreuveLue[] = [];
  const sources: string[] = [];
  for (const e of refs) {
    if (e.observedValue) {
      const cle = `${e.label}|${e.observedValue}`;
      if (vues.has(cle)) continue;
      vues.add(cle);
      preuves.push(preuve(e));
    } else if (!sources.includes(e.label)) {
      sources.push(e.label);
    }
  }
  return { preuves, sources };
}

const premierGrain = (refs: EvidenceRef[]): GrainLu | null => refs[0]?.grain ?? null;

function geste(a: { label: string; type?: VerificationActionType; detail?: string } | undefined): GesteLu | undefined {
  return a ? { libelle: a.label, ...(a.type ? { type: a.type } : {}), ...(a.detail ? { detail: a.detail } : {}) } : undefined;
}

function fondementDe(f: DecisionFact): FondementLu | undefined {
  if (f.role !== "alignment" && f.role !== "mismatch") return undefined;
  const b = f.basis;
  if (b.kind === "relative_position") return { type: "rang", bas: b.rankLow, haut: b.rankHigh };
  if (b.kind === "climate_threshold") {
    return {
      type: "seuils", horizon: b.horizon,
      mesures: b.measures.map((m) => ({ cle: m.key, valeur: m.projectedValue, seuil: m.threshold, defavorable: m.isUnfavorable })),
    };
  }
  return undefined;
}

function lireFait(f: DecisionFact, horsPriorites: boolean): EntreeLue {
  const refs = f.role === "compromise" ? f.sides.flatMap((x) => x.evidence) : f.evidence;
  const { preuves, sources } = trier(refs);
  const action = f.role === "verification" || f.role === "unknown" || f.role === "condition_check" ? f.action : undefined;
  const limites: string[] = [];
  if (action?.detail) limites.push(action.detail);
  if (f.role === "verification" && f.signalConvention) limites.push(f.signalConvention);
  if ((f.role === "condition_check" || f.role === "condition_met" || f.role === "incompatibility") && f.senseRetenu) limites.push(f.senseRetenu);
  if (f.role === "condition_check" && f.whyNotDecided) limites.push(f.whyNotDecided);
  const sujet = "headlineSubject" in f && typeof f.headlineSubject === "string" ? f.headlineSubject : undefined;
  const statut = "status" in f && typeof f.status === "string" ? f.status : undefined;
  const nuance = (f.role === "incompatibility" || f.role === "verification" || f.role === "mismatch") ? f.limitation : undefined;
  // UNE CORRESPONDANCE SE LIT EN DEUX LIGNES, comme en production : la priorité, puis la phrase de
  // rang que la règle a écrite (`faceStatement`). L'énoncé autonome (`statement`) n'y est pas montré.
  const enonce = f.role === "alignment" ? f.faceStatement : f.statement;
  return {
    ancre: dossierAnchorId(f.id),
    nature: f.role,
    ...(sujet ? { sujet } : {}),
    ...(statut ? { statut } : {}),
    enonce,
    ...(nuance ? { nuance } : {}),
    grain: premierGrain(refs),
    preuves,
    sources,
    ...(action ? { geste: geste(action) } : {}),
    cotes: f.role === "compromise"
      ? f.sides.map((x) => ({ libelle: "", enonce: x.statement, preuves: trier(x.evidence).preuves }))
      : [],
    limites,
    horsPriorites,
    ...(fondementDe(f) ? { fondement: fondementDe(f)! } : {}),
  };
}

function lireCarte(dossier: Dossier, card: DossierCard, horsPriorites: (c: DossierCard) => boolean): EntreeLue {
  if (card.kind === "fact") return lireFait(card.fact, horsPriorites(card));
  const c = card.composition;
  const absorbes = dossier.absorbedFacts.filter((f) => c.absorbedFactIds.includes(f.id));
  const grainAbsorbe = absorbes[0] ? premierGrain(absorbes[0].role === "compromise" ? absorbes[0].sides.flatMap((x) => x.evidence) : absorbes[0].evidence) : null;
  const base = { ancre: dossierAnchorId(c.id), nature: c.kind, sujet: c.title, horsPriorites: horsPriorites(card) };
  if (c.kind === "tradeoff") {
    const cote = (x: typeof c.favorableSide): CoteLu => ({
      libelle: x.label, enonce: x.statement, preuves: trier(x.evidence).preuves,
      ...(x.limitation ? { nuance: x.limitation } : {}), ...(x.status ? { statut: x.status } : {}),
      ...(x.action ? { geste: geste(x.action) } : {}),
    });
    return { ...base, enonce: c.summary, grain: grainAbsorbe, preuves: [], sources: [], cotes: [cote(c.favorableSide), cote(c.unfavorableSide)], limites: [] };
  }
  if (c.kind === "grouped_verification") {
    return {
      ...base, enonce: c.summary, grain: grainAbsorbe, preuves: [], sources: [],
      cotes: c.items.map((x) => ({
        libelle: x.label, enonce: x.statement, preuves: trier(x.evidence).preuves,
        ...(x.limitation ? { nuance: x.limitation } : {}), ...(x.status ? { statut: x.status } : {}),
        ...(x.action ? { geste: geste(x.action) } : {}),
      })),
      limites: c.items.flatMap((x) => (x.action?.detail ? [x.action.detail] : [])),
    };
  }
  if (c.kind === "mismatch_with_action") {
    const { preuves, sources } = trier(c.evidence);
    const f0 = absorbes.map(fondementDe).find(Boolean);
    return {
      ...(f0 ? { fondement: f0 } : {}),
      ...base, enonce: c.summary, ...(c.limitation ? { nuance: c.limitation } : {}),
      grain: premierGrain(c.evidence) ?? grainAbsorbe, preuves, sources, geste: geste(c.action), cotes: [],
      limites: c.action.detail ? [c.action.detail] : [],
    };
  }
  // shared_evidence : un état observé, plusieurs conséquences sur les priorités du lecteur.
  const { preuves, sources } = trier(c.sharedEvidence);
  return {
    ...base, enonce: c.summary, grain: premierGrain(c.sharedEvidence) ?? grainAbsorbe, preuves, sources,
    cotes: c.consequences.map((x) => ({ libelle: "", enonce: x.statement, ...(x.limitation ? { nuance: x.limitation } : {}), preuves: [] })),
    limites: [],
  };
}

export function lireDossier(dossier: Dossier): LectureDecision {
  const plan = dossier.narrativePlan;
  const bloc = (k: string) => plan.blocks.find((b) => b.key === k)?.fallbackText;
  const condition = conditionPorteeParLeBloc(dossier);
  const control = plan.priorityControl;
  const suiteDuHeros = plan.verdict.headline.consumedFrom === "reserves";
  // Mêmes conditions d'affichage que `ConclusionBlock` : pas de geste sous un verdict critique.
  const priorites = control && control.actions.length > 0 && plan.verdictTone !== "critical"
    ? {
        titre: suiteDuHeros ? "À contrôler ensuite" : "À contrôler en priorité",
        gestes: control.actions.map((a) => ({ libelle: a.label, ancre: dossierAnchorId(a.anchorId) })),
      }
    : null;
  return {
    commune: plan.communeNom,
    portee: plan.scope,
    verdict: {
      etiquette: plan.verdictLabel,
      ton: plan.verdictTone,
      titre: plan.verdict.headline.text,
      ...((bloc("verdict") ?? plan.verdict.detail) ? { detail: bloc("verdict") ?? plan.verdict.detail } : {}),
    },
    ...(bloc("unexamined_hard_constraints") ? { conditionNonExaminee: bloc("unexamined_hard_constraints")! } : {}),
    ...(bloc("uncovered_priorities") ? { nonCouvert: bloc("uncovered_priorities")! } : {}),
    preuvesDuVerdict: condition ? trier(condition.evidence).preuves : [],
    priorites,
    sections: sectionsDeLaMinute(dossier).map((s) => ({
      cle: s.key,
      titre: s.title,
      ...(SECTION_INTRO[s.key] && sectionHorsPriorites(dossier, s) ? { intro: SECTION_INTRO[s.key]! } : {}),
      // Même règle que la production : dans une section MIXTE seulement, chaque constat apporté par
      // futur•e se signale lui-même (`carteHorsPriorites`).
      entrees: s.cards.map((c) => lireCarte(dossier, c, sectionMixte(dossier, s) ? carteHorsPriorites(dossier) : () => false)),
    })),
    conditionsSansCarte: (dossier.criteria.openConditions ?? [])
      .filter((c) => c.cause !== "a_confirmer")
      .map((c) => ({ cle: c.key, libelle: c.label, cause: c.cause })),
  };
}
