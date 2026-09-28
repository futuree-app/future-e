// ════════════════════════════════════════════════════════════════════════════════════════════
// LA CHAÎNE DE PRODUCTION D'UNE SYNTHÈSE TERRITOIRE (FUT-6, D8 et D9).
//
//   génération → contrôles → si refus : UNE régénération, avec les erreurs → contrôles
//   → si nouveau refus : synthèse déterministe.
//
// Au plus DEUX appels au modèle par clé. Pure : le générateur est injecté, ce qui rend la chaîne
// testable sans réseau (un générateur simulé suffit).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { checkSynthesis, describeViolations, type Violation } from "./synthesis-checks.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { synthesisUserMessage, type HorizonKey } from "./synthesis-contract.ts";

export type SynthesisOrigin = "model" | "model_retry" | "deterministic";

export type SynthesisResult = {
  text: string;
  origin: SynthesisOrigin;
  /** Les motifs de refus, par tentative : le journal demandé par D8, pour améliorer les conventions. */
  rejections: { attempt: number; violations: Violation[] }[];
  modelCalls: number;
  /**
   * Faux quand le MODÈLE était indisponible : on sert la synthèse déterministe, mais on ne la fige pas
   * sous la clé, sinon une panne passagère priverait durablement la commune de sa lecture enrichie.
   * Vrai après deux refus : la même entrée reproduirait les mêmes refus, inutile de repayer.
   */
  cacheable: boolean;
  modelError?: string;
  /** Le budget du jour a refusé une génération : un état passager, jamais figé en cache. */
  budgetRefused?: boolean;
};

export const MAX_MODEL_CALLS = 2;

export async function produceSynthesis(opts: {
  projection: Record<string, unknown>;
  horizon: HorizonKey;
  generate: (userMessage: string) => Promise<string>;
  /**
   * LE BUDGET SE RÉSERVE AVANT CHAQUE APPEL PAYANT, et jamais par avance (correction du 28/09). Une
   * réservation unique pour deux appels sous-comptait les régénérations.
   */
  reserveBudget: () => Promise<boolean>;
}): Promise<SynthesisResult> {
  const { projection, horizon, generate, reserveBudget } = opts;
  const rejections: SynthesisResult["rejections"] = [];
  let calls = 0;
  let previous: Violation[] | null = null;

  for (let attempt = 1; attempt <= MAX_MODEL_CALLS; attempt++) {
    if (!(await reserveBudget())) {
      return {
        text: deterministicSynthesis(projection, horizon),
        origin: "deterministic",
        rejections,
        modelCalls: calls,
        cacheable: false,
        budgetRefused: true,
      };
    }
    let text: string;
    try {
      calls++;
      text = (await generate(synthesisUserMessage(projection, horizon, previous ? describeViolations(previous) : undefined))).trim();
    } catch (err) {
      return {
        text: deterministicSynthesis(projection, horizon),
        origin: "deterministic",
        rejections,
        modelCalls: calls,
        cacheable: false,
        modelError: err instanceof Error ? err.message : String(err),
      };
    }
    const violations = checkSynthesis(text, projection);
    if (violations.length === 0) {
      return { text, origin: attempt === 1 ? "model" : "model_retry", rejections, modelCalls: calls, cacheable: true };
    }
    rejections.push({ attempt, violations });
    previous = violations;
  }

  return {
    text: deterministicSynthesis(projection, horizon),
    origin: "deterministic",
    rejections,
    modelCalls: calls,
    cacheable: true,
  };
}
