// Server Component : monte AskFuture en variante "inline" (intégrée au flux
// de la page) avec le même gating de plan que AskFutureMount :
//   - free          : pas de bloc rendu
//   - one_shot      : bloc rendu avec quota de 3 questions
//   - suivi / foyer : bloc rendu avec questions illimitées
//
// Différence avec AskFutureMount : le bloc est inline (pas position: fixed)
// et propose des suggestions cliquables transmises par le module appelant.

import { createClient } from "@/lib/supabase/server";
import { resolveReadableTerritory, TERRITORY_SELECT, loadTerritoryClaims } from "@/lib/active-territory";
import { quotaQuestions } from "@/lib/territory-claims";
import { AskFuture } from "./AskFuture";


type Props = {
  suggestions: string[];
  placeholder?: string;
};

export async function AskFutureInlineMount({ suggestions, placeholder }: Props) {
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

  const territory = await resolveReadableTerritory(supabase, user.id, profile);
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
      variant="inline"
      communeInsee={territory.inseeCode}
      communeName={territory.communeName ?? "votre commune"}
      questionsUsed={questionsUsed}
      questionsMax={questionsMax}
      suggestions={suggestions}
      placeholder={placeholder}
    />
  );
}
