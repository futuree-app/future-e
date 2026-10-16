import type { AuditRecord, AuditStatus } from "@/lib/audit-record";
import { formatKwhEpM2 } from "@/lib/audit-record";
import {
  lireAuditPourDecision, phraseTravaux,
  type ArriveeLue, type DepartLu, type DpeRetenu, type VoixAudit,
} from "@/lib/audit-lecture";
import { bindOrphans } from "@/lib/typography";

// L'AUDIT ÉNERGÉTIQUE, LU POUR DÉCIDER (FUT-62). Trois niveaux, du plus utile au plus détaillé :
//   1. le fait : un audit existe, sur quoi il porte, d'où part l'objet audité et où mène la rénovation
//      complète proposée, combien de parcours ;
//   2. les parcours, repliés : leurs étapes dans l'ordre de la source, la consommation estimée après
//      chacune, et les travaux que la source donne pour chacune ;
//   3. ce qu'il reste à vérifier, adressé à qui lit (achat, habitant, ou voix neutre).
// Toute la lecture vient de `lireAuditPourDecision` (pur, testé) : ce composant ne décide rien.
//
// MONTÉ HORS DE L'ATTRIBUTION DU DPE. Avant FUT-62, l'audit ne s'affichait que lorsqu'un diagnostic
// était attribué au logement : tant que le lecteur n'avait pas choisi parmi les diagnostics de l'adresse,
// l'audit de l'immeuble, qui ne dépend d'aucun d'eux, restait invisible.

// Le nombre seul, au format de `formatKwhEpM2` (dixième, séparateurs insécables) : l'unité s'écrit à part.
const nombreSeul = (v: number) => formatKwhEpM2(v).replace(/\s*kWh EP\/m²\/an$/, "");

function Valeur({ valeur, unite = true }: { valeur: string; unite?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 22, fontWeight: 500, color: "var(--fg-hi)", fontVariantNumeric: "tabular-nums" }}>{valeur}</span>
      {unite && <span style={{ fontSize: 12, color: "var(--fg-4)" }}>kWh EP/m²/an</span>}
    </span>
  );
}

function valeurDepart(d: DepartLu) {
  if (d.statut === "unique") return <Valeur valeur={nombreSeul(d.valeur)} />;
  if (d.statut === "multiple") return <Valeur valeur={d.valeurs.map(nombreSeul).join(" ou ")} />;
  return <span style={{ fontSize: 14, color: "var(--fg-3)" }}>Non renseigné par la source</span>;
}

function valeurArrivee(a: ArriveeLue, nParcours: number) {
  if (a.statut === "unique") return <Valeur valeur={nombreSeul(a.valeur)} />;
  if (a.statut === "plage") return <Valeur valeur={`${nombreSeul(a.min)} à ${nombreSeul(a.max)}`} />;
  return (
    <span style={{ fontSize: 14, color: "var(--fg-3)" }}>
      {nParcours === 0 ? "L'audit ne décrit aucun parcours de travaux" : "Non établie : tous les parcours ne sont pas décrits jusqu'à leur fin"}
    </span>
  );
}

const labelValeur = { fontSize: 12.5, color: "var(--fg-3)" };

