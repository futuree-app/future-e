// Carte COMPOSÉE : une vue qui relie des constats établis (tradeoff / shared_evidence). Présentationnelle.
// Les faits absorbés restent lisibles au dépliable, dans leur forme d'origine (audit, invariant 4).
import type { CSSProperties } from "react";
import type { FactComposition, CompositionSide, TradeoffComposition } from "@/lib/decision/fact-composition";
import type { DecisionFact } from "@/lib/decision/decision-fact";
import { Chip, EvidenceRow, FactBody, ActionCue, MethodDetails, StatusTag } from "@/components/report/DecisionFactRenderParts";
import { PREFERENCE_LABELS } from "@/lib/comparateur-labels";
import { factsNonNarresParLaFace } from "@/lib/decision/dossier-view";

// `panel` : le côté est rendu en PANNEAU À LAVIS (tradeoff). Chaque côté porte alors son ton comme le
// verdict porte le sien — l'encre diffuse dans la surface (.tradeoff-side), et le label devient un
// eyebrow mono à la couleur du côté. Hors tradeoff (grouped_verification, où les items se COMPLÈTENT
// au lieu de s'opposer), `panel` reste faux : label neutre, aucun fond, aucune tension suggérée.
function SideBlock({ side, color, panel = false }: { side: CompositionSide; color: string; panel?: boolean }) {
  const inner = (
    <>
      {panel ? (
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color }}>{side.label}</p>
      ) : (
        <p className="text-[13px] font-semibold text-muted mb-1.5">{side.label}</p>
      )}
      {side.status ? <StatusTag label={side.status} color={color} /> : null}
      <p className="text-label text-[15px] leading-[1.6]">{side.statement}</p>
      {side.limitation ? <p className="text-muted/85 text-[13px] leading-[1.55] mt-1.5">{side.limitation}</p> : null}
      {/* `signalConvention` a quitté la face : il est regroupé dans le dépliable « Données et limites » de la carte. */}
      <div className="mt-2 flex flex-col gap-2">
        {/* Sans valeur mesurée, pas de pastille (doctrine du lot A) : la provenance descend dans
            « Données et limites », où elle est dédupliquée. */}
        {side.evidence.some((e) => e.observedValue) ? (
          <div className="flex items-center gap-2 flex-wrap">
            {side.evidence.filter((e) => e.observedValue).map((e, i) => (
              <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
            ))}
          </div>
        ) : null}
        {side.action ? <ActionCue label={side.action.label} color={color} type={side.action.type} /> : null}
      </div>
    </>
  );
  return panel
    ? <div className="tradeoff-side" style={{ "--tone": color } as CSSProperties}>{inner}</div>
    : <div>{inner}</div>;
}

// Les conventions de signalement des côtés/items, dédupliquées (un tradeoff saisonnier partage la même
// convention entre ses deux saisons). Rendues une fois, dans le dépliable « Données et limites ».
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

// Le concret à regarder, côté composition : le `detail` des actions portées par ses côtés ou ses
// items. Une shared_evidence n'en a pas (ses conséquences sont des mismatchs, qui n'ont pas d'action).
function compositionChecks(composition: FactComposition): string[] {
  const sides: CompositionSide[] =
    composition.kind === "tradeoff"
      ? [composition.favorableSide, composition.unfavorableSide]
      : composition.kind === "grouped_verification"
        ? composition.items
        : [];
  return sides.map((s) => s.action?.detail).filter((d): d is string => Boolean(d));
}

// LE COMPOSANT SIGNATURE : un tradeoff est le SEUL patron où deux côtés s'opposent vraiment et où le
// lecteur doit peser l'un contre l'autre. Le rendre en deux paragraphes empilés cachait ce qui en
// fait sa valeur. Deux PANNEAUX À LAVIS (empilés sur mobile), chacun teinté par SON ton — le côté
// favorable en vert, le côté à arbitrer en orange — donnent une forme visible à l'arbitrage : ce que
// le lieu donne, ce qu'il prend, à peser ensemble. La couleur DIFFUSE dans la surface (même encre que
// le verdict), elle ne borde pas : ce n'est pas un décor, c'est la relation elle-même. Le filet
// central d'avant disparaissait au stacking ; chaque panneau, lui, s'auto-identifie une fois empilé.
//
// `items-start` : les deux côtés huggent leur contenu au lieu de s'étirer à la même hauteur — un côté
// court ne se paie pas d'une plaque teintée à moitié vide. Ils se lisent comme une paire par le ton,
// pas par une hauteur forcée.
//
// grouped_verification garde l'empilement SANS panneau : ses items ne s'opposent pas, ils se complètent
// (le sol, et la règle qui l'encadre). Les mettre face à face, ou les teinter, suggérerait une tension
// qui n'existe pas.
function TradeoffFaceoff({ composition }: { composition: TradeoffComposition }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-start">
      <SideBlock side={composition.favorableSide} color="var(--green)" panel />
      <SideBlock side={composition.unfavorableSide} color="var(--orange)" panel />
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
  // Le dépliable ne garde que ce que la face ne dit pas déjà. La règle et son « pourquoi » vivent
  // dans dossier-view.ts, où elles sont testables.
  const nonNarres = factsNonNarresParLaFace(composition, absorbedFacts);
  return (
    <li>
      <p className="text-label text-[16px] font-semibold leading-[1.4]">{composition.title}</p>
      {composition.kind === "tradeoff" ? (
        <TradeoffFaceoff composition={composition} />
      ) : composition.kind === "grouped_verification" ? (
        // Deux constats établis, un même sujet décisionnel : chaque item garde son constat, sa preuve,
        // son action et sa limitation (invariant 8), la même brique que les côtés d'un tradeoff.
        <div className="mt-3 flex flex-col gap-5">
          {composition.items.map((item, i) => (
            <SideBlock key={i} side={item} color={color} />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-muted">État observé</p>
            {composition.sharedEvidence.map((e, i) => (
              <Chip key={i} label={e.href && e.observedValue ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
            ))}
          </div>
          <ul className="flex flex-col gap-4">
            {composition.consequences.map((c) => (
              <li key={c.factId} className="pl-3 border-l border-white/[0.12]">
                {/* L'étiquette nommait le materialityTier (« Priorité structurante », « Point
                    secondaire »), deux fois dans la même carte : une décision interne de matérialité,
                    que le lecteur ne peut ni expliquer ni opposer, affichée comme une information.
                    C'est la tuyauterie que le lot A retire des pastilles et le lot D du verdict.
                    Elle nomme désormais LA PRIORITÉ concernée, ce que le lecteur a écrit lui-même :
                    la composition dit « une cause, plusieurs conséquences », et le lecteur voit
                    lesquelles des SIENNES sont touchées. */}
                <p className="text-[13px] font-semibold text-muted mb-1">
                  {PREFERENCE_LABELS[c.projectKey] ?? "Une de vos priorités"}
                </p>
                <p className="text-muted text-[15px] leading-[1.55]">{c.statement}</p>
                {c.limitation ? <p className="text-muted/85 text-[13px] leading-[1.55] mt-1">{c.limitation}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <MethodDetails conventions={compositionConventions(composition)} checks={compositionChecks(composition)} />
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
