import React from "react";
import type { RegulatoryPlan } from "@/lib/pprn-zonage";
import type { LogementReport } from "@/lib/logement-report-types";
import type { OnrnSinistralite } from "@/lib/onrn-sinistralite";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { Disclosure } from "./kit";
import { POSTURE_FOR_PROJET } from "./posture";

// Statut réglementaire au point (Face 2) — exploite le zonage PPRN déjà renvoyé par
// Géorisques (spike 2026-07-03 : /api/v2/gaspar/pprn suffit). On CONSERVE le terme
// réglementaire officiel + une glose en langage courant ; on ne déduit JAMAIS les travaux
// autorisés ou interdits (le règlement local seul les porte).
const REGIME_GLOSS: Record<string, { title: string; note: string }> = {
  "01": { title: "Zone de prescriptions (hors zone d’aléa)", note: "Des conditions particulières peuvent s’appliquer. Le détail dépend du règlement officiel de cette zone." },
  "02": { title: "Zone soumise à prescriptions", note: "Des conditions particulières peuvent s’appliquer aux projets et aux travaux. Le détail dépend du règlement officiel de cette zone." },
  "03": { title: "Zone relevant d’un régime d’interdiction", note: "Certains projets peuvent être interdits. Les possibilités concernant le logement existant dépendent du règlement local." },
  "04": { title: "Zone relevant d’un régime d’interdiction stricte", note: "C’est le régime réglementaire le plus contraignant. Le classement seul ne permet pas de déterminer les travaux précisément autorisés ou interdits." },
  "05": { title: "Zone où un délaissement est possible", note: "Régime réglementaire particulier. Le détail dépend du règlement officiel de cette zone." },
  "06": { title: "Zone où une expropriation est possible", note: "Régime réglementaire particulier. Le détail dépend du règlement officiel de cette zone." },
};
// Couleur du titre par sévérité RÉGLEMENTAIRE officielle (pas un score) : prescriptions =
// ambre du rapport, interdiction = orange, interdiction stricte = rouge. Évite qu'une simple
// prescription ressemble à une alerte critique.
const REGIME_COLOR: Record<string, string> = {
  "01": "var(--yellow, #b8a042)",
  "02": "var(--yellow, #b8a042)",
  "03": "var(--orange, #c47a3a)",
  "04": "var(--red, #f87171)",
  "05": "var(--orange, #c47a3a)",
  "06": "var(--red, #f87171)",
};
function regimeColor(code: string | null): string {
  return REGIME_COLOR[code ?? ""] ?? "var(--fg-hi)";
}
// Aléa lisible à partir du modèle de procédure (bonus ; à défaut on s’appuie sur le nom du plan).
const HAZARD_LABEL: Record<string, string> = {
  "PPRN-I": "Inondation",
  "PPRN-RGA": "Retrait-gonflement des argiles",
  "PPRN-MT": "Mouvements de terrain",
  "PPRN-SM": "Submersion marine",
  "PPRN-F": "Feux de forêt",
  "PPRN-A": "Avalanches",
  "PPRN-S": "Séisme",
};
// Libellé de famille (métadonnée secondaire au-dessus d'un fait).
const FAMILY_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--fg-4)",
};

// Libellé de zone lisible et non redondant : « Zone B2 — faiblement à moyennement exposée ».
// La donnée répète souvent le code dans le nom (« … (B2) ») et le préfixe « Zone » : on purge.
function zoneLabel(zoneCode: string | null, zoneName: string | null): string | null {
  let name = (zoneName ?? "").trim();
  if (zoneCode && name.endsWith(`(${zoneCode})`)) name = name.slice(0, -(zoneCode.length + 2)).trim();
  name = name.replace(/^zone\s+/i, "").trim();
  if (zoneCode && name) return `Zone ${zoneCode} : ${name}`;
  if (zoneCode) return `Zone ${zoneCode}`;
  return name || null;
}

function RegulatoryPlanCard({ plan, roleLabel }: { plan: RegulatoryPlan; roleLabel?: string }) {
  const fiche = plan.gasparId
    ? `https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/${plan.gasparId}`
    : null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {roleLabel && <div style={FAMILY_LABEL}>{roleLabel}</div>}
      {plan.zones.length > 0 ? (
        plan.zones.map((z, i) => {
          const g = REGIME_GLOSS[z.regimeCode ?? ""] ?? { title: z.regime ?? "Zone réglementée", note: "Le détail dépend du règlement officiel de cette zone." };
          const zl = zoneLabel(z.zoneCode, z.zoneName);
          return (
            <div key={i} style={{ display: "grid", gap: 4 }}>
              {/* Terme réglementaire officiel, en ancre scannable, coloré par sévérité */}
              <div style={{ fontSize: 15, fontWeight: 500, color: regimeColor(z.regimeCode) }}>{g.title}</div>
              {/* Plan puis zone, en faits secondaires (une idée par ligne, pas de phrase dense) */}
              {plan.plan && <div style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{plan.plan}</div>}
              {zl && <div style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>{zl}</div>}
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, marginTop: 2 }}>{g.note}</div>
            </div>
          );
        })
      ) : (
        // État C : plan présent au point, zone non détaillée dans la donnée reçue.
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            {plan.plan ? <>Cette adresse relève du <strong style={{ color: "var(--fg-hi)" }}>{plan.plan}</strong>.</> : "Cette adresse relève d’un plan de prévention."}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>Le régime ou le libellé détaillé de la zone n’est pas disponible dans les données reçues.</div>
        </div>
      )}
      {fiche && (
        <a href={fiche} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", marginTop: 2 }}>
          Consulter la fiche officielle du plan →
        </a>
      )}
    </div>
  );
}

