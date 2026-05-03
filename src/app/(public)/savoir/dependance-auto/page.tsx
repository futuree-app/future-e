import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pourquoi certains territoires rendent la voiture presque obligatoire · futur•e',
  description:
    "En France, 84 % des actifs ruraux utilisent leur voiture pour aller travailler. Ce chiffre reflète une organisation du territoire construite sur des décennies.",
};

const css = `
  :root {
    --bg: #060812;
    --bg-elev: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.08);
    --border-strong: rgba(255,255,255,0.14);
    --text: #e9ecf2;
    --text-muted: #9ba3b4;
    --text-dim: #6b7388;
    --accent: #fb923c;
    --accent-soft: rgba(251,146,60,0.12);
    --accent-border: rgba(251,146,60,0.28);
    --violet: #a78bfa;
    --red: #f87171;
    --blue: #60a5fa;
    --serif: 'Instrument Serif','Times New Roman',serif;
    --sans: 'Instrument Sans',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.32;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:500px;height:500px;background:radial-gradient(circle,#fb923c 0%,transparent 70%);top:-130px;left:-100px;}
  .orb-2{width:440px;height:440px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-110px;right:-90px;animation-delay:-5s;}
  .orb-3{width:360px;height:360px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:55%;left:62%;opacity:0.14;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(18px,-28px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--text);text-decoration:none;}
  .brand-dot{color:var(--accent);font-style:normal;}
  .nav-crumb{font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--text-muted);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--text);}
  .nav-crumb .sep{margin:0 10px;color:var(--text-dim);}

  .article{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:64px 28px 120px;}

  .article-meta{display:flex;align-items:center;gap:16px;margin-bottom:28px;flex-wrap:wrap;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}
  .read-info{font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}

  h1{font-family:var(--serif);font-weight:400;font-size:clamp(38px,5.5vw,60px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 28px;color:var(--text);}
  h1 em{font-style:italic;color:var(--accent);}

  .dates{display:flex;align-items:center;gap:20px;margin:0 0 40px;padding:16px 20px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:6px;width:fit-content;max-width:100%;}
  .date-item{display:flex;flex-direction:column;gap:4px;}
  .date-label{font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);}
  .date-value{font-family:var(--sans);font-size:14px;color:var(--text);font-weight:500;}
  .date-value-muted{color:var(--text-dim);font-weight:400;}
  .date-sep{width:1px;height:28px;background:var(--border-strong);}

  .lede{font-family:var(--serif);font-size:clamp(20px,2.2vw,24px);line-height:1.5;color:var(--text);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border);}

  h2{font-family:var(--serif);font-weight:400;font-size:clamp(26px,3vw,34px);line-height:1.2;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--text);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--text);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}

  .keystat{margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden;}
  .keystat::after{content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .keystat-number{font-family:var(--serif);font-size:52px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .keystat-label{font-size:15px;color:var(--text-muted);line-height:1.5;position:relative;z-index:1;}
  .keystat-src{display:block;margin-top:10px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.05em;}

  .two-stats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:40px 0;}
  .stat-card{padding:24px 22px;background:var(--bg-elev);border:1px solid var(--border);border-radius:6px;position:relative;overflow:hidden;}
  .stat-card-label{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px;}
  .stat-card-number{font-family:var(--serif);font-size:40px;line-height:1;font-weight:400;margin-bottom:6px;}
  .stat-card-number.hi{color:var(--accent);}
  .stat-card-number.lo{color:var(--blue);}
  .stat-card-desc{font-size:13px;color:var(--text-muted);line-height:1.5;}
  .stat-card-src{margin-top:10px;font-family:var(--mono);font-size:10px;color:var(--text-dim);}

  .map-figure{margin:44px -20px;padding:32px 28px 28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:8px;position:relative;overflow:hidden;}
  .map-figure::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 65% 35%,rgba(251,146,60,0.06) 0%,transparent 55%);pointer-events:none;}
  .france-map{display:block;width:100%;max-width:480px;height:auto;margin:0 auto 20px;position:relative;z-index:1;}
  .map-figure figcaption{font-size:13px;color:var(--text-muted);line-height:1.55;text-align:center;padding:18px 0 0;border-top:1px solid var(--border);position:relative;z-index:1;}
  .map-figure figcaption a{color:var(--text);text-decoration:none;border-bottom:1px solid var(--border-strong);transition:color 0.2s,border-color 0.2s;}
  .map-figure figcaption a:hover{color:var(--accent);border-color:var(--accent);}

  .actions-card{margin:48px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:8px;}
  .actions-card-head{font-family:var(--mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--text);text-decoration:none;border-bottom:1px solid var(--border);font-family:var(--serif);font-size:20px;font-style:italic;transition:padding 0.25s ease,color 0.25s ease;}
  .actions-list li:last-child a{border-bottom:none;}
  .actions-list li a:hover{padding-left:8px;color:var(--accent);}
  .actions-list .arrow{font-family:var(--sans);font-style:normal;font-size:14px;color:var(--text-dim);transition:transform 0.25s ease,color 0.25s ease;}
  .actions-list li a:hover .arrow{transform:translateX(4px);color:var(--accent);}

  .sources{margin-top:72px;padding-top:40px;border-top:1px solid var(--border);}
  .sources h2{font-size:20px;font-family:var(--mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:24px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:14px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:baseline;font-size:14px;color:var(--text-muted);line-height:1.55;}
  .sources .src-tag{font-family:var(--mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);padding:3px 8px;border:1px solid var(--border);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--text);text-decoration:none;border-bottom:1px solid var(--border-strong);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .page-footer{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:40px 28px 80px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--text-muted);text-decoration:none;}
  .page-footer a:hover{color:var(--accent);}

  @media(max-width:768px){
    .article{padding:40px 22px 80px;}
    .nav-inner{padding:14px 22px;}
    h1{font-size:36px;}
    h2{font-size:25px;margin:44px 0 16px;}
    h2::before{display:none;}
    .lede{font-size:19px;padding-bottom:36px;margin-bottom:36px;}
    p{font-size:16px;}
    .keystat{padding:22px 20px;}
    .keystat-number{font-size:42px;}
    .two-stats{grid-template-columns:1fr;}
    .actions-card{padding:22px;}
    .actions-list li a{font-size:17px;padding:14px 0;}
    .map-figure{margin:36px -8px;padding:20px 14px 18px;}
    .dates{padding:14px 16px;gap:16px;}
    .nav-crumb .step-home,.nav-crumb .step-home+.sep{display:none;}
  }
`;

