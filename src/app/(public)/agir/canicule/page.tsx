import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Se préparer à la canicule : ce qui protège vraiment · futur•e",
  description:
    "Les gestes efficaces et les conditions qui déterminent votre exposition lors d'un épisode caniculaire : ventilation nocturne, hydratation adaptée, personnes vulnérables, registre municipal.",
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
    --accent: #f87171;
    --accent-soft: rgba(248,113,113,0.12);
    --accent-border: rgba(248,113,113,0.28);
    --green: #4ade80;
    --green-soft: rgba(74,222,128,0.10);
    --green-border: rgba(74,222,128,0.22);
    --blue: #60a5fa;
    --serif: 'Instrument Serif','Times New Roman',serif;
    --sans: 'Instrument Sans',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.3;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:480px;height:480px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:-120px;left:-100px;}
  .orb-2{width:400px;height:400px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-100px;right:-80px;animation-delay:-6s;}
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
  .profile-card.haute{border-left:2px solid var(--accent);}
  .profile-card.moderee{border-left:2px solid rgba(251,146,60,0.55);}
  .profile-label{font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;}
  .profile-card.haute .profile-label{color:var(--accent);}
  .profile-card.moderee .profile-label{color:rgba(251,146,60,0.9);}
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
    <span class="tag">Santé</span>
    <span class="tag tag-actionnable">Guide pratique</span>
    <span class="read-info">Lecture 7 min</span>
  </div>

  <h1>Se préparer à la canicule :<br/><em>ce qui protège vraiment</em></h1>

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

  <a href="/savoir/canicule" class="context-link">
    <div>
      <div class="context-link-label">Page thématique associée</div>
      <div class="context-link-title">Chaleur urbaine, seuils caniculaires et santé en France</div>
    </div>
    <span class="context-link-arrow">→</span>
  </a>

  <p class="lede">
    La canicule d'août 2003 a causé environ 15 000 décès excédentaires en France en moins de trois semaines, selon Santé publique France et l'Inserm. Neuf décès sur dix ont eu lieu à domicile. Les épisodes de 2019 (environ 2 500 décès) et de 2022 (environ 10 400 décès sur trois vagues successives) ont montré que cette mortalité diminue quand des mesures spécifiques sont en place et que les personnes vulnérables ne sont pas isolées. Cette page décrit ce qui fonctionne à l'échelle du logement et de la personne, à partir des recommandations des autorités sanitaires françaises.
  </p>
