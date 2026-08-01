import { ReportSection, GlassCard } from "@/components/report/kit";
import { pointsAVerifier, introPointsAVerifier } from "@/lib/decision/logement-verifications";
import type { LogementFacts } from "@/lib/decision/decision-fact";

// Beat 5 — « À vérifier avant de décider ». Sortie d'engagement du module : chaque point est un
// geste, jamais un champ. Aucun compteur, aucune coche verte / croix rouge (pas de score de
// complétude, ADR-0001). Toujours visible ; la version neutre s'affiche avant tout choix de projet.
//
// LES GESTES VIENNENT DU MOTEUR DE DÉCISION (01/08/2026). Ce bloc portait sa propre table
// d'activation, en parallèle des règles du dossier, sur les mêmes faits : le lecteur pouvait voir
// un geste ici et pas dans son dossier, le même jour, sur la même adresse. Il n'en reste qu'un
// rendu, et l'évaluation est celle que le dossier applique (`decision/logement-verifications.ts`).
export function DecisionChecklist({ facts, projet }: { facts: LogementFacts; projet: string | null }) {
  const items = pointsAVerifier(facts, projet);
  return (
    <ReportSection eyebrow="À vérifier avant de décider" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>{introPointsAVerifier(projet)}</p>
          {items.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.65, margin: 0 }}>
              Cette lecture ne fait remonter aucun point particulier à vérifier pour ce logement.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {items.map((it) => (
                <li key={it.id} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                  <span aria-hidden style={{ color: "var(--fg-4)", flexShrink: 0 }}>▸</span>
                  <span>{it.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>
    </ReportSection>
  );
}
