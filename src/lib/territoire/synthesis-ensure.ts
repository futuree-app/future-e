// ════════════════════════════════════════════════════════════════════════════════════════════
// « QU'UNE SYNTHÈSE ENRICHIE EXISTE POUR CE SNAPSHOT ET CET HORIZON » (FUT-6).
//
// Appelée par la route (à la demande du lecteur) et par le préchauffage (page Territoire et hub,
// dans `after()`). Toutes les dépendances sont injectées : le stockage, le budget, le modèle. La
// logique se teste donc sans base ni réseau.
//
//   lecture enrichie prête → rendue telle quelle, ZÉRO appel au modèle ;
//   génération en cours     → « pending » (un autre appel la produit : pas de double facture) ;
//   échec récent            → « unavailable », AUCUN appel avant l'heure de nouvelle tentative ;
//   clé libre ou échec dû   → on la RÉSERVE, on produit (≤ 2 appels, budget réservé avant CHACUN), on stocke.
//
// UN REPLI DÉTERMINISTE N'EST JAMAIS UNE LECTURE ENRICHIE (FUT-76). Avant, deux refus des contrôles
// produisaient le texte déterministe sous `status: "ready"`, que l'écran annonçait « Lecture enrichie »,
// et la clé restait figée sur ce repli tant que le snapshot ne changeait pas. Une panne du modèle, elle,
// libérait la clé : chaque visite relançait une génération. Les deux cas sont maintenant un ÉCHEC daté,
// retenté une fois le délai passé : jamais figé, jamais en boucle.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { HashedSnapshot } from "../facts/contract.ts";
import { synthesisCacheKey } from "./synthesis-cache.ts";
import { projectForSynthesis, SYNTHESIS_CONTRACT_VERSION, SYNTHESIS_SYSTEM, type HorizonKey } from "./synthesis-contract.ts";
import { produceSynthesis, type EnrichedOrigin } from "./synthesis-pipeline.ts";
import type { TerritoireStore } from "../server/territoire-facts-store.ts";

export type EnsureResult =
  | { status: "ready"; text: string; origin: EnrichedOrigin; cached: boolean; modelCalls: number }
  | { status: "pending" }
  /** Aucune lecture enrichie à servir. `retryAt` : l'heure à partir de laquelle une tentative est permise. */
  | { status: "unavailable"; reason: "store" | "budget" | "model" | "rejected" | "deferred"; retryAt?: Date };

/**
 * DÉLAIS AVANT UNE NOUVELLE TENTATIVE (FUT-76, validés par le porteur le 06/10/2026). Dans tous les cas,
 * au plus DEUX appels au modèle par clé et par délai, quelle que soit la fréquentation de la page.
 *   - deux refus des contrôles : la même entrée reproduirait vraisemblablement les mêmes refus → 24 h ;
 *   - modèle ou réseau en panne : passager → 1 h ;
 *   - budget refusé : rien ne change avant le RENOUVELLEMENT du budget, qui est journalier et compté
 *     par jour UTC (`garde-appels-modele.ts`, clé `toISOString().slice(0, 10)`) → minuit UTC suivant.
 *     Retenter toutes les heures ne ferait que redemander un budget qu'on sait épuisé.
 */
export const RETRY_APRES_REFUS_MS = 24 * 3600_000;
export const RETRY_APRES_PANNE_MS = 3600_000;

/** Le prochain renouvellement du budget journalier : minuit UTC suivant. */
export function prochainRenouvellementBudget(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

export type EnsureDeps = {
  store: TerritoireStore;
  /** `true` si le budget du jour autorise UN appel au modèle. Appelée avant chaque appel, jamais par avance. */
  reserveBudget: () => Promise<boolean>;
  /** Appel au modèle : (consigne système, message) → texte complet. Jamais streamé (D8). */
  generate: (system: string, user: string) => Promise<string>;
  now?: () => Date;
  clock?: () => number;
};

export async function ensureTerritoireSynthesis(
  snapshot: HashedSnapshot,
  horizon: HorizonKey,
  deps: EnsureDeps,
): Promise<EnsureResult> {
  const now = deps.now ?? (() => new Date());
  const clock = deps.clock ?? (() => Date.now());
  const key = synthesisCacheKey(snapshot.hash, horizon);

  const existing = await deps.store.readSynthesis(key, now());
  if (existing?.status === "ready") {
    return { status: "ready", text: existing.text, origin: existing.origin, cached: true, modelCalls: 0 };
  }
  if (existing?.status === "pending") return { status: "pending" };
  // Un échec récent : la lecture immédiate reste la seule, et rien n'est appelé avant l'heure.
  if (existing?.status === "failed" && existing.retryAt && existing.retryAt.getTime() > now().getTime()) {
    return { status: "unavailable", reason: "deferred", retryAt: existing.retryAt };
  }

  const owned = await deps.store.claim(
    { key, snapshotHash: snapshot.hash, insee: snapshot.scope.id, horizon, contractVersion: SYNTHESIS_CONTRACT_VERSION },
    now(),
  );
  if (!owned) {
    // Perdu la course (un autre appel vient de réserver) ou stockage indisponible : on relit.
    const again = await deps.store.readSynthesis(key, now());
    if (again?.status === "ready") return { status: "ready", text: again.text, origin: again.origin, cached: true, modelCalls: 0 };
    if (again?.status === "pending") return { status: "pending" };
    if (again?.status === "failed") return { status: "unavailable", reason: "deferred", ...(again.retryAt ? { retryAt: again.retryAt } : {}) };
    return { status: "unavailable", reason: "store" };
  }

  const started = clock();
  const projection = projectForSynthesis(snapshot, horizon);
  const result = await produceSynthesis({
    projection,
    horizon,
    generate: (user) => deps.generate(SYNTHESIS_SYSTEM, user),
    reserveBudget: deps.reserveBudget,
  });
  const generationMs = clock() - started;

  if (result.rejections.length > 0) {
    console.warn("[synthese-territoire] refus des contrôles", {
      insee: snapshot.scope.id, horizon, origin: result.origin,
      rejections: result.rejections.map((r) => ({ attempt: r.attempt, rules: r.violations.map((v) => v.rule) })),
    });
  }

  if (result.origin === "deterministic") {
    // RIEN D'ENRICHI À SERVIR : deux refus, modèle en panne ou budget épuisé. La page garde la lecture
    // immédiate ; l'échec est daté, et la clé ne se retente qu'après le délai.
    const reason = result.budgetRefused ? "budget" : result.modelError !== undefined ? "model" : "rejected";
    const t = now();
    const retryAt = reason === "budget" ? prochainRenouvellementBudget(t)
      : new Date(t.getTime() + (reason === "rejected" ? RETRY_APRES_REFUS_MS : RETRY_APRES_PANNE_MS));
    await deps.store.fail(key, {
      text: result.text, rejections: result.rejections, modelCalls: result.modelCalls, generationMs, retryAt,
    });
    if (reason === "budget") console.warn("[synthese-territoire] budget refusé", { insee: snapshot.scope.id, horizon, modelCalls: result.modelCalls });
    if (reason === "model") console.error("[synthese-territoire] modèle indisponible", { insee: snapshot.scope.id, horizon, error: result.modelError });
    return { status: "unavailable", reason, retryAt };
  }

  await deps.store.complete(key, {
    text: result.text, origin: result.origin, rejections: result.rejections,
    modelCalls: result.modelCalls, generationMs,
  });
  return { status: "ready", text: result.text, origin: result.origin, cached: false, modelCalls: result.modelCalls };
}
