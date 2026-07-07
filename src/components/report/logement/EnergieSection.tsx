import type { LogementReport } from "@/lib/logement-report-types";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { DpeBadge, Block, DPE_LABELS } from "./kit";

// Face 1 — Énergie & rénovation : attribution du DPE au logement (sélecteur / absence / rejet /
// diagnostic confirmé) et audit énergétique s'il existe. La lecture thermique riche (confort d'été)
// vit dans ThermalComfortSection, montée séparément. Ici, seul le DPE attribué (jamais un candidat).
export type DpeUiStatus =
  | "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error";

export function EnergieSection({
  dpeStatus, dpe, audit, onReselect,
}: {
  dpeStatus: DpeUiStatus;
  dpe: DpeRecord | null;
  audit: LogementReport["audit"];
  onReselect: () => void;
}) {
  // Note : la sélection multi-DPE (« selection_required ») se fait AVANT le rapport, dans
  // PreciseLogementStep (le rapport ne se rend jamais dans cet état). Ici on ne traite que les
  // états terminaux : diagnostic attribué, aucun DPE, ou aucun attribué.
  if (dpeStatus === "not_found") {
    return (
      <ReportSection eyebrow="Énergie & rénovation" tone="orange">
        <GlassCard>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
            Aucun DPE retrouvé dans la base ouverte pour cette adresse. Cela ne signifie pas nécessairement qu&apos;aucun diagnostic n&apos;existe.
          </p>
        </GlassCard>
      </ReportSection>
    );
  }
  if (dpeStatus === "rejected") {
    return (
      <ReportSection eyebrow="Énergie & rénovation" tone="orange">
        <GlassCard>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
            Aucun des diagnostics retrouvés n&apos;a été attribué à ce logement.
          </p>
        </GlassCard>
      </ReportSection>
    );
  }
  if (!dpe) return null;
  return (
    <ReportSection eyebrow="Énergie & rénovation" tone="orange">
      <GlassCard>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <DpeBadge label={dpe.etiquette_dpe} size="lg" />
          <div>
            <div style={{ fontWeight: 500, fontSize: 16, color: "var(--fg-hi)" }}>
              Étiquette {dpe.etiquette_dpe ?? "—"}, {DPE_LABELS[dpe.etiquette_dpe ?? ""] ?? "Donnée indisponible"}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4 }}>
              GES {dpe.etiquette_ges ?? "—"} · DPE du {dpe.date_dpe?.slice(0, 10) ?? "—"}
            </div>
          </div>
        </div>
        {dpeStatus === "auto_confirmed" && (
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
            Un DPE a été retrouvé pour cette adresse.{" "}
            <button type="button" onClick={onReselect} style={{ color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>Ce n&apos;est pas le bon diagnostic</button>.
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 14 }}>
          {dpe.conso_ep_m2 != null && <Block label="Consommation" value={`${dpe.conso_ep_m2} kWh EP/m²/an`} />}
          {dpe.emission_ges_m2 != null && <Block label="Émissions GES" value={`${dpe.emission_ges_m2} kg CO₂/m²/an`} />}
          {dpe.type_batiment && <Block label="Type" value={dpe.type_batiment} />}
        </div>

        {audit && audit.scenarios.length > 0 && (
          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-dim, #7a6e60)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Audit énergétique · {audit.scenarios.length} scénarios
            </div>
            {audit.scenarios.map((s, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  {s.categorie && <div style={{ fontSize: 13, color: "var(--fg-1)" }}>{s.categorie}</div>}
                  {s.etape && <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 2 }}>{s.etape}</div>}
                </div>
                {s.conso_ep != null && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                    {s.conso_ep} kWh/m²/an
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </GlassCard>
    </ReportSection>
  );
}
