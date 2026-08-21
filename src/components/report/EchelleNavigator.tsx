"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import posthog from "posthog-js";
import {
  ECHELLES_DU_DOSSIER,
  type EchelleDuDossier,
} from "@/lib/dossier-echelles";
import { buildGeoProps, buildModuleProps } from "@/lib/posthog-props";
import {
  CARRE_AUTOUR,
  CERCLE_TERRITOIRE,
  CROIX_AUTOUR,
  ECHELLE_CENTRE,
  ECHELLE_VIEWBOX,
  LOSANGE_LOGEMENT,
  POINTS_TERRITOIRE,
  RIVE_TERRITOIRE,
  TRAITS_LOGEMENT,
  TRAIT_ACTIF,
  TRAIT_REPOS,
} from "./echelle-geometry";
import styles from "./EchelleNavigator.module.css";

type Echelle = EchelleDuDossier["key"];

type Destination = EchelleDuDossier & {
  href: string;
};

function shapeStyle(active: Echelle | null, shape: Echelle): CSSProperties {
  const actif = active === shape;
  // AUCUN APLAT AU REPOS. Trois formes emboîtées remplies d'un blanc à 3 % empilaient trois valeurs
  // de gris : la plus petite devenait la zone la plus claire de l'écran, et le regard tombait sur le
  // logement avant la commune. Les fenêtres sont donc vides, et seule la fenêtre active reçoit un
  // fond. La cible de pointage, elle, ne dépend pas du remplissage (`pointer-events: all`).
  return {
    fill: actif ? "var(--bg-elev-3)" : "transparent",
    stroke: actif ? "var(--fg-hi)" : "var(--fg-3)",
    strokeWidth: actif ? TRAIT_ACTIF[shape] : TRAIT_REPOS[shape],
  };
}

// Au repos, la trame est un fond de plan : présente, jamais lue. Une échelle pointée monte seule et
// les deux autres tombent presque à zéro, ce qui produit le mouvement de zoom sans aucune animation.
// Le repos n'est pas vide : le tactile n'a pas de survol, et un dessin qui ne réagit qu'à la souris
// ne dirait rien à personne sur un téléphone.
const TRAME_REPOS: Record<Echelle, number> = { commune: 0.2, autour: 0.16, logement: 0.14 };

function trameOpacite(active: Echelle | null, echelle: Echelle): number {
  if (active === null) return TRAME_REPOS[echelle];
  return active === echelle ? 0.85 : 0.05;
}

