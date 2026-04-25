/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * futur•e — Page /rapport v2
 * Centré utilisateur : ce que le rapport fait pour lui, pas comment il est structuré.
 * Ton éditorial : lucidité, pas panique. Données, pas opinions. Vouvoiement.
 * DA : glassmorphism sombre, palette validée, Instrument Serif + JetBrains Mono.
 */

import Link from 'next/link';
import { canAccessCompleteReport } from '@/lib/access';
import { PRODUCT_MODULES } from '@/lib/product';
import { getCurrentUserAccount } from '@/lib/user-account';

// ─── palette ────────────────────────────────────────────────────────────────
const C = {
  bg: '#060812',
  bgElev: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  text: '#e9ecf2',
  muted: '#9ba3b4',
  dim: '#6b7388',
  orange: '#fb923c',
  red: '#f87171',
  violet: '#a78bfa',
  green: '#4ade80',
  blue: '#60a5fa',
};

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

// ─── Ce que chaque module dit à l'utilisateur (pas la structure, le bénéfice) ──
const MODULE_BENEFIT: Record<string, string> = {
  quartier:
    'Ce que votre territoire devient. Chaleur, inondations, érosion, qualité de vie : ce qui change autour de chez vous dans les prochaines décennies.',
  logement:
    'Ce que votre logement devient : confort d\'été, valeur future, coût d\'assurance, obligations de rénovation. Ce que vous ne voyez pas encore dans votre bail ou votre acte de propriété.',
  metier:
    'Ce que le changement climatique fait à votre secteur. Certains métiers gagnent en importance, d\'autres se fragilisent. Votre exposition n\'est pas la même selon où et comment vous travaillez.',
  sante:
    'Ce que votre environnement fait à votre corps. Chaleur, pollens, qualité de l\'air, cadmium dans les sols : des signaux qui existent déjà, pas des scénarios abstraits.',
  mobilite:
    'Est-ce que votre mode de vie quotidien reste tenable ici ? Dépendance à la voiture, coût des trajets, alternatives réelles : une lecture honnête du territoire.',
  projets:
    'Est-ce que vos projets sont cohérents avec ce que ce lieu va devenir ? Achat, déménagement, retraite, installation durable : les questions que les données permettent d\'éclairer.',
};

