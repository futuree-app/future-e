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
          {children}
        </div>
      </div>
    </div>
  );
}
