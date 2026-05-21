import Link from "next/link";
import type { Metadata } from "next";
import { CookieSettingsLink } from "@/components/CookieSettingsLink";

export const metadata: Metadata = {
  title: "Politique de confidentialité — futur•e",
  description: "Comment futur•e collecte, utilise et protège vos données personnelles.",
};

const LAST_UPDATED = "22 mai 2026";

const NO_SELL_NOTICE = "futur•e ne revend jamais les données personnelles de ses utilisateurs et ne les utilise pas à des fins de publicité comportementale.";

const PROCESSORS = [
  { name: "Supabase", role: "Base de données et authentification", location: "États-Unis — clauses contractuelles types UE", link: "https://supabase.com/privacy" },
  { name: "Vercel", role: "Hébergement et diffusion du site", location: "États-Unis — clauses contractuelles types UE", link: "https://vercel.com/legal/privacy-policy" },
  { name: "Stripe", role: "Traitement des paiements", location: "États-Unis — clauses contractuelles types UE", link: "https://stripe.com/fr/privacy" },
  { name: "Google (GA4 + GTM)", role: "Mesure d'audience (avec consentement)", location: "États-Unis — clauses contractuelles types UE", link: "https://policies.google.com/privacy" },
  { name: "PostHog", role: "Analytics produit (avec consentement)", location: "Union Européenne", link: "https://posthog.com/privacy" },
  { name: "Microsoft Clarity", role: "Enregistrements de session (avec consentement)", location: "États-Unis — clauses contractuelles types UE", link: "https://privacy.microsoft.com/fr-fr/privacystatement" },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg-1)",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      {/* Nav minimale */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 860,
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 22,
            fontStyle: "italic",
            color: "var(--fg-1)",
            textDecoration: "none",
          }}
        >
          futur<span style={{ color: "var(--orange)", fontStyle: "normal" }}>•</span>e
        </Link>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-3)",
            textDecoration: "none",
          }}
        >
          ← Retour
        </Link>
      </header>

      <main style={{ maxWidth: 700, margin: "0 auto", padding: "64px 24px 120px" }}>

        {/* En-tête */}
        <div style={{ marginBottom: 56 }}>
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              margin: "0 0 16px",
            }}
          >
            Dernière mise à jour : {LAST_UPDATED}
          </p>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.8px",
              margin: "0 0 20px",
              color: "var(--fg-hi, #fff)",
            }}
          >
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--fg-2)", margin: 0, maxWidth: 580 }}>
            futur•e est un outil de projection climatique personnelle. Ce document explique quelles données sont collectées, pourquoi, et comment les supprimer si vous le souhaitez.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          {/* Responsable */}
          <Section title="Responsable du traitement">
            <p>
              Les données collectées sur futur•e sont traitées par :
            </p>
            <InfoBlock>
              <InfoRow label="Nom" value="Quentin Brache" />
              <InfoRow label="Structure" value="Micro-entreprise futur·e" />
              <InfoRow label="SIREN" value="105 109 557" />
              <InfoRow label="Adresse" value="1 rue Saint Dominique, 17000 La Rochelle" />
              <InfoRow label="Contact" value="hello@futur-e.fr" />
            </InfoBlock>
          </Section>

          {/* Données collectées */}
          <Section title="Données collectées">
            <p>futur•e collecte uniquement ce dont le service a besoin pour fonctionner :</p>
            <p style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 14 }}>
              {NO_SELL_NOTICE}
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: "var(--fg-2)", margin: "16px 0 0" }}>
              <li><strong style={{ color: "var(--fg-1)" }}>Email et mot de passe</strong> — pour créer et accéder à votre compte.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Commune de référence</strong> — pour personnaliser les projections climatiques.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Réponses au questionnaire</strong> — logement, mobilité, confort de vie, environnement personnel et projets. Elles restent dans votre espace et ne sont jamais revendues.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Données de paiement</strong> — traitées directement par Stripe. futur•e ne voit ni ne stocke vos coordonnées bancaires.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Données de navigation</strong> — uniquement si vous avez donné votre consentement via la bannière.</li>
            </ul>
          </Section>

          {/* Finalités */}
          <Section title="Pourquoi ces données sont utilisées">
            <Table
              rows={[
                ["Fournir le rapport personnalisé", "Email, commune, réponses", "Exécution du contrat"],
                ["Gérer votre compte et l'authentification", "Email", "Exécution du contrat"],
                ["Traiter le paiement", "Données de paiement (Stripe)", "Exécution du contrat"],
                ["Mesurer l'audience et améliorer le service", "Navigation, événements", "Consentement"],
                ["Enregistrements de session et heatmaps", "Navigation (Clarity)", "Consentement"],
              ]}
            />
          </Section>

          {/* Conservation */}
          <Section title="Conservation des données">
            <p>
              Les données de votre compte sont conservées tant que celui-ci est actif. En cas d'inactivité prolongée, elles sont supprimées au bout de <strong style={{ color: "var(--fg-1)" }}>4 ans</strong>. Vous pouvez demander la suppression à tout moment en écrivant à <a href="mailto:hello@futur-e.fr" style={{ color: "var(--orange)" }}>hello@futur-e.fr</a>.
            </p>
            <p>
              Les données de navigation collectées via les outils analytiques (avec consentement) suivent les politiques de conservation propres à chaque outil, généralement entre 13 et 24 mois.
            </p>
          </Section>

          {/* Sous-traitants */}
          <Section title="Sous-traitants et transferts">
            <p>futur•e fait appel aux services suivants. Tous disposent de garanties contractuelles conformes au RGPD (clauses contractuelles types ou décision d'adéquation) :</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 16, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              {PROCESSORS.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                    padding: "12px 16px",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    fontSize: 13,
                    alignItems: "center",
                  }}
                >
                  <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--fg-1)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 500 }}>{p.name}</a>
                  <span style={{ color: "var(--fg-3)" }}>{p.role}</span>
                  <span style={{ color: "var(--fg-3)", fontSize: 12 }}>{p.location}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Cookies */}
          <Section title="Cookies et traceurs">
            <p>
              Par défaut, aucun cookie de mesure ou de publicité n'est déposé sur votre navigateur. La bannière affichée à votre première visite vous permet d'accepter ou de refuser ces traceurs.
            </p>
            <p>
              Un cookie technique (<code style={{ fontFamily: "monospace", fontSize: 13, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>futuree-consent</code>) est utilisé pour mémoriser votre choix. Il ne contient aucune donnée personnelle.
            </p>
            <p>
              Vous pouvez modifier votre choix à tout moment depuis le lien{" "}
              <CookieSettingsLink style={{ color: "var(--orange)", fontFamily: "inherit", fontSize: "inherit" }} />{" "}
              disponible en bas de chaque page.
            </p>
          </Section>

          {/* Session recordings */}
          <Section title="Enregistrements de session">
            <p>
              Avec votre consentement, futur•e utilise Microsoft Clarity pour enregistrer des sessions de navigation anonymisées (mouvements, clics, scroll). Ces enregistrements servent uniquement à améliorer l'ergonomie du service.
            </p>
            <p>
              Les enregistrements de session <strong style={{ color: "var(--fg-1)" }}>ne permettent pas de voir les mots de passe, les données bancaires ou tout champ sensible saisi</strong> — ces éléments sont masqués automatiquement avant transmission.
            </p>
          </Section>

          {/* Mineurs */}
          <Section title="Âge minimum">
            <p>
              futur•e n'est pas destiné aux personnes de moins de 15 ans. Si vous êtes parent et pensez que votre enfant a créé un compte, contactez-nous à <a href="mailto:hello@futur-e.fr" style={{ color: "var(--orange)" }}>hello@futur-e.fr</a> pour le supprimer.
            </p>
          </Section>

          {/* Droits */}
          <Section title="Vos droits">
            <p>Conformément au RGPD, vous disposez des droits suivants sur vos données :</p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: "var(--fg-2)", margin: "12px 0 0" }}>
              <li><strong style={{ color: "var(--fg-1)" }}>Accès</strong> — obtenir une copie de vos données.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Rectification</strong> — corriger des données inexactes.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Effacement</strong> — supprimer votre compte et vos données.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Portabilité</strong> — recevoir vos données dans un format lisible.</li>
              <li><strong style={{ color: "var(--fg-1)" }}>Opposition</strong> — refuser certains traitements.</li>
            </ul>
            <p style={{ marginTop: 20 }}>
              Pour exercer ces droits : <a href="mailto:hello@futur-e.fr" style={{ color: "var(--orange)" }}>hello@futur-e.fr</a>. En cas de désaccord persistant, vous pouvez saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange)" }}>CNIL</a>.
            </p>
          </Section>

        </div>
      </main>
    </div>
  );
}

/* ── Composants locaux ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "-0.2px",
          color: "var(--fg-hi, #fff)",
          margin: "0 0 16px",
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--fg-2)" }}>
        {children}
      </div>
    </section>
  );
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontSize: 14,
      }}
    >
      <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", paddingTop: 2 }}>{label}</span>
      <span style={{ color: "var(--fg-1)" }}>{value}</span>
    </div>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", padding: "8px 16px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {["Finalité", "Données concernées", "Base légale"].map((h) => (
          <span key={h} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)" }}>{h}</span>
        ))}
      </div>
      {rows.map(([finalite, donnees, base], i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1fr",
            padding: "11px 16px",
            background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            fontSize: 13,
            gap: 12,
            borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}
        >
          <span style={{ color: "var(--fg-1)" }}>{finalite}</span>
          <span style={{ color: "var(--fg-3)" }}>{donnees}</span>
          <span style={{ color: "var(--fg-3)" }}>{base}</span>
        </div>
      ))}
    </div>
  );
}
