"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { OnrnSinistralite, PerilState } from "@/lib/onrn-sinistralite";
import type { Face3Snapshot, Posture, GreenKind } from "@/lib/logement-autour-types";
import type { RegulatoryPlan } from "@/lib/pprn-zonage";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { MetricTooltip } from "@/components/MetricTooltip";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import { DpeSelector } from "@/components/report/DpeSelector";
import { dpeAttributionStatus, deriveAddressDpeContext, type DpeRecord } from "@/lib/dpe-attribution";
import type { BanAddressResult } from "@/lib/ban";
import { PassportTiltScene } from "@/components/report/PassportTiltScene";

// ════════════════════════════════════════════════════════════════════════════
// TYPES — inchangés depuis l'API existante
// ════════════════════════════════════════════════════════════════════════════

type ApiResponse = {
  error?: string;
  address?: { label: string; city: string | null; citycode: string | null; postcode: string | null; latitude: number; longitude: number; };
  altitude?: number | null;
  parcel?: { parcelCode: string; nomCommune: string | null; contenance: number | null; } | null;
  dpeCandidates?: DpeRecord[];
  banFeatureType?: string | null;
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
    address?: { risks: { labels: string[] }; pprn: { labels: string[] }; regulatoryPlans?: RegulatoryPlan[]; rga: { code: string | null; label: string | null } | null; seismic: { code: string | null; label: string | null } | null; } | null;
    parcel?: { parcelCode: string; risks: { labels: string[] }; pprn: { labels: string[]; zones: string[] }; regulatoryPlans?: RegulatoryPlan[]; rga: { code: string | null; label: string | null } | null; seismic: { code: string | null; label: string | null } | null; } | null;
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
  dpe: DpeRecord | null;
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
// Reformatage typographique des classes verbatim ONRN : mêmes BORNES exactes, libellé propre
// (le verbatim source est incohérent : « 20k€ » vs « 10 k€ »). On n'invente aucune précision.
const ONRN_COUT_LABEL: Record<string, string> = {
  "Entre 0 et 2,5 k€": "moins de 2 500 €",
  "Entre 2,5 et 5 k€": "2 500 à 5 000 €",
  "Entre 5 et 10 k€": "5 000 à 10 000 €",
  "Entre 10 et 20k€": "10 000 à 20 000 €",
  "Plus de 20 k€": "plus de 20 000 €",
};
// « ‰ » se lit mal : on traduit en « pour 1 000 » (mêmes bornes). Le ‰ reste dans « Sources et limites ».
const ONRN_FREQ_PLAIN: Record<string, string> = {
  "Entre 0 et 1 ‰": "moins de 1 pour 1 000",
  "Entre 1 et 2 ‰": "1 à 2 pour 1 000",
  "Entre 2 et 5 ‰": "2 à 5 pour 1 000",
  "Entre 5 et 10 ‰": "5 à 10 pour 1 000",
  "Plus de 10 ‰": "plus de 10 pour 1 000",
};
// Rang ordinal des classes de fréquence. Sert UNIQUEMENT à comparer deux périls d'une même
// commune quand leurs classes sont strictement séparées (rangs différents). Ce n'est pas un
// score (ADR-0001 vise le score composite et le verdict, pas la comparaison factuelle d'une
// même métrique dans une commune) : on rapporte un fait, on ne note ni ne classe la commune.
const ONRN_FREQ_RANK: Record<string, number> = {
  "Entre 0 et 1 ‰": 1,
  "Entre 1 et 2 ‰": 2,
  "Entre 2 et 5 ‰": 3,
  "Entre 5 et 10 ‰": 4,
  "Plus de 10 ‰": 5,
};
const ONRN_REPR_LABEL: Record<string, string> = {
  "< 15%": "moins de 15 %",
  "Entre 15 et 30%": "15 à 30 %",
  "Entre 30 et 50%": "30 à 50 %",
  "> 50%": "plus de 50 %",
};
const onrnLabel = (map: Record<string, string>, v: string) => map[v] ?? v; // repli = verbatim
const SINI_EYEBROW: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" };

// Divulgation progressive : la preuve technique (méthode, sources, mentions) vit dans un repli
// natif <details>, jamais supprimée, jamais au premier plan.
function Disclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group" style={{ borderTop: "1px solid var(--border-1)" }}>
      {/* Toute la ligne est cliquable (comportement natif de <summary>), avec une zone de */}
      {/* frappe haute pour le tactile ; le chevron pivote à l'ouverture (variante Tailwind). */}
      <summary
        className="[&::-webkit-details-marker]:hidden"
        style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8, padding: "13px 0", fontSize: 13, fontWeight: 500, color: "var(--fg-3)" }}
      >
        <span className="transition-transform group-open:rotate-90" aria-hidden style={{ display: "inline-block", fontSize: 11, color: "var(--fg-4)" }}>▸</span>
        {summary}
      </summary>
      <div style={{ marginTop: 2, marginBottom: 13, display: "grid", gap: 10, fontSize: 12.5, color: "var(--fg-3)", lineHeight: 1.6 }}>
        {children}
      </div>
    </details>
  );
}

