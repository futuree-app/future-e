import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signInWithPasswordAction } from "@/app/auth/actions";

function getSafeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const next = getSafeNext(query.next);

  return (
    <div className="auth-card auth-card-wide flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <GoogleSignInButton next={next} />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] font-mono text-ghost tracking-[0.08em] uppercase">ou</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>
      </div>
      <PasswordForm
        action={signInWithPasswordAction}
        title="Bon retour."
        subtitle="Entrez votre email et votre mot de passe pour retrouver votre espace."
        submitLabel="Se connecter"
        pendingLabel="Connexion…"
        passwordAutoComplete="current-password"
        forgotPasswordHref="/mot-de-passe-oublie"
        nextDestination={next}
      />
      <p className="text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
        Pas encore de compte ?{" "}
        <Link
          href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}
          className="text-accent hover:text-accent/80 transition-colors duration-200"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
