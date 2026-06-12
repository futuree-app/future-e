// Passeport territorial — bloc 2, sous TerritoryCover.
// Pas une fiche de données neutre : un objet à part, sur une surface teintée à la
// couleur du territoire (même palette que la cover), grand nom de commune, code
// INSEE en numéro de document, pictos 1px. La cover est la photo, ceci est la
// page de données. Présentation seule (props sérialisables).

import type { ReactNode } from "react";
import type { TerritoryIdentity } from "@/lib/territory-identity";
import type { TerritoryType } from "@/lib/territory-mood";

// ── Pictos filaires 1px (stroke = currentColor) ───────────────────────────────
const ICON: Record<string, ReactNode> = {
  type: (
    <path d="M2 11c2 0 2-2 4-2s2 2 4 2 2-2 4-2M2 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2" />
  ),
  role: <path d="M2 13V5l5-3 5 3v8M5 13V8h4v5" />,
  population: <path d="M5 6.5a2 2 0 100-4 2 2 0 000 4zM2 13c0-2 1.5-3 3-3s3 1 3 3M10 6.2a1.6 1.6 0 100-3.2M9 9.6c1.5 0 3 1 3 3.4" />,
  densite: <path d="M2.5 2.5h3v3h-3zM8.5 2.5h3v3h-3zM2.5 8.5h3v3h-3zM8.5 8.5h3v3h-3z" />,
  geo: <path d="M7 1.8c2.3 0 4 1.7 4 3.9 0 2.7-4 7-4 7s-4-4.3-4-7c0-2.2 1.7-3.9 4-3.9zM7 7.2a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2z" />,
  sol: <path d="M7 2l5 2.6-5 2.6-5-2.6L7 2zM2 7.4l5 2.6 5-2.6M2 10.2l5 2.6 5-2.6" />,
};

function Picto({ kind, color }: { kind: string; color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {ICON[kind]}
    </svg>
  );
}

// ── Sceau territorial : glyphe propre à la typologie, dans un anneau. C'est
// l'élément signature, reconnaissable même sans le texte. ──────────────────────
const SEAL_GLYPH: Record<TerritoryType, ReactNode> = {
  littoral_atlantique: <path d="M9 19c2 0 2-2 4-2s2 2 4 2 2-2 4-2M9 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2" />,
  mediterraneen: (
    <g>
      <circle cx="16" cy="16" r="3.4" />
      <path d="M16 9v2.2M16 20.8V23M9 16h2.2M20.8 16H23M11 11l1.6 1.6M21.4 21.4 20 20M21.4 10.6 20 12M11 21l1.6-1.6" />
    </g>
  ),
  montagne: <path d="M8 21l4-7 3 4 2-3 7 6z" />,
  plaine: <path d="M8 13h16M8 16.5h16M8 20h16" />,
};

// Cachet de cire : matière MATE, lie-de-vin profond. Bord à micro-imperfection
// (turbulence/displacement légers, pas un effet), reflets et ombres en tons vin
// (pas de blanc/noir purs qui font « badge brillant »), glyphe gravé dans la cire.
const WAX = "#6a2d3a"; // lie-de-vin désaturé
function Seal({ type }: { type: TerritoryType }) {
  return (
    <svg
      width="53"
      height="53"
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden
      style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.4))" }}
    >
      <defs>
        <filter id="waxEdge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Reflet/ombre en tons vin : doux, mat, pas spéculaire. */}
        <radialGradient id="waxSheen" cx="40%" cy="34%" r="82%">
          <stop offset="0%" stopColor="#9c4a59" stopOpacity="0.4" />
          <stop offset="48%" stopColor={WAX} stopOpacity="0" />
          <stop offset="100%" stopColor="#2a0f17" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      {/* galette de cire au bord organique */}
      <g filter="url(#waxEdge)">
        <circle cx="26" cy="26" r="21" fill={WAX} />
        <circle cx="26" cy="26" r="21" fill="url(#waxSheen)" />
      </g>
      {/* liseré pressé dans la cire (discret) */}
      <circle cx="26" cy="26" r="16.5" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      <circle cx="26" cy="25.4" r="16.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
      {/* glyphe gravé : ombre dessous, lumière atténuée dessus */}
      <g transform="translate(10,10)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(0,0.7)" stroke="rgba(0,0,0,0.45)" strokeWidth="1.4">{SEAL_GLYPH[type]}</g>
        <g transform="translate(0,-0.4)" stroke="rgba(255,255,255,0.3)" strokeWidth="1">{SEAL_GLYPH[type]}</g>
      </g>
    </svg>
  );
}

export function TerritoryIdentityCard({
  communeName,
  inseeCode,
  identity,
  territoryType,
  tint,
  accent,
}: {
  communeName: string;
  inseeCode: string | null;
  identity: TerritoryIdentity;
  territoryType: TerritoryType;
  tint: string;
  accent: string;
}) {
  const fields: { kind: string; label: string; value: string }[] = [];
  fields.push({ kind: "type", label: "Type", value: identity.typologie });
  if (identity.role) fields.push({ kind: "role", label: "Rôle", value: identity.role });
  if (identity.population) fields.push({ kind: "population", label: "Population", value: identity.population });
  if (identity.densite) fields.push({ kind: "densite", label: "Densité", value: identity.densite.label });
  if (identity.geo) fields.push({ kind: "geo", label: "Position", value: identity.geo });
  if (identity.solDominant) fields.push({ kind: "sol", label: "Occupation des sols", value: identity.solDominant });

  return (
    <section
      className="rounded-2xl px-7 py-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(150deg, ${tint}1f 0%, ${tint}0a 55%, rgba(8,10,18,0.6) 100%)`,
        border: `1px solid ${tint}33`,
        boxShadow: `inset 0 1px 0 ${tint}1f`,
      }}
    >
      {/* En-tête : type de document à gauche, sceau + certification à droite */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: accent }}>
            Passeport territorial
          </p>
          {inseeCode && (
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mt-1">Commune N° {inseeCode}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Seal type={territoryType} />
          <p className="text-right font-mono text-[9px] tracking-[0.1em] uppercase text-ghost/70">
            Sources · INSEE / OSO
          </p>
        </div>
      </div>

      {/* Identifiant : le nom de la commune, en grand, comme sur une pièce d'identité */}
      <h3
        className="font-normal uppercase text-[clamp(28px,4.2vw,42px)] leading-[1.0] tracking-[0.01em] text-label"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {communeName}
      </h3>
      <p className="text-[15px] leading-[1.55] text-muted mt-3 max-w-[44rem]">{identity.summary}</p>

      {/* Champs du passeport */}
      <dl
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mt-5 pt-2 border-t"
        style={{ borderColor: `${tint}26` }}
      >
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="mt-0.5">
              <Picto kind={f.kind} color={accent} />
            </span>
            <div className="min-w-0">
              <dt className="font-mono text-[9px] tracking-[0.14em] uppercase text-ghost mb-1">{f.label}</dt>
              <dd className="text-[14px] text-label leading-snug">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
