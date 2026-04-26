"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WizardAnswers } from "./types";
import type { WizardPreviewData } from "@/app/api/wizard-preview/route";

/* ── Estimation DPE par période de construction ── */
function dpeFromYear(year: number): { label: string; classe: string; note: string } {
  if (year < 1948) return { label: "Avant 1948", classe: "F–G", note: "Passoire thermique probable · Rénovation urgente" };
  if (year < 1975) return { label: `Années ${year < 1960 ? "50" : year < 1970 ? "60" : "70"}`, classe: "E–G", note: "Isolation insuffisante · Rénovation obligatoire avant 2034" };
  if (year < 1990) return { label: `Années ${year < 1985 ? "80" : "80-90"}`, classe: "D–E", note: "Performance partielle · Travaux recommandés" };
  if (year < 2000) return { label: "Années 90", classe: "C–D", note: "Isolation RT1988 · Améliorable" };
  if (year < 2013) return { label: "Années 2000–10", classe: "C", note: "RT2000/2005 · Confort d'été à vérifier" };
  return { label: "Post-2013", classe: "A–B", note: "RT2012 · Logement bien isolé" };
}

const SLUG_LABELS: Record<string, string> = {
  canicule: "Canicule",
  submersion: "Submersion marine",
  feux: "Feux de forêt",
  cadmium: "Pollution agricole",
  dependance_auto: "Dépendance automobile",
  secheresse: "Sécheresse",
};

/* ── Signal card ── */
function Signal({ icon, label, value, note }: { icon: string; label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[1.7rem] bg-white/[0.03] border border-white/[0.07] px-8 pt-7 pb-6 md:px-9 md:pt-8 md:pb-7">
      <div className="flex items-start gap-6">
        <span className="mt-1.5 text-[22px] shrink-0 leading-none">{icon}</span>
        <div className="min-w-0 flex flex-col gap-2.5 md:gap-3">
          <p className="font-mono text-[11px] leading-[1.35] tracking-[0.16em] uppercase text-ghost">{label}</p>
          <p className="text-[15px] font-semibold text-label leading-[1.45]">{value}</p>
          {note && <p className="font-mono text-[11px] text-ghost/80 tracking-[0.04em] leading-[1.55]">{note}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton pendant le chargement ── */
function SignalSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
      ))}
    </div>
  );
}

