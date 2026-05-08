import type { Metadata } from 'next';
import Link from 'next/link';
import { CommuneSearch } from '@/components/CommuneSearch';
import Navbar from '@/components/Navbar';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Chaleur et canicule en France · futur•e',
  description:
    "Jours de canicule, nuits étouffantes, qualité de l'air : cherchez votre commune pour voir ce que les étés de 2050 changeront concrètement.",
  openGraph: {
    title: 'Chaleur et canicule en France · futur•e',
    description: 'Projections climatiques pour chaque commune française. Jours > 30°C, nuits tropicales, score de tension thermique.',
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

  /* Hero */
  .eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:18px;display:flex;align-items:center;gap:10px;}
  .eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:${ACCENT};box-shadow:0 0 10px ${ACCENT};flex-shrink:0;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(36px,5vw,60px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 22px;color:var(--fg-1);}
  h1 em{font-style:italic;color:${ACCENT};}
  .lede{font-size:18px;color:var(--fg-3);margin:0 0 48px;line-height:1.7;max-width:620px;}

  /* Search hint */
  .search-hint{margin-top:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);display:flex;align-items:center;gap:6px;}

  /* Section */
  .section{margin:72px 0 0;}
  .section-eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};margin-bottom:10px;}
  .section-title{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,3vw,34px);line-height:1.15;letter-spacing:-0.015em;margin:0 0 6px;color:var(--fg-1);}
  .section-sub{font-size:14px;color:var(--fg-4);margin:0 0 28px;font-family:var(--font-mono);}
  .divider{height:1px;background:rgba(255,255,255,0.06);margin:0;}

  /* Article cards */
  .articles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px;}
  .article-card{border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;overflow:hidden;transition:border-color 0.2s,background 0.2s;}
  .article-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15);}
  .article-img{width:100%;height:160px;object-fit:cover;display:block;filter:brightness(0.82);}
  .article-body{padding:20px;display:flex;flex-direction:column;gap:10px;flex:1;}
  .article-cat{font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;padding:3px 8px;border-radius:4px;align-self:flex-start;}
  .article-title{font-size:15px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .article-desc{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.6;flex:1;}
  .article-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};}

  /* Rapport CTA — bloc mis en avant */
  .rapport-cta{display:flex;flex-direction:column;gap:16px;padding:36px 40px;border-radius:14px;background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.22);text-decoration:none;margin-top:28px;transition:background 0.2s,border-color 0.2s;position:relative;overflow:hidden;}
  .rapport-cta::after{content:"";position:absolute;top:-60px;right:-60px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,${ACCENT}14 0%,transparent 70%);pointer-events:none;}
  .rapport-cta:hover{background:rgba(248,113,113,0.09);border-color:rgba(248,113,113,0.35);}
  .rapport-cta-eyebrow{font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};}
  .rapport-cta-title{font-family:var(--font-serif);font-size:clamp(22px,2.5vw,30px);font-weight:400;color:var(--fg-1);line-height:1.2;margin:0;}
  .rapport-cta-desc{font-size:15px;color:var(--fg-3);line-height:1.65;max-width:560px;}
  .rapport-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:14px;font-weight:600;border-radius:6px;align-self:flex-start;}

  /* Guides secondaires */
  .guides-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:14px;}
  .guide-card{padding:22px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:border-color 0.2s,background 0.2s;}
  .guide-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.14);}
  .guide-label{font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);}
  .guide-title{font-size:14px;font-weight:500;color:var(--fg-1);line-height:1.35;}
  .guide-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};margin-top:auto;}

  /* Signal cards */
  .signal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:28px;}
  .signal-card{padding:22px;border-radius:10px;background:rgba(248,113,113,0.04);border:1px solid rgba(248,113,113,0.13);display:flex;flex-direction:column;gap:8px;}
  .signal-source{font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};opacity:0.65;}
  .signal-head{font-size:14px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .signal-body{font-size:13px;color:var(--fg-3);line-height:1.6;}

  /* Footer */
  .page-footer{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:768px){
    .page{padding:48px 20px 80px;}
    h1{font-size:34px;}
    .articles-grid,.guides-grid,.signal-grid{grid-template-columns:1fr;}
    .rapport-cta{padding:24px 22px;}
  }
`;

export default function ChaleurPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb" style={{ width: 600, height: 600, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -180, left: -150 }} />
      <div className="orb" style={{ width: 380, height: 380, background: 'radial-gradient(circle,#fb923c 0%,transparent 70%)', bottom: -80, right: -80, animationDelay: '-6s', opacity: 0.13 }} />

      <Navbar />

      <main className="page">

        {/* ── BLOC 1 — TERRITOIRE ────────────────────────────────────────── */}
        <div className="eyebrow">Climat · Chaleur et canicule</div>
        <h1>
          Votre commune face<br />
          à la <em>chaleur extrême</em>
        </h1>
        <p className="lede">
          En 2050, des dizaines de communes françaises dépasseront 60 jours au-dessus de 30°C par an.
          Cherchez votre commune pour voir ce que ça change concrètement : jours de canicule, nuits étouffantes, qualité de l'air.
        </p>

        <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
          Chercher ma commune
        </div>
        <CommuneSearch
          slug="canicule"
          accent={ACCENT}
          placeholder="Ex : La Rochelle, Lyon, Vannes…"
          basePath="/chaleur"
        />
        <div className="search-hint">
          <span>↳</span>
          <span>Projections 2050 · Géorisques · Qualité de l'air · Données publiques</span>
        </div>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 2 — COMPRENDRE ────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Comprendre</div>
          <h2 className="section-title">Ce que la chaleur change vraiment</h2>
          <p className="section-sub">Trois lectures pour aller plus loin que la météo.</p>

          <div className="articles-grid">
            <Link href="/savoir/canicule" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chaleur-rue.jpg" alt="Rue vide sous la canicule" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Projections</span>
                <div className="article-title">Canicule en 2050 : ce qui nous attend</div>
                <div className="article-desc">
                  Marseille, Lyon, Toulouse : les données scientifiques commune par commune. Quels territoires basculeront vers un nouveau régime thermique ?
                </div>
                <div className="article-cta">Lire l'article →</div>
              </div>
            </Link>

            <Link href="/savoir/chaleur-sante-mentale" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chaleur-sante-mentale.jpg" alt="Chaleur et santé mentale" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Santé mentale</span>
                <div className="article-title">Chaleur et santé mentale</div>
                <div className="article-desc">
                  Sommeil perturbé, humeur dégradée, hospitalisations en hausse : les effets documentés sur la psyché, et les profils les plus exposés.
                </div>
                <div className="article-cta">Lire l'article →</div>
              </div>
            </Link>

            <Link href="/savoir/pollutions-invisibles" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chaleur-feuille.jpg" alt="Pollution et air" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>Air & sols</span>
                <div className="article-title">Pollutions invisibles</div>
                <div className="article-desc">
                  La chaleur amplifie les pics d'ozone et de pollution fine. Comment lire les données de qualité de l'air et réduire son exposition.
                </div>
                <div className="article-cta">Lire l'article →</div>
              </div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 3 — AGIR ──────────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Agir</div>
          <h2 className="section-title">Ce que vous pouvez faire maintenant</h2>
          <p className="section-sub">Un diagnostic complet, et deux guides ciblés.</p>

          {/* Rapport — mis en avant */}
          <Link href="/rapport" className="rapport-cta">
            <div className="rapport-cta-eyebrow">Rapport personnalisé · futur•e</div>
            <p className="rapport-cta-title">
              Votre commune, votre profil,<br />
              <em style={{ fontStyle: 'italic', color: ACCENT }}>vos décisions éclairées</em>
            </p>
            <p className="rapport-cta-desc">
              Six modules croisés pour votre situation spécifique : <strong style={{ color: 'var(--fg-1)' }}>Quartier, Santé, Logement, Métier, Mobilité, Projets.</strong>{' '}
              Pas un article générique : un diagnostic construit à partir de données publiques réelles, mis à jour régulièrement.
            </p>
            <span className="rapport-cta-btn">
              Voir mon rapport →
            </span>
          </Link>

          {/* Guides secondaires */}
          <div className="guides-grid">
            <Link href="/agir/canicule" className="guide-card">
              <div className="guide-label">Guide pratique</div>
              <div className="guide-title">Se préparer à la canicule</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                Ventilation nocturne, hydratation, personnes vulnérables dans l'entourage. Les gestes qui font vraiment la différence.
              </div>
              <div className="guide-cta">Voir le guide →</div>
            </Link>

            <Link href="/comparateur" className="guide-card">
              <div className="guide-label">Outil de comparaison</div>
              <div className="guide-title">Comparer deux communes</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                Vous pensez à déménager ? Chaleur, air, eau, revenus, accès aux soins côte à côte en moins de 10 secondes.
              </div>
              <div className="guide-cta">Ouvrir le comparateur →</div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 4 — SIGNAL ────────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Signal en cours</div>
          <h2 className="section-title">Ce que les données disent aujourd'hui</h2>
          <p className="section-sub">Bulletin de veille · Mai 2026.</p>

          <div className="signal-grid">
            <div className="signal-card">
              <div className="signal-source">Météo-France · Projections 2050</div>
              <div className="signal-head">57 communes dépasseront 60 jours de canicule par an</div>
              <div className="signal-body">
                Les modèles climatiques sont convergents : dans le sud-est et la vallée du Rhône, Nice, Marseille et Montpellier basculeront vers un nouveau régime thermique avant 2050. Ce n'est plus une hypothèse, c'est une trajectoire probable.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">Copernicus · Rapport 2025</div>
              <div className="signal-head">2025 : deuxième été le plus chaud jamais enregistré en Europe</div>
              <div className="signal-body">
                Les températures estivales européennes dépassaient de 1,3°C la moyenne d'avant l'ère industrielle. La trajectoire est cohérente avec les projections à +2°C et +4°C que futur•e utilise.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">Santé publique France · 2025</div>
              <div className="signal-head">+18 % de surmortalité lors des canicules prolongées</div>
              <div className="signal-body">
                Les épisodes de plus de 5 jours consécutifs au-dessus de 30°C montrent une surmortalité en hausse par rapport à la décennie précédente, surtout chez les 75 ans et plus vivant seuls.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">ATMO France · Été 2025</div>
              <div className="signal-head">L'ozone estival en hausse dans les grandes villes du sud</div>
              <div className="signal-body">
                La chaleur transforme les polluants de l'air en ozone. Marseille, Lyon et Toulouse ont dépassé le seuil d'alerte lors de chaque épisode caniculaire depuis 2022. Les personnes asthmatiques sont les plus exposées.
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="page-footer">
        <div>futur•e · Chaleur et canicule</div>
        <div>
          <Link href="/comparateur">Comparateur</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
