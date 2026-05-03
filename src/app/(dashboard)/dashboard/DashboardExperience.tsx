"use client";

import { useEffect, useState } from "react";

type DashboardExperienceProps = {
  interactive: boolean;
  householdMode: boolean;
};

type DriasScenarioPayload = {
  h: string;
  v: Record<string, number>;
};

type DriasPayload = {
  inseeCode: string;
  commune: {
    n: string;
    s: Record<string, DriasScenarioPayload>;
  };
};

type GeorisquesPayload = {
  inseeCode: string;
  communeName: string | null;
  riskLabels: string[];
  flags: {
    flood: boolean;
    marineSubmersion: boolean;
    landslide: boolean;
    clay: boolean;
    storm: boolean;
    seismic: boolean;
  };
  seismic: {
    code: string | null;
    label: string | null;
  } | null;
};

const DEFAULT_INSEE = "17300";

const SCENARIOS = {
  optimistic: {
    id: "gwl15",
    year: 2030,
    label: "Accords tenus",
    temp: "+1.5°C",
    color: "var(--green)",
  },
  median: {
    id: "gwl20",
    year: 2050,
    label: "Trajectoire actuelle",
    temp: "+2.7°C",
    color: "var(--orange)",
  },
  pessimistic: {
    id: "gwl30",
    year: 2100,
    label: "Statu quo",
    temp: "+4°C",
    color: "var(--red)",
  },
} as const;

