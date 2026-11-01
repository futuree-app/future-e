import { texteIndustrieAdresse, type LectureIndustrieAdresse } from "@/lib/industrie-adresse";
import { bindOrphans } from "@/lib/typography";
import { releve as s, Ligne, Marge, Surtitre, type ElementDeMarge } from "@/components/releve/primitives";

// LES RISQUES INDUSTRIELS À CETTE ADRESSE (FUT-167, D2), dans la grammaire du Relevé : la question posée, sa
// réponse, ce que l'on peut établir pour ce bien, puis les sites Seveso autour (un fait de proximité, distinct du
// plan), les limites et les vérifications. Les phrases sont décidées dans `industrie-adresse.ts` (pur, testé) ; ce
// composant ne fait que les poser.
//
// Un rapport collecté avant FUT-167 n'a pas cette lecture : la section le dit et renvoie à l'actualisation, sans
// rien conclure (ni « aucun plan », ni une panne).

export function IndustrieAdresseSection({ lecture, collecteeLe }: { lecture: LectureIndustrieAdresse | undefined; collecteeLe: string | null }) {
  if (!lecture) {
    return (
      <section aria-labelledby="industrie-adresse" style={{ display: "grid", gap: 12, paddingTop: 22, borderTop: "1px solid var(--r-filet)" }}>
        <Surtitre id="industrie-adresse">Risques industriels à cette adresse</Surtitre>
        <p className={s.nuance}>
          {bindOrphans("Cette lecture (sites Seveso autour du logement, plans de prévention des risques technologiques) n'existait pas lors de la collecte de ce rapport. « Actualiser les données » la produit, sans modifier la version déjà enregistrée.")}
        </p>
      </section>
    );
  }
  const t = texteIndustrieAdresse(lecture, collecteeLe);
  const marge: ElementDeMarge[] = [
    { type: "grain", grain: "adresse" },
    { type: "valeur", valeur: t.marge.valeur },
    ...t.marge.sources.map((x) => ({ type: "source" as const, texte: x.texte, ...(x.date ? { date: x.date } : {}) })),
  ];
  return (
    <section aria-labelledby="industrie-adresse" style={{ display: "grid", gap: 18, paddingTop: 22, borderTop: "1px solid var(--r-filet)" }}>
      <Surtitre id="industrie-adresse">Risques industriels à cette adresse</Surtitre>
      <Ligne marge={<Marge elements={marge} />}>
        <p className={s.etiquette} style={{ margin: 0 }}>{t.question}</p>
        <p className={`${s.corps} ${s.encre}`}>{bindOrphans(t.constat)}</p>
        {t.pourCeBien.length > 0 && (
          <div className={s.pileSerree}>
            <p className={s.etiquette} style={{ margin: 0 }}>Ce que l&apos;on peut établir pour ce bien</p>
            {t.pourCeBien.map((p) => <p key={p} className={s.dense}>{bindOrphans(p)}</p>)}
          </div>
        )}
        <div className={s.pileSerree}>
          <p className={s.etiquette} style={{ margin: 0 }}>{t.sites.titre}</p>
          {t.sites.vide && <p className={s.dense}>{bindOrphans(t.sites.vide)}</p>}
          {t.sites.lignes.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
              {t.sites.lignes.map((l) => (
                <li key={l.href} className={s.dense}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className={s.lien}>{l.texte}</a>
                </li>
              ))}
            </ul>
          )}
          {t.sites.reste && <p className={s.nuance}>{t.sites.reste}</p>}
          {/* La limite principale reste VISIBLE : une distance ne mesure aucune exposition. */}
          <p className={s.nuance}>{bindOrphans(t.limites[0]!)}</p>
        </div>
        <div className={s.pileSerree}>
          <p className={s.etiquette} style={{ margin: 0 }}>Ce que vous pouvez vérifier</p>
          {t.verifier.map((v) => <p key={v} className={s.dense}>{bindOrphans(v)}</p>)}
        </div>
        <details className={`${s.details} ${s.detailsFluide}`}>
          <summary>Ce que cette lecture ne dit pas</summary>
          <div className={s.pileSerree} style={{ marginTop: 10 }}>
            {t.limites.slice(1).map((l) => <p key={l} className={s.nuance}>{bindOrphans(l)}</p>)}
          </div>
        </details>
      </Ligne>
    </section>
  );
}
