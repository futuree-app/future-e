// LE GABARIT DES PAGES LÉGALES, extrait le 04/08/2026.
//
// Il vivait en double dans `/mentions-legales` et `/politique-confidentialite`, avec ce commentaire
// à la fin des deux : « Volontairement dupliqués plutôt que partagés : les deux pages légales sont
// figées, se lisent seules, et un composant commun ferait porter à l'une les évolutions de l'autre.
// Si une troisième page légale arrive (des CGV), les extraire. » Les CGV sont arrivées, et le
// raisonnement s'inverse : à trois exemplaires, c'est la DIVERGENCE qui devient le risque. Trois
// pages légales qui ne se ressemblent plus donnent l'impression de trois sites, au moment précis où
// le lecteur cherche à savoir à qui il achète.
//
// Ces pages restent figées quant à leur CONTENU. Ce qui est partagé ici est leur forme.
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function LegalShell({
  lastUpdated, title, intro, children,
}: {
  lastUpdated: string;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg-1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--border-1)",
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
          aria-label="futur•e, accueil"
          style={{ display: "flex", alignItems: "center", color: "var(--fg-1)", textDecoration: "none" }}
        >
          <Logo height={22} title={null} />
        </Link>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono)",
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
        <div style={{ marginBottom: 56 }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              margin: "0 0 16px",
            }}
          >
            Dernière mise à jour : {lastUpdated}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "var(--text-display)",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "0 0 20px",
              color: "var(--fg-hi, #fff)",
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--fg-2)", margin: 0, maxWidth: 580 }}>
            {intro}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>{children}</div>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--text-section)",
          fontWeight: 400,
          letterSpacing: "-0.2px",
          color: "var(--fg-hi, #fff)",
          margin: "0 0 16px",
          paddingBottom: 12,
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--fg-2)" }}>{children}</div>
    </section>
  );
}

export function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 12,
        border: "1px solid var(--border-1)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-1)",
        fontSize: 14,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--fg-3)",
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ color: "var(--fg-1)" }}>{value}</span>
    </div>
  );
}
