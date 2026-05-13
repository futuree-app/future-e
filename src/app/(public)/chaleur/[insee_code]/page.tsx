import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getClimatDataCommune } from '@/lib/drias-json';
import { getGeorisquesSummary } from '@/lib/georisques';
import { getAtmoForCommune } from '@/lib/atmo';
import { getEra5Trend } from '@/lib/era5-trend';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

// Top 1 000 communes les plus peuplées — liste figée dans src/data/top1000-communes.json
// Régénérer avec : scripts/update-top-communes.sh
// Le reste des communes est généré à la demande via ISR (revalidate 24h)
import top1000 from '@/data/top1000-communes.json';

export function generateStaticParams() {
  return (top1000 as string[]).map((code) => ({ insee_code: code }));
}

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
  const [score, drias] = await Promise.all([fetchScore(insee_code), getClimatDataCommune(insee_code).catch(() => null)]);
  const nomCommune = score?.nom_commune ?? drias?.commune?.n ?? insee_code;
  const title = `Chaleur et canicule à ${nomCommune} : projections 2050`;
  const description = score
    ? `Score de tension canicule : ${score.score}/100 — jours > 30°C, nuits tropicales et qualité de l'air à ${nomCommune} en 2050.`
    : `Jours > 30°C, nuits tropicales et qualité de l'air à ${nomCommune} en 2050.`;

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
  .article-img{width:100%;height:140px;object-fit:cover;border-radius:6px;margin-bottom:2px;}
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

  const [commune, driasData, georisques, atmo, era5] = await Promise.all([
    fetchScore(insee_code),
    getClimatDataCommune(insee_code).catch(() => null),
    getGeorisquesSummary(insee_code).catch(() => null),
    process.env.ATMO_USERNAME
      ? getAtmoForCommune(insee_code).catch(() => null)
      : Promise.resolve(null),
    getEra5Trend(insee_code).catch(() => null),
  ]);

  const communeName = commune?.nom_commune ?? driasData?.commune?.n ?? insee_code;
  const dept = commune?.departement ?? insee_code.slice(0, 2);
  const driasV = driasData?.commune?.s?.gwl30?.v;

  // Fallback score computed from DRIAS when not in communes_tension
  function computeScoreFromDrias(): number | null {
    if (!driasV) return null;
    const parts: { w: number; v: number }[] = [];
    if (driasV.NORTX30D_yr != null) parts.push({ w: 0.45, v: Math.min(100, (driasV.NORTX30D_yr / 70) * 100) });
    if (driasV.NORTR_yr != null) parts.push({ w: 0.35, v: Math.min(100, (driasV.NORTR_yr / 120) * 100) });
    if (driasV.NORTMm_seas_JJA != null) parts.push({ w: 0.20, v: Math.min(100, Math.max(0, (driasV.NORTMm_seas_JJA - 18) / 12 * 100)) });
    if (parts.length === 0) return null;
    const totalW = parts.reduce((s, p) => s + p.w, 0);
    return Math.round(parts.reduce((s, p) => s + (p.v * p.w) / totalW, 0));
  }

  const displayScore = commune?.score ?? computeScoreFromDrias();
  const scoreIsEstimated = !commune && displayScore != null;

  const DRIAS_ITEMS: { label: string; val: number | undefined; unit: string; note: string }[] = [
    {
      label: 'Jours de forte chaleur par an',
      val: driasV?.NORTX30D_yr,
      unit: 'j',
      note: "Jours où il fera plus de 30°C. Au-delà de 30 jours par an, rester dehors en plein soleil devient dangereux pour les personnes fragiles.",
    },
    {
      label: 'Jours de canicule intense par an',
      val: driasV?.NORTX35D_yr,
      unit: 'j',
      note: "Jours à plus de 35°C — seuil où les mécanismes de refroidissement du corps sont débordés, même chez les adultes en bonne santé.",
    },
    {
      label: 'Nuits chaudes par an',
      val: driasV?.NORTR_yr,
      unit: 'n',
      note: "Nuits où la température ne descend pas sous 20°C. Sans fraîcheur nocturne, le corps ne récupère pas et les risques d'accident cardiaque augmentent.",
    },
    {
      label: "Température moyenne de l'été",
      val: driasV?.NORTMm_seas_JJA,
      unit: '°C',
      note: "Moyenne sur juin–juillet–août. Au-dessus de 25°C, dormir fenêtre ouverte ne suffit plus. C'est la référence pour calibrer les besoins en climatisation.",
    },
  ];

  const IND_ITEMS = [
    { key: 'ind_exposition'    as const, label: 'Exposition',          desc: "Niveau d'exposition physique du territoire." },
    { key: 'ind_vulnerabilite' as const, label: 'Vulnérabilité',       desc: 'Fragilité socio-économique des habitants.' },
    { key: 'ind_adaptation'    as const, label: "Capacité d'adaptation", desc: 'Ressources locales pour faire face au risque.' },
    { key: 'ind_occurrence'    as const, label: 'Occurrence',           desc: 'Fréquence historique des événements.' },
  ];

  const IND_LEGEND = [
    { icon: 'E', label: 'Exposition', text: "Le territoire chauffe fortement et expose directement les habitants." },
    { icon: 'V', label: 'Vulnérabilité', text: 'Certaines personnes ou certains logements y sont plus fragiles face à la chaleur.' },
    { icon: 'A', label: 'Adaptation', text: 'La commune dispose de plus ou moins de moyens pour aider les habitants à faire face.' },
    { icon: 'O', label: 'Occurrence', text: 'Les épisodes de chaleur intense y sont déjà fréquents, ou appelés à le devenir très vite.' },
  ];

  // Seuls les risques directement aggravés par la chaleur extrême
  const HEAT_RISK_LABELS = new Set([
    'Tassements différentiels',
    'Retrait-gonflement des argiles',
    'Feux de forêt',
    'Sécheresse',
    'Canicule',
  ]);

  const HEAT_RISK_DESCRIPTIONS: Record<string, string> = {
    'Tassements différentiels': "Le sol argileux de cette commune gonfle avec l'humidité et se rétracte en période de sécheresse. Ce mouvement répété fissure les murs et les fondations des maisons. La sécheresse record de 2022 a déjà causé plus de 12 milliards € de sinistres en France — et les étés de 2050 seront bien plus secs.",
    'Retrait-gonflement des argiles': "Même mécanisme : le sol bouge selon les saisons. Les maisons individuelles aux fondations superficielles sont les plus exposées. Avec des étés significativement plus secs prévus pour 2050 sur cette région, ce phénomène deviendra chronique.",
    'Feux de forêt': "La commune est officiellement classée à risque incendie. Avec des vagues de chaleur plus fréquentes, plus longues et plus intenses, la saison des feux s'allonge déjà d'année en année. Les projections prévoient une extension géographique importante de ce risque vers le nord d'ici 2050.",
    'Sécheresse': "Le territoire est officiellement exposé au risque sécheresse. Ce risque est directement amplifié par le réchauffement : les projections DRIAS prévoient des étés significativement plus secs pour les prochaines décennies.",
    'Canicule': "La commune est officiellement reconnue comme exposée au risque canicule par l'État, ce qui génère des obligations de prévention pour les établissements accueillant des personnes vulnérables.",
  };

  const heatRisks = (georisques?.riskLabels ?? []).filter((l) => HEAT_RISK_LABELS.has(l));

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
            {communeName}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="page">
        <Link className="back-link" href="/chaleur">← Chaleur et canicule</Link>

        {/* ── INTRO CONTEXTUELLE ───────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
            Chaleur et canicule · Projections 2050
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 400, color: 'var(--fg-1)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 18px' }}>
            À {communeName}, à quoi ressemblera un été en 2050 ?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-3)', lineHeight: 1.75, maxWidth: 640, margin: '0 0 12px' }}>
            Cette page rassemble les projections climatiques officelles pour {communeName} — nombre de jours de canicule, nuits sans fraîcheur, risques associés — dans un scénario de réchauffement à +4°C d&apos;ici 2050. Les données viennent de Météo-France, du CNRS, et des bases de risques officielles de l&apos;État.
          </p>
          <p style={{ fontSize: 14, color: 'var(--fg-4)', lineHeight: 1.65, maxWidth: 640, margin: 0, fontFamily: 'var(--font-mono)' }}>
            Que vous habitiez ici, envisagiez d&apos;y déménager ou prépariez votre avenir, ces chiffres vous concernent directement.
          </p>
        </div>

        {/* ── ANCRAGE LOCAL ERA5 — climat déjà observé ──────────────── */}
        {era5 && (
          <div
            style={{
              marginBottom: 48,
              padding: '28px 32px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${ACCENT}10 0%, ${ACCENT}03 100%)`,
              border: `1px solid ${ACCENT}38`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <span style={{ fontSize: 22, lineHeight: 1, marginTop: 4 }} aria-hidden>🌍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT, marginBottom: 10 }}>
                  Ancrage local · Climat déjà observé
                </div>
                <p style={{ fontSize: 17, color: 'var(--fg-1)', lineHeight: 1.45, fontWeight: 500, margin: '0 0 10px', maxWidth: 640 }}>
                  À {communeName}, le changement climatique est déjà mesurable aujourd&apos;hui.
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: ACCENT, fontWeight: 400, lineHeight: 1.1, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                  {era5.delta_c >= 0 ? '+' : ''}{era5.delta_c.toFixed(1)}°C depuis la fin du XXᵉ siècle
                </p>
                <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.6, margin: '0 0 10px', maxWidth: 640 }}>
                  Mesuré sur la moyenne des 10 dernières années, comparée à la période de référence 1961-1990. Les chiffres ci-dessous montrent ce que ce réchauffement deviendra à l&apos;horizon 2050 si la trajectoire continue.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)', letterSpacing: '0.04em', margin: 0 }}>
                  Réanalyse ERA5-Land · Copernicus Climate Data Store · données jusqu&apos;à {era5.data_through_year}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── BLOC 1 — TERRITOIRE ──────────────────────────────────────── */}

        {/* Score hero */}
        {displayScore != null && (
          <div className="score-hero" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div className="score-num">
                  {displayScore}<span className="score-denom">/100</span>
                </div>
                <div className="score-label">
                  Score de tension canicule{scoreIsEstimated ? ' · estimé depuis les projections DRIAS' : ''}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="commune-name">{communeName}</div>
                <div className="commune-meta">Dept. {dept} · INSEE {commune?.insee_code ?? insee_code}</div>
              </div>
            </div>

            {/* 4 indicators inline — only if from DB */}
            {commune && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 28, marginBottom: 24 }}>
                  {IND_LEGEND.map((item) => (
                    <div key={item.label} style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--fg-1)' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, background: ACCENT, color: '#060812', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--fg-3)' }}>{item.text}</div>
                    </div>
                  ))}
                </div>
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
              </>
            )}
          </div>
        )}

        {/* DRIAS projections */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
            Ce que les modèles prévoient pour 2050
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
            Scénario +4°C · Météo-France / CNRS · Valeur médiane sur l&apos;ensemble des modèles climatiques
          </div>
        </div>
        <div className="data-grid">
          {DRIAS_ITEMS.filter((item) => item.val != null).map((item) => (
            <div key={item.label} className="data-card">
              <div className="data-card-label">{item.label}</div>
              <div className="data-card-value">
                {typeof item.val === 'number' ? item.val.toFixed(0) : item.val}
                <span className="data-card-unit"> {item.unit}</span>
              </div>
              <div className="data-card-note">{item.note}</div>
            </div>
          ))}
          {DRIAS_ITEMS.filter((item) => item.val != null).length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: 20, color: 'var(--fg-4)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Données DRIAS indisponibles pour cette commune.
            </div>
          )}
        </div>

        {/* Géorisques — risques aggravés par la chaleur uniquement */}
        {heatRisks.length > 0 && (
          <>
            <div style={{ margin: '48px 0 10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
                Ce que la chaleur extrême aggrave ici
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
                Risques officiels GASPAR · base nationale de l&apos;État · données à l&apos;échelle de la commune, pas de l&apos;adresse exacte
              </div>
            </div>
            <div className="data-grid">
              {heatRisks.map((label) => (
                <div key={label} className="data-card">
                  <div className="data-card-label">{label}</div>
                  <div className="data-card-note" style={{ marginTop: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--fg-3)' }}>
                    {HEAT_RISK_DESCRIPTIONS[label]}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)' }}>
              Ces données indiquent que la commune est concernée, pas forcément chaque logement. Vérifiez à votre adresse exacte sur{' '}
              <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener" style={{ color: 'var(--fg-3)', textDecoration: 'underline' }}>georisques.gouv.fr</a>.
            </div>
          </>
        )}

        {/* ATMO */}
        {atmo && (
          <>
            <div style={{ margin: '40px 0 10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
                Qualité de l&apos;air · ATMO France
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
                Indice ATMO du {atmo.date} · La chaleur amplifie l&apos;ozone estival
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
            <em style={{ fontStyle: 'italic', color: ACCENT }}>pour {communeName}</em>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chaleur-sante-mentale.jpg" alt="Chaleur et santé mentale" className="article-img" />
              <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Santé mentale</span>
              <div className="article-title">Chaleur et santé mentale</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                Sommeil, humeur, hospitalisations psychiatriques : ce que la science dit vraiment.
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
            <Link href="/savoir/canicule" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chaleur-rue.jpg" alt="Canicule en ville" className="article-img" />
              <span className="article-cat" style={{ background: 'rgba(248,113,113,0.12)', color: ACCENT }}>Projections</span>
              <div className="article-title">Canicule en 2050 : les projections</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                Les données DRIAS commune par commune. Quels territoires basculeront ?
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
            <Link href="/savoir/pollutions-invisibles" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chaleur-feuille.jpg" alt="Pollutions invisibles" className="article-img" />
              <span className="article-cat" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>Air & sols</span>
              <div className="article-title">Pollutions invisibles</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                La chaleur amplifie l&apos;ozone. Comment lire les données et agir à la bonne échelle.
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
                date: 'Météo-France · Projections 2050',
                head: '57 communes dépasseront 60 jours de canicule par an',
                body: 'La rupture est nette dans le sud-est et la vallée du Rhône. Nice, Marseille, Montpellier : les projections climatiques sont maintenant convergentes entre modèles.',
                src: 'Météo-France / CNRS',
              },
              {
                date: 'Copernicus · 2025',
                head: '2025 : deuxième été le plus chaud jamais enregistré',
                body: "+1,3°C au-dessus de la moyenne d'avant l'ère industrielle. La trajectoire est cohérente avec les projections à +2°C et +4°C utilisées par futur•e.",
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
        <div>futur•e · Chaleur et canicule · {communeName}</div>
        <div>
          <Link href="/chaleur">← Toutes les communes</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
