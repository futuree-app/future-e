import type { LogementReport } from "@/lib/logement-report-types";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { AddressDiagnosticsBlock } from "./AddressDiagnosticsBlock";
import { DpeBadge, Block, DPE_LABELS } from "./kit";

// Face 1 — Énergie & rénovation : attribution du DPE au logement (sélecteur / absence / rejet /
// diagnostic confirmé) et audit énergétique s'il existe. La lecture thermique riche (confort d'été)
// vit dans ThermalComfortSection, montée séparément. Ici, seul le DPE attribué (jamais un candidat).
export type DpeUiStatus =
  | "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error";

/** Le lien discret qui rouvre la sélection. Le libellé suit QUI a attribué le diagnostic. */
function LienReprise({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none",
        border: "none", cursor: busy ? "default" : "pointer", padding: 0, font: "inherit",
        opacity: busy ? 0.5 : 1,
      }}
    >
      {busy ? "Enregistrement…" : label}
    </button>
  );
}

export function EnergieSection({
  dpeStatus, dpe, audit, candidates, busy = false, erreur = null,
  onPick, onNotInList, onReselect,
}: {
  dpeStatus: DpeUiStatus;
  dpe: DpeRecord | null;
  audit: LogementReport["audit"];
  /** Tous les diagnostics rattachés à l'adresse, attribués ou non. */
  candidates: DpeRecord[];
  /** Une écriture de sélection est en cours : les gestes attendent sa réponse. */
  busy?: boolean;
  /** Le serveur a refusé le dernier geste, et l'écran est revenu à l'état d'avant. */
  erreur?: string | null;
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
  onReselect: () => void;
}) {
  // LA SÉLECTION NE BLOQUE PLUS LE RAPPORT (31/07/2026). Elle se faisait avant lui, dans un écran
  // `PreciseLogementStep` qui masquait tout le module tant que le lecteur n'avait pas désigné son
  // diagnostic parmi ceux de l'adresse. À vingt-quatre candidats, décrits par une surface, un
  // étage et un numéro de porte, quelqu'un qui ENVISAGE d'acheter ne peut pas répondre : il ne
  // voyait donc pas le dossier qu'il venait de payer. Et répondre « mon logement n'est pas dans
  // cette liste » réduisait cette section à une phrase.
  //
  // Deux états quand rien n'est attribué. Soit l'adresse porte des diagnostics, et ils se lisent
  // comme un CONTEXTE D'ADRESSE, jamais comme une caractéristique de ce logement-ci. Soit elle
  // n'en porte aucun, et on le dit sans prétendre qu'il n'en existe pas.
  const nonAttribue = dpeStatus === "selection_required" || dpeStatus === "rejected" || !dpe;

  if (nonAttribue) {
    return (
      <ReportSection eyebrow="Diagnostics à cette adresse" tone="orange">
        <GlassCard>
          {erreur ? <p style={{ fontSize: 13.5, color: "var(--danger, #c0563a)", lineHeight: 1.6, margin: "0 0 14px" }}>{erreur}</p> : null}
          {candidates.length > 0 ? (
            <AddressDiagnosticsBlock
              candidates={candidates}
              onPick={onPick}
              onNotInList={onNotInList}
            />
          ) : (
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
              Aucun diagnostic de performance énergétique n&apos;est rattaché à cette adresse dans
              la base ouverte. Cela ne veut pas dire qu&apos;aucun n&apos;existe : il peut ne pas y
              avoir été versé.
            </p>
          )}
        </GlassCard>
      </ReportSection>
    );
  }
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
        {/* LA REPRISE EXISTE DANS TOUS LES ÉTATS ATTRIBUÉS (19/08/2026). Elle n'était offerte que
            pour une attribution AUTOMATIQUE : dès que le lecteur avait désigné lui-même son
            diagnostic, l'écran ne rendait plus aucune sortie, comme si un choix humain ne pouvait
            pas être une erreur de clic. C'est pourtant le seul geste de cet écran qui en produise,
            puisque les lignes d'un immeuble se ressemblent. */}
        <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
          {dpeStatus === "auto_confirmed"
            ? "Un DPE a été retrouvé pour cette adresse. "
            : "Vous avez désigné ce diagnostic parmi ceux de cette adresse. "}
          <LienReprise
            busy={busy}
            onClick={onReselect}
            label={dpeStatus === "auto_confirmed" ? "Ce n'est pas le bon diagnostic" : "Changer de diagnostic"}
          />.
        </p>
        {erreur ? <p style={{ fontSize: 13, color: "var(--danger, #c0563a)", lineHeight: 1.55, margin: 0 }}>{erreur}</p> : null}

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
