"use client";

import { useHorizon, HORIZON_META } from "@/hooks/useHorizon";

// ─── Types ────────────────────────────────────────────────────────────────────

type GwlScenarios = Record<string, { h: string; v: Record<string, number> }>;
type Factor = { label: string; val: string; col: string; src: string; missing: boolean };

type SharedProps = {
  communeName: string;
  scenarios: GwlScenarios | null;
  pm25: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(v: number | undefined | null) {
  return v != null ? Math.round(v) : null;
}

function buildFactors(gwlData: Record<string, number> | null | undefined, pm25: number | null | undefined, horizonKey: string): Factor[] {
  const meta = HORIZON_META[horizonKey as keyof typeof HORIZON_META] ?? HORIZON_META.gwl20;
  const heatDays = r(gwlData?.["NORTX35D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const fireDays = r(gwlData?.["NORIFM40_yr"]);

  return [
    {
      label: "Jours de chaleur extrême",
      val: heatDays != null ? `${heatDays} jours/an en ${meta.year}` : "—",
      col: "var(--red)",
      src: `DRIAS / Météo-France · France ${meta.france}`,
      missing: heatDays == null,
    },
    {
      label: "Nuits tropicales",
      val: tropicalNights != null ? `${tropicalNights} nuits/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: "DRIAS / Météo-France · Tmin > 20°C",
      missing: tropicalNights == null,
    },
    {
      label: "Qualité de l'air",
      val: pm25 != null ? `${pm25} µg/m³ (PM2.5 annuel)` : "—",
      col: "var(--blue)",
      src: "ADEME / données territoires",
      missing: pm25 == null,
    },
    {
      label: "Risque incendie",
      val: fireDays != null ? `${fireDays} jours/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: "DRIAS · indice météo-feu > 40",
      missing: fireDays == null,
    },
  ];
}

function buildParagraphs(communeName: string, gwlData: Record<string, number> | null | undefined, pm25: number | null | undefined, horizonKey: string): string[] {
  const meta = HORIZON_META[horizonKey as keyof typeof HORIZON_META] ?? HORIZON_META.gwl20;
  const heatDays = r(gwlData?.["NORTX35D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const fireDays = r(gwlData?.["NORIFM40_yr"]);

  const paragraphs: string[] = [];

  if (heatDays != null) {
    let p = `La chaleur d'abord : ${communeName} atteindrait ${heatDays} jour${heatDays > 1 ? "s" : ""} par an de chaleur extrême (Tmax > 35°C) à l'horizon ${meta.year}, dans le scénario France ${meta.france}. Ce n'est pas un basculement abstrait. Ce sont des étés qui deviennent plus longs, plus lourds et plus difficiles à traverser.`;
    if (tropicalNights != null) {
      p += ` Les nuits ne rafraîchissent plus : ${tropicalNights} nuit${tropicalNights > 1 ? "s" : ""} tropicale${tropicalNights > 1 ? "s" : ""} par an sont attendues (Tmin > 20°C).`;
    }
    paragraphs.push(p);
  } else if (!gwlData) {
    paragraphs.push(
      `Les projections climatiques pour ${communeName} ne sont pas encore disponibles dans notre base DRIAS. Cette commune sera intégrée lors de la prochaine mise à jour.`,
    );
  }

  const airParts: string[] = [];
  if (pm25 != null) airParts.push(`la qualité de l'air affiche ${pm25} µg/m³ de PM2.5 en moyenne annuelle`);
  if (fireDays != null && fireDays > 2)
    airParts.push(`le risque météo-feu dépasse le seuil critique ${fireDays} jour${fireDays > 1 ? "s" : ""} par an en ${meta.year}`);
  if (airParts.length > 0) {
    paragraphs.push(
      airParts
        .map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s))
        .join(", et ") + ".",
    );
  }

  paragraphs.push(
    "Ce module lit ce qui change autour de chez vous. Il ne dit pas encore comment ces changements croisent votre logement précis, votre budget ou votre santé. C'est la suite du rapport qui prend le relais.",
  );

  return paragraphs;
}

// ─── Aside (panneau héro droit) ───────────────────────────────────────────────

export function QuartierAside({ communeName, scenarios, pm25 }: SharedProps) {
  const [horizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const gwlData = scenarios?.[horizon]?.v ?? null;
  const factors = buildFactors(gwlData, pm25, horizon);

  return (
    <aside className="glass rounded-2xl p-7">
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">Lecture territoriale</p>
      <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {communeName}, horizon {meta.year}.
      </h2>
      <div className="flex flex-col gap-2.5">
        {factors.map((f) => (
          <div
            key={f.label}
            className="flex gap-3.5 items-start px-3.5 py-3 rounded-lg"
            style={{
              background: f.missing ? "var(--ghost)08" : `${f.col}0c`,
              border: `1px solid ${f.missing ? "var(--ghost)" : f.col}22`,
              opacity: f.missing ? 0.5 : 1,
            }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]"
              style={{ background: f.missing ? "var(--ghost)" : f.col, boxShadow: f.missing ? "none" : `0 0 8px ${f.col}` }}
            />
            <div>
              <div className="text-[13px] font-medium text-label mb-0.5 leading-[1.3]">{f.label}</div>
              <div className="font-mono text-[10px] tracking-[0.04em]" style={{ color: f.missing ? "var(--ghost)" : f.col }}>{f.val}</div>
              <div className="font-mono text-[10px] text-ghost tracking-[0.04em]">{f.src}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ─── DataBody (bloc principal de données) ─────────────────────────────────────

export function QuartierDataBody({ communeName, scenarios, pm25 }: SharedProps) {
  const [horizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const gwlData = scenarios?.[horizon]?.v ?? null;
  const factors = buildFactors(gwlData, pm25, horizon);
  const paragraphs = communeName ? buildParagraphs(communeName, gwlData, pm25, horizon) : [];

  return (
    <div className="glass rounded-xl p-8 border-t-2 border-t-info">
      <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {communeName}, à l&apos;horizon {meta.year} — scénario France {meta.france}.
      </h3>
      {paragraphs.length > 0 ? (
        paragraphs.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.75] text-muted mb-4">{p}</p>
        ))
      ) : (
        <p className="text-[16px] leading-[1.75] text-muted mb-4">
          Renseignez votre commune dans votre profil pour accéder aux projections climatiques de votre territoire.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5 mt-6">
        {factors.map((f) => (
          <div key={f.label} className="glass rounded-lg p-4" style={{ opacity: f.missing ? 0.45 : 1 }}>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: f.missing ? "var(--ghost)" : f.col, boxShadow: f.missing ? "none" : `0 0 6px ${f.col}` }}
              />
              <span className="text-[13px] font-medium text-label leading-[1.3]">{f.label}</span>
            </div>
            <span className="block font-mono text-[11px] tracking-[0.02em] ml-3.5" style={{ color: f.missing ? "var(--ghost)" : f.col }}>{f.val}</span>
            <span className="block font-mono text-[10px] text-ghost tracking-[0.02em] ml-3.5">{f.src}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