// Niveau 1 — phrase langage courant, honnête, sensible à la sévérité SANS produire de score.
function regulatoryHeadline(plans: RegulatoryPlan[]): string {
  const topRank = plans[0]?.topRegimeRank ?? 99;
  return topRank <= 1
    ? "Cette adresse se situe dans une zone où certains projets et travaux peuvent être interdits ou strictement encadrés."
    : "Cette adresse se situe dans une zone où certains projets et travaux peuvent être soumis à des règles particulières.";
}

export function RegulatoryStatusBlock({ georisques }: { georisques: LogementReport["georisques"] }) {
  const g = georisques?.parcel ?? georisques?.address;
  const plans = g?.regulatoryPlans ?? [];
  return (
    <ReportSection eyebrow="Statut réglementaire à cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 16 }}>
          {!g ? (
            // État B : la source n'a pas permis de qualifier le point.
            <>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>Statut réglementaire non déterminé</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>Les données interrogées n’ont pas permis de qualifier cette adresse.</p>
            </>
          ) : plans.length === 0 ? (
            // État A : la source a répondu, aucun zonage n'intersecte le point.
            <>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>Aucune zone réglementée identifiée à cette adresse</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                La commune peut être couverte par un plan de prévention sans que le point se situe dans l’une de ses zones réglementées. Cela ne signifie pas que le logement est exempt de tout risque.
              </p>
            </>
          ) : (
            <>
              {/* Niveau 1 — comprendre en cinq secondes */}
              <p style={{ fontSize: 15, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>{regulatoryHeadline(plans)}</p>
              {/* Niveau 2 — le fait précis, par plan */}
              {plans.length === 1 ? (
                <RegulatoryPlanCard plan={plans[0]} />
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  <RegulatoryPlanCard plan={plans[0]} roleLabel="Règle la plus contraignante" />
                  {plans.slice(1).map((p, i) => (
                    <div key={i} style={{ paddingTop: 12, borderTop: "1px solid var(--border-1)" }}>
                      <RegulatoryPlanCard plan={p} roleLabel="Autre zonage applicable" />
                    </div>
                  ))}
                  <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
                    Ces zonages peuvent concerner des phénomènes ou des règlements différents.
                  </div>
                </div>
              )}
              {/* Niveau 3 — méthode et détail technique, repliés */}
              <Disclosure summary="Comprendre ce classement">
                <div>Grain : adresse (la donnée répond au point géocodé, pas à la géométrie de la parcelle).</div>
                {plans.map((p, i) => {
                  const hazard = p.hazardModel ? HAZARD_LABEL[p.hazardModel] ?? null : null;
                  return (
                    <div key={i}>
                      {p.plan ?? "Plan"}
                      {hazard ? ` · risque concerné : ${hazard}` : ""}
                      {p.zones[0]?.regime ? ` · régime officiel : ${p.zones[0].regime}` : ""}
                      {p.updatedAt ? ` · date de référence Géorisques : ${p.updatedAt}` : ""}
                    </div>
                  );
                })}
                <div>Géorisques (PPRN, information réglementaire). Le classement ne résume pas le règlement : les travaux autorisés ou interdits ne se lisent que dans le règlement officiel de la zone.</div>
              </Disclosure>
            </>
          )}
        </div>
      </GlassCard>
    </ReportSection>
  );
}

// « Ce que cela mérite de vérifier » — traduit la donnée en action, adaptée à la posture.
// Déterministe, jamais un score ni une injonction alarmiste (« Qu'est-ce que j'en fais ? »).
export function Face2Implication({ projet, georisques, sinistralite }: { projet: string | null; georisques: LogementReport["georisques"]; sinistralite: OnrnSinistralite | null | undefined }) {
  const g = georisques?.parcel ?? georisques?.address;
  const hasZone = (g?.regulatoryPlans?.length ?? 0) > 0;
  const siniActive = Boolean(sinistralite) && [sinistralite!.secheresse.kind, sinistralite!.inondation.kind].some((k) => k === "lecture" || k === "faible_repr");
  if (!hasZone && !siniActive) return null;
  const posture = POSTURE_FOR_PROJET[projet ?? "reside"] ?? "residence";
  return (
    <ReportSection eyebrow="Ce que cela mérite de vérifier" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
            {hasZone
              ? "Ce logement relève d’au moins une zone réglementée, et la commune a connu des sinistres indemnisés. Rien n’est certain pour ce bien, mais cela oriente ce qu’il vaut la peine de regarder."
              : "La commune a connu des sinistres indemnisés. Rien n’est certain pour ce bien, mais cela oriente ce qu’il vaut la peine de regarder."}
          </p>
          <p style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.65, margin: 0 }}>
            {posture === "prospection"
              ? "Avant d’acheter : demandez si des sinistres (fissures liées à la sécheresse, dégâts des eaux) ont déjà été déclarés, et consultez le règlement de la zone avant tout projet de travaux ou d’extension."
              : "Si vous occupez ce logement : surveillez l’évolution d’éventuelles fissures, conservez les justificatifs de travaux et de sinistres, et vérifiez le règlement de la zone avant un projet d’extension."}
          </p>
        </div>
      </GlassCard>
    </ReportSection>
  );
}
