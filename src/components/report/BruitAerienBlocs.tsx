import React from "react";
import type { LectureBruitAerien } from "@/lib/bruit-aerien";
import { texteAutour, texteLogement, type TexteBruit } from "@/lib/bruit-aerien-texte";
import { bindOrphans } from "@/lib/typography";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { Disclosure } from "./logement/kit";

// LES PLANS DE BRUIT AÉRIEN À L'ÉCRAN (FUT-146). Les phrases sont décidées dans `bruit-aerien-texte.ts`
// (pur, testé) : ces composants ne font que les poser, dans la structure du Relevé : ce qu'il faut retenir,
// ce que vous pouvez vérifier, en savoir plus. Présentation reprise du bloc d'urbanisme, en attendant
// l'harmonisation de FUT-118.

const EYEBROW: React.CSSProperties = { fontSize: 12.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 8px" };
const RUBRIQUE: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 4px" };
const TITRE: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 };
const CONSTAT: React.CSSProperties = { fontSize: 15, color: "var(--fg-1)", lineHeight: 1.65, margin: 0 };
const CORPS: React.CSSProperties = { fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 };
const LIMITE: React.CSSProperties = { fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.55, margin: "6px 0 0" };
const LIEN: React.CSSProperties = { fontSize: 13, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline" };

function Corps({ t, constat }: { t: TexteBruit; constat: React.CSSProperties }) {
  return (
    <>
      <div>
        <p style={RUBRIQUE}>Ce qu’il faut retenir</p>
        <p style={constat}>{bindOrphans(t.retenir)}</p>
        {t.limite && <p style={LIMITE}>{bindOrphans(t.limite)}</p>}
      </div>
      {t.complement && <p style={CORPS}>{bindOrphans(t.complement)}</p>}
      {t.verifier && (
        <div>
          <p style={RUBRIQUE}>Ce que vous pouvez vérifier</p>
          <p style={CORPS}>{bindOrphans(t.verifier)}</p>
        </div>
      )}
      {(t.savoirPlus.length > 0 || t.document) && (
        <Disclosure summary="En savoir plus">
          {t.savoirPlus.map((l) => <div key={l}>{l}</div>)}
          {t.document && (
            <a href={t.document.url} target="_blank" rel="noopener noreferrer" style={LIEN}>{t.document.libelle} →</a>
          )}
        </Disclosure>
      )}
    </>
  );
}

/** Module Autour : le secteur. Rien quand aucun plan n'a de zone dans un rayon de 5 km. */
export function BruitAerienAutour({ lecture }: { lecture: LectureBruitAerien | null | undefined }) {
  const t = texteAutour(lecture);
  if (!t) return null;
  return (
    <ReportSection eyebrow="Bruit des avions : les plans de l’aérodrome" tone="neutral">
      <GlassCard>
        <div style={{ display: "grid", gap: 14 }}>
          <Corps t={t} constat={CONSTAT} />
        </div>
      </GlassCard>
    </ReportSection>
  );
}

/**
 * Module Logement : le bien, dans la section « Statut réglementaire ». Un rapport collecté avant FUT-146
 * (`lecture` absente) n'affiche RIEN : rien n'a été calculé pour lui.
 */
export function BruitAerienLogement({ lecture, withDivider }: { lecture: LectureBruitAerien | null | undefined; withDivider: boolean }) {
  const t = texteLogement(lecture);
  if (!t) return null;
  return (
    <div style={{ display: "grid", gap: 12, ...(withDivider ? { paddingTop: 12, borderTop: "1px solid var(--border-1)" } : {}) }}>
      <div>
        <p style={EYEBROW}>Bruit aérien</p>
        <p style={TITRE}>{bindOrphans(t.titre)}</p>
      </div>
      <Corps t={t} constat={CORPS} />
    </div>
  );
}
