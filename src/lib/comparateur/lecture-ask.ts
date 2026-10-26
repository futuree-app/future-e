// FUT-142 · Le contrat entre la page « Où vivre » et la route /api/comparateur-vie/ask.
//
// AskFuture recevait l'ordre des cartes (« rang » 1, 2, 3) et leurs raisons, mais pas ce que cet ordre
// signifie : un classement sur les priorités déclarées, une exploration inondation (FUT-129), ou un ordre
// d'affichage sur des priorités en partie non mesurées (FUT-109). Une question libre (« pourquoi La Rochelle
// est-elle le meilleur choix ? ») pouvait donc faire d'un ordre exploratoire un palmarès.
//
// Le client transmet les FAITS du résultat (exploration, couverture globale et par commune) ; la route en
// déduit le mode avec la même règle que les questions suggérées (`modeQuestions`, FUT-139) : une seule
// définition d'un classement valable. Un fait absent ou illisible vaut « inconnu », jamais « complet ».
// Ce contexte vient du client : ce n'est pas une attestation serveur. Il ne sert qu'à RESTREINDRE ce
// qu'AskFuture affirme, et les affirmations jamais établies (meilleur choix, commune sans risque
// d'inondation) restent refusées quel que soit le mode (cf. `garde-ask.ts`).
import type { CouverturePriorites, CouvertureResultats, MatchOutcome, MatchResult } from "../comparateur-vie.ts";
import { modeQuestions, type ModeQuestions } from "./questions-ask.ts";

const ETATS = new Set<string>(["complete", "partielle", "aucune", "sans_priorite"]);
/** Au-delà, ce n'est pas la page : elle n'affiche jamais plus de trois cartes. */
export const MAX_TERRITOIRES_ASK = 3;

export type TerritoireAsk = {
  rang: number; // position d'affichage (1 à 3), pas un rang de mérite hors mode classé
  nom: string;
  region: string | null;
  raisons: string[];
  compromis: string | null;
  pression_eco?: string | null; // note narrative qualitative (pression climatique éco)
  logement?: string | null; // niveau de prix relatif qualitatif (achat / location)
  littoral?: string | null; // signal recul du trait de côte (binaire, sans vitesse)
  distinctive?: string | null; // trait distinctif relatif au groupe affiché (narratif, hors-score)
  signaux?: Record<string, string>; // signaux ambiants qualitatifs (hors-score, hors critères)
  heritage_industriel?: string | null; // ancien site SSP/ex-BASOL proche (narratif documentaire, hors-score)
  // FUT-142 : la couverture des priorités déclarées POUR CETTE COMMUNE (libellés du projet), ou null.
  couverture?: { etat: CouverturePriorites["etat"]; non_mesurees: string[] } | null;
};

export type ContexteAsk = {
  reformulation?: string;
  criteres?: string[]; // libellés humains (jamais les clés techniques)
  perimetre?: string[]; // ancres dures = cadre choisi
  orientation?: string[]; // ancres souples = penchant
  synthese?: string;
  aucun_territoire_parfait?: boolean;
  territoires?: TerritoireAsk[];
  // FUT-142 : ce que l'ordre des cartes signifie. `exploration` : false quand l'inondation n'est pas déclarée
  // (le moteur ne renseigne alors pas `outcome.inondation`), null quand elle l'est sans mode lisible.
  lecture?: {
    exploration: boolean | null;
    couverture: CouvertureResultats | null;
    ordre: string | null; // la règle d'ordre annoncée par la page en exploration
    transparence_inondation: string | null; // ce que la page dit comparer pour l'inondation
  };
};

/**
 * Le contexte que la page envoie à /ask, construit sur les cartes affichées (`top`). C'est la page qui
 * l'appelle (OuVivreClient, `sendAsk`) : les tests vérifient donc le vrai corps envoyé.
 */