// ─── glass helper ────────────────────────────────────────────────────────────
function glass(extra = {}) {
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
    position: 'relative',
    overflow: 'hidden',
  },
  orb: (pos) => ({
    position: 'fixed',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
    ...pos,
  }),
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    background: 'rgba(6,8,18,0.72)',
    borderBottom: `1px solid ${C.border}`,
  },
  navInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 28px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  brand: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 22,
    fontStyle: 'italic',
    color: C.text,
    letterSpacing: -0.3,
    textDecoration: 'none',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
  navLink: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.muted,
    textDecoration: 'none',
  },
  navActions: { display: 'flex', alignItems: 'center', gap: 10 },
  navSecondary: {
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    color: C.text,
    textDecoration: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.02)',
  },
  navCta: {
    padding: '8px 20px',
    borderRadius: 6,
    background: C.orange,
    color: C.bg,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
  },
  stage: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 28px 96px',
  },

  // ─ hero
  hero: {
    padding: '80px 0 64px',
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: 64,
    alignItems: 'start',
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: C.orange,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: C.orange,
    boxShadow: `0 0 12px ${C.orange}`,
    display: 'inline-block',
    flexShrink: 0,
  },
  h1: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(36px,4vw,54px)',
    lineHeight: 1.08,
    letterSpacing: -1.2,
    margin: '0 0 22px',
    color: C.text,
  },
  heroSub: {
    fontSize: 17,
    lineHeight: 1.72,
    color: C.muted,
    margin: '0 0 36px',
    maxWidth: 500,
  },
  heroActions: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '13px 26px',
    borderRadius: 8,
    background: C.orange,
    color: C.bg,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '13px 26px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    color: C.muted,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    border: `1px solid ${C.border}`,
  },

  // ─ panel (côté droit hero)
  panel: (accent = false) => ({
    ...glass({
      borderRadius: 16,
      padding: '28px 28px 24px',
      borderColor: accent ? `${C.orange}38` : C.border,
      boxShadow: accent
        ? `0 0 0 1px rgba(251,146,60,0.15), 0 20px 60px rgba(251,146,60,0.07)`
        : 'none',
    }),
    position: 'relative',
    overflow: 'hidden',
  }),
  panelLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: C.dim,
    marginBottom: 4,
  },
  panelTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 22,
    lineHeight: 1.2,
    color: C.text,
    margin: '0 0 20px',
    letterSpacing: -0.3,
  },

  // ─ signal cards (aperçu des signaux dans le panneau hero)
  signalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
  },
  signalCard: (col) => ({
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    padding: '12px 14px',
    borderRadius: 8,
    background: `${col}0c`,
    border: `1px solid ${col}22`,
  }),
  signalDot: (col) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: col,
    boxShadow: `0 0 8px ${col}`,
    flexShrink: 0,
    marginTop: 5,
  }),
  signalTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 2,
    lineHeight: 1.3,
  },
  signalSrc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: C.dim,
    letterSpacing: '0.04em',
  },

  // ─ divider
  divider: {
    borderTop: `1px solid ${C.border}`,
    margin: '0',
  },

  // ─ sections
  section: {
    padding: '56px 0 0',
  },
  bandHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 40,
    alignItems: 'end',
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: C.dim,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(24px,2.8vw,36px)',
    lineHeight: 1.18,
    letterSpacing: -0.5,
    margin: '0 0 4px',
    color: C.text,
  },
  sectionSub: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 1.65,
    margin: 0,
  },

  // ─ module Quartier ouvert
  quartierWrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 24,
    marginBottom: 48,
  },
  quartierMain: {
    ...glass({ borderRadius: 14, padding: '32px 36px' }),
    borderTop: `2px solid ${C.blue}`,
  },
  quartierTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 26,
    color: C.text,
    margin: '0 0 12px',
    letterSpacing: -0.3,
  },
  quartierBody: {
    fontSize: 16,
    lineHeight: 1.75,
    color: C.muted,
    margin: '0 0 24px',
  },

  // ─ facteurs visuels (Quartier)
  factorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 24,
  },
  factorCard: {
    ...glass({ borderRadius: 10, padding: '16px 18px' }),
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  factorLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    lineHeight: 1.3,
  },
  factorSub: {
    fontSize: 12,
    color: C.dim,
    lineHeight: 1.5,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.02em',
  },

  // ─ sidebar Quartier
  quartierSide: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sideCard: (col) => ({
    ...glass({
      borderRadius: 12,
      padding: '20px 20px',
      borderColor: `${col}25`,
    }),
    borderLeft: `2px solid ${col}`,
  }),
  sideCopy: {
    fontSize: 14,
    lineHeight: 1.65,
    color: C.muted,
    margin: '0 0 12px',
  },

  // ─ grille modules fermés
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: 14,
  },
  moduleCard: (col, open) => ({
    ...glass({
      borderRadius: 12,
      padding: '24px 22px',
      borderColor: open ? `${col}28` : C.border,
    }),
    borderTop: `2px solid ${open ? col : 'rgba(255,255,255,0.06)'}`,
    opacity: open ? 1 : 0.52,
    position: 'relative',
  }),
  moduleIconWrap: (col, open) => ({
    width: 34,
    height: 34,
    borderRadius: 8,
    background: open ? `${col}16` : 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    marginBottom: 14,
    border: `1px solid ${open ? `${col}22` : C.border}`,
    filter: open ? 'none' : 'grayscale(1)',
  }),
  moduleNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.1em',
    color: C.dim,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  moduleName: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 20,
    color: C.text,
    marginBottom: 10,
  },
  moduleBenefit: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.65,
    marginBottom: 14,
  },
  lockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.dim,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 100,
    padding: '4px 10px',
  },
  openBadge: (col) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: col,
  }),

  // ─ upgrade band
  upgradeBand: {
    ...glass({
      borderRadius: 16,
      padding: '44px 48px',
      borderColor: `${C.orange}22`,
    }),
    display: 'grid',
    gridTemplateColumns: '1fr 200px',
    gap: 56,
    alignItems: 'center',
    marginTop: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  upgradeGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${C.orange}1a 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  upgradeEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: C.dim,
    marginBottom: 10,
  },
  upgradeTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 'clamp(22px,2.4vw,30px)',
    lineHeight: 1.2,
    letterSpacing: -0.5,
    color: C.text,
    margin: '0 0 14px',
  },
  upgradeBody: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 1.7,
    margin: 0,
  },
  upgradePriceCol: {
    textAlign: 'center',
    flexShrink: 0,
  },
  upgradePrice: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 52,
    fontWeight: 400,
    color: C.text,
    letterSpacing: -2,
    lineHeight: 1,
    display: 'block',
  },
  upgradePriceSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: '0.04em',
    display: 'block',
    marginBottom: 20,
    marginTop: 4,
  },

  // ─ footer nav
  footerNav: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 48,
    paddingTop: 32,
    borderTop: `1px solid ${C.border}`,
  },

  // ─ footer
  footer: {
    position: 'relative',
    zIndex: 2,
    borderTop: `1px solid ${C.border}`,
  },
  footerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '36px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
  },
  footerBrand: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 20,
    fontStyle: 'italic',
    color: C.text,
    letterSpacing: -0.3,
  },
  footerLinks: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  footerLink: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    textDecoration: 'none',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: '0.04em',
  },
};

