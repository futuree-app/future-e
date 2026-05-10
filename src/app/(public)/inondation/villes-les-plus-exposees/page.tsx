import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getClimatDataCommune } from '@/lib/drias-json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Top 10 des villes françaises les plus exposées aux inondations · futur•e',
  description:
    'Nîmes, Nice, Perpignan, Grenoble : classement des 10 villes françaises les plus exposées aux inondations fluviales et pluviales, avec les données DRIAS Météo-France et Géorisques.',
  openGraph: {
    title: 'Top 10 des villes françaises les plus exposées aux inondations',
    description: 'Crues fluviales, épisodes cévenols, rivières torrentielles : les 10 villes françaises les plus exposées selon les projections DRIAS à +4°C.',
  },
};

const ACCENT = '#60a5fa';

type CandidateCity = {
  nom: string;
  insee: string;
  dept: string;
  editorial: string;
  sources: string;
};

const CANDIDATE_CITIES: CandidateCity[] = [
  {
    nom: 'Nîmes',
    insee: '30189',
    dept: 'Gard (30)',
    editorial: "Nîmes est la capitale française des inondations soudaines. En octobre 1988, 160 mm de pluie sont tombés en moins de 6 heures, tuant 11 personnes et dévastant le centre-ville. En septembre 2002, c'est tout le département du Gard qui a été inondé en une nuit : 23 morts, un milliard d'euros de dégâts. Ce type d'événement, appelé épisode cévenol, est causé par des masses d'air chaud et humide venant de Méditerranée qui se bloquent contre les Cévennes et lâchent des volumes d'eau colossaux en quelques heures. Les projections Météo-France indiquent que ces épisodes gagneront en intensité d'ici 2050.",
    sources: 'Géorisques GASPAR, Météo-France, plan de prévention du risque inondation Nîmes, DRIAS',
  },
  {
    nom: 'Nice',
    insee: '06088',
    dept: 'Alpes-Maritimes (06)',
    editorial: "Nice a connu la pire catastrophe naturelle récente de France métropolitaine. En octobre 2015, des pluies torrentielles ont tué 20 personnes en une seule nuit sur la Côte d'Azur. La géographie de la région explique tout : des reliefs alpins très proches de la mer forcent les nuages à précipiter brutalement sur un territoire étroit et densément peuplé. Les rivières côtières (le Paillon à Nice, le Var, la Siagne) passent de presque à sec à des crues violentes en quelques heures. Ce délai quasi nul ne laisse pas le temps d'évacuer.",
    sources: 'Géorisques GASPAR, Cerema, plan de prévention du risque inondation Alpes-Maritimes, Météo-France',
  },
  {
    nom: 'Perpignan',
    insee: '66136',
    dept: 'Pyrénées-Orientales (66)',
    editorial: "Perpignan est traversée par la Têt, l'Agly et le Tech, trois cours d'eau pyrénéens qui montent très vite lors des pluies intenses. Les précipitations extrêmes enregistrées autour de Perpignan figurent parmi les plus élevées de notre classement. En octobre 2020, des pluies record ont inondé plusieurs communes des Pyrénées-Orientales. En 1940, une catastrophe sur la Têt avait causé des centaines de morts dans la région. Quand un flux humide du sud se bloque contre les Pyrénées, le département peut recevoir 200 à 400 mm de pluie en 24 heures, soit plusieurs mois de précipitations habituelles.",
    sources: 'Géorisques GASPAR, plan de prévention du risque inondation de la Têt, Météo-France, DRIAS',
  },
  {
    nom: 'Toulon',
    insee: '83137',
    dept: 'Var (83)',
    editorial: "En juin 2010, 350 mm de pluie sont tombés en 24 heures dans le Var, soit l'équivalent de six mois de précipitations habituelles. 25 personnes sont mortes, dont plusieurs emportées par les crues à Draguignan. La région toulonnaise est exposée au même risque : des rivières côtières à régime torrentiel (le Gapeau, le Roubaud, le Las) qui passent en quelques heures d'un filet d'eau à des torrents dévastateurs. La rapidité de la montée des eaux est le danger principal : le temps d'alerte est souvent trop court pour évacuer.",
    sources: 'Géorisques GASPAR, plan de prévention du risque inondation Var, Cerema, DRIAS Météo-France',
  },
  {
    nom: 'Montpellier',
    insee: '34172',
    dept: 'Hérault (34)',
    editorial: "Montpellier est traversée par trois cours d'eau qui débordent lors des épisodes méditerranéens intenses : le Lez, la Mosson et le Verdanson. Les inondations de 2003 ont mis sous eau plusieurs quartiers de la ville. Le problème s'aggrave parce que Montpellier est la métropole française qui a le plus grandi ces 30 ans : des milliers d'hectares de sols imperméabilisés, moins d'eau qui s'infiltre dans la terre, plus de ruissellement lors des pluies intenses. La Métropole a identifié 30 000 habitants vivant dans des zones à risque d'inondation.",
    sources: 'Géorisques, Montpellier Métropole, plan de prévention du risque inondation du Lez, DRIAS Météo-France',
  },
  {
    nom: 'Grenoble',
    insee: '38185',
    dept: 'Isère (38)',
    editorial: "Grenoble est construite au fond d'une cuvette entourée par trois massifs : Belledonne, la Chartreuse et le Vercors. Lors des épisodes pluvieux intenses, l'eau de ces reliefs converge vers la ville via l'Isère et le Drac, deux cours d'eau qui se rejoignent à 2 km du centre-ville. Le service géologique de l'État (BRGM) a classé Grenoble parmi les villes françaises les plus exposées aux inondations par débordement de rivières. La Métropole a investi plus de 300 millions d'euros depuis 20 ans pour renforcer ses digues.",
    sources: 'BRGM, Géorisques GASPAR, plan de prévention du risque inondation de l\'Isère, Grenoble Alpes Métropole',
  },
  {
    nom: 'Avignon',
    insee: '84007',
    dept: 'Vaucluse (84)',
    editorial: "Avignon est doublement exposée : le Rhône à l'ouest, la Durance au sud. Ces deux fleuves se rejoignent à une dizaine de kilomètres en amont de la ville. En novembre 2003, les crues du Rhône ont submergé des dizaines de communes autour d'Avignon, causant plus d'un milliard d'euros de dégâts dans le Vaucluse. La frange ouest des remparts est classée en zone rouge du plan de prévention du risque inondation du Rhône : aucune construction nouvelle n'y est autorisée.",
    sources: 'Géorisques GASPAR, plan de prévention du risque inondation du Rhône Avignon, Cerema, DRIAS',
  },
  {
    nom: 'Carcassonne',
    insee: '11069',
    dept: 'Aude (11)',
    editorial: "En octobre 2018, des crues de l'Aude ont tué 15 personnes dans le département, la catastrophe naturelle la plus meurtrière en France depuis 2010. Carcassonne est construite en deux parties : la Cité médiévale sur la hauteur (protégée) et la ville basse le long de l'Aude, en zone inondable. Lors de la crue de 2018, certains secteurs de la ville basse ont été submergés sous deux mètres d'eau. Les projections Météo-France indiquent que ce type d'événement, autrefois rare, pourrait se produire deux à trois fois plus souvent d'ici la fin du siècle.",
    sources: 'Géorisques GASPAR, plan de prévention du risque inondation de l\'Aude, Météo-France, Cerema',
  },
  {
    nom: 'Bayonne',
    insee: '64102',
    dept: 'Pyrénées-Atlantiques (64)',
    editorial: "Bayonne est au confluent de l'Adour et de la Nive. En décembre 2014 et en janvier 2021, les deux rivières ont débordé simultanément, inondant le centre historique. Ce qui rend Bayonne particulièrement vulnérable, c'est la possibilité d'un troisième facteur : une forte tempête atlantique peut bloquer l'écoulement des eaux vers l'océan, aggravant les inondations fluviales. Avec plus de 1 200 mm de pluie par an, Bayonne est aussi l'une des villes de plaine les plus arrosées de France.",
    sources: 'Géorisques GASPAR, plan de prévention du risque inondation de l\'Adour, Cerema, BRGM littoral, DRIAS',
  },
  {
    nom: 'Marseille',
    insee: '13201',
    dept: 'Bouches-du-Rhône (13)',
    editorial: "Marseille est régulièrement frappée par des inondations soudaines. L'Huveaune, qui traverse les quartiers est et sud, déborde lors des épisodes méditerranéens intenses. En octobre 2023, des pluies torrentielles ont causé des inondations dans plusieurs arrondissements et interrompu le trafic ferroviaire pendant plusieurs jours. Le centre-ville est imperméabilisé à plus de 90 % selon Aix-Marseille Métropole : presque toute la pluie qui tombe ruisselle directement dans les rues plutôt que de s'infiltrer dans le sol, ce qui amplifie chaque épisode pluvieux intense.",
    sources: 'Géorisques, plan de prévention du risque inondation de l\'Huveaune, Aix-Marseille Métropole, DRIAS',
  },
];

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.18;pointer-events:none;z-index:0;animation:breathe 16s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.1) translate(10px,-16px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .page{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:72px 28px 120px;}
  .eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:18px;display:flex;align-items:center;gap:10px;}
  .eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:${ACCENT};box-shadow:0 0 10px ${ACCENT};flex-shrink:0;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(32px,5vw,54px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 20px;color:var(--fg-1);}
  h1 em{font-style:italic;color:${ACCENT};}
  .lede{font-size:17px;color:var(--fg-3);margin:0 0 16px;line-height:1.75;max-width:680px;}
  .method-note{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.7;margin:0 0 64px;max-width:680px;padding:14px 18px;border-left:2px solid rgba(255,255,255,0.08);}

  .city-item{padding:36px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
  .city-item:last-child{border-bottom:none;}
  .city-header{display:flex;align-items:center;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
  .city-rank{font-family:var(--font-serif);font-size:clamp(38px,5vw,58px);font-weight:400;color:${ACCENT};opacity:0.22;line-height:1;letter-spacing:-0.04em;flex-shrink:0;min-width:52px;}
  .city-info{flex:1;}
  .city-name{font-family:var(--font-serif);font-size:clamp(22px,3vw,30px);font-weight:400;color:var(--fg-1);line-height:1.1;}
  .city-dept{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);margin-top:3px;}
  .city-score-block{text-align:right;flex-shrink:0;}
  .city-score-num{font-family:var(--font-serif);font-size:clamp(32px,4vw,48px);font-weight:400;color:${ACCENT};line-height:1;letter-spacing:-0.02em;}
  .city-score-label{font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-top:2px;}

  .city-stats{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
  .city-stat{padding:12px 16px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:3px;}
  .city-stat-label{font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);}
  .city-stat-value{font-family:var(--font-serif);font-size:20px;color:${ACCENT};line-height:1;}
  .city-stat-unit{font-size:0.55em;color:var(--fg-4);}

  .city-editorial{font-size:15px;color:var(--fg-3);line-height:1.8;margin:0 0 12px;}
  .city-sources{font-family:var(--font-mono);font-size:10px;color:var(--fg-4);}
  .city-link{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};text-decoration:none;margin-top:10px;opacity:0.8;transition:opacity 0.2s;}
  .city-link:hover{opacity:1;}

  .cta-block{margin-top:72px;display:flex;flex-direction:column;gap:14px;}
  .cta-rapport{padding:32px 36px;border-radius:12px;background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.2);display:flex;flex-direction:column;gap:10px;}
  .cta-rapport-title{font-family:var(--font-serif);font-size:22px;font-weight:400;color:var(--fg-1);line-height:1.3;}
  .cta-rapport-desc{font-size:14px;color:var(--fg-3);line-height:1.65;max-width:560px;}
  .cta-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;}
  .cta-btn{display:inline-flex;align-items:center;padding:11px 22px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;}
  .cta-sec{display:inline-flex;align-items:center;padding:11px 20px;border:1px solid rgba(96,165,250,0.28);color:${ACCENT};font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-decoration:none;border-radius:6px;transition:border-color 0.2s;}
  .cta-sec:hover{border-color:rgba(96,165,250,0.5);}

  .divider{height:1px;background:rgba(255,255,255,0.06);margin:64px 0;}
  .page-footer{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:28px 28px 56px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:680px){
    .page{padding:48px 20px 80px;}
    .city-header{gap:14px;}
    .cta-rapport{padding:22px;}
  }
