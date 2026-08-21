"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import {
  ECHELLES_DU_DOSSIER,
  type EchelleDuDossier,
} from "@/lib/dossier-echelles";
import { EchelleNavigator } from "@/components/report/EchelleNavigator";
import { EchelleVisual } from "@/components/report/EchelleVisual";
import { TrackedAddressCta } from "@/app/(account)/rapport/RapportTrackedLinks";
import styles from "./EchellePrototypes.module.css";

type Echelle = EchelleDuDossier["key"];
type Variante = "fenetres" | "plans" | "mesure";
type Destination = EchelleDuDossier & { href: string };

const HREF_PAR_ECHELLE: Record<Echelle, string> = {
  commune: "/rapport/quartier",
  autour: "/rapport/autour",
  logement: "/rapport/logement",
};

const DESTINATIONS: readonly Destination[] = ECHELLES_DU_DOSSIER.map((echelle) => ({
  ...echelle,
  href: HREF_PAR_ECHELLE[echelle.key],
}));

const VARIANTES: ReadonlyArray<{
  key: Variante;
  rank: string;
  title: string;
  subtitle: string;
  description: string;
  force: string;
  vigilance: string;
}> = [
  {
    key: "fenetres",
    rank: "A",
    title: "Un lieu, trois précisions",
    subtitle: "Fenêtres de zoom emboîtées",
    description:
      "Le même champ abstrait gagne en précision : grandes lignes du territoire, empreintes du voisinage, mini-plan du bâtiment.",
    force: "L'inclusion spatiale reste immédiate et la géométrie actuelle est conservée.",
    vigilance: "Le motif doit rester assez abstrait pour ne jamais ressembler à une carte réelle.",
  },
  {
    key: "plans",
    rank: "B",
    title: "Les plans détachés",
    subtitle: "Empilement architectural en diagonale",
    description:
      "Les trois cadrages se séparent légèrement comme les plans d'un dessin éclaté. Le plan actif remonte vers le lecteur.",
    force: "Le geste d'empilement devient plus singulier et chaque cible se distingue mieux.",
    vigilance: "L'appartenance du logement au voisinage est un peu moins immédiate qu'en A.",
  },
  {
    key: "mesure",
    rank: "A2",
    title: "Mesure emboîtée",
    subtitle: "Une trame qui se densifie",
    description:
      "L'emboîtement de A, sans route ni bâtiment. Une seule trame de mesure change de pas à chaque fenêtre : repères espacés sur la commune, maille intermédiaire sur le voisinage, plan fin sur le bâtiment.",
    force:
      "Une trame de coordonnées ne peut pas être lue comme une donnée du lieu, et le changement de pas dit la précision sans rien inventer.",
    vigilance:
      "Le pas fin doit rester assez clair pour ne pas devenir une masse grise, et disparaître en dessous de 160 px.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════════════════
// A2 · LA GÉOMÉTRIE, ET POURQUOI ELLE EST FAITE DE MASQUES.
//
// UNE FENÊTRE OCCULTE CE QU'ELLE RECOUVRE. Les pistes A et B remplissaient chaque forme avec
// `--bg-card-opaque`, qui vaut rgba(10, 15, 28, 0.78) : les trames se traversaient à 22 %, et
// l'emboîtement se lisait comme une seule texture. Ici, aucune forme n'est remplie. Chaque trame
// est découpée à sa propre forme (`clipPath`) ET trouée de la forme suivante (`mask`). L'occultation
// est donc exacte, sur n'importe quel fond, dans les deux thèmes, sans poser un aplat qui trancherait
// sur les halos de la page.
//
// LE LOSANGE A ÉTÉ RESSERRÉ. En A il mesurait 39,6 de demi-diagonale dans un carré de 54 de
// demi-côté : la troisième fenêtre remplissait la deuxième au lieu d'y être contenue.
const R_TERRITOIRE = 96;
const COTE_AUTOUR = 108;
const COTE_LOGEMENT = 50;
const CENTRE = 112;
const BORD_AUTOUR = CENTRE - COTE_AUTOUR / 2;

// Le pas double d'une échelle à l'autre. Un rapport de 2 se voit, un rapport de 1,5 se discute.
const PAS_AUTOUR = 16;
const PAS_LOGEMENT = 8;

// LE DÉTAIL A UN SEUIL, IL N'A PAS DE RÉDUCTION. Sous 160 px, une trame de 8 px de pas devient une
// masse grise : les trames ne sont pas rapetissées, elles ne sont pas rendues. Restent les trois
// contours et le point de repère, qui suffisent à dire l'emboîtement.
const SEUIL_TRAME = 160;

// TROIS MATIÈRES, PAS UNE MATIÈRE À TROIS PAS (A2.1). Un même signe « + » sur la commune et sur le
// voisinage donnait, à 224 px, le sentiment d'un seul motif répété deux fois : le changement de pas
// était juste, il ne se VOYAIT pas. Le vocabulaire progresse donc avec la précision.
//
//   Commune   graduations de rive et points espacés, posés RADIALEMENT, dans la logique du cercle.
//   Voisinage croix de coordonnées, franchement orthogonales, dans la logique du carré.
//   Logement  grille continue : à ce pas, ce n'est plus un repère, c'est un plan.
//
// « Points de mesure, repères localisés, plan précis. » Aucune des trois matières ne peut être lue
// comme une route, un bâtiment ou une donnée du lieu.

// LA TRAME EST FAITE DE MARQUES, PAS DE LIGNES. Une grille orthogonale pleine à trois pas
// différents donnait trois papiers millimétrés emboîtés : un langage d'école, et une surface qui
// pèse lourd dès qu'elle s'éclaire. Les deux fenêtres larges portent donc des CROIX de repère aux
// intersections. Elles disent le même changement de pas, elles ne remplissent rien, et elles
// appartiennent au vocabulaire du dessin technique plutôt qu'à celui du cahier. Seule la fenêtre du
// bâtiment garde des lignes continues : à ce pas, c'est un plan, et il est le point d'arrivée du zoom.
//
// AUCUNE MARQUE COUPÉE PAR UN BORD. Une croix tranchée en deux par le contour d'une fenêtre se lit
// comme un défaut de découpe, jamais comme un motif. Les marques trop proches d'un bord, ou trop
// proches de la fenêtre suivante, ne sont donc pas dessinées du tout : le découpage reste le fait du
// `clipPath`, il ne devient jamais visible.
function marquesDeTrame(
  positions: number[],
  bras: number,
  garde: (x: number, y: number) => boolean,
): { cle: string; d: string }[] {
  const marques: { cle: string; d: string }[] = [];
  for (const x of positions) {
    for (const y of positions) {
      if (!garde(x, y)) continue;
      marques.push({
        cle: `${x}-${y}`,
        d: `M${x - bras} ${y} H${x + bras} M${x} ${y - bras} V${y + bras}`,
      });
    }
  }
  return marques;
}

// Dans le carré : une gouttière constante le long des quatre côtés.
function dansCarreAutour(x: number, y: number): boolean {
  const marge = 9;
  return (
    x > BORD_AUTOUR + marge
    && x < BORD_AUTOUR + COTE_AUTOUR - marge
    && y > BORD_AUTOUR + marge
    && y < BORD_AUTOUR + COTE_AUTOUR - marge
  );
}

function positionsDeTrame(pas: number, demiEtendue: number): number[] {
  const positions: number[] = [];
  for (let d = -Math.floor(demiEtendue / pas) * pas; d <= demiEtendue; d += pas) {
    positions.push(CENTRE + d);
  }
  return positions;
}

// Au repos, la trame est un fond de plan : présente, jamais lue. Une échelle pointée monte seule et
// les deux autres tombent presque à zéro, ce qui produit le mouvement de zoom sans aucune animation.
//
// DEUX REPOS À COMPARER (`reposVide`). Le repos « vide » ne rend que les trois contours et fait
// apparaître la matière au survol : c'est le plus calme, et c'est aussi le seul que le tactile et le
// clavier ne verront JAMAIS, puisqu'ils n'ont pas de survol. Le repos « calme » garde une trame
// presque invisible, donc une matière perceptible pour tout le monde, et conserve un écart de 1 à 4
// avec l'état actif. L'atelier rend les deux pour que le choix se fasse à l'œil.
function trameOpacite(
  active: Echelle | null,
  echelle: Echelle,
  reposVide: boolean,
): number {
  const repos: Record<Echelle, number> = { commune: 0.2, autour: 0.16, logement: 0.14 };
  if (active === null) return reposVide ? 0 : repos[echelle];
  return active === echelle ? 0.85 : reposVide ? 0 : 0.05;
}

// COMPENSATION OPTIQUE. À épaisseur égale, un cercle de 192 px de diamètre pèse plus lourd qu'un
// losange de 70 px. Le trait actif décroît donc avec la taille de la forme, pour que les trois états
// actifs aient le même poids à l'œil, et pour qu'aucun ne batte le verdict qu'il accompagne.
const TRAIT_ACTIF: Record<Echelle, number> = { commune: 2.2, autour: 2.6, logement: 2.9 };
const TRAIT_REPOS: Record<Echelle, number> = { commune: 1.5, autour: 1.6, logement: 1.7 };

function cadreMesure(active: Echelle | null, echelle: Echelle): CSSProperties {
  const actif = active === echelle;
  return {
    stroke: actif ? "var(--fg-hi)" : "var(--fg-3)",
    strokeWidth: actif ? TRAIT_ACTIF[echelle] : TRAIT_REPOS[echelle],
    fill: actif ? "color-mix(in srgb, var(--fg-hi) 3%, transparent)" : "transparent",
  };
}

function MesureGraphic({
  size,
  active,
  onHover,
  reposVide,
}: {
  size: 224 | 112;
  active: Echelle | null;
  onHover: (echelle: Echelle | null) => void;
  reposVide: boolean;
}) {
  const uid = useId().replaceAll(":", "");
  const clipTerritoire = `${uid}-m-clip-territoire`;
  const clipAutour = `${uid}-m-clip-autour`;
  const clipLogement = `${uid}-m-clip-logement`;
  const trouAutour = `${uid}-m-trou-autour`;
  const trouLogement = `${uid}-m-trou-logement`;
  const detail = size >= SEUIL_TRAME;

  const carreAutour = { x: BORD_AUTOUR, y: BORD_AUTOUR, width: COTE_AUTOUR, height: COTE_AUTOUR, rx: 14 };
  const carreLogement = {
    x: CENTRE - COTE_LOGEMENT / 2,
    y: CENTRE - COTE_LOGEMENT / 2,
    width: COTE_LOGEMENT,
    height: COTE_LOGEMENT,
    rx: 6,
    transform: `rotate(45 ${CENTRE} ${CENTRE})`,
  };

  const traitsAutour = positionsDeTrame(PAS_AUTOUR, COTE_AUTOUR / 2);
  const traitsLogement = positionsDeTrame(PAS_LOGEMENT, COTE_LOGEMENT);

  // Les repères de rive : vingt-quatre traits courts posés à l'intérieur du cercle, tous les 15°.
  const repereDeRive = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 24;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Arrondi obligatoire : `Math.cos`/`Math.sin` divergent au dernier bit entre Node et le
    // navigateur, ce qui casse l'hydratation. Voir `EchelleNavigator.tsx`.
    return {
      x1: Number((CENTRE + cos * (R_TERRITOIRE - 10)).toFixed(2)),
      y1: Number((CENTRE + sin * (R_TERRITOIRE - 10)).toFixed(2)),
      x2: Number((CENTRE + cos * (R_TERRITOIRE - 3)).toFixed(2)),
      y2: Number((CENTRE + sin * (R_TERRITOIRE - 3)).toFixed(2)),
    };
  });

  // Les points de mesure de la commune. Une couronne de douze, alignée sur une graduation sur deux,
  // et quatre points d'axe dans les lobes que le carré laisse libres. Il n'existe aucune couronne
  // complète en dessous de 77 : les angles du carré occupent les diagonales.
  const pointsDeMesure = [
    ...Array.from({ length: 12 }, (_, i) => ({ angle: (i * Math.PI * 2) / 12, rayon: 80 })),
    ...Array.from({ length: 4 }, (_, i) => ({ angle: (i * Math.PI) / 2, rayon: 66 })),
  ].map(({ angle, rayon }, i) => ({
    cle: `p${i}`,
    cx: Number((CENTRE + Math.cos(angle) * rayon).toFixed(2)),
    cy: Number((CENTRE + Math.sin(angle) * rayon).toFixed(2)),
  }));

  return (
    <div
      className={styles.graphic}
      style={{ "--prototype-size": `${size}px` } as CSSProperties}
    >
      <svg viewBox="0 0 224 224" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipTerritoire}>
            <circle cx={CENTRE} cy={CENTRE} r={R_TERRITOIRE} />
          </clipPath>
          <clipPath id={clipAutour}>
            <rect {...carreAutour} />
          </clipPath>
          <clipPath id={clipLogement}>
            <rect {...carreLogement} />
          </clipPath>
          {/* Le trou est peint AVEC son contour (`stroke`), pour que la trame extérieure ne vienne pas
              mourir sous le trait de la fenêtre intérieure. */}
          <mask id={trouAutour} maskUnits="userSpaceOnUse" x="0" y="0" width="224" height="224">
            <rect x="0" y="0" width="224" height="224" fill="#fff" />
            <rect {...carreAutour} fill="#000" stroke="#000" strokeWidth="4" />
          </mask>
          <mask id={trouLogement} maskUnits="userSpaceOnUse" x="0" y="0" width="224" height="224">
            <rect x="0" y="0" width="224" height="224" fill="#fff" />
            <rect {...carreLogement} fill="#000" stroke="#000" strokeWidth="4" />
          </mask>
        </defs>

        {detail ? (
          <>
            <g
              clipPath={`url(#${clipTerritoire})`}
              mask={`url(#${trouAutour})`}
              className={styles.texture}
              style={{ opacity: trameOpacite(active, "commune", reposVide) }}
            >
              {repereDeRive.map((r, i) => (
                <line key={`rive${i}`} className={styles.rimTick} {...r} />
              ))}
              {pointsDeMesure.map((p) => (
                <circle key={p.cle} className={styles.gridDot} cx={p.cx} cy={p.cy} r="1.6" />
              ))}
            </g>

            <g
              clipPath={`url(#${clipAutour})`}
              mask={`url(#${trouLogement})`}
              className={styles.texture}
              style={{ opacity: trameOpacite(active, "autour", reposVide) }}
            >
              {marquesDeTrame(traitsAutour, 2.6, dansCarreAutour).map((m) => (
                <path key={`a${m.cle}`} className={styles.gridMark} d={m.d} />
              ))}
            </g>

            <g
              clipPath={`url(#${clipLogement})`}
              className={styles.texture}
              style={{ opacity: trameOpacite(active, "logement", reposVide) }}
            >
              {traitsLogement.map((p) => (
                <line key={`lv${p}`} className={styles.gridLine} x1={p} y1="0" x2={p} y2="224" />
              ))}
              {traitsLogement.map((p) => (
                <line key={`lh${p}`} className={styles.gridLine} x1="0" y1={p} x2="224" y2={p} />
              ))}
            </g>
          </>
        ) : null}

        {/* Mêmes cibles qu'en A : de la plus grande à la plus petite, la dernière peinte gagne dans
            les zones de recouvrement. La zone cliquable d'une échelle est exactement la surface que
            l'œil lui attribue. */}
        <Link
          href={HREF_PAR_ECHELLE.commune}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("commune", onHover)}
        >
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={R_TERRITOIRE}
            className={styles.hitFrame}
            style={cadreMesure(active, "commune")}
          />
        </Link>
        <Link
          href={HREF_PAR_ECHELLE.autour}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("autour", onHover)}
        >
          <rect {...carreAutour} className={styles.hitFrame} style={cadreMesure(active, "autour")} />
        </Link>
        <Link
          href={HREF_PAR_ECHELLE.logement}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("logement", onHover)}
        >
          <rect
            {...carreLogement}
            className={styles.hitFrame}
            style={cadreMesure(active, "logement")}
          />
        </Link>
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r="2.6"
          fill={active === "logement" ? "var(--fg-hi)" : "var(--fg-3)"}
          className={styles.registrationPoint}
        />
      </svg>
    </div>
  );
}

