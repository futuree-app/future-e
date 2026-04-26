import Link from 'next/link';
import type { Metadata } from 'next';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const metadata: Metadata = {
  title: "Comment limiter votre exposition au cadmium alimentaire · futur•e",
  description:
    "Les pistes documentées pour réduire votre exposition au cadmium par l'alimentation : leviers efficaces, étapes concrètes, profils et questions à poser.",
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
    --green-soft: rgba(74,222,128,0.1);
    --orange: #fb923c;
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
    .nav-crumb .step-home,.nav-crumb .step-home+.sep{display:none;}
  }
`;

const previewHtml = `
  <div class="article-meta">
    <span class="tag">Santé</span>
    <span class="tag tag-actionnable">Guide pratique</span>
    <span class="read-info">Lecture 5 min</span>
  </div>

  <h1>Comment limiter votre exposition au <em>cadmium alimentaire</em></h1>

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

  <a href="/savoir/cadmium" class="context-link">
    <div>
      <div class="context-link-label">Page thématique associée</div>
      <div class="context-link-title">Le cadmium dans l'alimentation</div>
    </div>
    <span class="context-link-arrow">→</span>
  </a>

  <p class="lede">
    Cette page rassemble les pistes documentées pour réduire votre exposition au cadmium par l'alimentation, à la suite de l'alerte de l'ANSES de mars 2026. Elle concerne principalement les choix alimentaires du quotidien. Elle ne remplace pas l'avis de votre médecin si vous vous interrogez sur votre exposition personnelle, notamment si vous êtes enceinte, si vous avez de jeunes enfants ou si vous habitez dans une zone à teneur élevée en cadmium des sols.
  </p>
