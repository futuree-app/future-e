// FUT-91 · LA LISTE COMPLÈTE DES CONTRÔLES, DANS LE RELEVÉ.
//
// La minute n'est pas le dossier : le verdict annonce des contrôles « plus bas », et ils sont ici, TOUS,
// rangés par échelle par le moteur (`controlesParEchelle`). Même vue, même titre (`controlesTitle`),
// même phrase des vérifications non réalisées que `ControlesDuDossier` ; seule la présentation change.
// Les groupes restent repliés au chargement : ils sont l'exhaustif après la synthèse, jamais une
// information nécessaire pour comprendre le verdict (même arbitrage que la production, 21/08/2026).
import type { Dossier } from "@/lib/decision/decision-fact";
import { controlesParEchelle, phraseVerificationsNonRealisees } from "@/lib/decision/dossier-view";
import { bindOrphans } from "@/lib/typography";
import { sujetsDuGroupe } from "@/lib/decision/controles-sujets";
import { lireCarteDuDossier } from "./lecture-dossier";
import { EntreeReleve } from "./EntreeReleve";
import { releve as s, Grain, type GrainCle } from "./primitives";

const GLYPHE: Record<string, GrainCle> = { territoire: "commune", quartier: "secteur", logement: "batiment" };
const COULEUR = "var(--reg-controle)";

export function ControlesReleve({ dossier, provenance }: { dossier: Dossier; provenance?: string }) {
  const groupes = controlesParEchelle(dossier);
  const nonRealisees = phraseVerificationsNonRealisees(dossier);
  if (groupes.length === 0 && nonRealisees == null) return null;
  return (
    <section id="controles" className={`mt-14 scroll-mt-24 ${s.releveSection}`}>
      <div className={s.enTeteMouvement}>
        <h2 className={s.surtitre}>
          <span aria-hidden className={s.sommaireTrait} style={{ background: COULEUR }} />
          <span>{dossier.controlesTitle}</span>
        </h2>
        <p className={s.nuance}>
          {bindOrphans("La synthèse ci-dessus retient l'essentiel. Dépliez une rubrique pour consulter les contrôles supplémentaires établis par nos sources.")}
        </p>
        {nonRealisees ? <p className={s.dense} style={{ color: "var(--reg-non-su)" }}>{bindOrphans(nonRealisees)}</p> : null}
      </div>
      <div>
        {groupes.map((g) => (
          <details key={g.echelle ?? "sans-echelle"} className={s.groupe}>
            <summary>
              <span style={{ color: "var(--r-encre)", paddingTop: 2 }}>
                {g.echelle ? <Grain grain={GLYPHE[g.echelle]!}>{""}</Grain> : <span aria-hidden>·</span>}
              </span>
              <span className={s.pileSerree}>
                {/* Une carte sans échelle prouvée reste hors des trois grains (même libellé qu'en production). */}
                <span className={s.sousTitre} style={{ fontSize: 15.5 }}>{g.titre ?? "Autres contrôles"}</span>
                <span className={s.nuance}>{bindOrphans(sujetsDuGroupe(g.cards))}</span>
              </span>
              <span className={s.rangee} style={{ gap: 12 }}>
                <span className={s.mono} style={{ fontSize: 12, color: "var(--r-meta)" }}>{g.cards.length === 1 ? "1 contrôle" : `${g.cards.length} contrôles`}</span>
                <span aria-hidden className={s.groupeSigne}>+</span>
              </span>
            </summary>
            <div className={s.groupeCorps}>
              <ul className={s.liste}>
                {g.cards.map((card) => {
                  const e = lireCarteDuDossier(dossier, card);
                  return <EntreeReleve key={e.ancre} e={e} teinte={COULEUR} provenance={provenance} ancre={false} />;
                })}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
