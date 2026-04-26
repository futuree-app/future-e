import Link from 'next/link';
import type { Metadata } from 'next';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Évaluer votre dépendance à la voiture et ses alternatives réelles · futur•e",
  description:
    "Une méthode concrète pour mesurer votre vulnérabilité de mobilité : coût réel, trajets pivots, alternatives effectives, sensibilité au prix du carburant.",
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
    --green: #4ade80;
    --green-soft: rgba(74,222,128,0.1);
    --blue: #60a5fa;
    --serif: 'Instrument Serif','Times New Roman',serif;
    --sans: 'Instrument Sans',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.3;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:480px;height:480px;background:radial-gradient(circle,#fb923c 0%,transparent 70%);top:-120px;left:-100px;}
  .orb-2{width:400px;height:400px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-100px;right:-80px;animation-delay:-6s;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.12) translate(15px,-22px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:rgba(6,8,18,0.65);border-bottom:1px solid var(--border);}
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

  .formula-box{margin:24px 0;padding:20px 24px;background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.18);border-radius:6px;}
  .formula-label{font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px;}
  .formula{font-family:var(--mono);font-size:14px;color:var(--text);line-height:1.7;}
  .formula-eq{color:var(--accent);font-weight:500;}
  .formula-note{font-size:13px;color:var(--text-dim);margin-top:10px;font-family:var(--sans);line-height:1.55;}

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
  .profile-label{font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px;}
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
    .formula-box{padding:16px 18px;}
  }
`;

const previewHtml = `
  <div class="article-meta">
    <span class="tag">Mobilité</span>
    <span class="tag tag-actionnable">Guide pratique</span>
    <span class="read-info">Lecture 6 min</span>
  </div>

  <h1>Évaluer votre dépendance à la voiture<br/>et ses <em>alternatives réelles</em></h1>

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

  <a href="/savoir/dependance-auto" class="context-link">
    <div>
      <div class="context-link-label">Page thématique associée</div>
      <div class="context-link-title">Pourquoi certains territoires rendent la voiture presque obligatoire</div>
    </div>
    <span class="context-link-arrow">→</span>
  </a>

  <p class="lede">
    Cette page propose une méthode concrète pour mesurer votre dépendance réelle à la voiture et identifier les alternatives qui existent effectivement dans votre territoire. Elle ne part pas du principe qu'il faut réduire votre usage de la voiture. Elle part du principe qu'il est utile de savoir précisément dans quelle mesure vous en dépendez structurellement, et ce que cela implique pour votre budget, votre résilience face à une hausse des carburants, et vos décisions de vie à moyen terme.
  </p>
