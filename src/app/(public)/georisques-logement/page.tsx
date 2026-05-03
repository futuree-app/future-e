"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

type GeorisquesLogementResponse = {
  address?: {
    label: string;
    city: string | null;
    citycode: string | null;
    postcode: string | null;
    latitude: number;
    longitude: number;
  };
  parcel?: {
    idu: string;
    parcelCode: string;
    codeInsee: string;
    section: string;
    numero: string;
    prefixe: string;
    contenance: number | null;
    nomCommune: string | null;
  } | null;
  georisques?: {
    address?: {
      risks: { labels: string[]; total: number };
      pprn: { total: number; labels: string[] };
      rga: { code: string | null; label: string | null } | null;
      seismic: { code: string | null; label: string | null } | null;
      granularity: "point";
    } | null;
    parcel?: {
      parcelCode: string;
      risks: { labels: string[]; total: number };
      pprn: { total: number; labels: string[]; zones: string[] };
      rga: { code: string | null; label: string | null } | null;
      seismic: { code: string | null; label: string | null } | null;
      granularity: "parcel";
    } | null;
    commune?: {
      communeName: string | null;
      riskLabels: string[];
      seismic: { code: string | null; label: string | null } | null;
    } | null;
  };
  caveat?: string;
  error?: string;
};

export default function GeorisquesLogementPage() {
  const [query, setQuery] = useState("12 rue de la paix paris");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeorisquesLogementResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/georisques-logement?q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as GeorisquesLogementResponse;

      if (!response.ok) {
        throw new Error(payload.error || `Request failed with status ${response.status}`);
      }

      setResult(payload);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg-1)",
        padding: "32px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Link href="/" style={{ color: "var(--fg-2)", textDecoration: "none" }}>
            futur•e
          </Link>
          <ThemeToggle />
        </div>

        <div
          style={{
            marginBottom: 32,
            padding: 28,
            borderRadius: 16,
            background: "var(--bg-card)",
            border: "1px solid var(--border-1)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 12,
            }}
          >
            Géorisques logement
          </div>
          <h1
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "clamp(28px,4vw,44px)",
              lineHeight: 1.08,
            }}
          >
            Prévisualisation adresse → parcelle → Géorisques
          </h1>
          <p style={{ margin: 0, color: "var(--fg-3)", lineHeight: 1.7 }}>
            Cette page de test montre ce que le backend sait déjà faire pour le futur module logement :
            géocodage BAN, résolution cadastrale et lecture Géorisques communale, au point et par parcelle.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Saisir une adresse"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid var(--border-1)",
              background: "var(--bg-elev)",
              color: "var(--fg-1)",
              padding: "14px 16px",
              fontSize: 15,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: 12,
              border: "1px solid transparent",
              background: "var(--orange)",
              color: "#060812",
              padding: "14px 18px",
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Chargement..." : "Tester"}
          </button>
        </form>

        {error ? (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              borderRadius: 12,
              background: "var(--red-tint)",
              border: "1px solid var(--border-1)",
              color: "var(--fg-1)",
            }}
          >
            {error}
          </div>
        ) : null}

        {result ? (
          <div style={{ display: "grid", gap: 18 }}>
            <Section
              title="Adresse BAN"
              lines={[
                result.address?.label || "n.d.",
                result.address?.citycode ? `INSEE ${result.address.citycode}` : null,
                result.address ? `${result.address.latitude}, ${result.address.longitude}` : null,
              ]}
            />
            <Section
              title="Parcelle cadastrale"
              lines={[
                result.parcel?.parcelCode || "Aucune parcelle résolue",
                result.parcel?.nomCommune || null,
                result.parcel?.contenance ? `${result.parcel.contenance} m²` : null,
              ]}
            />
            <Section
              title="Géorisques parcelle"
              lines={[
                result.georisques?.parcel?.pprn.zones[0] || "Pas de zone PPRN détaillée",
                result.georisques?.parcel?.rga?.label || null,
                result.georisques?.parcel?.seismic?.label || null,
              ]}
              chips={[
                ...(result.georisques?.parcel?.risks.labels || []),
                ...(result.georisques?.parcel?.pprn.labels || []),
              ]}
            />
            <Section
              title="Géorisques commune"
              lines={[
                result.georisques?.commune?.communeName || "n.d.",
                result.georisques?.commune?.seismic?.label || null,
              ]}
              chips={result.georisques?.commune?.riskLabels || []}
            />
            {result.caveat ? (
              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border-1)",
                  color: "var(--fg-3)",
                  lineHeight: 1.7,
                }}
              >
                {result.caveat}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Section({
  title,
  lines,
  chips = [],
}: {
  title: string;
  lines: Array<string | null | undefined>;
  chips?: string[];
}) {
  const safeLines = lines.filter((line): line is string => Boolean(line));

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 14,
        background: "var(--bg-card)",
        border: "1px solid var(--border-1)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {safeLines.length > 0 ? safeLines.map((line) => <div key={line}>{line}</div>) : <div>n.d.</div>}
      </div>
      {chips.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {chips.map((chip) => (
            <span
              key={chip}
              style={{
                display: "inline-flex",
                padding: "7px 10px",
                borderRadius: 999,
                background: "var(--bg-elev)",
                border: "1px solid var(--border-1)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-2)",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
