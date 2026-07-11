// Primitives partagées du module Logement (extraites de LogementModule.tsx, board étape 4).
// Utilisées par plusieurs faces : sceau DPE, bloc label/valeur, repli <details> de divulgation
// progressive, palette et libellés DPE.

import React from "react";
import { MetricTooltip } from "@/components/MetricTooltip";

export const DPE_COLORS: Record<string, string> = {
  A: "#319334", B: "#33cc33", C: "#cbee39",
  D: "#ffff00", E: "#fbad26", F: "#f15a27", G: "#ed1c24",
};

export const DPE_LABELS: Record<string, string> = {
  A: "Très performant", B: "Performant", C: "Assez performant",
  D: "Peu performant", E: "Énergivore", F: "Très énergivore", G: "Passoire thermique",
};

export function DpeBadge({ label, size = "md" }: { label: string | null; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? 56 : size === "md" ? 38 : 26;
  const fs = size === "lg" ? 22 : size === "md" ? 16 : 12;
  if (!label) return <span style={{ color: "var(--fg-4)" }}>—</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: s, height: s, borderRadius: 4,
      background: DPE_COLORS[label] ?? "var(--bg-elev)",
      color: "#060812", fontWeight: 700, fontSize: fs, flexShrink: 0,
    }}>{label}</span>
  );
}

export function Block({ label, value, sub, icon, tip }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode; tip?: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      {/* Flux INLINE (pas flex) : quand le libellé passe sur deux lignes, la tooltip suit le dernier
          mot avec un écart constant, au lieu d'être repoussée au bord droit de la cellule. */}
      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", lineHeight: 1.5, textTransform: "uppercase", color: "var(--fg-4)" }}>
        {icon && <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6 }}>{icon}</span>}
        <span style={{ verticalAlign: "middle" }}>{label}</span>
        {tip && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 6 }}><MetricTooltip text={tip} /></span>}
      </span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "var(--fg-1)" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "var(--fg-4)" }}>{sub}</span>}
    </div>
  );
}

// Divulgation progressive : la preuve technique (méthode, sources, mentions) vit dans un repli
// natif <details>, jamais supprimée, jamais au premier plan.
export function Disclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group" style={{ borderTop: "1px solid var(--border-1)" }}>
      {/* Toute la ligne est cliquable (comportement natif de <summary>), avec une zone de */}
      {/* frappe haute pour le tactile ; le chevron pivote à l'ouverture (variante Tailwind). */}
      <summary
        className="[&::-webkit-details-marker]:hidden"
        style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8, padding: "13px 0", fontSize: 13, fontWeight: 500, color: "var(--fg-3)" }}
      >
        <span className="transition-transform group-open:rotate-90" aria-hidden style={{ display: "inline-block", fontSize: 11, color: "var(--fg-4)" }}>▸</span>
        {summary}
      </summary>
      <div style={{ marginTop: 2, marginBottom: 13, display: "grid", gap: 10, fontSize: 12.5, color: "var(--fg-3)", lineHeight: 1.6 }}>
        {children}
      </div>
    </details>
  );
}

// Séparateur de sous-famille (beat 3, spec 5a). Un rang AU-DESSUS des eyebrows de bloc, discret :
// label mono quiet + filet fin, SANS puce, jamais coloré. But : chunker les preuves, pas re-segmenter.
// En-tête de famille : pastille + label CODÉS PAR COULEUR (cohérent avec Territoire, où
// vert = environnement, bleu = risques). Casse la monotonie des sections empilées et rend la
// structure scannable (retour Design Critic 2026-07-08). `color` par défaut neutre.
export function FamilyHeading({ children, color = "var(--fg-4)" }: { children: React.ReactNode; color?: string }) {
  const colored = color !== "var(--fg-4)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 8 }}>
      {colored && (
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 12px ${color}` }} />
      )}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color, whiteSpace: "nowrap" }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--border-1)" }} />
    </div>
  );
}
