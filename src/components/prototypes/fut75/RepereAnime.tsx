"use client";

// FUT-75 · PROTOTYPE A · LE LIEU QUI SE RÉVÈLE. DEV UNIQUEMENT.
//
// Le repère « Explorer le dossier » de production (mêmes formes, mêmes trames, mêmes destinations), avec
// trois gestes à éprouver :
//   ouverture  à l'arrivée, le dessin se trace du précis au large (logement, autour, territoire), et
//              SEULES les échelles réellement examinées se tracent ; une échelle non examinée se pose en
//              pointillé, sans être parcourue (motion.ts, `ordreDeTrace`) ;
//   reticule   au pointage ou au focus d'une destination, quatre coins viennent cadrer exactement son
//              périmètre (`cadreDe`), et nomment son grain ;
//   recul      même pointage, mais tout le schéma s'agrandit pour que la forme choisie remplisse le
//              cadre (`facteurDeRecul`). Un SCHÉMA qui s'agrandit, dit comme tel sous le dessin : aucune
//              distance réelle n'est représentée.
//
// RIEN N'ATTEND LE MOUVEMENT. Les trois liens sont dans le DOM et utilisables dès le premier rendu ; le
// tracé ne porte que le dessin décoratif (`aria-hidden`), et le premier geste du lecteur le termine.
// Le composant de production `EchelleNavigator` n'est pas modifié : ce prototype en est une copie
// d'étude, à fondre dans lui si une variante est retenue.
import { useEffect, useId, useRef, useState } from "react";
import {
  CARRE_AUTOUR, CERCLE_TERRITOIRE, CROIX_AUTOUR, ECHELLE_CENTRE, ECHELLE_VIEWBOX, LOSANGE_LOGEMENT,
  POINTS_TERRITOIRE, RIVE_TERRITOIRE, TRAITS_LOGEMENT, TRAIT_ACTIF, TRAIT_REPOS,
} from "@/components/report/echelle-geometry";
import { ECHELLES_DU_DOSSIER } from "@/lib/dossier-echelles";
import {
  cadreDe, COURBES, facteurDeRecul, ordreDeTrace, type EtatForme, type FormeEchelle, type ModeMouvement,
} from "./motion";
import m from "./motion.module.css";

export type VarianteRepere = "production" | "reticule" | "recul";

const CLE_PROD: Record<FormeEchelle, "commune" | "autour" | "logement"> = { territoire: "commune", autour: "autour", logement: "logement" };
const FORME_DE: Record<string, FormeEchelle> = { commune: "territoire", autour: "autour", logement: "logement" };
const TRAME_REPOS: Record<FormeEchelle, number> = { territoire: 0.2, autour: 0.16, logement: 0.14 };

