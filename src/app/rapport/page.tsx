import Link from "next/link";
import { canAccessCompleteReport, getPlanLabel } from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount } from "@/lib/user-account";

const QUARTIER_MODULE = PRODUCT_MODULES.find((module) => module.id === "quartier")!;
const LOCKED_MODULES = PRODUCT_MODULES.filter((module) => module.id !== "quartier");

export default async function RapportPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);

  return (
    <main className="account-shell">
      <div className="account-shell-orb account-shell-orb-primary" />
      <div className="account-shell-orb account-shell-orb-secondary" />

      <div className="account-stage">
        <section className="account-band account-hero-band">
          <div className="account-hero-copy">
            <p className="account-kicker">Rapport</p>
            <h1 className="account-display-title">
              {fullReport
                ? "Votre rapport complet garde les 6 dimensions separees."
                : "Votre rapport partiel ouvre la lecture sans pretendre tout couvrir."}
            </h1>
            <p className="account-copy account-copy-lead">
              Plan actuel : <strong>{getPlanLabel(account.plan)}</strong>.
              {fullReport
                ? " Le rapport complet articule les 6 modules sans les compacter dans un score unique."
                : " L'offre gratuite garde un rapport court : 1 ville, 2 dimensions, une synthese globale et le module Quartier ouvert."}
            </p>
          </div>

          <aside className="account-summary-panel">
            <p className="gating-label">Structure</p>
            <h2 className="account-panel-title">
              {fullReport ? "Lecture integrale" : "Lecture d'amorce"}
            </h2>
            <div className="account-summary-metrics">
              <div className="account-summary-metric">
                <span className="account-summary-value">{fullReport ? "6" : "1"}</span>
                <span className="account-summary-label">module(s) ouvert(s)</span>
              </div>
              <div className="account-summary-metric">
                <span className="account-summary-value">{fullReport ? "PDF" : "Court"}</span>
                <span className="account-summary-label">format de lecture</span>
              </div>
              <div className="account-summary-metric">
                <span className="account-summary-value">{fullReport ? "Oui" : "Non"}</span>
                <span className="account-summary-label">telechargement</span>
              </div>
            </div>
            <p className="account-copy">
              futur•e garde les dimensions distinctes pour rendre les arbitrages
              lisibles, pas competitifs.
            </p>
          </aside>
        </section>

        {!fullReport ? (
          <>
            <section className="account-band account-columns-band">
              <div className="account-column">
                <p className="gating-label">Synthese globale</p>
                <h2 className="account-section-title-xl">
                  Une premiere mise en ordre de la situation.
                </h2>
                <p className="account-copy account-copy-lead">
                  Cette lecture gratuite ne cherche pas a tout montrer. Elle
                  vous donne un ancrage clair : ce qui se joue deja autour du
                  lieu de vie, ce que le territoire devient, et pourquoi cela
                  merite ou non d&apos;aller plus loin.
                </p>
                <ul className="account-list">
                  <li>Lecture courte et narrative, pas un dashboard de chiffres</li>
                  <li>Une seule ville de reference dans cette version</li>
                  <li>Le module Quartier sert d&apos;ouverture a la suite du rapport</li>
                </ul>
              </div>

              <div className="account-column">
                <div className="account-note-card account-note-card-tall">
                  <p className="gating-label">Module 01</p>
                  <h3 className="account-keep-title">{QUARTIER_MODULE.name}</h3>
                  <p className="account-copy">{QUARTIER_MODULE.summary}</p>
                  <div className="account-signal-strip">
                    {QUARTIER_MODULE.signals.map((signal) => (
                      <span key={signal} className="account-signal-pill">
                        {signal}
                      </span>
                    ))}
                  </div>
                  <p className="account-copy">
                    Le module ouvert du gratuit est aussi celui que vous pouvez
                    completer depuis votre compte pour enrichir la lecture.
                  </p>
                  <Link className="account-button" href="/compte#quartier">
                    Completer Quartier
                  </Link>
                </div>
              </div>
            </section>

            <section className="account-band">
              <div className="account-band-head">
                <div>
                  <p className="gating-label">Modules suivants</p>
                  <h2 className="account-section-title-xl">
                    Le reste du rapport reste visible, mais clairement ferme.
                  </h2>
                </div>
                <p className="account-copy">
                  Pour lire les 5 autres modules et telecharger votre rapport
                  PDF, choisissez votre formule.
                </p>
              </div>

              <div className="account-lock-grid">
                {LOCKED_MODULES.map((module) => (
                  <article key={module.id} className="account-lock-card">
                    <p className="gating-label">Module ferme</p>
                    <h3 className="account-keep-title">{module.name}</h3>
                    <p className="account-copy">{module.summary}</p>
                    <div className="account-signal-strip">
                      {module.signals.map((signal) => (
                        <span key={signal} className="account-signal-pill account-signal-pill-muted">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="account-band">
            <div className="account-band-head">
              <div>
                <p className="gating-label">Rapport complet</p>
                <h2 className="account-section-title-xl">
                  Les 6 dimensions sont ouvertes et restent distinctes.
                </h2>
              </div>
              <p className="account-copy">
                Le rapport complet ne compacte pas cette lecture dans un score
                unique. Il garde les dimensions separees pour rendre les
                arbitrages lisibles.
              </p>
            </div>

            <div className="account-lock-grid">
              {PRODUCT_MODULES.map((module) => (
                <article key={module.id} className="account-lock-card account-lock-card-open">
                  <p className="gating-label">Module ouvert</p>
                  <h3 className="account-keep-title">{module.name}</h3>
                  <p className="account-copy">{module.summary}</p>
                  <div className="account-signal-strip">
                    {module.signals.map((signal) => (
                      <span key={signal} className="account-signal-pill">
                        {signal}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="account-band account-footer-band">
          <div>
            <p className="gating-label">Navigation</p>
            <h2 className="account-section-title-xl">
              Revenez au compte pour completer Quartier ou ouvrez le dashboard
              selon votre formule.
            </h2>
          </div>

          <div className="account-actions">
            <Link className="account-button" href="/compte">
              Retour au compte
            </Link>
            <Link className="account-button account-button-secondary" href="/dashboard">
              Voir le dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
