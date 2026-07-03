"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { OnrnSinistralite, PerilState } from "@/lib/onrn-sinistralite";
import type { Face3Snapshot, Posture } from "@/lib/logement-autour-types";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { PassportTiltScene } from "@/components/report/PassportTiltScene";

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
  sinistralite?: OnrnSinistralite | null;
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

// Verdict composite client retiré (2026-07-02, ADR-0001 : pas de note globale calculée).

// Briques « assurance » et « valeur » retirées (2026-07-02) : déduites de labels, elles
// affichaient une supposition comme une mesure. À refonder sur donnée réelle (ONRN coût +
// fréquence sécheresse) selon docs/vault/modules/logement.md, jamais en prédiction du bien.

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

// Verdict : carte verre avec liseré haut de la couleur du niveau
function Verdict({ level, title, detail }: { level: "good" | "medium" | "bad"; title: string; detail: string }) {
  const tone = level === "good" ? "green" : level === "bad" ? "red" : "orange";
  return (
    <GlassCard accentTop={tone} className="px-7 py-6">
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "var(--fg-hi)", marginBottom: 8, letterSpacing: "-0.01em" }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.7 }}>{detail}</div>
    </GlassCard>
  );
}

function Block({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "var(--fg-1)" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "var(--fg-4)" }}>{sub}</span>}
    </div>
  );
}

