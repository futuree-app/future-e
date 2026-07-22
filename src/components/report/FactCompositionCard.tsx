// Carte COMPOSÉE : une vue qui relie des constats établis (tradeoff / shared_evidence). Présentationnelle.
// Les faits absorbés restent lisibles au dépliable, dans leur forme d'origine (audit, invariant 4).
import type { FactComposition, CompositionSide } from "@/lib/decision/fact-composition";
import type { DecisionFact } from "@/lib/decision/decision-fact";
import { Chip, EvidenceRow, FactBody, ActionCue, MethodDetails } from "@/components/report/DecisionFactRenderParts";
import { PREFERENCE_LABELS } from "@/lib/comparateur-labels";
import { factsNonNarresParLaFace } from "@/lib/decision/dossier-view";

function SideBlock({ side, color }: { side: CompositionSide; color: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-1">{side.label}</p>
      <p className="text-label text-[15px] leading-[1.6]">{side.statement}</p>
      {side.limitation ? <p className="text-ghost text-[13px] leading-[1.5] mt-1">{side.limitation}</p> : null}
      {/* `signalConvention` a quitté la face : il est regroupé dans le dépliable « Méthode et détails » de la carte. */}
      <div className="mt-2 flex flex-col gap-2">
        {/* Sans valeur mesurée, pas de pastille (doctrine du lot A) : la provenance descend dans
            « Méthode et détails », où elle est dédupliquée. */}
        {side.evidence.some((e) => e.observedValue) ? (
          <div className="flex items-center gap-2 flex-wrap">
            {side.evidence.filter((e) => e.observedValue).map((e, i) => (
              <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
            ))}
          </div>
        ) : null}
        {side.action ? <ActionCue label={side.action.label} color={color} /> : null}
      </div>
    </div>
  );
}

// Les conventions de signalement des côtés/items, dédupliquées (un tradeoff saisonnier partage la même
// convention entre ses deux saisons). Rendues une fois, dans le dépliable « Méthode et détails ».
function compositionConventions(composition: FactComposition): string[] {
  const sides: CompositionSide[] =
    composition.kind === "tradeoff"
      ? [composition.favorableSide, composition.unfavorableSide]
      : composition.kind === "grouped_verification"
        ? composition.items
        : [];
  // La convention de seuil, PUIS la provenance des références qui n'établissent aucune valeur : même
  // règle que la carte élémentaire (sans valeur mesurée, pas de pastille sur la face).
  const seen = new Set<string>();
  const sources: string[] = [];
  for (const e of [...sides.flatMap((s) => s.evidence), ...(composition.kind === "shared_evidence" ? composition.sharedEvidence : [])]) {
    if (e.observedValue || seen.has(e.label)) continue;
    seen.add(e.label);
    sources.push(`Source : ${e.label}`);
  }
  return [...sides.map((s) => s.signalConvention).filter((c): c is string => Boolean(c)), ...sources];
}

export function FactCompositionCard({
  composition, color, absorbedFacts,
}: {
  composition: FactComposition;
  color: string;
  absorbedFacts: DecisionFact[]; // les faits absorbés de CETTE composition, pour le dépliable
}) {
  // Le dépliable ne garde que ce que la face ne dit pas déjà. La règle et son « pourquoi » vivent
  // dans dossier-view.ts, où elles sont testables.
  const nonNarres = factsNonNarresParLaFace(composition, absorbedFacts);
  return (
    <li>
      <p className="text-label text-[16px] font-semibold leading-[1.4]">{composition.title}</p>
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
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost">État observé</p>
            {composition.sharedEvidence.map((e, i) => (
              <Chip key={i} label={e.href && e.observedValue ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
            ))}
          </div>
          <ul className="flex flex-col gap-2.5">
            {composition.consequences.map((c) => (
              <li key={c.factId} className="pl-3 border-l border-white/[0.12]">
                {/* L'étiquette nommait le materialityTier (« Priorité structurante », « Point
                    secondaire »), deux fois dans la même carte : une décision interne de matérialité,
                    que le lecteur ne peut ni expliquer ni opposer, affichée comme une information.
                    C'est la tuyauterie que le lot A retire des pastilles et le lot D du verdict.
                    Elle nomme désormais LA PRIORITÉ concernée, ce que le lecteur a écrit lui-même :
                    la composition dit « une cause, plusieurs conséquences », et le lecteur voit
                    lesquelles des SIENNES sont touchées. */}
                <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-0.5">
                  {PREFERENCE_LABELS[c.projectKey] ?? "Une de vos priorités"}
                </p>
                <p className="text-muted text-[15px] leading-[1.55]">{c.statement}</p>
                {c.limitation ? <p className="text-ghost text-[13px] leading-[1.5] mt-0.5">{c.limitation}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <MethodDetails conventions={compositionConventions(composition)} />
      {nonNarres.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[11px] tracking-[0.06em] uppercase text-muted hover:text-label transition-colors">
            Voir {nonNarres.length > 1 ? `les ${nonNarres.length} constats détaillés` : "le constat détaillé"}
          </summary>
          <ul className="mt-3 flex flex-col gap-4 pl-3 border-l border-white/[0.08]">
            {nonNarres.map((f) => (
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