const articleBody = `
  <div class="article-meta">
    <span class="tag">Mobilité</span>
    <span class="read-info">Lecture 7 min</span>
  </div>

  <h1>Pourquoi certains territoires rendent la voiture <em>presque obligatoire</em></h1>

  <div class="dates">
    <div class="date-item">
      <span class="date-label">Publié</span>
      <span class="date-value">18 avril 2026</span>
    </div>
    <div class="date-sep"></div>
    <div class="date-item">
      <span class="date-label">Mis à jour</span>
      <span class="date-value date-value-muted">Aucune révision</span>
    </div>
  </div>

  <p class="lede">
    En France, 84 % des actifs résidant dans des communes rurales utilisent leur voiture pour aller travailler. Ce chiffre n'est pas le signe d'une préférence culturelle ou d'un manque de volonté de changer. Il reflète une organisation du territoire construite sur plusieurs décennies qui a rendu la voiture non pas commode, mais nécessaire. Comprendre pourquoi certains endroits produisent cette dépendance, et ce que cela implique pour les foyers qui y vivent, c'est l'objet de cette page.
  </p>

  <h2>De quoi parle-t-on précisément</h2>
  <p>
    La dépendance automobile désigne une situation dans laquelle l'accès à l'emploi, aux commerces, aux services de santé et aux espaces de sociabilité est structurellement impossible ou très difficile sans voiture. Elle se distingue d'un usage intensif mais choisi : un Parisien qui loue une voiture chaque week-end fait un choix ; un habitant de Bressuire ou de Decazeville qui ne possède pas de voiture ne peut, dans la plupart des cas, ni accéder à son travail ni faire ses courses sans elle.
  </p>
  <p>
    L'INSEE mesure cette réalité à travers plusieurs indicateurs : la part de la voiture dans les déplacements domicile-travail, la part des flux sortants (actifs travaillant hors de leur commune), la distance médiane des trajets et la couverture par les transports collectifs. Ces données permettent de classer les territoires selon leur niveau de dépendance structurelle à l'automobile.
  </p>

  <div class="keystat">
    <span class="keystat-number">84 %</span>
    <span class="keystat-label">des actifs résidant en commune rurale utilisent la voiture comme mode de transport principal vers leur lieu de travail.</span>
    <span class="keystat-src">Source : INSEE / Ecolab, flux domicile-travail, données 2026</span>
  </div>

  <h2>D'où cela vient</h2>
  <p>
    La dépendance automobile n'est pas un état naturel. Elle est le résultat d'un ensemble de choix d'aménagement du territoire qui se sont renforcés mutuellement depuis les années 1960. Le premier facteur est l'étalement urbain : les villes et leurs périphéries se sont développées en partant du principe que les habitants disposeraient d'une voiture. Les zones commerciales en périphérie, les grands équipements scolaires ou hospitaliers dimensionnés pour de larges bassins de population, les lotissements résidentiels construits loin des centres : tous ces éléments ont été conçus pour être desservis par la route.
  </p>
  <p>
    Le deuxième facteur est le déclin progressif des services de proximité dans les territoires peu denses. Quand une pharmacie, une poste, une école ou un cabinet médical ferme dans une commune de 800 habitants, les déplacements s'allongent et deviennent impossibles à pied ou à vélo. Ce mécanisme est documenté par le Commissariat général à l'égalité des territoires.
  </p>
  <p>
    Le troisième facteur est le sous-investissement chronique dans les alternatives. La France a maintenu un réseau ferroviaire dense pour les trajets interrégionaux, mais les dessertes locales (trains du quotidien, cars interurbains, navettes communales) ont subi des coupes significatives entre les années 1980 et 2010. La loi d'orientation des mobilités de 2019 a cherché à inverser cette tendance, mais les effets restent limités dans les zones les plus isolées.
  </p>

  <h2>Ce que cela change concrètement</h2>
  <p>
    Le premier effet est budgétaire. Un foyer dépendant d'une ou deux voitures dans un territoire périurbain consacre en moyenne entre 4 000 et 7 000 euros par an aux coûts de transport (carburant, assurance, entretien, amortissement), selon les calculs de l'Observatoire des inégalités et de l'ADEME. Dans un foyer dont le revenu net est de 2 000 euros par mois, cela représente entre 17 et 29 % du budget, une part largement incompressible : on peut renoncer à des loisirs, rarement à son trajet pour travailler.
  </p>
  <p>
    Le deuxième effet est une exposition directe à la volatilité du prix des carburants. Un foyer qui consomme 1 500 litres d'essence par an subit une variation de 750 euros sur son budget annuel pour chaque écart de 50 centimes au litre. Les périodes de forte hausse, comme celles de 2022 et de 2025-2026, sont sans conséquence pour un foyer bien desservi par les transports, très douloureuses pour un foyer périurbain sans alternative réaliste.
  </p>
  <p>
    Le troisième effet concerne la fragilité sociale. L'absence de permis de conduire, la perte de capacité à conduire liée à l'âge, la panne d'une voiture unique : chacun de ces événements peut remettre en cause l'accès à l'emploi ou aux soins dans les territoires fortement dépendants de la voiture.
  </p>

  <div class="two-stats">
    <div class="stat-card">
      <div class="stat-card-label">Part du budget transport</div>
      <div class="stat-card-number hi">29 %</div>
      <div class="stat-card-desc">Maximum observé dans les foyers à revenus modestes en zone périurbaine très dépendante</div>
      <div class="stat-card-src">ADEME / Observatoire des inégalités</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-label">Flux domicile-travail sortants</div>
      <div class="stat-card-number hi">52 %</div>
      <div class="stat-card-desc">Part médiane des actifs travaillant hors de leur commune dans les zones périurbaines très dépendantes</div>
      <div class="stat-card-src">INSEE / Ecolab, 2026</div>
    </div>
  </div>

  <h2>Quels territoires sont concernés en France</h2>
  <p>
    La dépendance automobile n'est pas uniformément répartie. Elle touche de façon structurelle les espaces périurbains des grandes agglomérations (couronnes de Bordeaux, Lyon, Toulouse, Nantes, Lille) où les logements sont accessibles financièrement mais les services et les emplois restent concentrés dans les coeurs d'agglomération. Elle est également très forte dans les territoires ruraux du Massif central, du nord de la Nouvelle-Aquitaine, du Grand Est rural et des franges des Hauts-de-France.
  </p>

  <p>
    Les métropoles elles-mêmes présentent des contrastes internes très marqués. Dans l'aire urbaine de Bordeaux, la dépendance à la voiture entre les quartiers du centre et les communes de la troisième couronne peut varier du simple au triple. Les projections de l'ADEME indiquent que, sans intervention sur la densification et l'offre de transport, cet écart continuera de se creuser.
  </p>

  <h2>Ce qui est débattu, ce qui ne l'est pas</h2>
  <p>
    Le constat de la dépendance structurelle est bien établi et fait consensus entre les chercheurs en géographie, les économistes des transports et les institutions publiques (ADEME, Cerema, CGEDD). Les données INSEE sont précises et régulièrement mises à jour. Ce qui n'est pas débattu : la voiture est devenue une condition d'accès au marché du travail et aux services essentiels pour une fraction importante de la population française, et cette dépendance est inégalement répartie sur le territoire.
  </p>
  <p>
    Ce qui fait davantage l'objet de discussions entre chercheurs et responsables de politiques publiques : la hiérarchie des solutions. Faut-il densifier les villes pour rapprocher emplois et logements, ou développer les transports pour relier des territoires moins denses ? Le rapport Dumont sur la mobilité rurale (2023) et les travaux du Cerema soulignent que la réponse dépend fortement de la configuration locale et qu'il n'existe pas de solution universelle applicable partout. La vitesse à laquelle une transition vers d'autres modes de déplacement est possible, et pour quels profils de population, reste une question ouverte et dépendante des investissements publics à venir.
  </p>
  <p>
    Un point fait également débat : la part de la contrainte résidentielle dans cette dépendance. Des travaux en sciences sociales, notamment ceux de Sylvie Fol sur les mobilités précaires, montrent que ces choix résidentiels sont souvent liés aux prix du logement plutôt que librement consentis.
  </p>

  <h2>Ce que vous pouvez faire</h2>
  <p>
    Si vous vous interrogez sur votre propre exposition à cette dépendance, les pages suivantes vous proposent des outils concrets : comment évaluer votre vulnérabilité budgétaire de mobilité, et comment décider si passer à un véhicule électrique a du sens dans votre territoire et pour vos usages.
  </p>

  <div class="actions-card">
    <div class="actions-card-head">Pour aller plus loin</div>
    <ul class="actions-list">
      <li><a href="/agir/dependance-auto">Évaluer votre dépendance à la voiture et ses alternatives réelles<span class="arrow">→</span></a></li>
      <li><a href="/agir/voiture-electrique">Passer à l'électrique : ce qui a du sens selon votre territoire<span class="arrow">→</span></a></li>
      <li><a href="#">Comment lire l'offre de transport collectif de votre commune<span class="arrow">→</span></a></li>
    </ul>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li>
        <span class="src-tag">INSEE</span>
        <span>Déplacements domicile-travail et flux selon le mode de transport principal, <a href="https://www.data.gouv.fr/fr/datasets/deplacements-domicile-travail/" target="_blank" rel="noopener">data.gouv.fr</a>, mis à jour septembre 2025.</span>
      </li>
      <li>
        <span class="src-tag">Ecolab</span>
        <span>Part des flux domicile-travail et flux domicile-travail selon le mode de transport principal utilisé, <a href="https://www.data.gouv.fr/fr/datasets/part-des-flux-domicile-travail/" target="_blank" rel="noopener">data.gouv.fr</a>, mis à jour février 2026.</span>
      </li>
      <li>
        <span class="src-tag">ADEME</span>
        <span>Prospective Transition(s) 2050, scénarios de mobilité à horizon 2050, <a href="https://librairie.ademe.fr/societe-et-politiques-publiques/5071-prospective-transitions-2050-synthese-edition-2024.html" target="_blank" rel="noopener">librairie.ademe.fr</a>, édition 2024.</span>
      </li>
      <li>
        <span class="src-tag">Cerema</span>
        <span>Travaux sur la mobilité dans les espaces peu denses et les solutions de continuité territoriale, cerema.fr.</span>
      </li>
      <li>
        <span class="src-tag">CGDD</span>
        <span>Rapport Dumont sur les mobilités du quotidien dans les territoires ruraux et périurbains, 2023.</span>
      </li>
      <li>
        <span class="src-tag">Obs. inégalités</span>
        <span>Données sur la part des dépenses de transport dans les budgets des ménages selon les catégories sociales et la localisation résidentielle, inegalites.fr.</span>
      </li>
      <li>
        <span class="src-tag">Fol, S.</span>
        <span>Fol, Sylvie. "La mobilité des pauvres", Belin, 2009. Référence fondatrice sur les contraintes de mobilité des ménages à revenus modestes dans les territoires périurbains.</span>
      </li>
    </ul>
  </section>
`;

export default function DependanceAutoPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <span className="step-home">Savoir</span>
            <span className="sep">/</span>
            <span>Mobilité</span>
            <span className="sep">/</span>
            Dépendance automobile
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article
        className="article"
        dangerouslySetInnerHTML={{ __html: articleBody }}
      />

      <footer className="page-footer">
        <div>futur•e · Savoir / Mobilité</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
