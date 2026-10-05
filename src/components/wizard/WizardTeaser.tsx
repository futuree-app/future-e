"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WizardAnswers } from "./types";
import type { WizardPreviewData } from "@/app/api/wizard-preview/route";
import type { Era5Trend } from "@/lib/era5-trend";
import { computeSignals, type SignalContent } from "./teaser-signaux";


/* ── Carte d'ancrage ERA5 — affichée toujours, au-dessus des signaux d'exposition ── */
function Era5AnchorCard({ era5, ville }: { era5: Era5Trend; ville: string }) {
  const sign = era5.delta_c >= 0 ? "+" : "";
  return (
    <div
      className="rounded-[1.7rem] border border-dashed relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(96,165,250,0.07) 0%, rgba(96,165,250,0.02) 100%)",
        borderColor: "rgba(96,165,250,0.34)",
        padding: "1.75rem 2rem",
      }}
    >
      <div className="flex items-start gap-4">
        <span className="shrink-0 text-[20px] leading-none" style={{ marginTop: "0.15rem" }} aria-hidden>
          🌍
        </span>
        <div className="min-w-0 flex flex-col gap-1.5">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: "rgb(96,165,250)" }}>
            Repère · climat déjà observé
          </p>
          <p className="text-[16px] text-label leading-[1.4] font-medium text-balance mt-1">
            À {ville}, le changement climatique est déjà mesurable aujourd&apos;hui.
          </p>
          <p className="text-[18px] font-semibold leading-[1.3] mt-1" style={{ color: "rgb(96,165,250)" }}>
            {sign}{era5.delta_c.toFixed(1)}°C depuis la fin du XXᵉ siècle
          </p>
          <p className="text-[14px] text-muted leading-[1.4]">
            Mesuré sur la moyenne des 10 dernières années, comparée à la période 1961-1990.
          </p>
          <p className="font-mono text-[11px] text-ghost/75 tracking-[0.06em] leading-[1.4]" style={{ marginTop: "0.4rem" }}>
            Réanalyse ERA5-Land · Copernicus Climate Data Store · données jusqu&apos;à {era5.data_through_year}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Signal card — 4 lignes : headline / stat / precision / source ── */
function Signal({ icon, headline, stat, precision, source }: SignalContent) {
  return (
    <div className="rounded-[1.7rem] bg-[var(--bg-elev)] border border-[var(--border-1)]" style={{ padding: "1.75rem 2rem" }}>
      <div className="flex items-start gap-4">
        <span
          className="shrink-0 text-[20px] leading-none"
          style={{ marginTop: "0.15rem" }}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex flex-col gap-1.5">
          {/* Ligne 1 — ce que ça change */}
          <p className="text-[16px] text-label leading-[1.4] font-medium text-balance">
            {headline}
          </p>
          {/* Ligne 2 — chiffre principal */}
          <p className="text-[15px] text-accent font-semibold leading-[1.4]">
            {stat}
          </p>
          {/* Ligne 3 — précision concrète */}
          {precision && (
            <p className="text-[14px] text-muted leading-[1.4]">
              {precision}
            </p>
          )}
          {/* Micro-ligne — source / méthode */}
          <p className="font-mono text-[11px] text-ghost/75 tracking-[0.06em] leading-[1.4]" style={{ marginTop: "0.4rem" }}>
            {source}
          </p>
        </div>
      </div>
    </div>
  );
}