// Métrique lisible : valeur en évidence, description en dessous (une réponse, pas un tableau).
function Metric({ value, caption }: { value: string; caption: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontSize: 20, fontWeight: 500, color: "var(--fg-hi)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.5, maxWidth: 240 }}>{caption}</span>
    </div>
  );
}

function PerilLine({ peril, word, color, state, tip }: { peril: string; word: string; color: string; state: PerilState; tip: string }) {
  if (state.kind === "indispo") return null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ ...SINI_EYEBROW, color, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{peril}</span>
        <MetricTooltip text={tip} accent={color} />
      </div>
      {state.kind === "lecture" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 48px" }}>
          <Metric value={onrnLabel(ONRN_COUT_LABEL, state.cout)} caption="coût moyen d’un sinistre indemnisé" />
          <Metric value={onrnLabel(ONRN_FREQ_PLAIN, state.frequence)} caption="fréquence des sinistres parmi les biens assurés" />
        </div>
      )}
      {state.kind === "aucun" && (
        <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65 }}>
          Aucun sinistre {word} n&apos;a été indemnisé dans cette commune sur la période observée. Un historique vide n&apos;exclut pas une exposition future.
        </div>
      )}
      {state.kind === "faible_repr" && (
        <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65 }}>
          Des sinistres {word} sont répertoriés ici, mais l&apos;échantillon assurantiel local est trop réduit pour en tirer une lecture fiable.
        </div>
      )}
    </div>
  );
}

