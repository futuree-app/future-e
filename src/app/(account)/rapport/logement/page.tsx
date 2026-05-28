export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import LogementModule from "@/components/report/LogementModule";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { ModuleTracker } from "@/components/ModuleTracker";

export default async function RapportLogementPage() {
  const account = await getCurrentUserAccount();

  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_commune, home_insee_code")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <ModuleTracker moduleId="logement" commune={profile?.home_commune ?? null} inseeCode={profile?.home_insee_code ?? null} source="page" />
      <LogementModule defaultCommune={profile?.home_commune ?? null} />
    </>
  );
}
