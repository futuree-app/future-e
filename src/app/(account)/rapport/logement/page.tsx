export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import LogementModule from "@/components/report/LogementModule";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";

export default async function RapportLogementPage() {
  const account = await getCurrentUserAccount();

  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_commune")
    .eq("user_id", user.id)
    .maybeSingle();

  return <LogementModule defaultCommune={profile?.home_commune ?? null} />;
}
