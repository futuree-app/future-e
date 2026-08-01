"use client";

// Tooltip de puce (critères /ou-vivre) — la puce ENTIÈRE est le déclencheur, avec un
// soulignement pointillé qui signale la nuance (style « définition »). Survol + focus
// clavier + tap (mobile) ouvrent la bulle ; Échap / clic extérieur ferment. Pur affichage.
// Distinct de MetricTooltip (icône ⓘ pour les cartes-indicateurs).

import { useEffect, useId, useRef, useState } from "react";

export function ChipTooltip({ label, text, color }: { label: string; text: string; color?: string }) {
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
      className="chip-tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="chip-tip-btn"
        style={color ? { color } : undefined}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </button>
      {open && (
        <span role="tooltip" id={id} className="chip-tip-bubble">
          {text}
        </span>
      )}

      <style>{`
        .chip-tip { position: relative; display: inline-flex; }
        .chip-tip-btn {
          font-size: 12px; line-height: 1.2; cursor: help;
          color: rgba(233,236,242,0.9);
          border: 1px solid var(--border-2);
          border-radius: 9999px; padding: 4px 12px;
          background: transparent;
          text-decoration: underline dotted var(--bg-elev-3);
          text-underline-offset: 3px;
          transition: border-color 0.15s, color 0.15s;
          font-family: inherit;
        }
        .chip-tip-btn:hover { border-color: var(--border-hi); color: #e9ecf2; }
        .chip-tip-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
        .chip-tip-bubble {
          position: absolute; bottom: calc(100% + 8px); left: 0; z-index: 50;
          width: max-content; max-width: 240px;
          background: #0b101c; color: #c6cfdb;
          border: 1px solid var(--border-2);
          border-radius: 10px; padding: 10px 12px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 12.5px; line-height: 1.5; font-weight: 400;
          letter-spacing: normal; text-transform: none;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          animation: chip-tip-in 0.14s ease;
        }
        @keyframes chip-tip-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </span>
  );
}