`;

type DriasV = Record<string, number | undefined>;

function computeScore(v: DriasV | null): number {
  if (!v) return 0;
  const parts: { w: number; v: number }[] = [];
  if (v.NORRRq99_yr != null)    parts.push({ w: 3,   v: Math.min(100, (v.NORRRq99_yr / 150) * 100) });
  if (v.NORRR_seas_DJF != null) parts.push({ w: 1,   v: Math.min(100, (v.NORRR_seas_DJF / 500) * 100) });
  if (v.NORRR_yr != null)       parts.push({ w: 0.5, v: Math.min(100, (v.NORRR_yr / 2000) * 100) });
  if (v.NORRx1d_yr != null)     parts.push({ w: 0.5, v: Math.min(100, (v.NORRx1d_yr / 7) * 100) });
  if (parts.length === 0) return 0;
  const totalW = parts.reduce((s, p) => s + p.w, 0);
  return Math.round(parts.reduce((s, p) => s + (p.v * p.w) / totalW, 0));
}

export default async function InondationTop10() {
  const driasResults = await Promise.all(
    CANDIDATE_CITIES.map(async (c) => {
      try {
        const data = await getClimatDataCommune(c.insee);
        return (data?.commune?.s?.gwl30?.v as DriasV) ?? null;
      } catch {
        return null;
      }
    }),
  );

  const cities = CANDIDATE_CITIES
    .map((city, i) => ({
      ...city,
      driasV: driasResults[i],
      score: computeScore(driasResults[i]),
    }))
    .sort((a, b) => b.score - a.score)
    .map((city, i) => ({ ...city, rank: i + 1 }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="orb" style={{ width: 560, height: 560, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -200, left: -180 }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'radial-gradient(circle,#818cf8 0%,transparent 70%)', bottom: -60, right: -80, animationDelay: '-8s', opacity: 0.11 }} />

      <Navbar />

      <main className="page">
        <div className="eyebrow">Inondation · Classement 2050</div>
        <h1>
          Les 10 villes françaises<br />
          les plus exposées aux <em>inondations</em>
        </h1>
        <p className="lede">
          Crues de rivières, épisodes de pluies extrêmes, ruissellement dans les rues : les dix villes françaises les plus exposées aux inondations, selon les projections Météo-France à l'horizon 2050 dans un scénario de réchauffement de 4°C.
        </p>
        <div className="method-note">
          Comment lire ce classement. Le score combine quatre indicateurs climatiques : l'intensité des pluies les plus fortes de l'année (pondération principale, car c'est elle qui cause les catastrophes documentées), les précipitations en hiver qui font déborder les rivières, le volume de pluie annuel qui sature les sols, et l'évolution des pluies extrêmes par rapport à aujourd'hui. Les données viennent de DRIAS Météo-France, scénario à +4°C. La submersion marine est un risque différent : elle fait l'objet d'un classement séparé.
        </div>

        {cities.map((city) => {
          const v = city.driasV;
          const precQ99 = v?.NORRRq99_yr != null ? Math.round(v.NORRRq99_yr) : null;
          const precHiver = v?.NORRR_seas_DJF != null ? Math.round(v.NORRR_seas_DJF) : null;
          const precAnnuel = v?.NORRR_yr != null ? Math.round(v.NORRR_yr) : null;

          return (
            <div key={city.insee} className="city-item">
              <div className="city-header">
                <div className="city-rank">{String(city.rank).padStart(2, '0')}</div>
                <div className="city-info">
                  <div className="city-name">{city.nom}</div>
                  <div className="city-dept">{city.dept}</div>
                </div>
                {city.score > 0 && (
                  <div className="city-score-block">
                    <div className="city-score-num">{city.score}<span style={{ fontSize: '0.4em', color: 'var(--fg-4)' }}>/100</span></div>
                    <div className="city-score-label">Score tension</div>
                  </div>
                )}
              </div>

              {(precQ99 != null || precHiver != null || precAnnuel != null) && (
                <div className="city-stats">
                  {precQ99 != null && (
                    <div className="city-stat">
                      <div className="city-stat-label">Pluies les plus fortes</div>
                      <div className="city-stat-value">{precQ99}<span className="city-stat-unit"> mm/j</span></div>
                    </div>
                  )}
                  {precHiver != null && (
                    <div className="city-stat">
                      <div className="city-stat-label">Pluies en hiver</div>
                      <div className="city-stat-value">{precHiver}<span className="city-stat-unit"> mm</span></div>
                    </div>
                  )}
                  {precAnnuel != null && (
                    <div className="city-stat">
                      <div className="city-stat-label">Pluies par an</div>
                      <div className="city-stat-value">{precAnnuel}<span className="city-stat-unit"> mm</span></div>
                    </div>
                  )}
                </div>
              )}

              <p className="city-editorial">{city.editorial}</p>
              <div className="city-sources">Sources : {city.sources}</div>
              <Link href={`/inondation/${city.insee}`} className="city-link">
                Données complètes pour {city.nom} →
              </Link>
            </div>
          );
        })}

        <div className="divider" />

        <div className="cta-block">
          <div className="cta-rapport">
            <div className="cta-rapport-title">Votre commune est-elle exposée ?</div>
            <p className="cta-rapport-desc">
              Ces dix villes concentrent les risques les plus élevés, mais le risque d'inondation existe dans des milliers de communes françaises. Cherchez la vôtre pour voir son niveau d'exposition, puis construisez votre rapport personnalisé.
            </p>
            <div className="cta-links">
              <Link href="/rapport" className="cta-btn">Créer mon rapport →</Link>
              <Link href="/inondation" className="cta-sec">Explorer par commune</Link>
              <Link href="/comparateur" className="cta-sec">Comparer deux villes</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <div>futur•e · Inondation · Top 10 villes les plus exposées</div>
        <div>
          <Link href="/inondation">← Toutes les communes</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
