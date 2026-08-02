"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WizardTeaser } from "./WizardTeaser";
import { hasWizardContent, readWizardAnswersFromStorage, type WizardAnswers } from "./types";

// Vue gratuite de /rapport : la « première lecture » post-wizard.
// Source des réponses, par ordre de priorité :
//   1. serverAnswers (persistées en base, retrouvables cross-session)
//   2. sessionStorage (immédiat, même session, avant que le sync ait écrit)
// Si rien : invite à faire le questionnaire.
export function RapportPremiereLecture({
  serverAnswers,
  inseeCode,
}: {
  serverAnswers: WizardAnswers | null;
  inseeCode: string | null;
}) {
  const [answers, setAnswers] = useState<WizardAnswers | null>(serverAnswers);

  // Hydratation depuis le sessionStorage (système externe, client uniquement) :
  // couvre le cas « wizard tout juste terminé, pas encore écrit en base ». SSR et
  // 1er rendu client partent de serverAnswers (pas de mismatch), le fallback ne
  // s'applique qu'après hydratation.
  useEffect(() => {
    if (hasWizardContent(answers)) return;
    const stored = readWizardAnswersFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture ponctuelle d'un store externe au montage
    if (stored) setAnswers(stored);
  }, [answers]);

  if (!hasWizardContent(answers)) {
    return (
      <div className="glass rounded-2xl p-11 relative overflow-hidden" style={{ borderColor: "var(--orange-tint)" }}>
        <div
          className="absolute top-[-80px] right-[-80px] w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--orange-tint) 0%, transparent 70%)" }}
        />
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">Votre première lecture</p>
        <h2
          className="font-[var(--weight-section)] text-[length:var(--text-section)] leading-[1.2] tracking-[-0.5px] text-label mb-3.5"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Quelques questions, et votre lecture personnalisée apparaît.
        </h2>
        <p className="text-[15px] text-muted leading-[1.7] mb-7 max-w-[560px]">
          Le questionnaire croise votre situation avec les données publiques de votre commune pour faire ressortir vos premiers points d&apos;attention. Rien à installer, deux minutes.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Faire le questionnaire
        </Link>
      </div>
    );
  }

  return <WizardTeaser answers={answers!} context={null} inseeCode={inseeCode} />;
}
