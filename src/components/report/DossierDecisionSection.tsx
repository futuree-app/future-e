// Rendu déterministe du dossier de décision (« En une minute »), dans le langage visuel de futur•e :
// eyebrow mono, Instrument Serif, cartes glass à filet accent (comme les modules du hub), verdict
// calme coloré par l'état, preuves en chips. Présentationnel : reçoit un Dossier déjà assemblé,
// aucun LLM. Ouvert à tous les payants : le cas creux reste digne.
import Link from "next/link";
import { Fragment, Suspense } from "react";
import type { Dossier, DecisionFact } from "@/lib/decision/decision-fact";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
import { conditionPorteeParLeBloc, sectionsAffichees } from "@/lib/decision/dossier-view";
import { ConclusionRedigee } from "@/components/report/ConclusionRedigee";
import { FactBody, EvidenceRow, MethodDetails, factSources } from "@/components/report/DecisionFactRenderParts";
import { FactCompositionCard } from "@/components/report/FactCompositionCard";

const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--red)",
  compromises: "var(--orange)",
  unknowns: "var(--amethyst)",
  verifications: "var(--info)",
};

// Le DÉCOMPTE des réserves a quitté la conclusion : il y doublait les cartes situées juste dessous.
// Il n'a PAS été déplacé au-dessus d'elles pour autant : l'écran a montré qu'un intertitre « Les 4
// points à examiner avant de vous engager » répétait mot pour mot le titre de la section qui suit
// (aujourd'hui « Ce qui est établi, à contrôler avant de vous engager »). Le décompte a simplement
// disparu : les cartes sont là, le
// lecteur les compte, et le verdict dit ce que le décompte ne dit pas (combien sont STRUCTURANTS).

// Chip / EvidenceRow / FactBody vivent dans DecisionFactRenderParts.tsx (partagées avec la carte
// composée). Le grain reste ici : c'est un fait de PRÉSENTATION de la carte élémentaire.
const GRAIN_LABEL: Record<string, string> = { commune: "À l'échelle de la commune", adresse: "À cette adresse", secteur: "Dans le secteur" };
function factGrain(fact: DecisionFact): string | null {
  const e = fact.role === "compromise" ? fact.sides[0]?.evidence[0] : fact.evidence[0];
  return e ? GRAIN_LABEL[e.grain] ?? null : null;
}

