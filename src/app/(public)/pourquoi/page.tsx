import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Pourquoi futur•e : décider où vivre, à armes égales',
  description:
    'Choisir un logement, c’est souvent décider avec moins d’informations que ceux qui le vendent. futur•e rassemble ce qui est connu, rend visibles les angles morts et vous aide à savoir ce qu’il reste à vérifier avant de vous engager.',
  openGraph: {
    title: 'Pourquoi futur•e',
    description:
      'La même adresse n’a pas le même sens pour tout le monde. futur•e qualifie les preuves plutôt que de noter les lieux.',
    type: 'website',
  },
};

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

const kicker = (color: string = C.dim) => ({
  display: 'block' as const,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  marginBottom: 16,
});

const h2 = {
  fontFamily: "var(--font-serif)",
  fontSize: '1.9rem',
  fontWeight: 400,
  lineHeight: 1.3,
  margin: '0 0 20px',
};

const body = { color: C.muted, fontSize: 16.5, lineHeight: 1.8, margin: '0 0 18px' };

/* ————— Données de page ————— */

const CHIPS_HERO = [
  { txt: '+3 semaines à plus de 35 °C d’ici 2050', tone: 'accent', rot: 1.5, side: 'right' },
  { txt: 'Îlot de chaleur : jusqu’à +4 °C la nuit en été', tone: 'warm', rot: -1.5, side: 'left' },
  { txt: 'Gare : 24 min à pied · bus 2 fois par jour', tone: 'blue', rot: 1, side: 'right' },
  { txt: 'Cadmium : vérification recommandée', tone: 'violet', rot: -1, side: 'left' },
];

const PROFILS_DEMO = [
  {
    profil: 'Couple en télétravail, deux voitures',
    verdict: 'Compatible, avec compromis',
    tone: C.blue,
    toneBg: 'rgba(96, 165, 250, 0.1)',
    toneBorder: 'rgba(96, 165, 250, 0.4)',
    detail: 'Le compromis à accepter : des étés de plus en plus chauds. Les atouts qui comptent pour ce projet : la gare, la fibre, les services.',
  },
  {
    profil: 'Famille sans voiture, enfant asthmatique',
    verdict: 'Réserves importantes',
    tone: C.warm,
    toneBg: 'rgba(251, 146, 60, 0.1)',
    toneBorder: 'rgba(251, 146, 60, 0.4)',
    detail: 'Le quotidien sans voiture se joue à quelques rues près ; l’exposition aux pollens et à la chaleur pèse plus lourd pour ce foyer que pour un autre.',
  },
  {
    profil: 'Retraité dépendant de soins réguliers',
    verdict: 'À vérifier avant d’aller plus loin',
    tone: C.violet,
    toneBg: 'rgba(167, 139, 250, 0.1)',
    toneBorder: 'rgba(167, 139, 250, 0.4)',
    detail: 'L’accès réel aux soins spécialisés dépend du quartier et des besoins précis : c’est la première chose que ce dossier demanderait de confirmer.',
  },
];

const CHAINE = [
  {
    titre: 'La commune et le territoire',
    question: 'Est-ce que cette trajectoire territoriale correspond à mon projet, aujourd’hui et à l’horizon de mon engagement ?',
  },
  {
    titre: 'Le quartier et le quotidien',
    question: 'Puis-je réellement y vivre comme je l’imagine : déplacements, soins, services, écoles, nuisances ?',
  },
  {
    titre: 'Le logement et l’adresse',
    question: 'Quelles contraintes ou vulnérabilités sont propres au bien et à son environnement immédiat ?',
  },
  {
    titre: 'Les vérifications',
    question: 'Que savons-nous, et que faut-il encore demander ou investiguer avant de signer ?',
  },
];

