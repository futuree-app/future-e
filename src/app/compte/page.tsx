import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import {
  canAccessCompleteReport,
  canAccessDashboard,
  canAccessHouseholdFeatures,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const capabilities = [
    canAccessCompleteReport(account)
      ? "Rapport complet disponible"
      : "Rapport partiel sauvegarde",
    canAccessDashboard(account)
      ? canAccessInteractiveDashboard(account)
        ? "Dashboard complet interactif"
        : "Dashboard simplifie en lecture seule"
      : "Pas de dashboard complet sur ce plan",
    account.newsletterEnabled
      ? "Newsletter mensuelle activee"
      : "Pas de newsletter sur ce plan",
    account.notificationsEnabled
      ? "Notifications produit disponibles"
      : "Notifications produit desactivees",
    canAccessHouseholdFeatures(account)
      ? "Mode foyer disponible"
      : "Mode foyer non inclus",
  ];

  return (
    <main className="account-shell">
      <div className="account-card">
        <p className="account-kicker">Compte</p>
        <h1 className="account-title">Session active</h1>
        <p className="account-copy">
          Vous etes connecte avec <strong>{account.email}</strong>.
        </p>
        <p className="account-copy">
          Plan actuel : <strong>{getPlanLabel(account.plan)}</strong>. Statut :{" "}
          <strong>{account.status}</strong>.
        </p>
        <ul className="account-list">
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="account-actions">
          <Link className="account-link" href="/rapport">
            Voir mon rapport
          </Link>
          <Link className="account-button account-button-secondary" href="/dashboard">
            Voir mon dashboard
          </Link>
          <Link className="account-link" href="/">
            Retour au site
          </Link>
          <form action={signOutAction}>
            <button className="account-button" type="submit">
              Se deconnecter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
