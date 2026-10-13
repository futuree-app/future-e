import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Pourquoi certains territoires rendent la voiture presque obligatoire · futur•e',
  description:
    "Dans les pôles urbains, 58 % des actifs vont travailler en voiture ; ailleurs, près de neuf sur dix. Pourquoi certains territoires rendent la voiture difficile à remplacer, et quoi vérifier avant de choisir un logement.",
};

const css = `
  :root {
  --accent: #E8823A;
    --accent-soft: rgba(232, 130, 58,0.12);
    --accent-border: rgba(232, 130, 58,0.28);
}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.32;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:500px;height:500px;background:radial-gradient(circle,#E8823A 0%,transparent 70%);top:-130px;left:-100px;}
  .orb-2{width:440px;height:440px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-110px;right:-90px;animation-delay:-5s;}
  .orb-3{width:360px;height:360px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:55%;left:62%;opacity:0.14;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(18px,-28px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .brand-dot{color:var(--accent-ink);font-style:normal;}
  .nav-crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--fg-3);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--fg-1);}
  .nav-crumb .sep{margin:0 10px;color:var(--fg-4);}

  .article{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:64px 28px 120px;}

  .article-meta{display:flex;align-items:center;gap:16px;margin-bottom:28px;flex-wrap:wrap;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}
  .read-info{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}

  h1{font-family:var(--font-serif);font-weight:var(--weight-title);font-size:var(--text-display);line-height:1.08;letter-spacing:-0.02em;margin:0 0 28px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .dates{display:flex;align-items:center;gap:20px;margin:0 0 40px;padding:16px 20px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:6px;width:fit-content;max-width:100%;}
  .date-item{display:flex;flex-direction:column;gap:4px;}
  .date-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);}
  .date-value{font-family:var(--font-sans);font-size:14px;color:var(--fg-1);font-weight:500;}
  .date-value-muted{color:var(--fg-4);font-weight:400;}
  .date-sep{width:1px;height:28px;background:var(--border-hi);}

  .lede{font-family:var(--font-serif);font-size:clamp(20px,2.2vw,24px);line-height:1.5;color:var(--fg-1);font-weight:var(--weight-title);margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border-1);}

  h2{font-family:var(--font-serif);font-weight:var(--weight-title);font-size:var(--text-title);line-height:1.2;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}

  .keystat{margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden;}
  .keystat::after{content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .keystat-number{font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--accent);font-weight:var(--weight-title);letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .keystat-label{font-size:15px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1;}
  .keystat-src{display:block;margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.05em;}


  .map-figure{margin:44px -20px;padding:32px 28px 28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;position:relative;overflow:hidden;}
  .map-figure::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 65% 35%,rgba(232, 130, 58,0.06) 0%,transparent 55%);pointer-events:none;}
  .france-map{display:block;width:100%;max-width:480px;height:auto;margin:0 auto 20px;position:relative;z-index:1;}
  .map-figure figcaption{font-size:13px;color:var(--fg-3);line-height:1.55;text-align:center;padding:18px 0 0;border-top:1px solid var(--border-1);position:relative;z-index:1;}
  .map-figure figcaption a{color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s;}
  .map-figure figcaption a:hover{color:var(--accent);border-color:var(--accent);}

  .checklist{margin:8px 0 28px;padding:0;list-style:none;display:grid;gap:14px;}
  .checklist li{font-size:17px;line-height:1.65;color:var(--fg-2);padding-left:18px;position:relative;}
  .checklist li::before{content:"";position:absolute;left:0;top:12px;width:6px;height:6px;border-radius:50%;background:var(--accent);}
  .checklist strong{color:var(--fg-1);font-weight:600;}
  .actions-card{margin:48px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;}
  .actions-card-head{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:20px;font-style:italic;transition:padding 0.25s ease,color 0.25s ease;}
  .actions-list li:last-child a{border-bottom:none;}
  .actions-list li a:hover{padding-left:8px;color:var(--accent);}
  .actions-list .arrow{font-family:var(--font-sans);font-style:normal;font-size:14px;color:var(--fg-4);transition:transform 0.25s ease,color 0.25s ease;}
  .actions-list li a:hover .arrow{transform:translateX(4px);color:var(--accent);}

  .sources{margin-top:72px;padding-top:40px;border-top:1px solid var(--border-1);}
  .sources h2{font-size:20px;font-family:var(--font-mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:24px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:14px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:baseline;font-size:14px;color:var(--fg-3);line-height:1.55;}
  .sources .src-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);padding:3px 8px;border:1px solid var(--border-1);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .page-footer{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:40px 28px 80px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--fg-3);text-decoration:none;}
  .page-footer a:hover{color:var(--accent);}

  @media(max-width:768px){
    .article{padding:40px 22px 80px;}
    .nav-inner{padding:14px 22px;}
    h2{margin:44px 0 16px;}
    h2::before{display:none;}
    .lede{font-size:19px;padding-bottom:36px;margin-bottom:36px;}
    p{font-size:16px;}
    .keystat{padding:22px 20px;}
    .keystat-number{font-size:42px;}
    .checklist li{font-size:16px;}
    .actions-card{padding:22px;}
    .actions-list li a{font-size:17px;padding:14px 0;}
    .map-figure{margin:36px -8px;padding:20px 14px 18px;}
    .dates{padding:14px 16px;gap:16px;}
    .nav-crumb .step-home,.nav-crumb .step-home+.sep{display:none;}
  }
`;

