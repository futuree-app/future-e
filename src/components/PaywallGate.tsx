'use client';

import Link from 'next/link';

interface PaywallGateProps {
  hasFullAccess: boolean;
  previewHtml: string;
  fullHtml: string;
  accent?: string;
}

export function PaywallGate({
  hasFullAccess,
  previewHtml,
  fullHtml,
  accent = '#f87171',
}: PaywallGateProps) {
  if (hasFullAccess) {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
      </>
    );
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />

      {/* Gated content with fade */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            maxHeight: '300px',
            overflow: 'hidden',
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: 0.5,
          }}
          dangerouslySetInnerHTML={{ __html: fullHtml }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, #060812)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Paywall card */}
      <div
        style={{
          marginTop: '40px',
          padding: '40px 36px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: `2px solid ${accent}`,
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '16px',
          }}
        >
          Réservé aux abonnés Suivi
        </div>
        <p
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '22px',
            lineHeight: 1.4,
            color: '#e9ecf2',
            margin: '0 0 28px',
            fontWeight: 400,
          }}
        >
          Les leviers documentés, étape par étape,
          <br />
          sont disponibles dans votre abonnement.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/inscription"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 28px',
              background: accent,
              color: '#060812',
              fontFamily: "'Instrument Sans', system-ui, sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            S&apos;abonner — Accès Suivi
          </Link>
          <Link
            href="/connexion"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 28px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#9ba3b4',
              fontFamily: "'Instrument Sans', system-ui, sans-serif",
              fontSize: '15px',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            Déjà abonné ? Se connecter
          </Link>
        </div>
      </div>
    </>
  );
}
