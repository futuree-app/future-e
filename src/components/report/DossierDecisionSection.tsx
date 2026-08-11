// Rendu déterministe du dossier de décision (« En une minute »), dans le langage visuel de futur•e :
// eyebrow mono, Instrument Serif, cartes glass à filet accent (comme les modules du hub), verdict
// calme coloré par l'état, preuves en chips. Présentationnel : reçoit un Dossier déjà assemblé,
// aucun LLM. Ouvert à tous les payants : le cas creux reste digne.
import Link from "next/link";
import { Fragment, Suspense } from "react";
import type { Dossier, DecisionFact, DossierCard } from "@/lib/decision/decision-fact";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
import { conditionPorteeParLeBloc, sectionsDeLaMinute, ancresRendues, sectionHorsPriorites, sectionMixte, carteHorsPriorites } from "@/lib/decision/dossier-view";
import { ConclusionRedigee } from "@/components/report/ConclusionRedigee";
import { FactBody, EvidenceRow, MethodDetails, factSources, factChecks } from "@/components/report/DecisionFactRenderParts";
import { FactCompositionCard } from "@/components/report/FactCompositionCard";
import { dossierAnchorId } from "@/lib/decision/dossier-anchors";
import { dateFr } from "@/lib/decision/autour-permis";

// LES SIX REGISTRES DE DÉCISION DE LA CHARTE v1.7 (branchés le 04/08/2026). Chaque section du
// dossier est l'un des six registres nommés par la charte, et porte sa teinte.
//
// Deux d'entre eux ne disaient pas ce que la charte dit, et le changement porte du sens :
//
// — L'ÉCART (`mismatches`) passe du jaune au VIOLET. Le raisonnement qui l'avait mis en jaune le
//   30/07 tient toujours : un mismatch n'est pas une incompatibilité moins grave, c'est une NATURE
//   différente (« établi, non éliminatoire, à ARBITRER », sans contrepartie), et une gradation
//   rouge → orange aurait suggéré une échelle de gravité, donc un score, que l'ADR-0001 interdit.
//   Le violet n'est pas davantage un rouge atténué : il satisfait la même exigence, et il est la
//   teinte que la charte donne à ce registre.
//
// — LE NON SU (`unknowns`) quitte l'améthyste pour un GRIS NEUTRE. C'est l'arbitrage explicite de la
//   charte : un statut inconnu ne reçoit AUCUNE valence. L'améthyste en portait une, et peignait
//   « nous n'avons pas pu lire cette donnée ici » dans la même famille qu'un constat établi.
//
// Une seule table au lieu de deux : les teintes de la charte tiennent de 5,5:1 à 11,1:1 sur les
// deux fonds de chaque thème, donc la même valeur porte le texte et la pastille. C'est le couple
// vif/texte des couleurs génériques qui existait parce qu'elles échouaient sur le fond crème.
const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--reg-incompatibilite)",
  alignments: "var(--reg-alignement)",
  mismatches: "var(--reg-ecart)",
  compromises: "var(--reg-compromis)",
  unknowns: "var(--reg-non-su)",
  verifications: "var(--reg-controle)",
};

const SECTION_INK: Record<string, string> = SECTION_ACCENT;

