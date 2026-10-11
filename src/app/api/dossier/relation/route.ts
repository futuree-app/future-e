import "server-only";
import { requireCurrentUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier } from "@/lib/server/address-dossier-write";
import { enregistrerRelationAdresse } from "@/lib/relation-au-lieu";

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
  const body = await request.json().catch(() => null);
  const { supabase, user } = await requireCurrentUser();
  // La logique vit dans `enregistrerRelationAdresse` (testée avec un stockage simulé) ; la route ne
  // fait que brancher le vrai stockage, sous l'identité du lecteur.
  const r = await enregistrerRelationAdresse(body, {
    now: new Date(),
    lireDossier: (id) => getDossier(supabase, user.id, id),
    ecrire: (id, patch) => updateOwnedAddressDossier(user.id, id, patch),
  });
  return Response.json(r.body, { status: r.status });
}
