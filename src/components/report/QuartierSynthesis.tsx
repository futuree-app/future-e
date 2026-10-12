"use client";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA SYNTHÈSE TERRITOIRE (FUT-6, 28/09/2026).
//
// GÉNÉRIQUE : elle répond à « que raconte ce territoire, indépendamment de mon projet ? ». Elle ne
// dépend que des faits du lieu (le `FactsSnapshot` de la page) et de l'horizon. Les repères de terrain,
// les attentes de découverte et la relation au lieu ne la modifient plus : ils appartiendront à la
// future « Lecture pour votre projet ». Leurs données restent en base, intactes.
//
// DEUX NIVEAUX, JAMAIS UN TEXTE NON CONTRÔLÉ :
//   - la synthèse DÉTERMINISTE, calculée côté serveur depuis le snapshot, visible tout de suite ;
//   - la lecture ENRICHIE (modèle), servie depuis le cache ou préparée en arrière-plan, et affichée
//     seulement une fois validée par les contrôles. Plus de texte qui s'écrit mot à mot.
// La logique d'affichage est pure et testée : src/lib/territoire/synthesis-display.ts.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useReducer, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useHorizon, HORIZON_META, type HorizonKey } from "@/hooks/useHorizon";
import type { QuartierSourceKey } from "@/lib/territoire/screen";
import {
  displayReducer, eventFromAnswer, initialDisplay, ligneEtatLecture,
  type DisplayEvent, type DisplayState, type SynthesisAnswer,
} from "@/lib/territoire/synthesis-display";

const HORIZON_PILLS: { key: HorizonKey; year: string; recommended?: boolean }[] = [
  { key: "gwl15", year: "2030" },
  { key: "gwl20", year: "2050", recommended: true },
  { key: "gwl30", year: "2100" },
];
const HORIZON_KEYS: HorizonKey[] = ["gwl15", "gwl20", "gwl30"];

/** Relance d'une lecture en préparation, et abandon au-delà (la déterministe reste affichée). */
const POLL_MS = 4000;
const POLL_GIVE_UP_MS = 210_000;

type Props = {
  communeName: string | null;
  inseeCode: string | null;
  /** L'empreinte du snapshot rendu par la page. `null` = persistance indisponible : pas d'enrichi. */
  snapshotHash: string | null;
  /** La synthèse déterministe, par horizon, calculée côté serveur depuis le même snapshot. */
  deterministic: Record<HorizonKey, string>;
  /** Les lectures enrichies déjà validées et en cache, par horizon. */
  initialEnriched: Partial<Record<HorizonKey, string>>;
  /** Liste des sources mobilisées, lue dans le même snapshot, par horizon. */
  sourcesByHorizon: Record<HorizonKey, QuartierSourceKey[]>;
};

type ByHorizon = Record<HorizonKey, DisplayState>;
type Action = { horizon: HorizonKey; event: DisplayEvent };

function reducer(state: ByHorizon, a: Action): ByHorizon {
  const next = displayReducer(state[a.horizon], a.event);
  return next === state[a.horizon] ? state : { ...state, [a.horizon]: next };
}

type ApiAnswer = SynthesisAnswer;

