import { GlassCard } from "@/components/report/kit";

// Sonde projet : déclaration explicite acheteur/résident (mesure de cadrage). Non
// bloquante, disparaît une fois répondue.
export function ProjectProbe({ answered, onAnswer }: { answered: string | null; onAnswer: (v: string) => void }) {
  if (answered) return null;
  const options = [
    { v: "reside", label: "J'y vis" },
    { v: "achat", label: "J'envisage d'acheter" },
    { v: "location", label: "Je loue ou vais louer" },
    { v: "autre", label: "Autre" },
  ];
  return (
    <GlassCard pad="sm">
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--fg-hi)", marginBottom: 12 }}>
        Que comptez-vous faire de ce logement ?
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onAnswer(o.v)}
            style={{
              padding: "8px 14px", background: "var(--bg-elev)", border: "1px solid var(--border-2)",
              color: "var(--fg-2)", fontSize: 13, cursor: "pointer", borderRadius: 8, fontFamily: "var(--font-sans)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
