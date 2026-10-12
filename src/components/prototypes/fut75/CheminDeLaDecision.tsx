"use client";

// FUT-75 · PROTOTYPE C · DU FAIT À LA DÉCISION. DEV UNIQUEMENT.
//
// Le chemin RÉEL d'un constat du moteur, sur un vrai dossier d'adresse (hôtel de ville de Nîmes, projet
// de test) : la composition « confort d'été ». Six étapes, dans l'ordre où le moteur les enchaîne :
//   1. ce que le lecteur a demandé (sa priorité déclarée, et son poids) ;
//   2. ce que la source établit (la projection DRIAS, à l'échelle de la commune, avec ses preuves) ;
//   3. la convention qui rend ce fait signalable (le seuil de futur•e, et la valeur face à lui) ;
//   4. ce que le dossier en conclut pour ce projet (la phrase du verdict) ;
//   5. ce que la donnée ne dit pas (sa limite) ;
//   6. ce qu'il reste à vérifier soi-même (le geste, au bâtiment).
//
// LA RELATION EST DESSINÉE, PAS RACONTÉE. Un rail à gauche relie les étapes : trois voies (projet, fait,
// convention) CONVERGENT vers la conclusion, puis s'en séparent vers la limite (pointillé : ce qui n'est
// pas connu) et le geste (trait plein : ce qui reste à faire). Au repos, le rail est entier et pâle ;
// le mouvement ne fait que le RETRACER à l'encre, d'un trait ou pas à pas.
//
// CE QUE LE PROTOTYPE S'INTERDIT. Le moteur ne relie aucune donnée du bâtiment (DPE, année de
// construction) à la chaleur : le bâtiment n'apparaît donc qu'à l'étape 6, comme le lieu de la
// vérification, jamais comme une donnée qui aurait pesé. Rien ne « calcule » sous les yeux du lecteur :
// la conclusion est en tête, lisible avant tout mouvement, et chaque preuve garde son lien.
import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { COURBES, DUREES, ETAPES_CHEMIN, etapesEclairees, etapeVoisine, type EtapeChemin, type ModeMouvement } from "./motion";
import m from "./motion.module.css";

export type DonneesChemin = {
  commune: string;
  verdict: { etiquette: string; titre: string };
  constat: { sujet: string; enonce: string };
  projet: { libelle: string; poids: number; poidsMax: number };
  fait: { enonce: string; grain: string; preuves: { libelle: string; valeur?: string; href?: string; date?: string }[] };
  convention: { horizon: number; mesures: { nom: string; valeur: number; seuil: number; unite: string; franchi: boolean }[]; methode: string[] };
  limite: string;
  geste: { libelle: string; aVerifier: string[] };
};
export type VarianteChemin = "trait" | "pas" | "statique";

const NOMS: Record<EtapeChemin, string> = {
  projet: "Ce que vous avez demandé",
  fait: "Ce que la source établit",
  convention: "La convention appliquée",
  interpretation: "Ce que le dossier en conclut pour votre projet",
  limite: "Ce que la donnée ne dit pas",
  geste: "Ce qu'il reste à vérifier",
};
// Les voies du rail : une abscisse par fondement, qui converge vers le centre à la conclusion.
const X = { gauche: 12, centre: 24, droite: 36 } as const;

type Voie = { etape: EtapeChemin; d: string; nature: "fondement" | "limite" | "geste" };

function voies(y: Record<EtapeChemin, number>): Voie[] {
  const yc = y.interpretation;
  const courbe = (x: number) => `M${x} ${y[x === X.gauche ? "projet" : "convention"]} V${yc - 18} Q${x} ${yc - 4} ${X.centre} ${yc}`;
  return [
    { etape: "projet", d: courbe(X.gauche), nature: "fondement" },
    { etape: "fait", d: `M${X.centre} ${y.fait} V${yc}`, nature: "fondement" },
    { etape: "convention", d: courbe(X.droite), nature: "fondement" },
    { etape: "limite", d: `M${X.centre} ${yc} Q${X.gauche} ${yc + 4} ${X.gauche} ${yc + 22} V${y.limite}`, nature: "limite" },
    { etape: "geste", d: `M${X.centre} ${yc} Q${X.droite} ${yc + 4} ${X.droite} ${yc + 22} V${y.geste}`, nature: "geste" },
  ];
}

function Borne({ etape, eclairee }: { etape: EtapeChemin; eclairee: boolean }) {
  const c = eclairee ? "var(--r-encre)" : "var(--r-discret)";
  const x = etape === "projet" || etape === "limite" ? X.gauche : etape === "convention" || etape === "geste" ? X.droite : X.centre;
  const y = 26;
  if (etape === "projet") return <rect x={x - 4} y={y - 4} width={8} height={8} fill={c} />;
  if (etape === "fait") return <circle cx={x} cy={y} r={5} fill="var(--r-fond)" stroke={c} strokeWidth={1.4} />;
  if (etape === "convention") return <path d={`M${x - 6} ${y} H${x + 6} M${x} ${y - 6} V${y + 6}`} stroke={c} strokeWidth={1.4} />;
  if (etape === "interpretation") return <rect x={x - 6} y={y - 6} width={12} height={12} fill={c} />;
  if (etape === "limite") return <circle cx={x} cy={y} r={5} fill="var(--r-fond)" stroke={c} strokeWidth={1.2} strokeDasharray="2 2" />;
  return <rect x={x - 4.5} y={y - 4.5} width={9} height={9} transform={`rotate(45 ${x} ${y})`} fill="var(--r-fond)" stroke={c} strokeWidth={1.4} />;
}

