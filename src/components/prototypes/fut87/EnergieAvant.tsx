"use client";
// FUT-87 · La section Énergie de production, montée pour la page « avant » avec des gestes inertes :
// une page serveur ne peut pas transmettre de fonctions à un composant client, et le prototype ne
// doit rien écrire (aucune sélection de diagnostic n'est enregistrée).
import { EnergieSection } from "@/components/report/logement/EnergieSection";
import type { LogementReport } from "@/lib/logement-report-types";
import type { DpeRecord } from "@/lib/dpe-attribution";

const rien = () => {};

export function EnergieAvant({ dpe, audit, auditStatus, candidates }: {
  dpe: DpeRecord; audit: LogementReport["audit"]; auditStatus: LogementReport["auditStatus"]; candidates: DpeRecord[];
}) {
  return (
    <EnergieSection
      dpeStatus="confirmed" dpe={dpe} audit={audit} auditStatus={auditStatus} candidates={candidates} dossierId=""
      onPick={rien} onNotInList={rien} onReselect={rien} onPickParNumero={rien}
    />
  );
}
