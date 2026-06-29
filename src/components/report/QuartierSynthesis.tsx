"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useHorizon, HORIZON_META, type HorizonKey } from "@/hooks/useHorizon";
import type { QuartierSourceKey } from "@/lib/quartier-signals";
import { AUTO_SYNTHESIS } from "@/lib/auto-synthesis";

const HORIZON_PILLS: { key: HorizonKey; year: string; recommended?: boolean }[] = [
  { key: "gwl15", year: "2030" },
  { key: "gwl20", year: "2050", recommended: true },
  { key: "gwl30", year: "2100" },
];

export type WorkbookQuartier = {
  heat: string;
  water: string;
  shelter: string;
  change: string;
  note: string;
};

const EMPTY_WORKBOOK: WorkbookQuartier = { heat: "", water: "", shelter: "", change: "", note: "" };

type Props = {
  communeName: string | null;
  inseeCode: string | null;
  /** Identifiant utilisé pour la clé localStorage du QuartierWorkbook. */
  userKey: string;
  /** Liste des sources mobilisées, pré-calculée par horizon côté serveur. */
  sourcesByHorizon: Record<HorizonKey, QuartierSourceKey[]>;
  /** Repères de terrain persistés côté Supabase (snapshot serveur). */
  initialWorkbook: WorkbookQuartier | null;
  /** Relation EFFECTIVE du lecteur à la commune (stockée si corrigée, sinon
   *  inférée résidence/découverte). Détermine la posture de la synthèse ET le
   *  garde-fou : les observations vécues ne sont mobilisées que pour la résidence. */
  relation: "current_residence" | "considering_living";
  /** Texte court à afficher si la génération IA échoue. */
  fallbackSummary: string;
};

const WORKBOOK_STORAGE_PREFIX = "futuree:quartier-workbook:";

function readWorkbookFromStorage(userKey: string): WorkbookQuartier {
  if (typeof window === "undefined") return EMPTY_WORKBOOK;
  try {
    const raw = window.localStorage.getItem(`${WORKBOOK_STORAGE_PREFIX}${userKey}`);
    if (!raw) return EMPTY_WORKBOOK;
    const p = JSON.parse(raw) as Partial<WorkbookQuartier>;
    return {
      heat: p.heat ?? "",
      water: p.water ?? "",
      shelter: p.shelter ?? "",
      change: p.change ?? "",
      note: p.note ?? "",
    };
  } catch {
    return EMPTY_WORKBOOK;
  }
}

function countFilled(wb: WorkbookQuartier): number {
  return [wb.heat, wb.water, wb.shelter, wb.change, wb.note.trim()].filter(Boolean).length;
}

function workbookKey(wb: WorkbookQuartier): string {
  return `${wb.heat}|${wb.water}|${wb.shelter}|${wb.change}|${wb.note.trim()}`;
}

