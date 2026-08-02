"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import type { ParsedProject, MatchOutcome, MatchResult } from "@/lib/comparateur-vie";
import {
  preferencesToLabels,
  preferencesToInterpreted,
  horsMesureToPhrases,
} from "@/lib/comparateur-labels";
import { anchorsToLabeled, exclusionsToLabels } from "@/lib/geo-zones";
import { ChipTooltip } from "@/components/ChipTooltip";
import { departmentName } from "@/lib/regions-fr";
import { bindOrphans } from "@/lib/typography";
import { AnchorAmorce } from "./AnchorAmorce";

// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie — client.
//
// Parcours : texte libre → /parse → /match → /synthesize (stream) → cartes →
// AskFuture comparateur (2 questions) → paywall territoire.
//
// Discipline de frontière (cf. contrat UX) :
//   - aucun chiffre climatique affiché (les metrics restent inertes côté client,
//     réservées au rapport) ;
//   - AskFuture ne reçoit QUE du qualitatif scellé : reformulation, libellés
//     humains, synthèse, et territoires (rang/nom/region/raisons/compromis).
//     Jamais d'INSEE, jamais de metrics, jamais de clé technique.
// ════════════════════════════════════════════════════════════════════════════

// Parcours en un clic : on ne barre plus l'accès aux résultats par un gate de
// confirmation. Le parse enchaîne directement le match (déterministe), et
// l'interprétation « ce produit m'a compris » remonte en EN-TÊTE des résultats
// (repliable), comme une preuve EN CONTEXTE plutôt qu'un mur abstrait. La
// correction reste possible via « Affiner » (re-parse explicite).
type Phase = "idle" | "parsing" | "matching" | "results" | "empty" | "error";

type AskMessage = { role: "user" | "assistant"; content: string };

const FREE_ASK = 2;

// ── Persistance de session (anti perte d'état au retour d'un paywall) ────────
// Le parcours vit en state React : naviguer vers un paywall puis revenir (lien
// « Retour aux territoires » ou bouton précédent du navigateur) remontait un
// formulaire vierge, détruisant le projet, le trio, la synthèse et l'échange
// AskFuture déjà produits. On dépose un instantané complet tant qu'on est en
// résultats, réhydraté au montage, avec un TTL court : on restaure le retour de
// paywall, on ne ressuscite pas une session d'il y a deux jours.
const SESSION_KEY = "futuree:ouvivre:session";
const SESSION_VERSION = 3;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 h

type SessionSnapshot = {
  v: number;
  savedAt: number;
  submittedText: string;
  parsed: ParsedProject;
  outcome: MatchOutcome;
  synthesis: string;
  askMessages: AskMessage[];
  askRemaining: number;
  askLimit: boolean;
};

function saveSession(s: Omit<SessionSnapshot, "v" | "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SessionSnapshot = { v: SESSION_VERSION, savedAt: Date.now(), ...s };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // best-effort : quota plein ou stockage indisponible, jamais bloquant
  }
}

function loadSession(): SessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionSnapshot;
    if (s.v !== SESSION_VERSION) return null;
    if (!s.savedAt || Date.now() - s.savedAt > SESSION_TTL_MS) return null;
    if (!s.parsed || !s.outcome?.results?.length) return null;
    return s;
  } catch {
    return null;
  }
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // best-effort
  }
}

// bindOrphans : typographie FR robuste (Safari ignore text-wrap: pretty). Extrait dans
// @/lib/typography pour servir aussi le comparateur. cf. AGENTS.md « Largeur du texte ».

// Ordre : tête d'affiche climat/protection (le moat, invisible chez SeLoger),
// puis projet de vie. Set figé par le porteur, chaque chip validée par la sonde
// parse+match (2026-06-05). Pas de chip immobilière tant que DVF n'est pas au moteur.
const EXAMPLES = [
  "Vivre dans le Sud sans les canicules",
  "Élever mes enfants dans un environnement sain",
  "Je veux vivre sans voiture au quotidien",
  "Une petite ville vivante près de l'océan",
  "Préparer ma retraite dans un climat tempéré",
  "Une ville qui attire de nouveaux habitants",
];

// Placeholder tournant du champ libre (au repos, champ vide). Discipline produit :
// chaque phrase est plus riche que le moteur MAIS chaque morceau est couvert par un
// vrai signal (vérifié via la route de parse, 2026-06-05). On n'affiche jamais un
// exemple qui reposerait sur un signal absent (prix, tempête, maladies émergentes).
// Ordre = rotation par force décroissante (les plus multi-critères en tête).
const PLACEHOLDER_PHRASES = [
  "Je cherche une petite ville vivante, avec une gare, des médecins accessibles et un climat supportable l'été.",
  "Nous voulons élever nos enfants loin des sites industriels à risque, sans être isolés des services.",
  "Je voudrais vivre sans voiture, près de l'océan, dans une ville qui attire encore de nouveaux habitants.",
  "Un endroit calme pour la retraite, avec des étudiants, des commerces et peu de risque d'inondation.",
  "Rester dans le Sud, mais éviter les canicules les plus intenses.",
];

// Phrases d'attente pendant le calcul + la synthèse : plus légères et
// rassurantes qu'un simple « analyse en cours », honnêtes sur ce qui se passe.
const WAITING_PHRASES = [
  "Nous parcourons les 34 000 communes de France métropolitaine…",
  "Nous croisons climat, environnement et cadre de vie…",
  "Nous consultons les données scientifiques publiques…",
  "Nous pesons les compromis de chaque territoire…",
  "Nous cherchons ce qui correspond vraiment à votre projet…",
];

// Phrases d'attente pendant le PARSE (lecture + structuration du projet, quelques
// secondes). Sans elles, l'écran reste figé sur une seule ligne et l'utilisateur
// conclut au plantage bien avant la fin. On raconte l'étape en cours.
const PARSE_PHRASES = [
  "Nous lisons votre projet…",
  "Nous repérons vos critères de vie…",
  "Nous distinguons l'essentiel de l'accessoire…",
  "Nous cernons le périmètre que vous visez…",
];

// Cartes affichées : on prend les 3 premiers territoires DANS L'ORDRE du moteur.
// Le moteur fait désormais tout l'étalement (diversité par région/département, et
// étalement échelonné quand une ancre est préférée : zone dominante + 1 ouverture).
// La dé-dup client d'avant (par région/département) faisait doublon et écrasait
// l'étalement échelonné : on fait confiance au serveur.
function topCards(results: MatchResult[] | undefined | null): MatchResult[] {
  return (results ?? []).slice(0, 3);
}

