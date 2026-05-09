'use client';

import { useRef, useState } from 'react';

const ACCENT = '#c8b89a';
const ACCENT_WARM = '#d4a574';
const GREEN = '#34d399';

export function ProForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    const fd = new FormData(e.currentTarget);
    const payload = {
      profession: fd.get('profession') as string,
      email: fd.get('email') as string,
      cabinet: fd.get('cabinet') as string,
      besoin: fd.get('besoin') as string,
    };

    try {
      const res = await fetch('/api/inscription-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#e9ecf2',
    fontFamily: "'Instrument Sans', system-ui, sans-serif",
    fontSize: 15,
    outline: 'none',
    borderRadius: 6,
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6b7388',
    marginBottom: 8,
  };

  if (status === 'done') {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: GREEN, marginBottom: 16 }}>
          Inscription enregistrée
        </div>
        <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#e9ecf2', fontStyle: 'italic', margin: '0 0 12px' }}>
          Vous serez contacté en avant-première.
        </p>
        <p style={{ fontSize: 14, color: '#9ba3b4', margin: 0 }}>
          Dès l'ouverture de votre segment, nous vous écrivons en premier.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle} htmlFor="profession">Votre profession</label>
        <select
          name="profession"
          id="profession"
          required
          style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239ba3b4' stroke-width='1.5' stroke-linecap='round'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 18px center', paddingRight: 46 }}
        >
          <option value="">Sélectionnez votre profession</option>
          <option value="cgp">Conseiller en gestion de patrimoine</option>
          <option value="notaire">Notaire</option>
          <option value="assurance-agent">Agent général d'assurance</option>
          <option value="assurance-courtier">Courtier en assurance</option>
          <option value="diagnostiqueur">Diagnostiqueur immobilier</option>
          <option value="banque">Conseiller bancaire patrimonial</option>
          <option value="autre">Autre profession de l'immobilier</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle} htmlFor="email">Votre email professionnel</label>
        <input
          name="email"
          id="email"
          type="email"
          placeholder="prenom.nom@cabinet.fr"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle} htmlFor="cabinet">Cabinet ou structure (facultatif)</label>
        <input
          name="cabinet"
          id="cabinet"
          type="text"
          placeholder="Nom de votre cabinet, étude, agence…"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle} htmlFor="besoin">Un cas client, un besoin précis ? (facultatif)</label>
        <textarea
          name="besoin"
          id="besoin"
          placeholder="Ex. : Je conseille beaucoup sur le littoral atlantique, je cherche surtout une lecture sur la submersion et l'évolution des assurances…"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
        />
      </div>

      {status === 'error' && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#f87171', marginBottom: 12 }}>
          Une erreur est survenue. Réessayez ou écrivez-nous directement.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: status === 'loading' ? 'rgba(200,184,154,0.5)' : ACCENT,
          border: 'none',
          color: '#060812',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          transition: 'background 0.15s',
          borderRadius: 6,
          fontWeight: 500,
          marginTop: 8,
        }}
        onMouseEnter={(e) => { if (status === 'idle') (e.target as HTMLButtonElement).style.background = ACCENT_WARM; }}
        onMouseLeave={(e) => { if (status === 'idle') (e.target as HTMLButtonElement).style.background = ACCENT; }}
      >
        {status === 'loading' ? 'Envoi…' : "Recevoir l'accès en avant-première"}
      </button>

      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', color: '#6b7388', marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
        Inscription sans engagement · Aucun spam · Vous serez contacté à l'ouverture de votre segment<br />
        Données traitées selon le RGPD · futur•e ne revend jamais ses listes
      </p>
    </form>
  );
}