function textureOpacity(active: Echelle | null, echelle: Echelle): number {
  if (active === null) return echelle === "commune" ? 0.46 : 0.58;
  return active === echelle ? 0.96 : 0.16;
}

function frameStyle(active: Echelle | null, echelle: Echelle): CSSProperties {
  return {
    stroke: active === echelle ? "var(--fg-hi)" : "var(--fg-3)",
    strokeWidth: active === echelle ? 2.8 : 1.6,
  };
}

function interactionProps(
  echelle: Echelle,
  onHover: (echelle: Echelle | null) => void,
) {
  return {
    onMouseEnter: () => onHover(echelle),
    onMouseLeave: () => onHover(null),
  };
}

function FenetresGraphic({
  size,
  active,
  onHover,
}: {
  size: 224 | 112;
  active: Echelle | null;
  onHover: (echelle: Echelle | null) => void;
}) {
  const uid = useId().replaceAll(":", "");
  const circleClip = `${uid}-territoire`;
  const squareClip = `${uid}-autour`;
  const diamondClip = `${uid}-logement`;

  return (
    <div
      className={styles.graphic}
      style={{ "--prototype-size": `${size}px` } as CSSProperties}
    >
      <svg viewBox="0 0 224 224" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={circleClip}>
            <circle cx="112" cy="112" r="96" />
          </clipPath>
          <clipPath id={squareClip}>
            <rect x="58" y="58" width="108" height="108" rx="14" />
          </clipPath>
          <clipPath id={diamondClip}>
            <rect x="84" y="84" width="56" height="56" rx="7" transform="rotate(45 112 112)" />
          </clipPath>
        </defs>

        <circle cx="112" cy="112" r="96" fill="var(--bg-card-opaque)" />
        <g
          clipPath={`url(#${circleClip})`}
          className={styles.texture}
          style={{ opacity: textureOpacity(active, "commune") }}
        >
          <path className={styles.territoryLine} d="M8 70 C48 51 79 51 111 67 S174 88 218 57" />
          <path className={styles.territoryLine} d="M-2 155 C36 139 61 146 89 160 S151 181 228 143" />
          <path className={styles.territoryLine} d="M72 5 C67 44 74 77 90 105 S106 174 94 224" />
          <path className={styles.territoryFine} d="M18 101 C47 94 70 99 92 114" />
          <path className={styles.territoryFine} d="M137 29 C149 53 167 68 203 77" />
        </g>

        <rect x="58" y="58" width="108" height="108" rx="14" fill="var(--bg-card-opaque)" />
        <g
          clipPath={`url(#${squareClip})`}
          className={styles.texture}
          style={{ opacity: textureOpacity(active, "autour") }}
        >
          <path className={styles.neighborhoodRoad} d="M48 83 C80 89 99 84 123 69 S157 53 176 59" />
          <path className={styles.neighborhoodRoad} d="M80 49 C84 79 88 101 104 124 S128 157 126 175" />
          <path className={styles.neighborhoodRoad} d="M48 143 C82 135 103 135 122 145 S154 159 176 157" />
          <path className={styles.neighborhoodFine} d="M131 61 L137 100 L169 104" />
          <path className={styles.neighborhoodFine} d="M61 111 L91 108 L93 73" />
          <rect className={styles.footprint} x="64" y="67" width="17" height="12" rx="1.5" />
          <rect className={styles.footprint} x="139" y="111" width="21" height="13" rx="1.5" />
          <rect className={styles.footprint} x="70" y="145" width="22" height="12" rx="1.5" />
          <rect className={styles.footprint} x="138" y="139" width="14" height="18" rx="1.5" />
        </g>

        <rect
          x="84"
          y="84"
          width="56"
          height="56"
          rx="7"
          transform="rotate(45 112 112)"
          fill="var(--bg-card-opaque)"
        />
        <g
          clipPath={`url(#${diamondClip})`}
          className={styles.texture}
          style={{ opacity: textureOpacity(active, "logement") }}
        >
          <path className={styles.parcelLine} d="M90 104 L103 91 L135 99 L139 127 L121 141 L91 128 Z" />
          <rect className={styles.buildingLine} x="99" y="99" width="28" height="29" rx="1.5" />
          <path className={styles.buildingLine} d="M112 99 V128 M99 114 H127 M112 114 L126 103" />
        </g>

        {/* Les trois liens sont ordonnés du plus grand au plus petit. La cible intérieure, peinte
            en dernier, gagne donc naturellement dans les zones de chevauchement. */}
        <Link
          href={HREF_PAR_ECHELLE.commune}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("commune", onHover)}
        >
          <circle
            cx="112"
            cy="112"
            r="96"
            className={styles.hitFrame}
            style={frameStyle(active, "commune")}
          />
        </Link>
        <Link
          href={HREF_PAR_ECHELLE.autour}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("autour", onHover)}
        >
          <rect
            x="58"
            y="58"
            width="108"
            height="108"
            rx="14"
            className={styles.hitFrame}
            style={frameStyle(active, "autour")}
          />
        </Link>
        <Link
          href={HREF_PAR_ECHELLE.logement}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("logement", onHover)}
        >
          <rect
            x="84"
            y="84"
            width="56"
            height="56"
            rx="7"
            transform="rotate(45 112 112)"
            className={styles.hitFrame}
            style={frameStyle(active, "logement")}
          />
        </Link>
        <circle
          cx="112"
          cy="112"
          r="2.6"
          fill={active === "logement" ? "var(--fg-hi)" : "var(--fg-3)"}
          className={styles.registrationPoint}
        />
      </svg>
    </div>
  );
}