/* ── Calcul des signaux ── */
function computeSignals(
  data: WizardPreviewData | null,
  answers: WizardAnswers,
  ville: string,
): Array<{ icon: string; label: string; value: string; note?: string }> {
  const signals: Array<{ icon: string; label: string; value: string; note?: string }> = [];

  if (data?.drias?.canicule_gwl20 !== null && data?.drias?.canicule_gwl20 !== undefined) {
    const d = data.drias!;
    signals.push({
      icon: "🌡",
      label: "Chaleur extrême · Scénario +2°C (2050)",
      value: `${d.canicule_gwl20} jours/an avec températures >30°C${d.delta_canicule !== null && d.delta_canicule > 0 ? ` (+${d.delta_canicule} vs scénario bas)` : ""}`,
      note: d.nuits_tropicales_gwl20 !== null && d.nuits_tropicales_gwl20 > 0
        ? `Dont ~${d.nuits_tropicales_gwl20} nuits tropicales · Source DRIAS 2050`
        : "Source DRIAS 2050",
    });
  } else if (answers.sante.includes("Sensibilité à la chaleur") || answers.sante.includes("Asthme / Troubles respiratoires")) {
    signals.push({
      icon: "🌡",
      label: "Sensibilité climatique",
      value: "Profil exposé aux vagues de chaleur et à la qualité de l'air",
      note: "Sélectionnez votre commune via la liste pour activer les données DRIAS",
    });
  }

  if (data?.tensions && data.tensions.length > 0) {
    const top = data.tensions[0];
    const slug = SLUG_LABELS[top.slug] ?? top.slug;
    const expo = top.ind_exposition !== null ? ` · Exposition ${Math.round(top.ind_exposition)}/100` : "";
    signals.push({
      icon: "📍",
      label: `Risque territorial · ${slug}`,
      value: `Score ${top.score}/100${expo}`,
      note: data.tensions.length > 1
        ? `${data.tensions.length} risques référencés pour ${ville}`
        : "Identifié dans la base nationale des risques climatiques",
    });
  }

  if (answers.logement) {
    const dpe = dpeFromYear(answers.logement.year);
    signals.push({
      icon: "🏠",
      label: `Logement · ${answers.logement.type === "maison" ? "Maison" : "Appartement"} · ${dpe.label}`,
      value: `DPE estimé ${dpe.classe}`,
      note: dpe.note,
    });
  }

  if (answers.mobilite === "voiture") {
    signals.push({
      icon: "🚗",
      label: "Mobilité",
      value: "Forte dépendance à la voiture individuelle",
      note: "Exposition aux coûts carburant, ZFE et tarification carbone",
    });
  } else if (answers.sante.length > 0 && !answers.sante.includes("Aucune sensibilité particulière")) {
    signals.push({
      icon: "🫁",
      label: "Santé environnementale",
      value: `${answers.sante.length} sensibilité${answers.sante.length > 1 ? "s" : ""} identifiée${answers.sante.length > 1 ? "s" : ""}`,
      note: answers.sante.filter((s) => s !== "Aucune sensibilité particulière").slice(0, 2).join(" · "),
    });
  } else if (answers.projets === "achat") {
    signals.push({
      icon: "🏗",
      label: "Projet immobilier",
      value: "Achat à risque climatique à anticiper",
      note: "Assurabilité, décote DPE, exposition territoriale à évaluer",
    });
  }

  if (signals.length === 0) {
    signals.push({
      icon: "📊",
      label: "Analyse territoriale",
      value: `Profil de ${ville}`,
      note: "Sélectionnez votre commune via la liste BAN au step 1 pour activer les données réelles",
    });
  }

  return signals.slice(0, 4);
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
  onRestart: () => void;
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

  const signals = computeSignals(data, answers, ville);
  const firstSignal = signals[0];
  const lockedSignals = signals.slice(1);
  const loading = Boolean(inseeCode) && loadedInsee !== inseeCode;
  const hasMultipleSignals = signals.length > 1;

  return (
    <div className="wizard-step flex flex-col gap-10 md:gap-12">

      {/* Headline */}
      <div className="max-w-[56rem]">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent mb-4">
          Aperçu personnalisé · {ville}
        </p>
        <h2
          className="font-semibold text-[clamp(2rem,4.2vw,3.8rem)] leading-[1.03] tracking-[-0.03em] text-label text-balance"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Votre profil présente{" "}
          <span className="italic text-accent">
            {hasMultipleSignals ? `${signals.length} signaux d'exposition` : "un signal d'exposition"}
          </span>{" "}
          {hasMultipleSignals ? "identifiés." : "identifié."}
        </h2>
      </div>

      {/* Signals — premier visible, reste flouté */}
      {loading ? (
        <SignalSkeleton />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Signal 1 — toujours visible */}
          {firstSignal && <Signal icon={firstSignal.icon} label={firstSignal.label} value={firstSignal.value} note={firstSignal.note} />}

          {/* Signaux suivants — floutés avec verrou */}
          {lockedSignals.length > 0 && (
            <div className="relative mt-1 rounded-2xl overflow-hidden">
              <div
                className="flex flex-col gap-3 select-none pointer-events-none"
                style={{ filter: "blur(5px)", opacity: 0.7 }}
                aria-hidden
              >
                {lockedSignals.map((s, i) => (
                  <Signal key={i} icon={s.icon} label={s.label} value={s.value} note={s.note} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6,8,18,0.45)" }}>
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted border border-white/[0.12] rounded-full px-4 py-2 bg-canvas/80 backdrop-blur-sm">
                  {lockedSignals.length} signa{lockedSignals.length > 1 ? "ux" : "l"} verrouillé{lockedSignals.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paywall */}
      <div
        className="wizard-panel-lg rounded-3xl border border-accent/[0.16] relative overflow-hidden"
        style={{ background: "rgba(251,146,60,0.03)" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/[0.07] blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-7 md:gap-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
              Rapport complet
            </p>
            <p
              className="max-w-[20ch] text-[clamp(1.85rem,3.4vw,2.45rem)] font-normal text-label leading-[1.08] tracking-[-0.025em] text-balance"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Accédez à votre analyse complète, vos 6 modules et votre guide d&apos;action personnalisé.
            </p>
            <p className="max-w-[42rem] text-[15px] text-muted leading-7">
              Sourcé sur les données publiques françaises. Personnalisé sur votre profil. Sans publicité.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
            <div className="flex items-end gap-1.5">
              <span
                className="text-[56px] text-label leading-none tracking-[-0.03em]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                14
              </span>
              <span className="mb-2 text-[24px] text-ghost">€</span>
            </div>
            <div className="flex flex-col gap-1 pb-1">
              <p className="font-mono text-[11px] text-ghost tracking-[0.04em] leading-relaxed">paiement unique</p>
              <p className="font-mono text-[11px] text-ghost tracking-[0.04em] leading-relaxed">ou 9 €/mois en Suivi</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/paiement"
              className="wizard-cta flex w-full gap-2 rounded-xl bg-accent text-canvas text-[15px] no-underline transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              Débloquer mon rapport complet — 14€
            </Link>
            <p className="text-center font-mono text-[11px] text-ghost tracking-[0.04em] leading-relaxed">
              Les 14 € sont déductibles si vous passez en Suivi mensuel
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="text-center font-mono text-[11px] tracking-[0.08em] uppercase text-ghost hover:text-muted transition-colors duration-200 py-2"
      >
        Recommencer depuis le début
      </button>

    </div>
  );
}