export function DossierDecisionSection({
  dossier,
  logement,
  logementStatus = "none",
  insee,
  scopeKey,
}: {
  dossier: Dossier;
  // Analyse logement déjà sauvegardée pour cette commune (adresse renseignée), ou null.
  logement?: { href: string; label: string } | null;
  // Slice 1.5 : état de l'augmentation adresse en couche de rendu (pas un état de l'assembleur).
  logementStatus?: "none" | "pending" | "done" | "unavailable";
  // Slice 2 : identité de l'artefact narratif. scopeKey = "commune" | "logement:<id>".
  insee: string;
  scopeKey: string;
}) {
  const structured = dossier.conclusionState !== "project_not_structured";

  // Une condition non remplie se LIT UNE FOIS : quand le bloc de tête la porte déjà entièrement, sa
  // section s'efface et sa preuve remonte dans le bloc. La règle et son « pourquoi » vivent dans
  // dossier-view.ts, où elles sont testables : ici on ne fait que la consommer.
  const conditionDuBloc = conditionPorteeParLeBloc(dossier);
  const conditionEvidence = conditionDuBloc
    ? {
        evidence: conditionDuBloc.evidence,
        ...(conditionDuBloc.limitation ? { limitation: conditionDuBloc.limitation } : {}),
      }
    : null;
  const sections = sectionsAffichees(dossier);

  return (
    <section className="mt-14" id="dossier-decision">
      {/* LARGEUR DE LECTURE : QUESTION OUVERTE. Une colonne de 860 px a été essayée puis retirée :
          la page entière fait 1044 px utiles, et rien d'autre ne partageait cette largeur, si bien que
          le bloc se lisait comme un élément mal aligné plutôt que comme une colonne éditoriale. La
          mesure de ligne reste trop longue sur desktop ; elle se réglera à l'échelle de la PAGE, pas
          de ce bloc seul. Seul le headline garde sa mesure propre (titre en espace ouvert). */}
      {/* Le titre « {Commune}, au regard de votre projet. » a disparu : le plus grand texte de l'écran
          était un cadrage sans réponse, posé au-dessus d'un verdict deux fois plus petit. Le nom de la
          commune est tissé dans le headline, qui porte désormais le <h2> de la section. */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          En une minute
        </div>
      </div>

      {logementStatus === "pending" ? (
        <div className="glass rounded-xl p-4 mb-3.5 flex items-center gap-3" style={{ borderLeft: "2px solid var(--info)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0 animate-pulse" />
          <p className="text-[13px] text-muted">Première lecture à l&apos;échelle de la commune. L&apos;analyse du logement et de son environnement immédiat est en cours.</p>
        </div>
      ) : null}
      {logementStatus === "unavailable" ? (
        <div className="glass rounded-xl p-4 mb-3.5" style={{ borderLeft: "2px solid var(--ghost)" }}>
          <p className="text-[13px] text-muted">L&apos;analyse réglementaire de cette adresse n&apos;a pas pu être actualisée. La conclusion ci-dessous reste limitée à la commune.</p>
        </div>
      ) : null}

      {/* Le verdict. En « pending », le dossier n'est PAS final (l'augmentation adresse arrive) :
          générer ici coûterait un second appel Sonnet, jeté quelques secondes plus tard. */}
      {logementStatus === "pending" ? (
        <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} condition={conditionEvidence} />
      ) : (
        <Suspense
          fallback={
            <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} condition={conditionEvidence} />
          }
        >
          <ConclusionRedigee plan={dossier.narrativePlan} insee={insee} scopeKey={scopeKey} condition={conditionEvidence} />
        </Suspense>
      )}

      {/* Les raisons, dans l'idiome des cartes-modules (filet accent en tête) */}
      <div className="grid gap-3.5">
        {sections.map((s) => {
          const col = SECTION_ACCENT[s.key] ?? "var(--amethyst)";
          return (
            <div key={s.key} className="glass rounded-xl p-6" style={{ borderTop: `2px solid ${col}` }}>
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase mb-4" style={{ color: col }}>
                <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                {s.title}
              </div>
              <ul className="flex flex-col gap-5">
                {(() => {
                  // Le grain (« À cette adresse » / « À l'échelle de la commune ») ne se répète plus sur
                  // chaque carte : il ne s'affiche QUE si la section MÉLANGE des grains, et alors comme un
                  // intertitre de groupe posé une fois, quand le grain change d'une carte élémentaire à la
                  // suivante. Déterministe et stable : aucun tri, l'ordre des cartes est préservé. Les
                  // cartes composées n'ont pas de grain propre, elles n'interrompent pas le suivi.
                  const elemGrains = s.cards
                    .filter((c): c is Extract<typeof c, { kind: "fact" }> => c.kind === "fact")
                    .map((c) => factGrain(c.fact));
                  const showGrain = new Set(elemGrains.filter(Boolean)).size > 1;
                  let prevGrain: string | null = null;
                  return s.cards.map((card) => {
                    if (card.kind === "composition") {
                      return (
                        <FactCompositionCard
                          key={card.composition.id}
                          composition={card.composition}
                          color={col}
                          absorbedFacts={dossier.absorbedFacts.filter((f) => card.composition.absorbedFactIds.includes(f.id))}
                        />
                      );
                    }
                    const f = card.fact;
                    const grain = factGrain(f);
                    const grainHeader = showGrain && grain && grain !== prevGrain ? grain : null;
                    prevGrain = grain;
                    // La convention de signalement ET la provenance descendent au même endroit : ce
                    // sont les deux choses qu'on veut pouvoir vérifier sans les lire à chaque carte.
                    const conventions = [
                      ...(f.role === "verification" && f.signalConvention ? [f.signalConvention] : []),
                      ...factSources(f),
                    ];
                    return (
                      <Fragment key={f.id}>
                        {grainHeader ? (
                          <li className="list-none font-mono text-[11px] tracking-[0.12em] uppercase text-ghost -mb-2 first:mt-0">{grainHeader}</li>
                        ) : null}
                        <li>
                          <FactBody fact={f} />
                          <EvidenceRow fact={f} color={col} />
                          <MethodDetails conventions={conventions} />
                        </li>
                      </Fragment>
                    );
                  });
                })()}
              </ul>
            </div>
          );
        })}
      </div>

      {/* La note « Non encore examiné » vivait ici, et disait une SECONDE fois ce que la conclusion
          dit déjà. Deux emplacements laissaient croire à deux niveaux de réserve distincts. Une
          contrainte dure non testée réduit la portée du verdict : elle se lit sous lui, dans « Limite
          de ce constat », pas trente centimètres plus bas. */}

      {structured ? (
        logement ? (
          <Link
            href={logement.href}
            className="mt-5 group flex items-center justify-between gap-4 px-6 py-4 rounded-xl no-underline border border-white/[0.1] bg-white/[0.02] hover:border-accent/40 hover:bg-white/[0.04] transition-colors"
          >
            <span className="flex flex-col gap-1">
              <span className="text-[14px] font-semibold text-label">Voir l&apos;analyse du logement</span>
              <span className="text-[13px] text-muted">{logement.label}</span>
            </span>
            <span aria-hidden className="font-mono text-[13px] text-accent transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        ) : (
          <Link
            href="/rapport/logement"
            className="mt-5 group flex items-center justify-between gap-4 px-6 py-4 rounded-xl no-underline border border-white/[0.1] bg-white/[0.02] hover:border-accent/40 hover:bg-white/[0.04] transition-colors"
          >
            <span className="flex flex-col gap-1">
              <span className="text-[14px] font-semibold text-label">Affiner avec une adresse</span>
              <span className="text-[13px] text-muted">Le bâtiment, les risques localisés, les contraintes réglementaires et l&apos;environnement immédiat.</span>
            </span>
            <span aria-hidden className="font-mono text-[13px] text-accent transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        )
      ) : null}
    </section>
  );
}
