import type { Metadata } from 'next';
import Link from 'next/link';
import { ProForm } from '@/components/ProForm';

export const metadata: Metadata = {
  title: 'futur•e Pro · Outil de lecture territoriale pour les professionnels',
  description: "DRIAS, Géorisques, INSEE, ANSES — toutes les données publiques officielles agrégées pour vos rendez-vous clients. Pour les CGP, notaires, agents d'assurance et diagnostiqueurs immobiliers.",
  robots: { index: false }, // discret : hors indexation pour l'instant
};

const ACCENT = '#c8b89a';

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:#060812;color:#e9ecf2;font-family:'Instrument Sans',system-ui,sans-serif;font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.25;pointer-events:none;z-index:0;animation:breathe 16s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(20px,-30px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.026 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:rgba(6,8,18,0.72);border-bottom:1px solid rgba(255,255,255,0.08);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px;}
  .nav-link{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9ba3b4;text-decoration:none;transition:color 0.2s;}
  .nav-link:hover{color:${ACCENT};}
  .nav-cta{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#e9ecf2;padding:8px 16px;border:1px solid rgba(255,255,255,0.14);border-radius:6px;text-decoration:none;transition:all 0.2s;}
  .nav-cta:hover{border-color:${ACCENT};color:${ACCENT};}

  .hero{padding:120px 28px 80px;text-align:center;max-width:900px;margin:0 auto;}
  .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(200,184,154,0.12);border:1px solid rgba(200,184,154,0.28);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${ACCENT};margin-bottom:32px;}
  .hero-badge-dot{width:6px;height:6px;border-radius:50%;background:${ACCENT};box-shadow:0 0 10px ${ACCENT};animation:pulse 2.5s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}

  .section-wrap{max-width:1100px;margin:0 auto;padding:0 28px;}
  .section-kicker{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:16px;}

  .profession-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:48px;}
  .profession-card{padding:36px 32px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;cursor:pointer;transition:all 0.3s ease;position:relative;overflow:hidden;}
  .profession-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(200,184,154,0.28),transparent);opacity:0;transition:opacity 0.3s;}
  .profession-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.14);transform:translateY(-2px);}
  .profession-card:hover::before{opacity:1;}

  .scene-inner{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:56px 60px;position:relative;overflow:hidden;}
  .scene-inner::after{content:"";position:absolute;top:-100px;right:-100px;width:300px;height:300px;background:radial-gradient(circle,rgba(200,184,154,0.12) 0%,transparent 70%);pointer-events:none;}
  .scene-step{padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:15px;color:#9ba3b4;line-height:1.6;}
  .scene-step:last-child{border-bottom:none;padding-bottom:0;}

  .why-card{padding:32px 28px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;}
  .principle{padding:32px 0;border-bottom:1px solid rgba(255,255,255,0.08);display:grid;grid-template-columns:140px 1fr;gap:32px;align-items:start;}
  .principle:last-child{border-bottom:none;}

  .form-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:48px 44px;}

  @media(max-width:880px){
    .profession-grid{grid-template-columns:1fr;}
    .scene-inner{padding:36px 28px;}
    .principle{grid-template-columns:1fr;gap:8px;}
    .form-card{padding:32px 24px;}
    .nav-link-hide{display:none;}
  }
  @media(max-width:560px){
    .hero{padding:80px 28px 60px;}
    .scene-inner{padding:32px 24px;}
  }
