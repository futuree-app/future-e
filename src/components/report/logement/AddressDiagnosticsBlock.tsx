"use client";

import type { DpeRecord } from "@/lib/dpe-attribution";
import {
  addressContextLead, buildAddressDpeContext, type AddressDpeContext,
} from "@/lib/dpe-address-context";
import { DpeSelector } from "@/components/report/DpeSelector";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « DIAGNOSTICS TROUVÉS À CETTE ADRESSE » — la matière NON ATTRIBUÉE.
//
// Remplace l'écran bloquant « Précisez votre logement ». Ce qui change : le rapport s'affiche, et
// cette matière est présentée comme un CONTEXTE D'ADRESSE. Reconnaître son logement devient un
// enrichissement, offert dans un tiroir, jamais un péage.
//
// LA SYNTHÈSE D'ABORD, LA LISTE ENSUITE. Vingt-quatre lignes « appartement · 10,2 m² · Etage 4 ;
// Porte 37 » en point d'entrée, c'est un devoir à faire. Le lecteur reçoit d'abord ce que la base
// dit de son adresse, et il ouvre la liste s'il pense pouvoir s'y reconnaître.
//
// AUCUNE VALEUR N'EST PRÊTÉE AU LOGEMENT. Chaque chiffre décrit l'adresse. C'est aussi pour ça
// qu'aucune moyenne n'est affichée (cf. `dpe-address-context.ts`) : une moyenne se lit comme LA
// réponse, une répartition se lit comme de la dispersion.
// ════════════════════════════════════════════════════════════════════════════════════════════

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{label}</span>
      <span style={{ fontSize: 14.5, color: "var(--fg-hi)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {children}
      </span>
    </div>
  );
}

function Repartition({ ctx }: { ctx: AddressDpeContext }) {
  if (ctx.distribution.length === 0) return null;
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 14, color: "var(--fg-2)" }}>Classes observées</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {ctx.distribution.map(({ label, count }) => (
          <span
            key={label}
            style={{
              fontSize: 13, padding: "4px 10px", borderRadius: 999,
              border: "1px solid var(--border-1)", background: "var(--bg-elev)", color: "var(--fg-1)",
            }}
          >
            {label} <span style={{ color: "var(--fg-4)" }}>&times;&nbsp;{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AddressDiagnosticsBlock({
  candidates, onPick, onNotInList,
}: {
  candidates: DpeRecord[];
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
}) {
  const ctx = buildAddressDpeContext(candidates);
  if (!ctx) return null;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>
        {addressContextLead(ctx)}
      </p>

      <div style={{ display: "grid", gap: 12, paddingTop: 4 }}>
        <Repartition ctx={ctx} />

        {ctx.spread && (
          <Ligne label="Écart des classes">
            de {ctx.spread.min} à {ctx.spread.max}
          </Ligne>
        )}

        {ctx.surfaces && (
          <Ligne label="Surfaces diagnostiquées">
            {ctx.surfaces.min === ctx.surfaces.max
              ? `${ctx.surfaces.min} m²`
              : `de ${ctx.surfaces.min} à ${ctx.surfaces.max} m²`}
          </Ligne>
        )}

        {ctx.years && (
          <Ligne label="Réalisés entre">
            {ctx.years.min === ctx.years.max ? ctx.years.min : `${ctx.years.min} et ${ctx.years.max}`}
          </Ligne>
        )}

        {ctx.buildingTypes.length > 0 && (
          <Ligne label="Types de bâtiment">{ctx.buildingTypes.join(", ")}</Ligne>
        )}
      </div>

      {ctx.hasCollective && (
        <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          L&apos;un de ces diagnostics porte sur l&apos;immeuble entier. Il décrit le bâtiment
          commun, et pas la performance d&apos;un logement en particulier.
        </p>
      )}

      {/* LE GESTE UTILE, ET IL NE DEMANDE RIEN AU LECTEUR QU'IL NE SACHE. Le numéro à treize
          caractères identifie un diagnostic sans ambiguïté : c'est la seule question à poser qui
          transforme cette incertitude en certitude, et le vendeur, lui, l'a. */}
      <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)" }}>
        <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
          Le numéro à treize caractères du diagnostic, que porte le document remis avec le dossier
          de diagnostic technique, lève cette incertitude.
        </p>
      </div>

      {/* La reconnaissance devient FACULTATIVE, et repliée. Elle n'est possible que pour quelqu'un
          qui connaît déjà l'étage ou la surface, donc rarement pour un acheteur en visite. */}
      <details className="group" style={{ borderTop: "1px solid var(--border-1)", paddingTop: 4 }}>
        <summary
          className="[&::-webkit-details-marker]:hidden"
          style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8, padding: "12px 0", fontSize: 13.5, fontWeight: 500, color: "var(--fg-3)" }}
        >
          <span className="transition-transform group-open:rotate-90" aria-hidden style={{ display: "inline-block", fontSize: 11, color: "var(--fg-4)" }}>
            &#9656;
          </span>
          Reconnaître le diagnostic de ce logement
        </summary>
        <div style={{ paddingBottom: 6 }}>
          <DpeSelector candidates={candidates} context={null} onPick={onPick} onNotInList={onNotInList} />
        </div>
      </details>
    </div>
  );
}
