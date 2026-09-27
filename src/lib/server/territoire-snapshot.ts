import "server-only";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA PHOTO DES DONNÉES DU MODULE TERRITOIRE, PRISE UNE FOIS (FUT-6, D10).
//
// La page /rapport/quartier la construit, en rend les cartes, la PERSISTE sous son empreinte, et ne
// transmet au navigateur que cette empreinte. La route de synthèse relit CE snapshot : elle ne
// recontacte aucune source et ne reconstruit rien. Le hub /rapport la construit aussi, en arrière-
// plan, pour préparer la synthèse avant que le lecteur n'arrive sur Territoire.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { getTerritoryContext, getCommuneDistinctive } from "@/lib/comparateur-vie";
import { deriveTerritoryMood } from "@/lib/territory-mood";
import { getResidencesSecondairesPct } from "@/lib/saisonnalite";
import { getEra5Trend } from "@/lib/era5-trend";
import { catnatInondationDepuisIndex } from "@/lib/decision/catnat-evidence";
import { buildTerritoireSnapshot, type TerritoireInputs } from "@/lib/territoire/facts";
import { withHash } from "@/lib/facts/hash";
import type { HashedSnapshot } from "@/lib/facts/contract";
import { SYNTHESIS_MODEL, type HorizonKey } from "@/lib/territoire/synthesis-contract";
import { ensureTerritoireSynthesis, type EnsureDeps, type EnsureResult } from "@/lib/territoire/synthesis-ensure";
import { territoireStore } from "@/lib/server/territoire-facts-store";
import { reserverBudgetModele } from "@/lib/server/garde-appels-modele";

/** L'horizon affiché par défaut (« recommandé ») : c'est lui que le préchauffage prépare. */
export const DEFAULT_HORIZON: HorizonKey = "gwl20";

export async function loadTerritoireSnapshot(insee: string, communeName: string): Promise<HashedSnapshot> {
  const [enrichment, ctx, saisonnalitePct, era5] = await Promise.all([
    gatherCommuneEnrichment(insee).catch(() => null),
    getTerritoryContext(insee).catch(() => null),
    getResidencesSecondairesPct(insee).catch(() => null),
    getEra5Trend(insee).catch(() => null),
  ]);
  const entry = ctx?.entry ?? null;
  const mood = deriveTerritoryMood({ communeName, inseeCode: insee, territoire: null });
  const ademe = enrichment?.ademe?.commune ?? null;

  const inputs: TerritoireInputs = {
    insee,
    communeName,
    entry: entry
      ? {
          population: entry.population ?? null,
          densite: entry.densite ?? null,
          distance_cote_km: entry.distance_cote_km ?? null,
          relief_proximite: entry.relief_proximite ?? null,
          altitude: entry.altitude ?? null,
          nature: entry.nature
            ? { brut_pct: entry.nature.brut_pct ?? null, radius_pct: entry.nature.radius_pct ?? null, composition: entry.nature.composition ?? null }
            : null,
          demographie: entry.demographie
            ? { taux_total: entry.demographie.taux_total ?? null, part_nouveaux: entry.demographie.part_nouveaux ?? null, recit: entry.demographie.recit ?? null }
            : null,
        }
      : null,
    urbanRole: ctx ? { role: ctx.role, uuLabel: ctx.uuLabel, uuPop: ctx.uuPop } : null,
    typology: { type: mood.type, label: mood.typeLabel },
    ademe: ademe
      ? {
          densite: ademe.territoire?.densite ?? null,
          taux_boisement: ademe.territoire?.taux_boisement ?? null,
          population: ademe.population ?? null,
          vieillissement_pct: ademe.vieillissement_pct ?? null,
          vacants_pct: ademe.logements?.vacants_pct ?? null,
        }
      : null,
    scenarios: enrichment?.drias?.commune.s ?? null,
    georisques: enrichment?.georisques ?? null,
    catnat: enrichment?.catnat ?? null,
    catnatInondationIndex: catnatInondationDepuisIndex(entry ?? undefined),
    vigieau: enrichment?.vigieau ?? null,
    drought: enrichment?.eau?.drought ?? null,
    littoral: enrichment?.littoral ?? null,
    era5,
    saisonnalitePct,
    distinctiveTrait: entry ? getCommuneDistinctive(entry) : null,
  };
  return withHash(buildTerritoireSnapshot(inputs, new Date().toISOString()));
}

// ── Le modèle, derrière le garde de budget ───────────────────────────────────────────────────

async function generateWithModel(system: string, user: string): Promise<string> {
  // Synthèse payante : Sonnet, effort moyen, sans thinking (cf. mémoire synthesis_model_routing).
  // JAMAIS streamé : un texte n'est montré qu'une fois contrôlé (D8).
  const res = await generateText({
    model: anthropic(SYNTHESIS_MODEL),
    providerOptions: { anthropic: { effort: "medium", thinking: { type: "disabled" } } },
    system,
    prompt: user,
  });
  return res.text;
}

/** Les dépendances réelles, ou `null` sans persistance (la page affiche alors le déterministe). */
export function realEnsureDeps(): EnsureDeps | null {
  const store = territoireStore();
  if (!store) return null;
  return {
    store,
    // Le budget se réserve seulement quand une génération va vraiment partir (cache manqué, clé
    // réservée) : une réponse de cache ne coûte rien et ne doit rien consommer.
    reserveBudget: async () => (await reserverBudgetModele("synthese")) === null,
    generate: generateWithModel,
  };
}

/**
 * Construit, persiste, et prépare la synthèse enrichie de l'horizon par défaut. Conçu pour `after()` :
 * le rendu n'attend jamais. Ne lève jamais.
 */
export async function prechaufferSyntheseTerritoire(insee: string, communeName: string, snapshot?: HashedSnapshot): Promise<EnsureResult | null> {
  try {
    const deps = realEnsureDeps();
    if (!deps) return null;
    const s = snapshot ?? (await loadTerritoireSnapshot(insee, communeName));
    if (!(await deps.store.persistSnapshot(s))) return null;
    return await ensureTerritoireSynthesis(s, DEFAULT_HORIZON, deps);
  } catch (err) {
    console.error("[synthese-territoire] préchauffage échoué", { insee, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
