import Link from "next/link";
import type { Metadata } from "next";
import { LEGAL_ENTITY, legalEntityRows } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Mentions légales · futur•e",
  description: "Éditeur, hébergeur et conditions d'utilisation du site futur•e.",
};

const LAST_UPDATED = "30 juillet 2026";

/* L'identité de l'éditeur vit dans `src/lib/legal-entity.ts`, où les FACTURES la lisent aussi.
   Elle était écrite en dur ici : deux copies d'une identité légale divergent tôt ou tard, et
   l'écart se découvre quand un tiers compare une facture à cette page. Toutes ses valeurs viennent
   de l'attestation d'immatriculation au RNE du 18/05/2026. La date de naissance y figure mais
   n'est pas exigée par la LCEN, elle n'est donc pas publiée. */
const EDITEUR = legalEntityRows();

const DIRECTEUR = `${LEGAL_ENTITY.legalName}, en sa qualité d'éditeur.`;

/* Deux prestataires, deux rôles distincts. L'application elle-même est déployée sur Vercel ; le nom
   de domaine et la messagerie sont gérés par OVH. La LCEN demande d'identifier qui héberge, donc
   les deux sont nommés avec leur périmètre plutôt qu'un seul en bloc. */
const HEBERGEURS = [
  {
    role: "Hébergement de l'application et diffusion des pages",
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
    link: "https://vercel.com",
  },
  {
    role: "Nom de domaine et messagerie",
    name: "OVH SAS",
    address: "2 rue Kellermann, 59100 Roubaix, France — téléphone : 1007",
    link: "https://www.ovhcloud.com",
  },
];

const SOURCES = [
  "DRIAS et Météo-France, projections climatiques",
  "INSEE, données de population, d'emploi et de mobilité",
  "Géorisques et le ministère de la Transition écologique, risques déclarés",
  "ADEME, diagnostics de performance énergétique",
  "Base permanente des équipements, accès aux services",
  "OpenStreetMap et ses contributeurs, sous licence ODbL",
];

export default function MentionsLegalesPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg-1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Nav minimale, identique à celle de /politique-confidentialite : les deux pages légales
          forment une paire et doivent se ressembler. */}
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
          style={{
            fontFamily: "var(--font-serif)",
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
            Dernière mise à jour : {LAST_UPDATED}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.8px",
              margin: "0 0 20px",
              color: "var(--fg-hi, #fff)",
            }}
          >
            Mentions légales
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--fg-2)", margin: 0, maxWidth: 580 }}>
            Qui édite ce site, qui l&apos;héberge, et sous quelles conditions ses contenus sont
            réutilisables.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          <Section title="Éditeur du site">
            <InfoBlock>
              {EDITEUR.map(({ label, value }) => (
                <InfoRow key={label} label={label} value={value} />
              ))}
            </InfoBlock>
          </Section>

          <Section title="Directeur de la publication">
            <p>{DIRECTEUR}</p>
          </Section>

          <Section title="Hébergement">
            {HEBERGEURS.map((h) => (
              <div key={h.name} style={{ marginTop: 16 }}>
                <p style={{ margin: "0 0 6px", color: "var(--fg-3)", fontSize: 14 }}>{h.role}</p>
                <InfoBlock>
                  <InfoRow label="Société" value={h.name} />
                  <InfoRow label="Adresse" value={h.address} />
                </InfoBlock>
                <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                  <a href={h.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange)" }}>
                    {h.link.replace("https://", "")}
                  </a>
                </p>
              </div>
            ))}
          </Section>

          <Section title="Données personnelles">
            <p>
              Le traitement des données personnelles, les sous-traitants mobilisés, la durée de
              conservation et les moyens d&apos;exercer vos droits sont décrits dans la{" "}
              <Link href="/politique-confidentialite" style={{ color: "var(--orange)" }}>
                politique de confidentialité
              </Link>
              . Le responsable du traitement y est identifié, et c&apos;est le même éditeur que
              ci-dessus.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Les textes, l&apos;interface, les analyses éditoriales et les méthodes de calcul
              publiées sur futur•e sont la propriété de l&apos;éditeur. Leur reproduction hors des
              usages de citation demande une autorisation écrite.
            </p>
            <p style={{ marginTop: 16 }}>
              Les données sous-jacentes, elles, sont publiques et restent régies par leurs licences
              d&apos;origine. futur•e les croise et les met en récit ; il ne se les approprie pas.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: "var(--fg-2)", margin: "16px 0 0" }}>
              {SOURCES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>

          <Section title="Ce que futur•e ne fait pas">
            <p>
              futur•e produit des projections à partir de données publiques. Ces projections
              éclairent une décision, elles ne la remplacent pas, et elles ne constituent ni un
              diagnostic réglementaire, ni un conseil juridique, financier ou immobilier. Un état
              des risques réglementaire, un diagnostic technique ou une expertise de bien restent à
              demander aux professionnels habilités.
            </p>
          </Section>

          <Section title="Signaler une erreur">
            <p>
              Une donnée fausse, une source mal attribuée, un calcul contestable : écrivez à{" "}
              <a href="mailto:hello@futur-e.fr" style={{ color: "var(--orange)" }}>
                hello@futur-e.fr
              </a>
              . Les corrections sont apportées à la source quand elles sont fondées.
            </p>
          </Section>

        </div>
      </main>
    </div>
  );
}

/* ── Composants locaux ──
   Volontairement dupliqués depuis /politique-confidentialite plutôt que partagés : les deux pages
   légales sont figées, se lisent seules, et un composant commun ferait porter à l'une les
   évolutions de l'autre. Si une troisième page légale arrive (des CGV), les extraire. */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 22,
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
        border: "1px solid var(--border-1)",
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
        borderBottom: "1px solid var(--border-1)",
        fontSize: 14,
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", paddingTop: 2 }}>{label}</span>
      <span style={{ color: "var(--fg-1)" }}>{value}</span>
    </div>
  );
}
