import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { signInWithPasswordAction } from "@/app/auth/actions";

export default function ConnexionPage() {
  return (
    <div className="auth-card auth-card-wide">
      <Link className="auth-back" href="/">
        Retour à l&apos;accueil
      </Link>
      <PasswordForm
        action={signInWithPasswordAction}
        title="Connexion"
        subtitle="Entrez votre email et votre mot de passe pour retrouver votre espace futur•e."
        submitLabel="Se connecter"
        pendingLabel="Connexion..."
        passwordAutoComplete="current-password"
      />
      <p className="auth-alt">
        Pas encore de compte ?{" "}
        <Link className="auth-link" href="/inscription">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
