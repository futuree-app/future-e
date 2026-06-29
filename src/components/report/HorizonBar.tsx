"use client";

import { useRef } from "react";
import posthog from "posthog-js";
import { useHorizon, type HorizonKey } from "@/hooks/useHorizon";
import { buildGeoProps } from "@/lib/posthog-props";

export interface HorizonBarProps {
  communeName: string;
  locked?: boolean;
  inseeCode?: string | null;
  moduleId?: string | null;
}

const HORIZONS = [
  {
    key: "gwl15" as const,
    year: "2030",
    recommended: false,
    title: "2030",
    body: "Les changements sont déjà engagés. Cet horizon montre ce qui commence à se transformer dans votre territoire.",
  },
  {
    key: "gwl20" as const,
    year: "2050",
    recommended: true,
    title: "2050 · Horizon recommandé",
    body: "C'est l'horizon le plus utile pour décider aujourd'hui : logement, mobilité, santé, famille, retraite, investissement.",
  },
  {
    key: "gwl30" as const,
    year: "2100",
    recommended: false,
    title: "2100",
    body: "Cet horizon montre où la trajectoire pourrait mener à long terme, le monde que les enfants d'aujourd'hui pourraient connaître plus âgés.",
  },
] as const;

const HORIZON_YEAR: Record<HorizonKey, string> = {
  gwl15: "2030",
  gwl20: "2050",
  gwl30: "2100",
};

export default function HorizonBar({ communeName, locked = false, inseeCode, moduleId }: HorizonBarProps) {
  const [active, setHorizon] = useHorizon();
  const prevActiveRef = useRef<HorizonKey>(active);

  const effectiveActive: HorizonKey = locked ? "gwl20" : active;
  const horizon = HORIZONS.find((h) => h.key === effectiveActive)!;

  const geo = buildGeoProps({ commune: communeName, inseeCode });

  function handleHorizonClick(key: HorizonKey) {
    if (locked || key === active) return;
    const fromHorizon = HORIZON_YEAR[prevActiveRef.current];
    const toHorizon = HORIZON_YEAR[key];
    prevActiveRef.current = key;
    setHorizon(key);

    posthog.capture("report_scenario_changed", {
      scenario: toHorizon,
      from_scenario: fromHorizon,
      to_scenario: toHorizon,
      module_id: moduleId ?? null,
      risk_category: null,
      ...geo,
    });
  }

  return (
    <section className="pt-14">
      <div className="flex items-start justify-between gap-8 mb-8 flex-wrap">

        {/* Texte dynamique gauche */}
        <div style={{ minWidth: 0, flex: "1 1 260px" }}>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-3">
            Projection climatique · {communeName}
          </p>
          <h2
            className="font-normal leading-[1.18] tracking-[-0.5px] text-label mb-3"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(20px, 2.4vw, 28px)",
              transition: "opacity 0.2s ease",
            }}
          >
            {locked ? "Scénario médian · 2050." : horizon.title}
          </h2>
          {!locked && (
            <p
              className="text-muted"
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                maxWidth: 480,
                margin: 0,
                transition: "opacity 0.2s ease",
              }}
            >
              {horizon.body}
            </p>
          )}
        </div>

        {/* Boutons horizons */}
        <div className="flex gap-2 shrink-0" style={{ opacity: locked ? 0.45 : 1, pointerEvents: locked ? "none" : "auto", paddingTop: 16 }}>
          {HORIZONS.map((h) => {
            const isActive = effectiveActive === h.key;
            return (
              <div key={h.key} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {h.recommended && (
                  <span style={{
                    position: "absolute",
                    top: -16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 7,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "var(--canvas, #1a1814)",
                    background: "var(--accent, #c8b89a)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                  }}>
                    Recommandé
                  </span>
                )}
                <button
                  onClick={() => handleHorizonClick(h.key)}
                  disabled={locked}
                  style={{
                    background: isActive ? "rgba(200,184,154,0.10)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? "rgba(200,184,154,0.35)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12,
                    padding: "10px 16px",
                    cursor: locked ? "default" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "background 0.15s, border-color 0.15s",
                    minWidth: 88,
                  }}
                >
                  <span style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 22,
                    fontWeight: 400,
                    letterSpacing: "-0.5px",
                    lineHeight: 1,
                    color: isActive ? "var(--label, #f0ece5)" : "var(--muted, #888)",
                    transition: "color 0.15s",
                  }}>
                    {h.year}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    color: isActive ? "var(--accent, #c8b89a)" : "var(--ghost, #555)",
                    transition: "color 0.15s",
                  }}>
                    {h.key === "gwl15" ? "+2°C" : h.key === "gwl20" ? "+2,7°C" : "+4°C"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {locked && (
        <div
          className="glass rounded-xl px-5 py-3.5 mb-8 flex items-center justify-between gap-6"
          style={{ borderLeft: "2px solid var(--accent, #c8b89a)" }}
        >
          <p className="text-[14px] text-muted leading-[1.6]">
            Les horizons 2030 et 2100 sont accessibles avec le rapport complet. Vous lisez le scénario médian 2050.
          </p>
          <a
            href="/#pricing"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline"
            style={{ fontFamily: "'Instrument Sans', sans-serif", color: "var(--canvas, #1a1814)" }}
          >
            Ouvrir le rapport
          </a>
        </div>
      )}
    </section>
  );
}
