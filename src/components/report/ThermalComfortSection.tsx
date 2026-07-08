import React from "react";
import { ReportSection } from "@/components/report/kit";
import { ChipTooltip } from "@/components/ChipTooltip";
import { IconSun, IconClock } from "@/components/report/logement/icons";
import type { ThermalEvidence, ThermalFactor } from "@/lib/thermal-evidence";

// Glose de chaque caractéristique du confort d'été (≤2 phrases, « pourquoi ça aide à comprendre »,
// sans méthodo ni source — doctrine tooltips). Clé = ThermalFactor.key.
const CHIP_TOOLTIP: Record<string, string> = {
  traversant: "Un logement traversant a des fenêtres sur deux façades opposées : l’air peut le traverser et évacuer la chaleur, surtout le soir.",
  protection: "Volets, stores ou avancées qui bloquent une partie du soleil aux fenêtres pendant les heures chaudes.",
  inertie: "La capacité des murs à encaisser les écarts de température : une inertie lourde garde le frais plus longtemps dans la journée.",
  ventilation: "Le système qui renouvelle l’air intérieur du logement en continu.",
  brasseur: "Des ventilateurs de plafond : ils ne rafraîchissent pas l’air, mais donnent une sensation de fraîcheur.",
  murs: "La qualité d’isolation des murs, qui freine les échanges de chaleur avec l’extérieur.",
  menuiseries: "La qualité des fenêtres et des portes, qui limite les entrées et les pertes de chaleur.",
};

