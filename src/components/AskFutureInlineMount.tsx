// Server Component : monte AskFuture en variante "inline" (intégrée au flux
// de la page) avec le même gating de plan que AskFutureMount :
//   - free          : pas de bloc rendu
//   - one_shot      : bloc rendu avec quota de 3 questions
//   - suivi / foyer : bloc rendu avec questions illimitées
//
// Différence avec AskFutureMount : le bloc est inline (pas position: fixed)
// et propose des suggestions cliquables transmises par le module appelant.

import { createClient } from "@/lib/supabase/server";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { AskFuture } from "./AskFuture";

const ONE_SHOT_QUOTA = 3;

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
