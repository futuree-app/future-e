// FUT-87 · CE QUE LE PROTOTYPE « MA DÉCISION » AFFICHE, LU DANS LE DOSSIER DU MOTEUR.
//
// Pur et testé (`lecture-dossier.test.ts`). Ce module ne fait que RANGER : il prend les sections de
// la minute (`sectionsDeLaMinute`, la sélection que le verdict annonce) et le plan narratif, et rend
// une structure à plat que la mise en page consomme. Aucun texte n'y est écrit, aucun verdict
// recalculé, aucune priorité inventée. Les contradictions éventuelles du moteur (titre favorable
// au-dessus d'écarts, FUT-54) restent donc visibles telles quelles : leur correction relève du
// moteur, pas de la direction artistique.
//
// LA PROVENANCE NE SE SIMPLIFIE PAS (revue V2, 11/10/2026). La V1 réduisait une preuve sans valeur
// observée à son libellé : son lien, sa cible, son grain et sa date disparaissaient. Et un constat
// prenait le grain de sa PREMIÈRE preuve, alors qu'une composition peut mêler la commune et
// l'adresse. Désormais chaque `EvidenceRef` des cartes de la minute survit entière, avec ou sans
// valeur, et un constat porte TOUS ses grains, dans l'ordre où ses preuves les citent.
import type {
  Dossier, DossierCard, DossierSection, DecisionFact, EvidenceRef, VerificationActionType,
} from "../../lib/decision/decision-fact.ts";
import type { EvidenceTargetKey } from "../../lib/decision/evidence-targets.ts";
import type { CompositionSide } from "../../lib/decision/fact-composition.ts";
import type { ConclusionNarrativePlan } from "../../lib/decision/conclusion-plan.ts";
import {
  sectionsDeLaMinute, sectionHorsPriorites, sectionMixte, carteHorsPriorites, conditionPorteeParLeBloc,
  factsNonNarresParLaFace,
} from "../../lib/decision/dossier-view.ts";
import { dossierAnchorId } from "../../lib/decision/dossier-anchors.ts";
import { echelleDeLaPreuve, ORDRE_ECHELLES, NOM_ECHELLE, type Echelle } from "../../lib/decision/echelles.ts";

export type GrainLu = EvidenceRef["grain"];

/** Une preuve, telle que le moteur l'a émise : rien n'est retiré, seuls les noms changent. */
export type PreuveLue = {
  libelle: string;
  /** La valeur observée. Absente : la preuve est une SOURCE nommée, pas une mesure. */
  valeur?: string;
  grain: GrainLu;
  href?: string;
  /** La cible de navigation de la preuve (`evidenceHref` en fait un lien vers la carte visée). */
  cible?: EvidenceTargetKey;
  /** La date d'observation de la source (snapshot ou lecture directe). */
  date?: string;
  mode?: EvidenceRef["sourceMode"];
};
export type GesteLu = { libelle: string; type?: VerificationActionType; detail?: string };
export type CoteLu = {
  libelle: string; enonce: string; nuance?: string; statut?: string;
  preuves: PreuveLue[]; sources: PreuveLue[]; geste?: GesteLu;
};

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
  /** Tous les grains des preuves de la carte, dédoublonnés, dans l'ordre où elles les citent. */
  grains: GrainLu[];
  /**
   * Les échelles de lecture que la carte touche, selon la projection du moteur (`echelleDeLaPreuve`) :
   * une distance mesurée depuis l'adresse décrit le quartier, pas le logement. Distinct de `grains`,
   * qui dit l'ancre de chaque preuve.
   */
  echelles: Echelle[];
  /** Les preuves portant une valeur observée. */
  preuves: PreuveLue[];
  /** Les preuves sans valeur : des sources nommées, avec leur lien, leur grain et leur date. */
  sources: PreuveLue[];
  geste?: GesteLu;
  cotes: CoteLu[];
  /** Ce que la carte de production plie dans « Données et limites » (les deux zones, dans l'ordre). */
  limites: string[];
  /** Zone « À vérifier » de `MethodDetails` : le détail du geste. */
  aVerifier: string[];
  /** Zone « Méthode du signal » de `MethodDetails` : convention de signalement, sens retenu, raison. */
  methode: string[];
  /** Le fait ne répond à aucune priorité déclarée (constat apporté par futur•e). */
  horsPriorites: boolean;
  fondement?: FondementLu;
  /**
   * Les faits absorbés par une composition et que sa face ne raconte pas
   * (`factsNonNarresParLaFace`) : la production les liste dans un dépliable, le prototype aussi.
   */
  detailles: EntreeLue[];
};

