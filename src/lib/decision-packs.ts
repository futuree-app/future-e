import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedProject } from "@/lib/comparateur-vie";

// trio_key : les 3 INSEE triés, joints par '-'. Identité de l'achat (un trio).
// Robuste à l'ordre des colonnes : Annecy/Chambéry/Grenoble et Grenoble/Annecy/
// Chambéry donnent la même clé.
export function trioKey(insees: string[]): string {
  return insees
    .map((i) => i.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join("-");
}

export type DecisionPack = {
  trioKey: string;
  insees: [string, string, string];
  communes: [string | null, string | null, string | null];
  projetLabel: string | null;
  parsedSnapshot: ParsedProject;
};

// L'utilisateur possède-t-il le pack pour ce trio ? Lecture RLS (ses propres packs).
export async function resolvePackOwnership(
  supabase: SupabaseClient,
  userId: string,
  insees: string[],
): Promise<DecisionPack | null> {
  const key = trioKey(insees);
  const { data } = await supabase
    .from("decision_packs")
    .select(
      "trio_key, insee_1, insee_2, insee_3, commune_1, commune_2, commune_3, projet_label, parsed_snapshot",
    )
    .eq("user_id", userId)
    .eq("trio_key", key)
    .maybeSingle();

  if (!data) return null;
  return {
    trioKey: data.trio_key,
    insees: [data.insee_1, data.insee_2, data.insee_3],
    communes: [data.commune_1, data.commune_2, data.commune_3],
    projetLabel: data.projet_label,
    parsedSnapshot: data.parsed_snapshot as ParsedProject,
  };
}

// Octroi du pack depuis le snapshot en staging (pack_snapshots), idempotent.
// `admin` doit être un client service-role (bypass RLS). Si `expectedUserId` est
// fourni, on vérifie que le snapshot appartient bien à cet utilisateur (sécurité
// quand l'appel vient de la page de retour, pas du webhook signé). `email` permet
// de poser les entitlements one_shot (report_access complete) sans clobber : tout
// utilisateur connecté a déjà sa ligne user_accounts, l'upsert est un UPDATE.
// Retourne le trio_key octroyé, ou null si rien à faire.
export async function grantDecisionPackFromSnapshot(
  admin: SupabaseClient,
  paymentIntentId: string,
  expectedUserId?: string,
  email?: string,
): Promise<string | null> {
  const { data: snap } = await admin
    .from("pack_snapshots")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!snap || !snap.user_id) return null;
  if (expectedUserId && snap.user_id !== expectedUserId) return null;

  await admin.from("decision_packs").upsert(
    {
      user_id: snap.user_id,
      trio_key: snap.trio_key,
      insee_1: snap.insee_1,
      insee_2: snap.insee_2,
      insee_3: snap.insee_3,
      commune_1: snap.commune_1,
      commune_2: snap.commune_2,
      commune_3: snap.commune_3,
      projet_label: snap.projet_label,
      parsed_snapshot: snap.parsed_snapshot,
      stripe_payment_intent_id: paymentIntentId,
    },
    { onConflict: "user_id,trio_key" },
  );

  await admin.from("report_grants").upsert(
    [
      { insee: snap.insee_1, commune: snap.commune_1 },
      { insee: snap.insee_2, commune: snap.commune_2 },
      { insee: snap.insee_3, commune: snap.commune_3 },
    ].map((t, i) => ({
      user_id: snap.user_id,
      insee: t.insee,
      commune: t.commune,
      source: "pack_decision",
      rank: i + 1,
      stripe_payment_intent_id: paymentIntentId,
    })),
    { onConflict: "user_id,insee" },
  );

  // Entitlements one_shot au niveau compte : sans report_access = complete,
  // l'acheteur ne pourrait NI lire les rapports (canAccessCompleteReport) NI
  // utiliser AskFuture (api/ask bloque le plan free). Mêmes droits qu'un achat
  // rapport one-shot. email requis seulement à l'INSERT (la ligne existe déjà).
  if (email) {
    await admin.from("user_accounts").upsert(
      {
        user_id: snap.user_id,
        email,
        plan: "one_shot",
        status: "active",
        report_access: "complete",
        dashboard_access: "read_only",
      },
      { onConflict: "user_id" },
    );
  }

  return snap.trio_key as string;
}
