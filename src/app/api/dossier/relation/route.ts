import "server-only";
import { requireCurrentUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier } from "@/lib/server/address-dossier-write";
import { patchRelationAdresse } from "@/lib/relation-au-lieu";

export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « VOTRE LIEN AVEC CE BIEN » (FUT-26) : la relation au lieu, déclarée à l'adresse.
//
// PATCH { dossierId, relation: "lives_here" | "studying" | null }. `null` efface : la relation
// redevient inconnue, ce qui est une réponse permise (« je préfère ne pas préciser »).
//
// CE QU'ELLE N'ÉCRIT PAS : le projet. La relation à un bien et le projet durable sont deux objets
// (décision 3 de FUT-25) ; changer l'un ne modifie jamais l'autre. Un test le vérifie sur cette source.
//
// La propriété du dossier se vérifie deux fois : `getDossier` (RLS, utilisateur, accès non révoqué),
// puis `updateOwnedAddressDossier`, qui filtre encore par utilisateur et rend `null` sur un refus.
// ════════════════════════════════════════════════════════════════════════════════════════════

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { dossierId?: unknown; relation?: unknown } | null;
  const dossierId = typeof body?.dossierId === "string" ? body.dossierId : null;
  if (!dossierId) return Response.json({ error: "dossierId requis" }, { status: 400 });
  const patch = patchRelationAdresse(body?.relation, new Date());
  if (!patch) return Response.json({ error: "relation invalide" }, { status: 400 });

  const { supabase, user } = await requireCurrentUser();
  const dossier = await getDossier(supabase, user.id, dossierId);
  if (!dossier) return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });

  const ecrit = await updateOwnedAddressDossier(user.id, dossier.id, patch);
  if (!ecrit) return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  return Response.json({ ok: true, relation: ecrit.place_relation ?? null });
}
