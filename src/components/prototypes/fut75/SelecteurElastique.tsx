"use client";

// FUT-75 (2e itération) · LE SÉLECTEUR ÉLASTIQUE. DEV UNIQUEMENT.
//
// Un groupe de boutons radio dont l'indicateur a DEUX BORDS : quand on change d'option, le bord qui
// part en tête s'étire vers la cible, l'autre le rejoint ensuite, et l'ensemble se pose sur un
// micro-ressort (dépassement ≤ 2 %). Le geste se voit, se sent, et ne dure que 300 ms.
//
// RÉPOND AVANT DE BOUGER. La valeur change au premier événement (pression, clic, flèche) ; le
// mouvement suit, sans jamais retarder ni bloquer la sélection. Une nouvelle sélection en cours de
// route repart de la position où se trouve l'indicateur (aucun saut).
//
// Au survol d'une autre option, l'indicateur « penche » de quelques pixels vers elle : la commande
// montre où elle irait, sans y aller. Au clavier : flèches (bouclent), Début, Fin ; un seul arrêt de
// tabulation. L'indicateur est une commande, pas une donnée : c'est le seul endroit où le ressort a
// droit de cité.
import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { COURBES, DUREES_V2, ressortLineaire, type ModeMouvement } from "./motion";
import m from "./motion.module.css";

export type OptionSelecteur<T extends string> = { cle: T; libelle: ReactNode; sous?: ReactNode; aria?: string };
type Bords = { g: number; d: number };

const RESSORT = ressortLineaire();

export function SelecteurElastique<T extends string>({
  options, valeur, choisir, etiquette, teinte = "var(--r-encre)", taille = "grand", mode,
}: {
  options: OptionSelecteur<T>[];
  valeur: T;
  choisir: (v: T) => void;
  etiquette: string;
  /** La teinte de l'indicateur : celle de ce que l'on sélectionne (chaleur pour un horizon de chaleur). */
  teinte?: string;
  taille?: "grand" | "compact";
  mode: ModeMouvement;
}) {
  const racine = useRef<HTMLDivElement>(null);
  const indicateur = useRef<HTMLSpanElement>(null);
  const boutons = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const precedent = useRef<Bords | null>(null);
  const [penche, setPenche] = useState<T | null>(null);

  // Les bords de l'option choisie, en pixels depuis les bords du groupe.
  const bordsDe = (cle: T): Bords | null => {
    const r = racine.current; const b = boutons.current[cle];
    if (!r || !b) return null;
    return { g: b.offsetLeft, d: r.clientWidth - (b.offsetLeft + b.offsetWidth) };
  };
  const clip = ({ g, d }: Bords) => `inset(0px ${Math.round(d)}px 0px ${Math.round(g)}px round 3px)`;
  const bordsActuels = (): Bords | null => {
    const el = indicateur.current; if (!el) return null;
    const v = getComputedStyle(el).clipPath.match(/inset\(([-\d.]+)px ([-\d.]+)px ([-\d.]+)px ([-\d.]+)px/);
    return v ? { g: Number(v[4]), d: Number(v[2]) } : null;
  };

  useLayoutEffect(() => {
    const el = indicateur.current;
    const cible = bordsDe(valeur);
    if (!el || !cible) return;
    // La « penche » : quelques pixels vers l'option survolée, sans la rejoindre.
    let final = cible;
    if (penche && penche !== valeur) {
      const autre = bordsDe(penche);
      if (autre) final = autre.g > cible.g ? { g: cible.g, d: Math.max(0, cible.d - 8) } : { g: Math.max(0, cible.g - 8), d: cible.d };
    }
    const depart = bordsActuels() ?? precedent.current;
    el.style.clipPath = clip(final);
    precedent.current = final;
    if (!depart || mode !== "anime" || (depart.g === final.g && depart.d === final.d)) return;
    el.getAnimations().forEach((a) => a.cancel());
    const versDroite = final.g > depart.g;
    // LE BORD DE TÊTE PART D'ABORD : à mi-course, l'indicateur couvre l'origine et la cible.
    const etire = versDroite ? { g: depart.g + (final.g - depart.g) * 0.25, d: final.d } : { g: final.g, d: depart.d + (final.d - depart.d) * 0.25 };
    const changeOption = !penche || penche === valeur;
    el.animate(
      changeOption && Math.abs(final.g - depart.g) > 12
        ? [{ clipPath: clip(depart), easing: COURBES.releve }, { clipPath: clip(etire), offset: 0.38, easing: RESSORT }, { clipPath: clip(final) }]
        : [{ clipPath: clip(depart), easing: RESSORT }, { clipPath: clip(final) }],
      { duration: changeOption ? DUREES_V2.ressort + 40 : DUREES_V2.ressort * 0.6 },
    );
  // `bordsDe` lit le DOM : on ne relance l'effet que sur un changement de valeur, de survol ou de mode.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur, penche, mode]);

  // Un redimensionnement replace l'indicateur sans animation.
  useLayoutEffect(() => {
    const r = racine.current; if (!r) return;
    const ro = new ResizeObserver(() => { const b = bordsDe(valeur); if (b && indicateur.current) { indicateur.current.style.clipPath = clip(b); precedent.current = b; } });
    ro.observe(r);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur]);

  const clavier = (e: KeyboardEvent) => {
    const i = options.findIndex((o) => o.cle === valeur);
    const n = options.length;
    const j = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n
        : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    const cle = options[j]!.cle;
    choisir(cle);
    boutons.current[cle]?.focus();
  };

  return (
    <div ref={racine} role="radiogroup" aria-label={etiquette} onKeyDown={clavier}
      className={`${m.selecteur} ${taille === "grand" ? m.selecteurGrand : m.selecteurCompact}`}
      style={{ "--sel-teinte": teinte } as CSSProperties} onPointerLeave={() => setPenche(null)}>
      <span ref={indicateur} aria-hidden className={m.selecteurIndicateur} />
      {options.map((o) => (
        <button key={o.cle} ref={(n) => { boutons.current[o.cle] = n; }} type="button" role="radio"
          aria-checked={o.cle === valeur} aria-label={o.aria} tabIndex={o.cle === valeur ? 0 : -1}
          className={m.selecteurOption} onClick={() => choisir(o.cle)} onPointerEnter={() => setPenche(o.cle)}>
          <span className={m.selecteurLibelle}>{o.libelle}</span>
          {o.sous ? <span className={m.selecteurSous}>{o.sous}</span> : null}
        </button>
      ))}
    </div>
  );
}
