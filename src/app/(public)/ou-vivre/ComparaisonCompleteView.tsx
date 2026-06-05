"use client";

import type { ComparaisonComplete, ComparaisonLigne, MatchResult } from "@/lib/comparateur-vie";

// Comparaison complète (Pack Décision) : matrice d'arbitrages, 7 thèmes stables, palier
// incarné absolu + en-tête d'avantage relatif au trio. Aucun chiffre, aucune jauge.
// Présentation pure de outcome.comparaisonComplete. cf. spec 2026-06-05-comparateur-complet.

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[]; // pour insee -> nom
  onBack: () => void;
};

function nomByInsee(trio: MatchResult[]): Map<string, string> {
  return new Map(trio.map((r) => [r.insee, r.nom]));
}

function Ligne({ ligne, noms }: { ligne: ComparaisonLigne; noms: Map<string, string> }) {
  const avantage =
    ligne.avantage.type === "avantage"
      ? `Avantage ${noms.get(ligne.avantage.insee) ?? ""}`
      : "À égalité";
  return (
    <div className="py-3 border-t border-black/5 first:border-t-0">
      <div className="flex items-baseline justify-between gap-4 mb-1.5">
        <span className="text-[15px] text-label">{ligne.label}</span>
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent shrink-0">
          {avantage}
        </span>
      </div>
      <ul className="space-y-0.5">
        {ligne.cellules.map((c) => (
          <li key={c.insee} className="flex items-baseline gap-3 text-[14px]">
            <span className="text-muted w-28 shrink-0">{noms.get(c.insee) ?? ""}</span>
            <span className={c.disponible ? "text-label" : "text-muted italic"}>
              {c.palier}
              {c.qualifier ? <span className="text-muted">, {c.qualifier}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComparaisonCompleteView({ data, trio, onBack }: Props) {
  const noms = nomByInsee(trio);
  return (
    <div className="pt-10">
      <button
        onClick={onBack}
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir aux territoires
      </button>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
        Comparaison complète
      </p>
      <h2 className="font-normal text-[clamp(24px,3.4vw,34px)] leading-[1.15] tracking-[-0.6px] text-label mb-7">
        Les trois territoires, sur tous les critères
      </h2>

      {data.chapeau.length > 0 && (
        <div className="glass rounded-2xl px-6 py-5 mb-8">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-2">
            Ce qui les sépare vraiment
          </p>
          <p className="text-[16px] text-label">{data.chapeau.join(" · ")}</p>
        </div>
      )}

      <div className="space-y-6">
        {data.themes.map((th) => (
          <section key={th.id} className="glass rounded-2xl px-6 py-6">
            <h3 className="font-mono text-[11px] tracking-[0.14em] uppercase text-label mb-2">
              {th.titre}
            </h3>
            <p className="text-[15px] text-muted mb-4">{th.synthese}</p>
            <div>
              {th.lignes.map((l) => (
                <Ligne key={l.id} ligne={l} noms={noms} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
