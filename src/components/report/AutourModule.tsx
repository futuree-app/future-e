"use client";

// ════════════════════════════════════════════════════════════════════════════════════════════
// MODULE 02 — AUTOUR DE L'ADRESSE (extrait du module Logement le 29/07/2026)
//
// POURQUOI IL EXISTE SÉPARÉMENT. L'entourage d'une adresse était le « beat 4 » du module
// Logement : on ne pouvait le lire qu'après avoir fait analyser un bâti (DPE, risques,
// sinistralité). Or ce n'est pas la même question, ce n'est pas la même échelle, et ce n'est
// souvent pas le même moment : on regarde ce qu'il y a autour bien avant de s'intéresser aux
// murs. Les trois modules du produit sont désormais trois ÉCHELLES (commune / secteur / bâti),
// et celle-ci se lit seule.
//
// CE QU'IL PARTAGE AVEC LOGEMENT, ET CE QU'IL NE PARTAGE PAS. Il écrit dans la MÊME ligne
// `logement` (clé user + identifiant BAN), donc analyser une adresse ici la rend rehydratable
// là-bas, et réciproquement. Il n'appelle PAS `/api/georisques-logement` : le snapshot « autour »
// ne dépend que du point géocodé (BPE, OSM, îlot de chaleur, secteur INSEE). Une adresse suffit,
// aucune parcelle n'est requise.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Face3Snapshot } from "@/lib/logement-autour-types";
import type { LogementRow } from "@/lib/logement-store";
import type { BanAddressResult } from "@/lib/ban";
import type { CarOwnership } from "@/lib/iris-logement";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import { Face3Block } from "@/components/report/logement/AutourSection";
import { IcuExposure } from "@/components/report/logement/IcuExposure";

