import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-orb auth-shell-orb-primary" />
      <div className="auth-shell-orb auth-shell-orb-secondary" />
      <div className="auth-shell-orb auth-shell-orb-tertiary" />

      <div className="auth-shell-stage">
        <div className="auth-shell-brand">
          <Link className="auth-brandmark" href="/" aria-label="futur•e, accueil">
            <Logo height={30} title={null} />
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
