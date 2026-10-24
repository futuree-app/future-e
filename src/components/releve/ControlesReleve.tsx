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
import { releve as s, Grain, Registre, type GrainCle } from "./primitives";

// L'ÉCHELLE D'UNE RUBRIQUE A LA FORME DE L'EMBLÈME (FUT-126) : cercle, carré, losange, en trait. Le losange
// PLEIN est le grain d'un fait établi sur le bâtiment ; en tête de la rubrique « Logement », il contredisait
// le losange vide de « D'où viennent ces constats » et du navigateur, pour la même échelle, sur la même page.
const GLYPHE: Record<string, GrainCle> = { territoire: "commune", quartier: "secteur", logement: "adresse" };
const COULEUR = "var(--reg-controle)";

export function ControlesReleve({ dossier, provenance }: { dossier: Dossier; provenance?: string }) {
  const groupes = controlesParEchelle(dossier);
  const nonRealisees = phraseVerificationsNonRealisees(dossier);
  if (groupes.length === 0 && nonRealisees == null) return null;
  return (
    // FUT-126 · LE PASSAGE DE LA SYNTHÈSE AU DÉTAIL SE VOIT. La recette lisait la liste complète comme une
    // section de plus, au rang de « À contrôler » : même surtitre, même filet. Elle ouvre désormais un
    // nouveau mouvement (filet fort, titre au rang de ceux de la balance), et sa phrase dit ce qu'elle
    // contient : TOUS les contrôles de chaque échelle, y compris ceux que la synthèse cite déjà
    // (`controlesParEchelle` reprend toute la section des vérifications). Sans rubrique, la phrase se tait.
    <section id="controles" aria-labelledby="controles-titre" className={`mt-14 scroll-mt-24 ${s.releveSection} ${s.controles}`}>
      <div className={s.enTeteMouvement}>
        <Registre as="h2" teinte={COULEUR} className={`${s.titre} ${s.titreBalance}`}>
          <span id="controles-titre">{dossier.controlesTitle}</span>
        </Registre>
        {groupes.length > 0 ? (
          <p className={s.dense}>
            {bindOrphans("La synthèse ci-dessus retient l'essentiel pour décider. Voici le détail : chaque rubrique liste tous les contrôles établis à son échelle, y compris ceux déjà cités.")}
          </p>
        ) : null}
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
                {/* Le geste dit en mots, à côté du signe : la rubrique se déplie. L'état ouvert ou fermé, lui,
                    est annoncé par le `<details>` natif ; ce mot est un repère visuel, caché aux lecteurs d'écran. */}
                <span aria-hidden className={s.groupeGeste}>
                  <span className={s.siFerme}>Déplier</span><span className={s.siOuvert}>Replier</span>
                  <span className={s.groupeSigne}>+</span>
                </span>
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