const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// D'OÙ VIENT CE QU'ON MONTRE. Trois sections répondent aux critères du lecteur : ses conditions non
// négociables, ce qui correspond moins bien, ce qui départage. Deux ne répondent à rien qu'il ait
// demandé : les constats établis sur le lieu, et ce qu'on n'a pas pu lire. C'est là toute la valeur
// du dossier — il apporte ce que personne n'aurait pensé à chercher — mais rien ne le disait, et un
// lecteur venu pour « une ville moyenne » découvrait un sol argileux sans comprendre pourquoi.
//
// Une ligne, sous le titre, seulement sur ces deux sections.
const SECTION_INTRO: Record<string, string> = {
  verifications: "Au-delà de vos priorités, ces constats sont établis pour ce lieu.",
  unknowns: "Au-delà de vos priorités, ces données n'ont pas encore pu être lues ici.",
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
// UNE COMPOSITION A UN GRAIN, comme tout ce qu'elle regroupe. Le code disait « les cartes composées
// n'ont pas de grain propre » : c'était faux, et ça créait TROIS catégories là où il y en a deux (le
// bloc composé flottait au-dessus de l'organisation par grain). Il vient de ses faits absorbés, qui
// partagent le même grain par construction du patron. Sans absorbé rendu, on retombe sur la preuve
// que la composition porte elle-même.
function cardGrain(card: DossierCard, absorbedOf: (c: DossierCard) => DecisionFact[]): string | null {
  if (card.kind === "fact") return factGrain(card.fact);
  const first = absorbedOf(card)[0];
  return first ? factGrain(first) : null;
}

export function DossierDecisionSection({
  dossier,
  logement,
  logementStatus = "none",
  insee,
  scopeKey,
  provenance,
  generatedAt,
}: {
  dossier: Dossier;
  /**
   * La date de génération de l'artefact, quand le dossier affiché en vient un.
   *
   * ABSENTE POUR UN DOSSIER RÉASSEMBLÉ, et il ne faut surtout pas la remplacer par « aujourd'hui » :
   * une lecture recalculée à l'instant n'a pas d'âge, et la dater ferait croire à un figement qui
   * n'a pas eu lieu. C'est précisément la confusion que ce lot supprime.
   */
  generatedAt?: string | null;
  // Analyse logement déjà sauvegardée pour cette commune (adresse renseignée), ou null.
  logement?: { href: string; label: string } | null;
  // Slice 1.5 : état de l'augmentation adresse en couche de rendu (pas un état de l'assembleur).
  logementStatus?: "none" | "pending" | "done" | "unavailable";
  // Slice 2 : identité de l'artefact narratif. scopeKey = "commune" | "logement:<id>".
  insee: string;
  scopeKey: string;
  /**
   * L'IDENTITÉ DE L'ARTEFACT SERVI, quand le dossier en vient un. Distincte de `scopeKey`, qui
   * désigne la vue et vaut aussi pour un dossier assemblé à l'instant : un lien de preuve ne doit
   * désigner une version figée que s'il en existe une. Portée par les liens « Preuve »
   * (cf. `evidenceHref`), pour que la surface d'arrivée réaffiche LA donnée vendue.
   */
  provenance?: string;
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
  // LA MINUTE EST UNE SÉLECTION, pas un dossier raccourci : un plafond GLOBAL de cinq cartes, trié par
  // ce qui explique le verdict, avec une place réservée au contrepoids quand le dossier arbitre. Le
  // dossier complet (toutes les cartes) reste dans `dossier.sections`, et ses CONTRÔLES se lisent
  // juste en dessous, dans `ControlesDuDossier` : le verdict annonce leur nombre, il fallait donc
  // qu'ils aient une surface. Les cinq autres registres n'en ont pas encore, et gardent leur
  // plafond de section.
  const sections = sectionsDeLaMinute(dossier);
  // Les cartes que CETTE section rend : la ligne « À contrôler en priorité » n'active un renvoi que
  // vers l'une d'elles. Le plan ne peut pas le savoir — il ignore les masquages d'affichage.
  const renderedIds = ancresRendues(dossier);

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
        {/* LA DATE DE LA DÉCISION, ET C'EST TOUT L'ENJEU DU LOT (05/08/2026).
            Le dossier se réécrivait à chaque ouverture sans que rien ne le dise. Il est maintenant
            figé au jour de l'achat, et cette ligne est la seule chose qui rende ce figement VISIBLE.
            Sans elle, le lecteur ne saurait toujours pas ce qu'il lit, et le lot n'aurait corrigé
            qu'une moitié du défaut.

            Elle ne s'affiche que quand un artefact existe : l'inventer pour un dossier réassemblé à
            l'instant daterait d'aujourd'hui une lecture qui n'a pas d'âge. */}
        {generatedAt && dateFr(generatedAt) ? (
          <p className="mt-2 font-mono text-[11px] text-ghost">
            Analyse générée le {dateFr(generatedAt)}
          </p>
        ) : null}
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
        <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} condition={conditionEvidence} renderedIds={renderedIds} />
      ) : (
        <Suspense
          fallback={
            <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} condition={conditionEvidence} renderedIds={renderedIds} />
          }
        >
          <ConclusionRedigee plan={dossier.narrativePlan} insee={insee} scopeKey={scopeKey} condition={conditionEvidence} renderedIds={renderedIds} />
        </Suspense>
      )}

      {/* Les raisons : des pièces à examiner, dans un verre neutre. Leur couleur de section vit dans
          la pastille du titre, plus dans un filet qui rivalisait avec la réponse. */}
      <div className="grid gap-3.5">
        {sections.map((s) => {
          // Le repli est le registre du NON SU, jamais une teinte de constat : une section dont la
          // clé n'est pas connue de cette table est, par définition, quelque chose qu'on ne sait pas
          // qualifier. C'est exactement ce que le gris neutre dit.
          const col = SECTION_ACCENT[s.key] ?? "var(--reg-non-su)";
          const ink = SECTION_INK[s.key] ?? "var(--reg-non-su)";

          // CE QUI CORRESPOND (alignments) : une carte GROUPÉE, courte. Un point fort n'appelle aucune
          // action, donc pas la structure complète d'une carte de problème — deux lignes suffisent :
          // le TITRE (la priorité, en mini-titre) puis la PHRASE DE RANG. Le grain n'est montré qu'UNE
          // fois, en intertitre, et SEULEMENT si toutes les lignes le partagent (sinon omis) : à ce
          // grain unique répond un sous-titre unique, pas une répétition par ligne.
          if (s.key === "alignments") {
            const grains = s.cards.map((c) => (c.kind === "fact" ? factGrain(c.fact) : null));
            const partages = new Set(grains.filter(Boolean));
            const grainCommun = partages.size === 1 ? [...partages][0]! : null;
            return (
              <div key={s.key} className="glass rounded-xl p-5 sm:p-6">
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: ink }}>
                  <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                  {s.title}
                </div>
                {grainCommun ? (
                  <p className="text-[13px] leading-[1.5] text-ghost mb-4">{grainCommun}</p>
                ) : (
                  <div className="mb-2" />
                )}
                <ul className="flex flex-col gap-5">
                  {s.cards.map((card) => {
                    if (card.kind !== "fact" || card.fact.role !== "alignment") return null;
                    const f = card.fact;
                    // Deux champs (décision D1) : le TITRE (headlineSubject, rendu CAPITALISÉ via CSS) puis
                    // `faceStatement`, le fragment scannable que la RÈGLE a déjà produit (rang, catégorie de
                    // taille, distance mer). Le composant ne recalcule rien ; la phrase autonome du fait
                    // (statement) vit ailleurs (conclusion / export).
                    return (
                      <li key={f.id}>
                        <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-label mb-1">{cap(f.headlineSubject)}</p>
                        <p className="text-[15px] leading-[1.55] text-muted">{f.faceStatement}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }

          return (
            /* LE LISERÉ COLORÉ DE 2 px A ÉTÉ RENDU AU VERDICT. Il courait en tête de CHAQUE section :
               quatre traits vifs sous un bloc de réponse qui, lui, porte souvent un ton neutre (gris).
               L'œil allait aux pièces à examiner plutôt qu'à la réponse. La couleur de section
               survit là où elle suffit : la pastille en tête de titre, qui la porte déjà. */
            <div key={s.key} className="glass rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: ink }}>
                <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                {s.title}
              </div>
              {/* L'intro « Au-delà de vos priorités » ne s'affiche que si la section n'en porte
                  aucune : plusieurs règles y déposent des constats rattachés à une priorité déclarée
                  (inondation, air, bruit, industrie). Cf. sectionHorsPriorites. */}
              {SECTION_INTRO[s.key] && sectionHorsPriorites(dossier, s) ? (
                <p className="text-[13px] leading-[1.5] text-ghost mb-4">{SECTION_INTRO[s.key]}</p>
              ) : (
                <div className="mb-2" />
              )}
              {/* UN FILET ENTRE LES CONSTATS. Quatre constats s'enchaînaient dans la même carte,
                  séparés par un seul intertitre gris : on ne voyait pas où l'un finissait. Le filet
                  et l'air le disent, sans ajouter ni bordure ni fond (ce serait des cartes dans des
                  cartes). Il ne s'applique pas au premier élément ni aux intertitres de grain, qui
                  ouvrent un groupe au lieu de clore le précédent. */}
              <ul className="flex flex-col gap-6 [&>li:not(:first-child):not(.grain-header)]:border-t [&>li:not(:first-child):not(.grain-header)]:border-[var(--border-1)] [&>li:not(:first-child):not(.grain-header)]:pt-6">
                {(() => {
                  // Le grain (« À cette adresse » / « À l'échelle de la commune ») ne se répète plus sur
                  // chaque carte : il ne s'affiche QUE si la section MÉLANGE des grains, et alors comme un
                  // intertitre de groupe posé UNE fois, quand le grain change d'une carte à la suivante.
                  // Déterministe : aucun tri, l'ordre des cartes est préservé. Les compositions ont
                  // désormais un grain (cardGrain) et interrompent le suivi comme les autres cartes.
                  const absorbedOf = (c: DossierCard) =>
                    c.kind === "composition"
                      ? dossier.absorbedFacts.filter((f) => c.composition.absorbedFactIds.includes(f.id))
                      : [];
                  const grains = s.cards.map((c) => cardGrain(c, absorbedOf));
                  const showGrain = new Set(grains.filter(Boolean)).size > 1;
                  let prevGrain: string | null = null;
                  // DANS UNE SECTION MIXTE, chaque constat AMBIANT se signale lui-même. L'intro de
                  // section est tombée (elle mentirait pour la priorité qui cohabite ici), et sans elle
                  // rien n'explique pourquoi ce constat apparaît alors que le lecteur ne l'a pas demandé.
                  // Hors section mixte, l'intro suffit : pas d'étiquette redondante.
                  const marquerAmbiant = sectionMixte(dossier, s) ? carteHorsPriorites(dossier) : () => false;
                  return s.cards.map((card, i) => {
                    const grain = grains[i]!;
                    const grainHeader = showGrain && grain && grain !== prevGrain ? grain : null;
                    prevGrain = grain;
                    const grainLi = grainHeader ? (
                      <li className="grain-header list-none flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-muted -mb-3 pt-2 first:pt-0">
                        <span aria-hidden className="h-px w-4 bg-white/25 shrink-0" />
                        {grainHeader}
                      </li>
                    ) : null;
                    if (card.kind === "composition") {
                      return (
                        <Fragment key={card.composition.id}>
                          {grainLi}
                          <FactCompositionCard
                            provenance={provenance}
                            composition={card.composition}
                            color={col}
                            absorbedFacts={absorbedOf(card)}
                          />
                        </Fragment>
                      );
                    }
                    const f = card.fact;
                    // La convention de signalement ET la provenance descendent au même endroit : ce
                    // sont les deux choses qu'on veut pouvoir vérifier sans les lire à chaque carte.
                    const conventions = [
                      ...(f.role === "verification" && f.signalConvention ? [f.signalConvention] : []),
                      ...factSources(f),
                    ];
                    return (
                      <Fragment key={f.id}>
                        {grainLi}
                        {/* Même ancre que les compositions (cf. FactCompositionCard) : la ligne
                            « À contrôler en priorité » vise la carte qui porte l'action citée. */}
                        <li id={dossierAnchorId(f.id)} tabIndex={-1} className="scroll-mt-24 focus:outline-none">
                          {marquerAmbiant(card) ? (
                            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-ghost mb-1.5">
                              Au-delà de vos priorités
                            </p>
                          ) : null}
                          <FactBody fact={f} color={col} />
                          <EvidenceRow fact={f} color={col} provenance={provenance} />
                          <MethodDetails conventions={conventions} checks={factChecks(f)} />
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
            className="mt-5 group flex flex-wrap items-center justify-between gap-4 px-5 sm:px-6 py-4 rounded-xl no-underline border border-[var(--border-2)] bg-[var(--bg-elev)] hover:border-accent/40 hover:bg-[var(--bg-elev-2)] transition-colors"
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
            className="mt-5 group flex flex-wrap items-center justify-between gap-4 px-5 sm:px-6 py-4 rounded-xl no-underline border border-[var(--border-2)] bg-[var(--bg-elev)] hover:border-accent/40 hover:bg-[var(--bg-elev-2)] transition-colors"
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
