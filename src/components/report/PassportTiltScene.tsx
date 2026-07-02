"use client";

// Scène interactive du passeport territorial : au survol, la carte s'incline
// vers le curseur comme une plaque qu'on toucherait, un reflet suit la souris
// et les couches internes (sceau, nom) se décalent en parallaxe.
//
// Le composant ne fait que projeter la position du pointeur en variables CSS
// (--px, --py, --hover) ; toute la matière (tilt, reflet, parallaxe) vit dans
// globals.css. La carte enfant reste un composant serveur.

import { useRef, type ReactNode, type PointerEvent } from "react";

export function PassportTiltScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--px", px.toFixed(3));
      el.style.setProperty("--py", py.toFixed(3));
      el.style.setProperty("--hover", "1");
    });
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    if (raf.current != null) cancelAnimationFrame(raf.current);
    el.style.setProperty("--px", "0.5");
    el.style.setProperty("--py", "0.5");
    el.style.setProperty("--hover", "0");
  }

  return (
    <div
      ref={ref}
      className="passport-fold-scene passport-touch"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="passport-tilt">{children}</div>
    </div>
  );
}