// Correspondance affichée sur la carte : 1 confirmation (reason[0], ce qui rapproche)
// + 1 découverte (atout positif non demandé, champ moteur r.decouverte, garanti
// DISTINCT d'une carte à l'autre par assignDecouverte). Pas de repli sur reasons[1] :
// il n'est pas trio-distinct et ré-introduisait des cartes jumelles. Une découverte
// nulle ⇒ la carte n'affiche que sa confirmation (honnête > répétition). cf. CompareView.
function forces(r: MatchResult): string[] {
  const confirmation = r.reasons?.[0] ?? null;
  const decouverte = r.decouverte ?? null;
  const out: string[] = [];
  if (confirmation) out.push(confirmation);
  if (decouverte && decouverte !== confirmation) out.push(decouverte);
  return out.slice(0, 2);
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Palier qualitatif de correspondance, à la place d'un score chiffré : le %
// brut est instable (parse non déterministe) et tassé en haut (tout entre 83 et
// 98), donc faussement précis. Le palier dit la force sans fausse précision.
function matchTier(compatibility: number): string {
  if (compatibility >= 80) return "Forte correspondance";
  if (compatibility >= 65) return "Bonne correspondance";
  return "Correspondance partielle";
}

// Couleur du label de palier : la force se LIT à la couleur. « Forte » porte
// l'accent chaud (le plus fort de la page) ; « Bonne » un vert calme et positif
// mais distinct ; « partielle » s'atténue. Une bonne correspondance ne doit pas
// se faire passer pour une forte.
function matchTierClass(compatibility: number): string {
  if (compatibility >= 80) return "text-accent/80";
  if (compatibility >= 65) return "text-emerald-300/80";
  return "text-muted";
}

function capture(event: string, props?: Record<string, unknown>) {
  try {
    posthog.capture(event, props);
  } catch {
    /* posthog non prêt : la mesure n'est pas critique */
  }
}

function distinctId(): string {
  try {
    return posthog.get_distinct_id?.() ?? "anon";
  } catch {
    return "anon";
  }
}

// Fallback déterministe si la synthèse IA est indisponible (502). On reste
// qualitatif, on s'appuie sur ce que le moteur a déjà produit.
function fallbackSynthesis(parsed: ParsedProject, results: MatchResult[]): string {
  const reasons = Array.from(
    new Set(results.flatMap((r) => r.reasons).filter(Boolean)),
  ).slice(0, 3);
  const reasonPart = reasons.length
    ? ` Les territoires qui ressortent se distinguent notamment par ${reasons.join(", ")}.`
    : "";
  return `${parsed.reformulation}${reasonPart} Aucun ne réunit tout, chacun représente un arbitrage différent. Ouvrez celui qui vous parle pour comprendre ce qu'il implique vraiment.`;
}

// ── Panneau d'interprétation (« ce produit m'a compris ») ─────────────────────
// Anciennement un gate BLOQUANT entre le parse et les résultats. Désormais un
// EN-TÊTE des résultats : l'interprétation devient une preuve EN CONTEXTE, plus
// un mur abstrait. La reformulation reste toujours visible ; le détail (critères,
// périmètre, ce qui reste ouvert) est repliable pour aller vite aux communes. On
// garde INTACTE la couche d'honnêteté (relief rendu visible, ambiguïtés en
// hypothèses) : c'est le moat ; seul le caractère bloquant a sauté.
function InterpretationPanel({
  reformulation,
  criteres,
  hardZoneLabels,
  prefZoneLabels,
  inspZoneLabels,
  exclLabels,
  reliefLabel,
  horsMesurePhrases,
  ambiguities,
  onRefine,
}: {
  reformulation: string;
  criteres: { label: string; tooltip?: string | null }[];
  hardZoneLabels: string[];
  prefZoneLabels: string[];
  inspZoneLabels: string[];
  exclLabels: string[];
  reliefLabel: string | null;
  horsMesurePhrases: string[];
  ambiguities?: { topic: string }[];
  onRefine: () => void;
}) {
  // Compact par défaut : le haut de page est un bandeau mince « il m'a compris »
  // (reformulation + critères), pour ne pas écraser la réponse (les territoires)
  // qui suit. Le détail (périmètre, ce qui reste ouvert) s'ouvre à la demande.
  const [open, setOpen] = useState(false);
  const hasPerimetre =
    hardZoneLabels.length > 0 ||
    prefZoneLabels.length > 0 ||
    inspZoneLabels.length > 0 ||
    exclLabels.length > 0 ||
    !!reliefLabel;
  const hasOuvert = (ambiguities && ambiguities.length > 0) || horsMesurePhrases.length > 0;
  const hasMore = hasPerimetre || hasOuvert; // ce qui vit derrière « Voir le détail »

  return (
    // Replié : bande mince (padding réduit) pour rapprocher la réponse. Déplié :
    // padding plein, le détail a besoin d'air.
    <div className={`glass rounded-2xl px-7 ${open ? "py-7" : "py-5"}`}>
      {/* En-tête : titre + actions (Affiner / replier le détail) */}
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost">
          <span className="text-emerald-400">✓</span> Ce que nous avons compris
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefine}
            className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted hover:text-label border border-[var(--border-2)] rounded-lg px-3 py-1.5"
          >
            Affiner
          </button>
          {hasMore && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted hover:text-label border border-[var(--border-2)] rounded-lg px-3 py-1.5"
            >
              {open ? "Réduire" : "Voir le détail"}
            </button>
          )}
        </div>
      </div>

      {/* La reformulation reste TOUJOURS visible (le « il m'a compris ») */}
      <p
        className="mt-3 text-[19px] leading-[1.6] text-label"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {reformulation}
      </p>

      {/* Critères : visibles en compact (sous la reformulation), c'est le « il m'a
          compris » essentiel. N1 puces seules ; N2 une puce à nuance porte le
          ChipTooltip. Pur affichage, aucun impact sur le score. */}
      {criteres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {criteres.map((c) =>
            c.tooltip ? (
              <ChipTooltip key={c.label} label={c.label} text={c.tooltip} />
            ) : (
              <span
                key={c.label}
                className="text-[12px] text-label/90 border border-[var(--border-2)] rounded-full px-3 py-1"
              >
                {c.label}
              </span>
            ),
          )}
        </div>
      )}

      {open && hasMore && (
        <>
          {/* Périmètre géographique avec gradient de force : l'ancre définit ou
              incline l'espace de recherche, distinct des préférences. On distingue
              visuellement dure (filtre), préférée (penchant) et inspiration. */}
          {hasPerimetre && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">
                <span className="text-emerald-400">✓</span> Le périmètre recherché
              </p>
              <div className="flex flex-wrap gap-2">
                {hardZoneLabels.map((z) => (
                  <span
                    key={z}
                    className="text-[12px] text-label/90 border border-accent/[0.35] bg-accent/[0.08] rounded-full px-3 py-1"
                  >
                    {z}
                  </span>
                ))}
                {prefZoneLabels.map((z) => (
                  <span
                    key={z}
                    className="text-[12px] text-label/80 border border-accent/[0.18] rounded-full px-3 py-1"
                  >
                    idéalement {z}
                  </span>
                ))}
                {inspZoneLabels.map((z) => (
                  <span
                    key={z}
                    className="text-[12px] text-muted border border-[var(--border-2)] rounded-full px-3 py-1"
                  >
                    ouvert à : {z}
                  </span>
                ))}
                {exclLabels.map((z) => (
                  <span
                    key={z}
                    className="text-[12px] text-muted border border-[var(--border-2)] rounded-full px-3 py-1"
                  >
                    hors {z}
                  </span>
                ))}
              </div>
              {/* Relief à portée : on rend l'interprétation VISIBLE (le critère était
                  jadis silencieusement ignoré). Glose = sens retenu, pas la méthode. */}
              {reliefLabel && (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <span className="self-start text-[12px] text-label/90 border border-accent/[0.22] rounded-full px-3 py-1">
                    {reliefLabel}
                  </span>
                  <span
                    className="flex items-baseline gap-1 pl-1 text-[length:var(--text-caption)] leading-snug text-label/55 italic"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    <span className="not-italic text-accent/50">→</span>
                    reliefs montagneux à proximité
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ce qui reste ouvert : reformulé en hypothèses, jamais en questions.
              Tant qu'il n'y a pas de mécanisme d'affinage interactif, une question
              ouverte crée une attente de réponse impossible à satisfaire. */}
          {hasOuvert && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">
                <span className="text-amber-400">⚠</span> Ce qui reste ouvert
              </p>
              <ul className="flex flex-col gap-2">
                {horsMesurePhrases.map((phrase, i) => (
                  <li
                    key={`hm-${i}`}
                    className="text-[13px] leading-[1.6] text-muted border-l-2 border-amber-400/30 pl-3"
                  >
                    {phrase}
                  </li>
                ))}
                {ambiguities?.map((a, i) => (
                  <li
                    key={`amb-${i}`}
                    className="text-[13px] leading-[1.6] text-muted border-l-2 border-amber-400/30 pl-3"
                  >
                    <span className="text-label">{a.topic}</span> : sans précision de votre
                    part, futur•e en retient une interprétation souple, sans en faire un
                    critère éliminatoire.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function OuVivreClient() {
  const [text, setText] = useState("");
  const [submittedText, setSubmittedText] = useState(""); // texte parsé, réutilisé pour la synthèse
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [parsed, setParsed] = useState<ParsedProject | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);

  const [synthesis, setSynthesis] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [caretOn, setCaretOn] = useState(true); // clignotement du curseur de placeholder

  // AskFuture comparateur
  const [askMessages, setAskMessages] = useState<AskMessage[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askRemaining, setAskRemaining] = useState(FREE_ASK);
  const [askLimit, setAskLimit] = useState(false);
  const [routesNudge, setRoutesNudge] = useState(false);
  const [askTyped, setAskTyped] = useState("");

  const runSeq = useRef(0); // garde-fou contre les réponses obsolètes (re-submit)

  // Ancre vers la zone de sortie : au clic « Explorer », on descend automatiquement
  // à l'interprétation/résultats pour que la réponse soit dans le champ de vision
  // sans scroll manuel. `searchStartedRef` distingue une recherche lancée par
  // l'utilisateur (on scrolle) d'une réhydratation post-paywall (on ne touche pas
  // la position). cf. effet plus bas, déclenché sur `phase`.
  const outputAnchorRef = useRef<HTMLDivElement>(null);
  const searchStartedRef = useRef(false);

  // ── Réhydratation au montage : restaure le parcours après un aller-retour
  // paywall, sans rejouer parse/match/synthèse (tout vit déjà dans le snapshot).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const s = loadSession();
    if (!s) return;
    runSeq.current++; // invalide tout flux en cours par cohérence
    // Réhydratation localStorage au montage (client-only) : pattern légitime,
    // pas un cascading render (s'exécute une seule fois, gardé par restoredRef).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmittedText(s.submittedText);
    setText(s.submittedText);
    setParsed(s.parsed);
    setOutcome(s.outcome);
    setSynthesis(s.synthesis);
    setAskMessages(s.askMessages);
    setAskRemaining(s.askRemaining);
    setAskLimit(s.askLimit);
    setPhase("results");
    capture("life_session_restored");
  }, []);

  // ── Sauvegarde du parcours tant qu'on est en résultats (cartes/comparaison).
  useEffect(() => {
    if (phase !== "results" || !parsed || !outcome?.results?.length) return;
    saveSession({ submittedText, parsed, outcome, synthesis, askMessages, askRemaining, askLimit });
  }, [phase, parsed, outcome, synthesis, askMessages, askRemaining, askLimit, submittedText]);

  // ── Synthèse streamée ─────────────────────────────────────────────────────
  const streamSynthesis = useCallback(
    async (
      seq: number,
      project: string,
      p: ParsedProject,
      top: MatchResult[],
      outcomeMeta: {
        perfectMatch: boolean;
        message: string | null;
        perimetre?: string[];
        orientation?: string[];
      },
    ) => {
      setSynthesis("");
      setSynthesizing(true);
      try {
        const res = await fetch("/api/comparateur-vie/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
            reformulation: p.reformulation,
            preferences: p.preferences,
            heritageIntent: p.heritageIntent ?? false, // intention héritage (gate du récit héritage en synthèse)
            results: top.map((r) => ({
              nom: r.nom,
              region: r.region,
              reasons: r.reasons,
              tradeoff: r.tradeoff,
              pressionEco: r.pressionEco?.note ?? null, // narratif qualitatif, firewall préservé
              logement: r.logement, // niveau de prix relatif qualitatif, firewall préservé
              littoral: r.littoral, // narratif littoral (recul du trait de côte), firewall préservé
              distinctive: r.distinctive, // trait distinctif relatif au groupe (narratif, hors-score), firewall préservé
              climatInondation: r.climatInondation, // narratif inondation, gaté côté route par inondation demandée
              demographie: r.demographie, // récit démographique, gaté côté route par croissance demandée
              calmeSonore: r.calmeSonore, // récit calme sonore (source bruyante proche), gaté côté route par calme_sonore demandé
              expoIndustrielle: r.expoIndustrielle, // récit sites industriels, gaté côté route par critère demandé
              heritageIndustriel: r.heritageIndustriel, // récit héritage industriel, gaté côté route par heritageIntent
            })),
            outcome: { perfectMatch: outcomeMeta.perfectMatch, message: outcomeMeta.message },
            perimetre: outcomeMeta.perimetre ?? [],
            orientation: outcomeMeta.orientation ?? [],
          }),
        });

        if (!res.ok || !res.body) throw new Error("synthese indisponible");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (seq !== runSeq.current) return; // une nouvelle recherche a démarré
          acc += decoder.decode(value, { stream: true });
          setSynthesis(acc);
        }
        if (seq === runSeq.current) capture("life_synthesis_shown");
      } catch {
        if (seq !== runSeq.current) return;
        setSynthesis(fallbackSynthesis(p, top));
        capture("life_synthesis_fallback");
      } finally {
        if (seq === runSeq.current) setSynthesizing(false);
      }
    },
    [],
  );

  // ── Étape MATCH + SYNTHÈSE (« ce produit réfléchit à ma situation ») ───────
  // Déclaré avant runParse car ce dernier l'enchaîne directement (plus de gate).
  const runMatch = useCallback(async (override?: { parsed: ParsedProject; submittedText: string }) => {
    const proj = override?.parsed ?? parsed;
    const subText = override?.submittedText ?? submittedText;
    if (!proj) return;
    const seq = ++runSeq.current;
    capture("life_project_confirmed");

    setPhase("matching");
    let matchOutcome: MatchOutcome;
    try {
      const r = await fetch("/api/comparateur-vie/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed: proj }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "match");
      matchOutcome = data as MatchOutcome;
    } catch {
      if (seq !== runSeq.current) return;
      setErrorMsg("Le calcul des territoires a échoué. Réessayez dans un instant.");
      setPhase("error");
      return;
    }
    if (seq !== runSeq.current) return;

    setOutcome(matchOutcome);

    if (!matchOutcome.results || matchOutcome.results.length === 0) {
      capture("life_match_empty");
      setPhase("empty");
      return;
    }

    const top = topCards(matchOutcome.results);
    capture("life_match_succeeded", {
      candidates: matchOutcome.candidates,
      best_compatibility: matchOutcome.bestCompatibility,
      results_count: top.length,
      perfect_match: matchOutcome.perfectMatch,
    });
    setPhase("results");

    // SYNTHÈSE (streamée, non bloquante pour les cartes). Toujours automatique depuis le
    // 30/07/2026 : elle était conditionnée à un flag `AUTO_SYNTHESIS`, absent en production, ce
    // qui laissait l'interprétation derrière un bouton que personne n'actionnait.
    void streamSynthesis(seq, subText, proj, top, {
      perfectMatch: matchOutcome.perfectMatch,
      message: matchOutcome.message,
      perimetre: matchOutcome.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label),
      orientation: matchOutcome.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label),
    });
  }, [parsed, submittedText, streamSynthesis]);

  // ── Étape PARSE → enchaîne directement le match (plus de gate bloquant) ────
  const runParse = useCallback(async (input: string) => {
    const project = input.trim();
    if (project.length < 3) return;

    searchStartedRef.current = true; // autorise l'auto-scroll (recherche utilisateur)
    clearSession(); // une nouvelle recherche remplace la session restaurable

    const seq = ++runSeq.current;
    // reset aval
    setParsed(null);
    setOutcome(null);
    setSynthesis("");
    setAskMessages([]);
    setAskInput("");
    setAskRemaining(FREE_ASK);
    setAskLimit(false);
    setRoutesNudge(false);
    setErrorMsg(null);
    setSubmittedText(project);

    capture("life_project_submitted", { text_length: project.length });

    setPhase("parsing");
    try {
      const r = await fetch("/api/comparateur-vie/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: project }),
      });
      const data = await r.json();
      if (!r.ok || !data.parsed) throw new Error(data.error ?? "parse");
      if (seq !== runSeq.current) return;
      capture("life_parse_succeeded");
      const parsedProject = data.parsed as ParsedProject;
      setParsed(parsedProject);
      // Plus de gate bloquant : on enchaîne directement le match (déterministe),
      // l'interprétation s'affichera en en-tête des résultats. On passe par
      // l'override car le state React n'est pas encore flushé (cf. launchFromAnchor).
      void runMatch({ parsed: parsedProject, submittedText: project });
    } catch {
      if (seq !== runSeq.current) return;
      capture("life_parse_failed");
      setErrorMsg("Nous n'avons pas réussi à lire ce projet. Reformulez-le en une ou deux phrases.");
      setPhase("error");
    }
  }, [runMatch]);

  // Affiner : revenir à l'édition du texte sans perdre ce qui est saisi.
  const refine = useCallback(() => {
    runSeq.current++; // invalide tout flux en cours
    setParsed(null);
    setPhase("idle");
    capture("life_project_refine");
  }, []);

  // Lancement depuis l'amorce commune (Phase B) : on reçoit un ParsedProject déjà
  // assemblé par /anchor, on réinitialise l'aval comme un nouveau projet, puis on passe
  // directement au matching (même chemin que le texte libre désormais). cf. spec Phase B.
  const launchFromAnchor = useCallback(
    (p: ParsedProject, nom: string) => {
      searchStartedRef.current = true; // autorise l'auto-scroll (recherche utilisateur)
      setOutcome(null);
      setSynthesis("");
      setAskMessages([]);
      setAskInput("");
      setAskRemaining(FREE_ASK);
      setAskLimit(false);
      setRoutesNudge(false);
      setErrorMsg(null);
      const subText = `une ville comme ${nom}`;
      setParsed(p);
      setSubmittedText(subText);
      setText(subText);
      capture("life_anchor_launched");
      void runMatch({ parsed: p, submittedText: subText });
    },
    [runMatch],
  );

  // Critères humains détectés (jamais les clés techniques), affichés au gate, avec
  // leur interprétation visible (glose) pour les faux amis / la polysémie.
  const criteres = parsed ? preferencesToInterpreted(parsed.preferences) : [];
  const horsMesurePhrases = parsed ? horsMesureToPhrases(parsed.horsMesure) : [];

  // Ancres géographiques détectées (périmètre, distinct des préférences), avec leur
  // force. Au gate, on n'a que les jetons du parse : on les traduit en libellés. Le
  // périmètre assumé (convention « au sens… ») s'affiche aux résultats, via outcome.
  const zoneAnchors = parsed ? anchorsToLabeled(parsed.hardConstraints?.zones) : [];
  const hardZoneLabels = zoneAnchors.filter((z) => z.strength === "hard").map((z) => z.label);
  const prefZoneLabels = zoneAnchors.filter((z) => z.strength === "preferred").map((z) => z.label);
  const inspZoneLabels = zoneAnchors.filter((z) => z.strength === "inspiration").map((z) => z.label);
  // Montagne (critère altitude) : même affichage que les zones, par force.
  const montStrength = parsed?.hardConstraints?.montagne?.strength;
  if (montStrength === "hard") hardZoneLabels.push("la montagne");
  else if (montStrength === "preferred") prefZoneLabels.push("la montagne");
  else if (montStrength === "inspiration") inspZoneLabels.push("la montagne");
  // Proche d'un massif (relief à portée, distinct de « vivre à la montagne »).
  // On affiche le SENS retenu (glose utilisateur), jamais la méthode d'estimation.
  const reliefStrength = parsed?.hardConstraints?.reliefProche?.strength;
  const reliefLabel =
    reliefStrength === "hard"
      ? "proche d'un massif"
      : reliefStrength === "preferred"
        ? "idéalement proche d'un massif"
        : reliefStrength === "inspiration"
          ? "ouvert à : proche d'un massif"
          : null;
  const exclLabels = parsed ? exclusionsToLabels(parsed.hardConstraints?.excludeZones) : [];

  // ── AskFuture comparateur ─────────────────────────────────────────────────
  const top = topCards(outcome?.results);

  // Chips suggérées (MAX 3, une seule ligne) : ancrées sur les vraies communes et
  // signaux du classement, pas des questions génériques. Reflètent les arbitrages.
  const askChips = (() => {
    if (!top.length) return [];
    const c0 = top[0].nom;
    const c1 = top[1]?.nom;
    const out: string[] = [
      c1 ? `Pourquoi ${c0} plutôt que ${c1} ?` : `Pourquoi ${c0} ressort en premier ?`,
    ];
    const littoral = top.find((r) => r.littoral)?.nom;
    if (littoral) out.push(`Le littoral est-il un sujet à ${littoral} ?`);
    else if (exclLabels[0]) out.push(`Que vais-je gagner en quittant ${exclLabels[0]} ?`);
    else out.push("Quels risques climatiques les séparent ?");
    out.push("Qu'est-ce qui a vraiment pesé ?");
    return out.slice(0, 3);
  })();

  // Pool du placeholder « machine à écrire » : donne envie de cliquer avant même
  // d'avoir une question en tête, en montrant l'étendue du moteur (climat, littoral,
  // nature/emploi, retraite, canicule…), templaté sur les communes réelles.
  const askPlaceholders = (() => {
    if (!top.length) return [];
    const c0 = top[0].nom;
    const c1 = top[1]?.nom;
    const litt = top.find((r) => r.littoral)?.nom;
    const keys = new Set((parsed?.preferences ?? []).map((p) => p.key));
    const pool: string[] = [];
    if (c1) pool.push(`Pourquoi ${c0} ressort devant ${c1} ?`);
    pool.push("Que va changer le climat ici d'ici 2050 ?");
    if (litt) pool.push(`L'érosion du littoral est-elle un sujet à ${litt} ?`);
    if (keys.has("nature") && keys.has("viabilite_emploi"))
      pool.push("Où trouver plus de nature sans perdre l'accès à l'emploi ?");
    pool.push("Laquelle est la plus adaptée pour une retraite dans 20 ans ?");
    pool.push("Quelle commune restera la plus vivable pendant les canicules ?");
    pool.push("Pourquoi futur•e écarte des communes que j'avais en tête ?");
    pool.push("Que montrent les données que je ne vois pas encore ?");
    return pool;
  })();
  const askPlaceholdersRef = useRef<string[]>(askPlaceholders);
  askPlaceholdersRef.current = askPlaceholders;
  const askTopKey = top.map((t) => t.insee).join(",");
  // Rotation tant que le champ est vierge et qu'aucune conversation n'a démarré.
  const askRotating =
    top.length > 0 && !askLimit && askInput.length === 0 && askMessages.length === 0;

  const sendAsk = useCallback(async (preset?: string) => {
    const question = (preset ?? askInput).trim();
    if (question.length < 3 || askLoading || askLimit || !parsed) return;

    const userMsg: AskMessage = { role: "user", content: question };
    const history = askMessages.slice(-6);
    setAskMessages((m) => [...m, userMsg]);
    setAskInput("");
    setAskLoading(true);
    setRoutesNudge(false);

    try {
      const res = await fetch("/api/comparateur-vie/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: {
            reformulation: parsed.reformulation,
            criteres: preferencesToLabels(parsed.preferences),
            perimetre: outcome?.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label) ?? [],
            orientation: outcome?.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label) ?? [],
            synthese: synthesis,
            aucun_territoire_parfait: outcome?.perfectMatch === false,
            territoires: top.map((r, i) => ({
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
            })),
          },
          focus: null,
          history,
          distinctId: distinctId(),
        }),
      });

      if (res.status === 402) {
        setAskLimit(true);
        setAskMessages((m) => m.slice(0, -1)); // retire la question non répondue
        setAskInput(question);
        return;
      }

      const data = await res.json();
      if (!res.ok || typeof data.answer !== "string") {
        throw new Error(data.error ?? "ask");
      }

      setAskMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      setAskRemaining(typeof data.remaining === "number" ? data.remaining : Math.max(0, askRemaining - 1));
      setRoutesNudge(data.routesToReport === true);
    } catch {
      setAskMessages((m) => [
        ...m,
        { role: "assistant", content: "Cette réponse n'a pas pu être générée. Réessayez dans un instant." },
      ]);
    } finally {
      setAskLoading(false);
    }
  }, [askInput, askLoading, askLimit, parsed, askMessages, synthesis, outcome, top, askRemaining]);

  // ── CTA ───────────────────────────────────────────────────────────────────
  const onExplore = (r: MatchResult, rang: number) => {
    capture("life_explore_clicked", { rang, insee: r.insee });
    // Dépose les priorités du projet (libellés client-safe) pour la touche perso de la paywall.
    try {
      const labels = preferencesToLabels(parsed?.preferences ?? null);
      if (labels.length > 0) {
        window.localStorage.setItem("futuree:projet:labels", JSON.stringify(labels));
      }
    } catch {
      // best-effort, jamais bloquant
    }
  };

  const canPack = top.length >= 2;

  // Pack Décision : dépose le projet en mémoire (lu par la page de conviction) et
  // navigue vers la comparaison approfondie payante. Remplace l'ancienne vue
  // intermédiaire « Ce qui les distingue » : ses infos (identité, correspondance,
  // compromis) vivent désormais directement sur les cartes de résultats.
  const onPackDecision = () => {
    if (!outcome?.results?.length) return;
    const trio = topCards(outcome.results);
    try {
      if (parsed) window.localStorage.setItem("futuree:projet:parsed", JSON.stringify(parsed));
      window.localStorage.setItem("futuree:projet:label", submittedText.slice(0, 200));
    } catch {
      // localStorage indisponible : la page de conviction proposera de revenir au comparateur.
    }
    capture("pack_decision_cta_clicked", { count: trio.length });
    const communes = trio.map((r) => r.insee).join(",");
    window.location.href = `/comparateur/pack-decision?communes=${encodeURIComponent(communes)}`;
  };

  const busy = phase === "parsing" || phase === "matching";

  // Auto-scroll vers la zone de sortie. On scrolle sur chaque étape visible d'une
  // recherche lancée par l'utilisateur : `parsing` (feedback immédiat, on suit le
  // spinner) puis `results`/`empty` (la réponse est rendue, on re-cale dessus —
  // car le re-rendu parsing→results déplace le contenu et annulait un scroll
  // déclenché trop tôt). Le flag évite de bouger la page à la réhydratation.
  useEffect(() => {
    if (!searchStartedRef.current) return;
    if (phase === "parsing" || phase === "results" || phase === "empty") {
      const id = requestAnimationFrame(() =>
        outputAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
      return () => cancelAnimationFrame(id);
    }
  }, [phase]);

  // Rotation des phrases d'attente pendant le calcul et le début de la synthèse.
  const rotating = phase === "parsing" || phase === "matching" || (synthesizing && !synthesis);
  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => setPhraseIdx((i) => i + 1), 1900);
    return () => clearInterval(id);
  }, [rotating]);
  const phrasePool = phase === "parsing" ? PARSE_PHRASES : WAITING_PHRASES;
  const waitingPhrase = phrasePool[phraseIdx % phrasePool.length];

  // Placeholder « machine à écrire » : le curseur tape une phrase, marque une pause,
  // l'efface, puis passe à la suivante. Seulement au repos et champ vide, pour ne
  // jamais distraire pendant la frappe ou l'affichage des résultats.
  const rotatingPlaceholder = phase === "idle" && text.length === 0;
  useEffect(() => {
    if (!rotatingPlaceholder) return;
    let phraseI = 0;
    let charI = 0;
    let mode: "typing" | "holding" | "deleting" = "typing";
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const full = PLACEHOLDER_PHRASES[phraseI % PLACEHOLDER_PHRASES.length];
      if (mode === "typing") {
        charI++;
        setTypedPlaceholder(full.slice(0, charI));
        if (charI >= full.length) {
          mode = "holding";
          timer = setTimeout(step, 2600); // pause lecture sur la phrase complète
          return;
        }
        timer = setTimeout(step, 34 + (full[charI - 1] === " " ? 30 : 0));
      } else if (mode === "holding") {
        mode = "deleting";
        timer = setTimeout(step, 40);
      } else {
        charI--;
        setTypedPlaceholder(full.slice(0, Math.max(0, charI)));
        if (charI <= 0) {
          phraseI++;
          mode = "typing";
          timer = setTimeout(step, 420); // courte respiration avant la phrase suivante
          return;
        }
        timer = setTimeout(step, 16); // effacement plus rapide que la frappe
      }
    };
    timer = setTimeout(step, 500);
    return () => clearTimeout(timer);
  }, [rotatingPlaceholder]);

  // Curseur clignotant du placeholder : signale que le champ est un endroit où ÉCRIRE
  // (un primo-arrivant lisait la machine à écrire comme une bannière, pas comme un champ).
  useEffect(() => {
    if (!rotatingPlaceholder) return;
    const blink = setInterval(() => setCaretOn((v) => !v), 530);
    return () => clearInterval(blink);
  }, [rotatingPlaceholder]);

  // Machine à écrire du champ AskFuture : rotation des questions inspirantes
  // (ancrées sur les résultats), tant que le champ est vierge et qu'aucune
  // conversation n'a démarré. Redémarre quand le jeu de résultats change.
  useEffect(() => {
    if (!askRotating) return;
    const pool = askPlaceholdersRef.current;
    if (!pool.length) return;
    let phraseI = 0;
    let charI = 0;
    let mode: "typing" | "holding" | "deleting" = "typing";
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const full = pool[phraseI % pool.length];
      if (mode === "typing") {
        charI++;
        setAskTyped(full.slice(0, charI));
        if (charI >= full.length) {
          mode = "holding";
          timer = setTimeout(step, 2400);
          return;
        }
        timer = setTimeout(step, 34 + (full[charI - 1] === " " ? 28 : 0));
      } else if (mode === "holding") {
        mode = "deleting";
        timer = setTimeout(step, 40);
      } else {
        charI--;
        setAskTyped(full.slice(0, Math.max(0, charI)));
        if (charI <= 0) {
          phraseI++;
          mode = "typing";
          timer = setTimeout(step, 380);
          return;
        }
        timer = setTimeout(step, 16);
      }
    };
    timer = setTimeout(step, 400);
    return () => clearTimeout(timer);
  }, [askRotating, askTopKey]);

  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <header className="mb-9">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent mb-4">
          Un projet de vie ?
        </p>
        <h1
          className="font-[var(--weight-display)] text-[length:var(--text-display)] leading-[1.06] tracking-[-1.2px] text-label"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Découvrez où vivre,{" "}
          <span className="italic text-accent">selon ce qui compte pour vous.</span>
        </h1>
        <p className="mt-5 text-[17px] leading-[1.72] text-muted text-pretty">
          {bindOrphans(
            "futur•e vous aide à identifier les territoires les plus compatibles avec votre projet de vie, en révélant les compromis entre climat, santé, cadre de vie, mobilité et accès aux services.",
          )}
        </p>
      </header>

      {/* ── Champ texte libre ── */}
      <div className="glass rounded-2xl p-5">
        {/* Affordance fixe « c'est un champ où écrire » : un primo-arrivant lisait la
            machine à écrire comme une bannière animée. Étiquette + curseur clignotant. */}
        {rotatingPlaceholder && (
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            <span aria-hidden>✎</span> Écrivez ici
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runParse(text);
          }}
          rows={4}
          maxLength={2000}
          placeholder={rotatingPlaceholder ? `${typedPlaceholder}${caretOn ? "▌" : " "}` : ""}
          className="w-full resize-none bg-transparent text-[16px] leading-[1.7] text-label placeholder:text-ghost outline-none"
          style={{ fontFamily: "var(--font-sans)" }}
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.06em] text-ghost">
            {busy ? "Analyse en cours…" : "⌘ + Entrée pour lancer"}
          </span>
          <button
            onClick={() => runParse(text)}
            disabled={busy || text.trim().length < 3}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {phase === "results" || phase === "empty" ? "Relancer une recherche" : "Explorer mes possibilités"}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* ── Micro-réassurance (crédibilité du socle de données) ── */}
      <p className="mt-3 text-[12px] leading-[1.7] text-ghost">
        Près de 30 critères publics croisés sur les 34 000 communes de France métropolitaine,
        avec les projections climatiques à l&apos;horizon 2050 : chaleur, inondations, qualité
        de l&apos;air, bruit et risques industriels, mais aussi soins, mobilité, services et
        vie locale.
      </p>

      {/* ── Exemples ── */}
      {phase === "idle" && (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex}
              onClick={() => {
                setText(ex);
                capture("life_example_clicked", { example_index: i });
                runParse(ex);
              }}
              className="text-left text-[13px] leading-snug text-muted hover:text-label no-underline border border-[var(--border-2)] hover:border-[var(--border-hi)] rounded-full px-4 py-2 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* ── Amorce « partez d'une commune » (Phase B, discrète, idle seulement) ── */}
      {phase === "idle" && <AnchorAmorce onLaunch={launchFromAnchor} />}

      {/* Ancre de scroll : cible du saut automatique au lancement d'une recherche.
          scroll-mt pour ne pas coller au tout en haut de la fenêtre. */}
      <div ref={outputAnchorRef} className="scroll-mt-6" aria-hidden />

      {/* ── Loading ── */}
      {busy && (
        <div className="mt-10 flex items-center gap-3 text-muted">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[15px]">
            {waitingPhrase}
          </span>
        </div>
      )}

      {/* ── Erreur ── */}
      {phase === "error" && errorMsg && (
        <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-[14px] text-red-200">
          {errorMsg}
        </div>
      )}

      {/* ── Aucun territoire ── */}
      {phase === "empty" && parsed && (
        <div className="mt-12">
          {/* L'interprétation reste visible : l'utilisateur voit ce qui a été compris
              même sans résultat, et peut affiner en connaissance de cause. */}
          <InterpretationPanel
            reformulation={parsed.reformulation}
            criteres={criteres}
            hardZoneLabels={hardZoneLabels}
            prefZoneLabels={prefZoneLabels}
            inspZoneLabels={inspZoneLabels}
            exclLabels={exclLabels}
            reliefLabel={reliefLabel}
            horsMesurePhrases={horsMesurePhrases}
            ambiguities={parsed.ambiguities}
            onRefine={refine}
          />
          <div className="mt-7 rounded-xl border border-[var(--border-2)] bg-[var(--bg-elev)] px-6 py-7">
            <p className="text-[16px] leading-[1.7] text-label">
              {outcome?.message ?? "Aucun territoire ne respecte l'ensemble de vos contraintes. Essayez d'élargir un critère."}
            </p>
          </div>
        </div>
      )}

      {/* ── Résultats ── */}
      {phase === "results" && parsed && (
        <div className="mt-12">
          {/* En-tête d'interprétation compact (« ce que nous avons compris »). On
              le garde mince et au-dessus : la réponse (les territoires) vient juste
              après, comme premier grand événement de la page. Les preuves (zones
              appliquées, synthèse) redescendent SOUS les cartes (appui, pas étape). */}
          <InterpretationPanel
            reformulation={parsed.reformulation}
            criteres={criteres}
            hardZoneLabels={hardZoneLabels}
            prefZoneLabels={prefZoneLabels}
            inspZoneLabels={inspZoneLabels}
            exclLabels={exclLabels}
            reliefLabel={reliefLabel}
            horsMesurePhrases={horsMesurePhrases}
            ambiguities={parsed.ambiguities}
            onRefine={refine}
          />

          {/* Cartes territoires — LE CŒUR DE LA RÉPONSE. Kicker + respiration
              franche pour la détacher comme premier événement, sans surface en plus. */}
          <div className="mt-14">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2">
              Territoires à explorer
            </p>
            <h2
              className="font-normal text-[26px] leading-[1.15] tracking-[-0.4px] text-label mb-2"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Les territoires à regarder.
            </h2>
            <p className="text-[14px] leading-[1.6] text-muted mb-6">
              Les trois pourraient convenir.{" "}
              <span className="italic text-accent">Mais ils ne racontent pas la même histoire.</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {top.map((r, i) => (
                <article
                  key={r.insee}
                  // Élévation RÉELLE : les cartes sont LA réponse, elles doivent se
                  // Élévation RÉELLE via la classe partagée .card-answer (cf. globals.css) :
                  // surface plus claire que les blocs d'appui, bordure nette, ombre + halo
                  // accent + liseré clair. Même traitement que le face-à-face du comparateur.
                  className="card-answer rounded-2xl p-7 flex flex-col"
                >
                  {/* Identité : l'essence du lieu, en tête (remplace « Territoire N »). */}
                  <p className="text-[13px] leading-[1.5] text-accent italic">{r.identite}</p>
                  <h3
                    className="mt-2 font-normal text-[22px] text-label leading-[1.15]"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {r.nom}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {[r.region, departmentName(r.dept)].filter(Boolean).join(" · ")}
                  </p>

                  {/* Correspondance : palier qualitatif + ce qui rapproche du projet
                      (1 confirmation demandée + 1 découverte non demandée, distinct d'une
                      carte à l'autre). Remplace la longue liste de raisons qui se répétait. */}
                  <p className={`mt-4 font-mono text-[9px] tracking-[0.06em] uppercase ${matchTierClass(r.compatibility)}`}>
                    {matchTier(r.compatibility)}
                  </p>
                  {/* LA DURÉE ESTIMÉE. Ce n'est pas un temps réel : le moteur de routage calcule sur son
                      graphe, sans trafic, sans stationnement, sans attente. La phrase le dit (« environ »),
                      et le grain aussi (le point de référence de la commune, pas toute la commune). */}
                  {r.travelMinutes != null && (
                    <p className="mt-1.5 text-[12px] leading-[1.5] text-label/80">
                      Environ {Math.round(r.travelMinutes)} minutes de trajet estimées depuis le point de
                      référence de la commune.
                    </p>
                  )}
                  {/* RETENUE, PAS CONFIRMÉE, et on dit POURQUOI. Le point de référence de cette commune tombe
                      dans la bande de tolérance de la géométrie, et l'itinéraire n'a pas tranché : soit le
                      calcul a échoué, soit nous ne l'avons pas tenté. Les confondre serait un plafond
                      silencieux. Le libellé parle du SEUIL, pas d'un temps : sans itinéraire, nous ne
                      connaissons qu'une position par rapport à une frontière calculée. */}
                  {r.boundary && (
                    <p className="mt-1.5 font-mono text-[9px] tracking-[0.06em] uppercase text-amber-300/80">
                      À la limite du seuil
                      {r.boundaryReason === "routing" ? " · calcul indisponible" : ""}
                    </p>
                  )}
                  {forces(r).length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {forces(r).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-label/90 leading-snug">
                          <span className="text-emerald-400 shrink-0" aria-hidden>+</span>
                          <span>{cap(f)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Compromis : la tension assumée, ce qui distingue le territoire et donne
                      envie de comparer en profondeur. Récit moteur, toujours présent, hors score.
                      Pression éco / logement / littoral restent hors carte (doctrine 2026-06-02)
                      et vivent dans la synthèse, AskFuture et le rapport. */}
                  {r.compromis && (
                    <p className="mt-4 pt-3 border-t border-[var(--border-1)] text-[length:var(--text-caption)] leading-[1.55] text-muted">
                      Compromis : {r.compromis}
                    </p>
                  )}

                  <a
                    href={`/territoire/${r.insee}/debloquer?nom=${encodeURIComponent(r.nom)}&rank=${i + 1}&source=comparateur_vie`}
                    onClick={() => onExplore(r, i + 1)}
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 no-underline text-muted border border-[var(--border-2)] transition-colors hover:border-[var(--border-hi)] hover:text-label"
                  >
                    <span className="font-mono text-[length:var(--text-micro)] tracking-[0.08em] uppercase">
                      Explorer le rapport · 14 €
                    </span>
                    <span aria-hidden>→</span>
                  </a>
                </article>
              ))}
            </div>

          </div>

          {/* Preuve / profondeur SOUS la réponse : la synthèse narrative puis le
              périmètre réellement appliqué. Appui de la réponse, pas étape avant elle. */}
          <div className="mt-7 glass rounded-2xl p-7">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-3">
              Ce que votre recherche révèle
            </p>
            {synthesis ? (
              <p className="text-[16px] leading-[1.8] text-label whitespace-pre-line">
                {synthesis}
                {synthesizing && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-accent/70 animate-pulse" />}
              </p>
            ) : (
              <p className="flex items-center gap-2.5 text-[15px] text-ghost">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {waitingPhrase}
              </p>
            )}
          </div>

          {/* Périmètre assumé, affiché honnêtement. Les ancres dures ont borné la
              recherche (on dit où et selon quel sens) ; les ancres souples l'ont
              seulement inclinée (on le dit sans prétendre à une frontière). */}
          {outcome?.appliedZones?.some((z) => z.strength === "hard") && (
            <p className="mt-3 text-[12px] leading-[1.6] text-ghost">
              Recherche limitée à{" "}
              {outcome.appliedZones.filter((z) => z.strength === "hard").map((z) => z.label).join(", ")} :{" "}
              {outcome.appliedZones.filter((z) => z.strength === "hard").map((z) => z.convention).join(" ; ")}.
            </p>
          )}
          {outcome?.appliedZones?.some((z) => z.strength !== "hard") && (
            <p className="mt-3 text-[12px] leading-[1.6] text-ghost">
              Résultats orientés vers{" "}
              {outcome.appliedZones.filter((z) => z.strength !== "hard").map((z) => z.label).join(", ")}, sans
              s&apos;y limiter.
            </p>
          )}
          {outcome?.appliedPlaces?.length ? (
            <p className="mt-3 text-[12px] leading-[1.6] text-ghost">
              {outcome.appliedPlaces.join(" · ")}.
            </p>
          ) : null}

          {/* CE QUE NOUS N'AVONS PAS PU APPLIQUER. Le moteur sautait en silence une condition qu'il
              n'avait pas su résoudre (« la gare Matabiau » n'est pas un nom de commune), et affichait
              ses résultats comme s'ils respectaient TOUT ce que le lecteur avait posé. Ce n'est pas une
              panne, c'est une limite : elle se dit ici, avec le périmètre, pas dans un bandeau d'erreur. */}
          {outcome?.unappliedConstraints?.length ? (
            <p className="mt-3 text-[12px] leading-[1.6] text-label/70">
              {outcome.unappliedConstraints.length > 1
                ? "Des conditions que vous avez posées n'ont pas pu être appliquées à ces résultats : "
                : "Une condition que vous avez posée n'a pas pu être appliquée à ces résultats : "}
              {outcome.unappliedConstraints.join(", ")}.
            </p>
          ) : null}

          {/* LES DEUX POPULATIONS, JAMAIS FONDUES. Certaines communes sont clairement dans le seuil posé
              par le lecteur ; d'autres sont RETENUES sans avoir pu être tranchées (leur point de référence
              tombe dans la bande de tolérance de la géométrie calculée). Les taire supprimerait des options
              à cause d'une limite de mesure ; les compter avec les autres laisserait croire qu'elles
              respectent la condition. On dit les deux nombres, et on nomme la limite. */}
          {outcome?.boundaryNotice ? (
            <p className="mt-3 text-[12px] leading-[1.6] text-label/70">
              {outcome.boundaryNotice.confirmed > 0
                ? `${outcome.boundaryNotice.confirmed} ${outcome.boundaryNotice.confirmed > 1 ? "communes se situent" : "commune se situe"} dans votre seuil de ${outcome.boundaryNotice.thresholdLabel}. `
                : ""}
              {outcome.boundaryNotice.boundary}{" "}
              {outcome.boundaryNotice.boundary > 1 ? "autres n'ont" : "autre n'a"} pas pu être
              {outcome.boundaryNotice.boundary > 1 ? " tranchées" : " tranchée"} : leur point de référence est
              trop proche de la frontière calculée, et{" "}
              {outcome.boundaryNotice.notRefined > 0
                ? "nous n'avons pas affiné leur itinéraire dans cette recherche"
                : "le calcul d'itinéraire n'a pas abouti"}
              . Elles peuvent convenir, nous ne pouvons pas le confirmer.
            </p>
          ) : null}

          {/* Décider : un seul pont vers la comparaison approfondie payante, juste sous
              les 3 fiches (l'œil vient de voir les options et leurs compromis). L'ancienne
              vue intermédiaire « Ce qui les distingue » est fusionnée dans les cartes. */}
          {canPack && (
            // Pack repérable mais non dominant : plus de halo ni de bordure accent
            // pleine (ils criaient plus fort que la réponse). Il reste identifiable
            // par son label accent et son bouton ; la réponse garde la priorité.
            <div className="mt-8 glass rounded-2xl p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1.5">
                  Pack Décision · 39 €
                </p>
                <h3
                  className="font-normal text-[21px] leading-[1.2] text-label"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  Comparer les trois en profondeur.
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-muted max-w-[520px]">
                  Les trois côte à côte là où elles se départagent vraiment, et ce qu&apos;elles
                  deviennent, pas seulement ce qu&apos;elles sont aujourd&apos;hui. Vos questions
                  trouvent une réponse, et de nouvelles pistes pour le même projet si aucune des
                  trois ne tranche.
                </p>
              </div>
              <button
                onClick={onPackDecision}
                className="group relative overflow-hidden shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] transition-shadow duration-300 hover:shadow-[0_8px_30px_-6px_var(--orange)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {/* Reflet premium qui balaie au survol */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.35] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <span className="relative inline-flex items-center gap-2">
                  Comparer en profondeur
                  <span aria-hidden>→</span>
                </span>
              </button>
            </div>
          )}

          {/* Bloc 1 — comprendre les arbitrages derrière le classement (pas « une IA ») */}
          <section className="mt-12 glass rounded-2xl p-7">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">
              Lire les arbitrages
            </p>
            <h2
              className="font-normal text-[22px] text-label mb-1.5"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Pourquoi ces territoires ressortent ?
            </h2>
            <p className={`text-[14px] text-muted leading-[1.65] text-pretty ${askRemaining > 0 ? "mb-1.5" : "mb-5"}`}>
              {askRemaining > 0
                ? bindOrphans("Posez une question sur les territoires proposés, les compromis identifiés ou leur évolution future.")
                : bindOrphans("Pour aller plus loin, ouvrez le rapport d'un de ces territoires.")}
            </p>
            {askRemaining > 0 && (
              <p className="text-[11px] text-ghost mb-5">
                {askRemaining} question{askRemaining > 1 ? "s" : ""}{" "}
                {askRemaining > 1 ? "gratuites" : "gratuite"}.
              </p>
            )}

            {/* Chips de questions suggérées */}
            {!askLimit && askChips.length > 0 && (
              <div className="flex flex-nowrap gap-2 mb-5 overflow-x-auto">
                {askChips.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendAsk(q)}
                    disabled={askLoading}
                    className="shrink-0 whitespace-nowrap text-left text-[length:var(--text-caption)] leading-snug text-muted hover:text-label border border-[var(--border-2)] hover:border-accent/[0.4] rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {askMessages.length > 0 && (
              <div className="flex flex-col gap-3 mb-5">
                {askMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={
                      m.role === "user"
                        ? "self-end max-w-[85%] rounded-xl bg-accent/[0.1] border border-accent/[0.18] px-4 py-2.5 text-[14px] text-label"
                        : "self-start max-w-[92%] rounded-xl bg-[var(--bg-elev)] border border-[var(--border-1)] px-4 py-3 text-[14px] leading-[1.7] text-label"
                    }
                  >
                    {m.content}
                  </div>
                ))}
                {askLoading && (
                  <div className="self-start flex items-center gap-2 text-ghost text-[13px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    futur•e réfléchit…
                  </div>
                )}
              </div>
            )}

            {routesNudge && !askLimit && (
              <p className="mb-4 text-[13px] leading-[1.6] text-muted border-l-2 border-accent/[0.4] pl-3">
                Cette lecture précise appartient au rapport du territoire. Ouvrez-le pour les chiffres et les projections.
              </p>
            )}

            {askLimit ? (
              <div className="rounded-xl border border-accent/[0.25] bg-accent/[0.05] px-5 py-4">
                <p className="text-[14px] leading-[1.6] text-label">
                  {bindOrphans(`Vous avez utilisé vos ${FREE_ASK} questions gratuites. Le rapport complet d'un territoire prend le relais pour passer d'une intuition à une décision éclairée.`)}
                </p>
              </div>
            ) : (
              <div className="flex items-end gap-2.5">
                <textarea
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendAsk();
                    }
                  }}
                  rows={1}
                  placeholder={askRotating ? `${askTyped}▌` : "Posez votre question sur ces territoires…"}
                  className="flex-1 resize-none bg-[var(--bg-elev)] border border-[var(--border-2)] rounded-lg px-4 py-3 text-[14px] text-label placeholder:text-ghost outline-none focus:border-accent/[0.4]"
                  style={{ fontFamily: "var(--font-sans)" }}
                />
                <button
                  onClick={() => sendAsk()}
                  disabled={askLoading || askInput.trim().length < 3}
                  className="shrink-0 px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Demander
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
