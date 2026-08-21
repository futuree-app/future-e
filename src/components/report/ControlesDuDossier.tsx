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
import { bindOrphans } from "@/lib/typography";
import styles from "./ControlesDuDossier.module.css";

// La couleur des contrôles, la même que leur section dans la minute : une même nature de constat se
// peint pareil d'un bout à l'autre de la page.
const COULEUR = "var(--info)";

function sujetDeCarte(card: DossierCard): string {
  if (card.kind === "fact") return card.fact.topic;
  if ("headlineSubject" in card.composition) return card.composition.headlineSubject;
  return card.composition.title;
}

function sujetsDuGroupe(cards: DossierCard[]): string {
  const vus = new Set<string>();
  const sujets: string[] = [];

  for (const card of cards) {
    const sujet = sujetDeCarte(card).trim();
    const cle = sujet.toLocaleLowerCase("fr");
    if (!sujet || vus.has(cle)) continue;
    vus.add(cle);
    sujets.push(sujet);
  }

  const apercu = sujets.slice(0, 2).join(" · ");
  if (!apercu) return "Contrôles établis par nos sources";
  const libelle = sujets.length > 2 ? `${apercu} · …` : apercu;
  return libelle.charAt(0).toLocaleUpperCase("fr") + libelle.slice(1);
}

export function ControlesDuDossier(
  {
    dossier,
    /** L'identité de l'artefact d'où ces cartes viennent, portée par les liens « Preuve » qu'elles
     *  émettent (cf. `evidenceHref`). Absente sur un dossier assemblé à l'instant : il n'y a alors
     *  aucune version figée à désigner. */
    provenance,
  }: { dossier: Dossier; provenance?: string },
) {
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
        <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: COULEUR }}>
          <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: COULEUR, boxShadow: `0 0 6px ${COULEUR}` }} />
          {dossier.controlesTitle}
        </h2>
        <p className="text-[length:var(--text-dense)] leading-[1.6] text-ghost">
          {bindOrphans("La synthèse ci-dessus retient l'essentiel. Dépliez une rubrique pour consulter les contrôles supplémentaires établis par nos sources.")}
        </p>
      </div>

      {/* DIVULGATION PROGRESSIVE (21/08/2026). Ces groupes sont l'EXHAUSTIF après la synthèse,
          jamais une information nécessaire pour comprendre le verdict : ils sont donc repliés au
          chargement. `<details>` donne nativement le bouton, le focus clavier et l'état
          ouvert/fermé ; le résumé nomme les sujets avant de donner le volume. Plusieurs groupes
          peuvent rester ouverts pour permettre une comparaison. */}
      <div className="flex flex-col gap-3">
        {groupes.map((g) => (
          <details key={g.echelle ?? "sans-echelle"} className={`${styles.disclosure} glass rounded-xl overflow-hidden`}>
            <summary className={`${styles.summary} cursor-pointer select-none px-5 py-4 sm:px-6 sm:py-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-info`}>
              <span className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 flex-col gap-1">
                  {/* Une carte sans échelle prouvée reste hors des trois grains. Son libellé dit
                      seulement qu'elle existe, sans lui fabriquer une appartenance. */}
                  <span className="text-[15px] font-medium text-label">
                    {g.titre ?? "Autres contrôles"}
                  </span>
                  <span className="text-[12px] leading-[1.45] text-muted">
                    {bindOrphans(sujetsDuGroupe(g.cards))}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.05em] text-ghost">
                    {g.cards.length === 1 ? "1 contrôle" : `${g.cards.length} contrôles`}
                  </span>
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className={`${styles.chevron} h-5 w-5 shrink-0 text-muted`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m7 9.5 5 5 5-5" />
                </svg>
              </span>
            </summary>
            <div className="border-t border-[var(--border-1)] px-5 py-5 sm:px-6 sm:py-6">
              <ul className="flex flex-col gap-6 [&>li:not(:first-child)]:border-t [&>li:not(:first-child)]:border-[var(--border-1)] [&>li:not(:first-child)]:pt-6">
                {g.cards.map((card) => {
                  if (card.kind === "composition") {
                    return (
                      <Fragment key={card.composition.id}>
                        <FactCompositionCard provenance={provenance}
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
                      <EvidenceRow fact={f} color={COULEUR} provenance={provenance} />
                      <MethodDetails conventions={conventions} checks={factChecks(f)} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
