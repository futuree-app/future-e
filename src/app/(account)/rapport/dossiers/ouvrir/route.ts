// ════════════════════════════════════════════════════════════════════════════
// Ouvrir un dossier POSE son territoire de lecture.
//
// Le droit territorial acceptait déjà un dossier comme fondement (`territory-claims.ts`,
// `kind: "dossier"`), mais rien ne déplaçait le territoire LU. Un compte qui réside à La Rochelle
// et possède un dossier à Nantes possédait Nantes en entier, et `/rapport` lui servait le partiel
// de La Rochelle : `active_insee_code` restait nul, donc `resolveActiveTerritory` retombait sur la
// résidence. Le webhook Stripe pose bien le territoire actif, mais UNE FOIS, au paiement, et
// seulement si le paiement portait un INSEE. Après ça, la seule route existante était
// `/rapport/residence`, qui désactive. Rien ne rouvrait.
//
// POURQUOI UN GESTE EXPLICITE, ET PAS UN REPLI AUTOMATIQUE dans `/rapport`. Le clic sur un bien
// est une désignation : le lecteur a dit lequel. Faire deviner à `/rapport` « la résidence
// n'ouvre rien, donc lis Nantes » changerait la commune de l'écran sans que personne l'ait
// demandé, exactement ce que `pickSoleDossier` refuse de faire une ligne plus loin.
//
// GET à effet de bord : c'est le patron de `rapport/residence/route.ts`, son symétrique. Les liens
// qui pointent ici portent `prefetch={false}`, sinon Next activerait le territoire au seul survol.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { communeParent } from "@/lib/plm";

export const runtime = "nodejs";

// La destination vient de l'URL : liste blanche, jamais une redirection construite depuis le
// paramètre. `territoire` mène au rapport de commune, qui est justement ce que la bascule ouvre.
const DESTINATIONS: Record<string, (dossierId: string) => string> = {
  logement: (id) => `/rapport/logement?dossierId=${encodeURIComponent(id)}`,
  autour: (id) => `/rapport/autour?dossierId=${encodeURIComponent(id)}`,
  territoire: () => "/rapport",
};

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireCurrentUser();

  const url = new URL(request.url);
  const dossierId = url.searchParams.get("id") ?? "";
  const buildHref = DESTINATIONS[url.searchParams.get("vers") ?? ""];

  const retour = NextResponse.redirect(new URL("/rapport/dossiers", request.url));
  if (!buildHref || !dossierId) return retour;

  // La lecture est filtrée par user_id ET par la RLS : un id volé ne désigne rien. `getDossier`
  // LÈVE sur panne au lieu de rendre null, donc un incident base ne se lit pas ici « ce dossier
  // ne vous appartient pas ».
  const dossier = await getDossier(supabase, user.id, dossierId);
  if (!dossier) return retour;

  // Grain COMMUNE. `dossier.insee` est le code LOCAL de l'adresse, donc l'arrondissement pour PLM :
  // poser 75101 en territoire actif ferait lire « Paris 1er » à tous les écrans de commune.
  const { error } = await supabase
    .from("user_profiles")
    .update({ active_insee_code: communeParent(dossier.insee), active_commune: dossier.city })
    .eq("user_id", user.id);

  // L'échec de la bascule ne doit pas retenir le lecteur : Logement et Autour ne dépendent que du
  // dossier, ils s'ouvriront. Seul le territoire restera sur la résidence, et le bandeau le dira.
  if (error) console.error("[dossiers/ouvrir]", error);

  return NextResponse.redirect(new URL(buildHref(dossier.id), request.url));
}