`;

const fullHtml = `
  <h2>Ce qui est vraiment efficace</h2>
  <p>
    Trois leviers ont une efficacité documentée dans les avis de l'ANSES et de l'EFSA.
  </p>

  <div class="levers">
    <div class="lever-item">
      <div class="lever-num">01</div>
      <div class="lever-body">
        <div class="lever-title">Varier l'origine géographique de vos céréales</div>
        <p class="lever-desc">Les teneurs en cadmium varient fortement selon la géologie des sols. Les zones calcaires (Champagne, Charentes, Jura, Causses) concentrent naturellement plus de cadmium que les zones granitiques (Bretagne, Massif central ouest). En alternant les origines de vos farines, pâtes et pains, vous lissez votre exposition dans le temps.</p>
        <div class="lever-src">Source : ANSES recommandations 2026 · Efficacité documentée</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">02</div>
      <div class="lever-body">
        <div class="lever-title">Équilibrer pain complet et pain blanc</div>
        <p class="lever-desc">Le cadmium se concentre dans le son. Le pain complet contient donc plus de cadmium que le pain blanc, à rebours de la logique habituelle sur les fibres. L'EFSA documente un écart de 30 à 50 %. Alterner les deux types de pain, sans en supprimer aucun, est la recommandation raisonnée.</p>
        <div class="lever-src">Source : EFSA 2019 · INRAE · Efficacité documentée</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">03</div>
      <div class="lever-body">
        <div class="lever-title">Modérer la consommation régulière de coquillages</div>
        <p class="lever-desc">Les moules, huîtres et palourdes filtrent et concentrent les métaux lourds de l'eau de mer. Une consommation occasionnelle ne pose pas de problème particulier ; une consommation très régulière peut contribuer à une exposition supplémentaire chez certains profils.</p>
        <div class="lever-src">Source : ANSES · Efficacité contextuelle selon la fréquence de consommation</div>
      </div>
    </div>
  </div>

  <h2>Comment procéder concrètement</h2>

  <div class="steps">
    <div class="step">
      <div class="step-dot">1</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Regarder l'origine des farines sur vos achats de pain et de pâtes</div>
        <p class="step-desc">L'origine des céréales n'est pas obligatoire sur les produits transformés. Elle apparaît parfois chez les artisans boulangers ou les marques bio ; quand elle est absente, "blé français" ne distingue pas les teneurs par région.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">2</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Alterner pain de tradition et pain complet dans la semaine</div>
        <p class="step-desc">Vous n'avez pas à choisir l'un ou l'autre définitivement. Alterner sur plusieurs jours est suffisant pour réduire l'accumulation sans priver votre alimentation des fibres présentes dans le complet.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">3</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Consulter votre médecin si vous appartenez à un groupe exposé</div>
        <p class="step-desc">Si vous êtes enceinte, si vous avez un enfant de moins de trois ans, ou si vous vivez dans une zone cartographiée à teneur élevée en cadmium, la consultation d'un médecin permet d'évaluer si un dosage urinaire est justifié dans votre cas. Ce dosage est disponible en laboratoire d'analyses médicales sur prescription.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">4</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Consulter la carte GisSol pour votre commune</div>
        <p class="step-desc">La cartographie des teneurs en cadmium des sols est publique et gratuite. Elle permet de savoir si votre commune est dans une zone géologiquement chargée.</p>
        <a href="https://www.gissol.fr/donnees/cartes" class="step-link" target="_blank" rel="noopener">gissol.fr · Cartes des sols ↗</a>
      </div>
    </div>
  </div>

  <h2>Selon votre situation</h2>

  <div class="profiles">
    <div class="profile-card">
      <div class="profile-label">Adultes en général</div>
      <p class="profile-body">Les recommandations générales s'appliquent : varier les origines des céréales, alterner les types de pain, modérer les coquillages si votre consommation est très fréquente.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Enfants, en particulier moins de 3 ans</div>
      <p class="profile-body">Les enfants absorbent proportionnellement plus de cadmium que les adultes et leur régime est souvent très concentré sur les céréales. L'ANSES recommande de varier les céréales proposées dès le début de la diversification.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Femmes enceintes</div>
      <p class="profile-body">Le cadmium peut franchir la barrière placentaire. Les recommandations sont les mêmes que pour les autres adultes, mais avec une vigilance particulière sur la fréquence de consommation de coquillages et de produits issus de zones à forte teneur. Un point avec votre sage-femme est utile si vous habitez dans une zone identifiée.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Personnes vivant en zone à forte teneur (Charentes, Jura, Causses...)</div>
      <p class="profile-body">Votre exposition via les produits locaux peut être plus élevée. Cela justifie une attention renforcée à la diversification des origines, pas une éviction des produits locaux.</p>
    </div>
  </div>

  <h2>Les questions à poser</h2>

  <div class="questions">
    <div class="question-item">
      <span class="question-to">À votre médecin traitant</span>
      "Compte tenu de mon lieu de résidence et de mon alimentation habituelle, pensez-vous qu'un dosage urinaire du cadmium soit justifié dans mon cas ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre boulanger ou aux producteurs en circuit court</span>
      "D'où vient la farine que vous utilisez ? Est-ce une origine unique ou un mélange de plusieurs provenances ?"
    </div>
    <div class="question-item">
      <span class="question-to">À la pédiatre de votre enfant</span>
      "Faut-il adapter la diversification alimentaire de mon enfant compte tenu des alertes récentes sur le cadmium dans les céréales ?"
    </div>
  </div>

  <h2>Ce qui relève du collectif</h2>
  <p>
    Les ajustements alimentaires individuels réduisent l'exposition à la marge. La source principale du problème est structurelle : les teneurs élevées dans les sols agricoles résultent de décennies d'utilisation d'engrais phosphatés et, pour une part, de la géologie naturelle. Le levier collectif le plus direct est la réglementation européenne (règlement 2019/1009) sur les engrais phosphatés, dont plusieurs organisations estiment le calendrier trop lent. Les avis de l'ANSES sont consultables en accès libre.
  </p>

  <h2>Ce que vous n'avez pas à faire</h2>

  <div class="not-todo">
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Prendre des compléments alimentaires "détox" ou "chélateurs"</div>
        <p class="not-todo-reason">Aucun complément alimentaire vendu en grande surface ou en parapharmacie n'a démontré une efficacité sur l'élimination du cadmium accumulé dans les reins. Certains contiennent eux-mêmes des contaminants. L'ANSES ne recommande pas leur usage dans ce contexte.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Supprimer totalement le pain complet ou les céréales complètes</div>
        <p class="not-todo-reason">L'éviction totale du pain complet priverait votre alimentation de fibres et de micronutriments importants, sans bénéfice supplémentaire par rapport à une simple alternance. L'objectif est de varier, pas d'éliminer.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Passer à une alimentation sans gluten pour cette raison</div>
        <p class="not-todo-reason">L'éviction du gluten ne réduit pas l'exposition au cadmium. Cette décision relève de motifs médicaux spécifiques.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Boycotter les produits locaux de votre région</div>
        <p class="not-todo-reason">Même dans les zones à teneur élevée, les produits locaux ne sont pas à éviter. La diversification des origines est plus efficace et moins préjudiciable aux producteurs.</p>
      </div>
    </div>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li><span class="src-tag">ANSES</span><span>Alerte nationale sur l'exposition au cadmium alimentaire et recommandations, <a href="https://www.anses.fr" target="_blank" rel="noopener">anses.fr</a>, mars 2026.</span></li>
      <li><span class="src-tag">EFSA</span><span>Avis scientifique sur le cadmium alimentaire, dose hebdomadaire tolérable de 2,5 µg/kg p.c., <a href="https://www.efsa.europa.eu" target="_blank" rel="noopener">efsa.europa.eu</a>, 2019.</span></li>
      <li><span class="src-tag">GisSol</span><span>Carte des teneurs en cadmium total des horizons de surface, <a href="https://www.gissol.fr/donnees/cartes" target="_blank" rel="noopener">gissol.fr</a>.</span></li>
      <li><span class="src-tag">INRAE</span><span>Travaux sur le transfert sol-plante du cadmium et le rôle des engrais phosphatés.</span></li>
      <li><span class="src-tag">UE</span><span>Règlement 2019/1009 relatif aux fertilisants, plafonds progressifs de cadmium dans les engrais phosphatés jusqu'en 2035.</span></li>
    </ul>
  </section>

  <a href="/savoir/cadmium" class="back-link">← Comprendre le cadmium dans l'alimentation</a>
`;

export default async function CadmiumActionnablePage() {
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
            <span className="step-home">Savoir</span>
            <span className="sep">/</span>
            <Link href="/savoir/cadmium">Cadmium</Link>
            <span className="sep">/</span>
            Action
          </div>
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
        <div>futur•e · Savoir / Santé</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
