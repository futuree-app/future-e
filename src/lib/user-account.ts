import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeAccount, type UserAccount } from "@/lib/access";

export async function getCurrentSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireCurrentUser() {
  const { supabase, user } = await getCurrentSessionUser();

  if (!user) {
    redirect("/connexion");
  }

  return { supabase, user };
}

export async function getCurrentUserAccount(): Promise<UserAccount & { userId: string }> {
  const { supabase, user } = await requireCurrentUser();
  const { data: account } = await supabase
    .from("user_accounts")
    .select(
      "email, plan, status, report_access, dashboard_access, newsletter_enabled, notifications_enabled, household_mode_enabled",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const normalized = normalizeAccount(
    account
      ? {
          email: account.email,
          plan: account.plan,
          status: account.status,
          reportAccess: account.report_access,
          dashboardAccess: account.dashboard_access,
          newsletterEnabled: account.newsletter_enabled,
          notificationsEnabled: account.notifications_enabled,
          householdModeEnabled: account.household_mode_enabled,
        }
      : {
          email: user.email || null,
        },
  );

  return {
    ...normalized,
    userId: user.id,
  };
}
