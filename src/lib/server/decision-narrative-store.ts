import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoredBlocks = { key: string; text: string }[];

// Le JSON de la base est VALIDÉ, jamais casté : un artefact écrit sous un contrat antérieur ne doit
// pas faire tomber le Server Component, il doit être ignoré (et régénéré).
const storedBlocksSchema = z.array(z.object({ key: z.string(), text: z.string() }));

function parseBlocks(value: unknown): StoredBlocks | null {
  const parsed = storedBlocksSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// Lecture par IDENTITÉ EXACTE. Un hash différent n'est pas un cache miss « proche » : c'est le texte
// d'un autre plan, qui ne doit jamais s'afficher à la place du courant.
export async function readNarrative(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, inputHash: string,
): Promise<StoredBlocks | null> {
  const { data, error } = await sb
    .from("decision_narrative")
    .select("blocks")
    .eq("user_id", userId).eq("insee_code", insee)
    .eq("scope_key", scopeKey).eq("input_hash", inputHash)
    .maybeSingle();
  if (error) throw error;
  return data ? parseBlocks(data.blocks) : null;
}

// Upsert IDEMPOTENT, puis RELECTURE DE LA LIGNE CANONIQUE. Deux rendus concurrents peuvent constater
// le même cache miss et générer deux textes : celui qui perd la course doit afficher le texte du
// gagnant, sinon le lecteur retrouverait au rechargement un texte différent de celui qu'il a lu. Le
// conflit sur la contrainte unique est donc un cas NORMAL, pas une erreur applicative.
export async function saveNarrative(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, inputHash: string,
  blocks: StoredBlocks, promptVersion: string, model: string,
): Promise<StoredBlocks> {
  const { error } = await sb
    .from("decision_narrative")
    .upsert(
      {
        user_id: userId, insee_code: insee, scope_key: scopeKey, input_hash: inputHash,
        blocks, prompt_version: promptVersion, model,
      },
      { onConflict: "user_id,insee_code,scope_key,input_hash", ignoreDuplicates: true },
    );
  if (error) throw error;

  const canonical = await readNarrative(sb, userId, insee, scopeKey, inputHash);
  return canonical ?? blocks; // la ligne existe forcément ; ce repli couvre une lecture surprenante
}

// Garde-fou de croissance : sans lui, chaque édition du projet laisse un artefact de plus derrière
// elle. Best effort du point de vue de l'appelant (son échec ne coûte jamais la conclusion).
export async function pruneNarratives(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, keep = 3,
): Promise<void> {
  const { data, error } = await sb
    .from("decision_narrative")
    .select("id")
    .eq("user_id", userId).eq("insee_code", insee).eq("scope_key", scopeKey)
    .order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;

  const stale = (data ?? []).slice(keep).map((r) => r.id as string);
  if (stale.length === 0) return;
  const { error: delError } = await sb.from("decision_narrative").delete().in("id", stale);
  if (delError) throw delError;
}
