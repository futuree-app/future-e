import React from "react";
import { autresPhenomenes, natureInondation, phenomenesInondation, type RegulatoryPlan } from "@/lib/pprn-zonage";
import { dateLongue } from "@/lib/data/gaspar-pprn-inondation";
import { PORTEE_ETAT_DES_RISQUES } from "@/lib/decision/inondation-lecture";
import type { LogementReport } from "@/lib/logement-report-types";
import type { HeritageProtection, HeritageStatus } from "@/lib/gpu-servitudes";
import type { UrbanismeParcelle } from "@/lib/urbanisme-parcelle";
import { UrbanismeBlock } from "./UrbanismeBlock";
import { BruitAerienLogement } from "@/components/report/BruitAerienBlocs";
import type { LectureBruitAerien } from "@/lib/bruit-aerien";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { Disclosure } from "./kit";

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
  // FUT-127 : sans ces deux modèles, le dépliable ne nommait aucun risque pour un plan littoral
  // (La Rochelle, Charron) ou multirisque. Le libellé du modèle ne vaut que faute d'aléas lus.
  "PPRN-L": "Risques littoraux (submersion marine, recul du trait de côte)",
  "PPRN-Multi": "Plusieurs risques",
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

// Patrimoine protégé au point. Les familles sont NOMMÉES chacune une fois ; la phrase de procédure
// est portée UNE SEULE fois pour le bloc, sans quoi deux familles produiraient deux fois le même
// paragraphe. Aucun compteur, aucun nom de monument : un point est dans autant d'assiettes qu'il y a
// de monuments autour (134 Place Stanislas). Copie arbitrée par le porteur, ne pas reformuler.
function HeritageBlock({
  protections,
  withDivider,
}: {
  protections: HeritageProtection[];
  withDivider: boolean;
}) {
  return (
    <div style={withDivider ? { paddingTop: 12, borderTop: "1px solid var(--border-1)" } : undefined}>
      <p style={{ fontSize: 12.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 8px" }}>
        Patrimoine protégé à cette adresse
      </p>
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: "0 0 8px" }}>
        {protections.map((p) => p.label).join(" · ")}
      </p>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
        Cette adresse se situe dans un périmètre patrimonial. Certains travaux modifiant l’aspect
        extérieur du bâtiment peuvent nécessiter une autorisation et l’avis de l’Architecte des
        Bâtiments de France. À vérifier en mairie avant devis ou dépôt de dossier.
      </p>
      <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, marginTop: 8 }}>
        D’après les servitudes publiées au Géoportail de l’urbanisme.
      </p>
    </div>
  );
}