function PlansGraphic({
  size,
  active,
  onHover,
}: {
  size: 224 | 112;
  active: Echelle | null;
  onHover: (echelle: Echelle | null) => void;
}) {
  const uid = useId().replaceAll(":", "");
  const circleClip = `${uid}-plan-territoire`;
  const squareClip = `${uid}-plan-autour`;
  const diamondClip = `${uid}-plan-logement`;
  const lift = (echelle: Echelle): CSSProperties => ({
    transform: active === echelle ? "translateY(-4px)" : "translateY(0)",
  });

  return (
    <div
      className={styles.graphic}
      style={{ "--prototype-size": `${size}px` } as CSSProperties}
    >
      <svg viewBox="0 0 224 224" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={circleClip}>
            <circle cx="72" cy="64" r="48" />
          </clipPath>
          <clipPath id={squareClip}>
            <rect x="68" y="72" width="112" height="94" rx="16" />
          </clipPath>
          <clipPath id={diamondClip}>
            <rect x="125" y="137" width="52" height="52" rx="7" transform="rotate(45 151 163)" />
          </clipPath>
        </defs>

        <Link
          href={HREF_PAR_ECHELLE.commune}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("commune", onHover)}
        >
          <g className={styles.plane} style={lift("commune")}>
            <circle cx="72" cy="64" r="48" fill="var(--bg-card-opaque)" />
            <g
              clipPath={`url(#${circleClip})`}
              className={styles.texture}
              style={{ opacity: textureOpacity(active, "commune") }}
            >
              <path className={styles.territoryLine} d="M20 44 C43 30 67 31 86 43 S110 61 124 52" />
              <path className={styles.territoryLine} d="M14 80 C37 72 55 77 73 89 S101 104 121 92" />
              <path className={styles.territoryFine} d="M54 10 C54 35 62 51 76 65 S91 91 86 113" />
            </g>
            <circle
              cx="72"
              cy="64"
              r="48"
              className={styles.hitFrame}
              style={frameStyle(active, "commune")}
            />
          </g>
        </Link>

        <Link
          href={HREF_PAR_ECHELLE.autour}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("autour", onHover)}
        >
          <g className={styles.plane} style={lift("autour")}>
            <rect x="68" y="72" width="112" height="94" rx="16" fill="var(--bg-card-opaque)" />
            <g
              clipPath={`url(#${squareClip})`}
              className={styles.texture}
              style={{ opacity: textureOpacity(active, "autour") }}
            >
              <path className={styles.neighborhoodRoad} d="M59 101 C88 104 107 96 126 84 S160 70 188 80" />
              <path className={styles.neighborhoodRoad} d="M99 63 C102 91 110 111 126 128 S145 153 141 174" />
              <path className={styles.neighborhoodRoad} d="M61 145 C92 135 116 137 139 148 S168 160 187 154" />
              <rect className={styles.footprint} x="76" y="82" width="19" height="12" rx="1.5" />
              <rect className={styles.footprint} x="146" y="94" width="25" height="15" rx="1.5" />
              <rect className={styles.footprint} x="79" y="126" width="24" height="17" rx="1.5" />
            </g>
            <rect
              x="68"
              y="72"
              width="112"
              height="94"
              rx="16"
              className={styles.hitFrame}
              style={frameStyle(active, "autour")}
            />
          </g>
        </Link>

        <Link
          href={HREF_PAR_ECHELLE.logement}
          prefetch={false}
          aria-hidden="true"
          tabIndex={-1}
          className={styles.shapeLink}
          {...interactionProps("logement", onHover)}
        >
          <g className={styles.plane} style={lift("logement")}>
            <rect
              x="125"
              y="137"
              width="52"
              height="52"
              rx="7"
              transform="rotate(45 151 163)"
              fill="var(--bg-card-opaque)"
            />
            <g
              clipPath={`url(#${diamondClip})`}
              className={styles.texture}
              style={{ opacity: textureOpacity(active, "logement") }}
            >
              <path className={styles.parcelLine} d="M130 151 L145 139 L173 147 L178 169 L159 187 L132 174 Z" />
              <rect className={styles.buildingLine} x="140" y="149" width="25" height="27" rx="1.5" />
              <path className={styles.buildingLine} d="M152 149 V176 M140 162 H165 M152 162 L164 152" />
            </g>
            <rect
              x="125"
              y="137"
              width="52"
              height="52"
              rx="7"
              transform="rotate(45 151 163)"
              className={styles.hitFrame}
              style={frameStyle(active, "logement")}
            />
            <circle
              cx="151"
              cy="163"
              r="2.6"
              fill={active === "logement" ? "var(--fg-hi)" : "var(--fg-3)"}
              className={styles.registrationPoint}
            />
          </g>
        </Link>
      </svg>
    </div>
  );
}

