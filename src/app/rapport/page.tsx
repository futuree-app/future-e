/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * futur•e — Page /rapport
 * DA : glassmorphism sombre, palette validée, Instrument Serif + JetBrains Mono + Instrument Sans
 * Rendu : compte gratuit (1 module ouvert) et compte payant (6 modules ouverts)
 * Adapté de FutureELanding.tsx — cohérence visuelle totale
 */

import Link from 'next/link';
import { canAccessCompleteReport, getPlanLabel } from '@/lib/access';
import { PRODUCT_MODULES } from '@/lib/product';
import { getCurrentUserAccount } from '@/lib/user-account';

// ─── palette ────────────────────────────────────────────────────────────────
const C = {
  bg: '#060812',
  bgElev: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderHi: 'rgba(255,255,255,0.15)',
  text: '#e9ecf2',
  muted: '#9ba3b4',
  dim: '#6b7388',
  orange: '#fb923c',
  red: '#f87171',
  violet: '#a78bfa',
  green: '#4ade80',
  blue: '#60a5fa',
};

// ─── module couleurs ─────────────────────────────────────────────────────────
const MODULE_COLORS: Record<string, string> = {
  quartier: C.blue,
  logement: C.orange,
  metier: C.violet,
  sante: C.green,
  mobilite: C.red,
  projets: C.orange,
};

const MODULE_ICONS: Record<string, string> = {
  quartier: '🏘',
  logement: '🏠',
  metier: '💼',
  sante: '🫁',
  mobilite: '🚗',
  projets: '🗓',
};

