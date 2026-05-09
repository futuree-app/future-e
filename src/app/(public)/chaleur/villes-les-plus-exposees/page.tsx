import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getClimatDataCommune } from '@/lib/drias-json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Top 10 des villes françaises les plus exposées à la chaleur en 2050 · futur•e',
  description:
    'Perpignan, Montpellier, Nîmes, Avignon : quelles villes françaises seront les plus touchées par la chaleur extrême en 2050 ? Les données DRIAS de Météo-France, classées et expliquées.',
  openGraph: {
    title: 'Top 10 des villes françaises les plus exposées à la chaleur en 2050',
    description: 'Les projections climatiques désignent 10 agglomérations particulièrement vulnérables. Données et explications par ville.',
  },
};

const ACCENT = '#f87171';

// Classement par score de tension canicule (Supabase communes_tension, slug='canicule')
// Scores fournis : Perpignan 91, Montpellier 87, Nîmes 87, Avignon 85, Marseille 84, Toulon 82, Nice 78, Toulouse 71, Lyon 65, Bordeaux 58
const CITIES = [
  {
    rank: 1,
    nom: 'Perpignan',
    insee: '66136',
    dept: 'Pyrénées-Orientales (66)',
    score: 91,
    editorial: "Perpignan est déjà aujourd'hui la ville la plus chaude de France métropolitaine. En 2024, elle a battu son record historique de chaleur avec 42°C. La Tramontane — le vent qui rafraîchissait traditionnellement le Roussillon — souffle de moins en moins souvent selon les mesures de Météo-France depuis 1980. Les projections DRIAS placent Perpignan en tête de toutes les villes françaises pour le nombre de jours au-dessus de 35°C d'ici 2050. Elle ne nous montre pas l'avenir : elle nous montre déjà l'avenir des villes de Montpellier et Toulouse dans 20 ans.",
    sources: 'DRIAS Météo-France, Météo-France Pyrénées-Orientales, données climatologiques 1950–2024',
  },
  {
    rank: 2,
    nom: 'Montpellier',
    insee: '34172',
    dept: 'Hérault (34)',
    score: 87,
    editorial: "Montpellier est la ville française qui a le plus grandi ces 30 dernières années. Selon l'INSEE, c'est l'agglomération dont la population a le plus augmenté de France depuis 1990. Résultat : des milliers d'hectares de garrigue et de terres agricoles ont été remplacés par du béton, ce qui amplifie l'îlot de chaleur urbain et aggrave les nuits chaudes. En 2050, les modèles DRIAS prévoient jusqu'à 70 jours par an au-dessus de 30°C à Montpellier — contre environ 40 aujourd'hui.",
    sources: 'INSEE, DRIAS Météo-France, Cerema',
  },
  {
    rank: 3,
    nom: 'Nîmes',
    insee: '30189',
    dept: 'Gard (30)',
    score: 87,
    editorial: "Nîmes est la ville française qui combine le plus fort ensoleillement avec l'absence de masse d'eau tempérante. Pas de mer à portée, pas de grand fleuve, une garrigue qui sèche dès juin. Le Gard est régulièrement le département avec le plus de jours de vigilance orange ou rouge chaleur en France. La sécheresse des sols aggrave le phénomène : la terre n'évapore plus d'eau, ce qui supprime le seul mécanisme naturel de refroidissement disponible.",
    sources: 'DRIAS Météo-France, Météo-France vigilances 2020–2024, Météo-France Gard',
  },
  {
    rank: 4,
    nom: 'Avignon',
    insee: '84007',
    dept: 'Vaucluse (84)',
    score: 85,
    editorial: "Avignon perd son principal régulateur naturel. Le mistral — le vent nord qui balayait la vallée du Rhône et rafraîchissait la ville — souffle de moins en moins souvent selon Météo-France, qui documente une baisse de sa fréquence depuis les années 1980. La pierre calcaire des remparts et du bâti médiéval stocke la chaleur dans la journée et la restitue la nuit, empêchant les habitants de récupérer. Le Vaucluse est aussi l'un des départements français avec la population la plus âgée — un facteur de vulnérabilité sanitaire majeur.",
    sources: 'DRIAS Météo-France, Météo-France rapport Mistral 2024, INSEE structure de population',
  },
  {
    rank: 5,
    nom: 'Marseille',
    insee: '13055',
    dept: 'Bouches-du-Rhône (13)',
    score: 84,
    editorial: "Marseille concentre trois problèmes à la fois. D'abord, un îlot de chaleur urbain intense documenté par le CEREMA : le centre-ville est en moyenne 5 à 7°C plus chaud que la campagne alentour. Ensuite, une pauvreté concentrée dans les quartiers nord — taux de pauvreté dépassant 40 % dans certains arrondissements selon l'INSEE — qui se traduit par moins de climatisation, des logements en moins bon état, moins d'accès aux soins. Enfin, une surmortalité lors des canicules nettement supérieure à la moyenne nationale, documentée par Santé Publique France.",
    sources: 'CEREMA, INSEE, Santé Publique France, DRIAS Météo-France',
  },
  {
    rank: 6,
    nom: 'Toulon',
    insee: '83137',
    dept: 'Var (83)',
    score: 82,
    editorial: "La rade de Toulon est une enceinte naturelle presque fermée. En été, l'air chaud et humide s'y accumule sans pouvoir s'évacuer, créant des conditions d'étuve. La mer Méditerranée, qui atteint 27 à 28°C en surface à la fin de l'été selon les données Copernicus, irradie sa chaleur la nuit et empêche les températures de descendre. Les nuits sans sommeil vont s'intensifier selon les projections DRIAS. Le Var cumule aussi le risque feux de forêt : DFCI Var classe la quasi-totalité du département en risque très élevé.",
    sources: 'DRIAS Météo-France, Copernicus SST, DFCI Var',
  },
  {
    rank: 7,
    nom: 'Nice',
    insee: '06088',
    dept: 'Alpes-Maritimes (06)',
    score: 78,
    editorial: "Nice est prise en étau entre les Alpes et la mer. En été, les masses d'air chaud et humide remontant de Méditerranée ne peuvent pas se dissiper vers le nord — bloquées par les reliefs alpins. Résultat : une chaleur moite qui s'accumule, des nuits tropicales de plus en plus fréquentes. Contrairement aux idées reçues, la proximité de la mer n'est plus un avantage en plein cœur de l'été quand la Méditerranée est à 28°C.",
    sources: 'DRIAS Météo-France, Météo-France rapport régional PACA',
  },
  {
    rank: 8,
    nom: 'Toulouse',
    insee: '31555',
    dept: 'Haute-Garonne (31)',
    score: 71,
    editorial: "Toulouse est construite au fond du bassin aquitain — une dépression géographique encadrée par les Pyrénées, le Massif Central et le plateau du Quercy. Les masses d'air chaud y stagnent en été, sans circulation. La Garonne, autrefois fraîche en juin, atteint des températures record en juillet-août. Le rapport régional de Météo-France sur l'Occitanie projette une intensification des épisodes caniculaires parmi les plus marquées de France pour Toulouse — une ville qui n'avait pas l'habitude de ces extrêmes.",
    sources: 'DRIAS Météo-France, Météo-France rapport régional Occitanie',
  },
  {
    rank: 9,
    nom: 'Lyon',
    insee: '69123',
    dept: 'Métropole de Lyon (69)',
    score: 65,
    editorial: "Lyon est la deuxième plus grande agglomération de France, et son îlot de chaleur urbain est le deuxième plus intense du pays après Paris selon le CEREMA. La confluence du Rhône et de la Saône crée un environnement humide qui amplifie la sensation de chaleur et aggrave les nuits tropicales. Ce qui change à Lyon, c'est la vitesse du changement : une ville qui avait des hivers froids voit ses étés se transformer bien plus rapidement que des villes du sud, déjà adaptées depuis des décennies.",
    sources: 'CEREMA, DRIAS Météo-France, Météo-France rapport Auvergne-Rhône-Alpes',
  },
  {
    rank: 10,
    nom: 'Bordeaux',
    insee: '33063',
    dept: 'Gironde (33)',
    score: 58,
    editorial: "Bordeaux accumule deux risques qui s'alimentent mutuellement. D'un côté, des étés de plus en plus chauds dans le bassin aquitain. De l'autre, la forêt des Landes en périphérie directe — 950 000 ha, la plus grande forêt d'Europe — classée à risque incendie très élevé. La canicule de 2022, qui a provoqué les incendies record de Gironde (26 000 ha brûlés), illustre comment la chaleur et les feux se renforcent mutuellement. La Garonne ne joue plus aucun rôle rafraîchissant : ses températures de surface ont augmenté de 1,5°C depuis 1980 selon l'OFB.",
    sources: 'DRIAS Météo-France, Prométhée, OFB, Copernicus 2022',
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
  .cta-rapport{padding:32px 36px;border-radius:12px;background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.2);display:flex;flex-direction:column;gap:10px;}
  .cta-rapport-title{font-family:var(--font-serif);font-size:22px;font-weight:400;color:var(--fg-1);line-height:1.3;}
  .cta-rapport-desc{font-size:14px;color:var(--fg-3);line-height:1.65;max-width:560px;}
  .cta-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;}
  .cta-btn{display:inline-flex;align-items:center;padding:11px 22px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;}
  .cta-sec{display:inline-flex;align-items:center;padding:11px 20px;border:1px solid rgba(248,113,113,0.28);color:${ACCENT};font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-decoration:none;border-radius:6px;transition:border-color 0.2s;}
  .cta-sec:hover{border-color:rgba(248,113,113,0.5);}

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

