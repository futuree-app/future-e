"use client";

import { FormEvent, useState, useMemo } from "react";
import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";

// ════════════════════════════════════════════════════════════════════════════
// TYPES — inchangés depuis l'API existante
// ════════════════════════════════════════════════════════════════════════════

type ApiResponse = {
  error?: string;
  address?: { label: string; city: string | null; citycode: string | null; postcode: string | null; latitude: number; longitude: number; };
  altitude?: number | null;
  parcel?: { parcelCode: string; nomCommune: string | null; contenance: number | null; } | null;
  dpe?: {
    id_dpe: string; date_dpe: string | null; etiquette_dpe: string | null; etiquette_ges: string | null;
    conso_ep_m2: number | null; emission_ges_m2: number | null; surface_m2: number | null;
    annee_construction: number | null; type_batiment: string | null; adresse: string | null;
  } | null;
  audit?: {
    n_audit: string; date_audit: string | null; classe_dpe_actuel: string | null;
    scenarios: Array<{ categorie: string | null; etape: string | null; travaux: string | null; conso_ep: number | null; emission_ges: number | null; }>;
  } | null;
  zfe?: { inZfe: boolean; zones: Array<{ id: string; nom: string; vp_critair: string | null; deux_rm_critair: string | null; date_debut: string | null; date_fin: string | null; }>; } | null;
  irep?: { count: number; installations: Array<{ id: number; nom: string; distanceM: number; nombre_polluants: number; milieu_emission: string | null; }>; } | null;
  cartofriches?: { count: number; friches: Array<{ id: string; nom: string; type: string | null; statut: string | null; sol_pollue: boolean; activite: string | null; distanceM: number | null; }>; } | null;
  communeData?: {
    commune: {
      inseeCode: string; nom: string; population: number | null; vieillissement_pct: number | null;
      logements: { vacants_2022: number | null; vacants_pct: number | null; sociaux_2023: number | null; sociaux_pct: number | null; };
      qualite_air: { pm25: number | null; pm10: number | null; no2: number | null; o3: number | null; };
      economie: { revenu_median: number | null; inferiorite_nationale_pct: number | null; };
      sante: { acces_medecins: number | null; eloignement_services_pct: number | null; };
      territoire: { densite: number | null; incendies: number | null; taux_boisement: number | null; };
    };
    iris: {
      iris_count: number; passoires_taux: number | null; preca_energetique_pct: number | null;
      taux_propriete: number | null; taux_location: number | null; taux_hlm: number | null;
      taux_suroccupation: number | null; taux_motorisation: number | null; taux_transports_communs: number | null;
    } | null;
  } | null;
  georisques?: {
    address?: { risks: { labels: string[] }; pprn: { labels: string[] }; rga: { code: string | null; label: string | null } | null; seismic: { code: string | null; label: string | null } | null; } | null;
    parcel?: { parcelCode: string; risks: { labels: string[] }; pprn: { labels: string[]; zones: string[] }; rga: { code: string | null; label: string | null } | null; seismic: { code: string | null; label: string | null } | null; } | null;
    commune?: { communeName: string | null; riskLabels: string[]; seismic: { code: string | null; label: string | null } | null; } | null;
  };
};

type SynthesisResponse = {
  verdict: string;
  signals: Array<{ level: "good" | "medium" | "bad" | "warn"; text: string }>;
  reading: string;
  actions: Array<{ title: string; description: string; href?: string }>;
};

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const DPE_COLORS: Record<string, string> = {
  A: "#319334", B: "#33cc33", C: "#cbee39",
  D: "#ffff00", E: "#fbad26", F: "#f15a27", G: "#ed1c24",
};

const DPE_LABELS: Record<string, string> = {
  A: "Très performant", B: "Performant", C: "Assez performant",
  D: "Peu performant", E: "Énergivore", F: "Très énergivore", G: "Passoire thermique",
};

