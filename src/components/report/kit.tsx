import type { ReactNode } from "react";

// ════════════════════════════════════════════════════════════════════════════
// Kit de cartes du rapport futur•e — SOURCE UNIQUE du langage visuel des modules.
// Territoire est la référence (déjà en .glass) ; Logement adopte ici ; tout futur
// module (Santé…) hérite. Règle : STRUCTURE partagée, ACCENT propre au module
// (Territoire = info/bleu, Logement = taupe). Doctrine : docs/vault/recherches/
// inventaire-design.md + spec 2026-07-03-harmonisation-rapport-kit-design.md.
// Primitives pures : aucune logique, aucun état, aucune lecture disque.
// ════════════════════════════════════════════════════════════════════════════

export type ReportTone =
  | "info" | "accent" | "orange" | "red" | "green" | "blue" | "violet" | "neutral";

const TONE: Record<ReportTone, string> = {
  info: "var(--color-info)",
  accent: "var(--accent, #c8b89a)",
  orange: "var(--orange)",
  red: "var(--red)",
  green: "var(--green)",
  blue: "var(--blue)",
  violet: "var(--violet)",
  neutral: "var(--fg-4)",
};

// Intertitre de section : puce + mono majuscules (ADN Territoire). Le contenu
// de la section (une GlassCard, une grille…) est passé en children.
export function ReportSection(
  { eyebrow, tone = "neutral", children }:
  { eyebrow: string; tone?: ReportTone; children: ReactNode },
) {
  return (
    <section>
      <div
        className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase mb-4"
        style={{ color: TONE[tone] }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE[tone] }} />
        {eyebrow}
      </div>
      {children}
    </section>
  );
}

// Carte verre du rapport : .glass rounded-xl, padding réglable, liseré haut
// coloré optionnel. Remplace les conteneurs var(--bg-card) coins-droits.
export function GlassCard(
  { children, pad = "md", accentTop, className = "" }:
  { children: ReactNode; pad?: "sm" | "md" | "lg"; accentTop?: ReportTone; className?: string },
) {
  const padCls = pad === "lg" ? "p-8" : pad === "sm" ? "p-4" : "p-6";
  return (
    <div
      className={`glass rounded-xl ${padCls} ${className}`.trim()}
      style={accentTop ? { borderTop: `2px solid ${TONE[accentTop]}` } : undefined}
    >
      {children}
    </div>
  );
}
