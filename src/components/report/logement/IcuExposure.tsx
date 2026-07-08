import React from "react";
import { IconSun } from "./icons";
import { MetricTooltip } from "@/components/MetricTooltip";
import type { Face3Snapshot } from "@/lib/logement-autour-types";

const CAPTION: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--fg-4)",
};

// Îlot de chaleur urbain du quartier (CSTB, grand-IRIS). Vit dans la famille « ce à quoi l'adresse
// est exposée » (déplacé de l'Autour, plutôt positif). Bloc FIN, harmonisé avec Sismicité/RGA :
// titre + tooltip (garde-fou + méthode + source) + le +X °C en héros. Le garde-fou « environnement,
// pas intérieur » vit dans le tooltip pour ne pas alourdir le bloc.
export function IcuExposure({ icu }: { icu: Face3Snapshot["icu"] }) {
  if (!icu) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span style={{ ...CAPTION, color: "var(--orange)", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconSun />
        Îlot de chaleur du quartier
        <MetricTooltip
          accent="var(--orange)"
          text="L'écart de température de l'air en été entre ce quartier et une zone peu urbanisée de référence (estimation modélisée, CSTB). Elle décrit l'environnement urbain proche, pas la température à l'intérieur du logement."
        />
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ ...CAPTION, alignSelf: "center" }}>Jusqu&apos;à</span>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, lineHeight: 1, color: "var(--orange)", fontVariantNumeric: "tabular-nums" }}>
          +{icu.iuhi.toFixed(1).replace(".", ",")} °C
        </span>
        <span style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.45 }}>
          plus chaud qu&apos;une zone peu urbanisée de référence, en été.
        </span>
      </div>
    </div>
  );
}
