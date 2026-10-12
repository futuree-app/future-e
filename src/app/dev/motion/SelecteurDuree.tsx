"use client";

// FUT-75 · Q2 RACCOURCI (DEV) : le sélecteur élastique à durée réglable, pour choisir à l'usage.
// Revue : « départ immédiat, 160 à 220 ms, bords décalés mais très court, pas de traînée ». D'où :
//   - une courbe qui part FORT (pas d'accélération lente au départ) ;
//   - le bord de tête n'a que 25 % d'avance, et seulement sur le premier tiers du trajet ;
//   - la pose finale sur le micro-ressort (dépassement ≈ 2 %), sans queue ;
//   - un nouveau choix repart de la position courante de l'indicateur (aucun saut, aucun retard).
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ressortLineaire } from "@/lib/motion";

const RESSORT = ressortLineaire();
const OPTIONS = ["2030", "2050", "2100"] as const;
type Bords = { g: number; d: number };

export function SelecteurDuree({ duree }: { duree: number }) {
  const [v, setV] = useState<(typeof OPTIONS)[number]>("2050");
  const racine = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const btn = useRef<Record<string, HTMLButtonElement | null>>({});
  const clip = ({ g, d }: Bords) => `inset(0px ${Math.round(d)}px 0px ${Math.round(g)}px round 3px)`;
  useLayoutEffect(() => {
    const r = racine.current, b = btn.current[v], el = ind.current;
    if (!r || !b || !el) return;
    const cible = { g: b.offsetLeft, d: r.clientWidth - b.offsetLeft - b.offsetWidth };
    const m = getComputedStyle(el).clipPath.match(/inset\(([-\d.]+)px ([-\d.]+)px ([-\d.]+)px ([-\d.]+)px/);
    const depart = m ? { g: Number(m[4]), d: Number(m[2]) } : cible;
    el.style.clipPath = clip(cible);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || (depart.g === cible.g && depart.d === cible.d)) return;
    el.getAnimations().forEach((a) => a.cancel());
    const droite = cible.g > depart.g;
    const tete = droite ? { g: depart.g + (cible.g - depart.g) * 0.25, d: cible.d } : { g: cible.g, d: depart.d + (cible.d - depart.d) * 0.25 };
    el.animate([{ clipPath: clip(depart), easing: "cubic-bezier(0.25, 0.9, 0.35, 1)" }, { clipPath: clip(tete), offset: 0.3, easing: RESSORT }, { clipPath: clip(cible) }], { duration: duree });
  }, [v, duree]);
  const clavier = (e: KeyboardEvent) => {
    const i = OPTIONS.indexOf(v);
    const j = e.key === "ArrowRight" ? (i + 1) % 3 : e.key === "ArrowLeft" ? (i + 2) % 3 : e.key === "Home" ? 0 : e.key === "End" ? 2 : -1;
    if (j < 0) return;
    e.preventDefault(); setV(OPTIONS[j]!); btn.current[OPTIONS[j]!]?.focus();
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ghost)", minWidth: 60 }}>{duree} ms</span>
      <div ref={racine} role="radiogroup" aria-label={`Horizon (${duree} ms)`} onKeyDown={clavier}
        style={{ position: "relative", display: "inline-grid", gridAutoFlow: "column", gridAutoColumns: "1fr", border: "1px solid var(--border-2)", borderRadius: 4, padding: 3, gap: 2, background: "var(--bg-deep)" }}>
        <span ref={ind} aria-hidden style={{ position: "absolute", inset: 3, borderRadius: 3, pointerEvents: "none", background: "var(--red-tint)", boxShadow: "inset 0 -2px 0 var(--red)" }} />
        {OPTIONS.map((o) => (
          <button key={o} ref={(n) => { btn.current[o] = n; }} type="button" role="radio" aria-checked={o === v} tabIndex={o === v ? 0 : -1} onClick={() => setV(o)}
            style={{ position: "relative", zIndex: 1, minWidth: 88, minHeight: 48, border: 0, background: "transparent", cursor: "pointer", font: "600 16px var(--font-sans)", color: o === v ? "var(--fg-hi)" : "var(--fg-3)", touchAction: "manipulation" }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
