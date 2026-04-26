import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { signUpWithPasswordAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <div className="auth-card auth-card-wide">
      <Link className="auth-back" href="/">
        Retour à l&apos;accueil
      </Link>
      <PasswordForm
        action={signUpWithPasswordAction}
        title="Créer un compte"
        subtitle="Choisissez votre email et un mot de passe pour ouvrir votre espace futur•e."
        submitLabel="Créer mon compte"
        pendingLabel="Création..."
        passwordAutoComplete="new-password"
      />
      <p className="auth-alt">
        Vous avez déjà un compte ?{" "}
        <Link className="auth-link" href="/connexion">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