function SinistraliteBlock({ sinistralite }: { sinistralite: OnrnSinistralite }) {
  const { secheresse, inondation } = sinistralite;
  if (secheresse.kind === "indispo" && inondation.kind === "indispo") return null;
  const reprLine = [
    secheresse.kind === "lecture" ? `sécheresse ${onrnLabel(ONRN_REPR_LABEL, secheresse.representativite)}` : null,
    inondation.kind === "lecture" ? `inondation ${onrnLabel(ONRN_REPR_LABEL, inondation.representativite)}` : null,
  ].filter(Boolean).join(", ");
  // Comparaison factuelle des deux périls : n'est asservie QUE si les deux sont en lecture ET
  // que leurs classes de fréquence sont strictement séparées (rangs différents). Sinon muette
  // (jamais de comparaison quand on ne peut pas la fonder).
  const freqCompare = (() => {
    if (secheresse.kind !== "lecture" || inondation.kind !== "lecture") return null;
    const rs = ONRN_FREQ_RANK[secheresse.frequence] ?? 0;
    const ri = ONRN_FREQ_RANK[inondation.frequence] ?? 0;
    if (!rs || !ri || rs === ri) return null;
    return rs > ri
      ? { more: "à la sécheresse", less: "à l’inondation" }
      : { more: "à l’inondation", less: "à la sécheresse" };
  })();
  return (
    <ReportSection eyebrow="Sinistres indemnisés dans la commune">
      <div style={{ display: "grid", gap: 14 }}>
        {/* Niveau 1 — ce que ça veut dire, en langage courant, hors de la carte de faits */}
        <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
          Ce que les assureurs ont historiquement indemnisé dans la commune. Ces chiffres ne prédisent ni un sinistre pour ce logement, ni le prix de son assurance.
        </p>
        {/* Niveau 2 — les faits, dans la carte ; la conclusion factuelle en tête */}
        <GlassCard>
          <div style={{ display: "grid", gap: 18 }}>
            {/* Lecture transverse : conclusion factuelle en tête des faits, quand elle est fondée */}
            {freqCompare && (
              <p style={{ fontSize: 14.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.6, margin: 0 }}>
                Dans cette commune, les sinistres indemnisés liés {freqCompare.more} ont été plus fréquents que ceux liés {freqCompare.less}.
              </p>
            )}
            <PerilLine peril="Sécheresse (retrait-gonflement des argiles)" word="de sécheresse" color="var(--orange, #fb923c)" state={secheresse} tip="Le sol argileux gonfle avec l’humidité puis se rétracte en période sèche. Ces mouvements peuvent fissurer les murs et les fondations d’un logement." />
            <PerilLine peril="Inondation (tous types)" word="d’inondation" color="var(--blue, #60a5fa)" state={inondation} tip="Regroupe tous les types : débordement de cours d’eau, ruissellement de pluie, remontée de nappe et submersion marine." />
            {/* Rappel court sur l'assurance ; le détail va dans le repli */}
            <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
              Ces données ne permettent pas de prévoir votre cotisation. La surprime CatNat est fixée nationalement.
            </p>
            {/* Niveau 3 — méthode et sources, repliées */}
            <Disclosure summary="Comprendre les chiffres et leurs limites">
              {reprLine && <div>Données 1995-2021, établies sur un échantillon CCR. Couverture du marché local : {reprLine}.</div>}
              <div>La fréquence rapporte les sinistres indemnisés aux biens assurés, exprimée pour mille (‰).</div>
              <div>La surprime légale CatNat est fixée à 20 % de la prime dommages depuis le 1ᵉʳ janvier 2025. Une modulation selon l&apos;exposition locale est débattue : si elle advenait, le passé local mesuré ici compterait davantage.</div>
              <div>ONRN (État / CCR / Mission Risques Naturels), via Géorisques. Biens assurés particuliers et professionnels.</div>
            </Disclosure>
          </div>
        </GlassCard>
      </div>
    </ReportSection>
  );
}

// Statut réglementaire au point (Face 2) — exploite le zonage PPRN déjà renvoyé par
// Géorisques (spike 2026-07-03 : /api/v2/gaspar/pprn suffit). On CONSERVE le terme
// réglementaire officiel + une glose en langage courant ; on ne déduit JAMAIS les travaux
// autorisés ou interdits (le règlement local seul les porte).
const REGIME_GLOSS: Record<string, { title: string; note: string }> = {
  "01": { title: "Zone de prescriptions (hors zone d’aléa)", note: "Des conditions particulières peuvent s’appliquer. Le détail dépend du règlement officiel de cette zone." },
  "02": { title: "Zone soumise à prescriptions", note: "Des conditions particulières peuvent s’appliquer aux projets et aux travaux. Le détail dépend du règlement officiel de cette zone." },
  "03": { title: "Zone relevant d’un régime d’interdiction", note: "Certains projets peuvent être interdits. Les possibilités concernant le logement existant dépendent du règlement local." },
  "04": { title: "Zone relevant d’un régime d’interdiction stricte", note: "C’est le régime réglementaire le plus contraignant. Le classement seul ne permet pas de déterminer les travaux précisément autorisés ou interdits." },
  "05": { title: "Zone où un délaissement est possible", note: "Régime réglementaire particulier. Le détail dépend du règlement officiel de cette zone." },
  "06": { title: "Zone où une expropriation est possible", note: "Régime réglementaire particulier. Le détail dépend du règlement officiel de cette zone." },
};
// Couleur du titre par sévérité RÉGLEMENTAIRE officielle (pas un score) : prescriptions =
// ambre du rapport, interdiction = orange, interdiction stricte = rouge. Évite qu'une simple
// prescription ressemble à une alerte critique.
const REGIME_COLOR: Record<string, string> = {
  "01": "var(--yellow, #b8a042)",
  "02": "var(--yellow, #b8a042)",
  "03": "var(--orange, #c47a3a)",
  "04": "var(--red, #f87171)",
  "05": "var(--orange, #c47a3a)",
  "06": "var(--red, #f87171)",
};
function regimeColor(code: string | null): string {
  return REGIME_COLOR[code ?? ""] ?? "var(--fg-hi)";
}
// Aléa lisible à partir du modèle de procédure (bonus ; à défaut on s’appuie sur le nom du plan).
const HAZARD_LABEL: Record<string, string> = {
  "PPRN-I": "Inondation",
  "PPRN-RGA": "Retrait-gonflement des argiles",
  "PPRN-MT": "Mouvements de terrain",
  "PPRN-SM": "Submersion marine",
  "PPRN-F": "Feux de forêt",
  "PPRN-A": "Avalanches",
  "PPRN-S": "Séisme",
};

