import { AuthShell, PasswordForm } from "@/components/AuthForms";
import { signUpWithPasswordAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <AuthShell
      alternateHref="/connexion"
      alternateLabel="Se connecter"
      alternateText="Vous avez deja un compte ?"
    >
      <PasswordForm
        action={signUpWithPasswordAction}
        title="Creer un compte"
        subtitle="Choisissez votre email et un mot de passe pour ouvrir votre espace futur•e."
        submitLabel="Creer mon compte"
        pendingLabel="Creation..."
        passwordAutoComplete="new-password"
      />
    </AuthShell>
  );
}