function PrototypeGraphic({
  variante,
  size,
  active,
  onHover,
  reposVide = false,
}: {
  variante: Variante;
  size: 224 | 112;
  active: Echelle | null;
  onHover: (echelle: Echelle | null) => void;
  reposVide?: boolean;
}) {
  if (variante === "fenetres") return <FenetresGraphic size={size} active={active} onHover={onHover} />;
  if (variante === "plans") return <PlansGraphic size={size} active={active} onHover={onHover} />;
  return <MesureGraphic size={size} active={active} onHover={onHover} reposVide={reposVide} />;
}

function PrototypeNavigator({
  variante,
  active,
  onHover,
  reposVide,
}: {
  variante: Variante;
  active: Echelle | null;
  onHover: (echelle: Echelle | null) => void;
  reposVide: boolean;
}) {
  const hintId = useId();
  const selected = DESTINATIONS.find((destination) => destination.key === active) ?? null;

  return (
    <aside className={styles.navigator}>
      <p className={styles.navigatorKicker}>3 échelles ouvertes</p>
      <p className={styles.navigatorTitle}>Explorer le dossier</p>

      <nav aria-label={`Prototype ${variante} des échelles du dossier`} className={styles.navigatorNav}>
        <PrototypeGraphic
          variante={variante}
          size={224}
          active={active}
          onHover={onHover}
          reposVide={reposVide}
        />

        <ol className={styles.scaleList}>
          {DESTINATIONS.map((destination) => (
            <li key={destination.key}>
              <Link
                href={destination.href}
                prefetch={false}
                aria-describedby={hintId}
                className={`${styles.scaleRow} ${active === destination.key ? styles.scaleRowActive : ""}`}
                onMouseEnter={() => onHover(destination.key)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(destination.key)}
                onBlur={() => onHover(null)}
              >
                <span className={styles.scaleRank}>{destination.rank}</span>
                <span className={styles.scaleIdentity}>
                  <span>{destination.title}</span>
                  <small>{destination.grain}</small>
                </span>
                <span aria-hidden className={styles.scaleArrow}>→</span>
              </Link>
            </li>
          ))}
        </ol>

        <p id={hintId} className={styles.hint}>
          {selected?.body ?? "Choisissez une échelle pour poursuivre votre lecture."}
        </p>
      </nav>
    </aside>
  );
}