// Libellé de zone lisible et non redondant : « Zone B2 — faiblement à moyennement exposée ».
// La donnée répète souvent le code dans le nom (« … (B2) ») et le préfixe « Zone » : on purge.
function zoneLabel(zoneCode: string | null, zoneName: string | null): string | null {
  let name = (zoneName ?? "").trim();
  if (zoneCode && name.endsWith(`(${zoneCode})`)) name = name.slice(0, -(zoneCode.length + 2)).trim();
  name = name.replace(/^zone\s+/i, "").trim();
  if (zoneCode && name) return `Zone ${zoneCode} — ${name}`;
  if (zoneCode) return `Zone ${zoneCode}`;
  return name || null;
}

function RegulatoryPlanCard({ plan, roleLabel }: { plan: RegulatoryPlan; roleLabel?: string }) {
  const fiche = plan.gasparId
    ? `https://www.georisques.gouv.fr/donnee-risques/PPR/Fiche-ppr/pprn/${plan.gasparId}`
    : null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {roleLabel && <div style={FACE3_FAMILY}>{roleLabel}</div>}
      {plan.zones.length > 0 ? (
        plan.zones.map((z, i) => {
          const g = REGIME_GLOSS[z.regimeCode ?? ""] ?? { title: z.regime ?? "Zone réglementée", note: "Le détail dépend du règlement officiel de cette zone." };
          const zl = zoneLabel(z.zoneCode, z.zoneName);
          return (
            <div key={i} style={{ display: "grid", gap: 4 }}>
              {/* Terme réglementaire officiel, en ancre scannable, coloré par sévérité */}
              <div style={{ fontSize: 15, fontWeight: 500, color: regimeColor(z.regimeCode) }}>{g.title}</div>
              {/* Plan puis zone, en faits secondaires (une idée par ligne, pas de phrase dense) */}
              {plan.plan && <div style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{plan.plan}</div>}
              {zl && <div style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>{zl}</div>}
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, marginTop: 2 }}>{g.note}</div>
            </div>
          );
        })
      ) : (
        // État C : plan présent au point, zone non détaillée dans la donnée reçue.
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            {plan.plan ? <>Cette adresse relève du <strong style={{ color: "var(--fg-hi)" }}>{plan.plan}</strong>.</> : "Cette adresse relève d’un plan de prévention."}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>Le régime ou le libellé détaillé de la zone n’est pas disponible dans les données reçues.</div>
        </div>
      )}
      {fiche && (
        <a href={fiche} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", marginTop: 2 }}>
          Consulter la fiche officielle du plan →
        </a>
      )}
    </div>
  );
}

// Niveau 1 — phrase langage courant, honnête, sensible à la sévérité SANS produire de score.
function regulatoryHeadline(plans: RegulatoryPlan[]): string {
  const topRank = plans[0]?.topRegimeRank ?? 99;
  return topRank <= 1
    ? "Cette adresse se situe dans une zone où certains projets et travaux peuvent être interdits ou strictement encadrés."
    : "Cette adresse se situe dans une zone où certains projets et travaux peuvent être soumis à des règles particulières.";
}

