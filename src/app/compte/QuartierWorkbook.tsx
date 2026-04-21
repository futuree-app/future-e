"use client";

import { useEffect, useMemo, useState } from "react";

type QuartierWorkbookProps = {
  userKey: string;
};

type QuartierAnswers = {
  heat: string;
  water: string;
  shelter: string;
  note: string;
};

const STORAGE_PREFIX = "futuree:quartier-workbook:";

const HEAT_OPTIONS = [
  {
    value: "supportable",
    label: "L'ete reste supportable",
  },
  {
    value: "fragile",
    label: "L'ete commence a peser",
  },
  {
    value: "difficile",
    label: "L'ete est deja difficile",
  },
];

const WATER_OPTIONS = [
  {
    value: "loin",
    label: "Je ne me sens pas expose a l'eau",
  },
  {
    value: "ponctuel",
    label: "J'ai deja vu des tensions ponctuelles",
  },
  {
    value: "present",
    label: "L'eau est deja un sujet concret ici",
  },
];

const SHELTER_OPTIONS = [
  {
    value: "resilient",
    label: "Le quartier absorbe encore bien",
  },
  {
    value: "tendu",
    label: "Le cadre de vie se tend l'ete",
  },
  {
    value: "fragilise",
    label: "Le quartier montre deja ses limites",
  },
];

const EMPTY_ANSWERS: QuartierAnswers = {
  heat: "",
  water: "",
  shelter: "",
  note: "",
};

export function QuartierWorkbook({ userKey }: QuartierWorkbookProps) {
  const storageKey = `${STORAGE_PREFIX}${userKey}`;
  const [answers, setAnswers] = useState<QuartierAnswers>(EMPTY_ANSWERS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      try {
        const stored = window.localStorage.getItem(storageKey);

        if (stored) {
          const parsed = JSON.parse(stored) as Partial<QuartierAnswers>;

          setAnswers({
            heat: parsed.heat || "",
            water: parsed.water || "",
            shelter: parsed.shelter || "",
            note: parsed.note || "",
          });
        }
      } catch {
        setAnswers(EMPTY_ANSWERS);
      } finally {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, ready, storageKey]);

  const completion = useMemo(() => {
    const values = [
      answers.heat,
      answers.water,
      answers.shelter,
      answers.note.trim(),
    ];

    return values.filter(Boolean).length;
  }, [answers]);

  function setChoice(field: "heat" | "water" | "shelter", value: string) {
    setAnswers((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="quartier-workbook">
      <div className="quartier-workbook-head">
        <div>
          <p className="gating-label">Quartier a completer</p>
          <h3 className="quartier-workbook-title">
            Ajoutez vos repères de terrain
          </h3>
        </div>
        <span className="quartier-progress-pill">
          {completion}/4 remplis
        </span>
      </div>

      <div className="quartier-question">
        <p className="quartier-question-title">
          L&apos;ete, comment tenez-vous deja dans votre quartier ?
        </p>
        <div className="quartier-choice-grid">
          {HEAT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`quartier-choice${answers.heat === option.value ? " is-active" : ""}`}
              type="button"
              onClick={() => setChoice("heat", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="quartier-question">
        <p className="quartier-question-title">
          Le sujet eau est-il deja visible autour de vous ?
        </p>
        <div className="quartier-choice-grid">
          {WATER_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`quartier-choice${answers.water === option.value ? " is-active" : ""}`}
              type="button"
              onClick={() => setChoice("water", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="quartier-question">
        <p className="quartier-question-title">
          Le cadre de vie absorbe-t-il encore bien les etes qui se durcissent ?
        </p>
        <div className="quartier-choice-grid">
          {SHELTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`quartier-choice${answers.shelter === option.value ? " is-active" : ""}`}
              type="button"
              onClick={() => setChoice("shelter", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="quartier-note-block" htmlFor="quartier-note">
        <span className="quartier-question-title">
          Ce que vous avez deja vu changer
        </span>
        <textarea
          id="quartier-note"
          className="quartier-note"
          name="quartier-note"
          placeholder="Ex. les nuits sont devenues plus lourdes, l'ombre manque, le jardin souffre, les rues se vident plus tot..."
          rows={5}
          value={answers.note}
          onChange={(event) =>
            setAnswers((current) => ({
              ...current,
              note: event.target.value,
            }))
          }
        />
      </label>

      <p className="quartier-helper">
        Ce module ne remplace pas la lecture du territoire. Il lui donne un
        point d&apos;accroche plus personnel avant d&apos;ouvrir la suite du rapport.
      </p>
    </div>
  );
}