async function getCityData(insee: string): Promise<DriasV | null> {
  try {
    const data = await getClimatDataCommune(insee);
    return (data?.commune?.s?.gwl30?.v as DriasV) ?? null;
  } catch {
    return null;
  }
}

export default async function ChaleurTop10() {
  const cityData = await Promise.all(CITIES.map((c) => getCityData(c.insee)));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="orb" style={{ width: 560, height: 560, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -200, left: -180 }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'radial-gradient(circle,#fb923c 0%,transparent 70%)', bottom: -60, right: -80, animationDelay: '-8s', opacity: 0.11 }} />

      <Navbar />

      <main className="page">
        <div className="eyebrow">Chaleur et canicule · Classement 2050</div>
        <h1>
          Les 10 villes françaises<br />
          les plus exposées à la <em>chaleur</em>
        </h1>
        <p className="lede">
          Quelle ville française sera la plus touchée par la canicule en 2050 ?
          La réponse surprend : ce n'est pas Lyon ou Paris, mais Perpignan — déjà la ville la plus chaude du pays.
          Voici le classement complet, avec les données et les raisons spécifiques à chaque territoire.
        </p>
        <div className="method-note">
          Classement basé sur le score de tension canicule futur•e — calculé à partir des projections DRIAS de Météo-France (scénario +4°C, horizon 2050), des données d'îlots de chaleur urbains du CEREMA et des indicateurs socio-démographiques INSEE. Scénario médian sur l'ensemble des modèles climatiques régionaux.
        </div>

        {CITIES.map((city, i) => {
          const v = cityData[i];
          const joursCaleur = v?.NORTX30D_yr != null ? Math.round(v.NORTX30D_yr) : null;
          const joursCanicule = v?.NORTX35D_yr != null ? Math.round(v.NORTX35D_yr) : null;
          const nuitsChaud = v?.NORTR_yr != null ? Math.round(v.NORTR_yr) : null;

          return (
            <div key={city.insee} className="city-item">
              <div className="city-header">
                <div className="city-rank">{String(city.rank).padStart(2, '0')}</div>
                <div className="city-info">
                  <div className="city-name">{city.nom}</div>
                  <div className="city-dept">{city.dept}</div>
                </div>
                <div className="city-score-block">
                  <div className="city-score-num">{city.score}<span style={{ fontSize: '0.4em', color: 'var(--fg-4)' }}>/100</span></div>
                  <div className="city-score-label">Score tension</div>
                </div>
              </div>

              {(joursCaleur != null || joursCanicule != null || nuitsChaud != null) && (
                <div className="city-stats">
                  {joursCaleur != null && (
                    <div className="city-stat">
                      <div className="city-stat-label">Jours &gt; 30°C / an</div>
                      <div className="city-stat-value">{joursCaleur}<span className="city-stat-unit"> j</span></div>
                    </div>
                  )}
                  {joursCanicule != null && (
                    <div className="city-stat">
                      <div className="city-stat-label">Jours &gt; 35°C / an</div>
                      <div className="city-stat-value">{joursCanicule}<span className="city-stat-unit"> j</span></div>
                    </div>
                  )}
                  {nuitsChaud != null && (
                    <div className="city-stat">
                      <div className="city-stat-label">Nuits tropicales / an</div>
                      <div className="city-stat-value">{nuitsChaud}<span className="city-stat-unit"> n</span></div>
                    </div>
                  )}
                </div>
              )}

              <p className="city-editorial">{city.editorial}</p>
              <div className="city-sources">Sources · {city.sources}</div>
              <Link href={`/chaleur/${city.insee}`} className="city-link">
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
              Cherchez votre ville pour voir ses projections spécifiques — puis construisez votre rapport personnalisé.
              Six dimensions croisées : Quartier, Santé, Logement, Métier, Mobilité, Projets.
            </p>
            <div className="cta-links">
              <Link href="/rapport" className="cta-btn">Créer mon rapport →</Link>
              <Link href="/chaleur" className="cta-sec">Explorer par commune</Link>
              <Link href="/comparateur" className="cta-sec">Comparer deux villes</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <div>futur•e · Chaleur · Top 10 villes les plus exposées</div>
        <div>
          <Link href="/chaleur">← Toutes les communes</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
