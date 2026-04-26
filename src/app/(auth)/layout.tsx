import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-orb auth-shell-orb-primary" />
      <div className="auth-shell-orb auth-shell-orb-secondary" />
      <div className="auth-shell-orb auth-shell-orb-tertiary" />

      <div className="auth-shell-stage">
        <div className="auth-shell-brand">
          <Link className="auth-brandmark" href="/">
            futur<span>•</span>e
          </Link>
          <p className="auth-brand-kicker">Projection climatique personnelle</p>
        </div>

        <div className="auth-grid">
          <section className="auth-story">
            <p className="auth-story-label">Connexion sécurisée</p>
            <h2 className="auth-story-title">
              Une entrée simple, dans la même atmosphère que le rapport.
            </h2>
            <p className="auth-story-copy">
              futur•e n&apos;ouvre pas une simple session. Vous retrouvez un
              espace personnel où la commune, les tensions et le suivi restent
              lisibles, sobres et tracés.
            </p>
            <div className="auth-story-card">
              <p className="auth-story-card-label">Ce que vous retrouvez</p>
              <ul className="auth-story-list">
                <li>vos projections locales et leurs scénarios DRIAS</li>
                <li>un accès direct au compte, au dashboard et au rapport</li>
                <li>un accès classique par email et mot de passe</li>
              </ul>
            </div>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