// Tiroir natif <details> (même pattern que Disclosure de LogementModule), local à cette section.
function Drawer({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group" style={{ borderTop: "1px solid var(--border-1)", marginTop: 4 }}>
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

const POLARITY_COLOR: Record<ThermalFactor["polarity"], string> = {
  favorable: "var(--fg-2)",
  defavorable: "var(--fg-3)",
  neutre: "var(--fg-3)",
};

function Chips({ factors }: { factors: ThermalFactor[] }) {
  if (factors.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      {factors.map((f) =>
        CHIP_TOOLTIP[f.key] ? (
          <ChipTooltip key={f.key} label={f.label} text={CHIP_TOOLTIP[f.key]} color={POLARITY_COLOR[f.polarity]} />
        ) : (
          <span
            key={f.key}
            style={{
              fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
              border: "1px solid var(--border-1)", background: "var(--bg-elev)",
              color: POLARITY_COLOR[f.polarity],
            }}
          >
            {f.label}
          </span>
        ),
      )}
    </div>
  );
}

function ClimateFuture({ communeName, level }: { communeName: string; level: ThermalEvidence["level"] }) {
  const text =
    level === "A_EXACT_UNIT"
      ? `Avec la progression des nuits chaudes à ${communeName}, les caractéristiques décrites ci-dessus prendront davantage d'importance.`
      : level === "B1_EXACT_BUILDING"
        ? `Avec la progression des nuits chaudes à ${communeName}, les caractéristiques thermiques du bâtiment compteront davantage. La capacité propre de ce logement à évacuer la chaleur reste à documenter.`
        : `Avec la progression des nuits chaudes à ${communeName}, la capacité du logement à limiter puis évacuer la chaleur deviendra plus importante. Les données retrouvées ne permettent pas encore de la qualifier.`;
  return (
    <div style={{ borderTop: "1px solid var(--border-1)", marginTop: 16, paddingTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>
        <IconSun />
        Dans le climat futur
      </div>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  );
}

export function ThermalComfortSection({
  evidence, communeName, dpeYear,
}: {
  evidence: ThermalEvidence;
  communeName: string;
  dpeYear: string | null;
  territoireHref?: string;
}) {
  const { level, indicator, methodWording, factors, drawerFields } = evidence;

  return (
    <ReportSection eyebrow="Faire face à la chaleur" tone="accent">
      <div style={{ padding: "4px 0" }}>
        {level === "A_EXACT_UNIT" && (
          <>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
              {indicator === "insuffisant"
                ? "Le DPE signale une capacité limitée à préserver le confort d'été dans ses conditions conventionnelles d'évaluation."
                : `Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme ${indicator}.`}
            </p>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 6 }}>
              Plusieurs caractéristiques renseignées contribuent à cette évaluation.
            </p>
            <Chips factors={factors} />
            <div style={{ borderTop: "1px solid var(--border-1)", marginTop: 16, paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>
                <IconClock />
                À confirmer
              </div>
              <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
                Ces caractéristiques proviennent du DPE établi en {dpeYear ?? "sa date d'établissement"}. Elles peuvent avoir changé depuis.
              </p>
            </div>
          </>
        )}

        {level === "B1_EXACT_BUILDING" && (
          <>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
              Ce que le diagnostic décrit du bâtiment
            </p>
            <Chips factors={factors} />
            <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, marginTop: 14 }}>
              {methodWording === "immeuble"
                ? "Ce diagnostic reprend principalement des caractéristiques de l'immeuble. Elles ne permettent pas de qualifier précisément le confort d'été de ce logement."
                : "Ce diagnostic ne renseigne pas le confort d'été de ce logement."}
            </p>
          </>
        )}

        {level === "C_NO_DATA" && (
          <>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
              Les données publiques retrouvées ne permettent pas de qualifier le confort d&apos;été de ce logement.
            </p>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 8 }}>
              La position sous toiture, les protections solaires et la capacité du logement à se rafraîchir la nuit permettraient d&apos;affiner cette lecture.
            </p>
            <Drawer summary="Pourquoi cette information manque-t-elle ?">
              <p style={{ margin: 0 }}>
                Aucun diagnostic de performance énergétique attribuable à cette adresse, ou suffisamment renseigné, n&apos;a été retrouvé dans les données publiques. Ce n&apos;est pas une anomalie : la couverture des DPE reste partielle.
              </p>
            </Drawer>
          </>
        )}

        <ClimateFuture communeName={communeName} level={level} />

        {(level === "A_EXACT_UNIT" || level === "B1_EXACT_BUILDING") && (
          <Drawer summary="Comprendre cette lecture">
            <div>
              <div style={{ fontWeight: 500, color: "var(--fg-2)", marginBottom: 4 }}>D&apos;où vient cette lecture ?</div>
              <p style={{ margin: 0 }}>
                {level === "A_EXACT_UNIT"
                  ? `Diagnostic individuel attribué à ce logement${dpeYear ? `, établi en ${dpeYear}` : ""}. L'indicateur « bon / moyen / insuffisant » est celui du DPE, pas une catégorie calculée par futur•e. Source : ADEME (base DPE logements existants).`
                  : `Diagnostic attribué à cette adresse${dpeYear ? `, établi en ${dpeYear}` : ""}${methodWording === "immeuble" ? ", à partir des caractéristiques de l'immeuble" : ""}. Champs utilisés : ${drawerFields.concat(factors).map((f) => f.label).join(", ") || "aucun renseigné"}. Source : ADEME.`}
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: "var(--fg-2)", marginBottom: 4 }}>Ce qu&apos;elle ne permet pas de conclure</div>
              <p style={{ margin: 0 }}>
                Aucune température intérieure mesurée, aucun contrôle de l&apos;état actuel des équipements, aucune prédiction du confort en 2030, 2050 ou 2100, aucune prise en compte du comportement réel des occupants.
              </p>
            </div>
            {drawerFields.length > 0 && level === "A_EXACT_UNIT" && (
              <div>
                <div style={{ fontWeight: 500, color: "var(--fg-2)", marginBottom: 4 }}>Autres caractéristiques renseignées</div>
                <p style={{ margin: 0 }}>{drawerFields.map((f) => f.label).join(", ")}.</p>
              </div>
            )}
          </Drawer>
        )}
      </div>
    </ReportSection>
  );
}
