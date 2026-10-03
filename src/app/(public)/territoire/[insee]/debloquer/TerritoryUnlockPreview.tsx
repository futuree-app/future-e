import type { ApercuTerritoire, FaitApercu } from "@/lib/apercu-territoire";

// L'aperçu du dossier de territoire (FUT-30). Présentation pure : tout le texte vient de
// `apercu-territoire.ts`, qui le prend lui-même aux cartes de l'accueil (FUT-37), sans second
// vocabulaire.
//
// Rien n'est verrouillé ici, et rien n'est flouté : les faits affichés sont donnés en entier. Ce que le
// dossier ajoute (la lecture d'ensemble, ce qu'elle implique, ce qu'il reste à vérifier) n'est pas
// simulé par un cadenas sur une carte.
//
// Chaque fait porte SA source et SON échelle. L'ancien pied de bloc listait toutes les bases que le
// moteur complet pouvait mobiliser, y compris celles dont aucun fait affiché ne venait.
const ECHELLE = { commune: "la commune", arrondissement: "l'arrondissement" } as const;

function CarteFait({ fait }: { fait: FaitApercu }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-5">
      <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent mb-3">
        {fait.titre} · échelle de {ECHELLE[fait.grain]}
      </p>
      <p className="text-[26px] leading-[1.1] text-label" style={{ fontFamily: "var(--font-serif)" }}>
        {fait.valeur}
      </p>
      {fait.comparaison && (
        <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-muted">{fait.comparaison}</p>
      )}
      <p className="mt-3 text-[14px] leading-[1.6] text-label/85">{fait.fait}</p>
      <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-ghost">{fait.horizon}</p>
      {fait.lecture && <p className="mt-4 text-[13px] leading-[1.6] text-muted">{fait.lecture}</p>}
      <p className={`${fait.lecture ? "mt-2" : "mt-4"} text-[13px] leading-[1.6] text-muted`}>{fait.note}</p>
      {fait.limite && (
        <p className="mt-2 text-[13px] leading-[1.6] text-muted">
          <span className="text-label/85">Limite.</span> {fait.limite}
        </p>
      )}
      <p className="mt-4 pt-3 border-t border-[var(--border-1)] font-mono text-[11px] tracking-[0.04em] text-ghost">
        Source : {fait.source} · valeur établie pour {ECHELLE[fait.grain]}
      </p>
    </div>
  );
}

export function TerritoryUnlockPreview({ apercu }: { apercu: ApercuTerritoire }) {
  if (apercu.etat === "sans_fait") {
    // L'ÉTAT SANS FAIT. Visible et stable. Il dit que l'analyse existe dans le dossier, et que l'aperçu
    // gratuit n'en isole aucun indicateur : jamais que futur•e n'aurait rien trouvé.
    return (
      <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-5">
        <p className="text-[15px] leading-[1.7] text-label/85">
          Le dossier de {apercu.commune} lit ensemble la trajectoire climatique, les risques recensés,
          le cadre de vie et ce qui transforme la commune.
        </p>
        <p className="mt-3 text-[14px] leading-[1.7] text-muted">
          Cet aperçu gratuit n&apos;en isole aucun indicateur&nbsp;: sorti de son contexte, aucun ne
          serait assez parlant.
        </p>
      </div>
    );
  }

  return (
    <div className={apercu.faits.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
      {apercu.faits.map((fait) => (
        <CarteFait key={fait.axe} fait={fait} />
      ))}
    </div>
  );
}
