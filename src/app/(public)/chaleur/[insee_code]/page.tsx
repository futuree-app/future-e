import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getClimatDataCommune } from '@/lib/drias-json';
import { getGeorisquesSummary } from '@/lib/georisques';
import { getAtmoForCommune } from '@/lib/atmo';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

const ACCENT = '#f87171';

// ── Supabase ──────────────────────────────────────────────────────────────────

function getAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

type CommuneScore = {
  insee_code: string;
  nom_commune: string;
  departement: string | null;
  score: number;
  ind_exposition: number | null;
  ind_vulnerabilite: number | null;
  ind_adaptation: number | null;
  ind_occurrence: number | null;
};

const fetchScore = unstable_cache(
  async (insee_code: string): Promise<CommuneScore | null> => {
    const { data, error } = await getAnon()
      .from('communes_tension')
      .select('insee_code, nom_commune, departement, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence')
      .eq('slug', 'canicule')
      .eq('insee_code', insee_code)
      .maybeSingle();
    if (error) return null;
    return data;
  },
  ['chaleur-commune-score'],
  { revalidate: 86400, tags: ['communes-tension'] },
);

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ insee_code: string }>;
}): Promise<Metadata> {
  const { insee_code } = await params;
  const commune = await fetchScore(insee_code);
  if (!commune) return { title: 'Chaleur et canicule · futur•e' };

  const title = `Chaleur et canicule à ${commune.nom_commune} : projections 2050 et score de tension`;
  const description = `Score de tension canicule : ${commune.score}/100 — jours > 30°C, nuits tropicales et qualité de l'air à ${commune.nom_commune} en 2050 (DRIAS +4°C).`;

  return {
    title: `${title} · futur•e`,
    description,
    openGraph: { title, description },
  };
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.22;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.15) translate(18px,-28px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:960px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;display:flex;align-items:center;gap:0;}
  .crumb a{color:var(--fg-3);text-decoration:none;transition:color 0.2s;}
  .crumb a:hover{color:var(--fg-1);}
  .crumb-sep{margin:0 8px;opacity:0.35;}

  .page{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:64px 28px 120px;}

  .back-link{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);text-decoration:none;margin-bottom:40px;transition:color 0.2s;}
  .back-link:hover{color:var(--fg-3);}

  /* Hero score */
  .score-hero{padding:36px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);position:relative;overflow:hidden;margin-bottom:48px;}
  .score-hero::after{content:"";position:absolute;top:-60px;right:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,${ACCENT}18 0%,transparent 70%);pointer-events:none;}
  .score-num{font-family:var(--font-serif);font-size:clamp(64px,10vw,96px);line-height:1;font-weight:400;letter-spacing:-0.03em;color:${ACCENT};}
  .score-denom{font-size:0.38em;color:var(--fg-4);}
  .score-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-top:6px;}
  .commune-name{font-family:var(--font-serif);font-size:clamp(22px,3vw,32px);font-weight:400;color:var(--fg-1);line-height:1.15;}
  .commune-meta{font-family:var(--font-mono);font-size:12px;color:var(--fg-4);margin-top:4px;}

  /* Data grids */
  .data-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:24px 0;}
  .data-card{padding:22px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);}
  .data-card-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-bottom:10px;}
  .data-card-value{font-family:var(--font-serif);font-size:32px;line-height:1;font-weight:400;color:${ACCENT};}
  .data-card-unit{font-size:0.45em;color:var(--fg-4);}
  .data-card-note{font-size:12px;color:var(--fg-3);margin-top:8px;line-height:1.5;}

  /* Score bars */
  .ind-bar{width:100%;height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin:8px 0;}
  .ind-bar-fill{height:100%;border-radius:2px;background:${ACCENT};}

  /* Pill tags */
  .pill{display:inline-flex;align-items:center;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);font-family:var(--font-mono);font-size:11px;color:var(--fg-3);}

  /* Section headers */
  .section{margin:64px 0 0;}
  .section-eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};margin-bottom:10px;}
  .section-title{font-family:var(--font-serif);font-weight:400;font-size:clamp(22px,2.8vw,32px);line-height:1.15;letter-spacing:-0.015em;margin:0 0 6px;color:var(--fg-1);}
  .section-sub{font-size:14px;color:var(--fg-4);margin:0 0 28px;font-family:var(--font-mono);}

  /* Article cards */
  .articles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:24px;}
  .article-card{padding:22px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-decoration:none;display:flex;flex-direction:column;gap:10px;transition:border-color 0.2s,background 0.2s;}
  .article-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15);}
  .article-cat{font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;padding:3px 8px;border-radius:4px;}
  .article-title{font-size:14px;font-weight:500;color:var(--fg-1);line-height:1.35;}
  .article-cta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};margin-top:auto;}

  /* CTA block */
  .cta-block{margin-top:48px;padding:36px 40px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid ${ACCENT};border-radius:12px;}
  .cta-eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;}
  .cta-title{font-family:var(--font-serif);font-size:22px;line-height:1.4;color:var(--fg-1);margin:0 0 8px;font-weight:400;}
  .cta-sub{font-family:var(--font-mono);font-size:12px;color:var(--fg-4);margin:0 0 24px;line-height:1.7;}
  .cta-btn{display:inline-flex;align-items:center;padding:13px 26px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;}
  .cta-sec{display:inline-flex;align-items:center;gap:6px;padding:13px 22px;border:1px solid ${ACCENT}40;color:${ACCENT};font-family:var(--font-mono);font-size:12px;letter-spacing:0.06em;text-decoration:none;border-radius:6px;}

  /* Divider */
  .divider{height:1px;background:rgba(255,255,255,0.06);margin:0;}

  /* Footer */
  .page-footer{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:28px 28px 56px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:768px){
    .page{padding:40px 20px 80px;}
    .nav-inner{padding:14px 20px;}
    .data-grid{grid-template-columns:1fr;}
    .articles-grid{grid-template-columns:1fr;}
    .cta-block{padding:24px;}
    .score-hero{padding:24px;}
  }