// ─── glass helper ────────────────────────────────────────────────────────────
function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: C.bgElev,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${C.border}`,
    ...extra,
  };
}

// ─── styles ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Instrument Sans', sans-serif",
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  // orbs
  orb: (pos: React.CSSProperties): React.CSSProperties => ({
    position: 'fixed',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
    ...pos,
  }),

  // nav
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    background: 'rgba(6,8,18,0.72)',
    borderBottom: `1px solid ${C.border}`,
  } as React.CSSProperties,

  navInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 28px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  } as React.CSSProperties,

  brand: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 22,
    fontStyle: 'italic',
    color: C.text,
    letterSpacing: -0.3,
    textDecoration: 'none',
  } as React.CSSProperties,

  navLinks: { display: 'flex', alignItems: 'center', gap: 32 } as React.CSSProperties,

  navLink: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: C.muted,
    textDecoration: 'none',
  } as React.CSSProperties,

  navActions: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,

  navSecondaryLink: {
    padding: '8px 12px',
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    color: C.text,
    textDecoration: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    background: 'rgba(255,255,255,0.02)',
  } as React.CSSProperties,

  navCta: {
    padding: '8px 20px',
    borderRadius: 6,
    background: C.orange,
    color: C.bg,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
  } as React.CSSProperties,

  // stage
  stage: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 28px 80px',
  } as React.CSSProperties,

  // hero band
  heroBand: {
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: 64,
    alignItems: 'start',
    padding: '80px 0 60px',
  } as React.CSSProperties,

  // eyebrow
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: C.orange,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,

  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: C.orange,
    boxShadow: `0 0 12px ${C.orange}`,
    display: 'inline-block',
    flexShrink: 0,
  } as React.CSSProperties,

  h1: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(34px,3.8vw,52px)',
    lineHeight: 1.1,
    letterSpacing: -1,
    margin: '0 0 20px',
    color: C.text,
  } as React.CSSProperties,

  heroSub: {
    fontSize: 17,
    lineHeight: 1.7,
    color: C.muted,
    margin: '0 0 32px',
    maxWidth: 520,
  } as React.CSSProperties,

  // panel
  panel: {
    ...glass({ borderRadius: 16, padding: '28px 30px' }),
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  panelAccent: {
    ...glass({
      borderRadius: 16,
      padding: '28px 30px',
      borderColor: `${C.orange}40`,
      boxShadow: `0 0 0 1px rgba(251,146,60,0.18), 0 16px 48px rgba(251,146,60,0.08)`,
    }),
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  panelLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: C.dim,
    marginBottom: 6,
  } as React.CSSProperties,

  panelTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(20px,2.2vw,26px)',
    lineHeight: 1.2,
    color: C.text,
    margin: '0 0 20px',
    letterSpacing: -0.4,
  } as React.CSSProperties,

  // metrics strip
  metricsStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: 0,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    border: `1px solid ${C.border}`,
  } as React.CSSProperties,

  metricCell: {
    padding: '16px 14px',
    textAlign: 'center' as const,
    borderRight: `1px solid ${C.border}`,
  } as React.CSSProperties,

  metricValue: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 28,
    fontWeight: 400,
    color: C.orange,
    display: 'block',
    lineHeight: 1,
    marginBottom: 6,
  } as React.CSSProperties,

  metricLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.08em',
    color: C.dim,
    textTransform: 'uppercase' as const,
    lineHeight: 1.4,
  } as React.CSSProperties,

  copy: {
    fontSize: 15,
    lineHeight: 1.7,
    color: C.muted,
    margin: '0 0 16px',
  } as React.CSSProperties,

  // divider
  divider: {
    borderTop: `1px solid ${C.border}`,
    margin: '0',
  } as React.CSSProperties,

  // band head
  bandHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 40,
    alignItems: 'end',
    marginBottom: 32,
  } as React.CSSProperties,

  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: C.dim,
    marginBottom: 8,
  } as React.CSSProperties,

  sectionTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(24px,2.8vw,36px)',
    lineHeight: 1.18,
    letterSpacing: -0.5,
    margin: '0 0 4px',
    color: C.text,
  } as React.CSSProperties,

  sectionSub: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 1.65,
    margin: 0,
  } as React.CSSProperties,

  // synthese card (gratuit)
  syntheseCard: {
    ...glass({ borderRadius: 14, padding: '36px 40px' }),
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: 48,
    alignItems: 'start',
    marginBottom: 48,
  } as React.CSSProperties,

  syntheseList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } as React.CSSProperties,

  syntheseItem: {
    fontSize: 15,
    color: C.muted,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    lineHeight: 1.55,
  } as React.CSSProperties,

  synthDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: C.orange,
    flexShrink: 0,
    marginTop: 7,
  } as React.CSSProperties,

  // module cards
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: 14,
  } as React.CSSProperties,

  moduleCard: (col: string, open: boolean): React.CSSProperties => ({
    ...glass({
      borderRadius: 12,
      padding: '24px 22px',
      borderColor: open ? `${col}30` : C.border,
    }),
    borderTop: `2px solid ${open ? col : C.border}`,
    position: 'relative' as const,
    overflow: 'hidden',
    opacity: open ? 1 : 0.55,
  }),

  moduleIconWrap: (col: string, open: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 8,
    background: open ? `${col}18` : 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    marginBottom: 14,
    border: `1px solid ${open ? `${col}25` : C.border}`,
  }),

  moduleNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.1em',
    color: C.dim,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  moduleName: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 20,
    color: C.text,
    marginBottom: 8,
  } as React.CSSProperties,

  moduleSummary: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.65,
    marginBottom: 14,
  } as React.CSSProperties,

  signalStrip: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 18,
  } as React.CSSProperties,

  signalPill: (col: string, open: boolean): React.CSSProperties => ({
    padding: '3px 9px',
    borderRadius: 4,
    background: open ? `${col}14` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${open ? `${col}28` : C.border}`,
    fontSize: 11,
    color: open ? col : C.dim,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
  }),

  lockOverlay: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: C.dim,
  } as React.CSSProperties,

  lockIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    border: `1px solid ${C.border}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
  } as React.CSSProperties,

  // CTA button
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '13px 28px',
    borderRadius: 8,
    background: C.orange,
    color: C.bg,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
  } as React.CSSProperties,

  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '13px 28px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    color: C.text,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    border: `1px solid ${C.border}`,
  } as React.CSSProperties,

  // upgrade band
  upgradeBand: {
    ...glass({
      borderRadius: 16,
      padding: '40px 48px',
      borderColor: `${C.orange}25`,
    }),
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 48,
    alignItems: 'center',
    marginTop: 48,
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  upgradeGlow: {
    position: 'absolute' as const,
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${C.orange}22 0%, transparent 70%)`,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  upgradeTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(22px,2.5vw,30px)',
    lineHeight: 1.2,
    letterSpacing: -0.5,
    color: C.text,
    margin: '0 0 12px',
  } as React.CSSProperties,

  upgradeBody: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 1.65,
    margin: '0 0 8px',
  } as React.CSSProperties,

  upgradeList: {
    listStyle: 'none',
    padding: 0,
    margin: '16px 0 0',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px 24px',
  } as React.CSSProperties,

  upgradeItem: {
    fontSize: 13,
    color: C.muted,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  } as React.CSSProperties,

  upgradeCheck: {
    color: C.green,
    fontSize: 13,
    flexShrink: 0,
  } as React.CSSProperties,

  upgradePriceCol: {
    textAlign: 'center' as const,
    flexShrink: 0,
    minWidth: 180,
  } as React.CSSProperties,

  upgradePrice: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 48,
    fontWeight: 400,
    color: C.text,
    letterSpacing: -1.5,
    lineHeight: 1,
    marginBottom: 4,
  } as React.CSSProperties,

  upgradePriceSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: '0.04em',
    display: 'block',
    marginBottom: 20,
  } as React.CSSProperties,

  // footer nav
  footerNav: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap' as const,
    marginTop: 48,
    paddingTop: 32,
    borderTop: `1px solid ${C.border}`,
  } as React.CSSProperties,

  // footer
  footer: {
    position: 'relative' as const,
    zIndex: 2,
    borderTop: `1px solid ${C.border}`,
    marginTop: 0,
  } as React.CSSProperties,

  footerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '36px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  footerBrand: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 20,
    fontStyle: 'italic',
    color: C.text,
    letterSpacing: -0.3,
    flexShrink: 0,
  } as React.CSSProperties,

  footerLinks: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  footerLink: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    textDecoration: 'none',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: '0.04em',
  } as React.CSSProperties,
};

