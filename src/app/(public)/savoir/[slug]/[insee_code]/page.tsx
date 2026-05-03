import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { getClimatDataCommune } from '@/lib/drias-json';
import { getGeorisquesSummary } from '@/lib/georisques';
import { getAtmoForCommune } from '@/lib/atmo';
import { getEaufranceSummary } from '@/lib/eaufrance';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

// ─── Hub registry (dupliqué pour éviter l'import circulaire) ─────────────────
const SAVOIR_HUBS: Record<string, { thematique: string; categorie: string; accent: string }> = {
  canicule: { thematique: 'Canicule', categorie: 'Climat', accent: '#f87171' },
  submersion: { thematique: 'Submersion', categorie: 'Climat', accent: '#60a5fa' },
  feux: { thematique: 'Feux de forêt', categorie: 'Climat', accent: '#fb923c' },
  cadmium: { thematique: 'Cadmium', categorie: 'Santé', accent: '#a78bfa' },
  'dependance-auto': { thematique: 'Dépendance automobile', categorie: 'Mobilité', accent: '#fb923c' },
  pollens: { thematique: 'Pollens', categorie: 'Santé', accent: '#4ade80' },
};

// ─── Supabase helpers ────────────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

type CommuneDetail = {
  insee_code: string;
  nom_commune: string;
  code_postal: string;
  departement: string | null;
  score: number;
  ind_exposition: number | null;
  ind_vulnerabilite: number | null;
  ind_adaptation: number | null;
  ind_occurrence: number | null;
};

const fetchCommuneDetail = unstable_cache(
  async (slug: string, insee_code: string): Promise<CommuneDetail | null> => {
    const { data, error } = await getSupabase()
      .from('communes_tension')
      .select(
        'insee_code, nom_commune, code_postal, departement, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence',
      )
      .eq('slug', slug)
      .eq('insee_code', insee_code)
      .maybeSingle();

    if (error) {
      console.error('[CommunePage] Supabase error:', error.message);
      return null;
    }
    return data;
  },
  ['commune-detail'],
  { revalidate: 86400, tags: ['communes-tension'] },
);

// Fetch top 50 communes per slug for generateStaticParams
const fetchTop50ForSlug = unstable_cache(
  async (slug: string): Promise<{ insee_code: string }[]> => {
    const { data } = await getSupabase()
      .from('communes_tension')
      .select('insee_code')
      .eq('slug', slug)
      .order('score', { ascending: false })
      .limit(50);
    return data ?? [];
  },
  ['top50-insee-codes'],
  { revalidate: 86400 },
);

