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
      <div className="account-card account-card-wide account-card-stage">
        <p className="account-kicker">Dashboard</p>
        <h1 className="account-title">
          {!hasDashboard ? "Le dashboard complet n&apos;est pas inclus dans votre formule." : getPlanLabel(account.plan)}
        </h1>
        <p className="account-copy account-copy-lead">
          {!hasDashboard
            ? "Le compte gratuit sert d'abord a sauvegarder le rapport partiel et a maintenir une continuite de lecture. Le dashboard reste un espace payant de consultation ponctuelle, pas une promesse partiellement tenue."
            : "Le dashboard payant prolonge le rapport : comparaison de scenarios, lecture par module, details de facteurs et usage recurrent."}
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
          <>
            <div className="gating-callout">
              <p className="gating-callout-title">Ce que le dashboard ajoute quand il s&apos;ouvre</p>
              <p className="account-copy">
                Le one-shot ouvre un dashboard simple en lecture seule. Les
                plans Suivi et Foyer debloquent ensuite les scenarios, les
                horizons, le detail de chaque facteur et les pistes d&apos;action.
              </p>
            </div>

            <div className="dashboard-module-grid">
              <section className="dashboard-module-card">
                <p className="gating-label">One-shot 14€</p>
                <h2 className="dashboard-module-title">Dashboard simple</h2>
                <p className="account-copy">
                  Les 6 modules apparaissent en lecture seule, sans switcher de
                  scenarios, sans detail de facteurs, sans pistes d&apos;action.
                </p>
                <div className="dashboard-module-footer">
                  <span className="dashboard-state">Lecture seule</span>
                </div>
              </section>

              <section className="dashboard-module-card">
                <p className="gating-label">Suivi 9€/mois</p>
                <h2 className="dashboard-module-title">Dashboard complet</h2>
                <p className="account-copy">
                  Switcher scenarios et horizons, relire chaque module, suivre
                  les mises a jour du rapport et recevoir la newsletter
                  mensuelle personnalisee.
                </p>
                <div className="dashboard-module-footer">
                  <span className="dashboard-state dashboard-state-live">
                    Interactif
                  </span>
                </div>
              </section>

              <section className="dashboard-module-card">
                <p className="gating-label">Foyer 15€/mois</p>
                <h2 className="dashboard-module-title">Lecture collective</h2>
                <p className="account-copy">
                  Matrice d&apos;exposition partagee, timeline des decisions
                  collectives, comparateur de villes et espace commun jusqu&apos;a
                  6 membres.
                </p>
                <div className="dashboard-module-footer">
                  <span className="dashboard-state dashboard-state-live">
                    Mode foyer
                  </span>
                </div>
              </section>
            </div>
          </>
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
          <Link className="account-button" href="/rapport">
            Relire mon rapport
          </Link>
          <Link className="account-button account-button-secondary" href="/compte">
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