`;

const fullHtml = `
  <h2>Ce que les données montrent</h2>
  <p>
    La mortalité caniculaire suit des profils répétables d'un épisode à l'autre. La canicule de 2003 a touché les 75 ans et plus à hauteur de 92 % des décès excédentaires selon l'Inserm, la grande majorité dans des logements sous les toits ou en dernier étage, chez des personnes vivant seules. En 2022, Santé publique France a identifié les mêmes facteurs dans son bilan de surmortalité : isolement social, logement mal ventilé, incapacité à adapter son environnement thermique, et pour une part significative, interaction avec un traitement médicamenteux.
  </p>
  <p>
    Ce que l'on sait avec certitude : les bilans épidémiologiques de 2003, 2019 et 2022 documentent des mécanismes stables et reproductibles. Ce que les projections de Météo-France et du GIEC indiquent : la fréquence et l'intensité des épisodes caniculaires devraient augmenter d'ici 2050 dans tous les scénarios d'émissions. Ces deux niveaux de connaissance sont distincts. Cette page porte sur le premier : ce qui est documenté et applicable maintenant.
  </p>

  <h2>Les leviers efficaces au niveau du logement</h2>
  <p>
    L'essentiel de la protection contre la chaleur extrême se joue dans le logement. Trois leviers ont un effet démontré et ne nécessitent pas d'installation coûteuse.
  </p>

  <div class="levers">
    <div class="lever-item">
      <div class="lever-num">01</div>
      <div class="lever-body">
        <div class="lever-title">Ventilation nocturne et occultation diurne</div>
        <p class="lever-desc">Ouvrir largement les fenêtres la nuit quand la température extérieure descend en dessous de la température intérieure, puis fermer et occulter dès le matin avant que le soleil chauffe la façade. Cette technique de free cooling passif peut maintenir l'intérieur à 5 à 10 degrés de moins que l'extérieur en journée, selon le Cerema. L'occultation est particulièrement efficace sur les façades sud et ouest : des volets fermés bloquent 60 à 80 % du rayonnement solaire entrant, selon l'orientation. Si vous n'avez pas de volets extérieurs, un film opaque ou des rideaux épais côté intérieur apportent une protection partielle mais réelle.</p>
        <div class="lever-src">Source : Cerema, Bâtiments et confort d'été · ANSES, recommandations chaleur 2024</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">02</div>
      <div class="lever-body">
        <div class="lever-title">Réduire l'exposition directe au soleil entre 11 h et 19 h</div>
        <p class="lever-desc">L'exposition au rayonnement solaire direct est un facteur de risque indépendant de la température ambiante. Rester à l'ombre, réduire les déplacements extérieurs aux heures les plus chaudes et planifier les sorties avant 11 h ou après 19 h est une mesure dont l'efficacité est documentée dans les bilans de Santé publique France. Les activités physiques intenses restent déconseillées même à l'ombre au-delà de 35 degrés extérieurs, et ce quelle que soit votre condition physique habituelle.</p>
        <div class="lever-src">Source : Santé publique France, bilans caniculaires 2022 · ANSES, recommandations vague de chaleur 2024</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">03</div>
      <div class="lever-body">
        <div class="lever-title">Hydratation adaptée, en particulier pour les personnes âgées</div>
        <p class="lever-desc">Boire régulièrement sans attendre la soif est la consigne de base pour tous. Pour les personnes âgées lors d'épisodes prolongés, l'eau seule n'est pas toujours suffisante : ingérer uniquement de grandes quantités d'eau sans apport en sel peut provoquer une hyponatrémie (dilution du sodium sanguin) dont les symptômes ressemblent à ceux de la déshydratation, notamment la confusion et la fatigue. Les solutions de réhydratation orale (SRO), disponibles en pharmacie sans ordonnance, apportent les électrolytes nécessaires. Cette précision est rarement communiquée dans les campagnes générales de prévention canicule.</p>
        <div class="lever-src">Source : Société française de médecine d'urgence · ANSES, recommandations nutrition chaleur · HAS, fiches pratiques canicule</div>
      </div>
    </div>
  </div>

  <h2>Comment vous préparer avant le prochain épisode</h2>

  <div class="steps">
    <div class="step">
      <div class="step-dot">1</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Configurer les alertes Météo-France Vigilance pour votre département</div>
        <p class="step-desc">Le Plan national canicule déclenche des niveaux d'alerte à partir de seuils de température spécifiques à chaque département, définis selon sa zone climatique. Les seuils ne sont pas les mêmes pour Marseille et pour Strasbourg. L'application Météo-France et le site vigilance.meteofrance.fr permettent de recevoir une notification dès le passage en vigilance orange ou rouge. Configurer cette alerte à l'avance prend deux minutes et évite de dépendre des médias pour savoir que les seuils de votre zone ont été franchis.</p>
        <a href="https://vigilance.meteofrance.fr" class="step-link" target="_blank" rel="noopener">vigilance.meteofrance.fr · Alertes et seuils par département ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">2</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Identifier la pièce la plus fraîche de votre logement</div>
        <p class="step-desc">Dans la plupart des logements, la pièce la plus fraîche en journée est orientée au nord ou au nord-est, au rez-de-chaussée ou en sous-sol si ce dernier est accessible. Identifier cette pièce avant un épisode et préparer un espace où vous pouvez vous installer plusieurs heures (matelas, eau, rideau occultant) est une mesure de base recommandée par le Plan national canicule. Le sol peut être légèrement rafraîchi en vaporisant de l'eau sur le carrelage ou le parquet avant de fermer la pièce.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">3</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Repérer les espaces frais publics accessibles dans votre commune</div>
        <p class="step-desc">Lors des vigilances orange et rouge, les mairies ont l'obligation d'ouvrir ou de signaler des espaces rafraîchisseurs accessibles gratuitement : salles municipales, médiathèques, gymnases climatisés. En dehors des périodes d'alerte, les bibliothèques, les grandes surfaces et certains musées constituent des refuges thermiques utilisables sans justification. Repérer les deux ou trois plus proches de chez vous avant un épisode réduit le délai de décision au moment où vous ou votre entourage en aurez besoin.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">4</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier avec votre médecin si votre traitement requiert une adaptation</div>
        <p class="step-desc">Certains médicaments réduisent la capacité de thermorégulation ou augmentent la déshydratation lors d'épisodes caniculaires : diurétiques, antihypertenseurs (notamment les inhibiteurs de l'enzyme de conversion et les sartans), antipsychotiques, antiparkinsoniens, certains anxiolytiques et antidépresseurs tricycliques. La Haute Autorité de Santé recommande de discuter avec son médecin traitant avant l'été des adaptations éventuelles et des signes d'alerte spécifiques à son traitement. Ne modifiez pas votre traitement sans avis médical.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">5</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Inscrire une personne vulnérable sur le registre communal canicule</div>
        <p class="step-desc">Depuis 2004, les communes peuvent tenir un registre des personnes vulnérables (personnes âgées isolées, personnes en situation de handicap) pour faciliter leur contact lors des alertes. Ce registre est volontaire, géré par le Centre communal d'action sociale (CCAS) et confidentiel. L'inscription permet à la commune d'effectuer des vérifications lors des alertes rouges. Votre mairie ou CCAS peut vous indiquer si ce registre existe dans votre commune et comment y inscrire un proche.</p>
      </div>
    </div>
  </div>

  <h2>Selon votre situation</h2>

  <div class="profiles">
    <div class="profile-card haute">
      <div class="profile-label">Exposition élevée — personnes âgées isolées, logement sous les toits</div>
      <p class="profile-body">Le profil le plus exposé combine plusieurs facteurs documentés dans les bilans post-canicule : plus de 75 ans, vivant seul, logement sous les combles ou en dernier étage sans occultation efficace, peu de contacts sociaux réguliers. C'est ce profil qui a représenté la grande majorité des décès de 2003 et 2022 selon Santé publique France et l'Inserm. La priorité est d'identifier ce profil dans votre entourage proche et d'établir un contact quotidien pendant les épisodes d'alerte orange ou rouge.</p>
    </div>
    <div class="profile-card haute">
      <div class="profile-label">Exposition élevée — personnes sous traitement affectant la thermorégulation</div>
      <p class="profile-body">Les personnes prenant des diurétiques, des antihypertenseurs de type IEC ou sartan, des antipsychotiques ou des médicaments antiparkinsoniens présentent une capacité réduite à thermoréguler ou un risque accru de déshydratation par interaction médicamenteuse. Cette interaction est documentée par l'ANSES et la Haute Autorité de Santé. La démarche utile est d'en parler en consultation avant l'été, pas d'attendre l'alerte, pour connaître la conduite à tenir spécifique à son traitement.</p>
    </div>
    <div class="profile-card moderee">
      <div class="profile-label">Exposition modérée — travailleurs en extérieur</div>
      <p class="profile-body">Le Code du travail impose des obligations aux employeurs lors de chaleur extrême : aménagement des horaires de travail, fourniture d'eau fraîche, accès à un espace à l'ombre, vêtements adaptés. Si ces mesures ne sont pas mises en place lors d'une vigilance orange ou rouge, vous pouvez contacter l'inspection du travail. Le droit de retrait s'applique en cas de danger grave et imminent, y compris pour les travailleurs exposés à la chaleur extérieure.</p>
    </div>
    <div class="profile-card moderee">
      <div class="profile-label">Exposition modérée — adultes en bonne santé dans un logement ventilable</div>
      <p class="profile-body">Pour un adulte en bonne santé sans traitement médicamenteux spécifique, vivant dans un logement ventilable, les mesures de base suffisent dans la grande majorité des épisodes caniculaires observés en France depuis 2003 : limiter l'exposition directe aux heures chaudes, boire régulièrement, appliquer la ventilation nocturne et l'occultation diurne. Le risque principal n'est pas l'hyperthermie personnelle mais la méconnaissance des personnes vulnérables dans l'entourage immédiat.</p>
    </div>
  </div>

  <h2>Les questions à poser</h2>

  <div class="questions">
    <div class="question-item">
      <span class="question-to">À votre médecin traitant, avant l'été</span>
      "Mon traitement actuel nécessite-t-il une adaptation ou une surveillance particulière lors d'un épisode caniculaire, et quels sont les signes qui doivent m'alerter ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre mairie ou CCAS</span>
      "Où se trouve l'espace rafraîchisseur municipal le plus proche, et comment inscrire une personne âgée isolée sur le registre canicule de la commune ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre bailleur ou au syndic de copropriété</span>
      "Est-il possible d'installer des stores extérieurs ou des volets sur les fenêtres les plus exposées au soleil de l'après-midi, et quelle est la procédure pour les occupants ?"
    </div>
    <div class="question-item">
      <span class="question-to">À vous-même, en regardant votre entourage</span>
      "Qui autour de moi combine les facteurs de risque documentés : plus de 75 ans, vivant seul, peu de contacts réguliers ? Ai-je un moyen de les contacter quotidiennement lors du prochain épisode d'alerte ?"
    </div>
  </div>

  <h2>Ce que vous n'avez pas à faire</h2>

  <div class="not-todo">
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Utiliser un ventilateur seul quand la température dépasse 35 degrés</div>
        <p class="not-todo-reason">Au-delà de 35 degrés ambiants, un ventilateur souffle de l'air chaud sur la peau et accélère la transpiration sans abaisser la température corporelle. Il augmente la perte hydrique et peut aggraver la déshydratation, notamment chez les personnes âgées. L'ANSES recommande de ne pas utiliser le ventilateur seul au-delà de ce seuil, et de l'associer à une vaporisation régulière d'eau sur la peau, ou de préférer un espace climatisé.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Supposer que la climatisation collective de l'immeuble ou du lieu de travail suffit</div>
        <p class="not-todo-reason">Les systèmes de climatisation collective peuvent tomber en panne ou être insuffisants lors d'épisodes prolongés ou de pics de consommation simultanée. Connaître les espaces frais alternatifs accessibles près de chez soi ou de son lieu de travail avant un épisode permet de ne pas dépendre d'un seul système lors d'une alerte rouge.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Modifier votre traitement médicamenteux sans avis médical pendant une canicule</div>
        <p class="not-todo-reason">Même si certains médicaments sont documentés comme facteurs de risque en chaleur extrême, les arrêter ou en modifier la dose sans avis médical peut être dangereux. La démarche correcte est d'en avoir discuté avant l'été, en consultation programmée, pour connaître la conduite à tenir lors d'un épisode avec votre traitement spécifique.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Attendre les symptômes de déshydratation pour commencer à boire</div>
        <p class="not-todo-reason">La sensation de soif est un indicateur retardé, particulièrement peu fiable chez les personnes âgées, dont le mécanisme de la soif est moins sensible avec l'âge. Attendre d'avoir soif pour boire signifie commencer à s'hydrater après que la déshydratation est déjà amorcée. La consigne de boire régulièrement, toutes les heures environ, s'applique même en l'absence de sensation de soif lors d'un épisode caniculaire.</p>
      </div>
    </div>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li><span class="src-tag">SPF</span><span>Santé publique France, Bilan de la surveillance sanitaire de la canicule de l'été 2022, octobre 2022. Estimation de la surmortalité par épisode, par tranche d'âge et par région. <a href="https://www.santepubliquefrance.fr" target="_blank" rel="noopener">santepubliquefrance.fr</a>.</span></li>
      <li><span class="src-tag">Inserm</span><span>Analyse épidémiologique de la canicule d'août 2003 en France. Surmortalité par tranche d'âge, lieu de décès et facteurs de risque associés. <a href="https://www.inserm.fr" target="_blank" rel="noopener">inserm.fr</a>.</span></li>
      <li><span class="src-tag">Météo-France</span><span>Plan national canicule, seuils de vigilance départementaux et documentation sur les niveaux d'alerte. <a href="https://vigilance.meteofrance.fr" target="_blank" rel="noopener">vigilance.meteofrance.fr</a>.</span></li>
      <li><span class="src-tag">ANSES</span><span>Recommandations pour la protection de la santé face aux vagues de chaleur, fiches pratiques 2024. Inclut les interactions médicamenteuses, la nutrition et l'usage du ventilateur. <a href="https://www.anses.fr" target="_blank" rel="noopener">anses.fr</a>.</span></li>
      <li><span class="src-tag">HAS</span><span>Haute Autorité de Santé, fiche mémo sur les précautions médicamenteuses en situation de chaleur extrême. Classes thérapeutiques à surveiller et conduite à tenir.</span></li>
      <li><span class="src-tag">Cerema</span><span>Confort d'été dans les bâtiments, free cooling passif et efficacité de l'occultation solaire selon l'orientation, données mesurées sur sites. <a href="https://www.cerema.fr" target="_blank" rel="noopener">cerema.fr</a>.</span></li>
      <li><span class="src-tag">CCAS</span><span>Registre communal des personnes vulnérables, mis en place dans le cadre du Plan national canicule depuis 2004. Renseignements auprès du Centre communal d'action sociale de votre mairie.</span></li>
    </ul>
  </section>

  <a href="/savoir" class="back-link">← Pages thématiques</a>
`;

export default async function AgirCaniculePage() {
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
            <Link href="/savoir">Savoir</Link>
            <span className="sep">/</span>
            Santé
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
          accent="#f87171"
        />
      </article>

      <footer className="page-footer">
        <div>futur•e · Agir / Santé</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
