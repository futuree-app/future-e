// Les BRIQUES de rendu d'un fait de décision (chips de preuve, corps, action), partagées entre la
// carte élémentaire (DossierDecisionSection) et la carte composée (FactCompositionCard). Les deux
// cartes dépendent des briques, jamais l'inverse : aucune boucle d'import.
import Link from "next/link";
import type { DecisionFact } from "@/lib/decision/decision-fact";

export function Chip({ label, value, href, color }: { label: string; value?: string; href?: string; color: string }) {
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

export function EvidenceRow({ fact, color }: { fact: DecisionFact; color: string }) {
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

export function FactBody({ fact }: { fact: DecisionFact }) {
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
  // POURQUOI futur•e signale ce fait (convention de seuil). Ligne discrète, distincte de la limitation :
  // deux natures, deux lignes, jamais fondues dans le constat.
  const signalConvention = fact.role === "verification" ? fact.signalConvention : undefined;
  return (
    <>
      <p className="text-label text-[14px] leading-[1.6]">{fact.statement}</p>
      {limitation ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{limitation}</p> : null}
      {signalConvention ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{signalConvention}</p> : null}
    </>
  );
}
