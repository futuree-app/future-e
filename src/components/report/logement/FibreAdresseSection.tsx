import type { LectureFibre } from "@/lib/fibre-adresse";
import { texteFibre, URL_MA_CONNEXION_INTERNET } from "@/lib/fibre-adresse-texte";
import { bindOrphans } from "@/lib/typography";
import { releve as s, Ligne, Marge, Surtitre, type ElementDeMarge } from "@/components/releve/primitives";

// LA FIBRE À CETTE ADRESSE (FUT-156), dans la grammaire du Relevé : un énoncé et sa marge de preuve, séparés
// du reste par un filet. Les phrases sont décidées dans `fibre-adresse-texte.ts` (pur, testé) ; ce composant
// ne fait que les poser, dans l'ordre fait, limite, vérification, puis la méthode repliée.
//
// Un rapport collecté avant FUT-156, ou sans lecture activée (`lecture` absente), n'affiche RIEN.

export function FibreAdresseSection({ lecture }: { lecture: LectureFibre | null | undefined }) {
  const t = texteFibre(lecture);
  if (!t) return null;
  const marge: ElementDeMarge[] = [
    { type: "grain", grain: "batiment" },
    { type: "valeur", valeur: t.marge.valeur },
    ...(t.marge.operateurs ? [{ type: "valeur" as const, valeur: t.marge.operateurs }] : []),
    { type: "source", texte: t.marge.source, ...(t.marge.date ? { date: t.marge.date } : {}) },
  ];
  return (
    <section aria-labelledby="fibre-adresse" style={{ display: "grid", gap: 18, paddingTop: 22, borderTop: "1px solid var(--r-filet)" }}>
      <Surtitre id="fibre-adresse">Fibre à cette adresse</Surtitre>
      <Ligne marge={<Marge elements={marge} />}>
        <p className={`${s.corps} ${s.encre}`}>{bindOrphans(t.etat)}</p>
        {t.operateurs && <p className={s.corps}>{bindOrphans(t.operateurs)}</p>}
        <p className={s.nuance}>{bindOrphans(t.limite)}</p>
        <div className={s.pileSerree}>
          <p className={s.etiquette} style={{ margin: 0 }}>Ce que vous pouvez vérifier</p>
          <p className={s.dense}>{bindOrphans(t.verifier)}</p>
          <p className={s.dense}>
            <a href={URL_MA_CONNEXION_INTERNET} target="_blank" rel="noopener noreferrer" className={s.lien}>
              Vérifier l&apos;adresse sur Ma connexion internet
            </a>
          </p>
        </div>
        {t.savoirPlus.length > 0 && (
          <details className={`${s.details} ${s.detailsFluide}`}>
            <summary>En savoir plus</summary>
            <div className={s.pileSerree} style={{ marginTop: 10 }}>
              {t.savoirPlus.map((l) => <p key={l} className={s.nuance}>{l}</p>)}
            </div>
          </details>
        )}
      </Ligne>
    </section>
  );
}
