import type { Metadata } from 'next';
import Link from 'next/link';
import { LocalTensionContext } from '@/components/LocalTensionContext';
import { CommuneSearch } from '@/components/CommuneSearch';
import { AGIR_GUIDES } from '@/config/navigation';

// ISR — contenu 100% public, pas d'auth
export const revalidate = 86400;

// ─── Hub registry ─────────────────────────────────────────────────────────────
const TERRITOIRES_HUBS: Record<
  string,
  {
    thematique: string;
    categorie: string;
    accent: string;
    description: string;
    intro: string;
    searchPlaceholder: string;
  }
> = {
  canicule: {
    thematique: 'Canicule',
    categorie: 'Climat',
    accent: '#f87171',
    description:
      'Trouvez votre commune et accédez à son score de tension canicule, ses projections DRIAS 2050 et les recommandations personnalisées.',
    intro:
      "Les épisodes caniculaires s'intensifient avec le changement climatique. Cherchez votre commune pour accéder à son profil de risque complet.",
    searchPlaceholder: 'Chercher une commune exposée à la canicule…',
  },
  submersion: {
    thematique: 'Submersion',
    categorie: 'Climat',
    accent: '#60a5fa',
    description:
      "Identifiez l'exposition de votre commune au risque de submersion et d'inondation selon les données Géorisques.",
    intro:
      'La montée des eaux et les submersions marines menacent de nombreux territoires. Cherchez votre commune pour voir son exposition.',
    searchPlaceholder: 'Chercher une commune exposée à la submersion…',
  },
  feux: {
    thematique: 'Feux de forêt',
    categorie: 'Climat',
    accent: '#fb923c',
    description:
      "Accédez au score d'exposition aux feux de forêt de votre commune et aux recommandations associées.",
    intro:
      "L'extension des zones à risque incendie est l'une des conséquences les plus documentées du réchauffement en France.",
    searchPlaceholder: 'Chercher une commune exposée aux feux…',
  },
  cadmium: {
    thematique: 'Cadmium',
    categorie: 'Santé',
    accent: '#a78bfa',
    description:
      "Vérifiez si votre commune est située dans une zone à forte teneur en cadmium dans les sols agricoles.",
    intro:
      "La présence de cadmium dans les sols varie fortement selon la géologie. Cherchez votre commune pour voir son exposition.",
    searchPlaceholder: 'Chercher une commune exposée au cadmium…',
  },
  'dependance-auto': {
    thematique: 'Dépendance automobile',
    categorie: 'Mobilité',
    accent: '#fb923c',
    description:
      "Évaluez la vulnérabilité de votre commune face aux chocs sur le prix des carburants et aux transitions de mobilité.",
    intro:
      "La dépendance structurelle à l'automobile représente une fragilité budgétaire réelle pour des millions de foyers.",
    searchPlaceholder: 'Chercher une commune selon sa dépendance auto…',
  },
  secheresse: {
    thematique: 'Sécheresse',
    categorie: 'Climat',
    accent: '#fbbf24',
    description:
      "Analysez le stress hydrique de votre commune et son exposition aux sécheresses prolongées.",
    intro:
      "Le stress hydrique s'intensifie dans de nombreuses régions françaises. Cherchez votre commune pour voir ses indicateurs.",
    searchPlaceholder: 'Chercher une commune exposée à la sécheresse…',
  },
  pollens: {
    thematique: 'Pollens',
    categorie: 'Santé',
    accent: '#4ade80',
    description:
      "Découvrez l'exposition pollinique de votre commune selon les données du RNSA et les projections pour 2050.",
    intro:
      "L'allongement des saisons polliniques et l'intensification des concentrations concernent de plus en plus de territoires.",
    searchPlaceholder: 'Chercher une commune exposée aux pollens…',
  },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = TERRITOIRES_HUBS[slug];
  if (!hub) return { title: 'Territoires · futur•e' };

  return {
    title: `${hub.thematique} par commune — Recherche · futur•e`,
    description: hub.description,
  };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #060812;
    --border: rgba(255,255,255,0.08);
    --text: #e9ecf2;
    --text-muted: #9ba3b4;
    --text-dim: #6b7388;
    --serif: 'Instrument Serif','Times New Roman',serif;
    --sans: 'Instrument Sans',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.25;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.12) translate(12px,-20px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:rgba(6,8,18,0.75);border-bottom:1px solid var(--border);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--text);text-decoration:none;}
  .nav-crumb{font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--text-muted);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--text);}
  .nav-crumb .sep{margin:0 10px;opacity:0.4;}
  .page{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:64px 28px 120px;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px;}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  h1{font-family:var(--serif);font-weight:400;font-size:clamp(32px,4.5vw,52px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 20px;color:var(--text);}
  h1 em{font-style:italic;}
  .lede{font-size:17px;color:var(--text-muted);margin:0 0 48px;line-height:1.7;max-width:600px;}
  .search-section{margin-bottom:56px;}
  .search-label{font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px;}
  .paywall-card{padding:32px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-align:center;margin-top:8px;}
  .page-footer{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;border-top:1px solid var(--border);}
  .page-footer a{color:var(--text-muted);text-decoration:none;}
  @media(max-width:768px){.page{padding:40px 20px 80px;}h1{font-size:30px;}.nav-inner{padding:14px 20px;}}
`;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TerritoiresHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = TERRITOIRES_HUBS[slug];

  if (!hub) {
    return (
      <div style={{ padding: '40px', color: '#e9ecf2', fontFamily: 'system-ui' }}>
        Territoire non trouvé pour le risque &quot;{slug}&quot;.{' '}
        <Link href="/" style={{ color: '#60a5fa' }}>Retour à l&apos;accueil</Link>
      </div>
    );
  }

  const agirGuide = AGIR_GUIDES[slug];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div
        className="orb"
        style={{
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle,${hub.accent} 0%,transparent 70%)`,
          top: '-150px',
          left: '-120px',
        }}
      />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span style={{ color: hub.accent, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/territoires">Territoires</Link>
            <span className="sep">/</span>
            {hub.thematique}
          </div>
        </div>
      </nav>

      <main className="page">
        {/* Intro — toujours visible */}
        <div
          className="tag"
          style={{
            background: `${hub.accent}1a`,
            border: `1px solid ${hub.accent}40`,
            color: hub.accent,
          }}
        >
          {hub.categorie}
        </div>
        <h1>
          Explorer les communes <em style={{ color: hub.accent }}>exposées</em>
          <br />au risque {hub.thematique}
        </h1>
        <p className="lede">{hub.intro}</p>

        {/* Recherche BAN — toujours libre */}
        <div className="search-section">
          <div className="search-label">Recherche de commune</div>
          <CommuneSearch
            slug={slug}
            accent={hub.accent}
            placeholder={hub.searchPlaceholder}
          />
          <div
            style={{
              marginTop: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#4a5468',
            }}
          >
            Tapez 2 lettres minimum · Source : geo.api.gouv.fr
          </div>
        </div>

        {/* Classement complet — 100% gratuit */}
        <LocalTensionContext
          slug={slug}
          thematique={hub.thematique}
          accent={hub.accent}
          limit={50}
        />

        {/* CTA conversion — contextuel */}
        <div
          style={{
            marginTop: 48,
            padding: '36px 40px',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${hub.accent}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: hub.accent,
              marginBottom: 14,
            }}
          >
            Aller plus loin
          </div>
          <p
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 22,
              lineHeight: 1.4,
              color: '#e9ecf2',
              margin: '0 0 8px',
              fontWeight: 400,
            }}
          >
            Personnalisez le diagnostic{' '}
            <em style={{ fontStyle: 'italic', color: hub.accent }}>pour votre commune</em>
          </p>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#6b7388',
              margin: '0 0 24px',
              lineHeight: 1.7,
            }}
          >
            Rapport complet · Recommandations personnalisées · Suivi dans le temps
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/inscription"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '13px 26px',
                background: hub.accent,
                color: '#060812',
                fontFamily: "'Instrument Sans', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: 6,
              }}
            >
              Commencer — 14 jours gratuits
            </Link>
            {agirGuide?.available && (
              <Link
                href={agirGuide.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '13px 22px',
                  border: `1px solid ${hub.accent}40`,
                  color: hub.accent,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                  borderRadius: 6,
                }}
              >
                {agirGuide.label} →
              </Link>
            )}
          </div>
        </div>

        {/* Maillage interne — Savoir */}
        <div
          style={{
            marginTop: 56,
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={`/savoir/${slug}`}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#6b7388',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              transition: 'color 0.2s',
            }}
          >
            ← Lire l&apos;article Savoir : {hub.thematique}
          </Link>
          {agirGuide?.available && (
            <Link
              href={agirGuide.href}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#6b7388',
                textDecoration: 'none',
                letterSpacing: '0.06em',
              }}
            >
              Guide Agir : {agirGuide.label} →
            </Link>
          )}
        </div>
      </main>

      <footer className="page-footer">
        <div>futur•e · Territoires / {hub.thematique}</div>
        <div>
          <a href="#">Méthodologie</a>
          {' · '}
          <a href="#">Signaler une erreur</a>
        </div>
      </footer>
    </>
  );
}