export function CheminDeLaDecision({ donnees, variante, mode, forceEtape = null }: {
  donnees: DonneesChemin;
  variante: VarianteChemin;
  mode: ModeMouvement;
  /** Banc : impose l'étape courante (-1 : aucune). */
  forceEtape?: number | null;
}) {
  const [etape, setEtape] = useState(-1);
  const courante = forceEtape ?? etape;
  // Le TEXTE d'une étape non atteinte baisse de contraste (pas à pas seulement) ; le RAIL, lui, reste pâle
  // au repos et passe à l'encre à mesure qu'on le parcourt (statique : entier, à l'encre, d'emblée).
  const eclairees = etapesEclairees(courante);
  const railEncre = variante === "statique" ? new Set<EtapeChemin>(ETAPES_CHEMIN)
    : courante < 0 ? new Set<EtapeChemin>()
      : variante === "pas" ? eclairees : new Set<EtapeChemin>(ETAPES_CHEMIN);
  const conteneur = useRef<HTMLDivElement>(null);
  const noeuds = useRef<Partial<Record<EtapeChemin, HTMLElement | null>>>({});
  const traits = useRef<Partial<Record<EtapeChemin, SVGPathElement | null>>>({});
  const titres = useRef<Partial<Record<EtapeChemin, HTMLElement | null>>>({});
  const enCours = useRef<Animation[]>([]);
  const [y, setY] = useState<Record<EtapeChemin, number> | null>(null);
  const [hauteur, setHauteur] = useState(0);

  // LE RAIL SUIT LA MISE EN PAGE : on lit la position de chaque étape (au chargement et au redimensionnement).
  useLayoutEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const mesurer = () => {
      const base = el.getBoundingClientRect().top;
      const pos = Object.fromEntries(ETAPES_CHEMIN.map((e) => [e, Math.round((noeuds.current[e]?.getBoundingClientRect().top ?? base) - base + 26)])) as Record<EtapeChemin, number>;
      setY(pos);
      setHauteur(Math.round(el.getBoundingClientRect().height));
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tracer = useCallback((liste: { etape: EtapeChemin; delai: number; duree: number }[]) => {
    enCours.current.forEach((a) => a.finish());
    enCours.current = [];
    if (mode !== "anime") return;
    for (const t of liste) {
      const p = traits.current[t.etape];
      if (!p) continue;
      // Le pointillé de la limite ne se « trace » pas (son motif est sa nature) : il apparaît.
      if (!p.hasAttribute("pathLength")) {
        enCours.current.push(p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: t.duree, delay: t.delai, easing: "ease-out", fill: "backwards" }));
        continue;
      }
      enCours.current.push(p.animate(
        [{ strokeDasharray: "1 1", strokeDashoffset: 1 }, { strokeDasharray: "1 1", strokeDashoffset: 0 }],
        { duration: t.duree, delay: t.delai, easing: COURBES.releve, fill: "backwards" },
      ));
    }
  }, [mode]);

  // D'UN TRAIT : les trois fondements convergent ensemble, puis la limite et le geste partent de la
  // conclusion. Sous le plafond de 900 ms.
  const montrerTout = () => {
    setEtape(ETAPES_CHEMIN.length - 1);
    tracer([
      { etape: "projet", delai: 0, duree: DUREES.trace },
      { etape: "fait", delai: 60, duree: DUREES.trace - 60 },
      { etape: "convention", delai: 120, duree: DUREES.trace - 120 },
      { etape: "limite", delai: DUREES.trace, duree: DUREES.plafond - DUREES.trace },
      { etape: "geste", delai: DUREES.trace, duree: DUREES.plafond - DUREES.trace },
    ]);
  };
  const aller = (n: number) => {
    const suivante = Math.max(-1, Math.min(ETAPES_CHEMIN.length - 1, n));
    if (suivante > courante && suivante >= 0) tracer([{ etape: ETAPES_CHEMIN[suivante]!, delai: 0, duree: DUREES.trace }]);
    setEtape(suivante);
    if (suivante >= 0) titres.current[ETAPES_CHEMIN[suivante]!]?.focus({ preventScroll: false });
  };
  const clavier = (e: KeyboardEvent) => {
    if (variante !== "pas") return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); aller(etapeVoisine(courante, 1)); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); aller(etapeVoisine(courante, -1)); }
  };

  const d = donnees;
  const contenu: Record<EtapeChemin, ReactNode> = {
    projet: (
      <p className="text-[15px] leading-[1.6] text-label">
        {d.projet.libelle} <span className="font-mono text-[12px] text-ghost">· priorité {d.projet.poids} sur {d.projet.poidsMax}</span>
      </p>
    ),
    fait: (
      <>
        <p className="text-[15px] leading-[1.6] text-label">{d.fait.enonce}</p>
        <p className="font-mono text-[12px] leading-[1.6] text-ghost">
          ○ {d.fait.grain}
          {d.fait.preuves.map((p, i) => (
            <span key={i}> · {p.href ? <a href={p.href} className="underline underline-offset-2">{p.libelle}{p.valeur ? ` : ${p.valeur}` : ""}</a> : <>{p.libelle}{p.valeur ? ` : ${p.valeur}` : ""}</>}{p.date ? ` (${p.date})` : ""}</span>
          ))}
        </p>
      </>
    ),
    convention: (
      <>
        <ul className="grid gap-1.5">
          {d.convention.mesures.map((ms) => (
            <li key={ms.nom} className="text-[14.5px] leading-[1.55] text-label">
              {ms.nom} à l&apos;horizon {d.convention.horizon} : <strong className="font-semibold">{Math.round(ms.valeur)} {ms.unite}</strong>, pour un seuil de signalement de {ms.seuil}{" "}
              <span className="text-ghost">· {ms.franchi ? "franchi" : "non franchi"}</span>
            </li>
          ))}
        </ul>
        {d.convention.methode.map((l, i) => <p key={i} className="text-[13px] leading-[1.55] text-ghost">{l}</p>)}
      </>
    ),
    interpretation: <p className="text-[15px] leading-[1.6] text-label">{d.verdict.titre}</p>,
    limite: <p className="text-[15px] leading-[1.6] text-label">{d.limite}</p>,
    geste: (
      <>
        <p className="text-[15px] leading-[1.6] text-label">◇ {d.geste.libelle} <span className="font-mono text-[12px] text-ghost">· au bâtiment, à faire vous-même</span></p>
        {d.geste.aVerifier.map((l, i) => <p key={i} className="text-[13px] leading-[1.55] text-ghost">{l}</p>)}
      </>
    ),
  };

  return (
    <div className={m.chemin} onKeyDown={clavier}>
      {/* LA CONCLUSION D'ABORD : lisible avant tout geste, et avant tout mouvement. */}
      <div className={`${m.conclusionAncre} rounded-[3px] border border-[var(--border-2)] bg-[var(--bg-deep)] p-6`} data-eclairee={courante === 3 && variante === "pas"}>
        <p className="font-mono text-[11px] text-ghost mb-2">{d.verdict.etiquette}</p>
        <p className="text-[23px] leading-[1.15] text-label" style={{ fontVariationSettings: '"wdth" 108', fontWeight: 600 }}>{d.verdict.titre}</p>
        <p className="mt-3 text-[15px] leading-[1.6] text-muted"><strong className="text-label font-semibold">{d.constat.sujet}.</strong> {d.constat.enonce}</p>
        <div className={`${m.pas} mt-4`}>
          {variante === "trait" ? <button type="button" className={m.choix} onClick={montrerTout}>Voir le chemin de ce constat</button> : null}
          {variante === "pas" ? (
            <>
              <button type="button" className={m.choix} onClick={() => aller(etapeVoisine(courante, -1))} disabled={courante < 0}>Étape précédente</button>
              <button type="button" className={m.choix} onClick={() => aller(etapeVoisine(courante, 1))} disabled={courante >= ETAPES_CHEMIN.length - 1}>
                {courante < 0 ? "Parcourir le chemin" : "Étape suivante"}
              </button>
              <span className="font-mono text-[11px] text-ghost" aria-live="polite">{courante < 0 ? "6 étapes" : `étape ${courante + 1} sur 6 : ${NOMS[ETAPES_CHEMIN[courante]!]}`}</span>
            </>
          ) : null}
        </div>
      </div>

      <div ref={conteneur} className={m.etapes}>
        <svg className={m.rail} width={48} height={hauteur} aria-hidden focusable="false">
          {y ? voies(y).map((v) => (
            <path key={v.etape} ref={(n) => { traits.current[v.etape] = n; }} d={v.d} pathLength={v.nature === "limite" ? undefined : 1}
              className={m.voie} data-nature={v.nature} data-eclairee={railEncre.has(v.etape)} />
          )) : null}
        </svg>
        {ETAPES_CHEMIN.map((e, i) => (
          <section key={e} ref={(n) => { noeuds.current[e] = n; }} className={m.etape}
            data-eclairee={variante === "pas" && courante >= 0 ? eclairees.has(e) : true} data-courante={variante === "pas" && courante === i}
            aria-labelledby={`chemin-${e}`}>
            <svg className={m.borne} aria-hidden focusable="false"><Borne etape={e} eclairee={railEncre.has(e)} /></svg>
            <h4 id={`chemin-${e}`} ref={(n) => { titres.current[e] = n; }} tabIndex={-1} className={m.etapeNom}>
              <span className={m.etapeNumero}>{String(i + 1).padStart(2, "0")}</span>{NOMS[e]}
            </h4>
            {contenu[e]}
          </section>
        ))}
      </div>
    </div>
  );
}