export type SectionLue = {
  cle: DossierSection["key"];
  titre: string;
  intro?: string;
  entrees: EntreeLue[];
};

/**
 * CE QUE CETTE LECTURE A EXAMINÉ, déduit du périmètre du dossier et jamais du nombre de cartes.
 *
 * Un dossier `commune` n'a lu que le territoire : le secteur et le logement n'y sont PAS examinés, et
 * « zéro constat » y serait une affirmation fausse (revue du 11/10/2026). Un dossier `commune+adresse`
 * a relancé le moteur au point de l'adresse (`assembleAddressDossier` : faits du logement, du secteur
 * et du voisinage, contraintes recalculées depuis l'adresse) : les trois échelles y sont examinées, et
 * une échelle sans carte y veut dire « examinée, aucun constat retenu ».
 *
 * Limite assumée : le `Dossier` ne dit pas si l'instantané du voisinage existait à l'assemblage.
 * Distinguer « secteur examiné » de « secteur partiellement examiné » demanderait que le moteur
 * l'expose ; ce lot ne touche pas au moteur.
 */
export type PerimetreLu = Record<Echelle, boolean>;
export function perimetreDuDossier(scope: Dossier["scope"]): PerimetreLu {
  return { territoire: true, quartier: scope === "commune+adresse", logement: scope === "commune+adresse" };
}

export type EtatEchelle =
  | { echelle: Echelle; etat: "non_examinee" }
  | { echelle: Echelle; etat: "examinee"; constats: number };

/**
 * L'ÉTAT DE CHAQUE ÉCHELLE pour « D'où viennent ces constats » : non examinée (aucun nombre), ou
 * examinée avec le nombre de cartes affichées qui la touchent (zéro compris). Une carte compte à
 * chaque échelle qu'elle touche ; rien n'est sommé ni pondéré.
 */
export function lectureDesEchelles(l: LectureDecision, autresAffichees: EntreeLue[] = []): EtatEchelle[] {
  // LA MINUTE N'EST PAS LA PAGE (FUT-91). Le hub affiche aussi la liste complète des contrôles : une
  // échelle dont seuls des contrôles hors minute existent n'est pas « sans constat affiché ». Les
  // cartes présentes aux deux endroits ne comptent qu'une fois (même ancre).
  const vues = new Set<string>();
  const entrees = [...l.sections.flatMap((x) => x.entrees), ...autresAffichees].filter((e) => !vues.has(e.ancre) && Boolean(vues.add(e.ancre)));
  return ORDRE_ECHELLES.map((echelle) => (l.perimetre[echelle]
    ? { echelle, etat: "examinee" as const, constats: entrees.filter((e) => e.echelles.includes(echelle)).length }
    : { echelle, etat: "non_examinee" as const }));
}

const OU: Record<Echelle, string> = {
  territoire: "à l'échelle de la commune",
  quartier: "dans le secteur autour de l'adresse",
  logement: "au logement et à sa parcelle",
};

/**
 * CE QUE LA LIGNE D'UNE ÉCHELLE DIT AU LECTEUR. Trois cas, et trois seulement :
 *   - non examinée : AUCUN nombre. Écrire « 0 » dirait qu'on a regardé et rien trouvé ;
 *   - examinée, aucun constat affiché : « 0 », et la phrase le dit, sans en faire une absence de risque ;
 *   - examinée, n constats : le nombre de cartes affichées qui la touchent.
 *
 * `etatCourt` (FUT-92) : la même information pour le décompte compact, où le nom de l'échelle
 * précède déjà l'état. Les trois formulations restent distinctes, et zéro garde son « examiné ».
 */
export function texteEtatEchelle(e: EtatEchelle): { nom: string; valeur: string | null; phrase: string; etatCourt: string } {
  const nom = NOM_ECHELLE[e.echelle];
  if (e.etat === "non_examinee") return { nom, valeur: null, phrase: "Non examiné dans cette lecture", etatCourt: "non examiné dans cette lecture" };
  const compte = e.constats === 1 ? "1 constat" : `${e.constats} constats`;
  if (e.constats === 0) return { nom, valeur: "0", phrase: `Examiné, aucun constat affiché ${OU[e.echelle]}`, etatCourt: "examiné, aucun constat affiché" };
  return { nom, valeur: String(e.constats), phrase: `${compte} ${OU[e.echelle]}`, etatCourt: compte };
}

