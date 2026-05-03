import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';
import { PaywallGate } from '@/components/PaywallGate';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Gérer le risque inondation : évaluer son exposition et protéger son logement · futur•e",
  description:
    "Comment localiser précisément votre exposition au risque inondation, préparer votre logement et constituer un dossier d'assurance : PPRN, géorisques, catnat, clapets anti-retour.",
};

const css = `
  :root {
  --accent: #60a5fa;
    --accent-soft: rgba(96,165,250,0.12);
    --accent-border: rgba(96,165,250,0.28);
    --green-border: rgba(74,222,128,0.22);
}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.3;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:480px;height:480px;background:radial-gradient(circle,#60a5fa 0%,transparent 70%);top:-120px;left:-100px;}
  .orb-2{width:400px;height:400px;background:radial-gradient(circle,#4ade80 0%,transparent 70%);bottom:-100px;right:-80px;opacity:0.18;animation-delay:-6s;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.12) translate(15px,-22px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .brand-dot{color:var(--accent);font-style:normal;}
  .nav-crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--fg-3);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--fg-1);}
  .nav-crumb .sep{margin:0 10px;color:var(--fg-4);}

  .article{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:64px 28px 120px;}

  .article-meta{display:flex;align-items:center;gap:16px;margin-bottom:28px;flex-wrap:wrap;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}
  .tag-actionnable{background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.25);color:var(--green);}
  .tag-actionnable::before{background:var(--green);box-shadow:0 0 10px var(--green);}
  .read-info{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}

  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(36px,5vw,56px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 28px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .dates{display:flex;align-items:center;gap:20px;margin:0 0 40px;padding:16px 20px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:6px;width:fit-content;max-width:100%;}
  .date-item{display:flex;flex-direction:column;gap:4px;}
  .date-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);}
  .date-value{font-family:var(--font-sans);font-size:14px;color:var(--fg-1);font-weight:500;}
  .date-value-muted{color:var(--fg-4);font-weight:400;}
  .date-sep{width:1px;height:28px;background:var(--border-hi);}

  .context-link{display:flex;align-items:center;gap:14px;padding:18px 20px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;margin-bottom:40px;text-decoration:none;transition:border-color 0.2s,background 0.2s;}
  .context-link:hover{border-color:var(--accent-border);background:var(--accent-soft);}
  .context-link-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-bottom:4px;}
  .context-link-title{font-family:var(--font-serif);font-size:18px;font-style:italic;color:var(--fg-1);}
  .context-link-arrow{margin-left:auto;font-size:14px;color:var(--fg-4);}

  .lede{font-family:var(--font-serif);font-size:clamp(19px,2vw,23px);line-height:1.55;color:var(--fg-1);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border-1);}

  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,2.8vw,32px);line-height:1.2;letter-spacing:-0.01em;margin:52px 0 18px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:17px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}

  .levers{display:flex;flex-direction:column;gap:12px;margin:28px 0 8px;}
  .lever-item{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start;padding:20px 22px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;transition:border-color 0.2s;}
  .lever-item:hover{border-color:var(--border-hi);}
  .lever-num{font-family:var(--font-mono);font-size:13px;font-weight:500;color:var(--accent);padding-top:2px;}
  .lever-title{font-family:var(--font-sans);font-size:16px;font-weight:500;color:#fff;margin-bottom:6px;}
  .lever-desc{font-size:15px;color:var(--fg-3);line-height:1.6;margin:0;}
  .lever-src{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);margin-top:8px;letter-spacing:0.04em;}

  .steps{display:flex;flex-direction:column;gap:0;margin:24px 0;}
  .step{display:grid;grid-template-columns:28px 1fr;gap:18px;align-items:start;position:relative;padding-bottom:24px;}
  .step:last-child{padding-bottom:0;}
  .step-line{position:absolute;left:13px;top:28px;bottom:0;width:1px;background:var(--border-1);}
  .step:last-child .step-line{display:none;}
  .step-dot{width:28px;height:28px;border-radius:50%;background:var(--bg-elev);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--accent);flex-shrink:0;position:relative;z-index:1;}
  .step-content{padding-top:4px;}
  .step-title{font-size:16px;font-weight:500;color:#fff;margin-bottom:6px;}
  .step-desc{font-size:15px;color:var(--fg-3);line-height:1.6;margin:0;}
  .step-link{display:inline-block;margin-top:8px;font-family:var(--font-mono);font-size:11px;color:var(--fg-3);letter-spacing:0.05em;border-bottom:1px solid var(--border-1);text-decoration:none;transition:color 0.2s,border-color 0.2s;}
  .step-link:hover{color:var(--accent);border-color:var(--accent);}

  .profiles{display:flex;flex-direction:column;gap:16px;margin:28px 0;}
  .profile-card{padding:22px 24px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;}
  .profile-card.alert{border-left:2px solid var(--accent);}
  .profile-label{font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-bottom:10px;}
  .profile-card.alert .profile-label{color:var(--accent);}
  .profile-body{font-size:16px;color:var(--fg-1);line-height:1.65;margin:0;}

  .questions{display:flex;flex-direction:column;gap:12px;margin:24px 0;}
  .question-item{padding:18px 22px;background:var(--bg-elev);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;font-size:16px;color:var(--fg-1);line-height:1.6;font-style:italic;font-family:var(--font-serif);}
  .question-to{display:block;font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-bottom:8px;font-style:normal;}

  .not-todo{display:flex;flex-direction:column;gap:12px;margin:24px 0;}
  .not-todo-item{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;padding:18px 22px;background:rgba(255,255,255,0.02);border:1px solid var(--border-1);border-radius:6px;}
  .not-todo-cross{font-family:var(--font-mono);font-size:14px;color:var(--fg-4);padding-top:1px;}
  .not-todo-title{font-size:15px;font-weight:500;color:var(--fg-3);margin-bottom:4px;}
  .not-todo-reason{font-size:14px;color:var(--fg-4);line-height:1.55;margin:0;}

  .back-link{display:flex;align-items:center;gap:10px;margin-top:48px;font-family:var(--font-serif);font-size:18px;font-style:italic;color:var(--fg-3);text-decoration:none;transition:color 0.2s;}
  .back-link:hover{color:var(--accent);}

  .sources{margin-top:64px;padding-top:36px;border-top:1px solid var(--border-1);}
  .sources h2{font-size:18px;font-family:var(--font-mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:20px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:12px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:baseline;font-size:14px;color:var(--fg-3);line-height:1.55;}
  .src-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);padding:3px 8px;border:1px solid var(--border-1);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .page-footer{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:36px 28px 72px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--fg-3);text-decoration:none;}
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
    <span class="tag">Logement</span>
    <span class="tag tag-actionnable">Guide pratique</span>
    <span class="read-info">Lecture 7 min</span>
  </div>

  <h1>Gérer le risque inondation :<br/><em>évaluer son exposition et protéger son logement</em></h1>

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

  <a href="/savoir/submersion" class="context-link">
    <div>
      <div class="context-link-label">Page thématique associée</div>
      <div class="context-link-title">Submersion, crues et risques côtiers en France</div>
    </div>
    <span class="context-link-arrow">→</span>
  </a>

  <p class="lede">
    En France, 17,1 millions de personnes habitent dans une zone exposée au risque inondation, selon le Cerema et la Direction générale de la prévention des risques. L'inondation est le premier risque naturel en termes de communes concernées et de montant des dommages assurés (France Assureurs). Il ne se résume pas aux grandes crues fluviales médiatisées : le ruissellement pluvial urbain et les crues torrentielles rapides sont les formes les plus fréquentes et les moins anticipées. Cette page aide à localiser votre exposition réelle et à identifier les mesures qui réduisent les dommages et les délais d'indemnisation.
  </p>
`;

