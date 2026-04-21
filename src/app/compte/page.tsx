import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import {
  canAccessDashboard,
  canAccessHouseholdFeatures,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const hasDashboard = canAccessDashboard(account);
  const isInteractive = canAccessInteractiveDashboard(account);
  const hasHousehold = canAccessHouseholdFeatures(account);

  return (
    <main className="account-shell">
      <div className="account-card account-card-stage">
        <section className="account-hero">
          <p className="account-kicker">Compte gratuit</p>
          <h1 className="account-title">Votre rapport partiel est sauvegarde.</h1>
          <p className="account-copy account-copy-lead">
            Le compte n&apos;est pas une barriere d&apos;entree. C&apos;est une
            couche de continuite : vous retrouvez votre lecture, vous conservez
            votre rapport partiel, et futur•e peut vous prevenir si les donnees
            utiles evoluent.
          </p>
          <div className="account-chip-row">
            <span className="account-chip">{getPlanLabel(account.plan)}</span>
            <span className="account-chip">Statut {account.status}</span>
            <span className="account-chip">{account.email}</span>
          </div>
        </section>

        <div className="gating-grid">
          <section className="gating-card">
            <p className="gating-label">Ce qui est garde</p>
            <h2 className="gating-title">Rapport partiel sauvegarde indéfiniment</h2>
            <p className="account-copy">
              Vous conservez la synthese globale et le module Quartier deja
              ouverts dans votre lecture gratuite. Vous pouvez y revenir sans
              repasser par la landing.
            </p>
          </section>

          <section className="gating-card">
            <p className="gating-label">Partage</p>
            <h2 className="gating-title">Lien de partage permanent</h2>
            <p className="account-copy">
              Le rapport gratuit n&apos;est plus une lecture jetable dans le
              navigateur. Il peut devenir une base de conversation, puis une
              porte d&apos;entree vers une formule plus complete.
            </p>
          </section>

          <section className="gating-card">
            <p className="gating-label">Suivi leger</p>
            <h2 className="gating-title">Une notification si les donnees changent</h2>
            <p className="account-copy">
              Le compte gratuit n&apos;ouvre pas le suivi mensuel, mais il peut
              vous signaler une mise a jour utile des donnees liees a votre
              lecture actuelle.
            </p>
          </section>
        </div>

        <div className="account-section-grid">
          <section className="account-panel-card">
            <p className="gating-label">Votre espace aujourd&apos;hui</p>
            <h2 className="gating-title">Ce plan reste volontairement sobre</h2>
            <ul className="account-list">
              <li>Rapport complet PDF : non inclus</li>
              <li>
                Dashboard :
                {" "}
                {!hasDashboard
                  ? "non inclus"
                  : isInteractive
                    ? "complet et interactif"
                    : "lecture seule"}
              </li>
              <li>Newsletter mensuelle : {account.newsletterEnabled ? "incluse" : "non incluse"}</li>
              <li>Mode foyer : {hasHousehold ? "inclus" : "non inclus"}</li>
            </ul>
          </section>

          <section className="account-panel-card">
            <p className="gating-label">Suite logique</p>
            <h2 className="gating-title">Pour aller plus loin</h2>
            <p className="account-copy">
              Le gratuit sert a memoriser une premiere lecture. Le one-shot
              debloque le rapport complet PDF et le dashboard simple. Les plans
              Suivi et Foyer ouvrent ensuite les scenarios, les details des
              facteurs et le vrai usage recurrent.
            </p>
          </section>
        </div>

        <div className="account-actions">
          <Link className="account-button" href="/rapport">
            Relire mon rapport
          </Link>
          <Link className="account-button account-button-secondary" href="/dashboard">
            Voir ce que debloque le dashboard
          </Link>
          <Link className="account-link" href="/">
            Retour au site
          </Link>
          <form action={signOutAction}>
            <button className="account-link" type="submit">
              Se deconnecter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
