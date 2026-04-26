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
    <div className="wizard-step">
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2">
        Aperçu personnalisé · {ville}
      </p>

      <h2
        className="font-normal text-[clamp(24px,3vw,36px)] leading-[1.1] tracking-[-0.5px] text-label mb-6"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Votre profil présente{" "}
        <span className="italic text-accent">
          {risks.length > 1 ? `${risks.length} expositions` : "une exposition"}
        </span>{" "}
        identifiées.
      </h2>

      {/* Risk cards */}
      <div className="flex flex-col gap-3 mb-8">
        {risks.map((risk) => (
          <div
            key={risk}
            className="flex items-start gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08]"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-label mb-0.5 leading-snug">{risk}</p>
              <p className="font-mono text-[10px] text-ghost tracking-[0.04em]">
                Analyse complète dans le rapport
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Aperçu flou verrouillé */}
      <div className="relative rounded-xl overflow-hidden mb-8">
        <div
          className="px-5 py-4 bg-white/[0.02] border border-white/[0.08] select-none"
          style={{ filter: "blur(3px)" }}
          aria-hidden
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ghost mb-1">
            Analyse complète
          </p>
          <p className="text-[13px] text-muted leading-relaxed">
            Votre logement présente un DPE estimé F–G. Le coût de rénovation obligatoire d&apos;ici 2034 est compris entre 18 000 et 35 000 €. La valeur de revente est exposée à une décote progressive…
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-[1px]">
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted border border-white/[0.1] rounded-full px-3 py-1.5 bg-canvas/80">
            Contenu verrouillé
          </span>
        </div>
      </div>

      {/* Paywall */}
      <div className="rounded-2xl border border-accent/[0.18] p-6 relative overflow-hidden" style={{ background: "rgba(251,146,60,0.04)" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/[0.08] blur-3xl pointer-events-none" />
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-3">
          Rapport complet
        </p>
        <p
          className="text-[18px] font-normal text-label mb-2 leading-snug"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Accédez à votre analyse complète, vos 6 modules de suivi et votre guide d&apos;action personnalisé.
        </p>
        <p className="text-[13px] text-muted mb-5 leading-relaxed">
          Sourcé sur les données publiques françaises. Personnalisé sur votre profil. Sans publicité.
        </p>
        <div className="flex items-end gap-4 mb-5">
          <div>
            <span
              className="text-[44px] text-label leading-none tracking-[-1.5px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              14
            </span>
            <span className="text-[18px] text-ghost ml-0.5">€</span>
          </div>
          <div className="pb-1.5">
            <p className="font-mono text-[10px] text-ghost tracking-[0.04em]">paiement unique</p>
            <p className="font-mono text-[10px] text-ghost tracking-[0.04em]">ou 9 €/mois en Suivi</p>
          </div>
        </div>
        <Link
          href="/paiement"
          className="flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-canvas font-semibold text-[14px] no-underline"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Débloquer mon rapport complet — 14€
        </Link>
        <p className="mt-3 text-center font-mono text-[10px] text-ghost tracking-[0.04em]">
          Les 14 € sont déductibles si vous passez en Suivi mensuel
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-4 w-full text-center font-mono text-[10px] tracking-[0.06em] uppercase text-ghost hover:text-muted transition-colors py-2"
      >
        Recommencer
      </button>
    </div>
  );
}
