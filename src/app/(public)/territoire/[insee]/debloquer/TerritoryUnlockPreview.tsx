import type { ApercuTerritoire, FaitApercu } from "@/lib/apercu-territoire";

// L'aperçu du dossier de territoire (FUT-30). Présentation pure : tout le texte vient de
// `apercu-territoire.ts`, qui en garantit la source, l'horizon et l'échelle.
//
// Rien n'est verrouillé ici, et rien n'est flouté : les faits affichés sont donnés en entier. Ce que le
// dossier ajoute (la lecture d'ensemble, ce qu'elle implique, ce qu'il reste à vérifier) n'est pas
// simulé par un cadenas sur une carte.
//
// Chaque fait porte SA source. L'ancien pied de bloc listait toutes les bases que le moteur complet
// pouvait mobiliser, y compris celles dont aucun fait affiché ne venait.
function CarteFait({ fait }: { fait: FaitApercu }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-5">
      <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent mb-3">
        {fait.theme} · échelle de la commune
      </p>
      <p className="text-[22px] leading-[1.2] text-label" style={{ fontFamily: "var(--font-serif)" }}>
        {fait.valeur}
      </p>
      <p className="mt-2 text-[14px] leading-[1.6] text-label/85">{fait.periode}.</p>
      <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-ghost">{fait.horizon}</p>
      <p className="mt-4 text-[13px] leading-[1.6] text-muted">{fait.mesure}</p>
      {fait.limite && (
        <p className="mt-2 text-[13px] leading-[1.6] text-muted">
          <span className="text-label/85">Limite.</span> {fait.limite}
        </p>
      )}
      <p className="mt-4 pt-3 border-t border-[var(--border-1)] font-mono text-[11px] tracking-[0.04em] text-ghost">
        Source : {fait.source} · valeur établie pour la commune
      </p>
    </div>
  );
}

export function TerritoryUnlockPreview({ apercu }: { apercu: ApercuTerritoire }) {
  if (apercu.etat === "sans_fait") {
    // L'ÉTAT SANS FAIT. Visible et stable : il ne ressemble pas à une panne, ne dit pas que les données
    // manquent, et ne conclut rien. Il dit seulement que l'aperçu ne met pas de fait isolé en avant.
    return (
      <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-5">
        <p className="text-[15px] leading-[1.7] text-label/85">
          Cet aperçu ne met en avant aucun fait isolé pour {apercu.commune}&nbsp;: aucun des indicateurs
          qu&apos;il retient ne se lit assez clairement sans le contexte du dossier.
        </p>
        <p className="mt-3 text-[14px] leading-[1.7] text-muted">
          Le dossier examine la trajectoire climatique de la commune, les risques recensés, son cadre de
          vie et ce qui la transforme, chaque constat avec sa source et sa limite.
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
