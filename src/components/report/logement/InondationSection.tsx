import React from "react";
import type { LectureInondation } from "@/lib/decision/inondation-lecture";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { Disclosure } from "./kit";

// LA CARTE QUI ORDONNE LES LECTURES DE L'INONDATION (deux ou trois, selon ce qui a répondu).
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
          {/* FUT-69 : LE PREMIER NIVEAU SE LIT EN QUELQUES SECONDES. Les faits rangés par échelle,
              l'adresse puis la commune, puis pourquoi ils ne disent pas la même chose. Aucun nombre de
              « sources » annoncé : le lecteur voit les lectures, il n'a pas à les compter. */}
          {lecture.groupes.map((g) => (
            <div key={g.titre} style={{ display: "grid", gap: 5 }}>
              <div style={ENTETE}>{g.titre}</div>
              {g.lignes.map((l) => (
                <p key={l} style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>{l}</p>
              ))}
            </div>
          ))}

          <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", display: "grid", gap: 5 }}>
            <div style={ENTETE}>Pourquoi elles ne disent pas la même chose</div>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>{lecture.pourquoi}</p>
          </div>

          {/* Niveau 2 — rien ne se perd : chaque constat complet (grain, période, objet, définition,
              source), la phrase qui ordonne, et la limite. */}
          <Disclosure summary="Voir les sources et les limites">
            <div style={{ display: "grid", gap: 12 }}>
              {lecture.constats.map((c) => (
                <div key={c.cle} style={{ display: "grid", gap: 3 }}>
                  <div style={ENTETE}>
                    {c.entete}
                    {c.periode ? ` · ${c.periode}` : ""}
                  </div>
                  <div>{c.enonce}</div>
                  <div style={{ color: "var(--fg-4)" }}>{c.source}</div>
                </div>
              ))}
              <div>{lecture.reconciliation}</div>
              <div>{lecture.limite}</div>
            </div>
          </Disclosure>
        </div>
      </GlassCard>
    </ReportSection>
  );
}