const fullHtml = `
  <h2>Ce que les outils disponibles permettent de savoir</h2>
  <p>
    Le Plan de Prévention des Risques Naturels inondation (PPRNi) est le document de référence pour connaître votre exposition au niveau de votre adresse. Il est élaboré par les préfectures, approuvé par arrêté préfectoral, et disponible en libre accès sur le portail <strong>géorisques.gouv.fr</strong>. Il classe les zones en trois catégories : zone rouge (aléa fort, inconstructible), zone bleue (aléa modéré, constructible sous prescriptions), zone blanche (aléa faible ou non classé). Toutes les communes ne disposent pas encore d'un PPRNi approuvé : l'absence de PPRN ne signifie pas l'absence de risque.
  </p>
  <p>
    L'<strong>Information des Acquéreurs et Locataires (IAL)</strong>, encadrée par le Code de l'environnement, oblige les vendeurs et les bailleurs à remettre un état des risques lors de toute transaction immobilière dans les communes concernées. Ce document doit indiquer si le bien est en zone PPRNi prescrit ou approuvé. Il ne remplace pas la consultation directe de la carte de zonage : l'IAL résume, la carte localise précisément.
  </p>

  <h2>Les leviers concrets au niveau du logement</h2>
  <p>
    Une partie significative des dommages lors d'une inondation est évitable par des mesures préventives. Trois leviers ont un rapport efficacité/coût démontré.
  </p>

  <div class="levers">
    <div class="lever-item">
      <div class="lever-num">01</div>
      <div class="lever-body">
        <div class="lever-title">Connaître précisément votre cote de plancher bas par rapport à la cote de référence de crue</div>
        <p class="lever-desc">La hauteur de votre plancher bas par rapport au niveau de référence de crue (TN + hauteur d'eau réglementaire définie dans le PPRNi) détermine si votre logement sera inondé lors de l'événement de référence. Cette cote est indiquée dans le PPRNi ou peut être calculée avec un géomètre. Les logements dont le plancher bas se situe en dessous de la cote de référence sont vulnérables ; ceux qui se situent au-dessus bénéficient d'une marge. Connaître cet écart précisément permet de prioriser les travaux de protection.</p>
        <div class="lever-src">Source : Cerema, Guide de diagnostic de la vulnérabilité des bâtiments au risque inondation · DGPR</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">02</div>
      <div class="lever-body">
        <div class="lever-title">Réduire les entrées d'eau : batardeaux, clapets anti-retour, mise en hauteur des équipements</div>
        <p class="lever-desc">Trois mesures techniques réduisent les dommages lors d'une montée des eaux. Les batardeaux (barrières amovibles posées devant les ouvertures) peuvent être installés en quelques minutes lors d'une alerte Vigicrues. Le clapet anti-retour sur les arrivées d'eau (notamment les canalisations d'eaux usées) prévient le refoulement lors de crues : il coûte entre 150 et 400 euros selon le diamètre et peut être posé par un plombier. La mise en hauteur des équipements électriques (tableau, prises, chaudière) au-dessus de la cote de référence est la mesure qui réduit le plus le coût des dommages lors d'un sinistre.</p>
        <div class="lever-src">Source : Cerema, référentiel de réduction de la vulnérabilité · Cahier des prescriptions PPRN type</div>
      </div>
    </div>
    <div class="lever-item">
      <div class="lever-num">03</div>
      <div class="lever-body">
        <div class="lever-title">Constituer un inventaire photographique de votre mobilier et de vos équipements</div>
        <p class="lever-desc">Le régime d'indemnisation catastrophe naturelle (catnat) en France couvre les dommages liés aux inondations reconnues par arrêté interministériel. La procédure d'indemnisation repose sur un état des pertes établi après sinistre. Un inventaire photographique daté de vos biens (mobilier, appareils électroménagers, équipements) réalisé avant un sinistre permet d'étayer les déclarations et de réduire les litiges avec l'assureur. Stocker cet inventaire dans un espace numérique non physiquement présent dans le logement (cloud, boîte mail externe) garantit son accessibilité après un sinistre.</p>
        <div class="lever-src">Source : France Assureurs · Mission Risques naturels (MRN)</div>
      </div>
    </div>
  </div>

  <h2>Comment évaluer votre exposition concrètement</h2>

  <div class="steps">
    <div class="step">
      <div class="step-dot">1</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier sur géorisques.gouv.fr si votre commune est couverte par un PPRNi</div>
        <p class="step-desc">Le portail Géorisques permet d'entrer une adresse précise et d'accéder aux risques répertoriés pour cette localisation. Pour le risque inondation, il indique si un PPRNi est prescrit, approuvé ou non encore élaboré pour votre commune. Il permet également d'accéder à la carte de zonage et au règlement du PPRNi, qui précise les prescriptions applicables à votre parcelle selon sa zone.</p>
        <a href="https://www.georisques.gouv.fr" class="step-link" target="_blank" rel="noopener">georisques.gouv.fr · Carte des risques par adresse ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">2</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Localiser votre adresse sur la carte de zonage du PPRNi et lire votre zone d'aléa</div>
        <p class="step-desc">Si un PPRNi est approuvé pour votre commune, téléchargez la carte de zonage et le règlement associé. Identifiez la zone dans laquelle se situe votre parcelle : rouge (aléa fort), bleu foncé (aléa moyen), bleu clair (aléa faible). Pour chaque zone, le règlement définit les prescriptions applicables aux constructions existantes et aux nouvelles constructions. Ces prescriptions peuvent inclure la cote de plancher minimale, les matériaux autorisés en sous-sol, et les aménagements imposés en cas de travaux significatifs.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">3</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier si votre cours d'eau est surveillé par Vigicrues</div>
        <p class="step-desc">Le réseau Vigicrues du SCHAPI (Service central d'hydrométéorologie et d'appui à la prévision des crues) surveille en temps réel les niveaux des principaux cours d'eau français et émet des bulletins d'alerte par tronçon. Tous les cours d'eau ne sont pas couverts, notamment les petits cours d'eau sujets aux crues rapides. Sur vigicrues.gouv.fr, entrez le nom du cours d'eau proche de votre logement pour savoir s'il est surveillé. Si ce n'est pas le cas, votre source d'alerte principale sera la préfecture et les messages de vigilance météorologique de Météo-France.</p>
        <a href="https://www.vigicrues.gouv.fr" class="step-link" target="_blank" rel="noopener">vigicrues.gouv.fr · Suivi des niveaux en temps réel ↗</a>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">4</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Vérifier vos garanties d'assurance et le délai de déclaration catnat</div>
        <p class="step-desc">Le régime catnat en France fonctionne sur reconnaissance par arrêté interministériel publié au Journal officiel. La reconnaissance peut intervenir plusieurs semaines après l'événement. Dès la publication, vous disposez de dix jours pour déclarer le sinistre à votre assureur. Vérifiez dans votre contrat : la franchise légale catnat (380 euros en 2026 pour les particuliers, modulable si la commune n'est pas dotée d'un PPRN approuvé), les exclusions éventuelles, et les conditions de mise en jeu. Certains contrats multirisques habitation incluent aussi une garantie "inondation directe" déclenchable sans reconnaissance catnat.</p>
      </div>
    </div>
    <div class="step">
      <div class="step-dot">5</div>
      <div class="step-line"></div>
      <div class="step-content">
        <div class="step-title">Préparer un kit d'urgence et identifier votre itinéraire d'évacuation</div>
        <p class="step-desc">Le plan communal de sauvegarde (PCS), disponible en mairie dans les communes qui en sont dotées, indique les zones d'évacuation et les points de rassemblement prévus. En l'absence de PCS, identifiez vous-même l'étage de repli dans votre logement (si possible) et l'itinéraire pédestre vers le point haut le plus proche. Pour une évacuation en véhicule, évitez les routes proches des cours d'eau : un courant de 30 centimètres peut rendre un véhicule incontrôlable, et de 60 centimètres peut l'emporter.</p>
      </div>
    </div>
  </div>

  <h2>Selon votre situation</h2>

  <div class="profiles">
    <div class="profile-card alert">
      <div class="profile-label">Exposition forte — logement en zone rouge PPRNi ou en dessous de la cote de crue</div>
      <p class="profile-body">Si votre logement est classé en zone rouge d'un PPRNi approuvé, votre exposition à l'aléa fort est documentée officiellement. Les travaux de réduction de la vulnérabilité (mise en hauteur des équipements, batardeaux, clapet anti-retour) sont souvent éligibles à des subventions du Fonds Barnier (FPRNM), versé par votre assureur sur votre demande dans certaines conditions. Votre mairie et votre préfecture peuvent vous indiquer les dispositifs d'aide à la réduction de la vulnérabilité en vigueur dans votre département.</p>
    </div>
    <div class="profile-card alert">
      <div class="profile-label">Exposition aux crues rapides — cours d'eau non surveillé par Vigicrues</div>
      <p class="profile-body">Les crues torrentielles et les ruissellements intenses peuvent survenir en moins de deux heures après des précipitations intenses, sans alerte préalable sur les petits cours d'eau. Si votre logement est proche d'un ruisseau non surveillé ou en fond de vallon, la vigilance météorologique de Météo-France (pluie-inondation, orage) est votre principal signal d'alerte. Configurer les notifications de l'application Météo-France pour votre localisation précise est une mesure immédiate sans coût.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Acquéreur envisageant un achat en zone inondable</div>
      <p class="profile-body">L'état des risques remis lors d'une transaction immobilière doit mentionner les risques connus. Il ne remplace pas la consultation du PPRNi. Si la commune est couverte par un PPRNi approuvé, vérifiez la zone exacte de la parcelle et les prescriptions applicables aux travaux futurs. En zone rouge, les extensions et surélévations sont souvent très limitées. Ces contraintes affectent la valeur de revente à long terme, une dimension rarement discutée lors des transactions.</p>
    </div>
    <div class="profile-card">
      <div class="profile-label">Locataire en zone inondable</div>
      <p class="profile-body">En tant que locataire, vous n'avez pas la main sur les travaux de réduction de la vulnérabilité du logement. Votre marge d'action porte sur la préparation personnelle : inventaire des biens, kit d'urgence, connaissance des itinéraires d'évacuation. Votre assurance habitation (multirisques locataire) doit inclure la garantie catnat, elle est obligatoire légalement. Vérifiez que votre contrat couvre bien les dommages aux biens mobiliers en cas d'inondation et renseignez-vous sur les délais de déclaration post-sinistre.</p>
    </div>
  </div>

  <h2>Les questions à poser</h2>

  <div class="questions">
    <div class="question-item">
      <span class="question-to">À votre mairie ou à la préfecture</span>
      "Mon adresse est-elle dans le périmètre d'un PPRNi approuvé ou prescrit, et dans quelle zone d'aléa se situe ma parcelle ? Des aides du Fonds Barnier sont-elles disponibles pour des travaux de réduction de la vulnérabilité dans cette commune ?"
    </div>
    <div class="question-item">
      <span class="question-to">À votre assureur</span>
      "Ma franchise catnat est-elle majorée parce que ma commune ne dispose pas d'un PPRNi approuvé ? Quelle est la procédure de déclaration et quel est le délai après publication de l'arrêté interministériel de reconnaissance ?"
    </div>
    <div class="question-item">
      <span class="question-to">À un professionnel du bâtiment, avant des travaux</span>
      "Les prescriptions du PPRNi applicables à ma parcelle imposent-elles une cote de plancher minimale, et quelles contraintes s'appliquent à un projet d'extension ou de rénovation de sous-sol ?"
    </div>
    <div class="question-item">
      <span class="question-to">Avant un achat immobilier en zone inondable</span>
      "Quelle est la cote du plancher bas de ce bien par rapport à la cote de référence de crue définie dans le PPRNi, et quelles prescriptions s'appliqueraient à des travaux de rénovation ou d'extension ?"
    </div>
  </div>

  <h2>Ce que vous n'avez pas à faire</h2>

  <div class="not-todo">
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Se fier à "ça ne s'est jamais inondé ici" sans vérifier le zonage officiel</div>
        <p class="not-todo-reason">L'absence d'inondation historique dans la mémoire locale est un indicateur insuffisant. Les crues de référence des PPRNi sont calculées sur un retour statistique de 100 ans : elles peuvent ne pas avoir été vécues par les habitants actuels. Des zones considérées comme sûres depuis des générations ont été inondées lors de certains épisodes récents (Val-de-Grace, Var 2010, Aude 2018). La carte géorisques donne la situation réglementaire officielle, pas la mémoire collective locale.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Descendre dans un sous-sol ou un parking souterrain lors d'une montée des eaux</div>
        <p class="not-todo-reason">Les espaces en contrebas sont les premiers et les plus rapidement envahis lors d'une crue. La vitesse de remplissage d'un sous-sol peut rendre une issue impossible en quelques minutes. En cas d'alerte inondation, la consigne est de monter, pas de descendre, même pour récupérer un véhicule. Le sinistre automobile est couvrable par l'assurance ; une noyade ne l'est pas.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Prendre sa voiture pour s'éloigner lors d'une crue rapide en cours</div>
        <p class="not-todo-reason">Un véhicule ordinaire commence à être déstabilisé à partir de 30 centimètres d'eau en mouvement et peut être emporté à partir de 60 centimètres. Lors de crues torrentielles ou de ruissellements rapides, le niveau peut monter de plusieurs dizaines de centimètres en quelques minutes. Si l'inondation a déjà commencé et que l'accès routier n'est pas clairement dégagé, l'évacuation à pied vers un point haut est plus sûre qu'une évacuation en voiture.</p>
      </div>
    </div>
    <div class="not-todo-item">
      <div class="not-todo-cross">×</div>
      <div class="not-todo-body">
        <div class="not-todo-title">Attendre la reconnaissance catnat pour déclarer le sinistre à votre assureur</div>
        <p class="not-todo-reason">La déclaration de sinistre à votre assureur doit être faite dans les cinq jours ouvrés suivant le sinistre, indépendamment de toute reconnaissance catnat. La reconnaissance officielle vient ensuite, parfois plusieurs semaines plus tard, et déclenche la garantie catnat. Déclarer tardivement peut entraîner un refus de prise en charge. Ne confondez pas le délai de déclaration à l'assureur (5 jours ouvrés après sinistre) et le délai pour exercer la garantie catnat (10 jours après publication de l'arrêté au Journal officiel).</p>
      </div>
    </div>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li><span class="src-tag">Géorisques</span><span>Portail national des risques naturels et technologiques, cartographie des PPRNi par adresse, règlements téléchargeables. <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener">georisques.gouv.fr</a>.</span></li>
      <li><span class="src-tag">Cerema</span><span>Guide de diagnostic de la vulnérabilité des bâtiments au risque inondation, référentiel national des mesures de réduction de la vulnérabilité, <a href="https://www.cerema.fr" target="_blank" rel="noopener">cerema.fr</a>.</span></li>
      <li><span class="src-tag">DGPR</span><span>Direction générale de la prévention des risques, données sur les 17,1 millions d'habitants en zone inondable en France et méthodologie d'élaboration des PPRNi, Ministère de la Transition écologique.</span></li>
      <li><span class="src-tag">Vigicrues</span><span>SCHAPI, réseau national de surveillance des cours d'eau, bulletins d'alerte en temps réel, couverture géographique des tronçons surveillés. <a href="https://www.vigicrues.gouv.fr" target="_blank" rel="noopener">vigicrues.gouv.fr</a>.</span></li>
      <li><span class="src-tag">France Assureurs</span><span>Régime catnat : fonctionnement, délais, franchises légales, procédures de déclaration et statistiques des sinistres inondation en France. <a href="https://www.franceassureurs.fr" target="_blank" rel="noopener">franceassureurs.fr</a>.</span></li>
      <li><span class="src-tag">MRN</span><span>Mission Risques naturels (groupement des assureurs), données sur la sinistralité inondation et les outils de diagnostic de la vulnérabilité pour les particuliers. <a href="https://www.mrn.asso.fr" target="_blank" rel="noopener">mrn.asso.fr</a>.</span></li>
      <li><span class="src-tag">Fonds Barnier</span><span>Fonds de prévention des risques naturels majeurs (FPRNM), conditions d'éligibilité aux subventions pour travaux de réduction de la vulnérabilité en zone PPRNi. Renseignements auprès de votre assureur ou préfecture.</span></li>
    </ul>
  </section>

  <a href="/savoir/submersion" class="back-link">← Submersion, crues et risques côtiers en France</a>
`;

export default async function AgirInondationPage() {
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
            <Link href="/savoir/submersion">Savoir</Link>
            <span className="sep">/</span>
            Logement
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
          accent="#60a5fa"
        />
      </article>

      <footer className="page-footer">
        <div>futur•e · Agir / Logement</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
