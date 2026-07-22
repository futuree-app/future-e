// Les BRIQUES de rendu d'un fait de décision (chips de preuve, corps, action, dépliable méthode),
// partagées entre la carte élémentaire (DossierDecisionSection) et la carte composée
// (FactCompositionCard). Les deux cartes dépendent des briques, jamais l'inverse : aucune boucle d'import.
import Link from "next/link";
import type { DecisionFact, VerificationActionType } from "@/lib/decision/decision-fact";

export function Chip({ label, value, href, color }: { label: string; value?: string; href?: string; color: string }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] uppercase rounded-md border border-white/[0.1] px-2 py-1 text-ghost">
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

// LE GESTE A UNE NATURE, ET ELLE SE VOIT. `VerificationActionType` distingue quatre gestes depuis le
// premier jour ; l'écran les rendait tous par la même flèche. Un trait par nature dit, avant même la
// lecture, si le lecteur devra regarder de ses yeux, obtenir un document, faire confirmer, ou
// compléter son projet ici. Ce n'est pas une décoration : c'est le seul champ de l'action que la
// prose ne porte pas.
const ACTION_GLYPH: Record<VerificationActionType, string> = {
  // un œil : ce qui se constate de ses yeux, sur place
  verifier_sur_place: "M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z M9.8 8a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z",
  // une feuille cornée : ce qui s'obtient auprès d'un tiers
  obtenir_document: "M4 1.8h5l3 3v9.4H4V1.8Z M9 1.8v3h3",
  // une question posée : ce qui se demande à quelqu'un
  demander_confirmation: "M5.7 5.7a2.3 2.3 0 1 1 3.1 2.2c-.5.2-.8.6-.8 1.1v.4 M8 12.3h.01",
  // une flèche : ce qui se complète dans le produit
  renseigner_adresse: "M2.5 8h10 M8.8 4.3 13 8l-4.2 3.7",
};

// Le REPÈRE d'action : à mener, jamais établi. Il vit sur SA propre ligne, et il est passé du mono à
// la fonte de lecture : c'est une phrase adressée au lecteur, la plus actionnable de la carte, et le
// mono en faisait la moins lisible — une étiquette de données parmi les étiquettes de données. Le
// TEXTE vient des règles (éditorial), on n'y touche pas.
export function ActionCue({ label, color, type }: { label: string; color: string; type?: VerificationActionType }) {
  return (
    <p className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-muted">
      <svg
        viewBox="0 0 16 16" width="15" height="15" aria-hidden focusable="false"
        className="shrink-0 mt-[3px]"
        fill="none" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d={ACTION_GLYPH[type ?? "renseigner_adresse"]} />
      </svg>
      <span>{label}</span>
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
      {action ? <ActionCue label={action.label} color={color} type={action.type} /> : null}
    </div>
  );
}

// La convention de signalement (« futur•e signale cette exposition à partir de… ») a quitté la face :
// deux lignes ghost par carte faisaient le « pâté ». Elle vit ici, à un clic, dans un dépliable
// discret réutilisant le style du `<details>` des cartes composées. Rien ne disparaît.
// Déclaré HORS du composant : une fonction-composant créée pendant le rendu est recréée à chaque
// passe, et React la traite comme un type différent (elle perdrait son état, et eslint le refuse).
function MethodZone({ titre, lignes }: { titre: string; lignes: string[] }) {
  if (lignes.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-ghost">{titre}</p>
      {lignes.map((c, i) => (
        <p key={i} className="text-ghost text-[13px] leading-[1.5]">{c}</p>
      ))}
    </div>
  );
}

// DEUX ZONES NOMMÉES, parce que deux natures. « À vérifier » dit ce que le lecteur va REGARDER dans le
// monde ; « Méthode du signal » dit pourquoi futur•e signale ce point et ce que la mesure ne dit pas.
// Les mélanger en une liste indifférenciée obligeait à deviner, à chaque ligne, si on lisait une
// consigne ou une convention de produit. Le dépliable ne s'ouvre que s'il a quelque chose à montrer.
export function MethodDetails({ conventions, checks = [] }: { conventions: string[]; checks?: string[] }) {
  const uniq = (xs: string[]) => {
    const seen = new Set<string>();
    return xs.filter((c) => c && !seen.has(c) && seen.add(c));
  };
  const aVerifier = uniq(checks);
  const methode = uniq(conventions);
  if (aVerifier.length === 0 && methode.length === 0) return null;
  return (
    <details className="mt-2.5">
      <summary className="cursor-pointer font-mono text-[11px] tracking-[0.06em] uppercase text-muted hover:text-label transition-colors">
        Méthode et détails
      </summary>
      <div className="mt-2 flex flex-col gap-3 pl-3 border-l border-white/[0.08]">
        <MethodZone titre="À vérifier" lignes={aVerifier} />
        <MethodZone titre="Méthode du signal" lignes={methode} />
      </div>
    </details>
  );
}

// Ce que la carte a de concret à faire regarder : le `detail` de l'action, jamais son `label` (déjà
// sur la face). Une composition porte les actions de ses côtés ou de ses items.
export function factChecks(fact: DecisionFact): string[] {
  const action = fact.role === "verification" || fact.role === "unknown" ? fact.action : undefined;
  return action?.detail ? [action.detail] : [];
}

export function FactBody({ fact }: { fact: DecisionFact }) {
  if (fact.role === "compromise") {
    return (
      <>
        <p className="text-label text-[15px] leading-[1.6]">{fact.statement}</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {fact.sides.map((s, i) => (
            <li key={i} className="text-muted text-[15px] leading-[1.55] pl-3 border-l border-white/[0.12]">{s.statement}</li>
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
      <p className="text-label text-[15px] leading-[1.6]">{fact.statement}</p>
      {limitation ? <p className="text-muted/85 text-[13px] leading-[1.55] mt-1.5">{limitation}</p> : null}
    </>
  );
}
