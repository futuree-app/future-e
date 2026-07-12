// Rendu déterministe du dossier de décision (« En une minute »), dans le langage visuel de futur•e :
// eyebrow mono, Instrument Serif, cartes glass à filet accent (comme les modules du hub), verdict
// calme coloré par l'état, preuves en chips. Présentationnel : reçoit un Dossier déjà assemblé,
// aucun LLM. Ouvert à tous les payants : le cas creux reste digne.
import Link from "next/link";
import type { Dossier, DecisionFact, ConclusionState } from "@/lib/decision/decision-fact";

const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--red)",
  compromises: "var(--orange)",
  unknowns: "var(--amethyst)",
  verifications: "var(--info)",
};

// Le verdict : une couleur et un court libellé d'état, calmes (structure = information).
const STATE_META: Record<ConclusionState, { color: string; label: string }> = {
  established_incompatibility: { color: "var(--red)", label: "Un point de blocage" },
  no_incompatibility_established: { color: "var(--accent)", label: "Aucun blocage établi" },
  no_hard_constraint_declared: { color: "var(--accent)", label: "Aucun blocage établi" },
  insufficient_evidence: { color: "var(--ghost)", label: "Lecture incomplète" },
  project_not_structured: { color: "var(--ghost)", label: "À préciser" },
};

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
  const limitation = fact.role === "incompatibility" || fact.role === "verification" ? fact.limitation : undefined;
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
}: {
  dossier: Dossier;
  // Analyse logement déjà sauvegardée pour cette commune (adresse renseignée), ou null.
  logement?: { href: string; label: string } | null;
}) {
  const structured = dossier.conclusionState !== "project_not_structured";
  const state = STATE_META[dossier.conclusionState];

  return (
    <section className="mt-14" id="dossier-decision">
      <div className="mb-7 max-w-[640px]">
        <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          En une minute
        </div>
        <h2 className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.12] tracking-[-0.6px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Ce lieu, au regard de votre projet.
        </h2>
      </div>

      {/* Le verdict : carte glass, filet d'état à gauche, libellé d'état mono */}
      <div className="glass rounded-2xl p-7 mb-3.5" style={{ borderLeft: `2px solid ${state.color}` }}>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2.5" style={{ color: state.color }}>
          {state.label}
        </p>
        <p className="text-[18px] leading-[1.6] text-label">{dossier.conclusion}</p>
      </div>

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
                {s.facts.map((f) => (
                  <li key={f.id}>
                    <FactBody fact={f} />
                    <EvidenceRow fact={f} color={col} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {dossier.uncovered.length > 0 ? (
        <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost shrink-0">Non encore examiné</span>
          <span className="text-[13px] text-muted">{dossier.uncovered.map((u) => u.label).join(", ")}.</span>
        </div>
      ) : null}

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
