import Link from "next/link";
import {
  canAccessCompleteReport,
  getPlanLabel,
} from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";
import { PRODUCT_MODULES } from "@/lib/product";

export default async function RapportPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);
  const visibleModules = fullReport ? PRODUCT_MODULES : PRODUCT_MODULES.slice(0, 1);

  return (
    <main className="account-shell">
      <div className="account-card account-card-wide">
        <p className="account-kicker">Rapport</p>
        <h1 className="account-title">
          {fullReport ? "Rapport complet" : "Rapport partiel"}
        </h1>
        <p className="account-copy">
          Plan actuel : <strong>{getPlanLabel(account.plan)}</strong>.
          {fullReport
            ? " Le rapport peut couvrir les 6 dimensions du produit."
            : " Le compte gratuit conserve un apercu plus court, avec une seule dimension ouverte."}
        </p>

        <div className="gating-grid">
          {visibleModules.map((module, index) => (
            <section key={module.id} className="gating-card">
              <p className="gating-label">
                module {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="gating-title">{module.name}</h2>
              <p className="account-copy">{module.summary}</p>
              <ul className="account-list">
                {module.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {!fullReport ? (
          <div className="gating-callout">
            <p className="gating-callout-title">Acces limite sur ce plan</p>
            <p className="account-copy">
              Le rapport gratuit montre une synthese globale et un seul module
              complet. Pour lire les 5 autres modules et telecharger le PDF,
              il faut passer au one-shot ou a un abonnement.
            </p>
          </div>
        ) : null}

        <div className="account-actions">
          <Link className="account-link" href="/dashboard">
            Voir le dashboard
          </Link>
          <Link className="account-link" href="/compte">
            Retour au compte
          </Link>
        </div>
      </div>
    </main>
  );
}
