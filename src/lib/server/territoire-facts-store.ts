// ════════════════════════════════════════════════════════════════════════════════════════════
// LA PERSISTANCE TECHNIQUE DU MODULE TERRITOIRE (FUT-6) : snapshots de faits et synthèses en cache.
//
// Service role, comme `reachability_artifact` : ces tables ne sont JAMAIS lues par le client, et ne
// contiennent AUCUNE donnée personnelle (la synthèse Territoire est générique, décision du 28/09).
// Migration : supabase/34_territoire_facts.sql.
//
// PANNE = DÉGRADATION, JAMAIS CASSE. Sans clés (développement, tests) ou sans tables (migration pas
// encore appliquée), chaque fonction rend `null` / `false`, et la page affiche la synthèse
// déterministe calculée depuis son snapshot en mémoire.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { HashedSnapshot } from "@/lib/facts/contract";
import { isEnrichedOrigin, type EnrichedOrigin } from "../territoire/synthesis-origin.ts";
import type { Violation } from "@/lib/territoire/synthesis-checks";

/** Durée pendant laquelle une génération en cours « tient » sa clé. Au-delà, elle est présumée morte. */
export const CLAIM_LEASE_MS = 150_000;

/**
 * CE QUE LE CACHE PEUT DIRE D'UNE CLÉ (FUT-76). Trois états, et un seul est une lecture enrichie :
 *
 *   - `ready`   : un texte du MODÈLE, passé par les contrôles. Seul cet état est une lecture enrichie ;
 *   - `pending` : une génération tient la clé ;
 *   - `failed`  : la dernière tentative n'a rien produit de servable (deux refus des contrôles, modèle
 *                 ou budget indisponible). La lecture immédiate reste la seule ; une nouvelle tentative
 *                 est permise à partir de `retryAt`.
 *
 * EN BASE, `failed` est une ligne `status = 'ready'` d'origine `deterministic`, et `lease_until` y porte
 * l'heure de la prochaine tentative permise (aucune migration : la contrainte d'origine l'admettait déjà).
 * Une origine ABSENTE ou INCONNUE se lit aussi comme `failed`, retentable tout de suite : dans le doute
 * sur l'origine, le texte n'est jamais présenté comme une lecture enrichie.
 */
export type StoredSynthesis =
  | { status: "ready"; text: string; origin: EnrichedOrigin }
  | { status: "pending" }
  | { status: "failed"; retryAt: Date | null };

export type TerritoireStore = {
  persistSnapshot(s: HashedSnapshot): Promise<boolean>;
  readSnapshot(hash: string): Promise<HashedSnapshot | null>;
  readSynthesis(key: string, now: Date): Promise<StoredSynthesis | null>;
  /** Les lectures ENRICHIES seulement (origine modèle). Un repli déterministe n'y figure jamais. */
  readSyntheses(keys: string[]): Promise<Map<string, { text: string; origin: EnrichedOrigin }>>;
  /**
   * Vrai si l'appelant détient désormais la clé : nouvelle, génération précédente présumée morte, ou
   * échec précédent dont l'heure de nouvelle tentative est passée.
   */
  claim(row: { key: string; snapshotHash: string; insee: string; horizon: string; contractVersion: string }, now: Date): Promise<boolean>;
  /** Enregistre une lecture enrichie : un texte du modèle, validé. */
  complete(key: string, r: { text: string; origin: EnrichedOrigin; rejections: { attempt: number; violations: Violation[] }[]; modelCalls: number; generationMs: number }): Promise<void>;
  /** Enregistre un échec : rien d'enrichi à servir, prochaine tentative permise à `retryAt`. */
  fail(key: string, r: { text: string; rejections: { attempt: number; violations: Violation[] }[]; modelCalls: number; generationMs: number; retryAt: Date }): Promise<void>;
  release(key: string): Promise<void>;
};

/** Lit une ligne de cache, sans jamais faire passer un repli pour une lecture enrichie. Pur, testé. */
export function lireLigneSynthese(
  row: { status: string; text: unknown; origin: unknown; lease_until: string | null },
  now: Date,
): StoredSynthesis | null {
  if (row.status === "ready") {
    if (typeof row.text === "string" && isEnrichedOrigin(row.origin)) return { status: "ready", text: row.text, origin: row.origin };
    return { status: "failed", retryAt: row.lease_until ? new Date(row.lease_until) : null };
  }
  // Une génération en cours dont le bail a expiré ne compte plus : elle est présumée morte.
  return row.lease_until && new Date(row.lease_until).getTime() > now.getTime() ? { status: "pending" } : null;
}

