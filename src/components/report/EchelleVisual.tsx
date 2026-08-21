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

type Echelle = "territoire" | "autour" | "logement";

const LABELS: Record<Echelle, string> = {
  territoire:
    "Échelle Territoire : la commune est mise en évidence autour du secteur et du logement.",
  autour:
    "Échelle Autour : le secteur proche de l'adresse est mis en évidence entre la commune et le logement.",
  logement:
    "Échelle Logement : le logement est mis en évidence au centre du secteur et de la commune.",
};

// LE MÊME DESSIN QUE LE NAVIGATEUR DU HUB, FORMES ET MATIÈRE (`echelle-geometry.ts`).
//
// Cet en-tête dit « vous êtes ici » dans le système qui a servi à venir. Les contours seuls ne
// suffisaient pas : le hub montre un instrument gradué, et un en-tête qui n'en garderait que la
// silhouette donnerait deux objets voisins plutôt qu'un seul. Les graduations de la commune, les
// croix du voisinage et le plan du bâtiment sont donc les mêmes ici, à la même place.
//
// CE REPÈRE N'A QU'UN ÉTAT. Il ne se survole pas et n'ouvre rien : l'échelle active est celle de la
// page, elle ne change jamais sous les yeux du lecteur. Aucune transition n'est donc déclarée.
//
// L'ORANGE A ÉTÉ RETIRÉ D'ICI AUSSI (21/08/2026). Il colorait l'échelle active, et la trame l'aurait
// désormais suivi : la couronne de graduations entière serait passée à l'accent de marque, en tête
// d'un écran où DESIGN.md § 5.4 réserve l'orange au registre « compromis ». Deux raisons, donc, et
// la même conclusion que pour le navigateur du hub : l'état actif passe par le contraste et
// l'épaisseur. Pour revenir en arrière, `ENCRE_ACTIVE` et le remplissage de `styleForme` suffisent.
const ENCRE_ACTIVE = "var(--fg-hi)";
const ENCRE_REPOS = "var(--fg-3)";

const CLE_DE_TRAIT = {
  territoire: "commune",
  autour: "autour",
  logement: "logement",
} as const;

const TRAME_ACTIVE = 0.85;
const TRAME_REPOS = 0.05;

export function EchelleVisual({
  active,
  className = "",
}: {
  active: Echelle;
  className?: string;
}) {
  // Les identifiants de découpe sont dérivés de l'échelle active, pas d'un `useId` : ce composant
  // est rendu sur le serveur, et une page ne porte qu'un en-tête de module.
  const decoupe = (nom: string) => `echelle-visual-${active}-${nom}`;

  const styleForme = (echelle: Echelle) => ({
    fill: active === echelle ? "var(--bg-elev-3)" : "transparent",
    // L'état Territoire porte sur la forme la plus vaste : au même remplissage que les deux formes
    // intérieures, il devenait une masse orange.
    fillOpacity: active === echelle && echelle === "territoire" ? 0.4 : 1,
    stroke: active === echelle ? ENCRE_ACTIVE : "var(--border-2)",
    strokeWidth: active === echelle
      ? TRAIT_ACTIF[CLE_DE_TRAIT[echelle]]
      : TRAIT_REPOS[CLE_DE_TRAIT[echelle]],
  });

  const styleTrame = (echelle: Echelle) => ({
    stroke: active === echelle ? ENCRE_ACTIVE : ENCRE_REPOS,
    fill: active === echelle ? ENCRE_ACTIVE : ENCRE_REPOS,
    opacity: active === echelle ? TRAME_ACTIVE : TRAME_REPOS,
  });

  const traitFin = {
    strokeWidth: 1,
    fill: "none" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      viewBox={`0 0 ${ECHELLE_VIEWBOX} ${ECHELLE_VIEWBOX}`}
      fill="none"
      role="img"
      aria-label={LABELS[active]}
      focusable="false"
      className={className}
    >
      <defs>
        <clipPath id={decoupe("c")}>
          <circle {...CERCLE_TERRITOIRE} />
        </clipPath>
        <clipPath id={decoupe("a")}>
          <rect {...CARRE_AUTOUR} />
        </clipPath>
        <clipPath id={decoupe("l")}>
          <rect {...LOSANGE_LOGEMENT} />
        </clipPath>
        {/* Une fenêtre occulte ce qu'elle recouvre : chaque trame est trouée de la forme suivante,
            contour compris, plutôt que masquée par un aplat qui trancherait sur le fond. */}
        <mask id={decoupe("trou-a")} maskUnits="userSpaceOnUse" x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX}>
          <rect x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX} fill="#fff" />
          <rect {...CARRE_AUTOUR} fill="#000" stroke="#000" strokeWidth="4" />
        </mask>
        <mask id={decoupe("trou-l")} maskUnits="userSpaceOnUse" x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX}>
          <rect x="0" y="0" width={ECHELLE_VIEWBOX} height={ECHELLE_VIEWBOX} fill="#fff" />
          <rect {...LOSANGE_LOGEMENT} fill="#000" stroke="#000" strokeWidth="4" />
        </mask>
      </defs>

      <g
        clipPath={`url(#${decoupe("c")})`}
        mask={`url(#${decoupe("trou-a")})`}
        style={styleTrame("territoire")}
      >
        {RIVE_TERRITOIRE.map((trait, i) => (
          <line key={`rive${i}`} {...trait} {...traitFin} strokeLinecap="round" />
        ))}
        {POINTS_TERRITOIRE.map((point) => (
          <circle key={point.cle} cx={point.cx} cy={point.cy} r="1.6" stroke="none" />
        ))}
      </g>

      <g
        clipPath={`url(#${decoupe("a")})`}
        mask={`url(#${decoupe("trou-l")})`}
        style={styleTrame("autour")}
      >
        {CROIX_AUTOUR.map((croix) => (
          <path key={croix.cle} d={croix.d} {...traitFin} strokeLinecap="round" />
        ))}
      </g>

      <g clipPath={`url(#${decoupe("l")})`} style={styleTrame("logement")}>
        {TRAITS_LOGEMENT.map((p) => (
          <line key={`lv${p}`} x1={p} y1="0" x2={p} y2={ECHELLE_VIEWBOX} {...traitFin} />
        ))}
        {TRAITS_LOGEMENT.map((p) => (
          <line key={`lh${p}`} x1="0" y1={p} x2={ECHELLE_VIEWBOX} y2={p} {...traitFin} />
        ))}
      </g>

      <circle
        {...CERCLE_TERRITOIRE}
        style={styleForme("territoire")}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        {...CARRE_AUTOUR}
        style={styleForme("autour")}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <rect
        {...LOSANGE_LOGEMENT}
        style={styleForme("logement")}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <circle
        cx={ECHELLE_CENTRE}
        cy={ECHELLE_CENTRE}
        r="2.6"
        fill={active === "logement" ? ENCRE_ACTIVE : ENCRE_REPOS}
      />
    </svg>
  );
}
