"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EMPTY_STATE, type AuthActionState } from "@/app/auth/shared";

type ActionFn = (
  state: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

/* ── Shared field styles — identical to wizard inputs ── */
const inputCls =
  "w-full px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all duration-200";

const labelCls =
  "block font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-2.5";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-7 py-4 rounded-xl bg-accent text-canvas font-semibold text-[15px] transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-wait"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function AuthFeedback({ state }: { state: AuthActionState }) {
  if (!state.error && !state.message) return null;
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      {state.error && (
        <p className="px-4 py-3 rounded-xl bg-danger/[0.08] border border-danger/[0.18] text-[13px] text-danger/90 font-mono tracking-[0.02em]">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="px-4 py-3 rounded-xl bg-success/[0.08] border border-success/[0.18] text-[13px] text-success/90 font-mono tracking-[0.02em]">
          {state.message}
        </p>
      )}
    </div>
  );
}

export function PasswordForm({
  action,
  title,
  subtitle,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
  forgotPasswordHref,
}: {
  action: ActionFn;
  title: string;
  subtitle: string;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: string;
  forgotPasswordHref?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_STATE);

  return (
    <section className="flex flex-col gap-7">
      <div>
        <h1
          className="text-[clamp(26px,3vw,32px)] font-semibold text-label leading-tight tracking-[-0.03em] mb-2"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {title}
        </h1>
        <p className="text-[14px] text-muted leading-relaxed">{subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label className={labelCls} htmlFor="auth-email">Email</label>
          <input
            className={inputCls}
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className={labelCls.replace("mb-2.5", "")} htmlFor="auth-password">
              Mot de passe
            </label>
            {forgotPasswordHref && (
              <Link
                href={forgotPasswordHref}
                className="font-mono text-[10px] tracking-[0.08em] text-ghost hover:text-accent transition-colors duration-200"
              >
                Oublié ?
              </Link>
            )}
          </div>
          <input
            className={inputCls}
            id="auth-password"
            name="password"
            type="password"
            autoComplete={passwordAutoComplete}
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>

        <AuthFeedback state={state} />

        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </form>
    </section>
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
    <section className="flex flex-col gap-7">
      <div>
        <h1
          className="text-[clamp(26px,3vw,32px)] font-semibold text-label leading-tight tracking-[-0.03em] mb-2"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {title}
        </h1>
        <p className="text-[14px] text-muted leading-relaxed">{subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label className={labelCls} htmlFor="magic-email">Email</label>
          <input
            className={inputCls}
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
          />
        </div>

        <AuthFeedback state={state} />

        <SubmitButton label={submitLabel} pendingLabel="Envoi du lien..." />
      </form>
    </section>
  );
}

/* Legacy shell — kept for backward compat, not used on connexion/inscription */
export function AuthShell({
  children,
  alternateHref,
  alternateLabel,
  alternateText,
}: {
  children: React.ReactNode;
  alternateHref?: string;
  alternateLabel?: string;
  alternateText?: string;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-orb auth-shell-orb-primary" />
      <div className="auth-shell-orb auth-shell-orb-secondary" />
      <div className="auth-shell-orb auth-shell-orb-tertiary" />
      <div className="auth-shell-stage">
        <div className="auth-shell-brand">
          <Link className="auth-brandmark" href="/">futur<span>•</span>e</Link>
          <p className="auth-brand-kicker">Projection climatique personnelle</p>
        </div>
        <div className="auth-grid">
          <div className="auth-card auth-card-wide">
            {children}
            {alternateHref && alternateLabel && alternateText ? (
              <p className="auth-alt">
                {alternateText}{" "}
                <Link className="auth-link" href={alternateHref}>{alternateLabel}</Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
