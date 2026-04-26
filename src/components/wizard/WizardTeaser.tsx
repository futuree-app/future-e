"use client";

import Link from "next/link";
import type { WizardAnswers } from "./types";

const CONTEXT_RISK_LABELS: Record<string, string> = {
  logement: "Exposition du logement",
  metier: "Vulnérabilité professionnelle",
  sante: "Sensibilité santé-environnement",
  mobilite: "Dépendance à la voiture",
  projets: "Cohérence des projets de vie",
  quartier: "Tension climatique territoriale",
};

function computeRisks(answers: WizardAnswers, context: string | null): string[] {
  const risks: string[] = [];

  if (answers.logement && answers.logement.year < 1980)
    risks.push("Exposition du logement (DPE, rénovation obligatoire)");
  if (
    answers.sante.length > 0 &&
    !answers.sante.includes("Aucune sensibilité particulière")
  )
    risks.push("Sensibilité santé-environnement (pollens, chaleur, air)");
  if (answers.mobilite === "voiture")
    risks.push("Dépendance à la voiture (coût carburant, mobilité future)");
  if (context && CONTEXT_RISK_LABELS[context]) {
    const contextRisk = CONTEXT_RISK_LABELS[context];
    if (!risks.some((r) => r.startsWith(contextRisk.split(" ")[0])))
      risks.unshift(contextRisk);
  }
  if (risks.length === 0) risks.push("Tension climatique territoriale");
  return risks.slice(0, 3);
}

export function WizardTeaser({
  answers,
  context,
  onRestart,
}: {
  answers: WizardAnswers;
  context: string | null;
  onRestart: () => void;
}) {
  const ville = answers.quartier || "votre commune";
  const risks = computeRisks(answers, context);

  return (
    <div className="wizard-step flex flex-col gap-8">

      {/* Headline */}
      <div>
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
          Aperçu personnalisé · {ville}
        </p>
        <h2
          className="font-semibold text-[clamp(22px,2.6vw,30px)] leading-[1.18] tracking-[-0.5px] text-label"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Votre profil présente{" "}
          <span className="italic text-accent">
            {risks.length > 1 ? `${risks.length} expositions` : "une exposition"}
          </span>{" "}
          identifiées.
        </h2>
      </div>

      {/* Risk cards */}
      <div className="flex flex-col gap-3">
        {risks.map((risk) => (
          <div
            key={risk}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
          >
            <span className="w-2 h-2 rounded-full bg-accent shrink-0 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
            <div>
              <p className="text-[14px] font-medium text-label leading-snug">{risk}</p>
              <p className="font-mono text-[10px] text-ghost tracking-[0.04em] mt-0.5">
                Analyse complète dans le rapport
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Aperçu flou verrouillé */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="px-6 py-5 bg-white/[0.02] border border-white/[0.06] select-none"
          style={{ filter: "blur(3px)" }}
          aria-hidden
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ghost mb-2">
            Analyse complète
          </p>
          <p className="text-[13px] text-muted leading-relaxed">
            Votre logement présente un DPE estimé F–G. Le coût de rénovation obligatoire d&apos;ici 2034 est compris entre 18 000 et 35 000 €. La valeur de revente est exposée à une décote progressive…
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-sm">
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted border border-white/[0.12] rounded-full px-4 py-2 bg-canvas/80">
            Contenu verrouillé
          </span>
        </div>
      </div>

      {/* Paywall */}
      <div
        className="rounded-3xl border border-accent/[0.16] p-8 relative overflow-hidden"
        style={{ background: "rgba(251,146,60,0.03)" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/[0.07] blur-3xl pointer-events-none" />
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-4">
          Rapport complet
        </p>
        <p
          className="text-[20px] font-normal text-label mb-2 leading-snug"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Accédez à votre analyse complète, vos 6 modules et votre guide d&apos;action personnalisé.
        </p>
        <p className="text-[14px] text-muted mb-7 leading-relaxed">
          Sourcé sur les données publiques françaises. Personnalisé sur votre profil. Sans publicité.
        </p>
        <div className="flex items-end gap-5 mb-7">
          <div>
            <span
              className="text-[48px] text-label leading-none tracking-[-2px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              14
            </span>
            <span className="text-[20px] text-ghost ml-1">€</span>
          </div>
          <div className="pb-2">
            <p className="font-mono text-[10px] text-ghost tracking-[0.04em] leading-relaxed">paiement unique</p>
            <p className="font-mono text-[10px] text-ghost tracking-[0.04em] leading-relaxed">ou 9 €/mois en Suivi</p>
          </div>
        </div>
        <Link
          href="/paiement"
          className="flex w-full items-center justify-center gap-2 px-7 py-4 rounded-xl bg-accent text-canvas font-semibold text-[15px] no-underline transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Débloquer mon rapport complet — 14€
        </Link>
        <p className="mt-4 text-center font-mono text-[10px] text-ghost tracking-[0.04em]">
          Les 14 € sont déductibles si vous passez en Suivi mensuel
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="text-center font-mono text-[10px] tracking-[0.08em] uppercase text-ghost hover:text-muted transition-colors duration-200 py-1"
      >
        Recommencer depuis le début
      </button>

    </div>
  );
}
