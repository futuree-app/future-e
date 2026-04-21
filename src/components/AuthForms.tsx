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
    <>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.message ? <p className="auth-message">{state.message}</p> : null}
    </>
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
  );
}
