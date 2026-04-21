"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EMPTY_STATE, type AuthActionState } from "@/app/auth/shared";

type ActionFn = (
  state: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function AuthFeedback({ state }: { state: AuthActionState }) {
  return (
    <div aria-live="polite" className="auth-feedback">
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.message ? <p className="auth-message">{state.message}</p> : null}
    </div>
  );
}

export function MagicLinkForm({
  action,
  title,
  subtitle,
  submitLabel,
}: {
  action: ActionFn;
  title: string;
  subtitle: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_STATE);

  return (
    <section className="auth-panel">
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
      <form className="auth-form" action={formAction}>
        <label className="auth-label" htmlFor="magic-email">
          Email
        </label>
        <input
          className="auth-input"
          id="magic-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        <AuthFeedback state={state} />

        <SubmitButton label={submitLabel} pendingLabel="Envoi du lien..." />
      </form>
    </section>
  );
}

export function AuthShell({
  children,
  alternateHref,
  alternateLabel,
  alternateText,
}: {
  children: React.ReactNode;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-orb auth-shell-orb-primary" />
      <div className="auth-shell-orb auth-shell-orb-secondary" />
      <div className="auth-shell-orb auth-shell-orb-tertiary" />

      <div className="auth-shell-stage">
        <div className="auth-shell-brand">
          <Link className="auth-brandmark" href="/">
            futur<span>•</span>e
          </Link>
          <p className="auth-brand-kicker">
            Projection climatique personnelle
          </p>
        </div>

        <div className="auth-grid">
          <section className="auth-story">
            <p className="auth-story-label">Connexion securisee</p>
            <h2 className="auth-story-title">
              Une entree simple, dans la meme atmosphere que le rapport.
            </h2>
            <p className="auth-story-copy">
              futur•e n&apos;ouvre pas une simple session. Vous retrouvez un
              espace personnel ou la commune, les tensions et le suivi restent
              lisibles, sobres et traces.
            </p>

            <div className="auth-story-card">
              <p className="auth-story-card-label">Ce que vous retrouvez</p>
              <ul className="auth-story-list">
                <li>vos projections locales et leurs scenarios DRIAS</li>
                <li>un acces direct au compte, au dashboard et au rapport</li>
                <li>une connexion par lien magique, sans mot de passe a memoriser</li>
              </ul>
            </div>
          </section>

          <div className="auth-card auth-card-wide">
            <Link className="auth-back" href="/">
              Retour a l&apos;accueil
            </Link>
            {children}
            <p className="auth-alt">
              {alternateText}{" "}
              <Link className="auth-link" href={alternateHref}>
                {alternateLabel}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
