import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireCurrentUser } from "@/lib/user-account";
import { validateSelectedBanAddress } from "@/lib/selected-ban-address";
import { isAdminDossierCreator } from "@/lib/server/admin-dossier";

export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════
// Créateur de dossiers pour les tests.
//
// DEUX VERROUS INDÉPENDANTS. `ENABLE_ADMIN_DOSSIER_CREATION` doit valoir "true", ET l'e-mail de la
// session doit figurer dans `FUTUREE_ADMIN_EMAILS`. Le premier est absent en production par défaut,
// donc la route y répond 404 quelle que soit la liste.
//
// CE CRÉATEUR NE CONTOURNE AUCUN CONTRÔLE D'ACCÈS. `canAccessTerritory` et la lecture des dossiers
// ignorent totalement l'existence d'un compte de service : ils ne connaissent que des lignes. Une
// variable mal configurée ne peut donc pas ouvrir le produit à tout le monde ; au pire, quelqu'un
// se crée des dossiers vides à lui-même. C'est ce qui distingue un créateur privilégié, dont le
// pire effet est borné, d'une exception dans le contrôle d'accès, qui fuit en silence.
//
// Le porteur parcourt ensuite le MÊME chemin qu'un acheteur : le panneau de choix, les états
// dégradés, les refus. C'est la raison de ne pas lui donner un laissez-passer de lecture.
//
// Les dossiers créés ici portent `stripe_payment_intent_id` à null, donc ils n'ouvrent aucun tarif
// d'approfondissement (cf. decidePaidTerritory) et sont exclus de tout comptage de chiffre
// d'affaires. Sans quoi les tests du porteur pollueraient la mesure.
// ════════════════════════════════════════════════════════════════════════════

const NOT_FOUND = new Response(null, { status: 404 });

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: Request) {
  const { user } = await requireCurrentUser();
  // 404 plutôt que 403 : un 403 confirmerait l'existence de la route.
  if (!isAdminDossierCreator(user.email)) return NOT_FOUND;

  const body = (await req.json().catch(() => null)) as { address?: unknown } | null;
  const sel = validateSelectedBanAddress(body?.address);
  if (!sel) {
    return Response.json({ error: "Adresse BAN invalide." }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from("address_dossiers")
    .insert({
      user_id: user.id,
      ban_id: sel.banId,
      insee: sel.citycode,
      address_label: sel.label,
      city: sel.city,
      postcode: sel.postcode,
      latitude: sel.latitude,
      longitude: sel.longitude,
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ dossierId: (data as { id: string }).id });
}

export async function DELETE(req: Request) {
  const { user } = await requireCurrentUser();
  if (!isAdminDossierCreator(user.email)) return NOT_FOUND;

  const { searchParams } = new URL(req.url);
  const dossierId = searchParams.get("dossierId");
  if (!dossierId) {
    return Response.json({ error: "dossierId requis" }, { status: 400 });
  }

  // TROIS conditions, jamais le seul id. Le service role ignore la RLS : sans elles, l'outil de
  // nettoyage pourrait détruire un dossier PAYÉ, ou celui de quelqu'un d'autre.
  const { error } = await adminClient()
    .from("address_dossiers")
    .delete()
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .is("stripe_payment_intent_id", null);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
