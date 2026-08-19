import React from "react";
import type { LectureInondation } from "@/lib/decision/inondation-lecture";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { Disclosure } from "./kit";

// LA CARTE QUI ORDONNE LES TROIS LECTURES DE L'INONDATION.
//
// Elle ne calcule rien et n'écrit aucune phrase : tout vient de `decision/inondation-lecture.ts`,
// testé. C'est ce qui permet d'affirmer que ce que la carte RACONTE est vérifié, et pas seulement
// qu'elle apparaît (cf. AGENTS.md, corollaire de test du 25/07/2026).
//
// PLACÉE ENTRE le statut réglementaire et les sinistres indemnisés, c'est-à-dire exactement là où
// le lecteur fabriquait la contradiction : il venait de lire « aucune règle ici » et s'apprêtait à
// lire « aucun sinistre remboursé », avec cinq arrêtés comptés dans un autre module.

const ENTETE: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.09em",
  textTransform: "uppercase", color: "var(--fg-4)", lineHeight: 1.5,
};

export function InondationLectureBlock({ lecture }: { lecture: LectureInondation }) {
  return (
    <ReportSection eyebrow="Ce que disent les sources sur l'inondation" tone="blue">
      <GlassCard>
        <div style={{ display: "grid", gap: 18 }}>
          {/* Niveau 1 — pourquoi cette carte existe, avant les faits. */}
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
            Trois sources parlent d&apos;inondation dans ce dossier. Elles ne répondent pas à la
            même question, et lues séparément elles se contredisent en apparence.
          </p>

          {/* Niveau 2 — les constats. L'EN-TÊTE (grain, période, objet) est rendu AVANT l'énoncé :
              c'est cet ordre qui empêche de lire un résultat sans savoir de quoi il parle. */}
          <div style={{ display: "grid", gap: 16 }}>
            {lecture.constats.map((c) => (
              <div key={c.cle} style={{ display: "grid", gap: 5 }}>
                <div style={ENTETE}>
                  {c.entete}
                  {c.periode ? ` · ${c.periode}` : ""}
                </div>
                <p style={{ fontSize: 14.5, color: c.signal ? "var(--fg-hi)" : "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
                  {c.enonce}
                </p>
              </div>
            ))}
          </div>

          {/* Niveau 3 — la lecture d'ensemble, qui ordonne sans conclure. */}
          <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", display: "grid", gap: 8 }}>
            <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.7, margin: 0 }}>
              {lecture.reconciliation}
            </p>
            <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
              {lecture.limite}
            </p>
          </div>

          <Disclosure summary="D’où viennent ces trois lectures">
            {lecture.constats.map((c) => (
              <div key={c.cle}>
                {c.entete}
                {c.periode ? ` · ${c.periode}` : ""} · {c.source}
              </div>
            ))}
          </Disclosure>
        </div>
      </GlassCard>
    </ReportSection>
  );
}