function RegulatoryStatusBlock({ georisques }: { georisques: ApiResponse["georisques"] }) {
  const g = georisques?.parcel ?? georisques?.address;
  const plans = g?.regulatoryPlans ?? [];
  return (
    <ReportSection eyebrow="Statut réglementaire à cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 16 }}>
          {!g ? (
            // État B : la source n'a pas permis de qualifier le point.
            <>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>Statut réglementaire non déterminé</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>Les données interrogées n’ont pas permis de qualifier cette adresse.</p>
            </>
          ) : plans.length === 0 ? (
            // État A : la source a répondu, aucun zonage n'intersecte le point.
            <>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: 0 }}>Aucune zone réglementée identifiée à cette adresse</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                La commune peut être couverte par un plan de prévention sans que le point se situe dans l’une de ses zones réglementées. Cela ne signifie pas que le logement est exempt de tout risque.
              </p>
            </>
          ) : (
            <>
              {/* Niveau 1 — comprendre en cinq secondes */}
              <p style={{ fontSize: 15, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>{regulatoryHeadline(plans)}</p>
              {/* Niveau 2 — le fait précis, par plan */}
              {plans.length === 1 ? (
                <RegulatoryPlanCard plan={plans[0]} />
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  <RegulatoryPlanCard plan={plans[0]} roleLabel="Règle la plus contraignante" />
                  {plans.slice(1).map((p, i) => (
                    <div key={i} style={{ paddingTop: 12, borderTop: "1px solid var(--border-1)" }}>
                      <RegulatoryPlanCard plan={p} roleLabel="Autre zonage applicable" />
                    </div>
                  ))}
                  <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
                    Ces zonages peuvent concerner des phénomènes ou des règlements différents. Leur ordre sert la lecture.
                  </div>
                </div>
              )}
              {/* Niveau 3 — méthode et détail technique, repliés */}
              <Disclosure summary="Comprendre ce classement">
                <div>Grain : adresse (la donnée répond au point géocodé, pas à la géométrie de la parcelle).</div>
                {plans.map((p, i) => {
                  const hazard = p.hazardModel ? HAZARD_LABEL[p.hazardModel] ?? null : null;
                  return (
                    <div key={i}>
                      {p.plan ?? "Plan"}
                      {hazard ? ` · risque concerné : ${hazard}` : ""}
                      {p.zones[0]?.regime ? ` · régime officiel : ${p.zones[0].regime}` : ""}
                      {p.updatedAt ? ` · date de référence Géorisques : ${p.updatedAt}` : ""}
                    </div>
                  );
                })}
                <div>Géorisques (PPRN, information réglementaire). Le classement ne résume pas le règlement : les travaux autorisés ou interdits ne se lisent que dans le règlement officiel de la zone.</div>
              </Disclosure>
            </>
          )}
        </div>
      </GlassCard>
    </ReportSection>
  );
}