export function RegulatoryStatusBlock({
  georisques,
  heritage,
  urbanisme,
  bruitAerien,
}: {
  georisques: LogementReport["georisques"];
  heritage: HeritageStatus | null;
  /**
   * FUT-81 : le plan d'urbanisme de la parcelle. Absent : l'appelant ne le connaît pas (bancs antérieurs),
   * rien ne s'affiche. Présent avec `lecture` indéfinie : un rapport collecté avant FUT-81, qui le dit.
   * Le rattachement de la parcelle voyage DANS la lecture (`rattachement`), pas à côté.
   */
  urbanisme?: { lecture: UrbanismeParcelle | undefined; parcelCode: string | null };
  /**
   * FUT-146 : les plans de bruit aérien du bien. Absent (rapport antérieur, ou banc qui ne le passe pas) :
   * rien ne s'affiche, ni « hors zone » ni une panne.
   */
  bruitAerien?: LectureBruitAerien;
}) {
  const g = georisques?.parcel ?? georisques?.address;
  const grainLu: "parcelle" | "point" = georisques?.parcel ? "parcelle" : "point";
  const plans = g?.regulatoryPlans ?? [];
  // FUT-127 : un plan qui réglemente l'inondation (ou dont l'aléa reste à confirmer) appelle la mention
  // de portée : cette lecture n'est pas l'état des risques du bien.
  const portee = plans.some((p) => natureInondation(p) !== "autre");
  const protections = heritage?.items ?? [];
  return (
    <ReportSection eyebrow="Statut réglementaire à cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 16 }}>
          {!g ? (
            // État B : la source n'a pas permis de qualifier le point.
            <>
              {/* FUT-81 : le titre nomme ce qui n'est pas déterminé. Le plan d'urbanisme, lu plus bas, l'est
                  peut-être : « statut réglementaire non déterminé » aurait contredit le bloc suivant. */}
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>Risques réglementés non déterminés</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>Les données Géorisques interrogées n’ont pas permis de dire si un plan de prévention des risques s’applique à cette adresse.</p>
            </>
          ) : plans.length === 0 && protections.length === 0 ? (
            // État A : la source a répondu, aucun zonage ni protection patrimoniale au point.
            <>
              {/* FUT-81 : « aucune règle de construction particulière » était faux dès qu'un plan d'urbanisme
                  s'applique, c'est-à-dire presque partout. L'état dit désormais ce qu'il a vérifié : ni plan
                  de prévention des risques, ni périmètre patrimonial. */}
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>Ni plan de prévention des risques ni périmètre patrimonial à cette adresse</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                La commune peut avoir un plan de prévention des risques sans que ce logement tombe dans l’une de ses zones à règles. Cela ne veut pas dire qu’il n’y a aucun risque ici, seulement qu’aucune de ces deux contraintes ne s’applique précisément à cette adresse.
              </p>
            </>
          ) : (
            <>
              {plans.length > 0 && (
                <>
                  {/* Niveau 1 : comprendre en cinq secondes */}
                  <p style={{ fontSize: 15, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>{regulatoryHeadline(plans)}</p>
                  {/* Niveau 2 : le fait précis, par plan */}
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
                  {/* Niveau 3 : méthode et détail technique, repliés */}
                  <Disclosure summary="Comprendre ce classement">
                    {/* FUT-127 : le grain dit la lecture RÉELLEMENT utilisée. La parcelle prime quand elle a
                        répondu ; l'ancienne phrase disait « pas à la géométrie de la parcelle » dans ce cas. */}
                    <div>{grainLu === "parcelle"
                      ? "Grain : parcelle cadastrale rattachée à l'adresse. Une parcelle peut être traversée par plusieurs zones."
                      : "Grain : point géocodé de l'adresse, pas la géométrie de la parcelle."}</div>
                    {plans.map((p, i) => {
                      // FUT-127 : les aléas lus dans le détail du plan priment sur le libellé du modèle.
                      const lus = [...phenomenesInondation(p), ...autresPhenomenes(p)];
                      const hazard = lus.length > 0
                        ? lus.join(", ")
                        : p.hazardModel ? HAZARD_LABEL[p.hazardModel] ?? null : null;
                      const approuve = dateLongue(p.approvedAt ?? null);
                      return (
                        <div key={i}>
                          {p.plan ?? "Plan"}
                          {hazard ? ` · risque concerné : ${hazard}` : ""}
                          {p.zones[0]?.regime ? ` · régime officiel : ${p.zones[0].regime}` : ""}
                          {approuve ? ` · approuvé le ${approuve}` : ""}
                          {p.updatedAt ? ` · date de référence Géorisques : ${p.updatedAt}` : ""}
                        </div>
                      );
                    })}
                    <div>Géorisques (PPRN, information réglementaire). Le classement ne résume pas le règlement : les travaux autorisés ou interdits ne se lisent que dans le règlement officiel de la zone.</div>
                  </Disclosure>
                  {portee ? (
                    // P0-D (FUT-127) : la lecture ne se substitue pas au document de la transaction.
                    <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
                      {PORTEE_ETAT_DES_RISQUES}
                    </div>
                  ) : null}
                </>
              )}
              {protections.length > 0 && <HeritageBlock protections={protections} withDivider={plans.length > 0} />}
            </>
          )}
          {urbanisme && (
            <UrbanismeBlock
              urbanisme={urbanisme.lecture}
              parcelCode={urbanisme.parcelCode}
              withDivider
            />
          )}
          <BruitAerienLogement lecture={bruitAerien} withDivider />
        </div>
      </GlassCard>
    </ReportSection>
  );
}