function ActionCard({ title, desc, href, primary }: { title: string; desc: string; href?: string; primary?: boolean }) {
  const content = (
    <div
      className={primary ? "glass rounded-xl" : "rounded-xl"}
      style={{
        padding: 18, cursor: "pointer", transition: "all 0.15s", display: "block",
        ...(primary ? {} : { background: "var(--bg-elev)", border: "1px solid var(--border-1)" }),
      }}
    >
      <div style={{ fontSize: 13, color: "var(--fg-1)", letterSpacing: "0.03em", marginBottom: 6, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--fg-4)", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>;
  return content;
}

// Passeport du bien : pendant du passeport territorial, au grain adresse. Surface
// teintée à l'accent du module, adresse en grand (Instrument Serif), DPE en sceau.
function PropertyPassport({
  address,
  parcel,
  dpe,
  altitude,
}: {
  address: ApiResponse["address"];
  parcel: ApiResponse["parcel"];
  dpe: ApiResponse["dpe"];
  altitude: ApiResponse["altitude"];
}) {
  const tint = "#c8b89a";
  const dpeLetter = dpe?.etiquette_dpe ?? null;
  const fields: { label: string; value: string }[] = [];
  if (dpe?.surface_m2) fields.push({ label: "Surface", value: `${dpe.surface_m2} m²` });
  if (dpe?.annee_construction) fields.push({ label: "Construction", value: String(dpe.annee_construction) });
  if (dpe?.type_batiment) fields.push({ label: "Type de bâti", value: dpe.type_batiment });
  if (parcel?.parcelCode)
    fields.push({ label: "Parcelle", value: parcel.contenance ? `${parcel.parcelCode} · ${parcel.contenance} m²` : parcel.parcelCode });
  if (altitude != null) fields.push({ label: "Altitude", value: `${altitude} m NGF` });
  if (address?.citycode) fields.push({ label: "Commune", value: `${address.city ?? ""} · INSEE ${address.citycode}` });

  return (
    // Scène 3D : pendant du passeport territorial. Se déplie au chargement, puis
    // répond au survol (tilt, reflet, parallaxe). Classes dans globals.css.
    <PassportTiltScene>
    <section
      className="passport-unfold rounded-2xl px-7 py-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(150deg, ${tint}1f 0%, ${tint}0a 55%, rgba(8,10,18,0.6) 100%)`,
        border: `1px solid ${tint}33`,
        boxShadow: `inset 0 1px 0 ${tint}1f`,
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: tint }}>
            Passeport du logement
          </p>
          {parcel?.parcelCode && (
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mt-1">Parcelle {parcel.parcelCode}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 passport-layer-seal">
          <DpeBadge label={dpeLetter} size="lg" />
          <p className="text-right font-mono text-[9px] tracking-[0.1em] uppercase text-ghost/70">
            {dpeLetter ? `DPE ${dpeLetter}` : "DPE non trouvé"}
          </p>
        </div>
      </div>

      <h3
        className="passport-layer-name font-normal text-[clamp(22px,3vw,32px)] leading-[1.1] tracking-[-0.01em] text-label"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {address?.label ?? "Logement"}
      </h3>
      {dpeLetter && DPE_LABELS[dpeLetter] && (
        <p className="text-[14px] leading-[1.55] text-muted mt-2">{DPE_LABELS[dpeLetter]}.</p>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mt-5 pt-2 border-t" style={{ borderColor: `${tint}26` }}>
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="min-w-0">
              <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">{f.label}</dt>
              <dd className="text-[15px] text-label leading-snug">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
    </PassportTiltScene>
  );
}

// Sonde projet : déclaration explicite acheteur/résident (mesure de cadrage). Non
// bloquante, disparaît une fois répondue.
function ProjectProbe({ answered, onAnswer }: { answered: string | null; onAnswer: (v: string) => void }) {
  if (answered) return null;
  const options = [
    { v: "reside", label: "J'y vis" },
    { v: "achat", label: "J'envisage d'acheter" },
    { v: "location", label: "Je loue ou vais louer" },
    { v: "autre", label: "Autre" },
  ];
  return (
    <GlassCard pad="sm">
      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--fg-hi)", marginBottom: 12 }}>
        Quel est votre projet sur ce logement ?
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onAnswer(o.v)}
            style={{
              padding: "8px 14px", background: "var(--bg-elev)", border: "1px solid var(--border-2)",
              color: "var(--fg-2)", fontSize: 13, cursor: "pointer", borderRadius: 8, fontFamily: "var(--font-sans)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════

// Face 2 — matérialité assurantielle passée (ONRN/CCR, 1995-2021). Coût moyen +
// fréquence des sinistres indemnisés, classes verbatim gatées par la
// représentativité. Jamais prédictif : voir docs/vault/modules/logement.md.
function PerilLine({ peril, mecanisme, state }: { peril: string; mecanisme: string; state: PerilState }) {
  if (state.kind === "indispo") return null;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>
        {peril}
      </div>
      <div style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.65 }}>
        {state.kind === "lecture" && (
          <>Sur 1995-2021, les sinistres {mecanisme} indemnisés pour les biens assurés de cette commune ont eu un coût moyen de <strong style={{ color: "var(--fg-hi)" }}>{state.cout}</strong> et une fréquence de <strong style={{ color: "var(--fg-hi)" }}>{state.frequence}</strong>. Chiffres établis sur l&apos;échantillon CCR, qui couvre ici {state.representativite} du marché.</>
        )}
        {state.kind === "aucun" && (
          <>Aucun sinistre {peril.toLowerCase()} répertorié par la CCR pour les biens assurés de cette commune sur 1995-2021. L&apos;échantillon couvre environ la moitié du marché : un historique vide n&apos;exclut pas une exposition future.</>
        )}
        {state.kind === "faible_repr" && (
          <>Des sinistres {peril.toLowerCase()} sont répertoriés ici, mais l&apos;échantillon assurantiel local est trop réduit (représentativité {state.representativite}) pour en tirer une lecture fiable.</>
        )}
      </div>
    </div>
  );
}

function SinistraliteBlock({ sinistralite }: { sinistralite: OnrnSinistralite }) {
  const { secheresse, inondation } = sinistralite;
  if (secheresse.kind === "indispo" && inondation.kind === "indispo") return null;
  return (
    <ReportSection eyebrow="Ce que le risque a déjà coûté ici">
      <GlassCard>
        <div style={{ display: "grid", gap: 18 }}>
          <PerilLine peril="Sécheresse" mecanisme="sécheresse (retrait-gonflement des argiles)" state={secheresse} />
          <PerilLine peril="Inondation" mecanisme="inondation (tous types : coulée de boue, remontée de nappe, submersion marine)" state={inondation} />
          <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", fontSize: 12, color: "var(--fg-4)", lineHeight: 1.6 }}>
            Aujourd&apos;hui, ce passé local ne fixe pas le prix de votre assurance : le régime CatNat finance ces indemnisations par une surprime légale uniforme partout en France (portée à 20 % au 1ᵉʳ janvier 2025). Un débat en cours (rapport Langreney) pose la question d&apos;une modulation selon l&apos;exposition locale.
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.8 }}>
            ONRN (État / CCR / Mission Risques Naturels), via Géorisques. Sinistres indemnisés 1995-2021, biens assurés particuliers et professionnels.
          </div>
        </div>
      </GlassCard>
    </ReportSection>
  );
}

// Face 3 — « Autour de cette adresse » (buffer local au point géocodé). Hiérarchie :
// vie quotidienne (BPE, socle) > infra potentiellement bruyantes (vigilance) > verts (repère).
// Distances brutes à vol d'oiseau, aucun adjectif de proximité, aucun dB, aucune note.
const FACE3_CAT_LABEL: Record<string, string> = {
  sante: "Santé",
  alimentation: "Alimentation quotidienne",
  education: "Éducation",
  transports: "Transports",
  services: "Services essentiels",
};
function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${m} m`;
}
function Face3Block({ s }: { s: Face3Snapshot }) {
  const noisy = s.osm.potentiallyNoisyInfrastructure;
  const bboxKm = (s.osm.bboxRadiusMeters / 1000).toFixed(1).replace(".", ",");
  return (
    <ReportSection eyebrow="Autour de cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 20 }}>
          {/* Brique 1 — vie quotidienne (socle) */}
          <div style={{ display: "grid", gap: 10 }}>
            {s.bpe.categories.map((c) => (
              <div key={c.category} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 15, color: "var(--fg-2)", lineHeight: 1.5 }}>
                <span>{FACE3_CAT_LABEL[c.category]}</span>
                <span style={{ color: "var(--fg-hi)", textAlign: "right" }}>
                  {c.nearest
                    ? `le plus proche à environ ${fmtDist(c.nearest.distanceMeters)}`
                    : `aucun recensé dans les ${(c.searchCapMeters / 1000)} km analysés`}
                </span>
              </div>
            ))}
          </div>
          {/* Brique 2 — infrastructures potentiellement bruyantes (vigilance) */}
          <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            {s.sourceStatus.osmInfrastructure === "pending" ? (
              <em style={{ color: "var(--fg-4)" }}>Environnement en cours de récupération…</em>
            ) : s.sourceStatus.osmInfrastructure === "failed" ? (
              <span style={{ color: "var(--fg-4)" }}>Infrastructures : donnée momentanément indisponible.</span>
            ) : noisy.length > 0 ? (
              noisy
                .map((x) => `à environ ${fmtDist(x.distanceMeters)} d'un axe ${x.type === "railway" ? "ferroviaire" : "autoroutier"} cartographié`)
                .join(" ; ")
                .replace(/^./, (c) => c.toUpperCase()) + "."
            ) : (
              `Aucun axe autoroutier ou ferroviaire cartographié dans l'emprise analysée de ${bboxKm} km.`
            )}
          </div>
          {/* Brique 3 — espaces verts cartographiés (repère) */}
          <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            {s.sourceStatus.osmGreenSpaces === "pending" ? (
              <em style={{ color: "var(--fg-4)" }}>Environnement en cours de récupération…</em>
            ) : s.sourceStatus.osmGreenSpaces === "failed" ? (
              <span style={{ color: "var(--fg-4)" }}>Espaces verts : donnée momentanément indisponible.</span>
            ) : s.osm.nearestMappedGreenSpace ? (
              `Espace vert cartographié le plus proche à environ ${fmtDist(s.osm.nearestMappedGreenSpace.distanceMeters)}.`
            ) : (
              "Aucun espace vert correspondant aux catégories recherchées dans l'emprise cartographiée."
            )}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.8 }}>
            INSEE (BPE) · OpenStreetMap (ODbL) · distances à vol d&apos;oiseau
          </div>
        </div>
      </GlassCard>
    </ReportSection>
  );
}

