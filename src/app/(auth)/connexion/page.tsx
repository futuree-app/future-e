import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { signInWithPasswordAction } from "@/app/auth/actions";

export default function ConnexionPage() {
  return (
    <div className="auth-card auth-card-wide flex flex-col gap-8">
      <PasswordForm
        action={signInWithPasswordAction}
        title="Bon retour."
        subtitle="Entrez votre email et votre mot de passe pour retrouver votre espace."
        submitLabel="Se connecter"
        pendingLabel="Connexion…"
        passwordAutoComplete="current-password"
        forgotPasswordHref="/mot-de-passe-oublie"
      />
      <p className="text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="text-accent hover:text-accent/80 transition-colors duration-200"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
