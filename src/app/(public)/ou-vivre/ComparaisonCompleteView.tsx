"use client";

import { useEffect, useId, useRef, useState } from "react";
import type {
  ComparaisonComplete,
  ComparaisonCellule,
  ComparaisonLigne,
  MatchResult,
} from "@/lib/comparateur-vie";

// Comparaison complète (Pack Décision) : matrice d'arbitrages, 7 thèmes stables, palier
// incarné absolu + avantage relatif au trio. Aucun chiffre, aucune jauge. Le trio reste
// trois colonnes, rappelées en tête de chaque thème ; la commune qui mène s'allume en
// accent. Quand les trois disent la même chose, une seule valeur centrée. cf. spec.

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[]; // ordre des colonnes
  onBack: () => void;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
// Gabarit partagé par l'en-tête de colonnes ET chaque ligne, pour aligner les colonnes.
// Mobile = empilé ; desktop = libellé + 3 communes.
const GRID = "grid grid-cols-1 md:grid-cols-[minmax(150px,210px)_repeat(3,minmax(0,1fr))] md:gap-x-4";

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

// ── Tooltip inline (label souligné pointillé), même esprit que ChipTooltip ────
function LabelTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-left text-[14.5px] leading-[1.3] text-label cursor-help underline decoration-dotted decoration-white/25 underline-offset-[3px] hover:decoration-white/50 transition-colors"
      >
        {label}
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute z-50 bottom-[calc(100%+8px)] left-0 w-max max-w-[240px] rounded-[10px] border border-white/10 px-3 py-2.5 text-[12.5px] leading-[1.5] font-normal normal-case tracking-normal"
          style={{ background: "#0b101c", color: "#c6cfdb", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function paletteTone(cell: ComparaisonCellule, leader: boolean): string {
  if (!cell.disponible) return "text-ghost italic";
  return leader ? "text-accent" : "text-label";
}

function Cellule({ cell, nom, leader }: { cell: ComparaisonCellule; nom: string; leader: boolean }) {
  return (
    <div
      className={[
        "flex items-baseline gap-3 md:block md:gap-0 md:rounded-xl md:px-3.5 md:py-2.5",
        leader ? "md:bg-accent/[0.07]" : "",
      ].join(" ")}
    >
      <span className="md:hidden w-[104px] shrink-0 text-[12px] text-muted pt-0.5">{nom}</span>
      <span className="min-w-0">
        <span className={`text-[14px] leading-[1.45] ${paletteTone(cell, leader)}`}>{cell.palier}</span>
        {cell.qualifier && (
          <span className="block text-[12px] leading-[1.4] text-muted mt-0.5">{cell.qualifier}</span>
        )}
      </span>
    </div>
  );
}

function LigneRow({ ligne, trio }: { ligne: ComparaisonLigne; trio: MatchResult[] }) {
  const leaders = ligne.avantage.type === "avantage" ? ligne.avantage.insees : [];
  const egalite = ligne.avantage.type === "egalite";
  const cellByInsee = new Map(ligne.cellules.map((c) => [c.insee, c]));
  const leaderNoms = leaders
    .map((insee) => trio.find((r) => r.insee === insee)?.nom ?? "")
    .filter(Boolean);

  // Fusion : les trois disent exactement la même chose (palier + qualifier) -> une valeur.
  const dispo = ligne.cellules.filter((c) => c.disponible);
  const merged =
    dispo.length === ligne.cellules.length &&
    new Set(dispo.map((c) => `${c.palier}|${c.qualifier ?? ""}`)).size === 1;

  return (
    <div className={`${GRID} gap-y-2 md:gap-y-0 md:items-center py-3.5 border-t border-white/[0.06]`}>
      <div className="md:pr-2">
        <LabelTip label={ligne.label} text={ligne.aide} />
        <span
          className={`block mt-1 font-mono text-[9.5px] tracking-[0.12em] uppercase ${
            egalite ? "text-ghost" : "text-accent"
          }`}
        >
          {egalite ? "À égalité" : `Avantage ${leaderNoms.join(" et ")}`}
        </span>
      </div>

      {merged ? (
        // Égalité parfaite : une seule valeur qui traverse les 3 colonnes (pas de cellule
        // vide, pas l'impression qu'une seule commune porte la valeur).
        <div className="md:col-span-3 md:px-3.5 md:py-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[14px] leading-[1.45] text-label">
            {dispo[0].palier}
            {dispo[0].qualifier ? `, ${dispo[0].qualifier}` : ""}
          </span>
          <span className="text-[13px] text-muted">· les trois territoires se valent</span>
        </div>
      ) : (
        trio.map((r) => {
          const cell = cellByInsee.get(r.insee);
          if (!cell) return <div key={r.insee} />;
          return <Cellule key={r.insee} cell={cell} nom={r.nom} leader={leaders.includes(cell.insee)} />;
        })
      )}
    </div>
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
          Vous les avez retenus tous les trois.{" "}
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
            <p className="text-[14.5px] leading-[1.55] text-muted italic mb-4 max-w-[680px]">{th.synthese}</p>

            {/* En-tête des 3 communes, rappelé pour ce thème (desktop) */}
            <div className={`${GRID} hidden md:grid pb-2 border-b border-white/[0.06]`}>
              <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-ghost self-end pb-1">Critère</div>
              {trio.map((r, n) => (
                <div key={r.insee} className="px-3.5 flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-accent">{String(n + 1).padStart(2, "0")}</span>
                  <span className="text-[17px] leading-[1.1] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {r.nom}
                  </span>
                </div>
              ))}
            </div>

            <div>
              {th.lignes.map((l) => (
                <LigneRow key={l.id} ligne={l} trio={trio} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
