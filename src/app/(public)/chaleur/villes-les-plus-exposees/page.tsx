import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getClimatDataCommune } from '@/lib/drias-json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Les 10 grandes villes françaises où la chaleur sera la plus difficile à vivre en 2050 · futur•e',
  description:
    'Perpignan, Montpellier, Nîmes, Avignon : dans quelles grandes villes françaises la chaleur pèsera le plus sur la vie quotidienne en 2050 ? Un classement futur•e expliqué ville par ville.',
  openGraph: {
    title: 'Les 10 grandes villes françaises où la chaleur sera la plus difficile à vivre en 2050',
    description: 'Un classement futur•e qui croise chaleur projetée, nuits tropicales et vulnérabilité locale. Données et explications par ville.',
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
    editorial: "Perpignan se défend en tête de ce classement non pas seulement parce qu'elle sera très chaude, mais parce que la chaleur y est déjà difficile à encaisser sur la durée. La ville fait partie des plus chaudes de France métropolitaine, avec des étés très longs, des nuits souvent peu rafraîchissantes et une forte exposition aux épisodes intenses. Montpellier ou Nîmes peuvent afficher des indicateurs très élevés sur certains jours extrêmes. Mais Perpignan cumule chaleur de jour, chaleur nocturne et tension durable sur la vie quotidienne, ce qui explique son score global.",
    sources: 'DRIAS Météo-France, Météo-France Pyrénées-Orientales, données climatologiques 1950–2024',
  },
  {
    rank: 2,
    nom: 'Montpellier',
    insee: '34172',
    dept: 'Hérault (34)',
    score: 87,
    editorial: "Montpellier ressort très haut parce qu'elle combine un climat déjà chaud avec une croissance urbaine très rapide. La ville s'est étendue, les surfaces minérales ont progressé et les nuits y deviennent plus difficiles à vivre. Les projections la placent parmi les grandes villes françaises les plus touchées par la hausse des jours très chauds. Ce qui pèse ici, ce n'est pas seulement la température maximale. C'est le fait qu'une grande agglomération dense devra encaisser cette chaleur avec de moins en moins de répit nocturne.",
    sources: 'INSEE, DRIAS Météo-France, Cerema',
  },
  {
    rank: 3,
    nom: 'Nîmes',
    insee: '30189',
    dept: 'Gard (30)',
    score: 87,
    editorial: "Nîmes peut rivaliser avec Perpignan ou Montpellier sur plusieurs indicateurs bruts de chaleur. La ville cumule un fort ensoleillement, des sols qui sèchent vite et peu d'effet modérateur lié à la mer. Le Gard fait partie des départements les plus concernés par les épisodes de chaleur intense. Si Nîmes n'est pas première ici, ce n'est pas parce qu'elle sera moins touchée, mais parce que le score futur•e ne mesure pas seulement l'aléa thermique. Il mesure aussi la façon dont cette chaleur devient plus ou moins difficile à vivre localement.",
    sources: 'DRIAS Météo-France, Météo-France vigilances 2020–2024, Météo-France Gard',
  },
  {
    rank: 4,
    nom: 'Avignon',
    insee: '84007',
    dept: 'Vaucluse (84)',
    score: 85,
    editorial: "Avignon réunit plusieurs facteurs qui rendent la chaleur difficile à vivre : un climat déjà très chaud, un bâti minéral qui garde la chaleur et une population localement plus âgée que dans beaucoup d'autres grandes villes. Ici, le sujet n'est pas seulement le pic de l'après-midi. C'est aussi la chaleur qui reste dans les murs et qui complique la récupération la nuit. Dans une ville historique et dense, cette inertie thermique compte beaucoup.",
    sources: 'DRIAS Météo-France, INSEE structure de population',
  },
  {
    rank: 5,
    nom: 'Marseille',
    insee: '13055',
    dept: 'Bouches-du-Rhône (13)',
    score: 84,
    editorial: "Marseille ne remonte pas seulement à cause du climat méditerranéen. Elle remonte aussi parce que la chaleur y rencontre une grande ville dense, minérale et socialement inégale. Certains quartiers ont moins de végétation, des logements plus difficiles à rafraîchir et moins de marge pour s'adapter. Le score élevé de Marseille dit cela : la chaleur extrême ne frappe pas tout le monde de la même manière, et dans une métropole aussi contrastée, cette différence pèse lourd.",
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
    editorial: "Toulouse se situe un cran derrière les villes méditerranéennes, mais la trajectoire y est nette. Les épisodes caniculaires y deviennent plus fréquents, plus longs et plus difficiles à supporter dans une grande métropole qui n'a pas historiquement construit toute son organisation autour de cette contrainte. Ce qui frappe à Toulouse, c'est moins l'image d'une ville déjà torride que la rapidité avec laquelle la chaleur s'y installe comme un problème ordinaire.",
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
    editorial: "Bordeaux ferme ce top parce qu'elle entre dans une zone où la chaleur devient un vrai sujet de vie quotidienne, sans encore atteindre le niveau des villes méditerranéennes. Les étés y se réchauffent nettement, les épisodes extrêmes deviennent plus visibles et la grande forêt landaise voisine rappelle que chaleur, sécheresse et feux peuvent se renforcer. Bordeaux n'est pas la ville la plus exposée de France. Mais elle fait partie de celles pour lesquelles la chaleur ne peut plus être considérée comme un simple inconfort d'été.",
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
          Les 10 grandes villes françaises<br />
          où la chaleur sera la plus <em>difficile à vivre</em>
        </h1>
        <p className="lede">
          Cette page ne classe pas seulement les villes les plus chaudes. Elle classe les grandes communes où la chaleur pèsera le plus sur la vie quotidienne en 2050, en croisant jours très chauds, nuits tropicales et vulnérabilités locales. Le Sud méditerranéen domine nettement, mais pas toujours pour les mêmes raisons d&apos;une ville à l&apos;autre.
        </p>
        <div className="method-note">
          Classement fondé sur le score de tension canicule futur•e. Il combine projections climatiques DRIAS, nuits chaudes, intensité de la chaleur et vulnérabilités locales. La lecture correspond à un horizon 2050 dans une trajectoire de réchauffement conduisant vers environ +4°C en fin de siècle.
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