`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ChaleurCommune({
  params,
}: {
  params: Promise<{ insee_code: string }>;
}) {
  const { insee_code } = await params;

  const [commune, driasData, georisques, atmo] = await Promise.all([
    fetchScore(insee_code),
    getClimatDataCommune(insee_code),
    getGeorisquesSummary(insee_code).catch(() => null),
    process.env.ATMO_USERNAME
      ? getAtmoForCommune(insee_code).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!commune) {
    return (
      <div style={{ padding: '40px', color: '#e9ecf2', fontFamily: 'system-ui' }}>
        Commune introuvable.{' '}
        <Link href="/chaleur" style={{ color: ACCENT }}>
          Retour à Chaleur et canicule
        </Link>
      </div>
    );
  }

  const dept = commune.departement ?? insee_code.slice(0, 2);
  const driasV = driasData?.commune?.s?.gwl30?.v;

  const DRIAS_ITEMS: [string, number | undefined, string][] = [
    ['Jours Tmax ≥ 30°C / an',  driasV?.NORTX30D_yr,     'j'],
    ['Jours Tmax ≥ 35°C / an',  driasV?.NORTX35D_yr,     'j'],
    ['Nuits tropicales / an',    driasV?.NORTR_yr,         'n'],
    ['Température moy. été',     driasV?.NORTMm_seas_JJA,  '°C'],
  ];

  const IND_ITEMS = [
    { key: 'ind_exposition'    as const, label: 'Exposition',          desc: "Niveau d'exposition physique du territoire." },
    { key: 'ind_vulnerabilite' as const, label: 'Vulnérabilité',       desc: 'Fragilité socio-économique des habitants.' },
    { key: 'ind_adaptation'    as const, label: "Capacité d'adaptation", desc: 'Ressources locales pour faire face au risque.' },
    { key: 'ind_occurrence'    as const, label: 'Occurrence',           desc: 'Fréquence historique des événements.' },
  ];

  const georisquesHighlights = [
    ...(georisques?.riskLabels ?? []),
    ...(georisques?.seismic?.label ? [georisques.seismic.label] : []),
  ].slice(0, 5);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb" style={{ width: 500, height: 500, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -140, left: -120 }} />
      <div className="orb" style={{ width: 360, height: 360, background: 'radial-gradient(circle,#fb923c 0%,transparent 70%)', bottom: -80, right: -60, animationDelay: '-7s', opacity: 0.14 }} />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span style={{ color: ACCENT, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div className="crumb">
            <Link href="/chaleur">Chaleur et canicule</Link>
            <span className="crumb-sep">/</span>
            {commune.nom_commune}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="page">
        <Link className="back-link" href="/chaleur">← Chaleur et canicule</Link>

        {/* ── BLOC 1 — TERRITOIRE ──────────────────────────────────────── */}

        {/* Score hero */}
        <div className="score-hero">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div className="score-num">
                {commune.score}<span className="score-denom">/100</span>
              </div>
              <div className="score-label">Score de tension canicule</div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
                Chaleur et canicule · DRIAS +4°C
              </div>
              <div className="commune-name">{commune.nom_commune}</div>
              <div className="commune-meta">Dept. {dept} · INSEE {commune.insee_code}</div>
            </div>
          </div>

          {/* 4 indicators inline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginTop: 28 }}>
            {IND_ITEMS.map((ind) => {
              const val = commune[ind.key];
              const pct = val != null ? Math.min(100, Math.round(val)) : null;
              return (
                <div key={ind.key}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 6 }}>
                    {ind.label}
                  </div>
                  {pct != null ? (
                    <>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: ACCENT, lineHeight: 1 }}>
                        {pct}<span style={{ fontSize: '0.5em', color: 'var(--fg-4)' }}>/100</span>
                      </div>
                      <div className="ind-bar"><div className="ind-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div style={{ fontSize: 11, color: 'var(--fg-4)', lineHeight: 1.4 }}>{ind.desc}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>N/D</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DRIAS gwl30 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
            Projections climatiques DRIAS 2050
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
            Scénario +4°C (GWL 3.0) · Météo-France / CNRS
          </div>
        </div>
        <div className="data-grid">
          {DRIAS_ITEMS.filter(([, val]) => val != null).map(([label, val, unit]) => (
            <div key={label} className="data-card">
              <div className="data-card-label">{label}</div>
              <div className="data-card-value">
                {typeof val === 'number' ? val.toFixed(0) : val}
                <span className="data-card-unit"> {unit}</span>
              </div>
              <div className="data-card-note">Valeur médiane des modèles DRIAS · horizon 2050</div>
            </div>
          ))}
          {DRIAS_ITEMS.filter(([, val]) => val != null).length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: 20, color: 'var(--fg-4)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Données DRIAS indisponibles pour cette commune.
            </div>
          )}
        </div>

        {/* Géorisques */}
        {georisques && (
          <>
            <div style={{ margin: '40px 0 10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
                Risques officiels Géorisques
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
                Lecture communale GASPAR · pas une analyse à l'adresse
              </div>
            </div>
            <div className="data-grid">
              <div className="data-card">
                <div className="data-card-label">Risque principal</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: ACCENT, lineHeight: 1.2 }}>
                  {georisquesHighlights[0] ?? 'Aucun risque communal remonté'}
                </div>
              </div>
              <div className="data-card">
                <div className="data-card-label">Sismicité</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: ACCENT, lineHeight: 1.2 }}>
                  {georisques.seismic?.label ?? 'Non renseignée'}
                </div>
                {georisques.seismic?.code && (
                  <div className="data-card-note">Zone {georisques.seismic.code}</div>
                )}
              </div>
            </div>
            {georisquesHighlights.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {georisquesHighlights.map((label) => (
                  <span key={label} className="pill">{label}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* ATMO */}
        {atmo && (
          <>
            <div style={{ margin: '40px 0 10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
                Qualité de l'air · ATMO France
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
                Indice ATMO du {atmo.date} · La chaleur amplifie l'ozone estival
              </div>
            </div>
            <div className="data-grid">
              <div className="data-card">
                <div className="data-card-label">Indice ATMO</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: atmo.index.color, lineHeight: 1.2 }}>
                  {atmo.index.label}
                </div>
                <div className="data-card-note">Niveau {atmo.index.value}/6</div>
              </div>
              <div className="data-card">
                <div className="data-card-label">Polluants</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {([['NO₂', atmo.pollutants.no2], ['O₃', atmo.pollutants.o3], ['PM10', atmo.pollutants.pm10], ['PM2.5', atmo.pollutants.pm25]] as [string, { label: string; color: string } | null][])
                    .filter(([, v]) => v != null)
                    .map(([name, lvl]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>{name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: lvl!.color }}>{lvl!.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* CTA conversion */}
        <div className="cta-block">
          <div className="cta-eyebrow">Rapport personnalisé</div>
          <p className="cta-title">
            Approfondissez ce diagnostic{' '}
            <em style={{ fontStyle: 'italic', color: ACCENT }}>pour {commune.nom_commune}</em>
          </p>
          <p className="cta-sub">
            Logement · Mobilité · Santé · Économie locale — croisés pour votre profil spécifique.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/inscription" className="cta-btn">Commencer — 14 jours gratuits</Link>
            <Link href="/comparateur" className="cta-sec">Comparer avec une autre commune →</Link>
          </div>
        </div>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 2 — COMPRENDRE ──────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Comprendre</div>
          <h2 className="section-title">Aller plus loin sur la chaleur</h2>
          <p className="section-sub">Trois lectures de fond pour contextualiser ces données.</p>
          <div className="articles-grid">
            <Link href="/savoir/chaleur-sante-mentale" className="article-card">
              <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Santé mentale</span>
              <div className="article-title">Chaleur et santé mentale</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                Sommeil, humeur, hospitalisations psychiatriques : ce que la science dit vraiment.
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
            <Link href="/savoir/canicule" className="article-card">
              <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Projections</span>
              <div className="article-title">Canicule en 2050 : les projections</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                Les données DRIAS commune par commune. Quels territoires basculeront ?
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
            <Link href="/savoir/pollutions-invisibles" className="article-card">
              <span className="article-cat" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>Air & sols</span>
              <div className="article-title">Pollutions invisibles</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                La chaleur amplifie l'ozone. Comment lire les données et agir à la bonne échelle.
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 64 }} />

        {/* ── BLOC 3 — AGIR ────────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Agir</div>
          <h2 className="section-title">Ce que vous pouvez faire</h2>
          <p className="section-sub">Deux guides ciblés selon votre situation.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginTop: 24 }}>
            <Link href="/agir/canicule" style={{ padding: '24px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>Guide pratique</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.35 }}>Se préparer à la canicule</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>Ventilation, hydratation, personnes vulnérables : les gestes qui font une vraie différence.</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, marginTop: 'auto' }}>Voir le guide →</div>
            </Link>
            <Link href="/comparateur" style={{ padding: '24px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>Outil de comparaison</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.35 }}>Comparer avec une autre commune</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>Chaleur, air, eau, revenus, accès aux soins : les deux territoires côte à côte en moins de 10 secondes.</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, marginTop: 'auto' }}>Ouvrir le comparateur →</div>
            </Link>
          </div>
        </section>

        <div className="divider" style={{ marginTop: 64 }} />

        {/* ── BLOC 4 — SIGNAL ──────────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Signal en cours</div>
          <h2 className="section-title">Contexte national · Mai 2026</h2>
          <p className="section-sub">Les signaux de veille qui donnent du sens à ces chiffres.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginTop: 24 }}>
            {[
              {
                date: 'DRIAS · Scénario +4°C',
                head: '57 communes dépasseront 60 j/an > 30°C',
                body: 'La rupture est nette dans le sud-est et la vallée du Rhône. Nice, Marseille, Montpellier : les projections gwl30 sont maintenant convergentes entre modèles.',
                src: 'DRIAS / Météo-France',
              },
              {
                date: 'Copernicus · 2025',
                head: '2025 : deuxième été le plus chaud jamais enregistré',
                body: '+1,3°C au-dessus de la moyenne pré-industrielle. La trajectoire est cohérente avec les scénarios gwl20 à gwl30 utilisés par futur•e.',
                src: 'Copernicus Climate Change Service',
              },
            ].map((signal) => (
              <div key={signal.head} style={{ padding: 22, borderRadius: 10, background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.14)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, opacity: 0.75 }}>{signal.date}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.4 }}>{signal.head}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>{signal.body}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)' }}>Source : {signal.src}</div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="page-footer">
        <div>futur•e · Chaleur et canicule · {commune.nom_commune}</div>
        <div>
          <Link href="/chaleur">← Toutes les communes</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
