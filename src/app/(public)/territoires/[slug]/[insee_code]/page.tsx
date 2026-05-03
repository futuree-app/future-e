import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { getClimatDataCommune } from '@/lib/drias-json';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { AGIR_GUIDES } from '@/config/navigation';

// ISR — contenu 100% public, pas d'auth
export const revalidate = 86400;

// ─── Hub registry ─────────────────────────────────────────────────────────────
const HUBS: Record<string, { thematique: string; categorie: string; accent: string }> = {
  canicule:         { thematique: 'Canicule',             categorie: 'Climat',   accent: '#f87171' },
  submersion:       { thematique: 'Submersion',           categorie: 'Climat',   accent: '#60a5fa' },
  feux:             { thematique: 'Feux de forêt',        categorie: 'Climat',   accent: '#fb923c' },
  cadmium:          { thematique: 'Cadmium',              categorie: 'Santé',    accent: '#a78bfa' },
  'dependance-auto':{ thematique: 'Dépendance automobile',categorie: 'Mobilité', accent: '#fb923c' },
  secheresse:       { thematique: 'Sécheresse',           categorie: 'Climat',   accent: '#fbbf24' },
  pollens:          { thematique: 'Pollens',              categorie: 'Santé',    accent: '#4ade80' },
};

// ─── Supabase (anon client — safe inside unstable_cache) ─────────────────────
function getAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

type CommuneDetail = {
  insee_code: string;
  nom_commune: string;
  departement: string | null;
  score: number;
  ind_exposition: number | null;
  ind_vulnerabilite: number | null;
  ind_adaptation: number | null;
  ind_occurrence: number | null;
};

