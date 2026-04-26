import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { QuartierWorkbook } from "./QuartierWorkbook";
import {
  canAccessDashboard,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount } from "@/lib/user-account";

// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#060812",
  bgElev: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#e9ecf2",
  muted: "#9ba3b4",
  dim: "#6b7388",
  orange: "#fb923c",
  red: "#f87171",
  violet: "#a78bfa",
  green: "#4ade80",
  blue: "#60a5fa",
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
  quartier: "🏘",
  logement: "🏠",
  metier: "💼",
  sante: "🫁",
  mobilite: "🚗",
  projets: "🗓",
};

// Bénéfice utilisateur de chaque module fermé
const MODULE_BENEFIT: Record<string, string> = {
  logement:
    "Votre logement vaut-il encore ce que vous pensez en 2040 ? DPE, assurance, risques physiques par adresse.",
  metier:
    "Ce que le changement climatique fait à votre secteur. Certains métiers se fragilisent. D'autres gagnent en importance.",
  sante:
    "Cadmium, pollens, chaleur, qualité de l'air. Ce que votre environnement fait à votre corps, données à l'appui.",
  mobilite:
    "Votre dépendance à la voiture est-elle une fragilité ? Une lecture honnête du territoire, pas de l'actualité carburant.",
  projets:
    "Achat, déménagement, retraite. Est-ce que vos projets de vie sont cohérents avec ce que ce lieu va devenir ?",
};