// ─── generateStaticParams ────────────────────────────────────────────────────
// Pré-génère les 50 communes les plus critiques pour chaque risque connu.
export async function generateStaticParams() {
  const params: { slug: string; insee_code: string }[] = [];

  await Promise.all(
    Object.keys(SAVOIR_HUBS).map(async (slug) => {
      const communes = await fetchTop50ForSlug(slug);
      communes.forEach(({ insee_code }) => {
        params.push({ slug, insee_code });
      });
    }),
  );

  return params;
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; insee_code: string }>;
}): Promise<Metadata> {
  const { slug, insee_code } = await params;
  const hub = SAVOIR_HUBS[slug];
  const commune = await fetchCommuneDetail(slug, insee_code);

  if (!hub || !commune) {
    return { title: 'Commune · futur•e' };
  }

  const title = `Risque ${hub.thematique} à ${commune.nom_commune} (${commune.code_postal}) : Analyse et Prévention`;
  const description = `Score de tension ${hub.thematique.toLowerCase()} : ${commune.score}/100. Exposition, vulnérabilité, capacité d'adaptation et occurrence historique à ${commune.nom_commune}.`;

  return {
    title: `${title} · futur•e`,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.28;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(18px,-28px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .nav-crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--fg-3);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--fg-1);}
  .nav-crumb .sep{margin:0 10px;color:var(--fg-4);}
  .page{position:relative;z-index:2;max-width:800px;margin:0 auto;padding:64px 28px 120px;}
  .article-meta{display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(28px,4vw,48px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fg-1);}
  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(22px,2.5vw,30px);line-height:1.2;letter-spacing:-0.01em;margin:48px 0 18px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:14px;width:14px;height:1px;}
  h3{font-family:var(--font-sans);font-weight:500;font-size:15px;color:var(--fg-3);letter-spacing:0.06em;text-transform:uppercase;margin:0 0 12px;}
  p{margin:0 0 18px;color:var(--fg-1);font-size:16px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}
  .glass-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.14);border-radius:10px;}
  .indicators-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:40px 0;}
  .indicator-card{padding:24px 22px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10);}
  .indicator-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-bottom:12px;}
  .indicator-bar-track{width:100%;height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin-bottom:8px;}
  .indicator-value{font-family:var(--font-serif);font-size:36px;font-weight:400;line-height:1;margin-bottom:4px;}
  .indicator-desc{font-size:12px;color:var(--fg-3);line-height:1.5;}
  .score-hero{margin:0 0 48px;padding:36px;border-radius:12px;position:relative;overflow:hidden;}
  .score-hero::after{content:"";position:absolute;top:-40px;right:-40px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,var(--hero-accent-soft,rgba(248,113,113,0.15)) 0%,transparent 70%);pointer-events:none;}
  .score-number{font-family:var(--font-serif);font-size:clamp(64px,10vw,96px);line-height:1;font-weight:400;letter-spacing:-0.03em;position:relative;z-index:1;}
  .score-label{font-family:var(--font-mono);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-3);margin-top:8px;position:relative;z-index:1;}
  .score-context{margin-top:16px;font-size:14px;color:var(--fg-3);position:relative;z-index:1;}
  .back-link{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;color:var(--fg-4);margin-bottom:36px;transition:color 0.2s;}
  .back-link:hover{color:var(--fg-3);}
  .page-footer{position:relative;z-index:2;max-width:800px;margin:0 auto;padding:32px 28px 64px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--fg-3);text-decoration:none;}
  @media(max-width:768px){
    .page{padding:40px 20px 80px;}
    h1{font-size:26px;}
    h2{font-size:22px;}
    h2::before{display:none;}
    .indicators-grid{grid-template-columns:1fr;}
    .score-hero{padding:24px;}
    .nav-inner{padding:14px 20px;}
  }
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
            <span style={{ fontSize: '0.5em', color: '#6b7388' }}>/100</span>
          </div>
          <div className="indicator-bar-track">
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: accent,
                borderRadius: '3px',
                transition: 'width 0.6s ease',
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

