export type UserPlan = "free" | "one_shot" | "suivi" | "foyer";
export type UserStatus = "active" | "inactive" | "canceled";
export type ReportAccess = "partial" | "complete";
export type DashboardAccess = "none" | "read_only" | "interactive";

export type UserAccount = {
  email: string | null;
  plan: UserPlan;
  status: UserStatus;
  reportAccess: ReportAccess;
  dashboardAccess: DashboardAccess;
  newsletterEnabled: boolean;
  notificationsEnabled: boolean;
  householdModeEnabled: boolean;
};

type CapabilityMatrix = {
  label: string;
  reportAccess: ReportAccess;
  dashboardAccess: DashboardAccess;
  newsletterEnabled: boolean;
  notificationsEnabled: boolean;
  householdModeEnabled: boolean;
};

export const PLAN_MATRIX: Record<UserPlan, CapabilityMatrix> = {
  free: {
    label: "Compte gratuit",
    reportAccess: "partial",
    dashboardAccess: "none",
    newsletterEnabled: false,
    notificationsEnabled: true,
    householdModeEnabled: false,
  },
  one_shot: {
    label: "Rapport PDF one-shot",
    reportAccess: "complete",
    dashboardAccess: "read_only",
    newsletterEnabled: false,
    notificationsEnabled: false,
    householdModeEnabled: false,
  },
  suivi: {
    label: "Abonnement Suivi",
    reportAccess: "complete",
    dashboardAccess: "interactive",
    newsletterEnabled: true,
    notificationsEnabled: true,
    householdModeEnabled: false,
  },
  foyer: {
    label: "Abonnement Foyer",
    reportAccess: "complete",
    dashboardAccess: "interactive",
    newsletterEnabled: true,
    notificationsEnabled: true,
    householdModeEnabled: true,
  },
};

export function getPlanLabel(plan: string) {
  if (plan in PLAN_MATRIX) {
    return PLAN_MATRIX[plan as UserPlan].label;
  }

  return plan;
}

export function normalizeAccount(
  account:
    | Partial<UserAccount>
    | null
    | undefined,
): UserAccount {
  const rawPlan = account?.plan;
  const plan = rawPlan && rawPlan in PLAN_MATRIX ? (rawPlan as UserPlan) : "free";
  const defaults = PLAN_MATRIX[plan];

  return {
    email: account?.email || null,
    plan,
    status: (account?.status as UserStatus) || "active",
    reportAccess:
      (account?.reportAccess as ReportAccess) || defaults.reportAccess,
    dashboardAccess:
      (account?.dashboardAccess as DashboardAccess) || defaults.dashboardAccess,
    newsletterEnabled:
      account?.newsletterEnabled ?? defaults.newsletterEnabled,
    notificationsEnabled:
      account?.notificationsEnabled ?? defaults.notificationsEnabled,
    householdModeEnabled:
      account?.householdModeEnabled ?? defaults.householdModeEnabled,
  };
}

export function canAccessSavedReport(account: UserAccount) {
  return account.plan === "free" || account.reportAccess === "complete";
}

export function canAccessCompleteReport(account: UserAccount) {
  return account.reportAccess === "complete";
}

export function canAccessDashboard(account: UserAccount) {
  return account.dashboardAccess !== "none";
}

export function canAccessInteractiveDashboard(account: UserAccount) {
  return account.dashboardAccess === "interactive";
}

export function canAccessHouseholdFeatures(account: UserAccount) {
  return account.householdModeEnabled;
}
