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
            className="flex flex-col rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-5"
          >
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent mb-2.5">
              {card.titre}
            </p>
            <p className="text-[15px] leading-[1.6] text-label/85">{card.constat}</p>
            <div className="mt-4 pt-3 flex items-center gap-2 border-t border-[var(--border-1)] text-ghost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase">
                Lecture complète dans le rapport
              </span>
            </div>
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
