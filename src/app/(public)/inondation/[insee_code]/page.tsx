import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getClimatDataCommune } from '@/lib/drias-json';
import { getGeorisquesSummary } from '@/lib/georisques';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 86400;

import top1000 from '@/data/top1000-communes.json';

export function generateStaticParams() {
  return (top1000 as string[]).map((code) => ({ insee_code: code }));
}

const ACCENT = '#60a5fa';

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

async function fetchScore(insee_code: string): Promise<CommuneScore | null> {
  const { data, error } = await getAnon()
    .from('communes_tension')
    .select('insee_code, nom_commune, departement, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence')
    .eq('slug', 'submersion')
    .eq('insee_code', insee_code)
    .maybeSingle();

  if (error) return null;
  return data;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ insee_code: string }>;
}): Promise<Metadata> {
  const { insee_code } = await params;
  const [score, drias] = await Promise.all([fetchScore(insee_code), getClimatDataCommune(insee_code).catch(() => null)]);
  const nomCommune = score?.nom_commune ?? drias?.commune?.n ?? insee_code;
  const title = `Inondation et submersion à ${nomCommune} : risques et données officielles`;
  const description = `Risques d'inondation, précipitations extrêmes et submersions marines à ${nomCommune} selon les données officielles de Météo-France et Géorisques.`;

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

export default async function InondationCommune({
  params,
}: {
  params: Promise<{ insee_code: string }>;
}) {
  const { insee_code } = await params;

  const [commune, driasData, georisques] = await Promise.all([
    fetchScore(insee_code),
    getClimatDataCommune(insee_code).catch(() => null),
    getGeorisquesSummary(insee_code).catch(() => null),
  ]);

  const communeName = commune?.nom_commune ?? driasData?.commune?.n ?? insee_code;
  const dept = commune?.departement ?? insee_code.slice(0, 2);
  const driasV = driasData?.commune?.s?.gwl30?.v;

  function computeScoreFromDrias(): number | null {
    if (!driasV) return null;
    const parts: { w: number; v: number }[] = [];
    if (driasV.NORRRq99_yr != null)     parts.push({ w: 3, v: Math.min(100, (driasV.NORRRq99_yr / 150) * 100) });
    if (driasV.NORRR_seas_DJF != null)  parts.push({ w: 1, v: Math.min(100, (driasV.NORRR_seas_DJF / 500) * 100) });
    if (driasV.NORRR_yr != null)        parts.push({ w: 0.5, v: Math.min(100, (driasV.NORRR_yr / 2000) * 100) });
    if (driasV.NORRx1d_yr != null)      parts.push({ w: 0.5, v: Math.min(100, (driasV.NORRx1d_yr / 7) * 100) });
    if (parts.length === 0) return null;
    const totalW = parts.reduce((s, p) => s + p.w, 0);
    return Math.round(parts.reduce((s, p) => s + (p.v * p.w) / totalW, 0));
  }

  // Score inondation fluviale : toujours calculé depuis DRIAS gwl30 formule pondérée
  const displayScore = computeScoreFromDrias() ?? null;

  // Score submersion marine : toute commune littorale ayant un score en base
  // (alimenté par populate-coastal-submersion.js — altitude au-dessus du niveau de la mer)
  // Les départements côtiers de France métropolitaine :
  const COASTAL_DEPTS = new Set(['06','11','13','14','17','22','29','30','33','34','35','40','44','50','56','59','62','64','66','76','83','85','2A','2B']);
  // On ne montre le bloc que si la commune est littorale ET a un score explicitement
  // inséré par le script côtier (ind_exposition null = score altimétrique, pas DRIAS fluvial)
  const coastalScore = (commune != null && COASTAL_DEPTS.has(dept) && commune.ind_exposition == null)
    ? commune.score
    : null;

  const DRIAS_ITEMS: { label: string; val: number | undefined; unit: string; note: string }[] = [
    {
      label: 'Précipitations extrêmes (max 1 jour)',
      val: driasV?.NORRx1d_yr,
      unit: 'mm',
      note: "Quantité maximale de pluie tombée en 24 heures dans le scénario +4°C. Au-delà de 100 mm/j, les systèmes d'assainissement urbains sont saturés et les crues se déclenchent rapidement.",
    },
    {
      label: 'Précipitations remarquables (p99)',
      val: driasV?.NORRRq99_yr,
      unit: 'mm',
      note: "Seuil dépassé 1 % du temps — soit environ 3 à 4 fois par an. C'est l'indicateur de référence pour évaluer la fréquence des épisodes à fort ruissellement.",
    },
    {
      label: 'Précipitations annuelles totales',
      val: driasV?.NORRR_yr,
      unit: 'mm',
      note: "Volume total de précipitations sur l'année en 2050. Un volume élevé combiné à une forte saisonnalité augmente le risque d'inondation sur des sols déjà saturés.",
    },
    {
      label: 'Précipitations hivernales',
      val: driasV?.NORRR_seas_DJF,
      unit: 'mm',
      note: "Les crues de plaine surviennent principalement en hiver (décembre–février) quand les sols sont saturés. C'est la saison à risque pour la majorité des cours d'eau de plaine.",
    },
  ];

  const IND_ITEMS = [
    { key: 'ind_exposition'    as const, label: 'Exposition',            desc: "Intensité des précipitations extrêmes." },
    { key: 'ind_vulnerabilite' as const, label: 'Vulnérabilité',         desc: 'Fréquence des épisodes à fort ruissellement.' },
    { key: 'ind_adaptation'    as const, label: "Capacité d'adaptation", desc: 'Ressources locales pour faire face au risque.' },
    { key: 'ind_occurrence'    as const, label: 'Occurrence',            desc: 'Fréquence des événements extrêmes projetés.' },
  ];

  const IND_LEGEND = [
    { icon: 'E', label: 'Exposition', text: "Le territoire reçoit des pluies ou des débordements qui peuvent faire monter l'eau rapidement." },
    { icon: 'V', label: 'Vulnérabilité', text: 'Certaines zones habitées ou certains habitants ont moins de marge face à une inondation.' },
    { icon: 'A', label: 'Adaptation', text: 'La commune dispose de plus ou moins de protections, d\'équipements et de moyens pour réagir.' },
    { icon: 'O', label: 'Occurrence', text: 'Les épisodes à risque y sont déjà présents, ou appelés à devenir plus fréquents.' },
  ];

  const FLOOD_RISK_LABELS = new Set([
    'Inondation',
    'Submersion marine',
    'Ruissellement',
    'Débordement de cours d\'eau',
    'Remontées de nappes',
    'Inondation par remontée de nappe',
  ]);

  const FLOOD_RISK_DESCRIPTIONS: Record<string, string> = {
    'Inondation': "La commune est officiellement classée en zone inondable par l'État (base GASPAR). Cela signifie qu'un ou plusieurs cours d'eau peuvent déborder et atteindre des zones habitées lors de crues centennales ou plus fréquentes. Un Plan de Prévention des Risques Naturels (PPRN) inondation peut s'appliquer à tout ou partie du territoire.",
    'Submersion marine': "La commune est exposée au risque de submersion marine : des vagues ou des marées exceptionnelles peuvent inonder des zones terrestres proches du littoral. Ce risque est directement aggravé par la montée du niveau de la mer prévue d'ici 2050, qui augmentera la fréquence des événements autrefois rares.",
    'Ruissellement': "Le territoire présente un risque de ruissellement urbain : lors d'épisodes de pluies intenses, l'eau ne peut pas s'infiltrer assez rapidement et crée des flux de surface qui inondent les zones basses. Ce risque est en forte hausse avec l'intensification des précipitations extrêmes.",
    'Débordement de cours d\'eau': "Un ou plusieurs cours d'eau traversant la commune présentent un risque de débordement documenté. Ce phénomène est direct et prévisible : il survient lorsque le débit dépasse la capacité du lit mineur.",
    'Remontées de nappes': "La commune est exposée au risque de remontée de nappe phréatique. En période de recharge hivernale intense, la nappe peut affleurer et inonder des caves, sous-sols et fondations même à distance des cours d'eau visibles.",
    'Inondation par remontée de nappe': "Même mécanisme que les remontées de nappe classiques, formellement identifié par l'État. Ce risque touche particulièrement les zones de fond de vallée et les plaines alluviales où la nappe est naturellement proche de la surface.",
  };

  const floodRisks = (georisques?.riskLabels ?? []).filter((l) => FLOOD_RISK_LABELS.has(l));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb" style={{ width: 500, height: 500, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -140, left: -120 }} />
      <div className="orb" style={{ width: 360, height: 360, background: 'radial-gradient(circle,#818cf8 0%,transparent 70%)', bottom: -80, right: -60, animationDelay: '-7s', opacity: 0.14 }} />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span style={{ color: ACCENT, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div className="crumb">
            <Link href="/inondation">Inondation et submersion</Link>
            <span className="crumb-sep">/</span>
            {communeName}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="page">
        <Link className="back-link" href="/inondation">← Inondation et submersion</Link>

        {/* ── INTRO CONTEXTUELLE ───────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
            Inondation et submersion · Projections 2050
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 400, color: 'var(--fg-1)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 18px' }}>
            À {communeName}, quel est le risque d&apos;inondation réel ?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-3)', lineHeight: 1.75, maxWidth: 640, margin: '0 0 12px' }}>
            Cette page rassemble les données officielles sur l&apos;exposition de {communeName} aux inondations, aux submersions marines et aux précipitations extrêmes — issues de Géorisques, de Météo-France et du CNRS, dans un scénario de réchauffement à +4°C d&apos;ici 2050.
          </p>
          <p style={{ fontSize: 14, color: 'var(--fg-4)', lineHeight: 1.65, maxWidth: 640, margin: 0, fontFamily: 'var(--font-mono)' }}>
            Que vous habitiez ici, envisagiez d&apos;y acheter un bien ou prépariez votre avenir, ces données ont une valeur concrète pour vos décisions.
          </p>
        </div>

        {/* ── BLOC 1 — TERRITOIRE ──────────────────────────────────────── */}

        {/* Score hero */}
        {displayScore != null && (
          <div className="score-hero" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div className="score-num">
                  {displayScore}<span className="score-denom">/100</span>
                </div>
                <div className="score-label">Score de tension inondation · projections DRIAS +4°C</div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="commune-name">{communeName}</div>
                <div className="commune-meta">Dept. {dept} · INSEE {commune?.insee_code ?? insee_code}</div>
              </div>
            </div>

            {commune && IND_ITEMS.some((ind) => commune[ind.key] != null) && (
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

        {/* ── BLOC SUBMERSION MARINE (villes côtières uniquement) ──────── */}
        {coastalScore != null && (
          <div style={{ padding: '28px 32px', borderRadius: 12, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(48px,7vw,72px)', lineHeight: 1, fontWeight: 400, letterSpacing: '-0.03em', color: '#38bdf8' }}>
                  {coastalScore}<span style={{ fontSize: '0.38em', color: 'var(--fg-4)' }}>/100</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-4)', marginTop: 6 }}>
                  Score de risque submersion marine · altitude NGF
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.7 }}>
                  {communeName} est une commune littorale exposée à un risque <strong style={{ color: 'var(--fg-1)' }}>distinct</strong> des inondations fluviales : la submersion marine. Ce score mesure la hauteur de la ville au-dessus du niveau de la mer. Plus une ville est basse, plus elle est vulnérable si la mer monte lors d&apos;une tempête ou si le niveau marin s&apos;élève durablement avec le réchauffement.
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)', borderTop: '1px solid rgba(56,189,248,0.12)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span>Inondation fluviale et submersion marine sont deux risques indépendants. Une ville peut être peu exposée à l&apos;un et très exposée à l&apos;autre.</span>
              <Link href="/inondation/villes-les-plus-exposees-submersion" style={{ color: '#38bdf8', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Voir le classement submersion →
              </Link>
            </div>
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

        {/* Géorisques — risques inondation */}
        {floodRisks.length > 0 && (
          <>
            <div style={{ margin: '48px 0 10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
                Risques officiels reconnus sur cette commune
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-4)' }}>
                Base GASPAR · Géorisques · données à l&apos;échelle de la commune, pas de l&apos;adresse exacte
              </div>
            </div>
            <div className="data-grid">
              {floodRisks.map((label) => (
                <div key={label} className="data-card">
                  <div className="data-card-label">{label}</div>
                  <div className="data-card-note" style={{ marginTop: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--fg-3)' }}>
                    {FLOOD_RISK_DESCRIPTIONS[label]}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)' }}>
              Ces données indiquent que la commune est concernée, pas nécessairement chaque logement. Vérifiez à votre adresse exacte sur{' '}
              <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener" style={{ color: 'var(--fg-3)', textDecoration: 'underline' }}>georisques.gouv.fr</a>{' '}
              ou via notre{' '}
              <Link href="/rapport/logement" style={{ color: 'var(--fg-3)', textDecoration: 'underline' }}>module Logement</Link>.
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
            <Link href="/rapport/logement" className="cta-sec">Ouvrir le module Logement →</Link>
          </div>
        </div>

        <div className="divider" style={{ marginTop: 72 }} />

        {/* ── BLOC 2 — COMPRENDRE ──────────────────────────────────────── */}
        <section className="section">
          <div className="section-eyebrow">Comprendre</div>
          <h2 className="section-title">Aller plus loin sur l&apos;inondation</h2>
          <p className="section-sub">Trois lectures de fond pour contextualiser ces données.</p>
          <div className="articles-grid">
            <Link href="/savoir/submersion" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hub-submersion.jpg" alt="Inondation et submersion" className="article-img" />
              <span className="article-cat" style={{ background: 'rgba(96,165,250,0.12)', color: ACCENT }}>Projections</span>
              <div className="article-title">Inondations en 2050 : les données</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                Précipitations extrêmes, montée des eaux, submersions marines : les projections territoire par territoire.
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
            <Link href="/agir/inondation" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gerer-risque-inondation-logement.jpg" alt="Gérer le risque inondation" className="article-img" />
              <span className="article-cat" style={{ background: 'rgba(96,165,250,0.12)', color: ACCENT }}>Guide pratique</span>
              <div className="article-title">Gérer le risque inondation</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                PPRN, IAL, assurance catnat, Fonds Barnier : ce que vous devez savoir si votre commune est exposée.
              </div>
              <div className="article-cta">Lire →</div>
            </Link>
            <Link href="/savoir/preparation-catastrophes" className="article-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hub-preparation.jpg" alt="Préparation aux catastrophes" className="article-img" />
              <span className="article-cat" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>Résilience</span>
              <div className="article-title">Sommes-nous prêts ?</div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.55 }}>
                Le paradoxe de la résilience française : on sait, mais on ne se prépare pas. Les données et les leviers.
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
          <p className="section-sub">Deux outils ciblés selon votre situation.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginTop: 24 }}>
            <Link href="/agir/inondation" style={{ padding: '24px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>Guide pratique</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.35 }}>Se préparer au risque inondation</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>PPRN, assurance, Fonds Barnier, clapets anti-retour : les démarches concrètes pour votre situation.</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, marginTop: 'auto' }}>Voir le guide →</div>
            </Link>
            <Link href="/comparateur" style={{ padding: '24px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)' }}>Outil de comparaison</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.35 }}>Comparer avec une autre commune</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.6 }}>Inondation, chaleur, eau, revenus, accès aux soins : les deux territoires côte à côte en moins de 10 secondes.</div>
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
                date: 'Géorisques · Ministère de la Transition Écologique',
                head: '17 millions de Français vivent en zone inondable',
                body: "Soit plus d'un Français sur quatre. La France est le pays européen le plus exposé au risque inondation, avec 9 millions de logements dans des zones à risque documentées.",
                src: 'Géorisques / MTES',
              },
              {
                date: 'Copernicus · 2025',
                head: "Précipitations extrêmes : +18 % d'intensité en 30 ans",
                body: "Les épisodes de pluies intenses se sont intensifiés en Europe. Dans le sud de la France, les épisodes méditerranéens dépassent régulièrement les records historiques, y compris dans des zones non classées à risque.",
                src: 'Copernicus Climate Change Service',
              },
            ].map((signal) => (
              <div key={signal.head} style={{ padding: 22, borderRadius: 10, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.14)', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
        <div>futur•e · Inondation et submersion · {communeName}</div>
        <div>
          <Link href="/inondation">← Toutes les communes</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
