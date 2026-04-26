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
    <div className="wizard-step">
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1">
        Module {config.step} · {config.module}
      </p>
      <h2
        className="font-normal text-[clamp(22px,2.8vw,32px)] leading-[1.2] tracking-[-0.4px] text-label mb-8"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {config.question}
      </h2>

      {/* Text input (Quartier) */}
      {config.type === "text" && (
        <input
          type="text"
          placeholder={config.placeholder}
          value={(current as string) ?? ""}
          onChange={(e) => onAnswer(config.key, e.target.value || null)}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-accent/50 transition-colors"
          autoFocus
        />
      )}

      {/* Logement (type + année) */}
      {config.type === "logement" && (
        <div className="flex flex-col gap-4">
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
                  className={`px-4 py-3 rounded-xl border text-[14px] font-medium transition-colors capitalize ${
                    selected
                      ? "bg-accent/[0.08] border-accent/40 text-accent"
                      : "bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/[0.2]"
                  }`}
                >
                  {t === "maison" ? "Maison" : "Appartement"}
                </button>
              );
            })}
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2">
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
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Select (Métier, Mobilité, Projets) */}
      {config.type === "select" && (
        <div className="flex flex-col gap-2">
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
                className={`w-full text-left px-4 py-3 rounded-xl border text-[14px] transition-colors ${
                  selected
                    ? "bg-accent/[0.08] border-accent/40 text-accent"
                    : "bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/[0.2]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Multi-select (Santé) */}
      {config.type === "multi" && (
        <div className="flex flex-col gap-2">
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
                className={`w-full text-left px-4 py-3 rounded-xl border text-[14px] transition-colors ${
                  selected
                    ? "bg-accent/[0.08] border-accent/40 text-accent"
                    : "bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/[0.2]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
        {step > 0 ? (
          <button
            type="button"
            onClick={onPrev}
            className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost hover:text-muted transition-colors"
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
          className="px-6 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          {step < 5 ? "Continuer →" : "Voir mon aperçu →"}
        </button>
      </div>
    </div>
  );
}
