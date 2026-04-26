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
            <p className="auth-story-label">Votre espace personnel</p>
            <h2 className="auth-story-title">
              Ce que vous avez construit, toujours là.
            </h2>
            <p className="auth-story-copy">
              futur•e garde la mémoire de votre commune, de vos réponses et de
              vos projections. Vous retrouvez exactement là où vous en étiez,
              sans recommencer.
            </p>
            <div className="auth-story-card">
              <p className="auth-story-card-label">Vous retrouvez</p>
              <ul className="auth-story-list">
                <li>vos projections climatiques locales et leurs scénarios à 2050</li>
                <li>votre rapport personnalisé et les 6 modules d&apos;analyse</li>
                <li>le suivi de vos indicateurs au fil du temps</li>
              </ul>
            </div>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
