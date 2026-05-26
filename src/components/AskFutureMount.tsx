// Server Component : charge la commune utilisateur depuis user_profiles
// et monte le widget AskFuture uniquement si elle est renseignée.
// Pas de fallback INSEE en dur — on ne veut pas qu'un user sans commune
// voie des données d'une autre ville.

import { createClient } from "@/lib/supabase/server";
import { AskFuture } from "./AskFuture";

export async function AskFutureMount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_insee_code, home_commune")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.home_insee_code) return null;

  return (
    <AskFuture
      communeInsee={profile.home_insee_code}
      communeName={profile.home_commune ?? "votre commune"}
    />
  );
}
