'use client';

import { useState } from 'react';
import posthog from 'posthog-js';

const MOTIVATIONS = [
  { value: 'alertes', label: 'Recevoir des alertes locales' },
  { value: 'dashboard', label: 'Suivre mes risques dans le temps' },
  { value: 'profil', label: 'Mettre à jour mon profil et mes biens' },
  { value: 'newsletter', label: 'La newsletter mensuelle personnalisée' },
  { value: 'autre', label: 'Autre chose' },
];

export function FilWaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      email: fd.get('email') as string,
      commune: fd.get('commune') as string,
      motivation: fd.get('motivation') as string,
    };

    try {
      const res = await fetch('/api/suivi-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'error');
      }
      posthog.capture('suivi_waitlist_joined', {
        commune: payload.commune || null,
        motivation: payload.motivation || null,
      });
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'error');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div
        style={{
          padding: '32px 28px',
          textAlign: 'center',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--radius-2xl)',
          backdropFilter: 'blur(var(--blur-md))',
          WebkitBackdropFilter: 'blur(var(--blur-md))',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-kicker)',
            letterSpacing: 'var(--tracking-kicker)',
            textTransform: 'uppercase',
            color: 'var(--green)',
            marginBottom: 14,
          }}
        >
          ✓ Inscription enregistrée
        </div>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            color: 'var(--fg-1)',
            fontStyle: 'italic',
            margin: '0 0 10px',
            lineHeight: 1.2,
          }}
        >
          On vous écrit en premier.
        </p>
        <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--fg-3)', margin: 0, lineHeight: 1.6 }}>
          Dès que Le Fil ouvre, vous recevez votre invitation et trente jours offerts.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--bg-elev-2)',
    border: '1px solid var(--border-1)',
    color: 'var(--fg-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-body-sm)',
    outline: 'none',
    borderRadius: 'var(--radius-md)',
    transition: 'border-color var(--dur-base) var(--ease), background var(--dur-base) var(--ease)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-label)',
    letterSpacing: 'var(--tracking-kicker)',
    textTransform: 'uppercase',
    color: 'var(--fg-4)',
    marginBottom: 8,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 18 }}>
        <label htmlFor="email" style={labelStyle}>
          Votre email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="vous@exemple.fr"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--orange)';
            e.currentTarget.style.boxShadow = 'var(--shadow-focus)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label htmlFor="commune" style={labelStyle}>
          Votre commune ou code postal <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--fg-4)' }}>· facultatif</span>
        </label>
        <input
          id="commune"
          name="commune"
          type="text"
          placeholder="Ex. La Rochelle, 17000…"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--orange)';
            e.currentTarget.style.boxShadow = 'var(--shadow-focus)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="motivation" style={labelStyle}>
          Ce qui vous intéresse le plus <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--fg-4)' }}>· facultatif</span>
        </label>
        <select
          id="motivation"
          name="motivation"
          defaultValue=""
          style={{
            ...inputStyle,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage:
              "url(\"data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239ba3b4' stroke-width='1.5' stroke-linecap='round'/%3e%3c/svg%3e\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 18px center',
            paddingRight: 46,
          }}
        >
          <option value="">Sélectionnez (optionnel)</option>
          {MOTIVATIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {status === 'error' && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-meta)',
            color: 'var(--red)',
            marginBottom: 14,
          }}
        >
          {errorMsg === 'Email invalide.' ? 'Email invalide. Vérifiez votre saisie.' : 'Une erreur est survenue. Réessayez dans un instant.'}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: status === 'loading' ? 'var(--orange-soft)' : 'var(--orange)',
          border: 'none',
          color: '#0b0e1a',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-label)',
          letterSpacing: 'var(--tracking-kicker)',
          textTransform: 'uppercase',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          transition: 'background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          boxShadow: 'var(--shadow-card)',
        }}
        onMouseEnter={(e) => {
          if (status === 'idle') {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--orange-hover)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (status === 'idle') {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--orange)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }
        }}
      >
        {status === 'loading' ? 'Envoi…' : 'Être prévenu·e en avant-première'}
      </button>

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--fg-4)',
          marginTop: 16,
          textAlign: 'center',
          lineHeight: 1.7,
        }}
      >
        Aucun spam · Un seul email à l&apos;ouverture · RGPD
      </p>
    </form>
  );
}
