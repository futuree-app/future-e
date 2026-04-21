import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { QuartierWorkbook } from "@/app/compte/QuartierWorkbook";
import {
  canAccessDashboard,
  canAccessHouseholdFeatures,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount } from "@/lib/user-account";

const QUARTIER_MODULE = PRODUCT_MODULES.find((module) => module.id === "quartier")!;
const LOCKED_MODULES = PRODUCT_MODULES.filter((module) => module.id !== "quartier");

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const hasDashboard = canAccessDashboard(account);
  const isInteractive = canAccessInteractiveDashboard(account);
  const hasHousehold = canAccessHouseholdFeatures(account);

  return (
    <main className="account-shell">
      <div className="account-shell-orb account-shell-orb-primary" />
      <div className="account-shell-orb account-shell-orb-secondary" />
      <div className="account-shell-orb account-shell-orb-tertiary" />

      <div className="account-stage">
        <section className="account-band account-hero-band">
          <div className="account-hero-copy">
            <p className="account-kicker">Compte gratuit</p>
            <h1 className="account-display-title">
              Votre rapport partiel ne disparait plus apres la premiere lecture.
            </h1>
            <p className="account-copy account-copy-lead">
              Le compte gratuit garde le fil. Vous retrouvez un rapport court,
              sauvegarde indefiniment, avec <strong>1 ville</strong>,{" "}
              <strong>2 dimensions</strong>, une synthese globale et un module{" "}
              <strong>{QUARTIER_MODULE.name}</strong> a completer pour donner
              plus de relief a votre lecture.
            </p>

            <div className="account-chip-row">
              <span className="account-chip">{getPlanLabel(account.plan)}</span>
              <span className="account-chip">Statut {account.status}</span>
              <span className="account-chip">{account.email}</span>
            </div>

            <div className="account-inline-actions">
              <Link className="account-button" href="/rapport">
                Relire mon rapport
              </Link>
              <Link className="account-button account-button-secondary" href="#quartier">
                Completer Quartier
              </Link>
            </div>
          </div>

          <aside className="account-summary-panel">
            <p className="gating-label">Dans votre formule</p>
            <h2 className="account-panel-title">
              Un espace de continuite, pas un faux dashboard.
            </h2>
            <div className="account-summary-metrics">
              <div className="account-summary-metric">
                <span className="account-summary-value">1</span>
                <span className="account-summary-label">ville de reference</span>
              </div>
              <div className="account-summary-metric">
                <span className="account-summary-value">2</span>
                <span className="account-summary-label">dimensions ouvertes</span>
              </div>
              <div className="account-summary-metric">
                <span className="account-summary-value">72h+</span>
                <span className="account-summary-label">lecture retrouvable</span>
              </div>
            </div>
            <p className="account-copy">
              Le compte n&apos;est pas une barriere d&apos;entree. Il sauvegarde
              votre rapport partiel, fournit un lien de partage permanent et
              permet une notification si les donnees changent.
            </p>
          </aside>
        </section>

        <section className="account-band">
          <div className="account-band-head">
            <div>
              <p className="gating-label">Logique du gratuit</p>
              <h2 className="account-section-title-xl">
                Une progression simple, lisible, sans effet tunnel.
              </h2>
            </div>
            <p className="account-copy">
              L&apos;objectif n&apos;est pas de simuler tout le produit. Le compte
              gratuit vous laisse avancer proprement : lire, situer, partager,
              puis decider si la suite merite d&apos;etre debloquee.
            </p>
          </div>

          <div className="account-flow-grid">
            <article className="account-flow-card">
              <span className="account-flow-step">01</span>
              <h3 className="account-flow-title">Relire la synthese globale</h3>
              <p className="account-copy">
                Une premiere mise en ordre des tensions qui structurent deja
                votre territoire.
              </p>
            </article>
            <article className="account-flow-card">
              <span className="account-flow-step">02</span>
              <h3 className="account-flow-title">Completer Quartier</h3>
              <p className="account-copy">
                Ajouter vos repères de terrain pour rendre la lecture plus
                personnelle et plus situee.
              </p>
            </article>
            <article className="account-flow-card">
              <span className="account-flow-step">03</span>
              <h3 className="account-flow-title">Partager si besoin</h3>
              <p className="account-copy">
                Garder un lien permanent vers cette premiere lecture et en faire
                une base de conversation.
              </p>
            </article>
            <article className="account-flow-card">
              <span className="account-flow-step">04</span>
              <h3 className="account-flow-title">Decider de la suite</h3>
              <p className="account-copy">
                Rapport complet PDF, dashboard simple ou suivi recurrent selon
                l&apos;intensite du besoin.
              </p>
            </article>
          </div>
        </section>

        <section className="account-band account-module-band" id="quartier">
          <div className="account-module-copy">
            <p className="gating-label">Module ouvert</p>
            <h2 className="account-section-title-xl">
              Quartier ouvre la lecture par le territoire.
            </h2>
            <p className="account-copy account-copy-lead">
              C&apos;est le bon premier module pour un compte gratuit : il pose
              la question la plus immediate du produit,{" "}
              <strong>qu&apos;est-ce que ce territoire devient autour de vous ?</strong>
            </p>

            <div className="account-signal-strip">
              {QUARTIER_MODULE.signals.map((signal) => (
                <span key={signal} className="account-signal-pill">
                  {signal}
                </span>
              ))}
            </div>

            <div className="account-module-notes">
              <article className="account-note-card">
                <p className="gating-label">Pourquoi ici</p>
                <p className="account-copy">
                  Le territoire concentre deja chaleur, eau, cadre de vie et
                  capacite d&apos;adaptation. C&apos;est la porte d&apos;entree la
                  plus claire avant Logement, Sante ou Projets.
                </p>
              </article>
              <article className="account-note-card">
                <p className="gating-label">Ce que vous ajoutez</p>
                <p className="account-copy">
                  Vos repères de terrain : comment l&apos;ete se vit, ce qui a
                  deja change, ce que vous surveillez en premier.
                </p>
              </article>
            </div>
          </div>

          <QuartierWorkbook userKey={account.userId} />
        </section>

        <section className="account-band account-columns-band">
          <div className="account-column">
            <div className="account-band-head account-band-head-tight">
              <div>
                <p className="gating-label">Ce que votre compte gratuit garde</p>
                <h2 className="account-section-title-xl">
                  Une base propre pour revenir, partager, poursuivre.
                </h2>
              </div>
            </div>

            <div className="account-keep-grid">
              <article className="account-keep-card">
                <h3 className="account-keep-title">
                  Rapport partiel sauvegarde indefiniment
                </h3>
                <p className="account-copy">
                  Vous retrouvez la synthese globale et le module Quartier sans
                  repasser par la landing.
                </p>
              </article>
              <article className="account-keep-card">
                <h3 className="account-keep-title">Lien de partage permanent</h3>
                <p className="account-copy">
                  La lecture gratuite peut devenir un support de discussion
                  plutot qu&apos;une simple page ephemere.
                </p>
              </article>
              <article className="account-keep-card">
                <h3 className="account-keep-title">
                  Une notification si les donnees changent
                </h3>
                <p className="account-copy">
                  Le compte gratuit n&apos;ouvre pas le suivi mensuel, mais il
                  peut signaler une mise a jour utile de votre lecture.
                </p>
              </article>
            </div>
          </div>

          <div className="account-column">
            <div className="account-band-head account-band-head-tight">
              <div>
                <p className="gating-label">Ce qui reste verrouille</p>
                <h2 className="account-section-title-xl">
                  La suite du rapport reste nette, pas brouillee.
                </h2>
              </div>
              <p className="account-copy">
                Pour lire les 5 autres modules et telecharger votre rapport PDF,
                choisissez votre formule.
              </p>
            </div>

            <div className="account-lock-grid">
              {LOCKED_MODULES.map((module) => (
                <article key={module.id} className="account-lock-card">
                  <p className="gating-label">Module ferme</p>
                  <h3 className="account-keep-title">{module.name}</h3>
                  <p className="account-copy">{module.summary}</p>
                </article>
              ))}
            </div>

            <div className="account-plan-callout">
              <p className="account-copy">
                Dashboard :
                {" "}
                {!hasDashboard
                  ? "non inclus"
                  : isInteractive
                    ? "complet et interactif"
                    : "ouvert en lecture seule"}
                . Newsletter mensuelle :
                {" "}
                {account.newsletterEnabled ? "incluse" : "non incluse"}
                . Mode foyer :
                {" "}
                {hasHousehold ? "inclus" : "non inclus"}.
              </p>
            </div>
          </div>
        </section>

        <section className="account-band account-footer-band">
          <div>
            <p className="gating-label">Suite logique</p>
            <h2 className="account-section-title-xl">
              Vous avez maintenant une premiere assise. La suite depend de votre
              niveau d&apos;exigence.
            </h2>
          </div>

          <div className="account-actions">
            <Link className="account-button" href="/rapport">
              Ouvrir le rapport
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
        </section>
      </div>
    </main>
  );
}
