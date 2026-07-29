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
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { CarOwnership } from "@/lib/iris-logement";
import { ReportSection, GlassCard } from "@/components/report/kit";
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

// Le module ne fait plus SAISIR une adresse : il en analyse UNE, celle du dossier ouvert.
// L'adresse est fixée à la création du dossier et vit sur une ligne que seul le serveur écrit.
// Une saisie libre serait de toute façon refusée : `georisques-logement` et `logement-autour`
// exigent que l'adresse soit celle du dossier.
export default function AutourModule({
  defaultCommune,
  dossier,
  initialCarOwnership = null,
}: {
  defaultCommune?: string | null;
  dossier: AddressDossierRow;
  initialCarOwnership?: CarOwnership | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // L'adresse effectivement analysée, gardée ENTIÈRE (pas seulement son libellé) : le retry OSM
  // en a besoin pour re-demander le même point, qu'elle vienne d'une saisie ou d'une rehydratation.
  const [analyzed, setAnalyzed] = useState<AnalyzedAddress | null>(null);
  const [autour, setAutour] = useState<Face3Snapshot | null>(null);
  const [carOwnership, setCarOwnership] = useState<CarOwnership | null>(null);
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
        // Le corps ne porte plus l'identité de l'adresse : la route la lit sur le dossier. Un
        // client qui pouvait l'envoyer pouvait déplacer un dossier payé sur une autre adresse.
        body: JSON.stringify({ dossierId: dossier.id, posture: "residence" }),
      });
      const payload = (await res.json()) as {
        snapshot?: Face3Snapshot; carOwnership?: CarOwnership;
        error?: string; code?: string; insee?: string | null;
      };
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
  // Au montage : l'adresse du dossier. Si l'entourage est déjà calculé, on l'affiche figé
  // (historique) ; sinon on le demande. L'équipement automobile, lui, est relu au rendu par la
  // page (artefact versionné, jamais figé, cf. autour-response.ts).
  useEffect(() => {
    if (rehydratedRef.current) return;
    rehydratedRef.current = true;
    const address: AnalyzedAddress = {
      id: dossier.ban_id, label: dossier.address_label, citycode: dossier.insee,
      city: dossier.city, postcode: dossier.postcode,
      latitude: dossier.latitude, longitude: dossier.longitude,
    };
    // Déféré en microtask : un setState synchrone dans le corps d'un effet déclenche des rendus
    // en cascade (même patron que le chargement, qui setState après un fetch).
    void Promise.resolve().then(() => {
      if (dossier.snapshot) {
        setAutour(dossier.snapshot);
        setCarOwnership(initialCarOwnership);
        setAnalyzed(address);
        posthog?.capture("autour_restored", {
          insee: dossier.insee,
          address_token: addressToken(dossier.ban_id),
        });
        return;
      }
      return requestAutour(address);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">L&apos;adresse de ce dossier</p>
            <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {dossier.address_label}
            </h2>
          </div>

          {/* L'adresse ne se saisit plus ici : elle est fixée à la création du dossier. Analyser
              un autre bien passe par un autre dossier, ce qui est exactement la règle que
              l'identité en uuid rend possible (deux appartements d'un même immeuble coexistent). */}
          <div className="glass rounded-xl p-8" style={{ borderTop: "2px solid var(--green)" }}>
            {loading && (
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Analyse en cours…
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", borderRadius: 10, color: "var(--red, #f87171)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {error}
              </div>
            )}

            {!loading && !error && (
              <Link
                href="/rapport/dossiers"
                className="inline-flex items-center gap-2 text-[13.5px] text-muted no-underline"
              >
                Analyser un autre bien
              </Link>
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
