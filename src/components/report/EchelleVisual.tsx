type Echelle = "territoire" | "autour" | "logement";

const LABELS: Record<Echelle, string> = {
  territoire:
    "Échelle Territoire : la commune est mise en évidence autour du secteur et du logement.",
  autour:
    "Échelle Autour : le secteur proche de l'adresse est mis en évidence entre la commune et le logement.",
  logement:
    "Échelle Logement : le logement est mis en évidence au centre du secteur et de la commune.",
};

const ACTIVE_STYLE = {
  fill: "var(--orange-tint, rgba(232, 130, 58, 0.12))",
  stroke: "var(--orange-ink, #e8823a)",
  strokeWidth: 2,
};

// L'état Territoire porte sur la forme la plus vaste : avec la même opacité que les deux
// formes intérieures, il devenait une masse orange. Le contour garde la même force, seul le
// remplissage est calmé pour obtenir un poids optique comparable entre les trois échelles.
const TERRITORY_ACTIVE_STYLE = {
  ...ACTIVE_STYLE,
  fillOpacity: 0.4,
};

const MUTED_STYLE = {
  fill: "var(--bg-elev, rgba(198, 207, 219, 0.015))",
  stroke: "var(--border-2, rgba(198, 207, 219, 0.22))",
  strokeWidth: 1.5,
};

export function EchelleVisual({
  active,
  className = "",
}: {
  active: Echelle;
  className?: string;
}) {
  const styleFor = (echelle: Echelle) => {
    if (active !== echelle) return MUTED_STYLE;
    return echelle === "territoire" ? TERRITORY_ACTIVE_STYLE : ACTIVE_STYLE;
  };
  const logementActif = active === "logement";

  return (
    <svg
      viewBox="0 0 360 360"
      fill="none"
      role="img"
      aria-label={LABELS[active]}
      focusable="false"
      className={className}
    >
      <g transform="translate(180 180)">
        <path
          d="M-8 -160 C44 -164 99 -144 132 -108 C157 -79 164 -32 157 9 C153 56 132 102 92 132 C57 159 8 168 -39 158 C-89 150 -131 119 -151 78 C-169 42 -166 -8 -154 -49 C-143 -94 -107 -135 -62 -151 C-42 -158 -24 -160 -8 -160 Z"
          style={styleFor("territoire")}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        <rect
          x="-88"
          y="-88"
          width="176"
          height="176"
          rx="22"
          style={styleFor("autour")}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        <rect
          x={logementActif ? -48 : -43}
          y={logementActif ? -48 : -43}
          width={logementActif ? 96 : 86}
          height={logementActif ? 96 : 86}
          rx={logementActif ? 13 : 12}
          transform="rotate(45)"
          style={styleFor("logement")}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {logementActif && (
          <circle
            r="4.5"
            fill="var(--orange-ink, #e8823a)"
          />
        )}
      </g>
    </svg>
  );
}
