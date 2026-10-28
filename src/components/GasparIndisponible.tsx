import { GASPAR_INDISPONIBLE } from "@/lib/gaspar-pages-publiques";

// FUT-159 · CE QUE LISENT LES PAGES /inondation ET /chaleur QUAND GASPAR N'A PAS RÉPONDU. Le bloc garde son
// titre et sa source, et dit à la place de son contenu que la donnée n'a pas pu être lue. Les classes
// `data-card*` sont celles des deux pages.
export default function GasparIndisponible({ titre, source, objet, accent }: {
  titre: string;
  source: string;
  /** Ce qui n'a pas pu être lu, au pluriel : « les risques officiels recensés pour la commune ». */
  objet: string;
  accent: string;
}) {
  return (
    <section data-gaspar="indisponible" aria-label={`${titre} : ${GASPAR_INDISPONIBLE.libelle.toLowerCase()}`}>
      <div style={{ margin: '48px 0 10px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
          {titre}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>{source}</div>
      </div>
      <div className="data-card">
        <div className="data-card-label">{GASPAR_INDISPONIBLE.libelle}</div>
        <div className="data-card-note" style={{ marginTop: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--fg-3)' }}>
          {GASPAR_INDISPONIBLE.phrase(objet)}
        </div>
      </div>
    </section>
  );
}
