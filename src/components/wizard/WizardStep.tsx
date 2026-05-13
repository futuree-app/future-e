"use client";

import { useEffect, useRef, useState } from "react";
import type { LogementAge, WizardAnswers } from "./types";

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
      "Retraité",
      "Sans emploi",
      "Autre",
    ],
  },
  {
    key: "sante",
    module: "Santé",
    step: "04",
    question: "Avez-vous des sensibilités particulières ?",
    type: "multi",
    options: [
      "Allergies au pollen",
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
    question: "Avez-vous un projet de vie majeur dans les prochaines années ?",
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

const LOGEMENT_TYPE_LABELS: Record<string, string> = {
  maison: "Maison",
  appartement: "Appartement",
  autre: "Autre (camping-car, tiny house, van…)",
};

const LOGEMENT_AGE_OPTIONS: { value: LogementAge; label: string }[] = [
  { value: "recent", label: "Moins de 10 ans (après 2016)" },
  { value: "middle", label: "Entre 10 et 50 ans" },
  { value: "old", label: "Plus de 50 ans (avant 1976)" },
];

type BanSuggestion = {
  id: string;
  name: string;
  postcode: string | null;
  context: string;
};

function mapBanFeature(f: { properties: Record<string, string> }): BanSuggestion {
  const p = f.properties || {};
  return {
    id: p.citycode || p.id || p.label,
    name: p.city || p.name,
    postcode: p.postcode || null,
    context: p.context || "",
  };
}

/* Shared classes for option buttons */
const optionBase =
  "wizard-option w-full rounded-2xl border text-[15px] transition-all duration-200";
const optionSelected =
  "bg-accent/[0.08] border-accent/50 text-accent shadow-[0_0_0_1px_rgba(251,146,60,0.15)]";
const optionIdle =
  "bg-white/[0.02] border-white/[0.08] text-muted hover:border-white/[0.20] hover:bg-white/[0.04] hover:text-label";

export function WizardStep({
  step,
  answers,
  onAnswer,
  onSetInsee,
  onNext,
  onPrev,
  onSkip,
}: {
  step: number;
  answers: WizardAnswers;
  onAnswer: (key: keyof WizardAnswers, value: WizardAnswers[keyof WizardAnswers]) => void;
  onSetInsee: (insee: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: (key: keyof WizardAnswers) => void;
}) {
  const config = STEPS[step];
  const current = answers[config.key];

  /* ── BAN autocomplete state (used only for quartier step) ── */
  const [banSuggestions, setBanSuggestions] = useState<BanSuggestion[]>([]);
  const [banOpen, setBanOpen] = useState(false);
  const banWrapRef = useRef<HTMLDivElement>(null);

  /* Fetch BAN suggestions with 250ms debounce */
  useEffect(() => {
    if (config.type !== "text") return;
    const query = (current as string) ?? "";
    if (query.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=6`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const json = await res.json() as { features: { properties: Record<string, string> }[] };
        const items = (json.features || []).map(mapBanFeature);
        setBanSuggestions(items);
        setBanOpen(items.length > 0);
      } catch {
        // AbortError ou erreur réseau — silencieux
      }
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [current, config.type]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (banWrapRef.current && !banWrapRef.current.contains(e.target as Node)) {
        setBanOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logement = current as WizardAnswers["logement"];
  const canNext =
    config.type === "logement"
      ? logement?.type != null && logement?.age != null
      : config.type === "multi"
        ? (current as string[]).length > 0
        : current !== null && current !== "";

  return (
    <div className="wizard-step flex flex-col gap-10 md:gap-12">

      {/* Module label + Question */}
      <div className="max-w-[44rem] flex flex-col gap-6">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent/90">
          Module {config.step} · {config.module}
        </p>
        <h2
          className="font-semibold text-[clamp(1.55rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.025em] text-label text-balance"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {config.question}
        </h2>
        {config.type === "text" && (
          <p className="max-w-[36rem] text-[15px] leading-[1.7] text-muted">
            Commencez par votre commune. Le rapport s&apos;adaptera ensuite à votre territoire et à vos priorités.
          </p>
        )}
      </div>

      {/* ── BAN autocomplete (Quartier) ── */}
      {config.type === "text" && (
        <div ref={banWrapRef} className="relative max-w-[52rem]">
          <input
            type="text"
            placeholder={config.placeholder}
            value={(current as string) ?? ""}
            onChange={(e) => {
              onAnswer(config.key, e.target.value || null);
              if (e.target.value.length < 2) {
                setBanSuggestions([]);
              }
              setBanOpen(false);
            }}
            className="wizard-input w-full rounded-[1.65rem] bg-white/[0.04] border border-white/[0.08] text-label text-[18px] placeholder:text-ghost focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all duration-200"
            autoFocus
            autoComplete="off"
          />

          {banOpen && banSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 rounded-[1.65rem] overflow-hidden border border-white/[0.08] z-10 shadow-2xl" style={{ background: "#0d1120" }}>
              {banSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onAnswer(config.key, s.name);
                    // s.id = citycode (code INSEE) depuis l'API BAN
                    if (s.id && /^\d{5}$/.test(s.id)) onSetInsee(s.id);
                    setBanOpen(false);
                    setBanSuggestions([]);
                  }}
                  className="wizard-suggestion w-full text-left hover:bg-white/[0.06] transition-colors duration-150 border-b border-white/[0.05] last:border-0"
                >
                  <span className="block text-[18px] leading-tight text-label">{s.name}</span>
                  <span className="block font-mono text-[12px] tracking-[0.06em] text-ghost mt-2">
                    {s.postcode ? `${s.postcode} · ` : ""}{s.context}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Logement (type + âge) ── */}
      {config.type === "logement" && (
        <div className="flex flex-col gap-10 max-w-[52rem]">
          {/* Type de logement */}
          <div className="flex flex-col gap-3">
            {(["maison", "appartement", "autre"] as const).map((t) => {
              const selected = logement?.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    onAnswer(config.key, {
                      type: t,
                      age: logement?.age ?? null,
                    })
                  }
                  className={`${optionBase} ${selected ? optionSelected : optionIdle}`}
                >
                  {LOGEMENT_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>

          {/* Âge du logement */}
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <h3
                className="font-semibold text-[clamp(1.55rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.025em] text-label"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Quel est l&apos;âge de votre logement ?
              </h3>
              <p className="text-[15px] text-muted/75 leading-[1.7] max-w-[42rem]">
                Un petit doute ? La date de construction de votre logement apparaît sans doute sur votre contrat d&apos;assurance.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {LOGEMENT_AGE_OPTIONS.map(({ value, label }) => {
                const selected = logement?.age === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onAnswer(config.key, {
                        type: logement?.type ?? "appartement",
                        age: value,
                      })
                    }
                    className={`${optionBase} ${selected ? optionSelected : optionIdle}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Select (Métier, Mobilité, Projets) ── */}
      {config.type === "select" && (
        <div className="flex flex-col gap-3 max-w-[52rem]">
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
        <div className="flex flex-col gap-3 max-w-[52rem]">
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

      {/* ── Je ne sais pas (toutes étapes sauf quartier) ── */}
      {step > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 max-w-[52rem]">
          <button
            type="button"
            onClick={() => onSkip(config.key)}
            className="inline-flex items-center justify-center shrink-0 min-h-[3.75rem] rounded-full border border-white/[0.12] bg-white/[0.04] text-[15px] font-medium text-muted hover:bg-white/[0.07] hover:text-label transition-all duration-200 whitespace-nowrap"
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          >
            Je ne sais pas répondre
          </button>
          <p className="text-[13px] text-muted/60 leading-snug">
            Votre profil sera estimé à partir de données nationales représentatives.
          </p>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-8 border-t border-white/[0.06]">
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
          className="wizard-cta rounded-xl bg-accent text-canvas text-[14px] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
        >
          {step < 5 ? "Continuer →" : "Voir mon aperçu →"}
        </button>
      </div>

    </div>
  );
}
