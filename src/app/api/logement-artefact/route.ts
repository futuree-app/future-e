// Crée (ou rafraîchit) l'ARTEFACT d'une adresse analysée : la ligne à laquelle viendront
// s'accrocher le choix de diagnostic, la synthèse et l'entourage.
//
// Elle existe parce que la création de cette ligne était jusqu'ici un effet de bord de l'appel
// « autour de l'adresse ». Depuis que l'entourage a son propre module (29/07/2026), le module
// Logement doit poser l'artefact lui-même : l'endpoint DPE et la persistance de synthèse font des
// UPDATE ciblés, silencieusement sans effet quand la ligne manque.
//
// N'écrit que l'identité de l'adresse. Aucun calcul, aucune source externe : le point et la
// parcelle viennent de l'analyse déjà faite par /api/georisques-logement.

import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { canAnalyzeCommune } from "@/lib/active-territory";
import { upsertLogementAddress } from "@/lib/logement-store";

export const dynamic = "force-dynamic";

type Body = {
  logement_id: string;
  insee: string;
  address_label: string;
  city?: string | null;
  postcode?: string | null;
  latitude: number;
  longitude: number;
  parcel_code?: string | null;
};

export async function POST(req: Request) {
  const account = await getCurrentUserAccount();
  if (!canAccessCompleteReport(account)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (
    !body?.logement_id || !body.insee || !body.address_label ||
    typeof body.latitude !== "number" || typeof body.longitude !== "number"
  ) {
    return Response.json(
      { error: "logement_id/insee/address_label/latitude/longitude requis" },
      { status: 400 },
    );
  }

  const { supabase, user } = await requireCurrentUser();
  // Frontière de monétisation (étape 4.5) : on n'enregistre pas d'artefact pour une commune que
  // l'utilisateur n'a pas le droit de lire.
  if (!(await canAnalyzeCommune(supabase, user.id, body.insee))) {
    return Response.json(
      { error: "COMMUNE_NOT_UNLOCKED", code: "COMMUNE_NOT_UNLOCKED", insee: body.insee },
      { status: 403 },
    );
  }

  await upsertLogementAddress(supabase, {
    user_id: user.id,
    logement_id: body.logement_id,
    insee: body.insee,
    address_label: body.address_label,
    city: body.city ?? null,
    postcode: body.postcode ?? null,
    latitude: body.latitude,
    longitude: body.longitude,
    parcel_code: body.parcel_code ?? null,
  });

  return Response.json({ ok: true });
}
