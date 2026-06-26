import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { FilWaitlistForm } from '@/components/FilWaitlistForm';

export const metadata: Metadata = {
  title: 'Le Fil · Bientôt disponible — futur•e',
  description:
    "Le rapport interactif futur•e devient vivant : dashboard interactif, alertes locales et newsletter mensuelle personnalisée. Inscrivez-vous pour être prévenu·e à l'ouverture.",
  robots: { index: false, follow: false },
};

const FEATURES = [
  {
    kicker: '01',
    title: 'Un dashboard qui respire',
    body: "Vos risques climatiques, vos indicateurs et vos seuils — mis à jour à chaque nouvelle donnée publique. Plus un PDF figé, un tableau de bord vivant.",
  },
  {
    kicker: '02',
    title: 'Des alertes ciblées',
    body: "Canicule prolongée, alerte sécheresse, nouvelle étude DRIAS sur votre département : vous êtes prévenu·e, pas inondé·e de notifications.",
  },
  {
    kicker: '03',
    title: 'Un profil qui évolue',
    body: "Vous déménagez, vous achetez, vous changez de mode de vie : votre profil se met à jour, vos projections aussi.",
  },
  {
    kicker: '04',
    title: 'Une lettre mensuelle pour vous',
    body: "Une newsletter écrite à la main, mais personnalisée : vos territoires, vos risques, vos décisions du moment.",
  },
];

