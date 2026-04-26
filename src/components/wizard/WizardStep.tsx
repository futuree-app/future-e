"use client";

import type { WizardAnswers } from "./types";

type StepConfig =
  | { key: "quartier"; module: string; step: string; question: string; type: "text"; placeholder: string }
  | { key: "logement"; module: string; step: string; question: string; type: "logement" }
  | { key: "metier" | "mobilite" | "projets"; module: string; step: string; question: string; type: "select"; options: string[] }
  | { key: "sante"; module: string; step: string; question: string; type: "multi"; options: string[] };

const STEPS: StepConfig[] = [
  {
    key: "quartier",
    module: "Quartier",
    step: "01",
    question: "Quelle est votre ville ou votre code postal ?",
    type: "text",
    placeholder: "Ex : La Rochelle, 17000…",
  },
  {
    key: "logement",
    module: "Logement",
    step: "02",
    question: "Quel est votre type de logement et son année de construction ?",
    type: "logement",
  },
  {
    key: "metier",
    module: "Métier",
    step: "03",
    question: "Quel est votre secteur d'activité principal ?",
    type: "select",
    options: [
      "Agriculture / Alimentaire",
      "Santé / Social",
      "BTP / Immobilier",
      "Transport / Logistique",
      "Tourisme / Hôtellerie",
      "Enseignement / Recherche",
      "Finance / Assurance",
      "Industrie / Énergie",
      "Services / Numérique",
      "Autre",
    ],
  },
  {
    key: "sante",
    module: "Santé",
    step: "04",
    question: "Avez-vous des sensibilités environnementales ?",
    type: "multi",
    options: [
      "Allergies polliniques",
      "Asthme / Troubles respiratoires",
      "Sensibilité à la chaleur",
      "Pathologie chronique",
      "Aucune sensibilité particulière",
    ],
  },
  {
    key: "mobilite",
    module: "Mobilité",
    step: "05",
    question: "Quel est votre mode de transport quotidien prédominant ?",
    type: "select",
    options: ["voiture", "transport", "velo", "mixte"],
  },
  {
    key: "projets",
    module: "Projets",
    step: "06",
    question: "Quel est votre projet de vie majeur à 5 ans ?",
    type: "select",
    options: ["achat", "retraite", "demenagement", "autre"],
  },
];

const MOBILITE_LABELS: Record<string, string> = {
  voiture: "Voiture (seul)",
  transport: "Covoiturage / Transports en commun",
  velo: "Vélo / Marche",
  mixte: "Mixte",
};

const PROJETS_LABELS: Record<string, string> = {
  achat: "Achat immobilier",
  retraite: "Retraite / Semi-retraite",
  demenagement: "Déménagement",
  autre: "Aucun projet majeur",
};

/* Shared class for option buttons */
const optionBase =
  "w-full text-left px-5 py-4 rounded-2xl border text-[14px] transition-all duration-200";
const optionSelected =
  "bg-accent/[0.08] border-accent/50 text-accent shadow-[0_0_0_1px_rgba(251,146,60,0.15)]";
const optionIdle =
  "bg-white/[0.02] border-white/[0.08] text-muted hover:border-white/[0.20] hover:bg-white/[0.04] hover:text-label";

export function WizardStep({
  step,
  answers,
  onAnswer,
  onNext,
  onPrev,
}: {
  step: number;
  answers: WizardAnswers;
  onAnswer: (key: keyof WizardAnswers, value: WizardAnswers[keyof WizardAnswers]) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const config = STEPS[step];
  const current = answers[config.key];

  const canNext =
    config.type === "multi"
      ? (current as string[]).length > 0
      : current !== null && current !== "";

  return (
    <div className="wizard-step flex flex-col gap-8">

      {/* Module label + Question */}
      <div>
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
          Module {config.step} · {config.module}
        </p>
        <h2
          className="font-semibold text-[clamp(22px,2.6vw,30px)] leading-[1.18] tracking-[-0.5px] text-label"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {config.question}
        </h2>
      </div>

      {/* ── Text input (Quartier) ── */}
      {config.type === "text" && (
        <input
          type="text"
          placeholder={config.placeholder}
          value={(current as string) ?? ""}
          onChange={(e) => onAnswer(config.key, e.target.value || null)}
          className="w-full px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all duration-200"
          autoFocus
        />
      )}

      {/* ── Logement (type + année) ── */}
      {config.type === "logement" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            {(["maison", "appartement"] as const).map((t) => {
              const selected = (current as WizardAnswers["logement"])?.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    onAnswer(config.key, {
                      type: t,
                      year: (current as WizardAnswers["logement"])?.year ?? 2000,
                    })
                  }
                  className={`${optionBase} text-center font-medium ${selected ? optionSelected : optionIdle}`}
                >
                  {t === "maison" ? "Maison" : "Appartement"}
                </button>
              );
            })}
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-2.5">
              Année de construction
            </label>
            <input
              type="number"
              min={1800}
              max={2024}
              placeholder="Ex : 1978"
              value={(current as WizardAnswers["logement"])?.year ?? ""}
              onChange={(e) =>
                onAnswer(config.key, {
                  type: (current as WizardAnswers["logement"])?.type ?? "appartement",
                  year: parseInt(e.target.value) || 2000,
                })
              }
              className="w-full px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* ── Select (Métier, Mobilité, Projets) ── */}
      {config.type === "select" && (
        <div className="flex flex-col gap-3">
          {config.options.map((opt) => {
            const label =
              config.key === "mobilite"
                ? MOBILITE_LABELS[opt]
                : config.key === "projets"
                  ? PROJETS_LABELS[opt]
                  : opt;
            const selected = current === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onAnswer(config.key, opt as WizardAnswers[typeof config.key])}
                className={`${optionBase} ${selected ? optionSelected : optionIdle}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Multi-select (Santé) ── */}
      {config.type === "multi" && (
        <div className="flex flex-col gap-3">
          {config.options.map((opt) => {
            const selected = ((current as string[]) ?? []).includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const prev = (current as string[]) ?? [];
                  onAnswer(
                    config.key,
                    selected ? prev.filter((x) => x !== opt) : [...prev, opt],
                  );
                }}
                className={`${optionBase} ${selected ? optionSelected : optionIdle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
        {step > 0 ? (
          <button
            type="button"
            onClick={onPrev}
            className="font-mono text-[11px] tracking-[0.08em] uppercase text-ghost hover:text-label transition-colors duration-200"
          >
            ← Retour
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="px-8 py-3.5 rounded-xl bg-accent text-canvas font-semibold text-[14px] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          {step < 5 ? "Continuer →" : "Voir mon aperçu →"}
        </button>
      </div>

    </div>
  );
}