export function RepereAnime({
  etats, hrefs, variante, mode, ouverture = true, forceActif = null, rejeu = 0,
}: {
  etats: Record<FormeEchelle, EtatForme>;
  hrefs: Record<FormeEchelle, string>;
  variante: VarianteRepere;
  mode: ModeMouvement;
  /** Tracer le dessin à l'arrivée. */
  ouverture?: boolean;
  /** Banc : fige l'échelle active (état final d'une interaction, captures). */
  forceActif?: FormeEchelle | null;
  /** Banc : incrémenté pour rejouer l'ouverture. */
  rejeu?: number;
}) {
  const [survol, setSurvol] = useState<FormeEchelle | null>(null);
  const actif = forceActif ?? survol;
  const formes = useRef<Partial<Record<FormeEchelle, SVGElement | null>>>({});
  const trames = useRef<Partial<Record<FormeEchelle, SVGGElement | null>>>({});
  const enCours = useRef<Animation[]>([]);
  const id = useId().replaceAll(":", "");
  const hintId = `${id}-indice`;

  // L'OUVERTURE, en Web Animations : chaque tracé est une animation qu'on peut terminer d'un coup.
  // Rejouée seulement quand le PÉRIMÈTRE change (clé de valeurs), jamais à chaque rendu du parent.
  const cleEtats = `${etats.territoire}|${etats.autour}|${etats.logement}`;
  useEffect(() => {
    enCours.current.forEach((a) => a.cancel());
    enCours.current = [];
    if (!ouverture || mode !== "anime") return;
    for (const pas of ordreDeTrace(etats, mode)) {
      const forme = formes.current[pas.forme];
      const trame = trames.current[pas.forme];
      if (forme && pas.geste === "tracer") {
        enCours.current.push(forme.animate(
          [{ strokeDasharray: "1 1", strokeDashoffset: 1 }, { strokeDasharray: "1 1", strokeDashoffset: 0 }],
          { duration: pas.duree, delay: pas.delai, easing: COURBES.releve, fill: "backwards" },
        ));
      } else if (forme) {
        enCours.current.push(forme.animate([{ opacity: 0 }, { opacity: 1 }], { duration: pas.duree, delay: pas.delai, easing: "ease-out", fill: "backwards" }));
      }
      // La trame d'une échelle n'arrive qu'une fois son périmètre tracé : on ne montre pas la finesse
      // d'un regard avant d'avoir posé ce qu'il regarde.
      if (trame) enCours.current.push(trame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: pas.delai + pas.duree * 0.6, easing: "ease-out", fill: "backwards" }));
    }
    const lancees = enCours.current;
    return () => lancees.forEach((a) => a.cancel());
    // `etats` est lu à travers `cleEtats` : un nouvel objet de même contenu ne rejoue rien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleEtats, mode, ouverture, rejeu]);

  // LE PREMIER GESTE DU LECTEUR TERMINE L'OUVERTURE : rien ne se joue contre lui. Un pointage, un focus,
  // une pression ou une touche suffisent ; le dessin saute à son état final.
  const [interrompu, setInterrompu] = useState(0);
  useEffect(() => {
    if (survol === null && interrompu === 0) return;
    enCours.current.forEach((a) => a.finish());
    enCours.current = [];
  }, [survol, interrompu]);
  const interrompre = () => setInterrompu((n) => n + 1);

  const destinations = ECHELLES_DU_DOSSIER.map((e) => ({ ...e, forme: FORME_DE[e.key]!, href: hrefs[FORME_DE[e.key]!] }));
  const choisie = destinations.find((d) => d.forme === actif) ?? null;
  const cadre = cadreDe(variante === "reticule" ? actif : null);
  const recul = variante === "recul" ? facteurDeRecul(actif) : 1;
  const trameOpacite = (f: FormeEchelle) => (actif === null ? TRAME_REPOS[f] : actif === f ? 0.85 : 0.05);
  const style = (f: FormeEchelle) => ({ strokeWidth: actif === f ? TRAIT_ACTIF[CLE_PROD[f]] : TRAIT_REPOS[CLE_PROD[f]] });

  const interaction = (f: FormeEchelle) => ({
    onPointerEnter: () => setSurvol(f),
    onPointerLeave: () => setSurvol(null),
    onFocus: () => setSurvol(f),
    onBlur: () => setSurvol(null),
  });

  // Les quatre coins du réticule, posés par `transform` seulement (interruptible, composé).
  const coins = [
    { cle: "hg", d: "M0 11 V0 H11", x: cadre.x, y: cadre.y },
    { cle: "hd", d: "M-11 0 H0 V11", x: cadre.x + cadre.w, y: cadre.y },
    { cle: "bg", d: "M0 -11 V0 H11", x: cadre.x, y: cadre.y + cadre.h },
    { cle: "bd", d: "M-11 0 H0 V-11", x: cadre.x + cadre.w, y: cadre.y + cadre.h },
  ];
  const pathLength = (f: FormeEchelle) => (etats[f] === "non_examinee" ? {} : { pathLength: 1 });

  return (
    <aside className={m.repere} onPointerDown={interrompre} onKeyDown={interrompre}>
      <div>
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost">3 échelles ouvertes</p>
        <p className="mt-1.5 text-[20px] leading-[1.15] text-label" style={{ fontFamily: "var(--font-serif)" }}>Explorer le dossier</p>
      </div>
      <svg viewBox={`0 0 ${ECHELLE_VIEWBOX} ${ECHELLE_VIEWBOX}`} className={m.repereVisuel} data-variante={variante} aria-hidden focusable="false">
        <defs>
          <clipPath id={`${id}-c`}><circle {...CERCLE_TERRITOIRE} /></clipPath>
          <clipPath id={`${id}-a`}><rect {...CARRE_AUTOUR} /></clipPath>
          <clipPath id={`${id}-l`}><rect {...LOSANGE_LOGEMENT} /></clipPath>
          {/* Comme en production : chaque trame est trouée de la fenêtre suivante, contour compris. */}
          <mask id={`${id}-trou-a`} maskUnits="userSpaceOnUse" x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX}>
            <rect x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX} fill="#fff" />
            <rect {...CARRE_AUTOUR} fill="#000" stroke="#000" strokeWidth="4" />
          </mask>
          <mask id={`${id}-trou-l`} maskUnits="userSpaceOnUse" x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX}>
            <rect x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX} fill="#fff" />
            <rect {...LOSANGE_LOGEMENT} fill="#000" stroke="#000" strokeWidth="4" />
          </mask>
        </defs>
        <g className={m.dessin} style={{ transform: `scale(${recul})` }}>
          <g ref={(n) => { trames.current.territoire = n; }}>
            <g clipPath={`url(#${id}-c)`} mask={`url(#${id}-trou-a)`} className={m.trameGroupe} style={{ opacity: trameOpacite("territoire") }}>
              {RIVE_TERRITOIRE.map((t, i) => <line key={i} className={m.trameTrait} {...t} />)}
              {POINTS_TERRITOIRE.map((p) => <circle key={p.cle} className={m.tramePoint} cx={p.cx} cy={p.cy} r="1.6" />)}
            </g>
          </g>
          <g ref={(n) => { trames.current.autour = n; }}>
            <g clipPath={`url(#${id}-a)`} mask={`url(#${id}-trou-l)`} className={m.trameGroupe} style={{ opacity: trameOpacite("autour") }}>
              {CROIX_AUTOUR.map((c) => <path key={c.cle} className={m.trameTrait} d={c.d} />)}
            </g>
          </g>
          <g ref={(n) => { trames.current.logement = n; }}>
            <g clipPath={`url(#${id}-l)`} className={m.trameGroupe} style={{ opacity: trameOpacite("logement") }}>
              {TRAITS_LOGEMENT.map((p) => <line key={`v${p}`} className={m.trameTrait} x1={p} y1="0" x2={p} y2={ECHELLE_VIEWBOX} />)}
              {TRAITS_LOGEMENT.map((p) => <line key={`h${p}`} className={m.trameTrait} x1="0" y1={p} x2={ECHELLE_VIEWBOX} y2={p} />)}
            </g>
          </g>
          <circle ref={(n) => { formes.current.territoire = n; }} {...CERCLE_TERRITOIRE} {...pathLength("territoire")} className={m.forme} data-etat={etats.territoire} data-actif={actif === "territoire"} style={style("territoire")} {...interaction("territoire")} />
          <rect ref={(n) => { formes.current.autour = n; }} {...CARRE_AUTOUR} {...pathLength("autour")} className={m.forme} data-etat={etats.autour} data-actif={actif === "autour"} style={style("autour")} {...interaction("autour")} />
          <rect ref={(n) => { formes.current.logement = n; }} {...LOSANGE_LOGEMENT} {...pathLength("logement")} className={m.forme} data-etat={etats.logement} data-actif={actif === "logement"} style={style("logement")} {...interaction("logement")} />
          <circle cx={ECHELLE_CENTRE} cy={ECHELLE_CENTRE} r="2.6" fill={actif === "logement" ? "var(--fg-hi)" : "var(--fg-3)"} />
        </g>
        {variante === "reticule" ? (
          <g>
            {coins.map((c) => (
              <path key={c.cle} className={m.coin} d={c.d} data-repos={actif === null} style={{ transform: `translate(${c.x}px, ${c.y}px)`, opacity: actif === null ? 0.55 : 1 }} />
            ))}
            <text className={m.legendeReticule} x={0} y={0} style={{ transform: `translate(${cadre.x + 14}px, ${Math.max(9, cadre.y - 5)}px)`, opacity: choisie ? 1 : 0 }}>
              {choisie ? `${choisie.rank} · ${choisie.grain}` : ""}
            </text>
          </g>
        ) : null}
      </svg>
      {variante === "recul" ? <p className={m.legendeSchema}>Schéma sans échelle : l&apos;agrandissement ne représente aucune distance.</p> : null}
      <nav aria-label="Explorer les échelles de lecture du dossier">
        <ol className={m.destinations}>
          {destinations.map((d) => (
            <li key={d.key}>
              <a href={d.href} aria-describedby={hintId} className={m.destination} data-actif={actif === d.forme} {...interaction(d.forme)}>
                <span className="font-mono text-[11px] tabular-nums text-ghost">{d.rank}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] leading-[1.25] text-label">{d.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-[1.3] text-ghost">{d.grain}</span>
                </span>
                <span aria-hidden className="text-[13px] text-ghost">→</span>
              </a>
            </li>
          ))}
        </ol>
        <p id={hintId} className="mt-3 min-h-[2.6em] text-[12px] leading-[1.45] text-muted">
          {choisie?.body ?? "Choisissez une échelle pour poursuivre votre lecture."}
        </p>
      </nav>
    </aside>
  );
}