const POSTURE_FOR_PROJET: Record<string, Posture> = {
  reside: "residence",
  achat: "prospection",
  location: "prospection",
  autre: "residence",
};

export default function LogementModule({ defaultCommune }: { defaultCommune?: string | null }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [projet, setProjet] = useState<string | null>(null);
  const [autour, setAutour] = useState<Face3Snapshot | null>(null);
  const autourRetriedRef = useRef(false);
  const posthog = usePostHog();

  // Face 3 : génère (ou relit, figé) le snapshot « autour de l'adresse ». La donnée
  // OSM vient du cache de tuile côté serveur ; l'affichage ne touche jamais Overpass.
  async function requestAutour(payload: ApiResponse, posture: Posture) {
    const a = payload.address;
    if (!a?.citycode || a.latitude == null || a.longitude == null) return;
    try {
      const res = await fetch("/api/logement-autour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insee: a.citycode,
          latitude: a.latitude,
          longitude: a.longitude,
          address_label: a.label,
          parcel_code: payload.parcel?.parcelCode ?? null,
          posture,
        }),
      });
      if (!res.ok) return;
      const { snapshot } = (await res.json()) as { snapshot: Face3Snapshot };
      setAutour(snapshot);
      // Observabilité de complétude, SANS donnée localisante fine (pas de tile_key/coords).
      posthog?.capture("logement_autour", {
        insee: a.citycode,
        posture,
        status_bpe: snapshot?.sourceStatus?.bpe,
        status_osm_infra: snapshot?.sourceStatus?.osmInfrastructure,
        status_osm_green: snapshot?.sourceStatus?.osmGreenSpaces,
      });
    } catch {
      /* échec silencieux à l'UI ; l'observabilité vit dans le snapshot/serveur */
    }
  }

  // Remplissage asynchrone minimal : si l'OSM est revenu `pending` (tuile froide,
  // Overpass lent), on re-demande UNE fois après un court délai (la tuile est alors
  // chaude grâce au after() serveur). Au-delà = incrément futur.
  useEffect(() => {
    if (!result || !autour || autourRetriedRef.current) return;
    if (autour.sourceStatus.osmInfrastructure !== "pending") return;
    autourRetriedRef.current = true;
    const t = setTimeout(() => {
      void requestAutour(result, POSTURE_FOR_PROJET[projet ?? "reside"] ?? "residence");
    }, 4500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autour, result]);

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
    setAutour(null);
    autourRetriedRef.current = false;
    try {
      const res = await fetch(`/api/georisques-logement?q=${encodeURIComponent(query)}`);
      const payload = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setResult(payload);
      setProjet(null);
      // Signal implicite acheteur/résident : l'adresse analysée est-elle la commune déclarée ?
      const relation =
        defaultCommune && payload.address?.city
          ? payload.address.city.toLowerCase() === defaultCommune.toLowerCase()
            ? "residence"
            : "prospection"
          : "inconnue";
      posthog?.capture("logement_analyzed", {
        relation_inferee: relation,
        in_declared_commune: relation === "residence",
        has_dpe: Boolean(payload.dpe?.etiquette_dpe),
        insee: payload.address?.citycode ?? null,
      });
      // Face 3 « autour de l'adresse » : posture par défaut résidence, corrigée ensuite par la sonde.
      void requestAutour(payload, "residence");
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

  const isPassoire = ["F", "G"].includes(result?.dpe?.etiquette_dpe ?? "");
  const dpe = result?.dpe;
  const georisques = result?.georisques?.parcel ?? result?.georisques?.address;
  const allRisks = [
    ...(georisques?.risks?.labels ?? []),
    ...(georisques?.pprn?.labels ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="min-h-screen bg-canvas text-label relative overflow-hidden" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-orange/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/rapport", label: "Mon rapport" }, primary: { href: "/dashboard", label: "Dashboard" } }} />

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
                Voir le module Territoire
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
                { label: "Risques du bâti", val: allRisks.length > 0 ? `${allRisks.length} signal${allRisks.length > 1 ? "s" : ""}` : "Après analyse", col: "var(--red)" },
                { label: "Assurance et sécheresse", val: "Lecture à venir", col: "var(--blue)" },
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
            placeholder={`Ex. : 12 rue des Minimes${defaultCommune ? `, ${defaultCommune}` : ""}`}
            style={{
              border: "1px solid var(--border-2)", background: "var(--bg-elev)", color: "var(--fg-1)",
              padding: "14px 18px", fontSize: 15, outline: "none", fontFamily: "var(--font-sans)",
              borderRadius: 10,
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
              transition: "all 0.15s", borderRadius: 10,
            }}
          >
            {loading ? "Analyse…" : "Analyser"}
          </button>
            </form>

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", borderRadius: 10, color: "var(--red, #f87171)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {error}
              </div>
            )}
          </div>
        </section>

      {/* ── RÉSULTATS ── */}
      {result && (
        <section style={{ maxWidth: 760, padding: "24px 0 96px", display: "grid", gap: 40 }}>

          {/* Passeport du bien : identité au grain adresse, DPE en sceau. */}
          <PropertyPassport
            address={result.address}
            parcel={result.parcel}
            dpe={result.dpe}
            altitude={result.altitude}
          />

          {/* Avertissement si l'adresse est dans une commune différente du profil */}
          {defaultCommune && result.address?.city &&
            result.address.city.toLowerCase() !== defaultCommune.toLowerCase() && (
            <div style={{
              marginBottom: 20, padding: "12px 16px",
              background: "rgba(184,160,66,0.06)", border: "1px solid rgba(184,160,66,0.25)",
              borderLeft: "3px solid var(--yellow, #b8a042)", borderRadius: 10,
              fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65,
            }}>
              <strong style={{ color: "var(--yellow, #b8a042)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Adresse hors commune
              </strong>
              <br />
              Cette adresse est à <strong>{result.address.city}</strong>, votre commune de résidence déclarée est <strong>{defaultCommune}</strong>. L&apos;analyse porte sur ce bien, mais les modules Territoire et Santé restent calés sur votre commune principale.
            </div>
          )}

          {/* Sonde projet : mesure explicite acheteur/résident, non bloquante. */}
          <ProjectProbe
            answered={projet}
            onAnswer={(v) => {
              setProjet(v);
              posthog?.capture("logement_projet_declare", { projet: v, insee: result.address?.citycode ?? null });
              // La posture déclarée met à jour le logement sauvegardé (persistée, non prédictive).
              void requestAutour(result, POSTURE_FOR_PROJET[v] ?? "residence");
            }}
          />

          {/* ═════════════════════ LECTURE ═════════════════════ */}
          {(
            <div style={{ display: "grid", gap: 28 }}>

              {/* Verdict composite retiré (ADR-0001). La lecture vient de la synthèse ci-dessous. */}

              {/* Synthèse Claude API */}
              <ReportSection eyebrow="Lecture personnalisée" tone="accent">

                {!synthesis && !synthLoading && (
                  <GlassCard className="text-center">
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, color: "var(--fg-hi)", marginBottom: 8 }}>
                      Une lecture narrative de votre situation.
                    </div>
                    <div style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.7, marginBottom: 20, maxWidth: 460, margin: "0 auto 20px" }}>
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
                  </GlassCard>
                )}

                {synthLoading && (
                  <GlassCard pad="lg" className="text-center">
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-dim, #7a6e60)" }}>
                      Analyse en cours…
                    </div>
                    <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 8 }}>
                      Croisement des données et rédaction de la lecture
                    </div>
                  </GlassCard>
                )}

                {synthesis && (
                  <div style={{ display: "grid", gap: 20 }}>
                    {/* Verdict IA */}
                    <Verdict
                      level={
                        synthesis.signals.some((s) => s.level === "bad")
                          ? "bad"
                          : synthesis.signals.some((s) => s.level === "medium" || s.level === "warn")
                            ? "medium"
                            : "good"
                      }
                      title={synthesis.verdict}
                      detail={synthesis.reading}
                    />

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
                            <div key={i} style={{ padding: "14px 18px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 15, color: "var(--fg-2)", lineHeight: 1.6 }}>
                              <span style={{ color: c.fg, marginRight: 10, fontFamily: "var(--font-mono)", fontSize: 12 }}>
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
              </ReportSection>

            </div>
          )}

          {/* ═════════════════════ DIMENSIONS RÉELLES ═════════════════════ */}
          {(
            <div style={{ display: "grid", gap: 36 }}>

              {/* Énergie */}
              {dpe && (
                <ReportSection eyebrow="Énergie & rénovation" tone="orange">
                  <GlassCard>
                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                      <DpeBadge label={dpe.etiquette_dpe} size="lg" />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 16, color: "var(--fg-hi)" }}>
                          Étiquette {dpe.etiquette_dpe ?? "—"}, {DPE_LABELS[dpe.etiquette_dpe ?? ""] ?? "Donnée indisponible"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4 }}>
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
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-dim, #7a6e60)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          Audit énergétique · {result.audit.scenarios.length} scénarios
                        </div>
                        {result.audit.scenarios.map((s, i) => (
                          <div key={i} style={{ padding: "10px 14px", background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              {s.categorie && <div style={{ fontSize: 13, color: "var(--fg-1)" }}>{s.categorie}</div>}
                              {s.etape && <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 2 }}>{s.etape}</div>}
                            </div>
                            {s.conso_ep != null && (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                                {s.conso_ep} kWh/m²/an
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </GlassCard>
                </ReportSection>
              )}

              {/* Risques */}
              {(allRisks.length > 0 || georisques?.seismic || georisques?.rga) && (
                <ReportSection eyebrow="Risques du bâti" tone="red">
                  <GlassCard>
                  <div style={{ display: "grid", gap: 16 }}>
                    {allRisks.length > 0 && (
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                          Risques référencés
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {allRisks.map((r, i) => (
                            <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "5px 11px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", color: "var(--red, #f87171)" }}>
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
                  </GlassCard>
                </ReportSection>
              )}

              {/* Face 2 — matérialité assurantielle passée (ONRN) */}
              {result.sinistralite && <SinistraliteBlock sinistralite={result.sinistralite} />}

              {/* Face 3 — autour de cette adresse (buffer local au point géocodé) */}
              {autour && <Face3Block s={autour} />}

              {/* ZFE */}
              {result.zfe?.inZfe && (
                <ReportSection eyebrow="Zone à faibles émissions" tone="blue">
                  <GlassCard>
                  <div style={{ display: "grid", gap: 12 }}>
                    {result.zfe.zones.map(z => (
                      <div key={z.id} style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 500, fontSize: 15, color: "var(--fg-hi)" }}>{z.nom}</div>
                        <div style={{ fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
                          VP : Crit&apos;Air {z.vp_critair ?? "—"} · 2RM : Crit&apos;Air {z.deux_rm_critair ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                  </GlassCard>
                </ReportSection>
              )}

            </div>
          )}

          {/* ═════════════════════ AGIR ═════════════════════ */}
          {(
            <div style={{ display: "grid", gap: 36 }}>

              {/* Actions IA générées si dispo, sinon actions par défaut selon le profil */}
              <ReportSection eyebrow="Actions documentées">
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
              </ReportSection>

              {/* Pages Savoir associées */}
              <ReportSection eyebrow="Pages Savoir associées">
                <div className="glass rounded-xl overflow-hidden">
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
              </ReportSection>

            </div>
          )}

        </section>
      )}
      </div>
    </div>
  );
}
