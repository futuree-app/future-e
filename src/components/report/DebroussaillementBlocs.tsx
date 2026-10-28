import React from "react";
import type { LectureDebroussaillement } from "@/lib/debroussaillement";
import { texteAutour, texteLogement } from "@/lib/debroussaillement-texte";
import { bindOrphans } from "@/lib/typography";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { CONSTAT, CORPS, CorpsZonage, EYEBROW, TITRE } from "@/components/report/BruitAerienBlocs";

// LE DÉBROUSSAILLEMENT OBLIGATOIRE À L'ÉCRAN (FUT-149). Les phrases sont décidées dans `debroussaillement-texte.ts`
// (pur, testé) : ces composants ne font que les poser, dans la même structure que les plans de bruit aérien
// (ce qu'il faut retenir, ce que vous pouvez vérifier, en savoir plus), en attendant l'harmonisation de FUT-118.
// Aucun score, aucune alerte : un fait réglementaire, sa limite et sa vérification.

/** Module Autour : le secteur. Rien quand la lecture n'est pas activée. */
export function DebroussaillementAutour({ lecture }: { lecture: LectureDebroussaillement | null | undefined }) {
  const t = texteAutour(lecture);
  if (!t) return null;
  return (
    <ReportSection eyebrow="Débroussaillement obligatoire : le zonage du secteur" tone="neutral">
      <GlassCard>
        <div style={{ display: "grid", gap: 14 }}>
          <CorpsZonage t={t} constat={CONSTAT} />
        </div>
      </GlassCard>
    </ReportSection>
  );
}

/**
 * Module Logement : le bien, dans la section « Statut réglementaire ». Un rapport collecté avant FUT-149
 * (`lecture` absente) n'affiche RIEN : rien n'a été calculé pour lui.
 */
export function DebroussaillementLogement({ lecture, withDivider }: { lecture: LectureDebroussaillement | null | undefined; withDivider: boolean }) {
  const t = texteLogement(lecture);
  if (!t) return null;
  return (
    <div style={{ display: "grid", gap: 12, ...(withDivider ? { paddingTop: 12, borderTop: "1px solid var(--border-1)" } : {}) }}>
      <div>
        <p style={EYEBROW}>Débroussaillement</p>
        <p style={TITRE}>{bindOrphans(t.titre)}</p>
      </div>
      <CorpsZonage t={t} constat={CORPS} />
    </div>
  );
}
