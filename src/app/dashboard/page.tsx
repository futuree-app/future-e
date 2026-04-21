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
  const hasHousehold = canAccessHouseholdFeatures(account);

  return (
    <main className="account-shell">
      <div className="account-shell-orb account-shell-orb-primary" />
      <div className="account-shell-orb account-shell-orb-secondary" />

      <div className="account-stage">
        <section className="account-band account-hero-band">
          <div className="account-hero-copy">
            <p className="account-kicker">Dashboard</p>
            <h1 className="account-display-title">
              {!hasDashboard
                ? "Le dashboard reste un espace payant de consultation."
                : getPlanLabel(account.plan)}
            </h1>
            <p className="account-copy account-copy-lead">
              {!hasDashboard
                ? "Le compte gratuit sert d'abord a sauvegarder le rapport partiel et a maintenir une continuite de lecture. Le dashboard n'est pas tease comme s'il etait deja la."
                : "Le dashboard payant prolonge le rapport : comparaison de scenarios, lecture par module, details de facteurs et usage recurrent."}
            </p>
          </div>

          <aside className="account-summary-panel">
            <p className="gating-label">Disponibilite</p>
            <h2 className="account-panel-title">
              {!hasDashboard
                ? "Non inclus"
                : isInteractive
                  ? "Interactif"
                  : "Lecture seule"}
            </h2>
            <div className="account-summary-metrics">
              <div className="account-summary-metric">
                <span className="account-summary-value">{hasFullReport ? "Oui" : "Non"}</span>
                <span className="account-summary-label">rapport complet</span>
              </div>
              <div className="account-summary-metric">
                <span className="account-summary-value">{isInteractive ? "3" : "1"}</span>
                <span className="account-summary-label">scenario(s) lisibles</span>
              </div>
              <div className="account-summary-metric">
                <span className="account-summary-value">{hasHousehold ? "Oui" : "Non"}</span>
                <span className="account-summary-label">mode foyer</span>
              </div>
            </div>
            <p className="account-copy">
              One-shot ouvre un dashboard simple. Suivi et Foyer ouvrent la
              lecture interactive et recurrente.
            </p>
          </aside>
        </section>

        {!hasDashboard ? (
          <>
            <section className="account-band">
              <div className="account-band-head">
                <div>
                  <p className="gating-label">Ce que le dashboard ajoute</p>
                  <h2 className="account-section-title-xl">
                    Scenarios, horizons, details des facteurs et vraie lecture
                    recurrente.
                  </h2>
                </div>
                <p className="account-copy">
                  Le gratuit s&apos;arrete volontairement avant cet espace. Il
                  garde le rapport partiel sans brouiller la promesse du plan
                  payant.
                </p>
              </div>

              <div className="account-flow-grid">
                <article className="account-flow-card">
                  <span className="account-flow-step">One-shot</span>
                  <h3 className="account-flow-title">Dashboard simple</h3>
                  <p className="account-copy">
                    Les 6 modules apparaissent en lecture seule, sans scenarios,
                    sans detail des facteurs et sans pistes d&apos;action.
                  </p>
                </article>
                <article className="account-flow-card">
                  <span className="account-flow-step">Suivi</span>
                  <h3 className="account-flow-title">Dashboard complet</h3>
                  <p className="account-copy">
                    Scenarios, horizons, details de facteurs, rapport mis a
                    jour et newsletter mensuelle personnalisee.
                  </p>
                </article>
                <article className="account-flow-card">
                  <span className="account-flow-step">Foyer</span>
                  <h3 className="account-flow-title">Lecture collective</h3>
                  <p className="account-copy">
                    Matrice d&apos;exposition partagee, arbitrages collectifs et
                    espace commun jusqu&apos;a 6 membres.
                  </p>
                </article>
              </div>
            </section>

            <section className="account-band account-footer-band">
              <div>
                <p className="gating-label">Avant cela</p>
                <h2 className="account-section-title-xl">
                  Votre point d&apos;appui reste le compte gratuit et le rapport
                  partiel.
                </h2>
              </div>
              <div className="account-actions">
                <Link className="account-button" href="/compte">
                  Retour au compte
                </Link>
                <Link className="account-button account-button-secondary" href="/rapport">
                  Relire le rapport
                </Link>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="account-band">
              <DashboardExperience
                interactive={isInteractive}
                householdMode={hasHousehold}
              />
            </section>

            {!isInteractive ? (
              <section className="account-band account-footer-band">
                <div>
                  <p className="gating-label">Limitation one-shot</p>
                  <h2 className="account-section-title-xl">
                    Le dashboard est visible, mais volontairement simple.
                  </h2>
                  <p className="account-copy">
                    Pas de scenarios multiples, pas de detail des facteurs, pas
                    de pistes d&apos;action. C&apos;est une lecture ponctuelle du
                    rapport deja achete.
                  </p>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