function formatValue(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n.d.";
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function getHeatStatus(hotDays: number | null | undefined) {
  if (hotDays === null || hotDays === undefined) {
    return { badge: "À compléter", mobility: "À préciser", projects: "2", work: "Variable" };
  }

  if (hotDays < 15) {
    return { badge: "Faible", mobility: "Tenable", projects: "2", work: "Sous contrôle" };
  }

  if (hotDays < 35) {
    return { badge: "Modéré", mobility: "Fragile", projects: "3", work: "Sous tension" };
  }

  return { badge: "Élevé", mobility: "Sous pression", projects: "5", work: "Exposé" };
}

export function DashboardExperience({
  interactive,
  householdMode,
}: DashboardExperienceProps) {
  const [scenario, setScenario] =
    useState<keyof typeof SCENARIOS>("median");
  const [payload, setPayload] = useState<DriasPayload | null>(null);
  const [georisques, setGeorisques] = useState<GeorisquesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadQuartierData() {
      setLoading(true);
      setError("");

      try {
        const [driasResponse, georisquesResponse] = await Promise.all([
          fetch(`/drias?insee=${DEFAULT_INSEE}`),
          fetch(`/georisques?insee=${DEFAULT_INSEE}`),
        ]);

        if (!driasResponse.ok) {
          throw new Error(`DRIAS request failed with status ${driasResponse.status}`);
        }

        if (!georisquesResponse.ok) {
          throw new Error(
            `Géorisques request failed with status ${georisquesResponse.status}`,
          );
        }

        const [nextPayload, nextGeorisques] = await Promise.all([
          driasResponse.json() as Promise<DriasPayload>,
          georisquesResponse.json() as Promise<GeorisquesPayload>,
        ]);

        if (!cancelled) {
          setPayload(nextPayload);
          setGeorisques(nextGeorisques);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les projections DRIAS compactes.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuartierData();

    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveScenario = interactive ? scenario : "median";
  const currentScenario = SCENARIOS[effectiveScenario];
  const availableScenario =
    payload?.commune?.s?.[currentScenario.id] || null;

  const summerTemp = availableScenario?.v?.NORTMm_seas_JJA ?? null;
  const hotDays = availableScenario?.v?.NORTX30D_yr ?? null;
  const tropicalNights = availableScenario?.v?.NORTR_yr ?? null;
  const heatStatus = getHeatStatus(hotDays);
  const communeName = payload?.commune?.n || "La Rochelle";
  const georisquesLines = georisques?.riskLabels?.slice(0, 2) || [];
  const georisquesPrimary = georisques?.flags?.marineSubmersion
    ? "Submersion marine recensée"
    : georisques?.flags?.flood
      ? "Inondation recensée"
      : georisques?.flags?.clay
        ? "Argiles recensées"
        : georisques?.flags?.landslide
          ? "Terrain recensé"
          : "Pas de signal Géorisques mis en avant";
  const seismicLabel = georisques?.seismic?.label || "Zone sismique non disponible";

  const modules = [
    {
      id: "quartier",
      title: "Ton quartier",
      subtitle: `${communeName} · DRIAS + Géorisques`,
      badge: heatStatus.badge,
      color: "var(--blue)",
      main: `${formatValue(summerTemp, 1)}°C`,
      label: "température moyenne d'été",
      points: [
        `${formatValue(hotDays, 0)} jours > 30°C / an`,
        georisquesPrimary,
        `${seismicLabel}`,
      ],
    },
    {
      id: "sante",
      title: "Ta santé",
      subtitle: "Stress thermique",
      badge: heatStatus.badge,
      color: "var(--red)",
      main: `${formatValue(hotDays, 0)}j`,
      label: "chaleur forte / an",
      points: [
        `${formatValue(tropicalNights, 0)} nuits chaudes persistantes`,
        `Lecture ${currentScenario.temp} à horizon ${currentScenario.year}`,
        "Base climat réelle, lecture santé encore éditoriale",
      ],
    },
    {
      id: "logement",
      title: "Ton logement",
      subtitle: "Confort d'été",
      badge: heatStatus.badge,
      color: "var(--orange)",
      main: `${formatValue(tropicalNights, 0)}n`,
      label: "nuits tropicales / an",
      points: [
        `${formatValue(summerTemp, 1)}°C en moyenne l'été`,
        "Le confort nocturne devient un vrai sujet",
        "Isolation et inertie à regarder en priorité",
      ],
    },
    {
      id: "metier",
      title: "Ton métier",
      subtitle: "Exposition chaleur",
      badge: heatStatus.badge,
      color: "var(--violet)",
      main: heatStatus.work,
      label: "pression climatique",
      points: [
        "Les métiers extérieurs prennent plus de risque",
        "Les métiers de bureau dépendent surtout du bâti",
        "La lecture sectorielle détaillée reste à brancher",
      ],
    },
    {
      id: "mobilite",
      title: "Ta mobilité",
      subtitle: "Tenue du quotidien",
      badge: heatStatus.badge,
      color: "var(--green)",
      main: heatStatus.mobility,
      label: "tenue en été",
      points: [
        `${formatValue(hotDays, 0)} jours très chauds perturbent déjà les trajets`,
        "Voiture, vélo, TER ne réagissent pas pareil aux fortes chaleurs",
        "Le détail réseau local reste à brancher",
      ],
    },
    {
      id: "projets",
      title: "Tes projets",
      subtitle: "Arbitrages à prévoir",
      badge: heatStatus.badge,
      color: "var(--yellow)",
      main: heatStatus.projects,
      label: "points d'attention",
      points: [
        "Achat, travaux et confort d'été deviennent liés",
        "Les scénarios changent le niveau de prudence à adopter",
        "Le rapport complet détaillera les arbitrages concrets",
      ],
    },
  ];

  const synthesis = loading
    ? "Chargement des projections climatiques compactes..."
    : error
      ? "Les projections compactes n'ont pas pu être lues pour le moment."
      : `À ${communeName}, en ${currentScenario.year}, scénario ${currentScenario.label.toLowerCase()}, la lecture climat montre ${formatValue(
          hotDays,
          0,
        )} jours à plus de 30°C par an, ${formatValue(
          tropicalNights,
          0,
        )} nuits tropicales et une température moyenne d'été de ${formatValue(
          summerTemp,
          1,
        )}°C. Côté risques officiels, ${
          georisquesLines.length > 0
            ? georisquesLines.join(" · ")
            : "aucun signal Géorisques prioritaire n'est remonté ici"
        }. La chaleur reste le signal le plus structurant, mais elle se lit désormais avec la trame territoriale réelle du quartier.`;

  return (
    <div className="proto-shell">
      <style>{`
        .proto-shell {
          margin-top: 24px;
          padding: 24px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, var(--orange-tint), transparent 32%),
            radial-gradient(circle at top right, var(--red-tint), transparent 28%),
            var(--bg);
          color: var(--fg-hi);
          border: 1px solid var(--border-1);
        }
        .proto-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }
        .proto-brand {
          font-size: 22px;
          font-style: italic;
          color: var(--fg-hi);
        }
        .proto-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .proto-chip {
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--bg-elev-2);
          border: 1px solid var(--border-1);
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }
        .proto-hero {
          margin-bottom: 24px;
        }
        .proto-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 12px;
        }
        .proto-title {
          margin: 0 0 10px;
          font-size: clamp(30px, 4vw, 54px);
          line-height: 1.02;
          color: var(--fg-hi);
        }
        .proto-subtitle {
          margin: 0;
          max-width: 740px;
          color: rgba(255,255,255,0.62);
          line-height: 1.6;
        }
        .proto-controls {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 16px;
          border-radius: 18px;
          background: var(--bg-elev-2);
          border: 1px solid var(--border-1);
        }
        .proto-control-block {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .proto-control-label {
          margin-right: 6px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.42);
        }
        .proto-control-btn {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border-2);
          background: transparent;
          color: rgba(255,255,255,0.72);
          cursor: pointer;
        }
        .proto-control-btn[data-active="true"] {
          border-color: var(--orange-ring);
          background: var(--orange-tint);
          color: var(--orange);
        }
        .proto-control-btn[data-disabled="true"] {
          opacity: 0.42;
          cursor: not-allowed;
        }
        .proto-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .proto-card {
          position: relative;
          overflow: hidden;
          padding: 22px;
          border-radius: 22px;
          background: var(--bg-elev-2);
          border: 1px solid var(--border-1);
        }
        .proto-card::after {
          content: "";
          position: absolute;
          inset: auto -10% -30% auto;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--border-2), transparent 70%);
          opacity: 0.5;
          pointer-events: none;
        }
        .proto-card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .proto-card-title {
          margin: 0 0 4px;
          font-size: 18px;
          color: var(--fg-hi);
        }
        .proto-card-sub {
          margin: 0;
          font-size: 12px;
          color: rgba(255,255,255,0.46);
        }
        .proto-badge {
          padding: 4px 8px;
          border-radius: 999px;
          background: var(--border-1);
          border: 1px solid var(--border-2);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .proto-main {
          margin: 0 0 14px;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .proto-main-label {
          margin: 0 0 16px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .proto-points {
          display: grid;
          gap: 8px;
        }
        .proto-point {
          padding-top: 8px;
          border-top: 1px solid var(--border-1);
          font-size: 13px;
          color: rgba(255,255,255,0.78);
        }
        .proto-synthesis {
          margin-top: 22px;
          padding: 24px;
          border-radius: 22px;
          background: var(--bg-elev-2);
          border: 1px solid var(--border-1);
        }
        .proto-synthesis-text {
          margin: 0;
          color: rgba(255,255,255,0.88);
          line-height: 1.7;
          font-size: 18px;
        }
        .proto-note {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 16px;
          background: var(--orange-tint);
          color: var(--orange-soft);
          border-left: 3px solid var(--orange);
          line-height: 1.6;
        }
        @media (max-width: 1100px) {
          .proto-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .proto-shell {
            padding: 18px;
            border-radius: 20px;
          }
          .proto-topbar,
          .proto-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .proto-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="proto-topbar">
        <div className="proto-brand">
          futur<span style={{ color: "var(--orange)", fontStyle: "normal" }}>•</span>e
        </div>
        <div className="proto-meta">
          <div className="proto-chip">{communeName} · {DEFAULT_INSEE}</div>
          <div className="proto-chip">
            {interactive ? "dashboard interactif" : "lecture seule"}
          </div>
          {householdMode ? <div className="proto-chip">mode foyer actif</div> : null}
          {availableScenario ? (
            <div className="proto-chip">
              point DRIAS {availableScenario.h}
            </div>
          ) : null}
        </div>
      </div>

      <div className="proto-hero">
        <p className="proto-kicker">· projections climatiques compactes ·</p>
        <h2 className="proto-title">
          À l&apos;horizon <span style={{ color: "var(--orange)" }}>{currentScenario.year}</span>, scénario{" "}
          <span style={{ color: currentScenario.color }}>
            {currentScenario.label.toLowerCase()}
          </span>
        </h2>
        <p className="proto-subtitle">
          La landing lit maintenant `gwl20` compact. Ce dashboard lit les trois
          scénarios DRIAS compacts, commune par commune, sans dépendre du gros
          stockage Postgres.
        </p>
      </div>

      <div className="proto-controls">
        <div className="proto-control-block">
          <span className="proto-control-label">Scénario</span>
          {Object.entries(SCENARIOS).map(([key, value]) => {
            const disabled = !interactive;
            const active = scenario === key;

            return (
              <button
                key={key}
                className="proto-control-btn"
                data-active={active}
                data-disabled={disabled}
                disabled={disabled}
                onClick={() => setScenario(key as keyof typeof SCENARIOS)}
              >
                {value.temp}
              </button>
            );
          })}
        </div>

        <div className="proto-control-block">
          <span className="proto-control-label">Horizon</span>
          {Object.values(SCENARIOS).map((value) => {
            const active = currentScenario.year === value.year;

            return (
              <button
                key={value.year}
                className="proto-control-btn"
                data-active={active}
                data-disabled="true"
                disabled
              >
                {value.year}
              </button>
            );
          })}
        </div>
      </div>

      <div className="proto-grid">
        {modules.map((module) => (
          <section key={module.id} className="proto-card">
            <div
              style={{
                position: "absolute",
                inset: "auto -12% -28% auto",
                width: 170,
                height: 170,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${module.color}30 0%, transparent 70%)`,
                filter: "blur(28px)",
                pointerEvents: "none",
              }}
            />
            <div className="proto-card-head">
              <div>
                <h3 className="proto-card-title">{module.title}</h3>
                <p className="proto-card-sub">{module.subtitle}</p>
              </div>
              <div
                className="proto-badge"
                style={{
                  color: module.color,
                  borderColor: `${module.color}44`,
                  background: `${module.color}16`,
                }}
              >
                {module.badge}
              </div>
            </div>
            <p className="proto-main" style={{ color: module.color }}>
              {module.main}
            </p>
            <p className="proto-main-label">{module.label}</p>
            <div className="proto-points">
              {module.points.map((point) => (
                <div key={point} className="proto-point">
                  {point}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="proto-synthesis">
        <p className="proto-kicker">· synthèse ·</p>
        <p className="proto-synthesis-text">{synthesis}</p>

        {error ? <div className="proto-note">{error}</div> : null}

        {!interactive ? (
          <div className="proto-note">
            Le plan one-shot reste verrouillé sur la lecture `gwl20` 2050. Les
            plans Suivi et Foyer peuvent comparer `gwl15`, `gwl20` et `gwl30`.
          </div>
        ) : null}
      </div>
    </div>
  );
}