export default function QuartierSynthesis({
  communeName,
  inseeCode,
  snapshotHash,
  deterministic,
  initialEnriched,
  sourcesByHorizon,
}: Props) {
  const [horizon, setHorizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const posthog = usePostHog();
  const sources = sourcesByHorizon[horizon];

  const [byHorizon, dispatch] = useReducer(
    reducer,
    null,
    () => Object.fromEntries(HORIZON_KEYS.map((h) => [h, initialDisplay(initialEnriched[h] ?? null, deterministic[h])])) as ByHorizon,
  );
  const state = byHorizon[horizon];

  function switchHorizon(next: HorizonKey) {
    if (next === horizon) return;
    posthog?.capture("report_scenario_changed", {
      scenario: HORIZON_META[next].year,
      from_scenario: HORIZON_META[horizon].year,
      to_scenario: HORIZON_META[next].year,
      module_id: "quartier",
      source: "inline_synthesis",
      commune: communeName,
      insee_code: inseeCode,
    });
    setHorizon(next);
  }

  // ─── Lecture enrichie : demandée une fois par horizon, jamais streamée ──────────────────
  const statusRef = useRef(state.status);
  useEffect(() => { statusRef.current = state.status; });
  // FUT-75 : le temps réellement écoulé depuis la demande, relu tous les 5 s pendant la préparation.
  // Il n'est dit qu'au-delà de 10 s (`ligneEtatLecture`) : un repère pour l'attente longue, pas un chronomètre.
  const debutRef = useRef(0);
  const [ecoule, setEcoule] = useState(0);
  useEffect(() => {
    if (state.status !== "preparing" || state.shown !== "deterministic") return;
    const t = setInterval(() => setEcoule(Date.now() - debutRef.current), 5000);
    return () => clearInterval(t);
  }, [state.status, state.shown, horizon]);
  useEffect(() => {
    if (!snapshotHash || !inseeCode || statusRef.current !== "preparing") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    debutRef.current = startedAt;
    const h = horizon;

    // FUT-76 : `ready` ne suffit pas. L'événement se décide dans `eventFromAnswer` (pur, testé) : un
    // repli déterministe, ou une origine inconnue, reste une lecture enrichie INDISPONIBLE.
    const settle = (a: ApiAnswer): boolean => {
      const event = eventFromAnswer(a, deterministic[h]);
      if (!event) return false;
      dispatch({ horizon: h, event });
      if (event.type === "enrichedArrived") {
        posthog?.capture("quartier_ai_summary_completed", { commune: communeName, insee_code: inseeCode, horizon: h, origin: a.status === "ready" ? a.origin : null });
      }
      return true;
    };

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_GIVE_UP_MS) {
        dispatch({ horizon: h, event: { type: "enrichedUnavailable" } });
        return;
      }
      try {
        const res = await fetch(`/api/synthesize-quartier?snapshot=${encodeURIComponent(snapshotHash)}&horizon=${h}`);
        if (cancelled) return;
        // Une réponse d'erreur est TERMINALE : on ne relance pas pendant des minutes une lecture qui
        // n'arrivera pas. La synthèse déterministe reste affichée.
        if (!res.ok) { dispatch({ horizon: h, event: { type: "enrichedUnavailable" } }); return; }
        const a = (await res.json()) as ApiAnswer;
        if (cancelled || settle(a)) return;
      } catch {
        /* réseau : on retente au prochain tour */
      }
      timer = setTimeout(poll, POLL_MS);
    };

    (async () => {
      try {
        // POST : sert le cache, ou lance la génération si personne ne la prépare déjà.
        const res = await fetch("/api/synthesize-quartier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshotHash, horizon: h }),
        });
        if (cancelled) return;
        // 401, 403, 404, 429, 503 (et toute autre erreur) sont TERMINALES : un 429 n'est pas une
        // génération en cours, et ne doit pas déclencher trois minutes de relances.
        if (!res.ok) {
          dispatch({ horizon: h, event: { type: "enrichedUnavailable" } });
          posthog?.capture("quartier_ai_summary_unavailable", { commune: communeName, insee_code: inseeCode, horizon: h, http_status: res.status });
          return;
        }
        const a = (await res.json().catch(() => ({ status: "unavailable" }))) as ApiAnswer;
        if (cancelled || settle(a)) return;
      } catch {
        if (cancelled) return;
      }
      timer = setTimeout(poll, POLL_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon, snapshotHash, inseeCode]);

  // ─── Pas de commune ────────────────────────────────────────────────────
  if (!inseeCode || !communeName) {
    return (
      <div className="glass rounded-xl p-8 border-t-2 border-t-info">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-3">
          Lecture territoriale · horizon {meta.year}
        </p>
        <p className="text-[16px] leading-[1.75] text-muted">
          Renseignez votre commune dans votre profil pour accéder à la lecture de votre territoire.
        </p>
      </div>
    );
  }

  const text = state.shown === "enriched" && state.enrichedText ? state.enrichedText : deterministic[horizon];
  const parsed = parseSynthesis(text);

  return (
    <div>
      <div className="glass rounded-xl p-8 md:p-10 border-t-2 border-t-info">
        <h2
          className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] tracking-[-0.5px] mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          <span className="italic text-label">{parsed.title ?? `${communeName} à l'horizon ${meta.year}`}</span>
        </h2>

        {/* Mini-nav horizons — discrète, sous le titre */}
        <div className="quartier-horizon-nav mb-8">
          <span className="quartier-horizon-label">Comparer avec</span>
          <div className="quartier-horizon-pills">
            {HORIZON_PILLS.map((h) => {
              const active = h.key === horizon;
              return (
                <button
                  key={h.key}
                  type="button"
                  onClick={() => switchHorizon(h.key)}
                  className="quartier-horizon-pill"
                  data-active={active ? "true" : "false"}
                  title={h.recommended ? "Horizon recommandé" : undefined}
                >
                  {h.year}
                  {h.recommended && !active && (
                    <span className="quartier-horizon-dot" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* L'état de la lecture, dit sobrement : la lecture immédiate est une vraie lecture, pas un
            brouillon ; la version enrichie est proposée, jamais substituée d'office. */}
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mb-4">
          {state.shown === "enriched" ? "Lecture enrichie" : "Lecture immédiate"}
        </p>
        <div key={`${horizon}:${state.shown}`} className="quartier-synthesis-text">
          {parsed.blocks.map((b, i) => (
            <div key={i} className={i > 0 ? "mt-6" : ""}>
              {b.caption && (
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-info/80 mb-2.5">
                  {b.caption}
                </p>
              )}
              <p className="text-[16px] leading-[1.75] text-muted">{b.text}</p>
            </div>
          ))}
        </div>

        {/* FUT-75 · UNE SEULE LIGNE D'ÉTAT, QUI CHANGE DE FONCTION. Elle dit la préparation (sans
            pourcentage ni temps restant), devient la proposition quand une lecture validée attend, puis
            le retour à la lecture immédiate. Jamais d'écran d'attente : la lecture affichée se suffit. */}
        {(() => {
          const ligne = snapshotHash || state.shown === "enriched" ? ligneEtatLecture(state, ecoule) : null;
          if (!ligne) return null;
          const actionnable = ligne.type === "proposition" || ligne.type === "retour";
          return (
            <div className="lecture-etat" aria-live="polite">
              {actionnable ? (
                <button
                  // MÊME BOUTON pour « l'afficher » et « revenir » : le focus clavier reste en place.
                  key="action"
                  type="button"
                  className="lecture-etat-bouton"
                  onClick={() => {
                    if (ligne.type === "retour") { dispatch({ horizon, event: { type: "showDeterministic" } }); return; }
                    dispatch({ horizon, event: { type: "showEnriched" } });
                    posthog?.capture("quartier_ai_summary_opened", { commune: communeName, insee_code: inseeCode, horizon });
                  }}
                >
                  <span aria-hidden className="lecture-etat-repere" data-pret={ligne.type === "proposition" || undefined} />
                  {ligne.texte}
                </button>
              ) : (
                <p key={ligne.type} className="lecture-etat-texte">
                  <span aria-hidden className="lecture-etat-repere" />
                  {ligne.texte}
                </p>
              )}
            </div>
          );
        })()}

        {sources.length > 0 && (
          <p className="mt-6 font-mono text-[10px] tracking-[0.1em] uppercase text-ghost">
            <span className="font-bold">Sources</span> · {sources.join(" · ")}
          </p>
        )}
      </div>

      <style>{`
        /* FUT-75 · grammaire commune (jetons --m-*, design-tokens.css). Le contenu s'échange d'un bloc
           (fondu et flou court), la ligne d'état change de fonction sans saut, rien ne pulse. */
        .lecture-etat { margin-top: 24px; min-height: 40px; display: flex; align-items: center; }
        .lecture-etat-texte, .lecture-etat-bouton {
          display: inline-flex; align-items: center; gap: 10px; font-size: 12.5px; line-height: 1.45;
          animation: lecture-bascule var(--m-bascule) var(--m-releve) both;
        }
        .lecture-etat-texte { color: var(--ghost); margin: 0; }
        .lecture-etat-bouton {
          font-family: inherit; font-weight: 500; color: var(--fg-hi); cursor: pointer; min-height: 40px;
          padding: 8px 15px; border-radius: 999px; background: transparent;
          border: 1px solid var(--reg-controle);
          transition: background-color var(--m-geste) ease, transform var(--m-pression) ease;
          touch-action: manipulation;
        }
        .lecture-etat-bouton:hover { background: var(--reg-controle-surface); }
        .lecture-etat-bouton:active { transform: scale(0.97); transition: transform var(--m-ressort-duree) var(--m-ressort); }
        .lecture-etat-bouton:focus-visible { outline: 2px solid var(--fg-hi); outline-offset: 2px; }
        .lecture-etat-repere { flex: none; width: 8px; height: 8px; border-radius: 2px; border: 1.5px solid var(--reg-controle); transform: rotate(45deg); }
        .lecture-etat-repere[data-pret] { background: var(--reg-controle); }
        .quartier-synthesis-text {
          animation: lecture-bascule var(--m-bascule) var(--m-releve) both;
        }
        @keyframes lecture-bascule {
          from { opacity: 0; filter: blur(2px); }
          to { opacity: 1; filter: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .quartier-synthesis-text, .lecture-etat-texte, .lecture-etat-bouton { animation: none; }
        }
        .quartier-horizon-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .quartier-horizon-label {
          font-family:var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b7388;
        }
        .quartier-horizon-pills {
          display: inline-flex;
          gap: 4px;
          padding: 3px;
          background: var(--bg-elev);
          border: 1px solid var(--border-1);
          border-radius: 100px;
        }
        .quartier-horizon-pill {
          position: relative;
          padding: 5px 12px;
          background: transparent;
          border: none;
          border-radius: 100px;
          color: #9ba3b4;
          font-family:var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s;
        }
        .quartier-horizon-pill:hover:not(:disabled):not([data-active="true"]) {
          color: #e9ecf2;
          background: var(--bg-elev-2);
        }
        .quartier-horizon-pill[data-active="true"] {
          background: rgba(96, 165, 250, 0.18);
          color: #60a5fa;
          font-weight: 500;
        }
        .quartier-horizon-pill:disabled {
          opacity: 0.55;
          cursor: wait;
        }
        .quartier-horizon-dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #c8b89a;
          margin-left: 5px;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
}

// ─── Parsing du texte (titre + blocs « ## ») ─────────────────────────────────────────

type ParsedSynthesis = {
  title: string | null;
  blocks: { caption: string | null; text: string }[];
};

function parseSynthesis(raw: string): ParsedSynthesis {
  const text = raw.trimStart();
  if (!text) return { title: null, blocks: [] };

  const firstSplit = text.split(/\n##\s+/);
  const head = firstSplit[0];
  const tail = firstSplit.slice(1);

  const headLines = head.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const title = headLines[0]
    ? headLines[0].replace(/^#+\s*/, "").replace(/^\*+|\*+$/g, "").trim()
    : null;
  const headRest = headLines.slice(1).join(" ");

  const blocks: { caption: string | null; text: string }[] = [];
  if (headRest && tail.length === 0) {
    blocks.push({ caption: null, text: headRest });
  }
  for (const chunk of tail) {
    const lines = chunk.split(/\n/);
    const caption = lines[0]?.trim() ?? null;
    const body = lines.slice(1).join("\n").trim();
    blocks.push({ caption, text: body });
  }
  return { title, blocks };
}
