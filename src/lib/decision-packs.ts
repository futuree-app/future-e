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

// mode : 'replay' (trio PROPOSÉ par /ou-vivre, reconstruit en rejouant parsed_snapshot)
// ou 'choix' (2-3 communes NOMMÉES sur /comparateur, reconstruites via seedComparaison,
// sans projet). insees a 2 ou 3 entrées (jamais de null intercalé), communes est aligné.
export type DecisionPack = {
  trioKey: string;
  mode: "replay" | "choix";
  insees: string[];
  communes: (string | null)[];
  projetLabel: string | null;
  parsedSnapshot: ParsedProject | null; // null en mode choix
};

// L'utilisateur possède-t-il le pack pour ces communes ? Lecture RLS (ses propres packs).
export async function resolvePackOwnership(
  supabase: SupabaseClient,
  userId: string,
  insees: string[],
): Promise<DecisionPack | null> {
  const key = trioKey(insees);
  const { data } = await supabase
    .from("decision_packs")
    .select(
      "trio_key, mode, insee_1, insee_2, insee_3, commune_1, commune_2, commune_3, projet_label, parsed_snapshot",
    )
    .eq("user_id", userId)
    .eq("trio_key", key)
    .maybeSingle();

  if (!data) return null;
  // insee_3 est nullable (pack à 2 communes) : on compacte sans trou, communes aligné.
  const rawInsees = [data.insee_1, data.insee_2, data.insee_3];
  const rawCommunes = [data.commune_1, data.commune_2, data.commune_3];
  const inseesOut: string[] = [];
  const communesOut: (string | null)[] = [];
  rawInsees.forEach((ins, i) => {
    if (ins) {
      inseesOut.push(ins);
      communesOut.push(rawCommunes[i] ?? null);
    }
  });
  return {
    trioKey: data.trio_key,
    mode: data.mode === "choix" ? "choix" : "replay",
    insees: inseesOut,
    communes: communesOut,
    projetLabel: data.projet_label,
    parsedSnapshot: (data.parsed_snapshot as ParsedProject | null) ?? null,
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
      mode: snap.mode === "choix" ? "choix" : "replay",
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

  // Un report_grant par commune RÉELLE (2 ou 3 ; insee_3 nullable en mode choix).
  const grants = [
    { insee: snap.insee_1, commune: snap.commune_1 },
    { insee: snap.insee_2, commune: snap.commune_2 },
    { insee: snap.insee_3, commune: snap.commune_3 },
  ].filter((t) => t.insee);
  await admin.from("report_grants").upsert(
    grants.map((t, i) => ({
      user_id: snap.user_id,
      insee: t.insee,
      commune: t.commune,
      source: "pack_decision",
      rank: i + 1,
      stripe_payment_intent_id: paymentIntentId,
    })),
    { onConflict: "user_id,insee" },
  );

  // Entitlements one_shot au niveau compte. Ce qui ouvre les rapports du Pack, ce sont les trois
  // `report_grants` écrits juste au-dessus : depuis l'alignement du 30/07, la lecture d'un
  // territoire se demande à `canAccessTerritory`, jamais au plan. Le plan reste nécessaire pour ce
  // qui n'est pas territorial, AskFuture en tête (api/ask bloque le plan free).
  // email requis seulement à l'INSERT (la ligne existe déjà).
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
