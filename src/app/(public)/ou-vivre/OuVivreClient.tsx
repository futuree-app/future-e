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
import { AUTO_SYNTHESIS } from "@/lib/auto-synthesis";
import { CompareView } from "./CompareView";

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

// Rythme séquentiel voulu : on sépare le moment « ce produit m'a compris »
// (phase "confirm", on montre la reformulation et on attend OK/Affiner) du
// moment « ce produit réfléchit » (phase "matching" puis synthèse).
type Phase = "idle" | "parsing" | "confirm" | "matching" | "results" | "empty" | "error";

type AskMessage = { role: "user" | "assistant"; content: string };

const FREE_ASK = 2;

// Typographie FR robuste (y compris Safari, qui ignore text-wrap: pretty) : on lie
// par une espace insécable les « petits mots » au mot suivant (une ligne ne doit
// pas se terminer par « les », « leur », « et », « à »…) et la ponctuation haute
// (: ; ! ? ») au mot précédent. Évite les coupures en plein milieu d'un groupe.
const ORPHAN_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "à", "au", "aux", "et", "ou",
  "en", "ce", "ces", "son", "sa", "ses", "leur", "leurs", "ma", "mon", "mes", "ta", "ton",
  "tes", "notre", "votre", "nos", "vos", "par", "pour", "sur", "sans", "qui", "que", "qu",
  "ne", "si", "l",
]);
const HIGH_PUNCT = new Set([":", ";", "!", "?", "»"]);
function bindOrphans(text: string): string {
  const parts = text.split(" ");
  return parts
    .map((w, i) => {
      if (i === parts.length - 1) return w;
      const bare = w.toLowerCase().replace(/[.,:;!?«»()]/g, "");
      const bind = ORPHAN_WORDS.has(bare) || HIGH_PUNCT.has(parts[i + 1]);
      return w + (bind ? " " : " ");
    })
    .join("");
}

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

// Cartes affichées : on prend les 3 premiers territoires DANS L'ORDRE du moteur.
// Le moteur fait désormais tout l'étalement (diversité par région/département, et
// étalement échelonné quand une ancre est préférée : zone dominante + 1 ouverture).
// La dé-dup client d'avant (par région/département) faisait doublon et écrasait
// l'étalement échelonné : on fait confiance au serveur.
function topCards(results: MatchResult[] | undefined | null): MatchResult[] {
  return (results ?? []).slice(0, 3);
}