// ─── QUARTIER_MODULE helper ──────────────────────────────────────────────────
const QUARTIER_MODULE = PRODUCT_MODULES.find((m) => m.id === 'quartier')!;
const LOCKED_MODULES = PRODUCT_MODULES.filter((m) => m.id !== 'quartier');

// ─── Component ───────────────────────────────────────────────────────────────
export default async function RapportPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);
  const planLabel = getPlanLabel(account.plan);

  const lockedModules = fullReport ? [] : LOCKED_MODULES;

  return (
    <div style={S.root}>

      {/* ── orbs ─────────────────────────────────────────────────────── */}
      <div style={S.orb({
        width: 560, height: 560,
        background: `radial-gradient(circle, ${C.orange}40 0%, transparent 70%)`,
        top: -180, left: -140,
        filter: 'blur(100px)',
        opacity: 0.4,
      })} />
      <div style={S.orb({
        width: 440, height: 440,
        background: `radial-gradient(circle, ${C.violet}35 0%, transparent 70%)`,
        bottom: -120, right: -100,
        filter: 'blur(90px)',
        opacity: 0.32,
      })} />
      <div style={S.orb({
        width: 300, height: 300,
        background: `radial-gradient(circle, ${C.blue}25 0%, transparent 70%)`,
        top: '45%', left: '55%',
        filter: 'blur(70px)',
        opacity: 0.18,
      })} />

      {/* ── nav ──────────────────────────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link href="/" style={S.brand}>
            futur<span style={{ color: C.orange, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div style={S.navLinks}>
            <Link style={S.navLink} href="/">
              Le produit
            </Link>
            <Link style={S.navLink} href="/">
              Pages Savoir
            </Link>
            <Link style={S.navLink} href="/#pricing">
              Tarifs
            </Link>
          </div>
          <div style={S.navActions}>
            <Link href="/compte" style={S.navSecondaryLink}>Mon compte</Link>
            <Link href="/dashboard" style={S.navCta}>Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* ── stage ────────────────────────────────────────────────────── */}
      <div style={S.stage}>

        {/* ── hero band ────────────────────────────────────────────── */}
        <section style={S.heroBand}>
          <div>
            <div style={S.eyebrow}>
              <span style={S.eyebrowDot} />
              Rapport
            </div>
            <h1 style={S.h1}>
              {fullReport
                ? <>Votre rapport complet.<br /><span style={{ fontStyle: 'italic', color: C.orange }}>Six dimensions.</span> Aucun score synthétique.</>
                : <>Votre rapport partiel<br />ouvre la lecture<br /><span style={{ fontStyle: 'italic', color: C.orange }}>sans prétendre tout couvrir.</span></>
              }
            </h1>
            <p style={S.heroSub}>
              {fullReport
                ? `Le rapport complet articule les six modules sans les compacter dans un indice unique. Chaque dimension reste lisible séparément pour que vos arbitrages restent les vôtres.`
                : `Le plan ${planLabel} donne accès à une synthèse globale et au module Quartier. Les cinq autres dimensions sont visibles, mais fermées. Vous voyez la structure avant de décider si la lecture complète vous est utile.`
              }
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {!fullReport && (
                <Link href="/#pricing" style={S.btnPrimary}>
                  Ouvrir le rapport complet
                  <span style={{ opacity: 0.7, fontSize: 12 }}>→</span>
                </Link>
              )}
              <Link href="/compte" style={S.btnSecondary}>
                Retour au compte
              </Link>
            </div>
          </div>

          {/* ── summary panel ──────────────────────────────────────── */}
          <aside style={fullReport ? S.panelAccent : S.panel}>
            {/* subtle glow */}
            {fullReport && (
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 160, height: 160, borderRadius: '50%',
                background: `radial-gradient(circle, ${C.orange}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
            )}
            <p style={S.panelLabel}>Structure du rapport</p>
            <h2 style={S.panelTitle}>
              {fullReport ? "Lecture intégrale" : "Lecture d'amorce"}
            </h2>

            <div style={S.metricsStrip}>
              {[
                { val: fullReport ? '6' : '1', label: 'module(s) ouvert(s)' },
                { val: fullReport ? 'PDF' : 'Court', label: 'format de lecture' },
                { val: fullReport ? 'Oui' : 'Non', label: 'téléchargement' },
              ].map((m, i) => (
                <div
                  key={m.label}
                  style={{
                    ...S.metricCell,
                    borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <span style={{
                    ...S.metricValue,
                    color: fullReport ? C.orange : C.muted,
                  }}>{m.val}</span>
                  <span style={S.metricLabel}>{m.label}</span>
                </div>
              ))}
            </div>

            <p style={S.copy}>
              futur•e garde les dimensions distinctes pour rendre les arbitrages lisibles, pas compétitifs. Aucun score ne réduit votre situation à un chiffre.
            </p>

            {!fullReport && (
              <div style={{
                ...glass({ borderRadius: 8, padding: '14px 18px', borderColor: `${C.orange}22`, borderLeft: `2px solid ${C.orange}` }),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.6,
              }}>
                Plan actuel : <span style={{ color: C.orange }}>{planLabel}</span>.
                Le rapport complet est accessible à partir de 14 € ou 9 €/mois.
              </div>
            )}
          </aside>
        </section>

        {/* ── divider ──────────────────────────────────────────────── */}
        <div style={S.divider} />

        {/* ════════════════════════════════════════════════════════════
            VUE GRATUIT
        ════════════════════════════════════════════════════════════ */}
        {!fullReport && (
          <>
            {/* synthèse globale */}
            <section style={{ padding: '56px 0 0' }}>
              <div style={S.bandHead}>
                <div>
                  <p style={S.sectionLabel}>Synthèse globale</p>
                  <h2 style={S.sectionTitle}>
                    Une première mise en ordre de la situation.
                  </h2>
                </div>
                <p style={S.sectionSub}>
                  Cette lecture gratuite ne cherche pas à tout montrer. Elle vous donne un ancrage clair et une porte d&apos;entrée honnête dans le rapport.
                </p>
              </div>

              <div style={S.syntheseCard}>
                <div>
                  <p style={S.copy}>
                    La synthèse gratuite lit le territoire sans entrer dans le détail de votre profil. Elle repère ce qui se joue autour du lieu de vie, ce que le quartier devient et pourquoi cela mérite ou non d&apos;aller plus loin. Une lecture courte et narrative, pas un tableau de bord.
                  </p>
                  <ul style={S.syntheseList}>
                    {[
                      'Lecture narrative, pas un tableau de chiffres',
                      'Une seule commune de référence dans cette version',
                      "Le module Quartier sert d'ouverture à la suite du rapport",
                      'Sources citées pour chaque affirmation significative',
                    ].map((item) => (
                      <li key={item} style={S.syntheseItem}>
                        <span style={S.synthDot} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{
                  ...glass({ borderRadius: 12, padding: '24px 22px', borderColor: `${C.blue}30` }),
                  borderTop: `2px solid ${C.blue}`,
                }}>
                  <p style={S.panelLabel}>Module 01 — ouvert</p>
                  <h3 style={{ ...S.moduleName, marginBottom: 10, fontSize: 22 }}>
                    {QUARTIER_MODULE.name}
                  </h3>
                  <p style={S.moduleSummary}>{QUARTIER_MODULE.summary}</p>
                  <div style={S.signalStrip}>
                    {QUARTIER_MODULE.signals.map((signal: string) => (
                      <span key={signal} style={S.signalPill(C.blue, true)}>
                        {signal}
                      </span>
                    ))}
                  </div>
                  <Link href="/compte#quartier" style={S.btnPrimary}>
                    Compléter Quartier
                  </Link>
                </div>
              </div>
            </section>

            {/* modules fermés */}
            <section style={{ paddingBottom: 0 }}>
              <div style={S.bandHead}>
                <div>
                  <p style={S.sectionLabel}>Modules suivants</p>
                  <h2 style={S.sectionTitle}>
                    Le reste du rapport est visible, mais clairement fermé.
                  </h2>
                </div>
                <p style={S.sectionSub}>
                  Pour lire les cinq autres modules et télécharger votre rapport PDF, choisissez votre formule.
                </p>
              </div>

              <div style={S.modulesGrid}>
                {lockedModules.map((module, i) => {
                  const col = MODULE_COLORS[module.id] || C.violet;
                  const icon = MODULE_ICONS[module.id] || '◎';
                  return (
                    <article key={module.id} style={S.moduleCard(col, false)}>
                      <div style={S.moduleIconWrap(col, false)}>
                        <span style={{ filter: 'grayscale(1)', opacity: 0.5 }}>{icon}</span>
                      </div>
                      <p style={S.moduleNum}>Module 0{i + 2}</p>
                      <h3 style={{ ...S.moduleName, color: C.muted }}>{module.name}</h3>
                      <p style={{ ...S.moduleSummary, opacity: 0.6 }}>{module.summary}</p>
                      <div style={S.signalStrip}>
                        {module.signals.map((signal: string) => (
                          <span key={signal} style={S.signalPill(col, false)}>
                            {signal}
                          </span>
                        ))}
                      </div>
                      <div style={S.lockOverlay}>
                        <span style={S.lockIcon}>⌀</span>
                        Module fermé
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* upgrade band */}
            <div style={S.upgradeBand}>
              <div style={S.upgradeGlow} />
              <div>
                <p style={S.sectionLabel}>Passer au rapport complet</p>
                <h2 style={S.upgradeTitle}>
                  Six modules ouverts. Un rapport qui lit votre vie, pas un territoire générique.
                </h2>
                <p style={S.upgradeBody}>
                  Le rapport complet croise votre profil avec les données publiques disponibles pour votre commune. Logement, santé, métier, mobilité, projets : chaque dimension reste distincte pour que vos arbitrages restent lisibles.
                </p>
                <ul style={S.upgradeList}>
                  {[
                    'Rapport PDF téléchargeable',
                    'Dashboard 6 modules',
                    'Régénération annuelle',
                    'Sources citées pour chaque affirmation',
                  ].map((item) => (
                    <li key={item} style={S.upgradeItem}>
                      <span style={S.upgradeCheck}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={S.upgradePriceCol}>
                <div style={S.upgradePrice}>14<span style={{ fontSize: 24, color: C.dim, letterSpacing: 0 }}>€</span></div>
                <span style={S.upgradePriceSub}>une fois · ou 9 €/mois en Suivi</span>
                <Link href="/#pricing" style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                  Voir les formules
                </Link>
                <p style={{ ...S.mono, marginTop: 12, textAlign: 'center' }}>
                  Les 14 € sont déductibles si vous passez en Suivi.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            VUE PAYANT — 6 modules ouverts
        ════════════════════════════════════════════════════════════ */}
        {fullReport && (
          <section style={{ padding: '56px 0 0' }}>
            <div style={S.bandHead}>
              <div>
                <p style={S.sectionLabel}>Rapport complet</p>
                <h2 style={S.sectionTitle}>
                  Les six dimensions sont ouvertes et restent distinctes.
                </h2>
              </div>
              <p style={S.sectionSub}>
                Le rapport complet ne compacte pas cette lecture dans un score unique. Il garde les dimensions séparées pour rendre les arbitrages lisibles.
              </p>
            </div>

            <div style={S.modulesGrid}>
              {PRODUCT_MODULES.map((module, i) => {
                const col = MODULE_COLORS[module.id] || C.violet;
                const icon = MODULE_ICONS[module.id] || '◎';
                return (
                  <article key={module.id} style={S.moduleCard(col, true)}>
                    <div style={S.moduleIconWrap(col, true)}>{icon}</div>
                    <p style={S.moduleNum}>Module 0{i + 1}</p>
                    <h3 style={S.moduleName}>{module.name}</h3>
                    <p style={S.moduleSummary}>{module.summary}</p>
                    <div style={S.signalStrip}>
                      {module.signals.map((signal: string) => (
                        <span key={signal} style={S.signalPill(col, true)}>
                          {signal}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: col,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}`, display: 'inline-block', flexShrink: 0 }} />
                      Module ouvert
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── footer nav ───────────────────────────────────────────── */}
        <div style={S.footerNav}>
          <Link href="/compte" style={S.btnSecondary}>
            ← Retour au compte
          </Link>
          <Link href="/dashboard" style={S.btnPrimary}>
            Voir le dashboard
          </Link>
        </div>
      </div>

      {/* ── footer ───────────────────────────────────────────────────── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerBrand}>
            futur<span style={{ color: C.orange, fontStyle: 'normal' }}>•</span>e
          </div>
          <div style={S.footerLinks}>
            <Link style={S.footerLink} href="/">
              Manifeste
            </Link>
            <Link style={S.footerLink} href="/">
              Méthodologie
            </Link>
            <Link style={S.footerLink} href="/">
              Pages Savoir
            </Link>
            <Link style={S.footerLink} href="/connexion">
              Contact
            </Link>
            <Link style={S.footerLink} href="/">
              Mentions légales
            </Link>
          </div>
          <div style={S.mono}>Données publiques françaises · Aucune publicité</div>
        </div>
      </footer>
    </div>
  );
}
