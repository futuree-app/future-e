import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Passer à l'électrique : ce qui a du sens selon votre territoire · futur•e",
  description:
    "Les conditions réelles qui déterminent si un véhicule électrique a du sens pour votre usage : kilométrage, recharge à domicile, trajets longs, coût total de possession.",
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
  .orb-1{width:480px;height:480px;background:radial-gradient(circle,#fb923c 0%,transparent 70%);top:-120px;left:-100px;}
  .orb-2{width:400px;height:400px;background:radial-gradient(circle,#4ade80 0%,transparent 70%);bottom:-100px;right:-80px;opacity:0.18;animation-delay:-6s;}
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
  .tag-actionnable{background:var(--green-soft);border-color:var(--green-border);color:var(--green);}
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

  .conditions{display:flex;flex-direction:column;gap:10px;margin:28px 0 8px;}
  .cond-item{display:grid;grid-template-columns:24px 1fr;gap:16px;align-items:start;padding:18px 20px;background:var(--bg-elev);border:1px solid var(--border);border-radius:6px;}
  .cond-item.yes{border-left:2px solid var(--green);}
  .cond-item.no{border-left:2px solid rgba(255,255,255,0.18);}
  .cond-icon{font-family:var(--mono);font-size:13px;padding-top:1px;}
  .cond-icon.yes{color:var(--green);}
  .cond-icon.no{color:var(--text-dim);}
  .cond-title{font-size:15px;font-weight:500;color:#fff;margin-bottom:5px;}
  .cond-item.no .cond-title{color:var(--text-muted);}
  .cond-desc{font-size:14px;color:var(--text-muted);line-height:1.6;margin:0;}
  .cond-item.no .cond-desc{color:var(--text-dim);}
  .cond-src{font-family:var(--mono);font-size:11px;color:var(--text-dim);margin-top:7px;letter-spacing:0.04em;}

  .tco-table{margin:28px 0;border:1px solid var(--border);border-radius:6px;overflow:hidden;}
  .tco-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--border);}
  .tco-row:last-child{border-bottom:none;}
  .tco-head{background:rgba(255,255,255,0.03);}
  .tco-cell{padding:14px 16px;font-size:14px;color:var(--text-muted);}
  .tco-head .tco-cell{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);}
  .tco-cell:not(:last-child){border-right:1px solid var(--border);}
  .tco-cell.hi{color:var(--green);font-weight:500;}
  .tco-cell.neutral{color:var(--text);}
  .tco-note{padding:12px 16px;font-family:var(--mono);font-size:11px;color:var(--text-dim);letter-spacing:0.04em;border-top:1px solid var(--border);background:rgba(255,255,255,0.015);}

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
  .profile-card.favorable{border-left:2px solid var(--green);}
  .profile-card.defavorable{border-left:2px solid rgba(255,255,255,0.12);}
  .profile-label{font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;}
  .profile-card.favorable .profile-label{color:var(--green);}
  .profile-card.defavorable .profile-label{color:var(--text-dim);}
  .profile-body{font-size:16px;color:var(--text);line-height:1.65;margin:0;}
  .profile-card.defavorable .profile-body{color:var(--text-muted);}

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
    .cond-item{gap:12px;padding:14px 16px;}
    .tco-row{grid-template-columns:1fr 1fr;}
    .tco-row .tco-cell:last-child{display:none;}
    .profile-card,.question-item,.not-todo-item{padding:16px 18px;}
    .dates{padding:14px 16px;gap:14px;}
    .context-link{padding:14px 16px;}
  }
`;

const previewHtml = `
  <div class="article-meta">
    <span class="tag">Mobilité</span>
    <span class="tag tag-actionnable">Guide pratique</span>
    <span class="read-info">Lecture 7 min</span>
  </div>

  <h1>Passer à l'électrique : ce qui a du sens<br/><em>selon votre territoire</em></h1>

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
    Le véhicule électrique est souvent présenté comme la réponse évidente à la dépendance automobile et à la hausse du prix des carburants. La réalité est plus fine. Le passage à l'électrique réduit certaines fragilités et en laisse d'autres entières. Cette page décrit les conditions réelles qui déterminent si ce changement a du sens pour votre situation, votre usage et votre territoire — sans parti pris pour ou contre, à partir des données disponibles.
  </p>
`;

const fullHtml = `
  <h2>Les conditions qui rendent l'électrique pertinent</h2>
  <p>
    Le véhicule électrique n'est ni universellement rentable ni universellement inadapté. Trois conditions déterminent l'essentiel de l'équation économique et pratique.
  </p>

  <div class="conditions">
    <div class="cond-item yes">
      <div class="cond-icon yes">✓</div>
      <div class="cond-body">
        <div class="cond-title">Vous pouvez charger à domicile</div>
        <p class="cond-desc">C'est la condition la plus déterminante. Recharger chez soi la nuit coûte entre 2 et 4 euros pour 100 km selon le tarif d'abonnement électrique, contre 10 à 15 euros pour un véhicule essence équivalent. Sans recharge à domicile, vous dépendez des bornes publiques (tarif 3 à 5 fois plus élevé) ou des bornes rapides en route (coût proche du thermique). L'avantage économique se réduit drastiquement.</p>
        <div class="cond-src">Source : ADEME · Observatoire du véhicule professionnel</div>
      </div>
    </div>
    <div class="cond-item yes">
      <div class="cond-icon yes">✓</div>
      <div class="cond-body">
        <div class="cond-title">Vous parcourez plus de 15 000 km par an</div>
        <p class="cond-desc">En dessous de 15 000 km annuels avec recharge à domicile, le surcoût à l'achat d'un véhicule électrique neuf n'est généralement pas amorti sur cinq ans par les économies de carburant. Au-delà de 20 000 km/an, l'équation s'inverse clairement en faveur de l'électrique. Ce seuil varie selon le modèle, le prix d'achat, le tarif d'électricité et le prix de l'essence au moment du calcul.</p>
        <div class="cond-src">Source : UFC-Que Choisir · ADEME, coût total de possession 2025</div>
      </div>
    </div>
    <div class="cond-item yes">
      <div class="cond-icon yes">✓</div>
      <div class="cond-body">
        <div class="cond-title">Vos trajets réguliers ne dépassent pas 200 à 250 km d'une traite</div>
        <p class="cond-desc">L'autonomie réelle en conditions hivernales est de 20 à 30 % inférieure à l'autonomie annoncée en cycle WLTP. Un véhicule annoncé à 400 km fait entre 280 et 320 km en hiver sur autoroute. Si vous effectuez des longs trajets réguliers en dehors du réseau de bornes rapides, le temps de recharge devient une contrainte concrète à intégrer dans vos déplacements.</p>
        <div class="cond-src">Source : ICCT · tests indépendants ADAC, saison froide 2024-2025</div>
      </div>
    </div>
    <div class="cond-item no">
      <div class="cond-icon no">—</div>
      <div class="cond-body">
        <div class="cond-title">Votre territoire est bien couvert par les bornes rapides sur vos axes habituels</div>
        <p class="cond-desc">Le réseau IRVE public comptait environ 130 000 points de charge en France fin 2025. La couverture sur les grands axes est acceptable. En zone rurale très isolée, notamment dans le Massif central, la Creuse, l'Ariège ou certaines parties du Grand Est, les trajets de plus de 200 km peuvent imposer des temps d'arrêt que les conducteurs thermiques n'ont pas. La carte Chargemap ou l'application ABRP permettent de vérifier votre territoire spécifique.</p>
        <div class="cond-src">Source : Avere-France · données GIREVE, décembre 2025</div>
      </div>
    </div>
    <div class="cond-item yes">
      <div class="cond-icon yes">✓</div>
      <div class="cond-body">
        <div class="cond-title">Vous circulez régulièrement dans une ville ayant mis en place une Zone à Faibles Émissions</div>
        <p class="cond-desc">Paris, Lyon, Grenoble, Strasbourg, Montpellier et plusieurs autres agglomérations ont instauré des Zones à Faibles Émissions mobilité (ZFE-m) qui restreignent progressivement la circulation des véhicules les moins récents selon leur vignette Crit'Air. Un véhicule thermique Crit'Air 3 ou au-delà peut voir ses accès restreints à des horaires croissants d'ici 2025-2030 dans ces zones. Si votre travail ou vos déplacements réguliers se situent dans l'une de ces agglomérations, ce facteur réglementaire modifie l'équation dans la durée, indépendamment de l'usage ou du kilométrage.</p>
        <div class="cond-src">Source : ADEME · Ministère de la Transition écologique, liste des ZFE-m et calendriers de restriction</div>
      </div>
    </div>
  </div>

  <h2>Comparer le coût total de possession, pas le prix d'achat</h2>
  <p>
    Le prix affiché en concession n'est pas le bon point de comparaison. Ce qui compte, c'est le coût total de possession sur cinq ans : achat ou leasing, carburant ou électricité, assurance, entretien, et valeur résiduelle estimée au moment de la revente. L'ADEME publie des comparatifs par segment de véhicule mis à jour chaque année.
  </p>

  <div class="tco-table">
    <div class="tco-row tco-head">
      <div class="tco-cell">Profil d'usage</div>
      <div class="tco-cell">Thermique (5 ans)</div>
      <div class="tco-cell">Électrique (5 ans)</div>
    </div>
    <div class="tco-row">
      <div class="tco-cell neutral">10 000 km/an · recharge domicile</div>
      <div class="tco-cell">~32 000 €</div>
      <div class="tco-cell">~36 000 €</div>
    </div>
    <div class="tco-row">
      <div class="tco-cell neutral">20 000 km/an · recharge domicile</div>
      <div class="tco-cell">~42 000 €</div>
      <div class="tco-cell hi">~38 000 €</div>
    </div>
    <div class="tco-row">
      <div class="tco-cell neutral">20 000 km/an · sans recharge domicile</div>
      <div class="tco-cell">~42 000 €</div>
      <div class="tco-cell">~45 000 €</div>
    </div>
    <div class="tco-note">Estimations indicatives sur segment citadine / compacte, bonus écologique inclus au moment du calcul, tarif électricité 0,25 €/kWh, carburant 1,85 €/L. Source : ADEME 2025. Ces chiffres évoluent avec les prix du marché.</div>
  </div>

  <h2>Comment évaluer si cela a du sens pour vous</h2>

  <div class="steps">
    <div class="step">
      <div class="step-dot">1</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier si vous pouvez installer une borne ou une prise renforcée chez vous</div>
        <p class="step-desc">En maison individuelle, l'installation d'une prise renforcée (16A) ou d'une wallbox (32A) coûte entre 300 et 1 200 euros selon la configuration électrique. Les locataires peuvent demander l'installation d'une prise dans un espace dédié, mais restent dépendants de l'accord du bailleur. En copropriété, le droit à la prise (loi ELAN) autorise l'installation en place de stationnement privatif sans vote de l'assemblée générale, mais la procédure prend plusieurs mois.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">2</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Calculer votre kilométrage annuel réel et votre coût carburant actuel</div>
        <p class="step-desc">Relevez votre kilométrage sur les deux dernières années (carnet d'entretien ou historique des contrôles techniques). Multipliez-le par votre consommation moyenne et par le prix moyen du carburant sur la période. C'est le montant que vous économisez en carburant en passant à l'électrique avec recharge à domicile — à comparer avec le surcoût à l'achat et les économies d'entretien.</p>
        <a href="https://calculautoeco.ademe.fr" class="step-link" target="_blank" rel="noopener">calculautoeco.ademe.fr · Simulateur coût complet ADEME ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">3</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Identifier vos trois trajets les plus longs dans l'année</div>
        <p class="step-desc">Vacances, déplacements professionnels, visites familiales. Vérifiez sur Chargemap ou ABRP (A Better Route Planner) si ces trajets sont réalisables avec un véhicule électrique correspondant à votre budget, en tenant compte de l'autonomie hivernale réelle et du temps de recharge nécessaire. Un arrêt de 25 minutes en charge rapide tous les 200 à 250 km est un ordre de grandeur réaliste pour les modèles récents.</p>
        <a href="https://abetterrouteplanner.com" class="step-link" target="_blank" rel="noopener">abetterrouteplanner.com · Planificateur trajets EV ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">4</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Considérer le marché de l'occasion avant le neuf</div>
        <p class="step-desc">Le marché de l'occasion électrique s'est structuré à partir de 2023-2024. Des modèles avec 50 000 à 80 000 km sont disponibles entre 15 000 et 25 000 euros. L'état de santé de la batterie (State of Health, SoH) est le point critique : un SoH supérieur à 80 % est généralement acceptable. Certains constructeurs et revendeurs affichent ce chiffre, d'autres non. Il peut être mesuré par un outil de diagnostic OBD2 accessible pour moins de 30 euros. Pour les véhicules mis sur le marché depuis juillet 2024, le règlement européen sur les batteries (2023/1542) impose aux fabricants de garantir au minimum 70 % du SoH initial pendant 8 ans ou 160 000 kilomètres.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">5</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Comparer achat comptant, crédit et LOA selon votre kilométrage prévu</div>
        <p class="step-desc">La location avec option d'achat (LOA) permet d'accéder à un véhicule électrique neuf avec une mensualité inférieure à un crédit classique, parce qu'une partie de la valeur du véhicule (la valeur résiduelle) n'est pas financée. À la fin du contrat, vous rachetez le véhicule à ce prix ou vous le restituez. La LOA ne génère pas de capital si vous restituez, mais elle peut être pertinente si vous n'êtes pas certain de vouloir conserver ce modèle plusieurs années : la technologie des batteries et des logiciels embarqués évolue vite, et la valeur résiduelle des véhicules électriques reste difficile à estimer sur 4 à 5 ans. Comparez le coût total (mensualités + option de rachat) au coût d'un achat avec crédit classique sur la même durée avant de choisir.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">6</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier les aides disponibles au moment précis de votre achat</div>
        <p class="step-desc">Le bonus écologique, la prime à la conversion et les aides régionales évoluent chaque année, parfois en cours d'année. Les montants et les plafonds de revenus conditionnant leur accès changent fréquemment. Vérifiez les conditions en vigueur au moment précis de votre projet, pas celles qui circulaient six mois auparavant. Certaines aides régionales s'appliquent aussi aux véhicules d'occasion et à la LOA, ce que les comparateurs nationaux ne mentionnent pas toujours.</p>
        <a href="https://www.service-public.fr/particuliers/vosdroits/F36700" class="step-link" target="_blank" rel="noopener">service-public.fr · Bonus écologique et prime à la conversion ↗</a>
      </div>
    </div>
  </div>

  <h2>Selon votre situation</h2>

  <div class="profiles">
    <div class="profile-card favorable">
      <div class="profile-label">Fort rouleur en maison individuelle — cas le plus favorable</div>
      <p class="profile-body">Plus de 18 000 km/an, recharge à domicile possible, trajets majoritairement sur des axes couverts en bornes rapides : c'est le profil pour lequel le passage à l'électrique présente le meilleur rapport économique et pratique. Le retour sur investissement par rapport à un thermique équivalent est généralement atteint entre la troisième et la quatrième année.</p>
    </div>
    <div class="profile-card favorable">
      <div class="profile-label">Foyer avec deux voitures dont une peu utilisée</div>
      <p class="profile-body">Remplacer le véhicule le moins utilisé par un électrique d'occasion permet de tester l'usage sans dépendre uniquement de lui pour les longs trajets. C'est une entrée progressive qui réduit le risque d'une transition trop rapide. Le véhicule thermique reste disponible pour les trajets que l'électrique gère moins bien.</p>
    </div>
    <div class="profile-card defavorable">
      <div class="profile-label">Locataire en appartement sans stationnement privé</div>
      <p class="profile-body">Sans recharge à domicile, l'avantage économique de l'électrique dépend entièrement du tarif et de la disponibilité des bornes publiques dans votre quartier. Si les bornes de votre rue affichent des files d'attente régulières ou des tarifs élevés, le calcul économique ne tient plus. Le droit à la prise en copropriété est un levier, mais il suppose d'avoir un emplacement de stationnement privatif dans la résidence.</p>
    </div>
    <div class="profile-card defavorable">
      <div class="profile-label">Faible rouleur (moins de 10 000 km/an)</div>
      <p class="profile-body">En dessous de 10 000 km annuels, les économies de carburant ne compensent généralement pas le surcoût à l'achat d'un véhicule électrique neuf sur cinq ans. Un véhicule thermique récent peu énergivore reste souvent la solution la plus économique. La transition à l'électrique peut néanmoins avoir du sens si vous prévoyez une augmentation significative de votre kilométrage dans les prochaines années.</p>
    </div>
    <div class="profile-card defavorable">
      <div class="profile-label">Zone très isolée avec longs trajets réguliers hors axes principaux</div>
      <p class="profile-body">Si vos longs trajets habituels traversent des zones peu couvertes par les bornes rapides, la contrainte logistique est réelle. Vérifiez votre réseau spécifique avant de décider. Dans certains territoires ruraux, l'autonomie réduite en hiver combinée à la couverture incomplète du réseau peut rendre l'électrique moins adapté à votre usage qu'un hybride rechargeable, qui garde un moteur thermique en secours.</p>
    </div>
  </div>

  <h2>Les questions à poser</h2>

  <div class="questions">
    <div class="question-item">
      <span class="question-to">À un concessionnaire ou à un comparateur indépendant</span>
      "Quel est le coût total de possession calculé sur cinq ans pour ce modèle, comparé à son équivalent thermique le plus proche, avec mon kilométrage annuel et en supposant une recharge à domicile ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre bailleur ou au syndic de votre copropriété</span>
      "Quelle est la procédure pour exercer mon droit à la prise dans mon emplacement de stationnement, et quel est le délai habituel dans cette copropriété ?"
    </div>
    <div class="question-item">
      <span class="question-to">Au vendeur d'un véhicule d'occasion</span>
      "Quel est l'état de santé de la batterie exprimé en pourcentage, et pouvez-vous me fournir un rapport de diagnostic ou me laisser procéder à une vérification avant achat ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre employeur ou service RH</span>
      "Y a-t-il des bornes de recharge au travail, et l'entreprise propose-t-elle un Forfait Mobilités Durables qui couvre la recharge d'un véhicule électrique personnel ?"
    </div>
  </div>

  <h2>Ce que l'électrique ne résout pas</h2>
  <p>
    Le passage à l'électrique réduit la sensibilité au prix du carburant fossile et les émissions de gaz à effet de serre à l'usage — c'est réel et documenté. Il ne réduit pas la dépendance structurelle à la voiture. Si votre trajet pivot vers votre lieu de travail n'a pas d'alternative crédible, avoir un véhicule électrique ne change pas votre fragilité face à une panne, à une perte de permis ou au vieillissement. La question de la motorisation et la question de la dépendance sont deux questions distinctes. Les traiter ensemble brouille les deux.
  </p>
  <p>
    Sur le plan du bilan carbone cycle de vie, l'ADEME estime que la fabrication d'un véhicule électrique génère davantage d'émissions qu'un thermique équivalent, en raison principalement de la batterie. Ce déficit initial est compensé à l'usage : pour un véhicule assemblé en Europe chargé avec le mix électrique français (faiblement carboné grâce au nucléaire), l'ADEME situe le point de bascule entre 2 et 3 ans d'usage typique. Au-delà, chaque kilomètre parcouru réduit l'écart d'empreinte carbone globale par rapport à un thermique équivalent. Ce calcul change selon le pays de fabrication, le mix électrique utilisé pour la charge et la durée de vie du véhicule.
  </p>

  <h2>Ce que vous n'avez pas à faire</h2>

  <div class="not-todo">
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Décider sur la base du bonus seul, sans calculer le coût total de possession</div>
        <p class="not-todo-reason">Le bonus écologique réduit le prix d'achat mais ne change pas la structure des coûts sur cinq ans. Un véhicule moins cher à l'achat mais plus coûteux en charge publique ou en assurance peut coûter plus cher sur la durée qu'un modèle plus onéreux à l'achat mais moins coûteux à l'usage.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Acheter neuf si l'occasion avec bon état de batterie correspond à votre usage</div>
        <p class="not-todo-reason">Les véhicules électriques de deux à quatre ans avec 50 000 à 80 000 km présentent généralement un état de batterie satisfaisant pour dix ans d'usage supplémentaire. Acheter neuf pour "avoir la garantie constructeur" coûte souvent 8 000 à 12 000 euros de plus pour une tranquillité d'esprit qui peut s'obtenir autrement par une vérification indépendante de la batterie.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Planifier vos longs trajets avec l'autonomie WLTP comme référence</div>
        <p class="not-todo-reason">L'autonomie annoncée est mesurée dans des conditions idéales. En hiver, sur autoroute à 130 km/h, avec le chauffage allumé, retranchez 25 à 35 %. Utiliser l'autonomie WLTP comme base de planification conduit à se retrouver en dessous de la réserve critique à mi-trajet.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Traiter l'hybride simple (non rechargeable) comme une solution intermédiaire vers l'électrique</div>
        <p class="not-todo-reason">L'hybride non rechargeable (HEV) consomme moins qu'un thermique classique sur certains cycles urbains, mais ne se recharge pas sur secteur et ne réduit pas votre consommation de carburant fossile de façon structurelle. C'est une amélioration marginale d'un véhicule thermique, pas une étape vers l'électrique. L'hybride rechargeable (PHEV) est une catégorie différente, avec ses propres conditions d'usage pertinent.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Confondre la LOA avec un abonnement sans engagement financier</div>
        <p class="not-todo-reason">La LOA est un crédit. Si vous ne rachetez pas le véhicule à l'issue du contrat, vous n'avez pas constitué de capital et vous avez payé des intérêts. Les mensualités LOA paraissent basses parce qu'une partie de la valeur du véhicule (la valeur résiduelle) est reportée en option finale. Si vous pensez restituer le véhicule sans acheter, vérifiez que le coût total des mensualités reste inférieur à la valeur locative équivalente d'un véhicule d'occasion. La LOA est pertinente dans certaines configurations, pas universellement.</p>
      </div>
    </div>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li><span class="src-tag">ADEME</span><span>Calculateur de coût total de possession et comparatifs électrique/thermique par segment, <a href="https://calculautoeco.ademe.fr" target="_blank" rel="noopener">calculautoeco.ademe.fr</a>, mis à jour 2025.</span></li>
      <li><span class="src-tag">UFC</span><span>Étude comparative coût de revient total des véhicules électriques et thermiques selon les usages, <a href="https://www.quechoisir.org" target="_blank" rel="noopener">quechoisir.org</a>, 2025.</span></li>
      <li><span class="src-tag">ICCT</span><span>International Council on Clean Transportation, écarts autonomie réelle vs WLTP selon les conditions climatiques et d'usage, <a href="https://theicct.org" target="_blank" rel="noopener">theicct.org</a>.</span></li>
      <li><span class="src-tag">Avere-France</span><span>Observatoire du déploiement des bornes de recharge IRVE en France, données trimestrielles, <a href="https://www.avere-france.org" target="_blank" rel="noopener">avere-france.org</a>.</span></li>
      <li><span class="src-tag">GIREVE</span><span>Données nationales sur les points de charge opérationnels et leur répartition géographique, <a href="https://www.gireve.com" target="_blank" rel="noopener">gireve.com</a>.</span></li>
      <li><span class="src-tag">Legifrance</span><span>Loi ELAN et décret sur le droit à la prise en copropriété et en location, conditions d'installation d'une borne de recharge en place privative.</span></li>
      <li><span class="src-tag">Service-public</span><span>Bonus écologique et prime à la conversion : conditions en vigueur, plafonds de revenus, montants, <a href="https://www.service-public.fr/particuliers/vosdroits/F36700" target="_blank" rel="noopener">service-public.fr</a>.</span></li>
      <li><span class="src-tag">ADEME</span><span>Analyse du cycle de vie des véhicules électriques et thermiques, comparaison d'empreinte carbone selon le mix électrique et le kilométrage cumulé, <a href="https://librairie.ademe.fr" target="_blank" rel="noopener">librairie.ademe.fr</a>, édition 2024.</span></li>
      <li><span class="src-tag">UE 2023/1542</span><span>Règlement européen sur les batteries, article 10 : durabilité minimale de la batterie de traction garantie à 70 % du SoH initial sur 8 ans ou 160 000 km pour les véhicules mis sur le marché depuis juillet 2024.</span></li>
      <li><span class="src-tag">ADEME · ZFE</span><span>Zones à Faibles Émissions mobilité : liste des agglomérations, calendriers de restriction par vignette Crit'Air et carte interactive, <a href="https://www.ademe.fr/zfe" target="_blank" rel="noopener">ademe.fr</a>.</span></li>
    </ul>
  </section>

  <a href="/savoir/dependance-auto" class="back-link">← Pourquoi certains territoires rendent la voiture presque obligatoire</a>
`;

export default async function AgirVoitureElectriquePage() {
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
          <ThemeToggle />
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
