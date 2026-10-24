import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedProject } from "@/lib/comparateur-vie";
import {
  preuvePaiementPack, type InstantanePack, type MotifRefus, type PaiementStripe,
} from "@/lib/commerce/preuve-paiement-pack";

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
  /** Date d'achat (FUT-129 : contextualiser un comparatif vendu avant un changement de lecture). */
  createdAt: string | null;
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
      "trio_key, mode, insee_1, insee_2, insee_3, commune_1, commune_2, commune_3, projet_label, parsed_snapshot, created_at",
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
    createdAt: typeof data.created_at === "string" ? data.created_at : null,
  };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// OCTROI DU COMPARATIF, SUR PREUVE DE PAIEMENT SEULEMENT (FUT-115).
//
// `paiement` est un PaymentIntent LU CHEZ STRIPE PAR LE SERVEUR : l'objet signé du webhook, ou la réponse de
// `paymentIntents.retrieve`. Jamais un identifiant ni un statut venus d'une URL. Sans `preuvePaiementPack`,
// rien n'est écrit : un futur appelant ne peut pas reproduire la faille de la page de retour, qui ouvrait le
// comparatif sur `?redirect_status=succeeded` alors que l'instantané existe dès la création du paiement.
//
// IDEMPOTENT : trois upserts sur leurs clés naturelles (droits territoriaux, compte, puis le comparatif), rejouables autant de fois que le webhook ou la page
// le demandent. UNE ÉCRITURE ÉCHOUÉE LÈVE : l'erreur était ignorée, le webhook répondait 200 et Stripe ne le
// rejouait jamais, donc un comparatif payé pouvait rester fermé pour toujours. En levant, le webhook répond
// 500 et Stripe réessaie ; la page de retour, elle, montre l'attente.
//
// `admin` doit être un client service-role (bypass RLS). `attendu` : le compte de la session quand l'appel
// vient d'une page. `email` permet de poser les entitlements one_shot sans clobber.
// ════════════════════════════════════════════════════════════════════════════════════════════════════
export type OctroiPack = { ok: true; trioKey: string } | { ok: false; motif: MotifRefus };

export async function grantDecisionPackFromSnapshot(
  admin: SupabaseClient,
  paiement: PaiementStripe,
  opts: { attendu?: string; email?: string } = {},
): Promise<OctroiPack> {
  const { data: snap, error: lectureError } = await admin
    .from("pack_snapshots")
    .select("*")
    .eq("stripe_payment_intent_id", paiement.id)
    .maybeSingle();
  if (lectureError) throw new Error(`pack_snapshots : lecture impossible (${lectureError.message})`);

  const preuve = preuvePaiementPack(paiement, snap as InstantanePack | null, opts.attendu);
  if (!preuve.ok) return preuve;

  const echec = (quoi: string, e: { message: string } | null) => {
    if (e) throw new Error(`${quoi} : écriture impossible (${e.message})`);
  };

  // Un report_grant par commune RÉELLE (2 ou 3 ; insee_3 nullable en mode choix).
  const grants = [
    { insee: snap.insee_1, commune: snap.commune_1 },
    { insee: snap.insee_2, commune: snap.commune_2 },
    { insee: snap.insee_3, commune: snap.commune_3 },
  ].filter((t) => t.insee);
  const { error: grantsError } = await admin.from("report_grants").upsert(
    grants.map((t, i) => ({
      user_id: snap.user_id,
      insee: t.insee,
      commune: t.commune,
      source: "pack_decision",
      rank: i + 1,
      stripe_payment_intent_id: paiement.id,
    })),
    { onConflict: "user_id,insee" },
  );
  echec("report_grants", grantsError);

  // Entitlements one_shot au niveau compte. Ce qui ouvre les rapports du Pack, ce sont les trois
  // `report_grants` écrits juste avant : depuis l'alignement du 30/07, la lecture d'un
  // territoire se demande à `canAccessTerritory`, jamais au plan. Le plan reste nécessaire pour ce
  // qui n'est pas territorial, AskFuture en tête (api/ask bloque le plan free).
  // email requis seulement à l'INSERT (la ligne existe déjà).
  if (opts.email) {
    const { error: compteError } = await admin.from("user_accounts").upsert(
      {
        user_id: snap.user_id,
        email: opts.email,
        plan: "one_shot",
        status: "active",
        report_access: "complete",
      },
      { onConflict: "user_id" },
    );
    echec("user_accounts", compteError);
  }

  // LE COMPARATIF EN DERNIER (revue FUT-115). `resolvePackOwnership` tient la ligne `decision_packs` pour la
  // preuve que l'achat est livré : la page ne retente plus rien dès qu'elle existe. Écrite en premier, une
  // panne sur les droits territoriaux ou le compte laissait un comparatif « acquis » aux droits incomplets.
  // Écrite en dernier, elle n'existe que si CET écrivain a déjà posé tous les droits ; un webhook et un retour
  // concurrents suivent chacun cet ordre, et chaque upsert porte sur une clé unique : aucun doublon possible.
  const { error: packError } = await admin.from("decision_packs").upsert(
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
      stripe_payment_intent_id: paiement.id,
    },
    { onConflict: "user_id,trio_key" },
  );
  echec("decision_packs", packError);

  return { ok: true, trioKey: snap.trio_key as string };
}
