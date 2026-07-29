import { requireCurrentUser } from "@/lib/user-account";
import {
  buildDpeSelectionFields,
  getDossier,
  type DpeSelectionStatus,
} from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier } from "@/lib/server/address-dossier-write";
import { getDpeCandidatesByBanId } from "@/lib/dpe";
import type { DpeRecord } from "@/lib/dpe-attribution";

export const dynamic = "force-dynamic";

type Body = { dossierId: string; status: DpeSelectionStatus; dpe: DpeRecord | null };

const ALLOWED: DpeSelectionStatus[] = ["auto_confirmed", "user_confirmed", "not_in_list", "not_found"];

// Persiste le choix DPE dans le dossier. Mise à jour CIBLÉE des seules colonnes DPE : ne touche ni
// au snapshot ni à l'identité de l'adresse.
//
// Le droit n'est plus un flag de plan doublé d'une commune : c'est le DOSSIER lui-même. Le helper
// vérifie la propriété et la non-révocation, et un null de sa part est un refus explicite. L'ancien
// no-op silencieux quand la ligne manquait disparaît : le choix de diagnostic structure un rapport
// payant, le perdre sans rien dire n'est pas acceptable.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.dossierId || !ALLOWED.includes(body.status)) {
    return Response.json({ error: "dossierId/status requis" }, { status: 400 });
  }

  const { supabase, user } = await requireCurrentUser();

  const dossier = await getDossier(supabase, user.id, body.dossierId);
  if (!dossier) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  // Le diagnostic n'est JAMAIS accepté sur parole. Sans ce contrôle, n'importe quel identifiant de
  // DPE, y compris celui d'un autre bâtiment, pourrait être figé dans un dossier payant : la
  // classe, la surface, les coûts et les échéances du rapport en découlent.
  if (body.dpe) {
    const candidates = await getDpeCandidatesByBanId(dossier.ban_id);
    if (!candidates.some((c) => c.id_dpe === body.dpe?.id_dpe)) {
      return Response.json({ error: "DPE_NOT_AT_ADDRESS" }, { status: 422 });
    }
  }

  const fields = buildDpeSelectionFields(body.status, body.dpe ?? null, new Date().toISOString());
  const updated = await updateOwnedAddressDossier(user.id, body.dossierId, fields);

  if (!updated) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  return Response.json({ ok: true });
}
