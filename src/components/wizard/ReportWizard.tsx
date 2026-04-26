"use client";

import { forwardRef, useCallback, useEffect, useReducer, useState } from "react";
import {
  type WizardAnswers,
  type WizardState,
  WIZARD_INITIAL_ANSWERS,
  WIZARD_STORAGE_KEY,
} from "./types";
import { WizardStepper } from "./WizardStepper";
import { WizardStep } from "./WizardStep";
import { WizardTeaser } from "./WizardTeaser";

function loadFromStorage(): Partial<WizardState> {
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<WizardState>) : {};
  } catch {
    return {};
  }
}

function saveToStorage(state: WizardState): void {
  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage indisponible (mode privé, quota dépassé)
  }
}

type Action =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_ANSWER"; key: keyof WizardAnswers; value: WizardAnswers[keyof WizardAnswers] }
  | { type: "RESET" }
  | { type: "RESTORE"; payload: Partial<WizardState> };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, 6) };
    case "PREV":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value },
      };
    case "RESET":
      return { step: 0, context: state.context, answers: { ...WIZARD_INITIAL_ANSWERS } };
    case "RESTORE":
      return {
        ...state,
        step: action.payload.step ?? state.step,
        answers: action.payload.answers
          ? { ...WIZARD_INITIAL_ANSWERS, ...action.payload.answers }
          : state.answers,
      };
    default:
      return state;
  }
}

export const ReportWizard = forwardRef<HTMLDialogElement, { initialContext?: string | null }>(
  function ReportWizard({ initialContext = null }, ref) {
    // Initialize with defaults — never read sessionStorage at render (SSR safety)
    const [state, dispatch] = useReducer(reducer, {
      step: 0,
      context: initialContext ?? null,
      answers: { ...WIZARD_INITIAL_ANSWERS },
    });

    // Restore from sessionStorage after mount (client-only)
    const [restored, setRestored] = useState(false);
    useEffect(() => {
      if (restored) return;
      const stored = loadFromStorage();
      if (stored.step !== undefined || stored.answers !== undefined) {
        dispatch({ type: "RESTORE", payload: stored });
      }
      setRestored(true);
    }, [restored]);

    // Persist to sessionStorage on every state change (client-only)
    useEffect(() => {
      if (!restored) return;
      saveToStorage(state);
    }, [state, restored]);

    const handleClose = useCallback(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.close();
      }
    }, [ref]);

    // dialog is display:flex flex-direction:column via .wizard-dialog in globals.css
    return (
      <dialog
        ref={ref}
        className="wizard-dialog"
        onClose={() => dispatch({ type: "RESET" })}
      >
        {/* Header — shrinks to content */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-white/[0.08] shrink-0">
          <WizardStepper currentStep={state.step} totalSteps={6} />
          <button
            type="button"
            onClick={handleClose}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost hover:text-muted transition-colors"
          >
            Fermer ×
          </button>
        </div>

        {/* Content — fills remaining height, scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-8 py-7">
          {state.step < 6 ? (
            <WizardStep
              key={state.step}
              step={state.step}
              answers={state.answers}
              onAnswer={(key, value) => dispatch({ type: "SET_ANSWER", key, value })}
              onNext={() => dispatch({ type: "NEXT" })}
              onPrev={() => dispatch({ type: "PREV" })}
            />
          ) : (
            <WizardTeaser
              answers={state.answers}
              context={state.context}
              onRestart={() => dispatch({ type: "RESET" })}
            />
          )}
        </div>
      </dialog>
    );
  },
);
