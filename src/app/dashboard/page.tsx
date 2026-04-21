import Link from "next/link";
import {
  canAccessCompleteReport,
  canAccessDashboard,
  canAccessHouseholdFeatures,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";
import { DashboardExperience } from "@/app/dashboard/DashboardExperience";

export default async function DashboardPage() {
  const account = await getCurrentUserAccount();
  const hasDashboard = canAccessDashboard(account);
  const isInteractive = canAccessInteractiveDashboard(account);
  const hasFullReport = canAccessCompleteReport(account);

  return (
    <main className="account-shell">
      <div className="account-card account-card-wide">
        <p className="account-kicker">Dashboard</p>
        <h1 className="account-title">{getPlanLabel(account.plan)}</h1>
        <p className="account-copy">
          Cette page sert de premier garde-fou produit. Elle montre deja ce que
          le plan courant debloque reellement dans l&apos;app.
        </p>

        <div className="gating-grid">
          <section className="gating-card">
            <p className="gating-label">Rapport</p>
            <h2 className="gating-title">
              {hasFullReport ? "Complet" : "Partiel uniquement"}
            </h2>
            <p className="account-copy">
              {hasFullReport
                ? "Le compte a vocation a relire un rapport complet et a le retrouver dans le temps."
                : "Le compte gratuit conserve le rapport partiel, mais ne debloque pas encore le PDF complet."}
            </p>
          </section>

          <section className="gating-card">
            <p className="gating-label">Dashboard</p>
            <h2 className="gating-title">
              {!hasDashboard
                ? "Non inclus"
                : isInteractive
                  ? "Interactif"
                  : "Lecture seule"}
            </h2>
            <p className="account-copy">
              {!hasDashboard
                ? "Le plan gratuit n'accede pas au dashboard complet."
                : isInteractive
                  ? "Le plan permet les scenarios, horizons et details des facteurs."
                  : "Le one-shot ouvre un dashboard simple, sans scenarios ni details avancés."}
            </p>
          </section>

          <section className="gating-card">
            <p className="gating-label">Foyer</p>
            <h2 className="gating-title">
              {canAccessHouseholdFeatures(account) ? "Disponible" : "Non inclus"}
            </h2>
            <p className="account-copy">
              {canAccessHouseholdFeatures(account)
                ? "Le compte peut accueillir plusieurs membres et des arbitrages collectifs."
                : "Le mode foyer reste reserve au plan le plus haut."}
            </p>
          </section>
        </div>

        {!hasDashboard ? (
          <div className="gating-callout">
            <p className="gating-callout-title">Acces limite</p>
            <p className="account-copy">
              Pour ce plan, le compte sert surtout a sauvegarder le rapport
              partiel et a preparer la conversion vers le rapport complet ou un
              abonnement.
            </p>
          </div>
        ) : (
          <>
            <DashboardExperience
              interactive={isInteractive}
              householdMode={canAccessHouseholdFeatures(account)}
            />

            {!isInteractive ? (
              <div className="gating-callout">
                <p className="gating-callout-title">Limitation one-shot</p>
                <p className="account-copy">
                  Le dashboard est visible, mais sans switcher de scenarios,
                  sans detail des facteurs et sans pistes d&apos;action. C&apos;est
                  volontairement une lecture simple du rapport deja achete.
                </p>
              </div>
            ) : null}
          </>
        )}

        <div className="account-actions">
          <Link className="account-link" href="/rapport">
            Voir mon rapport
          </Link>
          <Link className="account-link" href="/compte">
            Retour au compte
          </Link>
          <Link className="account-link" href="/">
            Retour au site
          </Link>
        </div>
      </div>
    </main>
  );
}