function store(db: SupabaseClient): TerritoireStore {
  return {
    async persistSnapshot(s) {
      // Idempotent : une empreinte déjà connue n'écrit rien (même photo, même ligne).
      const { error } = await db.from("territory_facts_snapshot").upsert(
        { hash: s.hash, insee_code: s.scope.id, registry_version: s.registryVersion, snapshot: s },
        { onConflict: "hash", ignoreDuplicates: true },
      );
      if (error) console.error("[territoire-facts] snapshot non persisté", { hash: s.hash, error: error.message });
      return !error;
    },

    async readSnapshot(hash) {
      const { data, error } = await db.from("territory_facts_snapshot").select("snapshot").eq("hash", hash).maybeSingle();
      if (error || !data) return null;
      return data.snapshot as HashedSnapshot;
    },

    async readSynthesis(key, now) {
      const { data, error } = await db
        .from("territory_synthesis")
        .select("status, text, origin, lease_until")
        .eq("cache_key", key)
        .maybeSingle();
      if (error || !data) return null;
      return lireLigneSynthese(data, now);
    },

    async readSyntheses(keys) {
      const out = new Map<string, { text: string; origin: EnrichedOrigin }>();
      if (keys.length === 0) return out;
      const { data, error } = await db
        .from("territory_synthesis")
        .select("cache_key, text, origin")
        .in("cache_key", keys)
        .eq("status", "ready");
      if (error || !data) return out;
      // FUT-76 : un repli déterministe est enregistré `ready` ; il n'est PAS une lecture enrichie.
      for (const r of data) if (typeof r.text === "string" && isEnrichedOrigin(r.origin)) out.set(r.cache_key, { text: r.text, origin: r.origin });
      return out;
    },

    async claim(row, now) {
      const lease = new Date(now.getTime() + CLAIM_LEASE_MS).toISOString();
      const inserted = await db.from("territory_synthesis").upsert(
        {
          cache_key: row.key, snapshot_hash: row.snapshotHash, insee_code: row.insee, horizon: row.horizon,
          contract_version: row.contractVersion, status: "pending", lease_until: lease,
        },
        { onConflict: "cache_key", ignoreDuplicates: true },
      ).select("cache_key");
      if (inserted.error) return false;
      if ((inserted.data ?? []).length > 0) return true;
      // La clé existe : on ne la reprend que si elle est EN COURS et que son bail a expiré.
      const taken = await db
        .from("territory_synthesis")
        .update({ lease_until: lease })
        .eq("cache_key", row.key)
        .eq("status", "pending")
        .lt("lease_until", now.toISOString())
        .select("cache_key");
      if (!taken.error && (taken.data ?? []).length > 0) return true;
      // … ou si c'est un ÉCHEC dont l'heure de nouvelle tentative est passée (FUT-76). La mise à jour
      // est conditionnée à la valeur LUE de `lease_until` : deux visiteurs simultanés ne peuvent pas
      // reprendre la même clé, le second ne trouve plus la ligne telle qu'il l'a lue.
      const { data: cur } = await db.from("territory_synthesis").select("status, text, origin, lease_until").eq("cache_key", row.key).maybeSingle();
      if (!cur) return false;
      const etat = lireLigneSynthese(cur, now);
      if (etat?.status !== "failed" || (etat.retryAt && etat.retryAt.getTime() > now.getTime())) return false;
      let reprise = db
        .from("territory_synthesis")
        .update({ status: "pending", lease_until: lease })
        .eq("cache_key", row.key)
        .eq("status", "ready");
      reprise = cur.lease_until ? reprise.eq("lease_until", cur.lease_until) : reprise.is("lease_until", null);
      const repris = await reprise.select("cache_key");
      return !repris.error && (repris.data ?? []).length > 0;
    },

    async complete(key, r) {
      const { error } = await db
        .from("territory_synthesis")
        .update({
          status: "ready", text: r.text, origin: r.origin, rejections: r.rejections,
          model_calls: r.modelCalls, generation_ms: r.generationMs, lease_until: null,
        })
        .eq("cache_key", key);
      if (error) console.error("[territoire-facts] synthèse non enregistrée", { key, error: error.message });
    },

    async fail(key, r) {
      const { error } = await db
        .from("territory_synthesis")
        .update({
          status: "ready", text: r.text, origin: "deterministic", rejections: r.rejections,
          model_calls: r.modelCalls, generation_ms: r.generationMs, lease_until: r.retryAt.toISOString(),
        })
        .eq("cache_key", key);
      if (error) console.error("[territoire-facts] échec de synthèse non enregistré", { key, error: error.message });
    },

    async release(key) {
      await db.from("territory_synthesis").delete().eq("cache_key", key).eq("status", "pending");
    },
  };
}

let cached: TerritoireStore | null | undefined;

/** `null` sans clés service : la page dégrade vers la synthèse déterministe. */
export function territoireStore(): TerritoireStore | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? store(createClient(url, key, { auth: { persistSession: false } })) : null;
  return cached;
}