// ─── Composant principal ──────────────────────────────────────────────────
// Panel glass plein largeur :
//   1. Titre Serif italic
//   2. 3 blocs de synthèse streamée
//   3. Bouton Régénérer (uniquement si workbook a changé)
//   4. Footer "Sources mobilisées"
//
// La suite (AskFuture, transition Suivi) est gérée par la page parente.
export default function QuartierSynthesis({
  communeName,
  inseeCode,
  userKey,
  sourcesByHorizon,
  initialWorkbook,
  relation,
  fallbackSummary,
}: Props) {
  const isResidence = relation === "current_residence";
  const [horizon, setHorizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const posthog = usePostHog();
  const sources = sourcesByHorizon[horizon];

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

  // ─── Workbook : snapshot serveur + sync localStorage au focus fenêtre ──
  // Anti-contamination : hors résidence, on ignore tout workbook (snapshot serveur
  // ET localStorage). Une observation vécue ailleurs ne doit pas colorer cette commune.
  const seedWorkbook = isResidence ? (initialWorkbook ?? EMPTY_WORKBOOK) : EMPTY_WORKBOOK;
  const [workbook, setWorkbook] = useState<WorkbookQuartier>(seedWorkbook);
  const [usedWorkbookKey, setUsedWorkbookKey] = useState<string>(() =>
    workbookKey(seedWorkbook),
  );

  useEffect(() => {
    if (relation !== "current_residence") return; // pas de workbook hors résidence (anti-contamination)
    function sync() {
      const fromLs = readWorkbookFromStorage(userKey);
      if (countFilled(fromLs) > 0) {
        setWorkbook((prev) =>
          workbookKey(prev) === workbookKey(fromLs) ? prev : fromLs,
        );
      }
    }
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [userKey, relation]);

  // ─── Synthèse (stream) ─────────────────────────────────────────────────
  const [synthText, setSynthText] = useState("");
  const [synthState, setSynthState] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const synthReqRef = useRef(0);

  const fetchSynthesis = useCallback(
    (wb: WorkbookQuartier, isRegen: boolean) => {
      if (!inseeCode || !communeName) return;
      const requestId = ++synthReqRef.current;
      const controller = new AbortController();
      const filledCount = countFilled(wb);
      const wbPayload = filledCount > 0 ? wb : undefined;

      (async () => {
        setSynthText("");
        setSynthState("streaming");
        posthog?.capture(
          isRegen ? "quartier_ai_summary_regenerated" : "quartier_ai_summary_started",
          {
            commune: communeName,
            insee_code: inseeCode,
            horizon,
            relation,
            workbook_filled_count: filledCount,
          },
        );

        try {
          const res = await fetch("/api/synthesize-quartier", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inseeCode,
              communeName,
              horizon,
              relation,
              workbook: wbPayload,
            }),
            signal: controller.signal,
          });
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (requestId !== synthReqRef.current) break;
            buffer += decoder.decode(value, { stream: true });
            setSynthText(buffer);
          }
          if (requestId === synthReqRef.current) {
            setSynthState("done");
            setUsedWorkbookKey(workbookKey(wb));
            posthog?.capture("quartier_ai_summary_completed", {
              commune: communeName,
              insee_code: inseeCode,
              horizon,
              char_count: buffer.length,
              workbook_filled_count: filledCount,
            });
          }
        } catch (err) {
          if (controller.signal.aborted) return;
          if (requestId !== synthReqRef.current) return;
          setSynthState("error");
          posthog?.capture("quartier_ai_summary_failed", {
            commune: communeName,
            insee_code: inseeCode,
            horizon,
            error: err instanceof Error ? err.message : "unknown",
          });
        }
      })();

      return () => controller.abort();
    },
    [inseeCode, communeName, horizon, posthog, relation],
  );

  useEffect(() => {
    if (!inseeCode || !communeName) return;
    // Auto seulement si AUTO_SYNTHESIS ; sinon l'utilisateur la déclenche via le bouton.
    if (!AUTO_SYNTHESIS) return;
    const cleanup = fetchSynthesis(workbook, false);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inseeCode, communeName, horizon]);

  const workbookChangedSinceLastFetch =
    workbookKey(workbook) !== usedWorkbookKey && countFilled(workbook) > 0;

  // ─── Pas de commune ────────────────────────────────────────────────────
  if (!inseeCode || !communeName) {
    return (
      <div className="glass rounded-xl p-8 border-t-2 border-t-info">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-3">
          Lecture territoriale · horizon {meta.year}
        </p>
        <p className="text-[16px] leading-[1.75] text-muted">
          Renseignez votre commune dans votre profil pour accéder à la lecture
          personnalisée de votre territoire.
        </p>
      </div>
    );
  }

  const parsed = parseSynthesis(synthText);

  return (
    <div>
      <div className="glass rounded-xl p-8 md:p-10 border-t-2 border-t-info">
        <h2
          className="font-normal text-[clamp(28px,3vw,40px)] leading-[1.15] tracking-[-0.5px] mb-4"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {parsed.title ? (
            <span className="italic text-label">{parsed.title}</span>
          ) : (
            <span className={`italic ${synthState === "streaming" ? "text-ghost" : "text-label"}`}>
              {communeName} à l&apos;horizon {meta.year}
            </span>
          )}
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
                  disabled={synthState === "streaming"}
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

        {synthState === "streaming" && parsed.blocks.length === 0 && !parsed.title && (
          <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-ghost">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-info mr-2 animate-pulse" />
            Lecture en cours...
          </div>
        )}

        {synthState === "error" && <FallbackPanel text={fallbackSummary} />}

        {!AUTO_SYNTHESIS && synthState === "idle" && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => fetchSynthesis(workbook, false)}
              className="quartier-regen-btn"
            >
              Générer la synthèse
            </button>
          </div>
        )}

        {synthState !== "error" &&
          parsed.blocks.map((b, i) => {
            const isLast = i === parsed.blocks.length - 1;
            return (
              <div key={i} className={i > 0 ? "mt-6" : ""}>
                {b.caption && (
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-info/80 mb-2.5">
                    {b.caption}
                  </p>
                )}
                <p className="text-[16px] leading-[1.75] text-muted">
                  {b.text}
                  {synthState === "streaming" && isLast && <Cursor />}
                </p>
              </div>
            );
          })}

        {workbookChangedSinceLastFetch && synthState !== "streaming" && (
          <div className="mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[13px] leading-[1.55] text-muted max-w-[440px]">
              Vos repères de terrain ont changé. La lecture peut être affinée
              avec vos observations.
            </p>
            <button
              type="button"
              onClick={() => fetchSynthesis(workbook, true)}
              className="quartier-regen-btn"
            >
              Régénérer avec mes repères
            </button>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-8 pt-5 border-t border-white/[0.06]">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mb-2.5">
              Sources mobilisées
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono text-[10px] tracking-[0.06em] uppercase text-ghost"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes futuree-cursor {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0; }
        }
        .quartier-regen-btn {
          padding: 9px 16px;
          background: rgba(96, 165, 250, 0.12);
          border: 1px solid rgba(96, 165, 250, 0.35);
          border-radius: 8px;
          color: #60a5fa;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          white-space: nowrap;
        }
        .quartier-regen-btn:hover {
          background: rgba(96, 165, 250, 0.2);
          border-color: rgba(96, 165, 250, 0.6);
        }
        .quartier-horizon-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .quartier-horizon-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b7388;
        }
        .quartier-horizon-pills {
          display: inline-flex;
          gap: 4px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 100px;
        }
        .quartier-horizon-pill {
          position: relative;
          padding: 5px 12px;
          background: transparent;
          border: none;
          border-radius: 100px;
          color: #9ba3b4;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s;
        }
        .quartier-horizon-pill:hover:not(:disabled):not([data-active="true"]) {
          color: #e9ecf2;
          background: rgba(255, 255, 255, 0.04);
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

function Cursor() {
  return (
    <span
      className="inline-block w-[7px] h-[16px] -mb-[2px] ml-[2px] bg-info opacity-70 align-baseline"
      style={{ animation: "futuree-cursor 1.1s steps(2, end) infinite" }}
    />
  );
}

function FallbackPanel({ text }: { text: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mb-3">
        Synthèse éditoriale indisponible
      </p>
      <p className="text-[15px] leading-[1.72] text-muted">{text}</p>
    </div>
  );
}

// ─── Parsing de la prose streamée ─────────────────────────────────────────

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
