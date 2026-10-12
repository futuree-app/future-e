"use client";

// FUT-75 · PROTOTYPE B · EXPLORER LE TEMPS. DEV UNIQUEMENT.
//
// Trois horizons documentés (2030, 2050, 2100), chacun une PROJECTION DISTINCTE à un niveau de
// réchauffement, sur les vraies valeurs DRIAS-TRACC d'une commune publique. Le lecteur choisit un
// horizon ; ce qui bouge, c'est le REPÈRE :
//   - le curseur glisse le long de la règle du temps jusqu'au jalon choisi (transform seulement) ;
//   - le jalon choisi passe à l'encre, les autres restent lisibles, à leur place, avec leur valeur ;
//   - la lecture (valeur, palier France, position face au seuil) change par un fondu court, sans
//     jamais défiler ;
//   - variante « trace » : l'horizon quitté laisse un repère pâle, et la lecture le cite en toutes
//     lettres, pour comparer sans tracer quoi que ce soit entre deux jalons.
//
// CE QUI N'EST JAMAIS DESSINÉ : une courbe, un segment entre deux jalons, une barre qui s'étire, un
// nombre intermédiaire (motion.ts, `jalonsHorizons`). Le curseur traverse le temps sans rien afficher
// pendant le trajet : aucune valeur n'est connue entre deux horizons.
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { HORIZON } from "@/lib/horizons";
import { horizonVoisin, jalonsHorizons, ORDRE_HORIZONS, type CleHorizon, type ModeMouvement } from "./motion";
import m from "./motion.module.css";

export type MesureHorizon = {
  cle: string;
  nom: string;
  /** « jours » ou « nuits » : le nom du compte, distinct de l'unité (cf. climat-facts, `countNoun`). */
  compte: string;
  reference: number | null;
  valeurs: Partial<Record<CleHorizon, number | null>>;
  seuil: number;
};
export type VarianteHorizons = "regle" | "trace";

const ANNEE: Record<CleHorizon, number> = { gwl15: 2030, gwl20: 2050, gwl30: 2100 };
const DEBUT = 1970;
const FIN = 2106;
const AUJOURDHUI = 2026;
const HORIZON_DU_DOSSIER: CleHorizon = "gwl20";
const arrondi = (v: number) => Math.round(v);

export function useLargeur<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [l, setL] = useState(640);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setL(Math.round(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, l] as const;
}