// ─── données pour le module Quartier (La Rochelle) ────────────────────────────
// En production, ces données viennent des données utilisateur + Supabase.
// Ici elles sont en dur pour le MVP.
const QUARTIER_FACTORS = [
  {
    label: 'Jours de chaleur extrême',
    val: '34 jours/an en 2050',
    col: C.red,
    src: 'DRIAS / Météo-France · +2,7°C',
  },
  {
    label: 'Risque submersion',
    val: '+31 % en scénario médian',
    col: C.blue,
    src: 'Géorisques / BRGM',
  },
  {
    label: 'Érosion littorale',
    val: 'Recul du trait de côte documenté',
    col: C.blue,
    src: 'Cerema · littoral atlantique',
  },
  {
    label: 'Îlots de chaleur urbains',
    val: 'Quartiers centre exposés',
    col: C.red,
    src: 'INSEE / IGN',
  },
];

const LOCKED_MODULES_IDS = ['logement', 'metier', 'sante', 'mobilite', 'projets'];

export default async function RapportPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);

  const allModules = PRODUCT_MODULES;
  const lockedModules = PRODUCT_MODULES.filter((m) =>
    LOCKED_MODULES_IDS.includes(m.id),
  );

  // Signaux d'aperçu dans le hero panel (3 signaux clés)
  const heroSignals = [
    { label: 'Cadmium dans les sols charentais', src: 'GisSol / RMQS', col: C.orange },
    { label: 'Saison pollinique allongée de 28 jours', src: 'RNSA / Copernicus', col: C.green },
    { label: 'Assurance habitation : +8 à 12 %/an sur le littoral', src: 'ACPR / Banque de France', col: C.blue },
  ];

  return (
    <div style={S.root}>

      {/* ── orbs ─────────────────────────────────────────────────────── */}
      <div style={S.orb({
        width: 540, height: 540,
        background: `radial-gradient(circle, ${C.orange}38 0%, transparent 70%)`,
        top: -160, left: -130,
        filter: 'blur(100px)', opacity: 0.38,
      })} />
      <div style={S.orb({
        width: 420, height: 420,
        background: `radial-gradient(circle, ${C.violet}32 0%, transparent 70%)`,
        bottom: -100, right: -100,
        filter: 'blur(90px)', opacity: 0.28,
      })} />
      <div style={S.orb({
        width: 280, height: 280,
        background: `radial-gradient(circle, ${C.blue}22 0%, transparent 70%)`,
        top: '42%', left: '58%',
        filter: 'blur(70px)', opacity: 0.16,
      })} />

      {/* ── nav ──────────────────────────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link href="/" style={S.brand}>
            futur<span style={{ color: C.orange, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div style={S.navLinks}>
            {['Le produit', 'Pages Savoir', 'Tarifs'].map((l) => (
              <a key={l} style={S.navLink} href="#">{l}</a>
            ))}
          </div>
          <div style={S.navActions}>
            <Link href="/compte" style={S.navSecondary}>Mon compte</Link>
            <Link href="/dashboard" style={S.navCta}>Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* ── stage ────────────────────────────────────────────────────── */}
      <div style={S.stage}>

        {/* ══════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════ */}
        <section style={S.hero}>
          <div>
            <div style={S.eyebrow}>
              <span style={S.eyebrowDot} />
              {fullReport ? 'Rapport complet' : 'Rapport partiel'}
            </div>

            {fullReport ? (
              <>
                <h1 style={S.h1}>
                  Votre vie à La Rochelle<br />
                  <span style={{ fontStyle: 'italic', color: C.orange }}>en 2050, dimension par dimension.</span>
                </h1>
                <p style={S.heroSub}>
                  Les six lectures de votre situation sont ouvertes. Chaque dimension croise vos données avec les projections disponibles pour La Rochelle : ce que les données disent, ce qu&apos;elles ne disent pas encore, et ce qui reste à décider.
                </p>
                <div style={S.heroActions}>
                  <Link href="/dashboard" style={S.btnPrimary}>Voir le dashboard</Link>
                  <Link href="/compte" style={S.btnSecondary}>Mon compte</Link>
                </div>
              </>
            ) : (
              <>
                <h1 style={S.h1}>
                  Ce que La Rochelle devient.<br />
                  <span style={{ fontStyle: 'italic', color: C.orange }}>Les premiers signaux, sans détours.</span>
                </h1>
                <p style={S.heroSub}>
                  Quelques données publiques sur votre territoire suffisent déjà à poser des questions que vous n&apos;auriez peut-être pas pensé à formuler. Ce que vous lisez ici est une première lecture, pas le rapport complet.
                </p>
                <div style={S.heroActions}>
                  <Link href="/#pricing" style={S.btnPrimary}>Ouvrir le rapport complet</Link>
                  <Link href="/compte" style={S.btnSecondary}>Mon compte</Link>
                </div>
              </>
            )}
          </div>

          {/* panel signaux / résumé */}
          <aside style={S.panel(!fullReport)}>
            {!fullReport && (
              <div style={{
                position: 'absolute', top: -50, right: -50,
                width: 160, height: 160, borderRadius: '50%',
                background: `radial-gradient(circle, ${C.orange}15 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
            )}

            <p style={S.panelLabel}>
              {fullReport ? 'Six dimensions ouvertes' : 'Quelques signaux déjà disponibles'}
            </p>
            <h2 style={S.panelTitle}>
              {fullReport
                ? 'Rapport complet · La Rochelle · 2050'
                : 'La Rochelle, ce que les données montrent déjà'}
            </h2>

            {fullReport ? (
              // vue payant : liste des modules courts
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allModules.map((m) => {
                  const col = MODULE_COLORS[m.id] || C.violet;
                  return (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8,
                      background: `${col}0a`, border: `1px solid ${col}1a`,
                    }}>
                      <span style={{ fontSize: 16 }}>{MODULE_ICONS[m.id]}</span>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{m.name}</span>
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10, color: col,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>Ouvert</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // vue gratuit : signaux d'aperçu
              <div style={S.signalList}>
                {heroSignals.map((s) => (
                  <div key={s.label} style={S.signalCard(s.col)}>
                    <span style={S.signalDot(s.col)} />
                    <div>
                      <div style={S.signalTitle}>{s.label}</div>
                      <div style={S.signalSrc}>{s.src}</div>
                    </div>
                  </div>
                ))}
                <p style={{
                  ...S.mono, marginTop: 4, lineHeight: 1.6,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                }}>
                  Le rapport complet lit ces signaux à travers votre profil. Ce n&apos;est pas la même chose que de lire des données brutes.
                </p>
              </div>
            )}
          </aside>
        </section>

        <div style={S.divider} />

        {/* ══════════════════════════════════════════════════════════════
            VUE GRATUIT
        ══════════════════════════════════════════════════════════════ */}
        {!fullReport && (
          <>
            {/* ── Module Quartier : ouvert ── */}
            <section style={S.section}>
              <div style={S.bandHead}>
                <div>
                  <p style={S.sectionLabel}>Ce que votre territoire devient</p>
                  <h2 style={S.sectionTitle}>
                    Quartier : la lecture ouverte.
                  </h2>
                </div>
                <p style={S.sectionSub}>
                  Ce module lit ce qui se passe autour de chez vous : chaleur, eau, littoral, cadre de vie. Les données sont publiques. La lecture, elle, est posée pour La Rochelle.
                </p>
              </div>

              <div style={S.quartierWrap}>
                {/* carte principale */}
                <div style={S.quartierMain}>
                  <h3 style={S.quartierTitle}>
                    La Rochelle, à l&apos;horizon 2050 dans le scénario médian.
                  </h3>
                  <p style={S.quartierBody}>
                    La chaleur d&apos;abord : La Rochelle passera de 5 à 34 jours par an en alerte canicule d&apos;ici 2050, dans le scénario à +2,7°C (DRIAS / Météo-France). Ce n&apos;est pas une projection lointaine. Ce sont des étés qui changent de texture.
                  </p>
                  <p style={S.quartierBody}>
                    Le littoral ensuite. Le risque de submersion progresse de 31 % en scénario médian selon Géorisques. Les quartiers des Minimes et d&apos;Aytré concentrent l&apos;exposition. Le centre historique et les zones en hauteur sont moins concernés, ce qui n&apos;est pas le même territoire.
                  </p>
                  <p style={{ ...S.quartierBody, marginBottom: 0 }}>
                    Ce module donne une lecture de ce qui change autour de chez vous. Ce qu&apos;il ne fait pas encore : lire comment ces changements croisent votre logement précis, votre santé, votre métier. C&apos;est ce que le rapport complet articule.
                  </p>

                  <div style={S.factorGrid}>
                    {QUARTIER_FACTORS.map((f) => (
                      <div key={f.label} style={S.factorCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: f.col, boxShadow: `0 0 6px ${f.col}`,
                            flexShrink: 0,
                          }} />
                          <span style={S.factorLabel}>{f.label}</span>
                        </div>
                        <span style={{ ...S.factorSub, color: f.col, marginLeft: 14 }}>{f.val}</span>
                        <span style={{ ...S.factorSub, marginLeft: 14 }}>{f.src}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/compte#quartier" style={S.btnPrimary}>
                    Compléter ce module dans mon compte
                  </Link>
                </div>

                {/* sidebar */}
                <div style={S.quartierSide}>
                  <div style={S.sideCard(C.orange)}>
                    <p style={{ ...S.panelLabel, marginBottom: 8 }}>Ce que le rapport complet ajoute</p>
                    <p style={S.sideCopy}>
                      Le module Quartier seul donne la lecture du territoire. Le rapport complet croise ces signaux avec votre logement, votre santé et votre mode de vie. C&apos;est là que la lecture devient personnelle.
                    </p>
                    <Link href="/#pricing" style={{ ...S.btnPrimary, fontSize: 13, padding: '10px 20px' }}>
                      Voir les formules
                    </Link>
                  </div>

                  <div style={S.sideCard(C.blue)}>
                    <p style={{ ...S.panelLabel, marginBottom: 8 }}>Pages Savoir associées</p>
                    <p style={S.sideCopy}>
                      Trois lectures de fond sur les sujets que ce module touche, accessibles gratuitement.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'La submersion côtière', href: '/savoir/submersion-cotiere' },
                        { label: 'Comprendre le DPE de votre logement', href: '/savoir/dpe-logement' },
                        { label: 'Le cadmium dans l\'alimentation', href: '/savoir/cadmium-alimentation' },
                      ].map((p) => (
                        <Link key={p.href} href={p.href} style={{
                          fontSize: 13, color: C.blue,
                          textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <span style={{ opacity: 0.6 }}>→</span>
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Les cinq dimensions fermées ── */}
            <section style={{ paddingTop: 8 }}>
              <div style={S.bandHead}>
                <div>
                  <p style={S.sectionLabel}>Cinq lectures fermées</p>
                  <h2 style={S.sectionTitle}>
                    Ce que le rapport complet lit pour vous.
                  </h2>
                </div>
                <p style={S.sectionSub}>
                  Chaque dimension croise votre profil avec les données publiques disponibles pour La Rochelle. Ce ne sont pas des généralités sur le climat : c&apos;est votre situation.
                </p>
              </div>

              <div style={S.modulesGrid}>
                {lockedModules.map((module, i) => {
                  const col = MODULE_COLORS[module.id] || C.violet;
                  const benefit = MODULE_BENEFIT[module.id] || module.summary;
                  return (
                    <article key={module.id} style={S.moduleCard(col, false)}>
                      <div style={S.moduleIconWrap(col, false)}>
                        {MODULE_ICONS[module.id]}
                      </div>
                      <p style={S.moduleNum}>Module 0{i + 2}</p>
                      <h3 style={{ ...S.moduleName, color: C.muted }}>{module.name}</h3>
                      <p style={{ ...S.moduleBenefit, opacity: 0.7 }}>{benefit}</p>
                      <span style={S.lockBadge}>Fermé</span>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ── upgrade band ── */}
            <div style={S.upgradeBand}>
              <div style={S.upgradeGlow} />
              <div>
                <p style={S.upgradeEyebrow}>Rapport complet</p>
                <h2 style={S.upgradeTitle}>
                  Six lectures de votre vie à La Rochelle. Sourcées. Sans généralités.
                </h2>
                <p style={S.upgradeBody}>
                  Logement, métier, santé, mobilité, projets : le rapport complet lit chacune de ces dimensions à travers votre profil et les données publiques disponibles pour votre commune. Ce que vous ne trouvez pas en cherchant vous-même, parce que les données sont dispersées dans des dizaines de sources différentes.
                </p>
              </div>
              <div style={S.upgradePriceCol}>
                <span style={S.upgradePrice}>
                  14<span style={{ fontSize: 22, color: C.dim, letterSpacing: 0 }}>€</span>
                </span>
                <span style={S.upgradePriceSub}>une fois · ou 9 €/mois</span>
                <Link
                  href="/#pricing"
                  style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}
                >
                  Voir les formules
                </Link>
                <p style={{ ...S.mono, marginTop: 10, textAlign: 'center', lineHeight: 1.6 }}>
                  Les 14 € sont déductibles si vous passez en Suivi mensuel.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VUE PAYANT
        ══════════════════════════════════════════════════════════════ */}
        {fullReport && (
          <section style={S.section}>
            <div style={S.bandHead}>
              <div>
                <p style={S.sectionLabel}>Six lectures ouvertes</p>
                <h2 style={S.sectionTitle}>
                  Votre situation à La Rochelle, dimension par dimension.
                </h2>
              </div>
              <p style={S.sectionSub}>
                Chaque module lit un angle de votre vie à travers les données publiques disponibles pour La Rochelle. Sans score synthétique : les arbitrages restent les vôtres.
              </p>
            </div>

            <div style={S.modulesGrid}>
              {allModules.map((module, i) => {
                const col = MODULE_COLORS[module.id] || C.violet;
                const benefit = MODULE_BENEFIT[module.id] || module.summary;
                return (
                  <article key={module.id} style={S.moduleCard(col, true)}>
                    <div style={S.moduleIconWrap(col, true)}>
                      {MODULE_ICONS[module.id]}
                    </div>
                    <p style={S.moduleNum}>Module 0{i + 1}</p>
                    <h3 style={S.moduleName}>{module.name}</h3>
                    <p style={S.moduleBenefit}>{benefit}</p>
                    <span style={S.openBadge(col)}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: col, boxShadow: `0 0 6px ${col}`,
                        display: 'inline-block', flexShrink: 0,
                      }} />
                      Ouvert
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── nav bas de page ────────────────────────────────────────── */}
        <div style={S.footerNav}>
          <Link href="/compte" style={S.btnSecondary}>← Retour au compte</Link>
          <Link href="/dashboard" style={S.btnPrimary}>Voir le dashboard →</Link>
        </div>
      </div>

      {/* ── footer ───────────────────────────────────────────────────── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerBrand}>
            futur<span style={{ color: C.orange, fontStyle: 'normal' }}>•</span>e
          </div>
          <div style={S.footerLinks}>
            {['Manifeste', 'Méthodologie', 'Pages Savoir', 'Contact', 'Mentions légales'].map((l) => (
              <a key={l} style={S.footerLink} href="#">{l}</a>
            ))}
          </div>
          <div style={S.mono}>Données publiques françaises · Aucune publicité</div>
        </div>
      </footer>
    </div>
  );
}
