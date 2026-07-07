import React from "react";
import type { Face3Snapshot, GreenKind } from "@/lib/logement-autour-types";
import { ReportSection, GlassCard } from "@/components/report/kit";

// Face 3 — « Autour de cette adresse » (buffer local au point géocodé). Hiérarchie :
// vie quotidienne (BPE, socle) > verts (repère). Infra de transport (bruit) déplacée vers le
// futur module Santé. Distances brutes à vol d'oiseau, aucun adjectif de proximité, aucune note.
const FACE3_CAT_LABEL: Record<string, string> = {
  sante: "Santé",
  alimentation: "Alimentation quotidienne",
  education: "Éducation",
  transports: "Transports",
  services: "Services du quotidien",
};
// Nature de l'espace vert le plus proche : on nomme précisément ce que OSM a cartographié
// (parc / bois / …) plutôt qu'un « espace vert » générique. Repli générique si le tag manque
// (snapshot antérieur au greenKind).
const GREEN_LABEL: Record<GreenKind, string> = {
  park: "Parc",
  wood: "Bois",
  forest: "Forêt",
  grass: "Pelouse",
  recreation_ground: "Terrain de plein air",
};
function greenSpaceLabel(kind: GreenKind | undefined): string {
  return kind ? GREEN_LABEL[kind] : "Espace vert";
}
// Sous-titre de brique (vie quotidienne / repère) et libellé de famille (métadonnée secondaire
// au-dessus du type précis). Rendent visible la hiérarchie éditoriale.
const FACE3_SUBHEAD: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--accent-dim, #7a6e60)",
};
const FACE3_FAMILY: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--fg-4)",
};
function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${m} m`;
}
// Une ligne « type précis — env. distance ». Le type est en évidence, la distance à droite,
// alignée sur la même ligne de base que le type (chiffres tabulaires pour l'alignement).
function Face3Line({ label, meters }: { label: string; meters: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontSize: 15, color: "var(--fg-1)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, color: "var(--fg-hi)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>env. {fmtDist(meters)}</span>
    </div>
  );
}
export function Face3Block({ s }: { s: Face3Snapshot }) {
  return (
    <ReportSection eyebrow="Autour de cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 22 }}>
          <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
            Les équipements et repères cartographiés les plus proches du logement.
          </p>

          {/* Brique 1 — vie quotidienne (socle) : famille en métadonnée, type précis en
              information principale, distance alignée sur la ligne de base du type. */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={FACE3_SUBHEAD}>Vie quotidienne</div>
            <div style={{ display: "grid", gap: 10 }}>
              {s.bpe.categories.map((c) => (
                <div key={c.category} style={{ display: "grid", gap: 2 }}>
                  <span style={FACE3_FAMILY}>{FACE3_CAT_LABEL[c.category]}</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                    <span style={{ fontSize: 15, color: c.nearest ? "var(--fg-1)" : "var(--fg-4)", fontWeight: 500 }}>
                      {c.nearest ? (c.nearest.typeLabel ?? FACE3_CAT_LABEL[c.category]) : "Aucun recensé"}
                    </span>
                    <span style={{ fontSize: 15, color: c.nearest ? "var(--fg-hi)" : "var(--fg-4)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {c.nearest ? `env. ${fmtDist(c.nearest.distanceMeters)}` : `dans les ${c.searchCapMeters / 1000} km analysés`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brique 2 — espace vert (repère). Infra de transport (bruit/nuisance) déplacée
              vers le futur module Santé, au grain adresse. */}
          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 8 }}>
            <div style={FACE3_SUBHEAD}>Espace vert</div>
            {s.sourceStatus.osmGreenSpaces === "pending" ? (
              <em style={{ color: "var(--fg-4)", fontSize: 14 }}>Environnement en cours de récupération…</em>
            ) : s.sourceStatus.osmGreenSpaces === "failed" ? (
              <span style={{ color: "var(--fg-4)", fontSize: 14 }}>Espaces verts : donnée momentanément indisponible.</span>
            ) : s.osm.nearestMappedGreenSpace ? (
              <Face3Line label={greenSpaceLabel(s.osm.nearestMappedGreenSpace.kind)} meters={s.osm.nearestMappedGreenSpace.distanceMeters} />
            ) : (
              <span style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
                Aucun espace vert correspondant aux catégories recherchées dans l’emprise cartographiée.
              </span>
            )}
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.85 }}>
            Sources : INSEE, BPE 2024 · © les contributeurs OpenStreetMap (ODbL) · distances approximatives à vol d’oiseau
          </div>
        </div>
      </GlassCard>
    </ReportSection>
  );
}