function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: C.bgElev,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${C.border}`,
    ...extra,
  };
}

const S = {
  root: {
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    fontFamily: "'Instrument Sans', sans-serif",
    position: "relative" as const,
    overflow: "hidden",
  },
  orb: (pos: React.CSSProperties): React.CSSProperties => ({
    position: "fixed",
    borderRadius: "50%",
    pointerEvents: "none" as const,
    zIndex: 0,
    ...pos,
  }),
  nav: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: "rgba(6,8,18,0.72)",
    borderBottom: `1px solid ${C.border}`,
  },
  navInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 28px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  brand: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 22,
    fontStyle: "italic",
    color: C.text,
    letterSpacing: -0.3,
    textDecoration: "none",
  },
  navLinks: { display: "flex", alignItems: "center", gap: 32 },
  navLink: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: C.muted,
    textDecoration: "none",
  },
  navActions: { display: "flex", alignItems: "center", gap: 10 },
  navSecondary: {
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    color: C.text,
    textDecoration: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    background: "rgba(255,255,255,0.02)",
  },
  navCta: {
    padding: "8px 20px",
    borderRadius: 6,
    background: C.orange,
    color: C.bg,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    textDecoration: "none",
  },
  stage: {
    position: "relative" as const,
    zIndex: 2,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 28px 96px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 56,
    alignItems: "start",
    padding: "80px 0 64px",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: C.orange,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: C.orange,
    boxShadow: `0 0 12px ${C.orange}`,
    display: "inline-block",
    flexShrink: 0,
  },
  h1: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: "clamp(34px,3.8vw,52px)",
    lineHeight: 1.1,
    letterSpacing: -1.2,
    margin: "0 0 20px",
    color: C.text,
  },
  heroSub: {
    fontSize: 17,
    lineHeight: 1.72,
    color: C.muted,
    margin: "0 0 32px",
    maxWidth: 480,
  },
  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    marginBottom: 28,
  },
  chip: {
    padding: "5px 12px",
    borderRadius: 100,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${C.border}`,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: "0.04em",
  },
  heroActions: { display: "flex", gap: 12, flexWrap: "wrap" as const },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    borderRadius: 8,
    background: C.orange,
    color: C.bg,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
    border: "none",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.05)",
    color: C.muted,
    fontFamily: "'Instrument Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
    border: `1px solid ${C.border}`,
  },
  btnGhost: {
    background: "none",
    border: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: C.dim,
    cursor: "pointer",
    textDecoration: "none",
    padding: "8px 0",
  },
  panel: {
    ...glass({ borderRadius: 16, padding: "28px 26px" }),
    position: "relative" as const,
    overflow: "hidden",
  },
  panelLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: C.dim,
    marginBottom: 4,
  },
  panelTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 20,
    lineHeight: 1.2,
    color: C.text,
    margin: "0 0 20px",
    letterSpacing: -0.2,
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    borderRadius: 10,
    overflow: "hidden",
    border: `1px solid ${C.border}`,
    marginBottom: 20,
  },
  metricCell: (last: boolean): React.CSSProperties => ({
    padding: "14px 12px",
    textAlign: "center",
    borderRight: last ? "none" : `1px solid ${C.border}`,
  }),
  metricVal: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 26,
    fontWeight: 400,
    color: C.orange,
    display: "block",
    lineHeight: 1,
    marginBottom: 5,
  } as React.CSSProperties,
  metricLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.08em",
    color: C.dim,
    textTransform: "uppercase" as const,
    lineHeight: 1.4,
  } as React.CSSProperties,
  panelCopy: {
    fontSize: 14,
    lineHeight: 1.7,
    color: C.muted,
    margin: 0,
  } as React.CSSProperties,
  divider: { borderTop: `1px solid ${C.border}` },
  section: { padding: "56px 0 0" } as React.CSSProperties,
  bandHead: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: 40,
    alignItems: "end",
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: C.dim,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: "clamp(22px,2.6vw,32px)",
    lineHeight: 1.18,
    letterSpacing: -0.5,
    margin: "0 0 4px",
    color: C.text,
  },
  sectionSub: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 1.65,
    margin: 0,
  } as React.CSSProperties,
  keepGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 14,
  },
  keepCard: (col: string): React.CSSProperties => ({
    ...glass({ borderRadius: 12, padding: "22px 20px", borderColor: `${col}20` }),
    borderTop: `2px solid ${col}`,
  }),
  keepTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 17,
    color: C.text,
    margin: "0 0 10px",
    lineHeight: 1.3,
  } as React.CSSProperties,
  keepCopy: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 1.65,
    margin: 0,
  } as React.CSSProperties,
  moduleBand: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
    alignItems: "start",
  },
  moduleIntro: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  moduleSubtitle: {
    fontSize: 16,
    lineHeight: 1.75,
    color: C.muted,
    margin: 0,
  } as React.CSSProperties,
  signalStrip: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 7,
  },
  signalPill: (col: string): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: 4,
    background: `${col}14`,
    border: `1px solid ${col}28`,
    fontSize: 11,
    color: col,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap" as const,
  }),
  noteCards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  noteCard: glass({ borderRadius: 10, padding: "16px 18px" }),
  noteCardLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: C.dim,
    marginBottom: 8,
  } as React.CSSProperties,
  noteCardCopy: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.65,
    margin: 0,
  } as React.CSSProperties,
  lockedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
  },
  lockedCard: {
    ...glass({ borderRadius: 12, padding: "20px 18px" }),
    opacity: 0.52,
  },
  lockedIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    marginBottom: 12,
    filter: "grayscale(1)",
  } as React.CSSProperties,
  lockedNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: C.dim,
    marginBottom: 3,
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  lockedName: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 18,
    color: C.muted,
    margin: "0 0 8px",
  } as React.CSSProperties,
  lockedBenefit: {
    fontSize: 12,
    color: C.dim,
    lineHeight: 1.6,
    margin: "0 0 12px",
  } as React.CSSProperties,
  lockBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: C.dim,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${C.border}`,
    borderRadius: 100,
    padding: "3px 8px",
  } as React.CSSProperties,
  upgradeBand: {
    ...glass({
      borderRadius: 16,
      padding: "40px 44px",
      borderColor: `${C.orange}20`,
    }),
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: 48,
    alignItems: "center",
    marginTop: 40,
    position: "relative" as const,
    overflow: "hidden",
  },
  upgradeGlow: {
    position: "absolute" as const,
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${C.orange}15 0%, transparent 70%)`,
    pointerEvents: "none" as const,
  },
  upgradeTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: "clamp(20px,2.2vw,26px)",
    lineHeight: 1.2,
    letterSpacing: -0.4,
    color: C.text,
    margin: "0 0 10px",
  },
  upgradeBody: {
    fontSize: 15,
    color: C.muted,
    lineHeight: 1.7,
    margin: 0,
  } as React.CSSProperties,
  upgradePriceCol: { textAlign: "center" as const },
  upgradePrice: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 44,
    fontWeight: 400,
    color: C.text,
    letterSpacing: -1.5,
    lineHeight: 1,
    display: "block",
  } as React.CSSProperties,
  upgradePriceSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: C.dim,
    letterSpacing: "0.04em",
    display: "block",
    marginBottom: 18,
    marginTop: 4,
  } as React.CSSProperties,
  footerNav: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
    marginTop: 48,
    paddingTop: 28,
    borderTop: `1px solid ${C.border}`,
  },
  footer: {
    position: "relative" as const,
    zIndex: 2,
    borderTop: `1px solid ${C.border}`,
  },
  footerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    flexWrap: "wrap" as const,
  },
  footerBrand: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 20,
    fontStyle: "italic",
    color: C.text,
    letterSpacing: -0.3,
  } as React.CSSProperties,
  footerLinks: { display: "flex", gap: 20, flexWrap: "wrap" as const },
  footerLink: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    textDecoration: "none",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: "0.04em",
  } as React.CSSProperties,
};

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const hasDashboard = canAccessDashboard(account);
  const isInteractive = canAccessInteractiveDashboard(account);

  const QUARTIER_MODULE = PRODUCT_MODULES.find((m) => m.id === "quartier")!;
  const LOCKED_MODULES = PRODUCT_MODULES.filter((m) => m.id !== "quartier");

  return (
    <div style={S.root}>

      {/* ── orbs ── */}
      <div style={S.orb({
        width: 520, height: 520,
        background: `radial-gradient(circle, ${C.orange}38 0%, transparent 70%)`,
        top: -160, left: -130,
        filter: "blur(100px)", opacity: 0.36,
      })} />
      <div style={S.orb({
        width: 400, height: 400,
        background: `radial-gradient(circle, ${C.violet}30 0%, transparent 70%)`,
        bottom: -100, right: -80,
        filter: "blur(88px)", opacity: 0.26,
      })} />
      <div style={S.orb({
        width: 260, height: 260,
        background: `radial-gradient(circle, ${C.blue}20 0%, transparent 70%)`,
        top: "40%", left: "60%",
        filter: "blur(70px)", opacity: 0.15,
      })} />

      {/* ── nav ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link href="/" style={S.brand}>
            futur<span style={{ color: C.orange, fontStyle: "normal" }}>•</span>e
          </Link>
          <div style={S.navLinks}>
            <Link href="/" style={S.navLink}>Le produit</Link>
            <Link href="/savoir" style={S.navLink}>Pages Savoir</Link>
            <Link href="/#pricing" style={S.navLink}>Tarifs</Link>
          </div>
          <div style={S.navActions}>
            <Link href="/rapport" style={S.navSecondary}>Mon rapport</Link>
            <Link href="/#pricing" style={S.navCta}>Passer au complet</Link>
          </div>
        </div>
      </nav>

      {/* ── stage ── */}
      <div style={S.stage}>

        {/* ══════════════ HERO ══════════════════════════════════════════ */}
        <section style={S.hero}>
          <div>
            <div style={S.eyebrow}>
              <span style={S.eyebrowDot} />
              Compte gratuit
            </div>
            <h1 style={S.h1}>
              Votre lecture de La Rochelle<br />
              <span style={{ fontStyle: "italic", color: C.orange }}>ne disparaît plus.</span>
            </h1>
            <p style={S.heroSub}>
              Le rapport partiel est sauvegardé ici, sans limite de temps. Vous pouvez y revenir, le compléter, le partager. La lecture reste ouverte, pas éphémère.
            </p>

            <div style={S.chipRow}>
              <span style={S.chip}>{getPlanLabel(account.plan)}</span>
              <span style={S.chip}>{account.email}</span>
            </div>

            <div style={S.heroActions}>
              <Link href="/rapport" style={S.btnPrimary}>Relire mon rapport</Link>
              <Link href="#quartier" style={S.btnSecondary}>Compléter Quartier</Link>
            </div>
          </div>

          <aside style={S.panel}>
            <p style={S.panelLabel}>Ce que le compte gratuit garde</p>
            <h2 style={S.panelTitle}>Un fil continu, pas un faux dashboard.</h2>
            <div style={S.metricsRow}>
              {[
                { val: "1", label: "ville de référence" },
                { val: "2", label: "dimensions ouvertes" },
                { val: "∞", label: "lecture retrouvable" },
              ].map((m, i) => (
                <div key={m.label} style={S.metricCell(i === 2)}>
                  <span style={S.metricVal}>{m.val}</span>
                  <span style={S.metricLabel}>{m.label}</span>
                </div>
              ))}
            </div>
            <p style={S.panelCopy}>
              Le compte sauvegarde votre rapport dans ce navigateur, fournit un lien de partage permanent et peut signaler une mise à jour si les données changent pour votre commune.
            </p>
          </aside>
        </section>

        <div style={S.divider} />

        {/* ══════════════ CE QUE LE COMPTE GARDE ═══════════════════════ */}
        <section style={S.section}>
          <div style={S.bandHead}>
            <div>
              <p style={S.sectionLabel}>Dans votre accès gratuit</p>
              <h2 style={S.sectionTitle}>Trois choses concrètes que ce compte vous donne.</h2>
            </div>
            <p style={S.sectionSub}>
              Pas un espace vide en attente de paiement. Un point de départ qui reste utile sur la durée.
            </p>
          </div>

          <div style={S.keepGrid}>
            {[
              {
                col: C.orange,
                title: "Rapport sauvegardé sans limite",
                copy: "Vous retrouvez la synthèse globale et le module Quartier sans repasser par la landing. Tant que votre compte existe, votre lecture reste accessible.",
              },
              {
                col: C.blue,
                title: "Lien de partage permanent",
                copy: "La version gratuite peut devenir un support de discussion. Partagez une lecture datée et sourcée sur La Rochelle, sans lien qui expire.",
              },
              {
                col: C.violet,
                title: "Une alerte si les données changent",
                copy: "Si une donnée significative évolue pour votre commune, le compte gratuit peut en donner le signal. Pas du bruit, un fait utile.",
              },
            ].map((k) => (
              <article key={k.title} style={S.keepCard(k.col)}>
                <h3 style={S.keepTitle}>{k.title}</h3>
                <p style={S.keepCopy}>{k.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ══════════════ MODULE QUARTIER ═══════════════════════════════ */}
        <section style={{ padding: "56px 0 0" }} id="quartier">
          <div style={S.bandHead}>
            <div>
              <p style={S.sectionLabel}>Module ouvert</p>
              <h2 style={S.sectionTitle}>
                Quartier : ce que La Rochelle devient autour de vous.
              </h2>
            </div>
            <p style={S.sectionSub}>
              C&apos;est le module le plus immédiat du produit. Chaleur, eau, cadre de vie : les premières tensions d&apos;un territoire qui change.
            </p>
          </div>

          <div style={S.moduleBand}>
            <div style={S.moduleIntro}>
              <p style={S.moduleSubtitle}>
                Le module Quartier lit ce qui se passe à l&apos;échelle du territoire, pas de votre logement. C&apos;est la porte d&apos;entrée naturelle avant de lire Logement, Santé ou Projets : les effets climatiques commencent toujours par le lieu.
              </p>

              <div style={S.signalStrip}>
                {QUARTIER_MODULE.signals.map((signal: string) => (
                  <span key={signal} style={S.signalPill(C.blue)}>{signal}</span>
                ))}
              </div>

              <div style={S.noteCards}>
                <article style={S.noteCard}>
                  <p style={S.noteCardLabel}>Pourquoi commencer ici</p>
                  <p style={S.noteCardCopy}>
                    Le territoire concentre déjà chaleur, eau et cadre de vie. Le lire en premier donne le contexte dans lequel les autres modules prennent leur sens.
                  </p>
                </article>
                <article style={S.noteCard}>
                  <p style={S.noteCardLabel}>Ce que vous ajoutez</p>
                  <p style={S.noteCardCopy}>
                    Vos observations de terrain : comment l&apos;été se vit, ce qui a déjà changé autour de vous. Elles croisent les données sans les remplacer.
                  </p>
                </article>
              </div>
            </div>

            <QuartierWorkbook userKey={account.userId} />
          </div>
        </section>

        {/* ══════════════ MODULES FERMÉS ════════════════════════════════ */}
        <section style={{ padding: "56px 0 0" }}>
          <div style={S.bandHead}>
            <div>
              <p style={S.sectionLabel}>Cinq dimensions fermées</p>
              <h2 style={S.sectionTitle}>Ce que le rapport complet lit pour vous.</h2>
            </div>
            <p style={S.sectionSub}>
              Chaque module croise votre profil avec les données disponibles pour La Rochelle. Ce n&apos;est pas la même chose que de chercher vous-même dans trente sources dispersées.
            </p>
          </div>

          <div style={S.lockedGrid}>
            {LOCKED_MODULES.map((module, i) => {
              const benefit = MODULE_BENEFIT[module.id] ?? module.summary;
              return (
                <article key={module.id} style={S.lockedCard}>
                  <div style={S.lockedIconWrap}>{MODULE_ICONS[module.id]}</div>
                  <p style={S.lockedNum}>Module 0{i + 2}</p>
                  <h3 style={S.lockedName}>{module.name}</h3>
                  <p style={S.lockedBenefit}>{benefit}</p>
                  <span style={S.lockBadge}>Fermé</span>
                </article>
              );
            })}
          </div>

          <div style={S.upgradeBand}>
            <div style={S.upgradeGlow} />
            <div>
              <h2 style={S.upgradeTitle}>
                Six lectures de votre vie à La Rochelle. Sourcées. Personnalisées.
              </h2>
              <p style={S.upgradeBody}>
                Le rapport complet ne produit pas un score. Il garde les dimensions distinctes pour que vos arbitrages restent les vôtres. Ce que vous payez, c&apos;est le temps d&apos;agrégation que vous ne passez pas à chercher seul dans trente sources différentes.
              </p>
            </div>
            <div style={S.upgradePriceCol}>
              <span style={S.upgradePrice}>
                14<span style={{ fontSize: 20, color: C.dim, letterSpacing: 0 }}>€</span>
              </span>
              <span style={S.upgradePriceSub}>une fois · ou 9 €/mois</span>
              <Link
                href="/#pricing"
                style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", boxSizing: "border-box" as const }}
              >
                Voir les formules
              </Link>
              <p style={{ ...S.mono, marginTop: 10, textAlign: "center", lineHeight: 1.6 }}>
                Les 14 € sont déductibles si vous passez en Suivi.
              </p>
            </div>
          </div>
        </section>

        {/* ── nav bas de page ── */}
        <div style={S.footerNav}>
          <Link href="/rapport" style={S.btnPrimary}>Lire mon rapport</Link>
          {hasDashboard && (
            <Link href="/dashboard" style={S.btnSecondary}>
              {isInteractive ? "Dashboard interactif" : "Dashboard"}
            </Link>
          )}
          <Link href="/" style={S.btnGhost as React.CSSProperties}>Retour au site</Link>
          <form action={signOutAction} style={{ marginLeft: "auto" }}>
            <button type="submit" style={S.btnGhost as React.CSSProperties}>Se déconnecter</button>
          </form>
        </div>
      </div>

      {/* ── footer ── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerBrand}>
            futur<span style={{ color: C.orange, fontStyle: "normal" }}>•</span>e
          </div>
          <div style={S.footerLinks}>
            {[
              { label: "Manifeste", href: "/manifeste" },
              { label: "Méthodologie", href: "/methodologie" },
              { label: "Pages Savoir", href: "/savoir" },
              { label: "Contact", href: "/contact" },
              { label: "Mentions légales", href: "/mentions-legales" },
            ].map((l) => (
              <Link key={l.label} href={l.href} style={S.footerLink}>{l.label}</Link>
            ))}
          </div>
          <div style={S.mono}>Données publiques françaises · Aucune publicité</div>
        </div>
      </footer>
    </div>
  );
}
