// FUT-120 : active uniquement une lecture autorisée. Le navigateur et le retour
// Stripe ne prouvent aucun droit ; le webhook reste responsable de leur attribution.
//
// Ne touche JAMAIS la résidence (home_insee_code / home_commune).
//
// FUT-119 : le nom du territoire actif est celui du référentiel. `body.commune` n'est plus lu : il laissait
// écrire `active_commune = "La Rochelle"` à côté de `active_insee_code = 30189` (Nîmes). Un code que le
// référentiel ne sait pas nommer n'est pas activé. L'ancienne garde de forme refusait aussi tout code corse.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { communeIdentifiee } from "@/lib/commerce/eligibilite-territoriale";
import { communeDuReferentiel, nomDuReferentiel } from "@/lib/commerce/referentiel-communes";
import { loadTerritoryClaims } from "@/lib/active-territory";
import { decideTerritoryAccess } from "@/lib/territory-claims";
import { communeParent } from "@/lib/plm";
import { normaliserCodeCommune } from "@/lib/commerce/eligibilite-territoriale";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { insee?: unknown; rapportComplet?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const territoire = communeIdentifiee(body?.insee, communeDuReferentiel, nomDuReferentiel);
  if (!territoire.ok) {
    return NextResponse.json({ error: "Code INSEE invalide.", code: territoire.code }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // La résidence autorise la lecture PARTIELLE gratuite, comme /rapport/residence.
  // Après achat, l'appelant exige au contraire le droit complet : il attendra le
  // webhook même si le territoire acheté est aussi la résidence.
  let retourResidence = false;
  try {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("home_insee_code")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }
    const home = normaliserCodeCommune(profile.home_insee_code);
    const residence = home !== null && communeParent(home) === communeParent(territoire.insee);
    retourResidence = body.rapportComplet !== true && residence;
    if ((body.rapportComplet === true || !residence)
      && !decideTerritoryAccess(await loadTerritoryClaims(supabase, user.id), territoire.insee)) {
      return NextResponse.json({ error: "Ce territoire n’est pas encore accessible sur votre compte.", code: "TERRITORY_ACCESS_DENIED" }, { status: 403 });
    }
  } catch (error) {
    console.error("[territoire/activer] lecture des droits", error);
    return NextResponse.json({ error: "Impossible de vérifier vos droits. Réessayez dans quelques instants." }, { status: 503 });
  }

  const { error } = await supabase
    .from("user_profiles")
    // Effacer l'overlay est le contrat de /rapport/residence. Il conserve aussi
    // le code LOCAL du domicile PLM, sans faire refuser un overlay non acquis.
    .update({ active_insee_code: retourResidence ? null : territoire.insee, active_commune: retourResidence ? null : territoire.nom })
    .eq("user_id", user.id);

  if (error) {
    console.error("[territoire/activer]", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