// DB query cached independently of auth
const fetchCommune = unstable_cache(
  async (slug: string, insee_code: string): Promise<CommuneDetail | null> => {
    const { data, error } = await getAnon()
      .from('communes_tension')
      .select(
        'insee_code, nom_commune, departement, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence',
      )
      .eq('slug', slug)
      .eq('insee_code', insee_code)
      .maybeSingle();

    if (error) {
      console.error('[TerritoireCommune] Supabase error:', error.message);
      return null;
    }
    return data;
  },
  ['territoire-commune-detail'],
  { revalidate: 86400, tags: ['communes-tension'] },
);

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; insee_code: string }>;
}): Promise<Metadata> {
  const { slug, insee_code } = await params;
  const hub = HUBS[slug];
  const commune = await fetchCommune(slug, insee_code);

  if (!hub || !commune) return { title: 'Commune · futur•e' };

  const dept = commune.departement ?? insee_code.slice(0, 2);
  const title = `Risque ${hub.thematique} à ${commune.nom_commune} (Dept. ${dept}) : Analyse et Prévention`;
  const description = `Score de tension ${hub.thematique.toLowerCase()} : ${commune.score}/100 pour ${commune.nom_commune}. Exposition, vulnérabilité, adaptation et occurrence.`;

  return {
    title: `${title} · futur•e`,
    description,
    openGraph: { title, description },
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
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.28;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.15) translate(18px,-28px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--text);text-decoration:none;}
  .nav-crumb{font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--text-muted);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--text);}
  .nav-crumb .sep{margin:0 10px;opacity:0.4;}
  .page{position:relative;z-index:2;max-width:800px;margin:0 auto;padding:64px 28px 120px;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px;}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  h1{font-family:var(--serif);font-weight:400;font-size:clamp(26px,4vw,46px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 32px;color:var(--text);}
  h2{font-family:var(--serif);font-weight:400;font-size:clamp(20px,2.5vw,28px);line-height:1.2;letter-spacing:-0.01em;margin:48px 0 18px;color:var(--text);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:14px;width:14px;height:1px;}
  h3{font-family:var(--sans);font-weight:500;font-size:14px;color:var(--text-muted);letter-spacing:0.06em;text-transform:uppercase;margin:0 0 12px;}
  p{margin:0 0 18px;color:var(--text);font-size:16px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}
  .score-hero{margin:0 0 48px;padding:36px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.12);position:relative;overflow:hidden;}
  .score-hero::after{content:"";position:absolute;top:-40px;right:-40px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,var(--hero-glow,rgba(248,113,113,0.15)) 0%,transparent 70%);pointer-events:none;}
  .score-number{font-family:var(--serif);font-size:clamp(60px,10vw,92px);line-height:1;font-weight:400;letter-spacing:-0.03em;position:relative;z-index:1;}
  .score-label{font-family:var(--mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-top:8px;}
  .indicators-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:32px 0;}
  .indicator-card{padding:24px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10);}
  .indicator-label{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px;}
  .indicator-value{font-family:var(--serif);font-size:34px;line-height:1;margin-bottom:6px;}
  .indicator-bar{width:100%;height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin-bottom:8px;}
  .indicator-desc{font-size:12px;color:var(--text-muted);line-height:1.5;}
  .back-link{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;color:var(--text-dim);margin-bottom:36px;transition:color 0.2s;}
  .back-link:hover{color:var(--text-muted);}
  .cross-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
  .cross-link{display:inline-flex;align-items:center;padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:100px;color:#9ba3b4;text-decoration:none;font-size:13px;transition:border-color 0.2s,color 0.2s;}
  .cross-link:hover{border-color:rgba(255,255,255,0.2);color:var(--text);}
  .page-footer{position:relative;z-index:2;max-width:800px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;border-top:1px solid var(--border);}
  .page-footer a{color:var(--text-muted);text-decoration:none;}
  @media(max-width:768px){.page{padding:40px 20px 80px;}h1{font-size:24px;}h2{font-size:20px;}h2::before{display:none;}.indicators-grid{grid-template-columns:1fr;}.score-hero{padding:24px;}.nav-inner{padding:14px 20px;}}
`;

// ─── Indicator card ───────────────────────────────────────────────────────────
function IndicatorCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: number | null;
  description: string;
  accent: string;
}) {
  const pct = value != null ? Math.min(100, Math.round(value)) : null;

  return (
    <div className="indicator-card">
      <div className="indicator-label">{label}</div>
      {pct != null ? (
        <>
          <div className="indicator-value" style={{ color: accent }}>
            {pct}
            <span style={{ fontSize: '0.45em', color: '#6b7388' }}>/100</span>
          </div>
          <div className="indicator-bar">
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: accent,
                borderRadius: '3px',
              }}
            />
          </div>
          <div className="indicator-desc">{description}</div>
        </>
      ) : (
        <div style={{ color: '#4a5468', fontSize: '14px' }}>Données indisponibles</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TerritoireCommunePage({
  params,
}: {
  params: Promise<{ slug: string; insee_code: string }>;
}) {
  const { slug, insee_code } = await params;
  const hub = HUBS[slug];
  const commune = await fetchCommune(slug, insee_code);

  if (!hub || !commune) {
    return (
      <div style={{ padding: '40px', color: '#e9ecf2', fontFamily: 'system-ui' }}>
        Commune introuvable.{' '}
        <Link href={`/territoires/${slug}`} style={{ color: '#60a5fa' }}>
          Retour au territoire
        </Link>
      </div>
    );
  }

  // Données DRIAS — libres, chargées pour tout le monde
  const driasData = await getClimatDataCommune(commune.insee_code);
  const agirGuide = AGIR_GUIDES[slug];

  const dept = commune.departement ?? insee_code.slice(0, 2);
  const h1 = `Risque ${hub.thematique} à ${commune.nom_commune} (Dept. ${dept}) : Analyse et Prévention`;

  const INDICATORS = [
    {
      key: 'ind_exposition' as const,
      label: 'Exposition',
      description: "Niveau d'exposition physique du territoire au risque (géographie + climat).",
    },
    {
      key: 'ind_vulnerabilite' as const,
      label: 'Vulnérabilité',
      description: 'Fragilité socio-économique des habitants face aux impacts du risque.',
    },
    {
      key: 'ind_adaptation' as const,
      label: "Capacité d'adaptation",
      description: 'Ressources locales disponibles pour faire face au risque.',
    },
    {
      key: 'ind_occurrence' as const,
      label: 'Occurrence',
      description: 'Fréquence et intensité des événements sur les 30 dernières années.',
    },
  ];

  const driasGwl20 = driasData?.commune?.s?.gwl20;
  const driasValues = driasGwl20?.v;

  const driasGrid = driasValues ? `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0;">
      ${([
        ['Jours Tmax ≥ 30 °C / an', driasValues.NORTX30D_yr, 'j'],
        ['Jours Tmax ≥ 35 °C / an', driasValues.NORTX35D_yr, 'j'],
        ['Nuits tropicales / an',    driasValues.NORTR_yr,    'n'],
        ['T° moy. été (JJA)',        driasValues.NORTMm_seas_JJA, '°C'],
      ] as [string, number | undefined, string][])
        .filter(([, val]) => val != null)
        .map(([label, val, unit]) => `
        <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
          <div style="font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">${label}</div>
          <div style="font-family:var(--serif);font-size:30px;line-height:1;color:${hub.accent};font-weight:400;">
            ${typeof val === 'number' ? val.toFixed(1) : val}
            <span style="font-size:0.45em;color:#6b7388;">${unit}</span>
          </div>
        </div>
      `).join('')}
    </div>
  ` : `<p style="color:#6b7388;font-style:italic;">Données DRIAS indisponibles pour cette commune.</p>`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div
        className="orb"
        style={{
          width: '420px',
          height: '420px',
          background: `radial-gradient(circle,${hub.accent} 0%,transparent 70%)`,
          top: '-100px',
          left: '-80px',
        }}
      />
      <div
        className="orb"
        style={{
          width: '360px',
          height: '360px',
          background: 'radial-gradient(circle,#a78bfa 0%,transparent 70%)',
          bottom: '-90px',
          right: '-60px',
          animationDelay: '-7s',
        }}
      />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span style={{ color: hub.accent, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href={`/territoires/${slug}`}>{hub.thematique}</Link>
            <span className="sep">/</span>
            {commune.nom_commune}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="page">
        <Link className="back-link" href={`/territoires/${slug}`}>
          ← Retour aux territoires {hub.thematique.toLowerCase()}
        </Link>

        {/* Score hero */}
        <div
          className="score-hero"
          style={{ ['--hero-glow' as string]: `${hub.accent}26` }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="score-number" style={{ color: hub.accent }}>
                {commune.score}
              </div>
              <div className="score-label">Score de tension / 100</div>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: hub.accent,
                  marginBottom: 6,
                }}
              >
                Risque {hub.thematique}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontFamily: "'Instrument Serif', serif",
                  color: '#e9ecf2',
                  lineHeight: 1.2,
                }}
              >
                {commune.nom_commune}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#6b7388',
                  marginTop: 4,
                }}
              >
                Dept. {dept} · INSEE {commune.insee_code}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 12,
              color: '#6b7388',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.04em',
            }}
          >
            Score calculé sur 4 indicateurs · Données officielles · Mis à jour quotidiennement
          </div>
        </div>

        {/* 4 indicateurs — libres */}
        <h2 style={{ ['--accent' as string]: hub.accent }}>
          Les 4 indicateurs de tension
        </h2>
        <div className="indicators-grid">
          {INDICATORS.map((ind) => (
            <IndicatorCard
              key={ind.key}
              label={ind.label}
              value={commune[ind.key]}
              description={ind.description}
              accent={hub.accent}
            />
          ))}
        </div>

        {/* Projections DRIAS — libres */}
        <h2 style={{ ['--accent' as string]: hub.accent }}>Projections climatiques DRIAS 2050</h2>
        <p style={{ color: '#9ba3b4', fontSize: 14, marginBottom: 0 }}>
          Données DRIAS (CNRS / Météo-France) · Scénario GWL 2.0 (+2 °C) · Horizon 2050
        </p>
        <div dangerouslySetInnerHTML={{ __html: driasGrid }} />

        <h2 style={{ ['--accent' as string]: hub.accent }}>Analyse territoriale</h2>
        <p>
          {commune.nom_commune} enregistre un score de tension de{' '}
          <strong style={{ color: hub.accent }}>{commune.score}/100</strong> pour le risque{' '}
          {hub.thematique.toLowerCase()}. Ce score agrège l&apos;exposition physique,
          la vulnérabilité socio-économique, la capacité d&apos;adaptation locale
          et la fréquence historique des événements.
        </p>

        {/* CTA conversion — glassmorphism */}
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
            Rapport personnalisé
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
            Personnalisez ce diagnostic{' '}
            <em style={{ fontStyle: 'italic', color: hub.accent }}>pour {commune.nom_commune}</em>
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
            Comparaison avec les communes voisines · Recommandations selon votre profil · Suivi dans le temps
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

        {/* Maillage interne SEO */}
        <nav
          style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Autres risques pour cette commune"
        >
          <h3>Explorer d&apos;autres risques pour {commune.nom_commune}</h3>
          <div className="cross-links">
            {Object.entries(HUBS)
              .filter(([s]) => s !== slug)
              .map(([s, h]) => (
                <Link
                  key={s}
                  href={`/territoires/${s}/${commune.insee_code}`}
                  className="cross-link"
                >
                  {h.thematique}
                </Link>
              ))}
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link
              href={`/territoires/${slug}`}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: hub.accent,
                textDecoration: 'none',
                letterSpacing: '0.06em',
              }}
            >
              ← Classement {hub.thematique} par commune
            </Link>
            <Link
              href={`/savoir/${slug}`}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#6b7388',
                textDecoration: 'none',
                letterSpacing: '0.06em',
              }}
            >
              Article Savoir : {hub.thematique} →
            </Link>
          </div>
        </nav>
      </main>

      <footer className="page-footer">
        <div>futur•e · {hub.thematique} · {commune.nom_commune}</div>
        <div>
          <a href="#">Méthodologie</a>
          {' · '}
          <a href="#">Signaler une erreur</a>
        </div>
      </footer>
    </>
  );
}
