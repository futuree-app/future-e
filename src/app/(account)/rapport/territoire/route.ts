// ════════════════════════════════════════════════════════════════════════════
// Ouvrir un territoire POSSÉDÉ, quand il n'a aucun bien pour le porter.
//
// LE TROU QUE CETTE ROUTE FERME (13/08/2026). Un territoire acheté seul (14 €) crée un
// `report_grant` et rien d'autre : aucune ligne dans `address_dossiers`. Or les deux seuls chemins
// qui reposaient le territoire de lecture partaient d'un DOSSIER (`/rapport/dossiers/ouvrir`) ou
// remettaient la résidence (`/rapport/residence`). Passé le jour de l'achat, où le webhook pose le
// territoire actif une fois, l'acheteur n'avait plus aucun moyen de revenir sur la commune qu'il
// avait payée : elle n'apparaissait ni dans « Mes biens », qui liste des biens, ni dans le compte
// des communes ouvertes du hub, qui ne comptait que des dossiers.
//
// LE DROIT EST VÉRIFIÉ, ET C'EST TOUT L'ENJEU d'une route qui écrit depuis un paramètre d'URL :
// `decideTerritoryAccess` tranche sur les claims réels du compte. Sans lui, n'importe qui poserait
// n'importe quelle commune en territoire actif et lirait le rapport complet d'un lieu jamais acheté.
//
// GET à effet de bord : c'est le patron de `rapport/residence/route.ts` et de
// `rapport/dossiers/ouvrir/route.ts`, ses deux symétriques. Les liens qui pointent ici sont des <a>
// natifs : un <Link> vers une Route Handler attend un payload RSC, reçoit une redirection HTML et
// abandonne sans naviguer.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/user-account";
import { loadTerritoryClaims } from "@/lib/active-territory";
import { decideTerritoryAccess } from "@/lib/territory-claims";
import { communeParent } from "@/lib/plm";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireCurrentUser();

  const url = new URL(request.url);
  const demande = (url.searchParams.get("insee") ?? "").trim().toUpperCase();
  const nom = (url.searchParams.get("nom") ?? "").trim().slice(0, 120);
  const retour = NextResponse.redirect(new URL("/rapport/dossiers", request.url));

  // Un vrai code INSEE, jamais un code postal : le piège est connu et il échoue en silence côté
  // sources (ADEME, DRIAS, Hub'Eau) plutôt que de lever.
  if (!/^[0-9AB][0-9]{4}$/i.test(demande)) return retour;

  const claims = await loadTerritoryClaims(supabase, user.id);
  if (!decideTerritoryAccess(claims, demande)) return retour;

  // Le territoire actif est au grain COMMUNE : poser un arrondissement ferait lire « Paris 18e » à
  // tous les écrans de commune. Le code local, lui, reste dans le grant, où `codeDeLectureLocal`
  // ira le chercher pour LIRE les faits.
  const { error } = await supabase
    .from("user_profiles")
    .update({
      active_insee_code: communeParent(demande),
      active_commune: nom || null,
      // LE BIEN ACTIF EST OUBLIÉ, sans quoi le hub rouvrirait un bien d'une autre commune. Le
      // territoire demandé n'en a pas : c'est la définition même de ce parcours.
      active_dossier_id: null,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("[rapport/territoire] bascule échouée", { userId: user.id, insee: demande, error });
    return retour;
  }

  return NextResponse.redirect(new URL("/rapport", request.url));
}
