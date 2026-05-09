import type { Metadata } from 'next';
import Link from 'next/link';
import { CommuneSearch } from '@/components/CommuneSearch';
import Navbar from '@/components/Navbar';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Inondation et submersion en France · futur•e',
  description:
    "17 millions de Français vivent en zone inondable. Cherchez votre commune pour voir son exposition aux crues, aux submersions marines et aux précipitations extrêmes.",
  openGraph: {
    title: 'Inondation et submersion en France · futur•e',
    description: 'Risque inondation, zones PPRI, précipitations extrêmes : données publiques pour chaque commune française.',
  },
};

const ACCENT = '#60a5fa';

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
  .articles-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:28px;}
  .article-card{border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;overflow:hidden;transition:border-color 0.2s,background 0.2s;}
  .article-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15);}
  .article-img{width:100%;height:160px;object-fit:cover;display:block;filter:brightness(0.82);}
  .article-body{padding:20px;display:flex;flex-direction:column;gap:10px;flex:1;}
  .article-cat{font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;padding:3px 8px;border-radius:4px;align-self:flex-start;}
  .article-title{font-size:15px;font-weight:500;color:var(--fg-1);line-height:1.4;}
  .article-desc{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.6;flex:1;}
  .article-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};}

  /* Rapport CTA */
  .rapport-cta{display:flex;flex-direction:column;gap:16px;padding:36px 40px;border-radius:14px;background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.22);text-decoration:none;margin-top:28px;transition:background 0.2s,border-color 0.2s;position:relative;overflow:hidden;}
  .rapport-cta::after{content:"";position:absolute;top:-60px;right:-60px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,${ACCENT}14 0%,transparent 70%);pointer-events:none;}
  .rapport-cta:hover{background:rgba(96,165,250,0.09);border-color:rgba(96,165,250,0.35);}
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
  .signal-card{padding:22px;border-radius:10px;background:rgba(96,165,250,0.04);border:1px solid rgba(96,165,250,0.13);display:flex;flex-direction:column;gap:8px;}
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