export default function LeFilPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg-1)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <style>{`
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.18) translate(40px, -28px); }
        }
        @keyframes orbBreathe2 {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.12) translate(-30px, 24px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--orange-ring); }
          50%      { opacity: 0.85; box-shadow: 0 0 0 10px rgba(251,146,60,0); }
        }
        .suivi-orb-a { animation: orbBreathe 18s ease-in-out infinite; }
        .suivi-orb-b { animation: orbBreathe2 22s ease-in-out infinite; }
        .suivi-fadeup { opacity: 0; animation: fadeUp 0.8s var(--ease) forwards; }
        .suivi-dot    { animation: pulseDot 2.4s ease-in-out infinite; }
        @media (max-width: 900px) {
          .suivi-grid { grid-template-columns: 1fr !important; }
          .suivi-features { grid-template-columns: 1fr !important; }
          .suivi-hero h1 { font-size: clamp(40px, 9vw, 56px) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .suivi-orb-a, .suivi-orb-b, .suivi-fadeup, .suivi-dot { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      {/* Orbs */}
      <div
        aria-hidden
        className="suivi-orb-a"
        style={{
          position: 'absolute',
          top: -180,
          right: -120,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--orb-orange) 0%, transparent 70%)',
          filter: 'blur(var(--blur-orb))',
          opacity: 'var(--orb-opacity)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        className="suivi-orb-b"
        style={{
          position: 'absolute',
          top: 360,
          left: -200,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--orb-violet) 0%, transparent 70%)',
          filter: 'blur(var(--blur-orb))',
          opacity: 'var(--orb-opacity)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        <main
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '60px 24px 120px',
          }}
        >
          {/* Hero */}
          <section
            className="suivi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: 56,
              alignItems: 'center',
              marginTop: 32,
              marginBottom: 100,
            }}
          >
            <div className="suivi-hero suivi-fadeup" style={{ animationDelay: '0.05s' }}>
              {/* Kicker badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  background: 'var(--orange-tint)',
                  border: '1px solid var(--orange-ring)',
                  borderRadius: 'var(--radius-pill)',
                  marginBottom: 28,
                }}
              >
                <span
                  className="suivi-dot"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--orange)',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--fs-kicker)',
                    letterSpacing: 'var(--tracking-kicker)',
                    textTransform: 'uppercase',
                    color: 'var(--orange)',
                  }}
                >
                  Bientôt disponible
                </span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--fs-display-lg)',
                  lineHeight: 'var(--lh-display)',
                  letterSpacing: 'var(--tracking-tight)',
                  margin: '0 0 24px',
                  color: 'var(--fg-hi)',
                }}
              >
                Le Fil.<br />
                <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>
                  Votre futur, en mouvement.
                </span>
              </h1>

              <p
                style={{
                  fontSize: 'var(--fs-body-lg)',
                  lineHeight: 'var(--lh-body)',
                  color: 'var(--fg-2)',
                  maxWidth: 540,
                  margin: '0 0 36px',
                }}
              >
                Le rapport interactif futur•e ne s'arrête pas à un PDF. Avec Le Fil, il devient
                vivant : un dashboard interactif, des alertes ciblées et une lecture
                mensuelle écrite pour <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--fg-1)' }}>vous</em>,
                pour vos territoires, pour vos décisions.
              </p>

              {/* Prix retiré jusqu'au cadrage de l'offre Le Fil (lancement phase 2) */}
            </div>

            {/* Form card */}
            <aside
              className="suivi-fadeup"
              style={{
                animationDelay: '0.2s',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(var(--blur-lg))',
                WebkitBackdropFilter: 'blur(var(--blur-lg))',
                border: '1px solid var(--border-2)',
                borderRadius: 'var(--radius-3xl)',
                padding: '32px 30px',
                boxShadow: 'var(--shadow-hero)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-kicker)',
                  letterSpacing: 'var(--tracking-kicker)',
                  textTransform: 'uppercase',
                  color: 'var(--fg-4)',
                  margin: '0 0 10px',
                }}
              >
                Liste d'attente — places limitées
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 28,
                  lineHeight: 1.15,
                  letterSpacing: 'var(--tracking-display)',
                  margin: '0 0 22px',
                  color: 'var(--fg-hi)',
                }}
              >
                Soyez prévenu·e en premier.
              </h2>
              <FilWaitlistForm />
            </aside>
          </section>

          {/* Features */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ maxWidth: 680, marginBottom: 48 }}>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--fs-kicker)',
                  letterSpacing: 'var(--tracking-kicker)',
                  textTransform: 'uppercase',
                  color: 'var(--orange)',
                  margin: '0 0 14px',
                }}
              >
                Ce que change Le Fil
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--fs-h2)',
                  lineHeight: 'var(--lh-title)',
                  letterSpacing: 'var(--tracking-display)',
                  margin: 0,
                  color: 'var(--fg-hi)',
                }}
              >
                Un climat qui bouge mérite un outil qui suit.
              </h2>
            </div>

            <div
              className="suivi-features"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 20,
              }}
            >
              {FEATURES.map((f, i) => (
                <article
                  key={f.kicker}
                  className="suivi-fadeup"
                  style={{
                    animationDelay: `${0.15 + i * 0.08}s`,
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: '28px 26px',
                    backdropFilter: 'blur(var(--blur-sm))',
                    WebkitBackdropFilter: 'blur(var(--blur-sm))',
                    transition: 'transform var(--dur-base) var(--ease), border-color var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--fs-kicker)',
                      letterSpacing: 'var(--tracking-kicker)',
                      color: 'var(--orange)',
                      marginBottom: 14,
                    }}
                  >
                    {f.kicker}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 24,
                      lineHeight: 1.2,
                      letterSpacing: 'var(--tracking-display)',
                      margin: '0 0 12px',
                      color: 'var(--fg-hi)',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--fs-body-sm)',
                      lineHeight: 'var(--lh-body)',
                      color: 'var(--fg-3)',
                      margin: 0,
                    }}
                  >
                    {f.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Closing band */}
          <section
            style={{
              borderRadius: 'var(--radius-band)',
              padding: '56px 48px',
              background:
                'linear-gradient(135deg, var(--orange-tint) 0%, var(--bg-elev-2) 60%, transparent 100%)',
              border: '1px solid var(--border-1)',
              boxShadow: 'var(--shadow-band)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'var(--fs-h3)',
                lineHeight: 1.25,
                letterSpacing: 'var(--tracking-display)',
                margin: 0,
                color: 'var(--fg-hi)',
                maxWidth: 720,
                marginInline: 'auto',
              }}
            >
              "Ce n'est plus une projection qu'on consulte. C'est une relation
              qu'on tient avec son territoire."
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-kicker)',
                letterSpacing: 'var(--tracking-kicker)',
                textTransform: 'uppercase',
                color: 'var(--fg-4)',
                marginTop: 22,
              }}
            >
              futur•e · Le Fil
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
