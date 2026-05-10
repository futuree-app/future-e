import Link from 'next/link';
import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Maladies émergentes : ce que le changement climatique déplace vers la France · futur•e',
  description:
    "Des maladies autrefois cantonnées aux régions tropicales s'installent durablement en France métropolitaine. Ce que les autorités sanitaires documentent déjà.",
};

const css = String.raw`
  :root {
    --accent: #fb923c;
    --accent-soft: rgba(251,146,60,0.10);
    --accent-border: rgba(251,146,60,0.28);
    --red: #f87171;
    --red-soft: rgba(248,113,113,0.09);
    --blue: #60a5fa;
    --blue-soft: rgba(96,165,250,0.10);
    --green: #34d399;
    --green-soft: rgba(52,211,153,0.10);
    --violet: #a78bfa;
    --violet-soft: rgba(167,139,250,0.10);
  }

  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; background:var(--bg); color:var(--fg-1); font-family:var(--font-sans); font-size:16px; line-height:1.65; overflow-x:hidden; -webkit-font-smoothing:antialiased; }

  .orb { position:fixed; border-radius:50%; filter:blur(120px); opacity:0.26; pointer-events:none; z-index:0; animation:breathe 14s ease-in-out infinite; }
  .orb-1 { width:520px; height:520px; background:radial-gradient(circle,#fb923c 0%,transparent 70%); top:-160px; left:-100px; }
  .orb-2 { width:440px; height:440px; background:radial-gradient(circle,#a78bfa 0%,transparent 70%); bottom:-100px; right:-80px; animation-delay:-6s; }
  .orb-3 { width:380px; height:380px; background:radial-gradient(circle,#60a5fa 0%,transparent 70%); top:40%; left:55%; opacity:0.14; animation-delay:-11s; }
  @keyframes breathe { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.14) translate(18px,-28px);} }

  body::before { content:""; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.026 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; z-index:1; mix-blend-mode:overlay; }

  .nav { position:sticky; top:0; z-index:50; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); background:var(--bg-card); border-bottom:1px solid var(--border-1); }
  .nav-inner { max-width:800px; margin:0 auto; padding:16px 28px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
  .brand { font-family:var(--font-serif); font-size:22px; font-style:italic; color:var(--fg-1); text-decoration:none; letter-spacing:-0.01em; }
  .brand-dot { color:var(--accent); font-style:normal; }
  .nav-crumb { font-family:var(--font-mono); font-size:11px; color:var(--fg-4); letter-spacing:0.08em; text-transform:uppercase; }
  .nav-crumb a { color:var(--fg-3); text-decoration:none; }
  .nav-crumb .sep { margin:0 10px; }

  .article { position:relative; z-index:2; max-width:720px; margin:0 auto; padding:72px 28px 120px; }
  .article-tag { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; background:var(--accent-soft); border:1px solid var(--accent-border); font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--accent); margin-bottom:28px; }
  .article-tag::before { content:""; width:6px; height:6px; border-radius:50%; background:var(--accent); box-shadow:0 0 10px var(--accent); }

  h1 { font-family:var(--font-serif); font-weight:400; font-size:clamp(34px,5vw,52px); line-height:1.08; letter-spacing:-0.02em; margin:0 0 24px; color:var(--fg-1); }
  h1 em { font-style:italic; color:var(--accent); }
  .article-intro { font-family:var(--font-serif); font-size:clamp(17px,2vw,21px); line-height:1.62; color:var(--fg-3); margin:0 0 40px; border-bottom:1px solid var(--border-1); padding-bottom:36px; }
  .article-meta { display:flex; gap:24px; flex-wrap:wrap; margin-bottom:44px; font-family:var(--font-mono); font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--fg-4); }

  h2 { font-family:var(--font-serif); font-weight:400; font-size:clamp(24px,3vw,32px); line-height:1.2; letter-spacing:-0.01em; margin:64px 0 20px; color:var(--fg-1); position:relative; }
  h2::before { content:""; position:absolute; left:-28px; top:18px; width:14px; height:1px; background:var(--accent); }
  p { margin:0 0 18px; font-size:17px; line-height:1.72; color:var(--fg-1); }
  p strong { font-weight:500; color:#fff; }
  .src { font-family:var(--font-mono); font-size:11px; color:var(--fg-4); }

  .alert-block { margin:0 0 48px; padding:24px 28px; background:rgba(248,113,113,0.06); border:1px solid rgba(248,113,113,0.22); border-left:2px solid var(--red); }
  .alert-head { font-family:var(--font-mono); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--red); opacity:0.8; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
  .alert-dot { width:6px; height:6px; border-radius:50%; background:var(--red); animation:pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .alert-block p { font-size:15px; color:var(--fg-3); line-height:1.65; margin:0 0 8px; }
  .alert-block p:last-child { margin:0; }

  .keystat { margin:36px 0; padding:24px 28px; background:var(--bg-elev); border:1px solid var(--border-1); border-left:2px solid var(--accent); position:relative; overflow:hidden; }
  .keystat::after { content:""; position:absolute; top:0; right:0; width:180px; height:180px; background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%); pointer-events:none; }
  .keystat.red { border-left-color: var(--red); }
  .keystat.red::after { background:radial-gradient(circle,var(--red-soft) 0%,transparent 70%); }
  .keystat.blue { border-left-color: var(--blue); }
  .keystat.blue::after { background:radial-gradient(circle,var(--blue-soft) 0%,transparent 70%); }
  .keystat-num { font-family:var(--font-serif); font-size:48px; line-height:1; color:var(--accent); font-weight:400; letter-spacing:-0.02em; margin-bottom:8px; display:block; position:relative; z-index:1; }
  .keystat.red .keystat-num { color:var(--red); }
  .keystat.blue .keystat-num { color:var(--blue); }
  .keystat-label { font-size:14px; color:var(--fg-3); line-height:1.55; position:relative; z-index:1; }
  .keystat-src { display:block; margin-top:8px; font-family:var(--font-mono); font-size:11px; color:var(--fg-4); position:relative; z-index:1; }

  .disease-grid { display:grid; gap:12px; margin:28px 0; }
  .disease-card { padding:22px 24px; background:var(--bg-elev); border:1px solid var(--border-1); border-radius:6px; display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:start; }
  .disease-icon { width:40px; height:40px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .disease-name { font-weight:500; font-size:15px; color:var(--fg-1); margin-bottom:4px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .disease-desc { font-size:13px; color:var(--fg-3); line-height:1.6; }
  .disease-badge { font-family:var(--font-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase; padding:2px 8px; border-radius:3px; white-space:nowrap; }
  .badge-etabli { background:rgba(248,113,113,0.12); border:1px solid rgba(248,113,113,0.25); color:#fca5a5; }
  .badge-expansion { background:rgba(251,146,60,0.12); border:1px solid rgba(251,146,60,0.25); color:#fdba74; }
  .badge-emergent { background:rgba(251,191,36,0.10); border:1px solid rgba(251,191,36,0.2); color:#fde68a; }
  .badge-surveille { background:rgba(167,139,250,0.10); border:1px solid rgba(167,139,250,0.22); color:#c4b5fd; }

  .mecanism-block { margin:32px 0; padding:22px 26px; background:var(--bg-elev); border:1px solid var(--border-1); border-left:2px solid var(--violet); border-radius:4px; }
  .mecanism-head { font-family:var(--font-mono); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--violet); opacity:0.85; margin-bottom:10px; }
  .mecanism-block p { font-size:14px; color:var(--fg-3); line-height:1.65; margin:0 0 8px; }
  .mecanism-block p:last-child { margin:0; }

  .nuance { margin:32px 0; padding:20px 24px; background:var(--green-soft); border:1px solid rgba(52,211,153,0.22); border-radius:6px; }
  .nuance-head { font-family:var(--font-mono); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--green); opacity:0.85; margin-bottom:10px; }
  .nuance p { font-size:14px; color:var(--fg-3); line-height:1.65; margin:0; }

  .territory-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:24px 0; }
  .territory-card { padding:16px 18px; background:var(--bg-elev); border:1px solid var(--border-1); border-radius:6px; }
  .tc-region { font-family:var(--font-mono); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:6px; }
  .tc-risk { font-weight:500; font-size:14px; color:var(--fg-1); margin-bottom:4px; }
  .tc-desc { font-size:12px; color:var(--fg-3); line-height:1.5; }

  .actions-card { margin:52px 0 28px; padding:26px; background:var(--bg-elev); border:1px solid var(--border-1); border-radius:8px; }
  .actions-card-head { font-family:var(--font-mono); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--fg-4); margin-bottom:16px; }
  .actions-list { list-style:none; padding:0; margin:0; }
  .actions-list li a { display:flex; align-items:center; justify-content:space-between; padding:14px 0; color:var(--fg-1); text-decoration:none; border-bottom:1px solid var(--border-1); font-family:var(--font-serif); font-size:19px; font-style:italic; transition:padding 0.25s, color 0.25s; }
  .actions-list li:last-child a { border-bottom:none; padding-bottom:0; }
  .actions-list li a:hover { padding-left:8px; color:var(--accent); }
  .actions-list .arrow { font-family:var(--font-sans); font-style:normal; font-size:14px; color:var(--fg-4); }

  .sources { margin-top:64px; padding-top:36px; border-top:1px solid var(--border-1); }
  .sources-head { font-family:var(--font-mono); font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--fg-3); margin-bottom:20px; }
  .source-item { display:grid; grid-template-columns:72px 1fr; gap:12px; align-items:baseline; margin-bottom:12px; font-size:13px; color:var(--fg-3); line-height:1.5; }
  .src-tag { font-family:var(--font-mono); font-size:10px; letter-spacing:0.07em; text-transform:uppercase; color:var(--fg-4); padding:2px 7px; border:1px solid var(--border-1); border-radius:3px; white-space:nowrap; }
  .sources a { color:var(--fg-1); text-decoration:none; border-bottom:1px solid var(--border-hi); transition:color 0.2s, border-color 0.2s; }
  .sources a:hover { color:var(--accent); border-color:var(--accent); }

  .page-footer { position:relative; z-index:2; border-top:1px solid var(--border-1); padding:28px; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; }
  .footer-note { font-family:var(--font-mono); font-size:11px; color:var(--fg-4); letter-spacing:0.06em; text-transform:uppercase; line-height:1.7; }

  @media (max-width:680px) {
    .article { padding:48px 20px 80px; }
    h2::before { display:none; }
    .territory-grid { grid-template-columns:1fr; }
    .disease-card { grid-template-columns:1fr; gap:10px; }
  }
`;

