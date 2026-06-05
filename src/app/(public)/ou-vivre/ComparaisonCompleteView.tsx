"use client";

import type {
  ComparaisonComplete,
  ComparaisonCellule,
  ComparaisonLigne,
  MatchResult,
} from "@/lib/comparateur-vie";

// Comparaison complète (Pack Décision) : matrice d'arbitrages, 7 thèmes stables, palier
// incarné absolu + avantage relatif au trio. Aucun chiffre, aucune jauge. Le trio reste
// trois colonnes persistantes (en-tête collant) ; la commune qui mène s'allume en accent
// et l'oeil suit l'arbitrage colonne par colonne. cf. spec 2026-06-05-comparateur-complet.

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[]; // ordre des colonnes
  onBack: () => void;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
// Gabarit de grille partagé par l'en-tête collant ET chaque ligne, pour que les colonnes
// s'alignent. Mobile = une colonne (empilé) ; desktop = libellé + 3 communes.
const GRID = "grid grid-cols-1 md:grid-cols-[minmax(150px,210px)_repeat(3,minmax(0,1fr))] md:gap-x-4";

function reveal(i: number): React.CSSProperties {
  return { animation: `step-enter 0.55s ${EASE} both`, animationDelay: `${0.04 * i}s` };
}

function leaderInsee(ligne: ComparaisonLigne): string | null {
  return ligne.avantage.type === "avantage" ? ligne.avantage.insee : null;
}

// Une cellule de palier. En tête de colonne sur desktop (nom caché, repris de l'en-tête) ;
// préfixée du nom de la commune sur mobile. La commune qui mène s'allume en accent.
function Cellule({
  cell,
  nom,
  leader,
}: {
  cell: ComparaisonCellule;
  nom: string;
  leader: boolean;
}) {
  const tone = !cell.disponible
    ? "text-ghost italic"
    : leader
      ? "text-accent"
      : "text-label";
  return (
    <div
      className={[
        "flex items-baseline gap-3 md:block md:gap-0 md:rounded-xl md:px-3.5 md:py-2.5 md:transition-colors",
        leader ? "md:bg-accent/[0.07] md:ring-1 md:ring-accent/20" : "",
      ].join(" ")}
    >
      <span className="md:hidden w-[88px] shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase text-ghost pt-0.5">
        {nom}
      </span>
      <span className="min-w-0">
        <span className={`text-[14px] leading-[1.45] ${tone}`}>{cell.palier}</span>
        {cell.qualifier && (
          <span className="block text-[12px] leading-[1.4] text-muted mt-0.5">{cell.qualifier}</span>
        )}
      </span>
    </div>
  );
}

function LigneRow({ ligne, trio }: { ligne: ComparaisonLigne; trio: MatchResult[] }) {
  const leader = leaderInsee(ligne);
  const egalite = ligne.avantage.type === "egalite";
  const cellByInsee = new Map(ligne.cellules.map((c) => [c.insee, c]));
  return (
    <div className={`${GRID} gap-y-2 md:gap-y-0 md:items-center py-4 border-t border-white/[0.06]`}>
      <div className="md:pr-2">
        <span className="text-[14.5px] leading-[1.3] text-label">{ligne.label}</span>
        <span
          className={`block mt-0.5 font-mono text-[9.5px] tracking-[0.12em] uppercase ${
            egalite ? "text-ghost" : "text-accent"
          }`}
        >
          {egalite ? "À égalité" : `Avantage ${trio.find((r) => r.insee === leader)?.nom ?? ""}`}
        </span>
      </div>
      {trio.map((r) => {
        const cell = cellByInsee.get(r.insee);
        if (!cell) return <div key={r.insee} />;
        return <Cellule key={r.insee} cell={cell} nom={r.nom} leader={cell.insee === leader} />;
      })}
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
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">
          Comparaison complète
        </p>
        <h2
          className="font-normal text-[clamp(26px,3.6vw,38px)] leading-[1.12] tracking-[-0.6px] text-label max-w-[760px]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Vous les avez retenus tous les trois.{" "}
          <span className="italic text-accent">Voici, critère par critère, ce qui penche et ce qui se vaut.</span>
        </h2>
        {/* Légende du trio sur mobile (sur desktop, l'en-tête collant la porte) */}
        <p className="md:hidden mt-5 text-[14px] text-muted">
          {trio.map((r, i) => (
            <span key={r.insee}>
              {i > 0 && <span className="text-ghost"> · </span>}
              <span className="text-label">{r.nom}</span>
            </span>
          ))}
        </p>
      </div>

      {/* Chapeau : navigation vers ce qui sépare vraiment */}
      {data.chapeau.length > 0 && (
        <div className="glass rounded-2xl px-6 py-5 mt-9" style={{ ...reveal(1), borderColor: "color-mix(in srgb, var(--accent) 32%, transparent)" }}>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-3">
            Ce qui les sépare vraiment
          </p>
          <div className="flex flex-wrap gap-2">
            {data.chapeau.map((c) => (
              <span
                key={c}
                className="px-3.5 py-1.5 rounded-full text-[13px] text-label"
                style={{ border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)" }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* En-tête collant des 3 communes (desktop) : ancre l'identité des colonnes au scroll */}
      <div
        className={`${GRID} hidden md:grid md:sticky md:top-0 z-10 mt-12 mb-1 py-3 -mx-3 px-3 rounded-xl`}
        style={{ background: "color-mix(in srgb, var(--canvas) 86%, transparent)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-ghost self-end pb-1">
          Critère
        </div>
        {trio.map((r, i) => (
          <div key={r.insee} className="px-3.5">
            <div className="font-mono text-[9.5px] tracking-[0.16em] text-ghost mb-0.5">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className="text-[18px] leading-[1.15] text-label"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {r.nom}
            </div>
          </div>
        ))}
      </div>

      {/* Thèmes */}
      <div className="mt-2 md:mt-4 space-y-12">
        {data.themes.map((th, i) => (
          <section key={th.id} style={reveal(2 + i)}>
            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="font-mono text-[11px] tracking-[0.16em] text-ghost">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3
                className="font-normal text-[22px] leading-[1.15] text-label"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {th.titre}
              </h3>
            </div>
            <p className="text-[14.5px] leading-[1.55] text-muted italic mb-4 max-w-[680px]">
              {th.synthese}
            </p>
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
