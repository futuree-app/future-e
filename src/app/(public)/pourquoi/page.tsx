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

const ASYMETRIES = [
  {
    n: '1',
    nom: 'Transactionnelle',
    constat:
      'Celui qui vend ou loue un bien connaît son environnement mieux que la personne qui arrive. Le logement est montré sous son meilleur jour ; le territoire, rarement raconté en entier.',
    reponse:
      'futur•e rassemble les faits documentés sur le territoire — climat, risques, mobilité, santé, services — sourcés, datés, vérifiables.',
    fort: false,
  },
  {
    n: '2',
    nom: 'Professionnelle',
    constat:
      'Agences, promoteurs, notaires, assureurs, collectivités manient des documents et des compétences que le particulier ne maîtrise pas toujours. Personne n’a besoin d’être malveillant pour que ce déséquilibre existe.',
    reponse:
      'futur•e traduit ces informations en langage clair, sans jargon, pour que vous arriviez aux visites en sachant quoi demander.',
    fort: false,
  },
  {
    n: '3',
    nom: 'Technique',
    constat:
      'Les données publiques existent, mais dispersées dans des dizaines de bases, avec des échelles, des horizons et des méthodes difficiles à interpréter.',
    reponse:
      'futur•e les croise et affiche pour chaque donnée sa source, sa date et son échelle — commune, quartier ou adresse.',
    fort: false,
  },
  {
    n: '4',
    nom: 'Temporelle',
    constat:
      'La transaction porte sur le présent. Vous engagez vingt ou trente ans de votre vie et de votre patrimoine. La commune que vous achetez aujourd’hui n’est pas celle que vous habiterez en 2050.',
    reponse:
      'futur•e intègre les projections climatiques officielles à l’horizon de votre engagement, pas seulement l’état des lieux du jour de la vente.',
    fort: true,
  },
  {
    n: '5',
    nom: 'De capacité',
    constat:
      'Deux personnes peuvent recevoir exactement le même document sans avoir les mêmes moyens d’en comprendre les conséquences pour leur propre vie.',
    reponse:
      'futur•e relie chaque fait à votre projet précis : le même constat ne pèse pas pareil selon votre santé, votre mobilité, votre budget, votre horizon.',
    fort: true,
  },
];