export function contexteAsk(a: {
  reformulation: string;
  criteres: string[];
  /** La priorité inondation est-elle déclarée ? Sans elle, l'absence de `outcome.inondation` serait ambiguë. */
  inondationDeclaree: boolean;
  outcome: MatchOutcome | null | undefined;
  synthese: string;
  top: readonly MatchResult[];
}): ContexteAsk {
  const o = a.outcome;
  const inondation = o?.inondation;
  return {
    reformulation: a.reformulation,
    criteres: a.criteres,
    perimetre: o?.perimetreDur ?? o?.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label) ?? [],
    orientation: o?.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label) ?? [],
    synthese: a.synthese,
    aucun_territoire_parfait: o?.perfectMatch === false,
    territoires: a.top.map((r, i) => ({
      rang: i + 1,
      nom: r.nom,
      region: r.region,
      raisons: r.reasons,
      compromis: r.tradeoff,
      pression_eco: r.pressionEco?.note ?? null, // narratif qualitatif, firewall préservé
      logement: r.logement, // niveau de prix relatif qualitatif, firewall préservé
      littoral: r.littoral, // narratif littoral (recul du trait de côte), firewall préservé
      distinctive: r.distinctive, // trait distinctif relatif au groupe (narratif, hors-score), firewall préservé
      signaux: r.signaux, // signaux ambiants qualitatifs (hors-score), firewall préservé
      heritage_industriel: r.heritageIndustriel ?? null, // récit héritage (narratif, hors-score), firewall préservé
      // Transmise telle quelle : une carte sans couverture part sans couverture (jamais « complete »).
      couverture: r.couverture ? { etat: r.couverture.etat, non_mesurees: r.couverture.nonMesurees ?? [] } : null,
    })),
    lecture: {
      exploration: inondation
        ? (typeof inondation.exploration === "boolean" ? inondation.exploration : null)
        : a.inondationDeclaree ? null : false, // déclarée mais sans mode : inconnu, jamais « pas d'exploration »
      couverture: o?.couverture ?? null,
      ordre: inondation?.ordre ?? null,
      transparence_inondation: inondation?.transparence ?? null,
    },
  };
}

// ── Côté route : lire ce contexte sans lui prêter plus qu'il ne dit ─────────────────────────────────

export type EtatLu = CouverturePriorites["etat"] | "inconnue";
export type LectureAsk = {
  mode: ModeQuestions;
  exploration: boolean | "inconnue";
  couverture: EtatLu;
  ordre: string | null;
  transparence: string | null;
  communes: { nom: string; couverture: EtatLu; nonMesurees: string[] }[];
};

const texte = (x: unknown): string | null => (typeof x === "string" && x.trim() ? x.trim() : null);
const etat = (x: unknown): EtatLu => (typeof x === "string" && ETATS.has(x) ? (x as CouverturePriorites["etat"]) : "inconnue");

/**
 * Le mode de lecture, déduit des faits transmis. Classé seulement si l'exploration est explicitement
 * écartée ET que `modeQuestions` établit la couverture complète (agrégat et chaque commune). Un client
 * ancien, qui n'envoie pas `lecture`, est donc lu en « couverture_incomplete » : prudence, pas refus.
 */
export function lectureDuContexte(ctx: ContexteAsk): LectureAsk {
  const l = ctx.lecture && typeof ctx.lecture === "object" ? ctx.lecture : null;
  const exploration = l?.exploration === true || l?.exploration === false ? l.exploration : "inconnue";
  const couverture = etat(l?.couverture);
  const communes = (ctx.territoires ?? []).map((t) => {
    const c = t?.couverture && typeof t.couverture === "object" ? t.couverture : null;
    const nonMesurees = Array.isArray(c?.non_mesurees) ? c.non_mesurees.map(texte).filter((x): x is string => !!x) : [];
    return { nom: texte(t?.nom) ?? "", couverture: etat(c?.etat), nonMesurees };
  });
  const mode: ModeQuestions =
    exploration === true ? "exploration_inondation"
    : exploration === "inconnue" ? "couverture_incomplete"
    : modeQuestions(
        { couverture: couverture === "inconnue" ? null : couverture, inondation: { exploration: false } },
        communes.map((c) => ({ nom: c.nom, couverture: c.couverture === "inconnue" ? null : { etat: c.couverture } })),
      );
  return { mode, exploration, couverture, ordre: texte(l?.ordre), transparence: texte(l?.transparence_inondation), communes };
}

/** Le contexte est-il recevable avant tout appel payant ? `null` si oui, sinon le motif du refus. */
export function contexteIrrecevable(ctx: unknown): string | null {
  const c = ctx && typeof ctx === "object" ? (ctx as ContexteAsk) : null;
  if (!c || !Array.isArray(c.territoires) || c.territoires.length === 0) return "Contexte comparateur manquant.";
  if (c.territoires.length > MAX_TERRITOIRES_ASK) return "Contexte comparateur invalide.";
  if (c.territoires.some((t) => !t || typeof t !== "object" || !texte(t.nom))) return "Contexte comparateur invalide.";
  return null;
}
