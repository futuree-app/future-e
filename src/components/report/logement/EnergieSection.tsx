import type { LogementReport } from "@/lib/logement-report-types";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { AddressDiagnosticsBlock } from "./AddressDiagnosticsBlock";
import { SaisieNumeroDpe } from "./SaisieNumeroDpe";
import { DpeBadge, Block, DPE_LABELS } from "./kit";
import { formatGesM2, formatKwhEpM2 } from "@/lib/audit-record";
import type { VoixAudit } from "@/lib/audit-lecture";
import { AuditEnergetiqueBlock } from "./AuditEnergetiqueBlock";
import { dateFr } from "@/lib/decision/autour-permis";
import { phraseAttribution, phraseChoixEcarte, phraseEtabliDepuisImmeuble, vueSectionDpe } from "@/lib/dpe-selection-vue";
import { grainDpe } from "@/lib/dpe-grain";

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
  dpeStatus, dpe, dpeEcarte = null, audit, auditStatus, autresAudits = [], autresAuditsIncomplets = false, voixAudit = "neutre", auditDetailsOuverts = false,
  candidates, dpeNonVerifiable = false, listeDpeIncomplete = false, dossierId, busy = false, erreur = null,
  onPick, onNotInList, onReselect, onPickParNumero,
}: {
  dpeStatus: DpeUiStatus;
  dpe: DpeRecord | null;
  /**
   * FUT-74 (D4) : le diagnostic retenu au dossier qui ne porte pas sur un logement (un DPE d'immeuble
   * choisi avant que la route ne le refuse). Il reste inscrit ; la section dit pourquoi elle ne le lit
   * plus, et offre d'en retirer le choix. `dpe` vaut alors `null`.
   */
  dpeEcarte?: DpeRecord | null;
  audit: LogementReport["audit"];
  /** FUT-65 : `unavailable` dit que l'audit n'a pas pu être vérifié ; `undefined` (rapport ancien) ne dit rien. */
  auditStatus?: LogementReport["auditStatus"];
  /** FUT-62 : les autres audits publiés pour la même adresse, et si leur liste est incomplète. */
  autresAudits?: NonNullable<LogementReport["autresAudits"]>;
  autresAuditsIncomplets?: boolean;
  /** FUT-62 : à qui parlent les vérifications de l'audit (relation déclarée à ce bien). */
  voixAudit?: VoixAudit;
  /** Banc de revue seulement : les parcours de l'audit rendus dépliés. */
  auditDetailsOuverts?: boolean;
  /** Tous les diagnostics rattachés à l'adresse, attribués ou non. */
  candidates: DpeRecord[];
  /** FUT-65 : la base des diagnostics n'a pas répondu et n'a rien rendu. La liste vide ne prouve rien. */
  dpeNonVerifiable?: boolean;
  /** FUT-65 : un des deux jeux ADEME n'a pas répondu. La liste montrée n'est pas exhaustive. */
  listeDpeIncomplete?: boolean;
  /** Le dossier lu, dont la saisie par numéro a besoin pour rapprocher l'adresse trouvée. */
  dossierId: string;
  /** Une écriture de sélection est en cours : les gestes attendent sa réponse. */
  busy?: boolean;
  /** Le serveur a refusé le dernier geste, et l'écran est revenu à l'état d'avant. */
  erreur?: string | null;
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
  onReselect: () => void;
  /** Rattache un diagnostic trouvé par son numéro, y compris hors de la liste de l'adresse. */
  onPickParNumero: (d: DpeRecord) => void;
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
  // La vue se décide dans `vueSectionDpe` (pur, testé) : ses cinq états ne se confondent jamais.
  const vue = vueSectionDpe({ statut: dpeStatus, dpeRetenu: dpe != null, candidats: candidates.length, baseMuette: dpeNonVerifiable });

  // FUT-62 : l'audit est trouvé par l'adresse, pas par le diagnostic. Il se lit donc dans TOUS les états
  // de la section, et pas seulement quand un diagnostic est attribué. Seul le diagnostic RETENU (jamais un
  // candidat) peut le relier à ce logement, par le numéro que la source publie.
  const blocAudit = (
    <AuditEnergetiqueBlock
      audit={audit}
      autres={autresAudits}
      autresIncomplets={autresAuditsIncomplets}
      auditStatus={auditStatus}
      dpe={vue === "attribue" && dpe ? { numero: dpe.id_dpe, conso_ep_m2: dpe.conso_ep_m2 } : null}
      voix={voixAudit}
      detailsOuverts={auditDetailsOuverts}
    />
  );
  const auditVisible = auditStatus === "unavailable"
    || (audit != null && audit.correspondance === "exact_address" && audit.scenarios.length > 0);

  if (vue !== "attribue" || !dpe) {
    const saisie = (
      <SaisieNumeroDpe dossierId={dossierId} busy={busy} onConfirm={onPickParNumero} />
    );
    return (
      <ReportSection eyebrow="Diagnostics à cette adresse" tone="orange">
        <GlassCard>
          {erreur ? <p style={{ fontSize: 13.5, color: "var(--danger, #c0563a)", lineHeight: 1.6, margin: "0 0 14px" }}>{erreur}</p> : null}

          {/* UN ANCIEN CHOIX QUI NE SERT PLUS SE DIT, IL NE DISPARAÎT PAS (FUT-74, D4). Rien n'est effacé :
              le lecteur voit ce qui avait été retenu, pourquoi le dossier ne le lit plus, et choisit. */}
          {dpeEcarte && (
            <div style={{ display: "grid", gap: 10, padding: "12px 14px", marginBottom: 16, borderRadius: 10, border: "1px solid var(--border-2)" }}>
              <p style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>
                {phraseChoixEcarte(grainDpe(dpeEcarte) === "immeuble" ? "immeuble" : "indetermine")}
              </p>
              <LienReprise busy={busy} onClick={onReselect} label="Retirer ce choix et désigner le diagnostic du logement" />
            </div>
          )}

          {/* LE REFUS EST UNE RÉPONSE, ET ELLE SE VOIT (20/08/2026). « Aucun de ces diagnostics
              n'est celui de ce logement » écrivait bien `not_in_list` en base, mais l'écran rendait
              exactement la même chose qu'avant le clic : même liste, même phrase, rien qui accuse
              réception. Le bouton passait pour mort, et c'est ce qui a été remonté du premier test
              avec un compte tiers.

              L'état porte donc maintenant sa propre réponse, un recours, et une sortie. */}
          {vue === "refuse" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>
                {candidates.length === 1
                  ? "C'est noté : le diagnostic de cette adresse ne décrit pas ce logement."
                  : "C'est noté : aucun diagnostic de cette adresse ne décrit ce logement."}
              </p>
              <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
                Le dossier n&apos;attribue donc aucune étiquette énergétique à ce logement, et ne
                prête à ce bien aucune des valeurs mesurées à cette adresse.
              </p>
              <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", display: "grid", gap: 12 }}>
                <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                  Si vous avez le document du diagnostic, son numéro le retrouve, même
                  lorsqu&apos;il est enregistré à une entrée voisine de la vôtre.
                </p>
                {saisie}
              </div>
              <button
                type="button"
                onClick={onReselect}
                disabled={busy}
                style={{ justifySelf: "start", fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: busy ? "default" : "pointer", padding: 0, opacity: busy ? 0.5 : 1 }}
              >
                {candidates.length > 0 ? "Revoir les diagnostics de cette adresse" : "Revenir sur cette réponse"}
              </button>
            </div>
          ) : vue === "a_choisir" ? (
            <AddressDiagnosticsBlock
              candidates={candidates}
              listeIncomplete={listeDpeIncomplete}
              dossierId={dossierId}
              busy={busy}
              onPick={onPick}
              onNotInList={onNotInList}
              onPickParNumero={onPickParNumero}
            />
          ) : (
            /* AUCUN CANDIDAT : LE NUMÉRO EST LE SEUL RECOURS, et il n'y a ici aucun bouton
               « aucun de ces diagnostics » à cliquer pour l'atteindre. C'est l'état où la saisie
               compte le plus, et c'était celui d'où elle était absente. */
            <div style={{ display: "grid", gap: 16 }}>
              {/* FUT-65 : une panne de la base n'est pas une absence de diagnostic. */}
              {dpeNonVerifiable ? (
                <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                  La base des diagnostics de performance énergétique (ADEME) n&apos;a pas répondu lors
                  de cette collecte : les diagnostics de cette adresse n&apos;ont pas pu être vérifiés.
                </p>
              ) : (
                <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                  Aucun diagnostic de performance énergétique n&apos;est rattaché à cette adresse dans
                  la base ouverte. Cela ne veut pas dire qu&apos;aucun n&apos;existe : il peut ne pas y
                  avoir été versé, ou y être enregistré à une entrée voisine.
                </p>
              )}
              <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", display: "grid", gap: 12 }}>
                <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                  Si vous avez le document du diagnostic, son numéro le retrouve où qu&apos;il soit
                  enregistré.
                </p>
                {saisie}
              </div>
            </div>
          )}
          {auditVisible && <div style={{ marginTop: 20 }}>{blocAudit}</div>}
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
              GES {dpe.etiquette_ges ?? "—"} · DPE du {(dpe.date_dpe ? dateFr(dpe.date_dpe) : null) ?? "—"}
            </div>
          </div>
        </div>
        {/* LA REPRISE EXISTE DANS TOUS LES ÉTATS ATTRIBUÉS (19/08/2026). Elle n'était offerte que
            pour une attribution AUTOMATIQUE : dès que le lecteur avait désigné lui-même son
            diagnostic, l'écran ne rendait plus aucune sortie, comme si un choix humain ne pouvait
            pas être une erreur de clic. C'est pourtant le seul geste de cet écran qui en produise,
            puisque les lignes d'un immeuble se ressemblent. */}
        <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
          {/* FUT-68 : la phrase nomme le critère de l'attribution automatique, sans jamais dire
              « votre diagnostic » (cf. `phraseAttribution`). */}
          {phraseAttribution(dpeStatus === "auto_confirmed" ? "auto_confirmed" : "confirmed")}
          <LienReprise
            busy={busy}
            onClick={onReselect}
            label={dpeStatus === "auto_confirmed" ? "Ce n'est pas le bon diagnostic" : "Changer de diagnostic"}
          />.
        </p>
        {erreur ? <p style={{ fontSize: 13, color: "var(--danger, #c0563a)", lineHeight: 1.55, margin: 0 }}>{erreur}</p> : null}

        {/* FUT-74 (D6) : un DPE de logement établi à partir de l'immeuble le dit, sans en douter. */}
        {phraseEtabliDepuisImmeuble(dpe) && (
          <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>{phraseEtabliDepuisImmeuble(dpe)}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 14 }}>
          {dpe.conso_ep_m2 != null && <Block label="Consommation" value={formatKwhEpM2(dpe.conso_ep_m2)} />}
          {dpe.emission_ges_m2 != null && <Block label="Émissions GES" value={formatGesM2(dpe.emission_ges_m2)} />}
          {dpe.type_batiment && <Block label="Type" value={dpe.type_batiment} />}
        </div>

        {/* FUT-62 : l'audit énergétique, lu pour décider (cf. `AuditEnergetiqueBlock`). */}
        {blocAudit}
      </div>
      </GlassCard>
    </ReportSection>
  );
}
