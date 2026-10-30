import type { LectureSitesSols } from "@/lib/sites-sols-etat";
import { texteSitesSols, URL_CARTE_GEORISQUES } from "@/lib/sites-sols-texte";
import { bindOrphans } from "@/lib/typography";
import { releve as s, Ligne, Marge, Surtitre, type ElementDeMarge } from "@/components/releve/primitives";
import c from "./sites-sols.module.css";

// LES SOLS POLLUÉS SUR CE TERRAIN (FUT-157), dans la grammaire du Relevé, comme la fibre (FUT-156) : un énoncé
// et sa marge de preuve, séparés du reste par un filet. Les phrases sont décidées dans `sites-sols-texte.ts`
// (pur, testé) ; ce composant ne fait que les poser : le fait, les sites en cause, ce que cela change, les
// limites, la vérification, puis la méthode repliée.
//
// Un rapport collecté avant FUT-157 (`lecture` absente) n'affiche RIEN.

export function SitesSolsSection({ lecture }: { lecture: LectureSitesSols | null | undefined }) {
  const t = texteSitesSols(lecture);
  if (!t) return null;
  const marge: ElementDeMarge[] = [
    { type: "grain", grain: "adresse", libelle: t.marge.grain },
    { type: "valeur", valeur: t.marge.valeur },
    { type: "source", texte: t.marge.source },
  ];
  return (
    <section aria-labelledby="sites-sols" style={{ display: "grid", gap: 18, paddingTop: 22, borderTop: "1px solid var(--r-filet)" }}>
      <Surtitre id="sites-sols">Sols pollués sur ce terrain</Surtitre>
      <Ligne marge={<Marge elements={marge} />}>
        <p className={`${s.corps} ${s.encre}`}>{bindOrphans(t.titre)}</p>
        {t.sites.length > 0 && (
          <div className={s.pileSerree} style={{ gap: 14 }}>
            {t.sites.map((site) => (
              <div key={site.cle} className={c.site}>
                <p className={`${s.dense} ${s.encre}`} style={{ fontWeight: 600 }}>{site.nom}</p>
                <p className={s.dense}>{bindOrphans(site.situation)}</p>
                <ul className={c.inscriptions}>
                  {site.inscriptions.map((i) => (
                    <li key={i.inventaire} className={s.nuance}>
                      {i.libelle}{i.miseAJour ? ` · fiche mise à jour le ${i.miseAJour}` : ""}
                      {i.lien && (
                        <>
                          {" · "}
                          <a href={i.lien} target="_blank" rel="noopener noreferrer" className={`${s.lien} ${c.lienSeul}`}
                            aria-label={`Fiche officielle : ${site.nom}, ${i.libelle} (nouvel onglet)`}>
                            fiche officielle
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {t.change.map((l) => <p key={l} className={s.corps}>{bindOrphans(l)}</p>)}
        {t.limites.map((l) => <p key={l} className={s.nuance}>{bindOrphans(l)}</p>)}
        <div className={s.pileSerree}>
          <p className={s.etiquette} style={{ margin: 0 }}>Ce que vous pouvez vérifier</p>
          {t.verifier.map((l) => <p key={l} className={s.dense}>{bindOrphans(l)}</p>)}
          <p className={s.dense}>
            <a href={URL_CARTE_GEORISQUES} target="_blank" rel="noopener noreferrer" className={`${s.lien} ${c.lienSeul}`}>
              Ouvrir la carte de Géorisques
            </a>
          </p>
        </div>
        <details className={`${s.details} ${s.detailsFluide}`}>
          <summary>En savoir plus</summary>
          <div className={s.pileSerree} style={{ marginTop: 10 }}>
            {t.savoirPlus.map((l) => <p key={l} className={s.nuance}>{l}</p>)}
          </div>
        </details>
      </Ligne>
    </section>
  );
}
