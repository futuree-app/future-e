// ════════════════════════════════════════════════════════════════════════════
// Les capacités du COMPTE. Ce fichier ne répond JAMAIS « peut-il lire telle
// commune ? » : cette question est territoriale et vit dans active-territory.ts
// (`canAccessTerritory`), qui interroge grants et dossiers.
//
// TROIS NOTIONS RETIRÉES LE 30/07/2026, toutes pour la même raison : elles
// décrivaient une offre qui n'a jamais existé, et personne ne pouvait plus dire
// ce qu'elles ouvraient.
//
//   - `dashboardAccess` (none / read_only / interactive), parti avec la page
//     /dashboard, qui doublait /rapport sans rien trancher de plus ;
//   - `householdModeEnabled` et `canAccessHouseholdFeatures` : le mode foyer
//     n'a jamais été construit. La fonction n'avait qu'un appelant, la page
//     dashboard, et n'ouvrait rien. Aucun parcours ne le vendait ;
//   - les plans `suivi` et `foyer` : jamais vendus non plus. Aucune page de
//     prix ne les proposait, `checkout-products.ts` n'expose qu'un produit, et
//     le `productType: "suivi-foyer"` du webhook n'était atteignable par aucun
//     parcours. Arbitrage porteur : un éventuel abonnement sera B2B, donc un
//     autre modèle, pas la reprise de ces valeurs.
//
// Les colonnes correspondantes restent en base : aucune migration destructive,
// plus aucune lecture.
// ════════════════════════════════════════════════════════════════════════════

export type UserPlan = "free" | "one_shot";
export type UserStatus = "active" | "inactive" | "canceled";
export type ReportAccess = "partial" | "complete";

export type UserAccount = {
  email: string | null;
  plan: UserPlan;
  status: UserStatus;
  reportAccess: ReportAccess;
  newsletterEnabled: boolean;
  notificationsEnabled: boolean;
};

type CapabilityMatrix = {
  label: string;
  reportAccess: ReportAccess;
  newsletterEnabled: boolean;
  notificationsEnabled: boolean;
};

export const PLAN_MATRIX: Record<UserPlan, CapabilityMatrix> = {
  free: {
    label: "Compte gratuit",
    reportAccess: "partial",
    newsletterEnabled: false,
    notificationsEnabled: true,
  },
  one_shot: {
    label: "Rapport interactif",
    reportAccess: "complete",
    newsletterEnabled: false,
    notificationsEnabled: false,
  },
};

// LES COMPTES POSÉS AVANT LE RETRAIT PORTENT ENCORE CES VALEURS EN BASE, et sans
// cette table ils se dégraderaient silencieusement en « free » : un plan inconnu
// retombe sur `free`, dont le label est « Compte gratuit ». Les cinq comptes de
// test, dont celui du porteur (plan = suivi), afficheraient donc « gratuit » en
// portant un accès payant. Leur droit de LIRE ne bougerait pas, il vient de
// report_access et des grants, mais l'écran mentirait. Table de compatibilité,
// pas une offre : rien ne peut plus écrire ces valeurs.
const LEGACY_PLANS: Record<string, UserPlan> = {
  suivi: "one_shot",
  foyer: "one_shot",
};

function resolvePlan(raw: unknown): UserPlan {
  if (typeof raw !== "string") return "free";
  if (raw in PLAN_MATRIX) return raw as UserPlan;
  return LEGACY_PLANS[raw] ?? "free";
}

export function getPlanLabel(plan: string) {
  return PLAN_MATRIX[resolvePlan(plan)].label;
}

export function normalizeAccount(
  account:
    | Partial<UserAccount>
    | null
    | undefined,
): UserAccount {
  const plan = resolvePlan(account?.plan);
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
  };
}

export function canAccessSavedReport(account: UserAccount) {
  return account.plan === "free" || account.reportAccess === "complete";
}

export function canAccessCompleteReport(account: UserAccount) {
  return account.reportAccess === "complete";
}
