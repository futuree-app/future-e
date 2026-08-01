"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useHorizon, HORIZON_META, type HorizonKey } from "@/hooks/useHorizon";
import type { QuartierSourceKey } from "@/lib/quartier-signals";
import { QuartierWorkbook } from "@/app/(account)/compte/QuartierWorkbook";

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
  /** Attentes du lecteur en découverte (priorité / hésitation), persistées par
   *  commune dans report_context. Ignorées en résidence. */
  initialDiscovery?: { priority: string; concern: string } | null;
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

function discoveryKeyOf(d: { priority: string; concern: string }): string {
  return `${d.priority.trim()}|${d.concern.trim()}`;
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
  initialDiscovery,
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

  // Attentes découverte (hors résidence). Ref pour éviter la closure périmée
  // dans fetchSynthesis lors de la régénération.
  const seedDiscovery = !isResidence && initialDiscovery ? initialDiscovery : { priority: "", concern: "" };
  const [discovery, setDiscovery] = useState(seedDiscovery);
  const discoveryRef = useRef(discovery);
  // LA REF SE MET À JOUR APRÈS LE COMMIT, pas pendant le rendu. Écrire une ref en plein rendu la rend
  // dépendante d'un passage que React peut abandonner ou rejouer. Le comportement est identique ici :
  // `fetchSynthesis` la lit depuis un gestionnaire d'événement, donc toujours après cet effet.
  useEffect(() => {
    discoveryRef.current = discovery;
  });
  const [usedDiscoveryKey, setUsedDiscoveryKey] = useState("");
  const [discoveryOpen, setDiscoveryOpen] = useState(false);

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
              discovery:
                relation === "considering_living" &&
                (discoveryRef.current.priority.trim() || discoveryRef.current.concern.trim())
                  ? discoveryRef.current
                  : undefined,
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
            setUsedDiscoveryKey(discoveryKeyOf(discoveryRef.current));
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
    // INCONDITIONNEL DEPUIS LE 30/07/2026 : cette synthèse était derrière un flag
    // `AUTO_SYNTHESIS` absent de la production, donc derrière un bouton « Générer la synthèse »
    // dans un module payant.
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
          <div className="mt-7 pt-5 border-t border-[var(--border-1)] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[13px] leading-[1.55] text-muted max-w-[620px]">
              Vos repères ont changé.
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

        {/* Repères de terrain — uniquement en résidence (observations vécues,
            anti-contamination : jamais sur une commune où l'on ne vit pas).
            Même emplacement que le bloc découverte ci-dessous, pour la symétrie :
            sous la synthèse, dans le même panneau. Fermé par défaut (comme le
            reste du parcours), mais le déclencheur est traité en CTA bleu bien
            visible dans QuartierWorkbook, pas une pastille grise qui se perd. */}
        {isResidence && synthState !== "streaming" && (
          <div className="mt-7 pt-5 border-t border-[var(--border-1)]">
            <QuartierWorkbook
              userKey={userKey}
              commune={communeName}
              inseeCode={inseeCode}
              reportId={inseeCode}
            />
          </div>
        )}

        {/* Vos priorités pour cette commune — uniquement en découverte. Deux
            champs libres, optionnels : ils orientent l'ATTENTION de la
            synthèse, jamais les faits. Titre aligné sur « Vos repères de
            terrain » (résidence) : le lecteur en sujet, pas « la lecture ».
            Fermé par défaut, même geste que le bloc résidence : tout le
            header est cliquable, le déclencheur est un CTA bleu visible. */}
        {relation === "considering_living" && synthState !== "streaming" && (
          <div className="mt-7 pt-5 border-t border-[var(--border-1)]">
            <button
              type="button"
              onClick={() => setDiscoveryOpen((v) => !v)}
              className="flex items-start justify-between gap-4 w-full text-left"
            >
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-info/80 mb-1.5">
                  Vos priorités pour cette commune
                </p>
                {!discoveryOpen && (
                  <p className="text-[13px] leading-[1.55] text-muted">
                    Dites-nous ce que vous recherchez ou ce qui vous fait hésiter ici.
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap shrink-0 ${
                  discoveryOpen
                    ? "border border-[var(--border-2)] bg-[var(--bg-elev-2)] text-muted font-normal"
                    : "border border-info/40 bg-info/[0.14] text-info font-semibold"
                }`}
              >
                {discoveryOpen ? "Réduire" : "Compléter"}
                <span className="text-[10px]">{discoveryOpen ? "▲" : "▼"}</span>
              </span>
            </button>

            {discoveryOpen && (
              <div className="mt-4">
                <p className="text-[13px] leading-[1.55] text-muted mb-4">
                  Vos priorités orientent ce qui suit, sans rien inventer.
                </p>
                <label className="block text-[13px] text-label mb-1.5">
                  Qu&apos;est-ce qui compte le plus pour vous dans cette commune&nbsp;?
                </label>
                <textarea
                  value={discovery.priority}
                  onChange={(e) => setDiscovery((d) => ({ ...d, priority: e.target.value }))}
                  maxLength={300}
                  rows={2}
                  placeholder="Le calme, les écoles, le budget, l'exposition aux risques : ce qui pèse le plus pour vous."
                  className="w-full bg-[var(--bg-elev)] border border-[var(--border-2)] rounded-md p-2.5 text-[14px] text-label placeholder:text-ghost mb-3 resize-y"
                />
                <label className="block text-[13px] text-label mb-1.5">
                  Qu&apos;est-ce qui pourrait vous faire hésiter&nbsp;?
                </label>
                <textarea
                  value={discovery.concern}
                  onChange={(e) => setDiscovery((d) => ({ ...d, concern: e.target.value }))}
                  maxLength={300}
                  rows={2}
                  placeholder="Une inquiétude ou un point que vous souhaitez examiner avec attention."
                  className="w-full bg-[var(--bg-elev)] border border-[var(--border-2)] rounded-md p-2.5 text-[14px] text-label placeholder:text-ghost mb-3 resize-y"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    disabled={discoveryKeyOf(discovery) === usedDiscoveryKey}
                    onClick={async () => {
                      posthog?.capture("quartier_discovery_applied", {
                        commune: communeName,
                        insee_code: inseeCode,
                        has_priority: !!discovery.priority.trim(),
                        has_concern: !!discovery.concern.trim(),
                      });
                      try {
                        await fetch("/api/report-context", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            insee: inseeCode,
                            discoveryWorkbook: { priority: discovery.priority, concern: discovery.concern },
                          }),
                        });
                      } catch {
                        /* la régénération reste utile même si la persistance échoue */
                      }
                      fetchSynthesis(workbook, true);
                    }}
                    className="quartier-regen-btn disabled:opacity-40 disabled:cursor-default"
                  >
                    Adapter la lecture
                  </button>
                  {usedDiscoveryKey &&
                    discoveryKeyOf(discovery) === usedDiscoveryKey &&
                    (discovery.priority.trim() || discovery.concern.trim()) && (
                      <span className="text-[12px] text-info/80">Vos priorités sont prises en compte.</span>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {sources.length > 0 && (
          <p className="mt-6 font-mono text-[10px] tracking-[0.1em] uppercase text-ghost">
            <span className="font-bold">Sources</span> · {sources.join(" · ")}
          </p>
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
          font-family: 'JetBrains Mono', monospace;
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
