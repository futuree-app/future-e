import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "J'utilise beaucoup ma voiture · futur•e",
  description:
    "Dépendance automobile, budget transport, alternatives réelles : les bons articles pour comprendre votre situation, puis aller plus loin avec le rapport futur•e.",
  openGraph: {
    title: "J'utilise beaucoup ma voiture · futur•e",
    description:
      "Un hub de lecture et d'action sur la dépendance automobile, sans recherche communale libre, avec un accès plus profond via le rapport.",
  },
};

const ACCENT = '#fb923c';

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.22;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.12) translate(12px,-20px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .page{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:72px 28px 120px;}
  .eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:18px;display:flex;align-items:center;gap:10px;}
  .eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:${ACCENT};box-shadow:0 0 10px ${ACCENT};flex-shrink:0;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(36px,5vw,60px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 22px;color:var(--fg-1);}
  h1 em{font-style:italic;color:${ACCENT};}
  .lede{font-size:18px;color:var(--fg-3);margin:0 0 30px;line-height:1.7;max-width:680px;}
  .hero-note{padding:24px 26px;border-radius:12px;background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.18);margin:0 0 20px;display:flex;flex-direction:column;gap:10px;}
  .hero-note-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};}
  .hero-note-text{font-size:15px;color:var(--fg-3);line-height:1.7;max-width:720px;}
  .hero-note-text strong{color:var(--fg-1);font-weight:500;}

  .section{margin:72px 0 0;}
  .section-eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};margin-bottom:10px;}
  .section-title{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,3vw,34px);line-height:1.15;letter-spacing:-0.015em;margin:0 0 6px;color:var(--fg-1);}
  .section-sub{font-size:14px;color:var(--fg-4);margin:0 0 28px;font-family:var(--font-mono);}
  .divider{height:1px;background:rgba(255,255,255,0.06);margin:0;}

  .articles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px;}
  .article-card{border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;overflow:hidden;transition:border-color 0.2s,background 0.2s;}
  .article-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15);}
  .article-img{width:100%;height:160px;object-fit:cover;display:block;filter:brightness(0.82);}
  .article-body{padding:20px;display:flex;flex-direction:column;gap:10px;flex:1;}
  .article-cat{font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;padding:3px 8px;border-radius:4px;align-self:flex-start;}
  .article-title{font-size:15px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .article-desc{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.6;flex:1;}
  .article-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};}

  .rapport-cta{display:flex;flex-direction:column;gap:16px;padding:36px 40px;border-radius:14px;background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.22);text-decoration:none;margin-top:28px;transition:background 0.2s,border-color 0.2s;position:relative;overflow:hidden;}
  .rapport-cta::after{content:"";position:absolute;top:-60px;right:-60px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,${ACCENT}14 0%,transparent 70%);pointer-events:none;}
  .rapport-cta:hover{background:rgba(251,146,60,0.09);border-color:rgba(251,146,60,0.35);}
  .rapport-cta-eyebrow{font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};}
  .rapport-cta-title{font-family:var(--font-serif);font-size:clamp(22px,2.5vw,30px);font-weight:400;color:var(--fg-1);line-height:1.2;margin:0;}
  .rapport-cta-desc{font-size:15px;color:var(--fg-3);line-height:1.65;max-width:620px;}
  .rapport-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:14px;font-weight:600;border-radius:6px;align-self:flex-start;}

  .guides-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:14px;}
  .guide-card{padding:22px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:border-color 0.2s,background 0.2s;}
  .guide-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.14);}
  .guide-label{font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);}
  .guide-title{font-size:14px;font-weight:500;color:var(--fg-1);line-height:1.35;}
  .guide-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};margin-top:auto;}

  .signal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:28px;}
  .signal-card{padding:22px;border-radius:10px;background:rgba(251,146,60,0.04);border:1px solid rgba(251,146,60,0.13);display:flex;flex-direction:column;gap:8px;}
  .signal-source{font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};opacity:0.65;}
  .signal-head{font-size:14px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .signal-body{font-size:13px;color:var(--fg-3);line-height:1.6;}

  .page-footer{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:768px){
    .page{padding:48px 20px 80px;}
    h1{font-size:34px;}
    .articles-grid,.guides-grid,.signal-grid{grid-template-columns:1fr;}
    .rapport-cta{padding:24px 22px;}
  }
`;

export default function JUtiliseBeaucoupMaVoiturePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb" style={{ width: 600, height: 600, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -180, left: -150 }} />
      <div className="orb" style={{ width: 380, height: 380, background: 'radial-gradient(circle,#a78bfa 0%,transparent 70%)', bottom: -80, right: -80, animationDelay: '-6s', opacity: 0.13 }} />

      <Navbar />

      <main className="page">
        <div className="eyebrow">Mobilité · Dépendance automobile</div>
        <h1>
          Vous utilisez beaucoup<br />
          votre <em>voiture</em>
        </h1>
        <p className="lede">
          Dans beaucoup de territoires français, la voiture n&apos;est pas un confort mais une condition d&apos;accès au travail, aux courses ou aux soins. Ce hub rassemble les bonnes lectures pour comprendre votre situation, puis les outils utiles pour agir sans partir d&apos;un diagnostic communal gratuit.
        </p>

        <div className="hero-note">
          <div className="hero-note-label">Ce qui est public ici</div>
          <div className="hero-note-text">
            Vous pouvez lire les analyses et les guides pratiques. <strong>Le diagnostic par commune et par profil détaillé</strong> reste réservé au rapport : il va plus loin avec les six dimensions futur•e
            {' '}<strong>Quartier, Santé, Logement, Métier, Mobilité, Projets</strong>.
          </div>
        </div>

        <div className="divider" style={{ marginTop: 72 }} />

        <section className="section">
          <div className="section-eyebrow">Comprendre</div>
          <h2 className="section-title">Ce que la dépendance à la voiture change vraiment</h2>
          <p className="section-sub">Quatre portes d&apos;entrée : le constat, le classement, puis les arbitrages possibles.</p>

          <div className="articles-grid">
            <Link href="/savoir/dependance-auto" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hub-dependance.jpg" alt="Dépendance automobile" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(251,146,60,0.12)', color: ACCENT }}>Savoir</span>
                <div className="article-title">Pourquoi certains territoires rendent la voiture presque obligatoire</div>
                <div className="article-desc">
                  84 % des actifs ruraux vont travailler en voiture. Ce que ce chiffre dit de l&apos;organisation du territoire, et pourquoi cette dépendance n&apos;est pas un simple choix individuel.
                </div>
                <div className="article-cta">Lire l&apos;article →</div>
              </div>
            </Link>

            <Link href="/j-utilise-beaucoup-ma-voiture/villes-les-plus-dependantes" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/top10-villes-dependantes-voiture.jpg" alt="Top 10 des villes les plus dépendantes à la voiture" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(251,146,60,0.12)', color: ACCENT }}>Classement</span>
                <div className="article-title">Top 10 des villes les plus dépendantes à la voiture</div>
                <div className="article-desc">
                  Un classement gratuit à partir des scores mobilité déjà présents dans futur•e, pour voir où la voiture reste la plus difficile à remplacer dans les grandes communes.
                </div>
                <div className="article-cta">Voir le classement →</div>
              </div>
            </Link>

            <Link href="/comparateur" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/comparer-deux-communes-demenagement.jpg" alt="Comparer deux communes" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>Comparer</span>
                <div className="article-title">Comparer deux communes avant de déménager</div>
                <div className="article-desc">
                  Mobilité, revenus, accès aux soins, chaleur, eau : utile si vous hésitez entre plusieurs territoires et que la voiture pèse déjà lourd dans vos choix.
                </div>
                <div className="article-cta">Ouvrir le comparateur →</div>
              </div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        <section className="section">
          <div className="section-eyebrow">Aller plus loin</div>
          <h2 className="section-title">Les guides utiles si vous voulez passer à l&apos;action</h2>
          <p className="section-sub">Ces deux pages sont plus pratiques, plus personnelles, et donc réservées au niveau payant.</p>

          <div className="guides-grid" style={{ marginTop: 28 }}>
            <Link href="/agir/dependance-auto" className="guide-card">
              <div className="guide-label">Agir · Payant</div>
              <div className="guide-title">Évaluer votre dépendance à la voiture et ses alternatives réelles</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                Coût complet, trajets pivots, sensibilité au prix du carburant, solutions vraiment utilisables. Une méthode concrète pour objectiver votre situation.
              </div>
              <div className="guide-cta">Débloquer ce guide →</div>
            </Link>

            <Link href="/agir/voiture-electrique" className="guide-card">
              <div className="guide-label">Agir · Payant</div>
              <div className="guide-title">Passer à l&apos;électrique : ce qui a du sens selon votre territoire</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                Recharge, kilométrage, occasion, longs trajets : ce que le passage à l&apos;électrique change vraiment, et ce qu&apos;il ne résout pas.
              </div>
              <div className="guide-cta">Débloquer ce guide →</div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        <section className="section">
          <div className="section-eyebrow">Rapport</div>
          <h2 className="section-title">Ce que le rapport ajoute</h2>
          <p className="section-sub">Le niveau communal et les arbitrages personnels ne sont pas ouverts ici en libre-service.</p>

          <Link href="/rapport" className="rapport-cta">
            <div className="rapport-cta-eyebrow">Rapport personnalisé · futur•e</div>
            <p className="rapport-cta-title">
              Votre territoire, votre budget,<br />
              <em style={{ fontStyle: 'italic', color: ACCENT }}>vos marges de manœuvre réelles</em>
            </p>
            <p className="rapport-cta-desc">
              Le rapport croise la mobilité avec six dimensions : <strong style={{ color: 'var(--fg-1)' }}>Quartier, Santé, Logement, Métier, Mobilité, Projets.</strong>{' '}
              Il ne vous donne pas seulement une idée générale. Il relie votre lieu de vie, vos contraintes quotidiennes et les décisions qui ont du sens pour vous.
            </p>
            <span className="rapport-cta-btn">Découvrir le rapport →</span>
          </Link>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        <section className="section">
          <div className="section-eyebrow">Signal en cours</div>
          <h2 className="section-title">Ce que les données disent aujourd&apos;hui</h2>
          <p className="section-sub">Bulletin de veille · Mai 2026.</p>

          <div className="signal-grid">
            <div className="signal-card">
              <div className="signal-source">INSEE · Ecolab</div>
              <div className="signal-head">84 % des actifs ruraux vont travailler en voiture</div>
              <div className="signal-body">
                Ce chiffre ne décrit pas un goût français pour l&apos;automobile. Il décrit surtout des territoires où les autres solutions sont trop rares, trop lentes ou simplement absentes.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">ADEME · Observatoire des inégalités</div>
              <div className="signal-head">Dans certains foyers périurbains modestes, le transport pèse jusqu&apos;à 29 % du budget</div>
              <div className="signal-body">
                Quand la voiture devient indispensable, une hausse du carburant ou une panne ne sont pas une gêne passagère. Elles peuvent déstabiliser tout l&apos;équilibre du foyer.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">CGDD · Rapport Dumont</div>
              <div className="signal-head">Les alternatives existent parfois, mais elles sont très inégales selon les axes</div>
              <div className="signal-body">
                Covoiturage organisé, transport à la demande, vélo à assistance électrique : ce ne sont pas des solutions universelles. Leur utilité dépend presque toujours du territoire précis.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">ADEME · 2025</div>
              <div className="signal-head">Passer à l&apos;électrique ne supprime pas la dépendance</div>
              <div className="signal-body">
                Cela peut réduire l&apos;exposition au prix du carburant, mais pas la fragilité de fond : si votre quotidien repose sur un trajet sans alternative, le problème principal reste entier.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        <div>futur•e · Mobilité · J&apos;utilise beaucoup ma voiture</div>
        <div>
          <Link href="/savoir/dependance-auto">Comprendre</Link>
          {' · '}
          <Link href="/agir/dependance-auto">Agir</Link>
        </div>
      </footer>
    </>
  );
}
