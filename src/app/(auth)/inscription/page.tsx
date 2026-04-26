import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { signUpWithPasswordAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <div className="auth-card auth-card-wide flex flex-col gap-8">
      <PasswordForm
        action={signUpWithPasswordAction}
        title="Créer votre espace."
        subtitle="Choisissez un email et un mot de passe pour ouvrir votre espace futur•e."
        submitLabel="Créer mon compte"
        pendingLabel="Création…"
        passwordAutoComplete="new-password"
      />
      <p className="text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="text-accent hover:text-accent/80 transition-colors duration-200"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