export function WizardTeaser({
  answers,
  context: _context,
  inseeCode,
  onRestart,
}: {
  answers: WizardAnswers;
  context: string | null;
  inseeCode: string | null;
  onRestart?: () => void;
}) {
  const ville = answers.quartier || "votre commune";

  const [data, setData] = useState<WizardPreviewData | null>(null);
  const [loadedInsee, setLoadedInsee] = useState<string | null>(null);

  useEffect(() => {
    if (!inseeCode) return;
    fetch(`/api/wizard-preview?insee=${inseeCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: WizardPreviewData | null) => {
        setData(json);
        setLoadedInsee(inseeCode);
      })
      .catch(() => {})
  }, [inseeCode]);

  const loading = Boolean(inseeCode) && loadedInsee !== inseeCode;
  const signals = computeSignals(data, answers, ville);
  // Affiche 2 signaux dévoilés si on en a au moins 3, sinon 1 seul
  const visibleCount = signals.length >= 3 ? 2 : 1;
  const visibleSignals = signals.slice(0, visibleCount);
  const lockedSignals = signals.slice(visibleCount);

  return (
    <div className="wizard-step flex flex-col gap-10 md:gap-12">

      {/* Headline — état chargement OU résultat */}
      <div className="max-w-[56rem] flex flex-col gap-6">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
          Aperçu personnalisé · {ville}
        </p>
        {loading ? (
          <>
            <h2
              className="font-semibold text-[length:var(--text-display)] leading-[1.04] tracking-[-0.03em] text-label text-balance"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Analyse de{" "}
              <span className="italic text-accent">votre exposition</span>{" "}
              en cours…
            </h2>
            <div className="relative h-[3px] max-w-[24rem] rounded-full bg-[var(--bg-elev-3)] overflow-hidden mt-2">
              <div
                className="absolute top-0 h-full bg-accent rounded-full"
                style={{ animation: "wizard-loading-bar 1.5s ease-in-out infinite" }}
              />
            </div>
            <p className="text-[14px] text-muted/70 leading-relaxed mt-1">
              Nous croisons vos réponses avec les données DRIAS et les risques officiels.
            </p>
          </>
        ) : (
          <h2
            className="font-semibold text-[length:var(--text-display)] leading-[1.04] tracking-[-0.03em] text-label text-balance"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Voici une{" "}
            <span className="italic text-accent">première lecture</span>{" "}
            de votre situation à{"\u00a0"}{ville}.
          </h2>
        )}
      </div>

      {/* Carte d'ancrage ERA5, toujours visible */}
      {!loading && data?.era5 && (
        <Era5AnchorCard era5={data.era5} ville={ville} />
      )}

      {/* Signals — 1 ou 2 visibles selon le nombre total, reste flouté */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {/* Signaux dévoilés */}
          {visibleSignals.map((s, i) => (
            <Signal key={`v-${i}`} {...s} />
          ))}

          {/* Signaux suivants — floutés avec verrou */}
          {lockedSignals.length > 0 && (
            <div className="relative mt-1 rounded-2xl overflow-hidden">
              <div
                className="flex flex-col gap-3 select-none pointer-events-none"
                style={{ filter: "blur(5px)", opacity: 0.7 }}
                aria-hidden
              >
                {lockedSignals.map((s, i) => (
                  <Signal key={i} {...s} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6,8,18,0.45)" }}>
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted border border-[var(--border-2)] rounded-full bg-canvas/85" style={{ padding: "0.75rem 1.5rem" }}>
                  La suite dans votre dossier
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paywall */}
      <div
        className="wizard-panel-lg rounded-3xl border border-accent/[0.16] relative overflow-hidden"
        style={{ background: "rgba(232, 130, 58,0.03)" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/[0.07] blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-7 md:gap-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
              Dossier
            </p>
            <p
              className="max-w-[42rem] text-[length:var(--text-title)] font-normal text-label leading-[1.08] tracking-[-0.025em] text-balance"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Le dossier approfondit cette première lecture à l&apos;échelle de la commune, autour de l&apos;adresse et du logement.
            </p>
            <p className="max-w-[42rem] text-[15px] text-muted leading-7">
              Construit à partir de vos réponses et des données publiques de {ville}.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/checkout/rapport-complet"
              className="wizard-cta flex w-full gap-2 rounded-xl bg-accent text-canvas text-[15px] no-underline transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              Débloquer mon dossier · 14 €
            </Link>
          </div>
        </div>
      </div>

      {onRestart && (
        <button
          type="button"
          onClick={onRestart}
          className="text-center font-mono text-[11px] tracking-[0.08em] uppercase text-ghost hover:text-muted transition-colors duration-200 py-2"
        >
          Recommencer depuis le début
        </button>
      )}

    </div>
  );
}
