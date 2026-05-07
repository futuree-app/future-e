import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommuneSearch } from '@/components/CommuneSearch';
import { LocalTensionContext } from '@/components/LocalTensionContext';
import Navbar from '@/components/Navbar';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Chaleur et canicule en France · futur•e',
  description:
    'Projections DRIAS +4°C · jours de canicule, nuits tropicales, températures estivales. Cherchez votre commune pour voir son exposition à la chaleur extrême en 2050.',
  openGraph: {
    title: 'Chaleur et canicule en France · futur•e',
    description: 'Projections DRIAS +4°C pour chaque commune française. Jours > 30°C, nuits tropicales, score de tension thermique.',
  },
};

const ACCENT = '#f87171';

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.22;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.12) translate(12px,-20px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .page{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:72px 28px 120px;}

  /* Typography */
  .eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:18px;display:flex;align-items:center;gap:10px;}
  .eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:${ACCENT};box-shadow:0 0 10px ${ACCENT};flex-shrink:0;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(36px,5vw,60px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 22px;color:var(--fg-1);}
  h1 em{font-style:italic;color:${ACCENT};}
  .lede{font-size:18px;color:var(--fg-3);margin:0 0 56px;line-height:1.7;max-width:620px;}

  /* Section headers */
  .section{margin:80px 0 0;}
  .section-eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};margin-bottom:10px;}
  .section-title{font-family:var(--font-serif);font-weight:400;font-size:clamp(26px,3vw,36px);line-height:1.15;letter-spacing:-0.015em;margin:0 0 8px;color:var(--fg-1);}
  .section-sub{font-size:15px;color:var(--fg-4);margin:0 0 32px;line-height:1.6;font-family:var(--font-mono);}

  /* Article cards */
  .articles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px;}
  .article-card{padding:24px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;gap:12px;transition:border-color 0.2s,background 0.2s;}
  .article-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15);}
  .article-cat{font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;padding:3px 8px;border-radius:4px;}
  .article-title{font-family:var(--font-sans);font-size:15px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .article-desc{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.6;flex:1;}
  .article-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};margin-top:4px;}

  /* Profile cards (Agir) */
  .agir-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:28px;}
  .agir-card{padding:28px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;gap:10px;transition:border-color 0.2s,background 0.2s;}
  .agir-card:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.16);}
  .agir-profile{font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--fg-4);}
  .agir-title{font-family:var(--font-sans);font-size:16px;font-weight:500;color:var(--fg-1);line-height:1.35;}
  .agir-desc{font-size:13px;color:var(--fg-3);line-height:1.6;}
  .agir-arrow{font-family:var(--font-mono);font-size:11px;color:${ACCENT};margin-top:auto;}

  /* Signal cards */
  .signal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:28px;}
  .signal-card{padding:24px;border-radius:10px;background:rgba(248,113,113,0.04);border:1px solid rgba(248,113,113,0.15);display:flex;flex-direction:column;gap:8px;}
  .signal-date{font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#f87171;opacity:0.7;}
  .signal-head{font-family:var(--font-sans);font-size:14px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .signal-body{font-size:13px;color:var(--fg-3);line-height:1.6;}
  .signal-src{font-family:var(--font-mono);font-size:10px;color:var(--fg-4);margin-top:4px;}

  /* Divider */
  .divider{height:1px;background:rgba(255,255,255,0.06);margin:0;}

  /* Footer */
  .page-footer{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:768px){
    .page{padding:48px 20px 80px;}
    h1{font-size:34px;}
    .articles-grid{grid-template-columns:1fr;}
    .agir-grid{grid-template-columns:1fr;}
    .signal-grid{grid-template-columns:1fr;}
  }
`;

export default function ChaleurPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -180, left: -150 }} />
      <div className="orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle,#fb923c 0%,transparent 70%)', bottom: -100, right: -80, animationDelay: '-6s', opacity: 0.14 }} />

      <Navbar />

      <main className="page">

        {/* ── BLOC 1 — TERRITOIRE ────────────────────────────────────────── */}
        <div className="eyebrow">Climat · Chaleur et canicule</div>
        <h1>
          Votre commune face<br />
          à la <em>chaleur extrême</em>
        </h1>
        <p className="lede">
          Les projections DRIAS au scénario +4°C montrent que des dizaines de communes françaises dépasseront
          60 jours au-dessus de 30°C par an d'ici 2050. Cherchez votre commune pour voir son exposition.
        </p>

        <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
          Rechercher ma commune
        </div>
        <CommuneSearch
          slug="canicule"
          accent={ACCENT}
          placeholder="Saisissez votre commune…"
          basePath="/chaleur"
        />
        <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)' }}>
          Données DRIAS +4°C · Géorisques · ATMO France · Source : geo.api.gouv.fr
        </div>

        <LocalTensionContext
          slug="canicule"
          thematique="Canicule"
          accent={ACCENT}
          limit={50}
          basePath="/chaleur"
        />

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 2 — COMPRENDRE ────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Comprendre</div>
          <h2 className="section-title">Ce que la chaleur change vraiment</h2>
          <p className="section-sub">Trois lectures pour aller plus loin que la météo.</p>

          <div className="articles-grid">
            <Link href="/savoir/chaleur-sante-mentale" className="article-card">
              <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Santé mentale</span>
              <div className="article-title">Chaleur et santé mentale</div>
              <div className="article-desc">
                Sommeil, humeur, hospitalisations psychiatriques : les effets documentés de la chaleur sur la psyché. Ce qui est établi, ce qui reste débattu.
              </div>
              <div className="article-cta">Lire l'article →</div>
            </Link>

            <Link href="/savoir/canicule" className="article-card">
              <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Projections</span>
              <div className="article-title">Canicule en 2050 : les projections</div>
              <div className="article-desc">
                Marseille, Lyon, Toulouse : les données DRIAS commune par commune. Quels territoires basculeront vers un nouveau régime thermique ?
              </div>
              <div className="article-cta">Lire l'article →</div>
            </Link>

            <Link href="/savoir/pollutions-invisibles" className="article-card">
              <span className="article-cat" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>Air & sols</span>
              <div className="article-title">Pollutions invisibles</div>
              <div className="article-desc">
                La chaleur amplifie l'ozone estival et les pics de pollution. Comment lire les données ATMO et agir à la bonne échelle.
              </div>
              <div className="article-cta">Lire l'article →</div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 3 — AGIR ──────────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Agir</div>
          <h2 className="section-title">Ce que vous pouvez faire maintenant</h2>
          <p className="section-sub">Trois angles selon votre situation.</p>

          <div className="agir-grid">
            <Link href="/agir/canicule" className="agir-card">
              <div className="agir-profile">Guide pratique</div>
              <div className="agir-title">Se préparer à la canicule</div>
              <div className="agir-desc">
                Ventilation nocturne, hydratation, identification des personnes vulnérables dans votre entourage. Les gestes qui font une vraie différence lors d'un épisode caniculaire.
              </div>
              <div className="agir-arrow">Voir le guide →</div>
            </Link>

            <Link href="/comparateur" className="agir-card">
              <div className="agir-profile">Projet de vie</div>
              <div className="agir-title">Comparer deux communes sur la chaleur</div>
              <div className="agir-desc">
                Vous envisagez de déménager ? Le comparateur croise chaleur, qualité de l'air, eau, revenus et accès aux soins pour deux territoires côte à côte.
              </div>
              <div className="agir-arrow">Ouvrir le comparateur →</div>
            </Link>

            <Link href="/rapport" className="agir-card">
              <div className="agir-profile">Rapport personnalisé</div>
              <div className="agir-title">Votre rapport complet</div>
              <div className="agir-desc">
                Chaleur, logement, mobilité, santé : un diagnostic croisant toutes les sources pour votre commune et votre profil. Mis à jour avec les nouvelles données.
              </div>
              <div className="agir-arrow">Voir mon rapport →</div>
            </Link>

            <Link href="/agir/voiture-electrique" className="agir-card">
              <div className="agir-profile">Mobilité</div>
              <div className="agir-title">La chaleur et la voiture thermique</div>
              <div className="agir-desc">
                Les épisodes de chaleur dégradent les performances des moteurs thermiques et amplifient les îlots de chaleur urbains. Quand passer à l'électrique a du sens.
              </div>
              <div className="agir-arrow">Voir le guide →</div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 4 — SIGNAL ────────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Signal en cours</div>
          <h2 className="section-title">Ce que les données disent aujourd'hui</h2>
          <p className="section-sub">Bulletin de veille · Dernière mise à jour : mai 2026.</p>

          <div className="signal-grid">
            <div className="signal-card">
              <div className="signal-date">DRIAS · Scénario +4°C</div>
              <div className="signal-head">57 communes dépasseront 60 jours/an au-dessus de 30°C</div>
              <div className="signal-body">
                Les projections au scénario gwl30 montrent une rupture nette dans le sud-est et la vallée du Rhône. Nice, Marseille et Montpellier seront concernées avant 2050 dans la plupart des modèles.
              </div>
              <div className="signal-src">Source : DRIAS / Météo-France · gwl30 (+4°C)</div>
            </div>

            <div className="signal-card">
              <div className="signal-date">Copernicus · Rapport 2025</div>
              <div className="signal-head">2025 : deuxième été le plus chaud jamais enregistré en Europe</div>
              <div className="signal-body">
                Le service Copernicus confirme que les températures estivales européennes dépassent de 1,3°C la moyenne pré-industrielle. La tendance est cohérente avec les trajectoires gwl20 à gwl30.
              </div>
              <div className="signal-src">Source : Copernicus Climate Change Service · C3S</div>
            </div>

            <div className="signal-card">
              <div className="signal-date">Santé publique France · 2025</div>
              <div className="signal-head">+18 % de surmortalité lors des épisodes caniculaires prolongés</div>
              <div className="signal-body">
                Les épisodes de chaleur de plus de 5 jours consécutifs montrent une surmortalité en hausse par rapport à la décennie précédente, notamment chez les 75 ans et plus vivant seuls.
              </div>
              <div className="signal-src">Source : Santé publique France · Surveillance canicule</div>
            </div>

            <div className="signal-card">
              <div className="signal-date">ATMO France · Été 2025</div>
              <div className="signal-head">L'ozone estival en hausse dans les agglomérations du sud</div>
              <div className="signal-body">
                Les pics d'ozone (O₃) sont amplifiés par la chaleur. Marseille, Lyon et Toulouse ont enregistré des dépassements du seuil d'information (180 µg/m³) lors de chaque canicule depuis 2022.
              </div>
              <div className="signal-src">Source : ATMO France · Indice ATMO quotidien</div>
            </div>
          </div>
        </section>

      </main>

      <footer className="page-footer">
        <div>futur•e · Chaleur et canicule</div>
        <div>
          <Link href="/comparateur" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>Comparateur</Link>
          {' · '}
          <Link href="/pourquoi" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