function buildGeorisquesHighlights(
  riskLabels: string[],
  seismicLabel: string | null,
) {
  const highlights = riskLabels.slice(0, 4);

  if (highlights.length === 0 && seismicLabel) {
    return [seismicLabel];
  }

  if (seismicLabel && !highlights.includes(seismicLabel)) {
    highlights.push(seismicLabel);
  }

  return highlights;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function CommunePage({
  params,
}: {
  params: Promise<{ slug: string; insee_code: string }>;
}) {
  const { slug, insee_code } = await params;
  const hub = SAVOIR_HUBS[slug];
  const commune = await fetchCommuneDetail(slug, insee_code);

  if (!hub || !commune) {
    return (
      <div style={{ padding: '40px', color: '#e9ecf2', fontFamily: 'system-ui' }}>
        Commune introuvable.{' '}
        <Link href={`/savoir/${slug}`} style={{ color: '#f87171' }}>
          Retour au hub
        </Link>
      </div>
    );
  }

  // Auth check
  const { user } = await getCurrentSessionUser();
  const hasFullAccess = user != null;

  // Données DRIAS réelles pour enrichir le contenu paywallé
  const driasData = hasFullAccess
    ? await getClimatDataCommune(commune.insee_code)
    : null;
  const georisques = await getGeorisquesSummary(commune.insee_code).catch(() => null);
  const atmo = process.env.ATMO_USERNAME
    ? await getAtmoForCommune(commune.insee_code).catch(() => null)
    : null;
  const eaufrance = await getEaufranceSummary(commune.insee_code).catch(() => null);

  const dept = commune.departement ?? commune.insee_code.slice(0, 2);
  const h1 = `Risque ${hub.thematique} à ${commune.nom_commune} (Dept. ${dept}) : Analyse et Prévention`;

  const INDICATORS = [
    {
      key: 'ind_exposition' as const,
      label: 'Exposition',
      description: "Niveau d'exposition physique du territoire au risque selon les données géographiques et climatiques.",
    },
    {
      key: 'ind_vulnerabilite' as const,
      label: 'Vulnérabilité',
      description: 'Fragilité socio-économique des habitants face aux impacts du risque (revenus, âge, isolement).',
    },
    {
      key: 'ind_adaptation' as const,
      label: "Capacité d'adaptation",
      description: 'Ressources locales disponibles pour faire face au risque (équipements, services, politiques).',
    },
    {
      key: 'ind_occurrence' as const,
      label: 'Occurrence historique',
      description: 'Fréquence et intensité des événements liés à ce risque sur les 30 dernières années.',
    },
  ];

  // HTML visible par tous (4 indicateurs de tension + infos de base)
  const previewHtml = `
    <div class="article-meta">
      <span class="tag" style="background:${hub.accent}1a;border:1px solid ${hub.accent}40;color:${hub.accent};">
        ${hub.categorie}
      </span>
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;">
        ${commune.departement ?? ''}
      </span>
    </div>

    <h1>${h1}</h1>
  `;

  // Données DRIAS réelles (scénario gwl20, horizon 2050)
  const driasGwl20 = driasData?.commune?.s?.gwl20;
  const driasValues = driasGwl20?.v;
  const georisquesHighlights = buildGeorisquesHighlights(
    georisques?.riskLabels ?? [],
    georisques?.seismic?.label ?? null,
  );

  const fullHtml = `
    <h2 style="--accent:${hub.accent}">Projections climatiques DRIAS 2050</h2>
    <p>
      Les données suivantes sont issues des modèles DRIAS (CNRS / Météo-France), scénario
      <strong>GWL2.0</strong> (+2°C, horizon 2050), pour la commune de
      <strong>${commune.nom_commune}</strong>.
    </p>

    ${driasValues ? `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0;">
      ${[
        ['Jours Tmax ≥ 30°C / an', driasValues.NORTX30D_yr, 'jours'],
        ['Jours Tmax ≥ 35°C / an', driasValues.NORTX35D_yr, 'jours'],
        ['Nuits tropicales / an', driasValues.NORTR_yr, 'nuits'],
        ['T° moy. été (JJA)', driasValues.NORTMm_seas_JJA, '°C'],
      ].map(([label, val, unit]) => val != null ? `
        <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">${label}</div>
          <div style="font-family:'Instrument Serif',serif;font-size:32px;line-height:1;color:${hub.accent};font-weight:400;">${typeof val === 'number' ? val.toFixed(1) : val} <span style="font-size:0.45em;color:#6b7388;">${unit}</span></div>
        </div>
      ` : '').join('')}
    </div>
    ` : `
    <p style="color:#6b7388;font-style:italic;">Données DRIAS indisponibles pour cette commune.</p>
    `}

    <h2 style="--accent:${hub.accent}">Risques officiels Géorisques</h2>
    <p>
      Cette lecture repose sur les signaux officiels Géorisques / GASPAR à l&apos;échelle de la
      <strong> commune</strong>. Elle ne remplace pas une vérification à l&apos;adresse pour un logement précis.
    </p>

    ${georisques ? `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0;">
      <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">Lecture communale</div>
        <div style="font-family:'Instrument Serif',serif;font-size:30px;line-height:1.1;color:${hub.accent};font-weight:400;">${georisquesHighlights[0] ?? 'Aucun risque communal remonté'}</div>
        <div style="margin-top:8px;font-size:12px;line-height:1.6;color:#9ba3b4;">Résumé officiel par commune.</div>
      </div>
      <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">Sismicité</div>
        <div style="font-family:'Instrument Serif',serif;font-size:30px;line-height:1.1;color:${hub.accent};font-weight:400;">${georisques.seismic?.label ?? 'Non renseignée'}</div>
        <div style="margin-top:8px;font-size:12px;line-height:1.6;color:#9ba3b4;">${georisques.seismic?.code ? `Code zone ${georisques.seismic.code}` : 'Pas de code de zone disponible'}</div>
      </div>
    </div>
    ${
      georisquesHighlights.length > 0
        ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:-4px;">
            ${georisquesHighlights
              .map(
                (label) => `<span style="display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.04em;color:#c6cfdb;">${label}</span>`,
              )
              .join('')}
          </div>`
        : ''
    }
    ` : `
    <p style="color:#6b7388;font-style:italic;">Résumé Géorisques indisponible pour cette commune.</p>
    `}

    <h2 style="--accent:${hub.accent}">Qualité de l&apos;air (ATMO)</h2>
    <p>
      Indice ATMO officiel pour la commune de <strong>${commune.nom_commune}</strong>,
      publié quotidiennement par les associations agréées de surveillance de la qualité de l&apos;air.
    </p>

    ${atmo ? `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0;">
      <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">Indice ATMO · ${atmo.date}</div>
        <div style="font-family:'Instrument Serif',serif;font-size:36px;line-height:1;color:${atmo.index.color};font-weight:400;">${atmo.index.label}</div>
        <div style="margin-top:8px;font-size:12px;color:#9ba3b4;">Niveau ${atmo.index.value}/6</div>
      </div>
      <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">Polluants principaux</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
          ${[
            ['NO₂', atmo.pollutants.no2],
            ['O₃', atmo.pollutants.o3],
            ['PM10', atmo.pollutants.pm10],
            ['PM2.5', atmo.pollutants.pm25],
          ].filter(([, v]) => v != null).map(([name, lvl]) => {
            const l = lvl as { label: string; color: string };
            return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
              <span style="color:#6b7388;font-family:'JetBrains Mono',monospace;">${name}</span>
              <span style="color:${l.color};">${l.label}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    ` : `
    <p style="color:#6b7388;font-style:italic;">Indice ATMO indisponible pour cette commune.</p>
    `}

    <h2 style="--accent:${hub.accent}">Eau potable &amp; ressource locale</h2>
    <p>
      Données Hub'Eau (Eaufrance) pour <strong>${commune.nom_commune}</strong> —
      qualité bactériologique, physico-chimique et signal de sécheresse sur les cours d'eau.
    </p>

    ${eaufrance?.drinkingWater ? `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0;">
      <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">Eau potable · bactério</div>
        <div style="font-family:'Instrument Serif',serif;font-size:30px;line-height:1.1;color:${eaufrance.drinkingWater.conformBacterio === false ? '#f87171' : '#4ade80'};font-weight:400;">
          ${eaufrance.drinkingWater.conformBacterio === false ? 'Non conforme' : eaufrance.drinkingWater.conformBacterio === true ? 'Conforme' : 'N/D'}
        </div>
        <div style="margin-top:8px;font-size:12px;color:#9ba3b4;">
          ${eaufrance.drinkingWater.lastSampleDate ? `Dernier prélèvement : ${eaufrance.drinkingWater.lastSampleDate}` : 'Date indisponible'}
        </div>
      </div>
      <div style="padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">Nitrates / Nitrites</div>
        <div style="font-family:'Instrument Serif',serif;font-size:30px;line-height:1.1;color:${(eaufrance.drinkingWater.nitrates ?? 0) > 50 ? '#f87171' : (eaufrance.drinkingWater.nitrates ?? 0) > 25 ? '#facc15' : '#4ade80'};font-weight:400;">
          ${eaufrance.drinkingWater.nitrates != null ? `${eaufrance.drinkingWater.nitrates} mg/L` : 'N/D'}
        </div>
        <div style="margin-top:8px;font-size:12px;color:#9ba3b4;">
          Seuil réglementaire : 50 mg/L${eaufrance.drinkingWater.nitrites != null ? ` · Nitrites : ${eaufrance.drinkingWater.nitrites} mg/L` : ''}
        </div>
      </div>
    </div>
    ` : ''}

    ${eaufrance?.drought ? `
    <div style="margin-top:${eaufrance.drinkingWater ? '0' : '24px'};padding:16px 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:8px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7388;margin-bottom:8px;">
        Cours d'eau local${eaufrance.drought.riverName ? ` · ${eaufrance.drought.riverName}` : ''}
      </div>
      <div style="font-size:14px;color:${eaufrance.drought.isDry ? '#f87171' : '#9ba3b4'};">
        ${eaufrance.drought.status ?? 'Observation disponible'}${eaufrance.drought.lastObservationDate ? ` — ${eaufrance.drought.lastObservationDate}` : ''}
      </div>
    </div>
    ` : !eaufrance?.drinkingWater ? `
    <p style="color:#6b7388;font-style:italic;">Données Eaufrance indisponibles pour cette commune.</p>
    ` : ''}

    <h2 style="--accent:${hub.accent}">Analyse territoriale et comparaison</h2>
    <p>
      ${commune.nom_commune} se situe dans le département ${dept}.
      Votre abonnement Suivi vous donne accès à une comparaison avec les communes voisines
      et aux recommandations personnalisées selon votre situation.
    </p>

    <h2 style="--accent:${hub.accent}">Recommandations pour les habitants</h2>
    <p>
      Chaque plan d'action est personnalisé selon le profil de risque de votre commune et
      votre situation personnelle. Il intègre les dispositifs d'aide locaux et nationaux
      disponibles en 2026.
    </p>
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Orbs */}
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
          width: '380px',
          height: '380px',
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
            futur
            <span style={{ color: hub.accent, fontStyle: 'normal' }}>•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/savoir">Savoir</Link>
            <span className="sep">/</span>
            <Link href={`/savoir/${slug}`}>{hub.thematique}</Link>
            <span className="sep">/</span>
            {commune.nom_commune}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="page">
        {/* Back */}
        <Link className="back-link" href={`/savoir/${slug}`}>
          ← Retour au hub {hub.thematique}
        </Link>

        {/* Score hero */}
        <div
          className="score-hero glass-card"
          style={
            {
              '--hero-accent-soft': `${hub.accent}26`,
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div
                className="score-number"
                style={{ color: hub.accent }}
              >
                {commune.score}
              </div>
              <div className="score-label">Score de tension / 100</div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: hub.accent,
                  marginBottom: '6px',
                }}
              >
                Risque {hub.thematique}
              </div>
              <div
                style={{
                  fontSize: '22px',
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
                  fontSize: '13px',
                  color: '#6b7388',
                  marginTop: '4px',
                }}
              >
                {commune.code_postal}
                {commune.departement ? ` · ${commune.departement}` : ''}
                {' · '}INSEE {commune.insee_code}
              </div>
            </div>
          </div>

          <div className="score-context">
            Score calculé sur 4 indicateurs · Données sources officielles · Mis à jour quotidiennement
          </div>
        </div>

        {/* 4 indicateurs — visibles pour tous */}
        <h2 style={{ ['--accent' as string]: hub.accent }}>
          Les 4 indicateurs de tension
        </h2>
        <p style={{ color: '#9ba3b4', marginBottom: '24px' }}>
          Ces indicateurs sont accessibles librement. Ils synthétisent les données publiques
          disponibles pour {commune.nom_commune} sur le risque {hub.thematique.toLowerCase()}.
        </p>

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

        {/* PaywallGate pour l'analyse détaillée */}
        <PaywallGate
          hasFullAccess={hasFullAccess}
          previewHtml={previewHtml}
          fullHtml={fullHtml}
          accent={hub.accent}
        />

        {/* Maillage interne — SEO */}
        <nav
          style={{
            marginTop: '64px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-label="Navigation thématique"
        >
          <h3>Explorer d&apos;autres risques pour {commune.nom_commune}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
            {Object.entries(SAVOIR_HUBS)
              .filter(([s]) => s !== slug)
              .map(([s, h]) => (
                <Link
                  key={s}
                  href={`/savoir/${s}/${commune.insee_code}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '100px',
                    color: '#9ba3b4',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontFamily: "'Instrument Sans', system-ui, sans-serif",
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                >
                  {h.thematique}
                </Link>
              ))}
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link
              href={`/savoir/${slug}`}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: hub.accent,
                textDecoration: 'none',
                letterSpacing: '0.06em',
              }}
            >
              ← Voir toutes les communes exposées au risque {hub.thematique}
            </Link>
          </div>
        </nav>
      </main>

      <footer className="page-footer">
        <div>
          futur•e · {hub.thematique} · {commune.nom_commune}
        </div>
        <div>
          <a href="#">Méthodologie</a> · <a href="#">Signaler une erreur</a>
        </div>
      </footer>
    </>
  );
}
