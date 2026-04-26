import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

// ─── Hub registry ────────────────────────────────────────────────────────────
// Ajouter un slug ici génère automatiquement la page hub + ses pages communes.
const SAVOIR_HUBS: Record<
  string,
  {
    thematique: string;
    categorie: string;
    accent: string;
    description: string;
    intro: string;
  }
> = {
  canicule: {
    thematique: 'Canicule',
    categorie: 'Climat',
    accent: '#f87171',
    description:
      'Quelles communes françaises sont les plus exposées aux vagues de chaleur extrême selon les projections DRIAS ?',
    intro:
      "Les épisodes caniculaires s'intensifient avec le changement climatique. Cette page identifie les 50 communes les plus vulnérables aux vagues de chaleur et vous propose d'explorer leur profil de risque détaillé.",
  },
  submersion: {
    thematique: 'Submersion',
    categorie: 'Climat',
    accent: '#60a5fa',
    description:
      "Quelles communes françaises sont les plus exposées au risque de submersion marine et d’inondation selon les données Géorisques ?",
    intro:
      'La montée des eaux et les submersions marines menacent de nombreux territoires littoraux et riverains. Découvrez quelles communes présentent les scores de tension les plus élevés.',
  },
  feux: {
    thematique: 'Feux de forêt',
    categorie: 'Climat',
    accent: '#fb923c',
    description:
      'Quelles communes sont les plus exposées au risque de feux de forêt selon les données IFN et Météo-France ?',
    intro:
      "L'extension des zones à risque incendie est l'une des conséquences les plus documentées du changement climatique en France. Ces communes sont en première ligne.",
  },
  cadmium: {
    thematique: 'Cadmium',
    categorie: 'Santé',
    accent: '#a78bfa',
    description:
      'Quelles communes sont situées dans des zones à forte teneur en cadmium dans les sols agricoles selon les données GisSol ?',
    intro:
      "La présence de cadmium dans les sols varie fortement selon la géologie et les pratiques agricoles. Ces communes présentent les scores d'exposition les plus élevés.",
  },
  'dependance-auto': {
    thematique: 'Dépendance automobile',
    categorie: 'Mobilité',
    accent: '#fb923c',
    description:
      'Quelles communes françaises sont les plus dépendantes à la voiture, exposant leurs habitants aux chocs sur le prix des carburants ?',
    intro:
      "La dépendance structurelle à l'automobile représente une fragilité budgétaire réelle pour des millions de foyers. Ces communes cumulent les facteurs de vulnérabilité.",
  },
  pollens: {
    thematique: 'Pollens',
    categorie: 'Santé',
    accent: '#4ade80',
    description:
      'Quelles communes sont les plus exposées aux pics polliniques selon les données du RNSA ?',
    intro:
      "L'allongement des saisons polliniques et l'intensification des concentrations de pollens concernent de plus en plus de territoires. Découvrez les communes les plus exposées.",
  },
};

// ─── Static params (ISR) ─────────────────────────────────────────────────────
export async function generateStaticParams() {
  return Object.keys(SAVOIR_HUBS).map((slug) => ({ slug }));
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = SAVOIR_HUBS[slug];
  if (!hub) return { title: 'Savoir · futur•e' };

  return {
    title: `Risque ${hub.thematique} par commune · futur•e`,
    description: hub.description,
  };
}

// ─── Cached commune count (for the paywall teaser) ────────────────────────────
const fetchCommuneCount = unstable_cache(
  async (slug: string): Promise<number> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const { count } = await supabase
      .from('communes_tension')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug);
    return count ?? 0;
  },
  ['commune-count'],
  { revalidate: 86400 },
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #060812;
    --bg-elev: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.08);
    --border-strong: rgba(255,255,255,0.14);
    --text: #e9ecf2;
    --text-muted: #9ba3b4;
    --text-dim: #6b7388;
    --serif: 'Instrument Serif','Times New Roman',serif;
    --sans: 'Instrument Sans',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.3;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(18px,-28px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:rgba(6,8,18,0.65);border-bottom:1px solid var(--border);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--text);text-decoration:none;}
  .brand-dot{color:var(--accent,#f87171);font-style:normal;}
  .nav-crumb{font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--text-muted);text-decoration:none;}
  .nav-crumb .sep{margin:0 10px;color:var(--text-dim);}
  .page{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:64px 28px 120px;}
  h1{font-family:var(--serif);font-weight:400;font-size:clamp(36px,5vw,58px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 24px;color:var(--text);}
  h1 em{font-style:italic;}
  .lede{font-family:var(--serif);font-size:clamp(18px,2vw,22px);line-height:1.55;color:var(--text-muted);margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border);}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:var(--accent-soft,rgba(248,113,113,0.12));border:1px solid var(--accent-border,rgba(248,113,113,0.28));font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent,#f87171);margin-bottom:24px;}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent,#f87171);box-shadow:0 0 10px var(--accent,#f87171);}
  h2{font-family:var(--serif);font-weight:400;font-size:clamp(24px,2.5vw,32px);line-height:1.2;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--text);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:16px;width:14px;height:1px;background:var(--accent,#f87171);}
  p{margin:0 0 20px;color:var(--text);font-size:16px;line-height:1.72;}
  .bg-glass-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);}
  .border-strong{border:1px solid rgba(255,255,255,0.14);}
  .page-footer{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--text-muted);text-decoration:none;}
  @media(max-width:768px){.page{padding:40px 20px 80px;}h1{font-size:34px;}h2{font-size:24px;}h2::before{display:none;}.lede{font-size:17px;}.nav-inner{padding:14px 20px;}}
