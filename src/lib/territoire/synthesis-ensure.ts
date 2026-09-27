// ════════════════════════════════════════════════════════════════════════════════════════════
// « QU'UNE SYNTHÈSE ENRICHIE EXISTE POUR CE SNAPSHOT ET CET HORIZON » (FUT-6).
//
// Appelée par la route (à la demande du lecteur) et par le préchauffage (page Territoire et hub,
// dans `after()`). Toutes les dépendances sont injectées : le stockage, le budget, le modèle. La
// logique se teste donc sans base ni réseau.
//
//   cache prêt              → rendu tel quel, ZÉRO appel au modèle ;
//   génération en cours     → « pending » (un autre appel la produit : pas de double facture) ;
//   clé libre               → on la RÉSERVE, on vérifie le budget, on produit (≤ 2 appels), on stocke.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { HashedSnapshot } from "../facts/contract.ts";
import { synthesisCacheKey } from "./synthesis-cache.ts";
import { projectForSynthesis, SYNTHESIS_CONTRACT_VERSION, SYNTHESIS_SYSTEM, type HorizonKey } from "./synthesis-contract.ts";
import { produceSynthesis, type SynthesisOrigin } from "./synthesis-pipeline.ts";
import type { TerritoireStore } from "../server/territoire-facts-store.ts";

export type EnsureResult =
  | { status: "ready"; text: string; origin: SynthesisOrigin; cached: boolean; modelCalls: number }
  | { status: "pending" }
  | { status: "unavailable"; reason: "store" | "budget" | "model"; text?: string };

export type EnsureDeps = {
  store: TerritoireStore;
  /** `true` si le budget du jour autorise une génération. */
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

  const owned = await deps.store.claim(
    { key, snapshotHash: snapshot.hash, insee: snapshot.scope.id, horizon, contractVersion: SYNTHESIS_CONTRACT_VERSION },
    now(),
  );
  if (!owned) {
    // Perdu la course (un autre appel vient de réserver) ou stockage indisponible : on relit.
    const again = await deps.store.readSynthesis(key, now());
    if (again?.status === "ready") return { status: "ready", text: again.text, origin: again.origin, cached: true, modelCalls: 0 };
    return again?.status === "pending" ? { status: "pending" } : { status: "unavailable", reason: "store" };
  }

  if (!(await deps.reserveBudget())) {
    await deps.store.release(key);
    return { status: "unavailable", reason: "budget" };
  }

  const started = clock();
  const projection = projectForSynthesis(snapshot, horizon);
  const result = await produceSynthesis({
    projection,
    horizon,
    generate: (user) => deps.generate(SYNTHESIS_SYSTEM, user),
  });
  const generationMs = clock() - started;

  if (result.rejections.length > 0) {
    console.warn("[synthese-territoire] refus des contrôles", {
      insee: snapshot.scope.id, horizon, origin: result.origin,
      rejections: result.rejections.map((r) => ({ attempt: r.attempt, rules: r.violations.map((v) => v.rule) })),
    });
  }

  if (!result.cacheable) {
    // Modèle indisponible : on libère la clé (une visite suivante retentera), sans rien figer.
    await deps.store.release(key);
    console.error("[synthese-territoire] modèle indisponible", { insee: snapshot.scope.id, horizon, error: result.modelError });
    return { status: "unavailable", reason: "model", text: result.text };
  }

  await deps.store.complete(key, {
    text: result.text, origin: result.origin, rejections: result.rejections,
    modelCalls: result.modelCalls, generationMs,
  });
  return { status: "ready", text: result.text, origin: result.origin, cached: false, modelCalls: result.modelCalls };
}
