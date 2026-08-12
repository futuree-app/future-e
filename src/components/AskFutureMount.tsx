// Server Component : charge la commune et le plan utilisateur, puis monte
// AskFuture uniquement pour les comptes payants.
// — free          : pas de widget
// — one_shot      : 3 questions par TERRITOIRE débloqué (cf. quotaQuestions), comptées dans
//                   ask_conversations
// — suivi / foyer : illimité

import { createClient } from "@/lib/supabase/server";
import { resolveReadableTerritory, TERRITORY_SELECT, loadTerritoryClaims } from "@/lib/active-territory";
import { quotaQuestions } from "@/lib/territory-claims";
import { contexteDeLecture } from "@/lib/server/contexte-de-lecture";
import { AskFuture } from "./AskFuture";


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
    // LE MÊME QUOTA QUE L'API, calculé par la même fonction (revue du 11/08/2026). Ce plafond était
    // écrit en dur à 3 : l'API en autorisait six ou neuf selon les territoires possédés, et l'écran
    // masquait quand même le formulaire au bout de trois questions. Un quota calculé à deux
    // endroits est un quota qui diverge, et c'est l'écran qui gagne, puisque c'est lui que le
    // lecteur croit.
    // ── UNE PANNE DE QUOTA NE FAIT PAS TOMBER LE RAPPORT (revue du 11/08/2026) ───────────────
    // `loadTerritoryClaims` LÈVE quand une des deux tables ne répond pas, et c'est la bonne
    // décision là où elle gouverne un droit : une liste vide obtenue par panne fermerait le
    // Territoire d'un acheteur légitime. Ici, elle ne gouverne qu'un compteur de questions, sur un
    // widget secondaire. La laisser remonter ferait disparaître le rapport entier, payé, pour un
    // incident sur son accessoire.
    //
    // Le widget se masque, l'incident se journalise. Personne ne perd ce qu'il a acheté.
    try {
      questionsMax = quotaQuestions(await loadTerritoryClaims(supabase, user.id));
    } catch (error) {
      console.error("[askfuture] quota indisponible, widget masqué", { userId: user.id, error });
      return null;
    }
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
