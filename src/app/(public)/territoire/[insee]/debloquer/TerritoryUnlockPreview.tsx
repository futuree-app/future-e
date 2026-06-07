import type { QuartierPreview } from "@/lib/quartier-preview";

// Aperçu verrouillé du rapport (module Quartier réel). Le constat est visible (preuve),
// l'analyse est masquée par un fondu + cadenas. Présentation pure. cf. spec.
export function TerritoryUnlockPreview({
  preview,
  commune,
}: {
  preview: QuartierPreview;
  commune: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {preview.cards.map((card) => (
          <div
            key={card.titre}
            className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5"
          >
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent mb-2">
              {card.titre}
            </p>
            <p className="text-[14px] leading-[1.6] text-label/90">{card.constat}</p>
            {/* Le reste de l'analyse, masqué */}
            <div className="mt-2 h-12 relative">
              <div className="space-y-1.5" aria-hidden>
                <div className="h-2.5 w-[92%] rounded bg-white/[0.06]" />
                <div className="h-2.5 w-[78%] rounded bg-white/[0.06]" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-canvas" />
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ghost">
              <span aria-hidden>🔒</span> Lecture complète dans le rapport
            </p>
          </div>
        ))}
      </div>
      {preview.sources.length > 0 && (
        <p className="mt-4 text-[12px] text-ghost">
          Sources mobilisées pour {commune} : {preview.sources.join(" · ")}.
        </p>
      )}
    </div>
  );
}
