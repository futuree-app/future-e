import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ComparatorSearch } from '@/components/ComparatorSearch';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';
import { getClimatDataCommune } from '@/lib/drias-json';
import { getGeorisquesSummary } from '@/lib/georisques';
import { getCurrentSessionUser } from '@/lib/user-account';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Comparateur de communes · futur•e',
  description:
    "Comparez deux communes sur leurs tensions climatiques, sanitaires et de mobilité. Une lecture publique, puis un déblocage complet avec l'abonnement Suivi.",
};

type SearchParams = {
  a?: string | string[];
  an?: string | string[];
  b?: string | string[];
  bn?: string | string[];
};

type CompareRow = {
  insee_code: string;
  nom_commune: string;
  code_postal: string | null;
  departement: string | null;
  slug: string;
  score: number;
  ind_exposition: number | null;
  ind_vulnerabilite: number | null;
  ind_adaptation: number | null;
  ind_occurrence: number | null;
};

type CommuneComparison = {
  code: string;
  name: string;
  postalCode: string | null;
  department: string | null;
  metrics: Partial<Record<DimensionSlug, CompareRow>>;
};

type DisplayMetric = {
  score: number | null;
  label: string;
  note: string;
};

type DimensionSlug =
  | 'canicule'
  | 'submersion'
  | 'feux'
  | 'pollens'
  | 'cadmium'
  | 'dependance-auto';

