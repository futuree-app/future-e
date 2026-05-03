"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

// ── Response type ─────────────────────────────────────────────────────────────

type ApiResponse = {
  error?: string;
  address?: {
    label: string;
    city: string | null;
    citycode: string | null;
    postcode: string | null;
    latitude: number;
    longitude: number;
  };
  altitude?: number | null;
  parcel?: {
    parcelCode: string;
    nomCommune: string | null;
    contenance: number | null;
  } | null;
  dpe?: {
    id_dpe: string;
    date_dpe: string | null;
    etiquette_dpe: string | null;
    etiquette_ges: string | null;
    conso_ep_m2: number | null;
    emission_ges_m2: number | null;
    surface_m2: number | null;
    annee_construction: number | null;
    type_batiment: string | null;
    adresse: string | null;
  } | null;
  audit?: {
    n_audit: string;
    date_audit: string | null;
    classe_dpe_actuel: string | null;
    scenarios: Array<{
      categorie: string | null;
      etape: string | null;
      travaux: string | null;
      conso_ep: number | null;
      emission_ges: number | null;
    }>;
  } | null;
  zfe?: {
    inZfe: boolean;
    zones: Array<{
      id: string;
      nom: string;
      vp_critair: string | null;
      deux_rm_critair: string | null;
      date_debut: string | null;
      date_fin: string | null;
    }>;
  } | null;
  irep?: {
    count: number;
    installations: Array<{
      id: number;
      nom: string;
      distanceM: number;
      nombre_polluants: number;
      milieu_emission: string | null;
    }>;
  } | null;
  cartofriches?: {
    count: number;
    friches: Array<{
      id: string;
      nom: string;
      type: string | null;
      statut: string | null;
      sol_pollue: boolean;
      activite: string | null;
      distanceM: number | null;
    }>;
  } | null;
  atmo?: {
    inseeCode: string;
    date: string;
    index: { value: number; label: string; color: string };
    pollutants: {
      pm25: { value: number; label: string } | null;
      pm10: { value: number; label: string } | null;
      no2: { value: number; label: string } | null;
      o3: { value: number; label: string } | null;
    };
  } | null;
  eaufrance?: {
    drinkingWater: {
      conformBacterio: boolean | null;
      conformPhysicoChem: boolean | null;
      lastSampleDate: string | null;
      nitrates: number | null;
    } | null;
    drought: {
      riverName: string | null;
      status: string | null;
      isDry: boolean;
    } | null;
  } | null;
  georisques?: {
    address?: {
      risks: { labels: string[] };
      pprn: { labels: string[] };
      rga: { code: string | null; label: string | null } | null;
      seismic: { code: string | null; label: string | null } | null;
    } | null;
    parcel?: {
      parcelCode: string;
      risks: { labels: string[] };
      pprn: { labels: string[]; zones: string[] };
      rga: { code: string | null; label: string | null } | null;
      seismic: { code: string | null; label: string | null } | null;
    } | null;
    commune?: {
      communeName: string | null;
      riskLabels: string[];
      seismic: { code: string | null; label: string | null } | null;
    } | null;
  };
  caveat?: string;
};

// ── DPE helpers ───────────────────────────────────────────────────────────────

const DPE_COLORS: Record<string, string> = {
  A: "#319334", B: "#33cc33", C: "#cbee39",
  D: "#ffff00", E: "#fbad26", F: "#f15a27", G: "#ed1c24",
};

