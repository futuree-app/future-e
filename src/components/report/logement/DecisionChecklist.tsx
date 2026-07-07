import { ReportSection, GlassCard } from "@/components/report/kit";
import { buildDecisionChecklist, checklistIntro, type ChecklistFacts } from "@/lib/logement-checklist";

// Beat 5 — « À vérifier avant de décider ». Sortie d'engagement du module : chaque point est un
// geste, jamais un champ. Aucun compteur, aucune coche verte / croix rouge (pas de score de
// complétude, ADR-0001). Toujours visible ; la version neutre s'affiche avant tout choix de projet.
export function DecisionChecklist({ facts, projet }: { facts: ChecklistFacts; projet: string | null }) {
  const items = buildDecisionChecklist(facts, projet);
  return (
    <ReportSection eyebrow="À vérifier avant de décider" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>{checklistIntro(projet)}</p>
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
