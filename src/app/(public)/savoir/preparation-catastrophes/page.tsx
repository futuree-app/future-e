import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Préparation aux catastrophes climatiques : le paradoxe français · futur•e",
  description:
    "84 % des Français savent que leur territoire devra s'adapter. Pourtant seulement 26 % se sentent préparés à une canicule. Ce que les chiffres de la Croix-Rouge disent sur l'écart entre conscience et action.",
};

const css = `
  :root {
    --accent: #fb923c;
    --accent-soft: rgba(251,146,60,0.12);
    --accent-border: rgba(251,146,60,0.28);
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.28;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:520px;height:520px;background:radial-gradient(circle,#fb923c 0%,transparent 70%);top:-140px;left:-120px;}
  .orb-2{width:460px;height:460px;background:radial-gradient(circle,#f87171 0%,transparent 70%);bottom:-120px;right:-100px;animation-delay:-5s;}
  .orb-3{width:340px;height:340px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);top:45%;left:65%;opacity:0.14;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(20px,-30px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

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
  .read-info{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}

  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(40px,6vw,60px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .lede{font-family:var(--font-serif);font-size:clamp(19px,2.2vw,23px);line-height:1.55;color:var(--fg-1);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border-1);}

  .assoc-link{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;font-size:14px;color:var(--fg-3);text-decoration:none;margin-bottom:56px;transition:border-color 0.2s,color 0.2s;}
  .assoc-link:hover{border-color:var(--accent-border);color:var(--accent);}
  .assoc-link-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-right:4px;}

  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,3vw,32px);line-height:1.22;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}

  .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:32px 0 48px;}
  .stat-card{padding:24px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;position:relative;overflow:hidden;}
  .stat-card::after{content:"";position:absolute;top:0;right:0;width:120px;height:120px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .stat-number{font-family:var(--font-serif);font-size:48px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .stat-label{font-size:14px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1;}
  .stat-src{display:block;margin-top:8px;font-family:var(--font-mono);font-size:10px;color:var(--fg-4);letter-spacing:0.05em;}

  .keystat{margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden;}
  .keystat::after{content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .keystat-number{font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .keystat-label{font-size:15px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1;}
  .keystat-src{display:block;margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.05em;}

  .bag-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:28px 0 40px;}
  .bag-item{display:flex;align-items:flex-start;gap:12px;padding:16px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;}
  .bag-icon{font-size:20px;flex-shrink:0;line-height:1;margin-top:1px;}
  .bag-label{font-size:14px;font-weight:600;color:var(--fg-1);margin:0 0 3px;}
  .bag-desc{font-size:13px;color:var(--fg-3);line-height:1.5;margin:0;}

  .leviers{display:flex;flex-direction:column;gap:2px;margin:28px 0 40px;}
  .levier{display:grid;grid-template-columns:28px 1fr;gap:16px;align-items:start;padding:18px 0;border-bottom:1px solid var(--border-1);}
  .levier:last-child{border-bottom:none;}
  .levier-icon{width:22px;height:22px;border-radius:50%;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-family:var(--font-mono);flex-shrink:0;margin-top:2px;}
  .levier-title{font-size:15px;font-weight:600;color:var(--fg-1);margin:0 0 5px;}
  .levier-desc{font-size:15px;color:var(--fg-3);line-height:1.65;margin:0 0 6px;}
  .levier-src{font-family:var(--font-mono);font-size:10px;color:var(--fg-4);letter-spacing:0.06em;}

  .callout{margin:40px 0;padding:24px 28px;background:rgba(251,146,60,0.06);border:1px solid var(--accent-border);border-radius:6px;}
  .callout-head{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;}
  .callout p{margin:0;font-size:15px;color:var(--fg-3);line-height:1.65;}

  .actions-card{margin:48px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;}
  .actions-card-head{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:19px;font-style:italic;transition:padding 0.25s,color 0.25s;}
  .actions-list li:last-child a{border-bottom:none;}
  .actions-list li a:hover{padding-left:8px;color:var(--accent);}
  .arrow{font-family:var(--font-sans);font-style:normal;font-size:14px;color:var(--fg-4);transition:transform 0.25s,color 0.25s;}
  .actions-list li a:hover .arrow{transform:translateX(4px);color:var(--accent);}

  .sources{margin-top:72px;padding-top:40px;border-top:1px solid var(--border-1);}
  .sources h2{font-size:13px;font-family:var(--font-mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:24px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:14px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:baseline;font-size:14px;color:var(--fg-3);line-height:1.55;}
  .src-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);padding:3px 8px;border:1px solid var(--border-1);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .nav-footer{position:relative;top:auto;margin-top:24px;border-top:1px solid var(--border-1);border-bottom:none;}

  @media(max-width:768px){
    .article{padding:40px 22px 80px;}
    .nav-inner{padding:14px 22px;}
    h1{font-size:36px;}
    h2{font-size:24px;margin:44px 0 16px;}
    h2::before{display:none;}
    .lede{font-size:18px;}
    p,.levier-desc,.bag-desc{font-size:15px;}
    .stats-grid{grid-template-columns:1fr;}
    .bag-grid{grid-template-columns:1fr;}
    .stat-number{font-size:38px;}
    .keystat{padding:22px 20px;}
    .keystat-number{font-size:42px;}
  }
`;