`;

const fullHtml = `
  <h2>Ce qui est vraiment utile à mesurer</h2>
  <p>
    La plupart des foyers sous-estiment leur dépendance automobile parce qu'ils ne calculent que le carburant. Le coût réel d'une voiture en zone périurbaine dépendante dépasse rarement les 1 500 à 2 000 euros de carburant annuel que les gens gardent en tête. Il intègre l'amortissement du véhicule, l'assurance, l'entretien, les réparations et parfois le stationnement. Trois éléments permettent d'objectiver la situation.
  </p>

  <div class="levers">
    <div class="lever-item">
      <div class="lever-num">01</div>
      <div class="lever-body">
        <div class="lever-title">Calculer votre coût de mobilité total, pas seulement le carburant</div>
        <p class="lever-desc">L'ADEME estime le coût complet d'un véhicule entre 0,30 et 0,55 euro par kilomètre selon l'âge et la catégorie du véhicule, toutes charges incluses. Un foyer parcourant 20 000 km/an supporte entre 6 000 et 11 000 euros de coût réel. Le carburant n'en représente souvent que 25 à 35 %. Ignorer les charges fixes revient à se croire moins exposé que l'on ne l'est.</p>
        <div class="lever-src">Source : ADEME, calculateur calculautoeco.ademe.fr · Méthode documentée</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">02</div>
      <div class="lever-body">
        <div class="lever-title">Identifier vos trajets pivots, ceux sans alternative crédible</div>
        <p class="lever-desc">Ce n'est pas la voiture en général qui génère une fragilité, c'est les trajets pour lesquels elle est irremplaçable. Un trajet domicile-travail à 6h45 vers une zone industrielle mal desservie est un trajet pivot. Une course hebdomadaire au supermarché de 4 km en est rarement un. Savoir lesquels de vos trajets sont réellement pivots détermine votre vulnérabilité réelle.</p>
        <div class="lever-src">Source : Cerema, Mobilités dans les espaces peu denses · Méthode documentée</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">03</div>
      <div class="lever-body">
        <div class="lever-title">Vérifier les alternatives effectives, pas les connexions théoriques</div>
        <p class="lever-desc">Un transport en commun qui passe une fois par jour à 6h30 sans retour avant 18h n'est pas une alternative à un trajet domicile-travail à horaires variables. Les planificateurs d'itinéraires publics (SNCF, Navigo régional, Google Maps transports) donnent les connexions théoriques. L'alternative effective, c'est celle que vous pourriez utiliser demain sans réorganiser votre journée. Pour les trajets domicile-travail en zone périurbaine, les plateformes de covoiturage Klaxit et BlaBlaCar Daily se sont développées sur des axes spécifiques en dehors des grandes métropoles : elles permettent de vérifier si votre axe précis est couvert. Pour les trajets inférieurs à 15 kilomètres en zone périurbaine, le vélo à assistance électrique (VAE) est une alternative documentée par le Plan vélo national : à cette distance, le VAE est comparable en temps à la voiture en conditions normales de circulation, avec une disponibilité horaire totale.</p>
        <div class="lever-src">Source : Rapport Dumont, CGDD, 2023 · Plan vélo et mobilités actives 2023-2027 · klaxit.com · blablacar.fr/daily</div>
      </div>
    </div>
  </div>

  <h2>Comment procéder concrètement</h2>

  <div class="steps">
    <div class="step">
      <div class="step-dot">1</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Lister vos cinq trajets réguliers les plus fréquents</div>
        <p class="step-desc">Notez, pour chaque trajet : la destination, la fréquence hebdomadaire, les horaires habituels, la distance aller et l'heure de départ habituelle. Cinq trajets couvrent généralement 80 à 90 % du kilométrage annuel d'un foyer.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">2</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Calculer le coût annuel de chaque trajet, charges incluses</div>
        <p class="step-desc">Appliquez un coût au kilomètre réaliste selon votre véhicule. L'outil calculautoeco de l'ADEME fait ce calcul en détail. Pour une estimation rapide : multipliez votre kilométrage annuel par 0,42 euro/km pour un véhicule de moins de 5 ans, 0,35 pour un véhicule de 5 à 10 ans.</p>

        <div class="formula-box">
          <div class="formula-label">Estimation rapide de la sensibilité carburant</div>
          <div class="formula">
            Litres consommés/an × <span class="formula-eq">0,50 €</span> = variation de budget pour +50 ct/litre<br/>
            Exemple : 1 500 L/an × 0,50 € = <span class="formula-eq">750 €/an</span> d'exposition à chaque variation de 50 centimes
          </div>
          <div class="formula-note">Un foyer dont le budget carburant est de 2 000 €/an est exposé à une variation de 1 000 € si le prix monte de 50 centimes. Cela se produit en quelques semaines en période de tension.</div>
        </div>
        <a href="https://calculautoeco.ademe.fr" class="step-link" target="_blank" rel="noopener">calculautoeco.ademe.fr · Calculateur ADEME ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">3</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier les alternatives disponibles pour chaque trajet à vos horaires réels</div>
        <p class="step-desc">Pour chaque trajet de votre liste, cherchez la meilleure alternative non automobile aux horaires que vous utilisez réellement, pas à 9h si vous partez à 7h. Notez la durée porte-à-porte et les correspondances. Une alternative qui multiplie la durée par trois ou exige deux changements n'est pas une alternative crédible pour un trajet quotidien.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">4</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Identifier vos trajets pivots et évaluer le risque de rupture</div>
        <p class="step-desc">Un trajet pivot est un trajet pour lequel aucune alternative crédible n'existe dans votre territoire aux horaires que vous avez besoin. Pour chaque trajet pivot, posez-vous la question : que se passe-t-il concrètement si votre voiture tombe en panne pendant dix jours ? Si la réponse inclut une mise en danger de votre emploi, c'est un risque à prendre en compte dans vos décisions de vie.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">5</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Contacter votre Autorité organisatrice de mobilité locale</div>
        <p class="step-desc">Les AOM (régions, agglomérations, intercommunalités) ont l'obligation légale depuis la Loi d'orientation des mobilités de 2019 de couvrir l'ensemble du territoire. Certaines ont développé des services à la demande, des lignes de covoiturage ou des aides à la mobilité pour les actifs. Ces dispositifs sont souvent peu connus et sous-utilisés. Votre mairie peut vous indiquer l'AOM compétente pour votre commune.</p>
      </div>
    </div>
  </div>

  <h2>Selon votre situation</h2>

  <div class="profiles">
    <div class="profile-card">
      <div class="profile-label">Actif travaillant hors de sa commune (cas majoritaire en zone dépendante)</div>
      <p class="profile-body">Votre trajet domicile-travail est probablement votre trajet pivot principal. La question décisive est : existe-t-il une solution de covoiturage ou de transport collectif viable pour ce trajet précis ? Klaxit et BlaBlaCar Daily opèrent sur des axes périurbains spécifiques et permettent de vérifier directement si votre trajet est couvert. Si le trajet est inférieur à 15 kilomètres, un VAE subventionné (aides nationales et régionales cumulables) peut réduire significativement votre dépendance sur ce trajet unique, sans remettre en cause l'ensemble de votre usage automobile.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Foyer à revenus modestes (transport représente plus de 20 % du budget)</div>
      <p class="profile-body">Votre exposition aux hausses de carburant est proportionnellement la plus forte. Deux pistes documentées : les aides à la mobilité (Forfait Mobilités Durables, chèques mobilité de certains employeurs, aides CAF ou Pôle Emploi pour l'accès à l'emploi), et la mutualisation du véhicule avec d'autres ménages du même secteur. L'ADEME recense les dispositifs existants dans votre région.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Personne ne conduisant pas ou dont la capacité à conduire est incertaine à terme</div>
      <p class="profile-body">Ce profil concerne notamment les personnes de plus de 70 ans vivant en zone peu dense, et les personnes handicapées. Si votre ménage repose sur un seul conducteur, évaluer les alternatives avant d'en avoir besoin est utile. Les services de transport à la demande (TAD) et les taxis conventionnés existent dans certains territoires pour les trajets médicaux ; leur couverture est très inégale selon les communes.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Foyer envisageant un déménagement en périphérie ou en zone rurale</div>
      <p class="profile-body">La différence de prix du logement entre le centre et la périphérie d'une agglomération est souvent absorbée en quelques années par le surcoût de mobilité. Pour un foyer passant de zéro à deux voitures nécessaires, le coût supplémentaire peut dépasser 8 000 euros par an. Ce calcul est rarement fait au moment de la décision résidentielle, et les données de l'ADEME et de l'Observatoire des inégalités permettent de le faire.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Personne dépendant de la voiture pour ses rendez-vous médicaux</div>
      <p class="profile-body">En zone rurale ou périurbaine peu desservie, la capacité à accéder aux soins de santé repose souvent sur la possession d'un véhicule. Pour les personnes de plus de 70 ans ou celles dont la capacité à conduire peut évoluer, cette dépendance médicale est un trajet pivot distinct du trajet domicile-travail. Les transports sanitaires remboursés (VSL, ambulance) couvrent les trajets médicaux prescrits, mais pas les consultations de médecine générale courante. Les transports à la demande (TAD) conventionnés par les AOM ou les conseils départementaux couvrent parfois ce besoin dans certains territoires : votre médecin traitant ou votre CCAS peut vous indiquer ce qui existe dans votre zone.</p>
    </div>
  </div>

  <h2>Les questions à se poser</h2>

  <div class="questions">
    <div class="question-item">
      <span class="question-to">À se poser maintenant</span>
      "Si le prix de l'essence passait à 2,50 euros le litre demain, quel trajet deviendrait financièrement intenable en premier ?"
    </div>
    <div class="question-item">
      <span class="question-to">À se poser avant un déménagement</span>
      "Dans dix ou quinze ans, si je ne pouvais plus conduire, est-ce que la vie dans ce lieu resterait possible sans restructurer complètement mon quotidien ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre employeur ou service RH</span>
      "Existe-t-il un Forfait Mobilités Durables dans mon entreprise, et couvre-t-il le covoiturage ou les transports en commun que je pourrais utiliser ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre mairie ou intercommunalité</span>
      "Quels services de transport à la demande ou de covoiturage organisé sont disponibles pour les déplacements professionnels depuis notre commune ?"
    </div>
  </div>

  <h2>Ce qui relève du collectif et ce qui relève de vous</h2>
  <p>
    L'évaluation individuelle permet de savoir où vous en êtes. Elle ne résout pas les causes structurelles de la dépendance. Ces causes relèvent de décisions d'aménagement du territoire (densification, localisation des services et des emplois) et d'investissements dans les alternatives (transport à la demande, covoiturage organisé, voies cyclables sécurisées dans les zones périurbaines). La Loi d'orientation des mobilités de 2019 a posé des obligations légales pour couvrir tous les territoires, mais leur mise en oeuvre reste très inégale. Les associations d'usagers des transports et les collectifs locaux de mobilité sont un levier documenté pour accélérer le déploiement dans les zones encore insuffisamment couvertes.
  </p>
  <p>
    Ce qui relève de vous dans l'immédiat : vérifier si les alternatives qui existent sur votre axe spécifique sont effectivement connues de vous. Klaxit, BlaBlaCar Daily et les lignes régionales de covoiturage subventionné (certaines régions prennent en charge une partie du trajet) fonctionnent parfois sur des axes qui n'ont pas été publicisés localement. Le fait qu'une solution existe sans que vous en soyez informé est fréquent. Ce n'est pas un argument contre la démarche individuelle d'exploration, c'est un argument pour la faire concrètement.
  </p>

  <h2>Ce que vous n'avez pas à faire</h2>

  <div class="not-todo">
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Calculer uniquement le carburant pour estimer votre coût de mobilité</div>
        <p class="not-todo-reason">Le carburant représente en général 25 à 35 % du coût total d'un véhicule. Ignorer l'amortissement, l'assurance et l'entretien conduit à sous-estimer d'un facteur deux à trois votre coût réel, et donc votre exposition effective.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Traiter les connexions théoriques comme des alternatives réelles</div>
        <p class="not-todo-reason">Une ligne qui existe sur la carte et une alternative utilisable à vos horaires sont deux choses différentes. Vérifiez toujours la fréquence, les horaires aux moments où vous en avez besoin, et la durée porte-à-porte réelle, pas le trajet seul.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Considérer la voiture électrique comme la solution à la dépendance</div>
        <p class="not-todo-reason">Passer à l'électrique réduit la sensibilité au prix du carburant et les émissions de gaz à effet de serre, mais ne réduit pas la dépendance structurelle à la voiture. Si votre trajet pivot est uniquement faisable en voiture, un changement de motorisation ne change pas votre vulnérabilité à la panne, à la perte de permis ou au coût global du véhicule.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Traiter cette question uniquement comme un choix individuel</div>
        <p class="not-todo-reason">La dépendance automobile dans les zones peu denses est d'abord un résultat de choix d'aménagement collectifs, pas d'un mode de vie choisi. Se sentir responsable individuellement d'une situation largement déterminée par la configuration du territoire n'est ni juste ni utile.</p>
      </div>
    </div>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li><span class="src-tag">ADEME</span><span>Calculateur de coût de revient automobile, <a href="https://calculautoeco.ademe.fr" target="_blank" rel="noopener">calculautoeco.ademe.fr</a>. Méthode de référence pour le calcul du coût complet d'un véhicule toutes charges incluses.</span></li>
      <li><span class="src-tag">ADEME</span><span>Prospective Transition(s) 2050, scénarios de mobilité et coût des déplacements selon les territoires, <a href="https://librairie.ademe.fr" target="_blank" rel="noopener">librairie.ademe.fr</a>, édition 2024.</span></li>
      <li><span class="src-tag">INSEE</span><span>Déplacements domicile-travail et flux selon le mode de transport principal, <a href="https://www.data.gouv.fr/fr/datasets/deplacements-domicile-travail/" target="_blank" rel="noopener">data.gouv.fr</a>, mis à jour 2026.</span></li>
      <li><span class="src-tag">Cerema</span><span>Mobilités dans les espaces peu denses et les solutions de continuité territoriale, incluant les données sur les transports à la demande, cerema.fr.</span></li>
      <li><span class="src-tag">CGDD</span><span>Rapport Dumont sur les mobilités du quotidien dans les territoires ruraux et périurbains, 2023. Analyse des alternatives réelles et des freins à leur déploiement.</span></li>
      <li><span class="src-tag">Obs. inégalités</span><span>Part des dépenses de transport dans les budgets selon la localisation résidentielle et le revenu, <a href="https://www.inegalites.fr" target="_blank" rel="noopener">inegalites.fr</a>.</span></li>
      <li><span class="src-tag">LOM 2019</span><span>Loi d'orientation des mobilités, obligations des Autorités organisatrices de mobilité à couvrir l'ensemble du territoire national, Legifrance.</span></li>
      <li><span class="src-tag">Klaxit</span><span>Plateforme de covoiturage domicile-travail subventionné, présente sur certains axes périurbains en partenariat avec les collectivités. Vérification de couverture par commune et axe sur <a href="https://www.klaxit.com" target="_blank" rel="noopener">klaxit.com</a>.</span></li>
      <li><span class="src-tag">BlaBlaCar Daily</span><span>Covoiturage quotidien court trajet, notamment pour les zones périurbaines non desservies par les transports collectifs. <a href="https://www.blablacar.fr/daily" target="_blank" rel="noopener">blablacar.fr/daily</a>.</span></li>
      <li><span class="src-tag">Plan vélo</span><span>Plan vélo et mobilités actives 2023-2027 : données sur le développement du VAE et les aides à l'achat (bonus vélo, aide des collectivités), Ministère des Transports.</span></li>
    </ul>
  </section>

  <a href="/savoir/dependance-auto" class="back-link">← Pourquoi certains territoires rendent la voiture presque obligatoire</a>
`;

export default async function AgirDependanceAutoPage() {
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
            <Link href="/savoir/dependance-auto">Savoir</Link>
            <span className="sep">/</span>
            Mobilité
            <span className="sep">/</span>
            Agir
          </div>
        </div>
      </nav>

      <article className="article">
        <PaywallGate
          hasFullAccess={hasFullAccess}
          previewHtml={previewHtml}
          fullHtml={fullHtml}
          accent="#fb923c"
        />
      </article>

      <footer className="page-footer">
        <div>futur•e · Agir / Mobilité</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