function StateControls({
  pinned,
  onPin,
}: {
  pinned: Echelle | null;
  onPin: (echelle: Echelle | null) => void;
}) {
  return (
    <div className={styles.stateControls} aria-label="État à comparer">
      <button
        type="button"
        aria-pressed={pinned === null}
        className={`${styles.stateButton} ${pinned === null ? styles.stateButtonActive : ""}`}
        onClick={() => onPin(null)}
      >
        Repos
      </button>
      {DESTINATIONS.map((destination) => (
        <button
          key={destination.key}
          type="button"
          aria-pressed={pinned === destination.key}
          className={`${styles.stateButton} ${pinned === destination.key ? styles.stateButtonActive : ""}`}
          onClick={() => onPin(destination.key)}
        >
          {destination.rank} {destination.title}
        </button>
      ))}
    </div>
  );
}

function PrototypeCard({
  variante,
}: {
  variante: (typeof VARIANTES)[number];
}) {
  const [pinned, setPinned] = useState<Echelle | null>(null);
  const [hovered, setHovered] = useState<Echelle | null>(null);
  const [reposVide, setReposVide] = useState(false);
  const active = hovered ?? pinned;
  const reglageRepos = variante.key === "mesure";

  return (
    <article className={styles.prototypeCard}>
      <div className={styles.prototypeNotes}>
        <p className={styles.prototypeRank}>Piste {variante.rank}</p>
        <h2 className={styles.prototypeTitle}>{variante.title}</h2>
        <p className={styles.prototypeSubtitle}>{variante.subtitle}</p>
        <p className={styles.prototypeDescription}>{variante.description}</p>

        <StateControls pinned={pinned} onPin={setPinned} />

        {/* LE REPOS SE COMPARE, IL NE SE DÉCRÈTE PAS. « Vide » ne rend que les contours et fait
            apparaître la trame au survol ; « calme » en laisse une trace lisible sans souris. */}
        {reglageRepos ? (
          <div className={styles.stateControls} aria-label="Repos à comparer">
            <button
              type="button"
              aria-pressed={!reposVide}
              className={`${styles.stateButton} ${reposVide ? "" : styles.stateButtonActive}`}
              onClick={() => setReposVide(false)}
            >
              Repos calme
            </button>
            <button
              type="button"
              aria-pressed={reposVide}
              className={`${styles.stateButton} ${reposVide ? styles.stateButtonActive : ""}`}
              onClick={() => setReposVide(true)}
            >
              Repos vide
            </button>
          </div>
        ) : null}

        <dl className={styles.assessment}>
          <div>
            <dt>Force</dt>
            <dd>{variante.force}</dd>
          </div>
          <div>
            <dt>Vigilance</dt>
            <dd>{variante.vigilance}</dd>
          </div>
        </dl>

        <div className={styles.mobileCheck}>
          <div>
            <p className={styles.mobileCheckTitle}>112 px</p>
            <p className={styles.mobileCheckText}>Dégradation mobile, même état actif.</p>
          </div>
          <div aria-hidden="true">
            <PrototypeGraphic
              variante={variante.key}
              size={112}
              active={active}
              onHover={setHovered}
              reposVide={reposVide}
            />
          </div>
        </div>
      </div>

      <PrototypeNavigator
        variante={variante.key}
        active={active}
        onHover={setHovered}
        reposVide={reposVide}
      />
    </article>
  );
}

