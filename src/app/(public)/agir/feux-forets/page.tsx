import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Face aux feux de forêts : débroussailler, préparer l'évacuation et connaître ses obligations · futur•e",
  description:
    "Ce que vous pouvez faire si vous vivez à proximité d'un massif forestier : obligation légale de débroussaillement, adaptation du logement, planification de l'évacuation et alertes.",
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
    --accent: #f97316;
    --accent-soft: rgba(249,115,22,0.12);
    --accent-border: rgba(249,115,22,0.28);
    --green: #4ade80;
    --green-soft: rgba(74,222,128,0.10);
    --green-border: rgba(74,222,128,0.22);
    --amber: #fbbf24;
    --serif: 'Instrument Serif','Times New Roman',serif;
    --sans: 'Instrument Sans',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.3;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:480px;height:480px;background:radial-gradient(circle,#f97316 0%,transparent 70%);top:-120px;left:-100px;}
  .orb-2{width:400px;height:400px;background:radial-gradient(circle,#fbbf24 0%,transparent 70%);bottom:-100px;right:-80px;opacity:0.18;animation-delay:-6s;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.12) translate(15px,-22px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

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
  .tag-actionnable{background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.25);color:var(--green);}
  .tag-actionnable::before{background:var(--green);box-shadow:0 0 10px var(--green);}
  .read-info{font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}

  h1{font-family:var(--serif);font-weight:400;font-size:clamp(36px,5vw,56px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 28px;color:var(--text);}
  h1 em{font-style:italic;color:var(--accent);}

  .dates{display:flex;align-items:center;gap:20px;margin:0 0 40px;padding:16px 20px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:6px;width:fit-content;max-width:100%;}
  .date-item{display:flex;flex-direction:column;gap:4px;}
  .date-label{font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);}
  .date-value{font-family:var(--sans);font-size:14px;color:var(--text);font-weight:500;}
  .date-value-muted{color:var(--text-dim);font-weight:400;}
  .date-sep{width:1px;height:28px;background:var(--border-strong);}

  .context-link{display:flex;align-items:center;gap:14px;padding:18px 20px;background:var(--bg-elev);border:1px solid var(--border);border-radius:6px;margin-bottom:40px;text-decoration:none;transition:border-color 0.2s,background 0.2s;}
  .context-link:hover{border-color:var(--accent-border);background:var(--accent-soft);}
  .context-link-label{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px;}
  .context-link-title{font-family:var(--serif);font-size:18px;font-style:italic;color:var(--text);}
  .context-link-arrow{margin-left:auto;font-size:14px;color:var(--text-dim);}

  .lede{font-family:var(--serif);font-size:clamp(19px,2vw,23px);line-height:1.55;color:var(--text);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border);}

  h2{font-family:var(--serif);font-weight:400;font-size:clamp(24px,2.8vw,32px);line-height:1.2;letter-spacing:-0.01em;margin:52px 0 18px;color:var(--text);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:17px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--text);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}

  .levers{display:flex;flex-direction:column;gap:12px;margin:28px 0 8px;}
  .lever-item{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start;padding:20px 22px;background:var(--bg-elev);border:1px solid var(--border);border-radius:6px;transition:border-color 0.2s;}
  .lever-item:hover{border-color:var(--border-strong);}
  .lever-num{font-family:var(--mono);font-size:13px;font-weight:500;color:var(--accent);padding-top:2px;}
  .lever-title{font-family:var(--sans);font-size:16px;font-weight:500;color:#fff;margin-bottom:6px;}
  .lever-desc{font-size:15px;color:var(--text-muted);line-height:1.6;margin:0;}
  .lever-src{font-family:var(--mono);font-size:11px;color:var(--text-dim);margin-top:8px;letter-spacing:0.04em;}

  .steps{display:flex;flex-direction:column;gap:0;margin:24px 0;}
  .step{display:grid;grid-template-columns:28px 1fr;gap:18px;align-items:start;position:relative;padding-bottom:24px;}
  .step:last-child{padding-bottom:0;}
  .step-line{position:absolute;left:13px;top:28px;bottom:0;width:1px;background:var(--border);}
  .step:last-child .step-line{display:none;}
  .step-dot{width:28px;height:28px;border-radius:50%;background:var(--bg-elev);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;color:var(--accent);flex-shrink:0;position:relative;z-index:1;}
  .step-content{padding-top:4px;}
  .step-title{font-size:16px;font-weight:500;color:#fff;margin-bottom:6px;}
  .step-desc{font-size:15px;color:var(--text-muted);line-height:1.6;margin:0;}
  .step-link{display:inline-block;margin-top:8px;font-family:var(--mono);font-size:11px;color:var(--text-muted);letter-spacing:0.05em;border-bottom:1px solid var(--border);text-decoration:none;transition:color 0.2s,border-color 0.2s;}
  .step-link:hover{color:var(--accent);border-color:var(--accent);}

  .profiles{display:flex;flex-direction:column;gap:16px;margin:28px 0;}
  .profile-card{padding:22px 24px;background:var(--bg-elev);border:1px solid var(--border);border-radius:6px;}
  .profile-card.alert{border-left:2px solid var(--accent);}
  .profile-card.moderee{border-left:2px solid rgba(251,191,36,0.55);}
  .profile-label{font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;}
  .profile-card.alert .profile-label{color:var(--accent);}
  .profile-card.moderee .profile-label{color:rgba(251,191,36,0.9);}
  .profile-body{font-size:16px;color:var(--text);line-height:1.65;margin:0;}

  .questions{display:flex;flex-direction:column;gap:12px;margin:24px 0;}
  .question-item{padding:18px 22px;background:var(--bg-elev);border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:4px;font-size:16px;color:var(--text);line-height:1.6;font-style:italic;font-family:var(--serif);}
  .question-to{display:block;font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px;font-style:normal;}

  .not-todo{display:flex;flex-direction:column;gap:12px;margin:24px 0;}
  .not-todo-item{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;padding:18px 22px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:6px;}
  .not-todo-cross{font-family:var(--mono);font-size:14px;color:var(--text-dim);padding-top:1px;}
  .not-todo-title{font-size:15px;font-weight:500;color:var(--text-muted);margin-bottom:4px;}
  .not-todo-reason{font-size:14px;color:var(--text-dim);line-height:1.55;margin:0;}

  .back-link{display:flex;align-items:center;gap:10px;margin-top:48px;font-family:var(--serif);font-size:18px;font-style:italic;color:var(--text-muted);text-decoration:none;transition:color 0.2s;}
  .back-link:hover{color:var(--accent);}

  .sources{margin-top:64px;padding-top:36px;border-top:1px solid var(--border);}
  .sources h2{font-size:18px;font-family:var(--mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:20px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:12px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:baseline;font-size:14px;color:var(--text-muted);line-height:1.55;}
  .src-tag{font-family:var(--mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);padding:3px 8px;border:1px solid var(--border);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--text);text-decoration:none;border-bottom:1px solid var(--border-strong);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .page-footer{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:36px 28px 72px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--text-muted);text-decoration:none;}
  .page-footer a:hover{color:var(--accent);}

  @media(max-width:768px){
    .article{padding:40px 22px 80px;}
    .nav-inner{padding:14px 22px;}
    h1{font-size:34px;}
    h2{font-size:24px;margin:40px 0 14px;}
    h2::before{display:none;}
    .lede{font-size:18px;padding-bottom:32px;margin-bottom:32px;}
    p{font-size:16px;}
    .lever-item{gap:14px;padding:16px 18px;}
    .profile-card,.question-item,.not-todo-item{padding:16px 18px;}
    .dates{padding:14px 16px;gap:14px;}
    .context-link{padding:14px 16px;}
  }
`;

const previewHtml = `
  <div class="article-meta">
    <span class="tag">Risques</span>
    <span class="tag tag-actionnable">Guide pratique</span>
    <span class="read-info">Lecture 7 min</span>
  </div>

  <h1>Face aux feux de forêts :<br/><em>débroussailler, préparer l'évacuation, connaître ses obligations</em></h1>

  <div class="dates">
    <div class="date-item">
      <span class="date-label">Publié</span>
      <span class="date-value">26 avril 2026</span>
    </div>
    <div class="date-sep"></div>
    <div class="date-item">
      <span class="date-label">Mis à jour</span>
      <span class="date-value date-value-muted">Aucune révision</span>
    </div>
  </div>

  <a href="/savoir/feux" class="context-link">
    <div>
      <div class="context-link-label">Page thématique associée</div>
      <div class="context-link-title">Feux de forêts en France : tendances, territoires exposés et facteurs de risque</div>
    </div>
    <span class="context-link-arrow">→</span>
  </a>

  <p class="lede">
    En 2022, environ 72 000 hectares ont brûlé en France métropolitaine selon les données Copernicus (EFFIS) : le volume le plus élevé depuis que des données fiables existent. Si la zone méditerranéenne concentre historiquement 90 % des surfaces brûlées (base Prométhée, 1973-2022), l'été 2022 a vu des incendies majeurs dans la Gironde, les Landes et la Bretagne. Ce mouvement est cohérent avec les projections climatiques. Cette page décrit ce que vous pouvez faire si vous vivez dans ou à proximité d'un massif forestier, à partir des obligations légales et des recommandations des services de défense des forêts contre l'incendie.
  </p>
`;

const fullHtml = `
  <h2>Ce que le risque signifie pour un logement à l'interface forêt-habitat</h2>
  <p>
    La notion d'interface forêt-habitat (IFH) désigne les zones où des habitations jouxtent ou sont incluses dans des massifs forestiers. C'est là que se produisent la quasi-totalité des pertes humaines et matérielles lors d'incendies. En France, les études du Cerema et de l'ONF estiment que plusieurs centaines de milliers de logements sont en situation d'IFH exposée. Un feu bien développé peut progresser à plusieurs dizaines de kilomètres par heure sous vent fort : dans le Var ou en Gironde, des fronts de feu ont atteint des habitations en moins de dix minutes depuis leur détection. Cette vitesse rend l'évacuation tardive très risquée.
  </p>
  <p>
    La propagation aux habitations suit généralement trois vecteurs : les braises transportées par le vent (parfois à plus d'un kilomètre devant le front principal), les flammes directes pour les constructions en lisière immédiate, et la chaleur rayonnante. Un logement dont les abords immédiats sont débroussaillés et dont les aérations sont fermées résiste mieux aux deux premiers vecteurs, ce qui laisse plus de temps pour évacuer et réduit les dommages même en cas de passage du feu.
  </p>

  <h2>Les trois leviers efficaces</h2>

  <div class="levers">
    <div class="lever-item">
      <div class="lever-num">01</div>
      <div class="lever-body">
        <div class="lever-title">Débroussailler selon l'obligation légale : la mesure la plus efficace</div>
        <p class="lever-desc">Le débroussaillement est la mesure de protection individuelle dont l'efficacité est la mieux documentée. Il s'agit de supprimer ou réduire la végétation basse dans un périmètre autour du bâtiment pour créer une discontinuité de combustible. En France, une obligation légale de débroussaillement (OBD) s'applique aux propriétaires de terrains situés à moins de 200 mètres des forêts dans les communes classées en massif forestier à risque (Code forestier, article L. 134-6). La distance réglementaire minimale autour des constructions est de 50 mètres, mais peut varier selon les départements (arrêté préfectoral). Le non-respect expose à une amende pouvant atteindre 5 000 euros, mais surtout à une mise en cause de la responsabilité civile si le feu se propage depuis votre propriété vers d'autres biens.</p>
        <div class="lever-src">Source : Code forestier, art. L. 134-6 et L. 134-18 · ONF, guide du débroussaillement réglementaire · SDIS</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">02</div>
      <div class="lever-body">
        <div class="lever-title">Adapter l'habitat pour résister aux braises et aux flammes</div>
        <p class="lever-desc">Lors du passage d'un front de feu, les braises transportées par le vent représentent le premier vecteur d'embrasement des habitations. Plusieurs mesures réduisent ce risque sans travaux lourds : fermer les aérations (ventilation haute et basse, extracteurs) avant d'évacuer pour empêcher les braises d'entrer dans les combles, arroser les abords immédiats et les toitures accessibles avant le départ si le temps le permet, retirer les matériaux combustibles stockés contre le bâtiment (tas de bois, mobilier de jardin en plastique). Les volets en aluminium ou en PVC résistent mieux à la chaleur rayonnante que les volets en bois non traité. Ces dispositions ne remplacent pas l'évacuation, mais réduisent les dommages si l'évacuation est tardive.</p>
        <div class="lever-src">Source : Cerema, guide de protection des constructions face aux incendies de forêt · DGPR, fiches pratiques DFCI</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">03</div>
      <div class="lever-body">
        <div class="lever-title">Planifier l'évacuation avant que le feu soit visible</div>
        <p class="lever-desc">L'analyse post-crise des décès lors d'incendies de forêt en France et en Europe indique que la majorité des victimes civiles ont tardé à évacuer. Les raisons documentées sont : l'attente d'un ordre officiel d'évacuation, la volonté de défendre le bien, ou la sous-estimation de la vitesse de progression du feu. L'évacuation préventive, dès qu'un incendie est signalé à moins de quelques kilomètres avec vent fort, est plus sûre qu'une évacuation sous fumée épaisse. Préparer ce scénario à l'avance - itinéraires, kit d'urgence, lieu d'hébergement de repli - permet d'agir vite sans délibérer dans l'urgence.</p>
        <div class="lever-src">Source : SDIS Var, retours d'expérience incendies · Sécurité civile, recommandations comportementales feux de forêt</div>
      </div>
    </div>
  </div>

  <h2>Comment vous préparer concrètement</h2>

  <div class="steps">
    <div class="step">
      <div class="step-dot">1</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier si votre commune est classée et si vous êtes soumis à l'OBD</div>
        <p class="step-desc">Le classement d'une commune en massif forestier à risque résulte d'un arrêté préfectoral. Votre mairie peut vous indiquer si votre commune est classée et si votre parcelle est dans le périmètre soumis à l'obligation légale de débroussaillement. Les SDIS (Services départementaux d'incendie et de secours) publient généralement les règles de débroussaillement en vigueur dans leur département, souvent plus précises que le minimum légal national.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">2</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Effectuer ou faire effectuer le débroussaillement avant la saison estivale</div>
        <p class="step-desc">Le débroussaillement réglementaire doit être réalisé avant le 15 juin dans la plupart des départements méditerranéens, date de début de la période à haut risque. Il consiste à couper les herbes, les arbustes et les broussailles à moins de 50 mètres des constructions, à élager les branches basses des arbres jusqu'à 2 mètres de hauteur, et à ne laisser aucun amas de végétation sèche coupée sur place après l'intervention. Le débroussaillement s'applique à votre terrain et peut également s'étendre sur les terrains voisins (avec accord des propriétaires ou mise en demeure par la commune).</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">3</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Identifier vos itinéraires d'évacuation et votre lieu de repli</div>
        <p class="step-desc">Identifiez au moins deux itinéraires d'évacuation depuis votre logement en direction opposée à la forêt et aux vents dominants estivaux. Vérifiez si votre commune dispose d'un Plan communal de sauvegarde (PCS) et d'un Plan de Massif forestier en consulter les points de rassemblement. Choisissez un lieu d'hébergement de repli (famille, hôtel, hébergement hors zone forestière) que vous pourriez rejoindre dans la nuit si nécessaire. Notez ces informations dans votre téléphone et communiquez-les aux membres de votre foyer.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">4</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Préparer un kit d'évacuation et configurer les alertes</div>
        <p class="step-desc">Préparez à l'avance un sac d'évacuation contenant : documents d'identité et d'assurance, médicaments, chargeur, eau et vêtements pour 48 heures. Configurez le dispositif FR-Alert sur votre téléphone : ce système de Cell Broadcast envoie des messages d'alerte directement aux téléphones présents dans une zone géographique, sans inscription préalable. Complétez avec les notifications de l'application Météo-France pour le risque incendie de forêt (Indice feux de forêt, IFF) et les alertes de votre SDIS local si celui-ci en propose.</p>
        <a href="https://www.alertes.gouv.fr" class="step-link" target="_blank" rel="noopener">alertes.gouv.fr · FR-Alert, dispositif national d'alerte ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">5</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier vos garanties d'assurance pour les incendies d'origine forestière</div>
        <p class="step-desc">Les dommages causés à un bâtiment ou à ses contenus par un feu d'origine forestière sont couverts par la garantie incendie des contrats multirisques habitation. Vérifiez que votre contrat couvre bien les pertes indirectes en cas d'évacuation prolongée (hébergement temporaire, frais annexes). En cas de destruction totale, la valeur de reconstruction à neuf est souvent différente de la valeur vénale du bien, et c'est la première qui doit être couverte. Revoir votre couverture à la hausse si vous avez réalisé des travaux depuis la souscription du contrat.</p>
      </div>
    </div>
  </div>

  <h2>Selon votre situation</h2>

  <div class="profiles">
    <div class="profile-card alert">
      <div class="profile-label">Exposition forte — maison isolée en interface forêt-habitat immédiate</div>
      <p class="profile-body">Si votre logement est enclavé dans un massif ou en lisière directe, avec une végétation dense à moins de 10 mètres, votre exposition est la plus forte. Le débroussaillement est non négociable : c'est la seule mesure documentée qui laisse à un bâtiment une chance de résister à un passage de feu sans présence humaine. Renseignez-vous auprès du SDIS de votre département pour obtenir un diagnostic de votre propriété, certains proposent ce service gratuitement dans les communes à risque.</p>
    </div>
    <div class="profile-card alert">
      <div class="profile-label">Exposition forte — résidence secondaire non occupée pendant l'été</div>
      <p class="profile-body">Une résidence secondaire inoccupée pendant la période à haut risque présente une vulnérabilité spécifique : personne pour déclencher l'alerte ou prendre les mesures d'urgence. Assurez-vous que le débroussaillement est effectué avant votre départ, que les aérations peuvent être fermées de l'extérieur, et que votre assureur est informé de la période de non-occupation. Certains contrats comportent des clauses restrictives en cas d'inoccupation prolongée.</p>
    </div>
    <div class="profile-card moderee">
      <div class="profile-label">Exposition modérée — lotissement en périphérie de massif</div>
      <p class="profile-body">Dans un lotissement, la responsabilité du débroussaillement est partagée entre les propriétaires individuels et, selon les cas, la copropriété ou l'association syndicale. Les parties communes (talus, accès, espaces verts) sont de la responsabilité du gestionnaire du lotissement. Vérifiez avec votre syndic ou votre association syndicale si les obligations légales de débroussaillement des parties communes sont respectées. Une seule parcelle non débroussaillée suffit à créer une continuité de combustible dans un lotissement.</p>
    </div>
    <div class="profile-card moderee">
      <div class="profile-label">Exposition nouvelle — commune hors zone méditerranéenne classée après 2022</div>
      <p class="profile-body">Les incendies de la Gironde et des Landes en 2022 ont conduit à réviser le périmètre des communes classées en zone à risque dans plusieurs régions. Si votre commune a été classée récemment, vous pouvez ne pas encore être informé de vos obligations légales de débroussaillement. Vérifiez le statut actuel de votre commune auprès de la préfecture ou de la mairie : le classement peut être plus récent que les informations disponibles sur les portails nationaux.</p>
    </div>
  </div>

  <h2>Les questions à poser</h2>

  <div class="questions">
    <div class="question-item">
      <span class="question-to">À votre mairie ou au SDIS de votre département</span>
      "Ma commune est-elle classée en massif forestier à risque d'incendie, et quelle est la distance réglementaire de débroussaillement applicable à ma parcelle selon l'arrêté préfectoral en vigueur ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre assureur</span>
      "Ma police couvre-t-elle les dommages causés par un incendie d'origine forestière, et quelles sont les conditions en cas d'inoccupation de plus de trente jours ? La valeur de reconstruction à neuf est-elle couverte ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre mairie</span>
      "La commune dispose-t-elle d'un Plan communal de sauvegarde avec des points de rassemblement définis pour les habitants en cas d'évacuation, et comment en obtenir une copie ?"
    </div>
    <div class="question-item">
      <span class="question-to">À vous-même, avant l'été</span>
      "Si un feu se déclarait à 5 kilomètres avec un vent fort, dans combien de minutes serais-je prêt à partir, et ai-je déjà vérifié que mes deux itinéraires d'évacuation ne traversent pas la zone forestière ?"
    </div>
  </div>

  <h2>Ce que vous n'avez pas à faire</h2>

  <div class="not-todo">
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Rester pour défendre votre bien une fois l'ordre d'évacuation donné</div>
        <p class="not-todo-reason">Les retours d'expérience des SDIS, notamment après les incendies de 2003 dans le Var et de 2022 en Gironde, montrent que la grande majorité des décès de civils surviennent parmi ceux qui n'ont pas évacué ou ont tenté de revenir. Défendre un bien sans entraînement, sans équipement et sans connaissance de l'évolution du feu augmente le risque sans garantir la protection du bâtiment. Un logement est reconstituable ; une vie ne l'est pas.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Ignorer l'obligation légale de débroussaillement pour des raisons esthétiques ou pratiques</div>
        <p class="not-todo-reason">L'OBD entraîne deux types de conséquences en cas de non-respect. La première est l'amende administrative (jusqu'à 5 000 euros), que la commune peut faire exécuter d'office aux frais du propriétaire. La seconde est la mise en jeu de la responsabilité civile si un feu se propage depuis votre propriété mal débroussaillée vers d'autres biens ou personnes. Un avocat spécialisé en droit forestier peut vous accompagner si vous contestez l'étendue ou la faisabilité de l'obligation sur votre parcelle.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Attendre l'ordre officiel d'évacuation pour partir si le feu est visible ou proche</div>
        <p class="not-todo-reason">L'évacuation sur ordre officiel est préférable car elle est coordonnée avec les secours. Mais les ordres peuvent être tardifs ou ne pas parvenir si la communication est perturbée par la fumée. Si un incendie actif est visible depuis votre domicile ou que vous percevez une forte odeur de fumée avec un vent soufflant en direction de votre logement, l'évacuation immédiate sans attendre est plus sûre qu'attendre une confirmation qui peut ne pas arriver.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Brûler des végétaux à l'air libre pendant la période à haut risque</div>
        <p class="not-todo-reason">Le brûlage des végétaux à l'air libre est strictement interdit dans la plupart des communes en zone forestière pendant la période à haut risque (généralement du 15 juin au 30 septembre selon les départements). Cette interdiction s'applique même aux végétaux issus du débroussaillement réglementaire. Les végétaux coupés doivent être broyés, compostés ou évacués en déchetterie. Un brûlage intempestif qui se propage peut entraîner des poursuites pénales.</p>
      </div>
    </div>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li><span class="src-tag">Prométhée</span><span>Base de données des incendies de forêt du bassin méditerranéen français depuis 1973. Statistiques par département et par an, surfaces brûlées et nombre de feux. <a href="https://www.promethee.com" target="_blank" rel="noopener">promethee.com</a>.</span></li>
      <li><span class="src-tag">Copernicus EFFIS</span><span>European Forest Fire Information System, données 2022 sur les surfaces brûlées en France métropolitaine, comparaison historique. <a href="https://effis.jrc.ec.europa.eu" target="_blank" rel="noopener">effis.jrc.ec.europa.eu</a>.</span></li>
      <li><span class="src-tag">Code forestier</span><span>Articles L. 134-6 à L. 134-21 : obligation légale de débroussaillement, périmètres, distances, sanctions et procédures d'exécution d'office. Légifrance.</span></li>
      <li><span class="src-tag">ONF</span><span>Office national des forêts, guide du débroussaillement réglementaire, règles pratiques par type de végétation et configurations de terrain. <a href="https://www.onf.fr" target="_blank" rel="noopener">onf.fr</a>.</span></li>
      <li><span class="src-tag">Cerema</span><span>Guide de protection des constructions contre les incendies de forêt, mesures de réduction de la vulnérabilité des bâtiments en interface forêt-habitat. <a href="https://www.cerema.fr" target="_blank" rel="noopener">cerema.fr</a>.</span></li>
      <li><span class="src-tag">FR-Alert</span><span>Dispositif national d'alerte par Cell Broadcast, actif depuis 2022 en France. Pas d'inscription nécessaire, information sur le fonctionnement. <a href="https://www.alertes.gouv.fr" target="_blank" rel="noopener">alertes.gouv.fr</a>.</span></li>
      <li><span class="src-tag">SDIS</span><span>Services départementaux d'incendie et de secours : règles locales de débroussaillement, diagnostics de propriété, plans de massif. Coordonnées disponibles via la préfecture de votre département.</span></li>
    </ul>
  </section>

  <a href="/savoir/feux" class="back-link">← Feux de forêts en France : tendances et territoires exposés</a>
`;

export default async function AgirFeuxForetsPage() {
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/savoir/feux">Savoir</Link>
            <span className="sep">/</span>
            Risques
            <span className="sep">/</span>
            Agir
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article className="article">
        <PaywallGate
          hasFullAccess={hasFullAccess}
          previewHtml={previewHtml}
          fullHtml={fullHtml}
          accent="#f97316"
        />
      </article>

      <footer className="page-footer">
        <div>futur•e · Agir / Risques</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