// RENVOIS VERS LES ÉTUDES LOCALES (13/10/2026). Les articles de La Rochelle et de Niort ne sont pas publiés :
// leurs seules adresses sont les prévisualisations /dev/article-*, qui renvoient 404 en production. La section
// n'apparaît donc qu'en développement. À la publication des études : remplacer les deux href par leurs URL
// publiques et retirer la condition (liste dans docs/etudes/2026-10-13-larochelle-mobilite/redaction/README.md).
const etudesLocales = process.env.NODE_ENV === 'production' ? '' : `
  <h2>Deux villes regardées de près</h2>
  <p>
    Les chiffres nationaux ne disent rien d'un quartier en particulier. Nos études de La&nbsp;Rochelle et de Niort descendent au niveau des secteurs de la ville et du lieu de travail&nbsp;: la place de la voiture y change nettement d'un quartier à l'autre, et selon la commune où l'on travaille. Ce sont deux villes, pas une règle générale. Leurs chiffres viennent du recensement de 2022 et incluent les actifs qui ne se déplacent pas&nbsp;: ils ne se comparent pas directement à ceux de l'INSEE cités plus haut.
  </p>
  <div class="actions-card">
    <div class="actions-card-head">Études locales · prévisualisation, liens à activer à la publication</div>
    <ul class="actions-list">
      <li><a href="/dev/article-larochelle">Vivre à La&nbsp;Rochelle en utilisant moins la voiture<span class="arrow">→</span></a></li>
      <li><a href="/dev/article-niort">À Niort, la voiture ne tient pas la même place d'un secteur à l'autre<span class="arrow">→</span></a></li>
    </ul>
  </div>
`;

