"use client";

import type { DpeRecord, AddressDpeContext } from "@/lib/dpe-attribution";

const DPE_TYPE = (t: string | null) => t ?? "Logement";

// Sélecteur de DPE : l'utilisateur désigne SON logement parmi les candidats de l'adresse.
// Aucune ligne n'est présélectionnée (pas de faux par défaut).
export function DpeSelector({
  candidates, context, onPick, onNotInList,
}: {
  candidates: DpeRecord[];
  context: AddressDpeContext | null;
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
}) {
  const many = candidates.length > 1;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
        {many
          ? "Plusieurs diagnostics sont rattachés à cette adresse. Sélectionnez celui qui correspond au logement."
          : "Un diagnostic a été retrouvé à cette adresse. Est-ce celui du logement ?"}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {candidates.map((c) => (
          <button key={c.id_dpe} type="button" onClick={() => onPick(c)}
            style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-1)", background: "var(--bg-elev)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 14, color: "var(--fg-1)" }}>
              {DPE_TYPE(c.type_batiment)}
              {c.surface_m2 != null ? ` · ${c.surface_m2} m²` : ""}
              {c.etage ? ` · ${c.etage}` : ""}
              {c.complement ? ` · ${c.complement}` : ""}
              {c.date_dpe ? ` · ${c.date_dpe.slice(0, 4)}` : ""}
            </span>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", whiteSpace: "nowrap" }}>
              {c.etiquette_dpe ?? "—"}
            </span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onNotInList}
        style={{ justifySelf: "start", fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        Mon logement n&apos;est pas dans cette liste
      </button>
      {context && (
        <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
          Diagnostics retrouvés à cette adresse : {context.count}. Les classes observées vont de {context.minLabel} à {context.maxLabel}. Elles ne permettent pas de qualifier votre logement.
        </p>
      )}
    </div>
  );
}
