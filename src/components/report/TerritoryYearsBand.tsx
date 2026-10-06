"use client";

// Bande « la ligne des années » — mémoire du lieu, remplace la cover illustrée.
//
// Toutes les années depuis 1982 (création du régime CatNat) : les années
// calmes en tick fantôme, les années d'arrêté CatNat en chiffres colorés par
// famille d'événement. Des dates, des faits, aucun adjectif, aucune projection.
// Cadrage : docs/cadrage-bande-trajectoire.md (maquette v4 validée porteur,
// puis retrait du nom de commune : il vit déjà au hero et au passeport).
//
// - La bande émerge du fond sombre, sans cadre ni bordure (écart assumé au
//   pattern carte bordée).
// - Animation : UN passage chronologique gauche→droite, DÉCLENCHÉ quand la bande
//   entre dans le viewport (IntersectionObserver), puis figé. Tant qu'elle n'est
//   pas vue, elle reste masquée (le masquage a lieu hors écran, la bande étant sous
//   la synthèse, donc sans flash).
//   prefers-reduced-motion => état final direct (base opacity 1 : sans JS ou sans
//   animation la bande est complète).
// - La légende situe la commune dans la distribution nationale (médiane, p90).

import { useEffect, useRef } from "react";
import { deCommune } from "@/lib/typography";
import type { CatnatBandFamily } from "@/lib/georisques";
import { legendeAnneesCatnat } from "@/lib/catnat-memoire";

const FAMILIES: Record<CatnatBandFamily, { color: string; label: string }> = {
  inondation: { color: "#60a5fa", label: "Inondation / submersion" },
  secheresse: { color: "#d9a441", label: "Sécheresse" },
  tempete: { color: "#a78bfa", label: "Tempête" },
  autre: { color: "#9ba3b4", label: "Mouvement de terrain, autres" },
};
const FAMILY_ORDER: CatnatBandFamily[] = ["inondation", "secheresse", "tempete", "autre"];

const W = 1040;
const H = 187;
const PADX = 8;
const YSTART = 1982;

// FUT-69 : la légende vient de `catnat-memoire.ts` (pure, testée). Elle disait « N années se
// détachent », « de plus en plus rapprochées », et ne donnait le repère national qu'à certaines
// communes ; elle dit ce qui est compté, et le repère passe en ligne secondaire, le même pour toutes.
export function TerritoryYearsBand({
  communeName,
  years,
  ville = null,
}: {
  communeName: string;
  years: { year: number; family: CatnatBandFamily }[];
  /** FUT-69 : « Paris » pour un arrondissement, dont GASPAR ne publie que la ville. */
  ville?: string | null;
}) {
  const rootRef = useRef<HTMLElement>(null);

  const endYear = new Date().getFullYear();
  const n = endYear - YSTART + 1;
  const byYear = new Map(years.filter((y) => y.year >= YSTART).map((y) => [y.year, y.family]));
  const markedYears = [...byYear.keys()].sort((a, b) => a - b);
  const familiesPresent = FAMILY_ORDER.filter((f) => [...byYear.values()].includes(f));
  const legende = legendeAnneesCatnat(markedYears, endYear, ville);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const groups = Array.from(root.querySelectorAll<SVGGElement>("[data-yr]"));

    // Masqué tant que la bande n'est pas entrée dans le viewport, sinon elle serait
    // déjà « jouée » avant que l'utilisateur y arrive. `fill: both` fige l'état final.
    groups.forEach((g) => { g.style.opacity = "0"; });

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      groups.forEach((g) => {
        const i = Number(g.dataset.yr);
        const marked = g.dataset.marked === "1";
        const delay = 300 + i * 145;
        if (marked) {
          g.animate(
            [
              { opacity: 0, transform: "scale(1.45)" },
              { opacity: 1, transform: "scale(1)" },
            ],
            { duration: 1100, delay, easing: "cubic-bezier(.25,.9,.35,1)", fill: "both" },
          );
        } else {
          g.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 750,
            delay,
            easing: "ease-out",
            fill: "both",
          });
        }
      });
    };

    const io = new IntersectionObserver(
      (entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) {
          play();
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef}>
      {/* En-tête : la bande n'a ni cadre ni nom, elle doit être annoncée. */}
      <h2
        className="font-normal italic text-[length:var(--text-section)] leading-[1.25] tracking-[-0.3px] text-label mb-2"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        La mémoire du lieu
      </h2>
      <p className="text-[15px] leading-[1.65] text-muted mb-5">
        Toutes les années depuis {YSTART}. Celles où la commune a été reconnue en état de
        catastrophe naturelle ressortent, à la couleur de l&apos;événement.
      </p>
      <figure style={{ margin: 0 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "5 / 0.9", overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Mémoire ${deCommune(communeName)} : années reconnues en catastrophe naturelle depuis ${YSTART}`}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          {Array.from({ length: n }, (_, i) => {
            const year = YSTART + i;
            const x = PADX + (W - PADX * 2 - 10) * (i / (n - 1));
            const family = byYear.get(year);
            return (
              <g
                key={year}
                data-yr={i}
                data-marked={family ? "1" : "0"}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {family ? (
                  <text
                    x={x}
                    y={H * 0.5}
                    fontFamily="var(--font-mono)"
                    fontSize={15}
                    fontWeight={500}
                    fill={FAMILIES[family].color}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(-90 ${x} ${H * 0.5})`}
                  >
                    <title>{`${year} · ${FAMILIES[family].label}`}</title>
                    {year}
                  </text>
                ) : (
                  <line
                    x1={x}
                    y1={H * 0.36}
                    x2={x}
                    y2={H * 0.64}
                    stroke="var(--border-2)"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}
          <text
            x={PADX}
            y={H * 0.88}
            fontFamily="var(--font-mono)"
            fontSize={9}
            letterSpacing="1.5"
            fill="#6b7388"
          >
            {YSTART}
          </text>
          <text
            x={W - PADX - 10}
            y={H * 0.88}
            fontFamily="var(--font-mono)"
            fontSize={9}
            letterSpacing="1.5"
            fill="#6b7388"
            textAnchor="end"
          >
            {endYear}
          </text>
        </svg>
      </div>
      <figcaption>
        <p className="text-[length:var(--text-dense)] text-muted mt-2 mb-1 ml-0.5">
          {legende.principale}
        </p>
        <p className="text-[12px] text-ghost mb-1.5 ml-0.5">
          {legende.repere}
        </p>
        {familiesPresent.length > 0 && (
          <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 ml-0.5 font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: "#6b7388" }}>
            {familiesPresent.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <i
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-[2px]"
                  style={{ background: FAMILIES[f].color }}
                />
                {FAMILIES[f].label}
              </span>
            ))}
          </div>
        )}
      </figcaption>
      </figure>
    </section>
  );
}