function Graphique({ mesure, choisi, precedent, variante, largeur }: {
  mesure: MesureHorizon; choisi: CleHorizon; precedent: CleHorizon | null; variante: VarianteHorizons; largeur: number;
}) {
  const H = 150;
  const G = 8;
  const D = largeur < 480 ? 64 : 150; // place des libellés du seuil à droite
  const jalons = jalonsHorizons(mesure.valeurs, mesure.seuil);
  const max = Math.max(mesure.seuil, mesure.reference ?? 0, ...jalons.map((j) => j.valeur ?? 0)) * 1.18 || 1;
  const x = (a: number) => G + ((a - DEBUT) / (FIN - DEBUT)) * (largeur - G - D);
  const yAxe = H - 22;
  const y = (v: number) => yAxe - (v / max) * (yAxe - 18);
  const etroit = largeur < 480;
  return (
    <svg width={largeur} height={H} viewBox={`0 0 ${largeur} ${H}`} role="img"
      aria-label={`${mesure.nom} : ${jalons.map((j) => `${HORIZON[j.cle].annee}, ${j.valeur == null ? "valeur indisponible" : `${arrondi(j.valeur)} ${mesure.compte} par an`}`).join(" ; ")}. Seuil de signalement : ${mesure.seuil}.`}>
      <line className={m.axe} x1={G} x2={largeur - D} y1={yAxe} y2={yAxe} />
      {[1980, 2000, 2020, 2040, 2060, 2080, 2100].filter((a) => !etroit || a % 40 === 20 || a === 2100).map((a) => (
        <g key={a}>
          <line className={m.axe} x1={x(a)} x2={x(a)} y1={yAxe} y2={yAxe + 4} />
          <text className={m.etiquetteSvg} x={x(a)} y={yAxe + 16} textAnchor="middle">{a}</text>
        </g>
      ))}
      {/* La référence : une moyenne sur trente ans, donc une BANDE, pas un point. */}
      {mesure.reference != null ? (
        <g>
          <rect className={m.referenceBande} x={x(1976)} width={x(2005) - x(1976)} y={y(mesure.reference) - 2} height={4} />
          {/* Le libellé à droite de la bande, à sa hauteur : il ne croise jamais le trait du seuil. */}
          <text className={m.etiquetteSvg} x={x(2005) + 6} y={y(mesure.reference) + 4}>{etroit ? arrondi(mesure.reference) : `1976-2005 : ${arrondi(mesure.reference)}`}</text>
        </g>
      ) : null}
      <line className={m.axe} x1={x(AUJOURDHUI)} x2={x(AUJOURDHUI)} y1={10} y2={yAxe} strokeDasharray="2 3" />
      {/* Le seuil de signalement futur•e : une convention, dite comme telle à côté du trait. */}
      <line className={m.seuil} x1={G} x2={largeur - D} y1={y(mesure.seuil)} y2={y(mesure.seuil)} />
      <text className={m.etiquetteSvg} x={largeur - D + 6} y={y(mesure.seuil) + 4}>{etroit ? `seuil ${mesure.seuil}` : `seuil futur•e : ${mesure.seuil}`}</text>
      {/* La trace de l'horizon quitté (variante « trace ») : un repère pâle, sans lien avec le nouveau. */}
      {variante === "trace" && precedent && precedent !== choisi ? (
        <line key={`trace-${precedent}-${choisi}`} className={`${m.curseurTrait} ${m.trace} ${m.fondu}`} x1={x(ANNEE[precedent])} x2={x(ANNEE[precedent])} y1={10} y2={yAxe} strokeDasharray="1 3" style={{ opacity: 0.45 }} />
      ) : null}
      {/* Le curseur : il glisse d'un jalon à l'autre, sans rien lire en chemin. */}
      <g className={m.curseur} style={{ transform: `translateX(${x(ANNEE[choisi])}px)` }}>
        <line className={m.curseurTrait} x1={0} x2={0} y1={6} y2={yAxe} />
        <path d="M-5 0 H5 L0 6 Z" transform={`translate(0 ${yAxe + 1})`} fill="var(--r-encre)" />
      </g>
      {/* Les jalons : chacun isolé, une tige et un repère carré. Rien ne les relie. */}
      {jalons.map((j) => {
        const c = j.cle === choisi;
        return j.valeur == null ? (
          <text key={j.cle} className={m.etiquetteSvg} x={x(ANNEE[j.cle])} y={yAxe - 6} textAnchor="middle">n.d.</text>
        ) : (
          <g key={j.cle}>
            <line className={m.tige} data-choisi={c} x1={x(ANNEE[j.cle])} x2={x(ANNEE[j.cle])} y1={y(j.valeur)} y2={yAxe} />
            <rect x={x(ANNEE[j.cle]) - 4} y={y(j.valeur) - 4} width={8} height={8} fill={c ? "var(--r-encre)" : "var(--r-discret)"} style={{ transition: "fill var(--m-micro) ease" }} />
            <text className={m.valeurSvg} data-choisi={c} x={x(ANNEE[j.cle]) + (j.cle === "gwl30" ? -8 : 8)} y={y(j.valeur) - 7} textAnchor={j.cle === "gwl30" ? "end" : "start"}>{arrondi(j.valeur)}</text>
          </g>
        );
      })}
      {/* L'horizon où le dossier se prononce, marqué en permanence d'un anneau autour de son repère. */}
      {(() => { const j = jalons.find((x) => x.cle === HORIZON_DU_DOSSIER); return j?.valeur != null ? <rect x={x(ANNEE[HORIZON_DU_DOSSIER]) - 7} y={y(j.valeur) - 7} width={14} height={14} fill="none" stroke="var(--r-discret)" strokeWidth={1} /> : null; })()}
    </svg>
  );
}

