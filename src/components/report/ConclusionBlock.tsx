// Rendu du verdict, en BLOCS. Structure DOM IDENTIQUE que les blocs soient déterministes ou générés :
// la substitution sous Suspense ne change pas la mise en page. La min-height stabilise le cadre ; elle
// ne prétend pas figer la hauteur, un texte reformulé plus long reste plus haut. Aucun LLM ici.
import type { ConclusionState } from "@/lib/decision/decision-fact";
import type { ConclusionNarrativePlan } from "@/lib/decision/conclusion-plan";
import type { RenderedBlock } from "@/lib/decision/conclusion-validate";

const STATE_META: Record<ConclusionState, { color: string; label: string }> = {
  established_incompatibility: { color: "var(--red)", label: "Un point de blocage" },
  no_incompatibility_established: { color: "var(--accent)", label: "Aucun blocage établi" },
  no_hard_constraint_declared: { color: "var(--accent)", label: "Aucune condition absolue déclarée" },
  insufficient_evidence: { color: "var(--ghost)", label: "Lecture incomplète" },
  project_not_structured: { color: "var(--ghost)", label: "À préciser" },
};

// Les blocs déterministes, dans la forme EXACTE que produira la validation de la sortie IA.
export function planToBlocks(plan: ConclusionNarrativePlan): RenderedBlock[] {
  return plan.blocks.map((b) => ({
    key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false,
  }));
}

export function ConclusionBlock({ state, blocks }: { state: ConclusionState; blocks: RenderedBlock[] }) {
  const meta = STATE_META[state];
  return (
    <div
      className="glass rounded-2xl p-7 mb-3.5"
      style={{ borderLeft: `2px solid ${meta.color}`, minHeight: "132px" }}
    >
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2.5" style={{ color: meta.color }}>
        {meta.label}
      </p>
      <div className="flex flex-col gap-2">
        {blocks.map((b) => (
          <p key={b.key} className="text-[18px] leading-[1.6] text-label">{b.text}</p>
        ))}
      </div>
    </div>
  );
}
