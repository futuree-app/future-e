"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ComparaisonCellule, ComparaisonLigne, ComparaisonTheme, MatchResult } from "@/lib/comparateur-vie";
import { motCardinal } from "@/lib/comparaison-cardinal";
import { AIDE_FERMEE, aideSuivante, decalageHorizontal, type EtatAide, type EvenementAide } from "@/lib/aide-bascule";

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

// ── Aide de critère (label souligné pointillé), même esprit que ChipTooltip ────
// FUT-153 : un seul événement bascule l'aide, le click (appui, clic, Entrée, Espace) ; le survol
// n'ouvre qu'à la souris. Les règles et le défaut tactile corrigé sont dans `aide-bascule`.

// Une seule aide ouverte à la fois dans la page : celle qui s'ouvre referme la précédente.
let fermerAideOuverte: (() => void) | null = null;

// Un point de la bulle est lisible s'il est dans la fenêtre et que la bulle y est au premier plan
// (ni sous la barre de navigation collante, ni sous un bloc voisin).
function pointLisible(bulle: HTMLElement, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
  const dessus = document.elementFromPoint(x, y);
  return !!dessus && bulle.contains(dessus);
}

function LabelTip({ label, text }: { label: string; text: string }) {
  const [etat, setEtat] = useState<EtatAide>(AIDE_FERMEE);
  // Au-dessus par défaut ; en dessous quand le haut de la bulle serait masqué ou hors écran.
  const [dessous, setDessous] = useState(false);
  const [decalage, setDecalage] = useState(0);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const bulleRef = useRef<HTMLSpanElement>(null);
  const envoyer = (ev: EvenementAide) => setEtat((e) => aideSuivante(e, ev));
  const open = etat.ouvert;

  useEffect(() => {
    if (!open) return;
    const fermer = () => envoyer({ type: "fermeture" });
    if (fermerAideOuverte && fermerAideOuverte !== fermer) fermerAideOuverte();
    fermerAideOuverte = fermer;
    // Hors de l'aide : un appui ou un clic ailleurs, ou le focus qui part (Tab) la ferment. Cliquer dans
    // la bulle elle-même (sélectionner son texte) la laisse ouverte.
    const dehors = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) fermer();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("focusin", dehors);
    document.addEventListener("keydown", onKey);
    return () => {
      if (fermerAideOuverte === fermer) fermerAideOuverte = null;
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("focusin", dehors);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Placement mesuré à l'ouverture, avant peinture : la bulle doit être lue en entier.
  useLayoutEffect(() => {
    const bulle = bulleRef.current;
    if (!open || !bulle) {
      setDessous(false);
      setDecalage(0);
      return;
    }
    const r = bulle.getBoundingClientRect();
    const dx = decalageHorizontal(r.left, r.right, window.innerWidth);
    if (dx !== 0) setDecalage(dx);
    // Le bord haut dans la fenêtre, et les coins hauts au premier plan (à 8 px, dans l'arrondi de 10 px).
    if (r.top < 0 || !pointLisible(bulle, r.left + dx + 8, r.top + 8) || !pointLisible(bulle, r.right + dx - 8, r.top + 8)) setDessous(true);
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onPointerEnter={(e) => envoyer({ type: "entree", pointeur: e.pointerType })}
      onPointerLeave={(e) => envoyer({ type: "sortie", pointeur: e.pointerType })}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-describedby={id}
        onClick={(e) => {
          e.stopPropagation();
          envoyer({ type: "activation" });
        }}
        className="text-left text-[16px] leading-[1.3] text-label cursor-help underline decoration-dotted decoration-white/25 underline-offset-[3px] hover:decoration-white/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] rounded-[2px]"
      >
        {label}
      </button>
      {/* Toujours dans le DOM (masquée) : aria-describedby donne l'explication au lecteur d'écran même
          fermée. Le pseudo-élément comble l'écart de 8 px entre le libellé et la bulle, pour que la
          souris puisse y monter sans quitter l'aide. */}
      <span
        ref={bulleRef}
        role="tooltip"
        id={id}
        hidden={!open}
        className={`absolute z-50 left-0 w-max max-w-[min(240px,calc(100vw-24px))] rounded-[10px] border border-white/10 px-3 py-2.5 text-[14px] leading-[1.5] font-normal normal-case tracking-normal after:absolute after:inset-x-0 after:h-2 after:content-[''] ${
          dessous ? "top-[calc(100%+8px)] after:bottom-full" : "bottom-[calc(100%+8px)] after:top-full"
        }`}
        style={{
          background: "#0b101c",
          color: "#c6cfdb",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          transform: decalage ? `translateX(${decalage}px)` : undefined,
        }}
      >
        {text}
      </span>
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
      <span className="md:hidden w-[104px] shrink-0 text-[13px] text-muted pt-0.5">{nom}</span>
      <span className="min-w-0">
        <span className={`text-[length:var(--text-body)] leading-[1.45] ${paletteTone(cell, leader)}`}>{cell.palier}</span>
        {cell.qualifier && (
          <span className="block text-[13px] leading-[1.4] text-muted mt-0.5">{cell.qualifier}</span>
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
    <div className={`${gridFor(n)} gap-y-2 md:gap-y-0 md:items-center py-3.5 border-t border-[var(--border-1)]`}>
      <div className="md:pr-2">
        <LabelTip label={ligne.label} text={ligne.aide} />
        {!neutre && (
          <span
            className={`block mt-1 font-mono text-[length:var(--text-micro)] tracking-[0.12em] uppercase ${
              egalite ? "text-ghost" : "text-accent"
            }`}
          >
            {egalite ? "À égalité" : `Avantage ${leaderNoms.join(" et ")}`}
          </span>
        )}
      </div>

      {merged ? (
        <div className={`${MERGED_SPAN_BY_N[n] ?? MERGED_SPAN_BY_N[3]} md:px-3.5 md:py-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5`}>
          <span className="text-[length:var(--text-body)] leading-[1.45] text-label">
            {dispo[0].palier}
            {dispo[0].qualifier ? `, ${dispo[0].qualifier}` : ""}
          </span>
          {/* FUT-32 : le cardinal réel ; une matrice n'existe qu'à deux ou trois communes. */}
          {motCardinal(n) && <span className="text-[length:var(--text-dense)] text-muted">· même information pour les {motCardinal(n)} communes</span>}
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
    <div className={`${gridFor(trio.length)} hidden md:grid pb-2 border-b border-[var(--border-1)]`}>
      <div className="font-mono text-[length:var(--text-micro)] tracking-[0.14em] uppercase text-ghost self-end pb-1">Critère</div>
      {trio.map((r, n) => (
        <div key={r.insee} className="px-3.5 flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-accent">{String(n + 1).padStart(2, "0")}</span>
          <span className="text-[length:var(--text-lede)] leading-[1.1] text-label" style={{ fontFamily: "var(--font-serif)" }}>
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
