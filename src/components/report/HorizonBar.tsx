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
    sublabel: "demain",
    gwl: "+2°C",
    tagline: "2030, c'est demain. Les trajectoires sont déjà engagées.",
  },
  {
    key: "gwl20" as const,
    year: "2050",
    sublabel: "votre vie",
    gwl: "+2,7°C",
    tagline: "2050, c'est proche. À peine le temps de prendre des décisions et de voir leurs conséquences. C'est le monde des enfants d'aujourd'hui à l'âge adulte.",
  },
  {
    key: "gwl30" as const,
    year: "2100",
    sublabel: "vos petits-enfants",
    gwl: "+4°C",
    tagline: "2100, c'est plus proche qu'il n'y paraît. C'est le monde de ceux qui ont dix ans aujourd'hui, une fois vieux. Ce territoire, ils l'hériteront tel que vous le laissez.",
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
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
            Projection climatique · {communeName}
          </p>
          <h2
            className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {locked ? "Scénario médian · 2050." : "Choisissez votre horizon."}
          </h2>
        </div>

        <div className="flex gap-2 shrink-0" style={{ opacity: locked ? 0.45 : 1, pointerEvents: locked ? "none" : "auto" }}>
          {HORIZONS.map((h) => {
            const isActive = effectiveActive === h.key;
            return (
              <button
                key={h.key}
                onClick={() => handleHorizonClick(h.key)}
                disabled={locked}
                style={{
                  background: isActive ? "rgba(200,184,154,0.10)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? "rgba(200,184,154,0.35)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12,
                  padding: "10px 18px",
                  cursor: locked ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.15s",
                  minWidth: 88,
                }}
              >
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: isActive ? "var(--accent, #c8b89a)" : "var(--ghost, #555)" }}>
                  {h.gwl}
                </span>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, letterSpacing: "-0.5px", lineHeight: 1, color: isActive ? "var(--label, #f0ece5)" : "var(--muted, #888)" }}>
                  {h.year}
                </span>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.06em", color: "var(--ghost, #555)" }}>
                  {h.sublabel}
                </span>
              </button>
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

      <p
        className="text-[16px] leading-[1.8] text-muted max-w-[600px]"
        style={{ borderLeft: "2px solid rgba(200,184,154,0.30)", paddingLeft: 20 }}
      >
        {horizon.tagline}
      </p>
    </section>
  );
}