// Jeton d'adresse non réversible pour l'analytics : distingue deux adresses sans stocker
// l'adresse (djb2 -> base36). Même fonction que dans LogementModule, volontairement dupliquée :
// quatre lignes, aucune dépendance, plutôt qu'un module partagé pour un détail d'instrumentation.
function addressToken(banId: string): string {
  let h = 5381;
  for (let i = 0; i < banId.length; i++) h = ((h << 5) + h + banId.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Le strict nécessaire pour interroger l'« autour » d'un point : une adresse BAN géocodée.
type AnalyzedAddress = {
  id: string; label: string; citycode: string; city: string | null;
  postcode: string | null; latitude: number; longitude: number;
};

export default function AutourModule({
  defaultCommune,
  initialRow = null,
  initialCarOwnership = null,
}: {
  defaultCommune?: string | null;
  initialRow?: LogementRow | null;
  initialCarOwnership?: CarOwnership | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // L'adresse effectivement analysée, gardée ENTIÈRE (pas seulement son libellé) : le retry OSM
  // en a besoin pour re-demander le même point, qu'elle vienne d'une saisie ou d'une rehydratation.
  const [analyzed, setAnalyzed] = useState<AnalyzedAddress | null>(null);
  const [autour, setAutour] = useState<Face3Snapshot | null>(null);
  const [carOwnership, setCarOwnership] = useState<CarOwnership | null>(null);
  // Commune de l'adresse tapée non débloquée par le rapport de l'utilisateur (frontière de
  // monétisation, étape 4.5) : upsell honnête, jamais les données.
  const [lockedCommune, setLockedCommune] = useState<{ commune: string | null; insee: string | null } | null>(null);
  // Remonte AddressAutocomplete pour repartir d'un champ vide (« Modifier l'adresse »).
  const [addressResetKey, setAddressResetKey] = useState(0);
  const autourRetriedRef = useRef(false);
  const rehydratedRef = useRef(false);
  const posthog = usePostHog();

  // Demande (ou relit, figé) le snapshot « autour de l'adresse ». La donnée OSM vient du cache de
  // tuile côté serveur ; l'affichage ne touche jamais Overpass.
  async function requestAutour(a: AnalyzedAddress) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/logement-autour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logement_id: a.id,
          insee: a.citycode,
          latitude: a.latitude,
          longitude: a.longitude,
          address_label: a.label,
          city: a.city,
          postcode: a.postcode,
          // Aucune parcelle ici : ce module ne géocode pas de bâti. La route préserve le
          // `parcel_code` déjà en base plutôt que de l'écraser (cf. route logement-autour).
          posture: "residence",
        }),
      });
      const payload = (await res.json()) as {
        snapshot?: Face3Snapshot; carOwnership?: CarOwnership;
        error?: string; code?: string; insee?: string | null;
      };
      if (res.status === 403 && payload.code === "COMMUNE_NOT_UNLOCKED") {
        setAutour(null);
        setLockedCommune({ commune: a.city, insee: payload.insee ?? a.citycode });
        posthog?.capture("autour_commune_locked", { insee: a.citycode });
        return;
      }
      if (!res.ok || !payload.snapshot) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setAutour(payload.snapshot);
      setCarOwnership(payload.carOwnership ?? null);
      setAnalyzed(a);
      posthog?.capture("autour_analyzed", {
        insee: a.citycode,
        address_token: addressToken(a.id),
        status_bpe: payload.snapshot.sourceStatus.bpe,
        status_osm_infra: payload.snapshot.sourceStatus.osmInfrastructure,
        status_osm_green: payload.snapshot.sourceStatus.osmGreenSpaces,
      });
    } catch (err) {
      setAutour(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  function analyzeSelected(a: BanAddressResult) {
    if (!a.id || !a.citycode || a.latitude == null || a.longitude == null) {
      setError("Adresse sans coordonnées exploitables.");
      return;
    }
    setLockedCommune(null);
    setAutour(null);
    autourRetriedRef.current = false;
    posthog?.capture("autour_address_selected", { insee: a.citycode, address_token: addressToken(a.id) });
    void requestAutour({
      id: a.id, label: a.label, citycode: a.citycode, city: a.city ?? null,
      postcode: a.postcode ?? null, latitude: a.latitude, longitude: a.longitude,
    });
  }

  // Remplissage asynchrone minimal : si l'OSM est revenu `pending` (tuile froide, Overpass lent),
  // on re-demande UNE fois après un court délai (la tuile est alors chaude grâce au after()
  // serveur). Au-delà = incrément futur. Même règle que dans LogementModule.
  useEffect(() => {
    if (!autour || !analyzed || autourRetriedRef.current) return;
    if (autour.sourceStatus.osmInfrastructure !== "pending") return;
    autourRetriedRef.current = true;
    const target = analyzed;
    const t = setTimeout(() => void requestAutour(target), 4500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autour, analyzed]);

  // Au montage : si la page serveur a résolu une adresse déjà analysée, on l'affiche telle
  // quelle. Le snapshot est FIGÉ (historique) ; l'équipement automobile, lui, a été relu au
  // rendu par la page (artefact versionné, jamais figé — cf. autour-response.ts).
  useEffect(() => {
    if (rehydratedRef.current || !initialRow?.snapshot) return;
    rehydratedRef.current = true;
    setAutour(initialRow.snapshot);
    setCarOwnership(initialCarOwnership);
    setAnalyzed({
      id: initialRow.logement_id, label: initialRow.address_label, citycode: initialRow.insee,
      city: initialRow.city, postcode: initialRow.postcode,
      latitude: initialRow.latitude, longitude: initialRow.longitude,
    });
    posthog?.capture("autour_restored", {
      insee: initialRow.insee,
      address_token: addressToken(initialRow.logement_id),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetToSearch() {
    setAutour(null);
    setError(null);
    setLockedCommune(null);
    setAnalyzed(null);
    autourRetriedRef.current = false;
    setAddressResetKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-canvas text-label relative overflow-hidden" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-green/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/rapport", label: "Mon rapport" }, primary: { href: "/dashboard", label: "Dashboard" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">
        <section className="py-20">
          <div className="max-w-[720px]">
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase mb-5" style={{ color: "var(--green)" }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--green)" }} />
              Module 02 · Autour de l&apos;adresse
            </div>
            <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Ce qu&apos;il y a autour.<br />
              <span className="italic" style={{ color: "var(--green)" }}>Services, nature, chaleur.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[560px]">
              Entre la commune et les murs, il y a le secteur. Ce que vous avez réellement à portée
              de pas, ce que vous n&apos;avez pas, et ce que l&apos;environnement proche fait à la
              chaleur de l&apos;été.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" prefetch={false} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Retour au hub
              </Link>
              <Link href="/rapport/quartier" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Voir le module Territoire
              </Link>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.08]" />

        <section className="pt-14">
          <div className="mb-8">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par défaut</p>
            <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Analyser les environs d&apos;une adresse.
            </h2>
          </div>

          <div className="glass rounded-xl p-8" style={{ maxWidth: 760, borderTop: "2px solid var(--green)" }}>
            <AddressAutocomplete
              key={addressResetKey}
              placeholder={`Ex. : 12 rue des Minimes${defaultCommune ? `, ${defaultCommune}` : ""}`}
              onSelect={(a) => analyzeSelected(a)}
              showModify={!lockedCommune}
              onModify={resetToSearch}
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

            {lockedCommune && (
              <div style={{ marginTop: 16, padding: "16px 18px", background: "var(--bg-elev)", border: "1px solid var(--border-2)", borderRadius: 12, display: "grid", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                  Cette adresse est située à <strong style={{ color: "var(--fg-hi)" }}>{lockedCommune.commune ?? "une autre commune"}</strong>.
                </p>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6 }}>
                  Votre rapport actuel ne donne pas accès à cette commune. Débloquez {lockedCommune.commune ?? "cette commune"} pour lire ce qui entoure cette adresse.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                  {lockedCommune.insee && (
                    <Link
                      href={`/territoire/${lockedCommune.insee}/debloquer?${new URLSearchParams({ ...(lockedCommune.commune ? { nom: lockedCommune.commune } : {}), source: "autour" }).toString()}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/[0.12] text-accent text-[13.5px] no-underline border border-accent/[0.25] w-fit"
                    >
                      Débloquer cette commune
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={resetToSearch}
                    style={{ fontSize: 12.5, color: "var(--fg-4)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Modifier l&apos;adresse
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {autour && (
          <section style={{ padding: "40px 0 96px", display: "grid", gap: 36 }}>
            {analyzed && (
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-4)" }}>
                  Adresse analysée
                </span>
                <span style={{ fontSize: 16, color: "var(--fg-hi)" }}>{analyzed.label}</span>
              </div>
            )}

            {/* Note informative si l'adresse est hors de la commune de résidence (commune
                débloquée, cf. 4.5). Même règle que dans le module Logement. */}
            {defaultCommune && analyzed?.city && analyzed.city.toLowerCase() !== defaultCommune.toLowerCase() && (
              <div style={{ padding: "12px 16px", background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65 }}>
                Cette lecture porte sur un secteur de <strong>{analyzed.city}</strong>. Votre commune principale reste <strong>{defaultCommune}</strong>.
              </div>
            )}

            <Face3Block s={autour} car={carOwnership} />

            {/* L'îlot de chaleur est REVENU dans ce module le 29/07/2026. Il en était sorti quand
                l'« autour » n'était qu'un beat du module Logement : l'entourage y était le bloc
                positif (services, verdure) et une exposition n'y avait pas sa place, alors elle a
                rejoint « les risques du bâti ». Ce module-ci n'a plus ce problème — il décrit
                l'environnement proche, en bien comme en mal, et la chaleur du quartier EST une
                caractéristique de l'environnement proche, pas des murs. */}
            {autour.icu && (
              <ReportSection eyebrow="Chaleur de l'environnement proche" tone="orange">
                <GlassCard>
                  <IcuExposure icu={autour.icu} />
                </GlassCard>
              </ReportSection>
            )}

            <ReportSection eyebrow="Poursuivre" tone="neutral">
              <GlassCard>
                <div style={{ display: "grid", gap: 14 }}>
                  <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
                    Ce module s&apos;arrête au seuil du bâtiment. Ce que ce logement précis absorbe
                    ou laisse passer, son diagnostic énergétique et ce à quoi son adresse est
                    exposée se lisent dans le module Logement.
                  </p>
                  <Link href="/rapport/logement" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13.5px] no-underline border border-white/[0.08] w-fit">
                    Ouvrir le module Logement →
                  </Link>
                </div>
              </GlassCard>
            </ReportSection>
          </section>
        )}
      </div>
    </div>
  );
}