export function EchellePrototypesClient() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <p className={styles.pageKicker}>Atelier · trois échelles</p>
          <h1>Trois manières de montrer le changement d&apos;échelle.</h1>
          <p>
            Les trois pistes utilisent le vocabulaire, les destinations et les bénéfices réels du
            dossier. Survolez les formes ou la liste, épinglez un état avec les commandes, puis
            comparez le rendu principal et sa réduction mobile.
          </p>
        </header>

        {/* LE COMPOSANT RÉELLEMENT INTÉGRÉ AU HUB, dans sa largeur de production (280 px), avec ses
            deux états de droits. `/rapport` exige une session : sans ce montage, la seule façon de
            regarder le composant livré serait de se connecter. */}
        <section className={styles.prototypeCard}>
          <div className={styles.prototypeNotes}>
            <p className={styles.prototypeRank}>Intégré</p>
            <h2 className={styles.prototypeTitle}>Le repère du hub</h2>
            <p className={styles.prototypeSubtitle}>`EchelleNavigator`, tel qu&apos;il est rendu dans /rapport</p>
            <p className={styles.prototypeDescription}>
              A2.1 posée dans le composant de production : mêmes formes que les en-têtes de module,
              trame masquée sous 1024 px, liste inchangée. À droite, les deux états de droits : trois
              échelles ouvertes, puis la commune seule.
            </p>

            {/* LES TROIS EN-TÊTES DE MODULE, dans le même système. `EchelleVisual` n'a qu'un état,
                celui de la page qui le porte : c'est ce qui se voit en haut de Territoire, Autour et
                Logement. La seule différence avec le repère du hub est sa teinte, qui reste en
                arbitrage. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24, marginTop: 32 }}>
              {(["territoire", "autour", "logement"] as const).map((echelle) => (
                <div key={echelle}>
                  <p className={styles.mobileCheckTitle} style={{ marginBottom: 10 }}>{echelle}</p>
                  <EchelleVisual active={echelle} className="w-full" />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 40 }}>
            <EchelleNavigator
              territoireHref="/rapport/quartier"
              autourHref="/rapport/autour"
              logementHref="/rapport/logement"
              addressAvailable
              commune="Ciré-d'Aunis"
              inseeCode="17108"
              className="lg:w-[280px]"
            />
            <EchelleNavigator
              territoireHref="/rapport/quartier"
              autourHref="/rapport/autour"
              logementHref="/rapport/logement"
              addressAvailable={false}
              commune="Ciré-d'Aunis"
              inseeCode="17108"
              className="lg:w-[280px]"
            />
          </div>
        </section>

        {/* LA FIN DU DOSSIER DE COMMUNE SEULE. Ce cas demande un compte payant SANS dossier d'adresse
            sur la commune lue : il n'est pas rejouable en se connectant avec un compte ordinaire. Le
            bloc gris tient la place de la dernière rubrique de contrôles, dans la largeur réelle du
            rapport (1100 px), pour juger la respiration au-dessus du geste. */}
        <section className={styles.prototypeCard}>
          <div style={{ gridColumn: "1 / -1" }}>
            <p className={styles.prototypeRank}>Fin de dossier</p>
            <h2 className={styles.prototypeTitle}>Le geste de clôture</h2>
            <p className={styles.prototypeDescription}>
              Ce qu&apos;un lecteur payant sans adresse voit en bas de /rapport, après les rubriques
              de contrôles. Le repère du haut porte la même destination ; celui-ci suit la lecture.
            </p>

            <div style={{ maxWidth: 1100, marginTop: 40 }}>
              <div
                aria-hidden
                style={{
                  border: "1px solid var(--border-1)",
                  borderRadius: 12,
                  padding: "18px 22px",
                  color: "var(--fg-3)",
                  fontSize: 13,
                }}
              >
                Territoire · Argiles · Inondation · 8 contrôles
                <span style={{ float: "right" }}>⌄</span>
              </div>
              <TrackedAddressCta commune="Ciré-d'Aunis" inseeCode="17108" />
            </div>
          </div>
        </section>

        <div className={styles.prototypeList}>
          {VARIANTES.map((variante) => (
            <PrototypeCard key={variante.key} variante={variante} />
          ))}
        </div>

        <footer className={styles.pageFooter}>
          <p>
            Les formes sont volontairement cliquables et mènent aux modules réels. Dans chaque
            spécimen, la liste reste la voie clavier et lecteur d'écran ; le SVG est une commodité
            de pointage et une représentation visuelle.
          </p>
          <Link href="/rapport" prefetch={false}>
            Revenir au rapport <span aria-hidden>→</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