// Calcule un verdict synthétique côté client (avant ou en l'absence de l'IA)
function computeQuickVerdict(r: ApiResponse): { level: "good" | "medium" | "bad"; signals: number } {
  let score = 0;
  let signals = 0;
  const dpe = r.dpe?.etiquette_dpe;
  if (dpe === "F" || dpe === "G") { score += 2; signals++; }
  else if (dpe === "E") { score += 1; signals++; }
  if ((r.georisques?.parcel?.risks.labels.length ?? 0) > 0) { score += 1; signals++; }
  if ((r.georisques?.parcel?.pprn.labels.length ?? 0) > 0) { score += 2; signals++; }
  if (r.zfe?.inZfe) { score += 1; signals++; }
  if ((r.irep?.count ?? 0) > 0) { score += 1; signals++; }
  if ((r.cartofriches?.count ?? 0) > 0 && r.cartofriches?.friches.some(f => f.sol_pollue)) { score += 1; signals++; }
  return {
    level: score >= 4 ? "bad" : score >= 2 ? "medium" : "good",
    signals,
  };
}

function getInsuranceOutlook(risks: string[]) {
  const joined = risks.join(" ").toLowerCase();
  const hasSensitiveRisk =
    joined.includes("inond") ||
    joined.includes("submersion") ||
    joined.includes("débordement") ||
    joined.includes("argile");

  if (hasSensitiveRisk || risks.length >= 3) {
    return {
      level: "bad" as const,
      value: "Sous pression",
      unit: "lecture qualitative à 20 ans",
      desc: "Quand les sinistres climatiques se répètent, la prime, les franchises ou les conditions de couverture peuvent se tendre plus vite.",
    };
  }

  if (risks.length > 0) {
    return {
      level: "warn" as const,
      value: "À surveiller",
      unit: "lecture qualitative à 20 ans",
      desc: "Le signal n'annonce pas une hausse automatique des coûts, mais il pèse sur la lecture assurantielle du bien dans la durée.",
    };
  }

  return {
    level: "good" as const,
    value: "Plus stable",
    unit: "lecture qualitative à 20 ans",
    desc: "Aucun risque naturel fort ne ressort ici dans les bases consultées. Cela ne supprime pas le risque, mais limite la pression assurantielle visible.",
  };
}

function getValueOutlook(args: {
  dpeLabel: string | null | undefined;
  risks: string[];
  pollutedFricheNearby: boolean;
  passoiresPct: number | null | undefined;
}) {
  let fragility = 0;
  if (args.dpeLabel === "F" || args.dpeLabel === "G") fragility += 2;
  else if (args.dpeLabel === "E") fragility += 1;
  if (args.risks.length >= 2) fragility += 2;
  else if (args.risks.length === 1) fragility += 1;
  if (args.pollutedFricheNearby) fragility += 1;
  if ((args.passoiresPct ?? 0) >= 20) fragility += 1;

  if (fragility >= 4) {
    return {
      level: "bad" as const,
      value: "Fragilisée",
      unit: "valeur à 20 ans",
      desc: "Un bien exposé, énergivore ou situé dans un marché local déjà tendu peut devenir plus difficile à louer, assurer ou revendre correctement.",
    };
  }

  if (fragility >= 2) {
    return {
      level: "warn" as const,
      value: "À arbitrer",
      unit: "valeur à 20 ans",
      desc: "Le bien ne se dégrade pas nécessairement, mais plusieurs signaux peuvent peser sur sa valeur future s'ils ne sont pas traités.",
    };
  }

  return {
    level: "good" as const,
    value: "Plus résiliente",
    unit: "valeur à 20 ans",
    desc: "Le logement semble mieux placé pour conserver sa désirabilité relative, sous réserve de l'évolution du marché local et des travaux réalisés.",
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--border-1)" }} />
    </div>
  );
}

