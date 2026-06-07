"use client";

import type { MatchResult } from "@/lib/comparateur-vie";

// Révélateur d'arbitrages : 3 blocs (identité → 2 forces → 1 compromis), sans
// chiffre ni score. Présentation pure de outcome. cf. spec 2026-06-05-comparateur-3.

type Props = {
  results: MatchResult[];
  onBack: () => void;
  onExploreReport: (r: MatchResult, rang: number) => void;
  onPackDecision: () => void;
};

// Forces : 1 confirmation (reason[0], critère demandé) + 1 découverte (atout
// POSITIF non demandé, champ moteur r.decouverte). Repli : reason[1]. Dédup.
function forces(r: MatchResult): string[] {
  const confirmation = r.reasons?.[0] ?? null;
  const decouverte = r.decouverte ?? r.reasons?.[1] ?? null;
  const out: string[] = [];
  if (confirmation) out.push(confirmation);
  if (decouverte && decouverte !== confirmation) out.push(decouverte);
  return out.slice(0, 2);
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function CompareView({ results, onBack, onExploreReport, onPackDecision }: Props) {
  const trio = results.slice(0, 3);
  return (
    <div className="pt-10">
      <button
        onClick={onBack}
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir aux territoires
      </button>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
        Ce qui les distingue
      </p>
      <h2
        className="font-normal text-[clamp(24px,3.4vw,34px)] leading-[1.15] tracking-[-0.6px] text-label mb-9"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Les trois pourraient convenir à votre projet.{" "}
        <span className="italic text-accent">Mais ils ne racontent pas la même histoire.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trio.map((r, i) => (
          <div key={r.insee} className="glass rounded-2xl p-6 flex flex-col">
            <h3
              className="font-normal text-[20px] leading-[1.2] text-label"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {r.nom}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-accent italic">
              {r.identite}
            </p>
            <ul className="mt-4 space-y-2">
              {forces(r).map((f) => (
                <li key={f} className="text-[13.5px] leading-[1.55] text-label flex gap-2">
                  <span className="text-emerald-400 shrink-0" aria-hidden>+</span>
                  <span>{cap(f)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 pt-3 border-t border-white/[0.08] text-[13px] leading-[1.55] text-muted">
              {r.compromis}
            </p>
            <button
              onClick={() => onExploreReport(r, i + 1)}
              className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.14] hover:border-white/[0.28] text-[13px] text-label transition-colors"
            >
              Explorer cette option
              <span aria-hidden>→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Pack Décision : élargir + trancher */}
      <div
        className="mt-8 glass rounded-2xl p-7"
        style={{ borderColor: "var(--orange-ring)", boxShadow: "0 0 0 1px var(--orange-ring)" }}
      >
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1.5">
          Pack Décision · 39 €
        </p>
        <h3
          className="font-normal text-[20px] leading-[1.2] text-label"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Vous hésitez entre ces trois options ?
        </h3>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-muted max-w-[620px]">
          Comparez les 3 territoires sur l&apos;ensemble des critères, posez vos questions et
          explorez jusqu&apos;à 3 nouvelles pistes pour le même projet.
        </p>
        <button
          onClick={onPackDecision}
          className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Comparer en profondeur
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