const DIMENSIONS: Array<{
  slug: DimensionSlug;
  label: string;
  shortLabel: string;
  sublabel: string;
  accent: string;
  free: boolean;
  href: (code: string) => string;
}> = [
  {
    slug: 'canicule',
    label: 'Canicule',
    shortLabel: 'la chaleur extrême',
    sublabel: 'Projection chaleur par commune',
    accent: '#f87171',
    free: true,
    href: (code) => `/territoires/canicule/${code}`,
  },
  {
    slug: 'submersion',
    label: 'Inondation / submersion',
    shortLabel: "le risque d'inondation",
    sublabel: 'Lecture Géorisques et zones basses',
    accent: '#60a5fa',
    free: true,
    href: (code) => `/territoires/submersion/${code}`,
  },
  {
    slug: 'feux',
    label: 'Feux de forêt',
    shortLabel: 'les feux de forêt',
    sublabel: 'Extension des zones à risque',
    accent: '#fb923c',
    free: false,
    href: (code) => `/territoires/feux/${code}`,
  },
  {
    slug: 'pollens',
    label: 'Pollens',
    shortLabel: "l'exposition pollinique",
    sublabel: 'Saisons longues et pics allergènes',
    accent: '#4ade80',
    free: false,
    href: (code) => `/territoires/pollens/${code}`,
  },
  {
    slug: 'cadmium',
    label: 'Cadmium',
    shortLabel: 'les pollutions diffuses',
    sublabel: 'Teneur des sols et vigilance sanitaire',
    accent: '#a78bfa',
    free: false,
    href: (code) => `/territoires/cadmium/${code}`,
  },
  {
    slug: 'dependance-auto',
    label: 'Dépendance automobile',
    shortLabel: 'la dépendance à la voiture',
    sublabel: 'Vulnérabilité mobilité du territoire',
    accent: '#f59e0b',
    free: false,
    href: (code) => `/territoires/dependance-auto/${code}`,
  },
];

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.28;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:520px;height:520px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:-140px;left:-120px;}
  .orb-2{width:420px;height:420px;background:radial-gradient(circle,#60a5fa 0%,transparent 70%);bottom:-120px;right:-100px;animation-delay:-5s;}
  .orb-3{width:360px;height:360px;background:radial-gradient(circle,#4ade80 0%,transparent 70%);top:42%;left:58%;opacity:0.14;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.14) translate(20px,-28px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:1120px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .brand-dot{color:#f87171;font-style:normal;}
  .nav-crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--fg-3);text-decoration:none;}
  .nav-crumb .sep{margin:0 10px;color:var(--fg-4);}
  .page{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:64px 28px 120px;}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.28);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#f87171;margin-bottom:24px;}
  .eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:#f87171;box-shadow:0 0 10px #f87171;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(38px,5vw,60px);line-height:1.06;letter-spacing:-0.02em;margin:0 0 20px;color:var(--fg-1);}
  h1 em{font-style:italic;color:#60a5fa;}
  .lede{font-family:var(--font-serif);font-size:clamp(18px,2vw,22px);line-height:1.55;color:var(--fg-3);margin:0 0 48px;max-width:720px;}
  .compare-shell{margin:0 0 40px;}
  .compare-selector{display:grid;grid-template-columns:1fr 60px 1fr;border:1px solid var(--border-1);background:rgba(255,255,255,0.03);}
  .compare-input-wrap{position:relative;padding:20px 22px;}
  .compare-input-wrap:first-child{border-right:1px solid var(--border-1);}
  .compare-input-wrap:last-child{border-left:1px solid var(--border-1);}
  .compare-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:10px;}
  .compare-input{width:100%;background:transparent;border:none;color:var(--fg-1);font-family:var(--font-serif);font-size:22px;line-height:1.2;padding:0;border-radius:0;}
  .compare-input::placeholder{color:var(--fg-4);font-style:italic;}
  .compare-loading{position:absolute;right:0;top:2px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);}
  .compare-divider{display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:var(--fg-4);text-transform:uppercase;background:rgba(255,255,255,0.04);}
  .compare-dropdown{position:absolute;top:calc(100% + 8px);left:0;right:0;background:rgba(6,8,18,0.98);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--border-1);border-radius:10px;overflow:hidden;z-index:30;box-shadow:0 20px 40px rgba(0,0,0,0.45);}
  .compare-row{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.05);text-align:left;cursor:pointer;}
  .compare-row-name{font-size:14px;color:var(--fg-1);}
  .compare-row-meta{font-family:var(--font-mono);font-size:10px;letter-spacing:0.06em;color:var(--fg-4);flex-shrink:0;}
  .compare-actions{display:flex;align-items:center;gap:12px;margin-top:12px;}
  .compare-btn,.share-btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border-radius:0;border:1px solid var(--border-1);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:background 0.2s,border-color 0.2s,color 0.2s;}
  .compare-btn{background:#f1dfb8;color:#060812;border-color:#f1dfb8;min-width:220px;}
  .compare-btn:disabled,.share-btn:disabled{opacity:0.45;cursor:not-allowed;}
  .compare-btn:not(:disabled):hover{background:#f7e7c7;border-color:#f7e7c7;}
  .share-btn{background:transparent;color:var(--fg-3);}
  .share-btn:not(:disabled):hover{border-color:var(--fg-3);color:var(--fg-1);}
  .panel{padding:28px;border:1px solid var(--border-1);background:rgba(255,255,255,0.03);}
  .verdict{position:relative;overflow:hidden;margin-bottom:30px;}
  .verdict::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:#f87171;}
  .panel-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:12px;}
  .verdict-text{font-family:var(--font-serif);font-size:22px;line-height:1.5;color:var(--fg-1);max-width:760px;}
  .verdict-text strong{color:#f1dfb8;font-weight:400;}
  .compare-head{display:grid;grid-template-columns:180px 1fr 1fr;gap:16px;padding:0 0 12px;border-bottom:1px solid var(--border-1);margin-bottom:0;}
  .compare-head-city{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);text-align:center;}
  .compare-grid{margin-bottom:26px;}
  .dimension-row{position:relative;display:grid;grid-template-columns:180px 1fr 1fr;gap:16px;padding:22px 0;border-bottom:1px solid var(--border-1);align-items:center;}
  .dimension-row.locked{opacity:0.7;}
  .dimension-meta{display:flex;flex-direction:column;gap:4px;}
  .dimension-link{font-size:15px;color:var(--fg-1);text-decoration:none;}
  .dimension-link:hover{color:inherit;text-decoration:underline;}
  .dimension-sub{font-family:var(--font-mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:var(--fg-4);}
  .score-cell{display:flex;flex-direction:column;align-items:center;gap:9px;text-align:center;min-height:76px;justify-content:center;}
  .risk-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;}
  .risk-good{background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.22);color:#86efac;}
  .risk-medium{background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.2);color:#fbbf24;}
  .risk-bad{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.24);color:#fca5a5;}
  .risk-unknown{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:var(--fg-4);}
  .score-bar-wrap{width:100%;height:2px;background:rgba(255,255,255,0.08);overflow:hidden;}
  .score-bar{height:100%;}
  .score-label{font-size:11px;color:var(--fg-3);line-height:1.45;max-width:220px;}
  .score-note{font-family:var(--font-mono);font-size:10px;letter-spacing:0.05em;color:var(--fg-4);}
  .locked-cell{color:var(--fg-4);}
  .lock-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;}
  .lock-badge{padding:7px 14px;background:rgba(6,8,18,0.92);border:1px solid rgba(255,255,255,0.12);font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#f1dfb8;}
  .cta{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;}
  .cta-title{font-family:var(--font-serif);font-size:28px;line-height:1.2;margin:0 0 10px;color:var(--fg-1);}
  .cta-desc{font-size:15px;color:var(--fg-3);line-height:1.7;max-width:520px;}
  .cta-points{display:grid;gap:8px;margin-top:18px;font-size:13px;color:var(--fg-3);}
  .cta-point::before{content:"→";display:inline-block;margin-right:10px;color:#f1dfb8;}
  .cta-side{display:flex;flex-direction:column;align-items:flex-end;gap:12px;flex-shrink:0;}
  .cta-price{font-family:var(--font-serif);font-size:42px;line-height:1;color:var(--fg-1);}
  .cta-period{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:var(--fg-4);text-transform:uppercase;text-align:right;}
  .cta-button,.cta-secondary{display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;text-decoration:none;font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;border:1px solid rgba(255,255,255,0.12);}
  .cta-button{background:#f1dfb8;color:#060812;border-color:#f1dfb8;}
  .cta-secondary{background:transparent;color:var(--fg-3);}
  .empty-state{padding:36px;border:1px dashed rgba(255,255,255,0.16);color:var(--fg-3);font-size:15px;line-height:1.7;}
  .footnote{margin-top:24px;padding-top:20px;border-top:1px solid var(--border-1);font-family:var(--font-mono);font-size:10px;letter-spacing:0.05em;color:var(--fg-4);line-height:1.8;text-transform:uppercase;}
  .nav-footer{position:relative;top:auto;margin-top:28px;border-top:1px solid var(--border-1);border-bottom:none;}
  @media(max-width:900px){.compare-head,.dimension-row{grid-template-columns:140px 1fr 1fr;gap:12px;}}
  @media(max-width:768px){
    .page{padding:40px 20px 80px;}
    .nav-inner{padding:14px 20px;}
    h1{font-size:36px;}
    .lede{font-size:18px;}
    .compare-selector{grid-template-columns:1fr;}
    .compare-input-wrap:first-child,.compare-input-wrap:last-child{border:none;}
    .compare-input-wrap + .compare-input-wrap{border-top:1px solid var(--border-1);}
    .compare-divider{padding:10px 0;border-top:1px solid var(--border-1);border-bottom:1px solid var(--border-1);}
    .compare-actions{flex-direction:column;align-items:stretch;}
    .compare-btn,.share-btn{width:100%;}
    .compare-head{display:none;}
    .dimension-row{grid-template-columns:1fr;gap:14px;padding:24px 0;}
    .score-cell{align-items:flex-start;text-align:left;min-height:auto;}
    .score-label{max-width:none;}
    .cta{flex-direction:column;}
    .cta-side{align-items:flex-start;}
    .cta-period{text-align:left;}
    .lock-overlay{position:static;justify-content:flex-start;padding-top:8px;}
  }
`;

function getAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

function pickString(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function scoreToLevel(score: number | null | undefined) {
  if (score == null) {
    return {
      key: 'unknown',
      label: 'Indisponible',
      className: 'risk-unknown',
      bar: 'rgba(255,255,255,0.1)',
    };
  }

  if (score >= 67) {
    return {
      key: 'bad',
      label: 'Élevé',
      className: 'risk-bad',
      bar: '#f87171',
    };
  }

  if (score >= 34) {
    return {
      key: 'medium',
      label: 'Modéré',
      className: 'risk-medium',
      bar: '#fbbf24',
    };
  }

  return {
    key: 'good',
    label: 'Faible',
    className: 'risk-good',
    bar: '#4ade80',
  };
}

function buildCommune(
  code: string,
  fallbackName: string,
  rows: CompareRow[],
): CommuneComparison {
  const metrics = Object.fromEntries(
    rows.map((row) => [row.slug, row]),
  ) as Partial<Record<DimensionSlug, CompareRow>>;
  const representative = rows[0];

  return {
    code,
    name: representative?.nom_commune ?? fallbackName,
    postalCode: representative?.code_postal ?? null,
    department: representative?.departement ?? (code.length >= 2 ? code.slice(0, 2) : null),
    metrics,
  };
}

function buildVerdict(
  left: CommuneComparison,
  right: CommuneComparison,
  hasFullAccess: boolean,
  fallbackMetrics?: {
    left: Partial<Record<DimensionSlug, DisplayMetric>>;
    right: Partial<Record<DimensionSlug, DisplayMetric>>;
  },
) {
  const activeDimensions = DIMENSIONS.filter((dimension) => hasFullAccess || dimension.free);
  const leftAdvantages: string[] = [];
  const rightAdvantages: string[] = [];

  for (const dimension of activeDimensions) {
    const leftScore =
      fallbackMetrics?.left[dimension.slug]?.score ?? left.metrics[dimension.slug]?.score;
    const rightScore =
      fallbackMetrics?.right[dimension.slug]?.score ?? right.metrics[dimension.slug]?.score;

    if (leftScore == null || rightScore == null || leftScore === rightScore) {
      continue;
    }

    if (leftScore < rightScore) {
      leftAdvantages.push(dimension.shortLabel);
    } else {
      rightAdvantages.push(dimension.shortLabel);
    }
  }

  if (leftAdvantages.length === 0 && rightAdvantages.length === 0) {
    return hasFullAccess
      ? `<strong>${left.name}</strong> et <strong>${right.name}</strong> ressortent à un niveau comparable sur les six dimensions lues ici. La différence se jouera surtout dans le détail des indicateurs et dans votre profil.`
      : `<strong>${left.name}</strong> et <strong>${right.name}</strong> ressortent à un niveau proche sur la lecture publique. Les dimensions réservées permettent d'arbitrer plus finement.`;
  }

  if (leftAdvantages.length > rightAdvantages.length) {
    return hasFullAccess
      ? `<strong>${left.name}</strong> ressort ici comme la commune la moins exposée, surtout sur ${leftAdvantages.slice(0, 2).join(' et ')}.`
      : `Sur la lecture publique, <strong>${left.name}</strong> paraît moins exposée que <strong>${right.name}</strong>, surtout sur ${leftAdvantages.slice(0, 2).join(' et ')}.`;
  }

  if (rightAdvantages.length > leftAdvantages.length) {
    return hasFullAccess
      ? `<strong>${right.name}</strong> ressort ici comme la commune la moins exposée, surtout sur ${rightAdvantages.slice(0, 2).join(' et ')}.`
      : `Sur la lecture publique, <strong>${right.name}</strong> paraît moins exposée que <strong>${left.name}</strong>, surtout sur ${rightAdvantages.slice(0, 2).join(' et ')}.`;
  }

  return hasFullAccess
    ? `<strong>${left.name}</strong> et <strong>${right.name}</strong> se partagent les avantages selon les dimensions. Le bon choix dépendra de la tension que vous tolérez le moins.`
    : `<strong>${left.name}</strong> et <strong>${right.name}</strong> se partagent les avantages sur les dimensions visibles. Les dimensions verrouillées peuvent encore faire pencher l'arbitrage.`;
}

async function fetchRows(codes: string[]) {
  const { data, error } = await getAnon()
    .from('communes_tension')
    .select(
      'insee_code, nom_commune, code_postal, departement, slug, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence',
    )
    .in('insee_code', codes)
    .in(
      'slug',
      DIMENSIONS.map((dimension) => dimension.slug),
    );

  if (error) {
    console.error('[Comparateur] Supabase error:', error.message);
    return [];
  }

  return (data ?? []) as CompareRow[];
}

async function buildFallbackMetrics(
  inseeCode: string,
): Promise<Partial<Record<DimensionSlug, DisplayMetric>>> {
  const [driasData, georisques] = await Promise.all([
    getClimatDataCommune(inseeCode).catch(() => null),
    getGeorisquesSummary(inseeCode).catch(() => null),
  ]);

  const fallback: Partial<Record<DimensionSlug, DisplayMetric>> = {};
  const driasValues = driasData?.commune?.s?.gwl20?.v;

  if (driasValues?.NORTX30D_yr != null) {
    const days = Math.round(driasValues.NORTX30D_yr);

    fallback.canicule = {
      score: Math.max(0, Math.min(100, Math.round((days / 90) * 100))),
      label: `${days} jours > 30°C / an`,
      note: 'Source DRIAS · horizon 2050',
    };
  }

  if (georisques) {
    const hasMarine = georisques.flags.marineSubmersion;
    const hasFlood = georisques.flags.flood;

    fallback.submersion = {
      score: hasMarine ? 85 : hasFlood ? 62 : 18,
      label: hasMarine
        ? 'Submersion marine signalée'
        : hasFlood
          ? 'Risque inondation signalé'
          : 'Pas de signal majeur remonté',
      note: georisques.riskLabels[0] ?? 'Source Géorisques · lecture communale',
    };
  }

  return fallback;
}

function toDisplayMetric(
  row: CompareRow | undefined,
  fallback: DisplayMetric | undefined,
): DisplayMetric | null {
  if (row) {
    return {
      score: row.score,
      label: `Score ${Math.round(row.score)}/100`,
      note: `Exposition ${Math.round(row.ind_exposition ?? 0)} · Vulnérabilité ${Math.round(row.ind_vulnerabilite ?? 0)}`,
    };
  }

  return fallback ?? null;
}

export default async function ComparateurPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const leftCode = pickString(query.a).trim();
  const rightCode = pickString(query.b).trim();
  const leftName = pickString(query.an).trim();
  const rightName = pickString(query.bn).trim();

  const { supabase, user } = await getCurrentSessionUser();
  let hasFullAccess = false;

  if (user) {
    const { data: accountRow } = await supabase
      .from('user_accounts')
      .select('plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const account = normalizeAccount(
      accountRow
        ? { plan: accountRow.plan, status: accountRow.status, email: user.email ?? null }
        : { email: user.email ?? null },
    );

    hasFullAccess = canAccessActionPage(account);
  }

  const hasSelection = Boolean(leftCode && rightCode);
  const rows = hasSelection ? await fetchRows([leftCode, rightCode]) : [];
  const leftRows = rows.filter((row) => row.insee_code === leftCode);
  const rightRows = rows.filter((row) => row.insee_code === rightCode);

  const leftCommune = hasSelection ? buildCommune(leftCode, leftName || 'Commune A', leftRows) : null;
  const rightCommune = hasSelection ? buildCommune(rightCode, rightName || 'Commune B', rightRows) : null;
  const [leftFallbackMetrics, rightFallbackMetrics] =
    hasSelection && leftCommune && rightCommune
      ? await Promise.all([
          buildFallbackMetrics(leftCommune.code),
          buildFallbackMetrics(rightCommune.code),
        ])
      : [{}, {}];
  const verdict =
    leftCommune && rightCommune
      ? buildVerdict(leftCommune, rightCommune, hasFullAccess, {
          left: leftFallbackMetrics,
          right: rightFallbackMetrics,
        })
      : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/">Accueil</Link>
            <span className="sep">/</span>
            Comparateur
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="page">
        <div className="eyebrow">Outil public · Comparateur</div>
        <h1>
          Deux communes.
          <br />
          <em>Un arbitrage plus clair.</em>
        </h1>
        <p className="lede">
          Comparez deux territoires sur les tensions qui comptent pour une installation,
          un achat ou un déménagement. La lecture publique montre deux dimensions.
          L&apos;abonnement Suivi débloque le comparatif complet.
        </p>

        <ComparatorSearch
          initialLeft={leftCode ? { code: leftCode, nom: leftName || leftCode } : null}
          initialRight={rightCode ? { code: rightCode, nom: rightName || rightCode } : null}
        />

        {leftCommune && rightCommune && verdict ? (
          <>
            <section className="panel verdict">
              <div className="panel-label">Synthèse comparative</div>
              <div
                className="verdict-text"
                dangerouslySetInnerHTML={{ __html: verdict }}
              />
            </section>

            <div className="compare-head">
              <div />
              <div className="compare-head-city">
                {leftCommune.name}
                <br />
                {leftCommune.postalCode ? `${leftCommune.postalCode} · ` : ''}
                Dept. {leftCommune.department ?? leftCommune.code.slice(0, 2)}
              </div>
              <div className="compare-head-city">
                {rightCommune.name}
                <br />
                {rightCommune.postalCode ? `${rightCommune.postalCode} · ` : ''}
                Dept. {rightCommune.department ?? rightCommune.code.slice(0, 2)}
              </div>
            </div>

            <div className="compare-grid">
              {DIMENSIONS.map((dimension) => {
                const leftMetric = leftCommune.metrics[dimension.slug];
                const rightMetric = rightCommune.metrics[dimension.slug];
                const leftDisplayMetric = toDisplayMetric(
                  leftMetric,
                  leftFallbackMetrics[dimension.slug],
                );
                const rightDisplayMetric = toDisplayMetric(
                  rightMetric,
                  rightFallbackMetrics[dimension.slug],
                );
                const locked = !dimension.free && !hasFullAccess;
                const leftRisk = scoreToLevel(leftDisplayMetric?.score);
                const rightRisk = scoreToLevel(rightDisplayMetric?.score);

                return (
                  <div
                    key={dimension.slug}
                    className={`dimension-row${locked ? ' locked' : ''}`}
                  >
                    <div className="dimension-meta">
                      <Link className="dimension-link" href={dimension.href(leftCommune.code)}>
                        {dimension.label}
                      </Link>
                      <div className="dimension-sub">{dimension.sublabel}</div>
                    </div>

                    {locked ? (
                      <>
                        <div className="score-cell locked-cell">
                          <div className="risk-tag risk-unknown">Détail réservé</div>
                          <div className="score-note">Lecture personnalisée avec Suivi</div>
                        </div>
                        <div className="score-cell locked-cell">
                          <div className="risk-tag risk-unknown">Détail réservé</div>
                          <div className="score-note">Lecture personnalisée avec Suivi</div>
                        </div>
                        <div className="lock-overlay">
                          <div className="lock-badge">4 dimensions débloquées avec Suivi</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ScoreCell metric={leftDisplayMetric} risk={leftRisk} />
                        <ScoreCell metric={rightDisplayMetric} risk={rightRisk} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {!hasFullAccess ? (
              <section className="panel cta">
                <div>
                  <div className="panel-label">Suivi · comparateur complet</div>
                  <h2 className="cta-title">La version publique reste volontairement partielle.</h2>
                  <p className="cta-desc">
                    Les dimensions visibles donnent une première hiérarchie. Le vrai arbitrage
                    se joue souvent sur la santé locale, la mobilité quotidienne, les pollutions
                    diffuses ou le feu. C&apos;est ce bloc qui se débloque avec Suivi.
                  </p>
                  <div className="cta-points">
                    <div className="cta-point">Quatre dimensions comparatives supplémentaires</div>
                    <div className="cta-point">Même lecture, mais croisée avec votre profil</div>
                    <div className="cta-point">Accès direct aux fiches territoire détaillées</div>
                    <div className="cta-point">Continuité avec le dashboard et le rapport</div>
                  </div>
                </div>

                <div className="cta-side">
                  <div>
                    <div className="cta-price">9€</div>
                    <div className="cta-period">par mois · sans engagement</div>
                  </div>
                  <Link href="/inscription" className="cta-button">
                    S&apos;abonner au Suivi
                  </Link>
                  <Link href="/connexion" className="cta-secondary">
                    Déjà abonné ? Se connecter
                  </Link>
                </div>
              </section>
            ) : null}

            <div className="footnote">
              Données · Supabase `communes_tension` · lecture comparative non normative ·
              scores synthétiques à l&apos;échelle communale · accès complet réservé aux comptes Suivi
            </div>
          </>
        ) : (
          <section className="empty-state">
            Choisissez deux communes pour afficher leur lecture comparative. La page reste
            publique, mais seules deux dimensions sont visibles sans abonnement.
          </section>
        )}
      </main>

      <footer className="nav nav-footer">
        <div className="nav-inner">
          <Link href="/" className="brand">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/">Accueil</Link>
            <span className="sep">/</span>
            Comparateur
          </div>
          <ThemeToggle />
        </div>
      </footer>
    </>
  );
}

function ScoreCell({
  metric,
  risk,
}: {
  metric: DisplayMetric | null;
  risk: ReturnType<typeof scoreToLevel>;
}) {
  if (!metric) {
    return (
      <div className="score-cell">
        <div className={`risk-tag ${risk.className}`}>{risk.label}</div>
        <div className="score-note">Aucune donnée exploitable</div>
      </div>
    );
  }

  return (
    <div className="score-cell">
      <div className={`risk-tag ${risk.className}`}>Risque {risk.label}</div>
      <div className="score-bar-wrap">
        <div
          className="score-bar"
          style={{ width: `${Math.max(0, Math.min(100, metric.score ?? 0))}%`, background: risk.bar }}
        />
      </div>
      <div className="score-label">{metric.label}</div>
      <div className="score-note">{metric.note}</div>
    </div>
  );
}