function DpeBadge({ label, size = "md" }: { label: string | null; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? 56 : size === "md" ? 38 : 26;
  const fs = size === "lg" ? 22 : size === "md" ? 16 : 12;
  if (!label) return <span style={{ color: "var(--fg-4)" }}>—</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: s, height: s, borderRadius: 4,
      background: DPE_COLORS[label] ?? "var(--bg-elev)",
      color: "#060812", fontWeight: 700, fontSize: fs, flexShrink: 0,
    }}>{label}</span>
  );
}

// Carte risque dans la grille de synthèse
function RiskCard({
  level, name, value, unit, desc, who,
}: {
  level: "good" | "medium" | "bad" | "warn";
  name: string;
  value: React.ReactNode;
  unit: string;
  desc: string;
  who?: string;
}) {
  const colors = {
    good:   { bar: "var(--green, #4a7c59)",   bg: "rgba(74,124,89,0.08)",  fg: "var(--green-light, #6aad7e)" },
    medium: { bar: "var(--orange, #c47a3a)",  bg: "rgba(196,122,58,0.08)", fg: "var(--orange, #c47a3a)" },
    bad:    { bar: "var(--red, #a84a3a)",     bg: "rgba(168,74,58,0.08)",  fg: "var(--red, #f87171)" },
    warn:   { bar: "var(--yellow, #b8a042)",  bg: "rgba(184,160,66,0.08)", fg: "var(--yellow, #b8a042)" },
  };
  const c = colors[level];
  const labels = { good: "Favorable", medium: "Modéré", bad: "Élevé", warn: "Vigilance" };
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-1)",
      padding: 20, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: c.bar }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>{name}</div>
        <div style={{ fontSize: 9, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 1, textTransform: "uppercase", background: c.bg, color: c.fg }}>{labels[level]}</div>
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, letterSpacing: "-0.03em", color: "var(--fg-hi)", marginBottom: 4, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.04em", marginBottom: 10 }}>{unit}</div>
      <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>{desc}</div>
      {who && (
        <div style={{ display: "inline-block", marginTop: 8, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", background: "var(--bg-elev)", border: "1px solid var(--border-1)", color: "var(--fg-4)" }}>
          {who}
        </div>
      )}
    </div>
  );
}

// Verdict en bandeau (gauche colorée)
function Verdict({ level, title, detail }: { level: "good" | "medium" | "bad"; title: string; detail: string }) {
  const colors = { good: "var(--green, #4a7c59)", medium: "var(--orange, #c47a3a)", bad: "var(--red, #a84a3a)" };
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-1)",
      borderLeft: `3px solid ${colors[level]}`, padding: "24px 28px",
    }}>
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, color: "var(--fg-hi)", marginBottom: 8, letterSpacing: "-0.01em" }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.7 }}>{detail}</div>
    </div>
  );
}

function Block({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "var(--fg-4)" }}>{sub}</span>}
    </div>
  );
}

