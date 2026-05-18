import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signUpWithPasswordAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <div className="auth-card auth-card-wide flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <GoogleSignInButton />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] font-mono text-ghost tracking-[0.08em] uppercase">ou</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>
      </div>
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
