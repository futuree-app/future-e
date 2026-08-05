import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signUpWithPasswordAction } from "@/app/auth/actions";

function getSafeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const next = getSafeNext(query.next);

  return (
    <>
      <section className="auth-story">
        <p className="auth-story-label">Votre lecture</p>
        <h2 className="auth-story-title">
          Ce que ce lieu fait à votre vie.
        </h2>
        <p className="auth-story-copy">
          Les données climatiques de votre commune sont publiques. Ce qui
          n&apos;existe pas encore, c&apos;est la lecture depuis votre
          situation. futur•e la construit : vos réponses croisées avec le
          territoire, échelle par échelle.
        </p>
        <div className="auth-story-card">
          <p className="auth-story-card-label">Ce que vous construisez</p>
          <ul className="auth-story-list">
            {/* Les deux dernières lignes ont été réécrites le 04/08/2026. « Trois scénarios » ne
                disait pas de quoi, et le référentiel TRACC veut que l'équivalence France soit
                portée partout où le réchauffement est cité. « Un rapport qui s'affine » décrivait
                un texte ; ce que le compte garde est un dossier qu'on rouvre. */}
            <li>Trois échelles de lecture : la commune, le secteur autour de votre adresse, le logement</li>
            <li>Les projections de votre commune à trois horizons de réchauffement : +2, +2,7 et +4 °C en France</li>
            <li>Un dossier que vous conservez, rouvrez et complétez au fil de votre recherche</li>
          </ul>
        </div>
      </section>

      <div className="auth-card auth-card-wide flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <GoogleSignInButton next={next} />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--bg-elev-3)]" />
            <span className="text-[11px] font-mono text-ghost tracking-[0.08em] uppercase">ou</span>
            <div className="h-px flex-1 bg-[var(--bg-elev-3)]" />
          </div>
        </div>
        <PasswordForm
          action={signUpWithPasswordAction}
          title="Créer votre espace."
          subtitle="Choisissez un email et un mot de passe pour ouvrir votre espace futur•e."
          submitLabel="Créer mon compte"
          pendingLabel="Création…"
          passwordAutoComplete="new-password"
          nextDestination={next}
          askFullName
        />
        <p className="text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
          Vous avez déjà un compte ?{" "}
          <Link
            href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"}
            className="text-accent hover:text-accent/80 transition-colors duration-200"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </>
  );
}
