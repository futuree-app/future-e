// ════════════════════════════════════════════════════════════════════════════
// Les capacités du COMPTE. Ce fichier ne répond JAMAIS « peut-il lire telle
// commune ? » : cette question est territoriale et vit dans active-territory.ts
// (`canAccessTerritory`), qui interroge grants et dossiers.
//
// `dashboardAccess` a été retiré le 30/07/2026 avec la page /dashboard. Il
// portait trois valeurs (none / read_only / interactive) et deux fonctions,
// pour un écran qui doublait /rapport sans rien trancher de plus. La colonne
// `dashboard_access` reste en base : aucune migration destructive, plus aucune
// lecture.
// ════════════════════════════════════════════════════════════════════════════

export type UserPlan = "free" | "one_shot" | "suivi" | "foyer";
export type UserStatus = "active" | "inactive" | "canceled";
export type ReportAccess = "partial" | "complete";

export type UserAccount = {
  email: string | null;
  plan: UserPlan;
  status: UserStatus;
  reportAccess: ReportAccess;
  newsletterEnabled: boolean;
  notificationsEnabled: boolean;
  householdModeEnabled: boolean;
};

type CapabilityMatrix = {
  label: string;
  reportAccess: ReportAccess;
  newsletterEnabled: boolean;
  notificationsEnabled: boolean;
  householdModeEnabled: boolean;
};

export const PLAN_MATRIX: Record<UserPlan, CapabilityMatrix> = {
  free: {
    label: "Compte gratuit",
    reportAccess: "partial",
    newsletterEnabled: false,
    notificationsEnabled: true,
    householdModeEnabled: false,
  },
  one_shot: {
    label: "Rapport interactif",
    reportAccess: "complete",
    newsletterEnabled: false,
    notificationsEnabled: false,
    householdModeEnabled: false,
  },
  suivi: {
    label: "Abonnement suivi",
    reportAccess: "complete",
    newsletterEnabled: true,
    notificationsEnabled: true,
    householdModeEnabled: false,
  },
  foyer: {
    label: "Abonnement Foyer",
    reportAccess: "complete",
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

export function canAccessHouseholdFeatures(account: UserAccount) {
  return account.householdModeEnabled;
}