export type LectureDecision = {
  commune: string;
  portee: ConclusionNarrativePlan["scope"];
  /** Les échelles que cette lecture a examinées (`perimetreDuDossier`). */
  perimetre: PerimetreLu;
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
  ...(e.targetKey ? { cible: e.targetKey } : {}),
  ...(e.observedAt ? { date: e.observedAt } : {}),
  ...(e.sourceMode ? { mode: e.sourceMode } : {}),
});

/**
 * Sépare les preuves chiffrées des sources nommées, SANS RIEN PERDRE : deux références ne fusionnent
 * que si elles sont identiques sur tout ce que le lecteur peut voir ou suivre (libellé, valeur,
 * grain, lien, date).
 */
function trier(refs: EvidenceRef[]): { preuves: PreuveLue[]; sources: PreuveLue[] } {
  const vues = new Set<string>();
  const preuves: PreuveLue[] = [];
  const sources: PreuveLue[] = [];
  for (const e of refs) {
    const cle = [e.label, e.observedValue ?? "", e.grain, e.href ?? "", e.targetKey ?? "", e.observedAt ?? ""].join("|");
    if (vues.has(cle)) continue;
    vues.add(cle);
    (e.observedValue ? preuves : sources).push(preuve(e));
  }
  return { preuves, sources };
}

const grainsDe = (refs: EvidenceRef[]): GrainLu[] => [...new Set(refs.map((e) => e.grain))];
const echellesDe = (refs: EvidenceRef[]): Echelle[] =>
  ORDRE_ECHELLES.filter((ech) => refs.some((e) => echelleDeLaPreuve(e) === ech));
const refsDuFait = (f: DecisionFact): EvidenceRef[] => (f.role === "compromise" ? f.sides.flatMap((x) => x.evidence) : f.evidence);

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
  const refs = refsDuFait(f);
  const { preuves, sources } = trier(refs);
  const action = f.role === "verification" || f.role === "unknown" || f.role === "condition_check" ? f.action : undefined;
  const aVerifier: string[] = action?.detail ? [action.detail] : [];
  const methode: string[] = [];
  if (f.role === "verification" && f.signalConvention) methode.push(f.signalConvention);
  if ((f.role === "condition_check" || f.role === "condition_met" || f.role === "incompatibility") && f.senseRetenu) methode.push(f.senseRetenu);
  if (f.role === "condition_check" && f.whyNotDecided) methode.push(f.whyNotDecided);
  const limites = [...aVerifier, ...methode];
  const sujet = "headlineSubject" in f && typeof f.headlineSubject === "string" ? f.headlineSubject : undefined;
  const statut = "status" in f && typeof f.status === "string" ? f.status : undefined;
  const nuance = (f.role === "incompatibility" || f.role === "verification" || f.role === "mismatch") ? f.limitation : undefined;
  // UNE CORRESPONDANCE SE LIT EN DEUX LIGNES, comme en production : la priorité, puis la phrase de
  // rang que la règle a écrite (`faceStatement`). L'énoncé autonome (`statement`) n'y est pas montré.
  const enonce = f.role === "alignment" ? f.faceStatement : f.statement;
  const fondement = fondementDe(f);
  return {
    ancre: dossierAnchorId(f.id),
    nature: f.role,
    ...(sujet ? { sujet } : {}),
    ...(statut ? { statut } : {}),
    enonce,
    ...(nuance ? { nuance } : {}),
    grains: grainsDe(refs),
    echelles: echellesDe(refs),
    preuves,
    sources,
    ...(action ? { geste: geste(action) } : {}),
    cotes: f.role === "compromise"
      ? f.sides.map((x) => ({ libelle: "", enonce: x.statement, ...trier(x.evidence) }))
      : [],
    limites,
    aVerifier,
    methode,
    horsPriorites,
    ...(fondement ? { fondement } : {}),
    detailles: [],
  };
}

