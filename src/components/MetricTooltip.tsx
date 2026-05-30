"use client";

// Tooltip léger pour cartes-indicateurs — quand une carte mérite une glose mais
// pas un drawer (l'indicateur a un seuil ou un sens à expliquer, mais pas
// d'histoire à dérouler : pas de trajectoire, pas de répartition).
//
// Affordance : petit « ⓘ » dans le coin de la carte. Survol OU focus clavier OU
// tap (mobile) ouvre une bulle. Volontairement sans état partagé ni portail :
// une carte = un tooltip indépendant.

import { useEffect, useId, useRef, useState } from "react";

export function MetricTooltip({ text, accent }: { text: string; accent?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  // Fermeture au clic extérieur / Échap (utile pour l'ouverture au tap mobile).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="metric-tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="metric-tip-btn"
        aria-label="En savoir plus"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        style={accent ? { color: accent, borderColor: accent } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ⓘ
      </button>
      {open && (
        <span role="tooltip" id={id} className="metric-tip-bubble">
          {text}
        </span>
      )}

      <style>{`
        .metric-tip { position: relative; display: inline-flex; }
        .metric-tip-btn {
          width: 18px; height: 18px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; line-height: 1; cursor: help;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.18);
          color: #9ba3b4; padding: 0;
          font-family: 'JetBrains Mono', monospace;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .metric-tip-btn:hover { background: rgba(255,255,255,0.09); color: #e9ecf2; }
        .metric-tip-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
        .metric-tip-bubble {
          position: absolute; bottom: calc(100% + 8px); right: -4px; z-index: 50;
          width: max-content; max-width: 240px;
          background: #0b101c; color: #c6cfdb;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 10px 12px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 12.5px; line-height: 1.5; font-weight: 400;
          letter-spacing: normal; text-transform: none;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          animation: metric-tip-in 0.14s ease;
        }
        @keyframes metric-tip-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </span>
  );
}
