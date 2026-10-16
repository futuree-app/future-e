import React from "react";
import { ReportSection } from "@/components/report/kit";
import { ChipTooltip } from "@/components/ChipTooltip";
import { IconClock } from "@/components/report/logement/icons";
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

export function ThermalComfortSection({
  evidence, dpeYear, dpeNonVerifiable = false,
}: {
  evidence: ThermalEvidence;
  dpeYear: string | null;
  /** FUT-65 : la base des diagnostics n'a pas répondu. « Rien n'a été retrouvé » serait faux. */
  dpeNonVerifiable?: boolean;
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
                ? "D'après le diagnostic, ce logement garde mal la fraîcheur quand il fait chaud."
                : indicator === "bon"
                  ? "D'après le diagnostic, ce logement garde plutôt bien la fraîcheur en été."
                  : "D'après le diagnostic, ce logement garde moyennement la fraîcheur en été."}
            </p>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 6 }}>
              Voici les caractéristiques du logement qui l&apos;expliquent.
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
                {dpeNonVerifiable
                  ? "La base des diagnostics de performance énergétique (ADEME) n'a pas répondu lors de cette collecte : aucun diagnostic n'a pu être lu pour cette adresse."
                  : <>Aucun diagnostic de performance énergétique attribuable à cette adresse, ou suffisamment renseigné, n&apos;a été retrouvé dans les données publiques. Ce n&apos;est pas une anomalie : la couverture des DPE reste partielle.</>}
              </p>
            </Drawer>
          </>
        )}

        {/* AUCUNE PHRASE CLIMATIQUE ICI (FUT-112, 16/10/2026). Un bloc « Dans le climat futur » écrivait
            « Avec la progression des nuits chaudes à {commune} » pour toute adresse, sans lire la
            moindre donnée climatique : contredit par l'indicateur sur 59 communes où les nuits tropicales ne progressent pas
            d'ici 2050, à moins d'une nuit par an sur 239 (audit FUT-85, §D.2). Le signal que reçoit le
            module (`climatProjete`) ne peut pas le remplacer : « marquee » peut venir des seules journées
            > 30 °C, et `null` mêle hausse modérée, donnée absente et commune non couverte. Une lecture
            de la chaleur future ne revient ici qu'appuyée sur les faits de la commune (pilote FUT-20). */}
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