const ASYMETRIES = [
  {
    nom: 'Transactionnelle',
    constat: 'Celui qui vend ou loue connaît le bien et son environnement mieux que la personne qui arrive.',
    reponse: 'Les faits documentés sur le territoire, sourcés et datés, avant la visite plutôt qu’après la signature.',
    fort: false,
  },
  {
    nom: 'Professionnelle',
    constat: 'Agences, promoteurs, notaires, assureurs manient des documents que le particulier ne maîtrise pas toujours.',
    reponse: 'Une traduction en langage clair, pour arriver aux visites en sachant quoi demander.',
    fort: false,
  },
  {
    nom: 'Technique',
    constat: 'Les données publiques existent, mais dispersées dans des dizaines de bases, à des échelles difficiles à interpréter.',
    reponse: 'Un croisement unique, avec la source, la date et l’échelle affichées pour chaque donnée.',
    fort: false,
  },
  {
    nom: 'Temporelle',
    constat: 'La transaction porte sur le présent. Vous engagez vingt ou trente ans. La commune que vous achetez n’est pas celle que vous habiterez.',
    reponse: 'Les projections officielles à l’horizon de votre engagement, pas seulement l’état des lieux du jour de la vente.',
    fort: true,
  },
  {
    nom: 'De capacité',
    constat: 'Deux personnes peuvent recevoir le même document sans avoir les mêmes moyens d’en comprendre les conséquences.',
    reponse: 'Chaque fait relié à votre projet : le même constat ne pèse pas pareil selon votre santé, votre mobilité, votre budget.',
    fort: true,
  },
];

const ETATS = [
  ['Établi', 'Documenté dans une source officielle. Cité, avec sa portée et ses limites.'],
  ['Absent des données', 'Aucune source consultée ne couvre ce point. Nous le disons, au lieu de nous taire.'],
  ['Donnée ancienne', 'L’information existe mais date. Son âge est affiché, pas maquillé.'],
  ['Indice seulement', 'Un signal existe, sans preuve suffisante. Ni réassurance, ni condamnation.'],
  ['Sources contradictoires', 'Deux bases se contredisent. La contradiction est montrée, pas arbitrée en silence.'],
  ['Vérification nécessaire', 'Impossible de conclure pour votre situation. Nous disons quoi vérifier, et auprès de qui.'],
];

const chipTone: Record<string, { border: string; color: string }> = {
  accent: { border: 'rgba(248, 113, 113, 0.5)', color: 'var(--red)' },
  warm: { border: 'rgba(251, 146, 60, 0.5)', color: 'var(--orange)' },
  blue: { border: 'rgba(96, 165, 250, 0.5)', color: 'var(--blue)' },
  violet: { border: 'rgba(167, 139, 250, 0.5)', color: 'var(--violet)' },
};