function DpeBadge({ label }: { label: string | null }) {
  if (!label) return <span style={{ color: "var(--fg-4)" }}>n.d.</span>;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32, height: 32,
      borderRadius: 6,
      background: DPE_COLORS[label] ?? "var(--bg-elev)",
      color: ["A","B","C"].includes(label) ? "#060812" : "#060812",
      fontWeight: 700,
      fontSize: 15,
    }}>{label}</span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GeorisquesLogementPage() {
  const [query, setQuery]   = useState("12 rue de la paix paris");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res     = await fetch(`/api/georisques-logement?q=${encodeURIComponent(query)}`);
      const payload = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setResult(payload);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg-1)", padding: "32px 20px 80px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link href="/" style={{ color: "var(--fg-2)", textDecoration: "none" }}>futur•e</Link>
          <ThemeToggle />
        </div>

        <div style={{ marginBottom: 32, padding: 28, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 12 }}>
            Module logement
          </div>
          <h1 style={{ margin: "0 0 12px", fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.08 }}>
            Prévisualisation complète — adresse → données logement
          </h1>
          <p style={{ margin: 0, color: "var(--fg-3)", lineHeight: 1.7 }}>
            DPE, audit énergétique, ZFE, qualité de l&apos;air, eau, sites industriels, friches, risques naturels — toutes les sources agrégées en une requête.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 24 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Saisir une adresse"
            style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border-1)", background: "var(--bg-elev)", color: "var(--fg-1)", padding: "14px 16px", fontSize: 15 }}
          />
          <button type="submit" disabled={loading} style={{ borderRadius: 12, border: "1px solid transparent", background: "var(--orange)", color: "#060812", padding: "14px 18px", fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Chargement..." : "Tester"}
          </button>
        </form>

        {error && (
          <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: "var(--red-tint)", border: "1px solid var(--border-1)", color: "var(--fg-1)" }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ display: "grid", gap: 14 }}>

            {/* Adresse + Altitude */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "start" }}>
              <Section title="Adresse BAN" lines={[
                result.address?.label,
                result.address?.citycode ? `INSEE ${result.address.citycode}` : null,
                result.address ? `${result.address.latitude}, ${result.address.longitude}` : null,
              ]} />
              {result.altitude != null && (
                <Section title="Altitude IGN" lines={[`${result.altitude} m NGF`]} />
              )}
            </div>

            {/* Parcelle */}
            <Section title="Parcelle cadastrale" lines={[
              result.parcel?.parcelCode ?? "Aucune parcelle résolue",
              result.parcel?.nomCommune ?? null,
              result.parcel?.contenance ? `${result.parcel.contenance} m²` : null,
            ]} />

            {/* DPE */}
            {result.dpe !== undefined && (
              <Card title="DPE logement">
                {result.dpe ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <DpeBadge label={result.dpe.etiquette_dpe} />
                      <span style={{ color: "var(--fg-3)", fontSize: 13 }}>énergie</span>
                      <DpeBadge label={result.dpe.etiquette_ges} />
                      <span style={{ color: "var(--fg-3)", fontSize: 13 }}>GES</span>
                    </div>
                    <DataGrid items={[
                      result.dpe.surface_m2 ? `${result.dpe.surface_m2} m²` : null,
                      result.dpe.annee_construction ? `Construit ${result.dpe.annee_construction}` : null,
                      result.dpe.type_batiment ?? null,
                      result.dpe.conso_ep_m2 ? `${result.dpe.conso_ep_m2} kWh EP/m²/an` : null,
                      result.dpe.emission_ges_m2 ? `${result.dpe.emission_ges_m2} kg CO₂/m²/an` : null,
                      result.dpe.date_dpe ? `DPE du ${result.dpe.date_dpe.slice(0, 10)}` : null,
                    ]} />
                  </div>
                ) : <Nd />}
              </Card>
            )}

            {/* Audit énergétique */}
            {result.audit !== undefined && (
              <Card title="Audit énergétique">
                {result.audit ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "var(--fg-3)", fontSize: 13 }}>DPE actuel :</span>
                      <DpeBadge label={result.audit.classe_dpe_actuel} />
                      {result.audit.date_audit && <span style={{ color: "var(--fg-4)", fontSize: 12 }}>{result.audit.date_audit.slice(0, 10)}</span>}
                    </div>
                    {result.audit.scenarios.length > 0 && (
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Scénarios de rénovation ({result.audit.scenarios.length})
                        </div>
                        {result.audit.scenarios.map((s, i) => (
                          <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-elev)", border: "1px solid var(--border-1)", display: "grid", gap: 2 }}>
                            {s.categorie && <span style={{ fontWeight: 600, fontSize: 13 }}>{s.categorie}</span>}
                            {s.etape && <span style={{ color: "var(--fg-3)", fontSize: 12 }}>{s.etape}</span>}
                            {s.conso_ep != null && <span style={{ color: "var(--fg-4)", fontSize: 12 }}>{s.conso_ep} kWh EP/m²/an après travaux</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : <Nd />}
              </Card>
            )}

            {/* ZFE */}
            {result.zfe !== undefined && (
              <Card title="Zone à Faibles Émissions (ZFE)">
                {result.zfe?.inZfe ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {result.zfe.zones.map((z) => (
                      <div key={z.id} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--orange-tint)", border: "1px solid var(--border-1)" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{z.nom}</div>
                        <DataGrid items={[
                          z.vp_critair ? `VP : Crit'Air ${z.vp_critair.replace("V","")} min.` : null,
                          z.deux_rm_critair ? `2-roues : Crit'Air ${z.deux_rm_critair.replace("V","")} min.` : null,
                          z.date_debut ? `Depuis ${z.date_debut}` : null,
                          z.date_fin ? `Jusqu'au ${z.date_fin}` : null,
                        ]} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "var(--fg-3)", fontSize: 14 }}>Adresse hors ZFE</div>
                )}
              </Card>
            )}

            {/* ATMO */}
            {result.atmo && (
              <Card title="Qualité de l'air — ATMO">
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 999, background: result.atmo.index.color + "22", border: `1px solid ${result.atmo.index.color}44`, color: result.atmo.index.color, fontWeight: 600, fontSize: 13 }}>
                      {result.atmo.index.label}
                    </span>
                    <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Indice {result.atmo.index.value} — {result.atmo.date}</span>
                  </div>
                  <DataGrid items={[
                    result.atmo.pollutants.pm25 ? `PM2.5 : ${result.atmo.pollutants.pm25.label}` : null,
                    result.atmo.pollutants.pm10 ? `PM10 : ${result.atmo.pollutants.pm10.label}` : null,
                    result.atmo.pollutants.no2 ? `NO₂ : ${result.atmo.pollutants.no2.label}` : null,
                    result.atmo.pollutants.o3 ? `O₃ : ${result.atmo.pollutants.o3.label}` : null,
                  ]} />
                </div>
              </Card>
            )}

            {/* Eau */}
            {result.eaufrance && (
              <Card title="Eau — Hub'Eau">
                <DataGrid items={[
                  result.eaufrance.drinkingWater?.conformBacterio != null
                    ? `Bactério : ${result.eaufrance.drinkingWater.conformBacterio ? "✓ conforme" : "⚠ non conforme"}`
                    : null,
                  result.eaufrance.drinkingWater?.nitrates != null
                    ? `Nitrates : ${result.eaufrance.drinkingWater.nitrates} mg/L`
                    : null,
                  result.eaufrance.drought?.isDry
                    ? `⚠ Cours d'eau à sec : ${result.eaufrance.drought.riverName ?? ""}`
                    : result.eaufrance.drought?.riverName
                      ? `${result.eaufrance.drought.riverName} — ${result.eaufrance.drought.status ?? "n.d."}`
                      : null,
                ]} />
              </Card>
            )}

            {/* IREP */}
            {result.irep !== undefined && (
              <Card title={`Installations industrielles polluantes — IREP (5 km)`}>
                {result.irep && result.irep.count > 0 ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ color: "var(--fg-3)", fontSize: 13, marginBottom: 4 }}>
                      {result.irep.count} installation{result.irep.count > 1 ? "s" : ""} déclarante{result.irep.count > 1 ? "s" : ""}
                    </div>
                    {result.irep.installations.slice(0, 5).map((inst) => (
                      <div key={inst.id} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-elev)", border: "1px solid var(--border-1)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{inst.nom}</span>
                        <span style={{ color: "var(--fg-4)", fontSize: 12, whiteSpace: "nowrap" }}>
                          {(inst.distanceM / 1000).toFixed(1)} km · {inst.nombre_polluants} polluants · {inst.milieu_emission ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: "var(--fg-3)", fontSize: 14 }}>Aucune installation déclarante dans un rayon de 5 km</div>}
              </Card>
            )}

            {/* Cartofriches */}
            {result.cartofriches !== undefined && (
              <Card title="Friches et sites potentiellement pollués — Cartofriches">
                {result.cartofriches && result.cartofriches.count > 0 ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ color: "var(--fg-3)", fontSize: 13, marginBottom: 4 }}>
                      {result.cartofriches.count} site{result.cartofriches.count > 1 ? "s" : ""} dans la commune
                    </div>
                    {result.cartofriches.friches.slice(0, 5).map((f) => (
                      <div key={f.id} style={{ padding: "8px 12px", borderRadius: 8, background: f.sol_pollue ? "var(--red-tint)" : "var(--bg-elev)", border: "1px solid var(--border-1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{f.nom}</span>
                          {f.sol_pollue && <span style={{ fontSize: 11, color: "#ef4444", fontFamily: "var(--font-mono)" }}>SOL POLLUÉ</span>}
                        </div>
                        <div style={{ color: "var(--fg-4)", fontSize: 12, marginTop: 2 }}>
                          {[f.type, f.statut, f.activite].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: "var(--fg-3)", fontSize: 14 }}>Aucune friche répertoriée dans la commune</div>}
              </Card>
            )}

            {/* Géorisques */}
            <Section title="Géorisques parcelle" lines={[
              result.georisques?.parcel?.pprn.zones[0] ?? "Pas de zone PPRN détaillée",
              result.georisques?.parcel?.rga?.label ?? null,
              result.georisques?.parcel?.seismic?.label ?? null,
            ]} chips={[
              ...(result.georisques?.parcel?.risks.labels ?? []),
              ...(result.georisques?.parcel?.pprn.labels ?? []),
            ]} />

            <Section title="Géorisques commune" lines={[
              result.georisques?.commune?.communeName ?? "n.d.",
              result.georisques?.commune?.seismic?.label ?? null,
            ]} chips={result.georisques?.commune?.riskLabels ?? []} />

            {result.caveat && (
              <div style={{ padding: 18, borderRadius: 14, background: "var(--bg-elev)", border: "1px solid var(--border-1)", color: "var(--fg-3)", lineHeight: 1.7, fontSize: 13 }}>
                {result.caveat}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: 20, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function Section({ title, lines, chips = [] }: { title: string; lines: Array<string | null | undefined>; chips?: string[] }) {
  const safeLines = lines.filter((l): l is string => Boolean(l));
  return (
    <Card title={title}>
      <div style={{ display: "grid", gap: 6 }}>
        {safeLines.length > 0 ? safeLines.map((l) => <div key={l}>{l}</div>) : <Nd />}
      </div>
      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {chips.map((c) => (
            <span key={c} style={{ display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "var(--bg-elev)", border: "1px solid var(--border-1)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>
              {c}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function DataGrid({ items }: { items: Array<string | null | undefined> }) {
  const safe = items.filter((i): i is string => Boolean(i));
  if (safe.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
      {safe.map((item) => (
        <span key={item} style={{ fontSize: 13, color: "var(--fg-2)" }}>{item}</span>
      ))}
    </div>
  );
}

function Nd() {
  return <div style={{ color: "var(--fg-4)", fontSize: 13 }}>n.d.</div>;
}