const articleHtml = String.raw`
  <div class="article-tag">Santé · Risques émergents</div>

  <h1>Ce que le changement<br>climatique déplace<br><em>vers la France.</em></h1>

  <p class="article-intro">
    Des maladies autrefois cantonnées aux régions tropicales s'installent durablement en France métropolitaine. D'autres, déjà présentes, étendent leur territoire ou voient leur fréquence augmenter. Ce n'est pas une prédiction — c'est ce qui se passe déjà, documenté par les bulletins de surveillance des autorités sanitaires.
  </p>

  <div class="article-meta">
    <span>Santé publique France</span>
    <span>Institut Pasteur</span>
    <span>ANRS MIE · OMS</span>
    <span>Mai 2026</span>
  </div>

  <div class="alert-block">
    <div class="alert-head"><div class="alert-dot"></div>Alerte en cours · Mai 2026</div>
    <p>
      Depuis le 3 mai 2026, l'OMS suit un foyer d'hantavirus à bord du navire de croisière <strong>MV Hondius</strong>, parti d'Argentine à destination du Cap-Vert. Sept personnes contaminées, trois décès. La souche identifiée est le virus Andes — <strong>la seule parmi les 38 souches connues capable de se transmettre d'une personne à l'autre</strong>, contrairement aux souches circulant habituellement en France.
    </p>
    <p>
      Le navire rejoint les Canaries. L'OMS juge le risque de propagation hors du navire faible. Cette alerte rappelle que les hantavirus, souvent présentés comme une menace lointaine, circulent déjà en France — sous des formes moins sévères. C'est le sujet de cette page.
    </p>
  </div>

  <p>
    L'hantavirus est l'actualité du moment. Mais il n'est qu'une des manifestations d'un phénomène plus large : le déplacement progressif de l'enveloppe géographique des maladies infectieuses sous l'effet du changement climatique. Comprendre l'hantavirus seul, sans ce contexte, revient à lire un symptôme sans chercher la cause.
  </p>

  <h2>Pourquoi le climat déplace les maladies</h2>

  <p>
    Les maladies infectieuses ne sont pas aléatoirement distribuées sur la planète. Elles suivent des niches écologiques précises : la température à laquelle un moustique peut se reproduire, l'humidité qui permet à une tique de survivre l'hiver, les conditions qui favorisent les pullulations de rongeurs. <strong>Quand les conditions climatiques changent, ces niches se déplacent.</strong>
  </p>

  <p>
    Le réchauffement climatique agit sur trois mécanismes distincts, qui peuvent se combiner.
  </p>

  <div class="mecanism-block">
    <div class="mecanism-head">Mécanisme 1 — Extension de l'aire des vecteurs</div>
    <p>Les insectes et acariens vecteurs de maladies (moustiques, tiques, phlébotomes) ont des températures minimales de survie et de reproduction. À mesure que les hivers se réchauffent, leur aire de répartition s'étend vers le nord et vers des altitudes plus élevées. <strong>Le moustique tigre (Aedes albopictus) est présent en France hexagonale depuis 2004 et colonise désormais 98 % de la population en région PACA.</strong></p>
  </div>

  <div class="mecanism-block">
    <div class="mecanism-head">Mécanisme 2 — Modification des cycles de rongeurs</div>
    <p>Les populations de rongeurs sauvages fluctuent en cycles liés à la production de graines et de faînes dans les forêts. Le réchauffement et l'irrégularité des précipitations perturbent ces cycles, produisant des pics de population plus fréquents et plus intenses. <strong>Plus il y a de rongeurs, plus la probabilité de contact avec des humains augmente</strong> — et avec elle le risque de transmission d'hantavirus, de leptospirose et d'autres zoonoses.</p>
  </div>

  <div class="mecanism-block">
    <div class="mecanism-head">Mécanisme 3 — Perturbation des écosystèmes et perte de biodiversité</div>
    <p>Des études montrent qu'une biodiversité élevée dilue le risque infectieux : dans un écosystème varié, les pathogènes se dispersent entre de nombreuses espèces hôtes, dont beaucoup ne permettent pas une transmission efficace. La réduction de la biodiversité — due à l'urbanisation, l'agriculture intensive et le changement climatique — <strong>concentre les pathogènes sur un nombre restreint d'espèces réservoirs, souvent des rongeurs ou des moustiques</strong>, augmentant le risque pour les humains.</p>
  </div>

  <div class="keystat">
    <span class="keystat-num">64 %</span>
    <div class="keystat-label">des maladies infectieuses humaines connues sont des zoonoses — elles viennent d'animaux. La grande majorité des pandémies de l'histoire moderne (VIH, grippe espagnole, SRAS, Covid-19, Ebola) ont une origine animale. Le changement climatique accélère les conditions favorisant ces transmissions.</div>
    <span class="keystat-src">Source : OMS · UNEP · One Health 2022</span>
  </div>

  <h2>Les hantavirus en France : ce qui se passe déjà</h2>

  <p>
    L'hantavirus n'est pas une nouveauté en France. <strong>Trois souches circulent en France métropolitaine</strong> : le virus Puumala (le plus fréquent), le virus Seoul et le virus Tula. Aucune des trois ne se transmet d'une personne à l'autre — contrairement à la souche Andes identifiée sur le MV Hondius.
  </p>

  <p>
    Le virus Puumala est transmis par le campagnol roussâtre, un petit rongeur des forêts. Il provoque la néphropathie épidémique — une fièvre hémorragique à syndrome rénal dont le taux de mortalité est faible, autour de 0,4 %. La contamination humaine se fait par inhalation de poussières contaminées par les excréments de rongeurs infectés, lors d'activités en forêt ou dans des locaux inhabités. <span class="src">Source : Institut Pasteur</span>
  </p>

  <div class="keystat red">
    <span class="keystat-num">321</span>
    <div class="keystat-label">cas d'hantavirus recensés en France en 2021 — un pic exceptionnel, dont 225 dans le seul département du Jura. En 2024, 75 nouveaux cas ont encore été signalés. Entre janvier et mars 2026, 19 cas confirmés ont été recensés par le Centre national de référence, dans la moyenne habituelle.</div>
    <span class="keystat-src">Source : Santé publique France · CNR Hantavirus Institut Pasteur 2026</span>
  </div>

  <p>
    La géographie de cette maladie est structurante : <strong>le quart nord-est de la France concentre l'essentiel des cas</strong>. Les Ardennes, le Jura, la Franche-Comté, l'Alsace et la Lorraine sont les zones historiquement les plus touchées, correspondant aux forêts de hêtres et de chênes où le campagnol roussâtre est le plus abondant.
  </p>

  <div class="mecanism-block">
    <div class="mecanism-head">Le lien avec le changement climatique</div>
    <p>Les épidémies d'hantavirus en Europe sont corrélées aux années de forte production de faînes de hêtre (les années dites "de mast"). Ces productions massives de graines entraînent des explosions démographiques de campagnols l'année suivante — et une augmentation mécanique du risque de contact humain. Le réchauffement climatique modifie la fréquence et l'intensité de ces années de mast. <strong>Des modèles scientifiques prévoient que la néphropathie épidémique pourrait devenir hautement endémique dans des zones qui n'en connaissaient pas jusqu'ici</strong>, notamment en Belgique, dans le nord de la France et au-delà. <span class="src">Source : Clinics in Microbiology and Infection · PMC 2009</span></p>
  </div>

  <h2>Les autres maladies qui avancent vers la France</h2>

  <p>
    L'hantavirus est un exemple parmi d'autres. Plusieurs maladies infectieuses sont déjà en cours d'installation ou d'expansion en France métropolitaine sous l'effet du changement climatique.
  </p>

  <div class="disease-grid">
    <div class="disease-card">
      <div class="disease-icon" style="background:rgba(248,113,113,0.12);">🦟</div>
      <div class="disease-body">
        <div class="disease-name">Chikungunya et dengue <span class="disease-badge badge-etabli">Établi</span></div>
        <p class="disease-desc">456 cas autochtones de chikungunya en PACA en 2025 — contre 19 cas cumulés entre 2010 et 2024. La dengue a également circulé localement. Ces maladies sont transmises par le moustique tigre (Aedes albopictus), dont la présence s'étend chaque année vers le nord. En 2025, pour la première fois, des cas autochtones ont été recensés en Bourgogne-Franche-Comté, Centre-Val de Loire et Grand Est. La saison de surveillance s'étend de mai à novembre. <span class="src">Source : Santé publique France · Bulletin PACA mai 2026</span></p>
      </div>
    </div>

    <div class="disease-card">
      <div class="disease-icon" style="background:rgba(251,146,60,0.12);">🐦</div>
      <div class="disease-body">
        <div class="disease-name">Virus West Nile <span class="disease-badge badge-etabli">Établi</span></div>
        <p class="disease-desc">30 cas humains en PACA en 2025 — un record. Transmis par des moustiques du genre Culex à partir d'oiseaux réservoirs. 37 % des cas développent des formes neurologiques sévères. En 2025, pour la première fois, une circulation virale a été clairement établie dans le Vaucluse. En 2022, le virus West Nile a émergé de façon inattendue sur la côte atlantique, en Nouvelle-Aquitaine. <span class="src">Source : Santé publique France · CNR Arbovirus</span></p>
      </div>
    </div>

    <div class="disease-card">
      <div class="disease-icon" style="background:rgba(167,139,250,0.12);">🐀</div>
      <div class="disease-body">
        <div class="disease-name">Hantavirus (Puumala) <span class="disease-badge badge-expansion">En expansion</span></div>
        <p class="disease-desc">Présent dans le quart nord-est de la France depuis les années 1980. Des modèles scientifiques prédisent une extension géographique vers l'ouest et le nord sous l'effet du réchauffement. Aucune transmission interhumaine pour les souches françaises. Principaux profils exposés : forestiers, agriculteurs, randonneurs dans les zones endémiques. <span class="src">Source : Institut Pasteur · CNR Hantavirus 2026</span></p>
      </div>
    </div>

    <div class="disease-card">
      <div class="disease-icon" style="background:rgba(96,165,250,0.12);">🐕</div>
      <div class="disease-body">
        <div class="disease-name">Leishmaniose <span class="disease-badge badge-expansion">En expansion</span></div>
        <p class="disease-desc">Maladie parasitaire transmise par des phlébotomes (petits moucherons), dont l'aire de répartition remonte vers le nord en France. Historiquement confinée au pourtour méditerranéen, la leishmaniose à Leishmania infantum est désormais signalée dans des zones autrefois non concernées. Les chiens sont le principal réservoir. <span class="src">Source : ECDC · ScienceDirect 2023</span></p>
      </div>
    </div>

    <div class="disease-card">
      <div class="disease-icon" style="background:rgba(251,191,36,0.12);">🕷️</div>
      <div class="disease-body">
        <div class="disease-name">Encéphalite à tiques <span class="disease-badge badge-emergent">Émergent</span></div>
        <p class="disease-desc">Transmise par les tiques Ixodes ricinus, dont l'activité s'étend à mesure que les hivers se réchauffent. Le réchauffement crée un chevauchement des périodes d'activité des nymphes et larves qui augmente la prévalence du virus chez les tiques. Des cas sont désormais signalés dans l'est et le centre de la France. <span class="src">Source : ECDC · EM-consulte 2023</span></p>
      </div>
    </div>

    <div class="disease-card">
      <div class="disease-icon" style="background:rgba(248,113,113,0.12);">🩸</div>
      <div class="disease-body">
        <div class="disease-name">Fièvre hémorragique Crimée-Congo <span class="disease-badge badge-surveille">Surveillé</span></div>
        <p class="disease-desc">Pas encore établie en France métropolitaine, mais la tique Hyalomma marginatum — son vecteur principal — est présente et s'étend dans le pourtour méditerranéen. Des cas sporadiques ont été détectés en Espagne. Les modèles climatiques indiquent une expansion progressive vers le nord. <span class="src">Source : ECDC · ScienceDirect 2023</span></p>
      </div>
    </div>
  </div>

  <h2>Ce que ça signifie selon où vous habitez</h2>

  <div class="territory-grid">
    <div class="territory-card">
      <div class="tc-region">Méditerranée · PACA · Corse</div>
      <div class="tc-risk">Risque vectoriel le plus élevé</div>
      <div class="tc-desc">Moustique tigre ultra-répandu, chikungunya et dengue autochtones documentés, West Nile établi, leishmaniose historique. Saison de risque longue : mai à novembre.</div>
    </div>
    <div class="territory-card">
      <div class="tc-region">Occitanie · Nouvelle-Aquitaine</div>
      <div class="tc-risk">Front d'expansion vectorielle</div>
      <div class="tc-desc">Moustique tigre en progression rapide. West Nile apparu en Nouvelle-Aquitaine en 2022. Leishmaniose en extension depuis le Languedoc. Phlébotomes présents.</div>
    </div>
    <div class="territory-card">
      <div class="tc-region">Quart nord-est · Jura · Ardennes · Alsace</div>
      <div class="tc-risk">Zone endémique hantavirus</div>
      <div class="tc-desc">Foyers réguliers de virus Puumala depuis les années 1980. Pics épidémiques liés aux pullulations de campagnols. Encéphalite à tiques en augmentation.</div>
    </div>
    <div class="territory-card">
      <div class="tc-region">Bretagne · Normandie · Île-de-France</div>
      <div class="tc-risk">Exposition intermédiaire et croissante</div>
      <div class="tc-desc">Moustique tigre en colonisation progressive. Tiques actives une grande partie de l'année. Virus Seoul (hantavirus) présent en milieu urbain via les rats.</div>
    </div>
    <div class="territory-card">
      <div class="tc-region">Alpes · Pyrénées · Massif Central</div>
      <div class="tc-risk">Montée en altitude des vecteurs</div>
      <div class="tc-desc">Les zones de montagne, autrefois protégées par le froid, voient les vecteurs coloniser des altitudes croissantes. Tiques et moustiques actifs désormais au-delà de 1 500 m dans certains secteurs.</div>
    </div>
    <div class="territory-card">
      <div class="tc-region">Guyane française</div>
      <div class="tc-risk">Hantavirus pulmonaire (souche Maripa)</div>
      <div class="tc-desc">Souche Maripa, plus proche des hantavirus américains. 11 cas depuis 2008, dont 6 mortels. Zone de surveillance spécifique distincte de la métropole.</div>
    </div>
  </div>

  <h2>Ce que l'actualité du MV Hondius dit — et ne dit pas</h2>

  <p>
    L'émotion suscitée par l'épidémie à bord du MV Hondius est compréhensible : trois morts, une souche transmissible entre humains, un navire bloqué. Mais cette dramaturgie risque de masquer deux réalités plus importantes.
  </p>

  <p>
    <strong>La première</strong> : la souche Andes identifiée sur le navire n'est pas la même que les souches françaises. Elle circule en Amérique du Sud, elle est plus létale, et sa transmission interhumaine — bien que documentée — reste marginale par rapport à la transmission par les rongeurs. Le risque d'épidémie généralisée en Europe est jugé faible par l'OMS. <span class="src">Source : OMS · Maladie outbreak 2026-DON599</span>
  </p>

  <p>
    <strong>La deuxième</strong> : les hantavirus qui circulent déjà en France — Puumala, Seoul — font des dizaines de malades chaque année, sans le moindre écho médiatique. Ce sont des maladies structurelles du territoire, liées à l'écologie des forêts françaises et aux cycles des rongeurs. <strong>La vigilance sur ces formes locales est plus utile, pour la plupart des habitants de France, que la crainte d'une souche sud-américaine.</strong>
  </p>

  <div class="nuance">
    <div class="nuance-head">Ce que la science dit sur la transmission locale</div>
    <p>Aucune transmission interhumaine d'hantavirus n'a été décrite à ce jour pour les trois espèces présentes en France métropolitaine (Puumala, Seoul, Tula). La contamination se fait uniquement par contact avec les excréments de rongeurs infectés — directement, ou par inhalation de poussières contaminées. <strong>Le risque est localisé dans le temps et l'espace</strong> : il augmente au printemps et en été dans les zones de forêt, et lors d'activités spécifiques (travaux dans des bâtiments abandonnés, débroussaillage, randonnée en zone endémique). <span class="src">Source : ARS Bourgogne-Franche-Comté · Institut Pasteur</span></p>
  </div>

  <h2>La question de fond : sommes-nous préparés ?</h2>

  <p>
    La France dispose d'un réseau de surveillance renforcée — déclaration obligatoire, réseaux de laboratoires, bulletins hebdomadaires, Centre national de référence des hantavirus à l'Institut Pasteur. Ce système fonctionne. Il a détecté les épidémies de 2021, suivi l'extension géographique du West Nile en 2022, et produit les bilans qui permettent de comprendre l'évolution en cours.
  </p>

  <p>
    Ce qui est moins certain, c'est la capacité à adapter les infrastructures de santé publique à un risque dont la géographie change plus vite que les plans de prévention. <strong>Les maladies vectorielles ne connaissent pas les frontières administratives.</strong> Un été chaud et pluvieux en Nouvelle-Aquitaine peut créer des conditions favorables au West Nile ou au moustique tigre dans des zones qui n'avaient jamais été concernées. Les professionnels de santé locaux ne sont pas nécessairement formés à reconnaître ces maladies.
  </p>

  <p>
    C'est aussi la question que posent les grandes épidémies vectorielles : elles testent non seulement les systèmes de santé publique, mais aussi la capacité des populations et des professionnels à reconnaître des symptômes inhabituels dans leurs territoires. Une fièvre accompagnée d'arthralgies en été à La Rochelle, en 2025, pouvait être du chikungunya. En 2020, cette hypothèse n'aurait pas traversé l'esprit d'un médecin généraliste de Charente-Maritime.
  </p>

  <div class="keystat blue">
    <span class="keystat-num">2004</span>
    <div class="keystat-label">année à laquelle le moustique tigre a été détecté pour la première fois en France hexagonale. En 2026, il est présent dans la quasi-totalité de la population PACA et colonise progressivement le reste du territoire. En vingt ans, il est passé de cas isolés à vecteur installé.</div>
    <span class="keystat-src">Source : DGS · Santé publique France</span>
  </div>

  <h2>Ce que vous pouvez faire</h2>

  <p>
    La plupart des maladies évoquées dans cette page ne se préviennent pas par un comportement individuel universel — elles appellent des actions ciblées selon la zone où l'on vit et les activités que l'on pratique.
  </p>

  <p>
    <strong>Si vous habitez ou visitez le quart nord-est de la France</strong>, les précautions contre l'hantavirus sont simples et documentées : aérer les locaux fermés longtemps inutilisés avant d'y entrer, porter un masque FFP2 lors de travaux dans des greniers ou caves, éviter de dormir à même le sol en forêt, ne pas toucher les rongeurs morts. Le risque est réel mais évitable. <span class="src">Source : ARS Bourgogne-Franche-Comté</span>
  </p>

  <p>
    <strong>Si vous habitez une zone avec moustique tigre</strong>, supprimer les gîtes larvaires autour de chez vous (soucoupes, pneus, vases avec eau stagnante) reste la mesure la plus efficace pour réduire la densité locale. Le moustique tigre a un rayon d'action d'environ 150 mètres et se reproduit dans des quantités d'eau minimes. Ce geste s'étend à l'échelle du quartier si les voisins font de même.
  </p>

  <p>
    <strong>Pour toutes les maladies vectorielles</strong>, connaître la saison de surveillance de votre région (mai à novembre pour les arboviroses dans la plupart des zones) et consulter rapidement un médecin en cas de fièvre inexpliquée après un séjour en zone boisée ou après une piqûre de moustique ou de tique est le geste le plus utile. Le diagnostic précoce change radicalement le pronostic.
  </p>

  <div class="actions-card">
    <div class="actions-card-head">Pages Savoir associées</div>
    <ul class="actions-list">
      <li><a href="/agir/canicule">Se préparer à la canicule : ce qui protège vraiment <span class="arrow">→</span></a></li>
      <li><a href="/savoir/pollutions-invisibles">Pollutions invisibles : ce que votre sol et votre air contiennent <span class="arrow">→</span></a></li>
      <li><a href="/savoir/preparation-catastrophes">Sommes-nous prêts à la prochaine catastrophe climatique ? <span class="arrow">→</span></a></li>
    </ul>
  </div>

  <div class="sources">
    <div class="sources-head">Sources</div>

    <div class="source-item">
      <span class="src-tag">SPF</span>
      <span>Santé publique France — Bulletin de surveillance renforcée arboviroses, septembre 2025 et mai 2026. Bilan PACA 2025 (chikungunya, dengue, Zika, West Nile).</span>
    </div>
    <div class="source-item">
      <span class="src-tag">Pasteur</span>
      <span>Institut Pasteur / ANRS MIE — Centre national de référence hantavirus, rapport trimestriel 2026. <a href="https://www.pasteur.fr/fr/sante-publique/CNR/les-cnr/hantavirus" target="_blank" rel="noopener">pasteur.fr</a></span>
    </div>
    <div class="source-item">
      <span class="src-tag">OMS</span>
      <span>Organisation mondiale de la santé — Disease Outbreak News 2026-DON599, foyer hantavirus MV Hondius, 4 mai 2026. <a href="https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599" target="_blank" rel="noopener">who.int</a></span>
    </div>
    <div class="source-item">
      <span class="src-tag">Inserm</span>
      <span>Inserm / ANRS MIE — "Huit questions sur l'hantavirus", mai 2026. <a href="https://presse.inserm.fr/canal-detox/symptomes-modes-de-contamination-espoirs-pour-la-recherche-huit-questions-sur-lhantavirus/" target="_blank" rel="noopener">presse.inserm.fr</a></span>
    </div>
    <div class="source-item">
      <span class="src-tag">ECDC</span>
      <span>Centre européen de prévention et de contrôle des maladies — maladies à transmission vectorielle, rapports mensuels EFSA-ECDC depuis juillet 2025.</span>
    </div>
    <div class="source-item">
      <span class="src-tag">Science</span>
      <span>Kallio et al. (2009) — "Relating increasing hantavirus incidences to the changing climate: the mast connection". Clinics in Microbiology and Infection. <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2642778/" target="_blank" rel="noopener">PMC2642778</a></span>
    </div>
    <div class="source-item">
      <span class="src-tag">FRB</span>
      <span>Fondation pour la recherche sur la biodiversité — "Modification des écosystèmes et zoonoses dans l'Anthropocène", juillet 2025.</span>
    </div>
    <div class="source-item">
      <span class="src-tag">EM</span>
      <span>Tattevin et al. — "Changement global et risque de maladies vectorielles ou zoonotiques émergentes en Europe". ScienceDirect / EM-consulte, 2023.</span>
    </div>
    <div class="source-item">
      <span class="src-tag">ARS</span>
      <span>ARS Bourgogne-Franche-Comté — "Hantavirus dus à des rongeurs infectés : mesures de prévention".</span>
    </div>
  </div>
`;

export default function MaladiesEmergentesPage() {
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
            <Link href="/">Pages Savoir</Link>
            <span className="sep">/</span>
            Maladies émergentes
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article className="article" dangerouslySetInnerHTML={{ __html: articleHtml }} />

      <footer className="page-footer">
        <Link href="/" className="brand" style={{ fontSize: 18, color: 'var(--fg-3)' }}>
          futur<span className="brand-dot">•</span>e
        </Link>
        <div className="footer-note">Données publiques françaises · Aucune publicité<br />Page Savoir · Maladies émergentes · Mai 2026</div>
      </footer>
    </>
  );
}