// Palier qualitatif de correspondance, à la place d'un score chiffré : le %
// brut est instable (parse non déterministe) et tassé en haut (tout entre 83 et
// 98), donc faussement précis. Le palier dit la force sans fausse précision.
function matchTier(compatibility: number): string {
  if (compatibility >= 80) return "Forte correspondance";
  if (compatibility >= 65) return "Bonne correspondance";
  return "Correspondance partielle";
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

export function OuVivreClient() {
  const [text, setText] = useState("");
  const [submittedText, setSubmittedText] = useState(""); // texte parsé, réutilisé pour la synthèse
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [parsed, setParsed] = useState<ParsedProject | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [view, setView] = useState<"results" | "compare">("results");

  const [synthesis, setSynthesis] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");

  // AskFuture comparateur
  const [askMessages, setAskMessages] = useState<AskMessage[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askRemaining, setAskRemaining] = useState(FREE_ASK);
  const [askLimit, setAskLimit] = useState(false);
  const [routesNudge, setRoutesNudge] = useState(false);
  const [askTyped, setAskTyped] = useState("");

  const runSeq = useRef(0); // garde-fou contre les réponses obsolètes (re-submit)

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

  // ── Étape 1 : PARSE → gate de confirmation (« ce produit m'a compris ») ────
  const runParse = useCallback(async (input: string) => {
    const project = input.trim();
    if (project.length < 3) return;

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
      setParsed(data.parsed as ParsedProject);
      setPhase("confirm"); // on s'arrête : l'utilisateur valide ou affine
    } catch {
      if (seq !== runSeq.current) return;
      capture("life_parse_failed");
      setErrorMsg("Nous n'avons pas réussi à lire ce projet. Reformulez-le en une ou deux phrases.");
      setPhase("error");
    }
  }, []);

  // ── Étape 2 : MATCH + SYNTHÈSE (« ce produit réfléchit à ma situation ») ───
  const runMatch = useCallback(async () => {
    if (!parsed) return;
    const seq = ++runSeq.current;
    capture("life_project_confirmed");

    setPhase("matching");
    let matchOutcome: MatchOutcome;
    try {
      const r = await fetch("/api/comparateur-vie/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed }),
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

    // SYNTHÈSE (streamée, non bloquante pour les cartes). Auto seulement si AUTO_SYNTHESIS ;
    // sinon l'utilisateur la déclenche via le bouton « Générer » (generateSynthesis).
    if (AUTO_SYNTHESIS) {
      void streamSynthesis(seq, submittedText, parsed, top, {
        perfectMatch: matchOutcome.perfectMatch,
        message: matchOutcome.message,
        perimetre: matchOutcome.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label),
        orientation: matchOutcome.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label),
      });
    }
  }, [parsed, submittedText, streamSynthesis]);

  // Affiner : revenir à l'édition du texte sans perdre ce qui est saisi.
  const refine = useCallback(() => {
    runSeq.current++; // invalide tout flux en cours
    setParsed(null);
    setPhase("idle");
    capture("life_project_refine");
  }, []);

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

  // Déclenchement manuel de la synthèse (quand l'auto est coupé, cf. AUTO_SYNTHESIS).
  // Rejoue le corps du useEffect à partir de l'état courant (outcome déjà calculé).
  const generateSynthesis = useCallback(() => {
    if (!parsed || !outcome?.results?.length) return;
    void streamSynthesis(runSeq.current, submittedText, parsed, topCards(outcome.results), {
      perfectMatch: outcome.perfectMatch,
      message: outcome.message,
      perimetre: outcome.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label),
      orientation: outcome.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label),
    });
  }, [parsed, outcome, submittedText, streamSynthesis]);

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
  };

  const canCompare = top.length >= 2;

  const onCompare = () => {
    capture("life_compare_clicked", { count: top.length });
    setView("compare");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const busy = phase === "parsing" || phase === "matching";

  // Rotation des phrases d'attente pendant le calcul et le début de la synthèse.
  const rotating = phase === "matching" || (synthesizing && !synthesis);
  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => setPhraseIdx((i) => i + 1), 1900);
    return () => clearInterval(id);
  }, [rotating]);
  const waitingPhrase = WAITING_PHRASES[phraseIdx % WAITING_PHRASES.length];

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

  // Révélateur d'arbitrages : vue en place, réutilise outcome déjà calculé (pas de
  // recalcul, le projet vit en mémoire client). cf. spec 2026-06-05-comparateur-3.
  if (view === "compare" && outcome?.results?.length) {
    return (
      <div className="pt-16">
        <CompareView
          results={outcome.results}
          onBack={() => setView("results")}
          onExploreReport={(r, rang) => {
            onExplore(r, rang);
            window.location.href = `/territoire/${r.insee}/debloquer?nom=${encodeURIComponent(r.nom)}&rank=${rang}&source=comparateur_3`;
          }}
          onPackDecision={() => capture("pack_decision_waitlist_clicked", { count: top.length })}
        />
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <header className="mb-9">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent mb-4">
          Un projet de vie ?
        </p>
        <h1
          className="font-normal text-[clamp(34px,5vw,56px)] leading-[1.06] tracking-[-1.2px] text-label"
          style={{ fontFamily: "'Instrument Serif', serif" }}
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
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runParse(text);
          }}
          rows={4}
          maxLength={2000}
          placeholder={rotatingPlaceholder ? `${typedPlaceholder}▌` : ""}
          className="w-full resize-none bg-transparent text-[16px] leading-[1.7] text-label placeholder:text-ghost outline-none"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.06em] text-ghost">
            {busy ? "Analyse en cours…" : "⌘ + Entrée pour lancer"}
          </span>
          <button
            onClick={() => runParse(text)}
            disabled={busy || text.trim().length < 3}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Instrument Sans', sans-serif" }}
          >
            {phase === "confirm" || phase === "results" ? "Relancer une recherche" : "Explorer mes possibilités"}
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
              className="text-left text-[13px] leading-snug text-muted hover:text-label no-underline border border-white/[0.1] hover:border-white/[0.2] rounded-full px-4 py-2 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {busy && (
        <div className="mt-10 flex items-center gap-3 text-muted">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[15px]">
            {phase === "parsing" ? "Nous lisons votre projet…" : waitingPhrase}
          </span>
        </div>
      )}

      {/* ── Gate de confirmation : « ce produit m'a compris » ── */}
      {phase === "confirm" && parsed && (
        <div className="mt-9 glass rounded-2xl p-7">
          {/* Ce que nous avons compris */}
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-3">
            <span className="text-emerald-400">✓</span> Ce que nous avons compris
          </p>
          <p
            className="text-[19px] leading-[1.6] text-label"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {parsed.reformulation}
          </p>

          {/* Les critères identifiés */}
          {criteres.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">
                <span className="text-emerald-400">✓</span> Les critères identifiés
              </p>
              {/* N1 : puces seules. N2 : une puce à nuance porte un soulignement
                  pointillé + bulle positive au survol/tap (ChipTooltip) ; les évidentes
                  restent nues. Pur affichage, aucun impact sur le score. Les limites
                  méthodologiques vivent dans le rapport, pas ici. */}
              <div className="flex flex-wrap gap-2">
                {criteres.map((c) =>
                  c.tooltip ? (
                    <ChipTooltip key={c.label} label={c.label} text={c.tooltip} />
                  ) : (
                    <span
                      key={c.label}
                      className="text-[12px] text-label/90 border border-white/[0.12] rounded-full px-3 py-1"
                    >
                      {c.label}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Périmètre géographique avec gradient de force : l'ancre définit ou
              incline l'espace de recherche, distinct des préférences. On distingue
              visuellement dure (filtre), préférée (penchant) et inspiration. */}
          {(zoneAnchors.length > 0 || exclLabels.length > 0 || reliefLabel) && (
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
                    className="text-[12px] text-muted border border-white/[0.1] rounded-full px-3 py-1"
                  >
                    ouvert à : {z}
                  </span>
                ))}
                {exclLabels.map((z) => (
                  <span
                    key={z}
                    className="text-[12px] text-muted border border-white/[0.12] rounded-full px-3 py-1"
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
                    className="flex items-baseline gap-1 pl-1 text-[12.5px] leading-snug text-label/55 italic"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
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
          {((parsed.ambiguities && parsed.ambiguities.length > 0) ||
            horsMesurePhrases.length > 0) && (
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
                {parsed.ambiguities?.map((a, i) => (
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

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={runMatch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
              style={{ fontFamily: "'Instrument Sans', sans-serif" }}
            >
              Lancer l&apos;analyse
              <span aria-hidden>→</span>
            </button>
            <button
              onClick={refine}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[14px] text-muted hover:text-label border border-white/[0.12] hover:border-white/[0.22] transition-colors"
            >
              Modifier ma demande
            </button>
          </div>
        </div>
      )}

      {/* ── Erreur ── */}
      {phase === "error" && errorMsg && (
        <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-[14px] text-red-200">
          {errorMsg}
        </div>
      )}

      {/* ── Aucun territoire ── */}
      {phase === "empty" && (
        <div className="mt-10 rounded-xl border border-white/[0.1] bg-white/[0.03] px-6 py-7">
          <p className="text-[16px] leading-[1.7] text-label">
            {outcome?.message ?? "Aucun territoire ne respecte l'ensemble de vos contraintes. Essayez d'élargir un critère."}
          </p>
        </div>
      )}

      {/* ── Résultats ── */}
      {phase === "results" && parsed && (
        <div className="mt-12">
          {/* Rappel discret du projet (déjà confirmé au gate) */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[13px] leading-[1.6] text-ghost max-w-[640px]">
              {parsed.reformulation}
            </p>
            <button
              onClick={refine}
              className="shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase text-muted hover:text-label border border-white/[0.12] rounded-lg px-3 py-1.5"
            >
              Affiner
            </button>
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

          {/* Synthèse */}
          <div className="mt-7 glass rounded-2xl p-7">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-3">
              Ce que votre recherche révèle
            </p>
            {synthesis ? (
              <p className="text-[16px] leading-[1.8] text-label whitespace-pre-line">
                {synthesis}
                {synthesizing && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-accent/70 animate-pulse" />}
              </p>
            ) : !AUTO_SYNTHESIS && !synthesizing ? (
              <button
                type="button"
                onClick={generateSynthesis}
                className="text-[14px] text-label border border-accent/40 bg-accent/[0.08] rounded-full px-4 py-2 hover:bg-accent/[0.14] transition-colors"
              >
                Générer la synthèse
              </button>
            ) : (
              <p className="flex items-center gap-2.5 text-[15px] text-ghost">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {waitingPhrase}
              </p>
            )}
          </div>

          {/* Cartes territoires */}
          <div className="mt-9">
            <h2
              className="font-normal text-[24px] leading-[1.2] tracking-[-0.4px] text-label mb-5"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Les territoires à regarder.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {top.map((r, i) => (
                <article
                  key={r.insee}
                  className="glass rounded-2xl p-7 flex flex-col"
                  style={{ borderTop: "2px solid var(--accent)" }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="font-mono text-[10px] tracking-[0.1em] text-ghost uppercase">
                      Territoire {i + 1}
                    </p>
                    <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-accent/80">
                      {matchTier(r.compatibility)}
                    </span>
                  </div>
                  <h3
                    className="font-normal text-[22px] text-label leading-[1.15]"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    {r.nom}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {[r.region, r.dept].filter(Boolean).join(" · ")}
                  </p>

                  {/* Signature territoriale : image du lieu (géo · bassin ·
                      climat), distincte des raisons de score. Pose le décor avant
                      la justification du match. Cf. buildSignature (moteur). */}
                  {r.signature.length > 0 && (
                    <p className="mt-3 text-[12px] leading-[1.5] text-label/65">
                      {r.signature.join(" · ")}
                    </p>
                  )}

                  {/* Trait distinctif (ce qui démarque la commune des autres) : volontairement
                      ABSENT de cette liste. Démarquer les trois territoires les uns des autres
                      est le rôle du comparateur (CompareView), pas de la première vue. Le champ
                      r.distinctive reste calculé côté moteur (réservé synthèse/AskFuture). */}
                  {r.reasons.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-1.5">
                      {r.reasons.map((reason) => (
                        <li key={reason} className="flex items-start gap-2 text-[13px] text-label/90 leading-snug">
                          <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}

                  {r.tradeoff && (
                    <p className="mt-3 text-[12px] leading-[1.5] text-ghost">
                      Compromis : {r.tradeoff}
                    </p>
                  )}

                  {/* Pression climatique sur l'économie locale : note de lecture
                      prudente, NARRATIVE, distincte des raisons/compromis scorés.
                      N'a pas pesé dans le classement. */}
                  {r.pressionEco && (
                    <p className="mt-3 text-[12px] leading-[1.5] text-amber-300/70">
                      À noter : {r.pressionEco.note}
                    </p>
                  )}

                  {/* Logement et littoral : NE PAS afficher sur les cartes (doctrine
                      2026-06-02). Ils enrichissent la décision mais n'expliquent pas le
                      classement. Conservés dans le payload de synthèse et le contexte
                      AskFuture ; le détail vit au rapport. */}

                  <a
                    href={`/territoire/${r.insee}/debloquer?nom=${encodeURIComponent(r.nom)}&rank=${i + 1}&source=comparateur_vie`}
                    onClick={() => onExplore(r, i + 1)}
                    className="group relative mt-7 flex flex-col items-center gap-1 overflow-hidden rounded-xl px-4 py-3 no-underline text-accent border border-accent/[0.35] bg-accent/[0.08] transition-all duration-300 hover:bg-accent/[0.16] hover:border-accent/[0.6] hover:shadow-[0_8px_30px_-6px_var(--accent)]"
                  >
                    {/* Reflet premium qui balaie au survol */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.22] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                    />
                    <span className="relative text-center font-mono text-[10.5px] tracking-[0.08em] uppercase">
                      Découvrir ce territoire
                    </span>
                    <span className="relative text-center font-mono text-[8.5px] tracking-[0.04em] text-accent/70">
                      Rapport complet interactif · 14 €
                    </span>
                  </a>
                </article>
              ))}
            </div>

            {/* Garde-fou wording : on rappelle, une fois, que ce signal ne dit pas
                l'avenir du territoire (la capacité d'adaptation n'est pas mesurée). */}
            {top.some((r) => r.pressionEco) && (
              <p className="mt-5 text-[11px] leading-[1.6] text-ghost/80 max-w-[640px]">
                Les notes « À noter » signalent une dépendance économique à des activités
                sensibles au climat. Elles ne mesurent pas la capacité d&apos;adaptation du
                territoire et ne préjugent pas de son avenir.
              </p>
            )}

          </div>

          {/* Décider : pont vers le révélateur d'arbitrages, juste sous les 3 fiches
              (le moment où l'œil vient de voir les options). Avant AskFuture. */}
          {canCompare && (
            <div
              className="mt-8 glass rounded-2xl p-7 flex flex-col md:flex-row md:items-center justify-between gap-5"
              style={{ borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }}
            >
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1.5">
                  Comparer
                </p>
                <h3
                  className="font-normal text-[21px] leading-[1.2] text-label"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Mettre les territoires côte à côte.
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-muted max-w-[520px]">
                  Comparez leurs points forts, leurs fragilités et leurs trajectoires pour
                  identifier celui qui correspond le mieux à votre projet.
                </p>
              </div>
              <button
                onClick={onCompare}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
                style={{ fontFamily: "'Instrument Sans', sans-serif" }}
              >
                Comparer ces territoires
                <span aria-hidden>→</span>
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
              style={{ fontFamily: "'Instrument Serif', serif" }}
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
                    className="shrink-0 whitespace-nowrap text-left text-[12.5px] leading-snug text-muted hover:text-label border border-white/[0.12] hover:border-accent/[0.4] rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-40"
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
                        : "self-start max-w-[92%] rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[14px] leading-[1.7] text-label"
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
                  className="flex-1 resize-none bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-3 text-[14px] text-label placeholder:text-ghost outline-none focus:border-accent/[0.4]"
                  style={{ fontFamily: "'Instrument Sans', sans-serif" }}
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