// « Ce que cela mérite de vérifier » — traduit la donnée en action, adaptée à la posture.
// Déterministe, jamais un score ni une injonction alarmiste (« Qu'est-ce que j'en fais ? »).
function Face2Implication({ projet, georisques, sinistralite }: { projet: string | null; georisques: ApiResponse["georisques"]; sinistralite: OnrnSinistralite | null | undefined }) {
  const g = georisques?.parcel ?? georisques?.address;
  const hasZone = (g?.regulatoryPlans?.length ?? 0) > 0;
  const siniActive = Boolean(sinistralite) && [sinistralite!.secheresse.kind, sinistralite!.inondation.kind].some((k) => k === "lecture" || k === "faible_repr");
  if (!hasZone && !siniActive) return null;
  const posture = POSTURE_FOR_PROJET[projet ?? "reside"] ?? "residence";
  return (
    <ReportSection eyebrow="Ce que cela mérite de vérifier" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
            {hasZone
              ? "Ce logement relève d’au moins une zone réglementée, et la commune a connu des sinistres indemnisés. Rien n’est certain pour ce bien, mais cela oriente ce qu’il vaut la peine de regarder."
              : "La commune a connu des sinistres indemnisés. Rien n’est certain pour ce bien, mais cela oriente ce qu’il vaut la peine de regarder."}
          </p>
          <p style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.65, margin: 0 }}>
            {posture === "prospection"
              ? "Avant d’acheter : demandez si des sinistres (fissures liées à la sécheresse, dégâts des eaux) ont déjà été déclarés, et consultez le règlement de la zone avant tout projet de travaux ou d’extension."
              : "Si vous occupez ce logement : surveillez l’évolution d’éventuelles fissures, conservez les justificatifs de travaux et de sinistres, et vérifiez le règlement de la zone avant un projet d’extension."}
          </p>
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
  services: "Services du quotidien",
};
// Nature de l'espace vert le plus proche : on nomme précisément ce que OSM a cartographié
// (parc / bois / …) plutôt qu'un « espace vert » générique. Repli générique si le tag manque
// (snapshot antérieur au greenKind).
const GREEN_LABEL: Record<GreenKind, string> = {
  park: "Parc",
  wood: "Bois",
  forest: "Forêt",
  grass: "Pelouse",
  recreation_ground: "Terrain de plein air",
};
function greenSpaceLabel(kind: GreenKind | undefined): string {
  return kind ? GREEN_LABEL[kind] : "Espace vert";
}
// Sous-titre de brique (vie quotidienne / vigilance / repère) et libellé de famille
// (métadonnée secondaire au-dessus du type précis). Rendent visible la hiérarchie éditoriale.
const FACE3_SUBHEAD: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--accent-dim, #7a6e60)",
};
const FACE3_FAMILY: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--fg-4)",
};
function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${m} m`;
}
// Une ligne « type précis — env. distance ». Le type est en évidence, la distance à droite,
// alignée sur la même ligne de base que le type (chiffres tabulaires pour l'alignement).
function Face3Line({ label, meters }: { label: string; meters: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontSize: 15, color: "var(--fg-1)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, color: "var(--fg-hi)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>env. {fmtDist(meters)}</span>
    </div>
  );
}
function Face3Block({ s }: { s: Face3Snapshot }) {
  return (
    <ReportSection eyebrow="Autour de cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 22 }}>
          <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
            Les équipements et repères cartographiés les plus proches du logement.
          </p>

          {/* Brique 1 — vie quotidienne (socle) : famille en métadonnée, type précis en
              information principale, distance alignée sur la ligne de base du type. */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={FACE3_SUBHEAD}>Vie quotidienne</div>
            <div style={{ display: "grid", gap: 10 }}>
              {s.bpe.categories.map((c) => (
                <div key={c.category} style={{ display: "grid", gap: 2 }}>
                  <span style={FACE3_FAMILY}>{FACE3_CAT_LABEL[c.category]}</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                    <span style={{ fontSize: 15, color: c.nearest ? "var(--fg-1)" : "var(--fg-4)", fontWeight: 500 }}>
                      {c.nearest ? (c.nearest.typeLabel ?? FACE3_CAT_LABEL[c.category]) : "Aucun recensé"}
                    </span>
                    <span style={{ fontSize: 15, color: c.nearest ? "var(--fg-hi)" : "var(--fg-4)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {c.nearest ? `env. ${fmtDist(c.nearest.distanceMeters)}` : `dans les ${c.searchCapMeters / 1000} km analysés`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brique 2 — espace vert (repère). Infra de transport (bruit/nuisance) déplacée
              vers le futur module Santé, au grain adresse. */}
          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 8 }}>
            <div style={FACE3_SUBHEAD}>Espace vert</div>
            {s.sourceStatus.osmGreenSpaces === "pending" ? (
              <em style={{ color: "var(--fg-4)", fontSize: 14 }}>Environnement en cours de récupération…</em>
            ) : s.sourceStatus.osmGreenSpaces === "failed" ? (
              <span style={{ color: "var(--fg-4)", fontSize: 14 }}>Espaces verts : donnée momentanément indisponible.</span>
            ) : s.osm.nearestMappedGreenSpace ? (
              <Face3Line label={greenSpaceLabel(s.osm.nearestMappedGreenSpace.kind)} meters={s.osm.nearestMappedGreenSpace.distanceMeters} />
            ) : (
              <span style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
                Aucun espace vert correspondant aux catégories recherchées dans l’emprise cartographiée.
              </span>
            )}
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.85 }}>
            Sources : INSEE, BPE 2024 · © les contributeurs OpenStreetMap (ODbL) · distances approximatives à vol d’oiseau
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [projet, setProjet] = useState<string | null>(null);
  const [autour, setAutour] = useState<Face3Snapshot | null>(null);
  // Attribution du DPE au logement (cf. spec §2). Aucun DPE affiché comme « le vôtre » tant
  // qu'il n'est pas confirmé (auto ou par l'utilisateur).
  const [dpeStatus, setDpeStatus] = useState<
    "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error"
  >("loading");
  const [selectedDpe, setSelectedDpe] = useState<DpeRecord | null>(null);
  const [dpeCandidates, setDpeCandidates] = useState<DpeRecord[]>([]);
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

  // Déclenchée par la sélection d'une suggestion BAN (le texte libre n'analyse jamais). On
  // envoie l'adresse ATOMIQUE au serveur ; on dérive ensuite l'état d'attribution du DPE.
  async function analyzeSelected(a: BanAddressResult) {
    if (!a.id) { setError("Adresse sans identifiant BAN."); return; }
    setLoading(true);
    setError(null);
    setSynthesis(null);
    setAutour(null);
    autourRetriedRef.current = false;
    setDpeStatus("loading");
    setSelectedDpe(null);
    setDpeCandidates([]);
    try {
      const res = await fetch("/api/georisques-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: {
          banId: a.id, label: a.label, postcode: a.postcode ?? "", city: a.city ?? "",
          citycode: a.citycode ?? "", latitude: a.latitude, longitude: a.longitude, type: a.type,
        } }),
      });
      const payload = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setResult(payload);
      setProjet(null);
      const candidates = payload.dpeCandidates ?? [];
      setDpeCandidates(candidates);
      const attribution = dpeAttributionStatus(candidates, payload.banFeatureType ?? null);
      if (attribution.status === "not_found") {
        setDpeStatus("not_found");
      } else if (attribution.status === "auto_confirmed") {
        setSelectedDpe(attribution.dpe);
        setDpeStatus("auto_confirmed");
        void persistDpe("auto_confirmed", attribution.dpe, payload);
      } else {
        setDpeStatus("selection_required");
      }
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
        dpe_attribution: attribution.status,
        insee: payload.address?.citycode ?? null,
      });
      void requestAutour(payload, "residence");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Persiste le choix DPE dans l'artefact logement (échec silencieux à l'UI ; cohérence rétablie
  // au prochain chargement). `payload` fournit l'adresse quand `result` n'est pas encore posé.
  async function persistDpe(
    status: "auto_confirmed" | "user_confirmed" | "not_in_list",
    dpe: DpeRecord | null,
    payload?: ApiResponse,
  ) {
    const a = (payload ?? result)?.address;
    if (!a?.citycode) return;
    try {
      await fetch("/api/logement-dpe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee: a.citycode, status, dpe }),
      });
    } catch { /* échec silencieux */ }
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
        body: JSON.stringify({ data: {
          ...result,
          selectedDpe,
          dpeSelectionStatus: dpeStatus === "confirmed" ? "user_confirmed" : dpeStatus,
        } }),
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

  // Le DPE « du logement » = uniquement le choix attribué (jamais un candidat non confirmé).
  const dpe = (dpeStatus === "auto_confirmed" || dpeStatus === "confirmed") ? selectedDpe : null;
  const isPassoire = ["F", "G"].includes(dpe?.etiquette_dpe ?? "");
  const georisques = result?.georisques?.parcel ?? result?.georisques?.address;
  // Les libellés PPRN ne sont plus aplatis ici : ils sont portés, structurés (régime + zone +
  // plan), par le bloc « Statut réglementaire à cette adresse ». On garde les autres risques.
  const allRisks = (georisques?.risks?.labels ?? []).filter((v, i, a) => a.indexOf(v) === i);
  const hasRegulatoryZones = (georisques?.regulatoryPlans?.length ?? 0) > 0;

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
          <div className="mb-8">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par défaut</p>
            <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Analyser un logement précis.
            </h2>
            <p className="text-[15px] text-muted leading-[1.65] mt-3 max-w-[640px]">
              Entrez une adresse pour lire ce logement précis : sa performance énergétique, les risques du bâti, ce que le passé a coûté à assurer, et ce qui se trouve autour.
            </p>
          </div>

          <div className="glass rounded-xl p-8 border-t-2 border-t-accent" style={{ maxWidth: 760 }}>
            <AddressAutocomplete
              placeholder={`Ex. : 12 rue des Minimes${defaultCommune ? `, ${defaultCommune}` : ""}`}
              onSelect={(a) => void analyzeSelected(a)}
            />
            {loading && (
              <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Analyse en cours…
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", borderRadius: 10, color: "var(--red, #f87171)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {error}
              </div>
            )}
          </div>
        </section>

      {/* ── RÉSULTATS ── */}
      {result && (
        <section style={{ padding: "24px 0 96px", display: "grid", gap: 40 }}>

          {/* Passeport du bien : identité au grain adresse, DPE en sceau. */}
          <PropertyPassport
            address={result.address}
            parcel={result.parcel}
            dpe={dpe}
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

              {/* Énergie — attribution du DPE au logement (sélecteur / absence / rejet / confirmé) */}
              {dpeStatus === "selection_required" && (
                <ReportSection eyebrow="Énergie & rénovation" tone="orange">
                  <GlassCard>
                    <DpeSelector
                      candidates={dpeCandidates}
                      context={deriveAddressDpeContext(dpeCandidates)}
                      onPick={(d) => { setSelectedDpe(d); setDpeStatus("confirmed"); void persistDpe("user_confirmed", d); }}
                      onNotInList={() => { setSelectedDpe(null); setDpeStatus("rejected"); void persistDpe("not_in_list", null); }}
                    />
                  </GlassCard>
                </ReportSection>
              )}
              {dpeStatus === "not_found" && (
                <ReportSection eyebrow="Énergie & rénovation" tone="orange">
                  <GlassCard>
                    <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                      Aucun DPE retrouvé dans la base ouverte pour cette adresse. Cela ne signifie pas nécessairement qu&apos;aucun diagnostic n&apos;existe.
                    </p>
                  </GlassCard>
                </ReportSection>
              )}
              {dpeStatus === "rejected" && (
                <ReportSection eyebrow="Énergie & rénovation" tone="orange">
                  <GlassCard>
                    <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                      Aucun des diagnostics retrouvés n&apos;a été attribué à ce logement.
                    </p>
                  </GlassCard>
                </ReportSection>
              )}
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
                    {dpeStatus === "auto_confirmed" && (
                      <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
                        Un DPE a été retrouvé pour cette adresse.{" "}
                        <button type="button" onClick={() => setDpeStatus("selection_required")} style={{ color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>Ce n&apos;est pas le bon diagnostic</button>.
                      </p>
                    )}

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

              {/* Statut réglementaire au point (PPRN) — entre l'exposition et la sinistralité communale */}
              {result.georisques && <RegulatoryStatusBlock georisques={result.georisques} />}

              {/* Face 2 — matérialité assurantielle passée (ONRN) */}
              {result.sinistralite && <SinistraliteBlock sinistralite={result.sinistralite} />}

              {/* Sortie décisionnelle Face 2 : ce que cela mérite de vérifier (posture) */}
              <Face2Implication projet={projet} georisques={result.georisques} sinistralite={result.sinistralite} />

              {/* Face 3 — autour de cette adresse (buffer local au point géocodé) */}
              {autour && <Face3Block s={autour} />}

              {/* ZFE (Crit'Air) retirée : contrainte sur le véhicule, pas sur le logement.
                  Parquée pour le futur module Mobilité. */}

            </div>
          )}

          {/* ═════════════════════ AGIR ═════════════════════ */}
          {(
            <div style={{ display: "grid", gap: 36 }}>

              {/* Actions IA générées si dispo, sinon actions par défaut selon le profil.
                  « Quoi vérifier » lié au logement : CONSERVÉ. Seule la liste générique
                  « Pages Savoir associées » (pour aller plus loin) a été retirée le 2026-07-03
                  (décision porteur), à réévaluer à la fin de tous les modules. */}
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
                      {(allRisks.length > 0 || hasRegulatoryZones) && (
                        <ActionCard
                          title="Vérifier votre couverture assurance"
                          desc="Contacter votre assureur pour anticiper toute évolution de prime ou de garantie sur votre zone."
                          href="/savoir/assurance-littorale"
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

            </div>
          )}

        </section>
      )}
      </div>
    </div>
  );
}
