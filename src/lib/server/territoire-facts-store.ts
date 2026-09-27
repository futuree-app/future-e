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
import type { SynthesisOrigin } from "@/lib/territoire/synthesis-pipeline";
import type { Violation } from "@/lib/territoire/synthesis-checks";

/** Durée pendant laquelle une génération en cours « tient » sa clé. Au-delà, elle est présumée morte. */
export const CLAIM_LEASE_MS = 150_000;

export type StoredSynthesis =
  | { status: "ready"; text: string; origin: SynthesisOrigin }
  | { status: "pending" };

export type TerritoireStore = {
  persistSnapshot(s: HashedSnapshot): Promise<boolean>;
  readSnapshot(hash: string): Promise<HashedSnapshot | null>;
  readSynthesis(key: string, now: Date): Promise<StoredSynthesis | null>;
  readSyntheses(keys: string[]): Promise<Map<string, { text: string; origin: SynthesisOrigin }>>;
  /** Vrai si l'appelant détient désormais la clé (nouvelle, ou génération précédente présumée morte). */
  claim(row: { key: string; snapshotHash: string; insee: string; horizon: string; contractVersion: string }, now: Date): Promise<boolean>;
  complete(key: string, r: { text: string; origin: SynthesisOrigin; rejections: { attempt: number; violations: Violation[] }[]; modelCalls: number; generationMs: number }): Promise<void>;
  release(key: string): Promise<void>;
};

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
      if (data.status === "ready" && typeof data.text === "string") {
        return { status: "ready", text: data.text, origin: data.origin as SynthesisOrigin };
      }
      // Une génération en cours dont le bail a expiré ne compte plus : elle est présumée morte.
      return data.lease_until && new Date(data.lease_until).getTime() > now.getTime() ? { status: "pending" } : null;
    },

    async readSyntheses(keys) {
      const out = new Map<string, { text: string; origin: SynthesisOrigin }>();
      if (keys.length === 0) return out;
      const { data, error } = await db
        .from("territory_synthesis")
        .select("cache_key, text, origin")
        .in("cache_key", keys)
        .eq("status", "ready");
      if (error || !data) return out;
      for (const r of data) if (typeof r.text === "string") out.set(r.cache_key, { text: r.text, origin: r.origin as SynthesisOrigin });
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
      return !taken.error && (taken.data ?? []).length > 0;
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
