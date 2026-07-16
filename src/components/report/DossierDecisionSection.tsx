// Rendu déterministe du dossier de décision (« En une minute »), dans le langage visuel de futur•e :
// eyebrow mono, Instrument Serif, cartes glass à filet accent (comme les modules du hub), verdict
// calme coloré par l'état, preuves en chips. Présentationnel : reçoit un Dossier déjà assemblé,
// aucun LLM. Ouvert à tous les payants : le cas creux reste digne.
import Link from "next/link";
import { Suspense } from "react";
import type { Dossier, DecisionFact } from "@/lib/decision/decision-fact";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
import { ConclusionRedigee } from "@/components/report/ConclusionRedigee";

const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--red)",
  compromises: "var(--orange)",
  unknowns: "var(--amethyst)",
  verifications: "var(--info)",
};

// Le DÉCOMPTE des réserves a quitté la conclusion : il y doublait les cartes situées juste dessous.
// Il n'a PAS été déplacé au-dessus d'elles pour autant : l'écran a montré qu'un intertitre « Les 4
// points à examiner avant de vous engager » répétait mot pour mot le titre de la section qui suit
// (« À examiner avant de vous engager »). Le décompte a simplement disparu : les cartes sont là, le
// lecteur les compte, et le verdict dit ce que le décompte ne dit pas (combien sont STRUCTURANTS).

function Chip({ label, value, href, color }: { label: string; value?: string; href?: string; color: string }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] uppercase rounded-md border border-white/[0.1] px-2 py-1 text-ghost">
      {label}
      {value ? <span style={{ color }}>· {value}</span> : null}
    </span>
  );
  return href ? (
    <Link href={href} className="no-underline hover:opacity-80 transition-opacity">{inner}</Link>
  ) : (
    inner
  );
}

function EvidenceRow({ fact, color }: { fact: DecisionFact; color: string }) {
  const refs = fact.role === "compromise" ? fact.sides.flatMap((s) => s.evidence) : fact.evidence;
  const action = fact.role === "verification" || fact.role === "unknown" ? fact.action : undefined;
  return (
    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
      {refs.map((e, i) => (
        <Chip key={i} label={e.href ? "Preuve" : e.label} value={e.observedValue} href={e.href} color={color} />
      ))}
      {action ? (
        <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{action.label} →</span>
      ) : null}
    </div>
  );
}

const GRAIN_LABEL: Record<string, string> = { commune: "À l'échelle de la commune", adresse: "À cette adresse", secteur: "Dans le secteur" };
function factGrain(fact: DecisionFact): string | null {
  const e = fact.role === "compromise" ? fact.sides[0]?.evidence[0] : fact.evidence[0];
  return e ? GRAIN_LABEL[e.grain] ?? null : null;
}

function FactBody({ fact }: { fact: DecisionFact }) {
  if (fact.role === "compromise") {
    return (
      <>
        <p className="text-label text-[14px] leading-[1.6]">{fact.statement}</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {fact.sides.map((s, i) => (
            <li key={i} className="text-muted text-[13px] leading-[1.55] pl-3 border-l border-white/[0.12]">{s.statement}</li>
          ))}
        </ul>
      </>
    );
  }
  // `mismatch` porte aussi une `limitation` (named_absence, absolute_measure, ensoleillement) : elle était
  // silencieusement jetée. La conclusion ne la reçoit pas (card-only) ; la carte, si.
  const limitation =
    fact.role === "incompatibility" || fact.role === "verification" || fact.role === "mismatch"
      ? fact.limitation
      : undefined;
  return (
    <>
      <p className="text-label text-[14px] leading-[1.6]">{fact.statement}</p>
      {limitation ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{limitation}</p> : null}
    </>
  );
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

  return (
    <section className="mt-14" id="dossier-decision">
      <div className="mb-7 max-w-[640px]">
        <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          En une minute
        </div>
        <h2 className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.12] tracking-[-0.6px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {dossier.narrativePlan.communeNom}, au regard de votre projet.
        </h2>
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
        <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} />
      ) : (
        <Suspense
          fallback={
            <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} />
          }
        >
          <ConclusionRedigee plan={dossier.narrativePlan} insee={insee} scopeKey={scopeKey} />
        </Suspense>
      )}

      {/* Les raisons, dans l'idiome des cartes-modules (filet accent en tête) */}
      <div className="grid gap-3.5">
        {dossier.sections.map((s) => {
          const col = SECTION_ACCENT[s.key] ?? "var(--amethyst)";
          return (
            <div key={s.key} className="glass rounded-xl p-6" style={{ borderTop: `2px solid ${col}` }}>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase mb-4" style={{ color: col }}>
                <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                {s.title}
              </div>
              <ul className="flex flex-col gap-5">
                {s.cards.map((card) => {
                  if (card.kind === "composition") return null; {/* rendu Task 5 (FactCompositionCard) */}
                  const f = card.fact;
                  const grain = factGrain(f);
                  return (
                    <li key={f.id}>
                      {grain ? <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-ghost mb-1">{grain}</p> : null}
                      <FactBody fact={f} />
                      <EvidenceRow fact={f} color={col} />
                    </li>
                  );
                })}
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
