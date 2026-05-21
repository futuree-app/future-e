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

const METRICS = [
  { val: "6", label: "modules" },
  { val: "3", label: "scénarios" },
  { val: "∞", label: "accès" },
];

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const next = getSafeNext(query.next);

  return (
    <>
      <section className="auth-story">
        <p className="auth-story-label">Bon retour</p>
        <h2 className="auth-story-title">Votre rapport vous attend.</h2>
        <p className="auth-story-copy">
          Vos projections, vos réponses et votre commune sont exactement là où
          vous les avez laissés.
        </p>
        <div className="auth-story-card">
          <p className="auth-story-card-label">Votre espace</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                style={{
                  padding: "14px 12px",
                  textAlign: "center",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 28,
                    color: "var(--orange)",
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {m.val}
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--fg-3)",
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
    </>
  );
}
