import { AuthShell, PasswordForm } from "@/components/AuthForms";
import { signInWithPasswordAction } from "@/app/auth/actions";

export default function ConnexionPage() {
  return (
    <AuthShell
      alternateHref="/inscription"
      alternateLabel="Creer un compte"
      alternateText="Pas encore de compte ?"
    >
      <PasswordForm
        action={signInWithPasswordAction}
        title="Connexion"
        subtitle="Entrez votre email et votre mot de passe pour retrouver votre espace futur•e."
        submitLabel="Se connecter"
        pendingLabel="Connexion..."
        passwordAutoComplete="current-password"
      />
    </AuthShell>
  );
}
