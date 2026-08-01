// ════════════════════════════════════════════════════════════════════════════════════════════
// TOUS LES CONTRÔLES DU DOSSIER, RANGÉS PAR ÉCHELLE.
//
// POURQUOI CE COMPOSANT EXISTE. Le verdict annonçait « trois autres constats figurent dans le
// dossier complet », et ce dossier complet ne s'affichait NULLE PART : `dossier.sections` n'avait
// aucun consommateur hors de la minute, elle-même plafonnée à quatre cartes tous registres
// confondus. Le lecteur à qui on promettait trois constats de plus n'avait aucun endroit où les
// lire. Le cas était même le plus fréquent, depuis que la sélection de la minute privilégie ce qui
// fonde le verdict plutôt que ce qui reste à contrôler.
//
// CE N'EST PAS UNE SECONDE SÉLECTION. La liste rend la section `verifications` telle que
// l'assembleur l'a produite, sans plafond depuis le 01/08/2026 : une seule collection, deux
// surfaces. La minute montre ce qui fonde le verdict, celle-ci se lit comme une feuille de
// contrôle qu'on emporte, y compris les constats déjà vus plus haut.
//
// LE TITRE VIENT DU DOSSIER (`controlesTitle`), donc de la même fonction que celui de la section
// de la minute : le verbe suit la posture (contrôler quand on s'engage, surveiller quand on
// habite) et les deux ne peuvent pas diverger.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { Fragment } from "react";
import type { Dossier, DossierCard } from "@/lib/decision/decision-fact";
import { controlesParEchelle } from "@/lib/decision/dossier-view";
import { FactBody, EvidenceRow, MethodDetails, factSources, factChecks } from "@/components/report/DecisionFactRenderParts";
import { FactCompositionCard } from "@/components/report/FactCompositionCard";

// La couleur des contrôles, la même que leur section dans la minute : une même nature de constat se
// peint pareil d'un bout à l'autre de la page.
const COULEUR = "var(--info)";

export function ControlesDuDossier({ dossier }: { dossier: Dossier }) {
  const groupes = controlesParEchelle(dossier);
  // Aucun contrôle établi : rien ne s'affiche, et le verdict n'en parle pas non plus. Un bloc vide
  // annonçant « aucun point à contrôler » promettrait une vérification exhaustive du lieu.
  if (groupes.length === 0) return null;

  const absorbedOf = (c: DossierCard) =>
    c.kind === "composition"
      ? dossier.absorbedFacts.filter((f) => c.composition.absorbedFactIds.includes(f.id))
      : [];

  return (
    <section id="controles" className="mt-14 scroll-mt-24">
      <div className="mb-6">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: COULEUR }}>
          <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: COULEUR, boxShadow: `0 0 6px ${COULEUR}` }} />
          {dossier.controlesTitle}
        </div>
        <p className="text-[length:var(--text-dense)] leading-[1.6] text-ghost">
          Ce que nos sources ont établi pour ce dossier, du plus large au plus précis. La synthèse
          ci-dessus en retient ce qui fonde son verdict.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {groupes.map((g) => (
          <div key={g.echelle ?? "sans-echelle"} className="glass rounded-xl p-5 sm:p-6">
            {/* L'ÉCHELLE, quand elle est établie. Un fait dont aucune preuve ne la porte ouvre un
                groupe SANS titre : le ranger d'office sous « Territoire » fabriquerait une
                appartenance que rien ne fonde. */}
            {g.titre && (
              <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-muted mb-4">
                <span aria-hidden className="h-px w-4 bg-white/25 shrink-0" />
                {g.titre}
              </div>
            )}
            <ul className="flex flex-col gap-6 [&>li:not(:first-child)]:border-t [&>li:not(:first-child)]:border-[var(--border-1)] [&>li:not(:first-child)]:pt-6">
              {g.cards.map((card) => {
                if (card.kind === "composition") {
                  return (
                    <Fragment key={card.composition.id}>
                      <FactCompositionCard
                        composition={card.composition}
                        color={COULEUR}
                        absorbedFacts={absorbedOf(card)}
                      />
                    </Fragment>
                  );
                }
                const f = card.fact;
                const conventions = [
                  ...(f.role === "verification" && f.signalConvention ? [f.signalConvention] : []),
                  ...factSources(f),
                ];
                return (
                  // AUCUNE ANCRE ICI. La carte de la minute porte déjà `dossierAnchorId(f.id)`, et
                  // un même fait peut s'afficher aux deux endroits : deux éléments de même `id`
                  // enverraient les renvois « à contrôler en priorité » au hasard.
                  <li key={f.id}>
                    <FactBody fact={f} color={COULEUR} />
                    <EvidenceRow fact={f} color={COULEUR} />
                    <MethodDetails conventions={conventions} checks={factChecks(f)} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
