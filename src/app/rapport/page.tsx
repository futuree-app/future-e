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
  const quartierModule = PRODUCT_MODULES.find((module) => module.id === "quartier")!;
  const lockedModules = PRODUCT_MODULES.filter((module) => module.id !== "quartier");
  const visibleModules = fullReport ? PRODUCT_MODULES : [quartierModule];

  return (
    <main className="account-shell">
      <div className="account-card account-card-wide account-card-stage">
        <p className="account-kicker">Rapport</p>
        <h1 className="account-title">
          {fullReport ? "Rapport complet" : "Rapport partiel"}
        </h1>
        <p className="account-copy account-copy-lead">
          Plan actuel : <strong>{getPlanLabel(account.plan)}</strong>.
          {fullReport
            ? " Le rapport peut couvrir les 6 dimensions du produit."
            : " L'offre gratuite conserve un rapport court : une synthese globale, 1 ville et le module Quartier ouvert."}
        </p>

        {!fullReport ? (
          <section className="account-panel-card account-panel-featured">
            <p className="gating-label">Synthese globale</p>
            <h2 className="gating-title">Premiere lecture de votre situation</h2>
            <p className="account-copy">
              Ce rapport gratuit ne cherche pas a tout montrer. Il vous donne
              un ancrage clair : ce qui se joue deja autour du lieu de vie, ce
              que le territoire devient, et pourquoi cela merite d&apos;aller plus
              loin si votre situation l&apos;exige.
            </p>
            <ul className="account-list">
              <li>Lecture courte et narrative, pas un dashboard de chiffres</li>
              <li>Une seule ville de reference dans cette version</li>
              <li>Le module Quartier sert d&apos;ouverture a la suite du rapport</li>
            </ul>
          </section>
        ) : null}

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
          <>
            <div className="gating-callout">
              <p className="gating-callout-title">Pour lire les 5 autres modules et telecharger votre rapport PDF, choisissez votre formule.</p>
              <p className="account-copy">
                Le mur n&apos;interrompt pas votre lecture brutalement. Il montre
                simplement ce que le rapport complet ajoute : Logement, Metier,
                Sante, Mobilite et Projets, avec une lecture plus complete des
                arbitrages de vie.
              </p>
            </div>

            <div className="dashboard-module-grid">
              {lockedModules.map((module) => (
                <section key={module.id} className="dashboard-module-card">
                  <p className="gating-label">Module verrouille</p>
                  <h2 className="dashboard-module-title">{module.name}</h2>
                  <p className="account-copy">{module.summary}</p>
                  <div className="dashboard-module-footer">
                    <span className="dashboard-state">Rapport complet requis</span>
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : null}

        {fullReport ? (
          <div className="gating-callout">
            <p className="gating-callout-title">Les 6 dimensions restent distinctes</p>
            <p className="account-copy">
              futur•e ne compacte pas cette lecture dans un score unique. Le
              rapport complet garde les dimensions separees pour rendre les
              arbitrages lisibles, pas competitifs.
            </p>
          </div>
        ) : null}

        <div className="account-actions">
          <Link className="account-button" href="/compte">
            Retour au compte
          </Link>
          <Link className="account-button account-button-secondary" href="/dashboard">
            Voir le dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
