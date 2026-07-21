// Carte COMPOSÉE : une vue qui relie des constats établis (tradeoff / shared_evidence). Présentationnelle.
// Les faits absorbés restent lisibles au dépliable, dans leur forme d'origine (audit, invariant 4).
import type { FactComposition, CompositionSide } from "@/lib/decision/fact-composition";
import type { DecisionFact } from "@/lib/decision/decision-fact";
import { Chip, EvidenceRow, FactBody } from "@/components/report/DecisionFactRenderParts";

function SideBlock({ side, color }: { side: CompositionSide; color: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost mb-1">{side.label}</p>
      <p className="text-label text-[14px] leading-[1.6]">{side.statement}</p>
      {side.limitation ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{side.limitation}</p> : null}
      {side.signalConvention ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{side.signalConvention}</p> : null}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {side.evidence.map((e, i) => (
          <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
        ))}
        {side.action ? (
          <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{side.action.label} →</span>
        ) : null}
      </div>
    </div>
  );
}

export function FactCompositionCard({
  composition, color, absorbedFacts,
}: {
  composition: FactComposition;
  color: string;
  absorbedFacts: DecisionFact[]; // les faits absorbés de CETTE composition, pour le dépliable
}) {
  return (
    <li>
      <p className="text-label text-[15px] font-semibold leading-[1.4]">{composition.title}</p>
      {composition.kind === "tradeoff" ? (
        <div className="mt-2.5 flex flex-col gap-3.5">
          <SideBlock side={composition.favorableSide} color={color} />
          <SideBlock side={composition.unfavorableSide} color={color} />
        </div>
      ) : composition.kind === "grouped_verification" ? (
        // Deux constats établis, un même sujet décisionnel : chaque item garde son constat, sa preuve,
        // son action et sa limitation (invariant 8), la même brique que les côtés d'un tradeoff.
        <div className="mt-2.5 flex flex-col gap-3.5">
          {composition.items.map((item, i) => (
            <SideBlock key={i} side={item} color={color} />
          ))}
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost">État observé</p>
            {composition.sharedEvidence.map((e, i) => (
              <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
            ))}
          </div>
          <ul className="flex flex-col gap-2.5">
            {composition.consequences.map((c) => (
              <li key={c.factId} className="pl-3 border-l border-white/[0.12]">
                <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost mb-0.5">
                  {c.materialityTier === "secondary" ? "Point secondaire" : "Priorité structurante"}
                </p>
                <p className="text-muted text-[13px] leading-[1.55]">{c.statement}</p>
                {c.limitation ? <p className="text-ghost text-[12px] leading-[1.5] mt-0.5">{c.limitation}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {absorbedFacts.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[10px] tracking-[0.06em] uppercase text-muted hover:text-label transition-colors">
            Voir {absorbedFacts.length > 1 ? `les ${absorbedFacts.length} constats détaillés` : "le constat détaillé"}
          </summary>
          <ul className="mt-3 flex flex-col gap-4 pl-3 border-l border-white/[0.08]">
            {absorbedFacts.map((f) => (
              <li key={f.id}>
                <FactBody fact={f} />
                <EvidenceRow fact={f} color={color} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}
