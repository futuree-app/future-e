"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ComparaisonCellule, ComparaisonLigne, ComparaisonTheme, MatchResult } from "@/lib/comparateur-vie";

// Rendu d'UN thème de la matrice d'arbitrages : en-tête de colonnes (communes nommées) +
// une ligne par dimension (palier absolu, « Avantage X » / « À égalité », cellule leader en
// accent, fusion si tout se vaut). Extrait de ComparaisonCompleteView pour être réutilisé par
// l'aperçu gratuit du mode choix (le thème dévoilé). Cardinal-agnostique (2 ou 3 communes).

// Gabarit partagé par l'en-tête de colonnes ET chaque ligne, pour aligner les colonnes.
// Classes LITTÉRALES par cardinal : Tailwind n'extrait pas les valeurs arbitraires interpolées.
const GRID_BY_N: Record<number, string> = {
  2: "grid grid-cols-1 md:grid-cols-[minmax(150px,210px)_repeat(2,minmax(0,1fr))] md:gap-x-4",
  3: "grid grid-cols-1 md:grid-cols-[minmax(150px,210px)_repeat(3,minmax(0,1fr))] md:gap-x-4",
};
export const gridFor = (n: number): string => GRID_BY_N[n] ?? GRID_BY_N[3];
const MERGED_SPAN_BY_N: Record<number, string> = { 2: "md:col-span-2", 3: "md:col-span-3" };

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
  if (leader) return "text-accent";
  if (cell.alerte) return "text-danger";
  return "text-label";
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
  const n = trio.length;
  const leaders = ligne.avantage.type === "avantage" ? ligne.avantage.insees : [];
  const egalite = ligne.avantage.type === "egalite";
  const neutre = ligne.avantage.type === "neutre";
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
    <div className={`${gridFor(n)} gap-y-2 md:gap-y-0 md:items-center py-3.5 border-t border-white/[0.06]`}>
      <div className="md:pr-2">
        <LabelTip label={ligne.label} text={ligne.aide} />
        {!neutre && (
          <span
            className={`block mt-1 font-mono text-[9.5px] tracking-[0.12em] uppercase ${
              egalite ? "text-ghost" : "text-accent"
            }`}
          >
            {egalite ? "À égalité" : `Avantage ${leaderNoms.join(" et ")}`}
          </span>
        )}
      </div>

      {merged ? (
        <div className={`${MERGED_SPAN_BY_N[n] ?? MERGED_SPAN_BY_N[3]} md:px-3.5 md:py-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5`}>
          <span className="text-[14px] leading-[1.45] text-label">
            {dispo[0].palier}
            {dispo[0].qualifier ? `, ${dispo[0].qualifier}` : ""}
          </span>
          <span className="text-[13px] text-muted">· les {n >= 3 ? "trois" : "deux"} territoires se valent</span>
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

// En-tête de colonnes (communes nommées en Serif) rappelé pour le thème.
export function MatrixHeader({ trio }: { trio: MatchResult[] }) {
  return (
    <div className={`${gridFor(trio.length)} hidden md:grid pb-2 border-b border-white/[0.06]`}>
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
  );
}

// Un thème entier : en-tête de colonnes + ses lignes. Réutilisé par le payant et l'aperçu gratuit.
export function ThemeMatrix({ theme, trio }: { theme: ComparaisonTheme; trio: MatchResult[] }) {
  return (
    <>
      <MatrixHeader trio={trio} />
      <div>
        {theme.lignes.map((l) => (
          <LigneRow key={l.id} ligne={l} trio={trio} />
        ))}
      </div>
    </>
  );
}