export function RegleDesHorizons({ commune, mesures, variante, mode, force, source }: {
  commune: string;
  mesures: MesureHorizon[];
  variante: VarianteHorizons;
  mode: ModeMouvement;
  /** Banc : l'horizon choisi au départ (le banc remonte le composant pour en changer). */
  force?: CleHorizon;
  source: string;
}) {
  const [choisi, setChoisi] = useState<CleHorizon>(force ?? HORIZON_DU_DOSSIER);
  const [precedent, setPrecedent] = useState<CleHorizon | null>(null);
  const [cadre, largeur] = useLargeur<HTMLDivElement>();
  const boutons = useRef<Partial<Record<CleHorizon, HTMLButtonElement | null>>>({});

  const choisir = (h: CleHorizon, focus = false) => {
    if (h === choisi) return;
    setPrecedent(choisi);
    setChoisi(h);
    if (focus) boutons.current[h]?.focus();
  };
  const clavier = (e: KeyboardEvent) => {
    const v = horizonVoisin(choisi, e.key);
    if (!v) return;
    e.preventDefault();
    choisir(v, true);
  };
  const h = HORIZON[choisi];
  const i = ORDRE_HORIZONS.indexOf(choisi);

  return (
    <div className={m.horizons} data-mode={mode}>
      <div className={m.radios} role="radiogroup" aria-label="Horizon de projection" onKeyDown={clavier}>
        <span aria-hidden className={m.radioRepere} style={{ transform: `translateX(${3 + i * 75}px)` }} />
        {ORDRE_HORIZONS.map((k) => (
          <button key={k} ref={(n) => { boutons.current[k] = n; }} type="button" role="radio" aria-checked={k === choisi}
            tabIndex={k === choisi ? 0 : -1} className={m.radio} onClick={() => choisir(k)}>
            {HORIZON[k].annee}
          </button>
        ))}
      </div>

      {/* LA LECTURE : remplacée d'un bloc à chaque horizon (fondu de 120 ms), jamais comptée. */}
      <div className="grid gap-4" aria-live="polite">
        <p key={`palier-${choisi}`} className={`${m.fondu} font-mono text-[12px] text-ghost`}>
          Horizon {h.annee} · {h.france} en France ({h.mondial} dans le monde){choisi === HORIZON_DU_DOSSIER ? " · l'horizon où le dossier se prononce" : ""}
        </p>
        {mesures.map((ms) => {
          const j = jalonsHorizons(ms.valeurs, ms.seuil);
          const v = j.find((x) => x.cle === choisi)!;
          const avant = variante === "trace" && precedent ? j.find((x) => x.cle === precedent) : null;
          return (
            <div key={ms.cle} className={m.lecture}>
              <p className="text-[13px] font-semibold text-muted">{ms.nom}</p>
              <p key={`v-${ms.cle}-${choisi}`} className={`${m.lectureValeur} ${m.fondu}`}>
                <span style={{ fontVariationSettings: '"wdth" 125', fontWeight: 500, fontSize: 30, lineHeight: 1, color: "var(--r-encre)", fontVariantNumeric: "tabular-nums" }}>
                  {v.valeur == null ? "n.d." : arrondi(v.valeur)}
                </span>
                <span className="font-mono text-[13px] text-ghost">{ms.compte} par an</span>
                <span className="text-[13.5px]" style={{ color: v.auDessus ? "var(--r-encre)" : "var(--r-discret)" }}>
                  {v.auDessus == null ? "donnée indisponible à cet horizon" : v.auDessus ? `au-dessus du seuil de signalement (${ms.seuil})` : `sous le seuil de signalement (${ms.seuil})`}
                </span>
                {ms.reference != null ? <span className="text-[13px] text-ghost">contre {arrondi(ms.reference)} sur 1976-2005</span> : null}
                {avant && avant.valeur != null ? <span className="text-[13px] text-ghost">· {HORIZON[avant.cle].annee} : {arrondi(avant.valeur)}</span> : null}
              </p>
            </div>
          );
        })}
      </div>

      <div ref={cadre} className={m.graphique} style={{ display: "grid", gap: 18 }}>
        {mesures.map((ms) => (
          <figure key={ms.cle} style={{ margin: 0 }}>
            <figcaption className="font-mono text-[11px] text-ghost mb-1">{ms.nom}, {commune}</figcaption>
            <Graphique mesure={ms} choisi={choisi} precedent={precedent} variante={variante} largeur={largeur} />
          </figure>
        ))}
      </div>
      <p className="text-[12.5px] leading-[1.55] text-ghost">
        {source}{" "}Chaque horizon est une projection distincte à un niveau de réchauffement : rien n&apos;est
        connu entre deux jalons, et rien n&apos;est tracé entre eux. L&apos;écart entre modèles n&apos;est
        pas représenté ici. Le seuil est une convention de signalement de futur•e, pas une limite
        officielle de danger ; le dossier se prononce à l&apos;horizon 2050.
      </p>
    </div>
  );
}