const articleBody = `
  <div class="article-meta">
    <span class="tag">Mobilité</span>
    <span class="read-info">Lecture 6 min</span>
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
      <span class="date-value">13 octobre 2026</span>
    </div>
  </div>

  <p class="lede">
    Dans les pôles urbains, 58&nbsp;% des actifs qui se déplacent pour travailler prennent la voiture. Dans les couronnes périurbaines et les communes éloignées des villes, c'est près de neuf sur dix. L'écart ne tient pas à un goût pour l'automobile&nbsp;: il tient aux distances, et à ce qui existe pour les parcourir. En choisissant un logement, on choisit aussi, souvent sans le voir, la place que la voiture prendra dans ses journées.
  </p>

  <h2>Utiliser la voiture, ou en dépendre</h2>
  <p>
    On parle de dépendance quand, pour des trajets qui comptent (le travail, l'école, les courses, les soins), il n'existe pas d'autre solution raisonnable&nbsp;: trop loin à pied, trop long ou trop dangereux à vélo, pas de bus à la bonne heure. Ce n'est pas la même chose qu'un usage fréquent. On peut prendre la voiture chaque jour par commodité alors qu'un bus passe en bas de chez soi&nbsp;; on peut aussi ne s'en servir que deux fois par semaine, pour des trajets qu'aucune autre solution ne permet.
  </p>
  <p>
    Pour un ménage, la différence est concrète. Ce qui coûte, ce n'est pas d'avoir une voiture, c'est de ne pas pouvoir s'en passer&nbsp;: quand elle tombe en panne, quand le carburant augmente, quand l'un des adultes n'a pas le permis.
  </p>

  <div class="keystat">
    <span class="keystat-number">74&nbsp;%</span>
    <span class="keystat-label">des actifs en emploi qui se déplacent pour aller travailler y vont en voiture, en France.</span>
    <span class="keystat-src">Source : INSEE, recensement 2017 (Insee Première n° 1835, janvier 2021)</span>
  </div>

  <h2>Ce que montrent les chiffres nationaux</h2>
  <p>
    L'INSEE a mesuré l'usage de la voiture pour aller travailler selon le lieu de résidence. Dans les pôles urbains, la ville-centre et les communes denses qui l'entourent, 58&nbsp;% des actifs qui se déplacent y vont en voiture. Dans les couronnes, ces communes dont une part importante des actifs travaille dans le pôle, et dans les communes situées hors de l'influence des villes, la part atteint 89 à 90&nbsp;%.
  </p>
  <p>
    La distance n'explique pas tout. Pour des trajets de 5&nbsp;km au plus, 60&nbsp;% des actifs prennent encore la voiture&nbsp;; à moins d'un kilomètre, c'est environ la moitié. Les transports collectifs, eux, restent peu utilisés hors de la région parisienne&nbsp;: 8&nbsp;% des actifs, 15&nbsp;% dans les aires de plus de 700&nbsp;000 habitants, moins de 3&nbsp;% dans celles de moins de 50&nbsp;000.
  </p>
  <p>
    Ces chiffres décrivent des pratiques en 2017. Ils ne disent pas ce que chacun pourrait faire autrement, ni pourquoi il ne le fait pas.
  </p>

  <h2>Pourquoi certains territoires la rendent difficile à remplacer</h2>
  <p>
    Trois choses se combinent, plus ou moins selon les endroits. La distance d'abord&nbsp;: quand le logement, l'emploi, l'école et les commerces sont éloignés les uns des autres, peu de trajets se font à pied ou à vélo. La fréquence ensuite&nbsp;: un bus par heure, ou qui ne circule pas tôt le matin, ne remplace pas une voiture pour aller travailler, même s'il figure sur la carte. L'enchaînement, enfin&nbsp;: déposer un enfant, aller travailler, faire une course au retour. Une solution qui marche pour chaque trajet pris à part peut ne pas marcher pour la journée entière.
  </p>
  <p>
    Ces contraintes ne s'arrêtent pas aux limites des communes. Dans une même ville, deux quartiers peuvent offrir des situations très différentes&nbsp;; et selon la commune où l'on travaille, le même logement peut convenir ou non.
  </p>

  <h2>Ce que cela change pour un ménage</h2>
  <p>
    Le premier effet est budgétaire. Le carburant n'est qu'une partie du coût d'une voiture, à côté de l'achat, de l'assurance et de l'entretien, mais c'est celle qui varie le plus vite. Un calcul simple donne l'ordre de grandeur&nbsp;: une voiture qui consomme 6 litres aux 100&nbsp;km et roule 15&nbsp;000&nbsp;km par an utilise environ 900 litres de carburant. Avec 50 centimes de plus par litre, cela fait environ 450&nbsp;€ de plus par an.
  </p>
  <p>
    Une même hausse ne pèse pas pareil partout. Un ménage qui roule peu, ou qui peut faire une partie de ses trajets autrement, en limite l'effet. Un ménage qui roule beaucoup, sans autre solution, la subit en entier.
  </p>
  <p>
    Le second effet est la fragilité. La panne de la seule voiture du foyer, la perte du permis, l'âge qui rend la conduite difficile&nbsp;: là où rien ne la remplace, chacun de ces événements peut compliquer l'accès au travail ou aux soins.
  </p>
${etudesLocales}
  <h2>Avant de choisir un logement</h2>
  <p>
    Ce qui suit n'est pas tiré des statistiques&nbsp;: ce sont des questions à poser pour vos propres trajets. Les moyennes d'un quartier ne disent pas ce qui sera possible pour vous. Un secteur où la plupart des actifs prennent la voiture peut très bien convenir à quelqu'un qui travaille à dix minutes à pied, et l'inverse.
  </p>
  <ul class="checklist">
    <li><strong>Vos destinations habituelles.</strong> Le travail de chaque adulte, l'école, les courses, le médecin, les activités&nbsp;: situez-les depuis l'adresse visitée.</li>
    <li><strong>Vos horaires.</strong> Un bus qui passe à 8&nbsp;h ne sert à rien si vous commencez à 6&nbsp;h. Regardez les horaires aux heures où vous partirez et rentrerez, y compris le dernier retour.</li>
    <li><strong>Les trajets réellement praticables.</strong> Une distance à vol d'oiseau peut cacher un détour, une route sans trottoir ou un carrefour difficile. Faites le chemin à pied ou à vélo au moins une fois.</li>
    <li><strong>Le stationnement.</strong> Une place est-elle comprise dans l'annonce&nbsp;? Sinon, passez dans la rue le soir. Si le ménage garde une voiture, la question compte autant que la surface.</li>
    <li><strong>Le jour où la voiture manque.</strong> Une panne, une seule voiture pour deux adultes&nbsp;: comment se feraient les trajets indispensables&nbsp;?</li>
  </ul>

  <div class="actions-card">
    <div class="actions-card-head">Pour aller plus loin</div>
    <ul class="actions-list">
      <li><a href="/agir/dependance-auto">Évaluer votre dépendance à la voiture et ses alternatives réelles<span class="arrow">→</span></a></li>
      <li><a href="/agir/voiture-electrique">Passer à l'électrique : ce qui a du sens selon votre territoire<span class="arrow">→</span></a></li>
    </ul>
  </div>

  <section class="sources">
    <h2>Source</h2>
    <ul>
      <li>
        <span class="src-tag">INSEE</span>
        <span>« La voiture reste majoritaire pour les déplacements domicile-travail, même pour de courtes distances », Insee Première n° 1835, janvier 2021, <a href="https://www.insee.fr/fr/statistiques/5013868" target="_blank" rel="noopener">insee.fr</a>. Recensement de la population 2017&nbsp;; actifs en emploi de 15 ans ou plus qui se déplacent à moins de 150&nbsp;km pour aller travailler. Pôles, couronnes et communes hors attraction des villes&nbsp;: zonage en aires d'attraction des villes 2020.</span>
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

      <Navbar />

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
