// Les BRIQUES de rendu d'un fait de décision (chips de preuve, corps, action, dépliable méthode),
// partagées entre la carte élémentaire (DossierDecisionSection) et la carte composée
// (FactCompositionCard). Les deux cartes dépendent des briques, jamais l'inverse : aucune boucle d'import.
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

// Le REPÈRE d'action : à mener, jamais établi. Il vit sur SA propre ligne (plus dans la rangée des
// preuves) et se lit comme un pointeur, plus comme un second paragraphe pleine largeur en capitales
// qui rivalise avec le constat : casse basse, flèche colorée de l'état en tête. Le TEXTE du label
// vient des règles (éditorial), on n'y touche pas, seule la présentation change.
export function ActionCue({ label, color }: { label: string; color: string }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.03em] text-muted leading-[1.5]">
      <span aria-hidden style={{ color }} className="mr-1">→</span>
      {label}
    </p>
  );
}

// DEUX PREUVES QUI SE RENDENT PAREIL N'EN FONT QU'UNE. Les références sont dédupliquées en amont sur
// leur LABEL (« Département · Toulouse »), mais l'affichage remplace ce label par « Preuve » dès qu'il
// y a une valeur et une source : deux observations distinctes portant la même valeur devenaient deux
// chips identiques (« Preuve · dans l'agglomération de Lyon » deux fois, vu à l'écran). On déduplique
// donc sur ce qui est RÉELLEMENT RENDU, pas sur ce qui le produit.
//
// Une référence SANS valeur mesurée (un simple lien vers sa source) ne se fait pas passer pour
// l'étiquette « Preuve » : elle porte le libellé de sa source. « Preuve · valeur » reste réservé à une
// preuve établie, chiffrée.
function toChips(refs: { label: string; observedValue?: string; href?: string }[]) {
  const seen = new Set<string>();
  const out: { label: string; value?: string; href?: string }[] = [];
  for (const e of refs) {
    // SANS VALEUR MESURÉE, PAS DE PASTILLE (doctrine du lot A). Une référence qui ne porte que le nom
    // de sa source n'établit rien : elle descend dans « Méthode et détails » (cf. factSources). Les
    // cartes du logement affichaient ainsi l'adresse du lecteur quatre fois sur le même écran, sous
    // un intertitre qui disait déjà « À cette adresse ».
    if (!e.observedValue) continue;
    const label = e.href ? "Preuve" : e.label;
    const cle = `${label}|${e.observedValue}|${e.href ?? ""}`;
    if (seen.has(cle)) continue;
    seen.add(cle);
    out.push({ label, value: e.observedValue, href: e.href });
  }
  return out;
}

// LES SOURCES SANS VALEUR, pour le dépliable. Dédupliquées : quatre cartes de la même adresse ne
// répètent pas quatre fois d'où vient la donnée.
export function factSources(fact: DecisionFact): string[] {
  const refs = fact.role === "compromise" ? fact.sides.flatMap((s) => s.evidence) : fact.evidence;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of refs) {
    if (e.observedValue || seen.has(e.label)) continue;
    seen.add(e.label);
    out.push(`Source : ${e.label}`);
  }
  return out;
}

export function EvidenceRow({ fact, color }: { fact: DecisionFact; color: string }) {
  const refs = fact.role === "compromise" ? fact.sides.flatMap((s) => s.evidence) : fact.evidence;
  const chips = toChips(refs);
  const action = fact.role === "verification" || fact.role === "unknown" ? fact.action : undefined;
  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {chips.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          {chips.map((c, i) => (
            <Chip key={i} label={c.label} value={c.value} href={c.href} color={color} />
          ))}
        </div>
      ) : null}
      {action ? <ActionCue label={action.label} color={color} /> : null}
    </div>
  );
}

// La convention de signalement (« futur•e signale cette exposition à partir de… ») a quitté la face :
// deux lignes ghost par carte faisaient le « pâté ». Elle vit ici, à un clic, dans un dépliable
// discret réutilisant le style du `<details>` des cartes composées. Rien ne disparaît.
export function MethodDetails({ conventions }: { conventions: string[] }) {
  const seen = new Set<string>();
  const uniq = conventions.filter((c) => c && !seen.has(c) && seen.add(c));
  if (uniq.length === 0) return null;
  return (
    <details className="mt-2.5">
      <summary className="cursor-pointer font-mono text-[10px] tracking-[0.06em] uppercase text-muted hover:text-label transition-colors">
        Méthode et détails
      </summary>
      <div className="mt-2 flex flex-col gap-1.5 pl-3 border-l border-white/[0.08]">
        {uniq.map((c, i) => (
          <p key={i} className="text-ghost text-[12px] leading-[1.5]">{c}</p>
        ))}
      </div>
    </details>
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
  // La face garde le constat et UNE ligne ghost (la limitation). `signalConvention` est désormais rendu
  // par MethodDetails, à côté de FactBody (voir les appelants), plus sur la face.
  return (
    <>
      <p className="text-label text-[14px] leading-[1.6]">{fact.statement}</p>
      {limitation ? <p className="text-ghost text-[12.5px] leading-[1.5] mt-1">{limitation}</p> : null}
    </>
  );
}
