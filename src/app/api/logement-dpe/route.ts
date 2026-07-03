import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { buildDpeSelectionFields, type DpeSelectionStatus } from "@/lib/logement-store";
import type { DpeRecord } from "@/lib/dpe-attribution";

export const dynamic = "force-dynamic";

type Body = { insee: string; status: DpeSelectionStatus; dpe: DpeRecord | null };

const ALLOWED: DpeSelectionStatus[] = ["auto_confirmed", "user_confirmed", "not_in_list", "not_found"];

// Persiste le choix DPE dans l'artefact logement (clé user+insee, RLS own). Mise à jour CIBLÉE
// des seules colonnes DPE : ne touche ni au snapshot Face 3 ni à l'adresse. No-op si la ligne
// n'existe pas encore (l'analyse « autour » la crée en parallèle ; le choix sera repersisté au
// prochain choix explicite de l'utilisateur).
export async function POST(req: Request) {
  const account = await getCurrentUserAccount();
  if (!canAccessCompleteReport(account)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.insee || !ALLOWED.includes(body.status)) {
    return Response.json({ error: "insee/status requis" }, { status: 400 });
  }
  const { supabase, user } = await requireCurrentUser();
  const fields = buildDpeSelectionFields(body.status, body.dpe ?? null, new Date().toISOString());
  await supabase
    .from("logement")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("insee", body.insee);
  return Response.json({ ok: true });
}