export default function InondationPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb" style={{ width: 600, height: 600, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -180, left: -150 }} />
      <div className="orb" style={{ width: 380, height: 380, background: 'radial-gradient(circle,#818cf8 0%,transparent 70%)', bottom: -80, right: -80, animationDelay: '-6s', opacity: 0.13 }} />

      <Navbar />

      <main className="page">

        {/* ── BLOC 1 — TERRITOIRE ────────────────────────────────────────── */}
        <div className="eyebrow">Climat · Inondation et submersion</div>
        <h1>
          Votre commune face<br />
          aux <em>inondations</em>
        </h1>
        <p className="lede">
          17 millions de Français vivent en zone inondable. Crues de rivières, submersions marines, ruissellement urbain :
          cherchez votre commune pour comprendre son exposition réelle selon les données officielles de l'État.
        </p>

        <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>
          Chercher ma commune
        </div>
        <CommuneSearch
          slug="submersion"
          accent={ACCENT}
          placeholder="Ex : Rouen, Nantes, Bordeaux…"
          basePath="/inondation"
        />
        <div className="search-hint">
          <span>↳</span>
          <span>Géorisques · DRIAS · Précipitations extrêmes · Données publiques</span>
        </div>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 2 — COMPRENDRE ────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Comprendre</div>
          <h2 className="section-title">Ce que le risque inondation signifie vraiment</h2>
          <p className="section-sub">Quatre lectures pour dépasser les idées reçues.</p>

          <div className="articles-grid">
            <Link href="/savoir/submersion" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hub-submersion.jpg" alt="Inondation et submersion marine" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(96,165,250,0.12)', color: ACCENT }}>Projections</span>
                <div className="article-title">Inondations en 2050 : ce qui nous attend</div>
                <div className="article-desc">
                  Les données commune par commune. Quels territoires verront leurs précipitations extrêmes s'intensifier ? Quelles côtes sont menacées par la montée des eaux ?
                </div>
                <div className="article-cta">Lire l'article →</div>
              </div>
            </Link>

            <Link href="/savoir/preparation-catastrophes" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hub-preparation.jpg" alt="Préparation aux catastrophes" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>Résilience</span>
                <div className="article-title">Sommes-nous prêts à la prochaine catastrophe ?</div>
                <div className="article-desc">
                  84 % des Français savent que leur territoire devra s'adapter. Seulement 26 % se sentent préparés. Le paradoxe de la résilience française — et comment le réduire.
                </div>
                <div className="article-cta">Lire l'article →</div>
              </div>
            </Link>

            <Link href="/agir/inondation" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hub-submersion.jpg" alt="Gérer le risque inondation" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(96,165,250,0.12)', color: ACCENT }}>Guide pratique</span>
                <div className="article-title">Gérer le risque inondation</div>
                <div className="article-desc">
                  PPRN, IAL, assurance catnat, Fonds Barnier : comprendre ses droits et obligations quand on vit en zone inondable.
                </div>
                <div className="article-cta">Lire le guide →</div>
              </div>
            </Link>

            <Link href="/georisques-logement" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/future-territoire-landing.jpg" alt="Risques par adresse" className="article-img" />
              <div className="article-body">
                <span className="article-cat" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>Logement</span>
                <div className="article-title">Les risques de votre adresse exacte</div>
                <div className="article-desc">
                  Zone PPRN, zone de crue, niveau de prescription : l'analyse complète des risques naturels à votre adresse précise.
                </div>
                <div className="article-cta">Analyser mon adresse →</div>
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

          <div className="guides-grid">
            <Link href="/agir/inondation" className="guide-card">
              <div className="guide-label">Guide pratique</div>
              <div className="guide-title">Gérer le risque inondation</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                PPRN, clauses assurantielles, Fonds Barnier, clapets anti-retour : les démarches concrètes selon votre zone de risque.
              </div>
              <div className="guide-cta">Voir le guide →</div>
            </Link>

            <Link href="/comparateur" className="guide-card">
              <div className="guide-label">Outil de comparaison</div>
              <div className="guide-title">Comparer deux communes</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                Vous pensez à déménager ? Inondation, chaleur, air, eau, revenus, accès aux soins côte à côte en moins de 10 secondes.
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
              <div className="signal-source">Géorisques · Ministère de la Transition Écologique</div>
              <div className="signal-head">17 millions de Français vivent en zone inondable</div>
              <div className="signal-body">
                Soit plus d'un Français sur quatre. La France est le pays européen le plus exposé au risque d'inondation, avec 9 millions de logements situés dans des zones potentiellement soumises aux crues ou aux submersions marines.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">Caisse centrale de réassurance · 2025</div>
              <div className="signal-head">Les inondations : premier risque naturel assuré en France</div>
              <div className="signal-body">
                Les inondations représentent 40 % du coût total des catastrophes naturelles indemnisées depuis 1982. Le coût moyen d'un sinistre inondation en maison individuelle dépasse 30 000 €. Les projections à 2050 prévoient une multiplication par deux des événements extrêmes.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">Copernicus · Rapport 2025</div>
              <div className="signal-head">Précipitations extrêmes : +18 % d'intensité en 30 ans en Europe</div>
              <div className="signal-body">
                Les épisodes de pluies intenses ont gagné en fréquence et en intensité. Dans le sud de la France, les épisodes méditerranéens ("épisodes cévenols") dépassent de plus en plus souvent les records historiques, même dans des zones non classées à risque.
              </div>
            </div>

            <div className="signal-card">
              <div className="signal-source">BRGM · Projections littorales 2050</div>
              <div className="signal-head">134 communes littorales menacées de submersion permanente</div>
              <div className="signal-body">
                Avec une élévation du niveau de la mer de 30 à 60 cm d'ici 2050, les submersions marines exceptionnelles deviendront régulières sur certains littoraux atlantiques et méditerranéens. Les zones d'habitat temporaire (résidences secondaires) sont particulièrement exposées.
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="page-footer">
        <div>futur•e · Inondation et submersion</div>
        <div>
          <Link href="/comparateur">Comparateur</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