/** Les deux zones de « Données et limites », comme `MethodDetails` les sépare. */
function zones(aVerifier: string[], methode: string[]) {
  return { aVerifier, methode, limites: [...aVerifier, ...methode] };
}
/** Pour une composition à côtés : la règle de `compositionChecks` et `compositionConventions`. */
function zonesDesCotes(cotes: CompositionSide[]) {
  return zones(
    cotes.map((x) => x.action?.detail).filter((d): d is string => Boolean(d)),
    cotes.map((x) => x.signalConvention).filter((d): d is string => Boolean(d)),
  );
}

function lireCarte(dossier: Dossier, card: DossierCard, horsPriorites: (c: DossierCard) => boolean): EntreeLue {
  if (card.kind === "fact") return lireFait(card.fact, horsPriorites(card));
  const c = card.composition;
  const absorbes = dossier.absorbedFacts.filter((f) => c.absorbedFactIds.includes(f.id));
  const detailles = factsNonNarresParLaFace(c, absorbes).map((f) => lireFait(f, false));
  // Les grains d'une composition : ceux de ses propres preuves, puis ceux des faits qu'elle absorbe.
  const refsPropres: EvidenceRef[] =
    c.kind === "tradeoff" ? [...c.favorableSide.evidence, ...c.unfavorableSide.evidence]
      : c.kind === "grouped_verification" ? c.items.flatMap((x) => x.evidence)
        : c.kind === "mismatch_with_action" ? c.evidence
          : c.sharedEvidence;
  const toutes = [...refsPropres, ...absorbes.flatMap(refsDuFait)];
  const grains = grainsDe(toutes);
  const base = { ancre: dossierAnchorId(c.id), nature: c.kind, sujet: c.title, horsPriorites: horsPriorites(card), grains, echelles: echellesDe(toutes), detailles };
  const cote = (x: CompositionSide): CoteLu => ({
    libelle: x.label, enonce: x.statement, ...trier(x.evidence),
    ...(x.limitation ? { nuance: x.limitation } : {}), ...(x.status ? { statut: x.status } : {}),
    ...(x.action ? { geste: geste(x.action) } : {}),
  });
  if (c.kind === "tradeoff") {
    return { ...base, enonce: c.summary, preuves: [], sources: [], cotes: [cote(c.favorableSide), cote(c.unfavorableSide)], ...zonesDesCotes([c.favorableSide, c.unfavorableSide]) };
  }
  if (c.kind === "grouped_verification") {
    return {
      ...base, enonce: c.summary, preuves: [], sources: [], cotes: c.items.map(cote),
      ...zonesDesCotes(c.items),
    };
  }
  if (c.kind === "mismatch_with_action") {
    const f0 = absorbes.map(fondementDe).find(Boolean);
    return {
      ...base, enonce: c.summary, ...(c.limitation ? { nuance: c.limitation } : {}),
      ...trier(c.evidence), geste: geste(c.action), cotes: [],
      ...zones(c.action.detail ? [c.action.detail] : [], []),
      ...(f0 ? { fondement: f0 } : {}),
    };
  }
  // shared_evidence : un état observé, plusieurs conséquences sur les priorités du lecteur.
  return {
    ...base, enonce: c.summary, ...trier(c.sharedEvidence),
    cotes: c.consequences.map((x) => ({ libelle: "", enonce: x.statement, ...(x.limitation ? { nuance: x.limitation } : {}), preuves: [], sources: [] })),
    ...zones([], []),
  };
}

/**
 * UNE CARTE, hors de la minute : la liste complète des contrôles (`controlesParEchelle`) en a besoin.
 * Même lecture que dans `lireDossier`, sans le signalement « au-delà de vos priorités », que la
 * production ne pose pas dans cette liste.
 */
export function lireCarteDuDossier(dossier: Dossier, card: DossierCard): EntreeLue {
  return lireCarte(dossier, card, () => false);
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
  const detail = bloc("verdict") ?? plan.verdict.detail;
  return {
    commune: plan.communeNom,
    portee: plan.scope,
    perimetre: perimetreDuDossier(dossier.scope),
    verdict: {
      etiquette: plan.verdictLabel,
      ton: plan.verdictTone,
      titre: plan.verdict.headline.text,
      ...(detail ? { detail } : {}),
    },
    ...(bloc("unexamined_hard_constraints") ? { conditionNonExaminee: bloc("unexamined_hard_constraints")! } : {}),
    ...(bloc("uncovered_priorities") ? { nonCouvert: bloc("uncovered_priorities")! } : {}),
    preuvesDuVerdict: condition ? [...trier(condition.evidence).preuves, ...trier(condition.evidence).sources] : [],
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
