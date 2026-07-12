// Rendu déterministe du dossier de décision (« En une minute »). Présentationnel : reçoit un Dossier
// déjà assemblé. Pas de LLM. Ouvert à tous les payants : le cas creux reste digne (conclusion honnête
// + contraintes non couvertes nommées + CTA adresse).
import Link from "next/link";
import type { Dossier, DecisionFact } from "@/lib/decision/decision-fact";

const SECTION_ACCENT: Record<string, string> = {
  incompatibilities: "var(--red)",
  compromises: "var(--orange)",
  unknowns: "var(--violet)",
  verifications: "var(--blue)",
};

function EvidenceLine({ fact, color }: { fact: DecisionFact; color: string }) {
  const refs = fact.role === "compromise" ? fact.sides.flatMap((s) => s.evidence) : fact.evidence;
  const action = fact.role === "verification" || fact.role === "unknown" ? fact.action : undefined;
  return (
    <div className="flex items-center gap-3 mt-2 flex-wrap">
      {refs.map((e, i) => {
        const text = e.observedValue ? `${e.label} · ${e.observedValue}` : e.label;
        return e.href ? (
          <Link key={i} href={e.href} className="font-mono text-[10px] tracking-[0.06em] uppercase no-underline" style={{ color }}>
            Voir la preuve · {text}
          </Link>
        ) : (
          <span key={i} className="font-mono text-[10px] tracking-[0.06em] uppercase text-ghost">{text}</span>
        );
      })}
      {action ? <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{action.label}</span> : null}
    </div>
  );
}

function FactBody({ fact }: { fact: DecisionFact }) {
  if (fact.role === "compromise") {
    return (
      <>
        <p className="text-label">{fact.statement}</p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {fact.sides.map((s, i) => (
            <li key={i} className="text-muted text-[13px]">{s.statement}</li>
          ))}
        </ul>
      </>
    );
  }
  const limitation = fact.role === "incompatibility" || fact.role === "verification" ? fact.limitation : undefined;
  return (
    <>
      <p className="text-label">{fact.statement}</p>
      {limitation ? <p className="text-muted text-[13px] mt-1">{limitation}</p> : null}
    </>
  );
}

export function DossierDecisionSection({ dossier }: { dossier: Dossier }) {
  const structured = dossier.conclusionState !== "project_not_structured";
  return (
    <section className="mt-12" id="dossier-decision">
      <div className="mb-6 max-w-[640px]">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">En une minute</p>
        <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Ce lieu, au regard de votre projet.
        </h2>
      </div>

      <div className="glass rounded-2xl p-7 mb-4">
        <p className="text-[17px] leading-[1.7] text-label">{dossier.conclusion}</p>
      </div>

      <div className="flex flex-col gap-3.5">
        {dossier.sections.map((s) => {
          const col = SECTION_ACCENT[s.key] ?? "var(--violet)";
          return (
            <div key={s.key} className="glass rounded-xl p-6" style={{ borderLeft: `2px solid ${col}` }}>
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase mb-3.5" style={{ color: col }}>{s.title}</p>
              <ul className="flex flex-col gap-4">
                {s.facts.map((f) => (
                  <li key={f.id} className="text-[14px] leading-[1.65]">
                    <FactBody fact={f} />
                    <EvidenceLine fact={f} color={col} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {dossier.uncovered.length > 0 ? (
        <p className="text-[13px] text-muted mt-4">
          Non encore examiné à ce grain : {dossier.uncovered.map((u) => u.label).join(", ")}.
        </p>
      ) : null}

      {structured ? (
        <div className="mt-5">
          <Link href="/rapport/logement" className="inline-flex flex-col gap-1 px-6 py-4 rounded-xl no-underline border border-white/[0.1] bg-white/[0.03]">
            <span className="text-[14px] font-semibold text-label">Affiner avec une adresse</span>
            <span className="text-[13px] text-muted">Vérifiez le bâtiment, les risques localisés, les contraintes réglementaires et l&apos;environnement immédiat.</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
