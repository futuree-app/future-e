// Server Component : charge la commune et le plan utilisateur, puis monte
// AskFuture uniquement pour les comptes payants.
// — free          : pas de widget
// — one_shot      : 3 questions au total (comptées dans ask_conversations)
// — suivi / foyer : illimité

import { createClient } from "@/lib/supabase/server";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { contexteDeLecture } from "@/lib/server/contexte-de-lecture";
import { AskFuture } from "./AskFuture";

const ONE_SHOT_QUOTA = 3;

export async function AskFutureMount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: account }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(TERRITORY_SELECT)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_accounts")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // LE CONTEXTE DE LA PAGE PASSE AVANT CELUI DU PROFIL (revue du 11/08/2026).
  //
  // Ce composant vit dans le layout du compte : il lisait donc le dernier bien PERSISTÉ, pas celui
  // qu'on est en train de lire. Sur une ouverture directe, la page nantaise s'affichait sous « Une
  // question sur La Rochelle ? », et la question partait vers le mauvais territoire, `communeInsee`
  // étant envoyé tel quel à l'API.
  //
  // Le profil reste le repère PARTOUT AILLEURS : sur le hub, sur le Territoire, sur le compte, il
  // n'y a pas de bien en cours de lecture et le dernier connu est la bonne réponse.
  const lecture = await contexteDeLecture(supabase, user.id);
  const profilTerritory = await resolveReadableTerritory(supabase, user.id, profile);
  const territory = lecture
    ? { inseeCode: lecture.inseeCode, communeName: lecture.communeName }
    : profilTerritory;
  if (!territory.inseeCode) return null;

  const plan = account?.plan ?? "free";
  if (plan === "free") return null;

  let questionsUsed = 0;
  let questionsMax: number | null = null;

  if (plan === "one_shot") {
    questionsMax = ONE_SHOT_QUOTA;
    const { count } = await supabase
      .from("ask_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user");
    questionsUsed = count ?? 0;
  }

  return (
    <AskFuture
      communeInsee={territory.inseeCode}
      communeName={territory.communeName ?? "votre commune"}
      questionsUsed={questionsUsed}
      questionsMax={questionsMax}
    />
  );
}