function ActionCard({ title, desc, href, primary }: { title: string; desc: string; href?: string; primary?: boolean }) {
  const content = (
    <div style={{
      padding: 18, background: primary ? "var(--bg-card)" : "var(--bg-elev)",
      border: `1px solid ${primary ? "var(--accent-dim, #7a6e60)" : "var(--border-1)"}`,
      cursor: "pointer", transition: "all 0.15s",
      display: "block",
    }}>
      <div style={{ fontSize: 11, color: "var(--fg-1)", letterSpacing: "0.03em", marginBottom: 6, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 10, color: "var(--fg-4)", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>;
  return content;
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function LogementModule() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"synthese" | "details" | "agir">("synthese");

  // État pour la synthèse Claude API
  const [synthesis, setSynthesis] = useState<SynthesisResponse | null>(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSynthesis(null); // reset synthesis on new analysis
    try {
      const res = await fetch(`/api/georisques-logement?q=${encodeURIComponent(query)}`);
      const payload = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setResult(payload);
      setActiveTab("synthese");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Appel Claude API à la demande
  async function requestSynthesis() {
    if (!result) return;
    setSynthLoading(true);
    setSynthError(null);
    try {
      const res = await fetch("/api/synthesize-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: result }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Erreur de synthèse");
      setSynthesis(payload as SynthesisResponse);
    } catch (err) {
      setSynthError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSynthLoading(false);
    }
  }

  const quick = useMemo(() => result ? computeQuickVerdict(result) : null, [result]);
  const isPassoire = ["F", "G"].includes(result?.dpe?.etiquette_dpe ?? "");
  const dpe = result?.dpe;
  const georisques = result?.georisques?.parcel ?? result?.georisques?.address;
  const allRisks = [
    ...(georisques?.risks?.labels ?? []),
    ...(georisques?.pprn?.labels ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const insuranceOutlook = getInsuranceOutlook(allRisks);
  const valueOutlook = getValueOutlook({
    dpeLabel: dpe?.etiquette_dpe,
    risks: allRisks,
    pollutedFricheNearby: result?.cartofriches?.friches.some((f) => f.sol_pollue) ?? false,
    passoiresPct: result?.communeData?.iris?.passoires_taux,
  });

  return (
    <div className="min-h-screen bg-canvas text-label relative overflow-hidden" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-orange/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <AccountNav
        secondaryCta={{ href: "/rapport", label: "Mon rapport" }}
        primaryCta={{ href: "/dashboard", label: "Dashboard" }}
      />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">
        <section className="grid grid-cols-[1fr_360px] gap-14 items-start py-20">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Module 02 · Logement
            </div>
            <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Ce que votre habitat devient.<br />
              <span className="italic text-accent">Confort, risques, valeur.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[560px]">
              Ce module lit le bien lui-même : DPE, risques par adresse, pression assurantielle et trajectoire de valeur. Il ne raconte pas tout le territoire. Il raconte ce que ce logement absorbe, perd ou protège.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Retour au hub
              </Link>
              <Link href="/rapport/quartier" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Voir le module Quartier
              </Link>
            </div>
          </div>

          <aside className="glass rounded-2xl p-7">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">Lecture du bien</p>
            <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Les briques du module.
            </h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Performance énergétique", val: dpe?.etiquette_dpe ? `DPE ${dpe.etiquette_dpe}` : "Lecture à l'adresse", col: "var(--orange)" },
                { label: "Risques par adresse", val: allRisks.length > 0 ? `${allRisks.length} signal${allRisks.length > 1 ? "s" : ""}` : "Après analyse", col: "var(--red)" },
                { label: "Pression d'assurance", val: insuranceOutlook.value, col: "var(--blue)" },
                { label: "Valeur à 20 ans", val: valueOutlook.value, col: "var(--green)" },
              ].map((f) => (
                <div key={f.label} className="flex gap-3.5 items-start px-3.5 py-3 rounded-lg" style={{ background: `${f.col}0c`, border: `1px solid ${f.col}22` }}>
                  <span className="w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]" style={{ background: f.col, boxShadow: `0 0 8px ${f.col}` }} />
                  <div>
                    <div className="text-[13px] font-medium text-label mb-0.5 leading-[1.3]">{f.label}</div>
                    <div className="font-mono text-[10px] tracking-[0.04em]" style={{ color: f.col }}>{f.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <div className="border-t border-white/[0.08]" />

        <section className="pt-14">
          <div className="grid grid-cols-[1fr_320px] gap-10 items-end mb-8">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par défaut</p>
              <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Analyser un logement précis.
              </h2>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              Entrez une adresse pour ouvrir la lecture du bien. Le module s&apos;arrête au logement et à son exposition directe.
            </p>
          </div>

          <div className="glass rounded-xl p-8 border-t-2 border-t-accent" style={{ maxWidth: 760 }}>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. : 12 rue des Minimes, La Rochelle"
            style={{
              border: "1px solid var(--border-2)", background: "var(--bg-elev)", color: "var(--fg-1)",
              padding: "14px 18px", fontSize: 14, outline: "none", fontFamily: "var(--font-sans)",
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              border: "none", background: loading ? "var(--bg-elev)" : "var(--accent, #c8b89a)",
              color: loading ? "var(--fg-4)" : "#060812", padding: "14px 28px",
              fontWeight: 500, fontSize: 12, cursor: loading ? "default" : "pointer",
              fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Analyse…" : "Analyser"}
          </button>
            </form>

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", color: "var(--red, #f87171)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                ⚠ {error}
              </div>
            )}
          </div>
        </section>

      {/* ── RÉSULTATS ── */}
      {result && quick && (
        <section style={{ maxWidth: 760, padding: "24px 0 96px" }}>

          {/* ─ Property Card ─ */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-2)",
            padding: 24, marginBottom: 28,
            display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start",
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--fg-hi)", letterSpacing: "-0.01em", marginBottom: 4 }}>
                {result.address?.label}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                {result.address?.city ?? ""} {result.address?.citycode ? `· INSEE ${result.address.citycode}` : ""}
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {result.parcel && <Block label="Parcelle" value={result.parcel.parcelCode} sub={result.parcel.contenance ? `${result.parcel.contenance} m²` : undefined} />}
                {result.altitude != null && <Block label="Altitude" value={`${result.altitude} m NGF`} />}
                {dpe?.surface_m2 && <Block label="Surface" value={`${dpe.surface_m2} m²`} />}
                {dpe?.annee_construction && <Block label="Construction" value={String(dpe.annee_construction)} />}
              </div>
            </div>
          </div>

          {/* ─ TABS ─ */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-1)", marginBottom: 28 }}>
            {[
              { id: "synthese", label: "Synthèse" },
              { id: "details", label: "Détails" },
              { id: "agir", label: "Agir" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: "10px 20px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                  background: "transparent", border: "none",
                  color: activeTab === tab.id ? "var(--accent, #c8b89a)" : "var(--fg-4)",
                  borderBottom: `2px solid ${activeTab === tab.id ? "var(--accent, #c8b89a)" : "transparent"}`,
                  marginBottom: -1, cursor: "pointer", fontFamily: "var(--font-mono)",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═════════════════════ SYNTHÈSE ═════════════════════ */}
          {activeTab === "synthese" && (
            <div style={{ display: "grid", gap: 28 }}>

              {/* Verdict synthétique calculé */}
              <Verdict
                level={quick.level}
                title={
                  quick.level === "bad" ? `Plusieurs signaux convergents sur cette adresse.` :
                  quick.level === "medium" ? `Signaux modérés à surveiller.` :
                  `Adresse globalement favorable.`
                }
                detail={
                  quick.level === "bad" ? `Ce logement combine ${quick.signals} signaux structurants : DPE, exposition aux risques, qualité environnementale ou contraintes réglementaires. Une lecture détaillée par dimension est disponible dans l'onglet Détails.` :
                  quick.level === "medium" ? `Ce logement présente ${quick.signals} signaux qui méritent attention sans être structurants. Voir Détails pour le profil complet.` :
                  `Aucun signal critique détecté sur les dimensions principales. Voir Détails pour la lecture complète.`
                }
              />

              {/* Synthèse Claude API */}
              <div>
                <SectionLabel>Lecture personnalisée</SectionLabel>

                {!synthesis && !synthLoading && (
                  <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-1)",
                    padding: 24, textAlign: "center",
                  }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--fg-hi)", marginBottom: 8 }}>
                      Une lecture narrative de votre situation.
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.7, marginBottom: 20, maxWidth: 460, margin: "0 auto 20px" }}>
                      Au-delà des chiffres, futur•e peut traduire ces données en quelques paragraphes situés dans votre contexte. Calmes, sourcés, sans alarmisme.
                    </div>
                    <button
                      onClick={requestSynthesis}
                      style={{
                        padding: "12px 24px", background: "var(--accent, #c8b89a)", color: "#060812",
                        border: "none", fontFamily: "var(--font-mono)", fontSize: 11,
                        letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                      }}
                    >
                      Générer la lecture
                    </button>
                    {synthError && (
                      <div style={{ marginTop: 16, fontSize: 11, color: "var(--red, #f87171)" }}>
                        {synthError}
                      </div>
                    )}
                  </div>
                )}

                {synthLoading && (
                  <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-1)",
                    padding: 32, textAlign: "center",
                  }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-dim, #7a6e60)" }}>
                      Analyse en cours…
                    </div>
                    <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 8 }}>
                      Croisement des données et rédaction de la lecture
                    </div>
                  </div>
                )}

                {synthesis && (
                  <div style={{ display: "grid", gap: 20 }}>
                    {/* Verdict IA */}
                    <Verdict level={quick.level} title={synthesis.verdict} detail={synthesis.reading} />

                    {/* Signaux structurés */}
                    {synthesis.signals && synthesis.signals.length > 0 && (
                      <div style={{ display: "grid", gap: 8 }}>
                        {synthesis.signals.map((s, i) => {
                          const colors = {
                            good: { bg: "rgba(74,124,89,0.06)", border: "rgba(74,124,89,0.25)", fg: "var(--green-light, #6aad7e)" },
                            medium: { bg: "rgba(196,122,58,0.06)", border: "rgba(196,122,58,0.25)", fg: "var(--orange, #c47a3a)" },
                            bad: { bg: "rgba(168,74,58,0.06)", border: "rgba(168,74,58,0.25)", fg: "var(--red, #f87171)" },
                            warn: { bg: "rgba(184,160,66,0.06)", border: "rgba(184,160,66,0.25)", fg: "var(--yellow, #b8a042)" },
                          };
                          const c = colors[s.level];
                          return (
                            <div key={i} style={{ padding: "14px 18px", background: c.bg, border: `1px solid ${c.border}`, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>
                              <span style={{ color: c.fg, marginRight: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                                {s.level === "good" ? "↓" : s.level === "bad" ? "↑" : s.level === "warn" ? "!" : "→"}
                              </span>
                              {s.text}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Risk Grid synthétique — lecture rapide */}
              <div>
                <SectionLabel>Dimensions clés</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                  {dpe?.etiquette_dpe && (
                    <RiskCard
                      level={isPassoire ? "bad" : ["D","E"].includes(dpe.etiquette_dpe) ? "warn" : "good"}
                      name="Performance énergétique"
                      value={`DPE ${dpe.etiquette_dpe}`}
                      unit={DPE_LABELS[dpe.etiquette_dpe] ?? ""}
                      desc={
                        isPassoire ? "Passoire thermique. Interdiction de location progressive d'ici 2034 selon l'étiquette."
                        : dpe.etiquette_dpe === "E" ? "Logement énergivore. Concerné par les obligations de rénovation à horizon 2034."
                        : dpe.etiquette_dpe === "D" ? "Performance moyenne. Pression réglementaire à anticiper."
                        : "Logement performant énergétiquement."
                      }
                    />
                  )}

                  {allRisks.length > 0 && (
                    <RiskCard
                      level="bad"
                      name="Risques par adresse"
                      value={String(allRisks.length)}
                      unit={`risque${allRisks.length > 1 ? "s" : ""} référencé${allRisks.length > 1 ? "s" : ""}`}
                      desc={`Cette parcelle est exposée à : ${allRisks.slice(0, 3).join(", ")}${allRisks.length > 3 ? "…" : ""}.`}
                    />
                  )}

                  <RiskCard
                    level={insuranceOutlook.level}
                    name="Coût d'assurance projeté"
                    value={insuranceOutlook.value}
                    unit={insuranceOutlook.unit}
                    desc={insuranceOutlook.desc}
                  />

                  <RiskCard
                    level={valueOutlook.level}
                    name="Valeur immobilière"
                    value={valueOutlook.value}
                    unit={valueOutlook.unit}
                    desc={valueOutlook.desc}
                  />

                  {result.zfe?.inZfe && (
                    <RiskCard
                      level="warn"
                      name="ZFE active"
                      value="Oui"
                      unit={`${result.zfe.zones.length} zone${result.zfe.zones.length > 1 ? "s" : ""} de circulation restreinte`}
                      desc="Cette adresse est située dans une zone à faibles émissions. Restrictions progressives selon vignette Crit'Air."
                    />
                  )}

                </div>
              </div>

            </div>
          )}

          {/* ═════════════════════ DÉTAILS ═════════════════════ */}
          {activeTab === "details" && (
            <div style={{ display: "grid", gap: 36 }}>

              {/* Énergie */}
              {dpe && (
                <div>
                  <SectionLabel>Énergie & rénovation</SectionLabel>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gap: 18 }}>
                    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                      <DpeBadge label={dpe.etiquette_dpe} size="lg" />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 15, color: "var(--fg-hi)" }}>
                          Étiquette {dpe.etiquette_dpe ?? "—"} — {DPE_LABELS[dpe.etiquette_dpe ?? ""] ?? "Donnée indisponible"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 4 }}>
                          GES {dpe.etiquette_ges ?? "—"} · DPE du {dpe.date_dpe?.slice(0, 10) ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 14 }}>
                      {dpe.conso_ep_m2 != null && <Block label="Consommation" value={`${dpe.conso_ep_m2} kWh EP/m²/an`} />}
                      {dpe.emission_ges_m2 != null && <Block label="Émissions GES" value={`${dpe.emission_ges_m2} kg CO₂/m²/an`} />}
                      {dpe.type_batiment && <Block label="Type" value={dpe.type_batiment} />}
                    </div>

                    {result.audit && result.audit.scenarios.length > 0 && (
                      <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 10 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent-dim, #7a6e60)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          Audit énergétique · {result.audit.scenarios.length} scénarios
                        </div>
                        {result.audit.scenarios.map((s, i) => (
                          <div key={i} style={{ padding: "10px 14px", background: "var(--bg-elev)", border: "1px solid var(--border-1)", display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              {s.categorie && <div style={{ fontSize: 12, color: "var(--fg-1)" }}>{s.categorie}</div>}
                              {s.etape && <div style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 2 }}>{s.etape}</div>}
                            </div>
                            {s.conso_ep != null && (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                                {s.conso_ep} kWh/m²/an
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Risques */}
              {(allRisks.length > 0 || georisques?.seismic || georisques?.rga) && (
                <div>
                  <SectionLabel>Risques physiques par adresse</SectionLabel>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gap: 16 }}>
                    {allRisks.length > 0 && (
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                          Risques référencés
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {allRisks.map((r, i) => (
                            <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "5px 11px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", color: "var(--red, #f87171)" }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
                      {georisques?.seismic?.label && <Block label="Sismicité" value={georisques.seismic.label} />}
                      {georisques?.rga?.label && <Block label="Retrait-gonflement argiles" value={georisques.rga.label} />}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <SectionLabel>Assurance & valeur</SectionLabel>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <RiskCard
                    level={insuranceOutlook.level}
                    name="Pression d'assurance"
                    value={insuranceOutlook.value}
                    unit={insuranceOutlook.unit}
                    desc={insuranceOutlook.desc}
                  />
                  <RiskCard
                    level={valueOutlook.level}
                    name="Trajectoire de valeur"
                    value={valueOutlook.value}
                    unit={valueOutlook.unit}
                    desc={valueOutlook.desc}
                  />
                </div>
              </div>

              {/* ZFE */}
              {result.zfe?.inZfe && (
                <div>
                  <SectionLabel>Zone à faibles émissions</SectionLabel>
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gap: 12 }}>
                    {result.zfe.zones.map(z => (
                      <div key={z.id} style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: "var(--fg-hi)" }}>{z.nom}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
                          VP : Crit&apos;Air {z.vp_critair ?? "—"} · 2RM : Crit&apos;Air {z.deux_rm_critair ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ═════════════════════ AGIR ═════════════════════ */}
          {activeTab === "agir" && (
            <div style={{ display: "grid", gap: 36 }}>

              {/* Actions IA générées si dispo, sinon actions par défaut selon le profil */}
              <div>
                <SectionLabel>Actions documentées</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                  {/* Actions générées par Claude API */}
                  {synthesis?.actions && synthesis.actions.length > 0 ? (
                    synthesis.actions.map((a, i) => (
                      <ActionCard key={i} title={a.title} desc={a.description} href={a.href} primary={i === 0} />
                    ))
                  ) : (
                    <>
                      {isPassoire && (
                        <ActionCard
                          title="Comprendre le calendrier DPE"
                          desc="Interdiction progressive de location des passoires thermiques d'ici 2034. Quels travaux, quelles aides, quel ordre."
                          href="/savoir/dpe-calendrier"
                          primary
                        />
                      )}
                      {(isPassoire || dpe?.etiquette_dpe === "E") && (
                        <ActionCard
                          title="Évaluer le coût d'une rénovation thermique"
                          desc="Devis-type par typologie de bien, MaPrimeRénov' applicable, retour sur investissement à 10 ans."
                          href="/savoir/renovation-cout"
                        />
                      )}
                      {allRisks.length > 0 && (
                        <ActionCard
                          title="Vérifier votre couverture assurance"
                          desc="Contacter votre assureur pour anticiper toute évolution de prime ou de garantie sur votre zone."
                          href="/savoir/assurance-littorale"
                        />
                      )}
                      {result.zfe?.inZfe && (
                        <ActionCard
                          title="Anticiper les restrictions ZFE"
                          desc="Calendrier d'interdiction par vignette Crit'Air, alternatives de mobilité, aides à la conversion."
                          href="/savoir/zfe-comprendre"
                        />
                      )}
                      {result.cartofriches?.friches.some(f => f.sol_pollue) && (
                        <ActionCard
                          title="Pollution des sols à proximité"
                          desc="Que dit la réglementation, quelles vérifications faire en cas de jardin potager, à qui poser la question."
                          href="/savoir/sols-pollues"
                        />
                      )}
                      <ActionCard
                        title="Comparer ce logement avec d'autres territoires"
                        desc="Le comparateur futur•e permet de mesurer comment ce bien se situe face à des territoires alternatifs sur les mêmes dimensions."
                        href="/comparateur"
                      />
                    </>
                  )}

                </div>
              </div>

              {/* CTA synthèse si pas encore demandée */}
              {!synthesis && (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--fg-3)", marginBottom: 16 }}>
                    Pour des actions personnalisées selon votre situation exacte, demandez la lecture narrative dans l&apos;onglet Synthèse.
                  </div>
                  <button
                    onClick={() => setActiveTab("synthese")}
                    style={{
                      padding: "10px 20px", background: "transparent", border: "1px solid var(--border-2)",
                      color: "var(--fg-2)", fontFamily: "var(--font-mono)", fontSize: 11,
                      letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                    }}
                  >
                    Voir la Synthèse
                  </button>
                </div>
              )}

              {/* Pages Savoir associées */}
              <div>
                <SectionLabel>Pages Savoir associées</SectionLabel>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                  {[
                    { title: "Comprendre votre DPE et son calendrier", href: "/savoir/dpe-comprendre" },
                    { title: "Le risque de submersion et sa trajectoire", href: "/savoir/submersion" },
                    { title: "Pollutions invisibles : ce que le sol garde", href: "/savoir/pollutions-invisibles" },
                  ].map((l, i) => (
                    <Link key={i} href={l.href} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px",
                      borderBottom: i < 2 ? "1px solid var(--border-1)" : "none",
                      textDecoration: "none", color: "var(--fg-1)",
                      fontFamily: "var(--font-serif)", fontSize: 17, fontStyle: "italic",
                      transition: "padding 0.25s, color 0.25s",
                    }}>
                      {l.title}
                      <span style={{ fontFamily: "var(--font-mono)", fontStyle: "normal", fontSize: 12, color: "var(--fg-4)" }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          )}

        </section>
      )}
      </div>
    </div>
  );
}