`;

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function SavoirHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = SAVOIR_HUBS[slug];

  if (!hub) {
    return (
      <div style={{ padding: '40px', color: '#e9ecf2', fontFamily: 'system-ui' }}>
        Hub non trouvé pour le risque &quot;{slug}&quot;.
      </div>
    );
  }

  const accentRgb = hub.accent;

  // HTML for PaywallGate preview (always visible)
  const previewHtml = `
    <div class="tag" style="--accent:${accentRgb};--accent-soft:${accentRgb}1a;--accent-border:${accentRgb}40;">${hub.categorie}</div>
    <h1>Risque <em style="color:${accentRgb}">${hub.thematique}</em><br/>par commune en France</h1>
    <p class="lede">${hub.intro}</p>

    <h2 style="--accent:${accentRgb}">Comprendre le score de tension</h2>
    <p>
      Chaque commune est évaluée sur quatre indicateurs agrégés en un score de tension global
      de 0 à 100 : <strong>exposition physique</strong> au risque, <strong>vulnérabilité
      socio-économique</strong> des habitants, <strong>capacité d'adaptation</strong> locale,
      et <strong>fréquence historique</strong> d'occurrence. Les données sont issues des sources
      officielles (DRIAS, Géorisques, INSEE, GisSol) et mises à jour quotidiennement.
    </p>
  `;

  // HTML for PaywallGate full content (gated)
  const fullHtml = `
    <h2 style="--accent:${accentRgb}">Méthodologie et limites</h2>
    <p>
      Le score de tension est un indicateur synthétique et ne constitue pas une évaluation
      officielle du risque. Il est construit à des fins d'aide à la décision et doit être
      interprété en regard des données sources. Certaines communes présentent des données
      partielles en raison de leur taille ou de l'absence de données locales suffisantes.
    </p>
    <p>
      Les projections climatiques utilisées pour le score d'exposition sont issues du
      scénario RCP8.5 (trajectoire haute) afin de présenter une estimation prudente des
      risques futurs. Les indicateurs socio-économiques sont calculés à partir des données
      INSEE du recensement 2021.
    </p>
    <h2 style="--accent:${accentRgb}">Utiliser ces données pour votre territoire</h2>
    <p>
      En tant qu'abonné Suivi, vous pouvez générer un rapport personnalisé pour votre
      commune ou votre quartier. Ce rapport intègre les données détaillées de chaque
      indicateur, les projections à 2030 et 2050, et des recommandations adaptées à
      votre situation.
    </p>
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Orbs */}
      <div
        className="orb"
        style={{
          width: '480px',
          height: '480px',
          background: `radial-gradient(circle,${hub.accent} 0%,transparent 70%)`,
          top: '-120px',
          left: '-100px',
        }}
      />
      <div
        className="orb"
        style={{
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle,#a78bfa 0%,transparent 70%)',
          bottom: '-100px',
          right: '-80px',
          animationDelay: '-5s',
        }}
      />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span className="brand-dot" style={{ color: hub.accent }}>•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/savoir">Savoir</Link>
            <span className="sep">/</span>
            <span>{hub.categorie}</span>
            <span className="sep">/</span>
            {hub.thematique}
          </div>
        </div>
      </nav>

      {/* Main — 100% gratuit, pas de paywall */}
      <main className="page">
        {/* Contenu éditorial complet, librement accessible */}
        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <div dangerouslySetInnerHTML={{ __html: fullHtml }} />

        {/* CTA vers la section Territoires pour explorer les communes */}
        <div
          style={{
            marginTop: '56px',
            padding: '32px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${hub.accent}30`,
            borderLeft: `3px solid ${hub.accent}`,
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: hub.accent,
              marginBottom: '12px',
            }}
          >
            Explorer les données par commune
          </div>
          <p
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '20px',
              lineHeight: 1.4,
              color: '#e9ecf2',
              margin: '0 0 20px',
              fontWeight: 400,
            }}
          >
            Quelle est l&apos;exposition de <em style={{ fontStyle: 'italic', color: hub.accent }}>votre commune</em>{' '}
            au risque {hub.thematique.toLowerCase()} ?
          </p>
          <Link
            href={`/territoires/${slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 24px',
              background: hub.accent,
              color: '#060812',
              fontFamily: "'Instrument Sans', system-ui, sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            Rechercher ma commune →
          </Link>
        </div>
      </main>

      <footer className="page-footer">
        <div>futur•e · Savoir / {hub.categorie}</div>
        <div>
          <a href="#">Méthodologie</a> · <a href="#">Signaler une erreur</a>
        </div>
      </footer>
    </>
  );
}