export function AuditEnergetiqueBlock({
  audit, autres = [], autresIncomplets = false, auditStatus, dpe = null, voix = "neutre", detailsOuverts = false,
}: {
  audit: AuditRecord | null | undefined;
  autres?: AuditRecord[];
  autresIncomplets?: boolean;
  auditStatus?: AuditStatus;
  /** Le diagnostic retenu pour ce logement, s'il y en a un : son numéro et sa consommation. */
  dpe?: DpeRetenu;
  voix?: VoixAudit;
  /** Banc de revue seulement : les parcours rendus dépliés. */
  detailsOuverts?: boolean;
}) {
  // FUT-65 : la base des audits n'a pas répondu. On ne sait pas s'il en existe un : on le dit, une fois.
  // Absent ou rapport ancien : rien, comme avant.
  if (auditStatus === "unavailable") {
    return (
      <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
        Audit énergétique non vérifiable pour le moment : la base ADEME n&apos;a pas répondu lors de cette collecte.
      </p>
    );
  }
  // Un audit ne s'affiche que s'il est rattaché par l'identifiant BAN de l'adresse (FUT-59). Le candidat
  // voisin du rapport n'atteint jamais ce composant.
  if (!audit || audit.correspondance !== "exact_address" || audit.scenarios.length === 0) return null;

  const l = lireAuditPourDecision({ audit, autres, autresIncomplets, dpe, voix });

  return (
    <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 16 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-dim, #7a6e60)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Audit énergétique
      </div>

      {/* 1. LE FAIT */}
      <div style={{ display: "grid", gap: 6 }}>
        <p style={{ fontSize: 16, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.45, margin: 0 }}>{bindOrphans(l.titre)}</p>
        <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          {bindOrphans(l.portee)}{l.date ? ` ${l.date}.` : ""}
        </p>
      </div>

      {/* L'état documenté et l'estimation après travaux ne se ressemblent pas : trait plein pour ce que
          l'audit a relevé, pointillés pour ce qu'il estime. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <div style={{ padding: "12px 14px", background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, display: "grid", gap: 4, alignContent: "start" }}>
          <span style={labelValeur}>Avant travaux, selon l&apos;audit</span>
          {valeurDepart(l.depart)}
        </div>
        <div style={{ padding: "12px 14px", border: "1px dashed var(--border-1)", borderRadius: 10, display: "grid", gap: 4, alignContent: "start" }}>
          <span style={labelValeur}>Après la rénovation complète proposée</span>
          {valeurArrivee(l.arrivee, l.parcours.length)}
          {l.arrivee.statut !== "non_etablie" && <span style={{ fontSize: 12, color: "var(--fg-4)" }}>
            {l.arrivee.statut === "plage" ? "Estimation de l'auditeur, selon le parcours. Pas une garantie." : "Estimation de l'auditeur, pas une garantie."}
          </span>}
        </div>
      </div>

      {l.phraseParcours && <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{bindOrphans(l.phraseParcours)}</p>}
      {l.lienDpe && <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>{bindOrphans(l.lienDpe)}</p>}

      {/* 2. LES PARCOURS, REPLIÉS. Chaque étape garde son libellé, sa valeur et SES travaux (ceux de sa
          ligne dans la source) : rien n'est réparti, déduit ni fusionné d'une étape à l'autre. */}
      {l.parcours.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {l.parcours.map((p) => (
            <details key={p.cle} open={detailsOuverts || undefined} className="group" style={{ background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10 }}>
              <summary
                className="[&::-webkit-details-marker]:hidden"
                style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "baseline", gap: 10, padding: "12px 14px", flexWrap: "wrap" }}
              >
                <span className="transition-transform group-open:rotate-90" aria-hidden style={{ display: "inline-block", fontSize: 11, color: "var(--fg-4)" }}>▸</span>
                <span style={{ fontSize: 14, color: "var(--fg-hi)", fontWeight: 500 }}>{p.titre}</span>
                <span style={{ fontSize: 12.5, color: "var(--fg-4)" }}>
                  {p.etapes.length > 1 ? `${p.etapes.length} étapes` : "1 étape"}
                  {p.arrivee != null ? ` · ${formatKwhEpM2(p.arrivee)} à la fin` : ""}
                </span>
              </summary>
              <ol style={{ listStyle: "none", margin: 0, padding: "0 14px 14px", display: "grid", gap: 12 }}>
                {p.etapes.map((e, i) => {
                  const travaux = phraseTravaux(e.travaux);
                  return (
                    <li key={`${p.cle}-${i}`} style={{ display: "grid", gap: 3, paddingTop: 10, borderTop: "1px solid var(--border-1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <span style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>{e.libelle}</span>
                        {/* Valeur PAR M² (source `ep_conso_5_usages_m2`). Avant FUT-59 : le total annuel, sous l'unité par m². */}
                        {e.conso_ep_m2 != null && (
                          <span style={{ fontSize: 13, color: "var(--fg-1)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                            {formatKwhEpM2(e.conso_ep_m2)}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12.5, color: travaux ? "var(--fg-3)" : "var(--fg-4)", lineHeight: 1.55 }}>
                        {travaux ?? "Travaux de l'étape non renseignés par la source"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </div>
      )}

      {l.autresAudits && <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>{bindOrphans(l.autresAudits)}</p>}

      {/* 3. CE QU'IL RESTE À VÉRIFIER. Des questions à poser, jamais l'affirmation que des travaux ont été
          votés, financés ou programmés. */}
      {l.verifications.length > 0 && (
        <div style={{ padding: "12px 14px", border: "1px solid var(--border-1)", background: "var(--bg-elev)", borderRadius: 10, display: "grid", gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-hi)" }}>{l.titreVerifications}</span>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {l.verifications.map((v) => (
              <li key={v} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                <span aria-hidden style={{ color: "var(--fg-4)", flexShrink: 0 }}>▸</span>
                <span>{bindOrphans(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
        Consommations en énergie primaire, par m² de la surface auditée, estimées par l&apos;auditeur. Le coût des travaux, les aides et l&apos;étiquette visée ne figurent pas ici.
      </p>
    </div>
  );
}