export default function PreparationCatastrophesPage() {
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
            <Link href="/" className="step-home">Savoir</Link>
            <span className="sep">/</span>
            Préparation
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article className="article">

        <div className="article-meta">
          <span className="tag">Résilience</span>
          <span className="read-info">Analyse · Lecture 6 min · Mai 2026</span>
        </div>

        <h1>Sommes-nous prêts à la prochaine catastrophe climatique ?<br /><em>Le paradoxe français.</em></h1>

        <p className="lede">
          84 % des Français savent que leur territoire devra s&apos;adapter au changement climatique. Pourtant seulement 26 % se sentent préparés à une vague de chaleur. Cet écart — documenté par la Croix-Rouge française et le Crédoc — est le problème central de la résilience hexagonale. Comprendre pourquoi il existe, c&apos;est déjà commencer à le réduire.
        </p>

        <Link href="/agir/canicule" className="assoc-link">
          <span className="assoc-link-label">Guide pratique associé</span>
          Se préparer à la canicule : ce qui protège vraiment
          <span style={{ color: 'var(--fg-4)' }}>→</span>
        </Link>

        <h2>Les chiffres de l&apos;impréparation</h2>

        <p>
          Depuis 2022, la Croix-Rouge française publie un rapport annuel sur la résilience de la société française, réalisé avec le Crédoc. L&apos;édition 2024 dresse un constat clair : la conscience du risque progresse, la préparation effective, non.
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">26 %</span>
            <span className="stat-label">des Français se sentent bien ou très bien préparés face aux vagues de chaleur.</span>
            <span className="stat-src">OpinionWay / Croix-Rouge française, janv. 2024</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">84 %</span>
            <span className="stat-label">pensent que leur territoire devra prendre des mesures importantes pour s&apos;adapter au climat.</span>
            <span className="stat-src">Crédoc pour la Croix-Rouge française, 2024</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">44 %</span>
            <span className="stat-label">estiment avoir déjà subi les conséquences du changement climatique sur leur lieu de vie.</span>
            <span className="stat-src">Crédoc pour la Croix-Rouge française, 2024</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">20–50 %</span>
            <span className="stat-label">des personnes exposées à une catastrophe naturelle risquent de développer des troubles psychologiques.</span>
            <span className="stat-src">Littérature scientifique, synthèse Croix-Rouge 2024</span>
          </div>
        </div>

        <p>
          La conclusion du rapport est directe : <strong>le sentiment d&apos;exposition augmente plus vite que la capacité à agir.</strong> Ce décalage n&apos;est pas une fatalité, c&apos;est un problème de méthode. Les personnes qui ont préparé une réponse concrète avant une crise s&apos;en sortent mieux, et en sont moins anxieuses.
        </p>

        <div className="callout">
          <div className="callout-head">Données terrain · Pas-de-Calais, novembre 2023</div>
          <p>
            Plus de 300 000 habitants touchés, 10 000 habitations sinistrées en trois semaines d&apos;inondations. La Croix-Rouge a mobilisé 300 bénévoles venant de 42 départements et ouvert 5 centres d&apos;hébergement. L&apos;année 2015 avait à elle seule concentré autant d&apos;inondations qu&apos;entre 1982 et 1995 : la tendance est structurelle, pas ponctuelle.
          </p>
        </div>

        <h2>Des risques qui s&apos;accélèrent, pas qui arrivent</h2>

        <p>
          Ce qui change avec le réchauffement climatique, ce n&apos;est pas seulement l&apos;intensité des événements : c&apos;est leur fréquence. Avant 1989, une vague de chaleur caniculaire survenait en France en moyenne une fois tous les cinq ans. Depuis l&apos;an 2000, elle est devenue annuelle. En 2023, quatre épisodes de canicule successifs entre juillet et septembre ont touché 68 des 96 départements hexagonaux, soit 73 % de la population. <strong>5 000 décès supplémentaires</strong> ont été attribués à la chaleur sur l&apos;ensemble de l&apos;été selon Santé publique France.
        </p>

        <p>
          En mars 2024, l&apos;Agence européenne de l&apos;environnement a publié son évaluation des risques climatiques pour l&apos;Europe — le premier document de ce type à cette échelle. Son constat : <em>« La chaleur extrême, la sécheresse, les incendies de forêt et les inondations que nous avons connus ces dernières années en Europe vont s&apos;aggraver, y compris dans les scénarios optimistes du réchauffement climatique, et affecteront les conditions de vie sur tout le continent. »</em> Ce n&apos;est pas un scénario catastrophiste : c&apos;est la trajectoire basse.
        </p>

        <div className="stats-grid" style={{ marginTop: '32px', marginBottom: '40px' }}>
          <div className="stat-card">
            <span className="stat-number">50 M</span>
            <span className="stat-label">Français exposés à au moins une journée de dépassement des seuils d&apos;alerte canicule en 2022. Dans les années 1990, ce chiffre oscillait entre 20 et 30 millions.</span>
            <span className="stat-src">Santé publique France / Météo-France</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">44 M</span>
            <span className="stat-label">Français présentent une vulnérabilité face aux inondations et mouvements de terrain — les deux tiers de la population hexagonale.</span>
            <span className="stat-src">BRGM / Géorisques</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">72 %</span>
            <span className="stat-label">du territoire hexagonal est concerné par le risque de mouvement des sols argileux, qui peut fissurer les fondations lors des alternances sécheresse-réhydratation.</span>
            <span className="stat-src">BRGM, 2021</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">6 mois</span>
            <span className="stat-label">La durée probable de la saison des incendies à horizon proche, contre trois mois actuellement en France hexagonale. 60 000 ha brûlés en 2022, dont 30 000 en Gironde.</span>
            <span className="stat-src">Météo-France / EFFIS</span>
          </div>
        </div>

        <p>
          L&apos;inondation reste le risque naturel numéro un en France : elle représente 73 % des événements climatiques dommageables enregistrés entre 1900 et 2017, et mobilise les deux postes d&apos;indemnisation les plus élevés avec le retrait des sols argileux. Or les zones inondables continuent de se construire, et l&apos;imperméabilisation des sols urbains aggrave le ruissellement. Le risque n&apos;est pas en train d&apos;arriver : il est déjà là, et sa fréquence augmente.
        </p>

        <h2>Le sac d&apos;urgence : la base négligée</h2>

        <p>
          La Croix-Rouge recommande à chaque foyer de préparer un sac d&apos;urgence avant qu&apos;une crise survienne. Le principe : disposer en 5 minutes de tout ce dont on a besoin pour tenir 72 heures sans eau courante, électricité ni accès aux commerces. Ce délai correspond à la durée de la phase aiguë lors de la plupart des catastrophes localisées.
        </p>

        <div className="bag-grid">
          <div className="bag-item">
            <span className="bag-icon">💧</span>
            <div>
              <p className="bag-label">Eau</p>
              <p className="bag-desc">3 litres par personne et par jour, en bouteilles fermées. Minimum 9 litres pour 72 h.</p>
            </div>
          </div>
          <div className="bag-item">
            <span className="bag-icon">💊</span>
            <div>
              <p className="bag-label">Médicaments</p>
              <p className="bag-desc">Ordonnances et traitements en cours pour 3 jours minimum. Ne pas attendre la rupture.</p>
            </div>
          </div>
          <div className="bag-item">
            <span className="bag-icon">📄</span>
            <div>
              <p className="bag-label">Documents</p>
              <p className="bag-desc">Copies de la pièce d&apos;identité, carte Vitale, contrat d&apos;assurance, coordonnées d&apos;urgence.</p>
            </div>
          </div>
          <div className="bag-item">
            <span className="bag-icon">🔦</span>
            <div>
              <p className="bag-label">Lampe et radio</p>
              <p className="bag-desc">Une lampe de poche avec piles de rechange. Une radio à piles pour recevoir les consignes officielles sans internet.</p>
            </div>
          </div>
          <div className="bag-item">
            <span className="bag-icon">🔋</span>
            <div>
              <p className="bag-label">Batterie externe</p>
              <p className="bag-desc">Chargée, pour maintenir l&apos;accès aux alertes et aux contacts d&apos;urgence si les prises sont hors service.</p>
            </div>
          </div>
          <div className="bag-item">
            <span className="bag-icon">🥫</span>
            <div>
              <p className="bag-label">Alimentation non périssable</p>
              <p className="bag-desc">3 jours de nourriture ne nécessitant pas de cuisson. À renouveler une fois par an.</p>
            </div>
          </div>
        </div>

        <div className="keystat">
          <span className="keystat-number">72 h</span>
          <span className="keystat-label">La durée de la phase aiguë lors de la plupart des catastrophes localisées. C&apos;est le délai cible de la préparation individuelle recommandée par la Croix-Rouge : tenir sans aide extérieure le temps que les secours s&apos;organisent.</span>
          <span className="keystat-src">Source : Croix-Rouge française, Rapport résilience 2024</span>
        </div>

        <h2>La préparation collective change réellement l&apos;issue</h2>

        <p>
          L&apos;analyse des catastrophes passées montre que les dommages humains diminuent quand deux conditions sont réunies : les personnes vulnérables sont connues et suivies, et les habitants savent comment réagir avant l&apos;alerte. Ces deux conditions dépendent de la préparation collective, pas de la réponse improvisée en urgence.
        </p>

        <div className="leviers">
          <div className="levier">
            <div className="levier-icon">01</div>
            <div>
              <p className="levier-title">Connaître les personnes vulnérables dans son entourage immédiat</p>
              <p className="levier-desc">Lors de la canicule de 2003, neuf décès sur dix ont eu lieu à domicile, parmi des personnes âgées vivant seules et sans contact régulier. La mesure la plus efficace documentée n&apos;est pas technique : c&apos;est d&apos;identifier les voisins âgés ou isolés et d&apos;établir un contact quotidien lors des alertes orange et rouge. Ce contact peut être un appel téléphonique de deux minutes.</p>
              <span className="levier-src">Inserm / Santé publique France, analyse canicule 2003</span>
            </div>
          </div>
          <div className="levier">
            <div className="levier-icon">02</div>
            <div>
              <p className="levier-title">Inscrire une personne fragile au registre communal canicule</p>
              <p className="levier-desc">Depuis 2004, les communes peuvent tenir un registre volontaire des personnes âgées ou en situation de handicap pour faciliter le contact lors des alertes. Ce registre est confidentiel, géré par le Centre communal d&apos;action sociale. Votre mairie peut vous indiquer comment y inscrire un proche. Dans les communes où ce registre est à jour, les agents et bénévoles savent qui contacter en priorité lors d&apos;une vigilance rouge.</p>
              <span className="levier-src">Plan national canicule, DGOS</span>
            </div>
          </div>
          <div className="levier">
            <div className="levier-icon">03</div>
            <div>
              <p className="levier-title">Connaître les espaces rafraîchis de proximité avant un épisode</p>
              <p className="levier-desc">Lors des vigilances orange et rouge, les mairies ont l&apos;obligation d&apos;ouvrir ou de signaler des espaces rafraîchisseurs. En dehors des alertes, bibliothèques et grandes surfaces sont utilisables. En 2023, à Lyon, la Croix-Rouge a géré un gymnase climatisé qui était le seul lieu de ce type disponible pour toute la ville. Connaître les deux alternatives les plus proches prend une minute, et réduit le délai de décision pendant l&apos;alerte.</p>
              <span className="levier-src">Croix-Rouge française, retour de terrain Lyon 2023</span>
            </div>
          </div>
        </div>

        <h2>L&apos;impact psychologique : la conséquence invisible</h2>

        <p>
          L&apos;OMS recense une fourchette de 20 à 50 % de troubles psychologiques parmi les personnes directement exposées à une catastrophe naturelle. Ce chiffre couvre un spectre large : stress post-traumatique, anxiété persistante, dépression, troubles du sommeil, augmentation des comportements agressifs et des suicides pendant les vagues de chaleur prolongées.
        </p>

        <p>
          L&apos;étude de référence en France concerne les victimes de la tempête Xynthia, en Vendée et Charente-Maritime en février 2010 : 11 morts, 13 000 sinistrés, un milliard d&apos;euros de dégâts. Les suivis longitudinaux conduits plusieurs années après l&apos;événement documentent des niveaux significatifs de dépression et de syndrome de stress post-traumatique, aggravés par le sentiment d&apos;insécurité lié à l&apos;attente de la prochaine crise. <strong>L&apos;anxiété ne disparaît pas après l&apos;événement : elle s&apos;installe. </strong> Des personnes inondées une fois décrivent surveiller compulsivement le niveau de l&apos;eau des années plus tard à chaque forte pluie.
        </p>

        <div className="keystat">
          <span className="keystat-number">10 M</span>
          <span className="keystat-label">Le nombre estimé d&apos;Européens ayant signalé des troubles mentaux à la suite d&apos;inondations entre 1998 et 2018. Ce chiffre ne concerne que les inondations, pas l&apos;ensemble des catastrophes climatiques.</span>
          <span className="keystat-src">Source : OMS, Mental health and climate change, 2022</span>
        </div>

        <p>
          Les jeunes constituent la population la plus touchée par l&apos;écoanxiété. Dans les pays riches, entre <strong>40 et 80 % des enfants et jeunes adultes </strong> souffrent d&apos;incertitude, d&apos;anxiété ou de fortes réactions émotionnelles face au changement climatique — sentiments de désespoir, impuissance, deuil anticipé. Ce n&apos;est pas une pathologie : c&apos;est une réponse rationnelle à un risque réel. Mais elle peut être modulée par l&apos;action concrète.
        </p>

        <p>
          Le contre-intuitif que documentent les études sur la résilience : <strong>passer à l&apos;acte réduit l&apos;écoanxiété</strong>, pas l&apos;inverse. Préparer un sac d&apos;urgence, identifier les espaces rafraîchis proches de chez soi, appeler un voisin âgé pendant une alerte — ces gestes modestes créent un sentiment de maîtrise mesurable. L&apos;inaction face à un risque connu, elle, amplifie le sentiment d&apos;impuissance.
        </p>

        <div className="callout">
          <div className="callout-head">Ce que les outre-mer enseignent à l&apos;Hexagone</div>
          <p>
            Les territoires ultramarins — Antilles, La Réunion, Mayotte — sont confrontés à des catastrophes à répétition : cyclones, sécheresses sévères, submersions. Ils sont structurellement mieux préparés que la France hexagonale. La Croix-Rouge les cite comme modèle pour ce que les territoires métropolitains devront devenir. À Mayotte, durant la sécheresse de 2023, la population a spontanément mis en place des systèmes de réserve d&apos;eau et de partage que l&apos;Hexagone n&apos;a jamais eu à développer. La préparation s&apos;y enseigne à l&apos;école, s&apos;intègre à l&apos;urbanisme. Ce n&apos;est pas une contrainte : c&apos;est une compétence construite par l&apos;expérience répétée.
          </p>
        </div>

        <div className="actions-card">
          <div className="actions-card-head">Passer à l&apos;action</div>
          <ul className="actions-list">
            <li>
              <Link href="/agir/canicule">
                Se préparer à la canicule : les gestes qui protègent vraiment <span className="arrow">→</span>
              </Link>
            </li>
            <li>
              <Link href="/savoir/chaleur-sante-mentale">
                La chaleur et la santé mentale <span className="arrow">→</span>
              </Link>
            </li>
            <li>
              <Link href="/">
                Voir l&apos;exposition climatique de votre commune <span className="arrow">→</span>
              </Link>
            </li>
          </ul>
        </div>

        <section className="sources">
          <h2>Sources</h2>
          <ul>
            <li>
              <span className="src-tag">Croix-Rouge</span>
              <span>Croix-Rouge française / Crédoc, <em>Événements climatiques extrêmes : sommes-nous prêts à l&apos;inévitable ?</em> Rapport 2024 sur la résilience de la société française. Sondage OpinionWay pour la Croix-Rouge française, janvier 2024. Données sur la perception du risque et le sentiment de préparation. <a href="https://www.croix-rouge.fr" target="_blank" rel="noopener">croix-rouge.fr</a>.</span>
            </li>
            <li>
              <span className="src-tag">SPF</span>
              <span>Santé publique France, <em>Bilan de la surveillance sanitaire des épisodes de chaleur en France, été 2022</em>. Données de surmortalité, profils des victimes (75 ans et plus, domicile), recours aux soins d&apos;urgence. Également : bilan canicule 2003 et bilan 2019. <a href="https://www.santepubliquefrance.fr" target="_blank" rel="noopener">santepubliquefrance.fr</a>.</span>
            </li>
            <li>
              <span className="src-tag">Inserm</span>
              <span>Denis Hémon, Eric Jougla (Inserm), <em>Surmortalité liée à la canicule d&apos;août 2003 — Rapport d&apos;étape</em>, septembre 2003. Estimation de 15 000 décès, 9 sur 10 à domicile, sur-représentation des personnes âgées vivant seules. <a href="https://www.inserm.fr" target="_blank" rel="noopener">inserm.fr</a>.</span>
            </li>
            <li>
              <span className="src-tag">Crédoc</span>
              <span>Centre de Recherche pour l&apos;Étude et l&apos;Observation des Conditions de Vie, indicateurs de résilience de la société française 1980–2023. Suivi annuel de la perception du changement climatique, de l&apos;exposition vécue et des comportements d&apos;adaptation.</span>
            </li>
            <li>
              <span className="src-tag">AEE</span>
              <span>Agence européenne de l&apos;environnement, <em>European Climate Risk Assessment (EUCRA)</em>, mars 2024. Alerte sur l&apos;aggravation de la chaleur extrême, des sécheresses, des incendies et des inondations dans tous les scénarios de réchauffement. <a href="https://www.eea.europa.eu" target="_blank" rel="noopener">eea.europa.eu</a>.</span>
            </li>
            <li>
              <span className="src-tag">GIEC</span>
              <span>IPCC, <em>Sixth Assessment Report (AR6)</em>, 2021–2022. Confirmation que le réchauffement d&apos;origine humaine est un fait établi, projections de hausse de fréquence et d&apos;intensité des événements extrêmes, et que le seuil de 1,5 °C sera atteint dès le début des années 2030 quels que soient les efforts d&apos;atténuation immédiats. <a href="https://www.ipcc.ch" target="_blank" rel="noopener">ipcc.ch</a>.</span>
            </li>
            <li>
              <span className="src-tag">BRGM</span>
              <span>Bureau de Recherches Géologiques et Minières / Géorisques, <em>Évaluation de l&apos;exposition de la population française aux risques naturels</em>. Données sur les deux tiers de la population (44 millions d&apos;habitants) présentant une vulnérabilité face aux inondations et mouvements de terrain. <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener">georisques.gouv.fr</a>.</span>
            </li>
            <li>
              <span className="src-tag">Plan Canicule</span>
              <span>Ministère chargé de la Santé / DGOS, <em>Plan national canicule</em>, version 2021 consolidée. Définition des seuils départementaux de vigilance, obligations des communes (espaces rafraîchis, registre canicule), et protocoles de réponse graduée orange / rouge / pourpre. <a href="https://solidarites-sante.gouv.fr" target="_blank" rel="noopener">solidarites-sante.gouv.fr</a>.</span>
            </li>
            <li>
              <span className="src-tag">OMS / Psy</span>
              <span>Organisation mondiale de la santé, <em>Mental health and climate change</em>, 2022. Synthèse des études sur le lien entre catastrophes climatiques et troubles psychologiques : stress post-traumatique, anxiété persistante et dépression. Taux de 20 à 50 % dans les populations exposées directement. <a href="https://www.who.int" target="_blank" rel="noopener">who.int</a>.</span>
            </li>
            <li>
              <span className="src-tag">Xynthia</span>
              <span>Maltais D. et al., études longitudinales sur les victimes de la tempête Xynthia (2010) en Vendée et Charente-Maritime. Risques importants de dépression, d&apos;anxiété et de syndrome de stress post-traumatique documentés plusieurs années après l&apos;événement, aggravés par le sentiment d&apos;insécurité lié à la répétition des crises.</span>
            </li>
            <li>
              <span className="src-tag">Météo-France</span>
              <span>Météo-France, bilans climatiques annuels 2022 et 2023. Année 2022 la plus chaude jamais enregistrée en France depuis le XXe siècle ; année 2023 la seconde. 68 départements touchés par au moins un jour de canicule à l&apos;été 2023. <a href="https://meteofrance.fr" target="_blank" rel="noopener">meteofrance.fr</a>.</span>
            </li>
          </ul>
        </section>

      </article>

      <footer className="nav nav-footer">
        <div className="nav-inner">
          <Link href="/" className="brand">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/" className="step-home">Savoir</Link>
            <span className="sep">/</span>
            Préparation
          </div>
          <ThemeToggle />
        </div>
      </footer>
    </>
  );
}