export default function PourquoiPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: "var(--font-sans)",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        @keyframes breathe {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.12) translate(18px, -25px); }
        }
        @keyframes chipFloat {
          0%, 100% { transform: translateY(0) rotate(var(--rot)); }
          50% { transform: translateY(-5px) rotate(var(--rot)); }
        }
        .why-orb-2 { animation: breathe 16s ease-in-out infinite; }
        .why-chip { animation: chipFloat 7s ease-in-out infinite; }
        .why-chip:nth-of-type(2) { animation-delay: 1.4s; }
        .why-chip:nth-of-type(3) { animation-delay: 2.8s; }
        .why-chip:nth-of-type(4) { animation-delay: 4.2s; }
        @media (max-width: 768px) {
          .why-hero-grid { grid-template-columns: 1fr !important; }
          .why-etats-grid { grid-template-columns: 1fr !important; }
          .why-offre-grid { grid-template-columns: 1fr !important; }
          .why-offre-left { border-right: none !important; border-bottom: 1px solid var(--border-1) !important; }
          .why-demo-grid { grid-template-columns: 1fr !important; }
          .why-asym-row { grid-template-columns: 1fr !important; gap: 10px !important; }
          .why-asym-num { font-size: 2.8rem !important; }
          .why-asym-response { border-left: none !important; padding-left: 0 !important; }
          .why-page-wrap { padding: 0 20px 100px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .why-orb-2, .why-chip { animation: none; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed', width: 600, height: 600, borderRadius: '50%', filter: 'blur(130px)',
          opacity: 0.28, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(circle, #f87171 0%, transparent 70%)', top: -180, left: -160,
        }}
      />
      <div
        className="why-orb-2"
        style={{
          position: 'fixed', width: 500, height: 500, borderRadius: '50%', filter: 'blur(130px)',
          opacity: 0.28, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', bottom: -140, right: -120,
        }}
      />

      <Navbar />

      <main
        className="why-page-wrap"
        style={{ position: 'relative', zIndex: 2, maxWidth: 920, margin: '0 auto', padding: '0 24px 120px' }}
      >
        {/* ————— HERO ————— */}
        <section style={{ padding: '72px 0 56px' }}>
          <div
            className="why-hero-grid"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 36, alignItems: 'center' }}
          >
            <div>
              <p style={{ ...kicker(C.accent), fontSize: 13, letterSpacing: '0.12em', marginBottom: 24 }}>
                Pourquoi futur•e
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 'clamp(2.4rem, 5.5vw, 3.7rem)',
                  fontWeight: 400,
                  lineHeight: 1.18,
                  letterSpacing: '-0.02em',
                  margin: '0 0 28px',
                }}
              >
                Votre futur lieu de vie
                <br />
                ne tient pas <em style={{ color: C.muted, fontStyle: 'italic' }}>dans&nbsp;une&nbsp;annonce</em>
              </h1>
              <p style={{ fontSize: '1.18rem', color: C.muted, lineHeight: 1.75, margin: 0 }}>
                Une commune, un quartier, un logement : futur•e rassemble ce qui est connu,
                rend visibles les angles morts et vous aide à savoir ce qu&apos;il reste
                à vérifier avant de&nbsp;vous&nbsp;engager.
              </p>
            </div>

            {/* L'annonce vs ce qu'elle ne dit pas */}
            <div className="why-annonce-wrap" style={{ display: 'flex', flexDirection: 'column', padding: '0 6px' }}>
              <div
                style={{
                  ...glass({ borderRadius: 16, padding: 22 }),
                  boxShadow: '0 28px 90px rgba(0,0,0,0.32)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim }}>
                  L&apos;annonce
                </span>
                <div
                  style={{
                    height: 84,
                    borderRadius: 10,
                    margin: '12px 0 14px',
                    background: 'linear-gradient(135deg, rgba(96,165,250,0.16) 0%, rgba(167,139,250,0.1) 55%, rgba(248,113,113,0.08) 100%)',
                    border: `1px solid ${C.border}`,
                  }}
                />
                <strong style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 400, lineHeight: 1.3 }}>
                  Maison 4 pièces, jardin, proche&nbsp;mer
                </strong>
                <span style={{ fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
                  Lumineuse, au calme. Écoles et commerces à proximité. Coup de cœur assuré.
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: C.text, marginTop: 14 }}>
                  289 000 €
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: -10, position: 'relative', zIndex: 3 }}>
                {CHIPS_HERO.map((c) => {
                  const t = chipTone[c.tone];
                  return (
                    <span
                      key={c.txt}
                      className="why-chip"
                      style={{
                        alignSelf: c.side === 'left' ? 'flex-start' : 'flex-end',
                        marginLeft: c.side === 'left' ? -6 : 0,
                        marginRight: c.side === 'right' ? -6 : 0,
                        '--rot': `${c.rot}deg`,
                        transform: `rotate(${c.rot}deg)`,
                        background: 'var(--bg)',
                        border: `1px solid ${t.border}`,
                        color: t.color,
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        lineHeight: 1.45,
                        letterSpacing: '0.02em',
                        padding: '7px 11px',
                        borderRadius: 7,
                        maxWidth: 280,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                      } as CSSProperties & { '--rot': string }}
                    >
                      {c.txt}
                    </span>
                  );
                })}
              </div>
              <p
                style={{
                  textAlign: 'center',
                  fontFamily: "var(--font-serif)", fontStyle: 'italic', fontSize: 14, color: C.dim,
                  margin: '16px 0 0',
                }}
              >
                Ce que la visite montre. Et ce qu&apos;elle ne montre pas.
              </p>
            </div>
          </div>
        </section>

        <div style={{ width: 40, height: 1, background: C.borderHi, margin: '0 0 56px' }} />

        {/* ————— 01 · LE CONSTAT ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>01 · Le constat</span>
          <h2 style={h2}>Pourquoi devriez-vous décider avec moins d&apos;informations que les autres&nbsp;?</h2>
          <p style={body}>
            Choisir où vivre est l&apos;une des décisions les plus engageantes qui soient :
            des années de vie, une grande partie d&apos;un patrimoine, parfois la santé
            d&apos;une famille. Et c&apos;est pourtant une décision que l&apos;on prend presque
            toujours en sachant moins que les autres acteurs de la transaction. Quant à ceux qui
            vivent déjà sur place, il leur arrive de découvrir après des années ce qui ne leur
            a jamais été transmis.
          </p>
          <p style={body}>
            Certaines données sont publiques mais illisibles. D&apos;autres n&apos;ont jamais été
            produites. D&apos;autres encore ne sont pas transmises alors qu&apos;elles sont connues.
            Une partie de ces déséquilibres vient de la complexité du système ; une autre peut être
            entretenue par des acteurs qui ont intérêt à conclure la transaction. futur•e ne présume
            d&apos;aucune intention. Il refuse simplement que la personne qui vivra sur place reste
            la moins bien informée.
          </p>
          <div style={{ borderLeft: `2px solid rgba(248, 113, 113, 0.25)`, padding: '6px 0 6px 24px', margin: '28px 0 0' }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: '1.3rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              futur•e construit le dossier que chacun devrait pouvoir consulter avant de choisir
              un endroit où engager sa&nbsp;vie, son&nbsp;argent et&nbsp;parfois
              la&nbsp;santé de&nbsp;sa&nbsp;famille.
            </p>
          </div>
        </section>

        {/* ————— 02 · LA PREUVE ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>02 · La preuve par l&apos;exemple</span>
          <h2 style={h2}>Une même ville, trois projets, trois verdicts</h2>
          <p style={{ ...body, margin: '0 0 24px' }}>
            Prenez La Rochelle. Les faits sont les mêmes pour tout le monde : le climat qui vient,
            les risques documentés, la gare, les soins, les services. Mais le verdict change du
            tout au tout selon le foyer qui envisage d&apos;y vivre.
          </p>
          <div className="why-demo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {PROFILS_DEMO.map((d) => (
              <div key={d.profil} style={{ ...glass({ padding: '20px 18px', borderRadius: 12 }), display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.45 }}>{d.profil}</span>
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    color: d.tone,
                    background: d.toneBg,
                    border: `1px solid ${d.toneBorder}`,
                    padding: '5px 10px',
                    borderRadius: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {d.verdict}
                </span>
                <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{d.detail}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: 'italic', fontSize: '1.2rem', color: C.text, margin: '24px 0 0' }}>
            Les faits ne changent pas. Leur importance pour la&nbsp;décision,&nbsp;oui.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: '0.06em', color: C.dim, margin: '14px 0 0' }}>
            Exemple illustratif : les verdicts réels dépendent du projet complet et des données au
            jour de la consultation.
          </p>
        </section>

        {/* ————— 03 · LA CHAÎNE ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>03 · La chaîne de décision</span>
          <h2 style={h2}>Un fragment ne suffit pas</h2>
          <p style={{ ...body, margin: '0 0 28px' }}>
            La plupart des outils n&apos;éclairent qu&apos;un morceau : la commune, les risques,
            le prix, le logement ou le climat. Or vous ne décidez pas par morceaux. Une décision
            résidentielle traverse quatre questions, dans l&apos;ordre. futur•e est construit
            pour les relier.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {CHAINE.map((etape, i) => (
              <div key={etape.titre} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      border: `1px solid ${i === CHAINE.length - 1 ? 'rgba(248, 113, 113, 0.6)' : C.borderHi}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      color: i === CHAINE.length - 1 ? C.accent : C.muted,
                      background: i === CHAINE.length - 1 ? 'rgba(248,113,113,0.07)' : 'transparent',
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < CHAINE.length - 1 && <div style={{ width: 1, height: 40, background: C.border }} />}
                </div>
                <div style={{ paddingBottom: i < CHAINE.length - 1 ? 20 : 0 }}>
                  <strong style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: C.text, marginBottom: 3, paddingTop: 5 }}>{etape.titre}</strong>
                  <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{etape.question}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ ...body, margin: '28px 0 0' }}>
            Concrètement : éviter une erreur qui engagerait des années, poser les bonnes questions
            lors d&apos;une visite, repérer un compromis acceptable, renoncer à temps à une option
            séduisante mais inadaptée, ou choisir avec davantage de confiance. futur•e ne décide
            pas à votre place. Il vous redonne les moyens de décider vous-même.
          </p>
        </section>

        {/* ————— 04 · LES CINQ ASYMÉTRIES ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>04 · Les cinq asymétries</span>
          <h2 style={h2}>Cinq déséquilibres, une réponse à chacun</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ASYMETRIES.map((a, i) => (
              <div
                key={a.nom}
                className="why-asym-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '76px 1fr 1fr',
                  gap: 20,
                  padding: '22px 0',
                  borderTop: `1px solid ${i === 0 ? 'transparent' : C.border}`,
                  alignItems: 'start',
                }}
              >
                <div
                  className="why-asym-num"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: '3.4rem',
                    lineHeight: 0.9,
                    color: a.fort ? C.accent : 'transparent',
                    WebkitTextStroke: a.fort ? undefined : `1px ${C.borderHi}`,
                    userSelect: 'none' as const,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                    {a.nom}
                    {a.fort && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: '0.08em', color: C.accent, marginLeft: 8, textTransform: 'uppercase' }}>
                        · le cœur de futur•e
                      </span>
                    )}
                  </strong>
                  <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, margin: 0 }}>{a.constat}</p>
                </div>
                <div className="why-asym-response" style={{ paddingLeft: 16, borderLeft: `1px solid ${C.border}` }}>
                  <span style={{ display: 'block', fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accent, marginBottom: 5 }}>
                    → La réponse futur•e
                  </span>
                  <p style={{ fontSize: 15, color: C.text, lineHeight: 1.65, margin: 0 }}>{a.reponse}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ————— 05 · LA MÉTHODE ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>05 · La méthode</span>
          <h2 style={h2}>Qualifier les preuves, plutôt que noter les lieux</h2>
          <p style={body}>
            futur•e ne produit ni note de A à F, ni classement des villes où il ferait
            universellement bon vivre. Un score résume la réalité en une valeur unique et peut
            masquer la qualité très inégale des données qui la composent. Nous faisons
            l&apos;inverse : chaque conclusion doit pouvoir être reliée à ses sources, à son
            échelle et aux règles qui l&apos;ont produite, et porter son statut de connaissance.
          </p>
          <div className="why-etats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '28px 0' }}>
            {ETATS.map(([nom, desc], i) => (
              <div key={nom} style={{ ...glass({ padding: '15px 17px', borderRadius: 10 }), display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: i === 5 ? C.accent : C.dim, paddingTop: 2 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{nom}</strong>
                  <span style={{ fontSize: 14, color: C.dim, lineHeight: 1.55 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderLeft: `2px solid rgba(248, 113, 113, 0.25)`, padding: '6px 0 6px 24px', margin: '0 0 24px' }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: '1.3rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              « Aucun risque confirmé dans les données consultées » n&apos;est pas
              la&nbsp;même chose qu&apos;«&nbsp;aucun&nbsp;risque&nbsp;». Nous refusons
              de&nbsp;confondre les&nbsp;deux.
            </p>
          </div>
          <p style={{ ...body, margin: 0 }}>
            Et une règle ne varie jamais : les faits sont les mêmes pour tout le monde : nous ne
            cachons rien selon votre profil. Ce qui change avec votre projet, c&apos;est le poids
            de chaque fait pour <em>votre</em> décision.
          </p>
        </section>

        {/* ————— Bande signature ————— */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px 0', alignItems: 'baseline', justifyContent: 'center',
            textAlign: 'center', padding: '30px 16px', margin: '0 0 72px',
            borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          }}
        >
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 'clamp(1.2rem, 2.6vw, 1.5rem)', lineHeight: 1.55, margin: 0, width: '100%' }}>
            <span style={{ color: C.text }}>Ce que nous savons.</span>{' '}
            <span style={{ color: C.muted }}>Ce que cela change pour&nbsp;vous.</span>{' '}
            <span style={{ color: C.accent, fontStyle: 'italic' }}>Ce qu&apos;il reste à&nbsp;vérifier.</span>
          </p>
        </div>

        {/* ————— 06 · LE MODÈLE ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>06 · Notre modèle</span>
          <h2 style={h2}>L&apos;information essentielle n&apos;est pas à vendre</h2>
          <p style={{ ...body, margin: '0 0 24px' }}>
            Si notre mission est de réduire une asymétrie d&apos;information, nous ne pouvons pas
            la reconstruire derrière un paywall. La ligne est simple. Et si un point de vigilance
            important existe, le gratuit vous le dit toujours.
          </p>
          <div className="why-offre-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div className="why-offre-left" style={{ ...glass({ padding: 24 }), borderRight: `1px solid ${C.border}` }}>
              <span style={kicker()}>Gratuit · la mission</span>
              <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                Les grandes caractéristiques d&apos;un territoire, ses compatibilités avec votre
                projet, ses compromis majeurs, et l&apos;indication claire lorsqu&apos;un point
                mérite vérification ou qu&apos;une conclusion importante est impossible.
              </p>
            </div>
            <div style={glass({ padding: 24 })}>
              <span style={kicker(C.accent)}>Payant · la capacité de décision</span>
              <p style={{ fontSize: 15.5, color: C.text, lineHeight: 1.7, margin: 0 }}>
                Le dossier complet : l&apos;inventaire approfondi, la hiérarchisation des
                vérifications (pourquoi, auprès de qui, avec quels documents), la comparaison
                entre territoires, la traçabilité de chaque conclusion, et le temps que vous ne
                passerez pas dans trente bases de données.
              </p>
            </div>
          </div>
          <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.7, margin: '20px 0 0' }}>
            Le payant ne vend pas des risques cachés que nous aurions gardés pour nous. Il vend le
            travail de les appliquer rigoureusement à votre décision.
          </p>
        </section>

        {/* ————— 07 · INDÉPENDANCE & FONDATEUR ————— */}
        <section style={{ marginBottom: 72 }}>
          <span style={kicker()}>07 · Indépendance</span>
          <h2 style={h2}>Personne ne peut modifier un verdict</h2>
          <p style={body}>
            futur•e n&apos;est ni un palmarès, ni un score qui décide à votre place, ni un média
            d&apos;alerte. C&apos;est un produit indépendant, sans publicité, dont le modèle
            repose sur ses utilisateurs. Aucun vendeur, annonceur ou intermédiaire ne peut influer
            sur ses conclusions : même lorsqu&apos;un professionnel distribue un dossier futur•e,
            il ne peut en modifier la conclusion. Les verdicts ne varient pas selon qui paie :
            c&apos;est précisément ce qui leur donne de la valeur.
          </p>
          <div style={{ ...glass({ padding: 28, borderRadius: 12 }), marginTop: 24 }}>
            <p style={{ fontSize: 16.5, color: C.muted, lineHeight: 1.8, margin: '0 0 14px' }}>
              futur•e a été fondé par Quentin Brache, professionnel de la communication et de la
              transition écologique. Après des années à voir les données climatiques et sanitaires
              circuler entre institutions, rapports et bases publiques sans jamais atteindre les
              personnes qu&apos;elles concernent, un constat s&apos;est imposé :{' '}
              <strong style={{ color: C.text, fontWeight: 500 }}>
                des données existent, de nombreux risques sont documentés. Mais l&apos;information
                reste dispersée, incomplète, et rarement reliée à la vie concrète de ceux qui
                devront habiter le lieu.
              </strong>
            </p>
            <p style={{ fontSize: 16.5, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              futur•e existe pour faire ce travail de liaison. Pas de jargon, pas de
              catastrophisme : chaque conclusion reliée à ses sources, à son échelle et aux règles
              qui l&apos;ont produite.
            </p>
          </div>
        </section>

        {/* ————— CLÔTURE ————— */}
        <section style={{ marginTop: 72, paddingTop: 48, borderTop: `1px solid ${C.border}` }}>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 'clamp(1.5rem, 3.2vw, 1.95rem)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              color: C.text,
              margin: '0 0 36px',
            }}
          >
            Le pouvoir ne vient pas d&apos;un score qui dit où&nbsp;vivre. Il vient
            d&apos;une information complète, honnête et&nbsp;reliée à&nbsp;sa&nbsp;propre&nbsp;vie.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500,
                padding: '10px 20px', borderRadius: 8, textDecoration: 'none',
                background: 'transparent', color: C.muted, border: `1px solid ${C.borderHi}`,
              }}
            >
              Analyser une commune
            </Link>
            <Link
              href="/ou-vivre"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
                padding: '10px 20px', borderRadius: 8, textDecoration: 'none',
                background: C.accent, color: '#fff', border: '1px solid transparent',
              }}
            >
              Décrire mon projet →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
