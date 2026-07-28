import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CheckoutPaymentPanel } from "@/components/CheckoutPaymentPanel";
import { getCheckoutProduct, type CheckoutProductSlug } from "@/lib/checkout-products";
import { createClient } from "@/lib/supabase/server";
import { CheckoutViewedTracker } from "./CheckoutViewedTracker";

type Theme = {
  accent: string;
  accentSoft: string;
  accentTint: string;
  accentRing: string;
  accentGlow: string;
  orb: string;
  status: string;
};

const THEMES: Record<CheckoutProductSlug, Theme> = {
  "rapport-complet": {
    accent: "var(--green)",
    accentSoft: "var(--green-soft)",
    accentTint: "var(--green-tint)",
    accentRing: "rgba(74,222,128,0.36)",
    accentGlow: "rgba(74,222,128,0.16)",
    orb: "rgba(74,222,128,0.32)",
    status: "Disponible maintenant",
  },
};

const COPY: Record<CheckoutProductSlug, {
  kicker: string;
  hero: { line1: string; line2: string };
  promise: string;
  whatYouGet: { n: string; title: string; body: string }[];
  timeline: { n: string; title: string; body: string }[];
  faqs: { q: string; a: string }[];
  notIncluded?: string[];
}> = {
  "rapport-complet": {
    kicker: "Rapport interactif · 14 € une fois",
    hero: { line1: "Votre futur,", line2: "posé sur la table." },
    promise: "Un rapport interactif intégral, six modules personnalisés à partir de votre commune et de votre profil. Téléchargeable, à conserver.",
    whatYouGet: [
      { n: "01", title: "Rapport interactif personnalisé", body: "Six modules interactifs : territoire, logement, métier, santé, mobilité, projets. Écrits pour vous, sourcés sur les données publiques (DRIAS, INSEE, Géorisques, IREP). Export PDF inclus." },
      { n: "02", title: "Dashboard simplifié", body: "Vos indicateurs clés en lecture seule, accessibles à tout moment depuis votre espace futur•e." },
      { n: "03", title: "Régénération annuelle", body: "Une mise à jour du rapport interactif par an, incluse, pour suivre l'évolution de votre territoire." },
    ],
    timeline: [
      { n: "01", title: "Paiement sécurisé", body: "Stripe, moins de 2 minutes, carte bancaire ou Apple/Google Pay." },
      { n: "02", title: "Génération du rapport interactif", body: "Votre rapport interactif est produit puis envoyé par email sous 24 heures ouvrées." },
      { n: "03", title: "Accès permanent", body: "Téléchargeable depuis votre espace, exportable en PDF, partageable en lien temporaire." },
    ],
    faqs: [
      { q: "Le rapport interactif est-il vraiment personnalisé ?", a: "Oui. Chaque module est construit à partir de votre commune, votre profil de risque et vos réponses au wizard. Deux foyers d'une même ville obtiennent deux rapports différents." },
      { q: "Combien de temps avant de le recevoir ?", a: "Sous 24 heures ouvrées. La plupart des rapports sont produits en quelques minutes ; nous gardons 24 h pour les périodes de forte demande." },
      { q: "Mes données sont-elles vendues ?", a: "Jamais. Les données issues du wizard restent dans votre espace. Voir notre politique RGPD." },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product: slug } = await params;
  const product = getCheckoutProduct(slug);
  if (!product) return { title: "futur•e" };
  return {
    title: `${product.title} · futur•e`,
    description: product.subtitle,
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: productSlug } = await params;
  const product = getCheckoutProduct(productSlug);

  if (!product) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const checkoutPath = `/checkout/${product.slug}`;
  const theme = THEMES[product.slug];
  const copy = COPY[product.slug];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg-1)",
        position: "relative",
        overflowX: "hidden",
        fontFamily: "var(--font-sans)",
      }}
    >
      <style>{`
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.16) translate(40px, -20px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 ${theme.accentRing}; }
          50%      { opacity: 0.85; box-shadow: 0 0 0 10px rgba(0,0,0,0); }
        }
        .checkout-orb  { animation: orbBreathe 20s ease-in-out infinite; }
        .checkout-fadeup { opacity: 0; animation: fadeUp 0.7s var(--ease) forwards; }
        .checkout-dot  { animation: pulseDot 2.4s ease-in-out infinite; }
        details.checkout-faq[open] summary .faq-chev { transform: rotate(180deg); }
        details.checkout-faq summary { list-style: none; cursor: pointer; }
        details.checkout-faq summary::-webkit-details-marker { display: none; }
        @media (max-width: 980px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-aside { position: static !important; }
          .checkout-timeline { grid-template-columns: 1fr !important; }
          .checkout-features { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .checkout-orb, .checkout-fadeup, .checkout-dot { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      {/* Orbs */}
      <div
        aria-hidden
        className="checkout-orb"
        style={{
          position: "absolute",
          top: -200,
          right: -160,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.orb} 0%, transparent 70%)`,
          filter: "blur(var(--blur-orb))",
          opacity: "var(--orb-opacity)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 480,
          left: -180,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--orb-violet) 0%, transparent 70%)",
          filter: "blur(var(--blur-orb))",
          opacity: "calc(var(--orb-opacity) * 0.7)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <CheckoutViewedTracker productSlug={product.slug} amount={product.amount} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />

        <main style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 24px 120px" }}>
          {/* Back link */}
          <Link
            href="/#pricing"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-kicker)",
              letterSpacing: "var(--tracking-kicker)",
              color: "var(--fg-4)",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "color var(--dur-base) var(--ease)",
              display: "inline-block",
              marginBottom: 28,
            }}
          >
            ← Retour aux tarifs
          </Link>

          {/* Hero band */}
          <section
            className="checkout-fadeup"
            style={{
              animationDelay: "0.05s",
              marginBottom: 56,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                background: theme.accentTint,
                border: `1px solid ${theme.accentRing}`,
                borderRadius: "var(--radius-pill)",
                marginBottom: 24,
              }}
            >
              <span
                className="checkout-dot"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: theme.accent,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-kicker)",
                  letterSpacing: "var(--tracking-kicker)",
                  textTransform: "uppercase",
                  color: theme.accent,
                }}
              >
                {theme.status}
              </span>
              <span
                style={{
                  width: 1,
                  height: 12,
                  background: "var(--border-2)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-kicker)",
                  letterSpacing: "var(--tracking-kicker)",
                  textTransform: "uppercase",
                  color: "var(--fg-3)",
                }}
              >
                {copy.kicker}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "var(--fs-display-lg)",
                lineHeight: "var(--lh-display)",
                letterSpacing: "var(--tracking-tight)",
                margin: "0 0 22px",
                color: "var(--fg-hi)",
                maxWidth: 880,
              }}
            >
              {copy.hero.line1}
              <br />
              <span style={{ fontStyle: "italic", color: theme.accent }}>
                {copy.hero.line2}
              </span>
            </h1>

            <p
              style={{
                fontSize: "var(--fs-body-lg)",
                lineHeight: "var(--lh-body)",
                color: "var(--fg-2)",
                maxWidth: 680,
                margin: 0,
              }}
            >
              {copy.promise}
            </p>
          </section>

          {/* Main grid */}
          <div
            className="checkout-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              gap: 40,
              alignItems: "start",
            }}
          >
            {/* LEFT — Value props */}
            <div>
              <section
                className="checkout-fadeup"
                style={{ animationDelay: "0.15s", marginBottom: 64 }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-kicker)",
                    letterSpacing: "var(--tracking-kicker)",
                    textTransform: "uppercase",
                    color: theme.accent,
                    margin: "0 0 14px",
                  }}
                >
                  Ce que vous obtenez
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "var(--fs-h3)",
                    lineHeight: "var(--lh-title)",
                    letterSpacing: "var(--tracking-display)",
                    margin: "0 0 28px",
                    color: "var(--fg-hi)",
                  }}
                >
                  Tout ce qu&apos;il vous faut pour décider.
                </h2>

                <div
                  className="checkout-features"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 16,
                  }}
                >
                  {copy.whatYouGet.map((item, i) => (
                    <article
                      key={item.n}
                      className="checkout-fadeup"
                      style={{
                        animationDelay: `${0.2 + i * 0.05}s`,
                        background: "var(--bg-elev)",
                        border: "1px solid var(--border-1)",
                        borderRadius: "var(--radius-2xl)",
                        padding: "24px 22px",
                        backdropFilter: "blur(var(--blur-sm))",
                        WebkitBackdropFilter: "blur(var(--blur-sm))",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--fs-kicker)",
                          letterSpacing: "var(--tracking-kicker)",
                          color: theme.accent,
                          marginBottom: 12,
                        }}
                      >
                        {item.n}
                      </div>
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 22,
                          lineHeight: 1.2,
                          letterSpacing: "var(--tracking-display)",
                          margin: "0 0 10px",
                          color: "var(--fg-hi)",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "var(--fs-body-sm)",
                          lineHeight: "var(--lh-body)",
                          color: "var(--fg-3)",
                          margin: 0,
                        }}
                      >
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              {/* Timeline */}
              <section
                className="checkout-fadeup"
                style={{ animationDelay: "0.3s", marginBottom: 64 }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-kicker)",
                    letterSpacing: "var(--tracking-kicker)",
                    textTransform: "uppercase",
                    color: "var(--fg-4)",
                    margin: "0 0 14px",
                  }}
                >
                  Comment ça se passe
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "var(--fs-h4)",
                    lineHeight: "var(--lh-title)",
                    letterSpacing: "var(--tracking-display)",
                    margin: "0 0 28px",
                    color: "var(--fg-hi)",
                  }}
                >
                  Trois étapes, rien de plus.
                </h2>

                <ol
                  className="checkout-timeline"
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                  }}
                >
                  {copy.timeline.map((step, i) => (
                    <li
                      key={step.n}
                      style={{
                        position: "relative",
                        padding: "22px 20px",
                        background: "var(--bg-elev-2)",
                        border: "1px solid var(--border-1)",
                        borderLeft: `2px solid ${theme.accent}`,
                        borderRadius: "var(--radius-lg)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          color: "var(--fg-4)",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        Étape {String(i + 1).padStart(2, "0")}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 19,
                          lineHeight: 1.25,
                          color: "var(--fg-hi)",
                          margin: "0 0 8px",
                        }}
                      >
                        {step.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: "var(--fg-3)",
                        }}
                      >
                        {step.body}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* FAQ */}
              <section className="checkout-fadeup" style={{ animationDelay: "0.4s" }}>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-kicker)",
                    letterSpacing: "var(--tracking-kicker)",
                    textTransform: "uppercase",
                    color: "var(--fg-4)",
                    margin: "0 0 14px",
                  }}
                >
                  Questions fréquentes
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "var(--fs-h4)",
                    lineHeight: "var(--lh-title)",
                    letterSpacing: "var(--tracking-display)",
                    margin: "0 0 24px",
                    color: "var(--fg-hi)",
                  }}
                >
                  Vous vous demandiez peut-être…
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {copy.faqs.map((faq, i) => (
                    <details
                      key={i}
                      className="checkout-faq"
                      style={{
                        background: "var(--bg-elev)",
                        border: "1px solid var(--border-1)",
                        borderRadius: "var(--radius-lg)",
                        padding: "16px 20px",
                      }}
                    >
                      <summary
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 16,
                          fontFamily: "var(--font-sans)",
                          fontSize: 15,
                          color: "var(--fg-1)",
                          fontWeight: 500,
                        }}
                      >
                        <span>{faq.q}</span>
                        <span
                          className="faq-chev"
                          style={{
                            transition: "transform var(--dur-base) var(--ease)",
                            color: theme.accent,
                            fontFamily: "var(--font-mono)",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                          aria-hidden
                        >
                          ▾
                        </span>
                      </summary>
                      <p
                        style={{
                          margin: "12px 0 4px",
                          fontSize: 14,
                          lineHeight: "var(--lh-body)",
                          color: "var(--fg-3)",
                        }}
                      >
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT — Sticky aside */}
            <aside
              className="checkout-aside checkout-fadeup"
              style={{
                animationDelay: "0.2s",
                position: "sticky",
                top: 24,
                background: "var(--bg-card)",
                backdropFilter: "blur(var(--blur-lg))",
                WebkitBackdropFilter: "blur(var(--blur-lg))",
                border: "1px solid var(--border-2)",
                borderRadius: "var(--radius-3xl)",
                padding: "32px 30px",
                boxShadow: `var(--shadow-hero), 0 0 0 1px ${theme.accentGlow}`,
              }}
            >
              {/* Order summary */}
              <div
                style={{
                  paddingBottom: 22,
                  marginBottom: 22,
                  borderBottom: "1px solid var(--border-1)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-kicker)",
                    letterSpacing: "var(--tracking-kicker)",
                    textTransform: "uppercase",
                    color: "var(--fg-4)",
                    margin: "0 0 14px",
                  }}
                >
                  Votre commande
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 16,
                      color: "var(--fg-1)",
                    }}
                  >
                    {product.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 32,
                      lineHeight: 1,
                      color: "var(--fg-hi)",
                      letterSpacing: "var(--tracking-display)",
                    }}
                  >
                    {product.amount}
                    <span style={{ fontSize: 16, color: "var(--fg-3)", marginLeft: 4 }}>€</span>
                  </div>
                </div>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: "var(--fg-4)",
                  }}
                >
                  Paiement unique · TVA non applicable, art. 293 B du CGI
                </p>
              </div>

              {/* Action */}
              {user ? (
                <CheckoutPaymentPanel product={product} userEmail={user.email} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-kicker)",
                      letterSpacing: "var(--tracking-kicker)",
                      textTransform: "uppercase",
                      color: "var(--fg-4)",
                      margin: 0,
                    }}
                  >
                    Avant de payer
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 26,
                      lineHeight: 1.2,
                      letterSpacing: "var(--tracking-display)",
                      margin: 0,
                      color: "var(--fg-hi)",
                    }}
                  >
                    Ouvrez d&apos;abord votre espace.
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: "var(--lh-body)",
                      color: "var(--fg-3)",
                      margin: 0,
                    }}
                  >
                    Le paiement doit être rattaché à un compte pour débloquer votre rapport interactif.
                  </p>
                  <Link
                    href={`/inscription?next=${encodeURIComponent(checkoutPath)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "16px 24px",
                      background: theme.accent,
                      color: "#0b0e1a",
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-label)",
                      letterSpacing: "var(--tracking-kicker)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      boxShadow: "var(--shadow-card)",
                      marginTop: 4,
                    }}
                  >
                    Créer mon compte puis payer
                  </Link>
                  <Link
                    href={`/connexion?next=${encodeURIComponent(checkoutPath)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "14px 24px",
                      border: "1px solid var(--border-2)",
                      color: "var(--fg-2)",
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                    }}
                  >
                    J&apos;ai déjà un compte
                  </Link>
                </div>
              )}

              {/* Trust row */}
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop: "1px solid var(--border-1)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                }}
              >
                <span>Stripe · sécurisé</span>
                <span>TVA non applicable</span>
                <span>Support FR</span>
              </div>
            </aside>
          </div>

          {/* Closing reassurance band */}
          <section
            className="checkout-fadeup"
            style={{
              animationDelay: "0.5s",
              marginTop: 96,
              borderRadius: "var(--radius-band)",
              padding: "48px 40px",
              background: `linear-gradient(135deg, ${theme.accentTint} 0%, var(--bg-elev-2) 60%, transparent 100%)`,
              border: "1px solid var(--border-1)",
              boxShadow: "var(--shadow-band)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "var(--fs-h4)",
                lineHeight: 1.3,
                letterSpacing: "var(--tracking-display)",
                margin: 0,
                color: "var(--fg-hi)",
                maxWidth: 680,
                marginInline: "auto",
              }}
            >
              « Pas une étude de plus. Un rapport interactif pour décider,
              calmement, et à temps. »
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-kicker)",
                letterSpacing: "var(--tracking-kicker)",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                marginTop: 22,
              }}
            >
              futur•e · {product.title}
            </p>
            <p
              style={{
                marginTop: 18,
                fontSize: 13,
                color: "var(--fg-3)",
              }}
            >
              Une question ? Écrivez-nous à{" "}
              <a
                href="mailto:hello@futur-e.fr"
                style={{ color: theme.accent, textDecoration: "none" }}
              >
                hello@futur-e.fr
              </a>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
