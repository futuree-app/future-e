export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import LogementModule from "@/components/report/LogementModule";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { ModuleTracker } from "@/components/ModuleTracker";

export default async function RapportLogementPage() {
  const account = await getCurrentUserAccount();

  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(TERRITORY_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const territory = await resolveReadableTerritory(supabase, user.id, profile);

  return (
    <>
      <ModuleTracker moduleId="logement" commune={territory.communeName} inseeCode={territory.inseeCode} source="page" />
      <LogementModule defaultCommune={territory.communeName} />
    </>
  );
}
