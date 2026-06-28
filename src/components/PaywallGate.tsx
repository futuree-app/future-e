'use client';

import Link from 'next/link';

type PaywallVariant = 'report' | 'open';

interface PaywallGateProps {
  previewHtml: string;
  fullHtml: string;
  accent?: string;
  /**
   * 'report' (défaut) : contenu commune-spécifique, gaté derrière le rapport 14€
   * quand l'accès n'est pas complet (CTA → déblocage).
   * 'open' : contenu thématique générique (pages Agir), toujours ouvert ; le CTA
   * ne vend rien, il pointe vers la décision (la valeur payante, elle, est l'arbitrage commune).
   */
  variant?: PaywallVariant;
  /** Seulement pris en compte en variant 'report'. */
  hasFullAccess?: boolean;
  /** Cible du CTA de déblocage en variant 'report' (page /territoire/[insee]/debloquer). */
  unlockHref?: string;
}

function CtaCard({
  accent,
  kicker,
  headline,
  href,
  label,
}: {
  accent: string;
  kicker: string;
  headline: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
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
        {kicker}
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
        {headline}
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
          href={href}
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
          {label}
        </Link>
      </div>
    </div>
  );
}

export function PaywallGate({
  previewHtml,
  fullHtml,
  accent = '#f87171',
  variant = 'report',
  hasFullAccess = false,
  unlockHref = '/ou-vivre',
}: PaywallGateProps) {
  // Pages Agir : contenu générique, gratuit. On affiche tout, puis on pointe vers la décision.
  if (variant === 'open') {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
        <CtaCard
          accent={accent}
          kicker="Aller plus loin"
          headline={
            <>
              Agir sur un risque, c&apos;est une chose. Choisir où vivre
              <br />
              en les pesant tous, c&apos;en est une autre.
            </>
          }
          href="/ou-vivre"
          label="Trouver où vivre"
        />
      </>
    );
  }

  // Page commune (Savoir) : l'analyse détaillée appartient au rapport payant.
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

      <CtaCard
        accent={accent}
        kicker="Rapport complet"
        headline={
          <>
            Voir l&apos;analyse complète de cette commune
            <br />
            et ce qu&apos;elle change pour votre choix.
          </>
        }
        href={unlockHref}
        label="Débloquer le rapport"
      />
    </>
  );
}