export function EchelleNavigator({
  territoireHref,
  autourHref,
  logementHref,
  addressAvailable,
  commune,
  inseeCode,
  className = "",
}: {
  territoireHref: string;
  autourHref: string;
  logementHref: string;
  addressAvailable: boolean;
  commune?: string | null;
  inseeCode?: string | null;
  className?: string;
}) {
  const [active, setActive] = useState<Echelle | null>(null);
  const hintId = useId();
  // Les identifiants de `clipPath` et de `mask` sont globaux au document : deux navigateurs rendus
  // sur le même écran (le repli du streaming et le dossier résolu) se voleraient leurs découpes.
  const trameId = useId().replaceAll(":", "");

  const hrefParEchelle: Record<Echelle, string> = {
    commune: territoireHref,
    autour: autourHref,
    logement: logementHref,
  };
  const allDestinations: Destination[] = ECHELLES_DU_DOSSIER.map((echelle) => ({
    ...echelle,
    href: hrefParEchelle[echelle.key],
  }));
  const destinations = addressAvailable ? allDestinations : allDestinations.slice(0, 1);
  const selected = destinations.find((destination) => destination.key === active) ?? null;

  const trackOpen = (destination: Destination) => {
    posthog.capture("report_module_opened", {
      module_id: destination.moduleId,
      source: "hub",
      surface: "echelle_navigator",
      ...buildModuleProps(destination.moduleId),
      ...buildGeoProps({ commune, inseeCode }),
    });
  };

  const trackAddressRequired = () => {
    posthog.capture("report_scale_address_required", {
      requested_modules: ["autour", "logement"],
      source: "hub",
      surface: "echelle_navigator",
      ...buildGeoProps({ commune, inseeCode }),
    });
  };

  const interactionProps = (destination: Destination) => ({
    onMouseEnter: () => setActive(destination.key),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(destination.key),
    onBlur: () => setActive(null),
    onClick: () => trackOpen(destination),
  });

  const hint = selected?.body ?? (addressAvailable
    ? "Choisissez une échelle pour poursuivre votre lecture."
    : destinations[0]?.body ?? "");

  return (
    <aside
      className={`mt-5 border-y border-[var(--border-1)] py-5 lg:mt-0 lg:border-y-0 lg:border-l lg:py-0 lg:pl-6 ${className}`}
    >
      <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost">
        {addressAvailable ? "3 échelles ouvertes" : "1 échelle ouverte"}
      </p>
      <p
        className="mt-1.5 text-[20px] leading-[1.15] text-label"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Explorer le dossier
      </p>

      <nav aria-label="Explorer les échelles de lecture du dossier" className="mt-4">
        <div
          className={addressAvailable
            ? "grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[156px_minmax(0,1fr)] sm:gap-6 lg:block"
            : ""
          }
        >
          {addressAvailable ? (
            /* Les formes sont une seconde cible volontaire pour la souris. Elles restent hors de
               l'arbre d'accessibilité et du parcours Tab : la liste adjacente est l'unique voie
               sémantique, avec le rang, le nom et le grain de chaque destination. */
            <svg
              viewBox={`0 0 ${ECHELLE_VIEWBOX} ${ECHELLE_VIEWBOX}`}
              fill="none"
              aria-hidden="true"
              focusable="false"
              className={styles.visual}
            >
              <defs>
                <clipPath id={`${trameId}-c`}>
                  <circle {...CERCLE_TERRITOIRE} />
                </clipPath>
                <clipPath id={`${trameId}-a`}>
                  <rect {...CARRE_AUTOUR} />
                </clipPath>
                <clipPath id={`${trameId}-l`}>
                  <rect {...LOSANGE_LOGEMENT} />
                </clipPath>
                {/* Le trou est peint AVEC son contour, pour que la trame extérieure ne vienne pas
                    mourir sous le trait de la fenêtre intérieure. */}
                <mask id={`${trameId}-trou-a`} maskUnits="userSpaceOnUse" x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX}>
                  <rect x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX} fill="#fff" />
                  <rect {...CARRE_AUTOUR} fill="#000" stroke="#000" strokeWidth="4" />
                </mask>
                <mask id={`${trameId}-trou-l`} maskUnits="userSpaceOnUse" x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX}>
                  <rect x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX} fill="#fff" />
                  <rect {...LOSANGE_LOGEMENT} fill="#000" stroke="#000" strokeWidth="4" />
                </mask>
              </defs>

              {/* LE DÉTAIL A UN SEUIL, IL N'A PAS DE RÉDUCTION. Sous 1024 px le repère est rendu dans
                  une colonne de 112 ou 156 px : une grille de 8 px de pas y devient une masse grise.
                  Les trames n'y sont pas rapetissées, elles ne sont pas rendues (`styles.trame`).
                  Restent les trois contours et le point de repère, qui suffisent à dire l'emboîtement. */}
              <g className={styles.trame}>
                <g
                  clipPath={`url(#${trameId}-c)`}
                  mask={`url(#${trameId}-trou-a)`}
                  className={styles.trameGroupe}
                  style={{ opacity: trameOpacite(active, "commune") }}
                >
                  {RIVE_TERRITOIRE.map((trait, i) => (
                    <line key={`rive${i}`} className={styles.rimTick} {...trait} />
                  ))}
                  {POINTS_TERRITOIRE.map((point) => (
                    <circle key={point.cle} className={styles.gridDot} cx={point.cx} cy={point.cy} r="1.6" />
                  ))}
                </g>

                <g
                  clipPath={`url(#${trameId}-a)`}
                  mask={`url(#${trameId}-trou-l)`}
                  className={styles.trameGroupe}
                  style={{ opacity: trameOpacite(active, "autour") }}
                >
                  {CROIX_AUTOUR.map((croix) => (
                    <path key={croix.cle} className={styles.gridMark} d={croix.d} />
                  ))}
                </g>

                <g
                  clipPath={`url(#${trameId}-l)`}
                  className={styles.trameGroupe}
                  style={{ opacity: trameOpacite(active, "logement") }}
                >
                  {TRAITS_LOGEMENT.map((p) => (
                    <line key={`lv${p}`} className={styles.gridLine} x1={p} y1="0" x2={p} y2={ECHELLE_VIEWBOX} />
                  ))}
                  {TRAITS_LOGEMENT.map((p) => (
                    <line key={`lh${p}`} className={styles.gridLine} x1="0" y1={p} x2={ECHELLE_VIEWBOX} y2={p} />
                  ))}
                </g>
              </g>

              {destinations.map((destination) => {
                const common = {
                  style: shapeStyle(active, destination.key),
                  vectorEffect: "non-scaling-stroke" as const,
                  strokeLinejoin: "round" as const,
                };
                const shapeClassName = `${styles.shape} ${active === destination.key ? styles.shapeActive : ""}`;

                return (
                  <Link
                    key={destination.key}
                    href={destination.href}
                    aria-hidden="true"
                    tabIndex={-1}
                    className={styles.shapeLink}
                    {...interactionProps(destination)}
                  >
                    {destination.key === "commune" ? (
                      <circle {...CERCLE_TERRITOIRE} className={shapeClassName} {...common} />
                    ) : destination.key === "autour" ? (
                      <rect {...CARRE_AUTOUR} className={shapeClassName} {...common} />
                    ) : (
                      <rect {...LOSANGE_LOGEMENT} className={shapeClassName} {...common} />
                    )}
                  </Link>
                );
              })}
              <circle
                cx={ECHELLE_CENTRE}
                cy={ECHELLE_CENTRE}
                r="2.6"
                fill={active === "logement" ? "var(--fg-hi)" : "var(--fg-3)"}
                className="pointer-events-none transition-colors motion-reduce:transition-none"
              />
            </svg>
          ) : null}

          <ol className={`flex flex-col ${addressAvailable ? "lg:mt-4" : ""}`}>
            {destinations.map((destination) => (
              <li key={destination.key}>
                <Link
                  href={destination.href}
                  aria-describedby={hintId}
                  className={`${styles.row} ${active === destination.key ? styles.rowActive : ""}`}
                  {...interactionProps(destination)}
                >
                  <span className="font-mono text-[11px] tabular-nums text-ghost">
                    {destination.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] leading-[1.25] text-label">
                      {destination.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-[1.3] text-ghost">
                      {destination.grain}
                    </span>
                  </span>
                  <span aria-hidden className="text-[13px] text-ghost">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <p id={hintId} className="mt-4 min-h-[2.6em] text-[12px] leading-[1.45] text-muted">
          {hint}
        </p>

        {!addressAvailable ? (
          <div className="mt-4 border-t border-[var(--border-1)] pt-4">
            <p className="text-[12px] leading-[1.5] text-muted">
              Autour de l&apos;adresse et Logement demandent l&apos;analyse d&apos;une adresse précise.
            </p>
            <Link
              href="/dossier"
              onClick={trackAddressRequired}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-label underline decoration-[var(--border-2)] underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--fg-hi)]"
            >
              Analyser une adresse <span aria-hidden>→</span>
            </Link>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