`;

const PROFESSIONS = [
  {
    icon: '📊',
    iconBg: 'rgba(96,165,250,0.10)',
    tag: 'Conseil en gestion de patrimoine',
    title: 'Conseillers en gestion de patrimoine',
    pitch: "Vos clients vous demandent : ce bien sera-t-il encore une bonne décision dans 15 ans ? Vous avez les données notariales et les rendements. Vous n'avez pas la lecture territoriale à 2050 — ni la dimension sanitaire qui va peser sur l'attractivité.",
    bullets: [
      'Lecture des dix dimensions sur n\'importe quelle commune française',
      'Données sanitaires : cadmium, pesticides, qualité de l\'air — facteurs de valorisation ou de dépréciation à long terme',
      'Export PDF intégrable à vos notes de conseil',
      'Comparaison de quatre communes pour les arbitrages multi-options',
    ],
    value: 'cgp',
  },
  {
    icon: '⚖️',
    iconBg: 'rgba(200,184,154,0.10)',
    tag: 'Office notarial',
    title: 'Notaires',
    pitch: "Votre devoir d'information s'étend. L'ERP couvre les risques réglementaires d'aujourd'hui. Il ne dit rien sur la trajectoire climatique du territoire à 2050, ni sur la qualité environnementale du sol et de l'air autour du bien.",
    bullets: [
      'Recherche par adresse précise — pas seulement par commune',
      'Qualité environnementale : cadmium, pollutions de sols, sites ICPE à proximité (BRGM / IREP)',
      'Export PDF format acte, mention "données publiques officielles"',
      'Archivage par numéro de dossier sur cinq ans',
    ],
    value: 'notaire',
  },
  {
    icon: '🛡️',
    iconBg: 'rgba(248,113,113,0.10)',
    tag: 'Agent général · Courtage',
    title: "Agents et courtiers d'assurance",
    pitch: "Vos clients ne comprennent pas pourquoi leur prime augmente. Vous voyez certaines zones se durcir. futur•e transforme une conversation défensive en conversation éducative.",
    bullets: [
      'Vue orientée assurance : submersion, feux, retrait-gonflement, CatNat',
      'Données CatNat depuis 1982 par commune',
      'Alerte de modification de zonage et nouveaux arrêtés',
      'Export PDF format rapport de risque',
    ],
    value: 'assurance-agent',
  },
  {
    icon: '🔍',
    iconBg: 'rgba(52,211,153,0.10)',
    tag: 'Diagnostic immobilier',
    title: 'Diagnostiqueurs immobiliers',
    pitch: "Votre DDT parle du bâtiment. Il ne dit rien du territoire, ni de sa qualité sanitaire. Cadmium dans les sols, pesticides, qualité de l'air : des données publiques que vos clients commencent à chercher et que vous pouvez maintenant intégrer à votre livrable.",
    bullets: [
      'Qualité de l\'air, cadmium, pesticides, sites ICPE : données ANSES, IREP, ATMO par commune',
      'Recherche à l\'adresse exacte du bien',
      'Application mobile pour saisie sur le terrain',
      "Préparez-vous à l'évolution réglementaire qui arrive",
    ],
    value: 'diagnostiqueur',
  },
];

export default function ProfessionnelsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb" style={{ width: 560, height: 560, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -180, left: -140 }} />
      <div className="orb" style={{ width: 480, height: 480, background: 'radial-gradient(circle,#60a5fa 0%,transparent 70%)', top: '30%', right: -120, animationDelay: '-6s' }} />
      <div className="orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle,#d4a574 0%,transparent 70%)', bottom: -80, left: '30%', opacity: 0.18, animationDelay: '-11s' }} />

      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontStyle: 'italic', color: '#e9ecf2', textDecoration: 'none', letterSpacing: '-0.01em' }}>
            futur<span style={{ color: ACCENT, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/chaleur" className="nav-link nav-link-hide">Explorer</Link>
            <Link href="/comparateur" className="nav-link nav-link-hide">Comparateur</Link>
            <Link href="#inscription" className="nav-cta">Accès professionnel</Link>
          </div>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 2 }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Avant-première · Lancement automne 2026
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(40px,6vw,72px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 0 28px', color: '#e9ecf2' }}>
            L'outil de lecture<br />territoriale<br />
            <em style={{ fontStyle: 'italic', color: ACCENT }}>pour vos rendez-vous client.</em>
          </h1>
          <p style={{ fontSize: 'clamp(17px,2vw,21px)', lineHeight: 1.65, color: '#c5cad6', margin: '0 auto 16px', maxWidth: 680 }}>
            DRIAS, Géorisques, INSEE, ANSES, ATMO. Toutes les données publiques officielles, agrégées en une lecture lisible que vous pouvez montrer, exporter, intégrer à vos livrables.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: '#9ba3b4', margin: '0 auto', maxWidth: 580 }}>
            Pour les conseillers en gestion de patrimoine, les notaires, les agents d'assurance et les diagnostiqueurs immobiliers qui répondent aux questions que leurs clients commencent tout juste à poser.
          </p>
        </div>

        {/* ── TENSION ──────────────────────────────────────────────────── */}
        <div style={{ padding: '80px 28px', maxWidth: 760, margin: '0 auto' }}>
          <blockquote style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.45, color: '#e9ecf2', fontStyle: 'italic', margin: '0 0 24px', paddingLeft: 24, borderLeft: `2px solid ${ACCENT}` }}>
            "Nos clients nous posent des questions sur le risque climatique de leurs actifs immobiliers. Mais nous n'avons pas les outils pour leur répondre rapidement et sérieusement."
          </blockquote>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7388', marginLeft: 24, marginBottom: 48 }}>
            — Un constat partagé par de nombreux professionnels
          </p>
          <div style={{ fontSize: 17, lineHeight: 1.75, color: '#9ba3b4' }}>
            <p style={{ margin: '0 0 18px' }}>
              Les données existent. Elles sont publiques. Elles sont produites par DRIAS, par Géorisques, par l'ANSES, par l'INSEE. Mais elles sont dispersées dans des dizaines de portails différents, dans des formats hétérogènes, avec des échelles géographiques qui ne se recoupent pas.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>Pour qu'elles soient utilisables en rendez-vous client, il faut les agréger, les contextualiser, les traduire en langage accessible.</strong> C'est un travail d'éditorialisation que les bases publiques ne font pas — et que vous n'avez pas le temps de faire vous-même pour chaque dossier.
            </p>
            <p style={{ margin: 0 }}>
              futur•e fait ce travail. Vous tapez une commune. En dix secondes, vous avez une lecture sur dix dimensions territoriales avec les sources citées et la mention "données publiques officielles". Pas de score opaque. Pas d'alarme. Une contextualisation factuelle.
            </p>
          </div>
        </div>

        {/* ── PROFESSIONS ──────────────────────────────────────────────── */}
        <div style={{ padding: '80px 28px' }}>
          <div className="section-wrap">
            <div className="section-kicker">Quatre professions, quatre angles</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#e9ecf2', margin: '0 0 24px' }}>
              Pas le même besoin,<br />
              <em style={{ fontStyle: 'italic', color: ACCENT }}>pas le même livrable.</em>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: '#9ba3b4', maxWidth: 680, marginBottom: 0 }}>
              futur•e adapte son interface, son export et ses alertes selon votre métier.
            </p>
            <div className="profession-grid">
              {PROFESSIONS.map((p) => (
                <div key={p.value} className="profession-card">
                  <div style={{ width: 42, height: 42, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 20, background: p.iconBg }}>
                    {p.icon}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7388', marginBottom: 14 }}>
                    {p.tag}
                  </div>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: '#e9ecf2', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: '#c5cad6', margin: '0 0 20px' }}>
                    {p.pitch}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
                    {p.bullets.map((b) => (
                      <li key={b} style={{ fontSize: 13, color: '#9ba3b4', lineHeight: 1.55, padding: '6px 0 6px 18px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, top: 13, width: 6, height: 1, background: ACCENT, display: 'block' }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a href="#inscription" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, textDecoration: 'none' }}>
                    Voir le détail →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

{/* ── WHY NOW ──────────────────────────────────────────────────── */}
        <div style={{ padding: '96px 28px' }}>
          <div className="section-wrap">
            <div className="section-kicker">Pourquoi maintenant</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#e9ecf2', margin: '0 0 24px' }}>
              Le sujet entre<br />
              <em style={{ fontStyle: 'italic', color: ACCENT }}>dans vos rendez-vous.</em>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: '#9ba3b4', maxWidth: 680, marginBottom: 48 }}>
              Le risque climatique et sanitaire n'est plus une projection. C'est une donnée d'arbitrage que vos clients commencent à intégrer dans leurs décisions.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { num: '+ 124 %', title: 'Sinistres climatiques', desc: "Hausse des sinistres habitation liés aux risques naturels en France entre 2000 et 2024. Les assureurs durcissent. Les primes augmentent. Vos clients posent des questions.", src: 'France Assureurs · 2024' },
                { num: '~ 35 000', title: 'Communes françaises', desc: "Chacune avec un profil distinct sur dix dimensions. futur•e couvre l'intégralité du territoire métropolitain et ultra-marin.", src: 'INSEE · DRIAS · Géorisques' },
                { num: '10 s', title: 'Pour une lecture complète', desc: "De la saisie du nom de commune à l'affichage des dix dimensions sourcées, prêtes à être montrées à votre client ou exportées en PDF.", src: 'Mesuré en conditions réelles' },
              ].map((w) => (
                <div key={w.num} className="why-card">
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 46, lineHeight: 1, color: ACCENT, marginBottom: 14, fontWeight: 400, letterSpacing: '-0.02em' }}>{w.num}</div>
                  <div style={{ fontWeight: 500, fontSize: 15, color: '#e9ecf2', marginBottom: 10 }}>{w.title}</div>
                  <p style={{ fontSize: 13, color: '#9ba3b4', lineHeight: 1.6, margin: 0 }}>{w.desc}</p>
                  <span style={{ display: 'block', marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7388', letterSpacing: '0.06em' }}>Source : {w.src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SCÈNE ────────────────────────────────────────────────────── */}
        <div style={{ padding: '96px 28px', maxWidth: 980, margin: '0 auto' }}>
          <div className="scene-inner">
            <div className="section-kicker">Un rendez-vous client</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(26px,3.4vw,38px)', lineHeight: 1.2, fontWeight: 400, letterSpacing: '-0.015em', margin: '0 0 32px', color: '#e9ecf2' }}>
              Avant futur•e, et <em style={{ fontStyle: 'italic', color: ACCENT }}>après.</em>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7388', marginBottom: 14 }}>Avant — sans futur•e</div>
                {[
                  { time: 'Min 02', text: <><strong style={{ color: '#e9ecf2', fontWeight: 500 }}>Le client demande</strong> si le bien qu'il envisage à Saint-Jean-de-Luz sera encore assurable dans 20 ans.</> },
                  { time: 'Min 03', text: <>Vous évoquez la submersion, le retrait du trait de côte, "ça dépend des zones"… Sans chiffre précis.</> },
                  { time: 'Min 12', text: <>Le client repart <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>avec plus de questions que de réponses</strong>. Il consultera Google. Vous perdez la main.</> },
                  { time: 'J + 7', text: <>Le client revient avec des informations contradictoires lues en ligne. Vous passez 30 minutes à les démêler.</> },
                ].map((s) => (
                  <div key={s.time} className="scene-step">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: ACCENT, letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{s.time}</span>
                    {s.text}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7388', marginBottom: 14 }}>Avec futur•e</div>
                {[
                  { time: 'Min 02', text: <><strong style={{ color: '#e9ecf2', fontWeight: 500 }}>Le client pose la même question.</strong></> },
                  { time: 'Min 02 + 10s', text: <>Vous tapez "Saint-Jean-de-Luz" dans futur•e. La fiche s'affiche : submersion, qualité air, vulnérabilité économique, projection 2050. Sources citées.</> },
                  { time: 'Min 04', text: <>Vous montrez l'écran. <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>Vous expliquez les données ensemble.</strong> Le client comprend. La décision se prend en connaissance.</> },
                  { time: 'Min 10', text: <>Vous exportez le PDF. <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>Vous avez une trace.</strong> Le client a une référence.</> },
                ].map((s) => (
                  <div key={s.time} className="scene-step">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: ACCENT, letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{s.time}</span>
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── PRINCIPES ────────────────────────────────────────────────── */}
        <div style={{ padding: '96px 28px', maxWidth: 760, margin: '0 auto' }}>
          <div className="section-kicker">Trois principes éditoriaux</div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#e9ecf2', margin: '0 0 48px' }}>
            Ce qui rend cet outil<br />
            <em style={{ fontStyle: 'italic', color: ACCENT }}>professionnellement utilisable.</em>
          </h2>
          {[
            {
              num: '01',
              title: 'Sources citées, toujours',
              body: <p style={{ fontSize: 15, color: '#9ba3b4', lineHeight: 1.7, margin: 0 }}>Chaque chiffre, chaque projection, chaque alerte est explicitement attribué à sa source primaire. <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>DRIAS pour le climat, Géorisques pour les risques naturels, ANSES pour la qualité sanitaire, INSEE pour le socio-économique.</strong> Vous ne transmettez pas une opinion : vous transmettez une donnée publique vérifiable.</p>,
            },
            {
              num: '02',
              title: 'Aucun score synthétique opaque',
              body: <p style={{ fontSize: 15, color: '#9ba3b4', lineHeight: 1.7, margin: 0 }}>futur•e refuse les notes de A à E ou les scores climatiques composites. Ce sont des artefacts éditoriaux qui simplifient à outrance. <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>À la place : dix dimensions distinctes, lisibles séparément.</strong> Une commune peut être bien classée sur la canicule et mal sur la submersion. C'est plus utile pour vous qu'un score moyen.</p>,
            },
            {
              num: '03',
              title: 'Ni alarmisme, ni minimisation',
              body: <p style={{ fontSize: 15, color: '#9ba3b4', lineHeight: 1.7, margin: 0 }}>La voix éditoriale est sobre, calme, lucide. Pas de "danger imminent", pas de "tout va bien". <strong style={{ color: '#e9ecf2', fontWeight: 500 }}>L'incertitude est nommée comme telle. Les positifs sont signalés quand ils existent.</strong> C'est la seule voix qu'un professionnel peut transmettre à son client sans s'exposer à la contradiction.</p>,
            },
          ].map((p) => (
            <div key={p.num} className="principle">
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 60, lineHeight: 1, color: ACCENT, fontWeight: 400, letterSpacing: '-0.04em' }}>{p.num}</div>
              <div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: '#e9ecf2', margin: '6px 0 12px', letterSpacing: '-0.01em', fontStyle: 'italic' }}>{p.title}</h3>
                {p.body}
              </div>
            </div>
          ))}
        </div>

        {/* ── FORMULAIRE ───────────────────────────────────────────────── */}
        <div id="inscription" style={{ padding: '96px 28px 120px', maxWidth: 680, margin: '0 auto' }}>
          <div className="form-card">
            <div className="section-kicker">Avant-première professionnelle</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,3.6vw,40px)', lineHeight: 1.15, fontWeight: 400, letterSpacing: '-0.015em', margin: '0 0 16px', color: '#e9ecf2' }}>
              Recevez l'accès<br />
              <em style={{ fontStyle: 'italic', color: ACCENT }}>en avant-première.</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#9ba3b4', margin: '0 0 32px' }}>
              futur•e Pro ouvre progressivement à l'automne 2026, segment par segment. Inscrivez-vous pour accéder aux essais gratuits prioritaires, échanger avec nous sur vos besoins concrets, et participer à la conception des fonctionnalités spécifiques à votre métier.
            </p>
            <ProForm />
          </div>
        </div>

      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '36px 28px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontStyle: 'italic', color: '#e9ecf2', textDecoration: 'none' }}>
            futur<span style={{ color: ACCENT, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6b7388', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.7 }}>
            Données publiques françaises · Aucune publicité<br />
            futur•e Pro · Avant-première professionnelle
          </div>
        </div>
      </footer>
    </>
  );
}
