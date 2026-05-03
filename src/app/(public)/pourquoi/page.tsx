import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const C = {
  bg: 'var(--bg)',
  bgElev: 'var(--bg-elev)',
  border: 'var(--border-1)',
  borderHi: 'var(--border-hi)',
  text: 'var(--fg-1)',
  muted: 'var(--fg-3)',
  dim: 'var(--fg-4)',
  accent: 'var(--red)',
  warm: 'var(--orange)',
  violet: 'var(--violet)',
  blue: 'var(--blue)',
};

function glass(extra = {}) {
  return {
    background: C.bgElev,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${C.border}`,
    ...extra,
  };
}

export default function PourquoiPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        @keyframes breathe {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.12) translate(18px, -25px); }
        }
        @keyframes traceLine {
          0%   { opacity: 0; stroke-dashoffset: 400; }
          20%  { opacity: 1; }
          100% { opacity: 1; stroke-dashoffset: 0; }
        }
        @keyframes traceFinal {
          0%   { opacity: 0; stroke-dashoffset: 200; }
          20%  { opacity: 1; }
          100% { opacity: 1; stroke-dashoffset: 0; }
        }
        @keyframes cardIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        .why-orb-2 { animation: breathe 16s ease-in-out infinite; }
        .why-trace-up,
        .why-trace-down,
        .why-trace-final {
          fill: none;
          opacity: 0;
        }
        .why-trace-up,
        .why-trace-down {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
        }
        .why-trace-final {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
        }
        .why-schema-visible .why-trace-up { animation: traceLine 1.6s ease forwards; }
        .why-schema-visible .why-trace-up:nth-of-type(1) { animation-delay: 0.2s; }
        .why-schema-visible .why-trace-up:nth-of-type(2) { animation-delay: 0.35s; }
        .why-schema-visible .why-trace-up:nth-of-type(3) { animation-delay: 0.5s; }
        .why-schema-visible .why-trace-up:nth-of-type(4) { animation-delay: 0.65s; }
        .why-schema-visible .why-trace-up:nth-of-type(5) { animation-delay: 0.8s; }
        .why-schema-visible .why-trace-down { animation: traceLine 1.4s ease forwards; }
        .why-schema-visible .why-trace-down:nth-of-type(1) { animation-delay: 1.1s; }
        .why-schema-visible .why-trace-down:nth-of-type(2) { animation-delay: 1.2s; }
        .why-schema-visible .why-trace-down:nth-of-type(3) { animation-delay: 1.3s; }
        .why-schema-visible .why-trace-down:nth-of-type(4) { animation-delay: 1.4s; }
        .why-schema-visible .why-trace-down:nth-of-type(5) { animation-delay: 1.5s; }
        .why-schema-visible .why-trace-down:nth-of-type(6) { animation-delay: 1.6s; }
        .why-schema-visible .why-trace-final { animation: traceFinal 1.2s ease 2.1s forwards; }
        .why-final-card { opacity: 0; transform: translateY(8px); animation: cardIn 0.7s ease 2.4s forwards; }
        .why-core-pulse { transform-origin: 360px 250px; animation: pulse 3s ease-in-out infinite; }
        @media (max-width: 768px) {
          .why-hero-grid { grid-template-columns: 1fr !important; }
          .why-contrast-grid { grid-template-columns: 1fr !important; }
          .why-schema-footer { grid-template-columns: 1fr !important; }
          .why-page-wrap { padding: 0 20px 100px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .why-orb-2, .why-trace-up, .why-trace-down, .why-trace-final, .why-final-card, .why-core-pulse { animation: none; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          width: 600,
          height: 600,
          borderRadius: '50%',
          filter: 'blur(130px)',
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(circle, #f87171 0%, transparent 70%)',
          top: -180,
          left: -160,
        }}
      />
      <div
        className="why-orb-2"
        style={{
          position: 'fixed',
          width: 500,
          height: 500,
          borderRadius: '50%',
          filter: 'blur(130px)',
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
          bottom: -140,
          right: -120,
        }}
      />
      <div
        style={{
          position: 'fixed',
          width: 400,
          height: 400,
          borderRadius: '50%',
          filter: 'blur(130px)',
          opacity: 0.14,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)',
          top: '55%',
          left: '55%',
        }}
      />

      <Navbar />

      <main
        className="why-page-wrap"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 760,
          margin: '0 auto',
          padding: '0 24px 120px',
        }}
      >
        <section style={{ padding: '72px 0 56px' }}>
          <div
            className="why-hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 320px',
              gap: 28,
              alignItems: 'stretch',
            }}
          >
            <div style={{ paddingTop: 6 }}>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: C.accent,
                  margin: '0 0 24px',
                }}
              >
                Pourquoi futur•e
              </p>
              <h1
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                  fontWeight: 400,
                  lineHeight: 1.18,
                  letterSpacing: '-0.02em',
                  margin: '0 0 28px',
                  maxWidth: 600,
                }}
              >
                De la clarté, <em style={{ color: C.muted, fontStyle: 'italic' }}>sans l&apos;alarme</em>
              </h1>
              <p style={{ fontSize: '1.05rem', color: C.muted, maxWidth: 560, lineHeight: 1.75, margin: 0 }}>
                Cadmium dans les sols, pics de pollution, canicules, inondations :
                l&apos;information existe, mais elle arrive en rafales, sans contexte,
                sans lien avec votre vie réelle. futur•e est là pour faire ce travail.
              </p>
            </div>

            <div
              style={{
                ...glass({
                  borderRadius: 22,
                  padding: 8,
                  borderColor: 'var(--border-1)',
                }),
                position: 'relative',
                overflow: 'hidden',
                minHeight: 500,
                boxShadow: '0 28px 90px rgba(0,0,0,0.32)',
              }}
            >
              <Image
                src="/pourquoi-peau-chaleur.jpg"
                alt="Peau marquée par la chaleur et la transpiration"
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  borderRadius: 14,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 8,
                  borderRadius: 14,
                  background: 'linear-gradient(180deg, rgba(6,8,18,0.01) 0%, rgba(6,8,18,0.06) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </section>

        <div style={{ width: 40, height: 1, background: C.borderHi, margin: '0 0 56px' }} />

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            01 — Le constat
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Trop d&apos;alertes, pas assez de repères
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Chaque semaine, une nouvelle étude sur les pesticides. Chaque été, des cartes de canicule.
            Chaque automne, des rapports sur la qualité de l&apos;air. L&apos;information climatique et
            sanitaire n&apos;a jamais été aussi abondante. Elle n&apos;a jamais été aussi difficile à habiter.
          </p>
          <div style={{ borderLeft: `2px solid rgba(248, 113, 113, 0.25)`, padding: '6px 0 6px 24px', margin: '28px 0' }}>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.15rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              On ne manque pas de données. On manque d&apos;une lecture qui nous concerne vraiment :
              notre commune, notre foyer, notre situation.
            </p>
          </div>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Le changement climatique souffre aussi d&apos;une autre forme d&apos;invisibilité :
            il est oublié par cycles. Chaque été, les canicules et les incendies reviennent
            dans l&apos;actualité. Chaque automne, l&apos;attention s&apos;efface.
          </p>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            futur•e existe pour combler cet intervalle. Une présence calme, continue, qui maintient
            le climat de votre vie dans votre conscience active toute l&apos;année, sans peser, sans
            attendre la prochaine alerte pour redevenir utile.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            02 — Ce que futur•e est
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Une traduction, pas un commentaire
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Les données publiques françaises couvrent déjà la plupart des risques climatiques et sanitaires :
            projections de température, qualité des sols, exposition aux polluants, risques d&apos;inondation,
            qualité de l&apos;eau potable.
          </p>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Elles sont simplement éparpillées entre des dizaines de bases incompatibles, rédigées pour des experts,
            et jamais croisées avec la réalité d&apos;une personne précise dans une commune précise.
          </p>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            futur•e fait ce croisement. Votre commune, votre logement, votre métier, votre situation de santé :
            six modules qui traduisent des données publiques en lecture personnalisée. Chaque affirmation distingue
            ce qui est observé, ce qui est modélisé et ce qui reste incertain.
          </p>

          <div
            className="why-contrast-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              marginTop: 28,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div style={{ ...glass({ padding: 24 }), borderRight: `1px solid ${C.border}` }}>
              <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.dim, marginBottom: 16 }}>
                Ce que nous ne sommes pas
              </span>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  "Un média d'alerte ou d'opinion",
                  'Une ONG déguisée en produit',
                  'Un outil réservé aux experts',
                  'Un générateur de scores ou de classements',
                  "Une machine à produire de l'angoisse",
                ].map((item) => (
                  <li key={item} style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: C.dim }}>–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={glass({ padding: 24 })}>
              <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
                Ce que nous sommes
              </span>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Une lecture personnalisée et localisée',
                  'Une mise en récit sobre des données publiques',
                  'Un outil accessible, sans jargon',
                  'Un suivi mensuel, continu, pour votre foyer',
                  'Un point de départ pour décider, pas une prescription',
                ].map((item) => (
                  <li key={item} style={{ fontSize: 14, color: C.text, lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: C.accent }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            03 — Les données et le suivi
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Des sources publiques. Un suivi dans la durée.
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Toutes les données mobilisées par futur•e sont publiques, françaises et citées systématiquement.
            Projections climatiques DRIAS, données de sols GisSol, polluants atmosphériques ATMO,
            risques naturels Géorisques, données de santé environnementale ANSES et Santé publique France :
            rien qui ne soit vérifiable.
          </p>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Le rapport initial donne une lecture de votre situation aujourd&apos;hui. Mais les données évoluent,
            les risques se précisent, votre vie change. C&apos;est pourquoi futur•e propose un suivi mensuel :
            une newsletter personnalisée pour votre commune, des notifications ciblées quand une donnée qui vous
            concerne évolue, et un tableau de bord que vous pouvez consulter à tout moment.
          </p>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            Le mode foyer permet d&apos;étendre cette lecture à plusieurs personnes du même foyer, chacune avec son profil,
            pour prendre des décisions de vie vraiment éclairées : déménagement, achat immobilier, projet familial,
            préparation à la retraite.
          </p>

          <div
            className="why-schema-visible"
            style={{
              ...glass({
                marginTop: 48,
                padding: '32px 16px',
                borderRadius: 16,
              }),
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim, textAlign: 'center', margin: '0 0 6px' }}>
              Schéma de croisement
            </p>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', fontStyle: 'italic', color: C.muted, textAlign: 'center', margin: '0 0 24px' }}>
              Comment futur•e transforme les données publiques en lecture personnalisée
            </p>

            <svg viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" aria-label="Schéma du fonctionnement de futur•e" style={{ display: 'block', width: '100%', height: 'auto', maxWidth: 720, margin: '0 auto' }}>
              <path d="M 90 195 A 280 280 0 0 1 630 195" stroke="rgba(248, 113, 113, 0.25)" strokeWidth="1" fill="none" strokeDasharray="3 4" />
              <text x="360" y="22" textAnchor="middle" fill={C.dim} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="0.1em">01 — Données publiques françaises</text>

              <path className="why-trace-up" d="M 100 175 Q 230 230 360 215" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-up" d="M 200 105 Q 280 165 360 215" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-up" d="M 360 75 L 360 215" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-up" d="M 520 105 Q 440 165 360 215" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-up" d="M 620 175 Q 490 230 360 215" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="0.9" />

              {[
                ['Climat', 'DRIAS · COPERNICUS', 100, 175, 153, 140],
                ['Sols', 'GISSOL · RMQS', 200, 105, 83, 70],
                ['Air et eau', "ATMO · HUB'EAU · ARS", 360, 75, 53, 40],
                ['Risques', 'GÉORISQUES · BRGM', 520, 105, 83, 70],
                ['Santé', 'ANSES · SPF · INRAE', 620, 175, 153, 140],
              ].map(([label, sub, cx, cy, y1, y2]) => (
                <g key={String(label)}>
                  <circle cx={cx} cy={cy} r="3.5" fill={C.accent} />
                  <text x={cx} y={y1} textAnchor="middle" fill={C.text} fontFamily="'Instrument Sans', sans-serif" fontSize="11" fontWeight="500">{label}</text>
                  <text x={cx} y={y2} textAnchor="middle" fill={C.dim} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="0.04em">{sub}</text>
                </g>
              ))}

              <text x="200" y="218" textAnchor="middle" fill={C.dim} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="0.1em" opacity="0.55">02 — Croisement</text>

              <g className="why-core-pulse">
                <circle cx="360" cy="250" r="64" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" strokeWidth="1" />
              </g>
              <circle cx="360" cy="250" r="48" fill="rgba(248,113,113,0.12)" stroke="rgba(248,113,113,0.5)" strokeWidth="1" />
              <text x="360" y="244" textAnchor="middle" fill={C.text} fontFamily="'Instrument Serif', serif" fontSize="13" fontStyle="italic">votre commune</text>
              <text x="360" y="260" textAnchor="middle" fill={C.accent} fontFamily="'Instrument Serif', serif" fontSize="14" fontStyle="italic">+</text>
              <text x="360" y="276" textAnchor="middle" fill={C.text} fontFamily="'Instrument Serif', serif" fontSize="13" fontStyle="italic">votre profil</text>

              <text x="360" y="335" textAnchor="middle" fill={C.dim} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="0.1em">03 — Six modules de lecture</text>

              <path className="why-trace-down" d="M 360 298 Q 230 340 100 380" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-down" d="M 360 298 Q 290 350 230 390" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-down" d="M 360 298 Q 340 360 320 400" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-down" d="M 360 298 Q 380 360 400 400" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-down" d="M 360 298 Q 430 350 490 390" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="0.9" />
              <path className="why-trace-down" d="M 360 298 Q 490 340 620 380" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="0.9" />

              {[
                ['Quartier', 100, 380],
                ['Logement', 230, 390],
                ['Métier', 320, 400],
                ['Santé', 400, 400],
                ['Mobilité', 490, 390],
                ['Projets', 620, 380],
              ].map(([label, x, y]) => (
                <g key={String(label)} transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="0" r="9" fill="none" stroke="rgba(96, 165, 250, 0.85)" strokeWidth="1.2" />
                  <circle cx="0" cy="0" r="2.5" fill="rgba(96, 165, 250, 0.85)" />
                  <text x="0" y="24" textAnchor="middle" fill={C.text} fontFamily="'Instrument Sans', sans-serif" fontSize="10.5" fontWeight="500">{label}</text>
                </g>
              ))}

              <path className="why-trace-final" d="M 100 410 Q 230 460 360 470" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" />
              <path className="why-trace-final" d="M 230 420 Q 290 460 360 470" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" />
              <path className="why-trace-final" d="M 320 430 Q 340 460 360 470" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" />
              <path className="why-trace-final" d="M 400 430 Q 380 460 360 470" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" />
              <path className="why-trace-final" d="M 490 420 Q 430 460 360 470" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" />
              <path className="why-trace-final" d="M 620 410 Q 490 460 360 470" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1" />

              <g className="why-final-card">
                <rect x="180" y="470" width="360" height="74" rx="10" fill="rgba(251, 146, 60, 0.06)" stroke="rgba(251, 146, 60, 0.4)" strokeWidth="1" />
                <text x="360" y="491" textAnchor="middle" fill={C.warm} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="0.12em">04 — Votre lecture personnalisée</text>
                <text x="360" y="513" textAnchor="middle" fill={C.text} fontFamily="'Instrument Serif', serif" fontSize="13" fontStyle="italic">Une lecture située, sourcée, mensuelle.</text>
                <text x="360" y="531" textAnchor="middle" fill={C.muted} fontFamily="'Instrument Sans', sans-serif" fontSize="9.5">Rapport initial, suivi continu, mode foyer.</text>
              </g>
            </svg>

            <div className="why-schema-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{ ...glass({ padding: '14px 16px', borderRadius: 8 }), display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.warm, marginTop: 7, flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Suivi mensuel</strong>
                  <span style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>Newsletter et notifications quand une donnée évolue.</span>
                </div>
              </div>
              <div style={{ ...glass({ padding: '14px 16px', borderRadius: 8 }), display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.violet, marginTop: 7, flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Mode foyer</strong>
                  <span style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>Plusieurs profils, une lecture croisée pour les décisions communes.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            04 — Qui nous sommes
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Derrière futur•e
          </h2>
          <div style={{ ...glass({ padding: 32, borderRadius: 12 }), marginTop: 28 }}>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, margin: '0 0 14px' }}>
              Nous travaillons depuis plusieurs années dans la transition écologique en France.
              Nous voyons chaque jour comment les données climatiques et sanitaires circulent entre
              institutions, rapports et bases de données, sans jamais vraiment atteindre les personnes
              qu&apos;elles concernent le plus directement.
            </p>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, margin: '0 0 14px' }}>
              futur•e est né de cette frustration : <strong style={{ color: C.text, fontWeight: 500 }}>
              les données existent, les risques sont documentés, mais personne ne les traduit pour la vie de quelqu&apos;un.
              </strong> Pas pour votre commune précise. Pas croisées avec votre situation réelle. Pas dans un registre lisible,
              sans jargon, sans catastrophisme.
            </p>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              Nous ne sommes ni un cabinet de conseil, ni un média, ni une association. Nous sommes un produit indépendant,
              sans publicité, financé uniquement par ses utilisateurs. Nous ne produisons rien que vous ne puissiez vérifier.
            </p>
          </div>
        </section>

        <section
          style={{
            marginTop: 72,
            paddingTop: 48,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.2rem', fontStyle: 'italic', color: C.muted, maxWidth: 380, lineHeight: 1.5, margin: 0 }}>
            Voir ce que futur•e produit concrètement.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/savoir/cadmium"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                padding: '10px 20px',
                borderRadius: 8,
                textDecoration: 'none',
                background: 'transparent',
                color: C.muted,
                border: `1px solid ${C.borderHi}`,
              }}
            >
              Lire une page Savoir
            </Link>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: 8,
                textDecoration: 'none',
                background: C.accent,
                color: '#fff',
                border: '1px solid transparent',
              }}
            >
              Saisir ma commune →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
