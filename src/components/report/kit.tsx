import type { ReactNode } from "react";

// ════════════════════════════════════════════════════════════════════════════
// DÉPRÉCIÉ (FUT-118 R0, DESIGN.md v3.0 § 9.2). Ce kit n'est plus la source du
// langage visuel des modules : c'est le Relevé (`src/components/releve/`).
// Ne l'employez dans aucun nouvel écran. Il reste en place tant que Territoire,
// Autour et Logement l'utilisent, et disparaît avec leur migration (lots R3 à R5,
// nettoyage R12). Le test-cliquet `canon.test.ts` interdit d'en ajouter un usage.
//
// Historique : kit de cartes du rapport (juillet 2026) ; verre `.glass`, accent
// propre à chaque module (Territoire = info/bleu, Logement = taupe). Doctrine
// d'alors : docs/vault/recherches/inventaire-design.md.
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
