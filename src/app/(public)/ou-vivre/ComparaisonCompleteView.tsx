"use client";

import type { ComparaisonComplete, MatchResult } from "@/lib/comparateur-vie";
import { ThemeMatrix } from "@/app/(public)/comparateur/ThemeMatrix";

// Comparaison complète (Pack Décision) : matrice d'arbitrages, 7 thèmes stables, palier
// incarné absolu + avantage relatif au trio. Aucun chiffre, aucune jauge. Le trio reste
// trois colonnes, rappelées en tête de chaque thème ; la commune qui mène s'allume en
// accent. Quand les trois disent la même chose, une seule valeur centrée. Le rendu d'un
// thème (en-tête + lignes) est délégué à ThemeMatrix (réutilisé par l'aperçu mode choix).

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[]; // ordre des colonnes
  onBack: () => void;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function reveal(i: number): React.CSSProperties {
  return { animation: `step-enter 0.55s ${EASE} both`, animationDelay: `${0.05 * i}s` };
}

// ── Icônes premium par thème (stroke, monochrome accent) ─────────────────────
const THEME_ICONS: Record<string, React.ReactNode> = {
  climat: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4" />
    </>
  ),
  risques: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.4-7 9-4-1.6-7-4.5-7-9V6z" />
      <path d="M12 8.5v4M12 16h.01" />
    </>
  ),
  sante_env: (
    <>
      <path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 20 4c0 8-4 12-9 12z" />
      <path d="M5 19c5-1.5 8-4.5 9-9" />
    </>
  ),
  cadre: <path d="M3 20l6-9 3.5 5 2-3L21 20z" />,
  mobilite: (
    <>
      <rect x="5" y="3" width="14" height="13" rx="3" />
      <path d="M5 11h14M9 7h6M8 16l-2 4M16 16l2 4" />
      <circle cx="9" cy="13.5" r=".6" />
      <circle cx="15" cy="13.5" r=".6" />
    </>
  ),
  services: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M10 21v-3.5h4V21" />
    </>
  ),
  vitalite: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 5.5a3 3 0 0 1 0 6M20.5 20c0-2.4-1.4-4-3.3-4.6" />
    </>
  ),
};

function ThemeIcon({ id }: { id: string }) {
  return (
    <span
      className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
      style={{ background: "var(--orange-tint)" }}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--orange)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {THEME_ICONS[id] ?? null}
      </svg>
    </span>
  );
}

export function ComparaisonCompleteView({ data, trio, onBack }: Props) {
  return (
    <div className="pt-8 pb-4">
      <button
        onClick={onBack}
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-8 inline-flex items-center gap-2 transition-colors"
      >
        <span aria-hidden>←</span> Revenir aux territoires
      </button>

      {/* Hero */}
      <div style={reveal(0)}>
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">Comparaison complète</p>
        <h2
          className="font-normal text-[clamp(26px,3.6vw,38px)] leading-[1.12] tracking-[-0.6px] text-label max-w-[760px]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Vous les avez retenus tous les {trio.length >= 3 ? "trois" : "deux"}.{" "}
          <span className="italic text-accent">Voici, critère par critère, ce qui penche et ce qui se vaut.</span>
        </h2>
      </div>

      {/* En résumé : qui mène sur quels thèmes (prépare la lecture du détail) */}
      {data.resume.length > 0 && (
        <div className="glass rounded-2xl px-6 py-5 mt-9" style={reveal(1)}>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2.5">En résumé</p>
          <div className="space-y-1.5">
            {data.resume.map((s, n) => (
              <p
                key={n}
                className={n === 0 ? "text-[16px] leading-[1.55] text-label" : "text-[14.5px] leading-[1.55] text-muted"}
              >
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Thèmes */}
      <div className="mt-12 space-y-12">
        {data.themes.map((th, i) => (
          <section key={th.id} style={reveal(2 + i)}>
            <div className="flex items-center gap-3 mb-2">
              <ThemeIcon id={th.id} />
              <h3
                className="font-normal text-[23px] leading-[1.1] text-label"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {th.titre}
              </h3>
            </div>
            <p className="text-[12px] text-ghost mb-2">{th.lignes.map((l) => l.label).join(" · ")}</p>
            <p className="text-[14.5px] leading-[1.55] text-muted italic mb-4 max-w-[680px]">{th.synthese}</p>
            <ThemeMatrix theme={th} trio={trio} />
          </section>
        ))}
      </div>
    </div>
  );
}