const ETATS = [
  ['Établi', 'Le fait est documenté dans une source officielle. Nous le citons, avec sa portée et ses limites.'],
  ['Absent des données', 'Aucune source consultée ne couvre ce point. Nous le disons, au lieu de nous taire.'],
  ['Donnée ancienne', 'L’information existe mais date. Nous affichons son âge plutôt que de la faire passer pour actuelle.'],
  ['Indice seulement', 'Un signal existe, sans preuve suffisante. Nous ne rassurons pas, nous ne condamnons pas.'],
  ['Sources contradictoires', 'Deux bases se contredisent. Nous montrons la contradiction au lieu de choisir en silence.'],
  ['Vérification nécessaire', 'La donnée ne permet pas de conclure pour votre situation. Nous vous disons quoi vérifier, et auprès de qui.'],
];

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
        .why-orb-2 { animation: breathe 16s ease-in-out infinite; }
        @media (max-width: 768px) {
          .why-hero-grid { grid-template-columns: 1fr !important; }
          .why-contrast-grid { grid-template-columns: 1fr !important; }
          .why-etats-grid { grid-template-columns: 1fr !important; }
          .why-offre-grid { grid-template-columns: 1fr !important; }
          .why-asym-card { grid-template-columns: 1fr !important; }
          .why-page-wrap { padding: 0 20px 100px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .why-orb-2 { animation: none; }
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
                  fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
                  fontWeight: 400,
                  lineHeight: 1.18,
                  letterSpacing: '-0.02em',
                  margin: '0 0 28px',
                  maxWidth: 600,
                }}
              >
                La même adresse n&apos;a pas le même sens{' '}
                <em style={{ color: C.muted, fontStyle: 'italic' }}>pour&nbsp;tout&nbsp;le&nbsp;monde</em>
              </h1>
              <p style={{ fontSize: '1.05rem', color: C.muted, maxWidth: 560, lineHeight: 1.75, margin: 0 }}>
                Une commune n&apos;est ni bonne ni mauvaise en soi. Tout dépend de la vie que
                vous voulez y mener. futur•e existe pour vous donner, avant de vous engager,
                l&apos;information que d&apos;autres ont déjà.
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
            01 · Le constat
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Décider avec moins d&apos;informations que les autres
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Choisir où vivre est l&apos;une des décisions les plus engageantes qui soient :
            des années de vie, une grande partie d&apos;un patrimoine, parfois la santé
            d&apos;une famille. Et c&apos;est pourtant une décision que l&apos;on prend presque
            toujours en sachant moins que les autres acteurs de la transaction.
          </p>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            Certaines données sont publiques mais illisibles. D&apos;autres n&apos;ont jamais
            été produites. D&apos;autres encore ne sont pas transmises alors qu&apos;elles sont
            connues. Personne n&apos;a besoin d&apos;être malveillant pour que ce déséquilibre
            existe : le système le produit tout seul.
          </p>
          <div style={{ borderLeft: `2px solid rgba(248, 113, 113, 0.25)`, padding: '6px 0 6px 24px', margin: '28px 0' }}>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.15rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              futur•e construit le dossier que chacun devrait pouvoir consulter avant de choisir
              un endroit où engager sa&nbsp;vie, son&nbsp;argent et&nbsp;parfois
              la&nbsp;santé de&nbsp;sa&nbsp;famille.
            </p>
          </div>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            Ce déséquilibre n&apos;est pas une fatalité. Il a des formes précises — nous en
            avons identifié cinq — et chacune peut être réduite.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            02 · Les cinq asymétries
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Cinq déséquilibres, une réponse à chacun
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
            {ASYMETRIES.map((a) => (
              <div
                key={a.n}
                className="why-asym-card"
                style={{
                  ...glass({
                    padding: '22px 24px',
                    borderRadius: 12,
                    borderColor: a.fort ? 'rgba(248, 113, 113, 0.35)' : C.border,
                  }),
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: a.fort ? C.accent : C.dim,
                      marginBottom: 10,
                    }}
                  >
                    {a.n} · L&apos;asymétrie {a.nom.toLowerCase()}
                  </span>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: 0 }}>{a.constat}</p>
                </div>
                <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 20 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: C.dim,
                      marginBottom: 10,
                    }}
                  >
                    → Ce que futur•e y répond
                  </span>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>{a.reponse}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: C.dim, fontSize: 13, lineHeight: 1.7, margin: '20px 0 0' }}>
            Les deux dernières sont celles que presque personne ne traite : le temps long de
            votre engagement, et le lien entre l&apos;information et votre propre vie. C&apos;est
            là que futur•e concentre son travail.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            03 · La chaîne de décision
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Un fragment ne suffit pas
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 24px' }}>
            La plupart des outils n&apos;éclairent qu&apos;un morceau de la décision : la commune,
            les risques, le prix, le logement ou le climat. Or vous ne décidez pas par morceaux.
            Une décision résidentielle traverse quatre questions, dans l&apos;ordre — et futur•e
            est construit pour les relier.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Le territoire', 'Est-ce que ce territoire correspond à la vie que je veux mener — aujourd’hui, et à l’horizon de mon engagement ?'],
              ['Le quotidien', 'Est-ce que la vie de tous les jours autour de cette adresse convient à mon foyer — déplacements, soins, services, école ?'],
              ['Le logement', 'Est-ce que ce logement précis expose mon foyer à des risques ou à des contraintes que je n’ai pas vus ?'],
              ['La vérification', 'Qu’est-ce que je sais réellement, et qu’est-ce que je dois encore vérifier avant de signer ?'],
            ].map(([titre, question], i, arr) => (
              <div key={titre} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: `1px solid ${i === arr.length - 1 ? 'rgba(248, 113, 113, 0.6)' : C.borderHi}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: i === arr.length - 1 ? C.accent : C.muted,
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 1, height: 34, background: C.border }} />}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                  <strong style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3, paddingTop: 4 }}>{titre}</strong>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, margin: 0 }}>{question}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '28px 0 16px' }}>
            C&apos;est là que l&apos;aide devient concrète. Pas seulement « mieux informer », mais
            permettre à quelqu&apos;un d&apos;éviter une erreur qui l&apos;engagerait pendant des
            années, de poser les bonnes questions lors d&apos;une visite, de repérer un compromis
            qu&apos;il peut accepter, de renoncer à temps à une option séduisante mais inadaptée —
            ou, au contraire, de choisir avec davantage de confiance.
          </p>
          <p style={{ color: C.dim, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            futur•e ne promet pas de décider à votre place. Il vous redonne les moyens de décider
            vous-même.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            04 · La méthode
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Qualifier les preuves, plutôt que noter les lieux
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            futur•e ne produit ni note de A à F, ni classement des villes où il ferait
            universellement bon vivre. Un score doit toujours conclure, même quand les données
            ne le permettent pas. Nous faisons l&apos;inverse : chaque affirmation porte son
            statut de connaissance.
          </p>
          <div
            className="why-etats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              margin: '28px 0',
            }}
          >
            {ETATS.map(([nom, desc]) => (
              <div key={nom} style={glass({ padding: '16px 18px', borderRadius: 10 })}>
                <strong style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{nom}</strong>
                <span style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.6 }}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={{ borderLeft: `2px solid rgba(248, 113, 113, 0.25)`, padding: '6px 0 6px 24px', margin: '28px 0' }}>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.15rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
              « Aucun risque confirmé dans les données consultées » n&apos;est pas
              la&nbsp;même chose qu&apos;«&nbsp;aucun&nbsp;risque&nbsp;». La plupart des outils
              confondent les&nbsp;deux. Pas&nbsp;nous.
            </p>
          </div>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            Et une règle ne varie jamais : les faits sont les mêmes pour tout le monde. Nous ne
            cachons rien selon votre profil. Ce qui change avec votre projet, c&apos;est
            l&apos;importance de chaque fait pour <em>votre</em> décision — vingt minutes de
            voiture jusqu&apos;à un hôpital ne pèsent pas pareil selon votre santé. En résumé :
            ce que nous savons, ce que cela change pour vous, ce qu&apos;il reste à vérifier.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            05 · Notre modèle
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            L&apos;information essentielle n&apos;est pas à vendre
          </h2>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, margin: '0 0 24px' }}>
            Si notre mission est de réduire une asymétrie d&apos;information, nous ne pouvons pas
            la reconstruire derrière un paywall. Notre modèle suit une ligne simple :
          </p>
          <div
            className="why-offre-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div style={{ ...glass({ padding: 24 }), borderRight: `1px solid ${C.border}` }}>
              <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.dim, marginBottom: 16 }}>
                Gratuit — la mission
              </span>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                Comprendre les grandes caractéristiques d&apos;un territoire, identifier ses
                compatibilités avec votre projet et ses principaux compromis. L&apos;accès à
                l&apos;information et une première orientation appartiennent à tout le monde.
              </p>
            </div>
            <div style={glass({ padding: 24 })}>
              <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
                Payant — la capacité de décision
              </span>
              <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>
                Le travail qui transforme cette information en dossier personnel : la profondeur,
                la comparaison entre territoires, les vérifications à mener, la traçabilité de
                chaque conclusion — et le temps que vous ne passerez pas dans trente bases de
                données.
              </p>
            </div>
          </div>
          <p style={{ color: C.dim, fontSize: 13, lineHeight: 1.7, margin: '20px 0 0' }}>
            Le payant ne vend pas des risques cachés que nous aurions gardés pour nous. Il vend
            le travail de les appliquer rigoureusement à votre décision.
          </p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>
            06 · En clair
          </span>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.55rem', fontWeight: 400, lineHeight: 1.3, margin: '0 0 20px' }}>
            Ce que futur•e est, et n&apos;est pas
          </h2>
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
                  'Un palmarès des villes où il fait bon vivre',
                  'Un score qui décide à votre place',
                  "Un média d'alerte ou une machine à angoisse",
                  'Un outil qui affirme plus que ce que les données permettent',
                  'Un produit dont les conclusions varient selon qui le paie',
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
                  'Une lecture des territoires reliée à votre projet de vie',
                  'Des données publiques françaises, citées et vérifiables',
                  'Des conclusions explicables, avec leurs limites affichées',
                  'Un point de départ pour décider, pas une prescription',
                  'Un produit indépendant : personne ne peut modifier un verdict',
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
            07 · Qui nous sommes
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
          }}
        >
          <p
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(1.35rem, 3vw, 1.7rem)',
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
              href="/comparateur"
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
              Comparer des territoires
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
